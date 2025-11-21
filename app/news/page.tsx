// app/news/page.tsx
import Parser from "rss-parser";
import NewsCard from "../components/NewsCard";
import FeaturedSlider from "../components/FeaturedSlider";
import { Sparkles, Rss } from "lucide-react";

const RSS_CRUNCHYROLL =
  "https://cr-news-api-service.prd.crunchyrollsvc.com/v1/fr-FR/rss";
const RSS_IGN = "https://fr.ign.com/feed.xml";
const RSS_GOOGLE_NEWS =
  "https://news.google.com/rss/search?q=anime+OR+manga&hl=fr&gl=FR&ceid=FR:fr";

const DEFAULT_IMAGE =
  "https://via.placeholder.com/400x200.png?text=Image+non+disponible";

export interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl: string;
  author: string;
  category: string;
  source: string;
}

interface ParsedArticle {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  content?: string;
  creator?: string;
  category?: string;
  enclosure?: { url?: string };
  mediaThumbnail?: { $?: { url?: string } }[];
}

async function parseRss(url: string, source: string): Promise<Article[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    const xml = await response.text();

    const parser = new Parser({
      customFields: {
        item: [
          ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
          ["media:content", "mediaContent", { keepArray: true }],
          ["dc:creator", "creator"],
          ["category", "category"],
        ],
      },
    });

    const feed = await parser.parseString(xml);
    const items = feed.items as ParsedArticle[];

    return items
      .map((i) => {
        // --------- EXTRACTION D'IMAGE PLUS INTELLIGENTE ---------
        const image =
          // Google News: <media:content url=""/>
          i.mediaContent?.[0]?.$.url ||
          // Google News: <media:thumbnail url=""/>
          i.mediaThumbnail?.[0]?.$.url ||
          // IGN: <enclosure url=""/>
          i.enclosure?.url ||
          DEFAULT_IMAGE;

        const cleanDesc = (i.content || i.description || "")
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();

        return {
          title: i.title || "Titre inconnu",
          link: i.link || "#",
          pubDate: i.pubDate || new Date().toISOString(),
          description:
            cleanDesc.substring(0, 200) + (cleanDesc.length > 200 ? "..." : ""),
          imageUrl: image,
          author: i.creator || source,
          category: i.category || "Actualités",
          source,
        };
      })
      .filter((a) => a.imageUrl !== DEFAULT_IMAGE);
  } catch (err) {
    console.error(`Erreur RSS (${source})`, err);
    return [];
  }
}

// ---------- FUSION DES 3 SOURCES ----------
async function getSeparatedNews() {
  const [crunchy, ign, google] = await Promise.all([
    parseRss(RSS_CRUNCHYROLL, "Crunchyroll"),
    parseRss(RSS_IGN, "IGN France"),
    parseRss(RSS_GOOGLE_NEWS, "Google News"),
  ]);

  // fusion + tri global
  const allNews = [...crunchy, ...ign, ...google].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  return { allNews, crunchy, ign, google };
}

// ---------- PAGE SERVER ----------
export default async function NewsPage() {
  const { allNews } = await getSeparatedNews();

  const articlesForSlider = allNews.slice(0, 5);
  const remainingArticles = allNews.slice(5);

  const totalNewsCount = allNews.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-20">
      <header className="max-w-7xl mx-auto pt-16 px-4 sm:px-6 lg:px-8 text-center mb-16 border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="flex justify-center items-center gap-4 mb-4">
          <Rss className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">
              Actualités
            </span>{" "}
            Otaku & Geek
          </h1>
          <Sparkles className="w-8 h-8 text-amber-500" />
        </div>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
          Découvrez les dernières actualités de **Crunchyroll**, **IGN France**
          et **Google News** : **{totalNewsCount} articles** chargés.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {articlesForSlider.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 border-b-4 border-indigo-500 pb-2 inline-block">
              🔥 À la Une
            </h2>
            <FeaturedSlider articles={articlesForSlider} />
          </section>
        )}

        <hr className="my-10 border-slate-200 dark:border-slate-800" />

        <section>
          <h2 className="text-3xl font-bold mb-8">Autres Articles Récents</h2>

          {remainingArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {remainingArticles.map((a, i) => (
                <NewsCard
                  key={a.link + i}
                  article={a}
                  index={i}
                  isFeatured={false}
                />
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-slate-500 dark:text-slate-400">
              Aucun autre article disponible pour le moment.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
