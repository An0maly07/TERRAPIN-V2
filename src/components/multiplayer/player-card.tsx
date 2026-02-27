"use client";

import { motion } from "framer-motion";
import type { LobbyPlayer } from "@/types/multiplayer";
import { Crown, Wifi, WifiOff } from "lucide-react";

interface PlayerCardProps {
    player: LobbyPlayer;
    index: number;
}

export function PlayerCard({ player, index }: PlayerCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.08, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 transition-all duration-200 hover:bg-white/[0.06]"
        >
            {/* Avatar */}
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: player.avatarColor }}
            >
                {player.name.charAt(0).toUpperCase()}
            </div>

            {/* Name + badges */}
            <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{player.name}</span>
                    {player.isHost && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-amber-400">
                            <Crown size={9} />
                            Host
                        </span>
                    )}
                </div>
                <span className="text-[0.65rem] font-medium text-white/30">
                    {player.score > 0 ? `${player.score.toLocaleString()} pts` : "Ready"}
                </span>
            </div>

            {/* Connection status */}
            <div className="shrink-0">
                {player.connected ? (
                    <Wifi size={14} className="text-emerald-400/60" />
                ) : (
                    <WifiOff size={14} className="text-red-400/60" />
                )}
            </div>
        </motion.div>
    );
}
