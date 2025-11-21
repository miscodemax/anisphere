// components/NewsCard.tsx (anciennement NewsItem)
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ExternalLink,
  User2,
  BookOpen,
  ImageOff,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
// Importez le type Article pour la cohérence
import { Article } from "../news/page";
// Assurez-vous d'exporter l'interface Article dans page.tsx

// ==================== UTILS ====================
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    // Format plus convivial (ex: "21 nov. 2025")
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case "Crunchyroll":
      return "bg-orange-500 text-white"; // Couleur vive pour Crunchyroll
    case "IGN France":
      return "bg-blue-600 text-white"; // Couleur forte pour IGN
    default:
      return "bg-slate-500 text-white";
  }
};

// ==================== COMPOSANT DE CARTE DE NOUVELLE (NewsCard) ====================
export default function NewsCard({
  article,
  index,
  isFeatured = false, // Nouvelle prop pour la carte "À la une"
}: {
  article: Article;
  index: number;
  isFeatured?: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(article.imageUrl);

  // Classes conditionnelles basées sur le mode (Featured vs. Grid)
  const cardClasses = isFeatured
    ? "bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-indigo-400/50"
    : "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700";

  // Classes pour le conteneur principal (grille ou "À la une")
  const layoutClasses = isFeatured
    ? "flex flex-col md:flex-row gap-6 p-6" // Mise en page horizontale pour l'article à la une
    : "flex flex-col"; // Mise en page verticale pour les cartes de grille

  // Classes pour l'image (ratio différent pour "À la une")
  const imageClasses = isFeatured
    ? "md:w-1/2 relative aspect-video overflow-hidden rounded-lg shadow-xl flex-shrink-0"
    : "relative aspect-video overflow-hidden rounded-t-xl";

  const contentClasses = isFeatured ? "md:w-1/2 space-y-4" : "p-4 space-y-3";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08, // Délai pour l'effet d'apparition
      }}
      whileHover={{
        scale: isFeatured ? 1.005 : 1.03, // Effet subtil sur la carte
        boxShadow: isFeatured
          ? "0 25px 50px -12px rgba(99, 102, 241, 0.25)"
          : "0 10px 15px -3px rgba(99, 102, 241, 0.2)",
      }}
      className={`transition-all duration-300 cursor-pointer ${cardClasses} ${
        isFeatured ? "h-full" : "h-full flex flex-col"
      }`}
    >
      <Link
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
        aria-label={`Lire l'article : ${article.title}`}
      >
        <div className={layoutClasses}>
          {/* Colonne/Section Image */}
          {imgSrc ? (
            <div className={imageClasses}>
              <Image
                src={imgSrc}
                alt={article.title}
                fill
                sizes={
                  isFeatured
                    ? "(max-width: 768px) 100vw, 50vw"
                    : "(max-width: 768px) 100vw, 33vw"
                }
                priority={index < 3}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => setImgSrc(undefined)} // Déclenche le placeholder si l'image échoue
              />
              {/* Overlay pour l'indication de lien externe */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
            </div>
          ) : (
            // Placeholder si l'image est manquante ou échouée
            <div
              className={`flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 ${imageClasses}`}
            >
              <ImageOff className="w-10 h-10" />
            </div>
          )}

          {/* Colonne/Section Contenu Textuel */}
          <div className={`flex flex-col justify-between ${contentClasses}`}>
            <div>
              {/* 🌟 MÉTADONNÉES SUPÉRIEURES (Source, Catégorie & Auteur) */}
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold mb-2">
                {/* 💡 Indicateur de source (Cruchyroll vs IGN) */}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${getSourceColor(
                    article.source
                  )}`}
                >
                  {article.source}
                </span>

                {article.category && (
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    {article.category}
                  </span>
                )}
              </div>

              {/* 📰 TITRE */}
              <h2
                className={`font-extrabold text-slate-800 dark:text-white leading-snug 
                    group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors 
                    ${
                      isFeatured
                        ? "text-3xl lg:text-4xl line-clamp-3"
                        : "text-xl line-clamp-2"
                    }`}
              >
                {article.title}
              </h2>

              {/* 📝 DESCRIPTION */}
              <p
                className={`text-slate-600 dark:text-slate-300 mt-2 ${
                  isFeatured ? "text-lg line-clamp-4" : "text-sm line-clamp-3"
                }`}
              >
                {article.description}
              </p>
            </div>

            {/* ⏱️ MÉTADONNÉES INFÉRIEURES (Date & Auteur) */}
            <div className="pt-4 mt-auto flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                <time dateTime={article.pubDate}>
                  {formatDate(article.pubDate)}
                </time>
              </span>

              {article.author && (
                <span className="flex items-center gap-1">
                  <User2 className="w-4 h-4" aria-hidden="true" />
                  <span className="font-medium">{article.author}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
