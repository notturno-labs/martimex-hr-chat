(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — dok Marti smišlja odgovor: "perlice na niti"
  //
  //  Dok Marti priprema odgovor, Voiceflow u razgovoru prikaže oblačić s
  //  tri sive točkice. Ovaj modul ih zamijeni malom animacijom u stilu
  //  zaglavlja s flakonom:
  //
  //   - tri crne perlice (boja teksta, kao avatar i kupčeve poruke) leže
  //     na tankoj niti satkanoj od sitnih točkica boje ružičastog zlata,
  //     kao niti od točkica od kojih je satkan flakon u zaglavlju
  //   - nit se polako njiše kao svila: val putuje slijeva nadesno, pa se
  //     perlice dižu i spuštaju jedna za drugom, kao kad netko tipka
  //   - na vrhu vala nit i perlica uhvate toplo zlatno svjetlo (kao odsjaj
  //     koji prelazi preko flakona), a s vrha se povremeno digne sitna
  //     zlatna iskra, kao dašak mirisa
  //   - pojava: nit se iscrta slijeva nadesno, a perlice jedna za drugom
  //     meko sjednu na nju
  //   - ako odgovor potraje (dulje od natpisNakon), oblačić se glatko
  //     proširi i pojavi se natpis "Trenutak, molim…", preko kojeg polako
  //     prelazi zlatni odsjaj. Između dviju Martinih poruka zaredom Voiceflow
  //     nakratko prikaže isti oblačić; tada se vide samo perlice
  //
  //  Boju i oblik oblačića daje izgled chata (npr. bijela kartica u pokusu
  //  "Jedan ekran"); modul mu samo prilagodi visinu i razmak. Ako je na
  //  uređaju uključeno "Smanji pokrete", nit je ravna, perlice miruju, a
  //  natpis je tu odmah i bez odsjaja.
  //
  //  VAŽNO: u Voiceflowu, u postavkama widgeta, za prikaz dok agent
  //  priprema odgovor ("Response loader", u API-ju chat.responseLoader)
  //  mora biti odabrano "Dots" (točkice), a ne "Spinner with text". Modul
  //  se oslanja na Voiceflowovu službenu klasu .vfrc-typing-indicator,
  //  koju ima samo oblačić s točkicama; uz "Spinner with text" ostaje
  //  Voiceflowov spinner. Tekst natpisa se zato upisuje ovdje (POSTAVKE).
  //
  //  Tehnički: kao i ostali moduli, ovaj ubaci svoj stil u shadow DOM
  //  elementa #voiceflow-chat. U Voiceflowove točkice umetne platno
  //  (canvas) s animacijom i natpis, a njihove tri točkice sakrije. Crta se
  //  samo dok je oblačić u chatu; kad ga Voiceflow makne, animacija stane.
  //  Ako preglednik ne može crtati, ostaju Voiceflowove točkice; ako
  //  Voiceflow jednog dana promijeni oblačić, također (chat radi normalno).
  //  Isključi se tako da se u loader.js ispred "cekanje-odgovora.js" stavi #.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxCekanje) return;   // zaštita ako se modul učita dvaput
  window.__mxCekanje = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_CEKANJE_POSTAVKE = {
    boje: {                   // uvijek u obliku #rrggbb
      perla:  '#1c1715',      // tri perlice (tinta: boja teksta u chatu)
      nit:    '#c99a8d',      // nit od točkica (ružičasto zlato, kao na gumbu chata)
      zlato:  '#c9a052',      // svjetlo na vrhu vala, iskre i odsjaj preko natpisa
      natpis: '#7a6d66'       // natpis (prigušena topla siva, kao "Vaša poruka...")
    },

    // font natpisa (isti kao tekst u chatu); "MX Jost" učitava kartica-artikla.js
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',

    natpis: 'Trenutak, molim…',   // pojavi se kad odgovor potraje ('' = samo perlice)
    natpisNakon: 1.5,             // s: koliko dugo Marti mora razmišljati da se natpis pojavi (0 = odmah)
    val: 1.5,                     // s: koliko traje jedan val niti (manje = brže)
    iskre: true                   // s vrha vala se povremeno digne sitna zlatna iskra
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX_CEKANJE = (function () {
    'use strict';

    const P = MX_CEKANJE_POSTAVKE;
    const B = P.boje;
    const HOST = 'voiceflow-chat';          // element u čiji shadow DOM Voiceflow crta chat
    const TOCKICE = '.vfrc-typing-indicator';  // Voiceflowova službena klasa točkica
    const OZNAKA = 'data-mx-cekanje';       // atribut na #voiceflow-chat (selektori su jači od tema)
    const MIRNO = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function boja(c, a) { return 'rgba(' + Math.round(c[0]) + ', ' + Math.round(c[1]) + ', ' + Math.round(c[2]) + ', ' + (+a.toFixed(3)) + ')'; }
    function mijesaj(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function broj(v, zadano, min, max) { v = +v; return isFinite(v) ? Math.min(max, Math.max(min, v)) : zadano; }
    function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function glatko(a, b, x) { x = sat((x - a) / (b - a)); return x * x * (3 - 2 * x); }
    function vanKub(x) { x = 1 - sat(x); return 1 - x * x * x; }
    function mod(a, n) { return ((a % n) + n) % n; }

    // ── MJERE (CSS px) ───────────────────────────────────────────────────
    const SIRINA = 70, VISINA = 30;       // platno
    const NIT = 64;                       // duljina niti
    const KORAK = 1.55;                   // razmak točkica na niti
    const TOCKA = 0.62;                   // polumjer točkice niti
    const RAZMAK = 12;                    // razmak perlica
    const PERLA = 3;                      // polumjer perlice
    const VISINA_VALA = 2.6;              // koliko se nit diže i spušta
    const DULJINA_VALA = 58;              // perlice su petina vala jedna od druge, pa se dižu jedna za drugom
    const POJAVA = 0.7;                   // s: nit se iscrta, perlice sjednu na nju

    const PERIOD = broj(P.val, 1.5, 0.6, 6);
    const NATPIS_NAKON = broj(P.natpisNakon, 1.5, 0, 60);
    const BOJA = { perla: rgb(B.perla), nit: rgb(B.nit), zlato: rgb(B.zlato) };
    const SJAJ_PERLE = [255, 244, 228];   // topli odsjaj na perli (gore lijevo)
    const K = 2 * Math.PI / DULJINA_VALA;
    const OM = 2 * Math.PI / PERIOD;
    const BROJ_TOCAKA = Math.round(NIT / KORAK);
    const ZIVOT_ISKRE = Math.min(1, 0.8 * PERIOD);   // s: iskra se digne i nestane prije sljedećeg vrha
    // ponovljiv "slučajan" broj 0..1 za n-ti vrh vala ispod k-te perle
    function sreca(k, n) { const s = Math.sin(k * 127.1 + n * 311.7) * 43758.5453; return s - Math.floor(s); }

    // ── CRTANJE (jedna sličica u trenutku t, u sekundama od pojave) ──────
    function nacrtaj(g, t, dpr, mirno) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, SIRINA, VISINA);
      const cx = SIRINA / 2, cy = VISINA / 2 + 2, x0 = cx - NIT / 2;
      const vis = mirno ? 0 : VISINA_VALA * glatko(0.15, POJAVA + 0.3, t);   // val se probudi nakon pojave

      // koliko je nit mirna prema krajevima (0 na krajevima, 1 u sredini)
      function ovoj(x) { return Math.pow(Math.sin(Math.PI * sat((x - x0) / NIT)), 0.8); }
      // visina niti na mjestu x
      function y(x) { return cy - vis * ovoj(x) * Math.sin(K * (x - cx) - OM * t); }
      // 0..1: koliko je mjesto blizu vrha vala (tamo svjetlo)
      function greben(yy, od) { return mirno ? 0 : glatko(od, 1, (cy - yy) / VISINA_VALA); }

      // nit od točkica: iscrta se slijeva nadesno, krajevi su tiši, točkice svjetlucaju
      for (let i = 0; i <= BROJ_TOCAKA; i++) {
        const u = i / BROJ_TOCAKA, x = x0 + i * KORAK, yy = y(x);
        const pojava = mirno ? 1 : glatko(0, 0.12, t * 0.9 - u * 0.45);
        const tit = mirno ? 0.9 : 0.8 + 0.2 * Math.sin(t * 6.1 + i * 2.17);
        const a = 0.8 * Math.pow(Math.sin(Math.PI * u), 0.55) * pojava * tit;
        if (a < 0.01) continue;
        const gr = greben(yy, 0.5);
        g.fillStyle = boja(mijesaj(BOJA.nit, BOJA.zlato, gr), Math.min(1, a * (1 + 0.5 * gr)));
        g.beginPath(); g.arc(x, yy, TOCKA * (1 + 0.6 * gr), 0, 2 * Math.PI); g.fill();
      }

      // iskre: kad perla dođe na vrh vala, ponekad se s nje digne sitna
      // zlatna iskra i nestane (otprilike svaki treći put, nasumično)
      if (P.iskre && !mirno) {
        for (let k = 0; k < 3; k++) {
          const x = cx + (k - 1) * RAZMAK;
          const vrh0 = mod((K * (x - cx) - Math.PI / 2) / OM, PERIOD);   // prvi trenutak kad je perla na vrhu
          const n = Math.floor((t - vrh0) / PERIOD);
          const vrh = vrh0 + n * PERIOD, u = (t - vrh) / ZIVOT_ISKRE;
          if (vrh < POJAVA + 0.3 || u >= 1 || sreca(k, n) > 0.36) continue;
          const smjer = sreca(k + 7, n) < 0.5 ? -1 : 1;
          g.fillStyle = boja(BOJA.zlato, 0.85 * Math.sin(Math.PI * Math.sqrt(u)));
          g.beginPath();
          g.arc(x + smjer * (0.8 + u * 2.2), cy - vis * ovoj(x) - PERLA - 0.8 - u * 7, 0.6 * (1 - 0.45 * u), 0, 2 * Math.PI);
          g.fill();
        }
      }

      // tri perle: padnu na nit jedna za drugom i njišu se s njom
      for (let k = 0; k < 3; k++) {
        const x = cx + (k - 1) * RAZMAK;
        const p = mirno ? 1 : vanKub((t - 0.25 - k * 0.12) / 0.5);
        if (p <= 0) continue;
        const yy = y(x) - (1 - p) * 4, r = PERLA * (0.6 + 0.4 * p);
        const gr = greben(yy, 0.4);
        g.fillStyle = boja(BOJA.perla, 0.94 * p);
        g.beginPath(); g.arc(x, yy, r, 0, 2 * Math.PI); g.fill();
        // odsjaj gore lijevo: perla je sjajna, a na vrhu vala jače zasja
        const sx = x - r * 0.36, sy = yy - r * 0.4;
        const sjaj = g.createRadialGradient(sx, sy, 0, sx, sy, r * 0.95);
        sjaj.addColorStop(0, boja(SJAJ_PERLE, (0.42 + 0.38 * gr) * p));
        sjaj.addColorStop(1, boja(SJAJ_PERLE, 0));
        g.fillStyle = sjaj;
        g.beginPath(); g.arc(x, yy, r, 0, 2 * Math.PI); g.fill();
        if (gr > 0.02) {
          // na vrhu vala svjetlo odozgo pozlati gornji rub perle
          const rub = g.createLinearGradient(x, yy - r, x, yy + r);
          rub.addColorStop(0, boja(BOJA.zlato, 0.75 * gr * p));
          rub.addColorStop(0.5, boja(BOJA.zlato, 0));
          g.strokeStyle = rub;
          g.lineWidth = 0.7;
          g.beginPath(); g.arc(x, yy, r - 0.3, 0, 2 * Math.PI); g.stroke();
        }
      }
    }

    // ── STIL ─────────────────────────────────────────────────────────────
    // Selektori počinju s :host([data-mx-cekanje]), pa su jači od
    // Voiceflowovih i od izgleda chata (teme stiliziraju i "točkice > span").
    // Točkice u kojima je animacija i oblačić oko njih modul označi
    // atributima (bez :has(), pa radi i u starijim preglednicima)
    const W = ':host([' + OZNAKA + ']) .vfrc-widget';
    const ZIVO = W + ' ' + TOCKICE + '[data-mx-c]';
    const OBLACIC = W + ' [data-mx-c-oblacic]';
    const CSS = `
      :host {
        --mx-c-natpis: ${B.natpis};
        --mx-c-zlato: ${B.zlato};
        --mx-c-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-c-meko: cubic-bezier(.45, 0, .2, 1);
      }

      /* oblačić: boja i oblik ostaju od izgleda chata, mijenja se samo
         veličina (visok kao Martina poruka u jednom retku) */
      ${OBLACIC} {
        height: auto;
        min-height: 0;
        padding: 8px 10px;
      }
      ${ZIVO} { display: flex; align-items: center; gap: 0; }
      ${ZIVO} > :not(.mx-c) { display: none; }     /* Voiceflowove tri točkice */

      /* animacija i natpis (teme stiliziraju svaki span u točkicama, pa se
         to ovdje poništi) */
      ${ZIVO} > .mx-c {
        all: unset;
        display: flex;
        align-items: center;
      }
      :host .mx-c-platno {
        display: block;
        flex: none;
        width: ${SIRINA}px;
        height: ${VISINA}px;
      }
      :host .mx-c-natpis {
        display: block;
        max-width: 0;
        overflow: hidden;
        opacity: 0;
        transition: max-width .7s var(--mx-c-glatko), opacity .5s var(--mx-c-meko) .2s;
      }
      :host .mx-c-dugo .mx-c-natpis {
        max-width: var(--mx-c-sirina, 20em);
        opacity: 1;
      }
      :host .mx-c-dugo .mx-c-natpis.mx-c-sire { max-width: none; }   /* kad se proširi (i font stigne kasnije) */
      :host .mx-c-natpis > span {
        display: inline-block;
        padding: 0 6px 0 3px;
        white-space: nowrap;
        font-family: ${P.font};
        font-size: 13.5px;
        font-weight: 400;
        line-height: 20px;
        letter-spacing: .02em;
        color: var(--mx-c-natpis);
      }
      /* zlatni odsjaj prelazi preko natpisa jednom u dva vala */
      @supports ((-webkit-background-clip: text) or (background-clip: text)) {
        :host .mx-c-natpis > span {
          background: linear-gradient(100deg, var(--mx-c-natpis) 0%, var(--mx-c-natpis) 40%, var(--mx-c-zlato) 50%, var(--mx-c-natpis) 60%, var(--mx-c-natpis) 100%) 100% 0 / 300% 100% no-repeat;
          -webkit-background-clip: text;
                  background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: mx-c-odsjaj ${(2 * PERIOD).toFixed(2)}s linear infinite;
        }
      }
      @keyframes mx-c-odsjaj {
        0%, 40% { background-position: 100% 0; }
        100%    { background-position: 0 0; }
      }

      /* "Smanji pokrete": natpis je tu odmah, bez odsjaja i bez širenja */
      @media (prefers-reduced-motion: reduce) {
        :host .mx-c-natpis { transition: none; }
        :host .mx-c-natpis > span { animation: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-cekanje]');
      if (stari && stari.getAttribute('data-mx-cekanje') === '1') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-cekanje', '1');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // ── OBLAČIĆI U CHATU ─────────────────────────────────────────────────
    const zivi = [];       // oblačići koji se trenutno crtaju
    let petlja = 0;

    // U Voiceflowove točkice umetne animaciju (i natpis)
    function ozivi(tockice) {
      if (tockice.querySelector(':scope > .mx-c')) return;
      const platno = document.createElement('canvas');
      const g = platno.getContext && platno.getContext('2d');
      if (!g) return;                                        // bez crtanja ostaju Voiceflowove točkice
      const omot = document.createElement('span');
      omot.className = 'mx-c';
      platno.className = 'mx-c-platno';
      platno.setAttribute('aria-hidden', 'true');
      omot.appendChild(platno);
      let natpis = null, tekst = null;
      if (P.natpis) {
        natpis = document.createElement('span');
        natpis.className = 'mx-c-natpis';
        tekst = document.createElement('span');
        tekst.textContent = P.natpis;
        natpis.appendChild(tekst);
        omot.appendChild(natpis);
      }
      tockice.appendChild(omot);
      tockice.setAttribute('data-mx-c', '');
      if (tockice.parentElement) tockice.parentElement.setAttribute('data-mx-c-oblacic', '');

      const z = { omot: omot, platno: platno, g: g, dpr: 0, pocetak: performance.now() };
      const mirno = MIRNO.matches;
      if (natpis) {
        // natpis se proširi točno do svoje širine (izmjeri se tek tada, kad je
        // font gotovo sigurno učitan; ako je chat upravo zatvoren, širina je 0
        // i vrijedi gornja granica iz stila), a kad se proširi, granica se makne
        const odmah = mirno || NATPIS_NAKON === 0;           // bez širenja
        const prosiri = function () {
          const sirina = tekst.offsetWidth;
          if (sirina) omot.style.setProperty('--mx-c-sirina', Math.ceil(sirina + 1) + 'px');
          omot.classList.add('mx-c-dugo');
          if (odmah) natpis.classList.add('mx-c-sire');
        };
        natpis.addEventListener('transitionend', function (e) {
          if (e.propertyName === 'max-width' && omot.classList.contains('mx-c-dugo')) natpis.classList.add('mx-c-sire');
        });
        if (odmah) prosiri();
        else z.natpis = setTimeout(prosiri, NATPIS_NAKON * 1000);
      }
      if (mirno) { nacrtajOblacic(z, z.pocetak + 60000, true); return; }  // jedna mirna sličica
      zivi.push(z);
      if (!petlja) petlja = requestAnimationFrame(korak);
    }

    function nacrtajOblacic(z, sad, mirno) {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      if (dpr !== z.dpr) {                                    // oštro i na Retina zaslonu (i kad se prozor premjesti)
        z.dpr = dpr;
        z.platno.width = Math.round(SIRINA * dpr);
        z.platno.height = Math.round(VISINA * dpr);
      }
      nacrtaj(z.g, (sad - z.pocetak) / 1000, dpr, mirno);
    }

    // Jedna petlja za sve oblačiće; stane čim nijednog više nema u chatu
    function korak(sad) {
      petlja = 0;
      for (let i = zivi.length - 1; i >= 0; i--) {
        const z = zivi[i];
        if (!z.omot.isConnected) { clearTimeout(z.natpis); zivi.splice(i, 1); continue; }
        nacrtajOblacic(z, sad, false);
      }
      if (zivi.length) petlja = requestAnimationFrame(korak);
    }

    function pregledaj(korijen) {
      const sve = korijen.querySelectorAll(TOCKICE);
      for (let i = 0; i < sve.length; i++) ozivi(sve[i]);
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
      cekajHost(function (host) {
        const korijen = host.shadowRoot;
        host.setAttribute(OZNAKA, '');
        ubaciStil(korijen);
        pregledaj(korijen);
        // oblačić s točkicama Voiceflow doda i makne pri svakom odgovoru
        new MutationObserver(function () { pregledaj(korijen); })
          .observe(korijen, { childList: true, subtree: true });
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_CEKANJE.pokreni(); }
  catch (e) { console.warn('[Martimex] Animacija čekanja odgovora nije pokrenuta:', e); }

})();
