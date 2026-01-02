import React, { useRef, useEffect } from "react";
import { Send, Plus, Paperclip, Image as ImageIcon, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ChatInputProps = {
    value: string;
    onChange: (val: string) => void;
    onSend: () => void;
    disabled?: boolean;
    replyingTo?: { sender: string, content: string } | null;
    onCancelReply?: () => void;
    onLocation?: () => void;
    isSending?: boolean;
};

export function ChatInput({ value, onChange, onSend, disabled, replyingTo, onCancelReply, onLocation, isSending }: ChatInputProps) {
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
        <div className="flex flex-col w-full">
            {/* Reply Banner */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="mx-4 mt-2 p-3 bg-neutral-100 dark:bg-neutral-800 border-l-4 border-yellow-400 rounded-r-xl flex justify-between items-center"
                    >
                        <div className="text-sm overflow-hidden">
                            <span className="font-bold text-yellow-600 dark:text-yellow-400">Replying to {replyingTo.sender}</span>
                            <p className="text-neutral-500 truncate dark:text-neutral-400">{replyingTo.content}</p>
                        </div>
                        <button onClick={onCancelReply} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                <button className="flex items-center gap-3 rounded-xl p-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-neutral-700 dark:text-neutral-200 opacity-50 cursor-not-allowed" title="Coming soon">
                                    <ImageIcon className="h-4 w-4 text-purple-500" /> Photo
                                </button>
                                <button className="flex items-center gap-3 rounded-xl p-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-neutral-700 dark:text-neutral-200 opacity-50 cursor-not-allowed" title="Coming soon">
                                    <Paperclip className="h-4 w-4 text-blue-500" /> Document
                                </button>
                                <button onClick={() => { onLocation?.(); setShowMenu(false); }} className="flex items-center gap-3 rounded-xl p-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-neutral-700 dark:text-neutral-200">
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
                        placeholder={isSending ? "Sending..." : "Message..."}
                        disabled={disabled || isSending}
                        rows={1}
                        className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-500 outline-none dark:text-white custom-scrollbar disabled:opacity-50"
                    />
                </div>

                {/* Send Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSend}
                    disabled={!value.trim() || disabled || isSending}
                    className="p-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                >
                    {isSending ? (
                         <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </motion.button>
            </div>
        </div>
    );
}
