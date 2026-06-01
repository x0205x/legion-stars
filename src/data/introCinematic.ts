export interface IntroSlide {
  image: string;
  title?: string;
  subtitle?: string;
  factionId?: string;
  factionTitle?: string;
  beat?: "cut" | "flash" | "hold";
  durationMs: number;
}

export const INTRO_AUDIO = {
  musicPath: "/assets/intro/intro-music.mp3",
  transitionSfxPath: "/assets/intro/transition-sfx.mp3",
  musicVolume: 0.42,
  sfxVolume: 0.26,
} as const;

/** Story order: new references first, then full universe montage */
export const INTRO_SLIDES: IntroSlide[] = [
  {
    image: "/assets/intro/orbital-strike.png",
    title: "CONQUER THE UNIVERSE",
    subtitle: "The war for the void begins",
    beat: "flash",
    durationMs: 4500,
  },
  {
    image: "/assets/intro/capital-wormhole.png",
    subtitle: "Empires rise beyond the rim",
    factionId: "solar-empire",
    factionTitle: "Solar Command",
    durationMs: 3200,
  },
  {
    image: "/assets/intro/cliff-fleet.png",
    subtitle: "Legions march under crimson banners",
    durationMs: 3000,
  },
  {
    image: "/assets/intro/sky-carrier.png",
    subtitle: "Carriers rule the storm seas of the sky",
    durationMs: 2800,
  },
  {
    image: "/assets/intro/submarine-surface.png",
    subtitle: "Shadows beneath the waves",
    durationMs: 2600,
  },
  {
    image: "/assets/intro/harbor-dock.png",
    subtitle: "Industrial worlds never sleep",
    durationMs: 2600,
  },
  {
    image: "/assets/intro/missile-battery.png",
    subtitle: "Steel rain before the assault",
    beat: "cut",
    durationMs: 2800,
  },
  {
    image: "/assets/intro/command-tablet.png",
    subtitle: "Command the battle — or fight it yourself",
    durationMs: 3200,
  },
  { image: "/assets/intro/env-nebula-fleet.png", durationMs: 2200 },
  { image: "/assets/intro/capitol-vertical.png", subtitle: "Forge your fleet", durationMs: 2200 },
  {
    image: "/assets/intro/battleship-city.png",
    factionId: "free-mariners",
    beat: "cut",
    durationMs: 2000,
  },
  { image: "/assets/intro/dreadnought-space.png", durationMs: 2000 },
  { image: "/assets/intro/cruiser-fleet.png", factionId: "drift-clans", durationMs: 2000 },
  { image: "/assets/intro/interceptor-neon.png", factionId: "void-cartel", durationMs: 2000 },
  {
    image: "/assets/intro/warlord-horns.png",
    subtitle: "Lead your armies",
    factionId: "iron-legion",
    durationMs: 2200,
  },
  { image: "/assets/intro/walker-sixleg.png", beat: "cut", durationMs: 2000 },
  { image: "/assets/intro/mech-missile-white.png", factionId: "celestial-wardens", durationMs: 2000 },
  { image: "/assets/intro/mech-hangar-heavy.png", durationMs: 2000 },
  { image: "/assets/intro/mech-fortress.png", factionId: "drift-clans", beat: "cut", durationMs: 1800 },
  { image: "/assets/intro/mech-artillery.png", factionId: "hive-ascendancy", durationMs: 1800 },
  { image: "/assets/intro/bike-mech-raid.png", durationMs: 2000 },
  { image: "/assets/intro/guard-gold-armor.png", factionId: "solar-empire", durationMs: 2000 },
  { image: "/assets/intro/operative-shadow.png", factionId: "umbral-syndicate", durationMs: 2000 },
  { image: "/assets/intro/trooper-cyan-vis.png", durationMs: 2000 },
  { image: "/assets/intro/gunship-ac130.png", durationMs: 2000 },
  { image: "/assets/intro/sub-stealth.png", durationMs: 2000 },
  { image: "/assets/intro/archon-leader.png", durationMs: 2000 },
  { image: "/assets/intro/officer-black-coat.png", durationMs: 2000 },
  { image: "/assets/intro/env-launch.png", durationMs: 2200 },
  { image: "/assets/intro/env-station.png", durationMs: 2000 },
  { image: "/assets/intro/env-alien.png", durationMs: 2000 },
  {
    image: "/assets/intro/env-witness.png",
    title: "YOUR COMMAND AWAITS",
    subtitle: "FPS assault · RTS command · MMO conquest",
    durationMs: 4000,
  },
];

/** Prefer bundled MP4 when present (run npm run build:intro) */
export const INTRO_VIDEO_PATH = "/assets/intro/intro.mp4";
