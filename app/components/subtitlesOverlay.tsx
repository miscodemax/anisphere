// components/SubtitlesOverlay.tsx
"use client";

export default function SubtitlesOverlay({
  subtitles,
  currentTime,
}: {
  subtitles: { start: number; dur: number; text: string }[];
  currentTime: number;
}) {
  const active = subtitles.find(
    (s) => currentTime >= s.start && currentTime <= s.start + s.dur
  );

  return (
    <div className="absolute bottom-10 w-full text-center pointer-events-none">
      {active && (
        <div className="inline-block px-4 py-2 text-lg font-semibold bg-black/50 text-white rounded-lg backdrop-blur-md shadow-lg leading-relaxed">
          {active.text}
        </div>
      )}
    </div>
  );
}
