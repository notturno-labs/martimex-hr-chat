// Jasmin: dva bijela cvijeta sa šest latica i žućkastom sredinom, leže na
// stolu (ispred zdjele, lijevo od nje, i desno sprijeda)
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, tvar = N.tvar;

  N.predmet('jasmin', {
    red: 90,
    gradi: function* (S) {
      const CVJETOVI = [{ c: [0.42, STOL_Y + 0.025, -0.7], kut: 0.4 }, { c: [1.16, STOL_Y + 0.025, -0.34], kut: 1.4 }];
      for (let ci = 0; ci < CVJETOVI.length; ci++) {
        const k = CVJETOVI[ci], lok = N.uLokalno(N.matrica(k.kut), k.c);
        const sdf = function (x, y, z) {
          const p = lok(x, y, z);
          let d = Infinity;
          for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a);
            const lx = ca * p[0] + sa * p[2] - 0.072, lz = -sa * p[0] + ca * p[2];
            const ct = Math.cos(0.28), st = Math.sin(0.28), tx = ct * lx + st * p[1], ty = -st * lx + ct * p[1];   // latica se prema vrhu diže
            d = Math.min(d, N.sdElipsoid(tx, ty - 0.01, lz, 0.085, 0.016, 0.04));
          }
          return N.smin(d, Math.hypot(p[0], p[1] - 0.012, p[2]) - 0.026, 0.012);
        };
        N.rezSDF(S, sdf, [k.c[0] - 0.18, k.c[0] + 0.18, k.c[1] - 0.03, k.c[1] + 0.09, k.c[2] - 0.18, k.c[2] + 0.18], {
          h: S.korak * 0.3, bezDna: true,
          boja: function (T) {
            const p = lok(T.x, T.y, T.z), rr = Math.hypot(p[0], p[2]);
            const col = mijesaj(C.jasminSredina, C.jasmin, korakG(0.025, 0.085, rr));
            return tvar(T, puta(col, 0.92 + 0.12 * pjega(T.x, T.y, T.z, 50)), 0.45, 0.55, 1.1, V.OBICNO, 0.3);
          }
        });
        N.zaklonKrug(k.c[0], k.c[2], 0.16, 0.05);
        yield;
      }
    }
  });
})();
