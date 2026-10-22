(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — chat s Marti na JEDNOM ekranu (izgled "Jedan ekran",
  //  jednostavna verzija)
  //
  //  Nema početnog ekrana ni pozornice: kad se chat otvori, razgovor je
  //  odmah tu, na svijetloj podlozi, a na vrhu je samo crna traka.
  //
  //   - gore je tamna traka s natpisom "Marti · AI asistentica" u dva
  //     reda: MARTI (Cormorant Garamond, razmaknuta velika slova, boja
  //     pudera) i ispod sitno AI ASISTENTICA (prašnjava roza), te
  //     Voiceflowovim gumbima za novi razgovor i zatvaranje (samo tanke
  //     ikone, bez kruga); ispod trake tanka roza crta
  //   - na vrhu razgovora je uvod umjesto Martine uvodne poruke (oblačića):
  //     u sredini naslov "Bok, ja sam Marti." (Cormorant
  //     Garamond; "Marti." kurzivom u prašnjavoj rozoj), kratka roza crta i
  //     kratki prigušeni opis (tko je Marti i u čemu pomaže). Tekstovi su u
  //     POSTAVKAMA (uvod). Martina uvodna poruka iz Voiceflowa se ne
  //     prikazuje, ali njezini gumbi da: ispod uvoda, ispod natpisa "Kako
  //     Vam mogu pomoći?", kao izbornik — jedna bijela kartica s redovima
  //     odijeljenim tankim linijama; svaki red ima ikonu u rozom krugu,
  //     naziv opcije, sitni opis ispod njega i tanku strelicu desno.
  //     Redoslijed, ikone i opisi su u POSTAVKAMA (izbornik). Kad kupac
  //     odabere opciju ili napiše poruku, razgovor se nastavlja ispod uvoda
  //     kao dosad
  //   - ostale poruke: Martine su bijele kartice s jedva vidljivom sjenom,
  //     kupčeve su tamne (tinta), ponuđeni odgovori u razgovoru su pilule s
  //     tankim tamnim obrubom koje se pod mišem (ili prstom) ispune tamnom
  //     bojom
  //   - polje za poruku je bijela kapsula s tankim toplim rubom; gumb za
  //     slanje je taman krug tek kad ima što poslati
  //   - razgovor kreće sam kad se chat otvori (nema gumba "Početak"), ali
  //     tek tada: samo učitavanje stranice ne pokreće razgovor u Voiceflowu
  //   - Voiceflowovi engleski tekstovi ("Start new chat", "Cancel",
  //     "Chat has ended") su na hrvatskom
  //
  //  "Smanji pokrete" (postavka uređaja): poruke se pojave bez pomaka.
  //
  //  Tehnički: kao i ostali moduli, ovaj ubaci svoj stil u shadow DOM
  //  elementa #voiceflow-chat i oslanja se na Voiceflowove službene klase
  //  (.vfrc-chat, .vfrc-header, .vfrc-message, .vfrc-user-response,
  //  .vfrc-footer, .vfrc-input-container...). U prozor umeće samo jedan
  //  element bez visine (tanku crtu ispod trake) i uvod na vrh dijela s
  //  porukama (ispred Voiceflowova popisa poruka); prvu Martinu poruku i
  //  njezine gumbe samo označi atributima (data-mx-uvod, data-mx-uvod-izbor,
  //  data-mx-ikona, data-mx-opis), a stil sakrije poruku i gumbe iscrta
  //  kao izbornik. Voiceflowu se isključi
  //  "autostart", pa se razgovor pokrene tek otvaranjem chata (modul tada
  //  pritisne Voiceflowov skriveni gumb za početak, kao nekad "Početak").
  //  Ako modul zakaže, chat radi kao Voiceflowov.
  //  Ne ide uz pocetna-chata.js ni tema-chata.js (oni su drugi izgled).
  //  Gdje radi: testna stranica proba.html (vrh repozitorija) učita ovaj
  //  modul umjesto početnog ekrana; martimex.hr ga ne učitava dok se u
  //  loader.js ne uključi umjesto pocetna-chata.js (vidi loader.js).
  //  Probe: pokusi/jednostavno/proba.html i, bez Voiceflowa,
  //  pokusi/jednostavno/mock.html.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxJedanEkran) return;   // zaštita ako se modul učita dvaput
  window.__mxJedanEkran = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_JEDAN_POSTAVKE = {
    boje: {                     // uvijek u obliku #rrggbb
      tama:      '#0e0c0b',     // topla crna: traka gore
      bjelokost: '#f7f3ef',     // pozadina razgovora
      papir:     '#fffdfb',     // Martine poruke, polje za poruku, ploče
      tinta:     '#1c1715',     // tekst; kupčeve poruke; obrub i ispuna ponuđenih odgovora
      tih:       '#7a6d66',     // prigušeni tekst (napomene, "Vaša poruka...")
      linija:    '#e8ddd6',     // tanki topli rubovi na svijetlom
      puder:     '#f3e5de',     // natpis MARTI u traci gore, tekst na tamnom
      roza:      '#e2c3ba',     // naglasak (Martimexova prašnjava roza): crte, fokus, "AI asistentica", krugovi ikona
      naglasak:  '#a87c6e'      // dublja prašnjava roza za tekst na svijetlom: "Marti." u naslovu uvoda
    },

    // Fontovi iz mape fonts/ (učitavaju ih i ostali moduli)
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',
    fontNatpisa: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    natpis: 'Marti',                          // u traci gore, 1. red (Cormorant, velika slova)
    podnatpis: 'AI asistentica',              // u traci gore, 2. red (sitno, roza); '' = samo 1. red

    // Voiceflowovi engleski tekstovi ('' = ostaje Voiceflowov tekst)
    tekstovi: {
      noviRazgovor: 'Započni novi razgovor',  // "Start new chat"
      odustani: 'Odustani',                   // "Cancel"
      razgovorZavrsen: 'Razgovor je završen'  // "Chat has ended"
    },

    // Uvod na vrhu razgovora (umjesto Martine uvodne poruke iz Voiceflowa,
    // koja se tada ne prikazuje; njezini gumbi ostaju, kao izbornik ispod
    // uvoda). naslov: '' = bez uvoda, a Martina uvodna poruka se prikaže kao
    // naslov (njezin podebljani prvi red)
    uvod: {
      naslov: 'Bok, ja sam',                    // naslov, 1. dio
      naglasak: 'Marti.',                       // naslov, 2. dio (kurziv, roza)
      opis: 'Vaša AI beauty savjetnica u Martimexu. Pomažem pri odabiru parfema i njege, provjeravam status narudžbe i odgovaram na pitanja o kupnji.',
      pitanje: 'Kako Vam mogu pomoći?'          // natpis iznad izbornika ('' = bez)
    },

    // Izbornik: gumbi iz Voiceflowa ispod uvoda, ovim redom (gumbi kojih tu
    // nema idu iza, kako ih Voiceflow pošalje). "tekst" mora biti isti kao
    // tekst gumba u Voiceflowu; "opis" je sitni redak ispod naziva; "ikona"
    // je jedna od: savjet, narudzba, loyalty, reklamacija, placanje, poruka
    izbornik: [
      { tekst: 'Vaš beauty savjetnik',     ikona: 'savjet',      opis: 'Preporuke parfema i njege po Vašem ukusu' },
      { tekst: 'Provjeri status narudžbe', ikona: 'narudzba',    opis: 'Gdje je moja narudžba i kada stiže' },
      { tekst: 'Loyalty Card',             ikona: 'loyalty',     opis: 'Bodovi, pogodnosti i učlanjenje' },
      { tekst: 'Prijavi reklamaciju',      ikona: 'reklamacija', opis: 'Problem s artiklom ili narudžbom' },
      { tekst: 'Načini plaćanja',          ikona: 'placanje',    opis: 'Kako možete platiti narudžbu' }
    ],

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
    const HOST = 'voiceflow-chat';          // element u čiji shadow DOM Voiceflow crta chat
    const START = '#vfrc-start-chat';       // Voiceflowov gumb "Start new chat"
    // adresa mape ove skripte (vrh repozitorija); fontovi su u njezinoj mapi fonts/
    const MAPA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/jedan-ekran.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
    const KORIJEN = MAPA;
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
    const UVOD = W + ' [data-mx-uvod]';                                     // prva Martina poruka (naslov)
    const IZBOR = W + ' [data-mx-uvod-izbor]';                              // njezini gumbi (izbornik)
    const MARTI_U = '.vfrc-message:not([class*="vfrc-message--extension"])';
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
    // tanka strelica desno u redovima izbornika (tamna i svijetla, za pritisnut red)
    function strelica(boja) {
      return 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="' + boja + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>') + '")';
    }
    const STRELICA = strelica(B.tih);
    // ikone izbornika (tanke linije, 20 × 20)
    const IKONE = {
      savjet: '<path d="M10 3.2l1.5 4.1 4.1 1.5-4.1 1.5-1.5 4.1-1.5-4.1-4.1-1.5 4.1-1.5z"/><path d="M15.4 13.4l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z"/>',
      narudzba: '<path d="M3.5 6.6 10 3.5l6.5 3.1v6.8L10 16.5l-6.5-3.1z"/><path d="M3.5 6.6 10 9.7l6.5-3.1M10 9.7v6.8"/>',
      loyalty: '<path d="M10 16s-6-3.7-6-8.1A3.3 3.3 0 0 1 10 6a3.3 3.3 0 0 1 6 1.9C16 12.3 10 16 10 16z"/>',
      reklamacija: '<path d="M7.2 4.6 4 7.8 7.2 11"/><path d="M4.2 7.8h7.3a4.3 4.3 0 0 1 0 8.6H8.6"/>',
      placanje: '<rect x="3" y="5.2" width="14" height="9.8" rx="2"/><path d="M3 8.4h14M6 12.1h3"/>',
      poruka: '<path d="M4.2 4.8h11.6A1.7 1.7 0 0 1 17.5 6.5v6a1.7 1.7 0 0 1-1.7 1.7H9.4l-3.6 2.8v-2.8H4.2a1.7 1.7 0 0 1-1.7-1.7v-6a1.7 1.7 0 0 1 1.7-1.7z"/>'
    };
    function ikona(ime) {
      return 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="' + B.tinta + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' + (IKONE[ime] || IKONE.poruka) + '</svg>') + '")';
    }
    const U = P.uvod || {};
    const VLASTITI_UVOD = !!(U.naslov || U.naglasak);   // uvod iz POSTAVKI (inače Martina poruka kao naslov)
    const VISINA_TRAKE = 64;              // px, traka s natpisom (Voiceflowovo zaglavlje je 56 px; malo deblja, da dva reda natpisa dišu)
    const VRH_NATPISA = Math.round((VISINA_TRAKE - 37) / 2) - 2;   // natpis u dva reda (24 + 2 + 11 px) optički u sredini trake (slova su niže u svom retku)

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

      /* ═══ TRAKA GORE: topla crna, natpis MARTI · AI ASISTENTICA i tanke ikone ═══ */
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
      /* fino zrno, da topla crna ne djeluje plastično */
      ${ZAGLAVLJE}::before {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: -1;
        background: ${ZRNO};
        opacity: .07;
        pointer-events: none;
      }
      /* bez Voiceflowove slike i naslova: u sredini je natpis MARTI i ispod
         njega AI ASISTENTICA; Voiceflowov naslov ostaje u kodu za čitače
         zaslona (natpis je ukras) */
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
        top: calc(env(safe-area-inset-top, 0px) + ${P.podnatpis ? VRH_NATPISA : 0}px);
        left: 50%;
        transform: translateX(-50%);
        padding-left: .36em;                  /* optički centrira razmaknuta slova */
        font-family: var(--mx-j-font-natpisa);
        font-size: ${P.podnatpis ? 19 : 18}px;
        font-weight: 500;
        line-height: ${P.podnatpis ? 24 : VISINA_TRAKE}px;
        letter-spacing: .36em;
        white-space: nowrap;
        color: var(--mx-j-puder);
        pointer-events: none;
      }${P.podnatpis ? `
      /* 2. red: AI ASISTENTICA, sitno i razmaknuto, prašnjava roza */
      ${ZAGLAVLJE} .vfrc-header--title::before {
        content: ${tekst(String(P.podnatpis).toUpperCase())};
        content: ${tekst(String(P.podnatpis).toUpperCase())} / "";
        position: absolute;
        top: calc(env(safe-area-inset-top, 0px) + ${VRH_NATPISA + 26}px);
        left: 50%;
        transform: translateX(-50%);
        padding-left: .34em;
        font-family: var(--mx-j-font);
        font-size: 9.5px;
        font-weight: 400;
        line-height: 11px;
        letter-spacing: .34em;
        white-space: nowrap;
        color: var(--mx-j-roza);
        pointer-events: none;
      }` : ''}
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

      /* ═══ TANKA CRTA ISPOD TRAKE (element bez visine, umetnut ispod zaglavlja) ═══
         tanka roza crta na granici tame i bjelokosti; ispod nje poruke koje
         klize prema gore tiho nestanu u bjelokosti */
      :host .mx-j {
        position: relative;
        z-index: 4;
        flex: none;
        height: 0;
        pointer-events: none;
      }
      :host .mx-j::after {
        content: "";
        position: absolute;
        left: 0; right: 0;
        top: 0;
        height: 18px;
        background:
          linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza-60) 50%, var(--mx-j-roza-0)) top / 100% 1px no-repeat,
          linear-gradient(180deg, var(--mx-j-bjelokost), var(--mx-j-bjelokost-0));
      }

      /* ═══ PORUKE ═══ */
      ${PORUKE} { padding-top: 14px; }
      /* Voiceflowov uvod (veliki avatar i naslov) ne treba: naslov je Martina uvodna poruka */
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

      /* ═══ UVOD na vrhu razgovora (umetnut ispred Voiceflowova popisa poruka) ═══ */
      :host .mx-j-uvod {
        margin: 28px 18px 0;
        text-align: center;
        font-family: var(--mx-j-font);
        -webkit-user-select: none;
                user-select: none;
      }
      :host .mx-j-uvod-naslov {
        margin: 0;
        font-family: var(--mx-j-font-natpisa);
        font-size: 31px;
        font-weight: 500;
        line-height: 1.12;
        letter-spacing: .003em;
        color: var(--mx-j-tinta);
        text-wrap: balance;
        animation: mx-j-pojava .8s var(--mx-j-glatko) .08s backwards;
      }
      :host .mx-j-uvod-naslov em { font-style: italic; font-weight: 500; color: ${B.naglasak || B.tinta}; }
      :host .mx-j-uvod-crta {
        display: block;
        width: 36px;
        height: 1px;
        margin: 15px auto 13px;
        background: var(--mx-j-roza);
        animation: mx-j-prozirnost .8s var(--mx-j-meko) .16s backwards;
      }
      :host .mx-j-uvod-opis {
        margin: 0 auto;
        max-width: 300px;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.62;
        letter-spacing: .01em;
        color: var(--mx-j-tih);
        text-wrap: pretty;
        animation: mx-j-pojava .8s var(--mx-j-glatko) .2s backwards;
      }
      /* dok Martina uvodna poruka ne stigne, točkice "Marti tipka" se ne vide (uvod je već tu) */
      ${W} [data-mx-skriveno] { display: none; }
${VLASTITI_UVOD ? `
      /* Martina uvodna poruka se ne prikazuje (uvod je gore); ostaju njezini gumbi */
      ${UVOD} { display: block; margin: 0; padding: 0; }
      ${UVOD} ${MARTI_U}, ${UVOD} .vfrc-avatar, ${UVOD} .vfrc-timestamp { display: none; }
      ${UVOD}.vfrc-system-response, ${UVOD} .vfrc-system-response { min-height: 0; margin: 0; padding: 0; }
${U.pitanje ? `      /* natpis iznad izbornika (samo dok je izbornik tu), s tankim crtama lijevo i desno */
      ${UVOD}[data-mx-ima-izbor]::before {
        content: ${tekst(String(U.pitanje).toUpperCase())};
        display: block;
        width: max-content;
        max-width: 100%;
        box-sizing: border-box;
        margin: 26px auto 12px;
        padding: 0 44px 0 calc(44px + .24em);
        font-family: var(--mx-j-font);
        font-size: 10.5px;
        font-weight: 400;
        line-height: 12px;
        letter-spacing: .24em;
        white-space: nowrap;
        color: var(--mx-j-tih);
        background:
          linear-gradient(var(--mx-j-linija), var(--mx-j-linija)) left center / 30px 1px no-repeat,
          linear-gradient(var(--mx-j-linija), var(--mx-j-linija)) right center / 30px 1px no-repeat;
        animation: mx-j-prozirnost .6s var(--mx-j-meko) backwards;
      }` : ''}` : `
      /* Martina uvodna poruka kao naslov: bez avatara i kartice, u sredini */
      ${UVOD} { margin-top: 22px; margin-bottom: 0; }
      ${UVOD}.vfrc-system-response, ${UVOD} .vfrc-system-response { display: block; margin: 0; padding: 0; }
      ${UVOD} .vfrc-avatar, ${UVOD} .vfrc-timestamp { display: none; }
      ${UVOD} .vfrc-system-response div:has(.vfrc-message) { width: 100%; max-width: none; margin-left: 0; margin-right: 0; }
      ${UVOD} ${MARTI_U} {
        width: 100%;
        max-width: none;
        background: transparent;
        box-shadow: none;
        border-radius: 0;
        text-align: center;
        color: var(--mx-j-tih);
        font-size: 14px;
        line-height: 1.62;
        text-wrap: pretty;
      }
      ${UVOD} ${MARTI_U} > .markdown { padding: 0 10px; }
      ${UVOD} ${MARTI_U} p { margin: 0; }
      ${UVOD} ${MARTI_U} .markdown > p:first-child > strong:first-child {
        display: block;
        margin: 0 auto 12px;
        max-width: 320px;
        font-family: var(--mx-j-font-natpisa);
        font-size: 29px;
        font-weight: 500;
        line-height: 1.14;
        color: var(--mx-j-tinta);
        text-wrap: balance;
      }
      ${UVOD} ${MARTI_U} .markdown > p:first-child > strong:first-child + br,
      ${UVOD} ${MARTI_U} .markdown > p:first-child > strong:first-child + br + br { display: none; }`}

      /* ═══ IZBORNIK: gumbi uvodne poruke kao jedna bijela kartica s redovima ═══ */
      ${IZBOR} {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        margin: ${VLASTITI_UVOD ? 0 : '22px'} 0 8px;
        padding: 0;
        background: var(--mx-j-papir);
        border-radius: 18px;
        box-shadow: var(--mx-j-sjena);
        overflow: hidden;
        animation: mx-j-pojava .7s var(--mx-j-glatko) .05s backwards;
      }
      /* redovi: svaki ima tanku liniju na vrhu; prva (gore) je skrivena ispod ruba kartice */
      ${IZBOR} > * { width: 100%; max-width: none; margin: -1px 0 0; padding: 0; }
      ${IZBOR} .vfrc-button {
        position: relative;
        display: block;
        box-sizing: border-box;
        width: 100%;
        min-height: 62px;
        margin: 0;
        padding: 12px 42px 12px 64px;
        border: 0;
        border-radius: 0;
        background: transparent ${STRELICA} right 16px center / 15px 15px no-repeat;
        color: var(--mx-j-tinta);
        box-shadow: inset 0 1px 0 var(--mx-j-linija);
        font-family: var(--mx-j-font);
        font-size: 14.5px;
        font-weight: 500;
        line-height: 19px;
        letter-spacing: .01em;
        text-align: left;
        transform: none;
        transition: background-color .25s var(--mx-j-meko);
      }
      /* ikona u rozom krugu lijevo */
      ${IZBOR} .vfrc-button::before {
        content: "";
        position: absolute;
        left: 14px;
        top: 50%;
        width: 36px;
        height: 36px;
        margin-top: -18px;
        border-radius: 50%;
        background: ${prozirna(B.roza, .38)} ${ikona('poruka')} center / 18px 18px no-repeat;
      }
${Object.keys(IKONE).filter(function (k) { return k !== 'poruka'; }).map(function (k) {
  return '      ' + IZBOR + ' .vfrc-button[data-mx-ikona="' + k + '"]::before { background-image: ' + ikona(k) + '; }';
}).join('\n')}
      /* sitni opis ispod naziva */
      ${IZBOR} .vfrc-button[data-mx-opis]::after {
        content: attr(data-mx-opis);
        display: block;
        margin-top: 2px;
        font-size: 12.5px;
        font-weight: 400;
        line-height: 17px;
        letter-spacing: .005em;
        color: var(--mx-j-tih);
      }
      @media (hover: hover) and (pointer: fine) {
        ${IZBOR} .vfrc-button:hover {
          background-color: var(--mx-j-bjelokost);
          color: var(--mx-j-tinta);
          box-shadow: inset 0 1px 0 var(--mx-j-linija);
        }
      }
      ${IZBOR} .vfrc-button:active {
        background-color: ${prozirna(B.roza, .22)};
        color: var(--mx-j-tinta);
        box-shadow: inset 0 1px 0 var(--mx-j-linija);
        transform: none;
      }
      ${IZBOR} .vfrc-button:focus-visible { outline: 1px solid var(--mx-j-tinta-30); outline-offset: -4px; }

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
      /* zatamnjenje, ploča "Novi razgovor?" i izbornik uvijek iznad trake */
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
        ${MARTI}, ${KORISNIK}, ${IZBOR}, :host .mx-j-uvod-naslov, :host .mx-j-uvod-opis { animation: mx-j-prozirnost .3s linear backwards; }
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
              'font-weight:' + f[2] + ';font-style:' + (f[3] || 'normal') + ';font-display:swap;unicode-range:' + rasponi[r] + '}';
          }).join('\n');
        }).join('\n');
        document.head.appendChild(stil);
      }
      if (!document.getElementById('mx-pocetna-font-300')) dodaj('mx-pocetna-font-300', [['MX Jost', 'jost', '300']]);
      // kurziv Cormoranta ("Marti." u naslovu uvoda) učitava samo ovaj modul
      if (!document.getElementById('mx-jedan-font-kurziv')) dodaj('mx-jedan-font-kurziv', [['MX Cormorant', 'cormorant-garamond-italic', '500 700', 'italic']]);
      if (document.getElementById('mx-kartice-font') || document.getElementById('mx-pocetna-font') || document.getElementById('mx-tema-font') || document.getElementById('mx-jedan-font')) return;
      dodaj('mx-jedan-font', [['MX Jost', 'jost', '400 600'], ['MX Cormorant', 'cormorant-garamond', '500 700']]);
    }


    // ═══════════════════════════════════════════════════════════════════
    //  CRTA ISPOD TRAKE — element bez visine ispod Voiceflowova zaglavlja
    // ═══════════════════════════════════════════════════════════════════
    function napraviCrtu() {
      const e = document.createElement('div');
      e.className = 'mx-j';
      e.setAttribute('role', 'presentation');
      return e;
    }


    // ═══════════════════════════════════════════════════════════════════
    //  VEZA S VOICEFLOWOM
    // ═══════════════════════════════════════════════════════════════════
    const S = { host: null, kor: null, crta: null, uvod: null, otvoren: false, ceka: false };
    function kljuc(t) { return String(t || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
    const IZB = (Array.isArray(P.izbornik) ? P.izbornik : []).filter(function (o) { return o && o.tekst; });
    const IZB_KLJUCEVI = IZB.map(function (o) { return kljuc(o.tekst); });

    // Uvod (naslov, crta, opis) na vrh dijela s porukama
    function napraviUvod() {
      const e = document.createElement('div');
      e.className = 'mx-j-uvod';
      const h = document.createElement('h2');
      h.className = 'mx-j-uvod-naslov';
      h.appendChild(document.createTextNode(String(U.naslov || '').trim() + (U.naslov && U.naglasak ? ' ' : '')));
      if (U.naglasak) { const em = document.createElement('em'); em.textContent = U.naglasak; h.appendChild(em); }
      e.appendChild(h);
      if (U.opis) {
        const c = document.createElement('span');
        c.className = 'mx-j-uvod-crta';
        e.appendChild(c);
        const o = document.createElement('p');
        o.className = 'mx-j-uvod-opis';
        // bez "udovice": zadnje dvije riječi zajedno
        const t = String(U.opis).trim(), i = t.lastIndexOf(' ');
        o.textContent = i > 0 ? t.slice(0, i) + '\u00a0' + t.slice(i + 1) : t;
        e.appendChild(o);
      }
      return e;
    }

    function imaRazgovor(kor) { return !!kor.querySelector('.vfrc-chat .vfrc-system-response, .vfrc-chat .vfrc-user-response'); }

    // Razgovor još nije krenuo: Voiceflow tada ima svoj gumb za početak (ploča se ne vidi, vidi CSS)
    function cekaPocetak(kor) {
      const g = kor.querySelector(START);
      if (!g || !g.parentElement) return false;
      const ploca = g.closest('.vfrc-footer__start-button') || g.parentElement;
      return !ploca.hasAttribute('inert') && getComputedStyle(g).display !== 'none' && !imaRazgovor(kor);
    }

    // Crta mora biti odmah ispod Voiceflowova zaglavlja (ako Voiceflow
    // iscrta prozor iznova, vrati se na mjesto)
    function prikvaci(kor) {
      const prozor = kor.querySelector('.vfrc-chat');
      const zaglavlje = prozor && prozor.querySelector(':scope > .vfrc-header');
      if (!prozor || !zaglavlje) return false;
      if (!S.crta) S.crta = napraviCrtu();
      if (S.crta.parentNode !== prozor || S.crta.previousElementSibling !== zaglavlje) prozor.insertBefore(S.crta, zaglavlje.nextSibling);
      return true;
    }

    function oznaka(e, ime, da) {
      if (!e || da === e.hasAttribute(ime)) return;
      if (da) e.setAttribute(ime, ''); else e.removeAttribute(ime);
    }

    // Prva Martina poruka (s tekstom) je naslov: označi se njezin cijeli
    // odlomak u razgovoru (data-mx-uvod) i njezini gumbi (data-mx-uvod-izbor),
    // a gumbi se poslože redom iz POSTAVKI (CSS order, Voiceflowov DOM se ne dira)
    function urediUvod(kor) {
      const dijalog = kor.querySelector('.vfrc-chat .vfrc-chat-dialog');
      if (!dijalog) return;
      const poruka = dijalog.querySelector('.vfrc-system-response .vfrc-message');
      // odlomak uvoda: najveći omot oko te poruke u kojem nema nijedne druge
      // poruke (ni Martine ni kupčeve), pa se nikad ne označi cijeli razgovor
      let uvod = poruka && poruka.closest('.vfrc-system-response');
      while (uvod && uvod.parentElement && uvod.parentElement !== dijalog &&
             uvod.parentElement.querySelectorAll('.vfrc-system-response, .vfrc-user-response').length === 1) uvod = uvod.parentElement;
      dijalog.querySelectorAll('[data-mx-uvod]').forEach(function (e) { if (e !== uvod) oznaka(e, 'data-mx-uvod', false); });
      // uvod iz POSTAVKI: na vrhu dijela s porukama, ispred Voiceflowova popisa
      if (VLASTITI_UVOD && dijalog.parentElement) {
        if (!S.uvod) S.uvod = napraviUvod();
        if (S.uvod.nextElementSibling !== dijalog) dijalog.parentElement.insertBefore(S.uvod, dijalog);
      }
      // dok uvodna poruka ne stigne, točkice "Marti tipka" se ne vide
      dijalog.querySelectorAll('.vfrc-typing-indicator').forEach(function (t) {
        let e = t;
        while (e.parentElement && e.parentElement !== dijalog && !e.parentElement.querySelector('.vfrc-message, .vfrc-user-response')) e = e.parentElement;
        oznaka(e, 'data-mx-skriveno', VLASTITI_UVOD && !poruka);
      });
      if (poruka) dijalog.querySelectorAll('[data-mx-skriveno]').forEach(function (e) { oznaka(e, 'data-mx-skriveno', false); });
      if (!uvod) return;
      oznaka(uvod, 'data-mx-uvod', true);
      // gumbi: unutar istog odlomka, ili odmah iza njega (ovisno o verziji Voiceflowa)
      let izbor = uvod.querySelector('.vfrc-system-response--actions');
      if (!izbor) {
        const iduci = uvod.nextElementSibling;
        if (iduci && !iduci.querySelector('.vfrc-message, .vfrc-user-response') && !iduci.classList.contains('vfrc-user-response')) {
          izbor = iduci.classList.contains('vfrc-system-response--actions') ? iduci : iduci.querySelector('.vfrc-system-response--actions');
        }
      }
      dijalog.querySelectorAll('[data-mx-uvod-izbor]').forEach(function (e) { if (e !== izbor) oznaka(e, 'data-mx-uvod-izbor', false); });
      oznaka(uvod, 'data-mx-ima-izbor', !!(izbor && izbor.querySelector('.vfrc-button')));
      if (!izbor) return;
      oznaka(izbor, 'data-mx-uvod-izbor', true);
      // redoslijed (CSS order na Voiceflowovu omotu gumba), ikona i opis iz POSTAVKI
      Array.from(izbor.querySelectorAll('.vfrc-button')).forEach(function (g, k) {
        let w = g;                                         // Voiceflowov omot gumba (izravno dijete izbornika)
        while (w.parentElement && w.parentElement !== izbor) w = w.parentElement;
        const i = IZB_KLJUCEVI.indexOf(kljuc(g.textContent));
        const red = String(i === -1 ? IZB.length + k : i);
        if (w.style.order !== red) w.style.order = red;
        const o = i === -1 ? null : IZB[i];
        const ik = o && o.ikona && IKONE[o.ikona] ? o.ikona : '';
        if ((g.getAttribute('data-mx-ikona') || '') !== ik) { if (ik) g.setAttribute('data-mx-ikona', ik); else g.removeAttribute('data-mx-ikona'); }
        const op = o && o.opis ? String(o.opis) : '';
        if ((g.getAttribute('data-mx-opis') || '') !== op) { if (op) g.setAttribute('data-mx-opis', op); else g.removeAttribute('data-mx-opis'); }
      });
    }

    // Stanje prozora: pri svakoj promjeni u chatu (poruke, novi razgovor...)
    function uskladi() {
      S.ceka = false;
      const kor = S.kor;
      if (!kor || !prikvaci(kor)) return;
      urediUvod(kor);
      if (S.otvoren) zapocni();
    }
    // (setTimeout, a ne requestAnimationFrame: radi i dok je kartica u pozadini)
    function uskladiUskoro() {
      if (S.ceka) return;
      S.ceka = true;
      setTimeout(uskladi, 0);
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
      urediUvod(kor);
      zapocni();
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
        else if (tip === 'voiceflow:close') S.otvoren = false;
      });
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
        new MutationObserver(function () { imenaGumba(S.kor); uskladiUskoro(); })
          .observe(S.kor, { childList: true, subtree: true });
        uskladi();
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_JEDAN.pokreni(); }
  catch (e) { console.warn('[Martimex] Chat na jednom ekranu nije pokrenut:', e); }

})();
