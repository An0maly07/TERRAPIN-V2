"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DistanceMeterProps {
  distanceKm: number;
  score: number;
}

export function DistanceMeter({ distanceKm, score }: DistanceMeterProps) {
  const percentage = Math.min((score / 5000) * 100, 100);

  const getColor = () => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 20) return "bg-orange-500";
    return "bg-destructive";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {distanceKm < 1
            ? `${Math.round(distanceKm * 1000)} m`
            : `${Math.round(distanceKm).toLocaleString()} km`}
        </span>
        <span className="font-bold">{score.toLocaleString()} pts</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", getColor())}
        />
      </div>
    </div>
  );
}
