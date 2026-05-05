import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./landing.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Continuous Ventures — Where Others Advise, We Build",
  description:
    "Your global partner in tech-driven venture acceleration, investment & disruption.",
};

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${outfit.variable} ${jakarta.variable} landing-page`}
      style={{
        fontFamily: "var(--font-jakarta), sans-serif",
        background: "var(--landing-bg)",
        color: "var(--landing-text)",
        minHeight: "100dvh",
      }}
    >
      {children}
    </div>
  );
}
