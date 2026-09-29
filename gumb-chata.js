(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — gumb koji otvara chat s Marti: "flakon i sprej" (v3)
  //
  //  Gumb u kutu ekrana i dalje crta Voiceflow; ovaj modul mu daje izgled
  //  koji pripada parfumeriji umjesto generičkog chat oblačića:
  //
  //   - ikona: mala bočica parfema s raspršivačem (čep od ružičastog zlata,
  //     stakleno tijelo s rozom tekućinom i odsjajem) umjesto oblačića
  //   - natpis ("Asistent", kako je upisan u Voiceflowu) u otmjenom
  //     serifnom fontu kojim su na karticama ispisani nazivi parfema
  //     (Cormorant Garamond), kao natpis na etiketi bočice
  //   - rub od ružičastog zlata, kao zlatotisak na kutiji parfema: po njemu
  //     neprestano polako putuje odsjaj svjetla
  //   - živa animacija, stalno (i na mobitelu): raspršivač se svakih
  //     nekoliko sekundi pritisne, iz njega izlete tri kapljice koje se na
  //     trenutak poslože u "···" (kao kad netko tipka u chatu), a onda se
  //     rasprše u meku rozu izmaglicu koja lagano prođe iza natpisa, kao
  //     trag mirisa
  //   - pojava: kad se stranica učita, gumb izroni iz blage izmaglice
  //   - miš iznad gumba: gumb se lagano podigne i natpis posvijetli; gumb
  //     ostaje svoje boje (Voiceflow ga inače posivi i poveća za 10 %)
  //   - pritisak: gumb se tek malo stisne; fokus s tipkovnice: vidljiv obrub
  //
  //  Dok je chat otvoren, gumb je samo okrugli gumb za zatvaranje (sa
  //  zlatnim rubom), bez spreja. Ako je na uređaju uključeno "Smanji
  //  pokrete", sve miruje.
  //
  //  Tehnički: Voiceflow crta chat u shadow DOM-u elementa #voiceflow-chat.
  //  Modul onamo ubaci svoj stil i u gumb ništa ne umeće; bočica se crta kao
  //  pozadina Voiceflowove slike ikone, pa je Voiceflow i dalje sam skriva
  //  kad se chat otvori. Oslanja se na klasu .vfrc-launcher, koju Voiceflow
  //  službeno podržava za prilagodbu. Ako se u Voiceflowu postavi druga
  //  ikona, ona ostaje (bez bočice i spreja). Ako Voiceflow jednog dana
  //  promijeni gumb, efekti izostanu, a chat radi normalno.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxGumbChata) return;   // zaštita ako se modul učita dvaput
  window.__mxGumbChata = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_GUMB_POSTAVKE = {
    boje: {                   // uvijek u obliku #rrggbb
      roza:    '#e2c3ba',     // prašnjava roza iza loga: tekućina, izmaglica, rub
      puder:   '#f6ebe7',     // najsvjetlija roza: natpis, staklo, kapljice
      zlato:   '#c99a8d',     // tamnija ružičasta: sjena na čepu i tekućini
      tinta:   '#000000'      // obrub gumba kad se do njega dođe tipkovnicom (Tab)
    },

    // font natpisa (isti kao nazivi parfema na karticama); "MX Cormorant"
    // učitava kartica-artikla.js iz mape fonts/
    font: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',
    velicinaNatpisa: 18,      // px

    sprej: 6.5,               // sekundi između dva "špricanja" (0 = bez spreja)
    odsjajNaRubu: 5,          // sekundi za jedan krug odsjaja po rubu (0 = rub miruje)
    pojava: true              // gumb pri učitavanju stranice izroni iz blage izmaglice
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
    // Voiceflowova zadana ikona (oblačić); samo nju zamjenjuje bočica
    const SLIKA = 'img[src*="/widget-next/message.png"]';
    const IKONA = GUMB + ' ' + SLIKA;

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + a + ')'; }
    function svg(s) { return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")'; }

    // ── BOČICA (24 × 24) ─────────────────────────────────────────────────
    // Dva sloja: čep s raspršivačem i tijelo (grlo, staklo, tekućina,
    // odsjaj). Čep je zaseban da se pri špricanju može spustiti.
    const OKVIR = 'viewBox="2.2 1.2 19.6 21" preserveAspectRatio="xMidYMid meet"';
    const CEP = svg(
      '<svg xmlns="http://www.w3.org/2000/svg" ' + OKVIR + '>' +
      '<defs><linearGradient id="m" x1="0" x2="1"><stop offset="0" stop-color="' + B.zlato + '"/>' +
      '<stop offset=".45" stop-color="' + B.puder + '"/><stop offset="1" stop-color="' + B.zlato + '"/></linearGradient></defs>' +
      '<rect x="9.4" y="1.6" width="5.2" height="3.5" rx="1.2" fill="url(#m)"/>' +
      '<rect x="14.3" y="2.75" width="2" height="1.15" rx=".55" fill="' + B.roza + '"/></svg>');
    const TIJELO = svg(
      '<svg xmlns="http://www.w3.org/2000/svg" ' + OKVIR + '>' +
      '<defs>' +
      '<linearGradient id="m" x1="0" x2="1"><stop offset="0" stop-color="' + B.zlato + '"/>' +
      '<stop offset=".5" stop-color="' + B.puder + '"/><stop offset="1" stop-color="' + B.zlato + '"/></linearGradient>' +
      '<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + B.roza + '"/>' +
      '<stop offset="1" stop-color="' + B.zlato + '"/></linearGradient>' +
      '<clipPath id="c"><rect x="5.6" y="7.4" width="12.8" height="14.1" rx="3"/></clipPath>' +
      '</defs>' +
      '<rect x="10.5" y="5" width="3" height="2.2" fill="url(#m)"/>' +
      '<rect x="5.6" y="7.4" width="12.8" height="14.1" rx="3" fill="' + B.puder + '" fill-opacity=".1"/>' +
      '<rect x="5" y="12.2" width="14" height="10" fill="url(#t)" clip-path="url(#c)"/>' +
      '<rect x="5" y="12.2" width="14" height=".7" fill="#fff" fill-opacity=".45" clip-path="url(#c)"/>' +
      '<rect x="5.6" y="7.4" width="12.8" height="14.1" rx="3" fill="none" stroke="' + B.puder + '" stroke-width="1.05"/>' +
      '<rect x="7.4" y="9.1" width="1.15" height="10.4" rx=".58" fill="#fff" fill-opacity=".6"/>' +
      '</svg>');

    // kapljica spreja (tri sloja iste slike)
    const KAP = 'radial-gradient(circle at center, ' + B.puder + ' 0 .95px, ' + prozirna(B.roza, 0) + ' 1.45px)';

    const SPREJ = +P.sprej > 0 ? Math.max(3, +P.sprej) + 's' : '';
    const ODSJAJ = +P.odsjajNaRubu > 0 ? Math.max(2, +P.odsjajNaRubu) + 's' : '';
    const POJAVA = P.pojava ? 'mx-g-pojava 1s var(--mx-g-glatko) .15s backwards' : 'none';

    // ── STIL ─────────────────────────────────────────────────────────────
    // Selektori počinju s :host (element #voiceflow-chat), pa su jači od
    // Voiceflowovih i vrijede bez obzira na redoslijed stilova.
    const CSS = `
      :host {
        --mx-g-puder: ${B.puder};
        --mx-g-rub: ${prozirna(B.roza, .42)};
        --mx-g-rub-sjaj: ${prozirna(B.puder, .95)};
        --mx-g-magla: ${prozirna(B.roza, .62)};
        --mx-g-magla-2: ${prozirna(B.roza, .22)};
        --mx-g-magla-0: ${prozirna(B.roza, 0)};
        --mx-g-kap-sjena: ${prozirna(B.roza, .9)};
        --mx-g-tinta: ${B.tinta};
        --mx-g-sjena: 0 1px 2px rgba(20, 10, 8, .16), 0 10px 22px -12px rgba(95, 52, 44, .55);
        --mx-g-sjena-gore: 0 2px 4px rgba(20, 10, 8, .14), 0 16px 26px -14px rgba(95, 52, 44, .62);
        --mx-g-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-g-meko: cubic-bezier(.45, 0, .2, 1);
      }

      /* ── gumb ── */
      :host ${GUMB} {
        position: relative;
        isolation: isolate;
        box-shadow: var(--mx-g-sjena);
        -webkit-tap-highlight-color: transparent;
        animation: ${POJAVA};
      }
      :host ${GUMB} > div { position: relative; z-index: 2; }   /* ikona i natpis iznad izmaglice */

      /* rub od ružičastog zlata s odsjajem koji putuje (tanki prsten: maska
         izreže unutrašnjost, ostane samo 1 px ruba) */
      :host ${GUMB}::before {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 3;
        padding: 1px;
        border-radius: inherit;
        background: linear-gradient(105deg, var(--mx-g-rub) 0%, var(--mx-g-rub) 40%, var(--mx-g-rub-sjaj) 50%, var(--mx-g-rub) 60%, var(--mx-g-rub) 100%) 0 0 / 200% 100% repeat-x;
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
                mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
        pointer-events: none;
        ${ODSJAJ ? `animation: mx-g-zlato ${ODSJAJ} linear infinite;` : ''}
      }

      :host ${GUMB}:focus-visible { outline: 2px solid var(--mx-g-tinta); outline-offset: 3px; }
      /* Voiceflow gumb na dodir poveća za 10 %, a na pritisak smanji za 20 % */
      :host ${GUMB}:hover { transform: none; }
      :host ${GUMB}:active { transform: scale(.97); transition-duration: .12s; }
      /* Voiceflow crni gumb na dodir i pritisak posivi; ovdje zadrži svoju boju */
      :host([data-mx-boja]) ${GUMB}:hover,
      :host([data-mx-boja]) ${GUMB}:active { background-color: var(--mx-g-pozadina); }

      /* ── natpis: serifni font kao na etiketi bočice ── */
      :host ${NATPIS} {
        font-family: ${P.font};
        font-size: ${+P.velicinaNatpisa || 18}px;
        font-weight: 600;
        letter-spacing: .02em;
        font-variant-numeric: lining-nums;
        color: var(--mx-g-puder);
        transition: color .4s var(--mx-g-meko);
      }

      /* ── bočica umjesto oblačića: slika se makne iz vidnog polja, a
         bočica je njezina pozadina (Voiceflow sliku i dalje sam skriva
         kad se chat otvori) ── */
      :host ${IKONA} {
        object-position: -9999px 0;
        background: ${CEP} 0 0 / 100% 100% no-repeat, ${TIJELO} 0 0 / 100% 100% no-repeat;
        ${SPREJ ? `animation: mx-g-cep ${SPREJ} infinite;` : ''}
      }

      ${SPREJ ? `
      /* ── sprej: tri kapljice iz raspršivača ("···") ── */
      :host ${OMOT}:has(> ${SLIKA})::after {
        content: "";
        position: absolute;
        left: 17px;
        top: 1px;
        width: 14px;
        height: 5px;
        background-image: ${KAP}, ${KAP}, ${KAP};
        background-size: 5px 5px;
        background-repeat: no-repeat;
        background-position: 0 0, 0 0, 0 0;
        filter: drop-shadow(0 0 1.6px var(--mx-g-kap-sjena));
        opacity: 0;
        pointer-events: none;
        animation: mx-g-kapi ${SPREJ} infinite;
      }
      /* ── izmaglica: trag mirisa koji prođe iza natpisa ── */
      :host ${GUMB}:has(> div:first-child > ${SLIKA})::after {
        content: "";
        position: absolute;
        z-index: 1;
        left: 26px;
        top: 50%;
        width: 58px;
        height: 30px;
        margin-top: -21px;
        border-radius: 50%;
        background: radial-gradient(closest-side, var(--mx-g-magla), var(--mx-g-magla-2) 58%, var(--mx-g-magla-0));
        filter: blur(3px);
        opacity: 0;
        transform-origin: 0 50%;
        pointer-events: none;
        animation: mx-g-magla ${SPREJ} infinite;
      }
      /* dok je chat otvoren, gumb je samo gumb za zatvaranje */
      :host([data-mx-otvoren]) ${OMOT}::after,
      :host([data-mx-otvoren]) ${GUMB}::after { display: none; }` : ''}

      @keyframes mx-g-zlato {
        from { background-position: 100% 0; }
        to   { background-position: -100% 0; }
      }
      /* raspršivač: kratak pritisak na početku kruga */
      @keyframes mx-g-cep {
        0%, 6%, 100% { background-position: 0 0, 0 0; }
        2.5%         { background-position: 0 1px, 0 0; animation-timing-function: var(--mx-g-glatko); }
      }
      /* kapljice izlete zajedno, razmaknu se u "···", malo zastanu i rasprše se */
      @keyframes mx-g-kapi {
        0%, 2%   { opacity: 0; background-position: 0 0, 0 0, 0 0; transform: translate(-1px, 1px) scale(.5); }
        5%       { opacity: 1; background-position: 1px 0, .5px 0, 0 0; transform: translate(0, 0) scale(.85); animation-timing-function: var(--mx-g-glatko); }
        14%      { opacity: 1; background-position: 9px 0, 4.5px 0, 0 0; transform: translate(1px, -.5px) scale(1); }
        27%      { opacity: .95; background-position: 9px 0, 4.5px 0, 0 0; transform: translate(2px, -1.2px) scale(1); animation-timing-function: ease-in; }
        40%      { opacity: 0; background-position: 10.5px -.8px, 5px .4px, -.5px -.4px; transform: translate(3px, -2.5px) scale(1.25); }
        100%     { opacity: 0; background-position: 0 0, 0 0, 0 0; transform: translate(-1px, 1px) scale(.5); }
      }
      /* izmaglica se rodi kod raspršivača i polako otplovi iza natpisa */
      @keyframes mx-g-magla {
        0%, 4%   { opacity: 0; transform: translate(-6px, 0) scale(.2, .3); }
        12%      { opacity: .9; transform: translate(-2px, 1px) scale(.55, .6); animation-timing-function: cubic-bezier(.3, .2, .4, 1); }
        45%      { opacity: .55; transform: translate(26px, 3px) scale(1.15, 1); }
        70%      { opacity: 0; transform: translate(52px, 4px) scale(1.5, 1.15); }
        100%     { opacity: 0; transform: translate(52px, 4px) scale(1.5, 1.15); }
      }
      @keyframes mx-g-pojava {
        0%   { opacity: 0; filter: blur(8px); transform: translateY(12px) scale(.94); }
        55%  { opacity: 1; }
        100% { opacity: 1; filter: blur(0); transform: none; }
      }
      @keyframes mx-g-prozirnost {
        from { opacity: 0; }
      }

      /* ── miš: gumb se podigne, natpis posvijetli ── */
      @media (hover: hover) and (pointer: fine) {
        :host ${GUMB}:hover { transform: translateY(-2px); box-shadow: var(--mx-g-sjena-gore); }
        :host ${GUMB}:hover > div:last-child { color: #fff; }
        :host ${GUMB}:active { transform: translateY(0) scale(.97); }
      }

      /* "Smanji pokrete": sve miruje, gumb se samo tiho pojavi */
      @media (prefers-reduced-motion: reduce) {
        :host ${GUMB} { animation: ${P.pojava ? 'mx-g-prozirnost .4s linear backwards' : 'none'}; }
        :host ${GUMB}:hover,
        :host ${GUMB}:active { transform: none; }
        :host ${GUMB}::before,
        :host ${IKONA} { animation: none; }
        :host ${OMOT}::after,
        :host ${GUMB}::after { display: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-gumb]');
      if (stari && stari.getAttribute('data-mx-gumb') === '3') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-gumb', '3');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // Boja gumba u mirovanju (iz Voiceflowovih postavki), da je gumb zadrži i
    // na dodir; bez toga ostaje Voiceflowova boja
    function zapamtiBoju(host, korijen) {
      const g = korijen.querySelector(GUMB);
      if (!g) return;
      if (g.matches(':hover, :active')) { setTimeout(function () { zapamtiBoju(host, korijen); }, 1000); return; }
      const boja = getComputedStyle(g).backgroundColor;
      if (!boja || boja === 'transparent' || /^rgba\(.*,\s*0\)$/.test(boja)) return;   // prozirno
      host.style.setProperty('--mx-g-pozadina', boja);
      host.setAttribute('data-mx-boja', '');
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

    // gumb se pojavi tek kad chat dobije svoje postavke s Voiceflowa
    function cekajGumb(korijen, gotovo) {
      if (korijen.querySelector(GUMB)) { gotovo(); return; }
      const promatrac = new MutationObserver(function () {
        if (!korijen.querySelector(GUMB)) return;
        promatrac.disconnect();
        gotovo();
      });
      promatrac.observe(korijen, { childList: true, subtree: true });
    }

    function pokreni() {
      pratiOtvaranje();
      cekajHost(function (host) {
        const korijen = host.shadowRoot;
        ubaciStil(korijen);
        cekajGumb(korijen, function () { zapamtiBoju(host, korijen); });
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_GUMB.pokreni(); }
  catch (e) { console.warn('[Martimex] Efekti gumba chata nisu pokrenuti:', e); }

})();
