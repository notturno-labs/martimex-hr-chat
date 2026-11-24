// Ukratko: Kartice proizvoda koje Marti preporuči
(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — kartice preporučenih proizvoda za Marti (v40)
  //
  //  ProductCardExtension → trace "ext_product_card"
  //  Kartica je široka kao poruka, tj. kao najširi Martin oblačić (najviše
  //  400 px), i stoji u istom stupcu, uz avatar (na mobitelu širokom 375 px
  //  291 px). Jedan proizvod: jedna kartica. Više proizvoda: kartice stoje u
  //  vodoravnoj traci (vrtuljak) koja se lista prstom, mišem, strelicama ili
  //  točkicama ispod nje; svaka se kartica zaustavi na istom mjestu uz
  //  lijevi rub poruke, a desno proviruje sljedeća (vidi VRTULJAK niže). U
  //  chatu (jedan-ekran.js) traka ide do desnog ruba prozora, pa je i
  //  kartica u vrtuljku široka kao poruka, a sljedeća proviruje uz rub
  //  prozora. Izgled je kao na slici prijedloga
  //  (kartica 336 px: Prada Luna Rossa Carbon), ali bez opisa artikla, s malo
  //  većom markom (15 px), malo manjim nazivom (22 px) i gumbom zaobljenim kao
  //  kartica.
  //
  //  Payload koji šalju Voiceflow funkcije kartica:
  //   { cards: [{ title, price, url, imageUrl, features }] }
  //   title    "Prada ▻ Luna Rossa Carbon Eau de Parfum 50 ml": marka "Prada",
  //            naziv "Luna Rossa Carbon", a ispod naziva sivo "Parfemska voda ·
  //            50 ml" (vrsta mirisa na hrvatskom; kod ostalih proizvoda samo
  //            veličina s kraja naziva, npr. "50 ml")
  //   features tri kratke osobine artikla koje napiše Marti (ili polje
  //            "osobine"; stavka smije biti i { text, icon }). Bez osobina
  //            kartica nema taj red (npr. kartice iz tražilice).
  //            Parfemi: tri podatka, svaki s emojijem na početku – miris ·
  //            kada nositi · trajnost, npr.
  //            ["🌊 Svjež i morski", "☀️ Ljeto i ured", "🪶 Nježno uz kožu"].
  //            Emoji se ne prikazuje: kartica umjesto njega nacrta tanku crnu
  //            ikonu iz palete (vidi IKONE PALETE i EMOJI U OSOBINAMA niže),
  //            a iz teksta ukloni svaki emoji. Podatak je tamnim polumasnim
  //            slovima, a ispod njega sitna siva oznaka „Miris”, „Kada
  //            nositi”, „Trajnost” (v36; POSTAVKE: oznakePodataka).
  //            Ostalo (bez emojija): ["Svjež i čist", "Moderna elegancija",
  //            "Ured, večer i prilike"]; svaka osobina dobije ikonu prema
  //            svojim riječima (svjež → list, elegancija → dijamant, ured →
  //            aktovka...; vidi RIJECI niže).
  //  Neobavezna polja (kao i dosad):
  //   oldPrice → artikl je na akciji: nova cijena, pokraj nje precrtana stara
  //              i ružičasta oznaka s postotkom popusta (−30 %), u boji kojom
  //              martimex.hr označava ponude i akcije
  //   promo    → promo kod koji vrijedi za artikl:
  //              { code: "MRTMX", percent: 30, validUntil: "2026-10-31" }
  //              (isto kao ravna polja promoCode, promoPercent, promoPrice,
  //              promoValidUntil). Umjesto percent može price (cijena s kodom);
  //              dovoljno je jedno. validUntil je neobavezan; kad je prošao, kod
  //              se ne prikazuje. Nova cijena je cijena s kodom, precrtana je
  //              trenutna, a ispod piše "uz kod MRTMX".
  //              Kad su i akcija i kod: precrtana je redovna cijena, nova je
  //              cijena s kodom, a oznaka pokazuje ukupni popust
  //   description, hideDescription → kartica više nema opis, pa se ne koriste
  //   brandLogo → više se ne koristi: marka je uvijek ispisana slovima
  //
  //  Raspored kartice:
  //   ┌──────────────────────────────┐
  //   │ ┌──────────────────────────┐ │   svijetlosiva ploča (#f6f6f6), u sredini artikl
  //   │ │          SLIKA           │ │   (bijela pozadina fotografije postane
  //   │ └──────────────────────────┘ │   prozirna, pa se vidi ploča)
  //   │   Prada                      │   marka: Nunito, debela slova
  //   │   Luna Rossa Carbon          │   naziv: Playfair Display
  //   │   Parfemska voda · 50 ml     │   vrsta i veličina: sivo
  //   │   103,00 €                   │   cijena: Playfair Display
  //   │   ikona  │  ikona  │  ikona  │   tri osobine, između njih tanke crte
  //   │   Svjež  │  Ljeto  │ Nježno  │   parfemi: podatak tamno i polumasno,
  //   │ i morski │ i ured  │ uz kožu │   ispod sitna siva oznaka (oznake u
  //   │   Miris  │  Kada   │Trajnost │   istoj liniji); ostale kartice: samo
  //   │          │ nositi  │         │   tekst osobine, kao dosad
  //   │ (     Pogledaj proizvod    ) │   crni gumb zaobljen kao kartica, jedini link
  //   └──────────────────────────────┘
  //  Na proizvod vodi samo gumb, i to u istom prozoru (bez novih kartica).
  //
  //  Mjere (CSS px, kartica široka 336): ploča je od ruba kartice odmaknuta
  //  6 px, široka 324 i visoka 198 (u šire i uže kartice mijenja se u istom
  //  omjeru; do v38 bila je visoka 232, v39 je oko 15 % niža);
  //  tekst i gumb su 24 px od ruba; gumb je visok 44 px, a ispod njega je
  //  20 px do dna kartice. Svaka fotografija se "izreže" i postavi u kadar
  //  jednako: artikl je visok 78 % ploče i stoji u sredini, bez obzira na
  //  to koliko bijelog prostora ima originalna fotografija.
  //
  //  Fontovi (Nunito i Playfair Display, besplatna licenca SIL OFL 1.1) su u
  //  mapi fonts/, pa kartica izgleda jednako na iPhoneu, Androidu i
  //  Windowsima. Modul učitava i Jost, font ostalih modula chata.
  //
  //  Sitni detalji:
  //   - osobina od dvije ili više riječi uvijek je u dva retka podjednake
  //     duljine ("Svjež / i čist"); jednoslovna riječ (i, u, s...) ne ostaje
  //     na kraju retka
  //   - kartica parfema s tri podatka: stupci su široki koliko treba tekst,
  //     prvi počinje uz lijevi rub teksta kartice, a zadnji završava uz
  //     desni, pa dulji podatak dobije više mjesta (v38); ostale kartice
  //     imaju jednake stupce
  //   - bijela pozadina fotografije pretvara se u sivu boju ploče (canvas);
  //     kad to nije moguće (slika s druge domene), stapa se CSS-om. Tamna ili
  //     šarena fotografija ispuni cijelu ploču
  //   - kad Marti pošalje preporuke, kartice blago izrone jedna za drugom.
  //     Samo prvi put; kad se povijest razgovora ponovno učita, odmah su tu.
  //     Isključeno ako je na uređaju uključeno "Smanji pokrete"
  //   - vrtuljak: ispod kartica su točkice i strelice, i na mobitelu (v40).
  //     Nakon pojave se kartice jednom kratko pomaknu ulijevo i vrate
  //     (namig), pa kupac vidi da desno ima još kartica; nema ga ako je
  //     kupac već listao ili je uključeno "Smanji pokrete" (vidi NAMIG)
  // ═════════════════════════════════════════════════════════════════════


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_POSTAVKE = {
    boje: {                   // uvijek u obliku #rrggbb
      tinta:   '#171717', // marka, naziv, cijena, ikone osobina, gumb
      tekst:   '#3d3d3d', // natpisi osobina
      siva:    '#86868b', // vrsta i veličina (Parfemska voda · 50 ml), stara cijena, "uz kod"
      ploca:   '#f6f6f6', // svijetlosiva ploča sa slikom artikla (kao na slici prijedloga)
      kartica: '#ffffff', // pozadina kartice
      crta:    '#ececec', // tanke okomite crte između osobina
      ruza:    '#f7ded2', // ružičasta martimex.hr (zaglavlje, "Ponude i akcije"): oznaka popusta
      tocka:   '#d6cfca'  // točkice vrtuljka koje nisu odabrane
    },

    // Fontovi iz mape fonts/ ovog repozitorija; ako se iz nekog razloga ne
    // učitaju, vrijedi redom sljedeći font u nizu.
    font: '"MX Nunito", "Nunito", "Avenir Next", Avenir, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontNaziva: '"MX Playfair", "Playfair Display", Georgia, "Times New Roman", serif',

    tekstGumba: 'Pogledaj proizvod',

    oznakaRegije: 'Preporučeni proizvodi',   // za čitače zaslona

    tekstUzKod: 'uz kod',     // ispod cijene s kodom: "uz kod MRTMX"

    najviseOsobina: 3,        // koliko osobina stane u red ispod cijene
    znakovaOsobine: 32,       // dulja osobina se skrati (na cijeloj riječi)
    // Kartica parfema (osobine s emojijem): sitna siva oznaka ispod svakog
    // podatka, redom po mjestu
    oznakePodataka: ['Miris', 'Kada nositi', 'Trajnost'],

    // Vrsta mirisa s kraja naziva, na hrvatskom (ključ je kako piše u nazivu,
    // malim slovima; kratice EDP, EDT i EDC vrijede kao puni naziv)
    vrste: {
      'eau de parfum': 'Parfemska voda',
      'eau de parfum intense': 'Parfemska voda Intense',
      'eau de toilette': 'Toaletna voda',
      'eau de toilette intense': 'Toaletna voda Intense',
      'eau de cologne': 'Kolonjska voda',
      'extrait de parfum': 'Parfemski ekstrakt',
      'parfum': 'Parfem'
    }
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX = (function () {
    'use strict';

    const P = MX_POSTAVKE;
    const B = P.boje;
    // adresa mape u kojoj je ova skripta (GitHub Pages) — odatle se učitavaju fontovi
    const BAZA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/v2-1/kartica-artikla.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
    const EUR = (function () {
      try { return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }); }
      catch (e) { return { format: function (n) { return n.toFixed(2).replace('.', ',') + ' €'; } }; }
    })();

    // Ploča sa slikom: osnovna veličina (CSS px) u kartici širokoj 336 px. U
    // široj ili užoj kartici mijenja se u istom omjeru. Artikl je u ploči uvijek
    // jednako postavljen (KADAR), pa niža ploča znači i malo manji artikl.
    const PLOCA = [324, 198];
    // Koliko ploče artikl smije zauzeti (visina, širina) kad je fotografija
    // obrađena; na slici prijedloga bočica je visoka 78 % ploče
    const KADAR = { visina: 0.777, sirina: 0.84 };
    // Fotografija s druge domene (ne može se obraditi): koliko je visoka
    // cijela fotografija u ploči (artikl na njoj obično ima malo bijelog oko sebe)
    const VISINA_FOTOGRAFIJE = 0.9;

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    // ── IKONE OSOBINA ────────────────────────────────────────────────────
    // Crtež 24 × 24, tanka crta (1,33 px) zaobljenih krajeva. List, dijamant i
    // aktovka nacrtani su točno kao na slici prijedloga, ostale u istom stilu.
    const IKONE = {
      list: '<path d="M5 19.2C5 11.16 9.94 5.4 19.1 5.4C19.1 13.44 14.17 19.2 5 19.2Z"/><path d="M5 19.2L12.9 11"/>',
      dijamant: '<path d="M7 4H19L22 9L13 20L4 9Z"/><path d="M4 9H22"/><path d="M10 4L8.5 9L13 20L17.5 9L16 4"/>',
      aktovka: '<rect x="4" y="7" width="18" height="13" rx="2"/><path d="M10 7V5A1 1 0 0 1 11 4H15A1 1 0 0 1 16 5V7"/><path d="M4 13H22"/>',
      mjesec: '<path d="M19.6 14.4A8 8 0 1 1 9.6 4.4A6.3 6.3 0 0 0 19.6 14.4Z"/>',
      sunce: '<circle cx="12" cy="12" r="3.6"/><path d="M12 3.5V5.5M12 18.5V20.5M3.5 12H5.5M18.5 12H20.5M6 6L7.4 7.4M16.6 16.6L18 18M6 18L7.4 16.6M16.6 7.4L18 6"/>',
      pahulja: '<path d="M12 3.5V20.5M4.64 7.75L19.36 16.25M4.64 16.25L19.36 7.75M10.59 7.01L12 5.6L13.41 7.01M6.98 10.73L6.46 8.8L8.39 8.28M8.39 15.72L6.46 15.2L6.98 13.27M13.41 16.99L12 18.4L10.59 16.99M17.02 13.27L17.54 15.2L15.61 15.72M15.61 8.28L17.54 8.8L17.02 10.73"/>',
      kalendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10H20M8.5 3.5V7.5M15.5 3.5V7.5"/>',
      sat: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12L15 14"/>',
      iskrice: '<path d="M10.5 4.5L11.9 8.6L16 10L11.9 11.4L10.5 15.5L9.1 11.4L5 10L9.1 8.6Z"/><path d="M17 14.5L17.65 16.35L19.5 17L17.65 17.65L17 19.5L16.35 17.65L14.5 17L16.35 16.35Z"/>',
      srce: '<path d="M12 19.5C12 19.5 4.5 15.1 4.5 9.7A4 4 0 0 1 12 7.6A4 4 0 0 1 19.5 9.7C19.5 15.1 12 19.5 12 19.5Z"/>',
      plamen: '<path d="M12 20.5C8.7 20.5 6.2 18.1 6.2 15C6.2 11.6 8.9 10 10 6.6C10.4 5.4 10.5 4.4 10.4 3.5C13 5 14.5 7.5 14.6 10.1C15.3 9.5 15.8 8.6 16 7.6C17.2 9.2 17.8 11.4 17.8 15C17.8 18.1 15.3 20.5 12 20.5Z"/>',
      cvijet: '<path d="M8.5 7.48A3.5 3.5 0 1 1 15.5 7.48A3.5 3.5 0 1 1 17.66 14.14A3.5 3.5 0 1 1 12 18.25A3.5 3.5 0 1 1 6.34 14.14A3.5 3.5 0 1 1 8.5 7.48Z"/><circle cx="12" cy="12.3" r="1.8"/>',
      drvo: '<path d="M12 3.5L6.5 11H9.5L5.5 16.5H18.5L14.5 11H17.5Z"/><path d="M12 16.5V20.5"/>',
      citrus: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="6"/><path d="M12 6.8V17.2M7.5 9.4L16.5 14.6M7.5 14.6L16.5 9.4"/>',
      kapljica: '<path d="M12 3.8C8.6 8.2 6 11.4 6 14.3A6 6 0 0 0 18 14.3C18 11.4 15.4 8.2 12 3.8Z"/>',
      stit: '<path d="M12 3.8L19 6.5V11.8C19 16.2 16 19.5 12 20.7C8 19.5 5 16.2 5 11.8V6.5Z"/>',
      slatko: '<ellipse cx="12" cy="12" rx="4.4" ry="3.7"/><path d="M7.6 12L3.8 8.9V15.1Z"/><path d="M16.4 12L20.2 8.9V15.1Z"/>',
      poklon: '<rect x="4" y="8.5" width="16" height="4" rx="1"/><path d="M5.5 12.5V19A1 1 0 0 0 6.5 20H17.5A1 1 0 0 0 18.5 19V12.5M12 8.5V20M12 8.5C10.6 5.6 7.4 4.6 6.7 6.2C6.1 7.6 8.3 8.5 12 8.5ZM12 8.5C13.4 5.6 16.6 4.6 17.3 6.2C17.9 7.6 15.7 8.5 12 8.5Z"/>',
      oblak: '<path d="M7.2 18.5H16.8A3.7 3.7 0 0 0 17.4 11.15A5.4 5.4 0 0 0 7.05 9.9A4.3 4.3 0 0 0 7.2 18.5Z"/>',
      osoba: '<circle cx="12" cy="8.2" r="3.7"/><path d="M5 19.5C5.9 15.8 8.6 13.7 12 13.7C15.4 13.7 18.1 15.8 19 19.5"/>',
      munja: '<path d="M13.2 3.8L6 13.4H11.6L10.8 20.2L18 10.6H12.4Z"/>'
    };

    // Ikona osobine prema riječima: riječ osobine koja počinje nekim od ovih
    // početaka (bez kvačica, malim slovima) daje ikonu svoje skupine.
    // Početak s $ na kraju mora biti cijela riječ.
    const RIJECI = [
      ['aktovka', ['ured$', 'ureda$', 'uredu$', 'uredom$', 'uredi$', 'uredsk', 'posao', 'posla$', 'poslu$', 'poslovn', 'radn', 'sastan', 'karijer', 'profesionaln']],
      ['stit', ['zastit', 'spf', 'uv$', 'otporn', 'osjetljiv', 'umiruj', 'barijer']],
      ['kalendar', ['svaki dan', 'svakodnev', 'svakidas', 'rutin', 'cijele godine', 'cijelu godinu']],
      ['mjesec', ['vecer', 'noc', 'izlaz', 'zabav', 'party', 'spavan']],
      ['sunce', ['ljet', 'sunc', 'dnevn', 'jutr', 'dan', 'proljet', 'vedr']],
      ['pahulja', ['zim', 'hladn', 'snijeg', 'snjez']],
      ['sat', ['dugotraj', 'postojan', 'traj', 'cijeli dan', 'anti-age', 'antiage', 'anti age', 'bore$', 'bora', 'mladolik', 'starenj']],
      ['poklon', ['poklon', 'dar$', 'darov']],
      ['slatko', ['slad', 'slatk', 'vanil', 'karamel', 'gurman', 'cokolad', 'med$', 'meden', 'tonk', 'prali', 'desert', 'kolac']],
      ['citrus', ['citrus', 'limun', 'naranc', 'bergamot', 'grejp', 'mandarin', 'limet', 'agrum']],
      ['cvijet', ['cvjet', 'cvijet', 'ruza', 'ruze', 'ruzi$', 'ruzin', 'ruzic', 'jasmin', 'bozur', 'tuberoz', 'ljiljan', 'iris', 'magnolij', 'narcis', 'lavand']],
      ['drvo', ['drv', 'cedar', 'cedr', 'sandal', 'vetiver', 'oud', 'mahovin', 'pacul', 'zemlj', 'suma', 'sumsk']],
      ['plamen', ['topl', 'topa', 'zacin', 'intenziv', 'vatren', 'orijent', 'ambr', 'jantar', 'tamjan', 'kozn', 'strast']],
      ['kapljica', ['hidrat', 'vlaz', 'vod', 'mors', 'more$', 'mediteran', 'slan$', 'slani', 'slana', 'akvat', 'ocean', 'serum', 'ulj', 'cisc', 'hranj', 'osvjez']],
      ['list', ['svjez', 'cist', 'prirod', 'zelen', 'biljn', 'organ', 'vegan', 'eko', 'ment', 'list']],
      ['srce', ['romant', 'zavodlj', 'senzual', 'ljubav', 'spoj', 'zenstven', 'sarm']],
      ['iskrice', ['sjaj', 'blist', 'glow', 'posebn', 'prilik', 'svecan', 'slavlj', 'iluminir', 'mladenack', 'razigran', 'zaigran', 'vesel', 'volumen']],
      ['munja', ['sport', 'dinamic', 'energ', 'aktiv', 'snag', 'snaz']],
      ['oblak', ['lagan', 'prozrac', 'mekan', 'puder', 'pudrast', 'nezn', 'opust', 'relaks', 'smiren', 'barsun', 'svilen']],
      ['dijamant', ['elegan', 'moder', 'stil', 'luksuz', 'rasko', 'sofistic', 'profinj', 'otmjen', 'klasic', 'bezvremen', 'ikonsk', 'chic', 'samouvjer', 'muzevn', 'glamur', 'prestiz']],
      ['osoba', ['za nju', 'za njega', 'unisex', 'muskarc', 'muski', 'zensk', 'koza$', 'koze$', 'kozu$', 'svaki tip', 'sve tipove']]
    ];
    // ikona kad nijedna riječ ne odgovara: prema mjestu osobine (karakter,
    // stil, prilika)
    const IKONE_PO_MJESTU = ['kapljica', 'dijamant', 'kalendar'];

    const PRAVILA = RIJECI.map(function (s) {
      return {
        ikona: s[0],
        re: new RegExp('(?:^|[^a-z0-9])(?:' + s[1].map(function (r) {
          return /\$$/.test(r) ? r.slice(0, -1) + '(?![a-z0-9])' : r;
        }).join('|') + ')')
      };
    });

    function bezKvacica(s) {
      s = String(s || '').toLowerCase().replace(/đ/g, 'd');
      if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
      return s;
    }

    // Ikona prve prepoznate riječi u osobini ("Cvjetni i sladak" → cvijet);
    // kad dvije skupine prepoznaju istu riječ, vrijedi ona koja je prva u RIJECI
    function ikonaOsobine(tekst, ikona, i) {
      const zadana = bezKvacica(ikona).trim();
      if (IKONE[zadana]) return zadana;
      const t = bezKvacica(tekst);
      let najbolja = '', gdje = Infinity;
      for (let j = 0; j < PRAVILA.length; j++) {
        const m = PRAVILA[j].re.exec(t);
        if (m && m.index < gdje) { gdje = m.index; najbolja = PRAVILA[j].ikona; }
      }
      return najbolja || IKONE_PO_MJESTU[i] || IKONE_PO_MJESTU[0];
    }

    function svg(sadrzaj, klasa) {
      return '<svg class="' + klasa + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + sadrzaj + '</svg>';
    }

    // ── IKONE PALETE – početak ────────────────────────────────────────
    // Ovaj dio piše alat alati/ikone-osobina.mjs (tamo je i paleta); ne mijenjaj ga ručno.
    // Ikone za tri podatka na kartici parfema: Marti napiše emoji, kartica nacrta
    // njegovu ikonu (crtež 24 × 24, samo crta, kao IKONE gore).
    // Ikone: Tabler Icons 3.52.0 (https://tabler.io/icons), MIT licenca:
    //   Copyright (c) 2020-2026 Paweł Kuna
    //   Permission is hereby granted, free of charge, to any person obtaining a copy
    //   of this software and associated documentation files (the "Software"), to deal
    //   in the Software without restriction, including without limitation the rights
    //   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    //   copies of the Software, and to permit persons to whom the Software is
    //   furnished to do so, subject to the following conditions:
    //   The above copyright notice and this permission notice shall be included in all
    //   copies or substantial portions of the Software.
    //   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    //   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    //   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    //   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    //   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    //   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    //   SOFTWARE.
    const IKONE_PALETE = {
      ripple: '<path d="M3 7c3 -2 6 -2 9 0s6 2 9 0"/><path d="M3 17c3 -2 6 -2 9 0s6 2 9 0"/><path d="M3 12c3 -2 6 -2 9 0s6 2 9 0"/>',
      droplet: '<path d="M7.502 19.423c2.602 2.105 6.395 2.105 8.996 0c2.602 -2.105 3.262 -5.708 1.566 -8.546l-4.89 -7.26c-.42 -.625 -1.287 -.803 -1.936 -.397a1.376 1.376 0 0 0 -.41 .397l-4.893 7.26c-1.695 2.838 -1.035 6.441 1.567 8.546"/>',
      droplets: '<path d="M4.072 20.3a2.999 2.999 0 0 0 3.856 0a3.002 3.002 0 0 0 .67 -3.798l-2.095 -3.227a.6 .6 0 0 0 -1.005 0l-2.098 3.227a3.003 3.003 0 0 0 .671 3.798"/><path d="M16.072 20.3a2.999 2.999 0 0 0 3.856 0a3.002 3.002 0 0 0 .67 -3.798l-2.095 -3.227a.6 .6 0 0 0 -1.005 0l-2.098 3.227a3.003 3.003 0 0 0 .671 3.798"/><path d="M10.072 10.3a2.999 2.999 0 0 0 3.856 0a3.002 3.002 0 0 0 .67 -3.798l-2.095 -3.227a.6 .6 0 0 0 -1.005 0l-2.098 3.227a3.003 3.003 0 0 0 .671 3.798l.001 0"/>',
      circles: '<path d="M8 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M2.5 17a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M13.5 17a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/>',
      sailboat: '<path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1"/><path d="M4 18l-1 -3h18l-1 3"/><path d="M11 12h7l-7 -9v9"/><path d="M8 7l-2 5"/>',
      anchor: '<path d="M12 9v12m-8 -8a8 8 0 0 0 16 0m1 0h-2m-14 0h-2"/><path d="M9 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>',
      mountain: '<path d="M3 20h18l-6.921 -14.612a2.3 2.3 0 0 0 -4.158 0l-6.921 14.612"/><path d="M7.5 11l2 2.5l2.5 -2.5l2 3l2.5 -2"/>',
      lemon: '<path d="M17.536 3.393c3.905 3.906 3.905 10.237 0 14.143c-3.906 3.905 -10.237 3.905 -14.143 0l14.143 -14.143"/><path d="M5.868 15.06a6.5 6.5 0 0 0 9.193 -9.192"/><path d="M10.464 10.464l4.597 4.597"/><path d="M10.464 10.464v6.364"/><path d="M10.464 10.464h6.364"/>',
      'lemon-2': '<path d="M18 4a2 2 0 0 1 1.185 3.611c1.55 2.94 .873 6.917 -1.892 9.682c-2.765 2.765 -6.743 3.442 -9.682 1.892a2 2 0 1 1 -2.796 -2.796c-1.55 -2.94 -.873 -6.917 1.892 -9.682c2.765 -2.765 6.743 -3.442 9.682 -1.892a2 2 0 0 1 1.611 -.815"/>',
      leaf: '<path d="M5 21c.5 -4.5 2.5 -8 7 -10"/><path d="M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3l.014 0"/>',
      'plant-2': '<path d="M2 9a10 10 0 1 0 20 0"/><path d="M12 19a10 10 0 0 1 10 -10"/><path d="M2 9a10 10 0 0 1 10 10"/><path d="M12 4a9.7 9.7 0 0 1 2.99 7.5"/><path d="M9.01 11.5a9.7 9.7 0 0 1 2.99 -7.5"/>',
      seedling: '<path d="M12 10a6 6 0 0 0 -6 -6h-3v2a6 6 0 0 0 6 6h3"/><path d="M12 14a6 6 0 0 1 6 -6h3v1a6 6 0 0 1 -6 6h-3"/><path d="M12 20l0 -10"/>',
      wheat: '<path d="M12.014 21.514v-3.75"/><path d="M5.93 9.504l-.43 1.604c-.712 2.659 .866 5.391 3.524 6.105c.997 .268 1.993 .535 2.99 .801v-3.44c-.164 -2.105 -1.637 -3.879 -3.676 -4.426l-2.408 -.644"/><path d="M13.744 11.164c.454 -.454 .815 -.994 1.061 -1.587c.246 -.594 .372 -1.23 .372 -1.873c0 -.643 -.126 -1.279 -.372 -1.872c-.246 -.594 -.606 -1.133 -1.061 -1.588l-1.73 -1.73l-1.73 1.73c-.454 .454 -.815 .994 -1.06 1.588c-.246 .594 -.372 1.23 -.373 1.872c0 .643 .127 1.279 .373 1.873c.246 .594 .606 1.133 1.06 1.587"/><path d="M18.099 9.504l.43 1.604c.712 2.659 -.866 5.391 -3.525 6.105c-.997 .268 -1.994 .535 -2.99 .801v-3.44c.164 -2.105 1.637 -3.879 3.677 -4.426l2.408 -.644"/>',
      teapot: '<path d="M10.29 3h3.42a2 2 0 0 1 1.988 1.78l1.555 14a2 2 0 0 1 -1.988 2.22h-6.53a2 2 0 0 1 -1.988 -2.22l1.555 -14a2 2 0 0 1 1.988 -1.78"/><path d="M7.47 12.5l-4.257 -5.019a.899 .899 0 0 1 .69 -1.481h13.09a3 3 0 0 1 3.007 3v3c0 1.657 -1.346 3 -3.007 3"/><path d="M7 17h10"/>',
      flower: '<path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M12 2a3 3 0 0 1 3 3c0 .562 -.259 1.442 -.776 2.64l-.724 1.36l1.76 -1.893c.499 -.6 .922 -1 1.27 -1.205a2.968 2.968 0 0 1 4.07 1.099a3.011 3.011 0 0 1 -1.09 4.098c-.374 .217 -.99 .396 -1.846 .535l-2.664 .366l2.4 .326c1 .145 1.698 .337 2.11 .576a3.011 3.011 0 0 1 1.09 4.098a2.968 2.968 0 0 1 -4.07 1.098c-.348 -.202 -.771 -.604 -1.27 -1.205l-1.76 -1.893l.724 1.36c.516 1.199 .776 2.079 .776 2.64a3 3 0 0 1 -6 0c0 -.562 .259 -1.442 .776 -2.64l.724 -1.36l-1.76 1.893c-.499 .601 -.922 1 -1.27 1.205a2.968 2.968 0 0 1 -4.07 -1.098a3.011 3.011 0 0 1 1.09 -4.098c.374 -.218 .99 -.396 1.846 -.536l2.664 -.366l-2.4 -.325c-1 -.145 -1.698 -.337 -2.11 -.576a3.011 3.011 0 0 1 -1.09 -4.099a2.968 2.968 0 0 1 4.07 -1.099c.348 .203 .771 .604 1.27 1.205l1.76 1.894c-1 -2.292 -1.5 -3.625 -1.5 -4a3 3 0 0 1 3 -3"/>',
      butterfly: '<path d="M12 18.176a3 3 0 1 1 -4.953 -2.449l-.025 .023a4.502 4.502 0 0 1 1.483 -8.75c1.414 0 2.675 .652 3.5 1.671a4.5 4.5 0 1 1 4.983 7.079a3 3 0 1 1 -4.983 2.25l-.005 .176"/><path d="M12 19v-10"/><path d="M9 3l3 2l3 -2"/>',
      cherry: '<path d="M4 16.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0"/><path d="M14 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M9 13c.366 -2 1.866 -3.873 4.5 -5.6"/><path d="M17 15c-1.333 -2.333 -2.333 -5.333 -1 -9"/><path d="M5 6c3.667 -2.667 7.333 -2.667 11 0c-3.667 2.667 -7.333 2.667 -11 0"/>',
      apple: '<path d="M4 11.319c0 3.102 .444 5.319 2.222 7.978c1.351 1.797 3.156 2.247 5.08 .988c.426 -.268 .97 -.268 1.397 0c1.923 1.26 3.728 .809 5.079 -.988c1.778 -2.66 2.222 -4.876 2.222 -7.977c0 -2.661 -1.99 -5.32 -4.444 -5.32c-1.267 0 -2.41 .693 -3.22 1.44a.5 .5 0 0 1 -.672 0c-.809 -.746 -1.953 -1.44 -3.22 -1.44c-2.454 0 -4.444 2.66 -4.444 5.319"/><path d="M7 12c0 -1.47 .454 -2.34 1.5 -3"/><path d="M12 7c0 -1.2 .867 -4 3 -4"/>',
      grape: '<path d="M13 3a14.5 14.5 0 0 0 -1 6"/><path d="M12 8.9s-2.77 .52 -4.1 -.8s-.8 -4 -.8 -4s2.57 -.53 3.88 .8s1.02 4 1.02 4"/><path d="M14 19a2 2 0 1 0 -4 0a2 2 0 0 0 4 0"/><path d="M14 17a2 2 0 1 1 0 -4a2 2 0 0 1 0 4"/><path d="M10 17a2 2 0 1 1 0 -4a2 2 0 0 1 0 4"/><path d="M12 13a2 2 0 1 1 0 -4a2 2 0 0 1 0 4"/><path d="M16 13a2 2 0 1 1 0 -4a2 2 0 0 1 0 4"/><path d="M8 13a2 2 0 1 1 0 -4a2 2 0 0 1 0 4"/>',
      candy: '<path d="M7.05 11.293l4.243 -4.243a2 2 0 0 1 2.828 0l2.829 2.83a2 2 0 0 1 0 2.828l-4.243 4.243a2 2 0 0 1 -2.828 0l-2.829 -2.831a2 2 0 0 1 0 -2.828"/><path d="M16.243 9.172l3.086 -.772a1.5 1.5 0 0 0 .697 -2.516l-2.216 -2.217a1.5 1.5 0 0 0 -2.44 .47l-1.248 2.913"/><path d="M9.172 16.243l-.772 3.086a1.5 1.5 0 0 1 -2.516 .697l-2.217 -2.216a1.5 1.5 0 0 1 .47 -2.44l2.913 -1.248"/>',
      lollipop: '<path d="M7 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 10a3.5 3.5 0 0 0 -7 0"/><path d="M14 10a3.5 3.5 0 0 1 -7 0"/><path d="M14 17a3.5 3.5 0 0 0 0 -7"/><path d="M14 3a3.5 3.5 0 0 0 0 7"/><path d="M3 21l6 -6"/>',
      'ice-cream-2': '<path d="M17.657 11a6 6 0 1 0 -11.315 0"/><path d="M6.342 11l5.658 11l5.657 -11l-11.315 0"/>',
      cookie: '<path d="M8 13v.01"/><path d="M12 17v.01"/><path d="M12 12v.01"/><path d="M16 14v.01"/><path d="M11 8v.01"/><path d="M13.148 3.476l2.667 1.104a4 4 0 0 0 4.656 6.14l.053 .132a3 3 0 0 1 0 2.296q -.745 1.18 -1.024 1.852q -.283 .684 -.66 2.216a3 3 0 0 1 -1.624 1.623q -1.572 .394 -2.216 .661q -.712 .295 -1.852 1.024a3 3 0 0 1 -2.296 0q -1.203 -.754 -1.852 -1.024q -.707 -.292 -2.216 -.66a3 3 0 0 1 -1.623 -1.624q -.397 -1.577 -.661 -2.216q -.298 -.718 -1.024 -1.852a3 3 0 0 1 0 -2.296q .719 -1.116 1.024 -1.852q .257 -.62 .66 -2.216a3 3 0 0 1 1.624 -1.623q 1.547 -.384 2.216 -.661q .687 -.285 1.852 -1.024a3 3 0 0 1 2.296 0"/>',
      cake: '<path d="M3 20h18v-8a3 3 0 0 0 -3 -3h-12a3 3 0 0 0 -3 3v8"/><path d="M3 14.803c.312 .135 .654 .204 1 .197a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1c.35 .007 .692 -.062 1 -.197"/><path d="M12 4l1.465 1.638a2 2 0 1 1 -3.015 .099l1.55 -1.737"/>',
      chocolate: '<path d="M12 21v-16"/><path d="M6 15h12"/><path d="M6 9h10.5"/><path d="M10.05 3a2.5 2.5 0 0 0 3.987 1.47a3 3 0 0 0 2.047 2.387a2.504 2.504 0 0 0 1.916 3.093v9.05a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h2.05"/>',
      coffee: '<path d="M3 14c.83 .642 2.077 1.017 3.5 1c1.423 .017 2.67 -.358 3.5 -1c.83 -.642 2.077 -1.017 3.5 -1c1.423 -.017 2.67 .358 3.5 1"/><path d="M8 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2"/><path d="M12 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2"/><path d="M3 10h14v5a6 6 0 0 1 -6 6h-2a6 6 0 0 1 -6 -6v-5"/><path d="M16.746 16.726a3 3 0 1 0 .252 -5.555"/>',
      milk: '<path d="M8 6h8v-2a1 1 0 0 0 -1 -1h-6a1 1 0 0 0 -1 1v2"/><path d="M16 6l1.094 1.759a6 6 0 0 1 .906 3.17v8.071a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-8.071a6 6 0 0 1 .906 -3.17l1.094 -1.759"/><path d="M10 16a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M10 10h4"/>',
      acorn: '<path d="M18 10l-.45 4.1a8.36 8.36 0 0 1 -5.18 6.83a1 1 0 0 1 -.74 0a8.36 8.36 0 0 1 -5.18 -6.83l-.45 -4.1"/><path d="M13 3a4.9 4.9 0 0 0 -1 3"/><path d="M8 6h8a3 3 0 0 1 3 3a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1a3 3 0 0 1 3 -3"/>',
      flame: '<path d="M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.294 -2.333 5.588c0 3.704 3.134 6.706 7 6.706c3.866 0 7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235"/>',
      candle: '<path d="M9 21h6v-10a1 1 0 0 0 -1 -1h-4a1 1 0 0 0 -1 1l0 10"/><path d="M12 2l1.465 1.638a2 2 0 1 1 -3.015 .099l1.55 -1.737"/>',
      pepper: '<path d="M13 11c0 2.21 -2.239 4 -5 4s-5 -1.79 -5 -4a8 8 0 1 0 16 0a3 3 0 0 0 -6 0"/><path d="M16 8c0 -2 2 -4 4 -4"/>',
      salt: '<path d="M12 13v.01"/><path d="M10 16v.01"/><path d="M14 16v.01"/><path d="M7.5 8h9l-.281 -2.248a2 2 0 0 0 -1.985 -1.752h-4.468a2 2 0 0 0 -1.986 1.752l-.28 2.248"/><path d="M7.5 8l-1.612 9.671a2 2 0 0 0 1.973 2.329h8.278a2 2 0 0 0 1.973 -2.329l-1.612 -9.671"/>',
      twig: '<path d="M3 21l5 -4l3 -5l5 -2l5 -7"/><path d="M16 10h5"/><path d="M11 12v-8"/><path d="M8 17h7"/>',
      tree: '<path d="M12 13l-2 -2"/><path d="M12 12l2 -2"/><path d="M12 21v-13"/><path d="M9.824 16a3 3 0 0 1 -2.743 -3.69a3 3 0 0 1 .304 -4.833a3 3 0 0 1 4.615 -3.707a3 3 0 0 1 4.614 3.707a3 3 0 0 1 .305 4.833a3 3 0 0 1 -2.919 3.695h-4l-.176 -.005"/>',
      'christmas-tree': '<path d="M12 3l4 4l-2 1l4 4l-3 1l4 4h-14l4 -4l-3 -1l4 -4l-2 -1l4 -4"/><path d="M14 17v3a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-3"/>',
      mushroom: '<path d="M20 11.1c0 -4.474 -3.582 -8.1 -8 -8.1s-8 3.626 -8 8.1a.9 .9 0 0 0 .9 .9h14.2a.9 .9 0 0 0 .9 -.9"/><path d="M10 12v7a2 2 0 1 0 4 0v-7"/>',
      deer: '<path d="M3 3c0 2 1 3 4 3c2 0 3 1 3 3"/><path d="M21 3c0 2 -1 3 -4 3c-2 0 -3 .333 -3 3"/><path d="M12 18c-1 0 -4 -3 -4 -6c0 -2 1.333 -3 4 -3s4 1 4 3c0 3 -3 6 -4 6"/><path d="M15.185 14.889l.095 -.18a4 4 0 1 1 -6.56 0"/><path d="M17 3c0 1.333 -.333 2.333 -1 3"/><path d="M7 3c0 1.333 .333 2.333 1 3"/><path d="M7 6c-2.667 .667 -4.333 1.667 -5 3"/><path d="M17 6c2.667 .667 4.333 1.667 5 3"/><path d="M8.5 10l-1.5 -1"/><path d="M15.5 10l1.5 -1"/><path d="M12 15h.01"/>',
      jacket: '<path d="M16 3l-4 5l-4 -5"/><path d="M12 19a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-8.172a2 2 0 0 1 .586 -1.414l.828 -.828a2 2 0 0 0 .586 -1.414v-2.172a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v2.172a2 2 0 0 0 .586 1.414l.828 .828a2 2 0 0 1 .586 1.414v8.172a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2"/><path d="M20 13h-3a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1h3"/><path d="M4 17h3a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-3"/><path d="M12 19v-11"/>',
      'glass-gin': '<path d="M8 21h8"/><path d="M12 15v6"/><path d="M5.5 5a6.5 2 0 1 0 13 0a6.5 2 0 1 0 -13 0"/><path d="M5.75 4.5c-.612 .75 -.75 2 -.75 3.5a7 7 0 0 0 14 0c0 -1.5 -.094 -2.75 -.75 -3.5"/>',
      cloud: '<path d="M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878"/>',
      feather: '<path d="M4 20l10 -10m0 -5v5h5m-9 -1v5h5m-9 -1v5h5m-5 -5l4 -4l4 -4"/><path d="M19 10c.638 -.636 1 -1.515 1 -2.486a3.515 3.515 0 0 0 -3.517 -3.514c-.97 0 -1.847 .367 -2.483 1m-3 13l4 -4l4 -4"/>',
      perfume: '<path d="M10 6v3"/><path d="M14 6v3"/><path d="M5 11a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l0 -8"/><path d="M10 15a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M9 3h6v3h-6l0 -3"/>',
      sun: '<path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/>',
      'sun-low': '<path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M4 12h.01"/><path d="M12 4v.01"/><path d="M20 12h.01"/><path d="M12 20v.01"/><path d="M6.31 6.31l-.01 -.01"/><path d="M17.71 6.31l-.01 -.01"/><path d="M17.7 17.7l.01 .01"/><path d="M6.3 17.7l.01 .01"/>',
      'temperature-sun': '<path d="M4 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 1 0 -4 0v8.5"/><path d="M4 9h4"/><path d="M13 16a4 4 0 1 0 0 -8a4.07 4.07 0 0 0 -1 .124"/><path d="M13 3v1"/><path d="M21 12h1"/><path d="M13 20v1"/><path d="M19.4 5.6l-.7 .7"/><path d="M18.7 17.7l.7 .7"/>',
      'leaf-maple': '<path d="M5 21c.5 -4.5 2.5 -8 7 -10"/><path d="M13 19c-2.733 0 -4.16 -3.11 -5 -5c-1.892 -.84 -4 -1.826 -4 -4.556c1.014 -.644 2.816 -.649 4 -.444c-.312 -2.071 -.37 -4.414 1 -6c2.364 .369 3 4 3 4c1.463 -1.368 4 -2 6 -2c0 2 -.63 4.538 -2 6q 3.687 .996 4 3c-1.586 1.36 -3.933 1.311 -6 1q .19 1.098 -1 4"/>',
      snowflake: '<path d="M10 4l2 1l2 -1"/><path d="M12 2v6.5l3 1.72"/><path d="M17.928 6.268l.134 2.232l1.866 1.232"/><path d="M20.66 7l-5.629 3.25l.01 3.458"/><path d="M19.928 14.268l-1.866 1.232l-.134 2.232"/><path d="M20.66 17l-5.629 -3.25l-2.99 1.738"/><path d="M14 20l-2 -1l-2 1"/><path d="M12 22v-6.5l-3 -1.72"/><path d="M6.072 17.732l-.134 -2.232l-1.866 -1.232"/><path d="M3.34 17l5.629 -3.25l-.01 -3.458"/><path d="M4.072 9.732l1.866 -1.232l.134 -2.232"/><path d="M3.34 7l5.629 3.25l2.99 -1.738"/>',
      snowman: '<path d="M12 3a4 4 0 0 1 2.906 6.75a6 6 0 1 1 -5.81 0a4 4 0 0 1 2.904 -6.75"/><path d="M17.5 11.5l2.5 -1.5"/><path d="M6.5 11.5l-2.5 -1.5"/><path d="M12 13h.01"/><path d="M12 16h.01"/>',
      sunrise: '<path d="M3 17h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 5.7a4 4 0 0 1 8 0"/><path d="M3 21l18 0"/><path d="M12 9v-6l3 3m-6 0l3 -3"/>',
      sunset: '<path d="M3 17h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 5.7a4 4 0 0 1 8 0"/><path d="M3 21l18 0"/><path d="M12 3v6l3 -3m-6 0l3 3"/>',
      moon: '<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008"/>',
      'moon-stars': '<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008"/><path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2"/><path d="M19 11h2m-1 -1v2"/>',
      'sun-moon': '<path d="M9.173 14.83a4 4 0 1 1 5.657 -5.657"/><path d="M11.294 12.707l.174 .247a7.5 7.5 0 0 0 8.845 2.492a9 9 0 0 1 -14.671 2.914"/><path d="M3 12h1"/><path d="M12 3v1"/><path d="M5.6 5.6l.7 .7"/><path d="M3 21l18 -18"/>',
      clock: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 7v5l3 3"/>',
      calendar: '<path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/>',
      briefcase: '<path d="M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -9"/><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2"/><path d="M12 12l0 .01"/><path d="M3 13a20 20 0 0 0 18 0"/>',
      'tools-kitchen-2': '<path d="M19 3v12h-5c-.023 -3.681 .184 -7.406 5 -12m0 12v6h-1v-3m-10 -14v17m-3 -17v3a3 3 0 1 0 6 0v-3"/>',
      'glass-full': '<path d="M8 21l8 0"/><path d="M12 15l0 6"/><path d="M17 3l1 7c0 3.012 -2.686 5 -6 5s-6 -1.988 -6 -5l1 -7h10"/><path d="M6 10a5 5 0 0 1 6 0a5 5 0 0 0 6 0"/>',
      'glass-cocktail': '<path d="M8 21h8"/><path d="M12 15v6"/><path d="M5 5a7 2 0 1 0 14 0a7 2 0 1 0 -14 0"/><path d="M5 5v.388c0 .432 .126 .853 .362 1.206l5 7.509c.633 .951 1.88 1.183 2.785 .517c.191 -.141 .358 -.316 .491 -.517l5 -7.509c.236 -.353 .362 -.774 .362 -1.206v-.388"/>',
      'glass-champagne': '<path d="M9 21h6"/><path d="M12 16v5"/><path d="M8 5a4 2 0 1 0 8 0a4 2 0 1 0 -8 0"/><path d="M8 5c0 6.075 1.79 11 4 11s4 -4.925 4 -11"/>',
      bottle: '<path d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2"/><path d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537"/><path d="M7 14.803a2.4 2.4 0 0 0 1 -.803a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 1 -.805"/>',
      confetti: '<path d="M4 5h2"/><path d="M5 4v2"/><path d="M11.5 4l-.5 2"/><path d="M18 5h2"/><path d="M19 4v2"/><path d="M15 9l-1 1"/><path d="M18 13l2 -.5"/><path d="M18 19h2"/><path d="M19 18v2"/><path d="M14 16.518l-6.518 -6.518l-4.39 9.58a1 1 0 0 0 1.329 1.329l9.579 -4.39"/>',
      balloon: '<path d="M14 8a2 2 0 0 0 -2 -2"/><path d="M6 8a6 6 0 1 1 12 0c0 4.97 -2.686 9 -6 9s-6 -4.03 -6 -9"/><path d="M12 17v1a2 2 0 0 1 -2 2h-3a2 2 0 0 0 -2 2"/>',
      music: '<path d="M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M13 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M9 17v-13h10v13"/><path d="M9 8h10"/>',
      'masks-theater': '<path d="M13.192 9h6.616a2 2 0 0 1 1.992 2.183l-.567 6.182a4 4 0 0 1 -3.983 3.635h-1.5a4 4 0 0 1 -3.983 -3.635l-.567 -6.182a2 2 0 0 1 1.992 -2.183"/><path d="M15 13h.01"/><path d="M18 13h.01"/><path d="M15 16.5c1 .667 2 .667 3 0"/><path d="M8.632 15.982a4.037 4.037 0 0 1 -.382 .018h-1.5a4 4 0 0 1 -3.983 -3.635l-.567 -6.182a2 2 0 0 1 1.992 -2.183h6.616a2 2 0 0 1 2 2"/><path d="M6 8h.01"/><path d="M9 8h.01"/><path d="M6 12c.764 -.51 1.528 -.63 2.291 -.36"/>',
      heart: '<path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"/>',
      'mail-heart': '<path d="M10.5 19h-5.5a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4"/><path d="M3 7l9 6l2.983 -1.989l6.017 -4.011"/><path d="M18 22l3.35 -3.284a2.143 2.143 0 0 0 .005 -3.071a2.242 2.242 0 0 0 -3.129 -.006l-.224 .22l-.223 -.22a2.242 2.242 0 0 0 -3.128 -.006a2.143 2.143 0 0 0 -.006 3.071l3.355 3.296"/>',
      rings: '<path d="M4 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M14 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M7 15v-11"/><path d="M17 15v-11"/><path d="M3 4h18"/>',
      gift: '<path d="M3 9a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1l0 -2"/><path d="M12 8l0 13"/><path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5"/>',
      plane: '<path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3l4 7"/>',
      beach: '<path d="M17.553 16.75a7.5 7.5 0 0 0 -10.606 0"/><path d="M18 3.804a6 6 0 0 0 -8.196 2.196l10.392 6a6 6 0 0 0 -2.196 -8.196"/><path d="M16.732 10c1.658 -2.87 2.225 -5.644 1.268 -6.196c-.957 -.552 -3.075 1.326 -4.732 4.196"/><path d="M15 9l-3 5.196"/><path d="M3 19.25a2.4 2.4 0 0 1 1 -.25a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 1 .25"/>',
      run: '<path d="M11.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M4 17l5 1l.75 -1.5"/><path d="M15 21v-4l-4 -3l1 -6"/><path d="M7 12v-3l5 -1l3 3l3 1"/>',
      yoga: '<path d="M4 20h4l1.5 -3"/><path d="M17 20l-1 -5h-5l1 -7"/><path d="M4 10l4 -1l4 -1l4 1.5l4 1.5"/><path d="M10.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>',
      home: '<path d="M5 12l-2 0l9 -9l9 9l-2 0"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"/><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"/>',
      'building-skyscraper': '<path d="M3 21l18 0"/><path d="M5 21v-14l8 -4v18"/><path d="M19 21v-10l-6 -4"/><path d="M9 9l0 .01"/><path d="M9 12l0 .01"/><path d="M9 15l0 .01"/><path d="M9 18l0 .01"/>',
      hourglass: '<path d="M6.5 7h11"/><path d="M6.5 17h11"/><path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1"/><path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1"/>',
      wind: '<path d="M5 8h8.5a2.5 2.5 0 1 0 -2.34 -3.24"/><path d="M3 12h15.5a2.5 2.5 0 1 1 -2.34 3.24"/><path d="M4 16h5.5a2.5 2.5 0 1 1 -2.34 3.24"/>',
      sparkles: '<path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6"/>',
      stars: '<path d="M17.8 19.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138"/><path d="M6.2 19.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138"/><path d="M12 9.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138"/>',
      star: '<path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245"/>',
      diamond: '<path d="M6 5h12l3 5l-8.5 9.5a.7 .7 0 0 1 -1 0l-8.5 -9.5l3 -5"/><path d="M10 12l-2 -2.2l.6 -1"/>',
      crown: '<path d="M12 6l4 6l5 -4l-2 10h-14l-2 -10l5 4l4 -6"/>',
      bolt: '<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"/>',
      sunglasses: '<path d="M8 4h-2l-3 10"/><path d="M16 4h2l3 10"/><path d="M10 16h4"/><path d="M21 16.5a3.5 3.5 0 0 1 -7 0v-2.5h7v2.5"/><path d="M10 16.5a3.5 3.5 0 0 1 -7 0v-2.5h7v2.5"/><path d="M4 14l4.5 4.5"/><path d="M15 14l4.5 4.5"/>',
      'crystal-ball': '<path d="M6.73 17.018a8 8 0 1 1 10.54 0"/><path d="M5 19a2 2 0 0 0 2 2h10a2 2 0 1 0 0 -4h-10a2 2 0 0 0 -2 2"/><path d="M11 7a3 3 0 0 0 -3 3"/>',
      palette: '<path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25"/><path d="M7.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M11.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M15.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/>',
    };
    // emoji (bez FE0F i nijansi kože) → ikona
    const PALETA = {
      '🌊': 'ripple', '💧': 'droplet', '💦': 'droplets', '🫧': 'circles',
      '⛵': 'sailboat', '⚓': 'anchor', '⛰': 'mountain', '🏔': 'mountain',
      '🍋': 'lemon', '🍊': 'lemon-2', '🍃': 'leaf', '🌿': 'plant-2',
      '🌱': 'seedling', '🌾': 'wheat', '🍵': 'teapot', '🫖': 'teapot',
      '🌸': 'flower', '🌹': 'flower', '🌺': 'flower', '🌼': 'flower',
      '🌷': 'flower', '💐': 'flower', '🪷': 'flower', '🪻': 'flower',
      '🏵': 'flower', '🦋': 'butterfly', '🍒': 'cherry', '🍓': 'cherry',
      '🍎': 'apple', '🍏': 'apple', '🍐': 'apple', '🍑': 'apple',
      '🍇': 'grape', '🫐': 'grape', '🍬': 'candy', '🍯': 'candy',
      '🍭': 'lollipop', '🍦': 'ice-cream-2', '🍨': 'ice-cream-2', '🍪': 'cookie',
      '🍰': 'cake', '🎂': 'cake', '🍫': 'chocolate', '☕': 'coffee',
      '🥛': 'milk', '🌰': 'acorn', '🥜': 'acorn', '🔥': 'flame',
      '🕯': 'candle', '🌶': 'pepper', '🧂': 'salt', '🪵': 'twig',
      '🌳': 'tree', '🌲': 'christmas-tree', '🎄': 'christmas-tree', '🍄': 'mushroom',
      '🦌': 'deer', '🧥': 'jacket', '🥃': 'glass-gin', '☁': 'cloud',
      '🪶': 'feather', '🧴': 'perfume', '☀': 'sun', '🌞': 'sun',
      '🌤': 'sun-low', '🌡': 'temperature-sun', '🍂': 'leaf-maple', '🍁': 'leaf-maple',
      '❄': 'snowflake', '☃': 'snowman', '⛄': 'snowman', '🌅': 'sunrise',
      '🌇': 'sunset', '🌙': 'moon', '🌃': 'moon-stars', '🌌': 'moon-stars',
      '🌗': 'sun-moon', '🕰': 'clock', '⏰': 'clock', '🕒': 'clock',
      '🗓': 'calendar', '📅': 'calendar', '📆': 'calendar', '💼': 'briefcase',
      '🍽': 'tools-kitchen-2', '🍷': 'glass-full', '🍸': 'glass-cocktail', '🍹': 'glass-cocktail',
      '🥂': 'glass-champagne', '🍾': 'bottle', '🎉': 'confetti', '🥳': 'confetti',
      '🎊': 'confetti', '🎈': 'balloon', '🎶': 'music', '🎵': 'music',
      '💃': 'music', '🕺': 'music', '🎭': 'masks-theater', '❤': 'heart',
      '💕': 'heart', '💖': 'heart', '💗': 'heart', '💘': 'heart',
      '💞': 'heart', '🤍': 'heart', '♥': 'heart', '💌': 'mail-heart',
      '💍': 'rings', '💒': 'rings', '🎁': 'gift', '🎀': 'gift',
      '✈': 'plane', '🧳': 'plane', '🏖': 'beach', '🏝': 'beach',
      '🏃': 'run', '🏋': 'run', '🚴': 'run', '🧘': 'yoga',
      '🏠': 'home', '🏡': 'home', '🛋': 'home', '🏙': 'building-skyscraper',
      '🌆': 'building-skyscraper', '⏳': 'hourglass', '⌛': 'hourglass', '⏱': 'hourglass',
      '🌬': 'wind', '💨': 'wind', '✨': 'sparkles', '💫': 'stars',
      '⭐': 'star', '🌟': 'star', '💎': 'diamond', '👑': 'crown',
      '⚡': 'bolt', '🕶': 'sunglasses', '😎': 'sunglasses', '🔮': 'crystal-ball',
      '🎨': 'palette',
    };
    // ── IKONE PALETE – kraj ──────────────────────────────────────────

    // ── EMOJI U OSOBINAMA ────────────────────────────────────────
    // Na kartici parfema Marti svaki od tri podatka počne emojijem iz palete
    // ("🌊 Svjež morski miris"). Kartica emoji nikad ne prikazuje (iz teksta
    // se uklanja svaki emoji, gdje god stajao), nego umjesto njega nacrta
    // ikonu iz IKONE_PALETE. ©, ® i ™ ovdje se ne smatraju emojijem.
    const RE_EMOJI = (function () {
      try {
        return new RegExp('[#*0-9]\\uFE0F?\\u20E3|(?![\\u00A9\\u00AE\\u2122])(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator})' +
          '(?:[\\uFE0E\\uFE0F\\u20E3]|[\\u{1F3FB}-\\u{1F3FF}]|\\u200D(?:\\p{Extended_Pictographic}|\\uFE0F))*', 'gu');
      } catch (e) {
        // preglednik bez \p{…}: znakovi izvan osnovne ravnine i česti simboli
        return /[#*0-9]\uFE0F?\u20E3|(?:[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2300-\u27BF\u2B00-\u2BFF])(?:[\uFE0E\uFE0F\u20E3]|\uD83C[\uDFFB-\uDFFF]|\u200D(?:[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2300-\u27BF]))*/g;
      }
    })();

    // prvi emoji u tekstu i tekst bez ijednog emojija
    function odvojiEmoji(t) {
      t = String(t || '');
      const nadeni = t.match(RE_EMOJI);
      return {
        emoji: nadeni ? nadeni[0] : '',
        tekst: t.replace(RE_EMOJI, ' ').replace(/[\uFE0E\uFE0F\u200D\u20E3]/g, '').replace(/\s+/g, ' ').trim()
      };
    }

    // ikona palete za emoji ('' kad je nema): bez FE0F i nijansi kože; niz
    // emojija spojenih s ZWJ traži se cio, a zatim samo njegov prvi znak
    function ikonaEmojija(e) {
      const c = String(e || '').replace(/[\uFE0E\uFE0F]/g, '').replace(/\uD83C[\uDFFB-\uDFFF]/g, '');
      if (!c) return '';
      if (PALETA[c]) return PALETA[c];
      const prvi = Array.from(c)[0];
      return PALETA[prvi] || '';
    }

    // Kartica s ikonama palete: osobina bez dobrog emojija (nema ga, nije u
    // paleti ili ista ikona već je na kartici) dobije ikonu prema riječima –
    // prvo trajnost i aura, zatim skupine iz RIJECI – a inače zadanu za svoje
    // mjesto (miris · kada · trajnost i aura)
    const RIJECI_PALETE = [
      ['hourglass', ['dugotraj', 'postojan', 'traje$', 'cijeli dan', 'cijelog dana']],
      ['sparkles', ['aura$', 'auru$', 'aure$', 'aurom$', 'sjaj', 'blist']],
      ['wind', ['trag$', 'traga$', 'tragom$', 'projekcij']],
      ['feather', ['lagan', 'prozrac', 'nenametljiv', 'njezn']],
      ['ripple', ['mors', 'more$', 'mora$', 'akvat', 'ocean']]
    ];
    const PRAVILA_PALETE = RIJECI_PALETE.map(function (s) {
      return {
        ikona: s[0],
        re: new RegExp('(?:^|[^a-z0-9])(?:' + s[1].map(function (r) {
          return /\$$/.test(r) ? r.slice(0, -1) + '(?![a-z0-9])' : r;
        }).join('|') + ')')
      };
    });
    // skupine iz RIJECI → ikona palete
    const STARE_U_PALETU = {
      list: 'leaf', dijamant: 'diamond', aktovka: 'briefcase', mjesec: 'moon', sunce: 'sun',
      pahulja: 'snowflake', kalendar: 'calendar', sat: 'hourglass', iskrice: 'sparkles', srce: 'heart',
      plamen: 'flame', cvijet: 'flower', drvo: 'tree', citrus: 'lemon', kapljica: 'droplet',
      slatko: 'candy', poklon: 'gift', oblak: 'cloud', munja: 'bolt'
    };
    const PALETA_PO_MJESTU = ['perfume', 'calendar', 'hourglass'];

    // skupina prve prepoznate riječi u tekstu (kao u ikonaOsobine)
    function prvoPravilo(pravila, t) {
      let najbolja = '', gdje = Infinity;
      for (let j = 0; j < pravila.length; j++) {
        const m = pravila[j].re.exec(t);
        if (m && m.index < gdje) { gdje = m.index; najbolja = pravila[j].ikona; }
      }
      return najbolja;
    }

    function ikonaPaletePremaRijecima(tekst, i, zauzete) {
      const t = bezKvacica(tekst);
      const kandidati = [
        prvoPravilo(PRAVILA_PALETE, t),
        STARE_U_PALETU[prvoPravilo(PRAVILA, t)],
        PALETA_PO_MJESTU[i]
      ].concat(PALETA_PO_MJESTU, ['sparkles', 'star', 'diamond']);
      for (let j = 0; j < kandidati.length; j++) {
        if (kandidati[j] && IKONE_PALETE[kandidati[j]] && !zauzete[kandidati[j]]) return kandidati[j];
      }
      return PALETA_PO_MJESTU[i] || PALETA_PO_MJESTU[0];
    }

    // bočica kad artikl nema sliku
    const IKONA_BOCA = '<svg viewBox="0 0 48 64" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" aria-hidden="true"><path d="M19 4.5h10v6.5H19z"/><path d="M21.5 11v4.5M26.5 11v4.5"/><rect x="9.5" y="15.5" width="29" height="44" rx="7"/><path d="M15.5 33.5h17M15.5 38.5h10" stroke-linecap="round" opacity=".55"/></svg>';

    // ── STIL ─────────────────────────────────────────────────────────────
    // Okomiti razmaci su kao na slici prijedloga: od ploče do vrha slova marke
    // 23 px, od marke do vrha slova naziva 15 px; osnovne crte naziva, vrste i
    // cijene točno su gdje su na slici (vrsta 20 px ispod naziva, cijena 32 px
    // ispod vrste)
    const CSS = `
      .mx {
        --mx-tinta: ${B.tinta};
        --mx-tekst: ${B.tekst};
        --mx-siva: ${B.siva};
        --mx-ploca: ${B.ploca};
        --mx-kartica: ${B.kartica};
        --mx-crta: ${B.crta};
        --mx-ruza: ${B.ruza};
        --mx-tocka: ${B.tocka};
        --mx-font: ${P.font};
        --mx-font-naziv: ${P.fontNaziva};
        --mx-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-zaobljenje: 16px;        /* kutovi kartice; isti ima i gumb */
        position: relative;
        width: 100%;
        min-width: 0;
        color: var(--mx-tinta);
        font-family: var(--mx-font);
        font-size: 13px;
        font-weight: 400;
        line-height: 18px;
        letter-spacing: normal;
        white-space: normal;
        word-break: normal;
        text-align: left;
        text-transform: none;
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

      /* ── jedan proizvod: kartica široka kao poruka (kao najširi Martin
         oblačić), najviše 400 px ── */
      .mx-istaknuta {
        display: flex;
        flex-direction: column;
        padding: 6px 0 14px;          /* mjesto za sjenu kartice */
      }

      /* ── više proizvoda: vrtuljak ──
         Kartice stoje u traci koja se lista vodoravno; listanje je izvorno
         (prst, dodirna ploha), pa je glatko na svim uređajima. Svaka kartica se
         zaustavi uz lijevi rub (scroll-snap), a desno proviruje sljedeća. Iza
         zadnje je toliko mjesta da se i ona zaustavi na istom mjestu.
         Traka počinje 4 px lijevo od poruke (mjesto za sjenu), pa svaka
         kartica stane točno uz lijevi rub poruke, kao Martini oblačići.
         U chatu (jedan-ekran.js) traka ide do desnog ruba prozora: chat u
         --mx-chat-izlaz-desno javi koliko je od poruke do ruba prozora, a u
         --mx-chat-proviri 0 px. Tada je kartica široka kao poruka (kao
         najširi oblačić), a sljedeća proviruje uz rub prozora. Bez tih
         vrijednosti traka završava s porukom, a kartica je od nje uža 36 px
         (12 px razmaka, sljedeća proviruje 24 px). */
      .mx-vrtuljak {
        --mx-izlaz: var(--mx-chat-izlaz-desno, 0px);    /* koliko traka ide desno od poruke */
        --mx-proviri: var(--mx-chat-proviri, 36px);     /* koliko je kartica uža od poruke */
        --mx-sirina: min(calc(100% - 4px - var(--mx-izlaz) - var(--mx-proviri)), 400px);   /* širina kartice u traci */
        position: relative;
        width: auto;                  /* s negativnim rubovima: šira od poruke */
        margin: 0 calc(-1 * var(--mx-izlaz)) 0 -4px;
      }
      .mx-traka {
        position: relative;
        display: flex;
        align-items: stretch;         /* sve kartice jednako visoke, gumbi u istoj liniji */
        overflow-x: auto;
        overflow-y: hidden;
        padding: 6px 0 18px;          /* mjesto za sjenu kartice */
        scroll-snap-type: x mandatory;
        scroll-padding-left: 4px;
        overscroll-behavior-x: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        /* rubovi trake se blago gube, pa sjena i kartica koja proviruje nemaju
           oštar rez; na rubu prozora chata desno se ne gube (tamo je rez prirodan) */
        --mx-maska: linear-gradient(90deg, transparent 0, #000 4px, #000 calc(100% - 14px + min(14px, var(--mx-izlaz))), transparent 100%);
        -webkit-mask-image: var(--mx-maska);
                mask-image: var(--mx-maska);
      }
      .mx-traka::-webkit-scrollbar { display: none; }
      .mx-traka::before { content: ""; flex: 0 0 4px; }
      .mx-traka::after { content: ""; flex: 0 0 calc(100% - var(--mx-sirina) - 4px); }
      .mx-traka > .mx-kartica {
        flex: 0 0 var(--mx-sirina);
        width: var(--mx-sirina);
        max-width: none;
        scroll-snap-align: start;
        scroll-snap-stop: always;     /* jedan potez = jedna kartica */
      }
      .mx-traka > .mx-kartica + .mx-kartica { margin-left: 12px; }
      .mx-traka:focus { outline: none; }
      .mx-traka:focus-visible > .mx-aktivna { outline: 2px solid var(--mx-tinta); outline-offset: 2px; }
      /* povlačenje mišem: dok traje, zaustavljanje je isključeno */
      .mx-traka.mx-vuce { scroll-snap-type: none; -webkit-user-select: none; user-select: none; }
      .mx-traka.mx-vuce * { pointer-events: none; }

      /* ispod trake su točkice (odabrana je izdužena), a lijevo i desno od
         njih strelice, na svim uređajima (na mobitelu malo veće, za prst) */
      .mx-kontrole {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: -8px;
        padding: 0 4px 6px;
      }
      .mx-tocke { display: flex; align-items: center; }
      .mx-tocka,
      .mx-strelica {
        -webkit-appearance: none;
        appearance: none;
        margin: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .mx-tocka { display: block; padding: 10px 4px; }
      .mx-tocka::before {
        content: "";
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 3px;
        background: var(--mx-tocka);
        transition: width .45s var(--mx-glatko), background-color .45s var(--mx-glatko);
      }
      .mx-tocka[aria-current="true"]::before { width: 20px; background: var(--mx-tinta); }
      .mx-tocka:focus, .mx-strelica:focus { outline: none; }
      .mx-tocka:focus-visible::before { outline: 2px solid var(--mx-tinta); outline-offset: 3px; }
      .mx-strelica {
        position: relative;
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border-radius: 50%;
        background: #ffffff;
        color: var(--mx-tinta);
        box-shadow: 0 0 0 1px rgba(0, 0, 0, .08), 0 2px 6px rgba(0, 0, 0, .06);
        transition: background-color .2s ease, color .2s ease, opacity .25s ease, transform .2s ease;
      }
      /* veća površina za dodir prstom (krug ostaje iste veličine) */
      .mx-strelica::after { content: ""; position: absolute; top: -6px; right: -6px; bottom: -6px; left: -6px; }
      .mx-strelica svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
      .mx-strelica:focus-visible { outline: 2px solid var(--mx-tinta); outline-offset: 2px; }
      .mx-strelica:disabled { opacity: .3; cursor: default; }
      .mx-strelica:not(:disabled):active { background: var(--mx-tinta); color: #ffffff; transform: scale(.94); }
      @media (pointer: coarse) {
        .mx-strelica { width: 36px; height: 36px; }
        .mx-strelica svg { width: 15px; height: 15px; }
      }
      @media (hover: hover) and (pointer: fine) {
        .mx-traka { cursor: grab; }
        .mx-traka.mx-vuce { cursor: grabbing; }
        .mx-strelica:not(:disabled):hover { background: var(--mx-tinta); color: #ffffff; }
      }

      /* ── kartica ── */
      .mx-kartica {
        position: relative;
        display: flex;
        flex-direction: column;
        flex: none;
        width: 100%;
        max-width: 400px;
        min-width: 0;
        padding: 6px 6px 20px;
        background: var(--mx-kartica);
        border-radius: var(--mx-zaobljenje);
        box-shadow: 0 1px 2px rgba(0, 0, 0, .05), 0 8px 24px rgba(0, 0, 0, .055);
        color: inherit;
      }

      /* ploča sa slikom: obrađena fotografija je već na podlozi u boji ploče */
      .mx-slika {
        position: relative;
        width: 100%;
        aspect-ratio: ${PLOCA[0]} / ${PLOCA[1]};
        border-radius: 10px;
        background: var(--mx-ploca);
        overflow: hidden;
        isolation: isolate;
      }
      @supports not (aspect-ratio: 1) {
        .mx-slika { height: 0; padding-bottom: ${(PLOCA[1] / PLOCA[0] * 100).toFixed(3)}%; }
      }
      .mx-slika img {
        position: absolute;
        top: 0; left: 0;
        display: block;
        width: 100%;
        height: 100%;
        max-width: none;
        max-height: none;
        margin: 0;
        padding: 0;
        border: 0;
        object-fit: cover;
        opacity: 0;
        transition: opacity .45s ease;
        user-select: none;
        -webkit-user-drag: none;
        pointer-events: none;
      }
      .mx-ucitano img { opacity: 1; }
      /* fotografija koju nije moguće obraditi (druga domena): cijela je u ploči,
         a njezina bijela pozadina stapa se s bojom ploče */
      .mx-slika .mx-css {
        top: ${((1 - VISINA_FOTOGRAFIJE) / 2 * 100).toFixed(1)}%;
        height: ${(VISINA_FOTOGRAFIJE * 100).toFixed(1)}%;
        object-fit: contain;
        mix-blend-mode: multiply;
      }
      .mx-prazno {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        display: grid;
        place-items: center;
        color: #c4c4c6;
      }
      .mx-prazno svg { width: 44px; height: 59px; }

      /* tekst kartice: 24 px od ruba kartice */
      .mx-tijelo {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        flex: 1 1 auto;
        min-width: 0;
        padding: 18.7px 18px 0;
      }
      /* razmak iznad gumba: najmanje 24 px; u jednako visokim karticama vrtuljka
         raste, pa su gumbi svih kartica u istoj liniji */
      .mx-razmak { display: block; flex: 1 0 24px; }
      .mx-marka {
        max-width: 100%;
        font-size: 15px;
        line-height: 20px;
        font-weight: 700;
        color: var(--mx-tinta);
        overflow-wrap: break-word;
      }
      .mx-naziv {
        max-width: 100%;
        margin: 0;
        font-family: var(--mx-font-naziv);
        font-size: 22px;
        line-height: 28px;
        font-weight: 500;
        letter-spacing: 0;
        color: var(--mx-tinta);
        font-variant-numeric: lining-nums;
        text-wrap: balance;
        overflow-wrap: break-word;
      }
      .mx-marka + .mx-naziv { margin-top: 2.3px; }
      .mx-vrsta {
        max-width: 100%;
        margin-top: 1.7px;
        font-size: 13px;
        line-height: 18px;
        font-weight: 400;
        color: var(--mx-siva);
        overflow-wrap: break-word;
      }
      .mx-marka + .mx-vrsta { margin-top: 2px; }

      /* cijena: na akciji nova cijena, pokraj nje precrtana stara i oznaka popusta */
      .mx-cijene {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        column-gap: 10px;
        row-gap: 2px;
        max-width: 100%;
        margin-top: 5px;
      }
      .mx-tijelo > .mx-cijene:first-child { margin-top: 0; }
      .mx-cijena,
      .mx-nova {
        font-family: var(--mx-font-naziv);
        font-size: 20px;
        line-height: 28px;
        font-weight: 500;
        color: var(--mx-tinta);
        font-variant-numeric: lining-nums;
        white-space: nowrap;
      }
      .mx-stara {
        font-size: 14px;
        line-height: 18px;
        font-weight: 400;
        color: var(--mx-siva);
        text-decoration: line-through;
        text-decoration-thickness: 1px;
        text-decoration-color: var(--mx-siva);
        white-space: nowrap;
      }
      .mx-postotak {
        align-self: center;
        padding: 3px 7px 3px 6px;
        border-radius: 4px;
        background: var(--mx-ruza);   /* kao "Ponude i akcije" na martimex.hr */
        color: var(--mx-tinta);
        font-size: 12px;
        line-height: 14px;
        font-weight: 700;
        letter-spacing: .02em;
        white-space: nowrap;
      }
      .mx-minus { display: inline-block; margin-right: .06em; }
      .mx-uz-kod {
        max-width: 100%;
        margin-top: 3px;
        font-size: 13px;
        line-height: 22px;
        color: var(--mx-siva);
      }
      /* promo kod kao kupon: debela slova u isprekidanom okviru */
      .mx-kod {
        display: inline-block;
        margin-left: 2px;
        padding: 0 6px 0 7px;         /* desno manje: razmak slova je i iza zadnjeg slova */
        border: 1px dashed #c4c4c6;
        border-radius: 4px;
        color: var(--mx-tinta);
        line-height: 18px;
        font-weight: 700;
        letter-spacing: .06em;
        white-space: nowrap;
      }

      /* tri osobine: jednaki stupci, između njih tanka okomita crta (kartica
         parfema ima stupce široke koliko tekst, vidi niže) */
      .mx-osobine {
        display: grid;
        grid-template-columns: repeat(var(--mx-stupaca, 3), minmax(0, 1fr));
        align-self: stretch;
        margin: 24px 0 0;
        padding: 0;
        list-style: none;
      }
      .mx-osobina {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 0;
        margin: 0;
        padding: 0 4px;
        list-style: none;
        text-align: center;
      }
      .mx-osobina + .mx-osobina::before {
        content: "";
        position: absolute;
        top: 0; bottom: 0; left: 0;
        width: 1px;
        background: var(--mx-crta);
      }
      .mx-ikona {
        display: block;
        flex: none;
        width: 24px;
        height: 24px;
        overflow: visible;
        fill: none;
        stroke: var(--mx-tinta);
        stroke-width: 1.33;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .mx-osobina-tekst {
        display: block;
        max-width: 100%;
        margin-top: 8px;
        font-size: 12.5px;
        line-height: 16px;
        font-weight: 400;
        color: var(--mx-tekst);
        text-wrap: balance;
        overflow-wrap: break-word;
      }
      /* Kartica parfema (osobine s emojijem): ikona, ispod nje podatak tamnim
         polumasnim slovima, a ispod podatka sitna siva oznaka (Miris · Kada
         nositi · Trajnost). Stupci imaju tri reda, pa su oznake u istoj liniji
         i kad je neki podatak u jednom retku. */
      .mx-osobine--podaci .mx-osobina {
        display: grid;
        grid-template-rows: auto 1fr auto;
        justify-items: center;
        align-items: start;     /* prvi redak podatka u istoj liniji u svim stupcima */
      }
      .mx-osobine--podaci .mx-ikona { grid-row: 1; }
      .mx-osobine--podaci .mx-osobina-tekst {
        grid-row: 2;
        margin-top: 10px;
        font-size: 13px;
        line-height: 17px;
        font-weight: 600;
        color: var(--mx-tinta);
      }
      .mx-osobine--podaci .mx-osobina-oznaka {
        grid-row: 3;
        display: block;
        margin-top: 5px;
        font-size: 11px;
        line-height: 14px;
        font-weight: 400;
        color: var(--mx-siva);
        white-space: nowrap;
      }
      /* Kartica parfema s tri podatka (mx-podataka-3): stupci su široki
         koliko treba njihov tekst. Prvi počinje uz lijevi rub teksta kartice,
         zadnji završava uz desni, a slobodan prostor podijeli se jednako u
         dva razmaka između njih (najmanje 8 px, pa je tekst od crte najmanje
         4 px, kao u jednakim stupcima); tanka crta je na sredini razmaka.
         Tako dulji podatak dobije više mjesta i ostane u dva retka. S jednim
         ili dva podatka stupci su jednaki, kao kod ostalih kartica. */
      .mx-osobine.mx-podataka-3 { grid-template-columns: auto minmax(8px, 1fr) auto minmax(8px, 1fr) auto; }
      .mx-podataka-3 > .mx-osobina { grid-row: 1; min-width: auto; padding: 0; }
      .mx-podataka-3 > .mx-osobina:nth-child(2) { grid-column: 3; }
      .mx-podataka-3 > .mx-osobina:nth-child(3) { grid-column: 5; }
      .mx-podataka-3 > .mx-osobina + .mx-osobina::before { content: none; }
      .mx-podataka-3::before,
      .mx-podataka-3::after {
        content: "";
        grid-row: 1;
        justify-self: center;
        width: 1px;
        background: var(--mx-crta);
      }
      .mx-podataka-3::before { grid-column: 2; }
      .mx-podataka-3::after { grid-column: 4; }

      /* gumb: crni pravokutnik preko cijele širine teksta, kutovi zaobljeni kao
         kutovi kartice */
      .mx-gumb {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        align-self: stretch;
        flex: none;
        min-height: 44px;
        margin-top: 0;
        padding: 0 16px;
        border: 0;
        border-radius: var(--mx-zaobljenje);
        background-color: var(--mx-tinta);
        color: #ffffff;
        font-family: var(--mx-font);
        font-size: 14.5px;
        line-height: 20px;
        font-weight: 600;
        letter-spacing: normal;
        text-align: center;
        text-decoration: none;
        text-transform: none;
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background-color .2s ease;
      }
      .mx-gumb:link, .mx-gumb:visited { color: #ffffff; text-decoration: none; }
      .mx-gumb:focus { outline: none; }
      .mx-gumb:focus-visible { outline: 2px solid var(--mx-tinta); outline-offset: 3px; }
      .mx-gumb:active { background-color: #000000; }
      @media (hover: hover) {
        .mx-gumb:hover { background-color: #2f2f2f; }
        .mx-gumb:active { background-color: #000000; }
      }

      /* ── pojava: kartice blago izrone jedna za drugom ── */
      .mx-pojava .mx-kartica {
        animation: mx-pojava .8s var(--mx-glatko) backwards;
        animation-delay: calc(80ms + var(--mx-i, 0) * 110ms);
      }
      .mx-pojava .mx-kontrole { animation: mx-samo-prozirnost .6s ease .45s backwards; }
      @keyframes mx-pojava {
        from { opacity: 0; transform: translateY(14px); }
      }
      @keyframes mx-samo-prozirnost {
        from { opacity: 0; }
      }

      /* ── namig: kartice vrtuljka se jednom kratko pomaknu ulijevo i vrate,
         pa se vidi da desno ima još kartica (vidi NAMIG u kodu) ── */
      .mx-traka.mx-namig > .mx-kartica { animation: mx-namig 1.5s both; }
      @keyframes mx-namig {
        0%   { transform: translateX(0); animation-timing-function: cubic-bezier(.3, 0, .2, 1); }
        38%  { transform: translateX(-64px); }
        54%  { transform: translateX(-64px); animation-timing-function: cubic-bezier(.45, 0, .2, 1); }
        100% { transform: translateX(0); }
      }

      @media (forced-colors: active) {
        .mx-kartica { border: 1px solid CanvasText; }
        .mx-ikona { stroke: CanvasText; }
        .mx-gumb { border: 1px solid ButtonText; }
      }

      @media (prefers-reduced-motion: reduce) {
        .mx-pojava .mx-kartica { animation: mx-samo-prozirnost .35s linear backwards; animation-delay: 0s; }
        .mx-slika img, .mx-gumb, .mx-tocka::before, .mx-strelica { transition: none; }
        .mx-pojava .mx-kontrole { animation: none; }
        .mx-traka.mx-namig > .mx-kartica { animation: none; }
      }
    `;

    // Stil se ubacuje jednom: u shadow root widgeta (ili u <head> ako ga nema)
    function ubaciStil(element) {
      const korijen = element.getRootNode ? element.getRootNode() : document;
      const jeShadow = typeof ShadowRoot !== 'undefined' && korijen instanceof ShadowRoot;
      const cilj = jeShadow ? korijen : (korijen === document ? document.head : null);
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-kartice', '34');
      stil.textContent = CSS;
      if (!cilj) { element.appendChild(stil); return; }       // element još nije u DOM-u
      if (cilj.querySelector('style[data-mx-kartice="34"]')) return;
      cilj.appendChild(stil);
    }

    // Fontovi iz mape fonts/ (licenca SIL OFL 1.1). Svaki font ima dvije
    // datoteke: osnovna slova i dodatna (č, ć, đ, š, ž...). Nunito i Playfair
    // Display su "varijabilni": jedna datoteka ima sve debljine slova.
    // Jost je font ostalih modula chata (gumb, prozor chata, perlice): oni ga
    // ne učitavaju sami kad je ovaj <style> već na stranici.
    // Idu u <head> stranice: fontovi iz <head> vrijede i unutar shadow roota
    // widgeta (obrnuto ne vrijedi).
    const FONTOVI = [
      { obitelj: 'MX Jost', datoteka: 'jost', tezine: '400 600' },
      { obitelj: 'MX Nunito', datoteka: 'nunito', tezine: '200 1000' },
      { obitelj: 'MX Playfair', datoteka: 'playfair-display', tezine: '400 900' }
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

    function skrati(s, max) {
      if (!s || !max || s.length <= max) return s;
      let t = s.slice(0, max);
      const razmak = t.lastIndexOf(' ');
      if (razmak > max * 0.5) t = t.slice(0, razmak);
      return t.replace(/[\s,;:.–-]+$/, '') + '…';
    }

    // Osobine artikla: niz tekstova ili { text, icon }, a može i jedan tekst
    // s osobinama odvojenima znakom | ili ; → [{ tekst, ikona, emoji }],
    // najviše tri. Emoji ("🌊 Svjež morski miris", ili u polju icon/emoji) se
    // odvoji od teksta; tekst ostaje bez ijednog emojija.
    function uzmiOsobine(v) {
      if (typeof v === 'string') v = v.split(/\s*[|;\n]\s*/);
      if (!Array.isArray(v)) return [];
      const van = [];
      v.forEach(function (o) {
        if (van.length >= P.najviseOsobina) return;
        let t = '', ikona = '';
        if (o && typeof o === 'object') {
          t = prvo(o.text, o.tekst, o.naziv, o.label, o.title);
          ikona = prvo(o.icon, o.ikona, o.emoji) || '';
        } else {
          t = o;
        }
        const uIkoni = odvojiEmoji(tekst(ikona));
        const uTekstu = odvojiEmoji(tekst(t));
        const emoji = uIkoni.emoji || uTekstu.emoji;
        if (uIkoni.emoji) ikona = uIkoni.tekst;
        t = uTekstu.tekst.replace(/\*\*|__|`/g, '').replace(/^[\s\-–•*·]+/, '').replace(/[\s.]+$/, '');
        if (!t) return;
        van.push({ tekst: skrati(t, P.znakovaOsobine), ikona: tekst(ikona), emoji: emoji });
      });
      return van;
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
          cijena: c.price,
          stara: c.oldPrice,
          slika: c.imageUrl || '',
          url: c.url || '',
          osobine: uzmiOsobine(prvo(c.features, c.osobine)),
          kod: tekst(prvo(promo.code, c.promoCode)),
          kodPostotak: prvo(promo.percent, c.promoPercent),
          kodCijena: prvo(promo.price, c.promoPrice),
          kodRok: prvo(promo.validUntil, c.promoValidUntil)
        };
      });
    }

    // "Prada ▻ Luna Rossa Carbon Eau de Parfum 50 ml"
    //   → marka "Prada", naziv "Luna Rossa Carbon", vrsta "Parfemska voda · 50 ml"
    const RAZDJELNIK = /\s*[▻►▸▹▶›»|]\s*/;
    // vrsta mirisa na kraju naziva, po želji s volumenom i oznakom testera
    // ("Eau de Parfum 100 ml", "Eau de Toilette (50 ml)", "EDP 100ml Tester")
    const VRSTA = /\s+(extrait de parfum|eau de parfum(?: intense)?|eau de toilette(?: intense)?|eau de cologne|parfum|parfemska voda|toaletna voda|kolonjska voda|edp|edt|edc)(?:\s*[,–-]?\s*\(?(\d+(?:[.,]\d+)?\s?ml)\)?)?(?:\s*[,–-]?\s*\(?(tester)\)?)?\s*$/i;
    const KRATICE = { edp: 'eau de parfum', edt: 'eau de toilette', edc: 'eau de cologne' };
    // veličina na kraju naziva ostalih proizvoda ("Double Serum 50 ml", "Krema 2 x 30 ml")
    const VELICINA = /\s+\(?((?:\d+\s?[x×]\s?)?\d+(?:[.,]\d+)?\s?(?:ml|g|gr|kg|l|oz|kom))\)?\s*$/i;

    // vrsta na hrvatskom ("Eau De Parfum" → "Parfemska voda")
    function urednaVrsta(v) {
      let m = v.toLowerCase().replace(/\s+/g, ' ');
      if (KRATICE[m]) m = KRATICE[m];
      if (P.vrste[m]) return P.vrste[m];
      return m.charAt(0).toUpperCase() + m.slice(1);
    }

    // "50ml" / "50 ML" → "50 ml" (s neprelomivim razmakom)
    function urednaVelicina(v) {
      return v.replace(/\s*[x×]\s*/i, ' x ').replace(/(\d)\s?(ml|g|gr|kg|l|oz|kom)$/i, function (x, b, j) {
        return b + ' ' + j.toLowerCase();
      });
    }

    function odvojiVrstu(naziv) {
      const m = naziv ? naziv.match(VRSTA) : null;
      if (m) {
        const ostatak = naziv.slice(0, m.index).trim();
        // "Libre Le Parfum": "Le Parfum" je dio imena, a ne vrsta
        if (ostatak && !(/^parfum$/i.test(m[1]) && /(^|\s)(le|la|les|the|de|du|des|di|il)$/i.test(ostatak))) {
          const dijelovi = [urednaVrsta(m[1])];
          if (m[2]) dijelovi.push(urednaVelicina(m[2]));
          if (m[3]) dijelovi.push('Tester');
          return { naziv: ostatak, vrsta: dijelovi.join(' · ') };
        }
      }
      // ostali proizvodi: samo veličina s kraja naziva
      const v = naziv ? naziv.match(VELICINA) : null;
      if (v && naziv.slice(0, v.index).trim()) {
        return { naziv: naziv.slice(0, v.index).trim(), vrsta: urednaVelicina(v[1]) };
      }
      return { naziv: naziv, vrsta: '' };
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

    // Osobina u dva retka podjednake duljine ("Svjež / i čist"). Jednoslovna
    // riječ (i, u, s, k, o, a, z) ne ostaje na kraju retka.
    function dvaReda(t) {
      const rijeci = t.split(' ');
      if (rijeci.length < 2) return [t];
      let najbolji = null;
      for (let i = 1; i < rijeci.length; i++) {
        const a = rijeci.slice(0, i).join(' '), b = rijeci.slice(i).join(' ');
        const razlika = Math.abs(a.length - b.length) + (rijeci[i - 1].length === 1 ? 100 : 0);
        if (!najbolji || razlika < najbolji.razlika) najbolji = { a: a, b: b, razlika: razlika };
      }
      return [najbolji.a, najbolji.b];
    }
    // i unutar retka jednoslovna riječ ostaje uz sljedeću
    function vezi(t) {
      return t.replace(/(^|\s)([a-zA-ZčćđšžČĆĐŠŽ])\s+/g, '$1$2 ');
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

    function sigurniLink(url) {
      if (!url) return '';
      try {
        const u = new URL(url, window.location.href);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
        return u.href;
      } catch (e) { return ''; }
    }

    // Pamti koje su preporuke već prikazane da se pojava ne ponavlja
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

    // ── GRADNJA ──────────────────────────────────────────────────────────
    function el(tag, klasa, sadrzaj) {
      const e = document.createElement(tag);
      if (klasa) e.className = klasa;
      if (sadrzaj !== undefined) e.textContent = sadrzaj;
      return e;
    }

    function prazanIzlog(ploca) {
      ploca.classList.add('mx-bez-slike');
      const p = el('span', 'mx-prazno');
      p.innerHTML = IKONA_BOCA;
      ploca.appendChild(p);
    }

    // Fotografija proizvoda se "čita" preko canvasa (moguće kad je slika s iste
    // domene kao stranica, npr. martimex.hr → martimex.hr):
    //  - pozadina (4 kuta): bijela ili svijetlosiva postane prozirna, pa se ispod
    //    artikla vidi boja ploče, a boje artikla ostanu kakve jesu (rubovi i
    //    sjene s fotografije ostanu mekani); tamna ili šarena fotografija ispuni
    //    cijelu ploču (nacin "foto")
    //  - artikl se izreže i postavi u kadar: visok 78 % ploče, u sredini
    //  - slika se napravi točno u pikselima ekrana (oštra na mobitelu)
    // Kad se slika ne može pročitati, ostaje CSS stapanje (nacin "css").
    // zavrsi(nacin, adresa): adresa obrađene slike ili prazno
    function obradiFotografiju(img, ploca, zavrsi) {
      let gotovo = false;
      const kraj = function (nacin, adresa) { if (!gotovo) { gotovo = true; zavrsi(nacin, adresa || ''); } };
      setTimeout(function () { kraj('css'); }, 2500);   // sigurnost: slika se prikaže i ako obrada zapne

      const W = img.naturalWidth, H = img.naturalHeight;

      // 1) mali uzorak cijele fotografije: kakva je pozadina
      const U = 48;
      let u;
      try {
        const c = document.createElement('canvas');
        c.width = U;
        c.height = U;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0, U, U);
        u = g.getImageData(0, 0, U, U).data;
      } catch (e) { kraj('css'); return; } // slika s druge domene: ostaje CSS stapanje

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
      if (puni.length >= 2) {
        const lo = puni[1].lo;       // drugi najtamniji kut: jedan "zalutali" kut ne odlučuje
        const boja = Math.max.apply(null, puni.slice(1).map(function (z) { return z.boja; }));
        if (lo >= 212 && boja <= 18) pojacaj = Math.min(1.2, 255 / lo);
        else { kraj('foto'); return; }
      }

      // 2) radna kopija (najviše 900 px): svijetlosiva pozadina postane bijela, a
      //    bijelo prozirno; usput se nađu granice artikla na fotografiji
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
      } catch (e) { kraj('css'); return; }
      const d = rp.data;
      const PRAG = 238;              // piksel tamniji od ovoga pripada artiklu (i sjeni ispod njega)
      const SUM = 4;                 // JPEG šum oko čiste bijele
      let x0 = rw, y0 = rh, x1 = -1, y1 = -1;
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        if (d[i + 3] === 0) continue;
        const r = Math.min(255, d[i] * pojacaj);
        const gr = Math.min(255, d[i + 1] * pojacaj);
        const b = Math.min(255, d[i + 2] * pojacaj);
        const mn = Math.min(r, gr, b);
        if (d[i + 3] > 40 && mn < PRAG) {
          const x = p % rw, y = (p - x) / rw;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
        // bijelo → prozirno: koliko je piksel daleko od bijele, toliko je neproziran,
        // a boja mu se "odvoji" od bijele, pa preko bilo koje podloge izgleda kao na fotografiji
        const a = Math.max(0, 255 - SUM - mn) / (255 - SUM);
        if (a <= 0) { d[i + 3] = 0; continue; }
        d[i] = 255 - (255 - r) / a;
        d[i + 1] = 255 - (255 - gr) / a;
        d[i + 2] = 255 - (255 - b) / a;
        d[i + 3] = a * d[i + 3];
      }
      rg.putImageData(rp, 0, 0);
      if (x1 < x0 || y1 < y0) { x0 = 0; y0 = 0; x1 = rw - 1; y1 = rh - 1; }   // ništa nađeno: cijela slika

      // 3) kadar u pikselima ekrana: podloga u boji ploče, artikl u sredini,
      //    visok 78 % ploče
      const gustoca = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)));
      const pw = ploca.clientWidth || PLOCA[0];
      const ph = ploca.clientHeight || Math.round(pw * PLOCA[1] / PLOCA[0]);
      const cw = Math.round(pw * gustoca), ch = Math.round(ph * gustoca);
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const k = Math.min(ch * KADAR.visina / bh, cw * KADAR.sirina / bw);
      const ox = cw / 2 - (x0 + bw / 2) * k;
      const oy = ch / 2 - (y0 + bh / 2) * k;
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
        g.fillStyle = B.ploca;
        g.fillRect(0, 0, cw, ch);
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = 'high';
        g.drawImage(izvor, 0, 0, iw, ih, ox, oy, rw * k, rh * k);
      } catch (e) { kraj('css'); return; }

      try {
        if (platno.toBlob) {
          platno.toBlob(function (blob) {
            if (blob) kraj('obradjeno', URL.createObjectURL(blob));
            else kraj('css');
          }, 'image/png');
        } else {
          kraj('obradjeno', platno.toDataURL('image/png'));
        }
      } catch (e) { kraj('css'); }
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

    function izgradiSliku(k) {
      const ploca = el('div', 'mx-slika');
      if (!k.slika) { prazanIzlog(ploca); return ploca; }
      const img = el('img');
      img.alt = '';                 // naziv je već u tekstu kartice
      img.decoding = 'async';
      img.draggable = false;
      if ('fetchPriority' in img) img.fetchPriority = 'high';   // slike su glavni sadržaj poruke
      let spremno = false;
      const gotovo = function () {
        if (spremno || !img.naturalWidth) return;
        spremno = true;
        obradiFotografiju(img, ploca, function (nacin, adresa) {
          if (nacin === 'obradjeno') {
            const izvorna = img.src;
            img.addEventListener('load', function () { ploca.classList.add('mx-ucitano'); }, { once: true });
            img.addEventListener('error', function () {   // obrađena se nije učitala: izvorna, CSS stapanje
              img.classList.add('mx-css');
              img.src = izvorna;
              ploca.classList.add('mx-ucitano');
            }, { once: true });
            img.src = adresa;
            return;
          }
          if (nacin === 'css') img.classList.add('mx-css');
          ploca.classList.add('mx-ucitano');
        });
      };
      img.addEventListener('load', gotovo, { once: true });
      img.addEventListener('error', function () {
        if (spremno) return;
        img.remove();
        prazanIzlog(ploca);
      }, { once: true });
      img.src = k.slika;
      ploca.appendChild(img);
      if (img.complete) gotovo();
      return ploca;
    }

    function izgradiCijene(k, tijelo) {
      // POPUST: nova cijena (s kodom, kad ga ima), pokraj nje precrtana redovna
      // (ili trenutna, kad popust daje samo kod) i oznaka s postotkom popusta
      const nCijena = brojIz(k.cijena);
      const nStara = brojIz(k.stara);
      const naAkciji = nCijena !== null && nStara !== null && nStara > nCijena;
      const kod = promoKod(k, brojCijene(k.cijena));
      const sKodom = !!kod && kod.cijena !== null;
      const prije = naAkciji ? nStara : (sKodom ? nCijena : null);
      const sada = sKodom ? kod.cijena : nCijena;
      const popust = prije ? Math.round((1 - sada / prije) * 100) : 0;
      const tekstCijene = cijena(k.cijena);
      if (!tekstCijene) return;
      const red = el('div', 'mx-cijene');
      if (popust >= 1) {
        red.classList.add('mx-cijene--popust');
        const nova = el('span', 'mx-nova');
        nova.appendChild(el('span', 'mx-skriveno', 'Sada: '));
        nova.appendChild(document.createTextNode(sKodom ? EUR.format(kod.cijena) : tekstCijene));
        red.appendChild(nova);
        const stara = el('s', 'mx-stara');
        stara.appendChild(el('span', 'mx-skriveno', 'Prije: '));
        stara.appendChild(document.createTextNode(cijena(naAkciji ? k.stara : k.cijena)));
        red.appendChild(stara);
        const oznaka = el('span', 'mx-postotak');
        oznaka.setAttribute('aria-hidden', 'true');           // čitaču zaslona postotak je u tekstu ispod
        oznaka.appendChild(el('span', 'mx-minus', '−'));
        oznaka.appendChild(document.createTextNode(popust + ' %'));
        red.appendChild(oznaka);
        red.appendChild(el('span', 'mx-skriveno', ' (popust ' + popust + ' %)'));
      } else {
        red.appendChild(el('span', 'mx-cijena', tekstCijene));
      }
      tijelo.appendChild(red);
      // promo kod ispod cijene: "uz kod MRTMX"; kad se cijena s kodom ne zna
      // (npr. cijena "od 49 €"), i postotak: "−30 % uz kod MRTMX"
      if (kod) {
        const uz = el('div', 'mx-uz-kod');
        uz.appendChild(document.createTextNode((sKodom ? '' : '−' + String(kod.postotak).replace('.', ',') + ' % ') + P.tekstUzKod + ' '));
        uz.appendChild(el('span', 'mx-kod', kod.tekst));
        tijelo.appendChild(uz);
      }
    }

    function izgradiOsobine(k, tijelo) {
      if (!k.osobine.length) return;
      // Kartica parfema (barem jedna osobina s emojijem iz palete): sve ikone
      // su iz palete i nijedna se ne ponavlja, a ispod svakog podatka je
      // oznaka (Miris · Kada nositi · Trajnost). Ostale kartice: kao dosad.
      const sPaletom = k.osobine.some(function (o) { return ikonaEmojija(o.emoji); });
      const lista = el('ul', sPaletom ? 'mx-osobine mx-osobine--podaci mx-podataka-' + k.osobine.length : 'mx-osobine');
      lista.setAttribute('role', 'list');
      lista.style.setProperty('--mx-stupaca', String(k.osobine.length));
      const zauzete = {};
      k.osobine.forEach(function (o, i) {
        const stavka = el('li', 'mx-osobina');
        let crtez;
        if (sPaletom) {
          let ime = ikonaEmojija(o.emoji);
          if (!ime || zauzete[ime]) ime = ikonaPaletePremaRijecima(o.tekst, i, zauzete);
          zauzete[ime] = true;
          crtez = IKONE_PALETE[ime];
        } else {
          crtez = IKONE[ikonaOsobine(o.tekst, o.ikona, i)];
        }
        stavka.innerHTML = svg(crtez, 'mx-ikona');
        // oznaka je u kodu ispred podatka (čitač zaslona: "Miris: Topao i
        // slatkast"), a na zaslonu ispod njega (vidi .mx-osobine--podaci)
        const oznaka = sPaletom && P.oznakePodataka ? P.oznakePodataka[i] : '';
        if (oznaka) {
          const o2 = el('span', 'mx-osobina-oznaka', oznaka);
          o2.appendChild(el('span', 'mx-skriveno', ': '));
          stavka.appendChild(o2);
        }
        const t = el('span', 'mx-osobina-tekst');
        dvaReda(o.tekst).forEach(function (r, j) {
          if (j) t.appendChild(el('br'));
          t.appendChild(document.createTextNode(vezi(r)));
        });
        stavka.appendChild(t);
        lista.appendChild(stavka);
      });
      tijelo.appendChild(lista);
    }

    function izgradiKarticu(k, i, istaknuta) {
      const link = sigurniLink(k.url);
      const kartica = el('div', istaknuta ? 'mx-kartica mx-kartica--istaknuta' : 'mx-kartica');
      kartica.style.setProperty('--mx-i', String(i));
      kartica.appendChild(izgradiSliku(k));

      const tijelo = el('div', 'mx-tijelo');
      const d = razdvojiNaziv(k.naziv);
      if (d.marka) tijelo.appendChild(el('div', 'mx-marka', d.marka));
      if (d.naziv) tijelo.appendChild(el('div', 'mx-naziv', d.naziv));
      if (d.vrsta) tijelo.appendChild(el('div', 'mx-vrsta', d.vrsta));
      izgradiCijene(k, tijelo);
      izgradiOsobine(k, tijelo);

      // GUMB: jedini link na kartici
      if (link) {
        tijelo.appendChild(el('span', 'mx-razmak'));
        const gumb = el('a', 'mx-gumb');
        gumb.href = link;
        gumb.draggable = false;
        gumb.target = '_self';
        gumb.appendChild(el('span', '', P.tekstGumba));
        const zaCitac = [d.marka, d.naziv, d.vrsta.split(' · ').join(', ')].filter(Boolean).join(' ');
        if (zaCitac) gumb.appendChild(el('span', 'mx-skriveno', ': ' + zaCitac));
        tijelo.appendChild(gumb);
      }
      kartica.appendChild(tijelo);
      return kartica;
    }

    // ── VRTULJAK ─────────────────────────────────────────────────────────
    // Više proizvoda: kartice u vodoravnoj traci. Prstom i dodirnom plohom
    // traka se lista izvorno (glatko, s inercijom), a CSS je zaustavlja na
    // svakoj kartici. Mišem se traka povuče (lagan potez = sljedeća kartica),
    // a ispod su točkice i strelice (na svim uređajima). Tipke ← → (i
    // Home/End) listaju kad je traka u fokusu.
    const MIRNO = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    // kupac je na ovoj stranici već listao neki vrtuljak (tada mu namig ne treba)
    let kupacListao = false;
    const STRELICE = {
      lijevo: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3.5L5.5 8L10 12.5"/></svg>',
      desno: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 3.5L10.5 8L6 12.5"/></svg>'
    };

    function gumbStrelice(smjer, oznaka) {
      const g = el('button', 'mx-strelica mx-strelica--' + smjer);
      g.type = 'button';
      g.setAttribute('aria-label', oznaka);
      g.innerHTML = STRELICE[smjer];
      // Safari na iPhoneu pokaže pritisak (:active) samo kad gumb sluša dodir
      g.addEventListener('touchstart', function () {}, { passive: true });
      return g;
    }

    function izgradiVrtuljak(kartice, potpis) {
      const n = kartice.length;
      const korijen = noviKorijen('mx-vrtuljak', potpis);
      korijen.setAttribute('role', 'region');
      korijen.setAttribute('aria-roledescription', 'vrtuljak');
      const traka = el('div', 'mx-traka');
      traka.tabIndex = 0;
      const elementi = kartice.map(function (k, i) {
        const kartica = izgradiKarticu(k, i, false);
        kartica.setAttribute('role', 'group');
        kartica.setAttribute('aria-roledescription', 'proizvod');
        kartica.setAttribute('aria-label', (i + 1) + ' od ' + n);
        traka.appendChild(kartica);
        return kartica;
      });
      korijen.appendChild(traka);

      const kontrole = el('div', 'mx-kontrole');
      const prethodna = gumbStrelice('lijevo', 'Prethodni proizvod');
      const sljedeca = gumbStrelice('desno', 'Sljedeći proizvod');
      const tocke = el('div', 'mx-tocke');
      const popisTocaka = elementi.map(function (x, i) {
        const t = el('button', 'mx-tocka');
        t.type = 'button';
        t.setAttribute('aria-label', 'Proizvod ' + (i + 1) + ' od ' + n);
        tocke.appendChild(t);
        return t;
      });
      kontrole.appendChild(prethodna);
      kontrole.appendChild(tocke);
      kontrole.appendChild(sljedeca);
      korijen.appendChild(kontrole);

      pokreniVrtuljak(traka, elementi, popisTocaka, prethodna, sljedeca);
      return korijen;
    }

    function pokreniVrtuljak(traka, kartice, tocke, prethodna, sljedeca) {
      const n = kartice.length;
      let aktivna = -1;               // kartica uz lijevi rub
      let cilj = null;                // kartica prema kojoj traka upravo klizi
      let okvir = 0, mirovanje = 0;

      // razmak između početaka dviju kartica i položaj kartice u traci (CSS px)
      const korak = function () { return kartice[1].offsetLeft - kartice[0].offsetLeft; };
      const polozaj = function (i) { return kartice[i].offsetLeft - kartice[0].offsetLeft; };

      function postavi(i) {
        if (i === aktivna) return;
        aktivna = i;
        tocke.forEach(function (t, j) { t.setAttribute('aria-current', j === i ? 'true' : 'false'); });
        kartice.forEach(function (c, j) { c.classList.toggle('mx-aktivna', j === i); });
        prethodna.disabled = i === 0;
        sljedeca.disabled = i === n - 1;
      }
      function osvjezi() {
        okvir = 0;
        const k = korak();
        postavi(k > 0 ? Math.max(0, Math.min(n - 1, Math.round(traka.scrollLeft / k))) : 0);
      }
      function idi(i) {
        i = Math.max(0, Math.min(n - 1, i));
        cilj = i;
        traka.scrollTo({ left: polozaj(i), behavior: MIRNO.matches ? 'auto' : 'smooth' });
      }
      // brzi uzastopni klikovi idu dalje od kartice prema kojoj traka već klizi
      const odakle = function () { return cilj !== null ? cilj : aktivna; };

      traka.addEventListener('scroll', function () {
        kupacListao = true;
        if (!okvir) okvir = requestAnimationFrame(osvjezi);
        clearTimeout(mirovanje);
        mirovanje = setTimeout(function () { cilj = null; }, 180);
      }, { passive: true });

      tocke.forEach(function (t, j) { t.addEventListener('click', function () { idi(j); }); });
      prethodna.addEventListener('click', function () { idi(odakle() - 1); });
      sljedeca.addEventListener('click', function () { idi(odakle() + 1); });
      traka.addEventListener('keydown', function (e) {
        if (e.target !== traka) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          idi(odakle() + (e.key === 'ArrowRight' ? 1 : -1));
        } else if (e.key === 'Home' || e.key === 'End') {
          e.preventDefault();
          idi(e.key === 'Home' ? 0 : n - 1);
        }
      });

      // Povlačenje mišem: traka prati miš, a nakon puštanja klizne na karticu
      // u smjeru poteza (ili na najbližu, kad je potez spor). Klik koji završi
      // povlačenje ne otvara proizvod. Promo kod se mišem može i označiti.
      let vuce = null, bezKlika = false;
      traka.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0 || (e.target.closest && e.target.closest('.mx-kod'))) return;
        vuce = { id: e.pointerId, x: e.clientX, pocetak: traka.scrollLeft, aktivno: false, zadnjiX: e.clientX, zadnjeT: e.timeStamp, brzina: 0 };
      });
      traka.addEventListener('pointermove', function (e) {
        if (!vuce || e.pointerId !== vuce.id) return;
        const dx = e.clientX - vuce.x;
        if (!vuce.aktivno) {
          if (Math.abs(dx) < 6) return;
          vuce.aktivno = true;
          try { traka.setPointerCapture(e.pointerId); } catch (x) { /* nije važno */ }
          if (window.getSelection) window.getSelection().removeAllRanges();
          traka.classList.add('mx-vuce');
        }
        const dt = e.timeStamp - vuce.zadnjeT;
        if (dt > 0) vuce.brzina = 0.6 * vuce.brzina + 0.4 * (e.clientX - vuce.zadnjiX) / dt;
        vuce.zadnjiX = e.clientX;
        vuce.zadnjeT = e.timeStamp;
        traka.scrollLeft = vuce.pocetak - dx;
      });
      function pusti(e) {
        if (!vuce || e.pointerId !== vuce.id) return;
        const v = vuce;
        vuce = null;
        if (!v.aktivno) return;
        bezKlika = true;
        setTimeout(function () { bezKlika = false; }, 60);
        const k = korak();
        const sada = k > 0 ? traka.scrollLeft / k : 0;
        idi(v.brzina < -0.2 ? Math.ceil(sada) : v.brzina > 0.2 ? Math.floor(sada) : Math.round(sada));
        // zaustavljanje se vrati tek kad traka stane na kartici
        let gotovo = false;
        const vrati = function () {
          if (gotovo) return;
          gotovo = true;
          traka.classList.remove('mx-vuce');
          traka.removeEventListener('scrollend', vrati);
        };
        traka.addEventListener('scrollend', vrati);
        setTimeout(vrati, 700);
      }
      traka.addEventListener('pointerup', pusti);
      traka.addEventListener('pointercancel', pusti);
      traka.addEventListener('click', function (e) {
        if (!bezKlika) return;
        e.preventDefault();
        e.stopPropagation();
        bezKlika = false;
      }, true);

      osvjezi();
    }

    // ── POJAVA ───────────────────────────────────────────────────────────
    function pokreniPojavu(korijen, broj) {
      korijen.classList.add('mx-pojava');
      setTimeout(function () { korijen.classList.remove('mx-pojava'); }, 80 + broj * 110 + 900);
    }

    // ── NAMIG ────────────────────────────────────────────────────────────
    // Kad Marti pošalje više proizvoda, kartice se nakon pojave jednom kratko
    // pomaknu ulijevo i vrate (CSS mx-namig), pa kupac vidi da desno ima još
    // kartica. Namig čeka da vrtuljak bude na zaslonu; nema ga ako je kupac
    // na ovoj stranici već listao neki vrtuljak (ili upravo lista ovaj) ni
    // kad je na uređaju uključeno "Smanji pokrete".
    function namigni(korijen, odgoda) {
      const traka = korijen.querySelector('.mx-traka');
      if (!traka || MIRNO.matches || kupacListao || typeof IntersectionObserver === 'undefined') return;
      setTimeout(function () {
        if (kupacListao) return;
        const promatrac = new IntersectionObserver(function (zapisi) {
          if (!zapisi.some(function (z) { return z.isIntersecting; })) return;
          promatrac.disconnect();
          setTimeout(function () {
            if (kupacListao || !traka.isConnected) return;
            traka.classList.add('mx-namig');
            setTimeout(function () { traka.classList.remove('mx-namig'); }, 1600);
          }, 250);
        }, { threshold: 0.4 });
        promatrac.observe(traka);
      }, odgoda);
    }

    // ── PRIKAZI ──────────────────────────────────────────────────────────
    // Voiceflow zna ponovno pozvati render za istu poruku (npr. kad stigne
    // sljedeća poruka). Tada postojeće kartice ostaju netaknute; da se grade
    // iznova, slike bi na trenutak nestale.
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

    function noviKorijen(klasa, potpis) {
      const korijen = el('div', 'mx ' + klasa);
      korijen.setAttribute('role', 'group');
      korijen.setAttribute('aria-label', P.oznakaRegije);
      korijen.setAttribute('data-mx-potpis', potpis);
      return korijen;
    }

    function popis(trace, element) {
      const kartice = uzmiKartice(trace);
      if (!kartice.length) return;
      const potpis = potpisPrikaza(trace.type, kartice);
      if (postojeciKorijen(element, potpis)) return BEZ_CISCENJA;
      pripremi(element);
      let korijen;
      if (kartice.length === 1) {
        korijen = noviKorijen('mx-istaknuta', potpis);
        korijen.appendChild(izgradiKarticu(kartice[0], 0, true));
      } else {
        korijen = izgradiVrtuljak(kartice, potpis);
      }
      element.appendChild(korijen);
      if (trebaPojava(trace.type, kartice)) {
        pokreniPojavu(korijen, kartice.length);
        // namig tek kad pojava završi (pojava traje 80 + n × 110 + 900 ms)
        if (kartice.length > 1) namigni(korijen, 80 + kartice.length * 110 + 1000);
      }
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
