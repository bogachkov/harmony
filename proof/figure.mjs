// figure.mjs — minimal posable stick figure: pelvis (root), torso->head,
// two arms, two legs. No elbows/knees. FK by composing per-joint frames.
// Pose = a map of jointName -> {x,y,z} euler degrees applied in the joint's
// own frame. Limits clamp each pose so nonsense angles can't happen.

const D = (d) => (d * Math.PI) / 180;

// --- 3x3 matrix helpers (column-of-rows form) ---
function mul(a, b) {
  const r = [[0,0,0],[0,0,0],[0,0,0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
    r[i][j] = a[i][0]*b[0][j] + a[i][1]*b[1][j] + a[i][2]*b[2][j];
  return r;
}
function apply(m, v) {
  return [
    m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2],
    m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2],
    m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2],
  ];
}
const Rx = (a) => [[1,0,0],[0,Math.cos(a),-Math.sin(a)],[0,Math.sin(a),Math.cos(a)]];
const Ry = (a) => [[Math.cos(a),0,Math.sin(a)],[0,1,0],[-Math.sin(a),0,Math.cos(a)]];
const Rz = (a) => [[Math.cos(a),-Math.sin(a),0],[Math.sin(a),Math.cos(a),0],[0,0,1]];
function euler(x, y, z) { return mul(Rz(D(z)), mul(Ry(D(y)), Rx(D(x)))); }

// --- the figure: each joint has a parent, an offset in the parent's frame
//     (the bone vector leading TO this joint), limits, and whether it draws a
//     bone from its parent. Y is up. ---
export const FIGURE = [
  { name: "pelvis", parent: null, offset: [0, 0, 0], limits: null, bone: false },
  { name: "torso",  parent: "pelvis", offset: [0, 1.6, 0], limits: { x:[-40,40], y:[-60,60], z:[-30,30] }, bone: true },
  { name: "head",   parent: "torso",  offset: [0, 0.9, 0], limits: { x:[-35,35], y:[-70,70], z:[-30,30] }, bone: true, headR: 0.42 },
  { name: "armL",   parent: "torso",  offset: [0.75, 0.55, 0], limits: { x:[-150,150], y:[-90,90], z:[-120,120] }, bone: true, len: 1.5 },
  { name: "armR",   parent: "torso",  offset: [-0.75, 0.55, 0], limits: { x:[-150,150], y:[-90,90], z:[-120,120] }, bone: true, len: 1.5 },
  { name: "legL",   parent: "pelvis", offset: [0.38, -0.1, 0], limits: { x:[-120,120], y:[-45,45], z:[-60,60] }, bone: true, len: 1.8 },
  { name: "legR",   parent: "pelvis", offset: [-0.38, -0.1, 0], limits: { x:[-120,120], y:[-45,45], z:[-60,60] }, bone: true, len: 1.8 },
];

const byName = Object.fromEntries(FIGURE.map((j) => [j.name, j]));

function clamp(v, lim) {
  if (!lim) return v;
  const c = (a, [lo, hi]) => Math.max(lo, Math.min(hi, a));
  return { x: c(v.x || 0, lim.x), y: c(v.y || 0, lim.y), z: c(v.z || 0, lim.z) };
}

// Forward kinematics. Returns each joint's world origin + world frame, and the
// bone segment (parentOrigin -> jointOrigin) for drawing. Limbs extend along
// their own -Y after the joint rotation (arms/legs hang, then swing).
export function solve(pose = {}) {
  const out = {};
  for (const j of FIGURE) {
    const local = clamp(pose[j.name] || {}, j.limits);
    const R = euler(local.x || 0, local.y || 0, local.z || 0);
    if (j.parent === null) {
      out[j.name] = { origin: [0, 0, 0], frame: R, tip: [0, 0, 0] };
      continue;
    }
    const p = out[j.parent];
    const origin = add(p.origin, apply(p.frame, j.offset)); // joint position
    const frame = mul(p.frame, R);                          // joint's own axes
    let tip = origin;
    if (j.len) tip = add(origin, apply(frame, [0, -j.len, 0])); // limb end
    out[j.name] = { origin, frame, tip, seg: [p.origin, origin], def: j };
  }
  return out;
}
function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }

export { byName };
