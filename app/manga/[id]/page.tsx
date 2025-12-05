"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { decompressBase64, compressToBase64 } from "@/utils/compress";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
// 💡 NOTE : Le composant YouTubePlayer est maintenu car certains mangas ont des trailers de promotion
import YouTubePlayer from "@/app/components/YoutubePlayer";
import AnimeDescriptionTTS from "@/app/components/AnimeDescriptionTts";
import SimilarAnimeCard from "@/app/components/SimilarAnimeCard"; // Le nom sera conservé pour la réutilisation
import {
  Star,
  Calendar,
  BookOpen, // Remplacera 'Film' pour les chapitres/volumes
  TrendingUp,
  Users,
  Award,
  Clock, // Remplacé par 'BookOpen'
  Tv, // Remplacé par 'BookOpen'
  Play,
  X,
  ChevronRight,
  Sparkles,
  Info,
  Layers, // Remplacé par 'Feather' pour Auteurs
  ExternalLink,
  ArrowLeft,
  Heart,
  Share2,
  Volume2,
  PenTool, // Icône pour Auteurs
  Newspaper, // Icône pour Sérialisation
} from "lucide-react";

// ==================== TYPES ADAPTÉS AU MANGA ====================
interface Manga {
  id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  image_url: string | null;
  description: string | null;
  description_fr: string | null;
  score: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  members?: number | null;
  favorites?: number | null;
  start_date: string | null;
  end_date?: string | null;
  status?: string | null;
  type?: string | null;
  genres?: string[];
  themes?: string[];
  // CHAMPS SPÉCIFIQUES MANGA
  chapters?: number | null;
  volumes?: number | null;
  authors?: string[]; // Auteurs/Dessinateurs
  serializations?: string[]; // Magazines de publication
  // Nous laissons 'trailer_url' bien que moins commun pour les mangas
  trailer_url?: string | null;
}

// ==================== PAGE PRINCIPALE MANGA ====================
export default function MangaDetailsPage() {
  const params = useParams();

  const router = useRouter();

  const mangaId = params.id as string;
  // Par défaut, nous utilisons "shonen" ou un autre type de démographie manga.

  // Le type de données est maintenant Manga
  const [mangaData, setMangaData] = useState<Manga | null>(null);
  const [similarMangas, setSimilarMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [translationInProgress, setTranslationInProgress] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const youtubeId = mangaData?.trailer_url || null;

  useEffect(() => {
    if (!mangaId) {
      setLoading(false);
      return;
    }

    // Utilisation des tables Manga
    const TABLE_NAME = "manga_all";
    const supabase = createClient();

    async function fetchData() {
      setLoading(true);

      try {
        // Fetch Manga principal
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .eq("id", mangaId)
          .single();

        if (error || !data) {
          console.error("Erreur Supabase:", error);
          setLoading(false);
          return;
        }

        // Le type est maintenant Manga
        let manga = data as Manga;
        let descriptionFr: string | null = null;
        let descriptionEn: string | null = null;

        // Décompression description
        try {
          descriptionEn =
            decompressBase64(manga.description || "") ||
            manga.description ||
            "";
        } catch {
          descriptionEn = manga.description || "";
        }

        // La table manga_shonen n'a pas la colonne description_fr. Nous traduisons et mettons à jour si le champ n'est pas présent.

        // Le code de traduction est adapté ici (mais il faudra mettre à jour la BDD pour stocker la traduction si elle manque)
        // Pour l'instant, on suppose que la colonne `description` contient la version originale (EN) et on la traduit si nécessaire.
        const needsTranslation = true; // Simuler la traduction pour l'exemple
        if (needsTranslation) {
          setTranslationInProgress(true);
          try {
            // Dans un cas réel, on devrait vérifier si une colonne 'description_fr' existe et est remplie.
            // Vu que l'objectif est d'afficher la traduction, on va la chercher et la simuler ici.
            // On utilise la description anglaise pour simuler la traduction.
            const res = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: descriptionEn }),
            });
            if (res.ok) {
              const json = await res.json();
              const translatedText = json.translated || descriptionEn;

              try {
                // Compression
                const compressedFr = compressToBase64(translatedText);

                // Mise à jour dans Supabase
                const { error: updateError } = await supabase
                  .from(TABLE_NAME)
                  .update({ description_fr: compressedFr })
                  .eq("id", manga.id);

                if (updateError)
                  console.error("Erreur mise à jour traduction:", updateError);

                // On garde la version traduite pour l'affichage
                descriptionFr = translatedText;
              } catch (err) {
                console.error("Erreur compression / stockage:", err);
                descriptionFr = translatedText; // au moins afficher la traduction brute
              }
            }
          } catch (err) {
            console.error("Erreur traduction:", err);
          } finally {
            setTranslationInProgress(false);
          }
        }

        const finalDescription = descriptionFr || descriptionEn;

        setMangaData({
          ...manga,
          description: finalDescription,
        });

        // Fetch mangas similaires (simplement les 6 premiers différents de l'ID actuel pour l'exemple)
        const { data: similarData } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .neq("id", mangaId)
          .limit(12);

        if (similarData) {
          // Filtrage par genres/themes similaire
          const currentGenres = manga.genres || [];
          const currentThemes = manga.themes || [];

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
            .slice(0, 6) as Manga[]; // Cast to Manga[]

          setSimilarMangas(sorted);
        }
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [mangaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
            Chargement des détails du Manga...
          </p>
        </div>
      </div>
    );
  }

  if (!mangaData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
            Manga introuvable
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
            src={mangaData.image_url || "/placeholder.png"}
            alt={mangaData.title}
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
                  src={mangaData.image_url || "/placeholder.png"}
                  alt={mangaData.title}
                  className="w-64 rounded-2xl shadow-2xl border-4 border-white/10"
                />
                {/* Le trailer est conservé au cas où il s'agirait d'un trailer de promotion pour le manga */}
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
                {mangaData.title}
              </h1>

              {mangaData.title_english &&
                mangaData.title_english !== mangaData.title && (
                  <p className="text-xl text-white/80 mb-2 font-medium">
                    {mangaData.title_english}
                  </p>
                )}

              {mangaData.title_japanese && (
                <p className="text-lg text-white/60 mb-4 font-medium">
                  {mangaData.title_japanese}
                </p>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {mangaData.score && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-2xl font-black">
                      {mangaData.score.toFixed(2)}
                    </span>
                    {mangaData.scored_by && (
                      <span className="text-sm text-white/60">
                        ({(mangaData.scored_by / 1000).toFixed(0)}K votes)
                      </span>
                    )}
                  </div>
                )}

                {mangaData.rank && mangaData.rank <= 100 && (
                  <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-400/30">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="font-black">#{mangaData.rank}</span>
                  </div>
                )}

                {mangaData.members && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <Users className="w-5 h-5" />
                    <span className="font-bold">
                      {(mangaData.members / 1000).toFixed(0)}K
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Info ADAPTÉE AU MANGA */}
              <div className="flex flex-wrap gap-3 mb-6">
                {mangaData.type && (
                  <span className="px-4 py-2 bg-indigo-500/80 backdrop-blur-md rounded-lg font-bold text-sm border border-indigo-400/30">
                    {mangaData.type}
                  </span>
                )}
                {mangaData.status && (
                  <span className="px-4 py-2 bg-green-500/80 backdrop-blur-md rounded-lg font-bold text-sm border border-green-400/30">
                    {mangaData.status}
                  </span>
                )}
                {mangaData.volumes && (
                  <span className="flex items-center gap-1 px-4 py-2 bg-purple-500/80 backdrop-blur-md rounded-lg font-bold text-sm border border-purple-400/30">
                    <BookOpen size={16} />
                    {mangaData.volumes} volumes
                  </span>
                )}
                {mangaData.chapters && (
                  <span className="flex items-center gap-1 px-4 py-2 bg-pink-500/80 backdrop-blur-md rounded-lg font-bold text-sm border border-pink-400/30">
                    <BookOpen size={16} />
                    {mangaData.chapters} chapitres
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
              {/* EN-TÊTE DU SYNOPSIS AVEC LE BOUTON TTS */}
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
                <AnimeDescriptionTTS text={mangaData.description} />
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
                {mangaData.description || "Aucun synopsis disponible."}
              </p>
            </motion.div>
            {/* FIN DE LA SECTION SYNOPSIS */}

            {/* Genres & Themes (Inchangés) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700"
            >
              {mangaData.genres && mangaData.genres.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">
                    Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {mangaData.genres.map((genre, i) => (
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

              {mangaData.themes && mangaData.themes.length > 0 && (
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">
                    Thèmes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {mangaData.themes.map((theme, i) => (
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

          {/* Right Column - Details ADAPTÉS AU MANGA */}
          <div className="space-y-6">
            {/* Info Card ADAPTÉE */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4"
            >
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                Informations Clés
              </h3>

              {[
                { icon: BookOpen, label: "Type", value: mangaData.type },
                { icon: BookOpen, label: "Volumes", value: mangaData.volumes },
                {
                  icon: BookOpen,
                  label: "Chapitres",
                  value: mangaData.chapters,
                },
                {
                  icon: Calendar,
                  label: "Début",
                  value: mangaData.start_date
                    ? new Date(mangaData.start_date).toLocaleDateString("fr-FR")
                    : null,
                },
                {
                  icon: Calendar,
                  label: "Fin",
                  value: mangaData.end_date
                    ? new Date(mangaData.end_date).toLocaleDateString("fr-FR")
                    : null,
                },
                {
                  icon: TrendingUp,
                  label: "Popularité",
                  value: mangaData.popularity
                    ? `#${mangaData.popularity}`
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

            {/* Auteurs (Remplacent les Studios) */}
            {mangaData.authors && mangaData.authors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl p-6 shadow-xl border border-indigo-200/50 dark:border-indigo-500/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <PenTool className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">
                    Auteurs / Artistes
                  </h3>
                </div>
                <div className="space-y-2">
                  {mangaData.authors.map((author, i) => (
                    <motion.div
                      key={author}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="px-4 py-2 bg-white dark:bg-slate-900 rounded-lg font-bold text-sm text-slate-700 dark:text-slate-300 border border-indigo-200 dark:border-indigo-700"
                    >
                      {author}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Sérialisations (Remplacent les Producteurs) */}
            {mangaData.serializations &&
              mangaData.serializations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Newspaper className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                      Sérialisations
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mangaData.serializations.map((serialization) => (
                      <span
                        key={serialization}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400"
                      >
                        {serialization}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
          </div>
        </div>

        {/* Similar Mangas Section */}
        {similarMangas.length > 0 && (
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
                  Mangas Similaires
                </h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
                Voir plus
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {similarMangas.map((manga, i) => (
                <motion.div
                  key={manga.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                >
                  {/* On réutilise la carte pour l'affichage, en sachant que le type est Manga */}
                  <SimilarAnimeCard
                    // @ts-ignore : Passer les données Manga au composant AnimeCard
                    anime={manga}
                    demographic={mangaData.demographic}
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
    </div>
  );
}
