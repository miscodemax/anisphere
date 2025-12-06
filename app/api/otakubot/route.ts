// app/api/otakubot/route.ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase";

function extractYear(str?: string | null) {
  if (!str) return null;
  const y = parseInt(str.split("-")[0]);
  return isNaN(y) ? null : y;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({
        reply: "Dis-moi ce que tu veux regarder 😍🎌",
        matches: [],
      });
    }

    const supabase = createClient();

    // 1) Rewriting embedding-friendly
    const rewriting = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: `
Réécris ce message pour une recherche vectorielle d'anime :
"${message}"

Règles :
- 300 à 900 caractères
- Un paragraphe unique
- Ton immersif et analytique
- Décris ambiance, émotions, thèmes, style visuel, rythme narratif
- PAS de liste, PAS de JSON
Commence directement.
      `,
      max_output_tokens: 300,
    });

    const rewritten = rewriting.output_text.trim();

    // 2) Embedding
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: rewritten,
    });

    const queryEmbedding = embRes.data[0].embedding;

    // 3) Vector search – NO RESTRICTIONS
    const { data: matches, error } = await supabase.rpc("match_anime_strict", {
      query_embedding: queryEmbedding,
      match_count: 60,
      min_score: 0.0, // aucune limite
    });

    if (error) throw error;
    if (!matches?.length) {
      return NextResponse.json({
        reply: "Je n’ai rien trouvé… Ajoute plus de détails 😥✨",
        matches: [],
      });
    }

    // 4) Metadata
    const ids = matches.map((m: any) => m.id);

    const { data: rows, error: errMeta } = await supabase
      .from("anime_all")
      .select("id, title, image_url, start_date, members")
      .in("id", ids);

    if (errMeta) throw errMeta;

    // 5) Format candidates
    const candidates = rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      url: `/anime/${a.id}`,
      image_url: a.image_url,
      members: a.members ?? 0,
      start_year: extractYear(a.start_date),
    }));

    // 6) → On DONNE les 50 ANIMES bruts à GPT
    const gptInputList = candidates
      .map(
        (c) =>
          `${c.title} | ${c.url} | members: ${c.members} | year: ${c.start_year}`
      )
      .join("\n");

    // 7) GPT final — Sélection intelligente pondérée
    const answer = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      temperature: 1.05, // plus naturel, fun, instinctif
      input: [
        {
          role: "system",
          content: `
Tu es OtakuBot 🎌🔥  
Un pote otaku GENIAL, expert, passionné, drôle et ultra impliqué.  
Ton objectif : recommander les MEILLEURS animes possibles.  

RÈGLES DE SÉLECTION (pondération interne) :
- 70% → popularité (members élevés) + pertinence EXACTE avec le besoin du user  
- 10% → récence (tu boostes légèrement les animes récents si ça colle à la vibe)  
- 20% → animes sous-cotés mais véritables MASTERCLASS (chef-d'œuvre caché)  

RÉSULTAT :
- Tu choisis **3 à 6 animes maximum**, jamais plus  
- Tu expliques *pourquoi* chaque anime correspond a la demande du user et pourquoi il doit le regarder  
- Tu es enthousiaste, passionné, drôle, immersif
- Style : pote otaku passionné, fun, énergique, avec emojis  
- Format : [[Titre|URL]]  
- Jamais de JSON  
- Le user doit se sentir **compris** et se dire :  
  "Wow, on m'a donné exactement ce qu'il me fallait."  
      `,
        },

        {
          role: "user",
          content: `
Message utilisateur : "${message}"

Voici les 50 animes trouvés :
${gptInputList}

Sélectionne entre **3 et 6** animes selon les règles suivantes :
- ta priorité = pertinence EXACTE avec ce que cherche le user le user doit se dire lui il comprend ce que je veux reellement regarder 
- privilégie les animes avec beaucoup de members (70%)  
- ajoute à ta sélection **1 ou 2 chefs-d'œuvre sous-cotés** si ça améliore la recommandation (20%)  
- prends un léger compte la récence (10%)  
- conseille-les avec passion et humour comme un vrai fan 🎌🔥  
      `,
        },
      ],
    });

    return NextResponse.json({
      reply: answer.output_text,
      matches: candidates.slice(0, 6), // on renvoie tout ou une partie
      embedding_used: rewritten,
    });
  } catch (err) {
    console.error("❌ OtakuBot ERROR:", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
