"use client";

import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

/**
 * Custom hook that creates a GSAP context scoped to a container ref.
 * All GSAP animations registered inside the factory function will be
 * automatically reverted when the component unmounts or on HMR.
 *
 * Usage:
 *   const containerRef = useRef(null);
 *   useGsapContext(containerRef, (ctx) => {
 *     gsap.from(".hero-title", { opacity: 0, y: 40 });
 *   });
 */
export function useGsapContext(
  containerRef: React.RefObject<HTMLElement | null>,
  factory: (ctx: gsap.Context) => void,
  deps: React.DependencyList = []
) {
  const ctxRef = useRef<gsap.Context | null>(null);

  // Stable factory reference
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  useEffect(() => {
    if (!containerRef.current) return;

    // Revert any previous context (HMR safety)
    ctxRef.current?.revert();

    const ctx = gsap.context(() => {
      factoryRef.current(ctx!);
    }, containerRef.current);

    ctxRef.current = ctx;

    return () => {
      ctx.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const getContext = useCallback(() => ctxRef.current, []);

  return { getContext };
}
