// contours.mjs — Vilppu cross-contour wrap-lines (v5 §1e). Validation guides that
// RIDE the actual analytic surface (not flat arcs), so they prove the form reads
// as 3D and verify the planes. Toggleable; occluded by the facing test.
//
// Sub-step 1: the VERTICAL CENTERLINE — the front meridian curve down the middle
// of the face, from crown over brow/nose to chin. It must follow the real ovoid
// (with its occiput/crown shaping) on the cranium, then continue down the jaw
// surface. Every emitted point lies ON a mass surface via that mass's own
// parametrization — no flat-plane shortcut.

// The cranium centerline = the Ovoid front meridian (alpha = +pi/2 => x=0, +z).
// We sweep tau from the crown down to where the jaw takes over.
export function centerlineCranium(ovoid, tauTop=0.98, tauBot=-0.55, n=40) {
  const pts=[];
  for(let i=0;i<=n;i++){
    const tau = tauTop + (tauBot-tauTop)*(i/n);
    pts.push(ovoid._point(Math.PI/2, tau));         // front meridian, on the surface
  }
  return pts;
}

// The jaw/chin centerline = the front meridian of the jaw Ellipsoid (x=0, +z),
// swept from its top (where it meets the cranium) down to the chin.
export function centerlineJaw(jaw, yTop=null, yBot=null, n=24) {
  const c=jaw.c, r=jaw.r;
  const top = (yTop!==null?yTop:c[1]+r[1]*0.4);
  const bot = (yBot!==null?yBot:c[1]-r[1]*0.98);
  const pts=[];
  for(let i=0;i<=n;i++){
    const y = top + (bot-top)*(i/n);
    const ky = (y-c[1])/r[1];
    const k = 1 - ky*ky;
    const z = k>0 ? c[2] + r[2]*Math.sqrt(k) : c[2];  // front surface of the ellipsoid at x=0
    pts.push([0, y, z]);
  }
  return pts;
}

// full centerline = cranium meridian then jaw meridian (ordered crown -> chin).
export function centerline(forms) {
  return centerlineCranium(forms.cranium).concat(centerlineJaw(forms.jaw));
}

// Sub-step 3: bundle the validation guides as a TOGGLEABLE set. Returns the named
// guides enabled by `opts` so a renderer can switch them on/off independently.
// Each entry: { name, pts:[3d...], color }. These are validation overlays only —
// not shipped line; a renderer chooses whether to draw them.
export function validationGuides(forms, browY, opts={}) {
  const { centerline:cl=true, brow=true } = opts;
  const guides=[];
  if(cl)   guides.push({ name:"centerline", pts:centerline(forms),          color:[120,120,200] });
  if(brow) guides.push({ name:"brow",       pts:browWrap(forms.cranium,browY), color:[40,150,70] });
  return guides;
}

// Sub-step 2: the BROW RIDGE wrap. A real brow is NOT a flat latitude ring — it
// dips downward (toward the nose) at the front center over the brow ridge and
// rises toward the temples. We trace it as a band whose HEIGHT varies with the
// ring angle: the front-facing arc (alpha near +pi/2, the +z meridian) is pulled
// down by `dip`, easing back to the base brow height at the sides. Because the
// front center now sits at a different height than the temples, the projected
// contour genuinely CURVES under yaw — the 3D cross-contour cue, for the real
// anatomical reason (not a flat ring, not a fake bend). Still rides the surface:
// every point is ovoid._point(alpha, tauOfThisAngle).
export function browWrap(ovoid, browY, n=72, dip=0.18) {
  const tauBase = (browY - ovoid.c[1]) / ovoid.ry;
  const pts=[];
  for(let i=0;i<=n;i++){
    const alpha = (i/n)*2*Math.PI;
    // front-facing weight: 1 at the +z meridian (alpha=pi/2), 0 at the sides/back.
    const frontW = Math.max(0, Math.sin(alpha));
    const tau = tauBase - dip*frontW;               // dip the brow down at the front
    pts.push(ovoid._point(alpha, tau));             // still exactly on the surface
  }
  return pts;
}

