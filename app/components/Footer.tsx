import { Github, Twitter, Heart, Coffee, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#05090E] border-t border-white/5 pt-20 pb-10 text-slate-400 font-sans relative overflow-hidden">
      {/* Gradient Background Decoration (Subtil) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* --- BRANDING (Col 1 - Large) --- */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                AniSphere
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              L'alternative francophone moderne pour suivre vos animes et
              mangas. Recommandations par IA, UX fluide et sans publicité
              intrusive.
            </p>
            <div className="flex gap-3">
              <SocialButton icon={<Twitter size={18} />} href="#" />
              <SocialButton icon={<Github size={18} />} href="#" />
            </div>
          </div>

          {/* --- LINKS (Col 2 & 3) --- */}
          <div className="md:col-span-2">
            <h3 className="text-white font-bold mb-6">Découvrir</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li>
                <FooterLink href="/saison">Saison actuelle</FooterLink>
              </li>
              <li>
                <FooterLink href="/top">Top 100 Animes</FooterLink>
              </li>
              <li>
                <FooterLink href="/moods" active>
                  Recherche Mood ✨
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/manga">Lire des Mangas</FooterLink>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-white font-bold mb-6">Communauté</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li>
                <FooterLink href="/forum">Forum</FooterLink>
              </li>
              <li>
                <FooterLink href="/equipe">L'équipe</FooterLink>
              </li>
              <li>
                <FooterLink href="/roadmap">Roadmap 2025</FooterLink>
              </li>
            </ul>
          </div>

          {/* --- CALL TO ACTION / DEV (Col 4) --- */}
          <div className="md:col-span-4">
            <div className="bg-[#0B1622] p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group">
              <h3 className="text-indigo-400 font-bold mb-2 text-sm flex items-center gap-2 uppercase tracking-wider">
                <Coffee size={14} />
                Projet Passion
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Développé par un fan pour les fans. Si tu viens de MyAnimeList,
                tu peux importer ta liste en 2 clics.
              </p>
              <Link
                href="/import"
                className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-indigo-400 transition-colors"
              >
                Importer ma liste MAL{" "}
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600 font-medium">
          <p>© 2025 AniSphere. Tous droits réservés.</p>
          <div className="flex items-center gap-1">
            Made with{" "}
            <Heart
              size={12}
              className="text-red-500 fill-red-500 animate-pulse"
            />{" "}
            using Next.js & Supabase
          </div>
          <div className="flex gap-6">
            <Link href="/legal" className="hover:text-white transition-colors">
              Mentions Légales
            </Link>
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Petits composants helper pour éviter la répétition
const FooterLink = ({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) => (
  <Link
    href={href}
    className={`block transition-colors hover:translate-x-1 duration-200 ${
      active ? "text-indigo-400" : "text-slate-500 hover:text-indigo-300"
    }`}
  >
    {children}
  </Link>
);

const SocialButton = ({
  icon,
  href,
}: {
  icon: React.ReactNode;
  href: string;
}) => (
  <a
    href={href}
    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all border border-white/5 hover:border-indigo-500"
  >
    {icon}
  </a>
);
