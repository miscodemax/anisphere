// app/api/otakubot/route.ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase";
import { desc } from "framer-motion/client";

function extractYear(str?: string | null) {
  if (!str) return null;
  const y = parseInt(str.split("-")[0]);
  return isNaN(y) ? null : y;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({
        reply: "Dis-moi ce que tu veux regarder 😍🎌",
        matches: [],
      });
    }

    const supabase = createClient();

    // 1) Rewriting embedding-friendly
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
      `,
      max_output_tokens: 300,
    });

    const rewritten = rewriting.output_text.trim();

    // 2) Embedding
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: rewritten,
    });

    const queryEmbedding = embRes.data[0].embedding;

    // 3) Vector search using match_anime_strict
    const { data: matches, error } = await supabase.rpc("match_anime_strict", {
      query_embedding: queryEmbedding,
      match_count: 60,
      min_score: 0.0,
    });

    if (error) throw error;

    if (!matches?.length) {
      return NextResponse.json({
        reply: "Je n’ai rien trouvé… Ajoute plus de détails 😥✨",
        matches: [],
      });
    }

    // 4) Metadata
    const ids = matches.map((m: any) => m.id);

    const { data: rows, error: errMeta } = await supabase
      .from("anime_all")
      .select("id, title, image_url, start_date, members, description")
      .in("id", ids);

    if (errMeta) throw errMeta;

    // 5) Format candidates
    const candidates = rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      url: `/anime/${a.id}`,
      image_url: a.image_url,
      members: a.members ?? 0,
      start_year: extractYear(a.start_date),
    }));

    // List prepared for GPT
    const gptInputList = candidates
      .map(
        (c) =>
          `${c.id} | ${c.title} | synopsis: ${c.description} | ${c.url} | members: ${c.members} | year: ${c.start_year}`
      )
      .join("\n");

    // 6) GPT FINAL — selection + personality S-tier
    const answer = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      temperature: 1.05,
      input: [
        {
          role: "system",
          content: `
Tu es OtakuBot 🎌🔥, la mascotte officielle d’Anisphere.

OBJECTIF SUPRÊME :
Fournir LA MEILLEURE RECOMMANDATION possible à partir d’une liste de 60 animes issus d’une recherche vectorielle.

⚡ MÉTHODE D’ANALYSE (OBLIGATOIRE) – NE PAS SAUTER :
Avant de sélectionner, tu dois mentalement effectuer :
1. UNE ANALYSE DÉTAILLÉE de chaque anime parmi les 60 :
   - thèmes majeurs
   - ambiance émotionnelle
   - vibe (mature, dark, chill, comique, philosophique…)
   - construction des personnages
   - rythme narratif
   - complexité scénaristique
   - public cible
   - style visuel

2. COMPARAISON avec le message utilisateur :
   - similarité thématique
   - vibe recherchée
   - tropes aimés/évités
   - type d’univers souhaité
   - intensité émotionnelle

3. CLASSEMENT INTERNE (non visible au user) :
   Tu notes chaque anime mentalement :
   ScorePertinence = (0.70 × pertinence) + (0.20 × chef-d’œuvre potentiel) + (0.10 × recence utile)

4. TU CHOISIS UNIQUEMENT les 3 à 6 MEILLEURS score global.
   AUCUNE sélection random.

PERSONNALITÉ :
- Passionné, fun, humain, parle avec vibe otaku IRL.
- Comparaisons naturelles entre œuvres.
- Explications immersives : "ça a la vibe entre X et Y".
- 0 ton robotique.

FORMAT RÉSULTAT :
Pour chaque anime recommandé → format :

[[Titre|URL]]
Explication passionnée, pourquoi c’est un match PARFAIT.

FIN :
À la fin de ta réponse :
[SELECTED]
id
id
id
[/SELECTED]

          `,
        },
        {
          role: "user",
          content: `
Message utilisateur : "${message}"

Voici les 60 animes trouvés :
${gptInputList}

Sélectionne 3 à 6 animes, explique-les avec énergie.
À la fin, place le bloc :

[SELECTED]
ID1
ID2
...
[/SELECTED]

Analyse en profondeur les 60 animes fournis (pas seulement les résumés), réalise un classement interne basé sur le ScorePertinence décrit, puis sélectionne UNIQUEMENT les 3 à 6 animes au SCORE le plus élevé.
N’oublie PAS de fournir des explications passionnées pour chaque sélection faite.
          `,
        },
      ],
    });

    // 7) EXTRACTION DES IDS SELECTIONNÉS
    const raw = answer.output_text;

    const idsSelected: number[] = [];
    const matchBlock = raw.match(/\[SELECTED\]([\s\S]*?)\[\/SELECTED\]/);

    if (matchBlock) {
      const extracted = matchBlock[1]
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => /^[0-9]+$/.test(l));

      extracted.forEach((id) => idsSelected.push(Number(id)));
    }

    const finalIds = idsSelected.length > 0 ? idsSelected : ids.slice(0, 6);

    const finalMatches = candidates.filter((c) => finalIds.includes(c.id));

    // Nettoyage du texte visible
    const finalReply = raw
      .replace(/\[SELECTED\]([\s\S]*?)\[\/SELECTED\]/g, "")
      .trim();

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
