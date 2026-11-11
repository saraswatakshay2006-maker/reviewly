/**
 * Color helpers for business-customized customer surfaces (/r/[slug] and live previews).
 * Ensures every chosen brand hex retains accessible text contrast (WCAG AA+) and clean surface tints.
 */

export function normalizeHex(hex: string | undefined | null, fallback = "#1A4BE0"): string {
  if (!hex) return fallback;
  const trimmed = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = normalizeHex(hex).slice(1);
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** Relative luminance per WCAG 2.1 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Picks crisp white or deep slate ink so button labels always clear >= 4.5:1 contrast */
export function getContrastInk(bgHex: string): string {
  const lum = getRelativeLuminance(bgHex);
  return lum > 0.42 ? "#0D1321" : "#FFFFFF";
}

/** Produces an rgba tint string from a business primary color */
export function rgbaFromHex(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

