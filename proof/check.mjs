// check.mjs — free, automated invariants run on every render. No agent needed.
// Returns location-specific defect strings; empty array means clean.
// These encode the exact failures we hit by hand: stray specks (the "brim"),
// open/!single outline, frame clipping, spike/step clusters (scribble, jaw-neck
// step), and front-view asymmetry.

export function checkTile({ label, yawDeg, mask, main, W, H, total, mainCount, outline, simp }) {
  const d = [];

  // 1. an outline exists and is effectively closed
  if (!outline || outline.length < 16) { d.push(`${label}: no usable outline (len ${outline ? outline.length : 0})`); return d; }
  const a = outline[0], b = outline[outline.length - 1];
  if (Math.hypot(a.x - b.x, a.y - b.y) > 6) d.push(`${label}: outline not closed (ends ${Math.round(Math.hypot(a.x - b.x, a.y - b.y))}px apart)`);

  // 2. one connected blob — stray coverage means specks (the old "brim")
  const stray = (total - mainCount) / Math.max(1, total);
  if (stray > 0.02) d.push(`${label}: ${(stray * 100).toFixed(1)}% stray coverage outside the main blob`);

  // 3. nothing clips the top or sides of the frame (bottom is allowed: neck exits)
  let topHit = 0, sideHit = 0;
  for (let x = 0; x < W; x++) for (let y = 0; y < 3; y++) if (main[y * W + x]) topHit++;
  for (let y = 0; y < H; y++) { for (let x = 0; x < 3; x++) if (main[y * W + x]) sideHit++; for (let x = W - 3; x < W; x++) if (main[y * W + x]) sideHit++; }
  if (topHit > 2) d.push(`${label}: silhouette clips the top of the frame`);
  if (sideHit > 2) d.push(`${label}: silhouette clips a side of the frame`);

  // 4. spike/step clusters in the outline (the scribble, the jaw-neck step)
  let spikes = 0;
  for (let i = 1; i < simp.length - 1; i++) {
    const p = simp[i - 1], q = simp[i], r = simp[i + 1];
    const v1x = q.x - p.x, v1y = q.y - p.y, v2x = r.x - q.x, v2y = r.y - q.y;
    const l1 = Math.hypot(v1x, v1y), l2 = Math.hypot(v2x, v2y);
    if (l1 < 1 || l2 < 1) continue;
    const turn = Math.acos(Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (l1 * l2))));
    if (turn > (75 * Math.PI) / 180) spikes++;
  }
  if (spikes > 6) d.push(`${label}: ${spikes} sharp turns in outline (steps/scribble, not a clean edge)`);

  // 5. front view should be roughly left-right symmetric
  if (Math.abs(yawDeg) < 8) {
    const cxs = [];
    for (let y = 0; y < H; y++) {
      let lo = -1, hi = -1;
      for (let x = 0; x < W; x++) if (main[y * W + x]) { if (lo < 0) lo = x; hi = x; }
      if (lo >= 0) cxs.push((lo + hi) / 2);
    }
    if (cxs.length) {
      const med = cxs.slice().sort((p, q) => p - q)[cxs.length >> 1];
      const dev = cxs.reduce((s, c) => s + Math.abs(c - med), 0) / cxs.length;
      if (dev > 5) d.push(`${label}: front view asymmetric (mean centre drift ${dev.toFixed(1)}px)`);
    }
  }
  return d;
}
