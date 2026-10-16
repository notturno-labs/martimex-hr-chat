// Tanjur (lijevo straga) i na njemu dva komada saća: nepravilno odlomljene
// ploče (rub se lomi po stanicama) sa šesterokutnim stanicama urezanima
// odozgo i punima meda: blijedi krem vosak na vrhu stijenki, u stanici med
// koji sjaji (zlatan prema suncu, jantaran u sjeni, meniskus uz stijenke),
// skupina stanica zatvorena voštanim poklopcima. Bokovi su prerezane
// stanice obložene medom koji u okomitim rebrima curi prema dnu, nabrekne
// uz dno i razlije se u lokvu na tanjuru; s uzdignutog ruba gornjeg komada
// vise kapi. Donji komad leži na tanjuru, gornji je zakrenut, desnim krajem
// oslonjen na donji i nagnut prema nama. Tanjur je krem keramika s
// uzdignutim rubom i mekom sjenom komada
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, sat = N.sat, pjega = N.pjega, tvar = N.tvar, hash3 = N.hash3, boja01 = N.boja01;

  const TANJUR = N.TANJUR = { x: -1.1, z: -1.15, r: 0.64 };
  const VRH = STOL_Y + 0.02;                                   // ploha tanjura

  // boje: vosak (vrh stijenki blijed, u stanici zlatniji, poklopci), med
  // (sunce kroz med, površina, srednji, u sjeni, najdublji jantar uz dno
  // boka), tanjur i sjena na njemu
  const VOSAK = boja01('#fbe6ac'), VOSAK_Z = boja01('#f6cf6e'), POKLOP = boja01('#f5dc9c');
  const MED_SJAJ = boja01('#fff0b8'), MED_S = boja01('#fcc94a'), MED = boja01('#f2a52a'), MED_T = boja01('#d47a16'), MED_D = boja01('#a8500c');
  const TANJUR_B = C.tanjur, TANJUR_SJENA = boja01('#a08a72');

  // ── stanica saća: udaljenost do ruba najbliže šesterokutne stanice (kao
  //    NAXOS.sace2D, vrh stanice uz os v), uz to pamti njezino središte
  //    (CU, CV) i indeks (CI, CJ) za boju i razinu meda po stanici
  let CU = 0, CV = 0, CI = 0, CJ = 0;
  function stanica(u, v, R) {
    // točka je u točno jednoj stanici: u redu j0 ili j0 + 1 (redovi su na
    // razmaku 1,5 R, stanica seže R od središta), u stupcu najbližem po u
    const ri = R * 0.8660254, w = 2 * ri, hgt = 1.5 * R;
    const j0 = Math.floor(v / hgt), o0 = (j0 & 1) ? ri : 0, o1 = ri - o0;
    const i0 = Math.round((u - o0) / w), i1 = Math.round((u - o1) / w);
    const u0 = i0 * w + o0, u1 = i1 * w + o1, v0 = j0 * hgt, v1 = v0 + hgt;
    const dx0 = Math.abs(u - u0), dz0 = Math.abs(v - v0), dx1 = Math.abs(u - u1), dz1 = Math.abs(v - v1);
    const d0 = Math.max(dx0, dx0 * 0.5 + dz0 * 0.8660254) - ri, d1 = Math.max(dx1, dx1 * 0.5 + dz1 * 0.8660254) - ri;
    if (d0 <= d1) { CU = u0; CV = v0; CI = i0; CJ = j0; return d0; }
    CU = u1; CV = v1; CI = i1; CJ = j0 + 1; return d1;
  }

  // ── komadi: c = [x, z] (y se računa tako da najniži vrh sjedne na tanjur),
  //    h = pola stranica, kut (okret oko y), nagib (prema nama), valj (oko z);
  //    poklop = [osnovni udio zatvorenih stanica, dodatak, granica po PX − 0,6 PZ
  //    (lijevo-sprijeda od nje su stanice uglavnom zatvorene)]; kapi = kapi
  //    meda koje vise s prednjeg donjeg ruba: px mjesto duž ruba, r polumjer
  const R = 0.042, RI = R * 0.8660254, W2 = 2 * RI, ZID = 0.01, DUB = 0.012, NR = 24, NABREK = 0.016;
  const KOMADI = [
    { c: [-0.88, -1.28], h: [0.3, 0.115, 0.17], kut: 0.1, nagib: 0, valj: 0, od: 0.45, sjeme: 11, poklop: [0.1, 0.5, -0.2], kapi: [] },
    { c: [-1.2, -1.07], h: [0.33, 0.12, 0.15], kut: 0.55, nagib: 0.4, valj: 0.1, od: 0.5, sjeme: 23, poklop: [0.07, 0.75, -0.1],
      kapi: [] }
  ];
  // lokva meda na tanjuru uz prednje rubove komada i ispod kapi: [x, z, rx, rz]
  const LOKVA = [[-1.33, -0.79, 0.13, 0.08], [-1.18, -0.88, 0.13, 0.07], [-1.05, -0.99, 0.11, 0.07], [-0.93, -1.05, 0.1, 0.06], [-0.7, -1.06, 0.1, 0.06]], LOKVA_H = 0.012;
  function sdfLokva(x, y, z) {
    const dy = y - VRH;
    let d = 1;
    for (let i = 0; i < LOKVA.length; i++) { const L = LOKVA[i]; d = N.smin(d, N.sdElipsoid(x - L[0], dy, z - L[1], L[2], LOKVA_H, L[3]), 0.04); }
    return d;
  }

  N.predmet('sace', {
    red: 30,
    gradi: function* (S) {
      // ── priprema komada: okret, visina, nepravilni rubovi; tlocrti prije
      //    tanjura, da tanjur ispod komada i lokve nema točkica
      const K = [];
      for (let ki = 0; ki < KOMADI.length; ki++) {
        const k = KOMADI[ki], M = N.matrica(k.kut, k.nagib, k.valj), hx = k.h[0], hy = k.h[1], hz = k.h[2];
        let najnize = Infinity, najvise = -Infinity;
        for (let s = 0; s < 8; s++) {
          const y = M[1][0] * (s & 1 ? hx : -hx) + M[1][1] * (s & 2 ? hy : -hy) + M[1][2] * (s & 4 ? hz : -hz);
          if (y < najnize) najnize = y;
          if (y > najvise) najvise = y;
        }
        const rnd = N.slucajno(k.sjeme), rub = [new Float32Array(NR), new Float32Array(NR), new Float32Array(NR), new Float32Array(NR)];
        for (let i = 0; i < NR; i++) for (let q = 0; q < 4; q++) rub[q][i] = (rnd() - 0.5) * (q < 2 ? 0.08 : 0.06) - 0.008;
        const cyk = VRH - najnize + 0.004, cxk = k.c[0], czk = k.c[1];
        K.push({ k: k, M: M, c: [cxk, cyk, czk], vis: najvise - najnize, rub: rub });
        N.zaklon(function (px, pz) {
          // okomica kroz točku tanjura: gdje siječe donju plohu kutije i koliko je ta ploha iznad tanjura
          const dx = px - cxk, dy0 = VRH - cyk, dz = pz - czk;
          const px0 = M[0][0] * dx + M[1][0] * dy0 + M[2][0] * dz, py0 = M[0][1] * dx + M[1][1] * dy0 + M[2][1] * dz, pz0 = M[0][2] * dx + M[1][2] * dy0 + M[2][2] * dz;
          const dy = (-hy - py0) / M[1][1];
          if (dy > 0.03) return false;
          return Math.abs(px0 + M[1][0] * dy) < hx + 0.01 && Math.abs(pz0 + M[1][2] * dy) < hz + 0.01;
        }, najvise - najnize);
      }
      N.zaklon(function (px, pz) { return sdfLokva(px, VRH + LOKVA_H * 0.6, pz) < 0; }, 0.03);

      // ── tanjur: krem keramika, uzdignuti rub, meka sjena komada na plohi
      //    (tlocrt komada pomaknut prema nama i udesno, jače za uzdignuti)
      function sjenaTanjura(x, z) {
        let s = 0;
        for (let i = 0; i < K.length; i++) {
          const Q = K[i], k = Q.k, M = Q.M, ex0 = M[0][0], ex1 = M[2][0], ez0 = M[0][2], ez1 = M[2][2];
          const nx = 1 / (ex0 * ex0 + ex1 * ex1), nz = 1 / (ez0 * ez0 + ez1 * ez1), fx = k.h[0] + 0.02, fz = k.h[2] + k.h[1] * Math.abs(M[2][1]) + 0.02;
          const dig = 0.05 + 0.1 * Q.vis;
          for (let q = 1; q <= 3 && s < 0.6; q++) {
            const dx = x - Q.c[0] - dig * q, dz = z - Q.c[2] - dig * 0.8 * q;
            const lx = (dx * ex0 + dz * ex1) * nx, lz = (dx * ez0 + dz * ez1) * nz;
            const u = Math.max(Math.abs(lx) - fx, Math.abs(lz) - fz);
            if (u < 0) s = Math.max(s, 0.62 - 0.14 * q); else if (u < 0.1) s = Math.max(s, (0.62 - 0.14 * q) * (1 - u / 0.1));
          }
        }
        return s;
      }
      N.prsteni(S, [[0, 0.64, 1], [0.05, 0.63, 1], [0.062, 0.6, 1], [0.05, 0.54, 0], [0.025, 0.47, 0], [0.02, 0.44, 0], [0.02, 0, 0]], {
        pomak: [TANJUR.x, STOL_Y, TANJUR.z],
        tezina: function (y, r, ny, m) { return m ? 1 : 0.5; },
        boja: function (T, y, r, a, ny, m) {
          if (!m && N.uZaklonu(T.x, T.z)) return false;
          const s = m ? 0 : sjenaTanjura(T.x, T.z);
          let col = mijesaj(TANJUR_B, TANJUR_SJENA, 0.6 * s);
          col = puta(col, (0.93 + 0.14 * pjega(T.x, T.y, T.z, 20)) * (m ? 1.02 : 0.96));
          return tvar(T, col, m ? 0.5 : 0.45, 0.5, m ? 0.85 : 0.8, V.OBICNO, 0.12);
        }
      });
      N.zaklonKrug(TANJUR.x, TANJUR.z, TANJUR.r, 0.062);
      yield;

      // ── komadi saća
      for (let ki = 0; ki < K.length; ki++) {
        const Q = K[ki], k = Q.k, M = Q.M, hx = k.h[0], hy = k.h[1], hz = k.h[2], sj = k.sjeme, od = k.od, pk = k.poklop, ravno = !k.nagib;
        const cx = Q.c[0], cy = Q.c[1], cz = Q.c[2];
        const m00 = M[0][0], m01 = M[0][1], m02 = M[0][2], m10 = M[1][0], m11 = M[1][1], m12 = M[1][2], m20 = M[2][0], m21 = M[2][1], m22 = M[2][2];
        const rubXp = Q.rub[0], rubXm = Q.rub[1], rubZp = Q.rub[2], rubZm = Q.rub[3];
        // sunce (straga lijevo) u vlastitim koordinatama, za odsjaj u stanicama
        const lsx = -0.55 * m00 - 0.7 * m20, lsz = -0.55 * m02 - 0.7 * m22, lsn = Math.hypot(lsx, lsz) || 1;
        const LX = lsx / lsn, LZ = lsz / lsn;
        let PX = 0, PY = 0, PZ = 0, QX = 0, QZ = 0, VRHS = 0, RAZ = 0, HA = 0, NB = 0, REBRO = 0, POKL = false;
        // svjetske → vlastite koordinate (bez alokacija)
        function lokal(x, y, z) {
          const dx = x - cx, dy = y - cy, dz = z - cz;
          PX = m00 * dx + m10 * dy + m20 * dz; PY = m01 * dx + m11 * dy + m21 * dz; PZ = m02 * dx + m12 * dy + m22 * dz;
        }
        // nepravilni rub (odlomljeno): pomak svakog boka duž njega iz tablice
        function rubovi() {
          const tz = (PZ + hz) / (2 * hz) * (NR - 1), tx = (PX + hx) / (2 * hx) * (NR - 1);
          let iz = tz | 0, ix = tx | 0;
          if (iz < 0) iz = 0; else if (iz > NR - 2) iz = NR - 2;
          if (ix < 0) ix = 0; else if (ix > NR - 2) ix = NR - 2;
          const fz = Math.min(1, Math.max(0, tz - iz)), fx = Math.min(1, Math.max(0, tx - ix));
          QX = PX > 0 ? PX - hx - rubXp[iz] - (rubXp[iz + 1] - rubXp[iz]) * fz : -PX - hx - rubXm[iz] - (rubXm[iz + 1] - rubXm[iz]) * fz;
          QZ = PZ > 0 ? PZ - hz - rubZp[ix] - (rubZp[ix + 1] - rubZp[ix]) * fx : -PZ - hz - rubZm[ix] - (rubZm[ix + 1] - rubZm[ix]) * fx;
        }
        // stanica u kojoj je točka: visina stijenke (VRHS, neravna), razina
        // meda (RAZ) i je li zatvorena voštanim poklopcem (POKL, skupina
        // lijevo-sprijeda i pokoja drugdje)
        function stanicaOvdje() {
          const d = stanica(PX, PZ, R);
          HA = hash3(CI, CJ, sj);
          VRHS = hy - 0.012 * ((HA * 5.1) % 1);
          POKL = HA < pk[0] + pk[1] * korakG(pk[2] + 0.1, pk[2] - 0.1, CU - 0.6 * CV);
          RAZ = POKL ? VRHS - 0.005 : VRHS - DUB * (0.5 + 0.5 * ((HA * 11.7) % 1));
          return d;
        }
        // med po boku: nabreknuće NB (okomita rebra po stupcima prerezanih
        // stanica, svako svoje jačine, jače prema dnu) i udio rebra REBRO
        function nabrek() {
          const bokX = QX > QZ, s = bokX ? PZ : PX, lice = bokX ? (PX > 0 ? 1 : 2) : (PZ > 0 ? 3 : 4);
          const stup = Math.floor(s / W2), f = s / W2 - stup, t = sat((PY + hy) / (2 * hy));
          REBRO = 0.5 - 0.5 * Math.cos(6.2831853 * f);
          NB = NABREK * (0.35 + 0.65 * hash3(stup, lice, sj)) * REBRO * (0.3 + 0.7 * (1 - t) * (1 - t));
        }
        const sdf = function (x, y, z) {
          lokal(x, y, z);
          rubovi();
          const r = 0.01, ay = Math.max(PY - hy, -hy - PY);
          let qx = QX + r, qz = QZ + r, qy = ay + r;
          const grubo = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
          if (grubo > 0.04) return grubo - 0.02;                           // daleko izvan: donja međa (bok nabrekne do NABREK)
          if (grubo < -0.04 && PY < hy - DUB - 0.03) return grubo;         // duboko unutra
          const d = stanicaOvdje();
          nabrek();
          const jit = R * 0.35 * (((HA * 7.31) % 1) - 0.5);                // rub se lomi po stanicama
          qx = QX + jit - NB + r; qz = QZ + jit - NB + r; qy = Math.max(PY - VRHS, -hy - PY) + r;
          const kut = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
          if (PY < hy - DUB - 0.02) return kut;                            // ispod stanica
          const st = Math.max(d + ZID / 2, RAZ - PY);                      // šupljina stanice iznad meda
          return Math.max(kut, -st);
        };
        const ok = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
        for (let s = 0; s < 8; s++) {
          const px = (s & 1 ? 1 : -1) * (hx + 0.07), py = (s & 2 ? 1 : -1) * (hy + 0.006), pz = (s & 4 ? 1 : -1) * (hz + 0.07);
          const x = cx + m00 * px + m01 * py + m02 * pz, y = cy + m10 * px + m11 * py + m12 * pz, z = cz + m20 * px + m21 * py + m22 * pz;
          if (x < ok[0]) ok[0] = x; if (x > ok[1]) ok[1] = x; if (y < ok[2]) ok[2] = y; if (y > ok[3]) ok[3] = y; if (z < ok[4]) ok[4] = z; if (z > ok[5]) ok[5] = z;
        }
        N.rezSDF(S, sdf, ok, {
          h: S.korak * 0.4, bezDna: true,
          boja: function (T) {
            lokal(T.x, T.y, T.z);
            const d = stanicaOvdje();
            rubovi();
            nabrek();
            const nyl = m01 * T.nx + m11 * T.ny + m21 * T.nz;                         // koliko ploha gleda prema vrhu komada
            const uStanici = d + ZID / 2 < -0.0015, vanjski = Math.max(QX, QZ) - NB > -0.012;
            const sum = 0.9 + 0.2 * pjega(T.x, T.y, T.z, 40);
            let col, lit, jak;
            if (nyl > 0.5) {
              // ravan komad gledan s ruba: gornja ploha na zaslonu gušća, pa rjeđa
              if (ravno && hash3((T.x * 1931) | 0, (T.z * 1777) | 0, 3) < 0.3) return false;
              if (!uStanici && PY > VRHS - 0.008) { col = VOSAK; lit = 0.45; jak = 1.3; }                        // vrh stijenke od voska
              else if (POKL) {                                                                                 // voštani poklopac, blago ispupčen
                col = mijesaj(POKLOP, MED_S, 0.2 + 0.3 * ((HA * 3.7) % 1));
                lit = 0.5; jak = 1.25;
              } else {                                                                                          // površina meda u stanici: meniskus, sjaji prema suncu
                const ux = (PX - CU) / RI, uz = (PZ - CV) / RI;
                const nx = -0.55 * ux, nz = -0.55 * uz, nn = 1 / Math.hypot(nx, 1, nz);
                T.nx = (m00 * nx + m01 + m02 * nz) * nn; T.ny = (m10 * nx + m11 + m12 * nz) * nn; T.nz = (m20 * nx + m21 + m22 * nz) * nn;
                const f = 0.5 + 0.5 * (ux * LX + uz * LZ);
                col = mijesaj(mijesaj(MED, MED_S, korakG(-0.1, 0.5, f)), MED_SJAJ, 0.6 * korakG(0.5, 1, f));
                lit = 1; jak = 1.75;
              }
            } else if (nyl < -0.5) return false;
            else if (!vanjski && uStanici) {                                                                  // unutarnja stijenka stanice: vosak kroz koji prosijava med
              col = mijesaj(VOSAK_Z, MED_S, 0.6 * sat((VRHS - PY) / DUB)); lit = 0.8; jak = 1.45;
            } else {                                                                                          // vanjski bok: prerezane stanice obložene medom koji curi
              const t = sat((PY + hy) / (2 * hy));
              col = mijesaj(MED_D, MED_T, korakG(0, 0.3, t)); col = mijesaj(col, MED, korakG(0.25, 0.7, t)); col = mijesaj(col, MED_S, korakG(0.65, 1, t));
              col = puta(col, 0.85 + 0.3 * REBRO);                                                            // greben rebra svjetliji
              if (d > -ZID / 2 - 0.003) col = mijesaj(col, VOSAK_Z, 0.4 * (1 - NB / NABREK));                  // prerezana stijenka proviruje kroz tanak med
              if (PY > VRHS - 0.012) col = mijesaj(col, VOSAK, 0.5);                                           // odlomljeni rub na vrhu: vosak
              lit = 1; jak = 1.6;
            }
            return tvar(T, puta(col, sum), lit, 0.45, jak, V.OBICNO, od);
          }
        });
        yield;
        // kapi meda s prednjeg donjeg ruba: debele pri rubu, tanak vrat, kaplja
        // koja dosegne tanjur (lokvu)
        for (let qi = 0; qi < k.kapi.length; qi++) {
          const kp = k.kapi[qi], r0 = kp.r;
          PX = kp.px; PZ = hz; rubovi();                                               // stvarni (odlomljeni) prednji rub na tom mjestu
          const ox = kp.px, oy = -hy + 0.02, oz = hz - QZ + PZ - hz + 0.004;
          const s0 = [cx + m00 * ox + m01 * oy + m02 * oz, cy + m10 * ox + m11 * oy + m12 * oz, cz + m20 * ox + m21 * oy + m22 * oz];
          const L = s0[1] - VRH - 0.006;
          if (L < 0.04) continue;
          N.cijev(S, function (t) { return [s0[0], s0[1] - L * t, s0[2]]; }, {
            r: function (t) {
              const v = (t - 0.85) / 0.15;
              return r0 * (1.6 - 1.1 * korakG(0.05, 0.45, t)) * (1 - korakG(0.85, 1, t)) + r0 * 1.5 * Math.sqrt(Math.max(0, 1 - v * v));   // vrat pa kaplja
            },
            boja: function (T, t, a) {
              let col = mijesaj(MED_S, MED_T, 0.2 + 0.6 * t);
              if (T.ny > 0.2 && T.nx < 0) col = mijesaj(col, MED_SJAJ, 0.4 * korakG(0.2, 0.7, T.ny - T.nx));   // odsjaj na gornjoj lijevoj strani kapi
              return tvar(T, puta(col, 0.92 + 0.16 * pjega(T.x, T.y, T.z, 50)), 1, 0.4, 1.45, V.OBICNO, od + 0.03);
            }
          });
        }
        yield;
      }

      // ── lokva meda na tanjuru: tanka sjajna ploha, na rubu tanja i svjetlija
      N.rezSDF(S, sdfLokva, [-1.5, -0.56, VRH - 0.005, VRH + LOKVA_H + 0.01, -1.16, -0.68], {
        h: S.korak * 0.45, osi: 'z', bezDna: true, tezina: 1,
        boja: function (T) {
          const t = sat((T.y - VRH) / LOKVA_H);
          let col = mijesaj(MED, MED_T, korakG(0.1, 0.9, t));
          col = mijesaj(col, MED_SJAJ, 0.3 * korakG(0.9, 1, t) * pjega(T.x, 0, T.z, 15));
          return tvar(T, puta(col, 0.92 + 0.16 * pjega(T.x, T.y, T.z, 40)), 1, 0.4, 1.2, V.OBICNO, 0.5);
        }
      });
    }
  });
})();
