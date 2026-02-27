"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMultiplayerStore } from "@/stores/multiplayer-store";
import { LobbyScreen } from "@/components/multiplayer/lobby-screen";
import { CountdownOverlay } from "@/components/multiplayer/countdown-overlay";
import { MultiplayerHUD } from "@/components/multiplayer/multiplayer-hud";
import { RoundResults } from "@/components/multiplayer/round-results";
import { MatchSummary } from "@/components/multiplayer/match-summary";
import { StreetView } from "@/components/game/street-view";
import { MiniMap } from "@/components/game/mini-map";
import { CompassHUD } from "@/components/game/compass-hud";
import { useGameStore } from "@/stores/game-store";

/**
 * Multiplayer game page.
 * Renders different components based on the multiplayer store phase.
 * Reuses existing StreetView and MiniMap components from singleplayer.
 */
export default function MultiplayerGamePage() {
    const router = useRouter();
    const phase = useMultiplayerStore((s) => s.phase);
    const panoPosition = useMultiplayerStore((s) => s.panoPosition);
    const panoId = useMultiplayerStore((s) => s.panoId);
    const roundTimeLeft = useMultiplayerStore((s) => s.roundTimeLeft);
    const hasGuessed = useMultiplayerStore((s) => s.hasGuessed);
    const currentRound = useMultiplayerStore((s) => s.currentRound);
    const totalRounds = useMultiplayerStore((s) => s.totalRounds);
    const settings = useMultiplayerStore((s) => s.settings);
    const guessPosition = useMultiplayerStore((s) => s.guessPosition);
    const setGuessPosition = useMultiplayerStore((s) => s.setGuessPosition);
    const submitGuess = useMultiplayerStore((s) => s.submitGuess);

    // Sync multiplayer state → singleplayer game store for StreetView/MiniMap compatibility
    useEffect(() => {
        if (phase === "guessing" && panoPosition) {
            useGameStore.setState({
                phase: "guessing",
                actualPosition: panoPosition,
                panoId: panoId,
                isLoadingLocation: false,
                timer: roundTimeLeft,
                timePerRound: settings.timePerRound,
                currentRound: currentRound,
                totalRounds: totalRounds,
                guessPosition: null,
            });
        }
    }, [phase, panoPosition, panoId]);

    // Sync guess position from game store back to multiplayer store
    const gameGuessPosition = useGameStore((s) => s.guessPosition);
    useEffect(() => {
        if (gameGuessPosition && phase === "guessing") {
            setGuessPosition(gameGuessPosition);
        }
    }, [gameGuessPosition, phase, setGuessPosition]);

    // Sync timer display
    useEffect(() => {
        if (phase === "guessing") {
            useGameStore.setState({ timer: roundTimeLeft });
        }
    }, [roundTimeLeft, phase]);

    // Redirect to home if not in any multiplayer phase
    // Skip "creating"/"joining" — those are transient states before "lobby"
    useEffect(() => {
        if (phase === "menu") {
            router.push("/");
        }
    }, [phase, router]);

    // Cleanup on tab/window close only — NOT on React unmount
    // (React Strict Mode double-mounts in dev, which destroys the lobby)
    useEffect(() => {
        const handleBeforeUnload = () => {
            const currentPhase = useMultiplayerStore.getState().phase;
            if (currentPhase !== "menu") {
                useMultiplayerStore.getState().leaveLobby();
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // Handle guess submission — override the game store's submitGuess
    useEffect(() => {
        if (phase === "guessing") {
            const unsubGameStore = useGameStore.subscribe((state) => {
                if (state.phase === "result" && phase === "guessing" && !hasGuessed) {
                    useGameStore.setState({ phase: "guessing" });
                    submitGuess();
                }
            });
            return () => unsubGameStore();
        }
    }, [phase, hasGuessed, submitGuess]);

    // Render by phase
    switch (phase) {
        case "lobby":
            return <LobbyScreen />;

        case "countdown":
            return (
                <div className="fixed inset-0 bg-[oklch(0.08_0.02_260)]">
                    <CountdownOverlay />
                </div>
            );

        case "guessing":
            return (
                <div className="fixed inset-0 flex flex-col">
                    <MultiplayerHUD />
                    <div className="relative flex flex-1 flex-col overflow-hidden">
                        <StreetView />
                        <CompassHUD />
                        <MiniMap />
                    </div>
                </div>
            );

        case "round-results":
            return <RoundResults />;

        case "match-summary":
            return <MatchSummary />;

        default:
            return (
                <div className="flex min-h-screen items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            );
    }
}
