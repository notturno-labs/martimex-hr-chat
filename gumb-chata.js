(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — diskretni efekti gumba koji otvara chat s Marti (v1)
  //
  //  Gumb u kutu ekrana ("Asistent") i dalje crta Voiceflow; ovaj modul mu
  //  samo dodaje nekoliko tihih detalja, u istom duhu kao kartice proizvoda,
  //  da ne izgleda obično, a da ne napada posjetitelja:
  //
  //   - pojava: kad se stranica učita, gumb izroni iz blage izmaglice
  //     (kao bočice u preporukama), umjesto da samo "iskoči"
  //   - tanki roza rub s unutarnje strane gumba, kao na etiketi parfemske
  //     bočice, i topla meka sjena ispod gumba
  //   - "mig": gumb se nekoliko puta po stranici kratko javi:
  //       · oko njega se rasplamsa i nestane meka roza aura
  //       · preko njega jednom prijeđe odsjaj svjetla
  //       · oblačić u ikoni lagano kimne, a točkice u njemu zasvijetle
  //         jedna za drugom, kao da Marti tipka
  //     Prvi mig dođe nekoliko sekundi nakon što se gumb pojavi, sljedeći
  //     tek nakon dužeg razmaka, najviše 3 puta po stranici.
  //   - miš iznad gumba: gumb se lagano podigne, rub se zarumeni, oko njega
  //     zasja blaga aura i preko njega prijeđe odsjaj (umjesto Voiceflowova
  //     naglog povećanja); gumb pritom ostaje svoje boje (Voiceflow ga posivi)
  //   - pritisak: gumb se tek malo stisne (umjesto velikog "skoka")
  //   - fokus s tipkovnice (Tab): vidljiv obrub oko gumba (Voiceflow ga nema)
  //
  //  Mjera:
  //   - gumb ne miga dok je chat otvoren ni dok je kartica preglednika u
  //     pozadini
  //   - kad posjetitelj jednom otvori chat, gumb do kraja posjeta (dok je ta
  //     kartica preglednika otvorena) više ne miga: tko je već pričao s
  //     Marti, zna gdje je
  //   - ako je na uređaju uključeno "Smanji pokrete", gumb se samo tiho
  //     pojavi i ne miga
  //
  //  Tehnički: Voiceflow crta chat u shadow DOM-u elementa #voiceflow-chat.
  //  Modul onamo ubaci svoj stil, a trenutak miga zapisuje kao atribut na
  //  sam #voiceflow-chat; u gumb (koji crta Voiceflow) ništa ne umeće.
  //  Oslanja se na klasu .vfrc-launcher, koju Voiceflow službeno podržava za
  //  prilagodbu izgleda. Ako Voiceflow jednog dana promijeni gumb, efekti
  //  jednostavno izostanu, a chat radi normalno.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxGumbChata) return;   // zaštita ako se modul učita dvaput
  window.__mxGumbChata = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_GUMB_POSTAVKE = {
    boje: {                   // uvijek u obliku #rrggbb
      roza:    '#e2c3ba', // prašnjava roza iza loga: aura oko gumba, tanki rub u gumbu
      tinta:   '#000000', // obrub gumba kad se do njega dođe tipkovnicom (Tab)
      svjetlo: '#ffffff'  // odsjaj koji prijeđe preko gumba
    },

    pojava: true,             // gumb pri učitavanju stranice izroni iz blage izmaglice
    unutarnjiRub: true,       // tanki roza rub s unutarnje strane gumba

    // "Mig": aura + odsjaj + oblačić koji kimne i točkice koje "tipkaju"
    prviMig: 4,               // sekundi nakon što se gumb pojavi
    razmakMigova: 18,         // sekundi između dva miga
    migovaPoStranici: 3,      // koliko najviše puta po stranici; 0 = gumb nikad ne miga
    kimanje: true,            // oblačić u ikoni lagano kimne
    tipkanje: true,           // točkice u oblačiću zasvijetle jedna za drugom

    // true → kad posjetitelj jednom otvori chat, gumb do kraja posjeta više ne miga
    tihoNakonOtvaranja: true
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
    const KLJUC = 'mx_gumb_otvaran';      // sessionStorage: posjetitelj je u ovom posjetu otvarao chat
    const TRAJANJE_MIGA = 3000;           // ms; sve animacije jednog miga stanu u to

    // Voiceflowova zadana ikona: bijeli oblačić s tri točkice (480 × 480 px,
    // na gumbu prikazan u 24 × 24 px). Točkice su na y = 11,125 px, središta
    // na x = 8,625 / 12 / 15,375 px. "Tipkanje" radi samo na toj ikoni; ako se
    // u Voiceflowu postavi druga ikona, oblačić samo kimne.
    const IKONA = /\/widget-next\/message\.png([?#]|$)/;

    // Maska ikone za vrijeme tipkanja, dva sloja:
    //  1) elipsa oko točkica (ne dira rub oblačića) priguši točkice na 28 %
    //  2) traka od 50 px koja klizi udesno: svijetli kraj, dva "svjetla",
    //     svijetli početak. Na početku i na kraju klizanja točkice su pod
    //     svijetlim dijelom (izgledaju kao inače), a u sredini ih "svjetla"
    //     redom prelaze slijeva nadesno, dvaput.
    const MASKA =
      'radial-gradient(5.8px 2.4px at 12px 11.125px, rgba(0, 0, 0, .28) 96%, #000 100%), ' +
      'linear-gradient(90deg, #000 10px, transparent 12px, ' +
        'transparent 18.8px, #000 20.2px, #000 21.8px, transparent 23.2px, ' +
        'transparent 28.8px, #000 30.2px, #000 31.8px, transparent 33.2px, ' +
        'transparent 38px, #000 40px)';

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + a + ')'; }

    // pojava ostaje prva u popisu animacija i kad gumb miga: tako se ne
    // pokrene ponovno kad mig završi
    const POJAVA = P.pojava ? 'mx-g-pojava 1s var(--mx-g-glatko) .15s backwards' : 'none';
    const KIMANJE = P.kimanje ? 'mx-g-kimanje 1.1s cubic-bezier(.37, 0, .63, 1) .25s backwards' : 'none';
    const TIPKANJE = 'mx-g-tipkanje 2.4s linear .35s both';

    // ── STIL ─────────────────────────────────────────────────────────────
    // Selektori počinju s :host (element #voiceflow-chat), pa su jači od
    // Voiceflowovih i vrijede bez obzira na redoslijed stilova.
    const CSS = `
      :host {
        --mx-g-rub: ${prozirna(B.roza, .34)};
        --mx-g-rub-jaci: ${prozirna(B.roza, .72)};
        --mx-g-aura: ${prozirna(B.roza, .62)};
        --mx-g-aura-blaga: ${prozirna(B.roza, .4)};
        --mx-g-aura-0: ${prozirna(B.roza, 0)};
        --mx-g-svjetlo: ${prozirna(B.svjetlo, .22)};
        --mx-g-svjetlo-0: ${prozirna(B.svjetlo, 0)};
        --mx-g-tinta: ${B.tinta};
        --mx-g-sjena: 0 1px 2px rgba(20, 10, 8, .16), 0 10px 22px -12px rgba(95, 52, 44, .55);
        --mx-g-sjena-gore: 0 2px 4px rgba(20, 10, 8, .14), 0 16px 26px -14px rgba(95, 52, 44, .62);
        --mx-g-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-g-meko: cubic-bezier(.45, 0, .2, 1);
      }

      /* ── gumb: topla meka sjena; pojava iz izmaglice ── */
      :host ${GUMB} {
        position: relative;
        isolation: isolate;
        box-shadow: var(--mx-g-sjena), 0 0 0 0 var(--mx-g-aura-0);
        -webkit-tap-highlight-color: transparent;
        animation: ${POJAVA};
      }
      ${P.unutarnjiRub ? `
      /* tanki roza rub s unutarnje strane, kao na etiketi bočice */
      :host ${GUMB}::before {
        content: "";
        position: absolute;
        top: 3px; right: 3px; bottom: 3px; left: 3px;
        z-index: 0;
        border: 1px solid var(--mx-g-rub);
        border-radius: inherit;
        background: none;
        pointer-events: none;
        transition: border-color .5s var(--mx-g-meko);
      }` : ''}
      /* odsjaj svjetla: tanka svijetla pruga koja prijeđe preko gumba */
      :host ${GUMB}::after {
        content: "";
        position: absolute;
        top: 0; bottom: 0; left: 0;
        width: 45%;
        z-index: 1;
        background: linear-gradient(100deg, var(--mx-g-svjetlo-0) 0%, var(--mx-g-svjetlo) 50%, var(--mx-g-svjetlo-0) 100%);
        transform: translateX(-150%) skewX(-18deg);
        pointer-events: none;
      }
      :host ${GUMB}:focus-visible { outline: 2px solid var(--mx-g-tinta); outline-offset: 3px; }

      /* Voiceflow gumb na dodir poveća za 10 %, a na pritisak smanji za 20 %;
         ovdje ostaje samo mali, mekani pritisak */
      :host ${GUMB}:hover { transform: none; }
      :host ${GUMB}:active { transform: scale(.97); transition-duration: .12s; }
      /* Voiceflow crni gumb na dodir i pritisak posivi; ovdje zadrži svoju
         boju (podizanje, rub i aura dovoljno pokazuju da je gumb živ) */
      :host([data-mx-boja]) ${GUMB}:hover,
      :host([data-mx-boja]) ${GUMB}:active { background-color: var(--mx-g-pozadina); }

      /* ── mig: aura, odsjaj, oblačić kimne, točkice tipkaju ── */
      :host([data-mx-mig]) ${GUMB} {
        animation: ${POJAVA}, mx-g-aura 2.4s var(--mx-g-meko) backwards;
      }
      :host([data-mx-mig]) ${GUMB}::after {
        animation: mx-g-odsjaj 1.25s var(--mx-g-meko) .2s both;
      }
      :host([data-mx-mig]) ${GUMB} img {
        transform-origin: 32% 86%;    /* oko repića oblačića */
        animation: ${KIMANJE};
      }
      :host([data-mx-mig][data-mx-tockice]) ${GUMB} img {
        -webkit-mask-image: ${MASKA};
                mask-image: ${MASKA};
        -webkit-mask-size: 100% 100%, 50px 100%;
                mask-size: 100% 100%, 50px 100%;
        -webkit-mask-repeat: no-repeat;
                mask-repeat: no-repeat;
        -webkit-mask-position: 0 0, -33px 0;
                mask-position: 0 0, -33px 0;
        animation: ${KIMANJE}, ${TIPKANJE};
      }

      @keyframes mx-g-pojava {
        0%   { opacity: 0; filter: blur(8px); transform: translateY(12px) scale(.94); }
        55%  { opacity: 1; }
        100% { opacity: 1; filter: blur(0); transform: none; }
      }
      @keyframes mx-g-aura {
        0%   { box-shadow: var(--mx-g-sjena), 0 0 0 0 var(--mx-g-aura-0); }
        30%  { box-shadow: var(--mx-g-sjena), 0 0 16px 3px var(--mx-g-aura); }
        100% { box-shadow: var(--mx-g-sjena), 0 0 30px 10px var(--mx-g-aura-0); }
      }
      @keyframes mx-g-odsjaj {
        from { transform: translateX(-150%) skewX(-18deg); }
        to   { transform: translateX(360%) skewX(-18deg); }
      }
      @keyframes mx-g-kimanje {
        0%, 100% { transform: none; }
        22%      { transform: rotate(-8deg) scale(1.06); }
        48%      { transform: rotate(4deg) scale(1.02); }
        72%      { transform: rotate(-1.5deg); }
      }
      @keyframes mx-g-tipkanje {
        from { -webkit-mask-position: 0 0, -33px 0; mask-position: 0 0, -33px 0; }
        to   { -webkit-mask-position: 0 0, 7px 0;   mask-position: 0 0, 7px 0; }
      }
      @keyframes mx-g-prozirnost {
        from { opacity: 0; }
      }

      /* ── miš: gumb se podigne, rub se zarumeni, zasja aura, prijeđe odsjaj ── */
      @media (hover: hover) and (pointer: fine) {
        :host ${GUMB}:hover {
          transform: translateY(-2px);
          box-shadow: var(--mx-g-sjena-gore), 0 0 18px 0 var(--mx-g-aura-blaga);
        }
        :host ${GUMB}:hover::before { border-color: var(--mx-g-rub-jaci); }
        :host ${GUMB}:hover::after { transform: translateX(360%) skewX(-18deg); transition: transform 1s var(--mx-g-meko); }
        :host ${GUMB}:active { transform: translateY(0) scale(.97); }
      }

      @media (prefers-reduced-motion: reduce) {
        :host ${GUMB},
        :host([data-mx-mig]) ${GUMB} { animation: ${P.pojava ? 'mx-g-prozirnost .4s linear backwards' : 'none'}; }
        :host ${GUMB}:hover,
        :host ${GUMB}:active { transform: none; }
        :host ${GUMB}::after { display: none; }
        :host([data-mx-mig]) ${GUMB} img,
        :host([data-mx-mig][data-mx-tockice]) ${GUMB} img { animation: none; -webkit-mask: none; mask: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-gumb]');
      if (stari && stari.getAttribute('data-mx-gumb') === '1') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-gumb', '1');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // ── STANJE ───────────────────────────────────────────────────────────
    let host = null, korijen = null;
    let timer = null, krajMiga = null;
    let migova = 0, otvoren = false, cekaVidljivost = false;
    let tiho = P.tihoNakonOtvaranja && (function () {
      try { return sessionStorage.getItem(KLJUC) === '1'; } catch (e) { return false; }
    })();

    function mirno() {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    function imaJos() { return !tiho && migova < P.migovaPoStranici; }

    function zakazi(sekundi) {
      clearTimeout(timer);
      timer = imaJos() ? setTimeout(mig, sekundi * 1000) : null;
    }

    function zavrsiMig() {
      clearTimeout(krajMiga);
      if (host) host.removeAttribute('data-mx-mig');
    }

    // gumb postoji i vidi se (Voiceflow ga zna sakriti)
    function vidljivGumb() {
      const g = korijen && korijen.querySelector(GUMB);
      if (!g) return null;
      const r = g.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? g : null;
    }

    // točkice "tipkaju" samo na Voiceflowovoj zadanoj ikoni, u veličini za
    // koju je maska izmjerena
    function tipkanjeMoguce(gumb) {
      if (!P.tipkanje) return false;
      const img = gumb.querySelector('img');
      return !!img && IKONA.test(img.currentSrc || img.src || '') && img.complete &&
        img.naturalWidth === 480 && img.naturalHeight === 480 &&
        img.offsetWidth === 24 && img.offsetHeight === 24;
    }

    function mig() {
      timer = null;
      if (!imaJos() || otvoren || mirno()) return;   // nakon zatvaranja chata mig se ponovno zakaže
      if (document.hidden) { cekaVidljivost = true; return; }   // pričeka povratak na karticu
      const gumb = vidljivGumb();
      if (!gumb) { zakazi(P.razmakMigova / 2); return; }
      if (tipkanjeMoguce(gumb)) host.setAttribute('data-mx-tockice', '');
      else host.removeAttribute('data-mx-tockice');
      host.setAttribute('data-mx-mig', '');
      clearTimeout(krajMiga);
      krajMiga = setTimeout(zavrsiMig, TRAJANJE_MIGA);
      migova++;
      zakazi(P.razmakMigova);
    }

    function zapamtiRazgovor() {
      if (!P.tihoNakonOtvaranja) return;
      tiho = true;
      clearTimeout(timer);
      timer = null;
      try { sessionStorage.setItem(KLJUC, '1'); } catch (e) { /* bez sessionStorage: vrijedi samo za ovu stranicu */ }
    }

    // Voiceflow javlja otvaranje i zatvaranje chata porukom na window
    // ('{"type":"voiceflow:open"}' / '{"type":"voiceflow:close"}')
    function naPoruku(e) {
      let d = e.data;
      if (typeof d === 'string') {
        if (d.indexOf('voiceflow:') === -1) return;
        try { d = JSON.parse(d); } catch (x) { return; }
      }
      const tip = d && d.type;
      if (tip === 'voiceflow:open') {
        otvoren = true;
        clearTimeout(timer);
        timer = null;
        zavrsiMig();
        zapamtiRazgovor();
      } else if (tip === 'voiceflow:close') {
        otvoren = false;
        if (!timer) zakazi(P.razmakMigova);
      }
    }

    // rezerva: klik na gumb znači da posjetitelj zna za chat
    function naKlik(e) {
      const t = e.target;
      if (!t || !t.closest || !t.closest(GUMB)) return;
      zavrsiMig();
      zapamtiRazgovor();
    }

    // Boja gumba u mirovanju (iz Voiceflowovih postavki), da je gumb zadrži i
    // na dodir; bez toga ostaje Voiceflowova boja
    function zapamtiBoju() {
      const g = korijen.querySelector(GUMB);
      if (!g) return;
      if (g.matches(':hover, :active')) { setTimeout(zapamtiBoju, 1000); return; }
      const boja = getComputedStyle(g).backgroundColor;
      if (!boja || boja === 'transparent' || /^rgba\(.*,\s*0\)$/.test(boja)) return;   // prozirno
      host.style.setProperty('--mx-g-pozadina', boja);
      host.setAttribute('data-mx-boja', '');
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
    function cekajGumb(gotovo) {
      if (korijen.querySelector(GUMB)) { gotovo(); return; }
      const promatrac = new MutationObserver(function () {
        if (!korijen.querySelector(GUMB)) return;
        promatrac.disconnect();
        gotovo();
      });
      promatrac.observe(korijen, { childList: true, subtree: true });
    }

    function pokreni() {
      window.addEventListener('message', naPoruku);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && cekaVidljivost) { cekaVidljivost = false; zakazi(3); }
      });
      cekajHost(function (h) {
        host = h;
        korijen = h.shadowRoot;
        ubaciStil(korijen);
        korijen.addEventListener('click', naKlik, true);
        cekajGumb(function () {
          zapamtiBoju();
          zakazi(P.prviMig);
        });
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_GUMB.pokreni(); }
  catch (e) { console.warn('[Martimex] Efekti gumba chata nisu pokrenuti:', e); }

})();
