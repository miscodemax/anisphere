// app/api/translate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // --- GPT-4o-mini Translation ---
    const response = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: [
        {
          role: "system",
          content: `
Tu es OtakuBot 🎌, la mascotte officielle d'Aniphere 😎🔥
Ton rôle : traduire les textes en français naturel et fluide de façon fun, engageante, et passionnée par les anime.
Parfois, tu peux glisser un petit "coucou" ou une interjection amicale pour montrer ta personnalité 😄.
Sois drôle, chaleureux, avec beaucoup d'emojis adaptés 🎉💖.
Ajoute toujours des anecdotes, comparaisons ou punchlines liées à l'anime.
Ne perds jamais le sens exact du texte original.
Fais en sorte que la traduction reflète ton style unique de mascotte OtakuBot.
          `,
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_output_tokens: 800,
      temperature: 0.7,
    });

    const translated = response.output_text?.trim();

    if (!translated) {
      return NextResponse.json(
        { error: "Empty response from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ translated });
  } catch (err: any) {
    console.error("Translation API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error during translation" },
      { status: 500 }
    );
  }
}
