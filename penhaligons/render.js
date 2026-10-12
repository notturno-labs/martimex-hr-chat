// upotreba: node render.js "<parametri za preview.html>" izlaz.png
// npr. node render.js "ids=lord-george&kut=0,-35,90,180&w=1400&h=700" out/lord-george.png
// (NODE_PATH=$(npm root -g) node render.js ...)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [q, izlaz] = process.argv.slice(2);
  const P = new URLSearchParams(q);
  const w = +(P.get('w') || 460), h = +(P.get('h') || 700);
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto('file://' + path.join(__dirname, 'preview.html') + '?' + q);
  await p.waitForFunction(() => window.__gotovo, null, { timeout: 300000 });
  const r = await p.evaluate(() => ({ greska: window.__greska || null, info: window.__info || null }));
  if (r.greska) console.log('GREŠKA', r.greska); else console.log(JSON.stringify(r.info));
  await (await p.$('#c')).screenshot({ path: izlaz });
  await b.close();
})();
