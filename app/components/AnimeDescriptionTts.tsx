"use client";

import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface AnimeDescriptionTTSProps {
  text: string | null | undefined;
}

/* ---------------------------------------------
 * OPTIMISATION DU TEXTE POUR UN RESULTAT PLUS REALISTE
 * --------------------------------------------- */
function optimizeDescription(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Enlever le HTML
  text = text.replace(/<[^>]+>/g, " ").trim();

  // 2. Compacte les espaces
  text = text.replace(/\s+/g, " ");

  // 3. Retirer symboles parasites
  text = text.replace(/[•●◆◇►▼]/g, "");

  // 4. Détection simple d'anglais → mini "pseudo traduction"
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const totalWords = text.split(" ").length;

  const isEnglish = englishWords / totalWords > 0.6;

  if (isEnglish) {
    text = text
      .replace(/This anime/gi, "Cet anime")
      .replace(/follows/gi, "suit")
      .replace(/story/gi, "l'histoire")
      .replace(/a powerful/gi, "un puissant")
      .replace(/dangerous/gi, "dangereux")
      .replace(/world/gi, "monde");
  }

  // 5. Amélioration du rythme de lecture
  text = text
    .replace(/, and/gi, ", et")
    .replace(/\. /g, ".\n") // pause naturelle
    .replace(/! /g, " !\n")
    .replace(/\? /g, " ?\n");

  // 6. Ajouter un début "humain" si vide
  if (!text.startsWith("Dans cet anime") && !text.startsWith("Cet anime")) {
    text = "Voici la description :\n" + text;
  }

  return text.trim();
}

export default function AnimeDescriptionTTS({
  text,
}: AnimeDescriptionTTSProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const optimizedText = optimizeDescription(text || "");

  /* ---------------------------------------------
   * INIT / CHECK Disponibilité API vocal
   * --------------------------------------------- */
  useEffect(() => {
    if ("speechSynthesis" in window) {
      setIsAvailable(true);

      // Les voix mettent du temps à charger
      setTimeout(() => setIsLoading(false), 600);
    } else {
      setIsAvailable(false);
      setIsLoading(false);
    }

    const synth = window.speechSynthesis;

    return () => {
      if (synth.speaking) synth.cancel();
    };
  }, []);

  /* ---------------------------------------------
   * Choisir une voix française en priorité
   * --------------------------------------------- */
  const getVoice = () => {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();

    return (
      voices.find((v) => v.lang.startsWith("fr")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0]
    );
  };

  /* ---------------------------------------------
   * LECTURE VOCALE
   * --------------------------------------------- */
  const speak = () => {
    const synth = window.speechSynthesis;

    if (!optimizedText || synth.speaking) return;

    if (!utteranceRef.current) {
      const u = new SpeechSynthesisUtterance(optimizedText);

      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);

      const voice = getVoice();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = "fr-FR";
      }

      // Réglages pour un rendu plus naturel
      u.rate = 0.98; // léger ralentissement
      u.pitch = 1.02; // un poil plus vivant

      utteranceRef.current = u;
    }

    // Mettre à jour le texte optimisé
    utteranceRef.current.text = optimizedText;

    // Stop lecture précédente si nécessaire
    if (synth.pending || synth.speaking) {
      synth.cancel();
    }

    setIsSpeaking(true);
    synth.speak(utteranceRef.current);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  /* ---------------------------------------------
   * UI
   * --------------------------------------------- */
  if (isLoading) {
    return <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />;
  }

  if (!isAvailable || !optimizedText || optimizedText.length < 10) {
    return null;
  }

  const handleToggle = () => {
    if (isSpeaking) stop();
    else speak();
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={isSpeaking ? "Arrêter la lecture" : "Écouter la description"}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 shadow-md transform hover:scale-105"
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-5 h-5" />
          <span className="hidden sm:inline font-semibold">Arrêter</span>
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
