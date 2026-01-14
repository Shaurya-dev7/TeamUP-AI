import React, { useRef, useEffect, useState, useCallback } from "react";
import { Send, Plus, Paperclip, Image as ImageIcon, MapPin, X, Mic, MicOff, Loader2, Smile } from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from "framer-motion";

// Declare SpeechRecognition types for TypeScript
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

type ChatInputProps = {
    value: string;
    onChange: (val: string) => void;
    onSend: (inputMethod?: 'keyboard' | 'voice') => void;
    disabled?: boolean;
    replyingTo?: { sender: string, content: string } | null;
    onCancelReply?: () => void;
    onLocation?: () => void;
    isSending?: boolean;
};

export function ChatInput({ 
    value, 
    onChange, 
    onSend, 
    disabled, 
    replyingTo, 
    onCancelReply, 
    onLocation, 
    isSending
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const onEmojiClick = (emojiData: EmojiClickData) => {
        onChange(value ? value + emojiData.emoji : emojiData.emoji);
        // Optional: keep picker open or close it. Keeping it open for multiple emojis often feels better.
    };
    
    // Voice input state
    const [isListening, setIsListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [lastVoiceTime, setLastVoiceTime] = useState(0);
    const [interimTranscript, setInterimTranscript] = useState("");
    const [permissionDenied, setPermissionDenied] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const listenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const COOLDOWN_SECONDS = 30;
    const MAX_LISTEN_SECONDS = 60;

    // Check browser support on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setVoiceSupported(!!SpeechRecognition);
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    // Cooldown timer
    useEffect(() => {
        if (lastVoiceTime > 0) {
            const updateCooldown = () => {
                const elapsed = (Date.now() - lastVoiceTime) / 1000;
                const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
                setCooldownRemaining(Math.ceil(remaining));
                
                if (remaining > 0) {
                    requestAnimationFrame(updateCooldown);
                }
            };
            updateCooldown();
        }
    }, [lastVoiceTime]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend('keyboard');
        }
    };

    const startListening = useCallback(() => {
        if (cooldownRemaining > 0 || isListening) return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setInterimTranscript("");
            setPermissionDenied(false);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }

            setInterimTranscript(interim);
            
            if (final) {
                // Append final transcript to input
                onChange(value ? `${value} ${final}`.trim() : final.trim());
                setInterimTranscript("");
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            
            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                setPermissionDenied(true);
            }
            
            setIsListening(false);
            setInterimTranscript("");
        };

        recognition.onend = () => {
            setIsListening(false);
            setLastVoiceTime(Date.now());
            if (listenTimeoutRef.current) {
                clearTimeout(listenTimeoutRef.current);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();

        // Auto-stop after MAX_LISTEN_SECONDS
        listenTimeoutRef.current = setTimeout(() => {
            stopListening();
        }, MAX_LISTEN_SECONDS * 1000);

    }, [cooldownRemaining, isListening, value, onChange]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (listenTimeoutRef.current) {
            clearTimeout(listenTimeoutRef.current);
        }
    }, []);

    const cancelListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }
        setIsListening(false);
        setInterimTranscript("");
        if (listenTimeoutRef.current) {
            clearTimeout(listenTimeoutRef.current);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            if (listenTimeoutRef.current) {
                clearTimeout(listenTimeoutRef.current);
            }
        };
    }, []);

    const handleSend = () => {
        // Track if this message was from voice input
        const wasVoiceInput = lastVoiceTime > 0 && (Date.now() - lastVoiceTime) < (COOLDOWN_SECONDS * 1000);
        onSend(wasVoiceInput ? 'voice' : 'keyboard');
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

            {/* Permission Denied Warning */}
            <AnimatePresence>
                {permissionDenied && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400"
                    >
                        🎤 Enable microphone access to use voice input
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative flex items-end gap-2 p-4 pt-2">
                {/* Magic Menu (Attachments) */}
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
                        className={`flex h-[44px] w-[44px] items-center justify-center rounded-full transition-colors ${showMenu ? 'bg-neutral-200 dark:bg-white/20' : 'bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10'}`}
                    >
                        <Plus className={`h-5 w-5 text-neutral-600 dark:text-neutral-300 transition-transform duration-300 ${showMenu ? 'rotate-45' : ''}`} />
                    </motion.button>

                    {/* Emoji Picker Toggle */}
                    <div className="relative">
                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: -10 }}
                                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                    className="absolute bottom-full left-0 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden"
                                >
                                    <EmojiPicker 
                                        onEmojiClick={onEmojiClick}
                                        theme={Theme.AUTO}
                                        lazyLoadEmojis={true}
                                        width={320}
                                        height={400}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`flex h-[44px] w-[44px] items-center justify-center rounded-full transition-colors ml-2 ${showEmojiPicker ? 'bg-yellow-100 dark:bg-yellow-400/20' : 'bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10'}`}
                        >
                            <Smile className={`h-5 w-5 ${showEmojiPicker ? 'text-yellow-600 dark:text-yellow-400' : 'text-neutral-600 dark:text-neutral-300'}`} />
                        </motion.button>
                    </div>
                </div>

                {/* Input Area */}
                <div className="flex-1 rounded-[24px] border border-neutral-200 bg-white/80 p-1 shadow-sm focus-within:ring-2 focus-within:ring-yellow-400/50 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/60 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {isListening ? (
                            // Listening UI
                            <motion.div
                                key="listening"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between px-4 py-3 min-h-[44px]"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Cancel Button */}
                                    <button 
                                        onClick={cancelListening}
                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4 text-red-500" />
                                    </button>
                                    
                                    {/* Listening indicator */}
                                    <div className="flex items-center gap-2">
                                        <motion.div 
                                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
                                        />
                                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                            Listening...
                                        </span>
                                    </div>

                                    {/* Live transcript preview */}
                                    {interimTranscript && (
                                        <span className="text-sm text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">
                                            {interimTranscript}
                                        </span>
                                    )}
                                </div>

                                {/* Waveform animation */}
                                <div className="flex items-center gap-0.5 h-6 mr-2">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: ['8px', '20px', '8px'] }}
                                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                            className="w-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-full"
                                        />
                                    ))}
                                </div>

                                {/* Stop Button */}
                                <button 
                                    onClick={stopListening}
                                    className="p-2 bg-green-500 hover:bg-green-600 rounded-full transition-colors shadow-lg"
                                >
                                    <MicOff className="w-4 h-4 text-white" />
                                </button>
                            </motion.div>
                        ) : (
                            // Normal text input
                            <motion.div
                                key="input"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Mic Button - only show if supported and not listening */}
                {voiceSupported && !isListening && (
                    <motion.button
                        whileHover={{ scale: cooldownRemaining > 0 ? 1 : 1.05 }}
                        whileTap={{ scale: cooldownRemaining > 0 ? 1 : 0.95 }}
                        onClick={startListening}
                        disabled={cooldownRemaining > 0 || disabled}
                        className={`relative p-3 rounded-xl transition-all shadow-md ${
                            cooldownRemaining > 0 || disabled
                                ? 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'
                                : 'bg-gradient-to-br from-green-400 to-green-500 hover:from-green-500 hover:to-green-600'
                        }`}
                        title={cooldownRemaining > 0 ? `Voice available in ${cooldownRemaining}s` : 'Start voice input'}
                    >
                        <Mic className={`w-5 h-5 ${cooldownRemaining > 0 ? 'text-neutral-500' : 'text-white'}`} />
                        {cooldownRemaining > 0 && (
                            <span className="absolute -top-1 -right-1 bg-neutral-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {cooldownRemaining}
                            </span>
                        )}
                    </motion.button>
                )}

                {/* Send Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!value.trim() || disabled || isSending || isListening}
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
