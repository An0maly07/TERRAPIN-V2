"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/game-store";

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
}

const COLORS = ["#818cf8", "#a78bfa", "#c084fc", "#f472b6", "#34d399", "#fbbf24"];

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useGameStore((s) => s.phase);
  const rounds = useGameStore((s) => s.rounds);
  const lastRound = rounds[rounds.length - 1];

  const shouldFire = phase === "result" && lastRound && lastRound.score >= 3000;

  useEffect(() => {
    if (!shouldFire || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];

    // Create burst
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 3,
        vx: (Math.random() - 0.5) * 15,
        vy: Math.random() * -12 - 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 1,
      });
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
        p.vy += 0.25; // gravity
        p.rotation += p.rotationSpeed;
        p.life -= 0.008;
        p.vx *= 0.99;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (alive) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [shouldFire]);

  if (!shouldFire) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
