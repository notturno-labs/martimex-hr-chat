import { napraviAnimaciju3D } from './animacija3d.js';

(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — početni ekran chata s Marti (v3)
  //
  //  POKUS "STVARNO" (pokusi/stvarno/): isti početni ekran i isti krug, ali
  //  oblici su pravi 3D predmeti (three.js: staklo, tekućina, zlato, papir,
  //  metalna slova) umjesto točkica; vidi izvor/animacija3d.js i
  //  pokusi/README.md. Ova datoteka je izgrađena (npm run izgradi u mapi
  //  izvor/), ne mijenja se ručno. Na martimex.hr se ne učitava.
  //
  //  Kad se chat otvori, umjesto praznog Voiceflow prozora prikaže se
  //  početni ekran na crnoj podlozi:
  //
  //   - u sredini "živi" AI objekt od tisuća svjetlećih točkica složenih
  //     u tanke linije, kao metalna tkanina: polako se okreće,
  //     diše, a površina mu se stalno valovito gužva i mijenja
  //   - objekt se zatim fluidno pretopi u flakon po uzoru na Xerjoff 1861
  //     (Naxos): fasetirano staklo (jednako široko sprijeda i sa strane) s
  //     medenom tekućinom, zlatni prsten, zlatni čep sa šiljkom i zlatna
  //     pločica u obliku trapeza sa znakom X; flakon nastane malo okrenut
  //     ulijevo i bez zastoja se jednoliko okreće
  //   - flakon se (odozgo) rastopi u izmaglicu, a iz nje se slože logotipi
  //     parfemskih kuća, točno kao na slici u mapi marke/ (24 logotipa u tri
  //     stupca: Chanel, Hermès, Guerlain ... Lancôme, Estée Lauder), od
  //     točkica boje pudera: logotip po logotip, slijeva nadesno. Vide se
  //     četiri reda odjednom; zatim se zid polako pomakne prema gore, gornji
  //     redovi se rastope u dim, a donji se slože iz izmaglice. Preko
  //     logotipa prijeđe meki zlatni sjaj
  //   - logotipi se rastope u svjetlucavu izmaglicu, a iz nje nastane pet
  //     bočica Penhaligon's Portraits (modeli su u mapi penhaligons/), u
  //     rasporedu V kao na reklamnoj fotografiji: u sredini sprijeda najveća
  //     (Lord George, jelen), a ostale prema van sve manje i dalje. Nastaju
  //     jedna po jedna, od sredine prema van: staklo se puni odozdo, etiketa
  //     se otisne odozgo, a zlatna glava životinje izraste iz ovratnika.
  //     Bočice imaju više točkica od ostalih oblika (gusti sloj), pa su jasne
  //     i oštre; vrlo polako se okreću, a zatim se nad svakom (odozgo)
  //     digne zlatni dim
  //   - iz dima nastane natpis MARTIMEX (Cormorant Garamond, razmaknuta velika slova),
  //     satkan od tankih niti boje pudera, kao nekad natpis "Marti":
  //     vodoravne niti kroz slovo, a samo vodoravni rubovi (serifi, prečke)
  //     dobiju i tanku nit, pa su oštri. Dim se razlije duž natpisa, a iz
  //     njega slova nastaju jedno za drugim: niti se slože odozdo prema gore,
  //     a slovo, tek malo veće, meko sjedne na mjesto; ispod natpisa se
  //     pojavi podnaslov
  //   - natpis zatim miruje: kroz slova ide lagani val, točkice svjetlucaju
  //     kao i u ostalim oblicima, a preko natpisa polako prijeđe meki sjaj
  //   - na kraju se slova obrnutim redom (od zadnjeg) dignu i rastope u
  //     dim, iz kojeg se ponovno složi objekt, i sve kreće ispočetka
  //   - svaki prijelaz je tekuć: točkice ne putuju sve odjednom nego u
  //     valu, zavrtlože se kao dim i slegnu na novo mjesto; objekt se pri
  //     tome okreće tako da natpis na kraju uvijek stoji ravno prema nama
  //   - raspored (prema dizajnu "Početni ekran – stil K"): gore zaglavlje
  //     MARTIMEX i gumb za zatvaranje; ispod njega okvir animacije (450 px,
  //     animacija u prostoru 345 × 393 px poravnatom na dno, iza nje meki
  //     zlatni sjaj; animacija je 9 % veća, vidi velicinaAnimacije);
  //     zatim tekst koji stoji cijelo vrijeme: naslov u dva
  //     reda ("Vaš osobni" bjelokost, "AI beauty savjetnik" rose-gold),
  //     tanka statična crta i kratki opis
  //   - na dnu poziv "POČETAK": preko slova prelazi svjetlosni odsjaj, a
  //     crta ispod njih se širi i skuplja ("diše"). Tek kad se on pritisne,
  //     kreće razgovor, tj. standardni Voiceflow workflow. Točkice se tada
  //     rasprše kao izmaglica parfema, a chat se otvori u krugu koji se
  //     širi od poziva
  //   - na računalu se objekt lagano nagne prema mišu
  //
  //  Početni ekran se prikaže pri prvom otvaranju chata nakon svakog
  //  učitavanja stranice. Ako razgovor već postoji (npr. korisnik je s
  //  preporuke otišao na stranicu proizvoda), "Početak" samo otkrije taj
  //  razgovor; nakon toga se chat do sljedećeg učitavanja stranice otvara
  //  ravno na razgovor. Voiceflow razgovor pamti samo dok je kartica
  //  preglednika otvorena, pa svaki novi posjet počinje ispočetka (oboje se
  //  mijenja u POSTAVKAMA). Svako otvaranje pokreće animaciju ispočetka.
  //
  //  Tehnički:
  //   - Voiceflowu se isključi "autostart" (preko window.MartimexVoiceflow,
  //     koji loader.js preda Voiceflowu), pa otvaranje chata više samo ne
  //     pokreće razgovor
  //   - početni ekran je sloj unutar Voiceflowova prozora chata
  //     (.vfrc-chat, u shadow DOM-u elementa #voiceflow-chat), preko
  //     svega ostalog; dijelovi chata ispod njega su za to vrijeme
  //     isključeni (inert), pa ih ni tipkovnica ne može dohvatiti
  //   - "Početak" pritisne Voiceflowov (skriveni) gumb za početak razgovora
  //     (#vfrc-start-chat), pa razgovor kreće potpuno standardno
  //   - animacija se crta u WebGL-u: jedan poziv crtanja po sličici, sav
  //     račun (oblici, šum, prijelazi) radi grafička kartica, pa je glatka
  //     i na mobitelu. Oblici se izračunaju unaprijed, dok preglednik
  //     miruje, a animacija se vrti samo dok je početni ekran otvoren.
  //     Logotipi (marke/marke.js) i Penhaligon's bočice se računaju zadnje,
  //     u malim koracima; ako se chat otvori prije nego su gotovi, krug ide
  //     bez njih, a oni se uključe čim su spremni (najkasnije od sljedećeg
  //     kruga; ako se ne učitaju, krug je bez njih)
  //   - ako WebGL ne radi, umjesto animacije je natpis MARTIMEX slovima
  //   - "Smanji pokrete" (postavka uređaja): natpis MARTIMEX od točkica
  //     miruje, bez prijelaza
  //   - natpis je uvijek unutar prozora chata: na uskom prozoru (mobitel)
  //     se smanji tako da do ruba ostane barem RUB_NATPISA px
  //   - ako se ovaj modul ne učita, chat se ponaša kao prije (razgovor krene
  //     čim se chat otvori); ako zakaže pri otvaranju, razgovor se pokrene
  //     sam. Ako Voiceflow jednog dana promijeni prozor pa se početni ekran
  //     ne može prikazati, ostaje Voiceflowov gumb za početak razgovora
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxPocetna) return;   // zaštita ako se modul učita dvaput
  window.__mxPocetna = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_POCETNA_POSTAVKE = {
    boje: {                   // uvijek u obliku #rrggbb
      podloga: '#000000',     // crna podloga početnog ekrana
      // animacija
      srebro:  '#e8e6eb',     // točkice AI objekta i stakla bočica
      puder:   '#f6ebe7',     // najsvjetlija roza: logotipi, natpis MARTIMEX i podnaslov ispod njega
      zlato:   '#e0bb72',     // zlatni čep, prsten i pločica flakona, medena tekućina u njemu
      // tekst početnog ekrana
      bjelokost:  '#f4ece6',  // 1. red naslova
      roseGold:   '#e3c1ac',  // 2. red naslova, crte, "POČETAK"
      sjajPoziva: '#fff7f0',  // odsjaj koji prelazi preko "POČETAK"
      opis:       '#a89d95',  // opis ispod naslova (prigušena topla siva)
      zaglavlje:  '#cfc6bf',  // natpis MARTIMEX i X
      zlatniSjaj: '#c9a45c'   // meki sjaj iza animacije (na 10 % jačine)
    },

    // Fontovi iz mape fonts/ (učitava ih i kartica-artikla.js); natpis
    // MARTIMEX se od točkica slaže u Cormorant Garamondu (polumasno, 600),
    // kao nazivi parfema
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',
    fontNatpisa: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    // Riječ u koju se pretope Penhaligon bočice; piše se točno kako je zadana (velika
    // slova s razmakom). Slova se slažu jedno za drugim, pa je bolja kratka
    // riječ (do desetak slova)
    natpis: 'MARTIMEX',
    podnaslov: 'Vodič kroz svijet mirisa',    // ispod natpisa ('' = bez podnaslova)
    zaglavlje: 'Martimex',                    // gore u sredini ('' = bez); piše se velikim slovima
    tekstGumba: 'Početak',                    // poziv na dnu; piše se velikim slovima

    // Tekst između animacije i poziva "POČETAK"; stoji cijelo vrijeme ('' = bez)
    naslov: 'Vaš osobni',                     // 1. red naslova (bjelokost)
    naslovNaglasak: 'AI beauty savjetnik',    // 2. red naslova (rose-gold)
    opis: 'Trebate pomoć pri odabiru proizvoda, imate pitanje o narudžbi ili vas zanima nešto vezano uz Martimex? Sve odgovore možete dobiti ovdje.',

    // Trajanje dijelova animacije u sekundama
    trajanje: {
      pojava: 1.6,            // točkice se iz izmaglice skupe u AI objekt
      objekt: 3.4,            // živi AI objekt
      flakon: 4.4,            // flakon po uzoru na Xerjoff 1861 (Naxos): nastane malo okrenut ulijevo i jednoliko se okreće
      nastanakMarki: 3.6,     // flakon se rastopi u izmaglicu, a iz nje se slože logotipi (logotip po logotip)
      marke: 9,               // logotipi: prva četiri reda, pomak zida prema gore, zadnja četiri reda
      nastanak: 4.6,          // logotipi se rastope u izmaglicu, a iz nje nastane pet Penhaligon's bočica
      penhaligon: 4.4,        // pet Penhaligon's bočica stoji i polako se okreće
      rastapanjeBocica: 3.4,  // bočice se (odozgo) rastope u dim, a iz njega nastane natpis MARTIMEX
      natpis: 5,              // natpis MARTIMEX miruje (preko njega polako prijeđe meki sjaj)
      prijelaz: 2.4           // svaki ostali prijelaz iz oblika u oblik
    },
    ponavljaj: true,          // false → animacija stane na natpisu MARTIMEX

    // Logotipi parfemskih kuća (marke/marke.js) između flakona i Penhaligon's
    // bočica (false → krug bez njih)
    marke: true,

    // Pet bočica Penhaligon's Portraits prije natpisa MARTIMEX
    // (false → krug bez njih)
    penhaligon: true,

    // Broj točkica: više = gušće, ali više posla za uređaj. Jačina točkica se
    // prilagodi broju, pa oblici sjaje jednako (pet Penhaligon's bočica i 24
    // logotipa dijele isti broj točkica, zato ih je više nego prije: 26 000 i 16 000)
    tocaka: 56000,            // računalo
    tocakaMobitel: 32000,     // mobitel i tablet
    // Penhaligon's bočice imaju više točkica, da budu jasne: od toga je
    // "tocaka" u glavnom sloju (bočice nastaju iz izmaglice), a ostatak se
    // crta samo dok su bočice na ekranu
    tocakaBocica: 120000,     // računalo
    tocakaBocicaMobitel: 64000,   // mobitel i tablet

    nagibPremaMisu: true,     // na računalu se objekt lagano nagne prema mišu

    // Veličina animacije: 1 = prema dizajnu (oblici ispune prostor 345 × 393 px),
    // 1.09 = 9 % veća (oblici malo izađu iz tog prostora, što se ne vidi)
    velicinaAnimacije: 1.09,

    // Kad se prikazuje početni ekran:
    // true  → pri prvom otvaranju chata nakon svakog učitavanja stranice, i
    //         kad razgovor već postoji ("Početak" ga tada samo otkrije; novi
    //         razgovor krene samo ako ga još nema ili je stari završio)
    // false → samo dok razgovor još nije započeo
    iKadRazgovorPostoji: true,

    // Koliko dugo Voiceflow pamti razgovor:
    // 'sessionStorage' → dok je kartica preglednika otvorena: kupac može
    //                    šetati po webshopu, a svaki novi posjet počinje ispočetka
    // 'localStorage'   → trajno (i idući tjedan se otvori stari razgovor)
    // 'memory'         → samo do sljedećeg učitavanja stranice
    // ''               → kako je postavljeno u Voiceflowu
    pamcenje: 'sessionStorage'
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX_POCETNA = (function () {
    'use strict';

    const P = MX_POCETNA_POSTAVKE;
    const B = P.boje;
    const T = P.trajanje || {};
    const VELICINA = sekunde(P.velicinaAnimacije, 1, 0.3);   // povećanje animacije
    const HOST = 'voiceflow-chat';        // element u čiji shadow DOM Voiceflow crta chat
    const PROZOR = '.vfrc-chat';          // Voiceflowov prozor chata (službena klasa)
    const START = '#vfrc-start-chat';     // Voiceflowov gumb "Start new chat"
    // adresa mape u kojoj je ova skripta (GitHub Pages) — odatle se učitavaju fontovi
    // (POKUS: skripta je u mapi pokusi/stvarno/ uz modeli.js, a fontovi,
    // logotipi i Penhaligon bočice su u mapi repozitorija, dvije razine iznad)
    const BAZA_POKUSA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/pokusi/stvarno/pocetna-chata-stvarno.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
    const BAZA = BAZA_POKUSA + '../../';
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
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + a + ')'; }
    function boja01(hex) { return rgb(hex).map(function (v) { return v / 255; }); }
    function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function zasiti(c, k) {                      // jača zasićenost boje (0..1)
      const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      return c.map(function (v) { return sat(l + (v - l) * k); });
    }
    function glatko(x) { x = sat(x); return x * x * (3 - 2 * x); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function sekunde(v, zadano, min) { v = +v; return isFinite(v) && v >= min ? v : zadano; }



    // (iz izbačenih dijelova pocetna-chata.js: što trebaju tijek, stil i 3D animacija)
    const SIRINA_NATPISA = 2.25;   // širina natpisa MARTIMEX
    const RAZMAK_SLOVA = 0.14;     // razmak među slovima natpisa (udio veličine fonta)
    const TEZINA_NATPISA = 700;    // debljina Cormoranta u natpisu
    const RUB_NATPISA = 22;        // najmanji razmak natpisa od ruba prozora (px)
    const OBLIK = { objekt: 0, flakon: 1, marke: 2, pen: 3, natpis: 4 };
    function ucitajSkriptu(src) {
      return new Promise(function (gotovo) {
        const s = document.createElement('script');
        const rok = setTimeout(function () { gotovo(false); }, 15000);
        s.src = src;
        s.async = true;
        s.onload = function () { clearTimeout(rok); gotovo(true); };
        s.onerror = function () { clearTimeout(rok); gotovo(false); };
        document.head.appendChild(s);
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    //  VREMENSKI TIJEK — koji je oblik na ekranu u trenutku kruga i kako je
    //  koji oblik okrenut
    //
    //  Krug: objekt → prijelaz → flakon → slaganje logotipa → logotipi →
    //  nastanak → pet Penhaligon bočica → prijelaz → natpis → prijelaz.
    //  Logotipa i Penhaligon bočica nema dok nisu pripremljeni (ili kad su
    //  isključeni): tada oblik prije njih ide ravno u sljedeći. Svaki oblik
    //  ima vlastiti okret oko okomite osi:
    //   - objekt se stalno polako okreće
    //   - flakon se okreće jednoliko, bez zastoja: nastane malo okrenut
    //     ulijevo (gledano od nas), pločica mu prođe ispred nas i okreće se
    //     dalje, i dok se rastapa
    //   - logotipi stoje ravno prema nama (samo se nagnu prema mišu); vidi se
    //     jedna stranica (MAR_REDOVA redova), a zatim se zid glatko pomakne na
    //     sljedeću; preko svake stranice prijeđe meki sjaj
    //   - Penhaligon bočice stoje u rasporedu V (vidi PEN_RASPORED) i nastanu
    //     licem prema nama, pa se vrlo polako okreću svaka oko svoje osi;
    //     cijela skupina se samo nagne prema nama
    //   - natpis uvijek stoji ravno prema nama (samo se nagne prema mišu)
    //  U prijelazu točkice putuju između dva oblika, svaki okrenut po svome.
    //  Za svaki oblik vraća se [kut, nagib prema nama, lagano njihanje], a
    //  stranica je stranica logotipa na ekranu (0 .. broj stranica − 1; dok
    //  se zid pomiče, decimalni broj).
    // ═══════════════════════════════════════════════════════════════════
    function napraviTijek(imaMarke, imaPen, brojStranica) {
      const pojava = sekunde(T.pojava, 1.6, 0.3);
      const D = sekunde(T.prijelaz, 2.4, 0.6);
      const DN = sekunde(T.nastanak, 4.6, 0.8);
      const DM = sekunde(T.nastanakMarki, 3.6, 0.8);
      const DR = sekunde(T.rastapanjeBocica, 3.4, 0.8);
      const wO = 0.4, wF = 0.55, wP = 0.05;  // kutne brzine objekta, flakona i Penhaligon bočica (rad/s; bočice se samo lagano okreću)
      const NAGIB = 0.08;                    // flakon i bočice malo nagnuti prema nama
      const KUT_FLAKONA = -0.3;              // flakon nastane malo okrenut ulijevo, gledano od nas (oko 17°)
      // [oblik, mirovanje]
      const KRUG = [
        ['objekt', sekunde(T.objekt, 3.4, 0.5)],
        ['flakon', sekunde(T.flakon, 4.4, 0.5)],
        ['marke', sekunde(T.marke, 9, 1)],
        ['pen', sekunde(T.penhaligon, 4.4, 0.5)],
        ['natpis', sekunde(T.natpis, 5, 0.5)]
      ].filter(function (o) { return (imaMarke || o[0] !== 'marke') && (imaPen || o[0] !== 'pen'); });
      // prijelaz iz oblika u oblik: u Penhaligon bočice nastanak, u logotipe
      // slaganje logotip po logotip, iz bočica u natpis rastapanje bočica
      function prijelazU(oblik, sljedeci) { return sljedeci === 'pen' ? DN : sljedeci === 'marke' ? DM : oblik === 'pen' ? DR : D; }
      function E(x) { x = sat(x); return x * x * x - x * x * x * x / 2; }   // integral od glatko()
      const faze = [], pocetak = {}, mirovanje = {};
      let od = 0;
      KRUG.forEach(function (o, i) {
        const sljedeci = KRUG[(i + 1) % KRUG.length][0];
        pocetak[o[0]] = od;
        mirovanje[o[0]] = o[1];
        faze.push({ od: od, d: o[1], oblik: o[0], u: o[0], prijelaz: false });
        od += o[1];
        faze.push({ od: od, d: prijelazU(o[0], sljedeci), oblik: o[0], u: sljedeci, prijelaz: true });
        od += prijelazU(o[0], sljedeci);
      });
      const L = od, POCETAK_FLAKONA = pocetak.flakon, POCETAK_NATPISA = pocetak.natpis;
      // do kraja mirovanja flakona svi krugovi teku jednako, a krugovi s
      // logotipima (sa i bez Penhaligon bočica) do kraja mirovanja logotipa
      const ZAJEDNICKO = pocetak.flakon + mirovanje.flakon, KRAJ_MARKI = imaMarke ? pocetak.marke + mirovanje.marke : ZAJEDNICKO;
      // bočice su licem prema nama (u svom rasporedu) kad nastanu, pa se polako okreću dalje
      const SREDINA_PEN = imaPen ? pocetak.pen : 0;
      // logotipi: svaka stranica se vidi PRIKAZ s, a zid se do sljedeće pomiče POMAK s
      const STR = Math.max(1, brojStranica || 1), TM = mirovanje.marke || 0;
      const POMAK = STR > 1 ? Math.min(2.2, TM * 0.3) : 0, PRIKAZ = (TM - (STR - 1) * POMAK) / STR;
      function stranicaU(tau) {
        let s = 0;
        for (let j = 1; j < STR; j++) s += glatko((tau - j * PRIKAZ - (j - 1) * POMAK) / POMAK);
        return s;
      }
      // meki sjaj prijeđe preko svake stranice ukoso, slijeva odozdo nadesno gore
      function sjajMarki(tau) {
        const j = Math.min(STR - 1, Math.floor(tau / (PRIKAZ + POMAK)));
        return lerp(-1.9, 1.9, (tau - j * (PRIKAZ + POMAK) - 0.4) / Math.max(0.5, PRIKAZ - 0.6));
      }

      // u = vrijeme od početka mirovanja objekta (u prijelazu iz natpisa je
      // negativno: okret se tada glatko pokrene iz mirovanja)
      function kutObjekta(u) { return u >= 0 ? wO * (D / 2 + u) : wO * D * E((u + D) / D); }
      // u = vrijeme od nastanka flakona: okreće se jednoliko, bez zastoja, i
      // dok nastaje (u < 0) i dok se rastapa
      function kutFlakona(u) { return KUT_FLAKONA + wF * u; }

      // t: vrijeme od otvaranja (za njihanje objekta), c: vrijeme u krugu
      // (od kraja pojave); c < 0: pojava
      function stanje(t, c) {
        const st = { od: OBLIK.objekt, do: OBLIK.objekt, prog: 0, uvod: 1, A: null, B: null, odsjaj: 99, sjaj: 99, podnaslov: false, penKut: 0, stranica: 0 };
        const nagibO = 0.3 + 0.07 * Math.sin(t * 0.47), njihanjeO = 0.1 * Math.sin(t * 0.29);
        if (c < 0) {
          st.uvod = t / pojava;
          st.A = st.B = [wO * (D / 2 + t - pojava), nagibO, njihanjeO];
          return st;
        }
        let f = faze[faze.length - 1];
        for (let i = 0; i < faze.length; i++) if (c < faze[i].od + faze[i].d) { f = faze[i]; break; }
        const tau = Math.min(c - f.od, f.d);
        const okret = {
          objekt: [kutObjekta(c), nagibO, njihanjeO],
          flakon: [kutFlakona(c - POCETAK_FLAKONA), NAGIB, 0],
          marke: [0, 0, 0],
          pen: [0, NAGIB, 0],
          natpis: [0, 0, 0]
        };
        st.penKut = wP * (c - SREDINA_PEN);
        st.od = OBLIK[f.oblik];
        st.do = OBLIK[f.u];
        if (f.oblik === 'marke') st.stranica = f.prijelaz ? STR - 1 : stranicaU(tau);
        if (!f.prijelaz) {
          st.A = st.B = okret[f.oblik];
          if (f.oblik === 'flakon' || f.oblik === 'pen') st.odsjaj = lerp(1.15, -1.25, (tau - 0.5) / 1.7);   // odsjaj niz staklo
          if (f.oblik === 'marke') st.sjaj = sjajMarki(tau);
          if (f.oblik === 'natpis') {
            // meki sjaj polako prijeđe preko natpisa slijeva nadesno (natpis
            // je od -1,125 do 1,125); bez ponavljanja svakih 6 s
            const ct = P.ponavljaj ? tau : (t - pojava - POCETAK_NATPISA) % 6;
            st.sjaj = lerp(-1.7, 1.7, (ct - 0.5) / 2.6);
            st.podnaslov = true;
          }
          return st;
        }
        st.prog = tau / f.d;
        const e = glatko(st.prog);
        st.A = okret[f.oblik];
        st.B = okret[f.u];
        if (f.u === 'natpis') {
          // oblik se uspravlja prema nama, a natpis nastaje ravno
          st.A = [st.A[0], st.A[1] * (1 - e), st.A[2]];
          st.podnaslov = st.prog > 0.8;
        }
        // natpis se rastapa, a objekt se iz mirovanja pokrene
        if (f.oblik === 'natpis') st.B = [kutObjekta(c - L), nagibO * e, njihanjeO * e];
        return st;
      }
      return { stanje: stanje, pojava: pojava, L: L, natpisOd: POCETAK_NATPISA, imaMarke: imaMarke, zajednicko: ZAJEDNICKO, krajMarki: KRAJ_MARKI };
    }



    // ═══════════════════════════════════════════════════════════════════
    //  ANIMACIJA — pravi 3D (vidi animacija3d.js)
    // ═══════════════════════════════════════════════════════════════════
    function napraviAnimaciju(platno, scena, dogadaji) {
      return napraviAnimaciju3D(platno, scena, dogadaji, {
        P: P, B: B, napraviTijek: napraviTijek, OBLIK: OBLIK, BAZA: BAZA, BAZA_POKUSA: BAZA_POKUSA,
        MIRNO: MIRNO, MOBITEL: MOBITEL, MIS: MIS, VELICINA: VELICINA, ucitajSkriptu: ucitajSkriptu,
        SIRINA_NATPISA: SIRINA_NATPISA, RUB_NATPISA: RUB_NATPISA
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    //  STIL — ide u shadow root chata
    // ═══════════════════════════════════════════════════════════════════
    const CSS = `
      :host .mx-p {
        --mx-p-podloga: ${B.podloga};
        --mx-p-puder: ${B.puder};
        --mx-p-bjelokost: ${B.bjelokost};
        --mx-p-rose: ${B.roseGold};
        --mx-p-rose-0: ${prozirna(B.roseGold, 0)};
        --mx-p-rose-90: ${prozirna(B.roseGold, .9)};
        --mx-p-rose-25: ${prozirna(B.roseGold, .25)};
        --mx-p-sjaj-poziva: ${B.sjajPoziva};
        --mx-p-opis: ${B.opis};
        --mx-p-zaglavlje: ${B.zaglavlje};
        --mx-p-zlatni-sjaj: ${prozirna(B.zlatniSjaj, .1)};
        --mx-p-zlatni-sjaj-0: ${prozirna(B.zlatniSjaj, 0)};
        --mx-p-staklo: ${prozirna(B.zaglavlje, .08)};
        --mx-p-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-p-meko: cubic-bezier(.45, 0, .2, 1);
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 1000;
        container-type: size;           /* za @container: na niskom prozoru se raspored stisne */
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: inherit;
        background: var(--mx-p-podloga);
        color: var(--mx-p-bjelokost);
        font-family: ${P.font};
        font-size: 15px;
        font-weight: 300;
        line-height: 1.4;
        letter-spacing: normal;
        text-align: left;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-user-select: none;
                user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      :host .mx-p * { box-sizing: border-box; }

      :host .mx-p-platno {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: block;
        opacity: 0;
        transition: opacity .5s linear;
      }
      :host .mx-p-spremno .mx-p-platno { opacity: 1; }

      /* ── 1. zaglavlje ── */
      :host .mx-p-vrh {
        position: relative;
        z-index: 2;
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        height: calc(64px + env(safe-area-inset-top, 0px));
        padding: env(safe-area-inset-top, 0px) 64px 0;
      }
      :host .mx-p-marka {
        font-size: 12px;
        font-weight: 400;
        letter-spacing: .42em;
        padding-left: .42em;            /* optički centrira razmaknuta slova */
        text-transform: uppercase;
        white-space: nowrap;
        color: var(--mx-p-zaglavlje);
      }
      :host .mx-p-zatvori {
        -webkit-appearance: none;
                appearance: none;
        position: absolute;
        right: 14px;
        top: calc(env(safe-area-inset-top, 0px) + 10px);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--mx-p-zaglavlje);
        cursor: pointer;
        transition: background-color .3s var(--mx-p-meko);
      }
      :host .mx-p-zatvori:hover { background-color: var(--mx-p-staklo); }
      :host .mx-p-zatvori:focus { outline: none; }
      :host .mx-p-zatvori:focus-visible { outline: 1px solid var(--mx-p-rose); outline-offset: 2px; }
      :host .mx-p-zatvori svg { width: 16px; height: 16px; display: block; }

      /* ── 2. hero: okvir animacije (450 px), iza nje meki zlatni sjaj ── */
      :host .mx-p-scena {
        flex: 0 1 450px;
        min-height: 150px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        background: radial-gradient(closest-side, var(--mx-p-zlatni-sjaj), var(--mx-p-zlatni-sjaj-0) 100%);
      }
      /* prostor animacije: 345 × 393 px, poravnat na dno okvira */
      :host .mx-p-animacija {
        position: relative;
        flex: none;
        width: 345px;
        max-width: 100%;
        height: 393px;
        max-height: 100%;
      }
      :host .mx-p-naslov-sr {             /* natpis za čitače zaslona (na ekranu ga crtaju točkice) */
        position: absolute;
        width: 1px; height: 1px;
        margin: -1px; padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }
      :host .mx-p-podnaslov {
        position: absolute;
        left: -40px;
        right: -40px;
        top: var(--mx-p-ispod, 72%);
        margin: 0;
        text-align: center;
        font-size: 11px;
        font-weight: 400;
        letter-spacing: .3em;
        text-indent: .3em;
        text-transform: uppercase;
        color: var(--mx-p-puder);
        opacity: 0;
        transform: translateY(8px);
        filter: blur(3px);
        transition: opacity .9s var(--mx-p-meko), transform 1.3s var(--mx-p-glatko), filter 1s var(--mx-p-meko);
        pointer-events: none;
      }
      :host .mx-p-podnaslov-da .mx-p-podnaslov { opacity: .72; transform: none; filter: none; }

      /* bez WebGL-a: natpis slovima (razmaknuta velika slova); širina prati
         prozor (cqw), da natpis uvijek stane s razmakom do ruba */
      :host .mx-p-rezerva {
        display: none;
        position: absolute;
        left: -100px; right: -100px;
        top: 50%;
        margin: 0;
        transform: translateY(-50%);
        text-align: center;
        white-space: nowrap;
        font-family: ${P.fontNatpisa};
        font-size: 44px;
        font-size: min(58px, calc((100cqw - 56px) / ${(Array.from(String(P.natpis || 'MARTIMEX')).length * 0.78 + 0.1).toFixed(2)}));
        font-weight: ${TEZINA_NATPISA};
        line-height: 1;
        letter-spacing: ${RAZMAK_SLOVA}em;
        padding-left: ${RAZMAK_SLOVA}em;    /* optički centrira razmaknuta slova */
        color: var(--mx-p-puder);
      }
      :host .mx-p-bez-gl .mx-p-rezerva { display: block; animation: mx-p-rezerva 1.6s var(--mx-p-glatko) .2s backwards; }
      :host .mx-p-bez-gl .mx-p-podnaslov { top: calc(50% + 36px); opacity: .72; transform: none; filter: none; }

      /* ── 3. tekst: naslov → statična crta → opis (stoji cijelo vrijeme) ── */
      :host .mx-p-tekst {
        position: relative;
        z-index: 2;
        flex: 1 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 18px;
        padding: 44px 40px 16px;
        text-align: center;
      }
      :host .mx-p-naslov {
        margin: 0;
        font-size: 29px;
        font-weight: 300;
        line-height: 1.14;
        letter-spacing: -.02em;
        color: var(--mx-p-bjelokost);
      }
      :host .mx-p-naslov-naglasak { color: var(--mx-p-rose); }

      /* ── 4. statična crta ispod naslova (bez animacije) ── */
      :host .mx-p-crta {
        display: block;
        flex: none;
        width: 300px;
        max-width: 100%;
        height: 1px;
        background: linear-gradient(90deg, var(--mx-p-rose-0), var(--mx-p-rose-90), var(--mx-p-rose-0));
      }
      :host .mx-p-opis {
        margin: 0;
        max-width: 320px;
        font-size: 14px;
        font-weight: 300;
        line-height: 1.6;
        color: var(--mx-p-opis);
      }

      /* ── 5. poziv "POČETAK" na dnu ── */
      :host .mx-p-dno {
        position: relative;
        z-index: 2;
        flex: none;
        display: flex;
        justify-content: center;
        padding: 0 0 calc(34px + env(safe-area-inset-bottom, 0px));
      }
      :host .mx-p-gumb {
        -webkit-appearance: none;
                appearance: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        margin: 0;
        padding: 10px 24px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--mx-p-rose);
        font: inherit;
        cursor: pointer;
      }
      :host .mx-p-gumb:focus { outline: none; }
      :host .mx-p-gumb:focus-visible { outline: 1px solid var(--mx-p-rose); outline-offset: 4px; }
      :host .mx-p-gumb-tekst {
        display: block;
        font-size: 16px;
        font-weight: 400;
        line-height: 1.4;
        letter-spacing: .42em;
        padding-left: .42em;
        text-transform: uppercase;
        white-space: nowrap;
        color: var(--mx-p-rose);
      }
      /* svjetlosni odsjaj prelazi preko slova */
      @supports ((-webkit-background-clip: text) or (background-clip: text)) {
        :host .mx-p-gumb-tekst {
          background: linear-gradient(90deg,
            var(--mx-p-rose) 0%,
            var(--mx-p-rose) 38%,
            var(--mx-p-sjaj-poziva) 50%,
            var(--mx-p-rose) 62%,
            var(--mx-p-rose) 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
                  background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: mx-p-sjaj-poziva 3.6s linear infinite;
        }
      }
      /* crta ispod poziva "diše" */
      :host .mx-p-gumb-crta {
        display: block;
        width: 160px;
        height: 1px;
        background: linear-gradient(90deg, var(--mx-p-rose-0), var(--mx-p-rose-90), var(--mx-p-rose-0));
        animation: mx-p-linija 2.6s ease-in-out infinite;
      }

      /* nizak prozor chata: animacija se smanji, a tekst se stisne */
      @container (max-height: 820px) {
        :host .mx-p-tekst { padding-top: 30px; }
      }
      @container (max-height: 720px) {
        :host .mx-p-tekst { gap: 14px; padding-top: 22px; }
        :host .mx-p-naslov { font-size: 26px; }
        :host .mx-p-opis { font-size: 13px; line-height: 1.5; }
        :host .mx-p-dno { padding-bottom: calc(22px + env(safe-area-inset-bottom, 0px)); }
      }
      @container (max-height: 580px) {
        :host .mx-p-opis { display: none; }
      }
      /* uzak prozor (mobitel) */
      @container (max-width: 400px) {
        :host .mx-p-tekst { padding-left: 24px; padding-right: 24px; }
      }

      /* ── pojava pri svakom otvaranju ── */
      :host .mx-p-ulaz .mx-p-vrh { animation: mx-p-pojava .9s var(--mx-p-glatko) .1s backwards; }
      :host .mx-p-ulaz .mx-p-tekst { animation: mx-p-pojava 1.1s var(--mx-p-glatko) .35s backwards; }
      :host .mx-p-ulaz .mx-p-dno { animation: mx-p-pojava 1s var(--mx-p-glatko) .6s backwards; }

      /* ── nakon "Početak": tekst i poziv se povuku, chat se otvori u krugu ── */
      :host .mx-p-izlaz { pointer-events: none; }
      :host .mx-p-izlaz .mx-p-vrh,
      :host .mx-p-izlaz .mx-p-tekst,
      :host .mx-p-izlaz .mx-p-dno,
      :host .mx-p-izlaz .mx-p-podnaslov {
        opacity: 0;
        transform: translateY(6px);
        transition: opacity .35s var(--mx-p-meko), transform .5s var(--mx-p-meko);
      }
      :host .mx-p-izlaz .mx-p-scena { opacity: 0; transition: opacity .6s var(--mx-p-meko); }

      @keyframes mx-p-sjaj-poziva {
        0%   { background-position: 150% 0; }
        100% { background-position: -150% 0; }
      }
      @keyframes mx-p-linija {
        0%, 100% { transform: scaleX(.35); opacity: .45; }
        50%      { transform: scaleX(1);   opacity: 1; }
      }
      @keyframes mx-p-pojava {
        from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
      }
      @keyframes mx-p-rezerva {
        from { opacity: 0; transform: translateY(-42%); filter: blur(10px); letter-spacing: .3em; }
      }
      @keyframes mx-p-prozirnost {
        from { opacity: 0; }
      }

      /* "Smanji pokrete": ništa se ne pomiče, samo se tiho pojavi */
      @media (prefers-reduced-motion: reduce) {
        :host .mx-p-ulaz .mx-p-vrh,
        :host .mx-p-ulaz .mx-p-tekst,
        :host .mx-p-ulaz .mx-p-dno,
        :host .mx-p-bez-gl .mx-p-rezerva { animation: mx-p-prozirnost .4s linear backwards; }
        :host .mx-p-gumb-tekst {
          animation: none;
          background: none;
          -webkit-text-fill-color: currentColor;
          color: var(--mx-p-rose);
        }
        :host .mx-p-gumb-crta { animation: none; }
        :host .mx-p-podnaslov { transition: opacity .4s linear; transform: none; filter: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-pocetna]');
      if (stari && stari.getAttribute('data-mx-pocetna') === '6') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-pocetna', '6');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // Fontove (Jost i Cormorant Garamond iz mape fonts/) inače učitava
    // kartica-artikla.js; ako je taj modul isključen, učitaju se ovdje.
    // Idu u <head> stranice: fontovi iz <head> vrijede i unutar shadow roota.
    // Tanki Jost (300) za naslov i opis početnog ekrana dodaje se uvijek:
    // kartica ga ne učitava (ista datoteka, ona sadrži sve debljine).
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
            return '@font-face{font-family:"' + f[0] + '";src:url("' + BAZA + 'fonts/' + f[1] + '-' + r + '.woff2") format("woff2");' +
              'font-weight:' + f[2] + ';font-style:normal;font-display:swap;unicode-range:' + rasponi[r] + '}';
          }).join('\n');
        }).join('\n');
        document.head.appendChild(stil);
      }
      if (!document.getElementById('mx-pocetna-font-300')) dodaj('mx-pocetna-font-300', [['MX Jost', 'jost', '300']]);
      if (document.getElementById('mx-kartice-font') || document.getElementById('mx-pocetna-font')) return;
      dodaj('mx-pocetna-font', [['MX Jost', 'jost', '400 600'], ['MX Cormorant', 'cormorant-garamond', '500 700']]);
    }


    // ═══════════════════════════════════════════════════════════════════
    //  POČETNI EKRAN — sloj preko Voiceflowova prozora chata
    // ═══════════════════════════════════════════════════════════════════
    const IKONA_X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>';

    function el(oznaka, klasa, tekst) {
      const e = document.createElement(oznaka);
      if (klasa) e.className = klasa;
      if (tekst) e.textContent = tekst;
      return e;
    }

    // jednoslovne riječi (o, i, u, s, k, a, z) ne ostaju same na kraju retka
    function bezUdovica(tekst) {
      return String(tekst).replace(/(^|\s)([aiouskzAIOUSKZ])\s+/g, '$1$2 ');
    }

    function napraviPocetnu(radnje) {
      const korijen = el('div', 'mx-p');
      korijen.setAttribute('role', 'region');
      korijen.setAttribute('aria-label', String(P.natpis || 'MARTIMEX'));

      const platno = el('canvas', 'mx-p-platno');
      platno.setAttribute('aria-hidden', 'true');

      // 1. zaglavlje: MARTIMEX i X
      const vrh = el('div', 'mx-p-vrh');
      if (P.zaglavlje) vrh.appendChild(el('span', 'mx-p-marka', P.zaglavlje));
      const zatvori = el('button', 'mx-p-zatvori');
      zatvori.type = 'button';
      zatvori.setAttribute('aria-label', 'Zatvori chat');
      zatvori.innerHTML = IKONA_X;
      vrh.appendChild(zatvori);

      // 2. hero: okvir animacije; točkice se crtaju u prostoru .mx-p-animacija
      const scena = el('div', 'mx-p-scena');
      const prostor = el('div', 'mx-p-animacija');
      prostor.appendChild(el('h2', 'mx-p-naslov-sr', P.natpis));
      const rezerva = el('p', 'mx-p-rezerva', P.natpis);
      rezerva.setAttribute('aria-hidden', 'true');
      prostor.appendChild(rezerva);
      if (P.podnaslov) prostor.appendChild(el('p', 'mx-p-podnaslov', P.podnaslov));
      scena.appendChild(prostor);

      // 3. tekst: naslov (dva reda) → statična crta → opis
      const tekst = el('div', 'mx-p-tekst');
      if (P.naslov || P.naslovNaglasak) {
        const naslov = el('h2', 'mx-p-naslov');
        if (P.naslov) naslov.appendChild(document.createTextNode(bezUdovica(P.naslov)));
        if (P.naslov && P.naslovNaglasak) naslov.appendChild(document.createElement('br'));
        if (P.naslovNaglasak) naslov.appendChild(el('span', 'mx-p-naslov-naglasak', bezUdovica(P.naslovNaglasak)));
        tekst.appendChild(naslov);
        const crta = el('span', 'mx-p-crta');
        crta.setAttribute('aria-hidden', 'true');
        tekst.appendChild(crta);
      }
      if (P.opis) tekst.appendChild(el('p', 'mx-p-opis', bezUdovica(P.opis)));

      // 4. poziv "POČETAK" s crtom koja diše
      const dno = el('div', 'mx-p-dno');
      const gumb = el('button', 'mx-p-gumb');
      gumb.type = 'button';
      gumb.setAttribute('aria-label', 'Početak razgovora');
      gumb.appendChild(el('span', 'mx-p-gumb-tekst', P.tekstGumba || 'Početak'));
      const gumbCrta = el('span', 'mx-p-gumb-crta');
      gumbCrta.setAttribute('aria-hidden', 'true');
      gumb.appendChild(gumbCrta);
      dno.appendChild(gumb);

      korijen.appendChild(platno);
      korijen.appendChild(vrh);
      korijen.appendChild(scena);
      if (tekst.firstChild) korijen.appendChild(tekst);
      korijen.appendChild(dno);

      let otvoreno = false, izlazi = false;
      const anim = napraviAnimaciju(platno, prostor, {
        bezAnimacije: function () { korijen.classList.add('mx-p-bez-gl'); },
        podnaslov: function (da) { korijen.classList.toggle('mx-p-podnaslov-da', da); },
        mjere: function (ispod) { korijen.style.setProperty('--mx-p-ispod', ispod + 'px'); },
        otvoreno: function () { return otvoreno; }
      });

      const promatracVelicine = typeof ResizeObserver === 'function'
        ? new ResizeObserver(function () { anim.velicina(); })
        : null;
      if (promatracVelicine) promatracVelicine.observe(korijen);
      else window.addEventListener('resize', anim.velicina);

      if (P.nagibPremaMisu && MIS) {
        korijen.addEventListener('pointermove', function (e) {
          const r = korijen.getBoundingClientRect();
          anim.mis(sat((e.clientX - r.left) / r.width) * 2 - 1, sat((e.clientY - r.top) / r.height) * 2 - 1);
        });
        korijen.addEventListener('pointerleave', function () { anim.mis(0, 0); });
      }

      zatvori.addEventListener('click', radnje.zatvori);
      gumb.addEventListener('click', function (e) {
        if (izlazi) return;
        izlazi = true;
        radnje.pocetak(e.detail === 0);   // detail 0 = pritisnut tipkovnicom
      });

      // Chat se otvori u krugu koji se širi od gumba "Početak"
      function otvoriKrug(gotovo) {
        const r = korijen.getBoundingClientRect(), g = gumb.getBoundingClientRect();
        const x = g.left + g.width / 2 - r.left, y = g.top + g.height / 2 - r.top;
        const max = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) + 60;
        const trajanje = MIRNO.matches ? 350 : 950, kasni = MIRNO.matches ? 0 : 180;
        const pocetak = performance.now();
        (function korak(sad) {
          const t = sat((sad - pocetak - kasni) / trajanje);
          if (MIRNO.matches) korijen.style.opacity = String(1 - t);
          else {
            const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const rr = e * max;
            const maska = 'radial-gradient(circle at ' + x + 'px ' + y + 'px, transparent ' + Math.max(0, rr - 60) + 'px, #000 ' + rr + 'px)';
            korijen.style.webkitMaskImage = maska;
            korijen.style.maskImage = maska;
          }
          if (t < 1) requestAnimationFrame(korak);
          else gotovo();
        })(pocetak);
      }

      return {
        el: korijen,
        pripremi: anim.pripremi,
        otvoreno: function () { return otvoreno; },
        prikazi: function () {
          if (izlazi) return;
          otvoreno = true;
          korijen.classList.remove('mx-p-ulaz', 'mx-p-spremno', 'mx-p-podnaslov-da');
          void korijen.offsetWidth;                       // da se animacija pojave ponovi
          korijen.classList.add('mx-p-ulaz');
          anim.velicina();
          anim.ispocetka().then(function (ok) {
            if (ok && otvoreno) korijen.classList.add('mx-p-spremno');
          });
        },
        sakrij: function () {
          otvoreno = false;
          korijen.classList.remove('mx-p-ulaz');
          anim.stani();
        },
        izlaz: function (gotovo) {
          korijen.classList.add('mx-p-izlaz');
          let ostalo = 2;
          function jedno() { if (--ostalo === 0) gotovo(); }
          anim.izlaz(jedno);
          otvoriKrug(jedno);
        },
        unisti: function () {
          otvoreno = false;
          anim.unisti();
          if (promatracVelicine) promatracVelicine.disconnect();
          else window.removeEventListener('resize', anim.velicina);
          korijen.remove();
        }
      };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  VEZA S VOICEFLOWOM
    // ═══════════════════════════════════════════════════════════════════
    let pocetna = null;       // početni ekran, dok postoji
    let pokrenuto = false;    // "Početak" je pritisnut (u ovom učitavanju stranice)
    let otvoren = false;      // chat je otvoren
    let promatracProzora = null;

    function korijenChata() {
      const h = document.getElementById(HOST);
      return h && h.shadowRoot;
    }

    // Razgovor još nije krenuo: Voiceflow tada pokazuje svoj gumb za početak
    function cekaPocetak(kor) {
      const g = kor.querySelector(START);
      if (!g || !g.parentElement) return false;
      const s = getComputedStyle(g.parentElement);
      return s.pointerEvents !== 'none' && s.display !== 'none' && s.visibility !== 'hidden';
    }

    // Postoji li već razgovor (spremljen u pregledniku ili prikazan u prozoru).
    // Gleda se samo spremište koje Voiceflow koristi: stari razgovor iz
    // drugog spremišta Voiceflow ne učita (i sam ga obriše)
    function imaRazgovor(kor) {
      if (kor.querySelector(PROZOR + ' .vfrc-system-response, ' + PROZOR + ' .vfrc-user-response')) return true;
      try {
        const spremista = PAMCENJE === 'memory' ? []
          : PAMCENJE === 'sessionStorage' ? [window.sessionStorage]
          : PAMCENJE === 'localStorage' ? [window.localStorage]
          : [window.localStorage, window.sessionStorage];
        for (let s = 0; s < spremista.length; s++) {
          const sp = spremista[s];
          if (!sp) continue;
          for (let i = 0; i < sp.length; i++) {
            const kljuc = sp.key(i);
            if (!kljuc || kljuc.indexOf('voiceflow-session-') !== 0) continue;
            const sesija = JSON.parse(sp.getItem(kljuc) || 'null');
            if (sesija && Array.isArray(sesija.turns) && sesija.turns.length) return true;
          }
        }
      } catch (e) { /* spremište nedostupno: odlučuje prozor */ }
      return false;
    }

    function trebaPocetna(kor) {
      if (pokrenuto || !kor.querySelector(START)) return false;
      if (P.iKadRazgovorPostoji) return true;
      return cekaPocetak(kor) && !imaRazgovor(kor);
    }

    // Dijelovi chata ispod početnog ekrana: isključeni dok je on preko njih
    function iskljuciIspod(prozor, da) {
      Array.prototype.forEach.call(prozor.children, function (d) {
        if (pocetna && d === pocetna.el) return;
        if (da) { if (!d.hasAttribute('inert')) { d.setAttribute('inert', ''); d.setAttribute('data-mx-p-inert', ''); } }
        else if (d.hasAttribute('data-mx-p-inert')) { d.removeAttribute('inert'); d.removeAttribute('data-mx-p-inert'); }
      });
    }

    // Početni ekran mora biti u prozoru chata (ako ga Voiceflow iscrta
    // iznova, ekran se premjesti u novi prozor)
    function prikvaci(kor) {
      const prozor = kor.querySelector(PROZOR);
      if (!prozor || !pocetna) return false;
      if (pocetna.el.parentNode !== prozor) prozor.appendChild(pocetna.el);
      iskljuciIspod(prozor, true);
      if (!promatracProzora) {
        promatracProzora = new MutationObserver(function () {
          if (!pocetna) return;
          const p = kor.querySelector(PROZOR);
          if (p && (pocetna.el.parentNode !== p || p.querySelector(':scope > :not(.mx-p):not([inert])'))) prikvaci(kor);
        });
      }
      promatracProzora.disconnect();
      promatracProzora.observe(kor, { childList: true, subtree: true });
      return true;
    }

    function ukloni() {
      if (promatracProzora) promatracProzora.disconnect();
      if (!pocetna) return;
      const prozor = pocetna.el.parentNode;
      pocetna.unisti();
      pocetna = null;
      if (prozor) iskljuciIspod(prozor, false);
    }

    // Pritisak Voiceflowova gumba za početak → standardni početak razgovora
    function pokreniRazgovor(kor) {
      const g = kor && kor.querySelector(START);
      if (g && cekaPocetak(kor)) g.click();
    }

    function pocetak(tipkovnicom) {
      const kor = korijenChata();
      pokrenuto = true;
      if (kor) pokreniRazgovor(kor);
      if (!pocetna) return;
      pocetna.izlaz(function () {
        ukloni();
        // tko je krenuo tipkovnicom, nastavlja u polju za poruku (na mobitelu
        // se tipkovnica ne otvara sama)
        if (tipkovnicom && kor) {
          const polje = kor.querySelector(PROZOR + ' textarea, ' + PROZOR + ' input[type="text"]');
          if (polje) try { polje.focus({ preventScroll: true }); } catch (e) { /* nije bitno */ }
        }
      });
    }

    function zatvoriChat() {
      try { window.voiceflow.chat.close(); } catch (e) { /* nije bitno */ }
    }

    function napravi(kor) {
      if (pocetna) return pocetna;
      pocetna = napraviPocetnu({ pocetak: pocetak, zatvori: zatvoriChat });
      if (!prikvaci(kor)) { ukloni(); return null; }
      // oblici i WebGL se pripreme unaprijed, kad preglednik miruje
      const kasnije = window.requestIdleCallback || function (f) { return setTimeout(f, 1200); };
      kasnije(function () { if (pocetna) pocetna.pripremi(); }, { timeout: 2500 });
      return pocetna;
    }

    // Provjera stanja: pri pojavi prozora chata i pri svakom otvaranju
    function provjeri(priOtvaranju) {
      const kor = korijenChata();
      if (!kor || !kor.querySelector(PROZOR)) return;
      try {
        if (trebaPocetna(kor)) {
          if (!napravi(kor)) throw new Error('prozor chata nije pronađen');
          prikvaci(kor);
          if (priOtvaranju) pocetna.prikazi();
        } else if (pocetna && !pocetna.el.classList.contains('mx-p-izlaz')) {
          ukloni();
        }
      } catch (e) {
        // sigurnosna mreža: bez početnog ekrana chat radi kao prije
        console.warn('[Martimex] Početni ekran nije prikazan:', e);
        ukloni();
        pokrenuto = true;
        if (priOtvaranju) pokreniRazgovor(kor);
      }
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
        if (tip === 'voiceflow:open') {
          otvoren = true;
          provjeri(true);
        } else if (tip === 'voiceflow:close') {
          otvoren = false;
          const p = pocetna;
          // animacija staje kad se prozor spusti (Voiceflow ga spušta 0,3 s)
          if (p) setTimeout(function () { if (!otvoren && pocetna === p) p.sakrij(); }, 400);
        }
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

    // prozor chata se pojavi tek kad chat dobije svoje postavke s Voiceflowa
    function cekajProzor(korijen, gotovo) {
      if (korijen.querySelector(PROZOR) && korijen.querySelector(START)) { gotovo(); return; }
      const promatrac = new MutationObserver(function () {
        if (!korijen.querySelector(PROZOR) || !korijen.querySelector(START)) return;
        promatrac.disconnect();
        gotovo();
      });
      promatrac.observe(korijen, { childList: true, subtree: true });
    }

    function pokreni() {
      pratiOtvaranje();
      ubaciFontove();
      cekajHost(function (host) {
        const korijen = host.shadowRoot;
        ubaciStil(korijen);
        cekajProzor(korijen, function () { provjeri(otvoren); });
      });
      // Voiceflow više sam ne pokreće razgovor pri otvaranju chata (to radi
      // gumb "Početak") i pamti razgovor koliko je zadano u POSTAVKAMA;
      // loader.js ovo preda Voiceflowu
      const vf = window.MartimexVoiceflow = window.MartimexVoiceflow || {};
      vf.autostart = false;
      if (PAMCENJE) vf.assistant = Object.assign({}, vf.assistant, { persistence: PAMCENJE });
    }

    return { pokreni: pokreni };
  })();

  try { MX_POCETNA.pokreni(); }
  catch (e) { console.warn('[Martimex] Početni ekran chata nije pokrenut:', e); }

})();
