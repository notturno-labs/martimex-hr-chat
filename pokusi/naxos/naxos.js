/* ═════════════════════════════════════════════════════════════════════
   NAXOS — MRTVA PRIRODA OD TOČKICA (pokus za početni ekran chata Martimexa)

   Prizor s fotografije Xerjoff 1861 Naxos (izvor.webp), gledan sprijeda
   kao na njoj: flakon stoji na jantarnom bloku na drvenom stolu obasjanom
   suncem s prozora, a oko njega su sastojci mirisa: saće na tanjuru,
   štapići cimeta, bergamot s listom, buket lavande u kamenoj vazi,
   prerezani limun, zdjela meda s drvenom žlicom, cvjetovi jasmina, mahune
   vanilije, zrna tonke, list duhana i brašno prosuto po stolu; u zraku
   lebdi prašina, a iza je zid s prozorom.

   Sve je iscrtano u istom stilu kao pocetna-chata.js: točkice u tankim
   vodoravnim nitima (prstenovi oko tijela, vodoravni rezovi oblika), iste
   iskre i treptaj i ista gustoća niti na zaslonu kao flakon u animaciji,
   ali svaki predmet ima boje s fotografije, a svjetlo je kao na njoj:
   sunce s prozora straga lijevo (topli odsjaj i svijetli rub) i meko
   svjetlo sprijeda.
    - predmeti su NEPROZIRNI: prije crtanja točkica upiše se dubina
      prednjih ploha (svaka točkica kao malo veći neprozirni krug), pa se
      vide samo točkice prednjih ploha; što je iza predmeta, zaklonjeno je
      (postavka neprozirno)
    - prizor se složi iz izmaglice (predmet po predmet, flakon zadnji),
      zatim miruje: tek se malo njiše, nagne prema mišu, točkice trepere,
      niz flakon povremeno prijeđe sunčev odsjaj, a prašina lebdi
    - flakon je prepisan iz pocetna-chata.js (označeno niže); ostali
      predmeti su u mapi predmeti/ (svaki u svojoj datoteci, vidi
      NAXOS.predmet) i grade se iz profila (tijela koja se vrte oko osi),
      cijevi, plahti i SDF-a rezanog u vodoravne niti; stol dobiva sjene
      predmeta (pomaknute od prozora) i kontaktne sjene uz njih
    - razmak niti se bira tako da prizor ima zadani broj točkica (tocaka);
      jačina točkica se tome prilagodi kao u pocetna-chata.js
   Samostalna stranica naxos.html ima raspored početnog ekrana (CSS iz
   pocetna-chata.js), pa se vidi kao u chatu; ne treba Voiceflow.
   Pregled pojedinog predmeta: naxos.html?samo=limun (više: samo=limun,zdjela;
   stol=1 doda stol i pozadinu), zoom=2.5 (uvećano, u sredini), kut=35
   (okret prizora u stupnjevima, da se vidi i sa strane), nagib=19.
   ═════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const POSTAVKE = {
    // boje (s fotografije), uvijek #rrggbb
    boje: {
      podloga: '#000000',
      // flakon: bjelokosno mutno staklo s medenom tekućinom, čep, prsten i pločica od ružičastog zlata
      staklo: '#f0e7d3', tekucina: '#e2b256', zlatoFlakona: '#cf9466', plocica: '#c4855a', znakX: '#e8c67e',
      jantar: '#b85b1e', jantarVrh: '#dc8532', jantarRub: '#f0ac5c',     // jantarni blok
      stol: '#8c5a2e', stolTamno: '#4a2c16',                              // drveni stol
      tanjur: '#e9e0cf',
      sace: '#f3b42c', saceTamno: '#b56d14',                              // saće
      cimet: '#8e532e', cimetSvjetlo: '#b8743f', cimetTamno: '#5a3118',
      bergamot: '#b9c04b', bergamotTamno: '#8e9d33', list: '#527a2f', listSvjetlo: '#86ad4e',
      lavanda: '#7260ad', lavandaSvjetlo: '#a394d2', stabljika: '#83905f', vaza: '#b9ae9b', uzica: '#c8a46b',
      limunKora: '#e9c22a', limunMeso: '#f2d245', limunOpna: '#f9efc9',
      zdjela: '#e4dac7', zdjelaPjege: '#a89c88', med: '#c67a1d', medSvjetlo: '#eab35a', zlica: '#c69d6a',
      jasmin: '#f7f3ea', jasminSredina: '#e7c45e',
      vanilija: '#3d2518', vanilijaSjaj: '#7a5035',
      tonka: '#2b1a12', tonkaSjaj: '#5a3d2a',
      duhan: '#ad8650', duhanZila: '#85623a',
      brasno: '#f4eee2', prasina: '#f3e3c4',
      zid: '#b89a7c', zidTamno: '#6e533c', prozor: '#fff1cf', okvir: '#5a4330',   // pozadina: zid i prozor
      sunce: '#ffe3b0'                                                    // boja sunčeva svjetla (odsjaj, rub)
    },
    // broj točkica: prizor (sa stolom i zidom) ima oko 2,2 puta više ploha od
    // flakona i Penhaligon bočica zajedno, pa mu treba toliko više točkica da
    // niti na zaslonu budu jednako guste kao flakon u pocetna-chata.js (56 000, 32 000)
    tocaka: 240000,          // računalo
    tocakaMobitel: 130000,   // mobitel i tablet
    pojava: 3.4,             // s: prizor se složi iz izmaglice
    // kamera: pogled sprijeda kao na fotografiji
    pogled: {
      nagib: 0.33,           // koliko gledamo odozgo (rad; oko 19°)
      kamera: 14,            // udaljenost kamere (jedinice na zaslonu); velika = gotovo bez perspektive, kao nacrt
      velicina: 0.62,        // cijeli prizor je ovoliko puta manji, da stane u prostor animacije
      pomak: 0.14,           // prizor po visini u prostoru animacije
      njihanje: 0.06         // amplituda njihanja oko okomite osi (rad); 0 = miruje
    },
    neprozirno: true,        // predmeti zaklanjaju što je iza njih (dubinski predprolaz)
    sjene: true,             // sjene predmeta na stolu
    pozadina: true,          // zid s prozorom iza prizora
    nagibPremaMisu: true,    // na računalu se prizor lagano nagne prema mišu
    velicinaAnimacije: 1.09  // kao u pocetna-chata.js
  };

  const P = POSTAVKE, B = P.boje;
  const MOBITEL = !!(window.matchMedia && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches);
  const MIS = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const MIRNO = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  // pregled pojedinih predmeta (vidi vrh datoteke)
  const UPIT = new URLSearchParams(location.search);
  const SAMO = (UPIT.get('samo') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  const ZOOM = Math.max(0.2, +(UPIT.get('zoom') || 1) || 1);
  const KUT_PREGLEDA = (+(UPIT.get('kut') || 0) || 0) * Math.PI / 180;
  const NAGIB_PREGLEDA = UPIT.has('nagib') ? (+UPIT.get('nagib') || 0) * Math.PI / 180 : null;
  const SA_STOLOM = !SAMO.length || UPIT.get('stol') === '1';

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
  function korakG(a, b, x) { return glatko((x - a) / (b - a)); }     // smoothstep
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mijesaj(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function puta(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }
  function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function kriz(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  // 3D "value" šum (−1..1), ponovljiv; za kvrge bergamota, bore tonke, šare drva i papira
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
  const pjega = function (x, y, z, k) { return 0.5 + 0.5 * sum(x * k, y * k, z * k); };   // 0..1 šum

  // matrice 3 × 3 (po retcima): okret oko osi y (kut), pa oko x (nagib), pa oko z (valjanje)
  function matrica(kutY, nagibX, valjanjeZ) {
    const cy = Math.cos(kutY), sy = Math.sin(kutY), cx = Math.cos(nagibX || 0), sx = Math.sin(nagibX || 0);
    const cz = Math.cos(valjanjeZ || 0), sz = Math.sin(valjanjeZ || 0);
    const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], Rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]], Rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]];
    return mnozi(Rz, mnozi(Rx, Ry));
  }
  function mnozi(A, Bm) {
    const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] = A[i][0] * Bm[0][j] + A[i][1] * Bm[1][j] + A[i][2] * Bm[2][j];
    return C;
  }
  function primijeni(M, v) {
    return [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
  }
  // matrica koja os y okreće u smjer d (jedinični)
  function premaSmjeru(d) {
    const a = Math.acos(sat(d[1])), b = Math.atan2(d[0], d[2]);
    return mnozi([[Math.cos(b), 0, Math.sin(b)], [0, 1, 0], [-Math.sin(b), 0, Math.cos(b)]], [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]]);
  }

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
    return { poz: poz, nor: nor, vrsta: vrsta, korak: korak };
  }

  // ─────────────────────────────────────────────────────────────────────
  //  GRADNJA PRIZORA — svaki predmet je skup niti; na niti su točkice
  //  OMJER puta gušće nego što su niti razmaknute (kao u pocetna-chata.js).
  //  Skupljač prima niti i slaže točkice u spremnik; u načinu "broji" samo
  //  broji točkice: grubi prolaz (broji = 1, bez računanja točkica) s
  //  velikim razmakom niti kaže otprilike koliko točkica prizor ima, a
  //  točni prolaz (broji = 2, s računanjem, jer se dio točkica preskoči:
  //  stol ispod predmeta) uz procijenjeni razmak dotjera razmak za zadani broj.
  //  Svaka točkica ima VEL brojeva: mjesto (3), normala (3), boja (3),
  //  tvar (4: koliko svjetlo mijenja boju, tama stražnje strane, jačina,
  //  vrsta), slučajni brojevi (4) i odgoda pojave (1)
  // ─────────────────────────────────────────────────────────────────────
  const VEL = 18;
  const T = { x: 0, y: 0, z: 0, nx: 0, ny: 1, nz: 0, col: [1, 1, 1], lit: 1, back: 0.4, jak: 1, vrsta: 0, odgoda: 0 };
  // vrste točkica (shader): obična, staklo flakona, zlato flakona, stol, prašina u zraku, brašno, pozadina (zid i prozor)
  const OBICNO = 0, STAKLO_F = 1, ZLATO_F = 2, STOL = 3, PRASINA = 4, BRASNO = 5, POZADINA = 6;

  function Skupljac(korak, broji) {
    this.korak = korak; this.razmak = korak / OMJER; this.broji = broji;
    this.n = 0; this.linija = 0;
    this.dijelovi = []; this.dio = null; this.poz = 0;
    this.rnd = slucajno(1861);
  }
  Skupljac.prototype.dodaj = function (t) {
    if (!this.dio || this.poz >= this.dio.length) { this.dio = new Float32Array(VEL * 8192); this.dijelovi.push(this.dio); this.poz = 0; }
    const d = this.dio, o = this.poz;
    d[o] = t.x; d[o + 1] = t.y; d[o + 2] = t.z;
    d[o + 3] = t.nx; d[o + 4] = t.ny; d[o + 5] = t.nz;
    d[o + 6] = t.col[0]; d[o + 7] = t.col[1]; d[o + 8] = t.col[2];
    d[o + 9] = t.lit; d[o + 10] = t.back; d[o + 11] = t.jak; d[o + 12] = t.vrsta;
    d[o + 13] = this.rnd(); d[o + 14] = this.rnd(); d[o + 15] = this.rnd(); d[o + 16] = this.rnd();
    d[o + 17] = t.odgoda;
    this.poz += VEL; this.n++;
  };
  // nit: f(u, T) ispuni T za udio u (0..1) duž niti (vrati false = bez točkice);
  // broj točkica = duljina · tezina / razmak; zatvorena nit (prsten) nema krajeva
  Skupljac.prototype.nit = function (f, duljina, tezina, zatvoreno) {
    const m = Math.max(1, Math.round(duljina * tezina / this.razmak));
    const fi = ((++this.linija) * 0.618034) % 1;          // niti ne počinju u istoj točki
    if (this.broji === 1) { this.n += m; return; }
    for (let k = 0; k < m; k++) {
      const u = zatvoreno ? ((k + 0.5) / m + fi) % 1 : (k + 0.5 + (fi - 0.5) * 0.8) / m;
      if (f(u, T) === false) continue;
      if (this.broji) this.n++; else this.dodaj(T);
    }
  };
  // skup dužina jednog reza: točkice jednoliko po ukupnoj (težinskoj) duljini,
  // kao poLinijama; segs: [{ a, b, n, d, w }], f(T) boji točkicu
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
      if (this.broji) this.n++; else this.dodaj(T);
    }
  };
  // raspršene točkice (brašno, prašina): broj prati gustoću niti
  Skupljac.prototype.rasap = function (n, f) {
    const m = Math.round(n * Math.pow(0.02 / this.korak, 2));
    if (this.broji === 1) { this.n += m; return; }
    for (let i = 0; i < m; i++) {
      if (f(T, this.rnd) === false) continue;
      if (this.broji) this.n++; else this.dodaj(T);
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

  // ── Tijelo koje se vrti oko osi: profil [[y, r, tvar], ...] u vlastitim
  //    koordinatama (os y; profil ide oko tijela tako da mu je unutrašnjost
  //    slijeva: dno prema van, bok prema gore, vrh prema sredini), prstenovi
  //    na razmaku korak. o: M (matrica okreta), pomak, boja(T, y, r, kut, ny,
  //    tvar), tezina(y, r, ny) (plohe gledane s ruba mogu biti rjeđe)
  const JEDINICNA = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  function prsteni(S, profil, o) {
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
    }
  }

  // ── Cijev duž krivulje c(t) (t 0..1): prstenovi okomiti na krivulju na
  //    razmaku korak. o: r(t, kut) polumjer (može ovisiti o kutu: brazda
  //    cimeta, cvjetići lavande), spljosti (visina presjeka prema širini),
  //    boja(T, t, kut, r), tezina(t)
  function cijev(S, c, o) {
    const N = 120, pts = [], L = [0];
    for (let i = 0; i <= N; i++) pts.push(c(i / N));
    for (let i = 1; i <= N; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const uk = L[N], k = Math.max(1, Math.round(uk / S.korak)), kk = uk / k, spl = o.spljosti || 1;
    let e1 = null;
    for (let i = 0; i < k; i++) {
      const s = (i + 0.5) * kk;
      let j = 1;
      while (j < N && L[j] < s) j++;
      const t = ((j - 1) + (s - L[j - 1]) / Math.max(1e-9, L[j] - L[j - 1])) / N;
      const p = c(t), e = 0.003, pa = c(Math.max(0, t - e)), pb = c(Math.min(1, t + e));
      const tg = norm3([pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]]);
      // okvir (e1, e2) okomit na krivulju, prenosi se glatko duž nje
      if (!e1) { const ref = Math.abs(tg[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; e1 = norm3(kriz(ref, tg)); }
      else { const d = e1[0] * tg[0] + e1[1] * tg[1] + e1[2] * tg[2]; e1 = norm3([e1[0] - tg[0] * d, e1[1] - tg[1] * d, e1[2] - tg[2] * d]); }
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
    }
  }

  // ── Plahta: F(u, v) → [x, y, z] (u 0..1 duž niti, v 0..1 poprijeko); niti
  //    su na stalnom v, razmaknute oko korak · o.razmak (prema najvećoj
  //    širini plahte). o: boja(T, u, v), tezina, gore (normala prema gore)
  function plahta(S, F, o) {
    const e = 0.002, razmak = (o.razmak || 1) * S.korak;
    let W = 0;
    for (let i = 0; i < 8; i++) {
      let w = 0, prev = F((i + 0.5) / 8, 0);
      for (let j = 1; j <= 32; j++) { const q = F((i + 0.5) / 8, j / 32); w += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]); prev = q; }
      if (w > W) W = w;
    }
    const k = Math.max(1, Math.round(W / razmak));
    for (let j = 0; j < k; j++) {
      const v = (j + 0.5) / k;
      let L = 0, prev = F(0, v);
      for (let i = 1; i <= 64; i++) { const q = F(i / 64, v); L += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]); prev = q; }
      if (L < 1e-6) continue;
      S.nit(function (u, T) {
        const p = F(u, v), pu = F(Math.min(1, u + e), v), pv = F(u, Math.min(1, v + e));
        let n = kriz([pu[0] - p[0], pu[1] - p[1], pu[2] - p[2]], [pv[0] - p[0], pv[1] - p[1], pv[2] - p[2]]);
        n = norm3(n);
        if (o.gore && n[1] < 0) n = [-n[0], -n[1], -n[2]];
        T.x = p[0]; T.y = p[1]; T.z = p[2]; T.nx = n[0]; T.ny = n[1]; T.nz = n[2];
        return o.boja(T, u, v);
      }, L, o.tezina || 1, false);
    }
  }

  // ── Marching squares po rezu (ravnina): f(u, v) < 0 unutra; fina mreža
  //    (korak h) računa se samo uz površinu (gruba mreža GRUBO × GRUBO, kao u
  //    penhaligons/shared.js). Dužine [u1, v1, u2, v2, ...]
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

  // ── Predmet zadan SDF-om (udaljenost do plohe, < 0 unutra) u okviru
  //    [x0, x1, y0, y1, z0, z1]: vodoravni rezovi (ravnine y) na razmaku
  //    korak daju niti po okomitim i kosim plohama, a okomiti rezovi
  //    (ravnine z) niti po vodoravnim plohama (gornje plohe; donje se
  //    preskaču uz bezDna). o: boja(T), h (fina mreža, zadano 0,45 koraka),
  //    osi ('y', 'z' ili 'yz'), tezina
  function rezSDF(S, sdf, ok, o) {
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
      }
    }
  }

  // ── SDF pomoćnici (u svjetskim jedinicama)
  function sdElipsoid(x, y, z, rx, ry, rz) {
    const k0 = Math.hypot(x / rx, y / ry, z / rz), k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
    return k1 > 0 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
  }
  function sdKutija(x, y, z, hx, hy, hz, r) {
    const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r, qz = Math.abs(z) - hz + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  }
  function sdKapsula(x, y, z, a, b, r) {
    const pax = x - a[0], pay = y - a[1], paz = z - a[2], bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
    const h = sat((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz || 1));
    return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r;
  }
  function smin(a, b, k) { const h = sat(0.5 + 0.5 * (b - a) / k); return lerp(b, a, h) - k * h * (1 - h); }
  // svjetske koordinate → vlastite koordinate predmeta (okret M oko središta c)
  function uLokalno(M, c) {
    return function (x, y, z) {
      const dx = x - c[0], dy = y - c[1], dz = z - c[2];
      return [M[0][0] * dx + M[1][0] * dy + M[2][0] * dz, M[0][1] * dx + M[1][1] * dy + M[2][1] * dz, M[0][2] * dx + M[1][2] * dy + M[2][2] * dz];
    };
  }
  // udaljenost (2D) do ruba najbliže šesterokutne stanice saća (vrh stanice
  // uz os v); R: polumjer opisane kružnice, < 0 u stanici
  function sace2D(u, v, R) {
    const ri = R * 0.8660254, w = 2 * ri, hgt = 1.5 * R;
    let best = Infinity;
    const j0 = Math.floor(v / hgt);
    for (let j = j0 - 1; j <= j0 + 1; j++) {
      const off = (j & 1) ? ri : 0, i0 = Math.round((u - off) / w);
      for (let i = i0 - 1; i <= i0 + 1; i++) {
        const dx = Math.abs(u - (i * w + off)), dz = Math.abs(v - j * hgt);
        const d = Math.max(dx, dx * 0.5 + dz * 0.8660254) - ri;
        if (d < best) best = d;
      }
    }
    return best;
  }
  function kvadratna(A, C, Bq, t) {   // kvadratna Bézierova krivulja
    const s = 1 - t;
    return [s * s * A[0] + 2 * s * t * C[0] + t * t * Bq[0], s * s * A[1] + 2 * s * t * C[1] + t * t * Bq[1], s * s * A[2] + 2 * s * t * C[2] + t * t * Bq[2]];
  }


  // ─────────────────────────────────────────────────────────────────────
  //  PRIZOR — mjere u svjetskim jedinicama pocetna-chata.js (flakon je od
  //  −0,86 do 0,90, visok 1,76); x udesno, y gore, z prema nama. Stol je u
  //  y = STOL_Y, jantarni blok na njemu, a flakon na bloku (vrh bloka je u
  //  y = DNO_BOCICE). Položaji su izmjereni s fotografije (1 px ≈ 0,0035
  //  jedinice, kamera gleda odozgo pod oko 19°, gotovo bez perspektive),
  //  pa je prizor dubok: od limuna i bergamota straga (z ≈ −2,4) do mahuna
  //  vanilije i lista duhana sprijeda (z ≈ 2,7); zid je u z = −3,7.
  //  Predmeti su u mapi predmeti/: svaki se prijavi s NAXOS.predmet(ime,
  //  { red, gradi }) i gradi se redom po "red" (stol i pozadina zadnji)
  // ─────────────────────────────────────────────────────────────────────
  const STOL_Y = -1.05;
  const C = {};
  Object.keys(B).forEach(function (k) { C[k] = boja01(B[k]); });
  function tvar(T, col, lit, back, jak, vrsta, odgoda) { T.col = col; T.lit = lit; T.back = back; T.jak = jak; T.vrsta = vrsta; T.odgoda = odgoda; return true; }

  // ── tlocrti predmeta na stolu (s visinom predmeta): ispod njih stol i
  //    tanjur nemaju točkica (točkice se zbrajaju, pa bi se kroz predmet
  //    vidjela podloga), a stol uz njih dobiva sjene (vidi predmeti/stol.js)
  const ZAKLON = [];
  function zaklon(f, h) { ZAKLON.push({ f: f, h: h || 0.2 }); }
  function zaklonKrug(x, z, r, h) { zaklon(function (px, pz) { return (px - x) * (px - x) + (pz - z) * (pz - z) < r * r; }, h); }
  function zaklonKutija(x, z, kut, hx, hz, h) {
    const c = Math.cos(kut), s = Math.sin(kut);
    zaklon(function (px, pz) {
      const dx = px - x, dz = pz - z, lx = c * dx - s * dz, lz = s * dx + c * dz;
      return Math.abs(lx) < hx && Math.abs(lz) < hz;
    }, h);
  }
  function zaklonKapsula(ax, az, bx, bz, r, h) {
    zaklon(function (px, pz) {
      const bax = bx - ax, baz = bz - az, t = sat(((px - ax) * bax + (pz - az) * baz) / (bax * bax + baz * baz || 1));
      const dx = px - ax - bax * t, dz = pz - az - baz * t;
      return dx * dx + dz * dz < r * r;
    }, h);
  }
  function uZaklonu(x, z) { for (let i = 0; i < ZAKLON.length; i++) if (ZAKLON[i].f(x, z)) return true; return false; }
  // sjena na stolu u točki (x, z): 0 bez sjene .. 1 puna. Sunce dolazi s
  // prozora straga lijevo, pa sjene padaju prema nama i udesno (pomak raste
  // s visinom predmeta, rub je mek); uz sam predmet je kontaktna sjena
  function sjena(x, z) {
    let s = 0;
    for (let i = 0; i < ZAKLON.length; i++) {
      const o = ZAKLON[i], h = Math.min(0.7, Math.max(0.1, o.h));
      for (let k = 1; k <= 3 && s < 0.7; k++) {
        const f = k / 3;
        if (o.f(x - 0.5 * h * f, z - 0.42 * h * f)) s = Math.max(s, 0.7 - 0.22 * f);
      }
      if (s < 0.45) {
        for (let k = 0; k < 8 && s < 0.45; k++) {
          const a = k * Math.PI / 4;
          if (o.f(x + 0.07 * Math.cos(a), z + 0.07 * Math.sin(a))) s = Math.max(s, 0.45);
          else if (o.f(x + 0.14 * Math.cos(a), z + 0.14 * Math.sin(a))) s = Math.max(s, 0.22);
        }
      }
    }
    return s;
  }

  // ── predmeti (predmeti/*.js): NAXOS.predmet(ime, { red, podloga, gradi })
  //    gradi(S) je generator (yield da stranica ne zapne); podloga = stol i
  //    pozadina (u pregledu pojedinog predmeta dolaze samo uz stol=1)
  const PREDMETI = [];
  function predmet(ime, def) { PREDMETI.push({ ime: ime, red: def.red == null ? 50 : def.red, podloga: !!def.podloga, gradi: def.gradi }); }
  function* gradi(S) {
    ZAKLON.length = 0;
    const popis = PREDMETI.slice().sort(function (a, b) { return a.red - b.red; });
    for (let i = 0; i < popis.length; i++) {
      const p = popis[i];
      if (SAMO.length && SAMO.indexOf(p.ime) < 0 && !(p.podloga && SA_STOLOM)) continue;
      yield* p.gradi(S);
      yield;
    }
  }

  // sve što predmetima treba
  const N = window.NAXOS = {
    P: P, B: B, C: C, STOL_Y: STOL_Y, OMJER: OMJER, DNO_BOCICE: DNO_BOCICE, VRH_BOCICE: VRH_BOCICE, T: T, VEL: VEL,
    vrste: { OBICNO: OBICNO, STAKLO_F: STAKLO_F, ZLATO_F: ZLATO_F, STOL: STOL, PRASINA: PRASINA, BRASNO: BRASNO, POZADINA: POZADINA },
    sat: sat, lerp: lerp, glatko: glatko, korakG: korakG, mijesaj: mijesaj, puta: puta, zasiti: zasiti, norm3: norm3, kriz: kriz,
    sum: sum, hash3: hash3, pjega: pjega, slucajno: slucajno, boja01: boja01, rgb: rgb,
    matrica: matrica, mnozi: mnozi, primijeni: primijeni, premaSmjeru: premaSmjeru, JEDINICNA: JEDINICNA,
    prsteni: prsteni, cijev: cijev, plahta: plahta, rezSDF: rezSDF, rez2: rez2, poLinijama: poLinijama,
    sdElipsoid: sdElipsoid, sdKutija: sdKutija, sdKapsula: sdKapsula, smin: smin, uLokalno: uLokalno, sace2D: sace2D, kvadratna: kvadratna,
    flakon: flakon, tvar: tvar,
    zaklon: zaklon, zaklonKrug: zaklonKrug, zaklonKutija: zaklonKutija, zaklonKapsula: zaklonKapsula, uZaklonu: uZaklonu, sjena: sjena, ZAKLON: ZAKLON,
    predmet: predmet, PREDMETI: PREDMETI, SAMO: SAMO
  };

  // Grubi prolaz brojanja s razmakom 0,05, pa točni prolaz uz procijenjeni
  // razmak (broj točkica raste s 1/razmak²), pa gradnja s razmakom za zadani
  // broj; radi u koracima (yield), da stranica ne zapne
  const KORAK_PREGLEDA = 0.021;   // razmak niti u pregledu pojedinog predmeta (kao cijeli prizor na računalu), podijeljen zoomom
  function* pripremi(n) {
    let korak = KORAK_PREGLEDA / ZOOM;
    if (!SAMO.length) {
      const grubo = new Skupljac(0.05, 1);
      yield* gradi(grubo);
      korak = 0.05 * Math.sqrt(grubo.n / n);
      yield;
      const tocno = new Skupljac(korak, 2);
      yield* gradi(tocno);
      korak *= Math.sqrt(tocno.n / n);
      yield;
    }
    const S = new Skupljac(korak, 0);
    yield* gradi(S);
    const podaci = S.spremnik();
    // okvir predmeta (bez stola, prašine i pozadine): za pregled pojedinog predmeta
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < S.n; i++) {
      const o = i * VEL;
      if (podaci[o + 12] >= 2.5) continue;
      for (let k = 0; k < 3; k++) { if (podaci[o + k] < min[k]) min[k] = podaci[o + k]; if (podaci[o + k] > max[k]) max[k] = podaci[o + k]; }
    }
    return { podaci: podaci, n: S.n, korak: korak, korakFlakona: S.korakFlakona, min: min, max: max };
  }
  function izvrsiPostupno(gen) {
    return new Promise(function (gotovo, greska) {
      function dio() {
        const kraj = performance.now() + 12;
        try {
          for (;;) {
            const r = gen.next();
            if (r.done) { gotovo(r.value); return; }
            if (performance.now() > kraj) break;
          }
        } catch (e) { greska(e); return; }
        setTimeout(dio, 0);
      }
      dio();
    });
  }


  // ─────────────────────────────────────────────────────────────────────
  //  SHADER — točkice kao u pocetna-chata.js (iskre, treptaj, dubina), ali
  //  svjetlo kao na fotografiji: sunce s prozora straga lijevo (topli
  //  odsjaj, svijetli rub) i meko svjetlo sprijeda; uz to dubinski
  //  predprolaz (uPre: točkice kao veći neprozirni krugovi upisuju samo
  //  dubinu, pa se poslije vide samo točkice prednjih ploha), pojava iz
  //  izmaglice, sunčev odsjaj niz flakon i lebdenje prašine
  // ─────────────────────────────────────────────────────────────────────
  const VS = `
    precision highp float;

    attribute vec3 aP;       // mjesto u prizoru
    attribute vec3 aN;       // normala
    attribute vec3 aCol;     // boja (s fotografije)
    attribute vec4 aM;       // tvar: koliko svjetlo mijenja boju, tama stražnje strane, jačina, vrsta
    attribute vec4 aRnd;     // slučajni brojevi 0..1
    attribute float aT;      // odgoda pojave (0 prvi .. 1 zadnji)

    uniform float uT;        // vrijeme od otvaranja (s)
    uniform float uIntro;    // pojava (0..1)
    uniform mat3 uRot;       // okret prizora (nagib prema nama, njihanje, nagib prema mišu)
    uniform float uKomp;     // veličina prizora
    uniform vec3 uPomak;     // pomak prizora na zaslonu
    uniform vec2 uPx;        // svjetska jedinica → ekran
    uniform vec2 uCenter;
    uniform float uSize;
    uniform float uSweep;    // visina odsjaja koji prelazi niz flakon (99 = nema)
    uniform float uAlpha;    // jačina točkica
    uniform vec3 uSunce;     // boja sunčeva svjetla
    uniform float uPre;      // 1: dubinski predprolaz
    uniform float uSplat;    // promjer kruga točkice u predprolazu (px)
    uniform float uBias;     // koliko je ljuska predprolaza pomaknuta u dubinu (jedinice na zaslonu)
    uniform float uCam;      // udaljenost kamere

    varying vec4 vCol;

    const float STOL = ${STOL_Y.toFixed(3)};

    vec2 okreni(vec2 v, float k) {
      float c = cos(k), s = sin(k);
      return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
    }

    void main() {
      vec3 p = aP, n = aN, col = aCol;
      float lit = aM.x, back = aM.y, alpha = uAlpha * aM.z, vrsta = aM.w, t = uT;
      bool flakon = vrsta > 0.5 && vrsta < 2.5;
      bool stol = vrsta > 2.5 && vrsta < 3.5;
      bool prasina = vrsta > 3.5 && vrsta < 4.5;
      bool brasno = vrsta > 4.5 && vrsta < 5.5;
      bool pozadina = vrsta > 5.5;
      if (flakon) {
        p.y += 0.012 * sin(t * 0.8);                                  // flakon lagano diše (kao u pocetna-chata.js)
        float dv = (aP.y - uSweep) / 0.06;
        col += uSunce * 0.55 * exp(-dv * dv);
      }
      if (prasina) {
        // prašina polako tone i njiše se, a svjetluca kad uđe u zraku sunca
        float h = fract(aRnd.z + t * 0.006 * (0.4 + aRnd.y));
        p.y = STOL + 0.1 + 2.3 * (1.0 - h);
        p.x += 0.06 * sin(t * 0.23 + aRnd.x * 6.28) + 0.03 * sin(t * 0.61 + aRnd.w * 6.28);
        p.z += 0.04 * sin(t * 0.19 + aRnd.w * 6.28);
        alpha *= 0.55 + 0.45 * sin(t * (0.6 + aRnd.w) + aRnd.x * 20.0);
      }
      // pojava: točkice doplove iz izmaglice iznad prizora, u vrtlogu,
      // predmet po predmet (aT), i zasvijetle kad sjednu na mjesto
      float ki = 1.0;
      if (uIntro < 1.0) {
        ki = clamp((uIntro - 0.7 * aT - 0.03 * aRnd.y) / 0.3, 0.0, 1.0);
        float e = 1.0 - pow(1.0 - ki, 3.0);
        vec3 izvor = p + normalize(vec3(aRnd.z, aRnd.w, aRnd.x) - 0.5 + 0.001) * (0.25 + 0.5 * aRnd.y) + vec3(0.0, 0.5, 0.0);
        izvor.xz = okreni(izvor.xz, (1.0 - e) * 0.7);
        p = mix(izvor, p, e);
        alpha *= e;
        float b = (ki - 0.85) / 0.1;
        col *= 1.0 + 0.45 * exp(-b * b);
      }

      vec3 q = uRot * (p * uKomp) + uPomak;
      vec3 nq = normalize(uRot * n);
      float persp = uCam / (uCam - q.z);
      // ljuska predprolaza je pomaknuta u dubinu; plohe gledane pod oštrim kutom
      // (stol, vrh bloka) dublje, jer su im susjedne niti na zaslonu blizu, a
      // u dubini daleko (inače bi ih vlastita ljuska izrezala u pruge)
      float dub = -q.z * 0.25 + (uPre > 0.5 ? uBias * 0.25 * (0.6 + 2.5 * (1.0 - abs(nq.z))) : 0.0);
      gl_Position = vec4(q.x * uPx.x * persp + uCenter.x, q.y * uPx.y * persp + uCenter.y, clamp(dub, -0.99, 0.99), 1.0);
      if (uPre > 0.5) {
        // predprolaz: svaka točkica (osim prašine i brašna) je neprozirni krug
        // koji upisuje dubinu malo iza sebe, pa točkice iste plohe prolaze, a
        // one iza plohe ne
        bool bez = prasina || brasno || alpha < 0.02 || ki < 0.92;   // točkice koje još lete (izmaglica) ne zaklanjaju
        gl_PointSize = bez ? 0.0 : uSplat * persp;
        if (bez) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        vCol = vec4(0.0);
        return;
      }
      alpha *= 1.0 - smoothstep(0.9, 1.0, abs(gl_Position.x));      // rub prozora utopi prizor
      float iskra = step(0.996, aRnd.z) * ((stol || brasno || pozadina) ? 0.0 : 1.0);
      gl_PointSize = uSize * persp * (1.0 + iskra * 0.7) * (prasina ? 0.85 : 1.0);

      // svjetlo kao na fotografiji: sunce s prozora straga lijevo (toplo:
      // sjena, odsjaj, svijetli rub na strani sunca) i meko svjetlo sprijeda
      vec3 Ls = normalize(vec3(-0.55, 0.45, -0.7));
      vec3 Lf = normalize(vec3(0.35, 0.45, 0.82));
      float ds = max(dot(nq, Ls), 0.0);
      float df = max(dot(nq, Lf), 0.0);
      float spe = pow(max(dot(nq, normalize(Ls + vec3(0.0, 0.0, 1.0))), 0.0), 30.0);
      float rub = pow(1.0 - abs(nq.z), 2.0) * smoothstep(-0.1, 0.5, dot(nq, Ls));
      float nebo = smoothstep(-0.1, 0.4, nq.y);
      vec3 svjetlo = vec3(0.3) + 0.8 * df * vec3(1.0, 0.97, 0.92) + (0.55 * ds + 1.4 * spe + 0.8 * rub) * uSunce + 0.25 * nebo * vec3(1.0, 0.9, 0.75);
      float lice = mix(back, 1.0, smoothstep(-0.2, 0.25, nq.z));   // stražnja strana tamnija
      float dubina = mix(1.0, clamp(0.85 + 0.12 * q.z, 0.6, 1.1), lit);
      float treptaj = 0.84 + 0.16 * sin(t * (1.5 + 2.0 * aRnd.w) + aRnd.y * 40.0);
      treptaj = mix(treptaj, 1.0 + 1.1 * max(0.0, sin(t * 2.1 + aRnd.x * 50.0)), iskra);
      vCol = vec4(col * mix(vec3(1.0), svjetlo, lit) * lice, alpha * treptaj * dubina);
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

  const UNIFORME = ['uT', 'uIntro', 'uRot', 'uKomp', 'uPomak', 'uPx', 'uCenter', 'uSize', 'uSweep', 'uAlpha', 'uSunce', 'uPre', 'uSplat', 'uBias', 'uCam'];
  const ATRIBUTI = [['aRnd', 4, 13], ['aP', 3, 0], ['aN', 3, 3], ['aCol', 3, 6], ['aM', 4, 9], ['aT', 1, 17]];
  function poStupcima(M) { return [M[0][0], M[1][0], M[2][0], M[0][1], M[1][1], M[2][1], M[0][2], M[1][2], M[2][2]]; }


  // ─────────────────────────────────────────────────────────────────────
  //  ANIMACIJA
  // ─────────────────────────────────────────────────────────────────────
  function pokreni() {
    const korijen = document.querySelector('.mx-p');
    const platno = korijen.querySelector('.mx-p-platno');
    const prostor = korijen.querySelector('.mx-p-animacija');
    const gl = platno.getContext('webgl', { alpha: false, antialias: false, depth: true, stencil: false, premultipliedAlpha: false });
    if (!gl) { korijen.classList.add('mx-p-bez-gl'); return; }
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
    ATRIBUTI.forEach(function (a, i) { gl.bindAttribLocation(program, i, a[0]); });
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const U = {};
    UNIFORME.forEach(function (u) { U[u] = gl.getUniformLocation(program, u); });

    const PG = P.pogled || {};
    const NAGIB = NAGIB_PREGLEDA != null ? NAGIB_PREGLEDA : (isFinite(+PG.nagib) ? +PG.nagib : 0.33);
    const CAM = Math.max(3, +PG.kamera || 14), KOMP0 = Math.max(0.1, +PG.velicina || 0.62), POMAK0 = isFinite(+PG.pomak) ? +PG.pomak : 0.14;
    const NJIH = MIRNO.matches ? 0 : Math.max(0, +PG.njihanje || 0);
    let W = 1, H = 1, dpr = 1, S = 160, sx = 0, sy = 0, n = 0, jacina = 0.5, spremno = false, korak = 0.02;
    let komp = KOMP0, sredina = null;              // pregled pojedinog predmeta: uvećan i u sredini
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
      if (spremno) nacrtaj(MIRNO.matches ? 7 : vrijeme);
    }
    velicina();
    window.addEventListener('resize', velicina);

    let misX = 0, misY = 0, nagibX = 0, nagibY = 0;
    if (MIS && P.nagibPremaMisu) {
      korijen.addEventListener('pointermove', function (e) {
        const r = korijen.getBoundingClientRect();
        misX = sat((e.clientX - r.left) / r.width) * 2 - 1; misY = sat((e.clientY - r.top) / r.height) * 2 - 1;
      });
      korijen.addEventListener('pointerleave', function () { misX = misY = 0; });
    }

    function nacrtaj(t) {
      const mirno = MIRNO.matches;
      const njih = NJIH * Math.sin(t * 0.17);
      const R = matrica(KUT_PREGLEDA + njih + nagibX * 0.12, NAGIB + nagibY * 0.06);
      // sunčev odsjaj niz flakon: 2 s nakon pojave, pa svakih 9 s
      const c = (t - P.pojava - 2) % 9;
      const sweep = (!mirno && t > P.pojava + 2 && c < 1.9) ? lerp(1.15, -1.25, c / 1.7) : 99;
      let pomak = [0, POMAK0, 0];
      if (sredina) { const v = primijeni(R, [sredina[0] * komp, sredina[1] * komp, sredina[2] * komp]); pomak = [-v[0], -v[1], -v[2]]; }
      gl.clearColor(0, 0, 0, 1);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(U.uT, t);
      gl.uniform1f(U.uIntro, mirno ? 1 : sat(t / P.pojava));
      gl.uniformMatrix3fv(U.uRot, false, poStupcima(R));
      gl.uniform1f(U.uKomp, komp);
      gl.uniform3fv(U.uPomak, pomak);
      gl.uniform2f(U.uPx, 2 * S / W, 2 * S / H);
      gl.uniform2f(U.uCenter, 2 * sx / W - 1, 1 - 2 * sy / H);
      gl.uniform1f(U.uSize, 1.35 * dpr * Math.min(1.25, Math.max(0.8, Math.sqrt(S / 160))));
      gl.uniform1f(U.uSweep, sweep);
      gl.uniform1f(U.uAlpha, jacina);
      gl.uniform1f(U.uCam, CAM);
      gl.uniform1f(U.uSplat, Math.max(1.5, korak * komp * S * dpr * 1.3));
      gl.uniform1f(U.uBias, 1.7 * korak * komp);
      if (P.neprozirno) {
        // 1. dubina prednjih ploha (bez boje), 2. točkice samo gdje nisu iza njih
        gl.colorMask(false, false, false, false);
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.disable(gl.BLEND);
        gl.uniform1f(U.uPre, 1);
        gl.drawArrays(gl.POINTS, 0, n);
        gl.colorMask(true, true, true, true);
        gl.depthMask(false);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.BLEND);
        gl.uniform1f(U.uPre, 0);
      } else gl.disable(gl.DEPTH_TEST);
      gl.drawArrays(gl.POINTS, 0, n);
    }

    let vrijeme = 0, zadnje = 0;
    function sljedeca(sad) {
      requestAnimationFrame(sljedeca);
      const dt = Math.min(0.05, Math.max(0, (sad - zadnje) / 1000));
      zadnje = sad;
      vrijeme += dt;
      const f = 1 - Math.exp(-dt * 3.5);
      nagibX += (misX - nagibX) * f; nagibY += (misY - nagibY) * f;
      nacrtaj(vrijeme);
    }

    // prizor se gradi u koracima (stranica ne zapne), pa se pokaže
    const broj = MOBITEL ? P.tocakaMobitel : P.tocaka, t0 = performance.now();
    izvrsiPostupno(pripremi(broj)).then(function (R) {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, R.podaci, gl.STATIC_DRAW);
      ATRIBUTI.forEach(function (a, i) {
        gl.enableVertexAttribArray(i);
        gl.vertexAttribPointer(i, a[1], gl.FLOAT, false, VEL * 4, a[2] * 4);
      });
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);           // točkice se zbrajaju (svjetlo)
      gl.uniform3fv(U.uSunce, boja01(B.sunce));
      n = R.n; korak = R.korak;
      // jačina točkica prema gustoći niti na zaslonu, kao flakon u
      // pocetna-chata.js (0,7 uz 26 000 točkica, tj. razmak niti 0,0173; uz
      // više točkica slabije, s gustoća^-0,65); neprozirni prizor je jači, jer
      // se vide samo prednje plohe (točkice se ne zbrajaju kroz predmet)
      const gustoca = Math.pow(0.01728 / (R.korak * KOMP0 * (SAMO.length ? ZOOM : 1)), 2);   // (u uvećanom pregledu točkice su rjeđe na zaslonu, pa jače: pregled je tada vjeran)
      jacina = 0.7 * Math.min(2, Math.max(0.25, Math.pow(gustoca, -0.65))) * (P.neprozirno ? 1.6 : 1);
      const kaoFlakon = Math.round(26000 * gustoca);
      if (SAMO.length && isFinite(R.min[0])) {
        sredina = [(R.min[0] + R.max[0]) / 2, (R.min[1] + R.max[1]) / 2, (R.min[2] + R.max[2]) / 2];
        komp = KOMP0 * ZOOM;
      }
      console.info('[Martimex] Naxos: ' + R.n + ' točkica, razmak niti ' + R.korak.toFixed(4) + ' (na zaslonu kao flakon s ' + kaoFlakon + ' točkica), ' + ((performance.now() - t0) / 1000).toFixed(1) + ' s gradnje' + (SAMO.length ? ', pregled: ' + SAMO.join(', ') : ''));
      spremno = true;
      zadnje = performance.now();
      if (MIRNO.matches) nacrtaj(7);
      else { nacrtaj(0); requestAnimationFrame(sljedeca); }
      korijen.classList.add('mx-p-spremno');
      window.__mxPokus = { naxos: true, info: { n: R.n, korak: R.korak, kaoFlakon: kaoFlakon, samo: SAMO } };   // (za snimanje pokusa)
    }).catch(function (e) {
      console.error('[Martimex] Naxos:', e);
      korijen.classList.add('mx-p-bez-gl');
    });
  }

  function kreni() {
    const f = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    f.then(function () {
      try { pokreni(); } catch (e) { console.error('[Martimex] Naxos:', e); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kreni);
  else kreni();
})();
