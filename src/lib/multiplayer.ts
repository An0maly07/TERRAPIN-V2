/**
 * Multiplayer Game Manager
 * Uses Supabase Realtime (Broadcast + Presence) for LAN multiplayer.
 * The host's client acts as the game authority:
 *   - Generates locations
 *   - Calculates scores
 *   - Controls round progression
 */

import { supabase } from "./supabase";
import { haversineDistance } from "./geo";
import { MAX_SCORE_PER_ROUND, SCORE_DECAY_FACTOR } from "./constants";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Position } from "@/types/game";
import type {
    LobbySettings,
    LobbyPlayer,
    PlayerGuess,
    RoundStartPayload,
    RoundResultsPayload,
    MatchOverPayload,
    LeaderboardEntry,
    AVATAR_COLORS,
} from "@/types/multiplayer";

/* ── Party Code Generation ────────────────────────────────── */

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion

export function generatePartyCode(): string {
    let code = "TRP-";
    for (let i = 0; i < 4; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
}

/* ── Score Calculation ────────────────────────────────────── */

export function calculateScore(distanceKm: number): number {
    return Math.max(
        0,
        Math.round(MAX_SCORE_PER_ROUND * Math.exp(-distanceKm / SCORE_DECAY_FACTOR))
    );
}

/* ── Player ID ────────────────────────────────────────────── */

let _playerId: string | null = null;

export function getPlayerId(): string {
    if (!_playerId) {
        // Use sessionStorage so each tab gets a unique ID
        const stored = sessionStorage.getItem("terrapin-player-id");
        if (stored) {
            _playerId = stored;
        } else {
            _playerId = crypto.randomUUID();
            sessionStorage.setItem("terrapin-player-id", _playerId);
        }
    }
    return _playerId;
}

/* ── Channel Manager ──────────────────────────────────────── */

let activeChannel: RealtimeChannel | null = null;

export function getActiveChannel(): RealtimeChannel | null {
    return activeChannel;
}

/**
 * Create a Supabase Realtime channel for a lobby.
 * Uses Presence for player tracking and Broadcast for game events.
 */
export function createChannel(lobbyCode: string): RealtimeChannel {
    // Clean up existing channel
    if (activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
    }

    const channelName = `terrapin-lobby:${lobbyCode}`;
    activeChannel = supabase.channel(channelName, {
        config: {
            broadcast: { self: true },
            presence: { key: getPlayerId() },
        },
    });

    return activeChannel;
}

export function destroyChannel(): void {
    if (activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
    }
}

/* ── Presence Helpers ─────────────────────────────────────── */

export interface PresencePayload {
    id: string;
    name: string;
    avatarColor: string;
    isHost: boolean;
}

export function trackPresence(
    channel: RealtimeChannel,
    player: PresencePayload
): void {
    channel.track(player);
}

export function presenceToPlayers(
    presenceState: Record<string, PresencePayload[]>
): LobbyPlayer[] {
    const players: LobbyPlayer[] = [];
    for (const key of Object.keys(presenceState)) {
        const entries = presenceState[key];
        if (entries && entries.length > 0) {
            const p = entries[0];
            players.push({
                id: p.id,
                name: p.name,
                avatarColor: p.avatarColor,
                isHost: p.isHost,
                hasGuessed: false,
                score: 0,
                connected: true,
            });
        }
    }
    return players;
}

/* ── Broadcast Helpers ────────────────────────────────────── */

export function broadcastEvent(
    channel: RealtimeChannel,
    event: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any
): void {
    channel.send({
        type: "broadcast",
        event,
        payload,
    });
}

/* ── Host Game Logic ──────────────────────────────────────── */

/**
 * Host-side: calculate round results for all guesses.
 */
export function computeRoundResults(
    roundNum: number,
    actualPosition: Position,
    guesses: Map<string, { position: Position; timeSpent: number }>,
    players: LobbyPlayer[]
): RoundResultsPayload {
    const playerGuesses: PlayerGuess[] = [];

    for (const player of players) {
        const guess = guesses.get(player.id);
        if (guess) {
            const distanceKm = haversineDistance(guess.position, actualPosition);
            const score = calculateScore(distanceKm);
            playerGuesses.push({
                playerId: player.id,
                playerName: player.name,
                avatarColor: player.avatarColor,
                position: guess.position,
                distanceKm,
                score,
                timeSpent: guess.timeSpent,
            });
        } else {
            // Player didn't guess — 0 points
            playerGuesses.push({
                playerId: player.id,
                playerName: player.name,
                avatarColor: player.avatarColor,
                position: { lat: 0, lng: 0 },
                distanceKm: -1,
                score: 0,
                timeSpent: -1,
            });
        }
    }

    // Build leaderboard (cumulative)
    const leaderboard: LeaderboardEntry[] = players
        .map((p) => {
            const roundGuess = playerGuesses.find((g) => g.playerId === p.id);
            return {
                playerId: p.id,
                playerName: p.name,
                avatarColor: p.avatarColor,
                totalScore: p.score + (roundGuess?.score ?? 0),
                rank: 0,
            };
        })
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    return {
        roundNum,
        actualPosition,
        guesses: playerGuesses,
        leaderboard,
    };
}

/**
 * Build the final match leaderboard.
 */
export function computeFinalLeaderboard(
    players: LobbyPlayer[]
): MatchOverPayload {
    const leaderboard: LeaderboardEntry[] = [...players]
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => ({
            playerId: p.id,
            playerName: p.name,
            avatarColor: p.avatarColor,
            totalScore: p.score,
            rank: idx + 1,
        }));

    return { leaderboard };
}
