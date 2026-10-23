// Timing, easing and deterministic randomness. Everything in the MV is a pure function of t.

export const BPM = 150;
export const BEAT = 60 / BPM;
export const BAR = 4 * BEAT;
export const at = (bar, beat = 0) => (bar - 1) * BAR + beat * BEAT;
export const barOf = (t) => Math.floor(t / BAR) + 1;
export const beatOf = (t) => t / BEAT;
export const beatPhase = (t) => (t / BEAT) % 1;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const unlerp = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (k) => k * k * (3 - 2 * k);
export const outExpo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
export const inOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const outBack = (k, s = 1.7) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
export const outCubic = (k) => 1 - Math.pow(1 - k, 3);
export const inCubic = (k) => k * k * k;
export const outElastic = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI / 3)) + 1);

// value that ramps from a→b between t0 and t1 with an easing
export const tween = (t, t0, t1, a, b, ease = smooth) => lerp(a, b, ease(unlerp(t0, t1, t)));

// hold(t, fps): limited animation (anime "on twos/threes")
export const hold = (t, fps = 12) => Math.floor(t * fps) / fps;

// decaying pulse after each grid event: 1 at the hit, → 0 after `len` seconds
export const pulse = (t, period, len = 0.18, offset = 0) => {
  const p = (((t - offset) % period) + period) % period;
  return p < len ? Math.pow(1 - p / len, 2) : 0;
};
export const hitAfter = (t, t0, len = 0.3) => (t >= t0 && t < t0 + len ? Math.pow(1 - (t - t0) / len, 2) : 0);

export function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
export const hash2 = (a, b) => hash(a * 57.31 + b * 113.97);

// section lookup from timing.json
export function sectionAt(timing, t) {
  const s = timing.sections;
  for (let i = s.length - 1; i >= 0; i--) if (t >= s[i].t0) return s[i];
  return s[0];
}
