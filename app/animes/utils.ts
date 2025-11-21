// utils.ts
import { createClient } from "@/lib/supabase";

const ITEMS_PER_PAGE = 30; // Définissez votre limite

/**
 * Charge une page d'animes depuis une seule table.
 * @param page Le numéro de la page à charger (commence à 0 ou 1).
 */
export async function fetchAnimesPage(page: number) {
  const supabase = createClient();
  const offset = page * ITEMS_PER_PAGE;

  // Cette requête est l'hypothèse la plus simple : charger directement
  // les animes avec offset/limit (pagination) et les mélanger APRES
  // le chargement ou utiliser une colonne d'ordre.
  // Vous devrez adapter cette requête à votre structure de données.
  const { data, error, count } = await supabase
    .from("anime_shonen") // Remplacez par la table principale ou une vue unifiée
    .select("*", { count: "exact" })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  if (error) {
    console.error("Erreur de chargement des animes paginés:", error);
    return { data: [], totalCount: 0 };
  }

  // Nettoyage / Ajout des champs, comme dans votre code original
  const animes = (data || []).map((a) => ({
    ...a,
    mediaType: "anime",
    is_french: a.is_french ?? false,
    genres: Array.isArray(a.genres) ? a.genres : [],
    studios: Array.isArray(a.studios) ? a.studios : [],
  }));

  // Vous pouvez mélanger le résultat si nécessaire, mais attention à la cohérence
  // des pages si vous voulez un ordre prédictible (recommandé).
  // animes.sort(() => Math.random() - 0.5);

  return { data: animes, totalCount: count || 0 };
}
