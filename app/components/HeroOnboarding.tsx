"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Lightbulb,
  Compass,
  Heart,
  Zap,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

// --- Imports Swiper ---
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
// ----------------------

// Créez le client Supabase
const supabase = createClient();

// ==================== HERO ONBOARDING (VERSION STREAMING - SUPABASE) ====================
const HeroOnboarding = () => {
  const [latestAnimeImages, setLatestAnimeImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour charger les données
  useEffect(() => {
    const fetchLatestAnimes = async () => {
      // Pour une meilleure performance, ne chargez qu'un petit nombre d'images (ex: 5)
      const { data, error } = await supabase
        .from("anime_nouveautes") // Nom de votre table
        .select("id, type, image_url, title") // Sélectionnez les colonnes nécessaires
        // Utiliser .or() pour inclure les types 'TV' OU 'OAV'
        .or("type.eq.TV,type.eq.Movie")
        .order("created_at", { ascending: false }) // Triez par le plus récent
        .limit(15); // Limitez à 15 images
      if (error) {
        console.error("Erreur de chargement des animes:", error);
        setError("Erreur de chargement des données. Veuillez réessayer.");
      } else {
        // Mappez les données pour correspondre à la structure attendue par le Swiper
        const formattedData = data.map((anime) => ({
          id: anime.id,
          type: anime.type,
          url: anime.image_url, // Assurez-vous que c'est la bonne colonne pour l'URL de l'image
          alt: `Image de ${anime.titre}`,
        }));
        setLatestAnimeImages(formattedData);
      }
      setIsLoading(false);
    };

    fetchLatestAnimes();
  }, []);

  const features = [
    {
      icon: Lightbulb,
      title: "Recommandations IA",
      description: "Découvrez des animes personnalisés selon vos goûts",
      gradient: "from-amber-500 to-orange-500",
    },
    // ... (autres features inchangées)
    {
      icon: Compass,
      title: "Explorer le Catalogue",
      description: "Parcourez des milliers d'animes et mangas",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Heart,
      title: "Ma Liste",
      description: "Suivez vos animes favoris et découvrez des pépites",
      gradient: "from-pink-500 to-rose-500",
    },
  ];

  // Affichage de chargement ou d'erreur
  if (isLoading) {
    return (
      <div className="relative flex items-center justify-center w-full h-[600px] bg-gray-900 rounded-3xl mb-12 shadow-2xl">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mr-3" />
        <span className="text-white text-xl">Chargement des nouveautés...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex items-center justify-center w-full h-[600px] bg-red-900/50 rounded-3xl mb-12 shadow-2xl">
        <span className="text-red-300 text-xl">{error}</span>
      </div>
    );
  }

  return (
    <div className="relative text-center overflow-hidden h-[600px] mb-12 shadow-2xl rounded-3xl">
      {/* 1. Swiper Background - Full Width, Full Height */}
      <div className="absolute inset-0 z-0">
        {/* Le Swiper n'est rendu que si des images ont été chargées */}
        {latestAnimeImages.length > 0 ? (
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            spaceBetween={0}
            slidesPerView={1}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            loop={true}
            className="w-full h-full"
          >
            {latestAnimeImages.map((anime) => (
              <SwiperSlide key={anime.id}>
                <div
                  className="w-full h-full bg-cover bg-center transition-all duration-1000 ease-in-out"
                  style={{ backgroundImage: `url(${anime.url})` }}
                  aria-label={anime.alt}
                  role="img"
                >
                  {/* Overlay pour assombrir */}
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          // Fallback si aucune donnée n'est trouvée (optionnel)
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
            <p className="text-white/80">
              Aucun anime récent trouvé. Affichage du fond par défaut.
            </p>
          </div>
        )}
      </div>

      {/* 2. Content Overlay - Positionné au-dessus du Swiper */}
      <div className="relative z-10 p-8 md:p-12 w-full h-full flex flex-col justify-center">
        {/* Titre et Sous-titre */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl leading-tight">
            Bienvenue sur <span className="text-yellow-300">AnimeHub</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-medium max-w-4xl mx-auto drop-shadow-lg">
            Votre destination ultime pour découvrir, explorer et suivre vos
            animes et mangas préférés
          </p>
        </motion.div>

        {/* Features Grid (inchangé) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all cursor-pointer group shadow-xl"
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Button (inchangé) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-10"
        >
          <button className="group px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-purple-800 font-black text-lg rounded-2xl shadow-2xl hover:shadow-yellow-400/50 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto">
            <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            Obtenir mes recommandations
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroOnboarding;
