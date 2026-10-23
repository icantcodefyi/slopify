// Shared helpers: a static server for mv/web and a headless Chromium page at 1920×1080.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.css': 'text/css' };

export function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
  return o;
}

export function serve() {
  return new Promise((res) => {
    const server = http.createServer((req, rsp) => {
      const p = path.join(WEB, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
      if (!f.startsWith(WEB) || !fs.existsSync(f)) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    });
    server.listen(0, () => res({ url: `http://localhost:${server.address().port}/`, close: () => server.close() }));
  });
}

function playwright() {
  for (const p of [process.env.PLAYWRIGHT_PATH, 'playwright', '/tmp/mscheck/node_modules/playwright']) {
    if (!p) continue;
    try { return require(p); } catch {}
  }
  throw new Error('playwright not found: npm i -D playwright (or set PLAYWRIGHT_PATH)');
}

export async function openPage({ w = 1920, h = 1080 } = {}) {
  const { chromium } = playwright();
  const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('console', m.text()));
  const server = await serve();
  await page.goto(`${server.url}?render=1&scale=${w / 1920}`);
  const duration = await page.evaluate(() => window.__mv.ready);
  return { browser, page, server, duration, close: async () => { await browser.close(); server.close(); } };
}
