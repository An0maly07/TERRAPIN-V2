export type GamePhase = "menu" | "guessing" | "result" | "summary";
export type GameMode = "classic" | "duel" | "streaks";

export interface Position {
  lat: number;
  lng: number;
}

export interface RoundResult {
  guessPosition: Position;
  actualPosition: Position;
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
}
