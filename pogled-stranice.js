// Ukratko: Marti „ima oči”: kad joj zatreba, vidi stranicu na kojoj je kupac (artikl, košarica, kod, poruke, obrasci…)
(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — Marti vidi stranicu na kojoj je kupac (v1)
  //
  //  Marti "ima oči": kad joj zatreba, pogleda stranicu na kojoj je kupac
  //  — kao prodavačica koja pogleda preko ramena — i pomogne mu oko onoga
  //  što stvarno vidi. Radi na svakoj stranici martimex.hr, npr.:
  //   - kupac na stranici proizvoda pita "Je li ovaj dobar za ljeto?" ili
  //     "Koju veličinu da uzmem?": Marti vidi o kojem je artiklu riječ,
  //     koja je veličina ili nijansa odabrana, cijene, akciju, dostupnost
  //   - kupac na popisu proizvoda pita "Koji je od ovih najbolji?": Marti
  //     vidi koji su proizvodi na ekranu
  //   - kupac u košarici napiše "Ne prihvaća mi kod za popust": Marti vidi
  //     košaricu, upisani kod i poruku uz polje ("Crystal Noir u Vašoj
  //     košarici već je snižen s 79,31 € na 56,00 €, a popusti se ne
  //     zbrajaju…")
  //   - kupac na blagajni ne može dalje: Marti vidi koje je polje prazno
  //     ili neispravno i koji je gumb onemogućen
  //
  //  Što Marti vidi:
  //   - koja je stranica (košarica, blagajna, proizvod, pretraga…), naslov,
  //     putanju (breadcrumbs) i adresu stranice (bez parametara iz adrese)
  //   - na stranici proizvoda: artikl s istim podacima kao gumb "Pitaj
  //     Marti" (pitaj-marti.js): marka, naziv, vrsta, odabrana veličina ili
  //     nijansa, cijene svih varijanti, akcija, najniža cijena u 30 dana,
  //     dostupnost, šifra i (skraćeni) opis
  //   - kartice proizvoda (kategorija, marka, pretraga, preporuke): naziv,
  //     cijena, oznaka popusta; one koje su kupcu na ekranu prve
  //   - poruke koje stranica pokazuje (greške, upozorenja, obavijesti) — i
  //     one koje su se pokazale pa nestale u zadnjih 15 minuta (npr. kratka
  //     obavijest "Kupon ne postoji" koja se sama sakrije)
  //   - košaricu: artikle, količine, cijene (i koji su već sniženi), kodove
  //     koji su primijenjeni, popust, dostavu i ukupni iznos. Na martimex.hr
  //     (WooCommerce) podaci se uzimaju iz same trgovine (Store API, kao što
  //     ih vidi kupac), a kad to ne ide, sa stranice
  //   - kod upisan u polje za kod i poruku uz to polje
  //   - polja obrasca: koja su obavezna, ispunjena ili označena kao
  //     neispravna (i poruku uz njih), odabrani način dostave i plaćanja
  //   - gumbe koji su onemogućeni (npr. "Nastavi na plaćanje")
  //   - tekst stranice: ono što je kupcu upravo na ekranu i (skraćeno) ostatak
  //   - uređaj: mobitel ili računalo, veličina ekrana, preglednik
  //   - tehničke greške na stranici (samo za dijagnozu; Marti ih kupcu ne
  //     prepričava)
  //
  //  Što Marti NE vidi:
  //   - lozinke, podatke o plaćanju (polja za karticu su ionako u okviru
  //     banke, do kojeg stranica ne može), skrivena polja, kolačiće
  //   - osobne podatke: od polja s imenom, adresom, e-mailom, telefonom…
  //     šalje se samo je li ispunjeno, nikad vrijednost; e-mail adrese,
  //     brojevi telefona, IBAN-i, OIB-i i brojevi kartica u tekstu stranice
  //     zamijene se oznakom ([e-mail], [telefon]…); adrese (<address>) i
  //     podaci kupca na potvrdi narudžbe se preskaču; na stranicama
  //     korisničkog računa i potvrde narudžbe šalju se samo naslovi
  //   - kod poklon bona: dugi kodovi (i oni koji izgledaju kao poklon bon)
  //     šalju se skriveni (prva i zadnja dva znaka), jer poklon bon vrijedi
  //     kao novac; kratki promo kodovi (POPUST30) šalju se cijeli, da Marti
  //     uoči tipfeler (razmak, slovo O umjesto nule)
  //
  //  Snimka se uzme tek kad je Marti zatraži — nikad sama od sebe — i ne
  //  sprema se nigdje u pregledniku. Modul samo pamti poruke koje je
  //  stranica pokazala (u pregledniku, 15 minuta), da ih Marti vidi i kad
  //  su već nestale.
  //
  //  Kako radi (Voiceflow):
  //   1. Marti (agent) pozove alat "Pogledaj stranicu kupca" (Voiceflow
  //      funkcija). Funkcija pošalje u chat trace 'ext_pogled_stranice'
  //      (payload: { zahtjev, vrijeme }), a Marti napiše npr. "Samo
  //      trenutak, pogledat ću stranicu na kojoj se nalazite."
  //   2. Ovaj modul ga primi (ekstenzija chata). Prema postavci
  //      pitajDopustenje:
  //       - 'jednom' (zadano): prvi put se u chatu pokaže kartica "Mogu li
  //         pogledati stranicu na kojoj se nalazite?" s gumbima "Pokaži
  //         stranicu" i "Ne, hvala"; kad kupac dopusti, Marti do kraja tog
  //         razgovora gleda sama, a u chatu piše "Marti je pogledala
  //         stranicu (…)"
  //       - true: kartica s pitanjem svaki put
  //       - false: Marti uvijek gleda sama (u chatu piše da je pogledala)
  //   3. Modul pošalje Voiceflowu događaj "stranica_kupca"
  //      (payload.event.stranica_kupca = { zahtjev, vrijeme, vrsta, tekst,
  //      podaci… }; ako kupac odbije: { odbijeno: true }). Marti dobije
  //      poruku „event triggered: stranica_kupca”, pozove workflow
  //      "Stranica kupca" koji tekst snimke spremi u varijablu sk_kontekst
  //      (Global Prompt), i odgovori kupcu na temelju onoga što vidi.
  //   Voiceflow dio je opisan u pogled-stranice-voiceflow.md.
  //
  //  "Pitaj Marti" i ovaj modul se nadopunjuju: "Pitaj Marti" je gumb koji
  //  kupac sam pritisne na stranici proizvoda (Marti dobije artikl i pita
  //  kako može pomoći), a ovdje Marti sama pogleda bilo koju stranicu kad
  //  joj to treba za odgovor.
  //
  //  Provjera bez Voiceflowa (u konzoli preglednika, na bilo kojoj stranici
  //  na kojoj je modul učitan):
  //    await MartimexPogledStranice.tekst()   → tekst koji bi Marti dobila
  //    await MartimexPogledStranice.snimi()   → svi podaci snimke
  //  ?pogledstranice=debug u adresi stranice → zapisi modula u konzoli.
  //  Na proba.html isto pokazuje gumb "Što Marti vidi?" u probnoj traci.
  //
  //  Tehnički: modul je ekstenzija chata (type 'response', trace
  //  'ext_pogled_stranice') u window.MartimexExtensions, kao kartica
  //  artikla. Voiceflow zna ponovno iscrtati staru poruku (npr. kad se
  //  stranica učita iznova, chat iscrta zapamćeni razgovor): stanje svakog
  //  zahtjeva pamti se u pregledniku, pa se stranica nikad ne pošalje
  //  dvaput, a stari zahtjev se ne pošalje sam od sebe. Ako modul zakaže,
  //  chat radi kao i prije, samo Marti ne vidi stranicu.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxPogledStranice) return;   // zaštita ako se modul učita dvaput
  window.__mxPogledStranice = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_PS_POSTAVKE = {
    // 'jednom': kupac odobri prvi put (gumb "Pokaži stranicu" u chatu); poslije
    //          toga, do kraja razgovora (dok je kartica preglednika otvorena),
    //          Marti pogleda sama kad joj zatreba, a u chatu uvijek piše
    //          "Marti je pogledala stranicu (…)"
    // true:    kupac odobri svaki put
    // false:   Marti uvijek pogleda sama (u chatu piše da je pogledala)
    pitajDopustenje: 'jednom',

    trace: 'ext_pogled_stranice',  // trace koji šalje Voiceflow funkcija "Pogledaj stranicu kupca"
    dogadaj: 'stranica_kupca',     // događaj koji modul šalje Voiceflowu (isto ime kao u Voiceflowu)

    tekstovi: {
      pitanje: 'Mogu li pogledati stranicu na kojoj se nalazite{stranica}? Tako ću lakše pronaći u čemu je problem.',
      sitno: 'Vidjet ću artikle, cijene, upisani kod i poruke na stranici — ne i Vaše osobne podatke ni podatke o plaćanju.',
      sitnoJednom: 'Vidjet ću artikle, cijene, upisani kod i poruke na stranici — ne i Vaše osobne podatke ni podatke o plaćanju. Ako dopustite, do kraja razgovora mogu pogledati stranicu kad zatreba; u chatu ćete uvijek vidjeti kad sam pogledala.',
      dopusti: 'Pokaži stranicu',
      odbij: 'Ne, hvala',
      gleda: 'Marti gleda stranicu…',
      pogledala: 'Marti je pogledala stranicu{stranica}',
      odbijeno: 'Stranica nije podijeljena.',
      isteklo: 'Ovaj zahtjev više ne vrijedi. Ako i dalje trebate pomoć, napišite Marti poruku.',
      greska: 'Stranicu nije bilo moguće poslati. Pokušajte ponovno ili opišite Marti što vidite.'
    },

    pamtiObavijesti: 15 * 60 * 1000,  // ms: koliko se pamte poruke koje je stranica pokazala (i kad nestanu)
    maxObavijesti: 12,
    maxArtikala: 30,
    maxPolja: 40,
    maxTekstEkran: 1500,              // znakova teksta s dijela stranice koji je kupcu na ekranu
    maxTekstOstalo: 2500,             // znakova ostatka stranice
    maxGresaka: 5,                    // tehničkih grešaka na stranici
    koristiStoreApi: true,            // WooCommerce Store API (…/wp-json/wc/store/v1/cart) za točne podatke košarice
    cekajStoreApi: 2500,              // ms
    zahtjevVrijedi: 25 * 60 * 1000,   // ms: nakon toga se zahtjev više ne može potvrditi (Voiceflow razgovor završi nakon 30 min)
    svjezZahtjev: 2 * 60 * 1000,      // ms: stariji zahtjev koji modul vidi prvi put (stara poruka) ne šalje se sam
    cekajMir: 8000,                   // ms: najdulje čekanje da chat dovrši Martin odgovor prije slanja

    // dijelovi stranice koji se nikad ne čitaju (osobni podaci)
    privatno: [
      'address',
      '.woocommerce-customer-details',
      '.woocommerce-column--billing-address',
      '.woocommerce-column--shipping-address',
      '.shipping-address', '.shipping_address',
      '.woocommerce-MyAccount-navigation',
      '[data-mx-privatno]'
    ]
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const P = MX_PS_POSTAVKE;
  const T = P.tekstovi;
  const VERZIJA = 1;
  const DEBUG = /[?&]pogledstranice=debug\b/.test(location.search);

  function zapis() {
    if (!DEBUG) return;
    try { console.log.apply(console, ['[Pogled na stranicu]'].concat([].slice.call(arguments))); } catch (e) { /* nije bitno */ }
  }

  // ── 1. POMOĆNE FUNKCIJE ──────────────────────────────────────────────
  // Tekst u jednom retku: bez kontrolnih znakova i višak razmaka; vitičaste
  // zagrade postanu obične (Voiceflow {ime} u tekstu čita kao varijablu)
  function cisti(v) {
    if (v === undefined || v === null) return '';
    return String(v)
      .replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ')
      .replace(/\{/g, '(').replace(/\}/g, ')')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // predug tekst se skrati na cijelu riječ, s tri točke
  function skrati(v, max) {
    let s = cisti(v);
    if (!max || s.length <= max) return s;
    s = s.slice(0, max);
    const r = s.lastIndexOf(' ');
    if (r > max * 0.7) s = s.slice(0, r);
    return s.replace(/[\s,;:–-]+$/, '') + '…';
  }

  // HTML entiteti → znakovi ("Dolce &amp; Gabbana" → "Dolce & Gabbana"), bez HTML oznaka
  function dekodiraj(v) {
    let s = v === undefined || v === null ? '' : String(v);
    if (s.indexOf('<') !== -1) s = s.replace(/<[^>]*>/g, ' ');
    if (s.indexOf('&') !== -1) {
      try { const ta = document.createElement('textarea'); ta.innerHTML = s.replace(/</g, '&lt;'); s = ta.value; } catch (e) { /* ostaje kako je */ }
    }
    return cisti(s);
  }

  // "1.299,50 €" → 1299.5; "88.5" → 88.5; nečitljivo → null
  function uBroj(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (v === undefined || v === null) return null;
    const t = String(v).trim();
    if (/^\d+(?:\.\d+)?$/.test(t)) { const n = parseFloat(t); return isFinite(n) ? Math.round(n * 100) / 100 : null; }
    let s = t.replace(/[^\d.,]/g, '');
    if (!s) return null;
    const d = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
    if (d !== -1 && s.length - d - 1 <= 2) s = s.slice(0, d).replace(/[.,]/g, '') + '.' + s.slice(d + 1);
    else s = s.replace(/[.,]/g, '');
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  // 1299.5 → "1.299,50 €"
  function eur(n) {
    if (n === null || n === undefined || !isFinite(n)) return '';
    const neg = n < 0;
    const dijelovi = Math.abs(n).toFixed(2).split('.');
    return (neg ? '−' : '') + dijelovi[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dijelovi[1] + ' €';
  }

  // sve cijene u tekstu: "79,31 € 56,00 €" → [79.31, 56]
  function cijeneUTekstu(s) {
    const out = [];
    const re = /(\d{1,3}(?:[.\s\u00a0]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s?(?:€|eur\b|kn\b)/gi;
    let m;
    while ((m = re.exec(String(s || '')))) {
      const n = uBroj(m[1].replace(/[\s\u00a0]/g, '.'));
      if (n !== null) out.push(n);
    }
    return out;
  }

  // Osobni podaci u tekstu stranice → oznaka
  const OSOBNO = [
    [/[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi, '[e-mail]'],
    [/\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}(?: ?[A-Z0-9]{1,3})?\b/g, '[IBAN]'],
    [/\b\d(?:[ -]?\d){12,18}\b/g, '[broj]'],                                     // kartice i dugi brojevi
    [/(?:\+|\b00)\d{1,3}[\s\/.-]?\(?\d{1,3}\)?(?:[\s\/.-]?\d{2,4}){2,4}\b/g, '[telefon]'],
    [/\b0\d{1,2}[\s\/.-]?\d{3,4}[\s\/.-]?\d{3,4}\b/g, '[telefon]'],               // 091 234 5678, 099/1693-111
    [/\b\d{11}\b/g, '[OIB]']
  ];
  function bezOsobnog(s) {
    s = String(s || '');
    for (let i = 0; i < OSOBNO.length; i++) s = s.replace(OSOBNO[i][0], OSOBNO[i][1]);
    return s;
  }

  // Vidi li ga kupac (nije skriven, proziran ni bez veličine)
  function vidljiv(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
    let ok;
    if (typeof el.checkVisibility === 'function') {
      try { ok = el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true }); } catch (e) { ok = undefined; }
    }
    if (ok === undefined) {
      try {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
        ok = el.getClientRects().length > 0 || s.display === 'contents';
      } catch (e) { return false; }
    }
    // bočni prozor izvan ekrana (npr. zatvorena košarica, right: -200vw) kupac ne vidi
    if (ok) return !izvanEkranaVodoravno(el);
    // display: contents nema okvir, ali njegov sadržaj se vidi
    try { return getComputedStyle(el).display === 'contents'; } catch (e) { return false; }
  }

  function izvanEkranaVodoravno(el) {
    try {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return false;
      return r.right <= 0 || r.left >= (window.innerWidth || 0);
    } catch (e) { return false; }
  }

  // Je li (dio) elementa kupcu upravo na ekranu
  function naEkranu(el) {
    try {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return false;
      return r.bottom > 0 && r.right > 0 && r.top < (window.innerHeight || 0) && r.left < (window.innerWidth || 0);
    } catch (e) { return false; }
  }

  function tekstEl(el) {
    if (!el) return '';
    let t = '';
    try { t = vidljiv(el) && typeof el.innerText === 'string' ? el.innerText : el.textContent; } catch (e) { t = el.textContent; }
    return cisti(t);
  }

  function prvi(korijen, selektori) {
    for (let i = 0; i < selektori.length; i++) {
      let el = null;
      try { el = korijen.querySelector(selektori[i]); } catch (e) { el = null; }
      if (el) return el;
    }
    return null;
  }

  function sTimeoutom(obecanje, ms) {
    return new Promise(function (gotovo) {
      let kraj = false;
      const t = setTimeout(function () { if (!kraj) { kraj = true; gotovo(null); } }, ms);
      Promise.resolve(obecanje).then(function (v) {
        if (kraj) return;
        kraj = true; clearTimeout(t); gotovo(v);
      }, function () {
        if (kraj) return;
        kraj = true; clearTimeout(t); gotovo(null);
      });
    });
  }

  function lokalnoVrijeme(d) {
    d = d || new Date();
    const dvije = function (n) { return (n < 10 ? '0' : '') + n; };
    return dvije(d.getDate()) + '. ' + dvije(d.getMonth() + 1) + '. ' + d.getFullYear() + '. ' + dvije(d.getHours()) + ':' + dvije(d.getMinutes());
  }

  // Spremište u pregledniku (localStorage → sessionStorage → memorija)
  const memorija = {};
  function citaj(kljuc, zadano) {
    const sp = [window.localStorage, window.sessionStorage];
    let radi = false;
    for (let i = 0; i < sp.length; i++) {
      try {
        if (!sp[i]) continue;
        const v = sp[i].getItem(kljuc);
        radi = true;
        if (v) return JSON.parse(v);
      } catch (e) { /* sljedeće */ }
    }
    // memorija samo kad preglednik ne da spremište (npr. zabranjeni kolačići)
    if (radi) return zadano;
    return memorija[kljuc] !== undefined ? memorija[kljuc] : zadano;
  }
  function pisi(kljuc, vrijednost, samoSesija) {
    memorija[kljuc] = vrijednost;
    const sp = samoSesija ? [window.sessionStorage] : [window.localStorage, window.sessionStorage];
    for (let i = 0; i < sp.length; i++) {
      try { if (sp[i]) { sp[i].setItem(kljuc, JSON.stringify(vrijednost)); return; } } catch (e) { /* sljedeće */ }
    }
  }

  // ── 2. DIJELOVI STRANICE KOJI SE NE ČITAJU ───────────────────────────
  const NASI = '#voiceflow-chat, .mx-pm, .mx-ps, [class*="mxp-"]';   // chat, Martini gumbi, probna traka na proba.html
  const ZAGLAVLJE_PODNOZJE = '.site-header, .site-footer, #colophon, body > header, body > footer, .announcements-bar';
  const KOLACICI = '[id*="cookie" i], [class*="cookie" i], [id^="cmplz"], [class*="cmplz"], #CybotCookiebotDialog, [class*="cky-"]';
  const PRIVATNO = P.privatno.join(', ');
  const BEZ_TEKSTA = 'script, style, noscript, template, svg, iframe, canvas, video, audio, object, embed, select, option, input, textarea, button, img, picture, .screen-reader-text, .sr-only, .visually-hidden';
  const PRESKOCI_TEKST = [NASI, ZAGLAVLJE_PODNOZJE, KOLACICI, PRIVATNO, BEZ_TEKSTA].join(', ');
  const PRESKOCI_POLJA = [NASI, ZAGLAVLJE_PODNOZJE, KOLACICI].join(', ');

  // ── 3. VRSTA STRANICE ────────────────────────────────────────────────
  const STRANICE = {
    kosarica:   { naziv: 'Košarica', en: 'cart page' },
    blagajna:   { naziv: 'Blagajna', en: 'checkout page (delivery and payment)' },
    narudzba:   { naziv: 'Potvrda narudžbe', en: 'order confirmation page' },
    racun:      { naziv: 'Korisnički račun', en: 'customer account page' },
    proizvod:   { naziv: 'Stranica proizvoda', en: 'product page' },
    pretraga:   { naziv: 'Rezultati pretrage', en: 'search results' },
    kategorija: { naziv: 'Popis proizvoda', en: 'product listing (category or brand)' },
    poklonBon:  { naziv: 'Poklon bon', en: 'gift card page' },
    kontakt:    { naziv: 'Kontakt', en: 'contact page' },
    pocetna:    { naziv: 'Početna stranica', en: 'home page' },
    ostalo:     { naziv: '', en: 'other page' }
  };

  function vrstaStranice() {
    const b = document.body ? document.body.classList : null;
    const ima = function (k) { return !!b && b.contains(k); };
    const put = location.pathname.toLowerCase();
    if (ima('woocommerce-order-received') || /\/(narudzba-zaprimljena|order-received)\//.test(put)) return 'narudzba';
    if (ima('woocommerce-cart') || /\/(kosarica|cart)\/?$/.test(put)) return 'kosarica';
    if (ima('woocommerce-checkout') || /\/(blagajna|checkout|placanje)\/?/.test(put)) return 'blagajna';
    if (ima('woocommerce-account') || /\/(moj-racun|my-account|korisnicki-racun)\/?/.test(put)) return 'racun';
    if (ima('single-product') || document.querySelector('section.product[x-data], section.product .product__title-wrap')) return 'proizvod';
    if (ima('search-results') || /[?&]s=/.test(location.search)) return 'pretraga';
    if (ima('tax-product_cat') || ima('post-type-archive-product') || ima('tax-pwb-brand') || ima('tax-product_brand') ||
        /\/(kategorija|brand)\//.test(put)) return 'kategorija';
    if (document.querySelector('.gift-card-page')) return 'poklonBon';
    if (ima('page-template-page-contact') || ima('kontakt') || /\/kontakt\/?$/.test(put)) return 'kontakt';
    if (ima('home') || put === '/') return 'pocetna';
    return 'ostalo';
  }

  // Košarica na martimex.hr je bočni prozor (body.cart-open) preko stranice
  function kosaricaOtvorena() {
    return document.documentElement.classList.contains('cart-open') || !!(document.body && document.body.classList.contains('cart-open'));
  }
  // naziv stranice za kupca (na kartici u chatu): otvorena košarica je "Košarica"
  function nazivZaKupca() {
    return kosaricaOtvorena() ? STRANICE.kosarica.naziv : STRANICE[vrstaStranice()].naziv;
  }

  function podaciStranice() {
    const vrsta = vrstaStranice();
    let adresa = location.origin + location.pathname;
    const q = new URLSearchParams(location.search);
    if (q.get('s')) adresa += '?s=' + encodeURIComponent(skrati(q.get('s'), 60));
    const h1 = (function () {
      const svi = document.querySelectorAll('h1');
      for (let i = 0; i < svi.length; i++) {
        if (svi[i].closest(PRESKOCI_TEKST) || !vidljiv(svi[i])) continue;
        const t = skrati(bezOsobnog(tekstEl(svi[i])), 120);
        if (t) return t;
      }
      return '';
    })();
    const putanja = [].map.call(document.querySelectorAll('.breadcrumbs__item, .woocommerce-breadcrumb a, .woocommerce-breadcrumb span'), tekstEl)
      .filter(function (t, i, svi) { return t && !/^po[cč]etna$/i.test(t) && svi.indexOf(t) === i; })
      .slice(0, 6).join(' › ');
    return {
      vrsta: vrsta,
      naziv: STRANICE[vrsta].naziv,
      nazivZaKupca: nazivZaKupca(),
      opisEn: STRANICE[vrsta].en,
      naslovProzora: skrati(bezOsobnog(document.title), 120),
      naslov: h1,
      adresa: adresa,
      putanja: putanja,
      kosaricaOtvorena: kosaricaOtvorena()
    };
  }

  function uredjaj() {
    const ua = navigator.userAgent || '';
    const mobitel = !!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches) || /Mobi|Android|iPhone|iPad/i.test(ua);
    let preglednik = '';
    const m = ua.match(/(Edg|OPR|SamsungBrowser|CriOS|FxiOS|Firefox|Chrome|Version)\/(\d+)/);
    if (m) preglednik = ({ Edg: 'Edge', OPR: 'Opera', SamsungBrowser: 'Samsung Internet', CriOS: 'Chrome', FxiOS: 'Firefox', Version: 'Safari' }[m[1]] || m[1]) + ' ' + m[2];
    const sustav = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' :
      /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
    return {
      mobitel: mobitel,
      ekran: (window.innerWidth || 0) + '×' + (window.innerHeight || 0),
      preglednik: preglednik,
      sustav: sustav,
      jezik: navigator.language || ''
    };
  }

  // ── 4. PORUKE NA STRANICI (i one koje su nestale) ─────────────────────
  // Greške, upozorenja i obavijesti na martimex.hr (WooCommerce i tema) te
  // općenite oznake poruka. Marketinški natpisi (.notice-banner) nisu poruke.
  const OBAVIJESTI = [
    '.woocommerce-error', '.woocommerce-message', '.woocommerce-info', '.woocommerce-notice',
    '.notice', '.toast', '.coupon-error-notice', '.coupon-field__error-message',
    '.cart__single-item-error', '.product__add-to-cart-error', '.product__add-to-cart-notice',
    '.checkout-page__locker-error', '.checkout-inline-error-message', '.invalid-feedback',
    '.wpcf7-response-output', '.wpcf7-not-valid-tip', '[role="alert"]'
  ].join(', ');
  const KLJUC_OBAVIJESTI = 'mx-ps-obavijesti';
  let zapamcene = [];   // { vrsta, tekst, stranica, prvi, zadnji }

  function vrstaObavijesti(el) {
    const k = typeof el.className === 'string' ? el.className : '';
    if (/error|greska|invalid|not-valid|danger/i.test(k)) return 'greska';
    if (/warning|upozor/i.test(k)) return 'upozorenje';
    if (/success|uspjeh|woocommerce-message|add-to-cart-notice/i.test(k)) return 'uspjeh';
    if (/info|notice|toast|message|response-output/i.test(k)) return 'info';
    return el.getAttribute('role') === 'alert' ? 'upozorenje' : 'info';
  }

  function ucitajZapamcene() {
    const l = citaj(KLJUC_OBAVIJESTI, []);
    zapamcene = Array.isArray(l) ? l.filter(function (z) { return z && z.tekst && Date.now() - z.zadnji <= P.pamtiObavijesti; }) : [];
  }
  function spremiZapamcene() { pisi(KLJUC_OBAVIJESTI, zapamcene, true); }

  // Pregleda poruke koje se sada vide i zapamti ih; vraća one koje se vide
  function skenirajObavijesti() {
    const sad = Date.now();
    const stranica = location.pathname;
    const vidljive = [];
    let els;
    try { els = document.querySelectorAll(OBAVIJESTI); } catch (e) { return vidljive; }
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (el.closest(NASI) || el.closest(PRIVATNO)) continue;
      // poruka unutar druge poruke (npr. stavka popisa grešaka): broji se vanjska
      if (el.parentElement && el.parentElement.closest(OBAVIJESTI)) continue;
      if (!vidljiv(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 3 || r.height < 3) continue;
      const tekst = skrati(bezOsobnog(tekstEl(el).replace(/\s*\n\s*/g, ' · ')), 300);
      if (!tekst || tekst.length < 2) continue;
      const vrsta = vrstaObavijesti(el);
      vidljive.push({ vrsta: vrsta, tekst: tekst });
      let z = null;
      for (let j = 0; j < zapamcene.length; j++) {
        if (zapamcene[j].tekst === tekst && zapamcene[j].stranica === stranica) { z = zapamcene[j]; break; }
      }
      if (z) z.zadnji = sad;
      else zapamcene.push({ vrsta: vrsta, tekst: tekst, stranica: stranica, prvi: sad, zadnji: sad });
    }
    zapamcene = zapamcene.filter(function (z) { return sad - z.zadnji <= P.pamtiObavijesti; }).slice(-30);
    spremiZapamcene();
    return vidljive;
  }

  let skenZakazan = 0;
  function zakaziSken() {
    if (skenZakazan) return;
    skenZakazan = setTimeout(function () {
      skenZakazan = 0;
      try { skenirajObavijesti(); } catch (e) { /* nije bitno */ }
    }, 400);
  }

  function pratiObavijesti() {
    ucitajZapamcene();
    zakaziSken();
    try {
      new MutationObserver(zakaziSken).observe(document.documentElement, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
      });
    } catch (e) { /* bez praćenja: vide se samo poruke u trenutku snimke */ }
  }

  function obavijestiZaSnimku() {
    const sad = Date.now();
    const vidljive = skenirajObavijesti();
    const out = vidljive.map(function (v) { return { vrsta: v.vrsta, tekst: v.tekst, vidljiva: true }; });
    // nestale (pa i one s prethodnih stranica), od najnovije
    zapamcene.slice().sort(function (a, b) { return b.zadnji - a.zadnji; }).forEach(function (z) {
      const vec = out.some(function (o) { return o.tekst === z.tekst; });
      if (vec) return;
      out.push({
        vrsta: z.vrsta,
        tekst: z.tekst,
        vidljiva: false,
        prijeMin: Math.max(0, Math.round((sad - z.zadnji) / 60000)),
        drugaStranica: z.stranica !== location.pathname ? z.stranica : ''
      });
    });
    return out.slice(0, P.maxObavijesti);
  }

  // ── 5. TEHNIČKE GREŠKE NA STRANICI ───────────────────────────────────
  // Samo greške skripti same trgovine (iste domene); tuđe skripte (analitika,
  // oglasi) se preskaču. Ništa se ne mijenja ni ne presreće — samo se sluša.
  let greske = [];
  function dodajGresku(poruka, gdje) {
    poruka = skrati(bezOsobnog(poruka), 160);
    if (!poruka) return;
    const sad = Date.now();
    for (let i = 0; i < greske.length; i++) {
      if (greske[i].poruka === poruka) { greske[i].zadnja = sad; greske[i].puta++; return; }
    }
    greske.push({ poruka: poruka, gdje: skrati(gdje, 80), zadnja: sad, puta: 1 });
    if (greske.length > 20) greske = greske.slice(-20);
  }
  function pratiGreske() {
    window.addEventListener('error', function (e) {
      try {
        if (!e || (e.target && e.target !== window)) return;          // slika ili skripta koja se nije učitala
        const izvor = String(e.filename || '');
        if (!e.message || /^Script error\.?$/i.test(e.message)) return;
        if (izvor && izvor.indexOf(location.origin) !== 0) return;
        dodajGresku(e.message, izvor.replace(location.origin, '') + (e.lineno ? ':' + e.lineno : ''));
      } catch (x) { /* nije bitno */ }
    }, true);
    window.addEventListener('unhandledrejection', function (e) {
      try {
        const r = e && e.reason;
        const stog = r && r.stack ? String(r.stack) : '';
        if (stog && stog.indexOf(location.origin) === -1 && /https?:\/\//.test(stog)) return;
        dodajGresku(r && r.message ? r.message : String(r), 'neobrađeno obećanje');
      } catch (x) { /* nije bitno */ }
    });
  }
  function greskeZaSnimku() {
    const sad = Date.now();
    return greske.filter(function (g) { return sad - g.zadnja <= P.pamtiObavijesti; }).slice(-P.maxGresaka);
  }

  // ── 6. KOŠARICA ──────────────────────────────────────────────────────
  // a) Store API trgovine (WooCommerce): ono što trgovina zna o kupčevoj
  //    košarici — cijene, redovne cijene (pa se vidi što je sniženo),
  //    primijenjeni kodovi i popust po artiklu
  function adresaStoreApija() {
    const l = document.querySelector('link[rel="https://api.w.org/"]');
    const baza = l && l.getAttribute('href');
    if (!baza) return '';
    try {
      const u = new URL(baza, location.href);
      if (u.origin !== location.origin) return '';
      const s = u.href;
      return (/[?&]rest_route=/.test(s) ? s.replace(/\/?$/, '/') : s.replace(/\/?$/, '/')) + 'wc/store/v1/cart';
    } catch (e) { return ''; }
  }

  function kosaricaIzApija() {
    if (!P.koristiStoreApi || typeof fetch !== 'function') return Promise.resolve(null);
    const url = adresaStoreApija();
    if (!url) return Promise.resolve(null);
    const zahtjev = fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(pretvoriKosaricu)
      .catch(function (e) { zapis('Store API nije odgovorio', e); return null; });
    return sTimeoutom(zahtjev, P.cekajStoreApi);
  }

  function pretvoriKosaricu(d) {
    if (!d || !Array.isArray(d.items)) return null;
    const t = d.totals || {};
    const mdKosarice = typeof t.currency_minor_unit === 'number' ? t.currency_minor_unit : 2;
    const iznos = function (v, md) {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      if (!isFinite(n)) return null;
      return Math.round(n) / Math.pow(10, typeof md === 'number' ? md : mdKosarice);
    };
    const zbroj = function () {
      let s = null;
      for (let i = 0; i < arguments.length; i++) if (arguments[i] !== null) s = (s || 0) + arguments[i];
      return s === null ? null : Math.round(s * 100) / 100;
    };
    const artikli = d.items.slice(0, P.maxArtikala).map(function (it) {
      const c = it.prices || {};
      const md = typeof c.currency_minor_unit === 'number' ? c.currency_minor_unit : mdKosarice;
      const cijena = iznos(c.price, md), redovna = iznos(c.regular_price, md);
      const tt = it.totals || {};
      const mdt = typeof tt.currency_minor_unit === 'number' ? tt.currency_minor_unit : mdKosarice;
      const prije = zbroj(iznos(tt.line_subtotal, mdt), iznos(tt.line_subtotal_tax, mdt));
      const poslije = zbroj(iznos(tt.line_total, mdt), iznos(tt.line_total_tax, mdt));
      return {
        naziv: dekodiraj(it.name),
        varijanta: (Array.isArray(it.variation) ? it.variation : []).map(function (v) {
          return dekodiraj(v.attribute) + ': ' + dekodiraj(v.value);
        }).join(', '),
        kolicina: it.quantity,
        cijena: cijena,
        redovnaCijena: redovna !== null && cijena !== null && redovna > cijena ? redovna : null,
        ukupno: poslije,
        popustKoda: prije !== null && poslije !== null && prije - poslije > 0.004 ? Math.round((prije - poslije) * 100) / 100 : 0
      };
    });
    const kuponi = (Array.isArray(d.coupons) ? d.coupons : []).map(function (k) {
      const kt = k.totals || {};
      const md = typeof kt.currency_minor_unit === 'number' ? kt.currency_minor_unit : mdKosarice;
      return { kod: cisti(k.code), popust: zbroj(iznos(kt.total_discount, md), iznos(kt.total_discount_tax, md)) };
    });
    const dostave = [];
    (Array.isArray(d.shipping_rates) ? d.shipping_rates : []).forEach(function (paket) {
      (paket && Array.isArray(paket.shipping_rates) ? paket.shipping_rates : []).forEach(function (r) {
        if (r && r.selected) dostave.push(dekodiraj(r.name) + (r.price !== undefined && r.price !== null ? ' (' + eur(iznos(r.price, r.currency_minor_unit)) + ')' : ''));
      });
    });
    return {
      izvor: 'trgovina',
      broj: typeof d.items_count === 'number' ? d.items_count : artikli.length,
      artikli: artikli,
      kuponi: kuponi,
      zbroj: [
        ['Products', eur(zbroj(iznos(t.total_items), iznos(t.total_items_tax)))],
        ['Discount', eur(zbroj(iznos(t.total_discount), iznos(t.total_discount_tax)))],
        ['Shipping', t.total_shipping === null || t.total_shipping === undefined ? 'not calculated yet' : eur(zbroj(iznos(t.total_shipping), iznos(t.total_shipping_tax)))],
        ['Total', eur(iznos(t.total_price))]
      ].filter(function (r) { return r[1]; }),
      dostava: dostave.join(', '),
      greske: (Array.isArray(d.errors) ? d.errors : []).map(function (g) { return skrati(dekodiraj(g && g.message), 200); }).filter(Boolean)
    };
  }

  // b) Sa stranice (tema martimex.hr i obična WooCommerce košarica)
  const STAVKE = '.cart__single-item, .woocommerce-cart-form__cart-item, tr.cart_item, .checkout-page__items-wrap .cart_item';

  function cijenaStavke(el) {
    const okvir = prvi(el, ['.cart__single-item-qty-price', '.product-subtotal', '.product-price', '.cart__single-item-price', '.price']);
    if (!okvir) return { cijena: '', stara: '' };
    const del = okvir.querySelector('del, s');
    const ins = okvir.querySelector('ins');
    if (del && ins) return { cijena: eur(uBroj(tekstEl(ins))) || tekstEl(ins), stara: eur(uBroj(tekstEl(del))) || tekstEl(del) };
    const sve = cijeneUTekstu(tekstEl(okvir));
    if (sve.length >= 2 && sve[0] > sve[sve.length - 1]) return { cijena: eur(sve[sve.length - 1]), stara: eur(sve[0]) };
    if (sve.length) return { cijena: eur(sve[sve.length - 1]), stara: '' };
    return { cijena: skrati(tekstEl(okvir), 40), stara: '' };
  }

  function kolicinaStavke(el) {
    const polje = el.querySelector('input[type="number"], input.qty, input[name*="qty"], select[name*="qty"]');
    if (polje && polje.value) return cisti(polje.value);
    const t = tekstEl(prvi(el, ['.cart__single-item-qty', '.product-quantity']));
    const m = t.match(/(?:^|\D)(\d{1,3})(?:\s*(?:×|x|kom))?(?!\s*[,.]\d)/);
    return m ? m[1] : '';
  }

  function kosaricaSaStranice() {
    const k = { izvor: 'stranica', artikli: [], kuponi: [], zbroj: [], greske: [] };
    const vidjeno = {};
    const stavke = document.querySelectorAll(STAVKE);
    for (let i = 0; i < stavke.length && k.artikli.length < P.maxArtikala; i++) {
      const el = stavke[i];
      if (el.classList.contains('cart__single-item--cs') || el.closest(NASI)) continue;   // preporuke ("uz to se kupuje")
      if (el.parentElement && el.parentElement.closest(STAVKE)) continue;
      const marka = tekstEl(el.querySelector('.cart__single-item-brand'));
      const naziv = tekstEl(prvi(el, ['.cart__single-item-title', '.product-name a', '.product-name', '.cart__single-item-anchor']));
      if (!naziv && !marka) continue;
      const varijanta = tekstEl(prvi(el, ['.cart__single-item-var', '.variation', 'dl.variation']));
      const c = cijenaStavke(el);
      const kolicina = kolicinaStavke(el);
      const kljuc = [marka, naziv, varijanta, kolicina].join('|');
      if (vidjeno[kljuc]) continue;
      vidjeno[kljuc] = true;
      const greska = el.querySelector('.cart__single-item-error');
      k.artikli.push({
        naziv: skrati((marka ? marka + ' — ' : '') + naziv, 140),
        varijanta: skrati(varijanta, 60),
        kolicina: kolicina,
        cijenaTekst: c.cijena,
        staraTekst: c.stara,
        poklon: !!el.querySelector('.cart__single-item-gift'),
        naCekanju: el.classList.contains('cart__single-item--pending'),
        greska: greska && vidljiv(greska) ? skrati(tekstEl(greska), 200) : ''
      });
    }
    // zbroj: redak = natpis + iznos
    const vidjeniRedci = {};
    document.querySelectorAll('.cart__summary-line, .cart_totals tr, .woocommerce-checkout-review-order-table tfoot tr, .checkout-page__summary-details tr').forEach(function (r) {
      if (r.closest(NASI) || !vidljiv(r) && !r.closest('.cart__summary')) return;
      const djeca = r.children;
      let natpis = '', iznos = '';
      if (djeca.length >= 2) { natpis = tekstEl(djeca[0]); iznos = tekstEl(djeca[djeca.length - 1]); }
      else natpis = tekstEl(r);
      natpis = skrati(natpis.replace(/:$/, ''), 60); iznos = skrati(iznos, 60);
      const kljuc = natpis + '|' + iznos;
      if (!natpis || vidjeniRedci[kljuc]) return;
      vidjeniRedci[kljuc] = true;
      k.zbroj.push([natpis, iznos]);
    });
    // primijenjeni kodovi
    document.querySelectorAll('.coupon-field__chips > *, .cart-discount th, .woocommerce-remove-coupon').forEach(function (c) {
      let kod = c.getAttribute('data-coupon') || tekstEl(c);
      kod = skrati(kod.replace(/^(kupon|coupon|kod)\s*:?\s*/i, '').replace(/\s*(ukloni|remove|\[ukloni\]|×)\s*$/i, ''), 40);
      if (kod && !k.kuponi.some(function (x) { return x.kod === kod; })) k.kuponi.push({ kod: kod, popust: null });
    });
    const besplatna = document.querySelector('.cart__free-shipping');
    if (besplatna && tekstEl(besplatna)) k.besplatnaDostava = skrati(tekstEl(besplatna), 160);
    const prazna = document.querySelector('.cart__empty, .cart-empty, .wc-empty-cart-message');
    k.prazna = !!(prazna && vidljiv(prazna)) && !k.artikli.length;
    const ucitava = document.querySelector('.cart__loading');
    k.ucitava = !!(ucitava && vidljiv(ucitava));
    return k;
  }

  // Store API ima točne cijene; sa stranice ostaje ono čega u Store API-ju
  // nema (greška uz artikl, traka za besplatnu dostavu, poklon artikli)
  function spojiKosaricu(api, dom) {
    if (!api && !dom) return null;
    if (!api) return (dom.artikli.length || dom.zbroj.length || dom.kuponi.length || dom.prazna || dom.besplatnaDostava) ? dom : null;
    if (dom) {
      if (dom.besplatnaDostava) api.besplatnaDostava = dom.besplatnaDostava;
      api.porukeUzArtikle = dom.artikli.filter(function (a) { return a.greska; }).map(function (a) { return a.naziv + ': ' + a.greska; });
      api.poklonArtikli = dom.artikli.filter(function (a) { return a.poklon; }).map(function (a) { return a.naziv; });
      api.zbrojNaStranici = dom.zbroj;
    }
    return api;
  }

  // ── 6b. ARTIKL NA STRANICI PROIZVODA I POPIS PROIZVODA ───────────────
  // Stranica proizvoda: isti podaci o artiklu kao za gumb "Pitaj Marti"
  // (pitaj-marti.js: naziv, marka, odabrana veličina ili nijansa, cijene
  // svih varijanti, akcija, najniža cijena u 30 dana, dostupnost, opis), pa
  // Marti zna na koji artikl kupac misli. Kad pitaj-marti.js nije učitan,
  // kraće čitanje sa stranice (JSON-LD, gumbi varijanti, prikazana cijena).
  function jsonLdProizvod() {
    const skripte = document.querySelectorAll('script[type="application/ld+json"]');
    for (let i = 0; i < skripte.length; i++) {
      let d;
      try { d = JSON.parse(skripte[i].textContent || ''); } catch (e) { continue; }
      const lista = [].concat(d && d['@graph'] ? d['@graph'] : d);
      for (let j = 0; j < lista.length; j++) {
        const x = lista[j];
        if (x && [].concat(x['@type'] || []).indexOf('Product') !== -1) return x;
      }
    }
    return null;
  }

  function izPitajMarti(a) {
    const broj = function (v) { return typeof v === 'number' ? v : uBroj(v); };
    return {
      izvor: 'pitaj-marti',
      naziv: skrati(a.naziv, 140),
      marka: skrati(a.marka, 60),
      vrsta: skrati(a.vrsta, 60),
      kategorija: skrati(a.kategorija, 140),
      varijanta: skrati(a.varijanta, 40),
      cijena: broj(a.cijena),
      stara: broj(a.stara_cijena),
      najniza: skrati(a.najniza_cijena_30_dana, 40),
      dostupno: typeof a.dostupno === 'boolean' ? a.dostupno : null,
      sku: skrati(a.sku, 40),
      opis: skrati(bezOsobnog(a.opis), 700),
      varijante: (Array.isArray(a.varijante) ? a.varijante : []).slice(0, 40).map(function (v) {
        return {
          naziv: skrati(v && v.naziv, 40),
          cijena: broj(v && v.cijena),
          stara: broj(v && v.stara_cijena),
          dostupno: v && typeof v.dostupno === 'boolean' ? v.dostupno : null
        };
      }).filter(function (v) { return v.naziv; })
    };
  }

  function artiklVlastiti() {
    const sekcija = document.querySelector('section.product') || document.querySelector('.product.type-product, div.product');
    const ld = jsonLdProizvod() || {};
    if (!sekcija && !ld.name) return null;
    const korijen = sekcija || document;
    const naziv = tekstEl(korijen.querySelector('.product__title-wrap h1, h1.product_title, .product_title')) ||
      (sekcija ? tekstEl(sekcija.querySelector('h1')) : '') || dekodiraj(ld.name);
    if (!naziv) return null;
    let marka = dekodiraj(ld.brand && (ld.brand.name || ld.brand));
    if (!marka) {
      const a = korijen.querySelector('a[href*="/brand/"]');
      const m = a && (a.getAttribute('href') || '').match(/\/brand\/([^\/?#]+)/);
      if (m) marka = decodeURIComponent(m[1]).replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }
    const varijante = [].map.call(korijen.querySelectorAll('.js-var-btn'), function (g) {
      const n = cisti(g.getAttribute('data-var-color') || g.getAttribute('data-var-name') || tekstEl(g.querySelector('.product__single-variation-size')));
      return n ? { naziv: skrati(n, 40), cijena: uBroj(g.getAttribute('data-var-price')), stara: null, dostupno: null, aktivna: g.classList.contains('active') } : null;
    }).filter(Boolean);
    const odabrana = varijante.filter(function (v) { return v.aktivna; })[0] || null;
    const okvir = korijen.querySelector('.product__price-wrap .product__price:not(.d-none)') || korijen.querySelector('.product__price') ||
      korijen.querySelector('p.price, .summary .price');
    let cijena = null, stara = null;
    if (okvir) {
      cijena = uBroj(tekstEl(okvir.querySelector('h2, ins')));
      stara = uBroj(tekstEl(okvir.querySelector('h4, del')));
      if (cijena === null) {
        const sve = cijeneUTekstu(tekstEl(okvir));
        if (sve.length) cijena = Math.min.apply(null, sve);
      }
    }
    if (cijena === null && odabrana) cijena = odabrana.cijena;
    const ponuda = [].concat(ld.offers || [])[0] || {};
    if (cijena === null) cijena = uBroj(ponuda.price);
    if (stara !== null && cijena !== null && !(stara > cijena)) stara = null;
    let dostupno = null;
    const nema = korijen.querySelector('.product__variations-no-variation-stock-notice, .product__out-of-stock, .stock.out-of-stock');
    if (nema && vidljiv(nema)) dostupno = false;
    else if (ponuda.availability) dostupno = /InStock|PreOrder|LimitedAvailability/i.test(ponuda.availability);
    const opisEl = korijen.querySelector('.product__description .post-content, .product__description, .woocommerce-product-details__short-description, #tab-description');
    return {
      izvor: 'stranica',
      naziv: skrati(naziv, 140),
      marka: skrati(marka, 60),
      vrsta: tekstEl(korijen.querySelector('.product__sku-wrap h5')) || dekodiraj(ld.category),
      kategorija: '',
      varijanta: odabrana ? odabrana.naziv : '',
      cijena: cijena,
      stara: stara,
      najniza: tekstEl(korijen.querySelector('.js-lowest-price:not(.d-none) span, .lowest-price:not(.d-none) span')),
      dostupno: dostupno,
      sku: tekstEl(korijen.querySelector('.js-var-sku:not(.d-none), .sku')).replace(/^SKU:\s*/i, ''),
      opis: skrati(bezOsobnog(opisEl ? cisti(opisEl.textContent) : ''), 700),
      varijante: varijante.slice(0, 40).map(function (v) { return { naziv: v.naziv, cijena: v.cijena, stara: null, dostupno: null }; })
    };
  }

  function artiklNaStranici() {
    const pm = window.MartimexPitajMarti && window.MartimexPitajMarti.procitajArtikl;
    if (typeof pm === 'function') {
      try {
        const a = pm();
        if (a && a.naziv) return izPitajMarti(a);
      } catch (e) { zapis('Pitaj Marti nije pročitao artikl', e); }
    }
    return artiklVlastiti();
  }

  // Popis proizvoda (kategorija, marka, pretraga, preporuke): kartice koje
  // kupac vidi, one na ekranu prve
  const KARTICE_PROIZVODA = '.product-card:not(.product-card--banner), ul.products li.product, .products .product';
  function proizvodiNaPopisu(samoNaEkranu) {
    const naEkr = [], ostali = [];
    const vidjeno = {};
    const kartice = document.querySelectorAll(KARTICE_PROIZVODA);
    for (let i = 0; i < kartice.length && naEkr.length + ostali.length < 60; i++) {
      const k = kartice[i];
      if (k.closest(NASI) || k.closest(ZAGLAVLJE_PODNOZJE)) continue;
      if (k.parentElement && k.parentElement.closest(KARTICE_PROIZVODA)) continue;
      if (!vidljiv(k)) continue;
      const tekstNaziva = (function () {
        const el = k.querySelector('.product-card__text-wrap, .woocommerce-loop-product__title, h2, h3');
        let t = '';
        try { t = el ? (el.innerText || el.textContent) : ''; } catch (e) { t = el ? el.textContent : ''; }
        return cisti(String(t || '').split(/\n+/).map(cisti).filter(Boolean).join(' — '));
      })();
      if (!tekstNaziva) continue;
      const cijenaEl = k.querySelector('.product-card__price-wrap, .price');
      let cijena = cijenaEl ? tekstEl(cijenaEl) : '';
      const del = cijenaEl && cijenaEl.querySelector('del, s');
      if (del) cijena = cisti(cijena.replace(tekstEl(del), '')) + ' (crossed-out ' + tekstEl(del) + ')';
      const znacka = (tekstEl(k).match(/[-−]\s?\d{1,2}\s?%/) || [])[0] || '';
      const a = k.querySelector('a[href]');
      let put = '';
      try { put = a ? new URL(a.getAttribute('href'), location.href).pathname : ''; } catch (e) { put = ''; }
      const kljuc = tekstNaziva + '|' + put;
      if (vidjeno[kljuc]) continue;
      vidjeno[kljuc] = true;
      const p = {
        naziv: skrati(tekstNaziva, 140),
        cijena: skrati(cijena, 80),
        znacka: znacka.replace(/\s/g, ''),
        poklon: !!k.querySelector('.product-card__gift'),
        put: skrati(put, 140)
      };
      if (naEkranu(k)) { p.naEkranu = true; naEkr.push(p); }
      else if (!samoNaEkranu) ostali.push(p);
    }
    return naEkr.concat(ostali).slice(0, 12);
  }

  // ── 7. POLJA OBRASCA ─────────────────────────────────────────────────
  const KOD = /coupon|kupon|promo|discount|popust/i;
  const POKLON_BON = /gift|poklon|voucher|\bbon\b/i;
  const KOLICINA = /\bqty\b|quantity|koli[cč]in/i;
  const GRUPE = { shipping_method: 'Delivery method', payment_method: 'Payment method' };

  function oznakaPolja(el) {
    let t = '';
    try { if (el.labels && el.labels.length) t = tekstEl(el.labels[0]) || cisti(el.labels[0].textContent); } catch (e) { t = ''; }
    if (!t) t = cisti(el.getAttribute('aria-label'));
    if (!t) {
      const ids = cisti(el.getAttribute('aria-labelledby'));
      if (ids) t = cisti(ids.split(' ').map(function (id) { const x = document.getElementById(id); return x ? x.textContent : ''; }).join(' '));
    }
    if (!t) t = cisti(el.getAttribute('placeholder'));
    if (!t) t = cisti(el.getAttribute('name') || el.id);
    return skrati(bezOsobnog(t).replace(/\s*\*\s*$/, ''), 70);
  }

  // najmanji okvir oko polja (u kojem nema drugih polja) — tu je poruka o grešci
  function okvirPolja(el) {
    let okvir = el.parentElement;
    for (let i = 0; i < 4 && okvir && okvir.parentElement; i++) {
      const iznad = okvir.parentElement;
      if (iznad.querySelectorAll('input:not([type="hidden"]), select, textarea').length > 1) break;
      okvir = iznad;
    }
    return okvir;
  }

  function greskaPolja(el) {
    let t = '';
    const ids = cisti((el.getAttribute('aria-describedby') || '') + ' ' + (el.getAttribute('aria-errormessage') || ''));
    if (ids) {
      t = ids.split(' ').map(function (id) {
        const x = document.getElementById(id);
        return x && vidljiv(x) && /error|greska|invalid|not-valid/i.test((x.className || '') + ' ' + id) ? tekstEl(x) : '';
      }).filter(Boolean).join(' ');
    }
    const okvir = okvirPolja(el);
    if (!t && okvir) {
      const g = okvir.querySelector('.checkout-inline-error-message, .coupon-field__error-message, .coupon-error-notice, .invalid-feedback, .wpcf7-not-valid-tip, .error-message, .field-error');
      if (g && g !== el && vidljiv(g)) t = tekstEl(g);
    }
    const red = el.closest('.form-row, .woocommerce-invalid, .is-invalid, .has-error');
    const neispravno = el.getAttribute('aria-invalid') === 'true' ||
      !!(red && red.classList && (red.classList.contains('woocommerce-invalid') || red.classList.contains('is-invalid') || red.classList.contains('has-error')));
    if (!t && neispravno) t = el.validationMessage || 'marked as invalid';
    return t ? skrati(bezOsobnog(t), 200) : '';
  }

  // Kod iz polja: kratki promo kod cijeli; dugi kod ili kod koji izgleda
  // kao poklon bon (vrijedi kao novac) skriven, osim prva i zadnja dva znaka
  function kodZaMarti(v, poljePoklonBona) {
    const s = String(v || '').replace(/[\u0000-\u001f]/g, '').slice(0, 60);
    if (!s.trim()) return '';
    const bezRazmaka = s.replace(/[\s-]/g, '');
    const kaoPoklonBon = poljePoklonBona || s.length > 16 || /^\d{8,}$/.test(bezRazmaka) || (s.match(/-/g) || []).length >= 2;
    if (!kaoPoklonBon) return '„' + s + '”';
    if (s.length <= 4) return s.charAt(0) + '•••' + ' (hidden)';
    return '„' + s.slice(0, 2) + '•'.repeat(Math.min(12, Math.max(2, s.length - 4))) + s.slice(-2) + '” (' + s.length + ' characters, hidden — looks like a gift card code)';
  }

  function poljaObrasca() {
    const out = [];
    const grupe = {};
    const els = document.querySelectorAll('input, select, textarea');
    for (let i = 0; i < els.length && out.length < P.maxPolja; i++) {
      const el = els[i];
      const tip = (el.tagName === 'INPUT' ? (el.getAttribute('type') || 'text') : el.tagName).toLowerCase();
      if (/^(hidden|submit|button|image|reset|file|search)$/.test(tip)) continue;
      if (el.closest(PRESKOCI_POLJA)) continue;
      const oznaka = oznakaPolja(el);
      const opis = [el.name, el.id, typeof el.className === 'string' ? el.className : '', el.getAttribute('autocomplete'), oznaka].join(' ');
      // polje za kod prepozna se i po okviru (na martimex.hr .coupon-field), ne samo po imenu
      const uOkviruKoda = !!el.closest('.coupon-field, .checkout_coupon, .woocommerce-form-coupon, .checkout-page__coupon-wrap, .coupon');
      const uOkviruBona = !!el.closest('.checkout-page__gift-card, .gift-card-page--form');
      const poklonBon = uOkviruBona || (POKLON_BON.test(opis) && !KOD.test(el.name + ' ' + el.id) && !uOkviruKoda);
      const kod = tip !== 'password' && tip !== 'email' && tip !== 'checkbox' && tip !== 'radio' && el.tagName !== 'SELECT' &&
        (KOD.test(opis) || uOkviruKoda || poklonBon);
      let vidi = vidljiv(el);
      // kvačice i izbori često su skriveni i nacrtani preko oznake: vidi se oznaka
      if (!vidi && (tip === 'checkbox' || tip === 'radio')) {
        const l = el.labels && el.labels[0];
        vidi = l ? vidljiv(l) : vidljiv(el.parentElement);
      }
      if (!vidi && !(kod && el.value)) continue;
      if (el.closest(PRIVATNO) && !kod) continue;
      // količina artikla u košarici već je u popisu košarice
      if ((tip === 'number' || KOLICINA.test(opis)) && el.closest(STAVKE)) continue;
      const z = { oznaka: oznaka || '(no label)' };
      if (tip === 'radio') {
        if (!el.checked) continue;
        const ime = el.name || oznaka;
        if (grupe[ime]) continue;
        grupe[ime] = true;
        const ime0 = String(el.name || '').replace(/\[.*$/, '');
        z.oznaka = GRUPE[ime0] || skrati(cisti(ime0.replace(/[_-]+/g, ' ')), 40) || 'Choice';
        z.odabrano = oznaka;
      } else if (tip === 'checkbox') {
        z.ukljuceno = !!el.checked;
      } else if (el.tagName === 'SELECT') {
        const o = el.selectedOptions && el.selectedOptions[0];
        z.odabrano = skrati(bezOsobnog(o ? o.text : el.value), 60);
      } else if (kod) {
        z.kod = kodZaMarti(el.value, poklonBon);
        z.vrsta = poklonBon ? 'poklonBon' : 'kod';
      } else if (tip === 'number' || KOLICINA.test(opis)) {
        z.vrijednost = cisti(el.value).slice(0, 10);
      } else {
        z.popunjeno = !!cisti(el.value);   // osobni podaci: samo je li polje ispunjeno
      }
      if (el.required || el.getAttribute('aria-required') === 'true') z.obavezno = true;
      if (el.disabled) z.onemoguceno = true;
      const g = greskaPolja(el);
      if (g) z.greska = g;
      // obična prazna neobavezna polja bez greške ne govore ništa
      if (z.popunjeno === false && !z.obavezno && !z.greska) continue;
      out.push(z);
    }
    return out;
  }

  function onemoguceniGumbi() {
    const out = [];
    document.querySelectorAll('button, input[type="submit"], a.btn, .btn').forEach(function (b) {
      if (out.length >= 8 || b.closest(PRESKOCI_POLJA)) return;
      // "−" kod količine 1 je uvijek onemogućen: to nije problem
      if (b.closest('.product__quantity, .cart__single-item-qty, .quantity')) return;
      const iskljucen = b.disabled || b.getAttribute('aria-disabled') === 'true' || b.classList.contains('disabled') || b.classList.contains('btn--disabled');
      if (!iskljucen || !vidljiv(b)) return;
      const t = skrati(cisti(b.innerText || b.value || b.getAttribute('aria-label') || b.getAttribute('title')), 60);
      if (!t || /^[−+×✕x-]$/.test(t)) return;
      if (out.indexOf(t) === -1) out.push(t);
    });
    return out;
  }

  // ── 8. TEKST STRANICE ────────────────────────────────────────────────
  const BLOK = /^(P|DIV|LI|UL|OL|DL|DT|DD|H[1-6]|TR|TABLE|THEAD|TBODY|TFOOT|SECTION|ARTICLE|ASIDE|MAIN|FORM|FIELDSET|LEGEND|BLOCKQUOTE|FIGURE|FIGCAPTION|HEADER|FOOTER|NAV|PRE|DIALOG|DETAILS|SUMMARY|LABEL|HR|ADDRESS)$/;
  const UNUTAR_RIJECI = /^(B|STRONG|I|EM|U|MARK|SUP|SUB|SMALL|ABBR|WBR)$/;   // bez razmaka oko njih

  function tekstStranice() {
    const ekran = [], ostalo = [];
    let red = '', redNaEkranu = false, cvorova = 0;
    function zavrsi() {
      const t = skrati(bezOsobnog(red), 400);
      red = '';
      const vidi = redNaEkranu;
      redNaEkranu = false;
      if (!t || t.length < 2) return;
      const cilj = vidi ? ekran : ostalo;
      if (cilj[cilj.length - 1] !== t) cilj.push(t);
    }
    (function hodaj(el, uEkranu) {
      for (let c = el.firstChild; c; c = c.nextSibling) {
        if (++cvorova > 25000) return;            // vrlo velika stranica: dovoljno je
        if (c.nodeType === 3) {
          const v = c.nodeValue;
          if (v && v.trim()) { red += v; if (uEkranu) redNaEkranu = true; }
          else if (v) red += ' ';
          continue;
        }
        if (c.nodeType !== 1) continue;
        let preskoci = false;
        try { preskoci = c.matches(PRESKOCI_TEKST); } catch (e) { preskoci = false; }
        if (preskoci || !vidljiv(c)) continue;
        const t = c.tagName;
        if (t === 'BR') { zavrsi(); continue; }
        if (t === 'TD' || t === 'TH') { red += ' '; hodaj(c, uEkranu && naEkranu(c)); red += ' '; continue; }
        const blok = BLOK.test(t);
        if (blok) zavrsi();
        else if (!UNUTAR_RIJECI.test(t)) red += ' ';
        hodaj(c, blok ? naEkranu(c) : uEkranu);
        if (blok) zavrsi();
        else if (!UNUTAR_RIJECI.test(t)) red += ' ';
      }
    })(document.body, true);
    zavrsi();
    return { ekran: ekran, ostalo: ostalo };
  }

  // Stranice s osobnim podacima (korisnički račun, potvrda narudžbe): samo naslovi
  function samoNaslovi() {
    const out = [];
    document.querySelectorAll('h1, h2, h3, h4').forEach(function (h) {
      if (out.length >= 15 || h.closest(PRESKOCI_TEKST) || !vidljiv(h)) return;
      const t = skrati(bezOsobnog(tekstEl(h)), 120);
      if (t && out.indexOf(t) === -1) out.push(t);
    });
    return { ekran: out, ostalo: [] };
  }

  // ── 9. SNIMKA ────────────────────────────────────────────────────────
  function snimi() {
    const sad = new Date();
    const s = {
      v: VERZIJA,
      vrijeme: sad.toISOString(),
      vrijemeLokalno: lokalnoVrijeme(sad),
      stranica: podaciStranice(),
      uredjaj: uredjaj(),
      obavijesti: [],
      artikl: null,
      proizvodi: [],
      kosarica: null,
      polja: [],
      gumbi: [],
      tekst: { ekran: [], ostalo: [] },
      greske: []
    };
    const privatna = s.stranica.vrsta === 'racun' || s.stranica.vrsta === 'narudzba';
    const pokusaj = function (ime, fn) { try { return fn(); } catch (e) { zapis('nije pročitano: ' + ime, e); return undefined; } };
    s.obavijesti = pokusaj('poruke', obavijestiZaSnimku) || [];
    s.polja = pokusaj('polja', poljaObrasca) || [];
    s.gumbi = pokusaj('gumbi', onemoguceniGumbi) || [];
    s.tekst = pokusaj('tekst', privatna ? samoNaslovi : tekstStranice) || s.tekst;
    s.greske = pokusaj('greške', greskeZaSnimku) || [];
    // artikl: na stranici proizvoda (isti podaci kao "Pitaj Marti")
    if (s.stranica.vrsta === 'proizvod') s.artikl = pokusaj('artikl', artiklNaStranici) || null;
    // kartice proizvoda: na stranici proizvoda samo one na ekranu (preporuke ispod artikla)
    if (!privatna) s.proizvodi = pokusaj('proizvodi', function () { return proizvodiNaPopisu(s.stranica.vrsta === 'proizvod'); }) || [];
    const dom = pokusaj('košarica', kosaricaSaStranice) || null;
    return kosaricaIzApija().then(function (api) {
      s.kosarica = spojiKosaricu(api, dom);
      zapis('snimka', s);
      return s;
    });
  }

  // ── 10. TEKST ZA MARTI ───────────────────────────────────────────────
  // Natpisi su na engleskom, kao ostali podaci u Martinu Global Promptu;
  // podaci sa stranice ostaju na hrvatskom, kakvi jesu.
  function redak(oznaka, vrijednost) { return vrijednost ? oznaka + ': ' + vrijednost : ''; }

  function skratiPopis(retci, max) {
    const out = [];
    let duljina = 0;
    for (let i = 0; i < retci.length; i++) {
      if (duljina + retci[i].length > max) {
        const ostatak = max - duljina;
        if (ostatak > 80) out.push(skrati(retci[i], ostatak));
        out.push('…');
        break;
      }
      out.push(retci[i]);
      duljina += retci[i].length + 1;
    }
    return out;
  }

  const VRSTE_PORUKA = { greska: 'ERROR', upozorenje: 'WARNING', uspjeh: 'SUCCESS', info: 'INFO' };

  function opisZaMarti(s) {
    const r = [];
    const st = s.stranica;
    const u = s.uredjaj;
    r.push('Page: ' + (st.naziv ? st.naziv + ' — ' : '') + st.opisEn + (st.naslov ? ' — heading „' + st.naslov + '”' : ''));
    r.push(redak('Address', st.adresa));
    r.push(redak('Breadcrumbs', st.putanja));
    r.push('Seen at: ' + s.vrijemeLokalno + ' (customer\'s time) · ' + (u.mobitel ? 'mobile' : 'computer') + ', screen ' + u.ekran +
      [u.preglednik, u.sustav].filter(Boolean).map(function (x) { return ', ' + x; }).join(''));
    if (st.kosaricaOtvorena) r.push('The cart side panel is open.');

    // artikl na stranici proizvoda (isti podaci kao "Pitaj Marti")
    const a = s.artikl;
    if (a) {
      const sCijenom = function (n, c, st0, dost) {
        let t = n + (c !== null && c !== undefined ? ' – ' + eur(c) : '');
        if (st0 && c !== null && st0 > c) t += ' (on sale, regular ' + eur(st0) + ')';
        if (dost === false) t += ' (out of stock)';
        return t;
      };
      r.push('');
      r.push('Product on this page (the product the customer is looking at):');
      r.push('- Product: ' + (a.marka ? a.marka + ' – ' : '') + a.naziv);
      if (a.vrsta || a.kategorija) r.push('- Type: ' + [a.vrsta, a.kategorija ? 'category ' + a.kategorija : ''].filter(Boolean).join(' · '));
      if (a.varijanta) r.push('- Selected size/variant: ' + sCijenom(a.varijanta, a.cijena, a.stara, null));
      else if (a.cijena !== null) r.push('- Price: ' + eur(a.cijena) + (a.stara && a.stara > a.cijena ? ' (on sale, regular ' + eur(a.stara) + ')' : ''));
      if (a.varijante && a.varijante.length > 1) r.push('- All sizes/variants: ' + a.varijante.map(function (v) { return sCijenom(v.naziv, v.cijena, v.stara, v.dostupno); }).join('; '));
      r.push('- In stock: ' + (a.dostupno === true ? 'yes' : a.dostupno === false ? 'NO — currently out of stock' : 'not shown on the page'));
      if (a.najniza) r.push('- Lowest price in the last 30 days (shown on the page): ' + a.najniza);
      if (a.sku) r.push('- SKU: ' + a.sku);
      if (a.opis) r.push('- Description on the page: „' + a.opis + '”');
    }

    // poruke na stranici
    r.push('');
    if (s.obavijesti.length) {
      r.push('Messages shown on the page:');
      s.obavijesti.forEach(function (o) {
        const kad = o.vidljiva ? 'visible now' : ('shown ' + (o.prijeMin ? o.prijeMin + ' min ago' : 'less than a minute ago') + ', no longer visible' +
          (o.drugaStranica ? ', on another page (' + o.drugaStranica + ')' : ''));
        r.push('- ' + (VRSTE_PORUKA[o.vrsta] || 'INFO') + ' (' + kad + '): „' + o.tekst + '”');
      });
    } else {
      r.push('Messages shown on the page: none (no error, warning or notice in the last 15 minutes).');
    }

    // košarica
    const k = s.kosarica;
    r.push('');
    if (!k) {
      r.push('Cart: not visible on this page (no cart data).');
    } else if (k.prazna && !(k.artikli && k.artikli.length)) {
      r.push('Cart: empty.');
    } else {
      r.push('Cart' + (k.izvor === 'trgovina' ? ' (from the shop\'s own cart data — exact)' : ' (read from the page)') +
        (k.broj ? ' — ' + k.broj + ' item(s)' : '') + ':');
      (k.artikli || []).forEach(function (a, i) {
        let t = (i + 1) + '. ' + a.naziv + (a.varijanta ? ' (' + a.varijanta + ')' : '') + (a.kolicina ? ' × ' + a.kolicina : '');
        if (k.izvor === 'trgovina') {
          t += ': ' + (a.cijena !== null ? eur(a.cijena) + ' each' : 'price unknown');
          t += a.redovnaCijena ? ' — ON SALE, regular price ' + eur(a.redovnaCijena) : ' — regular price (not on sale)';
          if (a.popustKoda) t += ' — code discount on this item: ' + eur(a.popustKoda);
          if (a.ukupno !== null) t += ' — line total ' + eur(a.ukupno);
        } else {
          if (a.cijenaTekst) t += ': ' + a.cijenaTekst;
          t += a.staraTekst ? ' — ON SALE, crossed-out price ' + a.staraTekst : (a.cijenaTekst ? ' — no crossed-out price shown' : '');
          if (a.poklon) t += ' — gift item';
          if (a.naCekanju) t += ' — still updating';
          if (a.greska) t += ' — message next to the item: „' + a.greska + '”';
        }
        r.push(t);
      });
      if (k.ucitava) r.push('The cart was still loading.');
      r.push('Codes applied in the cart: ' + (k.kuponi && k.kuponi.length
        ? k.kuponi.map(function (c) { return '„' + c.kod + '”' + (c.popust !== null && c.popust !== undefined ? ' (−' + eur(c.popust).replace('−', '') + ')' : ''); }).join(', ')
        : 'none'));
      if (k.zbroj && k.zbroj.length) r.push('Totals: ' + k.zbroj.map(function (z) { return z[0] + (z[1] ? ' ' + z[1] : ''); }).join(' · '));
      if (k.zbrojNaStranici && k.zbrojNaStranici.length) r.push('Totals as shown on the page: ' + k.zbrojNaStranici.map(function (z) { return z[0] + (z[1] ? ' ' + z[1] : ''); }).join(' · '));
      if (k.dostava) r.push('Selected delivery: ' + k.dostava);
      if (k.besplatnaDostava) r.push('Free delivery bar: „' + k.besplatnaDostava + '”');
      if (k.poklonArtikli && k.poklonArtikli.length) r.push('Gift items shown in the cart: ' + k.poklonArtikli.join(', '));
      if (k.porukeUzArtikle && k.porukeUzArtikle.length) r.push('Messages next to items: ' + k.porukeUzArtikle.map(function (p) { return '„' + p + '”'; }).join('; '));
      if (k.greske && k.greske.length) r.push('Cart errors reported by the shop: ' + k.greske.map(function (g) { return '„' + g + '”'; }).join('; '));
    }

    // kartice proizvoda (popis, preporuke)
    if (s.proizvodi && s.proizvodi.length) {
      r.push('');
      r.push((st.vrsta === 'proizvod' ? 'Other products shown on the screen' : 'Products shown on the page (on the screen first)') + ':');
      s.proizvodi.forEach(function (p, i) {
        r.push((i + 1) + '. ' + p.naziv + (p.cijena ? ' — ' + p.cijena : '') + (p.znacka ? ' (badge ' + p.znacka + ')' : '') +
          (p.poklon ? ' (gift with purchase)' : '') + (p.naEkranu ? ' — on the screen' : ''));
      });
    }

    // polja obrasca
    if (s.polja.length) {
      r.push('');
      r.push('Form fields on the page (values of personal fields are never shared — only whether they are filled):');
      s.polja.forEach(function (p) {
        let t = '- ' + p.oznaka + ': ';
        if (p.kod !== undefined) t += p.kod ? (p.vrsta === 'poklonBon' ? 'gift card code entered ' : 'code entered ') + p.kod : 'empty';
        else if (p.odabrano !== undefined) t += p.odabrano || 'nothing selected';
        else if (p.ukljuceno !== undefined) t += p.ukljuceno ? 'checked' : 'NOT checked';
        else if (p.vrijednost !== undefined) t += p.vrijednost || 'empty';
        else t += p.popunjeno ? 'filled' : 'EMPTY';
        if (p.obavezno) t += ' (required)';
        if (p.onemoguceno) t += ' (disabled)';
        if (p.greska) t += ' — error: „' + p.greska + '”';
        r.push(t);
      });
    }

    if (s.gumbi.length) {
      r.push('');
      r.push('Disabled buttons: ' + s.gumbi.map(function (g) { return '„' + g + '”'; }).join(', '));
    }

    // tekst stranice
    const ekran = skratiPopis(s.tekst.ekran || [], P.maxTekstEkran);
    const ostalo = skratiPopis(s.tekst.ostalo || [], P.maxTekstOstalo);
    if (ekran.length) { r.push(''); r.push('Text on the customer\'s screen right now:'); r.push(ekran.join('\n')); }
    if (ostalo.length) { r.push(''); r.push('Rest of the page (not on the screen right now, shortened):'); r.push(ostalo.join('\n')); }
    if (st.vrsta === 'racun' || st.vrsta === 'narudzba') { r.push(''); r.push('Only headings are shared from this page, because it shows the customer\'s personal data.'); }

    if (s.greske.length) {
      r.push('');
      r.push('Technical errors in the page\'s scripts (for diagnosis only — never quote them to the customer):');
      s.greske.forEach(function (g) { r.push('- ' + g.poruka + (g.gdje ? ' (' + g.gdje + ')' : '') + (g.puta > 1 ? ' ×' + g.puta : '')); });
    }

    return r.filter(function (x, i, svi) { return x !== '' || (i > 0 && svi[i - 1] !== ''); }).join('\n').trim();
  }

  // kratki strukturirani podaci uz tekst (za Voiceflow i transcript)
  function kratkiPodaci(s) {
    const k = s.kosarica;
    const kod = s.polja.filter(function (p) { return p.kod; })[0];
    const a = s.artikl;
    return {
      vrsta: s.stranica.vrsta,
      naslov: s.stranica.naslov,
      artikl: a ? (a.marka ? a.marka + ' ' : '') + a.naziv + (a.varijanta ? ' ' + a.varijanta : '') : '',
      proizvoda: (s.proizvodi || []).length,
      mobitel: s.uredjaj.mobitel,
      greske: s.obavijesti.filter(function (o) { return o.vrsta === 'greska'; }).map(function (o) { return o.tekst; }).slice(0, 5),
      kosarica: k ? {
        izvor: k.izvor,
        artikala: (k.artikli || []).length,
        snizenih: (k.artikli || []).filter(function (a) { return a.redovnaCijena || a.staraTekst; }).length,
        kuponi: (k.kuponi || []).map(function (c) { return c.kod; })
      } : null,
      upisaniKod: kod ? kod.kod.replace(/^„/, '').replace(/”.*$/, '') : ''
    };
  }

  // ── 11. SLANJE MARTI ─────────────────────────────────────────────────
  function korijenChata() {
    const h = document.getElementById('voiceflow-chat');
    return h && h.shadowRoot;
  }

  // Pričeka da chat dovrši Martin odgovor (točkice "piše…" nestanu i ništa
  // se ne mijenja 600 ms), najdulje ms
  function cekajMirChata(ms) {
    return new Promise(function (gotovo) {
      const kor = korijenChata();
      if (!kor || typeof MutationObserver !== 'function') { setTimeout(gotovo, 300); return; }
      const pocetak = Date.now();
      let zadnja = Date.now();
      const mo = new MutationObserver(function () { zadnja = Date.now(); });
      mo.observe(kor, { childList: true, subtree: true, characterData: true });
      (function provjeri() {
        const sad = Date.now();
        const pise = !!kor.querySelector('.vfrc-typing-indicator');
        if ((!pise && sad - zadnja >= 600) || sad - pocetak >= ms) { mo.disconnect(); gotovo(); return; }
        setTimeout(provjeri, 120);
      })();
    });
  }

  const uTijeku = {};
  function posalji(id, odobreno) {
    if (uTijeku[id]) return Promise.resolve();
    uTijeku[id] = true;
    postaviStanje(id, odobreno ? 'salje' : 'odbijeno');
    return cekajMirChata(P.cekajMir)
      .then(function () {
        if (!odobreno) {
          return { v: VERZIJA, zahtjev: id, odbijeno: true, vrijeme: new Date().toISOString(), vrijemeLokalno: lokalnoVrijeme() };
        }
        return snimi().then(function (s) {
          return {
            v: VERZIJA,
            zahtjev: id,
            vrijeme: s.vrijeme,
            vrijemeLokalno: s.vrijemeLokalno,
            vrsta: s.stranica.vrsta,
            naziv: s.stranica.nazivZaKupca,
            adresa: s.stranica.adresa,
            tekst: opisZaMarti(s),
            podaci: kratkiPodaci(s)
          };
        });
      })
      .then(function (podaci) {
        const vc = window.voiceflow && window.voiceflow.chat;
        if (!vc || typeof vc.interact !== 'function') throw new Error('chat nije spreman');
        zapis('šaljem Marti', podaci);
        vc.interact({ type: 'event', payload: { event: { name: P.dogadaj, stranica_kupca: podaci } } });
        postaviStanje(id, odobreno ? 'poslano' : 'odbijeno', odobreno ? { stranica: podaci.naziv } : null);
      })
      .catch(function (e) {
        console.warn('[Martimex] Pogled na stranicu nije poslan:', e);
        postaviStanje(id, 'greska');
      })
      .then(function () { uTijeku[id] = false; });
  }

  // ── 11b. DOPUŠTENJE (pitajDopustenje: 'jednom') ─────────────────────
  // Kupac je pritisnuo "Pokaži stranicu": do kraja tog razgovora (isti
  // Voiceflow razgovor, kartica preglednika otvorena, najviše 2 sata) Marti
  // gleda sama. "Ne, hvala" dopuštenje briše.
  const KLJUC_DOPUSTENJA = 'mx-ps-dopusteno';
  function oznakaRazgovora() {
    try {
      const sp = [window.sessionStorage, window.localStorage];
      for (let s = 0; s < sp.length; s++) {
        if (!sp[s]) continue;
        for (let i = 0; i < sp[s].length; i++) {
          const k = sp[s].key(i);
          if (!k || k.indexOf('voiceflow-session-') !== 0) continue;
          const v = JSON.parse(sp[s].getItem(k) || 'null');
          if (v && (v.startTime || v.userID)) return String(v.startTime || '') + '|' + String(v.userID || '');
        }
      }
    } catch (e) { /* ne zna se: vrijedi samo vremensko ograničenje */ }
    return '';
  }
  function zapamtiDopustenje(da) {
    pisi(KLJUC_DOPUSTENJA, da ? { t: Date.now(), r: oznakaRazgovora() } : null, true);
  }
  function dopustenoURazgovoru() {
    const z = citaj(KLJUC_DOPUSTENJA, null);
    if (!z || typeof z.t !== 'number' || Date.now() - z.t > 2 * 3600 * 1000) return false;
    const sad = oznakaRazgovora();
    return !z.r || !sad || z.r === sad;
  }
  function gledaSama() {
    return P.pitajDopustenje === false || (P.pitajDopustenje === 'jednom' && dopustenoURazgovoru());
  }

  // ── 12. STANJE ZAHTJEVA ──────────────────────────────────────────────
  // ceka → (salje → poslano) | odbijeno | greska | isteklo
  const KLJUC_ZAHTJEVA = 'mx-ps-zahtjevi';
  function sviZahtjevi() {
    const l = citaj(KLJUC_ZAHTJEVA, []);
    return Array.isArray(l) ? l : [];
  }
  function zahtjev(id) {
    const l = sviZahtjevi();
    for (let i = 0; i < l.length; i++) if (l[i] && l[i].id === id) return l[i];
    return null;
  }
  function spremiZahtjev(z) {
    const l = sviZahtjevi().filter(function (x) { return x && x.id !== z.id && Date.now() - (x.prvi || 0) < 24 * 3600 * 1000; });
    l.push(z);
    pisi(KLJUC_ZAHTJEVA, l.slice(-30));
    return z;
  }
  function postaviStanje(id, stanje, dodatno) {
    const z = zahtjev(id) || { id: id, prvi: Date.now() };
    z.stanje = stanje;
    z.promjena = Date.now();
    if (dodatno) Object.keys(dodatno).forEach(function (k) { z[k] = dodatno[k]; });
    spremiZahtjev(z);
    osvjeziKartice(id);
  }
  // najnoviji zahtjev u razgovoru (stariji, nepotvrđeni, više se ne nude)
  function najnovijiId() {
    let naj = null;
    sviZahtjevi().forEach(function (z) { if (z && (!naj || (z.prvi || 0) >= (naj.prvi || 0))) naj = z; });
    return naj ? naj.id : '';
  }

  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  // oznaka zahtjeva: samo slova, brojke, točka, crtica i podvlaka (ide u atribut i selektor)
  function idZahtjeva(p) {
    const z = cisti(p.zahtjev).replace(/[^\w.-]/g, '').slice(0, 60);
    if (z) return 'z-' + z;
    if (p.vrijeme) return 'v-' + hash(String(p.vrijeme));
    return '';
  }

  // ── 13. KARTICA U CHATU ──────────────────────────────────────────────
  const OKO = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M2.5 12s3.4-6.5 9.5-6.5S21.5 12 21.5 12s-3.4 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const KVACICA = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';

  const CSS = `
    .mx-ps {
      box-sizing: border-box;
      width: 100%;
      max-width: 340px;
      padding: 13px 16px 14px;
      border-radius: 18px 18px 18px 6px;
      background: var(--mx-j-papir, #fffdfb);
      color: var(--mx-j-tinta, #1c1715);
      box-shadow: var(--mx-j-sjena, 0 0 0 1px rgba(60, 40, 30, .08), 0 6px 18px -12px rgba(60, 40, 30, .35));
      font-family: var(--mx-j-font, inherit);
      font-size: 14px;
      line-height: 1.5;
      letter-spacing: .005em;
      animation: mx-ps-pojava .5s cubic-bezier(.16, 1, .3, 1) backwards;
    }
    .mx-ps[data-kompaktno] { padding: 9px 14px; }
    .mx-ps-pitanje { display: flex; gap: 9px; align-items: flex-start; margin: 0; }
    .mx-ps-pitanje svg, .mx-ps-status svg { flex: none; margin-top: 1px; }
    .mx-ps-sitno { margin: 7px 0 0 27px; color: var(--mx-j-tih, #7a6d66); font-size: 12px; line-height: 1.45; }
    .mx-ps-gumbi { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 0 27px; }
    .mx-ps-gumb {
      -webkit-appearance: none; appearance: none;
      min-height: 34px;
      margin: 0;
      padding: 7px 15px 8px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--mx-j-tinta, #1c1715);
      box-shadow: inset 0 0 0 1px var(--mx-j-tinta-55, rgba(28, 23, 21, .55));
      font: inherit;
      font-size: 13px;
      line-height: 19px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background-color .25s ease, color .25s ease, box-shadow .25s ease, transform .25s ease;
    }
    .mx-ps-gumb--da { background: var(--mx-j-tinta, #1c1715); color: var(--mx-j-puder, #f3e5de); box-shadow: inset 0 0 0 1px var(--mx-j-tinta, #1c1715); }
    @media (hover: hover) and (pointer: fine) {
      .mx-ps-gumb:hover { background: var(--mx-j-tinta, #1c1715); color: var(--mx-j-puder, #f3e5de); box-shadow: inset 0 0 0 1px var(--mx-j-tinta, #1c1715); }
    }
    .mx-ps-gumb:active { transform: scale(.97); }
    .mx-ps-gumb:focus-visible { outline: 1px solid var(--mx-j-tinta, #1c1715); outline-offset: 3px; }
    .mx-ps-gumb[disabled] { cursor: progress; opacity: .6; }
    .mx-ps-status { display: flex; gap: 8px; align-items: center; margin: 10px 0 0 27px; color: var(--mx-j-tih, #7a6d66); font-size: 12.5px; }
    .mx-ps-status:empty { display: none; }
    .mx-ps[data-kompaktno] .mx-ps-status { margin: 0; }
    .mx-ps[data-stanje="poslano"] .mx-ps-status { color: var(--mx-j-tinta, #1c1715); }
    .mx-ps-tockice::after { content: ''; display: inline-block; width: 1.2em; text-align: left; animation: mx-ps-tockice 1.4s steps(4, end) infinite; }
    @keyframes mx-ps-tockice { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
    @keyframes mx-ps-pojava { from { opacity: 0; transform: translateY(6px); } }
    @media (prefers-reduced-motion: reduce) {
      .mx-ps { animation: none; }
      .mx-ps-gumb { transition: none; }
      .mx-ps-tockice::after { animation: none; content: '…'; }
    }
  `;

  const kartice = [];   // iscrtane kartice: { id, korijen, stranica }

  function nazivUZagradi(naziv) { return naziv ? ' (' + naziv + ')' : ''; }

  function izgradiKarticu(id, kompaktno) {
    const korijen = document.createElement('div');
    korijen.className = 'mx-ps';
    korijen.setAttribute('role', 'group');
    korijen.setAttribute('aria-label', 'Pogled na stranicu');
    korijen.setAttribute('data-zahtjev', id);
    if (kompaktno) korijen.setAttribute('data-kompaktno', '');
    const stil = document.createElement('style');
    stil.textContent = CSS;
    korijen.appendChild(stil);

    const stranica = nazivZaKupca();
    if (!kompaktno) {
      const pitanje = document.createElement('p');
      pitanje.className = 'mx-ps-pitanje';
      pitanje.innerHTML = OKO;
      const t = document.createElement('span');
      t.textContent = T.pitanje.replace('{stranica}', nazivUZagradi(stranica));
      pitanje.appendChild(t);
      korijen.appendChild(pitanje);
      const sitno = document.createElement('p');
      sitno.className = 'mx-ps-sitno';
      sitno.textContent = P.pitajDopustenje === 'jednom' ? T.sitnoJednom : T.sitno;
      korijen.appendChild(sitno);
    }
    const gumbi = document.createElement('div');
    gumbi.className = 'mx-ps-gumbi';
    const da = document.createElement('button');
    da.type = 'button';
    da.className = 'mx-ps-gumb mx-ps-gumb--da';
    da.textContent = T.dopusti;
    const ne = document.createElement('button');
    ne.type = 'button';
    ne.className = 'mx-ps-gumb';
    ne.textContent = T.odbij;
    da.addEventListener('click', function (e) { e.preventDefault(); zapamtiDopustenje(true); posalji(id, true); });
    ne.addEventListener('click', function (e) { e.preventDefault(); zapamtiDopustenje(false); posalji(id, false); });
    gumbi.appendChild(da);
    gumbi.appendChild(ne);
    korijen.appendChild(gumbi);

    const status = document.createElement('p');
    status.className = 'mx-ps-status';
    status.setAttribute('aria-live', 'polite');
    korijen.appendChild(status);
    return korijen;
  }

  function osvjeziKarticu(korijen, id) {
    const z = zahtjev(id) || { stanje: 'ceka', prvi: Date.now() };
    let stanje = z.stanje || 'ceka';
    // Marti gleda sama i slanje upravo kreće: bez pitanja i gumba
    if (stanje === 'ceka' && pokrenuto[id]) stanje = 'salje';
    if (stanje === 'ceka' && (Date.now() - (z.prvi || 0) > P.zahtjevVrijedi || najnovijiId() !== id)) stanje = 'isteklo';
    korijen.setAttribute('data-stanje', stanje);
    const gumbi = korijen.querySelector('.mx-ps-gumbi');
    const status = korijen.querySelector('.mx-ps-status');
    const kompaktno = korijen.hasAttribute('data-kompaktno');
    const nudi = stanje === 'ceka' || stanje === 'greska';
    if (gumbi) {
      gumbi.style.display = nudi ? '' : 'none';
      [].forEach.call(gumbi.querySelectorAll('button'), function (b) { b.disabled = stanje === 'salje'; });
    }
    // kompaktna kartica (Marti gleda bez pitanja) dobije pitanje tek kad zatreba gumb
    if (kompaktno && nudi && !korijen.querySelector('.mx-ps-pitanje')) {
      korijen.removeAttribute('data-kompaktno');
      const pitanje = document.createElement('p');
      pitanje.className = 'mx-ps-pitanje';
      pitanje.innerHTML = OKO;
      const t = document.createElement('span');
      t.textContent = T.pitanje.replace('{stranica}', nazivUZagradi(nazivZaKupca()));
      pitanje.appendChild(t);
      korijen.insertBefore(pitanje, gumbi);
    }
    if (!status) return;
    status.classList.remove('mx-ps-tockice');
    if (stanje === 'salje') {
      status.innerHTML = OKO;
      const t = document.createElement('span');
      t.className = 'mx-ps-tockice';
      t.textContent = T.gleda.replace(/…$/, '');
      status.appendChild(t);
    } else if (stanje === 'poslano') {
      status.innerHTML = KVACICA;
      const t = document.createElement('span');
      t.textContent = T.pogledala.replace('{stranica}', nazivUZagradi(z.stranica || ''));
      status.appendChild(t);
    } else if (stanje === 'odbijeno') {
      status.textContent = T.odbijeno;
    } else if (stanje === 'greska') {
      status.textContent = T.greska;
    } else if (stanje === 'isteklo') {
      status.textContent = T.isteklo;
    } else {
      status.textContent = '';
    }
  }

  function osvjeziKartice(id) {
    for (let i = kartice.length - 1; i >= 0; i--) {
      const k = kartice[i];
      if (!k.korijen.isConnected && Date.now() - k.nastala > 5000) { kartice.splice(i, 1); continue; }
      if (!id || k.id === id) osvjeziKarticu(k.korijen, k.id);
    }
  }

  const BEZ_CISCENJA = function () {};
  const pokrenuto = {};   // zahtjevi koje je modul na ovoj stranici krenuo slati sam

  function prikazi(trace, element) {
    let p = trace && trace.payload;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } }
    p = p && typeof p === 'object' ? p : {};
    let id = idZahtjeva(p);
    const bezOznake = !id;
    if (bezOznake) id = 'n-' + hash(JSON.stringify(p));   // zahtjev bez oznake: nikad se ne šalje sam

    // Voiceflow zna ponovno pozvati render za istu poruku: postojeća kartica ostaje
    const postojeca = element.querySelector('.mx-ps[data-zahtjev="' + id + '"]');
    if (postojeca) { osvjeziKarticu(postojeca, id); return BEZ_CISCENJA; }

    let z = zahtjev(id);
    let automatski = false;
    if (!z) {
      // prvi put: je li zahtjev upravo stigao ili je to stara poruka iz razgovora?
      const vrijeme = Date.parse(p.vrijeme || '');
      const star = isFinite(vrijeme) && Date.now() - vrijeme > P.svjezZahtjev;
      automatski = gledaSama() && !star && !bezOznake;
      z = spremiZahtjev({ id: id, prvi: star ? vrijeme : Date.now(), automatski: automatski,
        stanje: star && Date.now() - vrijeme > P.zahtjevVrijedi ? 'isteklo' : 'ceka' });
      zapis('novi zahtjev', id, star ? '(stara poruka)' : '', automatski ? '(Marti gleda sama)' : '(pita kupca)', p);
    }

    element.style.width = '100%';
    // Marti gleda sama: kartica je samo redak "Marti je pogledala stranicu (…)"
    const korijen = izgradiKarticu(id, automatski || !!z.automatski);
    element.appendChild(korijen);
    kartice.push({ id: id, korijen: korijen, nastala: Date.now() });
    if (automatski) pokrenuto[id] = true;
    osvjeziKarticu(korijen, id);
    if (automatski) posalji(id, true);
    return BEZ_CISCENJA;
  }

  // ── 14. POKRETANJE ───────────────────────────────────────────────────
  const PogledStraniceExtension = {
    name: 'PogledStranice',
    type: 'response',
    match: function (o) { return !!(o && o.trace && o.trace.type === P.trace); },
    render: function (o) { return prikazi(o.trace, o.element); }
  };

  // za provjeru u konzoli preglednika (i za probnu stranicu)
  window.MartimexPogledStranice = {
    verzija: VERZIJA,
    snimi: snimi,
    tekst: function () { return snimi().then(opisZaMarti); },
    postavke: P
  };

  try { pratiGreske(); } catch (e) { /* nije bitno */ }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { try { pratiObavijesti(); } catch (e) { /* nije bitno */ } });
  } else {
    try { pratiObavijesti(); } catch (e) { /* nije bitno */ }
  }

  // ═════════════════════════════════════════════════════════════════════
  //  REGISTRACIJA — widget na stranici čita ekstenzije iz ovog niza
  // ═════════════════════════════════════════════════════════════════════
  window.MartimexExtensions = window.MartimexExtensions || [];
  window.MartimexExtensions.push(PogledStraniceExtension);

})();
