// app/mangas/page.tsx
import { createClient } from "@/lib/supabase";
import AnimeCard from "../components/AnimeCard";

export const revalidate = 0;

export default async function AllMangasPage() {
  const supabase = createClient();

  // Fonction utilitaire pour fetch une table
  async function fetchTable(table: string) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) return [];
    return data || [];
  }

  // Récupération de toutes les tables manga
  const [shonen, shoujo, seinen, josei] = await Promise.all([
    fetchTable("manga_shonen"),
    fetchTable("manga_shoujo"),
    fetchTable("manga_seinen"),
    fetchTable("manga_josei"),
  ]);

  // Fusion globale
  const allRaw = [...shonen, ...shoujo, ...seinen, ...josei];

  // Nettoyage et ajout des champs utiles pour ton AnimeCard
  const allMangas = allRaw.map((m) => ({
    ...m,
    mediaType: "manga",
    is_french: !!m.description_fr,

    genres: Array.isArray(m.genres) ? m.genres : [],
    themes: Array.isArray(m.themes) ? m.themes : [],
    authors: Array.isArray(m.authors) ? m.authors : [],
    serializations: Array.isArray(m.serializations) ? m.serializations : [],

    // fallback image si nécessaire
    image_url: m.image_url || "/placeholder-manga.jpg",
  }));

  // Mélange aléatoire
  const shuffled = allMangas.sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen w-full px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tous les Mangas</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {shuffled.map((manga, index) => (
          <AnimeCard key={`${manga.id}-${index}`} anime={manga} index={index} />
        ))}
      </div>
    </div>
  );
}
