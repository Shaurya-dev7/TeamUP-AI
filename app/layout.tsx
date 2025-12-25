import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="min-h-dvh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
