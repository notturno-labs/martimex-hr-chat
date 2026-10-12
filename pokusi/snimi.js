// Snima početni ekran u video, sličicu po sličicu (vrijeme animacije teče
// točno 1/fps sekunde po sličici, pa je video gladak i kad je računalo sporo).
//
// upotreba (iz mape pokusi/):
//   NODE_PATH=$(npm root -g) node snimi.js "skripta=saturn/pocetna-chata-saturn.js" izlaz.mp4 \
//     [od=0] [do=24] [fps=30] [w=460] [h=920] [dpr=2] [cekaj=marke,pen,prsten] [slika=12.5,18] [stranica=proba.html]
//   - od, do: dio animacije u sekundama (od otvaranja chata)
//   - cekaj: što mora biti pripremljeno prije nego vrijeme krene (window.__mxPokus)
//   - slika: umjesto videa samo slike u tim trenucima (izlaz je tada mapa)
//   - stranica: koja se stranica snima (npr. kap/kap.html; parametri su tada za nju)
// Treba ffmpeg i Playwright (Chromium sa SwiftShaderom; nikad "playwright install").
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const [upit, izlaz, ...ostalo] = process.argv.slice(2);
  const A = Object.fromEntries(ostalo.map(a => a.split('=')));
  const od = +(A.od || 0), do_ = +(A.do || 24), fps = +(A.fps || 30);
  const w = +(A.w || 460), h = +(A.h || 920), dpr = +(A.dpr || 2);
  const cekaj = (A.cekaj || '').split(',').filter(Boolean);
  const slike = (A.slika || '').split(',').filter(Boolean).map(Number);

  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('pageerror', e.message));
  p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('[' + m.type() + ']', m.text()); });

  // requestAnimationFrame i CSS animacije teku samo kad ih pomakne __korak
  await p.addInitScript(() => {
    let id = 0, vt = null;
    const cekaju = new Map();
    window.requestAnimationFrame = function (cb) { cekaju.set(++id, cb); return id; };
    window.cancelAnimationFrame = function (i) { cekaju.delete(i); };
    window.__korak = function (dt) {
      if (vt === null) vt = performance.now();
      vt += dt;
      const sve = new Set(document.getAnimations ? document.getAnimations() : []);
      const host = document.getElementById('voiceflow-chat');
      if (host && host.shadowRoot && host.shadowRoot.getAnimations) host.shadowRoot.getAnimations().forEach(a => sve.add(a));
      sve.forEach(a => {
        if (!a.__v) { a.__v = 1; a.pause(); }
        a.currentTime = (a.currentTime || 0) + dt;
      });
      const pozivi = Array.from(cekaju.values());
      cekaju.clear();
      pozivi.forEach(cb => cb(vt));
    };
  });

  await p.goto('file://' + path.join(__dirname, A.stranica || 'proba.html') + '?' + upit);
  const t0 = Date.now();
  await p.waitForFunction(c => {
    const host = document.getElementById('voiceflow-chat');
    if (host) {
      const k = host.shadowRoot && host.shadowRoot.querySelector('.mx-p');
      if (!k || !k.classList.contains('mx-p-spremno')) return false;
    }
    const s = window.__mxPokus || {};
    return c.every(x => s[x]);
  }, cekaj, { timeout: 600000, polling: 250 });
  console.log('pripremljeno za', ((Date.now() - t0) / 1000).toFixed(1), 's');

  const dt = 1000 / fps;
  const ukupno = Math.round(do_ * fps);
  let ff = null;
  if (!slike.length) {
    ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '15', '-preset', 'slow', '-tune', 'grain', '-movflags', '+faststart', izlaz],
      { stdio: ['pipe', 'inherit', 'inherit'] });
  } else fs.mkdirSync(izlaz, { recursive: true });
  const kraj = new Promise(r => ff ? ff.on('close', r) : r());

  let sljedecaSlika = 0;
  const pocetak = Date.now();
  for (let i = 0; i <= ukupno; i++) {
    await p.evaluate(d => window.__korak(d), i === 0 ? 0 : dt);
    const t = i / fps;
    if (slike.length) {
      while (sljedecaSlika < slike.length && slike[sljedecaSlika] <= t + 1e-6) {
        const ime = path.join(izlaz, 't' + slike[sljedecaSlika].toFixed(2).replace('.', '_') + '.png');
        fs.writeFileSync(ime, await p.screenshot({ type: 'png' }));
        console.log('slika', ime);
        sljedecaSlika++;
      }
      if (sljedecaSlika >= slike.length) break;
      continue;
    }
    if (t + 1e-6 < od) continue;
    const png = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (fps * 2) === 0) console.log('t =', t.toFixed(1), 's,', ((Date.now() - pocetak) / 1000).toFixed(0), 's rada');
  }
  if (ff) ff.stdin.end();
  await kraj;
  await b.close();
  console.log('gotovo:', izlaz);
})();
