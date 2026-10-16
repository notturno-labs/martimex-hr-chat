// Jasmin: dva bijela cvijeta na stolu (lijevo ispred zdjele i desno sprijeda):
// šest šiljasto-ovalnih, blago udubljenih latica, žućkasto-zelena sredina s
// cjevčicom, uz svaki cvijet dva neotvorena pupa i sitan zeleni listić.
// Latice su svilenkaste, bijele s toplim sjenama (ne blješte)
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, sat = N.sat, norm3 = N.norm3, kriz = N.kriz, tvar = N.tvar, boja01 = N.boja01;
  const LATICA = boja01('#f8f4ec'), LATICA_SJ = boja01('#d9cbb4'), SREDINA = boja01('#e3c25c'), PUP = boja01('#eef0dc'), PUP_Z = boja01('#9fb26a'), LIST = boja01('#4a7a30');

  N.predmet('jasmin', {
    red: 90,
    gradi: function* (S) {
      const CVJETOVI = [{ c: [0.42, STOL_Y + 0.025, -0.7], kut: 0.4, pupovi: [0.9, 2.3], list: 3.9 }, { c: [1.16, STOL_Y + 0.025, -0.34], kut: 1.4, pupovi: [1.6, 4.4], list: 0.3 }];
      for (let ci = 0; ci < CVJETOVI.length; ci++) {
        const k = CVJETOVI[ci], M = N.matrica(k.kut), lok = N.uLokalno(M, k.c);
        const sdf = function (x, y, z) {
          const p = lok(x, y, z);
          let d = Infinity;
          for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a);
            const lx = ca * p[0] + sa * p[2] - 0.072, lz = -sa * p[0] + ca * p[2];
            const ct = Math.cos(0.3), st = Math.sin(0.3), tx = ct * lx + st * p[1], ty = -st * lx + ct * p[1];   // latica se prema vrhu diže
            const suz = 1 - 0.45 * sat(tx / 0.085);                                                              // prema vrhu uža (šiljasta)
            d = Math.min(d, N.sdElipsoid(tx, ty - 0.012 + 0.012 * (lz * lz) / 0.0016, lz / suz, 0.088, 0.014, 0.04));   // blago udubljena
          }
          return N.smin(d, Math.hypot(p[0], p[1] - 0.014, p[2]) - 0.025, 0.012);
        };
        N.rezSDF(S, sdf, [k.c[0] - 0.18, k.c[0] + 0.18, k.c[1] - 0.03, k.c[1] + 0.09, k.c[2] - 0.18, k.c[2] + 0.18], {
          h: S.korak * 0.3, bezDna: true,
          boja: function (T) {
            const p = lok(T.x, T.y, T.z), rr = Math.hypot(p[0], p[2]);
            let col = mijesaj(SREDINA, LATICA, korakG(0.02, 0.07, rr));
            col = mijesaj(col, LATICA_SJ, 0.35 * (1 - korakG(0.0, 0.6, T.ny)) + 0.15 * korakG(0.09, 0.15, rr));   // sjene u udubini i pri vrhu latica
            col = puta(col, 0.94 + 0.1 * pjega(T.x, T.y, T.z, 50));
            return tvar(T, col, 0.45, 0.55, 0.85, V.OBICNO, 0.3);
          }
        });
        // pupovi: izduženi, pri vrhu zeleno-bijeli, iz sredine prema van
        for (let pi = 0; pi < k.pupovi.length; pi++) {
          const a = k.pupovi[pi] + k.kut, dx = Math.cos(a), dz = Math.sin(a);
          const A = [k.c[0] + dx * 0.05, k.c[1] - 0.005, k.c[2] + dz * 0.05], B = [k.c[0] + dx * 0.17, k.c[1] + 0.02, k.c[2] + dz * 0.17];
          N.cijev(S, function (t) { return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t + 0.01 * Math.sin(Math.PI * t), A[2] + (B[2] - A[2]) * t]; }, {
            r: function (t) { return 0.004 + 0.016 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.02)), 0.8) * (t < 0.3 ? 0.5 + 0.5 * t / 0.3 : 1); },
            boja: function (T, t) { return tvar(T, mijesaj(PUP_Z, PUP, korakG(0.25, 0.7, t)), 0.5, 0.5, 0.9, V.OBICNO, 0.32); }
          });
        }
        // listić: mala plahta uz cvijet
        const la = k.list + k.kut, ld = norm3([Math.cos(la), 0.15, Math.sin(la)]), le = norm3(kriz(ld, [0, 1, 0])), lb = [k.c[0] + ld[0] * 0.07, k.c[1] - 0.01, k.c[2] + ld[2] * 0.07];
        N.plahta(S, function (u, v) {
          const w = 0.03 * Math.sin(Math.PI * u), s = 2 * v - 1;
          return [lb[0] + ld[0] * 0.14 * u + le[0] * w * s, lb[1] + ld[1] * 0.14 * u + 0.01 * s * s, lb[2] + ld[2] * 0.14 * u + le[2] * w * s];
        }, { gore: true, boja: function (T, u, v) { return tvar(T, mijesaj(LIST, PUP_Z, 0.3 * (1 - Math.abs(2 * v - 1)) * (Math.abs(2 * v - 1) < 0.08 ? 1 : 0.3)), 0.7, 0.5, 0.9, V.OBICNO, 0.33); } });
        N.zaklonKrug(k.c[0], k.c[2], 0.17, 0.05);
        yield;
      }
    }
  });
})();
