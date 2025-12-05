import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query?.trim() || "";

    // Anti-bruit
    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const supabase = createClient();

    // ======== LIGHT QUERY ENRICHMENT (local, instant) =========
    const semanticQuery = `
      Recherche d'anime: ${query}.
      Décris brièvement l'univers, ambiance, style narratif, thèmes, genres,
      ton émotionnel, public cible, palette d'émotions, concept principal.
    `
      .replace(/\s+/g, " ")
      .trim();

    // ======== EMBEDDING ULTRA RAPIDE =========
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: semanticQuery,
    });

    const queryEmbedding = embeddingRes.data[0].embedding;

    // ======= DEFAULTS =======
    const matchCount: number = body.matchCount || 12;
    const minSimilarity: number = body.minSimilarity || 0.38;

    const filters = body.filters || {};
    const genres = filters.genres || null;
    const themes = filters.themes || null;
    const studios = filters.studios || null;
    const demographic = filters.demographic || null;

    // ======= RPC HNSW (PURE POWER) =======
    const { data, error } = await supabase.rpc("match_all_anime", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      min_similarity: minSimilarity,
      p_genres: genres,
      p_themes: themes,
      p_studios: studios,
      p_demographic: demographic,
    });

    if (error) throw error;

    return NextResponse.json({
      query,
      expanded_query: semanticQuery,
      count: data?.length || 0,
      results: data,
    });
  } catch (err) {
    console.error("❌ Semantic Search ERROR:", err);
    return NextResponse.json(
      { error: "Server error", details: `${err}` },
      { status: 500 }
    );
  }
}
