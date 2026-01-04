"use client";

import { motion } from "framer-motion";
import { Mail, Bug, Handshake, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const email = "shauryadeeprai@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start pt-10 md:pt-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10 px-4"
      >
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 mb-4 inline-block">
            Get in Touch
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-neutral-900 via-neutral-600 to-neutral-400 dark:from-white dark:via-neutral-400 dark:to-neutral-600 bg-clip-text text-transparent">
          Contact Administration
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-12">
          Have a bug to report, or interested in collaborating? We'd love to hear from you.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl px-4 z-10">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="group relative overflow-hidden rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm hover:shadow-xl transition-all duration-300"
        >
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Mail className="w-24 h-24" />
             </div>
             
             <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                    <Handshake className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Collaboration</h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                    Interested in partnering with TeamUp? Let's build something amazing together.
                </p>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                    {email}
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
             </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="group relative overflow-hidden rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm hover:shadow-xl transition-all duration-300"
        >
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bug className="w-24 h-24" />
             </div>
             
             <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6 text-yellow-600 dark:text-yellow-400">
                    <Bug className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Report a Bug</h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                    Found something not working right? Help us improve the platform for everyone.
                </p>
                <a 
                    href={`mailto:${email}?subject=Bug Report: TeamUp`}
                    className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                >
                    Send Report &rarr;
                </a>
             </div>
        </motion.div>
      </div>

      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.5, duration: 0.5 }}
         className="mt-12 text-center"
      >
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg top-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Typically replies within 24 hours
            </span>
         </div>
      </motion.div>
    </div>
  );
}
