"use client";

import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const signInGoogle = async () => {
    const supabase = createClient();

    // Où était l'utilisateur avant login ?
    const next = window.location.pathname;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <button
        onClick={signInGoogle}
        className="bg-blue-600 text-white px-5 py-3 rounded-xl shadow hover:bg-blue-700"
      >
        Se connecter avec Google
      </button>
    </div>
  );
}
