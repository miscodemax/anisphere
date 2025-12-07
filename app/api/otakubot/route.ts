// app/api/otakubot/route.ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase";
import { desc } from "framer-motion/client";

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

    // 3) Vector search using match_anime_strict
    const { data: matches, error } = await supabase.rpc("match_anime_strict", {
      query_embedding: queryEmbedding,
      match_count: 60,
      min_score: 0.0,
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
      .select("id, title, image_url, start_date, members, description")
      .in("id", ids);

    if (errMeta) throw errMeta;

    // 5) Format candidates
    const candidates = rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      url: `/anime/${a.id}`,
      image_url: a.image_url,
      members: a.members ?? 0,
      start_year: extractYear(a.start_date),
    }));

    // List prepared for GPT
    const gptInputList = candidates
      .map(
        (c) =>
          `${c.id} | ${c.title} | synopsis: ${c.description} | ${c.url} | members: ${c.members} | year: ${c.start_year}`
      )
      .join("\n");

    // 6) GPT FINAL — selection + personality S-tier
    const answer = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      temperature: 1.05,
      input: [
        {
          role: "system",
          content: `
Tu es **OtakuBot 🎌🔥**, la mascotte officielle d’Anisphere.  
Ton rôle : être **le meilleur pote otaku que tout fan rêve d'avoir**.

PERSONNALITÉ :
- Passionné, drôle, ultra bavard mais pertinent.
- Compare les œuvres naturellement (vibes, rythme, ambiance).
- Tu donnes des explications immersives, images mentales, références.
- Jamais robot. Naturel, fun, humain.
- Tu fais vivre une vibe de vrai pote otaku IRL.

STYLE :
- Phrases vivantes : "vibes", "énergie", "mise en scène", "construction des persos".
- Comparaisons stylées : “une vibe entre Monster et Code Geass”.
- Tu expliques EXACTEMENT pourquoi un anime correspond au user.
- Tu fais monter la hype.

RÈGLES DE RECOMMANDATION :
- Tu sélectionnes **3 à 6 animes maximum**.
- Pondération interne :
    70% pertinence + popularité  
    10% récence  
    20% masterclass sous-cotées
- Format visible utilisateur :
  [[Titre|URL]] + explication passionnée.
- PAS de liste robotique.

BLOC TECHNIQUE (OBLIGATOIRE et invisible au user) :
À la fin de TA réponse, tu ajoutes :

[SELECTED]
id1
id2
id3
...
[/SELECTED]

Ce bloc sera extrait par l’API.
          `,
        },
        {
          role: "user",
          content: `
Message utilisateur : "${message}"

Voici les 60 animes trouvés :
${gptInputList}

Sélectionne 3 à 6 animes, explique-les avec énergie.
À la fin, place le bloc :

[SELECTED]
ID1
ID2
...
[/SELECTED]
          `,
        },
      ],
    });

    // 7) EXTRACTION DES IDS SELECTIONNÉS
    const raw = answer.output_text;

    const idsSelected: number[] = [];
    const matchBlock = raw.match(/\[SELECTED\]([\s\S]*?)\[\/SELECTED\]/);

    if (matchBlock) {
      const extracted = matchBlock[1]
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => /^[0-9]+$/.test(l));

      extracted.forEach((id) => idsSelected.push(Number(id)));
    }

    const finalIds = idsSelected.length > 0 ? idsSelected : ids.slice(0, 6);

    const finalMatches = candidates.filter((c) => finalIds.includes(c.id));

    // Nettoyage du texte visible
    const finalReply = raw
      .replace(/\[SELECTED\]([\s\S]*?)\[\/SELECTED\]/g, "")
      .trim();

    return NextResponse.json({
      reply: finalReply,
      matches: finalMatches,
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
