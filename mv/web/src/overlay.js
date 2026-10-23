// 2D overlay at 1920×1080: the MMD editor parody, title, karaoke lyrics, staff credits,
// boxed words, the bridge roll-call cards, onomatopoeia and the end card.
import { BEAT, BAR, at, clamp, lerp, outBack, outExpo, outCubic, inCubic, pulse, smooth, unlerp, hash, hold } from './time.js';
import { SITES, PALETTES } from './stage.js';

export const W = 1920, H = 1080;
const F = {
  jp: '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Hiragino Sans", sans-serif',
  big: '"Dela Gothic One", "Hiragino Sans", sans-serif',
  dot: '"DotGothic16", "MS Gothic", monospace',
  ui: '"Segoe UI", "Hiragino Sans", "Meiryo", sans-serif',
  comic: '"Comic Sans MS", "Comic Neue", cursive',
  wide: '"Michroma", "Arial Black", sans-serif',
};
const ERA = {
  win98: 'WINDOWS 98 DESKTOP', y2k: 'Y2K CHROME SPLASH', crypto: 'CRYPTO RUG-PULL 2021', brainrot: 'BRAINROT FEED',
  geocities: 'GEOCITIES 1999', web2: 'WEB 2.0 BETA', linkedin: 'LINKEDIN GURU', gov: 'GOV PORTAL 2001',
  flash: 'FLASH GAME PORTAL', forum: 'PHPBB FORUM', myspace: 'MYSPACE 2006', infomercial: '3AM INFOMERCIAL',
};

const font = (g, w, size, fam) => { g.font = `${w} ${size}px ${fam}`; };
function strokeText(g, text, x, y, fill, stroke, lw) {
  g.lineJoin = 'round'; g.miterLimit = 2;
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.strokeText(text, x, y); }
  g.fillStyle = fill; g.fillText(text, x, y);
}

// ---------------- MMD editor parody ----------------
const BONES = ['センター', 'グルーブ', '上半身', '首', '頭', '左腕', '左ひじ', '右腕', '右ひじ', '左足ＩＫ', '右足ＩＫ', 'ツインテ左', 'ツインテ右', 'アホ毛', 'ホットドッグ'];
const PLAY = { x: 1676, y: 950, w: 150, h: 46 };

function panel(g, x, y, w, h, title) {
  g.fillStyle = '#ece9e2'; g.fillRect(x, y, w, h);
  g.strokeStyle = '#8f8b84'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (title) {
    g.fillStyle = '#ece9e2'; font(g, 400, 15, F.ui); g.fillStyle = '#222'; g.fillText(title, x + 10, y + 18);
    g.strokeStyle = '#b9b5ae'; g.beginPath(); g.moveTo(x + 6, y + 28.5); g.lineTo(x + w - 6, y + 28.5); g.stroke();
  }
}
function button(g, x, y, w, h, label, pressed = false, hot = false) {
  const gr = g.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, pressed ? '#c9d9ef' : hot ? '#f4f9ff' : '#fdfdfd'); gr.addColorStop(1, pressed ? '#a9c2e6' : hot ? '#d6e8fb' : '#dedbd4');
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.strokeStyle = pressed || hot ? '#3c7fb1' : '#7a7670'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  font(g, 400, 15, F.ui); g.fillStyle = '#111'; g.textAlign = 'center'; g.fillText(label, x + w / 2, y + h / 2 + 5); g.textAlign = 'left';
}

function drawEditor(g, t, ctx) {
  const frozen = t >= ctx.timing.cues.stop_intro; // 5.6
  const tf = frozen ? ctx.timing.cues.stop_intro : t;
  // title bar
  const tb = g.createLinearGradient(0, 0, 0, 34);
  tb.addColorStop(0, frozen ? '#dfe6ee' : '#cfe0f5'); tb.addColorStop(1, frozen ? '#c9d2dc' : '#a9c4e8');
  g.fillStyle = tb; g.fillRect(0, 0, W, 34);
  font(g, 400, 16, F.ui); g.fillStyle = '#111';
  g.fillText(`MikuMikuSlop Ver.6.66 - [slop_chan.pmx]${frozen ? ' (応答なし)' : ''}`, 40, 23);
  g.fillStyle = '#ff5c8a'; g.fillRect(12, 9, 16, 16); g.fillStyle = '#fff'; font(g, 900, 12, F.ui); g.fillText('S', 16, 22);
  for (const [i, c] of [['—', 0], ['☐', 1], ['✕', 2]]) {
    const x = W - 138 + c * 46;
    g.fillStyle = c === 2 ? '#c94a3c' : 'rgba(255,255,255,0.4)'; g.fillRect(x, 2, 44, 28);
    font(g, 400, 15, F.ui); g.fillStyle = c === 2 ? '#fff' : '#111'; g.textAlign = 'center'; g.fillText(i, x + 22, 21); g.textAlign = 'left';
  }
  // menu
  g.fillStyle = '#f5f4f0'; g.fillRect(0, 34, W, 26);
  font(g, 400, 15, F.ui); g.fillStyle = '#111';
  ['ファイル(F)', '編集(E)', 'ビュー(V)', '背景(B)', '物理演算(P)', '表示(D)', 'ヘルプ(H)'].forEach((m, i) => g.fillText(m, 12 + i * 104, 53));
  // left: frame / bone timeline
  panel(g, 0, 60, 380, 880, 'フレーム操作');
  const frame = Math.floor(tf * 30);
  font(g, 400, 14, F.ui); g.fillStyle = '#111'; g.fillText('フレーム', 12, 112);
  g.fillStyle = '#fff'; g.fillRect(80, 96, 80, 22); g.strokeStyle = '#7a7670'; g.strokeRect(80.5, 96.5, 80, 22);
  g.fillStyle = '#111'; font(g, 400, 15, F.dot); g.fillText(String(frame).padStart(4, '0'), 96, 113);
  font(g, 400, 13, F.ui); g.fillText('/ 1992', 168, 113);
  const sel = Math.floor(tf * 2.5) % BONES.length;
  BONES.forEach((b, i) => {
    const y = 140 + i * 24;
    if (i === sel) { g.fillStyle = '#3c7fb1'; g.fillRect(4, y - 16, 120, 22); }
    font(g, 400, 14, F.ui); g.fillStyle = i === sel ? '#fff' : '#111'; g.fillText(b, 10, y);
    // keyframe row
    g.fillStyle = i % 2 ? '#f6f5f2' : '#fff'; g.fillRect(126, y - 16, 248, 22);
    for (let k = 0; k < 12; k++) {
      if (hash(i * 31 + k) > 0.55 || ctx.loading > 0.98) {
        const x = 132 + k * 20 - ((frame * 0.6) % 20);
        if (x < 128 || x > 368) continue;
        g.save(); g.translate(x, y - 5); g.rotate(Math.PI / 4); g.fillStyle = i === sel ? '#d84040' : '#6a6a6a'; g.fillRect(-4, -4, 8, 8); g.restore();
      }
    }
  });
  g.strokeStyle = '#d84040'; g.lineWidth = 2; g.beginPath(); g.moveTo(140.5, 124); g.lineTo(140.5, 500); g.stroke();
  // left lower: interpolation curve box
  panel(g, 6, 520, 368, 250, '補間曲線操作');
  g.strokeStyle = '#bbb'; g.strokeRect(40.5, 560.5, 180, 180);
  g.strokeStyle = '#d84040'; g.lineWidth = 2; g.beginPath(); g.moveTo(41, 740); g.bezierCurveTo(140, 740, 120, 561, 220, 561); g.stroke();
  for (const [x, y] of [[140, 740], [120, 561]]) { g.fillStyle = '#d84040'; g.fillRect(x - 5, y - 5, 10, 10); }
  font(g, 400, 13, F.ui); g.fillStyle = '#111';
  ['X軸', 'Y軸', 'Z軸', '回転', 'ブレインロット'].forEach((s, i) => { g.strokeRect(244.5, 566.5 + i * 32, 14, 14); if (i === 4 || i === 0) { g.fillStyle = '#3c7fb1'; g.fillRect(247, 569 + i * 32, 9, 9); g.fillStyle = '#111'; } g.fillText(s, 266, 579 + i * 32); });
  panel(g, 6, 780, 368, 154, 'ボーン操作');
  ['選択', '回転', '移動', '全て選択', '未登録選択', 'コピー', '貼り付け', '反転貼付'].forEach((s, i) => button(g, 16 + (i % 4) * 88, 818 + Math.floor(i / 4) * 44, 82, 34, s));
  // bottom: model / camera / play panels
  panel(g, 380, 940, 1540, 140, null);
  panel(g, 388, 946, 420, 126, 'モデル操作');
  g.fillStyle = '#fff'; g.fillRect(400, 984, 260, 26); g.strokeStyle = '#7a7670'; g.strokeRect(400.5, 984.5, 260, 26);
  font(g, 400, 15, F.ui); g.fillStyle = '#111'; g.fillText('スロップちゃん.pmx  ▼', 408, 1003);
  button(g, 670, 982, 60, 30, '読込'); button(g, 736, 982, 60, 30, '削除');
  button(g, 400, 1024, 90, 32, '表示'); button(g, 496, 1024, 90, 32, '影'); button(g, 592, 1024, 110, 32, '物理: ON', true);
  panel(g, 816, 946, 420, 126, 'カメラ・照明・アクセサリ');
  font(g, 400, 14, F.ui); g.fillStyle = '#111';
  ['視野角 30', '距離 -44.0', 'X 0.00  Y 10.0  Z 0.00', '照明 #FFFFFF'].forEach((s, i) => g.fillText(s, 830 + (i % 2) * 200, 1000 + Math.floor(i / 2) * 34));
  panel(g, 1244, 946, 670, 126, '再生');
  font(g, 400, 14, F.ui); g.fillStyle = '#111';
  g.fillText('モーション: brainrot_dance.vmd', 1258, 1000);
  g.fillText('音楽: スロッピファイ計画.wav', 1258, 1030);
  g.fillText('繰り返し □   フレーム合わせ ☑', 1258, 1060);
  const pressed = t >= ctx.timing.cues.stop_intro - BEAT && t < ctx.timing.cues.stop_intro - 0.15;
  const hot = t > 4.4;
  button(g, PLAY.x, PLAY.y, PLAY.w, PLAY.h, '▶ 再生', pressed || frozen, hot);
  // status bar + loading
  const ld = ctx.loading;
  g.fillStyle = '#f5f4f0'; g.fillRect(380, 900, 1540, 40);
  g.strokeStyle = '#b9b5ae'; g.strokeRect(380.5, 900.5, 1539, 39);
  font(g, 400, 15, F.ui); g.fillStyle = '#111';
  const msg = ld < 1 ? `モデル読み込み中… slop_chan.pmx  頂点 ${Math.floor(69420 * ld).toLocaleString()} / 69,420   材質 12   ボーン 37` : frozen ? '応答待ち…  (ブレインロットを計算中)' : 'モーション読込完了 brainrot_dance.vmd  ━  ▶ を押して再生';
  g.fillText(msg, 396, 926);
  g.fillStyle = '#fff'; g.fillRect(1500, 910, 400, 20); g.strokeStyle = '#7a7670'; g.strokeRect(1500.5, 910.5, 400, 20);
  const seg = Math.floor(clamp(ld) * 25);
  for (let i = 0; i < seg; i++) { g.fillStyle = '#3cb043'; g.fillRect(1503 + i * 16, 913, 13, 15); }
  // viewport label like MMD
  font(g, 400, 15, F.ui); g.fillStyle = '#4a4a4a';
  g.fillText('Model : スロップちゃん  (ver 0.69)', 400, 84);
  g.fillText(`${(30).toFixed(2)} fps   物理演算 有効   影 OFF`, 1600, 84);
  // bones overlay (blue circles, MMD style)
  if (ctx.bones) {
    g.lineWidth = 2;
    for (const [a, b] of ctx.boneLinks) {
      const A = ctx.bones[a], B = ctx.bones[b];
      if (!A || !B) continue;
      g.strokeStyle = 'rgba(40,90,255,0.75)'; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke();
    }
    ctx.bones.forEach((p, i) => {
      g.beginPath(); g.arc(p.x, p.y, i === 0 ? 9 : 6, 0, Math.PI * 2);
      g.strokeStyle = i === sel % ctx.bones.length ? '#e02020' : '#2858ff'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill();
    });
  }
  // cursor
  const path = [[1300, 620, 0], [1200, 560, 1.4], [1500, 700, 3.0], [PLAY.x + 80, PLAY.y + 26, 4.6]];
  let cx = path[0][0], cy = path[0][1];
  for (let i = 1; i < path.length; i++) {
    const [x0, y0, t0] = path[i - 1], [x1, y1, t1] = path[i];
    if (tf >= t0) { const k = inOutCubicLocal(unlerp(t0, t1, tf)); cx = lerp(x0, x1, k); cy = lerp(y0, y1, k); }
  }
  if (frozen) drawBusy(g, cx, cy, t); else drawArrow(g, cx, cy);
  if (frozen) {
    g.fillStyle = 'rgba(255,255,255,0.38)'; g.fillRect(0, 34, W, H - 34);
    // the "not responding" dialog
    const k = outBack(clamp((t - 5.75) / 0.25));
    if (k > 0) {
      g.save(); g.translate(W / 2, H / 2); g.scale(k, k);
      g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 30; g.fillRect(-330, -110, 660, 220); g.shadowBlur = 0;
      g.fillStyle = '#cfe0f5'; g.fillRect(-330, -110, 660, 34);
      font(g, 400, 16, F.ui); g.fillStyle = '#111'; g.fillText('MikuMikuSlop', -318, -87);
      font(g, 700, 21, F.ui); g.fillStyle = '#1c3d8c'; g.fillText('MikuMikuSlop は応答していません', -290, -30);
      font(g, 400, 16, F.ui); g.fillStyle = '#333'; g.fillText('ブレインロットの量が多すぎます。', -290, 4);
      button(g, -290, 40, 270, 42, 'プログラムを終了する'); button(g, 0, 40, 270, 42, '応答を待つ', false, true);
      g.restore();
    }
  }
}
const inOutCubicLocal = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function drawArrow(g, x, y) {
  g.save(); g.translate(x, y);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 30); g.lineTo(7, 23); g.lineTo(13, 36); g.lineTo(18, 34); g.lineTo(12, 21); g.lineTo(22, 21); g.closePath();
  g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.stroke(); g.restore();
}
function drawBusy(g, x, y, t) {
  drawArrow(g, x, y);
  g.save(); g.translate(x + 30, y + 34);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + hold(t, 12) * 8;
    g.fillStyle = `hsl(${i * 30},90%,55%)`; g.beginPath(); g.arc(Math.cos(a) * 10, Math.sin(a) * 10, 3, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

// ---------------- title ----------------
function drawTitle(g, t) {
  const t0 = at(5), u = t - t0;
  if (u < 0 || u > 3.0) return;
  const out = clamp((u - 2.6) / 0.4);
  g.save();
  g.globalAlpha = 1 - out;
  const word = 'スロッピファイ計画';
  font(g, 400, 150, F.big);
  g.textAlign = 'center';
  const chars = [...word];
  const widths = chars.map((c) => g.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = W / 2 - total / 2;
  chars.forEach((c, i) => {
    const k = outBack(clamp((u - i * 0.05) / 0.3), 2.2);
    const cx = x + widths[i] / 2;
    g.save(); g.translate(cx, 520); g.rotate((hash(i) - 0.5) * 0.16 + (1 - k) * 0.8); g.scale(k, k);
    strokeText(g, c, 6, 6, '#2a1630', '#2a1630', 28);
    strokeText(g, c, 0, 0, i < 7 ? '#ffffff' : '#ffd23f', '#ff3d7f', 22);
    g.restore();
    x += widths[i];
  });
  const k2 = outExpo(clamp((u - 0.5) / 0.5));
  g.globalAlpha = (1 - out) * k2;
  font(g, 400, 34, F.wide); g.letterSpacing = '18px';
  strokeText(g, 'SLOPIFY PROJECT', W / 2 + (1 - k2) * 200, 600, '#ffffff', '#2a1630', 8);
  g.letterSpacing = '0px';
  font(g, 800, 30, F.jp);
  strokeText(g, 'feat. スロップちゃん  ／  作詞・作曲・振付  /slopify', W / 2, 660, '#ffd23f', '#2a1630', 8);
  g.restore();
  g.textAlign = 'left';
}

// ---------------- karaoke ----------------
function drawLyrics(g, t, ctx) {
  const { timing } = ctx;
  const line = timing.lines.find((l) => t >= l.t0 - 0.35 && t < l.t1 + 0.05);
  if (!line) return;
  const li = timing.lines.indexOf(line);
  const evs = timing.lead.filter((e) => e.line === li);
  const loud = ctx.sec.name === 'chorus' || ctx.sec.name === 'final';
  const size = loud ? 96 : 72;
  font(g, 900, size, F.jp);
  const glyphs = evs.map((e) => ({ e, w: g.measureText(e.disp).width }));
  const total = glyphs.reduce((a, b) => a + b.w, 0);
  const inK = outExpo(clamp((t - (line.t0 - 0.35)) / 0.3));
  const outK = clamp((t - line.t1 + 0.1) / 0.15);
  const y = loud ? 930 : 950;
  let x = W / 2 - total / 2;
  g.save();
  g.globalAlpha = inK * (1 - outK);
  glyphs.forEach(({ e, w }, i) => {
    if (!e.disp) { x += w; return; }
    const sung = t >= e.t;
    const fill = sung ? clamp((t - e.t) / Math.max(0.08, e.dur * 0.6)) : 0;
    const pop = sung ? outBack(clamp((t - e.t) / 0.14), 3) : 0;
    const bounce = loud ? -18 * Math.sin(Math.PI * clamp((t - e.t) / 0.2)) * (sung ? 1 : 0) : 0;
    g.save();
    g.translate(x + w / 2, y + bounce + (1 - inK) * 40);
    const sc = 1 + 0.12 * pop * (1 - clamp((t - e.t) / 0.4));
    g.scale(sc, sc);
    g.textAlign = 'center';
    strokeText(g, e.disp, 0, 0, '#ffffff', '#2a1630', loud ? 18 : 14);
    if (fill > 0) {
      g.save();
      g.beginPath(); g.rect(-w / 2 - 4, -size, (w + 8) * fill, size * 1.4); g.clip();
      const gr = g.createLinearGradient(0, -size * 0.8, 0, size * 0.2);
      gr.addColorStop(0, '#fff35c'); gr.addColorStop(1, '#ff3d9a');
      strokeText(g, e.disp, 0, 0, gr, '#ffffff', loud ? 8 : 6);
      g.restore();
    }
    g.restore();
    x += w;
  });
  font(g, 700, loud ? 32 : 28, F.comic);
  g.textAlign = 'center';
  strokeText(g, line.gloss, W / 2, y + (loud ? 62 : 54), '#ffd23f', '#2a1630', 7);
  g.restore();
  g.textAlign = 'left';
}

// ---------------- staff credits (anime OP style) ----------------
const CREDITS = [
  [6, '原作', 'ORIGINAL WORK', ['icantcodefyi']],
  [9, '歌', 'VOCAL', ['スロップちゃん', '(Kyoko × WORLD vocoder)']],
  [13, '振付', 'CHOREOGRAPHY', ['slop.js']],
  [19, '美術', 'ART DIRECTION', ['12 cursed internet eras']],
  [22, '撮影', 'CAMERA', ['MikuMikuSlop Ver.6.66']],
  [33, '協力', 'SPECIAL THANKS', ['Comic Sans MS', 'the <marquee> tag']],
  [35, '制作', 'PRODUCTION', ['/slopify']],
];
function drawCredits(g, t) {
  for (const [bar, jp, en, names] of CREDITS) {
    const t0 = at(bar), t1 = t0 + 2 * BAR;
    if (t < t0 || t > t1) continue;
    const k = outExpo(clamp((t - t0) / 0.5)), o = 1 - clamp((t - t1 + 0.4) / 0.4);
    g.save(); g.globalAlpha = k * o;
    const x = 96 - (1 - k) * 30, y = 120;
    font(g, 800, 22, F.jp); strokeText(g, jp, x, y, '#ffffff', 'rgba(20,6,40,0.8)', 6);
    font(g, 400, 13, F.wide); g.letterSpacing = '5px';
    strokeText(g, en, x + g.measureText(jp).width * 0 + 4, y + 26, '#ffd23f', 'rgba(20,6,40,0.8)', 5); g.letterSpacing = '0px';
    names.forEach((n, i) => { font(g, 800, i ? 22 : 34, F.jp); strokeText(g, n, x, y + 72 + i * 34, '#ffffff', 'rgba(20,6,40,0.85)', 7); });
    g.restore();
  }
}

// ---------------- boxed words (TACTIC style) ----------------
const WORDS = [[5, 2, 'SLOP'], [13, 0, 'WAIT'], [17, 0, 'SLOPIFY'], [25, 0, 'ROLL CALL'], [31, 0, 'AGAIN'], [39, 0, 'THANK U']];
function drawBoxedWord(g, t) {
  for (const [bar, beat, word] of WORDS) {
    const t0 = at(bar, beat), t1 = t0 + BAR;
    if (t < t0 || t > t1) continue;
    const k = clamp((t - t0) / 0.25), o = 1 - clamp((t - t1 + 0.3) / 0.3);
    g.save(); g.globalAlpha = o;
    font(g, 400, 22, F.wide); g.letterSpacing = '14px';
    const tw = g.measureText(word).width;
    const x = W - 96 - tw - 30, y = 96;
    g.strokeStyle = '#ffffff'; g.lineWidth = 2;
    g.strokeRect(x - 16, y - 30, (tw + 32) * outExpo(k), 46);
    g.fillStyle = '#ffffff'; if (k > 0.3) g.fillText(word.slice(0, Math.ceil(word.length * clamp((k - 0.3) / 0.7))), x, y);
    g.letterSpacing = '0px';
    // crosshair marks
    for (const [cx, cy] of [[x - 26, y - 40], [x + tw + 16, y + 26]]) { g.beginPath(); g.moveTo(cx - 6, cy); g.lineTo(cx + 6, cy); g.moveTo(cx, cy - 6); g.lineTo(cx, cy + 6); g.stroke(); }
    g.restore();
  }
}

// ---------------- bridge: site roll call ----------------
function drawRollCall(g, t, ctx) {
  const { timing, images } = ctx;
  const t0 = timing.cues.bridge, half = BAR / 2;
  if (t < t0 || t >= timing.cues.final) return;
  const h = Math.floor((t - t0) / half);
  if (h > 11) return;
  const call = timing.calls[h];
  const u = t - (t0 + h * half);
  const s = h % 2 ? -1 : 1; // she is on the right when s = 1, so the card goes left
  const cardW = 840, cardH = 472;
  const cx = s > 0 ? 520 : W - 520;
  const k = outExpo(clamp(u / 0.22));
  const img = images[call.slug];
  g.save();
  g.translate(cx - s * (1 - k) * 900, 470);
  g.rotate(s * -0.05);
  // halftone backing
  g.fillStyle = PALETTES.bridge.b; g.fillRect(-cardW / 2 + 18, -cardH / 2 + 18, cardW, cardH);
  g.fillStyle = '#111'; g.fillRect(-cardW / 2 - 8, -cardH / 2 - 8, cardW + 16, cardH + 16);
  if (img) g.drawImage(img, -cardW / 2, -cardH / 2, cardW, cardH);
  // index + era
  g.fillStyle = PALETTES.bridge.a; g.fillRect(-cardW / 2 - 8, -cardH / 2 - 62, 360, 54);
  font(g, 400, 30, F.wide); g.fillStyle = '#111'; g.fillText(`#${String(h + 1).padStart(2, '0')}`, -cardW / 2 + 8, -cardH / 2 - 22);
  font(g, 800, 22, F.jp); g.fillText(ERA[call.slug], -cardW / 2 + 110, -cardH / 2 - 26);
  font(g, 400, 22, F.dot); strokeText(g, `slopified.vercel.app/${call.slug}`, -cardW / 2 + 6, cardH / 2 + 40, '#ffffff', '#111', 6);
  g.restore();
  // giant katakana shout
  const pk = outBack(clamp(u / 0.18), 2.5);
  g.save();
  g.translate(cx, 840);
  g.rotate(s * 0.06);
  g.scale(pk, pk);
  font(g, 400, 104, F.big); g.textAlign = 'center';
  strokeText(g, call.text, 8, 8, '#111', '#111', 26);
  strokeText(g, call.text, 0, 0, PALETTES.bridge.a, '#111', 20);
  g.restore();
  g.textAlign = 'left';
}

// ---------------- onomatopoeia on the big hits ----------------
function drawHits(g, t, ctx) {
  const hits = [[ctx.timing.cues.impact, 'ドーン！'], [ctx.timing.cues.chorus, 'ドーン！！'], [ctx.timing.cues.final, 'もう一回！']];
  for (const [t0, word] of hits) {
    const u = t - t0;
    if (u < 0 || u > 0.9) continue;
    const k = outBack(clamp(u / 0.15), 3), o = 1 - clamp((u - 0.6) / 0.3);
    g.save(); g.globalAlpha = o;
    g.translate(W * 0.22, 300); g.rotate(-0.18); g.scale(k * 1.1, k * 1.1);
    font(g, 400, 120, F.big); g.textAlign = 'center';
    strokeText(g, word, 0, 0, '#fff35c', '#2a1630', 26);
    g.restore();
  }
  // speed lines on impacts
  for (const t0 of [ctx.timing.cues.impact, ctx.timing.cues.chorus, ctx.timing.cues.final]) {
    const u = t - t0;
    if (u < 0 || u > 0.5) continue;
    g.save(); g.globalAlpha = 1 - u / 0.5;
    g.strokeStyle = '#ffffff';
    for (let i = 0; i < 90; i++) {
      const a = hash(i * 3.1 + Math.floor(u * 24)) * Math.PI * 2, r0 = 380 + hash(i) * 200;
      g.lineWidth = 1 + hash(i * 7) * 5;
      g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); g.lineTo(W / 2 + Math.cos(a) * 1400, H / 2 + Math.sin(a) * 1400); g.stroke();
    }
    g.restore();
  }
}

// ---------------- pre-chorus break: "さあ" ----------------
function drawBreak(g, t, ctx) {
  const t0 = ctx.timing.cues.break, t1 = ctx.timing.cues.chorus;
  if (t < t0 || t >= t1) return;
  const k = (t - t0) / (t1 - t0);
  g.save();
  g.fillStyle = `rgba(10,2,24,${0.35 + 0.4 * k})`; g.fillRect(0, 0, W, H);
  if (t > at(16, 3)) {
    const pk = outBack(clamp((t - at(16, 3)) / 0.2), 2);
    g.translate(W / 2, H / 2 - 40); g.scale(pk * (1 + k * 0.4), pk * (1 + k * 0.4));
    font(g, 400, 220, F.big); g.textAlign = 'center';
    strokeText(g, 'さあ', 0, 70, '#ffffff', '#ff3d9a', 24);
  }
  g.restore();
  g.textAlign = 'left';
}

// ---------------- outro / end card ----------------
function drawOutro(g, t, ctx) {
  const t0 = ctx.timing.cues.outro;
  if (t < t0) return;
  const u = t - t0;
  const k = outExpo(clamp(u / 0.6));
  g.save();
  g.globalAlpha = k;
  // left-aligned end card
  const x = 120;
  font(g, 400, 150, F.big);
  strokeText(g, '/slopify', x + 8, 380 + 8, '#2a1630', '#2a1630', 26);
  strokeText(g, '/slopify', x, 380, '#ffffff', '#ff3d7f', 20);
  font(g, 900, 40, F.jp); strokeText(g, 'スロッピファイ計画', x + 6, 450, '#ffd23f', '#2a1630', 9);
  const rows = [['GitHub', 'github.com/icantcodefyi/slopify'], ['LIVE', 'slopified.vercel.app'], ['slopped by', '@icantcodefyi']];
  rows.forEach(([a, b], i) => {
    const kk = outExpo(clamp((u - 0.4 - i * BEAT) / 0.4));
    g.globalAlpha = k * kk;
    const y = 540 + i * 74;
    font(g, 400, 20, F.wide); g.letterSpacing = '6px';
    g.fillStyle = '#2a1630'; g.fillRect(x, y - 30, 220, 44);
    g.fillStyle = '#ffd23f'; g.fillText(a.toUpperCase(), x + 14, y);
    g.letterSpacing = '0px';
    font(g, 800, 40, F.jp); strokeText(g, b, x + 244 - (1 - kk) * 40, y + 4, '#ffffff', '#2a1630', 9);
  });
  g.restore();
  // おわり + the motion ends: back to T-pose, MMD status bar reappears
  if (t > ctx.tposeAgain - 0.6) {
    const kk = outBack(clamp((t - ctx.tposeAgain + 0.6) / 0.25), 2);
    g.save(); g.translate(W - 300, 860); g.rotate(0.08); g.scale(kk, kk);
    font(g, 400, 110, F.big); g.textAlign = 'center';
    strokeText(g, 'おわり', 0, 0, '#ffffff', '#ff3d7f', 20);
    g.restore();
  }
  if (t > ctx.tposeAgain) {
    g.fillStyle = '#f5f4f0'; g.fillRect(0, H - 40, W, 40);
    g.strokeStyle = '#b9b5ae'; g.strokeRect(0.5, H - 39.5, W - 1, 39);
    font(g, 400, 16, F.ui); g.fillStyle = '#111';
    g.fillText('MikuMikuSlop ─ モーション再生終了 (frame 1992/1992)   ■ 停止     ※ モデルは初期姿勢に戻りました', 20, H - 14);
  }
  g.textAlign = 'left';
}

// ---------------- frame chrome ----------------
function drawChrome(g, t, ctx) {
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,0,25,0.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  // corner registration marks + timecode (P1PE-ish HUD)
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.5;
  for (const [x, y, sx, sy] of [[40, 40, 1, 1], [W - 40, 40, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]]) {
    g.beginPath(); g.moveTo(x, y + sy * 24); g.lineTo(x, y); g.lineTo(x + sx * 24, y); g.stroke();
  }
  font(g, 400, 15, F.dot); g.fillStyle = 'rgba(255,255,255,0.7)';
  const bar = Math.floor(t / BAR) + 1, beat = Math.floor((t % BAR) / BEAT) + 1;
  g.fillText(`BAR ${String(bar).padStart(2, '0')}.${beat}   ${ctx.sec.name.toUpperCase()}   ${t.toFixed(2)}s`, 64, H - 52);
  g.textAlign = 'right'; g.fillText('slopified.vercel.app/mv', W - 64, H - 52); g.textAlign = 'left';
}

// ---------------- entry ----------------
export function drawOverlay(g, t, ctx) {
  g.clearRect(0, 0, W, H);
  if (t < at(5)) {
    drawEditor(g, t, ctx);
    // impact flash at the end of the intro
    return;
  }
  drawChrome(g, t, ctx);
  drawRollCall(g, t, ctx);
  drawLyrics(g, t, ctx);
  drawCredits(g, t);
  drawBoxedWord(g, t);
  drawBreak(g, t, ctx);
  drawTitle(g, t);
  drawHits(g, t, ctx);
  drawOutro(g, t, ctx);
  // white flash on the impact, colour flash on the drops
  for (const [t0, c, len] of [[at(5), '255,255,255', 0.35], [at(17), '255,240,120', 0.3], [at(31), '255,255,255', 0.3]]) {
    const u = t - t0;
    if (u >= 0 && u < len) { g.fillStyle = `rgba(${c},${Math.pow(1 - u / len, 2) * 0.9})`; g.fillRect(0, 0, W, H); }
  }
}
