import type { Zone } from "@/types/game";

const RAW_ZONES: Zone[] = [
  // —— Systems ——
  {
    id: "sol-system",
    name: "Sol System",
    scale: "system",
    parentId: null,
    description: "Humanity's cradle among the stars.",
    threat: 2,
    resources: ["helium-3", "trade-routes"],
    connections: ["proxima-system", "orion-expanse", "drift-nexus"],
    position: [0, 0, 0],
    controllingFaction: "solar-empire",
  },
  {
    id: "proxima-system",
    name: "Proxima System",
    scale: "system",
    parentId: null,
    description: "Frontier systems contested by cartels and legions.",
    threat: 5,
    resources: ["rare-ores", "smuggler-hubs"],
    connections: ["sol-system", "veil-system", "orion-expanse"],
    position: [120, 20, -40],
    controllingFaction: "void-cartel",
  },
  {
    id: "veil-system",
    name: "Veil Nebula",
    scale: "system",
    parentId: null,
    description: "Ancient wrecks and warden vaults in violet fog.",
    threat: 7,
    resources: ["relic-tech", "dark-matter"],
    connections: ["proxima-system", "helio-reach"],
    position: [-80, 60, 90],
    controllingFaction: "celestial-wardens",
  },
  {
    id: "orion-expanse",
    name: "Orion Expanse",
    scale: "system",
    parentId: null,
    description: "Industrial corridors patrolled by Free Mariners.",
    threat: 4,
    resources: ["refined-fuel", "ship-grade steel"],
    connections: ["sol-system", "proxima-system", "helio-reach"],
    position: [160, 15, 50],
    controllingFaction: "free-mariners",
  },
  {
    id: "helio-reach",
    name: "Helio Reach",
    scale: "system",
    parentId: null,
    description: "Bleeding-edge colonies on the rim — high risk, high reward.",
    threat: 9,
    resources: ["prototype-tech", "xeno-artifacts"],
    connections: ["veil-system", "orion-expanse"],
    position: [-140, 40, -70],
    controllingFaction: "hive-ascendancy",
  },
  {
    id: "drift-nexus",
    name: "Drift Nexus",
    scale: "system",
    parentId: null,
    description: "Scrapyard constellations ruled by roaming clans.",
    threat: 6,
    resources: ["salvage", "black-market parts"],
    connections: ["sol-system"],
    position: [30, -70, -90],
    controllingFaction: "drift-clans",
  },

  // —— Sol planets ——
  {
    id: "terra",
    name: "Terra",
    scale: "planet",
    parentId: "sol-system",
    description: "Capital world of the Solar Empire.",
    threat: 1,
    resources: ["manpower", "industry"],
    connections: ["mars", "luna-orbit", "venus-orbit"],
    position: [10, 0, 5],
    controllingFaction: "solar-empire",
  },
  {
    id: "mars",
    name: "Mars",
    scale: "planet",
    parentId: "sol-system",
    description: "Forge-world red deserts — Iron Legion stronghold.",
    threat: 3,
    resources: ["alloys", "fuel"],
    connections: ["terra", "belt", "saturn-rings"],
    position: [25, 0, 8],
    controllingFaction: "iron-legion",
  },
  {
    id: "luna-orbit",
    name: "Luna Orbit",
    scale: "planet",
    parentId: "sol-system",
    description: "Imperial shipyards and fleet command.",
    threat: 2,
    resources: ["ship-parts", "officers"],
    connections: ["terra", "venus-orbit"],
    position: [12, 5, 4],
    controllingFaction: "solar-empire",
  },
  {
    id: "venus-orbit",
    name: "Venus Orbit",
    scale: "planet",
    parentId: "sol-system",
    description: "Cloud platforms and atmospheric refineries.",
    threat: 3,
    resources: ["chemicals", "sensors"],
    connections: ["luna-orbit", "terra"],
    position: [14, 12, 3],
    controllingFaction: "solar-empire",
  },
  {
    id: "saturn-rings",
    name: "Saturn Rings",
    scale: "planet",
    parentId: "sol-system",
    description: "Drift Clan fleets hide among the ice shards.",
    threat: 5,
    resources: ["ice-fuel", "scrap"],
    connections: ["mars", "scrap-yard"],
    position: [45, 8, -10],
    controllingFaction: "drift-clans",
  },
  {
    id: "belt",
    name: "Asteroid Belt",
    scale: "planet",
    parentId: "sol-system",
    description: "Lawless mining claims and syndicate cells.",
    threat: 6,
    resources: ["ore", "contraband"],
    connections: ["mars", "proxima-prime", "smuggler-deep"],
    position: [40, -5, 15],
    controllingFaction: "umbral-syndicate",
  },

  // —— Proxima planets ——
  {
    id: "proxima-prime",
    name: "Proxima Prime",
    scale: "planet",
    parentId: "proxima-system",
    description: "Cartel trade capital on a tidally locked world.",
    threat: 4,
    resources: ["credits", "mercenaries"],
    connections: ["belt", "ash-continent", "bazaar-district"],
    position: [100, 0, 0],
    controllingFaction: "void-cartel",
  },

  // —— Veil planets ——
  {
    id: "europa",
    name: "Europa",
    scale: "planet",
    parentId: "veil-system",
    description: "Ice moon hiding warden vaults.",
    threat: 8,
    resources: ["relics", "cryo-cores"],
    connections: ["crystal-shore", "warden-sanctum", "helio-gate"],
    position: [-70, 0, 50],
    controllingFaction: "celestial-wardens",
  },

  // —— Orion planets ——
  {
    id: "orion-station",
    name: "Orion Station",
    scale: "planet",
    parentId: "orion-expanse",
    description: "Neutral dock where Mariners broker passage.",
    threat: 2,
    resources: ["crew", "maps"],
    connections: ["titan-refinery", "kepler-colony"],
    position: [155, 5, 45],
    controllingFaction: "free-mariners",
  },
  {
    id: "titan-refinery",
    name: "Titan Refinery",
    scale: "planet",
    parentId: "orion-expanse",
    description: "Megastructure fuel plants orbiting a gas giant.",
    threat: 4,
    resources: ["hydrogen", "coolant"],
    connections: ["orion-station"],
    position: [168, -8, 55],
    controllingFaction: "free-mariners",
  },
  {
    id: "kepler-colony",
    name: "Kepler Colony",
    scale: "planet",
    parentId: "orion-expanse",
    description: "Hive bio-domes spreading across a green world.",
    threat: 6,
    resources: ["biomass", "swarm-tech"],
    connections: ["orion-station", "swarm-hive"],
    position: [172, 0, 38],
    controllingFaction: "hive-ascendancy",
  },

  // —— Helio planets ——
  {
    id: "helio-gate",
    name: "Helio Gate",
    scale: "planet",
    parentId: "helio-reach",
    description: "Ancient jump gate humming with unstable energy.",
    threat: 9,
    resources: ["gate-keys", "exotic fuel"],
    connections: ["europa", "obsidian-moon"],
    position: [-130, 10, -60],
    controllingFaction: "celestial-wardens",
  },
  {
    id: "obsidian-moon",
    name: "Obsidian Moon",
    scale: "planet",
    parentId: "helio-reach",
    description: "Volcanic moon — syndicate black labs rumored below.",
    threat: 10,
    resources: ["weapons research", "prison labor"],
    connections: ["helio-gate"],
    position: [-145, -5, -75],
    controllingFaction: "umbral-syndicate",
  },

  // —— Drift ——
  {
    id: "scrap-yard",
    name: "The Scrap Yard",
    scale: "planet",
    parentId: "drift-nexus",
    description: "Kilometers of welded hulls — clan capital.",
    threat: 5,
    resources: ["parts", "blueprints"],
    connections: ["saturn-rings"],
    position: [35, -65, -85],
    controllingFaction: "drift-clans",
  },

  // —— Continents & surface zones ——
  {
    id: "sky-spire",
    name: "Sky Spire",
    scale: "continent",
    parentId: "terra",
    description: "Mountain citadel — elite imperial garrison.",
    threat: 4,
    resources: ["elite-gear"],
    connections: ["imperial-plains"],
    position: [11, 8, 6],
    controllingFaction: "solar-empire",
  },
  {
    id: "imperial-plains",
    name: "Imperial Plains",
    scale: "continent",
    parentId: "terra",
    description: "Breadbasket continents and parade grounds.",
    threat: 2,
    resources: ["food", "recruits"],
    connections: ["sky-spire"],
    position: [9, 0, 7],
    controllingFaction: "solar-empire",
  },
  {
    id: "rust-valley",
    name: "Rust Valley",
    scale: "continent",
    parentId: "mars",
    description: "Siege ranges where Iron Legion grinds recruits.",
    threat: 5,
    resources: ["tanks", "artillery"],
    connections: ["ash-continent"],
    position: [26, 0, 9],
    controllingFaction: "iron-legion",
  },
  {
    id: "ash-continent",
    name: "Ash Wastes",
    scale: "continent",
    parentId: "proxima-prime",
    description: "War-torn landmass — ideal for army battles.",
    threat: 7,
    resources: ["salvage", "recruits"],
    connections: ["iron-coast", "rust-valley", "bazaar-district"],
    position: [102, 0, 2],
    controllingFaction: "iron-legion",
  },
  {
    id: "iron-coast",
    name: "Iron Coast",
    scale: "continent",
    parentId: "proxima-prime",
    description: "Amphibious assault training grounds.",
    threat: 5,
    resources: ["naval-parts"],
    connections: ["ash-continent"],
    position: [104, 0, -3],
    controllingFaction: "iron-legion",
  },
  {
    id: "bazaar-district",
    name: "Night Bazaar",
    scale: "continent",
    parentId: "proxima-prime",
    description: "Neon sprawl of contracts, spice, and stolen ships.",
    threat: 4,
    resources: ["contracts", "intel"],
    connections: ["ash-continent", "smuggler-deep"],
    position: [101, 2, -1],
    controllingFaction: "void-cartel",
  },
  {
    id: "smuggler-deep",
    name: "Smuggler Deep",
    scale: "continent",
    parentId: "belt",
    description: "Hollowed asteroids — syndicate shadow market.",
    threat: 8,
    resources: ["contraband", "forged IDs"],
    connections: ["bazaar-district", "belt"],
    position: [41, -8, 14],
    controllingFaction: "umbral-syndicate",
  },
  {
    id: "crystal-shore",
    name: "Crystal Shore",
    scale: "continent",
    parentId: "europa",
    description: "Frozen beaches where wardens train initiates.",
    threat: 6,
    resources: ["cryo-weapons"],
    connections: ["warden-sanctum"],
    position: [-68, 0, 52],
    controllingFaction: "celestial-wardens",
  },
  {
    id: "warden-sanctum",
    name: "Warden Sanctum",
    scale: "continent",
    parentId: "europa",
    description: "Relic cathedral buried under ice.",
    threat: 8,
    resources: ["relic-blades", "wards"],
    connections: ["crystal-shore"],
    position: [-72, 4, 48],
    controllingFaction: "celestial-wardens",
  },
  {
    id: "swarm-hive",
    name: "Brood Pits",
    scale: "continent",
    parentId: "kepler-colony",
    description: "Chitin spires pulsing with hive signal.",
    threat: 7,
    resources: ["spores", "chitin-plates"],
    connections: ["kepler-colony"],
    position: [173, -2, 40],
    controllingFaction: "hive-ascendancy",
  },
];

/** Ensure travel links work both ways */
function symmetrizeConnections(zones: Zone[]): Zone[] {
  const byId = new Map(zones.map((z) => [z.id, { ...z, connections: [...z.connections] }]));
  for (const z of zones) {
    for (const targetId of z.connections) {
      const other = byId.get(targetId);
      if (other && !other.connections.includes(z.id)) {
        other.connections.push(z.id);
      }
    }
  }
  return [...byId.values()];
}

export const ZONES: Zone[] = symmetrizeConnections(RAW_ZONES);

export function getZone(id: string): Zone {
  const z = ZONES.find((x) => x.id === id);
  if (!z) throw new Error(`Unknown zone: ${id}`);
  return z;
}

export function zonesInSystem(systemId: string): Zone[] {
  return ZONES.filter((z) => z.parentId === systemId || z.id === systemId);
}

export function childZones(parentId: string): Zone[] {
  return ZONES.filter((z) => z.parentId === parentId);
}

export function zoneCount(): { systems: number; planets: number; continents: number } {
  return {
    systems: ZONES.filter((z) => z.scale === "system").length,
    planets: ZONES.filter((z) => z.scale === "planet").length,
    continents: ZONES.filter((z) => z.scale === "continent").length,
  };
}
