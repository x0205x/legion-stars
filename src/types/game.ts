export type Scale = "continent" | "planet" | "system";

export interface Faction {
  id: string;
  name: string;
  motto: string;
  color: string;
  armyBonus: number;
  shipBonus: number;
  diplomacy: "aggressive" | "merchant" | "isolationist";
}

export interface Zone {
  id: string;
  name: string;
  scale: Scale;
  parentId: string | null;
  description: string;
  threat: number;
  resources: string[];
  connections: string[];
  position: [number, number, number];
  /** Faction that nominally controls this zone (flavor + future rep hooks) */
  controllingFaction?: string;
}

export interface ShipModule {
  id: string;
  slot: "hull" | "engine" | "weapon" | "shield" | "cargo";
  name: string;
  power: number;
  cost: number;
}

export interface ShipLoadout {
  name: string;
  hull: string;
  engine: string;
  weapons: string[];
  shield: string;
  cargo: string;
}

export interface SoldierClass {
  id: string;
  name: string;
  role: string;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
}

export interface SoldierLoadout {
  name: string;
  classId: string;
  armorId: string;
  weaponId: string;
  gadgetId: string;
}

export interface ArmyUnit {
  id: string;
  loadout: SoldierLoadout;
  hp: number;
  morale: number;
}

export interface PlayerState {
  commanderName: string;
  factionId: string;
  credits: number;
  supplies: number;
  currentZoneId: string;
  ship: ShipLoadout;
  army: ArmyUnit[];
  reputation: Record<string, number>;
  discoveredZones: string[];
}

export interface CombatResult {
  victory: boolean;
  casualties: number;
  loot: number;
  message: string;
}
