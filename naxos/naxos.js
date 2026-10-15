// ═══════════════════════════════════════════════════════════════════════
//  NAXOS — prizor s fotografije (izvor.jpg) od točkica, za početni ekran
//  chata (pocetna-chata.js ga učita iz mape naxos/ tek kad su ostali oblici
//  gotovi i gradi ga u malim koracima; vidi README.md).
//
//  Xerjoff 1861 Naxos stoji na lanenom platnu na starom drvenom stolu,
//  na suncu pred kamenim zidom i maslinom; oko njega su sastojci mirisa:
//  staklenka meda u koju s drvene žlice curi med, dva cijela limuna s
//  listovima i prerezana polovica, štapići cimeta, mahune vanilije, zrna
//  tonke, grančice lavande, hrpa duhana i cvjetovi naranče.
//
//  Sve je od točkica u tankim vodoravnim nitima, kao ostali oblici u
//  animaciji (prstenovi oko tijela, vodoravni rezovi, niti po plahtama),
//  ali svaka točkica nosi boju s fotografije: predmeti imaju boje
//  izmjerene na fotografiji, a platno, stol i pozadina uzimaju boju točno
//  s mjesta fotografije na koje se projiciraju (mala zamućena kopija
//  fotografije je u ovoj datoteci), pa su na njima i sjene predmeta.
//
//  Mjere su u svjetskim jedinicama pocetna-chata.js (flakon je od −0,86 do
//  0,90, visok 1,76): x udesno, y gore, z prema nama; flakon stoji u
//  ishodištu, platno je u y = −0,86. Kamera fotografije je izmjerena
//  (visina ~2,9 jedinice iznad stola, udaljenost ~9, nagib ~12,7°), pa se
//  svako mjesto zadaje pikselom fotografije (izSlike), a prizor u animaciji
//  (smanjen KOMP puta, podignut za POMAK, nagnut za NAGIB, kamera na CAM)
//  pada točno na fotografiju.
//
//  Točkica ima 8 brojeva: mjesto (xyz) i kod (normala oktaedarski 2 × 8
//  bitova, vrsta 4 bita i skupina 4 bita; vidi VRSTE i SKUPINE), boja (rgb)
//  i kod tvari (koliko svjetlo mijenja boju, tama stražnje strane, jačina;
//  po 8 bitova). Pozadina je zalijepljena za ekran (mjesto je u prostoru
//  pogleda, shader je ne okreće), pa se ne pomiče kad se prizor njiše.
//  Što je iza drugih predmeta (gledano iz kamere), nema točkica (zaklon),
//  jer se točkice zbrajaju bez dubine.
// ═══════════════════════════════════════════════════════════════════════
(function () {
  'use strict';
  const NAX = window.MX_NAXOS = window.MX_NAXOS || {};
  NAX.VERZIJA = 1;

  // ── pogled: prizor se u shaderu smanji (KOMP), podigne (POMAK), nagne
  //    prema nama (NAGIB, rad) i gleda s udaljenosti CAM (u jedinicama
  //    prostora animacije); tako složen poklapa se s fotografijom
  const KOMP = 0.62, POMAK = 0.12, NAGIB = 0.22, CAM = 5.7;
  const SINN = Math.sin(NAGIB), COSN = Math.cos(NAGIB);
  // piksel fotografije (1024 × 1024) ↔ prostor animacije: flakon je u x = 0
  // (px 512), dno mu je u py 760; jedinica prostora je 1 / KAM_K px
  const KAM_K = 0.002153, KAM_SY0 = -0.396, KAM_PX0 = 512, KAM_PY0 = 760;
  const STOL = -0.86;             // vrh platna na stolu (= dno flakona)
  const OMJER = 2.3;              // točkice na niti gušće nego razmak niti (kao u pocetna-chata.js)

  // vrste točkica (4 bita): shader ih različito tretira
  const V = { OBICNO: 0, FLAKON: 1, ZLATO: 2, TKANINA: 3, POZADINA: 4, PRASINA: 5, MED: 6, STAKLENKA: 7, PLOCICA: 8, MLAZ: 9 };
  // skupine (4 bita): redoslijed nastanka iz izmaglice
  const SK = { flakon: 0, stol: 1, pozadina: 2, staklenka: 3, zlica: 4, limuni: 5, cimet: 6, vanilija: 7, tonka: 8, lavanda: 9, duhan: 10, cvjetovi: 11, prasina: 12 };
  NAX.KOMP = KOMP; NAX.POMAK = POMAK; NAX.NAGIB = NAGIB; NAX.CAM = CAM; NAX.VRSTE = V; NAX.SKUPINE = SK; NAX.STOL = STOL;

  // ── boje s fotografije (uvijek #rrggbb)
  const BOJE = {
    flakonLijevo: '#e4cfb7', flakonDesno: '#f8ecdc', flakonDno: '#dccdbe',            // bijelo mutno staklo: topla lijeva strana (odsjaj meda), svijetla desna
    zlato: '#cf9a46', zlatoSvjetlo: '#e8bd6a', zlatoTamno: '#8a5f2a', zlatoSjaj: '#f6dc98',   // čep i prsten
    vrhCepa: '#e8dec0', vrhCepaRub: '#f4ecd4',                                           // prozirni blijedožuti šiljak čepa
    plocica: '#dcb46c', plocicaOkvir: '#e9cd93', znakX: '#f0cf86', slova: '#c7a068',     // pločica, okvir, znak X, natpis NAXOS
    staklenka: '#efdcb5', navoj: '#f6e6c4',                                              // staklo i navoji staklenke
    med: '#f07a10', medTamno: '#9a6414', medPovrsina: '#eeab40', medSjaj: '#fbd27a',      // med u staklenki
    mlaz: '#e9a23a', mlazSjaj: '#fbe0a0',                                                // mlaz meda sa žlice
    zlicaDrvo: '#cfa374', zlicaTamno: '#8a5f3c', zlicaGlava: '#a86b3a', zlicaGlavaTamno: '#4a2a18', zlicaMed: '#c7781e',
    limun: '#f2c22e', limunSvjetlo: '#fbd95c', limunSjena: '#d99a12',
    limunMeso: '#c9922c', limunMesoSvjetlo: '#dfae48', limunOpna: '#f8ecc0', limunBijelo: '#f4e3b0', limunKora: '#e8c23a',
    list: '#4a5812', listSvjetlo: '#8a9a3a', listZila: '#a0b060', listTamno: '#303a0c', peteljka: '#9a7a40',
    cimet: '#a0602c', cimetSvjetlo: '#c58a4e', cimetTamno: '#6a3410', cimetKraj: '#b8743c',
    vanilija: '#3c2419', vanilijaSvjetlo: '#6b4530', vanilijaSjaj: '#9a6a4c',
    tonka: '#3a2c26', tonkaSvjetlo: '#6a5448', tonkaRub: '#a08270',
    lavanda: '#7f6fb4', lavandaSvjetlo: '#b3a3dc', lavandaTamno: '#54458a', caska: '#9a9a78', stabljika: '#8c9470',
    duhan: '#8e4e1e', duhanSvjetlo: '#b86a30', duhanTamno: '#4e2409', duhanCrno: '#2a120a',
    latica: '#f6f1e4', laticaSjena: '#d9ccb4', prasnici: '#e8c868', tucak: '#b7c070', pupoljak: '#e6e2cc',
    porub: '#f3e0c2', prasina: '#f7e9cc'
  };

  function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function glatko(x) { x = sat(x); return x * x * (3 - 2 * x); }
  function korakG(a, b, x) { return glatko((x - a) / (b - a)); }
  function boja01(hex) { const n = parseInt(String(hex).replace('#', ''), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
  function mijesaj(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function puta(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }
  function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function kriz(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  const C = {};
  Object.keys(BOJE).forEach(function (k) { C[k] = boja01(BOJE[k]); });

  // 3D "value" šum (−1..1), ponovljiv
  function hash3(i, j, k) {
    let h = (i * 374761393 + j * 668265263 + k * 1103515245) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function sum(x, y, z) {
    const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
    const fx = x - i, fy = y - j, fz = z - k;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
    const a = lerp(lerp(hash3(i, j, k), hash3(i + 1, j, k), sx), lerp(hash3(i, j + 1, k), hash3(i + 1, j + 1, k), sx), sy);
    const b = lerp(lerp(hash3(i, j, k + 1), hash3(i + 1, j, k + 1), sx), lerp(hash3(i, j + 1, k + 1), hash3(i + 1, j + 1, k + 1), sx), sy);
    return 2 * lerp(a, b, sz) - 1;
  }
  const pjega = function (x, y, z, k) { return 0.5 + 0.5 * sum(x * k, y * k, z * k); };   // 0..1

  // ponovljiv "slučajni" niz
  function slucajno(sjeme) {
    let a = sjeme >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // n točaka jednoliko po ukupnoj duljini svih linija
  function poLinijama(duljine, n) {
    let ukupno = 0;
    for (let i = 0; i < duljine.length; i++) ukupno += duljine[i];
    const korak = ukupno / n;
    const linija = new Int32Array(n), udio = new Float32Array(n);
    let l = 0, pocetak = 0;
    for (let i = 0; i < n; i++) {
      const s = (i + 0.5) * korak;
      while (l < duljine.length - 1 && s >= pocetak + duljine[l]) { pocetak += duljine[l]; l++; }
      linija[i] = l;
      udio[i] = duljine[l] > 0 ? sat((s - pocetak) / duljine[l]) : 0;
    }
    return { linija: linija, udio: udio };
  }

  // matrice 3 × 3 (po retcima): okret oko y (kut), pa oko x (nagib), pa oko z
  function matrica(kutY, nagibX, valjanjeZ) {
    const cy = Math.cos(kutY), sy = Math.sin(kutY), cx = Math.cos(nagibX || 0), sx = Math.sin(nagibX || 0);
    const cz = Math.cos(valjanjeZ || 0), sz = Math.sin(valjanjeZ || 0);
    const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], Rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]], Rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]];
    return mnozi(Rz, mnozi(Rx, Ry));
  }
  function mnozi(A, Bm) {
    const Cm = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) Cm[i][j] = A[i][0] * Bm[0][j] + A[i][1] * Bm[1][j] + A[i][2] * Bm[2][j];
    return Cm;
  }
  function primijeni(M, v) {
    return [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
  }
  // matrica koja os y okreće u smjer d (jedinični)
  function premaSmjeru(d) {
    const a = Math.acos(sat(d[1])), b = Math.atan2(d[0], d[2]);
    return mnozi([[Math.cos(b), 0, Math.sin(b)], [0, 1, 0], [-Math.sin(b), 0, Math.cos(b)]], [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]]);
  }
  const JEDINICNA = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  function uLokalno(M, c) {
    return function (x, y, z) {
      const dx = x - c[0], dy = y - c[1], dz = z - c[2];
      return [M[0][0] * dx + M[1][0] * dy + M[2][0] * dz, M[0][1] * dx + M[1][1] * dy + M[2][1] * dz, M[0][2] * dx + M[1][2] * dy + M[2][2] * dz];
    };
  }

  // ── pogled: svjetsko mjesto → prostor pogleda (srednji pogled, bez
  //    njihanja) → piksel fotografije, i natrag (piksel + visina → mjesto)
  function uPogled(p) {                        // q = Rx(NAGIB) · (p · KOMP + POMAK)
    const x = p[0] * KOMP, y = p[1] * KOMP + POMAK, z = p[2] * KOMP;
    return [x, COSN * y - SINN * z, SINN * y + COSN * z];
  }
  function izPogleda(q) {                      // obrat
    const y = COSN * q[1] + SINN * q[2], z = -SINN * q[1] + COSN * q[2];
    return [q[0] / KOMP, (y - POMAK) / KOMP, z / KOMP];
  }
  function naSliku(p) {                        // svjetsko mjesto → piksel fotografije
    const q = uPogled(p), persp = CAM / (CAM - q[2]);
    return [KAM_PX0 + q[0] * persp / KAM_K, KAM_PY0 - (q[1] * persp - KAM_SY0) / KAM_K];
  }
  // mjesto na vodoravnoj ravnini y = yW koje je na fotografiji u pikselu (px, py)
  function izSlike(px, py, yW) {
    const sx = (px - KAM_PX0) * KAM_K, sy = KAM_SY0 + (KAM_PY0 - py) * KAM_K, ys = yW * KOMP + POMAK;
    const t = (ys - COSN * sy) / (SINN - COSN * sy / CAM);                 // q.z na zraci kroz piksel
    const q = [sx * (CAM - t) / CAM, sy * (CAM - t) / CAM, t];
    const p = izPogleda(q);
    return [p[0], yW, p[2]];
  }
  // mjesto na ravnini z = zW (okomitoj, prema nama) pod pikselom (px, py)
  function izSlikeZ(px, py, zW) {
    const sx = (px - KAM_PX0) * KAM_K, sy = KAM_SY0 + (KAM_PY0 - py) * KAM_K, zs = zW * KOMP;
    // R^T q: z_s = −SINN · q.y + COSN · q.z, q.y = sy (CAM − t) / CAM, q.z = t
    const t = (zs + SINN * sy) / (COSN + SINN * sy / CAM);
    const q = [sx * (CAM - t) / CAM, sy * (CAM - t) / CAM, t];
    const p = izPogleda(q);
    return [p[0], p[1], zW];
  }
  // kamera u svjetskim koordinatama (srednji pogled)
  const KAMERA = izPogleda([0, 0, CAM]);
  NAX.izSlike = izSlike; NAX.naSliku = naSliku; NAX.KAMERA = KAMERA;

  // ── mala zamućena kopija fotografije (128 × 128): boje platna, stola i
  //    pozadine uzimaju se s nje
  const SLIKA = 'data:image/jpeg;base64,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';
  let FOTO = null;                              // { d: Uint8ClampedArray, w, h } kad je učitana
  NAX.pripremi = function () {
    if (NAX._priprema) return NAX._priprema;
    NAX._priprema = new Promise(function (gotovo) {
      try {
        const img = new Image();
        img.onload = function () {
          try {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth; c.height = img.naturalHeight;
            const ctx = c.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            FOTO = { d: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
          } catch (e) { FOTO = null; }
          gotovo(!!FOTO);
        };
        img.onerror = function () { gotovo(false); };
        img.src = SLIKA;
      } catch (e) { gotovo(false); }
    });
    return NAX._priprema;
  };
  // boja fotografije u pikselu (px, py) (0..1), bilinearno; bez fotografije: rezervna boja
  function foto(px, py, rezerva) {
    if (!FOTO) return rezerva || [0.6, 0.5, 0.4];
    const w = FOTO.w, h = FOTO.h, d = FOTO.d;
    const u = sat(px / 1024) * (w - 1), v = sat(py / 1024) * (h - 1);
    const i = Math.min(w - 2, Math.floor(u)), j = Math.min(h - 2, Math.floor(v)), fu = u - i, fv = v - j;
    const out = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      const a = d[4 * (j * w + i) + k], b = d[4 * (j * w + i + 1) + k], c2 = d[4 * ((j + 1) * w + i) + k], e = d[4 * ((j + 1) * w + i + 1) + k];
      out[k] = lerp(lerp(a, b, fu), lerp(c2, e, fu), fv) / 255;
    }
    return out;
  }
  function fotoNa(p, rezerva) { const s = naSliku(p); return foto(s[0], s[1], rezerva); }

  // ── normala → dva broja (oktaedarski zapis)
  function oktaedar(x, y, z) {
    const s = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
    let u = x / s, v = y / s;
    if (z < 0) { const u0 = u; u = (1 - Math.abs(v)) * (u0 >= 0 ? 1 : -1); v = (1 - Math.abs(u0)) * (v >= 0 ? 1 : -1); }
    return [u, v];
  }

  // ═════════════════════════════════════════════════════════════════════
  //  ZAKLON — što je iz kamere skriveno iza drugog predmeta, nema točkica.
  //  Zakloni su jednostavna tijela (SDF) s obuhvatnom kuglom; točkica se
  //  provjeri zrakom prema kameri (sphere tracing), a vlastiti predmet
  //  (T.objekt) se preskače
  // ═════════════════════════════════════════════════════════════════════
  const ZAKLONI = [];
  function zaklon(id, c, R, sdf) { ZAKLONI.push({ id: id, c: c, R: R, sdf: sdf }); }
  function zaklonjen(T) {
    const px = T.x, py = T.y, pz = T.z;
    let dx = KAMERA[0] - px, dy = KAMERA[1] - py, dz = KAMERA[2] - pz;
    const L = Math.hypot(dx, dy, dz) || 1;
    dx /= L; dy /= L; dz /= L;
    for (let i = 0; i < ZAKLONI.length; i++) {
      const Z = ZAKLONI[i];
      if (Z.id === T.objekt) continue;
      // obuhvatna kugla: siječe li je zraka
      const ox = Z.c[0] - px, oy = Z.c[1] - py, oz = Z.c[2] - pz;
      const b = ox * dx + oy * dy + oz * dz, c2 = ox * ox + oy * oy + oz * oz - Z.R * Z.R;
      if (c2 > 0 && (b < 0 || b * b < c2)) continue;
      let t = 0.004;
      const tMax = Math.min(L, b + Z.R + 0.01);
      for (let k = 0; k < 64 && t < tMax; k++) {
        const d = Z.sdf(px + dx * t, py + dy * t, pz + dz * t);
        if (d < 0.0025) return true;
        t += Math.max(d, 0.004);
      }
    }
    return false;
  }

  // ═════════════════════════════════════════════════════════════════════
  //  SKUPLJAČ — niti i točkice. broji = 1: samo broji po duljini niti
  //  (grubo); broji = 2: izračuna svaku UZORAK-tu točkicu (zaklon se
  //  provjeri), pa je procjena točna; broji = 0: gradnja
  // ═════════════════════════════════════════════════════════════════════
  const VEL = 8, UZORAK = 4;
  const T = { x: 0, y: 0, z: 0, nx: 0, ny: 1, nz: 0, col: [1, 1, 1], lit: 1, back: 0.4, jak: 1, vrsta: 0, skupina: 0, objekt: 0, pogled: false };
  function tvar(col, lit, back, jak, vrsta, skupina, objekt) {
    T.col = col; T.lit = lit; T.back = back; T.jak = jak; T.vrsta = vrsta; T.skupina = skupina; T.objekt = objekt || 0; T.pogled = false;
    return true;
  }

  function Skupljac(korak, broji) {
    this.korak = korak; this.razmak = korak / OMJER; this.broji = broji;
    this.n = 0; this.linija = 0; this.brojac = 0;
    this.dijelovi = []; this.dio = null; this.poz = 0;
  }
  Skupljac.prototype.primi = function () {
    if (this.broji === 2) { if ((this.brojac++) % UZORAK) return; }
    // zaklon: za pozadinu (mjesto u prostoru pogleda) se provjeri svjetsko mjesto
    if (T.pogled) {
      const p = izPogleda([T.x, T.y, T.z]);
      const t2 = { x: p[0], y: p[1], z: p[2], objekt: T.objekt };
      if (zaklonjen(t2)) return;
    } else if (zaklonjen(T)) return;
    if (this.broji) { this.n += this.broji === 2 ? UZORAK : 1; return; }
    if (!this.dio || this.poz >= this.dio.length) { this.dio = new Float32Array(VEL * 8192); this.dijelovi.push(this.dio); this.poz = 0; }
    const d = this.dio, o = this.poz;
    const q = oktaedar(T.nx, T.ny, T.nz);
    d[o] = T.x; d[o + 1] = T.y; d[o + 2] = T.z;
    d[o + 3] = Math.round((q[0] * 0.5 + 0.5) * 255) * 65536 + Math.round((q[1] * 0.5 + 0.5) * 255) * 256 + (T.vrsta & 15) * 16 + (T.skupina & 15);
    d[o + 4] = T.col[0]; d[o + 5] = T.col[1]; d[o + 6] = T.col[2];
    d[o + 7] = Math.round(sat(T.lit) * 255) * 65536 + Math.round(sat(T.back) * 255) * 256 + Math.round(sat(T.jak / 4) * 255);
    this.poz += VEL; this.n++;
  };
  // nit: f(u, T) ispuni T za udio u (0..1) duž niti (false = bez točkice);
  // broj točkica = duljina · tezina / razmak; zatvorena nit (prsten) nema krajeva
  Skupljac.prototype.nit = function (f, duljina, tezina, zatvoreno) {
    const m = Math.max(1, Math.round(duljina * tezina / this.razmak));
    const fi = ((++this.linija) * 0.618034) % 1;
    if (this.broji === 1) { this.n += m; return; }
    for (let k = 0; k < m; k++) {
      const u = zatvoreno ? ((k + 0.5) / m + fi) % 1 : (k + 0.5 + (fi - 0.5) * 0.8) / m;
      if (f(u, T) === false) continue;
      this.primi();
    }
  };
  // dužine jednog reza: točkice jednoliko po težinskoj duljini; segs: [{ a, b, n, d, w }]
  Skupljac.prototype.duzine = function (segs, f) {
    let uk = 0;
    for (let i = 0; i < segs.length; i++) uk += segs[i].d * segs[i].w;
    const m = Math.round(uk / this.razmak);
    if (m <= 0) return;
    this.linija++;
    if (this.broji === 1) { this.n += m; return; }
    const r = poLinijama(segs.map(function (s) { return s.d * s.w; }), m);
    for (let i = 0; i < m; i++) {
      const s = segs[r.linija[i]], u = r.udio[i];
      T.x = lerp(s.a[0], s.b[0], u); T.y = lerp(s.a[1], s.b[1], u); T.z = lerp(s.a[2], s.b[2], u);
      T.nx = s.n[0]; T.ny = s.n[1]; T.nz = s.n[2];
      if (f(T) === false) continue;
      this.primi();
    }
  };
  // raspršene točkice (prašina, pozadina): n uz razmak niti 0,02
  Skupljac.prototype.rasap = function (n, f, rnd) {
    const m = Math.round(n * Math.pow(0.02 / this.korak, 2));
    if (this.broji === 1) { this.n += m; return; }
    for (let i = 0; i < m; i++) {
      if (f(T, rnd) === false) continue;
      this.primi();
    }
  };
  Skupljac.prototype.spremnik = function () {
    const out = new Float32Array(this.n * VEL);
    let o = 0;
    for (let i = 0; i < this.dijelovi.length && o < out.length; i++) {
      const d = this.dijelovi[i], m = Math.min(d.length, out.length - o);
      out.set(m === d.length ? d : d.subarray(0, m), o);
      o += m;
    }
    return out;
  };

  // ═════════════════════════════════════════════════════════════════════
  //  GRADITELJI — tijela od niti (kao u pocetna-chata.js)
  // ═════════════════════════════════════════════════════════════════════
  // ── tijelo koje se vrti oko osi: profil [[y, r, tvar], ...] (os y), prstenovi na razmaku korak.
  //    o: M (okret), pomak, boja(T, y, r, kut, ny, tvar), tezina(y, r, ny, tvar)
  function* prsteni(S, profil, o) {
    const seg = [];
    let uk = 0;
    for (let i = 0; i < profil.length - 1; i++) {
      const p = profil[i], q = profil[i + 1], dy = q[0] - p[0], dr = q[1] - p[1], d = Math.hypot(dy, dr);
      if (d < 1e-6) continue;
      seg.push({ p: p, q: q, d: d, od: uk, nr: dy / d, ny: -dr / d, tvar: p[2] || 0 });
      uk += d;
    }
    const M = o.M || JEDINICNA, pomak = o.pomak || [0, 0, 0];
    const k = Math.max(1, Math.round(uk / S.korak)), kk = uk / k;
    for (let i = 0; i < k; i++) {
      const s = (i + 0.5) * kk;
      let j = 0;
      while (j < seg.length - 1 && s > seg[j].od + seg[j].d) j++;
      const g = seg[j], t = sat((s - g.od) / g.d), y = lerp(g.p[0], g.q[0], t), r = lerp(g.p[1], g.q[1], t);
      const tez = o.tezina ? o.tezina(y, r, g.ny, g.tvar) : 1;
      if (tez <= 0 || r < 1e-5) continue;
      S.nit(function (u, T) {
        const a = u * 2 * Math.PI, ca = Math.cos(a), sa = Math.sin(a);
        const p = primijeni(M, [r * ca, y, r * sa]), n = primijeni(M, [g.nr * ca, g.ny, g.nr * sa]);
        T.x = p[0] + pomak[0]; T.y = p[1] + pomak[1]; T.z = p[2] + pomak[2];
        T.nx = n[0]; T.ny = n[1]; T.nz = n[2];
        return o.boja(T, y, r, a, g.ny, g.tvar);
      }, 2 * Math.PI * r, tez, true);
      if (i % 24 === 23) yield;
    }
  }

  // ── cijev duž krivulje c(t): prstenovi okomiti na krivulju na razmaku korak.
  //    o: r(t, kut), spljosti, boja(T, t, kut, r), tezina(t), gusto (razmak prstenova prema koraku)
  function* cijev(S, c, o) {
    const N = 120, pts = [], L = [0];
    for (let i = 0; i <= N; i++) pts.push(c(i / N));
    for (let i = 1; i <= N; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const uk = L[N], k = Math.max(1, Math.round(uk / (S.korak * (o.gusto || 1)))), kk = uk / k, spl = o.spljosti || 1;
    let e1 = null;
    for (let i = 0; i < k; i++) {
      const s = (i + 0.5) * kk;
      let j = 1;
      while (j < N && L[j] < s) j++;
      const t = ((j - 1) + (s - L[j - 1]) / Math.max(1e-9, L[j] - L[j - 1])) / N;
      const p = c(t), e = 0.003, pa = c(Math.max(0, t - e)), pb = c(Math.min(1, t + e));
      const tg = norm3([pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]]);
      if (!e1) { const ref = Math.abs(tg[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; e1 = norm3(kriz(ref, tg)); }
      else { const d = dot3(e1, tg); e1 = norm3([e1[0] - tg[0] * d, e1[1] - tg[1] * d, e1[2] - tg[2] * d]); }
      const e2 = kriz(tg, e1), E1 = e1, tt = t;
      const r0 = o.r(t, 0), tez = o.tezina ? o.tezina(t) : 1;
      if (r0 < 1e-5 || tez <= 0) continue;
      S.nit(function (u, T) {
        const a = u * 2 * Math.PI, ca = Math.cos(a), sa = Math.sin(a), r = o.r(tt, a), RX = r, RY = r * spl;
        T.x = p[0] + E1[0] * RX * ca + e2[0] * RY * sa; T.y = p[1] + E1[1] * RX * ca + e2[1] * RY * sa; T.z = p[2] + E1[2] * RX * ca + e2[2] * RY * sa;
        const nx = ca / RX, ny = sa / RY;
        const n = norm3([E1[0] * nx + e2[0] * ny, E1[1] * nx + e2[1] * ny, E1[2] * nx + e2[2] * ny]);
        T.nx = n[0]; T.ny = n[1]; T.nz = n[2];
        return o.boja(T, tt, a, r);
      }, 2 * Math.PI * r0 * Math.sqrt((1 + spl * spl) / 2), tez, true);
      if (i % 40 === 39) yield;
    }
  }

  // ── plahta F(u, v) → [x, y, z]: niti na stalnom v (duž u), razmaknute oko korak · o.razmak.
  //    o: boja(T, u, v), tezina, gore (normala prema gore), poprijeko (dodatne niti duž v, težina)
  function* plahta(S, F, o) {
    const e = 0.002, razmak = (o.razmak || 1) * S.korak;
    let W = 0, Lmax = 0;
    for (let i = 0; i < 8; i++) {
      let w = 0, prev = F((i + 0.5) / 8, 0);
      for (let j = 1; j <= 32; j++) { const q = F((i + 0.5) / 8, j / 32); w += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]); prev = q; }
      if (w > W) W = w;
      let l = 0; prev = F(0, (i + 0.5) / 8);
      for (let j = 1; j <= 32; j++) { const q = F(j / 32, (i + 0.5) / 8); l += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]); prev = q; }
      if (l > Lmax) Lmax = l;
    }
    function normala(u, v) {
      const p = F(u, v), pu = F(Math.min(1, u + e), v), pv = F(u, Math.min(1, v + e));
      let n = norm3(kriz([pu[0] - p[0], pu[1] - p[1], pu[2] - p[2]], [pv[0] - p[0], pv[1] - p[1], pv[2] - p[2]]));
      if (o.gore && n[1] < 0) n = [-n[0], -n[1], -n[2]];
      return [p, n];
    }
    const k = Math.max(1, Math.round(W / razmak));
    for (let j = 0; j < k; j++) {
      const v = (j + 0.5) / k;
      let L = 0, prev = F(0, v);
      for (let i = 1; i <= 64; i++) { const q = F(i / 64, v); L += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]); prev = q; }
      if (L < 1e-6) continue;
      S.nit(function (u, T) {
        const pn = normala(u, v), p = pn[0], n = pn[1];
        T.x = p[0]; T.y = p[1]; T.z = p[2]; T.nx = n[0]; T.ny = n[1]; T.nz = n[2];
        return o.boja(T, u, v);
      }, L, o.tezina || 1, false);
      if (j % 12 === 11) yield;
    }
    if (o.poprijeko) {                         // tkanje: rjeđe niti i poprijeko
      const kp = Math.max(1, Math.round(Lmax / (razmak * 2.2)));
      for (let i = 0; i < kp; i++) {
        const u = (i + 0.5) / kp;
        let L = 0, prev = F(u, 0);
        for (let j = 1; j <= 64; j++) { const q = F(u, j / 64); L += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]); prev = q; }
        if (L < 1e-6) continue;
        S.nit(function (v, T) {
          const pn = normala(u, v), p = pn[0], n = pn[1];
          T.x = p[0]; T.y = p[1]; T.z = p[2]; T.nx = n[0]; T.ny = n[1]; T.nz = n[2];
          return o.boja(T, u, v);
        }, L, (o.tezina || 1) * o.poprijeko, false);
        if (i % 12 === 11) yield;
      }
    }
  }

  // ── marching squares po rezu (ravnina): f(u, v) < 0 unutra; fina mreža samo uz plohu
  const RUBOVI = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]],
    8: [[2, 3]], 9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[1, 2]], 12: [[3, 1]], 13: [[0, 1]], 14: [[3, 0]] };
  const GRUBO = 4;
  function rez2(f, U0, U1, V0, V1, h) {
    const nx = Math.max(1, Math.ceil((U1 - U0) / h)), nz = Math.max(1, Math.ceil((V1 - V0) / h));
    const v = new Float32Array((nx + 1) * (nz + 1)).fill(NaN);
    function vr(i, j) {
      const k = i * (nz + 1) + j;
      let w = v[k];
      if (w !== w) { w = f(U0 + i * h, V0 + j * h); v[k] = w; }
      return w;
    }
    const out = [];
    function celija(i, j) {
      const a = vr(i, j), b = vr(i + 1, j), c = vr(i + 1, j + 1), d = vr(i, j + 1);
      const idx = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
      if (idx === 0 || idx === 15) return;
      const x0 = U0 + i * h, z0 = V0 + j * h;
      const tocka = function (e) {
        let px, pz, qx, qz, vp, vq;
        if (e === 0) { px = x0; pz = z0; qx = x0 + h; qz = z0; vp = a; vq = b; }
        else if (e === 1) { px = x0 + h; pz = z0; qx = x0 + h; qz = z0 + h; vp = b; vq = c; }
        else if (e === 2) { px = x0; pz = z0 + h; qx = x0 + h; qz = z0 + h; vp = d; vq = c; }
        else { px = x0; pz = z0; qx = x0; qz = z0 + h; vp = a; vq = d; }
        const t = vp / (vp - vq);
        return [px + (qx - px) * t, pz + (qz - pz) * t];
      };
      RUBOVI[idx].forEach(function (par) {
        const A = tocka(par[0]), Bt = tocka(par[1]);
        out.push(A[0], A[1], Bt[0], Bt[1]);
      });
    }
    const cx = Math.ceil(nx / GRUBO), cz = Math.ceil(nz / GRUBO), blizu = 2 * GRUBO * h;
    const g = new Float32Array((cx + 1) * (cz + 1));
    for (let I = 0; I <= cx; I++) for (let J = 0; J <= cz; J++) g[I * (cz + 1) + J] = vr(Math.min(I * GRUBO, nx), Math.min(J * GRUBO, nz));
    for (let I = 0; I < cx; I++) {
      for (let J = 0; J < cz; J++) {
        const a = g[I * (cz + 1) + J], b = g[(I + 1) * (cz + 1) + J], c = g[(I + 1) * (cz + 1) + J + 1], d = g[I * (cz + 1) + J + 1];
        if (Math.min(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d)) > blizu && (a < 0) === (b < 0) && (b < 0) === (c < 0) && (c < 0) === (d < 0)) continue;
        const i1 = Math.min(nx, (I + 1) * GRUBO), j1 = Math.min(nz, (J + 1) * GRUBO);
        for (let i = I * GRUBO; i < i1; i++) for (let j = J * GRUBO; j < j1; j++) celija(i, j);
      }
    }
    return out;
  }

  // ── predmet zadan SDF-om u okviru [x0, x1, y0, y1, z0, z1]: vodoravni rezovi
  //    (niti po okomitim i kosim plohama) i okomiti rezovi (niti po vodoravnim
  //    plohama). o: boja(T), h, osi ('y', 'z', 'yz'), tezina, bezDna
  function* rezSDF(S, sdf, ok, o) {
    const h = o.h || S.korak * 0.45, e = h * 0.5, tez = o.tezina || 1, osi = o.osi || 'yz';
    function normala(x, y, z) {
      return norm3([sdf(x + e, y, z) - sdf(x - e, y, z), sdf(x, y + e, z) - sdf(x, y - e, z), sdf(x, y, z + e) - sdf(x, y, z - e)]);
    }
    if (osi.indexOf('y') >= 0) {
      const k = Math.max(1, Math.round((ok[3] - ok[2]) / S.korak)), kk = (ok[3] - ok[2]) / k;
      for (let i = 0; i < k; i++) {
        const y = ok[2] + (i + 0.5) * kk;
        const d = rez2(function (u, v) { return sdf(u, y, v); }, ok[0], ok[1], ok[4], ok[5], h), segs = [];
        for (let q = 0; q < d.length; q += 4) {
          const len = Math.hypot(d[q + 2] - d[q], d[q + 3] - d[q + 1]);
          if (len < 1e-7) continue;
          const n = normala((d[q] + d[q + 2]) / 2, y, (d[q + 1] + d[q + 3]) / 2);
          const w = osi === 'y' ? 1 : 1 - korakG(0.55, 0.85, Math.abs(n[1]));
          if (w < 0.03) continue;
          segs.push({ a: [d[q], y, d[q + 1]], b: [d[q + 2], y, d[q + 3]], n: n, d: len, w: w * tez });
        }
        if (segs.length) S.duzine(segs, o.boja);
        if (i % 6 === 5) yield;
      }
    }
    if (osi.indexOf('z') >= 0) {
      const k = Math.max(1, Math.round((ok[5] - ok[4]) / S.korak)), kk = (ok[5] - ok[4]) / k;
      for (let i = 0; i < k; i++) {
        const z = ok[4] + (i + 0.5) * kk;
        const d = rez2(function (u, v) { return sdf(u, v, z); }, ok[0], ok[1], ok[2], ok[3], h), segs = [];
        for (let q = 0; q < d.length; q += 4) {
          const len = Math.hypot(d[q + 2] - d[q], d[q + 3] - d[q + 1]);
          if (len < 1e-7) continue;
          const n = normala((d[q] + d[q + 2]) / 2, (d[q + 1] + d[q + 3]) / 2, z);
          if (o.bezDna && n[1] < -0.3) continue;
          const w = osi === 'z' ? 1 : korakG(0.55, 0.85, Math.abs(n[1]));
          if (w < 0.03) continue;
          segs.push({ a: [d[q], d[q + 1], z], b: [d[q + 2], d[q + 3], z], n: n, d: len, w: w * tez });
        }
        if (segs.length) S.duzine(segs, o.boja);
        if (i % 6 === 5) yield;
      }
    }
  }

  // ── SDF pomoćnici
  function sdElipsoid(x, y, z, rx, ry, rz) {
    const k0 = Math.hypot(x / rx, y / ry, z / rz), k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
    return k1 > 0 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
  }
  function sdKapsula(x, y, z, a, b, r) {
    const pax = x - a[0], pay = y - a[1], paz = z - a[2], bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
    const h = sat((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz || 1));
    return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r;
  }
  function sdValjak(x, y, z, c, r, y0, y1) {          // okomiti valjak
    const dx = Math.hypot(x - c[0], z - c[2]) - r, dy = Math.max(y0 - y, y - y1);
    return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  }
  function smin(a, b, k) { const h = sat(0.5 + 0.5 * (b - a) / k); return lerp(b, a, h) - k * h * (1 - h); }
  function kvadratna(A, Cq, Bq, t) {
    const s = 1 - t;
    return [s * s * A[0] + 2 * s * t * Cq[0] + t * t * Bq[0], s * s * A[1] + 2 * s * t * Cq[1] + t * t * Bq[1], s * s * A[2] + 2 * s * t * Cq[2] + t * t * Bq[2]];
  }
  // sunce s fotografije: odozgo, zdesna i malo straga; 0..1 koliko je ploha okrenuta suncu
  const SUNCE = norm3([0.55, 0.62, -0.35]);
  function osunceno(T) { return sat(0.5 + 0.5 * (T.nx * SUNCE[0] + T.ny * SUNCE[1] + T.nz * SUNCE[2])); }

  // natpis (slova) kao maska: nacrta se u skriveno platno; vraća (u, v) → je li u slovu
  function maskaTeksta(tekst, font, W, H, razmak) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#fff';
    ctx.font = font;
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = razmak;
    const m = ctx.measureText(tekst), asc = m.actualBoundingBoxAscent || H * 0.7;
    const w = m.width + (('letterSpacing' in ctx) ? 0 : 0);
    const k = Math.min((W - 4) / Math.max(1, w), (H - 4) / Math.max(1, asc));
    ctx.setTransform(k, 0, 0, k, (W - w * k) / 2, (H + asc * k) / 2);
    ctx.fillText(tekst, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data;
    return function (u, v) {
      const i = Math.floor(u * W), j = Math.floor(v * H);
      return i >= 0 && j >= 0 && i < W && j < H && d[(j * W + i) * 4 + 3] > 110;
    };
  }

  // ═════════════════════════════════════════════════════════════════════
  //  PRIZOR
  // ═════════════════════════════════════════════════════════════════════
  // mjesta izmjerena na fotografiji (pikseli); vidi README
  const MJ = {
    staklenka: { dno: [232, 700], r: 0.315 },                        // prednji rub dna staklenke
    zlica: { glava: [218, 338], smjer: [-0.78, 0.60, 0.2], mlaz: 236 },   // sredina glave, smjer drške, x mlaza
    limun1: { dno: [727, 662], r: [0.43, 0.38, 0.39] },
    polovica: { dno: [805, 702], r: 0.38, lice: [-0.2, 0.3, 0.93] },
    limun2: { dno: [925, 662], r: [0.40, 0.36, 0.36] },
    listA: { od: [790, 462], do: [618, 492] }, listB: { od: [800, 452], do: [866, 406] }, listC: { od: [905, 655], do: [1012, 696] },
    cimet: [[[604, 731], [772, 752], 1], [[742, 736], [872, 752], 1], [[658, 672], [864, 712], 2.7]],   // [od, do, visina u polumjerima]
    vanilija: [[[562, 762], [1000, 718]], [[588, 805], [905, 738]], [[700, 790], [985, 752]]],
    tonka: [[298, 804, 0.0, 0.24, 0.11], [352, 793, -0.45, 0.2, 0.1], [328, 836, 0.5, 0.17, 0.1], [402, 833, 0.25, 0.25, 0.12], [455, 851, 0.35, 0.22, 0.11]],
    lavanda: [[[648, 838], [805, 793], [985, 790]], [[758, 848], [895, 820], [1015, 812]], [[862, 808], [962, 790], [1024, 785]]],
    duhan: { sredina: [140, 745], r: [0.62, 0.42, 0.5] },
    cvjetovi: { sredina: [355, 715], list1: [[380, 697], [288, 638]], list2: [[395, 690], [350, 628]],
      cvijet: [[372, 688, 0.14, [0.2, 0.5, 0.84], 0.13], [318, 736, 0.06, [-0.3, 0.45, 0.84], 0.14], [368, 748, 0.08, [0.0, 0.5, 0.86], 0.15], [420, 735, 0.07, [0.5, 0.4, 0.77], 0.12]],
      pupoljci: [[300, 700], [296, 762], [405, 702]] },
    platno: { lijevo: 130, porub: [[130, 795], [1024, 872]] },
    stol: { rub: [[0, 896], [1024, 848]] },
    obzor: 590                                                            // ispod ove visine fotografije je stol, iznad pozadina
  };
  NAX.MJERE = MJ;

  function* gradi(S, o) {
    const rnd = slucajno(1861);
    ZAKLONI.length = 0;
    const K = o.OMJER || OMJER;

    // ── 1. flakon (geometrija iz pocetna-chata.js), u ishodištu: bijelo
    //    mutno staklo (toplija lijeva strana, svijetla desna, bridovi faseta
    //    svjetliji), zlatni prsten i čep s okomitim odsjajima, prozirni
    //    blijedožuti šiljak čepa, zlatna pločica sa znakom X i natpis NAXOS
    {
      const nF = Math.max(2000, Math.round(3.377 * K / (S.korak * S.korak)));   // flakon ima 3,38 jedinice² ploha
      const gen = o.flakon(nF);
      let r = gen.next();
      while (!r.done) { r = gen.next(); yield; }
      const f = r.value, h0 = o.vrhCepa, N = f.poz.length / 3;
      if (S.broji === 1) S.n += N;
      else {
        for (let i = 0; i < N; i++) {
          const x = f.poz[3 * i], y = f.poz[3 * i + 1], z = f.poz[3 * i + 2], m = f.vrsta[i];
          T.x = x; T.y = y; T.z = z; T.nx = f.nor[3 * i]; T.ny = f.nor[3 * i + 1]; T.nz = f.nor[3 * i + 2];
          if (m === 0 || m === 4) {
            let col = mijesaj(C.flakonLijevo, C.flakonDesno, sat(0.5 + 0.6 * T.nx + 0.2 * T.ny));
            col = mijesaj(col, C.flakonDno, 0.6 * (1 - korakG(-0.86, -0.55, y)));
            if (m === 4) col = puta(col, 1.3);
            tvar(col, 0.45, 0.3, m === 4 ? 1.9 : 1.4, V.FLAKON, SK.flakon, 1);
          } else if (m === 1) {
            if (y > h0 + 0.002) {
              const col = mijesaj(C.vrhCepa, C.vrhCepaRub, Math.pow(1 - Math.abs(T.nz), 1.5));
              tvar(col, 0.55, 0.5, 0.75, V.FLAKON, SK.flakon, 1);
            } else {
              // polirano zlato: okomite pruge odsjaja (svijetle lijevo i u sredini, tamne desno)
              const a = Math.atan2(x, z);
              let col = mijesaj(C.zlatoTamno, C.zlatoSvjetlo, sat(0.5 - 0.6 * Math.sin(a - 0.35)));
              col = mijesaj(col, C.zlatoSjaj, Math.exp(-a * a / 0.03) * 0.8 + 0.25 * Math.exp(-(a - 1.0) * (a - 1.0) / 0.05));
              tvar(col, 0.9, 0.28, 1.0, V.ZLATO, SK.flakon, 1);
            }
          } else if (m === 2) tvar(mijesaj(C.plocica, C.plocicaOkvir, 0.2 + 0.3 * pjega(x, y, z, 30)), 0.35, 0.28, 1.8, V.PLOCICA, SK.flakon, 1);
          else tvar(C.znakX, 0.35, 0.28, 0.85, V.PLOCICA, SK.flakon, 1);
          S.primi();
        }
      }
      // natpis NAXOS ispod pločice (razmaknuta velika slova), guste niti kao znak X
      const maska = S.broji === 1 ? null : maskaTeksta('NAXOS', '600 100px "MX Cormorant", "Cormorant Garamond", Garamond, Georgia, serif', 220, 60, '0.14em');
      const yT = izSlikeZ(512, 706, 0.36)[1], yB = izSlikeZ(512, 732, 0.36)[1], xW = 0.118, RED = 0.0045;
      const redova = Math.round((yT - yB) / RED);
      if (S.broji === 1) S.n += Math.round(redova * 2 * xW * 0.35 * 3 / S.razmak);
      else if (maska) {
        for (let j = 0; j < redova; j++) {
          const y = yB + (j + 0.5) * RED, v = (yT - y) / (yT - yB), zf = o.sirinaFlakona(y) + 0.0075;
          const segs = [];
          let od = null;
          for (let x = -xW; x <= xW + 0.0008; x += 0.0008) {
            const u = x <= xW && maska((x + xW) / (2 * xW), v);
            if (u && od === null) od = x;
            else if (!u && od !== null) { if (x - od > 1e-6) segs.push({ a: [od, y, zf], b: [x, y, zf], n: [0, 0, 1], d: x - od, w: 3 }); od = null; }
          }
          if (segs.length) S.duzine(segs, function (T) { return tvar(C.slova, 0.3, 0.3, 1.4, V.PLOCICA, SK.flakon, 1); });
        }
      }
      // zaklon: tijelo flakona kao tijelo vrtnje po profilu
      const prof = [[-0.86, 0.17], [-0.80, 0.25], [-0.52, 0.335], [-0.03, 0.395], [0.15, 0.37], [0.27, 0.30], [0.33, 0.22], [0.31, 0.16], [0.65, 0.16], [0.9, 0.0]];
      zaklon(1, [0, 0.0, 0], 1.0, function (x, y, z) {
        let r = 0;
        if (y < prof[0][0]) return Math.hypot(Math.max(Math.hypot(x, z) - prof[0][1], 0), prof[0][0] - y);
        for (let i = 0; i < prof.length - 1; i++) if (y >= prof[i][0] && y <= prof[i + 1][0]) { r = lerp(prof[i][1], prof[i + 1][1], (y - prof[i][0]) / (prof[i + 1][0] - prof[i][0] || 1)); break; }
        if (y > prof[prof.length - 1][0]) return y - prof[prof.length - 1][0];
        return Math.hypot(x, z) - r;
      });
    }
    yield;

    // ── 2. staklenka meda lijevo: staklo s navojima na grlu, med do tri
    //    petine visine (sunce ga prosvjetljuje slijeva), površina meda s
    //    valićima gdje pada mlaz, kapi meda niz grlo
    const STK = (function () {
      const d = izSlike(MJ.staklenka.dno[0], MJ.staklenka.dno[1], STOL), r = MJ.staklenka.r;
      return { x: d[0], z: d[2] - r, r: r, med: 0.355, vrh: 0.61 };
    })();
    {
      const r = STK.r, rn = r * 0.86;
      // staklo: tijelo, rame, grlo s tri navoja i usnom, pa unutrašnja stijenka grla
      const profil = [[0.0, r * 0.92, 0], [0.012, r * 0.985, 0], [0.03, r, 0], [0.36, r, 0], [0.40, r * 0.97, 0], [0.43, r * 0.91, 0], [0.45, rn, 0],
        [0.47, rn, 1], [0.49, rn * 1.06, 1], [0.505, rn, 1], [0.52, rn * 1.06, 1], [0.535, rn, 1], [0.55, rn * 1.06, 1], [0.565, rn * 1.01, 1],
        [0.585, rn * 1.07, 2], [0.605, rn * 1.07, 2], [0.61, rn * 1.0, 2], [0.61, rn * 0.93, 3], [0.5, rn * 0.9, 3]];
      yield* prsteni(S, profil, {
        pomak: [STK.x, STOL, STK.z],
        tezina: function (y, rr, ny, m) { return m === 0 ? (y < STK.med ? 0.35 : 0.55) : m === 3 ? 0.5 : 1; },
        boja: function (T, y, rr, a, ny, m) {
          const sja = sat(0.5 + 0.5 * Math.cos(a - 2.3)), obris = Math.pow(1 - Math.abs(T.nz), 1.6);
          if (m === 0) {
            // staklo nad medom i oko meda: tanko, svjetlije na obrisu
            const col = mijesaj(mijesaj(C.staklenka, C.med, y < STK.med ? 0.25 : 0), C.navoj, 0.5 * obris);
            return tvar(col, 0.55, 0.5, (y < STK.med ? 0.3 : 0.5) + 0.5 * obris, V.STAKLENKA, SK.staklenka, 2);
          }
          const col = mijesaj(C.staklenka, C.navoj, 0.4 + 0.6 * sja);
          return tvar(puta(col, m === 3 ? 0.7 : 1), 0.6, 0.5, m === 3 ? 0.6 : 1.0 + 0.5 * obris, V.STAKLENKA, SK.staklenka, 2);
        }
      });
      yield;
      // med: unutrašnji valjak do površine, pa površina s valićima oko mlaza
      const xm = izSlike(MJ.zlica.mlaz, 760, STOL)[0];                      // x mlaza
      yield* prsteni(S, [[0.02, r * 0.93, 0], [STK.med - 0.02, r * 0.93, 0], [STK.med, r * 0.9, 1], [STK.med + 0.004, r * 0.6, 1], [STK.med + 0.006, 0.08, 1], [STK.med + 0.012, 0.02, 1], [STK.med + 0.012, 0, 1]], {
        pomak: [STK.x, STOL, STK.z],
        tezina: function (y, rr, ny, m) { return m ? 0.8 : 1; },
        boja: function (T, y, rr, a, ny, m) {
          if (m) {
            const dr = Math.hypot(T.x - xm, T.z - STK.z);
            let col = mijesaj(C.medPovrsina, C.medSjaj, 0.3 + 0.4 * sat(0.5 + 0.5 * Math.cos(a - 2.3)));
            col = mijesaj(col, C.medSjaj, 0.6 * Math.exp(-dr * dr / 0.004) + 0.3 * Math.pow(0.5 + 0.5 * Math.cos(dr * 90), 4) * korakG(0.16, 0.03, dr));
            return tvar(col, 0.7, 0.6, 1.0, V.MED, SK.staklenka, 2);
          }
          const sja = sat(0.5 + 0.5 * Math.cos(a - 2.3));                    // sunce prolazi kroz med slijeva naprijed
          let col = mijesaj(C.medTamno, C.med, 0.15 + 0.85 * sja);
          col = mijesaj(col, C.medSjaj, 0.35 * Math.exp(-(y - STK.med + 0.03) * (y - STK.med + 0.03) / 0.002) * sja);
          col = puta(col, 0.85 + 0.3 * pjega(T.x, T.y, T.z, 14));
          return tvar(col, 0.75, 0.6, 1.25, V.MED, SK.staklenka, 2);
        }
      });
      // kapi meda niz unutrašnjost grla i vanjsku stijenku (sprijeda lijevo)
      const KAPI = [[2.0, 0.6, 0.48], [2.5, 0.62, 0.5], [1.5, 0.58, 0.44]];
      for (let i = 0; i < KAPI.length; i++) {
        const k = KAPI[i], a = k[0], rr = r * (i === 2 ? 1.0 : 0.89);
        yield* cijev(S, function (t) { return [STK.x + rr * Math.cos(a + 0.05 * Math.sin(t * 9)), STOL + lerp(k[1], k[2], t), STK.z + rr * Math.sin(a)]; }, {
          r: function (t) { return 0.012 * (0.5 + 0.5 * Math.sin(Math.PI * t)) + 0.006; },
          boja: function (T) { return tvar(mijesaj(C.mlaz, C.mlazSjaj, 0.3), 0.6, 0.6, 0.9, V.MED, SK.staklenka, 2); }
        });
      }
      zaklon(2, [STK.x, STOL + STK.med / 2, STK.z], Math.hypot(r, STK.med / 2) + 0.02, function (x, y, z) { return sdValjak(x, y, z, [STK.x, 0, STK.z], r * 0.97, STOL, STOL + STK.med); });
    }
    yield;

    // ── 3. drvena žlica za med: glava s pet obruča, obli vrh, ulivena medom
    //    odozdo, drška ukoso gore lijevo izvan kadra; s dna glave curi mlaz
    //    meda u staklenku (u shaderu teče)
    const ZL = (function () {
      const g = izSlikeZ(MJ.zlica.glava[0], MJ.zlica.glava[1], STK.z), d = norm3(MJ.zlica.smjer);
      const xm = izSlike(MJ.zlica.mlaz, 760, STOL)[0];
      return { c: g, d: d, R: 0.17, pola: 0.27, mlazX: xm, mlazVrh: g[1] - 0.165, mlazDno: STOL + STK.med + 0.004 };
    })();
    {
      const c = ZL.c, d = ZL.d, R = ZL.R, H = ZL.pola;
      const e1 = norm3(kriz([0, 1, 0], d)), e2 = kriz(d, e1);
      // glava: tijelo vrtnje oko osi d; profil po duljini (t od −1 kod drške do 1 na vrhu)
      const polumjer = function (t) {
        const g = (t + 1) / 2 * 5, obruc = 0.5 + 0.5 * Math.cos(2 * Math.PI * (g - 0.5));
        const kupola = Math.sqrt(Math.max(0, 1 - Math.pow(sat((Math.abs(t) - 0.8) / 0.2), 2)));
        return R * (0.78 + 0.22 * obruc) * kupola;
      };
      yield* cijev(S, function (t) { const s = lerp(-H, H, t); return [c[0] + d[0] * s, c[1] + d[1] * s, c[2] + d[2] * s]; }, {
        r: function (t) { return Math.max(0.004, polumjer(2 * t - 1)); }, gusto: 0.9,
        boja: function (T, t, a, rr) {
          const dolje = sat(-T.ny * 1.3), svj = osunceno(T), g = (t * 5) % 1, brazda = korakG(0.35, 0.5, Math.abs(g - 0.5) * 2) * 0.0 + (1 - korakG(0.86, 1, rr / R));
          let col = mijesaj(C.zlicaGlavaTamno, C.zlicaGlava, 0.3 + 0.7 * svj);
          col = mijesaj(col, C.zlicaGlavaTamno, 0.5 * brazda);
          col = puta(col, 0.85 + 0.3 * pjega(t * 9, a * 0.6, 1, 1));
          col = mijesaj(col, C.zlicaMed, 0.75 * dolje);                        // ulivena medom
          col = mijesaj(col, C.mlazSjaj, 0.35 * dolje * Math.pow(Math.max(0, T.nz), 3));
          return tvar(col, 0.8, 0.4, 1.0, V.OBICNO, SK.zlica, 3);
        }
      });
      // drška: ravan štap od glave prema gore lijevo (izvan kadra se utopi)
      const A = [c[0] - d[0] * H * 0.95, c[1] - d[1] * H * 0.95, c[2] - d[2] * H * 0.95], Bq = [c[0] - d[0] * 1.9, c[1] - d[1] * 1.9, c[2] - d[2] * 1.9];
      yield* cijev(S, function (t) { return [lerp(A[0], Bq[0], t), lerp(A[1], Bq[1], t), lerp(A[2], Bq[2], t)]; }, {
        r: function (t, a) { return 0.043 * (1 + 0.04 * Math.cos(2 * a)); },
        boja: function (T, t, a) {
          const svj = osunceno(T);
          let col = mijesaj(C.zlicaTamno, C.zlicaDrvo, 0.25 + 0.75 * svj);
          col = puta(col, 0.85 + 0.3 * pjega(t * 14, a * 0.8, 2, 1) * (0.6 + 0.4 * pjega(t * 60, a, 3, 1)));
          return tvar(col, 0.8, 0.4, 1.0, V.OBICNO, SK.zlica, 3);
        }
      });
      // mlaz meda: s dna glave okomito u staklenku; gore širi (sloj meda koji se odvaja), dolje tanka nit
      const vrh = [ZL.mlazX, ZL.mlazVrh, STK.z], dno = [ZL.mlazX, ZL.mlazDno, STK.z];
      yield* cijev(S, function (t) { return [vrh[0] + 0.004 * Math.sin(t * 7), lerp(vrh[1], dno[1], t), vrh[2]]; }, {
        r: function (t, a) { return 0.009 + 0.03 * Math.pow(1 - t, 2.2) * (1 + 0.25 * Math.cos(2 * a)); }, gusto: 0.8,
        boja: function (T, t, a) {
          const col = mijesaj(C.mlaz, C.mlazSjaj, 0.25 + 0.5 * Math.pow(1 - Math.abs(T.nz - 0.6), 2));
          return tvar(col, 0.5, 0.75, 1.1, V.MLAZ, SK.zlica, 3);
        }
      });
      // kapi koje vise s dna glave
      const KAPI2 = [[-0.09, 0.03], [0.07, -0.02]];
      for (let i = 0; i < KAPI2.length; i++) {
        const k = KAPI2[i], p0 = [ZL.mlazX + k[0], ZL.mlazVrh + 0.01, STK.z + k[1]];
        yield* cijev(S, function (t) { return [p0[0], p0[1] - 0.06 * t, p0[2]]; }, {
          r: function (t) { return 0.012 * Math.sqrt(Math.max(0, 1 - t)) + 0.004 * (1 - t); },
          boja: function (T) { return tvar(mijesaj(C.mlaz, C.mlazSjaj, 0.3), 0.5, 0.7, 1.0, V.MED, SK.zlica, 3); }
        });
      }
      zaklon(3, c, H + R, function (x, y, z) { return sdKapsula(x, y, z, [c[0] - d[0] * H * 0.75, c[1] - d[1] * H * 0.75, c[2] - d[2] * H * 0.75], [c[0] + d[0] * H * 0.75, c[1] + d[1] * H * 0.75, c[2] + d[2] * H * 0.75], R * 0.96); });
      zaklon(3, [(A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2, (A[2] + Bq[2]) / 2], Math.hypot(A[0] - Bq[0], A[1] - Bq[1], A[2] - Bq[2]) / 2 + 0.05, function (x, y, z) { return sdKapsula(x, y, z, A, Bq, 0.04); });
    }
    yield;

    // ── 4. limuni: dva cijela (jajoliki, s bradavicom; prvi sa stabljikom i
    //    dva lista) i prerezana polovica s licem prema nama (kora, bijeli
    //    rub, kriške s opnama); list pod drugim limunom
    const LIM = {};
    function* limun(id, dnoPx, R, nagib, skupina) {
      const dno = izSlike(dnoPx[0], dnoPx[1], STOL), c = [dno[0], STOL + R[1], dno[2]];
      const M = matrica(0, 0, nagib), lok = uLokalno(M, c);
      const sdf = function (x, y, z) {
        const p = lok(x, y, z), rx = R[0], brad = 0.05 * Math.exp(-((p[1] * p[1] + p[2] * p[2]) / 0.004)) * korakG(0.6, 1, p[0] / rx);   // bradavica na desnom kraju
        const kv = 0.004 * sum(x * 60, y * 60, z * 60) + 0.002 * sum(x * 140, y * 140, z * 140);
        return sdElipsoid(p[0], p[1], p[2], rx, R[1], R[2]) - brad - kv;
      };
      yield* rezSDF(S, sdf, [c[0] - R[0] - 0.08, c[0] + R[0] + 0.08, c[1] - R[1] - 0.02, c[1] + R[1] + 0.05, c[2] - R[2] - 0.05, c[2] + R[2] + 0.05], {
        osi: 'y',
        boja: function (T) {
          const svj = osunceno(T);
          let col = mijesaj(C.limunSjena, C.limun, 0.4 + 0.6 * svj);
          col = mijesaj(col, C.limunSvjetlo, 0.6 * Math.pow(svj, 3));
          col = puta(col, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 90));
          return tvar(col, 0.7, 0.12, 1.2, V.OBICNO, skupina, id);
        }
      });
      zaklon(id, c, Math.max(R[0], R[1], R[2]) + 0.02, function (x, y, z) { const p = lok(x, y, z); return sdElipsoid(p[0], p[1], p[2], R[0], R[1], R[2]); });
      return { c: c, R: R, M: M };
    }
    LIM.l1 = yield* limun(4, MJ.limun1.dno, MJ.limun1.r, -0.35, SK.limuni);
    yield;
    LIM.l2 = yield* limun(6, MJ.limun2.dno, MJ.limun2.r, -0.2, SK.limuni);
    yield;
    {
      // polovica: pola kugle; prerez (disk) okrenut prema nama i malo gore lijevo
      const dno = izSlike(MJ.polovica.dno[0], MJ.polovica.dno[1], STOL), R = MJ.polovica.r, c = [dno[0], STOL + R * 0.96, dno[2] - 0.03];
      const nF = norm3(MJ.polovica.lice), M = premaSmjeru(nF);
      const prof = [];
      for (let k = 10; k >= 0; k--) { const f = (k + 0.3) / 10.3 * Math.PI / 2; prof.push([-R * Math.sin(f), R * Math.cos(f), 0]); }
      prof.push([0, R, 1], [0, R * 0.985, 2], [0, 0, 2]);
      yield* prsteni(S, prof, {
        M: M, pomak: c, tezina: function (y, r, ny, m) { return m === 2 ? 0.75 : 1; },
        boja: function (T, y, r, a, ny, m) {
          let col;
          if (m === 2) {
            const rr = r / R, seg = 10, ka = (a * seg / (2 * Math.PI) + 0.3) % 1, opna = Math.min(ka, 1 - ka) * 2 * Math.PI * rr * R / seg;
            let jak = 1.1;
            if (rr > 0.9) { col = mijesaj(C.limunBijelo, C.limunKora, korakG(0.94, 1, rr) * 0.7); jak = 1.4; }   // bijeli rub i kora
            else if (opna < 0.01 || rr < 0.05) { col = C.limunOpna; jak = 1.3; }                                // opne i sredina
            else col = mijesaj(C.limunMeso, C.limunMesoSvjetlo, 0.25 * pjega(a * 14, rr * 40, 1, 1) + 0.35 * korakG(0.76, 0.9, rr) + 0.25 * (1 - korakG(0.05, 0.3, rr)));
            return tvar(puta(col, 0.95 + 0.12 * pjega(T.x, T.y, T.z, 70)), 0.45, 0.5, jak, V.OBICNO, SK.limuni, 5);
          }
          const svj = osunceno(T);
          col = mijesaj(C.limunSjena, C.limun, 0.4 + 0.6 * svj);
          col = mijesaj(col, C.limunSvjetlo, m === 1 ? 0.4 : 0.5 * Math.pow(svj, 3));
          return tvar(puta(col, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 90)), 0.7, 0.12, 1.2, V.OBICNO, SK.limuni, 5);
        }
      });
      // opne među kriškama kao radijalne niti po prerezu, i bijeli rub
      const ex = primijeni(M, [1, 0, 0]), ez = primijeni(M, [0, 0, 1]);
      for (let j = 0; j < 10; j++) {
        const a = (j + 0.3) * 2 * Math.PI / 10, ca = Math.cos(a), sa = Math.sin(a);
        S.nit(function (u, T) {
          const rr = 0.05 + u * 0.85, r = rr * R;
          T.x = c[0] + (ex[0] * ca + ez[0] * sa) * r + nF[0] * 0.004; T.y = c[1] + (ex[1] * ca + ez[1] * sa) * r + nF[1] * 0.004; T.z = c[2] + (ex[2] * ca + ez[2] * sa) * r + nF[2] * 0.004;
          T.nx = nF[0]; T.ny = nF[1]; T.nz = nF[2];
          return tvar(C.limunOpna, 0.4, 0.5, 1.2, V.OBICNO, SK.limuni, 5);
        }, 0.85 * R, 0.9, false);
      }
      zaklon(5, c, R + 0.02, function (x, y, z) { return Math.hypot(x - c[0], y - c[1], z - c[2]) - R; });
    }
    yield;
    // listovi: plahta duž krivulje od peteljke do vrha, malo udubljena, sa žilama
    function* list(odPx, doPx, yOd, yDo, W, sk, objekt, gore) {
      const A = izSlikeZ(odPx[0], odPx[1], yOd[1]); A[1] = yOd[0];
      const Bq = izSlikeZ(doPx[0], doPx[1], yDo[1]); Bq[1] = yDo[0];
      const Ap = izSlike(odPx[0], odPx[1], yOd[0]), Bp = izSlike(doPx[0], doPx[1], yDo[0]);
      A[0] = Ap[0]; A[2] = Ap[2]; Bq[0] = Bp[0]; Bq[2] = Bp[2];
      const d = norm3([Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]]), L = Math.hypot(Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]);
      const nl = norm3(gore || [0, 1, 0.25]), e = norm3(kriz(d, nl)), nn = kriz(e, d);
      yield* plahta(S, function (u, v) {
        const w = W * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.7), s = 2 * v - 1;
        const uv = 0.03 * s * s + 0.012 * Math.sin(u * 7) + 0.05 * u * u;
        return [A[0] + d[0] * L * u + e[0] * w * s + nn[0] * uv, A[1] + d[1] * L * u + e[1] * w * s + nn[1] * uv, A[2] + d[2] * L * u + e[2] * w * s + nn[2] * uv];
      }, {
        gore: true,
        boja: function (T, u, v) {
          const s = Math.abs(2 * v - 1), svj = osunceno(T);
          let col = mijesaj(C.listTamno, C.list, 0.4 + 0.6 * svj);
          col = mijesaj(col, C.listSvjetlo, 0.35 * svj * svj + 0.2 * pjega(u * 6, v * 5, sk, 1));
          if (s < 0.06) col = mijesaj(col, C.listZila, 0.6);                                       // glavna žila
          else if (Math.abs(((v * 8) % 1) - 0.5) < 0.05) col = mijesaj(col, C.listZila, 0.3);       // bočne žile
          return tvar(col, 0.6, 0.4, 1.0, V.OBICNO, sk, objekt);
        }
      });
    }
    {
      const l1 = LIM.l1, vrh = l1.c[1] + l1.R[1] * 0.92;
      // stabljika gore na prvom limunu, kratka, odrezana
      const sPx = MJ.listA.od, s0 = izSlikeZ(sPx[0], sPx[1], l1.c[2]), s1 = izSlikeZ(sPx[0] + 12, sPx[1] - 50, l1.c[2]);
      s0[1] = vrh - 0.02;
      yield* cijev(S, function (t) { return [lerp(s0[0], s1[0], t), lerp(s0[1], s1[1], t), lerp(s0[2], s1[2], t)]; }, {
        r: function (t) { return 0.022 * (1 - 0.3 * t) + 0.012 * korakG(0.9, 1, t); },
        boja: function (T, t) { return tvar(mijesaj(C.peteljka, C.list, 0.3 + 0.3 * t), 0.7, 0.4, 1.0, V.OBICNO, SK.limuni, 4); }
      });
      // veliki list preko vrha limuna ulijevo, manji gore desno, treći pod drugim limunom
      yield* list(MJ.listA.od, MJ.listA.do, [vrh, l1.c[2]], [vrh - 0.2, l1.c[2] + 0.25], 0.16, SK.limuni, 4, [0.2, 1, 0.3]);
      yield* list(MJ.listB.od, MJ.listB.do, [vrh + 0.03, l1.c[2]], [vrh + 0.22, l1.c[2] - 0.2], 0.1, SK.limuni, 4, [-0.2, 1, 0.3]);
      yield* list(MJ.listC.od, MJ.listC.do, [STOL + 0.015, 0], [STOL + 0.03, 0], 0.12, SK.limuni, 6, [0, 1, 0.1]);
    }
    yield;

    // ── 5. štapići cimeta: tri smotana štapića (po duljini brazda smotka,
    //    spirala kore na krajevima), dva na platnu i jedan preko njih
    for (let i = 0; i < MJ.cimet.length; i++) {
      const k = MJ.cimet[i], r0 = 0.07, y = STOL + r0 * k[2];
      const A = izSlike(k[0][0], k[0][1], y), Bq = izSlike(k[1][0], k[1][1], y);
      const f0 = [0.9, 2.6, -0.7][i];
      const put = function (t) { return [lerp(A[0], Bq[0], t), y, lerp(A[2], Bq[2], t)]; };
      const polumjer = function (t, a) {
        let d = ((a - f0 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        return r0 * (1 + 0.06 * Math.cos(2 * a + f0) - 0.2 * Math.exp(-d * d / 0.08));
      };
      yield* cijev(S, put, {
        r: polumjer, gusto: 1.0,
        boja: function (T, t, a, r) {
          const brazda = korakG(r0 * 0.97, r0 * 0.86, r), svj = osunceno(T);
          let col = mijesaj(C.cimet, C.cimetSvjetlo, 0.2 + 0.6 * svj + 0.25 * pjega(t * 7 + i, a * 0.5, i, 1.0));
          col = mijesaj(col, C.cimetTamno, brazda);
          col = puta(col, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 45));
          return tvar(col, 0.8, 0.4, 1.0, V.OBICNO, SK.cimet, 8 + i);
        }
      });
      // spirala kore na krajevima (dvostruki smotak)
      const tg = norm3([Bq[0] - A[0], 0, Bq[2] - A[2]]), e1 = norm3(kriz([0, 1, 0], tg)), e2 = kriz(tg, e1);
      [[A, -1], [Bq, 1]].forEach(function (kraj) {
        const Pk = kraj[0], sm = kraj[1];
        for (let s2 = 0; s2 < 2; s2++) {
          S.nit(function (u, T) {
            const s = u, r = r0 * 0.9 * (1 - 0.8 * s), a = f0 + s2 * Math.PI + 2 * 2 * Math.PI * s;
            T.x = Pk[0] + e1[0] * r * Math.cos(a) + e2[0] * r * Math.sin(a); T.y = Pk[1] + e1[1] * r * Math.cos(a) + e2[1] * r * Math.sin(a); T.z = Pk[2] + e1[2] * r * Math.cos(a) + e2[2] * r * Math.sin(a);
            T.nx = tg[0] * sm; T.ny = 0; T.nz = tg[2] * sm;
            return tvar(mijesaj(C.cimetKraj, C.cimetTamno, 0.5 + 0.5 * Math.sin(s * 18)), 0.7, 0.4, 1.1, V.OBICNO, SK.cimet, 8 + i);
          }, 2 * Math.PI * r0 * 0.9 * 2 * 0.6, 1, false);
        }
      });
      zaklon(8 + i, [(A[0] + Bq[0]) / 2, y, (A[2] + Bq[2]) / 2], Math.hypot(A[0] - Bq[0], A[2] - Bq[2]) / 2 + r0 + 0.02, function (x, y2, z) { return sdKapsula(x, y2, z, A, Bq, r0 * 0.95); });
    }
    yield;

    // ── 6. mahune vanilije: tri duge tamne, malo spljoštene i naborane mahune
    //    s uvijenim krajem, ukoso preko platna sprijeda
    for (let i = 0; i < MJ.vanilija.length; i++) {
      const k = MJ.vanilija[i], y = STOL + 0.016, A = izSlike(k[0][0], k[0][1], y), Bq = izSlike(k[1][0], k[1][1], y);
      const Cq = [(A[0] + Bq[0]) / 2 + (i - 1) * 0.04, y, (A[2] + Bq[2]) / 2 + [0.06, -0.05, 0.04][i]];
      yield* cijev(S, function (t) {
        const p = kvadratna(A, Cq, Bq, t), kuka = Math.exp(-t * t / 0.004);          // uvijeni kraj se diže i savija natrag
        return [p[0] + 0.03 * kuka, p[1] + 0.045 * kuka * (1 - t), p[2] + 0.02 * Math.sin(t * 11)];
      }, {
        r: function (t, a) { return 0.019 * (1 - 0.45 * Math.pow(t, 6)) * (1 + 0.12 * Math.cos(3 * a + t * 50)) * (0.6 + 0.4 * korakG(0, 0.03, t)); }, spljosti: 0.6, gusto: 1.2,
        boja: function (T, t, a) {
          const svj = osunceno(T);
          let col = mijesaj(C.vanilija, C.vanilijaSvjetlo, 0.2 + 0.5 * svj + 0.3 * pjega(t * 40 + i, a * 0.8, i, 1));
          col = mijesaj(col, C.vanilijaSjaj, 0.5 * Math.pow(svj, 4));
          return tvar(col, 0.9, 0.4, 1.0, V.OBICNO, SK.vanilija, 20 + i);
        }
      });
    }
    yield;

    // ── 7. zrna tonke: pet tamnih, naboranih, sjajnih zrna ispred flakona lijevo
    for (let i = 0; i < MJ.tonka.length; i++) {
      const k = MJ.tonka[i], c = izSlike(k[0], k[1], STOL + 0.04), lok = uLokalno(matrica(k[2]), c), L = k[3] / 2, W = k[4] / 2;
      const sdf = function (x, y, z) {
        const p = lok(x, y, z);
        return sdElipsoid(p[0], p[1], p[2], L, 0.042, W) - 0.005 * sum(p[0] * 60 + i, p[1] * 60, p[2] * 60) - 0.004 * Math.abs(Math.sin(p[0] * 70 + 2 * sum(p[0] * 15, p[1] * 15, p[2] * 15)));
      };
      yield* rezSDF(S, sdf, [c[0] - L - 0.02, c[0] + L + 0.02, c[1] - 0.05, c[1] + 0.06, c[2] - L - 0.02, c[2] + L + 0.02], {
        h: S.korak * 0.3, bezDna: true,
        boja: function (T) {
          const svj = osunceno(T), rub = Math.pow(1 - Math.abs(T.nz), 1.5);
          let col = mijesaj(C.tonka, C.tonkaSvjetlo, 0.3 + 0.6 * pjega(T.x, T.y, T.z, 40) * (0.4 + 0.6 * svj));
          col = mijesaj(col, C.tonkaRub, 0.7 * rub * (0.3 + 0.7 * svj));
          return tvar(col, 1.0, 0.25, 1.1, V.OBICNO, SK.tonka, 30 + i);
        }
      });
      zaklon(30 + i, c, L + 0.02, function (x, y, z) { const p = lok(x, y, z); return sdElipsoid(p[0], p[1], p[2], L, 0.042, W); });
    }
    yield;

    // ── 8. lavanda: tri grančice položene desno sprijeda, cvatovi od
    //    cvjetića u klasu, stabljike prema desno straga; raspršeni cvjetići
    for (let i = 0; i < MJ.lavanda.length; i++) {
      const k = MJ.lavanda[i];
      const y = STOL + 0.028, H0 = izSlike(k[0][0], k[0][1], y), H1 = izSlike(k[1][0], k[1][1], y), S1 = izSlike(k[2][0], k[2][1], y);
      const nCv = 9 + i, f0 = i * 2.1;
      yield* cijev(S, function (t) { return [lerp(H0[0], H1[0], t), y + 0.01 * Math.sin(t * 5 + i), lerp(H0[2], H1[2], t)]; }, {
        r: function (t, a) {
          const cvj = Math.abs(Math.cos(Math.PI * t * nCv)), tanak = 1 - 0.5 * korakG(0, 0.12, 1 - t) * 0;
          return (0.012 + 0.04 * (0.4 + 0.6 * cvj) * (0.7 + 0.3 * korakG(0, 0.2, t))) * (1 + 0.2 * Math.cos(2 * a + f0 + t * 9)) * tanak;
        }, spljosti: 0.75, gusto: 0.85,
        boja: function (T, t, a, r) {
          const cvj = Math.abs(Math.cos(Math.PI * t * nCv)), svj = osunceno(T);
          let col = mijesaj(C.lavandaTamno, C.lavanda, 0.3 + 0.7 * svj);
          col = mijesaj(col, C.lavandaSvjetlo, 0.5 * cvj * svj + 0.2 * pjega(t * 30, a * 1.5, i, 1));
          if (cvj < 0.25) col = mijesaj(col, C.caska, 0.5);
          return tvar(col, 0.75, 0.45, 1.25, V.OBICNO, SK.lavanda, 40 + i);
        }
      });
      yield* cijev(S, function (t) { return [lerp(H1[0], S1[0], t), y - 0.012 + 0.008 * Math.sin(t * 4), lerp(H1[2], S1[2], t)]; }, {
        r: function () { return 0.011; },
        boja: function (T, t) { return tvar(mijesaj(C.stabljika, C.caska, 0.3 * pjega(t * 20, i, 1, 1)), 0.7, 0.4, 0.9, V.OBICNO, SK.lavanda, 40 + i); }
      });
      if (i === 1) yield;
    }
    // raspršeni cvjetići lavande po platnu
    for (let i = 0; i < 16; i++) {
      const px = i < 9 ? 545 + rnd() * 120 : 690 + rnd() * 230, py = i < 9 ? 845 + rnd() * 45 : 805 + rnd() * 70;
      const c = izSlike(px, py, STOL + 0.012), kut = rnd() * Math.PI, lok = uLokalno(matrica(kut), c);
      yield* rezSDF(S, function (x, y, z) { const p = lok(x, y, z); return sdElipsoid(p[0], p[1], p[2], 0.022, 0.011, 0.012); },
        [c[0] - 0.03, c[0] + 0.03, c[1] - 0.015, c[1] + 0.015, c[2] - 0.03, c[2] + 0.03], {
          h: S.korak * 0.3, bezDna: true, osi: 'y',
          boja: function (T) { return tvar(mijesaj(C.lavanda, C.lavandaSvjetlo, 0.5 * rnd()), 0.7, 0.45, 1.0, V.OBICNO, SK.lavanda, 0); }
        });
    }
    yield;

    // ── 9. hrpa duhana lijevo sprijeda: humak od usitnjenih, uvijenih listova:
    //    tamna masa (vodoravni rezovi) i preko nje desetci uvijenih traka
    const DUH = (function () { const c = izSlike(MJ.duhan.sredina[0], MJ.duhan.sredina[1], STOL); return { c: [c[0], STOL + 0.02, c[2]], R: MJ.duhan.r }; })();
    {
      const c = DUH.c, R = DUH.R;
      const sdf = function (x, y, z) {
        const kv = 0.06 * sum(x * 4, y * 4, z * 4) + 0.025 * sum(x * 11 + 3, y * 11, z * 11) + 0.01 * sum(x * 30, y * 30, z * 30);
        return sdElipsoid(x - c[0], y - c[1], z - c[2], R[0], R[1], R[2]) - kv;
      };
      yield* rezSDF(S, sdf, [c[0] - R[0] - 0.1, c[0] + R[0] + 0.1, STOL + 0.005, c[1] + R[1] + 0.1, c[2] - R[2] - 0.1, c[2] + R[2] + 0.1], {
        osi: 'y', tezina: 0.8,
        boja: function (T) {
          const svj = osunceno(T);
          let col = mijesaj(C.duhanCrno, C.duhan, 0.1 + 0.6 * svj * svj);
          col = mijesaj(col, C.duhanSvjetlo, 0.3 * Math.pow(svj, 3) * pjega(T.x, T.y, T.z, 25));
          col = puta(col, 0.75 + 0.4 * pjega(T.x, T.y, T.z, 60));
          return tvar(col, 0.55, 0.35, 0.55, V.OBICNO, SK.duhan, 7);
        }
      });
      yield;
      // trake: uvijeni komadi lista po površini humka
      for (let i = 0; i < 26; i++) {
        const a = rnd() * 2 * Math.PI, rr = Math.sqrt(rnd()) * 0.95;
        const px0 = c[0] + R[0] * rr * Math.cos(a), pz0 = c[2] + R[2] * rr * Math.sin(a);
        // visina humka na tom mjestu (pretraga po y)
        let yh = STOL;
        for (let y = c[1] + R[1] + 0.1; y > STOL; y -= 0.01) if (sdf(px0, y, pz0) < 0) { yh = y; break; }
        const kut = rnd() * Math.PI, d = [Math.cos(kut), 0, Math.sin(kut)], e = [-d[2], 0, d[0]];
        const L = 0.18 + 0.3 * rnd(), W = 0.025 + 0.035 * rnd(), uvoj = 0.04 + 0.08 * rnd(), nag = (rnd() - 0.5) * 0.4, s0 = rnd() * 7;
        yield* plahta(S, function (u, v) {
          const s = 2 * v - 1, uu = 2 * u - 1;
          const y = yh + 0.01 + uvoj * (s * s * 0.6 + uu * uu * 0.4) + nag * uu * L + 0.012 * Math.sin(uu * 9 + s0);
          return [px0 + d[0] * L * uu + e[0] * W * s, y, pz0 + d[2] * L * uu + e[2] * W * s];
        }, {
          gore: true, razmak: 0.8,
          boja: function (T, u, v) {
            const svj = osunceno(T);
            let col = mijesaj(C.duhanTamno, C.duhanSvjetlo, 0.1 + 0.6 * svj * (0.5 + 0.5 * pjega(u * 5 + s0, v * 3, i, 1)));
            if (Math.abs(((v * 5) % 1) - 0.5) < 0.07) col = mijesaj(col, C.duhanTamno, 0.4);
            return tvar(col, 0.6, 0.35, 0.55, V.OBICNO, SK.duhan, 7);
          }
        });
        if (i % 11 === 10) yield;
      }
      zaklon(7, c, Math.max(R[0], R[2]) + 0.05, function (x, y, z) { return sdElipsoid(x - c[0], y - c[1], z - c[2], R[0] * 0.98, R[1] * 0.95, R[2] * 0.98); });
    }
    yield;

    // ── 10. cvjetovi naranče uz dno flakona lijevo: grančica s dva lista,
    //     četiri bijela cvijeta s pet latica i žutim prašnicima, pupoljci
    {
      const cv = MJ.cvjetovi;
      yield* list(cv.list1[0], cv.list1[1], [STOL + 0.03, 0], [STOL + 0.13, 0], 0.13, SK.cvjetovi, 50, [0.1, 1, 0.25]);
      yield* list(cv.list2[0], cv.list2[1], [STOL + 0.04, 0], [STOL + 0.1, 0], 0.09, SK.cvjetovi, 50, [-0.1, 1, 0.25]);
      for (let i = 0; i < cv.cvijet.length; i++) {
        const k = cv.cvijet[i];
        const c = izSlike(k[0], k[1], STOL + k[2]), n = norm3(k[3]), M = premaSmjeru(n), Rl = k[4] * 0.95;
        const up = primijeni(M, [0, 1, 0]);
        // pet latica: plahte od sredine prema vrhu (niti duž latice), blago
        // udubljene, prema vrhu podignute
        for (let j = 0; j < 5; j++) {
          const a = j * 2 * Math.PI / 5 + i * 0.6, dl = primijeni(M, [Math.cos(a), 0, Math.sin(a)]), e = norm3(kriz(up, dl));
          yield* plahta(S, function (u, v) {
            const sv = 2 * v - 1, w = Rl * 0.3 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + u * 0.95)), 0.8);
            const r = 0.03 + u * (Rl - 0.03), dig = 0.012 * sv * sv + 0.07 * u * u;
            return [c[0] + dl[0] * r + e[0] * w * sv + up[0] * dig, c[1] + dl[1] * r + e[1] * w * sv + up[1] * dig, c[2] + dl[2] * r + e[2] * w * sv + up[2] * dig];
          }, {
            gore: true, razmak: 0.5,                                                      // latice su uske: gušće niti, da budu pune
            boja: function (T, u, v) {
              const svj = osunceno(T);
              let col = mijesaj(C.laticaSjena, C.latica, 0.4 + 0.6 * svj);
              col = mijesaj(col, C.prasnici, 0.25 * (1 - korakG(0.05, 0.3, u)));           // uz sredinu žućkasto
              return tvar(col, 0.4, 0.55, 0.9, V.OBICNO, SK.cvjetovi, 50);
            }
          });
        }
        // sredina: žuti prašnici oko tučka
        const lok = uLokalno(M, c);
        // cvijet zaklanja platno pod sobom (inače bi platno ondje uzelo bijelu boju latica s fotografije)
        (function (lok2, R2) { zaklon(50, c, R2 + 0.02, function (x, y, z) { const q = lok2(x, y, z); return sdElipsoid(q[0], q[1] - 0.01, q[2], R2, 0.03, R2); }); })(lok, Rl * 0.82);
        yield* rezSDF(S, function (x, y, z) { const p = lok(x, y, z); return Math.hypot(p[0], (p[1] - 0.018) * 1.3, p[2]) - 0.03 - 0.006 * sum(p[0] * 120, p[1] * 120, p[2] * 120); },
          [c[0] - 0.05, c[0] + 0.05, c[1] - 0.04, c[1] + 0.07, c[2] - 0.05, c[2] + 0.05], {
            h: S.korak * 0.3, osi: 'y',
            boja: function (T) { return tvar(mijesaj(C.prasnici, C.tucak, 0.4 * pjega(T.x, T.y, T.z, 150)), 0.5, 0.5, 1.0, V.OBICNO, SK.cvjetovi, 50); }
          });
        yield;
      }
      for (let i = 0; i < cv.pupoljci.length; i++) {
        const k = cv.pupoljci[i], c = izSlike(k[0], k[1], STOL + 0.03), lok = uLokalno(matrica(rnd() * 3, 0.4), c);
        yield* rezSDF(S, function (x, y, z) { const p = lok(x, y, z); return sdElipsoid(p[0], p[1], p[2], 0.022, 0.045, 0.022); },
          [c[0] - 0.06, c[0] + 0.06, c[1] - 0.06, c[1] + 0.06, c[2] - 0.06, c[2] + 0.06], {
            h: S.korak * 0.3, osi: 'y',
            boja: function (T) { return tvar(mijesaj(C.pupoljak, C.tucak, 0.3 * (1 - korakG(-0.02, 0.03, T.y - c[1]))), 0.5, 0.5, 1.0, V.OBICNO, SK.cvjetovi, 50); }
          });
      }
    }
    yield;

    // ── 11. laneno platno: od daleka (z ≈ −3) do poruba koji ide ukoso
    //     (lijevo bliže, desno dalje naprijed, preko ruba stola); valovito,
    //     s tkanjem u dva smjera; boja točno s fotografije (sa sjenama)
    const PL = (function () {
      const a = izSlike(MJ.platno.porub[0][0], MJ.platno.porub[0][1], STOL), b = izSlike(MJ.platno.porub[1][0], MJ.platno.porub[1][1], STOL);
      const ra = izSlike(MJ.stol.rub[0][0], MJ.stol.rub[0][1], STOL), rb = izSlike(MJ.stol.rub[1][0], MJ.stol.rub[1][1], STOL);
      const lijevo = izSlike(MJ.platno.lijevo, 780, STOL)[0];
      return {
        porub: function (x) { return lerp(a[2], b[2], (x - a[0]) / (b[0] - a[0])); },
        rub: function (x) { return lerp(ra[2], rb[2], (x - ra[0]) / (rb[0] - ra[0])); },
        lijevo: lijevo, daleko: -3.1, a: a, b: b
      };
    })();
    const sjeme = function (x, z) { return STOL + 0.012 * sum(x * 1.4, z * 1.1, 0.3) + 0.004 * sum(x * 9, z * 7, 1); };
    {
      const ZD = PL.daleko, X0 = -2.5, X1 = 2.5;
      yield* plahta(S, function (u, v) {
        const x = lerp(X0, X1, u), z = lerp(ZD, Math.min(PL.porub(x), PL.rub(x)), v);
        return [x, sjeme(x, z), z];
      }, {
        gore: true, poprijeko: 0.45, tezina: 0.9,
        boja: function (T, u, v) {
          const x = T.x, z = T.z;
          if (z > PL.porub(x) - 0.01 || (x < PL.lijevo && z > -0.75)) return false;           // izvan platna
          const col = fotoNa([x, T.y, z], [0.85, 0.75, 0.6]);
          const jak = 0.9 * (1 - korakG(-2.4, ZD + 0.05, z)) * (1 - korakG(2.0, 2.5, Math.abs(x)));
          if (jak < 0.03) return false;
          return tvar(puta(col, 1.05), 0.3, 0.6, jak, V.TKANINA, SK.stol, 0);
        }
      });
      yield;
      // porub: zavinuti rub platna uz sunce (svijetao), od lijevog ruba do kraja desno
      const a = PL.a, b = PL.b, L = Math.hypot(b[0] - a[0], b[2] - a[2]);
      yield* cijev(S, function (t) { const x = lerp(a[0], b[0] + 0.3, t); return [x, sjeme(x, PL.porub(x)) + 0.02, PL.porub(x) - 0.012 + 0.01 * Math.sin(t * 13)]; }, {
        r: function (t, an) { return 0.026 * (1 + 0.1 * Math.cos(an)); }, spljosti: 0.8,
        boja: function (T, t) {
          const col = mijesaj(fotoNa([T.x, T.y, T.z], C.porub), C.porub, 0.45 + 0.4 * sat(T.ny));
          return tvar(col, 0.45, 0.5, 1.0 * (1 - korakG(2.0, 2.5, Math.abs(T.x))), V.TKANINA, SK.stol, 0);
        }
      });
      // lijevi rub platna (kratki zavinuti rub ispred duhana)
      yield* cijev(S, function (t) { const z = lerp(-0.75, PL.porub(PL.lijevo), t); return [PL.lijevo, sjeme(PL.lijevo, z) + 0.015, z]; }, {
        r: function () { return 0.022; },
        boja: function (T) { return tvar(mijesaj(fotoNa([T.x, T.y, T.z], C.porub), C.porub, 0.4), 0.45, 0.5, 0.9, V.TKANINA, SK.stol, 0); }
      });
      // gdje porub prelazi rub stola, platno visi preko ruba
      const xK = (function () { for (let x = -1; x < 2.5; x += 0.01) if (PL.porub(x) > PL.rub(x)) return x; return 2.5; })();
      if (xK < 2.4) {
        yield* plahta(S, function (u, v) { const x = lerp(xK, 2.5, u); return [x, STOL - 0.36 * v - 0.02 * v * v, PL.rub(x) + 0.03 - 0.02 * v + 0.01 * Math.sin(x * 9)]; }, {
          tezina: 0.85, poprijeko: 0.4,
          boja: function (T, u, v) {
            const jak = 0.9 * (1 - korakG(0.6, 1, v)) * (1 - korakG(2.0, 2.5, Math.abs(T.x))) * korakG(0, 0.06, u);
            if (jak < 0.03) return false;
            return tvar(fotoNa([T.x, T.y, T.z], [0.75, 0.65, 0.5]), 0.3, 0.6, jak, V.TKANINA, SK.stol, 0);
          }
        });
      }
    }
    yield;

    // ── 12. drveni stol: ploha ispred platna (lijevo i sprijeda), istrošeni
    //     prednji brid i prednja stranica; žile duž dasaka; boja s fotografije
    {
      const X0 = -2.5, X1 = 2.5;
      yield* plahta(S, function (u, v) {
        const x = lerp(X0, X1, u), z0 = x < PL.lijevo ? -0.75 : PL.porub(x), z = lerp(Math.min(z0, PL.rub(x)), PL.rub(x), v);
        return [x, STOL - 0.012 + 0.003 * sum(x * 3, z * 25, 2), z];
      }, {
        gore: true, tezina: 0.8, razmak: 1.1,
        boja: function (T, u, v) {
          const x = T.x, z = T.z;
          if (z < -0.75 && x < PL.lijevo) return false;
          const jak = 0.9 * (1 - korakG(2.0, 2.5, Math.abs(x)));
          if (jak < 0.03) return false;
          const zila = 0.85 + 0.3 * pjega(x * 1.2, z * 12, 1, 1);
          return tvar(puta(fotoNa([x, T.y, z], [0.5, 0.33, 0.18]), zila), 0.35, 0.6, jak, V.TKANINA, SK.stol, 0);
        }
      });
      yield;
      // prednja stranica stola (ispod ruba), prema dolje se utopi
      yield* plahta(S, function (u, v) { const x = lerp(X0, X1, u); return [x, STOL - 0.012 - 0.5 * v, PL.rub(x) - 0.01 * v + 0.004 * sum(x * 2, v * 20, 5)]; }, {
        tezina: 0.8, razmak: 1.1,
        boja: function (T, u, v) {
          const jak = 0.9 * (1 - korakG(0.55, 1, v)) * (1 - korakG(2.0, 2.5, Math.abs(T.x)));
          if (jak < 0.03) return false;
          const zila = 0.85 + 0.3 * pjega(T.x * 1.5, v * 10, 7, 1);
          return tvar(puta(fotoNa([T.x, T.y, T.z], [0.3, 0.18, 0.08]), zila), 0.35, 0.6, jak, V.TKANINA, SK.stol, 0);
        }
      });
      // istrošeni brid
      yield* cijev(S, function (t) { const x = lerp(X0, X1, t); return [x, STOL - 0.02, PL.rub(x) - 0.01]; }, {
        r: function () { return 0.03; }, gusto: 1.1,
        boja: function (T) {
          const jak = 0.9 * (1 - korakG(2.0, 2.5, Math.abs(T.x)));
          if (jak < 0.03 || T.ny < -0.3) return false;
          return tvar(puta(fotoNa([T.x, T.y, T.z], [0.6, 0.4, 0.2]), 1.1), 0.5, 0.5, jak, V.TKANINA, SK.stol, 0);
        }
      });
    }
    yield;

    // ── 13. pozadina: kameni zid lijevo (redovi niti kao redovi kamena),
    //     maslina i tegle desno (meki krugovi rasapa, kao bokeh), sve u boji
    //     fotografije, zalijepljeno za ekran (prostor pogleda, z = −1.9) i
    //     utopljeno prema rubu prostora animacije
    {
      const ZV = -1.9, sk = (CAM - ZV) / CAM;      // piksel → prostor pogleda na dubini ZV (persp)
      const uPogledu = function (px, py) {
        const sx = (px - KAM_PX0) * KAM_K, sy = KAM_SY0 + (KAM_PY0 - py) * KAM_K;
        return [sx * sk, sy * sk, ZV];
      };
      const jacina = function (px, py) {
        const sx = (px - KAM_PX0) * KAM_K, sy = KAM_SY0 + (KAM_PY0 - py) * KAM_K;
        return (1 - korakG(0.72, 1.0, Math.abs(sx))) * (1 - korakG(0.82, 1.08, sy)) * korakG(MJ.obzor + 25, MJ.obzor - 40, py);
      };
      const zapis = function (T, px, py, jak, vrsta, velicina) {
        const q = uPogledu(px, py);
        T.x = q[0] / KOMP; T.y = (q[1] - POMAK) / KOMP; T.z = q[2] / KOMP;   // shader će primijeniti KOMP i POMAK
        T.nx = 0; T.ny = 0; T.nz = 1;
        tvar(foto(px, py, [0.6, 0.5, 0.4]), 0.0, 1.0, jak, vrsta, velicina, 0);
        T.pogled = true;
        return true;
      };
      // kameni zid: vodoravni redovi (razmak 7 px fotografije ≈ 1,6 razmaka niti), svaki kamen malo drukčije svjetline
      const XZID = 440;
      for (let py = 8; py < MJ.obzor + 20; py += 7) {
        const red = Math.floor(py / 72), pom = (red & 1) ? 75 : 0;
        S.nit(function (u, T) {
          const px = u * XZID;
          const kamen = Math.floor((px + pom) / 150), fuga = Math.abs(((py / 72) % 1) - 0.5) > 0.46 || Math.abs((((px + pom) / 150) % 1) - 0.5) > 0.47;
          const jak = jacina(px, py) * 0.7 * (0.75 + 0.5 * hash3(kamen, red, 1)) * (fuga ? 0.5 : 1) * (0.6 + 0.8 * pjega(px * 0.045, py * 0.045, red, 1));
          if (jak < 0.02) return false;
          return zapis(T, px, py, jak, V.POZADINA, 2);
        }, XZID * KAM_K * sk / KOMP, 0.9, false);
      }
      yield;
      // maslina, tegle, polica: rasap (bokeh); svjetlije mrlje su veće
      S.rasap(7000, function (T, r) {
        let px, py;
        const k = r();
        if (k < 0.55) { px = XZID + r() * (1024 - XZID); py = r() * 440; }                    // krošnja
        else if (k < 0.75) { px = 640 + r() * 384; py = 430 + r() * (MJ.obzor - 420); }       // tegle i nebo desno
        else if (k < 0.85) { px = 130 + r() * 560; py = 520 + r() * (MJ.obzor - 510); }       // polica iza
        else { px = r() * XZID; py = r() * (MJ.obzor + 10); }                                 // mekoća preko kamenog zida
        const col = foto(px, py), svj = 0.3 * col[0] + 0.6 * col[1] + 0.1 * col[2];
        const jak = jacina(px, py) * (0.6 + 0.5 * svj);
        if (jak < 0.02) return false;
        return zapis(T, px, py, jak, V.POZADINA, Math.min(15, Math.floor(3 + 10 * Math.pow(sat((svj - 0.4) / 0.4), 1.5) + 2 * r())));
      }, rnd);
    }
    yield;

    // ── 14. prašina u zraku na suncu (u shaderu lebdi)
    S.rasap(170, function (T, r) {
      T.x = lerp(-1.9, 1.9, r()); T.y = STOL + 0.15 + 2.0 * r(); T.z = lerp(-2.3, 0.4, r());
      T.nx = 0; T.ny = 0; T.nz = 1;
      return tvar(C.prasina, 0, 1, 0.22 + 0.3 * r(), V.PRASINA, SK.prasina, 0);
    }, rnd);

    return { mlaz: { vrh: ZL.mlazVrh, duljina: ZL.mlazVrh - ZL.mlazDno }, prasina: { dno: STOL + 0.15, visina: 2.0 } };
  }

  // ── gradnja u koracima: grubi prolaz brojanja (razmak 0,05), točni prolaz
  //    (svaka UZORAK-ta točkica, sa zaklonom), pa gradnja s razmakom za zadani
  //    broj točkica. o: n, flakon (generator iz pocetna-chata.js), sirinaFlakona(y),
  //    vrhCepa (y od kojeg je šiljak čepa), OMJER. Vraća { podaci, n, korak, mlaz, prasina }
  NAX.gradiKoraci = function* (o) {
    const n = Math.max(5000, o.n || 100000);
    const grubo = new Skupljac(0.05, 1);
    yield* gradi(grubo, o);
    let korak = 0.05 * Math.sqrt(grubo.n / n);
    yield;
    const tocno = new Skupljac(korak, 2);
    yield* gradi(tocno, o);
    korak *= Math.sqrt(Math.max(1e-6, tocno.n) / n);
    yield;
    const S = new Skupljac(korak, 0);
    const meta = yield* gradi(S, o);
    return { podaci: S.spremnik(), n: S.n, korak: korak, mlaz: meta.mlaz, prasina: meta.prasina };
  };
})();
