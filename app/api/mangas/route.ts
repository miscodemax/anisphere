// app/api/mangas/route.ts
import { createClient } from "@/lib/supabase";
import { decompressBase64 } from "@/utils/compress";

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const perPageRaw = parseInt(searchParams.get("perPage") || "30", 10);
  const perPage = Math.min(Math.max(perPageRaw, 1), 100);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Normalisation
  const norm = (v: string | null) => (v ? v.toLowerCase().trim() : "");
  const normArr = (v: string | null) =>
    v
      ? v
          .split(",")
          .map((x) => x.toLowerCase().trim())
          .filter(Boolean)
      : null;

  // Filtres simples
  const demographic = norm(searchParams.get("demographic"));

  // Filtres numériques
  const yearMin = searchParams.get("yearMin");
  const yearMax = searchParams.get("yearMax");
  const minScore = searchParams.get("minScore");
  const maxScore = searchParams.get("maxScore");

  // Filtres arrays
  const genres = normArr(searchParams.get("genres"));
  const themes = normArr(searchParams.get("themes"));
  const authors = normArr(searchParams.get("authors"));
  const serializations = normArr(searchParams.get("serializations"));
  const types = normArr(searchParams.get("type"));
  const statuses = normArr(searchParams.get("status"));

  // Recherche
  const search = norm(searchParams.get("q"));

  // Tri sécurisé
  const allowedSort = [
    "popularity",
    "score",
    "members",
    "rank",
    "favorites",
    "start_date",
    "created_at",
  ];
  const sortByRaw = norm(searchParams.get("sortBy"));
  const sortOrderRaw = norm(searchParams.get("sortOrder"));

  const sortBy = allowedSort.includes(sortByRaw) ? sortByRaw : "popularity";
  const ascending = sortOrderRaw === "asc";

  // === Query START (sélection minimale) ===
  let query = supabase.from("manga_all").select(
    `
      id,
      title,
      title_english,
      title_japanese,
      image_url,
      score,
      scored_by,
      rank,
      popularity,
      members,
      favorites,
      start_date,
      end_date,
      chapters,
      volumes,
      type,
      status,
      demographic,
      genres,
      themes,
      authors,
      serializations,
      description_fr
    `,
    { count: "exact" }
  );

  // === Filtres arrays (GIN) ===
  if (genres?.length) query = query.contains("genres", genres);
  if (themes?.length) query = query.contains("themes", themes);
  if (authors?.length) query = query.contains("authors", authors);
  if (serializations?.length)
    query = query.contains("serializations", serializations);

  // === Filtres lists ===
  if (types?.length) query = query.in("type", types);
  if (statuses?.length) query = query.in("status", statuses);

  // === Filtres texte ===
  if (demographic) query = query.eq("demographic", demographic);

  // === Filtres numériques (année via start_date) ===
  if (yearMin) {
    query = query.gte("start_date", `${Number(yearMin)}-01-01`);
  }
  if (yearMax) {
    query = query.lte("start_date", `${Number(yearMax)}-12-31`);
  }

  if (minScore) query = query.gte("score", Number(minScore));
  if (maxScore) query = query.lte("score", Number(maxScore));

  // === Recherche intelligente sur titres ===
  if (search) {
    const s = `%${search}%`;
    query = query.or(
      `title.ilike.${s},title_english.ilike.${s},title_japanese.ilike.${s}`
    );
  }

  // === Tri ===
  query = query.order(sortBy, { ascending });

  // === Pagination ===
  query = query.range(from, to);

  // === Execute ===
  const { data, error, count } = await query;

  if (error) {
    console.error("Erreur Supabase /manga_all:", error);
    return Response.json(
      {
        error: "Erreur lors du chargement des mangas",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(Math.ceil(total / perPage), 1);

  // Clean + decompress
  const mangas = (data || []).map((m) => ({
    ...m,
    description: m.description_fr ? decompressBase64(m.description_fr) : null,
    year: m.start_date ? new Date(m.start_date).getFullYear() : null,
    genres: Array.isArray(m.genres) ? m.genres : [],
    themes: Array.isArray(m.themes) ? m.themes : [],
    authors: Array.isArray(m.authors) ? m.authors : [],
    serializations: Array.isArray(m.serializations) ? m.serializations : [],
  }));

  return Response.json(
    {
      page,
      perPage,
      total,
      totalPages,
      mangas,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
