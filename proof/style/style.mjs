// style.mjs — the STYLE layer. A style reads core's ANCHORS (frames+extent+joint)
// and draws features in ITS OWN vocabulary. Feature shapes live here, never in
// core. The REFERENCE style is the plainest possible one, flagged non-shippable;
// its only job is to let us judge "does the core structure read as a human?"
// (you cannot validate the bones by staring at the bald wraith).

function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function scale(v,s){return [v[0]*s,v[1]*s,v[2]*s];}

// Each drawer gets the anchor + a project fn P(localPt)->{x,y} + a visibility
// test vis(localPt)->bool + a draw(screenPts, weight) sink. Drawers emit only
// strokes; they never see core geometry, only the anchor.

export const referenceStyle = {
  name: "reference",
  shippable: false,                 // a stand-in to validate structure, never shipped
  weight: 2.0,

  // plain almond eye: two arcs between inner/outer corners across the socket,
  // plus an iris dot. Shape is THIS STYLE's choice.
  eye(a, P, draw) {
    const o=a.frame.o, x=a.frame.x, y=a.frame.y, r=a.extent.socketR;
    const inner=add(o,scale(x,-r)), outer=add(o,scale(x,r));
    const top=add(o,scale(y, r*0.55)), bot=add(o,scale(y,-r*0.4));
    draw([P(inner),P(top),P(outer)], 1);
    draw([P(inner),P(bot),P(outer)], 1);
    draw([P(o)], 1.8);              // iris
  },
  // plain nose: bridge line root->base + a base tick
  nose(a, P, draw) {
    const r=a.rootFrame.o, b=a.baseFrame.o, x=a.baseFrame.x, hw=a.extent.halfW;
    draw([P(r),P(b)], 1);
    draw([P(add(b,scale(x,-hw*0.7))),P(b),P(add(b,scale(x,hw*0.7)))], 1);
  },
  // plain mouth: a lip line bowing slightly through the corners
  mouth(a, P, draw) {
    draw([P(a.cornerL),P(a.center),P(a.cornerR)], 1.1);
  },
  // plain ear: a back-C on the stub frame, tilted by the frame's lean
  ear(a, P, draw) {
    const o=a.frame.o, x=a.frame.x, y=a.frame.y, r=a.extent.stubR, sy=a.extent.spanY*0.5;
    const pts=[];
    for(let i=0;i<=12;i++){ const t=-Math.PI/2+(i/12)*Math.PI; pts.push(P(add(add(o,scale(x,Math.cos(t)*r*0.5)),scale(y,Math.sin(t)*sy)))); }
    draw(pts, 1);
  },
  // plain brow: a short bar above each eye region, from the brow frame
  brow(a, P, draw) {
    const o=a.frame.o, x=a.frame.x, y=a.frame.y, w=a.extent.halfW;
    for(const sgn of [1,-1]){
      const c=add(o,scale(x,sgn*0.55*w));
      draw([P(add(add(c,scale(x,-0.35*w*sgn)),scale(y,0.02))),P(add(c,scale(y,0.06))),P(add(c,scale(x,0.35*w*sgn)))], 1);
    }
  },
};

// applyStyle: draw a style's features over resolved anchors A. ctx supplies:
//   P(localPt)->{x,y}     project head-local point to screen
//   vis(localPt)->bool    is this point on the visible (front) hemisphere
//   stroke(pts,opts)      canvas stroke sink
// Each feature is occluded as a whole if its anchor origin is hidden.
export function applyStyle(style, A, ctx) {
  const { P, vis, stroke } = ctx;
  const draw = (pts, wmul=1) => {
    if (pts.length===1){ ctx.stamp(pts[0].x, pts[0].y, style.weight*wmul*0.8); return; }
    stroke(pts, { width: style.weight*wmul });
  };
  const feature = (a, originLocal, fn) => { if(!a||!fn) return; if(!vis(originLocal)) return; fn(a, P, draw); };

  // face features use the standard front-hemisphere visibility.
  feature(A.brow,  A.brow.frame.o,  style.brow);
  feature(A.eyeL,  A.eyeL.frame.o,  style.eye);
  feature(A.eyeR,  A.eyeR.frame.o,  style.eye);
  feature(A.nose,  A.nose.rootFrame.o, style.nose);
  feature(A.mouth, A.mouth.center,  style.mouth);
  // ears are SIDE features: each is drawn whenever its OWN temple faces the
  // camera — including from behind (ears stick out laterally and are visible
  // from the back). Visibility is the per-anchor facing test, same as the face.
  feature(A.earL, A.earL.frame.o, style.ear);
  feature(A.earR, A.earR.frame.o, style.ear);
}
