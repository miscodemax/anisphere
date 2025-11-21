"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Star,
  Calendar,
  PlayCircle,
  Layers,
  TrendingUp,
  Film,
  Tv,
  Award,
} from "lucide-react";

// ==================== TYPES MIS À JOUR ====================
interface MediaItem {
  id: number;
  title: string;
  score: number;
  popularity: number;
  members: number;
  rank: number;
  image_url: string;
  description: string;
  start_date: string;
  year?: number;
  season?: string;
  genres: string[];
  studios: string[];
  demographic: string | null; // Peut être null
  is_french: boolean;
  episodes?: number;
  type?: string; // Type d'oeuvre (TV, Movie, Manga, Novel, etc.)
  status?: string;
  rating?: string;
  source?: string;
  // NOUVEAU: Champ pour déterminer le type de la route (anime ou manga)
  mediaType: "anime" | "manga";
}

// ==================== CARTE MEDIA PREMIUM ====================
// Renommer le composant en MediaCard ou garder AnimeCard et ajuster les props
export default function AnimeCard({
  anime, // anime représente maintenant un MediaItem
  index,
}: {
  anime: MediaItem;
  index: number;
}) {
  const getStatusBadge = () => {
    if (!anime.status) return null;
    const colors = {
      "Currently Airing": "bg-green-500/20 text-green-400 border-green-500/30",
      "Finished Airing": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Not yet aired": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      // Ajout de statuts spécifiques au manga/publication si nécessaire
      Publishing: "bg-green-500/20 text-green-400 border-green-500/30",
      Finished: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Not yet published":
        "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return (
      colors[anime.status as keyof typeof colors] ||
      "bg-slate-500/20 text-slate-400 border-slate-500/30"
    );
  };

  let demographicQuery = "general"; // valeur par défaut

  // 1. Logique de détermination de la démographie (inchangée)
  if (anime.demographic) {
    demographicQuery = anime.demographic.toLowerCase();
  } else {
    // Adapter cette logique si vous avez des statuts différents pour les mangas
    if (
      anime.status === "Not yet aired" ||
      anime.status === "Not yet published"
    ) {
      demographicQuery = "nouveautes";
    } else {
      demographicQuery = "general";
    }
  }
  // NOUVELLE LOGIQUE DE DÉDUCTION
  let pathType: "anime" | "manga";

  // Si le type est TV, Movie, OVA, ONA, Special, Music -> c'est un ANIME
  if (
    ["TV", "Movie", "OVA", "ONA", "Special", "Music"].includes(anime.type || "")
  ) {
    pathType = "anime";
  }
  // Si le type est Manga, Manhwa, Manhua, Novel, One-shot, Doujin -> c'est un MANGA/PUBLICATION
  else if (
    ["Manga", "Manhwa", "Manhua", "Light Novel", "One-shot", "Doujin"].includes(
      anime.type || ""
    )
  ) {
    pathType = "manga";
  }
  // Par défaut, si le type est inconnu, nous restons sur 'anime' ou 'manga' selon le contexte le plus probable de votre utilisation.
  // Je vais choisir 'anime' comme valeur par défaut sécurisée ou selon l'ancien comportement.
  else {
    pathType = "anime";
  }
  // 2. Construire le lien avec l'ID comme slug et la démographie en query parameter
  // MODIFICATION CLÉ : Utilisation de anime.mediaType pour la partie de la route
  const linkHref = `/${pathType}/${anime.id}?demographic=${demographicQuery}`;

  return (
    // Début du lien cliquable
    <Link href={linkHref} className="h-full block" passHref>
      <motion.div
        layout
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        transition={{
          duration: 0.4,
          delay: index * 0.03,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        className="group relative bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col backdrop-blur-sm cursor-pointer"
      >
        {/* ... (Le reste du JSX reste inchangé, à l'exception des traductions de statuts ci-dessous si vous voulez) */}

        {/* Image Container avec Overlay Gradient */}
        <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
          <img
            src={anime.image_url || "/placeholder.png"}
            alt={anime.title}
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-75"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

          {/* Top Badges Row */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
            {/* VF Badge (probablement seulement pour anime, mais gardé pour la complétude) */}
            {anime.is_french && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.03 + 0.2, type: "spring" }}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-white shadow-lg uppercase tracking-wider border border-white/20"
              >
                VF
              </motion.div>
            )}

            {/* Score Badge */}
            {anime.score > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.03 + 0.3, type: "spring" }}
                className="ml-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xl border border-slate-200 dark:border-slate-700"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {anime.score.toFixed(1)}
                </span>
              </motion.div>
            )}
          </div>

          {/* Status Badge Bottom Left */}
          {anime.status && (
            <div
              className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider backdrop-blur-md border ${getStatusBadge()} z-10`}
            >
              {/* Logique de traduction des statuts */}
              {anime.status === "Currently Airing" ||
              anime.status === "Publishing"
                ? "En cours"
                : anime.status === "Finished Airing" ||
                  anime.status === "Finished"
                ? "Terminé"
                : anime.status === "Not yet aired" ||
                  anime.status === "Not yet published"
                ? "À venir"
                : anime.status}
            </div>
          )}

          {/* Rank Badge Bottom Right */}
          {anime.rank && anime.rank <= 100 && (
            <div className="absolute bottom-3 right-3 bg-gradient-to-br from-amber-400 to-orange-500 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg border border-amber-300 z-10">
              <Award className="w-3 h-3 text-white" />
              <span className="text-[10px] font-black text-white">
                #{anime.rank}
              </span>
            </div>
          )}

          {/* Play Button Hover (ajusté pour ne pas afficher le PlayCircle pour un manga si mediaType est 'manga') */}
          {anime.mediaType === "anime" && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
              <motion.div
                initial={{ scale: 0 }}
                whileHover={{ scale: 1.1 }}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-500/50 border-4 border-white/20"
              >
                <PlayCircle
                  size={32}
                  fill="currentColor"
                  className="text-white"
                />
              </motion.div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-grow relative z-10 bg-white dark:bg-slate-900">
          {/* Title */}
          <h3
            className="font-black text-slate-800 dark:text-white text-[15px] leading-tight mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-500 transition-all duration-300 min-h-[40px]"
            title={anime.title}
          >
            {anime.title}
          </h3>

          {/* Genres Pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {anime.genres?.slice(0, 3).map((genre, i) => (
              <motion.span
                key={genre}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 + 0.1 + i * 0.05 }}
                className="text-[9px] uppercase font-extrabold px-2 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 text-indigo-600 dark:text-indigo-300 rounded-md border border-indigo-200/50 dark:border-indigo-500/20"
              >
                {genre}
              </motion.span>
            ))}
          </div>

          {/* Description */}
          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed font-medium flex-grow">
            {anime.description || "Aucun synopsis disponible pour le moment."}
          </p>

          {/* Studio Badge */}
          {anime.studios?.[0] && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate uppercase tracking-wide">
                {anime.studios[0]}
              </span>
            </div>
          )}

          {/* Footer Info Grid */}
          <div className="pt-3 mt-auto border-t border-slate-200 dark:border-slate-700/50 grid grid-cols-2 gap-2">
            {/* Year & Season */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <Calendar className="w-3 h-3 text-indigo-400" />
              <span>
                {anime.season && anime.year
                  ? `${anime.season} ${anime.year}`
                  : anime.year
                  ? anime.year
                  : anime.start_date
                  ? new Date(anime.start_date).getFullYear()
                  : "TBA"}
              </span>
            </div>

            {/* Episodes (ou Chapters/Volumes pour un manga) */}
            {anime.episodes && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 justify-end">
                {anime.mediaType === "anime" ? (
                  <Film className="w-3 h-3 text-purple-400" />
                ) : (
                  <Layers className="w-3 h-3 text-purple-400" /> // Icône alternative pour manga
                )}
                <span>
                  {anime.episodes}{" "}
                  {anime.mediaType === "anime" ? "ép" : "ch/vol"}
                </span>
              </div>
            )}

            {/* Type */}
            {anime.type && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <Tv className="w-3 h-3 text-pink-400" />
                <span>{anime.type}</span>
              </div>
            )}

            {/* Members/Popularity */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 justify-end">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>
                {anime.members
                  ? `${(anime.members / 1000).toFixed(0)}K`
                  : `#${anime.popularity}`}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
