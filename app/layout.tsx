import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ThemeProvider } from "./components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AniSphere | L'expérience Anime Ultime",
    template: "%s | AniSphere",
  },
  description:
    "Découvrez, suivez et organisez vos animes et mangas avec une UX moderne et intelligente.",
  icons: {
    icon: "/favicon.ico", // Pense à mettre une icône plus tard
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EDF1F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1622" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main className="min-h-screen mt-24 bg-[#EDF1F5] dark:bg-[#0B1622] text-slate-900 dark:text-slate-100 px-4 md:p-10 font-sans selection:bg-indigo-500 selection:text-white">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
