"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { decompressBase64, compressToBase64 } from "@/utils/compress";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import YouTubePlayer from "@/app/components/YoutubePlayer";
import YouTubeVideosSection from "@/app/components/YoutubeVideosSection";
import RelatedWorksSection from "@/app/components/RelatedWorkSection";
import AnimeDescriptionTTS from "@/app/components/AnimeDescriptionTts";
import SimilarAnimeCard from "@/app/components/SimilarAnimeCard";
import AuthModal from "@/app/components/AuthModal";
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
  ArrowLeft,
  Heart,
  Share2,
  BookOpen,
  Volume2,
  Mic,
  UserCircle,
  Building2,
  Globe,
} from "lucide-react";

// ==================== TYPES ====================
interface Character {
  id: number;
  name: string;
  name_native?: string;
  image_url?: string;
  role: string;
  description?: string;
  favorites?: number;
  seiyuu?: Seiyuu[];
}

interface Seiyuu {
  id: number;
  name: string;
  name_native?: string;
  image_url?: string;
  language: string;
  favorites?: number;
}

interface Studio {
  id: number;
  name: string;
  image_url?: string;
  is_main: boolean;
  site_url?: string;
  favorites?: number;
}

interface Anime {
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
  trailer_url?: string | null;
  table?: string;
}

// ==================== COMPOSANTS HELPERS ====================

// Composant Card Personnage
const CharacterCard = ({ character }: { character: Character }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        onClick={() => setShowDetails(true)}
        className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all"
      >
        <div className="relative aspect-[2/3]">
          <img
            src={character.image_url || "/placeholder.png"}
            alt={character.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                character.role === "Main"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-700 text-white"
              }`}
            >
              {character.role}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-slate-800 dark:text-white line-clamp-1">
            {character.name}
          </h3>
          {character.name_native && (
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
              {character.name_native}
            </p>
          )}
          {character.seiyuu && character.seiyuu.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                  <img
                    src={character.seiyuu[0].image_url || "/placeholder.png"}
                    alt={character.seiyuu[0].name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 line-clamp-1">
                    {character.seiyuu[0].name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {character.seiyuu[0].language}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal Détails Personnage */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden"
            >
              <div className="relative">
                <button
                  onClick={() => setShowDetails(false)}
                  className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="grid md:grid-cols-2 gap-6 p-6">
                  <div>
                    <img
                      src={character.image_url || "/placeholder.png"}
                      alt={character.name}
                      className="w-full rounded-xl shadow-lg"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-3 ${
                          character.role === "Main"
                            ? "bg-amber-500 text-white"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        {character.role}
                      </span>
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white">
                        {character.name}
                      </h2>
                      {character.name_native && (
                        <p className="text-lg text-slate-600 dark:text-slate-400 mt-1">
                          {character.name_native}
                        </p>
                      )}
                    </div>

                    {character.description && (
                      <div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Description
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {character.description}
                        </p>
                      </div>
                    )}

                    {character.favorites && (
                      <div className="flex items-center gap-2 text-pink-500">
                        <Heart className="w-5 h-5 fill-pink-500" />
                        <span className="font-bold">
                          {character.favorites.toLocaleString()} favoris
                        </span>
                      </div>
                    )}

                    {character.seiyuu && character.seiyuu.length > 0 && (
                      <div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <Mic className="w-5 h-5" />
                          Doubleurs
                        </h3>
                        <div className="space-y-3">
                          {character.seiyuu.map((va) => (
                            <div
                              key={va.id}
                              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                            >
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                                <img
                                  src={va.image_url || "/placeholder.png"}
                                  alt={va.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-white">
                                  {va.name}
                                </p>
                                {va.name_native && (
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {va.name_native}
                                  </p>
                                )}
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                  {va.language}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Composant Card Studio
const StudioCard = ({ studio }: { studio: Studio }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-xl p-6 shadow-lg border border-indigo-200 dark:border-indigo-500/20 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all"
    >
      <div className="flex items-start gap-4">
        {studio.image_url ? (
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-800 flex-shrink-0 shadow-md">
            <img
              src={studio.image_url}
              alt={studio.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-slate-800 dark:text-white line-clamp-2">
              {studio.name}
            </h3>
            {studio.is_main && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                Principal
              </span>
            )}
          </div>

          {studio.site_url && (
            <a
              href={studio.site_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-4 h-4" />
              Site officiel
            </a>
          )}

          {studio.favorites && (
            <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-2">
              <Heart className="w-4 h-4" />
              {studio.favorites.toLocaleString()} favoris
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ==================== PAGE PRINCIPALE ====================
const SINGLE_TABLE_NAME = "anime_all";

export default function AnimeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const animeId = params.id as string;

  const [animeData, setAnimeData] = useState<Anime | null>(null);
  const [similarAnimes, setSimilarAnimes] = useState<Anime[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [translationInProgress, setTranslationInProgress] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<"main" | "supporting">("main");
  const [activeSee, setActiveSee] = useState(false);
  const [seeAllSupporting, setSeeAllSupporting] = useState(6);
  const [modalOpen, setmodalOpen] = useState(false); // Initialisé à false par défaut

  const youtubeId = animeData?.trailer_url || null;

  const mainCharacters = characters.filter((c) => c.role === "Main");
  const supportCharacters = characters.filter((c) => c.role === "Supporting");

  // Effet pour la pagination "voir plus" des persos secondaires
  useEffect(() => {
    if (activeSee) {
      setSeeAllSupporting(supportCharacters.length);
    } else {
      setSeeAllSupporting(6);
    }
  }, [activeSee, supportCharacters.length]);

  // =========================================================================
  // OPTIMISATION FETCH : Chargement critique (Anime) puis secondaire (Reste)
  // =========================================================================
  useEffect(() => {
    if (!animeId) {
      setLoading(false);
      return;
    }

    const TABLE_NAME = SINGLE_TABLE_NAME;
    const supabase = createClient();

    // 1. Fonction pour charger UNIQUEMENT l'anime et débloquer la vue
    async function fetchMainData() {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .eq("id", animeId)
          .single();

        if (error || !data) {
          console.error("Erreur Anime Supabase:", error);
          setLoading(false);
          return;
        }

        let anime = data as Anime;
        let descriptionFr: string | null = null;
        let descriptionEn: string | null = null;

        // Décompression description
        try {
          descriptionEn =
            decompressBase64(anime.description || "") ||
            anime.description ||
            "";
        } catch {
          descriptionEn = anime.description || "";
        }

        // Décompression description_fr
        if (anime.description_fr) {
          try {
            descriptionFr = decompressBase64(anime.description_fr);
          } catch {
            descriptionFr = null;
          }
        }

        // Note: La logique de traduction automatique est mise de côté ici pour la rapidité d'affichage,
        // mais le code de traduction pourrait être réintégré dans un useEffect séparé si besoin.

        const finalDescription = descriptionFr || descriptionEn;

        setAnimeData({
          ...anime,
          description: finalDescription,
          table: TABLE_NAME,
        });

        // == POINT CRITIQUE : ON ARRÊTE LE CHARGEMENT ICI ==
        setLoading(false);

        // 2. On lance le reste en arrière-plan
        fetchSecondaryData(anime);
      } catch (err) {
        console.error("Erreur Fetch Principal:", err);
        setLoading(false);
      }
    }

    // 2. Fonction pour charger le reste en parallèle (non-bloquant)
    async function fetchSecondaryData(anime: Anime) {
      try {
        const [similarRes, charactersRes, studiosRes] = await Promise.all([
          // Fetch animes similaires
          supabase.from(TABLE_NAME).select("*").neq("id", animeId).limit(30),

          // Fetch personnages
          supabase
            .from("anime_characters")
            .select(
              `
              role, position,
              character:character_id (id, name, name_native, image_url, description, favorites)
            `
            )
            .eq("anime_id", animeId)
            .order("position"),

          // Fetch studios
          supabase
            .from("anime_studios")
            .select(
              `is_main, studio:studio_id (id, name, image_url, site_url, favorites)`
            )
            .eq("anime_id", animeId),
        ]);

        // Traitement Similaires
        if (similarRes.data) {
          const currentGenres = anime.genres || [];
          const currentThemes = anime.themes || [];
          const scored = similarRes.data.map((item) => {
            const itemGenres = item.genres || [];
            const itemThemes = item.themes || [];
            const genreMatch = itemGenres.filter((g: string) =>
              currentGenres.includes(g)
            ).length;
            const themeMatch = itemThemes.filter((t: string) =>
              currentThemes.includes(t)
            ).length;
            return { ...item, similarity: genreMatch * 2 + themeMatch };
          });
          const sorted = scored
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 6);
          setSimilarAnimes(sorted);
        }

        // Traitement Personnages
        if (charactersRes.data) {
          const formattedChars: Character[] = charactersRes.data
            .filter((item: any) => item.character)
            .map((item: any) => ({
              id: item.character.id,
              name: item.character.name,
              name_native: item.character.name_native,
              image_url: item.character.image_url,
              role: item.role || "Supporting",
              description: item.character.description,
              favorites: item.character.favorites,
              seiyuu: [], // Pour la vitesse, on peut charger les seiyuu plus tard ou ici si besoin
            }));

          // Petit fetch supplémentaire pour les seiyuu si tu veux vraiment tout (optionnel pour la vitesse)
          // Pour l'instant on affiche les persos sans seiyuu pour que ce soit instantané
          setCharacters(formattedChars);

          // Si tu veux charger les seiyuu après coup :
          fetchSeiyuusForCharacters(
            formattedChars.map((c) => c.id),
            anime.id
          );
        }

        // Traitement Studios
        if (studiosRes.data) {
          const formattedStudios: Studio[] = studiosRes.data
            .filter((s: any) => s.studio)
            .map((s: any) => ({
              id: s.studio.id,
              name: s.studio.name,
              image_url: s.studio.image_url,
              is_main: s.is_main || false,
              site_url: s.studio.site_url,
              favorites: s.studio.favorites,
            }));
          setStudios(formattedStudios);
        }
      } catch (err) {
        console.error("Erreur Fetch Secondaire:", err);
      }
    }

    // Helper pour charger les seiyuu séparément pour ne pas bloquer l'affichage des persos
    async function fetchSeiyuusForCharacters(
      charIds: number[],
      animeId: number
    ) {
      if (charIds.length === 0) return;

      const { data } = await supabase
        .from("character_seiyuu")
        .select(
          `character_id, language, seiyuu:seiyuu_id (id, name, name_native, image_url, favorites)`
        )
        .in("character_id", charIds)
        .eq("anime_id", animeId);

      if (data) {
        setCharacters((prevChars) =>
          prevChars.map((char) => {
            const relatedSeiyuu = data.filter(
              (d: any) => d.character_id === char.id && d.seiyuu
            );
            const seiyuuList: Seiyuu[] = relatedSeiyuu.map((s: any) => ({
              id: s.seiyuu.id,
              name: s.seiyuu.name,
              name_native: s.seiyuu.name_native,
              image_url: s.seiyuu.image_url,
              language: s.language,
              favorites: s.seiyuu.favorites,
            }));
            return { ...char, seiyuu: seiyuuList };
          })
        );
      }
    }

    fetchMainData();
  }, [animeId]);

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center">
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
        <div className="absolute inset-0">
          <img
            src={animeData.image_url || "/placeholder.png"}
            alt={animeData.title}
            className="w-full h-full object-cover blur-2xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-slate-950 dark:to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex items-end pb-12">
          <div className="flex flex-col md:flex-row gap-8 w-full">
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

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 text-white"
            >
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

                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-bold border border-white/20 shadow-lg transition-all transform hover:scale-105 text-white">
                  <Share2 className="w-5 h-5" />
                  Partager
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Colonne Gauche (Infos principales) */}
          <div className="lg:col-span-2 space-y-12">
            {/* Section Description */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-indigo-500" />
                  Synopsis
                </h2>
                <div className="flex items-center gap-2">
                  <AnimeDescriptionTTS
                    text={
                      animeData.description || "Aucune description disponible."
                    }
                    language={animeData.description_fr ? "fr-FR" : "en-US"}
                  />
                  {translationInProgress && (
                    <span className="text-xs text-indigo-500 animate-pulse font-medium">
                      Traduction...
                    </span>
                  )}
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                  {animeData.description || "Aucune description disponible."}
                </p>
              </div>

              {/* Tags Genres & Thèmes */}
              <div className="mt-8 flex flex-wrap gap-2">
                {animeData.genres?.map((genre) => (
                  <span
                    key={genre}
                    className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-full text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-default border border-indigo-100 dark:border-indigo-500/20"
                  >
                    {genre}
                  </span>
                ))}
                {animeData.themes?.map((theme) => (
                  <span
                    key={theme}
                    className="px-4 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full text-sm font-bold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-default border border-purple-100 dark:border-purple-500/20"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </motion.section>

            {/* Section Personnages */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <UserCircle className="w-6 h-6 text-indigo-500" />
                  Personnages
                </h2>

                {/* Tabs Main/Support */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("main")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === "main"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    Principaux({mainCharacters.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("supporting")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === "supporting"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    Secondaires({supportCharacters.length})
                  </button>
                </div>
              </div>

              {/* Grille Personnages */}
              {characters.length === 0 ? (
                <div className="py-10 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  Chargement des personnages...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  <AnimatePresence mode="popLayout">
                    {activeTab === "main"
                      ? mainCharacters.map((char) => (
                          <CharacterCard key={char.id} character={char} />
                        ))
                      : supportCharacters
                          .slice(0, seeAllSupporting)
                          .map((char) => (
                            <CharacterCard key={char.id} character={char} />
                          ))}
                  </AnimatePresence>
                </div>
              )}

              {activeTab === "supporting" && supportCharacters.length > 6 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setActiveSee(!activeSee)}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    {activeSee
                      ? "Voir moins"
                      : "Voir tous les personnages secondaires"}
                  </button>
                </div>
              )}
            </motion.section>

            {/* Section Vidéos YouTube */}
            <div className="rounded-3xl overflow-hidden shadow-xl mt-12">
              <YouTubeVideosSection
                animeTitle={animeData.title}
                animeId={animeData?.id}
              />
            </div>
          </div>

          {/* Colonne Droite (Sidebar Infos) */}
          <div className="space-y-8">
            {/* Carte d'informations techniques */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800"
            >
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-500" />
                Informations
              </h3>

              <div className="space-y-5">
                {[
                  { icon: Film, label: "Format", value: animeData.type },
                  {
                    icon: Layers,
                    label: "Episodes",
                    value: animeData.episodes,
                  },
                  { icon: Clock, label: "Durée", value: animeData.duration },
                  {
                    icon: Calendar,
                    label: "Diffusion",
                    value: animeData.start_date,
                  },
                  {
                    icon: TrendingUp,
                    label: "Statut",
                    value: animeData.status,
                  },
                  {
                    icon: Sparkles,
                    label: "Saison",
                    value: animeData.season
                      ? `${animeData.season} ${animeData.year}`
                      : null,
                  },
                  { icon: BookOpen, label: "Source", value: animeData.source },
                  { icon: Users, label: "Rating", value: animeData.rating },
                ].map(
                  (item, idx) =>
                    item.value && (
                      <div
                        key={idx}
                        className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">
                            {item.label}
                          </span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm text-right">
                          {item.value}
                        </span>
                      </div>
                    )
                )}
              </div>
            </motion.div>

            {/* Section Studios */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                Studios
              </h3>
              {studios.length === 0 ? (
                <div className="text-sm text-slate-500 italic">
                  Recherche des studios...
                </div>
              ) : (
                <div className="space-y-4">
                  {studios.map((studio) => (
                    <StudioCard key={studio.id} studio={studio} />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Widget Authentification / Action */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
              <h3 className="font-bold text-lg mb-2">Vous aimez cet anime ?</h3>
              <p className="text-indigo-100 text-sm mb-4">
                Connectez-vous pour suivre votre progression et noter cet anime.
              </p>
              <button
                onClick={() => setmodalOpen(true)}
                className="w-full py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>

        <RelatedWorksSection currentAnime={animeData} />

        {/* Section Animes Similaires */}
        {similarAnimes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <Layers className="w-8 h-8 text-indigo-500" />
                Recommandations Similaires
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {similarAnimes.map((anime) => (
                <SimilarAnimeCard
                  key={anime.id}
                  anime={anime}
                  demographic={anime.demographic}
                />
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* Modal Trailer YouTube */}
      <AnimatePresence>
        {showTrailer && youtubeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowTrailer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowTrailer(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="aspect-video w-full">
                <YouTubePlayer
                  videoId={youtubeId.split("v=")[1] || youtubeId}
                  title={animeData.title}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      {modalOpen && <AuthModal />}
    </div>
  );
}
