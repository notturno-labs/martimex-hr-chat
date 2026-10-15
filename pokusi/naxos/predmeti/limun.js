// Limun: prerezana polovica, prerez okrenut prema nama i malo ulijevo-gore
// (desno straga, iza zdjele): kora, bijeli rub, kriške s opnama
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, norm3 = N.norm3, tvar = N.tvar;

  N.predmet('limun', {
    red: 70,
    gradi: function* (S) {
      const c = [0.98, STOL_Y + 0.27, -2.42], R = 0.27, M = N.premaSmjeru(norm3([-0.3, 0.42, 0.86])), prof = [];
      for (let k = 10; k >= 0; k--) { const f = (k + 0.3) / 10.3 * Math.PI / 2; prof.push([-R * Math.sin(f), R * Math.cos(f), 0]); }
      prof.push([0, R, 1], [0, R * 0.985, 2], [0, 0, 2]);
      N.prsteni(S, prof, {
        M: M, pomak: c, tezina: function (y, r, ny, m) { return m === 2 ? 0.7 : 1; },
        boja: function (T, y, r, a, ny, m) {
          let col;
          if (m === 2) {
            // prerez: bijeli rub, devet kriški s opnama, meso prema rubu svjetlije
            const rr = r / R, seg = 9, ka = (a * seg / (2 * Math.PI)) % 1, opna = Math.min(ka, 1 - ka) * 2 * Math.PI * rr * R / seg;
            if (rr > 0.9) col = mijesaj(C.limunOpna, C.limunKora, korakG(0.93, 1, rr) * 0.6);
            else if (opna < 0.013 || rr < 0.06) col = C.limunOpna;
            else col = mijesaj(C.limunMeso, C.limunOpna, 0.15 * pjega(a * 12, rr * 30, 1, 1) + 0.25 * korakG(0.78, 0.9, rr));
            return tvar(T, puta(col, 0.95 + 0.15 * pjega(T.x, T.y, T.z, 60)), 0.55, 0.5, 1.3, V.OBICNO, 0.5);
          }
          col = mijesaj(C.limunKora, C.limunMeso, m === 1 ? 0.5 : 0.1 * pjega(T.x, T.y, T.z, 12));
          return tvar(T, puta(col, 0.85 + 0.3 * pjega(T.x, T.y, T.z, 80)), 0.9, 0.4, 1.2, V.OBICNO, 0.5);
        }
      });
      N.zaklonKrug(c[0], c[2], R, 0.54);
    }
  });
})();
