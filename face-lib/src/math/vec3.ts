export type Vec3 = readonly [number, number, number];
export type Vec2 = readonly [number, number];

export const v3 = (x: number, y: number, z: number): Vec3 => [x, y, z];

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
export const normalize = (a: Vec3): Vec3 => {
  const l = length(a);
  return l === 0 ? [0, 0, 0] : [a[0] / l, a[1] / l, a[2] / l];
};

export const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

// Rotate around Y (yaw), then X (pitch). Right-handed, +Y up, +Z toward camera.
export const rotateYX = (p: Vec3, yaw: number, pitch: number): Vec3 => {
  const [x, y, z] = p;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x1 = cy * x + sy * z;
  const z1 = -sy * x + cy * z;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const y2 = cp * y - sp * z1;
  const z2 = sp * y + cp * z1;
  return [x1, y2, z2];
};

// Sample a point on an axis-aligned ellipsoid (centered at origin) at angles (theta, phi).
// theta is azimuth around Y, phi is elevation from equator (-PI/2 .. PI/2).
export const ellipsoidPoint = (rx: number, ry: number, rz: number, theta: number, phi: number): Vec3 => {
  const cp = Math.cos(phi);
  return [rx * cp * Math.cos(theta), ry * Math.sin(phi), rz * cp * Math.sin(theta)];
};
