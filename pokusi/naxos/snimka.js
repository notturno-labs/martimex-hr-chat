// Slika pokusa Naxos u zadanom trenutku (Playwright, Chromium sa SwiftShaderom; nikad "playwright install")
// upotreba (iz mape pokusi/naxos/):
//   NODE_PATH=$(npm root -g) node snimka.js "<parametri stranice>" izlaz.png [t=9] [w=460] [h=920] [dpr=2]
//   npr. node snimka.js "samo=limun&zoom=2.5&kut=30" limun.png t=9
//   parametri stranice: samo=ime[,ime] (samo ti predmeti, u sredini), zoom=2.5, kut=35 (okret u °),
//   nagib=19 (°), stol=1 (uz samo: i stol s pozadinom); prazno = cijeli prizor
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [upit, izlaz, ...ostalo] = process.argv.slice(2);
  const A = Object.fromEntries(ostalo.map(a => a.split('=')));
  const t = +(A.t || 9), w = +(A.w || 460), h = +(A.h || 920), dpr = +(A.dpr || 2), fps = 30;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('pageerror', e.message));
  p.on('console', m => { const s = m.text(); if (!/GroupMarker|GPU stall/.test(s)) console.log('[' + m.type() + ']', s); });
  // vrijeme animacije teče samo kad ga pomakne __korak (slika je u točno zadanom trenutku)
  await p.addInitScript(() => {
    let id = 0, vt = null; const cekaju = new Map();
    window.requestAnimationFrame = function (cb) { cekaju.set(++id, cb); return id; };
    window.cancelAnimationFrame = function (i) { cekaju.delete(i); };
    window.__korak = function (dt) { if (vt === null) vt = performance.now(); vt += dt; const pozivi = Array.from(cekaju.values()); cekaju.clear(); pozivi.forEach(cb => cb(vt)); };
  });
  await p.goto('file://' + path.join(__dirname, 'naxos.html') + (upit ? '?' + upit : ''));
  await p.waitForFunction(() => window.__mxPokus && window.__mxPokus.naxos, null, { timeout: 300000, polling: 200 });
  for (let i = 0, n = Math.round(t * fps); i <= n; i++) await p.evaluate(d => window.__korak(d), i === 0 ? 0 : 1000 / fps);
  fs.mkdirSync(path.dirname(path.resolve(izlaz)), { recursive: true });
  fs.writeFileSync(izlaz, await p.screenshot({ type: 'png' }));
  console.log('slika', izlaz);
  await b.close();
})();
