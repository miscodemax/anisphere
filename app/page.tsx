"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AnimeCard from "./components/AnimeCard";
import {
  Search,
  TrendingUp,
  Star,
  Calendar,
  ChevronRight,
  Sparkles,
  Flame,
  Trophy,
  Zap,
  BookOpen,
  Film,
  Clock,
  ChevronLeft,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";

// --- Interfaces ---
interface MediaItem {
  id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  score: number;
  popularity: number;
  members: number;
  rank?: number;
  image_url: string;
  description?: string;
  description_fr?: string;
  start_date?: string;
  end_date?: string;
  year?: number;
  season?: string;
  genres: string[];
  themes?: string[];
  studios?: string[];
  authors?: string[];
  serializations?: string[];
  demographic?: string | null;
  episodes?: number;
  chapters?: number;
  volumes?: number;
  type?: string;
  status?: string;
  rating?: string;
  mediaType: "anime" | "manga";
  cosine_score?: number;
  is_french?: boolean;
}

interface SearchResult {
  id: number;
  title: string;
  image_url: string;
  score: number;
  year: number;
  cosine_score: number;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"anime" | "manga">("anime");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // States pour les animes
  const [trendingAnimes, setTrendingAnimes] = useState<MediaItem[]>([]);
  const [topRatedAnimes, setTopRatedAnimes] = useState<MediaItem[]>([]);
  const [seasonalAnimes, setSeasonalAnimes] = useState<MediaItem[]>([]);
  const [popularAnimes, setPopularAnimes] = useState<MediaItem[]>([]);
  const [upcomingAnimes, setUpcomingAnimes] = useState<MediaItem[]>([]);
  const [recentAnimes, setRecentAnimes] = useState<MediaItem[]>([]);

  // States pour les mangas
  const [trendingMangas, setTrendingMangas] = useState<MediaItem[]>([]);
  const [topRatedMangas, setTopRatedMangas] = useState<MediaItem[]>([]);
  const [popularMangas, setPopularMangas] = useState<MediaItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs pour les sliders
  const upcomingSliderRef = useRef<HTMLDivElement>(null);
  const recentSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContent();
  }, []);

  // Fermer les résultats de recherche en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche en temps réel avec debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/semantic-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            matchCount: 10,
            minSimilarity: 0.35,
          }),
        });

        const data = await res.json();
        setSearchResults(data.results || []);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const loadContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();

      // Chargement PARALLÈLE des animes
      const animePromises = [
        fetch("/api/animes?sortBy=popularity&sortOrder=asc&perPage=12").then(
          (r) => r.json()
        ),
        fetch(
          "/api/animes?sortBy=score&sortOrder=desc&perPage=12&minScore=7.5"
        ).then((r) => r.json()),
        fetch(
          `/api/animes?sortBy=start_date&sortOrder=desc&perPage=12&yearMin=${currentYear}`
        ).then((r) => r.json()),
        fetch("/api/animes?sortBy=members&sortOrder=desc&perPage=12").then(
          (r) => r.json()
        ),
        fetch(
          `/api/animes?status=Not yet aired&sortBy=start_date&sortOrder=asc&perPage=15`
        ).then((r) => r.json()),
        fetch(
          `/api/animes?sortBy=start_date&sortOrder=desc&perPage=15&yearMin=${currentYear}`
        ).then((r) => r.json()),
      ];

      // Chargement PARALLÈLE des mangas
      const mangaPromises = [
        fetch("/api/mangas?sortBy=popularity&sortOrder=asc&perPage=12").then(
          (r) => r.json()
        ),
        fetch(
          "/api/mangas?sortBy=score&sortOrder=desc&perPage=12&minScore=7.5"
        ).then((r) => r.json()),
        fetch("/api/mangas?sortBy=members&sortOrder=desc&perPage=12").then(
          (r) => r.json()
        ),
      ];

      const [
        trendingAnimeData,
        topAnimeData,
        seasonalData,
        popularAnimeData,
        upcomingData,
        recentData,
        trendingMangaData,
        topMangaData,
        popularMangaData,
      ] = await Promise.all([...animePromises, ...mangaPromises]);

      const mapAnime = (anime: any): MediaItem => ({
        ...anime,
        mediaType: "anime" as const,
        description: anime.description || anime.description_fr || "",
        studios: anime.studios || [],
        genres: anime.genres || [],
        themes: anime.themes || [],
        is_french: false,
      });

      setTrendingAnimes((trendingAnimeData.animes || []).map(mapAnime));
      setTopRatedAnimes((topAnimeData.animes || []).map(mapAnime));
      setSeasonalAnimes((seasonalData.animes || []).map(mapAnime));
      setPopularAnimes((popularAnimeData.animes || []).map(mapAnime));
      setUpcomingAnimes((upcomingData.animes || []).map(mapAnime));
      setRecentAnimes((recentData.animes || []).map(mapAnime));

      const mapManga = (manga: any): MediaItem => ({
        ...manga,
        mediaType: "manga" as const,
        description: manga.description || manga.description_fr || "",
        studios: manga.authors || [],
        genres: manga.genres || [],
        themes: manga.themes || [],
        is_french: false,
      });

      setTrendingMangas((trendingMangaData.mangas || []).map(mapManga));
      setTopRatedMangas((topMangaData.mangas || []).map(mapManga));
      setPopularMangas((popularMangaData.mangas || []).map(mapManga));
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setError("Impossible de charger le contenu. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: any) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/${activeTab}?q=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  const scroll = (
    ref: React.RefObject<HTMLDivElement>,
    direction: "left" | "right"
  ) => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const scrollSearchResults = (direction: "left" | "right") => {
    if (searchResultsRef.current) {
      const scrollAmount = direction === "left" ? -250 : 250;
      searchResultsRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // --- Composants Internes ---

  const SearchResultCard = ({ result }: { result: SearchResult }) => (
    <Link href={`/anime/${result.id}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="flex-shrink-0 w-32 sm:w-36 bg-slate-800/80 backdrop-blur-md rounded-xl overflow-hidden border border-slate-700/50 hover:border-pink-500/50 transition-all cursor-pointer group"
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={result.image_url}
            alt={result.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />
          {result.cosine_score && (
            <div className="absolute top-1.5 right-1.5 bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-lg">
              {Math.round(result.cosine_score * 100)}%
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <h3 className="text-white font-bold text-[11px] line-clamp-2 group-hover:text-pink-400 transition-colors leading-tight">
              {result.title}
            </h3>
            {result.score && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                <span className="text-[9px] text-slate-300 font-medium">
                  {result.score.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );

  const SliderCard = ({ item }: { item: MediaItem }) => (
    <Link href={`/anime/${item.id}`}>
      <motion.div
        whileHover={{ y: -8, scale: 1.03 }}
        className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-xl cursor-pointer border border-slate-700/50 hover:border-pink-500/50 transition-all w-36 sm:w-44 flex-shrink-0"
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          {item.score && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 fill-current" />
              {item.score.toFixed(1)}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-bold text-white text-xs line-clamp-2 group-hover:text-pink-400 transition-colors">
              {item.title}
            </h3>
            {item.start_date && (
              <p className="text-slate-300 text-[10px] mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.start_date).toLocaleDateString("fr-FR", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );

  const Slider = ({
    title,
    items,
    icon: Icon,
    sliderRef,
  }: {
    title: string;
    items: MediaItem[];
    icon: any;
    sliderRef: React.RefObject<HTMLDivElement>;
  }) => {
    if (!items || items.length === 0) return null;

    return (
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 sm:mb-14"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-4 sm:px-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
              <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll(sliderRef, "left")}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll(sliderRef, "right")}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={sliderRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-4 sm:px-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item, i) => (
              <SliderCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </motion.section>
    );
  };

  const Section = ({
    title,
    items,
    icon: Icon,
    gradient,
    emoji,
  }: {
    title: string;
    items: MediaItem[];
    icon: any;
    gradient: string;
    emoji: string;
  }) => {
    if (!items || items.length === 0) return null;

    return (
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 sm:mb-16"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 px-4 sm:px-0 gap-3 sm:gap-0">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} shadow-lg flex-shrink-0`}
            >
              <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{emoji}</span>
                <span>{title}</span>
              </h2>
              <p className="text-[10px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {items.length} {activeTab === "anime" ? "animes" : "mangas"}{" "}
                disponibles
              </p>
            </div>
          </motion.div>
          <Link
            href={`/${activeTab}`}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all font-bold text-xs sm:text-sm group shadow-lg hover:shadow-xl self-start sm:self-auto"
          >
            <span>Voir tout</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 px-4 sm:px-0">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <AnimeCard key={item.id} anime={item} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </motion.section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      {/* Hero Section Ultra Moderne */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full mb-4 sm:mb-8 border border-white/30 shadow-2xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
              </motion.div>
              <span className="text-white font-bold text-xs sm:text-sm">
                Des milliers d'œuvres à découvrir
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white mb-3 sm:mb-6 leading-tight px-2"
            >
              Votre univers
              <br />
              <motion.span
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent bg-[length:200%_auto]"
              >
                Anime & Manga
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 font-medium max-w-2xl mx-auto leading-relaxed px-4"
            >
              Explorez, découvrez et suivez vos séries et mangas préférés en un
              seul endroit
            </motion.p>

            {/* Search Bar Premium avec résultats en temps réel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-3xl mx-auto mb-6 sm:mb-8 relative px-4"
            >
              <div className="relative group">
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity"
                />
                <div className="relative">
                  <Search className="absolute left-3 sm:left-5 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() =>
                      searchQuery.length >= 2 && setShowSearchResults(true)
                    }
                    placeholder="Recherche intelligente..."
                    className="w-full pl-10 sm:pl-14 md:pl-16 pr-20 sm:pr-28 md:pr-40 py-3 sm:py-5 md:py-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-white/50 dark:focus:ring-indigo-500/50 transition-all text-sm sm:text-base md:text-lg font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchResults(false);
                      }}
                      className="absolute right-16 sm:right-24 md:right-36 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                  {searchLoading && (
                    <div className="absolute right-16 sm:right-24 md:right-36 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Tabs Switcher */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="inline-flex gap-2 sm:gap-3 bg-white/10 backdrop-blur-md p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-white/20"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("anime")}
                className={`relative px-4 sm:px-8 md:px-10 py-2.5 sm:py-3.5 md:py-4 rounded-lg sm:rounded-xl font-bold transition-all text-xs sm:text-sm md:text-base overflow-hidden ${
                  activeTab === "anime"
                    ? "text-indigo-600"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {activeTab === "anime" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white shadow-2xl"
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                  <Film className="w-3 h-3 sm:w-4 sm:h-4" />
                  Animes
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("manga")}
                className={`relative px-4 sm:px-8 md:px-10 py-2.5 sm:py-3.5 md:py-4 rounded-lg sm:rounded-xl font-bold transition-all text-xs sm:text-sm md:text-base overflow-hidden ${
                  activeTab === "manga"
                    ? "text-indigo-600"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {activeTab === "manga" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white shadow-2xl"
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  Mangas
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Le SVG Wave Separator */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-0 left-0 right-0"
        >
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              fill="currentColor"
              className="text-slate-50 dark:text-slate-950"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </motion.div>
      </div>

      {/* Résultats de recherche en slider horizontal - Positionnés sous le hero */}
      <AnimatePresence>
        {showSearchResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto px-4 py-4 sm:py-6 relative z-30 -mt-4 sm:-mt-8"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                  <span className="text-xs sm:text-sm font-bold text-white">
                    Résultats intelligents ({searchResults.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollSearchResults("left")}
                    className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => scrollSearchResults("right")}
                    className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-all ml-2"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
              <div
                ref={searchResultsRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth p-3 sm:p-4"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {searchResults.map((result) => (
                  <SearchResultCard key={result.id} result={result} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Main Content Section --- */}
      <div className="container mx-auto py-6 sm:py-8 md:py-12 pb-16 sm:pb-20 relative z-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 min-h-[50vh]">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium animate-pulse text-sm sm:text-base">
              Chargement de votre univers...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 min-h-[50vh] px-4">
            <div className="bg-red-500/10 p-3 sm:p-4 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
              Oups !
            </h3>
            <p className="text-slate-500 text-center max-w-md text-sm sm:text-base px-4">
              {error}
            </p>
            <button
              onClick={loadContent}
              className="mt-6 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              Réessayer
            </button>
          </div>
        ) : (
          /* Affichage conditionnel selon l'onglet actif */
          <div className="space-y-8 sm:space-y-12">
            {activeTab === "anime" ? (
              <motion.div
                key="anime-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Sliders Horizontaux */}
                <Slider
                  title="Sorties récentes"
                  items={upcomingAnimes}
                  icon={Clock}
                  sliderRef={upcomingSliderRef}
                />
                <Slider
                  title="À venir prochainement"
                  items={recentAnimes}
                  icon={Sparkles}
                  sliderRef={recentSliderRef}
                />

                {/* Grilles de contenu */}
                <Section
                  title="Tendances du moment"
                  items={trendingAnimes}
                  icon={TrendingUp}
                  gradient="from-orange-400 to-red-500"
                  emoji="🔥"
                />
                <Section
                  title="Saison en cours"
                  items={seasonalAnimes}
                  icon={Calendar}
                  gradient="from-green-400 to-emerald-500"
                  emoji="🍃"
                />
                <Section
                  title="Les plus populaires"
                  items={popularAnimes}
                  icon={Flame}
                  gradient="from-red-500 to-pink-500"
                  emoji="❤️"
                />
                <Section
                  title="Les mieux notés"
                  items={topRatedAnimes}
                  icon={Trophy}
                  gradient="from-yellow-400 to-amber-500"
                  emoji="🏆"
                />
              </motion.div>
            ) : (
              <motion.div
                key="manga-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Sections Manga */}
                <Section
                  title="Mangas Tendance"
                  items={trendingMangas}
                  icon={TrendingUp}
                  gradient="from-blue-400 to-indigo-500"
                  emoji="📈"
                />
                <Section
                  title="Mangas Populaires"
                  items={popularMangas}
                  icon={Flame}
                  gradient="from-purple-400 to-fuchsia-500"
                  emoji="🌟"
                />
                <Section
                  title="Les Chefs-d'œuvre"
                  items={topRatedMangas}
                  icon={Trophy}
                  gradient="from-yellow-400 to-amber-500"
                  emoji="👑"
                />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
