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

interface YouTubeVideo {
  found: boolean;
  videoId: string | null;
  title: string | null;
  thumbnail?: string;
  channelTitle?: string;
  publishedAt?: string;
  fromCache?: boolean;
  table?: string;
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
  const [trailerData, setTrailerData] = useState<YouTubeVideo | null>(null);
  const [openingData, setOpeningData] = useState<YouTubeVideo | null>(null);
  const [episodeData, setEpisodeData] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  const effectiveTitle = animeTitle?.trim() || animeEnglishTitle?.trim() || "";

  useEffect(() => {
    if (!effectiveTitle || !animeId) {
      setLoading(false);
      return;
    }

    async function fetchYouTubeVideos() {
      setLoading(true);

      try {
        const endpoints = ["trailer", "opening", "episode"].map((type) =>
          fetch(
            `/api/youtube-search?title=${encodeURIComponent(
              effectiveTitle
            )}&type=${type}&id=${animeId}`
          )
        );

        const [trailerRes, openingRes, episodeRes] = await Promise.all(
          endpoints
        );

        const [trailer, opening, episode] = await Promise.all([
          trailerRes.json(),
          openingRes.json(),
          episodeRes.json(),
        ]);

        setTrailerData(trailer);
        setOpeningData(opening);
        setEpisodeData(episode);
      } catch (error) {
        console.error("Erreur recherche YouTube:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchYouTubeVideos();
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
      id: "episode",
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

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 animate-spin" />
          <span className="ml-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            Recherche de vidéos...
          </span>
        </div>
      </motion.div>
    );
  }

  if (availableVideos.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-slate-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg sm:rounded-xl shadow-lg">
            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white">
            Vidéos
          </h2>
        </div>

        {/* Grid de vidéos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {availableVideos.map((video, index) => {
            const vid = video.data!;
            const thumbnail =
              vid.thumbnail ||
              `https://img.youtube.com/vi/${vid.videoId}/mqdefault.jpg`;

            return (
              <motion.button
                key={video.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => {
                  setSelectedVideo(vid.videoId!);
                  setShowFullPlayer(true);
                }}
                className="group relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-lg active:scale-95 touch-manipulation"
              >
                <div className="relative aspect-video">
                  <img
                    src={thumbnail}
                    alt={vid.title || video.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`p-3 sm:p-4 rounded-full ${video.bgGradient} shadow-2xl transform group-hover:scale-110 group-active:scale-100 transition-transform`}
                    >
                      <video.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                    <h3 className="font-bold text-white text-sm sm:text-base mb-0.5 drop-shadow-lg">
                      {video.label}
                    </h3>
                    <p className="text-xs text-white/90 line-clamp-1 drop-shadow-md">
                      {vid.title}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
        <p className="mt-3 sm:mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          Appuyez pour regarder • Échap pour fermer
        </p>
      </motion.div>

      {/* Modal Player */}
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
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center justify-between p-3 sm:p-4 bg-black/50 backdrop-blur-sm border-b border-white/10"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={goToPrev}
                  disabled={!canGoPrev}
                  className={`p-2 rounded-lg transition-all ${
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
                  className={`p-2 rounded-lg transition-all ${
                    canGoNext
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="text-white/80 text-sm font-medium">
                {currentIndex + 1} / {availableVideos.length}
              </div>
              <button
                onClick={() => setShowFullPlayer(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>

            <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="w-full max-w-7xl"
              >
                <div className="relative w-full aspect-video rounded-lg sm:rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white/10">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0&modestbranding=1`}
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="p-3 sm:p-4 bg-black/50 backdrop-blur-sm border-t border-white/10"
            >
              <div className="mb-3 sm:mb-4">
                {availableVideos.map((video) => {
                  if (video.data?.videoId === selectedVideo) {
                    return (
                      <div key={video.id} className="text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`p-1.5 rounded-lg ${video.bgGradient}`}
                          >
                            <video.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-bold text-sm sm:text-base">
                            {video.label}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-white/90 line-clamp-2 mb-1">
                          {video.data.title}
                        </p>
                        {video.data.channelTitle && (
                          <p className="text-xs sm:text-sm text-white/60">
                            {video.data.channelTitle}
                          </p>
                        )}
                        {video.data.fromCache && (
                          <p className="text-xs sm:text-sm text-white/40 italic">
                            Depuis le cache ({video.data.table})
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {availableVideos.map((video) => {
                  const isActive = video.data?.videoId === selectedVideo;
                  if (isActive) return null;

                  return (
                    <button
                      key={video.id}
                      onClick={() => setSelectedVideo(video.data!.videoId!)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all touch-manipulation"
                    >
                      <video.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{video.label}</span>
                    </button>
                  );
                })}
                <a
                  href={`https://www.youtube.com/watch?v=${selectedVideo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all text-sm shadow-lg ml-auto touch-manipulation"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>YouTube</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
