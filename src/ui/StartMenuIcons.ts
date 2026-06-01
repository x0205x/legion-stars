/** Inline SVG icons for the HUD-style start menu (electric blue stroke). */
const stroke = "currentColor";
const sw = "1.5";

export const START_MENU_ICONS = {
  demo: `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none"/>
  </svg>`,
  single: `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" aria-hidden="true">
    <path d="M12 4c-3.5 0-6 2.5-6 6v1H5v3h14v-3h-1V10c0-3.5-2.5-6-6-6z"/>
    <path d="M8 14v2c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5v-2"/>
    <path d="M9 10h6"/>
    <circle cx="9.5" cy="9" r="0.8" fill="currentColor"/>
    <circle cx="14.5" cy="9" r="0.8" fill="currentColor"/>
  </svg>`,
  options: `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" aria-hidden="true">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
  </svg>`,
  guide: `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" aria-hidden="true">
    <path d="M4 5h16v14H4z"/>
    <path d="M8 5v14M12 9h6M12 13h6"/>
  </svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" aria-hidden="true">
    <path d="M9 6l6 6-6 6"/>
  </svg>`,
  keys: `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <path d="M6 10h2M10 10h2M14 10h4M6 14h12"/>
  </svg>`,
  audio: `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" aria-hidden="true">
    <path d="M4 10v4h4l5 4V6L8 10H4z"/>
    <path d="M16 8a4 4 0 010 8M18 6a7 7 0 010 12"/>
  </svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" aria-hidden="true">
    <path d="M15 6l-6 6 6 6"/>
  </svg>`,
  continue: `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" aria-hidden="true">
    <path d="M5 5h14v14H5z"/>
    <path d="M9 12h6M12 9v6"/>
  </svg>`,
} as const;
