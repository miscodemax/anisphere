"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const processLogin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const redirectTo = searchParams.get("redirect") || "/";

      if (session) {
        console.log("Session OK → redirect:", redirectTo);
        router.replace(redirectTo);
      } else {
        console.log("Pas de session… Google n’a pas renvoyé de token");
        router.replace("/auth/auth-code-error");
      }
    };

    processLogin();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen text-white">
      🔄 Connexion en cours...
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-white">
          Chargement…
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
