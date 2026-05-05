"use client";

import { useRef, useEffect } from "react";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Statement from "@/components/landing/Statement";
import WhyNow from "@/components/landing/WhyNow";
import Features from "@/components/landing/Features";
import HowWeWork from "@/components/landing/HowWeWork";
import ClientPartners from "@/components/landing/ClientPartners";
import Locations from "@/components/landing/Locations";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

import { useGsapContext } from "@/lib/landing/animationContext";
import { initSmoothScroll } from "@/lib/landing/smoothScroll";
import {
  heroEntrance,
  fadeInUp,
  staggerFadeIn,
  parallaxElement,
  refreshScrollTrigger,
} from "@/lib/landing/scrollAnimations";

export default function LandingPage() {
  const mainRef = useRef<HTMLDivElement>(null);

  // Smooth scroll
  useEffect(() => {
    const cleanup = initSmoothScroll();
    return cleanup;
  }, []);

  // GSAP animations — all registered inside a context for safe cleanup
  useGsapContext(
    mainRef,
    () => {
      // --- Hero entrance (no scroll trigger, plays on load) ---
      heroEntrance([
        { target: ".hero-title", delay: 0.2 },
        { target: ".hero-subtitle", delay: 0.4 },
        { target: ".hero-scroll-hint", delay: 0.8 },
      ]);

      // Parallax on hero cube
      parallaxElement(".hero-cube", -60);

      // --- Statement section ---
      fadeInUp(".statement-heading");
      staggerFadeIn(".statement-content", ".statement-bullet", 0.15);
      parallaxElement(".statement-visual", -40);

      // --- Why Now ---
      fadeInUp(".why-now-heading");
      staggerFadeIn(".why-now-content", ".why-now-quote", 0.15);
      fadeInUp(".why-now-closer", { delay: 0.3 });
      fadeInUp(".why-now-subtext", { delay: 0.1 });

      // --- Features ---
      fadeInUp(".features-heading");
      staggerFadeIn(".features-grid", ".feature-card", 0.15, { duration: 0.9 });

      // --- How We Work ---
      fadeInUp(".how-heading");
      staggerFadeIn(".how-grid", ".how-step", 0.2, { duration: 0.9 });
      fadeInUp(".how-footnote", { delay: 0.1 });

      // --- Client Partners ---
      fadeInUp(".partners-heading");
      staggerFadeIn(".partners-grid", ".partner-card", 0.08, { duration: 0.7 });

      // --- Locations ---
      fadeInUp(".locations-heading");
      staggerFadeIn(".locations-grid", ".location-card", 0.15);

      // --- CTA ---
      fadeInUp(".cta-text");
      fadeInUp(".cta-form", { delay: 0.2 });

      // Refresh after animations are set up
      refreshScrollTrigger();
    },
    []
  );

  return (
    <div ref={mainRef}>
      <Navbar />
      <Hero />
      <div className="landing-divider" style={{ maxWidth: 1200, margin: "0 auto" }} />
      <Statement />
      <div className="landing-divider" style={{ maxWidth: 1200, margin: "0 auto" }} />
      <WhyNow />
      <div className="landing-divider" style={{ maxWidth: 1200, margin: "0 auto" }} />
      <Features />
      <div className="landing-divider" style={{ maxWidth: 1200, margin: "0 auto" }} />
      <HowWeWork />
      <div className="landing-divider" style={{ maxWidth: 1200, margin: "0 auto" }} />
      <ClientPartners />
      <div className="landing-divider" style={{ maxWidth: 1200, margin: "0 auto" }} />
      <Locations />
      <CTA />
      <Footer />
    </div>
  );
}
