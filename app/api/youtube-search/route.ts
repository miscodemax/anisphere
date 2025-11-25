import { createClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";

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

const SUPABASE_TABLES = [
  "anime_shonen",
  "anime_shoujo",
  "anime_seinen",
  "anime_nouveautes",
  "anime_catalogue_general",
];

// --- Cache Supabase
async function findExistingVideo(supabase: any, title: string, field: string) {
  for (const table of SUPABASE_TABLES) {
    const { data } = await supabase
      .from(table)
      .select(`${field}, id`)
      .ilike("title", title);

    if (data?.length && data[0][field]) {
      return { table, id: data[0].id, video: data[0][field] };
    }
  }
  return null;
}

// --- Recherche YouTube
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

// --- Générer une query YouTube ultra-précise avec GPT
async function refineQueryWithGPT(animeTitle: string, type: string) {
  const prompt = `
Tu es un expert en anime et en YouTube. 
Je veux que tu crées une requête de recherche YouTube très précise pour trouver uniquement des vidéos correspondant à l'anime "${animeTitle}" et au type "${type}" (trailer, opening, épisode 1 ou AMV). 
Réécris la requête de manière courte, efficace et précise, en incluant éventuellement "VF", "VOSTFR", "bande annonce", "opening" selon le type.
Ne mets pas de JSON, répond juste par la requête texte prête à être utilisée.
`;

  const response = await openai.responses.create({
    model: "gpt-4o-mini-2024-07-18",
    input: prompt,
    max_output_tokens: 50,
  });

  return response.output_text?.trim() || `${animeTitle} ${type}`;
}

// --- Choisir la meilleure vidéo selon VF > VOSTFR > Officiel > premier
function chooseBestVideo(items: any[]) {
  if (!items.length) return null;

  const includes = (video: any, list: string[]) =>
    list.some((k) =>
      video.snippet.title.toLowerCase().includes(k.toLowerCase())
    );

  // 1 - VF
  const vfWords = [
    "vf",
    "french dub",
    "version française",
    "français",
    "fr dub",
  ];
  const vf = items.find((v) => includes(v, vfWords));
  if (vf) return vf;

  // 2 - VOSTFR
  const vostfrWords = ["vostfr", "stfr", "sub fr", "sous titres fr"];
  const vostfr = items.find((v) => includes(v, vostfrWords));
  if (vostfr) return vostfr;

  // 3 - Officiel
  const official = items.find((v) =>
    OFFICIAL_CHANNELS.some((c) =>
      v.snippet.channelTitle.toLowerCase().includes(c)
    )
  );
  if (official) return official;

  // 4 - Sinon premier résultat
  return items[0];
}

// --- Mapping type → champ Supabase
const FIELD_MAP: Record<string, string> = {
  trailer: "trailer_ytb",
  opening: "op1_ytb",
  episode1: "episode1_ytb",
  amv: "amv_ytb",
};

// --- API GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const type = searchParams.get("type") || "trailer";

  if (!title) return Response.json({ error: "Missing title" }, { status: 400 });

  const supabase = createClient();
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || !process.env.OPENAI_API_KEY) {
    return Response.json({ error: "API keys missing" }, { status: 500 });
  }

  const targetField = FIELD_MAP[type];
  if (!targetField)
    return Response.json({ error: "Invalid type" }, { status: 400 });

  // --- Vérifier cache
  const existing = await findExistingVideo(supabase, title, targetField);
  if (existing) {
    return Response.json({
      found: true,
      source: "cache",
      table: existing.table,
      videoId: existing.video,
    });
  }

  // --- Générer query précise avec GPT
  const refinedQuery = await refineQueryWithGPT(title, type);
  const results = await searchYoutube(refinedQuery, apiKey);

  if (!results.length) return Response.json({ found: false });

  // --- Choisir meilleure vidéo
  const bestVideo = chooseBestVideo(results);
  const bestVideoId = bestVideo?.id.videoId;

  if (!bestVideoId) return Response.json({ found: false });

  // --- Stocker dans Supabase
  let savedTable: string | null = null;
  for (const table of SUPABASE_TABLES) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .ilike("title", title)
      .limit(1);

    if (data?.length) {
      await supabase
        .from(table)
        .update({ [targetField]: bestVideoId })
        .eq("id", data[0].id);

      savedTable = table;
      break;
    }
  }

  return Response.json({
    found: true,
    source: "youtube+GPT",
    videoId: bestVideoId,
    savedIn: savedTable,
    type,
  });
}
