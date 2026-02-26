"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { VerticalNav } from "@/components/home/vertical-nav";
import { UserControls } from "@/components/home/user-controls";
import { GlobeView } from "@/components/home/globe-view";
import { SingleplayerSelection } from "@/components/home/singleplayer-selection";
import { MultiplayerSelection } from "@/components/home/multiplayer-selection";

export type LandingMode = "singleplayer" | "multiplayer" | "party" | null;

export default function Home() {
  const [activeMode, setActiveMode] = useState<LandingMode>(null);

  const handleModeChange = useCallback((mode: LandingMode) => {
    setActiveMode((prev) => (prev === mode ? null : mode));
  }, []);

  return (
    <div className="relative flex h-screen max-h-screen flex-col overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-accent/8 blur-3xl"
        />
        <div className="absolute inset-0 bg-radial-[at_center] from-transparent to-black/30" />
      </div>

      {/* Top-right User Controls */}
      <UserControls />

      {/* Main Content — always 2-column layout */}
      <main className="relative z-[1] flex flex-1 items-center justify-center overflow-hidden px-8">
        <div className="grid h-full w-full max-w-[1800px] grid-cols-[320px_1fr] items-center gap-10">
          {/* Left: Vertical Navigation */}
          <aside className="flex h-full flex-col">
            <VerticalNav activeMode={activeMode} onModeChange={handleModeChange} />
          </aside>

          {/* Right: Content Area */}
          <section className="flex h-full w-full flex-1 items-center justify-center pr-[60px]">
            {activeMode === "singleplayer" ? (
              <SingleplayerSelection />
            ) : activeMode === "multiplayer" ? (
              <MultiplayerSelection />
            ) : (
              <GlobeView />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
