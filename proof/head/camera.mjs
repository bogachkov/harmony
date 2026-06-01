// camera.mjs — the head's camera/frame (v5 §3). Orthographic.
// World axis convention (shared with figure.mjs FK): +Y up, +X = the figure's
// left, +Z toward the viewer; bones run along -Y. The camera is a yaw/pitch
// orientation of that world; viewDir is a single constant world vector per frame
// (not a per-pixel ray), rotated into form-local space once per form by callers.
import { rotateYawPitch, project as coreProject } from "../core.mjs";

export const AXES = "+Y up, +X figure-left, +Z toward viewer; bones run -Y (matches figure.mjs)";

export function makeCamera({ yaw = 0, pitch = 0, scale = 120, cx = 180, cy = 200 } = {}) {
  return { yaw, pitch, scale, cx, cy };
}

// world point -> screen {x,y} + view-space depth (larger = nearer the viewer)
export function project(world, cam) {
  const r = rotateYawPitch(world, cam.yaw, cam.pitch);
  const p = coreProject(r, cam.cx, cam.cy, cam.scale);
  return { x: p.x, y: p.y, depth: r[2] };
}

// inverse of core's rotateYawPitch (which is pitch∘yaw): undo pitch, then yaw.
function invRotate(p, yaw, pitch) {
  const cp = Math.cos(-pitch), sp = Math.sin(-pitch);
  const y1 = cp * p[1] - sp * p[2], z1 = sp * p[1] + cp * p[2], x1 = p[0];
  const cy = Math.cos(-yaw), sy = Math.sin(-yaw);
  return [cy * x1 + sy * z1, y1, -sy * x1 + cy * z1];
}

// constant world-space direction from the scene toward the viewer (unit length).
// In view space the viewer is at +Z, so toward-viewer = [0,0,1] inverse-rotated.
export function viewDir(cam) {
  return invRotate([0, 0, 1], cam.yaw, cam.pitch);
}

export function length3(v) { return Math.hypot(v[0], v[1], v[2]); }
