// ---------------------------
// 1. FONCTION DE REQUÊTE YOUTUBE
// ---------------------------
async function fetchYoutube(query: string, apiKey: string) {
  const url =
    `https://www.googleapis.com/youtube/v3/search?` +
    new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "5",
      key: apiKey,
      videoEmbeddable: "true",
      relevanceLanguage: "fr",
    });

  // Retry + backoff exponentiel
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url);

      // Si erreur côté YouTube, on essaye de lire le JSON proprement
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        console.error("Corrupted JSON response from YouTube.");
      }

      // Clés API invalides, quota dépassé, API désactivée => ne pas réessayer
      if (data?.error?.errors) {
        const reason = data.error.errors[0].reason;
        console.error("YouTube error reason:", reason);

        if (
          [
            "keyInvalid",
            "keyExpired",
            "accessNotConfigured",
            "quotaExceeded",
          ].includes(reason)
        ) {
          return null;
        }
      }

      if (!res.ok) {
        console.error(`YouTube API ERROR (Attempt ${i + 1})`, data);

        if (res.status >= 400 && res.status < 500) {
          return null;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
        continue;
      }

      if (data?.items?.length) return data.items;
      return null;
    } catch (err) {
      console.error(`Fetch error (Attempt ${i + 1}):`, err);

      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  return null;
}

// ---------------------------
// 2. ROUTE API NEXT.JS
// ---------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const animeTitle = searchParams.get("title");
  const type = searchParams.get("type") || "trailer";

  if (!animeTitle || animeTitle.trim() === "") {
    return Response.json({ error: "Missing or empty title" }, { status: 400 });
  }

  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return Response.json({ error: "Missing API KEY" }, { status: 500 });
  }

  // ---------------------------
  // STRATEGIE RECHERCHE MULTI-REQUÊTES
  // ---------------------------

  const candidates: string[] = [];

  if (type === "trailer") {
    candidates.push(
      `${animeTitle} trailer vf`,
      `${animeTitle} bande annonce vf`,
      `${animeTitle} trailer vostfr`,
      `${animeTitle} official trailer`,
      `${animeTitle} PV anime`,
      `${animeTitle} PV`,
      `${animeTitle} trailer`
    );
  }

  if (type === "opening") {
    candidates.push(
      `${animeTitle} opening 1`,
      `${animeTitle} op1`,
      `${animeTitle} opening full`,
      `${animeTitle} intro theme`,
      `${animeTitle} opening theme`,
      `${animeTitle} soundtrack opening`,
      `${animeTitle} opening`
    );
  }

  if (type === "episode") {
    candidates.push(
      `${animeTitle} episode 1 vf`,
      `${animeTitle} épisode 1 vf`,
      `${animeTitle} episode 1 vostfr`,
      `${animeTitle} episode 1`,
      `${animeTitle} ep1`,
      `${animeTitle} full episode`,
      `${animeTitle} episode`
    );
  }

  // ---------------------------
  // EXECUTION SEQUENTIELLE
  // ---------------------------
  let result = null;

  for (const query of candidates) {
    console.log("Searching YouTube:", query);

    const items = await fetchYoutube(query, API_KEY);
    if (items && items.length > 0) {
      result = items[0];
      break;
    }
  }

  // ---------------------------
  // RESULTAT FINAL
  // ---------------------------
  if (!result) {
    return Response.json({ found: false, video: null }, { status: 200 });
  }

  return Response.json({
    found: true,
    videoId: result.id.videoId,
    title: result.snippet.title,
    thumbnail: result.snippet.thumbnails.high?.url,
    channelTitle: result.snippet.channelTitle,
    publishedAt: result.snippet.publishedAt,
  });
}
