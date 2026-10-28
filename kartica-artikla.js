// Ukratko: Kartice proizvoda koje Marti preporuči
(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — kartice preporučenih proizvoda za Marti (v33)
  //
  //  ProductCardExtension → trace "ext_product_card"
  //  Kartice idu jedna ispod druge. Kad stigne samo jedan proizvod,
  //  prikazuje se istaknuta kartica (ista kartica, samo smije biti šira).
  //
  //  Payload koji funkcija šalje ostaje isti:
  //   { cards: [{ title, price, description, url, imageUrl }] }
  //  Neobavezna polja (prikažu se samo ako postoje):
  //   oldPrice → artikl je na akciji: stara cijena se precrta, ispod nje je
  //              nova, a pokraj njih voštani pečat s postotkom popusta
  //   promo    → promo kod koji vrijedi za artikl:
  //              { code: "MRTMX", percent: 30, validUntil: "2026-10-31" }
  //              (isto kao ravna polja promoCode, promoPercent, promoPrice,
  //              promoValidUntil). Umjesto percent može price (cijena s kodom);
  //              dovoljno je jedno. validUntil je neobavezan; kad je prošao, kod
  //              se ne prikazuje. Precrta se trenutna cijena, nova je cijena s
  //              kodom, a ispod nje diskretno piše "uz kod MRTMX".
  //              Kad su i akcija i kod: precrtana je redovna cijena, nova je
  //              cijena s kodom, a pečat pokazuje ukupni popust
  //   hideDescription: true → kartica bez crte i opisa: gornji dio (slika,
  //              marka, naziv, cijena) i gumb ostaju isti. Vrijedi za cijeli
  //              prikaz ({ cards: [...], hideDescription: true }, tako šalje
  //              playbook "Trazilica")
  //   brandLogo → adresa loga marke (https://...). Danas ga funkcije ne šalju:
  //              logo se uzima sa stranice proizvoda (vidi LOGO MARKE niže), a
  //              ovo polje je za kasnije, ako ga počnu slati n8n ili Voiceflow
  //
  //  Raspored kartice:
  //   ┌────────────────────────────┐
  //   │    ┌───────┐  MARKA        │
  //   │    │ SLIKA │  Naziv        │
  //   │    │       │  Eau de Toil. │
  //   │    │       │  ──           │
  //   │    └───────┘  CIJENA       │
  //   │ ────────────────────────── │
  //   │    Opis artikla, malo      │
  //   │    uži od kartice          │
  //   │     [ Pogledaj proizvod ]  │
  //   └────────────────────────────┘
  //   Na proizvod vodi samo gumb, i to u istom prozoru (bez novih kartica).
  //   Kratak naziv (Versace Eros): gornji dio je podijeljen na dvije jednake
  //   polovice (širine opisa); tekst počinje na desnoj, poravnat ulijevo, a
  //   bočica je na sredini lijeve. Dulji naziv: slika i tekst centrirani su
  //   kao cjelina (bočica je od lijevog ruba jednako daleko kao tekst od desnog).
  //
  //  Marka i naziv složeni su kao natpis na etiketi bočice:
  //   - marka je logo marke (crni, kao iznad naziva na stranici proizvoda),
  //     poravnat ulijevo s tekstom ispod; kad logo nije poznat ili se ne
  //     učita, marka je ispisana sitnim, razmaknutim velikim slovima (XERJOFF)
  //   - naziv je u otmjenom serifnom fontu (Cormorant Garamond) i na oko je
  //     jednako velik kao marka
  //   - vrsta mirisa ("Eau de Parfum", "Extrait de Parfum"...) odvaja se s
  //     kraja naziva u zaseban redak, istim slovima kao marka (velika,
  //     razmaknuta), ali sitnijim, tanjim i sivim, pa je diskretna; uobičajena
  //     vrsta s volumenom (EAU DE PARFUM · 100 ML) stane u jedan redak, a dulja
  //     se prelomi tako da točka između dijelova ne ostaje visjeti
  //   - kratka roza crtica odvaja naziv od cijene, a cijena je diskretna
  //   - popust (akcija ili promo kod): preko stare cijene "rukom" je povučena
  //     tanka kosa crta (ne obično precrtavanje fonta), ispod je nova cijena,
  //     malo veća i tamnija, a desno od njih roza voštani pečat s postotkom
  //     (−30 %), kao pečat na kutiji parfema
  //
  //  Fontovi (Jost za tekst, Cormorant Garamond za naziv) nalaze se u mapi
  //  fonts/ ovog repozitorija, pa kartica izgleda jednako na iPhoneu,
  //  Androidu i Windowsima. Oba fonta imaju besplatnu licencu SIL OFL 1.1.
  //
  //  Sitni detalji:
  //   - dvostruki tanki rub kartice, kao na etiketi parfemske bočice
  //     (unutarnja linija se zarumeni kad je miš iznad kartice)
  //   - bočica nema kutiju oko sebe: lebdi na prozirnoj podlozi, u blagoj
  //     auri u bojama i tonovima same bočice (kao da je osvijetljena straga,
  //     pa obojeno staklo baca svjetlo na karticu), s mekom sjenom ispod.
  //     Aura su dvije kopije iste fotografije iza bočice: uzak svijetao sjaj
  //     uz sam rub i širok mekan oreol, obje zamućene, posvijetljene prema
  //     bijeloj i zasićene. Ne treba čitati piksele, pa je aura u boji
  //     bočice i kad je slika s druge domene
  //   - bočica neprestano polako "pluta" gore-dolje na svim uređajima
  //     (mobitel, tablet, računalo): kad se digne, sjena ispod nje se suzi i
  //     posvijetli. Pokret ide preko grafičke kartice (transform), pa je
  //     gladak, bez skakanja po pikselima. Bočice u istoj poruci ne plutaju
  //     u istom ritmu.
  //     Plutanje se vrti samo dok je kartica na ekranu (štedi bateriju), a
  //     isključeno je ako je na uređaju uključeno "Smanji pokrete"
  //   - bijela pozadina fotografije pretvara se u pravu prozirnost (canvas);
  //     kad to nije moguće (slika s druge domene), stapa se CSS-om. Bočica i
  //     aura su u istom omotu koji pluta kao cjelina, pa ih preglednik nikad
  //     ne razdvaja u zasebne slojeve (inače se u Safariju oko bočice zna
  //     pojaviti bijeli pravokutnik)
  //   - fotografija se kvalitetno umanji točno na piksele ekrana u kojima se
  //     prikazuje, pa je preglednik ne mora umanjivati dok se bočica pomiče:
  //     ostaje oštra i dok pluta
  //   - opis je poravnat obostrano (kao u knjizi): tekst uvijek jednako
  //     popuni lijevu i desnu stranu, a duge riječi se po potrebi dijele
  //     po hrvatskim pravilima, da među riječima ne ostanu rupe
  //   - opis je uvučen od rubova kartice, a marka i naziv gore ne smiju ići
  //     desnije od opisa: tekst cijele kartice ima isti desni rub (--mx-uvlaka)
  //   - raspored gornjeg dijela računa se po stvarnim recima teksta (i kad se
  //     naziv prelomi), a centriranje duljeg naziva po stvarnoj širini bočice
  //     izrezane iz fotografije, ne po prozirnom prostoru oko nje; ponovno se
  //     računa kad se promijeni širina chata, učitaju fontovi ili logo marke. Kad stigne
  //     bočica, gornji dio klizne na mjesto zajedno s njezinim dizanjem
  //   - gumb je mala prozirna pilula s tankim tamnim obrubom i sitnim
  //     razmaknutim velikim slovima; kad je miš iznad njega (a na mobitelu samo
  //     dok je prst na njemu) ispuni se tamnom bojom, a tekst postane bijel
  //   - tanka linija koja se prema krajevima gubi odvaja gornji dio od opisa
  //
  //  Mjere: okomito jedan ritam od 20 px (gornji i donji rub, razmaci između
  //  dijelova), lijevo i desno 16 px od ruba kartice; opis je s obje strane
  //  uvučen još malo. Svaka bočica se automatski "izreže" iz fotografije
  //  i postavi u kadar jednako (ista podloga, ista najveća visina), bez obzira
  //  na to koliko bijelog prostora ima originalna fotografija.
  //
  //  Pojava: kad Marti pošalje preporuke, preko kartica prođe blaga
  //  ružičasta izmaglica sa sitnim kapljicama (kao sprej parfema) i
  //  bočice se pojave iz nje, jedna za drugom. Kod popusta pero zatim
  //  precrta staru cijenu, ispod nje izroni nova, a pokraj njih se utisne
  //  pečat. Animacija se vrti samo prvi put; kad se povijest razgovora
  //  ponovno učita, kartice su odmah tu.
  // ═════════════════════════════════════════════════════════════════════


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_POSTAVKE = {
    boje: {                   // uvijek u obliku #rrggbb
      tinta:   '#000000', // crna kao trake u headeru i footeru: naziv, cijena
      marka:   '#e2c3ba', // prašnjava roza kao AI ASISTENTICA u traci chata: marka (VERSACE)
      roza:    '#e2c3ba', // prašnjava roza iza loga: izmaglica, crtica iznad cijene, val oko pečata
      puder:   '#f6ebe7', // najsvjetlija roza: rubovi aure oko bočice
      linija:  '#eee3de', // tanki dvostruki rub kartice (vanjski i unutarnji)
      dim:     '#6b605c', // opis proizvoda
      kartica: '#ffffff', // pozadina kartice
      gumb:    '#2b2522', // gumb "Pogledaj proizvod": obrub i tekst, a kad je miš iznad (ili prst na) njemu, ispuna
      vosak:   '#dfbcb1', // voštani pečat s postotkom popusta
      akcija:  '#a0675a'  // crta preko stare cijene, natpis "uz kod MRTMX", prsten i broj na pečatu
    },

    // Fontovi: sav tekst u Jostu, naziv proizvoda u Cormorant Garamondu.
    // "MX ..." su fontovi iz mape fonts/ ovog repozitorija; ako se iz nekog
    // razloga ne učitaju, vrijedi redom sljedeći font u nizu.
    font: '"MX Jost", "Avenir Next", Avenir, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontNaziva: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    tekstGumba: 'Pogledaj proizvod',

    oznakaRegije: 'Preporučeni proizvodi',   // za čitače zaslona

    // Najviše znakova opisa (reže se na cijeloj riječi). 0 = bez ograničenja
    opisZnakova: 320,

    tekstUzKod: 'uz kod',     // ispod cijene s kodom: "uz kod MRTMX"

    // Logo marke umjesto imena marke. Uzima se sa stranice proizvoda na kojoj
    // je kupac (logo iznad naziva artikla), kad je ista marka kao na kartici,
    // i pamti se u pregledniku, pa se poslije vidi i na drugim stranicama.
    // Kad logo nije poznat ili se ne učita, marka je ispisana slovima.
    logoMarke: {
      prikazi: true,          // false = marka je uvijek ispisana slovima
      visina: 20,             // px: visina loga (širok logo je niži, da ne bude predug)
      najvecaSirina: 120      // px: najveća širina loga (vrlo širok logo, npr. CAROLINA HERRERA)
    }
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX = (function () {
    'use strict';

    const P = MX_POSTAVKE;
    // adresa mape u kojoj je ova skripta (GitHub Pages) — odatle se učitavaju fontovi
    const BAZA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/kartica-artikla.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
    const B = P.boje;
    const LM = (function (o) {
      o = o || {};
      const n = function (v, d, min, max) { v = Number(v); return isFinite(v) && v > 0 ? Math.min(max, Math.max(min, v)) : d; };
      return { prikazi: o.prikazi !== false, visina: n(o.visina, 20, 8, 60), najvecaSirina: n(o.najvecaSirina, 120, 20, 300) };
    })(P.logoMarke);
    const EUR = (function () {
      try { return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }); }
      catch (e) { return { format: function (n) { return n.toFixed(2).replace('.', ',') + '\u00a0€'; } }; }
    })();

    // Prostor slike (širina, visina u CSS px); slika zauzima 90 % visine.
    // Iste brojke koriste i CSS i obrada fotografije.
    const VITRINA = [92, 132];
    const VISINA_SLIKE = 0.9;
    // Kadar obrađene bočice (udio visine/širine prostora slike): bočica stoji
    // na "podlozi" na 90 % visine, najviše do 3 % od vrha, najviše 84 % širine.
    const KADAR = { vrh: 0.03, pod: 0.90, sirina: 0.84 };
    // Koliko je vidljiva bočica široka (udio širine prostora slike) kad je nije
    // moguće izrezati iz fotografije (slika s druge domene), pa se to ne zna
    const PROCJENA_BOCE = 0.55;
    // Ikona bočice kad proizvod nema sliku: nacrtana bočica široka je ~24 px
    const SIRINA_IKONE = 24;

    // Miješanje boja u JS-u (umjesto CSS color-mix) da izgled radi i u starijim preglednicima
    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + a + ')'; }
    function mijesaj(hex1, hex2, udio) {
      const a = rgb(hex1), b = rgb(hex2);
      return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] * udio + b[i] * (1 - udio)); }).join(', ') + ')';
    }

    // Obris voštanog pečata (PECAT × PECAT px): krug s blagim, nepravilnim
    // valovima ruba, kao kapljica voska; uvijek isti
    const PECAT = 40;
    const OBRIS_PECATA = (function () {
      const N = 36, c = PECAT / 2, t = [];
      for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2;
        const r = c - 1.9 + 0.8 * Math.sin(a * 5 + 0.7) + 0.5 * Math.sin(a * 8 + 2.1) + 0.35 * Math.sin(a * 13 + 4);
        t.push([c + r * Math.cos(a), c + r * Math.sin(a)]);
      }
      const sred = function (p, q) { return ((p[0] + q[0]) / 2).toFixed(2) + ' ' + ((p[1] + q[1]) / 2).toFixed(2); };
      let d = 'M' + sred(t[N - 1], t[0]);
      for (let i = 0; i < N; i++) d += ' Q' + t[i][0].toFixed(2) + ' ' + t[i][1].toFixed(2) + ' ' + sred(t[i], t[(i + 1) % N]);
      return d + ' Z';
    })();

    const IKONA_BOCA = '<svg viewBox="0 0 48 64" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" aria-hidden="true"><path d="M19 4.5h10v6.5H19z"/><path d="M21.5 11v4.5M26.5 11v4.5"/><rect x="9.5" y="15.5" width="29" height="44" rx="7"/><path d="M15.5 33.5h17M15.5 38.5h10" stroke-linecap="round" opacity=".55"/></svg>';

    // ── STIL ─────────────────────────────────────────────────────────────
    const CSS = `
      .mx {
        --mx-tinta: ${B.tinta};
        --mx-marka: ${B.marka};
        --mx-roza: ${B.roza};
        --mx-linija: ${B.linija};
        --mx-dim: ${B.dim};
        --mx-kartica: ${B.kartica};
        --mx-cijena: ${mijesaj(B.tinta, B.dim, .45)};
        --mx-roza-75: ${prozirna(B.roza, .75)};
        --mx-puder-88: ${prozirna(B.puder, .88)};
        --mx-rub-hover: ${mijesaj(B.roza, B.linija, .7)};
        --mx-ikona: ${mijesaj(B.roza, B.tinta, .55)};
        --mx-kap: ${mijesaj(B.roza, B.tinta, .8)};
        --mx-vosak: ${B.vosak};
        --mx-akcija: ${B.akcija};
        --mx-font: ${P.font};
        --mx-font-naziv: ${P.fontNaziva};
        --mx-uvlaka: 20px;            /* koliko je opis uvučen s obje strane; do tu smije ići i tekst gore */
        --mx-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-meko: cubic-bezier(.45, 0, .2, 1);
        position: relative;
        width: 100%;
        min-width: 0;
        color: var(--mx-tinta);
        font-family: var(--mx-font);
        font-size: 14px;
        font-weight: 400;
        line-height: 1.4;
        letter-spacing: normal;
        white-space: normal;
        word-break: normal;
        text-align: left;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .mx, .mx *, .mx *::before, .mx *::after { box-sizing: border-box; }
      .mx-skriveno {
        position: absolute !important;
        width: 1px; height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      /* ── kartica ── */
      .mx-kartica {
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding: 17px 16px 20px;      /* lijevo/desno 16 px; gore 3 px manje jer slova imaju prazan prostor iznad sebe, pa je vidljivi razmak gore i dolje 20 px */
        background: var(--mx-kartica);
        border: 1px solid var(--mx-linija);
        border-radius: 18px;
        overflow: hidden;
        isolation: isolate;
        color: inherit;
        box-shadow: 0 1px 1px rgba(60, 30, 25, .04), 0 14px 26px -22px rgba(110, 55, 45, .5);
        transition: border-color .4s var(--mx-meko);
      }
      /* dvostruki rub, kao na etiketi parfemske bočice */
      .mx-kartica::before {
        content: "";
        position: absolute;
        top: 5px; right: 5px; bottom: 5px; left: 5px;
        border: 1px solid var(--mx-linija);
        border-radius: 13px;
        pointer-events: none;
        transition: border-color .5s var(--mx-meko);
      }

      /* gornji dio: slika lijevo, marka / naziv / cijena desno. centrirajVrh()
         izmjeri tekst i namjesti margine slike (.mx-izlog): kratak naziv dijeli
         gornji dio na dvije polovice (slika na sredini lijeve, tekst od početka
         desne), a dulji je centriran kao cjelina */
      .mx-vrh {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }

      /* prostor slike: bez kutije, prozirna podloga
         Važno: bočica i aura su u istom omotu (.mx-lebdi) i plutaju zajedno.
         Tako ih preglednik uvijek crta u istom sloju i stapanje bijele
         pozadine ne puca. Sjena je izvan omota i ostaje na mjestu. */
      .mx-izlog {
        position: relative;
        flex: none;
        transition: margin-left .9s var(--mx-glatko), margin-right .9s var(--mx-glatko);   /* kad stigne bočica, gornji dio klizne na mjesto zajedno s njezinim dizanjem */
      }
      .mx-nisa {
        --mx-aura: ${prozirna(B.roza, .55)};
        --mx-aura-2: ${prozirna(B.puder, .95)};
        --mx-sjena: rgba(95, 52, 44, .28);
        position: relative;
        width: ${VITRINA[0]}px;
        height: ${VITRINA[1]}px;
        isolation: isolate;
        opacity: 0;                   /* cijela scena se pojavi odjednom, kad je fotografija spremna */
        transition: opacity .5s var(--mx-meko);
      }
      .mx-nisa.mx-ucitano,
      .mx-nisa.mx-bez-slike { opacity: 1; }

      /* omot bočice i aure: pluta kao jedna cjelina */
      .mx-lebdi {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 1;
        isolation: isolate;
        pointer-events: none;
      }

      /* aura: meki oblak boje stakla iza bočice */
      .mx-aura {
        position: absolute;
        top: 4%; right: 0; bottom: 12%; left: 0;
        z-index: 0;
        background:
          radial-gradient(34% 27% at 43% 40%, var(--mx-aura), transparent),
          radial-gradient(32% 27% at 58% 62%, var(--mx-aura), transparent),
          radial-gradient(46% 42% at 50% 50%, var(--mx-aura-2), transparent);
        transition: top 1.1s var(--mx-glatko), right 1.1s var(--mx-glatko), bottom 1.1s var(--mx-glatko), left 1.1s var(--mx-glatko);
        pointer-events: none;
      }

      /* aura iz same fotografije — "sjaj iz stakla": iza bočice su dva sloja iste
         slike, pa je sjaj uvijek u bojama i tonovima artikla (ne treba čitati
         piksele, radi i kad je slika s druge domene):
          - .mx-aura-sjaj: uzak, svijetao sjaj tik uz rub bočice (mali blur, slika
            malo uvećana oko sredine bočice), kao svjetlo koje curi oko stakla
          - .mx-aura-slika: širok, vrlo mekan obojeni oreol (velik blur, slabiji),
            kao obojeno svjetlo koje staklo baca na bijelu karticu
         Boje oba sloja su "podignute" prema bijeloj (invert → brightness → invert:
         svaka boja se stopi s bijelom, a nijansa ostane) i zatim zasićene, pa je
         sjaj svijetao i čist kao svjetlo, nikad blatnjav ni siv. Okvir
         (.mx-aura-okvir) je točno prostor slike, a maska je meki oval koji se prema
         rubovima ugasi u bijelo: aura nikad ne izlazi preko teksta, ruba kartice ni
         crte. Dok je ona tu, roza oblak (.mx-aura) je skriven; on ostaje za proizvod
         bez slike */
      .mx-aura-okvir {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 0;
        overflow: hidden;
        -webkit-mask-image: radial-gradient(closest-side at 50% var(--mx-sredina, 46%), #000 84%, transparent 100%);
                mask-image: radial-gradient(closest-side at 50% var(--mx-sredina, 46%), #000 84%, transparent 100%);
        pointer-events: none;
      }
      .mx-aura-slika {
        position: absolute;
        left: 0;
        top: calc(1% + 8px);          /* kao bočica: pri pojavi se diže zajedno s njom */
        width: 100%;
        height: ${VISINA_SLIKE * 100}%;
        max-width: none;
        max-height: none;
        margin: 0;
        object-fit: contain;
        object-position: 50% 55%;
        transform-origin: 50% 52%;
        transform: scale(1.32);
        filter: blur(13px) invert(1) brightness(.42) invert(1) saturate(2.2);
        opacity: .7;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
      }
      .mx-aura-sjaj {
        transform: scale(1.08);
        filter: blur(3.5px) invert(1) brightness(.44) invert(1) saturate(var(--mx-sjaj-zasic, 1.75));
        opacity: 1;
      }
      /* jako zasićeno staklo (crveno, tirkizno): sjaj uz rub malo blaži, da ne bude neon */
      .mx-aura-zasicena .mx-aura-sjaj { opacity: .9; }
      .mx-aura-iz-slike .mx-aura { display: none; }
      .mx-aura-slika { transition: top .9s var(--mx-glatko); }
      .mx-ucitano .mx-aura-slika { top: 1%; }
      /* tamna bočica (crna, tamnosmeđa): sjaj je podignut još više prema bijeloj i
         blago zagrijan (sepia), pa oko crne bočice stoji mekan, topao, svilen odsjaj,
         a ne siva mrlja */
      .mx-aura-tamna .mx-aura-slika { filter: blur(13px) invert(1) brightness(.28) invert(1) sepia(.55) saturate(1.7); }
      .mx-aura-tamna .mx-aura-sjaj { filter: blur(3.5px) invert(1) brightness(.3) invert(1) sepia(.5) saturate(1.5); opacity: 1; }
      /* svijetla bočica (prozirno staklo, bijela, krem): njezina obrađena slika je
         gotovo prozirna, pa bi sjaj iz same slike bio jedva vidljiv. Zato se oko
         siluete doda biserni sjaj u prevladavajućoj boji bočice (--mx-sjaj iz
         tonoviBocice, kod prozirne bočice to je boja čepa): tri meke sjene bez pomaka,
         jedna preko druge, pojačaju prozirnu siluetu u vidljiv, mekan oreol. Maska je
         prsten, da se sjaj kroz prozirno staklo ne vidi preko etikete u sredini */
      .mx-aura-svijetla .mx-aura-sjaj {
        filter: blur(2px) invert(1) brightness(.44) invert(1) saturate(1.75)
                drop-shadow(0 0 5px var(--mx-sjaj, rgba(226, 195, 186, .8)))
                drop-shadow(0 0 6px var(--mx-sjaj, rgba(226, 195, 186, .8)))
                drop-shadow(0 0 7px var(--mx-sjaj, rgba(226, 195, 186, .8)));
      }
      .mx-aura-svijetla .mx-aura-okvir {
        -webkit-mask-image: radial-gradient(closest-side at 50% var(--mx-sredina, 46%), rgba(0, 0, 0, .15) var(--mx-rupa, 24%), #000 var(--mx-rupa-kraj, 56%), rgba(0, 0, 0, .45) var(--mx-rupa-sred, 78%), transparent 100%);
                mask-image: radial-gradient(closest-side at 50% var(--mx-sredina, 46%), rgba(0, 0, 0, .15) var(--mx-rupa, 24%), #000 var(--mx-rupa-kraj, 56%), rgba(0, 0, 0, .45) var(--mx-rupa-sred, 78%), transparent 100%);
      }
      /* svjetlosna kupka: meko svjetlo u boji bočice koje počinje tik uz rub stakla i
         gasi se prema rubu prostora, ispod obje kopije; daje svijetloj bočici oreol
         koji njezina gotovo prozirna slika sama ne može dati */
      .mx-aura-kupka {
        display: none;
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        background: radial-gradient(closest-side at 50% var(--mx-sredina, 46%), var(--mx-sjaj, transparent) var(--mx-rupa, 24%), var(--mx-sjaj-2, transparent) var(--mx-rupa-kraj, 56%), transparent 100%);
        pointer-events: none;
      }
      .mx-prozirno.mx-aura-svijetla .mx-aura-kupka { display: block; }   /* samo kad je slika stvarno obrađena */
      /* slika koju nije moguće obraditi (druga domena): fotografija ima bijelu
         pozadinu, a bijela "podignuta" ostaje bijela, pa je na bijeloj kartici
         nevidljiva; sjaj uz rub se stapa s oreolom kao "darken" (bijelo je neutralno,
         a gdje se preklapaju vrijedi svjetliji, ne umnožak). Maska je prsten: u
         sredini, gdje je sama bočica, aura je skoro ugašena, da ne mijenja boje
         proizvoda */
      .mx-aura-iz-slike:not(.mx-prozirno) .mx-aura-okvir {
        -webkit-mask-image: radial-gradient(50% 44% at 50% 48%, rgba(0, 0, 0, .12) 22%, #000 50%, transparent 100%);
                mask-image: radial-gradient(50% 44% at 50% 48%, rgba(0, 0, 0, .12) 22%, #000 50%, transparent 100%);
      }
      /* bez piksela se ne zna je li bočica tamna, pa je oreol malo svjetliji (crna
         dobije mekanu svijetlosivu izmaglicu) i malo manje uvećan, da tamna fotografija
         nema traka; nijansa obojenih bočica ostaje točno njihova */
      .mx-aura-iz-slike:not(.mx-prozirno) .mx-aura-slika { transform: scale(1.24); filter: blur(13px) invert(1) brightness(.34) invert(1) saturate(2.2); }
      .mx-aura-iz-slike:not(.mx-prozirno) .mx-aura-sjaj { transform: scale(1.08); filter: blur(3.5px) invert(1) brightness(.44) invert(1) saturate(1.75); mix-blend-mode: darken; }
      /* bez podrške za masku: radije stara roza aura nego obojeni pravokutnik */
      @supports not ((mask-image: none) or (-webkit-mask-image: none)) {
        .mx-aura-okvir { display: none; }
        .mx-aura-iz-slike .mx-aura { display: block; }
      }

      /* svjetlo na podlozi: tiha, široka obojena elipsa ispod sjene, kao obojeno
         svjetlo koje bočica baca na policu izloga (samo kad je boja stakla poznata) */
      .mx-aura-pod {
        display: none;
        position: absolute;
        z-index: 0;
        left: calc(var(--mx-sjena-x, 23%) - 12%);
        right: calc(var(--mx-sjena-x, 23%) - 12%);
        top: 83%;
        height: 15%;
        border-radius: 50%;
        background: radial-gradient(closest-side, var(--mx-pod, transparent), transparent);
        pointer-events: none;
      }
      .mx-prozirno .mx-aura-pod { display: block; }

      /* meka sjena ispod bočice: bočica kao da lebdi */
      .mx-sjena {
        position: absolute;
        z-index: 0;
        left: 23%;
        right: 23%;
        top: 80%;
        height: 9%;
        border-radius: 50%;
        background: radial-gradient(closest-side, var(--mx-sjena), transparent);
        transition: left .9s var(--mx-glatko), right .9s var(--mx-glatko), top .9s var(--mx-glatko), height .9s var(--mx-glatko);
        pointer-events: none;
      }
      .mx-bez-slike .mx-sjena,
      .mx-bez-slike .mx-aura-pod { display: none; }

      .mx-boca,
      .mx-aura-podloga {
        position: absolute;
        z-index: 1;
        left: 0;
        top: calc(1% + 8px);          /* bočica se pri pojavi lagano podigne na mjesto */
        width: 100%;
        height: ${VISINA_SLIKE * 100}%;
        max-width: none;
        max-height: none;
        margin: 0;
        object-fit: contain;
        object-position: 50% 55%;
        mix-blend-mode: darken;       /* rezerva: bijela pozadina se stapa kad fotografiju nije moguće obraditi
                                         (darken, ne multiply: na bijeloj je isto, a iznad svjetlijeg sjaja
                                         boje bočice ostaju njezine) */
        transition: top .9s var(--mx-glatko);
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
      }
      .mx-ucitano .mx-boca,
      .mx-ucitano .mx-aura-podloga { top: 1%; }
      /* bijela silueta bočice između aure i obrađene bočice: kroz poluprozirne
         dijelove stakla, etikete i čepa vidi se bijelo, kao i dosad, a ne aura, pa su
         boje bočice točno kao na fotografiji; aura se vidi samo oko bočice. Siluetu
         pravi obrada fotografije (bijela slika, unutrašnjost bočice ispunjena po
         recima, pa su i bijele etikete i prozirno staklo pokriveni) */
      .mx-aura-podloga { visibility: hidden; mix-blend-mode: normal; }   /* uvijek u toku, da se diže zajedno s bočicom */
      .mx-prozirno .mx-aura-podloga { visibility: visible; }
      /* rezerva kad silueta nije napravljena: ista obrađena slika pobijeljena filterom */
      .mx-podloga-iz-slike .mx-aura-podloga { filter: brightness(0) invert(1) drop-shadow(0 0 0 #fff) drop-shadow(0 0 0 #fff) drop-shadow(0 0 0 #fff); }
      .mx-podloga-iz-slike.mx-aura-svijetla .mx-aura-podloga { filter: brightness(0) invert(1) drop-shadow(0 0 0 #fff) drop-shadow(0 0 0 #fff) drop-shadow(0 0 0 #fff) drop-shadow(0 0 0 #fff) drop-shadow(0 0 0 #fff); }

      /* obrađena fotografija: bočica je već smještena u kadar (prava prozirnost),
         slika pokriva cijeli prostor, a sjena i aura prate stvarnu bočicu */
      .mx-prozirno .mx-boca,
      .mx-prozirno .mx-aura-podloga { top: 8px; height: 100%; mix-blend-mode: normal; }
      .mx-prozirno.mx-ucitano .mx-boca,
      .mx-prozirno.mx-ucitano .mx-aura-podloga { top: 0; }
      .mx-prozirno .mx-sjena {
        left: var(--mx-sjena-x, 23%);
        right: var(--mx-sjena-x, 23%);
        top: 87%;
        height: 9%;
      }
      .mx-prozirno .mx-aura {
        top: calc(var(--mx-sredina, 46%) - 42%);
        bottom: calc(100% - var(--mx-sredina, 46%) - 42%);
      }
      .mx-prozirno .mx-aura-slika {                          /* ista slika i kadar kao bočica: sjaj se */
        top: 8px;                                            /* diže zajedno s njom pri pojavi */
        height: 100%;
        transform-origin: 50% var(--mx-sredina, 46%);        /* uvećanje oko sredine same bočice */
      }
      .mx-prozirno.mx-ucitano .mx-aura-slika { top: 0; }

      /* fotografija s tamnom ili šarenom pozadinom: ispunjava okvir kao uokvirena slika */
      .mx-foto {
        border-radius: 12px;
        clip-path: inset(0 round 12px);
        overflow: hidden;
      }
      .mx-foto .mx-aura,
      .mx-foto .mx-aura-okvir,
      .mx-foto .mx-aura-pod,
      .mx-foto .mx-sjena { display: none; }
      .mx-foto .mx-boca,
      .mx-foto.mx-ucitano .mx-boca {
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: 50% 50%;
        mix-blend-mode: normal;
      }

      .mx-prazno {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 1;
        display: grid;
        place-items: center;
        color: var(--mx-ikona);
        opacity: .55;
      }
      .mx-prazno svg { width: 40px; height: 54px; }

      /* marka, naziv, cijena: poravnato lijevo */
      .mx-glava {
        flex: 1 1 0;
        padding-right: var(--mx-uvlaka);   /* marka i naziv ne idu desnije od opisa */
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        width: 100%;
        min-width: 0;
        text-align: left;
      }
      .mx-marka,
      .mx-naziv { text-wrap: balance; }   /* višeredni tekst lomi se u retke podjednake duljine */
      /* marka: sitna, razmaknuta velika slova, kao natpis na etiketi */
      .mx-marka {
        max-width: 100%;
        font-size: 10.5px;
        line-height: 1.4;
        font-weight: 600;
        letter-spacing: .18em;
        text-transform: uppercase;
        color: var(--mx-marka);
        /* vrlo tanak crni obrub oko slova (sjena u četiri smjera, izvan slova,
           pa slovo ne postane tanje): svijetla roza bolje se čita na bijeloj */
        text-shadow: .4px 0 var(--mx-tinta), -.4px 0 var(--mx-tinta), 0 .4px var(--mx-tinta), 0 -.4px var(--mx-tinta);
        overflow-wrap: break-word;
      }
      /* naziv: u serifnom fontu, na oko jednako velik kao marka. Marka je sva u
         velikim slovima, a naziv je većinom u malima, i to u Cormorantu, koji ima
         sitna mala slova (.39 em); da izgleda jednako velik, font mu je veći */
      .mx-naziv {
        max-width: 100%;
        margin: 0;
        font-family: var(--mx-font-naziv);
        font-size: 15px;
        line-height: 1.18;
        font-weight: 600;
        letter-spacing: .002em;
        font-variant-numeric: lining-nums;   /* brojke u nazivu (npr. 540) iste visine kao slova */
        color: var(--mx-tinta);
        overflow-wrap: break-word;
      }
      .mx-marka + .mx-naziv { margin-top: 4px; }
      /* logo marke umjesto imena: crni logo kao na stranici proizvoda, lijevi
         rub poravnat s tekstom ispod. Visina iz postavki; širok logo je niži
         (namjesti se kad se učita), da ne bude dulji od najveće širine */
      .mx-marka-logo {
        display: block;
        flex: none;
        width: auto;
        height: ${LM.visina}px;
        max-width: 100%;
        max-width: min(100%, ${LM.najvecaSirina}px);
        margin: 0;
        padding: 0;
        border: 0;
        object-fit: contain;
        object-position: left center;
        user-select: none;
        -webkit-user-drag: none;
      }
      .mx-marka-logo + .mx-naziv,
      .mx-marka-logo + .mx-marka-rezerva + .mx-naziv { margin-top: 6px; }
      .mx-marka-rezerva { display: none; }   /* ime marke uz logo: samo kad logo ne može */
      /* vrsta mirisa (Eau de Parfum · 100 ml...): ista slova kao marka (Jost, velika,
         razmaknuta), ali sitnija, tanja i siva, pa je diskretna kao i prije.
         Veličina i razmak slova su takvi da "EAU DE PARFUM · 100 ML" (≈124 px)
         stane u jedan redak na mobitelu, pokraj bočice.
         Dijelovi su zasebni komadići s točkom ispred sebe. Redak je pomaknut
         ulijevo za širinu točke i taj dio je odrezan (clip-path), pa se točka
         ispred prvog komadića u svakom retku ne vidi: kad se redak prelomi,
         točka ne visi ni na kraju ni na početku retka */
      .mx-vrsta {
        display: flex;
        flex-wrap: wrap;
        margin-top: 4px;
        margin-left: -1em;
        clip-path: inset(0 0 0 1em);
        font-size: 9px;
        line-height: 1.5;
        font-weight: 400;
        letter-spacing: .12em;
        text-transform: uppercase;
        color: var(--mx-dim);
      }
      .mx-vrsta > span {
        position: relative;
        min-width: 0;                 /* predug dio (Extrait de Parfum) lomi se unutar sebe */
        padding-left: 1em;            /* mjesto za točku: razmak oko nje je kao razmak među riječima */
      }
      .mx-vrsta > span::before {
        content: "\u00b7";
        content: "\u00b7" / "";       /* čitač zaslona točku preskače (gdje preglednik to zna) */
        position: absolute;
        top: 0;
        left: -.06em;                 /* pola razmaka slova iza prethodnog dijela: točka je u sredini */
        width: 1em;
        text-align: center;
        letter-spacing: 0;
      }
      .mx-cijene {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        margin-top: 12px;
      }
      /* kratka roza crtica između naziva i cijene */
      .mx-cijene::before {
        content: "";
        width: 22px;
        height: 1px;
        margin-bottom: 5px;
        background: var(--mx-roza);
      }
      .mx-glava > .mx-cijene:first-child { margin-top: 0; }
      .mx-glava > .mx-cijene:first-child::before { display: none; }
      /* cijena: diskretna, tanka slova i prigušena boja */
      .mx-cijena {
        display: block;
        font-size: 12.5px;
        line-height: 1.3;
        font-weight: 400;
        letter-spacing: .04em;
        color: var(--mx-cijena);
        font-variant-numeric: lining-nums;
        white-space: nowrap;
      }
      /* popust: stara cijena precrtana, nova ispod nje, pečat s postotkom desno.
         Pečat smije zauzeti i uvlaku desno od teksta (ukras je, ne tekst), pa ostaje
         pokraj cijena i na uskom mobitelu */
      .mx-cijene--popust { margin-right: calc(-1 * var(--mx-uvlaka)); }
      .mx-snizenje {
        display: flex;
        flex-wrap: wrap;              /* uzak chat: pečat ide ispod cijena, kartica ne postaje šira */
        align-items: center;
        gap: 6px 12px;
        max-width: 100%;
      }
      .mx-cijene-stup {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        min-width: 0;
      }
      /* stara cijena: sitnija i siva; preko nje je tanka kosa crta, kao potez
         perom (ne obično precrtavanje fonta). Crta je nagnuta oko svoje sredine,
         pa prelazi cijelu cijenu; pri pojavi se iscrta s lijeva */
      .mx-stara {
        position: relative;
        display: inline-block;
        font-size: 11px;
        line-height: 1.3;
        font-weight: 400;
        letter-spacing: .04em;
        color: var(--mx-dim);
        font-variant-numeric: lining-nums;
        text-decoration: none;
        white-space: nowrap;
      }
      .mx-stara::after {
        content: "";
        position: absolute;
        left: -2px;
        right: -2px;
        top: 54%;
        height: 1px;
        border-radius: 1px;
        background: var(--mx-akcija);
        transform: rotate(-8deg);
      }
      /* nova cijena: jasnija od obične (tamnija, malo veća), ali i dalje mirna */
      .mx-nova {
        display: block;
        margin-top: 1px;
        font-size: 14px;
        line-height: 1.25;
        font-weight: 500;
        letter-spacing: .03em;
        color: var(--mx-tinta);
        font-variant-numeric: lining-nums;
        white-space: nowrap;
      }
      /* "uz kod MRTMX" ispod cijene s kodom: slova kao vrsta mirisa, u boji akcije */
      .mx-uz-kod {
        display: block;
        margin-top: 3px;
        font-size: 8px;
        line-height: 1.4;
        font-weight: 500;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--mx-akcija);
      }

      /* voštani pečat: nepravilan rub (clip-path), vosak svjetliji gore lijevo i
         tamniji uz rub, utisnut prsten i utisnut broj */
      .mx-pecat {
        position: relative;
        flex: none;
        width: ${PECAT}px;
        height: ${PECAT}px;
        transform: rotate(-12deg);
        filter: drop-shadow(0 1px 1px rgba(95, 50, 40, .22)) drop-shadow(0 3px 4px rgba(95, 50, 40, .12));
      }
      .mx-pecat-vosak {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        border-radius: 50%;           /* rezerva kad preglednik ne zna clip-path: path() */
        clip-path: path('${OBRIS_PECATA}');
        background:
          radial-gradient(circle at 34% 28%, rgba(255, 255, 255, .55) 0, rgba(255, 255, 255, 0) 42%),
          radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 58%, ${prozirna(B.akcija, .28)} 100%),
          var(--mx-vosak);
      }
      /* utisnuti prsten: tamna crta gore, svijetla dolje (kao udubljenje u vosku) */
      .mx-pecat-vosak::before {
        content: "";
        position: absolute;
        top: 6px; right: 6px; bottom: 6px; left: 6px;
        border-radius: 50%;
        border: 1px solid ${prozirna(B.akcija, .38)};
        box-shadow: 0 1px 0 rgba(255, 255, 255, .55), inset 0 1px 0 rgba(255, 255, 255, .4);
      }
      .mx-pecat-tekst {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-left: 1px;
        font-size: 11px;
        line-height: 1;
        font-weight: 600;
        letter-spacing: 0;
        color: ${mijesaj(B.akcija, B.tinta, .45)};
        text-shadow: 0 1px 0 rgba(255, 255, 255, .5);
        font-variant-numeric: lining-nums;
        white-space: nowrap;
      }
      .mx-pecat-tekst small {
        margin-left: 1px;
        font-size: 7px;
        font-weight: 600;
        transform: translateY(-2px);
      }
      /* minus u Jostu sjedi nisko (kao "_30"): podigne se do sredine brojki */
      .mx-minus { display: inline-block; margin-right: .04em; transform: translateY(-.1em); }
      /* val kad pečat "sjedne" na karticu */
      .mx-pecat::after {
        content: "";
        position: absolute;
        top: 2px; right: 2px; bottom: 2px; left: 2px;
        border-radius: 50%;
        border: 1px solid var(--mx-roza);
        opacity: 0;
        pointer-events: none;
      }

      /* tanka linija između gornjeg dijela i opisa: najjača u sredini, prema krajevima nestaje */
      .mx-crta {
        height: 1px;
        margin: 15px 0 0;             /* + prazan rub ispod sjene ili teksta ≈ 20 px vidljivog razmaka */
        background: linear-gradient(90deg,
          ${prozirna(B.roza, 0)} 0%,
          ${prozirna(B.roza, .75)} 25%,
          ${B.roza} 50%,
          ${prozirna(B.roza, .75)} 75%,
          ${prozirna(B.roza, 0)} 100%);
      }

      /* opis: s obje strane uvučen (--mx-uvlaka), pa je skupljen prema sredini kartice.
         Poravnat obostrano, s dijeljenjem riječi, da nema rupa među riječima. */
      .mx-opis {
        margin: 15px var(--mx-uvlaka) 0;   /* gore: + prored prvog retka ≈ 20 px vidljivog razmaka */
        text-align: justify;
        word-spacing: -.04em;         /* malo uži razmaci, pa se kod poravnanja manje rastežu */
        text-align-last: left;        /* zadnji redak ostaje normalan */
        -webkit-hyphens: auto;
        hyphens: auto;
        hyphenate-limit-chars: 7 3 3; /* dijele se samo dulje riječi */
        font-size: 14px;
        line-height: 1.6;
        color: var(--mx-dim);
        overflow-wrap: break-word;
      }

      /* razmak iznad gumba */
      .mx-razmak { display: block; flex: 1 0 20px; }

      /* gumb: prozirna pilula s tankim tamnim obrubom, razmaknuta velika slova */
      .mx-gumb {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        align-self: center;
        flex: none;
        max-width: 100%;
        min-height: 30px;
        margin-bottom: 4px;           /* uz donji rub kartice: vidljivo ~24 px do ruba */
        padding: 0 18px 0 calc(18px + .22em);   /* lijevo + razmak slova, da tekst bude optički centriran */
        border: 1px solid ${B.gumb};
        border-radius: 999px;
        background-color: transparent;
        color: ${B.gumb};
        font-family: var(--mx-font);
        font-size: 9.5px;
        line-height: 1;
        font-weight: 500;
        letter-spacing: .22em;
        text-transform: uppercase;
        text-align: center;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background-color .2s ease, color .2s ease;
      }
      .mx-gumb:focus { outline: none; }
      .mx-gumb:focus-visible { outline: 2px solid ${B.gumb}; outline-offset: 3px; }
      /* dodir / klik: gumb je taman samo dok je prst (ili tipka miša) na njemu */
      .mx-gumb:active {
        background-color: ${B.gumb};
        color: #ffffff;
      }

      /* ── popis (kartice jedna ispod druge) i istaknuta (jedan proizvod) ── */
      .mx-lista {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 8px 4px 10px;
      }
      .mx-lista > .mx-kartica { flex: none; }

      .mx-istaknuta { padding: 8px 4px 10px; }
      .mx-kartica--istaknuta { max-width: 380px; }

      /* ── plutanje: bočica (zajedno s aurom, u omotu .mx-lebdi) se neprestano polako
         diže i spušta, na svim uređajima. Kad se bočica digne, sjena ispod nje se
         suzi i posvijetli. ── */
      .mx-ucitano:not(.mx-foto) .mx-lebdi,
      .mx-ucitano:not(.mx-foto) .mx-sjena {
        animation: 5.6s cubic-bezier(.37, 0, .63, 1) infinite both;   /* meko kao sinus, bez trzaja na okretu */
        animation-delay: calc(var(--mx-i, 0) * -1.9s);   /* bočice u istoj poruci ne plutaju u istom ritmu */
        animation-play-state: paused;                     /* vrti se samo dok je kartica na ekranu */
        will-change: transform;
      }
      .mx-ucitano:not(.mx-foto) .mx-lebdi { animation-name: mx-plutanje; }
      .mx-ucitano:not(.mx-foto) .mx-sjena { animation-name: mx-plutanje-sjena; }
      .mx-vidljivo .mx-ucitano:not(.mx-foto) .mx-lebdi,
      .mx-vidljivo .mx-ucitano:not(.mx-foto) .mx-sjena { animation-play-state: running; }

      /* transform se pomiče i za dijelove piksela, pa je pokret gladak */
      @keyframes mx-plutanje {
        0%, 100% { transform: translate3d(0, 0, 0); }
        50%      { transform: translate3d(0, -7px, 0); }
      }
      @keyframes mx-plutanje-sjena {
        0%, 100% { transform: scale(1); opacity: 1; }
        50%      { transform: scale(.74, .85); opacity: .7; }
      }

      /* ── interakcija mišem: unutarnji rub kartice se zarumeni ── */
      @media (hover: hover) and (pointer: fine) {
        .mx-kartica:hover::before { border-color: var(--mx-rub-hover); }
      }
      /* gumb se ispuni tamnom bojom samo na uređajima koji imaju prelazak mišem
         (na mobitelu bez "zaglavljenog" tamnog stanja nakon dodira) */
      @media (hover: hover) {
        .mx-gumb:hover {
          background-color: ${B.gumb};
          color: #ffffff;
        }
      }

      /* ── pojava: izmaglica spreja i bočice koje izranjaju iz nje ── */
      .mx-maglica {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 5;
        overflow: hidden;
        border-radius: 18px;
        pointer-events: none;
      }
      .mx-maglica::before,
      .mx-maglica::after {
        content: "";
        position: absolute;
        top: -25%;
        bottom: -25%;
        left: 0;
        width: 75%;
        border-radius: 50%;
        background: radial-gradient(closest-side, rgba(255, 255, 255, .96) 0%, var(--mx-puder-88) 42%, transparent 100%);
        filter: blur(10px);
        opacity: 0;
        animation: mx-sprej 1.55s cubic-bezier(.3, .1, .3, 1) forwards;
      }
      .mx-maglica::after {
        top: -5%;
        bottom: -35%;
        width: 55%;
        background: radial-gradient(closest-side, var(--mx-roza-75) 0%, transparent 100%);
        animation-duration: 1.75s;
        animation-delay: .1s;
      }
      /* kapljice spreja */
      .mx-kap {
        position: absolute;
        width: var(--mx-vel, 3px);
        height: var(--mx-vel, 3px);
        border-radius: 50%;
        background: radial-gradient(circle, #fff 0 32%, var(--mx-kap) 72%);
        box-shadow: 0 0 5px 1px var(--mx-roza-75);
        opacity: 0;
        animation: mx-kap 1.2s var(--mx-glatko) forwards;
      }
      .mx-pojava .mx-kartica {
        animation: mx-materijalizacija 1s var(--mx-glatko) backwards;
        animation-delay: calc(140ms + var(--mx-i, 0) * 110ms);
      }

      @keyframes mx-sprej {
        0%   { opacity: 0; transform: translateX(-100%) scale(.85); }
        22%  { opacity: 1; }
        70%  { opacity: .85; }
        100% { opacity: 0; transform: translateX(185%) scale(1.25); }
      }
      @keyframes mx-materijalizacija {
        0%   { opacity: 0; filter: blur(14px); transform: translateY(10px) scale(.96); }
        55%  { opacity: 1; }
        100% { opacity: 1; filter: blur(0); transform: none; }
      }
      @keyframes mx-kap {
        0%   { opacity: 0; transform: translate(0, 0) scale(.3); }
        12%  { opacity: 1; }
        65%  { opacity: .9; }
        100% { opacity: 0; transform: translate(var(--mx-dx, 120px), var(--mx-dy, 0px)) scale(1); }
      }
      @keyframes mx-samo-prozirnost {
        from { opacity: 0; }
      }

      /* popust: kad se kartica pojavi, pero precrta staru cijenu, ispod nje izroni
         nova, a zatim se pokraj njih utisne pečat (i od njega se raširi tanki val) */
      .mx-pojava .mx-stara::after {
        animation: mx-precrtaj .5s cubic-bezier(.6, 0, .3, 1) backwards;
        animation-delay: calc(900ms + var(--mx-i, 0) * 110ms);
      }
      .mx-pojava .mx-nova,
      .mx-pojava .mx-uz-kod {
        animation: mx-nova .7s var(--mx-glatko) backwards;
        animation-delay: calc(1250ms + var(--mx-i, 0) * 110ms);
      }
      .mx-pojava .mx-uz-kod { animation-delay: calc(1380ms + var(--mx-i, 0) * 110ms); }
      .mx-pojava .mx-pecat {
        animation: mx-pecat .62s cubic-bezier(.3, 1.35, .55, 1) backwards;
        animation-delay: calc(1450ms + var(--mx-i, 0) * 110ms);
      }
      .mx-pojava .mx-pecat::after {
        animation: mx-pecat-val .9s ease-out;
        animation-delay: calc(1750ms + var(--mx-i, 0) * 110ms);
      }
      @keyframes mx-precrtaj {                /* clip-path je u smjeru same crte: otkriva je s lijeva */
        from { clip-path: inset(0 100% 0 0); }
        to   { clip-path: inset(0 0 0 0); }
      }
      @keyframes mx-nova {
        from { opacity: 0; transform: translateY(4px); filter: blur(3px); }
      }
      @keyframes mx-pecat {
        0%   { opacity: 0; transform: scale(1.8) rotate(-38deg); }
        55%  { opacity: 1; transform: scale(.92) rotate(-9deg); }
        100% { opacity: 1; transform: rotate(-12deg); }
      }
      @keyframes mx-pecat-val {
        0%   { opacity: .9; transform: scale(.95); }
        100% { opacity: 0; transform: scale(1.9); }
      }

      @media (forced-colors: active) {
        .mx-stara { text-decoration: line-through; }
        .mx-stara::after { display: none; }
        /* visoki kontrast: crni logo bi na tamnoj podlozi nestao, pa ime slovima */
        .mx-marka-logo { display: none; }
        .mx-marka-rezerva { display: inline; }
        .mx-marka-logo + .mx-marka-rezerva + .mx-naziv { margin-top: 4px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .mx-maglica { display: none; }
        .mx-pojava .mx-kartica { animation: mx-samo-prozirnost .35s linear backwards; animation-delay: 0s; }
        .mx-pojava .mx-stara::after, .mx-pojava .mx-nova, .mx-pojava .mx-uz-kod,
        .mx-pojava .mx-pecat, .mx-pojava .mx-pecat::after { animation: none; }
        .mx-kartica, .mx-kartica::before, .mx-izlog, .mx-nisa, .mx-boca, .mx-aura, .mx-aura-slika, .mx-aura-podloga, .mx-sjena { transition-duration: .01s !important; }
        .mx-gumb { transition: none; }
        .mx-lebdi, .mx-sjena { animation: none !important; }
      }
    `;

    // Stil se ubacuje jednom: u shadow root widgeta (ili u <head> ako ga nema)
    function ubaciStil(element) {
      const korijen = element.getRootNode ? element.getRootNode() : document;
      const jeShadow = typeof ShadowRoot !== 'undefined' && korijen instanceof ShadowRoot;
      const cilj = jeShadow ? korijen : (korijen === document ? document.head : null);
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-kartice', '33');
      stil.textContent = CSS;
      if (!cilj) { element.appendChild(stil); return; }       // element još nije u DOM-u
      if (cilj.querySelector('style[data-mx-kartice]')) return;
      cilj.appendChild(stil);
    }

    // Fontovi iz mape fonts/ (Jost i Cormorant Garamond, licenca SIL OFL 1.1).
    // Svaki font ima dvije datoteke: osnovna slova i dodatna (č, ć, đ, š, ž...).
    // Idu u <head> stranice: fontovi iz <head> vrijede i unutar shadow roota
    // widgeta (obrnuto ne vrijedi).
    const FONTOVI = [
      { obitelj: 'MX Jost', datoteka: 'jost', tezine: '400 600' },
      { obitelj: 'MX Cormorant', datoteka: 'cormorant-garamond', tezine: '500 700' }
    ];
    const RASPONI = {
      'latin': 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
      'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'
    };
    function ubaciFontove() {
      if (document.getElementById('mx-kartice-font') || !document.head) return;
      const stil = document.createElement('style');
      stil.id = 'mx-kartice-font';
      stil.textContent = FONTOVI.map(function (f) {
        return Object.keys(RASPONI).map(function (r) {
          return '@font-face{font-family:"' + f.obitelj + '";src:url("' + BAZA + 'fonts/' + f.datoteka + '-' + r + '.woff2") format("woff2");' +
            'font-weight:' + f.tezine + ';font-style:normal;font-display:swap;unicode-range:' + RASPONI[r] + '}';
        }).join('\n');
      }).join('\n');
      document.head.appendChild(stil);
      // fontovi se preuzimaju odmah, a ne tek kad stigne prva preporuka
      if (document.fonts && document.fonts.load) {
        FONTOVI.forEach(function (f) {
          document.fonts.load('400 16px "' + f.obitelj + '"', 'Aa č').catch(function () { /* nije kritično */ });
        });
      }
    }
    ubaciFontove();

    // Plutanje se vrti samo dok je kartica na ekranu (štedi bateriju na mobitelu)
    const PROMATRAC = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(function (zapisi) {
          zapisi.forEach(function (z) { z.target.classList.toggle('mx-vidljivo', z.isIntersecting); });
        })
      : null;
    function pratiVidljivost(kartica) {
      if (PROMATRAC) PROMATRAC.observe(kartica);
      else kartica.classList.add('mx-vidljivo');
    }

    // ── RASPORED GORNJEG DIJELA ──────────────────────────────────────────
    // Gornji dio (bočica + tekst) složi se po stvarnim recima teksta (i kad se
    // marka ili naziv prelome) i po širini loga marke, pa ovo ne može sam CSS:
    //  - kratak naziv: gornji dio se dijeli na dvije jednake polovice širine
    //    opisa. Tekst počinje na desnoj polovici, poravnat ulijevo, a bočica je
    //    na sredini lijeve polovice
    //  - dulji naziv (ne stane u desnu polovicu): bočica i tekst centrirani su
    //    kao cjelina, vidljiva bočica je od lijevog ruba kartice jednako daleko
    //    kao najdulji redak teksta od desnog
    // Tekst nikad ne ide desnije od opisa (--mx-uvlaka): kad za to nema mjesta,
    // slika se pomakne koliko smije, a uz dug tekst ostaje uz lijevi rub, kao i
    // dosad. Pečat popusta (ukras) smije i u uvlaku, kao i dosad.

    // koliko je vidljiva bočica uvučena od lijevog ruba prostora slike (CSS px)
    function rubBocice(nisa) {
      if (nisa.classList.contains('mx-foto')) return 0;           // fotografija ispunjava cijeli okvir
      if (nisa.classList.contains('mx-bez-slike')) return (VITRINA[0] - SIRINA_IKONE) / 2;
      const udio = parseFloat(nisa.style.getPropertyValue('--mx-sirina-boce'));
      return (1 - (nisa.classList.contains('mx-prozirno') && udio > 0 ? udio : PROCJENA_BOCE)) / 2 * VITRINA[0];
    }

    // glatko = true: pomak klizi (kad stigne bočica), inače je odmah na mjestu
    function centrirajVrh(vrh, glatko) {
      const izlog = vrh.querySelector('.mx-izlog');
      const glava = vrh.querySelector('.mx-glava');
      if (!izlog || !glava || !vrh.isConnected) return;
      // mjeri se u osnovnom rasporedu (slika uz lijevi rub)
      const prije = [izlog.style.marginLeft, izlog.style.marginRight];
      izlog.style.transition = 'none';
      izlog.style.marginLeft = '';
      izlog.style.marginRight = '';
      const g = glava.getBoundingClientRect();
      if (!g.width) {
        izlog.style.marginLeft = prije[0];
        izlog.style.marginRight = prije[1];
        izlog.style.transition = '';
        return;
      }
      const mjera = glava.offsetWidth / g.width;   // kartica je pri pojavi malo umanjena (transform): sve u CSS px
      // od lijevog ruba glave do kraja najduljeg retka (CSS px): sirina je ono što se
      // vidi, a zauzeto uključuje i razmak iza zadnjeg slova, koji se ne vidi, ali
      // zauzima mjesto u retku
      let sirina = 0, zauzeto = 0;
      const raspon = document.createRange();
      const setac = document.createTreeWalker(glava, NodeFilter.SHOW_TEXT);
      while (setac.nextNode()) {
        const n = setac.currentNode, roditelj = n.parentElement;
        if (!n.nodeValue.trim() || roditelj.closest('.mx-skriveno')) continue;
        const razmak = parseFloat(getComputedStyle(roditelj).letterSpacing) || 0;
        raspon.selectNodeContents(n);
        const reci = raspon.getClientRects();
        for (let i = 0; i < reci.length; i++) {
          const kraj = (reci[i].right - g.left) * mjera;
          zauzeto = Math.max(zauzeto, kraj);
          sirina = Math.max(sirina, kraj - razmak);
        }
      }
      // logo marke nije tekst: mjeri se kao slika (dok se ne učita, širok je 0)
      glava.querySelectorAll('.mx-marka-logo').forEach(function (e) {
        const r = e.getBoundingClientRect();
        if (!r.width) return;
        const kraj = (r.right - g.left) * mjera;
        zauzeto = Math.max(zauzeto, kraj);
        sirina = Math.max(sirina, kraj);
      });
      // pečat po rasporedu (offset), ne po onome što se vidi: pečat se
      // pri pojavi utiskuje s povećanjem. Mjeri se od kartice, kao i glava
      const desniRub = function (e) { return e ? e.offsetLeft + e.offsetWidth - glava.offsetLeft : 0; };
      const pecatDo = desniRub(glava.querySelector('.mx-pecat'));
      const uvlaka = parseFloat(getComputedStyle(glava).paddingRight) || 0;

      // sve od lijevog ruba gornjeg dijela (CSS px); 1 px rezerve posvuda, da se
      // redak ne prelomi zbog zaokruživanja
      const W = vrh.clientWidth;
      const slika = izlog.offsetWidth;
      const razmak = glava.offsetLeft - izlog.offsetLeft - slika;   // između slike i teksta (gap)
      let lijevo, desno = 0;                                       // margine slike
      // 1) kratak naziv: polovice opisa (od uvlake do uvlake), granica je sredina
      //    kartice, a razmak između slike i teksta dijele napola
      const tekstOd = Math.round(W / 2 + razmak / 2);
      if (tekstOd + zauzeto <= W - uvlaka - 1 && tekstOd + pecatDo <= W - 1) {
        lijevo = Math.max(0, Math.round((uvlaka + W / 2 - razmak / 2) / 2 - slika / 2));
        desno = tekstOd - lijevo - slika - razmak;
      } else {
        // 2) dulji naziv: pola slobodnog prostora (umanjenog za prazninu lijevo od
        //    bočice) ide lijevo od slike, koliko granica dopušta
        const slobodno = glava.clientWidth - Math.max(sirina, pecatDo);
        const granica = Math.min(glava.clientWidth - uvlaka - zauzeto, glava.clientWidth - pecatDo) - 1;
        lijevo = Math.max(0, Math.min(Math.round((slobodno - rubBocice(izlog.firstElementChild)) / 2), Math.floor(granica)));
      }
      const novi = [lijevo ? lijevo + 'px' : '', desno ? desno + 'px' : ''];
      if (glatko) {
        izlog.style.marginLeft = prije[0];
        izlog.style.marginRight = prije[1];
        void izlog.offsetWidth;
        izlog.style.transition = '';
      }
      izlog.style.marginLeft = novi[0];
      izlog.style.marginRight = novi[1];
      if (!glatko) {
        void izlog.offsetWidth;
        izlog.style.transition = '';
      }
    }

    // ponovno centriranje kad se promijeni širina kartice i kad se učitaju fontovi
    const VRHOVI = new Set();
    const PROMATRAC_SIRINE = typeof ResizeObserver === 'function'
      ? new ResizeObserver(function (zapisi) {
          zapisi.forEach(function (z) {
            if (z.target.isConnected) centrirajVrh(z.target, false);
            else { PROMATRAC_SIRINE.unobserve(z.target); VRHOVI.delete(z.target); }   // kartica je uklonjena
          });
        })
      : null;
    function pratiSirinu(vrh) {
      if (!PROMATRAC_SIRINE) return;              // stariji preglednik: slika ostaje uz lijevi rub
      VRHOVI.add(vrh);
      PROMATRAC_SIRINE.observe(vrh);
    }
    if (PROMATRAC_SIRINE && document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', function () {
        VRHOVI.forEach(function (vrh) { centrirajVrh(vrh, false); });
      });
    }

    // ── PODACI ───────────────────────────────────────────────────────────
    function tekst(v) {
      if (v === null || v === undefined) return '';
      let s = String(v).replace(/<[^>]*>/g, ' ');
      if (s.indexOf('&') !== -1) {                             // &amp; &#8211; ...
        const t = document.createElement('textarea');
        t.innerHTML = s;
        s = t.value;
      }
      return s.replace(/\s+/g, ' ').trim();
    }

    // prva vrijednost koja je zadana (null, undefined i '' se preskaču)
    function prvo() {
      for (let i = 0; i < arguments.length; i++) {
        if (arguments[i] !== null && arguments[i] !== undefined && arguments[i] !== '') return arguments[i];
      }
      return null;
    }

    function uzmiKartice(trace) {
      let p = trace && trace.payload;
      if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = null; } }
      const lista = (p && p.cards) || [];
      if (!Array.isArray(lista)) return [];
      return lista.filter(Boolean).map(function (c) {
        // promo kod: { promo: { code, percent, price, validUntil } } ili ravna polja
        const promo = (c.promo && typeof c.promo === 'object') ? c.promo : {};
        return {
          naziv: tekst(c.title),
          opis: p.hideDescription === true ? '' : tekst(c.description),
          cijena: c.price,
          stara: c.oldPrice,
          slika: c.imageUrl || '',
          logo: sigurniLink(prvo(c.brandLogo, c.brandLogoUrl) || ''),
          url: c.url || '',
          kod: tekst(prvo(promo.code, c.promoCode)),
          kodPostotak: prvo(promo.percent, c.promoPercent),
          kodCijena: prvo(promo.price, c.promoPrice),
          kodRok: prvo(promo.validUntil, c.promoValidUntil)
        };
      });
    }

    // "Mancera ▻ Red Tobacco Eau de Parfum"
    //   → marka "Mancera", naziv "Red Tobacco", vrsta "Eau de Parfum"
    const RAZDJELNIK = /\s*[▻►▸▹▶›»|]\s*/;
    // vrsta mirisa na kraju naziva, po želji s volumenom i oznakom testera
    // ("Eau de Parfum 100 ml", "Eau de Toilette (50 ml)", "EDP 100ml Tester")
    const VRSTA = /\s+(extrait de parfum|eau de parfum(?: intense)?|eau de toilette(?: intense)?|eau de cologne|parfum|parfemska voda|toaletna voda|kolonjska voda|edp|edt|edc)(?:\s*[,\u2013-]?\s*\(?(\d+(?:[.,]\d+)?\s?ml)\)?)?(?:\s*[,\u2013-]?\s*\(?(tester)\)?)?\s*$/i;
    const KRATICE = { edp: 'Eau de Parfum', edt: 'Eau de Toilette', edc: 'Eau de Cologne' };
    // jednako pisanje bez obzira na to kako je naziv upisan ("Eau De Toilette", "EAU DE PARFUM"...)
    function urednaVrsta(v) {
      const m = v.toLowerCase();
      if (KRATICE[m]) return KRATICE[m];
      if (/^(eau|extrait) /.test(m)) return m.replace(/(^|\s)(eau|extrait|parfum|toilette|cologne|intense)\b/g, function (x) { return x.charAt(0) === ' ' ? ' ' + x.charAt(1).toUpperCase() + x.slice(2) : x.charAt(0).toUpperCase() + x.slice(1); });
      return m.charAt(0).toUpperCase() + m.slice(1);
    }

    function odvojiVrstu(naziv) {
      const m = naziv ? naziv.match(VRSTA) : null;
      if (!m) return { naziv: naziv, vrsta: '' };
      const ostatak = naziv.slice(0, m.index).trim();
      // "Libre Le Parfum": "Le Parfum" je dio imena, a ne vrsta
      if (!ostatak || (/^parfum$/i.test(m[1]) && /(^|\s)(le|la|les|the|de|du|des|di|il)$/i.test(ostatak))) {
        return { naziv: naziv, vrsta: '' };
      }
      const vrsta = urednaVrsta(m[1]);
      const dijelovi = [vrsta];
      if (m[2]) dijelovi.push(m[2].replace(/\s?ml$/i, '\u00a0ml'));
      if (m[3]) dijelovi.push('Tester');
      return { naziv: ostatak, vrsta: dijelovi.join(' \u00b7 ') };
    }

    function razdvojiNaziv(pun) {
      const r = { marka: '', naziv: pun || '', vrsta: '' };
      if (pun) {
        const dijelovi = pun.split(RAZDJELNIK);
        if (dijelovi.length > 1) {
          const ostatak = dijelovi.slice(1).join(' ').trim();
          if (dijelovi[0].trim() && ostatak) {
            r.marka = dijelovi[0].trim();
            r.naziv = ostatak;
          }
        }
      }
      const v = odvojiVrstu(r.naziv);
      r.naziv = v.naziv;
      r.vrsta = v.vrsta;
      return r;
    }

    // Duge riječi dobiju nevidljiva mjesta za dijeljenje (meke crtice) po
    // slogovima: preglednik ih prelomi samo kad treba, s crticom na kraju retka.
    // Tako obostrano poravnat opis nema rupa među riječima ni na uređajima
    // koji sami ne znaju dijeliti hrvatske riječi.
    const SAMOGLASNIK = /[aeiou]/i;
    function slogovi(rijec) {
      if (rijec.length < 9) return rijec;
      const s = rijec, z = function (i) { return SAMOGLASNIK.test(s[i]); };
      let van = s[0] + s[1], zadnji = 0;
      for (let i = 2; i < s.length; i++) {
        const lijevo = i, desno = s.length - i;
        let dijeli = false;
        if (lijevo >= 2 && desno >= 3 && i - zadnji >= 2 && !z(i) && z(i + 1)) {
          if (z(i - 1)) dijeli = true;                                   // sa-mo
          // kon-ven; ali lj, nj, dž i skupine s r/l ostaju zajedno (du-go-traj)
          else if (z(i - 2) && !/^(lj|nj|dž)$/i.test(s[i - 1] + s[i]) && !/[rl]/i.test(s[i])) dijeli = true;
        }
        // do-go-traj: suglasnik + r/l ispred samoglasnika idu zajedno u novi slog
        if (!dijeli && lijevo >= 2 && desno >= 3 && i - zadnji >= 2 && z(i - 1) && !z(i) && /[rl]/i.test(s[i + 1] || '') && z(i + 2)) dijeli = true;
        if (dijeli) { van += '\u00ad'; zadnji = i; }
        van += s[i];
      }
      return van;
    }
    function mekeCrtice(tekst) {
      return tekst.replace(/[a-zčćđšž]{9,}/gi, slogovi);
    }

    function skrati(s, max) {
      if (!s || !max || s.length <= max) return s;
      let t = s.slice(0, max);
      const razmak = t.lastIndexOf(' ');
      if (razmak > max * 0.6) t = t.slice(0, razmak);
      return t.replace(/[\s,;:.\u2013-]+$/, '') + '\u2026';
    }

    // "94.00", "94,00 €", 1299.5 → broj
    function brojIz(v) {
      if (typeof v === 'number') return isFinite(v) ? v : null;
      if (v === null || v === undefined) return null;
      let s = String(v).replace(/[^\d.,]/g, '');
      if (!s) return null;
      const d = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
      if (d !== -1 && s.length - d - 1 <= 2) s = s.slice(0, d).replace(/[.,]/g, '') + '.' + s.slice(d + 1);
      else s = s.replace(/[.,]/g, '');
      const n = parseFloat(s);
      return isFinite(n) ? n : null;
    }

    // Broj samo ako je vrijednost stvarno "čista" cijena (ne npr. "od 49 €")
    function brojCijene(v) {
      if (v === null || v === undefined || v === '') return null;
      if (typeof v === 'number') return isFinite(v) ? v : null;
      const s = String(v).trim();
      return /^(€|eur)?\s*[\d.,\s]+\s*(€|eur)?$/i.test(s) ? brojIz(s) : null;
    }

    // Uvijek hrvatski format: 94,00 € / 1.299,00 €
    function cijena(v) {
      if (v === null || v === undefined || v === '') return '';
      const n = brojCijene(v);
      if (n !== null) return EUR.format(n);
      return String(v).trim().replace(/(\d)\.(\d{2})(?!\d)/g, '$1,$2');
    }

    function elementCijene(v) {
      const t = cijena(v);
      return t ? el('span', 'mx-cijena', t) : null;
    }

    // Je li rok promo koda prošao: "2026-10-31", "2026-10-31T18:00" (i sa
    // zonom, npr. "Z" ili "+02:00") ili "31. 10. 2026." (bez sata vrijedi do
    // kraja tog dana). Rok upisan drugačije ne skriva kod.
    function rokProsao(v) {
      if (v === null || v === undefined || v === '') return false;
      const s = String(v).trim();
      // vrijeme sa zonom ("…T18:00Z", "…T18:00+02:00"): pretvori ga sam preglednik
      if (/T\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
        const t = Date.parse(s);
        if (!isNaN(t)) return t < Date.now();
      }
      let g, mj, d, h = 23, min = 59, sek = 59;
      let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/);
      if (m) {
        g = +m[1]; mj = +m[2]; d = +m[3];
        if (m[4] !== undefined) { h = +m[4]; min = +m[5]; sek = 0; }
      } else if ((m = s.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?$/))) {
        g = +m[3]; mj = +m[2]; d = +m[1];
      } else {
        return false;
      }
      const kraj = new Date(g, mj - 1, d, h, min, sek);
      return !isNaN(kraj.getTime()) && kraj.getTime() < Date.now();
    }

    // Promo kod artikla → { tekst, postotak, cijena (s kodom; null kad se ne zna) }
    // ili null. nCijena: trenutna cijena kao broj (ili null).
    function promoKod(k, nCijena) {
      if (!k.kod || rokProsao(k.kodRok)) return null;
      let postotak = k.kodPostotak !== null ? Math.abs(brojIz(k.kodPostotak) || 0) : 0;
      let sKodom = brojCijene(k.kodCijena);
      if (!postotak && sKodom !== null && nCijena) postotak = (1 - sKodom / nCijena) * 100;
      const tocan = postotak;                                  // za izračun cijene s kodom
      postotak = Math.round(postotak * 10) / 10;               // za prikaz
      if (!(postotak > 0 && postotak < 100)) return null;      // bez iznosa popusta kod se ne spominje
      // cijena s kodom samo kad je i trenutna cijena čist broj (ne npr. "od 49 €")
      if (nCijena === null) sKodom = null;
      else if (sKodom === null) sKodom = Math.round(nCijena * (100 - tocan)) / 100;
      if (sKodom !== null && !(sKodom < nCijena)) sKodom = null;
      return { tekst: k.kod, postotak: postotak, cijena: sKodom };
    }

    // "−30 % uz kod MRTMX" (kad cijena s kodom nije poznata)
    function natpisKoda(kod) {
      return '\u2212' + String(kod.postotak).replace('.', ',') + '\u00a0% ' + P.tekstUzKod + ' ' + kod.tekst;
    }

    // voštani pečat s postotkom (čitaču zaslona postotak je već u tekstu cijene)
    function pecat(p) {
      const v = el('span', 'mx-pecat');
      v.setAttribute('aria-hidden', 'true');
      v.appendChild(el('span', 'mx-pecat-vosak'));
      const t = el('span', 'mx-pecat-tekst');
      t.appendChild(el('span', 'mx-minus', '\u2212'));
      t.appendChild(document.createTextNode(String(p)));
      t.appendChild(el('small', '', '%'));
      v.appendChild(t);
      return v;
    }

    function sigurniLink(url) {
      if (!url) return '';
      try {
        const u = new URL(url, window.location.href);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
        return u.href;
      } catch (e) { return ''; }
    }

    // Pamti koje su preporuke već "raspršene" da se animacija ne ponavlja
    function hash(s) {
      let h = 5381;
      for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
      return (h >>> 0).toString(36);
    }
    function trebaPojava(tip, kartice) {
      const potpis = hash(tip + '|' + kartice.map(function (k) {
        // popust je dio potpisa (samo kad ga ima, pa kartice bez popusta imaju isti potpis
        // kao u v30): proizvod koji se već pojavio bez popusta pojavi se opet kad dobije popust
        const c = brojIz(k.cijena), st = brojIz(k.stara);
        const popust = (c !== null && st !== null && st > c) || k.kod
          ? '~' + [k.cijena, k.stara, k.kod, k.kodPostotak, k.kodCijena].join('~') : '';
        return k.url + '~' + k.naziv + popust;
      }).join('|'));
      const KLJUC = 'mx_kartice_prikazano';
      const sad = Date.now();
      try {
        const lista = JSON.parse(localStorage.getItem(KLJUC) || '[]');
        const zapis = lista.find(function (z) { return z && z.s === potpis; });
        if (zapis) return sad - zapis.t < 4000;              // isti prikaz u istom trenutku
        lista.push({ s: potpis, t: sad });
        localStorage.setItem(KLJUC, JSON.stringify(lista.slice(-40)));
      } catch (e) { /* bez localStorage → uvijek animiraj */ }
      return true;
    }

    // ── LOGO MARKE ───────────────────────────────────────────────────────
    // Na stranici proizvoda na martimex.hr iznad naziva artikla je logo marke,
    // u poveznici na stranicu marke: <a href=".../brand/versace/"><img src=...>.
    // Logo se odande uzme za karticu iste marke i zapamti u pregledniku
    // (localStorage), pa kartica te marke poslije ima logo i na drugim
    // stranicama (npr. u pretrazi). Na adresu loga se ne može doći iz imena
    // marke (Versace → .../2024/10/Versace_logo1-2.svg), pa samo tako.
    const KLJUC_LOGOTIPA = 'mx_logotipi_marki';
    const NAJVISE_LOGOTIPA = 300;

    // kao adresa stranice marke na martimex.hr (WordPress): "Dolce&Gabbana" →
    // "dolcegabbana", "Van Cleef & Arpels" → "van-cleef-arpels", "Floraïku" → "floraiku"
    function slugMarke(s) {
      s = String(s || '');
      if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return s.toLowerCase().replace(/['\u2019`&]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    // ista marka i kad se razlikuju samo crtice ("dolce-gabbana" i "dolcegabbana")
    // ili je jedan naziv dulji ("memo" i "memo-paris")
    function istaMarka(a, b) {
      if (!a || !b) return false;
      return a.replace(/-/g, '') === b.replace(/-/g, '') || a.indexOf(b + '-') === 0 || b.indexOf(a + '-') === 0;
    }

    // ime marke na stranici proizvoda (JSON-LD ili Alpine podaci), jer se adresa
    // stranice marke ponekad ne slaže s imenom (Rabanne → /brand/paco-rabanne/)
    function markaStranice() {
      try {
        const skripte = document.querySelectorAll('script[type="application/ld+json"]');
        for (let i = 0; i < skripte.length; i++) {
          let d;
          try { d = JSON.parse(skripte[i].textContent || ''); } catch (e) { continue; }
          const lista = [].concat(d && d['@graph'] ? d['@graph'] : d);
          for (let j = 0; j < lista.length; j++) {
            const x = lista[j];
            if (!x || [].concat(x['@type'] || []).indexOf('Product') === -1 || !x.brand) continue;
            const ime = typeof x.brand === 'string' ? x.brand : (x.brand.name || '');
            if (ime) return tekst(ime);
          }
        }
        const sekcija = document.querySelector('section.product');
        const A = window.Alpine;
        const pod = sekcija && A && typeof A.$data === 'function' ? A.$data(sekcija) : null;
        if (pod && pod.product && pod.product.brandName) return tekst(pod.product.brandName);
      } catch (e) { /* nema podataka: samo adresa stranice marke */ }
      return '';
    }

    function zapamceniLogotipi() {
      try {
        const o = JSON.parse(localStorage.getItem(KLJUC_LOGOTIPA) || '{}');
        return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
      } catch (e) { return {}; }
    }
    function zapamtiLogotipe(nadjeni) {
      try {
        const sve = zapamceniLogotipi();
        let promjena = false;
        Object.keys(nadjeni).forEach(function (k) {
          if (sve[k] === nadjeni[k]) return;
          delete sve[k];                  // zadnji viđeni idu na kraj popisa
          if (nadjeni[k]) sve[k] = nadjeni[k];
          promjena = true;
        });
        if (!promjena) return;
        const kljucevi = Object.keys(sve);
        kljucevi.slice(0, Math.max(0, kljucevi.length - NAJVISE_LOGOTIPA)).forEach(function (k) { delete sve[k]; });
        localStorage.setItem(KLJUC_LOGOTIPA, JSON.stringify(sve));
      } catch (e) { /* bez localStorage: logo samo na stranici proizvoda */ }
    }

    // logotipi marki sa stranice proizvoda: { "versace": "https://..." }
    function logotipiSaStranice() {
      const nadjeni = {};
      let poveznice = [];
      try { poveznice = document.querySelectorAll('.product__title-wrap a[href*="/brand/"]'); } catch (e) { return nadjeni; }
      for (let i = 0; i < poveznice.length; i++) {
        try {
          const m = (poveznice[i].getAttribute('href') || '').match(/\/brand\/([^\/?#]+)/);
          const img = poveznice[i].querySelector('img');
          if (!m || !img) continue;
          const src = [img.currentSrc, img.getAttribute('src'), img.getAttribute('data-src'), img.getAttribute('data-lazy-src')]
            .map(sigurniLink).filter(Boolean)[0];   // data: (rezervirano mjesto za lijeno učitavanje) se preskače
          const slug = slugMarke(decodeURIComponent(m[1]));
          if (src && slug) nadjeni[slug] = src;
        } catch (e) { /* neispravna poveznica: preskoči */ }
      }
      // stranica proizvoda ima jedan logo: zapamti ga i pod imenom marke
      const adrese = Object.keys(nadjeni);
      if (adrese.length === 1) {
        const ime = slugMarke(markaStranice());
        if (ime && !nadjeni[ime]) nadjeni[ime] = nadjeni[adrese[0]];
      }
      if (adrese.length) zapamtiLogotipe(nadjeni);
      return nadjeni;
    }

    function logoMarke(marka) {
      if (!LM.prikazi) return '';
      const slug = slugMarke(marka);
      if (!slug) return '';
      const izvori = [logotipiSaStranice(), zapamceniLogotipi()];
      for (let i = 0; i < izvori.length; i++) {
        if (izvori[i][slug]) return sigurniLink(izvori[i][slug]);
        const k = Object.keys(izvori[i]).filter(function (x) { return istaMarka(x, slug); })[0];   // npr. "dolcegabbana"
        if (k) return sigurniLink(izvori[i][k]);
      }
      return '';
    }
    function zaboraviLogo(src) {
      const sve = zapamceniLogotipi(), losi = {};
      Object.keys(sve).forEach(function (k) { if (sve[k] === src) losi[k] = ''; });
      if (Object.keys(losi).length) zapamtiLogotipe(losi);
    }

    // čim se otvori stranica proizvoda, njezin logo marke se zapamti
    if (LM.prikazi) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', logotipiSaStranice, { once: true });
      else logotipiSaStranice();
    }

    // logo umjesto imena marke. Uz logo je i ime slovima, skriveno: pokaže se
    // kad se logo ne učita i u načinu visokog kontrasta (Windows), gdje bi crni
    // logo na tamnoj podlozi bio nevidljiv
    function slikaLoga(src, marka, vrh, rezerva) {
      const img = el('img', 'mx-marka-logo');
      img.alt = marka || '';
      img.decoding = 'async';
      img.draggable = false;
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('load', function () {
        const omjer = img.naturalWidth / img.naturalHeight;
        if (omjer > 0 && isFinite(omjer)) img.style.height = Math.min(LM.visina, LM.najvecaSirina / omjer).toFixed(1) + 'px';
        centrirajVrh(vrh, true);
      }, { once: true });
      img.addEventListener('error', function () {
        zaboraviLogo(src);
        img.remove();
        if (rezerva) rezerva.classList.remove('mx-marka-rezerva');
        centrirajVrh(vrh, true);
      }, { once: true });
      img.src = src;
      return img;
    }

    // ── GRADNJA ──────────────────────────────────────────────────────────
    function el(tag, klasa, sadrzaj) {
      const e = document.createElement(tag);
      if (klasa) e.className = klasa;
      if (sadrzaj !== undefined) e.textContent = sadrzaj;
      return e;
    }

    function prazanIzlog(nisa) {
      nisa.classList.add('mx-bez-slike');
      const p = el('span', 'mx-prazno');
      p.innerHTML = IKONA_BOCA;
      nisa.appendChild(p);
    }

    // Fotografija proizvoda se "čita" preko canvasa (moguće kad je slika s iste
    // domene kao stranica, npr. martimex.hr → martimex.hr):
    //  - pozadina (4 kuta): bijela ili svijetlosiva postaje prava prozirnost,
    //    tamna ili šarena fotografija ispuni okvir kao uokvirena slika
    //  - boja stakla oboji sjenu ispod bočice (crne, bijele, sive, prozirne → osnovna),
    //    a tamna bočica dobije topao sjaj, a svijetla biserni (vidi tonoviBocice)
    //  - bočica se kvalitetno umanji točno na veličinu prikaza × gustoća piksela
    //    ekrana: preglednik je više ne mora umanjivati, pa je oštra i u pokretu
    // Kad se slika ne može pročitati, ostaje CSS stapanje (darken); aura je i
    // tada u boji bočice, jer je zamućena kopija iste slike.
    function obradiFotografiju(img, nisa, velicina, zavrsi) {
      let gotovo = false;
      const kraj = function () { if (!gotovo) { gotovo = true; zavrsi(); } };
      setTimeout(kraj, 2500);        // sigurnost: bočica se prikaže i ako obrada zapne

      const W = img.naturalWidth, H = img.naturalHeight;

      // 1) mali uzorak cijele fotografije: kakva je pozadina i koje je boje staklo
      const U = 48;
      let u;
      try {
        const c = document.createElement('canvas');
        c.width = U;
        c.height = U;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0, U, U);
        u = g.getImageData(0, 0, U, U).data;
      } catch (e) { kraj(); return; } // slika s druge domene: ostaje CSS stapanje

      function kut(x0, y0) {
        let r = 0, gr = 0, b = 0, a = 0, n = 0;
        for (let y = y0; y < y0 + 3; y++) {
          for (let x = x0; x < x0 + 3; x++) {
            const i = (y * U + x) * 4;
            r += u[i]; gr += u[i + 1]; b += u[i + 2]; a += u[i + 3]; n++;
          }
        }
        if (a / n < 180) return null;  // prozirno
        const lo = Math.min(r, gr, b) / n;
        return { lo: lo, boja: Math.max(r, gr, b) / n - lo };
      }
      const puni = [kut(0, 0), kut(U - 3, 0), kut(0, U - 3), kut(U - 3, U - 3)]
        .filter(function (z) { return z && z.lo < 246; })
        .sort(function (a, b) { return a.lo - b.lo; });
      let pojacaj = 1;               // > 1 kad je pozadina svijetlosiva (studijska)
      let prag = 236;                // piksel tamniji od ovoga pripada bočici, ne pozadini
      if (puni.length >= 2) {
        const lo = puni[1].lo;       // drugi najtamniji kut: jedan "zalutali" kut ne odlučuje
        const boja = Math.max.apply(null, puni.slice(1).map(function (z) { return z.boja; }));
        if (lo >= 212 && boja <= 18) {
          pojacaj = Math.min(1.2, 255 / lo);
          prag = lo - 16;
        } else {
          nisa.classList.add('mx-foto');
          kraj();
          return;
        }
      }
      tonoviBocice(u, prag, nisa);

      // 2) radna kopija (najviše 900 px): bijela pozadina → prozirnost,
      //    a usput se nađu stvarne granice bočice na fotografiji
      const R = Math.min(1, 900 / Math.max(W, H));
      const rw = Math.max(8, Math.round(W * R)), rh = Math.max(8, Math.round(H * R));
      let radna, rg, rp;
      try {
        const um = umanji(img, W, H, rw, rh);
        radna = document.createElement('canvas');
        radna.width = rw;
        radna.height = rh;
        rg = radna.getContext('2d', { willReadFrequently: true });
        rg.imageSmoothingEnabled = true;
        rg.imageSmoothingQuality = 'high';
        rg.drawImage(um.slika, 0, 0, um.w, um.h, 0, 0, rw, rh);
        rp = rg.getImageData(0, 0, rw, rh);
      } catch (e) { kraj(); return; }
      const d = rp.data;
      const SUM = 4;                 // JPEG šum oko čiste bijele
      let x0 = rw, y0 = rh, x1 = -1, y1 = -1;
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        if (d[i + 3] === 0) continue;
        const r = Math.min(255, d[i] * pojacaj);
        const gr = Math.min(255, d[i + 1] * pojacaj);
        const b = Math.min(255, d[i + 2] * pojacaj);
        const a = Math.max(0, 255 - SUM - Math.min(r, gr, b)) / (255 - SUM);
        if (a <= 0) { d[i + 3] = 0; continue; }
        // boje se "odvoje" od bijele: rubovi i sjene s fotografije ostanu mekani
        d[i] = 255 - (255 - r) / a;
        d[i + 1] = 255 - (255 - gr) / a;
        d[i + 2] = 255 - (255 - b) / a;
        d[i + 3] = a * d[i + 3];
        if (d[i + 3] > 60) {         // dovoljno "puno" da pripada bočici
          const x = p % rw, y = (p - x) / rw;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
      rg.putImageData(rp, 0, 0);
      if (x1 < x0 || y1 < y0) { x0 = 0; y0 = 0; x1 = rw - 1; y1 = rh - 1; }   // ništa nađeno: cijela slika

      // 3) kadar: svaka bočica stoji na istoj podlozi, jednako velika i centrirana,
      //    točno u pikselima ekrana (preglednik je više ne mora umanjivati)
      const gustoca = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)));
      const cw = Math.round(velicina[0] * gustoca), ch = Math.round(velicina[1] * gustoca);
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const k = Math.min(cw * KADAR.sirina / bw, ch * (KADAR.pod - KADAR.vrh) / bh, 1.25);
      const ox = cw / 2 - (x0 + bw / 2) * k;
      const oy = ch * KADAR.pod - (y1 + 1) * k;
      let izvor = radna, iw = rw, ih = rh, kk = k;
      while (kk < 0.5 && iw > 32 && ih > 32) {   // velik skok umanjivanja → u koracima
        const c = document.createElement('canvas');
        c.width = Math.round(iw / 2);
        c.height = Math.round(ih / 2);
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = 'high';
        g.drawImage(izvor, 0, 0, c.width, c.height);
        izvor = c; iw = c.width; ih = c.height; kk *= 2;
      }
      let platno;
      try {
        platno = document.createElement('canvas');
        platno.width = cw;
        platno.height = ch;
        const g = platno.getContext('2d');
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = 'high';
        g.drawImage(izvor, 0, 0, iw, ih, ox, oy, rw * k, rh * k);
      } catch (e) { kraj(); return; }

      // sjena široka kao bočica, aura centrirana na bočicu
      const sirina = Math.max(0.3, Math.min(0.62, (bw * k / cw) * 1.15));
      nisa.style.setProperty('--mx-sjena-x', ((1 - sirina) / 2 * 100).toFixed(1) + '%');
      nisa.style.setProperty('--mx-sirina-boce', (bw * k / cw).toFixed(3));   // za centriranje gornjeg dijela
      nisa.style.setProperty('--mx-sredina', ((KADAR.pod - bh * k / ch / 2) * 100).toFixed(1) + '%');
      // pola širine bočice, u postotcima polumjera ovalne maske (pola širine prostora):
      // od tuda se računa "rupa" u masci svijetle bočice, da sjaj počne odmah uz staklo
      const rub = bw * k / cw * 100;
      const rubKraj = Math.min(68, rub * 1.15 + 6);           // do tu je sjaj pun, dalje se gasi preko bar trećine polumjera
      nisa.style.setProperty('--mx-rupa', (rub * 0.8).toFixed(1) + '%');
      nisa.style.setProperty('--mx-rupa-kraj', rubKraj.toFixed(1) + '%');
      nisa.style.setProperty('--mx-rupa-sred', ((rubKraj + 100) / 2).toFixed(1) + '%');

      // bijela silueta bočice za podlogu ispod nje: unutrašnjost bočice ispunjena po
      // recima (od prvog do zadnjeg piksela koji nije pozadina; i gotovo prozirno
      // staklo se računa), pa su i bijela etiketa i prozirno staklo pokriveni bijelim,
      // a rub zadržava mekoću obrađene slike
      let silueta = null;
      try {
        const sp = platno.getContext('2d').getImageData(0, 0, cw, ch).data;
        silueta = document.createElement('canvas');
        silueta.width = cw;
        silueta.height = ch;
        const sg = silueta.getContext('2d');
        const so = sg.createImageData(cw, ch), o = so.data;
        for (let y = 0; y < ch; y++) {
          let x0 = -1, x1 = -1;
          for (let x = 0; x < cw; x++) if (sp[(y * cw + x) * 4 + 3] > 8) { if (x0 < 0) x0 = x; x1 = x; }
          for (let x = 0; x < cw; x++) {
            const i = (y * cw + x) * 4;
            o[i] = 255; o[i + 1] = 255; o[i + 2] = 255;
            o[i + 3] = (x0 >= 0 && x >= x0 && x <= x1) ? 255 : sp[i + 3];
          }
        }
        sg.putImageData(so, 0, 0);
      } catch (e) { silueta = null; }

      // obrađena slika ide u bočicu i auru, silueta u podlogu; kad silueta nije
      // uspjela, podloga je ista slika pobijeljena filterom (klasa mx-podloga-iz-slike)
      const zamijeni = function (url, urlSilueta) {
        if (!url) { kraj(); return; }
        img.addEventListener('load', kraj, { once: true });
        nisa.classList.add('mx-prozirno');
        if (!urlSilueta) nisa.classList.add('mx-podloga-iz-slike');
        void nisa.offsetWidth;        // stil se preračuna sad, da pojava (dizanje s 8 px) krene za sve dijelove jednako
        img.src = url;
        nisa.querySelectorAll('.mx-aura-slika').forEach(function (a) { a.src = url; });
        nisa.querySelectorAll('.mx-aura-podloga').forEach(function (a) { a.src = urlSilueta || url; });
      };
      const urlovi = {};
      const spremi = function (kljuc, url) {
        urlovi[kljuc] = url;
        if ('boca' in urlovi && 'silueta' in urlovi) zamijeni(urlovi.boca, urlovi.silueta);
      };
      try {
        if (platno.toBlob) {
          platno.toBlob(function (blob) { spremi('boca', blob ? URL.createObjectURL(blob) : ''); }, 'image/png');
          if (silueta) silueta.toBlob(function (blob) { spremi('silueta', blob ? URL.createObjectURL(blob) : ''); }, 'image/png');
          else spremi('silueta', '');
        } else {
          spremi('silueta', silueta ? silueta.toDataURL('image/png') : '');
          spremi('boca', platno.toDataURL('image/png'));
        }
      } catch (e) { kraj(); }
    }

    // Kvalitetno umanjivanje: velika fotografija se prepolovi korak po korak
    // (jedan veliki skok s 2000 na 200 px daje nazubljene rubove)
    function umanji(izvor, w, h, ciljW, ciljH) {
      let slika = izvor;
      while (w / 2 >= ciljW && h / 2 >= ciljH) {
        w = Math.round(w / 2);
        h = Math.round(h / 2);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = 'high';
        g.drawImage(slika, 0, 0, w, h);
        slika = c;
      }
      return { slika: slika, w: slika === izvor ? izvor.naturalWidth : w, h: slika === izvor ? izvor.naturalHeight : h };
    }

    // Aura je već u boji bočice (zamućene kopije slike); ovdje se samo:
    //  - sjena ispod bočice oboji tamnim tonom boje stakla
    //  - tamna bočica (crna, tamnosmeđa) dobije topao, svilen sjaj umjesto sivog
    //  - svijetla bočica (prozirno staklo, bijela) dobije biserni sjaj u svojoj boji
    function tonoviBocice(d, prag, nisa) {
      let r = 0, g = 0, b = 0, t = 0, svjetlina = 0, n = 0;
      const korak = Math.max(1, Math.floor(d.length / 4 / 6000)) * 4;   // dovoljan uzorak piksela
      for (let i = 0; i < d.length; i += korak) {
        if (d[i + 3] < 128) continue;                          // prozirni dio slike
        const mn = Math.min(d[i], d[i + 1], d[i + 2]);
        const mx = Math.max(d[i], d[i + 1], d[i + 2]);
        if (mn >= prag) continue;                              // pozadina
        svjetlina += (mx + mn) / 2; n++;                       // prosječna svjetlina cijele bočice
        const w = (mx - mn) / 255 + 0.02;                      // obojeni pikseli vrijede više od sivih
        r += d[i] * w; g += d[i + 1] * w; b += d[i + 2] * w; t += w;
      }
      if (!t) return;
      if (svjetlina / n / 255 < 0.3) nisa.classList.add('mx-aura-tamna');
      const c = uHsl(r / t, g / t, b / t);
      if (svjetlina / n / 255 > 0.62) {                        // svijetla bočica: biserni sjaj u njezinoj boji
        nisa.classList.add('mx-aura-svijetla');                //  (siva ili bijela → topao neutralan ton)
        const siva = c.s < 0.15;
        const ton = (siva ? 22 : Math.round(c.h)) + ', ' + (siva ? 22 : Math.round(Math.min(36, Math.max(24, c.s * 100)))) + '%';
        const svj = Math.min(92, Math.max(80, Math.round(svjetlina / n / 255 * 100) + 2));   // sjaj nije tamniji od stakla
        nisa.style.setProperty('--mx-sjaj', 'hsla(' + ton + ', ' + svj + '%, 1)');
        nisa.style.setProperty('--mx-sjaj-2', 'hsla(' + ton + ', ' + Math.min(95, svj + 5) + '%, .4)');   // kupka: blijeđi nastavak sjaja
      }
      if (c.s > 0.6) {                                         // jako zasićeno staklo: sjaj uz rub blaži, da ne bude neon
        nisa.classList.add('mx-aura-zasicena');
        nisa.style.setProperty('--mx-sjaj-zasic', '1.5');
      }
      if (c.s < 0.2 || c.l < 0.1 || c.l > 0.92) return;        // crna, bijela, siva ili prozirna → osnovna sjena
      const h = Math.round(c.h);
      const sat = Math.round(Math.min(62, Math.max(38, c.s * 100)));
      nisa.style.setProperty('--mx-sjena', 'hsla(' + h + ', ' + Math.round(sat * .7) + '%, 28%, .32)');
      nisa.style.setProperty('--mx-pod', 'hsla(' + h + ', ' + sat + '%, 72%, .3)');   // svjetlo na podlozi
    }

    function uHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
      if (mx === mn) return { h: 0, s: 0, l: l };
      const dd = mx - mn;
      const s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
      let h;
      if (mx === r) h = (g - b) / dd + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / dd + 2;
      else h = (r - g) / dd + 4;
      return { h: h * 60, s: s, l: l };
    }

    // istaknuta = true: jedini proizvod u poruci (ista kartica, smije biti šira)
    function izgradiKarticu(k, i, istaknuta) {
      const link = sigurniLink(k.url);
      const kartica = el('div', istaknuta ? 'mx-kartica mx-kartica--istaknuta' : 'mx-kartica');
      kartica.style.setProperty('--mx-i', String(i));
      pratiVidljivost(kartica);
      const vrh = el('div', 'mx-vrh');

      // SLIKA: bočica u auri, sa sjenom ispod
      const izlog = el('div', 'mx-izlog');
      const nisa = el('div', 'mx-nisa');
      nisa.appendChild(el('span', 'mx-aura-pod'));   // svjetlo na podlozi, ispod sjene
      nisa.appendChild(el('span', 'mx-sjena'));
      const lebdi = el('span', 'mx-lebdi');          // bočica i aura plutaju zajedno
      lebdi.appendChild(el('span', 'mx-aura'));
      nisa.appendChild(lebdi);
      if (k.slika) {
        // aura iz same fotografije: dvije zamućene kopije iza bočice (oreol
        // .mx-aura-slika i sjaj uz rub .mx-aura-sjaj u .mx-aura-okvir), a ispod
        // obrađene bočice bijela silueta (.mx-aura-podloga)
        const ukras = function (klasa) {
          const u = el('img', klasa);
          u.alt = '';
          u.decoding = 'async';
          u.draggable = false;
          u.setAttribute('aria-hidden', 'true');
          return u;
        };
        const aura = ukras('mx-aura-slika');                   // širok, mekan oreol
        const sjaj = ukras('mx-aura-slika mx-aura-sjaj');      // uzak sjaj uz rub bočice
        const okvir = el('span', 'mx-aura-okvir');
        okvir.appendChild(el('span', 'mx-aura-kupka'));   // svjetlosna kupka svijetle bočice
        okvir.appendChild(aura);
        okvir.appendChild(sjaj);
        lebdi.appendChild(okvir);
        lebdi.appendChild(ukras('mx-aura-podloga'));   // src dobije tek obrađena slika
        nisa.classList.add('mx-aura-iz-slike');
        const img = el('img', 'mx-boca');
        img.alt = '';                 // naziv je već u tekstu kartice
        img.decoding = 'async';
        img.draggable = false;
        if ('fetchPriority' in img) img.fetchPriority = 'high';   // slike su glavni sadržaj poruke
        const velicina = VITRINA;     // prostor slike u CSS px
        let spremno = false;
        const gotovo = function () {
          if (spremno || !img.naturalWidth) return;
          spremno = true;
          obradiFotografiju(img, nisa, velicina, function () {
            nisa.classList.add('mx-ucitano');
            centrirajVrh(vrh, true);    // sad se zna koliko je bočica široka
          });
        };
        img.addEventListener('load', gotovo, { once: true });
        img.addEventListener('error', function () {
          img.remove();
          // bez slike: roza aura oko ikone
          lebdi.querySelectorAll('.mx-aura-okvir, .mx-aura-podloga').forEach(function (u) { u.remove(); });
          nisa.classList.remove('mx-aura-iz-slike');
          prazanIzlog(nisa);
          centrirajVrh(vrh, true);
        }, { once: true });
        img.src = k.slika;
        aura.src = k.slika; sjaj.src = k.slika;   // tek nakon bočice: zajedničko preuzimanje ostaje visokog prioriteta
        lebdi.appendChild(img);
        if (img.complete) gotovo();
      } else {
        prazanIzlog(nisa);
      }
      izlog.appendChild(nisa);
      vrh.appendChild(izlog);

      // MARKA, NAZIV, CIJENA
      const glava = el('div', 'mx-glava');
      const d = razdvojiNaziv(k.naziv);
      const logo = LM.prikazi ? (k.logo || logoMarke(d.marka)) : '';
      const imeMarke = d.marka ? el('span', logo ? 'mx-marka mx-marka-rezerva' : 'mx-marka', d.marka) : null;
      if (logo) glava.appendChild(slikaLoga(logo, d.marka, vrh, imeMarke));
      if (imeMarke) glava.appendChild(imeMarke);
      if (d.naziv) glava.appendChild(el('div', 'mx-naziv', d.naziv));
      if (d.vrsta) {
        // svaki dio vrste (Eau de Parfum, 100 ml, Tester) je zaseban komadić; točke
        // između njih crta CSS, a razmaci između komadića su tu za čitače zaslona
        const vrsta = el('span', 'mx-vrsta');
        d.vrsta.split(' \u00b7 ').forEach(function (dio, j) {
          if (j) vrsta.appendChild(document.createTextNode(' '));
          vrsta.appendChild(el('span', '', dio));
        });
        glava.appendChild(vrsta);
      }

      // POPUST: precrtana je redovna cijena (ili trenutna, kad popust daje samo
      // kod), ispod nje nova (s kodom, kad ga ima), a pečat pokazuje popust
      const nCijena = brojIz(k.cijena);
      const nStara = brojIz(k.stara);
      const naAkciji = nCijena !== null && nStara !== null && nStara > nCijena;
      const kod = promoKod(k, brojCijene(k.cijena));
      const sKodom = !!kod && kod.cijena !== null;
      const prije = naAkciji ? nStara : (sKodom ? nCijena : null);
      const sada = sKodom ? kod.cijena : nCijena;
      const popust = prije ? Math.round((1 - sada / prije) * 100) : 0;
      const ec = elementCijene(k.cijena);
      if (ec) {
        const cijene = el('div', popust >= 1 ? 'mx-cijene mx-cijene--popust' : 'mx-cijene');
        if (popust >= 1) {
          const red = el('div', 'mx-snizenje');
          const stup = el('div', 'mx-cijene-stup');
          const stara = el('s', 'mx-stara');
          stara.appendChild(el('span', 'mx-skriveno', 'Prije: '));
          stara.appendChild(document.createTextNode(cijena(naAkciji ? k.stara : k.cijena)));
          stup.appendChild(stara);
          const nova = el('span', 'mx-nova');
          nova.appendChild(el('span', 'mx-skriveno', 'Sada: '));
          nova.appendChild(document.createTextNode(sKodom ? EUR.format(kod.cijena) : cijena(k.cijena)));
          stup.appendChild(nova);
          if (sKodom) stup.appendChild(el('span', 'mx-uz-kod', P.tekstUzKod + ' ' + kod.tekst));
          else if (kod) stup.appendChild(el('span', 'mx-uz-kod', natpisKoda(kod)));
          stup.appendChild(el('span', 'mx-skriveno', ' (popust ' + popust + '\u00a0%)'));
          red.appendChild(stup);
          red.appendChild(pecat(popust));
          cijene.appendChild(red);
        } else {
          cijene.appendChild(ec);
          // cijena nije broj (npr. "od 49 €"): kod se samo spomene ispod nje
          if (kod) cijene.appendChild(el('span', 'mx-uz-kod', natpisKoda(kod)));
        }
        glava.appendChild(cijene);
      }
      vrh.appendChild(glava);
      kartica.appendChild(vrh);
      pratiSirinu(vrh);               // centrira se čim je kartica na stranici

      // LINIJA + OPIS (bez opisa, npr. hideDescription, nema ni crte)
      const opis = skrati(k.opis, P.opisZnakova);
      if (opis) {
        const crta = el('div', 'mx-crta');
        crta.setAttribute('aria-hidden', 'true');
        kartica.appendChild(crta);
        const p = el('p', 'mx-opis', mekeCrtice(opis));
        p.lang = 'hr';                  // dijeljenje riječi po hrvatskim pravilima
        kartica.appendChild(p);
      }

      // GUMB: jedini link na kartici
      if (link) {
        kartica.appendChild(el('span', 'mx-razmak'));
        const gumb = el('a', 'mx-gumb');
        gumb.href = link;
        gumb.draggable = false;
        gumb.target = '_self';
        gumb.appendChild(el('span', '', P.tekstGumba));
        const zaCitac = [d.marka, d.naziv, d.vrsta.split(' \u00b7 ').join(', ')].filter(Boolean).join(' ');
        if (zaCitac) gumb.appendChild(el('span', 'mx-skriveno', ': ' + zaCitac));
        kartica.appendChild(gumb);
      }
      return kartica;
    }

    // ── POJAVA ───────────────────────────────────────────────────────────
    function pokreniPojavu(korijen, broj) {
      korijen.classList.add('mx-pojava');
      const magla = el('div', 'mx-maglica');
      magla.setAttribute('aria-hidden', 'true');
      // kapljice: fini mlaz koji ulazi s lijeva i širi se udesno
      const W = korijen.clientWidth || 320;
      const H = korijen.clientHeight || 320;
      const r = Math.random;
      for (let i = 0; i < 18; i++) {
        const kap = el('i', 'mx-kap');
        kap.style.cssText =
          'left:' + Math.round(W * (-0.03 + r() * 0.08)) + 'px;' +
          'top:' + Math.round(H * (0.3 + r() * 0.22)) + 'px;' +
          '--mx-dx:' + Math.round(W * (0.45 + r() * 0.65)) + 'px;' +
          '--mx-dy:' + Math.round((r() - 0.5) * H * 0.55) + 'px;' +
          '--mx-vel:' + (1.8 + r() * 2.6).toFixed(1) + 'px;' +
          'animation-duration:' + Math.round(950 + r() * 650) + 'ms;' +
          'animation-delay:' + Math.round(30 + r() * 360) + 'ms';
        magla.appendChild(kap);
      }
      korijen.appendChild(magla);
      setTimeout(function () { magla.remove(); }, 2300);
      // pojava traje dok se ne utisne i zadnji pečat (crta, nova cijena, pečat)
      setTimeout(function () { korijen.classList.remove('mx-pojava'); }, 140 + broj * 110 + 2500);
    }

    // ── PRIKAZI ──────────────────────────────────────────────────────────
    // Voiceflow zna ponovno pozvati render za istu poruku (npr. kad stigne
    // sljedeća poruka). Tada postojeće kartice ostaju netaknute; da se grade
    // iznova, bočica i efekti ispod kursora na trenutak bi se "resetirali".
    function potpisPrikaza(tip, kartice) {
      return hash(tip + '|' + JSON.stringify(kartice));
    }
    function postojeciKorijen(element, potpis) {
      const djeca = element.children;
      for (let i = 0; i < djeca.length; i++) {
        if (djeca[i].classList.contains('mx') && djeca[i].getAttribute('data-mx-potpis') === potpis) return djeca[i];
      }
      return null;
    }
    const BEZ_CISCENJA = function () {};

    function pripremi(element) {
      ubaciStil(element);
      element.style.width = '100%';
      // drugačije kartice na istom elementu: stare se uklanjaju
      Array.prototype.slice.call(element.children).forEach(function (n) {
        if (n.classList && n.classList.contains('mx')) element.removeChild(n);
      });
    }

    function noviKorijen(klasa, uloga, potpis) {
      const korijen = el('div', 'mx ' + klasa);
      korijen.setAttribute('role', uloga);
      korijen.setAttribute('aria-label', P.oznakaRegije);
      korijen.setAttribute('data-mx-potpis', potpis);
      return korijen;
    }

    function istaknuta(k, element, tip, potpis) {
      const korijen = noviKorijen('mx-istaknuta', 'group', potpis);
      korijen.appendChild(izgradiKarticu(k, 0, true));
      element.appendChild(korijen);
      if (trebaPojava(tip, [k])) pokreniPojavu(korijen, 1);
      return BEZ_CISCENJA;
    }

    function popis(trace, element) {
      const kartice = uzmiKartice(trace);
      if (!kartice.length) return;
      const potpis = potpisPrikaza(trace.type, kartice);
      if (postojeciKorijen(element, potpis)) return BEZ_CISCENJA;
      pripremi(element);
      if (kartice.length === 1) return istaknuta(kartice[0], element, trace.type, potpis);

      const korijen = noviKorijen('mx-lista', 'group', potpis);
      kartice.forEach(function (k, i) { korijen.appendChild(izgradiKarticu(k, i, false)); });
      element.appendChild(korijen);

      if (trebaPojava(trace.type, kartice)) pokreniPojavu(korijen, kartice.length);
      return BEZ_CISCENJA;
    }

    return { popis: popis };
  })();


  // ─────────────────────────────────────────────────────────────────────
  //  EXTENSION
  // ─────────────────────────────────────────────────────────────────────
  const ProductCardExtension = {
    name: 'ProductCard',
    type: 'response',
    match: ({ trace }) => trace.type === 'ext_product_card',
    render: ({ trace, element }) => MX.popis(trace, element),
  };


  // ═════════════════════════════════════════════════════════════════════
  //  REGISTRACIJA — widget na stranici čita ekstenzije iz ovog niza
  // ═════════════════════════════════════════════════════════════════════
  window.MartimexExtensions = window.MartimexExtensions || [];
  window.MartimexExtensions.push(ProductCardExtension);

})();
