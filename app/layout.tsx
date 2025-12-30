import type { ReactNode } from "react";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import AppHeader from "@/components/AppHeader";
import "./globals.css";
import { BackgroundEffects } from "@/components/BackgroundEffects";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${outfit.variable} ${jakarta.variable} scroll-smooth`}>
      <body className="antialiased font-sans">
        <div className="min-h-dvh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 selection:bg-yellow-400 selection:text-neutral-900 relative">
          <BackgroundEffects />
          <div className="relative z-10">
            <AppHeader />
            <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24 sm:px-6 animate-fade-in">
                {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
