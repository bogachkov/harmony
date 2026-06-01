// geom.mjs — pure 2D polyline helpers for the head pipeline.

// Douglas–Peucker simplify of an ordered polyline of {x,y}.
export function dp(points, eps) {
  if (points.length < 3) return points;
  const d2 = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + t * dx, py = a.y + t * dy;
    return (p.x - px) ** 2 + (p.y - py) ** 2;
  };
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let idx = -1, dmax = eps * eps;
    for (let i = a + 1; i < b; i++) {
      const dd = d2(points[i], points[a], points[b]);
      if (dd > dmax) { dmax = dd; idx = i; }
    }
    if (idx >= 0) { keep[idx] = true; stack.push([a, idx], [idx, b]); }
  }
  return points.filter((_, i) => keep[i]);
}

// Circular moving-average smoothing for a closed polyline of {x,y}.
export function smoothClosed(pts, iters = 2) {
  let p = pts;
  for (let k = 0; k < iters; k++) {
    const out = new Array(p.length);
    for (let i = 0; i < p.length; i++) {
      const a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length];
      out[i] = { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
    }
    p = out;
  }
  return p;
}
