// app/api/otakubot/route.ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase";

function extractYear(str?: string | null) {
  if (!str) return null;
  const y = parseInt(str.split("-")[0]);
  return isNaN(y) ? null : y;
}

/**
 * OtakuBot endpoint
 * - attend { message, session_id }
 * - renvoie { reply, matches, embedding_used }
 */
export async function POST(req: Request) {
  try {
    const { message, session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json({
        reply: "Dis-moi ce que tu veux regarder 😍🎌",
        matches: [],
      });
    }

    const supabase = createClient();

    // ---------------------------
    // 1) Charger l'historique (10 derniers messages)
    // ---------------------------
    const { data: historyRows } = await supabase
      .from("chat_history")
      .select("role, message, created_at")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const history = (historyRows || []).reverse();
    const historyText = history.length
      ? history.map((h: any) => `${h.role}: ${h.message}`).join("\n")
      : "Aucun historique.";

    // Extraire la liste des animes déjà recommandés pour éviter les doublons
    const alreadyRecommendedIds = (historyRows || [])
      .filter((r: any) => r.role === "bot" && typeof r.message === "string")
      .flatMap((r: any) => {
        // On tente d'extraire des ids dans le texte si présents (flexible)
        const ids: number[] = [];
        const matches = r.message.match(/\b[0-9]{1,7}\b/g);
        if (matches) matches.forEach((m: string) => ids.push(Number(m)));
        return ids;
      });

    // ---------------------------
    // 2) Résumé mémoire — court, actionnable
    // ---------------------------
    const memoryPrompt = `
Voici l'historique récent entre l'utilisateur et OtakuBot :
${historyText}

Fais un résumé 6–10 lignes utile pour la recommandation :
- Ce que l'utilisateur aime / déteste (mots-clés)
- Vibes recherchées
- Thèmes préférés
- Animes déjà recommandés (liste d'IDs si présents)
- Etat émotionnel / ton de la conversation
Renvoie un texte court, clair, utile pour guider OtakuBot. Pas de politesse.
`;
    const memoryRes = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: memoryPrompt,
      max_output_tokens: 220,
    });
    const memory =
      (memoryRes.output_text || "").trim() || "Aucune mémoire utile.";

    // ---------------------------
    // 3) Réécriture pour embedding (comme avant)
    // ---------------------------
    const rewriting = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: `
Réécris ce message pour une recherche vectorielle d'anime :
"${message}"

Règles :
- 300 à 900 caractères
- Un paragraphe unique
- Ton immersif et analytique
- Décris ambiance, émotions, thèmes, style visuel, rythme narratif
- PAS de liste, PAS de JSON
Commence directement.
-essaie de cmprendre quand le users donne des sygles d'animes comme mha pour my hero academia ou onepice pour one piece ou snk pour singeki no kyojin ou attaque des titans etc... et ecris le nom complet de lanime dans ta reponse
      `,
      max_output_tokens: 900,
    });
    const rewritten = (rewriting.output_text || "").trim();

    // ---------------------------
    // 4) Embedding + recherche vectorielle
    // ---------------------------
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: rewritten,
    });
    const queryEmbedding = embRes.data[0].embedding;

    const { data: matches, error: rpcError } = await supabase.rpc(
      "match_anime_strict",
      {
        query_embedding: queryEmbedding,
        match_count: 60,
        min_score: 0.0,
      }
    );

    if (rpcError) throw rpcError;
    if (!matches?.length) {
      return NextResponse.json({
        reply: "Je n’ai rien trouvé… Ajoute plus de détails 😥✨",
        matches: [],
      });
    }

    // ---------------------------
    // 5) Récupération metadata
    // ---------------------------
    const ids = matches.map((m: any) => m.id);
    const { data: rows, error: errMeta } = await supabase
      .from("anime_all")
      .select("id, title, image_url, start_date, members, description")
      .in("id", ids);
    if (errMeta) throw errMeta;

    // Map rows par id pour garder l'ordre des matches + récupérer similitude si fournie par le rpc
    const rowsById: Record<number, any> = {};
    (rows || []).forEach((r: any) => (rowsById[r.id] = r));

    // Construire candidats en fusionnant score de la RPC si existant
    const candidates = matches.map((m: any) => {
      const meta = rowsById[m.id] || {};
      // si la RPC renvoie une similarité, on essaye de la lire (nommage variable)
      const similarity = m.score ?? m.similarity ?? m.sim ?? null;
      return {
        id: m.id,
        title: meta.title || m.title || "Titre inconnu",
        description: meta.description || m.synopsis || "",
        url: `/anime/${m.id}`,
        image_url: meta.image_url ?? "",
        members: meta.members ?? 0,
        score: m.score ?? null,
        scored_by: m.scored_by ?? null,
        start_year: extractYear(meta.start_date ?? m.start_date),
        similarity: typeof similarity === "number" ? similarity : null,
        demographic: m.demographic || null,
      };
    });

    // Filtre : retirer animes déjà recommandés (doublons mémoire)
    const filteredCandidates = candidates.filter(
      (c) => !alreadyRecommendedIds.includes(c.id)
    );

    if (!filteredCandidates.length) {
      // si tout a déjà été recommandé, on laisse candidater les originaux (on force fallback)
      filteredCandidates.push(...candidates.slice(0, 15));
    }

    // Préparer la liste à donner à GPT (limiter à 60 ou moins)
    const gptInputList = filteredCandidates
      .map(
        (c) =>
          `id: ${c.id} | titre: ${c.title} | synopsis: ${c.description
            ?.slice(0, 400)
            .replace(/\n/g, " ")} | url: ${c.url} | members: ${
            c.members
          } | score: ${c.score} | scored_by(votes): ${c.scored_by} | year: ${
            c.start_year
          } | similarity: ${c.similarity ?? "N/A"}`
      )
      .join("\n");

    // ---------------------------
    // 6) System prompt — personnalité + règles strictes
    // ---------------------------
    // Très détaillé : personnalité, méthode d'analyse, pondérations, format de sortie.
    const systemPrompt = `
Tu es OtakuBot 🎌🔥 — le pote otaku idéal : chaleureux, hyper enthousiaste, bavard mais précis.
Ton ton : jovial, empathique, passionné, parfois taquin. Utilise des comparaisons ("vibe entre X et Y").
Objectif : recommander **les 5–10 meilleurs animes** parmi la liste fournie, en comprenant parfaitement la demande utilisateur et la mémoire.

Règles ABSOLUES (strict) :
1) Analyse en profondeur **TOUS** les candidats fournis (fais une "lecture mentale" détaillée).
2) Priorité de sélection (utilisée pour ton jugement) :
   - 70% pertinence + popularité (members)
   - 20% récence utile (année)
   - 10% pépites sous-cotées ("masterclass under-the-radar")
3) Ne recommande pas tous le temps un anime déjà partagé dans l'historique (mémoire) a moins que le user te reparle de cet anime oubien de temps en temps juste pour lui refaire un rappel si tu le juge necessaire parfois lui demander est ce que il as finis par regarder tel ou tel anime et ce qu'il en as pense et taper la discute avec lui s'il le faut mais prends en compte la memoire avec parcimonie ne vient pas inntegrer ds choses qui n'ont aucune sens avec sa requete actuel juste parceque il avait parle de telle chose avant prendre en compte ses preferences via la memoire mais evite de trop considerer cela s'il parle quand meme de klk chose en lien avec ce qu'il avais dis alors la tu peut utiliser la memoire.
4) Sélectionne **5 à 10** titres, pas plus, pas moins si possible (si vraiment pas possible, 1 ou 10 max).

5) Format visible à l'utilisateur :
   [[Titre|URL]] l'URL est de la forme /anime/ID
   Explication passionnée (2–6 paragraphes max) : pourquoi regarder — argumente sur narration, scénario, personnages, rythme, mise en scène, émotion.
   Termine chaque recommandation avec une ligne "Pour qui:" expliquant le profil d'audience.
6) À la fin (INVISIBLE AU USER) ajoute exactement :
[SELECTED]
id1
id2
id3
[/SELECTED]

7) Si le user parle d'un anime en particulier, sois prêt à en discuter et à recommander des animes similaires ou du même genre.
8) si le user demande des animes d'une annee precise ou d'une periode precise tu doit absolument respecter cette demande et ne pas lui proposer des animes en dehors de cette periode precise
9) si le user te demande des animes d'un genre precis comme le mecha le isekai le shonen le shojo le seinen le sport etc... tu doit absolument respecter cette demande et ne pas lui proposer des animes en dehors de ce genre precis.
Méthode d'analyse (OBLIGATOIRE) :
- Compare chaque anime au message utilisateur et à la mémoire mais utilise la memoire avec parcimonie sa sert juste a pouvoir discuter naturellement avec le user et le comprendre en se souvenant de ses preferences et de ce qu'il as dis plutot et t'en servir si besoin pur etre plus precis et naturel avec le user donc etre un meilleur pote otaku.
- Utilise members pour estimer la "popularité" (normalise) et aussi le ratio score et le scored_by (le nombre de vote) pour denicher les pepits grace a members + score + scored_by ainsi que tes connaissance sur les animes que le users pourrais aimer en fonction de sa requete s'il te dis reccomende moi d'autres dans le meme style donne lui des animes differents mais dans le meme style.
- Si la similarité fournie existe, prends-la en compte pour renforcer pertinence.
- Ne sois pas robotique — sois un pote qui comprend l'utilisateur ecrit comme si tu parlais a un pote otaku avec des emojis et tout soit drole amusant de maniere familier le user doit sentir cela.

FORMAT RECOMMANDÉ :
Réponds toujours en **markdown bien structuré**.

🎨 FORMAT DE RÉPONSE (OBLIGATOIRE)
Toujours répondre en **MARKDOWN parfaitement structuré**, lisible et aéré.

Pour chaque anime recommandé, utilise exactement ce format :

---

### 🎬 **Titre de l’anime**
👉 [Voir la fiche](/anime/ID)

**Pourquoi tu vas kiffer :**
- paragraphe immersif expliquant l’ambiance sois cool agreable amusant et tu peut mettre des blagues droles par ci par la sans etre trop forceur soit naturel.

- paragraphe sur les personnages, le rythme, la narration
- paragraphe sur les vibes, émotions et comparaisons
- pourquoi cet anime correspond **précisément** à la demande du user
met aussi des emojis pertinents 🌸🔥🎭

**Pour qui ?**
Phrase courte expliquant le type de spectateur idéal.

---

🔥 RÈGLES IMPORTANTES
- NE JAMAIS utiliser de blocs de code (pas de ).
- Autorisé : titres, gras, italique, listes, séparateurs ---, emojis.
- Aère beaucoup tes paragraphes.
- Parle comme un vrai pote otaku : chaleureux, humain, passionné.
- Sois extrêmement convaincant : argumentation riche et émotionnelle.
- Analyse profondément les 60 animes fournis.
- Classe selon la règle :  
  - 70% mainstream populaires (members élevés)  
  - 20% récents  
  - 10% pépites sous-cotées très pertinentes  
- Toujours prioriser la **cohérence avec la demande du user**.
- Evite de te repeter dans tes reccommendations mais ne sois pas trop strict non plus parfois tu peut reparler d'un nimes recement recomender si le user t'en parle tu peut discuter de cet anime en particulier avec lui et lui reccomender meme des animes du meme genre soit a l'ecoute en priorite des besoin du user.

À la fin, ajoute obligatoirement :

[SELECTED]
id
id
id
[/SELECTED]

`;

    const userPrompt = `
Message utilisateur : "${message}"

Mémoire conversationnelle (résumé) :
${memory}

Voici les candidats (limités, déjà filtrés des doublons) :
${gptInputList}

Analyse en profondeur les candidats, classe-les selon la méthode demandée, et SELECTIONNE les 5 à 10 meilleurs.
Explique pour chaque sélection pourquoi c'est un match parfait (narration, scénario, personnages, rythme, émotions).
N'oublie pas d'ajouter en fin le bloc [SELECTED] avec les IDs sélectionnés (une ID par ligne).
`;

    // Appel GPT pour la sélection (tonalité haute, bavarde)
    const answer = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      temperature: 0.95, // assez créatif mais contrôlé
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_output_tokens: 3000,
    });

    const raw = answer.output_text || "";

    // ---------------------------
    // 7) Extraction des IDs depuis le bloc [SELECTED]
    // ---------------------------
    const idsSelected: number[] = [];
    const matchBlock = raw.match(/\[SELECTED\]([\s\S]*?)\[\/SELECTED\]/);

    if (matchBlock) {
      const extracted = matchBlock[1]
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => /^[0-9]+$/.test(l));
      extracted.forEach((id) => idsSelected.push(Number(id)));
    }

    // ---------------------------
    // 8) FALLBACK robuste : si GPT n'a pas donné d'ids, on calcule un score et prend top 6
    // ---------------------------
    let finalIds: number[] = [];
    if (idsSelected.length > 0) {
      finalIds = idsSelected;
    } else {
      // calcul simple : members normalisé + recence + similarity (si dispo)
      // normalized members (log scale), year recency (2025 - year)
      const yearNow = new Date().getFullYear();
      const scored = filteredCandidates.map((c) => {
        const memb = Math.log10((c.members || 1) + 1); // log scale
        const membNorm = memb; // on utilisera relatif
        const recency = c.start_year
          ? Math.max(0, 1 - (yearNow - c.start_year) / 20)
          : 0; // 1 si récent
        const similarity = c.similarity ?? 0;
        // ScorePertinence = 0.70*membNorm + 0.20*recency + 0.10*(similarity normalized)
        const score = 0.7 * membNorm + 0.2 * recency + 0.1 * (similarity || 0);
        return { id: c.id, score };
      });

      scored.sort((a, b) => b.score - a.score);
      finalIds = scored.slice(0, 6).map((s) => s.id);
    }

    // Assurer 3 à 6 résultats : si finalIds < 3, compléter par members
    if (finalIds.length < 3) {
      const more = candidates
        .filter((c) => !finalIds.includes(c.id))
        .sort((a: any, b: any) => (b.members || 0) - (a.members || 0))
        .map((c) => c.id);
      for (const id of more) {
        if (finalIds.length >= 3) break;
        finalIds.push(id);
      }
    }

    // Limiter max 6
    finalIds = finalIds.slice(0, 6);

    const finalMatches = filteredCandidates.filter((c) =>
      finalIds.includes(c.id)
    );

    // Nettoyer la réponse visible (supprimer le bloc [SELECTED])
    const finalReply = raw
      .replace(/\[SELECTED\]([\s\S]*?)\[\/SELECTED\]/g, "")
      .trim();

    // ---------------------------
    // 9) Sauvegarder la conversation (user + bot) — utile pour mémoire future
    // ---------------------------
    // On essaye d'insérer, sans bloquer la réponse en cas d'erreur
    try {
      await supabase.from("chat_history").insert([
        { session_id, role: "user", message },
        { session_id, role: "bot", message: finalReply },
      ]);
    } catch (e) {
      console.error("❌ Can't save chat_history:", e);
    }

    return NextResponse.json({
      reply: finalReply,
      matches: finalMatches,
      embedding_used: rewritten,
    });
  } catch (err) {
    console.error("❌ OtakuBot ERROR:", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
