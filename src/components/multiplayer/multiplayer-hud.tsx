"use client";

import { motion } from "framer-motion";
import { useMultiplayerStore } from "@/stores/multiplayer-store";
import { Check, Clock } from "lucide-react";

/**
 * In-game HUD showing player guess status alongside the existing GameHUD.
 * Positioned at the top-left below the main HUD bar.
 */
export function MultiplayerHUD() {
    const players = useMultiplayerStore((s) => s.players);
    const currentRound = useMultiplayerStore((s) => s.currentRound);
    const totalRounds = useMultiplayerStore((s) => s.totalRounds);
    const roundTimeLeft = useMultiplayerStore((s) => s.roundTimeLeft);
    const phase = useMultiplayerStore((s) => s.phase);

    if (phase !== "guessing") return null;

    const minutes = Math.floor(roundTimeLeft / 60);
    const seconds = roundTimeLeft % 60;
    const isLowTime = roundTimeLeft <= 10;

    return (
        <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="glass flex items-center justify-between px-4 py-2 sm:px-6"
        >
            {/* Left: Round info */}
            <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/70">
                    Round {currentRound}/{totalRounds}
                </span>
            </div>

            {/* Center: Timer */}
            <motion.div
                animate={isLowTime ? { scale: [1, 1.1, 1] } : undefined}
                transition={isLowTime ? { duration: 0.5, repeat: Infinity } : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-sm font-bold ${isLowTime
                        ? "border border-red-400/40 bg-red-500/15 text-red-400"
                        : "border border-white/10 bg-white/[0.04] text-white/70"
                    }`}
            >
                <Clock size={13} />
                {minutes}:{seconds.toString().padStart(2, "0")}
            </motion.div>

            {/* Right: Player status indicators — scrollable on overflow */}
            <div className="flex items-center gap-1.5 overflow-x-auto sm:gap-2">
                {players.map((player) => (
                    <motion.div
                        key={player.id}
                        className="flex shrink-0 items-center gap-1"
                        title={`${player.name}${player.hasGuessed ? " — guessed!" : ""}`}
                    >
                        <div
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[0.55rem] font-bold text-white sm:h-7 sm:w-7 sm:text-[0.6rem]"
                            style={{ backgroundColor: player.avatarColor }}
                        >
                            {player.hasGuessed ? (
                                <Check size={11} strokeWidth={3} />
                            ) : (
                                player.name.charAt(0).toUpperCase()
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
