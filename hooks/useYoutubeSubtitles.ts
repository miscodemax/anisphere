// hooks/useYoutubeSubtitles.ts
export async function fetchYouTubeSubtitles(videoId: string) {
  try {
    // API non officielle (mais fiable)
    const url = `https://yt-api.p.rapidapi.com/subtitles?id=${videoId}&lang=fr`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY!,
        "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
      },
    });

    const data = await res.json();
    if (!data || !data.subtitles) return [];

    return data.subtitles.map((s: any) => ({
      start: s.start,
      dur: s.dur,
      text: s.text.replace(/<[^>]+>/g, ""), // nettoie le HTML
    }));
  } catch (error) {
    console.error("Erreur sous-titres:", error);
    return [];
  }
}
