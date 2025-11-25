"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase"; // Assurez-vous que le chemin est correct
import { decompressBase64 } from "@/utils/compress"; // Assurez-vous que le chemin est correct
import { motion, AnimatePresence } from "framer-motion";
import AnimeCard from "./components/AnimeCard"; // Assurez-vous que le chemin est correct
import {
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  Sparkles,
  BookOpen,
  Hash,
  Star,
  Zap,
  TrendingUp,
  Heart,
  Search,
  Compass,
  Lightbulb,
} from "lucide-react";
import HeroOnboarding from "./components/HeroOnboarding";
import CrunchyNewsSlider from "./components/CrunchyNewsSlider";
// Import Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

// Types
interface Item {
  id: number;
  title: string;
  score: number;
  popularity: number;
  image_url: string;
  description: string;
  start_date: string;
  genres: string[];
  demographic: string;
  is_french: boolean;
  episodes?: number;
  volumes?: number;
  status?: string;
}

interface MangaFeed {
  shonen: Item[];
  shoujo: Item[];
  seinen: Item[];
  josei: Item[];
  recent: Item[];
  manhwa: Item[];
}

// ==================== UTILS ET SKELETON ====================
const cleanTitleForSelector = (title: string) => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-full animate-pulse">
    <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-800" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4" />
      <div className="flex gap-1">
        <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-10" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-14" />
      </div>
    </div>
  </div>
);

// ==================== MANGA SWIPER ====================
interface MangaSwiperFeedProps {
  title: string;
  items: Item[];
  loading: boolean;
  CardComponent: React.ElementType;
}

const MangaSwiperFeed = ({
  title,
  items,
  loading,
  CardComponent,
}: MangaSwiperFeedProps) => {
  const cleanedTitle = cleanTitleForSelector(title);
  const nextElClass = `.swiper-button-next-${cleanedTitle}`;
  const prevElClass = `.swiper-button-prev-${cleanedTitle}`;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          {title}
        </h2>
        <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
          Voir tout
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="relative">
        <Swiper
          modules={[Navigation]}
          spaceBetween={20}
          slidesPerView={2}
          navigation={{
            nextEl: nextElClass,
            prevEl: prevElClass,
          }}
          breakpoints={{
            640: { slidesPerView: 3, spaceBetween: 20 },
            768: { slidesPerView: 4, spaceBetween: 25 },
            1024: { slidesPerView: 5, spaceBetween: 30 },
            1280: { slidesPerView: 6, spaceBetween: 30 },
          }}
          className="!pb-4"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SwiperSlide key={`skel-${i}`}>
                <SkeletonCard />
              </SwiperSlide>
            ))
          ) : items.length > 0 ? (
            items.map((item, index) => (
              <SwiperSlide key={item.id}>
                <AnimeCard anime={item} index={index} />
              </SwiperSlide>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500">
              Aucun manga trouvé pour cette catégorie.
            </div>
          )}
        </Swiper>

        {/* Navigation Buttons */}
        <button
          className={`${prevElClass.substring(
            1
          )} absolute top-1/2 -left-5 transform -translate-y-1/2 z-10 bg-white dark:bg-slate-900 rounded-full p-3 shadow-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:scale-110 transition-all hidden lg:flex items-center justify-center group`}
        >
          <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </button>
        <button
          className={`${nextElClass.substring(
            1
          )} absolute top-1/2 -right-5 transform -translate-y-1/2 z-10 bg-white dark:bg-slate-900 rounded-full p-3 shadow-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:scale-110 transition-all hidden lg:flex items-center justify-center group`}
        >
          <ChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </button>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function HomePage() {
  const [animes, setAnimes] = useState<Item[]>([]);
  const [loadingAnime, setLoadingAnime] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("anime_nouveautes");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [mangaFeeds, setMangaFeeds] = useState<MangaFeed | null>(null);
  const [loadingMangaFeeds, setLoadingMangaFeeds] = useState(true);

  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedEpisodes, setSelectedEpisodes] = useState<string>("all");
  const [selectedEra, setSelectedEra] = useState<string>("all");

  const ITEMS_PER_PAGE = 18;

  // Categories ANIME - Nouveautés en premier !
  const catalogueCategories = [
    { id: "anime_nouveautes", label: "🔥 Nouveautés", icon: Sparkles },
    { id: "anime_shonen", label: "⚔️ Shonen" },
    { id: "anime_seinen", label: "🎭 Seinen" },
    { id: "anime_shoujo", label: "🌸 Shoujo" },
    { id: "anime_josei", label: "💎 Josei" },
    { id: "anime_catalogue_general", label: "📚 Général", icon: Hash },
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

  const processItemDescriptions = useCallback((data: any[]): Item[] => {
    return data.map((item) => {
      let finalDescription = "";
      let isFrench = false;

      try {
        if (item.description_fr) {
          const decodedFr = decompressBase64(item.description_fr);
          if (decodedFr && decodedFr.trim().length > 0) {
            finalDescription = decodedFr;
            isFrench = true;
          }
        }
      } catch (err) {}

      if (!item.description_fr) {
        try {
          const decodedEn = decompressBase64(item.description);
          finalDescription = decodedEn || item.description || "";
        } catch {
          finalDescription = item.description || "";
        }
      }

      return { ...item, description: finalDescription, is_french: isFrench };
    });
  }, []);

  // Fetch Manga Feeds
  useEffect(() => {
    const supabase = createClient();
    const fetchFeed = async (
      tableName: string,
      limit: number
    ): Promise<Item[]> => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(limit)
          // .order("start_date", { ascending: false, nullsFirst: false })
          .order("members", { ascending: false });

        if (error) throw error;
        return processItemDescriptions(data || []);
      } catch (err) {
        console.error(`Erreur ${tableName}:`, err);
        return [];
      }
    };
    const fetchFeedManhwa = async (
      tableName: string,
      limit: number
    ): Promise<Item[]> => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .eq("type", "Manhwa")
          .limit(limit)
          .order("start_date", { ascending: false, nullsFirst: false });

        if (error) throw error;
        return processItemDescriptions(data || []);
      } catch (err) {
        console.error(`Erreur ${tableName}:`, err);
        return [];
      }
    };

    const fetchAllMangaFeeds = async () => {
      setLoadingMangaFeeds(true);
      const [shonen, shoujo, seinen, josei, recent, manhwa] = await Promise.all(
        [
          fetchFeed("manga_shonen", 100),
          fetchFeed("manga_shoujo", 100),
          fetchFeed("manga_seinen", 100),
          fetchFeed("manga_josei", 100),
          // On utilise manga_nouveautes si elle existe, sinon shonen par défaut pour un feed
          fetchFeed(
            "manga_nouveautes" in supabase
              ? "manga_nouveautes"
              : "manga_catalogue_general",
            200
          ),
          fetchFeedManhwa("manga_catalogue_general", 200),
        ]
      );
      setMangaFeeds({ shonen, shoujo, seinen, josei, recent, manhwa });
      setLoadingMangaFeeds(false);
    };

    fetchAllMangaFeeds();
  }, [processItemDescriptions]);

  // Fetch Anime Catalogue
  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      setLoadingAnime(true);
      try {
        const { data, error } = await supabase
          .from(selectedCategory)
          .select("*")
          .limit(10000)
          .order("start_date", { ascending: false, nullsFirst: false })
          .order("members", { ascending: false });

        if (error) throw error;
        setAnimes(processItemDescriptions(data || []));
      } catch (err) {
        console.error("Erreur Supabase:", err);
      } finally {
        setLoadingAnime(false);
      }
    }

    fetchData();
    setCurrentPage(1);
  }, [selectedCategory, processItemDescriptions]);

  // Filtrage
  const filteredAnimes = useMemo(() => {
    let filtered = [...animes];

    if (selectedGenre !== "all") {
      filtered = filtered.filter((anime) =>
        anime.genres?.some(
          (g) => g.toLowerCase() === selectedGenre.toLowerCase()
        )
      );
    }

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

    if (selectedEra !== "all") {
      filtered = filtered.filter((anime) => {
        if (!anime.start_date) return false;
        const year = Number(anime.start_date.substring(0, 4));
        if (selectedEra === "2020s") return year >= 2020;
        if (selectedEra === "2010s") return year >= 2010 && year < 2020;
        if (selectedEra === "2000s") return year >= 2000 && year < 2010;
        if (selectedEra === "oldschool") return year < 2000;
        return true;
      });
    }

    return filtered;
  }, [animes, selectedGenre, selectedEpisodes, selectedEra]);

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
    <div className="min-h-screen minw-screen px-4">
      {/* ==================== HERO ONBOARDING ==================== */}
      {/* <HeroOnboarding /> */}
      <CrunchyNewsSlider />

      <div className="max-w-[1400px] mx-auto">
        {/* ==================== SECTION ANIME ==================== */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <Star className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">
                  Catalogue Anime
                </h2>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {filteredAnimes.length} anime
                  {filteredAnimes.length > 1 ? "s" : ""} disponible
                  {filteredAnimes.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Categories Anime */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            {catalogueCategories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-xl ${
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white scale-105"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border-2 border-slate-200 dark:border-slate-700"
                }`}
              >
                {cat.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Filtres Anime */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-lg text-slate-800 dark:text-white">
                  Filtres
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center gap-1"
                  >
                    <X size={12} />
                    Réinitialiser
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden text-sm font-bold text-indigo-600 dark:text-indigo-400"
              >
                {showFilters ? "Masquer" : "Afficher"}
              </button>
            </div>

            <motion.div
              initial={false}
              // Afficher les filtres si showFilters est true OU si la taille de l'écran est >= lg (1024px)
              animate={{
                height: showFilters,
              }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-400">
                    📚 Genre
                  </label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => {
                      setSelectedGenre(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g === "all" ? "Tous" : g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-400">
                    🎬 Épisodes
                  </label>
                  <select
                    value={selectedEpisodes}
                    onChange={(e) => {
                      setSelectedEpisodes(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    {episodeRanges.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-400">
                    📅 Période
                  </label>
                  <select
                    value={selectedEra}
                    onChange={(e) => {
                      setSelectedEra(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    {eras.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Grid Anime */}
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {loadingAnime ? (
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
                <div className="col-span-full py-32 text-center">
                  <p className="text-lg font-bold text-slate-500">
                    Aucun résultat trouvé
                  </p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {!loadingAnime && filteredAnimes.length > 0 && totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 flex items-center justify-center gap-4"
            >
              {/* Bouton Précédent */}
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  currentPage === 1
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:shadow-xl hover:-translate-x-1 border-2 border-slate-200 dark:border-slate-700"
                }`}
              >
                <ChevronLeft size={20} />
                Précédent
              </button>

              {/* Indicateur de page */}
              <div className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-xl">
                <span className="text-white font-black text-lg">
                  {currentPage} / {totalPages}
                </span>
              </div>

              {/* Bouton Suivant (Complété) */}
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  currentPage === totalPages
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-xl hover:translate-x-1"
                }`}
              >
                Suivant
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}
        </div>

        {/* ==================== SECTION MANGA ==================== */}
        <div className="pt-12 border-t-4 border-indigo-500">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">
                  Découvrez les Mangas
                </h2>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Les meilleures séries manga par catégorie
                </p>
              </div>
            </div>
          </motion.div>

          {/* Manga Feeds */}
          <MangaSwiperFeed
            title="🔥 Manga Tendance"
            items={mangaFeeds?.recent || []}
            loading={loadingMangaFeeds}
            CardComponent={AnimeCard}
          />

          <MangaSwiperFeed
            title="⚔️ Shonen - Action & Aventure"
            items={mangaFeeds?.shonen || []}
            loading={loadingMangaFeeds}
            CardComponent={AnimeCard}
          />

          <MangaSwiperFeed
            title="🎭 Seinen - Adulte & Mature"
            items={mangaFeeds?.seinen || []}
            loading={loadingMangaFeeds}
            CardComponent={AnimeCard}
          />

          <MangaSwiperFeed
            title="🌸 Shoujo - Romance & Émotion"
            items={mangaFeeds?.shoujo || []}
            loading={loadingMangaFeeds}
            CardComponent={AnimeCard}
          />

          <MangaSwiperFeed
            title="💎 Josei - Vie Quotidienne & Drame"
            items={mangaFeeds?.josei || []}
            loading={loadingMangaFeeds}
            CardComponent={AnimeCard}
          />
          <MangaSwiperFeed
            title="💎 Manhwa - Les meilleures oeuvres Coreennes"
            items={mangaFeeds?.manhwa || []}
            loading={loadingMangaFeeds}
            CardComponent={AnimeCard}
          />
        </div>

        {/* ==================== SECTION CTA FINALE ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 rounded-3xl p-12 text-center shadow-2xl"
        >
          <div className="max-w-3xl mx-auto">
            <Sparkles className="w-16 h-16 text-yellow-300 mx-auto mb-6" />
            <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
              Vous n'avez pas encore trouvé votre pépite ?
            </h3>
            <p className="text-xl text-white/90 mb-8">
              Utilisez notre système de recommandations IA pour découvrir des
              animes parfaitement adaptés à vos goûts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group px-8 py-4 bg-white hover:bg-yellow-300 text-purple-600 font-black text-lg rounded-2xl shadow-2xl hover:shadow-yellow-300/50 transition-all transform hover:scale-105 flex items-center gap-3 justify-center">
                <Lightbulb className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Obtenir mes recommandations
              </button>
              <button className="group px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white font-black text-lg rounded-2xl border-2 border-white/30 hover:border-white/50 transition-all transform hover:scale-105 flex items-center gap-3 justify-center">
                <Search className="w-6 h-6" />
                Explorer le catalogue
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
