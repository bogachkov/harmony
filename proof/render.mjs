// render.mjs — the cleanup proof: take the hand-authored 3D Loomis head, and for
// several camera angles do contour-extraction + occlusion + hand-line inking.
import fs from "node:fs";
import { Canvas, rotateYawPitch, project, visibleAgainstSphere, deg } from "./core.mjs";
import { loomisHead, R } from "./head.mjs";

const STYLE = {
  silhouette: { width: 3.4, color: [22, 22, 28], wobble: 1.3 },
  edge:       { width: 3.0, color: [22, 22, 28], wobble: 1.3 },
  construct:  { width: 2.1, color: [60, 60, 74], wobble: 1.1 },
  third:      { width: 1.5, color: [125, 125, 140], wobble: 0.9 },
  guide:      { width: 1.4, color: [150, 150, 165], wobble: 0.8 },
  hidden:     { width: 1.1, color: [206, 206, 214], wobble: 0.7 },
};

// split a projected polyline into maximal runs of consecutive visible (or hidden) points
function runs(proj, keepVisible) {
  const out = [];
  let cur = null;
  for (const p of proj) {
    if (p.vis === keepVisible) { (cur ||= []).push({ x: p.x, y: p.y }); }
    else if (cur) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out;
}

// cranium silhouette as an arc, dropping the bottom-front sector the jaw takes over
function silhouetteArc(cx, cy, rad, n = 220) {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;            // math angle, y-up
    const degA = (a * 180) / Math.PI;
    const downCentred = ((degA - 270 + 540) % 360) - 180; // distance from straight-down (270deg)
    if (Math.abs(downCentred) < 36) continue;   // omit internal bottom arc
    p.push({ x: cx + rad * Math.cos(a), y: cy - rad * Math.sin(a) });
  }
  return p;
}

function renderTile(yawDeg, pitchDeg, { debug = false } = {}) {
  const W = 360, H = 520, scale = 150, cx = 180, cy = 188;
  const cv = new Canvas(W, H);
  const yaw = deg(yawDeg), pitch = deg(pitchDeg);
  let seed = 7 + Math.round(yawDeg * 3 + pitchDeg * 5);

  // silhouette first (it reads as the cranium outline)
  cv.stroke(silhouetteArc(cx, cy, R * scale), {
    ...STYLE.silhouette, seed: seed++, closed: false, taper: false,
  });

  for (const prim of loomisHead()) {
    const proj = prim.pts.map((p3) => {
      const r = rotateYawPitch(p3, yaw, pitch);
      const pr = project(r, cx, cy, scale);
      pr.vis = visibleAgainstSphere(r, R);
      return pr;
    });

    // finishing policy: guides drop in clean mode (shown faint only in debug)
    if (prim.role === "guide" && !debug) continue;

    const st = STYLE[prim.role] || STYLE.construct;
    for (const run of runs(proj, true)) {
      cv.stroke(run, { ...st, seed: seed++ });
    }
    if (debug) {
      for (const run of runs(proj, false)) {
        cv.stroke(run, { ...STYLE.hidden, seed: seed++ });
      }
    }
  }
  return cv;
}

// ---- contact sheet of 4 angles ----
const angles = [
  { yaw: 0, pitch: 7, label: "front" },
  { yaw: 33, pitch: 7, label: "3/4" },
  { yaw: 78, pitch: 4, label: "profile" },
  { yaw: 30, pitch: -24, label: "tilt-up" },
];
const gut = 12, TW = 360, TH = 520;
const sheet = new Canvas(2 * TW + 3 * gut, 2 * TH + 3 * gut, [245, 244, 240]);
angles.forEach((a, i) => {
  const tile = renderTile(a.yaw, a.pitch);
  const col = i % 2, row = (i / 2) | 0;
  sheet.blit(tile, gut + col * (TW + gut), gut + row * (TH + gut));
});
fs.writeFileSync("proof/out/loomis_contact.png", sheet.toPNG());

// ---- debug view: same head, scaffold + hidden line revealed ----
fs.writeFileSync("proof/out/loomis_debug.png", renderTile(20, 7, { debug: true }).toPNG());

console.log("wrote proof/out/loomis_contact.png and proof/out/loomis_debug.png");
