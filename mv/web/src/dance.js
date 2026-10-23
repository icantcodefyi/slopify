// Choreography: a library of beat-locked moves, a bar-by-bar routine, blending, and the face track.
import { BEAT, at, clamp, lerp, hash, smooth, unlerp, outBack } from './time.js';

const TAU = Math.PI * 2;
const V = (x = 0, y = 0, z = 0) => [x, y, z];

export function basePose() {
  return {
    root: V(), yaw: 0,
    hipPos: V(), hips: V(), spine: V(), chest: V(), neck: V(), head: V(),
    armL: [0.15, 0.05, 0, 0.2, 0, 0], armR: [0.15, 0.05, 0, 0.2, 0, 0],
    legL: [0, 0.03, 0, 0, 0], legR: [0, 0.03, 0, 0, 0],
  };
}

const KEYS = ['root', 'hipPos', 'hips', 'spine', 'chest', 'neck', 'head', 'armL', 'armR', 'legL', 'legR'];
export function mixPose(a, b, k) {
  const o = { yaw: lerp(a.yaw, b.yaw, k) };
  for (const key of KEYS) o[key] = a[key].map((v, i) => lerp(v, b[key][i], k));
  return o;
}

// knees bend and the hips drop so the feet stay planted
function crouch(P, l, lr = 0) {
  const lL = l + lr, lR = l - lr;
  P.legL = [lL, P.legL[1], P.legL[2], 2 * lL, lL];
  P.legR = [lR, P.legR[1], P.legR[2], 2 * lR, lR];
  P.hipPos[1] -= 0.5 * (1 - Math.cos(l));
}
const bounce = (B, depth = 0.22) => depth * (0.5 + 0.5 * Math.cos(TAU * B)); // lowest on the beat
const side = (B) => (Math.floor(B) % 2 ? -1 : 1);

// every move: (B = absolute beat, b = beats since the move started) -> pose
const MOVES = {
  tpose() {
    const P = basePose();
    P.armL = [Math.PI / 2, 0, 0, 0, 0, 0]; P.armR = [Math.PI / 2, 0, 0, 0, 0, 0];
    P.legL = [0, 0.06, 0, 0, 0]; P.legR = [0, 0.06, 0, 0, 0];
    return P;
  },
  frozen(B, b) { // "not responding": a glitchy half-loaded first frame of the motion
    const P = MOVES.tpose();
    const k = Math.floor(b * 6) % 3;
    P.armL = [Math.PI / 2 + (k === 1 ? 0.6 : 0), 0, 0, k === 2 ? 1.2 : 0, 0, 0];
    P.head = V(0, 0, k === 1 ? 0.3 : 0);
    return P;
  },
  title(B, b) { // impact jump into a kira pose
    const P = basePose();
    const j = Math.max(0, Math.sin(Math.PI * clamp(b / 1.2)));
    P.root[1] = 0.22 * j;
    crouch(P, 0.35 * (1 - clamp(b / 0.3)) + 0.15 * (1 - j));
    P.armR = [2.4, 0.4, 0, 0.1, 0, 0];
    P.armL = [0.9, 0.9, 0.4, 1.9, 0, 0];
    P.head = V(-0.05, 0.2, 0.22); P.chest = V(0, 0.15, -0.08);
    return P;
  },
  step(B) { // side steps with alternating kira punches
    const P = basePose(), s = side(B), ph = B % 1;
    const sw = Math.sin(Math.PI * B);
    P.hipPos[0] = 0.05 * sw;
    P.hips = V(0, 0.12 * sw, -0.08 * sw);
    P.chest = V(0.05, -0.1 * sw, 0.1 * sw);
    crouch(P, bounce(B), 0.12 * sw);
    const up = smooth(clamp(1 - ph * 1.4));
    const kira = [lerp(0.6, 2.35, up), lerp(0.6, 0.45, up), 0.3, lerp(1.6, 0.15, up), 0, 0.3];
    const rest = [0.35, 0.5, 0.3, 1.5, 0, 0];
    if (s > 0) { P.armL = kira; P.armR = rest; } else { P.armR = kira; P.armL = rest; }
    P.head = V(0.06 * Math.cos(TAU * B), 0, -0.14 * sw);
    return P;
  },
  point(B) { // point at the camera on 1 and 3, hand on hip
    const P = basePose(), half = (B % 2) / 2;
    const sw = Math.sin(Math.PI * B);
    P.hipPos[0] = 0.03 * sw;
    P.hips = V(0, -0.25, -0.06 * sw);
    P.chest = V(0, 0.15, 0.05 * sw);
    crouch(P, bounce(B, 0.18));
    const hit = outBack(clamp(half * 4));
    P.armR = [lerp(0.4, 0.25, hit), lerp(0.4, 1.45, hit), 0, lerp(1.4, 0.05, hit), 0, 0];
    P.armL = [0.75, -0.25, -1.3, 1.9, 0, 0];
    P.head = V(0.05, 0.12, -0.1 + 0.08 * sw);
    return P;
  },
  roll(B) { // rolling hands in front, body twisting
    const P = basePose(), a = TAU * B;
    P.hips = V(0, 0.18 * Math.sin(a / 2), 0);
    P.chest = V(0.08, 0.12 * Math.sin(a / 2), 0.06 * Math.sin(a / 2));
    crouch(P, bounce(B, 0.2));
    P.armL = [0.35 + 0.15 * Math.sin(a), 1.0 + 0.3 * Math.cos(a), 0.6, 1.6 + 0.3 * Math.sin(a), 0, 0];
    P.armR = [0.35 + 0.15 * Math.sin(a + Math.PI), 1.0 + 0.3 * Math.cos(a + Math.PI), 0.6, 1.6 + 0.3 * Math.sin(a + Math.PI), 0, 0];
    P.head = V(0.08, -0.15 * Math.sin(a / 2), 0.1 * Math.sin(a / 2));
    return P;
  },
  cookie(B) { // nom nom: hands to mouth, then a little shimmy
    const P = basePose(), sw = Math.sin(Math.PI * B * 2);
    crouch(P, bounce(B * 2, 0.12));
    P.hips = V(0, 0, 0.08 * sw); P.hipPos[0] = 0.025 * sw;
    P.armL = [0.45, 1.25, 0.9, 2.3, 0, 0.3];
    P.armR = [0.45, 1.25, 0.9, 2.3, 0, 0.3];
    P.chest = V(0.12, 0, -0.06 * sw);
    P.head = V(0.18, 0.1 * sw, 0.18 * sw);
    return P;
  },
  clap(B) { // clap overhead on every beat
    const P = basePose(), ph = B % 1;
    crouch(P, bounce(B, 0.28));
    const open = 1 - Math.pow(Math.cos(Math.PI * ph), 8);
    P.armL = [lerp(2.95, 2.45, open), 0.35, 0, lerp(0.25, 0.35, open), 0, 0];
    P.armR = [lerp(2.95, 2.45, open), 0.35, 0, lerp(0.25, 0.35, open), 0, 0];
    P.head = V(-0.12, 0, 0.1 * Math.sin(Math.PI * B));
    P.chest = V(-0.06, 0, 0);
    return P;
  },
  dame(B, b) { // "dame!": finger wag, then crouch for the drop
    const P = basePose();
    if (b < 2) {
      const sw = Math.sin(TAU * B * 2);
      P.armR = [0.3, 1.35, 0, 0.6 + 0.0 * sw, 0, 0];
      P.armR[2] = 0.35 * sw;
      P.armL = [0.75, -0.25, -1.3, 1.9, 0, 0];
      P.head = V(0.06, 0, -0.18 * sw);
      crouch(P, 0.1);
    } else {
      const k = smooth(clamp((b - 2) / 0.6));
      crouch(P, lerp(0.1, 0.55, k));
      P.chest = V(0.35 * k, 0, 0); P.head = V(-0.2 * k, 0, 0);
      P.armL = [0.5, lerp(0, 0.8, k), 0.4, 1.9 * k, 0, 0];
      P.armR = [0.5, lerp(0, 0.8, k), 0.4, 1.9 * k, 0, 0];
    }
    return P;
  },
  wave(B) { // both arms up in a V, swaying with the crowd
    const P = basePose(), sw = Math.sin(Math.PI * B);
    P.hipPos[0] = 0.05 * sw;
    P.hips = V(0, 0.1 * sw, -0.12 * sw);
    crouch(P, bounce(B, 0.25), 0.1 * sw);
    P.armL = [2.45 - 0.35 * sw, 0.25, 0, 0.25, 0, 0];
    P.armR = [2.45 + 0.35 * sw, 0.25, 0, 0.25, 0, 0];
    P.chest = V(-0.05, 0, 0.12 * sw);
    P.head = V(-0.1, 0, 0.2 * sw);
    return P;
  },
  heart(B) { // finger heart at the chest, side steps, fist pump on beat 4
    const P = basePose(), sw = Math.sin(Math.PI * B), bb = B % 4;
    P.hipPos[0] = 0.06 * sw;
    P.hips = V(0, 0.15 * sw, -0.06 * sw);
    crouch(P, bounce(B), 0.12 * sw);
    if (bb < 3) {
      P.armL = [0.5, 1.05, 0.9, 1.85, 0, 0.4];
      P.armR = [0.5, 1.05, 0.9, 1.85, 0, 0.4];
      P.head = V(0.1, 0.1 * sw, 0.25);
    } else {
      const k = outBack(clamp((bb - 3) * 3));
      P.armR = [lerp(0.5, 2.6, k), lerp(1.05, 0.5, k), 0, lerp(1.85, 0.2, k), 0, 0];
      P.armL = [0.75, -0.25, -1.3, 1.9, 0, 0];
      P.head = V(-0.12, 0, -0.1);
    }
    return P;
  },
  spin(B, b) { // full turn over one bar, arms out
    const P = MOVES.wave(B);
    P.yaw = TAU * smooth(clamp(b / 4));
    P.armL = [1.7, 0, 0, 0.4, 0, 0]; P.armR = [1.7, 0, 0, 0.4, 0, 0];
    P.root[1] = 0.04 * Math.sin(Math.PI * clamp(b / 4));
    return P;
  },
  jump(B, b) { // two jumps, legs tucked, then a pose
    const P = basePose();
    const j = Math.max(0, Math.sin(Math.PI * ((b % 2) / 1.2)));
    P.root[1] = (b < 4 ? 0.3 : 0) * j;
    crouch(P, 0.4 * (1 - j) * (b < 4 ? 1 : 0) + 0.12);
    P.legL[0] += 0.5 * j; P.legL[3] += 1.2 * j; P.legR[3] += 0.8 * j;
    P.armL = [2.6, 0.3, 0, 0.2, 0, 0]; P.armR = [2.2, 0.6, 0, 0.6, 0, 0];
    P.head = V(-0.1, 0, 0.15);
    return P;
  },
  wota(B, b) { // wotagei: fast overhead arm circles with glowsticks
    const P = basePose(), a = TAU * B;
    crouch(P, 0.2 + 0.1 * Math.cos(a));
    P.hipPos[0] = 0.04 * Math.sin(a / 2);
    P.armL = [1.9 + 0.9 * Math.sin(a), 0.9 * Math.cos(a) + 0.3, 0, 0.3, 0, 0];
    P.armR = [1.9 + 0.9 * Math.sin(a + Math.PI), 0.9 * Math.cos(a + Math.PI) + 0.3, 0, 0.3, 0, 0];
    P.chest = V(-0.05 + 0.08 * Math.cos(a), 0, 0.08 * Math.sin(a / 2));
    P.head = V(0.1 * Math.cos(a), 0, 0.12 * Math.sin(a / 2));
    // a different snap pose on each half bar (each website)
    const k = Math.floor(b / 2) % 3;
    if (b % 2 < 0.35) {
      if (k === 0) { P.armR = [2.4, 0.3, 0, 0.1, 0, 0]; P.armL = [0.75, -0.25, -1.3, 1.9, 0, 0]; }
      if (k === 1) { P.armL = [0.3, 1.4, 0, 0.05, 0, 0]; P.armR = [0.3, 1.4, 0, 0.05, 0, 0]; }
      if (k === 2) { P.armL = [2.9, 0.2, 0, 0.3, 0, 0]; P.armR = [0.4, 0.4, 0, 2.2, 0, 0.2]; }
    }
    return P;
  },
  stop(B, b) { // freeze in a cute pose for the stop
    const P = MOVES.peace(B, b);
    return P;
  },
  peace(B, b) { // peace sign by the face, head tilt, wink
    const P = basePose();
    crouch(P, 0.16 + 0.03 * Math.cos(TAU * B / 2), 0.08);
    P.hips = V(0, -0.2, 0.06); P.hipPos[0] = 0.02;
    P.armR = [1.0, 0.45, 0.6, 2.35, 0.3, 0.2];
    P.armL = [0.75, -0.25, -1.3, 1.9, 0, 0];
    P.chest = V(0, 0.12, -0.05);
    P.head = V(0.04, 0.12, 0.28);
    P.legL[0] += 0.25; P.legL[3] += 0.7; P.legL[2] = 0.3;
    return P;
  },
};

// [bar, beat, move]
const ROUTINE = [
  [1, 0, 'tpose'], [4, 2, 'frozen'], [5, 0, 'title'], [5, 2, 'step'],
  [7, 0, 'point'], [9, 0, 'roll'], [11, 0, 'cookie'], [12, 0, 'step'],
  [13, 0, 'clap'], [16, 0, 'dame'],
  [17, 0, 'wave'], [19, 0, 'heart'], [21, 0, 'wave'], [23, 0, 'spin'], [24, 0, 'jump'],
  [25, 0, 'wota'], [30, 2, 'stop'],
  [31, 0, 'wave'], [33, 0, 'heart'], [35, 0, 'wave'], [36, 0, 'spin'], [37, 0, 'point'], [38, 0, 'jump'],
  [39, 0, 'peace'],
].map(([bar, beat, move]) => ({ t: at(bar, beat), move }));
const T_POSE_AGAIN = at(41) + 0.5; // the motion file ends and she snaps back to T-pose

function moveAt(t, k) {
  const seg = ROUTINE[k];
  const B = t / BEAT, b = (t - seg.t) / BEAT;
  return MOVES[seg.move](B, b);
}

export function poseAt(t) {
  if (t >= T_POSE_AGAIN) return MOVES.tpose();
  let k = 0;
  while (k + 1 < ROUTINE.length && t >= ROUTINE[k + 1].t) k++;
  const P = moveAt(t, k);
  const blend = 0.16;
  if (k > 0 && t - ROUTINE[k].t < blend && ROUTINE[k].move !== 'frozen' && ROUTINE[k].move !== 'title') {
    const prev = moveAt(t, k - 1);
    return mixPose(prev, P, smooth((t - ROUTINE[k].t) / blend));
  }
  return P;
}

export const moveName = (t) => {
  let k = 0;
  while (k + 1 < ROUTINE.length && t >= ROUTINE[k + 1].t) k++;
  return t >= T_POSE_AGAIN ? 'tpose' : ROUTINE[k].move;
};

// body motion signal for the hair: velocity of the pelvis/head a little in the past
export function motionAt(t) {
  const sample = (u) => {
    const P = poseAt(Math.max(0, u));
    return { x: P.root[0] + P.hipPos[0], y: P.root[1] + P.hipPos[1], z: P.root[2] + P.hipPos[2],
      roll: P.hips[2] + P.spine[2] + P.chest[2] + P.head[2], yaw: P.yaw };
  };
  const cache = new Map();
  return (lag) => {
    const key = Math.round(lag * 1000);
    if (cache.has(key)) return cache.get(key);
    const dt = 1 / 30, a = sample(t - lag), b = sample(t - lag - dt);
    const v = { vx: (a.x - b.x) / dt, vy: (a.y - b.y) / dt, vz: (a.z - b.z) / dt, roll: a.roll, spin: (a.yaw - b.yaw) / dt };
    cache.set(key, v);
    return v;
  };
}

// ---------- face ----------
const VOWEL = {};
for (const [v, chars] of Object.entries({
  a: 'アカサタナハマヤラワガザダバパャァ', i: 'イキシチニヒミリギジヂビピィ', u: 'ウクスツヌフムユルグズヅブプュゥ',
  e: 'エケセテネヘメレゲゼデベペェ', o: 'オコソトノホモヨロヲゴゾドボポョォ', n: 'ン',
})) for (const c of chars) VOWEL[c] = v;
const toKata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
export const vowelOf = (kana) => VOWEL[toKata(kana).slice(-1)] ?? 'a';

export function faceAt(t, timing) {
  const move = moveName(t);
  // blink about every 2–3 s, never during the intro freeze gag
  let open = 1;
  const win = Math.floor(t / 2.4), bt = win * 2.4 + 0.3 + hash(win) * 1.6;
  if (t > bt && t < bt + 0.14) open = Math.abs((t - bt) / 0.07 - 1);
  let left = 'open', right = 'open', mouth = 'cat', mk = 0;
  for (const e of timing.lead) {
    if (!e.sing) continue;
    if (t >= e.t - 0.04 && t < e.t + e.dur - 0.03) {
      mouth = vowelOf(e.sing);
      const into = t - e.t + 0.04;
      mk = clamp(into / 0.06) * (0.75 + 0.25 * Math.cos(into * 9));
      break;
    }
  }
  for (const c of timing.calls) if (t >= c.t && t < c.t + 0.62) { mouth = (Math.floor((t - c.t) * 12) % 2) ? 'a' : 'o'; mk = 1; }
  for (const s of timing.spoken) if (t >= s.t && t < s.t + 1.5) { mouth = 'aeiou'[Math.floor((t - s.t) * 10) % 5]; mk = 0.8; }
  if (move === 'tpose' || move === 'frozen') { mouth = 'n'; mk = 0; open = Math.min(open, 1); }
  if (move === 'title' || move === 'jump') { left = right = 'x'; if (mk < 0.1) { mouth = 'grin'; mk = 1; } }
  if (move === 'wave' && (t / BEAT) % 2 < 0.5 && mk < 0.1) { left = right = 'happy'; mouth = 'grin'; mk = 1; }
  if (move === 'peace' || move === 'stop') { right = 'happy'; if (mk < 0.1) { mouth = 'grin'; mk = 1; } }
  if (move === 'dame' && mk < 0.1) mouth = 'e', mk = 0.5;
  const look = move === 'point' ? 0.4 : Math.sin(t * 0.7) * 0.3;
  return { left, right, open, mouth, mk, look };
}

export const tposeAgain = T_POSE_AGAIN;
export { unlerp };
