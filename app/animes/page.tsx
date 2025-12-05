"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AnimeCard from "../components/AnimeCard"; // Assure-toi que le chemin est bon
import {
  X,
  ChevronDown,
  Filter,
  Loader2,
  Search,
  RotateCcw,
} from "lucide-react";

// --- FONCTION UTILITAIRE : ÉVITER LES DOUBLONS ---

/**
 * Filtre un tableau d'animes pour ne conserver qu'une seule entrée par ID d'anime.
 * @param {Array<Object>} animes - Le tableau d'objets anime.
 * @returns {Array<Object>} Le tableau d'animes dédoublonné.
 */
const deduplicateAnimes = (animes) => {
  const seenIds = new Set();
  return animes.filter((anime) => {
    // Supposons que chaque objet anime a une propriété 'id' unique
    if (anime && anime.id) {
      if (seenIds.has(anime.id)) {
        return false; // C'est un doublon, on le filtre
      } else {
        seenIds.add(anime.id);
        return true; // C'est la première fois qu'on voit cet ID, on le garde
      }
    }
    return false; // Si l'objet n'a pas d'ID, on le filtre pour la sécurité
  });
};

// --- COMPOSANTS UI (Inchangés) ---

function Pill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs sm:text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function MultiSelectDropdown({ label, options, selected, onChange, icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 text-left group"
      >
        <span className="flex items-center gap-2 text-white/80 group-hover:text-white text-sm sm:text-base">
          {icon}
          <span className="font-medium">{label}</span>
          {selected.length > 0 && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 text-white/60 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full bg-gray-900/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 max-h-72 overflow-hidden">
          {options.length > 8 && (
            <div className="p-2 border-b border-white/10 sticky top-0 bg-gray-900/95">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-purple-500 outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-white/50 text-sm">
                Aucun résultat
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggleOption(option.value)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-white/90 text-sm">{option.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- PAGE PRINCIPALE (Modifiée) ---

export default function AllAnimesPage() {
  // États de données
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filtres
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStudios, setSelectedStudios] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [demographic, setDemographic] = useState("");
  const [season, setSeason] = useState("");
  const [rating, setRating] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [sortOrder, setSortOrder] = useState("desc");

  const [filtersVisible, setFiltersVisible] = useState(false);

  // Refs
  const observerTarget = useRef(null);
  const abortControllerRef = useRef(null); // Pour annuler les requêtes périmées

  // --- DATA OPTIONS (Inchangés) ---
  const genreOptions = [
    { value: "Action", label: "🔥 Action" },
    { value: "Adventure", label: "🗺️ Aventure" },
    { value: "Comedy", label: "😂 Comédie" },
    { value: "Drama", label: "🎭 Drame" },
    { value: "Fantasy", label: "✨ Fantasy" },
    { value: "Horror", label: "👻 Horreur" },
    { value: "Mystery", label: "🔍 Mystère" },
    { value: "Romance", label: "💕 Romance" },
    { value: "Sci-Fi", label: "🚀 Science-Fiction" },
    { value: "Sports", label: "⚽ Sports" },
    { value: "Supernatural", label: "🌙 Surnaturel" },
    { value: "Thriller", label: "😱 Thriller" },
    { value: "Slice of Life", label: "☕ Tranche de vie" },
  ];

  const themeOptions = [
    { value: "School", label: "🎓 École" },
    { value: "Military", label: "⚔️ Militaire" },
    { value: "Historical", label: "📜 Historique" },
    { value: "Martial Arts", label: "🥋 Arts Martiaux" },
    { value: "Mecha", label: "🤖 Mecha" },
    { value: "Music", label: "🎵 Musique" },
    { value: "Psychological", label: "🧠 Psychologique" },
    { value: "Magic", label: "🪄 Magie" },
    { value: "Vampire", label: "🧛 Vampire" },
    { value: "Samurai", label: "⚔️ Samouraï" },
    { value: "Isekai", label: "🌌 Isekai" },
    { value: "Harem", label: "💐 Harem" },
    { value: "Parody", label: "🎪 Parodie" },
    { value: "Super Power", label: "⚡ Super Pouvoirs" },
  ];

  const typeOptions = [
    { value: "TV", label: "📺 Série TV" },
    { value: "Movie", label: "🎬 Film" },
    { value: "OVA", label: "💿 OVA" },
    { value: "ONA", label: "🌐 ONA" },
    { value: "Special", label: "⭐ Spécial" },
  ];

  const studioOptions = [
    { value: "Bones", label: "Bones" },
    { value: "Madhouse", label: "Madhouse" },
    { value: "Wit Studio", label: "Wit Studio" },
    { value: "MAPPA", label: "MAPPA" },
    { value: "Studio Ghibli", label: "Studio Ghibli" },
    { value: "Ufotable", label: "Ufotable" },
    { value: "A-1 Pictures", label: "A-1 Pictures" },
    { value: "Toei Animation", label: "Toei Animation" },
    { value: "Production I.G", label: "Production I.G" },
    { value: "Trigger", label: "Trigger" },
    { value: "Kyoto Animation", label: "Kyoto Animation" },
    { value: "Sunrise", label: "Sunrise" },
    { value: "J.C.Staff", label: "J.C.Staff" },
    { value: "CloverWorks", label: "CloverWorks" },
    { value: "David Production", label: "David Production" },
  ];

  const statusOptions = [
    { value: "Finished Airing", label: "✅ Terminé" },
    { value: "Currently Airing", label: "▶️ En cours" },
    { value: "Not yet aired", label: "⏳ À venir" },
  ];

  // --- LOGIQUE API (Modifiée pour le dédoublonnage) ---

  const buildQueryParams = useCallback(
    (pageNum) => {
      const params = new URLSearchParams();
      params.append("page", pageNum.toString());
      params.append("perPage", "30");

      if (selectedGenres.length > 0)
        params.append("genres", selectedGenres.join(","));
      if (selectedThemes.length > 0)
        params.append("themes", selectedThemes.join(","));
      if (selectedTypes.length > 0)
        params.append("type", selectedTypes.join(","));
      if (selectedStudios.length > 0)
        params.append("studios", selectedStudios.join(","));
      if (selectedStatuses.length > 0)
        params.append("status", selectedStatuses.join(","));

      if (demographic) params.append("demographic", demographic);
      if (season) params.append("season", season);
      if (rating) params.append("rating", rating);
      if (minScore) params.append("minScore", minScore);
      if (maxScore) params.append("maxScore", maxScore);
      if (yearMin) params.append("yearMin", yearMin);
      if (yearMax) params.append("yearMax", yearMax);
      if (searchQuery) params.append("q", searchQuery);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);

      return params.toString();
    },
    [
      selectedGenres,
      selectedThemes,
      selectedTypes,
      selectedStudios,
      selectedStatuses,
      demographic,
      season,
      rating,
      minScore,
      maxScore,
      yearMin,
      yearMax,
      searchQuery,
      sortBy,
      sortOrder,
    ]
  );

  const fetchAnimes = useCallback(
    async (pageNum, append = false, signal = null) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const queryString = buildQueryParams(pageNum);
        const res = await fetch(`/api/animes?${queryString}`, { signal });

        if (!res.ok) throw new Error("Erreur réseau");

        const data = await res.json();

        if (append) {
          // --- LOGIQUE DE DÉDOUBLONNAGE APPLIQUÉE ICI ---
          setAnimes((prev) => {
            const combinedAnimes = [...prev, ...data.animes];
            return deduplicateAnimes(combinedAnimes);
          });
          // --- FIN DE LA LOGIQUE DE DÉDOUBLONNAGE ---
        } else {
          // --- LOGIQUE DE DÉDOUBLONNAGE APPLIQUÉE ICI ---
          setAnimes(deduplicateAnimes(data.animes));
          // --- FIN DE LA LOGIQUE DE DÉDOUBLONNAGE ---
          // Scroll en haut uniquement lors d'un nouveau filtrage complet
          if (!loadingMore && typeof window !== "undefined") {
            // Optionnel: window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }

        setTotalPages(data.totalPages);
        setTotal(data.total);
        setPage(pageNum);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Erreur chargement animes:", error);
        }
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [buildQueryParams]
  );

  // --- EFFETS (Optimisation Debounce) (Inchangés) ---

  // 1. Détection des changements de filtres (avec Debounce)
  useEffect(() => {
    // Annuler la requête précédente si elle est en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Créer un nouveau contrôleur pour cette session
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Délai d'attente de 500ms
    const timer = setTimeout(() => {
      fetchAnimes(1, false, signal);
    }, 500);

    return () => {
      clearTimeout(timer);
      // On n'abort pas ici dans le return sinon ça annule la requête quand le composant démonte ou rerender
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedGenres,
    selectedThemes,
    selectedTypes,
    selectedStudios,
    selectedStatuses,
    demographic,
    season,
    rating,
    minScore,
    maxScore,
    yearMin,
    yearMax,
    searchQuery,
    sortBy,
    sortOrder,
    // On retire fetchAnimes des dépendances pour éviter boucle infinie, car fetchAnimes dépend déjà de ces états
  ]);

  // 2. Infinite Scroll (Sans Debounce, chargement direct)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          !loadingMore &&
          page < totalPages
        ) {
          // On ne passe pas de signal d'annulation ici pour ne pas couper le chargement infini
          fetchAnimes(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [page, totalPages, loading, loadingMore, fetchAnimes]);

  // --- UI Helpers (Inchangés) ---

  const activeFiltersCount =
    selectedGenres.length +
    selectedThemes.length +
    selectedTypes.length +
    selectedStudios.length +
    selectedStatuses.length +
    (demographic ? 1 : 0) +
    (season ? 1 : 0) +
    (rating ? 1 : 0) +
    (minScore ? 1 : 0) +
    (maxScore ? 1 : 0) +
    (yearMin ? 1 : 0) +
    (yearMax ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedThemes([]);
    setSelectedTypes([]);
    setSelectedStudios([]);
    setSelectedStatuses([]);
    setDemographic("");
    setSeason("");
    setRating("");
    setMinScore("");
    setMaxScore("");
    setYearMin("");
    setYearMax("");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Découvrez vos Animes
          </h1>
          <p className="text-white/60 text-sm sm:text-base lg:text-lg">
            {loading && page === 1
              ? "Recherche en cours..."
              : `${total.toLocaleString()} animes trouvés`}
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher un anime (ex: Naruto, One Piece)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Toggle Filtres */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            {filtersVisible ? "Afficher" : "Masquer"} les filtres
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-white text-purple-600 text-xs rounded-full font-bold ml-2">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Tri rapide */}
          <div className="w-full sm:w-auto">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSort, newOrder] = e.target.value.split("-");
                setSortBy(newSort);
                setSortOrder(newOrder);
              }}
              className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white text-sm focus:border-purple-500 outline-none"
            >
              <option value="members-desc" className="bg-gray-900">
                👥 Les MasterPieces
              </option>
              <option value="year-desc" className="bg-gray-900">
                📅 Plus récents
              </option>

              <option value="score-desc" className="bg-gray-900">
                ⭐ Meilleures notes
              </option>

              <option value="created_at-desc" className="bg-gray-900">
                🆕 Derniers ajouts
              </option>
            </select>
          </div>
        </div>

        {/* Panneau de Filtres */}
        {filtersVisible && (
          <div className="mb-6 sm:mb-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 sm:p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                Filtres avancés
              </h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 text-xs sm:text-sm text-white/60 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Tout effacer
                </button>
              )}
            </div>

            {/* Tags des filtres actifs */}
            {activeFiltersCount > 0 && (
              <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 p-3 bg-black/20 rounded-xl border border-white/5">
                {selectedGenres.map((g) => (
                  <Pill
                    key={g}
                    label={g}
                    onRemove={() =>
                      setSelectedGenres(selectedGenres.filter((x) => x !== g))
                    }
                  />
                ))}
                {selectedThemes.map((t) => (
                  <Pill
                    key={t}
                    label={t}
                    onRemove={() =>
                      setSelectedThemes(selectedThemes.filter((x) => x !== t))
                    }
                  />
                ))}
                {selectedTypes.map((t) => (
                  <Pill
                    key={t}
                    label={t}
                    onRemove={() =>
                      setSelectedTypes(selectedTypes.filter((x) => x !== t))
                    }
                  />
                ))}
                {selectedStudios.map((s) => (
                  <Pill
                    key={s}
                    label={s}
                    onRemove={() =>
                      setSelectedStudios(selectedStudios.filter((x) => x !== s))
                    }
                  />
                ))}
                {selectedStatuses.map((s) => (
                  <Pill
                    key={s}
                    label={s}
                    onRemove={() =>
                      setSelectedStatuses(
                        selectedStatuses.filter((x) => x !== s)
                      )
                    }
                  />
                ))}
                {demographic && (
                  <Pill
                    label={demographic}
                    onRemove={() => setDemographic("")}
                  />
                )}
                {season && (
                  <Pill label={season} onRemove={() => setSeason("")} />
                )}
                {rating && (
                  <Pill label={rating} onRemove={() => setRating("")} />
                )}
                {minScore && (
                  <Pill
                    label={`Score > ${minScore}`}
                    onRemove={() => setMinScore("")}
                  />
                )}
                {maxScore && (
                  <Pill
                    label={`Score < ${maxScore}`}
                    onRemove={() => setMaxScore("")}
                  />
                )}
                {yearMin && (
                  <Pill
                    label={`Après ${yearMin}`}
                    onRemove={() => setYearMin("")}
                  />
                )}
                {yearMax && (
                  <Pill
                    label={`Avant ${yearMax}`}
                    onRemove={() => setYearMax("")}
                  />
                )}
                {searchQuery && (
                  <Pill
                    label={`"${searchQuery}"`}
                    onRemove={() => setSearchQuery("")}
                  />
                )}
              </div>
            )}

            <div className="space-y-4">
              {/* Ligne 1: Genres et Thèmes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <MultiSelectDropdown
                  label="Genres"
                  options={genreOptions}
                  selected={selectedGenres}
                  onChange={setSelectedGenres}
                  icon={<span className="text-lg sm:text-xl">🎬</span>}
                />
                <MultiSelectDropdown
                  label="Thèmes"
                  options={themeOptions}
                  selected={selectedThemes}
                  onChange={setSelectedThemes}
                  icon={<span className="text-lg sm:text-xl">🎨</span>}
                />
              </div>

              {/* Ligne 2: Type et Studios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <MultiSelectDropdown
                  label="Format"
                  options={typeOptions}
                  selected={selectedTypes}
                  onChange={setSelectedTypes}
                  icon={<span className="text-lg sm:text-xl">📺</span>}
                />
                <MultiSelectDropdown
                  label="Studios"
                  options={studioOptions}
                  selected={selectedStudios}
                  onChange={setSelectedStudios}
                  icon={<span className="text-lg sm:text-xl">🎞️</span>}
                />
              </div>

              {/* Ligne 3: Status et Démographie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <MultiSelectDropdown
                  label="Statut"
                  options={statusOptions}
                  selected={selectedStatuses}
                  onChange={setSelectedStatuses}
                  icon={<span className="text-lg sm:text-xl">▶️</span>}
                />

                <div>
                  <label className="block text-white/80 font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg sm:text-xl">👥</span> Démographie
                  </label>
                  <select
                    value={demographic}
                    onChange={(e) => setDemographic(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm sm:text-base cursor-pointer hover:bg-white/10"
                  >
                    <option value="" className="bg-gray-900">
                      Toutes
                    </option>
                    <option value="shonen" className="bg-gray-900">
                      Shonen
                    </option>
                    <option value="shoujo" className="bg-gray-900">
                      Shoujo
                    </option>
                    <option value="seinen" className="bg-gray-900">
                      Seinen
                    </option>
                    <option value="josei" className="bg-gray-900">
                      Josei
                    </option>
                    <option value="kids" className="bg-gray-900">
                      Kids
                    </option>
                  </select>
                </div>
              </div>

              {/* Ligne 4: Score Min/Max */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-white/60 font-medium mb-1 text-xs sm:text-sm">
                    Score min
                  </label>
                  <input
                    type="number"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1 text-xs sm:text-sm">
                    Score max
                  </label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    placeholder="10"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Ligne 5: Années */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-white/60 font-medium mb-1 text-xs sm:text-sm">
                    Année min
                  </label>
                  <input
                    type="number"
                    value={yearMin}
                    onChange={(e) => setYearMin(e.target.value)}
                    placeholder="1960"
                    min="1917"
                    max="2026"
                    className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1 text-xs sm:text-sm">
                    Année max
                  </label>
                  <input
                    type="number"
                    value={yearMax}
                    onChange={(e) => setYearMax(e.target.value)}
                    placeholder="2025"
                    min="1917"
                    max="2026"
                    className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Ligne 6: Saison et Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-white/80 font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg sm:text-xl">🍂</span> Saison
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-900">
                      Toutes
                    </option>
                    <option value="winter" className="bg-gray-900">
                      Hiver (Winter)
                    </option>
                    <option value="spring" className="bg-gray-900">
                      Printemps (Spring)
                    </option>
                    <option value="summer" className="bg-gray-900">
                      Été (Summer)
                    </option>
                    <option value="fall" className="bg-gray-900">
                      Automne (Fall)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg sm:text-xl">🔞</span>{" "}
                    Classification
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-900">
                      Toutes
                    </option>
                    <option value="g" className="bg-gray-900">
                      G - Tous publics
                    </option>
                    <option value="pg" className="bg-gray-900">
                      PG - Enfants
                    </option>
                    <option value="pg-13" className="bg-gray-900">
                      PG-13 - Ados
                    </option>
                    <option value="r" className="bg-gray-900">
                      R - 17+ (Violence)
                    </option>
                    <option value="r+" className="bg-gray-900">
                      R+ - (Nudité légère)
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GRILLE DES ANIMES */}
        {loading && page === 1 ? (
          <div className="flex flex-col justify-center items-center py-32">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <span className="text-white/60 font-medium">
              Recherche de vos pépites...
            </span>
          </div>
        ) : animes.length === 0 ? (
          <div className="text-center py-12 sm:py-20 bg-white/5 rounded-3xl border border-white/5">
            <p className="text-white/60 text-lg sm:text-xl mb-6">
              Aucun anime ne correspond à ces critères stricts.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 font-medium"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {animes.map((anime) => (
              // Assurez-vous que votre composant AnimeCard utilise `anime.id` comme `key`
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        )}

        {/* Cible pour Infinite Scroll et indicateur de chargement */}
        {page < totalPages && (
          <div ref={observerTarget} className="py-8">
            {loadingMore && (
              <div className="flex justify-center items-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Fin du contenu */}
        {page >= totalPages && !loading && animes.length > 0 && (
          <div className="text-center py-8 text-white/50 text-sm">
            Vous avez atteint la fin de la liste d'animes.
          </div>
        )}
      </div>
    </div>
  );
}
