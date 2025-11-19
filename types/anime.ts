export interface Anime {
  id: number;
  title_romaji: string;
  title_native: string | null;
  title_english: string | null;
  description_fr: string | null;
  genres: string[];
  demographic: string | null;
  episodes: number | null;
  status: string | null;
  score: number | null;
  start_date: string | null;
  end_date: string | null;
  season: string | null;
  season_year: number | null;
  cover: string | null;
  studios: string[];
  staff: string | null;
  relations: string | null;
}
