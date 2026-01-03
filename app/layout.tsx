import type { ReactNode } from "react";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import AppHeader from "@/components/AppHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
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

import { Toaster } from 'sonner';
import { GlobalNotifications } from "@/components/global/GlobalNotifications";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${outfit.variable} ${jakarta.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <div className="min-h-dvh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 selection:bg-yellow-400 selection:text-neutral-900 relative">
            <BackgroundEffects />
            <Toaster position="top-center" richColors />
            <GlobalNotifications />
            <div className="relative z-10">
              <AppHeader />
              <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-24 sm:px-6 lg:px-8 md:pb-10 animate-fade-in">
                  {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
