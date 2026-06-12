// head.mjs — a hand-authored, already-constructed Loomis head as 3D primitives.
// This is the "pretend we ran all the construction rules" model. Each primitive
// is a list of 3D points plus a finishing role; no rendering logic lives here.
export const R = 1; // cranium radius
const C = 0.66;     // side cut-plane offset (Loomis: ball sliced flat at the temples)

function circleYZ(n = 200) {        // vertical centre line: great circle in plane x=0
  const p = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; p.push([0, R * Math.sin(a), R * Math.cos(a)]); }
  return p;
}
function circleXZ(n = 200) {        // horizontal brow/eye line: great circle in plane y=0
  const p = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; p.push([R * Math.sin(a), 0, R * Math.cos(a)]); }
  return p;
}
function sidePlane(sign, n = 160) { // ear/side-plane circle on plane x = ±C
  const rho = Math.sqrt(R * R - C * C), p = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; p.push([sign * C, rho * Math.cos(a), rho * Math.sin(a)]); }
  return p;
}
// A horizontal cross-contour (a "third") on the face below the ball: a forward-bulging arc.
function third(y, halfW, depth, n = 80) {
  const tm = (72 * Math.PI) / 180, p = [];
  for (let i = 0; i <= n; i++) { const t = -tm + (i / n) * 2 * tm; p.push([halfW * Math.sin(t), y, depth * Math.cos(t)]); }
  return p;
}
function catmull(ctrl, perSeg = 24) {
  const pts = [], P = ctrl;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
    for (let j = 0; j < perSeg; j++) {
      const t = j / perSeg, t2 = t * t, t3 = t2 * t;
      const c = [];
      for (let k = 0; k < 3; k++) {
        c.push(0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
      }
      pts.push(c);
    }
  }
  pts.push(P[P.length - 1]);
  return pts;
}
function jaw(sign) {
  return catmull([
    [sign * 0.55, -0.15, -0.35], // hinge, behind/under the skull -> should hide
    [sign * 0.82, -0.55, 0.12],  // back of jaw
    [sign * 0.70, -1.25, 0.45],  // jaw angle
    [sign * 0.34, -1.85, 0.52],  // toward chin
    [0, -2.0, 0.50],             // chin point
  ]);
}

// roles: 'silhouette' is added at render time (view-dependent). 'guide' marks are
// scaffolding that the finishing stage drops/ghosts; the rest are final inked line.
export function loomisHead() {
  return [
    { role: "construct", kind: "centre", pts: circleYZ() },
    { role: "construct", kind: "brow", pts: circleXZ() },
    { role: "guide", kind: "sideL", pts: sidePlane(+1) },
    { role: "guide", kind: "sideR", pts: sidePlane(-1) },
    { role: "third", kind: "browLevel", pts: third(-1.0, 0.80, 0.62) },
    { role: "third", kind: "noseLevel", pts: third(-1.5, 0.60, 0.60) },
    { role: "third", kind: "chinLevel", pts: third(-1.92, 0.30, 0.52) },
    { role: "edge", kind: "jawL", pts: jaw(+1) },
    { role: "edge", kind: "jawR", pts: jaw(-1) },
  ];
}
