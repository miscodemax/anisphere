"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  User,
  Sparkles,
  Compass,
  Home,
  LogIn,
} from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const pathname = usePathname();

  // Détection du scroll pour l'effet "Glass"
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Accueil", href: "/", icon: <Home size={18} /> },
    { name: "Catalogue", href: "/catalogue", icon: <Compass size={18} /> },
    {
      name: "Moods",
      href: "/moods",
      icon: <Sparkles size={18} />,
      special: true,
    },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "circOut" }}
        className={`fixed top-0 mb-7 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b ${
          scrolled
            ? "bg-[#0B1622]/80 backdrop-blur-xl border-white/5 py-3 shadow-lg shadow-black/20"
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* --- LOGO --- */}
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

          {/* --- DESKTOP NAVIGATION (Centrée) --- */}
          <div className="hidden md:flex items-center gap-1 bg-[#151f2e]/50 p-1.5 rounded-full border border-white/5 backdrop-blur-sm shadow-inner relative">
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
                  {/* Fond animé au survol ou actif */}
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

                  <span
                    className={`relative z-10 flex items-center gap-2 ${
                      link.special ? "text-indigo-300 font-bold" : ""
                    }`}
                  >
                    {link.icon} {link.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* --- ACTIONS (Search + Profile) --- */}
          <div className="flex items-center gap-3 z-20">
            <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95">
              <Search size={20} strokeWidth={2.5} />
            </button>

            <Link
              href="/login"
              className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-indigo-600 text-slate-200 hover:text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all border border-white/5 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20 group"
            >
              <User
                size={18}
                className="group-hover:-translate-y-0.5 transition-transform"
              />
              <span>Connexion</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-slate-300 bg-white/5 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* --- MOBILE MENU OVERLAY --- */}
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
              <div className="h-px bg-white/10 my-2" />
              <Link
                href="/login"
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl text-center font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn size={20} />
                Se connecter
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
