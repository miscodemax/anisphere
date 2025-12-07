"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Info,
  X,
  User,
  Sparkles,
  Home,
  LogIn,
  LogOut,
  Layers,
  Tv,
  BookOpen,
} from "lucide-react";
import AnimeSearch from "./AnimeSearch";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  /** Hydration safe */
  const [mounted, setMounted] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [isCatalogueHovered, setIsCatalogueHovered] = useState(false);

  // Auth
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  const pathname = usePathname();

  /** Mount */
  useEffect(() => {
    setMounted(true);

    // ⚠️ IMPORTANT : créer Supabase uniquement côté client
    const client = createClient();
    setSupabaseClient(client);
  }, []);

  /** Toutes les actions dépendant du navigateur */
  useEffect(() => {
    if (!mounted || !supabaseClient) return;

    // Scroll
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Auth session
    supabaseClient.auth.getUser().then(({ data: { user } }) => setUser(user));

    // Auth listener
    const { data } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      window.removeEventListener("scroll", handleScroll);
      data.subscription.unsubscribe();
    };
  }, [mounted, supabaseClient]);

  /** Login */
  const handleLogin = async () => {
    if (!supabaseClient) return;

    const next = pathname === "/login" ? "/" : pathname;

    await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${
          window.location.origin
        }/auth/callback?redirect=${encodeURIComponent(
          window.location.pathname
        )}`,
      },
    });
  };

  /** Logout */
  const handleLogout = async () => {
    if (!supabaseClient) return;

    await supabaseClient.auth.signOut();
    setUser(null);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "Accueil", href: "/", icon: <Home size={18} /> },
    { name: "News", href: "/news", icon: <Info size={18} /> },
    {
      name: "Recommendation",
      href: "/recommendation",
      icon: <Sparkles size={18} />,
      special: true,
    },
  ];

  const catalogueSubLinks = [
    { name: "Animes", href: "/animes", icon: <Tv size={18} /> },
    { name: "Mangas", href: "/mangas", icon: <BookOpen size={18} /> },
  ];

  const isCatalogueActive = pathname === "/animes" || pathname === "/mangas";

  /** ⛔ Avant mount : on rend une version propre sans dynamique */
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 py-4 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl" />
            <span className="text-xl font-bold text-white">AniSphere</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    );
  }

  /** Une fois monté → rendu complet */
  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "circOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b ${
          scrolled
            ? "bg-[#0B1622]/80 backdrop-blur-xl border-white/5 py-3 shadow-lg shadow-black/20"
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto text-center px-6 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group relative z-20"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              A
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Ani<span className="text-indigo-400">Sphere</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-1 bg-[#151f2e]/50 p-1.5 rounded-full border border-white/5 backdrop-blur-sm shadow-inner relative">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const isHovered = hoveredPath === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onMouseEnter={() => setHoveredPath(link.href)}
                    onMouseLeave={() => setHoveredPath(null)}
                    className={`relative px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 z-10 ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {(isActive || isHovered) && (
                      <motion.div
                        layoutId="navbar-pill"
                        className={`absolute inset-0 rounded-full -z-10 ${
                          isActive
                            ? "bg-indigo-600 shadow-md shadow-indigo-500/20"
                            : "bg-white/5"
                        }`}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {link.icon} {link.name}
                    </span>
                  </Link>
                );
              })}

              {/* Catalogue */}
              <div
                className="relative h-full"
                onMouseEnter={() => setIsCatalogueHovered(true)}
                onMouseLeave={() => setIsCatalogueHovered(false)}
              >
                <div
                  className={`relative px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 z-10 cursor-pointer ${
                    isCatalogueActive || isCatalogueHovered
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {(isCatalogueActive || isCatalogueHovered) && (
                    <motion.div
                      layoutId="navbar-pill"
                      className={`absolute inset-0 rounded-full -z-10 ${
                        isCatalogueActive
                          ? "bg-indigo-600 shadow-md shadow-indigo-500/20"
                          : "bg-white/5"
                      }`}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Layers size={18} /> Catalogue
                  </span>
                </div>

                <AnimatePresence>
                  {isCatalogueHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full mt-2 w-48 bg-[#151f2e] p-2 rounded-xl border border-white/10 shadow-xl shadow-black/40 z-50"
                    >
                      {catalogueSubLinks.map((subLink) => (
                        <Link
                          key={subLink.href}
                          href={subLink.href}
                          className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${
                            pathname === subLink.href
                              ? "bg-indigo-600 text-white font-bold"
                              : "text-slate-300 hover:bg-white/5 hover:text-slate-100"
                          }`}
                        >
                          {subLink.icon}
                          {subLink.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Search Desktop */}
            <div className="hidden md:block">
              <AnimeSearch />
            </div>

            <ThemeToggle />

            {/** User */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500 hover:border-white transition-colors"
                  title="Mon Profil"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white">
                      <User size={20} />
                    </div>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-400 transition-colors p-2"
                  title="Déconnexion"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-indigo-600 text-slate-200 hover:text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all border border-white/5 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20 group"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="w-4 h-4 bg-white rounded-full p-0.5"
                  alt="G"
                />
                <span>Connexion</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-300 bg-white/5 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[70px] left-0 right-0 z-40 bg-[#0B1622]/95 backdrop-blur-xl border-b border-white/10 overflow-hidden md:hidden"
          >
            <div className="p-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 text-lg font-medium text-slate-300 p-4 rounded-xl hover:bg-white/5 hover:text-indigo-400 border border-transparent hover:border-white/5 transition-all"
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}

              {/* Catalogue mobile */}
              <div className="flex flex-col gap-2 pl-4 border-l border.white/20">
                <h3 className="text-sm text-slate-400 font-bold uppercase mt-2 flex items-center gap-2">
                  <Layers size={16} /> Catalogue
                </h3>
                {catalogueSubLinks.map((subLink) => (
                  <Link
                    key={subLink.href}
                    href={subLink.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 text-base text-slate-300 p-2 rounded-lg hover:bg-white/5 hover:text-indigo-400 transition-colors"
                  >
                    {subLink.icon}
                    {subLink.name}
                  </Link>
                ))}
              </div>

              {/* Search Mobile */}
              <div className="md:hidden mt-4">
                <AnimeSearch
                  onSelect={(anime) => {
                    setMobileMenuOpen(false);
                    if (anime.mal_id) {
                      window.location.href = `/anime/${anime.mal_id}`;
                    }
                  }}
                />
              </div>

              <div className="h-px bg-white/10 my-2" />

              {/* User */}
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex.items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <User size={24} className="text-white" />
                    )}
                    <span className="text-white font-bold">Mon Profil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-red-400 py-3 font-bold border border-red-500/30 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={20} /> Déconnexion
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogin();
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text.white py-4 rounded-xl text-center font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                >
                  <LogIn size={20} />
                  Se connecter
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
