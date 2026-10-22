(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — chat s Marti na JEDNOM ekranu (izgled "Jedan ekran")
  //
  //  Nema početnog ekrana ispred chata: kad se chat otvori, razgovor je
  //  odmah tu, a vrh prozora je mala tamna "pozornica" s brendovima.
  //
  //   - gore je tamna traka s natpisom MARTIMEX (Cormorant Garamond,
  //     razmaknuta velika slova, boja pudera) i Voiceflowovim gumbima za
  //     novi razgovor i zatvaranje (samo tanke ikone, bez kruga)
  //   - ispod nje, u istoj toploj crnoj boji, je pozornica: tri crne trake
  //     s logotipima parfemskih i modnih kuća koje Martimex prodaje
  //     (Chanel, Hermès, Guerlain ... Lancôme, Estée Lauder; sličice su u
  //     mapi marke/trake/, izrezane iz marke/izvor.webp skriptom
  //     marke/izradi-trake.py). Logotipi su bijeli, jedan pokraj drugoga, i
  //     polako putuju: gornja traka ulijevo, srednja udesno, donja ulijevo,
  //     svaka malo drugom brzinom, bez kraja (traka se sašije sama sa
  //     sobom, pa nema skoka). Na rubovima pozornice logotipi tiho
  //     izblijede. Pri svakom otvaranju chata trake se pojave jedna za
  //     drugom, a svakih nekoliko sekundi preko pozornice ukoso prijeđe
  //     meko svjetlo. Ispod traka piše "Marti · AI asistentica"
  //   - razgovor je na toploj bjelokosti, bez mramora i bez teksture:
  //     Martine poruke su bijele kartice s jedva vidljivom sjenom, kupčeve
  //     su tamne (tinta), ponuđeni odgovori su pilule s tankim tamnim
  //     obrubom koje se pod mišem (ili prstom) ispune tamnom bojom
  //   - polje za poruku je bijela kapsula s tankim toplim rubom; gumb za
  //     slanje je taman krug tek kad ima što poslati
  //   - čim kupac pošalje prvu poruku ili pritisne ponuđeni odgovor,
  //     trake izblijede, pozornica se glatko sklopi, a natpis "Marti · AI
  //     asistentica" sjedne u traku ispod natpisa MARTIMEX; razgovor tada
  //     dobije cijeli prozor. Na niskom prozoru (mobitel) pozornica se
  //     sklopi već kad kupac dotakne polje za poruku, da tipkovnica ne
  //     prekrije razgovor
  //   - novi razgovor (gumb gore) vrati pozornicu i trake
  //   - ako razgovor već postoji (npr. kupac je s preporuke otišao na
  //     stranicu proizvoda), chat se otvori odmah sklopljen
  //   - razgovor kreće sam kad se chat otvori (nema gumba "Početak"), ali
  //     tek tada: samo učitavanje stranice ne pokreće razgovor u Voiceflowu
  //   - Voiceflowovi engleski tekstovi ("Start new chat", "Cancel",
  //     "Chat has ended") su na hrvatskom
  //
  //  "Smanji pokrete" (postavka uređaja): trake stoje, bez svjetla;
  //  pozornica se sklopi bez animacije. Trake su običan CSS (bez WebGL-a),
  //  pa rade svugdje; ako se neka sličica ne učita, preskoči se.
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
  //  Probe: pokusi/trake/proba.html i, bez Voiceflowa, pokusi/trake/mock.html.
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
      puder:     '#f3e5de',     // natpis MARTIMEX, tekst na tamnom
      roza:      '#e2c3ba',     // naglasak (Martimexova prašnjava roza): crte, fokus, "Marti · AI asistentica", aura na pozornici
      auraJezgra: '#fff0e4',    // topla bijela jezgra aure na pozornici i svjetla koje prelazi preko traka
      logotip:   '#ffffff'      // logotipi na trakama (sličice su bijele; drugom bojom se oboje)
    },

    // Fontovi iz mape fonts/ (učitavaju ih i ostali moduli)
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',
    fontNatpisa: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    natpis: 'Martimex',                       // u traci gore; piše se velikim slovima
    oznaka: 'Marti · AI asistentica',         // ispod traka, a kad se pozornica sklopi, ispod natpisa

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

    // Trake s logotipima brendova (sličice iz mape marke/trake/, bez .png).
    // Svaka traka je jedan red; redom odozgo. Smjer: 'lijevo' ili 'desno';
    // brzina: koliko sekundi treba da cijeli red prođe (veće = sporije)
    marke: {
      trake: [
        { smjer: 'lijevo', brzina: 70, logotipi: ['chanel', 'dolce-gabbana', 'guerlain', 'tom-ford', 'hermes', 'elie-saab', 'versace', 'estee-lauder'] },
        { smjer: 'desno',  brzina: 86, logotipi: ['giorgio-armani', 'carolina-herrera', 'prada', 'chloe', 'valentino', 'yves-saint-laurent', 'lancome', 'van-cleef-arpels'] },
        { smjer: 'lijevo', brzina: 76, logotipi: ['xerjoff', 'penhaligons', 'chopard', 'maison-francis-kurkdjian', 'tiziana-terenzi', 'memo-paris', 'the-merchant-of-venice', 'brunello-cucinelli'] }
      ],
      visina: 36,             // px: visina logotipa (okomiti, npr. Chanel); široki natpisi su niži, da stanu u širinu
      sirina: 3.2,            // najveća širina logotipa, kao višekratnik visine (Dolce & Gabbana, Elie Saab...)
      razmak: 46,             // px između logotipa u traci
      razmakTraka: 14,        // px između traka
      prozirnost: 0.88,       // jačina logotipa (1 = potpuno bijeli)
      rub: 56,                // px: koliko logotipi blijede uz lijevi i desni rub pozornice
      svjetlo: 7              // s: svakih toliko preko pozornice ukoso prijeđe meko svjetlo (0 = bez)
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

    const P = MX_JEDAN_POSTAVKE;
    const B = P.boje;
    const T = P.tekstovi || {};
    const M = P.marke || {};
    const HOST = 'voiceflow-chat';          // element u čiji shadow DOM Voiceflow crta chat
    const START = '#vfrc-start-chat';       // Voiceflowov gumb "Start new chat"
    const OZNAKA = 'data-mx-j';             // atribut na #voiceflow-chat: "sklopljeno", "pokrecem"
    // adresa mape ove skripte (vrh repozitorija); fontovi su u njezinoj mapi fonts/
    const MAPA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/jedan-ekran.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
    const KORIJEN = MAPA;
    const MIRNO = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const MOBITEL = !!(window.matchMedia && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches);
    const PAMCENJE = ['sessionStorage', 'localStorage', 'memory'].indexOf(P.pamcenje) !== -1 ? P.pamcenje : '';

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + (+(+a).toFixed(3)) + ')'; }
    function tekst(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\A ') + '"'; }
    function broj(v, zadano, min, max) { v = +v; return isFinite(v) ? Math.min(max, Math.max(min, v)) : zadano; }


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
    const OZNAKA_ISPOD = 34;              // px od dna pozornice koje zauzima natpis "Marti · AI asistentica" (13 px od dna + 10 px slova + zrak)

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

      /* ═══ POZORNICA S TRAKAMA LOGOTIPA (umetnuta ispod trake) ═══ */
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
        /* meka topla aura u sredini pozornice, iza traka */
        background:
          radial-gradient(60% 70% at 50% 46%, ${prozirna(B.auraJezgra, .07)}, ${prozirna(B.roza, .05)} 45%, ${prozirna(B.roza, 0)} 100%),
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
      /* trake: stoje u sredini prostora iznad natpisa "Marti · AI asistentica" */
      :host .mx-j-trake {
        position: absolute;
        left: 0; right: 0;
        top: 0;
        bottom: ${OZNAKA_ISPOD}px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--mx-j-razmak-traka, 14px);
        padding-top: 8px;
        transition: opacity .45s var(--mx-j-meko);
      }
      :host .mx-j-traka {
        position: relative;
        flex: none;
        height: var(--mx-j-logotip, 34px);
        overflow: hidden;
        /* logotipi uz rubove tiho izblijede */
        -webkit-mask-image: linear-gradient(90deg, transparent, #000 var(--mx-j-rub, 56px), #000 calc(100% - var(--mx-j-rub, 56px)), transparent);
                mask-image: linear-gradient(90deg, transparent, #000 var(--mx-j-rub, 56px), #000 calc(100% - var(--mx-j-rub, 56px)), transparent);
      }
      /* tok: dva ista reda logotipa jedan za drugim; pomakne se za točno
         jedan red, pa se vrati na početak bez skoka */
      :host .mx-j-tok {
        position: absolute;
        top: 0; left: 0;
        display: flex;
        align-items: center;
        height: 100%;
        width: max-content;
        animation: mx-j-lijevo var(--mx-j-trajanje, 70s) linear infinite;
        will-change: transform;
      }
      :host .mx-j-traka-desno .mx-j-tok { animation-name: mx-j-desno; }
      :host .mx-j-red {
        display: flex;
        align-items: center;
        flex: none;
        gap: var(--mx-j-razmak, 46px);
        padding-right: var(--mx-j-razmak, 46px);     /* razmak i između kraja reda i njegova ponavljanja */
      }
      :host .mx-j-logotip {
        display: block;
        flex: none;
        height: var(--mx-j-logotip, 34px);
        width: auto;
        max-width: calc(var(--mx-j-logotip, 34px) * var(--mx-j-sirina, 3.6));
        object-fit: contain;
        opacity: var(--mx-j-prozirnost, .88);
        /* bijela sličica se oboji bojom logotipa (ako je bijela, ništa se ne mijenja) */
        filter: var(--mx-j-boja-logotipa, none);
      }
      :host .mx-j-logotip[data-mx-nema] { display: none; }    /* sličica se nije učitala */
      @keyframes mx-j-lijevo {
        from { transform: translate3d(0, 0, 0); }
        to   { transform: translate3d(-50%, 0, 0); }
      }
      @keyframes mx-j-desno {
        from { transform: translate3d(-50%, 0, 0); }
        to   { transform: translate3d(0, 0, 0); }
      }
      /* svjetlo koje svakih nekoliko sekundi ukoso prijeđe preko pozornice */
      :host .mx-j-svjetlo {
        position: absolute;
        top: -20%;
        left: 0;
        width: 60%;
        height: 140%;
        background: linear-gradient(100deg, ${prozirna(B.auraJezgra, 0)} 20%, ${prozirna(B.auraJezgra, .09)} 50%, ${prozirna(B.auraJezgra, 0)} 80%);
        transform: translate3d(-120%, 0, 0);
        pointer-events: none;
      }
      :host .mx-j-spremno .mx-j-svjetlo { animation: mx-j-svjetlo var(--mx-j-svjetlo, 7s) linear 1.6s infinite; }
      @keyframes mx-j-svjetlo {
        0%   { transform: translate3d(-120%, 0, 0); }
        34%  { transform: translate3d(280%, 0, 0); }
        100% { transform: translate3d(280%, 0, 0); }
      }
      /* "Marti · AI asistentica": ispod traka; kad se pozornica sklopi, s
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
      :host .mx-j-sklopljeno .mx-j-trake { opacity: 0; }
      :host .mx-j-sklopljeno .mx-j-tok, :host .mx-j-sklopljeno .mx-j-svjetlo { animation-play-state: paused; }
      :host .mx-j-sklopljeno::after {
        background:
          linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza-35) 50%, var(--mx-j-roza-0)) top / 100% 1px no-repeat,
          linear-gradient(180deg, var(--mx-j-bjelokost), var(--mx-j-bjelokost-0));
      }
      /* bez prijelaza (chat se otvori na postojećem razgovoru) */
      :host .mx-j-odmah .mx-j-scena, :host .mx-j-odmah .mx-j-trake,
      :host([${OZNAKA}~="odmah"]) .vfrc-widget .vfrc-header--title::after { transition: none; }
      /* pojava pri svakom otvaranju: trake jedna za drugom, pa natpis */
      :host .mx-j-ulaz .mx-j-traka { animation: mx-j-pojava 1s var(--mx-j-glatko) backwards; animation-delay: calc(.15s + var(--mx-j-i, 0) * .14s); }
      :host .mx-j-ulaz .mx-j-oznaka { animation: mx-j-pojava 1.2s var(--mx-j-glatko) .7s backwards; }

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
        :host .mx-j-scena, :host .mx-j-trake, ${ZAGLAVLJE} .vfrc-header--title::after { transition: none; }
        :host .mx-j-tok, :host .mx-j-spremno .mx-j-svjetlo { animation: none; }
        :host .mx-j-ulaz .mx-j-traka, :host .mx-j-ulaz .mx-j-oznaka { animation: mx-j-prozirnost .4s linear backwards; }
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
      const trake = el('div', 'mx-j-trake');
      const popis = Array.isArray(M.trake) ? M.trake : [];
      popis.forEach(function (t, i) {
        const logotipi = (t && Array.isArray(t.logotipi) ? t.logotipi : []).map(function (x) { return String(x || '').trim(); }).filter(Boolean);
        if (!logotipi.length) return;
        const traka = el('div', 'mx-j-traka' + (t.smjer === 'desno' ? ' mx-j-traka-desno' : ''));
        traka.style.setProperty('--mx-j-i', i);
        traka.style.setProperty('--mx-j-trajanje', broj(t.brzina, 70, 10, 600) + 's');
        const tok = el('div', 'mx-j-tok');
        // dva ista reda: drugi je nastavak prvoga, pa se tok vrti bez skoka
        for (let k = 0; k < 2; k++) {
          const red = el('div', 'mx-j-red');
          if (k) red.setAttribute('aria-hidden', 'true');
          logotipi.forEach(function (ime) {
            const slika = document.createElement('img');
            slika.className = 'mx-j-logotip';
            slika.src = KORIJEN + 'marke/trake/' + encodeURIComponent(ime) + '.png';
            slika.alt = k ? '' : ime.replace(/-/g, ' ');
            slika.decoding = 'async';
            slika.draggable = false;
            slika.addEventListener('error', function () { slika.setAttribute('data-mx-nema', ''); });
            red.appendChild(slika);
          });
          tok.appendChild(red);
        }
        traka.appendChild(tok);
        trake.appendChild(traka);
      });
      scena.appendChild(trake);
      scena.appendChild(el('div', 'mx-j-svjetlo'));
      korijen.appendChild(scena);
      const oznaka = el('p', 'mx-j-oznaka', P.oznaka);
      korijen.appendChild(oznaka);

      // mjere traka iz postavki
      korijen.style.setProperty('--mx-j-logotip', broj(M.visina, 36, 12, 120) + 'px');
      korijen.style.setProperty('--mx-j-sirina', broj(M.sirina, 3.2, 1, 10));
      korijen.style.setProperty('--mx-j-razmak', broj(M.razmak, 46, 0, 300) + 'px');
      korijen.style.setProperty('--mx-j-razmak-traka', broj(M.razmakTraka, 14, 0, 100) + 'px');
      korijen.style.setProperty('--mx-j-prozirnost', broj(M.prozirnost, 0.88, 0.1, 1));
      korijen.style.setProperty('--mx-j-rub', broj(M.rub, 56, 0, 300) + 'px');
      const svjetlo = broj(M.svjetlo, 7, 0, 60);
      if (svjetlo > 0) korijen.style.setProperty('--mx-j-svjetlo', svjetlo + 's');
      else korijen.classList.add('mx-j-bez-svjetla');
      if (B.logotip && String(B.logotip).toLowerCase() !== '#ffffff' && String(B.logotip).toLowerCase() !== '#fff') {
        // bijela sličica → zadana boja: potamni do crne pa oboji (SVG filter u data: adresi)
        const c = rgb(B.logotip).map(function (v) { return (v / 255).toFixed(3); });
        const filter = 'url("data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg"><filter id="b" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 ' + c[0] + '  0 0 0 0 ' + c[1] + '  0 0 0 0 ' + c[2] + '  0 0 0 1 0"/></filter></svg>') + '#b")';
        korijen.style.setProperty('--mx-j-boja-logotipa', filter);
      }

      let visina = 230, ziv = false, izmjereno = false;

      return {
        el: korijen,
        ziv: function () { return ziv; },
        // visina otvorene pozornice prema visini prozora chata; trake se
        // po potrebi smanje da stanu iznad natpisa
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
            // tri trake moraju stati iznad natpisa: ako ne stanu, logotipi i razmaci se smanje
            const n = trake.children.length || 1;
            const h = broj(M.visina, 36, 12, 120), r = broj(M.razmakTraka, 14, 0, 100);
            const prostor = v - OZNAKA_ISPOD - 8 - 6;
            const treba = n * h + (n - 1) * r;
            const k = treba > prostor ? Math.max(0.4, prostor / treba) : 1;
            korijen.style.setProperty('--mx-j-logotip', (h * k).toFixed(1) + 'px');
            korijen.style.setProperty('--mx-j-razmak-traka', (r * k).toFixed(1) + 'px');
            if (!izmjereno) {
              void korijen.offsetHeight;
              if (!korijen.classList.contains('mx-j-sklopljeno')) korijen.classList.remove('mx-j-odmah');
              izmjereno = true;
            }
          }
        },
        // pozornica otvorena: trake se pojave ispočetka
        pokazi: function () {
          ziv = true;
          korijen.classList.remove('mx-j-ulaz', 'mx-j-spremno');
          void korijen.offsetWidth;                       // da se pojava ponovi
          korijen.classList.add('mx-j-ulaz', 'mx-j-spremno');
        },
        // chat zatvoren
        sakrij: function () { ziv = false; korijen.classList.remove('mx-j-spremno'); },
        // sklapanje: trake izblijede dok se pozornica sklapa
        sklopi: function (odmah) {
          ziv = false;
          korijen.classList.toggle('mx-j-odmah', !!odmah);
          korijen.classList.add('mx-j-sklopljeno');
          korijen.classList.remove('mx-j-ulaz');
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
    function uskladiUskoro() {
      if (S.ceka) return;
      S.ceka = true;
      requestAnimationFrame(uskladi);
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
        new MutationObserver(function () { imenaGumba(S.kor); uskladiUskoro(); })
          .observe(S.kor, { childList: true, subtree: true });
        uskladi();
        // sličice logotipa se preuzmu unaprijed, kad preglednik miruje, da su
        // tu kad se chat otvori
        const kasnije = window.requestIdleCallback || function (f) { return setTimeout(f, 1200); };
        kasnije(function () {
          (Array.isArray(M.trake) ? M.trake : []).forEach(function (t) {
            (t && Array.isArray(t.logotipi) ? t.logotipi : []).forEach(function (ime) {
              const l = document.createElement('link');
              l.rel = 'prefetch';
              l.as = 'image';
              l.href = KORIJEN + 'marke/trake/' + encodeURIComponent(String(ime || '').trim()) + '.png';
              document.head.appendChild(l);
            });
          });
        }, { timeout: 2500 });
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_JEDAN.pokreni(); }
  catch (e) { console.warn('[Martimex] Chat na jednom ekranu nije pokrenut:', e); }

})();
