// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,

  // Désactiver les erreurs TypeScript pendant le build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Désactiver les erreurs ESLint pendant le build
  // (NextConfig ne connaît plus cette propriété, mais Vercel l'accepte)
  eslint: {
    ignoreDuringBuilds: true,
  },

  env: {
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },

  images: {
    remotePatterns: [
      // --- Anilist ---
      { protocol: "https", hostname: "s1.anilist.co" },
      { protocol: "https", hostname: "s2.anilist.co" },
      { protocol: "https", hostname: "s3.anilist.co" },
      { protocol: "https", hostname: "s4.anilist.co" },

      // --- Crunchyroll ---
      { protocol: "https", hostname: "a.storyblok.com" },
      { protocol: "https", hostname: "static.crunchyroll.com" },
      { protocol: "https", hostname: "img1.ak.crunchyroll.com" },

      // --- IGN France ---
      { protocol: "https", hostname: "sm.ign.com" },

      // --- CBR ---
      { protocol: "https", hostname: "static1.cbrimages.com" },

      // --- Comicbook.com ---
      { protocol: "https", hostname: "comicbook.com" },
    ],
  },
};

// Cast en "any" pour permettre "eslint.ignoreDuringBuilds"
export default nextConfig as any;
