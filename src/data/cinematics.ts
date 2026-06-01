import type { CinematicScene } from "@/types/visual";
import { getVisual } from "@/data/visualAssets";

function beat(visualId: string, caption: string, durationMs = 4200): CinematicScene["beats"][0] {
  return {
    image: getVisual(visualId).image,
    caption,
    durationMs,
  };
}

export const CINEMATIC_SCENES: CinematicScene[] = [
  {
    id: "deploy-solar",
    title: "Imperial Mandate",
    subtitle: "Solar Empire deployment",
    factionId: "solar-empire",
    trigger: "deploy",
    beats: [
      beat("officer-black-coat", "Commodore receives fleet writ at Luna Orbit."),
      beat("battleship-city", "Hover battleships cast shadows over the shipyards."),
      beat("guard-gold-armor", "Praetorian cohorts board the assault corridors."),
    ],
  },
  {
    id: "deploy-iron",
    title: "Iron March",
    subtitle: "Iron Legion deployment",
    factionId: "iron-legion",
    trigger: "deploy",
    beats: [
      beat("warlord-horns", "Warlords bless the Ash Wastes campaign."),
      beat("walker-sixleg", "Hex walkers grind forward under red dust."),
      beat("capitol-vertical", "The Fist of Dominion rises from the forge moons."),
    ],
  },
  {
    id: "deploy-wardens",
    title: "Warden Vigil",
    subtitle: "Celestial Wardens deployment",
    factionId: "celestial-wardens",
    trigger: "deploy",
    beats: [
      beat("archon-leader", "Archon Caelis opens the relic gates."),
      beat("mech-missile-white", "Aegis Titans stand watch over the ice cathedrals."),
      beat("env-witness", "Silence falls across the Veil — the hunt begins."),
    ],
  },
  {
    id: "deploy-cartel",
    title: "Cartel Contract",
    subtitle: "Void Cartel deployment",
    factionId: "void-cartel",
    trigger: "deploy",
    beats: [
      beat("interceptor-neon", "Neon Fangs scatter customs patrols."),
      beat("bike-mech-raid", "Reaver Striders hit the Night Bazaar docks."),
      beat("env-nebula-fleet", "Profit convoys slip into the nebula lanes."),
    ],
  },
  {
    id: "deploy-syndicate",
    title: "Shadow Ledger",
    subtitle: "Umbral Syndicate deployment",
    factionId: "umbral-syndicate",
    trigger: "deploy",
    beats: [
      beat("operative-shadow", "Operatives ghost-link through blacked-out corridors."),
      beat("sub-stealth", "Ghost submersibles surface in the belt harbors."),
      beat("tank-column", "Obsidian columns roll without insignia."),
    ],
  },
  {
    id: "deploy-hive",
    title: "Brood Signal",
    subtitle: "Hive Ascendancy deployment",
    factionId: "hive-ascendancy",
    trigger: "deploy",
    beats: [
      beat("drone-scout", "Scout drones map the Kepler bio-domes."),
      beat("mech-artillery", "Shellstorm platforms chant in unison."),
      beat("env-alien", "Spore clouds swallow the horizon."),
    ],
  },
  {
    id: "deploy-mariners",
    title: "Free Passage",
    subtitle: "Free Mariners deployment",
    factionId: "free-mariners",
    trigger: "deploy",
    beats: [
      beat("trooper-cyan-vis", "Rangers claim the Orion lanes for open transit."),
      beat("cruiser-fleet", "Escort cruisers fan out from the station ring."),
      beat("env-station", "Dockmasters clear every berth — paid in advance."),
    ],
  },
  {
    id: "deploy-drift",
    title: "Salvage Rights",
    subtitle: "Drift Clans deployment",
    factionId: "drift-clans",
    trigger: "deploy",
    beats: [
      beat("mech-fortress", "Bastion walkers stomp through the Scrap Yard."),
      beat("raider-hybrid", "Crawler columns drag wrecks into the ring."),
      beat("env-industrial", "Forge sparks light the clan banners."),
    ],
  },
  {
    id: "travel-warp",
    title: "Transit Burn",
    trigger: "travel",
    beats: [
      beat("env-launch", "Engines ignite — the lane opens."),
      beat("env-nebula-fleet", "Stars streak past the hull."),
      beat("env-station", "New coordinates lock on approach."),
    ],
  },
  {
    id: "battle-ground",
    title: "Ground Contact",
    trigger: "ground-battle",
    beats: [
      beat("gunship-ac130", "Gunships rake the forward line."),
      beat("walker-sixleg", "Mech boots shake the continent shelf."),
      beat("warlord-horns", "Enemy command enters the kill box."),
    ],
  },
  {
    id: "battle-space",
    title: "Fleet Engagement",
    trigger: "space-battle",
    beats: [
      beat("dreadnought-space", "Main batteries cycle in the void."),
      beat("interceptor-neon", "Interceptors knife through escort screens."),
      beat("capitol-vertical", "A capital signature blooms on sensors."),
    ],
  },
];

const DEFAULT_DEPLOY = CINEMATIC_SCENES.find((s) => s.id === "deploy-solar")!;

export function cinematicForDeploy(factionId: string): CinematicScene {
  return (
    CINEMATIC_SCENES.find((s) => s.trigger === "deploy" && s.factionId === factionId) ??
    DEFAULT_DEPLOY
  );
}

export function cinematicForTrigger(
  trigger: CinematicScene["trigger"],
  factionId?: string
): CinematicScene | null {
  if (trigger === "deploy" && factionId) return cinematicForDeploy(factionId);
  const matches = CINEMATIC_SCENES.filter((s) => s.trigger === trigger);
  if (matches.length === 0) return null;
  if (factionId) {
    const pref = matches.find((s) => s.factionId === factionId);
    if (pref) return pref;
  }
  return matches[0];
}

export function galleryScenes(): CinematicScene[] {
  return CINEMATIC_SCENES;
}
