// Design tokens, ported verbatim from the reference prototype.
// The one change from the reference: nothing — the reference already carries
// the Enovos orange accent. Mirrored in src/app/globals.css as Tailwind tokens.

export const C = {
  bg: "#F4F2ED",
  surface: "#FFFFFF",
  text: "#18140F",
  t2: "#5C5650",
  t3: "#9E988F",
  border: "#DED9D0",
  accent: "#F18500", // Enovos orange — interaction only
  active: "#18140F",
  today: "#6F6862", // ring for the "today" marks — darker than t3 so it holds up projected
  target: "#18140F",
  fire: "#C25A0C", // deliberately a darker ember than the accent
  water: "#2E7B96",
  earth: "#4A7A4E",
  air: "#5F6B7E",
} as const;

// Font stacks resolve through the next/font CSS variables set in layout.tsx.
/** Display / headings. DM Sans, set heavier and tighter to carry large sizes. */
export const FD = "var(--font-dm-sans), system-ui, sans-serif";
/** Weight and tracking that make DM Sans read as a display face. */
export const DISPLAY_WEIGHT = 600;
export const DISPLAY_TRACKING = "-0.025em";
export const FB = "var(--font-dm-sans), system-ui, sans-serif";
export const FM = "var(--font-dm-mono), 'Courier New', monospace";
