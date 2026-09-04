export type GamePhase = "menu" | "guessing" | "result" | "summary";
export type GameMode = "classic" | "campaign";

export interface Position {
  lat: number;
  lng: number;
}

export interface RoundResult {
  /** null when the round timed out without a pin being placed */
  guessPosition: Position | null;
  actualPosition: Position;
  /** -1 when there was no guess */
  distanceKm: number;
  score: number;
  timeSpent: number;
}

export interface GameModeConfig {
  id: GameMode;
  title: string;
  description: string;
  icon: string;
  rounds: number;
  timePerRound: number;
  badges?: string[];
}

export interface CountryBounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

export interface CountryConfig {
  id: string;
  name: string;
  totalMaps: number;
  bounds: CountryBounds;
  locations: Position[];
}

export type CampaignProgress = Record<
  string,
  { completed: number; highScore: number }
>;
