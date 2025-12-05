"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AnimeSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBox, setShowBox] = useState(false);

  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🚫 Fermer suggestions si clic extérieur
  useEffect(() => {
    function close(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowBox(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // 🔥 Recherche sémantique
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setShowBox(false);
      return;
    }

    setLoading(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/semantic-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            matchCount: 12,
            minSim: 0.35,
          }),
        });

        if (!res.ok) {
          console.error("API Semantic Error:", res.statusText);
          setResults([]);
          return;
        }

        const data = await res.json();

        setResults(data.results || []);
        setShowBox(true);
      } catch (err) {
        console.error("Erreur semantic-search:", err);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  // 🚀 Aller à la page anime
  function openAnime(anime: any) {
    router.push(`/anime/${anime.id}`);
    setShowBox(false);
  }

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      {/* Input */}
      <div className="flex items-center gap-2 bg-white dark:bg-indigo-950 rounded-xl border px-3 py-2 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <Input
          className="border-none shadow-none text-black dark:text-blue-200 dark:bg-indigo-950 focus-visible:ring-0"
          placeholder="Recherche intelligente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowBox(true)}
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {/* Suggestions */}
      {showBox && results.length > 0 && (
        <div className="absolute mt-2 w-full bg-white dark:bg-indigo-950 rounded-xl shadow-xl border p-2 z-50 max-h-80 overflow-y-auto">
          {results.map((anime) => (
            <div
              key={anime.id}
              onClick={() => openAnime(anime)}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-indigo-900 transition"
            >
              <img
                src={anime.image_url}
                className="w-12 h-16 object-cover rounded-md"
              />

              <div className="flex flex-col">
                <span className="font-semibold text-sm">{anime.title}</span>

                {/* Similarité */}
                {anime.similarity && (
                  <span className="text-xs text-gray-500 dark:text-gray-300">
                    Similarité: {(anime.similarity * 100).toFixed(1)}%
                  </span>
                )}

                {/* Année */}
                {anime.year && (
                  <span className="text-xs text-gray-500 dark:text-gray-300">
                    {anime.year}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aucun résultat */}
      {showBox && !loading && results.length === 0 && query.length >= 2 && (
        <div className="absolute mt-2 w-full bg-white dark:bg-indigo-950 rounded-xl shadow-xl border p-2 z-50">
          <p className="text-gray-500 dark:text-gray-300 text-sm text-center">
            Aucun anime trouvé
          </p>
        </div>
      )}
    </div>
  );
}
