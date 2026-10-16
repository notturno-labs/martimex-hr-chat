// Mahune vanilije: tri duge tamne, malo spljoštene mahune, ukoso preko
// prednjeg dijela stola (od lijevo straga prema sredini sprijeda)
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const mijesaj = N.mijesaj, pjega = N.pjega, tvar = N.tvar;

  N.predmet('vanilija', {
    red: 100,
    gradi: function* (S) {
      const MAHUNE = [[[-1.22, 0.24], [-0.55, 1.5], [0.12, 2.73], 0.015], [[-1.05, 0.4], [-0.35, 1.7], [0.3, 2.6], 0.015], [[-0.95, 0.3], [-0.2, 1.45], [0.5, 2.4], 0.045]];
      for (let i = 0; i < MAHUNE.length; i++) {
        const k = MAHUNE[i];
        const A = [k[0][0], STOL_Y + k[3], k[0][1]], Cq = [k[1][0], STOL_Y + k[3], k[1][1]], Bq = [k[2][0], STOL_Y + k[3], k[2][1]];
        N.cijev(S, function (t) { return N.kvadratna(A, Cq, Bq, t); }, {
          r: function (t, a) { return 0.03 * Math.pow(Math.sin(Math.PI * t), 0.3) * (1 + 0.1 * Math.cos(3 * a + t * 40) + 0.08 * N.sum(t * 70 + i, a * 0.9, i)); }, spljosti: 0.5,
          boja: function (T, t, a) {
            let col = mijesaj(C.vanilija, C.vanilijaSjaj, 0.25 + 0.4 * pjega(t * 30 + i, a * 0.8, i, 1));
            col = mijesaj(col, C.vanilijaSjaj, 0.5 * N.korakG(0.2, 0.8, 0.7 * T.ny - 0.5 * T.nx - 0.3 * T.nz));   // uljasti sjaj prema suncu
            col = mijesaj(col, C.vanilija, 0.6 * N.korakG(0.3, 0.6, Math.abs(Math.sin(a * 2 + t * 25))));           // uzdužne brazde
            return tvar(T, col, 1, 0.3, 1.1, V.OBICNO, 0.22 + 0.06 * t);
          }
        });
        N.zaklonKapsula(A[0], A[2], Cq[0], Cq[2], 0.035, 0.06); N.zaklonKapsula(Cq[0], Cq[2], Bq[0], Bq[2], 0.035, 0.06);
        yield;
      }
    }
  });
})();
