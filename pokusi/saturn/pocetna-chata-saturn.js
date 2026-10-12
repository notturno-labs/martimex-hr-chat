(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — početni ekran chata s Marti (v3)
  //
  //  POKUS "SATURN" (pokusi/saturn/): kopija pocetna-chata.js u kojoj se
  //  oko flakona kao Saturnov prsten vrti dvanaest malih bočica s
  //  pojasevima zlatne prašine (odjeljak SATURN i PRSTEN_VS; vidi
  //  pokusi/README.md). Na martimex.hr se ne učitava.
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
      flakon: 10.5,           // flakon po uzoru na Xerjoff 1861 (Naxos): nastane malo okrenut ulijevo i jednoliko se okreće
                              // (POKUS SATURN: duže, jer oko flakona nastane prsten bočica: oko 4 s nastanak, zatim kruženje)
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

    // POKUS SATURN: oko flakona se kao Saturnov prsten vrti dvanaest malih
    // bočica, s pojasevima zlatne prašine (false → flakon bez prstena)
    saturn: true,
    tocakaPrstena: 60000,         // računalo (malo više od pola su bočice, ostalo prašina)
    tocakaPrstenaMobitel: 34000,  // mobitel i tablet

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
    // (POKUS: ova skripta je u mapi pokusi/saturn/, a fontovi, logotipi i
    // Penhaligon bočice su u mapi repozitorija, dvije razine iznad)
    const BAZA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/pokusi/saturn/pocetna-chata-saturn.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '') + '../../';
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


    // ═══════════════════════════════════════════════════════════════════
    //  OBLICI — objekt, flakon i natpis od istog broja točkica, izračunati
    //  unaprijed (logotipi i Penhaligon bočice dolaze kasnije, vidi niže)
    //
    //  Točkice se u svakom obliku slažu u linije (prstenove oko objekta i
    //  flakona, vodoravne niti u slovima), a po linijama su gušće
    //  nego što su linije razmaknute: zato oblik izgleda kao da je satkan od
    //  tankih niti. Mjere su u "svjetskim jedinicama" (objekt ima polumjer 0,8).
    // ═══════════════════════════════════════════════════════════════════
    const OMJER = 2.3;             // koliko su točkice na liniji gušće nego razmak linija
    const SIRINA_NATPISA = 2.25;   // širina natpisa MARTIMEX (na uskom prozoru se smanji, vidi RUB_NATPISA)
    const RED_NATPISA = 0.0155;    // razmak među nitima u slovima (kao u natpisu "Marti")
    const RAZMAK_SLOVA = 0.14;     // razmak među slovima natpisa (udio veličine fonta)
    const TEZINA_NATPISA = 700;    // debljina Cormoranta u natpisu (masno, kao "Marti")
    const GUSTOCA_OBRUBA = 0.6;    // nit po vodoravnim rubovima slova (vidi natpis) prema nitima u slovu
    const RUB_NATPISA = 22;        // najmanji razmak natpisa od ruba prozora (px)
    const PASOVA = 48;             // oblici se spajaju u vodoravnim pojasevima (vidi spoji)
    const VELICINA_TOCKE = 17;     // brojeva po točkici u spremniku za grafičku karticu

    // Bočice (flakon i Penhaligon bočice) stoje od visine DNO do VRH
    const DNO_BOCICE = -0.86, VRH_BOCICE = 0.90;

    // Ponovljiv "slučajni" niz (isti oblik pri svakom učitavanju)
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

    // ── AI objekt: jedinična kugla od vodoravnih prstenova (šum je gužva
    //    tek u grafičkoj kartici, pa se ovdje sprema samo smjer točke)
    function kugla(n) {
      const K = Math.max(8, Math.round(Math.PI / Math.sqrt(4 * Math.PI * OMJER / n)));
      const duljine = [];
      for (let k = 0; k < K; k++) duljine.push(2 * Math.PI * Math.sin((k + 0.5) / K * Math.PI));
      const r = poLinijama(duljine, n);
      const poz = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const fi = (r.linija[i] + 0.5) / K * Math.PI;
        const th = (r.udio[i] + r.linija[i] * 0.618034) * 2 * Math.PI;   // prstenovi ne počinju u istoj točki
        poz[3 * i] = Math.sin(fi) * Math.cos(th);
        poz[3 * i + 1] = Math.cos(fi);
        poz[3 * i + 2] = Math.sin(fi) * Math.sin(th);
      }
      return { poz: poz };
    }

    // ── Flakon po uzoru na Xerjoff 1861 (Naxos): fasetirano tijelo, jednako
    //    široko sprijeda i sa strane (presjek je osmerokut: četiri široke
    //    plohe, tj. prednja, stražnja i bokovi, i između njih četiri kose
    //    fasete), koje se od zaobljenih ramena blago sužava prema dnu; zlatni
    //    prsten na grlu i zlatni čep kojemu se vrh straga uzdiže u šiljak
    //    (sprijeda izgleda kao šiljak, sa strane kao val izvijen naprijed). Na
    //    prednjoj plohi zlatna pločica u obliku trapeza (gore šira) s
    //    dvostrukim okvirom i znakom X. Mjere su izmjerene s fotografije
    //    bočice (u pikselima; bočica je na njoj visoka 695 px).
    const FLAKON_K = (VRH_BOCICE - DNO_BOCICE) / 695;   // piksel fotografije → svjetska jedinica
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
    // vrsta točke (4. broj uz mjesto na flakonu): staklo, zlato, pločica, znak/okvir, brid
    const STAKLO = 0, ZLATO = 1, PLOCICA = 2, SLOVO = 3, BRID = 4;
    // Znak X (Xerjoff) precrtan sa znaka: debeli potez sa šiljastim serifom
    // gore lijevo i repom koji se dolje desno produžuje i savija; tanki potez
    // prekinut na križanju, s vodoravnim serifima. Koordinate u okviru 495 × 709.
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

    function* flakon(n) {                       // generator: radi u koracima (vidi poKoracima)
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
      yield;
      L = linije(korak);
      yield;

      // točke se dijele po težini linija (linije znaka su 3 puta gušće)
      const r = poLinijama(L.map(function (l) { return l.tezina; }), n);
      const poz = new Float32Array(n * 3), nor = new Float32Array(n * 3), vrsta = new Float32Array(n);
      const e = 0.002;
      for (let i = 0; i < n; i++) {
        if (i % 4000 === 3999) yield;
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
        poz[3 * i] = x; poz[3 * i + 1] = y; poz[3 * i + 2] = z;
        nor[3 * i] = nx; nor[3 * i + 1] = ny; nor[3 * i + 2] = nz;
        vrsta[i] = m;
      }
      PRESJECI = {};                               // zapamćeni presjeci više ne trebaju
      return { poz: poz, nor: nor, vrsta: vrsta };
    }

    // ── Natpis: slova se nacrtaju u skriveno platno (svako zasebno, s
    //    razmakom među slovima i podrezivanjem parova), a točkice se slože
    //    u tanke vodoravne niti, kao u natpisu "Marti" i ostalim oblicima:
    //     - niti kroz slovo (razmak RED_NATPISA) idu do samog ruba slova, pa
    //       rub čine krajevi niti, kao na bočici; točkice su po niti
    //       nasumično, pa je nit zrnata, a ne puna crta
    //     - samo vodoravni rubovi (vrh i dno serifa, prečka slova T, krakovi
    //       slova E), koje niti ne mogu ocrtati, dobiju i tanku nit po rubu.
    //       Rub se nađe postupkom "marching squares" po prozirnosti platna
    //       (točnije od piksela) i poveže u zatvorene petlje
    //    Svaka točkica pamti mjesto (x, y) i kod: redni broj slova + udio, a
    //    udio (0..0,999) je visina niti u slovu (0 dno, 1 vrh): slovo se slaže
    //    odozdo prema gore. Sredine slova (x) idu posebno (uniforma uSredina).
    //    Priprema ide u dva koraka, da stranica ne zapne: natpis() nacrta
    //    slova i nađe im rub, a vrati funkciju koja (u idućem koraku) složi
    //    točkice
    const SLOVA_NATPISA = Math.max(1, Array.from(String(P.natpis || 'MARTIMEX')).length);
    function natpis(n) {
      const slova = Array.from(String(P.natpis || 'MARTIMEX'));
      const F = 220, PAD = 8, PRAG = 127.5;
      const font = TEZINA_NATPISA + ' ' + F + 'px ' + P.fontNatpisa;
      const c = document.createElement('canvas');
      let ctx = c.getContext('2d');
      if (!ctx || !slova.length) return null;
      ctx.font = font;
      // mjesto svakog slova: širina, razmak među slovima i podrezivanje
      // para (kerning), kakvo bi slova imala napisana zajedno
      function sirina(s) { return ctx.measureText(s).width; }
      const mj = [];
      let x0 = 0, gore = 0, dolje = 0;
      for (let i = 0; i < slova.length; i++) {
        const m = ctx.measureText(slova[i]);
        if (i) x0 += sirina(slova[i - 1] + slova[i]) - sirina(slova[i - 1]) - m.width;
        const ld = m.actualBoundingBoxLeft, dd = m.actualBoundingBoxRight;
        mj.push({ x: x0, l: x0 - (ld || 0), d: x0 + (dd === undefined ? m.width : dd) });
        gore = Math.max(gore, m.actualBoundingBoxAscent || F * 0.66);
        dolje = Math.max(dolje, m.actualBoundingBoxDescent || 0);
        x0 += m.width + RAZMAK_SLOVA * F;
      }
      let lijevo = Infinity, desno = -Infinity;
      mj.forEach(function (m) { if (m.d > m.l) { lijevo = Math.min(lijevo, m.l); desno = Math.max(desno, m.d); } });
      if (!(desno - lijevo > 10) || gore + dolje < 10) return null;
      const w = Math.ceil(desno - lijevo) + 2 * PAD, h = Math.ceil(gore + dolje) + 2 * PAD;
      c.width = w; c.height = h;
      ctx = c.getContext('2d');
      ctx.font = font;
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'alphabetic';
      const ox = PAD - lijevo, oy = PAD + gore;
      slova.forEach(function (s, i) { ctx.fillText(s, ox + mj[i].x, oy); });
      const px = ctx.getImageData(0, 0, w, h).data;
      const A = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) A[i] = px[4 * i + 3];
      function slovoNa(x) {                        // najbliže slovo mjestu x na platnu
        let naj = 0, min = Infinity;
        mj.forEach(function (m, i) {
          if (!(m.d > m.l)) return;
          const d = Math.max(ox + m.l - x, x - ox - m.d, 0);
          if (d < min) { min = d; naj = i; }
        });
        return naj;
      }

      // Rub slova: marching squares po prozirnosti (prag je pola), a dužine
      // se preko zajedničkih rubova ćelija povežu u zatvorene petlje
      const tockaRuba = new Map(), duzine = [];
      function presjek(i0, j0, i1, j1) {
        const a = A[j0 * w + i0], t = (PRAG - a) / (A[j1 * w + i1] - a);
        return [i0 + (i1 - i0) * t, j0 + (j1 - j0) * t];
      }
      for (let j = 0; j < h - 1; j++) {
        for (let i = 0; i < w - 1; i++) {
          const va = A[j * w + i], vb = A[j * w + i + 1], vc = A[(j + 1) * w + i + 1], vd = A[(j + 1) * w + i];
          const ua = va >= PRAG, ub = vb >= PRAG, uc = vc >= PRAG, ud = vd >= PRAG;
          if (ua === ub && ub === uc && uc === ud) continue;
          // rubovi ćelije: 0 gore (a–b), 1 desno (b–c), 2 dolje (d–c), 3 lijevo (a–d)
          const id = [2 * (j * w + i), 2 * (j * w + i + 1) + 1, 2 * ((j + 1) * w + i), 2 * (j * w + i) + 1];
          const sijece = [ua !== ub, ub !== uc, ud !== uc, ua !== ud];
          let parovi;
          if (sijece[0] && sijece[1] && sijece[2] && sijece[3]) {
            // sedlo: odlučuje sredina ćelije
            parovi = ua === ((va + vb + vc + vd) / 4 >= PRAG) ? [[0, 1], [2, 3]] : [[0, 3], [1, 2]];
          } else {
            parovi = [[]];
            for (let e = 0; e < 4; e++) if (sijece[e]) parovi[0].push(e);
          }
          for (let q = 0; q < parovi.length; q++) {
            for (let s = 0; s < 2; s++) {
              const e = parovi[q][s];
              if (tockaRuba.has(id[e])) continue;
              tockaRuba.set(id[e], e === 0 ? presjek(i, j, i + 1, j) : e === 1 ? presjek(i + 1, j, i + 1, j + 1)
                : e === 2 ? presjek(i, j + 1, i + 1, j + 1) : presjek(i, j, i, j + 1));
            }
            duzine.push(id[parovi[q][0]], id[parovi[q][1]]);
          }
        }
      }
      const nD = duzine.length / 2, poRubu = new Map();
      for (let s = 0; s < 2 * nD; s++) {
        const l = poRubu.get(duzine[s]);
        if (l) l.push(s >> 1); else poRubu.set(duzine[s], [s >> 1]);
      }
      const posjeceno = new Uint8Array(nD), petlje = [];
      for (let s0 = 0; s0 < nD; s0++) {
        if (posjeceno[s0]) continue;
        const put = [];
        let s = s0, e = duzine[2 * s0];
        while (!posjeceno[s]) {
          posjeceno[s] = 1;
          const t = tockaRuba.get(e);
          put.push(t[0], t[1]);
          e = duzine[2 * s] === e ? duzine[2 * s + 1] : duzine[2 * s];     // drugi kraj dužine
          const l = poRubu.get(e);
          s = l[0] === s && l.length > 1 ? l[1] : l[0];                    // susjedna dužina
        }
        const m = put.length / 2;
        if (m < 6) continue;
        // sve petlje idu u smjeru kazaljke na satu i počinju na vrhu petlje
        let povrsina = 0, vrh = 0, sx = 0;
        for (let q = 0; q < m; q++) {
          const r = (q + 1) % m;
          povrsina += put[2 * q] * put[2 * r + 1] - put[2 * r] * put[2 * q + 1];
          if (put[2 * q + 1] < put[2 * vrh + 1]) vrh = q;
          sx += put[2 * q];
        }
        const smjer = povrsina < 0 ? -1 : 1;
        const X = new Float32Array(m), Y = new Float32Array(m), D = new Float32Array(m + 1);
        for (let q = 0; q < m; q++) {
          const r = ((vrh + smjer * q) % m + m) % m;
          X[q] = put[2 * r]; Y[q] = put[2 * r + 1];
          if (q) D[q] = D[q - 1] + Math.hypot(X[q] - X[q - 1], Y[q] - Y[q - 1]);
        }
        D[m] = D[m - 1] + Math.hypot(X[0] - X[m - 1], Y[0] - Y[m - 1]);
        petlje.push({ X: X, Y: Y, D: D, duljina: D[m], slovo: slovoNa(sx / m) });
      }
      if (!petlje.length) return null;
      function naPetlji(pt, s) {                   // mjesto i smjer na putu s po petlji
        const m = pt.X.length;
        let lo = 0, hi = m;
        while (hi - lo > 1) { const q = (lo + hi) >> 1; if (pt.D[q] <= s) lo = q; else hi = q; }
        const b = (lo + 1) % m, dl = pt.D[lo + 1] - pt.D[lo], t = dl > 0 ? sat((s - pt.D[lo]) / dl) : 0;
        const tx = pt.X[b] - pt.X[lo], ty = pt.Y[b] - pt.Y[lo], tl = Math.hypot(tx, ty) || 1;
        return [lerp(pt.X[lo], pt.X[b], t), lerp(pt.Y[lo], pt.Y[b], t), tx / tl, ty / tl];
      }

      // drugi korak: točkice
      return function () {
        // svjetske mjere: natpis je širok SIRINA_NATPISA, sredina mu je u 0
        const k = SIRINA_NATPISA / (desno - lijevo);     // svjetske jedinice po pikselu platna
        const cx0 = PAD + (desno - lijevo) / 2, cy0 = PAD + (gore + dolje) / 2, dno = oy + dolje, visina = gore + dolje;
        const sredine = mj.map(function (m) { return (ox + (m.l + m.d) / 2 - cx0) * k; });

        // niti: vodoravni dijelovi redaka koji padaju u slova (krajevi
        // točnije od piksela)
        const korak = RED_NATPISA / k;
        const niti = [];
        for (let y = cy0 % korak + korak / 2; y < h - 1; y += korak) {
          const j = Math.round(y), red = j * w;
          let od = -1;
          for (let i = 1; i < w; i++) {
            const a = A[red + i - 1], b = A[red + i];
            if ((a >= PRAG) === (b >= PRAG)) continue;
            const x = i - 1 + (PRAG - a) / (b - a);                         // prijelaz preko praga
            if (b >= PRAG) od = x;
            else if (od >= 0) {
              if (x - od > 0.75) niti.push({ x0: od, x1: x, y: y, slovo: slovoNa((od + x) / 2) });
              od = -1;
            }
          }
        }
        // nit po rubu samo na vodoravnim dijelovima ruba (nagib do oko 20°)
        const rubovi = [];
        petlje.forEach(function (pt) {
          const m = pt.X.length;
          let poc = -1;
          for (let q = 0; q <= m; q++) {
            const a = q % m, b = (q + 1) % m;
            const tx = pt.X[b] - pt.X[a], ty = pt.Y[b] - pt.Y[a];
            const vodoravno = q < m && Math.abs(ty) < 0.34 * (Math.hypot(tx, ty) || 1);
            if (vodoravno && poc < 0) poc = q;
            if (!vodoravno && poc >= 0) {
              if (pt.D[q] - pt.D[poc] > korak / 2) rubovi.push({ pt: pt, d0: pt.D[poc], d1: pt.D[q] });
              poc = -1;
            }
          }
        });

        if (!niti.length && !rubovi.length) return null;              // (npr. samo razmaci)

        // točkice: po nitima nasumično, po rubovima jednoliko
        const duljine = niti.map(function (d) { return d.x1 - d.x0; })
          .concat(rubovi.map(function (r) { return (r.d1 - r.d0) * GUSTOCA_OBRUBA; }));
        const r = poLinijama(duljine, n), nN = niti.length, rnd = slucajno(4242);
        const poz = new Float32Array(n * 3);
        function upisi(i, x, y, slovo) {
          poz[3 * i] = (x - cx0) * k;
          poz[3 * i + 1] = (cy0 - y) * k;
          poz[3 * i + 2] = slovo + Math.min(0.999, Math.max(0, (dno - y) / visina));
        }
        for (let i = 0; i < n; i++) {
          const l = r.linija[i];
          if (l < nN) {
            const d = niti[l];
            upisi(i, lerp(d.x0, d.x1, rnd()), d.y, d.slovo);
          } else {
            const rb = rubovi[l - nN], t = naPetlji(rb.pt, lerp(rb.d0, rb.d1, r.udio[i]));
            upisi(i, t[0], t[1], rb.pt.slovo);
          }
        }
        return { poz: poz, pola: visina / 2 * k, slova: slova.length, sredine: sredine };
      };
    }

    // ── Spajanje: koja točkica objekta postaje koja točkica flakona i
    //    natpisa. Svi oblici podijele se na vodoravne pojaseve (gornji pojas
    //    objekta → gornji pojas flakona → gornji redci natpisa). Unutar pojasa
    //    objekt i flakon se spoje po kutu oko osi, a flakon i natpis slijeva
    //    nadesno. Tako svaka točkica putuje kratkim, glatkim putem i prijelaz
    //    izgleda kao da se jedan oblik prelije u drugi (slova natpisa se ipak
    //    slažu jedno za drugim: to radi shader, po rednom broju slova).
    //    Rezultat: po točkici 17 brojeva (objekt, natpis s kodom, 4 slučajna
    //    broja, flakon s vrstom točke, normala flakona), redom kako ih čita
    //    grafička kartica, i redX: za svaki pojas mjesta točkica poredana po x
    //    flakona (kao slova natpisa), po kojem se kasnije slože i logotipi i
    //    Penhaligon bočice (vidi markeKoraci i penhaligonKoraci).
    function* spoji(kug, fla, nat, n, rnd) {      // generator: radi u koracima (vidi poKoracima)
      function poVisini(poz) {
        const idx = new Array(n);
        for (let i = 0; i < n; i++) idx[i] = i;
        return idx.sort(function (a, b) { return poz[3 * b + 1] - poz[3 * a + 1]; });
      }
      function kutovi(poz) {
        const k = new Float32Array(n);
        for (let i = 0; i < n; i++) k[i] = Math.atan2(poz[3 * i + 2], poz[3 * i]);
        return k;
      }
      const iK = poVisini(kug.poz);
      yield;
      const iF = poVisini(fla.poz);
      yield;
      const iN = poVisini(nat.poz);
      yield;
      const kutK = kutovi(kug.poz), kutF = kutovi(fla.poz);
      yield;
      const natZaFla = new Int32Array(n), mjestoFla = new Int32Array(n), redX = new Int32Array(n);
      const out = new Float32Array(n * VELICINA_TOCKE);
      for (let p = 0; p < PASOVA; p++) {
        const lo = Math.floor(p * n / PASOVA), hi = Math.floor((p + 1) * n / PASOVA);
        const pK = iK.slice(lo, hi).sort(function (a, b) { return kutK[a] - kutK[b]; });
        const pFk = iF.slice(lo, hi).sort(function (a, b) { return kutF[a] - kutF[b]; });
        const pFx = iF.slice(lo, hi).sort(function (a, b) { return fla.poz[3 * a] - fla.poz[3 * b]; });
        const pN = iN.slice(lo, hi).sort(function (a, b) { return nat.poz[3 * a] - nat.poz[3 * b]; });
        for (let j = 0; j < pFx.length; j++) natZaFla[pFx[j]] = pN[j];
        for (let j = 0; j < pFk.length; j++) {
          const fi = pFk[j], ki = pK[j], ni = natZaFla[fi], o = (lo + j) * VELICINA_TOCKE;
          out[o] = kug.poz[3 * ki]; out[o + 1] = kug.poz[3 * ki + 1]; out[o + 2] = kug.poz[3 * ki + 2];
          out[o + 3] = nat.poz[3 * ni]; out[o + 4] = nat.poz[3 * ni + 1]; out[o + 5] = nat.poz[3 * ni + 2];
          out[o + 6] = rnd(); out[o + 7] = rnd(); out[o + 8] = rnd(); out[o + 9] = rnd();
          out[o + 10] = fla.poz[3 * fi]; out[o + 11] = fla.poz[3 * fi + 1]; out[o + 12] = fla.poz[3 * fi + 2]; out[o + 13] = fla.vrsta[fi];
          out[o + 14] = fla.nor[3 * fi]; out[o + 15] = fla.nor[3 * fi + 1]; out[o + 16] = fla.nor[3 * fi + 2];
          mjestoFla[fi] = lo + j;
        }
        for (let j = 0; j < pFx.length; j++) redX[lo + j] = mjestoFla[pFx[j]];
        if (p % 6 === 5) yield;
      }
      return { podaci: out, redX: redX };
    }

    // Priprema ide u manjim koracima s pauzama, da stranica nijednom ne
    // zapne; dok je chat otvoren (HITNO), pauze su najkraće moguće
    let HITNO = false;
    function pauza() {
      return new Promise(function (gotovo) {
        if (!HITNO && window.requestIdleCallback) window.requestIdleCallback(function () { gotovo(); }, { timeout: 400 });
        else setTimeout(gotovo, 0);
      });
    }

    // Generator (veći oblici, spajanje) u koracima: koraci dok ne prođe 8 ms,
    // pa pauza
    function poKoracima(gen) {
      return new Promise(function (gotovo, greska) {
        (function dio() {
          const kraj = performance.now() + 8;
          try {
            for (;;) {
              const r = gen.next();
              if (r.done) { gotovo(r.value); return; }
              if (performance.now() > kraj) break;
            }
          } catch (e) { greska(e); return; }
          pauza().then(dio);
        })();
      });
    }

    // Oblici se računaju jednom (i čekaju font natpisa, najviše 2,5 s)
    let OBLICI = null;
    function pripremiOblike() {
      if (OBLICI) return OBLICI;
      const font = document.fonts && document.fonts.load
        ? Promise.race([
            document.fonts.load(TEZINA_NATPISA + ' 100px ' + P.fontNatpisa, P.natpis).catch(function () {}),
            new Promise(function (r) { setTimeout(r, 2500); })
          ])
        : Promise.resolve();
      const o = { n: Math.max(2000, Math.round(+(MOBITEL ? P.tocakaMobitel : P.tocaka) || 16000)), rnd: slucajno(20251) };
      OBLICI = font.then(pauza).then(function () {
        o.slozi = natpis(o.n);                // slova i njihov rub; točkice u idućem koraku
        return pauza();
      }).then(function () {
        o.kug = kugla(o.n);
        o.nat = (o.slozi && o.slozi()) || rezervniNatpis(o.kug.poz, o.n);
        o.slozi = null;
        return pauza();
      }).then(function () {
        return poKoracima(flakon(o.n));
      }).then(function (fla) {
        o.fla = fla;
        return pauza();
      }).then(function () {
        return poKoracima(spoji(o.kug, o.fla, o.nat, o.n, o.rnd));
      }).then(function (sp) {
        return { podaci: sp.podaci, redX: sp.redX, n: o.n, pola: o.nat.pola, slova: o.nat.slova, sredine: o.nat.sredine };
      });
      return OBLICI;
    }
    // ako se slova ne mogu nacrtati (nema 2D platna): umjesto natpisa
    // spljoštena kugla, sve točkice u jednom "slovu"
    function rezervniNatpis(kug, n) {
      const poz = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        poz[3 * i] = kug[3 * i] * 0.6;
        poz[3 * i + 1] = kug[3 * i + 1] * 0.6;
      }
      return { poz: poz, pola: 0.6, slova: 1, sredine: [0] };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  MARKE — logotipi parfemskih kuća (podaci: marke/marke.js)
    //
    //  marke.js (izrađen skriptom marke/izradi.py iz slike marke/izvor.webp)
    //  sadrži sivu sliku logotipa (bijelo na crnom) i okvir svakog logotipa.
    //  Učita se tek kad su ostali oblici gotovi; točkice se rasporede po
    //  logotipima razmjerno njihovoj površini, a u logotipu prema svjetlini
    //  piksela (gusto, red po red, pa je logotip pun i oštar kao na slici).
    //  Zid logotipa je širok kao natpis MARTIMEX, a raspored je kao na slici
    //  (tri stupca). Redovi se dijele na stranice od MAR_REDOVA redova: u
    //  prostoru animacije vidi se jedna stranica, a zid se između stranica
    //  pomakne prema gore.
    //  Točkica ima mjesto u zidu (x, y; y = 0 je vrh zida), red svog logotipa
    //  na stranici (0 prvi .. 1 zadnji: logotipi se slažu jedan za drugim) i
    //  udio u logotipu (0..1: logotip se slaže slijeva nadesno), u vlastitom
    //  spremniku (atribut aMar) koji se doda kad su logotipi gotovi.
    // ═══════════════════════════════════════════════════════════════════
    const MAR_REDOVA = 4;          // redova logotipa na jednoj stranici
    const MAR_RUB = 0.12;          // rub prostora u kojem se logotipi rastapaju u izmaglicu (svjetske jedinice)

    // Podaci i slika logotipa (jednom); null ako ih nema
    let MAR_SLIKA = null;
    function ucitajMarke() {
      if (MAR_SLIKA) return MAR_SLIKA;
      const v = '?v=' + Math.floor(Date.now() / 60000);
      MAR_SLIKA = (window.MX_MARKE ? Promise.resolve(true) : ucitajSkriptu(BAZA + 'marke/marke.js' + v)).then(function () {
        const M = window.MX_MARKE;
        if (!M || !M.slika || !M.logotipi || !M.logotipi.length) return null;
        const slika = new Image();
        slika.src = M.slika;
        return (slika.decode ? slika.decode() : new Promise(function (ok, ne) { slika.onload = ok; slika.onerror = ne; }))
          .then(function () { return { M: M, slika: slika }; });
      }).catch(function () { return null; });
      return MAR_SLIKA;
    }

    // Gradnja zida logotipa (generator): n točkica u redoslijedu mjesta u
    // spremniku. Točkice se podijele na iste vodoravne pojaseve kao u spoji
    // (po visini na svojoj stranici, odozgo), a u pojasu slijeva nadesno dođu
    // na mjesta istim redom po x kao slova natpisa (redX): svaka stranica se
    // zato u natpis i Penhaligon bočice prelije kratkim putem
    function* markeKoraci(n, redX, M, slika) {
      const L = M.logotipi;
      const platno = document.createElement('canvas');
      platno.width = M.sirina; platno.height = M.visina;
      const ctx = platno.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(slika, 0, 0);
      yield;

      // mjerilo: zid je širok kao natpis, sredina mu je u x = 0, vrh u y = 0
      let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, redova = 0;
      L.forEach(function (l) { X0 = Math.min(X0, l[3]); X1 = Math.max(X1, l[3] + l[5]); Y0 = Math.min(Y0, l[4]); redova = Math.max(redova, l[1] + 1); });
      const k = SIRINA_NATPISA / Math.max(1, X1 - X0), cx = (X0 + X1) / 2;
      // stranice: sredina i pola visine (svjetske jedinice), redni broj logotipa na stranici
      const stranica = function (l) { return Math.floor(l[1] / MAR_REDOVA); };
      const brojStranica = Math.ceil(redova / MAR_REDOVA);
      const stranice = [];
      for (let j = 0; j < brojStranica; j++) {
        const na = L.filter(function (l) { return stranica(l) === j; });
        const vrh = Math.min.apply(null, na.map(function (l) { return l[4]; }));
        const dno = Math.max.apply(null, na.map(function (l) { return l[4] + l[6]; }));
        stranice.push({ sredina: -((vrh + dno) / 2 - Y0) * k, pola: (dno - vrh) / 2 * k, vrh: -(vrh - Y0) * k, logotipa: na.length });
      }
      const redNaStranici = L.map(function (l, i) {
        return L.filter(function (m, q) { return stranica(m) === stranica(l) && (m[1] < l[1] || (m[1] === l[1] && (m[2] < l[2] || (m[2] === l[2] && q < i)))); }).length;
      });

      // 1. svjetlina piksela svakog logotipa (0..1) i njihov zbroj
      const tez = [], zbroj = [];
      let ukupno = 0;
      for (let i = 0; i < L.length; i++) {
        const l = L[i], d = ctx.getImageData(l[3], l[4], l[5], l[6]).data, w = new Float32Array(l[5] * l[6]);
        let z = 0;
        for (let q = 0; q < w.length; q++) { w[q] = d[4 * q] / 255; z += w[q]; }
        tez.push(w); zbroj.push(z); ukupno += z;
        yield;
      }
      if (!(ukupno > 0)) return null;

      // 2. točkice: logotipu razmjerno zbroju svjetline, a u logotipu po
      //    pikselima (red po red) razmjerno svjetlini, s malim pomakom unutar piksela
      const poz = new Float32Array(n * 2), kod = new Float32Array(n * 2), kljuc = new Float32Array(n);
      const rnd = slucajno(1861);
      let od = 0, prije = 0;
      for (let i = 0; i < L.length; i++) {
        const l = L[i], w = tez[i], s = stranice[stranica(l)];
        const doN = Math.round(n * (prije + zbroj[i]) / ukupno), m = doN - od;
        prije += zbroj[i];
        const red = s.logotipa > 1 ? redNaStranici[i] / (s.logotipa - 1) : 0;
        let q = 0, acc = 0;
        for (let d = 0; d < m; d++) {
          const cilj = (d + 0.5 + 0.8 * (rnd() - 0.5)) * zbroj[i] / m;
          while (q < w.length - 1 && acc + w[q] < cilj) { acc += w[q]; q++; }
          const u = q % l[5], v = Math.floor(q / l[5]), j = od + d;
          const x = (l[3] + u + rnd() - cx) * k, y = -(l[4] + v + rnd() - Y0) * k;
          poz[2 * j] = x; poz[2 * j + 1] = y;
          kod[2 * j] = red;
          kod[2 * j + 1] = sat(0.85 * (u + 0.5) / l[5] + 0.15 * (1 - (v + 0.5) / l[6]));   // slijeva nadesno, malo i odozdo
          kljuc[j] = y - s.vrh;
          if (d % 3000 === 2999) yield;
        }
        od = doN;
        yield;
      }

      // 3. pojasevi po visini na stranici, odozgo (kao poVisini u spoji), u
      //    pojasu slijeva nadesno na mjesta redX
      const poVisini = poredak(function (i) { return -kljuc[i]; }, n, 0, n);
      yield;
      const out = new Float32Array(n * 4);
      for (let p = 0; p < PASOVA; p++) {
        const lo = Math.floor(p * n / PASOVA), hi = Math.floor((p + 1) * n / PASOVA);
        const uPojasu = poredak(function (i) { return poz[2 * poVisini[i]]; }, n, lo, hi);
        for (let j = 0; j < uPojasu.length; j++) {
          const t = poVisini[uPojasu[j]], o = 4 * redX[lo + j];
          out[o] = poz[2 * t]; out[o + 1] = poz[2 * t + 1]; out[o + 2] = kod[2 * t]; out[o + 3] = kod[2 * t + 1];
        }
        if (p % 8 === 7) yield;
      }
      // tinta: površina logotipa (svjetske jedinice², zid u punoj veličini), za jačinu točkica
      return { podaci: out, stranice: stranice, tinta: ukupno * k * k };
    }

    // Logotipi za zadane oblike (jednom); null ako nisu dostupni.
    // Kad se početni ekran ukloni (ukloni), gradnja se prekine (MAR_PREKID)
    let MAR_OBLIK = null, MAR_PREKID = null;
    function pripremiMarke(oblici) {
      if (MAR_OBLIK) return MAR_OBLIK;
      const prekid = MAR_PREKID = { da: false };
      MAR_OBLIK = ucitajMarke().then(function (mm) {
        if (!mm || prekid.da) return null;
        return izvrsiPostupno(markeKoraci(oblici.n, oblici.redX, mm.M, mm.slika), function () { return prekid.da; });
      }).catch(function (e) {
        console.warn('[Martimex] Početni ekran bez logotipa:', e);
        return null;
      });
      return MAR_OBLIK;
    }


    // ═══════════════════════════════════════════════════════════════════
    //  PENHALIGON'S PORTRAITS — pet bočica (modeli: mapa penhaligons/)
    //
    //  Modeli (shared.js i glave/<id>.js) učitaju se iz mape penhaligons/
    //  tek kad su ostali oblici gotovi. Svaka bočica gradi se u malim
    //  koracima (PEN.bocicaKoraci: jedan rez glave ili nekoliko stotina
    //  točkica), a koraci se rasporede po stankama preglednika, pa stranica
    //  ni tada ne zapne. Točkica ima mjesto u svojoj bočici (xyz, svjetske
    //  jedinice bočice u punoj veličini, y = 0 je dno; bočica se u shaderu
    //  okrene, smanji i postavi na svoje mjesto, vidi PEN_RASPORED) i kod u
    //  jednom broju: vrsta (0 staklo, 1 prozirno dno, 2 zlato, 3 etiketa) +
    //  4 × redni broj bočice, te normala (oktaedarski, 2 × 8 bitova):
    //  kod · 65536 + nx · 256 + ny.
    //  Bočice imaju više točkica nego ostali oblici (P.tocakaBocica): dio
    //  (n, kao svaki oblik) je u glavnom spremniku i u bočice dolazi iz
    //  izmaglice, a ostatak je u zasebnom, gustom sloju koji se crta samo dok
    //  su bočice na ekranu: pojavi se na mjestu kad onamo sjednu točkice
    //  glavnog sloja, i nestane kad se one rastope. Tako su bočice jasne i
    //  oštre, a ostali oblici ostaju kakvi jesu.
    // ═══════════════════════════════════════════════════════════════════
    const PEN_IDS = ['lady-blanche', 'mr-sam', 'lord-george', 'duchess-rose', 'changing-constance'];
    const PEN_K = 1.76 / 684;            // piksel fotografije → svjetska jedinica u punoj veličini (bočica s jelenom, 684 px, visoka kao flakon)
    const PEN_DNO = -0.80;               // sve bočice stoje na istoj visini (s nagibom prema nama dno dođe kao dno flakona)
    // Raspored u obliku slova V, kao na reklamnoj fotografiji: u sredini
    // sprijeda najveća bočica (Lord George, jelen), do nje malo iza i manje,
    // a vanjske najdalje i najmanje; sve su malo okrenute prema sredini, a
    // između bočica je jednak razmak. Za svaku bočicu (redom kao PEN_IDS):
    // [x, z (prema nama), veličina (1 = kao flakon), okret oko osi (rad;
    // − = licem udesno, prema sredini)]
    const PEN_RASPORED = [
      [-1.00, -0.26, 0.76, -0.28],     // Lady Blanche (pantera)
      [-0.52,  0.00, 0.84, -0.15],     // Mr Sam (bik)
      [ 0.00,  0.26, 0.95,  0.00],     // Lord George (jelen)
      [ 0.52,  0.00, 0.84,  0.15],     // Duchess Rose (lisica)
      [ 1.00, -0.26, 0.76,  0.28]      // Changing Constance (gazela)
    ];
    // dodatni okret same glave (rad, kao okret bočice), da se životinja vidi
    // iz najprepoznatljivijeg kuta; redom kao PEN_IDS
    const PEN_GLAVA = [0.5, 0.9, 0, -0.5, -0.7];   // pantera u tri četvrtine (oba uha), bik s rogovima i njuškom, lisica s njuškom, gazela postrance (zakrivljeni rogovi)
    // razmak niti svake bočice uz 26 000 točkica (izmjeren u PEN.bocica); kvadrat
    // je razmjeran površini bočice (jelen je najveći): po njemu (i veličini
    // bočice u rasporedu) se dijele točkice, a gradnja ne mora sama mjeriti površinu
    const PEN_KORAK = [4.806, 4.785, 5.033, 4.705, 4.830];
    const PEN_POVRSINA = PEN_KORAK.map(function (k, b) { return k * k * PEN_RASPORED[b][2] * PEN_RASPORED[b][2]; });

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

    // Modeli i pisma etikete; true kad je sve tu
    let PEN_MODELI = null;
    function ucitajPenhaligon() {
      if (PEN_MODELI) return PEN_MODELI;
      function imaSve() {
        const M = window.PEN;
        return !!(M && M.bocicaKoraci && M.glave && PEN_IDS.every(function (id) { return M.glave[id]; }));
      }
      const v = '?v=' + Math.floor(Date.now() / 60000);
      PEN_MODELI = (imaSve() ? Promise.resolve() : ucitajSkriptu(BAZA + 'penhaligons/shared.js' + v).then(function (ok) {
        if (!ok || !window.PEN) return;
        return Promise.all(PEN_IDS.map(function (id) {
          return window.PEN.glave && window.PEN.glave[id] ? true : ucitajSkriptu(BAZA + 'penhaligons/glave/' + id + '.js' + v);
        }));
      })).then(function () {
        if (!imaSve()) return false;
        // etiketa se crta pismima iz mape fonts/ (čeka se najviše 2,5 s)
        const f = window.PEN.FONTOVI_ETIKETE || [];
        return (document.fonts && document.fonts.load
          ? Promise.race([
              Promise.all(f.map(function (x) { return document.fonts.load(x, 'PORTRAITS').catch(function () {}); })),
              new Promise(function (r) { setTimeout(r, 2500); })
            ])
          : Promise.resolve()).then(function () { return true; });
      }).catch(function () { return false; });
      return PEN_MODELI;
    }

    // normala → dva broja (oktaedarski zapis), oba od -1 do 1
    function oktaedar(x, y, z) {
      const s = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
      let u = x / s, v = y / s;
      if (z < 0) { const u0 = u; u = (1 - Math.abs(v)) * (u0 >= 0 ? 1 : -1); v = (1 - Math.abs(u0)) * (v >= 0 ? 1 : -1); }
      return [u, v];
    }

    // Poredak po broju (bez funkcije usporedbe, brzo): ključ = vrijednost
    // zaokružena na cijeli broj · B + indeks (B je potencija broja 2 veća od
    // broja indeksa, a ključ ostaje točan cijeli broj); vraća indekse od..do
    // poredane po vrijednosti
    function poredak(vrijednost, n, od, do_) {
      const m = do_ - od, k = new Float64Array(m), B = Math.pow(2, Math.ceil(Math.log2(m + 1)));
      let min = Infinity, max = -Infinity;
      for (let i = 0; i < m; i++) { const v = vrijednost(od + i); if (v < min) min = v; if (v > max) max = v; }
      const mj = Math.min(1e6, Math.pow(2, 52) / B) / Math.max(1e-9, max - min);
      for (let i = 0; i < m; i++) k[i] = Math.floor((vrijednost(od + i) - min) * mj) * B + i;
      k.sort();
      const out = new Int32Array(m);
      for (let i = 0; i < m; i++) out[i] = od + k[i] % B;
      return out;
    }

    // Gradnja svih pet bočica (generator): ukupno točkica, od kojih n ide u
    // glavni spremnik (u redoslijedu mjesta), a ostatak u gusti sloj. Točkice
    // svake bočice podijele se ravnomjerno (svaka k-ta po nitima ide u glavni
    // spremnik). Točkice glavnog spremnika podijele se na iste vodoravne
    // pojaseve kao u spoji (po visini u rasporedu, odozgo), a u pojasu slijeva
    // nadesno dođu na mjesta istim redom po x kao slova natpisa (redX):
    // prijelaz u natpis je zato kratak
    function* penhaligonKoraci(n, redX, ukupno) {
      const M = window.PEN, NB = PEN_IDS.length, NT = Math.max(n, Math.round(ukupno) || n);
      const zbroj = PEN_POVRSINA.reduce(function (z, a) { return z + a; }, 0);
      const poz = new Float32Array(n * 3), kod = new Float64Array(n), bocica = new Uint8Array(n);
      const gusti = new Float32Array((NT - n) * 8), rnd = slucajno(684);
      let odT = 0, odN = 0, g = 0, prije = 0;
      function zapis(r, i, b) {
        const q = oktaedar(r.nor[3 * i], r.nor[3 * i + 1], r.nor[3 * i + 2]);
        return (r.vrsta[i] + 4 * b) * 65536 + Math.round((q[0] * 0.5 + 0.5) * 255) * 256 + Math.round((q[1] * 0.5 + 0.5) * 255);
      }
      for (let b = 0; b < NB; b++) {
        prije += PEN_POVRSINA[b];
        const doT = b === NB - 1 ? NT : Math.round(NT * prije / zbroj), doN = b === NB - 1 ? n : Math.round(n * prije / zbroj);
        const m = doT - odT, mn = doN - odN;
        // mreža rezova glave prema gustoći (kad je točkica malo, dovoljna je grublja)
        const korak = PEN_KORAK[b] * Math.sqrt(26000 / Math.max(500, m));
        // etiketa u retcima malo gušćim od niti stakla i s manje točkica, da
        // bude miran dio bočice, a ne blještava bijela ploha
        // (rezovi glave malo rjeđi nego prije, gotovo kao niti stakla: glava je
        // tada od niti kao čep flakona, a ne od sitnog "šljokičastog" zrnja)
        const r = yield* M.bocicaKoraci(PEN_IDS[b], m, { korak: korak, h: Math.max(1.2, korak * 0.28), redEtikete: Math.max(1.6, korak * 0.55), tezinaEtikete: 1.1, gustocaGlave: 0.85 });
        // točkice etikete su u pravilnim retcima; malo raspršene vodoravno, da
        // se na zakrivljenoj etiketi ne slože u valovite pruge (moiré)
        const raspr = function (i) { return r.vrsta[i] === 3 ? (rnd() - 0.5) * 0.7 : 0; };
        for (let i = 0; i < m; i++) {
          if (Math.floor((i + 1) * mn / m) > Math.floor(i * mn / m)) {
            const j = odN++;
            poz[3 * j] = (r.poz[3 * i] + raspr(i)) * PEN_K; poz[3 * j + 1] = r.poz[3 * i + 1] * PEN_K; poz[3 * j + 2] = r.poz[3 * i + 2] * PEN_K;
            kod[j] = zapis(r, i, b);
            bocica[j] = b;
          } else {
            const o = 8 * g++;
            gusti[o] = (r.poz[3 * i] + raspr(i)) * PEN_K; gusti[o + 1] = r.poz[3 * i + 1] * PEN_K; gusti[o + 2] = r.poz[3 * i + 2] * PEN_K;
            gusti[o + 3] = zapis(r, i, b);
            gusti[o + 4] = rnd(); gusti[o + 5] = rnd(); gusti[o + 6] = rnd(); gusti[o + 7] = rnd();
          }
          if (i % 4000 === 3999) yield;
        }
        odT = doT;
        yield;
      }
      // mjesto u rasporedu (bez okreta): po tome se točkice dijele na pojaseve
      function x(i) { const R = PEN_RASPORED[bocica[i]]; return R[0] + poz[3 * i] * R[2]; }
      function y(i) { return PEN_DNO + poz[3 * i + 1] * PEN_RASPORED[bocica[i]][2]; }
      // pojasevi po visini, odozgo (kao poVisini u spoji)
      const poVisini = poredak(function (i) { return -y(i); }, n, 0, n);
      yield;
      const out = new Float32Array(n * 4);
      for (let p = 0; p < PASOVA; p++) {
        const lo = Math.floor(p * n / PASOVA), hi = Math.floor((p + 1) * n / PASOVA);
        const uPojasu = poredak(function (i) { return x(poVisini[i]); }, n, lo, hi);
        for (let j = 0; j < uPojasu.length; j++) {
          const t = poVisini[uPojasu[j]], o = 4 * redX[lo + j];
          out[o] = poz[3 * t]; out[o + 1] = poz[3 * t + 1]; out[o + 2] = poz[3 * t + 2]; out[o + 3] = kod[t];
        }
        if (p % 8 === 7) yield;
      }
      return { podaci: out, gusti: gusti.subarray(0, 8 * g), brojGustih: g, ukupno: n + g };
    }

    // Generator se izvršava u stankama preglednika: koraci dok ima vremena
    // (najviše 8 ms zaredom), pa stanka; tako ni dok se animacija vrti ne zapne.
    // prekid() = true: posao se prekine (vrati se null)
    function izvrsiPostupno(gen, prekid) {
      const cekaj = window.requestIdleCallback
        ? function (f) { window.requestIdleCallback(f, { timeout: 250 }); }
        : function (f) { setTimeout(f, 16); };
      return new Promise(function (gotovo, greska) {
        function dio(rok) {
          const kraj = performance.now() + 8;
          try {
            for (;;) {
              if (prekid && prekid()) { gotovo(null); return; }
              const r = gen.next();
              if (r.done) { gotovo(r.value); return; }
              if (performance.now() > kraj || (rok && rok.timeRemaining && !rok.didTimeout && rok.timeRemaining() < 1)) break;
            }
          } catch (e) { greska(e); return; }
          cekaj(dio);
        }
        cekaj(dio);
      });
    }

    // Penhaligon bočice za zadane oblike (jednom); null ako nisu dostupne.
    // Kad se početni ekran ukloni (ukloni), gradnja se prekine (PEN_PREKID)
    let PEN_OBLIK = null, PEN_PREKID = null;
    function pripremiPenhaligon(oblici) {
      if (PEN_OBLIK) return PEN_OBLIK;
      const prekid = PEN_PREKID = { da: false };
      PEN_OBLIK = ucitajPenhaligon().then(function (ok) {
        if (!ok || prekid.da) return null;
        const ukupno = +(MOBITEL ? P.tocakaBocicaMobitel : P.tocakaBocica) || oblici.n;
        return izvrsiPostupno(penhaligonKoraci(oblici.n, oblici.redX, ukupno), function () { return prekid.da; }).then(function (pp) {
          if (!pp) return null;
          const gore = new Float32Array(15), dolje = new Float32Array(15);
          PEN_IDS.forEach(function (id, i) {
            const st = window.PEN.glave[id].staklo || ['#888888', '#cccccc'];
            gore.set(zasiti(boja01(st[0]), 1.45), 3 * i);
            dolje.set(zasiti(boja01(st[1]), 1.45), 3 * i);
          });
          pp.gore = gore; pp.dolje = dolje;
          return pp;
        });
      }).catch(function (e) {
        console.warn('[Martimex] Početni ekran bez Penhaligon bočica:', e);
        return null;
      });
      return PEN_OBLIK;
    }


    // ═══════════════════════════════════════════════════════════════════
    //  SATURN (POKUS) — prsten malih bočica oko flakona
    //
    //  Dok se flakon okreće, oko njega se kao Saturnov prsten vrti dvanaest
    //  malih bočica šest oblika (mali flakon, okrugla, četvrtasta, kap,
    //  amfora sa zlatnim prstenovima na vratu, valjak s okruglim čepom), s
    //  tekućinama različitih boja. Između njih i flakona su tanki pojasevi
    //  zlatne prašine, kao Saturnovi prstenovi (s tamnom pukotinom), a izvan
    //  staze bočica još jedan tanki prsten. Prsten je nagnut prema nama
    //  (gledamo ga malo odozgo) i malo zakrenut (desna strana viša), kao na
    //  slici Saturna. Bočice stoje uspravno, svaka se polako okreće oko svoje
    //  osi i lagano njiše; prašina bliže flakonu kruži brže (kao pravi
    //  prsten). Iza flakona se prsten tek nazire kroz staklo; flakon baca
    //  sjenu na prsten, a prsten na flakon.
    //  Nastanak: kad se flakon složi, iz njegova "ekvatora" se spiralom
    //  odvije zlatna prašina u prsten, a iz prašine se bočice jedna za drugom
    //  zgusnu (staklo se puni odozdo, čep zadnji) i kratko zasvijetle.
    //  Rastapanje: kad se flakon rastapa, bočice se (odozgo) rasprše u
    //  prašinu koja odleti niz stazu, a prsten se raširi i izblijedi.
    //  Prsten je zaseban sloj (vlastiti spremnik i program), crta se samo dok
    //  je flakon na ekranu, pa ostali oblici ostaju kakvi jesu.
    // ═══════════════════════════════════════════════════════════════════
    const PRSTEN_Y = -0.06;          // visina sredine prstena (flakon je od -0,86 do 0,9; najširi je na -0,03)
    const PRSTEN_NAGIB = 0.30;       // prsten je nagnut prema nama: gledamo ga malo odozgo (oko 17°)
    const PRSTEN_VALJANJE = 0.12;    // ... i malo zakrenut, desna strana viša (oko 7°)
    const PRSTEN_BRZINA = 0.30;      // kutna brzina bočica na stazi (rad/s)
    const PRSTEN_RUB = 1.15;         // vanjski rub prstena (udio polumjera staze bočica); prsten uvijek stane u prozor
    const OMJER_MINI = 2.3;          // kao OMJER: točkice na niti gušće od razmaka niti
    // Pojasevi prašine (udio polumjera staze bočica): od, do, jačina,
    // nijansa (0 srebro, 0,5 puder, 1 zlato)
    const PRSTEN_POJASEVI = [
      [0.50, 0.60, 0.30, 0.15],      // unutarnji, blijedi (kao Saturnov prsten C)
      [0.62, 0.79, 1.00, 0.62],      // široki, najsvjetliji (B)
      [0.82, 0.90, 0.60, 0.40],      // iza tamne pukotine (A)
      [0.90, 1.08, 0.10, 0.45],      // staza bočica: tek lagana izmaglica
      [1.125, 1.145, 0.55, 0.85]     // tanki vanjski prsten (F)
    ];

    // Oblici malih bočica. Presjek: 'o' krug, 'k' četvrtast (zaobljeni
    // bridovi), '8' osmerokut (fasete, kao flakon). Profil od dna prema
    // vrhu: [visina (0..1), pola širine (u visinama bočice), materijal
    // (0 staklo, 1 zlato, 3 srebro), presjek od te točke dalje (ako se mijenja)].
    // Tekućina je u staklu do visine "tekucina"
    function luk(cy, r, a0, a1, korak, m) {        // dio kružnice u profilu (središte na osi, kut od dna)
      const out = [];
      for (let a = a0; a < a1 + 1e-9; a += korak) out.push([cy - r * Math.cos(a), r * Math.sin(a), m]);
      if (out.length && Math.abs(out[out.length - 1][1] - r * Math.sin(a1)) > 1e-6) out.push([cy - r * Math.cos(a1), r * Math.sin(a1), m]);
      return out;
    }
    const MINI = {
      // mali flakon (kao Xerjoff 1861): osmerokut, zlatni prsten i čep sa šiljkom
      xerjoff: { presjek: '8', tekucina: 0.36, profil: FLAKON.filter(function (p) { return p[0] <= FLAKON_RUB; }).map(function (p, i) {
        return [p[0] / FLAKON_VRH, p[1] / FLAKON_VRH, p[0] >= FLAKON_ZLATO && !(p[0] === FLAKON_ZLATO && p[2] > 0) ? 1 : 0, p[0] === FLAKON_ZLATO && p[2] === 0 ? 'o' : undefined];
      }).concat([[0.90, 0.075, 1], [0.95, 0.045, 1], [1.0, 0, 1]]) },
      // okrugla bočica s malom zlatnom kuglom
      boule: { presjek: 'o', tekucina: 0.42, profil: [[0, 0, 0], [0, 0.09, 0]]
        .concat(luk(0.33, 0.30, 0.32, 2.85, 0.1, 0))
        .concat([[0.66, 0.065, 0], [0.70, 0.065, 0], [0.70, 0.095, 1], [0.75, 0.095, 1], [0.75, 0.07, 1]])
        .concat(luk(0.87, 0.12, 0.6, Math.PI, 0.12, 1)) },
      // četvrtasta (kao Chanel N°5): brušeni osmerokutni zlatni čep
      kocka: { presjek: 'k', tekucina: 0.45, profil: [[0, 0, 0], [0, 0.24, 0], [0.012, 0.265, 0], [0.03, 0.27, 0], [0.56, 0.27, 0],
        [0.585, 0.262, 0], [0.60, 0.24, 0], [0.615, 0.12, 0], [0.62, 0.07, 0], [0.66, 0.07, 0],
        [0.66, 0.09, 1, 'o'], [0.70, 0.09, 1], [0.70, 0.10, 1, '8'], [0.72, 0.16, 1], [0.95, 0.16, 1], [0.985, 0.13, 1], [1.0, 0, 1]] },
      // kap: okruglo dno, sužava se prema vratu, visok zlatni čep u obliku kapi
      kap: { presjek: 'o', tekucina: 0.36, profil: luk(0.21, 0.21, 0, 1.75, 0.12, 0)
        .concat([[0.33, 0.185, 0], [0.42, 0.145, 0], [0.50, 0.10, 0], [0.56, 0.065, 0], [0.60, 0.05, 0],
          [0.60, 0.07, 1], [0.64, 0.07, 1], [0.64, 0.045, 1], [0.68, 0.08, 1], [0.74, 0.095, 1], [0.80, 0.08, 1],
          [0.88, 0.045, 1], [0.95, 0.018, 1], [1.0, 0, 1]]) },
      // amfora (kao J'adore): dugi vrat sa zlatnim prstenovima, zlatna kugla
      amfora: { presjek: 'o', tekucina: 0.34, profil: [[0, 0, 0], [0, 0.09, 0], [0.02, 0.12, 0], [0.07, 0.17, 0], [0.14, 0.215, 0],
        [0.22, 0.235, 0], [0.30, 0.225, 0], [0.38, 0.19, 0], [0.45, 0.14, 0], [0.51, 0.095, 0], [0.55, 0.065, 0], [0.58, 0.05, 0],
        [0.58, 0.06, 1], [0.595, 0.075, 1], [0.61, 0.06, 1], [0.625, 0.075, 1], [0.64, 0.06, 1], [0.655, 0.075, 1],
        [0.67, 0.06, 1], [0.685, 0.075, 1], [0.70, 0.055, 1]]
        .concat(luk(0.82, 0.12, 0.47, Math.PI, 0.12, 1)) },
      // valjak s velikim okruglim srebrnim čepom (kao Byredo)
      valjak: { presjek: 'o', tekucina: 0.44, profil: [[0, 0, 0], [0, 0.13, 0], [0.01, 0.15, 0], [0.03, 0.16, 0], [0.60, 0.16, 0],
        [0.615, 0.15, 0], [0.625, 0.09, 0], [0.63, 0.06, 0], [0.65, 0.06, 0]]
        .concat(luk(0.825, 0.17, 0.36, Math.PI, 0.1, 3)) }
    };
    // Bočice na stazi, redom (susjedne su različite): oblik, boja tekućine, visina (svjetske jedinice)
    const PRSTEN_BOCICE = [
      ['xerjoff', '#e3a14a', 0.36],   // jantar
      ['boule',   '#ea98a6', 0.29],   // ruža
      ['kocka',   '#efd394', 0.31],   // šampanjac
      ['kap',     '#b9a0ea', 0.34],   // lila
      ['amfora',  '#f2c35a', 0.36],   // med
      ['valjak',  '#8fcaa6', 0.33],   // kadulja
      ['boule',   '#98c4ec', 0.29],   // nebo
      ['kocka',   '#f4b2ac', 0.31],   // puder
      ['kap',     '#da6b80', 0.34],   // rubin
      ['amfora',  '#f3ad7c', 0.36],   // breskva
      ['valjak',  '#cfc8dc', 0.33],   // dim
      ['xerjoff', '#86a8ea', 0.36]    // safir
    ];
    const BROJ_MINI = PRSTEN_BOCICE.length;

    // Presjek male bočice (jedinični): krug, četvrtast ili osmerokut. Kao
    // jedinicniPresjek: meki minimum udaljenosti do ravnina (zaobljeni bridovi)
    const MINI_PRESJECI = {};
    function presjekMini(vrsta) {
      if (MINI_PRESJECI[vrsta]) return MINI_PRESJECI[vrsta];
      const M = 128, N = vrsta === 'k' ? 4 : vrsta === '8' ? 8 : 0, mek = vrsta === 'k' ? 0.05 : 0.015;
      const x = new Float32Array(M), z = new Float32Array(M);
      for (let j = 0; j < M; j++) {
        const th = j / M * 2 * Math.PI, ux = Math.cos(th), uz = Math.sin(th);
        let r = 1;
        if (N) {
          const t = [];
          let min = Infinity, zbroj = 0;
          for (let k = 0; k < N; k++) {
            const d = ux * Math.cos(2 * Math.PI * k / N) + uz * Math.sin(2 * Math.PI * k / N);
            if (d > 1e-6) { t.push(1 / d); min = Math.min(min, 1 / d); }
          }
          t.forEach(function (v) { zbroj += Math.exp(-(v - min) / mek); });
          r = min - mek * Math.log(zbroj);
        }
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
      if (N) {
        const promjena = new Float32Array(M);
        for (let j = 0; j < M; j++) promjena[j] = Math.hypot(vx[(j + 1) % M] - vx[(j + M - 1) % M], vz[(j + 1) % M] - vz[(j + M - 1) % M]);
        for (let j = 0; j < M; j++) {
          if (promjena[j] > 0.12 && promjena[j] >= promjena[(j + M - 1) % M] && promjena[j] >= promjena[(j + 1) % M]) brid[j] = 1;
        }
      }
      return (MINI_PRESJECI[vrsta] = { x: x, z: z, vx: vx, vz: vz, tab: tab, obod: tab[M], brid: brid });
    }

    // Gradnja prstena (generator): nB točkica za bočice i nD za prašinu, po
    // točkici 12 brojeva: [mjesto (xyz) i kod] [normala i brid] [4 slučajna broja]
    //  - bočica: mjesto u bočici (visina bočice = 1, y = 0 dno), kod = vrsta
    //    (0 staklo s tekućinom, 1 zlato, 2 staklo iznad tekućine, 3 srebro) +
    //    4 · redni broj bočice
    //  - prašina: polumjer (udio staze bočica), kut, visina, kod = −1 − pojas;
    //    umjesto normale jačina i nijansa
    // Bočice su od vodoravnih niti kao flakon (prstenovi po profilu); točkice
    // se dijele razmjerno površini bočica u svjetskoj veličini
    function* prstenKoraci(nB, nD) {
      const out = new Float32Array((nB + nD) * 12), rnd = slucajno(1861);
      // 1. profili: dužine, površina svake bočice
      const bocice = PRSTEN_BOCICE.map(function (b) {
        const O = MINI[b[0]], seg = [];
        let presjek = O.presjek, duljina = 0, povrsina = 0;
        for (let i = 0; i < O.profil.length - 1; i++) {
          const p = O.profil[i], q = O.profil[i + 1];
          if (p[3]) presjek = p[3];
          const d = Math.hypot(q[1] - p[1], q[0] - p[0]);
          if (d < 1e-6) continue;
          const J = presjekMini(presjek);
          seg.push({ p: p, q: q, d: d, od: duljina, nr: (q[0] - p[0]) / d, ny: -(q[1] - p[1]) / d, J: J, m: p[2] });
          duljina += d;
          povrsina += J.obod * (p[1] + q[1]) / 2 * d;
        }
        return { O: O, seg: seg, duljina: duljina, povrsina: povrsina * b[2] * b[2], s: b[2] };
      });
      const ukupno = bocice.reduce(function (z, b) { return z + b.povrsina; }, 0);
      const korak = Math.sqrt(ukupno * OMJER_MINI / Math.max(1, nB));        // razmak niti (svjetske jedinice)
      yield;
      // 2. točkice bočica: niti po profilu, točkice po nitima
      let od = 0, prije = 0;
      for (let b = 0; b < bocice.length; b++) {
        const B = bocice[b];
        prije += B.povrsina;
        const doN = b === bocice.length - 1 ? nB : Math.round(nB * prije / ukupno), m = doN - od;
        const h = korak / B.s, k = Math.max(6, Math.round(B.duljina / h)), kk = B.duljina / k;
        const L = [];
        for (let i = 0; i < k; i++) {
          const s = (i + 0.5) * kk;
          let j = 0;
          while (j < B.seg.length - 1 && s > B.seg[j].od + B.seg[j].d) j++;
          const g = B.seg[j], t = sat((s - g.od) / g.d), r = lerp(g.p[1], g.q[1], t);
          L.push({ y: lerp(g.p[0], g.q[0], t), r: r, g: g, duljina: Math.max(1e-6, g.J.obod * r) });
        }
        const r = poLinijama(L.map(function (l) { return l.duljina; }), m);
        for (let i = 0; i < m; i++) {
          const l = L[r.linija[i]], g = l.g;
          const q = naPresjeku({ J: g.J, W: 1 }, ((r.udio[i] + r.linija[i] * 0.618034) % 1) * g.J.obod);
          let nx = q.vx * g.nr, ny = g.ny, nz = q.vz * g.nr;
          const nl = Math.hypot(nx, ny, nz) || 1;
          const vrsta = g.m === 1 ? 1 : g.m === 3 ? 3 : (l.y < B.O.tekucina ? 0 : 2);
          const o = (od + i) * 12;
          out[o] = q.x * l.r; out[o + 1] = l.y; out[o + 2] = q.z * l.r; out[o + 3] = vrsta + 4 * b;
          out[o + 4] = nx / nl; out[o + 5] = ny / nl; out[o + 6] = nz / nl; out[o + 7] = q.brid;
          out[o + 8] = rnd(); out[o + 9] = rnd(); out[o + 10] = rnd(); out[o + 11] = rnd();
        }
        od = doN;
        yield;
      }
      // 3. prašina: po pojasevima razmjerno površini (svjetlijih pojaseva malo
      //    više točkica, a ostalo je jačina točkice), jednoliko po površini
      const tez = PRSTEN_POJASEVI.map(function (p) { return (p[1] * p[1] - p[0] * p[0]) * (0.35 + 0.65 * p[2]); });
      const ukupnoP = tez.reduce(function (z, v) { return z + v; }, 0);
      let odD = 0, prijeD = 0;
      for (let q = 0; q < PRSTEN_POJASEVI.length; q++) {
        const p = PRSTEN_POJASEVI[q];
        prijeD += tez[q];
        const doN = q === PRSTEN_POJASEVI.length - 1 ? nD : Math.round(nD * prijeD / ukupnoP);
        for (let j = odD; j < doN; j++) {
          const o = (nB + j) * 12;
          // meki rubovi pojasa: malo raspršeno preko ruba
          const g = (rnd() + rnd() + rnd() - 1.5) * 0.008;
          out[o] = Math.sqrt(lerp(p[0] * p[0], p[1] * p[1], rnd())) + g;
          out[o + 1] = rnd() * 2 * Math.PI;
          out[o + 2] = (rnd() - 0.5) * 0.012;
          out[o + 3] = -1 - q;
          out[o + 4] = p[2] / (0.35 + 0.65 * p[2]); out[o + 5] = p[3];
          out[o + 8] = rnd(); out[o + 9] = rnd(); out[o + 10] = rnd(); out[o + 11] = rnd();
          if (j % 4000 === 3999) yield;
        }
        odD = doN;
      }
      // podaci bočica za shader: kut na stazi (prva malo lijevo od sredine
      // sprijeda, ostale udesno), visina, okret, brzina okreta; boja tekućine
      const mini = new Float32Array(BROJ_MINI * 4), boje = new Float32Array(BROJ_MINI * 3);
      PRSTEN_BOCICE.forEach(function (b, i) {
        mini.set([Math.PI / 2 + 0.5 - i * 2 * Math.PI / BROJ_MINI, b[2], rnd() * 2 * Math.PI, 0.3 + 0.3 * rnd()], 4 * i);
        boje.set(zasiti(boja01(b[1]), 1.3), 3 * i);
      });
      // obris flakona (pola širine) po visini, za zaklanjanje i sjenu
      const obris = new Float32Array(25);
      for (let i = 0; i < 25; i++) {
        const h = i / 24 * FLAKON_VRH;
        let w = 0;
        if (h <= FLAKON_RUB) {
          for (let j = 0; j < FLAKON.length - 1; j++) {
            const a = FLAKON[j], c = FLAKON[j + 1];
            if (h >= a[0] && h <= c[0] && c[0] > a[0]) { w = lerp(a[1], c[1], (h - a[0]) / (c[0] - a[0])); break; }
          }
        } else w = FLAKON[FLAKON.length - 1][1] * 0.75 * (1 - (h - FLAKON_RUB) / (FLAKON_VRH - FLAKON_RUB));
        obris[i] = i === 0 || i === 24 ? 0 : w * FLAKON_K;
      }
      return { podaci: out, n: nB + nD, nB: nB, mini: mini, boje: boje, obris: obris, korak: korak };
    }

    let PRS_OBLIK = null;
    function pripremiPrsten() {
      if (PRS_OBLIK) return PRS_OBLIK;
      const nB = Math.round(+(MOBITEL ? P.tocakaPrstenaMobitel : P.tocakaPrstena) || 30000);
      PRS_OBLIK = izvrsiPostupno(prstenKoraci(Math.round(nB * 0.58), Math.round(nB * 0.42))).catch(function (e) {
        console.warn('[Martimex] Početni ekran bez prstena:', e);
        return null;
      });
      return PRS_OBLIK;
    }


    // ═══════════════════════════════════════════════════════════════════
    //  SHADERI — program za grafičku karticu
    //
    //  Svaka točkica zna svoja tri mjesta (objekt, flakon, natpis), a kad su
    //  logotipi i Penhaligon bočice izračunati, iz vlastitih spremnika i
    //  mjesto u zidu logotipa (aMar) i u jednoj od pet bočica (aPen; vrsta,
    //  bočica i normala spakirani su u aPen.w). Shader u svakoj sličici
    //  izračuna gdje je sada: oblik objekta gužva simplex šumom, prijelaz radi
    //  u valu (svaka točkica kreće s malim zakašnjenjem) uz vrtlog i dimni
    //  šum, a svjetlo (sjena, odsjaj, rub) daje metalni izgled. Točkice se
    //  zbrajaju (aditivno), pa su gušća mjesta i rubovi sjajniji, kao na
    //  pravoj metalnoj tkanini.
    //  Oblici imaju brojeve (OBLIK): 0 objekt, 1 flakon, 2 logotipi,
    //  3 Penhaligon bočice, 4 natpis. Prijelaz ovisi o obliku u koji se ide:
    //  u flakon u valu, u logotipe i natpis jedan po jedan iz izmaglice, u
    //  Penhaligon bočice iz pet oblaka izmaglice (nastanak), a u objekt se
    //  natpis rasprši u dim.
    // ═══════════════════════════════════════════════════════════════════
    const OBLIK = { objekt: 0, flakon: 1, marke: 2, pen: 3, natpis: 4 };
    const VS = `
      precision highp float;

      attribute vec3 aSph;     // smjer točke na kugli (AI objekt)
      attribute vec3 aTxt;     // natpis: mjesto (x, y) i kod (redni broj slova + udio)
      attribute vec4 aRnd;     // slučajni brojevi 0..1
      attribute vec4 aFla;     // mjesto na flakonu (xyz) i vrsta točke (w: 0 staklo, 1 zlato, 2 pločica, 3 slovo X, 4 brid)
      attribute vec3 aFlaN;    // normala flakona
      attribute vec4 aMar;     // logotipi: mjesto u zidu (x, y), red logotipa na stranici (0..1) i udio u logotipu (0..1)
      attribute vec4 aPen;     // Penhaligon bočice: mjesto uz os svoje bočice (xyz) i kod (w: vrsta, redni broj bočice, normala)

      uniform float uTime;
      uniform float uOd;       // oblik iz kojeg točkice kreću (vidi OBLIK u JS-u)
      uniform float uDo;       // oblik u koji idu (u mirovanju isti kao uOd)
      uniform vec4 uMar;       // logotipi: pomak zida (y), veličina zida, pola visine prostora u kojem se vide, rub tog prostora
      uniform float uPenKut;   // okret Penhaligon bočica oko vlastitih osi
      uniform vec4 uPenMjesto[5];  // mjesto svake Penhaligon bočice: x, z, veličina, okret (vidi PEN_RASPORED u JS-u)
      uniform float uPenGlava[5];  // dodatni okret glave svake bočice (vidi PEN_GLAVA u JS-u)
      uniform float uSloj;     // 1: crta se gusti sloj Penhaligon bočica (vidi gustiSloj)
      uniform float uAlphaPen; // jačina točkica Penhaligon bočica
      uniform vec3 uPenGore[5];    // boja stakla svake Penhaligon bočice pri vrhu tekućine
      uniform vec3 uPenDolje[5];   // ... i pri dnu
      uniform float uProg;     // napredak prijelaza (0 = oblik miruje)
      uniform float uIntro;    // pojava (0..1)
      uniform float uExit;     // raspršivanje nakon "Početak" (0..1)
      uniform mat3 uRotA;      // okret oblika iz kojeg točkice kreću
      uniform mat3 uRotB;      // okret oblika u koji idu
      uniform vec2 uPx;        // svjetska jedinica → ekran
      uniform vec2 uCenter;
      uniform float uSize;
      uniform vec2 uSweep;     // x: sjaj preko natpisa i logotipa, y: odsjaj niz flakon i Penhaligon bočice
      uniform vec4 uAlpha;     // jačina točkica: objekt, flakon, logotipi, natpis
      uniform vec2 uTxt;       // natpis: x povećanje (na uskom prozoru < 1), y broj slova − 1
      uniform float uSredina[${SLOVA_NATPISA}];   // natpis: sredina svakog slova (x)
      uniform vec3 uSilver;
      uniform vec3 uPowder;
      uniform vec3 uGold;
      uniform vec4 uPrstenSjena;   // SATURN: x jačina sjene prstena na flakonu (0 = nema prstena), y polumjer staze bočica, z visina sredine prstena
      uniform mat3 uRotP;          // SATURN: nagib i zakret prstena

      varying vec4 vCol;

      const float PI = 3.14159265;
      const float VAL = 0.6;   // koliki dio prijelaza zauzima "val" zakašnjenja
      const float CAM = 4.2;   // udaljenost kamere

      // SATURN: gustoća prstena na udaljenosti r (udio staze bočica), za sjenu na flakonu
      float pojas(float r, float a, float b) { return smoothstep(a - 0.015, a + 0.015, r) * (1.0 - smoothstep(b - 0.015, b + 0.015, r)); }
      float gustocaPrstena(float r) { return 0.3 * pojas(r, 0.50, 0.60) + pojas(r, 0.62, 0.79) + 0.6 * pojas(r, 0.82, 0.90) + 0.5 * pojas(r, 1.12, 1.15); }

      // 3D simplex šum s gradijentom — Ian McEwan, Stefan Gustavson
      // (Ashima Arts, webgl-noise, licenca MIT)
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v, out vec3 gradient) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        vec4 m2 = m * m;
        vec4 m4 = m2 * m2;
        vec4 pdotx = vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3));
        vec4 temp = m2 * m * pdotx;
        gradient = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
        gradient += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;
        gradient *= 105.0;
        return 105.0 * dot(m4, pdotx);
      }

      vec2 okreni(vec2 v, float k) {
        float c = cos(k), s = sin(k);
        return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
      }

      // AI objekt: kugla čiju površinu stalno gužvaju dva sloja šuma
      void objekt(out vec3 p, out vec3 n, out vec3 c, out float lit, out float back) {
        vec3 d = aSph;
        float t = uTime;
        vec3 g1, g2;
        float n1 = snoise(d * 1.15 + vec3(0.0, t * 0.19, t * 0.11), g1);
        float n2 = snoise(d * 2.5 + vec3(t * 0.23, -t * 0.09, 0.0) + g1 * 0.08, g2);
        float disp = n1 * 0.25 + n2 * 0.085;
        vec3 grad = g1 * (1.15 * 0.25) + g2 * (2.5 * 0.085);
        vec3 tg = grad - dot(grad, d) * d;
        p = d * 0.8 * (1.0 + disp) * (1.0 + 0.02 * sin(t * 1.3));
        n = normalize(d - tg / (1.0 + disp));
        c = uSilver * (0.9 + 0.3 * n1);
        lit = 1.0;
        back = 0.14;
      }

      // Flakon: fasetirano staklo s medenom tekućinom koja se njiše (prema
      // dnu je staklo deblje pa boja blijedi), zlatni čep, prsten i pločica
      void flakon(out vec3 p, out vec3 n, out vec3 c, out float lit, out float back) {
        float t = uTime;
        p = aFla.xyz;
        p.y += 0.018 * sin(t * 0.8);
        n = aFlaN;
        float m = aFla.w;
        float zlato = step(0.5, m) * step(m, 3.5);                 // čep, prsten, pločica
        float plocica = step(1.5, m) * step(m, 3.5);
        float slovo = step(2.5, m) * step(m, 3.5);                 // slovo X i okvir pločice
        float brid = step(3.5, m);                                  // bridovi faseta
        float staklo = (1.0 - zlato) * step(aFla.y, 0.3);
        float razina = 0.2 + 0.02 * sin(t * 1.3 + aFla.x * 3.0) + 0.01 * sin(t * 2.1 - aFla.z * 5.0);
        float tekucina = staklo * (1.0 - smoothstep(razina - 0.014, razina + 0.014, aFla.y)) * smoothstep(-0.9, -0.45, aFla.y);
        float dr = (aFla.y - razina) / 0.016, dv = (aFla.y - uSweep.y) / 0.06;
        vec3 cs = mix(uSilver, uGold * 1.1, tekucina * 0.45) + uGold * staklo * exp(-dr * dr) * 0.6;
        cs *= 1.0 + 0.5 * brid;
        // pločica je polirano zlato: sjaji iz svakog kuta, slovo X najjače
        vec3 cz = mix(uGold * 1.05, mix(uGold * 0.95, mix(uGold, uPowder, 0.2) * 1.2, slovo), plocica);
        c = mix(cs, cz, zlato);
        c += vec3(0.5) * exp(-dv * dv);
        lit = mix(mix(0.75, 1.0, zlato), 0.35, plocica);
        back = mix(0.45, 0.28, zlato);
      }

      // pločica, slovo X i bridovi flakona su gušći (jače točkice) od stakla
      float jacinaFlakona() {
        float m = aFla.w;
        return 1.0 + 0.8 * step(1.5, m) * step(m, 3.5) - 1.0 * step(2.5, m) * step(m, 3.5) + 1.2 * step(3.5, m);
      }

      // Penhaligon bočice: podaci točkice iz koda aPen.w (vidi penhaligonKoraci u JS-u)
      float pVrsta = 0.0;      // 0 staklo, 1 prozirno dno, 2 zlato (ovratnik i glava), 3 etiketa
      float pBocica = 0.0;     // redni broj bočice u nizu (0..4)
      float pY = 0.0;          // visina na bočici (px fotografije, 0 = dno)
      vec3 pNor = vec3(0.0, 0.0, 1.0);
      vec4 pMjesto = vec4(0.0, 0.0, 1.0, 0.0);   // mjesto bočice u rasporedu (vidi uPenMjesto)
      float pGlava = 0.0;                         // dodatni okret glave (vidi uPenGlava)
      vec3 oktaedar(vec2 e) {
        vec3 v = vec3(e, 1.0 - abs(e.x) - abs(e.y));
        if (v.z < 0.0) v.xy = (1.0 - abs(v.yx)) * vec2(v.x >= 0.0 ? 1.0 : -1.0, v.y >= 0.0 ? 1.0 : -1.0);
        return normalize(v);
      }
      void penPodaci() {
        float w = aPen.w + 0.5;
        float vb = floor(w / 65536.0);
        float ost = w - vb * 65536.0;
        float qx = floor(ost / 256.0);
        float qy = floor(ost - qx * 256.0);
        pBocica = floor((vb + 0.5) / 4.0);
        pVrsta = vb - 4.0 * pBocica;
        pNor = oktaedar(vec2(qx, qy) / 127.5 - 1.0);
        pY = aPen.y / ${PEN_K.toFixed(8)};
        pMjesto = uPenMjesto[int(pBocica + 0.5)];
        pGlava = uPenGlava[int(pBocica + 0.5)];
      }

      // Pet Penhaligon bočica u rasporedu V: svaka stoji na svom mjestu, svoje
      // veličine, i polako se okreće oko svoje osi; staklo s tekućinom svoje
      // boje (tamnije pri vrhu), prozirno debelo dno, zlatni ovratnik i
      // glava, etiketa boje papira; niz staklo putuje odsjaj
      void pen(out vec3 p, out vec3 n, out vec3 c, out float lit, out float back, out float jak) {
        float t = uTime;
        // glava (zlato iznad ovratnika) se može okrenuti i sama, vidi PEN_GLAVA
        float kut = pMjesto.w + uPenKut + pGlava * step(1.5, pVrsta) * step(pVrsta, 2.5) * smoothstep(338.0, 352.0, pY);
        vec2 xz = okreni(aPen.xz, kut);
        p = (vec3(xz.x, aPen.y, xz.y) * pMjesto.z + vec3(pMjesto.x, ${PEN_DNO.toFixed(3)} + 0.012 * sin(t * 0.8 + pBocica * 1.3), pMjesto.y)) * uTxt.x;
        n = pNor;
        n.xz = okreni(n.xz, kut);
        int ib = int(pBocica + 0.5);
        vec3 gore = uPenGore[ib], dolje = uPenDolje[ib];
        float dv = (pY / 684.0 * 1.76 - 0.86 - uSweep.y) / 0.06;    // visina kao na ostalim bočicama (-0,86 .. 0,9)
        float odsjaj = exp(-dv * dv);
        jak = 1.0;
        if (pVrsta < 0.5) {
          // staklo: unutra tamnije, a prema obrisu svjetlije (kao staklo flakona)
          float obris = pow(1.0 - abs(n.z), 2.5);
          c = mix(uSilver, mix(dolje, gore, smoothstep(64.0, 320.0, pY)), 0.68) * 1.12 * (0.42 + 1.25 * obris) + vec3(0.5) * odsjaj;
          lit = 0.75; back = 0.32;
        } else if (pVrsta < 1.5) {
          c = mix(uSilver, dolje, 0.3) + vec3(0.4) * odsjaj;
          lit = 0.75; back = 0.45; jak = 0.7;
        } else if (pVrsta < 2.5) {
          c = uGold * (1.05 + 0.5 * odsjaj);
          lit = 1.0; back = 0.28; jak = 0.75;
        } else {
          // etiketa: topli papir, prigušen (gusti retci etikete inače zablješte kao bijela ploha)
          c = mix(uPowder, uGold, 0.22);
          lit = 0.35; back = 0.45; jak = 0.5;
        }
        jak *= mix(0.78, 1.0, smoothstep(-0.26, 0.26, pMjesto.y));   // bočice straga malo tamnije (dubina)
      }

      // Natpis: podaci točkice (iz koda aTxt.z) i stanje njezina slova u prijelazu
      float tSlovo = 0.0;      // redni broj slova: 0 prvo .. 1 zadnje
      float tUdio = 0.0;       // visina niti u slovu (0 dno, 1 vrh)
      float tSkala = 1.0;      // slovo pri slaganju malo veće, pa se slegne
      float tDigni = 0.0;      // slovo se digne (slaganje, rastapanje)
      float tBljesak = 0.0;    // slovo jedva primjetno zasvijetli kad sjedne na mjesto (i prije nego se rastopi)
      float tDim = 0.0;        // slovo se rastapa u dim
      float tJak = 1.0;        // jačina točkice natpisa (sjaj, zasvjetljenje): ide u prozirnost, kao i u ostalim oblicima

      // Natpis: slova satkana od tankih niti boje pudera, kao "Marti". Kroz
      // slova ide lagani val, a preko njih polako prijeđe meki sjaj slijeva
      // nadesno
      void natpis(out vec3 p, out vec3 n, out vec3 c, out float lit, out float back) {
        float t = uTime;
        float cx = uSredina[int(min(floor(aTxt.z), ${(SLOVA_NATPISA - 1).toFixed(1)}))];
        p = vec3(cx + (aTxt.x - cx) * tSkala, aTxt.y * tSkala + tDigni, 0.0) * uTxt.x;
        p.z += 0.03 * sin(aTxt.x * 2.4 - t * 1.2);
        p.y += 0.005 * uTxt.x * sin(aTxt.x * 6.0 + t * 1.8);
        n = vec3(0.0, 0.0, 1.0);
        float ds = (aTxt.x - uSweep.x) / 0.24;
        c = uPowder;
        tJak = (1.0 + 0.35 * exp(-ds * ds)) * (1.0 + 0.12 * tBljesak);
        lit = 0.0;
        back = 1.0;
      }

      // Logotipi: zid logotipa boje pudera, raspoređen kao na slici. Vidi se
      // u prostoru animacije (pola visine uMar.z); pri rubu tog prostora se
      // logotipi rastope u izmaglicu (gore se dim diže, dolje se tek skuplja).
      // Kroz zid ide lagani val, a preko njega ukoso prijeđe meki zlatni sjaj.
      // Pri slaganju se logotip malo digne i zasvijetli (tDigni, tBljesak)
      float mVid = 1.0;        // koliko se točkica vidi (0 izvan prostora, 1 unutra)
      float mVis = 0.5;        // visina točkice u prostoru (0 dno, 1 vrh)
      void marke(out vec3 p, out vec3 n, out vec3 c, out float lit, out float back, out float jak) {
        float t = uTime;
        p = vec3(aMar.x, aMar.y + uMar.x + tDigni, 0.0) * uMar.y;
        p.z += 0.025 * sin(aMar.x * 2.4 - t * 1.1);
        float H = uMar.z, F = uMar.w;
        mVis = clamp((p.y + H) / (2.0 * H), 0.0, 1.0);
        mVid = smoothstep(-H, -H + F, p.y) * (1.0 - smoothstep(H - F, H, p.y));
        float m = 1.0 - mVid;
        p += (vec3(aRnd.z - 0.5, aRnd.w - 0.5, aRnd.y - 0.5) * vec3(0.28, 0.12, 0.3) + vec3(0.0, 0.1 * sign(p.y), 0.0)) * m * m;
        n = vec3(0.0, 0.0, 1.0);
        float ds = (p.x + 0.45 * p.y - uSweep.x) / 0.3;
        float sjaj = exp(-ds * ds);
        c = mix(uPowder, uGold * 1.15, 0.3 * sjaj);
        jak = mVid * (1.0 + 0.4 * sjaj) * (1.0 + 0.12 * tBljesak);
        lit = 0.0;
        back = 1.0;
      }

      bool je(float o, float broj) { return abs(o - broj) < 0.5; }

      // Oblik po broju (vidi OBLIK u JS-u); a je jačina točkice
      void oblik(float o, out vec3 p, out vec3 n, out vec3 c, out float lit, out float back, out float a) {
        float j = 1.0;
        if (o < 0.5) { objekt(p, n, c, lit, back); a = uAlpha.x; }
        else if (o < 1.5) { flakon(p, n, c, lit, back); a = uAlpha.y * jacinaFlakona(); }
        else if (o < 2.5) { marke(p, n, c, lit, back, j); a = uAlpha.z * j; }
        else if (o < 3.5) { pen(p, n, c, lit, back, j); a = uAlphaPen * j; }
        else { natpis(p, n, c, lit, back); a = uAlpha.w * tJak * (1.0 - 0.6 * tDim); }
      }

      // visina točkice u obliku (0 dno, 1 vrh): oblik se rastapa odozgo
      // (za logotipe vrijedi tek nakon marke())
      float visina(float o) {
        if (o < 0.5) return clamp(aSph.y * 0.5 + 0.5, 0.0, 1.0);
        if (o < 1.5) return clamp((aFla.y + 0.86) / 1.76, 0.0, 1.0);
        if (o < 2.5) return mVis;
        if (o < 3.5) return clamp(pY / 694.0 + 0.12 * step(2.5, pVrsta), 0.0, 1.0);   // etiketa se rastopi malo prije stakla oko nje
        return tUdio;
      }

      // Nastanak Penhaligon bočica: redoslijed točkice (0 prva .. 0,9 zadnja):
      // bočica u sredini prva, pa unutarnje, pa vanjske (oko pola sekunde
      // jedna za drugom); u bočici se staklo puni odozdo, etiketa se otisne
      // odozgo dok se staklo puni (pa u staklu nema rupe), a zlatni ovratnik
      // zatvori bočicu i iz njega izraste glava. Vraća napredak točkice (0..1)
      // za slučajni broj r
      float nastanakBocice(float r) {
        float d;
        if (pVrsta < 1.5) d = 0.42 * clamp(pY / 322.0, 0.0, 1.0);                         // staklo se puni odozdo
        else if (pVrsta > 2.5) d = 0.30 + 0.16 * clamp((262.0 - pY) / 184.0, 0.0, 1.0);  // etiketa se otisne odozgo
        else d = 0.40 + 0.5 * clamp((pY - 321.0) / 363.0, 0.0, 1.0);                     // zlato raste od ovratnika
        d = (d + 0.08 * r) * 0.5 + 0.2 * abs(pBocica - 2.0);
        return clamp((clamp((uProg - 0.3) / 0.7, 0.0, 1.0) * 1.3 - d) / 0.3, 0.0, 1.0);
      }

      // Gusti sloj Penhaligon bočica (vidi PENHALIGON'S PORTRAITS u JS-u): iste
      // bočice, ali točkice ne putuju: pojave se na svom mjestu kad onamo
      // sjednu točkice glavnog sloja (nastanak), a nestanu kad se one
      // rastope u dim (prijelaz u natpis)
      void gustiSloj(out vec3 p, out vec3 n, out vec3 c, out float lit, out float back, out float alpha) {
        float jak;
        pen(p, n, c, lit, back, jak);
        alpha = uAlphaPen * jak;
        bool uBocice = je(uDo, 3.0);
        mat3 R = uBocice ? uRotB : uRotA;
        p = R * p; n = R * n;
        if (uProg > 0.0 && uBocice) {
          float k2 = nastanakBocice(aRnd.x);
          float e2 = k2 * k2 * k2 * (k2 * (k2 * 6.0 - 15.0) + 10.0);
          vec3 smjer = normalize(vec3(aRnd.z, aRnd.w, aRnd.y) - 0.5 + 0.001);
          p += smjer * 0.05 * (1.0 - e2) * pMjesto.z * uTxt.x;
          alpha *= e2;
          float b = (k2 - 0.82) / 0.07;
          c *= 1.0 + exp(-b * b) * (pVrsta > 2.5 ? 0.1 : (pVrsta > 1.5 ? 1.6 : 0.8));
        } else if (uProg > 0.0) {
          // točkica se rastopi (odozgo) kad i glavni sloj oko nje, i digne se
          // s dimom iznad svoje bočice
          float kd = clamp((uProg - 0.3 * (1.0 - visina(3.0)) - 0.15 * aRnd.x) / 0.4, 0.0, 1.0);
          float e1 = kd * kd * (3.0 - 2.0 * kd);
          p += vec3((aRnd.z - 0.5) * 0.14, 0.12 + 0.28 * aRnd.w, (aRnd.y - 0.5) * 0.14) * e1 * uTxt.x;
          alpha *= 1.0 - smoothstep(0.45, 1.0, e1);
        }
      }

      void main() {
        // podaci natpisa iz koda (vidi natpis() u JS-u)
        float slovo = floor(aTxt.z);
        tUdio = aTxt.z - slovo;
        tSlovo = slovo / max(uTxt.y, 1.0);
        penPodaci();

        vec3 p, n, col;
        float lit, back, alpha;
        // točkica je papir etikete Penhaligon bočice (nema iskri, a gledana ukoso se priguši)
        float papir = 0.0;
        // koliko je točkica dio Penhaligon bočica (0..1, prati njezin napredak u
        // prijelazu): bočice imaju rjeđe iskre, a prag se mijenja postupno
        float wBocica = 0.0;
        if (uSloj > 0.5) {
          gustiSloj(p, n, col, lit, back, alpha);
          papir = step(2.5, pVrsta);
        } else {
          bool prijelaz = uProg > 0.0;
          bool nastanak = prijelaz && je(uDo, 3.0);                        // u Penhaligon bočice: vidi NASTANAK niže
          bool slaganje = prijelaz && (je(uDo, 4.0) || je(uDo, 2.0));         // u natpis ili logotipe: jedno po jedno iz izmaglice
          bool doNatpisa = je(uDo, 4.0);
          vec3 pA, nA, cA, pB, nB, cB;
          float lA, lB, bA, bB, aA, aB, kasni = 0.0, kn = 0.0, kd = 0.0;
          papir = step(2.5, pVrsta) * ((je(uOd, 3.0) || je(uDo, 3.0)) ? 1.0 : 0.0);
          wBocica = je(uOd, 3.0) && je(uDo, 3.0) ? 1.0 : 0.0;

          if (prijelaz && je(uOd, 4.0)) {
            // iz natpisa: slova se obrnutim redom (od zadnjeg) kratko zasvijetle i
            // dignu, rasprše se u dim koji se diže, a točkice zatim u vrtlogu
            // odlete u objekt
            float ks = clamp((uProg - 0.4 * (1.0 - tSlovo)) / 0.6, 0.0, 1.0);
            float digni = smoothstep(0.0, 0.3, ks);
            tSkala = 1.0 + 0.04 * digni;
            tDigni = 0.07 * digni;
            float b = sin(PI * clamp(ks / 0.2, 0.0, 1.0));
            tBljesak = 0.5 * b * b;
            tDim = smoothstep(0.18, 0.6, ks + 0.12 * (aRnd.y - 0.5));
            kn = (ks - 0.5 - 0.2 * aRnd.x) / 0.3;
          }
          oblik(uOd, pA, nA, cA, lA, bA, aA);
          float vis = visina(uOd);
          if (je(uDo, 1.0)) kasni = 0.75 * clamp((aFla.y + 0.86) / 1.76, 0.0, 1.0) + 0.25 * aRnd.x;   // flakon se puni odozdo
          bool izBocica = je(uOd, 3.0);
          if (slaganje) {
            // 1. oblik se (odozgo) rastopi u dim, koji se digne i razlije duž
            //    natpisa (zida logotipa), oko slova (logotipa) kojem točkica
            //    pripada; Penhaligon bočice se rastapaju sporije (vidi niže)
            kd = izBocica ? clamp((uProg - 0.3 * (1.0 - vis) - 0.15 * aRnd.x) / 0.4, 0.0, 1.0)
                          : clamp((uProg - 0.2 * (1.0 - vis) - 0.1 * aRnd.x) / 0.3, 0.0, 1.0);
            // 2. iz izmaglice nastaju slova (logotipi), jedno za drugim (svako u
            //    svom dijelu prijelaza): niti u slovu se slože odozdo prema gore
            //    (logotip slijeva nadesno), a slovo, tek malo veće, meko sjedne
            //    na mjesto (logotip se malo spusti)
            float red = doNatpisa ? tSlovo : aMar.z;
            float ks = izBocica ? clamp((uProg - 0.25 - 0.35 * red) / 0.35, 0.0, 1.0) : clamp((uProg - 0.2 - 0.4 * red) / 0.4, 0.0, 1.0);
            kn = (ks - 0.5 * (doNatpisa ? tUdio : aMar.w)) / 0.5;           // (svaka točkica stigne do ks = 1)
            float q = clamp((ks - 0.6) / 0.4, 0.0, 1.0) - 1.0;
            float o = 1.0 + q * q * (2.7 * q + 1.7);                      // "easeOutBack": malo prebaci pa se vrati
            tSkala = 1.04 - 0.04 * o;
            tDigni = 0.012 * (1.0 - o);
            float b = (ks - 0.8) / 0.08;                                   // u trenutku prebačaja, do kraja se ugasi
            tBljesak = exp(-b * b);
          }
          pB = pA; nB = nA; cB = cA; lB = lA; bB = bA; aB = aA;
          if (prijelaz) oblik(uDo, pB, nB, cB, lB, bB, aB);
          // svaki oblik okrenut po svome
          pA = uRotA * pA; nA = uRotA * nA;
          pB = uRotB * pB; nB = uRotB * nB;

          float k;
          if (nastanak) {
            // NASTANAK: oblik (zid logotipa) se odozgo rastopi u svjetlucavu
            // izmaglicu: najprije se mrvi prema gore kao dim (bez razmazivanja
            // ustranu), pa se skupi u meke oblake na mjestu budućih bočica (oko
            // mjesta svake točkice, pa oblaci već slute obris bočica) i polako
            // se vrti oko osi svake bočice. Iz izmaglice bočice nastaju jedna
            // po jedna (sredina prva, pa unutarnje, pa vanjske): staklo se puni
            // odozdo, etiketa se otisne odozgo, a zlatna glava izraste iz
            // ovratnika; točkica kratko zasvijetli kad sjedne na mjesto (papir
            // etikete tek jedva, i ni u letu ne svjetluca)
            vec3 smjer = normalize(vec3(aRnd.z, aRnd.w, aRnd.y) - 0.5 + 0.001);
            vec3 oblak = pB + (smjer * (0.08 + 0.17 * aRnd.x) + vec3(0.0, 0.05 * sin(uTime * 0.8 + aRnd.y * 9.0), 0.0)) * pMjesto.z * uTxt.x;
            vec3 osB = uRotB * (vec3(pMjesto.x, 0.0, pMjesto.y) * uTxt.x);
            float k1 = clamp((uProg - 0.08 * (1.0 - vis) - 0.15 * aRnd.x) / 0.22, 0.0, 1.0);
            float e1 = k1 * k1 * (3.0 - 2.0 * k1);
            float k2 = nastanakBocice(aRnd.x);
            float e2 = k2 * k2 * k2 * (k2 * (k2 * 6.0 - 15.0) + 10.0);
            p = mix(mix(pA, oblak, e1), pB, e2);
            p.xz = osB.xz + okreni(p.xz - osB.xz, smoothstep(0.35, 1.0, e1) * (1.0 - e2) * (1.0 - e2) * 1.2);
            p.y += (0.05 * sin(PI * e2) + 0.06 * e1 * (1.0 - e2)) * uTxt.x;
            n = normalize(mix(mix(nA, vec3(0.0, 0.3, 1.0), e1), nB, e2) + vec3(0.0, 0.0, 1e-4));
            col = mix(cA, cB, e1);
            lit = mix(lA, lB, e1);
            back = mix(bA, bB, e1);
            alpha = mix(mix(aA, aB * 0.45, e1), aB, e2);
            float b = (k2 - 0.82) / 0.07;                              // do k2 = 1 se posve ugasi
            col *= 1.0 + exp(-b * b) * (pVrsta > 2.5 ? 0.1 : (pVrsta > 1.5 ? 1.6 : 0.8));
            k = e2;
            wBocica = e2;
            papir *= e1;                                               // papir postane "papir" kad točkica krene
          } else {
            // u natpis (logotipe): točkica najprije odleti u izmaglicu oko svog
            // slova (logotipa)
            float e1 = kd * kd * (3.0 - 2.0 * kd);
            if (kd > 0.0) {
              vec3 izmaglica = pB + vec3((aRnd.z - 0.5) * 0.26, (aRnd.w - 0.5) * 0.3, (aRnd.y - 0.5) * 0.5) * (doNatpisa ? uTxt.x : uMar.y);
              float jakIzmaglice = 0.7;                                  // izmaglica je slabija od slova (gušća je od niti s razmacima)
              if (izBocica) {
                // iz Penhaligon bočica u dva koraka: najprije se nad svojom
                // bočicom digne zlatni dim, a tek onda dim otplovi prema
                // slovima; zlatan ostaje dok ne krene u slovo (vidi col niže),
                // a papir etikete se samo tiho ugasi
                // (svjetlo i sjena ostaju dok točkica ne krene u slovo, inače bi
                // dno i stražnja strana bočice u dimu zasvijetlili)
                vec3 lokalno = pA + vec3((aRnd.z - 0.5) * 0.14, 0.12 + 0.28 * aRnd.w, (aRnd.y - 0.5) * 0.14) * uTxt.x;
                izmaglica = mix(lokalno, izmaglica, smoothstep(0.45, 1.0, e1));
                jakIzmaglice = 0.7 * (pVrsta > 2.5 ? 0.6 : 1.0);
              } else {
                cA = mix(cA, uPowder, e1);
                nA = normalize(mix(nA, vec3(0.0, 0.0, 1.0), e1) + vec3(0.0, 0.0, 1e-3));
                lA = mix(lA, 0.0, e1);
                bA = mix(bA, 1.0, e1);
              }
              pA = mix(pA, izmaglica, e1);
              aA = mix(aA, (doNatpisa ? uAlpha.w : uAlpha.z * mVid) * jakIzmaglice, e1);
            }

            // napredak točkice: u flakon u valu, inače po slovima (kn); iz
            // bočica točkica najprije postane dim, a tek onda krene u slovo
            k = clamp(je(uDo, 1.0) ? uProg * (1.0 + VAL) - kasni * VAL : (izBocica ? min(kn, e1) : kn), 0.0, 1.0);
            k = k * k * k * (k * (k * 6.0 - 15.0) + 10.0);
            float luk = sin(PI * k);

            p = mix(pA, pB, k);
            n = normalize(mix(nA, nB, k) + vec3(0.0, 0.0, 1e-4));
            col = mix(cA, cB, k);
            lit = mix(lA, lB, k);
            back = mix(bA, bB, k);
            alpha = mix(aA, aB, k);
            papir *= izBocica ? 1.0 - smoothstep(0.6, 1.0, max(e1, k)) : 0.0;
            if (izBocica) wBocica = 1.0 - max(e1, k);

            // prijelaz: dimni vrtlog i lagano dizanje
            if (prijelaz) {
              vec3 g;
              snoise(p * 1.4 + vec3(0.0, -uTime * 0.3, uTime * 0.17), g);
              float uLetu = 0.3;                                         // točkice u letu su malo jače
              if (je(uDo, 1.0)) {
                p += (g * 0.03 + cross(g, vec3(0.0, 1.0, 0.0)) * 0.05) * luk;
                p.xz = okreni(p.xz, luk * (0.6 + 0.5 * aRnd.w));
                p.y += 0.05 * luk;
              } else if (slaganje) {
                // u natpis (logotipe): dimni vrtlog (Penhaligon bočice se najprije
                // dignu kao zlatni dim, logotipi malo), izmaglica lagano plovi, a
                // točkice u slovo uđu kratkim, plitkim lukom prema nama; u letu su
                // tek malo jače od niti u koje sjedaju (bez svijetlih pramenova)
                // (u natpis slabiji vrtlog i više šuma, pa dim ostane mekan, bez
                // svijetlih pruga gdje bi se točkice iz različitih dijelova sjekle)
                float m = sin(PI * e1) * (1.0 - k);
                p += (g * (doNatpisa ? 0.08 : 0.04) + cross(g, vec3(0.0, 1.0, 0.0)) * 0.05) * m + g * 0.03 * e1 * (1.0 - k);
                p.xz = okreni(p.xz, m * (doNatpisa ? 0.12 + 0.2 * aRnd.w : 0.35 + 0.4 * aRnd.w));
                p.y += (izBocica ? 0.06 : (je(uOd, 2.0) ? 0.06 : 0.0)) * m;
                p.z += 0.06 * luk;
                alpha *= doNatpisa ? 1.0 - 0.1 * m : 1.0 + 0.1 * m;
                uLetu = 0.1;
              } else {
                // iz natpisa: slovo se rasprši u dim koji se diže, pa se
                // točkice u vrtlogu slože u objekt
                float dim = tDim * (1.0 - k);
                p += (g * 0.05 + (aRnd.yzw - 0.5) * vec3(0.4, 0.22, 0.4) + vec3(0.0, 0.12 * aRnd.z, 0.0)) * dim;
                p.xz = okreni(p.xz, luk * (0.6 + 0.5 * aRnd.w));
                p.y += 0.05 * luk;
              }
              alpha *= 1.0 + uLetu * luk;
            }
          }
        }

        // pojava: točkice doplove iz izmaglice u vrtlogu
        if (uIntro < 1.0) {
          float ki = clamp(uIntro * 1.6 - aRnd.y * 0.6, 0.0, 1.0);
          ki = 1.0 - pow(1.0 - ki, 3.0);
          vec3 izvor = normalize(vec3(aRnd.z, aRnd.w, aRnd.x) - 0.5 + 0.001) * (1.5 + 1.3 * aRnd.y);
          izvor.xz = okreni(izvor.xz, (1.0 - ki) * 2.4);
          p = mix(izvor, p, ki);
          alpha *= ki;
        }

        // "Početak": točkice se rasprše prema van i gore, kao izmaglica parfema
        if (uExit > 0.0) {
          float ke = clamp(uExit * 1.45 - aRnd.x * 0.45, 0.0, 1.0);
          ke = ke * ke * (3.0 - 2.0 * ke);
          vec3 smjer = normalize(p + (aRnd.yzw - 0.5) * 0.8 + vec3(0.0, 0.25, 0.0));
          p += smjer * ke * 1.5 + vec3(0.0, 0.45, 0.0) * ke;
          alpha *= 1.0 - ke;
        }

        vec3 q = p;
        vec3 nq = normalize(n);
        float persp = CAM / (CAM - q.z);
        gl_Position = vec4(q.x * uPx.x * persp + uCenter.x, q.y * uPx.y * persp + uCenter.y, 0.0, 1.0);
        // izmaglica i dim oko natpisa se pri rubu prozora utope (ne odreže ih rub)
        if (max(uOd, uDo) > 1.5) alpha *= 1.0 - smoothstep(0.93, 1.0, abs(gl_Position.x));
        // iskre: na Penhaligon bočicama rjeđe (u gustom sloju gotovo nikako), da glave ne svjetlucaju kao šljokice
        float iskra = step(uSloj > 0.5 ? 0.9985 : mix(0.993, 0.996, wBocica), aRnd.z) * (1.0 - papir);
        gl_PointSize = uSize * persp * (1.0 + iskra * 0.7);

        // svjetlo gore lijevo: sjena, odsjaj i svijetli rub
        vec3 L = normalize(vec3(-0.5, 0.62, 0.6));
        vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
        // SATURN: prsten baca sjenu na flakon (zraka od točkice prema svjetlu
        // prolazi kroz pojaseve prstena)
        float sjenaPrstena = 0.0;
        if (uPrstenSjena.x > 0.0) {
          vec3 osP = uRotP[1];
          vec3 sP = vec3(0.0, uPrstenSjena.z + 0.018 * sin(uTime * 0.8), 0.0);
          float sz = dot(sP - q, osP) / dot(L, osP);
          sjenaPrstena = uPrstenSjena.x * step(0.0, sz) * gustocaPrstena(length(q + sz * L - sP) / uPrstenSjena.y);
        }
        float dif = max(dot(nq, L), 0.0);
        float spe = pow(max(dot(nq, H), 0.0), 26.0);
        float rub = pow(1.0 - abs(nq.z), 2.2);
        float nebo = smoothstep(-0.08, 0.3, nq.y);                   // odraz neba i tla, kao na kromu
        float svjetlo = 0.08 + 0.7 * dif + 1.5 * spe + 0.6 * rub + 0.28 * nebo;
        float lice = mix(back, 1.0, smoothstep(-0.2, 0.25, nq.z));   // stražnja strana tamnija
        float dubina = mix(1.0, clamp(0.62 + 0.42 * q.z, 0.25, 1.15), lit);
        float treptaj = 0.84 + 0.16 * sin(uTime * (1.5 + 2.0 * aRnd.w) + aRnd.y * 40.0);
        treptaj = mix(treptaj, 1.0 + 1.1 * max(0.0, sin(uTime * 2.1 + aRnd.x * 50.0)), iskra);
        // etiketa gledana ukoso: točkice se na zaslonu zbiju (gustoća raste kao
        // 1 / |nz|), a papir ukoso ne smije zasvijetliti kao bijela crta;
        // poleđina se vidi kroz tekućinu, pa je još tamnija
        treptaj *= mix(1.0, clamp(abs(nq.z) * 1.1, 0.1, 1.0) * (nq.z < 0.0 ? 0.6 : 1.0), papir);
        vCol = vec4(col * mix(1.0, svjetlo, lit) * lice * (1.0 - 0.45 * sjenaPrstena), alpha * treptaj * dubina);
      }
    `;

    const FS = `
      precision mediump float;
      varying vec4 vCol;
      void main() {
        vec2 d = gl_PointCoord * 2.0 - 1.0;
        float r = dot(d, d);
        if (r > 1.0) discard;
        gl_FragColor = vec4(vCol.rgb, vCol.a * (1.0 - 0.6 * r));
      }
    `;

    // SATURN: prsten (male bočice i prašina) ima svoj program; svjetlo,
    // boje i točkice su kao u glavnom (vidi VS), a za fragmente se koristi FS
    const PRSTEN_VS = `
      precision highp float;

      attribute vec4 aRnd;     // slučajni brojevi 0..1
      attribute vec4 aA;       // bočica: mjesto u bočici (xyz; visina bočice = 1, y = 0 dno) i kod (vrsta + 4 · bočica); prašina: polumjer, kut, visina, −1 − pojas
      attribute vec4 aB;       // bočica: normala (xyz) i brid (0/1); prašina: jačina, nijansa

      uniform float uTime;
      uniform vec4 uPrsten;    // x: vrijeme od kraja nastanka flakona (s, prije toga negativno), y: rastapanje (0..1), z: okret staze (rad), w: jačina točkica bočica
      uniform vec4 uMjera;     // x: polumjer staze bočica, y: visina sredine prstena, z: jačina točkica prašine
      uniform mat3 uRotP;      // nagib i zakret prstena (i nagib prema mišu)
      uniform mat3 uRotM;      // male bočice stoje uspravno (nagib prema nama i mišu)
      uniform vec4 uMini[${BROJ_MINI}];       // svaka bočica: kut na stazi, visina, okret, brzina okreta
      uniform vec3 uMiniBoja[${BROJ_MINI}];   // boja tekućine
      uniform float uObris[25];      // pola širine flakona, od dna (-0,86) do vrha (0,9)
      uniform float uExit;
      uniform vec2 uPx;
      uniform vec2 uCenter;
      uniform float uSize;
      uniform vec3 uSilver;
      uniform vec3 uPowder;
      uniform vec3 uGold;
      uniform float uZaklon;   // 1: prvi prolaz, bočice ispred flakona zatamne staklo iza sebe

      varying vec4 vCol;

      const float PI = 3.14159265;
      const float CAM = 4.2;

      vec2 okreni(vec2 v, float k) {
        float c = cos(k), s = sin(k);
        return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
      }
      float glatko5(float k) { return k * k * k * (k * (k * 6.0 - 15.0) + 10.0); }

      // pola širine flakona na visini y (0 izvan flakona)
      float obrisFlakona(float y) {
        float u = clamp((y + 0.86) / 1.76, 0.0, 1.0) * 24.0;
        int i = int(floor(u));
        float a = uObris[i];
        float b = uObris[i < 24 ? i + 1 : 24];
        return mix(a, b, u - float(i)) * step(-0.86, y) * step(y, 0.9);
      }

      void main() {
        float t = uTime, tf = uPrsten.x, izl = uPrsten.y, orb = uPrsten.z;
        float R = uMjera.x;
        float njihanje = 0.018 * sin(t * 0.8);                 // flakon se lagano njiše (vidi flakon()), prsten s njim
        vec3 sredina = vec3(0.0, uMjera.y + njihanje, 0.0);
        vec3 p, n, col;
        float lit, back, alpha;
        float iskra = step(0.994, aRnd.z);

        if (aA.w < -0.5) {
          // PRAŠINA: kruži oko flakona, bliže flakonu brže. Nastanak: iz
          // ekvatora flakona se spiralom odvije u prsten (unutarnji pojasevi
          // prvi); rastapanje: prsten se raširi, digne i izblijedi
          float kn = clamp((tf + 0.6 - 1.4 * (aA.x - 0.5) - 0.7 * aRnd.x) / 1.6, 0.0, 1.0);
          float e = glatko5(kn);
          float fi = aA.y + orb * pow(1.0 / max(aA.x, 0.4), 1.5) + (1.0 - e) * 2.6;
          float rr = mix(0.33 + 0.06 * aRnd.y, aA.x * R, e);
          vec3 q = vec3(cos(fi) * rr, aA.z * e + (1.0 - e) * (aRnd.w - 0.5) * 0.3, sin(fi) * rr);
          float kd = clamp((izl - 0.25 * aRnd.x) / 0.4, 0.0, 1.0);
          float ed = kd * kd * (3.0 - 2.0 * kd);
          q.xz *= 1.0 + 0.22 * ed;
          q.y += (0.05 + 0.2 * aRnd.w) * ed;
          p = uRotP * q + sredina;
          n = vec3(0.0, 0.0, 1.0);
          col = mix(mix(uSilver, uPowder, smoothstep(0.0, 0.5, aB.y)), uGold * 1.1, smoothstep(0.5, 1.0, aB.y));
          lit = 0.0; back = 1.0;
          float uzorak = 0.75 + 0.25 * sin(aA.y * 5.0 + aA.x * 23.0);    // lagane nakupine, da se vidi kruženje
          alpha = uMjera.z * aB.x * uzorak * e * (1.0 + 0.5 * sin(PI * e)) * (1.0 - smoothstep(0.3, 1.0, ed));
          iskra *= step(0.5, aRnd.w);
        } else {
          // MALA BOČICA
          float kod = floor(aA.w + 0.5);
          float bi = floor((kod + 0.5) / 4.0);
          float vrsta = kod - 4.0 * bi;
          int ib = int(bi + 0.5);
          vec4 m = uMini[ib];
          float yL = aA.y;
          // na stazi: uspravna, okreće se oko svoje osi i lagano njiše
          float okret = m.z + t * m.w;
          vec3 lp = vec3(aA.x, aA.y - 0.5, aA.z) * m.y;
          lp.xz = okreni(lp.xz, okret);
          lp.y += 0.01 * sin(t * 1.1 + bi * 1.7);
          vec3 nn = aB.xyz;
          nn.xz = okreni(nn.xz, okret);
          float fi = m.x + orb;
          vec3 cilj = uRotP * vec3(cos(fi) * R, 0.0, sin(fi) * R) + sredina + uRotM * lp;
          vec3 nCilj = uRotM * nn;
          // nastanak 1: s prašinom se odvije iz flakona u oblak oko svog mjesta na stazi
          float k1 = clamp((tf + 0.6 - 0.65 - 0.7 * aRnd.x) / 1.6, 0.0, 1.0);
          float e1 = glatko5(k1);
          float fo = fi + (aRnd.y - 0.5) * 0.7 + (1.0 - e1) * 2.6;
          float ro = mix(0.33 + 0.06 * aRnd.y, R * (0.9 + 0.2 * aRnd.z), e1);
          vec3 oblak = uRotP * vec3(cos(fo) * ro, (aRnd.w - 0.5) * mix(0.3, 0.06, e1), sin(fo) * ro) + sredina;
          // nastanak 2: bočice se jedna za drugom zgusnu iz oblaka; staklo se
          // puni odozdo, čep zadnji, a točkica kratko zasvijetli kad sjedne
          float k2 = clamp((tf - 0.9 - 0.16 * bi - 0.55 * yL - 0.2 * aRnd.x) / 0.8, 0.0, 1.0);
          float e2 = glatko5(k2);
          p = mix(oblak, cilj, e2);
          n = normalize(mix(vec3(0.0, 0.3, 1.0), nCilj, e2) + vec3(0.0, 0.0, 1e-4));
          float obris = pow(1.0 - abs(nCilj.z), 2.5);
          vec3 cb;
          float lb, bb;
          if (vrsta < 0.5) { cb = mix(uSilver, uMiniBoja[ib], 0.75) * (0.7 + 1.0 * obris); lb = 0.75; bb = 0.4; }
          else if (vrsta < 1.5) { cb = uGold * 1.05; lb = 1.0; bb = 0.28; }
          else if (vrsta < 2.5) { cb = uSilver * 0.9 * (0.5 + 1.0 * obris); lb = 0.75; bb = 0.45; }
          else { cb = uSilver * 1.1; lb = 1.0; bb = 0.3; }
          cb *= 1.0 + 0.5 * aB.w;
          float bl = (k2 - 0.82) / 0.07;
          cb *= 1.0 + exp(-bl * bl) * ((vrsta > 0.5 && vrsta < 1.5) ? 1.4 : 0.8);
          // u oblaku je kao prašina
          col = mix(mix(uPowder, uGold * 1.1, 0.4), cb, e2);
          lit = mix(0.0, lb, e2);
          back = mix(1.0, bb, e2);
          alpha = mix(uMjera.z * 0.5 * e1 * (1.0 + 0.5 * sin(PI * e1)), uPrsten.w, e2);
          // rastapanje (odozgo, kao flakon): bočica se rasprši u zlatnu prašinu
          // koja odleti niz stazu
          float kd = clamp((izl - 0.15 * (1.0 - yL) - 0.1 * aRnd.x) / 0.3, 0.0, 1.0);
          if (kd > 0.0) {
            float ed = kd * kd * (3.0 - 2.0 * kd);
            vec3 smjer = uRotP * vec3(sin(fi), 0.0, -cos(fi));
            vec3 van = uRotP * vec3(cos(fi), 0.0, sin(fi));
            p += (smjer * (0.1 + 0.25 * aRnd.y) + van * 0.12 * aRnd.z + vec3(0.0, 0.08 + 0.14 * aRnd.w, 0.0) + (aRnd.yzw - 0.5) * 0.1) * ed;
            col = mix(col, mix(uPowder, uGold * 1.1, 0.5), ed);
            lit = mix(lit, 0.0, ed);
            back = mix(back, 1.0, ed);
            alpha *= 1.0 - smoothstep(0.35, 1.0, ed);
          }
        }

        // "Početak": točkice se rasprše prema van i gore, kao i ostale
        if (uExit > 0.0) {
          float ke = clamp(uExit * 1.45 - aRnd.x * 0.45, 0.0, 1.0);
          ke = ke * ke * (3.0 - 2.0 * ke);
          vec3 smjer = normalize(p + (aRnd.yzw - 0.5) * 0.8 + vec3(0.0, 0.25, 0.0));
          p += smjer * ke * 1.5 + vec3(0.0, 0.45, 0.0) * ke;
          alpha *= 1.0 - ke;
        }

        vec3 q = p;
        vec3 nq = normalize(n);
        float persp = CAM / (CAM - q.z);
        gl_Position = vec4(q.x * uPx.x * persp + uCenter.x, q.y * uPx.y * persp + uCenter.y, 0.0, 1.0);
        gl_PointSize = uSize * persp * (1.0 + iskra * 0.7);
        // izmaglica se pri rubu prozora utopi (ne odreže je rub)
        alpha *= 1.0 - smoothstep(0.93, 1.0, abs(gl_Position.x));
        if (uZaklon > 0.5) {
          // bočica ispred flakona: veća tamna točkica, pa bočica zakrije staklo
          // flakona iza sebe (bočica se zatim nacrta preko, u drugom prolazu)
          gl_PointSize = uSize * persp * 2.6;
          vCol = vec4(0.0, 0.0, 0.0, 0.18 * smoothstep(0.0, 0.15, q.z) * clamp(alpha / max(uPrsten.w, 1e-3), 0.0, 1.0));
          return;
        }

        // iza flakona: staklo flakona ga gotovo zakrije
        float w = obrisFlakona(q.y * persp - njihanje);
        alpha *= 1.0 - 0.72 * (1.0 - smoothstep(w - 0.02, w + 0.03, abs(q.x * persp))) * (1.0 - smoothstep(-0.12, 0.0, q.z));

        // svjetlo gore lijevo (kao u glavnom programu)
        vec3 L = normalize(vec3(-0.5, 0.62, 0.6));
        vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
        // sjena flakona na prstenu: zraka od točkice prema svjetlu prolazi kroz flakon
        float sd = -(q.x * L.x + q.z * L.z) / (L.x * L.x + L.z * L.z);
        float ws = obrisFlakona(q.y + sd * L.y - njihanje);
        float sjena = step(0.0, sd) * (1.0 - smoothstep(ws - 0.04, ws + 0.02, length(q.xz + sd * L.xz)));

        float dif = max(dot(nq, L), 0.0);
        float spe = pow(max(dot(nq, H), 0.0), 26.0);
        float rub = pow(1.0 - abs(nq.z), 2.2);
        float nebo = smoothstep(-0.08, 0.3, nq.y);
        float svjetlo = 0.08 + 0.7 * dif + 1.5 * spe + 0.6 * rub + 0.28 * nebo;
        float lice = mix(back, 1.0, smoothstep(-0.2, 0.25, nq.z));
        float dubina = mix(1.0, clamp(0.62 + 0.42 * q.z, 0.25, 1.15), lit);
        float treptaj = 0.84 + 0.16 * sin(uTime * (1.5 + 2.0 * aRnd.w) + aRnd.y * 40.0);
        treptaj = mix(treptaj, 1.0 + 1.1 * max(0.0, sin(uTime * 2.1 + aRnd.x * 50.0)), iskra);
        vCol = vec4(col * mix(1.0, svjetlo, lit) * lice * (1.0 - 0.7 * sjena), alpha * treptaj * dubina);
      }
    `;
    const UNIFORME_PRSTENA = ['uTime', 'uPrsten', 'uMjera', 'uRotP', 'uRotM', 'uMini', 'uMiniBoja', 'uObris', 'uExit',
      'uPx', 'uCenter', 'uSize', 'uSilver', 'uPowder', 'uGold', 'uZaklon'];
    const JACINA_PRASINE = 0.42;   // jačina točkica prašine (najsvjetliji pojas) uz 13 500 točkica prašine

    const UNIFORME = ['uTime', 'uOd', 'uDo', 'uProg', 'uIntro', 'uExit', 'uRotA', 'uRotB', 'uPx', 'uCenter', 'uSize',
      'uSweep', 'uAlpha', 'uTxt', 'uSilver', 'uPowder', 'uGold', 'uSredina',
      'uMar', 'uPenKut', 'uAlphaPen', 'uPenGore', 'uPenDolje', 'uPenMjesto', 'uPenGlava', 'uSloj', 'uPrstenSjena', 'uRotP'];
    const ATRIBUTI = [['aSph', 3, 0], ['aTxt', 3, 3], ['aRnd', 4, 6], ['aFla', 4, 10], ['aFlaN', 3, 14]];
    // jačina točkica (objekt, flakon, natpis) uz 26 000 točkica na računalu i
    // 16 000 na mobitelu; uz više točkica prva dva se smanje s gustoca^-0,65
    // (vidi nacrtaj), a natpis prema broju točkica na piksel (vidi velicina);
    // natpis je najgušći pa ima najslabije točkice
    const JACINA = [0.9, 0.7, 0.18];
    // logotipi: jačina uz MAR_GUSTOCA px² logotipa po točkici (oko 56 000 točkica
    // na zidu širine 394 px); uz drukčiju gustoću se prilagodi (vidi velicina)
    const JACINA_MAREK = 0.26, MAR_GUSTOCA = 0.28;
    const JACINA_PEN = 0.9;        // Penhaligon bočice uz 26 000 točkica po bočici u punoj veličini (S = 175)


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
        // SATURN: vrijeme od kraja nastanka flakona i rastapanje flakona (0..1)
        st.prsten = [c - POCETAK_FLAKONA, f.oblik === 'flakon' && f.prijelaz ? tau / f.d : 0];
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
    //  ANIMACIJA — WebGL platno koje crta točkice
    // ═══════════════════════════════════════════════════════════════════
    function napraviAnimaciju(platno, scena, dogadaji) {
      const POD = boja01(B.podloga);
      let gl = null, program = null, spremnik = null, U = {}, n = 0, pola = 0.12, slova = 1, povecanje = 1, jacinaSlova = JACINA[2];
      let spremnikPen = null, penSpreman = false, penPodaci = null, jacinaPen = JACINA_PEN, gustoca = 1, A = {};
      let spremnikGusti = null, brojGustih = 0;   // gusti sloj Penhaligon bočica
      let spremnikMar = null, markeSpremne = false, marPodaci = null, jacinaMar = JACINA_MAREK, skalaMar = 1, pasMar = 1.1;
      let dodaciTrazeni = false;
      // SATURN: prsten oko flakona (vlastiti program i spremnik)
      let programPrstena = null, spremnikPrs = null, prsPodaci = null, prsSpreman = false, U2 = {};
      let polumjerPrs = 1, jacinaMini = 0.4, jacinaPrasine = JACINA_PRASINE, velicinaTocke = 1;
      // krugovi sa i bez logotipa i Penhaligon bočica (svaki se napravi kad zatreba)
      const tijekovi = {};
      function tijekZa(m, p) {
        const kljuc = (m ? 'm' : '-') + (p ? 'p' : '-');
        return tijekovi[kljuc] || (tijekovi[kljuc] = napraviTijek(m, p, m ? marPodaci.stranice.length : 1));
      }
      const tijekBez = tijekZa(false, false);
      function izaberiKrug() { return tijekZa(!!(P.marke && markeSpremne && marPodaci), !!(P.penhaligon && penSpreman)); }
      // krug koji je u tijeku: logotipi i Penhaligon bočice uključe se čim su
      // pripremljeni, ali krug se ne mijenja usred prikaza: samo dok novi i
      // stari krug još teku jednako (do kraja mirovanja flakona, a ako oba
      // imaju logotipe, do kraja mirovanja logotipa), inače od sljedećeg kruga
      let krugOd = 0, krugTijek = tijekBez, krugZadnje = -1;
      function tijek(t) {
        if (t < tijekBez.pojava) return tijekBez.stanje(t, -1);
        const u = t - tijekBez.pojava;
        if (u < krugZadnje || krugZadnje < 0) { krugOd = 0; krugTijek = izaberiKrug(); }
        krugZadnje = u;
        const novi = izaberiKrug();
        if (novi !== krugTijek && u - krugOd < (novi.imaMarke && krugTijek.imaMarke ? krugTijek.krajMarki : krugTijek.zajednicko)) krugTijek = novi;
        if (!P.ponavljaj) return krugTijek.stanje(t, Math.min(u, krugTijek.natpisOd + 0.001));
        while (u - krugOd >= krugTijek.L) { krugOd += krugTijek.L; krugTijek = izaberiKrug(); }
        return krugTijek.stanje(t, u - krugOd);
      }
      let spremno = false, unisteno = false, priprema = null;
      let raf = 0, vrti = false, vrijeme = 0, zadnje = 0;
      let izlazOd = -1, izlazTrajanje = 1.1, izlazGotov = null;
      let W = 1, H = 1, dpr = 1, S = 160, sx = 0, sy = 0;
      let misX = 0, misY = 0, nagibX = 0, nagibY = 0;
      let podnaslov = null;

      // 1. dio: WebGL i prevođenje shadera; gdje preglednik to zna, shader se
      //    prevodi usporedo (KHR_parallel_shader_compile) dok se računaju oblici
      let sh = null, usporedo = null;
      function pocniGL() {
        const opcije = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false };
        gl = platno.getContext('webgl', opcije) || platno.getContext('experimental-webgl', opcije);
        if (!gl) return false;
        usporedo = gl.getExtension('KHR_parallel_shader_compile');
        sh = [gl.createShader(gl.VERTEX_SHADER), gl.createShader(gl.FRAGMENT_SHADER)];
        gl.shaderSource(sh[0], VS);
        gl.shaderSource(sh[1], FS);
        gl.compileShader(sh[0]);
        gl.compileShader(sh[1]);
        program = gl.createProgram();
        gl.attachShader(program, sh[0]);
        gl.attachShader(program, sh[1]);
        // atribut 0 mora uvijek biti uključen: aRnd ima i gusti sloj Penhaligon bočica
        gl.bindAttribLocation(program, 0, 'aRnd');
        gl.linkProgram(program);
        return true;
      }
      function cekajShader() {
        return new Promise(function (gotovo) {
          (function provjeri() {
            if (unisteno || !usporedo || gl.isContextLost() || gl.getProgramParameter(program, usporedo.COMPLETION_STATUS_KHR)) gotovo();
            else setTimeout(provjeri, 16);
          })();
        });
      }
      // 2. dio: podaci o točkicama idu u grafičku karticu
      function dovrsiGL(oblici) {
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.warn('[Martimex] Početni ekran – shader:', gl.getShaderInfoLog(sh[0]) || gl.getShaderInfoLog(sh[1]) || gl.getProgramInfoLog(program));
          return false;
        }
        gl.useProgram(program);
        spremnik = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnik);
        gl.bufferData(gl.ARRAY_BUFFER, oblici.podaci, gl.STATIC_DRAW);
        ATRIBUTI.forEach(function (a) {
          const mjesto = gl.getAttribLocation(program, a[0]);
          if (mjesto < 0) return;
          gl.enableVertexAttribArray(mjesto);
          gl.vertexAttribPointer(mjesto, a[1], gl.FLOAT, false, VELICINA_TOCKE * 4, a[2] * 4);
        });
        UNIFORME.forEach(function (u) { U[u] = gl.getUniformLocation(program, u); });
        ATRIBUTI.concat([['aMar'], ['aPen']]).forEach(function (a) { A[a[0]] = gl.getAttribLocation(program, a[0]); });
        gl.uniform4fv(U.uPenMjesto, new Float32Array([].concat.apply([], PEN_RASPORED)));
        gl.uniform1fv(U.uPenGlava, new Float32Array(PEN_GLAVA));
        gl.uniform1f(U.uSloj, 0);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);           // točkice se zbrajaju (svjetlo)
        gl.uniform3fv(U.uSilver, boja01(B.srebro));
        gl.uniform3fv(U.uPowder, boja01(B.puder));
        gl.uniform3fv(U.uGold, zasiti(boja01(B.zlato), 1.2));
        gl.uniform1fv(U.uSredina, new Float32Array(oblici.sredine));
        n = oblici.n;
        pola = oblici.pola;
        slova = oblici.slova;
        // gustoća prema broju točkica za koji je izgled podešen (vidi JACINA)
        gustoca = n / (MOBITEL ? 16000 : 26000);
        spremnikPen = null; spremnikGusti = null; brojGustih = 0; penSpreman = false;
        if (penPodaci) dovrsiPen(penPodaci);
        spremnikMar = null; markeSpremne = false;
        if (marPodaci) dovrsiMarke(marPodaci);
        programPrstena = null; spremnikPrs = null; prsSpreman = false;
        if (prsPodaci) dovrsiPrsten(prsPodaci);
        return true;
      }

      // Logotipi i Penhaligon bočice se računaju zadnji, postupno u stankama
      // preglednika (jednom; ne uz "Smanji pokrete", jer se tada ne prikazuju)
      function trebaDodatke() {
        if (dodaciTrazeni || MIRNO.matches || !OBLICI) return;
        dodaciTrazeni = true;
        if (P.marke) OBLICI.then(pripremiMarke).then(function (mm) { if (mm && !unisteno) dovrsiMarke(mm); });
        if (P.penhaligon) OBLICI.then(pripremiPenhaligon).then(function (pp) { if (pp && !unisteno) dovrsiPen(pp); });
        if (P.saturn) OBLICI.then(pripremiPrsten).then(function (pr) { if (pr && !unisteno) dovrsiPrsten(pr); });
      }

      // SATURN: prsten ima vlastiti program (PRSTEN_VS, isti FS) i spremnik;
      // dodaje se kad je izračunat, do tada je flakon bez prstena
      function dovrsiPrsten(pr) {
        prsPodaci = pr;
        if (!gl || gl.isContextLost() || !spremnik || programPrstena) return;
        const v = gl.createShader(gl.VERTEX_SHADER), f = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(v, PRSTEN_VS); gl.compileShader(v);
        gl.shaderSource(f, FS); gl.compileShader(f);
        const pg = gl.createProgram();
        gl.attachShader(pg, v); gl.attachShader(pg, f);
        gl.bindAttribLocation(pg, 0, 'aRnd');
        gl.bindAttribLocation(pg, 1, 'aA');
        gl.bindAttribLocation(pg, 2, 'aB');
        gl.linkProgram(pg);
        if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) {
          console.warn('[Martimex] Prsten – shader:', gl.getShaderInfoLog(v) || gl.getShaderInfoLog(f) || gl.getProgramInfoLog(pg));
          return;
        }
        programPrstena = pg;
        spremnikPrs = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnikPrs);
        gl.bufferData(gl.ARRAY_BUFFER, pr.podaci, gl.STATIC_DRAW);
        gl.useProgram(pg);
        UNIFORME_PRSTENA.forEach(function (u) { U2[u] = gl.getUniformLocation(pg, u); });
        gl.uniform3fv(U2.uSilver, boja01(B.srebro));
        gl.uniform3fv(U2.uPowder, boja01(B.puder));
        gl.uniform3fv(U2.uGold, zasiti(boja01(B.zlato), 1.2));
        gl.uniform4fv(U2.uMini, pr.mini);
        gl.uniform3fv(U2.uMiniBoja, pr.boje);
        gl.uniform1fv(U2.uObris, pr.obris);
        vratiGlavne();
        prsSpreman = true;
        velicina();
        (window.__mxPokus = window.__mxPokus || {}).prsten = true;   // (za snimanje pokusa)
      }

      // Natrag na glavni program i njegove spremnike (nakon prstena)
      function vratiGlavne() {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnik);
        ATRIBUTI.forEach(function (a) {
          if (A[a[0]] < 0) return;
          gl.enableVertexAttribArray(A[a[0]]);
          gl.vertexAttribPointer(A[a[0]], a[1], gl.FLOAT, false, VELICINA_TOCKE * 4, a[2] * 4);
        });
        [['aMar', spremnikMar], ['aPen', spremnikPen]].forEach(function (a) {
          const mj = A[a[0]];
          if (!(mj >= 0)) return;
          if (!a[1]) { gl.disableVertexAttribArray(mj); return; }
          gl.bindBuffer(gl.ARRAY_BUFFER, a[1]);
          gl.enableVertexAttribArray(mj);
          gl.vertexAttribPointer(mj, 4, gl.FLOAT, false, 16, 0);
        });
      }

      // SATURN: crtanje prstena (iza glavnog sloja, aditivno kao i sve ostalo)
      function nacrtajPrsten(st, t, rotP, rotM, izlaz) {
        gl.useProgram(programPrstena);
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnikPrs);
        [['aRnd', 0, 32], ['aA', 1, 0], ['aB', 2, 16]].forEach(function (a) {
          gl.enableVertexAttribArray(a[1]);
          gl.vertexAttribPointer(a[1], 4, gl.FLOAT, false, 48, a[2]);
        });
        gl.uniform1f(U2.uTime, t);
        gl.uniform4f(U2.uPrsten, st.prsten[0], st.prsten[1], -PRSTEN_BRZINA * st.prsten[0], jacinaMini);
        gl.uniform4f(U2.uMjera, polumjerPrs, PRSTEN_Y, jacinaPrasine, 0);
        gl.uniformMatrix3fv(U2.uRotP, false, rotP);
        gl.uniformMatrix3fv(U2.uRotM, false, rotM);
        gl.uniform1f(U2.uExit, izlaz);
        gl.uniform2f(U2.uPx, 2 * S / W, 2 * S / H);
        gl.uniform2f(U2.uCenter, 2 * sx / W - 1, 1 - 2 * sy / H);
        gl.uniform1f(U2.uSize, velicinaTocke);
        // 1. bočice ispred flakona zatamne staklo iza sebe; 2. cijeli prsten (aditivno)
        gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform1f(U2.uZaklon, 1);
        gl.drawArrays(gl.POINTS, 0, prsPodaci.nB);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.uniform1f(U2.uZaklon, 0);
        gl.drawArrays(gl.POINTS, 0, prsPodaci.n);
        vratiGlavne();
      }

      // Logotipi: vlastiti spremnik (atribut aMar), dodaje se kad su
      // izračunati; do tada je aMar isključen i krug ide bez njih
      function dovrsiMarke(mm) {
        marPodaci = mm;
        if (!gl || gl.isContextLost() || !spremnik || spremnikMar) return;
        const mjesto = gl.getAttribLocation(program, 'aMar');
        if (mjesto < 0) return;
        spremnikMar = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnikMar);
        gl.bufferData(gl.ARRAY_BUFFER, mm.podaci, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(mjesto);
        gl.vertexAttribPointer(mjesto, 4, gl.FLOAT, false, 16, 0);
        mjereMarki();
        markeSpremne = true;
        (window.__mxPokus = window.__mxPokus || {}).marke = true;   // (za snimanje pokusa)
      }

      // Penhaligon bočice: vlastiti spremnik (atribut aPen), dodaje se kad su
      // izračunate; do tada je aPen isključen i krug ide bez njih
      function dovrsiPen(pp) {
        penPodaci = pp;
        if (!gl || gl.isContextLost() || !spremnik || spremnikPen) return;
        const mjesto = gl.getAttribLocation(program, 'aPen');
        if (mjesto < 0) return;
        spremnikPen = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnikPen);
        gl.bufferData(gl.ARRAY_BUFFER, pp.podaci, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(mjesto);
        gl.vertexAttribPointer(mjesto, 4, gl.FLOAT, false, 16, 0);
        if (pp.brojGustih) {
          spremnikGusti = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, spremnikGusti);
          gl.bufferData(gl.ARRAY_BUFFER, pp.gusti, gl.STATIC_DRAW);
          brojGustih = pp.brojGustih;
        }
        gl.uniform3fv(U.uPenGore, pp.gore);
        gl.uniform3fv(U.uPenDolje, pp.dolje);
        penSpreman = true;
        velicina();                                   // jačina točkica prema njihovu broju
        (window.__mxPokus = window.__mxPokus || {}).pen = true;     // (za snimanje pokusa)
      }

      // Gusti sloj Penhaligon bočica crta se istim programom (uSloj = 1), iz
      // svog spremnika: [mjesto i kod (kao aPen), 4 slučajna broja (aRnd)];
      // ostali atributi su za to vrijeme isključeni (shader ih ne čita)
      function nacrtajGusti() {
        const ostali = ['aSph', 'aTxt', 'aFla', 'aFlaN', 'aMar'];
        ostali.forEach(function (a) { if (A[a] >= 0) gl.disableVertexAttribArray(A[a]); });
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnikGusti);
        gl.vertexAttribPointer(A.aPen, 4, gl.FLOAT, false, 32, 0);
        gl.vertexAttribPointer(A.aRnd, 4, gl.FLOAT, false, 32, 16);
        gl.uniform1f(U.uSloj, 1);
        gl.drawArrays(gl.POINTS, 0, brojGustih);
        gl.uniform1f(U.uSloj, 0);
        // natrag na glavni sloj
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnik);
        ATRIBUTI.forEach(function (a) {
          if (A[a[0]] < 0) return;
          gl.enableVertexAttribArray(A[a[0]]);
          gl.vertexAttribPointer(A[a[0]], a[1], gl.FLOAT, false, VELICINA_TOCKE * 4, a[2] * 4);
        });
        if (spremnikMar && A.aMar >= 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, spremnikMar);
          gl.enableVertexAttribArray(A.aMar);
          gl.vertexAttribPointer(A.aMar, 4, gl.FLOAT, false, 16, 0);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnikPen);
        gl.vertexAttribPointer(A.aPen, 4, gl.FLOAT, false, 16, 0);
      }

      // Oblici + WebGL; poziva se unaprijed (kad preglednik miruje) ili pri otvaranju
      function pripremi() {
        if (priprema) return priprema;
        priprema = Promise.resolve().then(function () {
          if (unisteno) return false;
          if (!pocniGL()) { dogadaji.bezAnimacije(); return false; }
          return pripremiOblike().then(function (oblici) {
            return cekajShader().then(pauza).then(function () {
              if (unisteno || gl.isContextLost()) return false;      // izgubljen kontekst: vidi webglcontextrestored
              if (!dovrsiGL(oblici)) { dogadaji.bezAnimacije(); return false; }
              velicina();
              nacrtaj(0);                               // prvo crtanje unaprijed, a ne tek pri otvaranju
              spremno = true;
              trebaDodatke();
              return true;
            });
          });
        }).catch(function (e) {
          console.warn('[Martimex] Početni ekran bez animacije:', e);
          dogadaji.bezAnimacije();
          return false;
        });
        return priprema;
      }

      function velicina() {
        if (!gl) return;
        W = Math.max(1, platno.clientWidth); H = Math.max(1, platno.clientHeight);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        const pw = Math.round(W * dpr), ph = Math.round(H * dpr);
        if (platno.width !== pw || platno.height !== ph) { platno.width = pw; platno.height = ph; }
        gl.viewport(0, 0, pw, ph);
        // prostor za animaciju je .mx-p-animacija (345 × 393 px na dnu
        // okvira ispod zaglavlja); oblici ga ispune, a velicinaAnimacije ih
        // poveća (sve oblike: najviši sežu 0,9 jedinica od sredine). Natpis
        // MARTIMEX (širok 2,25 jedinica) smije izaći iz tog prostora, ali ne
        // i iz prozora: ako ne stane s RUB_NATPISA px sa svake strane, smanji
        // se (povecanje < 1). Položaj se zbraja po offsetParentima do platna
        // (ne getBoundingClientRect, da ga ne pomakne Voiceflowovo skaliranje
        // prozora pri otvaranju)
        const sw = Math.max(1, scena.offsetWidth), sh = Math.max(1, scena.offsetHeight);
        S = Math.max(40, Math.min(sw / 2.15, sh / 2.3) * VELICINA);
        let ox = 0, oy = 0;
        for (let e = scena; e && e !== platno.offsetParent; e = e.offsetParent) { ox += e.offsetLeft; oy += e.offsetTop; }
        sx = ox + sw / 2;
        sy = oy + sh / 2;
        // (nagib prema mišu natpis u perspektivi malo raširi, do 4 %)
        const slobodno = 2 * Math.min(sx, W - sx) - 2 * RUB_NATPISA;
        povecanje = Math.max(0.3, Math.min(1, slobodno / (SIRINA_NATPISA * S * (P.nagibPremaMisu && MIS ? 1.04 : 1))));
        // natpis je gust: jačina njegovih točkica ovisi o tome koliko ih dođe na
        // piksel (mjera je 16000 točkica i 184 px po jedinici), da na svakom
        // uređaju i prozoru sjaji jednako
        jacinaSlova = JACINA[2] * Math.min(1.6, Math.max(0.1, 16000 / Math.max(1, n) * povecanje * S / 184));
        // Penhaligon bočice: jačina prema tome koliko točkica dođe na piksel
        // (mjera je 26 000 točkica po bočici u punoj veličini, S = 175)
        // (svaka bočica ima točkica razmjerno svojoj površini na ekranu, vidi PEN_POVRSINA)
        const srednja = PEN_KORAK.reduce(function (z, k) { return z + k * k; }, 0) / PEN_IDS.length;
        const povrsinaPen = PEN_KORAK.reduce(function (z, k, b) { return z + k * k / srednja * Math.pow(PEN_RASPORED[b][2] * povecanje * S, 2); }, 0);
        const naPikselu = (penPodaci ? penPodaci.ukupno : n) / Math.max(1, povrsinaPen);
        jacinaPen = JACINA_PEN * Math.min(1.6, Math.max(0.25, 26000 / (175 * 175) / Math.max(1e-6, naPikselu)));
        pasMar = sh / 2 / S;
        mjereMarki();
        // SATURN: prsten (s prašinom do PRSTEN_RUB) uvijek stane u prozor, a
        // točkice bočica sjaje kao flakon: jačina prema razmaku niti (flakon
        // ima oko 3,9 jedinica² površine)
        polumjerPrs = Math.max(0.6, Math.min(1, (Math.min(sx, W - sx) - 10) / S / PRSTEN_RUB));
        if (prsPodaci) {
          const korakFlakona = Math.sqrt(3.9 * OMJER / Math.max(1, n));
          const g0 = Math.min(2, Math.max(0.25, Math.pow(gustoca, -0.65)));
          jacinaMini = JACINA[1] * g0 * Math.pow(prsPodaci.korak / korakFlakona, 2) * 1.5;
          jacinaPrasine = JACINA_PRASINE * Math.pow(13500 / Math.max(1, prsPodaci.n - prsPodaci.nB), 0.8);
        }
        dogadaji.mjere(sh / 2 + pola * povecanje * S + 20);   // podnaslov ispod natpisa
        if (!vrti && spremno) nacrtaj(MIRNO.matches ? 99 : vrijeme);
      }

      // Logotipi se vide u prostoru animacije (pola visine pasMar): zid je
      // širok kao natpis, a ako stranica ne stane po visini (s rubom MAR_RUB
      // u kojem se logotipi rastapaju), smanji se. Jačina točkica prema
      // tome koliko px² logotipa dođe na točkicu (vidi MAR_GUSTOCA)
      function mjereMarki() {
        if (!marPodaci) return;
        const najvisa = Math.max.apply(null, marPodaci.stranice.map(function (s) { return s.pola; }));
        skalaMar = Math.max(0.3, Math.min(povecanje, (pasMar - MAR_RUB) / Math.max(0.01, najvisa)));
        const pxPoTocki = marPodaci.tinta * Math.pow(skalaMar * S, 2) / Math.max(1, n);
        jacinaMar = JACINA_MAREK * Math.min(2, Math.max(0.3, pxPoTocki / MAR_GUSTOCA));
      }

      function matrica(kutY, nagib, valjanje) {
        const cy = Math.cos(kutY), sy_ = Math.sin(kutY), cx = Math.cos(nagib), sx_ = Math.sin(nagib);
        const cz = Math.cos(valjanje), sz = Math.sin(valjanje);
        // Rx(nagib) · Ry(kutY)
        const m = [
          [cy, 0, sy_],
          [sx_ * sy_, cx, -sx_ * cy],
          [-cx * sy_, sx_, cx * cy]
        ];
        // Rz(valjanje) · m
        const r = [
          [cz * m[0][0] - sz * m[1][0], cz * m[0][1] - sz * m[1][1], cz * m[0][2] - sz * m[1][2]],
          [sz * m[0][0] + cz * m[1][0], sz * m[0][1] + cz * m[1][1], sz * m[0][2] + cz * m[1][2]],
          m[2]
        ];
        // WebGL čita matricu po stupcima
        return [r[0][0], r[1][0], r[2][0], r[0][1], r[1][1], r[2][1], r[0][2], r[1][2], r[2][2]];
      }

      function nacrtaj(t) {
        const mirno = MIRNO.matches;
        let st;
        if (mirno) st = { od: OBLIK.natpis, do: OBLIK.natpis, prog: 0, uvod: 1, A: [0, 0, 0], B: [0, 0, 0], odsjaj: 99, sjaj: 99, podnaslov: true, penKut: 0, stranica: 0 };
        else st = tijek(t);
        const misKut = nagibX * 0.3, misNagib = nagibY * 0.16;          // lagani nagib prema mišu
        const izlaz = izlazOd < 0 ? 0 : sat((vrijeme - izlazOd) / izlazTrajanje);

        gl.clearColor(POD[0], POD[1], POD[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(U.uTime, mirno ? 7 : t);
        gl.uniform1f(U.uOd, st.od);
        gl.uniform1f(U.uDo, st.do);
        gl.uniform1f(U.uProg, st.prog);
        gl.uniform1f(U.uIntro, st.uvod);
        gl.uniform1f(U.uExit, izlaz);
        gl.uniformMatrix3fv(U.uRotA, false, matrica(st.A[0] + misKut, st.A[1] + misNagib, st.A[2]));
        gl.uniformMatrix3fv(U.uRotB, false, matrica(st.B[0] + misKut, st.B[1] + misNagib, st.B[2]));
        gl.uniform2f(U.uPx, 2 * S / W, 2 * S / H);
        gl.uniform2f(U.uCenter, 2 * sx / W - 1, 1 - 2 * sy / H);
        gl.uniform1f(U.uSize, 1.35 * dpr * Math.min(1.25, Math.max(0.8, Math.sqrt(S / 160))));
        gl.uniform2f(U.uSweep, st.sjaj, st.odsjaj);
        gl.uniform2f(U.uTxt, povecanje, slova - 1);
        // više točkica → slabije točkice; ne sasvim razmjerno, jer se svjetlo
        // tada razlije na više sitnijih točkica i oblik bi djelovao tamnije
        const g = Math.min(2, Math.max(0.25, Math.pow(gustoca, -0.65)));
        gl.uniform4f(U.uAlpha, JACINA[0] * g, JACINA[1] * g, jacinaMar, jacinaSlova);
        gl.uniform1f(U.uAlphaPen, jacinaPen);
        gl.uniform1f(U.uPenKut, st.penKut);
        // logotipi: sredina stranice na ekranu dođe u sredinu prostora animacije
        let pomak = 0;
        if (marPodaci) {
          const str = marPodaci.stranice, j = Math.max(0, Math.min(str.length - 1, Math.floor(st.stranica)));
          pomak = -lerp(str[j].sredina, str[Math.min(str.length - 1, j + 1)].sredina, st.stranica - j);
        }
        gl.uniform4f(U.uMar, pomak, skalaMar, pasMar, MAR_RUB);
        // SATURN: prsten se vidi dok je flakon na ekranu (od malo prije kraja
        // nastanka flakona); prsten baca sjenu na flakon kad je složen
        const prsten = prsSpreman && P.saturn && !mirno && st.prsten && st.prsten[0] > -0.8 &&
          (st.od === OBLIK.flakon || st.do === OBLIK.flakon);
        const rotP = matrica(misKut, PRSTEN_NAGIB + misNagib, PRSTEN_VALJANJE);
        gl.uniformMatrix3fv(U.uRotP, false, rotP);
        gl.uniform4f(U.uPrstenSjena, prsten ? glatko((st.prsten[0] - 1.2) / 2) * (1 - glatko(st.prsten[1] / 0.45)) : 0, polumjerPrs, PRSTEN_Y, 0);
        velicinaTocke = 1.35 * dpr * Math.min(1.25, Math.max(0.8, Math.sqrt(S / 160)));
        gl.drawArrays(gl.POINTS, 0, n);
        if (spremnikGusti && penSpreman && (st.od === OBLIK.pen || st.do === OBLIK.pen)) nacrtajGusti();
        if (prsten) nacrtajPrsten(st, mirno ? 7 : t, rotP, matrica(misKut, 0.08 + misNagib, PRSTEN_VALJANJE * 0.4), izlaz);

        if (st.podnaslov !== podnaslov) { podnaslov = st.podnaslov; dogadaji.podnaslov(podnaslov); }
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
        if (MIRNO.matches) { nacrtaj(99); return; }
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
        spremno = false;
        priprema = null;
        spremnik = null; spremnikPen = null; penSpreman = false;   // spremnici izgubljenog konteksta više ne vrijede
        spremnikGusti = null; brojGustih = 0;
        spremnikMar = null; markeSpremne = false;
        programPrstena = null; spremnikPrs = null; prsSpreman = false;
      });
      platno.addEventListener('webglcontextrestored', function () {
        if (unisteno) return;
        pripremi().then(function (ok) { if (ok && dogadaji.otvoreno()) pokreni(); });
      });

      return {
        pripremi: pripremi,
        velicina: velicina,
        // svako otvaranje: animacija ispočetka
        ispocetka: function () {
          HITNO = true;
          trebaDodatke();
          stani();
          vrijeme = 0; izlazOd = -1; izlazGotov = null; podnaslov = null; krugZadnje = -1;
          return pripremi().then(function (ok) { if (ok && dogadaji.otvoreno()) pokreni(); return ok; });
        },
        stani: stani,
        mis: function (x, y) { misX = x; misY = y; },
        izlaz: function (gotovo) {
          if (!spremno || MIRNO.matches) { gotovo(); return; }
          izlazOd = vrijeme;
          izlazGotov = gotovo;
          pokreni();
        },
        unisti: function () {
          unisteno = true;
          stani();
          if (gl && !gl.isContextLost()) {
            gl.deleteBuffer(spremnik);
            if (spremnikPen) gl.deleteBuffer(spremnikPen);
            if (spremnikGusti) gl.deleteBuffer(spremnikGusti);
            if (spremnikMar) gl.deleteBuffer(spremnikMar);
            if (spremnikPrs) gl.deleteBuffer(spremnikPrs);
            if (programPrstena) gl.deleteProgram(programPrstena);
            gl.deleteProgram(program);
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
      OBLICI = null;                                  // oblici više ne trebaju (oslobodi memoriju)
      if (PEN_PREKID) PEN_PREKID.da = true;           // gradnja Penhaligon bočica (ako još traje) staje
      PEN_OBLIK = null; PEN_PREKID = null;
      if (MAR_PREKID) MAR_PREKID.da = true;           // i gradnja logotipa
      MAR_OBLIK = null; MAR_PREKID = null; MAR_SLIKA = null;
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
