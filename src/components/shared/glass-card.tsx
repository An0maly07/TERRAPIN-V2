"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = true, onClick }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.03, y: -2 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        "glass rounded-xl p-6",
        hover && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
