"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Copy,
    Check,
    Settings,
    Play,
    LogOut,
    Users,
    Clock,
    Target,
    Loader2,
} from "lucide-react";
import { useMultiplayerStore } from "@/stores/multiplayer-store";
import { PlayerCard } from "./player-card";

export function LobbyScreen() {
    const lobbyCode = useMultiplayerStore((s) => s.lobbyCode);
    const players = useMultiplayerStore((s) => s.players);
    const settings = useMultiplayerStore((s) => s.settings);
    const isHost = useMultiplayerStore((s) => s.isHost);
    const error = useMultiplayerStore((s) => s.error);
    const startGame = useMultiplayerStore((s) => s.startGame);
    const leaveLobby = useMultiplayerStore((s) => s.leaveLobby);
    const updateSettings = useMultiplayerStore((s) => s.updateSettings);
    const phase = useMultiplayerStore((s) => s.phase);

    const [copied, setCopied] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    // Reset loading state when an error occurs or phase reverts to lobby
    useEffect(() => {
        if (error || phase === "lobby") {
            setIsStarting(false);
        }
    }, [error, phase]);

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(lobbyCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    const handleStart = () => {
        setIsStarting(true);
        startGame();
    };

    const ROUND_OPTIONS = [3, 5, 7];
    const TIME_OPTIONS = [30, 60, 120];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen w-full items-center justify-center overflow-y-auto p-4 sm:p-6"
        >
            <div className="w-full max-w-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 text-center sm:mb-8"
                >
                    <h1 className="text-3xl font-extrabold uppercase italic tracking-wide text-white sm:text-4xl">
                        Game Lobby
                    </h1>
                    <div className="mx-auto mt-2 h-[3px] w-[100px] rounded-sm bg-primary shadow-[0_0_12px_oklch(0.65_0.2_265_/_0.55)]" />
                </motion.div>

                {/* Party Code Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-4 flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:mb-6 sm:gap-3 sm:p-6"
                >
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/40 sm:text-[0.65rem]">
                        Party Code — Share with friends
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-2xl font-black tracking-[0.25em] text-white sm:text-4xl">
                            {lobbyCode}
                        </span>
                        <motion.button
                            onClick={copyCode}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white"
                        >
                            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </motion.button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                    {/* Players Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <Users size={15} className="text-primary" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
                                Players ({players.length})
                            </h3>
                        </div>
                        <div className="flex flex-col gap-2">
                            <AnimatePresence>
                                {players.map((player, i) => (
                                    <PlayerCard key={player.id} player={player} index={i} />
                                ))}
                            </AnimatePresence>
                            {players.length < 2 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center justify-center rounded-xl border border-dashed border-white/10 py-6 text-xs text-white/20"
                                >
                                    Waiting for players to join...
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Settings Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <Settings size={15} className="text-primary" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
                                Game Settings
                            </h3>
                        </div>

                        {/* Rounds Selector */}
                        <div className="mb-5">
                            <div className="mb-2 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">
                                <Target size={11} />
                                Rounds
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {ROUND_OPTIONS.map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => isHost && updateSettings({ rounds: r })}
                                        disabled={!isHost}
                                        className={`rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${settings.rounds === r
                                                ? "border border-primary/50 bg-primary/20 text-primary shadow-[0_0_12px_oklch(0.65_0.2_265_/_0.2)]"
                                                : "border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06]"
                                            } ${!isHost ? "cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Selector */}
                        <div className="mb-5">
                            <div className="mb-2 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">
                                <Clock size={11} />
                                Time per Round
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {TIME_OPTIONS.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => isHost && updateSettings({ timePerRound: t })}
                                        disabled={!isHost}
                                        className={`rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${settings.timePerRound === t
                                                ? "border border-primary/50 bg-primary/20 text-primary shadow-[0_0_12px_oklch(0.65_0.2_265_/_0.2)]"
                                                : "border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06]"
                                            } ${!isHost ? "cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        {t}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!isHost && (
                            <p className="mt-2 text-center text-[0.65rem] italic text-white/30">
                                Only the host can change settings
                            </p>
                        )}
                    </motion.div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="mt-4 text-center text-xs font-medium text-red-400"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mt-4 flex gap-3 sm:mt-6"
                >
                    <button
                        onClick={leaveLobby}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80"
                    >
                        <LogOut size={14} />
                        Leave
                    </button>

                    {isHost ? (
                        <button
                            onClick={handleStart}
                            disabled={players.length < 2 || isStarting}
                            className="shimmer flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-200 hover:shadow-[0_0_24px_oklch(0.65_0.2_265_/_0.45)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isStarting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading Locations...
                                </>
                            ) : (
                                <>
                                    <Play size={16} />
                                    Start Game
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="flex flex-1 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 text-xs font-bold italic uppercase tracking-wider text-white/30">
                            Waiting for host to start...
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
