(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — izgled cijelog chata s Marti: "Staklo" (Liquid Glass) (v1)
  //
  //  Voiceflowov bijeli prozor chata postaje tamni, topli prostor u kojem
  //  sve lebdi kao staklo (po uzoru na Liquid Glass dizajn):
  //
  //   - pozadina: duboka topla tama (espresso) u kojoj polako plove meka
  //     svjetla u bojama terakote, meda i prašnjave roze, s finim zrnom
  //     kao na filmu; na vrhu i dnu se tama zgusne, pa poruke tiho
  //     nestaju ispod zaglavlja i polja za poruku
  //   - zaglavlje je plutajuća staklena kapsula (Marti + podnaslov), a
  //     poruke klize ispod nje i kroz staklo se vide zamućene
  //   - Martine poruke su oblačići od zamagljenog stakla s tankim
  //     svijetlim rubom (svjetlo pada odozgo slijeva); kupčeve poruke su
  //     staklo u boji ružičastog zlata
  //   - gumbi s ponuđenim odgovorima su staklene pilule s rubom ružičastog
  //     zlata; kad je miš iznad njih, zasvijetle
  //   - polje za poruku je velika staklena kapsula; gumb za slanje je
  //     kuglica od ružičastog zlata koja se upali kad ima što poslati
  //   - kartica proizvoda (kartica-artikla.js) postaje tamno staklo, a
  //     bočica stoji u svijetloj vitrini, kao u izlogu parfumerije
  //   - početni ekran (pocetna-chata.js) dobije topla svjetla u kutovima,
  //     stakleni gumb za zatvaranje i staklenu pilulu "POČETAK"
  //   - gumb chata u kutu stranice (gumb-chata.js) postaje tamno, dimljeno
  //     staklo; bočica, sprej i zlatni rub ostaju
  //   - tekstovi koje Voiceflow piše engleski ("Start new chat", "Cancel",
  //     "Chat has ended") su na hrvatskom
  //
  //  Ako je na uređaju uključeno "Smanji pokrete", svjetla u pozadini
  //  miruju i poruke se samo tiho pojave. Ako je uključeno "Smanji
  //  prozirnost", staklo je gušće (tekst je još čitljiviji).
  //
  //  Tehnički: kao i ostali moduli, ovaj samo ubaci svoj stil u shadow DOM
  //  elementa #voiceflow-chat i u chat ništa ne umeće. Oslanja se na
  //  Voiceflowove službene klase (.vfrc-chat, .vfrc-header, .vfrc-message,
  //  .vfrc-user-response, .vfrc-footer, .vfrc-input-container...) i na
  //  raspored elemenata oko njih, a ne na nasumična imena klasa koja
  //  Voiceflow mijenja sa svakom verzijom. Ako Voiceflow jednog dana
  //  promijeni prozor, dio izgleda izostane, a chat radi normalno.
  //  Isključi se tako da se u loader.js ispred "tema-chata.js" stavi #.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxTemaChata) return;   // zaštita ako se modul učita dvaput
  window.__mxTemaChata = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_TEMA_POSTAVKE = {
    boje: {                   // uvijek u obliku #rrggbb
      podloga:   '#0f0a08',   // najdublja boja pozadine (topli espresso)
      terakota:  '#b4502c',   // svjetlo u pozadini gore lijevo
      med:       '#cf9346',   // svjetlo u pozadini desno
      vino:      '#7c2316',   // tamnocrveno svjetlo u pozadini dolje
      roza:      '#c98f86',   // svjetlo u pozadini dolje desno
      bjelokost: '#f4ece6',   // tekst
      tih:       '#b4a69d',   // prigušeni tekst (opisi, napomena ispod polja)
      roseGold:  '#e3c1ac',   // rubovi gumba, cijena, poveznice
      puder:     '#f6ebe7',   // najsvjetlija roza: istaknuto
      kupac:     '#c98a6e',   // staklo kupčevih poruka (ružičasto zlato)
      vitrina:   '#fdfaf8'    // svijetla vitrina u kojoj stoji bočica na kartici proizvoda
    },

    // Fontovi iz mape fonts/ (učitavaju ih i ostali moduli)
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',
    fontNaslova: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    podnaslovZaglavlja: 'AI beauty savjetnik',   // ispod imena u zaglavlju ('' = bez)

    // Voiceflowovi engleski tekstovi ('' = ostaje Voiceflowov tekst)
    tekstovi: {
      noviRazgovor: 'Započni novi razgovor',     // "Start new chat"
      odustani: 'Odustani',                      // "Cancel"
      razgovorZavrsen: 'Razgovor je završen'     // "Chat has ended"
    },

    zamucenje: 22,            // px: koliko staklo zaglavlja i polja za poruku zamuti ono iza sebe
    pokretPozadine: 48,       // sekundi za jedan krug plovidbe svjetala u pozadini (0 = miruju)
    zrno: true,               // fino zrno filma preko pozadine
    pocetniEkran: true,       // false → početni ekran ostaje kakav je bio
    gumbChata: true           // false → gumb chata u kutu ostaje kakav je bio
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX_TEMA = (function () {
    'use strict';

    const P = MX_TEMA_POSTAVKE;
    const B = P.boje;
    const T = P.tekstovi || {};
    const HOST = 'voiceflow-chat';        // element u čiji shadow DOM Voiceflow crta chat
    // adresa mape u kojoj je ova skripta (GitHub Pages) — odatle se učitavaju fontovi
    const BAZA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/tema-chata.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + a + ')'; }
    function svg(s) { return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")'; }
    // tekst za CSS content: "..."
    function tekst(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\A ') + '"'; }

    const BLUR = Math.max(0, +P.zamucenje || 0);
    const POKRET = +P.pokretPozadine > 0 ? Math.max(12, +P.pokretPozadine) + 's' : '';

    // fino zrno filma (šum), poluprozirne topla svijetle i tamne točkice
    const ZRNO = svg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">' +
      '<filter id="z"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>' +
      '<feColorMatrix values="0 0 0 0 1  0 0 0 0 .93  0 0 0 0 .86  0 0 0 .42 -.18"/></filter>' +
      '<rect width="100%" height="100%" filter="url(#z)"/></svg>');

    // ── STIL ─────────────────────────────────────────────────────────────
    // Svi selektori počinju s ":host .vfrc-widget", pa su jači od
    // Voiceflowovih (i kad Voiceflow svoj stil učita poslije ovoga).
    const W = ':host .vfrc-widget';
    // dijelovi prozora koji nemaju službenu klasu, nađeni po rasporedu
    const PROZOR = W + ' .vfrc-chat';
    const ZAGLAVLJE = PROZOR + ' > .vfrc-header';
    const PORUKE = PROZOR + ' > div:has(> .vfrc-chat-dialog)';             // dio koji se pomiče (poruke)
    const RED_UNOSA = W + ' .vfrc-footer > div:has(> .vfrc-input-container)';
    const NAPOMENA = RED_UNOSA + ' > .vfrc-input-container ~ div';          // "Powered by...", upozorenje o AI-ju
    const PLOCA_POCETKA = W + ' .vfrc-footer > div:has(> #vfrc-start-chat)';
    const KORISNIK = W + ' .vfrc-user-response > div';
    const MARTI = W + ' .vfrc-system-response .vfrc-message:not([class*="vfrc-message--extension"])';
    const TIPKA = W + ' div:has(> .vfrc-typing-indicator)';
    const POSALJI = W + ' #vfrc-send-message';

    const VISINA_ZAGLAVLJA = 58;          // px, staklena kapsula gore
    const RUB_ZAGLAVLJA = 10;             // px od ruba prozora
    const ISPOD_DNA = 84;                 // px: koliko se poruke protežu ispod polja za poruku (najviše visina dna)

    // tanki svijetli rub stakla (svjetlo odozgo slijeva): prsten iz maske
    const RUB = `
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        padding: 1px;
        border-radius: inherit;
        background: var(--mx-t-rub);
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
                mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
        pointer-events: none;`;

    const CSS = `
      :host {
        --mx-t-podloga: ${B.podloga};
        --mx-t-podloga-0: ${prozirna(B.podloga, 0)};
        --mx-t-podloga-60: ${prozirna(B.podloga, .6)};
        --mx-t-podloga-90: ${prozirna(B.podloga, .9)};
        --mx-t-bjelokost: ${B.bjelokost};
        --mx-t-tih: ${B.tih};
        --mx-t-rose: ${B.roseGold};
        --mx-t-rose-55: ${prozirna(B.roseGold, .55)};
        --mx-t-rose-35: ${prozirna(B.roseGold, .35)};
        --mx-t-rose-18: ${prozirna(B.roseGold, .18)};
        --mx-t-puder: ${B.puder};
        --mx-t-font: ${P.font};
        --mx-t-font-naslova: ${P.fontNaslova};
        /* staklo: bjelkasti veo, jači gore lijevo (odakle pada svjetlo) */
        --mx-t-staklo: linear-gradient(155deg, ${prozirna(B.puder, .17)} 0%, ${prozirna(B.puder, .07)} 46%, ${prozirna(B.puder, .1)} 100%);
        --mx-t-staklo-tamno: ${prozirna('#2a1c16', .46)};
        --mx-t-rub: linear-gradient(150deg, rgba(255, 255, 255, .5) 0%, rgba(255, 255, 255, .12) 26%, rgba(255, 255, 255, .03) 55%, rgba(255, 255, 255, .1) 82%, rgba(255, 255, 255, .26) 100%);
        --mx-t-rub-rose: linear-gradient(150deg, ${prozirna(B.puder, .75)} 0%, ${prozirna(B.roseGold, .4)} 30%, ${prozirna(B.roseGold, .14)} 60%, ${prozirna(B.puder, .45)} 100%);
        --mx-t-odsjaj: inset 0 1px 0 rgba(255, 255, 255, .14);
        --mx-t-sjena: 0 14px 34px -18px rgba(0, 0, 0, .75), 0 2px 6px -2px rgba(0, 0, 0, .25);
        --mx-t-zamucenje: blur(${BLUR}px) saturate(165%);
        --mx-t-kupac: linear-gradient(155deg, ${prozirna(B.puder, .34)} 0%, ${prozirna(B.kupac, .5)} 42%, ${prozirna(B.kupac, .36)} 100%);
        --mx-t-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-t-meko: cubic-bezier(.45, 0, .2, 1);
      }

      /* ═══ PROZOR ═══ */
      ${PROZOR} {
        isolation: isolate;
        overflow: clip;                   /* svjetla koja plove preko ruba ne smiju pomaknuti prozor (fokus, skrol) */
        background: var(--mx-t-podloga);
        color: var(--mx-t-bjelokost);
        border-radius: 28px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, .07), 0 40px 90px -30px rgba(25, 10, 5, .75), 0 16px 34px -18px rgba(0, 0, 0, .5);
        font-family: var(--mx-t-font);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      @media (max-width: 768px) {
        ${PROZOR} { border-radius: 0; }
      }

      /* svjetla u pozadini: tri meke mrlje boje (i zrno) polako plove */
      ${PROZOR}::before {
        content: "";
        position: absolute;
        top: -30%; right: -30%; bottom: -30%; left: -30%;
        z-index: 0;
        background:
          ${P.zrno ? ZRNO + ' 0 0 / 180px 180px repeat,' : ''}
          radial-gradient(40% 30% at 28% 24%, ${prozirna(B.terakota, .68)}, ${prozirna(B.terakota, 0)}),
          radial-gradient(32% 34% at 78% 50%, ${prozirna(B.med, .3)}, ${prozirna(B.med, 0)}),
          radial-gradient(46% 32% at 32% 80%, ${prozirna(B.vino, .62)}, ${prozirna(B.vino, 0)}),
          radial-gradient(36% 26% at 72% 86%, ${prozirna(B.roza, .26)}, ${prozirna(B.roza, 0)}),
          radial-gradient(70% 55% at 50% 50%, ${prozirna(B.vino, .32)}, ${prozirna(B.vino, 0)});
        pointer-events: none;
        ${POKRET ? `animation: mx-t-plovi ${POKRET} ease-in-out infinite alternate;` : ''}
      }
      /* tama se zgusne na vrhu i dnu: poruke tiho nestaju ispod stakla */
      ${PROZOR}::after {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 2;
        background:
          linear-gradient(180deg, var(--mx-t-podloga-90) 0, var(--mx-t-podloga-60) calc(${VISINA_ZAGLAVLJA + RUB_ZAGLAVLJA}px + env(safe-area-inset-top, 0px)), var(--mx-t-podloga-0) calc(${VISINA_ZAGLAVLJA + RUB_ZAGLAVLJA + 34}px + env(safe-area-inset-top, 0px))),
          linear-gradient(0deg, var(--mx-t-podloga-90) 0, var(--mx-t-podloga-60) ${ISPOD_DNA - 30}px, var(--mx-t-podloga-0) ${ISPOD_DNA + 34}px);
        pointer-events: none;
      }
      /* stariji preglednik bez overflow: clip: svjetla miruju unutar prozora */
      @supports not (overflow: clip) {
        ${PROZOR}::before { top: 0; right: 0; bottom: 0; left: 0; animation: none; }
      }
      @keyframes mx-t-plovi {
        0%   { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); }
        50%  { transform: translate3d(-4%, 3%, 0) rotate(8deg) scale(1.06); }
        100% { transform: translate3d(3%, -2%, 0) rotate(-6deg) scale(1.02); }
      }

      /* ═══ ZAGLAVLJE: plutajuća staklena kapsula ═══ */
      ${ZAGLAVLJE} {
        position: relative;
        z-index: 3;
        flex: none;
        height: ${VISINA_ZAGLAVLJA}px;
        margin: calc(${RUB_ZAGLAVLJA}px + env(safe-area-inset-top, 0px)) ${RUB_ZAGLAVLJA}px 0;
        padding: 0 9px 0 9px;
        border-radius: 999px;
        background: var(--mx-t-staklo), var(--mx-t-staklo-tamno);
        -webkit-backdrop-filter: var(--mx-t-zamucenje);
                backdrop-filter: var(--mx-t-zamucenje);
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
      }
      ${ZAGLAVLJE}::before { ${RUB} }
      ${ZAGLAVLJE} > .vfrc-avatar {
        width: 40px;
        height: 40px;
        background-color: ${prozirna(B.puder, .1)};
        box-shadow: 0 0 0 1px var(--mx-t-rose-35), 0 0 18px -4px var(--mx-t-rose-35);
      }
      ${ZAGLAVLJE} .vfrc-header--title {
        margin: 0 12px;
        font-family: var(--mx-t-font-naslova);
        font-size: 21px;
        font-weight: 600;
        line-height: 1.05;
        letter-spacing: .01em;
        color: var(--mx-t-bjelokost);
      }
      ${P.podnaslovZaglavlja ? `
      ${ZAGLAVLJE} .vfrc-header--title::after {
        content: ${tekst(P.podnaslovZaglavlja)};
        display: block;
        margin-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: var(--mx-t-font);
        font-size: 9.5px;
        font-weight: 400;
        line-height: 1.3;
        letter-spacing: .24em;
        text-transform: uppercase;
        color: var(--mx-t-rose);
        opacity: .85;
      }` : ''}
      ${ZAGLAVLJE} .vfrc-header--button {
        position: relative;
        width: 40px;
        height: 40px;
        padding: 9px;
        border-radius: 50%;
        color: var(--mx-t-bjelokost);
        background: ${prozirna(B.puder, .07)};
        transition: background-color .3s var(--mx-t-meko), transform .3s var(--mx-t-glatko);
      }
      ${ZAGLAVLJE} .vfrc-header--button::before { ${RUB} opacity: .7; }
      ${ZAGLAVLJE} .vfrc-header--button:hover { color: #fff; background: ${prozirna(B.puder, .16)}; }
      ${ZAGLAVLJE} .vfrc-header--button:active { transform: scale(.94); background: ${prozirna(B.puder, .22)}; }
      ${ZAGLAVLJE} .vfrc-header--button:focus-visible { outline: 1px solid var(--mx-t-rose); outline-offset: 2px; }

      /* ═══ PORUKE: klize ispod zaglavlja i ispod polja za poruku ═══ */
      ${PORUKE} {
        z-index: 1;
        margin: calc(-${VISINA_ZAGLAVLJA + RUB_ZAGLAVLJA}px - env(safe-area-inset-top, 0px)) 0 -${ISPOD_DNA}px;
        padding: calc(${VISINA_ZAGLAVLJA + RUB_ZAGLAVLJA + 14}px + env(safe-area-inset-top, 0px)) 18px ${ISPOD_DNA + 18}px;
      }

      /* uvod na vrhu razgovora: Marti i kratki opis */
      ${W} .vfrc-assistant-info { padding: 26px 20px 18px; font-family: var(--mx-t-font); }
      ${W} .vfrc-assistant-info .vfrc-avatar {
        width: 76px;
        height: 76px;
        background-color: ${prozirna(B.puder, .1)};
        box-shadow: 0 0 0 1px var(--mx-t-rose-35), 0 0 0 7px ${prozirna(B.puder, .04)}, 0 0 44px -6px ${prozirna(B.terakota, .7)};
      }
      ${W} .vfrc-assistant-info--title {
        margin-bottom: 4px;
        font-family: var(--mx-t-font-naslova);
        font-size: 30px;
        font-weight: 500;
        line-height: 1.15;
        letter-spacing: .01em;
        color: var(--mx-t-bjelokost);
      }
      ${W} .vfrc-assistant-info--description {
        font-size: 10.5px;
        font-weight: 400;
        line-height: 1.6;
        letter-spacing: .26em;
        text-transform: uppercase;
        color: var(--mx-t-rose);
      }

      /* avatar uz Martine poruke */
      ${W} .vfrc-system-response > .vfrc-avatar {
        background-color: ${prozirna(B.puder, .1)};
        box-shadow: 0 0 0 1px var(--mx-t-rose-35);
      }

      /* Martina poruka: zamagljeno staklo */
      ${MARTI} {
        position: relative;
        background: var(--mx-t-staklo);
        color: var(--mx-t-bjelokost);
        border-radius: 20px 20px 20px 7px;
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
        font-family: var(--mx-t-font);
        font-size: 14.5px;
        font-weight: 300;
        line-height: 1.55;
        letter-spacing: .005em;
        animation: mx-t-pojava .7s var(--mx-t-glatko) backwards;
      }
      ${MARTI}::before { ${RUB} }
      ${MARTI} > .markdown { padding: 12px 17px 12px; }
      ${MARTI} strong, ${MARTI} b { font-weight: 500; color: var(--mx-t-puder); }
      ${MARTI} a {
        color: var(--mx-t-rose);
        text-decoration: underline;
        text-decoration-color: var(--mx-t-rose-55);
        text-underline-offset: 3px;
        transition: color .2s ease, text-decoration-color .2s ease;
      }
      ${MARTI} a:hover { color: var(--mx-t-puder); text-decoration-color: var(--mx-t-puder); }
      ${MARTI} code { padding: 1px 5px; border-radius: 6px; background: ${prozirna(B.puder, .1)}; color: var(--mx-t-puder); }
      ${MARTI} hr { border: 0; height: 1px; background: linear-gradient(90deg, var(--mx-t-rose-18), var(--mx-t-rose-55), var(--mx-t-rose-18)); }
      ${MARTI} ul, ${MARTI} ol { padding-left: 1.25em; }
      ${MARTI} li::marker { color: var(--mx-t-rose); }

      /* kupčeva poruka: staklo u boji ružičastog zlata */
      ${KORISNIK} {
        position: relative;
        background: var(--mx-t-kupac);
        color: #fffaf6;
        border-radius: 20px 20px 7px 20px;
        padding: 12px 17px 12px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .28), 0 14px 30px -18px ${prozirna(B.kupac, .9)}, 0 2px 6px -2px rgba(0, 0, 0, .25);
        font-family: var(--mx-t-font);
        font-size: 14.5px;
        font-weight: 400;
        line-height: 1.5;
        letter-spacing: .005em;
        text-shadow: 0 1px 1px rgba(60, 25, 15, .25);
        animation: mx-t-pojava-desno .6s var(--mx-t-glatko) backwards;
      }
      ${KORISNIK}::before { ${RUB} background: var(--mx-t-rub-rose); }

      /* Marti tipka: tri točkice u staklu */
      ${TIPKA} {
        position: relative;
        background: var(--mx-t-staklo);
        border-radius: 20px 20px 20px 7px;
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
      }
      ${TIPKA}::before { ${RUB} }
      ${W} .vfrc-typing-indicator > span {
        background-color: var(--mx-t-rose);
        box-shadow: 0 0 8px var(--mx-t-rose-55);
        animation-name: mx-t-tocka;       /* trajanje i zastoj točkica ostaju Voiceflowovi */
      }
      @keyframes mx-t-tocka {
        0%, 60%, 100% { opacity: .35; transform: scale(.85); }
        25%           { opacity: 1; transform: scale(1.15); }
      }

      /* ponuđeni odgovori: staklene pilule s rubom ružičastog zlata */
      ${W} .vfrc-system-response--actions { gap: 8px; margin: 14px 0 6px; }
      ${W} .vfrc-system-response--actions .vfrc-button {
        position: relative;
        padding: 9px 17px 9px;
        border-radius: 999px;
        background: ${prozirna(B.puder, .06)};
        color: var(--mx-t-puder);
        box-shadow: inset 0 0 0 1px var(--mx-t-rose-35), inset 0 1px 0 rgba(255, 255, 255, .12);
        font-family: var(--mx-t-font);
        font-size: 13.5px;
        font-weight: 400;
        line-height: 18px;
        letter-spacing: .02em;
        transition: background-color .3s var(--mx-t-meko), box-shadow .3s var(--mx-t-meko), color .3s var(--mx-t-meko), transform .3s var(--mx-t-glatko);
      }
      ${W} .vfrc-system-response--actions .vfrc-button:hover {
        color: #fff;
        background: var(--mx-t-rose-18);
        box-shadow: inset 0 0 0 1px var(--mx-t-rose-55), inset 0 1px 0 rgba(255, 255, 255, .2), 0 0 22px -6px var(--mx-t-rose-55);
      }
      ${W} .vfrc-system-response--actions .vfrc-button:active { transform: scale(.97); background: ${prozirna(B.roseGold, .26)}; }
      ${W} .vfrc-system-response--actions .vfrc-button:focus-visible { outline: 1px solid var(--mx-t-rose); outline-offset: 3px; }

      /* Voiceflowove kartice i vrtuljak (ako ih Marti pošalje) */
      ${W} .vfrc-card {
        position: relative;
        background: var(--mx-t-staklo);
        color: var(--mx-t-bjelokost);
        border-radius: 20px;
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
        overflow: hidden;
      }
      ${W} .vfrc-card::before { ${RUB} z-index: 1; }
      ${W} .vfrc-card--header { color: var(--mx-t-bjelokost); font-family: var(--mx-t-font-naslova); font-size: 18px; font-weight: 600; }
      ${W} .vfrc-card--content, ${W} .vfrc-card--description { color: var(--mx-t-tih); }
      ${W} .vfrc-card .vfrc-button { background: ${prozirna(B.puder, .08)}; color: var(--mx-t-puder); border-radius: 999px; box-shadow: inset 0 0 0 1px var(--mx-t-rose-35); }
      ${W} .vfrc-card .vfrc-button:hover { background: var(--mx-t-rose-18); color: #fff; }
      ${W} .vfrc-image { border-radius: 18px; box-shadow: var(--mx-t-sjena); }
      ${W} .vfrc-timestamp { color: var(--mx-t-tih); opacity: .7; font-size: 10.5px; letter-spacing: .06em; }
      ${W} .vfrc-feedback button { color: var(--mx-t-tih); }

      /* kraj razgovora: tanke crte ružičastog zlata i natpis između njih */
      ${W} .vfrc-chat--status { margin: 22px 0 8px; }
      ${W} .vfrc-chat--status > div > div:nth-child(odd) {
        height: 1px;
        background: linear-gradient(90deg, var(--mx-t-podloga-0), var(--mx-t-rose-35));
      }
      ${W} .vfrc-chat--status > div > div:last-child { background: linear-gradient(90deg, var(--mx-t-rose-35), var(--mx-t-podloga-0)); }
      ${W} .vfrc-chat--status > div > div:nth-child(2) {
        background: transparent;
        color: var(--mx-t-rose);
        font-family: var(--mx-t-font);
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

      /* ekstenzije (npr. kartica proizvoda): bez Voiceflowova sivog okvira */
      ${W} .vfrc-message[class*="vfrc-message--extension"] {
        display: block;
        width: 100%;
        padding: 0;
        background: transparent;
        color: var(--mx-t-bjelokost);
      }

      /* ═══ DNO: polje za poruku je staklena kapsula ═══ */
      ${W} .vfrc-footer {
        position: relative;
        z-index: 3;
        flex: none;
        padding-bottom: env(safe-area-inset-bottom, 0px);
      }
      ${RED_UNOSA} { padding: 0 12px; background: none; }
      ${W} .vfrc-input-container {
        min-height: 54px;
        padding: 8px 8px 8px 20px;
        border: 0;
        border-radius: 27px;
        background: var(--mx-t-staklo), var(--mx-t-staklo-tamno);
        -webkit-backdrop-filter: var(--mx-t-zamucenje);
                backdrop-filter: var(--mx-t-zamucenje);
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
        transition: box-shadow .4s var(--mx-t-meko);
      }
      ${W} .vfrc-input-container::before { ${RUB} }
      ${W} .vfrc-input-container:hover { border: 0; }
      /* fokus: rub zasvijetli ružičastim zlatom (Voiceflowov okvir fokusa) */
      ${W} .vfrc-input-container > div:first-child {
        border-radius: inherit;
        box-shadow: inset 0 0 0 1px var(--mx-t-rose-55);
      }
      ${W} .vfrc-input-container:focus-within > div:first-child {
        box-shadow: inset 0 0 0 1px var(--mx-t-rose-55), 0 0 26px -6px var(--mx-t-rose-35);
      }
      ${W} .vfrc-chat-input {
        background: transparent;
        color: var(--mx-t-bjelokost);
        caret-color: var(--mx-t-rose);
        font-family: var(--mx-t-font);
        font-weight: 300;
        line-height: 22px;
        letter-spacing: .01em;
      }
      ${W} .vfrc-chat-input::placeholder { color: var(--mx-t-tih); opacity: .85; }
      ${W} .vfrc-chat-input::selection { background: var(--mx-t-rose-35); }
      /* ostali gumbi u polju (npr. mikrofon) */
      ${W} .vfrc-input-container button:not(#vfrc-send-message) {
        border-radius: 50%;
        color: var(--mx-t-tih);
        background: transparent;
      }
      ${W} .vfrc-input-container button:not(#vfrc-send-message):hover { color: var(--mx-t-puder); background: ${prozirna(B.puder, .1)}; }

      /* gumb za slanje: kuglica od ružičastog zlata; prazno polje → ugašena */
      ${POSALJI} {
        position: relative;
        width: 38px;
        height: 38px;
        background: radial-gradient(circle at 34% 28%, #fff4ec 0%, ${B.roseGold} 45%, #b98472 100%);
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, .7), inset 0 -2px 4px rgba(120, 60, 40, .35), 0 0 22px -4px var(--mx-t-rose-55);
        transition: background .35s var(--mx-t-meko), box-shadow .35s var(--mx-t-meko), transform .35s var(--mx-t-glatko), opacity .35s var(--mx-t-meko);
      }
      ${POSALJI} svg { color: #3a2219; }
      ${POSALJI}:hover { cursor: pointer; transform: scale(1.06); background: radial-gradient(circle at 34% 28%, #fff8f2 0%, ${B.puder} 45%, ${B.roseGold} 100%); }
      ${POSALJI}:active { transform: scale(.94); }
      ${W} .vfrc-input-container:has(.vfrc-chat-input:placeholder-shown) #vfrc-send-message {
        background: ${prozirna(B.puder, .08)};
        box-shadow: inset 0 0 0 1px ${prozirna(B.puder, .14)};
        transform: none;
        cursor: default;
      }
      ${W} .vfrc-input-container:has(.vfrc-chat-input:placeholder-shown) #vfrc-send-message svg { color: var(--mx-t-tih); }

      /* gumb "na dno razgovora" iznad polja */
      ${RED_UNOSA} > div:first-child button {
        border: 0;
        background: var(--mx-t-staklo), var(--mx-t-staklo-tamno);
        -webkit-backdrop-filter: var(--mx-t-zamucenje);
                backdrop-filter: var(--mx-t-zamucenje);
        color: var(--mx-t-bjelokost);
        box-shadow: inset 0 0 0 1px ${prozirna(B.puder, .16)}, var(--mx-t-sjena);
      }

      /* napomena ispod polja ("Powered by...", upozorenje o AI-ju) */
      ${NAPOMENA} {
        padding: 9px 16px 11px;
        font-family: var(--mx-t-font);
        font-size: 10.5px;
        font-weight: 400;
        letter-spacing: .04em;
        color: ${prozirna(B.tih, .75)};
      }
      ${NAPOMENA} a, ${NAPOMENA} span { color: inherit; }
      ${NAPOMENA} a:hover { color: var(--mx-t-rose); text-decoration-color: var(--mx-t-rose); }
      ${NAPOMENA} div:empty { background-color: ${prozirna(B.tih, .5)}; }

      /* ═══ KRAJ RAZGOVORA I "NOVI RAZGOVOR?": staklene ploče ═══ */
      ${PLOCA_POCETKA}, ${W} .vfrc-prompt {
        padding: 16px 16px calc(32px + env(safe-area-inset-bottom, 0px));
        border-radius: 26px 26px 0 0;
        background: var(--mx-t-staklo), ${prozirna('#1f1410', .72)};
        -webkit-backdrop-filter: var(--mx-t-zamucenje);
                backdrop-filter: var(--mx-t-zamucenje);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .16), 0 -20px 40px -24px rgba(0, 0, 0, .8);
      }
      ${PLOCA_POCETKA}::before, ${W} .vfrc-prompt::before { ${RUB} }
      ${W} .vfrc-chat--overlay { background-color: ${prozirna(B.podloga, .55)}; }
      ${W} #vfrc-start-chat,
      ${W} .vfrc-prompt .vfrc-button {
        position: relative;
        min-height: 46px;
        border-radius: 999px;
        font-family: var(--mx-t-font);
        font-size: 11.5px;
        font-weight: 500;
        letter-spacing: .24em;
        text-transform: uppercase;
        transition: background .35s var(--mx-t-meko), color .35s var(--mx-t-meko), transform .35s var(--mx-t-glatko), box-shadow .35s var(--mx-t-meko);
      }
      /* glavni gumb: ružičasto zlato */
      ${W} #vfrc-start-chat,
      ${W} .vfrc-prompt .vfrc-button:first-child {
        background: linear-gradient(155deg, #f6e3d8 0%, ${B.roseGold} 52%, #c9998a 100%);
        color: #2a1a13;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7), 0 12px 28px -14px ${prozirna(B.roseGold, .8)};
      }
      ${W} #vfrc-start-chat:hover,
      ${W} .vfrc-prompt .vfrc-button:first-child:hover {
        background: linear-gradient(155deg, #fff2ea 0%, ${B.puder} 52%, ${B.roseGold} 100%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .8), 0 14px 32px -12px ${prozirna(B.roseGold, .9)};
      }
      /* sporedni gumb: staklo */
      ${W} .vfrc-prompt .vfrc-button:last-child:not(:first-child) {
        background: ${prozirna(B.puder, .07)};
        color: var(--mx-t-puder);
        box-shadow: inset 0 0 0 1px var(--mx-t-rose-35);
      }
      ${W} .vfrc-prompt .vfrc-button:last-child:not(:first-child):hover { background: var(--mx-t-rose-18); color: #fff; }
      ${W} #vfrc-start-chat:active,
      ${W} .vfrc-prompt .vfrc-button:active { transform: scale(.98); }
      ${W} #vfrc-start-chat:focus-visible,
      ${W} .vfrc-prompt .vfrc-button:focus-visible { outline: 1px solid var(--mx-t-rose); outline-offset: 3px; }
      ${T.noviRazgovor ? `
      ${W} #vfrc-start-chat,
      ${W} .vfrc-prompt .vfrc-button:first-child { font-size: 0; letter-spacing: 0; }
      ${W} #vfrc-start-chat::after,
      ${W} .vfrc-prompt .vfrc-button:first-child::after {
        content: ${tekst(T.noviRazgovor)};
        font-size: 11.5px;
        letter-spacing: .24em;
        padding-left: .24em;
      }` : ''}
      ${T.odustani ? `
      ${W} .vfrc-prompt .vfrc-button:last-child:not(:first-child) { font-size: 0; letter-spacing: 0; }
      ${W} .vfrc-prompt .vfrc-button:last-child:not(:first-child)::after {
        content: ${tekst(T.odustani)};
        font-size: 11.5px;
        letter-spacing: .24em;
        padding-left: .24em;
      }` : ''}

      /* ═══ KARTICA PROIZVODA (kartica-artikla.js): tamno staklo ═══ */
      ${W} .mx {
        --mx-tinta: ${B.bjelokost};
        --mx-dim: ${B.tih};
        --mx-linija: rgba(255, 255, 255, .1);
        --mx-kartica: transparent;
        --mx-cijena: ${B.roseGold};
        --mx-rub-hover: var(--mx-t-rose-55);
        --mx-ikona: ${B.roseGold};
      }
      ${W} .mx-kartica {
        background: var(--mx-t-staklo);
        border-color: rgba(255, 255, 255, .08);
        border-radius: 24px;
        box-shadow: var(--mx-t-odsjaj), 0 22px 44px -26px rgba(0, 0, 0, .85), 0 2px 8px -3px rgba(0, 0, 0, .3);
      }
      ${W} .mx-kartica::before { border-color: rgba(255, 255, 255, .06); border-radius: 19px; }
      ${W} .mx-maglica { border-radius: 24px; }
      /* vitrina: svijetla niša u kojoj stoji bočica (fotografija i aura su
         napravljene za svijetlu podlogu, pa ovako uvijek izgledaju kako treba) */
      ${W} .mx-izlog {
        border-radius: 16px;
        overflow: hidden;
        background: ${B.vitrina};
        box-shadow: 0 0 0 1px rgba(255, 255, 255, .22), 0 12px 26px -16px rgba(0, 0, 0, .8);
      }
      ${W} .mx-izlog::after {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 3;
        border-radius: inherit;
        box-shadow: inset 0 0 22px ${prozirna('#8c5a46', .16)}, inset 0 1px 0 rgba(255, 255, 255, .9);
        pointer-events: none;
      }
      ${W} .mx-naziv { color: var(--mx-t-puder); font-size: 16px; }
      ${W} .mx-marka { color: var(--mx-t-bjelokost); }
      ${W} .mx-oznaka { background: var(--mx-t-rose); color: #2a1a13; }
      ${W} .mx-popust { color: #2a1a13; }
      ${W} .mx-gumb {
        min-height: 34px;
        border-color: var(--mx-t-rose-55);
        background: ${prozirna(B.puder, .06)};
        color: var(--mx-t-puder);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .1);
      }
      ${W} .mx-gumb:focus-visible { outline-color: var(--mx-t-rose); }
      ${W} .mx-gumb:active { background: var(--mx-t-rose); color: #2a1a13; border-color: var(--mx-t-rose); }
      @media (hover: hover) {
        ${W} .mx-gumb:hover { background: var(--mx-t-rose); color: #2a1a13; border-color: var(--mx-t-rose); }
      }

      ${P.pocetniEkran ? `
      /* ═══ POČETNI EKRAN (pocetna-chata.js) ═══ */
      /* topla svjetla u kutovima, kao u razgovoru (preko crne podloge animacije) */
      ${W} .mx-p::before {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 1;
        background:
          radial-gradient(60% 34% at 0% 0%, ${prozirna(B.terakota, .34)}, ${prozirna(B.terakota, 0)}),
          radial-gradient(55% 30% at 100% 100%, ${prozirna(B.med, .2)}, ${prozirna(B.med, 0)}),
          radial-gradient(70% 26% at 50% 100%, ${prozirna(B.roza, .16)}, ${prozirna(B.roza, 0)});
        mix-blend-mode: screen;
        pointer-events: none;
      }
      ${W} .mx-p-zatvori {
        top: calc(env(safe-area-inset-top, 0px) + 12px);
        right: 12px;
        width: 40px;
        height: 40px;
        background: ${prozirna(B.puder, .07)};
        -webkit-backdrop-filter: var(--mx-t-zamucenje);
                backdrop-filter: var(--mx-t-zamucenje);
        box-shadow: var(--mx-t-odsjaj);
      }
      ${W} .mx-p-zatvori::before { ${RUB} }
      ${W} .mx-p-zatvori:hover { background: ${prozirna(B.puder, .16)}; }
      /* "POČETAK": staklena pilula koja tiho diše svjetlom */
      ${W} .mx-p-gumb {
        position: relative;
        padding: 16px 38px 15px;
        border-radius: 999px;
        background: var(--mx-t-staklo), ${prozirna('#2a1c16', .35)};
        -webkit-backdrop-filter: var(--mx-t-zamucenje);
                backdrop-filter: var(--mx-t-zamucenje);
        box-shadow: var(--mx-t-odsjaj), 0 0 0 0 var(--mx-t-rose-18), 0 16px 34px -18px rgba(0, 0, 0, .9);
        animation: mx-t-disanje 2.6s ease-in-out infinite;
        transition: transform .4s var(--mx-t-glatko), background .4s var(--mx-t-meko);
      }
      ${W} .mx-p-gumb::before { ${RUB} background: var(--mx-t-rub-rose); }
      ${W} .mx-p-gumb:hover { transform: translateY(-1px); background: var(--mx-t-staklo), ${prozirna(B.roseGold, .16)}; }
      ${W} .mx-p-gumb:active { transform: scale(.98); }
      ${W} .mx-p-gumb:focus-visible { outline-offset: 5px; border-radius: 999px; }
      ${W} .mx-p-gumb-crta { display: none; }
      ${W} .mx-p-gumb-tekst { font-size: 14px; }
      @keyframes mx-t-disanje {
        0%, 100% { box-shadow: var(--mx-t-odsjaj), 0 0 0 0 var(--mx-t-rose-18), 0 16px 34px -18px rgba(0, 0, 0, .9); }
        50%      { box-shadow: var(--mx-t-odsjaj), 0 0 28px 2px var(--mx-t-rose-18), 0 16px 34px -18px rgba(0, 0, 0, .9); }
      }` : ''}

      ${P.gumbChata ? `
      /* ═══ GUMB CHATA U KUTU (gumb-chata.js): tamno, dimljeno staklo ═══ */
      ${W} .vfrc-launcher {
        background-color: ${prozirna('#1a100c', .88)};
        background-image:
          linear-gradient(155deg, ${prozirna(B.puder, .18)} 0%, ${prozirna(B.puder, .03)} 48%, ${prozirna(B.puder, .07)} 100%),
          radial-gradient(90% 140% at 15% 120%, ${prozirna(B.terakota, .5)}, ${prozirna(B.terakota, 0)});
        -webkit-backdrop-filter: blur(14px) saturate(170%);
                backdrop-filter: blur(14px) saturate(170%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .2), 0 1px 2px rgba(20, 10, 8, .2), 0 14px 30px -12px rgba(70, 30, 18, .6);
      }
      @media (hover: hover) and (pointer: fine) {
        ${W} .vfrc-launcher:hover { box-shadow: inset 0 1px 0 rgba(255, 255, 255, .24), 0 2px 4px rgba(20, 10, 8, .18), 0 20px 36px -14px rgba(70, 30, 18, .7); }
      }` : ''}

      /* ═══ POJAVA PORUKA ═══ */
      @keyframes mx-t-pojava {
        from { opacity: 0; transform: translateY(8px) scale(.98); filter: blur(6px); }
        to   { opacity: 1; transform: none; filter: blur(0); }
      }
      @keyframes mx-t-pojava-desno {
        from { opacity: 0; transform: translate(6px, 6px) scale(.98); filter: blur(6px); }
        to   { opacity: 1; transform: none; filter: blur(0); }
      }
      @keyframes mx-t-prozirnost {
        from { opacity: 0; }
      }

      /* preglednik bez zamućenja pozadine: staklo je gušće */
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        :host { --mx-t-staklo-tamno: ${prozirna('#2a1c16', .9)}; }
      }
      /* "Smanji prozirnost": gušće staklo */
      @media (prefers-reduced-transparency: reduce) {
        :host {
          --mx-t-staklo: linear-gradient(155deg, ${prozirna(B.puder, .2)}, ${prozirna(B.puder, .14)});
          --mx-t-staklo-tamno: ${prozirna('#2a1c16', .92)};
        }
        ${PROZOR}::before { opacity: .6; }
      }
      /* "Smanji pokrete": svjetla miruju, poruke se samo tiho pojave */
      @media (prefers-reduced-motion: reduce) {
        ${PROZOR}::before { animation: none; }
        ${MARTI}, ${KORISNIK} { animation: mx-t-prozirnost .3s linear backwards; }
        ${W} .mx-p-gumb { animation: none; }
        ${W} .vfrc-typing-indicator > span { animation: none; opacity: .8; }
        ${POSALJI}, ${POSALJI}:hover, ${POSALJI}:active,
        ${W} .vfrc-system-response--actions .vfrc-button:active { transform: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-tema]');
      if (stari && stari.getAttribute('data-mx-tema') === '1') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-tema', '1');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // Fontove (Jost i Cormorant Garamond iz mape fonts/) inače učitavaju
    // kartica-artikla.js i pocetna-chata.js; ako su oba isključena, učitaju
    // se ovdje. Idu u <head> stranice: fontovi iz <head> vrijede i unutar
    // shadow roota.
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
      // tanki Jost (300) za poruke; isti id kao u pocetna-chata.js, da se ne učita dvaput
      if (!document.getElementById('mx-pocetna-font-300')) dodaj('mx-pocetna-font-300', [['MX Jost', 'jost', '300']]);
      if (document.getElementById('mx-kartice-font') || document.getElementById('mx-pocetna-font') || document.getElementById('mx-tema-font')) return;
      dodaj('mx-tema-font', [['MX Jost', 'jost', '400 600'], ['MX Cormorant', 'cormorant-garamond', '500 700']]);
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
      ubaciFontove();
      cekajHost(function (host) { ubaciStil(host.shadowRoot); });
    }

    return { pokreni: pokreni };
  })();

  try { MX_TEMA.pokreni(); }
  catch (e) { console.warn('[Martimex] Izgled chata "Staklo" nije pokrenut:', e); }

})();
