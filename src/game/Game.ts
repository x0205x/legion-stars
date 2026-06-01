import { getBattleManager } from "@/battle/BattleManager";
import { HUD } from "@/ui/HUD";
import { SceneManager } from "@/world/SceneManager";
import * as THREE from "three";

export class Game {
  private scene: SceneManager;
  private hud: HUD;
  private raf = 0;
  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement, uiRootId: string) {
    this.scene = new SceneManager(canvas);
    this.hud = new HUD(uiRootId);
    this.hud.bindScene(this.scene, () => this.sync());
    this.hud.render();
    this.sync();
    this.loop();
  }

  private sync(): void {
    const state = this.hud.getState();
    if (state) this.scene.syncPlayer(state);
  }

  private loop = (): void => {
    const dt = this.clock.getDelta();
    const battle = getBattleManager();
    if (battle.isActive()) {
      battle.update(dt);
    } else {
      this.scene.render();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.scene.dispose();
  }
}
