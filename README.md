# Conquer the Universe

Made a 2D RTS Game with Claude\Blender\cursor Ai, Still a work in-progress
Browser-based prototype of an MMO-style grand strategy game combining **army command** (Conqueror's Blade–style ground battles), **custom fleets** and **multi-scale travel** (X4 Foundations–style systems → planets → continents), **factions**, and **soldier/ship customization**.
<img width="600" height="600" alt="giphy" src="https://github.com/user-attachments/assets/d789eeb1-97b9-4a67-bba4-ec5d33e59204" />

## Quick start (browser)

```bash
cd legion-stars
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Windows `.exe` (desktop app)

Build **both** the portable executable and the installer.

**Use Windows PowerShell** (Start menu → PowerShell), not only the Cursor terminal — Cursor can shadow `node` with its own helper and break `npm install`.

```powershell
cd C:\Users\"yourMchaineName"\legion-stars
npm run pack:win
```

Or run the script directly (writes `pack.log` on failure):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\pack-windows.ps1
```

Outputs in `release/`:

- `ConquerTheUniverse-0.1.0-Portable.exe` — single portable executable (double-click, no install)
- `ConquerTheUniverse-0.1.0-Setup.exe` — NSIS installer (installs to Program Files + Start Menu)

Portable-only variant:

```bash
npm run pack:portable
```

The production build (`vite build`) is decoupled from type-checking so a stray
unused variable can't block packaging. Run the strict type check separately:

```bash
npm run typecheck
```

Run the game window (not browser):

```bash
npm run electron:dev
```

### Packaging troubleshooting

| Symptom | Fix |
|--------|-----|
| `Cannot find module 'readable-stream'` when running `npm` | Your Node install’s bundled `npm` is broken. Use **`corepack npm install`** or run **`npm run pack:win`** (the script uses corepack). Or reinstall [Node.js LTS](https://nodejs.org/). |
| `FAILED: npm install` but pack.log shows npm **help** text | Fixed in `scripts/pack-windows.ps1` (PowerShell was eating the `install` argument). Pull latest script and run again. |
| `Cannot create symbolic link` during electron-builder | Fixed in this repo via `signAndEditExecutable: false`. If it persists, enable **Developer Mode** in Windows Settings → System → For developers. |
| `npm` / `node` fails instantly in Cursor with no output | Run from **Windows PowerShell**, or use `scripts\pack-windows.ps1` |
| `node_modules` missing | `corepack npm install` in the project folder |
| Build failed | Open `pack.log` in the project root and check the last lines |
| Windows SmartScreen warning | Expected for unsigned builds — choose “More info” → “Run anyway” |

## Controls guide

A **controls overlay** appears when you:

- **Deploy** or **Continue** a campaign
- Click **Engage** in FPS combat
- Start **RTS Command** (Begin command)
- Press **Controls** on the title screen or in-game top bar

Press **Enter**, **Escape**, or **Continue** to dismiss.

## Opening intro cinematic

On every launch, a **cinematic intro** plays automatically:

- Fullscreen montage using all copied reference images (`manifest.json`)
- Faction logo/title cards during key beats
- Timed music + transition SFX hooks (optional local audio files)
- Hard-cut/flash beat markers on major transition shots
- Final stinger card: **Press Any Key to Command**
- Plays `intro.mp4` if present, otherwise uses the built-in slideshow engine

**Prepare assets (required once):**

```bash
npm run assets:intro
```

**Optional — render a real MP4** (needs [ffmpeg](https://ffmpeg.org/) installed):

```bash
npm run build:intro
```

Skip anytime: **Esc**, **Enter**, or **Skip intro**.

The packaged `.exe` includes `public/assets/intro` when you run `npm run assets:intro` before `npm run pack:portable`.

Optional audio files you can drop in:

- `public/assets/intro/intro-music.mp3`
- `public/assets/intro/transition-sfx.mp3`

## Content (current)

| Category | Count |
|----------|------:|
| Factions | 8 |
| Star systems | 6 |
| Planets / moons | 16 |
| Surface battlegrounds | 11 |
| Ship modules | 26 |
| Soldier classes | 10 |
| Armor / weapons / gadgets | 6 / 7 / 6 |

Each faction starts at its homeworld with nearby zones already discovered.

## Play loop (MVP)

1. Choose commander name and faction.
2. Explore the 3D star map — your position is the gold marker.
3. **Travel** to connected zones (costs credits & supplies).
4. **FPS Assault / Dogfight** — first-person ground arena or space engagement (WASD, mouse aim, shoot).
5. **RTS Command / Fleet** — top-down squad control (box-select, right-click move, click to attack).
6. **Quick resolve** — auto-resolve if you want strategy-only.
5. Customize **ship modules** (dual weapons) and **squad loadouts** in the bottom tabs.
6. Open **Codex** for factions and gear; **Gallery** for reference art and cinematics.
7. **Deploy / travel / battles** trigger short cinematic sequences using your reference images.

## Visual reference system

Concept art in `public/assets/ref/` drives:

- **NPC templates** — named opponents (mechs, ships, infantry, naval) per faction
- **Zone threat preview** — images of likely ground/space defenders
- **Cinematic player** — multi-beat fullscreen scenes (Space/Skip with Esc)

Add more PNGs to `public/assets/ref/` and register them in `src/data/visualAssets.ts`.

## Hybrid combat (FPS + RTS)

| Mode | Ground | Space |
|------|--------|-------|
| **FPS** | First-person arena vs NPC sprites | 3D dogfight corridor |
| **RTS** | Squad RTS — box-select, move, attack | Fleet triangles — same orders |

**FPS:** Click **Engage** → mouse lock · WASD · LMB fire · **C** crouch behind cover · **RMB** aim-down-sights (more damage, tighter zoom) · **H** extract (drop-in only)  
**RTS:** Drag to select · Right-click move/attack · **Ctrl+1–9** assign control group · **1–9** recall group · **F** or **Drop in** — pilot one unit in FPS, then **H** to return  

Cover reduces incoming damage when crouching (**C**) near obstacles with enemies on the other side. ADS slows you but hits harder.

Stats (squad gear, ship loadout, faction bonuses) feed damage and HP. Wins grant credits; losses cost casualties.

Save data is stored in `localStorage` (Continue on title screen). Older saves (`legion-stars`, `conquer-the-universe`) still load.

## Project layout

| Path | Purpose |
|------|---------|
| `src/data/` | Factions, zones, ships, soldiers |
| `src/systems/` | Travel, combat resolution |
| `src/world/SceneManager.ts` | Three.js map visualization |
| `src/ui/HUD.ts` | Game UI & editors |
| `src/game/` | Game loop & player state |

## Roadmap toward MMO

- **Phase 1 (done):** Single-player MVP, data-driven content.
- **Phase 2:** Node + WebSocket game server, authoritative zone state.
- **Phase 3:** Instanced battles, guilds, persistent territory.
- **Phase 4:** Live economy, seasons, cross-system campaigns.
