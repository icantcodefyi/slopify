// Entry: builds the world and renders frame t. Live mode plays it against the audio;
// render mode (?render=1) exposes window.__mv.renderAt(t) for the frame-by-frame renderer.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { at, clamp, sectionAt, pulse, BEAT } from './time.js';
import { makeChan, applyPose, drawFace } from './chan.js';
import { poseAt, motionAt, faceAt, tposeAgain } from './dance.js';
import { makeStage, updateStage, SITES, PALETTES } from './stage.js';
import { cameraAt } from './camera.js';
import { drawOverlay, W, H } from './overlay.js';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
const SCALE = Number(params.get('scale') ?? (RENDER ? 1 : Math.min(1, (window.devicePixelRatio * Math.min(innerWidth / W, innerHeight / H)) || 1)));

async function boot() {
  const timing = await (await fetch('./assets/timing.json')).json();
  await Promise.all(['900 40px "M PLUS Rounded 1c"', '800 40px "M PLUS Rounded 1c"', '40px "Dela Gothic One"', '40px "DotGothic16"', '40px "Michroma"']
    .map((f) => document.fonts.load(f, 'スロップ計画ABC').catch(() => {})));

  const loader = new THREE.TextureLoader();
  const textures = {}, images = {};
  await Promise.all(SITES.map((s) => new Promise((res) => loader.load(`./assets/sites/${s}.jpg`, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    textures[s] = tex; images[s] = tex.image; res();
  }, undefined, res))));

  const rw = Math.round(W * SCALE), rh = Math.round(H * SCALE);
  const gl = document.getElementById('gl'), ov = document.getElementById('ov');
  const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, preserveDrawingBuffer: RENDER, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(rw, rh, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  ov.width = rw; ov.height = rh;
  const g = ov.getContext('2d');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.05, 200);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9a88b0, 0.95);
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(2, 4, 5);
  const rim = new THREE.DirectionalLight(0xff5c8a, 2.0);
  rim.position.set(-3, 2.5, -4);
  scene.add(hemi, key, rim);

  const chan = makeChan();
  scene.add(chan.root);
  const S = makeStage(scene, textures);

  const rt = new THREE.WebGLRenderTarget(rw, rh, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(1);
  composer.setSize(rw, rh);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(rw, rh), 0.6, 0.45, 0.88);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const boneNames = ['hips', 'spine', 'chest', 'neck', 'head'];
  const boneLinks = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [6, 7], [2, 8], [8, 9], [9, 10], [0, 11], [11, 12], [12, 13], [0, 14], [14, 15], [15, 16]];
  const v = new THREE.Vector3();
  const project = (o) => { o.getWorldPosition(v); v.project(camera); return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H }; };

  function renderAt(t) {
    const sec = sectionAt(timing, t);
    const editor = t < at(5);
    // character
    const P = poseAt(t);
    chan.root.position.set(P.root[0], P.root[1], P.root[2]);
    chan.root.rotation.y = P.yaw;
    applyPose(chan, P, motionAt(t));
    drawFace(chan, faceAt(t, timing));
    S.shadow.position.set(P.root[0] + P.hipPos[0], 0.005, P.root[2]);
    S.shadow.scale.setScalar(1 - clamp(P.root[1] * 1.5, 0, 0.5));
    // world
    updateStage(S, t, sec, timing, textures, { h: rh });
    scene.background = editor ? new THREE.Color('#ffffff') : null;
    const pal = PALETTES[sec.name];
    rim.color.set(editor ? '#ffffff' : pal.a);
    rim.intensity = editor ? 0.6 : 1.6 + 1.0 * pulse(t, BEAT, 0.2);
    hemi.groundColor.set(editor ? '#c8c8d0' : pal.bot);
    // camera
    const c = cameraAt(t, sec.name);
    camera.position.set(...c.pos);
    camera.fov = c.fov;
    camera.lookAt(...c.target);
    camera.rotateZ(c.roll);
    if (editor) camera.setViewOffset(W, H, -190, 60, W, H); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    bloom.strength = editor ? 0 : { verse: 0.5, pre: 0.6, chorus: 0.75, bridge: 0.6, final: 0.8, outro: 0.6 }[sec.name] + 0.2 * pulse(t, BEAT, 0.15);
    composer.render();
    // overlay
    let bones = null;
    if (editor) {
      const J = chan.joints;
      const list = [...boneNames.map((n) => J[n]), J.armL.sh, J.armL.el, J.armL.hand, J.armR.sh, J.armR.el, J.armR.hand, J.legL.hp, J.legL.kn, J.legL.an, J.legR.hp, J.legR.kn, J.legR.an];
      bones = list.map(project);
    }
    g.setTransform(rw / W, 0, 0, rh / H, 0, 0);
    drawOverlay(g, t, { timing, sec, images, bones, boneLinks, loading: clamp(t / 3.6), tposeAgain });
  }

  return { timing, renderAt, duration: timing.duration, debug: { THREE, scene, renderer, composer, bloom, S, chan } };
}

const ready = boot();
if (RENDER) {
  document.body.classList.add('render');
  window.__mv = { ready: ready.then((mv) => { Object.assign(window.__mv, mv); return mv.duration; }) };
} else {
  ready.then((mv) => startLive(mv));
}

function startLive(mv) {
  const audio = new Audio('./assets/slopify-mv.mp3');
  audio.preload = 'auto';
  const gate = document.getElementById('gate');
  const bar = document.getElementById('progress');
  let started = false;
  mv.renderAt(0.01);
  gate.classList.add('ready');
  const go = () => {
    if (!started) { started = true; gate.classList.add('gone'); }
    audio.currentTime = audio.ended ? 0 : audio.currentTime;
    audio.play();
  };
  gate.addEventListener('click', go);
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); audio.paused ? go() : audio.pause(); }
    if (e.code === 'ArrowRight') audio.currentTime = Math.min(mv.duration, audio.currentTime + 5);
    if (e.code === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
  });
  document.getElementById('stage').addEventListener('click', () => { if (started) (audio.paused ? go() : audio.pause()); });
  audio.addEventListener('ended', () => { gate.classList.remove('gone'); gate.querySelector('b').textContent = '↻ もう一回 / replay'; started = false; });
  const loop = () => {
    if (started) mv.renderAt(audio.currentTime);
    bar.style.width = `${(audio.currentTime / mv.duration) * 100}%`;
    requestAnimationFrame(loop);
  };
  loop();
}
