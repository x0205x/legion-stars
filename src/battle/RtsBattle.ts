import type { DropInSnapshot } from "@/battle/dropIn";
import type { BattleContext, BattleOutcome } from "@/battle/types";
import { showControlsGuide } from "@/ui/ControlsGuide";

interface BattleRunner {
  update: (dt: number) => void;
  dispose: () => void;
}

export type DropInCallback = (
  snapshot: DropInSnapshot,
  onReturn: (outcome: BattleOutcome) => void
) => void;

interface Unit {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  team: "player" | "enemy";
  label: string;
  targetX: number;
  targetY: number;
  attackTarget: number | null;
  radius: number;
  controlGroup: number | null;
}

const W = 1200;
const H = 800;

export class RtsBattle implements BattleRunner {
  private ctx: BattleContext;
  private onComplete: (outcome: BattleOutcome) => void;
  private onDropIn?: DropInCallback;
  private canvas: HTMLCanvasElement;
  private ctx2d: CanvasRenderingContext2D;
  private units: Unit[] = [];
  private nextId = 1;
  private done = false;
  private paused = false;
  private ui: HTMLElement;
  private selectedIds = new Set<number>();
  private controlGroups: Set<number>[] = Array.from({ length: 9 }, () => new Set());
  private dragStart: { x: number; y: number } | null = null;
  private dragEnd: { x: number; y: number } | null = null;
  private enemyTex: HTMLImageElement | null = null;
  private elapsed = 0;
  private timeLimit = 120;
  private enemyKills = 0;
  private initialEnemyCount = 0;
  private keyHandler: (e: KeyboardEvent) => void;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: BattleContext,
    onComplete: (outcome: BattleOutcome) => void,
    onDropIn?: DropInCallback
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.onComplete = onComplete;
    this.onDropIn = onDropIn;
    const c = canvas.getContext("2d");
    if (!c) throw new Error("2d context unavailable");
    this.ctx2d = c;

    this.spawnForces();
    this.initialEnemyCount = this.units.filter((u) => u.team === "enemy").length;
    this.bindInput();
    this.bindKeyboard();
    this.resize();
    window.addEventListener("resize", this.resize);

    this.enemyTex = new Image();
    this.enemyTex.src = ctx.opponentImage;

    const dropBtn =
      ctx.domain === "ground"
        ? `<button type="button" class="btn btn--primary" id="rts-dropin">Drop in (F)</button>`
        : "";

    this.ui = document.createElement("div");
    this.ui.className = "battle-hud battle-hud--rts";
    this.ui.innerHTML = `
      <div class="battle-hud__top">
        <span class="battle-mode-tag">RTS ${ctx.domain === "space" ? "FLEET" : "COMMAND"}</span>
        <span>${ctx.zoneName} vs ${ctx.opponent.name}</span>
        <span id="rts-timer">120</span>
      </div>
      <div class="control-groups" id="rts-groups"></div>
      <div class="battle-hud__bottom rts-orders">
        <span id="rts-status">Ctrl+1–9 assign · 1–9 recall · Right-click orders</span>
        <span id="rts-count">Enemy 0/${this.initialEnemyCount}</span>
        ${dropBtn}
        <button type="button" class="btn" id="rts-select-all">Select all</button>
        <button type="button" class="battle-exit" id="rts-exit">Abort</button>
      </div>
    `;
    document.body.appendChild(this.ui);
    this.ui.querySelector("#rts-exit")?.addEventListener("click", () =>
      this.finish(false, "Command withdrawn.")
    );
    this.ui.querySelector("#rts-select-all")?.addEventListener("click", () => {
      this.units.filter((u) => u.team === "player" && u.hp > 0).forEach((u) => this.selectedIds.add(u.id));
    });
    this.ui.querySelector("#rts-dropin")?.addEventListener("click", () => this.tryDropIn());
    this.renderGroupBar();

    showControlsGuide(
      "rts",
      () => {},
      {
        title: "RTS — command briefing",
        continueLabel: "Begin command",
      }
    );
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  applyDropInReturn(snap: DropInSnapshot): void {
    const unit = this.units.find((u) => u.id === snap.unitId);
    if (unit) unit.hp = Math.max(0, snap.unitHp);

    for (const u of this.units) {
      if (u.team !== "enemy") continue;
      const match = snap.enemies.find((e) => e.rtsId === u.id);
      if (match) u.hp = match.hp;
      else if (u.hp > 0) u.hp = 0;
    }

    this.enemyKills = snap.enemyKills;
    this.elapsed = snap.elapsed;
    this.pushLog("Squad leader returned to command view.");
  }

  private pushLog(_msg: string): void {
    /* hook for future RTS log */
  }

  private spawnForces(): void {
    const squad = Math.max(1, Math.min(8, this.ctx.squadSize));
    for (let i = 0; i < squad; i++) {
      const id = this.nextId++;
      this.units.push({
        id,
        x: 120 + (i % 4) * 55,
        y: H - 120 - Math.floor(i / 4) * 55,
        hp: Math.round(40 + this.ctx.playerMaxHp / squad),
        maxHp: Math.round(40 + this.ctx.playerMaxHp / squad),
        atk: this.ctx.playerDamage,
        speed: this.ctx.domain === "space" ? 110 : 85,
        team: "player",
        label: `S${i + 1}`,
        targetX: 120,
        targetY: H - 120,
        attackTarget: null,
        radius: this.ctx.domain === "space" ? 14 : 16,
        controlGroup: null,
      });
    }

    const enemyCount = Math.min(14, 5 + this.ctx.threat);
    for (let i = 0; i < enemyCount; i++) {
      this.units.push({
        id: this.nextId++,
        x: W - 100 - (i % 5) * 50,
        y: 80 + Math.floor(i / 5) * 48,
        hp: Math.round(35 + this.ctx.threat * 6),
        maxHp: Math.round(35 + this.ctx.threat * 6),
        atk: Math.round(6 + this.ctx.threat * 1.2),
        speed: 70,
        team: "enemy",
        label: "Hostile",
        targetX: W / 2,
        targetY: H / 2,
        attackTarget: null,
        radius: 15,
        controlGroup: null,
      });
    }
  }

  private renderGroupBar(): void {
    const el = this.ui.querySelector("#rts-groups");
    if (!el) return;
    el.innerHTML = Array.from({ length: 9 }, (_, i) => {
      const n = i + 1;
      const count = this.controlGroups[i].size;
      return `<button type="button" class="group-chip" data-group="${n}" title="Ctrl+${n} assign · ${n} recall">${n}<small>${count}</small></button>`;
    }).join("");

    el.querySelectorAll(".group-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const n = parseInt((btn as HTMLElement).dataset.group!, 10);
        this.recallGroup(n);
      });
    });
  }

  private assignGroup(n: number): void {
    if (n < 1 || n > 9) return;
    this.controlGroups[n - 1] = new Set(
      [...this.selectedIds].filter((id) => {
        const u = this.units.find((x) => x.id === id);
        return u?.team === "player" && u.hp > 0;
      })
    );
    for (const u of this.units) {
      if (this.controlGroups[n - 1].has(u.id)) u.controlGroup = n;
      else if (u.controlGroup === n) u.controlGroup = null;
    }
    this.renderGroupBar();
  }

  private recallGroup(n: number): void {
    const g = this.controlGroups[n - 1];
    if (g.size === 0) return;
    this.selectedIds = new Set(
      [...g].filter((id) => {
        const u = this.units.find((x) => x.id === id);
        return u && u.hp > 0;
      })
    );
  }

  private buildDropInSnapshot(unitId: number): DropInSnapshot | null {
    const unit = this.units.find((u) => u.id === unitId && u.team === "player" && u.hp > 0);
    if (!unit) return null;
    return {
      unitId: unit.id,
      unitLabel: unit.label,
      unitHp: unit.hp,
      unitMaxHp: unit.maxHp,
      unitAtk: unit.atk,
      rtsX: unit.x,
      rtsY: unit.y,
      enemies: this.units
        .filter((u) => u.team === "enemy" && u.hp > 0)
        .map((u) => ({
          rtsId: u.id,
          hp: u.hp,
          maxHp: u.maxHp,
          rtsX: u.x,
          rtsY: u.y,
        })),
      enemyKills: this.enemyKills,
      elapsed: this.elapsed,
    };
  }

  private tryDropIn(): void {
    if (!this.onDropIn || this.ctx.domain !== "ground") return;
    const ids = [...this.selectedIds].filter((id) => {
      const u = this.units.find((x) => x.id === id);
      return u?.team === "player" && u.hp > 0;
    });
    if (ids.length !== 1) {
      const status = this.ui.querySelector("#rts-status");
      if (status) status.textContent = "Select exactly ONE squad unit to drop in (F)";
      return;
    }
    const snap = this.buildDropInSnapshot(ids[0]);
    if (!snap) return;
    this.onDropIn(snap, () => {});
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / W, rect.height / H);
    const offX = (rect.width - W * scale) / 2;
    const offY = (rect.height - H * scale) / 2;
    return {
      x: ((sx - rect.left - offX) / scale),
      y: ((sy - rect.top - offY) / scale),
    };
  }

  private bindKeyboard(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      if (this.paused || this.done) return;

      if (e.ctrlKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        this.assignGroup(parseInt(e.key, 10));
        return;
      }
      if (!e.ctrlKey && !e.altKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        this.recallGroup(parseInt(e.key, 10));
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        this.tryDropIn();
      }
    };
    window.addEventListener("keydown", this.keyHandler);
  }

  private bindInput(): void {
    this.canvas.addEventListener("mousedown", (e) => {
      if (this.paused) return;
      const w = this.screenToWorld(e.clientX, e.clientY);
      if (e.button === 0) {
        const hit = this.pickUnit(w.x, w.y, "player");
        if (hit && !e.shiftKey) this.selectedIds.clear();
        if (hit) {
          if (e.shiftKey) {
            if (this.selectedIds.has(hit.id)) this.selectedIds.delete(hit.id);
            else this.selectedIds.add(hit.id);
          } else this.selectedIds.add(hit.id);
        } else {
          this.dragStart = w;
          this.dragEnd = w;
        }
      } else if (e.button === 2) {
        e.preventDefault();
        const enemy = this.pickUnit(w.x, w.y, "enemy");
        for (const id of this.selectedIds) {
          const u = this.units.find((x) => x.id === id);
          if (!u || u.hp <= 0) continue;
          if (enemy) {
            u.attackTarget = enemy.id;
            u.targetX = enemy.x;
            u.targetY = enemy.y;
          } else {
            u.attackTarget = null;
            u.targetX = w.x;
            u.targetY = w.y;
          }
        }
      }
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (this.paused || !this.dragStart) return;
      this.dragEnd = this.screenToWorld(e.clientX, e.clientY);
      this.boxSelect();
    });

    window.addEventListener("mouseup", () => {
      this.dragStart = null;
      this.dragEnd = null;
    });

    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private boxSelect(): void {
    if (!this.dragStart || !this.dragEnd) return;
    const x1 = Math.min(this.dragStart.x, this.dragEnd.x);
    const x2 = Math.max(this.dragStart.x, this.dragEnd.x);
    const y1 = Math.min(this.dragStart.y, this.dragEnd.y);
    const y2 = Math.max(this.dragStart.y, this.dragEnd.y);
    for (const u of this.units) {
      if (u.team !== "player" || u.hp <= 0) continue;
      if (u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2) this.selectedIds.add(u.id);
    }
  }

  private pickUnit(x: number, y: number, team?: Unit["team"]): Unit | null {
    for (const u of [...this.units].reverse()) {
      if (team && u.team !== team) continue;
      if (u.hp <= 0) continue;
      const dx = x - u.x;
      const dy = y - u.y;
      if (dx * dx + dy * dy <= u.radius * u.radius * 2) return u;
    }
    return null;
  }

  private finish(victory: boolean, message: string): void {
    if (this.done) return;
    this.done = true;
    const playerLost = this.units.filter((u) => u.team === "player" && u.hp <= 0).length;
    const loot = victory
      ? Math.round(200 + this.ctx.threat * 75 + this.enemyKills * 15)
      : 0;
    this.onComplete({
      victory,
      casualties: victory ? playerLost : Math.min(this.ctx.squadSize, playerLost + 1),
      loot,
      message,
      unitsLost: playerLost,
      kills: this.enemyKills,
    });
  }

  private updateHud(): void {
    const status = this.ui.querySelector("#rts-status");
    const count = this.ui.querySelector("#rts-count");
    const timer = this.ui.querySelector("#rts-timer");
    const alive = this.units.filter((u) => u.team === "player" && u.hp > 0).length;
    if (status && !this.paused) {
      status.textContent = `${this.selectedIds.size} selected · ${alive} alive · Ctrl+1–9 assign`;
    }
    if (status && this.paused) status.textContent = "DROP IN — tactical FPS active…";
    if (count) count.textContent = `Enemy ${this.enemyKills}/${this.initialEnemyCount}`;
    if (timer) timer.textContent = String(Math.ceil(this.timeLimit - this.elapsed));
  }

  update(dt: number): void {
    if (this.done) return;
    this.updateHud();

    if (this.paused) {
      this.draw(true);
      return;
    }

    this.elapsed += dt;

    const enemiesAlive = this.units.filter((u) => u.team === "enemy" && u.hp > 0).length;
    const playersAlive = this.units.filter((u) => u.team === "player" && u.hp > 0).length;

    if (enemiesAlive === 0) {
      this.finish(true, `RTS victory — ${this.ctx.opponent.name} line broken.`);
      return;
    }
    if (playersAlive === 0) {
      this.finish(false, "Your command squad was wiped out.");
      return;
    }
    if (this.elapsed >= this.timeLimit) {
      this.finish(
        this.enemyKills >= Math.ceil(this.initialEnemyCount * 0.55),
        "Engagement window closed."
      );
      return;
    }

    for (const u of this.units) {
      if (u.hp <= 0) continue;

      let tx = u.targetX;
      let ty = u.targetY;

      if (u.attackTarget !== null) {
        const target = this.units.find((t) => t.id === u.attackTarget && t.hp > 0);
        if (target) {
          tx = target.x;
          ty = target.y;
          const dist = Math.hypot(target.x - u.x, target.y - u.y);
          if (dist < u.radius + target.radius + 8) {
            target.hp -= u.atk * dt * 0.8;
            if (target.hp <= 0 && target.team === "enemy") {
              this.enemyKills += 1;
              u.attackTarget = null;
            }
          }
        } else {
          u.attackTarget = null;
        }
      }

      const dx = tx - u.x;
      const dy = ty - u.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        const step = u.speed * dt;
        u.x += (dx / dist) * Math.min(step, dist);
        u.y += (dy / dist) * Math.min(step, dist);
      }

      if (u.team === "enemy") {
        const nearest = this.nearestEnemy(u, "player");
        if (nearest) {
          u.attackTarget = nearest.id;
          u.targetX = nearest.x;
          u.targetY = nearest.y;
        }
      }
    }

    this.draw(false);
  }

  private nearestEnemy(from: Unit, team: Unit["team"]): Unit | null {
    let best: Unit | null = null;
    let bestD = Infinity;
    for (const u of this.units) {
      if (u.team !== team || u.hp <= 0) continue;
      const d = Math.hypot(u.x - from.x, u.y - from.y);
      if (d < bestD) {
        bestD = d;
        best = u;
      }
    }
    return best;
  }

  private draw(pausedOverlay: boolean): void {
    const g = this.ctx2d;
    const rect = this.canvas.getBoundingClientRect();
    g.canvas.width = rect.width * devicePixelRatio;
    g.canvas.height = rect.height * devicePixelRatio;
    g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    const scale = Math.min(rect.width / W, rect.height / H);
    const offX = (rect.width - W * scale) / 2;
    const offY = (rect.height - H * scale) / 2;

    g.fillStyle = this.ctx.domain === "space" ? "#050810" : "#1a1814";
    g.fillRect(0, 0, rect.width, rect.height);

    g.save();
    g.translate(offX, offY);
    g.scale(scale, scale);

    this.drawGrid(g);

    if (this.dragStart && this.dragEnd && !pausedOverlay) {
      g.strokeStyle = "rgba(100,180,255,0.8)";
      g.strokeRect(
        this.dragStart.x,
        this.dragStart.y,
        this.dragEnd.x - this.dragStart.x,
        this.dragEnd.y - this.dragStart.y
      );
    }

    for (const u of this.units) {
      if (u.hp <= 0) continue;
      const sel = this.selectedIds.has(u.id);
      g.beginPath();
      if (this.ctx.domain === "space" && u.team === "player") {
        g.moveTo(u.x, u.y - u.radius);
        g.lineTo(u.x + u.radius, u.y + u.radius * 0.6);
        g.lineTo(u.x - u.radius, u.y + u.radius * 0.6);
        g.closePath();
      } else {
        g.arc(u.x, u.y, u.radius, 0, Math.PI * 2);
      }
      g.fillStyle = u.team === "player" ? this.ctx.factionColor : "#8b2e2e";
      g.fill();
      if (sel) {
        g.strokeStyle = "#fff";
        g.lineWidth = 2;
        g.stroke();
      }

      if (u.controlGroup) {
        g.fillStyle = "#fff";
        g.font = "bold 9px sans-serif";
        g.fillText(String(u.controlGroup), u.x - 4, u.y - u.radius - 4);
      }

      g.fillStyle = "#000";
      g.fillRect(u.x - 18, u.y - u.radius - 10, 36, 4);
      g.fillStyle = u.team === "player" ? "#4f4" : "#f44";
      g.fillRect(u.x - 18, u.y - u.radius - 10, 36 * (u.hp / u.maxHp), 4);

      g.fillStyle = "#e8eef8";
      g.font = "10px sans-serif";
      g.textAlign = "center";
      g.fillText(u.label, u.x, u.y + 4);
    }

    if (this.enemyTex?.complete) {
      const boss = this.units.find((u) => u.team === "enemy" && u.hp > 0);
      if (boss) g.drawImage(this.enemyTex, boss.x - 20, boss.y - 50, 40, 40);
    }

    if (pausedOverlay) {
      g.fillStyle = "rgba(0,0,0,0.45)";
      g.fillRect(0, 0, W, H);
      g.fillStyle = "#fff";
      g.font = "bold 22px sans-serif";
      g.textAlign = "center";
      g.fillText("DROP IN — FPS ACTIVE", W / 2, H / 2);
    }

    g.restore();
  }

  private drawGrid(g: CanvasRenderingContext2D): void {
    g.strokeStyle = "rgba(255,255,255,0.06)";
    for (let x = 0; x < W; x += 60) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H);
      g.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }
  }

  resize = (): void => {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  };

  dispose(): void {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.keyHandler);
    this.ui.remove();
  }
}
