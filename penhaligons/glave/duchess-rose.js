// Penhaligon's Portraits — The Coveted Duchess Rose: zlatna glava lisice.
// Glava se modelira (gotovo) simetrično u lokalnom okviru (x = lijeva strana lisice, y gore,
// z naprijed, ishodište u središtu lubanje u visini očiju), pa se postavi u pozu izmjerenu
// s fotografije: njuška okrenuta udesno (gledatelju) 27°, spuštena 15°, glava nagnuta 0,5°.
// Sastav: lubanja plosnata odozgo, lice s njuškom i donja čeljust kao presjeci po profilima
// (loft), široki krzneni zalisci uz obraze (pramenovi sa šiljastim vrhovima), zatiljak,
// uši kao zakrivljene ljuske s udubinom i krznom u školjci, bademaste oči s jabučicom,
// obrve, nos s nosnicama i filtrumom, linija usana; vrat je stup iz ovratnika (svjetske
// koordinate) s pramenovima krzna na prsima.
PEN.glave['duchess-rose'] = (function () {
  'use strict';
  const D2R = Math.PI / 180;
  const sqrt = Math.sqrt, abs = Math.abs, min = Math.min, max = Math.max;
  function sat(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smin(a, b, k) { const h = sat(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); }
  function smax(a, b, k) { return -smin(-a, -b, k); }
  // elipsoid s pouzdanom unutrašnjošću (kao kod pantere)
  function el(x, y, z, cx, cy, cz, rx, ry, rz) {
    const a = (x - cx) / rx, b = (y - cy) / ry, c = (z - cz) / rz;
    const k0 = sqrt(a * a + b * b + c * c), k1 = sqrt(a * a / (rx * rx) + b * b / (ry * ry) + c * c / (rz * rz));
    const rm = min(rx, ry, rz);
    if (k1 === 0) return -rm;
    const d = k0 * (k0 - 1) / k1;
    return k0 < 1 ? min(d, (k0 - 1) * rm) : d;
  }
  function kap(x, y, z, ax, ay, az, bx, by, bz, r) {
    const px = x - ax, py = y - ay, pz = z - az, ex = bx - ax, ey = by - ay, ez = bz - az;
    const h = sat((px * ex + py * ey + pz * ez) / (ex * ex + ey * ey + ez * ez));
    const dx = px - ex * h, dy = py - ey * h, dz = pz - ez * h;
    return sqrt(dx * dx + dy * dy + dz * dz) - r;
  }

  // ── poza (izmjerena s fotografije)
  const YAW = 27 * D2R, PITCH = 15 * D2R, ROLL = 0.5 * D2R, SC = 1;
  const PIV = [8.3, 449.8, -6];
  const cy = Math.cos(YAW), sy = Math.sin(YAW), cp = Math.cos(PITCH), sp = Math.sin(PITCH), cr = Math.cos(ROLL), sr = Math.sin(ROLL);
  function mul(A, B) { const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j]; return C; }
  const R = mul(mul([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], [[1, 0, 0], [0, cp, -sp], [0, sp, cp]]), [[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]]);
  const T00 = R[0][0], T01 = R[1][0], T02 = R[2][0], T10 = R[0][1], T11 = R[1][1], T12 = R[2][1], T20 = R[0][2], T21 = R[1][2], T22 = R[2][2];

  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  // ── uši: šiljasti luk (dvije kružnice kroz vrh i kutove baze; vanjski rub
  //    izbočeniji) kao zakrivljena ljuska, sprijeda udubljena. s = -1 desno uho lisice
  //    (bliže gledatelju, lijevo na slici), s = +1 lijevo uho (dalje)
  function napraviUho(s, baza, vrh, pol, van, izb) {
    const A = norm([vrh[0] - baza[0], vrh[1] - baza[1], vrh[2] - baza[2]]);
    const h = Math.hypot(vrh[0] - baza[0], vrh[1] - baza[1], vrh[2] - baza[2]);
    let N = [s * Math.sin(van), 0, Math.cos(van)];
    const k = dot(N, A); N = norm([N[0] - k * A[0], N[1] - k * A[1], N[2] - k * A[2]]);
    let U = cross(A, N); if (U[0] * s < 0) U = [-U[0], -U[1], -U[2]];
    // kružnice: vanjska (u > 0) sa središtem (-co, vo), unutarnja (u < 0) sa središtem (ci, 0)
    const vo = izb, co = (h * h - 2 * h * vo - pol * pol) / (2 * pol), Ro = Math.hypot(pol + co, vo);
    const ci = (h * h - pol * pol) / (2 * pol), Ri = ci + pol;
    return { s: s, b: baza, A: A, N: N, U: U, h: h, co: co, vo: vo, Ro: Ro, ci: ci, Ri: Ri,
      c: [(baza[0] + vrh[0]) / 2, (baza[1] + vrh[1]) / 2, (baza[2] + vrh[2]) / 2], rb: h / 2 + pol + 6 };
  }
  //  (par ušiju je 2 px pomaknut prema lijevoj strani lisice, dalje uho 4 px više — kao na fotografiji)
  const UL = napraviUho(-1, [-33.75, 31.5, -15], [-45.75, 69.5, -19], 16.75, 0, 6);
  const UD = napraviUho(1, [37.75, 35.5, -15], [49.75, 73.5, -19], 16.75, 0, 6);
  function uho(x, y, z, E) {
    const rx = x - E.b[0], ry = y - E.b[1], rz = z - E.b[2];
    const u = rx * E.U[0] + ry * E.U[1] + rz * E.U[2];
    const v = rx * E.A[0] + ry * E.A[1] + rz * E.A[2];
    const w = rx * E.N[0] + ry * E.N[1] + rz * E.N[2];
    // obris luka
    const a = max(u > 0 ? Math.hypot(u + E.co, v - E.vo) - E.Ro : Math.hypot(u - E.ci, v) - E.Ri, -v - 16);
    const t = 1 - sat(v / E.h);
    const th = 1.8 + 5.2 * t;                        // pola debljine ljuske
    const wc = w - 0.022 * u * u + 3;              // ljuska zakrivljena (rubovi naprijed)
    let d = smax(a, abs(wc) - th, 2.0);
    // udubina sprijeda (dno prati stražnju plohu, rub ostaje debeo)
    const ai = a + 3.4;
    if (ai < 2) {
      const dub = min(2 * th - 2.4, -ai * 0.9);
      d = smax(d, -max(ai, th - dub - wc), 1.3);
      // krzno u školjci: pramenovi od dna uha prema vrhu, lagano prema van
      if (ai < -1 && v > -2 && v < E.h * 0.62) {
        const vv = sat(v / (E.h * 0.62));
        let r = 0;
        for (let i = -1; i <= 1; i++) {
          const uc = i * 5.2 + 0.18 * v, tt = abs(u - uc) / (2.2 * (1 - 0.6 * vv));
          if (tt < 1) r = max(r, (1 - tt * tt) * (1 - tt * tt));
        }
        d -= 1.3 * r * (1 - vv * vv) * sat(v / 4 + 0.5) * sat(-ai - 1);
      }
    }
    return d;
  }

  // ── oko: bademasta udubina (lokalno, x > 0)
  const OKO = (function () {
    const yaw = 38 * D2R, gore = 6 * D2R, nag = 22 * D2R;
    const w = [Math.sin(yaw) * Math.cos(gore), Math.sin(gore), Math.cos(yaw) * Math.cos(gore)];
    const u0 = [Math.cos(yaw), 0, -Math.sin(yaw)];
    let v0 = [w[1] * u0[2] - w[2] * u0[1], w[2] * u0[0] - w[0] * u0[2], w[0] * u0[1] - w[1] * u0[0]];
    const vl = Math.hypot(v0[0], v0[1], v0[2]); v0 = v0.map(function (t) { return t / vl; });
    const c = Math.cos(nag), s = Math.sin(nag);
    return { c: [23.5, 1.5, 29.5], w: w,
      u: [c * u0[0] + s * v0[0], c * u0[1] + s * v0[1], c * u0[2] + s * v0[2]],
      v: [-s * u0[0] + c * v0[0], -s * u0[1] + c * v0[1], -s * u0[2] + c * v0[2]] };
  })();

  // ── profili (Catmull-Rom po stupcu k tablice P, prvi stupac je parametar)
  function crP(P, t0, k) {
    let i = 0;
    while (i < P.length - 2 && t0 > P[i + 1][0]) i++;
    const P1 = P[i], P2 = P[i + 1], P0 = P[max(0, i - 1)], P3 = P[min(P.length - 1, i + 2)];
    const t = sat((t0 - P1[0]) / (P2[0] - P1[0])), h = P2[0] - P1[0];
    const m1 = (P2[k] - P0[k]) / (P2[0] - P0[0] || 1) * h, m2 = (P3[k] - P1[k]) / (P3[0] - P1[0] || 1) * h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * P1[k] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * P2[k] + (t3 - t2) * m2;
  }
  // presjek: elipsa (pola širine w, vrh yt, dno yb) koja se prema vrhu sužava (faktor su)
  function loft(x, y, z, P, z0, z1, su) {
    const zc = min(max(z, z0), z1);
    const w = crP(P, zc, 1), yt = crP(P, zc, 2), yb = crP(P, zc, 3);
    const hy = (yt - yb) / 2, yc = (yt + yb) / 2, t = sat((y - yb) / (yt - yb));
    const wy = w * (1 - su * t * t);
    const ex = x / wy, ey = (y - yc) / hy, e = sqrt(ex * ex + ey * ey);
    const dr = (e - 1) * min(wy, hy), dz = max(z0 - z, z - z1);
    return min(max(dr, dz), 0) + Math.hypot(max(dr, 0), max(dz, 0));
  }
  // lice s njuškom (gornja čeljust): [z, pola širine, vrh, dno]
  const LICE = [[0, 38, 30, -38], [14, 36, 27, -39], [30, 31, 19, -39], [44, 24, 9, -38], [60, 16.5, 1, -34],
    [74, 11.5, -4, -29], [84, 8.5, -7, -24], [89, 4, -9, -19]];
  // donja čeljust: [z, pola širine, vrh, dno]
  const CELJ = [[6, 22, -24, -52], [24, 18.5, -28, -53], [44, 13.5, -31, -51], [60, 9.5, -31, -46], [70, 6.5, -29, -40], [75, 3, -29, -35]];
  // zalisci uz obraze (simetrični, računaju se po |x|)
  //  (izduženi elipsoid: ravni dio visine 2L između zaobljenih krajeva, vrh nagnut prema unutra)
  //  r = [pola širine, polumjer donjeg kraja, dubina, polumjer gornjeg kraja]
  //  nag = vrh prema unutra, tau = vrh prema natrag (krzno se slijeva od kuta usta prema uhu i vratu)
  function zalizak(c, r, L, nag, tau) { return { c: c, r: r, L: L, k: Math.cos(nag * D2R), s: Math.sin(nag * D2R), kt: Math.cos(tau * D2R), st: Math.sin(tau * D2R) }; }
  const RUF = zalizak([45, -38, 6], [22.5, 8, 24, 30], 19, 2, 20);
  //  pramenovi na donjem kraju: [sredina naprijed, pola širine, duljina vrha]; brazde između njih: [položaj, dubina]
  const PRAM = [[-15, 7, 7], [-2, 7, 9], [11, 7, 6]];
  const BRAZ = [[-8.5, 1.4], [4.5, 1.6], [17, 1.3]];
  // koordinate u okviru zalisca: [poprijeko van, uz zalizak, naprijed]
  function ufZal(ax, y, z, R) {
    const dx = ax - R.c[0], dy = y - R.c[1], dz = z - R.c[2];
    const rx = R.k * dx + R.s * dy, ya = -R.s * dx + R.k * dy;
    return [rx, R.kt * ya - R.st * dz, R.st * ya + R.kt * dz];
  }
  function oblik(x, y, z) {
    const ax = abs(x);
    // lubanja (široka, plosnata odozgo)
    let d = el(x, y, z, -2, 12, -9, 48, 33, 37);
    d = smax(d, y - 46 + 0.004 * (x + 2) * (x + 2), 8);
    // krzneni zalisci: visoki režnjevi uz obraze, vrhom malo prema unutra
    {
      const f = ufZal(ax, y, z, RUF);
      // donji kraj: pramenovi sa šiljastim vrhovima
      let T = 0;
      for (let i = 0; i < PRAM.length; i++) {
        const u = (f[2] - PRAM[i][0]) / PRAM[i][1];
        if (u > -1 && u < 1) T = max(T, PRAM[i][2] * (1 - u * u) * (1 - u * u));
      }
      const ry = f[1] > 0 ? max(f[1] - RUF.L, 0) : min(f[1] + RUF.L - 6 + T, 0);
      // gornji i prednji dio zalisca se široko stapaju s glavom ispod uha i s obrazom (bez "kapuljače")
      d = smin(d, el(f[0], ry, f[2], 0, 0, 0, RUF.r[0], ry > 0 ? RUF.r[3] : RUF.r[1], RUF.r[2]), 14 + 12 * sat((f[1] + 4) / 26) + 8 * sat((f[2] - 6) / 14) * sat((22 - f[1]) / 12));
    }
    // zatiljak: krzno između zalizaka straga
    d = smin(d, el(x, y, z, 0, -20, -22, 50, 36, 25), 16);
    // lice i njuška
    if (z > -10) d = smin(d, loft(x, y, z, LICE, 0, 89, 0.3), 10);
    // jastučići brkova iznad usne
    d = smin(d, el(ax, y, z, 6.5, -21.5, 76, 6.5, 5, 7.5), 4);
    // nos
    d = smin(d, el(x, y, z, 0, -12.3, 84.3, 8.6, 6.2, 6.2), 2.5);
    // donja čeljust
    if (z > -6 && y < -14) d = smin(d, loft(x, y, z, CELJ, 6, 75, 0.1), 6);
    return d;
  }

  // udaljenost u ravnini do izlomljene crte P (parovi [a, b])
  function dCrta(a, b, P) {
    let m = Infinity;
    for (let i = 0; i < P.length - 1; i++) {
      const ax = P[i][0], ay = P[i][1], bx = P[i + 1][0] - ax, by = P[i + 1][1] - ay;
      const h = sat(((a - ax) * bx + (b - ay) * by) / (bx * bx + by * by));
      const dx = a - ax - bx * h, dy = b - ay - by * h, dd = dx * dx + dy * dy;
      if (dd < m) m = dd;
    }
    return sqrt(m);
  }
  // obrva: (|x|, y) od unutarnjeg kuta oka koso gore i van
  const OBRVA = [[8, 9], [17, 13.5], [29, 13], [38, 7]];
  // linija usana (z, y): od nosa natrag do kuta usta
  const USNA_Z = [[32, -37.5], [44, -36.5], [60, -32.5], [76, -26.5], [86, -21.5]];

  function glava(x, y, z) {
    const ax = abs(x);
    let d = oblik(x, y, z);
    // uši
    for (const E of [UL, UD]) {
      const ob = Math.hypot(x - E.c[0], y - E.c[1], z - E.c[2]) - E.rb;
      if (ob < d + 7) d = smin(d, uho(x, y, z, E), 5);
    }
    if (d > 6) return d;
    // obrve: meki greben iznad oka
    if (ax < 44 && y > 0 && y < 24 && z > 12) {
      const t = dCrta(ax, y, OBRVA) / 6;
      if (t < 1) d -= 2.2 * (1 - t * t) * (1 - t * t) * sat((z - 12) / 12);
    }
    // plitka brazda po sredini čela
    if (ax < 6 && y > 6 && y < 42 && z > 0) {
      const t = ax / 6, k = sat((y - 6) / 6) * sat((42 - y) / 10) * sat(z / 10);
      d += 1.1 * k * (1 - t * t) * (1 - t * t);
    }
    // oči: bademasta udubina (vanjski kut viši), jabučica i rub kapaka
    if (ax > 6 && ax < 44 && y > -12 && y < 18 && z > 12) {
      const ex = ax - OKO.c[0], ey = y - OKO.c[1], ez = z - OKO.c[2];
      const u = OKO.u[0] * ex + OKO.u[1] * ey + OKO.u[2] * ez;
      const v = OKO.v[0] * ex + OKO.v[1] * ey + OKO.v[2] * ez;
      const w = OKO.w[0] * ex + OKO.w[1] * ey + OKO.w[2] * ez;
      // badem (dvije kružnice), unutarnji kut produžen prema dolje-naprijed (suzni kut)
      let bad = max(Math.hypot(u, v - 14.3) - 18, Math.hypot(u, v + 14.3) - 18);
      const ui = min(u + 9, 0);
      bad = smin(bad, Math.hypot(max(-ui - 3.5, 0), v - 0.5 * ui) - 1.1, 1.8);
      bad = max(bad, -(w + 7)) - 0.5 * w;
      if (bad < 4) {
        const d0 = d;
        const sjena = 1.6 * sat((v + 1) / 3.5);
        const dno = d0 + min(3.0 + sjena + 1.4 * (u / 11) * (u / 11), 6);
        d = smax(d0, -max(bad, -dno), 0.55);
        const jb = d0 + 1.2 + 2.6 * ((u + 1) / 10) * ((u + 1) / 10) + 2.6 * ((v + 0.6) / 4) * ((v + 0.6) / 4);
        d = smin(d, max(jb, bad + 0.25), 1.0);
      }
    }
    // usta: brazda duž linije usana (dublja prema kutu), gornja usna malo prelazi donju
    if (ax < 30 && y < -14 && y > -44 && z > 26 && z < 92) {
      const d0 = d;
      const yl = crP(USNA_Z, min(max(z, 32), 86), 1);
      const g = abs(y - yl) - 1.0;
      if (g < 3) {
        const k = sat((z - 30) / 6) * sat((ax - 1.5) / 2.5 + 0.35);
        d = smax(d, -max(g, -(d0 + (1.1 + 1.3 * sat((70 - z) / 30)) * k)), 1.2);
      }
    }
    // nos: filtrum, nosnice
    if (ax < 12 && z > 74 && y > -24 && y < -4) {
      const d0 = d;
      d = smax(d, -max(el(ax, y, z, 3.8, -13.6, 89.6, 2.3, 1.5, 2.4), -(d0 + 1.6)), 0.5);
      d = smax(d, -max(kap(x, y, z, 0, -15.5, 89.5, 0, -21, 87, 0.9), -(d0 + 1.0)), 0.7);
    }
    // krzno na zaliscima: brazde između pramenova, dublje prema dnu, lagano valovite
    if (ax > 28 && y < 24 && y > -80) {
      const f = ufZal(ax, y, z, RUF);
      if (f[0] > -8 && f[1] < 26) {
        let g = 0;
        for (let i = 0; i < BRAZ.length; i++) {
          const zc = BRAZ[i][0] + 2.2 * Math.sin(f[1] / 16 + i), t = abs(f[2] - zc) / 2.6;
          if (t < 1) g = max(g, BRAZ[i][1] * (1 - t * t) * (1 - t * t));
        }
        d += g * sat((f[0] + 8) / 10) * sat((22 - f[1]) / 22);
      }
    }
    return d;
  }

  // ── vrat: profil po visini [y, z sprijeda, z straga, pola širine, središte x]
  const VRAT = [[325, 57, -57, 57, 1.5], [350, 55, -56, 55.5, 0.5], [370, 46, -54, 54, 2], [390, 24, -50, 52, 3],
    [410, 12, -46, 48, 3], [440, 0, -40, 40, 0], [460, -10, -32, 25, -3]];
  function crVrat(y, k) { return crP(VRAT, y, k); }
  function vrat(x, y, z) {
    const zf = crVrat(y, 1), zb = crVrat(y, 2), rx = crVrat(y, 3), cx = crVrat(y, 4);
    const rz = (zf - zb) / 2, cz = (zf + zb) / 2;
    const ex = (x - cx) / rx, ez = (z - cz) / rz, e = sqrt(ex * ex + ez * ez);
    const dr = (e - 1) * min(rx, rz);
    const dy = max(325 - y, y - 455);
    return min(max(dr, dy), 0) + Math.hypot(max(dr, 0), max(dy, 0));
  }

  // krzno na prsima: pramenovi ispod brade teku prema dolje i lagano se razilaze od sredine
  const PRSA = [-62, -38, -14, 10, 34, 58].map(function (a) { return a * D2R; });
  const SMJER = YAW;                                   // sredina prsa gleda kamo i njuška
  function krznoVrata(x, y, z) {
    const zf = crVrat(y, 1), zb = crVrat(y, 2), cx = crVrat(y, 4), cz = (zf + zb) / 2;
    const fi = Math.atan2(x - cx, z - cz) - SMJER;
    if (fi < -1.45 || fi > 1.45) return 0;
    const r = Math.hypot(x - cx, z - cz), sp = (396 - y) / 50;
    let g = 0;
    for (let i = 0; i < PRSA.length; i++) {
      const a0 = PRSA[i], ai = a0 + (a0 > 0 ? 1 : -1) * 0.16 * sp * sp + 0.05 * Math.sin(y / 9 + i * 1.7);
      const t = abs(fi - ai) * r / 2.6;
      if (t < 1) g = max(g, (1 - t * t) * (1 - t * t));
    }
    return 1.3 * g * sat((396 - y) / 10) * sat((y - 344) / 14);
  }

  // granica glave bez ušiju (lokalno): [-76, 76] × [-90, 50] × [-66, 94]
  function kutija(x, y, z) {
    const dx = abs(x) - 76, dy = abs(y + 20) - 70, dz = abs(z - 14) - 80;
    return min(max(dx, dy, dz), 0) + Math.hypot(max(dx, 0), max(dy, 0), max(dz, 0));
  }

  return {
    ime: 'Duchess Rose', podnaslov: 'The Coveted', grb: 'lisica',
    staklo: ['#5b2b2e', '#c07a70'],
    okvir: { x: 74, yMin: 330, yMax: 531, z: 74 },
    _glava: glava,
    sdf: function (x, y, z) {
      let dn = vrat(x, y, z);
      if (dn < -4) return dn;
      if (dn < 4 && y > 343 && y < 398) dn += krznoVrata(x, y, z);
      const px = (x - PIV[0]) / SC, py = (y - PIV[1]) / SC, pz = (z - PIV[2]) / SC;
      const qx = T00 * px + T01 * py + T02 * pz, qy = T10 * px + T11 * py + T12 * pz, qz = T20 * px + T21 * py + T22 * pz;
      // brzi izlaz: kutija oko glave (bez ušiju) i kugle oko ušiju, sve sigurno izvana
      let ob = kutija(qx, qy, qz);
      if (ob > 0) ob = min(ob, Math.hypot(qx - UL.c[0], qy - UL.c[1], qz - UL.c[2]) - UL.rb, Math.hypot(qx - UD.c[0], qy - UD.c[1], qz - UD.c[2]) - UD.rb);
      ob *= SC;
      if (ob > 5) {
        if (ob >= dn + 15) return dn;                       // daleko od glave: samo vrat
        if (dn > 5) return min(dn, ob) - 4;                 // daleko od svega
      }
      // jezgra lubanje (sigurno puna)
      const kj = sqrt(qx * qx / 1156 + (qy - 10) * (qy - 10) / 576 + (qz + 8) * (qz + 8) / 841);
      if (kj < 0.85) return min(dn, -(1 - kj) * 24 * SC);
      const dh = glava(qx, qy, qz) * SC;
      return smin(dn, dh, 14);
    }
  };
})();
