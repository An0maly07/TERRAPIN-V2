"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/stores/game-store";

export function ShareButtons() {
  const [copied, setCopied] = useState(false);
  const score = useGameStore((s) => s.score);
  const rounds = useGameStore((s) => s.rounds);
  const mode = useGameStore((s) => s.mode);

  const generateShareText = () => {
    const scoreBlocks = rounds.map((r) => {
      const pct = r.score / 5000;
      if (pct >= 0.8) return "🟩";
      if (pct >= 0.5) return "🟨";
      if (pct >= 0.2) return "🟧";
      return "🟥";
    });

    return `TerraPin ${mode} — ${score.toLocaleString()} pts\n${scoreBlocks.join("")}\nPlay at terrapin.app`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" className="gap-2" onClick={handleCopy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied!" : "Copy Result"}
      </Button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() =>
            navigator.share({
              title: "TerraPin Score",
              text: generateShareText(),
            })
          }
        >
          <Share2 size={14} />
          Share
        </Button>
      )}
    </div>
  );
}
