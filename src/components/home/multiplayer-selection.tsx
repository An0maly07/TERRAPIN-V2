"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  Swords,
  UserPlus,
  ArrowLeft,
  Crown,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMultiplayerStore } from "@/stores/multiplayer-store";

/* ── Types ─────────────────────────────────────────────────── */

type View = "modes" | "lan";

interface MultiplayerModeConfig {
  id: string;
  phaseLabel: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badges: string[];
  cta: string;
  isPrimary: boolean;
  comingSoon?: boolean;
}

/* ── Mode Data ─────────────────────────────────────────────── */

const MULTIPLAYER_MODES: MultiplayerModeConfig[] = [
  {
    id: "lan",
    phaseLabel: "LOCAL NETWORK",
    title: "LAN Mode",
    icon: Wifi,
    description:
      "Play with friends on the same network. Host a private room and battle it out on shared WiFi — no account needed, just pure geography.",
    badges: ["UP TO 8 PLAYERS", "LOCAL NETWORK", "REALTIME"],
    cta: "SELECT",
    isPrimary: true,
    comingSoon: false,
  },
  {
    id: "duel",
    phaseLabel: "MODE 02",
    title: "Duel",
    icon: Swords,
    description:
      "Go head-to-head against a single opponent online. Race to pin the location first and claim victory round by round in ranked or casual play.",
    badges: ["1V1", "ONLINE", "RANKED"],
    cta: "FIND OPPONENT",
    isPrimary: false,
    comingSoon: true,
  },
];

/* ── Mode Card ─────────────────────────────────────────────── */

function MultiplayerCard({
  config,
  index,
  onClick,
}: {
  config: MultiplayerModeConfig;
  index: number;
  onClick?: () => void;
}) {
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.12,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onClick={config.comingSoon ? undefined : onClick}
      className={cn(
        "group relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300",
        "bg-card/75 shadow-[0_10px_40px_rgba(0,0,0,0.5)]",
        config.comingSoon
          ? "cursor-default opacity-80"
          : "cursor-pointer hover:-translate-y-1.5",
        config.isPrimary
          ? "border-primary/10 hover:border-primary/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_oklch(0.65_0.2_265_/_0.1)]"
          : "border-accent/10 hover:border-accent/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_oklch(0.55_0.2_290_/_0.07)]"
      )}
    >
      {config.comingSoon && (
        <div className="absolute top-4 right-4">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
            Coming Soon
          </span>
        </div>
      )}

      <div
        className={cn(
          "mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
          config.isPrimary ? "text-primary" : "text-accent"
        )}
      >
        <span
          className={cn(
            "block h-0.5 w-5",
            config.isPrimary ? "bg-primary" : "bg-accent"
          )}
        />
        {config.phaseLabel}
      </div>

      <div className="mb-3 flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300",
            !config.comingSoon && "group-hover:scale-110",
            config.isPrimary ? "bg-primary/15" : "bg-accent/15"
          )}
        >
          <Icon
            size={23}
            className={config.isPrimary ? "text-primary" : "text-accent"}
          />
        </div>
        <h2 className="text-[1.6rem] font-extrabold italic uppercase leading-tight text-white">
          {config.title}
        </h2>
      </div>

      <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-white/60">
        {config.description}
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {config.badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-white/15 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white/50"
          >
            {badge}
          </span>
        ))}
      </div>

      <button
        disabled={config.comingSoon}
        className={cn(
          "shimmer mt-auto w-full rounded-lg py-3 text-sm font-extrabold uppercase tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          config.comingSoon
            ? "cursor-not-allowed opacity-40"
            : "hover:scale-[1.02]",
          config.isPrimary
            ? "bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-[0_0_24px_oklch(0.65_0.2_265_/_0.45)]"
            : "border border-accent/60 bg-transparent text-accent hover:bg-accent/10"
        )}
        style={
          !config.isPrimary
            ? {
                boxShadow:
                  "0 0 15px oklch(0.55 0.2 290 / 0.15), inset 0 0 15px oklch(0.55 0.2 290 / 0.08)",
              }
            : undefined
        }
      >
        {config.comingSoon ? "IN DEVELOPMENT" : config.cta}
      </button>
    </motion.div>
  );
}

/* ── LAN Options View ──────────────────────────────────────── */

function LANOptionsView({ onBack }: { onBack: () => void }) {
  const [hostName, setHostName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const phase = useMultiplayerStore((s) => s.phase);
  const error = useMultiplayerStore((s) => s.error);
  const createLobby = useMultiplayerStore((s) => s.createLobby);
  const joinLobby = useMultiplayerStore((s) => s.joinLobby);
  const setMyName = useMultiplayerStore((s) => s.setMyName);

  const isCreating = phase === "creating";
  const isJoining = phase === "joining";
  const isBusy = isCreating || isJoining;

  const handleHost = () => {
    if (!hostName.trim() || isBusy) return;
    setMyName(hostName.trim());
    createLobby();
  };

  const handleJoin = () => {
    if (!joinName.trim() || !joinCode.trim() || isBusy) return;
    setMyName(joinName.trim());
    joinLobby(joinCode.trim());
  };

  return (
    <motion.div
      key="lan-options"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full"
    >
      {/* Back + Header */}
      <div className="mb-8 flex flex-col items-center">
        <button
          onClick={onBack}
          disabled={isBusy}
          className="mb-4 flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80 disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Wifi size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold italic uppercase tracking-wide text-white sm:text-4xl">
              LAN Mode
            </h2>
          </div>
        </div>
        <div className="mx-auto mt-2 h-[3px] w-[100px] rounded-sm bg-primary shadow-[0_0_12px_oklch(0.65_0.2_265_/_0.55)]" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/40">
          Host a new game or join an existing one
        </p>
      </div>

      {/* Error */}
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

      {/* Host + Join cards */}
      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
        {/* ── Host Card ──────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex flex-col rounded-2xl border border-primary/15 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Crown size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold uppercase tracking-wide text-white">
                Host Game
              </h3>
              <p className="text-[0.65rem] font-medium text-white/35">
                Create a lobby for friends
              </p>
            </div>
          </div>

          <div className="mb-4 flex-1">
            <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/40">
              Your Name
            </label>
            <input
              type="text"
              placeholder="Enter your name..."
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleHost()}
              maxLength={20}
              disabled={isBusy}
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleHost}
            disabled={!hostName.trim() || isBusy}
            className="shimmer flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-200 hover:shadow-[0_0_24px_oklch(0.65_0.2_265_/_0.45)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Crown size={16} />
                Host Game
              </>
            )}
          </button>
        </motion.div>

        {/* ── Join Card ──────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <UserPlus size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold uppercase tracking-wide text-white">
                Join Game
              </h3>
              <p className="text-[0.65rem] font-medium text-white/35">
                Enter a party code
              </p>
            </div>
          </div>

          <div className="mb-3 flex-1">
            <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/40">
              Your Name
            </label>
            <input
              type="text"
              placeholder="Enter your name..."
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={20}
              disabled={isBusy}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/40">
              Party Code
            </label>
            <input
              type="text"
              placeholder="TRP-XXXX"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={8}
              disabled={isBusy}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center font-mono text-lg font-bold uppercase tracking-[0.3em] text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!joinName.trim() || !joinCode.trim() || isBusy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-200 hover:shadow-[0_0_24px_rgba(16,185,129,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
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
      </div>
    </motion.div>
  );
}

/* ── Main Component ────────────────────────────────────────── */

export function MultiplayerSelection() {
  const router = useRouter();
  const [view, setView] = useState<View>("modes");

  const phase = useMultiplayerStore((s) => s.phase);

  // Navigate to multiplayer game page when lobby is created/joined
  useEffect(() => {
    if (phase === "lobby" || phase === "countdown" || phase === "guessing") {
      router.push("/game/multiplayer");
    }
  }, [phase, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex w-full max-w-[800px] flex-col items-center text-white"
    >
      <AnimatePresence mode="wait">
        {view === "modes" ? (
          <motion.div
            key="modes"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex w-full flex-col items-center"
          >
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-balance text-5xl font-extrabold italic uppercase tracking-wide">
                Multiplayer
              </h1>
              <div className="mx-auto mt-2 mb-3 h-[3px] w-[120px] rounded-sm bg-accent shadow-[0_0_12px_oklch(0.55_0.2_290_/_0.55)]" />
              <p className="text-xs font-semibold italic uppercase tracking-widest text-white/50">
                Challenge friends &amp; rivals
              </p>
            </div>

            {/* Mode cards grid */}
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
              {MULTIPLAYER_MODES.map((mode, i) => (
                <MultiplayerCard
                  key={mode.id}
                  config={mode}
                  index={i}
                  onClick={() => {
                    if (mode.id === "lan") setView("lan");
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <LANOptionsView onBack={() => setView("modes")} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
