// ═══════════════════════════════════════════════════════════════════════
//  Penhaligon's Portraits — zajednička podloga za skice (nije još u
//  pocetna-chata.js). Bočica se slaže od točkica u nitima, kao Xerjoff
//  flakon: tijelo u prstenovima, etiketa u gustim vodoravnim nitima, a
//  zlatni ovratnik i glava životinje u vodoravnim rezovima SDF-a.
//
//  Mjere su u PIKSELIMA FOTOGRAFIJE (ref/foto.jpg, bočice su 181 px široke):
//  y = 0 je dno bočice, y raste prema gore; x udesno; z prema nama (prema
//  etiketi). Glava (vrat životinje) počinje na vrhu ovratnika, y = 341.
//
//  Modul glave (glave/<id>.js) upisuje:
//    PEN.glave['<id>'] = {
//      ime, podnaslov,               // tekst na etiketi
//      staklo: ['#gore', '#dolje'],  // boja stakla pri vrhu i pri dnu tekućine
//      okvir: { x: 140, yMin: 330, yMax: 600, z: 140 },   // gdje glava može biti (px)
//      sdf: function (x, y, z) {...} // udaljenost do površine glave (px), < 0 unutra
//    }
//  Ovratnik i tijelo dodaje podloga; glava se s ovratnikom spaja (unija).
// ═══════════════════════════════════════════════════════════════════════
(function () {
  'use strict';
  const PEN = window.PEN = window.PEN || {};
  PEN.glave = PEN.glave || {};

  function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  PEN.sat = sat; PEN.lerp = lerp;

  // ── SDF pomoćnici (sve u pikselima). p = [x, y, z]
  const S = PEN.sdf = {
    len3: function (x, y, z) { return Math.sqrt(x * x + y * y + z * z); },
    kugla: function (p, c, r) { return S.len3(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r; },
    // elipsoid s poluosima r (približno, Inigo Quilez)
    elipsoid: function (p, c, r) {
      const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
      const k0 = S.len3(x / r[0], y / r[1], z / r[2]);
      const k1 = S.len3(x / (r[0] * r[0]), y / (r[1] * r[1]), z / (r[2] * r[2]));
      return k1 > 0 ? k0 * (k0 - 1) / k1 : -Math.min(r[0], r[1], r[2]);
    },
    // kapsula od a do b, polumjer r
    kapsula: function (p, a, b, r) {
      const pax = p[0] - a[0], pay = p[1] - a[1], paz = p[2] - a[2];
      const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
      const h = sat((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz || 1));
      return S.len3(pax - bax * h, pay - bay * h, paz - baz * h) - r;
    },
    // stožac zaobljenih krajeva od a (polumjer ra) do b (polumjer rb)
    stozac: function (p, a, b, ra, rb) {
      const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
      const l2 = bax * bax + bay * bay + baz * baz, rr = ra - rb, a2 = l2 - rr * rr, il2 = 1 / (l2 || 1);
      const pax = p[0] - a[0], pay = p[1] - a[1], paz = p[2] - a[2];
      const yv = pax * bax + pay * bay + paz * baz, z = yv - l2;
      const qx = pax * l2 - bax * yv, qy = pay * l2 - bay * yv, qz = paz * l2 - baz * yv;
      const x2 = qx * qx + qy * qy + qz * qz, y2 = yv * yv * l2, z2 = z * z * l2;
      const k = Math.sign(rr) * rr * rr * x2;
      if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - rb;
      if (Math.sign(yv) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - ra;
      return (Math.sqrt(x2 * a2 * il2) + yv * rr) * il2 - ra;
    },
    // kutija sa središtem c, pola veličine b, zaobljenje r
    kutija: function (p, c, b, r) {
      const qx = Math.abs(p[0] - c[0]) - b[0] + (r || 0), qy = Math.abs(p[1] - c[1]) - b[1] + (r || 0), qz = Math.abs(p[2] - c[2]) - b[2] + (r || 0);
      return S.len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - (r || 0);
    },
    // okomiti valjak (os y) od y0 do y1, polumjer r, zaobljenje rub
    valjak: function (p, c, r, y0, y1, rub) {
      rub = rub || 0;
      const dx = Math.hypot(p[0] - c[0], p[2] - c[2]) - r + rub, dy = Math.max(y0 - p[1], p[1] - y1) + rub;
      return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - rub;
    },
    // meka unija / presjek / razlika (k = širina prijelaza u px)
    smin: function (a, b, k) { const h = sat(0.5 + 0.5 * (b - a) / k); return lerp(b, a, h) - k * h * (1 - h); },
    smax: function (a, b, k) { return -S.smin(-a, -b, k); },
    razlika: function (a, b, k) { return k ? S.smax(a, -b, k) : Math.max(a, -b); },
    // okret točke oko osi (kut u radijanima) oko središta c
    okreniY: function (p, c, k) { const s = Math.sin(k), co = Math.cos(k), x = p[0] - c[0], z = p[2] - c[2]; return [c[0] + co * x + s * z, p[1], c[2] - s * x + co * z]; },
    okreniX: function (p, c, k) { const s = Math.sin(k), co = Math.cos(k), y = p[1] - c[1], z = p[2] - c[2]; return [p[0], c[1] + co * y - s * z, c[2] + s * y + co * z]; },
    okreniZ: function (p, c, k) { const s = Math.sin(k), co = Math.cos(k), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + co * x - s * y, c[1] + s * x + co * y, p[2]]; },
    // kapsule duž niza točaka (rog, parožak, uho) s polumjerima koji se mijenjaju
    niz: function (p, T, R, k) {
      let d = Infinity;
      for (let i = 0; i < T.length - 1; i++) {
        const di = S.stozac(p, T[i], T[i + 1], R[i], R[i + 1]);
        d = k ? (d === Infinity ? di : S.smin(d, di, k)) : Math.min(d, di);
      }
      return d;
    }
  };

  // ── Tijelo: profil vanjske plohe stakla [y, pola širine], izmjereno s
  //    fotografije (dno 1809 px; svih pet bočica ima isto tijelo). Bokovi su
  //    ravni i od ramena se prema dnu jednoliko lagano sužavaju, sve do dna,
  //    bez ikakvog ruba ili izbočine; dno je ravno, a rub dna zaobljen
  //    polumjerom 12 px (kao na fotografiji The Baroness).
  const TIJELO = [
    [0, 0], [0, 71.3], [0.41, 74.4], [1.61, 77.3], [3.51, 79.8], [6.0, 81.7], [8.89, 82.9], [12, 83.3], // ravno dno, zaobljen rub
    [40, 84.0], [60, 84.5], [100, 85.5], [140, 86.5], [180, 87.5], [220, 88.5],                         // tijelo se prema gore lagano širi
    [260, 89.5], [290, 90.4], [298, 90.2], [304, 89.4], [309, 87.6], [313, 85],                         // zaobljeno rame
    [317, 80], [320, 73], [321.5, 67], [322, 62]                                                         // ravni vrh ramena pod ovratnikom
  ];
  const DNO_TEKUCINE = 64;           // ispod je debelo prozirno staklo
  const STIJENKA = 5.5;              // debljina stakla uz tekućinu (dno tekućine je za toliko uže od tijela)
  const DNO_TEZINA = 0.3;            // gustoća točkica na ravnom dnu (prema ostatku stakla)
  const DNO_TEKUCINE_TEZINA = 0.6;   // gustoća točkica na niti dna tekućine
  const OVRATNIK = { r: 65.5, y0: 321, y1: 341, rub: 2.5 };
  // etiketa: vanjski okvir ±46 × [78, 262], crni okvir debljine 4,5 px
  const ETIKETA = { x: 46, y0: 78, y1: 262, okvir: 4.5 };
  PEN.TIJELO = TIJELO; PEN.OVRATNIK = OVRATNIK; PEN.ETIKETA = ETIKETA; PEN.DNO_TEKUCINE = DNO_TEKUCINE;
  PEN.VRH_OVRATNIKA = OVRATNIK.y1;
  // vrste točaka
  const STAKLO = 0, PROZIRNO = 1, ZLATO = 2, ETIKETA_V = 3;
  PEN.VRSTE = { STAKLO: STAKLO, PROZIRNO: PROZIRNO, ZLATO: ZLATO, ETIKETA: ETIKETA_V };

  function polaSirineTijela(y) {
    for (let i = 0; i < TIJELO.length - 1; i++) {
      const a = TIJELO[i], b = TIJELO[i + 1];
      if (y >= a[0] && y <= b[0] && b[0] > a[0]) return lerp(a[1], b[1], (y - a[0]) / (b[0] - a[0]));
    }
    return 0;
  }
  PEN.polaSirineTijela = polaSirineTijela;

  // ── Etiketa, crtana kao na originalu: crni okvir; PORTRAITS u klasičnom
  //    serifu s razmakom među slovima; PENHALIGON'S u teškom serifu s većim
  //    početnim P i sjenom dolje desno (kao reljefna viktorijanska slova);
  //    tanka crta s uvojcima na krajevima; grb sa životinjom s čepa između
  //    lisnatih vitica; podnaslov i ime u uskom groteskom pismu. Položaji i
  //    veličine izmjereni su na fotografiji etikete The Baroness (164 × 336 px)
  //    i preračunati na etiketu modela (92 × 184 px fotografije). Pisma su ona
  //    koja animacija ionako učitava (Cormorant Garamond i Jost iz mape fonts/).
  const SERIF = '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif';
  const SANS = '"MX Jost", Futura, "Century Gothic", "Avenir Next", "Segoe UI", Arial, sans-serif';
  PEN.FONTOVI_ETIKETE = ['700 20px ' + SERIF, '500 20px ' + SANS, '600 20px ' + SANS];

  // visina velikih slova kao dio veličine pisma (izmjeri preglednik)
  function visinaVelikih(ctx, tezina, obitelj) {
    ctx.font = tezina + ' 100px ' + obitelj;
    const m = ctx.measureText('H');
    return m.actualBoundingBoxAscent > 1 ? m.actualBoundingBoxAscent / 100 : 0.66;
  }
  // slova retka: dijelovi [{ t, tezina, obitelj, visina (velikih slova, px) }]
  function slovaRetka(ctx, dijelovi) {
    const sl = [];
    dijelovi.forEach(function (d) {
      const font = d.tezina + ' ' + (d.visina / visinaVelikih(ctx, d.tezina, d.obitelj)) + 'px ' + d.obitelj;
      ctx.font = font;
      Array.from(d.t).forEach(function (c) { sl.push({ c: c, font: font, w: ctx.measureText(c).width }); });
    });
    return sl;
  }
  // sabijanje (vodoravno mjerilo slova) uz koje je redak širok `sirina` px
  // kad je razmak među slovima `razmak` px
  function sabijanje(ctx, dijelovi, razmak, sirina) {
    const sl = slovaRetka(ctx, dijelovi), w = sl.reduce(function (z, s) { return z + s.w; }, 0);
    return (sirina - razmak * (sl.length - 1)) / w;
  }
  // redak oko središta cx (osnovna linija y); ako bi bio širi od `najvise`, sabije se.
  // `podebljaj` (px) doda obrub slovima: točkice malo zarastu u tisak, pa se
  // tanka slova podebljaju da se u točkicama čitaju kao na originalu
  function redak(ctx, dijelovi, cx, y, sabij, razmak, najvise, podebljaj) {
    const sl = slovaRetka(ctx, dijelovi), w = sl.reduce(function (z, s) { return z + s.w; }, 0);
    let uk = w * sabij + razmak * (sl.length - 1);
    if (najvise && uk > najvise) { sabij *= najvise / uk; razmak *= najvise / uk; uk = najvise; }
    let x = cx - uk / 2;
    sl.forEach(function (s) {
      ctx.save(); ctx.translate(x, y); ctx.scale(sabij, 1); ctx.font = s.font; ctx.fillText(s.c, 0, 0);
      if (podebljaj) { ctx.lineWidth = podebljaj; ctx.lineJoin = 'round'; ctx.strokeText(s.c, 0, 0); }
      ctx.restore();
      x += s.w * sabij + razmak;
    });
  }

  // Grb: životinja s čepa (sprijeda) iznad posude s lisnatim viticama.
  // Crta se u okviru 100 × 120 (x = 50 je sredina), mjerilo s.
  function grb(ctx, vrsta, cx, y0, s) {
    ctx.save();
    ctx.translate(cx - 50 * s, y0); ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function obje(f) { f(1); f(-1); }
    const X = function (k, dx) { return 50 + k * dx; };
    function lik(T) { ctx.beginPath(); ctx.moveTo(T[0], T[1]); for (let i = 2; i < T.length; i += 2) ctx.lineTo(T[i], T[i + 1]); ctx.closePath(); ctx.fill(); }
    function bijelo(f) { ctx.save(); ctx.fillStyle = '#fff'; f(); ctx.restore(); }
    // kao na grbu The Baroness: dva velika lista (pera) od dna prema gore i
    // van s uvojkom na vrhu i bijelom žilom, sa strane po rozeta od tri
    // cvijeta, dolje vitica, a u sredini uski stup na kojem je glava
    obje(function (k) {
      ctx.beginPath(); ctx.moveTo(X(k, 4), 104);
      ctx.bezierCurveTo(X(k, 24), 96, X(k, 38), 72, X(k, 33), 44);
      ctx.bezierCurveTo(X(k, 32), 38, X(k, 25), 37, X(k, 22), 43);
      ctx.bezierCurveTo(X(k, 22), 62, X(k, 12), 82, X(k, 2), 92);
      ctx.closePath(); ctx.fill();
      ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.arc(X(k, 35), 42, 3.4, 0, Math.PI * 2); ctx.stroke();
      ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(X(k, 8), 96); ctx.bezierCurveTo(X(k, 20), 86, X(k, 29), 68, X(k, 28), 47); ctx.stroke();
      ctx.restore();
      [[40, 66, 5.6], [47, 75, 5.2], [39, 79, 5.2], [34, 90, 4.6]].forEach(function (c) { ctx.beginPath(); ctx.arc(X(k, c[0]), c[1], c[2], 0, Math.PI * 2); ctx.fill(); });
      ctx.save(); ctx.fillStyle = '#fff';
      [[40, 66], [47, 75], [39, 79], [34, 90]].forEach(function (c) { ctx.beginPath(); ctx.arc(X(k, c[0]), c[1], 1.5, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
      ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(X(k, 1), 104); ctx.bezierCurveTo(X(k, 9), 114, X(k, 22), 114, X(k, 24), 108);
      ctx.bezierCurveTo(X(k, 25), 103, X(k, 19), 102, X(k, 18), 107); ctx.stroke();
    });
    lik([45.5, 52, 54.5, 52, 53.5, 86, 50, 104, 46.5, 86]);
    // glava životinje (sprijeda) na vrhu stupa
    ctx.translate(50, 42); ctx.scale(1.05, 1.05); ctx.translate(-50, -54);
    ctx.lineWidth = 3.4;
    if (vrsta === 'pantera') {
      obje(function (k) { ctx.beginPath(); ctx.arc(X(k, 12), 34, 5.5, 0, Math.PI * 2); ctx.fill(); });
      ctx.beginPath(); ctx.ellipse(50, 50, 14, 15, 0, 0, Math.PI * 2); ctx.fill();
      bijelo(function () {
        obje(function (k) { ctx.beginPath(); ctx.ellipse(X(k, 6), 46, 3.2, 1.5, k * 0.25, 0, Math.PI * 2); ctx.fill(); });
        lik([46.5, 55, 53.5, 55, 50, 59]);
      });
    } else if (vrsta === 'bik') {
      obje(function (k) {
        lik([X(k, 9), 37, X(k, 22), 38, X(k, 33), 31, X(k, 37), 18, X(k, 35), 27, X(k, 26), 40, X(k, 9), 44]);   // rog
        ctx.beginPath(); ctx.ellipse(X(k, 17), 46, 6, 2.6, k * 0.35, 0, Math.PI * 2); ctx.fill();                  // uho
      });
      lik([37, 38, 63, 38, 60, 60, 55, 67, 45, 67, 40, 60]);
      bijelo(function () { obje(function (k) { ctx.beginPath(); ctx.ellipse(X(k, 6), 47, 2.6, 1.4, 0, 0, Math.PI * 2); ctx.fill(); }); });
    } else if (vrsta === 'jelen') {
      obje(function (k) {
        ctx.beginPath(); ctx.moveTo(X(k, 5), 36); ctx.quadraticCurveTo(X(k, 15), 22, X(k, 20), 2); ctx.stroke();   // grana
        ctx.beginPath(); ctx.moveTo(X(k, 11), 24); ctx.lineTo(X(k, 22), 20); ctx.stroke();                           // parošci
        ctx.beginPath(); ctx.moveTo(X(k, 15), 13); ctx.lineTo(X(k, 25), 9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X(k, 7), 30); ctx.lineTo(X(k, 2), 22); ctx.stroke();
        lik([X(k, 6), 40, X(k, 19), 34, X(k, 14), 43]);                                                                // uho
      });
      lik([42, 36, 58, 36, 56, 58, 52, 67, 48, 67, 44, 58]);
    } else if (vrsta === 'lisica') {
      obje(function (k) { lik([X(k, 5), 36, X(k, 15), 15, X(k, 17), 40]); });                                          // uši
      lik([33, 37, 67, 37, 63, 48, 53, 67, 47, 67, 37, 48]);
      bijelo(function () { obje(function (k) { ctx.beginPath(); ctx.ellipse(X(k, 7), 46, 3, 1.2, -k * 0.35, 0, Math.PI * 2); ctx.fill(); }); });
    } else {                                                                                                            // gazela
      obje(function (k) {
        ctx.beginPath(); ctx.moveTo(X(k, 4), 36);
        ctx.bezierCurveTo(X(k, 12), 26, X(k, 4), 18, X(k, 11), 10); ctx.bezierCurveTo(X(k, 16), 4, X(k, 12), 0, X(k, 14), -4);
        ctx.stroke();                                                                                                   // valoviti rog
        lik([X(k, 6), 41, X(k, 20), 35, X(k, 14), 45]);                                                                 // uho
      });
      lik([43, 37, 57, 37, 55, 58, 51.5, 67, 48.5, 67, 45, 58]);
    }
    ctx.restore();
  }

  // Cijela etiketa u ctx (1 jedinica = 1 px fotografije, ishodište gore lijevo)
  function crtajEtiketu(ctx, g) {
    const W = 2 * ETIKETA.x, H = ETIKETA.y1 - ETIKETA.y0, o = ETIKETA.okvir, cx = W / 2;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ctx.strokeStyle = '#000';
    ctx.fillRect(0, 0, W, o); ctx.fillRect(0, H - o, W, o); ctx.fillRect(0, 0, o, H); ctx.fillRect(W - o, 0, o, H);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // PORTRAITS: velika slova 8,5 px, redak širok 67 px
    const portraits = [{ t: 'PORTRAITS', tezina: 700, obitelj: SERIF, visina: 8.5 }];
    redak(ctx, portraits, cx, 24.4, sabijanje(ctx, portraits, 1.2, 67), 1.2, 0, 0.45);
    // PENHALIGON'S: veće P, ostala slova 7 px, sjena 0,8 px dolje desno, redak širok 77 px
    const penh = [{ t: 'P', tezina: 700, obitelj: SERIF, visina: 9.8 }, { t: 'ENHALIGON’S', tezina: 700, obitelj: SERIF, visina: 7.2 }];
    const sp = sabijanje(ctx, penh, 0.35, 76);
    for (let k = 4; k >= 0; k--) redak(ctx, penh, cx - 0.4 + k * 0.2, 37.7 + k * 0.17, sp, 0.35);
    // tanka crta s uvojcima
    const yc = 41.5, xl = 10.6, xr = W - 10.6;
    ctx.lineWidth = 0.75; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(xl, yc); ctx.lineTo(xr, yc); ctx.stroke();
    [[xl, 1], [xr, -1]].forEach(function (u) {
      const x = u[0], k = u[1];
      ctx.beginPath(); ctx.moveTo(x, yc);
      ctx.bezierCurveTo(x - k * 2.2, yc + 0.2, x - k * 2.9, yc - 1.9, x - k * 1.6, yc - 2.3);
      ctx.bezierCurveTo(x - k * 0.6, yc - 2.5, x - k * 0.2, yc - 1.3, x - k * 1.2, yc - 1.1);
      ctx.stroke();
    });
    // grb (28 px visok, od 120,5 px)
    grb(ctx, g.grb || 'jelen', cx, 120.5, 0.235);
    // podnaslov i ime: usko groteskno pismo; sabijanje kao na izvorniku
    // (THE MANOEUVRES OF je širok 55,5 px, THE BARONESS 66 px)
    const pod = function (t) { return [{ t: t, tezina: 600, obitelj: SANS, visina: 5.2 }]; };
    const ime = function (t) { return [{ t: t, tezina: 500, obitelj: SANS, visina: 11.8 }]; };
    const najvise = W - 2 * o - 5;
    if (g.podnaslov) redak(ctx, pod(g.podnaslov.toUpperCase()), cx, 156.3, sabijanje(ctx, pod('THE MANOEUVRES OF'), 1.0, 55.5), 1.0, najvise, 0.25);
    redak(ctx, ime((g.ime || '').toUpperCase()), cx, 170.6, sabijanje(ctx, ime('THE BARONESS'), 0.9, 66), 0.9, najvise, 0.55);
  }
  PEN.crtajEtiketu = crtajEtiketu;

  // ── Etiketa kao maska (bijelo = papir = točkice, crno = tisak = praznina)
  const GUSTOCA_MASKE = 6;                   // pikseli platna po pikselu fotografije
  function maskaEtikete(g) {
    const M = GUSTOCA_MASKE, W = 2 * ETIKETA.x * M, H = (ETIKETA.y1 - ETIKETA.y0) * M;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.scale(M, M);
    crtajEtiketu(ctx, g);
    const d = ctx.getImageData(0, 0, W, H).data;
    return function (u, v) {                 // u: 0 lijevo .. 1 desno, v: 0 vrh .. 1 dno
      const i = Math.floor(u * W), j = Math.floor(v * H);
      return i >= 0 && j >= 0 && i < W && j < H && d[(j * W + i) * 4] > 128;
    };
  }

  // ── Marching squares po vodoravnom rezu SDF-a: dužine [x1, z1, x2, z2, ...]
  const RUBOVI = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]],
    8: [[2, 3]], 9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[1, 2]], 12: [[3, 1]], 13: [[0, 1]], 14: [[3, 0]] };
  function rez(f, y, X0, X1, Z0, Z1, h) {
    const nx = Math.ceil((X1 - X0) / h), nz = Math.ceil((Z1 - Z0) / h);
    const v = new Float32Array((nx + 1) * (nz + 1));
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) v[i * (nz + 1) + j] = f(X0 + i * h, y, Z0 + j * h);
    const out = [];
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const a = v[i * (nz + 1) + j], b = v[(i + 1) * (nz + 1) + j], c = v[(i + 1) * (nz + 1) + j + 1], d = v[i * (nz + 1) + j + 1];
        const idx = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        const x0 = X0 + i * h, z0 = Z0 + j * h;
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
          const A = tocka(par[0]), B = tocka(par[1]);
          out.push(A[0], A[1], B[0], B[1]);
        });
      }
    }
    return out;
  }
  PEN.rez = rez;

  // n točaka jednoliko po ukupnoj (težinskoj) duljini linija
  function poLinijama(duljine, n) {
    let ukupno = 0;
    for (let i = 0; i < duljine.length; i++) ukupno += duljine[i];
    const korak = ukupno / n, linija = new Int32Array(n), udio = new Float32Array(n);
    let l = 0, pocetak = 0;
    for (let i = 0; i < n; i++) {
      const s = (i + 0.5) * korak;
      while (l < duljine.length - 1 && s >= pocetak + duljine[l]) { pocetak += duljine[l]; l++; }
      linija[i] = l;
      udio[i] = duljine[l] > 0 ? sat((s - pocetak) / duljine[l]) : 0;
    }
    return { linija: linija, udio: udio };
  }

  // ── Cijela bočica: n točaka { poz, nor, vrsta } u pikselima fotografije
  //    opcije: { omjer: 2.3 (gustoća na niti / razmak niti), gustocaGlave: 0.6
  //    (razmak rezova glave prema razmaku prstenova), h: 1.2 (mreža rezova, px) }
  PEN.bocica = function (id, n, opcije) {
    const g = PEN.glave[id];
    opcije = opcije || {};
    const OMJER = opcije.omjer || 2.3, GG = opcije.gustocaGlave || 0.6, H = opcije.h || 1.2;
    const O = OVRATNIK, ok = g.okvir;
    // gornji dio: ovratnik + glava (unija), da se vide samo vanjske plohe
    function gore(x, y, z) {
      const dv = S.valjak([x, y, z], [0, 0, 0], O.r, O.y0, O.y1, O.rub);
      return Math.min(dv, g.sdf(x, y, z));
    }
    // profil u odsječke
    const seg = [];
    let uk = 0;
    for (let i = 0; i < TIJELO.length - 1; i++) {
      const p = TIJELO[i], q = TIJELO[i + 1], dm = q[1] - p[1], dy = q[0] - p[0], d = Math.hypot(dm, dy);
      if (d < 1e-6) continue;
      seg.push({ p: p, q: q, d: d, od: uk, nr: dy / d, ny: -dm / d });
      uk += d;
    }
    const lab = maskaEtikete(g), E = ETIKETA;
    function linije(korak, grubo) {
      const L = [];
      const k = Math.max(8, Math.round(uk / korak)), kk = uk / k;
      for (let i = 0; i < k; i++) {
        const s = (i + 0.5) * kk;
        let j = 0;
        while (j < seg.length - 1 && s > seg[j].od + seg[j].d) j++;
        const sg = seg[j], t = sat((s - sg.od) / sg.d), r = lerp(sg.p[1], sg.q[1], t), y = lerp(sg.p[0], sg.q[0], t);
        // u visini etikete prsten se prekine sprijeda (ondje je etiketa)
        let f0 = 0;
        if (y >= E.y0 && y <= E.y1 && r > E.x) f0 = Math.asin(E.x / r);
        // ravno dno se gleda gotovo s ruba: rjeđe točkice, da ne bljesne kao svijetla ploča
        const tez = sg.ny < -0.9 ? DNO_TEZINA : 1;
        L.push({ prsten: true, r: r, y: y, f0: f0, nr: sg.nr, ny: sg.ny, duljina: r * (2 * Math.PI - 2 * f0), tezina: r * (2 * Math.PI - 2 * f0) * tez });
      }
      if (grubo) return L;
      // dno tekućine: jedna nit po rubu (unutarnji kut posude, 5,5 px od
      // vanjske plohe), kroz staklo se vidi kao blago zakrivljena granica
      // tekućine; cijela ploha bi gledana s ruba zasvijetlila kao ploča
      const rDna = polaSirineTijela(DNO_TEKUCINE) - STIJENKA;
      L.push({ prsten: true, tekucina: true, r: rDna, y: DNO_TEKUCINE, f0: 0, nr: 0.6, ny: 0.8, duljina: rDna * 2 * Math.PI, tezina: rDna * 2 * Math.PI * DNO_TEKUCINE_TEZINA });
      // ovratnik i glava: vodoravni rezovi
      for (let y = O.y0 + 0.5; y < ok.yMax; y += korak * GG) {
        const d = rez(gore, y, -ok.x, ok.x, -ok.z, ok.z, H);
        for (let q = 0; q < d.length; q += 4) {
          const len = Math.hypot(d[q + 2] - d[q], d[q + 3] - d[q + 1]);
          if (len > 1e-6) L.push({ a: [d[q], d[q + 1]], b: [d[q + 2], d[q + 3]], y: y, duljina: len, tezina: len });
        }
      }
      // etiketa: guste vodoravne niti po bijelim dijelovima (redak po pikselu
      // fotografije, na polovicama piksela, da tanke crte crteža uvijek pogode redak)
      const RED = opcije.redEtikete || 1.0, dx = 0.2;
      for (let y = E.y1 - RED / 2; y > E.y0; y -= RED) {
        const v = (E.y1 - y) / (E.y1 - E.y0);
        let od = null;
        for (let x = -E.x; x <= E.x + dx; x += dx) {
          const u = x <= E.x && lab((x + E.x) / (2 * E.x), v);
          if (u && od === null) od = x;
          else if (!u && od !== null) {
            if (x - od > 0.3) L.push({ etiketa: true, red: Math.round((E.y1 - y) / RED), a: od, b: x, y: y, duljina: x - od, tezina: (x - od) * (opcije.tezinaEtikete || 1.6) });
            od = null;
          }
        }
      }
      return L;
    }
    let korak = 8, L = linije(korak, true);
    // površina: tijelo (gruba procjena) + glava (rezovi s grubim korakom)
    let pov = L.reduce(function (z, l) { return z + l.duljina; }, 0) * korak;
    for (let y = O.y0 + 0.5; y < ok.yMax; y += 6) {
      const d = rez(gore, y, -ok.x, ok.x, -ok.z, ok.z, 3);
      for (let q = 0; q < d.length; q += 4) pov += Math.hypot(d[q + 2] - d[q], d[q + 3] - d[q + 1]) * 6;
    }
    korak = Math.sqrt(pov * OMJER / n);
    const sve = linije(korak), Le = [];
    L = [];
    sve.forEach(function (l) { (l.etiketa ? Le : L).push(l); });
    // etiketa dobiva točkice prema težini svojih niti, ali ih slaže pravilno:
    // svaki odsječak papira ima točkicu na oba kraja (rub tiska je oštar, a
    // retci su poravnati, pa nema moiréa), a između su jednako razmaknute
    const wE = Le.reduce(function (z, l) { return z + l.tezina; }, 0), wO = L.reduce(function (z, l) { return z + l.tezina; }, 0);
    let nE = Math.round(n * wE / (wE + wO));
    function brojNaEtiketi(s) { let b = 0; for (let i = 0; i < Le.length; i++) b += 1 + Math.floor(Le[i].duljina / s); return b; }
    let sLo = 0.01, sHi = 2 * E.x;
    if (brojNaEtiketi(sHi) > nE) nE = 0;          // premalo točkica za etiketu (samo kod vrlo malog n)
    for (let it = 0; it < 40 && nE; it++) { const s = (sLo + sHi) / 2; if (brojNaEtiketi(s) > nE) sLo = s; else sHi = s; }
    const naOdsjecku = new Int32Array(Le.length);
    if (nE) {
      const ost = [];
      for (let i = 0; i < Le.length; i++) { const q = Le[i].duljina / sHi; naOdsjecku[i] = 1 + Math.floor(q); ost.push([q - Math.floor(q), i]); }
      ost.sort(function (a, b) { return b[0] - a[0]; });
      for (let k = 0, visak = nE - brojNaEtiketi(sHi); k < visak; k++) naOdsjecku[ost[k % ost.length][1]]++;
    }
    const nO = n - nE;
    const r = poLinijama(L.map(function (l) { return l.tezina; }), nO);
    const poz = new Float32Array(n * 3), nor = new Float32Array(n * 3), vrsta = new Float32Array(n);
    const e = 0.4;
    let odsjecak = 0, uOdsjecku = 0;
    for (let i = 0; i < n; i++) {
      let l, ud;
      if (i < nO) { l = L[r.linija[i]]; ud = r.udio[i]; }
      else {
        while (uOdsjecku >= naOdsjecku[odsjecak]) { odsjecak++; uOdsjecku = 0; }
        const mE = naOdsjecku[odsjecak];
        l = Le[odsjecak]; ud = mE > 1 ? uOdsjecku / (mE - 1) : 0.5;
        // unutarnje točkice svakog retka pomaknute su za zlatni rez razmaka (kao
        // niti stakla), da se točkice susjednih redaka ne slože u stupce (moiré)
        if (uOdsjecku > 0 && uOdsjecku < mE - 1) ud += ((l.red * 0.618034) % 1 - 0.5) * 0.8 / (mE - 1);
        uOdsjecku++;
      }
      let x, y = l.y, z, nx, ny, nz, m;
      if (l.prsten) {
        // kut od prednje strane (0 = sprijeda), preskače se dio s etiketom
        const u = (ud + r.linija[i] * 0.618034) % 1;
        const f = l.f0 + u * (2 * Math.PI - 2 * l.f0);
        x = l.r * Math.sin(f); z = l.r * Math.cos(f);
        nx = Math.sin(f) * l.nr; ny = l.ny; nz = Math.cos(f) * l.nr;
        m = l.tekucina || y >= DNO_TEKUCINE ? STAKLO : PROZIRNO;
      } else if (l.etiketa) {
        x = lerp(l.a, l.b, ud);
        const R = polaSirineTijela(y), f = Math.asin(Math.max(-1, Math.min(1, x / R)));
        z = R * Math.cos(f) + 0.8;
        nx = Math.sin(f); ny = 0; nz = Math.cos(f);
        m = ETIKETA_V;
      } else {
        x = lerp(l.a[0], l.b[0], ud); z = lerp(l.a[1], l.b[1], ud);
        nx = gore(x + e, y, z) - gore(x - e, y, z); ny = gore(x, y + e, z) - gore(x, y - e, z); nz = gore(x, y, z + e) - gore(x, y, z - e);
        m = ZLATO;
      }
      const nl = Math.hypot(nx, ny, nz) || 1;
      poz[3 * i] = x; poz[3 * i + 1] = y; poz[3 * i + 2] = z;
      nor[3 * i] = nx / nl; nor[3 * i + 1] = ny / nl; nor[3 * i + 2] = nz / nl;
      vrsta[i] = m;
    }
    const broj = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) broj[vrsta[i]]++;
    return { poz: poz, nor: nor, vrsta: vrsta, korak: korak, linija: L.length, broj: broj };
  };
})();
