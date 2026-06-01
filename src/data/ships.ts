import type { ShipLoadout, ShipModule } from "@/types/game";

export const SHIP_MODULES: ShipModule[] = [
  { id: "hull-scout", slot: "hull", name: "Scout Corvette", power: 25, cost: 800 },
  { id: "hull-frigate", slot: "hull", name: "Frigate Hull", power: 40, cost: 2000 },
  { id: "hull-cruiser", slot: "hull", name: "Cruiser Hull", power: 70, cost: 8000 },
  { id: "hull-carrier", slot: "hull", name: "Light Carrier", power: 85, cost: 12000 },
  { id: "hull-dread", slot: "hull", name: "Dreadnought Frame", power: 110, cost: 25000 },
  { id: "hull-juggernaut", slot: "hull", name: "Juggernaut Core", power: 140, cost: 45000 },
  { id: "eng-chemical", slot: "engine", name: "Chemical Thrusters", power: 18, cost: 400 },
  { id: "eng-ion", slot: "engine", name: "Ion Drive", power: 30, cost: 1500 },
  { id: "eng-warp", slot: "engine", name: "Warp Coil", power: 55, cost: 6000 },
  { id: "eng-skip", slot: "engine", name: "Skip Drive", power: 80, cost: 15000 },
  { id: "eng-singularity", slot: "engine", name: "Singularity Sail", power: 100, cost: 32000 },
  { id: "wpn-none", slot: "weapon", name: "Empty Hardpoint", power: 0, cost: 0 },
  { id: "wpn-laser", slot: "weapon", name: "Pulse Laser", power: 25, cost: 800 },
  { id: "wpn-plasma", slot: "weapon", name: "Plasma Lance", power: 38, cost: 2200 },
  { id: "wpn-rail", slot: "weapon", name: "Rail Battery", power: 45, cost: 3500 },
  { id: "wpn-missile", slot: "weapon", name: "Missile Swarm", power: 52, cost: 5000 },
  { id: "wpn-torpedo", slot: "weapon", name: "Torpedo Bay", power: 60, cost: 7000 },
  { id: "wpn-beam", slot: "weapon", name: "Spinal Beam", power: 75, cost: 14000 },
  { id: "shd-basic", slot: "shield", name: "Deflector Grid", power: 20, cost: 1200 },
  { id: "shd-heavy", slot: "shield", name: "Aegis Plating", power: 45, cost: 5000 },
  { id: "shd-phase", slot: "shield", name: "Phase Cloak", power: 55, cost: 9000 },
  { id: "shd-fortress", slot: "shield", name: "Fortress Field", power: 70, cost: 18000 },
  { id: "cargo-light", slot: "cargo", name: "Light Hold", power: 10, cost: 500 },
  { id: "cargo-mil", slot: "cargo", name: "Troop Bay", power: 25, cost: 3000 },
  { id: "cargo-ore", slot: "cargo", name: "Ore Hauler", power: 15, cost: 1500 },
  { id: "cargo-black", slot: "cargo", name: "Smuggler Compartment", power: 20, cost: 4500 },
];

export const DEFAULT_SHIP: ShipLoadout = {
  name: "Vanguard",
  hull: "hull-frigate",
  engine: "eng-ion",
  weapons: ["wpn-laser", "wpn-none"],
  shield: "shd-basic",
  cargo: "cargo-mil",
};

export function shipPower(loadout: ShipLoadout): number {
  const ids = [
    loadout.hull,
    loadout.engine,
    loadout.shield,
    loadout.cargo,
    ...loadout.weapons.filter((id) => id !== "wpn-none"),
  ];
  return ids.reduce((sum, id) => {
    const mod = SHIP_MODULES.find((m) => m.id === id);
    return sum + (mod?.power ?? 0);
  }, 0);
}

export function modulesForSlot(slot: ShipModule["slot"]): ShipModule[] {
  return SHIP_MODULES.filter((m) => m.slot === slot);
}
