import type { BattleContext, BattleOutcome } from "@/battle/types";
import type { DropInSnapshot } from "@/battle/dropIn";
import { FpsBattle } from "@/battle/FpsBattle";
import { RtsBattle } from "@/battle/RtsBattle";

type BattleRunner = {
  update: (dt: number) => void;
  dispose: () => void;
};

export class BattleManager {
  private runner: BattleRunner | null = null;
  private container: HTMLElement | null = null;
  private activeRts: RtsBattle | null = null;

  isActive(): boolean {
    return this.runner !== null;
  }

  start(ctx: BattleContext, onComplete: (outcome: BattleOutcome) => void): void {
    this.stop();
    this.container = document.createElement("div");
    this.container.className = "battle-layer";
    this.container.innerHTML = `<canvas id="battle-canvas"></canvas>`;
    document.body.appendChild(this.container);
    document.body.classList.add("battle-active");

    const canvas = this.container.querySelector("#battle-canvas") as HTMLCanvasElement;
    const done = (outcome: BattleOutcome) => {
      this.stop();
      onComplete(outcome);
    };

    if (ctx.mode === "fps") {
      this.activeRts = null;
      this.runner = new FpsBattle(canvas, ctx, done);
      return;
    }

    const rts = new RtsBattle(canvas, ctx, done, (snapshot, onReturn) =>
      this.enterDropIn(canvas, ctx, rts, snapshot, onReturn, done)
    );
    this.activeRts = rts;
    this.runner = rts;
  }

  private enterDropIn(
    canvas: HTMLCanvasElement,
    ctx: BattleContext,
    rts: RtsBattle,
    snapshot: DropInSnapshot,
    onReturn: (outcome: BattleOutcome) => void,
    onBattleEnd: (outcome: BattleOutcome) => void
  ): void {
    rts.setPaused(true);
    const fpsCtx: BattleContext = {
      ...ctx,
      mode: "fps",
      dropIn: snapshot,
      playerMaxHp: snapshot.unitMaxHp,
      playerDamage: snapshot.unitAtk,
    };

    const fps = new FpsBattle(canvas, fpsCtx, (outcome) => {
      if (outcome.returnToRts && outcome.dropInSnapshot) {
        rts.applyDropInReturn(outcome.dropInSnapshot);
        rts.setPaused(false);
        this.runner = rts;
        onReturn(outcome);
        return;
      }
      rts.dispose();
      this.activeRts = null;
      onBattleEnd(outcome);
    });
    this.runner = fps;
  }

  update(dt: number): void {
    this.runner?.update(dt);
  }

  stop(): void {
    this.runner?.dispose();
    this.runner = null;
    this.activeRts = null;
    this.container?.remove();
    this.container = null;
    document.body.classList.remove("battle-active");
  }
}

let manager: BattleManager | null = null;

export function getBattleManager(): BattleManager {
  if (!manager) manager = new BattleManager();
  return manager;
}
