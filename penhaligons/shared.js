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
  //    fotografije (dno 1809 px; svih pet bočica ima isto tijelo)
  const TIJELO = [
    [0, 0], [0, 60], [2, 66], [5, 72], [9, 78], [13, 82], [18, 85.5], [24, 87.3], [29, 87.4], // zaobljeno dno s rubom
    [34, 85.5], [40, 84.0], [60, 84.4], [100, 85.4], [140, 86.4], [180, 87.4], [220, 88.4],   // tijelo se prema gore lagano širi
    [260, 89.5], [290, 90.4], [298, 90.2], [304, 89.4], [309, 87.6], [313, 85],                 // zaobljeno rame
    [317, 80], [320, 73], [321.5, 67], [322, 62]                                                 // ravni vrh ramena pod ovratnikom
  ];
  const DNO_TEKUCINE = 64;           // ispod je debelo prozirno staklo
  const OVRATNIK = { r: 65.5, y0: 321, y1: 341, rub: 2.5 };
  // etiketa: vanjski okvir ±46 × [78, 262], okvir debljine 5 px
  const ETIKETA = { x: 46, y0: 78, y1: 262, okvir: 5 };
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

  // ── Etiketa kao maska: crtež etikete (okvir, PORTRAITS, PENHALIGON'S,
  //    ukras, podnaslov, ime) u skrivenom platnu; bijelo = točkice
  function maskaEtikete(g) {
    const W = 92 * 4, H = 184 * 4;          // 4 piksela platna po pikselu fotografije
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    const o = ETIKETA.okvir * 4;
    ctx.fillRect(0, 0, W, o); ctx.fillRect(0, H - o, W, o); ctx.fillRect(0, 0, o, H); ctx.fillRect(W - o, 0, o, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    function tekst(t, y, px, tezina, obitelj, sirina) {
      ctx.font = tezina + ' ' + px * 4 + 'px ' + obitelj;
      const m = ctx.measureText(t).width;
      ctx.save();
      ctx.translate(W / 2, y * 4);
      if (sirina && m > sirina * 4) ctx.scale(sirina * 4 / m, 1);
      ctx.fillText(t, 0, 0);
      ctx.restore();
    }
    // y mjeren od vrha etikete (px fotografije)
    tekst('PORTRAITS', 20, 11, '400', '"Times New Roman", Georgia, serif', 70);
    tekst('PENHALIGON’S', 34, 12, '700', '"Times New Roman", Georgia, serif', 72);
    ctx.fillRect(10 * 4, 38 * 4, (92 - 20) * 4, 0.9 * 4);                 // tanka crta
    // ukras (stilizirani grb iznad podnaslova)
    ctx.save(); ctx.translate(W / 2, 137 * 4);
    ctx.beginPath(); ctx.ellipse(0, 0, 9 * 4, 4 * 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 5 * 4, 2 * 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.fillRect(-1 * 4, -7 * 4, 2 * 4, 4 * 4);
    ctx.restore();
    tekst((g.podnaslov || '').toUpperCase(), 150, 5.5, '400', 'Arial, sans-serif', 60);
    tekst((g.ime || '').toUpperCase(), 166, 13, '400', '"Arial Narrow", Arial, sans-serif', 70);
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
        L.push({ prsten: true, r: r, y: y, f0: f0, nr: sg.nr, ny: sg.ny, duljina: r * (2 * Math.PI - 2 * f0), tezina: r * (2 * Math.PI - 2 * f0) });
      }
      if (grubo) return L;
      // ovratnik i glava: vodoravni rezovi
      for (let y = O.y0 + 0.5; y < ok.yMax; y += korak * GG) {
        const d = rez(gore, y, -ok.x, ok.x, -ok.z, ok.z, H);
        for (let q = 0; q < d.length; q += 4) {
          const len = Math.hypot(d[q + 2] - d[q], d[q + 3] - d[q + 1]);
          if (len > 1e-6) L.push({ a: [d[q], d[q + 1]], b: [d[q + 2], d[q + 3]], y: y, duljina: len, tezina: len });
        }
      }
      // etiketa: guste vodoravne niti po bijelim dijelovima
      const RED = opcije.redEtikete || 1.3, dx = 0.25;
      for (let y = E.y1 - RED / 2; y > E.y0; y -= RED) {
        const v = (E.y1 - y) / (E.y1 - E.y0);
        let od = null;
        for (let x = -E.x; x <= E.x + dx; x += dx) {
          const u = x <= E.x && lab((x + E.x) / (2 * E.x), v);
          if (u && od === null) od = x;
          else if (!u && od !== null) {
            if (x - od > 0.3) L.push({ etiketa: true, a: od, b: x, y: y, duljina: x - od, tezina: (x - od) * (opcije.tezinaEtikete || 1.6) });
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
    L = linije(korak);
    const r = poLinijama(L.map(function (l) { return l.tezina; }), n);
    const poz = new Float32Array(n * 3), nor = new Float32Array(n * 3), vrsta = new Float32Array(n);
    const e = 0.4;
    for (let i = 0; i < n; i++) {
      const l = L[r.linija[i]];
      let x, y = l.y, z, nx, ny, nz, m;
      if (l.prsten) {
        // kut od prednje strane (0 = sprijeda), preskače se dio s etiketom
        const u = (r.udio[i] + r.linija[i] * 0.618034) % 1;
        const f = l.f0 + u * (2 * Math.PI - 2 * l.f0);
        x = l.r * Math.sin(f); z = l.r * Math.cos(f);
        nx = Math.sin(f) * l.nr; ny = l.ny; nz = Math.cos(f) * l.nr;
        m = y < DNO_TEKUCINE ? PROZIRNO : STAKLO;
      } else if (l.etiketa) {
        x = lerp(l.a, l.b, r.udio[i]);
        const R = polaSirineTijela(y), f = Math.asin(Math.max(-1, Math.min(1, x / R)));
        z = R * Math.cos(f) + 0.8;
        nx = Math.sin(f); ny = 0; nz = Math.cos(f);
        m = ETIKETA_V;
      } else {
        x = lerp(l.a[0], l.b[0], r.udio[i]); z = lerp(l.a[1], l.b[1], r.udio[i]);
        nx = gore(x + e, y, z) - gore(x - e, y, z); ny = gore(x, y + e, z) - gore(x, y - e, z); nz = gore(x, y, z + e) - gore(x, y, z - e);
        m = ZLATO;
      }
      const nl = Math.hypot(nx, ny, nz) || 1;
      poz[3 * i] = x; poz[3 * i + 1] = y; poz[3 * i + 2] = z;
      nor[3 * i] = nx / nl; nor[3 * i + 1] = ny / nl; nor[3 * i + 2] = nz / nl;
      vrsta[i] = m;
    }
    return { poz: poz, nor: nor, vrsta: vrsta, korak: korak, linija: L.length };
  };
})();
