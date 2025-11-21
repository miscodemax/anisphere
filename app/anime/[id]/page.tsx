// components/AnimeDetailsPage.tsx (Code Complet)
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { decompressBase64, compressToBase64 } from "@/utils/compress";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import YouTubePlayer from "@/app/components/YoutubePlayer";
import YouTubeVideosSection from "@/app/components/YoutubeVideosSection";
// 💡 L'IMPORTATION EST DÉJÀ PRÉSENTE
import AnimeDescriptionTTS from "@/app/components/AnimeDescriptionTts";
import SimilarAnimeCard from "@/app/components/SimilarAnimeCard";
import {
  Star,
  Calendar,
  Film,
  TrendingUp,
  Users,
  Award,
  Clock,
  Tv,
  Play,
  X,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  ExternalLink,
  ArrowLeft,
  Heart,
  Share2,
  BookOpen,
  Volume2, // Ajouté pour les composants
} from "lucide-react";

// ==================== TYPES ====================
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

// Fonction pour déterminer la table
const getTableNameFromDemographic = (demographic: string): string => {
  const map: Record<string, string> = {
    shonen: "anime_shonen",
    shoujo: "anime_shoujo",
    seinen: "anime_seinen",
    josei: "anime_josei",
    nouveautes: "anime_nouveautes",
    // AJOUT: Support pour la table générale
    general: "anime_catalogue_general",
  };
  // Utilise la table générale par défaut si la démographie n'est pas mappée
  return map[demographic] || "anime_catalogue_general";
};
// Extraire l'ID YouTube d'une URL
const getYouTubeId = (url: string | null): string | null => {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  return match ? match[1] : null;
};

// ==================== PAGE PRINCIPALE ====================
export default function AnimeDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const animeId = params.id as string;
  const animeDemographic = searchParams.get("demographic") || "nouveautes";

  const [animeData, setAnimeData] = useState<Anime | null>(null);
  const [similarAnimes, setSimilarAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [translationInProgress, setTranslationInProgress] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const youtubeId = animeData?.trailer_url || null;

  useEffect(() => {
    if (!animeId || !animeDemographic) {
      setLoading(false);
      return;
    }

    const TABLE_NAME = getTableNameFromDemographic(animeDemographic);
    const supabase = createClient();

    async function fetchData() {
      setLoading(true);

      try {
        // Fetch anime principal
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .eq("id", animeId)
          .single();

        if (error || !data) {
          console.error("Erreur Supabase:", error);
          setLoading(false);
          return;
        }

        let anime = data as Anime;
        let descriptionFr: string | null = null;
        let descriptionEn: string | null = null;
        let backgroundText: string | null = null;

        // Décompression description
        try {
          descriptionEn =
            decompressBase64(anime.description || "") ||
            anime.description ||
            "";
        } catch {
          descriptionEn = anime.description || "";
        }

        if (anime.description_fr) {
          try {
            descriptionFr = decompressBase64(anime.description_fr);
          } catch {
            descriptionFr = null;
          }
        }

        // Décompression background
        if (anime.background) {
          try {
            backgroundText = decompressBase64(anime.background);
          } catch {
            backgroundText = anime.background;
          }
        }

        // Traduction si nécessaire
        const needsTranslation = !descriptionFr && descriptionEn;

        if (needsTranslation) {
          setTranslationInProgress(true);
          try {
            const res = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: descriptionEn,
                target_lang: "FR",
              }),
            });

            if (res.ok) {
              const json = await res.json();
              const translatedText = json.translated || descriptionEn;
              const compressedFr = compressToBase64(translatedText);

              await supabase
                .from(TABLE_NAME)
                .update({ description_fr: compressedFr })
                .eq("id", anime.id);

              descriptionFr = translatedText;
            }
          } catch (err) {
            console.error("Erreur traduction:", err);
          } finally {
            setTranslationInProgress(false);
          }
        }

        const finalDescription = descriptionFr || descriptionEn;

        setAnimeData({
          ...anime,
          description: finalDescription,
          background: backgroundText,
        });

        // Fetch animes similaires
        const { data: similarData } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .neq("id", animeId)
          .limit(12);

        if (similarData) {
          // Filtrer par genres/themes similaires
          const currentGenres = anime.genres || [];
          const currentThemes = anime.themes || [];

          const scored = similarData.map((item) => {
            const itemGenres = item.genres || [];
            const itemThemes = item.themes || [];

            const genreMatch = itemGenres.filter((g: string) =>
              currentGenres.includes(g)
            ).length;
            const themeMatch = itemThemes.filter((t: string) =>
              currentThemes.includes(t)
            ).length;

            return {
              ...item,
              similarity: genreMatch * 2 + themeMatch,
            };
          });

          const sorted = scored
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 6);

          setSimilarAnimes(sorted);
        }
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [animeId, animeDemographic]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
            Chargement des détails...
          </p>
        </div>
      </div>
    );
  }

  if (!animeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
            Anime introuvable
          </h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Hero Section avec Background Image */}
      <div className="relative h-[60vh] overflow-hidden">
        {/* Background Image avec Overlay */}
        <div className="absolute inset-0">
          <img
            src={animeData.image_url || "/placeholder.png"}
            alt={animeData.title}
            className="w-full h-full object-cover blur-2xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-slate-950 dark:to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex items-end pb-12">
          <div className="flex flex-col md:flex-row gap-8 w-full">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-shrink-0"
            >
              <div className="relative group">
                <img
                  src={animeData.image_url || "/placeholder.png"}
                  alt={animeData.title}
                  className="w-64 rounded-2xl shadow-2xl border-4 border-white/10"
                />
                {youtubeId && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl flex items-center justify-center"
                  >
                    <div className="bg-red-600 p-4 rounded-full shadow-2xl transform group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </button>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 text-white"
            >
              {/* Breadcrumb */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white/70 hover:text-white mb-4 font-semibold transition-colors"
              >
                <ArrowLeft size={20} />
                Retour
              </button>

              <h1 className="text-4xl md:text-6xl font-black mb-3 drop-shadow-2xl">
                {animeData.title}
              </h1>

              {animeData.title_english &&
                animeData.title_english !== animeData.title && (
                  <p className="text-xl text-white/80 mb-2 font-medium">
                    {animeData.title_english}
                  </p>
                )}

              {animeData.title_japanese && (
                <p className="text-lg text-white/60 mb-4 font-medium">
                  {animeData.title_japanese}
                </p>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {animeData.score && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-2xl font-black">
                      {animeData.score.toFixed(2)}
                    </span>
                    {animeData.scored_by && (
                      <span className="text-sm text-white/60">
                        ({(animeData.scored_by / 1000).toFixed(0)}K votes)
                      </span>
                    )}
                  </div>
                )}

                {animeData.rank && animeData.rank <= 100 && (
                  <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-400/30">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="font-black">#{animeData.rank}</span>
                  </div>
                )}

                {animeData.members && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <Users className="w-5 h-5" />
                    <span className="font-bold">
                      {(animeData.members / 1000).toFixed(0)}K
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-3 mb-6">
                {animeData.type && (
                  <span className="px-4 py-2 bg-indigo-500/80 backdrop-blur-md rounded-lg font-bold text-sm border border-indigo-400/30">
                    {animeData.type}
                  </span>
                )}
                {animeData.status && (
                  <span className="px-4 py-2 bg-green-500/80 backdrop-blur-md rounded-lg font-bold text-sm border border-green-400/30">
                    {animeData.status}
                  </span>
                )}
                {animeData.episodes && (
                  <span className="px-4 py-2 bg-purple-500/80 backdrop-blur-md rounded-lg font-bold text-sm border border-purple-400/30">
                    {animeData.episodes} épisodes
                  </span>
                )}
                {animeData.duration && (
                  <span className="px-4 py-2 bg-pink-500/80 backdrop-blur-md rounded-lg font-bold text-sm border border-pink-400/30">
                    {animeData.duration}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {youtubeId && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105"
                  >
                    <Play className="w-5 h-5" />
                    Voir le trailer
                  </button>
                )}
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 ${
                    isFavorite
                      ? "bg-pink-600 hover:bg-pink-700"
                      : "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite ? "fill-white" : ""}`}
                  />
                  {isFavorite ? "Favori" : "Ajouter"}
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 border border-white/20">
                  <Share2 className="w-5 h-5" />
                  Partager
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Synopsis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700"
            >
              {/* 💡 EN-TÊTE DU SYNOPSIS MIS À JOUR AVEC LE BOUTON TTS */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white">
                    Synopsis
                  </h2>
                </div>
                {/* Intégration du composant TTS ici */}
                <AnimeDescriptionTTS text={animeData.description} />
              </div>

              {translationInProgress && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">
                      Traduction en cours...
                    </p>
                  </div>
                </div>
              )}

              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {animeData.description || "Aucun synopsis disponible."}
              </p>
            </motion.div>
            {/* FIN DE LA SECTION SYNOPSIS MISE À JOUR */}
            <YouTubeVideosSection
              animeTitle={animeData.title}
              animeEnglishTitle={animeData.title_english}
            />
            {/* Background */}
            {animeData.background && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/5 dark:to-purple-500/5 rounded-2xl p-8 shadow-xl border border-indigo-200/50 dark:border-indigo-500/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                    Informations supplémentaires
                  </h3>
                </div>
                <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {animeData.background}
                </p>
              </motion.div>
            )}

            {/* Genres & Themes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700"
            >
              {animeData.genres && animeData.genres.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">
                    Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {animeData.genres.map((genre, i) => (
                      <motion.span
                        key={genre}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                      >
                        {genre}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {animeData.themes && animeData.themes.length > 0 && (
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">
                    Thèmes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {animeData.themes.map((theme, i) => (
                      <motion.span
                        key={theme}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.05 }}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
                      >
                        {theme}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4"
            >
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                Informations
              </h3>

              {[
                { icon: Tv, label: "Type", value: animeData.type },
                { icon: Film, label: "Épisodes", value: animeData.episodes },
                { icon: Clock, label: "Durée", value: animeData.duration },
                {
                  icon: Calendar,
                  label: "Diffusion",
                  value: animeData.start_date
                    ? new Date(animeData.start_date).toLocaleDateString("fr-FR")
                    : null,
                },
                {
                  icon: Calendar,
                  label: "Fin",
                  value: animeData.end_date
                    ? new Date(animeData.end_date).toLocaleDateString("fr-FR")
                    : null,
                },
                {
                  icon: Sparkles,
                  label: "Saison",
                  value:
                    animeData.season && animeData.year
                      ? `${animeData.season} ${animeData.year}`
                      : null,
                },
                { icon: Info, label: "Source", value: animeData.source },
                { icon: Users, label: "Rating", value: animeData.rating },
                {
                  icon: TrendingUp,
                  label: "Popularité",
                  value: animeData.popularity
                    ? `#${animeData.popularity}`
                    : null,
                },
              ].map(
                (item, i) =>
                  item.value && (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-indigo-500" />
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          {item.label}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {item.value}
                      </span>
                    </motion.div>
                  )
              )}
            </motion.div>

            {/* Studios */}
            {animeData.studios && animeData.studios.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl p-6 shadow-xl border border-indigo-200/50 dark:border-indigo-500/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">
                    Studios
                  </h3>
                </div>
                <div className="space-y-2">
                  {animeData.studios.map((studio, i) => (
                    <motion.div
                      key={studio}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="px-4 py-2 bg-white dark:bg-slate-900 rounded-lg font-bold text-sm text-slate-700 dark:text-slate-300 border border-indigo-200 dark:border-indigo-700"
                    >
                      {studio}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Producers */}
            {animeData.producers && animeData.producers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
              >
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">
                  Producteurs
                </h3>
                <div className="flex flex-wrap gap-2">
                  {animeData.producers.slice(0, 5).map((producer) => (
                    <span
                      key={producer}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400"
                    >
                      {producer}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Similar Animes Section */}
        {similarAnimes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-16"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white">
                  Animes Similaires
                </h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
                Voir plus
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {similarAnimes.map((anime, i) => (
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                >
                  <SimilarAnimeCard
                    anime={anime}
                    demographic={animeDemographic}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* YouTube Trailer Modal */}
      <AnimatePresence>
        {showTrailer && youtubeId && (
          <YouTubePlayer
            videoId={youtubeId}
            onClose={() => setShowTrailer(false)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      {/* <footer className="mt-16 py-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Fait avec <span className="text-red-500">❤️</span> pour les fans
            d'anime
          </p>
        </div>
      </footer> */}
    </div>
  );
}
