// Bergamot: kvrgava žutozelena kugla s peteljkom i listom (iza tanjura, lijevo
// od flakona); list je plahta od vrha peteljke prema gore lijevo, malo uvijena
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, sum = N.sum, norm3 = N.norm3, kriz = N.kriz, tvar = N.tvar;

  N.predmet('bergamot', {
    red: 50,
    gradi: function* (S) {
      const c = [-0.5, STOL_Y + 0.3, -2.06], R = 0.3;
      const sdf = function (x, y, z) {
        const px = x - c[0], py = y - c[1], pz = z - c[2];
        const r = Math.hypot(px, py * 1.06, pz), kv = 0.012 * sum(px * 38, py * 38, pz * 38) + 0.005 * sum(px * 90 + 3, py * 90, pz * 90);
        const udub = 0.035 * Math.exp(-(px * px + pz * pz) / 0.004) * (py > 0 ? 1 : 0);
        const voce = r - R - kv + udub;
        const pet = N.sdKapsula(x, y, z, [c[0], c[1] + R * 0.9, c[2]], [c[0] + 0.05, c[1] + R + 0.13, c[2] - 0.03], 0.016);
        return Math.min(voce, pet);
      };
      N.rezSDF(S, sdf, [c[0] - R - 0.04, c[0] + R + 0.04, c[1] - R - 0.02, c[1] + R + 0.16, c[2] - R - 0.04, c[2] + R + 0.04], {
        osi: 'y',
        boja: function (T) {
          const px = T.x - c[0], py = T.y - c[1], pz = T.z - c[2];
          if (py > R * 0.88 && px * px + pz * pz < 0.004) return tvar(T, mijesaj(C.list, C.cimet, 0.5), 0.7, 0.4, 1, V.OBICNO, 0.4);   // peteljka
          let col = mijesaj(C.bergamotTamno, C.bergamot, 0.35 + 0.65 * pjega(T.x, T.y, T.z, 22));
          col = puta(col, 0.9 + 0.25 * pjega(T.x + 5, T.y, T.z, 70));
          return tvar(T, col, 0.85, 0.4, 1, V.OBICNO, 0.4);
        }
      });
      N.zaklonKrug(c[0], c[2], R, 0.6);
      yield;
      // list: plahta od vrha peteljke prema gore lijevo, malo uvijena
      const baza = [c[0] + 0.05, c[1] + R + 0.13, c[2] - 0.03], d = norm3([-0.72, 0.62, 0.1]), nl = norm3([0.25, 0.3, 0.92]), e = norm3(kriz(d, nl));
      N.plahta(S, function (u, v) {
        const w = 0.105 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.75), s = 2 * v - 1, L = 0.44;
        const uv = 0.025 * s * s + 0.02 * Math.sin(u * 9) * 0.5;
        return [baza[0] + d[0] * L * u + e[0] * w * s + nl[0] * uv, baza[1] + d[1] * L * u + e[1] * w * s + nl[1] * uv, baza[2] + d[2] * L * u + e[2] * w * s + nl[2] * uv];
      }, {
        boja: function (T, u, v) {
          const s = Math.abs(2 * v - 1);
          let col = mijesaj(C.list, C.listSvjetlo, 0.25 + 0.5 * pjega(u * 7, v * 5, 1, 1) + 0.35 * (1 - korakG(0, 0.1, s)));
          if (Math.abs(((v * 7) % 1) - 0.5) < 0.06) col = mijesaj(col, C.listSvjetlo, 0.4);   // bočne žile
          return tvar(T, col, 0.6, 0.5, 0.95, V.OBICNO, 0.44);
        }
      });
    }
  });
})();
