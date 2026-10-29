// Ukratko: Gumb „Pitaj Marti” na stranicama webshopa
(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — gumb "Pitaj Marti" na stranici proizvoda (v1)
  //
  //  Na stranici proizvoda, odmah ispod gumba "Dodaj u košaricu", pojavi se
  //  gumb "Pitaj Marti". Kad ga kupac pritisne:
  //   - otvori se chat s Marti
  //   - u chatu se pojavi kartica tog artikla (slika, marka, naziv, odabrana
  //     veličina ili nijansa, cijena) i Marti pita
  //     "Kako Vam mogu pomoći oko ovog artikla?"
  //   - Marti zna o kojem je artiklu riječ (sve što piše na stranici:
  //     veličine i cijene, dostupnost, akcija, opis...), pa kupac može
  //     odmah pitati "Kakav je miris?", "Koju veličinu da uzmem?"...
  //
  //  Podaci o artiklu se čitaju sa same stranice, u trenutku pritiska (bez
  //  ikakvog dodatnog učitavanja, pa nema čekanja): naziv, marka, vrsta,
  //  kategorija, odabrana varijanta (veličina ili nijansa), cijene svih
  //  varijanti, stara cijena i najniža cijena u 30 dana kad je artikl na
  //  akciji, dostupnost, slika, opis i pogodnosti. Izvori su redom Alpine
  //  podaci stranice (x-data "singleProduct"), oznake gumba varijanti
  //  (.js-var-btn) i ostatak stranice (naslov, putanja, JSON-LD).
  //
  //  Kako podaci stižu do Marti (Voiceflow):
  //   - razgovor još ne postoji → razgovor se pokrene (launch) i podaci
  //     idu uz njega (last_event.payload.pitaj_marti); Voiceflowov početni
  //     workflow tada umjesto pozdrava pokaže karticu i pitanje
  //   - razgovor već traje → šalje se događaj "pitaj_marti"
  //     (last_event.payload.event.pitaj_marti); razgovor i Martino pamćenje
  //     ostaju, a kartica i pitanje dođu na dno razgovora
  //   - razgovor koji chat pokazuje je zastario (Voiceflow razgovor završi
  //     nakon 30 min bez poruka, a preglednik ga i dalje pamti; događaj u
  //     njemu ne bi dobio odgovor) → pokrene se novi razgovor s artiklom
  //     (Voiceflowov "Restart conversation", pa launch nosi artikl); pri
  //     učitavanju stranice takav se razgovor obriše, pa chat kreće iznova
  //   - ako isti artikl (ista varijanta) već stoji na dnu razgovora, chat
  //     se samo otvori
  //   - ako na događaj ne stigne baš ništa, pokrene se novi razgovor s
  //     artiklom; ako uz launch ne stigne kartica, pošalje se događaj
  //  S izgledom "Jedan ekran" (jedan-ekran.js, kakav je na martimex.hr)
  //  chat se otvori kao i inače, samo umjesto pozdrava dođu kartica i
  //  pitanje.
  //
  //  Tehnički: modul dodaje Voiceflowu postavku launch.event (preko
  //  window.MartimexVoiceflow, koji loader.js preda Voiceflowu). Njezin
  //  payload.pitaj_marti je prazan objekt dok kupac ne pritisne gumb; tada
  //  se u njega upišu podaci o artiklu i pritisne se Voiceflowov (skriveni)
  //  gumb za početak razgovora (#vfrc-start-chat), pa razgovor kreće
  //  potpuno standardno. Kad launch ode, objekt se opet isprazni. Ako
  //  Voiceflow ipak ne pošalje podatke uz launch, modul ih pošalje
  //  događajem. Ako modul zakaže, chat radi kao i prije, samo bez gumba.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxPitajMarti) return;   // zaštita ako se modul učita dvaput
  window.__mxPitajMarti = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_PM_POSTAVKE = {
    tekstGumba: 'Pitaj Marti',
    opisGumba: 'AI savjetnica za ovaj proizvod',   // opis za čitače ekrana i kad se miš zadrži na gumbu

    // Mora biti isto kao poruka u Voiceflowu (workflow "Pitaj Marti"):
    // po njoj (ili po kartici artikla) modul zna da je Marti dobila artikl
    pitanje: 'Kako Vam mogu pomoći oko ovog artikla?',

    // Stranica Kontakt: u okviru "Kontakt podaci", ispod radnog vremena,
    // tekst i ispod njega gumb koji samo otvori chat (isto kao gumb chata u
    // donjem desnom kutu)
    kontakt: {
      tekst: 'Naša AI asistentica Marti dostupna Vam je za sve upite 24/7.',   // '' = bez teksta
      gumb: 'Pitaj Marti'
    },

    dogadaj: 'pitaj_marti',       // ime događaja u Voiceflowu
    cekajChat: 15000,             // ms: koliko se najduže čeka da se chat učita
    cekajOdgovor: 15000,          // ms: koliko se najduže čeka kartica/pitanje prije rezerve
    cekajDogadaj: 10000,          // ms: ako na događaj ne stigne baš ništa (ni Martino tipkanje), nakon toliko se pokrene novi razgovor
    cekajNakonOdgovora: 2500,     // ms: Marti je odgovorila nečim drugim (bez kartice): još toliko se pričeka kartica, pa se odustane
    cekajNajduze: 30000,          // ms: dok Marti tipka čeka se i duže od cekajOdgovor, ali najviše ovoliko
    razgovorTraje: 25 * 60 * 1000, // ms: Voiceflow razgovor završi nakon 30 min bez poruka; nakon ovoliko ga modul smatra završenim
    maxOpis: 2500,                // znakova opisa sa stranice
    maxVarijanti: 40,

    // boje kao sporedni gumbi na martimex.hr ("Nastavi kao gost", "Prijavi se")
    boje: {
      pozadina: '#f7ddd2',        // Martimexova puder-ružičasta (--color-primary-100)
      pozadinaMis: '#edb8aa',     // kad je miš iznad gumba (--color-primary-200)
      tekst: '#171717'            // natpis i iskrica
    }
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const P = MX_PM_POSTAVKE;
  const HOST = 'voiceflow-chat';          // element u čiji shadow DOM Voiceflow crta chat
  const PROZOR = '.vfrc-chat';            // Voiceflowov prozor chata
  const START = '#vfrc-start-chat';       // Voiceflowov gumb "Start new chat"
  const KARTICA = '.mx-kartica';          // kartica artikla (kartica-artikla.js)
  const ODGOVOR = '.vfrc-system-response'; // Martin odgovor u chatu
  const PORUKA = '.vfrc-message';         // jedna poruka (tekst, kartica...)
  const TIPKANJE = '.vfrc-typing-indicator'; // Voiceflowove točkice dok Marti "piše"
  const DEBUG = /[?&]pitajmarti=debug\b/.test(location.search);

  function zapis() {
    if (!DEBUG) return;
    try { console.log.apply(console, ['[Pitaj Marti]'].concat([].slice.call(arguments))); } catch (e) { /* nije bitno */ }
  }

  // ── 1. LAUNCH S ARTIKLOM ───────────────────────────────────────────────
  // ARTIKL je prazan dok kupac ne pritisne gumb. Voiceflow drži referencu na
  // njega (launch.event.payload.pitaj_marti), pa launch pokrenut gumbom nosi
  // podatke o artiklu, a svaki drugi launch prazan objekt (= običan početak).
  const ARTIKL = {};
  const LAUNCH = (function postaviLaunch() {
    const vf = window.MartimexVoiceflow = window.MartimexVoiceflow || {};
    const launch = vf.launch = vf.launch || {};
    const ev = launch.event = launch.event || { type: 'launch' };
    if (!ev.type) ev.type = 'launch';
    ev.payload = Object.assign({}, ev.payload, { pitaj_marti: ARTIKL });
    return ev;
  })();

  function upisiArtikl(a) {
    isprazniArtikl();
    Object.assign(ARTIKL, a);
  }
  function isprazniArtikl() {
    Object.keys(ARTIKL).forEach(function (k) { delete ARTIKL[k]; });
  }

  // ── 2. ČITANJE ARTIKLA SA STRANICE ──────────────────────────────────────
  function tekst(el) {
    return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  // "1.299,50 €" → 1299.5; "88.5" → 88.5; "54.717" (data-var-price) → 54.72
  // (zaokruženo na cente); negativno ili nečitljivo → null
  function uBroj(v) {
    if (typeof v === 'number') return isFinite(v) && v >= 0 ? v : null;
    if (v === undefined || v === null) return null;
    // strojni zapis (atributi i JSON, npr. data-var-price="54.717"): točka je
    // decimalna, koliko god znamenki iza nje bilo
    const t = String(v).trim();
    if (/^[-−]/.test(t)) return null;
    if (/^\d+(?:\.\d+)?$/.test(t)) { const n = parseFloat(t); return isFinite(n) ? Math.round(n * 100) / 100 : null; }
    let s = t.replace(/[^\d.,]/g, '');
    if (!s) return null;
    const d = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
    if (d !== -1 && s.length - d - 1 <= 2) s = s.slice(0, d).replace(/[.,]/g, '') + '.' + s.slice(d + 1);
    else s = s.replace(/[.,]/g, '');
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  // Tekst iz podataka stranice (JSON, atributi): HTML entiteti → znakovi
  // ("Dolce &amp; Gabbana" → "Dolce & Gabbana"), višak razmaka → jedan
  function cistTekst(v) {
    if (v === undefined || v === null || typeof v === 'object') return '';
    let s = String(v);
    if (s.indexOf('&') !== -1) {
      try { const ta = document.createElement('textarea'); ta.innerHTML = s.replace(/</g, '&lt;'); s = ta.value; } catch (e) { /* ostaje kako je */ }
    }
    return s.replace(/\s+/g, ' ').trim();
  }

  // Sadržaj JavaScript stringa (bez navodnika) → pravi tekst (" → ", \/ → / ...)
  function jsTekst(s) {
    let r = '';
    for (let i = 0; i < s.length; i++) {
      const c = s.charAt(i);
      if (c !== '\\') { r += c; continue; }
      const n = s.charAt(++i);
      if (n === 'u' && /^[0-9a-fA-F]{4}$/.test(s.substr(i + 1, 4))) { r += String.fromCharCode(parseInt(s.substr(i + 1, 4), 16)); i += 4; }
      else if (n === 'x' && /^[0-9a-fA-F]{2}$/.test(s.substr(i + 1, 2))) { r += String.fromCharCode(parseInt(s.substr(i + 1, 2), 16)); i += 2; }
      else if (n === 'n') r += '\n';
      else if (n === 't') r += '\t';
      else if (n === 'r') r += '\r';
      else r += n;                                   // \\ \' \" \/ ...
    }
    return r;
  }

  // x-data="singleProduct(JSON.parse('{...}'))" i @click="choose(JSON.parse('{...}'))"
  function izJsonParse(atribut) {
    const m = String(atribut || '').match(/JSON\.parse\(\s*'([\s\S]*)'\s*\)/);
    if (!m) return null;
    try { return JSON.parse(jsTekst(m[1])); } catch (e) { return null; }
  }

  // Alpine podaci komponente (na martimex.hr: odabrana varijanta "uživo")
  function alpinePodaci(el) {
    try {
      const A = window.Alpine;
      if (A && typeof A.$data === 'function') return A.$data(el) || null;
    } catch (e) { /* nema Alpinea */ }
    return null;
  }

  function jsonLdProizvod() {
    const skripte = document.querySelectorAll('script[type="application/ld+json"]');
    for (let i = 0; i < skripte.length; i++) {
      let d;
      try { d = JSON.parse(skripte[i].textContent || ''); } catch (e) { continue; }
      const lista = [].concat(d && d['@graph'] ? d['@graph'] : d);
      for (let j = 0; j < lista.length; j++) {
        const x = lista[j];
        if (x && (x['@type'] === 'Product' || ([].concat(x['@type'] || [])).indexOf('Product') !== -1)) return x;
      }
    }
    return null;
  }

  function apsolutno(url) {
    if (!url) return '';
    try { return new URL(url, location.href).href; } catch (e) { return ''; }
  }

  function adresaStranice() {
    const kan = document.querySelector('link[rel="canonical"]');
    const url = apsolutno(kan && kan.getAttribute('href')) || location.href;
    return url.replace(/[?#].*$/, '');
  }

  function sekcijaProizvoda() {
    return document.querySelector('section.product[x-data*="singleProduct"]') ||
      document.querySelector('section.product');
  }

  // Sve varijante sa stranice (sve gumbe: odabrana može biti i zadnja; koliko
  // ih se šalje Marti, ograničava se tek kod slanja, vidi procitajArtikl)
  function varijanteSaStranice(sekcija) {
    const gumbi = sekcija.querySelectorAll('.js-var-btn');
    const lista = [];
    for (let i = 0; i < gumbi.length; i++) {
      const g = gumbi[i];
      const id = g.getAttribute('data-variation-id') || '';
      const podaci = izJsonParse(g.getAttribute('@click') || g.getAttribute('x-on:click')) || {};
      const naziv = cistTekst(g.getAttribute('data-var-color') || podaci.color || g.getAttribute('data-var-name') ||
        podaci.label || podaci.name || tekst(g.querySelector('.product__single-variation-size')) || '');
      if (!naziv) continue;
      const okvir = id ? sekcija.querySelector('.js-var-price[data-price-var-id="' + id + '"]') : null;
      const cijena = uBroj(g.getAttribute('data-var-price')) !== null ? uBroj(g.getAttribute('data-var-price'))
        : uBroj(podaci.price !== undefined ? podaci.price : tekst(okvir && okvir.querySelector('h2')));
      const stara = okvir ? uBroj(tekst(okvir.querySelector('h4'))) : null;
      const v = {
        id: id,
        naziv: naziv,
        cijena: cijena,
        dostupno: typeof podaci.inStock === 'boolean' ? podaci.inStock : null,
        akcija: g.getAttribute('data-var-on-sale') === '1' || podaci.onSale === true,
        slika: apsolutno(g.getAttribute('data-var-image-full') || podaci.imageFull || ''),
        aktivna: g.classList.contains('active')
      };
      if (stara !== null && cijena !== null && stara > cijena) v.stara_cijena = stara;
      lista.push(v);
    }
    return lista;
  }

  // Tekst elementa po retcima: svaki odlomak, redak (<br>) i stavka popisa
  // je zaseban redak. Ne ovisi o tome je li element vidljiv (skrivene
  // kartice opisa), za razliku od innerText.
  const BLOK = /^(P|DIV|LI|UL|OL|H[1-6]|TR|TABLE|TBODY|SECTION|ARTICLE|BLOCKQUOTE|DL|DT|DD|FIGCAPTION|HEADER|FOOTER|PRE)$/;
  function retciTeksta(el) {
    const retci = [];
    let red = '';
    function novi() { retci.push(red); red = ''; }
    (function hodaj(n) {
      for (let c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { red += c.nodeValue; continue; }
        if (c.nodeType !== 1) continue;
        const t = String(c.tagName).toUpperCase();
        if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|BUTTON|SVG|IMG|IFRAME)$/.test(t)) continue;
        if (c.classList && c.classList.contains('product__show-description')) continue;   // "Pročitaj više"
        if (t === 'BR') { novi(); continue; }
        if (t === 'TD' || t === 'TH') { red += ' '; hodaj(c); red += ' '; continue; }   // ćelije tablice se ne lijepe
        const blok = BLOK.test(t);
        if (blok) novi();
        hodaj(c);
        if (blok) novi();
      }
    })(el);
    novi();
    return retci.map(function (r) { return r.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
  }

  // Opis proizvoda kao popis redaka. Na martimex.hr postoje dva rasporeda:
  //  - jedan blok "Opis proizvoda" (.product__description)
  //  - kartice "Opis / Prednosti / Upotreba..." (.product__description-tabs;
  //    na mobitelu iste kartice kao harmonika) — tada svaki dio dobije naslov
  // Ima li stranica oboje, ide blok pa kartice.
  function opisSaStranice(sekcija) {
    const blok = sekcija.querySelector('.product__description .post-content') || sekcija.querySelector('.product__description');
    const izBloka = blok ? retciTeksta(blok) : [];
    const kartice = sekcija.querySelector('.product__description-tabs');
    if (!kartice) return izBloka;
    return izBloka.concat(opisIzKartica(kartice));
  }
  function opisIzKartica(kartice) {
    let retci = [];
    const gumbi = kartice.querySelectorAll('.product__description-tabs-nav-btn');
    for (let i = 0; i < gumbi.length; i++) {
      const id = gumbi[i].getAttribute('data-tab-id');
      const dio = id && kartice.querySelector('.product__description-tabs-content-item[id="' + id + '"]');
      if (!dio) continue;
      const tekstDijela = retciTeksta(dio.querySelector('.post-content') || dio);
      if (!tekstDijela.length) continue;
      const naslov = tekst(gumbi[i]).replace(/[:\s]+$/, '');
      retci = retci.concat(naslov ? [naslov + ':'] : [], tekstDijela);
    }
    if (retci.length) return retci;
    // samo harmonika (bez gumba kartica)
    const dijelovi = kartice.querySelectorAll('.product__description-tabs-faq');
    for (let j = 0; j < dijelovi.length; j++) {
      const sadrzaj = dijelovi[j].querySelector('.product__description-tabs-faq-content');
      const tekstDijela = sadrzaj ? retciTeksta(sadrzaj.querySelector('.post-content') || sadrzaj) : [];
      if (!tekstDijela.length) continue;
      const naslov = tekst(dijelovi[j].querySelector('.product__description-tabs-faq-header h4, .product__description-tabs-faq-header')).replace(/[:\s]+$/, '');
      retci = retci.concat(naslov ? [naslov + ':'] : [], tekstDijela);
    }
    if (retci.length) return retci;
    return retciTeksta(kartice);
  }

  function procitajArtikl() {
    const sekcija = sekcijaProizvoda();
    if (!sekcija) return null;

    const xd = izJsonParse(sekcija.getAttribute('x-data')) || {};
    const zivo = alpinePodaci(sekcija) || {};
    const proizvod = Object.assign({}, xd.product || {}, zivo.product || {});
    const ld = jsonLdProizvod() || {};

    const naziv = tekst(sekcija.querySelector('.product__title-wrap h1, h1')) || cistTekst(proizvod.name) || cistTekst(ld.name);
    if (!naziv) return null;

    // marka: Alpine/x-data, JSON-LD ili poveznica na stranicu marke (/brand/versace/)
    let marka = cistTekst(proizvod.brandName) || cistTekst(ld.brand && (ld.brand.name || ld.brand));
    if (!marka) {
      const a = sekcija.querySelector('.product__title-wrap a[href*="/brand/"]');
      const m = a && a.getAttribute('href').match(/\/brand\/([^\/?#]+)/);
      if (m) marka = decodeURIComponent(m[1]).replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    // putanja: Početna › Parfemi › Toaletne vode › (ovaj artikl)
    const putanja = [].map.call(sekcija.querySelectorAll('.breadcrumbs__item a'), tekst)
      .filter(function (t) { return t && !/^po[cč]etna$/i.test(t); });

    const varijante = varijanteSaStranice(sekcija);

    // odabrana varijanta: označeni gumb (ono što kupac vidi) → Alpine → x-data
    let odabrana = varijante.filter(function (v) { return v.aktivna; })[0] || null;
    const idZivo = zivo.variation && zivo.variation.id !== undefined ? String(zivo.variation.id) : '';
    if (!odabrana && idZivo) odabrana = varijante.filter(function (v) { return v.id === idZivo; })[0] || null;
    if (!odabrana && xd.variation && xd.variation.id !== undefined) {
      odabrana = varijante.filter(function (v) { return v.id === String(xd.variation.id); })[0] || null;
    }
    const idVar = odabrana ? odabrana.id : '';

    // cijena kako je prikazana (na akciji: h2 = nova, h4 = stara)
    const okvirCijene = (idVar && sekcija.querySelector('.js-var-price[data-price-var-id="' + idVar + '"]')) ||
      sekcija.querySelector('.product__price-wrap .product__price:not(.d-none)') ||
      sekcija.querySelector('.product__price');
    const cijena = uBroj(tekst(okvirCijene && okvirCijene.querySelector('h2'))) !== null
      ? uBroj(tekst(okvirCijene.querySelector('h2')))
      : (odabrana && odabrana.cijena !== null ? odabrana.cijena : uBroj(proizvod.price !== undefined ? proizvod.price : (ld.offers && ld.offers.price)));
    let stara = uBroj(tekst(okvirCijene && okvirCijene.querySelector('h4')));
    if (stara !== null && cijena !== null && !(stara > cijena)) stara = null;

    const najnizaEl = (idVar && sekcija.querySelector('.js-lowest-price[data-lowest-price-var-id="' + idVar + '"] span')) ||
      sekcija.querySelector('.lowest-price:not(.d-none) span');
    const skuEl = (idVar && sekcija.querySelector('.js-var-sku[data-sku-var-id="' + idVar + '"]')) ||
      sekcija.querySelector('.js-var-sku:not(.d-none)') || sekcija.querySelector('.js-var-sku');

    // dostupnost: podaci odabrane varijante → Alpine → x-data → obavijest "nije na stanju"
    let dostupno = null;
    if (odabrana && typeof odabrana.dostupno === 'boolean') dostupno = odabrana.dostupno;
    else if (idZivo && idZivo === idVar && typeof zivo.variation.inStock === 'boolean') dostupno = zivo.variation.inStock;
    else if (xd.variation && String(xd.variation.id) === idVar && typeof xd.variation.inStock === 'boolean') dostupno = xd.variation.inStock;
    else if (!varijante.length && typeof proizvod.inStock === 'boolean') dostupno = proizvod.inStock;
    const obavijest = sekcija.querySelector('.product__variations-no-variation-stock-notice');
    if (dostupno === null && obavijest) dostupno = obavijest.classList.contains('d-none');
    // raspored "nije na stanju" (umjesto košarice "Obavijesti me kada bude dostupan")
    if (dostupno === null && sekcija.querySelector('.product__out-of-stock')) dostupno = false;

    const glavnaSlika = sekcija.querySelector('.js-featured-image');
    const slika = (odabrana && odabrana.slika) ||
      apsolutno(glavnaSlika && (glavnaSlika.currentSrc || glavnaSlika.getAttribute('src'))) ||
      apsolutno(proizvod.image) || apsolutno(typeof ld.image === 'string' ? ld.image : (ld.image && ld.image[0]));

    // opis: odlomci i retci (<p>, <br>, popisi) ostaju odvojeni, da se ne slijepe
    let opis = opisSaStranice(sekcija)
      .reduce(function (s, r) { return !s ? r : s + (/[.!?:;,]$/.test(s) ? ' ' : '; ') + r; }, '');
    // predug opis se skrati na cijelu riječ, s tri točke
    if (opis.length > P.maxOpis) opis = opis.slice(0, P.maxOpis).replace(/\s+\S*$/, '').replace(/[\s,;:–-]+$/, '') + '…';

    const pogodnosti = [].map.call(sekcija.querySelectorAll('.product__benefits-single h5, .product__benefits-single'), tekst)
      .filter(function (t, i, svi) { return t && svi.indexOf(t) === i; }).slice(0, 6);

    const artikl = {
      v: 1,
      id: proizvod.id !== undefined ? String(proizvod.id) : '',
      varijacija_id: idVar,
      naziv: naziv,
      marka: String(marka || '').trim(),
      vrsta: cistTekst(proizvod.category) || tekst(sekcija.querySelector('.product__sku-wrap h5')) || cistTekst(ld.category),
      kategorija: putanja.join(' › '),
      glavna_kategorija: cistTekst(proizvod.categoryMain) || putanja[0] || '',
      varijanta: odabrana ? odabrana.naziv : '',
      cijena: cijena,
      stara_cijena: stara,
      najniza_cijena_30_dana: tekst(najnizaEl),
      dostupno: dostupno,
      sku: tekst(skuEl).replace(/^SKU:\s*/i, ''),
      slika: slika,
      url: adresaStranice(),
      opis: opis,
      pogodnosti: pogodnosti,
      // najviše maxVarijanti, ali odabrana ide uvijek
      varijante: varijante.filter(function (v, i) { return i < P.maxVarijanti || v === odabrana; }).map(function (v) {
        const r = { naziv: v.naziv, cijena: v.cijena };
        if (v.stara_cijena) r.stara_cijena = v.stara_cijena;
        if (v.dostupno !== null) r.dostupno = v.dostupno;
        return r;
      })
    };
    return artikl;
  }

  function kljucArtikla(a) {
    return (a.id || a.naziv) + '|' + (a.varijacija_id || a.varijanta || '');
  }

  // ── 3. VEZA S CHATOM ───────────────────────────────────────────────────
  function korijenChata() {
    const h = document.getElementById(HOST);
    return h && h.shadowRoot;
  }

  // Chat je spreman kad postoji prozor i Voiceflowov gumb za početak
  // razgovora — ili razgovor već traje (tada Voiceflow taj gumb makne)
  function chatSpreman() {
    const kor = korijenChata();
    const vc = window.voiceflow && window.voiceflow.chat;
    if (!kor || !vc || typeof vc.open !== 'function') return null;
    if (!kor.querySelector(PROZOR)) return null;
    if (!kor.querySelector(START) && !razgovorTraje(kor)) return null;
    return kor;
  }

  function razgovorTraje(kor) {
    const ploca = kor.querySelector('.vfrc-footer__start-button');
    return !!(ploca && ploca.hasAttribute('inert')) || imaRazgovor(kor);
  }

  function cekajChat(ms) {
    return new Promise(function (gotovo) {
      const pocetak = Date.now();
      (function trazi() {
        const kor = chatSpreman();
        if (kor) { gotovo(kor); return; }
        if (Date.now() - pocetak >= ms) { gotovo(null); return; }
        setTimeout(trazi, 100);
      })();
    });
  }

  function cekajUvjet(uvjet, ms) {
    return new Promise(function (gotovo) {
      const pocetak = Date.now();
      (function provjeri() {
        let ok = false;
        try { ok = !!uvjet(); } catch (e) { ok = false; }
        if (ok || Date.now() - pocetak >= ms) { gotovo(ok); return; }
        setTimeout(provjeri, 40);
      })();
    });
  }

  // sljedeći iscrtani okvir (u kartici u pozadini okviri stoje, pa najviše 100 ms)
  function sljedeciOkvir() {
    return new Promise(function (gotovo) {
      let bilo = false;
      function dalje() { if (!bilo) { bilo = true; setTimeout(gotovo, 0); } }
      requestAnimationFrame(dalje);
      setTimeout(dalje, 100);
    });
  }

  // Razgovor ne traje: Voiceflow tada pokazuje svoj gumb za početak razgovora
  // (na kraju razgovora "Start new chat"; prije prvog razgovora skriveni)
  function cekaPocetak(kor) {
    const g = kor.querySelector(START);
    if (!g || !g.parentElement) return false;
    const ploca = g.closest('.vfrc-footer__start-button') || g.parentElement;
    if (ploca.hasAttribute('inert')) return false;
    const sg = getComputedStyle(g), sp = getComputedStyle(ploca);
    return sg.display !== 'none' && sp.display !== 'none' && sp.visibility !== 'hidden' && sp.pointerEvents !== 'none';
  }

  // Postoji li razgovor (prikazan u prozoru ili spremljen u pregledniku)
  function imaRazgovor(kor) {
    if (kor.querySelector(PROZOR + ' .vfrc-system-response, ' + PROZOR + ' .vfrc-user-response')) return true;
    try {
      const spremista = [window.sessionStorage, window.localStorage];
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

  // ── 3b. ZASTARJELI RAZGOVOR ───────────────────────────────────────────
  // Voiceflow razgovor završi nakon 30 minuta bez poruka, ali preglednik ga
  // i dalje pamti (sessionStorage ili localStorage, ključ
  // "voiceflow-session-<projekt>") i pri učitavanju stranice opet pokaže.
  // Događaj poslan u takav razgovor ne dobije nikakav odgovor: Voiceflow
  // tada počne novi razgovor, a događaj u njemu nema što pokrenuti, pa u
  // chatu ništa ne stigne. Zato:
  //  - pri učitavanju stranice zastarjeli zapamćeni razgovor se obriše
  //    (prije nego ga chat pročita), pa chat kreće iznova i gumb pokrene
  //    razgovor s artiklom kao i prvi put,
  //  - ako razgovor zastari dok je stranica otvorena, gumb umjesto
  //    događaja pokrene novi razgovor s artiklom (Voiceflowovim "Restart
  //    conversation": dosadašnje poruke se obrišu, kao kad kupac sam
  //    pokrene novi razgovor).
  // Razgovor se smatra zastarjelim P.razgovorTraje nakon zadnje poruke —
  // malo prije nego ga Voiceflow stvarno završi.
  let zadnjaAktivnost = 0;        // kad je na ovoj stranici zadnji put nešto poslano Voiceflowu ili stiglo u chat (koliko modul zna)
  let obrisanPriUcitavanju = false;
  function zabiljeziAktivnost() { zadnjaAktivnost = Date.now(); }
  // Chat javlja prozoru otvaranje i zatvaranje ('voiceflow:open' /
  // 'voiceflow:close'); chat iz paketa react-chat javlja i svaku interakciju
  // ('voiceflow:interact'), widget-next ne — za njega aktivnost broje nove
  // poruke u otvorenom chatu (pratiAktivnost) i zapamćeni razgovor.
  let chatOtvoren = false, brojPoruka = -1, promatracPoruka = null;
  function brojPorukaUChatu(kor) {
    return kor.querySelectorAll(PROZOR + ' .vfrc-user-response, ' + PROZOR + ' .vfrc-system-response').length;
  }
  window.addEventListener('message', function (e) {
    if (e.source && e.source !== window) return;
    let d = e.data;
    if (typeof d === 'string') {
      if (d.indexOf('voiceflow:') === -1) return;
      try { d = JSON.parse(d); } catch (x) { return; }
    }
    if (!d || typeof d.type !== 'string') return;
    if (d.type === 'voiceflow:interact') zabiljeziAktivnost();
    else if (d.type === 'voiceflow:open') { chatOtvoren = true; const kor = korijenChata(); brojPoruka = kor ? brojPorukaUChatu(kor) : -1; }
    else if (d.type === 'voiceflow:close') chatOtvoren = false;
  });
  // Dok je chat otvoren, svaka nova poruka u njemu (kupčeva ili Martina) je
  // aktivnost — i kad kupac razgovara sam, bez gumba. Pri učitavanju
  // stranice chat je zatvoren i samo iscrtava zapamćeni razgovor: to se ne
  // broji.
  function pratiAktivnost(kor) {
    if (promatracPoruka) return;
    promatracPoruka = new MutationObserver(function () {
      const n = brojPorukaUChatu(kor);
      if (brojPoruka === -1) { brojPoruka = n; return; }
      if (n === brojPoruka) return;
      brojPoruka = n;
      if (chatOtvoren) zabiljeziAktivnost();
    });
    promatracPoruka.observe(kor, { childList: true, subtree: true });
  }

  // zapamćeni razgovori u pregledniku (s barem jednom porukom)
  function zapamceniRazgovori() {
    const nadjeni = [];
    try {
      const spremista = [window.sessionStorage, window.localStorage];
      for (let s = 0; s < spremista.length; s++) {
        const sp = spremista[s];
        if (!sp) continue;
        for (let i = 0; i < sp.length; i++) {
          const kljuc = sp.key(i);
          if (!kljuc || kljuc.indexOf('voiceflow-session-') !== 0) continue;
          let sesija = null;
          try { sesija = JSON.parse(sp.getItem(kljuc) || 'null'); } catch (e) { sesija = null; }
          if (sesija && Array.isArray(sesija.turns) && sesija.turns.length) nadjeni.push({ spremiste: sp, kljuc: kljuc, sesija: sesija });
        }
      }
    } catch (e) { /* spremište nedostupno (npr. zabranjeni kolačići) */ }
    return nadjeni;
  }

  // vrijeme zadnje poruke u zapamćenom razgovoru (ms); 0 ako se ne zna
  function zadnjaPoruka(sesija) {
    let t = 0;
    function uzmi(v) {
      const n = typeof v === 'number' ? v : (typeof v === 'string' ? Date.parse(v) : NaN);
      if (isFinite(n) && n > t) t = n;
    }
    uzmi(sesija.lastReceivedAt);
    uzmi(sesija.startTime);
    for (let i = 0; i < sesija.turns.length; i++) if (sesija.turns[i]) uzmi(sesija.turns[i].timestamp);
    return t;
  }

  // Je li razgovor koji chat pokazuje zastario (Voiceflow ga je već završio)
  function razgovorZastario() {
    let t = zadnjaAktivnost;
    const razgovori = zapamceniRazgovori();
    for (let i = 0; i < razgovori.length; i++) t = Math.max(t, zadnjaPoruka(razgovori[i].sesija));
    if (t) return Date.now() - t > P.razgovorTraje;
    // ne zna se kad je bila zadnja poruka: zastario je samo ako je pri
    // učitavanju obrisan zastarjeli razgovor, a chat ga je ipak pokazao
    return obrisanPriUcitavanju;
  }

  // Pri učitavanju stranice: zastarjeli zapamćeni razgovor se briše prije
  // nego ga chat pročita (modul se izvršava prije Voiceflowove skripte)
  (function obrisiZastarjeli() {
    zapamceniRazgovori().forEach(function (z) {
      const t = zadnjaPoruka(z.sesija);
      if (!t || Date.now() - t <= P.razgovorTraje) return;
      try { z.spremiste.removeItem(z.kljuc); } catch (e) { return; }
      obrisanPriUcitavanju = true;
      // da se chat ne otvori sam, prazan
      [window.sessionStorage, window.localStorage].forEach(function (sp) {
        try { if (sp) sp.removeItem('voiceflow-chat-widget:is-open'); } catch (e) { /* nije bitno */ }
      });
      zapis('zastarjeli razgovor obrisan (zadnja poruka ' + new Date(t).toLocaleString() + ')');
    });
  })();

  function otvoriChat() {
    if (!chatPostoji()) return;
    try { window.voiceflow.chat.open(); } catch (e) { console.warn('[Martimex] Pitaj Marti: chat se nije otvorio', e); }
  }

  // Je li Voiceflowov chat uopće na stranici (npr. blokator oglasa ga može
  // blokirati ili se nije učitao)
  function chatPostoji() {
    const vc = window.voiceflow && window.voiceflow.chat;
    return !!(vc && typeof vc.open === 'function' && document.getElementById(HOST));
  }

  // Gumb se vidi samo kad chat postoji ili se upravo učitava:
  //  - Voiceflowova skripta još nije ni zatražena (na martimex.hr se chat
  //    učita tek kad kupac prihvati kolačiće) → gumb je skriven, pa se
  //    pojavi čim se chat počne učitavati
  //  - skripta se učitava → gumb se vidi (pritisak pričeka chat)
  //  - chata nema ni nakon P.cekajChat ms (blokator oglasa, Voiceflow ne
  //    radi) → gumb se sakrije; vrati se ako se chat ipak učita
  const VF_SKRIPTA = 'script[src*="cdn.voiceflow.com/widget"]';
  let pratiChat = 0, skriptaOd = 0;
  function pokaziGumb(da) {
    if (!omotGumba) return;
    const skriven = omotGumba.style.display === 'none';
    if (da && skriven) {
      omotGumba.style.display = '';
      uskladiSaKosaricom(omotGumba, sekcijaProizvoda() || omotGumba.parentNode);
      zapis('gumb prikazan');
    } else if (!da && !skriven) {
      omotGumba.style.display = 'none';
      zapis('chata nema — gumb skriven');
    }
  }
  function provjeriChat() {
    if (chatPostoji()) {
      pokaziGumb(true);
      const kor = korijenChata();
      if (kor) {
        pratiAktivnost(kor);
        clearInterval(pratiChat); pratiChat = 0;   // chat je tu i ostaje
      }
      return;
    }
    if (!document.querySelector(VF_SKRIPTA)) { skriptaOd = 0; pokaziGumb(false); return; }
    if (!skriptaOd) skriptaOd = Date.now();
    pokaziGumb(Date.now() - skriptaOd < P.cekajChat);
  }
  function pratiDostupnostChata() {
    provjeriChat();
    if (!pratiChat && !(chatPostoji() && korijenChata())) pratiChat = setInterval(provjeriChat, 1000);
  }

  // ── 4. PRAĆENJE ODGOVORA ──────────────────────────────────────────────
  // Gleda pojavljuje li se u chatu NOVA kartica artikla ili NOVO Martino
  // pitanje, i kad stigne prva nova Martina poruka (bilo koja, npr. obični
  // pozdrav). Nova je samo poruka (element) koje u chatu nije bilo kad je
  // praćenje počelo — pa prijašnja poruka koja se još ispisuje slovo po
  // slovo (i tek sad dovrši isto pitanje) ne zavara — i broj ih mora biti
  // veći nego na početku, pa ne zavara ni ponovno iscrtavanje starih poruka.
  function pratiOdgovor(kor) {
    const SVE = KARTICA + ', ' + ODGOVOR + ' ' + PORUKA;   // kartice i poruke u Martinim odgovorima (točkice "piše..." nisu poruka)
    function jeKartica(el) { return el.matches ? el.matches(KARTICA) : false; }
    function pitanjaU(t) {
      let n = 0, i = -1;
      while ((i = t.indexOf(P.pitanje, i + 1)) !== -1) n++;
      return n;
    }
    function pitanja() { return pitanjaU((kor.querySelector(PROZOR) || kor).textContent || ''); }
    const bile = new Set(kor.querySelectorAll(SVE));
    let pocetnoKartica = 0, pocetnoPoruka = 0;
    bile.forEach(function (el) { if (jeKartica(el)) pocetnoKartica++; else pocetnoPoruka++; });
    let pocetnoPitanja = pitanja();
    const stanje = { kartica: null, pitanje: null, odgovor: 0, promatrac: null };
    function provjeri() {
      const sad = kor.querySelectorAll(SVE);
      let kartica = 0, poruka = 0;
      const nove = [];
      for (let i = 0; i < sad.length; i++) {
        if (jeKartica(sad[i])) kartica++; else poruka++;
        if (!bile.has(sad[i])) nove.push(sad[i]);
      }
      const np = pitanja();
      // kad chat obriše dosadašnje poruke (novi razgovor), broji se od nule
      if (kartica < pocetnoKartica) pocetnoKartica = kartica;
      if (poruka < pocetnoPoruka) pocetnoPoruka = poruka;
      if (np < pocetnoPitanja) pocetnoPitanja = np;
      for (let j = 0; j < nove.length; j++) {
        const el = nove[j];
        if (jeKartica(el)) {
          if (!stanje.kartica && kartica > pocetnoKartica) stanje.kartica = el;
          continue;
        }
        if (!stanje.odgovor && poruka > pocetnoPoruka) stanje.odgovor = Date.now();
        if (!stanje.pitanje && np > pocetnoPitanja && pitanjaU(el.textContent || '')) stanje.pitanje = el;
      }
    }
    stanje.promatrac = new MutationObserver(provjeri);
    stanje.promatrac.observe(kor, { childList: true, subtree: true, characterData: true });
    stanje.stani = function () { if (stanje.promatrac) stanje.promatrac.disconnect(); stanje.promatrac = null; };
    return stanje;
  }

  // Marti upravo "piše" (Voiceflowove točkice): odgovor tek stiže
  function martiPise(kor) { return !!kor.querySelector(TIPKANJE); }

  // Voiceflow javlja završenu interakciju porukom '{"type":"voiceflow:interact", ...}'
  function cekajInterakciju(tip, ms) {
    return new Promise(function (gotovo) {
      let kraj = false;
      function slusaj(e) {
        if (e.source && e.source !== window) return;
        let d = e.data;
        if (typeof d === 'string') {
          if (d.indexOf('voiceflow:interact') === -1) return;
          try { d = JSON.parse(d); } catch (x) { return; }
        }
        if (!d || d.type !== 'voiceflow:interact') return;
        const akcija = d.payload && d.payload.action;
        if (tip && akcija && akcija.type && akcija.type !== tip) return;
        zavrsi(true);
      }
      function zavrsi(ok) {
        if (kraj) return;
        kraj = true;
        window.removeEventListener('message', slusaj);
        gotovo(ok);
      }
      window.addEventListener('message', slusaj);
      setTimeout(function () { zavrsi(false); }, ms);
    });
  }

  // ── 5. SLANJE ARTIKLA ──────────────────────────────────────────────────
  let zadnji = null;           // { kljuc, kartica } — zadnji artikl koji je Marti prikazala (kartica ili pitanje u chatu)

  // "put" u podacima kaže kojim je putem artikl poslan (vidi se u
  // Voiceflowovu transkriptu, pomaže kod otklanjanja grešaka): launch,
  // dogadaj, launch-novi (zastarjeli razgovor), launch-rezerva, dogadaj-rezerva
  function sPutem(artikl, put) { return Object.assign({}, artikl, { put: put }); }

  // Ključ zadnjeg artikla pamti se i u pregledniku (dok je kartica otvorena),
  // pa se ni nakon novog učitavanja stranice isti artikl ne šalje dvaput
  const KLJUC_ZADNJEG = 'mx-pm-zadnji';
  function zapamti(artikl, prati) {
    zadnji = { kljuc: kljucArtikla(artikl), kartica: prati.kartica || prati.pitanje };
    try { sessionStorage.setItem(KLJUC_ZADNJEG, zadnji.kljuc); } catch (e) { /* nije bitno */ }
  }
  function zaboraviZadnjeg() {
    zadnji = null;
    try { sessionStorage.removeItem(KLJUC_ZADNJEG); } catch (e) { /* nije bitno */ }
  }
  // Zadnji artikl: iz ovog učitavanja stranice, ili iz prošlog ako je
  // njegova kartica (zadnja u razgovoru) i dalje tu
  function zadnjiArtikl(kor) {
    if (zadnji) return zadnji;
    let kljuc = '';
    try { kljuc = sessionStorage.getItem(KLJUC_ZADNJEG) || ''; } catch (e) { return null; }
    if (!kljuc) return null;
    const kartice = kor.querySelectorAll(PROZOR + ' ' + KARTICA);
    return kartice.length ? { kljuc: kljuc, kartica: kartice[kartice.length - 1] } : null;
  }

  function posaljiDogadaj(artikl, put) {
    zapis('događaj', P.dogadaj, '(' + put + ')', artikl);
    zabiljeziAktivnost();
    window.voiceflow.chat.interact({
      type: 'event',
      payload: { event: { name: P.dogadaj, pitaj_marti: sPutem(artikl, put) } }
    });
  }

  // Launch kroz interact — isto što pošalje gumb za početak razgovora, samo
  // što dosadašnje poruke ostaju u prozoru. (Chat iz paketa react-chat to
  // podržava; widget-next takav launch zanemari, pa je za njega tu
  // ponovnoPokreni.)
  function posaljiLaunch(artikl, put) {
    zapis('launch kroz interact', '(' + put + ')', artikl);
    zabiljeziAktivnost();
    window.voiceflow.chat.interact({
      type: 'launch',
      payload: Object.assign({}, LAUNCH.payload, artikl ? { pitaj_marti: sPutem(artikl, put) } : {})
    });
  }

  // Voiceflowov "Restart conversation" (gumb u izborniku chata, pa potvrda
  // "Start new chat"): chat obriše dosadašnje poruke i pokrene novi
  // razgovor svojom postavkom launch — a ona nosi ARTIKL. Gumb je u DOM-u i
  // dok se ne vidi; potvrda je obično također (skrivena), a ako je chat
  // iscrta tek nakon pritiska, pričeka se. Vraća true ako je pokrenuto.
  const RESTART = '#restart-chat';
  const POTVRDA = '.vfrc-prompt';
  async function ponovnoPokreni(kor) {
    const restart = kor.querySelector(RESTART);
    if (!restart) return false;
    try { restart.click(); } catch (e) { return false; }
    // potvrda se pojavi (pointer-events: auto) u sljedećem okviru; klik
    // radi i prije nego što se do kraja pokaže
    let potvrda = null;
    await cekajUvjet(function () {
      potvrda = kor.querySelector(POTVRDA);
      return !!potvrda && getComputedStyle(potvrda).pointerEvents !== 'none';
    }, 800);
    if (!potvrda) potvrda = kor.querySelector(POTVRDA);
    if (!potvrda) return false;
    const gumbi = potvrda.querySelectorAll('button');
    let gumb = null;
    for (let i = 0; i < gumbi.length; i++) {
      const t = ((gumbi[i].getAttribute('aria-label') || '') + ' ' + (gumbi[i].getAttribute('label') || '') + ' ' + (gumbi[i].textContent || '')).toLowerCase();
      if (/cancel|odustani/.test(t)) continue;
      if (/start new chat|zapo[cč]ni|novi razgovor|restart/.test(t)) { gumb = gumbi[i]; break; }
    }
    if (!gumb) gumb = gumbi[0] || null;
    if (!gumb) return false;
    try { gumb.click(); } catch (e) { return false; }
    return true;
  }

  // Nakon launcha: čeka se kartica ili pitanje. Ako umjesto njih stigne
  // neki drugi odgovor (npr. obični pozdrav) ili Voiceflow javi da je
  // launch gotov, pričeka se još malo pa se odustane (tada ide rezerva).
  function cekajKarticu(prati, launchGotov) {
    let gotov = 0;
    launchGotov.then(function (ok) { if (ok) gotov = Date.now(); });
    return cekajUvjet(function () {
      if (prati.kartica || prati.pitanje) return true;
      const prvi = gotov && prati.odgovor ? Math.min(gotov, prati.odgovor) : (gotov || prati.odgovor);
      return !!prvi && Date.now() - prvi > 2000;
    }, P.cekajOdgovor);
  }

  // Razgovor ne postoji (ili je završen): pokrene se novi, a launch nosi artikl
  async function pokreniSArtiklom(kor, artikl) {
    upisiArtikl(sPutem(artikl, 'launch'));
    const prati = pratiOdgovor(kor);
    const launchGotov = cekajInterakciju('launch', P.cekajOdgovor);

    if (cekaPocetak(kor)) {
      zapis('launch s artiklom');
      try { kor.querySelector(START).click(); } catch (e) { /* nije bitno */ }
    }
    zabiljeziAktivnost();
    await cekajUvjet(function () { return !cekaPocetak(kor); }, 2000);
    otvoriChat();

    await cekajKarticu(prati, launchGotov);
    isprazniArtikl();
    prati.stani();

    if (prati.kartica || prati.pitanje) {
      zapis('artikl stigao uz launch');
      zapamti(artikl, prati);
      return;
    }
    // Voiceflow nije poslao artikl uz launch (ili odgovor kasni): rezerva je događaj
    zapis('rezerva: artikl nije stigao uz launch, šaljem događaj');
    await posaljiIPrati(kor, artikl, 'dogadaj-rezerva', false);
  }

  // Događaj, pa čekanje kartice. Ako na događaj ne stigne baš ništa — ni
  // kartica, ni bilo kakav Martin odgovor, ni Martino tipkanje (tako prođe
  // događaj poslan u razgovor koji je Voiceflow u međuvremenu završio) — i
  // rezerva je dopuštena, pokrene se novi razgovor s artiklom. Dok Marti
  // piše, čeka se (najviše P.cekajNajduze); ako odgovori nečim drugim bez
  // kartice, još se malo pričeka pa se odustane.
  async function posaljiIPrati(kor, artikl, put, rezerva) {
    const prati = pratiOdgovor(kor);
    posaljiDogadaj(artikl, put);
    const pocetak = Date.now();
    await cekajUvjet(function () {
      if (prati.kartica || prati.pitanje) return true;
      const sad = Date.now();
      if (prati.odgovor) return sad - prati.odgovor >= P.cekajNakonOdgovora;
      if (martiPise(kor)) return false;
      return sad - pocetak >= (rezerva ? P.cekajDogadaj : P.cekajOdgovor);
    }, P.cekajNajduze);
    prati.stani();
    if (prati.kartica || prati.pitanje) { zapamti(artikl, prati); return; }
    zaboraviZadnjeg();
    if (prati.odgovor || !rezerva || martiPise(kor)) {
      zapis(prati.odgovor ? 'Marti je na događaj odgovorila bez kartice' : 'na događaj nije stigla kartica');
      return;
    }
    zapis('na događaj nije stigao nikakav odgovor: pokrećem novi razgovor s artiklom');
    await noviRazgovor(kor, artikl, 'launch-rezerva', true);
  }

  // Novi razgovor s artiklom dok chat još pokazuje dosadašnji: Voiceflowov
  // "Restart conversation" (vidi ponovnoPokreni) obriše dosadašnje poruke i
  // pokrene novi razgovor, a launch nosi artikl. Chat bez tog gumba
  // (react-chat) dobije launch kroz interact (dosadašnje poruke ostaju).
  // Ako ni tako ne stigne kartica, a rezerva je dopuštena, pošalje se
  // događaj (npr. kad launch ode bez artikla, pa stigne pozdrav).
  async function noviRazgovor(kor, artikl, put, rezerva) {
    upisiArtikl(sPutem(artikl, put));
    const prati = pratiOdgovor(kor);
    zabiljeziAktivnost();
    if (await ponovnoPokreni(kor)) zapis('novi razgovor Voiceflowovim "Restart conversation"', '(' + put + ')', artikl);
    else posaljiLaunch(artikl, put);
    await cekajUvjet(function () { return prati.kartica || prati.pitanje; }, P.cekajOdgovor);
    isprazniArtikl();
    prati.stani();
    if (prati.kartica || prati.pitanje) { zapis('artikl stigao uz novi razgovor'); zapamti(artikl, prati); return; }
    zaboraviZadnjeg();
    if (!rezerva) { zapis('uz novi razgovor nije stigla kartica'); return; }
    zapis('rezerva: uz novi razgovor nije stigla kartica, šaljem događaj');
    await posaljiIPrati(kor, artikl, 'dogadaj-rezerva', false);
  }

  // Razgovor traje: chat se otvori, a artikl ide događajem
  async function posaljiUsredRazgovora(kor, artikl) {
    otvoriChat();
    await sljedeciOkvir();
    await posaljiIPrati(kor, artikl, 'dogadaj', true);
  }

  // Razgovor koji chat pokazuje je zastario (Voiceflow ga je zbog
  // neaktivnosti završio, pa događaj u njemu ne bi dobio odgovor): pokrene
  // se novi razgovor s artiklom
  async function pokreniIznova(kor, artikl) {
    otvoriChat();
    await sljedeciOkvir();
    // otvaranje je možda pokazalo Voiceflowov gumb za početak (razgovor
    // završen i u chatu): onda razgovor kreće njime
    if (cekaPocetak(kor)) { await pokreniSArtiklom(kor, artikl); return; }
    zapis('razgovor je zastario (Voiceflow ga je završio): novi razgovor s artiklom');
    await noviRazgovor(kor, artikl, 'launch-novi', true);
  }

  // Razgovor kreće otvaranjem chata (Voiceflowov autostart ili izgled
  // "jedan ekran"): launch nosi artikl
  async function otvoriSArtiklom(kor, artikl) {
    upisiArtikl(sPutem(artikl, 'launch'));
    const prati = pratiOdgovor(kor);
    const launchGotov = cekajInterakciju('launch', P.cekajOdgovor);
    zapis('launch s artiklom (otvaranjem chata)');
    zabiljeziAktivnost();
    otvoriChat();
    await cekajKarticu(prati, launchGotov);
    isprazniArtikl();
    prati.stani();
    if (prati.kartica || prati.pitanje) {
      zapis('artikl stigao uz launch');
      zapamti(artikl, prati);
      return;
    }
    zapis('rezerva: artikl nije stigao uz launch, šaljem događaj');
    await posaljiIPrati(kor, artikl, 'dogadaj-rezerva', false);
  }

  // Je li kartica zadnje što se u razgovoru dogodilo (kupac otad nije
  // ništa poslao); ako jest, isti artikl ne treba slati ponovno
  function karticaNaDnu(kor, kartica) {
    if (!kartica || !kartica.isConnected) return false;
    const kupac = kor.querySelectorAll(PROZOR + ' .vfrc-user-response');
    for (let i = kupac.length - 1; i >= 0; i--) {
      if (kartica.compareDocumentPosition(kupac[i]) & Node.DOCUMENT_POSITION_FOLLOWING) return false;
    }
    return true;
  }

  let radi = false;

  async function pritisak(gumb) {
    if (radi) return;
    if (!procitajArtikl()) { console.warn('[Martimex] Pitaj Marti: podaci o artiklu nisu pronađeni na stranici'); return; }
    radi = true;
    oznaciGumb(gumb, true);
    try {
      const kor = await cekajChat(P.cekajChat);
      if (!kor) {
        console.warn('[Martimex] Pitaj Marti: chat se nije učitao');
        otvoriChat();
        provjeriChat();
        return;
      }
      // artikl se čita tek sad: dok se chat učitavao, kupac je možda
      // promijenio veličinu ili nijansu
      const artikl = procitajArtikl();
      if (!artikl) { console.warn('[Martimex] Pitaj Marti: podaci o artiklu nisu pronađeni na stranici'); return; }
      pratiAktivnost(kor);
      const zastario = imaRazgovor(kor) && razgovorZastario();
      // isti artikl (ista varijanta) već je na dnu razgovora: chat se samo otvori
      const prosli = zadnjiArtikl(kor);
      if (!zastario && prosli && prosli.kljuc === kljucArtikla(artikl) && karticaNaDnu(kor, prosli.kartica) && !cekaPocetak(kor)) {
        zapis('isti artikl je već u razgovoru');
        otvoriChat();
        return;
      }
      if (cekaPocetak(kor)) await pokreniSArtiklom(kor, artikl);
      else if (!imaRazgovor(kor)) await otvoriSArtiklom(kor, artikl);
      else if (zastario) await pokreniIznova(kor, artikl);
      else await posaljiUsredRazgovora(kor, artikl);
    } catch (e) {
      console.warn('[Martimex] Pitaj Marti nije uspio:', e);
      isprazniArtikl();
    } finally {
      radi = false;
      oznaciGumb(gumb, false);
    }
  }

  // ── 6. GUMB NA STRANICI ────────────────────────────────────────────────
  const IKONA = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
    '<path class="mx-pm-iskra" d="M12 2.5c.5 4.6 2.4 7.6 7.5 8.9.4.1.4.6 0 .7-5.1 1.3-7 4.3-7.5 8.9-.1.4-.6.4-.7 0-.5-4.6-2.4-7.6-7.5-8.9-.4-.1-.4-.6 0-.7 5.1-1.3 7-4.3 7.5-8.9.1-.4.6-.4.7 0z"/>' +
    '<path class="mx-pm-iskra mx-pm-iskra-mala" d="M19.2 2.2c.2 1.5.8 2.4 2.4 2.8.2.1.2.3 0 .4-1.6.4-2.2 1.3-2.4 2.8 0 .2-.3.2-.4 0-.2-1.5-.8-2.4-2.4-2.8-.2-.1-.2-.3 0-.4 1.6-.4 2.2-1.3 2.4-2.8.1-.2.4-.2.4 0z"/>' +
    '</svg>';

  function ubaciStil() {
    if (document.getElementById('mx-pm-stil')) return;
    const B = P.boje;
    const stil = document.createElement('style');
    stil.id = 'mx-pm-stil';
    stil.textContent = `
      .mx-pm { margin: 16px 0 4px; box-sizing: border-box; }
      /* u sivoj ploči s gumbom za košaricu: razmak daje sama ploča */
      .mx-pm[data-uz="kosarica"] { margin: 0; }
      /* stranica Kontakt: ispod radnog vremena tekst, a ispod njega gumb
         preko cijele širine okvira "Kontakt podaci" */
      .mx-pm[data-uz="kontakt"] { display: flex; flex-direction: column; align-items: stretch; gap: 14px; margin: 24px 0 0; }
      .mx-pm[data-uz="kontakt"] .mx-pm-kontakt-tekst { margin: 0; }
      .mx-pm[data-uz="kontakt"] .mx-pm-gumb { width: 100%; min-height: 44px; text-transform: none; }
      .mx-pm-gumb {
        position: relative;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        width: var(--mx-pm-sirina, auto); max-width: 100%;
        min-height: var(--mx-pm-visina, 40px);
        margin: 0; padding: 7px 20px;
        box-sizing: border-box;
        border: 1px solid transparent;
        border-radius: var(--mx-pm-radijus, 4px);
        background: ${B.pozadina};
        color: ${B.tekst};
        font-family: var(--mx-pm-font, inherit);
        font-size: var(--mx-pm-velicina, 16px);
        font-weight: var(--mx-pm-debljina, 600);
        letter-spacing: var(--mx-pm-razmak, normal);
        text-transform: var(--mx-pm-velika, uppercase);
        line-height: 1.5;
        text-align: center;
        white-space: nowrap;
        cursor: pointer;
        -webkit-appearance: none; appearance: none;
        -webkit-tap-highlight-color: transparent;
        transition: background-color .2s ease;
      }
      /* miš iznad gumba (na mobitelu bi nakon dodira ostalo obojeno) */
      @media (hover: hover) {
        .mx-pm-gumb:hover { background: ${B.pozadinaMis}; }
      }
      .mx-pm-gumb:active { background: ${B.pozadinaMis}; }
      .mx-pm-gumb:focus-visible { outline: 0; box-shadow: 0 0 0 1px #fff, 0 0 0 3px ${B.pozadinaMis}; }
      .mx-pm-ikona { display: inline-flex; flex: none; width: 16px; height: 16px; }
      .mx-pm-ikona svg { display: block; width: 100%; height: 100%; overflow: visible; }
      .mx-pm-iskra { fill: currentColor; transform-origin: 12px 12px; }
      .mx-pm-iskra-mala { transform-origin: 19px 5px; }
      .mx-pm-tekst { white-space: nowrap; }
      .mx-pm-gumb[aria-busy="true"] { cursor: progress; }
      .mx-pm-gumb[aria-busy="true"] .mx-pm-iskra { animation: mx-pm-treptaj .9s ease-in-out infinite; }
      .mx-pm-gumb[aria-busy="true"] .mx-pm-iskra-mala { animation-delay: .3s; }
      @keyframes mx-pm-treptaj { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(.55); opacity: .45; } }
      @media (prefers-reduced-motion: reduce) {
        .mx-pm-gumb { transition: none; }
        .mx-pm-gumb[aria-busy="true"] .mx-pm-iskra { animation: none; opacity: .5; }
      }
    `;
    (document.head || document.documentElement).appendChild(stil);
  }

  // Gumb je širok i visok kao gumb "Dodaj u košaricu" (kad artikla nema na
  // stanju, kao "Obavijesti me kada bude dostupan"), s istim slovima i
  // zaobljenjem, i poravnat s njim lijevo.
  function uskladiSaKosaricom(omot, sekcija) {
    if (!sekcija || !omot) return;
    const uzor = sekcija.querySelector('.js-add-to-cart') || sekcija.querySelector('.js-notify-me-btn');
    if (!uzor || !omot.isConnected) return;
    try {
      const r = uzor.getBoundingClientRect();
      if (r.width >= 120) omot.style.setProperty('--mx-pm-sirina', Math.round(r.width) + 'px');
      if (r.height >= 32 && r.height <= 80) omot.style.setProperty('--mx-pm-visina', Math.round(r.height) + 'px');
      // isti lijevi rub kao uzor (ako gumb nije u istoj ploči)
      omot.style.paddingLeft = '';
      const o = omot.getBoundingClientRect();
      const pomak = Math.round(r.left - o.left);
      if (r.width && o.width && pomak > 0 && pomak <= 48) omot.style.paddingLeft = pomak + 'px';
      // izvan ploče (ispod "Obavijesti me"): razmak do uzora 16 px, kao u ploči
      omot.style.marginTop = '';
      if (omot.getAttribute('data-uz') !== 'kosarica' && r.height) {
        const razmak = omot.getBoundingClientRect().top - r.bottom;
        if (razmak > 16 && razmak < 120) {
          omot.style.marginTop = Math.round(parseFloat(getComputedStyle(omot).marginTop) - (razmak - 16)) + 'px';
        }
      }
      const cs = getComputedStyle(uzor);
      const natpis = uzor.querySelector('.btn__label') || uzor;
      const ns = getComputedStyle(natpis);
      if (cs.borderTopLeftRadius) omot.style.setProperty('--mx-pm-radijus', cs.borderTopLeftRadius);
      if (ns.fontFamily) omot.style.setProperty('--mx-pm-font', ns.fontFamily);
      if (ns.fontSize) omot.style.setProperty('--mx-pm-velicina', ns.fontSize);
      if (ns.fontWeight) omot.style.setProperty('--mx-pm-debljina', ns.fontWeight);
      if (ns.letterSpacing) omot.style.setProperty('--mx-pm-razmak', ns.letterSpacing);
      if (ns.textTransform) omot.style.setProperty('--mx-pm-velika', ns.textTransform);
    } catch (e) { /* ostaju zadane vrijednosti */ }
  }

  function oznaciGumb(gumb, zauzet) {
    if (!gumb) return;
    if (zauzet) gumb.setAttribute('aria-busy', 'true');
    else gumb.removeAttribute('aria-busy');
  }

  function napraviGumb() {
    const omot = document.createElement('div');
    omot.className = 'mx-pm';
    const gumb = document.createElement('button');
    gumb.type = 'button';
    gumb.className = 'mx-pm-gumb';
    gumb.setAttribute('aria-label', P.tekstGumba + ' — ' + (P.opisGumba || 'pitanja o ovom proizvodu'));
    if (P.opisGumba) gumb.title = P.opisGumba;
    gumb.innerHTML = '<span class="mx-pm-ikona">' + IKONA + '</span>';
    const t = document.createElement('span');
    t.className = 'mx-pm-tekst';
    t.textContent = P.tekstGumba;
    gumb.appendChild(t);
    gumb.addEventListener('click', function (e) {
      e.preventDefault();
      pritisak(gumb);
    });
    omot.appendChild(gumb);
    return omot;
  }

  let omotGumba = null;

  // ── 7. STRANICA KONTAKT ────────────────────────────────────────────────
  // U okviru "Kontakt podaci", ispod radnog vremena: tekst (P.kontakt.tekst,
  // istih slova kao Email, Telefon i Radno vrijeme) i ispod njega gumb preko
  // cijele širine okvira. Gumb samo otvori chat, isto kao gumb chata u
  // donjem desnom kutu (razgovor se nastavi ili, ako ga nema, počne običnim
  // pozdravom).
  function napraviKontakt() {
    const K = P.kontakt || {};
    const blok = document.createElement('div');
    blok.className = 'mx-pm';
    blok.setAttribute('data-uz', 'kontakt');
    if (K.tekst) {
      const t = document.createElement('p');
      t.className = 'h5 mx-pm-kontakt-tekst';
      t.textContent = K.tekst;
      blok.appendChild(t);
    }
    const gumb = document.createElement('button');
    gumb.type = 'button';
    gumb.className = 'mx-pm-gumb';
    gumb.setAttribute('aria-label', (K.gumb || P.tekstGumba) + ' — otvori chat s AI asistenticom');
    gumb.innerHTML = '<span class="mx-pm-ikona">' + IKONA + '</span>';
    const natpis = document.createElement('span');
    natpis.className = 'mx-pm-tekst';
    natpis.textContent = K.gumb || P.tekstGumba;
    gumb.appendChild(natpis);
    gumb.addEventListener('click', function (e) {
      e.preventDefault();
      otvoriSKontakta(gumb);
    });
    blok.appendChild(gumb);
    return blok;
  }

  async function otvoriSKontakta(gumb) {
    if (radi) return;
    radi = true;
    oznaciGumb(gumb, true);
    try {
      // ako se chat još učitava, pričeka ga
      if (!chatPostoji()) await cekajUvjet(chatPostoji, P.cekajChat);
      if (!chatPostoji()) { console.warn('[Martimex] Pitaj Marti: chat se nije učitao'); provjeriChat(); return; }
      zapis('kontakt: otvaram chat');
      otvoriChat();
      // razgovor koji chat pokazuje je zastario (Voiceflow ga je završio, pa
      // poruka u njemu ne bi dobila odgovor): počne novi, običnim pozdravom
      const kor = korijenChata();
      if (kor && imaRazgovor(kor) && razgovorZastario()) {
        await sljedeciOkvir();
        if (cekaPocetak(kor)) return;   // chat već nudi početak novog razgovora
        zapis('kontakt: razgovor je zastario, novi razgovor');
        zabiljeziAktivnost();
        if (!(await ponovnoPokreni(kor))) posaljiLaunch(null, 'kontakt');
      }
    } catch (e) {
      console.warn('[Martimex] Pitaj Marti (Kontakt) nije uspio:', e);
    } finally {
      radi = false;
      oznaciGumb(gumb, false);
    }
  }

  function postaviKontakt() {
    const popis = document.querySelector('.contact-page__info-wrap');
    if (!popis) return false;
    if (omotGumba && omotGumba.isConnected) return true;
    ubaciStil();
    if (!omotGumba) omotGumba = napraviKontakt();
    popis.appendChild(omotGumba);
    zapis('gumb na stranici Kontakt postavljen');
    return true;
  }

  function postaviGumb() {
    const sekcija = sekcijaProizvoda();
    if (!sekcija || !procitajArtikl()) return false;
    if (omotGumba && omotGumba.isConnected) return true;
    ubaciStil();
    if (!omotGumba) omotGumba = napraviGumb();
    // u sivoj ploči s gumbom "Dodaj u košaricu", odmah ispod njega
    const ploca = sekcija.querySelector('.product__add-to-cart');
    if (ploca && ploca.querySelector('.js-add-to-cart')) {
      omotGumba.setAttribute('data-uz', 'kosarica');
      ploca.appendChild(omotGumba);
      uskladiSaKosaricom(omotGumba, sekcija);
      zapis('gumb postavljen');
      return true;
    }
    // inače (npr. artikla nema na stanju) ispod "Obavijesti me kada bude dostupan"
    omotGumba.removeAttribute('data-uz');
    const iza = sekcija.querySelector('.product__add-to-cart-wrap') ||
      sekcija.querySelector('.product__out-of-stock') ||
      sekcija.querySelector('.product__variations') ||
      sekcija.querySelector('.product__price-wrap');
    if (iza && iza.parentNode) iza.parentNode.insertBefore(omotGumba, iza.nextSibling);
    else (sekcija.querySelector('.product__inner') || sekcija).appendChild(omotGumba);
    uskladiSaKosaricom(omotGumba, sekcija);
    zapis('gumb postavljen');
    return true;
  }

  function pokreni() {
    if (!postaviGumb()) {
      // nije stranica proizvoda: možda je stranica Kontakt
      if (postaviKontakt()) pratiDostupnostChata();
      return;
    }
    // ako stranica iznova iscrta dio s gumbom, gumb se vrati
    const sekcija = sekcijaProizvoda();
    let ceka = false;
    new MutationObserver(function () {
      if (ceka || (omotGumba && omotGumba.isConnected)) return;
      ceka = true;
      requestAnimationFrame(function () { ceka = false; postaviGumb(); });
    }).observe(sekcija, { childList: true, subtree: true });
    // fontovi stranice se možda još učitavaju, a raspored se mijenja s
    // veličinom prozora: uskladi se ponovno
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { uskladiSaKosaricom(omotGumba, sekcija); });
    // gumb se vidi samo kad chat postoji ili se upravo učitava (vidi gore)
    pratiDostupnostChata();
    let okvir = 0;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(okvir);
      okvir = requestAnimationFrame(function () { uskladiSaKosaricom(omotGumba, sekcijaProizvoda() || sekcija); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () {
    try { pokreni(); } catch (e) { console.warn('[Martimex] Pitaj Marti nije pokrenut:', e); }
  });
  else {
    try { pokreni(); } catch (e) { console.warn('[Martimex] Pitaj Marti nije pokrenut:', e); }
  }

})();
