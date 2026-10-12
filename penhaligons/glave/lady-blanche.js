// The Revenge of Lady Blanche: zlatna glava pantere na vratu.
// Glava je modelirana simetrično u vlastitom koordinatnom sustavu
// (x = lijevo pantere / desno gledatelja, y gore, z naprijed, središte lubanje),
// pa okrenuta (pogled udesno-dolje) i postavljena na vrat iz ovratnika.
(function () {
  const S = PEN.sdf;
  const D2R = Math.PI / 180;
  // poza (izmjerena s fotografije)
  const YAW = 35.5 * D2R, PITCH = 25 * D2R, ROLL = 10 * D2R, SC = 1.3;
  const PIV = [13.5, 446, 20];
  const cy = Math.cos(YAW), sy = Math.sin(YAW), cp = Math.cos(PITCH), sp = Math.sin(PITCH), cr = Math.cos(ROLL), sr = Math.sin(ROLL);
  function mul(A, B) { const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j]; return C; }
  const R = mul(mul([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], [[1, 0, 0], [0, cp, -sp], [0, sp, cp]]), [[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]]);
  const T00 = R[0][0], T01 = R[1][0], T02 = R[2][0], T10 = R[0][1], T11 = R[1][1], T12 = R[2][1], T20 = R[0][2], T21 = R[1][2], T22 = R[2][2];

  // elipsoid (Inigo Quilez) s pouzdanijom unutrašnjosti: duboko unutra IQ procjena teži
  // nuli, pa bi plitki urezi mjereni od plohe (d0 + dubina) probili kroz cijelu masu
  function el(p, c, r) {
    const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
    const k0 = Math.sqrt(x * x / (r[0] * r[0]) + y * y / (r[1] * r[1]) + z * z / (r[2] * r[2]));
    const k1 = Math.sqrt(x * x / (r[0] * r[0] * r[0] * r[0]) + y * y / (r[1] * r[1] * r[1] * r[1]) + z * z / (r[2] * r[2] * r[2] * r[2]));
    const rm = Math.min(r[0], r[1], r[2]);
    if (k1 === 0) return -rm;
    const d = k0 * (k0 - 1) / k1;
    return k0 < 1 ? Math.min(d, (k0 - 1) * rm) : d;
  }
  const kg = S.kugla, kap = S.kapsula, st = S.stozac, smin = S.smin, smax = S.smax, len3 = S.len3;

  // ── uho: debela zaobljena ljuska, sprijeda udubljena (lokalno, sx = -1 / 1)
  // uši nisu posve simetrične (prilagođene obrisu s fotografije): svako ima svoj položaj,
  // nagib (u ravnini lica), okret lica van i veličinu; L = desno uho pantere (bliže
  // gledatelju, lijevo na slici), D = lijevo uho pantere (iza, gleda više naprijed)
  const UHO = {
    L: { c: [-54, 28, -12], nagib: 26 * D2R, van: 35 * D2R, r: [14.5, 15.5, 6.5] },
    D: { c: [47.5, 24, -10], nagib: 22 * D2R, van: 12 * D2R, r: [13.5, 15, 6.5] }
  };
  for (const k of ['L', 'D']) { const u = UHO[k]; u.ca = Math.cos(u.nagib); u.sa = Math.sin(u.nagib); u.cb = Math.cos(u.van); u.sb = Math.sin(u.van); }
  function uho(x, y, z, sx) {
    const U = sx < 0 ? UHO.L : UHO.D, C = U.c, dx = x - C[0], dy = y - C[1], dz = z - C[2];
    const x1 = U.ca * dx - sx * U.sa * dy, y1 = sx * U.sa * dx + U.ca * dy;     // nagib van
    const x2 = U.cb * x1 - sx * U.sb * dz, z2 = sx * U.sb * x1 + U.cb * dz;      // lice uha van
    // oblik: zaobljeni "D" (širi pri dnu), sprijeda udubina
    const p = [x2, y1, z2], r = U.r;
    const vanj = el(p, [0, 0, 0], r);
    const unu = el(p, [0, 2.7, 4.5], [r[0] - 4, r[1] - 3.7, 5.4]);
    return smax(vanj, -unu, 1.8);
  }

  // ── oko (desno od gledatelja, x > 0): središte, osi badema (u duž, v okomito) i smjer pogleda w
  const OKO = (function () {
    const yaw = 20 * D2R, nag = 10 * D2R, gore = 15 * D2R;
    const w = [Math.sin(yaw) * Math.cos(gore), Math.sin(gore), Math.cos(yaw) * Math.cos(gore)];
    const u0 = [Math.cos(yaw), 0, -Math.sin(yaw)];
    let v0 = [w[1] * u0[2] - w[2] * u0[1], w[2] * u0[0] - w[0] * u0[2], w[0] * u0[1] - w[1] * u0[0]];
    const vl = Math.hypot(v0[0], v0[1], v0[2]); v0 = v0.map(function (t) { return t / vl; });
    const c = Math.cos(nag), s = Math.sin(nag);
    return { c: [27, 17.5, 37.5], w: w,
      u: [c * u0[0] + s * v0[0], c * u0[1] + s * v0[1], c * u0[2] + s * v0[2]],
      v: [-s * u0[0] + c * v0[0], -s * u0[1] + c * v0[1], -s * u0[2] + c * v0[2]] };
  })();

  // udaljenost u ravnini (x, y) do izlomljene crte
  const OBRVA = [[9, 22], [21, 29], [35, 28], [45, 19]];
  function dCrta(x, y, P) {
    let m = Infinity;
    for (let i = 0; i < P.length - 1; i++) {
      const ax = P[i][0], ay = P[i][1], bx = P[i + 1][0] - ax, by = P[i + 1][1] - ay;
      const h = PEN.sat(((x - ax) * bx + (y - ay) * by) / (bx * bx + by * by));
      const dx = x - ax - bx * h, dy = y - ay - by * h, dd = dx * dx + dy * dy;
      if (dd < m) m = dd;
    }
    return Math.sqrt(m);
  }

  // ── usta (lokalno): os njuške, kut kuta usta, pola visine otvora, linija usana
  const UST = (function () {
    const U = { z: 4, tc: 58 * D2R, h: 6.4, y0: -30, dy: 3, usna: 0.45 };
    // položaj zuba po kutu θ na plohi (polumjer r od osi njuške)
    function tocka(th, r, y) { return [r * Math.sin(th), y, U.z + r * Math.cos(th)]; }
    U.og = [tocka(0.42 * U.tc, 50, -20), tocka(0.43 * U.tc, 49, -30)];
    U.dg = [tocka(0.36 * U.tc, 40, -37.5), tocka(0.37 * U.tc, 40.5, -31.5)];
    return U;
  })();

  // ── osnovni oblik glave (lokalno): velike mase bez detalja; iz njega se računa i
  //    polumjer plohe na liniji usana (prema njemu se mjeri dno šupljine usta)
  function oblik(x, y, z) {
    const ax = Math.abs(x), qa = [ax, y, z], q = [x, y, z];
    // lubanja: široka, plosnata odozgo
    let d = el(q, [0, 11, -4], [51.5, 28, 40]);
    // čelo i stop iznad nosa
    d = smin(d, el(q, [0, 16, 24], [32, 18, 26]), 10);
    // unutarnja jezgra (popunjava procjepe između lubanje, njuške i čeljusti)
    d = Math.min(d, el(q, [0, -14, 14], [26, 22, 30]));
    // jagodice i obrazi
    d = smin(d, el(qa, [32, -11, 5], [27, 21, 26]), 16);
    // veliki obrazi (krzno) niz čeljust i ovratnik krzna iza obraza
    d = smin(d, el(qa, [33, -24, 9], [23, 25, 24]), 14);
    // njuška ispred lica
    d = smin(d, el(q, [0, -11, 45], [24, 15, 22]), 8);
    // hrbat nosa (širok, plosnat)
    d = smin(d, st([x * 0.52, y, z], [0, 17, 44], [0, 1, 65], 10.5, 10), 10);
    // nos (trokutasti jastučić)
    d = smin(d, Math.max(el(q, [0, -4, 71], [11, 6.5, 5]), (ax * 0.85 - (y + 13)) * 0.75), 3);
    // jastučići brkova
    d = smin(d, el(qa, [12, -15, 58], [14, 11.5, 9.5]), 7);
    // donja čeljust i brada (puna, zaobljena; brada malo uvučena ispod jastučića)
    d = smin(d, st([x * 1.3, y, z], [0, -35, 8], [0, -34.5, 48], 22, 13.5), 12);
    d = smin(d, el(q, [0, -37.5, 48], [11, 8.5, 9.5]), 10);
    return d;
  }

  // polumjer plohe osnovnog oblika na liniji usana (od osi njuške), tablica po u = θ / θk
  let UST_R = null;
  function ustR(u) {
    if (!UST_R) {
      UST_R = [];
      for (let i = 0; i <= 30; i++) {
        const uu = i / 25, th = uu * UST.tc, yy = UST.y0 + UST.dy * uu * uu;
        let r = 80;
        while (r > 5 && oblik(r * Math.sin(th), yy, UST.z + r * Math.cos(th)) > 0) r -= 0.25;
        UST_R.push(r);
      }
    }
    const f = Math.min(Math.max(u, 0), 1.2) * 25, i = Math.min(Math.floor(f), 29), t = f - i;
    return UST_R[i] * (1 - t) + UST_R[i + 1] * t;
  }

  // ── kanonska glava (lokalno)
  function glava(x, y, z) {
    const ax = Math.abs(x), qa = [ax, y, z], q = [x, y, z];
    let d = oblik(x, y, z);
    // obrve (mekani greben preko plohe): od unutarnjeg kuta oka koso gore i van
    if (ax < 54 && y > 8 && y < 38 && z > 4) {
      const t = dCrta(ax, y, OBRVA) / 6.5;
      if (t < 1) d -= 2.0 * (1 - t * t) * (1 - t * t) * PEN.sat((z - 4) / 14);
    }
    // plitka brazda po sredini čela
    if (ax < 6 && y > 18 && y < 42 && z > 10) {
      const t = ax / 6, k = PEN.sat((y - 18) / 5) * PEN.sat((42 - y) / 9) * PEN.sat((z - 10) / 12);
      d += 1.2 * k * (1 - t * t) * (1 - t * t);
    }
    // oči: bademasta udubina (izvučena duž osi oka), jabučica i rub kapaka
    if (ax > 8 && ax < 46 && y > -2 && y < 32 && z > 20) {
      const ex = ax - OKO.c[0], ey = y - OKO.c[1], ez = z - OKO.c[2];
      const u = OKO.u[0] * ex + OKO.u[1] * ey + OKO.u[2] * ez;
      const v = OKO.v[0] * ex + OKO.v[1] * ey + OKO.v[2] * ez;
      const w = OKO.w[0] * ex + OKO.w[1] * ey + OKO.w[2] * ez;
      // badem se prema van lagano širi (stijenke udubine bez podreza)
      const bad = Math.max(Math.hypot(u, v - 9.5) - 17.5, Math.hypot(u, v + 9.5) - 17.5, -(w + 7)) - 0.6 * w;
      if (bad < 4) {
        // duboka očna duplja (sjena ispod gornjeg kapka) i jabučica koja iz nje
        // izviruje u donjem dijelu; sve mjereno od plohe (d0), bez podreza
        const d0 = d;
        const sjena = 2.6 * PEN.sat((v + 1) / 5);
        const dno = d0 + Math.min(4.2 + sjena + 1.5 * (u / 14.7) * (u / 14.7), 8);
        d = smax(d0, -Math.max(bad, -dno), 0.6);
        // jabučica: kapa koja se diže iz dna duplje, vrh 1.6 px ispod plohe
        const jb = d0 + 1.6 + 3.2 * ((u + 1.5) / 11) * ((u + 1.5) / 11) + 3.2 * ((v + 1.2) / 6.5) * ((v + 1.2) / 6.5);
        d = smin(d, Math.max(jb, bad + 0.2), 1.4);
      }
    }
    // usta: otvorena (režanje) — leća otvora oko okomite osi njuške (x = 0, z = UST.z):
    // kut θ od prednjeg dijela (0) do kuta usta (UST.tc); otvor je najviši u prednjoj
    // trećini, sprijeda ostaje uzak procjep; usne su zaobljeni rub oko otvora; dno
    // šupljine prati plohu (nema skrivenih džepova ispod plohe)
    if (ax < 44 && y < -16 && y > -44 && z > UST.z) {
      const zz = z - UST.z, th = Math.atan2(ax, zz), u = th / UST.tc, u2 = u * u;
      if (u < 1.2) {
        const rr = Math.sqrt(ax * ax + zz * zz);
        // visina otvora: glatka po θ; sprijeda (ispod nosa) su usne zatvorene, otvor se
        // širi prema stranama i zatvara u kutu usta (kao na fotografiji)
        const kh = PEN.sat((u - 0.1) / 0.42), hu = u < 1 ? UST.h * Math.sqrt(1 - u2) * kh * kh * (3 - 2 * kh) : 0;
        const ym = UST.y0 + UST.dy * u2;
        // gornja i donja stijenka otvora vodoravne su u svijetu (glava je nagnuta), pa
        // vodoravni presjeci nikad ne zatvore džep ispod gornje usne
        // (nagib stijenki vrijedi samo u dubini šupljine; izvan plohe osnovnog oblika na liniji
        //  usana, npr. kroz izbočene jastučiće iznad, stijenke ostaju lokalno vodoravne)
        const rs = ustR(u), sx = x < 0 ? -1 : 1, dr = Math.min(Math.max(rr - rs, -14), 4);
        const dyv = (y - ym) + (T01 * sx * Math.sin(th) + T21 * Math.cos(th)) / T11 * dr;
        const g = Math.max(Math.abs(dyv) - hu, (th - UST.tc) * rr);
        if (g < 4) {
          const d0 = d;
          // dno šupljine: okomita ploha na udaljenosti dep ispod plohe osnovnog oblika na
          // liniji usana (rs); jastučići iznad otvora ostaju cijeli (nema odsječenih listića)
          const dep = 2.5 + 10 * Math.min(1, hu / UST.h);
          d = smax(d0, -Math.max(g, rs - dep - rr), 0.9);
          // donja usna: mesnati zaobljeni rub ispod otvora (gornja usna je samo oštar rub jastučića)
          const e = (g - 1.2) / 1.5;
          d -= UST.usna * Math.exp(-e * e) * PEN.sat((d0 + 3) / 3) * PEN.sat((1.12 - u) / 0.15) * PEN.sat(-dyv / 3 + 0.3) * PEN.sat(g / 1.2 + 0.2);
        }
      }
      // očnjaci: gornji vise s usne u prednji dio otvora, donji se dižu s donje usne
      if (ax > 9 && ax < 26 && z > 30 && y > -40 && y < -18) {
        d = smin(d, st(qa, UST.og[0], UST.og[1], 2.6, 0.5), 0.8);
        d = smin(d, st(qa, UST.dg[0], UST.dg[1], 2, 0.45), 1.2);
      }
    }
    // nosnice, filtrum i suzne brazde
    if (ax < 24 && y < 14 && y > -34 && z > 44) {
      // (svi urezi prate plohu: dubina ograničena, nema skrivenih šupljina)
      const d0 = d;
      d = smax(d, -Math.max(kg(qa, [4.2, -8.5, 76], 2.1), -(d0 + 1.8)), 0.8);
      d = smax(d, -Math.max(kap(q, [0, -13.5, 71.5], [0, -22, 68], 1.4), -(d0 + 1.2)), 1);
      d = smax(d, -Math.max(kap(qa, [11, 4, 52], [12, -6, 62], 1.8), -(d0 + 1.0)), 1.2);
    }
    // uši
    {
      const sx = x < 0 ? -1 : 1, C = sx < 0 ? UHO.L.c : UHO.D.c, ob = len3(x - C[0], y - C[1], z - C[2]) - 17;
      if (ob < d + 5) d = smin(d, uho(x, y, z, sx), 5);
    }
    return d;
  }

  // ── vrat: profil po visini [y, z sprijeda, z straga, pola širine, središte x];
  //    grlo se ispod čeljusti povlači unatrag, zatiljak se spaja sa stražnjim dijelom glave
  const VRAT = [[325, 57.5, -57.5, 57.5, -1], [352, 54, -57, 56.8, -1], [365, 42, -55, 56, -1.5], [380, 24, -51, 55.5, -2],
    [400, 18, -45, 55, -2.5], [430, 20, -36, 50, -3], [452, 18, -24, 45, -3], [472, 10, 0, 28, -3]];
  // Catmull-Rom po stupcu k profila
  function crVrat(y, k) {
    let i = 0;
    while (i < VRAT.length - 2 && y > VRAT[i + 1][0]) i++;
    const P1 = VRAT[i], P2 = VRAT[i + 1], P0 = VRAT[Math.max(0, i - 1)], P3 = VRAT[Math.min(VRAT.length - 1, i + 2)];
    const t = PEN.sat((y - P1[0]) / (P2[0] - P1[0])), h = P2[0] - P1[0];
    const m1 = (P2[k] - P0[k]) / (P2[0] - P0[0] || 1) * h, m2 = (P3[k] - P1[k]) / (P3[0] - P1[0] || 1) * h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * P1[k] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * P2[k] + (t3 - t2) * m2;
  }
  function vrat(x, y, z) {
    const zf = crVrat(y, 1), zb = crVrat(y, 2), rx = crVrat(y, 3), cx = crVrat(y, 4);
    const rz = (zf - zb) / 2, cz = (zf + zb) / 2;
    const ex = (x - cx) / rx, ez = (z - cz) / rz, e = Math.sqrt(ex * ex + ez * ez);
    const dr = (e - 1) * Math.min(rx, rz);
    const dy = Math.max(325 - y, y - 468);
    return Math.min(Math.max(dr, dy), 0) + Math.hypot(Math.max(dr, 0), Math.max(dy, 0));
  }

  // granice za brzo preskakanje (lokalno): kutija [-58, 58] × [-58, 44] × [-46, 77]
  function kut3(x, y, z) {
    const dx = Math.abs(x) - 58, dy = Math.abs(y + 7) - 51, dz = Math.abs(z - 15.5) - 61.5;
    return Math.min(Math.max(dx, dy, dz), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0));
  }
  const BEZ_PRECACA = !!PEN._lbBezPrecaca;

  PEN.glave['lady-blanche'] = {
    ime: 'Lady Blanche', podnaslov: 'The Revenge of', grb: 'pantera',
    staklo: ['#6a3612', '#c79458'],   // konjak (jantar), da se razlikuje od Lord Georgea
    okvir: { x: 92, yMin: 330, yMax: 511, z: 104 },
    sdf: function (x, y, z) {
      // vrat iz ovratnika: eliptičan presjek koji se prema gore stanjuje sprijeda-straga
      // i naginje unatrag (glava stoji ispred vrata)
      const dn = vrat(x, y, z);
      if (dn < -4) return dn;                                   // duboko u vratu
      const px = (x - PIV[0]) / SC, py = (y - PIV[1]) / SC, pz = (z - PIV[2]) / SC;
      const qx = T00 * px + T01 * py + T02 * pz, qy = T10 * px + T11 * py + T12 * pz, qz = T20 * px + T21 * py + T22 * pz;
      if (!BEZ_PRECACA) {
        // vanjska granica: kutija oko lubanje i njuške + kugle oko ušiju (sve sigurno unutra)
        let ob = kut3(qx, qy, qz);
        if (ob > 0) ob = Math.min(ob, len3(qx - UHO.L.c[0], qy - UHO.L.c[1], qz - UHO.L.c[2]) - 19, len3(qx - UHO.D.c[0], qy - UHO.D.c[1], qz - UHO.D.c[2]) - 19);
        ob *= SC;
        if (ob > 5) {
          if (ob >= dn + 16) return dn;                         // daleko od glave: samo vrat
          if (dn > 5) return Math.min(dn, ob) - 4;              // daleko od svega
        }
        // jezgra lubanje (sigurno puna)
        const kj = len3(qx / 38, (qy - 10) / 20, (qz + 6) / 28);
        if (kj < 1 && (1 - kj) * 20 * SC > 3) return Math.min(dn, -(1 - kj) * 20 * SC);
      }
      const dh = glava(qx, qy, qz) * SC;
      return smin(dn, dh, 16);
    }
  };
})();
