import * as THREE from "three";
import { ARENA_SIZE } from "@/battle/constants";
import { arenaToRts, rtsToArena, type DropInSnapshot } from "@/battle/dropIn";
import { showControlsGuide } from "@/ui/ControlsGuide";
import type { BattleContext, BattleOutcome } from "@/battle/types";

interface BattleRunner {
  update: (dt: number) => void;
  dispose: () => void;
}

interface Enemy {
  mesh: THREE.Mesh;
  hp: number;
  maxHp: number;
  rtsId?: number;
}

const ARENA = ARENA_SIZE;
const BASE_FOV = 75;
const ADS_FOV = 48;

export class FpsBattle implements BattleRunner {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private keys = new Set<string>();
  private pointerLocked = false;
  private yaw = 0;
  private pitch = 0;
  private playerHp: number;
  private playerMaxHp: number;
  private enemies: Enemy[] = [];
  private kills = 0;
  private shootCooldown = 0;
  private elapsed = 0;
  private timeLimit = 90;
  private ui: HTMLElement;
  private done = false;
  private textureLoader = new THREE.TextureLoader();
  private raycaster = new THREE.Raycaster();
  private onComplete: (outcome: BattleOutcome) => void;
  private ctx: BattleContext;
  private enemyQuota: number;
  private coverMeshes: THREE.Object3D[] = [];
  private colliders: THREE.Object3D[] = [];
  private crouchHeld = false;
  private isADS = false;
  private isInCover = false;
  private dropIn: DropInSnapshot | null = null;
  private dropInUnitId = 0;
  private dropInLabel = "";
  private keyHandlers: Array<{ type: string; fn: EventListener }> = [];

  constructor(
    canvas: HTMLCanvasElement,
    ctx: BattleContext,
    onComplete: (outcome: BattleOutcome) => void
  ) {
    this.ctx = ctx;
    this.onComplete = onComplete;
    this.dropIn = ctx.dropIn ?? null;

    if (this.dropIn) {
      this.playerHp = this.dropIn.unitHp;
      this.playerMaxHp = this.dropIn.unitMaxHp;
      this.kills = this.dropIn.enemyKills;
      this.elapsed = this.dropIn.elapsed;
      this.dropInUnitId = this.dropIn.unitId;
      this.dropInLabel = this.dropIn.unitLabel;
      this.enemyQuota = this.dropIn.enemies.length + this.dropIn.enemyKills;
    } else {
      this.playerHp = ctx.playerMaxHp;
      this.playerMaxHp = ctx.playerMaxHp;
      this.enemyQuota = Math.min(12, 4 + ctx.threat);
    }

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(ctx.domain === "space" ? 0x020408 : 0x1a1510);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(
      ctx.domain === "space" ? 0x020408 : 0x1a1510,
      ctx.domain === "space" ? 0.018 : 0.035
    );

    this.camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 200);

    const ambient = new THREE.AmbientLight(0x606080, 0.7);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(10, 20, 5);
    this.scene.add(sun);

    if (ctx.domain === "ground") {
      this.buildGroundArena();
    } else {
      this.buildSpaceArena();
    }

    if (this.dropIn) {
      const pos = rtsToArena(this.dropIn.rtsX, this.dropIn.rtsY);
      this.camera.position.set(pos.x, 1.65, pos.z);
      this.spawnDropInEnemies();
    } else {
      this.camera.position.set(0, 1.65, 0);
      this.spawnEnemies();
    }

    this.bindInput(canvas);
    this.resize();
    window.addEventListener("resize", this.resize);

    const dropHint = this.dropIn
      ? `<p class="dropin-hint">DROP IN as ${this.dropInLabel} · <kbd>H</kbd> extract to RTS</p>`
      : "";

    this.ui = document.createElement("div");
    this.ui.className = "battle-hud battle-hud--fps";
    this.ui.innerHTML = `
      <div class="battle-hud__top">
        <span class="battle-mode-tag">FPS ${ctx.domain === "space" ? "DOGFIGHT" : "ASSAULT"}${this.dropIn ? " · DROP IN" : ""}</span>
        <span>${ctx.zoneName}</span>
        <span id="fps-timer">90</span>
      </div>
      <div class="battle-hud__hp"><div id="fps-hp-bar"></div></div>
      <div id="fps-cover-badge" class="cover-badge hidden">IN COVER</div>
      <div id="fps-ads-badge" class="ads-badge hidden">ADS</div>
      <div class="battle-hud__center" id="fps-prompt">
        ${dropHint}
        <p>WASD move · <kbd>C</kbd> crouch/cover · <kbd>RMB</kbd> ADS · LMB fire · <kbd>H</kbd> extract</p>
        <button type="button" class="btn btn--primary" id="fps-start">Engage</button>
      </div>
      <div class="crosshair" id="fps-crosshair"></div>
      <div class="battle-hud__bottom">
        <span id="fps-kills">Kills ${this.kills} / ${this.enemyQuota}</span>
        <span id="fps-dmg">DMG ${ctx.playerDamage}</span>
        <button type="button" class="battle-exit" id="fps-exit">Abort</button>
      </div>
    `;
    document.body.appendChild(this.ui);

    this.ui.querySelector("#fps-start")?.addEventListener("click", () => {
      showControlsGuide(
        "fps",
        () => {
          canvas.requestPointerLock();
        },
        {
          title: "FPS — ready to engage",
          continueLabel: "Engage",
        }
      );
    });
    this.ui.querySelector("#fps-exit")?.addEventListener("click", () => {
      if (this.dropIn) this.extractToRts(false);
      else this.finish(false, "Mission aborted.");
    });
  }

  private addKey(type: "keydown" | "keyup", fn: (e: KeyboardEvent) => void): void {
    const listener = fn as EventListener;
    window.addEventListener(type, listener);
    this.keyHandlers.push({ type, fn: listener });
  }

  private buildGroundArena(): void {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA, ARENA),
      new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d3830 });
    const h = 4;
    const walls: [number, number, number, number, number][] = [
      [0, h / 2, -ARENA / 2, ARENA, h],
      [0, h / 2, ARENA / 2, ARENA, h],
      [-ARENA / 2, h / 2, 0, h, ARENA],
      [ARENA / 2, h / 2, 0, h, ARENA],
    ];
    for (const [x, y, z, w, d] of walls) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      wall.position.set(x, y, z);
      this.scene.add(wall);
      this.colliders.push(wall);
    }

    const coverMat = new THREE.MeshStandardMaterial({ color: 0x4a4035 });
    const coverPositions: [number, number, number, number, number, number][] = [
      [-8, 0.75, -6, 2.4, 1.5, 1.2],
      [6, 0.75, 4, 2.4, 1.5, 1.2],
      [-4, 0.6, 8, 3.5, 1.2, 1],
      [10, 0.5, -2, 4, 1, 1.2],
      [0, 0.9, 0, 2, 1.8, 2],
      [-12, 0.5, 2, 1.5, 1, 3],
      [12, 0.5, -8, 1.5, 1, 3],
    ];

    for (const [x, y, z, w, ht, d] of coverPositions) {
      const cover = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), coverMat.clone());
      cover.position.set(x, y, z);
      cover.userData.isCover = true;
      this.scene.add(cover);
      this.coverMeshes.push(cover);
      this.colliders.push(cover);
    }

    for (let i = 0; i < 6; i++) {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x554a3f })
      );
      crate.position.set(
        (Math.random() - 0.5) * (ARENA - 8),
        0.6,
        (Math.random() - 0.5) * (ARENA - 8)
      );
      crate.userData.isCover = true;
      this.scene.add(crate);
      this.coverMeshes.push(crate);
      this.colliders.push(crate);
    }
  }

  private buildSpaceArena(): void {
    const stars = new THREE.BufferGeometry();
    const n = 2000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = -Math.random() * 150 - 10;
    }
    stars.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.scene.add(
      new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xaabbff, size: 0.6 }))
    );
  }

  private spawnEnemyAt(ax: number, az: number, hp: number, rtsId?: number): void {
    const tex = this.textureLoader.load(this.ctx.opponentImage);
    const geo =
      this.ctx.domain === "space"
        ? new THREE.BoxGeometry(2.5, 1.2, 3.5)
        : new THREE.PlaneGeometry(1.8, 2.4);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      emissive: 0x222222,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ax, this.ctx.domain === "space" ? 0 : 1.2, az);
    if (this.ctx.domain === "ground") mesh.lookAt(this.camera.position);
    this.scene.add(mesh);
    this.enemies.push({ mesh, hp, maxHp: hp, rtsId });
  }

  private spawnEnemies(): void {
    for (let i = 0; i < this.enemyQuota; i++) {
      const angle = (i / this.enemyQuota) * Math.PI * 2;
      const dist = 8 + Math.random() * (ARENA / 2 - 10);
      const hp = Math.round(30 + this.ctx.threat * 8 + this.ctx.opponent.threatBonus * 0.4);
      this.spawnEnemyAt(Math.cos(angle) * dist, Math.sin(angle) * dist, hp);
    }
  }

  private spawnDropInEnemies(): void {
    if (!this.dropIn) return;
    for (const e of this.dropIn.enemies) {
      if (e.hp <= 0) continue;
      const pos = rtsToArena(e.rtsX, e.rtsY);
      this.spawnEnemyAt(pos.x, pos.z, e.hp, e.rtsId);
    }
  }

  private bindInput(canvas: HTMLCanvasElement): void {
    this.addKey("keydown", (e) => {
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === "h" && this.dropIn && this.pointerLocked) {
        e.preventDefault();
        this.extractToRts(true);
      }
      if (k === "escape" && !this.pointerLocked && !this.dropIn) {
        this.finish(false, "Retreated from combat.");
      }
    });
    this.addKey("keyup", (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === canvas;
      const prompt = this.ui.querySelector("#fps-prompt") as HTMLElement;
      if (prompt) prompt.style.display = this.pointerLocked ? "none" : "flex";
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.pointerLocked) return;
      const sens = this.isADS ? 0.0012 : 0.002;
      this.yaw -= e.movementX * sens;
      this.pitch -= e.movementY * sens;
      this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch));
    });

    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0 && this.pointerLocked) this.fire();
      if (e.button === 2) this.isADS = true;
    });
    canvas.addEventListener("mouseup", (e) => {
      if (e.button === 2) this.isADS = false;
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private nearCover(): boolean {
    if (this.ctx.domain !== "ground") return false;
    for (const cover of this.coverMeshes) {
      const dx = this.camera.position.x - cover.position.x;
      const dz = this.camera.position.z - cover.position.z;
      if (Math.hypot(dx, dz) < 2.2) return true;
    }
    return false;
  }

  private evaluateCover(): boolean {
    if (this.ctx.domain !== "ground") return false;
    if (!this.nearCover() || (!this.crouchHeld && !this.keys.has("c"))) return false;

    for (const enemy of this.enemies) {
      const origin = enemy.mesh.position.clone();
      origin.y = 1.2;
      const target = this.camera.position.clone();
      const dir = target.clone().sub(origin).normalize();
      this.raycaster.set(origin, dir);
      const blockers = this.raycaster.intersectObjects(this.coverMeshes, true);
      if (blockers.length > 0 && blockers[0].distance < origin.distanceTo(target) - 0.5) {
        return true;
      }
    }
    return this.crouchHeld && this.nearCover();
  }

  private resolveMovementCollision(pos: THREE.Vector3): void {
    const r = 0.45;
    for (const col of this.colliders) {
      const box = new THREE.Box3().setFromObject(col);
      const closest = new THREE.Vector3(
        THREE.MathUtils.clamp(pos.x, box.min.x, box.max.x),
        pos.y,
        THREE.MathUtils.clamp(pos.z, box.min.z, box.max.z)
      );
      const dx = pos.x - closest.x;
      const dz = pos.z - closest.z;
      const dist = Math.hypot(dx, dz);
      if (dist < r && dist > 0.001) {
        const push = (r - dist) / dist;
        pos.x += dx * push;
        pos.z += dz * push;
      }
    }
  }

  private fire(): void {
    const cd = this.isADS ? 0.2 : 0.12;
    if (this.shootCooldown > 0) return;
    this.shootCooldown = cd;

    const spread = this.isADS ? 0.002 : 0.012;
    this.raycaster.setFromCamera(
      new THREE.Vector2((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread),
      this.camera
    );

    const targets = this.enemies.map((e) => e.mesh);
    const coverBlocks = this.raycaster.intersectObjects(this.coverMeshes, true);
    const hits = this.raycaster.intersectObjects(targets);
    if (coverBlocks.length > 0 && hits.length > 0 && coverBlocks[0].distance < hits[0].distance) {
      return;
    }
    if (hits.length === 0) return;

    const enemy = this.enemies.find((e) => e.mesh === hits[0].object);
    if (!enemy) return;

    let dmg = this.ctx.playerDamage * (this.isADS ? 1.45 : 1);
    enemy.hp -= dmg;
    const mat = enemy.mesh.material as THREE.MeshStandardMaterial;
    mat.emissive.setHex(0xff4400);
    setTimeout(() => mat.emissive.setHex(0x222222), 80);

    if (enemy.hp <= 0) {
      this.scene.remove(enemy.mesh);
      this.enemies = this.enemies.filter((e) => e !== enemy);
      this.kills += 1;
      this.checkWin();
    }
  }

  private checkWin(): void {
    if (this.enemies.length === 0) {
      if (this.dropIn) {
        this.extractToRts(true, true);
      } else {
        this.finish(true, `${this.ctx.opponent.name} forces shattered. Zone secured.`);
      }
    }
  }

  private buildDropInSnapshot(): DropInSnapshot {
    const rtsPos = arenaToRts(this.camera.position.x, this.camera.position.z);
    const remainingEnemies = this.enemies
      .filter((e) => e.rtsId !== undefined)
      .map((e) => ({
        rtsId: e.rtsId!,
        hp: Math.max(0, Math.round(e.hp)),
        maxHp: e.maxHp,
      }));

    return {
      unitId: this.dropInUnitId,
      unitLabel: this.dropInLabel,
      unitHp: Math.max(0, Math.round(this.playerHp)),
      unitMaxHp: this.playerMaxHp,
      unitAtk: this.ctx.playerDamage,
      rtsX: rtsPos.x,
      rtsY: rtsPos.y,
      enemies: remainingEnemies,
      enemyKills: this.kills,
      elapsed: this.elapsed,
    };
  }

  private extractToRts(localWin = false, allClear = false): void {
    if (!this.dropIn || this.done) return;
    this.done = true;
    document.exitPointerLock();

    const snap = this.buildDropInSnapshot();
    const victory = allClear || localWin;

    this.onComplete({
      victory,
      casualties: 0,
      loot: 0,
      message: victory
        ? `${this.dropInLabel} cleared the sector — returning to command.`
        : `${this.dropInLabel} extracting to RTS view.`,
      kills: this.kills,
      returnToRts: true,
      dropInSnapshot: snap,
    });
  }

  private finish(victory: boolean, message: string): void {
    if (this.done) return;
    this.done = true;
    document.exitPointerLock();
    const loot = victory
      ? Math.round(180 + this.ctx.threat * 70 + this.kills * 20)
      : 0;
    const casualties = victory
      ? Math.floor((1 - this.playerHp / this.playerMaxHp) * 2)
      : Math.min(this.ctx.squadSize, 1 + Math.floor(this.ctx.threat / 4));

    this.onComplete({
      victory,
      casualties,
      loot,
      message,
      kills: this.kills,
    });
  }

  private updateHud(): void {
    const hpBar = this.ui.querySelector("#fps-hp-bar") as HTMLElement;
    const killsEl = this.ui.querySelector("#fps-kills");
    const timer = this.ui.querySelector("#fps-timer");
    const dmgEl = this.ui.querySelector("#fps-dmg");
    const coverBadge = this.ui.querySelector("#fps-cover-badge");
    const adsBadge = this.ui.querySelector("#fps-ads-badge");
    const crosshair = this.ui.querySelector("#fps-crosshair");

    if (hpBar) {
      hpBar.style.width = `${Math.max(0, (this.playerHp / this.playerMaxHp) * 100)}%`;
      hpBar.style.background = this.ctx.factionColor;
    }
    if (killsEl) killsEl.textContent = `Kills ${this.kills} / ${this.enemyQuota}`;
    if (timer) timer.textContent = String(Math.ceil(this.timeLimit - this.elapsed));
    if (dmgEl) {
      const d = Math.round(this.ctx.playerDamage * (this.isADS ? 1.45 : 1));
      dmgEl.textContent = `DMG ${d}${this.isInCover ? " · cover" : ""}`;
    }
    coverBadge?.classList.toggle("hidden", !this.isInCover);
    adsBadge?.classList.toggle("hidden", !this.isADS);
    crosshair?.classList.toggle("crosshair--ads", this.isADS);
  }

  update(dt: number): void {
    if (this.done) return;

    this.elapsed += dt;
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.crouchHeld = this.keys.has("c");
    this.isInCover = this.evaluateCover();

    const targetFov = this.isADS ? ADS_FOV : BASE_FOV;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 12);
    this.camera.updateProjectionMatrix();

    this.updateHud();

    if (!this.dropIn && this.elapsed >= this.timeLimit) {
      this.finish(
        this.kills >= Math.ceil(this.enemyQuota * 0.6),
        this.kills >= Math.ceil(this.enemyQuota * 0.6)
          ? "Objective complete before extraction window closed."
          : "Time expired — enemy reinforcements arrived."
      );
      return;
    }

    if (!this.pointerLocked) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    let speed = this.ctx.domain === "space" ? 14 : 7;
    if (this.isADS) speed *= 0.4;
    if (this.isInCover) speed *= 0.55;
    if (this.crouchHeld) speed *= 0.65;

    const forward = new THREE.Vector3(0, 0, -1).applyEuler(
      new THREE.Euler(this.pitch, this.yaw, 0, "YXZ")
    );
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, this.yaw, 0));

    const move = new THREE.Vector3();
    if (this.keys.has("w")) move.add(forward);
    if (this.keys.has("s")) move.sub(forward);
    if (this.keys.has("a")) move.sub(right);
    if (this.keys.has("d")) move.add(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * dt);
      this.camera.position.add(move);
      this.resolveMovementCollision(this.camera.position);
    }

    const limit = ARENA / 2 - 2;
    this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -limit, limit);
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -limit, limit);
    const eye = this.isInCover || this.crouchHeld ? 1.05 : 1.65;
    this.camera.position.y =
      this.ctx.domain === "ground" ? eye : THREE.MathUtils.clamp(this.camera.position.y, -2, 6);

    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    const dmgTakenMult = this.isInCover ? 0.35 : 1;

    for (const enemy of this.enemies) {
      const toPlayer = this.camera.position.clone().sub(enemy.mesh.position);
      const dist = toPlayer.length();
      if (this.ctx.domain === "ground") {
        enemy.mesh.lookAt(this.camera.position.x, 1.2, this.camera.position.z);
      }
      if (dist > 1.5) {
        toPlayer.normalize().multiplyScalar((this.ctx.domain === "space" ? 5 : 3.2) * dt);
        enemy.mesh.position.add(toPlayer);
      }
      if (dist < 2.4 && Math.random() < 0.018) {
        this.playerHp -= Math.round((2 + this.ctx.threat * 0.5) * dmgTakenMult);
        if (this.playerHp <= 0) {
          if (this.dropIn) this.extractToRts(false);
          else this.finish(false, `KIA — ${this.ctx.opponent.name} overwhelmed your squad.`);
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  dispose(): void {
    window.removeEventListener("resize", this.resize);
    for (const { type, fn } of this.keyHandlers) {
      window.removeEventListener(type, fn);
    }
    document.exitPointerLock();
    this.ui.remove();
    this.renderer.dispose();
  }
}
