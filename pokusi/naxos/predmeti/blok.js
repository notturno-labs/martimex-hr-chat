// Jantarni blok: zaobljena kvadratna ploča na stolu, okrenuta (BLOK.kut), na njoj
// flakon (vrh bloka je u y = DNO_BOCICE). Duboka jantarna boja, vrh svjetliji,
// bridovi žare (kroz njih prolazi sunce); unutra nekoliko rijetkih niti kao
// sjaj u dubini. Vrh ispod flakona nema točkica
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, sat = N.sat, pjega = N.pjega, tvar = N.tvar;

  const BLOK = N.BLOK = { x: 0.04, z: 0.17, pola: 0.8, visina: 0.095, kut: 0.65 };

  N.predmet('blok', {
    red: 10,
    gradi: function* (S) {
      const M = N.matrica(BLOK.kut), c = [BLOK.x, STOL_Y + BLOK.visina, BLOK.z], lok = N.uLokalno(M, c), H = BLOK.pola;
      const sdf = function (x, y, z) { const p = lok(x, y, z); return N.sdKutija(p[0], p[1], p[2], H, BLOK.visina, H, 0.02); };
      const boja = function (T) {
        const p = lok(T.x, T.y, T.z), rub = Math.max(Math.abs(p[0]), Math.abs(p[2])) / H;
        const vrh = korakG(0.6, 0.9, T.ny);
        const lice = sat(0.5 + 0.5 * (-0.55 * T.nx + 0.83 * T.nz));           // strana okrenuta svjetlu
        let col = mijesaj(mijesaj(C.jantar, C.jantarVrh, vrh), C.jantarVrh, 0.35 * lice * (1 - vrh));
        col = mijesaj(col, C.jantarRub, korakG(0.86, 1, rub) * 0.7);
        col = puta(col, 0.85 + 0.3 * pjega(T.x, T.y, T.z, 9));
        if (T.ny > 0.7 && N.uZaklonu(T.x, T.z)) return false;                 // vrh ispod flakona
        return tvar(T, col, 0.8, 0.5, 1, V.OBICNO, 0.08 + 0.05 * rub);
      };
      N.rezSDF(S, sdf, [c[0] - H * 1.45, c[0] + H * 1.45, STOL_Y - 0.01, STOL_Y + 2 * BLOK.visina + 0.01, c[2] - H * 1.45, c[2] + H * 1.45], { boja: boja, bezDna: true });
      yield;
      const unutra = function (x, y, z) { const p = lok(x, y, z); return N.sdKutija(p[0], p[1] * 2.2, p[2], H * 0.86, BLOK.visina, H * 0.86, 0.04); };
      N.rezSDF(S, unutra, [c[0] - H * 1.45, c[0] + H * 1.45, STOL_Y + 0.02, STOL_Y + 2 * BLOK.visina - 0.02, c[2] - H * 1.45, c[2] + H * 1.45], {
        osi: 'y', tezina: 0.3, boja: function (T) { return tvar(T, puta(C.jantarRub, 0.8 + 0.4 * pjega(T.x, T.y, T.z, 6)), 0.5, 0.6, 0.35, V.OBICNO, 0.1); }
      });
      N.zaklonKutija(BLOK.x, BLOK.z, BLOK.kut, H, H, 2 * BLOK.visina);
    }
  });
})();
