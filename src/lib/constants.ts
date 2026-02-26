import type { GameModeConfig } from "@/types/game";

export const GAME_MODES: GameModeConfig[] = [
  {
    id: "classic",
    title: "Classic",
    description: "Explore 5 random locations around the world and test your geography",
    icon: "Globe",
    rounds: 5,
    timePerRound: 120,
  },
  {
    id: "campaign",
    title: "Campaign",
    description:
      "Embark on the ultimate Terrapin journey. Progress through per-country matchmaking, conquer regions, and climb the global leaderboards.",
    icon: "Flame",
    rounds: 999,
    timePerRound: 0,
    badges: ["PROGRESSIVE", "GLOBAL RANKING"],
  },
];

export const MAX_SCORE_PER_ROUND = 5000;
export const SCORE_DECAY_FACTOR = 2000;

// Placeholder locations for demo
export const DEMO_LOCATIONS = [
  { lat: 48.8566, lng: 2.3522, name: "Paris, France" },
  { lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan" },
  { lat: 40.7128, lng: -74.006, name: "New York, USA" },
  { lat: -33.8688, lng: 151.2093, name: "Sydney, Australia" },
  { lat: 51.5074, lng: -0.1278, name: "London, UK" },
  { lat: 55.7558, lng: 37.6173, name: "Moscow, Russia" },
  { lat: -22.9068, lng: -43.1729, name: "Rio de Janeiro, Brazil" },
  { lat: 1.3521, lng: 103.8198, name: "Singapore" },
];
