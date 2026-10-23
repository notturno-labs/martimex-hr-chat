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
  //   - ako isti artikl (ista varijanta) već stoji u razgovoru, chat se samo
  //     otvori
  //  S izgledom "Jedan ekran" (jedan-ekran.js, kakav je na martimex.hr)
  //  chat se otvori kao i inače, samo umjesto pozdrava dođu kartica i
  //  pitanje; s dosadašnjim početnim ekranom (pocetna-chata.js) taj se
  //  ekran preskoči.
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
    opisGumba: 'AI savjetnica za ovaj proizvod',   // sitniji tekst u gumbu ('' = bez)

    // Mora biti isto kao poruka u Voiceflowu (workflow "Pitaj Marti"):
    // po njoj (ili po kartici artikla) modul zna da je Marti dobila artikl
    pitanje: 'Kako Vam mogu pomoći oko ovog artikla?',

    dogadaj: 'pitaj_marti',       // ime događaja u Voiceflowu
    cekajChat: 15000,             // ms: koliko se najduže čeka da se chat učita
    cekajOdgovor: 15000,          // ms: koliko se najduže čeka kartica/pitanje prije rezerve
    maxOpis: 2500,                // znakova opisa sa stranice
    maxVarijanti: 30,

    boje: {
      ikona: '#c99a8d',           // iskrica u gumbu (Martimexova ružičasto-zlatna)
      ikonaSvijetla: '#e2c3ba'    // iskrica kad je gumb taman (miš iznad gumba)
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
  (function postaviLaunch() {
    const vf = window.MartimexVoiceflow = window.MartimexVoiceflow || {};
    const launch = vf.launch = vf.launch || {};
    const ev = launch.event = launch.event || { type: 'launch' };
    if (!ev.type) ev.type = 'launch';
    ev.payload = Object.assign({}, ev.payload, { pitaj_marti: ARTIKL });
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

  // "1.299,50 €" → 1299.5; "88.5" → 88.5
  function uBroj(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (v === undefined || v === null) return null;
    let s = String(v).replace(/[^\d.,]/g, '');
    if (!s) return null;
    const d = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
    if (d !== -1 && s.length - d - 1 <= 2) s = s.slice(0, d).replace(/[.,]/g, '') + '.' + s.slice(d + 1);
    else s = s.replace(/[.,]/g, '');
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
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

  function varijanteSaStranice(sekcija) {
    const gumbi = sekcija.querySelectorAll('.js-var-btn');
    const lista = [];
    for (let i = 0; i < gumbi.length && lista.length < P.maxVarijanti; i++) {
      const g = gumbi[i];
      const id = g.getAttribute('data-variation-id') || '';
      const podaci = izJsonParse(g.getAttribute('@click') || g.getAttribute('x-on:click')) || {};
      const naziv = (g.getAttribute('data-var-color') || podaci.color || g.getAttribute('data-var-name') ||
        podaci.label || podaci.name || tekst(g.querySelector('.product__single-variation-size')) || '').trim();
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

  function procitajArtikl() {
    const sekcija = sekcijaProizvoda();
    if (!sekcija) return null;

    const xd = izJsonParse(sekcija.getAttribute('x-data')) || {};
    const zivo = alpinePodaci(sekcija) || {};
    const proizvod = Object.assign({}, xd.product || {}, zivo.product || {});
    const ld = jsonLdProizvod() || {};

    const naziv = tekst(sekcija.querySelector('.product__title-wrap h1, h1')) || proizvod.name || ld.name || '';
    if (!naziv) return null;

    // marka: Alpine/x-data, JSON-LD ili poveznica na stranicu marke (/brand/versace/)
    let marka = proizvod.brandName || (ld.brand && (ld.brand.name || ld.brand)) || '';
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

    const glavnaSlika = sekcija.querySelector('.js-featured-image');
    const slika = (odabrana && odabrana.slika) ||
      apsolutno(glavnaSlika && (glavnaSlika.currentSrc || glavnaSlika.getAttribute('src'))) ||
      apsolutno(proizvod.image) || apsolutno(typeof ld.image === 'string' ? ld.image : (ld.image && ld.image[0]));

    // opis: odlomci i retci (<p>, <br>, popisi) ostaju odvojeni, da se ne slijepe
    const opisEl = sekcija.querySelector('.product__description .post-content') || sekcija.querySelector('.product__description');
    let opis = opisEl ? String(opisEl.innerText || opisEl.textContent || '').split(/\n+/)
      .map(function (r) { return r.replace(/\s+/g, ' ').trim(); })
      .filter(Boolean)
      .reduce(function (s, r) { return !s ? r : s + (/[.!?:;,]$/.test(s) ? ' ' : '; ') + r; }, '') : '';
    if (opis.length > P.maxOpis) opis = opis.slice(0, P.maxOpis);

    const pogodnosti = [].map.call(sekcija.querySelectorAll('.product__benefits-single h5, .product__benefits-single'), tekst)
      .filter(function (t, i, svi) { return t && svi.indexOf(t) === i; }).slice(0, 6);

    const artikl = {
      v: 1,
      id: proizvod.id !== undefined ? String(proizvod.id) : '',
      varijacija_id: idVar,
      naziv: naziv,
      marka: String(marka || '').trim(),
      vrsta: proizvod.category || tekst(sekcija.querySelector('.product__sku-wrap h5')) || ld.category || '',
      kategorija: putanja.join(' › '),
      glavna_kategorija: proizvod.categoryMain || putanja[0] || '',
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
      varijante: varijante.map(function (v) {
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

  function sljedeciOkvir() {
    return new Promise(function (gotovo) {
      requestAnimationFrame(function () { setTimeout(gotovo, 0); });
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

  function otvoriChat() {
    try { window.voiceflow.chat.open(); } catch (e) { console.warn('[Martimex] Pitaj Marti: chat se nije otvorio', e); }
  }

  // Početni ekran (pocetna-chata.js) se preskače: sakrije se odmah i
  // "pritisne" se njegov gumb "Početak" (bez tipkovnice, pa polje za poruku
  // ne dobije fokus). Ako razgovor još ne postoji, taj gumb sam pokrene
  // razgovor (Voiceflowovim gumbom za početak), a launch tada nosi artikl.
  function preskociPocetni(kor) {
    const p = kor.querySelector(PROZOR + ' .mx-p');
    if (!p || p.classList.contains('mx-p-izlaz')) return false;
    const g = p.querySelector('.mx-p-gumb');
    if (!g) return false;
    p.style.visibility = 'hidden';
    try { g.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })); }
    catch (e) { return false; }
    zapis('početni ekran preskočen');
    return true;
  }

  // ── 4. PRAĆENJE ODGOVORA ──────────────────────────────────────────────
  // Gleda pojavljuje li se u chatu kartica artikla ili Martino pitanje, i
  // kad se pojavi prva Martina poruka (bilo koja, npr. obični pozdrav).
  function pratiOdgovor(kor) {
    const stanje = { kartica: null, pitanje: false, odgovor: 0, promatrac: null };
    function provjeriCvor(n) {
      if (!n || n.nodeType !== 1) {
        if (n && n.nodeType === 3 && (n.nodeValue || '').indexOf(P.pitanje) !== -1) stanje.pitanje = true;
        return;
      }
      if (!stanje.kartica) {
        const k = n.matches && n.matches(KARTICA) ? n : (n.querySelector && n.querySelector(KARTICA));
        if (k) stanje.kartica = k;
      }
      if (!stanje.pitanje && (n.textContent || '').indexOf(P.pitanje) !== -1) stanje.pitanje = true;
      if (!stanje.odgovor) {
        // poruka u Martinom odgovoru (točkice "piše..." se ne broje)
        const m = n.matches && n.matches(PORUKA) ? n : (n.querySelector && n.querySelector(PORUKA));
        if (m && m.closest && m.closest(ODGOVOR)) stanje.odgovor = Date.now();
      }
    }
    stanje.promatrac = new MutationObserver(function (promjene) {
      for (let i = 0; i < promjene.length; i++) {
        const pr = promjene[i];
        if (pr.type === 'characterData') provjeriCvor(pr.target);
        for (let j = 0; j < pr.addedNodes.length; j++) provjeriCvor(pr.addedNodes[j]);
      }
    });
    stanje.promatrac.observe(kor, { childList: true, subtree: true, characterData: true });
    stanje.stani = function () { if (stanje.promatrac) stanje.promatrac.disconnect(); stanje.promatrac = null; };
    return stanje;
  }

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
  let zadnji = null;           // { kljuc, kartica } — zadnji artikl koji je Marti prikazala

  function posaljiDogadaj(artikl) {
    zapis('događaj', P.dogadaj, artikl);
    window.voiceflow.chat.interact({
      type: 'event',
      payload: { event: { name: P.dogadaj, pitaj_marti: artikl } }
    });
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
    upisiArtikl(artikl);
    const prati = pratiOdgovor(kor);
    const launchGotov = cekajInterakciju('launch', P.cekajOdgovor);

    // s početnim ekranom (pocetna-chata.js) razgovor pokrene njegov gumb
    // "Početak"; Voiceflowov gumb se pritisne samo ako to nije učinio on
    const bezRazgovora = cekaPocetak(kor);
    if (preskociPocetni(kor) && bezRazgovora) await cekajUvjet(function () { return !cekaPocetak(kor); }, 1000);
    if (cekaPocetak(kor)) {
      zapis('launch s artiklom');
      try { kor.querySelector(START).click(); } catch (e) { /* nije bitno */ }
    }
    await cekajUvjet(function () { return !cekaPocetak(kor); }, 2000);
    otvoriChat();

    await cekajKarticu(prati, launchGotov);
    isprazniArtikl();
    prati.stani();

    if (prati.kartica || prati.pitanje) {
      zapis('artikl stigao uz launch');
      zadnji = { kljuc: kljucArtikla(artikl), kartica: prati.kartica };
      return;
    }
    // Voiceflow nije poslao artikl uz launch (ili odgovor kasni): rezerva je događaj
    zapis('rezerva: artikl nije stigao uz launch, šaljem događaj');
    await posaljiIPrati(kor, artikl);
  }

  async function posaljiIPrati(kor, artikl) {
    const prati = pratiOdgovor(kor);
    posaljiDogadaj(artikl);
    await cekajUvjet(function () { return prati.kartica || prati.pitanje; }, P.cekajOdgovor);
    prati.stani();
    zadnji = { kljuc: kljucArtikla(artikl), kartica: prati.kartica };
  }

  // Razgovor traje: chat se otvori, a artikl ide događajem
  async function posaljiUsredRazgovora(kor, artikl) {
    preskociPocetni(kor);
    otvoriChat();
    await sljedeciOkvir();
    await posaljiIPrati(kor, artikl);
  }

  // Razgovor kreće otvaranjem chata (Voiceflowov autostart ili izgled
  // "jedan ekran"): launch nosi artikl
  async function otvoriSArtiklom(kor, artikl) {
    upisiArtikl(artikl);
    const prati = pratiOdgovor(kor);
    const launchGotov = cekajInterakciju('launch', P.cekajOdgovor);
    zapis('launch s artiklom (otvaranjem chata)');
    otvoriChat();
    await cekajKarticu(prati, launchGotov);
    isprazniArtikl();
    prati.stani();
    if (prati.kartica || prati.pitanje) {
      zapis('artikl stigao uz launch');
      zadnji = { kljuc: kljucArtikla(artikl), kartica: prati.kartica };
      return;
    }
    zapis('rezerva: artikl nije stigao uz launch, šaljem događaj');
    await posaljiIPrati(kor, artikl);
  }

  let radi = false;

  async function pritisak(gumb) {
    if (radi) return;
    const artikl = procitajArtikl();
    if (!artikl) { console.warn('[Martimex] Pitaj Marti: podaci o artiklu nisu pronađeni na stranici'); return; }
    radi = true;
    oznaciGumb(gumb, true);
    try {
      const kor = await cekajChat(P.cekajChat);
      if (!kor) {
        console.warn('[Martimex] Pitaj Marti: chat se nije učitao');
        otvoriChat();
        return;
      }
      // isti artikl (ista varijanta) već je u razgovoru: chat se samo otvori
      if (zadnji && zadnji.kljuc === kljucArtikla(artikl) && zadnji.kartica && zadnji.kartica.isConnected && !cekaPocetak(kor)) {
        zapis('isti artikl je već u razgovoru');
        preskociPocetni(kor);
        otvoriChat();
        return;
      }
      if (cekaPocetak(kor)) await pokreniSArtiklom(kor, artikl);
      else if (!imaRazgovor(kor)) await otvoriSArtiklom(kor, artikl);
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
      .mx-pm { margin: 12px 0 4px; width: 100%; box-sizing: border-box; }
      .mx-pm-gumb {
        --mx-pm-tinta: #171717;
        position: relative;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        width: 100%;
        min-height: var(--mx-pm-visina, 52px);
        margin: 0; padding: 0 18px;
        box-sizing: border-box;
        border: 1px solid var(--mx-pm-tinta);
        border-radius: var(--mx-pm-radijus, 0);
        background: #fff;
        color: var(--mx-pm-tinta);
        font-family: var(--mx-pm-font, inherit);
        font-size: var(--mx-pm-velicina, 14px);
        font-weight: var(--mx-pm-debljina, 600);
        letter-spacing: var(--mx-pm-razmak, .06em);
        text-transform: var(--mx-pm-velika, uppercase);
        line-height: 1.2;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background-color .2s ease, color .2s ease;
      }
      .mx-pm-gumb:hover { background: var(--mx-pm-tinta); color: #fff; }
      .mx-pm-gumb:active { transform: translateY(1px); }
      .mx-pm-gumb:focus-visible { outline: 2px solid var(--mx-pm-tinta); outline-offset: 3px; }
      .mx-pm-ikona { display: inline-flex; flex: none; width: 18px; height: 18px; }
      .mx-pm-ikona svg { display: block; width: 100%; height: 100%; overflow: visible; }
      .mx-pm-iskra { fill: ${B.ikona}; transform-origin: 12px 12px; transition: fill .2s ease; }
      .mx-pm-iskra-mala { transform-origin: 19px 5px; }
      .mx-pm-gumb:hover .mx-pm-iskra { fill: ${B.ikonaSvijetla}; }
      .mx-pm-tekst { white-space: nowrap; }
      .mx-pm-opis {
        font-size: .82em; font-weight: 400; letter-spacing: .02em; text-transform: none;
        opacity: .62; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .mx-pm-opis::before { content: "·"; margin-right: 10px; opacity: .8; }
      .mx-pm-gumb[aria-busy="true"] { cursor: progress; }
      .mx-pm-gumb[aria-busy="true"] .mx-pm-iskra { animation: mx-pm-treptaj .9s ease-in-out infinite; }
      .mx-pm-gumb[aria-busy="true"] .mx-pm-iskra-mala { animation-delay: .3s; }
      @keyframes mx-pm-treptaj { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(.55); opacity: .45; } }
      @media (max-width: 420px) { .mx-pm-opis { display: none; } }
      @media (prefers-reduced-motion: reduce) {
        .mx-pm-gumb, .mx-pm-iskra { transition: none; }
        .mx-pm-gumb[aria-busy="true"] .mx-pm-iskra { animation: none; opacity: .5; }
      }
    `;
    (document.head || document.documentElement).appendChild(stil);
  }

  // Gumb preuzme visinu, zaobljenje i slova gumba "Dodaj u košaricu". Kad
  // dio stranice ide od ruba do ruba ekrana (mobitel), gumb se lijevim i
  // desnim rubom poravna s redom u kojem je gumb za košaricu.
  function uskladiSaKosaricom(omot, sekcija) {
    const kosarica = sekcija.querySelector('.js-add-to-cart');
    if (!kosarica || !omot.isConnected) return;
    try {
      const red = kosarica.closest('.product__add-to-cart-btn-quantity-wrapper') || kosarica;
      omot.style.paddingLeft = omot.style.paddingRight = '';
      const o = omot.getBoundingClientRect(), r = red.getBoundingClientRect();
      const sirina = document.documentElement.clientWidth || window.innerWidth;
      if (o.width && r.width && o.left <= 4 && o.right >= sirina - 4) {
        const lijevo = Math.round(r.left - o.left), desno = Math.round(o.right - r.right);
        if (lijevo > 0 && lijevo <= 48) omot.style.paddingLeft = lijevo + 'px';
        if (desno > 0 && desno <= 48) omot.style.paddingRight = desno + 'px';
      }
      const cs = getComputedStyle(kosarica);
      const natpis = kosarica.querySelector('.btn__label') || kosarica;
      const ns = getComputedStyle(natpis);
      const visina = kosarica.getBoundingClientRect().height;
      if (visina >= 36 && visina <= 80) omot.style.setProperty('--mx-pm-visina', Math.round(visina) + 'px');
      if (cs.borderTopLeftRadius) omot.style.setProperty('--mx-pm-radijus', cs.borderTopLeftRadius);
      if (ns.fontFamily) omot.style.setProperty('--mx-pm-font', ns.fontFamily);
      if (ns.fontSize) omot.style.setProperty('--mx-pm-velicina', ns.fontSize);
      if (ns.fontWeight) omot.style.setProperty('--mx-pm-debljina', ns.fontWeight);
      if (ns.letterSpacing && ns.letterSpacing !== 'normal') omot.style.setProperty('--mx-pm-razmak', ns.letterSpacing);
      if (ns.textTransform) omot.style.setProperty('--mx-pm-velika', ns.textTransform);
      // boja ruba i teksta = boja gumba za košaricu, ali samo ako je tamna
      const rgb = (cs.backgroundColor || '').match(/\d+(\.\d+)?/g);
      if (rgb && rgb.length >= 3 && (rgb.length < 4 || +rgb[3] > 0.9) &&
          (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 < 0.35) {
        omot.style.setProperty('--mx-pm-tinta', cs.backgroundColor);
      }
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
    gumb.innerHTML = '<span class="mx-pm-ikona">' + IKONA + '</span>';
    const t = document.createElement('span');
    t.className = 'mx-pm-tekst';
    t.textContent = P.tekstGumba;
    gumb.appendChild(t);
    if (P.opisGumba) {
      const o = document.createElement('span');
      o.className = 'mx-pm-opis';
      o.textContent = P.opisGumba;
      gumb.appendChild(o);
    }
    gumb.addEventListener('click', function (e) {
      e.preventDefault();
      pritisak(gumb);
    });
    omot.appendChild(gumb);
    return omot;
  }

  let omotGumba = null;

  function postaviGumb() {
    const sekcija = sekcijaProizvoda();
    if (!sekcija || !procitajArtikl()) return false;
    if (omotGumba && omotGumba.isConnected) return true;
    ubaciStil();
    if (!omotGumba) omotGumba = napraviGumb();
    const iza = sekcija.querySelector('.product__add-to-cart-wrap') ||
      sekcija.querySelector('.product__variations') ||
      sekcija.querySelector('.product__price-wrap');
    if (iza && iza.parentNode) iza.parentNode.insertBefore(omotGumba, iza.nextSibling);
    else (sekcija.querySelector('.product__inner') || sekcija).appendChild(omotGumba);
    uskladiSaKosaricom(omotGumba, sekcija);
    zapis('gumb postavljen');
    return true;
  }

  function pokreni() {
    if (!postaviGumb()) return;
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
    let okvir = 0;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(okvir);
      okvir = requestAnimationFrame(function () { uskladiSaKosaricom(omotGumba, sekcijaProizvoda() || sekcija); });
    });
  }

  // za probe i otklanjanje grešaka
  window.MartimexPitajMarti = { verzija: 1, procitajArtikl: procitajArtikl };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () {
    try { pokreni(); } catch (e) { console.warn('[Martimex] Pitaj Marti nije pokrenut:', e); }
  });
  else {
    try { pokreni(); } catch (e) { console.warn('[Martimex] Pitaj Marti nije pokrenut:', e); }
  }

})();
