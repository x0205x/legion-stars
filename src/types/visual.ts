export type VisualCategory =
  | "infantry"
  | "officer"
  | "mech"
  | "spaceship"
  | "naval"
  | "vehicle"
  | "air"
  | "environment";

export interface VisualAsset {
  id: string;
  name: string;
  category: VisualCategory;
  image: string;
  factionId?: string;
  tags: string[];
  description: string;
}

export interface NpcTemplate {
  id: string;
  name: string;
  category: VisualCategory;
  visualId: string;
  factionId: string;
  role: string;
  threatBonus: number;
  /** Ground = army power scale, space = ship power scale */
  combatDomain: "ground" | "space" | "both";
}

export interface CinematicBeat {
  image: string;
  caption: string;
  durationMs: number;
}

export interface CinematicScene {
  id: string;
  title: string;
  subtitle?: string;
  factionId?: string;
  zoneId?: string;
  trigger: "deploy" | "travel" | "ground-battle" | "space-battle" | "gallery";
  beats: CinematicBeat[];
}
