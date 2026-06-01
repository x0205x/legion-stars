import { getFactionStart } from "@/data/factions";
import { DEFAULT_SHIP } from "@/data/ships";
import { createArmyFromLoadouts, DEFAULT_SQUAD } from "@/data/soldiers";
import type { PlayerState, ShipLoadout, SoldierLoadout } from "@/types/game";

const SAVE_KEY = "conquer-universe-save-v1";
const LEGACY_SAVE_KEYS = [
  "conquer-the-universe-save-v1",
  "legion-stars-save-v1",
] as const;

export function createNewPlayer(
  commanderName: string,
  factionId: string
): PlayerState {
  const start = getFactionStart(factionId);
  return {
    commanderName,
    factionId,
    credits: 5000,
    supplies: 100,
    currentZoneId: start.zoneId,
    ship: { ...DEFAULT_SHIP, weapons: [...DEFAULT_SHIP.weapons] },
    army: createArmyFromLoadouts(DEFAULT_SQUAD.map((s) => ({ ...s }))),
    reputation: {},
    discoveredZones: [...start.discovered],
  };
}

export function savePlayer(state: PlayerState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadRawSave(): string | null {
  const current = localStorage.getItem(SAVE_KEY);
  if (current) return current;
  for (const key of LEGACY_SAVE_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) return legacy;
  }
  return null;
}

function normalizePlayer(state: PlayerState): PlayerState {
  const weapons = [...(state.ship.weapons ?? ["wpn-laser"])];
  while (weapons.length < 2) weapons.push("wpn-none");
  return {
    ...state,
    ship: { ...state.ship, weapons: weapons.slice(0, 2) },
  };
}

export function loadPlayer(): PlayerState | null {
  const raw = loadRawSave();
  if (!raw) return null;
  try {
    return normalizePlayer(JSON.parse(raw) as PlayerState);
  } catch {
    return null;
  }
}

export function updateShip(state: PlayerState, ship: ShipLoadout): PlayerState {
  return { ...state, ship };
}

export function updateSquad(
  state: PlayerState,
  loadouts: SoldierLoadout[]
): PlayerState {
  return { ...state, army: createArmyFromLoadouts(loadouts) };
}
