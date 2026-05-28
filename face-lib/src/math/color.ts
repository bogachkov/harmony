// Tiny color utility for the engine. Derives shadow/highlight tones from a base
// hex color so primitives (hair value variation, future skin shading, etc.) can
// produce a consistent palette without hand-coding shadow colors per hairstyle.
//
// Lab-aware would be nicer but we stay in RGB for now — masters of comic art
// pick hair shadow / highlight by eye, and a 0.6x RGB multiply lands close
// enough for ligne-claire. If we ever need true perceptual lightness we can
// swap to Oklab; the API stays the same.

// Parse "#rrggbb" → [r, g, b] in 0..255.
const parseHex = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const toHex = (n: number): string => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

// Darken: each RGB channel multiplied by (1 - amount). amount=0.3 = ~30% darker.
export const darken = (hex: string, amount: number): string => {
  const [r, g, b] = parseHex(hex);
  const k = 1 - amount;
  return `#${toHex(r * k)}${toHex(g * k)}${toHex(b * k)}`;
};

// Lighten: each RGB channel pulled toward 255. amount=0.3 = ~30% lighter.
export const lighten = (hex: string, amount: number): string => {
  const [r, g, b] = parseHex(hex);
  return `#${toHex(r + (255 - r) * amount)}${toHex(g + (255 - g) * amount)}${toHex(b + (255 - b) * amount)}`;
};
