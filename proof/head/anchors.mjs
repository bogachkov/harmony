// anchors.mjs — typed mounting brackets (v5 §1b). An anchor says WHERE / at what
// ANGLE / what SIZE a feature mounts, and which joint owns it — NEVER what the
// feature looks like (that is style's job). Each anchor carries a full frame
// (origin + 3 orthonormal axes) so "up/roll" is unambiguous, plus an extent and
// an owning joint. Built on the step-2 proportion landmarks (ratios of masses).

import { landmarks } from "./proportions.mjs";
import { headForms } from "./forms.mjs";

function norm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];}
function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function scale(v,s){return [v[0]*s,v[1]*s,v[2]*s];}

// Build an orthonormal frame at origin o whose +z axis points OUTWARD (away from
// head center along the radial direction), with an optional roll (tilt) about z.
// outward = the surface-normal-ish direction; x = across, y = up-on-the-feature.
function frameAt(o, center, rollDeg = 0) {
  const z = norm([o[0]-center[0], o[1]-center[1], o[2]-center[2]]); // outward radial
  let up = [0,1,0];
  let x = norm(cross(up, z));            // across
  let y = norm(cross(z, x));             // up on the feature, ⊥ z and x
  if (rollDeg) {                          // tilt x/y about the outward axis (canthal/ear lean)
    const a = rollDeg*Math.PI/180, c = Math.cos(a), s = Math.sin(a);
    const x2 = add(scale(x, c), scale(y, s));
    const y2 = add(scale(x,-s), scale(y, c));
    x = norm(x2); y = norm(y2);
  }
  return { o, x, y, z };
}

export function anchors(F = headForms()) {
  const L = landmarks(F);
  const HEAD = [0, (L.crownY + L.chinY)/2, 0];   // head reference center (crown→chin)

  // EYE: socket frame + extent {socketR, seatDepth}; canthal tilt (inner corner
  // lower → opposite roll sign per side); brow recession depth (how far the seat
  // sits BACK under the brow). Eye does NOT emit a silhouette proxy.
  const canthal = 8;                              // degrees, inner-corner-down
  const eyeSocketR = L.eyeWidth * 0.5;
  const browRecession = L.surfZ * (1/4);          // seat set back 1/4 of face depth
  const eyeL = { name:"eyeL", joint:"cranium", kind:"eye",
    frame: frameAt(L.eyeL, HEAD, +canthal),
    extent: { socketR: eyeSocketR, seatDepth: browRecession }, proxy: false };
  const eyeR = { name:"eyeR", joint:"cranium", kind:"eye",
    frame: frameAt(L.eyeR, HEAD, -canthal),
    extent: { socketR: eyeSocketR, seatDepth: browRecession }, proxy: false };

  // NOSE: root frame + base frame + bounding plane. Base emits a silhouette proxy
  // (so profile keeps the nose). No filled outline; projection is a style dial.
  const nose = { name:"nose", joint:"cranium", kind:"nose",
    rootFrame: frameAt(L.noseRoot, HEAD),
    baseFrame: frameAt(L.noseBase, HEAD),
    boundingPlane: { o: L.noseBase, normal: norm([0,0,1]) },
    // project so the nose tip clears the cranium front by a visible margin — the
    // tip reaches ~1.5 ball-radii forward, derived from the mass (not a guess), so
    // the nose actually reads in profile.
    extent: { halfW: L.eyeWidth * 0.5, project: L.faceHalfW * 1.5 - L.noseBase[2] }, proxy: "base" };

  // EARS: stub frame with long-axis ~15° back lean + flare; back third at hinge
  // level; vertical span derived from the head reference. Emits a silhouette proxy.
  const earLean = 15, earFlare = 20;
  const earL = { name:"earL", joint:"cranium", kind:"ear",
    frame: frameAt(L.earL, HEAD, +earLean),
    extent: { stubR: L.eyeWidth * 0.7, spanY: (L.browY - L.noseBaseY), flare: earFlare }, proxy: "stub" };
  const earR = { name:"earR", joint:"cranium", kind:"ear",
    frame: frameAt(L.earR, HEAD, -earLean),
    extent: { stubR: L.eyeWidth * 0.7, spanY: (L.browY - L.noseBaseY), flare: earFlare }, proxy: "stub" };

  // MOUTH: wraps the dental barrel; modiolus corner points + barrel curvature.
  // Upper band owned by cranium, lower band by mandible — but emitted as ONE
  // resolved frame after FK (so an open jaw doesn't tear it into a gap).
  const mouth = { name:"mouth", upperJoint:"cranium", lowerJoint:"jaw", kind:"mouth",
    frame: frameAt(L.mouthC, HEAD),
    cornerL: L.mouthL, cornerR: L.mouthR, center: L.mouthC,
    extent: { halfW: L.eyeWidth, barrelR: L.faceHalfW }, proxy: false };

  // BROW: ridge frame (the eye recession references it).
  const brow = { name:"brow", joint:"cranium", kind:"brow",
    frame: frameAt(L.brow, HEAD),
    extent: { halfW: L.faceHalfW * 0.85 }, proxy: false };

  return { eyeL, eyeR, nose, earL, earR, mouth, brow, _landmarks: L };
}

// silhouetteProxy(anchor) -> array of head-local 3D points forming a small convex
// solid the OUTLINE union should include, or null if the anchor emits no proxy.
// §1b: nose base + ear stub emit proxies (so profile keeps them); eye does not.
// These are MOUNTING-VOLUME proxies (where the feature's mass sits), not feature
// shapes — a style still draws the actual nose/ear over the anchor.
export function silhouetteProxy(a) {
  if (!a.proxy) return null;
  if (a.proxy === "base") {
    // nose: a small 3D wedge — a triangular prism from the bridge (root) down to
    // the base, projecting forward along +z so the tip clears the cranium front.
    // Built with real width AND depth so it survives the 2D union from any angle
    // (not a degenerate sliver). Mounting volume only; a style draws the nose.
    const r = a.rootFrame.o, b = a.baseFrame.o;
    const proj = a.extent.project, hw = a.extent.halfW;
    // The wedge must OVERLAP the head (or the boolean union treats it as a
    // separate component and drops it). So start the back face well INSIDE the
    // face surface (root pulled back toward head center) and project the tip out.
    const backZ = r[2] * 0.4;                         // back face sunk into the head
    const tip = [b[0], b[1], b[2] + proj];            // nose tip, forward of base
    const pts = [];
    const ncs = 4;
    for (let i = 0; i <= ncs; i++) {
      const t = i / ncs;
      const y = r[1] + (b[1]-r[1])*t;
      const w = hw * (0.4 + 0.6*t);                  // widen toward the base
      const zBack = backZ;                            // inside the head
      const zFront = b[2] + proj * t;                // out toward the tip
      pts.push([ w, y, zBack]); pts.push([-w, y, zBack]);   // sunk-in back face
      pts.push([ w, y, zFront]); pts.push([-w, y, zFront]); // forward face
    }
    pts.push(tip);
    return pts;
  }
  if (a.proxy === "stub") {
    // ear: a small oval disc on the stub frame, spanning spanY vertically and
    // stubR across, flared off the skull along the outward axis.
    const o = a.frame.o, x = a.frame.x, y = a.frame.y, z = a.frame.z;
    const R = a.extent.stubR, sy = a.extent.spanY * 0.5;
    const flare = (a.extent.flare || 0) * Math.PI / 180;
    const out = add(o, scale(z, R * Math.sin(flare) * 0.5));
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const t = (i / 10) * 2 * Math.PI;
      pts.push(add(add(out, scale(x, Math.cos(t) * R)), scale(y, Math.sin(t) * sy)));
    }
    return pts;
  }
  return null;
}

// orthonormality check for a frame (used by self-checks)
export function frameOrtho(fr) {
  const d = (a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const u = (v)=>Math.abs(Math.hypot(v[0],v[1],v[2])-1)<1e-9;
  return u(fr.x)&&u(fr.y)&&u(fr.z)
    && Math.abs(d(fr.x,fr.y))<1e-9 && Math.abs(d(fr.y,fr.z))<1e-9 && Math.abs(d(fr.x,fr.z))<1e-9;
}
