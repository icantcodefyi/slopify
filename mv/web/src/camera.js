// Camera: a shot list cut on bar lines (MMD camera-motion style: orbits, cranes, dolly zooms, dutch).
import { BEAT, BAR, at, clamp, inOutCubic, lerp, outExpo, outCubic, pulse, smooth, hash } from './time.js';

const HEAD = 1.22;
const orbit = (r, yaw, y) => [Math.sin(yaw) * r, y, Math.cos(yaw) * r];
const L = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

// each shot: [startBar, startBeat, fn(k, t, u) -> {pos, target, fov, roll}] (k = 0..1 through the shot, u = seconds in)
const SHOTS = [
  [1, 0, (k) => ({ pos: orbit(4.4, lerp(-0.35, 0.25, smooth(k)), 1.05), target: [0, 0.78, 0], fov: 30 })],
  [4, 2, () => ({ pos: orbit(4.4, 0.25 * 0.95, 1.05), target: [0, 0.78, 0], fov: 30 })],
  [5, 0, (k) => ({ pos: L([0, 0.35, 3.0], [0.15, 0.55, 2.35], outExpo(k)), target: [0, 1.0, 0], fov: 40, roll: lerp(0.18, 0.08, k) })],
  [6, 0, (k) => ({ pos: L([0, 1.9, 8.2], [1.0, 1.6, 6.6], smooth(k)), target: [0, 1.3, 0], fov: 38 })],
  [7, 0, (k) => ({ pos: orbit(3.1, lerp(-0.7, 0.25, smooth(k)), 1.15), target: [0, 0.9, 0], fov: 34 })],
  [9, 0, (k) => ({ pos: L([0.45, 1.32, 1.35], [0.2, 1.28, 1.05], smooth(k)), target: [0, HEAD - 0.02, 0], fov: 32, roll: -0.06 })],
  [10, 0, (k) => ({ pos: L([2.7, 0.45, 1.2], [2.0, 0.55, 2.2], smooth(k)), target: [0, 0.85, 0], fov: 36 })],
  [11, 0, (k) => ({ pos: L([0.6, 0.15, 7.2], [0.0, 0.45, 6.1], smooth(k)), target: [0, 1.05, 0], fov: 32 })],
  [12, 0, (k) => ({ pos: orbit(1.2, lerp(0, Math.PI * 0.8, k), 5.2), target: [0, 0.4, 0], fov: 44 })],
  [13, 0, (k) => ({ pos: orbit(lerp(3.6, 2.5, k), lerp(-1.6, 1.9, inOutCubic(k)), lerp(0.7, 1.9, k)), target: [0, 0.85, 0], fov: 36 })],
  [15, 0, (k) => { const fov = lerp(22, 62, inOutCubic(k)); const d = 0.42 / Math.tan((fov * Math.PI) / 360); return { pos: [0, HEAD, d], target: [0, HEAD - 0.04, 0], fov }; }],
  [16, 0, (k, t, u) => (u < 2 * BEAT
    ? { pos: [0.1, 1.15, 1.55], target: [0, 1.0, 0], fov: 34, roll: 0.05 }
    : { pos: L([0.1, 1.15, 1.55], [0, 2.4, 5.5], outExpo(clamp((u - 2 * BEAT) / (2 * BEAT)))), target: [0, 0.8, 0], fov: 36 })],
  // CHORUS
  [17, 0, (k) => ({ pos: L([0, 5.5, 9.5], [0, 1.25, 4.0], outExpo(clamp(k * 1.6))), target: [0, 1.0, 0], fov: 40, roll: lerp(-0.2, 0, outCubic(k)) })],
  [18, 0, (k) => ({ pos: orbit(3.0, lerp(0.2, 1.1, smooth(k)), 1.0), target: [0, 0.95, 0], fov: 36, roll: 0.1 })],
  [19, 0, (k) => ({ pos: orbit(2.4, lerp(-1.0, -0.2, smooth(k)), 0.7), target: [0, 1.0, 0], fov: 38, roll: -0.12 })],
  [20, 0, (k) => ({ pos: L([0, 1.25, 1.5], [0, 1.25, 1.2], k), target: [0, 1.12, 0], fov: 36 })],
  [21, 0, (k, t, u) => { const a = Math.floor(u / (2 * BEAT)) % 2 ? 1 : -1;
    return { pos: [a * 0.7, 1.3, 1.25], target: [0, HEAD - 0.05, 0], fov: 34, roll: a * 0.08 }; }],
  [22, 0, (k) => ({ pos: L([0, 0.3, 4.6], [0, 0.5, 3.4], smooth(k)), target: [0, 1.1, 0], fov: 40 })],
  [23, 0, (k) => ({ pos: orbit(2.4, lerp(0.5, -2.6, inOutCubic(k)), 0.45), target: [0, 1.0, 0], fov: 42, roll: 0.15 })],
  [24, 0, (k) => ({ pos: L([0.4, 0.4, 7.0], [0, 1.2, 5.2], outCubic(k)), target: [0, 1.2, 0], fov: 38 })],
  // BRIDGE: she sits right or left of frame, the site card takes the other side
  [25, 0, (k, t, u) => { const h = Math.floor(u / (BAR / 2)), s = h % 2 ? -1 : 1, kk = (u % (BAR / 2)) / (BAR / 2);
    return { pos: orbit(lerp(3.3, 2.9, kk), s * -0.35 + lerp(-0.08, 0.08, kk), 1.0 + (h % 3) * 0.2), target: [s * -0.75, 0.95, 0], fov: 36, roll: s * 0.06 }; }],
  [30, 2, (k) => ({ pos: [0, 1.2, 2.2], target: [0, 1.0, 0], fov: lerp(36, 30, k), roll: 0 })],
  // FINAL CHORUS
  [31, 0, (k) => ({ pos: orbit(lerp(9, 3.4, outExpo(clamp(k * 1.4))), lerp(-2.2, 0.15, outCubic(k)), lerp(5, 1.1, outExpo(clamp(k * 1.4)))), target: [0, 1.0, 0], fov: 40, roll: lerp(0.3, 0, k) })],
  [33, 0, (k, t, u) => { const c = Math.floor(u / BEAT) % 4; const yaws = [-0.6, 0.5, -0.2, 0.8];
    return { pos: orbit(1.6 + (c % 2) * 0.8, yaws[c], 1.0 + (c % 2) * 0.3), target: [0, 1.05, 0], fov: 38, roll: (c % 2 ? -1 : 1) * 0.1 }; }],
  [35, 0, (k) => ({ pos: L([-3.5, 4.2, 6.5], [3.0, 3.0, 5.5], smooth(k)), target: [0, 0.9, 0], fov: 40 })],
  [36, 0, (k) => ({ pos: orbit(2.6, lerp(0, -Math.PI * 1.2, inOutCubic(k)), 0.6), target: [0, 1.0, 0], fov: 40, roll: -0.12 })],
  [37, 0, (k) => ({ pos: L([0, 1.2, 1.8], [0, 1.18, 1.35], smooth(k)), target: [0, 1.05, 0], fov: 38 })],
  [38, 0, (k) => ({ pos: L([0, 1.0, 2.6], [0, 2.4, 8.5], outExpo(k)), target: [0, 1.1, 0], fov: 40, roll: lerp(0.05, -0.05, k) })],
  [39, 0, (k) => ({ pos: L([0.6, 1.0, 3.8], [0.1, 1.1, 2.8], smooth(k)), target: [-0.62, 1.0, 0], fov: 34, roll: -0.04 })],
  [41, 0, (k) => ({ pos: [0.1, 1.1, 2.8], target: [-0.62, 1.0, 0], fov: 34 })],
].map(([bar, beat, fn]) => ({ t: at(bar, beat), fn }));

export function cameraAt(t, sectionName) {
  let k = 0;
  while (k + 1 < SHOTS.length && t >= SHOTS[k + 1].t) k++;
  const s = SHOTS[k], end = SHOTS[k + 1]?.t ?? s.t + 4;
  const u = t - s.t;
  const c = s.fn(clamp(u / (end - s.t)), t, u);
  c.roll ??= 0;
  // handheld drift + kick punch in the loud parts
  const loud = sectionName === 'chorus' || sectionName === 'final';
  if (t >= at(5)) {
    const n = (f, o) => Math.sin(t * f + o) * 0.5 + Math.sin(t * f * 2.3 + o * 3) * 0.25;
    const amp = loud ? 0.035 : 0.018;
    c.pos = [c.pos[0] + n(1.3, 1) * amp, c.pos[1] + n(1.1, 2) * amp, c.pos[2] + n(0.9, 3) * amp];
    c.fov -= (loud ? 1.6 : 0.6) * pulse(t, BEAT, 0.16);
    c.roll += n(0.7, 5) * 0.01;
  }
  c.shot = k;
  return c;
}

export const shotStarts = SHOTS.map((s) => s.t);
export { hash };
