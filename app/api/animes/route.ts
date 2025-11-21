import { createClient } from "@/lib/supabase";
import { decompressBase64 } from "@/utils/compress";

export async function GET() {
  const supabase = createClient();

  const tables = [
    "anime_shonen",
    "anime_shoujo",
    "anime_seinen",
    "anime_josei",
    "anime_nouveautes",
  ];

  // Fonction pour récupérer TOUTES les données d'une table (pas de limit)
  async function fetchAllFromTable(table: string) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("score", { ascending: false }); // Tri par score pour optimiser

    if (error) {
      console.error(`Erreur table ${table}:`, error);
      return [];
    }

    return data || [];
  }

  // Récupère TOUT en parallèle
  const results = await Promise.all(tables.map(fetchAllFromTable));

  // Combine et décompresse
  const allAnimes = results.flat().map((a) => ({
    ...a,
    description: decompressBase64(a.description),
    background: decompressBase64(a.background),
    description_fr: decompressBase64(a.description_fr),
    genres: Array.isArray(a.genres) ? a.genres : [],
    themes: Array.isArray(a.themes) ? a.themes : [],
    studios: Array.isArray(a.studios) ? a.studios : [],
  }));

  return new Response(JSON.stringify(allAnimes), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400", // Cache 1h
    },
  });
}
