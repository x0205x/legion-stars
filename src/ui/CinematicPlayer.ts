import type { CinematicScene } from "@/types/visual";

export class CinematicPlayer {
  private overlay: HTMLElement | null = null;
  private timer = 0;
  private beatIndex = 0;
  private scene: CinematicScene | null = null;
  private onDone?: () => void;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  play(scene: CinematicScene, onDone?: () => void): void {
    this.stop();
    this.scene = scene;
    this.onDone = onDone;
    this.beatIndex = 0;

    this.overlay = document.createElement("div");
    this.overlay.className = "cinematic-overlay";
    this.overlay.innerHTML = `
      <div class="cinematic-backdrop"></div>
      <div class="cinematic-frame">
        <div class="cinematic-vignette"></div>
        <img class="cinematic-img" alt="" />
        <div class="cinematic-text">
          <h2 class="cinematic-title"></h2>
          <p class="cinematic-subtitle"></p>
          <p class="cinematic-caption"></p>
        </div>
        <div class="cinematic-bar">
          <div class="cinematic-progress"></div>
        </div>
        <button type="button" class="cinematic-skip">Skip ▸</button>
      </div>
    `;
    document.body.appendChild(this.overlay);

    const skip = this.overlay.querySelector(".cinematic-skip");
    skip?.addEventListener("click", () => this.finish());

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        this.advance();
      }
    };
    window.addEventListener("keydown", this.keyHandler);

    this.showBeat();
  }

  private showBeat(): void {
    if (!this.overlay || !this.scene) return;

    const beat = this.scene.beats[this.beatIndex];
    const img = this.overlay.querySelector(".cinematic-img") as HTMLImageElement;
    const title = this.overlay.querySelector(".cinematic-title") as HTMLElement;
    const subtitle = this.overlay.querySelector(".cinematic-subtitle") as HTMLElement;
    const caption = this.overlay.querySelector(".cinematic-caption") as HTMLElement;
    const progress = this.overlay.querySelector(".cinematic-progress") as HTMLElement;

    title.textContent = this.scene.title;
    subtitle.textContent =
      this.beatIndex === 0 ? (this.scene.subtitle ?? "") : "";
    subtitle.style.display = this.beatIndex === 0 && this.scene.subtitle ? "block" : "none";
    caption.textContent = beat.caption;
    img.src = beat.image;
    img.classList.remove("cinematic-img--in");
    void img.offsetWidth;
    img.classList.add("cinematic-img--in");

    const pct = ((this.beatIndex + 1) / this.scene.beats.length) * 100;
    progress.style.width = `${pct}%`;

    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.advance(), beat.durationMs);
  }

  private advance(): void {
    if (!this.scene) return;
    this.beatIndex += 1;
    if (this.beatIndex >= this.scene.beats.length) {
      this.finish();
      return;
    }
    this.showBeat();
  }

  private finish(): void {
    const done = this.onDone;
    this.stop();
    done?.();
  }

  stop(): void {
    clearTimeout(this.timer);
    if (this.keyHandler) {
      window.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
    this.overlay?.remove();
    this.overlay = null;
    this.scene = null;
    this.onDone = undefined;
  }

  get playing(): boolean {
    return this.overlay !== null;
  }
}
