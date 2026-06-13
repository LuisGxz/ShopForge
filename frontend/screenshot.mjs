import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH);

const root = 'dist/frontend/browser';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  const url = (req.url ?? '/').split('?')[0];
  let file = join(root, url);
  try {
    let data = await readFile(file).catch(() => null);
    if (!data) { file = join(root, 'index.html'); data = await readFile(file); }  // SPA fallback
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('not found'); }
});

await new Promise(r => server.listen(4321, r));
const browser = await chromium.launch();
const widths = [[1280, 900, 'desktop'], [768, 1024, 'tablet'], [390, 844, 'mobile']];
const pages = [['/', 'home'], ['/auth/login', 'login']];
const errors = [];

for (const [path, pname] of pages) {
  for (const [w, h, label] of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('console', m => { if (m.type() === 'error') errors.push(`[${pname}/${label}] ${m.text()}`); });
    page.on('pageerror', e => errors.push(`[${pname}/${label}] ${e.message}`));
    await page.goto(`http://localhost:4321${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `../docs/screenshots/f5-${pname}-${label}.png`, fullPage: path === '/' });
    await page.close();
  }
}

await browser.close();
server.close();
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'OK — no console errors');
