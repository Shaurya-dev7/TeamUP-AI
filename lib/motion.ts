import { Variants, Transition } from "framer-motion";

/**
 * TeamUp Enterprise Motion System
 * Centralized animations to ensure cohesive framer motion choreography across the platform.
 * Relies exclusively on subtle, professional transitions globally.
 */

// Enterprise standard timing
export const standardEasing: [number, number, number, number] = [0.16, 1, 0.3, 1]; // Smooth, intention-driven curve
export const standardDuration = 0.5;

export const defaultTransition: Transition = {
  duration: standardDuration,
  ease: standardEasing,
};

export const fastTransition: Transition = {
  duration: 0.2,
  ease: "easeOut",
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: defaultTransition 
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: defaultTransition 
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition
  }
};

export const hoverElevation = {
  rest: { y: 0, scale: 1, transition: fastTransition },
  hover: { y: -2, scale: 1.01, transition: fastTransition }
};

export const hoverScale = {
  rest: { scale: 1, transition: fastTransition },
  hover: { scale: 1.02, transition: fastTransition }
};

export const expandCollapse: Variants = {
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  visible: { 
    height: "auto", 
    opacity: 1, 
    transition: defaultTransition 
  }
};

/**
 * Standard classes for skeleton shimmer effects 
 * (combines with existing tailwind animate-shimmer definition)
 */
export const skeletonShimmerClass = "relative overflow-hidden bg-muted/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";
