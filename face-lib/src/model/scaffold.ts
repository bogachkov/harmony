import type { FaceParams } from './params.ts';
import type { Vec3 } from '../math/vec3.ts';
import { v3, ellipsoidPoint } from '../math/vec3.ts';

// A Curve is a 3D polyline. The renderer projects each point and strokes them as one path.
export type Curve = {
  kind: 'construction' | 'feature';
  closed: boolean;
  points: Vec3[];
};

export type Scaffold = {
  // Outline of the head from the FRONT projection. In 3D this is built from the cranium ellipse
  // (intersected by side planes) plus the jaw curve down to the chin point.
  silhouette: Curve;
  // Loomis construction guides
  centerline: Curve;
  eyeline: Curve;
  browline: Curve;
  mouthline: Curve;
  sidePlanes: Curve[]; // two near-vertical curves where the cranium is sliced flat
  // Features (paired structures duplicated left/right where applicable)
  features: Curve[];
};

const TAU = Math.PI * 2;

// Sample N points along an arc of an ellipse in the XY plane, z = zSurface(theta) on the head.
// `start` and `end` are angles measured from +X axis going counter-clockwise (i.e. up).
const ellipseArcXY = (rx: number, ry: number, start: number, end: number, samples: number, zOf: (theta: number) => number): Vec3[] => {
  const pts: Vec3[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = start + (end - start) * (i / samples);
    pts.push([rx * Math.cos(t), ry * Math.sin(t), zOf(t)]);
  }
  return pts;
};

// A smooth jaw curve from a cheek point down to the chin and back up, in the XY plane.
// Two cubic Bezier halves meeting at the chin, so the chin tangent is continuous.
const jawCurve = (cheekL: Vec3, cheekR: Vec3, chin: Vec3, sharpness: number, samples: number): Vec3[] => {
  const pts: Vec3[] = [];
  pts.push(cheekL);
  // left → chin
  {
    const a = cheekL, b = chin;
    const c1x = a[0] * (1 - sharpness * 0.2);
    const c1y = a[1] - (a[1] - b[1]) * 0.55;
    const c2x = b[0] + (a[0] - b[0]) * (0.25 - sharpness * 0.2);
    const c2y = b[1] + (a[1] - b[1]) * 0.1;
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const mt = 1 - t;
      const x = mt * mt * mt * a[0] + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * b[0];
      const y = mt * mt * mt * a[1] + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * b[1];
      const z = mt * a[2] + t * b[2];
      pts.push([x, y, z]);
    }
  }
  // chin → right
  {
    const a = chin, b = cheekR;
    const c1x = a[0] + (b[0] - a[0]) * (0.25 - sharpness * 0.2);
    const c1y = a[1] + (b[1] - a[1]) * 0.1;
    const c2x = b[0] * (1 - sharpness * 0.2);
    const c2y = b[1] - (b[1] - a[1]) * 0.55;
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const mt = 1 - t;
      const x = mt * mt * mt * a[0] + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * b[0];
      const y = mt * mt * mt * a[1] + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * b[1];
      const z = mt * a[2] + t * b[2];
      pts.push([x, y, z]);
    }
  }
  return pts;
};

// Eye shape: upper and lower lid curves (returned as two separate sub-curves for the renderer),
// plus iris circle and pupil. Built around an anchor on the surface of the head.
const buildEye = (anchor: Vec3, halfWidth: number, openness: number, tilt: number, surfaceZ: number): Curve[] => {
  const samples = 16;
  const upper: Vec3[] = [];
  const lower: Vec3[] = [];
  const cos = Math.cos(tilt), sin = Math.sin(tilt);
  // Lid curves: upper arches up, lower arches down; openness scales the vertical extent.
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = -halfWidth + 2 * halfWidth * t;          // local x
    const yUp = openness * halfWidth * 0.55 * Math.sin(Math.PI * t);
    const yDn = -openness * halfWidth * 0.32 * Math.sin(Math.PI * t);
    // Apply tilt in the eye's local frame, then translate by anchor.
    const upX = anchor[0] + (x * cos - yUp * sin);
    const upY = anchor[1] + (x * sin + yUp * cos);
    const dnX = anchor[0] + (x * cos - yDn * sin);
    const dnY = anchor[1] + (x * sin + yDn * cos);
    upper.push([upX, upY, surfaceZ]);
    lower.push([dnX, dnY, surfaceZ]);
  }
  const curves: Curve[] = [
    { kind: 'feature', closed: false, points: upper },
    { kind: 'feature', closed: false, points: lower },
  ];
  // Iris/pupil only if reasonably open
  if (openness > 0.25) {
    const irisR = halfWidth * 0.42;
    const iris: Vec3[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * TAU;
      iris.push([anchor[0] + Math.cos(a) * irisR, anchor[1] + Math.sin(a) * irisR * Math.min(1, openness), surfaceZ + 0.001]);
    }
    curves.push({ kind: 'feature', closed: true, points: iris });
  }
  return curves;
};

const buildBrow = (anchor: Vec3, length: number, innerOffset: number, outerOffset: number, arch: number, surfaceZ: number, isLeft: boolean): Curve => {
  const samples = 12;
  const pts: Vec3[] = [];
  const innerX = isLeft ? anchor[0] + length : anchor[0] - length;
  // Curve from inner anchor to outer end; anchor is the inner end.
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    // Linear interp position
    const x = anchor[0] + (isLeft ? -1 : 1) * length * t;
    // Vertical: lerp from innerOffset (at t=0) to outerOffset (at t=1), plus arch hump
    const baseY = anchor[1] + (innerOffset * (1 - t) + outerOffset * t);
    const archY = arch * length * 0.18 * Math.sin(Math.PI * t);
    pts.push([x, baseY + archY, surfaceZ]);
  }
  void innerX; // (kept for clarity; not needed once we parameterize by length)
  return { kind: 'feature', closed: false, points: pts };
};

const buildNose = (browBridge: Vec3, length: number, width: number, surfaceZ: number, bridgeVisible: boolean): Curve[] => {
  const curves: Curve[] = [];
  const tip: Vec3 = [browBridge[0], browBridge[1] - length, surfaceZ + 0.04];
  // Bridge (optional construction-ish line, but rendered as feature when visible)
  if (bridgeVisible) {
    curves.push({ kind: 'feature', closed: false, points: [browBridge, tip] });
  }
  // Base: left wing → underside curve → right wing (a shallow arc dipping under the tip)
  const half = width / 2;
  const base: Vec3[] = [];
  const samples = 12;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = -half + width * t;
    const y = tip[1] - Math.sin(Math.PI * t) * width * 0.18;
    base.push([browBridge[0] + x, y, surfaceZ + 0.02]);
  }
  curves.push({ kind: 'feature', closed: false, points: base });
  // Nostril hints: two tiny tick marks under the base
  const tick = width * 0.12;
  const nostrilY = tip[1] - width * 0.05;
  curves.push({
    kind: 'feature', closed: false, points: [
      [browBridge[0] - half * 0.45, nostrilY, surfaceZ + 0.02],
      [browBridge[0] - half * 0.45 + tick, nostrilY - tick * 0.6, surfaceZ + 0.02],
    ],
  });
  curves.push({
    kind: 'feature', closed: false, points: [
      [browBridge[0] + half * 0.45, nostrilY, surfaceZ + 0.02],
      [browBridge[0] + half * 0.45 - tick, nostrilY - tick * 0.6, surfaceZ + 0.02],
    ],
  });
  return curves;
};

const buildMouth = (center: Vec3, width: number, openness: number, cornerLift: number, upperCurve: number, surfaceZ: number): Curve[] => {
  const samples = 20;
  const half = width / 2;
  const upper: Vec3[] = [];
  const lower: Vec3[] = [];
  // Upper lip line: corners at y = cornerLift, midline dips/peaks per upperCurve
  // For closed mouth, both lines collapse to a single line through the same y; we still emit upper.
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = -half + width * t;
    // Smile/frown: corners lifted/lowered; center near 0
    const cornerWeight = Math.pow(Math.abs(t - 0.5) * 2, 1.8); // 0 at center, 1 at corners
    const cornerY = cornerLift * cornerWeight;
    // Cupid's-bow-ish dip at the center, plus user-controlled upperCurve
    const centerDip = -upperCurve * width * 0.04 * Math.sin(Math.PI * t);
    const yUpper = cornerY + centerDip + openness * width * 0.18 * Math.sin(Math.PI * t);
    const yLower = cornerY - openness * width * 0.22 * Math.sin(Math.PI * t);
    upper.push([center[0] + x, center[1] + yUpper, surfaceZ]);
    lower.push([center[0] + x, center[1] + yLower, surfaceZ]);
  }
  const curves: Curve[] = [{ kind: 'feature', closed: false, points: upper }];
  if (openness > 0.05) curves.push({ kind: 'feature', closed: false, points: lower });
  return curves;
};

// Build the full 3D scaffold from parameters. Y-up, X-right, Z-out-of-the-page.
export const buildScaffold = (p: FaceParams): Scaffold => {
  const rx = p.head.width / 2;
  const ry = p.head.height / 2;
  const rz = p.head.depth / 2;
  const sx = rx * (1 - p.head.sidePlaneInset);          // half-width at side planes
  const chinY = -ry - p.head.chinDrop;
  const cheekY = -ry * 0.35;                            // where jaw begins to curve in
  const cheekHalfWidth = sx * (0.85 + 0.15 * (1 - p.head.chinSharpness));
  // Eye line at midline of total head height (top of cranium to chin).
  const totalHeight = (ry) - (chinY);
  const eyeY = (ry + chinY) / 2 + p.eyes.yOffset * p.head.height;
  // Default Loomis-style positions:
  const browY = eyeY + p.brows.yOffset * p.head.height;
  // Mouth ~1/3 from chin to nose-base (which is between eye and chin)
  const noseBaseY = eyeY - p.nose.length * p.head.height;
  const mouthY = noseBaseY + (chinY - noseBaseY) * 0.40 + p.mouth.yOffset * p.head.height;
  void totalHeight;

  // Helper: Z on the front of the ellipsoid for a given (x, y)
  const frontZ = (x: number, y: number): number => {
    const u = x / rx, v = y / ry;
    const k = 1 - u * u - v * v;
    return k > 0 ? rz * Math.sqrt(k) : 0;
  };

  // ---- Silhouette: top arc from left-temple over top to right-temple, then side planes, then jaw curve.
  // Find the angle where the ellipse outline meets the side plane: x = ±sx → cos(theta) = ±sx/rx → theta
  const sideThetaTop = Math.acos(Math.min(1, sx / rx));  // angle from +X axis to where outline meets right side plane on top
  const sideThetaBot = Math.acos(Math.min(1, sx / rx));  // same on bottom intersection
  const leftTempleTop: Vec3 = [-sx, ry * Math.sin(Math.PI - sideThetaTop), 0];
  const rightTempleTop: Vec3 = [sx, ry * Math.sin(sideThetaTop), 0];
  const leftTempleBot: Vec3 = [-sx, -ry * Math.sin(Math.PI - sideThetaBot), 0];   // ≈ -ry * sin(sideTheta)
  const rightTempleBot: Vec3 = [sx, -ry * Math.sin(sideThetaBot), 0];

  // Top arc: from rightTempleTop counterclockwise over the top to leftTempleTop
  const topArc = ellipseArcXY(rx, ry, sideThetaTop, Math.PI - sideThetaTop, 28, (theta) => frontZ(rx * Math.cos(theta), ry * Math.sin(theta)));

  // Side plane edges: vertical-ish curves from top to where the jaw curve picks up at cheek.
  const cheekL: Vec3 = [-cheekHalfWidth, cheekY, frontZ(-cheekHalfWidth, cheekY)];
  const cheekR: Vec3 = [cheekHalfWidth, cheekY, frontZ(cheekHalfWidth, cheekY)];
  const sideL: Vec3[] = [leftTempleTop, [-sx, cheekY * 0.6, 0], cheekL];
  const sideR: Vec3[] = [rightTempleTop, [sx, cheekY * 0.6, 0], cheekR];

  // Jaw curve from cheekL → chin → cheekR
  const chin: Vec3 = [0, chinY, p.head.depth * 0.25];
  const jaw = jawCurve(cheekL, cheekR, chin, p.head.chinSharpness, 18);
  void leftTempleBot; void rightTempleBot;

  // Compose silhouette: right-temple-top → top-arc → left-temple-top → sideL → jaw → sideR (reversed) → close
  // We want a single closed polyline going counter-clockwise starting from rightTempleTop.
  const silhouettePoints: Vec3[] = [];
  silhouettePoints.push(...topArc);                            // right-top → top → left-top
  silhouettePoints.push(...sideL.slice(1));                    // skip duplicate left-top
  silhouettePoints.push(...jaw.slice(1));                      // cheekL already last point of sideL
  // Now we're at cheekR; walk side plane back up to rightTempleTop
  silhouettePoints.push(...sideR.slice(0, -1).reverse());      // cheekR → ... → rightTempleTop (drop duplicate cheekR via slice/reverse)

  const silhouette: Curve = { kind: 'feature', closed: true, points: silhouettePoints };

  // ---- Construction guides
  const centerline: Curve = {
    kind: 'construction', closed: false,
    points: [
      [0, ry, frontZ(0, ry)],
      [0, chinY, p.head.depth * 0.25],
    ],
  };
  // Eyeline / browline / mouthline: short horizontal segments across the face width at their Y.
  const lineAt = (y: number, halfReach: number, zBias = 0): Curve => {
    const samples = 16;
    const pts: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -halfReach + 2 * halfReach * t;
      pts.push([x, y, frontZ(x, y) + zBias]);
    }
    return { kind: 'construction', closed: false, points: pts };
  };
  const eyeline = lineAt(eyeY, rx * 0.95);
  const browline = lineAt(browY, rx * 0.85);
  const mouthline = lineAt(mouthY, rx * 0.7);

  // Side-plane visualizations (curves down the side of the head from temple top to cheek).
  const sidePlaneL: Curve = { kind: 'construction', closed: false, points: sideL };
  const sidePlaneR: Curve = { kind: 'construction', closed: false, points: sideR };

  // ---- Features
  const halfEye = (p.eyes.size * p.head.width) / 2;
  const eyeAnchorX = (p.eyes.spacing * p.head.width) / 2;
  const eyeSurfaceZ = frontZ(eyeAnchorX, eyeY);
  const leftEyeAnchor: Vec3 = [-eyeAnchorX, eyeY, eyeSurfaceZ];
  const rightEyeAnchor: Vec3 = [eyeAnchorX, eyeY, eyeSurfaceZ];

  const features: Curve[] = [];
  features.push(...buildEye(leftEyeAnchor, halfEye, p.eyes.openness, p.eyes.tilt, eyeSurfaceZ));
  features.push(...buildEye(rightEyeAnchor, halfEye, p.eyes.openness, -p.eyes.tilt, eyeSurfaceZ));

  const browLen = p.brows.length * p.head.width;
  const browInnerX = p.brows.spacing * p.head.width;
  const browYAbs = eyeY + p.brows.yOffset * p.head.height;
  const leftBrowAnchor: Vec3 = [-browInnerX, browYAbs + p.brows.innerHeight * p.head.height, frontZ(-browInnerX, browYAbs)];
  const rightBrowAnchor: Vec3 = [browInnerX, browYAbs + p.brows.innerHeight * p.head.height, frontZ(browInnerX, browYAbs)];
  features.push(buildBrow(leftBrowAnchor, browLen, 0, p.brows.outerHeight * p.head.height - p.brows.innerHeight * p.head.height, p.brows.arch, leftBrowAnchor[2], true));
  features.push(buildBrow(rightBrowAnchor, browLen, 0, p.brows.outerHeight * p.head.height - p.brows.innerHeight * p.head.height, p.brows.arch, rightBrowAnchor[2], false));

  const browBridge: Vec3 = [0, browY - p.head.height * 0.02, frontZ(0, browY)];
  features.push(...buildNose(browBridge, p.nose.length * p.head.height, p.nose.width * p.head.width, frontZ(0, browY), p.nose.bridgeVisible));

  const mouthCenter: Vec3 = [0, mouthY, frontZ(0, mouthY)];
  features.push(...buildMouth(mouthCenter, p.mouth.width * p.head.width, p.mouth.openness, p.mouth.cornerLift * p.head.height, p.mouth.upperCurve, frontZ(0, mouthY)));

  void v3; // shut up unused-import in some toolchains
  return {
    silhouette,
    centerline,
    eyeline,
    browline,
    mouthline,
    sidePlanes: [sidePlaneL, sidePlaneR],
    features,
  };
};

export const allCurves = (s: Scaffold, showConstruction: boolean, showSidePlanes: boolean): Curve[] => {
  const out: Curve[] = [s.silhouette, ...s.features];
  if (showConstruction) {
    out.push(s.centerline, s.eyeline, s.browline, s.mouthline);
  }
  if (showSidePlanes) {
    out.push(...s.sidePlanes);
  }
  return out;
};

// Re-export so external callers don't have to dig into params for the ellipsoid sampler.
export { ellipsoidPoint };
