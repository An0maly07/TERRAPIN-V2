"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Loader2, Users } from "lucide-react";
import { useMultiplayerStore } from "@/stores/multiplayer-store";

interface JoinDialogProps {
    open: boolean;
    onClose: () => void;
}

export function JoinDialog({ open, onClose }: JoinDialogProps) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const joinLobby = useMultiplayerStore((s) => s.joinLobby);
    const setMyName = useMultiplayerStore((s) => s.setMyName);
    const phase = useMultiplayerStore((s) => s.phase);
    const error = useMultiplayerStore((s) => s.error);

    const isJoining = phase === "joining";

    // Auto-close dialog when successfully joined lobby
    useEffect(() => {
        if (open && phase === "lobby") {
            onClose();
        }
    }, [open, phase, onClose]);

    const handleJoin = () => {
        if (!name.trim() || !code.trim()) return;
        setMyName(name.trim());
        joinLobby(code.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleJoin();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[oklch(0.14_0.025_260)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
                        >
                            <X size={18} />
                        </button>

                        {/* Header */}
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15">
                                <Users size={28} className="text-primary" />
                            </div>
                            <h2 className="text-xl font-extrabold uppercase tracking-wide text-white">
                                Join Game
                            </h2>
                            <p className="mt-1 text-xs text-white/40">
                                Enter your name and the party code
                            </p>
                        </div>

                        {/* Name input */}
                        <div className="mb-4">
                            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-widest text-white/40">
                                Your Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your name..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                maxLength={20}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                        </div>

                        {/* Code input */}
                        <div className="mb-6">
                            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-widest text-white/40">
                                Party Code
                            </label>
                            <input
                                type="text"
                                placeholder="TRP-XXXX"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                onKeyDown={handleKeyDown}
                                maxLength={8}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center font-mono text-lg font-bold uppercase tracking-[0.3em] text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                        </div>

                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="mb-4 text-center text-xs font-medium text-red-400"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Join button */}
                        <button
                            onClick={handleJoin}
                            disabled={!name.trim() || !code.trim() || isJoining}
                            className="shimmer flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-200 hover:shadow-[0_0_24px_oklch(0.65_0.2_265_/_0.45)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isJoining ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    Join Game
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
