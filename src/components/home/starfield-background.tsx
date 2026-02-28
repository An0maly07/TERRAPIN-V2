"use client";

/**
 * StarfieldBackground — animated canvas starfield with mouse interaction.
 * Renders transparent stars on top of the existing page background.
 */

import { useRef, useEffect, useCallback } from "react";
import type {
  StarfieldConfig,
  StarfieldEffects,
} from "@/hooks/use-starfield-config";
import { DEFAULT_STARFIELD_CONFIG } from "@/hooks/use-starfield-config";

// ── Types ────────────────────────────────────────────────────────────────────

type StarVariant = "dim" | "normal" | "bright";

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  vx: number;
  vy: number;
  variant: StarVariant;
  color: string;
}

interface MousePosition {
  x: number;
  y: number;
  active: boolean;
}

interface StarfieldBackgroundProps {
  config?: StarfieldConfig;
  effects?: StarfieldEffects;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STAR_COLORS = ["#ffffff", "#f0f4ff", "#e8f0ff", "#fff8f0", "#f0ffff"];

const ALPHA_RANGES: Record<StarVariant, [number, number]> = {
  dim: [0.15, 0.3],
  normal: [0.3, 0.5],
  bright: [0.5, 0.8],
};

const RADIUS_MULTIPLIERS: Record<StarVariant, [number, number]> = {
  dim: [0.5, 0.8],
  normal: [0.8, 1.2],
  bright: [1.2, 1.8],
};

const MOUSE_INFLUENCE_RADIUS = 250;
const MOUSE_ATTRACT_STRENGTH = 1.2;

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getRandomVariant(): StarVariant {
  const roll = Math.random();
  if (roll < 0.6) return "dim";
  if (roll < 0.9) return "normal";
  return "bright";
}

function createStar(w: number, h: number, cfg: StarfieldConfig): Star {
  const variant = getRandomVariant();
  const [aMin, aMax] = ALPHA_RANGES[variant];
  const [rMin, rMax] = RADIUS_MULTIPLIERS[variant];
  const baseRadius = randomRange(cfg.minRadius, cfg.maxRadius);
  const speed = randomRange(cfg.minSpeed, cfg.maxSpeed);
  const angle = Math.random() * Math.PI * 2;

  return {
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.min(baseRadius * randomRange(rMin, rMax), 2.5),
    alpha: randomRange(aMin, aMax),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    variant,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
  };
}

function initStars(w: number, h: number, cfg: StarfieldConfig): Star[] {
  return Array.from({ length: cfg.numStars }, () => createStar(w, h, cfg));
}

// ── Component ────────────────────────────────────────────────────────────────

export function StarfieldBackground({
  config = DEFAULT_STARFIELD_CONFIG,
  effects = {
    isPulsing: false,
    isZooming: false,
    isRepelling: false,
    speedMultiplier: 1.0,
  },
}: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef(0);
  const configRef = useRef(config);
  const effectsRef = useRef(effects);
  const mouseRef = useRef<MousePosition>({ x: 0, y: 0, active: false });

  useEffect(() => {
    configRef.current = config;
  }, [config]);
  useEffect(() => {
    effectsRef.current = effects;
  }, [effects]);

  // ── Draw a single star ──
  const drawStar = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      star: Star,
      glow: number,
      mouseDist: number
    ) => {
      ctx.save();

      let alphaBoost = 1.0;
      if (mouseDist < MOUSE_INFLUENCE_RADIUS && mouseDist > 0) {
        alphaBoost = 1 + (1 - mouseDist / MOUSE_INFLUENCE_RADIUS) * 0.5;
      }

      ctx.globalAlpha = Math.min(star.alpha * alphaBoost, 1);
      ctx.shadowBlur = glow * (star.variant === "bright" ? 1.5 : 1);
      ctx.shadowColor = star.color;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.fill();

      if (star.variant === "bright") {
        ctx.globalAlpha = star.alpha * alphaBoost * 0.3;
        ctx.shadowBlur = glow * 2;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },
    []
  );

  // ── Update star position ──
  const updateStar = useCallback(
    (
      star: Star,
      w: number,
      h: number,
      speed: number,
      zoom: boolean,
      repel: boolean,
      mouse: MousePosition
    ): number => {
      let mouseDist = Infinity;

      if (mouse.active) {
        const dx = star.x - mouse.x;
        const dy = star.y - mouse.y;
        mouseDist = Math.sqrt(dx * dx + dy * dy);

        if (mouseDist < MOUSE_INFLUENCE_RADIUS && mouseDist > 5) {
          const force =
            (1 - mouseDist / MOUSE_INFLUENCE_RADIUS) * MOUSE_ATTRACT_STRENGTH;
          const dir = repel ? 2 : -1;
          star.x += (dx / mouseDist) * force * dir;
          star.y += (dy / mouseDist) * force * dir;
        }
      }

      if (zoom) {
        const cx = w / 2,
          cy = h / 2;
        const dx = star.x - cx,
          dy = star.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        star.x += (dx / dist) * speed * 0.5;
        star.y += (dy / dist) * speed * 0.5;
      } else {
        star.x += star.vx * speed;
        star.y += star.vy * speed;
      }

      // Edge wrapping
      if (star.x < -star.radius) {
        star.x = w + star.radius;
        star.y = Math.random() * h;
      } else if (star.x > w + star.radius) {
        star.x = -star.radius;
        star.y = Math.random() * h;
      }
      if (star.y < -star.radius) {
        star.y = h + star.radius;
        star.x = Math.random() * w;
      } else if (star.y > h + star.radius) {
        star.y = -star.radius;
        star.x = Math.random() * w;
      }

      return mouseDist;
    },
    []
  );

  // ── Animation loop ──
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const cfg = configRef.current;
    const fx = effectsRef.current;
    const mouse = mouseRef.current;

    if (!cfg.enabled) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    const stars = starsRef.current;
    for (let i = 0; i < stars.length; i++) {
      const md = updateStar(
        stars[i],
        width,
        height,
        fx.speedMultiplier,
        fx.isZooming,
        fx.isRepelling,
        mouse
      );
      drawStar(ctx, stars[i], cfg.glowIntensity, md);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [drawStar, updateStar]);

  // ── Resize handler ──
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (
      Math.abs(starsRef.current.length - configRef.current.numStars) > 20 ||
      starsRef.current.length === 0
    ) {
      starsRef.current = initStars(
        canvas.width,
        canvas.height,
        configRef.current
      );
    }
  }, []);

  // ── Setup ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    starsRef.current = initStars(canvas.width, canvas.height, config);

    rafRef.current = requestAnimationFrame(animate);

    let resizeTimer: number;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 100);
    };
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.clearTimeout(resizeTimer);
    };
  }, [animate, config, handleResize]);

  if (!config.enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ imageRendering: "auto", transform: "translateZ(0)" }}
      aria-hidden="true"
    />
  );
}
