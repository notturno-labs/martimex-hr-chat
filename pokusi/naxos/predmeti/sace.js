// Tanjur (lijevo straga) i na njemu dva komada saća: kutije sa šesterokutnim
// stanicama urezanima odozgo; vrh stanica zlatnožut, dublje tamniji jantar.
// Gornji komad leži na donjem, zakrenut
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, sat = N.sat, pjega = N.pjega, tvar = N.tvar;

  const TANJUR = N.TANJUR = { x: -1.1, z: -1.15, r: 0.64 };

  N.predmet('sace', {
    red: 30,
    gradi: function* (S) {
      N.prsteni(S, [[0, 0.64, 1], [0.045, 0.625, 1], [0.055, 0.58, 1], [0.03, 0.5, 0], [0.02, 0.47, 0], [0.02, 0, 0]], {
        pomak: [TANJUR.x, STOL_Y, TANJUR.z],
        tezina: function (y, r, ny, m) { return m ? 1 : 0.45; },
        boja: function (T, y, r, a, ny, m) {
          if (!m && N.uZaklonu(T.x, T.z)) return false;
          const col = puta(C.tanjur, (0.9 + 0.2 * pjega(T.x, T.y, T.z, 20)) * (m ? 1.05 : 0.95));
          return tvar(T, col, 0.6, 0.5, m ? 1 : 0.8, V.OBICNO, 0.12);
        }
      });
      N.zaklonKrug(TANJUR.x, TANJUR.z, TANJUR.r, 0.06);
      yield;
      const R = 0.05, ZID = 0.009, DUB = 0.06;
      const KOMADI = [{ c: [-1.22, STOL_Y + 0.02 + 0.085, -0.95], h: [0.31, 0.085, 0.15], kut: 0.18, od: 0.45 },
        { c: [-1.04, STOL_Y + 0.02 + 0.17 + 0.085, -1.25], h: [0.32, 0.085, 0.14], kut: -0.38, od: 0.48 }];
      for (let ki = 0; ki < KOMADI.length; ki++) {
        const k = KOMADI[ki], M = N.matrica(k.kut), lok = N.uLokalno(M, k.c), hx = k.h[0], hy = k.h[1], hz = k.h[2];
        const sdf = function (x, y, z) {
          const p = lok(x, y, z), kut = N.sdKutija(p[0], p[1], p[2], hx, hy, hz, 0.012);
          const st = Math.max(N.sace2D(p[0], p[2], R) + ZID / 2, (hy - DUB) - p[1]);
          return Math.max(kut, -st);
        };
        N.rezSDF(S, sdf, [k.c[0] - 0.36, k.c[0] + 0.36, k.c[1] - hy - 0.01, k.c[1] + hy + 0.01, k.c[2] - 0.36, k.c[2] + 0.36], {
          h: S.korak * 0.3, bezDna: true,
          boja: function (T) {
            const p = lok(T.x, T.y, T.z), dub = sat((hy - p[1]) / DUB), uStanici = N.sace2D(p[0], p[2], R) + ZID / 2 < 0;
            let col;
            if (uStanici) col = mijesaj(mijesaj(C.sace, C.saceTamno, 0.35 + 0.65 * dub), C.sace, 0.25 * korakG(0.5, 1, T.ny));   // zidovi i dno stanica
            else col = mijesaj(C.sace, C.saceTamno, 0.25 * (1 - korakG(0.5, 0.9, T.ny)));                                       // vrh zidova i bokovi komada
            col = puta(col, 0.88 + 0.24 * pjega(T.x, T.y, T.z, 30));
            return tvar(T, col, 0.75, 0.45, uStanici ? 1.0 : 1.3, V.OBICNO, k.od);
          }
        });
        yield;
      }
    }
  });
})();
