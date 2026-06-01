import type { NpcTemplate } from "@/types/visual";

export const NPC_TEMPLATES: NpcTemplate[] = [
  {
    id: "npc-iron-warlord",
    name: "Ash Warlord",
    category: "infantry",
    visualId: "warlord-horns",
    factionId: "iron-legion",
    role: "Ground boss",
    threatBonus: 25,
    combatDomain: "ground",
  },
  {
    id: "npc-solar-praetorian",
    name: "Solar Praetorian",
    category: "infantry",
    visualId: "guard-gold-armor",
    factionId: "solar-empire",
    role: "Elite guard",
    threatBonus: 12,
    combatDomain: "ground",
  },
  {
    id: "npc-marine-ranger",
    name: "Frontier Ranger",
    category: "infantry",
    visualId: "trooper-cyan-vis",
    factionId: "free-mariners",
    role: "Line infantry",
    threatBonus: 5,
    combatDomain: "ground",
  },
  {
    id: "npc-syndicate-ops",
    name: "Night Operative",
    category: "infantry",
    visualId: "operative-shadow",
    factionId: "umbral-syndicate",
    role: "Infiltrator",
    threatBonus: 10,
    combatDomain: "ground",
  },
  {
    id: "npc-warden-archon",
    name: "Archon Caelis",
    category: "officer",
    visualId: "archon-leader",
    factionId: "celestial-wardens",
    role: "Faction leader",
    threatBonus: 15,
    combatDomain: "both",
  },
  {
    id: "npc-solar-commodore",
    name: "Fleet Commodore",
    category: "officer",
    visualId: "officer-black-coat",
    factionId: "solar-empire",
    role: "Fleet commander",
    threatBonus: 12,
    combatDomain: "space",
  },
  {
    id: "npc-hex-walker",
    name: "Hex Siege Walker",
    category: "mech",
    visualId: "walker-sixleg",
    factionId: "iron-legion",
    role: "Siege mech",
    threatBonus: 35,
    combatDomain: "ground",
  },
  {
    id: "npc-forge-walker",
    name: "Forge Walker",
    category: "mech",
    visualId: "mech-hangar-heavy",
    factionId: "iron-legion",
    role: "Heavy mech",
    threatBonus: 30,
    combatDomain: "ground",
  },
  {
    id: "npc-aegis-titan",
    name: "Aegis Titan",
    category: "mech",
    visualId: "mech-missile-white",
    factionId: "celestial-wardens",
    role: "Titan",
    threatBonus: 40,
    combatDomain: "both",
  },
  {
    id: "npc-reaver-strider",
    name: "Reaver Strider",
    category: "mech",
    visualId: "bike-mech-raid",
    factionId: "void-cartel",
    role: "Raider mech",
    threatBonus: 18,
    combatDomain: "ground",
  },
  {
    id: "npc-hive-drone",
    name: "REX Scout Drone",
    category: "mech",
    visualId: "drone-scout",
    factionId: "hive-ascendancy",
    role: "Swarm scout",
    threatBonus: 8,
    combatDomain: "ground",
  },
  {
    id: "npc-fist-dominion",
    name: "Fist of Dominion",
    category: "spaceship",
    visualId: "capitol-vertical",
    factionId: "iron-legion",
    role: "Capital ship",
    threatBonus: 45,
    combatDomain: "space",
  },
  {
    id: "npc-hover-battle",
    name: "Hover Battleship",
    category: "spaceship",
    visualId: "battleship-city",
    factionId: "solar-empire",
    role: "Battleship",
    threatBonus: 35,
    combatDomain: "space",
  },
  {
    id: "npc-neon-fang",
    name: "Neon Fang",
    category: "spaceship",
    visualId: "interceptor-neon",
    factionId: "void-cartel",
    role: "Interceptor",
    threatBonus: 15,
    combatDomain: "space",
  },
  {
    id: "npc-ghost-sub",
    name: "Ghost Submersible",
    category: "naval",
    visualId: "sub-stealth",
    factionId: "umbral-syndicate",
    role: "Stealth sub",
    threatBonus: 20,
    combatDomain: "space",
  },
  {
    id: "npc-storm-gunship",
    name: "Stormhammer Gunship",
    category: "air",
    visualId: "gunship-ac130",
    factionId: "solar-empire",
    role: "Gunship",
    threatBonus: 22,
    combatDomain: "ground",
  },
  {
    id: "npc-obsidian-mbt",
    name: "Obsidian MBT",
    category: "vehicle",
    visualId: "tank-column",
    factionId: "umbral-syndicate",
    role: "Main battle tank",
    threatBonus: 18,
    combatDomain: "ground",
  },
];

export function getNpc(id: string): NpcTemplate {
  const n = NPC_TEMPLATES.find((x) => x.id === id);
  if (!n) throw new Error(`Unknown NPC: ${id}`);
  return n;
}

export function npcsForZoneFaction(
  controllingFactionId: string | undefined,
  domain: "ground" | "space"
): NpcTemplate[] {
  if (!controllingFactionId) {
    return NPC_TEMPLATES.filter((n) => n.combatDomain === domain || n.combatDomain === "both");
  }
  return NPC_TEMPLATES.filter(
    (n) =>
      n.factionId === controllingFactionId &&
      (n.combatDomain === domain || n.combatDomain === "both")
  );
}

export function pickZoneNpc(
  controllingFactionId: string | undefined,
  domain: "ground" | "space",
  threat: number
): NpcTemplate {
  const pool = npcsForZoneFaction(controllingFactionId, domain);
  const candidates = pool.length > 0 ? pool : NPC_TEMPLATES;
  const idx = Math.min(candidates.length - 1, Math.floor(threat / 3));
  return candidates[idx] ?? candidates[0];
}
