// Štapići cimeta: tri smotana štapića (po duljini brazda smotka, presjek malo
// spljošten), od sprijeda lijevo prema straga (iza lijevog ugla bloka); dva
// leže, treći na njima; na krajevima spirala smotane kore
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const lerp = N.lerp, korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, norm3 = N.norm3, kriz = N.kriz, tvar = N.tvar;

  N.predmet('cimet', {
    red: 40,
    gradi: function* (S) {
      const A0 = [-1.37, 0.25], B0 = [-0.44, -1.58], dx = B0[0] - A0[0], dz = B0[1] - A0[1], L = Math.hypot(dx, dz);
      const px = -dz / L, pz = dx / L, r0 = 0.055;
      const STAPICI = [{ o: -0.065, y: r0, f0: 0.9, s: 0.0 }, { o: 0.065, y: r0, f0: 2.4, s: 0.06 }, { o: 0.0, y: r0 * 2.72, f0: -0.6, s: -0.05 }];
      for (let i = 0; i < STAPICI.length; i++) {
        const k = STAPICI[i];
        const A = [A0[0] + px * k.o + dx * k.s, STOL_Y + k.y, A0[1] + pz * k.o + dz * k.s], Bq = [B0[0] + px * k.o + dx * k.s, STOL_Y + k.y, B0[1] + pz * k.o + dz * k.s];
        const put = function (t) { return [lerp(A[0], Bq[0], t), A[1], lerp(A[2], Bq[2], t)]; };
        const polumjer = function (t, a) {
          const d = ((a - k.f0 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
          return r0 * (1 + 0.07 * Math.cos(2 * a + k.f0) - 0.22 * Math.exp(-d * d / 0.09));
        };
        N.cijev(S, put, {
          r: polumjer,
          boja: function (T, t, a, r) {
            const brazda = korakG(r0 * 0.97, r0 * 0.85, r);
            let col = mijesaj(mijesaj(C.cimet, C.cimetSvjetlo, 0.3 + 0.5 * pjega(t * 6 + i, a * 0.5, i, 1.0)), C.cimetTamno, brazda);
            col = puta(col, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 40));
            return tvar(T, col, 0.85, 0.4, 1, V.OBICNO, 0.18 + 0.06 * t);
          }
        });
        // spirala kore na oba kraja (u ravnini okomitoj na štapić)
        const tg = norm3([dx, 0, dz]), e1 = norm3(kriz([0, 1, 0], tg)), e2 = kriz(tg, e1);
        [[A, -1], [Bq, 1]].forEach(function (kraj) {
          const Pk = kraj[0], sm = kraj[1];
          S.nit(function (u, T) {
            const s = u, r = r0 * 0.9 * (1 - 0.82 * s), a = k.f0 + 2 * 2 * Math.PI * s;
            T.x = Pk[0] + e1[0] * r * Math.cos(a) + e2[0] * r * Math.sin(a); T.y = Pk[1] + e1[1] * r * Math.cos(a) + e2[1] * r * Math.sin(a); T.z = Pk[2] + e1[2] * r * Math.cos(a) + e2[2] * r * Math.sin(a);
            T.nx = tg[0] * sm; T.ny = 0; T.nz = tg[2] * sm;
            return tvar(T, mijesaj(C.cimetSvjetlo, C.cimet, 0.5 + 0.5 * Math.sin(s * 20)), 0.7, 0.4, 1.1, V.OBICNO, 0.22);
          }, 2 * Math.PI * r0 * 0.9 * 2 * 0.6, 1, false);
        });
        if (i < 2) N.zaklonKapsula(A[0], A[2], Bq[0], Bq[2], r0 * 1.1, 0.16);
        yield;
      }
    }
  });
})();
