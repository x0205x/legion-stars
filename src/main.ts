import { Game } from "@/game/Game";
import { IntroCinematic } from "@/ui/IntroCinematic";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas #game-canvas not found");

const app = document.getElementById("app");
if (app) app.classList.add("intro-pending");

IntroCinematic.play(() => {
  app?.classList.remove("intro-pending");
  new Game(canvas, "ui-root");
});