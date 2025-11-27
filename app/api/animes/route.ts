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

  async function fetchAllFromTable(table: string) {
    const supabase = createClient();
    const pageSize = 1000;

    let allData: any[] = [];
    let from = 0;
    let to = pageSize - 1;

    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("id", { ascending: true })
        .range(from, to);

      if (error) {
        console.error(`Erreur table ${table}:`, error);
        break;
      }

      if (!data || data.length === 0) break;

      allData.push(...data);

      // Si moins que pageSize → fin
      if (data.length < pageSize) break;

      from += pageSize;
      to += pageSize;
    }

    return allData;
  }

  // Récupère TOUT en parallèle
  const results = await Promise.all(tables.map(fetchAllFromTable));

  // Combine et décompresse
  const allAnimes = results.flat().map((a) => ({
    ...a,
    description: decompressBase64(a.description_fr),
    background: decompressBase64(a.background),
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
