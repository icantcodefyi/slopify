// Full render: node render/render.mjs [--fps 60] [--w 1920] [--from 0 --to 66.4] [--out ../out/slopify-mv.mp4]
// Renders every frame deterministically in headless Chromium, encodes with ffmpeg and muxes
// music/out/slopify-mv.wav (or web/assets/slopify-mv.mp3) if it exists.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { openPage, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const here = import.meta.dirname;
const fps = Number(args.fps ?? 60), w = Number(args.w ?? 1920), h = Math.round(w * 9 / 16);
const out = path.resolve(args.out ?? path.join(here, '../out/slopify-mv.mp4'));
fs.mkdirSync(path.dirname(out), { recursive: true });
const audio = [path.join(here, '../music/out/slopify-mv.wav'), path.join(here, '../web/assets/slopify-mv.mp3')].find((f) => fs.existsSync(f));

const { page, duration, close } = await openPage({ w, h });
const from = Number(args.from ?? 0), to = Math.min(Number(args.to ?? duration), duration);
const n = Math.round((to - from) * fps);
const silent = out.replace(/\.mp4$/, '.video.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'animation', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  const t = from + i / fps;
  await page.evaluate((t) => window.__mv.renderAt(t), t);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 60 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${i}/${n}  ${(i / el || 0).toFixed(1)} fps  eta ${(((n - i) / (i / el || 1)) / 60).toFixed(1)} min`); }
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await close();
const mux = audio
  ? ['-i', silent, '-ss', String(from), '-t', String(to - from), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out]
  : ['-i', silent, '-c', 'copy', '-movflags', '+faststart', out];
await new Promise((res) => spawn('ffmpeg', ['-y', '-loglevel', 'error', ...mux], { stdio: 'inherit' }).on('close', res));
fs.rmSync(silent);
console.log(`wrote ${out} (${n} frames, ${audio ? 'with ' + path.basename(audio) : 'no audio'}) in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
