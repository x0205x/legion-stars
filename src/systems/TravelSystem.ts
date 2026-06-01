import { getZone } from "@/data/zones";
import { shipPower } from "@/data/ships";
import type { PlayerState, Scale, Zone } from "@/types/game";

export interface TravelCost {
  credits: number;
  supplies: number;
  fuelUnits: number;
  etaMinutes: number;
}

function scaleMultiplier(from: Scale, to: Scale): number {
  const order: Scale[] = ["continent", "planet", "system"];
  const diff = Math.abs(order.indexOf(from) - order.indexOf(to));
  if (diff === 0) return 1;
  if (diff === 1) return 2.5;
  return 6;
}

export function canTravel(state: PlayerState, targetId: string): boolean {
  const current = getZone(state.currentZoneId);
  if (current.id === targetId) return false;
  return current.connections.includes(targetId);
}

export function computeTravelCost(
  state: PlayerState,
  targetId: string
): TravelCost {
  const current = getZone(state.currentZoneId);
  const target = getZone(targetId);
  const mult = scaleMultiplier(current.scale, target.scale);
  const threat = (current.threat + target.threat) / 2;
  const engineFactor = Math.max(0.5, 1.2 - shipPower(state.ship) / 200);

  return {
    credits: Math.round(50 * mult + threat * 20),
    supplies: Math.round(5 * mult + threat * 2),
    fuelUnits: Math.round(10 * mult * engineFactor),
    etaMinutes: Math.round(2 * mult * engineFactor),
  };
}

export function travelTo(
  state: PlayerState,
  targetId: string
): { state: PlayerState; error?: string } {
  if (!canTravel(state, targetId)) {
    return { state, error: "No route to that location." };
  }

  const cost = computeTravelCost(state, targetId);
  if (state.credits < cost.credits || state.supplies < cost.supplies) {
    return { state, error: "Insufficient credits or supplies." };
  }

  const discovered = new Set(state.discoveredZones);
  discovered.add(targetId);
  const target = getZone(targetId);
  if (target.parentId) discovered.add(target.parentId);

  return {
    state: {
      ...state,
      credits: state.credits - cost.credits,
      supplies: state.supplies - cost.supplies,
      currentZoneId: targetId,
      discoveredZones: [...discovered],
    },
  };
}

export function reachableZones(state: PlayerState): Zone[] {
  const current = getZone(state.currentZoneId);
  return current.connections.map((id) => getZone(id));
}
