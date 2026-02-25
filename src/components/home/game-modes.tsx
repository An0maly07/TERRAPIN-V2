"use client";

import { motion } from "framer-motion";
import { GameModeCard } from "./game-mode-card";
import { GAME_MODES } from "@/lib/constants";

export function GameModes() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center text-2xl font-bold sm:text-3xl"
      >
        Choose Your Mode
      </motion.h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_MODES.map((mode, i) => (
          <motion.div
            key={mode.id}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
          >
            <GameModeCard config={mode} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
