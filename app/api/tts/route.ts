import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text)
    return NextResponse.json({ error: "Text is required" }, { status: 400 });

  try {
    const tts = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "fable", // utiliser fable pour un ton plus narratif
      input: text,
      format: "mp3",
      // si supporté, tu peux ajouter des "voice settings" dans le prompt ou dans les métadonnées
    });

    const audioBase64 = Buffer.from(await tts.arrayBuffer()).toString("base64");
    return NextResponse.json({ audioBase64 });
  } catch (err) {
    console.error("TTS API Error:", err);
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 }
    );
  }
}
