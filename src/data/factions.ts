import type { Faction } from "@/types/game";

export const FACTIONS: Faction[] = [
  {
    id: "solar-empire",
    name: "Solar Empire",
    motto: "Order across the void",
    color: "#d4a017",
    armyBonus: 0.1,
    shipBonus: 0.05,
    diplomacy: "aggressive",
  },
  {
    id: "void-cartel",
    name: "Void Cartel",
    motto: "Profit is the only law",
    color: "#2ecc71",
    armyBonus: 0.05,
    shipBonus: 0.15,
    diplomacy: "merchant",
  },
  {
    id: "iron-legion",
    name: "Iron Legion",
    motto: "Steel never retreats",
    color: "#c0392b",
    armyBonus: 0.2,
    shipBonus: 0,
    diplomacy: "aggressive",
  },
  {
    id: "celestial-wardens",
    name: "Celestial Wardens",
    motto: "Guard the ancient routes",
    color: "#3498db",
    armyBonus: 0.08,
    shipBonus: 0.08,
    diplomacy: "isolationist",
  },
  {
    id: "free-mariners",
    name: "Free Mariners",
    motto: "The lanes belong to no crown",
    color: "#1abc9c",
    armyBonus: 0.04,
    shipBonus: 0.18,
    diplomacy: "merchant",
  },
  {
    id: "umbral-syndicate",
    name: "Umbral Syndicate",
    motto: "Shadows settle all debts",
    color: "#9b59b6",
    armyBonus: 0.14,
    shipBonus: 0.06,
    diplomacy: "aggressive",
  },
  {
    id: "hive-ascendancy",
    name: "Hive Ascendancy",
    motto: "Many minds, one will",
    color: "#e67e22",
    armyBonus: 0.17,
    shipBonus: 0.02,
    diplomacy: "aggressive",
  },
  {
    id: "drift-clans",
    name: "Drift Clans",
    motto: "Salvage or be salvaged",
    color: "#95a5a6",
    armyBonus: 0.09,
    shipBonus: 0.1,
    diplomacy: "merchant",
  },
];

const FACTION_START: Record<string, { zoneId: string; discovered: string[] }> = {
  "solar-empire": {
    zoneId: "luna-orbit",
    discovered: ["sol-system", "terra", "luna-orbit", "mars", "sky-spire"],
  },
  "void-cartel": {
    zoneId: "proxima-prime",
    discovered: ["proxima-system", "proxima-prime", "bazaar-district", "belt"],
  },
  "iron-legion": {
    zoneId: "mars",
    discovered: ["sol-system", "mars", "rust-valley", "ash-continent"],
  },
  "celestial-wardens": {
    zoneId: "europa",
    discovered: ["veil-system", "europa", "warden-sanctum", "crystal-shore"],
  },
  "free-mariners": {
    zoneId: "orion-station",
    discovered: ["orion-expanse", "orion-station", "titan-refinery"],
  },
  "umbral-syndicate": {
    zoneId: "belt",
    discovered: ["sol-system", "belt", "mars", "smuggler-deep"],
  },
  "hive-ascendancy": {
    zoneId: "kepler-colony",
    discovered: ["orion-expanse", "kepler-colony", "swarm-hive"],
  },
  "drift-clans": {
    zoneId: "saturn-rings",
    discovered: ["sol-system", "saturn-rings", "drift-nexus", "scrap-yard"],
  },
};

const DEFAULT_START = FACTION_START["solar-empire"];

export function getFaction(id: string): Faction {
  const f = FACTIONS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown faction: ${id}`);
  return f;
}

export function getFactionStart(factionId: string): {
  zoneId: string;
  discovered: string[];
} {
  return FACTION_START[factionId] ?? DEFAULT_START;
}
