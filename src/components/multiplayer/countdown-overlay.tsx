"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMultiplayerStore } from "@/stores/multiplayer-store";

export function CountdownOverlay() {
    const phase = useMultiplayerStore((s) => s.phase);
    const countdownValue = useMultiplayerStore((s) => s.countdownValue);

    if (phase !== "countdown") return null;

    const text = countdownValue > 0 ? countdownValue.toString() : "GO!";
    const isGo = countdownValue === 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={text}
                    initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 1.8, opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                        duration: 0.5,
                    }}
                    className="flex flex-col items-center"
                >
                    <span
                        className={`font-extrabold uppercase ${isGo
                                ? "text-[8rem] leading-none gradient-text"
                                : "text-[10rem] leading-none text-white"
                            }`}
                        style={
                            !isGo
                                ? {
                                    textShadow: "0 0 60px oklch(0.65 0.2 265 / 0.6), 0 0 120px oklch(0.65 0.2 265 / 0.3)",
                                }
                                : undefined
                        }
                    >
                        {text}
                    </span>
                    {!isGo && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: 120 }}
                            className="mt-4 h-1 rounded-full bg-primary/50"
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
