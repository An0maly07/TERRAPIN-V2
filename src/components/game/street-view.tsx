"use client";

import { motion } from "framer-motion";
import { Camera, Compass, Maximize2 } from "lucide-react";

export function StreetView() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[oklch(0.1_0.02_260)]">
      {/* Placeholder grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Placeholder content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-4 text-muted-foreground"
      >
        <div className="glass flex h-20 w-20 items-center justify-center rounded-full">
          <Camera size={32} className="text-primary/60" />
        </div>
        <p className="text-sm font-medium">Street View</p>
        <p className="max-w-xs text-center text-xs text-muted-foreground/60">
          Explore the panoramic view and guess your location on the map
        </p>
      </motion.div>

      {/* Compass overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 right-4 flex flex-col gap-2"
      >
        <button className="glass flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground">
          <Compass size={18} />
        </button>
        <button className="glass flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground">
          <Maximize2 size={18} />
        </button>
      </motion.div>
    </div>
  );
}
