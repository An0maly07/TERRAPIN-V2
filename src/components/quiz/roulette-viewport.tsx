"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface RouletteViewportProps {
  children: React.ReactNode;
  className?: string;
}

export const RouletteViewport = forwardRef<
  HTMLDivElement,
  RouletteViewportProps
>(({ children, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative w-full overflow-hidden", className)}
    >
      {/* Center indicator line */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-10 w-[2px] -translate-x-1/2">
        <div className="h-full w-full bg-amber-400 shadow-[0_0_12px_oklch(0.8_0.15_85_/_0.6),0_0_24px_oklch(0.8_0.15_85_/_0.3)]" />
        {/* Top triangle */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <div className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-amber-400" />
        </div>
        {/* Bottom triangle */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <div className="h-0 w-0 border-x-[6px] border-b-[8px] border-x-transparent border-b-amber-400" />
        </div>
      </div>

      {/* Left edge fade */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-24 bg-gradient-to-r from-[oklch(0.13_0.02_260)] to-transparent" />

      {/* Right edge fade */}
      <div className="pointer-events-none absolute top-0 bottom-0 right-0 z-10 w-24 bg-gradient-to-l from-[oklch(0.13_0.02_260)] to-transparent" />

      {/* Track container */}
      <div className="flex items-center py-6">{children}</div>
    </div>
  );
});
RouletteViewport.displayName = "RouletteViewport";
