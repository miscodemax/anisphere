"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layers, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

// Convert embedding into array
function toArray(embedding: any): number[] {
  if (!embedding) return [];
  if (Array.isArray(embedding)) return embedding;
  if (typeof embedding === "string") return JSON.parse(embedding);
  return Object.values(embedding).map((v) => Number(v));
}

export default function RelatedWorksSection({ currentAnime }) {
  const [relatedWorks, setRelatedWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedWorks() {
      setLoading(true);
      const supabase = createClient();

      try {
        // 1. Fetch embedding for current anime
        const { data: currentData } = await supabase
          .from(currentAnime.table)
          .select("embedding")
          .eq("id", currentAnime.id)
          .single();

        if (!currentData?.embedding) {
          console.error("Embedding manquant pour l’anime courant.");
          setLoading(false);
          return;
        }

        const currentEmbedding = toArray(currentData.embedding);

        // 2. RPC call to multi-table search
        const { data: relatedData, error } = await supabase.rpc(
          "match_animes_multi_table",
          {
            query_embedding: currentEmbedding,
            match_count: 12,
          }
        );

        if (error) {
          console.error("Erreur RPC:", error);
          setLoading(false);
          return;
        }

        // 3. Filter out current anime
        const filtered = (relatedData || []).filter(
          (a: any) => a.id !== currentAnime.id
        );

        setRelatedWorks(filtered);
      } catch (err) {
        console.error("Erreur fetching related works:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRelatedWorks();
  }, [currentAnime]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">
            Recherche d'œuvres liées...
          </span>
        </div>
      </motion.div>
    );
  }

  if (!relatedWorks.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-8"
    >
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/5 dark:to-purple-500/5 rounded-2xl p-6 sm:p-8 shadow-xl border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">Œuvres Liées</h2>
              <p className="text-sm opacity-70">Saisons, films, OVA et plus</p>
            </div>
          </div>

          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {relatedWorks.length} trouvés
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {relatedWorks.map((anime: any, index: number) => {
            // 🟣 Fix : mapping des tables → query param
            let demographicQuery = "";
            switch (anime.source_table) {
              case "anime_shonen":
                demographicQuery = "shonen";
                break;
              case "anime_shoujo":
                demographicQuery = "shoujo";
                break;
              case "anime_seinen":
                demographicQuery = "seinen";
                break;
              case "anime_nouveautes":
                demographicQuery = "nouveautes";
                break;
              case "anime_catalogue_general":
                demographicQuery = "general";
                break;
              default:
                demographicQuery = "";
            }

            return (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/anime/${anime.id}?demographic=${demographicQuery}`}
                  className="group block"
                >
                  <div className="overflow-hidden rounded-xl bg-white dark:bg-slate-800 border hover:scale-105 transition">
                    <div className="relative aspect-[2/3]">
                      <img
                        src={anime.image_url || "/placeholder.png"}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-3">
                      <h3 className="font-bold text-sm line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {anime.title}
                      </h3>
                      {anime.year && (
                        <p className="text-xs opacity-70">{anime.year}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
