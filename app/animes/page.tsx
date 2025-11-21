"use client";

import { useEffect, useState, useMemo } from "react";
import { X, ChevronDown, Filter, Loader2, Search } from "lucide-react";
import AnimeCard from "../components/AnimeCard";

// Composant Pill pour les tags sélectionnés
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

// Composant Dropdown personnalisé
function MultiSelectDropdown({ label, options, selected, onChange, icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
    <div className="relative">
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

          <div className="max-h-60 overflow-y-auto">
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

export default function AllAnimesPage() {
  // État pour TOUS les animes
  const [allAnimes, setAllAnimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lazy loading state
  const [displayCount, setDisplayCount] = useState(50);

  // Filtres
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedStudios, setSelectedStudios] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [demographic, setDemographic] = useState("");
  const [minEpisodes, setMinEpisodes] = useState(0);
  const [maxEpisodes, setMaxEpisodes] = useState(0);
  const [minScore, setMinScore] = useState(0);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(true);

  // Options pour les dropdowns
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

  const sourceOptions = [
    { value: "Manga", label: "📖 Manga" },
    { value: "Light novel", label: "📚 Light Novel" },
    { value: "Visual novel", label: "🎮 Visual Novel" },
    { value: "Original", label: "✨ Original" },
    { value: "Game", label: "🕹️ Jeu vidéo" },
    { value: "Web manga", label: "🌐 Web Manga" },
    { value: "Novel", label: "📕 Roman" },
  ];

  const statusOptions = [
    { value: "Finished Airing", label: "✅ Terminé" },
    { value: "Currently Airing", label: "▶️ En cours" },
    { value: "Not yet aired", label: "⏳ À venir" },
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

  // 🔥 Charge TOUS les animes UNE SEULE FOIS au montage
  useEffect(() => {
    const fetchAllAnimes = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/animes");
        const data = await res.json();
        setAllAnimes(data);
      } catch (error) {
        console.error("Erreur chargement animes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAnimes();
  }, []);

  // 🎯 Filtrage côté client avec useMemo (performance optimale)
  const filteredAnimes = useMemo(() => {
    let filtered = [...allAnimes];

    // Filtre Genres
    if (selectedGenres.length > 0) {
      filtered = filtered.filter((anime) =>
        selectedGenres.every((genre) => anime.genres?.includes(genre))
      );
    }

    // Filtre Thèmes
    if (selectedThemes.length > 0) {
      filtered = filtered.filter((anime) =>
        selectedThemes.every((theme) => anime.themes?.includes(theme))
      );
    }

    // Filtre Type
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((anime) => selectedTypes.includes(anime.type));
    }

    // Filtre Source
    if (selectedSources.length > 0) {
      filtered = filtered.filter((anime) =>
        selectedSources.includes(anime.source)
      );
    }

    // Filtre Studio
    if (selectedStudios.length > 0) {
      filtered = filtered.filter((anime) =>
        anime.studios?.some((studio) => selectedStudios.includes(studio))
      );
    }

    // Filtre Status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((anime) =>
        selectedStatuses.includes(anime.status)
      );
    }

    // Filtre Démographie
    if (demographic) {
      filtered = filtered.filter((anime) => anime.demographic === demographic);
    }

    // Filtre Episodes
    if (minEpisodes > 0) {
      filtered = filtered.filter(
        (anime) => (anime.episodes || 0) >= minEpisodes
      );
    }
    if (maxEpisodes > 0) {
      filtered = filtered.filter(
        (anime) => (anime.episodes || 0) <= maxEpisodes
      );
    }

    // Filtre Score
    if (minScore > 0) {
      filtered = filtered.filter((anime) => (anime.score || 0) >= minScore);
    }

    // Filtre Années
    if (startYear) {
      filtered = filtered.filter((anime) => {
        const year = anime.year || new Date(anime.start_date).getFullYear();
        return year >= Number(startYear);
      });
    }
    if (endYear) {
      filtered = filtered.filter((anime) => {
        const year = anime.year || new Date(anime.start_date).getFullYear();
        return year <= Number(endYear);
      });
    }

    // Tri par score décroissant
    filtered.sort((a, b) => (b.score || 0) - (a.score || 0));

    return filtered;
  }, [
    allAnimes,
    selectedGenres,
    selectedThemes,
    selectedTypes,
    selectedSources,
    selectedStudios,
    selectedStatuses,
    demographic,
    minEpisodes,
    maxEpisodes,
    minScore,
    startYear,
    endYear,
  ]);

  // Reset displayCount quand les filtres changent
  useEffect(() => {
    setDisplayCount(50);
  }, [
    selectedGenres,
    selectedThemes,
    selectedTypes,
    selectedSources,
    selectedStudios,
    selectedStatuses,
    demographic,
    minEpisodes,
    maxEpisodes,
    minScore,
    startYear,
    endYear,
  ]);

  // 📜 Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        displayCount < filteredAnimes.length
      ) {
        setDisplayCount((prev) => Math.min(prev + 50, filteredAnimes.length));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [displayCount, filteredAnimes.length]);

  const activeFiltersCount =
    selectedGenres.length +
    selectedThemes.length +
    selectedTypes.length +
    selectedSources.length +
    selectedStudios.length +
    selectedStatuses.length +
    (demographic ? 1 : 0) +
    (minEpisodes > 0 ? 1 : 0) +
    (maxEpisodes > 0 ? 1 : 0) +
    (minScore > 0 ? 1 : 0) +
    (startYear ? 1 : 0) +
    (endYear ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedThemes([]);
    setSelectedTypes([]);
    setSelectedSources([]);
    setSelectedStudios([]);
    setSelectedStatuses([]);
    setDemographic("");
    setMinEpisodes(0);
    setMaxEpisodes(0);
    setMinScore(0);
    setStartYear("");
    setEndYear("");
  };

  // Animes à afficher (lazy loading)
  const displayedAnimes = filteredAnimes.slice(0, displayCount);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Découvrez vos Animes
          </h1>
          <p className="text-white/60 text-sm sm:text-base lg:text-lg">
            {loading
              ? "Chargement de la collection..."
              : `${filteredAnimes.length} animes disponibles`}
          </p>
        </div>

        {/* Toggle Filtres */}
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="mb-4 flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg text-sm sm:text-base"
        >
          <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
          {filtersVisible ? "Masquer" : "Afficher"} les filtres
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-white text-purple-600 text-xs rounded-full font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Panneau de Filtres */}
        {filtersVisible && (
          <div className="mb-6 sm:mb-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                Filtres
              </h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs sm:text-sm text-white/60 hover:text-white transition-colors underline"
                >
                  Tout effacer
                </button>
              )}
            </div>

            {/* Tags des filtres actifs */}
            {activeFiltersCount > 0 && (
              <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
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
                {selectedSources.map((s) => (
                  <Pill
                    key={s}
                    label={s}
                    onRemove={() =>
                      setSelectedSources(selectedSources.filter((x) => x !== s))
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
                {minEpisodes > 0 && (
                  <Pill
                    label={`Min: ${minEpisodes} ep`}
                    onRemove={() => setMinEpisodes(0)}
                  />
                )}
                {maxEpisodes > 0 && (
                  <Pill
                    label={`Max: ${maxEpisodes} ep`}
                    onRemove={() => setMaxEpisodes(0)}
                  />
                )}
                {minScore > 0 && (
                  <Pill
                    label={`⭐ ${minScore}+`}
                    onRemove={() => setMinScore(0)}
                  />
                )}
                {startYear && (
                  <Pill
                    label={`Depuis ${startYear}`}
                    onRemove={() => setStartYear("")}
                  />
                )}
                {endYear && (
                  <Pill
                    label={`Jusqu'à ${endYear}`}
                    onRemove={() => setEndYear("")}
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

              {/* Ligne 2: Type et Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <MultiSelectDropdown
                  label="Type"
                  options={typeOptions}
                  selected={selectedTypes}
                  onChange={setSelectedTypes}
                  icon={<span className="text-lg sm:text-xl">📺</span>}
                />
                <MultiSelectDropdown
                  label="Source"
                  options={sourceOptions}
                  selected={selectedSources}
                  onChange={setSelectedSources}
                  icon={<span className="text-lg sm:text-xl">📖</span>}
                />
              </div>

              {/* Ligne 3: Studio et Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <MultiSelectDropdown
                  label="Studio"
                  options={studioOptions}
                  selected={selectedStudios}
                  onChange={setSelectedStudios}
                  icon={<span className="text-lg sm:text-xl">🎞️</span>}
                />
                <MultiSelectDropdown
                  label="Statut"
                  options={statusOptions}
                  selected={selectedStatuses}
                  onChange={setSelectedStatuses}
                  icon={<span className="text-lg sm:text-xl">▶️</span>}
                />
              </div>

              {/* Ligne 4: Démographie et Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-white/80 font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg sm:text-xl">👥</span> Démographie
                  </label>
                  <select
                    value={demographic}
                    onChange={(e) => setDemographic(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm sm:text-base"
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
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg sm:text-xl">⭐</span> Score minimum
                  </label>
                  <input
                    type="number"
                    value={minScore || ""}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    placeholder="Ex: 7.5"
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Ligne 5: Episodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-white/80 font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg sm:text-xl">📺</span> Min. Épisodes
                  </label>
                  <input
                    type="number"
                    value={minEpisodes || ""}
                    onChange={(e) => setMinEpisodes(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-white/80 font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg sm:text-xl">📺</span> Max. Épisodes
                  </label>
                  <input
                    type="number"
                    value={maxEpisodes || ""}
                    onChange={(e) => setMaxEpisodes(Number(e.target.value))}
                    placeholder="Illimité"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Ligne 6: Années */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-white/80 font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg sm:text-xl">📅</span> Année de
                    début
                  </label>
                  <input
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    placeholder="Ex: 2020"
                    min="1960"
                    max="2025"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-white/80 font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg sm:text-xl">📅</span> Année de fin
                  </label>
                  <input
                    type="number"
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    placeholder="Ex: 2024"
                    min="1960"
                    max="2025"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grille d'Animes */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="ml-3 text-white/60">Chargement initial...</span>
          </div>
        ) : filteredAnimes.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <p className="text-white/60 text-lg sm:text-xl mb-3">
              Aucun anime trouvé avec ces filtres
            </p>
            <button
              onClick={clearAllFilters}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {displayedAnimes.map((anime, index) => (
                <AnimeCard
                  key={`${anime.id}-${index}`}
                  anime={anime}
                  index={index}
                />
              ))}
            </div>

            {/* Indicateur de chargement progressif */}
            {displayCount < filteredAnimes.length && (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 animate-spin" />
                <span className="ml-3 text-white/60 text-sm sm:text-base">
                  Chargement de {displayCount} / {filteredAnimes.length}{" "}
                  animes...
                </span>
              </div>
            )}

            {/* Message de fin */}
            {displayCount >= filteredAnimes.length &&
              filteredAnimes.length > 0 && (
                <div className="text-center py-8 text-white/40 text-sm">
                  🎉 Tous les {filteredAnimes.length} animes sont affichés
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
