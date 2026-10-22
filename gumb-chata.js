(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — gumb koji otvara chat s Marti: "oblačić s točkicama" (v4)
  //
  //  Gumb u kutu ekrana i dalje crta Voiceflow; ovaj modul mu daje izgled:
  //
  //   - crna pilula s tankim rubom boje ružičastog zlata
  //   - lijevo ikona: oblačić (tanki rozi obrub, crna unutrašnjost, repić
  //     dolje lijevo) s tri svijetle točkice u sredini
  //   - natpis ("Asistent", kako je upisan u Voiceflowu) velikim,
  //     razmaknutim slovima, istim fontom kao poruke u chatu (Jost), u
  //     prašnjavoj rozoj
  //   - JEDINA animacija: tri točkice u oblačiću se jedna za drugom lagano
  //     podignu i spuste, kao kad netko tipka u chatu, svakih 5 sekundi.
  //     Nema svjetla po rubu, nema bočice, nema pojave pri učitavanju
  //   - miš iznad gumba: rub malo posvijetli (bez pomicanja); pritisak:
  //     gumb se tek malo stisne; fokus s tipkovnice: vidljiv obrub
  //
  //  Dok je chat otvoren, gumb je okrugli gumb za zatvaranje (Voiceflowova
  //  strelica, u rozoj) iste visine i s istim rubom. Ako je na uređaju
  //  uključeno "Smanji pokrete", točkice miruju.
  //
  //  Tehnički: Voiceflow crta chat u shadow DOM-u elementa #voiceflow-chat.
  //  Modul onamo ubaci svoj stil i u gumb ništa ne umeće: oblačić i
  //  točkice su pozadina Voiceflowove slike ikone (slika se makne iz vidnog
  //  polja), pa je Voiceflow i dalje sam skriva kad se chat otvori. Oslanja
  //  se na klasu .vfrc-launcher, koju Voiceflow službeno podržava za
  //  prilagodbu. Ako Voiceflow jednog dana promijeni gumb, izgled izostane,
  //  a chat radi normalno.
  //  Pregled bez Voiceflowa: pokusi/gumb/pregled.html. Izvornik ikone:
  //  ikone/oblacic.svg.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxGumbChata) return;   // zaštita ako se modul učita dvaput
  window.__mxGumbChata = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_GUMB_POSTAVKE = {
    boje: {                   // uvijek u obliku #rrggbb
      podloga: '#000000',     // gumb
      roza:    '#e3c1ac',     // natpis, obrub oblačića, rub gumba, strelica za zatvaranje
      tockice: '#fff7f0',     // tri točkice u oblačiću
      tinta:   '#000000'      // obrub gumba kad se do njega dođe tipkovnicom (Tab)
    },

    // isti font kao poruke u chatu (Jost iz mape fonts/)
    font: '"MX Jost", "Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, sans-serif',
    velicinaNatpisa: 12,      // px
    razmakSlova: 0.22,        // em (bilo 0,34; manje = uži gumb)

    visina: 44,               // px, visina gumba
    tockice: 5                // svakih koliko sekundi se točkice pomaknu (val traje oko 1 s, ostatak miruju); 0 = miruju
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX_GUMB = (function () {
    'use strict';

    const P = MX_GUMB_POSTAVKE;
    const B = P.boje;
    const HOST = 'voiceflow-chat';        // element u čiji shadow DOM Voiceflow crta chat
    const GUMB = '.vfrc-launcher';        // Voiceflowova službena klasa gumba
    // gumb s natpisom: omot ikone (prvi div) i natpis (zadnji div)
    const OMOT = GUMB + ' > div:first-child:not(:last-child)';
    const NATPIS = GUMB + ' > div:last-child:not(:first-child)';
    const IKONA = OMOT + ' > img';
    const ZATVOREN = ':host(:not([data-mx-otvoren]))';
    const OTVOREN = ':host([data-mx-otvoren])';
    // adresa mape ove skripte (vrh repozitorija); fontovi su u njezinoj mapi fonts/
    const KORIJEN = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/gumb-chata.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + a + ')'; }
    function broj(v, zadano, min, max) { v = +v; return isFinite(v) ? Math.min(max, Math.max(min, v)) : zadano; }

    // ── OBLAČIĆ (24 × 24): tanki rozi obrub, crna unutrašnjost, repić dolje lijevo
    const OBLACIC = 'url("data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<path d="M6.5 3.25H17.5A3.75 3.75 0 0 1 21.25 7V13A3.75 3.75 0 0 1 17.5 16.75H9.6L5.75 20.25V16.6A3.75 3.75 0 0 1 2.75 13V7A3.75 3.75 0 0 1 6.5 3.25Z" ' +
      'fill="' + B.podloga + '" stroke="' + B.roza + '" stroke-width="1.5" stroke-linejoin="round"/></svg>') + '")';
    // točkica: krug promjera 2,6 px u kvadratu 4 × 4 px (tri sloja iste slike)
    const TOCKA = 'radial-gradient(circle at center, ' + B.tockice + ' 0 1.3px, ' + prozirna(B.tockice, 0) + ' 1.8px)';
    // sredine točkica: x = 8, 12, 16; y = 10 (u oblačiću 24 × 24) → lijevi gornji kut kvadrata 4 × 4
    const X = [6, 10, 14], Y = 8, GORE = 1.6;          // koliko se točkica podigne (px)
    function polozaj(d) {          // d = [pomak 1., 2. i 3. točkice prema gore]
      return d.map(function (p, i) { return X[i] + 'px ' + (Y - p).toFixed(2) + 'px'; }).join(', ') + ', 0 0';
    }
    const KRUG = +P.tockice > 0 ? Math.max(1.2, +P.tockice) : 0;      // s, jedan krug
    const TOCKICE = KRUG ? KRUG + 's' : '';
    // val točkica traje uvijek isto (oko 1 s), bez obzira na duljinu kruga
    function u(s) { return (KRUG ? Math.min(100, s / KRUG * 100) : 0).toFixed(2) + '%'; }
    const H = broj(P.visina, 44, 32, 64);
    const VEL = broj(P.velicinaNatpisa, 12, 9, 20);
    const RAZMAK = broj(P.razmakSlova, .34, 0, 1);

    // ── STIL ─────────────────────────────────────────────────────────────
    // Selektori počinju s :host (element #voiceflow-chat), pa su jači od
    // Voiceflowovih i vrijede bez obzira na redoslijed stilova.
    const CSS = `
      :host {
        --mx-g-podloga: ${B.podloga};
        --mx-g-roza: ${B.roza};
        --mx-g-rub: ${prozirna(B.roza, .42)};
        --mx-g-rub-jaci: ${prozirna(B.roza, .8)};
        --mx-g-tinta: ${B.tinta};
        --mx-g-sjena: inset 0 0 0 1px var(--mx-g-rub), 0 1px 2px rgba(0, 0, 0, .2), 0 14px 28px -14px rgba(0, 0, 0, .6);
        --mx-g-sjena-gore: inset 0 0 0 1px var(--mx-g-rub-jaci), 0 1px 2px rgba(0, 0, 0, .2), 0 14px 28px -14px rgba(0, 0, 0, .6);
      }

      /* ── gumb: crna pilula, tanki rub ružičastog zlata ── */
      :host ${GUMB} {
        background-color: var(--mx-g-podloga);
        color: var(--mx-g-roza);              /* i strelica za zatvaranje */
        box-shadow: var(--mx-g-sjena);
        -webkit-tap-highlight-color: transparent;
        animation: none;
        transition: box-shadow .3s ease, transform .12s ease, max-width .3s cubic-bezier(.4, 0, .2, 1);
      }
      /* Voiceflow gumb na dodir poveća za 10 % i posivi, a na pritisak smanji za 20 % */
      :host ${GUMB}:hover,
      :host ${GUMB}:active { background-color: var(--mx-g-podloga); transform: none; }
      :host ${GUMB}:active { transform: scale(.97); }
      :host ${GUMB}:focus-visible { outline: 2px solid var(--mx-g-tinta); outline-offset: 3px; }
      @media (hover: hover) and (pointer: fine) {
        :host ${GUMB}:hover { box-shadow: var(--mx-g-sjena-gore); }
      }

      /* chat zatvoren: gumb s ikonom i natpisom */
      ${ZATVOREN} ${GUMB} {
        height: ${H}px;
        padding: 0 17px 0 13px;
        gap: 8px;
      }
      /* chat otvoren: okrugli gumb za zatvaranje iste visine */
      ${OTVOREN} ${GUMB} {
        height: ${H}px;
        max-width: ${H}px;
        padding: ${Math.round((H - 32) / 2)}px;
      }

      /* ── natpis: velika razmaknuta slova, isti font kao poruke ── */
      :host ${NATPIS} {
        padding: 0;
        font-family: ${P.font};
        font-size: ${VEL}px;
        font-weight: 400;
        line-height: 18px;
        letter-spacing: ${RAZMAK}em;
        text-transform: uppercase;
        color: var(--mx-g-roza);
      }
      /* razmak iza zadnjeg slova ne računa se u širinu gumba */
      ${ZATVOREN} ${NATPIS} { margin-right: -${RAZMAK}em; }

      /* ── ikona: oblačić s tri točkice umjesto Voiceflowove slike (slika
         se makne iz vidnog polja, a oblačić i točkice su njezina pozadina;
         Voiceflow je i dalje sam skriva kad se chat otvori) ── */
      :host ${IKONA} {
        width: 24px;
        height: 24px;
        max-width: none;
        border-radius: 0;
        object-position: -9999px 0;
        color: transparent;                   /* ako se slika ne učita, ne vidi se ni njezin opis */
        font-size: 0;
        background-image: ${TOCKA}, ${TOCKA}, ${TOCKA}, ${OBLACIC};
        background-size: 4px 4px, 4px 4px, 4px 4px, 24px 24px;
        background-repeat: no-repeat;
        background-position: ${polozaj([0, 0, 0])};
        ${TOCKICE ? `animation: mx-g-tockice ${TOCKICE} ease-in-out infinite;` : ''}
      }
      /* točkice se podignu jedna za drugom (kao kad netko tipka, oko 1 s), pa miruju do kraja kruga */
      @keyframes mx-g-tockice {
        0%, ${u(1.05)}, 100% { background-position: ${polozaj([0, 0, 0])}; }
        ${u(.26)} { background-position: ${polozaj([GORE, 0, 0])}; }
        ${u(.52)} { background-position: ${polozaj([0, GORE, 0])}; }
        ${u(.78)} { background-position: ${polozaj([0, 0, GORE])}; }
      }

      /* ako sustav sam određuje boje (visoki kontrast), točkice miruju */
      @media (forced-colors: active) {
        :host ${IKONA} { animation: none; }
      }
      /* "Smanji pokrete": točkice miruju */
      @media (prefers-reduced-motion: reduce) {
        :host ${IKONA} { animation: none; }
        :host ${GUMB}:active { transform: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-gumb]');
      if (stari && stari.getAttribute('data-mx-gumb') === '4') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-gumb', '4');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // Font natpisa (Jost iz mape fonts/) ide u <head> stranice: fontovi iz
    // <head> vrijede i unutar shadow roota. Ako ga je neki drugi modul već
    // učitao, ne učitava se opet.
    function ubaciFont() {
      if (!document.head) return;
      if (document.getElementById('mx-gumb-font') || document.getElementById('mx-jedan-font') ||
          document.getElementById('mx-pocetna-font') || document.getElementById('mx-tema-font') ||
          document.getElementById('mx-kartice-font')) return;
      const rasponi = {
        'latin': 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
        'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'
      };
      const stil = document.createElement('style');
      stil.id = 'mx-gumb-font';
      stil.textContent = Object.keys(rasponi).map(function (r) {
        return '@font-face{font-family:"MX Jost";src:url("' + KORIJEN + 'fonts/jost-' + r + '.woff2") format("woff2");' +
          'font-weight:400 600;font-style:normal;font-display:swap;unicode-range:' + rasponi[r] + '}';
      }).join('\n');
      document.head.appendChild(stil);
    }

    // Voiceflow javlja otvaranje i zatvaranje chata porukom na window
    // ('{"type":"voiceflow:open"}' / '{"type":"voiceflow:close"}')
    function pratiOtvaranje() {
      window.addEventListener('message', function (e) {
        let d = e.data;
        if (typeof d === 'string') {
          if (d.indexOf('voiceflow:') === -1) return;
          try { d = JSON.parse(d); } catch (x) { return; }
        }
        const tip = d && d.type;
        const host = document.getElementById(HOST);
        if (!host) return;
        if (tip === 'voiceflow:open') host.setAttribute('data-mx-otvoren', '');
        else if (tip === 'voiceflow:close') host.removeAttribute('data-mx-otvoren');
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
      ubaciFont();
      pratiOtvaranje();
      cekajHost(function (host) { ubaciStil(host.shadowRoot); });
    }

    return { pokreni: pokreni, css: CSS };
  })();

  window.__mxGumbChataCss = MX_GUMB.css;   // samo za stranicu s pregledom (pokusi/gumb/pregled.html)

  try { MX_GUMB.pokreni(); }
  catch (e) { console.warn('[Martimex] Izgled gumba chata nije postavljen:', e); }

})();
