"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Search, HelpCircle } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "What is TeamUp?",
    answer: "TeamUp is a platform designed to connect developers, designers, and innovators for hackathons and collaborative projects. We help you find the perfect teammates based on skills, interests, and availability."
  },
  {
    question: "How do I join a team?",
    answer: "You can browse available teams in the 'Teams' section. Once you find a team that interests you, simply click 'Join' or 'Apply' depending on the team's settings. The team leader will review your request."
  },
  {
    question: "Is it free to use?",
    answer: "Yes! TeamUp is completely free for all users. Our mission is to foster collaboration and innovation in the tech community without any barriers."
  },
  {
    question: "How can I contact support?",
    answer: "You can reach out to our administration team via the 'Contact' page for any bug reports, feature requests, or collaboration inquiries."
  },
  {
    question: "Can I create my own hackathon team?",
    answer: "Absolutely! Just navigate to the 'Teams' page and click 'Create Team'. You can set your requirements, project description, and invite others to join."
  }
];

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[80vh] flex flex-col items-center pt-10 md:pt-20 px-4 relative max-w-4xl mx-auto">
        
       <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 mb-4 inline-block">
            Support
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          Frequently Asked Questions
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto mb-8">
          Everything you need to know about TeamUp. Can't find the answer you're looking for? Feel free to contact us.
        </p>

        <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
                <Search className="w-5 h-5" />
            </div>
            <input 
                type="text" 
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
        </div>
      </motion.div>

      <div className="w-full space-y-4">
        {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                    activeIndex === index 
                    ? "bg-white dark:bg-neutral-900 border-blue-500/30 shadow-lg shadow-blue-500/10" 
                    : "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 hover:border-blue-500/20"
                }`}
            >
                <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className="flex items-center justify-between w-full p-6 text-left"
                >
                <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {faq.question}
                </span>
                <span className={`p-2 rounded-full transition-colors duration-300 ${
                    activeIndex === index 
                    ? "bg-blue-500 text-white" 
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                }`}>
                    {activeIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
                </button>
                <AnimatePresence>
                {activeIndex === index && (
                    <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                    <div className="px-6 pb-6 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {faq.answer}
                    </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
            ))
        ) : (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                    <HelpCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-neutral-500">Try searching for something else.</p>
            </div>
        )}
      </div>

    </div>
  );
}
