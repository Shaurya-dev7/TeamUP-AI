"use client";

import Lenis from "@studio-freight/lenis";
import gsap from "gsap";

let lenisInstance: Lenis | null = null;

/**
 * Initialize Lenis smooth scroll and sync it with GSAP ticker.
 * Call once from the landing page's top-level useEffect.
 * Returns a cleanup function.
 */
export function initSmoothScroll(): () => void {
  if (lenisInstance) {
    lenisInstance.destroy();
  }

  const lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true,
  });

  lenisInstance = lenis;

  // Sync Lenis with GSAP ticker for jitter-free scrolling
  const tickerCallback = (time: number) => {
    lenis.raf(time * 1000);
  };

  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tickerCallback);
    lenis.destroy();
    lenisInstance = null;
  };
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}
