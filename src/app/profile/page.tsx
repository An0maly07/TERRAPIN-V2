"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Trophy,
  Target,
  Flame,
  Gamepad2,
  Coins,
  TrendingUp,
  Calendar,
  MapPin,
  Star,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { usePlayerStore } from "@/stores/player-store";
import { useGameStore } from "@/stores/game-store";
import {
  levelProgress,
  xpForNextLevel,
  xpRequiredForLevel,
} from "@/lib/progression";
import { CAMPAIGN_COUNTRIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

// ── Animation variants ──────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const {
    level,
    totalXP,
    terraCredits,
    highestStreak,
    gamesPlayed,
    totalScore,
  } = usePlayerStore();

  const campaignProgress = useGameStore((s) => s.campaignProgress);

  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user || user.is_anonymous) return;
    const { data } = await supabase
      .from("profiles")
      .select("created_at, full_name, username")
      .eq("id", user.id)
      .single();
    if (data) {
      setMemberSince(data.created_at);
      setProfileName(data.full_name);
      setProfileUsername(data.username);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) loadProfile();
  }, [user, authLoading, router, loadProfile]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // ── Derived values ──
  const displayName =
    profileName || user.user_metadata?.full_name || (user.is_anonymous ? "Guest Explorer" : "Explorer");
  const displayUsername = profileUsername || (user.is_anonymous ? "guest" : null);
  const displayEmail = user.is_anonymous ? null : user.email;
  const initial = (displayName[0] || "U").toUpperCase();
  const avgScore = gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0;
  const progress = levelProgress(totalXP);
  const xpToNext = xpForNextLevel(level);
  const currentLevelXP = xpRequiredForLevel(level);
  const xpIntoLevel = totalXP - currentLevelXP;

  // Campaign data
  const campaignEntries = Object.entries(campaignProgress)
    .map(([id, data]) => {
      const country = CAMPAIGN_COUNTRIES.find((c) => c.id === id);
      return country ? { id, name: country.name, ...data } : null;
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    completed: number;
    highScore: number;
  }>;
  campaignEntries.sort((a, b) => b.highScore - a.highScore);

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 50, -30, 0], y: [0, -40, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 30, 0], y: [0, 30, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -right-40 -bottom-40 h-[600px] w-[600px] rounded-full bg-accent/10 blur-3xl"
        />
        <div className="absolute inset-0 bg-radial-[at_center] from-transparent to-black/40" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-3xl px-6 pt-10"
      >
        {/* Back button */}
        <motion.div variants={item}>
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </motion.div>

        {/* ── Profile Header ─────────────────────────────────────── */}
        <motion.div
          variants={item}
          className="glass mb-6 flex flex-col items-center gap-5 rounded-3xl p-8 text-center shadow-2xl shadow-black/30 sm:flex-row sm:text-left"
        >
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-4xl font-black text-white shadow-xl shadow-primary/25">
              {initial}
            </div>
            {/* Level badge on avatar */}
            <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-extrabold text-white shadow-lg shadow-amber-500/30">
              {level}
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="gradient-text">{displayName}</span>
            </h1>
            {displayUsername && (
              <p className="text-sm font-medium text-muted-foreground">
                @{displayUsername}
              </p>
            )}
            {displayEmail && (
              <p className="text-xs text-muted-foreground/70">
                {displayEmail}
              </p>
            )}
            {memberSince && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60 sm:justify-start">
                <Calendar size={12} />
                Member since {formatDate(memberSince)}
              </p>
            )}
          </div>
        </motion.div>

        {/* ── Level & XP Card ────────────────────────────────────── */}
        <motion.div
          variants={item}
          className="glass mb-6 rounded-3xl p-6 shadow-2xl shadow-black/30"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <TrendingUp size={16} className="text-primary" />
              Level Progress
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatNumber(totalXP)} total XP
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Current level */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-xl font-extrabold text-white shadow-lg shadow-primary/25">
              {level}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Level {level}</span>
                <span className="tabular-nums">
                  {level >= 100
                    ? "MAX LEVEL"
                    : `${xpIntoLevel.toLocaleString()} / ${(
                        xpToNext + xpIntoLevel
                      ).toLocaleString()} XP`}
                </span>
              </div>
              {/* XP Bar */}
              <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{
                    delay: 1.5,
                    duration: 0.6,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />
              </div>
            </div>

            {/* Next level */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-xl font-extrabold text-muted-foreground">
              {Math.min(level + 1, 100)}
            </div>
          </div>
        </motion.div>

        {/* ── Stats Grid ─────────────────────────────────────────── */}
        <motion.div
          variants={item}
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <StatCard
            icon={<Gamepad2 size={20} />}
            label="Games Played"
            value={gamesPlayed}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
            borderColor="border-blue-500/20"
          />
          <StatCard
            icon={<Trophy size={20} />}
            label="Total Score"
            value={formatNumber(totalScore)}
            color="text-amber-400"
            bgColor="bg-amber-500/10"
            borderColor="border-amber-500/20"
          />
          <StatCard
            icon={<Target size={20} />}
            label="Avg Score"
            value={formatNumber(avgScore)}
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
            borderColor="border-emerald-500/20"
          />
          <StatCard
            icon={<Flame size={20} />}
            label="Best Streak"
            value={highestStreak}
            color="text-orange-400"
            bgColor="bg-orange-500/10"
            borderColor="border-orange-500/20"
          />
        </motion.div>

        {/* ── TerraCredits ───────────────────────────────────────── */}
        <motion.div
          variants={item}
          className="glass mb-6 flex items-center justify-between rounded-3xl p-6 shadow-2xl shadow-black/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15">
              <Coins size={24} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                TerraCredits
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-amber-400">
                {terraCredits.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-400/80">
            In-game currency
          </div>
        </motion.div>

        {/* ── Campaign Progress ──────────────────────────────────── */}
        {campaignEntries.length > 0 && (
          <motion.div
            variants={item}
            className="glass rounded-3xl p-6 shadow-2xl shadow-black/30"
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Globe size={16} className="text-primary" />
              Campaign Progress
            </h2>

            <div className="space-y-2">
              {campaignEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-primary/70" />
                    <span className="text-sm font-semibold text-foreground">
                      {entry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Gamepad2 size={12} />
                      {entry.completed} {entry.completed === 1 ? "game" : "games"}
                    </span>
                    <span className="flex items-center gap-1 tabular-nums font-semibold text-amber-400">
                      <Star size={12} />
                      {formatNumber(entry.highScore)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div
      className={`glass flex flex-col items-center gap-2 rounded-2xl border p-5 shadow-lg shadow-black/20 ${borderColor}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgColor} ${color}`}
      >
        {icon}
      </div>
      <p className="text-xl font-extrabold tabular-nums text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
