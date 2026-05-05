"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Check if the user prefers reduced motion.
 * SSR-safe: defaults to false on the server.
 */
export const getMotionSafe = (): boolean => {
  if (typeof window === "undefined") return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Standard scroll-reveal: fade in + slide up.
 * Uses once: true so elements stay visible after reveal.
 *
 * @param elements - CSS selector or element(s)
 * @param options - override defaults
 */
export function fadeInUp(
  elements: gsap.TweenTarget,
  options: {
    duration?: number;
    y?: number;
    delay?: number;
    start?: string;
  } = {}
) {
  if (!getMotionSafe()) return;

  const {
    duration = 1,
    y = 40,
    delay = 0,
    start = "top 80%",
  } = options;

  gsap.from(elements, {
    opacity: 0,
    y,
    duration,
    delay,
    ease: "power3.out",
    scrollTrigger: {
      trigger: elements as gsap.DOMTarget,
      start,
      once: true,
    },
  });
}

/**
 * Staggered scroll-reveal for children of a parent container.
 *
 * @param parent - CSS selector or element for the parent
 * @param childSelector - CSS selector for children to stagger
 * @param staggerAmount - delay between each child (default 0.15s)
 * @param options - override defaults
 */
export function staggerFadeIn(
  parent: gsap.DOMTarget,
  childSelector: string,
  staggerAmount: number = 0.15,
  options: {
    duration?: number;
    y?: number;
    start?: string;
  } = {}
) {
  if (!getMotionSafe()) return;

  const {
    duration = 0.9,
    y = 40,
    start = "top 80%",
  } = options;

  gsap.from(childSelector, {
    opacity: 0,
    y,
    duration,
    stagger: staggerAmount,
    ease: "power3.out",
    scrollTrigger: {
      trigger: parent,
      start,
      once: true,
    },
  });
}

/**
 * Subtle parallax on decorative elements (scrub-based).
 *
 * @param element - CSS selector or element
 * @param yDistance - how far to move (default -80)
 */
export function parallaxElement(
  element: gsap.TweenTarget,
  yDistance: number = -80
) {
  if (!getMotionSafe()) return;

  gsap.to(element, {
    y: yDistance,
    ease: "none",
    scrollTrigger: {
      trigger: element as gsap.DOMTarget,
      scrub: true,
    },
  });
}

/**
 * Hero-specific entrance animation (not scroll-triggered, plays on load).
 */
export function heroEntrance(
  elements: Array<{ target: gsap.TweenTarget; delay: number }>
) {
  if (!getMotionSafe()) return;

  elements.forEach(({ target, delay }) => {
    gsap.from(target, {
      opacity: 0,
      y: 40,
      duration: 1.2,
      ease: "power3.out",
      delay,
    });
  });
}

/**
 * Refresh all ScrollTrigger instances.
 * Useful after dynamic content loads.
 */
export function refreshScrollTrigger() {
  ScrollTrigger.refresh();
}
