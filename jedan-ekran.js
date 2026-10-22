(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — chat s Marti na JEDNOM ekranu (izgled "Jedan ekran", v2)
  //
  //  Nema više početnog ekrana ispred chata: kad se chat otvori, razgovor
  //  je odmah tu, a vrh prozora je mala tamna "pozornica" s Martimexovim
  //  monogramom M (ili, po izboru u POSTAVKAMA, s flakonom).
  //
  //  Novo u v2 (listopad 2026):
  //   - na pozornici je umjesto Xerjoffova flakona Martimexov monogram: slovo
  //     M iz natpisa MARTIMEX (Cormorant Garamond), s debljinom, satkano od
  //     istih zlatnih niti; ne favorizira nijedan brend. Nastane iz izmaglice
  //     kao flakon, a zatim se polako njiše lijevo-desno (uvijek čitljivo), s
  //     odsjajem svjetla; flakon je i dalje tu (postavka oblik: 'flakon')
  //   - drugo i svako sljedeće otvaranje chata u istoj kartici: monogram je
  //     odmah složen (bez čekanja na nastanak), samo se meko pojavi
  //   - ponuđeni odgovori ispod uvodne poruke slažu se po važnosti iz
  //     POSTAVKI (brzaPitanja), a prvi je istaknut kao glavni (ispunjena
  //     tamna pilula); redoslijed i tekstovi gumba inače ostaju Voiceflowovi
  //   - podebljani prvi red uvodne poruke ("Bok! Ja sam Marti...") ispisuje
  //     se kao naslov u Cormorantu, kao natpis MARTIMEX
  //   - stanje se usklađuje i dok je kartica u pozadini
  //
  //   - gore je tamna traka s natpisom MARTIMEX (Cormorant Garamond,
  //     razmaknuta velika slova, boja pudera) i Voiceflowovim gumbima za
  //     novi razgovor i zatvaranje (samo tanke ikone, bez kruga)
  //   - ispod nje, u istoj toploj crnoj boji, je pozornica: Martimexov
  //     monogram M (slovo iz natpisa MARTIMEX, s debljinom) satkan od
  //     tisuća zlatnih svjetlećih točkica u tankim nitima, s mekom aurom
  //     iza sebe. Pri prvom otvaranju chata točkice se iz izmaglice spuste
  //     i slegnu u slovo (odozdo prema gore); slovo se zatim polako njiše
  //     lijevo-desno, a svakih nekoliko sekundi preko njega ukoso prijeđe
  //     svjetlo. Po izboru (postavka oblik: 'flakon') je tu umjesto
  //     monograma dosadašnji Xerjoff flakon (fasetirano staklo s medenom
  //     tekućinom, zlatni prsten, čep sa šiljkom i pločica sa znakom X;
  //     oblik i boje prepisani iz pocetna-chata.js), koji se okreće.
  //     Ispod oblika piše "Marti · AI asistentica"
  //   - razgovor je na toploj bjelokosti, bez mramora i bez teksture:
  //     Martine poruke su bijele kartice s jedva vidljivom sjenom, kupčeve
  //     su tamne (tinta), ponuđeni odgovori su pilule s tankim tamnim
  //     obrubom koje se pod mišem (ili prstom) ispune tamnom bojom
  //   - polje za poruku je bijela kapsula s tankim toplim rubom; gumb za
  //     slanje je taman krug tek kad ima što poslati
  //   - čim kupac pošalje prvu poruku ili pritisne ponuđeni odgovor,
  //     točkice se rasprše kao izmaglica parfema, pozornica se glatko
  //     sklopi, a natpis "Marti · AI asistentica" sjedne u traku ispod
  //     natpisa MARTIMEX; razgovor tada dobije cijeli prozor. Na niskom
  //     prozoru (mobitel) pozornica se sklopi već kad kupac dotakne polje
  //     za poruku, da tipkovnica ne prekrije razgovor
  //   - novi razgovor (gumb gore) vrati pozornicu i flakon
  //   - ako razgovor već postoji (npr. kupac je s preporuke otišao na
  //     stranicu proizvoda), chat se otvori odmah sklopljen
  //   - razgovor kreće sam kad se chat otvori (nema gumba "Početak"), ali
  //     tek tada: samo učitavanje stranice ne pokreće razgovor u Voiceflowu
  //   - Voiceflowovi engleski tekstovi ("Start new chat", "Cancel",
  //     "Chat has ended") su na hrvatskom
  //
  //  "Smanji pokrete" (postavka uređaja): oblik stoji, bez pojave i
  //  odsjaja; pozornica se sklopi bez animacije. Bez WebGL-a je umjesto
  //  točkica obično slovo M fontom natpisa (ili tanki obris flakona).
  //
  //  Tehnički: kao i ostali moduli, ovaj ubaci svoj stil u shadow DOM
  //  elementa #voiceflow-chat i oslanja se na Voiceflowove službene klase
  //  (.vfrc-chat, .vfrc-header, .vfrc-message, .vfrc-user-response,
  //  .vfrc-footer, .vfrc-input-container...). U prozor umeće samo jedan
  //  element: pozornicu, odmah ispod Voiceflowova zaglavlja (ako je
  //  Voiceflow iscrta iznova, vrati se na mjesto). Voiceflowu se isključi
  //  "autostart", pa se razgovor pokrene tek otvaranjem chata (modul tada
  //  pritisne Voiceflowov skriveni gumb za početak, kao nekad "Početak").
  //  Ako modul zakaže, chat radi kao Voiceflowov.
  //  Ne ide uz pocetna-chata.js ni tema-chata.js (oni su drugi izgled).
  //  Gdje radi: testna stranica proba.html (vrh repozitorija) učita ovaj
  //  modul umjesto početnog ekrana; martimex.hr ga ne učitava dok se u
  //  loader.js ne uključi umjesto pocetna-chata.js (vidi loader.js).
  //  Probe: pokusi/jedan-ekran/proba.html i, bez Voiceflowa,
  //  pokusi/jedan-ekran/mock.html.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxJedanEkran) return;   // zaštita ako se modul učita dvaput
  window.__mxJedanEkran = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_JEDAN_POSTAVKE = {
    boje: {                     // uvijek u obliku #rrggbb
      tama:      '#0e0c0b',     // topla crna: traka gore i pozornica s flakonom
      bjelokost: '#f7f3ef',     // pozadina razgovora
      papir:     '#fffdfb',     // Martine poruke, polje za poruku, ploče
      tinta:     '#1c1715',     // tekst; kupčeve poruke; obrub i ispuna ponuđenih odgovora
      tih:       '#7a6d66',     // prigušeni tekst (napomene, "Vaša poruka...")
      linija:    '#e8ddd6',     // tanki topli rubovi na svijetlom
      puder:     '#f3e5de',     // natpis MARTIMEX, tekst na tamnom; odsjaj na znaku X
      roza:      '#e2c3ba',     // naglasak (Martimexova prašnjava roza): crte, fokus, "Marti · AI asistentica", aura iza flakona
      auraJezgra: '#fff0e4',    // topla bijela jezgra aure iza flakona
      // flakon (iste boje kao na dosadašnjem početnom ekranu)
      srebro:    '#e8e6eb',     // točkice stakla
      zlato:     '#e0bb72'      // zlatni čep, prsten i pločica flakona, medena tekućina u njemu
    },

    // Fontovi iz mape fonts/ (učitavaju ih i ostali moduli)
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',
    fontNatpisa: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    natpis: 'Martimex',                       // u traci gore; piše se velikim slovima
    oznaka: 'Marti · AI asistentica',         // ispod monograma, a kad se pozornica sklopi, ispod natpisa

    // Što je na pozornici: 'monogram' (Martimexovo M od zlatnih niti) ili 'flakon' (Xerjoff flakon kao dosad)
    oblik: 'monogram',
    monogram: {
      slovo: 'M',               // jedno slovo (ili dva) iz fonta natpisa
      tezina: 500,              // debljina slova u fontu (Cormorant: 500–700)
      visina: 0.72,             // visina slova kao udio visine koju bi imao flakon (slovo je široko, pa je niže)
      dubina: 0.16,             // debljina slova (udio njegove visine)
      njihanje: 0.36,           // rad: koliko se najviše okrene lijevo/desno (0 = miruje ravno)
      period: 11,               // s: jedan zamah lijevo-desno-lijevo
      tocaka: 14000             // točkica (rjeđe od flakona, da se vide niti)
    },
    brzoDrugiPut: true,         // 2. i svako sljedeće otvaranje u istoj kartici: oblik odmah složen, bez nastanka

    // Ponuđeni odgovori ispod Martine uvodne poruke: ovim redom (ostali iza), a
    // prvi se istakne kao glavni (ispunjena tamna pilula). Tekst mora biti isti
    // kao tekst gumba u Voiceflowu; gumbi kojih tu nema ostaju kako Voiceflow
    // pošalje. [] = ništa se ne mijenja
    brzaPitanja: [
      'Vaš beauty savjetnik',
      'Provjeri status narudžbe',
      'Loyalty Card',
      'Prijavi reklamaciju',
      'Načini plaćanja'
    ],
    // podebljani prvi red Martine uvodne poruke ispisuje se kao naslov (Cormorant); false = kao dosad
    naslovUvoda: true,

    // Voiceflowovi engleski tekstovi ('' = ostaje Voiceflowov tekst)
    tekstovi: {
      noviRazgovor: 'Započni novi razgovor',  // "Start new chat"
      odustani: 'Odustani',                   // "Cancel"
      razgovorZavrsen: 'Razgovor je završen'  // "Chat has ended"
    },

    // Pozornica s flakonom: visina kao udio visine prozora chata, unutar granica (px)
    pozornica: { udio: 0.27, min: 150, max: 224 },
    // Na mobitelu i tabletu, i na prozoru nižem od ovoga (px), pozornica se
    // sklopi čim kupac dotakne polje za poruku, da tipkovnica ne prekrije
    // razgovor (0 = svugdje tek kad pošalje prvu poruku)
    sklopiNaFokus: 700,

    flakon: {
      pojava: 2.4,            // s: točkice se iz izmaglice slegnu u flakon
      brzina: 0.3,            // rad/s: okretanje (0.3 = jedan krug za oko 21 s)
      odsjaj: 7,              // s: svakih toliko preko stakla prijeđe svjetlo (0 = bez)
      tocaka: 20000,          // računalo
      tocakaMobitel: 20000,   // mobitel i tablet: isto kao računalo (uz manje točkica čep ima rupe, a
                              // flakon je na mobitelu čak malo veći, jer je pozornica viša)
      velicina: 0.7,          // visina flakona kao udio visine pozornice
      nagibPremaMisu: true    // na računalu se flakon lagano nagne prema mišu
    },

    // Koliko dugo Voiceflow pamti razgovor (kao u pocetna-chata.js):
    // 'sessionStorage' → dok je kartica preglednika otvorena; 'localStorage' →
    // trajno; 'memory' → do sljedećeg učitavanja stranice; '' → kako je u Voiceflowu
    pamcenje: 'sessionStorage'
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX_JEDAN = (function () {
    'use strict';

    // stranica može neke postavke promijeniti objektom window.MartimexJedanEkran
    // (prije učitavanja modula), npr. { oblik: 'flakon' } na testnoj stranici
    const P = Object.assign({}, MX_JEDAN_POSTAVKE, window.MartimexJedanEkran || {});
    const B = P.boje;
    const T = P.tekstovi || {};
    const F = P.flakon || {};
    const HOST = 'voiceflow-chat';          // element u čiji shadow DOM Voiceflow crta chat
    const START = '#vfrc-start-chat';       // Voiceflowov gumb "Start new chat"
    const OZNAKA = 'data-mx-j';             // atribut na #voiceflow-chat: "sklopljeno", "pokrecem"
    // adresa mape ove skripte (vrh repozitorija); fontovi su u njezinoj mapi fonts/
    const MAPA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/jedan-ekran.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
    const KORIJEN = MAPA;
    const MIRNO = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const MOBITEL = !!(window.matchMedia && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches);
    const MIS = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    const PAMCENJE = ['sessionStorage', 'localStorage', 'memory'].indexOf(P.pamcenje) !== -1 ? P.pamcenje : '';

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + (+(+a).toFixed(3)) + ')'; }
    function boja01(hex) { return rgb(hex).map(function (v) { return v / 255; }); }
    function tekst(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\A ') + '"'; }
    function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function glatko(x) { x = sat(x); return x * x * (3 - 2 * x); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function broj(v, zadano, min, max) { v = +v; return isFinite(v) ? Math.min(max, Math.max(min, v)) : zadano; }


    // ═══════════════════════════════════════════════════════════════════
    //  FLAKON — Xerjoff 1861 (Naxos) od točkica u vodoravnim nitima
    //
    //  Isti flakon kao na dosadašnjem početnom ekranu: oblik, mjere i
    //  gradnja su prepisani iz pocetna-chata.js (funkcija flakon i ono što
    //  ona koristi), samo bez koraka (yield), jer se gradi jednom. Točkice se
    //  slažu u linije (prstenove oko flakona i vodoravne niti preko vrha
    //  čepa), a po linijama su gušće nego što su linije razmaknute: zato
    //  flakon izgleda kao da je satkan od tankih niti. Mjere su u "svjetskim
    //  jedinicama" kao u pocetna-chata.js (dno -0,86, vrh čepa 0,90); za
    //  crtanje se flakon pomakne za SREDINA, pa mu je sredina u ishodištu.
    // ═══════════════════════════════════════════════════════════════════
    const OMJER = 2.3;             // koliko su točkice na liniji gušće nego razmak linija
    const DNO_BOCICE = -0.86, VRH_BOCICE = 0.90;
    const VISINA = VRH_BOCICE - DNO_BOCICE;              // 1,76
    const SREDINA = (DNO_BOCICE + VRH_BOCICE) / 2;       // 0,02

    // Flakon po uzoru na Xerjoff 1861 (Naxos): fasetirano tijelo, jednako
    // široko sprijeda i sa strane (presjek je osmerokut: četiri široke plohe
    // i između njih četiri kose fasete), koje se od zaobljenih ramena blago
    // sužava prema dnu; zlatni prsten na grlu i zlatni čep kojemu se vrh
    // straga uzdiže u šiljak. Na prednjoj plohi zlatna pločica u obliku
    // trapeza (gore šira) s dvostrukim okvirom i znakom X. Mjere su izmjerene
    // s fotografije bočice (u pikselima; bočica je na njoj visoka 695 px).
    const FLAKON_K = VISINA / 695;   // piksel fotografije → svjetska jedinica
    // [visina od dna, pola širine, izraženost faseta]
    const FLAKON = [
      [0, 0, 1], [0, 66, 1], [4, 84, 1], [9, 93, 1], [15, 96, 1], [23, 99.5, 1],     // dno sa zaobljenim rubom
      [39, 106, 1], [71, 116.5, 1], [103, 125, 1], [135, 132.5, 1], [167, 138.5, 1], // tijelo se prema dnu sužava
      [199, 144, 1], [231, 148, 1], [263, 152, 1], [295, 154.5, 1], [327, 156, 1],
      [351, 155.5, 1], [367, 151.5, 1], [383, 145.5, 1], [399, 136.5, 1],             // zaobljena ramena
      [415, 124, 1], [431, 108, .95], [447, 86.5, .85], [455, 71.5, .75], [461, 58, .6],
      [461, 58, 0], [471, 58, 0], [471, 62.5, 0], [501, 62.5, 0],                     // zlatni prsten
      [501, 53, 0], [511, 52.5, 0], [527, 56.5, 0], [543, 59.5, 0], [559, 61.5, 0],   // čep se prema gore
      [575, 63, 0], [583, 64, 0], [599, 64, 0]                                        // lagano širi do ruba
    ];
    const FLAKON_ZLATO = 461, FLAKON_RUB = 599, FLAKON_VRH = 695;
    const PLOHA = 0.48;           // široke plohe zauzimaju 48 % širine, između njih su kose fasete
    // pločica (trapez) i znak X na njoj: [visina od dna, pola širine] s fotografije
    const PLOCICA_VRH = [311, 51], PLOCICA_DNO = [158, 41], ZNAK_VRH = 273, ZNAK_DNO = 199, ZNAK_POLA = 25;
    const RED_PLOCICE = 0.0045;   // razmak linija na pločici (gušće od tijela, da se vidi znak)
    // vrsta točke: staklo, zlato (prsten i čep), pločica, znak X i okvir, brid između faseta
    const STAKLO = 0, ZLATO = 1, PLOCICA = 2, SLOVO = 3, BRID = 4;
    // Znak X (Xerjoff): debeli potez sa šiljastim serifom gore lijevo i
    // repom koji se dolje desno produžuje i savija; tanki potez prekinut na
    // križanju, s vodoravnim serifima. Koordinate u okviru 495 × 709.
    const ZNAK_X = [
      [32, 117, 170, 0, 154, 27, 150, 57, 154, 87, 167, 122, 187, 152, 212, 187, 242, 232, 277, 282, 312, 332,
        342, 377, 372, 427, 402, 482, 427, 537, 440, 587, 440, 627, 427, 667, 407, 697, 384, 709, 402, 677,
        412, 637, 410, 597, 397, 557, 372, 507, 342, 457, 312, 407, 282, 362, 252, 317, 217, 267, 182, 217,
        152, 172, 127, 137, 107, 109, 97, 100, 82, 97, 57, 105],
      [317, 34, 495, 34, 495, 39, 462, 43, 437, 59, 412, 87, 377, 134, 337, 189, 304, 234, 289, 252, 270, 222,
        287, 197, 312, 162, 342, 119, 357, 94, 360, 72, 352, 52, 332, 40, 317, 39],
      [207, 312, 225, 345, 192, 387, 157, 437, 139, 472, 137, 499, 147, 517, 162, 527, 177, 529, 177, 535,
        0, 535, 0, 529, 32, 525, 67, 509, 97, 479, 132, 419, 172, 359]
    ];

    // ponovljiv "slučajni" niz (isti flakon pri svakom učitavanju)
    function slucajno(sjeme) {
      let a = sjeme >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    // n točaka jednoliko po ukupnoj duljini svih linija; za svaku točku
    // vraća redni broj linije i udio duljine te linije (0..1)
    function poLinijama(duljine, n) {
      let ukupno = 0;
      for (let i = 0; i < duljine.length; i++) ukupno += duljine[i];
      const korak = ukupno / n;
      const linija = new Int32Array(n), udio = new Float32Array(n);
      let l = 0, pocetak = 0;
      for (let i = 0; i < n; i++) {
        const s = (i + 0.5) * korak;
        while (l < duljine.length - 1 && s >= pocetak + duljine[l]) { pocetak += duljine[l]; l++; }
        linija[i] = l;
        udio[i] = duljine[l] > 0 ? sat((s - pocetak) / duljine[l]) : 0;
      }
      return { linija: linija, udio: udio };
    }

    // Presjek tijela: fasetirani osmerokut (meki minimum udaljenosti do
    // ravnina daje blago zaobljene bridove), stopljen s krugom prema
    // izraženosti faseta. Računa se za pola širine 1 i pamti, jer većina
    // prstenova ima iste proporcije i razlikuje se samo veličinom.
    let PRESJECI = {};
    function jedinicniPresjek(f) {
      const c = Math.SQRT1_2, cd = (1 + PLOHA) * c;
      const R = [1, 0, 1, -1, 0, 1, 0, 1, 1, 0, -1, 1, c, c, cd, -c, c, cd, c, -c, cd, -c, -c, cd];
      const M = 192, mek = 0.012, t = new Float64Array(8);
      const x = new Float32Array(M), z = new Float32Array(M);
      for (let j = 0; j < M; j++) {
        const th = j / M * 2 * Math.PI, ux = Math.cos(th), uz = Math.sin(th);
        let min = Infinity, zbroj = 0, k = 0;
        for (let q = 0; q < 24; q += 3) {
          const d = ux * R[q] + uz * R[q + 1];
          if (d > 1e-6) { const v = R[q + 2] / d; t[k++] = v; if (v < min) min = v; }
        }
        for (let q = 0; q < k; q++) zbroj += Math.exp(-(t[q] - min) / mek);
        const rp = min - mek * Math.log(zbroj);
        const r = 1 + (rp - 1) * f;
        x[j] = ux * r; z[j] = uz * r;
      }
      const vx = new Float32Array(M), vz = new Float32Array(M), tab = new Float32Array(M + 1), brid = new Uint8Array(M);
      for (let j = 0; j < M; j++) {
        const a = (j + M - 1) % M, b = (j + 1) % M;
        let ex = z[b] - z[a], ez = x[a] - x[b];
        const l = Math.hypot(ex, ez) || 1;
        ex /= l; ez /= l;
        if (ex * x[j] + ez * z[j] < 0) { ex = -ex; ez = -ez; }
        vx[j] = ex; vz[j] = ez;
        tab[j + 1] = tab[j] + Math.hypot(x[b] - x[j], z[b] - z[j]);
      }
      if (f > 0.5) {
        // brid između faseta: ondje gdje se smjer plohe najjače mijenja
        const promjena = new Float32Array(M);
        for (let j = 0; j < M; j++) {
          const a = (j + M - 1) % M, b = (j + 1) % M;
          promjena[j] = Math.hypot(vx[b] - vx[a], vz[b] - vz[a]);
        }
        for (let j = 0; j < M; j++) {
          if (promjena[j] > 0.15 && promjena[j] >= promjena[(j + M - 1) % M] && promjena[j] >= promjena[(j + 1) % M]) brid[j] = 1;
        }
      }
      return { x: x, z: z, vx: vx, vz: vz, tab: tab, obod: tab[M], brid: brid };
    }
    function presjekFlakona(W, f) {
      const kljuc = f.toFixed(3);
      const J = PRESJECI[kljuc] || (PRESJECI[kljuc] = jedinicniPresjek(f));
      return { J: J, W: W, obod: J.obod * W };
    }
    function naPresjeku(P, s) {
      const J = P.J, M = J.x.length;
      s /= P.W;
      let lo = 0, hi = M;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (J.tab[m] <= s) lo = m; else hi = m; }
      const dl = J.tab[lo + 1] - J.tab[lo], u = dl > 0 ? sat((s - J.tab[lo]) / dl) : 0, b = (lo + 1) % M;
      return { x: lerp(J.x[lo], J.x[b], u) * P.W, z: lerp(J.z[lo], J.z[b], u) * P.W, vx: lerp(J.vx[lo], J.vx[b], u), vz: lerp(J.vz[lo], J.vz[b], u), brid: J.brid[lo] };
    }

    // Vodoravni presjek tijela zadanog vrijednostima v na mreži (N + 1) × (N + 1)
    // preko kvadrata [-X, X]² (< 0 unutra): dužine po rubu (marching
    // squares), redom [x1, z1, x2, z2, ...]
    const RUBOVI = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]],
      8: [[2, 3]], 9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[1, 2]], 12: [[3, 1]], 13: [[0, 1]], 14: [[3, 0]] };
    function presjekPlohe(v, X, N) {
      const h = 2 * X / N, out = [];
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const a = v[i * (N + 1) + j], b = v[(i + 1) * (N + 1) + j], c = v[(i + 1) * (N + 1) + j + 1], d = v[i * (N + 1) + j + 1];
          const idx = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
          if (idx === 0 || idx === 15) continue;
          const x0 = -X + i * h, z0 = -X + j * h;
          const tocka = function (e) {
            let px, pz, qx, qz, vp, vq;
            if (e === 0) { px = x0; pz = z0; qx = x0 + h; qz = z0; vp = a; vq = b; }
            else if (e === 1) { px = x0 + h; pz = z0; qx = x0 + h; qz = z0 + h; vp = b; vq = c; }
            else if (e === 2) { px = x0; pz = z0 + h; qx = x0 + h; qz = z0 + h; vp = d; vq = c; }
            else { px = x0; pz = z0; qx = x0; qz = z0 + h; vp = a; vq = d; }
            const t = vp / (vp - vq);
            return [px + (qx - px) * t, pz + (qz - pz) * t];
          };
          RUBOVI[idx].forEach(function (par) {
            const A = tocka(par[0]), Bt = tocka(par[1]);
            out.push(A[0], A[1], Bt[0], Bt[1]);
          });
        }
      }
      return out;
    }

    // Znak X kao maska: nacrta se u malo skriveno platno, pa se za svaku
    // točku pločice pogleda je li u znaku (u, v od 0 do 1)
    function maskaZnaka() {
      const W = 99, H = 142;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      if (!ctx) return function () { return false; };
      ctx.scale(W / 495, H / 709);
      ctx.fillStyle = ctx.strokeStyle = '#fff';
      ctx.lineWidth = 8;                     // tanki potezi i serifi malo deblji, da ih linije uhvate
      ctx.lineJoin = 'round';
      ZNAK_X.forEach(function (o) {
        ctx.beginPath();
        for (let i = 0; i < o.length; i += 2) { if (i) ctx.lineTo(o[i], o[i + 1]); else ctx.moveTo(o[i], o[i + 1]); }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      const d = ctx.getImageData(0, 0, W, H).data;
      return function (u, v) {
        const i = Math.floor(u * W), j = Math.floor(v * H);
        return i >= 0 && j >= 0 && i < W && j < H && d[(j * W + i) * 4 + 3] > 96;
      };
    }

    // n točkica flakona: položaj (sredina flakona u ishodištu), smjer plohe,
    // vrsta i četiri slučajna broja; spremnik za grafičku karticu
    const VELICINA_TOCKE = 11;
    function gradiFlakon(n) {
      const K = FLAKON_K;
      const tocke = FLAKON.map(function (p) { return { h: p[0], y: DNO_BOCICE + p[0] * K, W: p[1] * K, f: p[2] }; });
      const seg = [];
      let ukupno = 0;
      for (let i = 0; i < tocke.length - 1; i++) {
        const p = tocke[i], q = tocke[i + 1];
        const dm = q.W - p.W, dy = q.y - p.y;
        const d = Math.hypot(dm, dy);
        if (d < 1e-6) continue;
        // profil ide odozdo prema gore: normala prema van je (dy, -dm)
        seg.push({ p: p, q: q, d: d, od: ukupno, nr: dy / d, ny: -dm / d });
        ukupno += d;
      }
      function sirinaNa(y) {                       // pola širine tijela na visini y
        for (let i = 0; i < tocke.length - 1; i++) {
          const p = tocke[i], q = tocke[i + 1];
          if (y >= p.y && y <= q.y && q.y > p.y) return lerp(p.W, q.W, (y - p.y) / (q.y - p.y));
        }
        return 0;
      }
      // vrh čepa: valjak odrezan plohom koja je sprijeda na rubu čepa, a
      // straga se uzdiže; po širini se sužava gotovo ravnim bokovima u šiljak
      const R0 = FLAKON[FLAKON.length - 1][1] * K, h0 = DNO_BOCICE + FLAKON_RUB * K, H = (FLAKON_VRH - FLAKON_RUB) * K;
      function vrhCepa(x, z) {
        const straga = sat((1 - z / R0) / 2), sredina = sat(1 - Math.pow(Math.min(1, Math.abs(x) / R0), 1.5));
        return h0 + H * Math.pow(straga, 1.5) * sredina;
      }
      function cep(x, y, z) { return Math.max(Math.hypot(x, z) - R0, y - vrhCepa(x, z)); }

      // mreža preko vrha čepa: udaljenost od stijenke i visina reza (ne ovise o visini presjeka)
      const MX = 64, MR = R0 * 1.08, mh = 2 * MR / MX;
      const doStijenke = new Float32Array((MX + 1) * (MX + 1)), rez = new Float32Array((MX + 1) * (MX + 1)), v = new Float32Array((MX + 1) * (MX + 1));
      for (let i = 0; i <= MX; i++) {
        for (let j = 0; j <= MX; j++) {
          const x = -MR + i * mh, z = -MR + j * mh;
          doStijenke[i * (MX + 1) + j] = Math.hypot(x, z) - R0;
          rez[i * (MX + 1) + j] = vrhCepa(x, z);
        }
      }

      // pločica: trapez (gore širi) na prednjoj plohi, znak X u sredini
      const PT = DNO_BOCICE + PLOCICA_VRH[0] * K, PB = DNO_BOCICE + PLOCICA_DNO[0] * K;
      const XT = DNO_BOCICE + ZNAK_VRH * K, XB = DNO_BOCICE + ZNAK_DNO * K, XW = ZNAK_POLA * K;
      function polaPlocice(y) { return lerp(PLOCICA_DNO[1], PLOCICA_VRH[1], (y - PB) / (PT - PB)) * K; }
      const uZnaku = maskaZnaka();
      function naZnaku(x, y) {                      // okvir (vanjski i unutarnji) ili znak X
        const hw = polaPlocice(y), rub = Math.min(hw - Math.abs(x), y - PB, PT - y);
        if (rub < 0) return false;
        if (rub < 0.008 || Math.abs(rub - 0.017) < 0.0022) return true;
        return y <= XT && y >= XB && uZnaku((x + XW) / (2 * XW), (XT - y) / (XT - XB));
      }

      function linije(korak, grubo) {
        const L = [];
        const k = Math.max(8, Math.round(ukupno / korak)), kk = ukupno / k;
        for (let i = 0; i < k; i++) {
          const s = (i + 0.5) * kk;
          let j = 0;
          while (j < seg.length - 1 && s > seg[j].od + seg[j].d) j++;
          const g = seg[j], t = sat((s - g.od) / g.d);
          const P = presjekFlakona(lerp(g.p.W, g.q.W, t), lerp(g.p.f, g.q.f, t));
          L.push({ prsten: P, y: lerp(g.p.y, g.q.y, t), nr: g.nr, ny: g.ny, zlato: lerp(g.p.h, g.q.h, t) >= FLAKON_ZLATO, duljina: P.obod, tezina: P.obod });
        }
        if (grubo) return L;
        for (let y = h0 + korak * 0.3; y < h0 + H; y += korak * 0.6) {      // vrh čepa malo gušće
          for (let q = 0; q < v.length; q++) v[q] = Math.max(doStijenke[q], y - rez[q]);
          const d = presjekPlohe(v, MR, MX);
          for (let q = 0; q < d.length; q += 4) {
            const len = Math.hypot(d[q + 2] - d[q], d[q + 3] - d[q + 1]);
            if (len > 1e-7) L.push({ a: [d[q], d[q + 1]], b: [d[q + 2], d[q + 3]], y: y, duljina: len, tezina: len });
          }
        }
        // okvir i znak X: vlastite guste linije preko pločice
        const dx = 0.0008;
        for (let y = PB + RED_PLOCICE / 2; y < PT; y += RED_PLOCICE) {
          const hw = polaPlocice(y), zf = sirinaNa(y) + 0.0075;
          let od = null;
          for (let x = -hw; x <= hw + dx; x += dx) {
            const u = x <= hw && naZnaku(x, y);
            if (u && od === null) od = x;
            else if (!u && od !== null) {
              const len = x - od;
              if (len > 1e-6) L.push({ znak: true, a: [od, zf], b: [x, zf], y: y, duljina: len, tezina: len * 3 });
              od = null;
            }
          }
        }
        return L;
      }
      // razmak linija ovisi o površini: prvo gruba procjena s rijetkim linijama
      let korak = 0.05;
      let L = linije(korak, true);
      const povrsina = L.reduce(function (z, l) { return z + l.duljina; }, 0) * korak;
      korak = Math.sqrt(povrsina * OMJER / n);
      L = linije(korak);

      // točke se dijele po težini linija (linije znaka su 3 puta gušće)
      const r = poLinijama(L.map(function (l) { return l.tezina; }), n);
      const rnd = slucajno(20251);
      const podaci = new Float32Array(n * VELICINA_TOCKE);
      for (let i = 0; i < n; i++) {
        const l = L[r.linija[i]];
        let x, y = l.y, z, nx, ny, nz, m;
        if (l.prsten) {
          const q = naPresjeku(l.prsten, ((r.udio[i] + r.linija[i] * 0.618034) % 1) * l.prsten.obod);
          x = q.x; z = q.z;
          nx = q.vx * l.nr; ny = l.ny; nz = q.vz * l.nr;
          m = l.zlato ? ZLATO : (q.brid ? BRID : STAKLO);
        } else if (l.znak) {
          x = lerp(l.a[0], l.b[0], r.udio[i]); z = l.a[1];
          nx = 0; ny = 0; nz = 1;
          m = SLOVO;
        } else {
          x = lerp(l.a[0], l.b[0], r.udio[i]); z = lerp(l.a[1], l.b[1], r.udio[i]);
          const e = 0.002;
          nx = cep(x + e, y, z) - cep(x - e, y, z); ny = cep(x, y + e, z) - cep(x, y - e, z); nz = cep(x, y, z + e) - cep(x, y, z - e);
          m = ZLATO;
          const u = (y - h0) / H;
          if (u > 0.5) z += R0 * 0.4 * (u - 0.5) * (u - 0.5) / 0.25;   // šiljak se pri vrhu izvija naprijed
        }
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        // točke stakla na mjestu pločice postaju zlatna pločica (malo strši)
        if ((m === STAKLO || m === BRID) && z > 0 && nz > 0.35 && y >= PB && y <= PT && Math.abs(x) <= polaPlocice(y)) {
          m = PLOCICA;
          x += nx * 0.006; y += ny * 0.006; z += nz * 0.006;
        }
        const o = i * VELICINA_TOCKE;
        podaci[o] = x;
        podaci[o + 1] = y - SREDINA;
        podaci[o + 2] = z;
        podaci[o + 3] = nx;
        podaci[o + 4] = ny;
        podaci[o + 5] = nz;
        podaci[o + 6] = m;
        podaci[o + 7] = rnd(); podaci[o + 8] = rnd(); podaci[o + 9] = rnd(); podaci[o + 10] = rnd();
      }
      PRESJECI = {};                               // zapamćeni presjeci više ne trebaju
      return podaci;
    }

    // Obris istog flakona sprijeda (SVG), kad nema WebGL-a: tijelo, prsten,
    // čep sa šiljkom i pločica sa znakom X; mjere s fotografije (px)
    function obrisFlakona() {
      const y = function (h) { return (FLAKON_VRH + 8 - h).toFixed(1); };
      const tijelo = FLAKON.filter(function (p) { return p[0] <= FLAKON_ZLATO && p[1] > 0; });
      const lijevo = tijelo.map(function (p) { return (-p[1]).toFixed(1) + ',' + y(p[0]); });
      const desno = tijelo.slice().reverse().map(function (p) { return p[1].toFixed(1) + ',' + y(p[0]); });
      // čep: od prstena do ruba, pa šiljak (sprijeda gledan: 1 - |x|^1.5)
      const cepL = [], cepD = [];
      FLAKON.filter(function (p) { return p[0] >= 501; }).forEach(function (p) {
        cepL.push((-p[1]).toFixed(1) + ',' + y(p[0])); cepD.unshift(p[1].toFixed(1) + ',' + y(p[0]));
      });
      const R0 = 64, siljak = [];
      for (let i = 0; i <= 24; i++) {
        const x = -R0 + i / 24 * 2 * R0;
        siljak.push(x.toFixed(1) + ',' + y(FLAKON_RUB + (FLAKON_VRH - FLAKON_RUB) * Math.max(0, 1 - Math.pow(Math.abs(x) / R0, 1.5))));
      }
      const znak = ZNAK_X.map(function (o) {
        let d = '';
        for (let i = 0; i < o.length; i += 2) {
          d += (i ? 'L' : 'M') + (-ZNAK_POLA + o[i] / 495 * 2 * ZNAK_POLA).toFixed(1) + ',' + y(ZNAK_VRH - o[i + 1] / 709 * (ZNAK_VRH - ZNAK_DNO));
        }
        return '<path d="' + d + 'Z" fill="currentColor" fill-opacity=".55" stroke="none"/>';
      }).join('');
      const pl = PLOCICA_DNO, pv = PLOCICA_VRH;
      return '<svg viewBox="-180 0 360 712" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round">' +
        '<path d="M' + lijevo.join(' L') + ' L' + desno.join(' L') + ' Z"/>' +
        '<rect x="-62.5" y="' + y(501) + '" width="125" height="30"/>' +
        '<path d="M' + cepL.join(' L') + ' L' + siljak.join(' L') + ' L' + cepD.join(' L') + ' Z"/>' +
        '<path d="M' + (-pl[1]) + ',' + y(pl[0]) + ' L' + (-pv[1]) + ',' + y(pv[0]) + ' L' + pv[1] + ',' + y(pv[0]) + ' L' + pl[1] + ',' + y(pl[0]) + ' Z"/>' +
        znak +
        '</svg>';
    }


    // ═══════════════════════════════════════════════════════════════════
    //  MONOGRAM — Martimexovo slovo M od točkica u nitima
    //
    //  Slovo se nacrta fontom natpisa (Cormorant Garamond) u skriveno platno,
    //  pa se iz njegove prozirnosti složi slovo s debljinom: prednja i
    //  stražnja ploha su vodoravne niti kroz slovo (kao niti kroz pločicu
    //  flakona), a bokovi su kratke niti po dubini na rubu slova (gdje niti
    //  izlaze iz slova), i to na svim rubovima: kosim, okomitim i vodoravnim
    //  (vodoravne rubove serifa nađu okomiti prolazi kroz slovo). Sve je
    //  zlato, kao čep i prsten flakona, pa svjetlo i odsjaj rade isto.
    //  Mjere su u svjetskim jedinicama kao flakon (visok VISINA); slovo je
    //  visoko zadani udio toga i stoji u sredini.
    // ═══════════════════════════════════════════════════════════════════
    function fontNatpisa(px) { return (+MONO.tezina || 500) + ' ' + px + 'px ' + P.fontNatpisa; }
    function cekajFontNatpisa() {
      if (!document.fonts || !document.fonts.load) return Promise.resolve();
      return Promise.race([
        document.fonts.load(fontNatpisa(200), String(MONO.slovo || 'M')).catch(function () {}),
        new Promise(function (r) { setTimeout(r, 2500); })
      ]);
    }
    function gradiMonogram(n) {
      const slovo = String(MONO.slovo || 'M').trim().slice(0, 2) || 'M';
      const FPX = 256, PAD = 12;
      const c = document.createElement('canvas');
      let ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.font = fontNatpisa(FPX);
      const m = ctx.measureText(slovo);
      const lijevo = m.actualBoundingBoxLeft || 0, desno = m.actualBoundingBoxRight || m.width;
      const gore = m.actualBoundingBoxAscent || FPX * 0.66, dolje = m.actualBoundingBoxDescent || 0;
      if (!(lijevo + desno > 4) || !(gore + dolje > 4)) return null;
      const w = Math.ceil(lijevo + desno) + 2 * PAD, h = Math.ceil(gore + dolje) + 2 * PAD;
      c.width = w; c.height = h;
      ctx = c.getContext('2d');
      ctx.font = fontNatpisa(FPX);
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(slovo, PAD + lijevo, PAD + gore);
      const px = ctx.getImageData(0, 0, w, h).data;
      const A = new Uint8Array(w * h);
      let ispunjeno = 0;
      for (let i = 0; i < w * h; i++) { A[i] = px[4 * i + 3]; if (A[i] >= 128) ispunjeno++; }
      if (ispunjeno < 50) return null;
      const u = function (i, j) { return i >= 0 && j >= 0 && i < w && j < h && A[j * w + i] >= 128; };
      // smjer van iz slova na rubu (iz nagiba prozirnosti), u svjetskim smjerovima (y gore)
      const alfa = function (i, j) { return i < 0 || j < 0 || i >= w || j >= h ? 0 : A[j * w + i]; };
      function van(i, j) {
        const gx = alfa(i + 1, j) - alfa(i - 1, j) + 0.5 * (alfa(i + 1, j - 1) - alfa(i - 1, j - 1) + alfa(i + 1, j + 1) - alfa(i - 1, j + 1));
        const gy = alfa(i, j + 1) - alfa(i, j - 1) + 0.5 * (alfa(i - 1, j + 1) - alfa(i - 1, j - 1) + alfa(i + 1, j + 1) - alfa(i + 1, j - 1));
        const l = Math.hypot(gx, gy);
        return l > 1e-6 ? [-gx / l, gy / l] : [0, 0];
      }

      const VIS = VISINA * broj(MONO.visina, 0.72, 0.3, 1);     // visina slova (svjetske jedinice)
      const K = VIS / (gore + dolje);                             // piksel platna → svjetska jedinica
      const DUB = VIS * broj(MONO.dubina, 0.16, 0.02, 0.6);       // debljina slova
      const cx = PAD + (lijevo + desno) / 2, cy = PAD + (gore + dolje) / 2;
      const X = function (i) { return (i - cx) * K; }, Y = function (j) { return (cy - j) * K; };

      // razmak niti iz površine (dvije plohe i bokovi) i broja točkica
      const sirinaSlova = (lijevo + desno) * K;
      let rub = 0;
      for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) if (u(i, j) && (!u(i + 1, j) || !u(i - 1, j) || !u(i, j + 1) || !u(i, j - 1))) rub++;
      const povrsina = 2 * ispunjeno * K * K + rub * K * DUB;
      const korak = Math.max(0.004, Math.sqrt(povrsina * OMJER / n));
      const korakPx = Math.max(1, korak / K);

      const L = [];                       // niti: a, b (x, y, z), smjer plohe n, težina
      function nit(a, b, nx, ny, nz, tezina) {
        const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        if (d > 1e-6 && tezina > 1e-6) L.push({ a: a, b: b, n: [nx, ny, nz], duljina: d, tezina: tezina });
      }
      // vodoravni prolazi: niti prednje i stražnje plohe, a na krajevima niti bokovi
      for (let jj = PAD * 0.5; jj < h; jj += korakPx) {
        const j = Math.round(jj), y = Y(jj);
        let od = -1;
        for (let i = 0; i <= w; i++) {
          const unutra = i < w && u(i, j);
          if (unutra && od < 0) od = i;
          else if (!unutra && od >= 0) {
            const x0 = X(od - 0.5), x1 = X(i - 0.5);
            nit([x0, y, DUB / 2], [x1, y, DUB / 2], 0, 0, 1, x1 - x0);
            nit([x0, y, -DUB / 2], [x1, y, -DUB / 2], 0, 0, -1, x1 - x0);
            const vl = van(od, j), vd = van(i - 1, j);
            nit([x0, y, -DUB / 2], [x0, y, DUB / 2], vl[0], vl[1], 0, DUB * Math.abs(vl[0]));
            nit([x1, y, -DUB / 2], [x1, y, DUB / 2], vd[0], vd[1], 0, DUB * Math.abs(vd[0]));
            od = -1;
          }
        }
      }
      // okomiti prolazi: samo bokovi na vodoravnim rubovima (vrh i dno serifa, prečke)
      for (let ii = PAD * 0.5; ii < w; ii += korakPx) {
        const i = Math.round(ii), x = X(ii);
        let od = -1;
        for (let j = 0; j <= h; j++) {
          const unutra = j < h && u(i, j);
          if (unutra && od < 0) od = j;
          else if (!unutra && od >= 0) {
            const y0 = Y(od - 0.5), y1 = Y(j - 0.5);
            const vg = van(i, od), vd = van(i, j - 1);
            nit([x, y0, -DUB / 2], [x, y0, DUB / 2], vg[0], vg[1], 0, DUB * Math.abs(vg[1]));
            nit([x, y1, -DUB / 2], [x, y1, DUB / 2], vd[0], vd[1], 0, DUB * Math.abs(vd[1]));
            od = -1;
          }
        }
      }
      if (L.length < 8) return null;

      const r = poLinijama(L.map(function (l) { return l.tezina; }), n);
      const rnd = slucajno(7319);
      const podaci = new Float32Array(n * VELICINA_TOCKE);
      for (let i = 0; i < n; i++) {
        const l = L[r.linija[i]], t = r.udio[i];
        const o = i * VELICINA_TOCKE;
        podaci[o] = lerp(l.a[0], l.b[0], t);
        podaci[o + 1] = lerp(l.a[1], l.b[1], t);      // slovo je već u sredini (bez pomaka SREDINA)
        podaci[o + 2] = lerp(l.a[2], l.b[2], t);
        podaci[o + 3] = l.n[0]; podaci[o + 4] = l.n[1]; podaci[o + 5] = l.n[2];
        podaci[o + 6] = ZLATO;
        podaci[o + 7] = rnd(); podaci[o + 8] = rnd(); podaci[o + 9] = rnd(); podaci[o + 10] = rnd();
      }
      void sirinaSlova;
      return podaci;
    }
    // bez WebGL-a: isto slovo, obično, fontom natpisa
    function obrisMonograma() {
      const slovo = String(MONO.slovo || 'M').trim().slice(0, 2) || 'M';
      const font = String(P.fontNatpisa).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      return '<svg viewBox="0 0 100 100" aria-hidden="true"><text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-family="' + font + '" font-weight="' + (+MONO.tezina || 500) + '" font-size="76" fill="currentColor" fill-opacity=".85">' +
        slovo.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text></svg>';
    }


    // ═══════════════════════════════════════════════════════════════════
    //  ANIMACIJA — WebGL platno koje crta točkice oblika na pozornici
    // ═══════════════════════════════════════════════════════════════════
    const VS = `
      precision highp float;
      attribute vec3 aPoz;      // mjesto na flakonu (sredina flakona u ishodištu)
      attribute vec3 aNor;      // smjer plohe
      attribute float aVrsta;   // 0 staklo, 1 zlato (prsten, čep), 2 pločica, 3 znak X i okvir, 4 brid
      attribute vec4 aRnd;
      uniform float uVrijeme;
      uniform float uKut;       // okret oko uspravne osi
      uniform float uNagib;     // flakon malo nagnut prema nama
      uniform vec2 uMis;        // lagani nagib prema mišu
      uniform float uUvod;      // pojava (0..1)
      uniform float uIzlaz;     // raspršivanje kad se pozornica sklopi (0..1)
      uniform float uOdsjaj;    // gdje je svjetlo koje ukoso prelazi preko flakona
      uniform vec2 uPx;         // svjetska jedinica → ekran
      uniform vec2 uSredina;
      uniform float uVelicina;  // veličina točkice (px)
      uniform float uJacina;    // jačina točkica (prema njihovoj gustoći na zaslonu)
      uniform vec3 uSrebro, uZlato, uPuder;
      varying vec4 vBoja;

      const float CAM = 4.2;
      const float MJ = ${(VISINA / 0.85).toFixed(3)};   // pomaci izmaglice i svjetla prema veličini flakona

      vec2 okreni(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

      void main() {
        vec3 p = aPoz;
        vec3 n = aNor;
        float m = aVrsta;
        float t = uVrijeme;
        float y0 = aPoz.y + ${SREDINA.toFixed(3)};              // visina kao u pocetna-chata.js (-0,86 .. 0,90)
        float vis = clamp((y0 - ${DNO_BOCICE.toFixed(3)}) / ${VISINA.toFixed(3)}, 0.0, 1.0);   // 0 dno, 1 vrh čepa
        float alfa = 1.0;

        // pojava: izmaglica iznad flakona se spusti i slegne u staklo,
        // odozdo prema gore (čep zadnji)
        if (uUvod < 1.0) {
          float red = 0.64 * vis + 0.36 * aRnd.x;
          float k = clamp(uUvod * 1.6 - red * 0.6, 0.0, 1.0);
          k = 1.0 - pow(1.0 - k, 3.0);
          vec3 smjer = normalize(vec3(aRnd.z, aRnd.w, aRnd.y) - 0.5 + 0.001);
          vec3 izvor = p + (smjer * (0.2 + 0.34 * aRnd.y) + vec3(0.0, 0.3 + 0.24 * aRnd.x, 0.0)) * MJ;
          izvor.xz = okreni(izvor.xz, (1.0 - k) * 1.9);
          p = mix(izvor, p, k);
          alfa *= k * (2.0 - k);
        }

        // sklapanje: točkice se dignu i rasprše kao izmaglica parfema
        if (uIzlaz > 0.0) {
          float ke = clamp(uIzlaz * 1.45 - aRnd.x * 0.45, 0.0, 1.0);
          ke = ke * ke * (3.0 - 2.0 * ke);
          vec3 smjer = normalize(p + ((aRnd.yzw - 0.5) * 0.9 + vec3(0.0, 0.35, 0.0)) * MJ);
          p += (smjer * 0.5 + vec3(0.0, 0.5, 0.0)) * ke * MJ;
          alfa *= 1.0 - ke;
        }

        float ky = uKut + uMis.x;
        p.xz = okreni(p.xz, ky); n.xz = okreni(n.xz, ky);
        float kx = uNagib + uMis.y;
        p.yz = okreni(p.yz, kx); n.yz = okreni(n.yz, kx);

        float persp = CAM / (CAM - p.z);
        gl_Position = vec4(p.x * uPx.x * persp + uSredina.x, p.y * uPx.y * persp + uSredina.y, 0.0, 1.0);
        float iskra = step(0.993, aRnd.z);
        gl_PointSize = uVelicina * persp * (1.0 + 0.7 * iskra);

        // boje kao u pocetna-chata.js: fasetirano staklo s medenom tekućinom
        // koja se njiše (prema dnu je staklo deblje pa boja blijedi), zlatni
        // čep, prsten i pločica; pločica je polirano zlato, znak X najjači
        float zlato = step(0.5, m) * step(m, 3.5);
        float plocica = step(1.5, m) * step(m, 3.5);
        float slovo = step(2.5, m) * step(m, 3.5);
        float brid = step(3.5, m);
        float staklo = (1.0 - zlato) * step(y0, 0.3);
        float razina = 0.2 + 0.02 * sin(t * 1.3 + aPoz.x * 3.0) + 0.01 * sin(t * 2.1 - aPoz.z * 5.0);
        float tekucina = staklo * (1.0 - smoothstep(razina - 0.014, razina + 0.014, y0)) * smoothstep(-0.9, -0.45, y0);
        float dr = (y0 - razina) / 0.016;
        vec3 cs = mix(uSrebro, uZlato * 1.1, tekucina * 0.45) + uZlato * staklo * exp(-dr * dr) * 0.6;
        cs *= 1.0 + 0.5 * brid;
        vec3 cz = mix(uZlato * 1.05, mix(uZlato * 0.95, mix(uZlato, uPuder, 0.2) * 1.2, slovo), plocica);
        vec3 c = mix(cs, cz, zlato);
        // svjetlo koje ukoso prijeđe preko flakona
        float d = (p.y * 0.85 - p.x * 0.55 - uOdsjaj * MJ) / (0.09 * MJ);
        c += vec3(0.5) * exp(-d * d);
        float lit = mix(mix(0.75, 1.0, zlato), 0.35, plocica);
        float back = mix(0.45, 0.28, zlato);
        float jak = 1.0 + 0.8 * plocica - 1.0 * slovo + 1.2 * brid;   // pločica, znak X i bridovi su gušći

        // svjetlo gore lijevo: sjena, odsjaj i svijetli rub
        vec3 N = normalize(n);
        vec3 L = normalize(vec3(-0.5, 0.62, 0.6));
        vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
        float dif = max(dot(N, L), 0.0);
        float spe = pow(max(dot(N, H), 0.0), 26.0);
        float rub = pow(1.0 - abs(N.z), 2.2);
        float nebo = smoothstep(-0.08, 0.3, N.y);                   // odraz neba i tla, kao na kromu
        float svjetlo = 0.08 + 0.7 * dif + 1.5 * spe + 0.6 * rub + 0.28 * nebo;
        float lice = mix(back, 1.0, smoothstep(-0.2, 0.25, N.z));   // stražnja strana tamnija
        float dubina = mix(1.0, clamp(0.62 + 0.42 * p.z, 0.25, 1.15), lit);
        float treptaj = 0.84 + 0.16 * sin(t * (1.5 + 2.0 * aRnd.w) + aRnd.y * 40.0);
        treptaj = mix(treptaj, 1.0 + 1.1 * max(0.0, sin(t * 2.1 + aRnd.x * 50.0)), iskra);
        vBoja = vec4(c * mix(1.0, svjetlo, lit) * lice, uJacina * jak * alfa * treptaj * dubina);
      }
    `;
    const FS = `
      precision mediump float;
      varying vec4 vBoja;
      void main() {
        vec2 d = gl_PointCoord * 2.0 - 1.0;
        float r = dot(d, d);
        if (r > 1.0) discard;
        gl_FragColor = vec4(vBoja.rgb, vBoja.a * (1.0 - 0.6 * r));
      }
    `;
    const UNIFORME = ['uVrijeme', 'uKut', 'uNagib', 'uMis', 'uUvod', 'uIzlaz', 'uOdsjaj', 'uPx', 'uSredina', 'uVelicina', 'uJacina',
      'uSrebro', 'uZlato', 'uPuder'];
    const KUT0 = -0.62;                // flakon: kad se složi, prednja strana (pločica sa znakom X) okrenuta je udesno, pa se odatle okreće dalje
    const NAGIB = 0.1;                 // gledamo ga malo odozgo
    const OBLIK = P.oblik === 'flakon' ? 'flakon' : 'monogram';
    const MONO = P.monogram || {};

    // Raspored flakona na pozornici: flakon je jednako udaljen od natpisa
    // MARTIMEX iznad pozornice i od natpisa "Marti · AI asistentica" ispod
    // flakona. NATPIS_IZNAD: koliko je dno slova MARTIMEX iznad vrha
    // pozornice (traka je visoka 56 px, a slova od 17 px su u njezinoj
    // sredini); OZNAKA_ISPOD: koliko je vrh slova "Marti · AI asistentica"
    // iznad dna pozornice (natpis je 13 px od dna, slova su 10 px).
    // Vraća sredinu flakona (px od vrha pozornice) i njegovu visinu (px).
    const NATPIS_IZNAD = 22.6, OZNAKA_ISPOD = 21.5;
    const VIDNI_POMAK = 0.047;
    function rasporedFlakona(vis) {
      const sredina = (vis - OZNAKA_ISPOD - NATPIS_IZNAD) / 2;
      const visina = Math.min(vis * broj(F.velicina, 0.7, 0.3, 0.9), 2 * (sredina - 4));   // vrh flakona ne smije ispod trake
      return { sredina: sredina, visina: Math.max(20, visina) };
    }
    // jačina točkica: 0,7 uz gustoću 26 000 točkica na flakonu visokom 175 px
    // po jedinici (kao u pocetna-chata.js); uz gušće točkice slabije
    const JACINA_FLAKONA = 0.7, GUSTOCA_FLAKONA = 26000 / (175 * 175);

    function zasiti(c, k) {                      // jača zasićenost boje (0..1)
      const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      return c.map(function (v) { return sat(l + (v - l) * k); });
    }

    function napraviAnimaciju(platno, scena, dogadaji) {
      const n = Math.max(3000, Math.round(OBLIK === 'monogram' ? (+MONO.tocaka || 14000) : (+(MOBITEL ? F.tocakaMobitel : F.tocaka) || 20000)));
      const pojava = broj(F.pojava, 2.4, 0.3, 10), brzina = broj(F.brzina, 0.3, -3, 3), svakih = broj(F.odsjaj, 7, 0, 60);
      const njihanje = broj(MONO.njihanje, 0.36, 0, 1.4), period = broj(MONO.period, 11, 2, 60);
      let gl = null, program = null, spremnik = null, U = {}, spremno = false, priprema = null, unisteno = false;
      let raf = 0, vrti = false, vrijeme = 0, zadnje = 0, izlazOd = -1, izlazGotov = null, sirina = 0, visina = 0;
      let misX = 0, misY = 0, nagibX = 0, nagibY = 0;

      function pocniGL() {
        if (gl) return true;
        try {
          gl = platno.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: true, powerPreference: 'low-power' }) ||
               platno.getContext('experimental-webgl');
        } catch (e) { gl = null; }
        if (!gl) return false;
        function sjenac(vrsta, izvor) {
          const s = gl.createShader(vrsta);
          gl.shaderSource(s, izvor);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('[Martimex] Shader flakona:', gl.getShaderInfoLog(s)); return null; }
          return s;
        }
        const vs = sjenac(gl.VERTEX_SHADER, VS), fs = sjenac(gl.FRAGMENT_SHADER, FS);
        if (!vs || !fs) { gl = null; return false; }
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.warn('[Martimex] Program flakona:', gl.getProgramInfoLog(program)); gl = null; return false; }
        return true;
      }

      function dovrsiGL(podaci) {
        gl.useProgram(program);
        spremnik = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnik);
        gl.bufferData(gl.ARRAY_BUFFER, podaci, gl.STATIC_DRAW);
        const korak = VELICINA_TOCKE * 4;
        [['aPoz', 3, 0], ['aNor', 3, 3], ['aVrsta', 1, 6], ['aRnd', 4, 7]].forEach(function (a) {
          const mj = gl.getAttribLocation(program, a[0]);
          if (mj < 0) return;
          gl.enableVertexAttribArray(mj);
          gl.vertexAttribPointer(mj, a[1], gl.FLOAT, false, korak, a[2] * 4);
        });
        UNIFORME.forEach(function (u) { U[u] = gl.getUniformLocation(program, u); });
        gl.uniform3fv(U.uSrebro, boja01(B.srebro));
        gl.uniform3fv(U.uZlato, zasiti(boja01(B.zlato), 1.2));
        gl.uniform3fv(U.uPuder, boja01(B.puder));
        gl.uniform1f(U.uNagib, NAGIB);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);           // točkice se zbrajaju (svjetlo)
        gl.clearColor(0, 0, 0, 0);
        return true;
      }

      // oblik i WebGL se pripreme jednom (kad preglednik miruje ili pri otvaranju);
      // monogram se crta fontom natpisa, pa se prvo pričeka da font stigne
      function pripremi() {
        if (priprema) return priprema;
        priprema = new Promise(function (gotovo) { setTimeout(gotovo, 0); })
          .then(function () { return OBLIK === 'monogram' ? cekajFontNatpisa() : null; })
          .then(function () {
            if (unisteno) return false;
            if (!pocniGL()) { dogadaji.bezAnimacije(); return false; }
            const podaci = OBLIK === 'monogram' ? gradiMonogram(n) : gradiFlakon(n);
            if (!podaci) { dogadaji.bezAnimacije(); return false; }
            dovrsiGL(podaci);
            spremno = true;
            velicina();
            return true;
          }).catch(function (e) {
            console.warn('[Martimex] Oblik na pozornici nije pripremljen:', e);
            dogadaji.bezAnimacije();
            return false;
          });
        return priprema;
      }

      // platno je visoko kao otvorena pozornica (dok se ona sklapa, platno se
      // ne mijenja, nego ga pozornica polako prekrije)
      function velicina() {
        const vis = dogadaji.visina();
        const w = scena.clientWidth || sirina || 360;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        if (w !== sirina || vis !== visina || platno.width !== Math.round(w * dpr)) {
          sirina = w; visina = vis;
          platno.style.width = w + 'px';
          platno.style.height = vis + 'px';
          platno.width = Math.round(w * dpr);
          platno.height = Math.round(vis * dpr);
        }
        if (!gl || !spremno) return;
        gl.viewport(0, 0, platno.width, platno.height);
        // flakon (visok VISINA jedinica) zauzme zadani udio visine pozornice,
        // jednako udaljen od natpisa iznad i ispod sebe (vidi rasporedFlakona)
        const r = rasporedFlakona(vis);
        const px = r.visina / VISINA;
        gl.uniform2f(U.uPx, 2 * px / w, 2 * px / vis);
        // flakon je nagnut prema nama, pa je na zaslonu prednji rub dna niže i
        // bliže (veći): vidljivi flakon je za VIDNI_POMAK jedinica niže od
        // svoje sredine, pa se za toliko digne
        gl.uniform2f(U.uSredina, 0, 1 - 2 * (r.sredina - VIDNI_POMAK * px) / vis);
        // veličina i jačina točkica kao u pocetna-chata.js: manji flakon ima
        // gušće točkice na zaslonu, pa su one slabije (ne sasvim razmjerno)
        gl.uniform1f(U.uVelicina, 1.35 * dpr * Math.min(1.25, Math.max(0.8, Math.sqrt(px / 160))));
        const gustoca = n / (px * px) / GUSTOCA_FLAKONA;
        // monogram je tanak, pa ga "dubina" u sjenčaru (zamišljena za flakon) ne smije prigušiti: svijetli jače
        gl.uniform1f(U.uJacina, JACINA_FLAKONA * Math.min(2, Math.max(0.25, Math.pow(gustoca, -0.65))) * (OBLIK === 'monogram' ? 1.45 : 1));
        if (!vrti) nacrtaj(vrijeme);
      }

      function nacrtaj(t) {
        if (!gl || !spremno) return;
        const mirno = MIRNO.matches;
        const uvod = mirno ? 1 : sat(t / pojava);
        // flakon se okreće od samog početka (i dok nastaje), a u položaju
        // KUT0 je baš kad se složi; monogram se njiše lijevo-desno oko
        // položaja prema nama, pa je uvijek čitljiv
        const kut = OBLIK === 'monogram'
          ? (mirno ? 0 : njihanje * Math.sin(2 * Math.PI * t / period))
          : KUT0 + (mirno ? 0 : brzina * (t - pojava));
        let odsjaj = 9;
        if (!mirno && svakih > 0 && t > pojava + 0.4) {
          const c = (t - pojava - 0.4) % svakih;
          if (c < 2.2) odsjaj = lerp(0.95, -0.95, c / 2.2);
        }
        let izlaz = 0;
        if (izlazOd >= 0) izlaz = mirno ? 1 : sat((t - izlazOd) / 0.95);
        gl.uniform1f(U.uVrijeme, t);
        gl.uniform1f(U.uKut, kut);
        gl.uniform2f(U.uMis, nagibX * 0.22, nagibY * 0.1);
        gl.uniform1f(U.uUvod, uvod);
        gl.uniform1f(U.uIzlaz, izlaz);
        gl.uniform1f(U.uOdsjaj, odsjaj);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, n);
        if (izlaz >= 1 && izlazGotov) { const f = izlazGotov; izlazGotov = null; f(); }
      }

      function sljedeca(sad) {
        raf = requestAnimationFrame(sljedeca);
        // korak vremena je ograničen: ako uređaj zastane, animacija se ne preskače
        const dt = Math.min(0.05, Math.max(0, (sad - zadnje) / 1000));
        zadnje = sad;
        vrijeme += dt;
        const f = 1 - Math.exp(-dt * 3.5);
        nagibX += (misX - nagibX) * f;
        nagibY += (misY - nagibY) * f;
        nacrtaj(vrijeme);
      }
      function pokreni() {
        if (!spremno || vrti || unisteno) return;
        if (MIRNO.matches && izlazOd < 0) { nacrtaj(vrijeme); return; }
        vrti = true;
        zadnje = performance.now();
        raf = requestAnimationFrame(sljedeca);
      }
      function stani() {
        vrti = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }

      platno.addEventListener('webglcontextlost', function (e) {
        e.preventDefault();
        stani();
        spremno = false; priprema = null; spremnik = null; program = null; gl = null;
      });
      platno.addEventListener('webglcontextrestored', function () {
        if (!unisteno) pripremi().then(function (ok) { if (ok && dogadaji.ziv()) pokreni(); });
      });

      return {
        pripremi: pripremi,
        velicina: velicina,
        // pri svakom otvaranju (dok je pozornica otvorena): oblik nastane
        // ispočetka; uz brzo = true je odmah složen (bez nastanka iz izmaglice)
        ispocetka: function (brzo) {
          stani();
          vrijeme = brzo ? pojava + 0.5 : 0; izlazOd = -1; izlazGotov = null;
          return pripremi().then(function (ok) { if (ok && dogadaji.ziv()) { velicina(); pokreni(); } return ok; });
        },
        // sklapanje: točkice se rasprše, pa animacija stane
        izlaz: function (gotovo) {
          if (!spremno) { if (gotovo) gotovo(); return; }
          izlazOd = vrijeme;
          izlazGotov = function () { stani(); if (gotovo) gotovo(); };
          pokreni();
        },
        stani: stani,
        mis: function (x, y) { misX = x; misY = y; },
        unisti: function () {
          unisteno = true;
          stani();
          if (gl && !gl.isContextLost()) {
            if (spremnik) gl.deleteBuffer(spremnik);
            if (program) gl.deleteProgram(program);
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
          }
          gl = null;
        }
      };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  STIL — ide u shadow root chata
    // ═══════════════════════════════════════════════════════════════════
    // Svi selektori počinju s ":host .vfrc-widget", pa su jači od Voiceflowovih
    const W = ':host .vfrc-widget';
    const PROZOR = W + ' .vfrc-chat';
    const ZAGLAVLJE = PROZOR + ' > .vfrc-header';
    const SKLOPLJENO = ':host([' + OZNAKA + '~="sklopljeno"]) .vfrc-widget';
    const PORUKE = PROZOR + ' > div:has(> .vfrc-chat-dialog)';             // dio koji se pomiče (poruke)
    const RED_UNOSA = W + ' div:has(> .vfrc-input-container)';
    const OKO_POLJA = W + ' .vfrc-footer div:has(.vfrc-input-container)';
    const NAPOMENA = RED_UNOSA + ' > .vfrc-input-container ~ div';          // "Powered by...", upozorenje o AI-ju
    const PLOCA_POCETKA = W + ' div:has(> ' + START + ')';
    const NA_DNO = W + ' .vfrc-footer button:not(.vfrc-button):not(.vfrc-input-container button)';
    const KORISNIK = W + ' .vfrc-user-response > div';
    const MARTI = W + ' .vfrc-system-response .vfrc-message:not([class*="vfrc-message--extension"])';
    const TIPKA = W + ' div:has(> .vfrc-typing-indicator)';
    const PILULA = W + ' .vfrc-system-response--actions .vfrc-button';
    const POSALJI = W + ' #vfrc-send-message';
    const PRAZNO = W + ' .vfrc-input-container:has(.vfrc-chat-input:placeholder-shown) #vfrc-send-message';
    const GLAVNI = [W + ' ' + START, W + ' .vfrc-prompt .vfrc-button:first-child'];
    const SPOREDNI = W + ' .vfrc-prompt .vfrc-button:last-child:not(:first-child)';
    const VISINA_TRAKE = 56;              // px, traka s natpisom (kao Voiceflowovo zaglavlje)

    // fino zrno (kao na fotografiji), da topla crna ne djeluje plastično
    const ZRNO = 'url("data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="z"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>' +
      '<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter><rect width="100%" height="100%" filter="url(#z)"/></svg>') + '")';

    const CSS = `
      :host {
        --mx-j-tama: ${B.tama};
        --mx-j-bjelokost: ${B.bjelokost};
        --mx-j-bjelokost-0: ${prozirna(B.bjelokost, 0)};
        --mx-j-papir: ${B.papir};
        --mx-j-tinta: ${B.tinta};
        --mx-j-tinta-55: ${prozirna(B.tinta, .55)};
        --mx-j-tinta-30: ${prozirna(B.tinta, .3)};
        --mx-j-tih: ${B.tih};
        --mx-j-linija: ${B.linija};
        --mx-j-puder: ${B.puder};
        --mx-j-roza: ${B.roza};
        --mx-j-roza-0: ${prozirna(B.roza, 0)};
        --mx-j-roza-60: ${prozirna(B.roza, .6)};
        --mx-j-roza-35: ${prozirna(B.roza, .35)};
        --mx-j-font: ${P.font};
        --mx-j-font-natpisa: ${P.fontNatpisa};
        /* sjena bijele kartice na bjelokosti: tanka topla linija i meka sjena ispod */
        --mx-j-sjena: 0 0 0 1px rgba(60, 40, 30, .05), 0 10px 26px -16px rgba(60, 40, 30, .32), 0 2px 5px -3px rgba(60, 40, 30, .12);
        --mx-j-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-j-meko: cubic-bezier(.45, 0, .2, 1);
        --mx-j-sklapanje: cubic-bezier(.65, 0, .25, 1);
      }

      /* ═══ PROZOR: topla bjelokost (oblik i mjere ostaju Voiceflowovi) ═══ */
      ${PROZOR} {
        background: var(--mx-j-bjelokost);
        color: var(--mx-j-tinta);
        font-family: var(--mx-j-font);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* ═══ TRAKA GORE: topla crna, natpis MARTIMEX i tanke ikone ═══ */
      ${ZAGLAVLJE} {
        position: relative;
        z-index: 3;
        flex: none;
        box-sizing: content-box;
        height: ${VISINA_TRAKE}px;
        margin: 0;
        padding: env(safe-area-inset-top, 0px) 6px 0 14px;   /* desno: ikona X završava gdje i poruke */
        border-radius: 0;
        background: var(--mx-j-tama);
        box-shadow: none;
      }
      /* isto fino zrno kao na pozornici, da traka i pozornica budu jedna ploha */
      ${ZAGLAVLJE}::before {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: -1;
        background: ${ZRNO};
        opacity: .07;
        pointer-events: none;
      }
      /* bez Voiceflowove slike i naslova: u sredini je natpis MARTIMEX;
         Voiceflowov naslov ostaje u kodu za čitače zaslona (natpis je ukras) */
      ${ZAGLAVLJE} > .vfrc-avatar { display: none; }
      ${ZAGLAVLJE} .vfrc-header--title {
        margin: 0;
        font-size: 0;
        line-height: 0;
        color: transparent;
      }
      ${ZAGLAVLJE} .vfrc-header--title::after {
        content: ${tekst(String(P.natpis || '').toUpperCase())};
        content: ${tekst(String(P.natpis || '').toUpperCase())} / "";
        position: absolute;
        top: env(safe-area-inset-top, 0px);
        left: 50%;
        transform: translateX(-50%);
        padding-left: .36em;                  /* optički centrira razmaknuta slova */
        font-family: var(--mx-j-font-natpisa);
        font-size: 17px;
        font-weight: 500;
        line-height: ${VISINA_TRAKE}px;
        letter-spacing: .36em;
        white-space: nowrap;
        color: var(--mx-j-puder);
        pointer-events: none;
        transition: transform .9s var(--mx-j-sklapanje);
      }
      /* kad se pozornica sklopi, natpis se malo digne, a ispod njega sjedne "Marti · AI asistentica" */
      ${SKLOPLJENO} .vfrc-chat > .vfrc-header .vfrc-header--title::after { transform: translate(-50%, -9px); }
      /* gumbi: samo svijetle ikone, bez kruga */
      ${ZAGLAVLJE} .vfrc-header--button {
        position: relative;
        width: 38px;
        height: 38px;
        padding: 9px;
        border-radius: 50%;
        color: ${prozirna(B.puder, .82)};
        background: transparent;
        box-shadow: none;
        transition: background-color .3s var(--mx-j-meko), color .3s var(--mx-j-meko), transform .3s var(--mx-j-glatko);
      }
      ${ZAGLAVLJE} .vfrc-header--button:hover { color: #fff; background: rgba(255, 255, 255, .07); }
      ${ZAGLAVLJE} .vfrc-header--button:active { transform: scale(.94); }
      ${ZAGLAVLJE} .vfrc-header--button:focus-visible { outline: 1px solid var(--mx-j-roza); outline-offset: 2px; }

      /* ═══ POZORNICA S FLAKONOM (umetnuta ispod trake) ═══ */
      :host .mx-j {
        position: relative;
        z-index: 4;                           /* natpis ispod nje sjedne u traku kad se sklopi */
        flex: none;
        font-family: var(--mx-j-font);
        -webkit-user-select: none;
                user-select: none;
      }
      :host .mx-j-scena {
        position: relative;
        height: var(--mx-j-visina, 230px);
        overflow: hidden;
        /* svijetla aura iza flakona: topla bijela jezgra iza stakla i šira
           ružičasta aura (sredina i veličina prate flakon, vidi mjeri) */
        background:
          radial-gradient(calc(var(--mx-j-flakon, 150px) * .34) calc(var(--mx-j-flakon, 150px) * .5) at 50% var(--mx-j-sredina, 42%), ${prozirna(B.auraJezgra, .14)}, ${prozirna(B.auraJezgra, .05)} 55%, ${prozirna(B.auraJezgra, 0)} 100%),
          radial-gradient(calc(var(--mx-j-flakon, 150px) * .9) min(calc(var(--mx-j-flakon, 150px) * .8), calc(var(--mx-j-sredina, 80px) - 2px)) at 50% var(--mx-j-sredina, 42%), ${prozirna(B.roza, .2)}, ${prozirna(B.roza, .075)} 48%, ${prozirna(B.roza, 0)} 100%),
          var(--mx-j-tama);
        transition: height .9s var(--mx-j-sklapanje);
      }
      /* zrno preko cijele pozornice */
      :host .mx-j-scena::after {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        background: ${ZRNO};
        opacity: .07;
        pointer-events: none;
      }
      :host .mx-j-platno {
        position: absolute;
        top: 0; left: 0;
        display: block;
        opacity: 0;
        transition: opacity .6s linear;
      }
      :host .mx-j-spremno .mx-j-platno { opacity: 1; }
      /* bez WebGL-a: tanki obris istog flakona */
      :host .mx-j-rezerva {
        display: none;
        position: absolute;
        left: 50%;
        top: var(--mx-j-sredina, 42%);
        width: calc(var(--mx-j-flakon, 150px) * 1.025 * .506);
        height: calc(var(--mx-j-flakon, 150px) * 1.025);
        transform: translate(-50%, -50%);
        color: ${prozirna(B.puder, .72)};
      }
      :host .mx-j-rezerva svg { display: block; width: 100%; height: 100%; }
      :host .mx-j-monogram .mx-j-rezerva { width: calc(var(--mx-j-flakon, 150px) * .9); height: calc(var(--mx-j-flakon, 150px) * .9); }
      :host .mx-j-bez-gl .mx-j-rezerva { display: block; animation: mx-j-prozirnost 1.2s var(--mx-j-meko) .1s backwards; }
      /* "Marti · AI asistentica": ispod flakona; kad se pozornica sklopi, s
         njom se digne i sjedne u traku ispod natpisa MARTIMEX */
      :host .mx-j-oznaka {
        position: absolute;
        left: 0; right: 0;
        bottom: 13px;
        margin: 0;
        text-align: center;
        font-size: 10px;
        font-weight: 400;
        line-height: 10px;
        letter-spacing: .32em;
        padding-left: .32em;
        text-transform: uppercase;
        white-space: nowrap;
        color: var(--mx-j-roza);
        pointer-events: none;
      }
      /* tanka roza crta na granici tame i bjelokosti; ispod nje poruke koje
         klize prema gore tiho nestanu u bjelokosti */
      :host .mx-j::after {
        content: "";
        position: absolute;
        left: 0; right: 0;
        bottom: -18px;
        height: 18px;
        background:
          linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza-60) 50%, var(--mx-j-roza-0)) top / 100% 1px no-repeat,
          linear-gradient(180deg, var(--mx-j-bjelokost), var(--mx-j-bjelokost-0));
        pointer-events: none;
      }
      :host .mx-j-sklopljeno .mx-j-scena { height: 0; }
      :host .mx-j-sklopljeno::after {
        background:
          linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza-35) 50%, var(--mx-j-roza-0)) top / 100% 1px no-repeat,
          linear-gradient(180deg, var(--mx-j-bjelokost), var(--mx-j-bjelokost-0));
      }
      /* bez prijelaza (chat se otvori na postojećem razgovoru) */
      :host .mx-j-odmah .mx-j-scena,
      :host([${OZNAKA}~="odmah"]) .vfrc-widget .vfrc-header--title::after { transition: none; }
      /* pojava pri svakom otvaranju (kad je oblik odmah složen, natpis ne čeka) */
      :host .mx-j-ulaz .mx-j-oznaka { animation: mx-j-pojava 1.2s var(--mx-j-glatko) 1.1s backwards; }
      :host .mx-j-ulaz.mx-j-brzo .mx-j-oznaka { animation-delay: .25s; }

      /* ═══ PORUKE ═══ */
      ${PORUKE} { padding-top: 14px; }
      /* Voiceflowov uvod (veliki avatar i naslov) više ne treba: tu je pozornica */
      ${W} .vfrc-assistant-info { display: none; }

      /* avatar uz Martine poruke: crni krug s natpisom M (iz Voiceflowa) */
      ${W} .vfrc-system-response > .vfrc-avatar {
        background-color: var(--mx-j-tama);
        box-shadow: 0 0 0 1px rgba(60, 40, 30, .06), 0 6px 14px -8px rgba(30, 20, 14, .55);
      }

      /* Martina poruka: bijela kartica */
      ${MARTI} {
        background: var(--mx-j-papir);
        color: var(--mx-j-tinta);
        border-radius: 18px 18px 18px 6px;
        box-shadow: var(--mx-j-sjena);
        font-family: var(--mx-j-font);
        font-size: 14.5px;
        font-weight: 400;
        line-height: 1.58;
        letter-spacing: .005em;
        animation: mx-j-pojava .6s var(--mx-j-glatko) backwards;
      }
      ${MARTI} > .markdown { padding: 12px 16px; overflow-wrap: anywhere; }
      ${MARTI} strong, ${MARTI} b { font-weight: 500; color: var(--mx-j-tinta); }
      ${MARTI} a {
        color: var(--mx-j-tinta);
        text-decoration: underline;
        text-decoration-color: var(--mx-j-roza);
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
        transition: text-decoration-color .2s ease;
      }
      ${MARTI} a:hover { text-decoration-color: var(--mx-j-tinta); }
      ${MARTI} hr { border: 0; height: 1px; background: linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza), var(--mx-j-roza-0)); }
      ${MARTI} ul, ${MARTI} ol { padding-left: 1.2em; }
      ${MARTI} li::marker { color: ${prozirna(B.tinta, .45)}; }

      /* kupčeva poruka: tinta, svijetli tekst */
      ${KORISNIK} {
        background: var(--mx-j-tinta);
        color: ${B.puder};
        border-radius: 18px 18px 6px 18px;
        padding: 11px 16px;
        box-shadow: 0 10px 22px -14px rgba(20, 14, 10, .6);
        font-family: var(--mx-j-font);
        font-size: 14.5px;
        font-weight: 400;
        line-height: 1.5;
        letter-spacing: .005em;
        animation: mx-j-pojava-desno .5s var(--mx-j-glatko) backwards;
      }

      /* Marti tipka: tri tople točkice u bijeloj kartici */
      ${TIPKA} {
        background: var(--mx-j-papir);
        border-radius: 18px 18px 18px 6px;
        box-shadow: var(--mx-j-sjena);
      }
      ${W} .vfrc-typing-indicator > span {
        background-color: ${prozirna(B.tinta, .55)};
        animation-name: mx-j-tocka;           /* trajanje i zastoj točkica ostaju Voiceflowovi */
      }
      @keyframes mx-j-tocka {
        0%, 60%, 100% { opacity: .3; transform: scale(.85); }
        25%           { opacity: 1; transform: scale(1.1); }
      }

      /* ponuđeni odgovori: pilule s tankim tamnim obrubom; pod mišem (ili
         dok je prst na njima) se ispune tintom */
      ${W} .vfrc-system-response--actions { gap: 8px; margin: 14px 0 6px; }
      ${PILULA} {
        min-height: 36px;
        padding: 8px 16px 9px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: var(--mx-j-tinta);
        box-shadow: inset 0 0 0 1px var(--mx-j-tinta-55);
        font-family: var(--mx-j-font);
        font-size: 13.5px;
        font-weight: 400;
        line-height: 19px;
        letter-spacing: .015em;
        transition: background-color .3s var(--mx-j-meko), color .3s var(--mx-j-meko), box-shadow .3s var(--mx-j-meko), transform .3s var(--mx-j-glatko);
      }
      @media (hover: hover) and (pointer: fine) {
        ${PILULA}:hover { background: var(--mx-j-tinta); color: ${B.puder}; box-shadow: inset 0 0 0 1px var(--mx-j-tinta); }
      }
      ${PILULA}:active { background: var(--mx-j-tinta); color: ${B.puder}; box-shadow: inset 0 0 0 1px var(--mx-j-tinta); transform: scale(.97); }
      ${PILULA}:focus-visible { outline: 1px solid var(--mx-j-tinta); outline-offset: 3px; }
      /* glavni ponuđeni odgovor (prvi iz POSTAVKI brzaPitanja): ispunjena tamna pilula */
      ${W} .vfrc-system-response--actions [data-mx-glavno] .vfrc-button,
      ${W} .vfrc-system-response--actions .vfrc-button[data-mx-glavno] {
        background: var(--mx-j-tinta);
        color: ${B.puder};
        box-shadow: inset 0 0 0 1px var(--mx-j-tinta), 0 10px 22px -14px rgba(20, 14, 10, .6);
      }
      @media (hover: hover) and (pointer: fine) {
        ${W} .vfrc-system-response--actions [data-mx-glavno] .vfrc-button:hover,
        ${W} .vfrc-system-response--actions .vfrc-button[data-mx-glavno]:hover { background: #000; color: #fff; box-shadow: inset 0 0 0 1px #000; }
      }
      ${P.naslovUvoda !== false ? `
      /* uvodna poruka: podebljani prvi red kao naslov u Cormorantu */
      ${W} .vfrc-chat-dialog > .vfrc-system-response--container:first-child ${MARTI.slice(W.length + 1)} .markdown > p:first-child > strong:first-child {
        display: block;
        margin: 1px 0 7px;
        font-family: var(--mx-j-font-natpisa);
        font-size: 22px;
        font-weight: 600;
        line-height: 1.18;
        letter-spacing: .005em;
        color: var(--mx-j-tinta);
      }
      ${W} .vfrc-chat-dialog > .vfrc-system-response--container:first-child ${MARTI.slice(W.length + 1)} .markdown > p:first-child > strong:first-child + br { display: none; }` : ''}

      /* Voiceflowove kartice i vrtuljak (ako ih Marti pošalje) */
      ${W} .vfrc-card {
        background: var(--mx-j-papir);
        color: var(--mx-j-tinta);
        border-radius: 18px;
        box-shadow: var(--mx-j-sjena);
        overflow: hidden;
      }
      ${W} .vfrc-card .vfrc-button {
        background: transparent;
        color: var(--mx-j-tinta);
        border-radius: 999px;
        box-shadow: inset 0 0 0 1px var(--mx-j-tinta-55);
        font-family: var(--mx-j-font);
        font-size: 13px;
      }
      ${W} .vfrc-card .vfrc-button:hover { background: var(--mx-j-tinta); color: ${B.puder}; }
      ${W} .vfrc-image { border-radius: 16px; box-shadow: var(--mx-j-sjena); }
      ${W} .vfrc-timestamp { color: var(--mx-j-tih); font-size: 10.5px; letter-spacing: .06em; }

      /* ekstenzije (npr. kartica proizvoda): bez Voiceflowova sivog okvira */
      ${W} .vfrc-message[class*="vfrc-message--extension"] {
        display: block;
        width: 100%;
        padding: 0;
        background: transparent;
        color: var(--mx-j-tinta);
      }

      /* kraj razgovora: tanke crte i natpis između njih */
      ${W} .vfrc-chat--status { margin: 22px 0 8px; }
      ${W} .vfrc-chat--status > div > div:nth-child(odd) {
        height: 1px;
        background: linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza));
      }
      ${W} .vfrc-chat--status > div > div:last-child { background: linear-gradient(90deg, var(--mx-j-roza), var(--mx-j-roza-0)); }
      ${W} .vfrc-chat--status > div > div:nth-child(2) {
        background: var(--mx-j-bjelokost);
        color: var(--mx-j-tih);
        font-family: var(--mx-j-font);
        font-size: 10px;
        font-weight: 400;
        letter-spacing: .26em;
        text-transform: uppercase;
      }
      ${T.razgovorZavrsen ? `
      ${W} .vfrc-chat--status > div > div:nth-child(2) { font-size: 0; letter-spacing: 0; }
      ${W} .vfrc-chat--status > div > div:nth-child(2)::after {
        content: ${tekst(T.razgovorZavrsen)};
        font-size: 10px;
        letter-spacing: .26em;
        padding-left: .26em;
      }` : ''}

      /* ═══ DNO: polje za poruku je bijela kapsula s tankim toplim rubom ═══ */
      ${W} .vfrc-footer {
        position: relative;
        z-index: 3;
        flex: none;
        padding-bottom: env(safe-area-inset-bottom, 0px);
        background: var(--mx-j-bjelokost);
      }
      ${OKO_POLJA} { padding-left: 0; padding-right: 0; background: none; }
      ${RED_UNOSA}, ${OKO_POLJA}:has(> .vfrc-input-container) { padding: 0 14px; background: none; }
      ${W} .vfrc-input-container {
        min-height: 52px;
        padding: 7px 7px 7px 20px;
        border: 0;
        border-radius: 26px;
        background: var(--mx-j-papir);
        box-shadow: 0 0 0 1px var(--mx-j-linija), 0 10px 24px -18px rgba(60, 40, 30, .4);
        transition: box-shadow .35s var(--mx-j-meko);
      }
      ${W} .vfrc-input-container:hover { border: 0; }
      /* Voiceflowov okvir fokusa: tanji i topliji */
      ${W} .vfrc-input-container > div:first-child { border-radius: inherit; box-shadow: none; }
      ${W} .vfrc-input-container:focus-within { box-shadow: 0 0 0 1px var(--mx-j-tinta-30), 0 0 0 4px ${prozirna(B.roza, .28)}, 0 10px 24px -18px rgba(60, 40, 30, .4); }
      ${W} .vfrc-chat-input {
        background: transparent;
        color: var(--mx-j-tinta);
        caret-color: var(--mx-j-tinta);
        font-family: var(--mx-j-font);
        font-weight: 400;
        line-height: 22px;
        letter-spacing: .01em;
      }
      ${W} .vfrc-chat-input::placeholder { color: var(--mx-j-tih); opacity: 1; }
      ${W} .vfrc-chat-input::selection { background: ${prozirna(B.roza, .5)}; }
      ${W} .vfrc-input-container button:not(#vfrc-send-message) { border-radius: 50%; color: var(--mx-j-tih); background: transparent; }
      ${W} .vfrc-input-container button:not(#vfrc-send-message):hover { color: var(--mx-j-tinta); background: ${prozirna(B.roza, .25)}; }

      /* gumb za slanje: tamni krug kad ima što poslati; prazno polje → samo tiha strelica */
      ${POSALJI} {
        width: 38px;
        height: 38px;
        background: var(--mx-j-tinta);
        box-shadow: 0 6px 14px -8px rgba(20, 14, 10, .7);
        transition: background-color .3s var(--mx-j-meko), box-shadow .3s var(--mx-j-meko), transform .3s var(--mx-j-glatko);
      }
      ${POSALJI} svg { color: ${B.puder}; }
      ${POSALJI}:hover { cursor: pointer; transform: scale(1.05); }
      ${POSALJI}:active { transform: scale(.94); }
      ${PRAZNO} { background: transparent; box-shadow: inset 0 0 0 1px var(--mx-j-linija); transform: none; cursor: default; }
      ${PRAZNO} svg { color: var(--mx-j-tih); }

      /* gumb "na dno razgovora" */
      ${NA_DNO} { border: 0; background: var(--mx-j-papir); color: var(--mx-j-tinta); box-shadow: var(--mx-j-sjena); }

      /* napomena ispod polja ("Powered by...", upozorenje o AI-ju) */
      ${NAPOMENA} {
        padding: 9px 16px 11px;
        font-family: var(--mx-j-font);
        font-size: 10.5px;
        font-weight: 400;
        letter-spacing: .04em;
        color: var(--mx-j-tih);
      }
      ${NAPOMENA} a { color: inherit; }

      /* ═══ KRAJ RAZGOVORA I "NOVI RAZGOVOR?": bijela ploča odozdo ═══
         Jedna ploča uz dno prozora, zaobljena gore; donje kutove zaobli sam
         prozor (na mobitelu je ploča ravna uz rub zaslona). Kad razgovor
         završi, ploča je Voiceflowov .vfrc-footer__start-button (on je
         zaobljen sa svih strana i odmaknut od ruba); okvir s gumbom u njoj je
         samo sadržaj, inače bi bile dvije ploče jedna u drugoj, a unutarnja
         s oštrim donjim kutovima */
      ${W} .vfrc-footer__start-button,
      ${PLOCA_POCETKA}:not(.vfrc-footer__start-button *),
      ${W} .vfrc-prompt {
        padding: 18px 16px calc(28px + env(safe-area-inset-bottom, 0px));
        border: 0;
        border-radius: 22px 22px 0 0;
        background: var(--mx-j-papir);
        box-shadow: 0 0 0 1px rgba(60, 40, 30, .05), 0 -18px 40px -24px rgba(40, 26, 18, .45);
      }
      ${W} .vfrc-footer__start-button ${'div:has(> ' + START + ')'} {
        padding: 0;
        border: 0;
        border-radius: 0;
        background: none;
        box-shadow: none;
      }
      /* dok razgovor tek kreće (otvaranjem chata), Voiceflowova ploča s gumbom se ne vidi */
      ${PROZOR}:not(:has(.vfrc-system-response, .vfrc-user-response)) .vfrc-footer__start-button,
      ${PROZOR}:not(:has(.vfrc-system-response, .vfrc-user-response)) div:has(> ${START}) { visibility: hidden; }
      ${W} .vfrc-chat--overlay { background-color: rgba(20, 14, 10, .22); }
      /* zatamnjenje, ploča "Novi razgovor?" i izbornik uvijek iznad trake i pozornice */
      ${PROZOR} > .vfrc-chat--overlay { z-index: 6; }
      ${PROZOR} > .vfrc-prompt, ${PROZOR} > .vfrc-more-menu, ${PROZOR} > .vfrc-file-drop-overlay { z-index: 7; }
      ${GLAVNI.join(',\n      ')},
      ${W} .vfrc-prompt .vfrc-button {
        min-height: 48px;
        border-radius: 999px;
        font-family: var(--mx-j-font);
        font-size: 11.5px;
        font-weight: 500;
        letter-spacing: .24em;
        text-transform: uppercase;
        transition: background-color .3s var(--mx-j-meko), color .3s var(--mx-j-meko), transform .3s var(--mx-j-glatko);
      }
      ${GLAVNI.join(',\n      ')} {
        background: var(--mx-j-tinta);
        color: ${B.puder};
        box-shadow: 0 12px 26px -16px rgba(20, 14, 10, .8);
      }
      ${GLAVNI.map(function (s) { return s + ':hover'; }).join(',\n      ')} { background: #000; color: #fff; }
      ${SPOREDNI} { background: transparent; color: var(--mx-j-tinta); box-shadow: inset 0 0 0 1px var(--mx-j-tinta-55); }
      ${SPOREDNI}:hover { background: ${prozirna(B.tinta, .05)}; }
      ${GLAVNI.map(function (s) { return s + ':active'; }).join(', ')},
      ${W} .vfrc-prompt .vfrc-button:active { transform: scale(.98); }
      ${GLAVNI.map(function (s) { return s + ':focus-visible'; }).join(', ')},
      ${W} .vfrc-prompt .vfrc-button:focus-visible { outline: 1px solid var(--mx-j-tinta); outline-offset: 3px; }
      ${T.noviRazgovor ? `
      ${GLAVNI.join(', ')} { font-size: 0; letter-spacing: 0; }
      ${GLAVNI.map(function (s) { return s + '::after'; }).join(', ')} {
        content: ${tekst(T.noviRazgovor)};
        font-size: 11.5px;
        letter-spacing: .24em;
        padding-left: .24em;
      }` : ''}
      ${T.odustani ? `
      ${SPOREDNI} { font-size: 0; letter-spacing: 0; }
      ${SPOREDNI}::after {
        content: ${tekst(T.odustani)};
        font-size: 11.5px;
        letter-spacing: .24em;
        padding-left: .24em;
      }` : ''}

      /* ═══ POJAVA (samo prozirnost i mali pomak) ═══ */
      @keyframes mx-j-pojava {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: none; }
      }
      @keyframes mx-j-pojava-desno {
        from { opacity: 0; transform: translate(6px, 6px); }
        to   { opacity: 1; transform: none; }
      }
      @keyframes mx-j-prozirnost {
        from { opacity: 0; }
      }

      /* "Smanji pokrete": ništa ne klizi, sve se samo tiho pojavi */
      @media (prefers-reduced-motion: reduce) {
        :host .mx-j-scena, ${ZAGLAVLJE} .vfrc-header--title::after { transition: none; }
        :host .mx-j-ulaz .mx-j-oznaka { animation: mx-j-prozirnost .4s linear backwards; }
        ${MARTI}, ${KORISNIK} { animation: mx-j-prozirnost .3s linear backwards; }
        ${W} .vfrc-typing-indicator > span { animation: none; opacity: 1; }
        ${POSALJI}, ${POSALJI}:hover, ${POSALJI}:active, ${PILULA}:active,
        ${ZAGLAVLJE} .vfrc-header--button:active { transform: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-jedan]');
      if (stari && stari.getAttribute('data-mx-jedan') === '1') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-jedan', '1');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // Fontovi (Jost i Cormorant Garamond iz mape fonts/) idu u <head>
    // stranice: fontovi iz <head> vrijede i unutar shadow roota. Ako ih je
    // neki drugi modul već učitao, ne učitavaju se opet.
    function ubaciFontove() {
      if (!document.head) return;
      const rasponi = {
        'latin': 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
        'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'
      };
      function dodaj(id, fontovi) {
        const stil = document.createElement('style');
        stil.id = id;
        stil.textContent = fontovi.map(function (f) {
          return Object.keys(rasponi).map(function (r) {
            return '@font-face{font-family:"' + f[0] + '";src:url("' + KORIJEN + 'fonts/' + f[1] + '-' + r + '.woff2") format("woff2");' +
              'font-weight:' + f[2] + ';font-style:normal;font-display:swap;unicode-range:' + rasponi[r] + '}';
          }).join('\n');
        }).join('\n');
        document.head.appendChild(stil);
      }
      // fontovi se preuzmu odmah (a ne tek kad se chat otvori): monogram se crta
      // fontom natpisa, a naslov uvodne poruke ne smije zatreperiti
      ['jost-latin', 'jost-latin-ext', 'cormorant-garamond-latin', 'cormorant-garamond-latin-ext'].forEach(function (f) {
        const l = document.createElement('link');
        l.rel = 'preload';
        l.as = 'font';
        l.type = 'font/woff2';
        l.crossOrigin = 'anonymous';
        l.href = KORIJEN + 'fonts/' + f + '.woff2';
        document.head.appendChild(l);
      });
      if (!document.getElementById('mx-pocetna-font-300')) dodaj('mx-pocetna-font-300', [['MX Jost', 'jost', '300']]);
      if (document.getElementById('mx-kartice-font') || document.getElementById('mx-pocetna-font') || document.getElementById('mx-tema-font') || document.getElementById('mx-jedan-font')) return;
      dodaj('mx-jedan-font', [['MX Jost', 'jost', '400 600'], ['MX Cormorant', 'cormorant-garamond', '500 700']]);
    }


    // ═══════════════════════════════════════════════════════════════════
    //  POZORNICA — element ispod Voiceflowova zaglavlja
    // ═══════════════════════════════════════════════════════════════════
    function el(oznaka, klasa, sadrzaj) {
      const e = document.createElement(oznaka);
      if (klasa) e.className = klasa;
      if (sadrzaj) e.textContent = sadrzaj;
      return e;
    }

    function napraviPozornicu() {
      const korijen = el('div', 'mx-j');
      korijen.setAttribute('role', 'presentation');
      const scena = el('div', 'mx-j-scena');
      const platno = el('canvas', 'mx-j-platno');
      platno.setAttribute('aria-hidden', 'true');
      const rezerva = el('div', 'mx-j-rezerva');
      rezerva.innerHTML = OBLIK === 'monogram' ? obrisMonograma() : obrisFlakona();
      if (OBLIK === 'monogram') korijen.classList.add('mx-j-monogram');
      scena.appendChild(platno);
      scena.appendChild(rezerva);
      korijen.appendChild(scena);
      const oznaka = el('p', 'mx-j-oznaka', P.oznaka);
      korijen.appendChild(oznaka);

      let visina = 230, ziv = false, izmjereno = false;
      const anim = napraviAnimaciju(platno, scena, {
        bezAnimacije: function () { korijen.classList.add('mx-j-bez-gl'); },
        visina: function () { return visina; },
        ziv: function () { return ziv; }
      });

      if (F.nagibPremaMisu !== false && MIS) {
        korijen.addEventListener('pointermove', function (e) {
          const r = scena.getBoundingClientRect();
          if (!r.width || !r.height) return;
          anim.mis(sat((e.clientX - r.left) / r.width) * 2 - 1, sat((e.clientY - r.top) / r.height) * 2 - 1);
        });
        korijen.addEventListener('pointerleave', function () { anim.mis(0, 0); });
      }

      return {
        el: korijen,
        anim: anim,
        ziv: function () { return ziv; },
        // visina otvorene pozornice prema visini prozora chata
        mjeri: function (visinaProzora) {
          if (!(visinaProzora > 0)) return;              // prozor se još ne vidi (zatvoren chat)
          const p = P.pozornica || {};
          const min = broj(p.min, 150, 60, 600), max = Math.max(min, broj(p.max, 224, 60, 800));
          let v = Math.round(Math.min(max, Math.max(min, visinaProzora * broj(p.udio, 0.27, 0.1, 0.8))));
          if (visinaProzora < 520) v = Math.round(Math.max(110, visinaProzora * 0.24));   // vrlo nizak prozor (mobitel položen)
          if (v !== visina || !izmjereno) {
            visina = v;
            // prvo mjerenje bez prijelaza (pozornica ne smije "skočiti" pri otvaranju)
            if (!izmjereno) korijen.classList.add('mx-j-odmah');
            korijen.style.setProperty('--mx-j-visina', v + 'px');
            const r = rasporedFlakona(v);
            korijen.style.setProperty('--mx-j-sredina', r.sredina.toFixed(1) + 'px');
            korijen.style.setProperty('--mx-j-flakon', r.visina.toFixed(1) + 'px');
            if (!izmjereno) {
              void korijen.offsetHeight;
              if (!korijen.classList.contains('mx-j-sklopljeno')) korijen.classList.remove('mx-j-odmah');
              izmjereno = true;
            }
            anim.velicina();
          }
        },
        // pozornica otvorena: oblik nastane ispočetka; od drugog otvaranja u
        // istoj kartici je odmah složen (pamti se u sessionStorageu)
        pokazi: function () {
          ziv = true;
          let brzo = false;
          if (P.brzoDrugiPut !== false) {
            try { brzo = sessionStorage.getItem('mx-j-viden') === '1'; sessionStorage.setItem('mx-j-viden', '1'); } catch (e) { /* bez pamćenja */ }
          }
          korijen.classList.remove('mx-j-ulaz', 'mx-j-spremno', 'mx-j-brzo');
          void korijen.offsetWidth;                       // da se pojava ponovi
          korijen.classList.add('mx-j-ulaz');
          if (brzo) korijen.classList.add('mx-j-brzo');
          anim.ispocetka(brzo).then(function (ok) { if (ok && ziv) korijen.classList.add('mx-j-spremno'); });
        },
        // chat zatvoren: animacija stane
        sakrij: function () { ziv = false; anim.stani(); },
        // sklapanje: točkice se rasprše dok se pozornica sklapa
        sklopi: function (odmah) {
          ziv = false;
          korijen.classList.toggle('mx-j-odmah', !!odmah);
          korijen.classList.add('mx-j-sklopljeno');
          korijen.classList.remove('mx-j-ulaz');
          if (odmah) anim.stani(); else anim.izlaz();
        },
        rasiri: function () {
          korijen.classList.remove('mx-j-sklopljeno', 'mx-j-odmah');
        }
      };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  VEZA S VOICEFLOWOM
    // ═══════════════════════════════════════════════════════════════════
    const S = { host: null, kor: null, pozornica: null, sklopljeno: false, otvoren: false, promatracVelicine: null, prozor: null, ceka: false, imaloOdgovora: false };

    function kupacJeOdgovorio(kor) { return !!kor.querySelector('.vfrc-chat .vfrc-user-response'); }
    function imaRazgovor(kor) { return !!kor.querySelector('.vfrc-chat .vfrc-system-response, .vfrc-chat .vfrc-user-response'); }

    // Razgovor još nije krenuo: Voiceflow tada ima svoj gumb za početak (ploča se ne vidi, vidi CSS)
    function cekaPocetak(kor) {
      const g = kor.querySelector(START);
      if (!g || !g.parentElement) return false;
      const ploca = g.closest('.vfrc-footer__start-button') || g.parentElement;
      return !ploca.hasAttribute('inert') && getComputedStyle(g).display !== 'none' && !imaRazgovor(kor);
    }

    // stanje na elementu chata (za CSS): "otvoreno", "sklopljeno" ili "sklopljeno odmah"
    function oznaci(sklopljeno, odmah) {
      const h = S.host;
      if (!h) return;
      const v = sklopljeno ? (odmah ? 'sklopljeno odmah' : 'sklopljeno') : 'otvoreno';
      if (h.getAttribute(OZNAKA) !== v) h.setAttribute(OZNAKA, v);
    }

    function sklopi(odmah) {
      if (!S.pozornica || S.sklopljeno) return;
      odmah = !!odmah || MIRNO.matches;
      S.sklopljeno = true;
      oznaci(true, odmah);
      S.pozornica.sklopi(odmah);
    }

    function rasiri() {
      if (!S.pozornica || !S.sklopljeno) return;
      S.sklopljeno = false;
      oznaci(false);
      S.pozornica.rasiri();
      if (S.otvoren) S.pozornica.pokazi();
    }

    // Pozornica mora biti odmah ispod Voiceflowova zaglavlja (ako Voiceflow
    // iscrta prozor iznova, vrati se na mjesto)
    function prikvaci(kor) {
      const prozor = kor.querySelector('.vfrc-chat');
      const zaglavlje = prozor && prozor.querySelector(':scope > .vfrc-header');
      if (!prozor || !zaglavlje) return false;
      if (!S.pozornica) S.pozornica = napraviPozornicu();
      const el = S.pozornica.el;
      if (el.parentNode !== prozor || el.previousElementSibling !== zaglavlje) prozor.insertBefore(el, zaglavlje.nextSibling);
      if (S.prozor !== prozor) {
        S.prozor = prozor;
        if (S.promatracVelicine) S.promatracVelicine.disconnect();
        if (typeof ResizeObserver === 'function') {
          S.promatracVelicine = new ResizeObserver(function () { S.pozornica.mjeri(prozor.clientHeight); });
          S.promatracVelicine.observe(prozor);
        }
        S.pozornica.mjeri(prozor.clientHeight);
      }
      return true;
    }

    // Stanje prozora: pri svakoj promjeni u chatu (poruke, novi razgovor...)
    function uskladi() {
      S.ceka = false;
      const kor = S.kor;
      if (!kor || !prikvaci(kor)) return;
      if (kupacJeOdgovorio(kor)) {
        // prvi odgovor kupca: pozornica se sklopi (dok je chat zatvoren, odmah)
        S.imaloOdgovora = true;
        sklopi(!S.otvoren);
      } else if (S.sklopljeno && S.imaloOdgovora && imaRazgovor(kor)) {
        // novi razgovor (gumb gore): pozornica i flakon se vrate
        S.imaloOdgovora = false;
        rasiri();
      }
      if (S.otvoren) {
        // prozor se pojavio tek nakon otvaranja: flakon i razgovor kreću sad
        if (!S.sklopljeno && !S.pozornica.ziv()) S.pozornica.pokazi();
        zapocni();
      }
    }
    // (setTimeout, a ne requestAnimationFrame: radi i dok je kartica u pozadini)
    function uskladiUskoro() {
      if (S.ceka) return;
      S.ceka = true;
      setTimeout(uskladi, 0);
    }

    // Ponuđeni odgovori: redoslijed iz POSTAVKI (CSS order, pa se Voiceflowov
    // DOM ne dira) i oznaka glavnoga. Samo tamo gdje ima barem jedan poznat
    // gumb (uvodna poruka); ostali ponuđeni odgovori ostaju kako jesu
    const BRZA = (Array.isArray(P.brzaPitanja) ? P.brzaPitanja : []).map(function (t) { return String(t || '').replace(/\s+/g, ' ').trim().toLowerCase(); }).filter(Boolean);
    function urediPitanja(kor) {
      if (!BRZA.length) return;
      kor.querySelectorAll('.vfrc-chat .vfrc-system-response--actions').forEach(function (skupina) {
        const gumbi = Array.from(skupina.querySelectorAll('.vfrc-button'));
        const mjesta = gumbi.map(function (g) { return BRZA.indexOf(String(g.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()); });
        if (mjesta.every(function (i) { return i === -1; })) return;
        gumbi.forEach(function (g, k) {
          const w = g.parentElement && g.parentElement !== skupina ? g.parentElement : g;   // Voiceflowov omot gumba
          const red = mjesta[k] === -1 ? String(BRZA.length + k) : String(mjesta[k]);
          if (w.style.order !== red) w.style.order = red;
          const glavno = mjesta[k] === 0;
          if (glavno !== w.hasAttribute('data-mx-glavno')) { if (glavno) w.setAttribute('data-mx-glavno', ''); else w.removeAttribute('data-mx-glavno'); }
        });
      });
    }

    // Otvaranjem chata razgovor kreće sam (ako još ne postoji)
    function zapocni() {
      const kor = S.kor;
      if (!kor || !cekaPocetak(kor)) return;
      const g = kor.querySelector(START);
      try { g.click(); } catch (e) { /* nije bitno */ }
    }

    function otvoreno() {
      S.otvoren = true;
      const kor = S.kor;
      if (!kor || !prikvaci(kor)) return;     // prozor još ne postoji: uskladi() nastavi kad se pojavi
      if (kupacJeOdgovorio(kor)) { S.imaloOdgovora = true; sklopi(true); }
      else if (!S.sklopljeno) S.pozornica.pokazi();
      zapocni();
    }

    function zatvoreno() {
      S.otvoren = false;
      const p = S.pozornica;
      // animacija staje kad se prozor spusti (Voiceflow ga spušta 0,3 s)
      if (p) setTimeout(function () { if (!S.otvoren) p.sakrij(); }, 400);
    }

    // Voiceflow javlja otvaranje i zatvaranje chata porukom na window
    // ('{"type":"voiceflow:open"}' / '{"type":"voiceflow:close"}')
    function pratiOtvaranje() {
      window.addEventListener('message', function (e) {
        if (e.source && e.source !== window) return;
        let d = e.data;
        if (typeof d === 'string') {
          if (d.indexOf('voiceflow:') === -1) return;
          try { d = JSON.parse(d); } catch (x) { return; }
        }
        const tip = d && d.type;
        if (tip === 'voiceflow:open') otvoreno();
        else if (tip === 'voiceflow:close') zatvoreno();
      });
    }

    // Na niskom prozoru (mobitel) pozornica se sklopi čim kupac dotakne polje.
    // Samo na dodir ili klik: Voiceflow sam stavlja fokus u polje kad se chat
    // otvori, a to ne smije sklopiti pozornicu
    function pratiPolje(kor) {
      const granica = +P.sklopiNaFokus || 0;
      if (!granica) return;
      function dodir(e) {
        const put = e.composedPath ? e.composedPath() : [e.target];
        const polje = put.some(function (x) { return x && x.classList && (x.classList.contains('vfrc-chat-input') || x.classList.contains('vfrc-input-container')); });
        if (!polje) return;
        const prozor = kor.querySelector('.vfrc-chat');
        if (prozor && (MOBITEL || prozor.clientHeight < granica) && S.otvoren && S.pozornica) sklopi(false);
      }
      kor.addEventListener('pointerdown', dodir, true);
    }

    // Hrvatski natpisi gumba su u CSS-u (content); čitač zaslona dobije
    // hrvatsko ime (aria-label). Samo atribut, u chat se ništa ne umeće.
    function imenaGumba(kor) {
      const parovi = [
        [T.noviRazgovor, START + ', .vfrc-prompt .vfrc-button:first-child'],
        [T.odustani, '.vfrc-prompt .vfrc-button:last-child:not(:first-child)']
      ].filter(function (p) { return p[0]; });
      parovi.forEach(function (p) {
        kor.querySelectorAll(p[1]).forEach(function (g) {
          if (g.getAttribute('aria-label') !== p[0]) g.setAttribute('aria-label', p[0]);
        });
      });
    }

    // Voiceflow se učitava usporedo s ovim modulom: pričeka se njegov element
    function cekajHost(gotovo) {
      const pocetak = Date.now();
      (function trazi() {
        const h = document.getElementById(HOST);
        if (h && h.shadowRoot) { gotovo(h); return; }
        if (Date.now() - pocetak < 60000) setTimeout(trazi, 150);
      })();
    }

    function pokreni() {
      // Voiceflow više sam ne pokreće razgovor (to radi otvaranje chata) i
      // pamti razgovor koliko je zadano; loader.js ovo preda Voiceflowu
      const vf = window.MartimexVoiceflow = window.MartimexVoiceflow || {};
      vf.autostart = false;
      if (PAMCENJE) vf.assistant = Object.assign({}, vf.assistant, { persistence: PAMCENJE });

      ubaciFontove();
      pratiOtvaranje();
      cekajHost(function (host) {
        S.host = host;
        S.kor = host.shadowRoot;
        ubaciStil(S.kor);
        oznaci(false);
        pratiPolje(S.kor);
        new MutationObserver(function () { imenaGumba(S.kor); urediPitanja(S.kor); uskladiUskoro(); })
          .observe(S.kor, { childList: true, subtree: true });
        uskladi();
        // oblik flakona i WebGL se pripreme unaprijed, kad preglednik miruje
        const kasnije = window.requestIdleCallback || function (f) { return setTimeout(f, 1200); };
        kasnije(function () { if (S.pozornica) S.pozornica.anim.pripremi(); }, { timeout: 2500 });
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_JEDAN.pokreni(); }
  catch (e) { console.warn('[Martimex] Chat na jednom ekranu nije pokrenut:', e); }

})();
