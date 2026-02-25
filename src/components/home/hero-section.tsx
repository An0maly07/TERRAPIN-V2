"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerrapinLogo } from "@/components/shared/terrapin-logo";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 pt-16 text-center">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 20, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="relative mb-8"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center opacity-10"
          >
            <Globe size={200} strokeWidth={0.5} />
          </motion.div>
          <TerrapinLogo size="lg" animated />
        </div>
      </motion.div>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative mb-4 max-w-lg text-lg text-muted-foreground sm:text-xl"
      >
        Drop into a random location. Look around. Pin it on the map.
        How well do you know the world?
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative flex gap-4"
      >
        <Link href="/game">
          <Button
            size="lg"
            className="gap-2 bg-[var(--gradient-primary)] text-lg font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
            style={{ background: "var(--gradient-primary)" }}
          >
            Play Now
            <ArrowRight size={20} />
          </Button>
        </Link>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-8 w-5 rounded-full border-2 border-muted-foreground/30 p-1"
        >
          <motion.div className="mx-auto h-2 w-1 rounded-full bg-muted-foreground/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
