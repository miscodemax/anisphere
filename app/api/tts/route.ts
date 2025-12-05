import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("🧪 Received body:", body);

    const { text, animeId } = body;

    if (!text || !animeId) {
      console.warn("❗ Bad request — missing field:", { text, animeId });
      return NextResponse.json(
        { error: "Missing text or animeId", received: body },
        { status: 400 }
      );
    }
    const supabase = createClient();

    // 1️⃣ Check Supabase Cache
    const { data: cached } = await supabase
      .from("anime_tts")
      .select("audio_base64")
      .eq("anime_id", animeId)
      .single();

    if (cached?.audio_base64) {
      return NextResponse.json({
        fromCache: true,
        audioBase64: cached.audio_base64,
      });
    }

    // 2️⃣ GENERATION IA ultra réaliste
    const realNarrationPrompt = `

${text}
`;

    const tts = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "fable", // meilleure voix narative
      input: realNarrationPrompt,
      format: "mp3",
    });

    const audioBase64 = Buffer.from(await tts.arrayBuffer()).toString("base64");

    // 3️⃣ SAVE in Supabase
    await supabase.from("anime_tts").upsert({
      anime_id: animeId,
      audio_base64: audioBase64,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      fromCache: false,
      audioBase64,
    });
  } catch (err) {
    console.error("TTS API Error:", err);

    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 }
    );
  }
}
