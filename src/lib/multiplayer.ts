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
import { randomId } from "./utils";
import { MAX_SCORE_PER_ROUND, SCORE_DECAY_FACTOR } from "./constants";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Position } from "@/types/game";
import type {
    LobbyPlayer,
    PlayerGuess,
    RoundResultsPayload,
    MatchOverPayload,
    LeaderboardEntry,
    Envelope,
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
    if (_playerId) return _playerId;

    try {
        // Use sessionStorage so each tab gets a unique ID
        const stored = sessionStorage.getItem("terrapin-player-id");
        if (stored) {
            _playerId = stored;
            return _playerId;
        }
        _playerId = randomId();
        sessionStorage.setItem("terrapin-player-id", _playerId);
    } catch {
        // Site data blocked — fall back to an in-memory id (lost on refresh).
        console.warn("[Multiplayer] sessionStorage unavailable; using in-memory player id");
        _playerId = _playerId ?? randomId();
    }

    return _playerId;
}

/* ── Lobby Breadcrumb (survives a page refresh) ───────────── */

const LOBBY_BREADCRUMB_KEY = "terrapin-lobby";

export interface LobbyBreadcrumb {
    code: string;
    name: string;
}

export function writeLobbyBreadcrumb(code: string, name: string): void {
    try {
        sessionStorage.setItem(LOBBY_BREADCRUMB_KEY, JSON.stringify({ code, name }));
    } catch {
        // Site data blocked — rejoin-after-refresh simply won't be available.
    }
}

export function readLobbyBreadcrumb(): LobbyBreadcrumb | null {
    try {
        const raw = sessionStorage.getItem(LOBBY_BREADCRUMB_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<LobbyBreadcrumb>;
        if (!parsed?.code) return null;
        return { code: parsed.code, name: parsed.name || "Player" };
    } catch {
        return null;
    }
}

export function clearLobbyBreadcrumb(): void {
    try {
        sessionStorage.removeItem(LOBBY_BREADCRUMB_KEY);
    } catch {
        // Nothing to clean up if storage is unavailable.
    }
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

/**
 * A second, per-lobby channel used only to carry guess positions from a
 * guesser to the host. Unlike the main lobby channel, non-host clients never
 * subscribe to this one — they only ever call `.httpSend()` on it, so the
 * realtime server never delivers other players' raw guesses to their sockets.
 * Only the host subscribes, so it's the only client that ever receives them.
 */
let activeGuessesChannel: RealtimeChannel | null = null;

export function getActiveGuessesChannel(): RealtimeChannel | null {
    return activeGuessesChannel;
}

export function createGuessesChannel(lobbyCode: string): RealtimeChannel {
    if (activeGuessesChannel) {
        supabase.removeChannel(activeGuessesChannel);
        activeGuessesChannel = null;
    }

    const channelName = `terrapin-lobby:${lobbyCode}:guesses`;
    activeGuessesChannel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
    });

    return activeGuessesChannel;
}

export function destroyGuessesChannel(): void {
    if (activeGuessesChannel) {
        supabase.removeChannel(activeGuessesChannel);
        activeGuessesChannel = null;
    }
}

/* ── Presence Helpers ─────────────────────────────────────── */

export interface PresencePayload {
    id: string;
    name: string;
    avatarColor: string;
    isHost: boolean;
}

export async function trackPresence(
    channel: RealtimeChannel,
    player: PresencePayload
): Promise<string> {
    const result = await channel.track(player);
    return result;
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

/**
 * Probe an already-subscribed channel for other occupants.
 *
 * Realtime channels are created on demand, so joining a typo'd party code
 * "succeeds" into an empty room. Resolves with the other players present, or an
 * empty array once the timeout elapses.
 */
export function waitForOtherPresence(
    channel: RealtimeChannel,
    myId: string,
    timeoutMs = 2500
): Promise<PresencePayload[]> {
    return new Promise((resolve) => {
        const deadline = Date.now() + timeoutMs;
        const poll = setInterval(() => {
            const state = channel.presenceState<PresencePayload>();
            const others: PresencePayload[] = [];
            for (const entries of Object.values(state)) {
                const p = entries?.[0];
                if (p && p.id !== myId) {
                    others.push({
                        id: p.id,
                        name: p.name,
                        avatarColor: p.avatarColor,
                        isHost: p.isHost,
                    });
                }
            }

            if (others.length > 0 || Date.now() >= deadline) {
                clearInterval(poll);
                resolve(others);
            }
        }, 200);
    });
}

/* ── Broadcast Helpers ────────────────────────────────────── */

/**
 * Every broadcast is wrapped in an Envelope carrying the sender's player id.
 * Listeners verify `from` against the current host (or the sender's own id for
 * guess events) before acting — without this, any client on the anon key could
 * inject ROUND_RESULTS / MATCH_OVER / SUBMIT_GUESS-as-someone-else.
 *
 * Resolves once the realtime server acknowledges the message; a non-"ok"
 * status is logged instead of silently dropped.
 */
export async function broadcastEvent<T>(
    channel: RealtimeChannel,
    event: string,
    payload: T
): Promise<void> {
    const envelope: Envelope<T> = { from: getPlayerId(), payload };
    const status = await channel.send({
        type: "broadcast",
        event,
        payload: envelope,
    });
    if (status !== "ok") {
        console.warn(`[Multiplayer] ${event} not delivered:`, status);
    }
}

/** Same envelope, sent over REST (works on a channel this client hasn't subscribed to). */
export async function httpSendEvent<T>(
    channel: RealtimeChannel,
    event: string,
    payload: T
): Promise<void> {
    const envelope: Envelope<T> = { from: getPlayerId(), payload };
    await channel.httpSend(event, envelope);
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
