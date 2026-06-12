// figure.mjs — posable stick figure with anatomically-grounded joint limits.
// Hierarchy: pelvis(root) -> abdomen -> chest -> neck -> head, arms (shoulder ->
// elbow -> hand) off chest, legs (hip -> knee -> ankle -> foot) off pelvis.
// FK by composing per-joint frames. Limits are clamped per pose so nonsense
// angles can't happen. Ranges sourced from clinical goniometry charts
// (Wheeless / CDC / Orthobullets); see RANGES note per joint.

const D = (d) => (d * Math.PI) / 180;

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
function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }

// Axis convention: X = flexion/extension (forward/back), Y = rotation (twist),
// Z = abduction/lateral (out to the side). Limits in degrees [min,max].
// Bones extend along the parent frame's -Y unless given an explicit offset.
export const FIGURE = [
  { name: "pelvis", parent: null, offset: [0, 0, 0], bone: false },

  // spine split into abdomen + chest (the body-type knobs live here later).
  // lumbar+thoracic ROM split across the two segments.
  { name: "abdomen", parent: "pelvis", offset: [0, 0.7, 0], bone: true,
    limits: { x:[-25,55], y:[-20,20], z:[-25,25] } },   // lumbar-ish
  { name: "chest", parent: "abdomen", offset: [0, 0.8, 0], bone: true, chestTri: true,
    limits: { x:[-20,40], y:[-30,30], z:[-20,20] } },   // thoracic-ish

  { name: "neck", parent: "chest", offset: [0, 0.65, 0], bone: true,
    limits: { x:[-60,45], y:[-80,80], z:[-45,45] } },   // cervical
  // cranium = the ball; rides the neck. form: the construction skull lives here.
  { name: "cranium", parent: "neck", offset: [0, 0.25, 0], bone: true, form: "cranium",
    limits: { x:[-20,20], y:[-20,20], z:[-15,15] } },
  // jaw = a hinge child of the cranium; opens on X only. form: the jaw block.
  { name: "jaw", parent: "cranium", offset: [0, -0.1, 0.05], bone: false, form: "jaw",
    limits: { x:[0,32], y:[0,0], z:[0,0] } },           // 0=closed, up to ~32deg open

  // arms off the chest. shoulder offsets sit at the corners of the chest tri.
  { name: "shoulderL", parent: "chest", offset: [0.62, 0.42, 0], bone: true, len: 1.05,
    limits: { x:[-60,180], y:[-90,90], z:[-30,170] } }, // flex/ext, rot, abd
  { name: "elbowL", parent: "shoulderL", fromTip: true, bone: true, len: 0.95,
    limits: { x:[0,145], y:[0,0], z:[0,0] } },          // hinge only
  { name: "handL", parent: "elbowL", fromTip: true, bone: true, len: 0.28,
    limits: { x:[-60,60], y:[0,0], z:[-20,20] } },

  { name: "shoulderR", parent: "chest", offset: [-0.62, 0.42, 0], bone: true, len: 1.05,
    limits: { x:[-60,180], y:[-90,90], z:[-170,30] } },
  { name: "elbowR", parent: "shoulderR", fromTip: true, bone: true, len: 0.95,
    limits: { x:[0,145], y:[0,0], z:[0,0] } },
  { name: "handR", parent: "elbowR", fromTip: true, bone: true, len: 0.28,
    limits: { x:[-60,60], y:[0,0], z:[-20,20] } },

  // legs off the pelvis.
  { name: "hipL", parent: "pelvis", offset: [0.32, -0.1, 0], bone: true, len: 1.15,
    limits: { x:[-30,120], y:[-40,40], z:[-20,45] } },  // flex/ext, rot, abd/add
  { name: "kneeL", parent: "hipL", fromTip: true, bone: true, len: 1.05,
    limits: { x:[-140,0], y:[0,0], z:[0,0] } },         // hinge (bends back)
  { name: "ankleL", parent: "kneeL", fromTip: true, bone: true, len: 0.4, foot: true,
    limits: { x:[-45,20], y:[0,0], z:[0,0] } },         // plantar/dorsi

  { name: "hipR", parent: "pelvis", offset: [-0.32, -0.1, 0], bone: true, len: 1.15,
    limits: { x:[-30,120], y:[-40,40], z:[-45,20] } },
  { name: "kneeR", parent: "hipR", fromTip: true, bone: true, len: 1.05,
    limits: { x:[-140,0], y:[0,0], z:[0,0] } },
  { name: "ankleR", parent: "kneeR", fromTip: true, bone: true, len: 0.4, foot: true,
    limits: { x:[-45,20], y:[0,0], z:[0,0] } },
];

const byName = Object.fromEntries(FIGURE.map((j) => [j.name, j]));

function clamp(v, lim) {
  if (!lim) return { x: v.x || 0, y: v.y || 0, z: v.z || 0 };
  const c = (a, [lo, hi]) => Math.max(lo, Math.min(hi, a));
  return { x: c(v.x || 0, lim.x), y: c(v.y || 0, lim.y), z: c(v.z || 0, lim.z) };
}

// Forward kinematics. A joint's origin is its parent's origin plus offset (or the
// parent's limb tip if fromTip). Limb bones run along the joint frame's -Y to a tip.
export function solve(pose = {}) {
  const out = {};
  for (const j of FIGURE) {
    if (j.parent === null) { out[j.name] = { origin: [0,0,0], frame: euler(0,0,0), tip: [0,0,0], def: j }; continue; }
    const p = out[j.parent];
    const base = j.fromTip ? p.tip : add(p.origin, apply(p.frame, j.offset || [0,0,0]));
    const local = clamp(pose[j.name] || {}, j.limits);
    const frame = mul(p.frame, euler(local.x, local.y, local.z));
    const tip = j.len ? add(base, apply(frame, [0, -j.len, 0])) : base;
    out[j.name] = { origin: base, frame, tip, seg: [j.fromTip ? p.tip : p.origin, base], def: j };
  }
  return out;
}

export { byName };
