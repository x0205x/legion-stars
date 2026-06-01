import {
  INTRO_AUDIO,
  INTRO_SLIDES,
  INTRO_VIDEO_PATH,
  type IntroSlide,
} from "@/data/introCinematic";
import { FACTIONS } from "@/data/factions";
import type { Faction } from "@/types/game";

/**
 * Full-screen opening cinematic (video if built, else Ken Burns slideshow).
 */
export class IntroCinematic {
  private static active = false;
  private static muted = false;
  private static musicEl: HTMLAudioElement | null = null;
  private static transitionEl: HTMLAudioElement | null = null;
  private static audioCtx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;

  static play(onComplete: () => void): void {
    if (this.active) {
      onComplete();
      return;
    }
    this.active = true;

    const finish = () => {
      this.active = false;
      this.stopAudio();
      onComplete();
    };

    IntroCinematic.tryVideo(INTRO_VIDEO_PATH, finish, async () => {
      const slides = await IntroCinematic.resolveSlides(INTRO_SLIDES);
      if (slides.length === 0) {
        finish();
        return;
      }
      IntroCinematic.playSlideshow(slides, finish);
    });
  }

  private static canLoadImage(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  private static async resolveSlides(slides: IntroSlide[]): Promise<IntroSlide[]> {
    const out: IntroSlide[] = [];
    for (const slide of slides) {
      const candidates = [
        slide.image,
        slide.image.replace("/assets/intro/", "/assets/ref/"),
      ];
      for (const url of candidates) {
        if (await IntroCinematic.canLoadImage(url)) {
          out.push({ ...slide, image: url });
          break;
        }
      }
    }
    const seen = new Set(out.map((s) => s.image));
    const manifest = await IntroCinematic.loadManifestImages();
    for (const image of manifest) {
      if (seen.has(image)) continue;
      if (await IntroCinematic.canLoadImage(image)) {
        out.push({ image, durationMs: 1100 });
        seen.add(image);
      }
    }

    return out;
  }

  private static async loadManifestImages(): Promise<string[]> {
    try {
      const res = await fetch("/assets/intro/manifest.json", { cache: "no-store" });
      if (!res.ok) return [];
      const data = (await res.json()) as { files?: string[] };
      const files = data.files ?? [];
      return files
        .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f))
        .map((f) => `/assets/intro/${f}`);
    } catch {
      return [];
    }
  }

  private static tryVideo(
    src: string,
    onComplete: () => void,
    onFallback: () => void
  ): void {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = src;
    probe.onloadeddata = () => {
      IntroCinematic.showVideo(src, onComplete);
    };
    probe.onerror = () => onFallback();
  }

  private static showVideo(src: string, onComplete: () => void): void {
    const root = IntroCinematic.createShell();
    this.startAudio(root);
    const video = document.createElement("video");
    video.className = "intro-cinematic__video";
    video.src = src;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = false;
    video.volume = 0.65;
    root.querySelector(".intro-cinematic__stage")?.appendChild(video);

    const end = () => {
      IntroCinematic.showEndStinger(root, () => {
        IntroCinematic.teardown(root);
        onComplete();
      });
    };
    video.onended = end;
    video.onerror = end;
    IntroCinematic.wireSkip(root, end);
  }

  private static playSlideshow(slides: IntroSlide[], onComplete: () => void): void {
    const root = IntroCinematic.createShell();
    this.startAudio(root);
    const stage = root.querySelector(".intro-cinematic__stage") as HTMLElement;
    const layerA = document.createElement("div");
    const layerB = document.createElement("div");
    layerA.className = "intro-cinematic__layer intro-cinematic__layer--a";
    layerB.className = "intro-cinematic__layer intro-cinematic__layer--b";
    stage.append(layerA, layerB);

    const titleEl = root.querySelector(".intro-cinematic__title") as HTMLElement;
    const subEl = root.querySelector(".intro-cinematic__subtitle") as HTMLElement;
    const progressEl = root.querySelector(".intro-cinematic__progress") as HTMLElement;
    const factionCard = root.querySelector(".intro-cinematic__faction-card") as HTMLElement;
    const factionEmblem = root.querySelector(".intro-cinematic__faction-emblem") as HTMLElement;
    const factionName = root.querySelector(".intro-cinematic__faction-name") as HTMLElement;
    const factionMotto = root.querySelector(".intro-cinematic__faction-motto") as HTMLElement;

    let index = 0;
    let useA = true;
    let cancelled = false;
    const totalMs = slides.reduce((s, x) => s + x.durationMs, 0);
    const startTime = performance.now();

    const end = () => {
      if (cancelled) return;
      cancelled = true;
      IntroCinematic.showEndStinger(root, () => {
        IntroCinematic.teardown(root);
        onComplete();
      });
    };

    IntroCinematic.wireSkip(root, end);

    const tickProgress = () => {
      if (cancelled) return;
      const t = performance.now() - startTime;
      progressEl.style.width = `${Math.min(100, (t / totalMs) * 100)}%`;
      if (t < totalMs) requestAnimationFrame(tickProgress);
    };
    requestAnimationFrame(tickProgress);

    const showSlide = (slide: IntroSlide) => {
      const layer = useA ? layerA : layerB;
      const other = useA ? layerB : layerA;
      useA = !useA;

      layer.style.setProperty("--slide-duration", `${slide.durationMs}ms`);
      layer.style.backgroundImage = `url("${slide.image}")`;
      layer.classList.remove("intro-cinematic__layer--visible");
      void layer.offsetWidth;
      layer.classList.add("intro-cinematic__layer--visible");
      other.classList.remove("intro-cinematic__layer--visible");

      titleEl.textContent = slide.title ?? "";
      titleEl.style.opacity = slide.title ? "1" : "0";
      subEl.textContent = slide.subtitle ?? "";
      subEl.style.opacity = slide.subtitle ? "1" : "0";

      IntroCinematic.renderFactionCard(
        slide,
        factionCard,
        factionEmblem,
        factionName,
        factionMotto
      );
      IntroCinematic.playTransitionSfx();
      IntroCinematic.applyBeatEffects(root, slide);
    };

    const advance = () => {
      if (cancelled) return;
      if (index >= slides.length) {
        end();
        return;
      }
      const slide = slides[index++];
      showSlide(slide);
      setTimeout(advance, slide.durationMs);
    };

    slides.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });

    advance();
  }

  private static createShell(): HTMLElement {
    const root = document.createElement("div");
    root.className = "intro-cinematic";
    root.innerHTML = `
      <div class="intro-cinematic__vignette"></div>
      <div class="intro-cinematic__grain"></div>
      <div class="intro-cinematic__flash"></div>
      <div class="intro-cinematic__stage"></div>
      <div class="intro-cinematic__letterbox intro-cinematic__letterbox--top"></div>
      <div class="intro-cinematic__letterbox intro-cinematic__letterbox--bottom"></div>
      <div class="intro-cinematic__faction-card">
        <div class="intro-cinematic__faction-emblem"></div>
        <div class="intro-cinematic__faction-name"></div>
        <div class="intro-cinematic__faction-motto"></div>
      </div>
      <div class="intro-cinematic__hud">
        <h1 class="intro-cinematic__title"></h1>
        <p class="intro-cinematic__subtitle"></p>
        <div class="intro-cinematic__progress-track">
          <div class="intro-cinematic__progress"></div>
        </div>
        <button type="button" class="intro-cinematic__mute">Mute</button>
        <button type="button" class="intro-cinematic__skip">Skip intro · Esc</button>
      </div>
      <div class="intro-cinematic__stinger">
        <div class="intro-cinematic__stinger-title">PRESS ANY KEY TO COMMAND</div>
        <div class="intro-cinematic__stinger-subtitle">or click to deploy</div>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  private static wireSkip(root: HTMLElement, onSkip: () => void): void {
    const skip = root.querySelector(".intro-cinematic__skip");
    let onKey: (e: KeyboardEvent) => void = () => {};
    let done = false;
    const invoke = () => {
      if (done) return;
      done = true;
      window.removeEventListener("keydown", onKey);
      onSkip();
    };
    skip?.addEventListener("click", invoke);
    onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        invoke();
      }
    };
    window.addEventListener("keydown", onKey);
  }

  private static teardown(root: HTMLElement): void {
    root.classList.add("intro-cinematic--out");
    setTimeout(() => root.remove(), 450);
  }

  private static applyBeatEffects(root: HTMLElement, slide: IntroSlide): void {
    const flash = root.querySelector(".intro-cinematic__flash") as HTMLElement | null;
    if (slide.beat === "cut") {
      root.classList.remove("intro-cinematic--hard-cut");
      void root.offsetWidth;
      root.classList.add("intro-cinematic--hard-cut");
      setTimeout(() => root.classList.remove("intro-cinematic--hard-cut"), 140);
    }
    if (slide.beat === "flash" && flash) {
      flash.classList.remove("intro-cinematic__flash--active");
      void flash.offsetWidth;
      flash.classList.add("intro-cinematic__flash--active");
    }
  }

  private static showEndStinger(root: HTMLElement, done: () => void): void {
    const stinger = root.querySelector(".intro-cinematic__stinger") as HTMLElement | null;
    if (!stinger) {
      done();
      return;
    }
    stinger.classList.add("intro-cinematic__stinger--visible");

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.removeEventListener("keydown", onKey);
      stinger.removeEventListener("click", finish);
      done();
    };
    const onKey = () => finish();
    window.addEventListener("keydown", onKey);
    stinger.addEventListener("click", finish);
    setTimeout(finish, 8000);
  }

  private static renderFactionCard(
    slide: IntroSlide,
    card: HTMLElement,
    emblem: HTMLElement,
    name: HTMLElement,
    motto: HTMLElement
  ): void {
    if (!slide.factionId) {
      card.classList.remove("intro-cinematic__faction-card--visible");
      return;
    }
    const faction = IntroCinematic.getFaction(slide.factionId);
    if (!faction) {
      card.classList.remove("intro-cinematic__faction-card--visible");
      return;
    }
    const initials = faction.name
      .split(/\s+/)
      .filter(Boolean)
      .map((x) => x[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
    emblem.textContent = initials;
    name.textContent = slide.factionTitle ?? faction.name;
    motto.textContent = faction.motto;
    card.style.setProperty("--faction-color", faction.color);
    card.classList.remove("intro-cinematic__faction-card--visible");
    void card.offsetWidth;
    card.classList.add("intro-cinematic__faction-card--visible");
  }

  private static getFaction(id: string): Faction | undefined {
    return FACTIONS.find((f) => f.id === id);
  }

  private static startAudio(root: HTMLElement): void {
    const muteBtn = root.querySelector(".intro-cinematic__mute") as HTMLButtonElement | null;
    const setMuteLabel = () => {
      if (muteBtn) muteBtn.textContent = this.muted ? "Unmute" : "Mute";
    };
    setMuteLabel();

    muteBtn?.addEventListener("click", () => {
      this.muted = !this.muted;
      if (this.musicEl) this.musicEl.muted = this.muted;
      setMuteLabel();
    });

    const AC =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC && !this.audioCtx) {
      this.audioCtx = new AC();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.07;
      this.masterGain.connect(this.audioCtx.destination);
      this.audioCtx.resume().catch(() => {});
    }

    if (!this.musicEl) {
      const music = new Audio(INTRO_AUDIO.musicPath);
      music.loop = true;
      music.volume = INTRO_AUDIO.musicVolume;
      music.preload = "auto";
      music.muted = this.muted;
      music.play().catch(() => {});
      this.musicEl = music;
    }

    if (!this.transitionEl) {
      const sfx = new Audio(INTRO_AUDIO.transitionSfxPath);
      sfx.volume = INTRO_AUDIO.sfxVolume;
      sfx.preload = "auto";
      this.transitionEl = sfx;
    }
  }

  private static playTransitionSfx(): void {
    if (this.muted) return;
    if (this.transitionEl) {
      const fx = this.transitionEl.cloneNode(true) as HTMLAudioElement;
      fx.volume = INTRO_AUDIO.sfxVolume;
      fx.play().catch(() => {});
    }
    if (!this.audioCtx || !this.masterGain || this.audioCtx.state !== "running") return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.27);
  }

  private static stopAudio(): void {
    this.musicEl?.pause();
    this.musicEl = null;
    this.transitionEl = null;
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.masterGain = null;
    }
  }
}
