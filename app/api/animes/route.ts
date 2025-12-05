// app/api/animes/route.ts
import { createClient } from "@/lib/supabase";
import { decompressBase64 } from "@/utils/compress";

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  /** Pagination */
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const perPageRaw = parseInt(searchParams.get("perPage") || "30", 10);
  const perPage = Math.min(Math.max(perPageRaw, 1), 100);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  /** Normalisation */
  const norm = (v: string | null) => (v ? v.toLowerCase().trim() : "");
  const normArr = (v: string | null) =>
    v
      ? v
          .split(",")
          .map((x) => x.toLowerCase().trim())
          .filter(Boolean)
      : null;

  const search = norm(searchParams.get("q"));
  const demographic = norm(searchParams.get("demographic"));
  const season = norm(searchParams.get("season"));
  const rating = norm(searchParams.get("rating"));

  const genres = normArr(searchParams.get("genres"));
  const themes = normArr(searchParams.get("themes"));
  const studios = normArr(searchParams.get("studios"));
  const statuses = normArr(searchParams.get("status"));
  const types = normArr(searchParams.get("type"));

  const yearMin = norm(searchParams.get("yearMin"));
  const yearMax = norm(searchParams.get("yearMax"));
  const minScore = norm(searchParams.get("minScore"));
  const maxScore = norm(searchParams.get("maxScore"));

  /** Tri user sécurisés */
  const allowedSort = ["popularity", "score", "start_date", "members"];
  const sortByRaw = norm(searchParams.get("sortBy"));
  const sortOrderRaw = norm(searchParams.get("sortOrder"));

  const sortBy = allowedSort.includes(sortByRaw) ? sortByRaw : null; // null = tri auto
  const ascending = sortOrderRaw === "asc";

  /** Sélect ultra léger */
  let query = supabase.from("anime_all").select(
    `
        id,
        title,
        title_english,
        title_japanese,
        image_url,
        score,
        popularity,
        members,
        start_date,
        end_date,
        season,
        type,
        status,
        genres,
        themes,
        studios,
        description_fr
      `,
    { count: "exact" }
  );

  /** Filtres scalaires */
  if (demographic) query = query.eq("demographic", demographic);
  if (season) query = query.eq("season", season);
  if (rating) query = query.eq("rating", rating);
  if (statuses?.length) query = query.in("status", statuses);
  if (types?.length) query = query.in("type", types);

  /** Filtres numériques (année via start_date) */
  if (yearMin) query = query.gte("start_date", `${Number(yearMin)}-01-01`);
  if (yearMax) query = query.lte("start_date", `${Number(yearMax)}-12-31`);

  if (minScore) query = query.gte("score", Number(minScore));
  if (maxScore) query = query.lte("score", Number(maxScore));

  /** Filtres arrays GIN */
  if (genres?.length) query = query.contains("genres", genres);
  if (themes?.length) query = query.contains("themes", themes);
  if (studios?.length) query = query.contains("studios", studios);

  /** Recherche texte ultra compatible Postgrest */
  if (search) {
    const s = `%${search}%`;
    query = query.or(
      `title.ilike.${s},title_english.ilike.${s},title_japanese.ilike.${s}`
    );
  }

  /** TRI INTELLIGENT : si aucun tri demandé */
  if (!sortBy) {
    query = query
      // 1) Sortie récente
      .order("start_date", { ascending: false })

      // 2) Note élevée
      .order("score", { ascending: false })

      // 3) Classement (si présent)
      .order("popularity", { ascending: true })

      // 4) Hype (communauté)
      .order("members", { ascending: false });
  } else {
    /** Tri utilisateur prioritaire */
    query = query.order(sortBy, { ascending });
  }

  /** Pagination finale */
  query = query.range(from, to);

  /** Exec */
  const { data, error, count } = await query;

  if (error) {
    console.error("❌ Supabase error:", error);
    return Response.json(
      {
        error: "Erreur interne lors du chargement des animes",
        details: error.message,
      },
      { status: 500 }
    );
  }

  /** Format final */
  const animes = (data || []).map((a) => ({
    ...a,
    description: a.description_fr ? decompressBase64(a.description_fr) : null,
    genres: Array.isArray(a.genres) ? a.genres : [],
    themes: Array.isArray(a.themes) ? a.themes : [],
    studios: Array.isArray(a.studios) ? a.studios : [],
  }));

  return Response.json({
    page,
    perPage,
    total: count || 0,
    totalPages: Math.max(Math.ceil((count || 0) / perPage), 1),
    animes,
  });
}
