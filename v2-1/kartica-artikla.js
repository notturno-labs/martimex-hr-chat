// Ukratko: Kartice proizvoda koje Marti preporuči
(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — kartice preporučenih proizvoda za Marti (v34)
  //
  //  ProductCardExtension → trace "ext_product_card"
  //  Kartice idu jedna ispod druge. Izgled je kao na slici prijedloga
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
  //   features tri kratke osobine artikla koje napiše Marti, npr.
  //            ["Svjež i čist", "Moderna elegancija", "Ured, večer i prilike"]
  //            (ili polje "osobine"; stavka smije biti i { text, icon }). Svaka
  //            dobije ikonu prema svojim riječima (svjež → list, elegancija →
  //            dijamant, ured → aktovka...; vidi RIJECI niže). Bez osobina
  //            kartica nema taj red (npr. kartice iz tražilice).
  //  Neobavezna polja (kao i dosad):
  //   oldPrice → artikl je na akciji: nova cijena, pokraj nje precrtana stara
  //              i oznaka s postotkom popusta (−30 %)
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
  //   │   Svjež  │ Moderna │  Ured,  │
  //   │  i čist  │elegancija i prilike
  //   │ (     Pogledaj proizvod    ) │   crni gumb zaobljen kao kartica, jedini link
  //   └──────────────────────────────┘
  //  Na proizvod vodi samo gumb, i to u istom prozoru (bez novih kartica).
  //
  //  Mjere (CSS px, kartica široka 336): ploča je od ruba kartice odmaknuta
  //  6 px, široka 324 i visoka 232 (u šire kartice raste u istom omjeru);
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
  //   - bijela pozadina fotografije pretvara se u sivu boju ploče (canvas);
  //     kad to nije moguće (slika s druge domene), stapa se CSS-om. Tamna ili
  //     šarena fotografija ispuni cijelu ploču
  //   - kad Marti pošalje preporuke, kartice blago izrone jedna za drugom.
  //     Samo prvi put; kad se povijest razgovora ponovno učita, odmah su tu.
  //     Isključeno ako je na uređaju uključeno "Smanji pokrete"
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
      crta:    '#ececec'  // tanke okomite crte između osobina
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
    // široj kartici ploča raste u istom omjeru.
    const PLOCA = [324, 232];
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

      /* ── popis (kartice jedna ispod druge) ── */
      .mx-lista,
      .mx-istaknuta {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 6px 4px 14px;        /* mjesto za sjenu kartice */
      }

      /* ── kartica ── */
      .mx-kartica {
        position: relative;
        display: flex;
        flex-direction: column;
        flex: none;
        width: 100%;
        max-width: 380px;
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
        min-width: 0;
        padding: 18.7px 18px 0;
      }
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
        background: var(--mx-tinta);
        color: #ffffff;
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

      /* tri osobine: jednaki stupci, između njih tanka okomita crta */
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
        margin-top: 24px;
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
      @keyframes mx-pojava {
        from { opacity: 0; transform: translateY(14px); }
      }
      @keyframes mx-samo-prozirnost {
        from { opacity: 0; }
      }

      @media (forced-colors: active) {
        .mx-kartica { border: 1px solid CanvasText; }
        .mx-ikona { stroke: CanvasText; }
        .mx-gumb { border: 1px solid ButtonText; }
      }

      @media (prefers-reduced-motion: reduce) {
        .mx-pojava .mx-kartica { animation: mx-samo-prozirnost .35s linear backwards; animation-delay: 0s; }
        .mx-slika img, .mx-gumb { transition: none; }
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
    // s osobinama odvojenima znakom | ili ; → [{ tekst, ikona }], najviše tri
    function uzmiOsobine(v) {
      if (typeof v === 'string') v = v.split(/\s*[|;\n]\s*/);
      if (!Array.isArray(v)) return [];
      const van = [];
      v.forEach(function (o) {
        if (van.length >= P.najviseOsobina) return;
        let t = '', ikona = '';
        if (o && typeof o === 'object') {
          t = prvo(o.text, o.tekst, o.naziv, o.label, o.title);
          ikona = prvo(o.icon, o.ikona) || '';
        } else {
          t = o;
        }
        t = tekst(t).replace(/\*\*|__|`/g, '').replace(/^[\s\-–•*·]+/, '').replace(/[\s.]+$/, '');
        if (!t) return;
        van.push({ tekst: skrati(t, P.znakovaOsobine), ikona: tekst(ikona) });
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
      const lista = el('ul', 'mx-osobine');
      lista.setAttribute('role', 'list');
      lista.style.setProperty('--mx-stupaca', String(k.osobine.length));
      k.osobine.forEach(function (o, i) {
        const stavka = el('li', 'mx-osobina');
        stavka.innerHTML = svg(IKONE[ikonaOsobine(o.tekst, o.ikona, i)], 'mx-ikona');
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

    // ── POJAVA ───────────────────────────────────────────────────────────
    function pokreniPojavu(korijen, broj) {
      korijen.classList.add('mx-pojava');
      setTimeout(function () { korijen.classList.remove('mx-pojava'); }, 80 + broj * 110 + 900);
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
      // jedan proizvod: ista kartica (klasa mx-istaknuta ostaje radi starijih stilova)
      const korijen = noviKorijen(kartice.length === 1 ? 'mx-istaknuta' : 'mx-lista', potpis);
      kartice.forEach(function (k, i) { korijen.appendChild(izgradiKarticu(k, i, kartice.length === 1)); });
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
