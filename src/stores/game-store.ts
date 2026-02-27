import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GameMode,
  GamePhase,
  Position,
  RoundResult,
  CampaignProgress,
} from "@/types/game";
import {
  MAX_SCORE_PER_ROUND,
  SCORE_DECAY_FACTOR,
  CAMPAIGN_COUNTRIES,
  COUNTRY_ISO_CODES,
} from "@/lib/constants";
import { haversineDistance, findRandomStreetViewLocation } from "@/lib/geo";
import { loadGoogleMaps } from "@/lib/google-maps";

interface GameState {
  mode: GameMode;
  totalRounds: number;
  timePerRound: number;
  currentRound: number;
  phase: GamePhase;
  score: number;
  streak: number;
  timer: number;
  actualPosition: Position | null;
  panoId: string | null;
  guessPosition: Position | null;
  rounds: RoundResult[];
  isLoadingLocation: boolean;
  streetViewHeading: number;
  selectedCountryId: string | null;
  campaignProgress: CampaignProgress;

  startGame: (mode: GameMode, countryId?: string) => void;
  setGuessPosition: (pos: Position) => void;
  setStreetViewHeading: (heading: number) => void;
  submitGuess: () => void;
  nextRound: () => void;
  tickTimer: () => void;
  resetGame: () => void;
}

function calculateScore(distanceKm: number): number {
  return Math.max(
    0,
    Math.round(MAX_SCORE_PER_ROUND * Math.exp(-distanceKm / SCORE_DECAY_FACTOR))
  );
}

function getRoundsForMode(mode: GameMode): number {
  switch (mode) {
    case "classic":
      return 5;
    case "campaign":
      return 5;
  }
}

function getTimeForMode(mode: GameMode): number {
  switch (mode) {
    case "classic":
      return 120;
    case "campaign":
      return 60;
  }
}

/** Generation counter — incremented on every new fetch to cancel stale requests */
let fetchGeneration = 0;

/** Generate a random lat/lng within a country's bounding box */
function randomPointInBounds(country: (typeof CAMPAIGN_COUNTRIES)[number]): Position {
  const { latMin, latMax, lngMin, lngMax } = country.bounds;
  const lat = latMin + Math.random() * (latMax - latMin);
  let lng: number;
  if (lngMin > lngMax) {
    // Date line crossing (e.g. Fiji): pick from [lngMin, 180] or [-180, lngMax]
    const range1 = 180 - lngMin;
    const range2 = lngMax + 180;
    const total = range1 + range2;
    const r = Math.random() * total;
    lng = r < range1 ? lngMin + r : -180 + (r - range1);
  } else {
    lng = lngMin + Math.random() * (lngMax - lngMin);
  }
  return { lat, lng };
}

/**
 * Load Google Maps then find a random Street View location.
 * Returns the generation so callers can discard stale results.
 */
async function fetchRandomLocation(
  countryId?: string | null,
  generation?: number
): Promise<{
  position: Position;
  panoId: string | null;
  generation: number;
}> {
  const gen = generation ?? fetchGeneration;
  await loadGoogleMaps();

  if (countryId) {
    const country = CAMPAIGN_COUNTRIES.find((c) => c.id === countryId);
    if (country) {
      const { findStreetViewAt, isInCountry } = await import("@/lib/geo");
      const isoCode = COUNTRY_ISO_CODES[countryId];

      // Try random points within the country's geographic bounds,
      // then verify with reverse geocoding that the location is actually in the country.
      // Use a tighter search radius (10km) to avoid snapping into neighboring countries.
      for (let i = 0; i < 30; i++) {
        // Bail early if a newer fetch has been started
        if (gen !== fetchGeneration) {
          return { position: { lat: 0, lng: 0 }, panoId: null, generation: gen };
        }

        const point = randomPointInBounds(country);
        const result = await findStreetViewAt(point, 10_000);
        if (result) {
          // Verify the Street View location is actually inside this country
          if (isoCode) {
            const inCountry = await isInCountry(
              { lat: result.lat, lng: result.lng },
              isoCode
            );
            if (!inCountry) continue; // Skip — location is in a neighboring country
          }
          return {
            position: { lat: result.lat, lng: result.lng },
            panoId: result.panoId ?? null,
            generation: gen,
          };
        }
      }

      // Fallback: use one of the known seed locations (these are verified city coords).
      // Shuffle seeds so we don't always try the same order.
      const shuffled = [...country.locations].sort(() => Math.random() - 0.5);
      for (const seed of shuffled) {
        if (gen !== fetchGeneration) {
          return { position: { lat: 0, lng: 0 }, panoId: null, generation: gen };
        }
        // Use a tighter radius (5km) for seed locations since they're already in known cities
        const fallback = await findStreetViewAt(seed, 5_000);
        if (fallback) {
          // Still verify the snapped location is in the correct country
          if (isoCode) {
            const inCountry = await isInCountry(
              { lat: fallback.lat, lng: fallback.lng },
              isoCode
            );
            if (!inCountry) continue; // Snapped outside — try next seed
          }
          return {
            position: { lat: fallback.lat, lng: fallback.lng },
            panoId: fallback.panoId ?? null,
            generation: gen,
          };
        }
      }

      // Last resort: return a raw seed position (no Street View snap, no verification needed)
      const rawSeed = shuffled[0];
      return { position: rawSeed, panoId: null, generation: gen };
    }
  }

  // Classic: global random
  const loc = await findRandomStreetViewLocation("world", 15);
  return {
    position: { lat: loc.lat, lng: loc.lng },
    panoId: "panoId" in loc ? (loc.panoId as string) ?? null : null,
    generation: gen,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      mode: "classic",
      totalRounds: 5,
      timePerRound: 120,
      currentRound: 1,
      phase: "menu",
      score: 0,
      streak: 0,
      timer: 120,
      actualPosition: null,
      panoId: null,
      guessPosition: null,
      rounds: [],
      isLoadingLocation: false,
      streetViewHeading: 0,
      selectedCountryId: null,
      campaignProgress: {},

      startGame: (mode, countryId) => {
        // Increment generation to cancel any in-flight fetch from a previous game
        const gen = ++fetchGeneration;
        const timePerRound = getTimeForMode(mode);
        set({
          mode,
          phase: "guessing",
          currentRound: 1,
          totalRounds: getRoundsForMode(mode),
          timePerRound,
          score: 0,
          streak: 0,
          timer: timePerRound,
          rounds: [],
          actualPosition: null,
          panoId: null,
          guessPosition: null,
          isLoadingLocation: true,
          selectedCountryId: countryId ?? null,
        });

        fetchRandomLocation(countryId, gen).then(({ position, panoId, generation }) => {
          // Only apply if this fetch is still current
          if (generation === fetchGeneration) {
            set({ actualPosition: position, panoId, isLoadingLocation: false });
          }
        });
      },

      setGuessPosition: (pos) => set({ guessPosition: pos }),
      setStreetViewHeading: (heading) => set({ streetViewHeading: heading }),

      submitGuess: () => {
        const {
          guessPosition,
          actualPosition,
          timer,
          timePerRound,
          score,
          rounds,
          streak,
        } = get();
        if (!guessPosition || !actualPosition) return;

        const distanceKm = haversineDistance(guessPosition, actualPosition);
        const roundScore = calculateScore(distanceKm);
        const newStreak = roundScore > 2500 ? streak + 1 : 0;

        const result: RoundResult = {
          guessPosition,
          actualPosition,
          distanceKm,
          score: roundScore,
          timeSpent: timePerRound - timer,
        };

        set({
          phase: "result",
          score: score + roundScore,
          streak: newStreak,
          rounds: [...rounds, result],
        });
      },

      nextRound: () => {
        const {
          currentRound,
          totalRounds,
          timePerRound,
          selectedCountryId,
          mode,
          score,
          campaignProgress,
        } = get();

        if (currentRound >= totalRounds) {
          // Game complete — update campaign progress if applicable
          if (mode === "campaign" && selectedCountryId) {
            const prev = campaignProgress[selectedCountryId] ?? {
              completed: 0,
              highScore: 0,
            };
            set({
              phase: "summary",
              campaignProgress: {
                ...campaignProgress,
                [selectedCountryId]: {
                  completed: prev.completed + 1,
                  highScore: Math.max(prev.highScore, score),
                },
              },
            });
          } else {
            set({ phase: "summary" });
          }
        } else {
          const gen = ++fetchGeneration;
          set({
            currentRound: currentRound + 1,
            phase: "guessing",
            timer: timePerRound,
            guessPosition: null,
            actualPosition: null,
            panoId: null,
            isLoadingLocation: true,
          });

          fetchRandomLocation(selectedCountryId, gen).then(
            ({ position, panoId, generation }) => {
              if (generation === fetchGeneration) {
                set({
                  actualPosition: position,
                  panoId,
                  isLoadingLocation: false,
                });
              }
            }
          );
        }
      },

      tickTimer: () => {
        const { timer } = get();
        if (timer > 0) {
          set({ timer: timer - 1 });
        } else {
          get().submitGuess();
        }
      },

      resetGame: () => {
        ++fetchGeneration; // Cancel any in-flight fetch
        set({
          phase: "menu",
          currentRound: 1,
          score: 0,
          streak: 0,
          timer: 120,
          rounds: [],
          actualPosition: null,
          panoId: null,
          guessPosition: null,
          isLoadingLocation: false,
          selectedCountryId: null,
        });
      },
    }),
    {
      name: "terrapin-campaign",
      partialize: (state) => ({
        campaignProgress: state.campaignProgress,
      }),
    }
  )
);
