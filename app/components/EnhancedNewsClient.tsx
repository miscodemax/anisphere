// components/NewsItem.tsx
// Rénommé de NewsCard à NewsItem pour une meilleure sémantique de liste.

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ExternalLink, User2, BookOpen, ImageOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ==================== TYPES ====================
interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl?: string;
  author?: string;
  category?: string;
}

// Formatage de la date amélioré
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString); // Utilisation d'un format plus court pour une lecture rapide
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

// Image de fallback (remplacez par votre propre image de secours si vous en avez une)
const FALLBACK_IMAGE_URL = "/placeholder-news.jpg";

// ==================== COMPOSANT D'UNE LIGNE DE NOUVELLE (News Item) ====================
export default function NewsItem({
  article,
  index,
}: {
  article: Article;
  index: number;
}) {
  // 1. Gérer l'état de l'image (si elle n'arrive pas à charger)
  const [imgSrc, setImgSrc] = useState(article.imageUrl); // Déterminer la position de l'image (alternance gauche/droite pour un effet visuel dynamique)

  const imageOnLeft = index % 2 === 0;

  // Déterminer les classes de disposition
  const imageContainerClasses = imgSrc
    ? "md:w-1/3 flex-shrink-0 relative overflow-hidden rounded-md shadow-lg aspect-video md:aspect-[4/3]"
    : "hidden"; // Masquer si l'image est manquante ou a échoué

  const contentClasses = imgSrc ? "md:w-2/3 space-y-3" : "md:w-full space-y-3"; // Prendre toute la largeur si pas d'image

  return (
    <motion.article // Utilisation de <article> pour la sémantique A11Y
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
      }}
      whileHover={{
        // Effet subtil de lueur et de contraste
        backgroundColor: "rgba(99, 102, 241, 0.05)",
        borderColor: "rgb(99, 102, 241)",
      }}
      className="bg-white dark:bg-slate-900 rounded-lg p-6 mb-4 
                       border border-slate-200 dark:border-slate-800 
                       transition-all duration-300 group cursor-pointer 
                       shadow-md hover:shadow-lg dark:hover:shadow-indigo-500/10"
    >
                 {" "}
      <Link
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        aria-label={`Lire l'article : ${article.title}`} // Amélioration A11Y
      >
        {/* Conteneur principal - Image et Contenu */}               {" "}
        <div
          className={`flex flex-col md:flex-row gap-6 ${
            imageOnLeft ? "md:flex-row-reverse" : ""
          }`}
        >
          {/* Colonne 1: Image (Thumbnail) */}
          {imgSrc ? (
            <div className={imageContainerClasses}>
              {/* Utilisation de next/image */}
              <Image
                src={imgSrc}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={index < 3}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                // 🚨 GESTION DE L'ERREUR D'IMAGE
                onError={() => setImgSrc(undefined)}
              />
              {/* Lien externe visuel */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ExternalLink className="w-5 h-5 text-white" />
              </div>
            </div>
          ) : (
            // Placeholder si l'image est manquante ou échouée (si vous voulez la garder visible)
            <div className="hidden md:flex md:w-1/3 items-center justify-center aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-md text-slate-400">
              <ImageOff className="w-8 h-8" />
            </div>
          )}

          {/* Colonne 2: Contenu Textuel */}
          <div className={contentClasses}>
            {/* 🌟 MÉTADONNÉES SUPÉRIEURES (Catégorie & Auteur) */}
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
              {article.category && (
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  {article.category}
                </span>
              )}
              {article.author && (
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <User2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only">Auteur : </span>
                  {article.author}
                </span>
              )}
            </div>

            {/* 📰 TITRE */}
            <h2
              className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white 
                                       leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
            >
              {article.title}
            </h2>

            {/* 📝 DESCRIPTION */}
            <p className="text-base text-slate-600 dark:text-slate-300 line-clamp-3">
              {article.description}
            </p>

            {/* ⏱️ MÉTADONNÉES INFÉRIEURES (Date) */}
            <div className="flex items-center gap-2 pt-2 text-sm text-slate-500 dark:text-slate-400">
                                         {" "}
              <Clock className="w-4 h-4 text-indigo-500" aria-hidden="true" /> 
                                       {" "}
              <time dateTime={article.pubDate}>
                Publié le {formatDate(article.pubDate)}
              </time>
                                     {" "}
            </div>
          </div>
        </div>
                   {" "}
      </Link>
             {" "}
    </motion.article>
  );
}
