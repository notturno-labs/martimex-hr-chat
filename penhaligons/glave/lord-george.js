// The Tragedy of Lord George: zlatna glava jelena (red deer) s velikim razgranatim rogovljem.
// Glava je modelirana simetrično u vlastitom koordinatnom sustavu (x = lijevo jelena,
// y gore, z naprijed prema njušci, ishodište u sredini lubanje), pa okrenuta udesno
// (pogled udesno-dolje) i postavljena na dugi vrat iz ovratnika. Rogovlje i uši su
// zadani izravno u px fotografije (x, y s fotografije, dubina z iz okvira rogovlja).
// Rogovlje: vitke cijevi (Catmull-Rom niz zaobljenih stožaca) koje se sužavaju prema vrhu;
// središnje linije i polumjeri izmjereni na uvećanoj fotografiji (grane ~r 9 pri dnu, parošci
// r 6 -> 4), dubina: grane idu gore, van i malo natrag, parošci naprijed prema licu, tako da
// je rog razgranat i s boka. Na dnu svakog roga kvrgava ruža (vijenac).
(function () {
  const S = PEN.sdf, D2R = Math.PI / 180;
  const sqrt = Math.sqrt, abs = Math.abs, min = Math.min, max = Math.max;
  function sat(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smin(a, b, k) { const h = sat(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); }
  function smax(a, b, k) { return -smin(-a, -b, k); }
  function len3(x, y, z) { return sqrt(x * x + y * y + z * z); }
  // elipsoid s pouzdanom unutrašnjošću
  function el(x, y, z, cx, cy, cz, rx, ry, rz) {
    x -= cx; y -= cy; z -= cz;
    const k0 = sqrt(x * x / (rx * rx) + y * y / (ry * ry) + z * z / (rz * rz));
    const k1 = sqrt(x * x / (rx * rx * rx * rx) + y * y / (ry * ry * ry * ry) + z * z / (rz * rz * rz * rz));
    const rm = min(rx, ry, rz);
    if (k1 === 0) return -rm;
    const d = k0 * (k0 - 1) / k1;
    return k0 < 1 ? max(d, (k0 - 1) * rm) : d;
  }
  function kap(x, y, z, ax, ay, az, bx, by, bz, r) {
    const pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
    const h = sat((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz));
    return len3(pax - bax * h, pay - bay * h, paz - baz * h) - r;
  }
  // ── glatka cijev: Catmull-Rom kroz točke [x, y, z, r], n odsječaka po rasponu (zaobljeni stošci)
  function cr(p0, p1, p2, p3, t) { return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t); }
  function cijev(P, n) {
    const seg = [], m = P.length;
    let prev = null;
    for (let i = 0; i < m - 1; i++) {
      const p0 = P[max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[min(m - 1, i + 2)];
      for (let k = (i === 0 ? 0 : 1); k <= n; k++) {
        const t = k / n, q = [0, 1, 2, 3].map(function (j) { return cr(p0[j], p1[j], p2[j], p3[j], t); });
        if (prev) {
          const bx = q[0] - prev[0], by = q[1] - prev[1], bz = q[2] - prev[2], l2 = bx * bx + by * by + bz * bz;
          let rr = prev[3] - q[3];
          if (rr * rr > 0.9 * l2) rr = Math.sign(rr) * sqrt(0.9 * l2);           // ne-degenerirani stožac
          seg.push({ ax: prev[0], ay: prev[1], az: prev[2], bx: bx, by: by, bz: bz, l2: l2, rr: rr, a2: l2 - rr * rr, il2: 1 / l2, ra: prev[3], rb: prev[3] - rr });
        }
        prev = q;
      }
    }
    // obuhvatna kutija
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    seg.forEach(function (g) {
      [[g.ax, g.ay, g.az, g.ra], [g.ax + g.bx, g.ay + g.by, g.az + g.bz, g.rb]].forEach(function (p) {
        x0 = min(x0, p[0] - p[3]); x1 = max(x1, p[0] + p[3]); y0 = min(y0, p[1] - p[3]); y1 = max(y1, p[1] + p[3]); z0 = min(z0, p[2] - p[3]); z1 = max(z1, p[2] + p[3]);
      });
    });
    return { seg: seg, b: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2] };
  }
  function cijevD(x, y, z, C) {
    const seg = C.seg;
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
  function kutijaD(x, y, z, b) {
    const dx = abs(x - b[0]) - b[3], dy = abs(y - b[1]) - b[4], dz = abs(z - b[2]) - b[5];
    return Math.hypot(max(dx, 0), max(dy, 0), max(dz, 0)) + min(max(dx, dy, dz), 0);
  }

  // ── poza glave (izmjerena s fotografije: oko, nos, rožišta)
  const PZ = PEN._lgPoza || {};
  const YAW = (PZ.yaw || 45) * D2R, PITCH = (PZ.pitch || 23) * D2R, ROLL = (PZ.roll || 0) * D2R, SC = PZ.sc || 1.37;
  const PIV = PZ.piv || [9.5, 474, -10];
  const BEZ = !!PZ.bez;
  const cy = Math.cos(YAW), sy = Math.sin(YAW), cp = Math.cos(PITCH), sp = Math.sin(PITCH), cr_ = Math.cos(ROLL), sr = Math.sin(ROLL);
  function mul(A, B) { const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j]; return C; }
  const R = mul(mul([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], [[1, 0, 0], [0, cp, -sp], [0, sp, cp]]), [[cr_, -sr, 0], [sr, cr_, 0], [0, 0, 1]]);
  function uSvijet(p) { return [PIV[0] + SC * (R[0][0] * p[0] + R[0][1] * p[1] + R[0][2] * p[2]), PIV[1] + SC * (R[1][0] * p[0] + R[1][1] * p[1] + R[1][2] * p[2]), PIV[2] + SC * (R[2][0] * p[0] + R[2][1] * p[1] + R[2][2] * p[2])]; }

  // ── lice i lubanja: presjeci duž z (lokalno) [z, vrh, dno, širina gore, u sredini, dolje, eksponent]
  const PRESJECI = [
    [-34, 12, -6, 6, 7, 6, 2],
    [-29, 20, -22, 12, 14, 12, 2.2],
    [-22, 24, -35, 15.5, 18, 14.5, 2.4],
    [-14, 26, -41, 17.5, 20.5, 15, 2.5],
    [-4, 26, -42, 18.5, 21.5, 15, 2.5],
    [6, 24.5, -41, 19.5, 22, 14.5, 2.6],
    [16, 21, -39.5, 21, 22.5, 13.5, 3],
    [28, 15, -38, 21, 21, 12.5, 3.1],
    [40, 8.5, -37, 16, 17, 11.5, 3],
    [51, 2, -36.5, 11.5, 13.5, 10.5, 2.7],
    [60, -4, -36.5, 10.5, 12.5, 10, 2.5],
    [66.5, -9, -34, 9.5, 11.2, 9, 2.4],
    [71, -13, -30, 7, 8, 7, 2]
  ];
  const PZ0 = -34, PZ1 = 71, TAB = [];
  (function () {
    const P = PRESJECI, n = P.length;
    for (let z = PZ0; z <= PZ1; z += 1) {
      let i = 0;
      while (i < n - 2 && z > P[i + 1][0]) i++;
      const A = P[max(0, i - 1)], B = P[i], C = P[i + 1], E = P[min(n - 1, i + 2)];
      const t = sat((z - B[0]) / (C[0] - B[0]));
      const row = [];
      for (let k = 1; k < 7; k++) row.push(cr(A[k], B[k], C[k], E[k], t));
      TAB.push(row);
    }
  })();
  function lice(x, y, z) {
    const zz = min(max(z, PZ0), PZ1) - PZ0, i = min(TAB.length - 2, Math.floor(zz)), t = zz - i;
    const A = TAB[i], B = TAB[i + 1];
    const yt = A[0] + (B[0] - A[0]) * t, yb = A[1] + (B[1] - A[1]) * t;
    const wT = A[2] + (B[2] - A[2]) * t, wM = A[3] + (B[3] - A[3]) * t, wB = A[4] + (B[4] - A[4]) * t, n = A[5] + (B[5] - A[5]) * t;
    const yc = (yt + yb) / 2, h = (yt - yb) / 2, ym = yb + 0.42 * (yt - yb);
    const w = y > ym ? wM + (wT - wM) * sat((y - ym) / (yt - ym)) : wM + (wB - wM) * sat((ym - y) / (ym - yb));
    const ex = abs(x) / w, ey = abs(y - yc) / h;
    const e = Math.pow(Math.pow(ex, n) + Math.pow(ey, n), 1 / n);
    const d2 = (e - 1) * min(w, h) * 0.85;
    const dz = max(PZ0 + 1 - z, z - PZ1 + 1);
    return smax(d2, dz, 4);
  }
  // oči, obrve, suzne jamice, nosnice, usta
  const OKO = (function () { // središte oka (lokalno)
    const nn = [0.85, 0.3, 0.42], l = len3(nn[0], nn[1], nn[2]), n = nn.map(function (t) { return t / l; });
    let u = [-n[2], 0.15, n[0]]; const ul = len3(u[0], u[1], u[2]); u = u.map(function (t) { return t / ul; });
    const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
    return { c: [19.6, 17.6, 22.5], n: n, u: u, v: v[1] < 0 ? v.map(function (t) { return -t; }) : v };
  })();
  function glava(x, y, z) {
    const ax = abs(x);
    let d = lice(x, y, z);
    // lubanja (tjeme između rogova) i obrazni mišić (žvačni)
    d = smin(d, el(ax, y, z, 0, 13, -7, 20, 13, 18), 7);
    d = smin(d, el(ax, y, z, 13.5, -22, -7, 8, 15, 17), 7);
    // nadočni luk i očna izbočina
    d = smin(d, kap(ax, y, z, 14, 25.5, 4, 20.5, 23.5, 22, 3.3), 5);
    d = smin(d, el(ax, y, z, 17.5, 17, 16, 6, 8, 9.5), 4);
    // jagodična kost (zigomatični luk) ispod oka
    d = smin(d, kap(ax, y, z, 19.2, 11.5, 13, 16.8, 9.5, 33, 3.1), 5);
    // facijalni greben od oka prema naprijed
    d = smin(d, kap(ax, y, z, 17.5, 5, 15, 15, -8, 40, 1.2), 5);
    // nosni jastučić (vrh njuške)
    d = smin(d, el(ax, y, z, 0, -16.5, 67.5, 7.5, 6.5, 4.6), 3);
    // brada
    d = smin(d, el(ax, y, z, 0, -34.5, 61, 7, 4, 8.5), 3);
    // donja usna
    d = smin(d, kap(ax, y, z, 0, -30.8, 70.2, 5.5, -30.2, 65.5, 2.7), 2);
    // oko: bademasta duplja (kapci su njezin rub) i jabučica u njoj
    {
      const E = OKO, px = ax - E.c[0], py = y - E.c[1], pz = z - E.c[2];
      if (px * px + py * py + pz * pz < 260) {
        const n = px * E.n[0] + py * E.n[1] + pz * E.n[2], u = px * E.u[0] + py * E.u[1] + pz * E.u[2], v = px * E.v[0] + py * E.v[1] + pz * E.v[2];
        const d0 = d;
        // duplja (badem), jabučica, kapci kao prsten oko badema (gornji deblji)
        const badem = el(u, v, n, 0.3, 0, 1.6, 7.6, 4.2, 4.4);
        d = smax(d, -max(badem, -(d0 + 3.2)), 1.0);
        d = smin(d, el(u, v, n, 0, -0.1, -2.4, 5.8, 4.6, 4.9), 0.6);
        const eu = (u - 0.3) / 7.4, ev = v / 4.0, er = sqrt(eu * eu + ev * ev), e2 = (er - 1) * 4.0;
        const kapak = sqrt(e2 * e2 + (n - 1.0) * (n - 1.0)) - (1.0 + 0.6 * sat(v / 3));
        d = smin(d, kapak, 0.9);
      }
    }
    // suzna jamica (preorbitalna žlijezda) ispred oka
    if (ax > 10 && z > 24 && z < 44 && y < 20 && y > 2) {
      const d0 = d;
      d = smax(d, -max(kap(ax, y, z, 18.6, 14, 31, 16, 8.5, 38, 2.2), -(d0 + 1.0)), 2.2);
    }
    // nosnice i usna pukotina
    if (z > 40) {
      const d0 = d;
      if (z > 55) {
        // nosnica kao zarez: od prednjeg ruba nosa unatrag i dolje
        // nosno krilce (rub nosnice) pa ovalna nosnica koja gleda prema van i naprijed
        d = smin(d, kap(ax, y, z, 8.2, -14.6, 67.2, 10.8, -20.2, 61.3, 2.8) + 0.6, 2.4);
        const dn = min(kap(ax, y, z, 9.4, -15.2, 67.6, 11.9, -20.0, 61.6, 1.7), kap(ax, y, z, 7.2, -14, 69.5, 9.4, -15.2, 67.6, 1.0));
        d = smax(d, -max(dn, -(d0 + 3.0)), 0.7);
      }
      if (y < -21 && y > -34) d = smax(d, -max(min(kap(ax, y, z, 12.5, -28.4, 42, 10.8, -27, 60, 0.9), kap(ax, y, z, 10.8, -27, 60, 4, -25.6, 69.5, 0.8)), -(d0 + 1.4)), 0.6);
    }
    return d;
  }

  // ── rožišta (lokalno) i rogovlje (u px fotografije)
  const ROZ_L = uSvijet([-18.5, 19, -14]), ROZ_D = uSvijet([18.5, 19, -11]);
  // okvir rogovlja: ravnina skrenuta TA udesno (prema smjeru njuške); v = dubina okomito na ravninu
  // (v > 0 naprijed, prema licu jelena; v < 0 natrag). Grane rastu natrag i van, parošci naprijed.
  const TA = (PZ.ta || 26) * D2R, cA = Math.cos(TA), sA = Math.sin(TA);
  const XC = (ROZ_L[0] + ROZ_D[0]) / 2, ZC = (ROZ_L[2] + ROZ_D[2]) / 2;
  // grane: točke [x, y, r] s fotografije; dubina: v = v0 + kv·s + kv2·s² (s = duljina luka od početka grane)
  const RG = PZ.rg || [
    { n: 'L-beam', v0: 0, kv: -0.3, kv2: 0, p: [[-12, 510.5, 10.2], [-18, 525.5, 9.9], [-26.5, 538, 9], [-36.5, 548, 8.5], [-44.5, 559.5, 8.3], [-48.5, 573, 7.8], [-53.5, 585.5, 7.1]] },
    { n: 'L-brow', par: 'L-beam', kv: 0.9, kv2: -0.008, p: [[-14, 540, 5.6], [-16, 547, 5.3], [-26, 556.5, 5], [-37, 563.5, 4.7], [-46.5, 569.5, 4.1]] },
    { n: 'L-T1', par: 'L-beam', kv: -0.15, p: [[-56.5, 565, 6.3], [-70, 572, 6.3], [-81, 582.5, 6.2], [-89, 593.5, 5.8], [-92.2, 607.5, 5.3], [-93.8, 621.5, 4.6], [-95, 635.5, 3.4]] },
    { n: 'L-T2', par: 'L-beam', kv: 0.5, p: [[-62.5, 580, 5.6], [-59.5, 595, 5.2], [-58.3, 611, 5.2], [-58, 627, 4.8]] },
    { n: 'L-T3', par: 'L-beam', kv: -0.2, kv2: 0.006, p: [[-46, 581.5, 7], [-46, 603, 7], [-39.5, 622, 6.5], [-35, 643, 6], [-31, 665.5, 5]] },
    { n: 'L-T4', par: 'L-T3', kv: 0.6, p: [[-35.5, 600, 5.7], [-27.5, 610, 5.7], [-19, 618.5, 5.3], [-10, 628.5, 4.8]] },
    { n: 'R-beam', v0: 0, kv: -0.25, kv2: 0.0012, p: [[22.5, 511.5, 9.6], [27.5, 528, 9], [32, 543, 8], [39, 555.5, 6.6], [44.5, 565.5, 6.6], [50.5, 574.5, 7.4], [59.5, 581.5, 8.2], [74.3, 584, 8.2], [88.4, 590, 8.4], [104.3, 597.5, 8.6], [120.3, 604.5, 8.4], [134, 614.1, 7.6], [143, 627.2, 7], [145, 644, 5.6], [145.2, 664.2, 5.3], [143.5, 684.5, 4.2]] },
    { n: 'R-hook', par: 'R-beam', kv: 0.9, p: [[40.5, 544.5, 5.8], [50, 545.5, 5.8], [59, 545.5, 5.7], [67.5, 546.5, 5.3], [73, 550.5, 5], [78, 556, 4.5]] },
    { n: 'R-T', par: 'R-beam', kv: 0.35, p: [[46, 579, 6.7], [38.5, 594, 6.7], [31, 607, 6.2], [27.5, 620, 5.8], [27.2, 632, 5.3], [25.8, 639, 3.7]] },
    { n: 'R-C2', par: 'R-beam', kv: 0.1, p: [[111.5, 609.5, 5.8], [116.5, 623.5, 5.5], [116.5, 638.5, 5.2], [117.8, 653.5, 4.7]] },
    { n: 'R-C3', par: 'R-beam', kv: 0.9, p: [[136, 617, 5.8], [126.4, 627.4, 5.2], [117, 638, 4.5]] }
  ];
  let PO = null;               // točke grana u px (za ruže i za alate)
  const GRANE = (function () {
    const po = {};
    RG.forEach(function (g) {
      const P = g.p, v = [];
      let v0 = g.v0 || 0;
      if (g.par) {
        const Q = po[g.par];
        let bi = 0, bd = 1e9;
        Q.forEach(function (q, i) { const dd = Math.hypot(q.x - P[0][0], q.y - P[0][1]); if (dd < bd) { bd = dd; bi = i; } });
        v0 = Q[bi].v;
      }
      let s = 0; v.push(v0);
      for (let i = 1; i < P.length; i++) { s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); v.push(v0 + (g.kv || 0) * s + (g.kv2 || 0) * s * s); }
      po[g.n] = P.map(function (p, i) {
        const u = (p[0] - XC - v[i] * sA) / cA;
        return { x: p[0], y: p[1], z: ZC - u * sA + v[i] * cA, r: p[2], v: v[i] };
      });
      // vrh: zaobljen, malo produžen i stanjen
      const Q = po[g.n], m = Q.length, A = Q[m - 2], B = Q[m - 1];
      const dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z, l = len3(dx, dy, dz), e = g.par ? 2.2 : 1.8;
      Q.push({ x: B.x + dx / l * e, y: B.y + dy / l * e, z: B.z + dz / l * e, r: B.r * 0.72, v: B.v });
    });
    // korijen grane spušten u rožište
    ['L-beam', 'R-beam'].forEach(function (n) {
      const Z = n[0] === 'L' ? ROZ_L : ROZ_D, P = po[n];
      P.unshift({ x: Z[0], y: Z[1] - 4, z: Z[2], r: 8.8, v: 0 });
    });
    PO = po;
    const out = [];
    RG.forEach(function (g) { out.push(cijev(po[g.n].map(function (q) { return [q.x, q.y, q.z, q.r]; }), 3)); });
    return out;
  })();
  // vijenac (ruža) pri dnu svakog roga
  // ubrzanje: svaka grana podijeljena u komade od po 4 odsječka s obuhvatnom kutijom; za zadani
  // y (cijeli vodoravni rez ima isti y) pamte se samo komadi koji sežu do te visine (± 10 px)
  function kutijaOd(seg) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    seg.forEach(function (g) {
      [[g.ax, g.ay, g.az, g.ra], [g.ax + g.bx, g.ay + g.by, g.az + g.bz, g.rb]].forEach(function (p) {
        x0 = min(x0, p[0] - p[3]); x1 = max(x1, p[0] + p[3]); y0 = min(y0, p[1] - p[3]); y1 = max(y1, p[1] + p[3]); z0 = min(z0, p[2] - p[3]); z1 = max(z1, p[2] + p[3]);
      });
    });
    return [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2];
  }
  const KOMADI = GRANE.map(function (G) {
    const K = [];
    for (let i = 0; i < G.seg.length; i += 4) { const sg = G.seg.slice(i, i + 4); K.push({ seg: sg, b: kutijaOd(sg) }); }
    return K;
  });
  const MY = 18;
  let zadnjiY = NaN, aktivni = [];
  function rogovlje(x, y, z) {
    if (y !== zadnjiY) {
      zadnjiY = y; aktivni = [];
      KOMADI.forEach(function (K) {
        const A = K.filter(function (k) { return abs(y - k.b[1]) <= k.b[4] + MY; });
        if (A.length) aktivni.push(A);
      });
    }
    let d = MY;
    for (let i = 0; i < aktivni.length; i++) {
      const A = aktivni[i];
      let dg = MY;
      for (let j = 0; j < A.length; j++) {
        const k = A[j], db = kutijaD(x, y, z, k.b);
        if (db >= dg) continue;
        const di = cijevD(x, y, z, k);
        if (di < dg) dg = di;
      }
      if (dg < MY) d = d === MY ? dg : smin(d, dg, 2.5);
    }
    return d;
  }
  const RG_B = (function () {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    GRANE.forEach(function (G) { const b = G.b; x0 = min(x0, b[0] - b[3]); x1 = max(x1, b[0] + b[3]); y0 = min(y0, b[1] - b[4]); y1 = max(y1, b[1] + b[4]); z0 = min(z0, b[2] - b[5]); z1 = max(z1, b[2] + b[5]); });
    return [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2];
  })();

  // ── uši (u px fotografije): baza, vrh, smjer udubine, poluširina, debljina
  function uhoDef(B, T, N, w, t, sm) {
    const ax = [T[0] - B[0], T[1] - B[1], T[2] - B[2]], L = len3(ax[0], ax[1], ax[2]);
    const a = ax.map(function (v) { return v / L; });
    let n = N.slice(); const dn = n[0] * a[0] + n[1] * a[1] + n[2] * a[2];
    n = [n[0] - dn * a[0], n[1] - dn * a[1], n[2] - dn * a[2]]; const nl = len3(n[0], n[1], n[2]); n = n.map(function (v) { return v / nl; });
    const b = [a[1] * n[2] - a[2] * n[1], a[2] * n[0] - a[0] * n[2], a[0] * n[1] - a[1] * n[0]];
    return { B: B, a: a, n: n, b: b, L: L, w: w, t: t, sm: sm || 0.4, c: [(B[0] + T[0]) / 2, (B[1] + T[1]) / 2, (B[2] + T[2]) / 2] };
  }
  const UHO_L = uhoDef(uSvijet([-19, 3, -27]), [-70, 507, 22], [0.45, -0.1, 1], 19.5, 4.4, 0.6);
  const UHO_D = uhoDef([31, 495, -25], [85, 533, -22], [-0.3, 0.1, 1], 15, 4.2, 0.6);
  function uho(x, y, z, U) {
    const px = x - U.B[0], py = y - U.B[1], pz = z - U.B[2];
    const s = px * U.a[0] + py * U.a[1] + pz * U.a[2];          // duž uha
    const q = px * U.b[0] + py * U.b[1] + pz * U.b[2];          // poprijeko
    const h = px * U.n[0] + py * U.n[1] + pz * U.n[2];          // prema udubini
    const L = U.L, u = s / L;
    // list: najšire na 40 %, šiljast vrh
    const sm = U.sm, w = U.w * sqrt(max(0, sat(u / sm * 0.64 + 0.25))) * (1 - 0.75 * sat((u - sm) / (1 - sm)) * sat((u - sm) / (1 - sm))) + 0.6;
    const hh = h - 0.14 * q * q / U.w;                           // zakrivljenost: rubovi savijeni prema udubini (čaška)
    const vanj = el(q, s, hh, 0, L * 0.47, 0, w, L * 0.53, U.t);
    const unu = el(q, s, hh, 0, L * 0.56, U.t * 0.8, w * 0.76, L * 0.42, U.t * 1.05);
    return smax(vanj, -unu, 1.2);
  }

  // ── vrat: [y, središte x, središte z, poluos poprijeko, poluos naprijed-natrag, okret (°)];
  //    pri ovratniku okrugao, prema glavi bočno stisnut i okrenut kao glava
  const VRAT = [[328, 0, 0, 55, 55, 0], [360, 0, 0, 53.5, 54, 10], [390, -0.5, -1, 50, 52, 25], [420, -3, -5, 45, 50, 40],
    [450, -4.5, -11, 38, 45, 45], [475, -10, -16, 30, 34, 45], [495, -14, -24, 20, 22, 45], [510, -17, -30, 8, 10, 45]];
  // kosi vrh vrata: sprijeda (ispod brade) nisko, straga (zatiljak) visoko
  const KV = 1.36, KN = 1 / sqrt(1 + KV * KV);
  const VY0 = 328, VY1 = 510, VT = [];
  (function () {
    const P = VRAT, n = P.length;
    for (let y = VY0; y <= VY1; y++) {
      let i = 0;
      while (i < n - 2 && y > P[i + 1][0]) i++;
      const A = P[max(0, i - 1)], B = P[i], C = P[i + 1], E = P[min(n - 1, i + 2)], t = sat((y - B[0]) / (C[0] - B[0]));
      const r = [1, 2, 3, 4, 5].map(function (k) { return cr(A[k], B[k], C[k], E[k], t); });
      VT.push([r[0], r[1], r[2], r[3], Math.cos(r[4] * D2R), Math.sin(r[4] * D2R)]);
    }
  })();
  function vrat(x, y, z) {
    const fy = min(VT.length - 1.001, max(0, y - VY0)), i = Math.floor(fy), t = fy - i, A = VT[i], B = VT[i + 1];
    const cx = A[0] + (B[0] - A[0]) * t, cz = A[1] + (B[1] - A[1]) * t, ra = A[2] + (B[2] - A[2]) * t, rb = A[3] + (B[3] - A[3]) * t;
    const c = A[4] + (B[4] - A[4]) * t, s_ = A[5] + (B[5] - A[5]) * t;
    const dx = x - cx, dz = z - cz;
    const l = c * dx - s_ * dz, f = s_ * dx + c * dz;           // poprijeko (0.71,0,-0.71), naprijed (0.71,0,0.71) pri 45°
    const e = sqrt(l * l / (ra * ra) + f * f / (rb * rb));
    const dr = (e - 1) * min(ra, rb);
    const dy = max(VY0 - y, y - VY1);
    const dc = Math.min(Math.max(dr, dy), 0) + Math.hypot(Math.max(dr, 0), Math.max(dy, 0));
    const fw = 0.7071 * (x + z), g = (y + KV * fw - 450.8) * KN;
    return smax(dc, g, 10);
  }

  // ── ubrzanje rezova: rezač zove sdf tisućama puta s istim y; nakon 64 takva poziva za taj y
  //    izračuna se gruba mreža (6 px) pa se točke daleko od plohe (> 14 px) odmah vrate s donjom
  //    granicom udaljenosti (d(c) - 2 · polovica dijagonale ćelije), sve blizu plohe računa se točno
  const OK = { x: 154, yMin: 330, yMax: 694, z: 105 };
  const CEL = 6, GNX = Math.ceil(2 * OK.x / CEL), GNZ = Math.ceil(2 * OK.z / CEL);
  let gY = NaN, gN = 0, mreza = null;
  // ruža (vijenac) na dnu svakog roga: kvrgavi prsten oko grane malo iznad lubanje
  const RUZE = ['L-beam', 'R-beam'].map(function (n) {
    const P = PO[n], A = P[1], B = P[2], t = 0.35;
    const c = [A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t, A.z + (B.z - A.z) * t];
    let a = [B.x - A.x, B.y - A.y, B.z - A.z]; const l = len3(a[0], a[1], a[2]); a = a.map(function (v) { return v / l; });
    let e1 = [a[1], -a[0], 0]; const l1 = len3(e1[0], e1[1], e1[2]); e1 = e1.map(function (v) { return v / l1; });
    const e2 = [a[1] * e1[2] - a[2] * e1[1], a[2] * e1[0] - a[0] * e1[2], a[0] * e1[1] - a[1] * e1[0]];
    return { c: c, a: a, e1: e1, e2: e2, R: A.r + (B.r - A.r) * t + 0.2, r: 2.3 };
  });
  function ruza(x, y, z, U) {
    const px = x - U.c[0], py = y - U.c[1], pz = z - U.c[2];
    const h = px * U.a[0] + py * U.a[1] + pz * U.a[2];
    const u = px * U.e1[0] + py * U.e1[1] + pz * U.e1[2], v = px * U.e2[0] + py * U.e2[1] + pz * U.e2[2];
    const rad = sqrt(u * u + v * v), th = Math.atan2(v, u);
    const rr = U.r * (1 + 0.28 * Math.sin(9 * th) * Math.cos(2.3 * h));
    return sqrt((rad - U.R) * (rad - U.R) + h * h) - rr;
  }
  function puna(x, y, z) {
    const dbr = kutijaD(x, y, z, RG_B);
    if (y > 550) return dbr < 3 ? rogovlje(x, y, z) : dbr;      // iznad glave: samo rogovlje
    const dn = vrat(x, y, z);
    if (dn < -4) return dn;
    // glava (lokalno)
    const px = (x - PIV[0]) / SC, py = (y - PIV[1]) / SC, pz = (z - PIV[2]) / SC;
    const qx = R[0][0] * px + R[1][0] * py + R[2][0] * pz, qy = R[0][1] * px + R[1][1] * py + R[2][1] * pz, qz = R[0][2] * px + R[1][2] * py + R[2][2] * pz;
    let d = dn;
    const ob = (len3(qx, (qy + 6) / 1.1, (qz - 20) / 1.3) - 44) * SC;
    // spoj s vratom: straga širok, ispod čeljusti uzak (vidi se brazda čeljusti)
    if (ob < 28) d = smin(d, glava(qx, qy, qz) * SC, 15 - 12.5 * sat((qz + 12) / 26));
    else d = min(d, ob);
    if (BEZ) return d;
    // uši
    for (let i = 0; i < 2; i++) {
      const U = i ? UHO_D : UHO_L, du = len3(x - U.c[0], y - U.c[1], z - U.c[2]) - U.L * 0.6 - 3;
      if (du < 3) d = smin(d, uho(x, y, z, U), 3); else d = min(d, du);
    }
    // rogovlje
    if (dbr < 3) { const da = rogovlje(x, y, z); if (da < MY) d = smin(d, da, 3); else d = min(d, da); } else d = min(d, dbr);
    for (let i = 0; i < 2; i++) {
      const U = RUZE[i], db = len3(x - U.c[0], y - U.c[1], z - U.c[2]) - U.R - 5;
      if (db < 2) d = smin(d, ruza(x, y, z, U), 1.6);
    }
    return d;
  }
  function graditiMrezu(y) {
    const M = new Float32Array(GNX * GNZ);
    for (let i = 0; i < GNX; i++) for (let j = 0; j < GNZ; j++) M[i * GNZ + j] = puna(-OK.x + CEL * (i + 0.5), y, -OK.z + CEL * (j + 0.5));
    return M;
  }

  PEN.glave['lord-george'] = {
    ime: 'Lord George', podnaslov: 'The Tragedy of',
    staklo: ['#675932', '#a8a46b'],
    okvir: OK,
    _R: R, _uSvijet: uSvijet, _GRANE: GRANE, _PO: PO, _glava: glava,
    sdf: function (x, y, z) {
      if (y !== gY) { gY = y; gN = 0; mreza = null; }
      else if (mreza === null && ++gN > 64) mreza = graditiMrezu(y);
      if (mreza !== null) {
        const i = Math.floor((x + OK.x) / CEL), j = Math.floor((z + OK.z) / CEL);
        if (i >= 0 && j >= 0 && i < GNX && j < GNZ) { const v = mreza[i * GNZ + j]; if (v > 14) return v - 8.5; }
      }
      return puna(x, y, z);
    }
  };
})();
