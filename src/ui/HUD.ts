import { cinematicForDeploy, cinematicForTrigger, galleryScenes } from "@/data/cinematics";
import { pickZoneNpc } from "@/data/npcTemplates";
import { FACTIONS, getFaction } from "@/data/factions";
import { modulesForSlot, shipPower, SHIP_MODULES } from "@/data/ships";
import {
  ARMOR,
  GADGETS,
  SOLDIER_CLASSES,
  WEAPONS,
  armyPower,
  createArmyFromLoadouts,
  soldierStats,
} from "@/data/soldiers";
import { getVisual, VISUAL_ASSETS, visualsByCategory } from "@/data/visualAssets";
import { ZONES, getZone, zoneCount } from "@/data/zones";
import { buildBattleContext } from "@/battle/buildContext";
import { getBattleManager } from "@/battle/BattleManager";
import { outcomeToCombatResult } from "@/battle/types";
import type { BattleDomain, BattleMode } from "@/battle/types";
import { showControlsGuide } from "@/ui/ControlsGuide";
import { AmbientAudio } from "@/ui/AmbientAudio";
import { CinematicPlayer } from "@/ui/CinematicPlayer";
import { START_MENU_ICONS } from "@/ui/StartMenuIcons";
import type { VisualCategory } from "@/types/visual";
import {
  createNewPlayer,
  loadPlayer,
  savePlayer,
  updateShip,
  updateSquad,
} from "@/game/GameState";
import {
  applyCombatResult,
  resolveGroundBattle,
  resolveSpaceSkirmish,
} from "@/systems/CombatSystem";
import {
  canTravel,
  computeTravelCost,
  reachableZones,
  travelTo,
} from "@/systems/TravelSystem";
import type { PlayerState, ShipLoadout } from "@/types/game";
import type { SceneManager } from "@/world/SceneManager";

type Screen = "title" | "play";

export class HUD {
  private root: HTMLElement;
  private state: PlayerState | null = null;
  private screen: Screen = "title";
  private log: string[] = [];
  private onStateChange?: () => void;
  private cinematic = new CinematicPlayer();
  private ambient = new AmbientAudio();
  private lastOpponentImage: string | null = null;
  private galleryFilter: VisualCategory | "all" = "all";
  private titleSubmenu: "main" | "options" = "main";
  private draftCommanderName = "Commander";
  private draftFactionId = FACTIONS[0]?.id ?? "";

  constructor(rootId: string) {
    const el = document.getElementById(rootId);
    if (!el) throw new Error("UI root not found");
    this.root = el;
  }

  bindScene(_scene: SceneManager, onStateChange: () => void): void {
    this.onStateChange = onStateChange;
  }

  getState(): PlayerState | null {
    return this.state;
  }

  render(): void {
    if (this.screen === "title") {
      document.body.classList.add("screen-title");
      this.renderTitle();
      return;
    }
    document.body.classList.remove("screen-title");
    if (!this.state) return;
    this.renderPlay();
  }

  private pushLog(msg: string): void {
    this.log.unshift(msg);
    this.log = this.log.slice(0, 8);
  }

  private notify(): void {
    if (this.state) savePlayer(this.state);
    this.onStateChange?.();
    this.render();
  }

  private renderTitle(): void {
    const saved = loadPlayer();
    const map = zoneCount();
    this.ambient.start();
    this.root.innerHTML = `
      <div class="title-backdrop" aria-hidden="true"></div>
      <div class="title-vignette" aria-hidden="true"></div>

      <figure class="title-commander" aria-hidden="true">
        <img
          class="title-commander__portrait"
          src="/assets/menu/commander-portrait-transparent.png"
          alt=""
        />
        <figcaption class="title-commander__caption">Commander</figcaption>
      </figure>

      <div class="title-deploy">
        <p class="title-deploy__label">Commander profile</p>
        <label class="title-deploy__field">Callsign
          <input id="cmd-name" type="text" maxlength="24" placeholder="Your callsign" value="${this.draftCommanderName}" />
        </label>
        <label class="title-deploy__field">Faction
          <select id="faction-pick">
            ${FACTIONS.map(
              (f) =>
                `<option value="${f.id}" ${this.draftFactionId === f.id ? "selected" : ""}>${f.name}</option>`
            ).join("")}
          </select>
        </label>
        <p class="title-deploy__meta">${FACTIONS.length} factions · ${map.systems} systems · ${map.planets} worlds</p>
      </div>

      <aside class="hud-menu">
        <div class="hud-menu__frame">
          <div class="hud-menu__topbar">
            <span class="hud-menu__ticks"></span>
            <span class="hud-menu__caret">⌄</span>
            <span class="hud-menu__ticks"></span>
          </div>
          <div class="hud-menu__items">
            ${
              this.titleSubmenu === "main"
                ? `
                  ${this.hudItem("menu-demo", "DEMO", START_MENU_ICONS.demo)}
                  ${this.hudItem("menu-single", "SINGLEPLAYER", START_MENU_ICONS.single)}
                  ${this.hudItem("menu-options", "OPTIONS", START_MENU_ICONS.options)}
                  ${this.hudItem("menu-guide", "GUIDE INFORMATION", START_MENU_ICONS.guide)}
                  ${
                    saved
                      ? this.hudItem(
                          "menu-continue",
                          `CONTINUE — ${saved.commanderName.toUpperCase()}`,
                          START_MENU_ICONS.continue
                        )
                      : ""
                  }
                `
                : `
                  ${this.hudItem("menu-keybinds", "KEY BINDINGS", START_MENU_ICONS.keys)}
                  ${this.hudItem(
                    "menu-audio",
                    `AMBIENT MUSIC: ${this.ambient.isEnabled() ? "ON" : "OFF"}`,
                    START_MENU_ICONS.audio
                  )}
                  ${this.hudItem("menu-options-back", "BACK", START_MENU_ICONS.back, false)}
                `
            }
          </div>
        </div>
      </aside>
    `;

    this.root.querySelector("#cmd-name")?.addEventListener("input", () =>
      this.syncTitleDraft()
    );
    this.root.querySelector("#faction-pick")?.addEventListener("change", () =>
      this.syncTitleDraft()
    );

    this.root.querySelector("#menu-demo")?.addEventListener("click", () => {
      this.syncTitleDraft();
      const name = this.draftCommanderName || "Commander";
      const factionId = this.draftFactionId;
      this.ambient.start();
      showControlsGuide("all", () => {
        this.state = this.createDemoPlayer(name, factionId);
        this.screen = "play";
        this.pushLog("Demo scenario loaded: frontline sector is hot.");
        this.pushLog("Demo boost active: elite ship, veteran squad, and full intel feed.");
        this.playCinematic(cinematicForDeploy(factionId), () => this.notify());
      }, {
        title: "Demo briefing",
        continueLabel: "Launch demo",
      });
    });

    this.root.querySelector("#menu-single")?.addEventListener("click", () => {
      this.syncTitleDraft();
      const name = this.draftCommanderName || "Commander";
      const factionId = this.draftFactionId;
      this.ambient.start();
      showControlsGuide("all", () => {
        this.state = createNewPlayer(name, factionId);
        this.screen = "play";
        this.pushLog(`${name} enlisted with ${getFaction(factionId).name}.`);
        this.playCinematic(cinematicForDeploy(factionId), () => this.notify());
      }, {
        title: "Singleplayer campaign",
        continueLabel: "Deploy",
      });
    });

    this.root.querySelector("#menu-guide")?.addEventListener("click", () => {
      this.ambient.start();
      showControlsGuide("all", () => {}, {
        title: "Guide Information",
        continueLabel: "Close",
      });
    });

    this.root.querySelector("#menu-options")?.addEventListener("click", () => {
      this.syncTitleDraft();
      this.titleSubmenu = "options";
      this.renderTitle();
    });

    this.root.querySelector("#menu-options-back")?.addEventListener("click", () => {
      this.syncTitleDraft();
      this.titleSubmenu = "main";
      this.renderTitle();
    });

    this.root.querySelector("#menu-keybinds")?.addEventListener("click", () => {
      showControlsGuide("all", () => {}, {
        title: "Key Bindings",
        continueLabel: "Close",
      });
    });

    this.root.querySelector("#menu-audio")?.addEventListener("click", () => {
      this.ambient.setEnabled(!this.ambient.isEnabled());
      if (this.ambient.isEnabled()) this.ambient.start();
      this.renderTitle();
    });

    this.root.querySelector("#menu-continue")?.addEventListener("click", () => {
      this.ambient.start();
      showControlsGuide("all", () => {
        this.state = loadPlayer();
        this.screen = "play";
        this.pushLog("Campaign resumed.");
        this.notify();
      }, {
        title: "Campaign controls refresher",
        continueLabel: "Resume",
      });
    });
  }

  private hudItem(
    id: string,
    label: string,
    iconSvg: string,
    showChevron = true
  ): string {
    return `
      <button type="button" class="hud-menu__item" id="${id}">
        <span class="hud-menu__icon">${iconSvg}</span>
        <span class="hud-menu__label">${label}</span>
        ${
          showChevron
            ? `<span class="hud-menu__chev">${START_MENU_ICONS.chevron}</span>`
            : `<span class="hud-menu__chev hud-menu__chev--empty"></span>`
        }
      </button>`;
  }

  private syncTitleDraft(): void {
    const nameInput = this.root.querySelector("#cmd-name") as HTMLInputElement | null;
    const factionPick = this.root.querySelector("#faction-pick") as HTMLSelectElement | null;
    if (nameInput) this.draftCommanderName = nameInput.value.trim() || "Commander";
    if (factionPick) this.draftFactionId = factionPick.value || this.draftFactionId;
  }

  private createDemoPlayer(commanderName: string, factionId: string): PlayerState {
    const base = createNewPlayer(commanderName, factionId);
    const demoZones = ZONES.map((z) => z.id);
    const eliteLoadouts = [
      {
        name: "Vanguard-One",
        classId: "heavy",
        armorId: "warden",
        weaponId: "arc-lance",
        gadgetId: "shield-pack",
      },
      {
        name: "Falcon-Two",
        classId: "sniper",
        armorId: "carapace",
        weaponId: "sniper-rifle",
        gadgetId: "ecm",
      },
      {
        name: "Aegis-Three",
        classId: "officer",
        armorId: "exo",
        weaponId: "rail-sidearm",
        gadgetId: "drone",
      },
      {
        name: "Ghost-Four",
        classId: "breacher",
        armorId: "warden",
        weaponId: "arc-lance",
        gadgetId: "grapple",
      },
      {
        name: "Beacon-Five",
        classId: "medic",
        armorId: "exo",
        weaponId: "rifle",
        gadgetId: "medfoam",
      },
      {
        name: "Raptor-Six",
        classId: "cavalry",
        armorId: "carapace",
        weaponId: "lmg",
        gadgetId: "shield-pack",
      },
    ];
    return {
      ...base,
      credits: 90000,
      supplies: 1200,
      currentZoneId: "ash-continent",
      discoveredZones: [...new Set([...base.discoveredZones, ...demoZones])],
      ship: {
        ...base.ship,
        name: "Demo Vanguard",
        hull: "hull-juggernaut",
        engine: "eng-singularity",
        shield: "shd-fortress",
        cargo: "cargo-black",
        weapons: ["wpn-beam", "wpn-torpedo"],
      },
      army: createArmyFromLoadouts(eliteLoadouts).map((u) => ({
        ...u,
        hp: u.hp + 120,
        morale: 100,
      })),
    };
  }

  private launchBattle(domain: BattleDomain, mode: BattleMode): void {
    if (!this.state || getBattleManager().isActive()) return;
    const s = this.state;
    const zone = getZone(s.currentZoneId);
    if (domain === "ground" && zone.scale !== "continent" && zone.threat > 4) {
      this.pushLog("Ground battles work best on continents or lower-threat zones.");
    }
    const trigger = domain === "ground" ? "ground-battle" : "space-battle";
    this.playCinematic(cinematicForTrigger(trigger, s.factionId), () => {
      const ctx = buildBattleContext(s, domain, mode);
      getBattleManager().start(ctx, (outcome) => {
        this.lastOpponentImage = ctx.opponentImage;
        this.state = applyCombatResult(s, outcomeToCombatResult(outcome));
        this.pushLog(outcome.message);
        this.notify();
      });
    });
  }

  private quickResolve(domain: BattleDomain): void {
    if (!this.state) return;
    const s = this.state;
    const run = () => {
      const engagement =
        domain === "ground" ? resolveGroundBattle(s) : resolveSpaceSkirmish(s);
      this.lastOpponentImage = engagement.opponentImage;
      this.state = applyCombatResult(s, engagement.result);
      this.pushLog(engagement.result.message);
      this.notify();
    };
    const trigger = domain === "ground" ? "ground-battle" : "space-battle";
    this.playCinematic(cinematicForTrigger(trigger, s.factionId), run);
  }

  private playCinematic(
    scene: ReturnType<typeof cinematicForTrigger>,
    then: () => void
  ): void {
    if (!scene || this.cinematic.playing) {
      then();
      return;
    }
    this.cinematic.play(scene, then);
  }

  private renderPlay(): void {
    this.ambient.start();
    const s = this.state!;
    const zone = getZone(s.currentZoneId);
    const faction = getFaction(s.factionId);
    const reachable = reachableZones(s);
    const groundNpc = pickZoneNpc(zone.controllingFaction, "ground", zone.threat);
    const spaceNpc = pickZoneNpc(zone.controllingFaction, "space", zone.threat);
    const groundImg = getVisual(groundNpc.visualId).image;
    const spaceImg = getVisual(spaceNpc.visualId).image;

    this.root.innerHTML = `
      <header class="top-bar">
        <div class="top-bar__brand">Conquer the Universe</div>
        <button type="button" class="btn btn--ghost top-bar__controls" id="btn-controls-play">Controls</button>
        <div class="top-bar__stats">
          <span>${s.commanderName}</span>
          <span class="faction-badge" style="--fc:${faction.color}">${faction.name}</span>
          <span>¤ ${s.credits}</span>
          <span>Supplies ${s.supplies}</span>
        </div>
      </header>

      <aside class="panel panel--left">
        <h2>${zone.name}</h2>
        <p class="zone-meta">${zone.scale.toUpperCase()} · Threat ${zone.threat}/10</p>
        ${
          zone.controllingFaction
            ? `<p class="zone-meta">Held by <span style="color:${getFaction(zone.controllingFaction).color}">${getFaction(zone.controllingFaction).name}</span></p>`
            : ""
        }
        <p>${zone.description}</p>
        <p><strong>Resources:</strong> ${zone.resources.join(", ")}</p>
        <p><strong>Army power:</strong> ${Math.round(armyPower(s.army))}</p>
        <p><strong>Fleet power:</strong> ${Math.round(shipPower(s.ship))}</p>
        <div class="threat-preview">
          <div class="threat-card">
            <img src="${groundImg}" alt="${groundNpc.name}" />
            <span>Ground: ${groundNpc.name}</span>
          </div>
          <div class="threat-card">
            <img src="${spaceImg}" alt="${spaceNpc.name}" />
            <span>Space: ${spaceNpc.name}</span>
          </div>
        </div>
        ${
          this.lastOpponentImage
            ? `<div class="last-contact"><img src="${this.lastOpponentImage}" alt="Last engagement" /><small>Last contact</small></div>`
            : ""
        }
        <p class="hint combat-hint">FPS: cover (C) + ADS (RMB) · RTS: groups 1–9 · Drop-in (F) from RTS</p>
        <div class="combat-modes">
          <div class="combat-modes__group">
            <span class="combat-modes__label">Ground</span>
            <button class="btn btn--primary" id="btn-fps-ground">FPS Assault</button>
            <button class="btn" id="btn-rts-ground">RTS Command</button>
          </div>
          <div class="combat-modes__group">
            <span class="combat-modes__label">Space</span>
            <button class="btn btn--primary" id="btn-fps-space">FPS Dogfight</button>
            <button class="btn" id="btn-rts-space">RTS Fleet</button>
          </div>
          <button class="btn btn--ghost" id="btn-quick-ground" type="button">Quick ground resolve</button>
          <button class="btn btn--ghost" id="btn-quick-space" type="button">Quick fleet resolve</button>
        </div>
      </aside>

      <aside class="panel panel--right">
        <h3>Travel</h3>
        <ul class="travel-list">
          ${reachable
            .map((z) => {
              const ok = canTravel(s, z.id);
              const cost = computeTravelCost(s, z.id);
              return `
                <li>
                  <button class="travel-btn" data-zone="${z.id}" ${ok ? "" : "disabled"}>
                    ${z.name} <small>(${z.scale})</small>
                  </button>
                  <small>¤${cost.credits} · ${cost.supplies} sup · ~${cost.etaMinutes}m</small>
                </li>`;
            })
            .join("")}
        </ul>
        <h3>Command Log</h3>
        <ul class="log">${this.log.map((l) => `<li>${l}</li>`).join("")}</ul>
      </aside>

      <footer class="bottom-bar">
        <button class="tab active" data-tab="ship">Ship (${s.ship.name})</button>
        <button class="tab" data-tab="army">Army (${s.army.length})</button>
        <button class="tab" data-tab="codex">Codex</button>
        <button class="tab" data-tab="gallery">Gallery</button>
        <button class="tab" data-tab="mmo">MMO Roadmap</button>
      </footer>

      <div id="tab-content" class="panel panel--bottom"></div>
    `;

    this.root.querySelector("#btn-fps-ground")?.addEventListener("click", () => {
      this.launchBattle("ground", "fps");
    });
    this.root.querySelector("#btn-rts-ground")?.addEventListener("click", () => {
      this.launchBattle("ground", "rts");
    });
    this.root.querySelector("#btn-fps-space")?.addEventListener("click", () => {
      this.launchBattle("space", "fps");
    });
    this.root.querySelector("#btn-rts-space")?.addEventListener("click", () => {
      this.launchBattle("space", "rts");
    });
    this.root.querySelector("#btn-quick-ground")?.addEventListener("click", () => {
      this.quickResolve("ground");
    });
    this.root.querySelector("#btn-quick-space")?.addEventListener("click", () => {
      this.quickResolve("space");
    });

    this.root.querySelector("#btn-controls-play")?.addEventListener("click", () => {
      showControlsGuide("all", () => {}, {
        title: "Controls & button mapping",
        continueLabel: "Close",
      });
    });

    this.root.querySelectorAll(".travel-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = (btn as HTMLElement).dataset.zone!;
        const { state, error } = travelTo(s, targetId);
        if (error) {
          this.pushLog(error);
          this.notify();
          return;
        }
        this.state = state;
        this.pushLog(`Jumped to ${getZone(targetId).name}.`);
        this.playCinematic(cinematicForTrigger("travel", s.factionId), () =>
          this.notify()
        );
      });
    });

    this.renderTab("ship");
    this.root.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.root.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.renderTab((tab as HTMLElement).dataset.tab!);
      });
    });
  }

  private renderTab(tab: string): void {
    const el = this.root.querySelector("#tab-content");
    if (!el || !this.state) return;
    const s = this.state;

    if (tab === "ship") {
      el.innerHTML = this.shipEditorHtml(s.ship);
      this.wireShipEditor(s);
    } else if (tab === "army") {
      el.innerHTML = this.armyEditorHtml(s);
      this.wireArmyEditor(s);
    } else if (tab === "codex") {
      el.innerHTML = this.codexHtml();
    } else if (tab === "gallery") {
      el.innerHTML = this.galleryHtml();
      this.wireGallery();
    } else {
      el.innerHTML = `
        <h3>Path to MMO</h3>
        <ul class="roadmap">
          <li><strong>Now:</strong> Single-commander loop, factions, customization, multi-scale map.</li>
          <li><strong>Next:</strong> WebSocket shard server, persistent world state, player sightings.</li>
          <li><strong>Then:</strong> Instanced battles (100+ units), guild fleets, territory control.</li>
          <li><strong>Live ops:</strong> Seasonal campaigns across systems, player economy, auction house.</li>
        </ul>
      `;
    }
  }

  private shipEditorHtml(ship: ShipLoadout): string {
    const renderSlot = (
      label: string,
      slot: keyof Pick<ShipLoadout, "hull" | "engine" | "shield" | "cargo">,
      field: string
    ) => {
      const mods = modulesForSlot(
        slot === "hull"
          ? "hull"
          : slot === "engine"
            ? "engine"
            : slot === "shield"
              ? "shield"
              : "cargo"
      );
      return `
        <label>${label}
          <select data-ship-field="${field}">
            ${mods.map((m) => `<option value="${m.id}" ${ship[slot] === m.id ? "selected" : ""}>${m.name} (${m.power})</option>`).join("")}
          </select>
        </label>`;
    };

    const weapons = modulesForSlot("weapon");
    return `
      <div class="editor-grid">
        <label>Ship name <input data-ship-field="name" value="${ship.name}" /></label>
        ${renderSlot("Hull", "hull", "hull")}
        ${renderSlot("Engine", "engine", "engine")}
        ${renderSlot("Shield", "shield", "shield")}
        ${renderSlot("Cargo / Troop bay", "cargo", "cargo")}
        <label>Primary weapon
          <select data-ship-field="weapon0">
            ${weapons.map((m) => `<option value="${m.id}" ${ship.weapons[0] === m.id ? "selected" : ""}>${m.name}</option>`).join("")}
          </select>
        </label>
        <label>Secondary weapon
          <select data-ship-field="weapon1">
            ${weapons.map((m) => `<option value="${m.id}" ${(ship.weapons[1] ?? "wpn-none") === m.id ? "selected" : ""}>${m.name}</option>`).join("")}
          </select>
        </label>
        <button class="btn btn--primary" id="save-ship">Apply loadout</button>
      </div>
    `;
  }

  private wireShipEditor(s: PlayerState): void {
    this.root.querySelector("#save-ship")?.addEventListener("click", () => {
      const get = (f: string) =>
        (this.root.querySelector(`[data-ship-field="${f}"]`) as HTMLInputElement)
          .value;
      const ship: ShipLoadout = {
        name: get("name"),
        hull: get("hull"),
        engine: get("engine"),
        shield: get("shield"),
        cargo: get("cargo"),
        weapons: [get("weapon0"), get("weapon1")],
      };
      const cost = SHIP_MODULES.filter((m) =>
        [ship.hull, ship.engine, ship.shield, ship.cargo, ...ship.weapons].includes(m.id)
      ).reduce((sum, m) => sum + m.cost, 0);
      if (s.credits < cost * 0.1) {
        this.pushLog("Not enough credits for refit.");
        this.render();
        return;
      }
      this.state = updateShip(
        { ...s, credits: s.credits - Math.round(cost * 0.1) },
        ship
      );
      this.pushLog(`${ship.name} refitted. Fleet power ${Math.round(shipPower(ship))}.`);
      this.notify();
    });
  }

  private galleryHtml(): string {
    const cats: Array<VisualCategory | "all"> = [
      "all",
      "infantry",
      "officer",
      "mech",
      "spaceship",
      "naval",
      "vehicle",
      "air",
      "environment",
    ];
    const items =
      this.galleryFilter === "all"
        ? VISUAL_ASSETS
        : visualsByCategory(this.galleryFilter);

    return `
      <h3>Reference Gallery</h3>
      <p class="hint">Concept art driving NPC silhouettes and cinematics. Click a card to preview.</p>
      <div class="gallery-filters">
        ${cats
          .map(
            (c) =>
              `<button type="button" class="filter-btn ${this.galleryFilter === c ? "active" : ""}" data-filter="${c}">${c}</button>`
          )
          .join("")}
      </div>
      <div class="gallery-grid">
        ${items
          .map(
            (v) => `
          <button type="button" class="gallery-card" data-visual="${v.id}">
            <img src="${v.image}" alt="${v.name}" loading="lazy" />
            <span class="gallery-card__title">${v.name}</span>
            <span class="gallery-card__meta">${v.category}</span>
          </button>`
          )
          .join("")}
      </div>
      <h4 class="gallery-scenes-title">Cinematic sequences</h4>
      <div class="scene-list">
        ${galleryScenes()
          .map(
            (sc) =>
              `<button type="button" class="btn scene-btn" data-scene="${sc.id}">${sc.title}</button>`
          )
          .join("")}
      </div>
    `;
  }

  private wireGallery(): void {
    this.root.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.galleryFilter = (btn as HTMLElement).dataset.filter as VisualCategory | "all";
        this.renderTab("gallery");
        this.root.querySelectorAll(".tab").forEach((t) => {
          t.classList.toggle("active", (t as HTMLElement).dataset.tab === "gallery");
        });
      });
    });

    this.root.querySelectorAll(".gallery-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = (card as HTMLElement).dataset.visual!;
        const v = getVisual(id);
        const scene = {
          id: `preview-${id}`,
          title: v.name,
          subtitle: v.category,
          trigger: "gallery" as const,
          beats: [{ image: v.image, caption: v.description, durationMs: 6000 }],
        };
        this.cinematic.play(scene);
      });
    });

    this.root.querySelectorAll(".scene-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = (btn as HTMLElement).dataset.scene!;
        const scene = galleryScenes().find((s) => s.id === id);
        if (scene) this.cinematic.play(scene);
      });
    });
  }

  private codexHtml(): string {
    const map = zoneCount();
    return `
      <h3>Galaxy Codex</h3>
      <div class="codex-grid">
        <section>
          <h4>Factions (${FACTIONS.length})</h4>
          <ul>${FACTIONS.map((f) => `<li><span style="color:${f.color}">${f.name}</span> — ${f.motto}</li>`).join("")}</ul>
        </section>
        <section>
          <h4>Map</h4>
          <p>${map.systems} star systems · ${map.planets} planets/moons · ${map.continents} surface zones</p>
          <p>Explore to reveal nodes on the 3D map. Travel only along linked routes.</p>
        </section>
        <section>
          <h4>Combat modes</h4>
          <p><strong>FPS</strong> — cover, ADS, personal assault / dogfight.</p>
          <p><strong>RTS</strong> — control groups, box-select, fleet command.</p>
          <p><strong>Drop-in</strong> — from RTS, select 1 unit, press F, fight FPS, H to return.</p>
          <p><strong>Quick resolve</strong> — auto battle for strategy focus.</p>
        </section>
        <section>
          <h4>Customization</h4>
          <p>${SHIP_MODULES.length} ship modules (dual weapons on frigates and up)</p>
          <p>${SOLDIER_CLASSES.length} classes · ${ARMOR.length} armors · ${WEAPONS.length} weapons · ${GADGETS.length} gadgets</p>
        </section>
      </div>
    `;
  }

  private armyEditorHtml(s: PlayerState): string {
    return s.army
      .map((u, i) => {
        const st = soldierStats(u.loadout);
        return `
        <div class="unit-card" data-unit="${i}">
          <input data-field="name" value="${u.loadout.name}" placeholder="Callsign" />
          <select data-field="classId">
            ${SOLDIER_CLASSES.map((c) => `<option value="${c.id}" ${u.loadout.classId === c.id ? "selected" : ""}>${c.name}</option>`).join("")}
          </select>
          <select data-field="armorId">
            ${ARMOR.map((a) => `<option value="${a.id}" ${u.loadout.armorId === a.id ? "selected" : ""}>${a.name}</option>`).join("")}
          </select>
          <select data-field="weaponId">
            ${WEAPONS.map((w) => `<option value="${w.id}" ${u.loadout.weaponId === w.id ? "selected" : ""}>${w.name}</option>`).join("")}
          </select>
          <select data-field="gadgetId">
            ${GADGETS.map((g) => `<option value="${g.id}" ${u.loadout.gadgetId === g.id ? "selected" : ""}>${g.name}</option>`).join("")}
          </select>
          <small>HP ${st.hp} · ATK ${st.atk} · DEF ${st.def}</small>
        </div>`;
      })
      .concat(`<button class="btn btn--primary" id="save-army">Reform squad</button>`)
      .join("");
  }

  private wireArmyEditor(s: PlayerState): void {
    this.root.querySelector("#save-army")?.addEventListener("click", () => {
      const cards = this.root.querySelectorAll(".unit-card");
      const loadouts = [...cards].map((card) => {
        const q = (f: string) =>
          (card.querySelector(`[data-field="${f}"]`) as HTMLInputElement).value;
        return {
          name: q("name"),
          classId: q("classId"),
          armorId: q("armorId"),
          weaponId: q("weaponId"),
          gadgetId: q("gadgetId"),
        };
      });
      this.state = updateSquad(s, loadouts);
      this.pushLog("Squad reformed.");
      this.notify();
    });
  }
}
