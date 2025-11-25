import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // On récupère le paramètre "next" ou on redirige vers l'accueil par défaut
  const next = searchParams.get("next") ?? "/";

  if (code) {
    // ⚠️ Important : await cookies() pour être compatible Next.js 15+
    const cookieStore = await cookies();

    const supabase = createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Connexion réussie : on redirige l'utilisateur vers la page demandée
      // On utilise une redirection 303 (See Other) pour éviter les soucis de cache
      const forwardedHost = request.headers.get("x-forwarded-host"); // Pour vercel parfois utile
      const isLocal = origin.includes("localhost");

      // Construction de l'URL de redirection propre
      if (isLocal) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // En cas d'erreur ou d'absence de code
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
