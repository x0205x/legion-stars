import type { ArmyUnit, SoldierClass, SoldierLoadout } from "@/types/game";

export const SOLDIER_CLASSES: SoldierClass[] = [
  { id: "line", name: "Line Infantry", role: "Frontline", baseHp: 100, baseAtk: 12, baseDef: 8 },
  { id: "skirm", name: "Skirmisher", role: "Flanker", baseHp: 80, baseAtk: 16, baseDef: 5 },
  { id: "heavy", name: "Heavy Trooper", role: "Anchor", baseHp: 140, baseAtk: 10, baseDef: 14 },
  { id: "medic", name: "Field Medic", role: "Support", baseHp: 90, baseAtk: 6, baseDef: 6 },
  { id: "officer", name: "Tactical Officer", role: "Command", baseHp: 95, baseAtk: 14, baseDef: 10 },
  { id: "sniper", name: "Marksman", role: "Precision", baseHp: 75, baseAtk: 22, baseDef: 4 },
  { id: "engineer", name: "Combat Engineer", role: "Utility", baseHp: 85, baseAtk: 9, baseDef: 11 },
  { id: "breacher", name: "Breacher", role: "Assault", baseHp: 110, baseAtk: 18, baseDef: 7 },
  { id: "drone-op", name: "Drone Operator", role: "Control", baseHp: 70, baseAtk: 11, baseDef: 5 },
  { id: "cavalry", name: "Hover Cavalry", role: "Shock", baseHp: 105, baseAtk: 17, baseDef: 6 },
];

export const ARMOR = [
  { id: "cloth", name: "Fatigues", def: 2, cost: 0 },
  { id: "plate", name: "Combat Plate", def: 6, cost: 400 },
  { id: "carapace", name: "Carapace Suit", def: 9, cost: 1200 },
  { id: "exo", name: "Exo Frame", def: 12, cost: 2000 },
  { id: "warden", name: "Warden Weave", def: 15, cost: 4500 },
  { id: "hive-chitin", name: "Hive Chitin", def: 10, cost: 800 },
];

export const WEAPONS = [
  { id: "rifle", name: "Assault Rifle", atk: 8, cost: 0 },
  { id: "shotgun", name: "Breacher Shotgun", atk: 12, cost: 250 },
  { id: "lmg", name: "Squad LMG", atk: 14, cost: 600 },
  { id: "sniper-rifle", name: "Longrifle", atk: 20, cost: 1100 },
  { id: "rail-sidearm", name: "Rail Sidearm", atk: 18, cost: 1500 },
  { id: "arc-lance", name: "Arc Lance", atk: 24, cost: 3200 },
  { id: "hive-spine", name: "Spine Caster", atk: 16, cost: 900 },
];

export const GADGETS = [
  { id: "none", name: "None", bonus: 0, cost: 0 },
  { id: "drone", name: "Scout Drone", bonus: 5, cost: 300 },
  { id: "shield-pack", name: "Shield Pack", bonus: 8, cost: 800 },
  { id: "medfoam", name: "Medfoam Injector", bonus: 4, cost: 350 },
  { id: "grapple", name: "Grapple Harness", bonus: 6, cost: 500 },
  { id: "ecm", name: "ECM Beacon", bonus: 10, cost: 1400 },
];

export const DEFAULT_SQUAD: SoldierLoadout[] = [
  { name: "Alpha-1", classId: "line", armorId: "cloth", weaponId: "rifle", gadgetId: "none" },
  { name: "Alpha-2", classId: "skirm", armorId: "cloth", weaponId: "rifle", gadgetId: "drone" },
  { name: "Alpha-3", classId: "heavy", armorId: "plate", weaponId: "lmg", gadgetId: "none" },
  { name: "Alpha-4", classId: "medic", armorId: "cloth", weaponId: "rifle", gadgetId: "medfoam" },
];

const FALLBACK_CLASS = SOLDIER_CLASSES[0];
const FALLBACK_ARMOR = ARMOR[0];
const FALLBACK_WEAPON = WEAPONS[0];
const FALLBACK_GADGET = GADGETS[0];

export function soldierStats(loadout: SoldierLoadout): { hp: number; atk: number; def: number } {
  const cls = SOLDIER_CLASSES.find((c) => c.id === loadout.classId) ?? FALLBACK_CLASS;
  const armor = ARMOR.find((a) => a.id === loadout.armorId) ?? FALLBACK_ARMOR;
  const weapon = WEAPONS.find((w) => w.id === loadout.weaponId) ?? FALLBACK_WEAPON;
  const gadget = GADGETS.find((g) => g.id === loadout.gadgetId) ?? FALLBACK_GADGET;
  return {
    hp: cls.baseHp,
    atk: cls.baseAtk + weapon.atk + gadget.bonus,
    def: cls.baseDef + armor.def,
  };
}

export function createArmyFromLoadouts(loadouts: SoldierLoadout[]): ArmyUnit[] {
  return loadouts.map((loadout, i) => {
    const stats = soldierStats(loadout);
    return {
      id: `unit-${i}-${loadout.name}`,
      loadout,
      hp: stats.hp,
      morale: 100,
    };
  });
}

export function armyPower(units: ArmyUnit[]): number {
  return units.reduce((sum, u) => {
    const s = soldierStats(u.loadout);
    return sum + s.atk + s.def + u.hp * 0.1 + u.morale * 0.05;
  }, 0);
}
