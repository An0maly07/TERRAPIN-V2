"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAMPAIGN_COUNTRIES } from "@/lib/constants";
import { useGameStore } from "@/stores/game-store";
import type { CountryConfig } from "@/types/game";

// ── Region definitions ──────────────────────────────────────────────────────
const REGIONS = [
  { id: "all", label: "All" },
  { id: "africa", label: "Africa" },
  { id: "asia", label: "Asia" },
  { id: "europe", label: "Europe" },
  { id: "north-america", label: "N. America" },
  { id: "south-america", label: "S. America" },
  { id: "oceania", label: "Oceania" },
] as const;

type RegionId = (typeof REGIONS)[number]["id"];

// Map country IDs → region (derived from the comment sections in constants.ts)
const COUNTRY_REGION: Record<string, RegionId> = {};

// Africa
["algeria","angola","botswana","cameroon","dr-congo","egypt","ethiopia","ghana","ivory-coast","kenya","madagascar","mali","morocco","mozambique","namibia","nigeria","rwanda","senegal","south-africa","tanzania","tunisia","uganda","zambia","zimbabwe"]
  .forEach((id) => { COUNTRY_REGION[id] = "africa"; });

// Asia
["bangladesh","cambodia","china","india","indonesia","iran","iraq","israel","japan","jordan","kazakhstan","kyrgyzstan","laos","lebanon","malaysia","mongolia","myanmar","nepal","oman","pakistan","philippines","qatar","saudi-arabia","singapore","south-korea","sri-lanka","taiwan","thailand","turkey","uae","uzbekistan","vietnam"]
  .forEach((id) => { COUNTRY_REGION[id] = "asia"; });

// Europe
["albania","austria","belgium","bosnia","bulgaria","croatia","czechia","denmark","estonia","finland","france","germany","greece","hungary","iceland","ireland","italy","latvia","lithuania","luxembourg","montenegro","netherlands","north-macedonia","norway","poland","portugal","romania","russia","serbia","slovakia","slovenia","spain","sweden","switzerland","ukraine","uk"]
  .forEach((id) => { COUNTRY_REGION[id] = "europe"; });

// North America
["canada","costa-rica","cuba","dominican-republic","el-salvador","guatemala","honduras","jamaica","mexico","nicaragua","panama","puerto-rico","trinidad-tobago","usa"]
  .forEach((id) => { COUNTRY_REGION[id] = "north-america"; });

// South America
["argentina","bolivia","brazil","chile","colombia","ecuador","paraguay","peru","uruguay","venezuela"]
  .forEach((id) => { COUNTRY_REGION[id] = "south-america"; });

// Oceania
["australia","fiji","new-zealand","papua-new-guinea"]
  .forEach((id) => { COUNTRY_REGION[id] = "oceania"; });

// ── Country Card ────────────────────────────────────────────────────────────
function CountryCard({
  country,
  index,
}: {
  country: CountryConfig;
  index: number;
}) {
  const router = useRouter();
  const completed = useGameStore(
    (s) => s.campaignProgress[country.id]?.completed ?? 0
  );
  const highScore = useGameStore(
    (s) => s.campaignProgress[country.id]?.highScore ?? 0
  );

  const pct = Math.min(
    100,
    Math.round((completed / country.totalMaps) * 100)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        delay: Math.min(index * 0.02, 0.4),
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onClick={() =>
        router.push(`/game?mode=campaign&country=${country.id}`)
      }
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-card/60 px-4 py-3 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/25 hover:bg-card/80"
    >
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 transition-transform duration-200 group-hover:scale-110">
        <MapPin size={14} className="text-accent" />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-bold text-white">
            {country.name}
          </span>
          {highScore > 0 && (
            <span className="ml-2 flex shrink-0 items-center gap-1 text-[0.65rem] font-semibold text-amber-400/60">
              <Trophy size={10} />
              {highScore.toLocaleString()}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-[0.6rem] font-semibold tabular-nums text-white/30">
            {completed}/{country.totalMaps}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Campaign Selection ──────────────────────────────────────────────────────
export function CampaignSelection({ onBack }: { onBack: () => void }) {
  const [activeRegion, setActiveRegion] = useState<RegionId>("all");

  const filtered = useMemo(
    () =>
      activeRegion === "all"
        ? CAMPAIGN_COUNTRIES
        : CAMPAIGN_COUNTRIES.filter(
            (c) => COUNTRY_REGION[c.id] === activeRegion
          ),
    [activeRegion]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex w-full max-w-[920px] flex-col items-center text-white"
    >
      {/* Header */}
      <div className="mb-5 text-center">
        <h1 className="text-4xl font-extrabold italic uppercase tracking-wide">
          Campaign
        </h1>
        <div className="mx-auto mt-2 mb-2 h-[3px] w-[100px] rounded-sm bg-accent shadow-[0_0_12px_oklch(0.55_0.2_290_/_0.55)]" />
        <p className="text-xs font-semibold italic uppercase tracking-widest text-white/50">
          Select a region to deploy
        </p>
      </div>

      {/* Region tabs */}
      <div className="mb-4 flex flex-wrap justify-center gap-1.5">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveRegion(r.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-wider transition-all duration-200",
              activeRegion === r.id
                ? "bg-accent/20 text-accent shadow-[0_0_12px_oklch(0.55_0.2_290_/_0.15)]"
                : "text-white/40 hover:bg-white/[0.06] hover:text-white/60"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Scrollable country grid */}
      <div className="w-full overflow-y-auto overscroll-contain pr-1" style={{ maxHeight: "calc(100vh - 320px)" }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeRegion}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((country, i) => (
              <CountryCard key={country.id} country={country} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={onBack}
        className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white/50 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/70"
      >
        <ArrowLeft size={14} />
        Back to modes
      </motion.button>
    </motion.div>
  );
}
