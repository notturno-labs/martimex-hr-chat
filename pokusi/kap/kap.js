/* ═════════════════════════════════════════════════════════════════════
   KAP ESENCIJE — pokusna animacija za početni ekran chata (Martimex)

   Prijedlog druge animacije s parfemom, u istom stilu kao pocetna-chata.js
   (točkice u tankim nitima, isto svjetlo i boje):
    - tamna, mirna površina tekućine, kao zrcalo (svjetlucava izmaglica)
    - iznad nje se iz iskrica skupi zlatna kap, malo nabubri i padne
    - kap udari u površinu: odskoči kruna sitnih kapljica, iz sredine
      poskoči jedna kapljica i padne natrag, a po površini se šire krugovi
      valova; zlatna esencija se razlije po površini s prvim valom
    - iz sredine se tekućina u vrtlogu digne i složi Xerjoff flakon (kao u
      pocetna-chata.js): staklo se puni odozdo, zlatni čep zadnji
    - flakon stoji na površini i polako se okreće, a površina ga zrcali
      (odraz se njiše s valovima); oko dna je svijetli rub tekućine
    - na kraju se flakon (odozgo) rastopi i slije natrag u površinu, a krug
      kreće ispočetka
   Sve je jedan WebGL program s tri sloja (površina, kap, flakon); odraz je
   isti flakon (i kap) nacrtan još jednom, zrcaljen preko površine.
   Geometrija flakona prepisana je iz pocetna-chata.js (označeno niže).
   ═════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const POSTAVKE = {
    boje: { podloga: '#000000', srebro: '#e8e6eb', puder: '#f6ebe7', zlato: '#e0bb72' },
    krug: 15,                // trajanje kruga (s)
    tocaka: 56000,           // flakon (kao u pocetna-chata.js), računalo
    tocakaMobitel: 32000,
    tocakaPovrsine: 42000,   // površina tekućine
    tocakaPovrsineMobitel: 24000,
    tocakaKapi: 7000,        // kap i kapljice
    velicinaAnimacije: 1.09  // kao u pocetna-chata.js
  };

  const P = POSTAVKE, B = P.boje;
  const MOBITEL = !!(window.matchMedia && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches);
  const MIS = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  function rgb(hex) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function boja01(hex) { return rgb(hex).map(function (v) { return v / 255; }); }
  function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function zasiti(c, k) {
    const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return c.map(function (v) { return sat(l + (v - l) * k); });
  }
  function glatko(x) { x = sat(x); return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ─────────────────────────────────────────────────────────────────────
  //  PREPISANO IZ pocetna-chata.js: niti, slučajni niz i flakon
  // ─────────────────────────────────────────────────────────────────────
  const OMJER = 2.3;             // koliko su točkice na liniji gušće nego razmak linija
  const DNO_BOCICE = -0.86, VRH_BOCICE = 0.90;

  // Ponovljiv "slučajni" niz (isti oblik pri svakom učitavanju)
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

  // n točaka jednoliko po ukupnoj duljini svih linija; za svaku točku
  // vraća redni broj linije i udio duljine te linije (0..1)
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

  // ── Flakon po uzoru na Xerjoff 1861 (Naxos): fasetirano tijelo, jednako
  //    široko sprijeda i sa strane (presjek je osmerokut: četiri široke
  //    plohe, tj. prednja, stražnja i bokovi, i između njih četiri kose
  //    fasete), koje se od zaobljenih ramena blago sužava prema dnu; zlatni
  //    prsten na grlu i zlatni čep kojemu se vrh straga uzdiže u šiljak
  //    (sprijeda izgleda kao šiljak, sa strane kao val izvijen naprijed). Na
  //    prednjoj plohi zlatna pločica u obliku trapeza (gore šira) s
  //    dvostrukim okvirom i znakom X. Mjere su izmjerene s fotografije
  //    bočice (u pikselima; bočica je na njoj visoka 695 px).
  const FLAKON_K = (VRH_BOCICE - DNO_BOCICE) / 695;   // piksel fotografije → svjetska jedinica
  // [visina od dna, pola širine, izraženost faseta]
  const FLAKON = [
    [0, 0, 1], [0, 66, 1], [4, 84, 1], [9, 93, 1], [15, 96, 1], [23, 99.5, 1],     // dno sa zaobljenim rubom
    [39, 106, 1], [71, 116.5, 1], [103, 125, 1], [135, 132.5, 1], [167, 138.5, 1], // tijelo se prema dnu sužava
    [199, 144, 1], [231, 148, 1], [263, 152, 1], [295, 154.5, 1], [327, 156, 1],
    [351, 155.5, 1], [367, 151.5, 1], [383, 145.5, 1], [399, 136.5, 1],             // zaobljena ramena
    [415, 124, 1], [431, 108, .95], [447, 86.5, .85], [455, 71.5, .75], [461, 58, .6],
    [461, 58, 0], [471, 58, 0], [471, 62.5, 0], [501, 62.5, 0],                     // zlatni prsten
    [501, 53, 0], [511, 52.5, 0], [527, 56.5, 0], [543, 59.5, 0], [559, 61.5, 0],   // čep se prema gore
    [575, 63, 0], [583, 64, 0], [599, 64, 0]                                        // lagano širi do ruba
  ];
  const FLAKON_ZLATO = 461, FLAKON_RUB = 599, FLAKON_VRH = 695;
  const PLOHA = 0.48;           // široke plohe zauzimaju 48 % širine, između njih su kose fasete
  // pločica (trapez) i znak X na njoj: [visina od dna, pola širine] s fotografije
  const PLOCICA_VRH = [311, 51], PLOCICA_DNO = [158, 41], ZNAK_VRH = 273, ZNAK_DNO = 199, ZNAK_POLA = 25;
  const RED_PLOCICE = 0.0045;   // razmak linija na pločici (gušće od tijela, da se vidi znak)
  // vrsta točke (4. broj uz mjesto na flakonu): staklo, zlato, pločica, znak/okvir, brid
  const STAKLO = 0, ZLATO = 1, PLOCICA = 2, SLOVO = 3, BRID = 4;
  // Znak X (Xerjoff) precrtan sa znaka: debeli potez sa šiljastim serifom
  // gore lijevo i repom koji se dolje desno produžuje i savija; tanki potez
  // prekinut na križanju, s vodoravnim serifima. Koordinate u okviru 495 × 709.
  const ZNAK_X = [
    [32, 117, 170, 0, 154, 27, 150, 57, 154, 87, 167, 122, 187, 152, 212, 187, 242, 232, 277, 282, 312, 332,
      342, 377, 372, 427, 402, 482, 427, 537, 440, 587, 440, 627, 427, 667, 407, 697, 384, 709, 402, 677,
      412, 637, 410, 597, 397, 557, 372, 507, 342, 457, 312, 407, 282, 362, 252, 317, 217, 267, 182, 217,
      152, 172, 127, 137, 107, 109, 97, 100, 82, 97, 57, 105],
    [317, 34, 495, 34, 495, 39, 462, 43, 437, 59, 412, 87, 377, 134, 337, 189, 304, 234, 289, 252, 270, 222,
      287, 197, 312, 162, 342, 119, 357, 94, 360, 72, 352, 52, 332, 40, 317, 39],
    [207, 312, 225, 345, 192, 387, 157, 437, 139, 472, 137, 499, 147, 517, 162, 527, 177, 529, 177, 535,
      0, 535, 0, 529, 32, 525, 67, 509, 97, 479, 132, 419, 172, 359]
  ];

  // Presjek tijela: fasetirani osmerokut (meki minimum udaljenosti do
  // ravnina daje blago zaobljene bridove), stopljen s krugom prema
  // izraženosti faseta. Računa se za pola širine 1 i pamti, jer većina
  // prstenova ima iste proporcije i razlikuje se samo veličinom.
  let PRESJECI = {};
  function jedinicniPresjek(f) {
    const c = Math.SQRT1_2, cd = (1 + PLOHA) * c;
    const R = [1, 0, 1, -1, 0, 1, 0, 1, 1, 0, -1, 1, c, c, cd, -c, c, cd, c, -c, cd, -c, -c, cd];
    const M = 192, mek = 0.012, t = new Float64Array(8);
    const x = new Float32Array(M), z = new Float32Array(M);
    for (let j = 0; j < M; j++) {
      const th = j / M * 2 * Math.PI, ux = Math.cos(th), uz = Math.sin(th);
      let min = Infinity, zbroj = 0, k = 0;
      for (let q = 0; q < 24; q += 3) {
        const d = ux * R[q] + uz * R[q + 1];
        if (d > 1e-6) { const v = R[q + 2] / d; t[k++] = v; if (v < min) min = v; }
      }
      for (let q = 0; q < k; q++) zbroj += Math.exp(-(t[q] - min) / mek);
      const rp = min - mek * Math.log(zbroj);
      const r = 1 + (rp - 1) * f;
      x[j] = ux * r; z[j] = uz * r;
    }
    const vx = new Float32Array(M), vz = new Float32Array(M), tab = new Float32Array(M + 1), brid = new Uint8Array(M);
    for (let j = 0; j < M; j++) {
      const a = (j + M - 1) % M, b = (j + 1) % M;
      let ex = z[b] - z[a], ez = x[a] - x[b];
      const l = Math.hypot(ex, ez) || 1;
      ex /= l; ez /= l;
      if (ex * x[j] + ez * z[j] < 0) { ex = -ex; ez = -ez; }
      vx[j] = ex; vz[j] = ez;
      tab[j + 1] = tab[j] + Math.hypot(x[b] - x[j], z[b] - z[j]);
    }
    if (f > 0.5) {
      // brid između faseta: ondje gdje se smjer plohe najjače mijenja
      const promjena = new Float32Array(M);
      for (let j = 0; j < M; j++) {
        const a = (j + M - 1) % M, b = (j + 1) % M;
        promjena[j] = Math.hypot(vx[b] - vx[a], vz[b] - vz[a]);
      }
      for (let j = 0; j < M; j++) {
        if (promjena[j] > 0.15 && promjena[j] >= promjena[(j + M - 1) % M] && promjena[j] >= promjena[(j + 1) % M]) brid[j] = 1;
      }
    }
    return { x: x, z: z, vx: vx, vz: vz, tab: tab, obod: tab[M], brid: brid };
  }
  function presjekFlakona(W, f) {
    const kljuc = f.toFixed(3);
    const J = PRESJECI[kljuc] || (PRESJECI[kljuc] = jedinicniPresjek(f));
    return { J: J, W: W, obod: J.obod * W };
  }
  function naPresjeku(P, s) {
    const J = P.J, M = J.x.length;
    s /= P.W;
    let lo = 0, hi = M;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (J.tab[m] <= s) lo = m; else hi = m; }
    const dl = J.tab[lo + 1] - J.tab[lo], u = dl > 0 ? sat((s - J.tab[lo]) / dl) : 0, b = (lo + 1) % M;
    return { x: lerp(J.x[lo], J.x[b], u) * P.W, z: lerp(J.z[lo], J.z[b], u) * P.W, vx: lerp(J.vx[lo], J.vx[b], u), vz: lerp(J.vz[lo], J.vz[b], u), brid: J.brid[lo] };
  }

  // Vodoravni presjek tijela zadanog vrijednostima v na mreži (N + 1) × (N + 1)
  // preko kvadrata [-X, X]² (< 0 unutra): dužine po rubu (marching
  // squares), redom [x1, z1, x2, z2, ...]
  const RUBOVI = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]],
    8: [[2, 3]], 9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[1, 2]], 12: [[3, 1]], 13: [[0, 1]], 14: [[3, 0]] };
  function presjekPlohe(v, X, N) {
    const h = 2 * X / N, out = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const a = v[i * (N + 1) + j], b = v[(i + 1) * (N + 1) + j], c = v[(i + 1) * (N + 1) + j + 1], d = v[i * (N + 1) + j + 1];
        const idx = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        const x0 = -X + i * h, z0 = -X + j * h;
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
    }
    return out;
  }

  // Znak X kao maska: nacrta se u malo skriveno platno, pa se za svaku
  // točku pločice pogleda je li u znaku (u, v od 0 do 1)
  function maskaZnaka() {
    const W = 99, H = 142;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) return function () { return false; };
    ctx.scale(W / 495, H / 709);
    ctx.fillStyle = ctx.strokeStyle = '#fff';
    ctx.lineWidth = 8;                     // tanki potezi i serifi malo deblji, da ih linije uhvate
    ctx.lineJoin = 'round';
    ZNAK_X.forEach(function (o) {
      ctx.beginPath();
      for (let i = 0; i < o.length; i += 2) { if (i) ctx.lineTo(o[i], o[i + 1]); else ctx.moveTo(o[i], o[i + 1]); }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    const d = ctx.getImageData(0, 0, W, H).data;
    return function (u, v) {
      const i = Math.floor(u * W), j = Math.floor(v * H);
      return i >= 0 && j >= 0 && i < W && j < H && d[(j * W + i) * 4 + 3] > 96;
    };
  }

  function* flakon(n) {                       // generator: radi u koracima (vidi poKoracima)
    const K = FLAKON_K;
    const tocke = FLAKON.map(function (p) { return { h: p[0], y: DNO_BOCICE + p[0] * K, W: p[1] * K, f: p[2] }; });
    const seg = [];
    let ukupno = 0;
    for (let i = 0; i < tocke.length - 1; i++) {
      const p = tocke[i], q = tocke[i + 1];
      const dm = q.W - p.W, dy = q.y - p.y;
      const d = Math.hypot(dm, dy);
      if (d < 1e-6) continue;
      // profil ide odozdo prema gore: normala prema van je (dy, -dm)
      seg.push({ p: p, q: q, d: d, od: ukupno, nr: dy / d, ny: -dm / d });
      ukupno += d;
    }
    function sirinaNa(y) {                       // pola širine tijela na visini y
      for (let i = 0; i < tocke.length - 1; i++) {
        const p = tocke[i], q = tocke[i + 1];
        if (y >= p.y && y <= q.y && q.y > p.y) return lerp(p.W, q.W, (y - p.y) / (q.y - p.y));
      }
      return 0;
    }
    // vrh čepa: valjak odrezan plohom koja je sprijeda na rubu čepa, a
    // straga se uzdiže; po širini se sužava gotovo ravnim bokovima u šiljak
    const R0 = FLAKON[FLAKON.length - 1][1] * K, h0 = DNO_BOCICE + FLAKON_RUB * K, H = (FLAKON_VRH - FLAKON_RUB) * K;
    function vrhCepa(x, z) {
      const straga = sat((1 - z / R0) / 2), sredina = sat(1 - Math.pow(Math.min(1, Math.abs(x) / R0), 1.5));
      return h0 + H * Math.pow(straga, 1.5) * sredina;
    }
    function cep(x, y, z) { return Math.max(Math.hypot(x, z) - R0, y - vrhCepa(x, z)); }

    // mreža preko vrha čepa: udaljenost od stijenke i visina reza (ne ovise o visini presjeka)
    const MX = 64, MR = R0 * 1.08, mh = 2 * MR / MX;
    const doStijenke = new Float32Array((MX + 1) * (MX + 1)), rez = new Float32Array((MX + 1) * (MX + 1)), v = new Float32Array((MX + 1) * (MX + 1));
    for (let i = 0; i <= MX; i++) {
      for (let j = 0; j <= MX; j++) {
        const x = -MR + i * mh, z = -MR + j * mh;
        doStijenke[i * (MX + 1) + j] = Math.hypot(x, z) - R0;
        rez[i * (MX + 1) + j] = vrhCepa(x, z);
      }
    }

    // pločica: trapez (gore širi) na prednjoj plohi, znak X u sredini
    const PT = DNO_BOCICE + PLOCICA_VRH[0] * K, PB = DNO_BOCICE + PLOCICA_DNO[0] * K;
    const XT = DNO_BOCICE + ZNAK_VRH * K, XB = DNO_BOCICE + ZNAK_DNO * K, XW = ZNAK_POLA * K;
    function polaPlocice(y) { return lerp(PLOCICA_DNO[1], PLOCICA_VRH[1], (y - PB) / (PT - PB)) * K; }
    const uZnaku = maskaZnaka();
    function naZnaku(x, y) {                      // okvir (vanjski i unutarnji) ili znak X
      const hw = polaPlocice(y), rub = Math.min(hw - Math.abs(x), y - PB, PT - y);
      if (rub < 0) return false;
      if (rub < 0.008 || Math.abs(rub - 0.017) < 0.0022) return true;
      return y <= XT && y >= XB && uZnaku((x + XW) / (2 * XW), (XT - y) / (XT - XB));
    }

    function linije(korak, grubo) {
      const L = [];
      const k = Math.max(8, Math.round(ukupno / korak)), kk = ukupno / k;
      for (let i = 0; i < k; i++) {
        const s = (i + 0.5) * kk;
        let j = 0;
        while (j < seg.length - 1 && s > seg[j].od + seg[j].d) j++;
        const g = seg[j], t = sat((s - g.od) / g.d);
        const P = presjekFlakona(lerp(g.p.W, g.q.W, t), lerp(g.p.f, g.q.f, t));
        L.push({ prsten: P, y: lerp(g.p.y, g.q.y, t), nr: g.nr, ny: g.ny, zlato: lerp(g.p.h, g.q.h, t) >= FLAKON_ZLATO, duljina: P.obod, tezina: P.obod });
      }
      if (grubo) return L;
      for (let y = h0 + korak * 0.3; y < h0 + H; y += korak * 0.6) {      // vrh čepa malo gušće
        for (let q = 0; q < v.length; q++) v[q] = Math.max(doStijenke[q], y - rez[q]);
        const d = presjekPlohe(v, MR, MX);
        for (let q = 0; q < d.length; q += 4) {
          const len = Math.hypot(d[q + 2] - d[q], d[q + 3] - d[q + 1]);
          if (len > 1e-7) L.push({ a: [d[q], d[q + 1]], b: [d[q + 2], d[q + 3]], y: y, duljina: len, tezina: len });
        }
      }
      // okvir i znak X: vlastite guste linije preko pločice
      const dx = 0.0008;
      for (let y = PB + RED_PLOCICE / 2; y < PT; y += RED_PLOCICE) {
        const hw = polaPlocice(y), zf = sirinaNa(y) + 0.0075;
        let od = null;
        for (let x = -hw; x <= hw + dx; x += dx) {
          const u = x <= hw && naZnaku(x, y);
          if (u && od === null) od = x;
          else if (!u && od !== null) {
            const len = x - od;
            if (len > 1e-6) L.push({ znak: true, a: [od, zf], b: [x, zf], y: y, duljina: len, tezina: len * 3 });
            od = null;
          }
        }
      }
      return L;
    }
    // razmak linija ovisi o površini: prvo gruba procjena s rijetkim linijama
    let korak = 0.05;
    let L = linije(korak, true);
    const povrsina = L.reduce(function (z, l) { return z + l.duljina; }, 0) * korak;
    korak = Math.sqrt(povrsina * OMJER / n);
    yield;
    L = linije(korak);
    yield;

    // točke se dijele po težini linija (linije znaka su 3 puta gušće)
    const r = poLinijama(L.map(function (l) { return l.tezina; }), n);
    const poz = new Float32Array(n * 3), nor = new Float32Array(n * 3), vrsta = new Float32Array(n);
    const e = 0.002;
    for (let i = 0; i < n; i++) {
      if (i % 4000 === 3999) yield;
      const l = L[r.linija[i]];
      let x, y = l.y, z, nx, ny, nz, m;
      if (l.prsten) {
        const q = naPresjeku(l.prsten, ((r.udio[i] + r.linija[i] * 0.618034) % 1) * l.prsten.obod);
        x = q.x; z = q.z;
        nx = q.vx * l.nr; ny = l.ny; nz = q.vz * l.nr;
        m = l.zlato ? ZLATO : (q.brid ? BRID : STAKLO);
      } else if (l.znak) {
        x = lerp(l.a[0], l.b[0], r.udio[i]); z = l.a[1];
        nx = 0; ny = 0; nz = 1;
        m = SLOVO;
      } else {
        x = lerp(l.a[0], l.b[0], r.udio[i]); z = lerp(l.a[1], l.b[1], r.udio[i]);
        nx = cep(x + e, y, z) - cep(x - e, y, z); ny = cep(x, y + e, z) - cep(x, y - e, z); nz = cep(x, y, z + e) - cep(x, y, z - e);
        m = ZLATO;
        const u = (y - h0) / H;
        if (u > 0.5) z += R0 * 0.4 * (u - 0.5) * (u - 0.5) / 0.25;   // šiljak se pri vrhu izvija naprijed
      }
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      // točke stakla na mjestu pločice postaju zlatna pločica (malo strši)
      if ((m === STAKLO || m === BRID) && z > 0 && nz > 0.35 && y >= PB && y <= PT && Math.abs(x) <= polaPlocice(y)) {
        m = PLOCICA;
        x += nx * 0.006; y += ny * 0.006; z += nz * 0.006;
      }
      poz[3 * i] = x; poz[3 * i + 1] = y; poz[3 * i + 2] = z;
      nor[3 * i] = nx; nor[3 * i + 1] = ny; nor[3 * i + 2] = nz;
      vrsta[i] = m;
    }
    PRESJECI = {};                               // zapamćeni presjeci više ne trebaju
    return { poz: poz, nor: nor, vrsta: vrsta };
  }


  // ─────────────────────────────────────────────────────────────────────
  //  POVRŠINA, KAP I FLAKON NA POVRŠINI
  //
  //  Prizor: površina tekućine je u ravnini y = 0 (polumjer RJ, prema rubu
  //  se utopi u tamu), flakon stoji na njoj (dno u y = 0, visina 1,76 kao u
  //  pocetna-chata.js), a kap pada s visine Y0. Prizor je nagnut prema nama
  //  (NAGIB) i malo smanjen (KOMP), pa površina s odrazom stane u prostor
  //  animacije. Svaka točkica ima 12 brojeva: [aP] [aN] [aRnd]
  //   - površina: aP = (udaljenost od sredine, kut, 0, 0)
  //   - kap: aP = mjesto u kapi (visina kapi = 1), aN = normala i uloga
  //     nakon udara (0..19 kapljica krune, −1 kapljica koja poskoči iz sredine)
  //   - flakon: aP = mjesto (y od dna) i vrsta točke, aN = normala i visina (0..1)
  // ─────────────────────────────────────────────────────────────────────
  const RJ = 1.25;            // polumjer površine (svjetske jedinice)
  const NAGIB = 0.24;         // gledamo površinu malo odozgo (oko 14°)
  const KOMP = 0.86;          // cijeli prizor malo manji
  const POMAK = -0.70;        // prizor (površina s flakonom) po visini u prostoru animacije
  const Y0 = 1.55;            // kap visi na ovoj visini, pa padne
  const PAD = 1.35;           // trenutak kad kap krene padati (s u krugu)
  const UDAR = 1.9;           // trenutak udara u površinu
  const G = 5.2;              // teža za kapljice nakon udara (sporije od pada kapi, da se kruna vidi)
  // valovi: [trenutak u krugu, jačina] — udar kapi, kapljica iz sredine, dizanje flakona, slijevanje flakona
  const UDARI = [UDAR, 0.032, UDAR + 2 * 1.35 / G, 0.014, 3.3, 0.010, 12.4, 0.018];

  function povrsina(n, rnd) {
    const out = new Float32Array(n * 12);
    for (let i = 0; i < n; i++) {
      const o = 12 * i;
      out[o] = RJ * Math.sqrt((i + rnd()) / n);   // jednoliko po površini kruga
      out[o + 1] = rnd() * 2 * Math.PI;
      for (let k = 8; k < 12; k++) out[o + k] = rnd();
    }
    return out;
  }

  // kap: okruglo dno, prema vrhu se suzi u šiljak (niti po profilu, kao bočice)
  function kap(n, rnd) {
    const prof = [];
    for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI / 2; prof.push([0.32 - 0.32 * Math.cos(a), 0.32 * Math.sin(a)]); }
    for (let k = 1; k <= 16; k++) { const y = 0.32 + 0.68 * k / 16; prof.push([y, 0.32 * Math.pow(1 - (y - 0.32) / 0.68, 1.4)]); }
    const seg = [];
    let ukupno = 0;
    for (let i = 0; i < prof.length - 1; i++) {
      const p = prof[i], q = prof[i + 1], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      seg.push({ p: p, q: q, d: d, od: ukupno, nr: (q[0] - p[0]) / d, ny: -(q[1] - p[1]) / d });
      ukupno += d;
    }
    const K = 40, L = [];
    for (let i = 0; i < K; i++) {
      const s = (i + 0.5) / K * ukupno;
      let j = 0;
      while (j < seg.length - 1 && s > seg[j].od + seg[j].d) j++;
      const g = seg[j], t = sat((s - g.od) / g.d);
      L.push({ y: lerp(g.p[0], g.q[0], t), r: lerp(g.p[1], g.q[1], t), g: g });
    }
    const r = poLinijama(L.map(function (l) { return 2 * Math.PI * l.r + 1e-4; }), n);
    const out = new Float32Array(n * 12);
    for (let i = 0; i < n; i++) {
      const l = L[r.linija[i]], a = (r.udio[i] + r.linija[i] * 0.618034) * 2 * Math.PI, o = 12 * i;
      out[o] = Math.cos(a) * l.r; out[o + 1] = l.y; out[o + 2] = Math.sin(a) * l.r;
      const nl = Math.hypot(l.g.nr, l.g.ny) || 1;
      out[o + 4] = Math.cos(a) * l.g.nr / nl; out[o + 5] = l.g.ny / nl; out[o + 6] = Math.sin(a) * l.g.nr / nl;
      out[o + 7] = rnd() < 0.2 ? -1 : Math.floor(rnd() * 28);
      for (let k = 8; k < 12; k++) out[o + k] = rnd();
    }
    return out;
  }

  // flakon iz pocetna-chata.js, s dnom na površini
  function flakonNaPovrsini(n, rnd) {
    const gen = flakon(n);
    let r = gen.next();
    while (!r.done) r = gen.next();
    const f = r.value, out = new Float32Array(n * 12);
    for (let i = 0; i < n; i++) {
      const o = 12 * i, y = f.poz[3 * i + 1] - DNO_BOCICE;
      out[o] = f.poz[3 * i]; out[o + 1] = y; out[o + 2] = f.poz[3 * i + 2]; out[o + 3] = f.vrsta[i];
      out[o + 4] = f.nor[3 * i]; out[o + 5] = f.nor[3 * i + 1]; out[o + 6] = f.nor[3 * i + 2]; out[o + 7] = y / (VRH_BOCICE - DNO_BOCICE);
      for (let k = 8; k < 12; k++) out[o + k] = rnd();
    }
    return out;
  }


  // ─────────────────────────────────────────────────────────────────────
  //  SHADER — jedan program, tri sloja (uSloj); svjetlo i boje kao u
  //  pocetna-chata.js
  // ─────────────────────────────────────────────────────────────────────
  const VS = `
    precision highp float;

    attribute vec4 aRnd;
    attribute vec4 aP;
    attribute vec4 aN;

    uniform float uSloj;     // 0 površina, 1 kap i kapljice, 2 flakon
    uniform float uOdraz;    // 1: odraz u površini (zrcaljeno preko nje)
    uniform float uT;        // vrijeme od otvaranja (s)
    uniform float uC;        // vrijeme u krugu (s)
    uniform mat3 uRot;       // nagib prizora (i nagib prema mišu)
    uniform float uKut;      // okret flakona oko osi
    uniform vec2 uPx;
    uniform vec2 uCenter;
    uniform float uSize;
    uniform vec3 uOko;       // kamera u koordinatama prizora (za odraz)
    uniform vec2 uUdari[4];  // izvori valova: trenutak (s u krugu) i jačina
    uniform vec3 uAlpha;     // jačina točkica: površina, kap, flakon
    uniform float uSjaj;     // odsjaj niz flakon (visina kao u pocetna-chata.js)
    uniform vec3 uSilver;
    uniform vec3 uPowder;
    uniform vec3 uGold;

    varying vec4 vCol;

    const float PI = 3.14159265;
    const float CAM = 4.2;
    const float KRUG = ${P.krug.toFixed(2)};
    const float RJ = ${RJ.toFixed(3)};
    const float KOMP = ${KOMP.toFixed(3)};
    const float POMAK = ${POMAK.toFixed(3)};
    const float Y0 = ${Y0.toFixed(3)};
    const float PAD = ${PAD.toFixed(3)};
    const float UDAR = ${UDAR.toFixed(3)};
    const float G = ${G.toFixed(3)};

    vec2 okreni(vec2 v, float k) {
      float c = cos(k), s = sin(k);
      return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
    }
    float glatko5(float k) { return k * k * k * (k * (k * 6.0 - 15.0) + 10.0); }

    // visina površine na udaljenosti r od sredine: krugovi valova od svakog
    // izvora (vodeći val oštriji, iza njega nekoliko slabijih)
    float valovi(float r) {
      float h = 0.0;
      for (int i = 0; i < 4; i++) {
        float tau = uC - uUdari[i].x;
        if (tau < 0.0) tau += KRUG;
        float f = r - 0.6 * tau;
        float omot = f > 0.0 ? exp(-f * f / 0.01) : exp(-f * f / 0.08);
        h += uUdari[i].y * exp(-0.8 * tau) * sin(30.0 * f) * omot / sqrt(0.2 + r);
      }
      return h;
    }

    void main() {
      float c = uC;
      vec3 p, n, col;
      float lit = 1.0, back = 0.4, alpha = 0.0, pov = 0.0, nagibV = 0.0, rubDna = 0.0, jak = 1.0;
      float iskra = step(0.993, aRnd.z);

      if (uSloj < 0.5) {
        // POVRŠINA: tamno zrcalo; valovi se vide kao svijetli krugovi
        float r = aP.x, a = aP.y;
        // dok se flakon diže, tekućina oko sredine se zavrti i malo spusti
        float vrtlog = smoothstep(3.0, 3.8, c) * (1.0 - smoothstep(5.0, 6.2, c));
        a += 2.4 * exp(-r * r / 0.07) * vrtlog;
        float e = 0.012;
        nagibV = (valovi(r + e) - valovi(max(r - e, 0.0))) / (2.0 * e);
        float h = valovi(r) - 0.05 * exp(-r * r / 0.035) * vrtlog;
        p = vec3(cos(a) * r, h, sin(a) * r);
        n = normalize(vec3(-nagibV * cos(a), 1.0, -nagibV * sin(a)));
        // esencija: s prvim valom se zlatna boja razlije po površini, a do kraja kruga izblijedi
        float esencija = step(UDAR, c) * (1.0 - smoothstep(0.0, 0.35, r - 0.6 * (c - UDAR))) * (1.0 - smoothstep(9.0, 14.5, c));
        col = mix(uSilver * 0.8, uGold * 1.1, 0.2 + 0.6 * esencija);
        // svijetli rub tekućine oko dna flakona dok stoji
        float stoji = smoothstep(4.0, 5.2, c) * (1.0 - smoothstep(11.8, 12.8, c));
        float d = (r - 0.24) / 0.035;
        rubDna = 0.7 * exp(-d * d) * stoji;
        alpha = uAlpha.x * (1.0 - smoothstep(0.45 * RJ, RJ, r));
        pov = 1.0;
        iskra *= step(0.5, aRnd.w);
      } else if (uSloj < 1.5) {
        // KAP: iz iskrica se skupi zlatna kap, nabubri i padne; pri udaru se
        // rasprsne u krunu kapljica, a iz sredine poskoči jedna kapljica
        vec3 oblik = aP.xyz;
        float kg = clamp((c - 0.25 - 0.5 * aRnd.x) / 0.6, 0.0, 1.0);
        float eg = glatko5(kg);
        float nabubri = 1.0 + 0.18 * smoothstep(0.9, PAD, c);
        float pad = clamp((c - PAD) / (UDAR - PAD), 0.0, 1.0);
        float izduzi = 1.0 + 0.6 * pad;
        vec3 kapP = oblik * vec3(0.085 / sqrt(izduzi), 0.22 * izduzi, 0.085 / sqrt(izduzi)) * nabubri + vec3(0.0, Y0 * (1.0 - pad * pad), 0.0);
        vec3 izvor = kapP + normalize(aRnd.yzw - 0.5 + 0.001) * (0.25 + 0.3 * aRnd.x) + vec3(0.0, 0.1, 0.0);
        p = mix(izvor, kapP, eg);
        n = aN.xyz;
        col = uGold * 1.15;
        lit = 1.0; back = 0.45;
        alpha = uAlpha.y * eg * (1.0 + 0.6 * sin(PI * eg));
        if (c >= UDAR) {
          float tau = c - UDAR;
          vec3 sr;
          float vel;
          if (aN.w >= 0.0) {
            // kapljica krune: svaka svojim smjerom, brzinom i veličinom
            float kk = fract(aN.w * 0.618034);
            float th = aN.w / 28.0 * 2.0 * PI + (kk - 0.5) * 0.25;
            float vr = 0.4 + 0.45 * kk, vy = 0.9 + 0.7 * fract(aN.w * 0.381966);
            sr = vec3(cos(th) * (0.06 + vr * tau), vy * tau - 0.5 * G * tau * tau, sin(th) * (0.06 + vr * tau));
            sr += (aRnd.yzw - 0.5) * 0.012;
            vel = 0.12 + 0.14 * kk;
          } else {
            sr = vec3(0.0, 1.35 * tau - 0.5 * G * tau * tau, 0.0);
            vel = 0.45;
          }
          p = sr + oblik * vec3(0.085, 0.22, 0.085) * vel;
          alpha = uAlpha.y * (1.0 - smoothstep(0.0, 0.03, -sr.y)) * (1.0 - step(1.2, tau));
          col *= 1.0 + 1.5 * exp(-tau * 8.0);                       // bljesak pri udaru
        }
      } else {
        // FLAKON: diže se iz površine u vrtlogu (staklo se puni odozdo, čep
        // zadnji), polako se okreće, a na kraju se odozgo slije natrag
        vec3 T = aP.xyz;
        float h01 = aN.w, yE = T.y - 0.86;                          // yE: visina kao u pocetna-chata.js
        T.xz = okreni(T.xz, -uKut);
        vec3 N = aN.xyz;
        N.xz = okreni(N.xz, -uKut);
        float kr = clamp((c - 3.2 - 1.8 * h01 - 0.35 * aRnd.x) / 0.95, 0.0, 1.0);
        float er = glatko5(kr);
        vec2 s0 = vec2(cos(aRnd.y * 2.0 * PI), sin(aRnd.y * 2.0 * PI)) * (0.08 + 0.32 * aRnd.z);
        p = mix(vec3(s0.x, 0.0, s0.y), T, er);
        p.xz = okreni(p.xz, -(1.0 - er) * (1.0 - er) * 3.0);
        p.y += 0.05 * sin(PI * er);
        n = normalize(mix(vec3(0.0, 1.0, 0.0), N, er) + vec3(0.0, 0.0, 1e-4));
        // boja i svjetlo kao flakon() u pocetna-chata.js
        float m = aP.w;
        float zlato = step(0.5, m) * step(m, 3.5);
        float plocica = step(1.5, m) * step(m, 3.5);
        float slovo = step(2.5, m) * step(m, 3.5);
        float brid = step(3.5, m);
        float staklo = (1.0 - zlato) * step(yE, 0.3);
        float razina = 0.2 + 0.02 * sin(uT * 1.3 + aP.x * 3.0) + 0.01 * sin(uT * 2.1 - aP.z * 5.0);
        float tekucina = staklo * (1.0 - smoothstep(razina - 0.014, razina + 0.014, yE)) * smoothstep(-0.9, -0.45, yE);
        float dr = (yE - razina) / 0.016, dv = (yE - uSjaj) / 0.06;
        vec3 cs = mix(uSilver, uGold * 1.1, tekucina * 0.45) + uGold * staklo * exp(-dr * dr) * 0.6;
        cs *= 1.0 + 0.5 * brid;
        vec3 cz = mix(uGold * 1.05, mix(uGold * 0.95, mix(uGold, uPowder, 0.2) * 1.2, slovo), plocica);
        col = mix(cs, cz, zlato) + vec3(0.5) * exp(-dv * dv);
        lit = mix(mix(0.75, 1.0, zlato), 0.35, plocica);
        back = mix(0.45, 0.28, zlato);
        jak = 1.0 + 0.8 * plocica - 1.0 * slovo + 1.2 * brid;
        float bl = (kr - 0.82) / 0.07;
        col *= 1.0 + exp(-bl * bl) * 0.8;                           // točkica zasvijetli kad sjedne
        col = mix(uGold * 1.1, col, smoothstep(0.3, 0.9, er));      // u letu je zlatna esencija
        alpha = uAlpha.z * jak * smoothstep(0.05, 0.6, er);
        // slijevanje: odozgo, točkice kliznu niz bočicu u površinu i razliju se
        float km = clamp((c - 11.2 - 1.5 * (1.0 - h01) - 0.3 * aRnd.x) / 1.1, 0.0, 1.0);
        if (km > 0.0) {
          p.y = mix(p.y, 0.0, km * km);
          p.xz *= 1.0 + smoothstep(0.7, 1.0, km) * (0.6 + 1.6 * aRnd.w);
          col = mix(col, uGold * 1.1, 0.4 * km);
          alpha *= 1.0 - smoothstep(0.75, 1.0, km);
        }
      }

      float vel = 1.0;
      if (uOdraz > 0.5) {
        // odraz: točkica zrcaljena preko površine; vidi se samo gdje je površina,
        // slabija je što je dalje od površine i njiše se s valovima
        vec3 z = vec3(p.x, -p.y, p.z);
        float s = uOko.y / (uOko.y - z.y);
        vec3 I = uOko + s * (z - uOko);
        float rI = length(I.xz);
        float v = valovi(rI);
        z.x += (0.006 + 0.5 * abs(v)) * sin(z.y * 26.0 + uT * 2.3) + 0.6 * v;
        p = z;
        n.y = -n.y;
        alpha *= 0.34 * exp(-1.2 * abs(z.y)) * (1.0 - smoothstep(0.25, 0.65, abs(z.y))) * (1.0 - smoothstep(0.9 * RJ, 1.5 * RJ, rI));
        col = mix(col, uGold, 0.15);
        vel = 1.25;
        iskra = 0.0;
      }

      vec3 q = uRot * (p * KOMP) + vec3(0.0, POMAK, 0.0);
      vec3 nq = normalize(uRot * n);
      float persp = CAM / (CAM - q.z);
      gl_Position = vec4(q.x * uPx.x * persp + uCenter.x, q.y * uPx.y * persp + uCenter.y, 0.0, 1.0);
      gl_PointSize = uSize * persp * vel * (1.0 + iskra * 0.7);
      alpha *= 1.0 - smoothstep(0.92, 1.0, abs(gl_Position.x));

      vec3 L = normalize(vec3(-0.5, 0.62, 0.6));
      vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
      float treptaj = 0.84 + 0.16 * sin(uT * (1.5 + 2.0 * aRnd.w) + aRnd.y * 40.0);
      treptaj = mix(treptaj, 1.0 + 1.1 * max(0.0, sin(uT * 2.1 + aRnd.x * 50.0)), iskra);
      if (pov > 0.5) {
        // površina: tamna, valovi se vide po nagibu i odsjaju
        float spe = pow(max(dot(nq, H), 0.0), 40.0);
        float b = 0.14 + 3.0 * spe + 4.5 * abs(nagibV) + rubDna;
        vCol = vec4(col * b, alpha * treptaj * mix(0.55, 1.0, smoothstep(-0.8, 0.8, q.z)));
        return;
      }
      float dif = max(dot(nq, L), 0.0);
      float spe = pow(max(dot(nq, H), 0.0), 26.0);
      float rub = pow(1.0 - abs(nq.z), 2.2);
      float nebo = smoothstep(-0.08, 0.3, nq.y);
      float svjetlo = 0.08 + 0.7 * dif + 1.5 * spe + 0.6 * rub + 0.28 * nebo;
      float lice = mix(back, 1.0, smoothstep(-0.2, 0.25, nq.z));
      float dubina = mix(1.0, clamp(0.62 + 0.42 * (q.z - 0.15), 0.25, 1.15), lit);
      vCol = vec4(col * mix(1.0, svjetlo, lit) * lice, alpha * treptaj * dubina);
    }
  `;

  const FS = `
    precision mediump float;
    varying vec4 vCol;
    void main() {
      vec2 d = gl_PointCoord * 2.0 - 1.0;
      float r = dot(d, d);
      if (r > 1.0) discard;
      gl_FragColor = vec4(vCol.rgb, vCol.a * (1.0 - 0.6 * r));
    }
  `;

  const UNIFORME = ['uSloj', 'uOdraz', 'uT', 'uC', 'uRot', 'uKut', 'uPx', 'uCenter', 'uSize', 'uOko', 'uUdari', 'uAlpha',
    'uSjaj', 'uSilver', 'uPowder', 'uGold'];

  function matrica(kutY, nagib) {            // Rx(nagib) · Ry(kutY), po stupcima (kao u pocetna-chata.js)
    const cy = Math.cos(kutY), sy = Math.sin(kutY), cx = Math.cos(nagib), sx = Math.sin(nagib);
    return [cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy];
  }


  // ─────────────────────────────────────────────────────────────────────
  //  ANIMACIJA
  // ─────────────────────────────────────────────────────────────────────
  function pokreni() {
    const korijen = document.querySelector('.mx-p');
    const platno = korijen.querySelector('.mx-p-platno');
    const prostor = korijen.querySelector('.mx-p-animacija');
    const gl = platno.getContext('webgl', { alpha: false, antialias: false, depth: false, premultipliedAlpha: false });
    if (!gl) return;
    function shader(vrsta, izvor) {
      const s = gl.createShader(vrsta);
      gl.shaderSource(s, izvor);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(program, 0, 'aRnd');
    gl.bindAttribLocation(program, 1, 'aP');
    gl.bindAttribLocation(program, 2, 'aN');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const U = {};
    UNIFORME.forEach(function (u) { U[u] = gl.getUniformLocation(program, u); });

    const rnd = slucajno(1861);
    const nF = MOBITEL ? P.tocakaMobitel : P.tocaka, nP = MOBITEL ? P.tocakaPovrsineMobitel : P.tocakaPovrsine, nK = P.tocakaKapi;
    function spremnik(podaci) {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, podaci, gl.STATIC_DRAW);
      return b;
    }
    const slojevi = {
      povrsina: { b: spremnik(povrsina(nP, rnd)), n: nP, sloj: 0 },
      kap: { b: spremnik(kap(nK, rnd)), n: nK, sloj: 1 },
      flakon: { b: spremnik(flakonNaPovrsini(nF, rnd)), n: nF, sloj: 2 }
    };
    [0, 1, 2].forEach(function (i) { gl.enableVertexAttribArray(i); });
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.uniform3fv(U.uSilver, boja01(B.srebro));
    gl.uniform3fv(U.uPowder, boja01(B.puder));
    gl.uniform3fv(U.uGold, zasiti(boja01(B.zlato), 1.2));
    gl.uniform2fv(U.uUdari, new Float32Array(UDARI));
    // jačina točkica: flakon kao u pocetna-chata.js (0,7 uz 26 000 točkica), ostalo prema tome
    const g = Math.min(2, Math.max(0.25, Math.pow(nF / (MOBITEL ? 16000 : 26000), -0.65)));
    gl.uniform3f(U.uAlpha, 0.55 * Math.pow(30000 / nP, 0.8), 0.32 * Math.pow(7000 / nK, 0.8), 0.7 * g);

    let W = 1, H = 1, dpr = 1, S = 160, sx = 0, sy = 0;
    function velicina() {
      W = Math.max(1, platno.clientWidth); H = Math.max(1, platno.clientHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      platno.width = Math.round(W * dpr); platno.height = Math.round(H * dpr);
      gl.viewport(0, 0, platno.width, platno.height);
      const sw = prostor.offsetWidth, sh = prostor.offsetHeight;
      S = Math.max(40, Math.min(sw / 2.15, sh / 2.3) * P.velicinaAnimacije);
      let ox = 0, oy = 0;
      for (let e = prostor; e && e !== platno.offsetParent; e = e.offsetParent) { ox += e.offsetLeft; oy += e.offsetTop; }
      sx = ox + sw / 2; sy = oy + sh / 2;
    }
    velicina();
    window.addEventListener('resize', velicina);

    let misX = 0, misY = 0, nagibX = 0, nagibY = 0;
    if (MIS) {
      korijen.addEventListener('pointermove', function (e) {
        const r = korijen.getBoundingClientRect();
        misX = sat((e.clientX - r.left) / r.width) * 2 - 1; misY = sat((e.clientY - r.top) / r.height) * 2 - 1;
      });
      korijen.addEventListener('pointerleave', function () { misX = misY = 0; });
    }

    function nacrtaj(t) {
      const c = t % P.krug;
      const R = matrica(nagibX * 0.25, NAGIB + nagibY * 0.1);
      // kamera u koordinatama prizora: Rᵀ · ((0, 0, CAM) − (0, POMAK, 0)) / KOMP
      const v = [0, -POMAK, 4.2];
      const oko = [0, 1, 2].map(function (k) { return (R[3 * k] * v[0] + R[3 * k + 1] * v[1] + R[3 * k + 2] * v[2]) / KOMP; });
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uT, t);
      gl.uniform1f(U.uC, c);
      gl.uniformMatrix3fv(U.uRot, false, R);
      gl.uniform1f(U.uKut, -0.3 + 0.45 * (c - 3.2));
      gl.uniform2f(U.uPx, 2 * S / W, 2 * S / H);
      gl.uniform2f(U.uCenter, 2 * sx / W - 1, 1 - 2 * sy / H);
      gl.uniform1f(U.uSize, 1.35 * dpr * Math.min(1.25, Math.max(0.8, Math.sqrt(S / 160))));
      gl.uniform3fv(U.uOko, oko);
      gl.uniform1f(U.uSjaj, lerp(1.15, -1.25, (c - 6.4) / 1.7));
      function crtaj(s, odraz) {
        gl.bindBuffer(gl.ARRAY_BUFFER, s.b);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 48, 0);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 48, 16);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 48, 32);
        gl.uniform1f(U.uSloj, s.sloj);
        gl.uniform1f(U.uOdraz, odraz ? 1 : 0);
        gl.drawArrays(gl.POINTS, 0, s.n);
      }
      crtaj(slojevi.povrsina, false);
      if (c > 3.1) crtaj(slojevi.flakon, true);
      if (c > 0.2 && c < UDAR + 0.1) crtaj(slojevi.kap, true);
      if (c > 3.1) crtaj(slojevi.flakon, false);
      if (c > 0.2 && c < UDAR + 1.3) crtaj(slojevi.kap, false);
    }

    let vrijeme = 0, zadnje = performance.now();
    function sljedeca(sad) {
      requestAnimationFrame(sljedeca);
      const dt = Math.min(0.05, Math.max(0, (sad - zadnje) / 1000));
      zadnje = sad;
      vrijeme += dt;
      const f = 1 - Math.exp(-dt * 3.5);
      nagibX += (misX - nagibX) * f; nagibY += (misY - nagibY) * f;
      nacrtaj(vrijeme);
    }
    nacrtaj(0);
    korijen.classList.add('mx-p-spremno');
    window.__mxPokus = { kap: true };              // (za snimanje pokusa)
    requestAnimationFrame(sljedeca);
  }

  function kreni() {
    const f = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    f.then(function () {
      try { pokreni(); } catch (e) { console.error('[Martimex] Kap esencije:', e); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kreni);
  else kreni();
})();
