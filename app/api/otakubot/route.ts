// app/api/otakubot/route.ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase";

function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

function extractYear(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const y = parseInt(dateStr.slice(0, 4), 10);
  return isNaN(y) ? null : y;
}

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json();
    if (!message || !message.trim()) {
      return NextResponse.json({
        reply: "Dis-moi ce que tu veux regarder 😍🎌",
        matches: [],
      });
    }

    const supabase = createClient();

    // ==================================================
    // 1️⃣ Extraction des contraintes "dure"
    // ==================================================
    const extractReq = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: `
Analyse le message utilisateur :
"${message}"

EXTRAIS uniquement les contraintes temporelles.

Retourne strictement ce JSON :

{
 "min_start_year": null | number, // année minimale
 "force_recent": boolean          // si l'utilisateur veut du TRÈS récent
}

Logique :
- Si le user cite un an (ex: 2022) => min_start_year = 2022
- "après XXXX" => min_start_year = XXXX + 1
- "depuis XXXX" => min_start_year = XXXX
- "récents / new generation / modernes / nouveauté" => force_recent = true

force_recent = true implique :
min_start_year = 2025 si aucune autre année n'est donnée.
`,
      max_output_tokens: 120,
    });

    let constraints = { min_start_year: null, force_recent: false };

    try {
      constraints = JSON.parse(extractReq.output_text);
    } catch {}

    // Cas spécial : user veut "récent" mais n’a pas donné d’année
    if (constraints.force_recent && !constraints.min_start_year) {
      constraints.min_start_year = 2025;
    }

    // ==================================================
    // 2️⃣ Rewriting contextuel
    // ==================================================
    const contextText =
      history.length > 0
        ? history.map((m: any) => m.text).join(". ") + ". " + message
        : message;

    const rewriting = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: `
Transforme ce message utilisateur en un PARAGRAPHE immersif, descriptif, optimisé embeddings.

"${contextText}"

Règles:
- 350 à 900 caractères
- pas de JSON
- pas de listes
- pas de retours à la ligne
- commence directement par le texte.
`,
      max_output_tokens: 300,
    });

    const forEmbedding = rewriting.output_text.trim();

    // ==================================================
    // 3️⃣ Embedding
    // ==================================================
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: forEmbedding,
    });

    const queryEmbedding = embRes.data[0].embedding;

    // ==================================================
    // 4️⃣ Vector search brut
    // ==================================================
    const { data: matches, error } = await supabase.rpc("match_anime_strict", {
      query_embedding: queryEmbedding,
      match_count: 60,
      min_score: 0.45,
    });

    if (error) throw error;
    if (!matches || matches.length === 0) {
      return NextResponse.json({
        reply: "Je n'ai rien trouvé de vraiment pertinent à ta demande 💭✨",
        matches: [],
        embedding_used: forEmbedding,
        constraints,
      });
    }

    const ids = matches.map((m: any) => m.id);

    // ==================================================
    // 5️⃣ Full metadata (🆕 start_date included)
    // ==================================================
    const { data: rows, error: enrichErr } = await supabase
      .from("anime_all")
      .select(
        "id, title, image_url, score, scored_by, popularity, members, start_date"
      )
      .in("id", ids);

    if (enrichErr) throw enrichErr;

    const simById = new Map<number, number>();
    for (const m of matches as any[]) simById.set(m.id, m.score);

    let candidates = rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      image_url: a.image_url,
      score: a.score,
      scored_by: a.scored_by,
      popularity: a.popularity,
      members: a.members,
      start_year: extractYear(a.start_date),
      similarity: simById.get(a.id) ?? 0,
      url: `/anime/${a.id}`,
    }));

    // ==================================================
    // 6️⃣ FILTER STRICT (année obligatoire)
    // ==================================================
    if (constraints.min_start_year) {
      candidates = candidates.filter(
        (a) => a.start_year && a.start_year >= constraints.min_start_year
      );
    }

    // Qualité minimale
    candidates = candidates.filter((a) => {
      if (a.score < 7.5) return false;
      if (a.scored_by < 25_000) return false;
      if (a.members < 50_000) return false;
      return true;
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        reply: `Aucun anime ne correspond à la contrainte stricte de date ≥ ${constraints.min_start_year} 😭`,
        matches: [],
        embedding_used: forEmbedding,
        constraints,
      });
    }

    // ==================================================
    // 7️⃣ RERANK
    // ==================================================
    candidates = candidates.map((a) => {
      const sim = clamp01(a.similarity);

      const scoreNorm = a.score / 10;
      const membersNorm = a.members / 5_000_000;
      const votesNorm = a.scored_by / 1_500_000;
      const popNorm = 1 - a.popularity / 20_000;

      let yearNorm = 0;
      if (a.start_year) {
        if (a.start_year >= 2023) yearNorm = 1.0;
        else if (a.start_year >= 2020) yearNorm = 0.75;
        else if (a.start_year >= 2015) yearNorm = 0.55;
        else yearNorm = 0.1;
      }

      let final =
        sim * 0.48 +
        scoreNorm * 0.19 +
        membersNorm * 0.19 +
        votesNorm * 0.07 +
        yearNorm * 0.05 +
        popNorm * 0.02;

      if (a.members > 1_500_000) final *= 1.08;
      if (a.start_year >= 2023) final *= 1.1;

      return { ...a, final_score: final };
    });

    candidates.sort((a, b) => b.final_score - a.final_score);
    const best = candidates.slice(0, 7);

    // ==================================================
    // 8️⃣ GPT final
    // ==================================================
    const systemPrompt = `
Tu es OtakuBot, mascotte officielle d'Anisphere 🎌🔥
Fan d'animes, enthousiaste, passionné et fun !

OBLIGATIONS :
- Tu ne parles QUE des animes fournis.
- Tu expliques pourquoi ils correspondent.
- Style fun, passionné, avec emojis.
- Format lien obligatoire [[Titre|URL]]
`;

    const userPrompt = `
Message utilisateur : "${message}"

Recommandations :
${JSON.stringify(best, null, 2)}

Consignes :
- Analyse chaque anime brièvement
- Dis POURQUOI il colle à l’intention utilisateur
`;

    const completion = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: [
        { role: "system", content: systemPrompt },
        ...history.map((m: any) => ({
          role: m.role,
          content: m.text,
        })),
        { role: "user", content: userPrompt },
      ],
    });

    return NextResponse.json({
      reply: completion.output_text,
      matches: best,
      constraints,
      embedding_used: forEmbedding,
    });
  } catch (err: any) {
    console.error("❌ OtakuBot ERROR:", err);
    return NextResponse.json(
      { error: err.message || err.toString() },
      { status: 500 }
    );
  }
}
