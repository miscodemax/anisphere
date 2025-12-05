import OtakuBot from "../components/otakubot";

export default function RecommendationPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 flex flex-col gap-8">
      {/* Autres sections de la page */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Mes recommandations</h2>
        {/* ici ton contenu custom */}
      </section>

      {/* Chatbot réutilisable */}
      <section className="h-[85vh] w-full">
        <OtakuBot />
      </section>

      {/* Autres sections */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Autres contenus</h2>
      </section>
    </div>
  );
}
