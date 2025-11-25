import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const url = new URL(req.url);
    const q = url.searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    // 🔥 1) Recherche JIKAN
    const jikanRes = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=20`
    );

    const jikanData = await jikanRes.json();
    const results = jikanData.data || [];

    const finalResults: any[] = [];

    // Fonction utilitaire pour déterminer la table Supabase
    function getTableFromDemographic(demo: string | null) {
      if (!demo) return "anime_nouveautes";

      const d = demo.toLowerCase();

      if (d.includes("shounen")) return "anime_shonen";
      if (d.includes("shoujo")) return "anime_shojo";
      if (d.includes("seinen")) return "anime_seinen";
      if (d.includes("josei")) return "anime_josei";

      return "anime_nouveautes";
    }

    // Détecter type anime/manga comme dans ton AnimeCard
    function detectMediaType(jikan: any): "anime" | "manga" {
      const t = jikan.type;

      if (["TV", "Movie", "OVA", "ONA", "Special", "Music"].includes(t))
        return "anime";

      if (
        [
          "Manga",
          "Manhwa",
          "Manhua",
          "Light Novel",
          "One-shot",
          "Doujin",
        ].includes(t)
      )
        return "manga";

      return "anime";
    }

    // 🔥 2) MATCHING SUPABASE POUR CHAQUE ANIME JIKAN
    for (const anime of results) {
      const englishTitle =
        anime.title_english ||
        anime.title ||
        anime.titles?.find((t: any) => t.type === "English")?.title;

      if (!englishTitle) continue;

      const demographic =
        anime.demographics?.[0]?.name?.toLowerCase() || "general";

      const table = getTableFromDemographic(demographic);

      // 🧠 Recherche dans la table correspondante
      const { data: match } = await supabase
        .from(table)
        .select("*")
        .eq("title", anime.title);

      if (!match || match.length === 0) continue;

      const found = match[0];
      const mediaType = detectMediaType(anime);
      let demographicQuery = "general"; // valeur par défaut

      // 1. Logique de détermination de la démographie (inchangée)
      if (found.demographic) {
        demographicQuery = found.demographic.toLowerCase();
      } else {
        // Adapter cette logique si vous avez des statuts différents pour les mangas
        if (
          found.status === "Not yet aired" ||
          found.status === "Not yet published"
        ) {
          demographicQuery = "nouveautes";
        } else {
          demographicQuery = "general";
        }
      }

      // 3) Construire le lien final EXACT comme ton AnimeCard
      const linkHref = `/${mediaType}/${found.id}?demographic=${demographicQuery}`;

      finalResults.push({
        ...found,
        linkHref,
        jikan: anime, // on rajoute pour info si tu veux des images jikan
      });
    }

    return NextResponse.json(finalResults);
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
