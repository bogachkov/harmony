// Minimal master style — "plainLine".
//
// The architecture (per Gary): the CORE builds 3D structure (skull, socket,
// jaw cylinder) and exposes feature ANCHORS as 3D points + frames. A STYLE
// reads those anchors and draws marks (a dot, an almond, a line) at them. The
// marks are 3D points projected through the SAME camera as the SDF, so they
// turn correctly with the head — NOT painted on the 2D image (which is how we
// got decals-on-a-balloon).
//
// This is the first, minimal style: eyes as almond + pupil dot, mouth as a
// line, brow as a short stroke. A "default style applied" so the engine output
// can be sanity-checked as the goal requires.

import type { Vec3, Vec2 } from '../src/math/vec3.ts';
import { construct, DEFAULT_HEAD, type HeadDial } from './head.ts';

export type Anchor = { pos: Vec3 };

/** 3D feature anchors a style draws into, derived from the construction. */
export const anchors = (dial: Partial<HeadDial>) => {
  const d: HeadDial = { ...DEFAULT_HEAD, ...dial };
  const c = construct(d);
  const surf = (y: number, x: number): Vec3 => [x, y, c.frontZ(y) ]; // on the front form
  return {
    eyeL: surf(c.eyeY, -c.eyeSpacing),
    eyeR: surf(c.eyeY,  c.eyeSpacing),
    eyeSpacing: c.eyeSpacing,
    browL: surf(c.browY, -c.eyeSpacing),
    browR: surf(c.browY,  c.eyeSpacing),
    mouthC: surf(c.mouthY, 0),
    mouthHalf: c.eyeSpacing * (d.mouthWidth ?? 1) * 0.5,
    noseTip: surf(c.noseBaseY, 0),
  };
};

/** A style draws SVG marks given a projector world->screen and a visibility test. */
export type Projector = (w: Vec3) => { s: Vec2; visible: boolean };

/** plainLine: minimal marks. Returns SVG path/element strings (no <svg> wrapper). */
export const plainLineMarks = (dial: Partial<HeadDial>, project: Projector): string[] => {
  const a = anchors(dial);
  const out: string[] = [];
  const ink = '#111';

  const eye = (center: Vec3, half: number) => {
    const c = project(center);
    if (!c.visible) return;
    // Lidded eye, not a wide open ring (that = bug-eyes). Heavy upper-lid arc
    // curving over the eye, a lighter lower arc, small pupil tucked UNDER the
    // upper lid. Narrower than before.
    const rx = half * 0.48, ry = half * 0.22;
    const [cx, cy] = c.s;
    const x0 = cx - rx, x1 = cx + rx;
    // upper lid: arc bowing down over the eye (heavier)
    out.push(`<path d="M${x0.toFixed(1)} ${cy.toFixed(1)} Q${cx.toFixed(1)} ${(cy-ry*1.4).toFixed(1)} ${x1.toFixed(1)} ${cy.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="2.2"/>`);
    // lower lid: shallow arc bowing up (lighter)
    out.push(`<path d="M${x0.toFixed(1)} ${cy.toFixed(1)} Q${cx.toFixed(1)} ${(cy+ry*0.8).toFixed(1)} ${x1.toFixed(1)} ${cy.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.2"/>`);
    // pupil: small, tucked just under the upper lid
    out.push(`<circle cx="${cx.toFixed(1)}" cy="${(cy-ry*0.15).toFixed(1)}" r="${(ry*0.42).toFixed(1)}" fill="${ink}"/>`);
  };

  // eyes — pass a px scale derived from projected eye separation
  const pl = project(a.eyeL), pr = project(a.eyeR);
  if (pl.visible && pr.visible) {
    const sepPx = Math.hypot(pr.s[0]-pl.s[0], pr.s[1]-pl.s[1]);
    const halfPx = sepPx * 0.5;
    eye(a.eyeL, halfPx);
    eye(a.eyeR, halfPx);
  }

  // mouth — a line between two corners, derived from mouthC + mouthHalf in 3D
  const mc = project(a.mouthC);
  if (mc.visible) {
    const mL = project([a.mouthC[0]-a.mouthHalf, a.mouthC[1], a.mouthC[2]]);
    const mR = project([a.mouthC[0]+a.mouthHalf, a.mouthC[1], a.mouthC[2]]);
    if (mL.visible && mR.visible)
      out.push(`<path d="M${mL.s[0].toFixed(1)} ${mL.s[1].toFixed(1)} Q${mc.s[0].toFixed(1)} ${(mc.s[1]+2).toFixed(1)} ${mR.s[0].toFixed(1)} ${mR.s[1].toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.8"/>`);
  }

  return out;
};
