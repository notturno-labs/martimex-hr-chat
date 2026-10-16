// List duhana (lijevo sprijeda): veliki suhi, mat list tan-smeđe boje, tanak
// kao papir, s izraženom središnjom žilom i perastim bočnim žilama, valovit
// i uvijen uz rubove, sužen prema peteljci (straga) i zaobljen na vrhu
// (sprijeda desno); niti idu duž lista
(function () {
  'use strict';
  const N = window.NAXOS, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, sum = N.sum, norm3 = N.norm3, sat = N.sat, tvar = N.tvar, boja01 = N.boja01;
  const DUHAN = boja01('#9c7a4e'), DUHAN_T = boja01('#6e5131'), DUHAN_S = boja01('#b8956a'), DUHAN_Z = boja01('#5e4327');

  N.predmet('duhan', {
    red: 120,
    gradi: function* (S) {
      const c = [-1.16, STOL_Y, 2.2], d = norm3([0.55, 0, 0.83]), e = [-d[2], 0, d[0]], A = 0.85, Bw = 0.42;
      const F = function (u, v) {
        const s = 2 * v - 1, uu = 2 * u - 1;
        // obris: uzak pri peteljci (u = 0), najširi iza sredine, zaobljen vrh; rub malo nazubljen i natrgan
        const w = Bw * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.04)), 0.55) * (0.3 + 0.7 * korakG(0, 0.4, u)) * (1 + 0.04 * sum(u * 14, 3, 1));
        // visina: rubovi se uvijaju gore, valovi duž lista, vrh se diže, dio ruba se savija jače
        const y = 0.01 + 0.08 * s * s * (0.5 + 0.5 * u) + 0.03 * Math.max(0, uu) * uu + 0.012 * Math.sin(uu * 10 + s * 2) + 0.045 * korakG(0.75, 1, Math.abs(s)) * (0.6 + 0.4 * Math.sin(u * 6));
        return [c[0] + d[0] * A * uu + e[0] * w * s, c[1] + y, c[2] + d[2] * A * uu + e[2] * w * s];
      };
      N.plahta(S, F, {
        gore: true, tezina: 0.6, razmak: 1.15,
        boja: function (T, u, v) {
          const s = 2 * v - 1, as = Math.abs(s);
          let col = mijesaj(DUHAN, DUHAN_S, 0.3 + 0.4 * pjega(u * 6, v * 4, 3, 1));
          col = mijesaj(col, DUHAN_T, 0.35 * korakG(0.55, 0.8, pjega(u * 11 + 2, v * 7, 5, 1)));            // tamnije mrlje sušenja
          if (as < 0.045) col = mijesaj(col, DUHAN_Z, 0.8);                                               // središnja žila
          const zila = Math.abs(((((u * 9 - as * 0.9) % 1) + 1) % 1) - 0.5);                              // perasto: bočne žile koso prema vrhu
          if (zila < 0.045 && u > 0.05) col = mijesaj(col, DUHAN_Z, 0.55 * (1 - zila / 0.045));
          const sitne = Math.abs(((((u * 36 - as * 0.9) % 1) + 1) % 1) - 0.5);
          if (sitne < 0.03) col = mijesaj(col, DUHAN_T, 0.25);
          col = puta(col, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 18));
          return tvar(T, col, 0.4, 0.5, 0.42, V.OBICNO, 0.25 + 0.08 * u);
        }
      });
      N.zaklon(function (px, pz) { const dx = px - c[0], dz = pz - c[2], lu = (dx * d[0] + dz * d[2]) / A, lv = (dx * e[0] + dz * e[2]) / Bw; return lu * lu + lv * lv < 0.9; }, 0.1);
    }
  });
})();
