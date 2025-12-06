import { Github, Twitter, Heart } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#05090E] py-8 text-xs text-slate-500">
      <div className="max-w-sm mx-auto flex flex-col items-center gap-4 px-4 text-center">
        {/* Branding minimal */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white font-semibold">
            A
          </div>
          <span className="text-sm font-bold text-white">AniSphere</span>
        </Link>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-4 font-medium">
          <FooterLink href="/saison">Saison</FooterLink>
          <FooterLink href="/top">Top 100</FooterLink>
          <FooterLink href="/moods">Mood ✨</FooterLink>
          <FooterLink href="/forum">Forum</FooterLink>
        </div>

        {/* Social Icons */}
        <div className="flex gap-3">
          <SocialButton icon={<Twitter size={14} />} href="#" />
          <SocialButton icon={<Github size={14} />} href="#" />
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center gap-1 text-slate-600">
          <p className="text-[11px]">© 2025 AniSphere</p>
          <p className="flex items-center gap-1">
            Made with <Heart size={10} className="text-red-500 fill-red-500" />{" "}
            in Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="hover:text-indigo-400 transition-colors whitespace-nowrap"
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
    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center 
    text-slate-400 hover:bg-indigo-600 hover:text-white 
    transition-colors border border-white/5 hover:border-indigo-500"
  >
    {icon}
  </a>
);
