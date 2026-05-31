// render2.mjs — proof v2: merge via z-buffer. Outline = boundary of the union
// coverage; construction curves are hidden-line tested against the same buffer.
import fs from "node:fs";
import { Canvas, rotateYawPitch, project, deg } from "./core.mjs";
import { craniumPoints, jawPoints, neckPoints, buildZ, traceMoore, largestComponent, jawSection, smoothClosed, dp, R } from "./solid.mjs";

// the inked construction marks (curves only; the outline comes from the z-buffer)
function curves() {
  const yz = [], xz = [];
  const N = 200;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * 2 * Math.PI;
    yz.push([0, R * Math.sin(a), R * Math.cos(a)]);       // centre line
    xz.push([R * Math.sin(a), 0, R * Math.cos(a)]);       // brow/eye line
  }
  // thirds ride the actual jaw surface (front arc of that cross-section)
  const third = (y) => {
    const { wx, wzF, zc } = jawSection(y), tm = deg(68), p = [];
    for (let i = 0; i <= 80; i++) { const t = -tm + (i / 80) * 2 * tm; p.push([wx * Math.sin(t), y, zc + wzF * Math.cos(t)]); }
    return p;
  };
  return [
    { st: { width: 2.0, color: [70, 70, 84], wobble: 0.7 }, pts: yz },
    { st: { width: 2.0, color: [70, 70, 84], wobble: 0.7 }, pts: xz },
    { st: { width: 1.5, color: [130, 130, 145], wobble: 0.6 }, pts: third(-1.0) },
    { st: { width: 1.5, color: [130, 130, 145], wobble: 0.6 }, pts: third(-1.5) },
    { st: { width: 1.5, color: [130, 130, 145], wobble: 0.6 }, pts: third(-1.82) },
  ];
}

function runsVisible(pts, z, W, H, cx, cy, scale, yaw, pitch, tol = 0.06) {
  const out = []; let cur = null;
  for (const p3 of pts) {
    const r = rotateYawPitch(p3, yaw, pitch);
    const pr = project(r, cx, cy, scale);
    const xi = Math.round(pr.x), yi = Math.round(pr.y);
    let vis = true;
    if (xi >= 1 && yi >= 1 && xi < W - 1 && yi < H - 1) {
      let dmax = -Infinity;                              // nearest surface in a 3x3 nbhd (kills quantization dashing)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) { const v = z[(yi + dy) * W + xi + dx]; if (v > dmax) dmax = v; }
      if (dmax === -Infinity) vis = false;               // projects outside the form -> not a real mark
      else if (r[2] < dmax - tol) vis = false;           // something nearer covers it
    } else vis = false;
    if (vis) (cur ||= []).push({ x: pr.x, y: pr.y });
    else if (cur) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out;
}

function renderTile(yawDeg, pitchDeg) {
  const W = 360, H = 560, scale = 120, cx = 180, cy = 150;
  const yaw = deg(yawDeg), pitch = deg(pitchDeg);
  const z = buildZ(W, H, cx, cy, scale, yaw, pitch, [craniumPoints(), jawPoints(), neckPoints()]);
  const cv = new Canvas(W, H);
  let seed = 11 + Math.round(yawDeg * 3 + pitchDeg * 5);

  // merged head outline from the union coverage
  const raw = traceMoore(largestComponent(z, W, H), W, H);
  if (raw) {
    const simp = dp(smoothClosed(raw, 3), 1.0);
    cv.stroke([...simp, simp[0]], { width: 3.2, color: [22, 22, 28], wobble: 0.55, seed: seed++, closed: true, taper: false });
  }
  // construction curves are scaffolding — the finished drawing drops them
  for (const c of (process.env.SHOW_CONSTRUCTION ? curves() : []))
    for (const run of runsVisible(c.pts, z, W, H, cx, cy, scale, yaw, pitch))
      cv.stroke(run, { ...c.st, seed: seed++ });

  return cv;
}

const angles = [
  { yaw: 0, pitch: 7 }, { yaw: 33, pitch: 7 },
  { yaw: 78, pitch: 4 }, { yaw: 30, pitch: -24 },
];
const gut = 12, TW = 360, TH = 560;
const sheet = new Canvas(2 * TW + 3 * gut, 2 * TH + 3 * gut, [245, 244, 240]);
angles.forEach((a, i) => {
  const tile = renderTile(a.yaw, a.pitch);
  sheet.blit(tile, gut + (i % 2) * (TW + gut), gut + ((i / 2) | 0) * (TH + gut));
});
fs.writeFileSync("proof/out/loomis_v2_contact.png", sheet.toPNG());
console.log("wrote proof/out/loomis_v2_contact.png");
