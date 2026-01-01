"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Linkedin, Github, Send, Heart } from "lucide-react";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#" },
        { label: "Pricing", href: "#" },
        { label: "Enterprise", href: "#" },
        { label: "Changelog", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Community", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Help Center", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Cookie Policy", href: "#" },
      ],
    },
  ];

  return (
    <footer className="relative bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white pt-20 pb-10 overflow-hidden border-t border-neutral-200 dark:border-neutral-800">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-400/5 dark:bg-yellow-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-3">
                <div className="relative grid size-10 place-items-center rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-lg font-black shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                  TUP
                </div>
                <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Team<span className="text-yellow-500">Up</span></span>
              </div>
            </Link>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-sm leading-relaxed">
              The world's most advanced platform for building dream teams. Connect, collaborate, and create with AI-powered matching.
            </p>
            
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 hover:-translate-y-1"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((column) => (
            <div key={column.title} className="lg:col-span-1">
              <h4 className="font-bold text-lg mb-6 text-neutral-900 dark:text-white">{column.title}</h4>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href} 
                      className="text-neutral-600 dark:text-neutral-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter Column */}
          <div className="lg:col-span-1">
            <h4 className="font-bold text-lg mb-6 text-neutral-900 dark:text-white">Stay Updated</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Get the latest updates, articles, and resources sent to your inbox weekly.
            </p>
            <form className="space-y-3">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  suppressHydrationWarning
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-3 px-4 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder:text-neutral-400"
                />
                <button 
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-yellow-400 hover:bg-yellow-300 text-neutral-950 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-600">
                By subscribing, you agree to our Privacy Policy and provide consent to receive updates.
              </p>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-200 dark:border-neutral-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            &copy; {currentYear} TeamUp Inc. all rights reserved. <span className="ml-2 text-xs opacity-50">v1.2.0-beta</span>
          </p>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
            <span>by TeamUp</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
