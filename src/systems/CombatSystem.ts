import { getFaction } from "@/data/factions";
import { pickZoneNpc } from "@/data/npcTemplates";
import { getVisual } from "@/data/visualAssets";
import { armyPower } from "@/data/soldiers";
import { shipPower } from "@/data/ships";
import { getZone } from "@/data/zones";
import type { CombatResult, PlayerState } from "@/types/game";
import type { NpcTemplate } from "@/types/visual";

export interface CombatEngagement {
  result: CombatResult;
  opponent: NpcTemplate;
  opponentImage: string;
}

function roll(base: number, variance = 0.2): number {
  return base * (1 + (Math.random() * 2 - 1) * variance);
}

export function resolveGroundBattle(state: PlayerState): CombatEngagement {
  const zone = getZone(state.currentZoneId);
  const faction = getFaction(state.factionId);
  const opponent = pickZoneNpc(zone.controllingFaction, "ground", zone.threat);
  const playerPower = roll(armyPower(state.army) * (1 + faction.armyBonus));
  const enemyPower = roll(zone.threat * 45 + 30 + opponent.threatBonus);

  if (playerPower >= enemyPower) {
    const loot = Math.round(200 + zone.threat * 80);
    return {
      opponent,
      opponentImage: getVisual(opponent.visualId).image,
      result: {
        victory: true,
        casualties: Math.floor(Math.random() * 2),
        loot,
        message: `Victory on ${zone.name}! ${opponent.name} retreats in ruin.`,
      },
    };
  }

  return {
    opponent,
    opponentImage: getVisual(opponent.visualId).image,
    result: {
      victory: false,
      casualties: Math.min(state.army.length, 1 + Math.floor(zone.threat / 3)),
      loot: 0,
      message: `${opponent.name} holds ${zone.name}. Reinforce your squad.`,
    },
  };
}

export function resolveSpaceSkirmish(state: PlayerState): CombatEngagement {
  const zone = getZone(state.currentZoneId);
  const faction = getFaction(state.factionId);
  const opponent = pickZoneNpc(zone.controllingFaction, "space", zone.threat);
  const playerPower = roll(shipPower(state.ship) * (1 + faction.shipBonus));
  const enemyPower = roll(zone.threat * 35 + 40 + opponent.threatBonus);

  if (playerPower >= enemyPower) {
    const loot = Math.round(350 + zone.threat * 100);
    return {
      opponent,
      opponentImage: getVisual(opponent.visualId).image,
      result: {
        victory: true,
        casualties: 0,
        loot,
        message: `${opponent.name} breaks off — ${zone.name} lanes are yours.`,
      },
    };
  }

  return {
    opponent,
    opponentImage: getVisual(opponent.visualId).image,
    result: {
      victory: false,
      casualties: 0,
      loot: 0,
      message: `${opponent.name} repels your fleet. Upgrade ship modules.`,
    },
  };
}

export function applyCombatResult(
  state: PlayerState,
  result: CombatResult
): PlayerState {
  let army = [...state.army];
  for (let i = 0; i < result.casualties && army.length > 0; i++) {
    const idx = Math.floor(Math.random() * army.length);
    army = army.filter((_, j) => j !== idx);
  }

  if (result.victory) {
    army = army.map((u) => ({
      ...u,
      morale: Math.min(100, u.morale + 10),
    }));
  } else {
    army = army.map((u) => ({
      ...u,
      morale: Math.max(20, u.morale - 15),
      hp: Math.max(20, u.hp - 15),
    }));
  }

  return {
    ...state,
    army,
    credits: state.credits + result.loot,
    supplies: result.victory
      ? state.supplies + Math.round(result.loot / 50)
      : Math.max(0, state.supplies - 10),
  };
}
