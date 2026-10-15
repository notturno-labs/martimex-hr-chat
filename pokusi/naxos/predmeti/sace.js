// Tanjur (lijevo straga) i na njemu dva komada saća: nepravilno odlomljene
// ploče sa šesterokutnim stanicama urezanima odozgo i punima meda (svijetli
// vosak na vrhu stijenki, zlatni odsjaj uz rub stanice, tamniji jantar u
// dubini, poneka stanica zatvorena voštanim poklopcem); s bokova komada cure
// kapi meda u lokvu na tanjuru. Donji komad leži na tanjuru, gornji je
// zakrenut i nagnut prema nama, oslonjen na donji. Tanjur je krem keramika s
// uzdignutim rubom i mekom sjenom komada
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, sat = N.sat, pjega = N.pjega, tvar = N.tvar, hash3 = N.hash3, boja01 = N.boja01;

  const TANJUR = N.TANJUR = { x: -1.1, z: -1.15, r: 0.64 };
  const VRH = STOL_Y + 0.02;                                   // ploha tanjura

  // boje: vosak stijenki (vrh svijetao, u dubini tamniji), med (svijetao, srednji, duboki), sjena na tanjuru
  const VOSAK = boja01('#f8dd96'), VOSAK_T = boja01('#e2b352');
  const MED_S = boja01('#f8c548'), MED = boja01('#e39a22'), MED_T = C.saceTamno;
  const TANJUR_B = boja01('#e2cba4'), TANJUR_SJENA = boja01('#a08868');

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
  //    h = pola stranica, kut (okret oko y), nagib (prema nama), valj (oko z),
  //    kapi = kapi meda: p mjesto na boku (vlastite koordinate), n normala
  //    boka, L1 duljina niz bok, L2 koliko visi ispod ruba, r polumjer
  const R = 0.044, ZID = 0.009, DUB = 0.024, NR = 24;
  const KOMADI = [
    { c: [-0.95, -1.0], h: [0.36, 0.1, 0.2], kut: 0.08, nagib: 0, valj: 0, od: 0.45, sjeme: 11,
      kapi: [{ p: [-0.14, 0.09, 0.2], n: [0, 0, 1], L1: 0.18, L2: 0, r: 0.013 }, { p: [0.06, 0.09, 0.2], n: [0, 0, 1], L1: 0.19, L2: 0, r: 0.016 },
        { p: [0.24, 0.09, 0.2], n: [0, 0, 1], L1: 0.17, L2: 0, r: 0.012 }, { p: [0.36, 0.09, 0.05], n: [1, 0, 0], L1: 0.18, L2: 0, r: 0.014 }] },
    { c: [-1.25, -1.1], h: [0.36, 0.1, 0.16], kut: -0.25, nagib: 0.45, valj: 0.3, od: 0.48, sjeme: 23,
      kapi: [{ p: [-0.08, 0.08, 0.16], n: [0, 0, 1], L1: 0.16, L2: 0.07, r: 0.015 }, { p: [0.1, 0.06, 0.16], n: [0, 0, 1], L1: 0.14, L2: 0.1, r: 0.013 },
        { p: [-0.26, 0.09, 0.16], n: [0, 0, 1], L1: 0.17, L2: 0.03, r: 0.016 }, { p: [-0.36, 0.08, -0.02], n: [-1, 0, 0], L1: 0.16, L2: 0.02, r: 0.013 }] }
  ];
  // lokva meda na tanjuru ispred komada: [x, z, rx, rz]
  const LOKVA = [[-1.5, -0.83, 0.17, 0.1], [-1.33, -0.73, 0.12, 0.08], [-1.02, -0.74, 0.12, 0.07]], LOKVA_H = 0.014;
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
        for (let i = 0; i < NR; i++) for (let q = 0; q < 4; q++) rub[q][i] = (rnd() - 0.5) * (q < 2 ? 0.07 : 0.05) - 0.01;
        K.push({ k: k, M: M, c: [k.c[0], VRH - najnize + 0.004, k.c[1]], vis: najvise - najnize, rub: rub });
        const cyk = VRH - najnize + 0.004, cxk = k.c[0], czk = k.c[1];
        N.zaklon(function (px, pz) {
          // okomica kroz točku tanjura: gdje siječe donju plohu kutije i koliko je ta ploha iznad tanjura
          const dx = px - cxk, dy0 = VRH - cyk, dz = pz - czk;
          const px0 = M[0][0] * dx + M[1][0] * dy0 + M[2][0] * dz, py0 = M[0][1] * dx + M[1][1] * dy0 + M[2][1] * dz, pz0 = M[0][2] * dx + M[1][2] * dy0 + M[2][2] * dz;
          const dy = (-hy - py0) / M[1][1];
          if (dy > 0.025) return false;
          return Math.abs(px0 + M[1][0] * dy) < hx + 0.01 && Math.abs(pz0 + M[1][2] * dy) < hz + 0.01;
        }, najvise - najnize);
      }
      N.zaklon(function (px, pz) { return sdfLokva(px, VRH + LOKVA_H * 0.6, pz) < 0; }, 0.03);

      // ── tanjur: krem keramika, uzdignuti rub, meka sjena komada na plohi
      function sjenaTanjura(x, z) {
        let s = 0;
        for (let i = 0; i < K.length; i++) {
          const k = K[i].k, cs = Math.cos(k.kut), sn = Math.sin(k.kut), fx = k.h[0] + 0.02, fz = k.h[2] * Math.cos(k.nagib) + k.h[1] * Math.sin(k.nagib) + 0.02;
          for (let q = 1; q <= 3 && s < 0.6; q++) {
            const dx = x - k.c[0] - 0.09 * q, dz = z - k.c[1] - 0.07 * q, lx = cs * dx - sn * dz, lz = sn * dx + cs * dz;
            const u = Math.max(Math.abs(lx) - fx, Math.abs(lz) - fz);
            if (u < 0) s = Math.max(s, 0.62 - 0.14 * q); else if (u < 0.08) s = Math.max(s, (0.62 - 0.14 * q) * (1 - u / 0.08));
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
          let col = mijesaj(TANJUR_B, TANJUR_SJENA, 0.55 * s);
          col = puta(col, (0.93 + 0.14 * pjega(T.x, T.y, T.z, 20)) * (m ? 1.02 : 0.96));
          return tvar(T, col, m ? 0.6 : 0.5, 0.5, m ? 0.65 : 0.55, V.OBICNO, 0.12);
        }
      });
      N.zaklonKrug(TANJUR.x, TANJUR.z, TANJUR.r, 0.062);
      yield;

      // ── komadi saća
      for (let ki = 0; ki < K.length; ki++) {
        const Q = K[ki], k = Q.k, M = Q.M, hx = k.h[0], hy = k.h[1], hz = k.h[2], sj = k.sjeme, od = k.od;
        const cx = Q.c[0], cy = Q.c[1], cz = Q.c[2];
        const m00 = M[0][0], m01 = M[0][1], m02 = M[0][2], m10 = M[1][0], m11 = M[1][1], m12 = M[1][2], m20 = M[2][0], m21 = M[2][1], m22 = M[2][2];
        const rubXp = Q.rub[0], rubXm = Q.rub[1], rubZp = Q.rub[2], rubZm = Q.rub[3];
        // sunce (straga lijevo) u vlastitim koordinatama, za odsjaj u stanicama
        const lsx = -0.55 * m00 - 0.7 * m20, lsz = -0.55 * m02 - 0.7 * m22, lsn = Math.hypot(lsx, lsz) || 1;
        const LX = lsx / lsn, LZ = lsz / lsn, RI = R * 0.8660254;
        let PX = 0, PY = 0, PZ = 0, QX = 0, QZ = 0, VRHS = 0, RAZ = 0, HA = 0;
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
        // stanica u kojoj je točka: visina stijenke (VRHS, neravna) i razina
        // meda (RAZ; poneka stanica ima voštani poklopac gotovo do vrha)
        function stanicaOvdje() {
          const d = stanica(PX, PZ, R);
          HA = hash3(CI, CJ, sj);
          VRHS = hy - 0.012 * ((HA * 5.1) % 1);
          RAZ = HA < 0.09 ? VRHS - 0.007 : VRHS - DUB * (0.55 + 0.45 * ((HA * 11.7) % 1));
          return d;
        }
        const sdf = function (x, y, z) {
          lokal(x, y, z);
          rubovi();
          const r = 0.012, qx = QX + r, qz = QZ + r;
          let qy = Math.max(PY - hy, -hy - PY) + r;
          const gruboK = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
          if (gruboK > 0.025 || PY < hy - DUB - 0.03) return gruboK;      // daleko izvan ili duboko ispod stanica: stanice ne mijenjaju predznak
          const d = stanicaOvdje();
          qy = Math.max(PY - VRHS, -hy - PY) + r;
          const kut = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
          const st = Math.max(d + ZID / 2, RAZ - PY);       // šupljina stanice iznad meda
          return Math.max(kut, -st);
        };
        const ok = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
        for (let s = 0; s < 8; s++) {
          const px = (s & 1 ? 1 : -1) * (hx + 0.035), py = (s & 2 ? 1 : -1) * (hy + 0.006), pz = (s & 4 ? 1 : -1) * (hz + 0.035);
          const x = cx + m00 * px + m01 * py + m02 * pz, y = cy + m10 * px + m11 * py + m12 * pz, z = cz + m20 * px + m21 * py + m22 * pz;
          if (x < ok[0]) ok[0] = x; if (x > ok[1]) ok[1] = x; if (y < ok[2]) ok[2] = y; if (y > ok[3]) ok[3] = y; if (z < ok[4]) ok[4] = z; if (z > ok[5]) ok[5] = z;
        }
        N.rezSDF(S, sdf, ok, {
          h: S.korak * 0.4, bezDna: true,
          boja: function (T) {
            lokal(T.x, T.y, T.z);
            const d = stanicaOvdje();
            rubovi();
            const nyl = m01 * T.nx + m11 * T.ny + m21 * T.nz;                         // koliko ploha gleda prema vrhu komada
            const uStanici = d + ZID / 2 < -0.0015, vanjski = Math.max(QX, QZ) > -0.007, poklop = HA < 0.09;
            const sum = 0.9 + 0.2 * pjega(T.x, T.y, T.z, 40);
            let col, lit, jak;
            if (nyl > 0.45) {
              if (!uStanici && PY > VRHS - 0.007) { col = VOSAK; lit = 0.6; jak = 1.15; }                        // vrh stijenke od voska
              else if (poklop) { col = mijesaj(VOSAK, MED_S, 0.3 + 0.3 * pjega(T.x, T.z, 1, 60)); lit = 0.5; jak = 1.1; }  // voštani poklopac
              else {                                                                                          // površina meda u stanici: sjaji
                const f = 0.5 + 0.5 * ((PX - CU) * LX + (PZ - CV) * LZ) / RI;
                col = mijesaj(mijesaj(MED_T, MED_S, korakG(-0.1, 0.5, f)), VOSAK, 0.3 * korakG(0.6, 1, f));
                lit = 1; jak = 1.5;
                if (d > -ZID / 2 - 0.009 && f > 0.62) { col = mijesaj(col, VOSAK, 0.5); jak = 1.6; }            // zlatni odsjaj uz rub
              }
            } else if (nyl < -0.45) return false;
            else if (!vanjski && uStanici) {                                                                  // unutarnja stijenka stanice
              col = mijesaj(VOSAK_T, MED_S, 0.5 * sat((VRHS - PY) / DUB)); lit = 0.8; jak = 1.3;
            } else {                                                                                          // vanjski bok: med curi preko odlomljenih stijenki
              const trag = d > -ZID / 2 - 0.004;
              col = trag ? mijesaj(VOSAK_T, VOSAK, 0.4) : mijesaj(MED_S, MED, 0.1 + 0.7 * sat((VRHS - PY) / (2 * hy)));
              col = puta(col, 0.85 + 0.3 * pjega(T.x, 0, T.z, 28));
              if (PY > VRHS - 0.014) col = mijesaj(col, VOSAK, 0.4);
              lit = 1; jak = 1.4;
            }
            return tvar(T, puta(col, sum), lit, 0.45, jak, V.OBICNO, od);
          }
        });
        yield;
        // kapi meda: niz bok (u smjeru pada po plohi) pa vise ispod ruba, s kapljom na kraju
        for (let qi = 0; qi < k.kapi.length; qi++) {
          const kp = k.kapi[qi], p = kp.p, n = kp.n, r0 = kp.r;
          const nw = [m00 * n[0] + m01 * n[1] + m02 * n[2], m10 * n[0] + m11 * n[1] + m12 * n[2], m20 * n[0] + m21 * n[1] + m22 * n[2]];
          PX = p[0]; PZ = p[2]; rubovi();                                               // stvarni (odlomljeni) bok na tom mjestu
          const qb = n[1] ? 0 : n[0] ? QX : QZ, pom = -qb + r0 * 0.7;
          const ox = p[0] + n[0] * pom, oy = n[1] ? -hy - r0 * 0.7 : p[1], oz = p[2] + n[2] * pom;
          const s0 = [cx + m00 * ox + m01 * oy + m02 * oz, cy + m10 * ox + m11 * oy + m12 * oz, cz + m20 * ox + m21 * oy + m22 * oz];
          const dn = N.norm3([nw[0] * nw[1], -1 + nw[1] * nw[1], nw[2] * nw[1]]);      // pad projiciran na plohu boka
          const L1 = kp.L1, L2 = kp.L2, e1 = [s0[0] + dn[0] * L1, s0[1] + dn[1] * L1, s0[2] + dn[2] * L1];
          N.cijev(S, function (t) {
            if (L2 <= 0) return [s0[0] + dn[0] * L1 * t, s0[1] + dn[1] * L1 * t, s0[2] + dn[2] * L1 * t];
            if (t < 0.5) return [s0[0] + dn[0] * L1 * 2 * t, s0[1] + dn[1] * L1 * 2 * t, s0[2] + dn[2] * L1 * 2 * t];
            return [e1[0], e1[1] - L2 * (2 * t - 1), e1[2]];
          }, {
            r: function (t) {
              if (t >= 0.88) { const u = (t - 0.88) / 0.12; return r0 * 1.5 * Math.sqrt(Math.max(0, 1 - u * u)); }   // kaplja na kraju
              return r0 * (1.4 - 0.9 * korakG(0, 0.4, t) + 1.0 * korakG(0.55, 0.88, t));               // široko s ruba, tanka nit, pa kaplja
            },
            boja: function (T, t, a) {
              let col = mijesaj(MED_S, MED, 0.15 + 0.55 * t);
              if (T.ny > 0.2 && T.nx < 0) col = mijesaj(col, VOSAK, 0.35 * korakG(0.2, 0.7, T.ny - T.nx));   // odsjaj na gornjoj lijevoj strani kapi
              return tvar(T, puta(col, 0.92 + 0.16 * pjega(T.x, T.y, T.z, 50)), 1, 0.4, 1.45, V.OBICNO, od + 0.03);
            }
          });
        }
        yield;
      }

      // ── lokva meda na tanjuru: tanka sjajna ploha, na rubu tanja i svjetlija
      N.rezSDF(S, sdfLokva, [-1.62, -0.78, VRH - 0.005, VRH + LOKVA_H + 0.01, -1.05, -0.58], {
        h: S.korak * 0.45, osi: 'z', bezDna: true, tezina: 1,
        boja: function (T) {
          const t = sat((T.y - VRH) / LOKVA_H);
          let col = mijesaj(MED, MED_T, korakG(0.1, 0.9, t));
          col = mijesaj(col, VOSAK, 0.25 * korakG(0.9, 1, t) * pjega(T.x, 0, T.z, 15));
          return tvar(T, puta(col, 0.92 + 0.16 * pjega(T.x, T.y, T.z, 40)), 1, 0.4, 1.3, V.OBICNO, 0.5);
        }
      });
    }
  });
})();
