"use client";

import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  text: string | null | undefined;
  animeId: number | string;
}

function optimizeText(raw: string) {
  if (!raw) return "";

  let t = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[•●◆◇►▼]/g, "");

  t = t.replace(/\. /g, ".\n").replace(/! /g, " !\n");

  if (!t.startsWith("Voici")) t = "Voici le synopsis :\n" + t;

  return t.trim();
}

export default function AnimeDescriptionTTS({ text, animeId }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 👇 stockage uniquement en mémoire (durée de vie : la page)
  const audioUrl = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const finalText = optimizeText(text || "");
  if (!finalText || finalText.length < 10) return null;

  /* 🧹 RESET complet à chaque changement d’anime */
  useEffect(() => {
    stop();
    audioUrl.current = null;
    audioRef.current = null;
  }, [animeId]);

  async function getAudio() {
    // appel direct à ton API
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: finalText, animeId }),
    });

    const data = await res.json();

    if (data?.audioBase64) {
      const url = "data:audio/mp3;base64," + data.audioBase64;
      audioUrl.current = url;
      return url;
    }

    return null;
  }

  async function handleClick() {
    // Stop si déjà en lecture
    if (isSpeaking) return stop();

    setIsLoading(true);

    try {
      // Audio local déjà chargé ?
      const url = audioUrl.current || (await getAudio());
      if (!url) return;

      stop();

      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsSpeaking(false);
      audioRef.current.onerror = () => setIsSpeaking(false);

      await audioRef.current.play();
      setIsSpeaking(true);
    } catch (e) {
      console.error("TTS Play error :", e);
    } finally {
      setIsLoading(false);
    }
  }

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    audioRef.current = null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-white ${
        isSpeaking
          ? "bg-red-600 hover:bg-red-700"
          : "bg-indigo-600 hover:bg-indigo-700"
      } transition-colors duration-200 shadow-md transform hover:scale-105`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="hidden sm:inline font-semibold">Chargement...</span>
        </>
      ) : isSpeaking ? (
        <>
          <VolumeX className="w-5 h-5" />
          <span className="hidden sm:inline font-semibold">Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="w-5 h-5" />
          <span className="hidden sm:inline font-semibold">Écouter</span>
        </>
      )}
    </button>
  );
}
