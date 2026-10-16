// Bergamot: svijetlo žutozelen citrus s kvrgavom, jamičastom korom, straga
// lijevo iza tanjura; sunce ga obasjava odozgo straga, pa je lijevo gore
// svjetliji i ima svijetli rub. Mala peteljka i sjajan tamnozeleni list sa
// središnjom i bočnim žilama, malo uvijen, nagnut prema gore lijevo
(function () {
  'use strict';
  const N = window.NAXOS, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, sum = N.sum, norm3 = N.norm3, kriz = N.kriz, sat = N.sat, tvar = N.tvar, boja01 = N.boja01;
  const KORA = boja01('#c9d055'), KORA_S = boja01('#e6ea92'), KORA_T = boja01('#8d9a32'), LIST = boja01('#3d6a25'), LIST_S = boja01('#8bb352'), PETELJKA = boja01('#7c7a3c');

  N.predmet('bergamot', {
    red: 50,
    gradi: function* (S) {
      const c = [-0.5, STOL_Y + 0.3, -2.06], R = 0.3;
      const sdf = function (x, y, z) {
        const px = x - c[0], py = y - c[1], pz = z - c[2];
        const r = Math.hypot(px, py * 1.06, pz);
        const kv = 0.011 * sum(px * 42, py * 42, pz * 42) + 0.004 * sum(px * 110 + 3, py * 110, pz * 110);
        const udub = 0.04 * Math.exp(-(px * px + pz * pz) / 0.005) * (py > 0 ? 1 : 0);
        const voce = r - R - kv + udub;
        const pet = N.sdKapsula(x, y, z, [c[0], c[1] + R * 0.88, c[2]], [c[0] + 0.04, c[1] + R + 0.12, c[2] - 0.02], 0.015);
        return Math.min(voce, pet);
      };
      N.rezSDF(S, sdf, [c[0] - R - 0.04, c[0] + R + 0.04, c[1] - R - 0.02, c[1] + R + 0.16, c[2] - R - 0.04, c[2] + R + 0.04], {
        osi: 'y',
        boja: function (T) {
          const px = T.x - c[0], py = T.y - c[1], pz = T.z - c[2];
          if (py > R * 0.86 && px * px + pz * pz < 0.004) return tvar(T, PETELJKA, 0.7, 0.4, 1, V.OBICNO, 0.4);   // peteljka
          // kora: kvrge svjetlije, udubine tamnije; strana sunca (gore straga lijevo) svjetlija; jamice (pore) tamne
          const kv = sum(px * 42, py * 42, pz * 42);
          let col = mijesaj(KORA_T, KORA, 0.5 + 0.5 * kv);
          col = mijesaj(col, KORA_S, 0.3 * korakG(0.2, 0.8, kv) + 0.3 * sat(-0.5 * T.nx - 0.55 * T.nz + 0.5 * T.ny));
          const pore = pjega(T.x, T.y, T.z, 160);
          if (pore < 0.12) col = puta(col, 0.72);
          col = puta(col, 0.92 + 0.16 * pjega(T.x + 5, T.y, T.z, 70));
          return tvar(T, col, 0.85, 0.4, 1.1, V.OBICNO, 0.4);
        }
      });
      N.zaklonKrug(c[0], c[2], R, 0.6);
      yield;
      // list: plahta od vrha peteljke prema gore lijevo, malo uvijena; žile
      const baza = [c[0] + 0.04, c[1] + R + 0.12, c[2] - 0.02], d = norm3([-0.72, 0.62, 0.1]), nl = norm3([0.25, 0.3, 0.92]), e = norm3(kriz(d, nl));
      N.plahta(S, function (u, v) {
        const w = 0.105 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.75), s = 2 * v - 1, L = 0.44;
        const uv = 0.03 * s * s + 0.012 * Math.sin(u * 9) + 0.025 * u * u;
        return [baza[0] + d[0] * L * u + e[0] * w * s + nl[0] * uv, baza[1] + d[1] * L * u + e[1] * w * s + nl[1] * uv, baza[2] + d[2] * L * u + e[2] * w * s + nl[2] * uv];
      }, {
        boja: function (T, u, v) {
          const s = 2 * v - 1, as = Math.abs(s);
          let col = mijesaj(LIST, LIST_S, 0.2 + 0.35 * pjega(u * 7, v * 5, 1, 1));
          if (as < 0.05) col = mijesaj(col, LIST_S, 0.7);                                                  // središnja žila
          const zila = Math.abs(((((u * 8 - as * 1.3) % 1) + 1) % 1) - 0.5);
          if (zila < 0.05 && u > 0.08) col = mijesaj(col, LIST_S, 0.5 * (1 - zila / 0.05));                   // bočne žile, koso prema vrhu
          col = mijesaj(col, LIST_S, 0.25 * korakG(0.2, 0.9, -T.nx * 0.4 + T.ny * 0.5 - T.nz * 0.5));       // sjaj prema suncu
          return tvar(T, col, 0.75, 0.5, 1.0, V.OBICNO, 0.44);
        }
      });
    }
  });
})();
