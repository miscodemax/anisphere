// app/api/semantic-search/route.ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: "Missing query" });

    const supabase = createClient();

    // 1️⃣ Query rewriting — expansion intelligente
    const rewriting = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: `
        Analyse cette recherche d'anime: "${query}"
        Extrait:
        - Genres principaux
        - Thèmes
        - Ambiance / mood
        - Mots clés utiles
        - Description détaillée optimisée pour la recherche
        Retourne uniquement un paragraphe final qui combine tout proprement.
      `,
    });

    const expandedQuery = rewriting.output[0]?.content[0]?.text ?? query;

    console.log("🔍 Query enrichie:", expandedQuery);

    // 2️⃣ Embedding de la requête enrichie
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: expandedQuery,
    });

    const queryEmbedding = embeddingRes.data[0].embedding;

    // 3️⃣ Appel à la RPC Supabase
    const { data, error } = await supabase.rpc("match_animes_multi_table", {
      query_embedding: queryEmbedding,
      match_count: 12,
    });

    if (error) throw error;

    return NextResponse.json({ results: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
