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

  // Fermer la dropdown si on clique dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowBox(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Déclenche recherche + debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      fetch(`/api/jikan-search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data);
          setShowBox(true);
        })
        .finally(() => setLoading(false));
    }, 300); // debounce 300ms
  }, [query]);

  function handleSelect(anime: any) {
    router.push(anime.linkHref);
    setShowBox(false);
  }

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <div className="flex items-center gap-2 bg-white dark:bg-indigo-950 rounded-xl border px-3 py-2 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <Input
          className="border-none shadow-none text-black dark:text-blue-200 dark:bg-indigo-950 focus-visible:ring-0"
          placeholder="Rechercher un anime..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowBox(true)}
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {/* 🟣 SUGGESTIONS */}
      {showBox && results.length > 0 && (
        <div className="absolute mt-2 w-full bg-white dark:bg-indigo-950 rounded-xl shadow-xl border p-2 z-50 max-h-80 overflow-y-auto">
          {results.map((anime) => (
            <div
              key={anime.id}
              onClick={() => handleSelect(anime)}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition"
            >
              <img
                src={anime.image_url || anime.images?.jpg?.image_url}
                className="w-12 h-16 object-cover rounded-md"
                alt={anime.title}
              />

              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {anime.title_english || anime.title}
                </span>
                <span className="text-xs text-gray-500">
                  {anime.demographic}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rien trouvé */}
      {showBox && !loading && results.length === 0 && query.length >= 2 && (
        <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl border p-2 z-50">
          <p className="text-gray-500 text-sm text-center">
            Aucun anime trouvé
          </p>
        </div>
      )}
    </div>
  );
}
