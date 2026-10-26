// Regenerates icons/*.png from logo.js. Needs Playwright (Chromium) installed:  node tools/make-icons.mjs
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoJs = readFileSync(join(root, 'logo.js'), 'utf8');
const SIZES = [
  ['apple-touch-icon.png', 180, 0.62],
  ['icon-192.png', 192, 0.64],
  ['icon-512.png', 512, 0.64],
  ['icon-maskable-512.png', 512, 0.50]
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><html><body></body></html>');
await page.addScriptTag({ content: logoJs });
mkdirSync(join(root, 'icons'), { recursive: true });
for (const [name, size, scale] of SIZES) {
  const dataUrl = await page.evaluate(([s, sc]) => CheckLogo.icon(s, sc).toDataURL('image/png'), [size, scale]);
  writeFileSync(join(root, 'icons', name), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('wrote icons/' + name);
}
await browser.close();
