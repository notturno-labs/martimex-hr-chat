// Štapići cimeta (kasija): tri smotane kore od sprijeda lijevo prema straga
// (iza lijevog ugla bloka): dva leže na stolu, treći na njima. Tijelo je
// plahta s nitima uzduž štapića (vlakna kore): presjek malo spljošten i
// uglat, uzduž cijelog štapića šav smotka (rub kore koji prelazi preko šava,
// taman usjek i udubljena kora ispod ruba), uzdužni nabori i sitne brazde,
// pjege i rijetke poprečne pukotine. Na krajevima je presjek smotane kore:
// traka kore u spirali (vanjski zavoj pa još zavoj i pol prema sredini),
// svjetlije unutrašnjosti i tamnija prema sredini smotka
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const lerp = N.lerp, korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, sum = N.sum, norm3 = N.norm3, kriz = N.kriz, tvar = N.tvar;

  const TAU = 2 * Math.PI;
  const R0 = 0.055, W = 0.014, RAZMAK_KORE = 0.004;     // polumjer štapića, debljina kore, razmak zavoja kore u smotku
  const UNUTRA = mijesaj(C.cimetSvjetlo, [0.9, 0.7, 0.48], 0.5);   // prerez i unutarnja strana kore: svjetlija, žućkasta
  const A0 = [-1.37, 0.25], B0 = [-0.44, -1.58];
  const DX = B0[0] - A0[0], DZ = B0[1] - A0[1], L0 = Math.hypot(DX, DZ), PX = -DZ / L0, PZ = DX / L0;
  // o0/o1: pomak okomito na smjer na početku/kraju (blago se razilaze), y: visina osi,
  // s0/s1: udio duljine, f0: kut šava (0 = lijevo-straga, π/2 = gore, π = prema nama),
  // fi: okret presjeka, otvor: širina udubljene kore uz šav (rad), unutra: koliko se
  // ispod ruba vidi svjetlija unutarnja strana kore (labaviji smotak)
  const STAPICI = [
    { i: 0, o0: 0.064, o1: 0.072, y: R0 * 0.98, s0: 0.0, s1: 1.0, f0: 2.25, fi: 0.3, otvor: 0.3, unutra: 0.2 },     // prednji, na stolu
    { i: 1, o0: -0.066, o1: -0.07, y: R0 * 0.98, s0: 0.03, s1: 1.0, f0: 1.55, fi: -0.2, otvor: 0.6, unutra: 0.8 },  // stražnji, na stolu
    { i: 2, o0: 0.01, o1: -0.02, y: R0 * 2.6, s0: 0.1, s1: 1.0, f0: 1.95, fi: 0.1, otvor: 0.35, unutra: 0.3 }    // gornji, leži u žlijebu između njih
  ];

  const O = { d: 0, g1: 0, g2: 0, lip: 0, rec: 0 };    // nusproizvodi oblika za boju (bez alokacija)
  function ovalno(k, a) { return 1 + 0.05 * Math.cos(2 * (a - k.fi)) - 0.03 * Math.cos(4 * (a - k.fi)); }   // spljošten, malo uglat presjek
  // polumjer presjeka štapića k pod kutom a (rad) na udjelu t duljine; usput ispuni O
  function oblik(k, a, t) {
    const d = ((a - k.f0 + Math.PI) % TAU + TAU) % TAU - Math.PI;     // kutna udaljenost od šava (−π..π)
    const g1 = sum(a * 1.6 + 11 * k.i, t * 4 + 3 * k.i, 5 * k.i);     // uzdužni nabori (grebeni i brazde)
    const g2 = sum(a * 5 + 7 * k.i, t * 9, 2 * k.i + 1);             // sitnije uzdužne pruge
    const lip = korakG(-0.65, -0.3, d) * (1 - korakG(-0.1, 0, d));    // rub kore koji prelazi preko šava (strmo pada u usjek)
    const rec = korakG(k.otvor, 0.06, d) * korakG(-0.02, 0.04, d);    // kora ispod ruba: za debljinu kore niže
    O.d = d; O.g1 = g1; O.g2 = g2; O.lip = lip; O.rec = rec;
    return R0 * ovalno(k, a) * (1 + 0.07 * lip - 0.2 * rec + 0.03 * g1 + 0.012 * g2);
  }

  N.predmet('cimet', {
    red: 40,
    gradi: function* (S) {
      for (let i = 0; i < STAPICI.length; i++) {
        const k = STAPICI[i];
        const A = [A0[0] + PX * k.o0 + DX * k.s0, STOL_Y + k.y, A0[1] + PZ * k.o0 + DZ * k.s0];
        const B = [A0[0] + PX * k.o1 + DX * k.s1, STOL_Y + k.y, A0[1] + PZ * k.o1 + DZ * k.s1];
        const tg = norm3([B[0] - A[0], 0, B[2] - A[2]]), e1 = norm3(kriz([0, 1, 0], tg)), e2 = kriz(tg, e1);   // e1 lijevo-straga, e2 gore

        // tijelo: niti uzduž štapića (u), presjek po kutu (v; smjer takav da je normala prema van)
        N.plahta(S, function (u, v) {
          const a = TAU * (1 - v), r = oblik(k, a, u), ca = r * Math.cos(a), sa = r * Math.sin(a);
          return [lerp(A[0], B[0], u) + e1[0] * ca + e2[0] * sa, A[1] + e1[1] * ca + e2[1] * sa, lerp(A[2], B[2], u) + e1[2] * ca + e2[2] * sa];
        }, {
          boja: function (T, u, v) {
            const a = TAU * (1 - v);
            oblik(k, a, u);
            const d = O.d;
            // kora: grebeni svjetliji, brazde tamnije, sitne uzdužne pruge
            let col = mijesaj(C.cimet, C.cimetSvjetlo, 0.22 + 0.3 * O.g1 + 0.12 * O.g2);
            // pjege: svjetlije ljuskice i tamne točkice
            const p = pjega(T.x, T.y, T.z, 55);
            if (p > 0.8) col = mijesaj(col, C.cimetSvjetlo, (p - 0.8) * 4);
            else if (p < 0.2) col = mijesaj(col, C.cimetTamno, (0.2 - p) * 3);
            // rijetke tanke poprečne pukotine
            const c = sum(u * 14 + 13 * k.i, a * 0.4, 7 * k.i), g3 = sum(u * 3 + k.i, a * 0.5, 9 * k.i);
            const puk = korakG(0.1, 0.03, Math.abs(c)) * korakG(0.1, 0.35, g3);
            // šav: rub kore svjetliji (hvata svjetlo), usjek taman, ispod ruba kora u sjeni ili svjetlija unutrašnjost
            const rub = korakG(-0.2, -0.08, d) * (1 - korakG(-0.05, 0, d));
            const usjek = Math.exp(-(d - 0.02) * (d - 0.02) / 0.0025);
            col = mijesaj(col, C.cimetSvjetlo, 0.45 * rub);
            col = mijesaj(col, mijesaj(C.cimetTamno, UNUTRA, k.unutra), O.rec * (1 - usjek) * 0.7);
            col = mijesaj(col, C.cimetTamno, Math.max(0.9 * usjek, 0.7 * puk));
            return tvar(T, col, 0.85 - 0.3 * O.rec, 0.35, 1, V.OBICNO, 0.18 + 0.06 * u);
          }
        });

        // krajevi: presjek smotane kore. Traka kore debljine W ide od ruba na šavu
        // oko cijelog oboda (ispod ruba je za debljinu niže), pa još zavoj i pol
        // prema sredini; nekoliko niti preko debljine trake
        const S1 = TAU - 0.16, S_KRAJ = S1 + TAU * 1.3, nT = Math.max(2, Math.round(W / (S.korak * 0.55)));
        const sredina = function (a, s, t) {          // polumjer sredine trake kore na kutu spirale s
          const r = oblik(k, a, t);
          return s < S1 ? r - W * 0.5 : R0 * 0.8 * ovalno(k, a) - W * 0.5 - (s - S1) / TAU * (W + RAZMAK_KORE);
        };
        for (let kraj = 0; kraj < 2; kraj++) {
          const P = kraj ? B : A, sm = kraj ? 1 : -1, tk = kraj ? 1 : 0;
          let duljina = 0;
          for (let m = 0; m < 48; m++) { const s = (m + 0.5) / 48 * S_KRAJ; duljina += sredina(k.f0 - 0.1 - s, s, tk) * S_KRAJ / 48; }
          for (let j = 0; j < nT; j++) {
            const q = (j + 0.5) / nT;                     // 0 vanjska .. 1 unutarnja strana trake
            S.nit(function (u, T) {
              const s = u * S_KRAJ, a = k.f0 - 0.1 - s;
              const rho = sredina(a, s, tk) + (0.5 - q) * W * 0.85, ca = Math.cos(a), sa = Math.sin(a);
              T.x = P[0] + (e1[0] * ca + e2[0] * sa) * rho; T.y = P[1] + (e1[1] * ca + e2[1] * sa) * rho; T.z = P[2] + (e1[2] * ca + e2[2] * sa) * rho;
              T.nx = sm * tg[0]; T.ny = 0; T.nz = sm * tg[2];
              const dub = 0.55 + 0.45 * rho / R0;         // prema sredini smotka tamnije (manje svjetla)
              let col = mijesaj(UNUTRA, C.cimet, 0.2 + 0.6 * Math.abs(q - 0.5) * 2);   // rubovi trake tamniji, sredina svjetlija
              col = puta(col, dub * (0.85 + 0.3 * pjega(T.x, T.y, T.z, 70)));
              return tvar(T, col, 0.6, 0.45, 0.8, V.OBICNO, 0.2 + 0.06 * tk);
            }, duljina, 1, false);
          }
        }
        if (i < 2) N.zaklonKapsula(A[0], A[2], B[0], B[2], R0 * 1.1, 0.16);
        yield;
      }
    }
  });
})();
