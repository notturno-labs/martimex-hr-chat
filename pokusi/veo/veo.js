/* ═════════════════════════════════════════════════════════════════════
   VEO — pokusna animacija za početni ekran chata (Martimex)

   Nova priča oko istog flakona i iste tamne površine koja ga zrcali (kao u
   kap.js): predstavljanje ispod vela, kao kad se otkriva novi parfem.
   Krug traje 14 s, usporeno, kao u reklami:
    1. iz tame polako pada svileni veo ružičastog pudera; vijori i lovi
       svjetlo (oko 0,6 s ulazi u kadar)
    2. zakači se za nešto nevidljivo: vrh čepa (oko 2,2 s). Spušta se,
       obavija ga i otkriva oblik flakona; kroz tkaninu se staklo i zlato tek
       naziru, a gdje rubovi vela dodirnu površinu, po njoj se šire tihi krugovi
    3. nevidljiva ruka uhvati veo pri vrhu (4,7 s) i povuče ga gore i natrag:
       svila klizi niz staklo, a otkriveno staklo zasvijetli na rubu vela;
       veo odleti u tamu, preko flakona prijeđe svjetlo (6,9 s)
    4. flakon stoji sam i zrcali se; kamera ga polako obilazi i primiče se,
       svjetlo se polako njiše pa odsjaji klize preko faseta (i još jednom
       prijeđe niz flakon, 11,2 s)
    5. iz tame pada novi veo, prekrije flakon i krug kreće ispočetka (pri
       prvom otvaranju flakon se ne vidi dok ga veo ne otkrije)
   Veo je prava simulacija tkanine (XPBD: mreža čestica, niti se ne
   rastežu, savija se mekano, zrak ga koči okomito na plohu, klizi po
   flakonu uz trenje i leži na površini). Točkice vela su u nitima tkanine,
   kao flakon u nitima stakla.
   Geometrija flakona prepisana je iz pocetna-chata.js (označeno niže).
   ═════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const POSTAVKE = {
    boje: {
      podloga: '#000000', srebro: '#e8e6eb', puder: '#f6ebe7', zlato: '#e0bb72',
      svila: '#e6b6a0',          // veo: svila ružičastog pudera (kao naglasak u naslovu)
      sjajSvile: '#ffe6cf'       // topli odsjaj na svili
    },
    krug: 14,                    // trajanje kruga (s)
    tocaka: 56000,               // flakon (kao u pocetna-chata.js), računalo
    tocakaMobitel: 32000,
    tocakaPovrsine: 42000,       // površina tekućine
    tocakaPovrsineMobitel: 24000,
    tocakaVela: 42000,           // veo (točkice u nitima tkanine)
    tocakaVelaMobitel: 21000,
    velicinaAnimacije: 1.09      // kao u pocetna-chata.js
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
  //  PRIZOR: POVRŠINA, FLAKON I VEO
  //
  //  Površina tekućine je u ravnini y = 0 (polumjer RJ, prema rubu se utopi
  //  u tamu) i zrcali sve iznad sebe; flakon stoji na njoj (dno u y = 0,
  //  visina 1,76 kao u pocetna-chata.js). Veo je kvadratna svilena tkanina,
  //  simulirana kao mreža čestica. Prizor je nagnut prema nama (NAGIB) i
  //  malo smanjen (KOMP), pa površina s odrazom stane u prostor animacije.
  //  Točkice površine i flakona imaju 12 brojeva: [aP] [aN] [aRnd]
  //   - površina: aP = (udaljenost od sredine, kut, 0, 0)
  //   - flakon: aP = mjesto (y od dna) i vrsta točke, aN = normala i visina (0..1)
  //  Točkice vela su u nitima tkanine; mjesto, normalu i smjer niti svake
  //  sličice izračuna simulacija (vidi osvjeziVeo).
  // ─────────────────────────────────────────────────────────────────────
  const RJ = 1.25;            // polumjer površine (svjetske jedinice)
  const NAGIB = 0.24;         // gledamo površinu malo odozgo (oko 14°)
  const KOMP = 0.86;          // cijeli prizor malo manji
  const POMAK = -0.70;        // prizor po visini u prostoru animacije
  const CAM = 4.2;            // udaljenost kamere
  const VISINA = VRH_BOCICE - DNO_BOCICE;   // visina flakona (1,76)
  const KUT_FLAKONA = 0.3;    // flakon je malo zakrenut, da se vide fasete
  // vremenski tijek kruga (s)
  const TIJEK = {
    vuci: 4.7,                // nevidljiva ruka uhvati veo i povuče ga
    vuciT: 2.6,               // koliko dugo ruka vuče (dalje veo odleti u tamu)
    nestao: 8.0,              // veo je izašao iz svjetla: dalje se ne simulira ni crta
    sjaji: [6.9, 11.2]        // svjetlo prijeđe preko flakona: kad se otkrije i još jednom
  };
  // veo: svilena tkanina
  const VEO = {
    cvorova: 45, cvorovaMobitel: 35,   // čestica simulacije po stranici
    vel: 3.0,                          // stranica tkanine (flakon je visok 1,76)
    visina: 3.05,                      // odakle pada (iznad kadra)
    pomak: [0.06, -0.05],              // sredina malo izvan osi flakona, da se ne složi simetrično
    zakret: 0.42,                      // zakret tkanine oko okomite osi
    korak: 1 / 300,                    // korak simulacije (s)
    teza: 3.0,                         // teža (usporeno, kao u reklami)
    zrakOkomito: 3.6,                  // otpor zraka okomito na tkaninu (lebdi i vijori)
    zrakUzduz: 0.3,                    // otpor zraka uzduž tkanine
    smik: 2e-4,                        // podatnost smika (XPBD): tkanje se lako iskosi, pa se svila priljubi uz oblik
    savijanje: 1.5e-4,                 // podatnost savijanja: svila je mekana
    debljina: 0.018,                   // razmak tkanine od stakla
    trenjeStaklo: 0.5, trenjeVrh: 1.5, trenjePovrsina: 0.8,
    povrsina: 0.004,                   // tkanina leži malo iznad površine
    hvat: [-0.10, 1.66, -0.16],        // ruka uhvati veo ovdje (straga lijevo, pri vrhu čepa)
    ruka1: [-0.05, 0.9, -0.25],        // put ruke (Bézier): prva kontrolna točka je pomak od hvata,
    ruka2: [-0.8, 3.3, -0.8],          // druge dvije su mjesta u prizoru
    ruka3: [-2.6, 5.4, -1.5]
  };
  const OMJER_VELA = 2.6;     // točkice uzduž niti vela gušće nego razmak niti (niti kao kod satena)

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

  // flakon iz pocetna-chata.js, s dnom na površini
  function flakonNaPovrsini(n, rnd) {
    const gen = flakon(n);
    let r = gen.next();
    while (!r.done) r = gen.next();
    const f = r.value, out = new Float32Array(n * 12);
    for (let i = 0; i < n; i++) {
      const o = 12 * i, y = f.poz[3 * i + 1] - DNO_BOCICE;
      out[o] = f.poz[3 * i]; out[o + 1] = y; out[o + 2] = f.poz[3 * i + 2]; out[o + 3] = f.vrsta[i];
      out[o + 4] = f.nor[3 * i]; out[o + 5] = f.nor[3 * i + 1]; out[o + 6] = f.nor[3 * i + 2]; out[o + 7] = y / VISINA;
      for (let k = 8; k < 12; k++) out[o + k] = rnd();
    }
    return out;
  }

  // pola širine flakona na visini h (u pikselima fotografije, 0 = dno);
  // vrh čepa se sužava u šiljak
  function sirinaFlakona(h) {
    if (h <= 0 || h >= FLAKON_VRH) return 0;
    if (h >= FLAKON_RUB) return FLAKON[FLAKON.length - 1][1] * (FLAKON_VRH - h) / (FLAKON_VRH - FLAKON_RUB);
    for (let i = 0; i < FLAKON.length - 1; i++) {
      const p = FLAKON[i], q = FLAKON[i + 1];
      if (h >= p[0] && h <= q[0] && q[0] > p[0]) return lerp(p[1], q[1], (h - p[0]) / (q[0] - p[0]));
    }
    return 0;
  }


  // ─────────────────────────────────────────────────────────────────────
  //  SUDARI S FLAKONOM: za veo je flakon tijelo vrtnje (presjek je krug
  //  umjesto osmerokuta, čep je kupola sa šiljkom u osi). Udaljenost do
  //  plašta se izračuna jednom na mreži (udaljenost od osi, visina) i
  //  poslije samo očita.
  // ─────────────────────────────────────────────────────────────────────
  const SDF_D = 0.8, SDF_Y0 = -0.3, SDF_Y1 = 2.3, SDF_KORAK = 0.01;
  function tijeloFlakona() {
    const K = FLAKON_K;
    const obris = FLAKON.map(function (p) { return [p[1] * K, p[0] * K]; });
    const R0 = FLAKON[FLAKON.length - 1][1] * K, y0 = FLAKON_RUB * K, y1 = FLAKON_VRH * K;
    obris.push([R0 * 0.8, y0 + (y1 - y0) * 0.45], [R0 * 0.42, y0 + (y1 - y0) * 0.82], [0, y1]);
    const ND = Math.round(SDF_D / SDF_KORAK) + 1, NY = Math.round((SDF_Y1 - SDF_Y0) / SDF_KORAK) + 1;
    const sd = new Float32Array(ND * NY), gd = new Float32Array(ND * NY), gy = new Float32Array(ND * NY);
    for (let j = 0; j < NY; j++) {
      const y = SDF_Y0 + j * SDF_KORAK;
      for (let i = 0; i < ND; i++) {
        const d = i * SDF_KORAK;
        let min = Infinity, unutra = false;
        for (let k = 0; k < obris.length; k++) {
          const a = obris[k], b = obris[(k + 1) % obris.length];
          if ((a[1] > y) !== (b[1] > y) && d < a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])) unutra = !unutra;
          if (k === obris.length - 1) continue;          // os (od vrha natrag do dna) nije plašt
          const ex = b[0] - a[0], ey = b[1] - a[1], l2 = ex * ex + ey * ey;
          const t = l2 > 0 ? sat(((d - a[0]) * ex + (y - a[1]) * ey) / l2) : 0;
          const qx = a[0] + ex * t - d, qy = a[1] + ey * t - y;
          min = Math.min(min, qx * qx + qy * qy);
        }
        sd[j * ND + i] = (unutra ? -1 : 1) * Math.sqrt(min);
      }
    }
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < ND; i++) {
        const a = sd[j * ND + Math.max(i - 1, 0)], b = sd[j * ND + Math.min(i + 1, ND - 1)];
        const c = sd[Math.max(j - 1, 0) * ND + i], e = sd[Math.min(j + 1, NY - 1) * ND + i];
        const x = b - a, z = e - c, l = Math.hypot(x, z) || 1;
        gd[j * ND + i] = x / l; gy[j * ND + i] = z / l;
      }
    }
    // polumjer flakona po visini (korak 0,01), za pokrivenost velom
    const POL = new Float32Array(200);
    for (let q = 0; q < 200; q++) POL[q] = sirinaFlakona(q * 0.01 / K) * K;
    return {
      // udaljenost do plašta i smjer prema van (u ravnini: od osi, gore)
      ocitaj: function (d, y, out) {
        const fi = d / SDF_KORAK, fj = (y - SDF_Y0) / SDF_KORAK;
        const i = Math.min(ND - 2, Math.max(0, Math.floor(fi))), j = Math.min(NY - 2, Math.max(0, Math.floor(fj)));
        const u = fi - i, v = fj - j;
        const k00 = j * ND + i, k10 = k00 + 1, k01 = k00 + ND, k11 = k01 + 1;
        const w00 = (1 - u) * (1 - v), w10 = u * (1 - v), w01 = (1 - u) * v, w11 = u * v;
        out[0] = sd[k00] * w00 + sd[k10] * w10 + sd[k01] * w01 + sd[k11] * w11;
        const x = gd[k00] * w00 + gd[k10] * w10 + gd[k01] * w01 + gd[k11] * w11;
        const z = gy[k00] * w00 + gy[k10] * w10 + gy[k01] * w01 + gy[k11] * w11;
        const l = Math.hypot(x, z) || 1;
        out[1] = x / l; out[2] = z / l;
      },
      polumjer: function (y) { return y <= 0 || y >= 1.99 ? 0 : POL[Math.round(y * 100)]; }
    };
  }


  // ─────────────────────────────────────────────────────────────────────
  //  VALOVI: gdje veo padne na površinu (ili se od nje odvoji), po njoj se
  //  šire krugovi; najviše 8 izvora (mjesto, trenutak, jačina)
  // ─────────────────────────────────────────────────────────────────────
  function izvoriValova() {
    const p = new Float32Array(32);
    return {
      p: p,
      ocisti: function () { p.fill(0); },
      dodaj: function (x, z, t, a) {
        // blizu nedavnog izvora: samo ga malo pojača
        for (let s = 0; s < 8; s++) {
          const o = 4 * s;
          if (p[o + 3] > 0 && Math.abs(t - p[o + 2]) < 0.6 && Math.hypot(x - p[o], z - p[o + 1]) < 0.45) {
            p[o + 3] = Math.min(0.011, p[o + 3] + a * 0.08);
            return;
          }
        }
        let s0 = 0, tMin = Infinity;
        for (let s = 0; s < 8; s++) {
          if (p[4 * s + 3] <= 0) { s0 = s; break; }
          if (p[4 * s + 2] < tMin) { tMin = p[4 * s + 2]; s0 = s; }
        }
        p[4 * s0] = x; p[4 * s0 + 1] = z; p[4 * s0 + 2] = t; p[4 * s0 + 3] = a;
      }
    };
  }


  // ─────────────────────────────────────────────────────────────────────
  //  VEO: simulacija tkanine (XPBD u malim koracima). Mreža N × N čestica;
  //  ograničenja duljine za niti (susjedi), smik (dijagonale) i savijanje
  //  (preko jedne). Zrak koči gibanje okomito na tkaninu (zato lebdi i
  //  vijori) i malo uzduž nje. Sudari: flakon (tijelo vrtnje) i površina,
  //  s trenjem kao kod pravog klizanja. Ruka drži nekoliko čestica i vodi
  //  ih po zadanom putu; dok vuče, nijedna čestica ne smije biti dalje od
  //  ruke nego po tkanini, pa se svila ne rastegne ni kad je trgne.
  // ─────────────────────────────────────────────────────────────────────
  function napraviVeo(N, tijelo, valovi) {
    const n = N * N, h = VEO.vel / (N - 1);
    const x = new Float64Array(3 * n), x0 = new Float64Array(3 * n), v = new Float64Array(3 * n);
    const w = new Float64Array(n), dolje = new Uint8Array(n), doRuke = new Float64Array(n);
    const nor = new Float32Array(3 * n), tan = new Float32Array(3 * n);
    const oA = [], oB = [], oL = [], oP = [];
    function ogr(i, j, l, a) { oA.push(i); oB.push(j); oL.push(l); oP.push(a); }
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const k = j * N + i;
        if (i < N - 1) ogr(k, k + 1, h, 0);                           // niti
        if (j < N - 1) ogr(k, k + N, h, 0);
      }
    }
    for (let j = 0; j < N - 1; j++) {
      for (let i = 0; i < N - 1; i++) {
        const k = j * N + i;
        ogr(k, k + N + 1, h * Math.SQRT2, VEO.smik);                   // smik
        ogr(k + 1, k + N, h * Math.SQRT2, VEO.smik);
      }
    }
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const k = j * N + i;
        if (i < N - 2) ogr(k, k + 2, 2 * h, VEO.savijanje);            // savijanje
        if (j < N - 2) ogr(k, k + 2 * N, 2 * h, VEO.savijanje);
      }
    }
    const A = Int32Array.from(oA), Bc = Int32Array.from(oB), Ld = Float64Array.from(oL), Pd = Float64Array.from(oP);
    const m = A.length;
    const s = { N: N, n: n, h: h, x: x, nor: nor, tan: tan, t: 0, t0: 0, aktivan: false };
    const sd = [0, 0, 0], R = [0, 0, 0];
    let ruka = null;

    // ravna tkanina iznad kadra: malo zakrenuta, nagnuta i valovita, da ne padne kao ploča
    s.postavi = function (t0) {
      const c = Math.cos(VEO.zakret), sn = Math.sin(VEO.zakret);
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const k = 3 * (j * N + i), a = i * h - VEO.vel / 2, b = j * h - VEO.vel / 2;
          x[k] = c * a - sn * b + VEO.pomak[0];
          x[k + 1] = VEO.visina + 0.09 * Math.sin(1.7 * a + 0.6) * Math.cos(1.3 * b - 0.4) + 0.06 * a - 0.04 * b;
          x[k + 2] = sn * a + c * b + VEO.pomak[1];
        }
      }
      v.fill(0); w.fill(1); dolje.fill(0);
      for (let i = 0; i < n; i++) v[3 * i + 1] = -0.25;
      ruka = null;
      s.t = t0; s.t0 = t0; s.aktivan = true;
      s.normale();
    };

    // normala i smjer niti (uzduž u) u svakoj čestici
    s.normale = function () {
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const k = 3 * (j * N + i);
          const a = 3 * (j * N + Math.max(i - 1, 0)), b = 3 * (j * N + Math.min(i + 1, N - 1));
          const c = 3 * (Math.max(j - 1, 0) * N + i), d = 3 * (Math.min(j + 1, N - 1) * N + i);
          const ux = x[b] - x[a], uy = x[b + 1] - x[a + 1], uz = x[b + 2] - x[a + 2];
          const vx = x[d] - x[c], vy = x[d + 1] - x[c + 1], vz = x[d + 2] - x[c + 2];
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1, ul = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
          nor[k] = nx / nl; nor[k + 1] = ny / nl; nor[k + 2] = nz / nl;
          tan[k] = ux / ul; tan[k + 1] = uy / ul; tan[k + 2] = uz / ul;
        }
      }
    };

    // ruka uhvati veo: čestica najbliža mjestu hvata i njezini susjedi
    function uhvati() {
      let best = 0, bd = Infinity;
      for (let i = 0; i < n; i++) {
        const k = 3 * i, dx = x[k] - VEO.hvat[0], dy = x[k + 1] - VEO.hvat[1], dz = x[k + 2] - VEO.hvat[2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bd) { bd = d; best = i; }
      }
      const bi = best % N, bj = (best - bi) / N;
      const B0 = [x[3 * best], x[3 * best + 1], x[3 * best + 2]];
      ruka = { B0: B0, B1: [B0[0] + VEO.ruka1[0], B0[1] + VEO.ruka1[1], B0[2] + VEO.ruka1[2]], i: [], d: [] };
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const ii = bi + di, jj = bj + dj;
          if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue;
          const k = jj * N + ii;
          ruka.i.push(k);
          ruka.d.push(x[3 * k] - B0[0], x[3 * k + 1] - B0[1], x[3 * k + 2] - B0[2]);
          w[k] = 0;
        }
      }
      for (let k = 0; k < n; k++) { const ii = k % N, jj = (k - ii) / N; doRuke[k] = 1.03 * h * Math.hypot(ii - bi, jj - bj); }
    }
    // put ruke: polako krene, pa ubrza (Bézier), a na kraju nastavi istim smjerom
    function polozajRuke(c, out) {
      const tau = Math.max(0, (c - TIJEK.vuci) / TIJEK.vuciT), q = tau * tau;
      const B0 = ruka.B0, B1 = ruka.B1, B2 = VEO.ruka2, B3 = VEO.ruka3;
      if (q <= 1) {
        const a = 1 - q;
        for (let d = 0; d < 3; d++) out[d] = a * a * a * B0[d] + 3 * a * a * q * B1[d] + 3 * a * q * q * B2[d] + q * q * q * B3[d];
      } else {
        for (let d = 0; d < 3; d++) out[d] = B3[d] + 3 * (B3[d] - B2[d]) * (q - 1);
      }
    }

    s.korak = function (dt) {
      const t = s.t + dt, c = t - s.t0;
      if (!ruka && c >= TIJEK.vuci) uhvati();
      const g = VEO.teza * dt, kn = VEO.zrakOkomito * dt, kt = VEO.zrakUzduz * dt;
      // lagan dašak koji se mijenja po prostoru i vremenu: tkanina u padu valovito vijori
      const vjX = 0.10 * Math.sin(0.83 * t + 0.4), vjZ = 0.07 * Math.sin(0.61 * t + 1.9), fa = 1.3 * t, fb = 0.9 * t;
      // teža i zrak, pa predviđeni položaj
      for (let i = 0, k = 0; i < n; i++, k += 3) {
        x0[k] = x[k]; x0[k + 1] = x[k + 1]; x0[k + 2] = x[k + 2];
        if (w[i] === 0) continue;
        let vx = v[k], vy = v[k + 1] - g, vz = v[k + 2];
        const vjY = x[k + 1] > 1.9 ? 0.32 * Math.sin(2.1 * x[k] + fa) * Math.cos(1.7 * x[k + 2] - fb) : 0;
        const rx = vx - vjX, ry = vy - vjY, rz = vz - vjZ;
        const vn = rx * nor[k] + ry * nor[k + 1] + rz * nor[k + 2];
        vx -= kn * vn * nor[k] + kt * rx;
        vy -= kn * vn * nor[k + 1] + kt * ry;
        vz -= kn * vn * nor[k + 2] + kt * rz;
        x[k] += vx * dt; x[k + 1] += vy * dt; x[k + 2] += vz * dt;
      }
      if (ruka) {
        polozajRuke(c, R);
        for (let q = 0; q < ruka.i.length; q++) {
          const k = 3 * ruka.i[q];
          x[k] = R[0] + ruka.d[3 * q]; x[k + 1] = R[1] + ruka.d[3 * q + 1]; x[k + 2] = R[2] + ruka.d[3 * q + 2];
        }
      }
      // ograničenja duljine (uvijek istim redom: da se veo u mirovanju ne trese između dva stanja)
      const idt2 = 1 / (dt * dt);
      for (let q = 0; q < m; q++) {
        const i = A[q], j = Bc[q], wi = w[i], wj = w[j], ws = wi + wj;
        if (ws === 0) continue;
        const ki = 3 * i, kj = 3 * j;
        const dx = x[kj] - x[ki], dy = x[kj + 1] - x[ki + 1], dz = x[kj + 2] - x[ki + 2];
        const l = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (l < 1e-9) continue;
        const f = (l - Ld[q]) / ((ws + Pd[q] * idt2) * l);
        x[ki] += wi * f * dx; x[ki + 1] += wi * f * dy; x[ki + 2] += wi * f * dz;
        x[kj] -= wj * f * dx; x[kj + 1] -= wj * f * dy; x[kj + 2] -= wj * f * dz;
      }
      // dok ruka vuče: nijedna čestica nije dalje od ruke nego po tkanini
      if (ruka) {
        for (let i = 0, k = 0; i < n; i++, k += 3) {
          if (w[i] === 0) continue;
          const dx = x[k] - R[0], dy = x[k + 1] - R[1], dz = x[k + 2] - R[2];
          const l = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (l > doRuke[i]) { const f = doRuke[i] / l; x[k] = R[0] + dx * f; x[k + 1] = R[1] + dy * f; x[k + 2] = R[2] + dz * f; }
        }
      }
      // sudari s flakonom i površinom; trenje: miruje dok je pomak uz plohu malen, inače kliže
      const POV = VEO.povrsina;
      for (let i = 0, k = 0; i < n; i++, k += 3) {
        if (w[i] === 0) continue;
        let px = x[k], py = x[k + 1], pz = x[k + 2];
        const d = Math.sqrt(px * px + pz * pz);
        if (d < SDF_D - 0.02 && py > SDF_Y0 + 0.02 && py < SDF_Y1 - 0.02) {
          tijelo.ocitaj(d, py, sd);
          const prodor = VEO.debljina - sd[0];
          if (prodor > 0) {
            const rx = d > 1e-6 ? px / d : 1, rz = d > 1e-6 ? pz / d : 0;
            const nx = rx * sd[1], ny = sd[2], nz = rz * sd[1];
            px += nx * prodor; py += ny * prodor; pz += nz * prodor;
            const mu = py > VISINA - 0.1 ? VEO.trenjeVrh : VEO.trenjeStaklo;
            const dx = px - x0[k], dy = py - x0[k + 1], dz = pz - x0[k + 2];
            const dn = dx * nx + dy * ny + dz * nz;
            const tx = dx - dn * nx, ty = dy - dn * ny, tz = dz - dn * nz;
            const tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            const f = tl <= mu * prodor ? 1 : mu * prodor / tl;
            px -= f * tx; py -= f * ty; pz -= f * tz;
          }
        }
        if (py < POV) {
          const prodor = POV - py;
          if (!dolje[i]) {
            dolje[i] = 1;
            const vy = (py - x0[k + 1]) / dt;
            if (vy < -0.25) valovi.dodaj(px, pz, t, Math.min(0.009, 0.004 * -vy));
          }
          py = POV;
          const dx = px - x0[k], dz = pz - x0[k + 2], tl = Math.sqrt(dx * dx + dz * dz);
          const f = tl <= VEO.trenjePovrsina * prodor ? 1 : VEO.trenjePovrsina * prodor / tl;
          px -= f * dx; pz -= f * dz;
        } else if (dolje[i] && py > POV + 0.04) {
          dolje[i] = 0;
          if (ruka) valovi.dodaj(px, pz, t, 0.004);
        }
        x[k] = px; x[k + 1] = py; x[k + 2] = pz;
      }
      const idt = 1 / dt;
      for (let k = 0; k < 3 * n; k++) v[k] = (x[k] - x0[k]) * idt;
      s.t = t;
    };
    return s;
  }


  // ─────────────────────────────────────────────────────────────────────
  //  TOČKICE VELA: niti uzduž tkanine (redovi po v), u svakoj niti gusto
  //  točkica; mjesto svake točkice u mreži čestica izračuna se jednom
  // ─────────────────────────────────────────────────────────────────────
  function tockeVela(M, N, rnd) {
    const redova = Math.max(8, Math.round(Math.sqrt(M / OMJER_VELA))), poRedu = Math.max(8, Math.round(M / redova));
    const ukupno = redova * poRedu;
    const red = new Int32Array(redova), redF = new Float32Array(redova);
    const stup = new Int32Array(ukupno), stupF = new Float32Array(ukupno), st = new Float32Array(4 * ukupno);
    for (let r = 0; r < redova; r++) {
      const vv = (r + 0.5) / redova, gv = vv * (N - 1);
      red[r] = Math.min(N - 2, Math.floor(gv)); redF[r] = gv - red[r];
      const pomak = rnd();
      for (let q = 0; q < poRedu; q++) {
        const o = r * poRedu + q, uu = (q + pomak) / poRedu, gu = uu * (N - 1);
        stup[o] = Math.min(N - 2, Math.floor(gu)); stupF[o] = gu - stup[o];
        st[4 * o] = uu; st[4 * o + 1] = vv; st[4 * o + 2] = rnd(); st[4 * o + 3] = rnd();
      }
    }
    return {
      redova: redova, poRedu: poRedu, ukupno: ukupno, red: red, redF: redF, stup: stup, stupF: stupF, st: st,
      podaci: new Float32Array(9 * ukupno), redP: new Float32Array(9 * N)
    };
  }
  // položaj, normala i smjer niti svake točkice vela (iz čestica simulacije)
  function osvjeziVeo(T, veo) {
    const N = veo.N, X = veo.x, Nn = veo.nor, Tn = veo.tan, out = T.podaci, rp = T.redP;
    for (let r = 0; r < T.redova; r++) {
      const j = T.red[r], b = T.redF[r], a = 1 - b;
      for (let i = 0; i < N; i++) {                        // red mreže na visini ove niti
        const k0 = 3 * (j * N + i), k1 = k0 + 3 * N, o = 9 * i;
        rp[o] = X[k0] * a + X[k1] * b; rp[o + 1] = X[k0 + 1] * a + X[k1 + 1] * b; rp[o + 2] = X[k0 + 2] * a + X[k1 + 2] * b;
        rp[o + 3] = Nn[k0] * a + Nn[k1] * b; rp[o + 4] = Nn[k0 + 1] * a + Nn[k1 + 1] * b; rp[o + 5] = Nn[k0 + 2] * a + Nn[k1 + 2] * b;
        rp[o + 6] = Tn[k0] * a + Tn[k1] * b; rp[o + 7] = Tn[k0 + 1] * a + Tn[k1 + 1] * b; rp[o + 8] = Tn[k0 + 2] * a + Tn[k1 + 2] * b;
      }
      const p0 = r * T.poRedu;
      for (let q = 0; q < T.poRedu; q++) {
        const p = p0 + q, f = T.stupF[p], e = 1 - f, o0 = 9 * T.stup[p], o1 = o0 + 9, o = 9 * p;
        out[o] = rp[o0] * e + rp[o1] * f; out[o + 1] = rp[o0 + 1] * e + rp[o1 + 1] * f; out[o + 2] = rp[o0 + 2] * e + rp[o1 + 2] * f;
        out[o + 3] = rp[o0 + 3] * e + rp[o1 + 3] * f; out[o + 4] = rp[o0 + 4] * e + rp[o1 + 4] * f; out[o + 5] = rp[o0 + 5] * e + rp[o1 + 5] * f;
        out[o + 6] = rp[o0 + 6] * e + rp[o1 + 6] * f; out[o + 7] = rp[o0 + 7] * e + rp[o1 + 7] * f; out[o + 8] = rp[o0 + 8] * e + rp[o1 + 8] * f;
      }
    }
  }


  // ─────────────────────────────────────────────────────────────────────
  //  SHADERI — dva programa (površina i flakon; veo), isto svjetlo i boje
  //  kao pocetna-chata.js; zajednički su kamera, valovi i odraz
  // ─────────────────────────────────────────────────────────────────────
  const ZAJEDNICKO = `
    precision highp float;

    uniform float uOdraz;    // 1: odraz u površini (zrcaljeno preko nje)
    uniform float uT;        // vrijeme od otvaranja (s)
    uniform mat3 uRot;       // kamera: nagib prizora, polagano kruženje, nagib prema mišu
    uniform float uZum;      // kamera se polako primiče i odmiče
    uniform vec2 uPx;
    uniform vec2 uCenter;
    uniform float uSize;
    uniform vec3 uOko;       // kamera u koordinatama prizora (za odraz)
    uniform vec4 uValovi[8]; // izvori valova: mjesto (x, z), trenutak (s od otvaranja), jačina
    uniform vec3 uSvjetlo;   // smjer svjetla (polako se pomiče: odsjaji klize preko faseta i nabora)

    varying vec4 vCol;

    const float PI = 3.14159265;
    const float CAM = ${CAM.toFixed(2)};
    const float RJ = ${RJ.toFixed(3)};
    const float KOMP = ${KOMP.toFixed(3)};
    const float POMAK = ${POMAK.toFixed(3)};

    vec2 okreni(vec2 v, float k) {
      float c = cos(k), s = sin(k);
      return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
    }

    // visina površine u točki xz: krugovi valova od svakog izvora (vodeći
    // val oštriji, iza njega nekoliko slabijih)
    float valovi(vec2 xz) {
      float h = 0.0;
      for (int i = 0; i < 8; i++) {
        vec4 u = uValovi[i];
        float tau = uT - u.z;
        if (u.w > 0.0 && tau > 0.0 && tau < 7.0) {
          float r = distance(xz, u.xy);
          float f = r - 0.55 * tau;
          float omot = f > 0.0 ? exp(-f * f / 0.008) : exp(-f * f / 0.06);
          h += u.w * exp(-0.9 * tau) * sin(32.0 * f) * omot / sqrt(0.15 + r);
        }
      }
      return h;
    }

    // odraz: točkica zrcaljena preko površine; vidi se samo gdje je površina,
    // slabija je što je dalje od nje i njiše se s valovima
    vec3 zrcali(vec3 p, inout float alpha) {
      vec3 z = vec3(p.x, -p.y, p.z);
      float s = uOko.y / (uOko.y - z.y);
      vec3 I = uOko + s * (z - uOko);
      float v = valovi(I.xz);
      z.x += (0.006 + 0.5 * abs(v)) * sin(z.y * 26.0 + uT * 2.3) + 0.6 * v;
      alpha *= 0.34 * exp(-1.2 * abs(z.y)) * (1.0 - smoothstep(0.25, 0.65, abs(z.y))) * (1.0 - smoothstep(0.9 * RJ, 1.5 * RJ, length(I.xz)));
      return z;
    }

    vec3 kamera(vec3 p) { return uRot * (p * KOMP * uZum) + vec3(0.0, POMAK, 0.0); }
    void naZaslon(vec3 q, float vel) {
      float persp = CAM / (CAM - q.z);
      gl_Position = vec4(q.x * uPx.x * persp + uCenter.x, q.y * uPx.y * persp + uCenter.y, 0.0, 1.0);
      gl_PointSize = uSize * persp * vel;
    }
  `;

  const VS_GLAVNI = ZAJEDNICKO + `
    attribute vec4 aRnd;
    attribute vec4 aP;
    attribute vec4 aN;

    uniform float uSloj;        // 0 površina, 1 flakon
    uniform float uKut;         // zakret flakona oko osi
    uniform vec2 uAlpha;        // jačina točkica: površina, flakon
    uniform float uSjaj;        // svjetlo niz flakon (visina kao u pocetna-chata.js)
    uniform float uPokriv[16];  // veo: najniža visina vela uz flakon, po kutu oko osi (16 isječaka)
    uniform float uOtkriveno;   // koliko se vidi dio flakona koji veo ne pokriva (0 dok ga veo prvi put ne otkrije)
    uniform float uVuce;        // dok ruka vuče veo: svijetli rub na granici otkrivenog
    uniform vec3 uSilver;
    uniform vec3 uPowder;
    uniform vec3 uGold;

    void main() {
      vec3 p, n, col;
      float lit = 1.0, back = 0.4, alpha = 0.0, pov = 0.0, nagibV = 0.0, jak = 1.0, vel = 1.0;
      float iskra = step(0.993, aRnd.z);

      if (uSloj < 0.5) {
        // POVRŠINA: tamno zrcalo; valovi se vide kao svijetli krugovi
        float r = aP.x, a = aP.y;
        vec2 xz = vec2(cos(a), sin(a)) * r;
        float e = 0.012;
        vec2 g = vec2(valovi(xz + vec2(e, 0.0)) - valovi(xz - vec2(e, 0.0)),
                      valovi(xz + vec2(0.0, e)) - valovi(xz - vec2(0.0, e))) / (2.0 * e);
        nagibV = length(g);
        p = vec3(xz.x, valovi(xz), xz.y);
        n = normalize(vec3(-g.x, 1.0, -g.y));
        col = mix(uSilver * 0.8, uGold * 1.1, 0.2);
        alpha = uAlpha.x * (1.0 - smoothstep(0.45 * RJ, RJ, r));
        pov = 1.0;
        iskra *= step(0.5, aRnd.w);
      } else {
        // FLAKON (kao u kap.js); vidi se koliko ga veo pušta
        vec3 T = aP.xyz;
        float yE = T.y - 0.86;                                      // visina kao u pocetna-chata.js
        T.xz = okreni(T.xz, -uKut);
        vec3 N = aN.xyz;
        N.xz = okreni(N.xz, -uKut);
        p = T;
        n = normalize(N + vec3(0.0, 0.0, 1e-4));
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
        // veo: iznad najniže točke vela (u tom smjeru oko osi) flakon se tek nazire kroz tkaninu
        float sek = (atan(p.z, p.x) + PI) / (2.0 * PI) * 16.0 - 0.5;
        float s0 = floor(sek);
        int i0 = int(mod(s0, 16.0)), i1 = int(mod(s0 + 1.0, 16.0));
        float prag = mix(uPokriv[i0], uPokriv[i1], sek - s0);
        float pokriven = smoothstep(prag - 0.06, prag + 0.02, p.y);
        float dp = (p.y - prag) / 0.05;
        float rubOtkr = uVuce * exp(-dp * dp) * (1.0 - pokriven);
        col = col * (1.0 + 1.4 * rubOtkr) + uPowder * 0.5 * rubOtkr;
        alpha = uAlpha.y * jak * mix(uOtkriveno, 0.2, pokriven);
      }

      if (uOdraz > 0.5) {
        p = zrcali(p, alpha);
        n.y = -n.y;
        col = mix(col, uGold, 0.15);
        vel = 1.25;
        iskra = 0.0;
      }
      vec3 q = kamera(p);
      vec3 nq = normalize(uRot * n);
      naZaslon(q, vel * (1.0 + iskra * 0.7));
      alpha *= 1.0 - smoothstep(0.92, 1.0, abs(gl_Position.x));

      vec3 L = uSvjetlo;
      vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
      float treptaj = 0.84 + 0.16 * sin(uT * (1.5 + 2.0 * aRnd.w) + aRnd.y * 40.0);
      treptaj = mix(treptaj, 1.0 + 1.1 * max(0.0, sin(uT * 2.1 + aRnd.x * 50.0)), iskra);
      if (pov > 0.5) {
        // površina: tamna, valovi se vide po nagibu i odsjaju
        float spe = pow(max(dot(nq, H), 0.0), 40.0);
        float b = 0.14 + 3.0 * spe + 4.5 * nagibV;
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

  const VS_VEO = ZAJEDNICKO + `
    attribute vec3 aPol;
    attribute vec3 aNor;
    attribute vec3 aTan;
    attribute vec4 aSt;          // mjesto na tkanini (u, v) i dva slučajna broja

    uniform float uAlphaVeo;     // jačina točkica vela
    uniform vec3 uSvila;         // boja svile
    uniform vec3 uSjajSvile;     // boja odsjaja na svili

    void main() {
      vec3 p = aPol;
      vec3 n = normalize(aNor + vec3(0.0, 1e-6, 0.0));
      vec3 tg = normalize(aTan + vec3(1e-6, 0.0, 0.0));
      float alpha = uAlphaVeo * (0.75 + 0.5 * aSt.z);
      // svjetlo: izvan njega se veo utopi u tamu (dolazi iz tame i odlazi u nju)
      alpha *= (1.0 - smoothstep(1.35, 2.2, length(p - vec3(0.0, 0.85, 0.0)))) * (1.0 - smoothstep(1.95, 2.6, p.y));
      // porub: rubovi tkanine su malo svjetliji
      float doRuba = min(min(aSt.x, 1.0 - aSt.x), min(aSt.y, 1.0 - aSt.y));
      float porub = 1.0 - smoothstep(0.003, 0.012, doRuba);
      float vel = 1.0;
      if (uOdraz > 0.5) {
        p = zrcali(p, alpha);
        n.y = -n.y;
        tg.y = -tg.y;
        vel = 1.2;
      }
      vec3 q = kamera(p);
      naZaslon(q, vel);
      alpha *= 1.0 - smoothstep(0.92, 1.0, abs(gl_Position.x));
      vec3 nq = normalize(uRot * n), tq = normalize(uRot * tg);
      if (nq.z < 0.0) nq = -nq;                                    // tanka tkanina: svijetli s obje strane
      vec3 L = uSvjetlo;
      vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
      float dif = abs(dot(nq, L));
      float th = dot(tq, H);
      float aniz = pow(max(1.0 - th * th, 0.0), 48.0) * smoothstep(0.0, 0.6, dot(nq, H));   // svila: odsjaj uzduž niti
      float spe = pow(max(dot(nq, H), 0.0), 30.0);
      float rub = pow(1.0 - nq.z, 2.5);
      float svj = 0.05 + 0.34 * dif + 0.5 * rub;
      vec3 col = uSvila * svj + uSjajSvile * (2.1 * aniz + 0.4 * spe + 0.3 * porub);
      float treptaj = 0.9 + 0.1 * sin(uT * (1.2 + 1.6 * aSt.w) + aSt.z * 40.0);
      vCol = vec4(col, alpha * treptaj * (1.0 + 0.8 * porub));
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
    function program(vs, atributi) {
      const pr = gl.createProgram();
      gl.attachShader(pr, shader(gl.VERTEX_SHADER, vs));
      gl.attachShader(pr, shader(gl.FRAGMENT_SHADER, FS));
      atributi.forEach(function (a, i) { gl.bindAttribLocation(pr, i, a); });
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      const U = {}, k = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < k; i++) {
        const info = gl.getActiveUniform(pr, i);
        U[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(pr, info.name);
      }
      return { p: pr, U: new Proxy(U, { get: function (o, ime) { return o[ime] || null; } }) };
    }
    const PG = program(VS_GLAVNI, ['aRnd', 'aP', 'aN']);
    const PV = program(VS_VEO, ['aPol', 'aNor', 'aTan', 'aSt']);

    const rnd = slucajno(1861);
    const nF = MOBITEL ? P.tocakaMobitel : P.tocaka, nP = MOBITEL ? P.tocakaPovrsineMobitel : P.tocakaPovrsine;
    const NV = MOBITEL ? VEO.cvorovaMobitel : VEO.cvorova, MV = MOBITEL ? P.tocakaVelaMobitel : P.tocakaVela;
    function spremnik(podaci) {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, podaci, gl.STATIC_DRAW);
      return b;
    }
    const povrsinaB = spremnik(povrsina(nP, rnd)), flakonB = spremnik(flakonNaPovrsini(nF, rnd));
    const tijelo = tijeloFlakona(), valovi = izvoriValova();
    const veo = napraviVeo(NV, tijelo, valovi);
    const TV = tockeVela(MV, NV, rnd);
    const veoSt = spremnik(TV.st);
    const veoDin = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, veoDin);
    gl.bufferData(gl.ARRAY_BUFFER, TV.podaci.byteLength, gl.DYNAMIC_DRAW);

    [0, 1, 2].forEach(function (i) { gl.enableVertexAttribArray(i); });
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    // jačina točkica: flakon kao u pocetna-chata.js (0,7 uz 26 000 točkica), ostalo prema tome
    const g = Math.min(2, Math.max(0.25, Math.pow(nF / (MOBITEL ? 16000 : 26000), -0.65)));
    const alphaVela = 0.40 * Math.pow(26000 / TV.ukupno, 0.8);
    gl.useProgram(PG.p);
    gl.uniform3fv(PG.U.uSilver, boja01(B.srebro));
    gl.uniform3fv(PG.U.uPowder, boja01(B.puder));
    gl.uniform3fv(PG.U.uGold, zasiti(boja01(B.zlato), 1.2));
    gl.uniform2f(PG.U.uAlpha, 0.55 * Math.pow(30000 / nP, 0.8), 0.7 * g);
    gl.uniform1f(PG.U.uKut, KUT_FLAKONA);
    gl.useProgram(PV.p);
    gl.uniform3fv(PV.U.uSvila, boja01(B.svila));
    gl.uniform3fv(PV.U.uSjajSvile, boja01(B.sjajSvile));

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

    // pokrivenost flakona velom: za svaki od 16 isječaka oko osi najniža
    // točka vela uz flakon. Dok veo pada, pokriveno se samo širi prema dolje;
    // dok ga ruka vuče, otkriveno se samo širi prema gore.
    const pokriv = new Float32Array(16).fill(5), sada = new Float64Array(16), siri = new Float64Array(16);
    function pokrivenost(c) {
      if (c >= TIJEK.nestao - 0.05) { pokriv.fill(5); return; }
      sada.fill(5);
      const X = veo.x;
      for (let i = 0, k = 0; i < veo.n; i++, k += 3) {
        const y = X[k + 1];
        if (y > VISINA + 0.25 || y < -0.1) continue;
        const d = Math.sqrt(X[k] * X[k] + X[k + 2] * X[k + 2]);
        if (d > tijelo.polumjer(y) + 0.15 + 0.1 * (1 - y / VISINA)) continue;
        const s = Math.min(15, Math.floor((Math.atan2(X[k + 2], X[k]) + Math.PI) / (2 * Math.PI) * 16));
        if (y < sada[s]) sada[s] = y;
      }
      for (let s = 0; s < 16; s++) siri[s] = Math.min(sada[(s + 15) % 16], sada[s], sada[(s + 1) % 16], VISINA + 0.3);
      const vuce = c >= TIJEK.vuci;
      for (let s = 0; s < 16; s++) pokriv[s] = vuce ? Math.max(pokriv[s], siri[s]) : Math.min(pokriv[s], siri[s]);
    }

    // simulacija vela: u stalnim koracima od početka kruga, pa je svaki krug
    // isti bez obzira na brzinu računala; svakih 1/60 s osvježi normale (za
    // otpor zraka) i pokrivenost flakona
    let krugVela = -1, brojac = 0;
    function simuliraj(t) {
      const kb = Math.floor(t / P.krug), t0 = kb * P.krug;
      if (kb !== krugVela || t < veo.t - 1e-6) {
        krugVela = kb; brojac = 0;
        veo.postavi(t0); valovi.ocisti(); pokriv.fill(5);
      }
      const kraj = Math.min(t, t0 + TIJEK.nestao);
      while (veo.t + VEO.korak <= kraj + 1e-9) {
        veo.korak(VEO.korak);
        if (++brojac % 5 === 0) { veo.normale(); pokrivenost(veo.t - t0); }
      }
    }

    function crtaj(b, n, sloj, odraz) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 48, 0);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 48, 16);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 48, 32);
      gl.uniform1f(PG.U.uSloj, sloj);
      gl.uniform1f(PG.U.uOdraz, odraz ? 1 : 0);
      gl.drawArrays(gl.POINTS, 0, n);
    }
    const svjetlo = new Float32Array(3);
    function zajednicke(G, t, R, zum, oko) {
      gl.uniform1f(G.U.uT, t);
      gl.uniformMatrix3fv(G.U.uRot, false, R);
      gl.uniform1f(G.U.uZum, zum);
      gl.uniform2f(G.U.uPx, 2 * S / W, 2 * S / H);
      gl.uniform2f(G.U.uCenter, 2 * sx / W - 1, 1 - 2 * sy / H);
      gl.uniform1f(G.U.uSize, 1.35 * dpr * Math.min(1.25, Math.max(0.8, Math.sqrt(S / 160))));
      gl.uniform3fv(G.U.uOko, oko);
      gl.uniform4fv(G.U.uValovi, valovi.p);
      gl.uniform3fv(G.U.uSvjetlo, svjetlo);
    }

    function nacrtaj(t) {
      const c = t % P.krug;
      simuliraj(t);
      // kamera polako obilazi flakon i primiče mu se dok stoji sam
      const faza = 2 * Math.PI * c / P.krug;
      const R = matrica(nagibX * 0.25 + 0.09 * Math.sin(faza + 0.8), NAGIB + nagibY * 0.1 + 0.012 * Math.sin(2 * faza + 0.3));
      const zum = 1 + 0.03 * Math.cos(faza - 2 * Math.PI * 11 / P.krug);
      const vv = [0, -POMAK, CAM];
      const oko = [0, 1, 2].map(function (k) { return (R[3 * k] * vv[0] + R[3 * k + 1] * vv[1] + R[3 * k + 2] * vv[2]) / (KOMP * zum); });
      // svjetlo (sprijeda gore lijevo) dvaput u krugu polako zanjiše
      const Lx = -0.5 + 0.28 * Math.sin(2 * faza + 0.5), Lz = 0.6 + 0.14 * Math.cos(2 * faza + 0.5), Ll = Math.hypot(Lx, 0.62, Lz);
      svjetlo[0] = Lx / Ll; svjetlo[1] = 0.62 / Ll; svjetlo[2] = Lz / Ll;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // površina i flakon
      gl.useProgram(PG.p);
      zajednicke(PG, t, R, zum, oko);
      let sjaj = 9;
      TIJEK.sjaji.forEach(function (s0) { if (c >= s0 && c <= s0 + 1.7) sjaj = lerp(1.15, -1.25, (c - s0) / 1.7); });
      gl.uniform1f(PG.U.uSjaj, sjaj);
      gl.uniform1fv(PG.U.uPokriv, pokriv);
      gl.uniform1f(PG.U.uOtkriveno, t < P.krug ? glatko((c - TIJEK.vuci - 0.1) / 0.9) : 1);
      gl.uniform1f(PG.U.uVuce, glatko((c - TIJEK.vuci) / 0.3) * (1 - glatko((c - TIJEK.vuci - TIJEK.vuciT - 0.2) / 0.6)));
      crtaj(povrsinaB, nP, 0, false);
      crtaj(flakonB, nF, 1, true);
      crtaj(flakonB, nF, 1, false);

      // veo (i njegov odraz)
      if (veo.aktivan && c < TIJEK.nestao) {
        veo.normale();
        osvjeziVeo(TV, veo);
        gl.useProgram(PV.p);
        zajednicke(PV, t, R, zum, oko);
        gl.uniform1f(PV.U.uAlphaVeo, alphaVela * (1 - glatko((c - TIJEK.nestao + 0.8) / 0.8)));
        gl.bindBuffer(gl.ARRAY_BUFFER, veoDin);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, TV.podaci);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
        gl.bindBuffer(gl.ARRAY_BUFFER, veoSt);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 16, 0);
        gl.uniform1f(PV.U.uOdraz, 1);
        gl.drawArrays(gl.POINTS, 0, TV.ukupno);
        gl.uniform1f(PV.U.uOdraz, 0);
        gl.drawArrays(gl.POINTS, 0, TV.ukupno);
        gl.disableVertexAttribArray(3);
      }
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
    window.__mxPokus = { veo: true };                                   // (za snimanje pokusa)
    window.__mxSkok = function (t) { vrijeme = t; nacrtaj(t); };        // skok na trenutak (za slike pokusa)
    window.__mxVeo = veo;                                               // (za provjeru simulacije)
    requestAnimationFrame(sljedeca);
  }

  function kreni() {
    const f = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    f.then(function () {
      try { pokreni(); } catch (e) { console.error('[Martimex] Veo:', e); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kreni);
  else kreni();
})();
