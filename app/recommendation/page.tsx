// app/recommendation/page.tsx
import OtakuBot from "../components/otakubot";

export default function RecommendationPage() {
  return (
    <>
      {/* Autres sections AVANT le chat si besoin */}
      <section className="bg-slate-950 p-8">
        <h2 className="text-2xl font-bold text-white">Section avant</h2>
      </section>

      {/* Le chat prend toute la hauteur de l'écran */}
      <OtakuBot />

      {/* Autres sections APRÈS si besoin */}
      <section className="bg-slate-950 p-8">
        <h2 className="text-2xl font-bold text-white">Section après</h2>
      </section>
    </>
  );
}
