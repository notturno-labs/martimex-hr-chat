// Vaza i buket lavande (desno straga, iza flakona): kamena vaza, stabljike
// vezane uzicom (ispod veza se skupljaju u vazu, iznad se šire u lepezu),
// cvjetovi kao niz cvjetića na vrhu stabljike; uzica kao spirala oko snopa
// i dva kraja koja vise
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const sat = N.sat, korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, norm3 = N.norm3, tvar = N.tvar;

  const VAZA = N.VAZA = { x: 0.48, z: -1.74 };

  N.predmet('lavanda', {
    red: 60,
    gradi: function* (S) {
      const rnd = N.slucajno(7);
      N.prsteni(S, [[0, 0.1, 0], [0.26, 0.11, 0], [0.29, 0.1, 0], [0.29, 0.07, 0]], {
        pomak: [VAZA.x, STOL_Y, VAZA.z],
        boja: function (T) { return tvar(T, puta(C.vaza, 0.85 + 0.3 * pjega(T.x, T.y, T.z, 25)), 0.7, 0.4, 1, V.OBICNO, 0.3); }
      });
      N.zaklonKrug(VAZA.x, VAZA.z, 0.115, 0.3);
      const vez = [VAZA.x + 0.01, STOL_Y + 0.82, VAZA.z - 0.01], tc = 0.3;
      for (let i = 0; i < 20; i++) {
        const fx = -0.45 + 0.9 * (i + 0.5) / 20 + (rnd() - 0.5) * 0.1, fz = (rnd() - 0.5) * 0.4, Lh = 0.95 + 0.45 * rnd();
        const A = [VAZA.x + (rnd() - 0.5) * 0.08, STOL_Y + 0.26, VAZA.z + (rnd() - 0.5) * 0.08];
        const dir = norm3([Math.sin(fx), Math.cos(fx) * Math.cos(fz), Math.sin(fz)]), savij = (rnd() - 0.5) * 0.3;
        const Cv = [vez[0] + (rnd() - 0.5) * 0.05, vez[1], vez[2] + (rnd() - 0.5) * 0.05];
        const put = function (t) {
          if (t < tc) { const s = (tc - t) / tc; return [Cv[0] + (A[0] - Cv[0]) * s, Cv[1] + (A[1] - Cv[1]) * s, Cv[2] + (A[2] - Cv[2]) * s]; }
          const s = (t - tc) / (1 - tc);
          return [Cv[0] + dir[0] * Lh * s + savij * s * s, Cv[1] + dir[1] * Lh * s - 0.1 * s * s, Cv[2] + dir[2] * Lh * s];
        };
        const cv0 = 0.62 + 0.08 * rnd(), nCv = Math.round(Lh * (1 - cv0) / (1 - tc) / 0.042), f0 = rnd() * 6;
        N.cijev(S, put, {
          r: function (t, a) {
            if (t < cv0) return 0.011;
            const q = (t - cv0) / (1 - cv0), cvj = Math.abs(Math.cos(Math.PI * q * nCv)), tanak = 1 - 0.55 * korakG(0.85, 1, q);
            return (0.011 + 0.038 * (0.45 + 0.55 * cvj) * tanak) * (1 + 0.18 * Math.cos(2 * a + f0 + q * 7));
          },
          boja: function (T, t, a, r) {
            if (t < cv0 + 0.012) return tvar(T, mijesaj(C.stabljika, C.list, 0.2 + 0.3 * pjega(t * 20, i, 2, 1)), 0.8, 0.4, 0.9, V.OBICNO, 0.75 + 0.2 * t);
            const q = (t - cv0) / (1 - cv0);
            const col = mijesaj(C.lavanda, C.lavandaSvjetlo, sat(0.2 + 0.5 * pjega(t * 40, a * 1.5, i, 1) + 0.35 * q));
            return tvar(T, col, 0.8, 0.45, 1, V.OBICNO, 0.8 + 0.18 * t);
          }
        });
        if (i % 5 === 4) yield;
      }
      // uzica: spirala oko snopa pri vezu i dva kraja koja vise
      N.cijev(S, function (t) { const a = t * 2.5 * 2 * Math.PI; return [vez[0] + 0.078 * Math.cos(a), vez[1] - 0.018 + 0.036 * t, vez[2] + 0.078 * Math.sin(a)]; }, {
        r: function () { return 0.009; }, boja: function (T) { return tvar(T, puta(C.uzica, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 60)), 0.75, 0.4, 1, V.OBICNO, 0.9); }
      });
      [[0.06, -0.02], [-0.03, 0.07]].forEach(function (k) {
        N.cijev(S, function (t) { return [vez[0] + 0.07 + k[0] * t * 2, vez[1] - 0.22 * t, vez[2] + 0.03 + k[1] * t * 2 + 0.03 * Math.sin(t * 6)]; }, {
          r: function () { return 0.008; }, boja: function (T) { return tvar(T, C.uzica, 0.75, 0.4, 1, V.OBICNO, 0.92); }
        });
      });
    }
  });
})();
