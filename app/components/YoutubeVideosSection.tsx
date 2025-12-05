"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Film,
  Music,
  Tv,
  Loader2,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface YouTubeAPIResponse {
  found: boolean;
  videoId: string | null;
  saved?: boolean;
  type?: string;
  field?: string;
  id?: number;
}

interface YouTubeVideosSectionProps {
  animeTitle: string;
  animeId: string;
  animeEnglishTitle?: string;
}

export default function YouTubeVideosSection({
  animeTitle,
  animeId,
  animeEnglishTitle,
}: YouTubeVideosSectionProps) {
  const [trailerData, setTrailerData] = useState<YouTubeAPIResponse | null>(
    null
  );
  const [openingData, setOpeningData] = useState<YouTubeAPIResponse | null>(
    null
  );
  const [episodeData, setEpisodeData] = useState<YouTubeAPIResponse | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  const effectiveTitle = animeTitle?.trim() || animeEnglishTitle?.trim() || "";

  useEffect(() => {
    if (!effectiveTitle || !animeId) {
      setLoading(false);
      return;
    }

    async function fetchVideos() {
      setLoading(true);

      try {
        const fetchOne = (type: string) =>
          fetch(
            `/api/youtube-video?title=${encodeURIComponent(
              effectiveTitle
            )}&type=${type}`
          ).then((r) => r.json());

        const [trailer, opening, episode] = await Promise.all([
          fetchOne("trailer"),
          fetchOne("opening"),
          fetchOne("episode1"), // FIX API
        ]);

        setTrailerData(trailer);
        setOpeningData(opening);
        setEpisodeData(episode);
      } catch (err) {
        console.error("Erreur YTB:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [effectiveTitle, animeId]);

  const videos = [
    {
      id: "trailer",
      data: trailerData,
      icon: Film,
      label: "Trailer",
      bgGradient: "bg-gradient-to-br from-red-500 to-pink-500",
    },
    {
      id: "opening",
      data: openingData,
      icon: Music,
      label: "Opening 1",
      bgGradient: "bg-gradient-to-br from-purple-500 to-indigo-500",
    },
    {
      id: "episode1",
      data: episodeData,
      icon: Tv,
      label: "Épisode 1",
      bgGradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
    },
  ];

  const availableVideos = videos.filter((v) => v.data?.found && v.data.videoId);

  const currentIndex = availableVideos.findIndex(
    (v) => v.data?.videoId === selectedVideo
  );
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < availableVideos.length - 1;

  const goToPrev = () => {
    if (canGoPrev)
      setSelectedVideo(availableVideos[currentIndex - 1].data!.videoId!);
  };

  const goToNext = () => {
    if (canGoNext)
      setSelectedVideo(availableVideos[currentIndex + 1].data!.videoId!);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFullPlayer) setShowFullPlayer(false);
    };

    if (showFullPlayer) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showFullPlayer]);

  // Loading
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">
            Recherche des vidéos...
          </span>
        </div>
      </motion.div>
    );
  }

  // Aucune vidéo trouvée
  if (!availableVideos.length) return null;

  // === UI ===
  return (
    <>
      {/* LISTE des vidéos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl shadow-xl">
            <Play className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            Vidéos liées
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {availableVideos.map((video, i) => {
            const vid = video.data!;
            const thumb = `https://img.youtube.com/vi/${vid.videoId}/mqdefault.jpg`;

            return (
              <motion.button
                key={video.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                onClick={() => {
                  setSelectedVideo(vid.videoId!);
                  setShowFullPlayer(true);
                }}
                className="relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:scale-[1.02] transition-all"
              >
                <div className="relative aspect-video">
                  <img
                    src={thumb}
                    alt={video.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`p-3 rounded-full ${video.bgGradient} shadow-2xl`}
                    >
                      <video.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-bold text-white text-smdrop-shadow">
                      {video.label}
                    </h3>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* FULLSCREEN PLAYER */}
      <AnimatePresence>
        {showFullPlayer && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowFullPlayer(false);
            }}
          >
            {/* HEADER */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrev}
                  disabled={!canGoPrev}
                  className={`p-2 rounded-lg ${
                    canGoPrev
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={goToNext}
                  disabled={!canGoNext}
                  className={`p-2 rounded-lg ${
                    canGoNext
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="text-white/70 text-sm">
                {currentIndex + 1} / {availableVideos.length}
              </div>

              <button
                onClick={() => setShowFullPlayer(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </motion.div>

            {/* PLAYER */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-6xl aspect-video rounded-xl overflow-hidden border border-white/10 shadow-xl">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0&modestbranding=1`}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* FOOTER */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              className="p-4 bg-black/50 backdrop-blur-sm border-t border-white/10 flex flex-wrap items-center gap-2"
            >
              {availableVideos.map((video) => {
                const active = video.data?.videoId === selectedVideo;
                if (active) return null;

                return (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video.data!.videoId!)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium"
                  >
                    <video.icon className="w-4 h-4" />
                    {video.label}
                  </button>
                );
              })}

              <a
                href={`https://www.youtube.com/watch?v=${selectedVideo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                YouTube
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
