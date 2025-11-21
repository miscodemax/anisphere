import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";

const YouTubePlayer = ({
  videoId,
  onClose,
}: {
  videoId: string;
  onClose: () => void;
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isHovering) {
      setShowControls(true);
    } else {
      timeout = setTimeout(() => setShowControls(false), 2000);
    }
    return () => clearTimeout(timeout);
  }, [isHovering]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Fond avec effet de blur progressif */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 backdrop-blur-xl bg-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
      </div>

      {/* Effet de vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`relative w-full ${
          isFullscreen ? "max-w-full h-screen" : "max-w-6xl mx-4"
        } aspect-video transition-all duration-500 ease-out`}
      >
        {/* Container principal avec bordure lumineuse */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)] group">
          {/* Bordure animée */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 p-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="w-full h-full bg-black rounded-2xl" />
          </div>

          {/* Iframe vidéo */}
          <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
            <iframe
              src={`${videoId}?autoplay=1${
                isMuted ? "&mute=1" : ""
              }&rel=0&modestbranding=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Contrôles overlay */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Gradient supérieur pour les contrôles */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 via-black/20 to-transparent" />

                {/* Boutons de contrôle */}
                <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
                  {/* Bouton Fullscreen */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-xl transition-all duration-300 shadow-lg border border-white/10"
                  >
                    <Maximize2 className="w-5 h-5 text-white" />
                  </motion.button>

                  {/* Bouton Son */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-xl transition-all duration-300 shadow-lg border border-white/10"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </motion.button>

                  {/* Bouton Fermer */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-3 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl rounded-xl transition-all duration-300 shadow-lg border border-red-500/20"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                </div>

                {/* Indicateur d'interaction en bas */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.5, y: 0 }}
                    className="text-white/60 text-sm font-light tracking-wide"
                  >
                    Appuyez sur ESC pour fermer
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading shimmer effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>

        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
      </motion.div>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </motion.div>
  );
};

export default YouTubePlayer;
