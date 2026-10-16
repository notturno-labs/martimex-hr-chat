// Zdjela meda s drvenom žlicom (desno od flakona): rustična krem keramika s
// tamnijim pjegama i tankom tamnijom crtom uz rub, širi se prema gore;
// unutra tekući med jantarne boje sa sjajnim odsjajem prozora (svjetlija
// mrlja straga lijevo) i meniskusom uz stijenku; drvena žlica svijetlog drva
// s ovalnom glavom koja je napola u medu i oblivena medom, drška strši gore desno
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const lerp = N.lerp, korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, sat = N.sat, norm3 = N.norm3, tvar = N.tvar, boja01 = N.boja01;

  const ZDJELA = N.ZDJELA = { x: 0.88, z: -1.0 };
  const KERAMIKA = C.zdjela, PJEGA = C.zdjelaPjege, CRTA = boja01('#9c8c74'), MED = C.med, MED_S = C.medSvjetlo, MED_SJAJ = boja01('#ffe2a0'), DRVO = C.zlica, DRVO_T = boja01('#9a7446');
  const RAZ = 0.29;                                                  // visina meda

  N.predmet('zdjela', {
    red: 80,
    gradi: function* (S) {
      N.prsteni(S, [[0, 0.24, 0], [0.03, 0.33, 0], [0.1, 0.44, 0], [0.2, 0.52, 0], [0.3, 0.56, 0], [0.36, 0.575, 1], [0.375, 0.565, 1], [0.37, 0.545, 2], [0.3, 0.515, 2], [RAZ, 0.505, 3], [RAZ, 0, 3]], {
        pomak: [ZDJELA.x, STOL_Y, ZDJELA.z],
        tezina: function (y, r, ny, m) { return m === 3 ? 0.55 : 1; },
        boja: function (T, y, r, a, ny, m) {
          if (m === 3) {
            // med: prema sredini svjetliji, meniskus uz stijenku, odsjaj prozora straga lijevo
            const lx = r * Math.cos(a), lz = r * Math.sin(a);
            const od = Math.hypot((lx + 0.17) / 0.2, (lz + 0.2) / 0.13);
            let col = mijesaj(MED, MED_S, 0.25 + 0.35 * (1 - r / 0.505) + 0.2 * pjega(a * 3, r * 10, 1, 1));
            col = mijesaj(col, MED_SJAJ, 0.55 * (1 - korakG(0.4, 1.0, od)));
            col = mijesaj(col, MED_S, 0.5 * korakG(0.46, 0.505, r));
            return tvar(T, col, 1, 0.3, 1.1, V.OBICNO, 0.3);
          }
          const pj = pjega(T.x, T.y, T.z, 90) > 0.86;
          let col = puta(pj ? PJEGA : KERAMIKA, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 7));
          if (m === 1 && y > 0.372) col = mijesaj(col, CRTA, 0.6);                 // tamnija crta uz rub
          if (m === 2) col = puta(col, 0.85);                                       // unutarnja stijenka u sjeni
          return tvar(T, col, 0.6, 0.45, 1, V.OBICNO, 0.28 + 0.03 * m);
        }
      });
      N.zaklonKrug(ZDJELA.x, ZDJELA.z, 0.58, 0.375);
      yield;
      // žlica: glava (napola u medu) i drška prema gore desno straga
      const A = [ZDJELA.x - 0.12, STOL_Y + RAZ - 0.01, ZDJELA.z + 0.08], Bq = [ZDJELA.x + 0.45, STOL_Y + 0.72, ZDJELA.z - 0.28];
      const dir = norm3([Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]]);
      const G = [A[0] - dir[0] * 0.07, A[1] - dir[1] * 0.07 + 0.02, A[2] - dir[2] * 0.07], Mg = N.premaSmjeru(dir), lokG = N.uLokalno(Mg, G);
      const glava = function (x, y, z) { const p = lokG(x, y, z); return N.sdElipsoid(p[0], p[1], p[2], 0.065, 0.1, 0.022); };   // os y lokalno = smjer drške
      N.rezSDF(S, glava, [G[0] - 0.12, G[0] + 0.12, G[1] - 0.1, G[1] + 0.1, G[2] - 0.12, G[2] + 0.12], {
        h: S.korak * 0.35, bezDna: true,
        boja: function (T) {
          if (T.y < STOL_Y + RAZ - 0.004) return false;                              // u medu
          const uMedu = korakG(RAZ + 0.05, RAZ, T.y - STOL_Y);
          let col = mijesaj(DRVO, DRVO_T, 0.5 * pjega(T.x * 3, T.y * 30, T.z * 3, 1));
          col = mijesaj(col, MED_S, 0.7 * uMedu);                                     // obliveno medom
          return tvar(T, col, 0.8, 0.4, 1, V.OBICNO, 0.5);
        }
      });
      N.cijev(S, function (t) { return [lerp(A[0], Bq[0], t), lerp(A[1], Bq[1], t) + 0.02 * Math.sin(Math.PI * t), lerp(A[2], Bq[2], t)]; }, {
        r: function (t) { return (0.02 + 0.016 * t) * (1 - 0.5 * korakG(0.93, 1, t)); }, spljosti: 0.45,
        boja: function (T, t, a) {
          let col = mijesaj(DRVO, DRVO_T, 0.3 + 0.4 * pjega(t * 30, a, 1, 1));
          col = mijesaj(col, MED_S, 0.6 * (1 - korakG(0.05, 0.2, t)));             // uz med obliveno
          return tvar(T, col, 0.8, 0.4, 1, V.OBICNO, 0.5 + 0.1 * t);
        }
      });
    }
  });
})();
