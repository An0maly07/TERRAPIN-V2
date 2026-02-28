"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import type { ProgressionReward } from "@/types/profile";

interface LevelUpOverlayProps {
  reward: ProgressionReward | null;
}

// Golden / celebratory palette
const CONFETTI_COLORS = [
  "#fbbf24", // amber-400
  "#f59e0b", // amber-500
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#c084fc", // purple-400
  "#34d399", // emerald-400
  "#f472b6", // pink-400
  "#ffffff", // white sparkle
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  shape: "rect" | "circle";
}

export function LevelUpOverlay({ reward }: LevelUpOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showBanner, setShowBanner] = useState(false);
  const hasFiredRef = useRef(false);

  const shouldFire = reward?.didLevelUp === true;

  // Canvas confetti burst
  useEffect(() => {
    if (!shouldFire || hasFiredRef.current || !canvasRef.current) return;
    hasFiredRef.current = true;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.35;

    // Create a big burst from center
    for (let i = 0; i < 120; i++) {
      const angle = (Math.PI * 2 * i) / 120 + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 14 + 4;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 10 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        life: 1,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }

    // Side cannons
    for (let side = 0; side < 2; side++) {
      const originX = side === 0 ? canvas.width * 0.1 : canvas.width * 0.9;
      const dirX = side === 0 ? 1 : -1;
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: originX,
          y: canvas.height * 0.7,
          vx: dirX * (Math.random() * 8 + 3),
          vy: -(Math.random() * 16 + 6),
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: Math.random() * 8 + 3,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15,
          life: 1,
          shape: Math.random() > 0.4 ? "rect" : "circle",
        });
      }
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.rotation += p.rotationSpeed;
        p.life -= 0.006;
        p.vx *= 0.99;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (alive) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    // Show the text banner after a short delay
    const bannerTimer = setTimeout(() => setShowBanner(true), 300);
    // Auto-dismiss the banner
    const dismissTimer = setTimeout(() => setShowBanner(false), 3500);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(bannerTimer);
      clearTimeout(dismissTimer);
    };
  }, [shouldFire]);

  // Reset the fired ref when reward clears (new game)
  useEffect(() => {
    if (!reward) {
      hasFiredRef.current = false;
      setShowBanner(false);
    }
  }, [reward]);

  if (!shouldFire) return null;

  return (
    <>
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[60]"
      />

      {/* Level-up text banner */}
      <AnimatePresence>
        {showBanner && reward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="pointer-events-none fixed inset-x-0 top-[20%] z-[61] flex flex-col items-center gap-2"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Star size={40} className="fill-amber-400 text-amber-400 drop-shadow-lg" />
            </motion.div>
            <motion.h2
              initial={{ letterSpacing: "0.3em", opacity: 0 }}
              animate={{ letterSpacing: "0.1em", opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_12px_rgba(251,191,36,0.5)]"
            >
              Level Up!
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="flex items-center gap-3 rounded-2xl bg-black/60 px-6 py-2 backdrop-blur-sm"
            >
              <span className="text-lg font-bold text-muted-foreground">
                Lv.{reward.previousLevel}
              </span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: 2, duration: 0.4, delay: 0.7 }}
                className="text-xl text-amber-400"
              >
                →
              </motion.span>
              <span className="text-2xl font-extrabold gradient-text">
                Lv.{reward.newLevel}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
