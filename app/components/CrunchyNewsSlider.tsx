"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectCoverflow,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import Image from "next/image";
import { Rss, ExternalLink, Clock, TrendingUp } from "lucide-react";

const RSS_CRUNCHYROLL =
  "https://cr-news-api-service.prd.crunchyrollsvc.com/v1/fr-FR/rss";

interface ParsedArticle {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  description?: string;
  enclosure?: { url: string };
  mediaThumbnail?: { $: { url: string } }[];
}

interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl?: string | null;
}

async function fetchCrunchyNews(): Promise<Article[]> {
  try {
    const Parser = (await import("rss-parser")).default;
    const response = await fetch(RSS_CRUNCHYROLL);
    const xmlText = await response.text();

    const parser = new Parser({
      customFields: {
        item: [["media:thumbnail", "mediaThumbnail", { keepArray: true }]],
      },
    });

    const feed = await parser.parseString(xmlText);
    const items = feed.items as ParsedArticle[];

    return items
      .map((item) => {
        const imageUrl =
          item.mediaThumbnail?.[0]?.$.url || item.enclosure?.url || null;

        const rawDesc = item.content || item.description || "";
        const cleanDesc = rawDesc
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();

        return {
          title: item.title || "Titre inconnu",
          link: item.link || "#",
          pubDate: item.pubDate || new Date().toISOString(),
          description:
            cleanDesc.substring(0, 120) + (cleanDesc.length > 120 ? "..." : ""),
          imageUrl,
        };
      })
      .slice(0, 7);
  } catch (error) {
    console.error("Erreur Crunchyroll RSS :", error);
    return [];
  }
}

export default function CrunchyNewsSlider() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrunchyNews()
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-pink-500/10 dark:from-orange-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-3xl p-20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,107,0,0.1),transparent)]"></div>
        <div className="relative flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <Rss className="w-16 h-16 text-orange-500 dark:text-orange-400 animate-pulse" />
            <TrendingUp className="w-8 h-8 text-pink-500 absolute -top-2 -right-2 animate-bounce" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 dark:from-orange-400 dark:to-pink-400 bg-clip-text text-transparent animate-pulse">
              Chargement des dernières news
            </p>
            <div className="flex gap-2 justify-center">
              <span
                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        </div>
      </div>
    );

  if (!articles.length && !loading)
    return (
      <div className="flex justify-center items-center h-48 bg-gradient-to-br from-red-500/10 to-orange-500/10 dark:from-red-900/20 dark:to-orange-900/20 rounded-3xl p-6 border-2 border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 font-semibold text-lg">
          ⚠️ Impossible de charger les news Crunchyroll
        </p>
      </div>
    );

  return (
    <div className="relative max-w-[1600px] mx-auto py-12 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-pink-500/5 dark:from-orange-900/10 dark:to-pink-900/10 rounded-3xl blur-3xl -z-10"></div>

      {/* Header Section */}
      <div className="relative mb-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-orange-500 to-pink-500 p-3 rounded-2xl shadow-2xl">
                <Rss className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-black bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 dark:from-orange-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                News
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">
                Les dernières actualités anime & manga
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-orange-200 dark:border-orange-800 shadow-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              En direct
            </span>
          </div>
        </div>
      </div>

      {/* Swiper Section */}
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={1}
        loop={true}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2,
          slideShadows: false,
        }}
        navigation={{
          nextEl: ".swiper-button-next-custom",
          prevEl: ".swiper-button-prev-custom",
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          640: { slidesPerView: 1.5 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 2.5 },
          1280: { slidesPerView: 3 },
        }}
        className="!pb-16"
      >
        {articles.map((article, idx) => (
          <SwiperSlide key={article.link || idx} className="!h-auto">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full"
            >
              <div className="relative h-full rounded-3xl overflow-hidden bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 dark:border-slate-700">
                {/* Image Container with Overlay */}
                {article.imageUrl && (
                  <div className="relative w-full aspect-video overflow-hidden">
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                    {/* Hover Icon */}
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shadow-lg">
                      <ExternalLink className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>

                    {/* Badge NEW */}
                    {idx < 2 && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-black rounded-full shadow-lg animate-pulse">
                        🔥 NEW
                      </div>
                    )}
                  </div>
                )}

                {/* Content Section */}
                <div className="p-6 flex flex-col h-full">
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                      {article.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4">
                      {article.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 text-orange-500" />
                      {new Date(article.pubDate).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>

                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform duration-300 inline-flex items-center gap-1">
                      Lire plus
                      <span className="text-lg">→</span>
                    </span>
                  </div>
                </div>

                {/* Shine Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
              </div>
            </a>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <div className="swiper-button-prev-custom absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-xl flex items-center justify-center cursor-pointer hover:bg-orange-500 hover:text-white transition-all duration-300 group border-2 border-orange-200 dark:border-orange-800">
        <span className="text-2xl font-bold group-hover:scale-110 transition-transform">
          ‹
        </span>
      </div>
      <div className="swiper-button-next-custom absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-xl flex items-center justify-center cursor-pointer hover:bg-orange-500 hover:text-white transition-all duration-300 group border-2 border-orange-200 dark:border-orange-800">
        <span className="text-2xl font-bold group-hover:scale-110 transition-transform">
          ›
        </span>
      </div>
    </div>
  );
}
