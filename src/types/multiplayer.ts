import type { Position } from "./game";

/* ── Phases ─────────────────────────────────────────────── */

export type MultiplayerPhase =
    | "menu"        // Not in any lobby
    | "creating"    // Creating a lobby
    | "joining"     // Joining a lobby
    | "lobby"       // In lobby, waiting for host to start
    | "countdown"   // 3-2-1 countdown before round
    | "guessing"    // Round active — players placing pins
    | "round-results" // Showing all guesses + scores
    | "match-summary"; // Final podium

/* ── Lobby ──────────────────────────────────────────────── */

export interface LobbySettings {
    rounds: number;       // 3, 5, or 7
    timePerRound: number; // 30, 60, or 120 seconds
    mapType: string;      // "world" or a country id
}

export interface LobbyPlayer {
    id: string;
    name: string;
    avatarColor: string;
    isHost: boolean;
    hasGuessed: boolean;
    score: number;
    connected: boolean;
}

export interface LobbyState {
    code: string;
    hostId: string;
    players: LobbyPlayer[];
    settings: LobbySettings;
}

/* ── Round Data ─────────────────────────────────────────── */

export interface PlayerGuess {
    playerId: string;
    playerName: string;
    avatarColor: string;
    position: Position;
    distanceKm: number;
    score: number;
    timeSpent: number;
}

export interface RoundResultData {
    roundNum: number;
    actualPosition: Position;
    guesses: PlayerGuess[];
}

export interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    avatarColor: string;
    totalScore: number;
    rank: number;
}

/* ── Broadcast Event Payloads ───────────────────────────── */

export interface GameStartingPayload {
    totalRounds: number;
    settings: LobbySettings;
}

export interface RoundStartPayload {
    roundNum: number;
    timeLimit: number;
    panoId: string | null;
    /** Only sent for Street View initialization — NOT the answer coords */
    panoPosition: Position;
}

export interface PlayerGuessedPayload {
    playerId: string;
}

export interface TimerUpdatePayload {
    timeLeft: number;
}

export interface RoundResultsPayload {
    roundNum: number;
    actualPosition: Position;
    guesses: PlayerGuess[];
    leaderboard: LeaderboardEntry[];
}

export interface MatchOverPayload {
    leaderboard: LeaderboardEntry[];
}

/* ── Avatar Colors ──────────────────────────────────────── */

export const AVATAR_COLORS = [
    "#7c3aed", // violet
    "#f97316", // orange
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#22c55e", // green
    "#eab308", // yellow
    "#ef4444", // red
    "#3b82f6", // blue
] as const;
