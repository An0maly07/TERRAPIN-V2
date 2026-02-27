# 🌍 TerraPin Multiplayer Feature Implementation Guide
## Geo-Guessing Multiplayer System (GeoGuessr Inspired)

---

## 📋 Table of Contents

1. [Feature Overview](#feature-overview)
2. [UI/UX Flow](#uiux-flow)
3. [Tech Stack & Dependencies](#tech-stack--dependencies)
4. [Architecture](#architecture)
5. [Backend Implementation (Node.js + WebSockets)](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Game Logic — Multiplayer Rules](#game-logic--multiplayer-rules)
8. [Scoring System](#scoring-system)
9. [Party Code System](#party-code-system)
10. [Socket Events Reference](#socket-events-reference)
11. [State Machine](#state-machine)
12. [Implementation Checklist](#implementation-checklist)

---

## 1. Feature Overview

This document outlines the implementation plan for adding **Real-Time Multiplayer** to TerraPin. The system allows players to compete against friends or strangers by guessing the same Street View locations simultaneously.

### Core Multiplayer Rules
- A **Party Host** creates a lobby and receives a **6-character alphanumeric party code**.
- Friends **join via the party code**.
- The Host configures the match (Number of Rounds, Time Limit, Map/Location Pool).
- The server generates a single "Seed" (a set of coordinates) for the match so all players see the *exact same* Street View locations.
- **Simultaneous Play:** All players explore and place their pins concurrently. 
- When the first player guesses, a "Hurry Up" timer can trigger for the rest, or everyone simply uses the full round timer.
- Points are awarded based on the **distance** between the guess and the actual location.

---

## 2. UI/UX Flow

1. **Home Screen:** User clicks "Multiplayer" -> "Create Party" or "Join Party".
2. **Lobby Screen:** - Displays current players (Avatars/Names).
   - Host sees "Game Settings" (Round time, Map) and a "Start Game" button.
   - Non-hosts see "Waiting for Host...".
3. **In-Game Screen (Round Start):**
   - 3-second countdown overlay.
   - Standard Street View interface loads for everyone.
   - A live "Player Status" HUD shows who has locked in their guess (e.g., "✅ Player 2 has guessed").
4. **Round Results Screen:**
   - A map showing the actual location and lines drawn to everyone's guesses.
   - A mini-leaderboard showing points earned this round and total points.
   - "Next Round" timer counting down (e.g., 10 seconds).
5. **Final Match Summary:**
   - Podium displaying 1st, 2nd, and 3rd place.
   - "Play Again" or "Return to Main Menu" options.

---

## 3. Tech Stack & Dependencies

- **Frontend:** Next.js, React, Google Maps API / Google Street View API.
- **Backend/Real-Time Sync:** Socket.io (Node.js) OR Supabase Realtime (Presence & Broadcast).
- **Database:** Supabase (PostgreSQL) for storing Maps, user statistics, and match history.
- **Math Logic:** Haversine formula for distance calculation.

---

## 4. Architecture

- **Client:** Renders the Street View panorama. Sends the user's chosen `(lat, lng)` guess to the server.
- **Game Server (Socket.io/Supabase):** - Manages the concept of "Rooms" (Lobbies).
  - Acts as the source of truth for the countdown timer to prevent client-side manipulation.
  - Verifies round state.
  - Calculates distances securely (so clients don't receive the actual coordinates until the round ends, preventing cheating via network inspection).

---

## 5. Backend Implementation

### Data Flow for a Round
1. Server loads $X$ random coordinates from the selected map database.
2. Server broadcasts `ROUND_START` with the panorama ID or the *obfuscated* starting coordinates for Round 1.
3. Server starts a timer (e.g., 60 seconds).
4. Clients send `SUBMIT_GUESS` with their `(lat, lng)`.
5. Server acknowledges guess, broadcasts `PLAYER_GUESSED` to update UI.
6. When timer hits 0 OR all players guess, server broadcasts `ROUND_END`.
7. `ROUND_END` payload contains the *actual* coordinates, all player guesses, and calculated scores.

*Crucial Security Note:* Never send the actual answer coordinate to the client until the round is over. Only send the necessary Panorama ID to initialize Street View.

---

## 6. Frontend Implementation

### Map Integration
- The Mini-Map must be separated from the Street View. 
- When a user clicks the Mini-Map, store the temporary pin.
- When they click "Guess", trigger the socket emission and lock the Mini-Map to prevent further clicks.

### Synchronization
- Use a `gameStore.ts` (Zustand/Redux) to manage the local state based on socket events.
- Variables needed: `lobbyCode`, `players[]`, `currentRound`, `roundState` ('waiting', 'playing', 'results'), `myScore`, `leaderboard`.

---

## 7. Game Logic — Multiplayer Rules

### Round Progression
- **Time Limits:** Host can set 30s, 60s, or 120s per round. 
- **Guess Lock-in:** Once a player guesses, they cannot change it. They enter a "spectator/waiting" view until others finish.
- **Disconnections:** If a player disconnects, they forfeit the current round (score = 0). If they reconnect before the next round starts, they can continue.

---

## 8. Scoring System

The game uses an exponential decay curve for scoring, identical to standard Geo-guessing games.

- **Max Score per Round:** 5000 points.
- **Perfect Threshold:** Guessing within a certain distance (e.g., 25 meters) awards the full 5000 points.
- **Distance Penalty:** Points drop off exponentially based on the size of the map (e.g., World Map vs. a single city map).
- **Formula Concept:** `Score = 5000 * e^(-distance / scale_factor)` 

*The server must handle this calculation to ensure consensus across all clients.*

---

## 9. Party Code System

- Lobbies are identified by a 6-character uppercase alphanumeric string (e.g., `TRP-A9K2`).
- Stored in an active memory store (like Redis or standard memory in Node.js) while the game is active, rather than a permanent DB to save read/writes.
- A `Lobby` object contains: `hostId`, `settings`, `players`, `matchState`.

---

## 10. Socket Events Reference

### Client -> Server
- `CREATE_LOBBY` { settings }
- `JOIN_LOBBY` { code, username, avatar }
- `LEAVE_LOBBY` {}
- `START_GAME` {} *(Host only)*
- `SUBMIT_GUESS` { lat, lng }
- `EMOTE` { emojiId } *(Optional fun interaction)*

### Server -> Client
- `LOBBY_UPDATED` { players[], settings }
- `GAME_STARTING` { totalRounds }
- `ROUND_START` { roundNum, timeLimit, panoramaId }
- `PLAYER_GUESSED` { playerId } *(To show the ✅ in the UI)*
- `ROUND_TIMER_UPDATE` { timeLeft }
- `ROUND_RESULTS` { actualLocation, playerGuesses[], roundScores[] }
- `MATCH_OVER` { finalLeaderboard[] }
- `ERROR` { message }

---

## 11. State Machine

```text
[ MAIN MENU ] 
     |
     v
[ IN LOBBY ] <--- (Waiting for players, host tweaks settings)
     |
     v (Host clicks Start)
[ GAME LOADING ] <--- (Fetching panoramas)
     |
     v
[ ROUND ACTIVE ] <--- (Timer counting down, players viewing street-level)
     |
     v (All guessed OR Time Out)
[ ROUND RESULTS ] <--- (Lines drawn on map, points distributed)
     |
     v (If more rounds remain, loop back to ROUND ACTIVE)
[ MATCH SUMMARY ] <--- (Final podium)