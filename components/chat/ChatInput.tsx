import React, { useRef, useEffect } from "react";
import { Send, Plus, Paperclip, Image as ImageIcon, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ChatInputProps = {
    value: string;
    onChange: (val: string) => void;
    onSend: () => void;
    disabled?: boolean;
};

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showMenu, setShowMenu] = React.useState(false);

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="relative flex items-end gap-2 p-4 pt-2">
            {/* Magic Menu */}
            <div className="relative z-20">
                <AnimatePresence>
                    {showMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: -10 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className="absolute bottom-full left-0 mb-2 flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white/90 p-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-black/80"
                        >
                            <button className="flex items-center gap-3 rounded-xl p-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-neutral-700 dark:text-neutral-200">
                                <ImageIcon className="h-4 w-4 text-purple-500" /> Photo
                            </button>
                            <button className="flex items-center gap-3 rounded-xl p-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-neutral-700 dark:text-neutral-200">
                                <Paperclip className="h-4 w-4 text-blue-500" /> Document
                            </button>
                            <button className="flex items-center gap-3 rounded-xl p-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-neutral-700 dark:text-neutral-200">
                                <MapPin className="h-4 w-4 text-red-500" /> Location
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMenu(!showMenu)}
                    className={`flex h-[44px] w-[44px] items-center justify-center rounded-full transition-colors ${showMenu ? 'bg-neutral-200 dark:bg-white/20 rotate-45' : 'bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10'}`}
                >
                    <Plus className={`h-5 w-5 text-neutral-600 dark:text-neutral-300 transition-transform duration-300 ${showMenu ? 'rotate-45' : ''}`} />
                </motion.button>
            </div>

            {/* Input Area */}
            <div className="flex-1 rounded-[24px] border border-neutral-200 bg-white/80 p-1 shadow-sm focus-within:ring-2 focus-within:ring-yellow-400/50 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/60">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder="Message..."
                    rows={1}
                    className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-500 outline-none dark:text-white custom-scrollbar"
                />
            </div>

            {/* Send Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSend}
                disabled={disabled || !value.trim()}
                className={`flex h-[44px] w-[44px] items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-neutral-950 shadow-lg shadow-yellow-500/20 transition-all ${disabled || !value.trim() ? "opacity-50 grayscale" : "hover:shadow-yellow-500/40"
                    }`}
            >
                <Send className="h-5 w-5 ml-0.5" />
            </motion.button>
        </div>
    );
}
