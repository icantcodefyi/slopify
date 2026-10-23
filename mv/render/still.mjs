// Stills for checking shots: node render/still.mjs --t 7.2,26,40 [--out ../out/stills] [--w 1280]
import fs from 'node:fs';
import path from 'node:path';
import { openPage, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const times = String(args.t ?? '3,6.6,10,20,26,40,50,62,65.5').split(',').map(Number);
const out = path.resolve(args.out ?? path.join(import.meta.dirname, '../out/stills'));
const w = Number(args.w ?? 1280), h = Math.round(w * 9 / 16);
fs.mkdirSync(out, { recursive: true });
const { page, close } = await openPage({ w, h });
for (const t of times) {
  const t0 = Date.now();
  await page.evaluate((t) => window.__mv.renderAt(t), t);
  const f = path.join(out, `t${t.toFixed(2).padStart(6, '0')}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 88 });
  console.log(f, `${Date.now() - t0} ms`);
}
await close();
