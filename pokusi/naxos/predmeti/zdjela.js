// Zdjela meda s drvenom žlicom (desno od flakona): krem keramika s pjegama,
// unutra med koji sjaji; žlica strši iz meda prema desno straga
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const lerp = N.lerp, korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, tvar = N.tvar;

  const ZDJELA = N.ZDJELA = { x: 0.88, z: -1.0 };

  N.predmet('zdjela', {
    red: 80,
    gradi: function* (S) {
      N.prsteni(S, [[0, 0.24, 0], [0.03, 0.33, 0], [0.1, 0.44, 0], [0.2, 0.52, 0], [0.3, 0.56, 0], [0.36, 0.575, 1], [0.375, 0.565, 1], [0.37, 0.545, 2], [0.3, 0.515, 2], [0.29, 0.505, 3], [0.29, 0, 3]], {
        pomak: [ZDJELA.x, STOL_Y, ZDJELA.z],
        tezina: function (y, r, ny, m) { return m === 3 ? 0.55 : 1; },
        boja: function (T, y, r, a, ny, m) {
          if (m === 3) {
            const col = mijesaj(C.med, C.medSvjetlo, 0.3 + 0.35 * (1 - r / 0.505) + 0.25 * pjega(a * 3, r * 10, 1, 1));
            return tvar(T, col, 1, 0.3, 1, V.OBICNO, 0.3);
          }
          const pj = pjega(T.x, T.y, T.z, 90) > 0.86;
          return tvar(T, puta(pj ? C.zdjelaPjege : C.zdjela, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 7)), 0.65, 0.45, 1, V.OBICNO, 0.28 + 0.03 * m);
        }
      });
      N.zaklonKrug(ZDJELA.x, ZDJELA.z, 0.58, 0.375);
      yield;
      const A = [ZDJELA.x - 0.15, STOL_Y + 0.27, ZDJELA.z + 0.1], Bq = [ZDJELA.x + 0.42, STOL_Y + 0.72, ZDJELA.z - 0.26];
      N.cijev(S, function (t) { return [lerp(A[0], Bq[0], t), lerp(A[1], Bq[1], t) + 0.02 * Math.sin(Math.PI * t), lerp(A[2], Bq[2], t)]; }, {
        r: function (t) { return (0.02 + 0.016 * t) * (1 - 0.5 * korakG(0.93, 1, t)); }, spljosti: 0.45,
        boja: function (T, t, a) {
          if (t < 0.08) return false;                                             // u medu
          const col = mijesaj(C.zlica, puta(C.zlica, 0.7), 0.5 + 0.5 * pjega(t * 30, a, 1, 1));
          return tvar(T, col, 0.8, 0.4, 1, V.OBICNO, 0.5 + 0.1 * t);
        }
      });
    }
  });
})();
