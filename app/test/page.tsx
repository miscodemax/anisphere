"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { decompressBase64 } from "@/utils/compress";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  Film,
  Tv,
  Award,
  Clock,
  Hash,
  Search,
} from "lucide-react";

// ==================== TYPES ====================
interface Anime {
  id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  score: number;
  popularity: number;
  members: number;
  favorites: number;
  rank: number;
  image_url: string;
  description: string;
  start_date: string;
  end_date?: string;
  year?: number;
  season?: string;
  genres: string[];
  themes?: string[];
  studios: string[];
  demographic: string;
  is_french: boolean;
  episodes?: number;
  type?: string;
  status?: string;
  rating?: string;
  source?: string;
}

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
  <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-full animate-pulse">
    <div className="aspect-[2/3] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4" />
      <div className="flex gap-1.5">
        <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-12" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-16" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-4/5" />
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
  const [searchQuery, setSearchQuery] = useState("");

  // Filtres
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEpisodes, setSelectedEpisodes] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);

  const ITEMS_PER_PAGE = 18;

  const categories = [
    {
      id: "anime_nouveautes",
      label: "🔥 Nouveautés",
      gradient: "from-orange-500 to-red-500",
    },
    {
      id: "anime_shonen",
      label: "⚔️ Shonen",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "anime_seinen",
      label: "🎭 Seinen",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "anime_shoujo",
      label: "🌸 Shoujo",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      id: "anime_josei",
      label: "💎 Josei",
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  const allGenres = [
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
    "Mecha",
    "Music",
  ];
  const types = ["all", "TV", "Movie", "OVA", "ONA", "Special"];
  const statuses = [
    "all",
    "Currently Airing",
    "Finished Airing",
    "Not yet aired",
  ];
  const episodeRanges = [
    { value: "all", label: "Tous" },
    { value: "1-12", label: "Court (1-12)" },
    { value: "13-26", label: "Moyen (13-26)" },
    { value: "27-52", label: "Long (27-52)" },
    { value: "52+", label: "Très long (52+)" },
  ];
  const years = [
    "all",
    "2024",
    "2023",
    "2022",
    "2021",
    "2020",
    "2019",
    "2018",
    "2017",
    "2016",
    "2015",
    "2010s",
    "2000s",
    "90s",
  ];

  // Fetch avec Supabase
  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(selectedCategory)
          .select("*")
          .order("start_date", { ascending: false, nullsFirst: false })
          .order("score", { ascending: false })
          .order("members", { ascending: false })
          .limit(200);

        if (error) throw error;

        const processed: Anime[] = [];

        for (const anime of data || []) {
          let finalDescription = "";
          let isFrench = false;

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

  // Filtrage intelligent
  const filteredAnimes = useMemo(() => {
    let filtered = [...animes];

    // Recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (anime) =>
          anime.title.toLowerCase().includes(query) ||
          anime.title_english?.toLowerCase().includes(query) ||
          anime.title_japanese?.toLowerCase().includes(query)
      );
    }

    // Genre
    if (selectedGenre !== "all") {
      filtered = filtered.filter((anime) =>
        anime.genres?.some(
          (g) => g.toLowerCase() === selectedGenre.toLowerCase()
        )
      );
    }

    // Type
    if (selectedType !== "all") {
      filtered = filtered.filter((anime) => anime.type === selectedType);
    }

    // Status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((anime) => anime.status === selectedStatus);
    }

    // Episodes
    if (selectedEpisodes !== "all") {
      filtered = filtered.filter((anime) => {
        const eps = anime.episodes || 0;
        if (selectedEpisodes === "1-12") return eps >= 1 && eps <= 12;
        if (selectedEpisodes === "13-26") return eps >= 13 && eps <= 26;
        if (selectedEpisodes === "27-52") return eps >= 27 && eps <= 52;
        if (selectedEpisodes === "52+") return eps > 52;
        return true;
      });
    }

    // Année
    if (selectedYear !== "all") {
      filtered = filtered.filter((anime) => {
        const animeYear =
          anime.year ||
          (anime.start_date ? new Date(anime.start_date).getFullYear() : 0);
        if (selectedYear === "2010s")
          return animeYear >= 2010 && animeYear < 2020;
        if (selectedYear === "2000s")
          return animeYear >= 2000 && animeYear < 2010;
        if (selectedYear === "90s")
          return animeYear >= 1990 && animeYear < 2000;
        return animeYear.toString() === selectedYear;
      });
    }

    // Score minimum
    if (minScore > 0) {
      filtered = filtered.filter((anime) => (anime.score || 0) >= minScore);
    }

    return filtered;
  }, [
    animes,
    searchQuery,
    selectedGenre,
    selectedType,
    selectedStatus,
    selectedEpisodes,
    selectedYear,
    minScore,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAnimes.length / ITEMS_PER_PAGE);
  const paginatedAnimes = filteredAnimes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const hasActiveFilters =
    selectedGenre !== "all" ||
    selectedType !== "all" ||
    selectedStatus !== "all" ||
    selectedEpisodes !== "all" ||
    selectedYear !== "all" ||
    minScore > 0 ||
    searchQuery.trim() !== "";

  const clearFilters = () => {
    setSelectedGenre("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedEpisodes("all");
    setSelectedYear("all");
    setMinScore(0);
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-12 md:py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-4 drop-shadow-2xl">
              Catalogue Anime
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-lg">
              Découvrez {filteredAnimes.length} anime
              {filteredAnimes.length > 1 ? "s" : ""} extraordinaires
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher un anime par titre..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-white/20 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 font-medium text-lg focus:outline-none focus:ring-4 focus:ring-white/30 focus:border-white/40 transition-all shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {categories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 backdrop-blur-md border-2 ${
                  selectedCategory === cat.id
                    ? `bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl scale-110 border-white/40 dark:border-slate-700`
                    : "bg-white/10 text-white hover:bg-white/20 border-white/20 hover:border-white/40 hover:scale-105"
                }`}
              >
                {cat.label}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        {/* Advanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-black text-xl text-slate-800 dark:text-white">
                Filtres Avancés
              </h2>
              {hasActiveFilters && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={clearFilters}
                  className="px-4 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm font-bold"
                >
                  <X size={14} />
                  Réinitialiser
                </motion.button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
            >
              {showFilters ? "Masquer" : "Afficher"}
            </button>
          </div>

          <motion.div
            initial={false}
            animate={{
              height: showFilters || window.innerWidth >= 1024 ? "auto" : 0,
            }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Genre */}
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">
                  📚 Genre
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => {
                    setSelectedGenre(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  {allGenres.map((g) => (
                    <option key={g} value={g}>
                      {g === "all" ? "Tous" : g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">
                  📺 Format
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "Tous" : t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">
                  🎬 Statut
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s === "all"
                        ? "Tous"
                        : s === "Currently Airing"
                        ? "En cours"
                        : s === "Finished Airing"
                        ? "Terminé"
                        : s === "Not yet aired"
                        ? "À venir"
                        : s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Épisodes */}
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">
                  🎞️ Épisodes
                </label>
                <select
                  value={selectedEpisodes}
                  onChange={(e) => {
                    setSelectedEpisodes(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  {episodeRanges.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Année */}
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">
                  📅 Année
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y === "all" ? "Toutes" : y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Score Minimum */}
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">
                  ⭐ Score Min: {minScore > 0 ? minScore.toFixed(1) : "Tous"}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minScore}
                  onChange={(e) => {
                    setMinScore(parseFloat(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Results Counter */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                <span className="text-indigo-600 dark:text-indigo-400 text-lg font-black">
                  {filteredAnimes.length}
                </span>{" "}
                résultat{filteredAnimes.length > 1 ? "s" : ""} trouvé
                {filteredAnimes.length > 1 ? "s" : ""}
              </p>
            </div>
            {totalPages > 1 && (
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Page{" "}
                <span className="text-indigo-600 dark:text-indigo-400 font-black">
                  {currentPage}
                </span>{" "}
                / {totalPages}
              </p>
            )}
          </motion.div>
        )}

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-32 text-center"
              >
                <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 mb-6 shadow-xl">
                  <Layers
                    className="text-slate-400 dark:text-slate-600"
                    size={64}
                  />
                </div>
                <h3 className="text-2xl font-black text-slate-700 dark:text-slate-300 mb-3">
                  Aucun résultat trouvé
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  Essayez de modifier vos filtres ou votre recherche pour
                  découvrir plus d'animes
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {!loading && paginatedAnimes.length > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-col items-center gap-6"
          >
            {/* Boutons Navigation */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                onClick={() => {
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === 1}
                className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base transition-all duration-300 shadow-lg ${
                  currentPage === 1
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    : "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:shadow-2xl hover:-translate-x-2 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600"
                }`}
              >
                <ChevronLeft
                  size={24}
                  className="transition-transform group-hover:-translate-x-1"
                />
                <span>Précédent</span>
              </motion.button>

              {/* Page Indicator */}
              <div className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-2xl">
                <span className="text-base font-bold text-white/80">Page</span>
                <span className="text-3xl font-black text-white">
                  {currentPage}
                </span>
                <span className="text-base font-bold text-white/80">sur</span>
                <span className="text-3xl font-black text-white">
                  {totalPages}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                onClick={() => {
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === totalPages}
                className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base transition-all duration-300 shadow-lg ${
                  currentPage === totalPages
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 hover:shadow-2xl hover:translate-x-2"
                }`}
              >
                <span>Suivant</span>
                <ChevronRight
                  size={24}
                  className="transition-transform group-hover:translate-x-1"
                />
              </motion.button>
            </div>

            {/* Quick Page Jump */}
            {totalPages > 3 && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {Array.from(
                  { length: Math.min(totalPages, 10) },
                  (_, i) => i + 1
                ).map((page) => (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                      currentPage === page
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-110"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600"
                    }`}
                  >
                    {page}
                  </motion.button>
                ))}
                {totalPages > 10 && (
                  <>
                    <span className="text-slate-400 font-bold">...</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setCurrentPage(totalPages);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        currentPage === totalPages
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-110"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600"
                      }`}
                    >
                      {totalPages}
                    </motion.button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 py-8 border-t border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Fait avec <span className="text-red-500">❤️</span> pour les fans
            d'anime
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
