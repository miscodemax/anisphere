import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json();

    if (!message)
      return NextResponse.json({ error: "Missing message" }, { status: 400 });

    const supabase = createClient();

    // --- Rewriting
    const rewriting = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: `
        Améliore cette recherche d'anime: "${message}"
        Extrait:
        - Genres
        - Thèmes
        - Ambiance / mood
        - Mots clés utiles
        Puis retourne UN SEUL paragraphe final enrichi, sans explications.
      `,
    });

    const expandedQuery =
      rewriting.output[0]?.content[0]?.text?.trim() || message;

    // --- Embedding
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: expandedQuery,
    });

    const queryEmbedding = embeddingRes.data[0].embedding;

    // --- Supabase match
    const { data, error } = await supabase.rpc("match_animes_multi_table", {
      query_embedding: queryEmbedding,
      match_count: 5,
    });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Supabase RPC error" },
        { status: 500 }
      );
    }

    // --- Format matches
    const formatted = data?.map((row: any) => {
      let demographicQuery = "";

      switch (row.source_table) {
        case "anime_shonen":
          demographicQuery = "shonen";
          break;
        case "anime_shoujo":
          demographicQuery = "shoujo";
          break;
        case "anime_seinen":
          demographicQuery = "seinen";
          break;
        case "anime_nouveautes":
          demographicQuery = "nouveautes";
          break;
        case "anime_catalogue_general":
          demographicQuery = "general";
          break;
      }

      return {
        id: row.id,
        title: row.title,
        similarity: row.similarity,
        demographicQuery,
        url: `/anime/${row.id}?demographic=${demographicQuery}`,
      };
    });
    // --- SYSTEM PROMPT amélioré : mascotte officielle, ami otaku ultra passionné
    const systemPrompt = `
Tu es **OtakuBot**, la mascotte officielle d'Anisphere 🎌✨  
Ton rôle : être l'ami otaku ultime, fun, drôle, amusant, authentique et **ultra passionné** par les animes 😎🔥  
Tu parles comme un pote enthousiaste et curieux, toujours prêt à discuter, argumenter et convaincre ton ami de regarder un anime 🥳💖  

STYLE ET COMPORTEMENT :
- Tu parles naturellement, avec des emojis partout 🎌🔥😎🥰
- Tu racontes des anecdotes croustillantes sur les animes quand c’est pertinent 🍿✨
- Tu expliques clairement **pourquoi chaque anime correspond**, avec des arguments solides et passionnés 🎯
- Tu peux comparer plusieurs animes entre eux pour illustrer tes recommandations 🤓🎉
- Tu discutes et explores le sujet en profondeur, comme un ami qui adore partager ses connaissances et son amour pour les animes 🫶
- Tu restes chaleureux, authentique et drôle, comme la mascotte officielle d'Anisphere 🎌

RÈGLES STRICTES :
- Tu n'inventes jamais d'URL.
- Tu utilises uniquement les URLs fournies dans "matches".
- Tu ne cites jamais Crunchyroll, MyAnimeList, AniList, Netflix ou tout autre site externe ❌
- Si un anime n’a pas d’URL dans la liste, tu ne mets pas de lien
- Format obligatoire pour les liens : [[Titre|URL]]
- Chaque réponse doit être détaillée, convaincante, et donner envie de regarder l’anime
- Toujours rappeler subtilement que tu es la mascotte officielle d'Anisphere 🎌
`;

    // --- USER PROMPT (empêche les fuites externes)
    const userPrompt = `
Message utilisateur : "${message}"

Liste des animes trouvés (TU DOIS utiliser uniquement ces URLs) :
${JSON.stringify(formatted, null, 2)}

RÈGLES IMPORTANTES :
- Utilise EXCLUSIVEMENT les URLs fournies ci-dessus.
- Si un anime n’est pas dans la liste : tu n’en parles pas.
- Si un titre est utilisé, tu DOIS prendre son URL depuis "matches".
- Pas de Crunchyroll, pas de MAL, pas de liens externes.
- Format lien : [[Titre|URL]]
- Explique pourquoi chaque anime correspond de maniere clair et detailles explique argumente detaille avec des arguments fondes.
`;

    // --- Conversation History
    const conversation = [
      { role: "system", content: systemPrompt },

      ...history.map((m: any) => ({
        role: m.role,
        content: m.text,
      })),

      { role: "user", content: userPrompt },
    ];

    // --- IA Final Response
    const completion = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: conversation,
    });

    return NextResponse.json({
      reply: completion.output_text,
      matches: formatted,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
