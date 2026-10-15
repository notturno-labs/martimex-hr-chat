// Flakon Xerjoff 1861 Naxos na jantarnom bloku: geometrija je iz pocetna-chata.js
// (NAXOS.flakon), boje s fotografije: bjelokosno mutno staklo s medenom tekućinom
// do razine 0,2 (prema dnu je staklo deblje, pa boja blijedi), čep, prsten i
// pločica od ružičastog zlata, znak X zlatan. Nastaje zadnji, odozdo
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, T = N.T, V = N.vrste;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, zasiti = N.zasiti, sat = N.sat, tvar = N.tvar;

  N.predmet('flakon', {
    red: 20,
    gradi: function* (S) {
      const nF = Math.round(3.377 * N.OMJER / (S.korak * S.korak));   // flakon ima 3,38 jedinice² ploha (tako mu generator mjeri razmak niti)
      const gen = N.flakon(Math.max(2000, nF));
      let r = gen.next();
      while (!r.done) { r = gen.next(); yield; }
      const f = r.value, razina = 0.2;
      if (!S.broji) {
        for (let i = 0; i < f.poz.length / 3; i++) {
          const x = f.poz[3 * i], y = f.poz[3 * i + 1], z = f.poz[3 * i + 2], m = f.vrsta[i];
          T.x = x; T.y = y; T.z = z; T.nx = f.nor[3 * i]; T.ny = f.nor[3 * i + 1]; T.nz = f.nor[3 * i + 2];
          const odgoda = 0.55 + 0.3 * sat((y + 0.86) / 1.76);
          if (m === 0 || m === 4) {
            // staklo (0) i bridovi faseta (4): tekućina ispod razine, nit na razini
            const tek = (y < razina ? 1 : 0) * korakG(-0.9, -0.45, y), dr = (y - razina) / 0.016;
            let col = mijesaj(C.staklo, C.tekucina, 0.55 * tek);
            const g = 0.5 * Math.exp(-dr * dr);
            col = [col[0] + C.tekucina[0] * g, col[1] + C.tekucina[1] * g, col[2] + C.tekucina[2] * g];
            tvar(T, m === 4 ? puta(col, 1.5) : col, 0.65, 0.45, m === 4 ? 2.2 : 1.3, V.STAKLO_F, odgoda);
          } else if (m === 1) tvar(T, puta(zasiti(C.zlatoFlakona, 1.2), 1.05), 1, 0.28, 1, V.ZLATO_F, odgoda);     // čep i prsten
          else if (m === 2) tvar(T, puta(zasiti(C.plocica, 1.2), 0.95), 0.35, 0.28, 1.8, V.ZLATO_F, odgoda);     // pločica
          else tvar(T, puta(zasiti(C.znakX, 1.1), 1.2), 0.35, 0.28, 0.8, V.ZLATO_F, odgoda);                     // znak X i okvir
          S.dodaj(T);
        }
      } else S.n += f.poz.length / 3;
      S.korakFlakona = f.korak;
      N.zaklonKrug(0, 0, 0.36, 1.76);
    }
  });
})();
