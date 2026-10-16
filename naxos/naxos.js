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
//  ali svaka točkica nosi boju s fotografije: svaka se projicira na
//  fotografiju (mala kopija fotografije je u ovoj datoteci) i uzme boju s
//  tog mjesta (predmeti je stope s bojom iz opisa predmeta, FOTO_UDIO), pa
//  su tu i sjene, odsjaji i sunčeva mrlja točno kao na fotografiji.
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
//  po 8 bitova). Pozadina (kameni zid, maslina, tegle) je od redova niti
//  u boji fotografije, zalijepljena za ekran (mjesto je u prostoru pogleda,
//  shader je ne okreće), pa se ne pomiče kad se prizor njiše; u zraku nema
//  ničega što lebdi. Što je iza drugih predmeta (gledano iz kamere), nema
//  točkica (zaklon), jer se točkice zbrajaju bez dubine.
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
  const V = { OBICNO: 0, FLAKON: 1, ZLATO: 2, TKANINA: 3, POZADINA: 4, MED: 6, STAKLENKA: 7, PLOCICA: 8, MLAZ: 9 };   // (5 je bila prašina u zraku, uklonjena)
  // skupine (4 bita): redoslijed nastanka iz izmaglice
  const SK = { flakon: 0, stol: 1, pozadina: 2, staklenka: 3, zlica: 4, limuni: 5, cimet: 6, vanilija: 7, tonka: 8, lavanda: 9, duhan: 10, cvjetovi: 11 };
  NAX.KOMP = KOMP; NAX.POMAK = POMAK; NAX.NAGIB = NAGIB; NAX.CAM = CAM; NAX.VRSTE = V; NAX.SKUPINE = SK; NAX.STOL = STOL;

  // ── boje s fotografije (uvijek #rrggbb)
  const BOJE = {
    flakonLijevo: '#e4cfb7', flakonDesno: '#f8ecdc', flakonDno: '#dccdbe',            // bijelo mutno staklo: topla lijeva strana (odsjaj meda), svijetla desna
    zlato: '#cf9a46', zlatoSvjetlo: '#e8bd6a', zlatoTamno: '#8a5f2a', zlatoSjaj: '#f6dc98',   // čep i prsten
    vrhCepa: '#e8dec0', vrhCepaRub: '#f4ecd4',                                           // prozirni blijedožuti šiljak čepa
    plocica: '#e2b25e', plocicaOkvir: '#ecd08f', znakX: '#f0cf86', slova: '#c7a068',     // pločica, okvir, znak X, natpis NAXOS
    staklenka: '#efdcb5', navoj: '#f6e6c4',                                              // staklo i navoji staklenke
    med: '#f58a18', medTamno: '#a86a16', medPovrsina: '#f0b048', medSjaj: '#fbd27a',      // med u staklenki
    mlaz: '#e9a23a', mlazSjaj: '#fbe0a0',                                                // mlaz meda sa žlice
    zlicaDrvo: '#cfa374', zlicaTamno: '#8a5f3c', zlicaGlava: '#a86b3a', zlicaGlavaTamno: '#4a2a18', zlicaMed: '#c7781e',
    limun: '#f4b41c', limunSvjetlo: '#f8c636', limunSjena: '#d68c08',
    limunMeso: '#c9922c', limunMesoSvjetlo: '#dfae48', limunOpna: '#f8ecc0', limunBijelo: '#f4e3b0', limunKora: '#e8c23a',
    list: '#4a5812', listSvjetlo: '#8a9a3a', listZila: '#a0b060', listTamno: '#303a0c', peteljka: '#9a7a40',
    cimet: '#ae6a32', cimetSvjetlo: '#cf9458', cimetTamno: '#6a3410', cimetKraj: '#be7c42',
    vanilija: '#3c2419', vanilijaSvjetlo: '#6b4530', vanilijaSjaj: '#9a6a4c',
    tonka: '#3a2c26', tonkaSvjetlo: '#6a5448', tonkaRub: '#a08270',
    lavanda: '#7f6fb4', lavandaSvjetlo: '#b3a3dc', lavandaTamno: '#54458a', caska: '#9a9a78', stabljika: '#8c9470',
    duhan: '#a8622a', duhanSvjetlo: '#c07838', duhanTamno: '#4e2409', duhanCrno: '#2a120a',
    latica: '#fbf8f0', laticaSjena: '#e4d9c4', prasnici: '#e8c868', tucak: '#b7c070', pupoljak: '#ece8d4',
    porub: '#f3e0c2'
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

  // ── mala kopija fotografije (256 × 256, malo zamućena): s nje se uzimaju
  //    boje platna, stola i pozadine, a i boje predmeta (vidi fotoBoja)
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
  // Boja predmeta: boja s mjesta fotografije na koje se točkica projicira,
  // stopljena s bojom iz opisa predmeta (proc) u udjelu k. Pretamni uzorak
  // (točkica na rubu predmeta pada na tamnu pozadinu, ili je geometrija malo
  // šira od predmeta na fotografiji) i presvijetli uzorak (tanki predmet na
  // zamućenoj kopiji uzme boju platna pod sobom) se ne uzimaju: tada ostaje
  // opisana boja
  let FOTO_UDIO = 0.75;
  function fotoBoja(T, proc, k) {
    if (!FOTO || !(k > 0)) return proc;
    const s = fotoNa([T.x, T.y, T.z], proc);
    const ls = 0.3 * s[0] + 0.59 * s[1] + 0.11 * s[2], lp = 0.3 * proc[0] + 0.59 * proc[1] + 0.11 * proc[2];
    let w = sat(ls / Math.max(0.02, 0.5 * lp));
    w *= sat((1.7 * lp - ls) / Math.max(0.05, 0.4 * lp));        // ni presvijetli (platno pod tankim predmetom: lavanda, vanilija)
    return mijesaj(proc, s, k * w);
  }

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
  const ZAKLONI = [];          // zakloni dodani u ovom prolazu gradnje
  let AKTIVNI = [];            // zakloni koji vrijede (popis iz prethodnog prolaza: potpun od početka, pa i raniji predmet zaklanja kasniji)
  function zaklon(id, c, R, sdf) { ZAKLONI.push({ id: id, c: c, R: R, sdf: sdf }); }
  // najmanja udaljenost zrake (od točkice prema kameri) do zaklona: 0 =
  // zaklonjeno, Infinity = zraka ne prolazi ni blizu; uz meko > 0 zraka se
  // prati i mimo zaklona do te udaljenosti (meki rub)
  function doZaklona(T, meko) {
    const px = T.x, py = T.y, pz = T.z;
    let dx = KAMERA[0] - px, dy = KAMERA[1] - py, dz = KAMERA[2] - pz;
    const L = Math.hypot(dx, dy, dz) || 1;
    dx /= L; dy /= L; dz /= L;
    let min = Infinity;
    for (let i = 0; i < AKTIVNI.length; i++) {
      const Z = AKTIVNI[i];
      if (Z.id === T.objekt) continue;
      // obuhvatna kugla (proširena za meki rub): siječe li je zraka
      const ox = Z.c[0] - px, oy = Z.c[1] - py, oz = Z.c[2] - pz, R = Z.R + (meko || 0);
      const b = ox * dx + oy * dy + oz * dz, c2 = ox * ox + oy * oy + oz * oz - R * R;
      if (c2 > 0 && (b < 0 || b * b < c2)) continue;
      let t = 0.004;
      const tMax = Math.min(L, b + R + 0.01);
      for (let k = 0; k < 64 && t < tMax; k++) {
        const d = Z.sdf(px + dx * t, py + dy * t, pz + dz * t);
        if (d < 0.0025) return 0;
        if (d < min) min = d;
        t += Math.max(d, 0.004);
      }
    }
    return min;
  }
  function zaklonjen(T) { return doZaklona(T, 0) <= 0; }
  // ploha okrenuta od kamere (neprozirni predmeti je nemaju; mala rezerva za njihanje)
  function odKamere(T) {
    const dx = KAMERA[0] - T.x, dy = KAMERA[1] - T.y, dz = KAMERA[2] - T.z, l = Math.hypot(dx, dy, dz) || 1;
    return (T.nx * dx + T.ny * dy + T.nz * dz) / l < -0.15;
  }

  // ═════════════════════════════════════════════════════════════════════
  //  SKUPLJAČ — niti i točkice. broji = 1: samo broji po duljini niti
  //  (grubo); broji = 2: izračuna svaku UZORAK-tu točkicu (zaklon se
  //  provjeri), pa je procjena točna; broji = 0: gradnja
  // ═════════════════════════════════════════════════════════════════════
  const VEL = 8, UZORAK = 4;
  const T = { x: 0, y: 0, z: 0, nx: 0, ny: 1, nz: 0, col: [1, 1, 1], lit: 1, back: 0.4, jak: 1, vrsta: 0, skupina: 0, objekt: 0, pogled: false };
  function tvar(col, lit, back, jak, vrsta, skupina, objekt) {
    // predmeti: boja s fotografije (fotografija već nosi svjetlo i sjene, pa
    // svjetlo u shaderu boju mijenja manje); pločica, natpis i mlaz koji teče
    // ostaju opisane boje, a platno, stol i pozadina su već s fotografije
    if (FOTO && FOTO_UDIO > 0 && vrsta !== V.PLOCICA && vrsta !== V.MLAZ && vrsta !== V.POZADINA && vrsta !== V.TKANINA) {
      col = fotoBoja(T, col, FOTO_UDIO);
      lit *= 1 - 0.45 * FOTO_UDIO;
    }
    T.col = col; T.lit = lit; T.back = back; T.jak = jak; T.vrsta = vrsta; T.skupina = skupina; T.objekt = objekt || 0; T.pogled = false;
    return true;
  }

  function Skupljac(korak, broji) {
    this.korak = korak; this.razmak = korak / OMJER; this.broji = broji;
    this.n = 0; this.nLin = 0; this.linija = 0; this.brojac = 0; this.posao = 0;
    this.dijelovi = []; this.dio = null; this.poz = 0;
  }
  // u prolazu 2 računa se svaka UZORAK-ta točkica (poziva se prije računanja točkice)
  Skupljac.prototype.preskoci = function () { return this.broji === 2 && (this.brojac++) % UZORAK !== 0; };
  Skupljac.prototype.primi = function () {
    this.posao++;
    // zaklon: za pozadinu (mjesto u prostoru pogleda) se provjeri svjetsko
    // mjesto, s mekim rubom (jačina pada prema rubu zaklona), da se pri
    // njihanju prizora uz predmete ne otvore crne pruge
    if (T.pogled) {
      const p = izPogleda([T.x * KOMP, T.y * KOMP + POMAK, T.z * KOMP]);   // (T nosi mjesto u prostoru pogleda bez KOMP i POMAK, vidi zapis u odjeljku 13)
      const d = doZaklona({ x: p[0], y: p[1], z: p[2], objekt: T.objekt }, 0.07);
      if (d <= 0) return;
      T.jak *= korakG(0, 0.07, d);
    } else if (zaklonjen(T)) return;
    if (this.broji) { const inc = this.broji === 2 ? UZORAK : 1; this.n += inc; if (T.pogled) this.nLin += inc; return; }
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
      if (this.preskoci()) continue;
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
      if (this.preskoci()) continue;
      const s = segs[r.linija[i]], u = r.udio[i];
      T.x = lerp(s.a[0], s.b[0], u); T.y = lerp(s.a[1], s.b[1], u); T.z = lerp(s.a[2], s.b[2], u);
      T.nx = s.n[0]; T.ny = s.n[1]; T.nz = s.n[2];
      if (f(T) === false) continue;
      this.primi();
    }
  };
  // popuštanje procesora po količini posla (vidi graditelje): true kad je vrijeme za yield
  Skupljac.prototype.pusti = function () { if (this.posao < 1500) return false; this.posao = 0; return true; };
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
      if (S.pusti()) yield;
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
      if (S.pusti()) yield;
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
      if (S.pusti()) yield;
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
        if (S.pusti()) yield;
      }
    }
  }

  // ── marching squares po rezu (ravnina): f(u, v) < 0 unutra; fina mreža samo uz plohu
  const RUBOVI = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]],
    8: [[2, 3]], 9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[1, 2]], 12: [[3, 1]], 13: [[0, 1]], 14: [[3, 0]] };
  const GRUBO = 4;
  let REZ_V = new Float32Array(0);              // radni spremnik vrijednosti mreže (raste po potrebi)
  function rez2(f, U0, U1, V0, V1, h) {
    const nx = Math.max(1, Math.ceil((U1 - U0) / h)), nz = Math.max(1, Math.ceil((V1 - V0) / h));
    const NV = (nx + 1) * (nz + 1);
    if (REZ_V.length < NV) REZ_V = new Float32Array(Math.max(NV, REZ_V.length * 2));
    const v = REZ_V.fill(NaN, 0, NV);
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
    const h = o.h || S.korak * 0.45, e = h * 0.5, tez = o.tezina || 1, osi = o.osi || 'yz', kr = S.korak * (o.razmak || 1);
    function normala(x, y, z) {
      return norm3([sdf(x + e, y, z) - sdf(x - e, y, z), sdf(x, y + e, z) - sdf(x, y - e, z), sdf(x, y, z + e) - sdf(x, y, z - e)]);
    }
    if (osi.indexOf('y') >= 0) {
      const k = Math.max(1, Math.round((ok[3] - ok[2]) / kr)), kk = (ok[3] - ok[2]) / k;
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
        S.posao += d.length;                     // (i marching squares je posao)
        if (S.pusti()) yield;
      }
    }
    if (osi.indexOf('z') >= 0) {
      const k = Math.max(1, Math.round((ok[5] - ok[4]) / kr)), kk = (ok[5] - ok[4]) / k;
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
        S.posao += d.length;
        if (S.pusti()) yield;
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
    staklenka: { dno: [232, 700], r: 0.38, vrh: 0.70, med: 0.41 },   // prednji rub dna staklenke, polumjer, visina usne i površine meda
    zlica: { glava: [218, 338], smjer: [0.78, -0.60, -0.2], mlaz: [238, 500], R: 0.19, pola: 0.31 },   // sredina glave, smjer od drške prema vrhu glave, piksel mlaza, polumjer i pola duljine glave
    limun1: { dno: [727, 645], r: [0.43, 0.40, 0.39] },
    polovica: { dno: [790, 708], r: 0.35, lice: [-0.2, 0.3, 0.93] },
    limun2: { dno: [915, 648], r: [0.36, 0.35, 0.36] },
    listA: { od: [790, 462], do: [618, 492] }, listB: { od: [800, 452], do: [866, 406] }, listC: { od: [905, 655], do: [1012, 696] },
    cimet: [[[604, 731], [772, 752], 1], [[742, 736], [872, 752], 1], [[658, 672], [864, 712], 2.7]],   // [od, do, visina u polumjerima]
    vanilija: [[[562, 762], [1000, 718]], [[588, 805], [905, 738]], [[700, 790], [985, 752]]],
    tonka: [[298, 804, 0.0, 0.28, 0.14], [352, 793, -0.45, 0.26, 0.13], [372, 830, 0.5, 0.17, 0.12], [440, 812, 0.25, 0.36, 0.15], [445, 846, 0.35, 0.30, 0.13]],
    lavanda: [[[648, 838], [805, 793], [985, 790]], [[758, 848], [895, 820], [1015, 812]], [[862, 808], [962, 790], [1024, 785]]],
    duhan: { sredina: [118, 748], r: [0.68, 0.44, 0.5] },
    cvjetovi: { sredina: [355, 715], list1: [[380, 697], [262, 640]], list2: [[395, 690], [350, 628]],
      cvijet: [[372, 688, 0.14, [0.2, 0.5, 0.84], 0.15], [318, 736, 0.06, [-0.3, 0.45, 0.84], 0.16], [368, 748, 0.08, [0.0, 0.5, 0.86], 0.17], [420, 735, 0.07, [0.5, 0.4, 0.77], 0.14]],
      pupoljci: [[300, 700], [296, 762], [405, 702]] },
    platno: { lijevo: 130, porub: [[130, 795], [1024, 872]] },
    stol: { rub: [[0, 896], [1024, 848]] },
    obzor: 590                                                            // ispod ove visine fotografije je stol, iznad pozadina
  };
  NAX.MJERE = MJ;

  function* gradi(S, o) {
    const rnd = slucajno(1861);
    AKTIVNI = ZAKLONI.slice();                   // zakloni ne ovise o razmaku niti, pa popis iz prethodnog prolaza vrijedi od početka
    ZAKLONI.length = 0;
    const K = o.OMJER || OMJER;
    FOTO_UDIO = o.foto === undefined ? 0.75 : +o.foto;

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
          if ((i & 2047) === 2047 && S.pusti()) yield;
          if (S.preskoci()) continue;
          const x = f.poz[3 * i], y = f.poz[3 * i + 1], z = f.poz[3 * i + 2], m = f.vrsta[i];
          T.x = x; T.y = y; T.z = z; T.nx = f.nor[3 * i]; T.ny = f.nor[3 * i + 1]; T.nz = f.nor[3 * i + 2];
          if (m === 0 || m === 4) {
            let col = mijesaj(C.flakonLijevo, C.flakonDesno, sat(0.5 + 0.6 * T.nx + 0.2 * T.ny));
            col = mijesaj(col, C.flakonDno, 0.6 * (1 - korakG(-0.86, -0.55, y)));
            if (m === 4) col = puta(col, 1.3);
            tvar(col, 0.3, 0.5, m === 4 ? 2.4 : 2.1, V.FLAKON, SK.flakon, 1);
          } else if (m === 1) {
            if (y > h0 + 0.002) {
              const col = mijesaj(C.vrhCepa, C.vrhCepaRub, Math.pow(1 - Math.abs(T.nz), 1.5));
              tvar(col, 0.55, 0.5, 0.75, V.FLAKON, SK.flakon, 1);
            } else {
              // polirano zlato: okomite pruge odsjaja (svijetle lijevo i u sredini, tamne desno)
              const a = Math.atan2(x, z);
              let col = mijesaj(C.zlatoTamno, C.zlatoSvjetlo, sat(0.5 - 0.6 * Math.sin(a - 0.35)));
              col = mijesaj(col, C.zlatoSjaj, Math.exp(-a * a / 0.03) * 0.8 + 0.25 * Math.exp(-(a - 1.0) * (a - 1.0) / 0.05));
              tvar(col, 0.5, 0.6, 2.4, V.ZLATO, SK.flakon, 1);
            }
          } else if (m === 2) tvar(mijesaj(C.plocica, C.plocicaOkvir, 0.2 + 0.3 * pjega(x, y, z, 30)), 0.35, 0.28, 2.6, V.PLOCICA, SK.flakon, 1);
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
        const vrh = prof[prof.length - 1][0];
        if (y < prof[0][0]) return Math.hypot(Math.max(Math.hypot(x, z) - prof[0][1], 0), prof[0][0] - y);
        if (y > vrh) return Math.hypot(Math.hypot(x, z), y - vrh);          // iznad šiljka: udaljenost do vrha (ne do ravnine)
        for (let i = 0; i < prof.length - 1; i++) if (y >= prof[i][0] && y <= prof[i + 1][0]) { r = lerp(prof[i][1], prof[i + 1][1], (y - prof[i][0]) / (prof[i + 1][0] - prof[i][0] || 1)); break; }
        return Math.hypot(x, z) - r;
      });
    }
    yield;

    // ── 2. staklenka meda lijevo: staklo s navojima na grlu, med do tri
    //    petine visine (sunce ga prosvjetljuje slijeva), površina meda s
    //    valićima gdje pada mlaz, kapi meda niz grlo
    const STK = (function () {
      const d = izSlike(MJ.staklenka.dno[0], MJ.staklenka.dno[1], STOL), r = MJ.staklenka.r;
      return { x: d[0], z: d[2] - r, r: r, med: MJ.staklenka.med, vrh: MJ.staklenka.vrh };
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
      const xm = izSlikeZ(MJ.zlica.mlaz[0], MJ.zlica.mlaz[1], STK.z)[0];     // x mlaza (na dubini staklenke)
      yield* prsteni(S, [[0.02, r * 0.93, 0], [STK.med - 0.02, r * 0.93, 0], [STK.med, r * 0.9, 1], [STK.med + 0.004, r * 0.6, 1], [STK.med + 0.006, 0.08, 1], [STK.med + 0.012, 0.02, 1], [STK.med + 0.012, 0, 1]], {
        pomak: [STK.x, STOL, STK.z],
        tezina: function (y, rr, ny, m) { return m ? 0.8 : 1; },
        boja: function (T, y, rr, a, ny, m) {
          if (m) {
            const dr = Math.hypot(T.x - xm, T.z - STK.z);
            let col = mijesaj(C.medPovrsina, C.medSjaj, 0.15 + 0.25 * sat(0.5 + 0.5 * Math.cos(a - 2.3)));
            col = mijesaj(col, C.medSjaj, 0.5 * Math.exp(-dr * dr / 0.004) + 0.25 * Math.pow(0.5 + 0.5 * Math.cos(dr * 90), 4) * korakG(0.16, 0.03, dr));
            return tvar(col, 0.7, 0.3, 0.8, V.MED, SK.staklenka, 2);
          }
          if (odKamere(T)) return false;                                      // med je neproziran: bez stražnje stijenke
          const sja = sat(0.5 + 0.5 * Math.cos(a - 2.3));                    // sunce prolazi kroz med slijeva naprijed
          let col = mijesaj(C.medTamno, C.med, 0.1 + 0.7 * sja);
          col = mijesaj(col, C.medSjaj, 0.12 * Math.exp(-(y - STK.med + 0.03) * (y - STK.med + 0.03) / 0.002) * sja);
          col = puta(col, 0.93 + 0.14 * pjega(T.x, T.y, T.z, 14));
          return tvar(col, 0.75, 0.12, 1.7, V.MED, SK.staklenka, 2);
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
      const g = izSlikeZ(MJ.zlica.glava[0], MJ.zlica.glava[1], STK.z), d = norm3(MJ.zlica.smjer);   // d: od drške prema oblom vrhu glave (dolje desno)
      const xm = izSlikeZ(MJ.zlica.mlaz[0], MJ.zlica.mlaz[1], STK.z)[0];
      return { c: g, d: d, R: MJ.zlica.R, pola: MJ.zlica.pola, mlazX: xm, mlazVrh: g[1] - 0.23, mlazDno: STOL + STK.med + 0.004 };
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
          if (odKamere(T)) return false;                                      // neprozirno drvo
          const dolje = sat(-T.ny * 1.3), svj = osunceno(T), brazda = 1 - korakG(0.86, 1, rr / R);
          let col = mijesaj(C.zlicaGlavaTamno, C.zlicaGlava, 0.5 + 0.5 * svj);
          col = mijesaj(col, C.zlicaGlavaTamno, 0.25 * brazda);
          col = puta(col, 0.85 + 0.3 * pjega(t * 9, a * 0.6, 1, 1));
          col = mijesaj(col, C.zlicaMed, 0.75 * dolje);                        // ulivena medom
          col = mijesaj(col, C.mlazSjaj, 0.35 * dolje * Math.pow(Math.max(0, T.nz), 3));
          return tvar(col, 0.7, 0.4, 1.9, V.OBICNO, SK.zlica, 3);
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
        r: function (t, a) { return 0.014 + 0.03 * Math.pow(1 - t, 2.2) * (1 + 0.25 * Math.cos(2 * a)); }, gusto: 0.8,
        boja: function (T, t, a) {
          const col = mijesaj(C.mlaz, C.mlazSjaj, 0.25 + 0.5 * Math.pow(1 - Math.abs(T.nz - 0.6), 2));
          return tvar(col, 0.5, 0.75, 1.6, V.MLAZ, SK.zlica, 3);
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
      const HZ = Math.max(0.02, H - R * 0.96);                                // kapsula zaklona završava točno na krajevima glave
      zaklon(3, c, H + R, function (x, y, z) { return sdKapsula(x, y, z, [c[0] - d[0] * HZ, c[1] - d[1] * HZ, c[2] - d[2] * HZ], [c[0] + d[0] * HZ, c[1] + d[1] * HZ, c[2] + d[2] * HZ], R * 0.96); });
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
        osi: 'y', razmak: 0.5, h: S.korak * 0.8,
        boja: function (T) {
          if (odKamere(T)) return false;                                      // neprozirno voće
          const svj = osunceno(T);
          let col = mijesaj(C.limunSjena, C.limun, 0.4 + 0.6 * svj);
          col = mijesaj(col, C.limunSvjetlo, 0.6 * Math.pow(svj, 3));
          col = puta(col, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 90));
          return tvar(col, 0.6, 0.0, 1.7, V.OBICNO, skupina, id);
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
        M: M, pomak: c, tezina: function (y, r, ny, m) { return 1; },
        boja: function (T, y, r, a, ny, m) {
          let col;
          if (m !== 2 && odKamere(T)) return false;                           // kora straga se ne vidi
          if (m === 2) {
            const rr = r / R, seg = 10, ka = (a * seg / (2 * Math.PI) + 0.3) % 1, opna = Math.min(ka, 1 - ka) * 2 * Math.PI * rr * R / seg;
            let jak = 2.0;
            if (rr > 0.9) { col = mijesaj(C.limunBijelo, C.limunKora, korakG(0.94, 1, rr) * 0.7); jak = 1.6; }   // bijeli rub i kora
            else if (opna < 0.01 || rr < 0.05) { col = C.limunOpna; jak = 1.3; }                                // opne i sredina
            else col = mijesaj(C.limunMeso, C.limunMesoSvjetlo, 0.25 * pjega(a * 14, rr * 40, 1, 1) + 0.35 * korakG(0.76, 0.9, rr) + 0.25 * (1 - korakG(0.05, 0.3, rr)));
            return tvar(puta(col, 0.95 + 0.12 * pjega(T.x, T.y, T.z, 70)), 0.45, 0.5, jak, V.OBICNO, SK.limuni, 5);
          }
          const svj = osunceno(T);
          col = mijesaj(C.limunSjena, C.limun, 0.4 + 0.6 * svj);
          col = mijesaj(col, C.limunSvjetlo, m === 1 ? 0.4 : 0.5 * Math.pow(svj, 3));
          return tvar(puta(col, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 90)), 0.6, 0.0, 1.7, V.OBICNO, SK.limuni, 5);
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
          return tvar(C.limunOpna, 0.4, 0.5, 0.9, V.OBICNO, SK.limuni, 5);
        }, 0.85 * R, 0.9, false);
      }
      zaklon(5, c, R + 0.02, function (x, y, z) { return Math.hypot(x - c[0], y - c[1], z - c[2]) - R; });
    }
    yield;
    // listovi: plahta duž krivulje od peteljke do vrha, malo udubljena, sa žilama
    function* list(odPx, doPx, yOd, yDo, W, sk, objekt, gore) {
      // peteljka (odPx) i vrh (doPx) lista: pod tim pikselima, na visinama yOd i yDo
      const A = izSlike(odPx[0], odPx[1], yOd), Bq = izSlike(doPx[0], doPx[1], yDo);
      const d = norm3([Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]]), L = Math.hypot(Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]);
      const nl = norm3(gore || [0, 1, 0.25]), e = norm3(kriz(d, nl)), nn = kriz(e, d);
      yield* plahta(S, function (u, v) {
        const w = W * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.7), s = 2 * v - 1;
        const uv = 0.03 * s * s + 0.012 * Math.sin(u * 7) + 0.05 * u * u;
        return [A[0] + d[0] * L * u + e[0] * w * s + nn[0] * uv, A[1] + d[1] * L * u + e[1] * w * s + nn[1] * uv, A[2] + d[2] * L * u + e[2] * w * s + nn[2] * uv];
      }, {
        gore: true, razmak: 0.7,
        boja: function (T, u, v) {
          const s = Math.abs(2 * v - 1), svj = osunceno(T);
          let col = mijesaj(C.listTamno, C.list, 0.4 + 0.6 * svj);
          col = mijesaj(col, C.listSvjetlo, 0.35 * svj * svj + 0.2 * pjega(u * 6, v * 5, sk, 1));
          if (s < 0.06) col = mijesaj(col, C.listZila, 0.6);                                       // glavna žila
          else if (Math.abs(((v * 8) % 1) - 0.5) < 0.05) col = mijesaj(col, C.listZila, 0.3);       // bočne žile
          return tvar(col, 0.6, 0.4, 1.15, V.OBICNO, sk, objekt);
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
      yield* list(MJ.listA.od, MJ.listA.do, vrh, vrh - 0.2, 0.16, SK.limuni, 4, [0.2, 1, 0.3]);
      yield* list(MJ.listB.od, MJ.listB.do, vrh + 0.03, vrh + 0.22, 0.1, SK.limuni, 4, [-0.2, 1, 0.3]);
      yield* list(MJ.listC.od, MJ.listC.do, STOL + 0.015, STOL + 0.03, 0.12, SK.limuni, 6, [0, 1, 0.1]);
    }
    yield;

    // ── 5. štapići cimeta: tri smotana štapića (po duljini brazda smotka,
    //    spirala kore na krajevima), dva na platnu i jedan preko njih
    for (let i = 0; i < MJ.cimet.length; i++) {
      const k = MJ.cimet[i], r0 = 0.095, y = STOL + r0 * k[2];
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
          if (odKamere(T)) return false;                                      // neprozirna kora
          const brazda = korakG(r0 * 0.97, r0 * 0.86, r), svj = osunceno(T);
          let col = mijesaj(C.cimet, C.cimetSvjetlo, 0.2 + 0.6 * svj + 0.25 * pjega(t * 7 + i, a * 0.5, i, 1.0));
          col = mijesaj(col, C.cimetTamno, brazda);
          col = puta(col, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 45));
          return tvar(col, 0.7, 0.4, 1.4, V.OBICNO, SK.cimet, 8 + i);
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
      const put = function (t) {
        const p = kvadratna(A, Cq, Bq, t), kuka = Math.exp(-t * t / 0.004);          // uvijeni kraj se diže i savija natrag
        return [p[0] + 0.045 * kuka, p[1] + 0.06 * kuka * (1 - t), p[2] + 0.02 * Math.sin(t * 11)];
      };
      yield* cijev(S, put, {
        r: function (t, a) { return 0.032 * (1 - 0.45 * Math.pow(t, 6)) * (1 + 0.12 * Math.cos(3 * a + t * 50)) * (0.6 + 0.4 * korakG(0, 0.03, t)); }, spljosti: 0.6, gusto: 1.2,
        boja: function (T, t, a) {
          const svj = osunceno(T);
          let col = mijesaj(C.vanilija, C.vanilijaSvjetlo, 0.2 + 0.5 * svj + 0.3 * pjega(t * 40 + i, a * 0.8, i, 1));
          col = mijesaj(col, C.vanilijaSjaj, 0.5 * Math.pow(svj, 4));
          return tvar(col, 0.9, 0.4, 1.0, V.OBICNO, SK.vanilija, 20 + i);
        }
      });
      // zaklon: tri kapsule duž svinute mahune (platno pod njom nema točkica)
      for (let q = 0; q < 3; q++) {
        const a = put(q / 3), b = put((q + 1) / 3), sr = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
        zaklon(20 + i, sr, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 2 + 0.04, function (x, y2, z) { return sdKapsula(x, y2, z, a, b, 0.026); });
      }
    }
    yield;

    // ── 7. zrna tonke: pet tamnih, naboranih, sjajnih zrna ispred flakona lijevo
    for (let i = 0; i < MJ.tonka.length; i++) {
      const k = MJ.tonka[i], c = izSlike(k[0], k[1], STOL + 0.04), lok = uLokalno(matrica(k[2]), c), L = k[3] / 2, W = k[4] / 2;
      const sdf = function (x, y, z) {
        const p = lok(x, y, z);
        return sdElipsoid(p[0], p[1], p[2], L, 0.06, W) - 0.005 * sum(p[0] * 60 + i, p[1] * 60, p[2] * 60) - 0.004 * Math.abs(Math.sin(p[0] * 70 + 2 * sum(p[0] * 15, p[1] * 15, p[2] * 15)));
      };
      yield* rezSDF(S, sdf, [c[0] - L - 0.02, c[0] + L + 0.02, c[1] - 0.07, c[1] + 0.08, c[2] - L - 0.02, c[2] + L + 0.02], {
        h: S.korak * 0.3, bezDna: true,
        boja: function (T) {
          if (odKamere(T)) return false;
          const svj = osunceno(T), rub = Math.pow(1 - Math.abs(T.nz), 1.5);
          let col = mijesaj(C.tonka, C.tonkaSvjetlo, 0.3 + 0.6 * pjega(T.x, T.y, T.z, 40) * (0.4 + 0.6 * svj));
          col = mijesaj(col, C.tonkaRub, 0.3 * rub * (0.3 + 0.7 * svj));
          return tvar(col, 1.0, 0.25, 0.9, V.OBICNO, SK.tonka, 30 + i);
        }
      });
      zaklon(30 + i, c, L + 0.02, function (x, y, z) { const p = lok(x, y, z); return sdElipsoid(p[0], p[1], p[2], L, 0.06, W); });
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
          return (0.012 + 0.055 * (0.4 + 0.6 * cvj) * (0.7 + 0.3 * korakG(0, 0.2, t))) * (1 + 0.2 * Math.cos(2 * a + f0 + t * 9)) * tanak;
        }, spljosti: 0.75, gusto: 0.85,
        boja: function (T, t, a, r) {
          const cvj = Math.abs(Math.cos(Math.PI * t * nCv)), svj = osunceno(T);
          let col = mijesaj(C.lavandaTamno, C.lavanda, 0.3 + 0.7 * svj);
          col = mijesaj(col, C.lavandaSvjetlo, 0.5 * cvj * svj + 0.2 * pjega(t * 30, a * 1.5, i, 1));
          if (cvj < 0.25) col = mijesaj(col, C.caska, 0.5);
          return tvar(col, 0.75, 0.2, 0.8, V.OBICNO, SK.lavanda, 40 + i);
        }
      });
      zaklon(40 + i, [(H0[0] + H1[0]) / 2, y, (H0[2] + H1[2]) / 2], Math.hypot(H1[0] - H0[0], H1[2] - H0[2]) / 2 + 0.05, function (x, y2, z) { return sdKapsula(x, y2, z, [H0[0], y, H0[2]], [H1[0], y, H1[2]], 0.03); });
      yield* cijev(S, function (t) { return [lerp(H1[0], S1[0], t), y - 0.012 + 0.008 * Math.sin(t * 4), lerp(H1[2], S1[2], t)]; }, {
        r: function () { return 0.011; },
        boja: function (T, t) { return tvar(mijesaj(C.stabljika, C.caska, 0.3 * pjega(t * 20, i, 1, 1)), 0.7, 0.4, 0.9, V.OBICNO, SK.lavanda, 40 + i); }
      });
      if (i === 1) yield;
    }
    // raspršeni cvjetići lavande po platnu
    for (let i = 0; i < 16; i++) {
      const px = i < 9 ? 545 + rnd() * 120 : 690 + rnd() * 230, py = Math.min(i < 9 ? 845 + rnd() * 45 : 805 + rnd() * 70, 896 - 48 * px / 1024 - 10);   // ne preko ruba stola
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
      const ry = function (x) { return R[1] * (1 - 0.4 * sat((x - c[0]) / R[0])); };   // vrh lijevo, humak pada udesno
      const sdf = function (x, y, z) {
        const kv = 0.06 * sum(x * 4, y * 4, z * 4) + 0.025 * sum(x * 11 + 3, y * 11, z * 11) + 0.01 * sum(x * 30, y * 30, z * 30);
        return sdElipsoid(x - c[0], y - c[1], z - c[2], R[0], ry(x), R[2]) - kv;
      };
      yield* rezSDF(S, sdf, [c[0] - R[0] - 0.1, c[0] + R[0] + 0.1, STOL + 0.005, c[1] + R[1] + 0.1, c[2] - R[2] - 0.1, c[2] + R[2] + 0.1], {
        osi: 'yz', tezina: 0.6, h: S.korak * 0.8,
        boja: function (T) {
          if (odKamere(T)) return false;
          const svj = osunceno(T);
          let col = mijesaj(C.duhanTamno, C.duhan, 0.6 + 0.4 * svj);
          col = mijesaj(col, C.duhanSvjetlo, 0.3 * Math.pow(svj, 3) * pjega(T.x, T.y, T.z, 25));
          col = puta(col, 0.95 + 0.4 * pjega(T.x, T.y, T.z, 60));
          return tvar(col, 0.5, 0.35, 1.4, V.OBICNO, SK.duhan, 7);
        }
      });
      yield;
      // trake: uvijeni komadi lista po površini humka
      for (let i = 0; i < 50; i++) {
        const a = rnd() * 2 * Math.PI, rr = Math.sqrt(rnd()) * 0.95;
        const px0 = c[0] + R[0] * rr * Math.cos(a), pz0 = c[2] + R[2] * rr * Math.sin(a);
        // visina humka na tom mjestu (pretraga po y)
        let yh = STOL;
        for (let y = c[1] + R[1] + 0.1; y > STOL; y -= 0.01) if (sdf(px0, y, pz0) < 0) { yh = y; break; }
        const kut = rnd() * Math.PI, d = [Math.cos(kut), 0, Math.sin(kut)], e = [-d[2], 0, d[0]];
        const L = 0.12 + 0.2 * rnd(), W = 0.025 + 0.035 * rnd(), uvoj = 0.015 + 0.03 * rnd(), nag = (rnd() - 0.5) * 0.2, s0 = rnd() * 7;
        yield* plahta(S, function (u, v) {
          const s = 2 * v - 1, uu = 2 * u - 1;
          const y = yh + 0.01 + uvoj * (s * s * 0.6 + uu * uu * 0.4) + nag * uu * L + 0.012 * Math.sin(uu * 9 + s0);
          return [px0 + d[0] * L * uu + e[0] * W * s, y, pz0 + d[2] * L * uu + e[2] * W * s];
        }, {
          gore: true, razmak: 1.2,
          boja: function (T, u, v) {
            const svj = osunceno(T);
            let col = mijesaj(C.duhanTamno, C.duhanSvjetlo, 0.3 + 0.4 * svj * (0.5 + 0.5 * pjega(u * 5 + s0, v * 3, i, 1)));
            if (Math.abs(((v * 5) % 1) - 0.5) < 0.07) col = mijesaj(col, C.duhanTamno, 0.4);
            return tvar(col, 0.35, 0.35, 0.35, V.OBICNO, SK.duhan, 7);
          }
        });
        if (i % 3 === 2) yield;
      }
      zaklon(7, c, Math.max(R[0], R[2]) + 0.05, function (x, y, z) { return sdElipsoid(x - c[0], y - c[1], z - c[2], R[0] * 0.98, ry(x) * 0.95, R[2] * 0.98); });
    }
    yield;

    // ── 10. cvjetovi naranče uz dno flakona lijevo: grančica s dva lista,
    //     četiri bijela cvijeta s pet latica i žutim prašnicima, pupoljci
    {
      const cv = MJ.cvjetovi;
      yield* list(cv.list1[0], cv.list1[1], STOL + 0.03, STOL + 0.13, 0.13, SK.cvjetovi, 50, [0.1, 1, 0.25]);
      yield* list(cv.list2[0], cv.list2[1], STOL + 0.04, STOL + 0.1, 0.09, SK.cvjetovi, 50, [-0.1, 1, 0.25]);
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
            gore: true, razmak: 0.6,
            boja: function (T, u, v) {
              const svj = osunceno(T);
              let col = mijesaj(C.laticaSjena, C.latica, 0.4 + 0.6 * svj);
              col = mijesaj(col, C.prasnici, 0.25 * (1 - korakG(0.05, 0.3, u)));           // uz sredinu žućkasto
              return tvar(col, 0.3, 0.55, 1.1, V.OBICNO, SK.cvjetovi, 50);
            }
          });
        }
        // sredina: žuti prašnici oko tučka
        const lok = uLokalno(M, c);
        // sredina cvijeta zaklanja platno pod sobom (pod laticama platno ostaje: bijelo pod bijelim samo pomaže, a crna rupa bi smetala)
        (function (lok2, R2) { zaklon(50, c, R2 + 0.02, function (x, y, z) { const q = lok2(x, y, z); return sdElipsoid(q[0], q[1] - 0.01, q[2], R2, 0.03, R2); }); })(lok, Rl * 0.35);
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
        gore: true, poprijeko: 0.15, tezina: 0.9, razmak: 1.6,           // vodoravna ploha gledana pod ~18°: redovi se na zaslonu zbiju, pa su rjeđi
        boja: function (T, u, v) {
          const x = T.x, z = T.z;
          if (z > PL.porub(x) - 0.01 || (x < PL.lijevo && z > -0.75)) return false;           // izvan platna
          const col = fotoNa([x, T.y, z], [0.85, 0.75, 0.6]);
          const jak = 1.5 * (1 - korakG(-2.4, ZD + 0.05, z)) * (1 - korakG(2.0, 2.5, Math.abs(x)));
          if (jak < 0.03) return false;
          return tvar(col, 0.4, 0.6, jak, V.TKANINA, SK.stol, 0);
        }
      });
      yield;
      // porub: zavinuti rub platna uz sunce (svijetao), od lijevog ruba do kraja desno
      const a = PL.a, b = PL.b, L = Math.hypot(b[0] - a[0], b[2] - a[2]);
      yield* cijev(S, function (t) { const x = lerp(a[0], b[0] + 0.3, t); return [x, sjeme(x, PL.porub(x)) + 0.02, PL.porub(x) - 0.012 + 0.01 * Math.sin(t * 13)]; }, {
        r: function (t, an) { return 0.026 * (1 + 0.1 * Math.cos(an)); }, spljosti: 0.8,
        boja: function (T, t) {
          const col = mijesaj(fotoNa([T.x, T.y, T.z], C.porub), C.porub, 0.45 + 0.4 * sat(T.ny));
          return tvar(col, 0.45, 0.5, 0.45 * (1 - korakG(2.0, 2.5, Math.abs(T.x))), V.TKANINA, SK.stol, 0);
        }
      });
      // lijevi rub platna (kratki zavinuti rub ispred duhana)
      yield* cijev(S, function (t) { const z = lerp(-0.75, PL.porub(PL.lijevo), t); return [PL.lijevo, sjeme(PL.lijevo, z) + 0.015, z]; }, {
        r: function () { return 0.022; },
        boja: function (T) { return tvar(mijesaj(fotoNa([T.x, T.y, T.z], C.porub), C.porub, 0.4), 0.45, 0.5, 0.5, V.TKANINA, SK.stol, 0); }
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
        gore: true, tezina: 0.8, razmak: 2.2,
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

    // ── 13. pozadina: kameni zid lijevo, maslina i tegle desno, sve kao
    //     redovi niti u boji fotografije (kao da je fotografija iza prizora
    //     istkana od niti), zalijepljeno za ekran (prostor pogleda, z = −1.9)
    //     i utopljeno prema rubu prostora animacije
    {
      const ZV = -1.9, sk = (CAM - ZV) / CAM;      // piksel → prostor pogleda na dubini ZV (persp)
      const uPogledu = function (px, py) {
        const sx = (px - KAM_PX0) * KAM_K, sy = KAM_SY0 + (KAM_PY0 - py) * KAM_K;
        return [sx * sk, sy * sk, ZV];
      };
      const jacina = function (px, py) {
        const sx = (px - KAM_PX0) * KAM_K, sy = KAM_SY0 + (KAM_PY0 - py) * KAM_K;
        return (1 - korakG(1.05, 1.3, Math.abs(sx))) * (1 - korakG(0.95, 1.22, sy)) * korakG(MJ.obzor + 25, MJ.obzor - 40, py);
      };
      const zapis = function (T, px, py, jak, vrsta, velicina) {
        const q = uPogledu(px, py);
        T.x = q[0] / KOMP; T.y = (q[1] - POMAK) / KOMP; T.z = q[2] / KOMP;   // shader će primijeniti KOMP i POMAK
        T.nx = 0; T.ny = 0; T.nz = 1;
        // srednji tonovi fotografije ne smiju utonuti u crno (točkice ih inače ne nose): blaga krivulja
        const col = foto(px, py, [0.6, 0.5, 0.4]).map(function (c) { return 0.16 + 0.84 * Math.pow(c, 0.8); });
        tvar(col, 0.0, 1.0, jak, vrsta, velicina, 0);
        T.pogled = true;
        return true;
      };
      // redovi niti preko cijele pozadine (razmak 5 px fotografije, malo više
      // od razmaka niti u prizoru: pozadina je izvan oštrine), široki kao
      // stol (izvan fotografije se nastavlja rubna boja), u boji fotografije:
      // lijevo kameni zid, desno maslina, tegle i nebo; svjetlije mrlje
      // (osunčani kamen, bokeh masline) su jače i krupnije točkice
      const PX0 = -120, PX1 = 1144;
      for (let py = 5; py < MJ.obzor + 20; py += 5) {
        const red = Math.floor(py / 5);
        S.nit(function (u, T) {
          const px = PX0 + u * (PX1 - PX0);
          const col = foto(px, py), svj = 0.3 * col[0] + 0.59 * col[1] + 0.11 * col[2];
          const bokeh = korakG(0.45, 0.8, svj);
          const jak = jacina(px, py) * 1.1 * (0.85 + 0.3 * pjega(px * 0.05, py * 0.05, red, 1)) * (0.9 + 0.2 * hash3(Math.floor(px / 40), red, 1)) * (1.0 + 0.2 * bokeh);
          if (jak < 0.02) return false;
          return zapis(T, px, py, jak, V.POZADINA, Math.min(9, Math.round(4 + 4 * bokeh)));
        }, (PX1 - PX0) * KAM_K * sk / KOMP, 0.9, false);
        if (py % 50 === 0) yield;
      }
    }

    return { mlaz: { vrh: ZL.mlazVrh, duljina: ZL.mlazVrh - ZL.mlazDno } };
  }

  // ── gradnja u koracima: grubi prolaz brojanja (razmak 0,05), točni prolaz
  //    (svaka UZORAK-ta točkica, sa zaklonom), pa gradnja s razmakom za zadani
  //    broj točkica. o: n, flakon (generator iz pocetna-chata.js), sirinaFlakona(y),
  //    vrhCepa (y od kojeg je šiljak čepa), OMJER, foto (udio boje s fotografije
  //    u boji predmeta, 0..1; zadano 0,75). Vraća { podaci, n, korak, mlaz }
  NAX.gradiKoraci = function* (o) {
    const n = Math.max(5000, o.n || 100000);
    const grubo = new Skupljac(0.05, 1);
    yield* gradi(grubo, o);
    let korak = 0.05 * Math.sqrt(grubo.n / n);
    yield;
    const tocno = new Skupljac(korak, 2);
    yield* gradi(tocno, o);
    // točkice pozadine (redovi na stalnom razmaku) rastu s 1/korak, ostale s
    // 1/korak²: riješi se A / k² + B / k = n
    const A = Math.max(1e-6, tocno.n - tocno.nLin) * korak * korak, Bl = tocno.nLin * korak;
    korak = (Bl + Math.sqrt(Bl * Bl + 4 * A * n)) / (2 * n);
    yield;
    const S = new Skupljac(korak, 0);
    const meta = yield* gradi(S, o);
    return { podaci: S.spremnik(), n: S.n, korak: korak, mlaz: meta.mlaz };
  };
})();
