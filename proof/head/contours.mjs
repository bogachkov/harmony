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
