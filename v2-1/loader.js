// Ukratko: Loader mape v2-1 – jedan redak na stranici učita Marti chat 2.0, 1. dio (kartice artikala, izgled chata i gumba)
/* ============================================================
   MARTI CHAT 2.0, 1. DIO – v2-1/loader.js

   Mapa v2-1/ je zaokružen paket 1. dijela verzije 2.0 Marti chata:
     - nove kartice artikala
     - novi izgled chata
     - novi izgled gumba koji otvara chat
   2. dio (gumbi "Pitaj Marti" na stranici artikla i na stranici
   Kontakt, pitaj-marti.js) nije u paketu i ovaj loader ga NE učitava.

   Loader module i fontove uzima iz mape u kojoj je i sam (v2-1/), a ne
   iz korijena repozitorija. Zato promjene u korijenu (razvoj 2. dijela,
   isprobavanja) ne mijenjaju stranice koje učitavaju ovaj loader.
   Mapa se mijenja samo namjerno – vidi README.md u ovoj mapi.

   Na stranicu se dodaje samo ovaj jedan redak (najbolje odmah iznad
   </body>; tako je i na probnoj stranici proba-1-dio.html):

     <script src="https://notturno-labs.github.io/martimex-hr-chat/v2-1/loader.js"></script>

   Na martimex.hr se chat smije učitati tek kad kupac na traci s
   kolačićima prihvati sve, pa tamo redak ima još data-kolacici="ceka":

     <script src="https://notturno-labs.github.io/martimex-hr-chat/v2-1/loader.js" data-kolacici="ceka"></script>

   Tada loader ne učita ništa dok ne nađe kolačić cookiesAccepted=allCookies
   ili ne stigne događaj "martimex:cookies-accepted" s "allCookies".

   Taj jedan redak sam napravi sve ostalo:
     1. učita Voiceflow widget (izravno s Voiceflowa)
     2. istovremeno učita module iz ove mape (MODULI niže)
     3. pokrene chat: Voiceflow projekt "v2 - prvi dio", okruženje Main,
        objavljena (Publish) verzija
   Dosadašnji kod chata (običan Voiceflow kod ili kod koji učitava
   loader.js) treba sa stranice maknuti: ovaj redak ga zamjenjuje. Ako
   loader na stranici nađe drugi chat, ne učita ništa (da ne budu dva).
   ============================================================ */
(function () {

  /* ---------- POSTAVKE – ovo smiješ mijenjati ---------- */

  // Moduli 1. dijela – jedno ime po retku; izvršavaju se ovim redom.
  // Redak koji počinje s # se preskače (tako privremeno isključiš modul).
  //   kartica-artikla.js       nove kartice artikala (i fontovi za ostale module)
  //   gumb-chata.js            izgled gumba koji otvara chat
  //   cekanje-odgovora.js      perlice dok Marti piše odgovor
  //   jedan-ekran.js           izgled chata "Jedan ekran" (traka MARTI, logotipi brendova)
  //   pozdrav-bez-tipkanja.js  Martin pozdrav izroni iz magle, bez tipkanja
  // pitaj-marti.js ne ide ovdje: to je 2. dio.
  var MODULI = `
    kartica-artikla.js
    gumb-chata.js
    cekanje-odgovora.js
    jedan-ekran.js
    pozdrav-bez-tipkanja.js
  `;

  // Voiceflow agent na koji se chat spaja (iste vrijednosti daje
  // Voiceflowov kod za ugradnju projekta "v2 - prvi dio", okruženje Main)
  var VOICEFLOW = {
    verify: { projectID: '6af2ea688e4fa5522c532d4f' },
    url: 'https://general-runtime.voiceflow.com',
    voice: { url: 'https://runtime-api.voiceflow.com' },
    environmentID: 'main',
    versionVariant: 'published'
  };

  var CEKAJ_MODULE = 5000;  // ms – nakon toga chat kreće i bez modula koji još nisu stigli

  /* ---------- ISPOD OVOGA NE TREBAŠ DIRATI ---------- */

  var WIDGET = 'https://cdn.voiceflow.com/widget-next/bundle.mjs';
  var ADRESA = 'https://notturno-labs.github.io/martimex-hr-chat/v2-1/';  // ako se adresa ovog filea ne da pročitati

  var ja = document.currentScript || document.querySelector('script[src*="v2-1/loader.js"]');
  var BASE = ja && ja.src ? new URL('./', ja.src).href : ADRESA;   // mapa ovog filea (v2-1/)
  var cekajKolacice = !!ja && ja.getAttribute('data-kolacici') === 'ceka';

  // Chat smije biti na stranici samo jednom. Oznaka ujedno isključi stari
  // kod chata (onaj koji učitava loader.js) ako je ostao ispod ovog retka.
  if (window.__martimexChat) {
    console.warn('[Martimex] Chat je već na stranici – v2-1/loader.js ne učitava ništa');
    return;
  }
  window.__martimexChat = true;

  window.MartimexExtensions = window.MartimexExtensions || [];
  // Voiceflow postavke koje traže moduli (npr. jedan-ekran.js isključuje
  // autostart); kad se modul isključi, nestane i njegova postavka
  window.MartimexVoiceflow = window.MartimexVoiceflow || {};

  var vfSpreman = false, moduliGotovi = false, domSpreman = false, pokrenut = false;

  function dodaj(s) { (document.head || document.documentElement).appendChild(s); }

  // Je li na stranici već neki Voiceflow chat (npr. ostao je stari kod)
  function drugiChat() {
    return !!(window.voiceflow && window.voiceflow.chat) ||
      !!document.querySelector('script[src*="cdn.voiceflow.com/widget"]') ||
      !!document.getElementById('voiceflow-chat');
  }

  // Učita jedan modul; ako ga nema, zapiše upozorenje i ide dalje
  function ucitajModul(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;  // preuzimaju se paralelno, izvršavaju redom
      s.onload = resolve;
      s.onerror = function () { console.warn('[Martimex] Nije učitano:', src); resolve(); };
      dodaj(s);
    });
  }

  // Omota ekstenziju tako da njezina greška ne sruši cijeli chat
  function sigurno(ext) {
    var w = Object.assign({}, ext);
    ['match', 'render', 'effect'].forEach(function (k) {
      if (typeof ext[k] !== 'function') return;
      w[k] = function () {
        try { return ext[k].apply(this, arguments); }
        catch (e) {
          console.error('[Martimex] Greška u ekstenziji ' + ext.name + ':', e);
          return k === 'match' ? false : undefined;
        }
      };
    });
    return w;
  }

  // Osnovne postavke + ono što traže moduli + ekstenzije (kartice artikala)
  function postavke() {
    var odModula = window.MartimexVoiceflow || {};
    var ekstenzije = window.MartimexExtensions
      .filter(function (e) {
        var ok = e && typeof e.match === 'function';
        if (!ok) console.warn('[Martimex] Preskočena neispravna ekstenzija:', e);
        return ok;
      })
      .map(sigurno);
    var cfg = Object.assign({}, VOICEFLOW, odModula);
    cfg.assistant = Object.assign({}, odModula.assistant, { extensions: ekstenzije });
    return cfg;
  }

  function ucitajChat(cfg) {
    return Promise.resolve().then(function () { return window.voiceflow.chat.load(cfg); });
  }

  // Chat kreće tek kad su spremni Voiceflow, stranica i moduli (ili je
  // prošlo CEKAJ_MODULE); ako ne krene s modulima, krene osnovni chat
  function pokreni() {
    if (pokrenut || !vfSpreman || !moduliGotovi || !domSpreman) return;
    pokrenut = true;
    Promise.resolve().then(postavke).then(ucitajChat)
      .catch(function (e) {
        console.error('[Martimex] Chat se nije pokrenuo s modulima – pokrećem osnovni', e);
        return ucitajChat(VOICEFLOW);
      })
      .catch(function (e) { console.error('[Martimex] Chat se nije pokrenuo', e); });
  }

  function ucitajSve() {
    if (drugiChat()) {
      console.warn('[Martimex] Na stranici je već Voiceflow chat (stari kod?) – v2-1/loader.js ne učitava ništa');
      return;
    }

    // 1) Voiceflow widget – uvijek izravno s Voiceflowa
    var vf = document.createElement('script');
    vf.src = WIDGET;
    vf.onload = function () { vfSpreman = true; pokreni(); };
    vf.onerror = function () { console.error('[Martimex] Voiceflow widget se nije učitao'); };
    dodaj(vf);

    // 2) Moduli 1. dijela – istovremeno s Voiceflowom. Oznaka ?v= je nova
    //    svake minute, pa preglednik ne uzme staru spremljenu kopiju modula
    //    (GitHub Pages pregledniku dopušta da datoteku čuva 10 minuta)
    var v = Math.floor(Date.now() / 60000);
    var datoteke = MODULI.split('\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l && !/^(#|\/\/)/.test(l); });
    function gotovi() {
      if (moduliGotovi) return;
      moduliGotovi = true;
      pokreni();
    }
    Promise.all(datoteke.map(function (f) { return ucitajModul(BASE + f + '?v=' + v); })).then(gotovi);
    setTimeout(function () {
      if (moduliGotovi) return;
      console.warn('[Martimex] Moduli nisu stigli na vrijeme – chat kreće s onim što je stiglo');
      gotovi();
    }, CEKAJ_MODULE);
  }

  // Stranica
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { domSpreman = true; pokreni(); });
  } else {
    domSpreman = true;
  }

  // Bez data-kolacici="ceka" (ili kad su kolačići već prihvaćeni) sve se
  // učita odmah
  function prihvaceno() { return /(?:^|;\s*)cookiesAccepted=allCookies(?:;|$)/.test(document.cookie); }
  if (!cekajKolacice || prihvaceno()) { ucitajSve(); return; }

  // Inače se čeka da kupac prihvati sve kolačiće: događaj s martimex.hr, a
  // za svaki slučaj se svake sekunde pogleda i kolačić
  var ucitano = false, provjera = 0;
  function nakonPristanka() {
    if (ucitano) return;
    ucitano = true;
    clearInterval(provjera);
    ucitajSve();
  }
  document.addEventListener('martimex:cookies-accepted', function (e) {
    if (e.detail === 'allCookies') nakonPristanka();
  });
  provjera = setInterval(function () { if (prihvaceno()) nakonPristanka(); }, 1000);

})();
