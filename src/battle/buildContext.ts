import { getFaction } from "@/data/factions";
import { pickZoneNpc } from "@/data/npcTemplates";
import { armyPower, soldierStats } from "@/data/soldiers";
import { shipPower } from "@/data/ships";
import { getVisual } from "@/data/visualAssets";
import { getZone } from "@/data/zones";
import type { PlayerState } from "@/types/game";
import type { BattleContext, BattleDomain, BattleMode } from "@/battle/types";

export function buildBattleContext(
  state: PlayerState,
  domain: BattleDomain,
  mode: BattleMode
): BattleContext {
  const zone = getZone(state.currentZoneId);
  const opponent = pickZoneNpc(zone.controllingFaction, domain, zone.threat);
  const visual = getVisual(opponent.visualId);

  let playerMaxHp = 100;
  let playerDamage = 12;

  if (domain === "ground" && state.army.length > 0) {
    const stats = state.army.map((u) => soldierStats(u.loadout));
    playerMaxHp = Math.round(
      stats.reduce((s, x) => s + x.hp, 0) / stats.length + state.army.length * 8
    );
    playerDamage = Math.round(
      stats.reduce((s, x) => s + x.atk, 0) / stats.length
    );
  } else {
    const power = shipPower(state.ship);
    playerMaxHp = Math.round(80 + power * 0.8);
    playerDamage = Math.round(10 + power * 0.15);
  }

  const faction = getFaction(state.factionId);
  const bonus = domain === "ground" ? faction.armyBonus : faction.shipBonus;
  playerDamage = Math.round(playerDamage * (1 + bonus));

  return {
    domain,
    mode,
    zoneName: zone.name,
    threat: zone.threat,
    factionColor: faction.color,
    squadSize: domain === "ground" ? state.army.length : 1,
    playerMaxHp,
    playerDamage,
    opponent,
    opponentImage: visual.image,
  };
}

export function estimateArmyPower(state: PlayerState): number {
  return armyPower(state.army);
}
