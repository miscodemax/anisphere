// app/api/otakubot/route.ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase";

function extractYear(str?: string | null) {
  if (!str) return null;
  const y = parseInt(str.split("-")[0]);
  return isNaN(y) ? null : y;
}

// 🔥 Dictionnaire d’abréviations → nom complet (super important)
const ANIME_SYNONYMS: Record<string, string> = {
  snk: "shingeki no kyojin",
  aot: "attack on titan",
  op: "one piece",
  hxh: "hunter x hunter",
  mha: "my hero academia",
  bnha: "boku no hero academia",
  kny: "kimetsu no yaiba",
  ds: "demon slayer",
  jjk: "jujutsu kaisen",
  fmab: "fullmetal alchemist brotherhood",
  fma: "fullmetal alchemist",
  tbate: "the beginning after the end",
  opm: "one punch man",
  sao: "sword art online",
};

function normalizeQuery(msg: string) {
  let lower = msg.toLowerCase();
  for (const key in ANIME_SYNONYMS) {
    if (lower.includes(key)) {
      lower = lower.replace(key, ANIME_SYNONYMS[key]);
    }
  }
  return lower;
}

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
    // 1) Charger l'historique
    // ---------------------------
    const { data: historyRows } = await supabase
      .from("chat_history")
      .select("role, message, created_at")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const history = (historyRows || []).reverse();
    const historyText = history.length
      ? history.map((h) => `${h.role}: ${h.message}`).join("\n")
      : "Aucun historique.";

    // Extraire les IDs déjà recommandés
    const alreadyRecommendedIds = (historyRows || [])
      .filter((r: any) => r.role === "bot")
      .flatMap((r: any) => {
        const ids = r.message.match(/\b[0-9]{1,7}\b/g);
        return ids ? ids.map(Number) : [];
      });

    // ---------------------------
    // 2) Mémoire courte
    // ---------------------------
    const memoryRes = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: `
Voici l'historique récent :
${historyText}

Fais un résumé utile pour recommander :
- Préférences de l'utilisateur
- Ce qu'il cherche en général
- Vibes favorites
- Animes déjà recommandés
- Son mood

Pas de politesse.
      `,
      max_output_tokens: 200,
    });

    const memory = memoryRes.output_text.trim();

    // ---------------------------
    // 3) Embedding direct (🔥 plus précis)
    // ---------------------------
    const normalizedQuery = normalizeQuery(message);

    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: normalizedQuery,
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
        reply: "Hmm… rien trouvé. Donne-moi un peu plus de contexte 😭✨",
        matches: [],
      });
    }

    // ---------------------------
    // 4) Récupération métadonnées
    // ---------------------------
    const ids = matches.map((m) => m.id);

    const { data: rows } = await supabase
      .from("anime_all")
      .select(
        "id, title, image_url, start_date, members, description, demographic, score, scored_by"
      )
      .in("id", ids);

    const rowsById: Record<number, any> = {};
    rows?.forEach((r) => (rowsById[r.id] = r));

    // Fusion données vectorielles + metadata
    const candidates = matches.map((m: any) => {
      const meta = rowsById[m.id] || {};
      return {
        id: m.id,
        title: meta.title || "Titre inconnu",
        description: meta.description || "",
        url: `/anime/${m.id}`,
        image_url: meta.image_url,
        members: meta.members ?? 0,
        score: meta.score ?? null,
        scored_by: meta.scored_by ?? null,
        start_year: extractYear(meta.start_date),
        similarity: m.similarity ?? 0,
        demographic: meta.demographic,
      };
    });

    // Supprimer déjà recommandés
    const filteredCandidates = candidates.filter(
      (c) => !alreadyRecommendedIds.includes(c.id)
    );

    // ---------------------------
    // 5) Préparer entrées GPT (classement)
    // ---------------------------
    const gptInputList = filteredCandidates
      .map(
        (c) =>
          `id:${c.id} | titre:${c.title} | synopsis:${c.description.slice(
            0,
            350
          )} | members:${c.members} | year:${c.start_year} | similarity:${
            c.similarity
          }`
      )
      .join("\n");

    // ---------------------------
    // 6) SYSTEM PROMPT (identité + règles)
    // ---------------------------
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
6) Si apres reccommendation le user te dis j'ai deja regardes ou montre moi d'autres animes ou klk choses de ce genre reccommende lui avec d'autres animes differents mais se trouvant dans la liste avec laquelle tu as retroues ces animes donnees precedemment.

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
- Evite de te repeter dans tes reccommendations mais ne sois pas trop strict non plus parfois tu peut reparler d'un anime recemment recommender si le user t'en parle tu peut discuter de cet anime en particulier avec lui et lui reccomender meme des animes du meme genre soit a l'ecoute en priorite des besoin du user.

À la fin, ajoute obligatoirement :

[SELECTED]
id
id
id
[/SELECTED]

`;

    const userPrompt = `
Message utilisateur : "${normalizedQuery}"

Mémoire :
${memory}

CANDIDATS :
${gptInputList}

Sélectionne les 5–10 meilleurs. 
Ajoute à la fin :

[SELECTED]
id
id
id
[/SELECTED]
`;

    const answer = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      temperature: 0.95,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_output_tokens: 3200,
    });

    const raw = answer.output_text || "";

    // ---------------------------
    // 7) EXTRACTION DES IDS
    // ---------------------------
    const idsSelected: number[] = [];
    const matchBlock = raw.match(/\[SELECTED\]([\s\S]*?)\[\/SELECTED\]/);

    if (matchBlock) {
      matchBlock[1]
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => /^[0-9]+$/.test(l))
        .forEach((id) => idsSelected.push(Number(id)));
    }

    let finalIds = idsSelected.slice(0, 6);

    if (!finalIds.length) {
      // Fallback
      finalIds = filteredCandidates
        .sort((a, b) => (b.members || 0) - (a.members || 0))
        .slice(0, 6)
        .map((c) => c.id);
    }

    const finalMatches = candidates.filter((c) => finalIds.includes(c.id));

    const finalReply = raw.replace(/\[SELECTED\]([\s\S]*?)\[\/SELECTED\]/g, "");

    // ---------------------------
    // SAUVEGARDE CONVERSATION
    // ---------------------------
    try {
      await supabase.from("chat_history").insert([
        { session_id, role: "user", message },
        { session_id, role: "bot", message: finalReply },
      ]);
    } catch (e) {}

    return NextResponse.json({
      reply: finalReply,
      matches: finalMatches,
    });
  } catch (err) {
    console.error("❌ OtakuBot ERROR:", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
