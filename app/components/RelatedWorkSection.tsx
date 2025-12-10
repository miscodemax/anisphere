"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layers, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

// Normalisation utils (mêmes que ton OtakuBot)
function normalize(v: number | null, max: number) {
  if (!v || v <= 0) return 0;
  return Math.min(v / max, 1);
}
function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

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
        // 1) Embedding de l’anime actuel
        const { data: current } = await supabase
          .from(currentAnime.table)
          .select("embedding")
          .eq("id", currentAnime.id)
          .single();

        if (!current?.embedding) {
          console.warn("❌ Aucun embedding pour l'anime courant");
          setLoading(false);
          return;
        }

        const embedding = toArray(current.embedding);

        // ============================================================
        // 🚀 RPC match_anime_strict — version PURE
        // ============================================================
        // ============================================================
        // 🚀 RPC match_anime_strict — version PURE
        // ============================================================
        const { data, error } = await supabase.rpc("match_anime_strict", {
          query_embedding: embedding,
          match_count: 12,
          min_score: 0.0,
        });

        if (error) {
          console.error("❌ RPC erreur:", error);
          setLoading(false);
          return;
        }

        // IDs des résultats vectoriels
        const ids = data.map((m: any) => m.id);

        // ============================================================
        // ⭐ On récupère les métadonnées complètes (incl. image_url)
        // ============================================================
        const { data: meta, error: metaErr } = await supabase
          .from("anime_all")
          .select("id, title, image_url, start_date")
          .in("id", ids);

        if (metaErr) {
          console.error("❌ Erreur métadonnées:", metaErr);
          setLoading(false);
          return;
        }

        // map des scores de similarité
        const simMap = new Map();
        for (const m of data) simMap.set(m.id, m.similarity);

        // Fusion résultats RPC + métadonnées
        let candidates = meta.map((a: any) => ({
          id: a.id,
          title: a.title,
          image_url: a.image_url,
          similarity: simMap.get(a.id) ?? 0,
          url: `/anime/${a.id}`,
        }));

        // remove current anime
        candidates = candidates.filter((a) => a.id !== currentAnime.id);

        // tri par similarité
        candidates.sort((a, b) => b.similarity - a.similarity);

        // top 12
        setRelatedWorks(candidates.slice(0, 12));
      } catch (err) {
        console.error("Erreur : ", err);
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
              <h2 className="text-2xl sm:text-3xl font-black">
                Œuvres Similaires
              </h2>
              <p className="text-sm opacity-70">Recommandées selon cet anime</p>
            </div>
          </div>

          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {relatedWorks.length} trouvés
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {relatedWorks.map((anime: any, index: number) => (
            <motion.div
              key={anime.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link href={anime.url} className="group block">
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
          ))}
        </div>
      </div>
    </motion.div>
  );
}
