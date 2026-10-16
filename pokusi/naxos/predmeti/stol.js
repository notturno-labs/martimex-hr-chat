// Stol: drvene daske (niti duž vlakana), u sunčevoj mrlji oko sredine, prema
// rubu utone u tamu; ispod predmeta nema niti, a uz njih su sjene (NAXOS.sjena).
// Uz stol ide i brašno prosuto desno sprijeda (oko tonke i jasmina) i prašina
// koja lebdi u zraku u sunčevu svjetlu. Gradi se zadnji (treba tlocrte predmeta)
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const lerp = N.lerp, korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, sum = N.sum, hash3 = N.hash3, tvar = N.tvar;

  N.predmet('stol', {
    red: 200, podloga: true,
    gradi: function* (S) {
      const sjene = N.P.sjene;
      N.plahta(S, function (u, v) { const x = lerp(-2.9, 2.9, u), z = lerp(-3.7, 3.3, v); return [x, STOL_Y + 0.004 * sum(x * 3, z * 25, 1), z]; }, {
        razmak: 1.3, tezina: 0.6, gore: true,
        boja: function (T, u, v) {
          if (N.uZaklonu(T.x, T.z)) return false;
          const daska = Math.floor((T.z + 3.7) / 0.6), fuga = Math.abs((((T.z + 3.7) / 0.6) % 1) - 0.5) > 0.47;
          const sj = 0.8 + 0.4 * hash3(daska, 7, 3), zila = sum(T.x * 2.2 + daska * 11, T.z * 36, 2);
          let col = puta(mijesaj(C.stolTamno, C.stol, 0.5 + 0.5 * zila), sj * (fuga ? 0.55 : 1));
          // sunčeva mrlja: najsvjetlije oko sredine, prema rubu utone
          const e = Math.hypot(T.x / 2.6, (T.z + 0.2) / 3.4);
          let jak = 1.0 * (1 - korakG(0.72, 1, e)) * (0.7 + 0.5 * (1 - e));
          if (sjene) { const s = N.sjena(T.x, T.z); col = puta(col, 1 - 0.75 * s); jak *= 1 - 0.35 * s; }
          if (jak < 0.02) return false;
          return tvar(T, col, 0.55, 0.6, jak, V.STOL, 0.04 * v);
        }
      });
      yield;
      // brašno: tri mrlje desno sprijeda
      const GRUDE = [];
      const rg = N.slucajno(31);
      for (let i = 0; i < 26; i++) GRUDE.push([0.5 + 1.3 * rg(), 1.1 + 1.6 * rg(), 0.02 + 0.04 * rg()]);
      S.rasap(1700, function (T, r) {
        const k = r();
        if (k < 0.22) {                                                      // grudice: gušći mali skupovi
          const g = GRUDE[Math.floor(r() * GRUDE.length)], rr = g[2] * Math.sqrt(r()), a = r() * 2 * Math.PI;
          T.x = g[0] + rr * Math.cos(a); T.z = g[1] + rr * Math.sin(a); T.y = STOL_Y + 0.006 + 0.02 * r() * (1 - rr / g[2]);
          T.nx = 0; T.ny = 1; T.nz = 0;
          return tvar(T, C.brasno, 0.35, 0.7, 0.55 + 0.3 * r(), V.BRASNO, 0.6);
        }
        const cx = k < 0.7 ? 1.1 : k < 0.88 ? 0.75 : 1.5, cz = k < 0.7 ? 2.2 : k < 0.88 ? 1.4 : 1.6, R = k < 0.7 ? 0.85 : 0.4;
        const rr = R * Math.sqrt(r()) * (0.4 + 0.8 * r()), a = r() * 2 * Math.PI;
        T.x = cx + rr * Math.cos(a) * 1.25 + 0.06 * N.sum(cx * 3 + a, cz, 1); T.z = cz + rr * Math.sin(a); T.y = STOL_Y + 0.004 + 0.012 * r();
        T.nx = 0; T.ny = 1; T.nz = 0;
        return tvar(T, C.brasno, 0.3, 0.7, 0.25 + 0.4 * r(), V.BRASNO, 0.6);
      });
      // prašina u zraku
      S.rasap(700, function (T, r) {
        T.x = lerp(-2.0, 2.0, r()); T.y = STOL_Y + 0.1 + 2.3 * r(); T.z = lerp(-2.5, 1.5, r());
        T.nx = 0; T.ny = 0; T.nz = 1;
        return tvar(T, C.prasina, 0, 1, 0.2 + 0.3 * r(), V.PRASINA, 0.9);
      });
    }
  });
})();
