// game.js — "Faxwell's Last Fax": catch pages, dodge emails, survive paper marmalade.
// Pure canvas engine. flash.js owns the overlays (title, pre-roll, loading, game over).
(() => {
  const W = 640, H = 480, GOAL = 20;
  const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
  const CHUNK = '"Arial Black","Arial Bold",Impact,sans-serif';
  const TYPES = [
    { e: '📄', w: 58, kind: 'page' },
    { e: '🎂', w: 7, kind: 'cake' },
    { e: '📧', w: 18, kind: 'bad', msg: ['EMAIL IS WHY U RETIRE', 'REPLY-ALL!!', 'electronic letter :('] },
    { e: '📱', w: 9, kind: 'bad', msg: ['TELEPHONE OF INTELLIGENCE', 'there is an app for that', 'swipe left on fax'] },
    { e: '🍓', w: 6, kind: 'jam' },
  ];
  const TOTAL = TYPES.reduce((s, t) => s + t.w, 0);
  const pickType = () => {
    let r = Math.random() * TOTAL;
    for (const t of TYPES) if ((r -= t.w) < 0) return t;
    return TYPES[0];
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---- tiny synth: a fax handshake and blips. Only ever started from a click. ----
  let actx = null, muted = false;
  const audio = () => {
    if (muted) return null;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (_) { actx = null; }
    return actx;
  };
  function tone(freq, start, dur, vol = 0.03, type = 'sine') {
    const a = audio();
    if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime + start);
    g.gain.setValueAtTime(vol, a.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + start);
    o.stop(a.currentTime + start + dur + 0.02);
  }
  function handshake() {
    if (!audio()) return;
    tone(1100, 0, 0.45, 0.025);
    tone(2100, 0.55, 0.7, 0.02);
    for (let i = 0; i < 14; i++) tone(i % 2 ? 1650 : 1850, 1.3 + i * 0.06, 0.06, 0.018, 'square');
    for (let i = 0; i < 10; i++) tone(300 + Math.random() * 2400, 2.2 + i * 0.05, 0.05, 0.012, 'sawtooth');
  }
  const blip = (good) => (good ? (tone(880, 0, 0.08), tone(1320, 0.07, 0.1)) : tone(140, 0, 0.25, 0.04, 'square'));

  // ---- background (drawn once) ----
  let bg = null;
  function drawBg() {
    bg = document.createElement('canvas');
    bg.width = W; bg.height = H;
    const c = bg.getContext('2d');
    // drop ceiling
    c.fillStyle = '#e9e5d8'; c.fillRect(0, 0, W, 60);
    c.strokeStyle = '#c9c3ae';
    for (let x = 0; x <= W; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 60); c.stroke(); }
    c.beginPath(); c.moveTo(0, 30); c.lineTo(W, 30); c.stroke();
    c.fillStyle = '#fffbe0'; c.fillRect(150, 22, 90, 10); c.fillRect(400, 22, 90, 10);
    // beige office wall
    const g = c.createLinearGradient(0, 60, 0, 390);
    g.addColorStop(0, '#d9cfa6'); g.addColorStop(1, '#bfb488');
    c.fillStyle = g; c.fillRect(0, 60, W, 330);
    // carpet
    c.fillStyle = '#4b5a6b'; c.fillRect(0, 390, W, 90);
    c.fillStyle = '#56677a';
    for (let y = 394; y < H; y += 8) for (let x = (y / 8) % 2 ? 0 : 6; x < W; x += 12) c.fillRect(x, y, 3, 3);
    // banner
    c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 2;
    c.fillRect(110, 78, 420, 54); c.strokeRect(110, 78, 420, 54);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `900 22px ${CHUNK}`; c.fillStyle = '#d40000';
    c.fillText('HAPPY RETIREMENT FAXWELL!!', 320, 98);
    c.font = 'italic 11px Verdana, sans-serif'; c.fillStyle = '#004';
    c.fillText('(FELIZ JUBILACIÓN, LONG-WRITER) (translated ×5)', 320, 120);
    // bunting
    const cols = ['#f33', '#fc0', '#3c3', '#39f', '#f6c'];
    for (let i = 0; i < 16; i++) {
      const x = i * 40 + 4;
      c.fillStyle = cols[i % cols.length];
      c.beginPath(); c.moveTo(x, 62); c.lineTo(x + 36, 62); c.lineTo(x + 18, 80); c.closePath(); c.fill();
    }
    c.strokeStyle = '#333'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 62); c.lineTo(W, 62); c.stroke();
    // LAN sign + whiteboard
    c.fillStyle = '#fff'; c.fillRect(18, 150, 120, 80); c.strokeStyle = '#888'; c.strokeRect(18, 150, 120, 80);
    c.fillStyle = '#1a3fbf'; c.font = '11px "Comic Sans MS", cursive'; c.textAlign = 'left';
    ['LAN PARTY →', 'bring CAT5!!', 'NO EMAILS', '4000 cakes??'].forEach((t, i) => c.fillText(t, 26, 166 + i * 18));
    c.textAlign = 'center';
    // sad plant + CRTs
    c.font = `40px ${EMOJI}`;
    c.fillText('🪴', 600, 360);
    c.font = `34px ${EMOJI}`;
    c.fillText('🖥️', 520, 186); c.fillText('🖥️', 566, 186);
    c.fillStyle = '#7a5a33'; c.fillRect(500, 204, 110, 10);
    c.fillStyle = '#000'; c.font = '9px Verdana, sans-serif';
    c.fillText('LAN TABLE (reserved: Brenda)', 555, 226);
    // poster
    c.fillStyle = '#123'; c.fillRect(470, 250, 90, 70);
    c.fillStyle = '#ff0'; c.font = `900 10px ${CHUNK}`;
    c.fillText('HANG IN', 515, 266); c.fillText('THERE', 515, 310);
    c.font = `28px ${EMOJI}`; c.fillText('📠', 515, 289);
  }

  // ---- game state ----
  let cv, ctx, hooks = {};
  let state = 'idle', raf = 0, last = 0;
  let px = W / 2, targetX = W / 2, score = 0, lives = 3, items = [], floats = [], spawnT = 0;
  let jam = 0, shake = 0, brendaPause = 0, brendaDone = false, t = 0, keys = {};

  function reset() {
    px = targetX = W / 2; score = 0; lives = 3; items = []; floats = []; spawnT = 0.4;
    jam = 0; shake = 0; brendaPause = 0; brendaDone = false; t = 0;
  }

  function float(text, x, y, color = '#fff', size = 18) {
    floats.push({ text, x, y, color, size, life: 1.3 });
  }

  function spawn() {
    const ty = pickType();
    items.push({ ...ty, x: 30 + Math.random() * (W - 60), y: -24, vy: 120 + score * 8 + Math.random() * 70, rot: (Math.random() - 0.5) * 2, a: 0 });
  }

  function update(dt) {
    t += dt;
    if (brendaPause > 0) {
      brendaPause -= dt;
      if (brendaPause <= 0) float('✅ Brenda approved: 10 (she wrote it down)', W / 2, 260, '#3f3', 16);
      return;
    }
    // move
    if (keys.left) targetX -= 420 * dt;
    if (keys.right) targetX += 420 * dt;
    targetX = Math.max(40, Math.min(W - 40, targetX));
    if (jam > 0) { jam -= dt; shake = 4; } else { px += (targetX - px) * Math.min(1, dt * 14); shake = Math.max(0, shake - dt * 20); }

    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = Math.max(0.34, 0.9 - score * 0.025) * (0.7 + Math.random() * 0.6); }

    for (const it of items) {
      it.y += it.vy * dt; it.a += it.rot * dt;
      if (!it.dead && it.y > 395 && it.y < 455 && Math.abs(it.x - px) < 46) {
        it.dead = true;
        if (it.kind === 'page') { score += 1; blip(true); float(pick(['+1', '+1 (filed)', '+1 (manually)', '+1 beep']), it.x, it.y - 20, '#fda238'); }
        else if (it.kind === 'cake') { score += 3; blip(true); float('+3 CAKE (faxed)', it.x, it.y - 20, '#ff6bd5', 20); }
        else if (it.kind === 'jam') { jam = 1.3; blip(false); float('MARMALADE OF PAPER!!!', W / 2, 300, '#ff3030', 26); }
        else { lives -= 1; blip(false); shake = 10; float(`-1 ❤ ${pick(it.msg)}`, it.x, it.y - 20, '#ff5050', 16); }
        hooks.onScore?.(score, lives);
      }
    }
    items = items.filter((it) => !it.dead && it.y < H + 30);
    floats.forEach((f) => ((f.life -= dt), (f.y -= 40 * dt)));
    floats = floats.filter((f) => f.life > 0);

    if (score >= 10 && !brendaDone) { brendaDone = true; brendaPause = 1.8; items = []; }
    if (score >= GOAL) return end(true);
    if (lives <= 0) return end(false);
  }

  function emoji(e, x, y, size, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.font = `${size}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(e, 0, 0); ctx.restore();
  }
  function outlined(text, x, y, size, fill, align = 'center') {
    ctx.font = `900 ${size}px ${CHUNK}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y);
  }

  function draw() {
    ctx.drawImage(bg, 0, 0);
    for (const it of items) emoji(it.e, it.x, it.y, it.kind === 'cake' ? 38 : 34, it.kind === 'page' ? Math.sin(it.a) * 0.5 : 0);

    // Faxwell
    const sx = shake ? (Math.random() - 0.5) * shake * 2 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(px, 462, 42, 8, 0, 0, Math.PI * 2); ctx.fill();
    emoji('📠', px + sx, 425, 70);
    if (jam > 0) { emoji('🍓', px + 26, 400, 26); outlined('JAMMED', px, 372, 14, '#ff3030'); }

    // HUD
    outlined(`SCORE: ${score}/${GOAL}`, 12, 22, 20, '#fda238', 'left');
    outlined('❤'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives)), 12, 48, 18, '#ff3b3b', 'left');
    outlined('BRENDA: 4,000,000', W - 12, 22, 15, '#ffef6b', 'right');
    ctx.font = '10px Verdana, sans-serif'; ctx.fillStyle = '#000'; ctx.textAlign = 'right';
    ctx.fillText('(always online)', W - 14, 42);

    for (const f of floats) {
      ctx.globalAlpha = Math.min(1, f.life * 1.5);
      outlined(f.text, f.x < 120 ? 120 : f.x > W - 120 ? W - 120 : f.x, f.y, f.size, f.color);
      ctx.globalAlpha = 1;
    }

    if (brendaPause > 0) {
      ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(0, 150, W, 150);
      emoji('👩‍💼', 90, 225, 64);
      emoji('🧮', 560, 225, 46);
      outlined('⏸ BRENDA IS MANUALLY', W / 2, 195, 24, '#fda238');
      outlined('VERIFYING UR SCORE…', W / 2, 228, 24, '#fda238');
      ctx.font = '13px Verdana, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText(`(she is using a calculator${'.'.repeat(1 + (Math.floor(t * 4) % 3))})`, W / 2, 262);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (state !== 'play') return;
    update(dt);
    if (state === 'play') draw();
    raf = requestAnimationFrame(frame);
  }

  function end(won) {
    state = 'idle';
    cancelAnimationFrame(raf);
    draw();
    cv.parentElement.classList.remove('playing');
    if (won) { tone(1046, 0, 0.15); tone(1318, 0.15, 0.15); tone(1568, 0.3, 0.3); }
    (won ? hooks.onWin : hooks.onLose)?.(score);
  }

  // ---- input ----
  function toCanvasX(e) {
    const r = cv.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * W;
  }
  function bindInput() {
    const move = (e) => { if (state === 'play') targetX = toCanvasX(e); };
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerdown', (e) => {
      if (state !== 'play') return;
      move(e);
      try { cv.setPointerCapture(e.pointerId); } catch (_) { /* fine */ }
    });
    addEventListener('keydown', (e) => {
      if (state !== 'play') return;
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) { keys.left = true; e.preventDefault(); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { keys.right = true; e.preventDefault(); }
    });
    addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.left = false;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = false;
    });
    document.addEventListener('visibilitychange', () => { last = performance.now(); });
  }

  window.FaxGame = {
    GOAL,
    init(canvas, h) {
      cv = canvas; ctx = cv.getContext('2d'); hooks = h || {};
      drawBg(); reset(); draw(); bindInput();
    },
    start() {
      reset();
      state = 'play';
      cv.parentElement.classList.add('playing');
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
    handshake,
    setMuted(m) { muted = m; },
    get muted() { return muted; },
    // read-only peek for QA bots (and Brenda)
    peek: () => ({ state, score, lives, px, items: items.map((i) => ({ x: i.x, y: i.y, kind: i.kind })) }),
  };
})();
