(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — dok Marti smišlja odgovor: "perlice na niti" (v2)
  //
  //  Dok Marti priprema odgovor, Voiceflow u razgovoru prikaže oblačić s
  //  tri sive točkice. Ovaj modul ih zamijeni mirnom, glatkom animacijom u
  //  stilu zaglavlja s flakonom:
  //
  //   - oblačić meko izroni (kao Martine poruke), a avatar se tiho pojavi
  //   - tanka nit od sitnih točkica boje ružičastog zlata (kao niti od
  //     točkica od kojih je satkan flakon u zaglavlju) iscrta se slijeva
  //     nadesno, a na nju jedna za drugom meko sjednu tri crne perlice
  //     (boja teksta, kao avatar i kupčeve poruke); nit pod svakom malo
  //     popusti, kao svila
  //   - zatim se nit polako njiše: val putuje slijeva nadesno, pa se perlice
  //     dižu i spuštaju jedna za drugom, kao kad netko tipka. S vrhom vala
  //     putuje meko zlatno svjetlo (kao odsjaj koji prelazi preko flakona):
  //     nit tamo zasja zlatom, a perla dobije topli odsjaj odozgo. Perle su
  //     sjajne, s mekom sjenom ispod
  //   - ako odgovor potraje (dulje od natpisNakon), oblačić se glatko
  //     proširi i iz blage izmaglice se pojavi natpis "Trenutak, molim…";
  //     svjetlo koje stigne do kraja niti zatim prijeđe i preko natpisa.
  //     Između dviju Martinih poruka zaredom Voiceflow nakratko prikaže isti
  //     oblačić; tada se vide samo perlice
  //   - kad stigne odgovor, oblačić ne nestane naglo: perle se rasplinu u
  //     mali oblak izmaglice (kao točkice na pozornici "Jednog ekrana"),
  //     točkice niti otplove, natpis se zamuti, a oblačić tiho izblijedi dok
  //     se na njegovu mjestu pojavljuje Martina poruka
  //   - prije prvog Martinog pozdrava oblačića nema (pozdrav-bez-tipkanja.js
  //     ga sakrije, a skriveni oblačić se ne animira)
  //
  //  Sve se crta točno prema vremenu, u barem dvostrukoj razlučivosti (i na
  //  običnom zaslonu glatko, bez treperenja), i samo dok je oblačić u chatu.
  //  Boju i oblik oblačića daje izgled chata (npr. bijela kartica u pokusu
  //  "Jedan ekran"); modul mu samo prilagodi visinu i razmak. Ako je na
  //  uređaju uključeno "Smanji pokrete", nit je ravna, perlice miruju,
  //  oblačić se samo tiho pojavi, a natpis je tu odmah i bez odsjaja.
  //
  //  VAŽNO: u Voiceflowu, u postavkama widgeta, za prikaz dok agent
  //  priprema odgovor (u API-ju chat.responseLoader) mora biti odabrano
  //  "dots" (točkice), a ne "spinner-with-text". Modul se oslanja na
  //  Voiceflowovu službenu klasu .vfrc-typing-indicator, koju ima samo
  //  oblačić s točkicama; uz spinner ostaje Voiceflowov spinner. Tekst
  //  natpisa se zato upisuje ovdje (POSTAVKE).
  //
  //  Tehnički: kao i ostali moduli, ovaj ubaci svoj stil u shadow DOM
  //  elementa #voiceflow-chat. U Voiceflowove točkice umetne platno
  //  (canvas) s animacijom i natpis, a njihove tri točkice sakrije. Kad
  //  Voiceflow makne oblačić, na njegovo mjesto stavi kratkotrajnu kopiju
  //  (bez sjene; prati pomicanje razgovora) u kojoj se perle rasplinu, a
  //  zatim animacija stane.
  //  Ako Voiceflow isti oblačić iscrta iznova na istom mjestu, animacija se
  //  samo nastavi. Ako preglednik ne može crtati, ostaju Voiceflowove
  //  točkice; ako Voiceflow jednog dana promijeni oblačić, također (chat
  //  radi normalno). Isključi se tako da se u loader.js ispred
  //  "cekanje-odgovora.js" stavi #.
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
      zlato:  '#c9a052',      // svjetlo koje putuje s valom i odsjaj preko natpisa
      natpis: '#7a6d66'       // natpis (prigušena topla siva, kao "Vaša poruka...")
    },

    // font natpisa (isti kao tekst u chatu); "MX Jost" učitava kartica-artikla.js
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',

    natpis: 'Trenutak, molim…',   // pojavi se kad odgovor potraje; kratko, do 25-ak znakova ('' = samo perlice)
    natpisNakon: 1.5,             // s: koliko dugo Marti mora razmišljati da se natpis pojavi (0 = odmah)
    val: 1.6                      // s: koliko traje jedan val niti (manje = brže)
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
    function boja(c, a) { return 'rgba(' + Math.round(c[0]) + ', ' + Math.round(c[1]) + ', ' + Math.round(c[2]) + ', ' + (+Math.max(0, a).toFixed(3)) + ')'; }
    function mijesaj(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function broj(v, zadano, min, max) { v = +v; return isFinite(v) ? Math.min(max, Math.max(min, v)) : zadano; }
    function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function glatko(a, b, x) { x = sat((x - a) / (b - a)); return x * x * (3 - 2 * x); }
    function vanKub(x) { x = 1 - sat(x); return 1 - x * x * x; }             // brzo pa sve sporije
    function vanKvart(x) { x = 1 - sat(x); return 1 - x * x * x * x; }        // isto, još mekši kraj (slijetanje)
    function uvaKub(x) { x = sat(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(2 - 2 * x, 3) / 2; }   // polako, brže, polako
    function mod(a, n) { return ((a % n) + n) % n; }

    // ── MJERE (CSS px) I TIJEK (s) ───────────────────────────────────────
    const SIRINA = 70, VISINA = 30;       // platno
    const NIT = 64;                       // duljina niti
    const KORAK = 1.55;                   // razmak točkica na niti
    const TOCKA = 0.6;                    // polumjer točkice niti
    const RAZMAK = 12;                    // razmak perlica
    const PERLA = 3;                      // polumjer perlice
    const VISINA_VALA = 2.4;              // koliko se nit diže i spušta
    const DULJINA_VALA = 58;              // perlice su petina vala jedna od druge, pa se dižu jedna za drugom
    const CRTANJE_NITI = 0.6;             // s: nit se iscrta slijeva nadesno
    const PRVA_PERLA = 0.14;              // s: kad prva perla krene padati
    const IZMEDJU_PERLI = 0.13;           // s: razmak do sljedeće
    const PAD = 0.62;                     // s: koliko perla pada
    const PAD_VISINA = 5;                 // px: odakle padne
    const UGIB = 0.9;                     // px: koliko nit popusti pod perlom kad sjedne
    const IZLAZ = 0.45;                   // s: kad stigne odgovor, perle se rasplinu, a oblačić izblijedi
    const CESTICA = 12;                   // točkica izmaglice iz svake perle

    const PERIOD = broj(P.val, 1.6, 0.6, 6);
    const NATPIS_NAKON = broj(P.natpisNakon, 1.5, 0, 60);
    const ODSJAJ = 2 * PERIOD;            // s: odsjaj prijeđe preko natpisa jednom u dva vala
    const K = 2 * Math.PI / DULJINA_VALA;
    const OM = 2 * Math.PI / PERIOD;
    const BROJ_TOCAKA = Math.round(NIT / KORAK);
    const BOJA = { perla: rgb(B.perla), nit: rgb(B.nit), zlato: rgb(B.zlato), natpis: rgb(B.natpis) };
    const SVJETLIJA = mijesaj(BOJA.perla, [255, 255, 255], 0.3);   // perla gore lijevo (svjetlo)
    const TAMNIJA = mijesaj(BOJA.perla, [0, 0, 0], 0.35);           // perla na rubu
    const BIJELA = [255, 248, 238];       // topli bijeli odsjaj
    const SJENA = [60, 40, 30];           // topla sjena (kao sjena kartica u chatu)
    // ponovljiv "slučajan" broj 0..1 (isti za istu točkicu u svakoj sličici)
    function sreca(a, b) { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }

    // ── CRTANJE (jedna sličica u trenutku t, u sekundama od pojave) ──────
    // Sve je funkcija vremena, pa je pokret jednako gladak pri svakoj brzini
    // osvježavanja zaslona. izlaz (0..1): stigao je odgovor, pa se perle
    // rasplinu u izmaglicu, a točkice niti otplove i izblijede
    function nacrtaj(g, t, mjerilo, mirno, izlaz) {
      g.setTransform(mjerilo, 0, 0, mjerilo, 0, 0);
      g.clearRect(0, 0, SIRINA, VISINA);
      const cx = SIRINA / 2, cy = VISINA / 2 + 1, x0 = cx - NIT / 2;
      const e = izlaz || 0, ve = vanKub(e);
      // val se probudi dok perle slijeću; visina mu vrlo polako "diše", kao svila
      const budnost = mirno ? 0 : glatko(0.45, 1.5, t) * (1 - e);
      const vis = VISINA_VALA * budnost * (1 + 0.08 * Math.sin(t * 2 * Math.PI / 5.3));
      const xk = [cx - RAZMAK, cx, cx + RAZMAK];

      // perle: koliko je koja pala (0..1+) i koliko nit pod njom popušta
      const pad = [0, 0, 0], ugib = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        pad[k] = mirno ? 1 : (t - PRVA_PERLA - k * IZMEDJU_PERLI) / PAD;
        const w = (pad[k] - 0.45) / 0.9;
        if (!mirno && w > 0 && w < 1) ugib[k] = UGIB * Math.pow(Math.sin(Math.PI * w), 2);
      }

      // koliko se nit smije micati (0 na krajevima, 1 u sredini)
      function ovoj(x) { return Math.pow(Math.sin(Math.PI * sat((x - x0) / NIT)), 0.8); }
      // visina niti na mjestu x
      function y(x) {
        let v = cy - vis * ovoj(x) * Math.sin(K * (x - cx) - OM * t);
        for (let k = 0; k < 3; k++) if (ugib[k]) v += ugib[k] * Math.exp(-Math.pow((x - xk[k]) / 5, 2));
        return v;
      }
      // 0..1: koliko je mjesto blizu vrha vala (tamo putuje svjetlo)
      function svjetlo(x) { return budnost * ovoj(x) * glatko(0.55, 1, Math.sin(K * (x - cx) - OM * t)); }
      // izlaz: oblak izmaglice iz perle; točkice krenu ispod perle koja se
      // topi, raziđu se većinom prema gore, posvijetle (od tinte prema
      // ružičastom zlatu, poneka je zlatna) i izblijede
      function izmaglica(k, x, yy) {
        for (let j = 0; j < CESTICA; j++) {
          const h1 = sreca(k * 31 + j, 3), h2 = sreca(k * 31 + j, 4), h3 = sreca(k * 31 + j, 5);
          const kut = -Math.PI / 2 + (h1 - 0.5) * 2.6;
          const d = PERLA * (0.3 + (1.4 + 2.2 * h2) * ve);
          const a = Math.sin(Math.PI * Math.min(1, e * 1.1)) * (0.5 + 0.4 * h3);
          if (a < 0.01) continue;
          g.fillStyle = boja(h3 > 0.78 ? BOJA.zlato : mijesaj(BOJA.perla, BOJA.nit, glatko(0.05, 0.6, e)), a);
          g.beginPath();
          g.arc(x + Math.cos(kut) * d, yy + Math.sin(kut) * d * 0.8 - 2 * ve, (0.45 + 0.3 * h3) * (1 - 0.45 * e), 0, 2 * Math.PI);
          g.fill();
        }
      }

      // 1) meko zlatno svjetlo iza niti, na vrhu vala
      if (budnost > 0) {
        const prvi = Math.ceil((K * (x0 - 12 - cx) - Math.PI / 2 - OM * t) / (2 * Math.PI));
        for (let m = prvi; m < prvi + 3; m++) {
          const xv = cx + (Math.PI / 2 + OM * t + 2 * Math.PI * m) / K;
          const jacina = 0.13 * budnost * ovoj(xv);
          if (jacina < 0.004) continue;
          g.save();
          g.translate(xv, y(xv));
          g.scale(1, 0.5);
          const sj = g.createRadialGradient(0, 0, 0, 0, 0, 11);
          sj.addColorStop(0, boja(BOJA.zlato, jacina));
          sj.addColorStop(1, boja(BOJA.zlato, 0));
          g.fillStyle = sj;
          g.beginPath(); g.arc(0, 0, 11, 0, 2 * Math.PI); g.fill();
          g.restore();
        }
      }

      // 2) nit od točkica: iscrta se slijeva nadesno (meki početak i kraj),
      //    krajevi su tiši; na vrhu vala točkice zasjaju zlatom. Na izlazu
      //    točkice otplove (malo gore i u stranu) i izblijede
      const glava = mirno ? 2 : 1.25 * uvaKub(t / CRTANJE_NITI);
      for (let i = 0; i <= BROJ_TOCAKA; i++) {
        const u = i / BROJ_TOCAKA;
        let x = x0 + i * KORAK;
        const a = 0.78 * Math.pow(Math.sin(Math.PI * u), 0.55) * glatko(0, 0.22, glava - u) * Math.pow(1 - e, 1.6);
        if (a < 0.01) continue;
        const s = svjetlo(x);
        let yy = y(x);
        if (e > 0) { x += (sreca(i, 1) - 0.5) * 4 * ve; yy -= (1 + 4 * sreca(i, 2)) * ve; }
        g.fillStyle = boja(mijesaj(BOJA.nit, BOJA.zlato, s), Math.min(1, a * (1 + 0.45 * s)));
        g.beginPath(); g.arc(x, yy, TOCKA * (1 + 0.45 * s) * (1 - 0.3 * e), 0, 2 * Math.PI); g.fill();
      }

      // 3) tri perle: meko padnu na nit jedna za drugom i njišu se s njom;
      //    na izlazu se svaka rastopi u mali oblak izmaglice
      for (let k = 0; k < 3; k++) {
        const u = pad[k];
        if (u <= 0) continue;
        const x = xk[k];
        const p = vanKvart(u);
        const rastapanje = glatko(0, 0.6, e);
        const a = (mirno ? 1 : glatko(0, 0.22, u)) * (1 - rastapanje);
        const yy = y(x) - (1 - p) * PAD_VISINA;
        const r = PERLA * (0.7 + 0.3 * p) * (1 - 0.3 * rastapanje);
        const s = svjetlo(x);
        const gore = Math.max(0, cy - yy);                   // koliko je perla iznad mirne niti
        if (e > 0) izmaglica(k, x, yy);
        if (a < 0.005) continue;

        // meka sjena na papiru, šira i slabija što je perla više
        g.save();
        g.translate(x + 0.25, cy + r + 1.4);
        g.scale(1, 0.4);
        const rs = r * (1.2 + 0.1 * gore);
        const sj = g.createRadialGradient(0, 0, 0, 0, 0, rs);
        sj.addColorStop(0, boja(SJENA, 0.14 * a * Math.max(0, 1 - 0.12 * gore)));
        sj.addColorStop(1, boja(SJENA, 0));
        g.fillStyle = sj;
        g.beginPath(); g.arc(0, 0, rs, 0, 2 * Math.PI); g.fill();
        g.restore();

        // sjajna crna perla: svjetlo odozgo slijeva, tamniji rub
        const tijelo = g.createRadialGradient(x - r * 0.4, yy - r * 0.45, r * 0.08, x, yy, r * 1.02);
        tijelo.addColorStop(0, boja(SVJETLIJA, a));
        tijelo.addColorStop(0.5, boja(BOJA.perla, a));
        tijelo.addColorStop(1, boja(TAMNIJA, a));
        g.fillStyle = tijelo;
        g.beginPath(); g.arc(x, yy, r, 0, 2 * Math.PI); g.fill();

        g.save();
        g.beginPath(); g.arc(x, yy, r, 0, 2 * Math.PI); g.clip();
        if (s > 0.01) {
          // na vrhu vala toplo zlatno svjetlo odozgo
          const zl = g.createRadialGradient(x, yy - r * 1.05, 0, x, yy - r * 1.05, r * 1.25);
          zl.addColorStop(0, boja(BOJA.zlato, 0.75 * s * a));
          zl.addColorStop(1, boja(BOJA.zlato, 0));
          g.fillStyle = zl;
          g.fillRect(x - r, yy - r, 2 * r, 2 * r);
        }
        // svijetli papir se ogleda na donjem rubu
        const dolje = g.createRadialGradient(x + r * 0.15, yy + r * 1.05, 0, x + r * 0.15, yy + r * 1.05, r * 0.75);
        dolje.addColorStop(0, boja(BIJELA, 0.16 * a));
        dolje.addColorStop(1, boja(BIJELA, 0));
        g.fillStyle = dolje;
        g.fillRect(x - r, yy - r, 2 * r, 2 * r);
        // sitan, jasan odsjaj gore lijevo
        const ox = x - r * 0.38, oy = yy - r * 0.42;
        const odsjaj = g.createRadialGradient(ox, oy, 0, ox, oy, r * 0.5);
        odsjaj.addColorStop(0, boja(BIJELA, (0.62 + 0.25 * s) * a));
        odsjaj.addColorStop(1, boja(BIJELA, 0));
        g.fillStyle = odsjaj;
        g.fillRect(x - r, yy - r, 2 * r, 2 * r);
        g.restore();
      }
    }

    // Kad krene odsjaj preko natpisa (s u CSS animaciji): kad vrh vala, sa
    // svjetlom, stigne do desnog kraja niti; tc = trenutak u animaciji kad
    // se natpis pojavi
    function kasnjenjeOdsjaja(tc) {
      const kraj0 = mod((K * NIT / 2 - Math.PI / 2) / OM, PERIOD);   // prvi put kad je vrh vala na kraju niti
      const kraj = kraj0 + Math.ceil((tc + 0.9 - kraj0) / PERIOD) * PERIOD;
      return (kraj - 0.4 - tc) - 0.55 * ODSJAJ;                       // odsjaj se kreće od 55 % kruga
    }

    // ── STIL ─────────────────────────────────────────────────────────────
    // Selektori počinju s :host([data-mx-cekanje]), pa su jači od
    // Voiceflowovih i od izgleda chata (teme stiliziraju i "točkice > span").
    // Točkice u kojima je animacija, oblačić i avatar uz njih modul označi
    // atributima (bez :has(), pa radi i u starijim preglednicima)
    const W = ':host([' + OZNAKA + ']) .vfrc-widget';
    const ZIVO = W + ' ' + TOCKICE + '[data-mx-c]';
    const OBLACIC = W + ' [data-mx-c-oblacic]';
    const AVATAR = W + ' [data-mx-c-avatar]';
    // meki odsjaj preko natpisa: od prigušene sive do zlata i natrag
    const N = BOJA.natpis, Z = BOJA.zlato;
    const PRUGA = 'linear-gradient(100deg, ' + [[0, 0], [0, 34], [0.3, 41], [0.8, 47], [1, 50], [0.8, 53], [0.3, 59], [0, 66], [0, 100]]
      .map(function (s) { return boja(mijesaj(N, Z, s[0]), 1) + ' ' + s[1] + '%'; }).join(', ') + ')';
    const CSS = `
      :host {
        --mx-c-natpis: ${B.natpis};
        --mx-c-izron: cubic-bezier(.16, 1, .3, 1);
        --mx-c-meko: cubic-bezier(.45, 0, .2, 1);
        --mx-c-siri: cubic-bezier(.65, 0, .35, 1);
      }

      /* oblačić: boja i oblik ostaju od izgleda chata; mijenja se samo
         veličina (visok kao Martina poruka u jednom retku), a pojavi se kao
         Martine poruke. Avatar uz njega se tiho pojavi */
      ${OBLACIC} {
        height: auto;
        min-height: 0;
        padding: 8px 10px;
        transform-origin: 0 100%;
        animation: mx-c-pojava .55s var(--mx-c-izron) backwards;
      }
      ${AVATAR} { animation: mx-c-prozirnost .45s var(--mx-c-meko) backwards; }
      ${OBLACIC}[data-mx-c-nastavak],
      ${AVATAR}[data-mx-c-nastavak] { animation: none; }       /* isti oblačić iznova: bez ponovne pojave */
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

      /* natpis: oblačić se glatko proširi, a tekst se pojavi iz blage izmaglice */
      :host .mx-c-natpis {
        display: block;
        max-width: 0;
        overflow: hidden;
        transition: max-width .8s var(--mx-c-siri);
      }
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
        opacity: 0;
        filter: blur(3px);
        transform: translateX(-5px);
        transition: opacity .65s var(--mx-c-meko) .2s, filter .75s var(--mx-c-meko) .15s, transform .9s var(--mx-c-izron) .1s;
      }
      :host .mx-c-dugo .mx-c-natpis { max-width: var(--mx-c-sirina, 20em); }
      :host .mx-c-dugo .mx-c-natpis.mx-c-sire { max-width: none; }   /* kad se proširi (i ako font stigne kasnije) */
      :host .mx-c-dugo .mx-c-natpis > span { opacity: 1; filter: none; transform: none; }
      :host .mx-c-odmah .mx-c-natpis,
      :host .mx-c-odmah .mx-c-natpis > span { transition: none; }
      /* odsjaj: svjetlo s kraja niti prijeđe preko natpisa, jednom u dva vala */
      @supports ((-webkit-background-clip: text) or (background-clip: text)) {
        :host .mx-c-natpis > span {
          background: ${PRUGA} 100% 0 / 300% 100% no-repeat;
          -webkit-background-clip: text;
                  background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        :host .mx-c-dugo .mx-c-natpis > span {
          animation: mx-c-odsjaj ${ODSJAJ.toFixed(2)}s linear var(--mx-c-odsjaj-kasni, 0s) infinite;
        }
      }

      /* kopija oblačića kad stigne odgovor (iznad svega, ali samo u dijelu
         chata s porukama): perle se na platnu rasplinu u izmaglicu, natpis se
         zamuti i nestane, a podloga (bez sjene, pa ne prekriva odgovor
         karticom) tiho izblijedi dok se ispod pojavljuje odgovor */
      :host .mx-c-duh {
        position: fixed;
        z-index: 2147483647;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        margin: 0;
        pointer-events: none;
      }
      :host .mx-c-duh-podloga {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        animation: mx-c-izlaz .28s cubic-bezier(.35, 0, .25, 1) forwards;   /* brže od izmaglice: ne skriva dugo odgovor */
      }
      :host .mx-c-duh > .mx-c { position: relative; display: flex; align-items: center; }
      :host .mx-c-duh .mx-c-natpis > span { animation: mx-c-nestani .16s cubic-bezier(0, 0, .2, 1) forwards; }   /* odmah, da se ne miješa s odgovorom */

      @keyframes mx-c-pojava {
        from { opacity: 0; transform: translateY(6px) scale(.96); }
      }
      @keyframes mx-c-prozirnost {
        from { opacity: 0; }
      }
      @keyframes mx-c-izlaz {
        to { opacity: 0; }
      }
      @keyframes mx-c-nestani {
        to { opacity: 0; filter: blur(4px); }
      }
      @keyframes mx-c-odsjaj {
        0%, 55% { background-position: 100% 0; animation-timing-function: cubic-bezier(.45, 0, .3, 1); }
        100%    { background-position: 0 0; }
      }

      /* "Smanji pokrete": oblačić se samo tiho pojavi, natpis je tu odmah i
         bez odsjaja */
      @media (prefers-reduced-motion: reduce) {
        ${OBLACIC} { animation-name: mx-c-prozirnost; }
        :host .mx-c-natpis,
        :host .mx-c-natpis > span { transition: none; }
        :host .mx-c-natpis > span,
        :host .mx-c-dugo .mx-c-natpis > span { animation: none; filter: none; transform: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-cekanje]');
      if (stari && stari.getAttribute('data-mx-cekanje') === '2') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-cekanje', '2');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // ── OBLAČIĆI U CHATU ─────────────────────────────────────────────────
    let korijen = null;    // shadow root chata
    const zivi = [];       // oblačići koji se trenutno crtaju (i kopije koje blijede)
    let petlja = 0;

    // U Voiceflowove točkice umetne animaciju (i natpis)
    function ozivi(tockice) {
      if (tockice.querySelector(':scope > .mx-c')) return;
      // skriveni oblačić se ne animira (npr. dok Marti priprema pozdrav, vidi
      // pozdrav-bez-tipkanja.js); kad Voiceflow makne skriveni oblačić, nema
      // ni kopije koja blijedi. Ako se kasnije pokaže, animacija krene tada
      if (!tockice.getClientRects().length) return;
      const platno = document.createElement('canvas');
      const g = platno.getContext && platno.getContext('2d');
      if (!g) return;                                        // bez crtanja ostaju Voiceflowove točkice
      const oblacic = tockice.parentElement;
      const red = oblacic && oblacic.parentElement;
      const avatar = red && red.querySelector(':scope > .vfrc-avatar');
      const mirno = MIRNO.matches;
      // je li to isti oblačić koji je Voiceflow upravo maknuo, iscrtan iznova na istom mjestu
      const prijasnji = mirno ? null : nastavak(oblacic);

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
      if (oblacic) oblacic.setAttribute('data-mx-c-oblacic', '');
      if (avatar) avatar.setAttribute('data-mx-c-avatar', '');

      const z = {
        tockice: tockice, oblacic: oblacic, omot: omot, platno: platno, g: g,
        pocetak: prijasnji ? prijasnji.pocetak : performance.now(),
        mjerilo: 0, natpisVidljiv: false, okvir: null, podloga: '', razmak: '', skrol: undefined, skrolZadnji: 0, duh: null
      };
      if (prijasnji) {
        if (oblacic) oblacic.setAttribute('data-mx-c-nastavak', '');
        if (avatar) avatar.setAttribute('data-mx-c-nastavak', '');
      }

      if (natpis) {
        // natpis se proširi točno do svoje širine (izmjeri se tek tada, kad je
        // font gotovo sigurno učitan; ako je chat upravo zatvoren, širina je 0
        // i vrijedi gornja granica iz stila), a kad se proširi, granica se makne
        const prosiri = function (odmah) {
          z.natpisVidljiv = true;
          if (odmah) omot.classList.add('mx-c-odmah');
          const sirina = tekst.offsetWidth;
          if (sirina) omot.style.setProperty('--mx-c-sirina', Math.ceil(sirina + 1) + 'px');
          omot.style.setProperty('--mx-c-odsjaj-kasni', kasnjenjeOdsjaja((performance.now() - z.pocetak) / 1000).toFixed(3) + 's');
          omot.classList.add('mx-c-dugo');
          if (odmah) natpis.classList.add('mx-c-sire');
        };
        natpis.addEventListener('transitionend', function (e) {
          if (e.target === natpis && e.propertyName === 'max-width' && z.natpisVidljiv) natpis.classList.add('mx-c-sire');
        });
        if (mirno || NATPIS_NAKON === 0 || (prijasnji && prijasnji.natpisVidljiv)) prosiri(true);
        else z.natpisSat = setTimeout(prosiri, Math.max(0, NATPIS_NAKON * 1000 - (performance.now() - z.pocetak)), false);
      }

      if (mirno) { nacrtajOblacic(z, z.pocetak + 60000, true); return; }  // jedna mirna sličica
      zivi.push(z);
      if (!petlja) petlja = requestAnimationFrame(korak);
    }

    // Prijašnji oblačić (upravo maknut ili kopija koja blijedi) na istom mjestu
    function nastavak(oblacic) {
      if (!oblacic) return null;
      let r = null;
      for (let i = 0; i < zivi.length; i++) {
        const s = zivi[i];
        if (s.tockice.isConnected || !s.okvir) continue;
        if (!r) r = oblacic.getBoundingClientRect();
        if (Math.abs(r.left - s.okvir.left) > 8 || Math.abs(r.top - s.okvir.top) > 12) continue;
        clearTimeout(s.natpisSat);
        if (s.duh) s.duh.remove();
        zivi.splice(i, 1);
        return s;
      }
      return null;
    }

    function nacrtajOblacic(z, sad, mirno) {
      // barem dvostruka razlučivost: oštro na Retina zaslonu, a na običnom
      // zaslonu preglednik sliku umanji pa su točkice glatke, bez treperenja
      const mjerilo = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
      if (mjerilo !== z.mjerilo) {
        z.mjerilo = mjerilo;
        z.platno.width = Math.round(SIRINA * mjerilo);
        z.platno.height = Math.round(VISINA * mjerilo);
      }
      const izlaz = z.duh ? sat((sad - z.duhPocetak) / (IZLAZ * 1000)) : 0;
      nacrtaj(z.g, (sad - z.pocetak) / 1000, mjerilo, mirno, izlaz);
    }

    // Zapamti gdje je oblačić i kako izgleda (za kopiju kad stigne odgovor)
    function zapamti(z) {
      if (!z.oblacic) return;
      if (z.skrol === undefined) {
        z.skrol = null;                                       // dio chata koji se pomiče (poruke)
        for (let e = z.oblacic.parentElement; e; e = e.parentElement) {
          const o = getComputedStyle(e).overflowY;
          if (o === 'auto' || o === 'scroll') { z.skrol = e; break; }
        }
      }
      if (!z.podloga) {
        const cs = getComputedStyle(z.oblacic);
        const css = function (k) { return k.map(function (s) { return s + ':' + cs.getPropertyValue(s); }).join(';') + ';'; };
        z.podloga = css(['background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
          'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius']);
        z.razmak = css(['padding-top', 'padding-right', 'padding-bottom', 'padding-left']);
      }
      z.okvir = z.oblacic.getBoundingClientRect();
      z.skrolZadnji = z.skrol ? z.skrol.scrollTop : 0;
    }

    // Voiceflow je maknuo oblačić (stigao je odgovor): na isto mjesto stavi
    // kopiju u kojoj se perle rasplinu, a podloga izblijedi, pa oblačić ne
    // nestane naglo
    function pretopi(z, sad) {
      const r = z.okvir;
      if (!r || r.width < 2 || !korijen || sad - z.pocetak < 350) return false;   // jedva se i pojavio
      const duh = document.createElement('div');
      duh.className = 'mx-c-duh';
      duh.setAttribute('aria-hidden', 'true');
      duh.style.cssText = z.razmak + 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;';
      const podloga = document.createElement('div');
      podloga.className = 'mx-c-duh-podloga';
      podloga.style.cssText = z.podloga;
      duh.appendChild(podloga);
      duh.appendChild(z.omot);
      korijen.appendChild(duh);
      // "fixed" se računa prema prozoru preglednika; ako nije tako (npr.
      // element chata je pomaknut), razlika se popravi
      const s = duh.getBoundingClientRect();
      z.popravakX = r.left - s.left;
      z.popravakY = r.top - s.top;
      duh.style.left = (r.left + z.popravakX) + 'px';
      z.duh = duh;
      z.duhPocetak = sad;
      pratiDuha(z);
      return true;
    }

    // Kopija prati pomicanje razgovora i vidi se samo u dijelu s porukama
    function pratiDuha(z) {
      const r = z.okvir;
      const vrh = r.top - (z.skrol ? z.skrol.scrollTop - z.skrolZadnji : 0);
      z.duh.style.top = (vrh + z.popravakY) + 'px';
      if (!z.skrol) return;
      const sr = z.skrol.getBoundingClientRect();
      const gore = sr.top - vrh, dolje = vrh + r.height - sr.bottom;
      const izrez = 'inset(' + (gore > 0 ? gore : -40) + 'px -40px ' + (dolje > 0 ? dolje : -40) + 'px -40px)';
      z.duh.style.webkitClipPath = izrez;
      z.duh.style.clipPath = izrez;
    }

    // Jedna petlja za sve oblačiće; stane čim nijednog (ni kopije) više nema
    function korak(sad) {
      petlja = 0;
      for (let i = zivi.length - 1; i >= 0; i--) {
        const z = zivi[i];
        if (!z.duh && !z.tockice.isConnected) {
          clearTimeout(z.natpisSat);
          if (!pretopi(z, sad)) { zivi.splice(i, 1); continue; }
        }
        if (z.duh) {
          if (sad - z.duhPocetak > IZLAZ * 1000 + 40) { z.duh.remove(); zivi.splice(i, 1); continue; }
          pratiDuha(z);
        }
        nacrtajOblacic(z, sad, false);
        if (!z.duh) zapamti(z);
      }
      if (zivi.length) petlja = requestAnimationFrame(korak);
    }

    function pregledaj() {
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
        korijen = host.shadowRoot;
        host.setAttribute(OZNAKA, '');
        ubaciStil(korijen);
        pregledaj();
        // oblačić s točkicama Voiceflow doda i makne pri svakom odgovoru
        new MutationObserver(pregledaj).observe(korijen, { childList: true, subtree: true });
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_CEKANJE.pokreni(); }
  catch (e) { console.warn('[Martimex] Animacija čekanja odgovora nije pokrenuta:', e); }

})();
