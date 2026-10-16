// Zrna tonke: četiri tamna naborana zrna desno sprijeda (uz brašno)
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const mijesaj = N.mijesaj, pjega = N.pjega, sum = N.sum, tvar = N.tvar;

  N.predmet('tonka', {
    red: 110,
    gradi: function* (S) {
      const ZRNA = [[0.77, 1.41, 0.3], [0.98, 1.52, -0.9], [0.89, 2.06, 1.2], [0.72, 1.12, -0.3]];
      for (let i = 0; i < ZRNA.length; i++) {
        const k = ZRNA[i], c = [k[0], STOL_Y + 0.045, k[1]], lok = N.uLokalno(N.matrica(k[2]), c);
        const sdf = function (x, y, z) {
          const p = lok(x, y, z);
          return N.sdElipsoid(p[0], p[1], p[2], 0.11, 0.045, 0.06) - 0.005 * sum(p[0] * 70 + i, p[1] * 70, p[2] * 70) - 0.003 * Math.abs(Math.sin(p[0] * 80 + 2 * sum(p[0] * 20, p[1] * 20, p[2] * 20)));
        };
        N.rezSDF(S, sdf, [c[0] - 0.13, c[0] + 0.13, c[1] - 0.05, c[1] + 0.06, c[2] - 0.13, c[2] + 0.13], {
          h: S.korak * 0.3, bezDna: true,
          boja: function (T) { return tvar(T, mijesaj(C.tonka, C.tonkaSjaj, 0.2 + 0.6 * pjega(T.x, T.y, T.z, 35)), 1, 0.3, 0.95, V.OBICNO, 0.28); }
        });
        N.zaklonKrug(c[0], c[2], 0.1, 0.09);
      }
    }
  });
})();
