import React, { useRef, useEffect, useState, useCallback } from "react";
import { Send, Plus, Paperclip, Image as ImageIcon, MapPin, X, Mic, Square, Loader2 } from "lucide-react";
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
    // Voice input props
    voiceEnabled?: boolean;
    cooldownSeconds?: number;
    lastVoiceInputTime?: number;
    onVoiceTranscribed?: (text: string) => void;
};

export function ChatInput({ 
    value, 
    onChange, 
    onSend, 
    disabled, 
    replyingTo, 
    onCancelReply, 
    onLocation, 
    isSending,
    voiceEnabled = false,
    cooldownSeconds = 30,
    lastVoiceInputTime = 0,
    onVoiceTranscribed
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showMenu, setShowMenu] = useState(false);
    
    // Voice recording state
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    // Cooldown timer
    useEffect(() => {
        if (lastVoiceInputTime) {
            const elapsed = (Date.now() - lastVoiceInputTime) / 1000;
            const remaining = Math.max(0, cooldownSeconds - elapsed);
            setCooldownRemaining(Math.ceil(remaining));

            if (remaining > 0) {
                const timer = setInterval(() => {
                    const newElapsed = (Date.now() - lastVoiceInputTime) / 1000;
                    const newRemaining = Math.max(0, cooldownSeconds - newElapsed);
                    setCooldownRemaining(Math.ceil(newRemaining));
                    if (newRemaining <= 0) clearInterval(timer);
                }, 1000);
                return () => clearInterval(timer);
            }
        }
    }, [lastVoiceInputTime, cooldownSeconds]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const startRecording = useCallback(async () => {
        if (cooldownRemaining > 0) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await transcribeAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Recording timer (max 60s)
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 60) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    }, [cooldownRemaining]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        }
    }, [isRecording]);

    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current = null;
            audioChunksRef.current = [];
            setIsRecording(false);
            setRecordingTime(0);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        }
    }, [isRecording]);

    const transcribeAudio = async (audioBlob: Blob) => {
        setIsTranscribing(true);
        try {
            // Convert blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            
            const base64Audio = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
            });

            // Get auth token
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session?.access_token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ audio: base64Audio })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    alert(`Please wait ${data.retry_after || cooldownSeconds} seconds before recording again.`);
                } else {
                    throw new Error(data.error || 'Transcription failed');
                }
                return;
            }

            if (data.text) {
                // Populate the input with transcribed text for editing
                onChange(value ? `${value} ${data.text}` : data.text);
                onVoiceTranscribed?.(data.text);
            }
        } catch (error) {
            console.error('Transcription error:', error);
            alert('Voice transcription failed. Please try again.');
        } finally {
            setIsTranscribing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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

            {/* Recording UI */}
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="mx-4 mt-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-red-600 dark:text-red-400 font-medium">
                                Recording... {formatTime(recordingTime)}
                            </span>
                            <span className="text-red-400 dark:text-red-500 text-sm">
                                (max 60s)
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={cancelRecording}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-red-500" />
                            </button>
                            <button 
                                onClick={stopRecording}
                                className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                            >
                                <Square className="w-5 h-5 text-white fill-white" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transcribing indicator */}
            <AnimatePresence>
                {isTranscribing && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="mx-4 mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center gap-3"
                    >
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                            Transcribing your message...
                        </span>
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
                                {/* Voice Input Option */}
                                {voiceEnabled && (
                                    <button 
                                        onClick={() => { 
                                            setShowMenu(false); 
                                            startRecording();
                                        }}
                                        disabled={cooldownRemaining > 0 || isRecording || isTranscribing}
                                        className={`flex items-center gap-3 rounded-xl p-2 text-sm font-medium transition-colors ${
                                            cooldownRemaining > 0 || isRecording || isTranscribing
                                                ? 'opacity-50 cursor-not-allowed text-neutral-400'
                                                : 'hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200'
                                        }`}
                                    >
                                        <Mic className="h-4 w-4 text-green-500" /> 
                                        {cooldownRemaining > 0 ? `Voice (${cooldownRemaining}s)` : 'Voice'}
                                    </button>
                                )}
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
                        placeholder={isTranscribing ? "Transcribing..." : isSending ? "Sending..." : "Message..."}
                        disabled={disabled || isSending || isRecording || isTranscribing}
                        rows={1}
                        className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-500 outline-none dark:text-white custom-scrollbar disabled:opacity-50"
                    />
                </div>

                {/* Mic Button (quick access when voice enabled and no text) */}
                {voiceEnabled && !value.trim() && !isRecording && !isTranscribing && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startRecording}
                        disabled={cooldownRemaining > 0 || disabled}
                        className={`p-3 rounded-xl transition-all shadow-md ${
                            cooldownRemaining > 0 || disabled
                                ? 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600'
                        }`}
                        title={cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Record voice message'}
                    >
                        <Mic className="w-5 h-5 text-white" />
                    </motion.button>
                )}

                {/* Send Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSend}
                    disabled={!value.trim() || disabled || isSending || isRecording || isTranscribing}
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
