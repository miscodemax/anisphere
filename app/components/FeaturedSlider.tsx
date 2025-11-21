// components/FeaturedSlider.tsx (Corrigé et Amélioré)
"use client";

import { Article } from "../news/page";
import { Swiper, SwiperSlide } from "swiper/react";
// 💡 Ajout de EffectFade
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import NewsCard from "./NewsCard";

// Importations CSS obligatoires pour Swiper
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
// 💡 Import du CSS EffectFade
import "swiper/css/effect-fade";

export default function FeaturedSlider({ articles }: { articles: Article[] }) {
  // Sélectionne les 5 articles les plus récents pour le slider
  const sliderArticles = articles.slice(0, 5);

  if (!sliderArticles.length) return null;

  return (
    // 💡 Ajustement du padding bas: plus discret mais suffisant pour la pagination
    <div className="relative pb-6">
      <Swiper
        // 💡 Ajout de EffectFade
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        // 💡 Utilisation de l'effet Fade pour une transition "magazine"
        effect="fade"
        fadeEffect={{ crossFade: true }}
        spaceBetween={0} // 💡 Plus de spaceBetween avec Fade
        slidesPerView={1}
        loop={true}
        // 💡 Navigation: Ajout des classes pour un style plus "classe"
        navigation={{
          nextEl: ".swiper-button-next-featured",
          prevEl: ".swiper-button-prev-featured",
        }}
        // 💡 Pagination: Ajout des classes pour une meilleure position
        pagination={{
          clickable: true,
          el: ".swiper-pagination-featured", // Cible l'élément de pagination personnalisé
        }}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        className="featured-swiper rounded-xl shadow-2xl" // Ajouter ombre/bordure ici pour l'effet global
      >
        {sliderArticles.map((article, index) => (
          <SwiperSlide key={article.link + index}>
            {/* NewsCard en mode Featured gère son propre style intérieur */}
            <NewsCard article={article} index={index} isFeatured={true} />
          </SwiperSlide>
        ))}

        {/* ---------- 💡 NOUVEAU : Contrôles de Navigation et Pagination Personnalisés ---------- */}

        {/* Conteneur pour la pagination (points) */}
        <div className="swiper-pagination-featured absolute bottom-0 left-0 right-0 z-10 flex justify-center py-2"></div>

        {/* Boutons de navigation (flèches) */}
        <div className="absolute inset-0 flex items-center justify-between z-10 pointer-events-none">
          {/* Bouton Précédent */}
          <div className="swiper-button-prev-featured pointer-events-auto bg-black/30 hover:bg-black/50 backdrop-blur-sm p-3 rounded-r-lg ml-[-1px] transition-all duration-300 cursor-pointer">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </div>

          {/* Bouton Suivant */}
          <div className="swiper-button-next-featured pointer-events-auto bg-black/30 hover:bg-black/50 backdrop-blur-sm p-3 rounded-l-lg mr-[-1px] transition-all duration-300 cursor-pointer">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </div>
        </div>
        {/* ----------------------------------------------------------------------------------- */}
      </Swiper>
    </div>
  );
}

// NOTE: Pour que les styles des flèches et des points soient beaux,
// vous devez ajouter ces styles personnalisés dans votre CSS global (ou utiliser un fichier CSS importé)
// car Swiper.js a des styles par défaut qui peuvent être difficiles à écraser avec Tailwind CSS en ligne.
// Voir la section ci-dessous pour le CSS requis.
