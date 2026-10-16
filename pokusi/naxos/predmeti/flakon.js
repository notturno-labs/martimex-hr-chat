// Flakon Xerjoff 1861 Naxos na jantarnom bloku: geometrija je iz pocetna-chata.js
// (NAXOS.flakon, ne mijenja se), boje i tvar točkica s fotografije (izvor.webp):
// satinirano bjelokosno staklo, pri ramenima svjetlije i hladnije; ispod razine
// (y ≈ 0, malo ispod najšireg dijela) medeno-zlatna tekućina koja se nazire kroz
// staklo, s mekim prijelazom i jednom malo svjetlijom niti na razini; na strani
// sunca (lijevo) zasićenija i sa svijetlim rubom, desno blijeda; dno od debelog
// blijedog stakla. Da staklo izgleda puno, ispod razine su između niti stakla
// dodane niti tekućine (0,4 koraka iznutra). Čep i prsten od ružičastog zlata s
// prugama mekog odsjaja po visini, pločica bakrena s urezanim zlatnim X u
// bjelokosnom okviru; ispod pločice nagovještaj grba, trobojnice i natpisa.
// Nastaje zadnji, odozdo
(function () {
  'use strict';
  const N = window.NAXOS, T = N.T, V = N.vrste;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, sat = N.sat, tvar = N.tvar, sum = N.sum, lerp = N.lerp, hash3 = N.hash3;

  const DNO = N.DNO_BOCICE, VIS = N.VRH_BOCICE - N.DNO_BOCICE, K = VIS / 695;   // piksel fotografije bočice → jedinica (kao u motoru)
  const PT = DNO + 311 * K, PB = DNO + 158 * K;                                 // pločica (kao u motoru): trapez, pola širine 41 .. 51 px
  function polaPlocice(y) { return lerp(41, 51, (y - PB) / (PT - PB)) * K; }
  const RAZINA = 0.0;                                                            // razina tekućine

  // boje s fotografije (0..1)
  const RAME = [0.97, 0.955, 0.91], KREM = [0.95, 0.90, 0.78], DNO_STAKLA = [0.92, 0.87, 0.78];
  const MED_L = [0.78, 0.55, 0.26], MED_D = [0.95, 0.86, 0.66], MED_UNUTRA = [0.84, 0.56, 0.20], MED_UNUTRA_D = [0.90, 0.72, 0.42];
  const SUNCE = [1, 0.93, 0.78], NIT_RAZINE = [0.98, 0.92, 0.76];
  const BAKAR = [0.94, 0.67, 0.50], BAKAR_TAMNI = [0.72, 0.47, 0.34], BAKAR_SVIJETLI = [1.0, 0.84, 0.68];
  const ZLATNI_ODSJAJ = [1.0, 0.78, 0.46], RUZICASTO = [0.99, 0.83, 0.72], VRH_CEPA = [0.97, 0.76, 0.62];
  const PLOCICA_GORE = [0.92, 0.66, 0.48], PLOCICA_DOLJE = [0.78, 0.48, 0.28], OKVIR = [0.96, 0.92, 0.84], OKVIR_TAMNI = [0.42, 0.25, 0.16], ZNAK = [0.94, 0.82, 0.58];
  const GRB = [0.66, 0.50, 0.26], ZELENA = [0.26, 0.52, 0.30], CRVENA = [0.74, 0.26, 0.20], NATPIS = [0.56, 0.44, 0.30];

  function gauss(x, w) { const t = x / w; return Math.exp(-t * t); }

  // staklo (0) i bridovi faseta (4); yRazina je visina niti stakla najbliže razini
  function staklo(x, y, z, nx, ny, nz, brid, yRazina, odgoda) {
    const s = 0.5 + 0.5 * nx;                                                           // 0 lijevo (sunce iza) .. 1 desno
    const tek = korakG(RAZINA + 0.07, RAZINA - 0.05, y) * korakG(-0.86, -0.70, y);     // tekućina: meki prijelaz na razini, pri dnu deblje staklo
    let col = mijesaj(KREM, RAME, korakG(0.0, 0.3, y));                                 // prema ramenima svjetlije i hladnije
    col = mijesaj(col, DNO_STAKLA, korakG(-0.62, -0.80, y));
    col = mijesaj(col, mijesaj(MED_L, MED_D, s), 0.9 * tek);
    let jak = 1.1, k = 1 + 0.07 * sum(x * 30, y * 30 + 7, z * 30);                     // satinirano: meko mramoriranje
    const rub = sat((-nx - 0.5) / 0.5);                                                 // sunčev svijetli rub lijevo
    const g = 0.06 * gauss(y - RAZINA, 0.035) + 0.28 * rub;
    col = [col[0] * k + g * SUNCE[0], col[1] * k + g * SUNCE[1], col[2] * k + g * SUNCE[2]];
    jak += 0.3 * rub;
    if (Math.abs(y - yRazina) < 1e-4) { col = mijesaj(col, NIT_RAZINE, 0.35); jak *= 1.08; }   // malo svjetlija nit na razini
    if (brid) { col = puta(col, 1.08); jak *= 1.05; }                                   // bridovi faseta: blago svjetlije crte
    jak *= 1 - 0.3 * korakG(0.3, 0.9, ny);                                              // ramena gledana s ruba su gušća
    // ispod pločice: grb s krunom i lovorom, trobojnica s "1861", natpis NAXOS (samo nagovještaj)
    if (nz > 0.6 && y < PB - 0.02 && y > PB - 0.26 && x > -0.1 && x < 0.1) {
      const dy = PB - y, gx = Math.abs(x);
      const grb = gx < 0.03 && dy > 0.04 && dy < 0.13 ? 1 : (gx < 0.075 && dy > 0.06 && dy < 0.125 ? 0.5 : 0);
      if (grb) { col = mijesaj(col, GRB, 0.7 * grb); jak *= 1 - 0.15 * grb; }
      else if (dy > 0.153 && dy < 0.177 && gx < 0.09) col = mijesaj(col, gx > 0.035 ? (x < 0 ? ZELENA : CRVENA) : NATPIS, gx > 0.035 ? 0.75 : 0.3);
      else if (dy > 0.21 && dy < 0.24 && gx < 0.07) { col = mijesaj(col, NATPIS, 0.65); jak *= 0.85; }
    }
    return tvar(T, col, 0.4 - 0.15 * sat(nx), 0.5, jak, V.STAKLO_F, odgoda);
  }

  // nit tekućine iznutra (između niti stakla): medena, na strani sunca zasićenija
  function tekucina(x, y, z, nx, naRazini, odgoda) {
    const s = 0.5 + 0.5 * nx, k = 1 + 0.08 * sum(x * 25 + 3, y * 25, z * 25);
    if (naRazini) return tvar(T, puta(NIT_RAZINE, k), 0.3, 0.5, 0.85, V.STAKLO_F, odgoda);
    return tvar(T, puta(mijesaj(MED_UNUTRA, MED_UNUTRA_D, s), k), 0.3, 0.5, 0.75 * korakG(-0.84, -0.72, y), V.STAKLO_F, odgoda);
  }

  // čep i prsten (1): ružičasto zlato s prugama odsjaja po visini, brušeno
  function zlato(x, y, z, odgoda) {
    const h = (y - DNO) / K, a = Math.atan2(x, z);                                      // visina u px fotografije bočice; kut oko osi (0 sprijeda, lijevo < 0)
    let col;
    if (h < 471) col = puta(BAKAR, 0.85);                                               // donji rub prstena
    else if (h < 501) {                                                                 // prsten: svijetla pruga po sredini (urezani natpis), rubovi tamniji
      const t = (h - 471) / 30, sj = gauss(t - 0.55, 0.26);
      col = mijesaj(mijesaj(BAKAR, BAKAR_TAMNI, 0.35), BAKAR_SVIJETLI, 0.8 * sj);
      if (t < 0.1 || t > 0.9) col = puta(col, 0.75);
      else if (sj > 0.5 && hash3(Math.round(a * 60), Math.round(t * 20), 3) > 0.7) col = puta(col, 0.8);
    } else if (h < 511) col = puta(BAKAR_TAMNI, 0.8);                                   // sjena ispod čepa
    else if (h < 599) {                                                                 // čep: zlatni odsjaj dolje, tamna pruga, gore ružičasto svjetlije
      const t = (h - 511) / 88;
      col = mijesaj(BAKAR, ZLATNI_ODSJAJ, 0.8 * gauss(t - 0.12, 0.2));
      col = mijesaj(col, BAKAR_TAMNI, 0.65 * gauss(t - 0.45, 0.17));
      col = mijesaj(col, RUZICASTO, 0.55 * korakG(0.55, 0.95, t));
      if (t > 0.95) col = puta(col, 1.2);                                               // rub prema vrhu
    } else col = mijesaj(VRH_CEPA, RUZICASTO, 0.5 * (h - 599) / 96);                    // šiljak
    // odsjaji oko oboda: lijevo-sprijeda svjetlije (sunce), desno od sredine tamna pruga; brušena površina
    const k = 1 + 0.2 * Math.cos(a + 0.6) - 0.25 * gauss(a - 0.5, 0.3) + 0.06 * sum(a * 6, y * 250, 1);
    return tvar(T, puta(col, k), 0.9, 0.3, 1.3, V.ZLATO_F, odgoda);
  }

  // pločica (2): bakrena, gore svjetlija, odsjaj lijevo od sredine
  function plocica(x, y, odgoda) {
    const t = sat((y - PB) / (PT - PB)), hw = polaPlocice(y);
    const k = 1 + 0.18 * Math.cos(x / hw * 1.6 + 0.5) + 0.06 * sum(x * 60, y * 60, 2);
    return tvar(T, puta(mijesaj(PLOCICA_DOLJE, PLOCICA_GORE, t), k), 0.5, 0.3, 1.1, V.ZLATO_F, odgoda);
  }

  // okvir i znak X (3, guste linije): vanjski okvir bjelokosni, unutarnja crta tamna, X blijedo zlatan
  function znak(x, y, odgoda) {
    const hw = polaPlocice(y), rub = Math.min(hw - Math.abs(x), y - PB, PT - y);
    if (rub < 0.008) return tvar(T, OKVIR, 0.4, 0.3, 0.35, V.ZLATO_F, odgoda);
    if (Math.abs(rub - 0.017) < 0.0022) return tvar(T, OKVIR_TAMNI, 0.4, 0.3, 0.3, V.ZLATO_F, odgoda);
    return tvar(T, puta(ZNAK, 1 + 0.1 * sum(x * 80, y * 80, 5)), 0.6, 0.3, 0.8, V.ZLATO_F, odgoda);
  }

  N.predmet('flakon', {
    red: 20,
    gradi: function* (S) {
      const nF = Math.round(3.377 * N.OMJER / (S.korak * S.korak));   // flakon ima 3,38 jedinice² ploha (tako mu generator mjeri razmak niti)
      const gen = N.flakon(Math.max(2000, nF));
      let r = gen.next();
      while (!r.done) { r = gen.next(); yield; }
      const f = r.value, k = f.korak, n = f.poz.length / 3, poz = f.poz, nor = f.nor, vrsta = f.vrsta;
      // nit stakla najbliža razini: iznad nje nema niti tekućine, a ona i nit iznutra uz nju su malo svjetlije
      let yRazina = -9;
      for (let i = 0; i < n; i++) {
        const m = vrsta[i], y = poz[3 * i + 1];
        if ((m === 0 || m === 4) && Math.abs(y - RAZINA) < Math.abs(yRazina - RAZINA)) yRazina = y;
      }
      for (let i = 0; i < n; i++) {
        if (i % 4000 === 3999) yield;
        const x = poz[3 * i], y = poz[3 * i + 1], z = poz[3 * i + 2], m = vrsta[i];
        const nx = nor[3 * i], ny = nor[3 * i + 1], nz = nor[3 * i + 2];
        const odgoda = 0.55 + 0.3 * sat((y - DNO) / VIS);
        if (!S.broji) {
          T.x = x; T.y = y; T.z = z; T.nx = nx; T.ny = ny; T.nz = nz;
          if (m === 0 || m === 4) staklo(x, y, z, nx, ny, nz, m === 4, yRazina, odgoda);
          else if (m === 1) zlato(x, y, z, odgoda);
          else if (m === 2) plocica(x, y, odgoda);
          else znak(x, y, odgoda);
          S.dodaj(T);
        } else S.n++;
        // tekućina iznutra: ispod razine, između niti stakla (pola koraka više, 0,4 koraka unutra), samo prednje
        if ((m === 0 || m === 4) && y <= yRazina + 1e-4 && y > -0.8 && nz > -0.3) {
          if (!S.broji) {
            const d = 0.4 * k;
            T.x = x - nx * d; T.y = y + k * (0.53 + 0.17 * sat(nz)); T.z = z - nz * d;
            T.nx = nx; T.ny = ny; T.nz = nz;
            tekucina(x, y, z, nx, Math.abs(y - yRazina) < 1e-4, odgoda);
            S.dodaj(T);
          } else S.n++;
        }
      }
      S.korakFlakona = k;
      N.zaklonKrug(0, 0, 0.36, 1.76);
    }
  });
})();
