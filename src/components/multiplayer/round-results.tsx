"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Trophy, ArrowRight, Clock } from "lucide-react";
import { useMultiplayerStore } from "@/stores/multiplayer-store";
import { loadGoogleMaps } from "@/lib/google-maps";
import { formatDistance } from "@/lib/geo";

export function RoundResults() {
    const roundResults = useMultiplayerStore((s) => s.roundResults);
    const leaderboard = useMultiplayerStore((s) => s.leaderboard);
    const currentRound = useMultiplayerStore((s) => s.currentRound);
    const totalRounds = useMultiplayerStore((s) => s.totalRounds);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const [countdown, setCountdown] = useState(12);

    // Countdown timer for next round
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) { clearInterval(interval); return 0; }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Initialize Google Map with result markers
    useEffect(() => {
        if (!roundResults || !mapContainerRef.current) return;
        let cancelled = false;

        (async () => {
            await loadGoogleMaps();
            if (cancelled || !mapContainerRef.current) return;

            const map = new google.maps.Map(mapContainerRef.current, {
                center: { lat: roundResults.actualPosition.lat, lng: roundResults.actualPosition.lng },
                zoom: 3,
                disableDefaultUI: true,
                gestureHandling: "cooperative",
                styles: [
                    { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
                ],
            });
            mapRef.current = map;

            // Actual location marker (green flag)
            const flagPath = "M -1,10 L -1,-8 L 10,-8 L 5,-4 L 10,0 L -1,0 L -1,10 Z";
            new google.maps.Marker({
                position: roundResults.actualPosition,
                map,
                icon: {
                    path: flagPath,
                    scale: 1.8,
                    fillColor: "#22c55e",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                    anchor: new google.maps.Point(0, 10),
                },
                title: "Actual Location",
                zIndex: 1000,
            });

            // Player guess markers + polylines
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(roundResults.actualPosition);

            for (const guess of roundResults.guesses) {
                if (guess.distanceKm < 0) continue; // Player didn't guess

                const pinPath = "M 0,-20 C -6,-20 -10,-14 -10,-8 C -10,0 0,10 0,10 C 0,10 10,0 10,-8 C 10,-14 6,-20 0,-20 Z";

                new google.maps.Marker({
                    position: guess.position,
                    map,
                    icon: {
                        path: pinPath,
                        scale: 0.9,
                        fillColor: guess.avatarColor,
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                        anchor: new google.maps.Point(0, 10),
                    },
                    title: `${guess.playerName}: ${formatDistance(guess.distanceKm)}`,
                    zIndex: 900,
                });

                // Dashed polyline from guess to actual
                new google.maps.Polyline({
                    path: [guess.position, roundResults.actualPosition],
                    geodesic: true,
                    strokeColor: guess.avatarColor,
                    strokeOpacity: 0,
                    strokeWeight: 3,
                    icons: [
                        {
                            icon: { path: "M 0,-1 0,1", strokeOpacity: 0.7, strokeColor: guess.avatarColor, scale: 3 },
                            offset: "0",
                            repeat: "15px",
                        },
                    ],
                    map,
                });

                bounds.extend(guess.position);
            }

            map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
        })();

        return () => { cancelled = true; };
    }, [roundResults]);

    if (!roundResults) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 flex flex-col bg-[oklch(0.10_0.02_260)]"
        >
            {/* Header */}
            <div className="glass flex items-center justify-between px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-primary" />
                    <span className="text-sm font-bold text-white">
                        Round {currentRound} Results
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                    <Clock size={12} />
                    {currentRound < totalRounds
                        ? `Next round in ${countdown}s`
                        : `Final scores in ${countdown}s`}
                </div>
            </div>

            {/* Main content: Map + Leaderboard — stacked on mobile, side-by-side on md+ */}
            <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
                {/* Map */}
                <div className="relative h-[40vh] flex-shrink-0 md:h-auto md:flex-1">
                    <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
                </div>

                {/* Leaderboard — bottom panel on mobile, sidebar on desktop */}
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 25 }}
                    className="flex flex-1 flex-col border-t border-white/10 bg-[oklch(0.12_0.02_260)] p-4 md:w-[320px] md:flex-initial md:border-t-0 md:border-l md:p-5"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <Trophy size={14} className="text-amber-400" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
                            Leaderboard
                        </h3>
                    </div>

                    <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                        {leaderboard.map((entry, i) => {
                            const roundGuess = roundResults.guesses.find(
                                (g) => g.playerId === entry.playerId
                            );
                            return (
                                <motion.div
                                    key={entry.playerId}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                                >
                                    <span
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${i === 0
                                                ? "bg-amber-500/20 text-amber-400"
                                                : i === 1
                                                    ? "bg-gray-400/20 text-gray-300"
                                                    : i === 2
                                                        ? "bg-orange-700/20 text-orange-400"
                                                        : "bg-white/5 text-white/30"
                                            }`}
                                    >
                                        #{entry.rank}
                                    </span>
                                    <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                        style={{ backgroundColor: entry.avatarColor }}
                                    >
                                        {entry.playerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-1 flex-col">
                                        <span className="text-sm font-bold text-white">
                                            {entry.playerName}
                                        </span>
                                        <span className="text-[0.6rem] text-white/30">
                                            {roundGuess && roundGuess.distanceKm >= 0
                                                ? `${formatDistance(roundGuess.distanceKm)} · +${roundGuess.score.toLocaleString()}`
                                                : "No guess"}
                                        </span>
                                    </div>
                                    <span className="font-mono text-sm font-bold text-primary">
                                        {entry.totalScore.toLocaleString()}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
