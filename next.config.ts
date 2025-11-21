// next.config.js

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // --- Anilist ---
      {
        protocol: "https",
        hostname: "s1.anilist.co",
      },
      {
        protocol: "https",
        hostname: "s2.anilist.co",
      },
      {
        protocol: "https",
        hostname: "s3.anilist.co",
      },
      {
        protocol: "https",
        hostname: "s4.anilist.co",
      },

      // --- Crunchyroll ---
      {
        protocol: "https",
        hostname: "a.storyblok.com",
      },
      {
        protocol: "https",
        hostname: "static.crunchyroll.com",
      },
      {
        protocol: "https",
        hostname: "img1.ak.crunchyroll.com",
      },

      // --- IGN France (NÉCESSAIRE POUR TES NEWS) ---
      {
        protocol: "https",
        hostname: "sm.ign.com",
      },

      // --- CBR (si tu ajoutes les news CBR plus tard) ---
      {
        protocol: "https",
        hostname: "static1.cbrimages.com",
      },

      // --- Comicbook.com (si tu ajoutes leurs RSS) ---
      {
        protocol: "https",
        hostname: "comicbook.com",
      },
    ],
  },
};

export default nextConfig;
