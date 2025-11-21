"use client";

// ==================== CARTE ANIME SIMILAIRE ====================
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Star, Layers } from "lucide-react"; // Importation de Layers pour le type Manga/Publication

// L'interface reste la même que celle fournie
interface Anime {
  id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  image_url: string | null;
  description: string | null;
  description_fr: string | null;
  background?: string | null;
  score: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  members?: number | null;
  favorites?: number | null;
  start_date: string | null;
  end_date?: string | null;
  season?: string | null;
  year?: number | null;
  episodes?: number | null;
  duration?: string | null;
  status?: string | null;
  type?: string | null;
  rating?: string | null;
  source?: string | null;
  genres?: string[];
  themes?: string[];
  studios?: string[];
  producers?: string[];
  licensors?: string[];
  demographic?: string;
  trailer_url?: string | null;
}

const SimilarAnimeCard = ({
  anime,
  demographic,
}: {
  anime: Anime;
  demographic: string;
}) => {
  const router = useRouter();

  // NOUVELLE LOGIQUE : DÉDUCTION DU PATH TYPE (anime ou manga)
  let pathType: "anime" | "manga";

  // Types souvent considérés comme ANIME
  if (
    ["TV", "Movie", "OVA", "ONA", "Special", "Music"].includes(anime.type || "")
  ) {
    pathType = "anime";
  }
  // Types souvent considérés comme MANGA/Publication
  else if (
    ["Manga", "Manhwa", "Manhua", "Light Novel", "One-shot", "Doujin"].includes(
      anime.type || ""
    )
  ) {
    pathType = "manga";
  }
  // Valeur par défaut si le type est inconnu (conserve l'ancien comportement)
  else {
    pathType = "anime";
  }

  // Construction dynamique de l'URL
  const dynamicHref = `/${pathType}/${anime.id}?demographic=${demographic}`;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      // MODIFICATION CLÉ : Utilisation de l'URL dynamique
      onClick={() => router.push(dynamicHref)}
      className="group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-300"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={anime.image_url || "/placeholder.png"}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {anime.score && (
          <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-black">{anime.score.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h4 className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-indigo-500 transition-colors">
          {anime.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{anime.type}</span>

          {/* AJUSTEMENT : Affichage épisode/chapitre basé sur pathType */}
          {anime.episodes && (
            <span className="flex items-center gap-1">
              •
              {pathType === "anime" ? (
                <span>{anime.episodes} ép</span>
              ) : (
                <span className="flex items-center">
                  <Layers className="w-3 h-3 mr-1" />
                  {anime.episodes} ch/vol
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SimilarAnimeCard;
