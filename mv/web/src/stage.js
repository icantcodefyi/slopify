// The world: the MMD editor void (intro) and the concert stage (everything else).
import * as THREE from 'three';
import { BEAT, BAR, at, clamp, hash, lerp, pulse, smooth, unlerp } from './time.js';

export const SITES = ['win98', 'y2k', 'crypto', 'brainrot', 'geocities', 'web2', 'linkedin', 'gov', 'flash', 'forum', 'myspace', 'infomercial'];

// palettes per section: sky top, sky bottom, accent A, accent B, penlight colours
export const PALETTES = {
  intro: { top: '#e9edf5', bot: '#ffffff', a: '#ff5c8a', b: '#2ee6d6', pen: ['#ff5c8a'] },
  verse: { top: '#05061c', bot: '#2a0b3a', a: '#ff5c8a', b: '#2ee6d6', pen: ['#2ee6d6', '#ff5c8a'] },
  pre: { top: '#0d0221', bot: '#4a0b5e', a: '#b45cff', b: '#ffd23f', pen: ['#b45cff'] },
  chorus: { top: '#3a0ca3', bot: '#ff4f9a', a: '#ffd23f', b: '#2ee6d6', pen: ['#ff5c8a', '#ffd23f', '#2ee6d6', '#9dff3c', '#b45cff'] },
  bridge: { top: '#021a0a', bot: '#1f3d00', a: '#c6ff00', b: '#ff2bd6', pen: ['#c6ff00', '#ff2bd6'] },
  final: { top: '#2b00ff', bot: '#ff8a1f', a: '#fff35c', b: '#ff2d75', pen: ['#ff5c8a', '#ffd23f', '#2ee6d6', '#9dff3c', '#b45cff', '#ffffff'] },
  outro: { top: '#14062e', bot: '#ff7aa8', a: '#ffd23f', b: '#ff5c8a', pen: ['#ffd23f', '#ff5c8a'] },
};

const additive = (opts) => ({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...opts });

function textBand(text, color, h = 128) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `900 ${h * 0.72}px "M PLUS Rounded 1c", "Hiragino Sans", sans-serif`;
  const w = Math.ceil(g.measureText(text).width);
  c.width = w; c.height = h;
  g.font = `900 ${h * 0.72}px "M PLUS Rounded 1c", "Hiragino Sans", sans-serif`;
  g.fillStyle = color; g.textBaseline = 'middle';
  g.fillText(text, 0, h / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, aspect: w / h };
}

export function makeStage(scene, textures) {
  const S = { groups: {} };

  // ---------------- MMD editor void ----------------
  const editor = new THREE.Group();
  const grid = new THREE.GridHelper(10, 20, 0x9aa3b5, 0xc9cfda);
  editor.add(grid);
  const axis = (dir, color) => {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.001, 0), dir.clone().multiplyScalar(5)]);
    editor.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color })));
  };
  axis(new THREE.Vector3(1, 0, 0), 0xff2020); axis(new THREE.Vector3(0, 1, 0), 0x20c020); axis(new THREE.Vector3(0, 0, 1), 0x2040ff);
  scene.add(editor);
  S.editor = editor;

  // ---------------- stage ----------------
  const stage = new THREE.Group();
  scene.add(stage);
  S.stage = stage;

  // sky dome
  const skyU = { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, t: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 bot; uniform float t; varying vec3 vp;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      void main(){ float k = smoothstep(-0.15, 0.7, vp.y); vec3 c = mix(bot, top, k);
        vec2 g = floor(vec2(atan(vp.z, vp.x) * 120.0, vp.y * 90.0));
        float s = step(0.992, h(g)) * smoothstep(0.0, 0.4, vp.y) * (0.6 + 0.4 * sin(t * 3.0 + h(g + 3.0) * 40.0));
        gl_FragColor = vec4(c + s, 1.0); }`,
  }));
  stage.add(sky);
  S.skyU = skyU;

  // LED floor: a disc of tiles that light up per beat
  const floorU = { t: { value: 0 }, beat: { value: 0 }, a: { value: new THREE.Color() }, b: { value: new THREE.Color() }, energy: { value: 0 }, mode: { value: 0 } };
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 96), new THREE.ShaderMaterial({
    uniforms: floorU,
    vertexShader: `varying vec2 vp; void main(){ vp = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float t; uniform float beat; uniform vec3 a; uniform vec3 b; uniform float energy; uniform float mode; varying vec2 vp;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      void main(){
        float r = length(vp);
        vec2 cell = floor(vp / 0.32); vec2 f = fract(vp / 0.32);
        float edge = smoothstep(0.0, 0.06, f.x) * smoothstep(0.0, 0.06, f.y) * smoothstep(1.0, 0.94, f.x) * smoothstep(1.0, 0.94, f.y);
        float bi = floor(beat);
        float on = step(0.55, h(cell + bi * 1.37));
        float ring = 0.5 + 0.5 * sin(r * 6.0 - beat * 3.14159);
        float checker = mod(cell.x + cell.y + bi, 2.0);
        float lit = mix(on, mix(ring, checker, step(1.5, mode)), step(0.5, mode));
        vec3 col = mix(a, b, h(cell + 9.1));
        vec3 base = vec3(0.02, 0.015, 0.05);
        vec3 c = base + col * lit * edge * (0.25 + 0.75 * energy) * fract(1.0 - fract(beat) * 0.6);
        float rim = smoothstep(3.05, 3.12, r) * smoothstep(3.2, 3.13, r);
        c += mix(a, b, 0.5 + 0.5 * sin(atan(vp.y, vp.x) * 3.0 + t)) * rim * 2.0;
        float inner = smoothstep(1.32, 1.36, r) * smoothstep(1.4, 1.36, r);
        c += a * inner * 1.2;
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  floor.rotation.x = -Math.PI / 2;
  stage.add(floor);
  // stage riser below the disc
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.35, 0.5, 96, 1, true), new THREE.MeshBasicMaterial({ color: 0x0b0716 }));
  riser.position.y = -0.25;
  stage.add(riser);
  S.floorU = floorU;

  // blob shadow under her
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  { const g = sc.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.005;
  scene.add(shadow);
  S.shadow = shadow;

  // LED wall: one big screen and four side screens showing the slop sites
  const screens = [];
  const wall = new THREE.Group();
  wall.position.set(0, 0, -4.2);
  stage.add(wall);
  const scrMat = () => new THREE.ShaderMaterial({
    uniforms: { map: { value: textures.win98 }, t: { value: 0 }, glitch: { value: 0 }, bright: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D map; uniform float t; uniform float glitch; uniform float bright; varying vec2 vUv;
      float h(float n){ return fract(sin(n) * 43758.5453); }
      void main(){ vec2 uv = vUv; float band = floor(uv.y * 24.0);
        uv.x += glitch * (h(band + floor(t * 30.0)) - 0.5) * 0.25 * step(0.6, h(band * 3.1 + floor(t * 30.0)));
        vec3 c = texture2D(map, uv).rgb;
        c.r = mix(c.r, texture2D(map, uv + vec2(0.006 * glitch, 0.0)).r, 0.8);
        float scan = 0.82 + 0.18 * sin(vUv.y * 540.0);
        vec2 px = fract(vUv * vec2(160.0, 90.0)); float dot = smoothstep(0.0, 0.18, px.x) * smoothstep(0.0, 0.18, px.y);
        gl_FragColor = vec4(c * scan * (0.75 + 0.25 * dot) * bright, 1.0); }`,
  });
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x111122 });
  const addScreen = (w, h, x, y, z, ry) => {
    const g = new THREE.Group();
    g.position.set(x, y, z); g.rotation.y = ry;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.08), frameMat);
    frame.position.z = -0.05;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.5, h + 0.5), new THREE.MeshBasicMaterial(additive({ color: 0xff5c8a, opacity: 0.25 })));
    glow.position.z = -0.1;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scrMat());
    g.add(glow, frame, m);
    wall.add(g);
    screens.push({ mesh: m, glow, group: g });
  };
  addScreen(4.8, 2.7, 0, 2.15, 0, 0);
  addScreen(2.2, 1.24, -3.9, 2.9, 0.9, 0.45);
  addScreen(2.2, 1.24, 3.9, 2.9, 0.9, -0.45);
  addScreen(2.2, 1.24, -3.9, 1.45, 0.9, 0.45);
  addScreen(2.2, 1.24, 3.9, 1.45, 0.9, -0.45);
  S.screens = screens;

  // rotating text rings around the stage
  const rings = [];
  for (const [text, y, r, h, dir, color] of [
    [' SLOPIFY ✦ スロッピファイ ✦ ', 0.18, 3.45, 0.32, 1, '#ffffff'],
    [' 0 BUSINESSES HARMED ✦ BEST VIEWED IN NETSCAPE ✦ ', 3.9, 4.6, 0.36, -1, '#ffffff'],
  ]) {
    const band = textBand(text, color);
    const circ = 2 * Math.PI * r;
    band.tex.repeat.set(Math.round(circ / (h * band.aspect)), 1);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 96, 1, true), new THREE.MeshBasicMaterial(additive({ map: band.tex, side: THREE.DoubleSide, opacity: 0.9 })));
    m.position.y = y;
    stage.add(m);
    rings.push({ m, dir });
  }
  S.rings = rings;

  // spotlight cones from an overhead truss
  const coneMat = (color) => new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, k: { value: 1 } },
    vertexShader: `varying float vy; varying vec3 vn; varying vec3 vv; void main(){ vy = uv.y; vn = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position,1.0); vv = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 color; uniform float k; varying float vy; varying vec3 vn; varying vec3 vv;
      void main(){ float d = clamp(abs(dot(normalize(vn), normalize(vv))), 0.0, 1.0); float y = clamp(vy, 0.0, 1.0);
        vec3 c = color * k * d * sqrt(d) * y * sqrt(y) * 0.22; if (any(isnan(c))) c = vec3(0.0);
        gl_FragColor = vec4(min(c, vec3(4.0)), 1.0); }`,
    ...additive({ side: THREE.DoubleSide }),
  });
  const spots = [];
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    const x = (i - 2.5) * 1.5;
    pivot.position.set(x, 6.2, -1.2 + (i % 2) * 1.2);
    const geo = new THREE.CylinderGeometry(0.06, 1.1, 7, 32, 1, true);
    geo.translate(0, -3.5, 0);
    const cone = new THREE.Mesh(geo, coneMat('#ffffff'));
    pivot.add(cone);
    stage.add(pivot);
    spots.push({ pivot, cone, x });
  }
  S.spots = spots;

  // lasers fanning from behind the wall
  const lasers = [];
  for (let i = 0; i < 10; i++) {
    const pivot = new THREE.Group();
    pivot.position.set(i < 5 ? -5.5 : 5.5, 0.4 + (i % 5) * 0.12, -4);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 30, 6, 1, true), new THREE.MeshBasicMaterial(additive({ color: 0x2ee6d6, opacity: 0.9 })));
    beam.geometry.translate(0, 15, 0);
    pivot.add(beam);
    stage.add(pivot);
    lasers.push({ pivot, beam, i });
  }
  S.lasers = lasers;

  // crowd with penlights, below the stage lip
  const crowd = [];
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0x07040e });
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 26; i++) {
      const x = (i - 12.5) * 0.52 + (row % 2) * 0.26 + (hash(i * 7 + row) - 0.5) * 0.15;
      const z = 3.6 + row * 0.75;
      const p = new THREE.Group();
      p.position.set(x, -0.95 - row * 0.02 + hash(i + row * 31) * 0.08, z);
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.35, 4, 10), bodyMat);
      body.position.y = 0.2;
      const headM = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), bodyMat);
      headM.position.y = 0.66;
      p.add(body, headM);
      const sticks = [];
      for (const s of hash(i * 3.3 + row) > 0.35 ? [-1, 1] : [1]) {
        const arm = new THREE.Group();
        arm.position.set(s * 0.17, 0.45, 0);
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        stick.position.y = 0.45;
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.6), new THREE.MeshBasicMaterial(additive({ color: 0xffffff, opacity: 0.35 })));
        glow.position.y = 0.45;
        arm.add(stick, glow);
        p.add(arm);
        sticks.push({ arm, stick, glow, s });
      }
      stage.add(p);
      crowd.push({ p, sticks, row, i, seed: hash(i * 13.7 + row * 5.1) });
    }
  }
  S.crowd = crowd;

  // falling sakura petals + sparkles (deterministic particle field)
  const N = 700;
  const seeds = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { seeds[i * 4] = hash(i * 1.1); seeds[i * 4 + 1] = hash(i * 2.3); seeds[i * 4 + 2] = hash(i * 3.7); seeds[i * 4 + 3] = hash(i * 5.9); }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  pg.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
  const partU = { t: { value: 0 }, a: { value: new THREE.Color() }, b: { value: new THREE.Color() }, amount: { value: 1 }, px: { value: 1 } };
  const parts = new THREE.Points(pg, new THREE.ShaderMaterial({
    uniforms: partU, ...additive({}),
    vertexShader: `attribute vec4 seed; uniform float t; uniform float amount; uniform float px; varying vec4 vs; varying float vis;
      void main(){ vs = seed; float fall = mod(seed.y * 9.0 - t * (0.35 + seed.z * 0.4), 9.0);
        vec3 p = vec3((seed.x - 0.5) * 16.0 + sin(t * 0.8 + seed.w * 20.0) * 0.6, fall - 1.5, (seed.z - 0.5) * 12.0 - 1.0);
        vis = step(seed.w, amount);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = min(48.0, px * (seed.w > 0.85 ? 0.07 : 0.1) * (0.5 + seed.x) / max(0.3, -mv.z)); }`,
    fragmentShader: `uniform vec3 a; uniform vec3 b; uniform float t; varying vec4 vs; varying float vis;
      void main(){ if (vis < 0.5) discard; vec2 p = gl_PointCoord * 2.0 - 1.0;
        float ang = t * (1.0 + vs.y * 3.0) + vs.x * 6.28; p = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p;
        float m;
        if (vs.w > 0.85) { m = max(0.0, 1.0 - abs(p.x) * 6.0 - abs(p.y)) + max(0.0, 1.0 - abs(p.y) * 6.0 - abs(p.x)); }
        else { p.x *= 1.7; float r = length(p); m = smoothstep(1.0, 0.6, r + 0.25 * abs(sin(atan(p.y, p.x) * 2.5))); }
        vec3 c = vs.w > 0.85 ? vec3(1.0) : mix(a, b, vs.z);
        gl_FragColor = vec4(c * m * 0.6, 1.0); }`,
  }));
  parts.frustumCulled = false;
  stage.add(parts);
  S.partU = partU;

  // emoji rain (final chorus): a sprite atlas
  const emo = ['🌭', '💀', '🔥', '😭', '🗿', '✨', '🦆', '🧀', '🦞', '📠', '🪿', '🥔'];
  const ac = document.createElement('canvas'); ac.width = 512; ac.height = 384;
  { const g = ac.getContext('2d'); g.font = '100px "Apple Color Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    emo.forEach((e, k) => g.fillText(e, (k % 4) * 128 + 64, Math.floor(k / 4) * 128 + 68)); }
  const atlas = new THREE.CanvasTexture(ac); atlas.colorSpace = THREE.SRGBColorSpace;
  const emojis = [];
  for (let i = 0; i < 46; i++) {
    const k = i % emo.length;
    const tex = atlas.clone(); tex.needsUpdate = true;
    tex.repeat.set(0.25, 1 / 3); tex.offset.set((k % 4) * 0.25, 1 - (Math.floor(k / 4) + 1) / 3);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.visible = false;
    stage.add(sp);
    emojis.push({ sp, seed: hash(i * 9.13), seed2: hash(i * 4.77) });
  }
  S.emojis = emojis;

  return S;
}

const col = (c, hex) => c.set(hex);

export function updateStage(S, t, sec, timing, textures, live) {
  const name = sec.name;
  const isEditor = t < at(5);
  S.editor.visible = isEditor;
  S.stage.visible = !isEditor;
  S.shadow.visible = !isEditor;
  if (isEditor) return;
  const P = PALETTES[name];
  // palette crossfade: chorus floods colour in from the drop
  col(S.skyU.top.value, P.top); col(S.skyU.bot.value, P.bot);
  S.skyU.t.value = t;
  const B = t / BEAT;
  const energy = { verse: 0.55, pre: 0.7, chorus: 1, bridge: 0.8, final: 1, outro: 0.5 }[name] ?? 0.6;
  S.floorU.t.value = t; S.floorU.beat.value = B; S.floorU.energy.value = energy;
  col(S.floorU.a.value, P.a); col(S.floorU.b.value, P.b);
  S.floorU.mode.value = name === 'bridge' ? 2 : name === 'chorus' || name === 'final' ? 1 : 0;

  // screens: which site on which screen
  const bar = Math.floor(t / BAR) + 1;
  S.screens.forEach((s, k) => {
    let idx;
    if (name === 'bridge') idx = clamp(Math.floor((t - sec.t0) / (BAR / 2)), 0, 11) + (k ? k * 3 : 0);
    else idx = bar + k * 5;
    s.mesh.material.uniforms.map.value = textures[SITES[((idx % 12) + 12) % 12]];
    s.mesh.material.uniforms.t.value = t;
    const cutAt = name === 'bridge' ? (t - sec.t0) % (BAR / 2) : t % BAR;
    s.mesh.material.uniforms.glitch.value = cutAt < 0.12 ? 1 - cutAt / 0.12 : 0;
    s.mesh.material.uniforms.bright.value = 0.85 + 0.35 * pulse(t, BEAT, 0.2);
    s.glow.material.color.set(k % 2 ? P.b : P.a);
  });

  S.rings.forEach((r) => { r.m.rotation.y = r.dir * t * 0.25; r.m.material.color.set(r.dir > 0 ? P.a : '#ffffff'); });

  // spots sweep on the beat; in the chorus they strobe colours
  S.spots.forEach((sp, i) => {
    const sw = Math.sin(B * Math.PI / 2 + i * 1.3);
    sp.pivot.rotation.set(0.35 * Math.cos(B * Math.PI / 4 + i), 0, 0.45 * sw * (i % 2 ? 1 : -1));
    const c = i % 2 ? P.a : P.b;
    sp.cone.material.uniforms.color.value.set(name === 'chorus' || name === 'final' ? P.pen[(i + Math.floor(B)) % P.pen.length] : c);
    sp.cone.material.uniforms.k.value = (name === 'verse' ? 0.6 : 1) * (0.7 + 0.6 * pulse(t, BEAT, 0.25));
  });

  // lasers only when it goes off
  const laserOn = name === 'chorus' || name === 'final' || (name === 'bridge' && (t - sec.t0) % (BAR / 2) < 0.25);
  S.lasers.forEach((l) => {
    l.beam.visible = laserOn;
    const s = l.i < 5 ? 1 : -1, k = l.i % 5;
    l.pivot.rotation.set(-0.15 - 0.1 * Math.sin(B * 0.5 + k), 0, s * (-0.9 + k * 0.28 + 0.35 * Math.sin(B * Math.PI / 2 + k * 0.6)));
    l.beam.material.color.set(k % 2 ? P.a : P.b);
  });

  // penlights: everyone waves on the beat; the bridge does wota circles
  S.crowd.forEach((c) => {
    const lag = c.seed * 0.06;
    const bb = (t - lag) / BEAT;
    c.p.position.y = -0.95 + 0.06 * Math.max(0, Math.sin(Math.PI * bb)) * (name === 'verse' ? 0.5 : 1);
    c.sticks.forEach((st, j) => {
      const swing = name === 'bridge' ? 1.2 * Math.sin(2 * Math.PI * bb + st.s) : 0.65 * Math.sin(Math.PI * bb);
      st.arm.rotation.set(name === 'bridge' ? 0.6 * Math.cos(2 * Math.PI * bb) : 0, 0, swing * (name === 'outro' ? 0.4 : 1) - st.s * 0.15);
      const pc = P.pen[(c.i + c.row + j) % P.pen.length];
      st.stick.material.color.set(pc); st.glow.material.color.set(pc);
    });
  });

  S.partU.t.value = t; col(S.partU.a.value, P.a); col(S.partU.b.value, P.b);
  S.partU.amount.value = { verse: 0.35, pre: 0.5, chorus: 1, bridge: 0.25, final: 1, outro: 0.8 }[name] ?? 0.5;
  S.partU.px.value = live.h * 1.5;

  // emoji rain in the final chorus
  const rain = name === 'final' || name === 'outro';
  S.emojis.forEach((e, i) => {
    e.sp.visible = rain;
    if (!rain) return;
    const u = t - at(31) + e.seed * 12;
    const y = 7 - ((u * (1.1 + e.seed2)) % 9);
    e.sp.position.set((e.seed - 0.5) * 11, y, -2.5 + e.seed2 * 4 - (Math.abs(e.seed - 0.5) < 0.12 ? 2 : 0));
    e.sp.material.rotation = u * (e.seed2 - 0.5) * 3;
    const s = 0.35 + e.seed2 * 0.4;
    e.sp.scale.set(s, s, s);
  });
}
