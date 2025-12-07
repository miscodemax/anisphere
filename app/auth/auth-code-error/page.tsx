"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  useEffect(() => {
    const finishAuth = async () => {
      if (!code) {
        router.replace("/auth/auth-code-error");
        return;
      }

      const supabase = createClient();

      // ⚠️ Échange du code OAuth → session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("OAuth error:", error);
        router.replace("/auth/auth-code-error");
        return;
      }

      // Redirection vers la page demandée
      router.replace(next);
    };

    finishAuth();
  }, [code, next, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
      <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      <p className="mt-4 text-lg font-medium animate-pulse">
        Connexion en cours...
      </p>
    </div>
  );
}
