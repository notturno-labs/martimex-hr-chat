// Izrada 3D podataka za pokus "stvarno" (pravi 3D umjesto točkica).
// Pokretanje (iz ove mape): npm install && npm run modeli
// Izlaz: ../modeli.js (window.MX_MODELI_3D), koji pocetna-chata-stvarno.js
// učita pri pokretanju. Sve se računa iz postojećih izvora u repozitoriju:
//  - flakon: profil, pločica i znak X iz pocetna-chata.js
//  - Penhaligon's: tijelo, ovratnik i etiketa iz penhaligons/shared.js; zlatne
//    glave (ovratnik + glava, SDF iz penhaligons/glave/*.js) pretvore se u
//    mrežu trokuta (surface nets na finoj mreži, točke spuštene na plohu),
//    mreža se pojednostavi (meshoptimizer), a normale su gradijent SDF-a.
//    Okret glave (PEN_GLAVA iz pocetna-chata.js) upisan je u mrežu
//  - natpis MARTIMEX: obrisi slova iz Cormorant Garamonda (fonts/, debljina
//    700, kao u animaciji), složeni kao u animaciji (razmak 0,14 em,
//    podrezivanje parova), širina 2,25; ostaju obrisi, a 3D slova se iz njih
//    izvuku u pregledniku
import fs from 'fs';
import path from 'path';
import os from 'os';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import opentype from 'opentype.js';
import { MeshoptSimplifier } from 'meshoptimizer';

const OVDJE = path.dirname(fileURLToPath(import.meta.url));
const KORIJEN = path.resolve(OVDJE, '../../..');
const citaj = function (f) { return fs.readFileSync(path.join(KORIJEN, f), 'utf8'); };
const IZVOR = citaj('pocetna-chata.js');

function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function konstanta(ime) {
  const m = IZVOR.match(new RegExp('const ' + ime + ' = (\\[[^;]*?\\]);'));
  if (!m) throw new Error('nema ' + ime);
  return JSON.parse(m[1].replace(/\/\/[^\n]*/g, '').replace(/'/g, '"'));
}

// ── 1. Flakon: dio pocetna-chata.js od OMJER do kraja funkcije flakon()
function podaciFlakona() {
  const od = IZVOR.indexOf('    const OMJER = 2.3;');
  const kraj = IZVOR.indexOf('PRESJECI = {};                               // zapamćeni presjeci više ne trebaju');
  const doK = IZVOR.indexOf('\n    }\n', kraj) + 7;
  const kod = IZVOR.slice(od, doK) + `
    ({ FLAKON, FLAKON_ZLATO, FLAKON_RUB, FLAKON_VRH, FLAKON_K, PLOHA, PLOCICA_VRH, PLOCICA_DNO,
       ZNAK_VRH, ZNAK_DNO, ZNAK_POLA, ZNAK_X, DNO_BOCICE, VRH_BOCICE });`;
  return vm.runInNewContext(kod, { sat: sat, lerp: lerp, Math: Math });
}

// ── 2. Penhaligon's: modeli iz penhaligons/
const PEN_IDS = ['lady-blanche', 'mr-sam', 'lord-george', 'duchess-rose', 'changing-constance'];
function ucitajPen() {
  const ctx = { Math: Math, console: console };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(citaj('penhaligons/shared.js'), ctx);
  PEN_IDS.forEach(function (id) { vm.runInContext(citaj('penhaligons/glave/' + id + '.js'), ctx); });
  return ctx.PEN;
}

// Surface nets: ploha f = 0 na mreži koraka h (f se računa samo uz plohu:
// gruba mreža G × G × G finih ćelija, fino samo gdje je ploha blizu)
function surfaceNets(f, b, h) {
  const nx = Math.ceil((b.x1 - b.x0) / h), ny = Math.ceil((b.y1 - b.y0) / h), nz = Math.ceil((b.z1 - b.z0) / h);
  const NY = ny + 1, NZ = nz + 1;
  const vr = new Float32Array((nx + 1) * NY * NZ).fill(NaN);
  const V = function (i, j, k) {
    const q = (i * NY + j) * NZ + k;
    let w = vr[q];
    if (w !== w) { w = f(b.x0 + i * h, b.y0 + j * h, b.z0 + k * h); vr[q] = w; }
    return w;
  };
  const G = 4, blizu = G * h * 1.9;
  const kandidat = new Uint8Array(nx * ny * nz);
  for (let I = 0; I * G < nx; I++) for (let J = 0; J * G < ny; J++) for (let K = 0; K * G < nz; K++) {
    const i1 = Math.min(nx, (I + 1) * G), j1 = Math.min(ny, (J + 1) * G), k1 = Math.min(nz, (K + 1) * G);
    const c = [V(I * G, J * G, K * G), V(i1, J * G, K * G), V(I * G, j1, K * G), V(i1, j1, K * G),
      V(I * G, J * G, k1), V(i1, J * G, k1), V(I * G, j1, k1), V(i1, j1, k1)];
    const min = Math.min.apply(null, c.map(Math.abs)), unutra = c.filter(function (x) { return x < 0; }).length;
    if (min > blizu && (unutra === 0 || unutra === 8)) continue;
    // malo šire (susjedne fine ćelije), da se ne izgubi ploha uz rub grube ćelije
    for (let i = Math.max(0, I * G - 1); i < Math.min(nx, i1 + 1); i++)
      for (let j = Math.max(0, J * G - 1); j < Math.min(ny, j1 + 1); j++)
        for (let k = Math.max(0, K * G - 1); k < Math.min(nz, k1 + 1); k++) kandidat[(i * ny + j) * nz + k] = 1;
  }
  const vrhCelije = new Int32Array(nx * ny * nz).fill(-1), poz = [];
  const RUBOVI = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const KUT = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const e = h * 0.25;
  function grad(x, y, z) { return [f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)].map(function (g) { return g / (2 * e); }); }
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    const c = (i * ny + j) * nz + k;
    if (!kandidat[c]) continue;
    const w = KUT.map(function (o) { return V(i + o[0], j + o[1], k + o[2]); });
    const u = w.filter(function (x) { return x < 0; }).length;
    if (u === 0 || u === 8) continue;
    let sx = 0, sy = 0, sz = 0, m = 0;
    RUBOVI.forEach(function (r) {
      const a = w[r[0]], bb = w[r[1]];
      if ((a < 0) === (bb < 0)) return;
      const t = a / (a - bb), A = KUT[r[0]], B = KUT[r[1]];
      sx += A[0] + (B[0] - A[0]) * t; sy += A[1] + (B[1] - A[1]) * t; sz += A[2] + (B[2] - A[2]) * t; m++;
    });
    let x = b.x0 + (i + sx / m) * h, y = b.y0 + (j + sy / m) * h, z = b.z0 + (k + sz / m) * h;
    for (let it = 0; it < 3; it++) {                       // spusti točku na plohu
      const d = f(x, y, z), g = grad(x, y, z), g2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
      if (!(g2 > 1e-9) || Math.abs(d) > 2 * h) break;
      x -= d * g[0] / g2; y -= d * g[1] / g2; z -= d * g[2] / g2;
    }
    vrhCelije[c] = poz.length / 3;
    poz.push(x, y, z);
  }
  const tro = [];
  function cel(i, j, k) { return i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz ? -1 : vrhCelije[(i * ny + j) * nz + k]; }
  function cetverokut(a, bb, c, d, obrni) {
    if (a < 0 || bb < 0 || c < 0 || d < 0) return;
    if (obrni) { const t = bb; bb = d; d = t; }
    // kraća dijagonala
    const P = function (q) { return [poz[3 * q], poz[3 * q + 1], poz[3 * q + 2]]; };
    const d1 = Math.hypot.apply(null, P(a).map(function (v, q) { return v - P(c)[q]; })), d2 = Math.hypot.apply(null, P(bb).map(function (v, q) { return v - P(d)[q]; }));
    if (d1 <= d2) tro.push(a, bb, c, a, c, d); else tro.push(a, bb, d, bb, c, d);
  }
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    if (!kandidat[(i * ny + j) * nz + k]) continue;
    const a = V(i, j, k);
    if (j > 0 && k > 0) { const bb = V(i + 1, j, k); if ((a < 0) !== (bb < 0)) cetverokut(cel(i, j - 1, k - 1), cel(i, j, k - 1), cel(i, j, k), cel(i, j - 1, k), !(a < 0)); }
    if (i > 0 && k > 0) { const bb = V(i, j + 1, k); if ((a < 0) !== (bb < 0)) cetverokut(cel(i - 1, j, k - 1), cel(i - 1, j, k), cel(i, j, k), cel(i, j, k - 1), !(a < 0)); }
    if (i > 0 && j > 0) { const bb = V(i, j, k + 1); if ((a < 0) !== (bb < 0)) cetverokut(cel(i - 1, j - 1, k), cel(i, j - 1, k), cel(i, j, k), cel(i - 1, j, k), !(a < 0)); }
  }
  return { poz: new Float32Array(poz), tro: new Uint32Array(tro), grad: grad };
}

function pojednostavi(m, trokuta) {
  const [ind] = MeshoptSimplifier.simplify(m.tro, m.poz, 3, Math.min(m.tro.length, trokuta * 3), 0.01, []);
  // samo korištene točke
  const nova = new Int32Array(m.poz.length / 3).fill(-1), poz = [];
  const tro = new Uint32Array(ind.length);
  for (let q = 0; q < ind.length; q++) {
    const v = ind[q];
    if (nova[v] < 0) { nova[v] = poz.length / 3; poz.push(m.poz[3 * v], m.poz[3 * v + 1], m.poz[3 * v + 2]); }
    tro[q] = nova[v];
  }
  return { poz: new Float32Array(poz), tro: tro };
}

// zapis mreže: točke Int16 u okviru, normale Int8, trokuti Uint16
const DIJELOVI = [];
let POMAK = 0;
function dodaj(tip, polje) {
  while (POMAK % 4) { DIJELOVI.push(Buffer.alloc(1)); POMAK++; }
  const b = Buffer.from(polje.buffer, polje.byteOffset, polje.byteLength);
  DIJELOVI.push(b);
  const o = POMAK;
  POMAK += b.length;
  return { od: o, duljina: polje.length, tip: tip };
}
function zapisiMrezu(poz, nor, tro) {
  const n = poz.length / 3, min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) { min[a] = Math.min(min[a], poz[3 * i + a]); max[a] = Math.max(max[a], poz[3 * i + a]); }
  const qp = new Int16Array(n * 3), qn = new Int8Array(n * 4);
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) {
    qp[3 * i + a] = Math.round((poz[3 * i + a] - min[a]) / Math.max(1e-6, max[a] - min[a]) * 65535) - 32768;
    qn[4 * i + a] = Math.round(nor[3 * i + a] * 127);
  }
  if (n > 65535) throw new Error('previše točaka');
  return { min: min, max: max, poz: dodaj('i16', qp), nor: dodaj('i8', qn), tro: dodaj('u16', Uint16Array.from(tro)) };
}

function glave(PEN) {
  const PEN_GLAVA = konstanta('PEN_GLAVA'), O = PEN.OVRATNIK, S = PEN.sdf, out = {};
  PEN_IDS.forEach(function (id, b) {
    const g = PEN.glave[id], ok = g.okvir, t0 = Date.now();
    const f = function (x, y, z) { return Math.min(S.valjak([x, y, z], [0, 0, 0], O.r, O.y0, O.y1, O.rub), g.sdf(x, y, z)); };
    const okv = { x0: -ok.x - 4, x1: ok.x + 4, y0: O.y0 - 4, y1: ok.yMax + 4, z0: -ok.z - 4, z1: ok.z + 4 };
    const m = surfaceNets(f, okv, 1.25);
    const p = pojednostavi(m, 22000);
    const n = p.poz.length / 3, nor = new Float32Array(n * 3), poz = new Float32Array(n * 3);
    // normale iz SDF-a; okret glave (iznad ovratnika, postupno od 338 do 352 px), kao u animaciji
    const kut = PEN_GLAVA[b];
    for (let i = 0; i < n; i++) {
      const x = p.poz[3 * i], y = p.poz[3 * i + 1], z = p.poz[3 * i + 2];
      const gr = m.grad(x, y, z), l = Math.hypot(gr[0], gr[1], gr[2]) || 1;
      const u = sat((y - 338) / 14), k = kut * u * u * (3 - 2 * u), c = Math.cos(k), s = Math.sin(k);
      poz[3 * i] = c * x - s * z; poz[3 * i + 1] = y; poz[3 * i + 2] = s * x + c * z;
      nor[3 * i] = (c * gr[0] - s * gr[2]) / l; nor[3 * i + 1] = gr[1] / l; nor[3 * i + 2] = (s * gr[0] + c * gr[2]) / l;
    }
    out[id] = zapisiMrezu(poz, nor, p.tro);
    console.log(id, 'surface nets', m.tro.length / 3, 'trokuta →', p.tro.length / 3, '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  });
  return out;
}

// ── 3. Natpis MARTIMEX: obrisi slova
async function natpis() {
  const natpis = (IZVOR.match(/natpis: '([^']*)'/) || [0, 'MARTIMEX'])[1];
  const RAZMAK = 0.14, SIRINA = 2.25;
  const tmp = path.join(os.tmpdir(), 'mx-cormorant-700.ttf');
  execFileSync('python3', ['-c', [
    'from fontTools.ttLib import TTFont',
    'from fontTools.varLib import instancer',
    'f = TTFont("' + path.join(KORIJEN, 'fonts/cormorant-garamond-latin.woff2') + '")',
    'i = instancer.instantiateVariableFont(f, {"wght": 700})',
    'i.flavor = None',
    'i.save("' + tmp + '")'
  ].join('\n')]);
  const buf = fs.readFileSync(tmp);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const U = font.unitsPerEm, slova = Array.from(natpis);
  let x0 = 0, lijevo = Infinity, desno = -Infinity, gore = 0, dolje = 0;
  const mj = slova.map(function (c, i) {
    const g = font.charToGlyph(c);
    if (i) x0 += font.getKerningValue(font.charToGlyph(slova[i - 1]), g);
    const bb = g.getBoundingBox(), m = { g: g, x: x0, l: x0 + bb.x1, d: x0 + bb.x2 };
    if (bb.x2 > bb.x1) { lijevo = Math.min(lijevo, m.l); desno = Math.max(desno, m.d); }
    gore = Math.max(gore, bb.y2); dolje = Math.max(dolje, -bb.y1);
    x0 += g.advanceWidth + RAZMAK * U;
    return m;
  });
  const k = SIRINA / (desno - lijevo), cx = (lijevo + desno) / 2, cy = (gore - dolje) / 2;
  const izlaz = mj.map(function (m) {
    const sredina = ((m.l + m.d) / 2 - cx) * k;
    const put = m.g.getPath(m.x, 0, U).commands;          // y prema dolje
    const obrisi = [];
    let o = null, px = 0, py = 0;
    const T = function (x, y) { o.push(+((x - cx) * k - sredina).toFixed(5), +((-y - cy) * k).toFixed(5)); };
    put.forEach(function (c) {
      if (c.type === 'M') { o = []; obrisi.push(o); T(c.x, c.y); }
      else if (c.type === 'L') T(c.x, c.y);
      else if (c.type === 'Q') { for (let s = 1; s <= 10; s++) { const t = s / 10, a = (1 - t) * (1 - t), bq = 2 * t * (1 - t), cq = t * t; T(a * px + bq * c.x1 + cq * c.x, a * py + bq * c.y1 + cq * c.y); } }
      else if (c.type === 'C') { for (let s = 1; s <= 14; s++) { const t = s / 14, a = Math.pow(1 - t, 3), bq = 3 * t * (1 - t) * (1 - t), cq = 3 * t * t * (1 - t), dq = t * t * t; T(a * px + bq * c.x1 + cq * c.x2 + dq * c.x, a * py + bq * c.y1 + cq * c.y2 + dq * c.y); } }
      if (c.type !== 'Z') { px = c.x; py = c.y; }
    });
    // vanjski obrisi i rupe (rupa ide u obris u kojem joj je prva točka)
    const povrsina = function (t) { let s = 0; for (let i = 0; i < t.length; i += 2) { const j = (i + 2) % t.length; s += t[i] * t[j + 1] - t[j] * t[i + 1]; } return s / 2; };
    const unutra = function (t, x, y) { let u = false; for (let i = 0, j = t.length - 2; i < t.length; j = i, i += 2) { if ((t[i + 1] > y) !== (t[j + 1] > y) && x < (t[j] - t[i]) * (y - t[i + 1]) / (t[j + 1] - t[i + 1]) + t[i]) u = !u; } return u; };
    const sv = obrisi.filter(function (t) { return t.length >= 6; }).map(function (t) { return { t: t, p: povrsina(t) }; });
    const najveci = sv.reduce(function (a, b) { return Math.abs(b.p) > Math.abs(a.p) ? b : a; });
    const smjerVan = Math.sign(najveci.p);
    const van = sv.filter(function (s) { return Math.sign(s.p) === smjerVan; }).map(function (s) { return { van: s.t, rupe: [] }; });
    sv.filter(function (s) { return Math.sign(s.p) !== smjerVan; }).forEach(function (s) {
      const v = van.find(function (o) { return unutra(o.van, s.t[0], s.t[1]); }) || van[0];
      v.rupe.push(s.t);
    });
    return { sredina: +sredina.toFixed(5), oblici: van };
  });
  console.log('natpis', natpis, 'slova', izlaz.length, 'visina', ((gore + dolje) * k).toFixed(3));
  return { slova: izlaz, pola: (gore + dolje) / 2 * k, sirina: SIRINA };
}

(async function () {
  await MeshoptSimplifier.ready;
  const fl = podaciFlakona();
  const PEN = ucitajPen();
  const pen = {
    tijelo: PEN.TIJELO, ovratnik: PEN.OVRATNIK, etiketa: PEN.ETIKETA, dnoTekucine: PEN.DNO_TEKUCINE,
    glave: glave(PEN)
  };
  const nat = await natpis();
  const bin = Buffer.concat(DIJELOVI).toString('base64');
  const podaci = { verzija: 1, flakon: fl, penhaligon: pen, natpis: nat };
  const js = '// Izrađeno skriptom pokusi/stvarno/izvor/izradi-modele.mjs — ne mijenja se ručno\n' +
    'window.MX_MODELI_3D = ' + JSON.stringify(podaci) + ';\nwindow.MX_MODELI_3D.bin = "' + bin + '";\n';
  fs.writeFileSync(path.join(OVDJE, '../modeli.js'), js);
  console.log('modeli.js', (js.length / 1024).toFixed(0), 'KB');
})();
