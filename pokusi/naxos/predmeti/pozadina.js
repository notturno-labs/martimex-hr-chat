// Pozadina: topli ožbukani zid iza stola i prozor gore lijevo kroz koji ulazi
// sunce (okvir s prečkom, svijetlo staklo, zid oko prozora obasjan). Rijetke,
// blijede niti, da ostane podloga, a ne predmet
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const lerp = N.lerp, korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, tvar = N.tvar;

  const ZID_Z = -3.7, PROZOR = { x0: -2.6, x1: -1.15, y0: STOL_Y + 1.05, y1: STOL_Y + 3.0 };

  N.predmet('pozadina', {
    red: 210, podloga: true,
    gradi: function* (S) {
      if (!N.P.pozadina) return;
      const sx = (PROZOR.x0 + PROZOR.x1) / 2, sy = (PROZOR.y0 + PROZOR.y1) / 2;
      N.plahta(S, function (u, v) { return [lerp(-3.3, 3.3, u), STOL_Y + lerp(0, 3.5, v), ZID_Z]; }, {
        razmak: 2.2, tezina: 0.4,
        boja: function (T, u, v) {
          T.nx = 0; T.ny = 0; T.nz = 1;
          const x = T.x, y = T.y;
          const uProzoru = x > PROZOR.x0 && x < PROZOR.x1 && y > PROZOR.y0 && y < PROZOR.y1;
          const rub = Math.min(x - PROZOR.x0, PROZOR.x1 - x, y - PROZOR.y0, PROZOR.y1 - y);
          if (uProzoru) {
            if (rub < 0.05 || Math.abs(x - sx) < 0.025 || Math.abs(y - sy) < 0.025) return tvar(T, C.okvir, 0.4, 0.6, 0.4, V.POZADINA, 0.0);   // okvir i prečke
            const sred = Math.hypot((x - sx) / 0.9, (y - sy) / 1.1);
            return tvar(T, puta(C.prozor, 0.85 + 0.2 * pjega(x, y, 1, 3)), 0.0, 1, 0.22 + 0.2 * (1 - korakG(0.4, 1, sred)), V.POZADINA, 0.0);   // sunce kroz staklo, u sredini jače
          }
          // zid: obasjan oko prozora, prema dolje i udesno tamniji
          const sjaj = Math.exp(-(Math.pow((x - sx) / 1.6, 2) + Math.pow((y - sy) / 1.5, 2))) * 0.6 + 0.25 * korakG(STOL_Y, STOL_Y + 3.2, y);
          const col = puta(mijesaj(C.zidTamno, C.zid, Math.min(1, sjaj)), 0.9 + 0.2 * pjega(x, y, 2, 12));
          const jak = 0.3 + 0.45 * sjaj;
          return tvar(T, col, 0.3, 0.6, jak, V.POZADINA, 0.0);
        }
      });
    }
  });
})();
