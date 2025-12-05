import { createClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";

// LISTE des chaînes officielles
const OFFICIAL_CHANNELS = [
  "crunchyroll",
  "crunchyroll france",
  "anime digital network",
  "adn",
  "aniplex",
  "toei animation",
  "bandai",
  "kadokawa",
  "muse asia",
  "netflix",
  "funimation",
  "viz media",
];

// Mapping type → champ Supabase
const FIELD_MAP: Record<string, string> = {
  trailer: "trailer_ytb",
  opening: "op1_ytb",
  episode1: "episode1_ytb",
  amv: "amv_ytb",
};

// 🔥 1 — Vérifier si la vidéo existe déjà dans anime_all
async function findExistingVideo(supabase: any, title: string, field: string) {
  const { data } = await supabase
    .from("anime_all")
    .select(`${field}, id`)
    .ilike("title", title)
    .limit(1);

  if (data?.length && data[0][field]) {
    return {
      id: data[0].id,
      video: data[0][field],
    };
  }

  return null;
}

// 🔥 2 — Recherche sur YouTube
async function searchYoutube(query: string, apiKey: string) {
  const url =
    `https://www.googleapis.com/youtube/v3/search?` +
    new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "15",
      key: apiKey,
      order: "relevance",
      videoEmbeddable: "true",
    });

  const res = await fetch(url);
  const data = await res.json();
  return res.ok && data.items ? data.items : [];
}

// 🔥 3 — GPT génère une requête ultra précise
async function refineQueryWithGPT(animeTitle: string, type: string) {
  const prompt = `
Tu es un expert en anime et YouTube.
Je veux une requête de recherche ultra précise pour trouver uniquement les vidéos correspondant à l'anime "${animeTitle}" et au type "${type}" (trailer, opening, épisode 1 ou AMV).
Optimise la requête YouTube en incluant VF, VOSTFR, bande annonce, opening si pertinent.
Ne répond QUE par la requête texte.
  `;

  const response = await openai.responses.create({
    model: "gpt-4o-mini-2024-07-18",
    input: prompt,
    max_output_tokens: 50,
  });

  return response.output_text?.trim() || `${animeTitle} ${type}`;
}

// 🔥 4 — Choisir la meilleure vidéo
function chooseBestVideo(items: any[]) {
  if (!items.length) return null;

  const includes = (video: any, list: string[]) =>
    list.some((k) =>
      video.snippet.title.toLowerCase().includes(k.toLowerCase())
    );

  const vfWords = [
    "vf",
    "french dub",
    "version française",
    "français",
    "fr dub",
  ];
  const vostfrWords = ["vostfr", "stfr", "sub fr", "sous titres fr"];

  // Priorités
  const vf = items.find((v) => includes(v, vfWords));
  if (vf) return vf;

  const vostfr = items.find((v) => includes(v, vostfrWords));
  if (vostfr) return vostfr;

  const official = items.find((v) =>
    OFFICIAL_CHANNELS.some((c) =>
      v.snippet.channelTitle.toLowerCase().includes(c)
    )
  );
  if (official) return official;

  return items[0];
}

// 🔥 5 — Endpoint API
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawTitle = searchParams.get("title");
  const type = searchParams.get("type") || "trailer";

  if (!rawTitle)
    return Response.json({ error: "Missing title" }, { status: 400 });

  const title = rawTitle.toLowerCase().trim();

  const supabase = createClient();
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || !process.env.OPENAI_API_KEY) {
    return Response.json({ error: "API keys missing" }, { status: 500 });
  }

  const targetField = FIELD_MAP[type];
  if (!targetField) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  // 🔎 Check cache direct dans anime_all
  const cached = await findExistingVideo(supabase, title, targetField);
  if (cached) {
    return Response.json({
      found: true,
      source: "cache",
      videoId: cached.video,
      id: cached.id,
    });
  }

  // 🧠 GPT → Query ultra précise
  const refinedQuery = await refineQueryWithGPT(title, type);

  // 🔍 Recherche YouTube
  const results = await searchYoutube(refinedQuery, apiKey);

  if (!results.length) return Response.json({ found: false });

  // ⭐ Sélectionne la meilleure vidéo
  const bestVideo = chooseBestVideo(results);
  const bestVideoId = bestVideo?.id?.videoId;

  if (!bestVideoId) return Response.json({ found: false });

  // 💾 Sauvegarde directe dans anime_all
  const { data } = await supabase
    .from("anime_all")
    .select("id")
    .ilike("title", title)
    .limit(1);

  if (data?.length) {
    await supabase
      .from("anime_all")
      .update({ [targetField]: bestVideoId })
      .eq("id", data[0].id);
  }

  return Response.json({
    found: true,
    source: "youtube+GPT",
    videoId: bestVideoId,
    saved: true,
    field: targetField,
    id: data?.[0]?.id || null,
    type,
  });
}
