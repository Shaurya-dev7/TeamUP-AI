"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";
import { ArrowRight, Zap, Globe, MessageSquare, Briefcase, Star, MousePointer2, Check, UserPlus } from "lucide-react";
import AnnouncementTicker from "@/components/AnnouncementTicker";
import AppFooter from "@/components/AppFooter";

// --- Hooks ---

function useParallax(value: any, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

function useTilt(ref: React.RefObject<HTMLElement | null>) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { x, y, handleMouseMove, handleMouseLeave };
}

// --- 3D Components ---

const Button3D = ({ children, className, variant = "primary", href, ...props }: any) => {
    const baseStyles = "relative inline-flex items-center justify-center px-8 py-4 text-lg font-black uppercase tracking-wide transition-all active:translate-y-[4px] active:shadow-none border-2 rounded-xl group select-none";
    
    // Improved Dark Mode Shadows: In dark mode, we use a lighter/colored shadow or a distinct border to show depth since black shadows vanish on black backgrounds.
    const variants: any = {
        primary: "bg-yellow-400 border-yellow-950 text-neutral-950 shadow-[4px_4px_0px_#422006] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#422006] active:translate-y-[2px] active:shadow-[2px_2px_0px_#422006]",
        // Secondary: White in light mode, Dark Grey in dark mode. 
        secondary: "bg-white dark:bg-neutral-800 border-neutral-950 dark:border-neutral-700 text-neutral-950 dark:text-white shadow-[4px_4px_0px_#171717] dark:shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#171717] dark:hover:shadow-[6px_6px_0px_#000] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000]"
    };

    const content = (
        <>
            {children}
            {/* Glossy overlay for extra 'plastic' 3D feel */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
        </>
    );

    if (href) {
        return (
            <Link href={href} className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
                {content}
            </Link>
        );
    }

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {content}
        </button>
    );
};

const Card3D = ({ children, className, delay = 0 }: any) => {
    const ref = useRef<HTMLDivElement>(null);
    const { x, y, handleMouseMove, handleMouseLeave } = useTilt(ref);
    
    const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
    const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: delay, type: "spring", stiffness: 50, damping: 20 }}
            className={`relative bg-white dark:bg-neutral-900 border-2 border-neutral-950 dark:border-neutral-700 rounded-3xl p-8 shadow-[8px_8px_0px_#171717] dark:shadow-[8px_8px_0px_#000] transition-shadow hover:shadow-[12px_12px_0px_#171717] dark:hover:shadow-[12px_12px_0px_#000] ${className} h-full`}
        >
            <div style={{ transform: "translateZ(30px)" }}>
                 {children}
            </div>
        </motion.div>
    );
};

const FloatingElement = ({ delay = 0, duration = 4, x = 10, y = 10, rotate = 5, className, children }: any) => {
    return (
        <motion.div
            animate={{
                y: [0, -y, 0],
                x: [0, x, 0],
                rotate: [0, rotate, 0],
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// --- Sections ---

function Hero() {
    const { scrollY } = useScroll();
    const y1 = useParallax(scrollY, 100);
    const y2 = useParallax(scrollY, -100);
    
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-20 bg-[#fbfbfb] dark:bg-[#0a0a0a]">
            {/* Background Grid with Mask */}
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            
            {/* Interactive Mouse Follower Blob (Subtle) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-400/5 dark:bg-yellow-400/10 rounded-full blur-[120px]" />
            </div>

            {/* Parallax Floating Objects */}
            <motion.div style={{ y: y1 }} className="absolute top-[10%] left-[5%] lg:left-[10%] z-0 hidden md:block">
                <FloatingElement duration={5} x={0} y={15} rotate={10}>
                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl bg-yellow-400 border-4 border-neutral-950 dark:border-white shadow-[8px_8px_0px_#000] rotate-12 flex items-center justify-center">
                        <Zap className="w-12 h-12 text-neutral-950" />
                    </div>
                </FloatingElement>
            </motion.div>
            
            <motion.div style={{ y: y2 }} className="absolute bottom-[20%] right-[5%] lg:right-[10%] z-0 hidden md:block">
                <FloatingElement delay={1} duration={7} x={0} y={-15} rotate={-10}>
                     <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full bg-blue-500 border-4 border-neutral-950 dark:border-white shadow-[8px_8px_0px_#000] flex items-center justify-center">
                        <Globe className="w-10 h-10 text-white" />
                     </div>
                </FloatingElement>
            </motion.div>

             <div className="container relative z-10 px-4 text-center">
                 <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="inline-block mb-8"
                 >
                    <div className="bg-white dark:bg-neutral-800 border-2 border-neutral-950 dark:border-neutral-200 px-6 py-2 rounded-full shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#444] hover:scale-105 transition-transform cursor-default">
                        <span className="font-bold text-sm tracking-widest uppercase flex items-center gap-2"> 
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/> The #1 Team Building Platform
                        </span>
                    </div>
                 </motion.div>

                 <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-neutral-900 dark:text-white leading-[0.9] tracking-tighter mb-8 drop-shadow-xl relative">
                    FIND YOUR <br />
                    <span className="relative inline-block">
                        <span className="text-yellow-400 text-shadow-3d-yellow stroke-black px-2 relative z-10">SQUAD.</span>
                        <svg className="absolute w-full h-[20px] -bottom-2 left-0 z-0 text-neutral-900 dark:text-white" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                        </svg>
                    </span>
                 </h1>

                 <p className="max-w-2xl mx-auto text-xl md:text-2xl font-medium text-neutral-600 dark:text-neutral-300 mb-12 leading-relaxed">
                    Don't just look for skills. Look for <span className="font-black text-neutral-900 dark:text-white bg-yellow-400/20 px-1 rounded transform -rotate-2 inline-block">chemistry</span>. 
                    TeamUp matches you with people who share your vibe.
                 </p>

                 <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Button3D href="/discover">Start Discovering</Button3D>
                    <Button3D href="/signup" variant="secondary">Create Profile</Button3D>
                 </div>
             </div>
        </section>
    )
}

function FeatureSection() {
    return (
        <section className="py-32 bg-yellow-400 dark:bg-yellow-500 border-y-2 border-neutral-950 relative overflow-hidden">
             {/* Decorative patterns */}
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
             
             <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-black text-neutral-950 mb-6 uppercase tracking-tight"
                    >
                        Why We're <span className="text-white text-shadow-3d-black">Different</span>
                    </motion.h2>
                    <p className="text-xl font-bold text-neutral-900/80">No boring lists. Just smart connections.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                    <Card3D delay={0.1} className="dark:bg-neutral-900 dark:border-neutral-800">
                        <div className="w-20 h-20 bg-blue-500 rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center mb-6 rotate-3 group-hover:rotate-12 transition-transform">
                            <Zap className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase dark:text-white">AI Matching</h3>
                        <p className="font-medium text-neutral-600 dark:text-neutral-400">Our algorithm believes in quality over quantity. It understands your goals and working style to find the perfect fit.</p>
                    </Card3D>
                    
                    <Card3D delay={0.2} className="md:-translate-y-12 z-10 dark:bg-neutral-900 dark:border-neutral-800">
                        <div className="w-20 h-20 bg-red-500 rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center mb-6 -rotate-3 group-hover:-rotate-12 transition-transform">
                            <Globe className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase dark:text-white">Global Reach</h3>
                        <p className="font-medium text-neutral-600 dark:text-neutral-400">Connect with talent from MIT, Stanford, YC, and top tech hubs. Your dream team might be a timezone away.</p>
                    </Card3D>

                    <Card3D delay={0.3} className="dark:bg-neutral-900 dark:border-neutral-800">
                        <div className="w-20 h-20 bg-purple-500 rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center mb-6 rotate-2 group-hover:rotate-6 transition-transform">
                            <MessageSquare className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase dark:text-white">Real-time Chat</h3>
                        <p className="font-medium text-neutral-600 dark:text-neutral-400">Instant messaging built-in. Start the conversation right away and move from "Hello" to "Let's build" in seconds.</p>
                    </Card3D>
                </div>
             </div>
        </section>
    )
}

function ProfileCard({ name, role, color, icon: Icon }: any) {
    const [liked, setLiked] = useState(false);

    return (
        <motion.div 
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`bg-neutral-900 p-4 rounded-xl border border-neutral-800 hover:border-${color}-400 transition-colors cursor-pointer group relative overflow-hidden`}
            onClick={() => setLiked(!liked)}
        >
             {liked && (
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full z-10"
                >
                    <Check className="w-3 h-3" />
                </motion.div>
             )}
            <div className={`w-12 h-12 rounded-full bg-${color}-500/20 text-${color}-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="font-bold text-white">{name}</div>
            <div className="text-xs text-neutral-500">{role}</div>
            <div className="mt-3 flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-700 group-hover:bg-yellow-400 transition-colors"/>
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-700 group-hover:bg-yellow-400 transition-colors delay-75"/>
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-700 group-hover:bg-yellow-400 transition-colors delay-100"/>
            </div>
        </motion.div>
    )
}

function InteractiveDemo() {
    return (
        <section className="py-32 bg-neutral-950 text-white relative overflow-hidden">
             {/* Background glows */}
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

             <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16 relative z-10">
                 <div className="flex-1">
                     <motion.h2 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-black mb-8 leading-tight"
                     >
                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Stop swiping.</span> <br/> 
                         Start building.
                     </motion.h2>
                     <p className="text-xl text-neutral-400 mb-10 max-w-lg leading-relaxed">
                         We've gamified the team formation process. Earn badges, verify skills, and climb the leaderboard as you collaborate.
                     </p>
                     
                     <div className="flex gap-4 mb-4 items-center">
                        <div className="flex -space-x-4 pl-4">
                            {[1,2,3,4].map((i) => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-neutral-950 bg-neutral-800 flex items-center justify-center font-bold relative z-0 hover:z-10 hover:scale-110 transition-transform hover:border-yellow-400 cursor-pointer">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="avatar" className="w-full h-full rounded-full" />
                                </div>
                            ))}
                        </div>
                        <div className="pl-4">
                             <div className="text-yellow-400 font-black text-2xl">4.9/5</div>
                             <div className="text-neutral-500 text-xs uppercase font-bold tracking-wider">User Rating</div>
                        </div>
                     </div>
                 </div>

                 <div className="flex-1 w-full relative">
                     {/* 3D Mockup Container */}
                     <motion.div 
                        initial={{ rotateY: 15, rotateX: 5 }}
                        whileHover={{ rotateY: 5, rotateX: 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="bg-neutral-900 border-4 border-neutral-800 rounded-[2.5rem] p-6 shadow-2xl relative z-10 perspective-1000 transform-gpu"
                        style={{ transformStyle: 'preserve-3d' }}
                     >
                         <div className="aspect-[4/3] bg-black rounded-2xl overflow-hidden relative border border-neutral-800 flex flex-col">
                             {/* Mock UI Header */}
                             <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/50 backdrop-blur-sm">
                                 <div className="flex items-center gap-2">
                                     <div className="w-3 h-3 rounded-full bg-red-500"/>
                                     <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                                     <div className="w-3 h-3 rounded-full bg-green-500"/>
                                 </div>
                                 <div className="text-xs font-bold text-neutral-600 uppercase tracking-widest">TeamUp Browser</div>
                             </div>
                             
                             {/* Mock UI Content */}
                             <div className="p-8 flex-1 bg-gradient-to-br from-neutral-900 to-black">
                                  <div className="text-lg font-black text-white mb-6">Suggested Teammates</div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <ProfileCard name="Alex C." role="Frontend Dev" color="blue" icon={Briefcase} />
                                      <ProfileCard name="Sarah J." role="Product Design" color="purple" icon={MousePointer2} />
                                      <ProfileCard name="Mike T." role="Backend AWS" color="red" icon={Zap} />
                                      <div className="bg-neutral-900/50 border border-dashed border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 hover:text-white hover:border-white transition-colors cursor-pointer group">
                                          <div className="text-center">
                                              <UserPlus className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                              <div className="text-xs font-bold">Invite Friend</div>
                                          </div>
                                      </div>
                                  </div>
                             </div>

                             {/* Floating Notification */}
                             <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 2, duration: 0.5 }}
                                className="absolute bottom-6 right-6 bg-yellow-400 text-black px-4 py-3 rounded-xl font-bold shadow-lg flex items-center gap-3 z-20"
                             >
                                 <div className="bg-white p-1 rounded-full"><Check className="w-3 h-3 text-black" /></div>
                                 <div>
                                     <div className="text-xs uppercase opacity-70">New Activity</div>
                                     Match Found! 🎉
                                 </div>
                             </motion.div>
                         </div>
                     </motion.div>
                 </div>
             </div>
        </section>
    )
}

function CTA() {
    return (
        <section className="py-32 bg-[#fbfbfb] dark:bg-[#0a0a0a] border-t-2 border-neutral-200 dark:border-neutral-800 text-center relative overflow-hidden">
             
             <div className="container relative z-10 px-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-5xl md:text-8xl font-black mb-10 text-neutral-950 dark:text-white uppercase leading-[0.9]">
                        Ready to <br/> <span className="text-outline-3d">Level Up?</span>
                    </h2>
                    <div className="flex justify-center">
                        <Button3D href="/signup" className="text-2xl px-12 py-8 rounded-2xl shadow-[8px_8px_0px_#422006] hover:shadow-[12px_12px_0px_#422006] hover:-translate-y-1">Get Started Now</Button3D>
                    </div>
                </motion.div>
             </div>
             
             {/* Background Text Marquee */}
             <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none overflow-hidden whitespace-nowrap">
                 <motion.div 
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="text-[20vw] font-black uppercase leading-none text-neutral-900 dark:text-white"
                 >
                     TeamUp TeamUp TeamUp TeamUp
                 </motion.div>
             </div>
        </section>
    )
}

// --- Main Page Component ---

export default function HomeV2() {
  return (
    <div className="min-h-screen bg-[#fbfbfb] dark:bg-[#0a0a0a] selection:bg-yellow-400 selection:text-black font-sans overflow-x-hidden">
      <style jsx global>{`
          .text-shadow-3d-yellow {
             text-shadow: 4px 4px 0px #eab308;
          }
          
          .text-shadow-3d-black {
             text-shadow: 4px 4px 0px #000;
          }

          .text-outline-3d {
             -webkit-text-stroke: 2px currentColor;
             color: transparent;
             text-shadow: 4px 4px 0px #eab308;
          }
          
          /* Smooth scrolling optional */
          html {
              scroll-behavior: smooth;
          }
      `}</style>
      
      <AnnouncementTicker />
      <Hero />
      <FeatureSection />
      <InteractiveDemo />
      <CTA />
      <AppFooter />
    </div>
  );
}
