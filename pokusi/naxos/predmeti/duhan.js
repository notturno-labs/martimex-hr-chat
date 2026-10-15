// List duhana (lijevo sprijeda): suhi, valoviti list s podignutim rubovima;
// niti idu duž lista kao žile
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, norm3 = N.norm3, tvar = N.tvar;

  N.predmet('duhan', {
    red: 120,
    gradi: function* (S) {
      const c = [-1.16, STOL_Y, 2.2], d = norm3([0.55, 0, 0.83]), e = [-d[2], 0, d[0]], A = 0.85, Bw = 0.42;
      const F = function (u, v) {
        const s = 2 * v - 1, uu = 2 * u - 1, w = Bw * Math.pow(Math.max(0, 1 - uu * uu), 0.62) * (1 - 0.25 * korakG(0.2, 1, uu));
        const y = 0.012 + 0.09 * s * s * (0.6 + 0.4 * uu) + 0.04 * Math.max(0, uu) * uu + 0.012 * Math.sin(uu * 11 + s * 2) + 0.03 * korakG(0.7, 1, Math.abs(s));
        return [c[0] + d[0] * A * uu + e[0] * w * s, c[1] + y, c[2] + d[2] * A * uu + e[2] * w * s];
      };
      N.plahta(S, F, {
        gore: true, tezina: 0.9,
        boja: function (T, u, v) {
          const s = Math.abs(2 * v - 1);
          let col = mijesaj(C.duhan, C.duhanZila, 0.25 * pjega(u * 9, v * 4, 3, 1) + 0.2 * (1 - korakG(0, 0.05, s)));
          if (Math.abs(((v * 9) % 1) - 0.5) < 0.05) col = mijesaj(col, C.duhanZila, 0.45);      // žile
          col = puta(col, 0.85 + 0.3 * pjega(T.x, T.y, T.z, 18));
          return tvar(T, col, 0.55, 0.5, 0.5, V.OBICNO, 0.25 + 0.08 * u);
        }
      });
      // tlocrt lista (približno: elipsa)
      N.zaklon(function (px, pz) { const dx = px - c[0], dz = pz - c[2], lu = (dx * d[0] + dz * d[2]) / A, lv = (dx * e[0] + dz * e[2]) / Bw; return lu * lu + lv * lv < 0.9; }, 0.1);
    }
  });
})();
