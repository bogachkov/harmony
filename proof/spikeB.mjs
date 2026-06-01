// spikeB.mjs — v5 Spike B: union robustness + outer-ring extraction + the
// seating-overlap concavity check. Two cases: masses seated with overlap (clean
// single ring, shallow concavity) vs under-seated (scallop notch the check
// must catch). Passes if seated is clean AND under-seated is flagged.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera, project } from "./head/camera.mjs";
import { circleRing, unionOuter, maxNotchDepth } from "./head/union.mjs";

// head-local spheres: cranium + two cheeks + jaw. Seated vs under-seated sets.
const SEATED = [
  { c: [0, 0, 0], r: 1.0 },
  { c: [0.55, -0.35, 0.45], r: 0.5 },
  { c: [-0.55, -0.35, 0.45], r: 0.5 },
  { c: [0, -1.05, 0.30], r: 0.6 },
];
const UNDERSEATED = [
  { c: [0, 0, 0], r: 1.0 },
  { c: [1.05, -0.7, 0.45], r: 0.5 },
  { c: [-1.05, -0.7, 0.45], r: 0.5 },
  { c: [0, -1.75, 0.30], r: 0.6 },
];

function build(masses, cam) {
  const rings = masses.map((m) => {
    const c = project(m.c, cam);            // sphere silhouette = circle (ortho)
    return circleRing(c.x, c.y, m.r * cam.scale);
  });
  const outer = unionOuter(rings);
  return { rings, outer, notch: outer ? maxNotchDepth(outer) : Infinity };
}

function renderCell(masses, cam, outer) {
  const cv = new Canvas(260, 320);
  for (const r of masses.map((m) => { const c = project(m.c, cam); return circleRing(c.x, c.y, m.r * cam.scale, 64); }))
    cv.stroke(r.map((p) => ({ x: p[0], y: p[1] })), { width: 1.0, color: [205, 205, 212], wobble: 0, seed: 1, closed: true });
  if (outer) cv.stroke([...outer, outer[0]], { width: 3.0, color: [22, 22, 28], wobble: 0, seed: 2, closed: true });
  return cv;
}

const cam = makeCamera({ yaw: 20 * Math.PI / 180, pitch: 6 * Math.PI / 180, scale: 95, cx: 130, cy: 150 });
const seated = build(SEATED, cam);
const under = build(UNDERSEATED, cam);
const craniumScreenR = 1.0 * cam.scale;
const tol = 0.16 * craniumScreenR;          // scallop tolerance

const gut = 8, CW = 260, CH = 320;
const sheet = new Canvas(2 * CW + 3 * gut, CH + 2 * gut, [246, 245, 242]);
sheet.blit(renderCell(SEATED, cam, seated.outer), gut, gut);
sheet.blit(renderCell(UNDERSEATED, cam, under.outer), 2 * gut + CW, gut);
fs.writeFileSync("proof/out/spikeB.png", sheet.toPNG());

const seatedClean = seated.outer && seated.notch < tol;
const underFlagged = under.outer && under.notch >= tol;
const result = {
  tol: +tol.toFixed(2),
  seated: { ring: !!seated.outer, notch: +seated.notch.toFixed(2), clean: seatedClean },
  underseated: { ring: !!under.outer, notch: +under.notch.toFixed(2), flagged: underFlagged },
  pass: !!(seatedClean && underFlagged),
};
fs.writeFileSync("proof/out/spikeB.json", JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
