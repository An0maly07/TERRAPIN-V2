"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface TerrapinLogoProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 20, text: "text-lg" },
  md: { icon: 28, text: "text-2xl" },
  lg: { icon: 48, text: "text-5xl" },
};

export function TerrapinLogo({ size = "md", animated = true, className }: TerrapinLogoProps) {
  const { icon, text } = sizes[size];

  const content = (
    <>
      <motion.div
        animate={animated ? { rotate: [0, -10, 10, -5, 0] } : undefined}
        transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
      >
        <MapPin size={icon} className="text-primary" strokeWidth={2.5} />
      </motion.div>
      <span className={cn(text, "font-bold tracking-tight gradient-text")}>
        TerraPin
      </span>
    </>
  );

  if (!animated) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {content}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 } as const}
      className={cn("flex items-center gap-2", className)}
    >
      {content}
    </motion.div>
  );
}
