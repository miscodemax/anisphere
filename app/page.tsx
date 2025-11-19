"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { decompressBase64 } from "@/utils/compress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Tv,
  Star,
  Calendar,
  PlayCircle,
  Layers,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  Sparkles,
} from "lucide-react";

// Types
interface Anime {
  id: number;
  title: string;
  score: number;
  popularity: number;
  image_url: string;
  description: string;
  start_date: string;
  genres: string[];
  studios: string[];
  demographic: string;
  is_french: boolean;
  episodes?: number;
  status?: string;
}

// ==================== COMPOSANT CARTE ANIME ====================
// ==================== CARTE ANIME PREMIUM ====================
const AnimeCard = ({ anime, index }: { anime: Anime; index: number }) => {
  const getStatusBadge = () => {
    if (!anime.status) return null;
    const colors = {
      "Currently Airing": "bg-green-500/20 text-green-400 border-green-500/30",
      "Finished Airing": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Not yet aired": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return (
      colors[anime.status as keyof typeof colors] ||
      "bg-slate-500/20 text-slate-400 border-slate-500/30"
    );
  };

  return (
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
      className="group relative bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col backdrop-blur-sm"
    >
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
          {/* VF Badge */}
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
            {anime.status === "Currently Airing"
              ? "En cours"
              : anime.status === "Finished Airing"
              ? "Terminé"
              : anime.status === "Not yet aired"
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

        {/* Play Button Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <motion.div
            initial={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-500/50 border-4 border-white/20"
          >
            <PlayCircle size={32} fill="currentColor" className="text-white" />
          </motion.div>
        </div>
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

          {/* Episodes */}
          {anime.episodes && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 justify-end">
              <Film className="w-3 h-3 text-purple-400" />
              <span>{anime.episodes} ép</span>
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
  );
};

// ==================== SKELETON ====================
const SkeletonCard = () => (
  <div className="bg-white dark:bg-[#151f2e] rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 h-full animate-pulse flex flex-col">
    <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 w-full" />
    <div className="p-4 space-y-3 flex-grow">
      <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4" />
      <div className="flex gap-1">
        <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-10" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-14" />
      </div>
      <div className="space-y-1 pt-2">
        <div className="h-2 bg-slate-200 dark:bg-slate-700/50 rounded w-full" />
        <div className="h-2 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3" />
      </div>
    </div>
  </div>
);

// ==================== COMPOSANT PRINCIPAL ====================
export default function AnimePage() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("anime_nouveautes");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filtres
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedEpisodes, setSelectedEpisodes] = useState<string>("all");
  const [selectedEra, setSelectedEra] = useState<string>("all");

  const ITEMS_PER_PAGE = 18;

  const categories = [
    { id: "anime_nouveautes", label: "Nouveautés", icon: Sparkles },
    { id: "anime_shonen", label: "Shonen" },
    { id: "anime_seinen", label: "Seinen" },
    { id: "anime_shoujo", label: "Shoujo" },
    { id: "anime_josei", label: "Josei" },
  ];

  const genres = [
    "all",
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Slice of Life",
    "Sports",
    "Supernatural",
    "Thriller",
  ];

  const episodeRanges = [
    { value: "all", label: "Tous" },
    { value: "1-12", label: "1-12 épisodes" },
    { value: "13-24", label: "13-24 épisodes" },
    { value: "25-50", label: "25-50 épisodes" },
    { value: "50+", label: "50+ épisodes" },
  ];

  const eras = [
    { value: "all", label: "Toutes périodes" },
    { value: "2020s", label: "Années 2020+" },
    { value: "2010s", label: "Années 2010" },
    { value: "2000s", label: "Années 2000" },
    { value: "oldschool", label: "Old School (90s-)" },
  ];

  // Fetch data avec Supabase
  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(selectedCategory)
          .select("*")
          .order("start_date", { ascending: false, nullsFirst: false })
          .order("members", { ascending: false });

        if (error) throw error;

        const processed: Anime[] = [];

        for (const anime of data || []) {
          let finalDescription = "";
          let isFrench = false;

          // Logique description FR > EN
          try {
            if (anime.description_fr) {
              const decodedFr = decompressBase64(anime.description_fr);
              if (decodedFr && decodedFr.trim().length > 0) {
                finalDescription = decodedFr;
                isFrench = true;
              }
            }
          } catch (err) {
            // Silence
          }

          if (!finalDescription) {
            try {
              const decodedEn = decompressBase64(anime.description);
              finalDescription = decodedEn || anime.description || "";
            } catch {
              finalDescription = anime.description || "";
            }
          }

          processed.push({
            ...anime,
            description: finalDescription,
            is_french: isFrench,
          });
        }

        setAnimes(processed);
      } catch (err) {
        console.error("Erreur Supabase:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    setCurrentPage(1);
  }, [selectedCategory]);

  // Filtrage des animes
  const filteredAnimes = useMemo(() => {
    let filtered = [...animes];

    // Filtre Genre
    if (selectedGenre !== "all") {
      filtered = filtered.filter((anime) =>
        anime.genres?.some(
          (g) => g.toLowerCase() === selectedGenre.toLowerCase()
        )
      );
    }

    // Filtre Episodes
    if (selectedEpisodes !== "all") {
      filtered = filtered.filter((anime) => {
        const eps = anime.episodes || 0;
        if (selectedEpisodes === "1-12") return eps >= 1 && eps <= 12;
        if (selectedEpisodes === "13-24") return eps >= 13 && eps <= 24;
        if (selectedEpisodes === "25-50") return eps >= 25 && eps <= 50;
        if (selectedEpisodes === "50+") return eps > 50;
        return true;
      });
    }

    // Filtre Ère
    if (selectedEra !== "all") {
      filtered = filtered.filter((anime) => {
        if (!anime.start_date) return false;
        const year = new Date(anime.start_date).getFullYear();
        if (selectedEra === "2020s") return year >= 2020;
        if (selectedEra === "2010s") return year >= 2010 && year < 2020;
        if (selectedEra === "2000s") return year >= 2000 && year < 2010;
        if (selectedEra === "oldschool") return year < 2000;
        return true;
      });
    }

    return filtered;
  }, [animes, selectedGenre, selectedEpisodes, selectedEra]);

  // Pagination
  const totalPages = Math.ceil(filteredAnimes.length / ITEMS_PER_PAGE);
  const paginatedAnimes = filteredAnimes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const hasActiveFilters =
    selectedGenre !== "all" ||
    selectedEpisodes !== "all" ||
    selectedEra !== "all";

  const clearFilters = () => {
    setSelectedGenre("all");
    setSelectedEpisodes("all");
    setSelectedEra("all");
  };

  return (
    <div className="min-h-screen bg-[#EDF1F5] dark:bg-[#0B1622] text-slate-900 dark:text-slate-100 p-4 md:p-10 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <div className="max-w-[1400px] mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#5C728A] dark:text-[#E5EBF1] mb-2">
              Catalogue Anime
            </h1>
            <p className="text-[#9299A1] font-medium text-lg">
              {filteredAnimes.length} anime
              {filteredAnimes.length > 1 ? "s" : ""} disponible
              {filteredAnimes.length > 1 ? "s" : ""}
            </p>
          </div>

          {/* Categories */}
          <div className="flex p-1 bg-white dark:bg-[#151f2e] rounded-lg shadow-sm overflow-x-auto max-w-full no-scrollbar border border-slate-200 dark:border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? "bg-indigo-500 text-white shadow-md transform scale-105"
                    : "text-[#9299A1] hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-[#1f2b3b]"
                }`}
              >
                {cat.icon && <cat.icon size={16} />}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-[#151f2e] rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-indigo-500" />
              <h2 className="font-bold text-lg">Filtres</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-2 text-xs px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-1"
                >
                  <X size={12} />
                  Réinitialiser
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden text-sm text-indigo-500 font-semibold"
            >
              {showFilters ? "Masquer" : "Afficher"}
            </button>
          </div>

          <motion.div
            initial={false}
            animate={{
              height: showFilters || window.innerWidth >= 768 ? "auto" : 0,
            }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Genre */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-300">
                  Genre
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => {
                    setSelectedGenre(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1622] border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {genres.map((genre) => (
                    <option key={genre} value={genre === "all" ? "all" : genre}>
                      {genre === "all" ? "Tous les genres" : genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre d'épisodes */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-300">
                  Nombre d'épisodes
                </label>
                <select
                  value={selectedEpisodes}
                  onChange={(e) => {
                    setSelectedEpisodes(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1622] border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {episodeRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Période */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-300">
                  Période
                </label>
                <select
                  value={selectedEra}
                  onChange={(e) => {
                    setSelectedEra(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1622] border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {eras.map((era) => (
                    <option key={era.value} value={era.value}>
                      {era.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-8"
        >
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={`skel-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SkeletonCard />
                </motion.div>
              ))
            ) : paginatedAnimes.length > 0 ? (
              paginatedAnimes.map((anime, index) => (
                <AnimeCard
                  key={`${anime.id}-${currentPage}`}
                  anime={anime}
                  index={index}
                />
              ))
            ) : (
              <motion.div className="col-span-full py-32 text-center">
                <div className="inline-block p-6 rounded-full bg-slate-200 dark:bg-[#151f2e] mb-4">
                  <Layers className="text-slate-400" size={48} />
                </div>
                <p className="font-medium text-slate-500 text-lg mb-2">
                  Aucun résultat trouvé
                </p>
                <p className="text-sm text-slate-400">
                  Essayez de modifier vos filtres
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {!loading && paginatedAnimes.length > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 flex items-center justify-center gap-3"
          >
            {/* Bouton Précédent */}
            <button
              onClick={() => {
                setCurrentPage((prev) => Math.max(1, prev - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === 1}
              className={`group relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                currentPage === 1
                  ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  : "bg-white dark:bg-[#151f2e] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 shadow-md hover:shadow-xl hover:-translate-x-1 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <ChevronLeft
                size={20}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              <span>Précédent</span>
            </button>

            {/* Indicateur de page */}
            <div className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#151f2e] rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Page
              </span>
              <span className="text-lg font-black text-indigo-500 dark:text-indigo-400">
                {currentPage}
              </span>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                sur
              </span>
              <span className="text-lg font-black text-slate-700 dark:text-slate-300">
                {totalPages}
              </span>
            </div>

            {/* Bouton Suivant */}
            <button
              onClick={() => {
                setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === totalPages}
              className={`group relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                currentPage === totalPages
                  ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-xl hover:translate-x-1"
              }`}
            >
              <span>Suivant</span>
              <ChevronRight
                size={20}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
