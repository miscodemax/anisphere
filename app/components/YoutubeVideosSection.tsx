"use client";

import { useState, useEffect } from "react";
import { Play, Film, Music, Tv, Loader2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface YouTubeVideo {
  found: boolean;
  videoId: string | null;
  title: string | null;
  thumbnail?: string;
  channelTitle?: string;
  publishedAt?: string;
}

interface YouTubeVideosSectionProps {
  animeTitle: string;
  animeEnglishTitle?: string;
}

export default function YouTubeVideosSection({
  animeTitle,
  animeEnglishTitle,
}: YouTubeVideosSectionProps) {
  const [trailerData, setTrailerData] = useState<YouTubeVideo | null>(null);
  const [openingData, setOpeningData] = useState<YouTubeVideo | null>(null);
  const [episodeData, setEpisodeData] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null); // Utiliser le titre anglais en priorité pour de meilleurs résultats YouTube // Déplacé en dehors de l'useEffect pour une meilleure cohérence des dépendances

  const effectiveTitle = animeEnglishTitle?.trim() || animeTitle?.trim() || "";

  useEffect(() => {
    // Ne rien faire si le titre est vide
    if (!effectiveTitle) {
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
            )}&type=${type}`
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

        // NOUVEAU : Sélectionner le premier résultat valide à afficher par défaut
        if (trailer?.found && trailer.videoId) {
          setSelectedVideo(trailer.videoId);
        } else if (opening?.found && opening.videoId) {
          setSelectedVideo(opening.videoId);
        } else if (episode?.found && episode.videoId) {
          setSelectedVideo(episode.videoId);
        }
      } catch (error) {
        console.error("Erreur recherche YouTube:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchYouTubeVideos();
  }, [effectiveTitle]); // Dépend de la variable composite

  const videos = [
    {
      id: "trailer",
      data: trailerData,
      icon: Film,
      label: "Trailer",
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-50 dark:bg-red-500/10",
      borderColor: "border-red-200 dark:border-red-500/20",
    },
    {
      id: "opening",
      data: openingData,
      icon: Music,
      label: "Opening 1",
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50 dark:bg-purple-500/10",
      borderColor: "border-purple-200 dark:border-purple-500/20",
    },
    {
      id: "episode",
      data: episodeData,
      icon: Tv,
      label: "Épisode 1",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
      borderColor: "border-blue-200 dark:border-blue-500/20",
    },
  ];

  const availableVideos = videos.filter((v) => v.data?.found && v.data.videoId);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
               {" "}
        <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                   {" "}
          <span className="ml-3 text-slate-600 dark:text-slate-400 font-semibold">
                        Recherche de vidéos...          {" "}
          </span>
                 {" "}
        </div>
             {" "}
      </div>
    );
  }

  if (availableVideos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700"
    >
           {" "}
      <div className="flex items-center gap-3 mb-6">
               {" "}
        <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                    <Play className="w-6 h-6 text-white" />       {" "}
        </div>
               {" "}
        <h2 className="text-3xl font-black text-slate-800 dark:text-white">
                    Vidéos        {" "}
        </h2>
               {" "}
        {availableVideos.length > 0 && selectedVideo && (
          <span className="ml-auto text-sm font-medium text-slate-500 dark:text-slate-400">
                       {" "}
            {availableVideos.findIndex(
              (v) => v.data?.videoId === selectedVideo
            ) + 1}{" "}
            / {availableVideos.length}         {" "}
          </span>
        )}
             {" "}
      </div>
            {/* Player */}     {" "}
      <AnimatePresence mode="wait">
               {" "}
        {selectedVideo && (
          <motion.div
            key={selectedVideo} // Ajout de la clé pour forcer la ré-animation
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-6"
          >
                       {" "}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-slate-200 dark:border-slate-700">
                           {" "}
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full"
              />
                         {" "}
            </div>
                     {" "}
          </motion.div>
        )}
             {" "}
      </AnimatePresence>
            {/* Vidéo grid */}     {" "}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {" "}
        {availableVideos.map((video) => {
          const vid = video.data!;
          const isSelected = vid.videoId === selectedVideo;
          const thumbnail =
            vid.thumbnail ||
            `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`;

          return (
            <motion.button
              key={video.id}
              onClick={() => setSelectedVideo(vid.videoId!)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-xl border-4 transition-all hover:shadow-lg group text-left
                ${
                isSelected
                  ? "border-red-500 shadow-xl"
                  : `${video.borderColor} ${video.bgColor}`
              }`}
            >
                           {" "}
              <div className="aspect-video relative">
                               {" "}
                <img
                  src={thumbnail}
                  alt={vid.title || video.label}
                  className="w-full h-full object-cover"
                />
                               {" "}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center">
                                   {" "}
                  <div
                    className={`p-4 rounded-full bg-gradient-to-br ${
                      video.color
                    } shadow-2xl group-hover:scale-110 transition-transform ${
                      isSelected ? "scale-110" : ""
                    }`}
                  >
                                       {" "}
                    <video.icon className="w-8 h-8 text-white" />               
                     {" "}
                  </div>
                                 {" "}
                </div>
                             {" "}
              </div>
                           {" "}
              <div className="p-4">
                               {" "}
                <h3 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">
                                    {video.label}               {" "}
                </h3>
                               {" "}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {vid.title}               {" "}
                </p>
                             {" "}
              </div>
                         {" "}
            </motion.button>
          );
        })}
             {" "}
      </div>
           {" "}
      {selectedVideo && (
        <div className="flex items-center justify-end mt-4">
                   {" "}
          <a
            href={`https://www.youtube.com/watch?v=${selectedVideo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all text-sm"
          >
                        <ExternalLink className="w-4 h-4" />            Ouvrir
            sur YouTube          {" "}
          </a>
                 {" "}
        </div>
      )}
         {" "}
    </motion.div>
  );
}
