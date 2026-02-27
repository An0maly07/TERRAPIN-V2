"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home, Crown, Medal } from "lucide-react";
import { useMultiplayerStore } from "@/stores/multiplayer-store";

const PODIUM_COLORS = [
    { bg: "from-amber-500/30 to-amber-600/10", border: "border-amber-500/40", text: "text-amber-400", glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]" },
    { bg: "from-gray-400/20 to-gray-500/5", border: "border-gray-400/30", text: "text-gray-300", glow: "" },
    { bg: "from-orange-700/20 to-orange-800/5", border: "border-orange-600/30", text: "text-orange-400", glow: "" },
];

export function MatchSummary() {
    const router = useRouter();
    const leaderboard = useMultiplayerStore((s) => s.leaderboard);
    const isHost = useMultiplayerStore((s) => s.isHost);
    const leaveLobby = useMultiplayerStore((s) => s.leaveLobby);
    const returnToLobby = useMultiplayerStore((s) => s.returnToLobby);

    const podium = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    const handleReturnHome = () => {
        leaveLobby();
        router.push("/");
    };

    const handlePlayAgain = () => {
        // Return to lobby with same players for a rematch
        returnToLobby();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[oklch(0.10_0.02_260)]"
        >
            <div className="w-full max-w-2xl px-6 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10 text-center"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                    >
                        <Trophy size={40} className="text-amber-400" />
                    </motion.div>
                    <h1 className="text-4xl font-extrabold italic uppercase tracking-wide text-white">
                        Match Complete
                    </h1>
                    <div className="mx-auto mt-2 h-[3px] w-[120px] rounded-sm bg-gradient-to-r from-amber-500 to-primary" />
                </motion.div>

                {/* Podium */}
                <div className="mb-8 flex items-end justify-center gap-4">
                    {/* 2nd place */}
                    {podium[1] && (
                        <PodiumCard entry={podium[1]} place={2} delay={0.6} height="h-[180px]" />
                    )}
                    {/* 1st place */}
                    {podium[0] && (
                        <PodiumCard entry={podium[0]} place={1} delay={0.4} height="h-[220px]" />
                    )}
                    {/* 3rd place */}
                    {podium[2] && (
                        <PodiumCard entry={podium[2]} place={3} delay={0.8} height="h-[150px]" />
                    )}
                </div>

                {/* Rest of leaderboard */}
                {rest.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                        {rest.map((entry, i) => (
                            <div
                                key={entry.playerId}
                                className="flex items-center gap-3 border-b border-white/[0.04] py-3 last:border-0"
                            >
                                <span className="w-8 text-center text-sm font-bold text-white/30">
                                    #{entry.rank}
                                </span>
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: entry.avatarColor }}
                                >
                                    {entry.playerName.charAt(0).toUpperCase()}
                                </div>
                                <span className="flex-1 text-sm font-semibold text-white/70">
                                    {entry.playerName}
                                </span>
                                <span className="font-mono text-sm font-bold text-white/50">
                                    {entry.totalScore.toLocaleString()} pts
                                </span>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="flex gap-3"
                >
                    <button
                        onClick={handleReturnHome}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80"
                    >
                        <Home size={14} />
                        Main Menu
                    </button>
                    <button
                        onClick={handlePlayAgain}
                        className="shimmer flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-200 hover:shadow-[0_0_24px_oklch(0.65_0.2_265_/_0.45)]"
                    >
                        <RotateCcw size={16} />
                        Play Again
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
}

/* ── Podium Card ──────────────────────────────────────────── */

function PodiumCard({
    entry,
    place,
    delay,
    height,
}: {
    entry: { playerId: string; playerName: string; avatarColor: string; totalScore: number };
    place: 1 | 2 | 3;
    delay: number;
    height: string;
}) {
    const colors = PODIUM_COLORS[place - 1];
    const isFirst = place === 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
            className={`flex w-[160px] flex-col items-center rounded-2xl border bg-gradient-to-b p-5 ${height} ${colors.bg} ${colors.border} ${colors.glow}`}
        >
            {/* Crown or medal */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.3, type: "spring" }}
                className="mb-2"
            >
                {isFirst ? (
                    <Crown size={28} className="text-amber-400" />
                ) : (
                    <Medal size={24} className={colors.text} />
                )}
            </motion.div>

            {/* Avatar */}
            <div
                className={`mb-2 flex items-center justify-center rounded-full text-lg font-bold text-white ${isFirst ? "h-14 w-14" : "h-11 w-11"
                    }`}
                style={{ backgroundColor: entry.avatarColor }}
            >
                {entry.playerName.charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <span
                className={`mb-1 text-center text-sm font-bold ${isFirst ? "text-white" : "text-white/80"}`}
            >
                {entry.playerName}
            </span>

            {/* Rank */}
            <span className={`text-xs font-extrabold uppercase ${colors.text}`}>
                {place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"}
            </span>

            {/* Score */}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.5 }}
                className="mt-auto font-mono text-lg font-black text-white"
            >
                {entry.totalScore.toLocaleString()}
            </motion.span>
        </motion.div>
    );
}
