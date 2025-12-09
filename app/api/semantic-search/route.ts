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
    // 🔥 EMBEDDING DIRECT (ULTRA IMPORTANT)
    // PAS DE GPT — MEILLEURE PRÉCISION POUR LA RECHERCHE
    // ============================================================
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query, // ← texte brut
    });

    const queryEmbedding = embRes.data[0].embedding;

    // ============================================================
    // 🔥 VECTOR SEARCH strict
    // ============================================================
    const { data: matches, error } = await supabase.rpc("match_anime_strict", {
      query_embedding: queryEmbedding,
      match_count: 50,
      min_score: 0.35, // léger mais pas trop permissif
    });

    if (error) throw error;

    if (!matches || matches.length === 0) {
      return NextResponse.json({ query, results: [] });
    }

    // ============================================================
    // 🔥 Metadata enrichie
    // ============================================================
    const ids = matches.map((m) => m.id);

    const { data: rows } = await supabase
      .from("anime_all")
      .select("id, title, image_url, members, start_date, score")
      .in("id", ids);

    const sim = new Map();
    for (const m of matches) sim.set(m.id, m.similarity);

    let candidates = rows.map((a) => {
      const year = extractYear(a.start_date);
      return {
        id: a.id,
        title: a.title,
        image_url: a.image_url,
        members: a.members ?? 0,
        score: a.score ?? null,
        similarity: sim.get(a.id) ?? 0,
        year,
        url: `/anime/${a.id}`,
      };
    });

    // ============================================================
    // 🔥 Ranking
    // 60% similarité
    // 30% popularité
    // 10% récence
    // ============================================================
    const MAX_MEMBERS = 5_000_000;
    const currentYear = new Date().getFullYear();

    candidates = candidates.map((c) => {
      const s = clamp01(c.similarity);
      const p = clamp01(c.members / MAX_MEMBERS);

      let r = 0;
      if (c.year) {
        const diff = currentYear - c.year;
        r = clamp01(1 - diff / 12);
      }

      const final_score = 0.6 * s + 0.3 * p + 0.1 * r;

      return { ...c, final_score };
    });

    candidates.sort((a, b) => b.final_score - a.final_score);

    return NextResponse.json({
      query,
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
