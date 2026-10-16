// Štapići cimeta (kasija): tri smotane kore od sprijeda lijevo prema straga
// (iza lijevog ugla bloka): dva leže na stolu, treći na njima. Presjek je
// spirala smotane kore: od ruba kore (usne) polumjer se oko štapića smanjuje
// za debljinu kore, pa se ispod usne vrati pod nju; na šavu je stuba (zid
// usjeka s vlastitim tamnim nitima) i usna koja se malo odiže i hvata
// svjetlo. Tijelo je plahta s nitima uzduž štapića (vlakna kore), gušćim na
// strani okrenutoj kameri: presjek spljošten, uzdužni nabori i pruge,
// uzdužne pukotine, svjetlije prašnjave i tamnije crvenkaste mrlje, pjege,
// rijetke poprečne pukotine. Na krajevima je prerez smotka: traka kore u
// spirali (oko 2,5 zavoja) s tamnom vanjskom kožicom i svjetlijim
// unutarnjim tkivom, prema sredini tamnije.
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const lerp = N.lerp, korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, pjega = N.pjega, sum = N.sum, norm3 = N.norm3, kriz = N.kriz, tvar = N.tvar, zasiti = N.zasiti;

  const TAU = 2 * Math.PI;
  const R0 = 0.056, W = 0.012, RAZMAK_KORE = 0.0025;    // polumjer štapića, debljina kore, zračnost između zavoja u smotku
  const KORAK_S = (W + RAZMAK_KORE) / R0;                // za koliko (udio R0) se polumjer spirale smanji po zavoju
  const UNUTRA = mijesaj(C.cimetSvjetlo, [0.93, 0.74, 0.5], 0.4);     // unutarnje tkivo kore (prerez): svjetlije, žućkasto
  const RUB = mijesaj(C.cimetSvjetlo, [1, 0.86, 0.62], 0.35);          // osvijetljeni rub kore
  const TAN = mijesaj(C.cimetSvjetlo, [0.82, 0.68, 0.5], 0.45);        // svjetlije prašnjave mrlje
  const CRVENO = [0.5, 0.22, 0.1];                                       // tamnije crvenkaste mrlje
  const A0 = [-1.37, 0.25], B0 = [-0.44, -1.58];
  const DX = B0[0] - A0[0], DZ = B0[1] - A0[1], L0 = Math.hypot(DX, DZ), PX = -DZ / L0, PZ = DX / L0;
  const KUT_KAMERE = 2.5;     // kut presjeka (rad) okrenut kameri: niti su ondje gušće (0 = lijevo-straga, π/2 = gore, π = prema nama)
  // o0/o1: pomak okomito na smjer na početku/kraju (blago se razilaze), s0/s1: udio
  // duljine, f0: kut usne (ruba kore); usjek je odmah prema kameri od nje, fi: okret
  // spljoštenog presjeka, unutra: koliko je smotak labav (ispod usne proviruje
  // svjetlija kora), ton: boja štapića prema ostalima
  const STAPICI = [
    { i: 0, o0: 0.064, o1: 0.072, s0: 0.0, s1: 1.0, f0: 1.3, fi: 0.1, unutra: 0.15, ton: [1.05, 0.97, 0.92] },     // prednji, na stolu
    { i: 1, o0: -0.066, o1: -0.07, s0: 0.03, s1: 1.0, f0: 0.85, fi: -0.1, unutra: 0.6, ton: [0.92, 0.9, 0.9] },     // stražnji, na stolu
    { i: 2, o0: 0.01, o1: -0.02, s0: 0.16, s1: 1.02, f0: 1.45, fi: 0.0, unutra: 0.3, ton: [1.06, 1.03, 1.0] }      // gornji, leži u žlijebu između njih
  ];

  const O = { th: 0, g1: 0, g2: 0, lip: 0, lift: 0, dip: 0 };    // nusproizvodi oblika za boju (bez alokacija)
  function ovalno(k, a) { return 1 + 0.1 * Math.cos(2 * (a - k.fi)) - 0.03 * Math.cos(4 * (a - k.fi)); }   // spljošten, malo uglat presjek
  // polumjer presjeka štapića k pod kutom a (rad) na udjelu u duljine; usput ispuni O.
  // th je kut spirale od usne (0 = usna, prema TAU ispod usne): polumjer linearno pada
  function oblik(k, a, u) {
    const th = ((k.f0 - a) % TAU + TAU) % TAU;
    const g1 = sum(a * 1.6 + 11 * k.i, u * 3.5 + 3 * k.i, 5 * k.i);        // široki uzdužni nabori (grebeni i brazde)
    const g2 = sum(a * 5 + 7 * k.i, u * 12 + k.i, 2 * k.i + 1);            // sitnije uzdužne pruge
    const wob = sum(u * 2.5 + 4 * k.i, 0.3, 9 * k.i);                      // štapić nije posve jednak po duljini
    const lip = korakG(0.5, 0.0, th);                                      // usna: rub kore se odiže
    const lift = (0.06 + 0.03 * sum(u * 3 + 2 * k.i, 1, 13 * k.i)) * lip;
    const dip = korakG(0.75, 0.08, TAU - th);                              // usjek: kora ispod usne je udubljena
    O.th = th; O.g1 = g1; O.g2 = g2; O.lip = lip; O.lift = lift; O.dip = dip;
    return R0 * ovalno(k, a) * (1 + KORAK_S * (0.5 - th / TAU) + 0.03 * wob + 0.025 * g1 + 0.01 * g2 + lift - 0.1 * dip);
  }
  // kut presjeka za udio v plahte: niti gušće na strani okrenutoj kameri (a pada s v, da je normala prema van)
  function kutV(v) { const w = TAU * (1 - v); return w - 0.4 * Math.sin(w - KUT_KAMERE); }

  N.predmet('cimet', {
    red: 40,
    gradi: function* (S) {
      // visine osi: donji štapići na stolu (najniža točka presjeka), gornji na njima
      const ys = [];
      for (let i = 0; i < STAPICI.length; i++) {
        const k = STAPICI[i];
        if (i < 2) {
          let dno = 0;
          for (let m = 0; m < 48; m++) { const a = Math.PI + (m + 0.5) / 48 * Math.PI, y = oblik(k, a, 0.5) * Math.sin(a); if (y < dno) dno = y; }
          ys.push(STOL_Y - dno + 0.001);
        } else {
          let y = STOL_Y + R0;
          for (let j = 0; j < 2; j++) {
            const d = (k.o0 + k.o1) * 0.5 - (STAPICI[j].o0 + STAPICI[j].o1) * 0.5, rr = 2 * R0 * 0.96;
            y = Math.max(y, ys[j] + Math.sqrt(Math.max(0, rr * rr - d * d)));
          }
          ys.push(y + 0.001);
        }
      }

      for (let i = 0; i < STAPICI.length; i++) {
        const k = STAPICI[i], y = ys[i];
        const A = [A0[0] + PX * k.o0 + DX * k.s0, y, A0[1] + PZ * k.o0 + DZ * k.s0];
        const B = [A0[0] + PX * k.o1 + DX * k.s1, y, A0[1] + PZ * k.o1 + DZ * k.s1];
        const L = Math.hypot(B[0] - A[0], B[2] - A[2]);
        const tg = norm3([B[0] - A[0], 0, B[2] - A[2]]), e1 = norm3(kriz([0, 1, 0], tg)), e2 = kriz(tg, e1);   // e1 lijevo-straga, e2 gore
        const odg = 0.18 + 0.05 * i;

        // tijelo: niti uzduž štapića (u), presjek po kutu (v)
        N.plahta(S, function (u, v) {
          const a = kutV(v), r = oblik(k, a, u), ca = r * Math.cos(a), sa = r * Math.sin(a);
          return [lerp(A[0], B[0], u) + e1[0] * ca + e2[0] * sa, A[1] + e1[1] * ca + e2[1] * sa, lerp(A[2], B[2], u) + e1[2] * ca + e2[2] * sa];
        }, {
          razmak: 0.8,
          boja: function (T, u, v) {
            const a = kutV(v);
            oblik(k, a, u);
            const th = O.th;
            // kora: grebeni svjetliji, brazde tamnije, sitne uzdužne pruge; svaki štapić svoj ton
            let col = mijesaj(C.cimet, C.cimetSvjetlo, 0.45 + 0.25 * O.g1 + 0.12 * O.g2);
            col[0] *= k.ton[0]; col[1] *= k.ton[1]; col[2] *= k.ton[2];
            // veće mrlje: svjetlije prašnjave i tamnije crvenkaste
            const m = sum(u * 2.2 + 17 * k.i, a * 0.7, 3 * k.i + 0.5);
            if (m > 0.2) col = mijesaj(col, TAN, 0.5 * korakG(0.2, 0.7, m));
            else if (m < -0.2) col = mijesaj(col, CRVENO, 0.45 * korakG(-0.2, -0.7, m));
            // uzdužne pukotine (vlakna kore) i rijetke tanke poprečne pukotine
            const f = sum(a * 8 + 11 * k.i, u * 4 + 3 * k.i, 5 * k.i);
            const fis = korakG(0.07, 0.015, Math.abs(f)) * korakG(-0.45, 0.2, sum(a * 1.5, u * 1.3 + 7 * k.i, 2 * k.i));
            const c = sum(u * 16 + 13 * k.i, a * 0.3, 7 * k.i);
            const puk = korakG(0.05, 0.015, Math.abs(c)) * korakG(0.35, 0.6, sum(u * 3 + k.i, a * 0.5, 9 * k.i));
            // pjege: svjetlije ljuskice i tamne točkice
            const p = pjega(T.x, T.y, T.z, 60);
            if (p > 0.84) col = mijesaj(col, TAN, (p - 0.84) * 2.5);
            else if (p < 0.18) col = mijesaj(col, C.cimetTamno, (0.18 - p) * 3);
            col = mijesaj(col, C.cimetTamno, Math.max(0.75 * fis, 0.6 * puk));
            // šav: usna hvata svjetlo; ispod nje usjek u sjeni (labaviji smotak pokaže svjetliju koru)
            const rub = korakG(0.3, 0.03, th);
            const dno = korakG(TAU - 0.85, TAU - 0.3, th);
            const prov = k.unutra * korakG(TAU - 1.2, TAU - 0.9, th) * (1 - korakG(TAU - 0.7, TAU - 0.45, th));
            col = mijesaj(col, RUB, 0.6 * rub);
            col = mijesaj(col, UNUTRA, prov);
            col = mijesaj(col, C.cimetTamno, 0.9 * dno);
            col = zasiti(col, 1.12);
            return tvar(T, col, 0.92 - 0.4 * dno, 0.3, 1.1 - 0.3 * dno, V.OBICNO, odg + 0.05 * u);
          }
        });

        // zid usjeka na šavu: stuba između usne i kore ispod nje, par tamnih niti
        // uzduž štapića (okrenute prema kameri, u sjeni usne)
        const rLo = oblik(k, k.f0 + 0.002, 0.5), rHi = oblik(k, k.f0 - 0.002, 0.5);
        const nW = Math.max(2, Math.round((rHi - rLo) / (S.korak * 0.6)));
        const aw = k.f0 + 0.012, cw = Math.cos(aw), sw = Math.sin(aw);
        for (let j = 0; j < nW; j++) {
          const q = (j + 0.5) / nW;
          S.nit(function (u, T) {
            const r = lerp(oblik(k, k.f0 + 0.002, u), oblik(k, k.f0 - 0.002, u), q);
            T.x = lerp(A[0], B[0], u) + (e1[0] * cw + e2[0] * sw) * r; T.y = A[1] + (e1[1] * cw + e2[1] * sw) * r; T.z = lerp(A[2], B[2], u) + (e1[2] * cw + e2[2] * sw) * r;
            T.nx = -e1[0] * sw + e2[0] * cw; T.ny = -e1[1] * sw + e2[1] * cw; T.nz = -e1[2] * sw + e2[2] * cw;
            const col = mijesaj(C.cimetTamno, mijesaj(C.cimet, UNUTRA, k.unutra * 0.5), 0.15 + 0.5 * q * q);
            return tvar(T, col, 0.6, 0.3, 1, V.OBICNO, odg + 0.05 * u);
          }, L, 1, false);
        }

        // krajevi: prerez smotane kore. Traka kore debljine W ide od usne u spirali
        // (vanjski zavoj prati tijelo, svaki sljedeći je za debljinu i zračnost
        // bliže sredini) dok se ne zatvori; nekoliko niti preko debljine trake
        const nT = Math.max(2, Math.round(W / (S.korak * 0.45)));
        const spirala = function (s, t) {                // polumjer vanjske strane trake na kutu spirale s
          const a = k.f0 - s, r = oblik(k, a, t), z = Math.floor(s / TAU);
          return r - (z > 0 ? R0 * ovalno(k, a) * O.lift : 0) - (W + RAZMAK_KORE) * z;
        };
        for (let kraj = 0; kraj < 2; kraj++) {
          const P = kraj ? B : A, sm = kraj ? 1 : -1, tk = kraj ? 1 : 0;
          let S_KRAJ = 0, duljina = 0;
          for (let m = 0; m < 1300; m++) {
            const s = (m + 0.5) * 0.02, r = spirala(s, tk) - W * 0.5;
            if (r < W * 0.55) break;
            S_KRAJ = (m + 1) * 0.02; duljina += r * 0.02;
          }
          for (let j = 0; j < nT; j++) {
            const q = (j + 0.5) / nT;                     // 0 vanjska (kožica) .. 1 unutarnja strana trake
            S.nit(function (u, T) {
              const s = u * S_KRAJ, a = k.f0 - s;
              const rho = spirala(s, tk) - q * W * 0.9 - W * 0.05, ca = Math.cos(a), sa = Math.sin(a);
              T.x = P[0] + (e1[0] * ca + e2[0] * sa) * rho; T.y = P[1] + (e1[1] * ca + e2[1] * sa) * rho; T.z = P[2] + (e1[2] * ca + e2[2] * sa) * rho;
              T.nx = sm * tg[0]; T.ny = 0; T.nz = sm * tg[2];
              const dub = 0.5 + 0.5 * rho / R0;           // prema sredini smotka tamnije (manje svjetla)
              // tamna vanjska kožica, svjetlije unutarnje tkivo, uz unutarnji rub opet malo tamnije
              let col = mijesaj(C.cimetTamno, UNUTRA, korakG(0.1, 0.45, q) * (1 - 0.3 * korakG(0.75, 1, q)));
              col[0] *= k.ton[0]; col[1] *= k.ton[1]; col[2] *= k.ton[2];
              col = puta(col, dub * (0.82 + 0.36 * pjega(T.x * 1.3, T.y, T.z, 80)));
              return tvar(T, col, 0.55, 0.4, 0.85, V.OBICNO, odg + 0.05 * tk);
            }, duljina, 1, false);
          }
        }
        if (i < 2) N.zaklonKapsula(A[0], A[2], B[0], B[2], R0 * 1.1, 0.16);
        yield;
      }
    }
  });
})();
