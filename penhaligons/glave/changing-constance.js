// Penhaligon's Portraits — Changing Constance: zlatna glava gazele
// Lubanja i lice modeliraju se u lokalnom okviru (X bočno, simetrično po |X|; Y gore; Z naprijed
// prema njušci; ishodište između očiju) pa se postave u pozu: okret udesno, njuška spuštena,
// glava nagnuta (dalja strana viša). Rogovi i uši su simetrični u lokalnom okviru.
// Vrat je stup s ovratnika u svjetskim koordinatama.
PEN.glave['changing-constance'] = (function () {
  'use strict';
  const D = Math.PI / 180;
  const sqrt = Math.sqrt, abs = Math.abs, min = Math.min, max = Math.max;
  // parametri (namješteni prema obrisu s fotografije):
  //  poza: yaw okret udesno, pitch spuštena njuška, roll nagib (dalja strana viša), (cx, cy, cz) središte između očiju;
  //  (ny, nz) točka prednje plohe njuške; dx pomak cijele glave (poravnanje s pikselima fotografije);
  //  uši: eB/eT baza i vrh lista (lokalno), eW pola širine, eN smjer otvora školjke, udB/udT pomak bližeg uha;
  //  zt zatiljak uz korijen uha [x, y, z, rx, ry, rz]; rogovi: točke [dx, dy, dz] od baze (svijet) i polumjeri
  const P = {
    yaw: 40.5, pitch: 40, roll: 11, cx: 15.4, cy: 462.6, cz: -6, ny: 6, nz: 82, dx: 0.5,
    eB: [43, -5, -31], eT: [108.5, 29.5, -56.5], eW: 17, eN: [-0.25, 0.85, 2.85], udB: [-9, 0, 0], udT: [-2, -3, -7],
    zt: [32, 8.5, -30, 21, 12, 14],
    rogL: [[0, -4, 0], [0.5, 14, -1], [0, 48, -3], [-2, 78, -6], [-8.5, 98, -14], [-19.5, 103, -24], [-24, 111, -33]],
    rogD: [[0, -4, 0], [-0.5, 14, -1], [4, 48, -3], [4.5, 82, -6], [0, 103, -14], [-8.5, 104, -24], [-16, 107, -33]],
    rogR: [10.4, 9.4, 9.7, 8.7, 8.1, 7.7, 4]
  };
  function sat(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smin(a, b, k) { const h = sat(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); }
  function smax(a, b, k) { return -smin(-a, -b, k); }
  function eli(x, y, z, cx, cy, cz, rx, ry, rz) {
    const a = (x - cx) / rx, b = (y - cy) / ry, c = (z - cz) / rz;
    const k0 = sqrt(a * a + b * b + c * c), k1 = sqrt(a * a / (rx * rx) + b * b / (ry * ry) + c * c / (rz * rz));
    return k1 > 0 ? k0 * (k0 - 1) / k1 : -min(rx, ry, rz);
  }
  function dist(x, y, z, c) { return sqrt((x - c[0]) * (x - c[0]) + (y - c[1]) * (y - c[1]) + (z - c[2]) * (z - c[2])); }
  function cr(p0, p1, p2, p3, t) {
    return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
  }
  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function kutija(x, y, z, B) {         // udaljenost do kutije [x0,x1,y0,y1,z0,z1] (donja granica)
    const qx = max(B[0] - x, x - B[1], 0), qy = max(B[2] - y, y - B[3], 0), qz = max(B[4] - z, z - B[5], 0);
    return sqrt(qx * qx + qy * qy + qz * qz);
  }
  // žlijeb V-presjeka uz površinu: s = udaljenost od osi žlijeba, w = pola širine, dub = dubina; c <= 0 gdje smije biti
  function urez(d, s, w, dub, c) { return smax(d, -max(s - w * (1 + d / dub), c), 0.6); }

  // ── poza: lokalno -> svijet = Ry(yaw) · Rx(pitch) · Rz(roll)
  const cf = Math.cos(P.yaw * D), sf = Math.sin(P.yaw * D), cb = Math.cos(P.pitch * D), sb = Math.sin(P.pitch * D);
  const cq = Math.cos(P.roll * D), sq = Math.sin(P.roll * D);
  function smjerW(x, y, z) {
    const x1 = x * cq - y * sq, y1 = x * sq + y * cq;
    const y2 = y1 * cb - z * sb, z2 = y1 * sb + z * cb;
    return [x1 * cf + z2 * sf, y2, -x1 * sf + z2 * cf];
  }
  const C = [P.cx, P.cy, P.cz];
  const EX = smjerW(1, 0, 0), EY = smjerW(0, 1, 0), EZ = smjerW(0, 0, 1);
  function uSvijet(v) { const a = smjerW(v[0], v[1], v[2]); return [C[0] + a[0], C[1] + a[1], C[2] + a[2]]; }

  // ── cijev (rog): Catmull-Rom kroz točke T s polumjerima R; cijevS = položaj najbliže točke duž cijevi (0..1)
  function cijev(T, R, n) {
    const seg = [], m = T.length;
    let prev = null, uk = 0;
    for (let i = 0; i < m - 1; i++) {
      const p0 = T[max(0, i - 1)], p1 = T[i], p2 = T[i + 1], p3 = T[min(m - 1, i + 2)];
      const r0 = R[max(0, i - 1)], r1 = R[i], r2 = R[i + 1], r3 = R[min(m - 1, i + 2)];
      for (let k = (i === 0 ? 0 : 1); k <= n; k++) {
        const t = k / n, q = [cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t), cr(p0[2], p1[2], p2[2], p3[2], t), cr(r0, r1, r2, r3, t)];
        if (prev) {
          const bx = q[0] - prev[0], by = q[1] - prev[1], bz = q[2] - prev[2], l2 = bx * bx + by * by + bz * bz, rr = prev[3] - q[3];
          seg.push({ ax: prev[0], ay: prev[1], az: prev[2], bx: bx, by: by, bz: bz, l2: l2, rr: rr, a2: l2 - rr * rr, il2: 1 / l2, ra: prev[3], rb: q[3], s0: uk, l: sqrt(l2) });
          uk += sqrt(l2);
        }
        prev = q;
      }
    }
    let B = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
    seg.forEach(function (g) {
      const r = max(g.ra, g.rb) + 1.5;
      [[g.ax, g.ay, g.az], [g.ax + g.bx, g.ay + g.by, g.az + g.bz]].forEach(function (p) {
        B = [min(B[0], p[0] - r), max(B[1], p[0] + r), min(B[2], p[1] - r), max(B[3], p[1] + r), min(B[4], p[2] - r), max(B[5], p[2] + r)];
      });
    });
    return { seg: seg, L: uk, B: B };
  }
  let cijevS = 0;
  function cijevD(x, y, z, CJ) {
    const sg = CJ.seg;
    let d = Infinity;
    for (let i = 0; i < sg.length; i++) {
      const g = sg[i], pax = x - g.ax, pay = y - g.ay, paz = z - g.az;
      const yv = pax * g.bx + pay * g.by + paz * g.bz, zz = yv - g.l2;
      const qx = pax * g.l2 - g.bx * yv, qy = pay * g.l2 - g.by * yv, qz = paz * g.l2 - g.bz * yv;
      const x2 = qx * qx + qy * qy + qz * qz, y2 = yv * yv * g.l2, z2 = zz * zz * g.l2;
      const k = Math.sign(g.rr) * g.rr * g.rr * x2;
      let di;
      if (Math.sign(zz) * g.a2 * z2 > k) di = sqrt(x2 + z2) * g.il2 - g.rb;
      else if (Math.sign(yv) * g.a2 * y2 < k) di = sqrt(x2 + y2) * g.il2 - g.ra;
      else di = (sqrt(x2 * g.a2 * g.il2) + yv * g.rr) * g.il2 - g.ra;
      if (di < d) { d = di; cijevS = (g.s0 + sat(yv * g.il2) * g.l) / CJ.L; }
    }
    return d;
  }

  // ── rogovi: baza na lubanji (lokalno, simetrično), dalje se dižu gotovo okomito i na vrhu savijaju unatrag
  function rog(s) {
    const b = uSvijet([s * 20.6, 31, -14]);
    const T = [], R = [];
    const tok = s < 0 ? P.rogL : P.rogD;                // [dx, dy, dz] od baze, u svijetu
    const rad = P.rogR;
    tok.forEach(function (t) { T.push([b[0] + t[0], b[1] + t[1], b[2] + t[2]]); });
    return cijev(T, rad, 6);
  }
  const ROGOVI = [rog(-1), rog(1)];
  function rogD(x, y, z, CJ) {
    let d = cijevD(x, y, z, CJ);
    // godovi: niski prstenasti grebeni duž donjih dviju trećina roga
    const s = cijevS;
    if (s > 0.06 && s < 0.78 && d < 3) {
      const f = sat((s - 0.06) / 0.08) * sat((0.78 - s) / 0.3);
      const c = 0.5 + 0.5 * Math.cos(2 * Math.PI * s * CJ.L / 6.2);
      d -= 0.32 * f * c * c * c;
    }
    return d;
  }

  // ── uho: izduženi list sa školjkom (lokalno, za +X; drugo uho preko |X|)
  //    u = širina, v = duž uha, w = normala prema otvoru školjke
  function napraviUho(B, T, W, N0) {
    const A = norm([T[0] - B[0], T[1] - B[1], T[2] - B[2]]), h = Math.hypot(T[0] - B[0], T[1] - B[1], T[2] - B[2]);
    let N = norm(N0);
    const k = dot(N, A); N = norm([N[0] - k * A[0], N[1] - k * A[1], N[2] - k * A[2]]);
    const U = cross(A, N);
    const c = [(B[0] + T[0]) / 2, (B[1] + T[1]) / 2, (B[2] + T[2]) / 2];
    // peteljka: smotani korijen uha od lubanje do početka lista
    const S0 = [22, B[1] + 3, B[2] + 4], S1 = [B[0] + 9 * A[0] - 1.2 * N[0], B[1] + 9 * A[1] - 1.2 * N[1], B[2] + 9 * A[2] - 1.2 * N[2]];
    const rb = max(h / 2 + 12, Math.hypot(S0[0] - c[0], S0[1] - c[1], S0[2] - c[2]) + 12);
    return { B: B, A: A, N: N, U: U, h: h, W: W, c: c, rb: rb, S0: S0, S1: S1 };
  }
  // dalje uho (+X) i bliže uho (zrcaljeno, -X -> |X|); P.ud = mali pomak bližeg uha
  const UHO_D = napraviUho(P.eB, P.eT, P.eW, P.eN);
  const UHO_L = napraviUho([P.eB[0] + P.udB[0], P.eB[1] + P.udB[1], P.eB[2] + P.udB[2]], [P.eT[0] + P.udT[0], P.eT[1] + P.udT[1], P.eT[2] + P.udT[2]], P.eW, P.eN);
  function uho(ax, y, z, E) {
    const rx = ax - E.B[0], ry = y - E.B[1], rz = z - E.B[2];
    const u = rx * E.U[0] + ry * E.U[1] + rz * E.U[2];
    const v = rx * E.A[0] + ry * E.A[1] + rz * E.A[2];
    const w = rx * E.N[0] + ry * E.N[1] + rz * E.N[2];
    const t = v / E.h;
    let wp;
    if (t < 0.42) { const q = sat(t / 0.42); wp = E.W * (0.24 + 0.76 * Math.sin(q * Math.PI / 2)); }
    else wp = E.W * Math.pow(Math.cos(sat((t - 0.42) / 0.58) * Math.PI / 2), 0.85);
    const a = max((abs(u) - wp) * 0.9, v - E.h, -v - 2);
    const c = 0.034 * (0.5 + 0.5 * sat(t * 3)), g = 1 / sqrt(1 + 4 * c * c * u * u);
    const th = 2.3 + 1.6 * sat(1 - t * 1.6);              // pola debljine
    const wm = w - c * u * u;                             // srednja ploha: rubovi podignuti prema otvoru
    let d = smax(a, (abs(wm) - th) * g, 1.5);
    // školjka: udubina unutar ruba, dno 2.6 px iznad stražnje plohe
    const ai = max(a + 2.1, (13 - v) * 0.8);                // školjka počinje iza peteljke
    if (ai < 2) d = smax(d, -max(ai, (-th + 2.4 - wm) * g), 1.2);
    return smin(d, PEN.sdf.stozac([ax, y, z], E.S0, E.S1, 9, 5.4), 5);
  }

  // ── lubanja i lice: presjeci duž Z (zaobljeni trapezi)
  //    [Z, pola širine gore, pola širine dolje, Y gornje plohe, Y donje plohe, zaobljenje]
  const PROFIL = [
    [-42, 12, 12, 6, -14, 8],
    [-32, 24, 22, 17, -36, 12],
    [-20, 29, 25, 26, -50, 14],
    [-8, 30, 24, 31, -55, 15],
    [4, 27, 22, 30.5, -56, 14],
    [17, 21.5, 19, 27, -53, 13],
    [32, 15, 16.5, 23, -48, 12],
    [48, 12, 14.5, 19, -43, 11],
    [64, 11.6, 13, 15, -37, 10],
    [78, 11.4, 12.5, 11.5, -32, 10],
    [90, 10.5, 11, 8.5, -28, 9],
    [102, 9.5, 10, 5, -24, 8],
    [114, 8, 9, 1, -19, 7]
  ];
  const PR = [0, 0, 0, 0, 0, 0];
  function presjek(z) {
    const Q = PROFIL, n = Q.length;
    let i = 0;
    if (z >= Q[n - 1][0]) i = n - 2; else while (i < n - 2 && z > Q[i + 1][0]) i++;
    const t = sat((z - Q[i][0]) / (Q[i + 1][0] - Q[i][0]));
    const A = Q[max(0, i - 1)], B = Q[i], Cc = Q[i + 1], E = Q[min(n - 1, i + 2)];
    for (let k = 1; k < 6; k++) PR[k] = cr(A[k], B[k], Cc[k], E[k], t);
    return PR;
  }
  function duz(px, pz, ax, az, bx, bz) {
    const ex = bx - ax, ez = bz - az, wx = px - ax, wz = pz - az;
    const h = sat((wx * ex + wz * ez) / (ex * ex + ez * ez));
    const dx = wx - ex * h, dz = wz - ez * h;
    return sqrt(dx * dx + dz * dz);
  }
  function trapez(ax, y, wt, wb, yt, yb, r) {
    wt -= r; wb -= r; yt -= r; yb += r;
    const d = min(duz(ax, y, 0, yt, wt, yt), duz(ax, y, wt, yt, wb, yb), duz(ax, y, wb, yb, 0, yb));
    const unutra = y < yt && y > yb && (ax - wt) * (yb - yt) - (y - yt) * (wb - wt) > 0;
    return (unutra ? -d : d) - r;
  }
  // prednja ploha njuške je u svijetu okomita (gleda vodoravno naprijed)
  const NC = (function () {
    const f = [sf, 0, cf], ny = dot(EY, f), nz = dot(EZ, f), l = Math.hypot(ny, nz);
    return { y: ny / l, z: nz / l };
  })();
  function blok(ax, y, z) {
    const R = presjek(z);
    const d2 = trapez(ax, y, R[1], R[2], R[3], R[4], R[5]);
    return smax(smax(d2, PROFIL[0][0] - z, 10), (y - P.ny) * NC.y + (z - P.nz) * NC.z, 7);
  }

  // ── oko: koštana duplja, obrva, bademasti kapci s prorezom
  const OKO = { x: 33.5, y: 1, z: 1.5, a: 8, h: 3.8 };
  const OCA = Math.cos(22 * D), OSA = Math.sin(22 * D);
  const OBRVA = [[16, 23, -12], [25.5, 16.5, -5], [31, 11, 2], [31.5, 8.5, 8]], OBRVA_R = [3.6, 4.4, 3.8, 2.2];
  function oko(d, ax, y, z) {
    if (dist(ax, y, z, [26, 10, 0]) > 40) return d;
    d = smin(d, eli(ax, y, z, 27.5, 3, -1, 10, 11.5, 13), 7);                               // duplja
    d = smin(d, PEN.sdf.niz([ax, y, z], OBRVA, OBRVA_R, 0), 6);                               // obrva
    const ex = ax - OKO.x, ey = y - OKO.y, ez = z - OKO.z;
    const wn = ex * OCA + ez * OSA, ul = -ex * OSA + ez * OCA, u = ul / OKO.a, v = ey;
    if (abs(wn) > 16 || abs(ul) > 18 || abs(v) > 14) return d;
    d = smin(d, eli(wn, v, ul, -1.6, 0.4, 0, 5, 7, 10.5), 2.5);                               // kapci
    d = smin(d, eli(wn, v, ul, -1.4, 0, 0, 4.6, 4.4, 8), 0.6);                                 // jabučica
    if (abs(u) < 1.35) {
      const hh = OKO.h * (1 - u * u);
      const s1 = abs(abs(v) - max(hh, 0)) + max(abs(u) - 1, 0) * OKO.a;
      const wz = 0.75 * sat((1.2 - abs(u)) / 0.35);
      if (wz > 0) d = urez(d, s1, wz, 1.1, -1);                                                // rub kapaka
    }
    return d;
  }

  // ── njuška: koordinate uz prednju plohu: mu = gore duž plohe, mn = van iz plohe
  const UST = { y: P.ny - 13 * NC.z, z: P.nz + 13 * NC.y };            // usta: prednja točka
  function njuska(d, ax, y, z) {
    const yy = y - P.ny, zz = z - P.nz;
    const mu = yy * NC.z - zz * NC.y, mn = yy * NC.y + zz * NC.z;
    if (mn < -34 || ax > 24) return d;
    // nosnica: kosi zarez u obliku zareza, s blago napuhanim krilom
    d = smin(d, eli(ax, mu, mn, 0, -3.5, -4, 9.5, 7.5, 4.6), 3);                           // nosna ploča
    {
      const u = ax - 8.2, v = mu + 4.5, c = Math.cos(28 * D), s = Math.sin(28 * D);
      const uu = c * u - s * v, vv = s * u + c * v, uc = uu - 0.07 * vv * vv;               // zarez savijen prema van
      d = smin(d, eli(uu, vv, mn, 1, 0, -2.4, 3.8, 6.8, 3.4), 2.5);                          // krilo nosnice
      d = smax(d, -eli(uc, vv, mn, 0, 0.3, 0, 1.6, 5, 5), 0.9);                              // otvor
    }
    // usna: žlijeb od prednje plohe unatrag uz bokove
    {
      const ym = UST.y - 0.3 * max(0, UST.z - z);
      const s1 = abs(y - ym);
      if (s1 < 6) d = urez(d, s1, 0.7, 1.3, (UST.z - 17 - z) * 0.3);
    }
    d = smin(d, eli(ax, mu, mn, 0, -24, -5, 7.5, 5, 5.5), 4);                                 // brada
    return d;
  }

  // ── glava u lokalnom okviru; lim: iznad te vrijednosti nije potrebna točnost
  const KU = 5;
  const LUB_B = [0, 54, -60, 36, -48, 122];
  function lok(X, Y, Z, lim) {
    const ax = abs(X);
    const E = X < 0 ? UHO_L : UHO_D;
    let du = dist(ax, Y, Z, E.c) - E.rb, ds = kutija(ax, Y, Z, LUB_B);
    if (du < lim + KU) du = uho(ax, Y, Z, E);
    if (ds < lim + KU && ds < du + KU) {
      ds = blok(ax, Y, Z);
      ds = smin(ds, eli(ax, Y, Z, 0, 7, -18, 30, 22, 24), 10);                                // svod lubanje
      ds = smin(ds, eli(ax, Y, Z, P.zt[0], P.zt[1], P.zt[2], P.zt[3], P.zt[4], P.zt[5]), 12);   // zatiljak uz korijen uha
      ds = smin(ds, eli(ax, Y, Z, 15, -27, 2, 13, 22, 28), 10);                                 // žvačni mišić (obraz)
      ds = oko(ds, ax, Y, Z);
      if (Z > 60) ds = njuska(ds, ax, Y, Z);
    }
    return smin(ds, du, KU);
  }
  function glavaW(x, y, z, lim) {
    const px = x - C[0], py = y - C[1], pz = z - C[2];
    return lok(px * EX[0] + py * EX[1] + pz * EX[2], px * EY[0] + py * EY[1] + pz * EY[2], px * EZ[0] + py * EZ[1] + pz * EZ[2], lim);
  }

  // ── vrat: presjeci (elipse) po visini [y, središte x, središte z, poluos x, poluos z]
  const VRAT = [
    [330, -0.5, -3, 55, 55],
    [350, -0.5, -3.5, 53.5, 53],
    [366, -1, -8, 52, 48],
    [382, -1.5, -15, 51.5, 41],
    [402, -1, -22, 51, 34],
    [425, 0, -26, 50, 30],
    [450, 1, -28, 46.5, 28],
    [470, 2, -29, 42, 26],
    [490, 2, -29, 34, 23]
  ];
  const VR = [0, 0, 0, 0, 0];
  function vrat(x, y, z) {
    const Q = VRAT, n = Q.length;
    let i = 0;
    if (y >= Q[n - 1][0]) i = n - 2; else while (i < n - 2 && y > Q[i + 1][0]) i++;
    const t = sat((y - Q[i][0]) / (Q[i + 1][0] - Q[i][0]));
    const A = Q[max(0, i - 1)], B = Q[i], Cc = Q[i + 1], E = Q[min(n - 1, i + 2)];
    for (let k = 1; k < 5; k++) VR[k] = cr(A[k], B[k], Cc[k], E[k], t);
    const a = (x - VR[1]) / VR[3], b = (z - VR[2]) / VR[4], k0 = sqrt(a * a + b * b);
    const k1 = sqrt(a * a / (VR[3] * VR[3]) + b * b / (VR[4] * VR[4]));
    const d = k1 > 0 ? k0 * (k0 - 1) / k1 : -VR[4];
    return smax(d, y - 482, 18);
  }

  // ── cijela glava: vrat ∪ glava ∪ rogovi; komponente se računaju točno samo gdje mogu utjecati na plohu
  const M = 4, KV = 14, KR = 4;
  const GC = uSvijet([0, -14, 34]), GR = 96;
  const UC = [uSvijet(UHO_D.c), uSvijet([-UHO_L.c[0], UHO_L.c[1], UHO_L.c[2]])], UR = [UHO_D.rb, UHO_L.rb];
  function sdf0(x, y, z) {
    let d = y < 520 ? vrat(x, y, z) : y - 482;
    if (y < 562) {
      const gb = min(dist(x, y, z, GC) - GR, dist(x, y, z, UC[0]) - UR[0], dist(x, y, z, UC[1]) - UR[1]);
      if (gb < d + KV) {
        if (d > M + KV && gb > M + KV) d = min(d, gb) - KV / 4;
        else d = smin(d, glavaW(x, y, z, d + KV + 2), 6 + (KV - 6) * sat((y - 425) / 45));
      }
    }
    for (let i = 0; i < 2; i++) {
      const R = ROGOVI[i], bd = kutija(x, y, z, R.B);
      if (bd < d + KR) {
        if (d > M + KR && bd > M + KR) d = min(d, bd) - KR / 4;
        else d = smin(d, rogD(x, y, z, R), KR);
      }
    }
    return d;
  }

  // ── rub čeljusti: žlijeb duž crte s fotografije (x, y), spuštene na prednju plohu pri izgradnji
  const CRTA = (function () {
    const E = [[-40, 430], [-29, 418.5], [-16, 408.5], [-2, 401.5], [12, 397.5], [26, 394.5], [38, 391]];
    const T = [];
    E.forEach(function (e) {
      let z = 120;
      for (let k = 0; k < 300; k++) { const d = sdf0(e[0], e[1], z); if (d < 0.02) break; z -= max(d * 0.9, 0.05); }
      T.push([e[0], e[1], z]);
    });
    // zaglađivanje (Catmull-Rom, 4 odsječka po rasponu)
    const R = [];
    for (let i = 0; i < T.length - 1; i++) {
      const p0 = T[max(0, i - 1)], p1 = T[i], p2 = T[i + 1], p3 = T[min(T.length - 1, i + 2)];
      for (let k = 0; k < 4; k++) { const t = k / 4; R.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t), cr(p0[2], p1[2], p2[2], p3[2], t)]); }
    }
    R.push(T[T.length - 1]);
    // smjer "gore" uz plohu, okomit na crtu
    const U = R.map(function (q, i) {
      const e = 0.4, n = norm([sdf0(q[0] + e, q[1], q[2]) - sdf0(q[0] - e, q[1], q[2]), sdf0(q[0], q[1] + e, q[2]) - sdf0(q[0], q[1] - e, q[2]), sdf0(q[0], q[1], q[2] + e) - sdf0(q[0], q[1], q[2] - e)]);
      const a = R[max(0, i - 1)], b = R[min(R.length - 1, i + 1)], t = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
      let u = norm(cross(n, t)); if (u[1] < 0) u = [-u[0], -u[1], -u[2]];
      return u;
    });
    let B = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
    R.forEach(function (q) { B = [min(B[0], q[0] - 16), max(B[1], q[0] + 16), min(B[2], q[1] - 16), max(B[3], q[1] + 16), min(B[4], q[2] - 16), max(B[5], q[2] + 16)]; });
    return { T: R, U: U, B: B };
  })();
  // čeljust malo izdignuta iznad crte (terasa koja se gubi prema gore), oštar rub na crti
  const CW = 12, CA = 1.5, CE = 1.6;
  function sdf(x, y, z) {
    x -= P.dx;
    let d = sdf0(x, y, z);
    if (d < 4 && kutija(x, y, z, CRTA.B) === 0) {
      const T = CRTA.T;
      let q = Infinity, bi = 0, bt = 0;
      for (let i = 0; i < T.length - 1; i++) {
        const a = T[i], b = T[i + 1], ex = b[0] - a[0], ey = b[1] - a[1], ez = b[2] - a[2];
        const t = sat(((x - a[0]) * ex + (y - a[1]) * ey + (z - a[2]) * ez) / (ex * ex + ey * ey + ez * ez));
        const dx = x - a[0] - ex * t, dy = y - a[1] - ey * t, dz = z - a[2] - ez * t, w = dx * dx + dy * dy + dz * dz;
        if (w < q) { q = w; bi = i; bt = t; }
      }
      const tt = (bi + bt) / (T.length - 1), f = sat(tt / 0.12) * sat((1 - tt) / 0.2);
      if (f > 0) {
        const a = T[bi], b = T[bi + 1], U0 = CRTA.U[bi], U1 = CRTA.U[bi + 1];
        const cx = a[0] + (b[0] - a[0]) * bt, cy = a[1] + (b[1] - a[1]) * bt, cz = a[2] + (b[2] - a[2]) * bt;
        const ux = U0[0] + (U1[0] - U0[0]) * bt, uy = U0[1] + (U1[1] - U0[1]) * bt, uz = U0[2] + (U1[2] - U0[2]) * bt;
        const vx = x - cx, vy = y - cy, vz = z - cz, sd = vx * ux + vy * uy + vz * uz;
        const rest = sqrt(max(0, vx * vx + vy * vy + vz * vz - sd * sd));
        let h = 0;
        if (sd >= 0 && sd < CW) { const t = 1 - sd / CW; h = CA * t * t * (3 - 2 * t); }
        else if (sd < 0 && sd > -CE) h = CA * (1 + sd / CE);
        d -= h * f * (1 - sat((rest - CA - 1) / 4));
      }
    }
    return d;
  }

  return {
    ime: 'Constance', podnaslov: 'Changing', grb: 'gazela',
    staklo: ['#7a3f2d', '#bd9a84'],
    okvir: { x: 99, yMin: 330, yMax: 612, z: 86 },
    sdf: sdf
  };
})();
