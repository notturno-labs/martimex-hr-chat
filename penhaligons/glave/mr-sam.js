// Penhaligon's Portraits — The Blazing Mr Sam: zlatna glava bika
// Glava se modelira u lokalnom okviru (lice uspravno, gleda prema +z, x = lijeva strana bika,
// simetrično po |x|), pa se postavi u pozu: okrenuta udesno (gledatelju), lice malo zabačeno.
// Vrat je u svjetskim koordinatama: stup s ovratnika, iza glave, s grbom (morrillo) straga.
PEN.glave['mr-sam'] = (function () {
  'use strict';
  const S = PEN.sdf, D = Math.PI / 180;
  const sqrt = Math.sqrt, abs = Math.abs, min = Math.min, max = Math.max;
  function sat(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smin(a, b, k) { const h = sat(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); }
  function smax(a, b, k) { return -smin(-a, -b, k); }
  // brzi primitivi bez nizova
  function eli(x, y, z, cx, cy, cz, rx, ry, rz) {
    const a = (x - cx) / rx, b = (y - cy) / ry, c = (z - cz) / rz;
    const k0 = sqrt(a * a + b * b + c * c), k1 = sqrt(a * a / (rx * rx) + b * b / (ry * ry) + c * c / (rz * rz));
    return k1 > 0 ? k0 * (k0 - 1) / k1 : -min(rx, ry, rz);
  }
  function kap(x, y, z, ax, ay, az, bx, by, bz, r) {
    const px = x - ax, py = y - ay, pz = z - az, ex = bx - ax, ey = by - ay, ez = bz - az;
    const h = sat((px * ex + py * ey + pz * ez) / (ex * ex + ey * ey + ez * ez));
    const dx = px - ex * h, dy = py - ey * h, dz = pz - ez * h;
    return sqrt(dx * dx + dy * dy + dz * dz) - r;
  }
  function niz(x, y, z, T, R, k) { return S.niz([x, y, z], T, R, k); }
  function cr(p0, p1, p2, p3, t) {
    return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
  }
  // glatka cijev (rog, uho): Catmull-Rom kroz točke T s polumjerima R, n odsječaka po rasponu;
  // odsječci su zaobljeni stošci s unaprijed izračunatim konstantama
  function cijev(T, R, n) {
    const seg = [], m = T.length;
    let prev = null;
    for (let i = 0; i < m - 1; i++) {
      const p0 = T[max(0, i - 1)], p1 = T[i], p2 = T[i + 1], p3 = T[min(m - 1, i + 2)];
      const r0 = R[max(0, i - 1)], r1 = R[i], r2 = R[i + 1], r3 = R[min(m - 1, i + 2)];
      for (let k = (i === 0 ? 0 : 1); k <= n; k++) {
        const t = k / n, q = [cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t), cr(p0[2], p1[2], p2[2], p3[2], t), cr(r0, r1, r2, r3, t)];
        if (prev) {
          const bx = q[0] - prev[0], by = q[1] - prev[1], bz = q[2] - prev[2], l2 = bx * bx + by * by + bz * bz, rr = prev[3] - q[3];
          seg.push({ ax: prev[0], ay: prev[1], az: prev[2], bx: bx, by: by, bz: bz, l2: l2, rr: rr, a2: l2 - rr * rr, il2: 1 / l2, ra: prev[3], rb: q[3] });
        }
        prev = q;
      }
    }
    return seg;
  }
  function cijevD(x, y, z, seg) {
    let d = Infinity;
    for (let i = 0; i < seg.length; i++) {
      const g = seg[i], pax = x - g.ax, pay = y - g.ay, paz = z - g.az;
      const yv = pax * g.bx + pay * g.by + paz * g.bz, zz = yv - g.l2;
      const qx = pax * g.l2 - g.bx * yv, qy = pay * g.l2 - g.by * yv, qz = paz * g.l2 - g.bz * yv;
      const x2 = qx * qx + qy * qy + qz * qz, y2 = yv * yv * g.l2, z2 = zz * zz * g.l2;
      const k = Math.sign(g.rr) * g.rr * g.rr * x2;
      let di;
      if (Math.sign(zz) * g.a2 * z2 > k) di = sqrt(x2 + z2) * g.il2 - g.rb;
      else if (Math.sign(yv) * g.a2 * y2 < k) di = sqrt(x2 + y2) * g.il2 - g.ra;
      else di = (sqrt(x2 * g.a2 * g.il2) + yv * g.rr) * g.il2 - g.ra;
      if (di < d) d = di;
    }
    return d;
  }

  // ── poza glave
  const TH = 32 * D, AL = 14 * D, GA = 6 * D;     // okret udesno, zabačenost lica, nagib
  const CX = 28, CY = 420, CZ = 4;
  const cT = Math.cos(TH), sT = Math.sin(TH), cA = Math.cos(AL), sA = Math.sin(AL), cG = Math.cos(GA), sG = Math.sin(GA);

  // ── lubanja i lice: presjeci po visini (lokalno), zaobljeni trapezi
  //    [y, pola širine sprijeda, pola širine straga, z prednje plohe, z stražnje plohe, zaobljenje]
  const PROFIL = [
    [70, 34, 33, 12, -36, 13],
    [64, 41, 39, 16, -42, 13],
    [54, 46, 42, 20, -49, 14],
    [40, 48, 44, 22, -56, 14],
    [24, 47, 45, 22.5, -63, 13],
    [8, 45, 46.5, 23, -71, 13],
    [-6, 42.5, 47, 23.5, -77, 14],
    [-18, 39, 45, 23.5, -76, 15],
    [-32, 34.5, 40, 24, -64, 15],
    [-46, 27.5, 34, 25, -49, 14],
    [-60, 27.5, 29, 26, -33, 14],
    [-72, 27, 25, 26, -19, 13],
    [-84, 16, 18, 21, -6, 9]
  ];
  const PR = [0, 0, 0, 0, 0, 0];
  function presjek(y) {        // glatko (Catmull-Rom) između presjeka
    const P = PROFIL, n = P.length;
    let i = 0;
    if (y <= P[n - 1][0]) i = n - 2; else while (i < n - 2 && y < P[i + 1][0]) i++;
    const t = sat((y - P[i][0]) / (P[i + 1][0] - P[i][0]));
    const A = P[Math.max(0, i - 1)], B = P[i], C = P[i + 1], E = P[Math.min(n - 1, i + 2)];
    for (let k = 1; k < 6; k++) PR[k] = cr(A[k], B[k], C[k], E[k], t);
    return PR;
  }
  function duz(px, pz, ax, az, bx, bz) {
    const ex = bx - ax, ez = bz - az, wx = px - ax, wz = pz - az;
    const h = sat((wx * ex + wz * ez) / (ex * ex + ez * ez));
    const dx = wx - ex * h, dz = wz - ez * h;
    return sqrt(dx * dx + dz * dz);
  }
  function trapez(ax, z, af, ab, zf, zb, r) {
    af -= r; ab -= r; zf -= r; zb += r;
    const d = min(duz(ax, z, 0, zf, af, zf), duz(ax, z, af, zf, ab, zb), duz(ax, z, ab, zb, 0, zb));
    const unutra = z < zf && z > zb && (ax - af) * (zb - zf) - (z - zf) * (ab - af) > 0;
    return (unutra ? -d : d) - r;
  }
  function blok(ax, y, z) {
    const P = PROFIL, Q = presjek(y);
    const d2 = trapez(ax, z, Q[1], Q[2], Q[3], Q[4], Q[5]);
    return smax(smax(d2, y - P[0][0], 16), P[P.length - 1][0] - y, 4);
  }
  // žlijeb V-presjeka uz površinu: s = udaljenost od osi žlijeba, w = pola širine, dub = dubina; c <= 0 gdje smije biti
  function urez(d, s, w, dub, c) { return smax(d, -max(s - w * (1 + d / dub), c), 0.6); }

  // ── oko (lijevo/desno isto, ax = |x|): koštani rub duplje i obrva, ispupčeni kapci u obliku badema,
  //    rub kapaka kao tanki žlijeb, nabor gornjeg kapka iznad njega
  const OKO = { x: 47.6, y: 5, z: -8.5, a: 7.6, h: 3.7 };
  function oko(d, ax, y, z) {
    if (kap(ax, y, z, 46, 6, -8, 46, 6, -8, 0) > 22) return d;
    d = smin(d, eli(ax, y, z, 42.5, 6.5, -7.5, 9, 13, 14), 8);                               // koštana očna duplja
    d = smin(d, niz(ax, y, z, [[38, 16.5, 6], [46, 15.5, -2], [50, 12, -12], [48.5, 6, -20]], [2.6, 3.2, 2.8, 2], 0), 5); // obrva
    d = smin(d, eli(ax, y, z, OKO.x - 1.5, OKO.y, OKO.z, 4.8, 6.6, 9.4), 2.5);                 // kapci (bademasta izbočina)
    const u = (z - OKO.z) / OKO.a, v = y - OKO.y;
    if (abs(u) < 1.35) {
      const hh = OKO.h * (1 - u * u);                                                         // rub kapaka: v = ±hh
      const s1 = abs(abs(v) - max(hh, 0)) + max(abs(u) - 1, 0) * OKO.a;
      d = urez(d, s1, 0.85, 1.5, -1);
      const s2 = abs(v - hh - 2.3 + 0.6 * u * u) + max(abs(u) - 0.9, 0) * OKO.a;              // nabor gornjeg kapka
      if (v > 0) d = urez(d, s2, 0.5, 0.8, -1);
      if (abs(v) < hh) d = smin(d, eli(ax, y, z, OKO.x - 1.2, OKO.y, OKO.z, 4.6, 4.2, 7.4), 0.6); // jabučica u otvoru
    }
    return d;
  }
  // ── nosnica (desna/lijeva isto): koso postavljen otvor u obliku zareza, s vanjske strane meko krilo
  function nosnica(d, ax, y, z) {
    if (kap(ax, y, z, 19, -68, 26, 19, -68, 26, 0) > 16) return d;
    d = smin(d, eli(ax, y, z, 20.5, -67.5, 24, 4.6, 9, 5.5), 4);                              // krilo nosnice
    const u = ax - 18.6, v = y + 67.5, c = 0.9, sn = 0.43;
    const uu = c * u - sn * v, vv = sn * u + c * v;
    const w = uu + 0.06 * vv * vv;                                                            // blago savijen (zarez)
    d = smax(d, -eli(w, vv, z, 0, 0, 30.2, 3.1, 6.8, 7.4), 1.1);
    return d;
  }
  // ── njuška: nosno zrcalo, nosnice, usne, brada
  function njuska(d, ax, y, z) {
    if (y > -28 || z < -32) return d;
    let nj = eli(ax, y, z, 0, -64, 7, 31, 22, 22);
    nj = smax(nj, z - 29, 7);                                                                 // ravno nosno zrcalo
    d = smin(d, nj, 8);
    d = S.razlika(d, eli(ax, y, z, 0, -48, 32.5, 20, 4.5, 6.5), 3);                          // plitka udubina iznad zrcala
    d = nosnica(d, ax, y, z);
    // gornja usna prelazi preko donje; usta: urez oko njuške (sprijeda nisko, sa strane se diže)
    const ym = -80 + 11 * sat((16 - z) / 30);
    d = urez(d, abs(y - ym), 1.5, 2.6, -14 - z);
    // donja usna i brada: uži valjak uvučen ispod gornje usne
    d = smin(d, kap(ax, y, z, 0, -84, 19, 10, -83, 13, 5), 3);                                // donja usna
    d = smin(d, eli(ax, y, z, 0, -88.5, 6, 14, 6, 13), 5);                                   // brada
    return d;
  }

  function jezgra(x, y, z) {
    const ax = abs(x);
    let d = blok(ax, y, z);                                                                  // lubanja i lice
    d = smin(d, kap(ax, y, z, 0, 68, -10, 32, 64, -8, 12), 10);                              // greben između rogova
    d = smin(d, eli(ax, y, z, 0, 63, 8, 24, 10, 12), 7);                                     // čuperak na čelu
    d = smin(d, eli(ax, y, z, 0, 26, 6, 38, 36, 19), 8);                                     // blago izbočeno čelo
    d = smin(d, eli(ax, y, z, 39, 61, -6, 10, 11, 11), 5);                                   // korijen roga
    d = smin(d, eli(ax, y, z, 38.5, -18, -42, 6, 26, 24), 12);                               // žvačni mišić (plosnat)
    d = smin(d, eli(ax, y, z, 41, -6, -68, 3.5, 14, 10), 10);                                   // kut čeljusti
    d = oko(d, ax, y, z);
    d = njuska(d, ax, y, z);
    return d;
  }
  // rogovi: kvadratna Bézierova krivulja od korijena (u lubanji) do vrha, polumjer se sužava;
  //    desni (x < 0) je u kipu malo drukčije savijen od lijevog
  function rogKrivulja(B, C, T) {
    const P = [[B[0] - 16, B[1] + 2, B[2] - 4]], R = [14];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t;
      P.push([a * B[0] + b * C[0] + c * T[0], a * B[1] + b * C[1] + c * T[1], a * B[2] + b * C[2] + c * T[2]]);
      R.push(2.2 + 11.8 * (1 - Math.pow(t, 1.6)));
    }
    return cijev(P, R, 1);
  }
  const ROG_L = rogKrivulja([52, 56.5, -1.5], [95, 65.75, -1.5], [123.5, 34, 28.5]);
  const ROG_D = rogKrivulja([46, 58, -14], [92.5, 68.75, -1.5], [125, 30.5, 30]);
  function rog(x, y, z) { return x >= 0 ? cijevD(x, y, z, ROG_L) : cijevD(-x, y, z, ROG_D); }
  // uho: spljošteni list (presjek elipsa 1 : 1.8) sa školjkom otvorenom prema naprijed
  const UHO = cijev([[48, 39, -36], [70, 37.8, -28.8], [94, 34.2, -33.5], [117, 27, -41.4]], [9, 13.5, 9.5, 1.8], 4);
  const UHO_S = cijev([[60, 38.4, -25.2], [72, 37.6, -20.5], [95, 34, -27.4], [112, 28.6, -35.6]], [5.6, 9.2, 6.2, 1.6], 4);
  function uho0(ax, y, z) {
    const z8 = z * 1.8;
    const d = cijevD(ax, y, z8, UHO) / 1.8;
    return smax(d, -cijevD(ax, y, z8, UHO_S) / 1.8, 1.2);
  }
  // položaj uha: okret oko korijena (podignutost e, zakret a) i duljina s; lijevo i desno posebno
  function uhoPoza(e, a, s) { return { ce: Math.cos(e * D), se: Math.sin(e * D), ca: Math.cos(a * D), sa: Math.sin(a * D), s: s }; }
  const UHO_L = uhoPoza(0, 0, 1), UHO_D = uhoPoza(0, 6, 1);

  // glava bez vrata u lokalnom okviru
  // obuhvatne kapsule (sigurna donja granica udaljenosti) za skupe dijelove
  function obuhvat(seg) {
    const a = [seg[0].ax, seg[0].ay, seg[0].az], z = seg[seg.length - 1];
    const b = [z.ax + z.bx, z.ay + z.by, z.az + z.bz];
    let r = 0;
    seg.forEach(function (g) {
      r = max(r, kap(g.ax, g.ay, g.az, a[0], a[1], a[2], b[0], b[1], b[2], 0) + g.ra);
      r = max(r, kap(g.ax + g.bx, g.ay + g.by, g.az + g.bz, a[0], a[1], a[2], b[0], b[1], b[2], 0) + g.rb);
    });
    return [a[0], a[1], a[2], b[0], b[1], b[2], r + 0.5];
  }
  const OB_RL = obuhvat(ROG_L), OB_RD = obuhvat(ROG_D), OB_U = obuhvat(UHO);
  function rogB(x, y, z) {
    const B = x >= 0 ? OB_RL : OB_RD, ax = abs(x);
    const d = kap(ax, y, z, B[0], B[1], B[2], B[3], B[4], B[5], B[6]);
    return d > 20 ? d : (x >= 0 ? cijevD(ax, y, z, ROG_L) : cijevD(ax, y, z, ROG_D));
  }
  function uho(x, y, z) {
    const P = x >= 0 ? UHO_L : UHO_D;
    const px = abs(x) - 48, py = y - 39, pz = z + 20;
    const qx = P.ce * px + P.se * py, qy = -P.se * px + P.ce * py;
    const ex = (P.ca * qx - P.sa * pz) / P.s + 48, ey = qy + 39, ez = P.sa * qx + P.ca * pz - 20, sk = min(1, P.s);
    // granica u prostoru uha (z je tamo rastegnut 1.8 puta, pa je udaljenost najmanje bound/1.8)
    const b = kap(ex, ey, ez * 1.8, OB_U[0], OB_U[1], OB_U[2], OB_U[3], OB_U[4], OB_U[5], OB_U[6]) / 1.8;
    return (b > 20 ? b : uho0(ex, ey, ez)) * sk;
  }
  // glava bez vrata u lokalnom okviru (granice: kutija oko lubanje, kapsule oko rogova i ušiju)
  function lok(xl, yl, zl) {
    const axl = abs(xl);
    const qx = axl - 54, qy = abs(yl + 7.5) - 87.5, qz = abs(zl + 24.5) - 54.5;
    let d = Math.hypot(max(qx, 0), max(qy, 0), max(qz, 0));
    if (d < 22) d = jezgra(xl, yl, zl);
    d = smin(d, rogB(xl, yl, zl), 6);
    return smin(d, uho(xl, yl, zl), 5);
  }


  // ── vrat (svjetske koordinate): presjeci (elipse) po visini — stup s ovratnika se brzo povlači
  //    unatrag ispod čeljusti (prsa/podbradak), gore se stanjuje u grbu iza rogova
  //    [y, središte x, središte z, poluos x, poluos z]
  const VRAT = [
    [330, -5, -8, 56, 56],
    [341, -5, -9, 55, 55],
    [352, -8, -17, 54, 49],
    [365, -12, -30, 51, 41],
    [380, -14, -38, 49, 37],
    [400, -15, -43, 47, 35],
    [420, -16, -46, 45, 34],
    [440, -17, -48, 41, 33],
    [456, -17, -48, 38, 30],
    [470, -17, -47, 34, 27]
  ];
  const VR = [0, 0, 0, 0, 0];
  function vratPresjek(y) {
    const P = VRAT, n = P.length;
    let i = 0;
    if (y <= P[0][0]) i = 0; else if (y >= P[n - 1][0]) i = n - 2; else while (i < n - 2 && y > P[i + 1][0]) i++;
    const t = sat((y - P[i][0]) / (P[i + 1][0] - P[i][0]));
    const A = P[Math.max(0, i - 1)], B = P[i], C = P[i + 1], E = P[Math.min(n - 1, i + 2)];
    for (let k = 1; k < 5; k++) VR[k] = cr(A[k], B[k], C[k], E[k], t);
    return VR;
  }
  function vratOsnova(x, y, z) {
    const Q = vratPresjek(y);
    const a = (x - Q[1]) / Q[3], b = (z - Q[2]) / Q[4], k0 = sqrt(a * a + b * b);
    const k1 = sqrt(a * a / (Q[3] * Q[3]) + b * b / (Q[4] * Q[4]));
    let d = k1 > 0 ? k0 * (k0 - 1) / k1 : -Q[4];                                      // elipsa u rezu
    d = smax(d, y - 452, 22);                                                          // zaobljen vrh stupa
    return smin(d, S.stozac([x, y, z], [-8, 460, -32], [-20, 418, -58], 18, 25), 16); // greben/grba (morrillo) iza rogova
  }
  // ── nabori kože: krivulja na površini; koža je ispod krivulje blago izdignuta (terasa koja
  //    se postupno spušta niz padinu, širina W), a na gornjoj strani naglo pada (oštar rub, E)
  function nabor(T0, A0, W0, E, f) {
    // krivulja se zagladi (Catmull-Rom, 5 odsječaka po rasponu), pa se točke spuste na osnovnu plohu
    const T = [], A = [], W = [], m = T0.length;
    for (let i = 0; i < m - 1; i++) {
      const p0 = T0[max(0, i - 1)], p1 = T0[i], p2 = T0[i + 1], p3 = T0[min(m - 1, i + 2)];
      for (let k = 0; k < 5; k++) {
        const t = k / 5;
        const p = [cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t), cr(p0[2], p1[2], p2[2], p3[2], t)];
        for (let it = 0; it < 4; it++) {                                                  // projekcija na plohu f = 0
          const e = 0.5, d = f(p[0], p[1], p[2]);
          let gx = f(p[0] + e, p[1], p[2]) - f(p[0] - e, p[1], p[2]), gy = f(p[0], p[1] + e, p[2]) - f(p[0], p[1] - e, p[2]), gz = f(p[0], p[1], p[2] + e) - f(p[0], p[1], p[2] - e);
          const l = Math.hypot(gx, gy, gz) || 1;
          p[0] -= d * gx / l; p[1] -= d * gy / l; p[2] -= d * gz / l;
        }
        const ss = t * t * (3 - 2 * t);
        T.push(p); A.push(A0[i] + (A0[i + 1] - A0[i]) * ss); W.push(W0[i] + (W0[i + 1] - W0[i]) * t);
      }
    }
    T.push(T0[m - 1]); A.push(A0[m - 1]); W.push(W0[m - 1]);
    const n = T.length, N = [], U = [];
    for (let i = 0; i < n; i++) {
      const p = T[i], e = 0.5;
      let nx = f(p[0] + e, p[1], p[2]) - f(p[0] - e, p[1], p[2]), ny = f(p[0], p[1] + e, p[2]) - f(p[0], p[1] - e, p[2]), nz = f(p[0], p[1], p[2] + e) - f(p[0], p[1], p[2] - e);
      let l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const q = T[min(n - 1, i + 1)], o = T[max(0, i - 1)];
      let tx = q[0] - o[0], ty = q[1] - o[1], tz = q[2] - o[2]; l = Math.hypot(tx, ty, tz); tx /= l; ty /= l; tz /= l;
      // smjer "gore" (prema oštrom rubu): okomit na krivulju i na normalu
      let ux = ny * tz - nz * ty, uy = nz * tx - nx * tz, uz = nx * ty - ny * tx;
      if (uy < 0) { ux = -ux; uy = -uy; uz = -uz; }
      l = Math.hypot(ux, uy, uz);
      N.push([nx, ny, nz]); U.push([ux / l, uy / l, uz / l]);
    }
    let r = 0; for (let i = 0; i < n; i++) r = max(r, W[i] + 8);
    const c = [0, 0, 0]; T.forEach(function (p) { c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; });
    let R = 0; T.forEach(function (p) { R = max(R, Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2])); });
    return { T: T, N: N, U: U, A: A, W: W, E: E, c: c, R: R + r };
  }
  function naborH(x, y, z, F) {
    const dc = Math.hypot(x - F.c[0], y - F.c[1], z - F.c[2]);
    if (dc > F.R) return 0;
    const T = F.T;
    let best = Infinity, bi = 0, bt = 0;
    for (let i = 0; i < T.length - 1; i++) {
      const a = T[i], b = T[i + 1], ex = b[0] - a[0], ey = b[1] - a[1], ez = b[2] - a[2];
      const t = sat(((x - a[0]) * ex + (y - a[1]) * ey + (z - a[2]) * ez) / (ex * ex + ey * ey + ez * ez));
      const dx = x - a[0] - ex * t, dy = y - a[1] - ey * t, dz = z - a[2] - ez * t, q = dx * dx + dy * dy + dz * dz;
      if (q < best) { best = q; bi = i; bt = t; }
    }
    const a = T[bi], b = T[bi + 1], t = bt;
    const cx = a[0] + (b[0] - a[0]) * t, cy = a[1] + (b[1] - a[1]) * t, cz = a[2] + (b[2] - a[2]) * t;
    const U0 = F.U[bi], U1 = F.U[bi + 1];
    let ux = U0[0] + (U1[0] - U0[0]) * t, uy = U0[1] + (U1[1] - U0[1]) * t, uz = U0[2] + (U1[2] - U0[2]) * t;
    const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
    const A = F.A[bi] + (F.A[bi + 1] - F.A[bi]) * t, W = F.W[bi] + (F.W[bi + 1] - F.W[bi]) * t;
    const vx = x - cx, vy = y - cy, vz = z - cz;
    const side = vx * ux + vy * uy + vz * uz;
    const rest = sqrt(max(0, vx * vx + vy * vy + vz * vz - side * side));
    if (side < -W || side > F.E + 1) return 0;
    const pod = side < 0 ? 1 - side / -W : 1, glatko = pod * pod * (3 - 2 * pod);   // postupni porast odozdo
    const rub = side > 0 ? 1 - sat(side / F.E) : 1;                                     // oštar pad na rubu
    const blizu = 1 - sat((rest - A - 2) / 5);                                          // samo uz površinu
    return A * glatko * rub * blizu;
  }
  const NABOR_A = nabor([[-62, 384, -32], [-59, 377, -21], [-49, 369.5, -4], [-35, 363, 10.6], [-20, 357, 24.8], [-5, 351, 35.1], [10, 347, 38.5]],
    [0, 1.6, 3, 3, 2.6, 1.6, 0], [6, 9, 12, 13, 13, 11, 8], 2.6, vratOsnova);
  const NABOR_B = nabor([[-61, 361, -12], [-58, 357, -2.2], [-44, 351.5, 20.7], [-30, 347.5, 34.4], [-16, 344.5, 42.3]],
    [0, 1, 2, 1.4, 0], [6, 8, 9, 9, 8], 2.6, vratOsnova);
  function vrat(x, y, z) {
    let d = vratOsnova(x, y, z);
    if (y < 392 && d < 12) d -= naborH(x, y, z, NABOR_A) + naborH(x, y, z, NABOR_B);    // nabori podbratka na prsima
    return d;
  }

  function glavaW(x, y, z) {
    const px = x - CX, py = y - CY, pz = z - CZ;
    const x1 = cG * px + sG * py, y1 = -sG * px + cG * py;
    const xl = cT * x1 - sT * pz, z2 = sT * x1 + cT * pz;
    const yl = cA * y1 - sA * z2, zl = sA * y1 + cA * z2;
    return lok(xl, yl, zl);
  }
  function sdf(x, y, z) {
    return smin(vrat(x, y, z), glavaW(x, y, z), 6 + 12 * sat((y - 380) / 60));
  }

  return {
    _lok: lok, _glavaW: glavaW, _vrat: vrat,
    ime: 'Mr Sam', podnaslov: 'The Blazing', grb: 'bik',
    staklo: ['#44617f', '#8aa3bc'],
    okvir: { x: 144, yMin: 330, yMax: 497, z: 94 },
    sdf: sdf
  };
})();
