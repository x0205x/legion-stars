export type GuideContext = "campaign" | "fps" | "rts" | "all";

const SECTIONS: Record<
  GuideContext,
  { title: string; rows: { keys: string; action: string }[] }[]
> = {
  campaign: [
    {
      title: "Galaxy command",
      rows: [
        { keys: "Travel list", action: "Click a zone to jump (costs credits & supplies)" },
        { keys: "Tabs", action: "Ship / Army / Codex / Gallery — customize loadouts" },
        { keys: "FPS / RTS buttons", action: "Launch hybrid combat modes" },
        { keys: "Quick resolve", action: "Auto-resolve battle without minigame" },
      ],
    },
  ],
  fps: [
    {
      title: "FPS assault & dogfight",
      rows: [
        { keys: "Engage", action: "Lock mouse and enter combat" },
        { keys: "W A S D", action: "Move" },
        { keys: "Mouse", action: "Look around" },
        { keys: "LMB", action: "Fire weapon" },
        { keys: "RMB (hold)", action: "Aim down sights — tighter zoom, more damage" },
        { keys: "C (hold)", action: "Crouch / use cover (less damage taken)" },
        { keys: "H", action: "Extract to RTS (drop-in battles only)" },
        { keys: "Abort", action: "Leave battle (defeat)" },
      ],
    },
  ],
  rts: [
    {
      title: "RTS command & fleet",
      rows: [
        { keys: "LMB drag", action: "Box-select your units" },
        { keys: "LMB click", action: "Select unit (Shift = add/remove)" },
        { keys: "RMB", action: "Move selected units or attack enemy under cursor" },
        { keys: "Ctrl + 1–9", action: "Assign selection to control group" },
        { keys: "1–9", action: "Recall control group" },
        { keys: "F", action: "Drop in — pilot selected unit in FPS (one unit, ground)" },
        { keys: "Select all", action: "Select entire squad" },
        { keys: "Abort", action: "Withdraw from battle" },
      ],
    },
  ],
  all: [],
};

function sectionsFor(context: GuideContext) {
  if (context === "all") {
    return [...SECTIONS.campaign, ...SECTIONS.fps, ...SECTIONS.rts];
  }
  return SECTIONS[context];
}

let overlay: HTMLElement | null = null;

export function showControlsGuide(
  context: GuideContext,
  onContinue: () => void,
  options?: { title?: string; continueLabel?: string }
): void {
  closeControlsGuide();

  const title =
    options?.title ??
    (context === "fps"
      ? "FPS controls"
      : context === "rts"
        ? "RTS controls"
        : context === "campaign"
          ? "Command overview"
          : "Controls & button mapping");

  const continueLabel = options?.continueLabel ?? "Continue";

  overlay = document.createElement("div");
  overlay.className = "controls-guide-overlay";
  overlay.innerHTML = `
    <div class="controls-guide panel" role="dialog" aria-labelledby="guide-title">
      <h2 id="guide-title">${title}</h2>
      <p class="hint">Refer to this anytime from the title screen or in-game <strong>Controls</strong> button.</p>
      <div class="controls-guide__sections">
        ${sectionsFor(context)
          .map(
            (sec) => `
          <section>
            <h3>${sec.title}</h3>
            <table class="controls-table">
              <tbody>
                ${sec.rows
                  .map(
                    (r) => `
                  <tr>
                    <td class="controls-table__keys">${r.keys}</td>
                    <td>${r.action}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </section>`
          )
          .join("")}
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn--primary" id="guide-continue">${continueLabel}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const continueBtn = overlay.querySelector("#guide-continue");
  continueBtn?.addEventListener("click", () => {
    closeControlsGuide();
    onContinue();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeControlsGuide();
      onContinue();
    }
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      window.removeEventListener("keydown", onKey);
      closeControlsGuide();
      onContinue();
    }
  };
  window.addEventListener("keydown", onKey);
}

export function closeControlsGuide(): void {
  overlay?.remove();
  overlay = null;
}

export function isControlsGuideOpen(): boolean {
  return overlay !== null;
}
