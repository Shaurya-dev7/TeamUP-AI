"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useSpring, MotionValue, useTransform } from "framer-motion";

const FRAME_COUNT = 20;

export default function TeamUpEarthScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<ImageBitmap[]>([]); // Optimized for off-main-thread decoding
  const [isLoading, setIsLoading] = useState(true);

  // Scroll progress for the entire 400vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth out the scroll progress - tuned for "video-like" feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 400,  // Stiffer = more responsive (less "slow" lag)
    damping: 40,    // Balanced damping to prevent jitter
    restDelta: 0.0001
  });

  // Preload Images as Bitmaps
  useEffect(() => {
    const loadImages = async () => {
      const loadedImages: ImageBitmap[] = [];
      const imagePromises: Promise<void>[] = [];

      for (let i = 0; i < FRAME_COUNT; i++) {
        const promise = new Promise<void>((resolve, reject) => {
          const img = new Image();
          const paddedIndex = i.toString().padStart(3, "0");
          img.src = `/TeamupHome/frame_${paddedIndex}.jpg`;
          
          img.onload = () => {
             // Create bitmap to pre-decode. This removes main-thread decode jank.
             createImageBitmap(img).then((bitmap) => {
                loadedImages[i] = bitmap;
                resolve();
             }).catch((e) => {
                 console.error("Bitmap error", e);
                 resolve();
             });
          };
          img.onerror = (e) => {
            console.error(`Failed to load frame ${i}`, e);
            resolve();
          };
        });
        imagePromises.push(promise);
      }

      await Promise.all(imagePromises);
      setImages(loadedImages);
      setIsLoading(false);
    };

    loadImages();
  }, []);

  // Canvas Rendering Logic
  useEffect(() => {
    if (isLoading || images.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Optimize context attributes
    const ctx = canvas.getContext("2d", { 
        alpha: false, // Optimizes for opaque background
        desynchronized: true // Low latency hints
    });
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const render = (progressIndex: number) => {
      // 1. Calculate indices for interpolation
      const maxIndex = FRAME_COUNT - 1;
      const idx = Math.min(maxIndex, Math.max(0, progressIndex));
      
      const frameIndex = Math.floor(idx);
      const nextFrameIndex = Math.min(maxIndex, frameIndex + 1);
      const interpolationFactor = idx - frameIndex;

      const img = images[frameIndex];
      const nextImg = images[nextFrameIndex];
      
      if (!img) return;

      // Performance Optimization: Cap DPR at 2.0 for sharper "Retina" look
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Only resize if dimensions changed substantially (prevents thrashing)
      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
      }

      // "Cover" logic calculation with TOP CROP
      const CROP_FACTOR = 0.14; // Crop top 12% to remove black space
      
      const sY = img.height * CROP_FACTOR;
      const sHeight = img.height * (1 - CROP_FACTOR);
      
      const imgRatio = img.width / sHeight;
      const canvasRatio = width / height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = height * imgRatio;
        offsetY = 0;
        // Center then shift LEFT to show more of right side
        // Subtracting moves image left. (width * 0.1) = 10% screen width shift
        offsetX = (width - drawWidth) / 2 - (width * 0.075); 
      } else {
        drawWidth = width;
        drawHeight = width / imgRatio;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      
      // Draw Current Frame (Base) - Source Cropped
      ctx.globalAlpha = 1;
      ctx.drawImage(img, 0, sY, img.width, sHeight, offsetX, offsetY, drawWidth, drawHeight);

      // Draw Next Frame (Overlay for Smoothing)
      if (nextImg) { 
          ctx.globalAlpha = interpolationFactor;
          // Assume nextImg has same dimensions
          ctx.drawImage(nextImg, 0, sY, nextImg.width, sHeight, offsetX, offsetY, drawWidth, drawHeight);
      }
      
      // Reset Alpha
      ctx.globalAlpha = 1;
    };

    // Subscribe to scroll changes using a ref to track animation frame
    const animationFrameId = { current: 0 };
    
    // Animation Logic: Finish Earth rotation by 80% to "pause" for CTA
    const getFrameIndex = (progress: number) => {
        const animationEnd = 0.8;
        const effectiveProgress = Math.min(progress / animationEnd, 1);
        return effectiveProgress * (FRAME_COUNT - 1);
    }

    const unsubscribe = smoothProgress.on("change", (latest) => {
      const frameIndex = getFrameIndex(latest);
      
      if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
      }
      
      animationFrameId.current = requestAnimationFrame(() => render(frameIndex));
    });

    // Initial render
    render(0);

    // Handle Resize
    const handleResize = () => {
       const currentProgress = smoothProgress.get();
       const frameIndex = getFrameIndex(currentProgress);
       render(frameIndex);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      unsubscribe();
      window.removeEventListener("resize", handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isLoading, images, smoothProgress]);

  return (
    <div ref={containerRef} className="relative h-[700vh] bg-[#050505]">
      {/* Sticky Canvas Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        
        {/* Loading State */}
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#050505] z-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Initializing Earth...</p>
                </div>
            </div>
        )}

        <canvas ref={canvasRef} className="block w-full h-full" style={{ filter: "brightness(0.9)" }} />
        
        {/* Overlay Gradients to smooth edges if needed */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]/50 pointer-events-none" />

        {/* Narrative Layers */}
        <div className="absolute inset-0 pointer-events-none">
             {/* 0% - Hero Title (Persistent) */}
             <StoryText showRange={[0, 1]} progress={scrollYProgress} align="center" persistent={true} type="header">
                <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-50 to-yellow-400 mb-6 drop-shadow-2xl">
                    TeamUp
                </h1>
                <p className="text-2xl md:text-4xl text-yellow-400 font-bold tracking-wide drop-shadow-lg">
                    Where the right people connect.
                </p>
             </StoryText>

             {/* 15% - Alignment (Shifted earlier) */}
             <StoryText showRange={[0.15, 0.45]} progress={scrollYProgress} align="left">
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-white mb-6 drop-shadow-xl">
                    Alignment over randomness.
                </h2>
                <p className="text-2xl md:text-3xl text-neutral-200 max-w-lg leading-relaxed font-semibold drop-shadow-md">
                    We don't just broadcast your profile. We forge neural pathways to those who share your mission.
                </p>
             </StoryText>
             {/* 45% - Collaboration (Extended duration) */}
             <StoryText showRange={[0.5, 0.8]} progress={scrollYProgress} align="right">
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-white mb-6 drop-shadow-xl">
                    Built for real collaboration.
                </h2>
                <p className="text-2xl md:text-3xl text-neutral-200 max-w-lg leading-relaxed ml-auto font-semibold drop-shadow-md">
                    From local clusters to global networks. Watch your potential expand across borders.
                </p>
             </StoryText>

             {/* 80% - CTA (Final Persistent) - Reduced duration */}
             <StoryText showRange={[0.8, 1.0]} progress={scrollYProgress} align="center" persistent={true} type="cta">
                <h2 className="text-6xl md:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-500 mb-10 drop-shadow-2xl">
                    Build together.
                </h2>
                <button className="pointer-events-auto px-12 py-5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-black text-2xl rounded-full hover:from-blue-500 hover:to-violet-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_-10px_rgba(79,70,229,0.5)]">
                    Start with TeamUp
                </button>
             </StoryText>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponent for Text Transitions ---
function StoryText({ 
    children, 
    showRange, 
    progress, 
    align = "center",
    persistent = false,
    type = "default"
}: { 
    children: React.ReactNode; 
    showRange: [number, number]; 
    progress: MotionValue<number>; 
    align?: "left" | "center" | "right";
    persistent?: boolean;
    type?: "header" | "cta" | "default";
}) {
    // Opacity Logic
    let outputRange = [0, 1, 1, 0];
    if (persistent) {
        if (type === "header") outputRange = [1, 1, 1, 1]; // Always visible
        if (type === "cta") outputRange = [0, 1, 1, 1]; // Fades in then stays
    }

    const opacity = useTransform(
        progress,
        [showRange[0], showRange[0] + 0.1, showRange[1] - 0.1, showRange[1]],
        outputRange
    );

    // Y Translation Logic
    const headerY = useTransform(progress, [0, 0.25], ["-50%", "-180%"]); // Faster exit
    const ctaY = useTransform(progress, [showRange[0], showRange[0] + 0.1], [50, 0]);
    // REMOVED 'standardY' movement - Text stays static and just fades in/out
    const standardY = useTransform(progress, [showRange[0], showRange[1]], [0, 0]);

    const y = type === "header" ? headerY : type === "cta" ? ctaY : standardY;
    
    // Positioning
    let wrapperClasses = "absolute w-full px-8 md:px-20 flex flex-col pointer-events-none transition-all duration-500 will-change-transform backface-hidden"; // Added hardware hints
    
    if (type === "header") {
        wrapperClasses += " top-1/2 left-0 pl-8 md:pl-24"; // Shifted Right significantly
    } else if (type === "cta") {
        wrapperClasses += " top-1/2 -translate-y-1/2 left-0";
    } else {
         wrapperClasses += " top-1/2 -translate-y-1/2 left-0";
    }

    if (align === "center") wrapperClasses += " items-center text-center";
    if (align === "left") wrapperClasses += " items-start text-left";
    if (align === "right") wrapperClasses += " items-end text-right";

    return (
        <motion.div 
            style={{ opacity, y: type === "header" ? undefined : y, translateY: type === "header" ? y : undefined }} 
            className={wrapperClasses}
        >
            {children}
        </motion.div>
    )
}
