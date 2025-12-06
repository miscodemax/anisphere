// app/api/search/route.ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase";

function extractYear(str?: string | null) {
  if (!str) return null;
  const y = parseInt(str.split("-")[0]);
  return isNaN(y) ? null : y;
}

function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query?.trim() || "";

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const supabase = createClient();

    // ============================================================
    // 🧠 GPT-mini REWRITING (comme OtakuBot)
    // ============================================================
    const rewriting = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: `
Réécris cette recherche pour une requête vectorielle d'anime :
"${query}"

Règles :
- 250 à 600 caractères
- Un seul paragraphe
- Décris ambiance, émotions, thèmes, style visuel, intentions
- PAS de liste, PAS de JSON, PAS de retour à la ligne
Commence directement.
      `,
      max_output_tokens: 250,
    });

    const semanticQuery = rewriting.output_text.trim();

    // ============================================================
    // 🔥 EMBEDDING
    // ============================================================
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: semanticQuery,
    });

    const queryEmbedding = embRes.data[0].embedding;

    // ============================================================
    // 🔥 VECTOR SEARCH AVEC match_anime_strict
    // ============================================================
    const { data: matches, error } = await supabase.rpc("match_anime_strict", {
      query_embedding: queryEmbedding,
      match_count: 50,
      min_score: 0.4, // comme OtakuBot, fiable mais pas trop restrictif
    });

    if (error) throw error;

    if (!matches?.length) {
      return NextResponse.json({
        query,
        expanded_query: semanticQuery,
        results: [],
      });
    }

    // ============================================================
    // 🔥 ENRICHISSEMENT MÉTADONNÉES (comme OtakuBot)
    // ============================================================
    const ids = matches.map((m: any) => m.id);

    const { data: rows } = await supabase
      .from("anime_all")
      .select("id, title, image_url, members, start_date, score")
      .in("id", ids);

    // Similarité → Map
    const sim = new Map<number, number>();
    for (const m of matches) sim.set(m.id, m.similarity);

    // ============================================================
    // 🔥 FORMATAGE
    // ============================================================
    let candidates = rows.map((a) => {
      const year = extractYear(a.start_date);
      return {
        id: a.id,
        title: a.title,
        image_url: a.image_url,
        members: a.members ?? 0,
        year,
        score: a.score,
        similarity: sim.get(a.id) ?? 0,
        url: `/anime/${a.id}`,
      };
    });

    // ============================================================
    // 🔥 RANKING (comme OtakuBot mais simplifié)
    //
    // pondération :
    // 60% similarité
    // 30% popularité (members)
    // 10% récence
    // ============================================================
    const MAX_MEMBERS = 5_000_000;
    const currentYear = new Date().getFullYear();

    candidates = candidates.map((c) => {
      const simNorm = clamp01(c.similarity);
      const popNorm = clamp01(c.members / MAX_MEMBERS);

      let recencyNorm = 0;
      if (c.year) {
        const diff = currentYear - c.year;
        recencyNorm = clamp01(1 - diff / 10);
      }

      const final_score = simNorm * 0.6 + popNorm * 0.3 + recencyNorm * 0.1;

      return { ...c, final_score };
    });

    candidates.sort((a, b) => b.final_score - a.final_score);

    return NextResponse.json({
      query,
      expanded_query: semanticQuery,
      count: candidates.length,
      results: candidates,
    });
  } catch (err) {
    console.error("❌ SEARCH API ERROR:", err);
    return NextResponse.json(
      { error: "Server error", details: `${err}` },
      { status: 500 }
    );
  }
}
