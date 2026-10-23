// スロップちゃん (Slop-chan): a chibi toon figure built from primitives, MMD style.
// Toon ramp + inverted-hull outlines, a canvas-drawn anime face with lip sync, and twin tails
// whose "physics" is a lagged function of the dance (so every frame is deterministic).
import * as THREE from 'three';
import { clamp } from './time.js';

const OUTLINE = 0.012;

function rampTexture() {
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

const outlineMat = new THREE.ShaderMaterial({
  uniforms: { w: { value: OUTLINE }, color: { value: new THREE.Color('#2a1630') } },
  vertexShader: `uniform float w; void main(){ vec3 p = position + normalize(normal) * w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
  fragmentShader: `uniform vec3 color; void main(){ gl_FragColor = vec4(color, 1.0); }`,
  side: THREE.BackSide,
});

export function makeChan() {
  const ramp = rampTexture();
  const mats = {};
  const toon = (hex, extra = {}) => (mats[hex + JSON.stringify(extra)] ??= new THREE.MeshToonMaterial({ color: hex, gradientMap: ramp, ...extra }));
  const parts = [];
  const add = (parent, geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1], outline = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...scale);
    m.castShadow = true;
    parent.add(m);
    if (outline) { const o = new THREE.Mesh(geo, outlineMat); m.add(o); }
    parts.push(m);
    return m;
  };
  const joint = (parent, pos, order = 'XYZ') => {
    const g = new THREE.Group();
    g.position.set(...pos); g.rotation.order = order;
    parent.add(g);
    return g;
  };
  const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 14);

  const C = {
    skin: '#ffe3d3', hair: '#ff5c8a', hairTip: '#ffd23f', top: '#fbf7ff', collar: '#2b2f77',
    ribbon: '#ff3355', skirt: '#2b2f77', band: '#ff5c8a', sock: '#1d1a2e', shoe: '#ff3355', bun: '#e8a24a', dog: '#d9483b',
  };

  const root = new THREE.Group();
  const hips = joint(root, [0, 0.58, 0], 'YXZ');
  const spine = joint(hips, [0, 0.04, 0], 'YXZ');
  const chest = joint(spine, [0, 0.13, 0], 'YXZ');
  const neck = joint(chest, [0, 0.16, 0], 'YXZ');
  const head = joint(neck, [0, 0.05, 0], 'YXZ');

  // torso: sailor top, collar, ribbon
  add(spine, new THREE.CylinderGeometry(0.105, 0.12, 0.16, 20), toon(C.top), [0, 0.05, 0]);
  add(chest, new THREE.CylinderGeometry(0.085, 0.11, 0.17, 20), toon(C.top), [0, 0.06, 0]);
  add(chest, new THREE.CylinderGeometry(0.1, 0.135, 0.06, 20, 1, true, Math.PI * 0.62, Math.PI * 1.76), toon(C.collar, { side: THREE.DoubleSide }), [0, 0.12, -0.005], [0.12, 0, 0]);
  add(chest, new THREE.SphereGeometry(0.03, 12, 10), toon(C.ribbon), [0, 0.1, 0.1]);
  add(chest, new THREE.ConeGeometry(0.035, 0.07, 4), toon(C.ribbon), [-0.032, 0.1, 0.1], [0, 0, Math.PI / 2], [1, 1, 0.5]);
  add(chest, new THREE.ConeGeometry(0.035, 0.07, 4), toon(C.ribbon), [0.032, 0.1, 0.1], [0, 0, -Math.PI / 2], [1, 1, 0.5]);
  add(chest, new THREE.ConeGeometry(0.025, 0.09, 4), toon(C.ribbon), [0.012, 0.045, 0.105], [0.25, 0, 0.2], [1, 1, 0.5]);
  add(neck, new THREE.CylinderGeometry(0.035, 0.04, 0.07, 12), toon(C.skin), [0, 0.0, 0], [0, 0, 0], [1, 1, 1], false);

  // skirt: pleated flare that sways with the hips
  const skirtJ = joint(hips, [0, 0.02, 0]);
  const skirtGeo = new THREE.CylinderGeometry(0.12, 0.24, 0.17, 16, 1, true);
  {
    const p = skirtGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const a = Math.atan2(z, x), k = 1 + 0.06 * Math.abs(Math.sin(a * 8)) * (0.5 - y / 0.17);
      p.setXYZ(i, x * k, y, z * k);
    }
    skirtGeo.computeVertexNormals();
  }
  add(skirtJ, skirtGeo, toon(C.skirt, { side: THREE.DoubleSide }), [0, -0.07, 0]);
  add(skirtJ, new THREE.CylinderGeometry(0.235, 0.245, 0.02, 16, 1, true), toon(C.band, { side: THREE.DoubleSide }), [0, -0.145, 0], [0, 0, 0], [1, 1, 1], false);

  // head
  const R = 0.3;
  const headMesh = add(head, new THREE.SphereGeometry(R, 40, 28), toon(C.skin), [0, R * 0.92, 0], [0, 0, 0], [1, 0.94, 0.96]);
  const headC = headMesh; // children positioned in head-sphere space
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = faceCanvas.height = 512;
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = 4;
  const faceGeo = new THREE.SphereGeometry(R * 1.004, 40, 28, Math.PI / 2 - 1.0, 2.0, Math.PI / 2 - 0.9, 1.8);
  const face = new THREE.Mesh(faceGeo, new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false }));
  headC.add(face);
  // hair: back shell, top cap, bangs, ahoge
  const hairM = toon(C.hair, { side: THREE.DoubleSide });
  add(headC, new THREE.SphereGeometry(R * 1.08, 36, 24, Math.PI / 2 + 1.05, Math.PI * 2 - 2.1, 0, Math.PI * 0.82), hairM, [0, 0.01, -0.01]);
  add(headC, new THREE.SphereGeometry(R * 1.075, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.3), hairM, [0, 0.012, -0.006]);
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.2;
    const b = add(headC, new THREE.ConeGeometry(0.075 - Math.abs(i) * 0.004, 0.24 - Math.abs(i) * 0.012, 6), hairM,
      [Math.sin(a) * R * 0.98, R * 0.52, Math.cos(a) * R * 0.86], [Math.PI - 0.32, a, 0], [1, 1, 0.38]);
    b.userData.bang = i;
  }
  for (const s of [-1, 1]) add(headC, new THREE.ConeGeometry(0.06, 0.42, 6), hairM, [s * R * 0.86, -0.06, 0.08], [Math.PI, 0, s * -0.12], [1, 1, 0.45]);
  const ahoge = joint(headC, [0.02, R * 1.02, 0.04]);
  add(ahoge, new THREE.TorusGeometry(0.06, 0.014, 6, 16, Math.PI * 1.3), hairM, [0.05, 0.05, 0], [0, 0, -0.4]);
  // hot dog hair clip
  const clip = joint(headC, [R * 0.72, R * 0.66, R * 0.3]);
  clip.rotation.set(0.3, 0.5, -0.7);
  add(clip, cap(0.034, 0.1), toon(C.bun), [0, 0, 0], [0, 0, Math.PI / 2], [1, 1, 0.75]);
  add(clip, cap(0.022, 0.13), toon(C.dog), [0, 0.012, 0.012], [0, 0, Math.PI / 2]);
  add(clip, new THREE.TorusGeometry(0.02, 0.005, 4, 12, Math.PI * 4), toon(C.hairTip), [0, 0.035, 0.02], [Math.PI / 2, 0, 0], [2.6, 1, 1], false);

  // twin tails: 6-link chains from the sides of the head
  const tails = [];
  for (const s of [-1, 1]) {
    const base = joint(headC, [s * R * 0.84, R * 0.42, -R * 0.2], 'ZXY');
    add(base, new THREE.TorusGeometry(0.042, 0.018, 8, 16), toon(C.hairTip), [0, 0, 0], [0, Math.PI / 2, 0]);
    const links = [];
    let parent = base;
    const N = 6;
    for (let k = 0; k < N; k++) {
      const len = 0.15 - k * 0.006;
      const j = joint(parent, k === 0 ? [s * 0.02, 0, 0] : [0, -(0.15 - (k - 1) * 0.006), 0], 'ZXY');
      const r0 = 0.07 - k * 0.009, r1 = 0.07 - (k + 1) * 0.009;
      const col = new THREE.Color(C.hair).lerp(new THREE.Color(C.hairTip), k / (N - 1));
      add(j, new THREE.CylinderGeometry(Math.max(r0, 0.012), Math.max(r1, 0.006), len, 10), toon('#' + col.getHexString()), [0, -len / 2, 0], [0, 0, 0], [1, 1, 0.75]);
      links.push(j);
      parent = j;
    }
    tails.push({ s, base, links });
  }

  // arms
  const arms = {};
  for (const [side, s] of [['L', 1], ['R', -1]]) {
    const sh = joint(chest, [s * 0.1, 0.12, 0], 'ZXY');
    add(sh, new THREE.SphereGeometry(0.045, 12, 10), toon(C.top), [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    add(sh, cap(0.035, 0.11), toon(C.top), [0, -0.07, 0]);
    const el = joint(sh, [0, -0.15, 0], 'ZXY');
    add(el, cap(0.028, 0.1), toon(C.skin), [0, -0.065, 0]);
    add(el, new THREE.CylinderGeometry(0.04, 0.034, 0.03, 12), toon(C.collar), [0, -0.025, 0], [0, 0, 0], [1, 1, 1], false);
    const hand = joint(el, [0, -0.14, 0], 'ZXY');
    add(hand, new THREE.SphereGeometry(0.038, 12, 10), toon(C.skin), [0, -0.01, 0], [0, 0, 0], [0.9, 1.1, 0.8]);
    arms[side] = { sh, el, hand, s };
  }
  // legs
  const legs = {};
  for (const [side, s] of [['L', 1], ['R', -1]]) {
    const hp = joint(hips, [s * 0.065, -0.03, 0], 'ZXY');
    add(hp, cap(0.042, 0.16), toon(C.skin), [0, -0.1, 0]);
    const kn = joint(hp, [0, -0.25, 0], 'ZXY');
    add(kn, cap(0.04, 0.17), toon(C.sock), [0, -0.12, 0]);
    add(kn, new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12), toon(C.band), [0, 0.0, 0], [0, 0, 0], [1, 1, 1], false);
    const an = joint(kn, [0, -0.25, 0], 'ZXY');
    add(an, new THREE.SphereGeometry(0.055, 14, 10), toon(C.shoe), [0, -0.03, 0.03], [0, 0, 0], [0.9, 0.6, 1.4]);
    legs[side] = { hp, kn, an, s };
  }

  root.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });

  const joints = { hips, spine, chest, neck, head, armL: arms.L, armR: arms.R, legL: legs.L, legR: legs.R };
  return { root, joints, tails, ahoge, face: { canvas: faceCanvas, tex: faceTex, key: '' }, headMesh };
}

// ---------- face ----------
const IRIS_A = '#2ee6d6', IRIS_B = '#7b3cff';

function drawEye(g, cx, cy, s, mode, open, look) {
  g.save();
  g.translate(cx, cy);
  if (mode === 'happy' || open < 0.12) {
    g.strokeStyle = '#2a1630'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath();
    if (mode === 'happy') g.arc(0, 14, 34, Math.PI * 1.15, Math.PI * 1.85);
    else g.arc(0, -10, 36, Math.PI * 0.2, Math.PI * 0.8);
    g.stroke(); g.restore(); return;
  }
  if (mode === 'x') {
    g.strokeStyle = '#2a1630'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-30 * s, -22); g.lineTo(26 * s, 0); g.lineTo(-30 * s, 22); g.stroke();
    g.restore(); return;
  }
  const h = 64 * open, w = 44;
  g.beginPath(); g.ellipse(0, 4, w, h, 0, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
  g.save(); g.clip();
  const gr = g.createLinearGradient(0, -h, 0, h);
  gr.addColorStop(0, IRIS_B); gr.addColorStop(0.55, '#c13cff'); gr.addColorStop(1, IRIS_A);
  g.beginPath(); g.ellipse(look * 8, 8, 34, 52, 0, 0, Math.PI * 2); g.fillStyle = gr; g.fill();
  g.beginPath(); g.ellipse(look * 8, 12, 16, 26, 0, 0, Math.PI * 2); g.fillStyle = '#1a0b2a'; g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(look * 8 - 14, -18, 13, 17, -0.4, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(look * 8 + 14, 30, 6, 7, 0, 0, Math.PI * 2); g.fill();
  // star sparkle in the pupil
  g.beginPath();
  for (let k = 0; k < 8; k++) { const r = k % 2 ? 3 : 9, a = (k * Math.PI) / 4; g.lineTo(look * 8 + 4 + Math.cos(a) * r, 22 + Math.sin(a) * r); }
  g.fill();
  g.restore();
  // lashes + lid line
  g.strokeStyle = '#2a1630'; g.lineCap = 'round';
  g.lineWidth = 11;
  g.beginPath(); g.ellipse(0, 4, w + 2, h + 2, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  g.lineWidth = 7;
  g.beginPath(); g.moveTo(s * (w - 2), -h * 0.55); g.lineTo(s * (w + 16), -h * 0.8); g.stroke();
  g.beginPath(); g.moveTo(s * (w + 2), -h * 0.2); g.lineTo(s * (w + 18), -h * 0.3); g.stroke();
  g.restore();
}

function drawMouth(g, x, y, m, k) {
  g.save(); g.translate(x, y);
  g.strokeStyle = '#2a1630'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
  const open = (w, h) => {
    g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); g.fillStyle = '#7a1f3d'; g.fill(); g.stroke();
    g.save(); g.clip(); g.beginPath(); g.ellipse(0, h * 0.8, w * 0.7, h * 0.5, 0, 0, Math.PI * 2); g.fillStyle = '#ff7a9a'; g.fill(); g.restore();
  };
  if (k < 0.15 || m === 'n') {
    if (m === 'cat' || m === 'smile' || m === 'n') { g.beginPath(); g.moveTo(-22, -4); g.quadraticCurveTo(-11, 8, 0, -2); g.quadraticCurveTo(11, 8, 22, -4); g.stroke(); }
    else { g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 0); g.stroke(); }
  } else if (m === 'a') open(22, 26 * k);
  else if (m === 'i') open(28, 10 * k + 3);
  else if (m === 'u') open(12, 14 * k + 2);
  else if (m === 'e') open(24, 16 * k + 3);
  else if (m === 'o') open(17, 22 * k);
  else if (m === 'grin') { g.beginPath(); g.moveTo(-28, -6); g.quadraticCurveTo(0, 34, 28, -6); g.closePath(); g.fillStyle = '#7a1f3d'; g.fill(); g.stroke(); }
  g.restore();
}

export function drawFace(chan, st) {
  const key = `${st.left}|${st.right}|${st.open.toFixed(1)}|${st.mouth}|${st.mk.toFixed(1)}|${st.look.toFixed(1)}`;
  if (chan.face.key === key) return;
  chan.face.key = key;
  const g = chan.face.canvas.getContext('2d');
  g.clearRect(0, 0, 512, 512);
  // blush
  for (const x of [120, 392]) {
    const gr = g.createRadialGradient(x, 330, 4, x, 330, 46);
    gr.addColorStop(0, 'rgba(255,90,140,0.55)'); gr.addColorStop(1, 'rgba(255,90,140,0)');
    g.fillStyle = gr; g.fillRect(x - 60, 270, 120, 120);
    g.strokeStyle = 'rgba(255,60,120,0.6)'; g.lineWidth = 3;
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * 14 - 5, 322); g.lineTo(x + k * 14 + 3, 312); g.stroke(); }
  }
  drawEye(g, 170, 250, -1, st.left, st.open, st.look);
  drawEye(g, 342, 250, 1, st.right, st.open, st.look);
  // brows
  g.strokeStyle = '#c23a6a'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(140, 166); g.quadraticCurveTo(170, 154, 200, 162); g.stroke();
  g.beginPath(); g.moveTo(312, 162); g.quadraticCurveTo(342, 154, 372, 166); g.stroke();
  drawMouth(g, 256, 372, st.mouth, st.mk);
  chan.face.tex.needsUpdate = true;
}

// ---------- pose application ----------
const set = (o, r) => o.rotation.set(r[0], r[1], r[2]);

export function applyPose(chan, P, motion) {
  const J = chan.joints;
  J.hips.position.set(P.hipPos[0], 0.58 + P.hipPos[1], P.hipPos[2]);
  set(J.hips, P.hips); set(J.spine, P.spine); set(J.chest, P.chest); set(J.neck, P.neck); set(J.head, P.head);
  for (const k of ['L', 'R']) {
    const a = J['arm' + k], A = P['arm' + k], s = a.s;
    // A = [out, fwd, twist, elbow, elbowTwist, wrist]
    a.sh.rotation.set(-A[1], s * A[2], s * A[0]);
    a.el.rotation.set(-A[3], s * A[4], 0);
    a.hand.rotation.set(-A[5], 0, 0);
    const l = J['leg' + k], L = P['leg' + k], ls = l.s;
    // L = [lift, out, twist, knee, ankle]
    l.hp.rotation.set(-L[0], ls * L[2], ls * L[1]);
    l.kn.rotation.set(L[3], 0, 0);
    l.an.rotation.set(-L[4], 0, 0);
  }
  // hair "physics": each link bends against the body's recent motion, more toward the tip
  for (const tail of chan.tails) {
    tail.links.forEach((j, k) => {
      const lag = motion(k * 0.045 + 0.03);
      const w = 0.25 + k * 0.16;
      const swingX = clamp(-lag.vy * 0.9 + lag.vz * 0.6, -0.6, 0.6) * w;
      const swingZ = clamp(-lag.vx * 1.4 - lag.roll * 0.8 + tail.s * Math.min(Math.abs(lag.spin) * 0.08, 0.9), -0.9, 0.9) * w;
      j.rotation.set(k === 0 ? 0.25 + swingX : swingX * 0.6, 0, (k === 0 ? tail.s * 0.32 : tail.s * 0.03) + swingZ * 0.7);
    });
  }
  const l0 = motion(0.05);
  chan.ahoge.rotation.set(clamp(-l0.vy * 1.2, -0.5, 0.5), 0, clamp(l0.vx * 2, -0.6, 0.6));
}
