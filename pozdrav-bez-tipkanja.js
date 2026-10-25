(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — Martin pozdrav: odjednom, bez "tipkanja", izroni iz magle (v3)
  //
  //  Prva poruka razgovora, Martin pozdrav s ponuđenim gumbima:
  //
  //   - dok Marti priprema pozdrav, ne prikazuje se oblačić s točkicama ni
  //     natpis "Trenutak, molim…" (cekanje-odgovora.js); ispod traka s
  //     brendovima je tada prazno dok pozdrav ne stigne
  //   - pozdrav se ne ispisuje slovo po slovo: tekst i gumbi su tu odmah
  //   - pozdrav polagano izroni iz magle: Martin avatar i poruka prvo se
  //     naslute kao mutna, prozračna sjena, pa se kroz otprilike dvije
  //     sekunde izoštre do kraja; gumbi izranjaju za njima, jedan za drugim.
  //     Tko u postavkama uređaja ima "Smanji pokrete", pozdrav i gumbi mu se
  //     samo tiho pojave, bez zamućenja i pomaka
  //
  //  Sve ostale poruke u razgovoru ostaju kao dosad: prije odgovora se vide
  //  točkice (i natpis kad odgovor potraje), odgovor se ispisuje slovo po
  //  slovo ("Stream text" iz Voiceflowa) i pojavi se kao i dosad (jedan-
  //  ekran.js). Vrijedi i kad se razgovor pokrene prvi put i nakon "Započni
  //  novi razgovor" (to je opet prva poruka novog razgovora). Pozdrav izroni
  //  jednom, kad stigne; kad se chat zatvori i opet otvori, samo je tu.
  //
  //  Tehnički, točkice: modul u shadow DOM chata ubaci stil koji oblačić s
  //  točkicama sakrije dok u razgovoru nema ni jedne poruke (cekanje-
  //  odgovora.js skriveni oblačić ne animira). Ako preglednik ne zna :has(),
  //  točkice se vide kao i prije.
  //  Tehnički, ispisivanje: Voiceflow pri crtanju svake nove poruke pogleda svoju
  //  postavku chat.streamingDisabled ("Stream text" isključen). Modul je
  //  uključi dok u razgovoru još nema ni jedne poruke, pa se pozdrav iscrta
  //  odjednom, a čim se pozdrav pojavi, vrati je kako je zadana u
  //  Voiceflowu. Postavka se mijenja samo u pregledniku posjetitelja, u
  //  Voiceflowu ostaje ista. Voiceflow tu postavku ne nudi izvana, pa joj
  //  modul pristupa preko Reactova stabla (React je knjižnica u kojoj je
  //  napravljen Voiceflowov chat). Ako je jednog dana ne nađe, pozdrav se
  //  ispisuje kao i ostale poruke, a chat radi normalno.
  //  Ako je "Stream text" u Voiceflowu isključen, ispisivanje ostaje kako je.
  //  Tehnički, magla: kad u prazan razgovor stigne pozdrav, modul njegov
  //  okvir (Martina poruka s avatarom i gumbima ispod nje) označi atributom
  //  data-mx-magla, prije nego što ga preglednik prvi put nacrta. Za tako
  //  označen pozdrav stil ovog modula zamijeni uobičajenu pojavu poruke iz
  //  jedan-ekran.js izranjanjem iz magle: zamućenje, prozirnost i mali
  //  pomak (sve to preglednik crta glatko, bez opterećenja stranice).
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxPozdrav) return;     // zaštita ako se modul učita dvaput
  window.__mxPozdrav = true;

  /* ---------- MAGLA – ovo smiješ mijenjati ---------- */
  // zamucenje: koliko je na početku mutno (px); bistrenje: koliko dugo se
  // izoštrava (s); svjetlo: za koliko je posve neprozirno (s; kraće od
  // bistrenja, pa se prvo nazre mutna sjena koja se onda izoštri)
  const MAGLA = {
    poruka: { zamucenje: 16, bistrenje: 1.9, svjetlo: 1.1 },
    avatar: { zamucenje: 9, bistrenje: 1.6, svjetlo: 1.0 },
    // gumbi: prvi kreće 'pocetak' sekundi nakon poruke, svaki sljedeći 'razmak' iza njega
    gumb:   { zamucenje: 9, bistrenje: 1.4, svjetlo: 0.9, pocetak: 0.6, razmak: 0.08 }
  };
  /* ---------- ISPOD OVOGA NE TREBAŠ DIRATI ---------- */

  const HOST = 'voiceflow-chat';      // element u čiji shadow DOM Voiceflow crta chat
  const OZNAKA = 'data-mx-magla';     // atribut na okviru pozdrava: izranja iz magle
  const izvorno = new WeakMap();      // postavka kakva je zadana u Voiceflowu (po objektu postavki)

  // Voiceflowove postavke chata: isti objekt koji Voiceflow čita pri crtanju
  // svake poruke. Traži se od elementa chata prema vrhu Reactova stabla, do
  // komponente koja je dobila postavke ("assistant").
  function postavke(kor) {
    const el = kor.querySelector('.vfrc-widget');
    if (!el) return null;
    const kljuc = Object.keys(el).find(function (k) { return k.indexOf('__reactFiber$') === 0; });
    let f = kljuc ? el[kljuc] : null;
    for (let i = 0; f && i < 200; i++, f = f.return) {
      const a = f.memoizedProps && f.memoizedProps.assistant;
      if (a && a.chat && typeof a.chat === 'object' && typeof a.chat.streamingDisabled === 'boolean') return a;
    }
    return null;
  }

  // ─── Stil ───────────────────────────────────────────────────────────
  const W = ':host .vfrc-widget';
  // okvir pozdrava: Voiceflowov .vfrc-system-response--container, u kojem su
  // Martina poruka s avatarom (.vfrc-system-response) i gumbi ispod nje
  const POZDRAV = W + ' .vfrc-system-response--container[' + OZNAKA + ']';
  const PORUKA = POZDRAV + ' .vfrc-system-response .vfrc-message:not([class*="vfrc-message--extension"])';
  const AVATAR = POZDRAV + ' .vfrc-system-response > .vfrc-avatar';
  const GUMBI = POZDRAV + ' > .vfrc-system-response--actions';
  const GUMB = GUMBI + ' > .vfrc-system-response--action';
  // prozirnost raste mekano; izoštravanje je na početku brže, a pred kraj
  // sve sporije, pa se zadnji djelić magle tiho raziđe
  const SVJETLO = 'cubic-bezier(.33, 0, .25, 1)';
  const BISTRENJE = 'cubic-bezier(.3, .15, .25, 1)';

  function s(x) { return (Math.round(x * 1000) / 1000) + 's'; }

  // "magla": mutno, malo isprano (manje kontrasta, malo svjetlije), malo
  // niže i manje; prema kraju sve se vrati na svoje
  function magla(ime, px, pomak, mjera) {
    return `
      @keyframes ${ime} {
        from { filter: blur(${px}px) contrast(.8) brightness(1.1); transform: translateY(${pomak}px) scale(${mjera}); }
        to   { filter: blur(0) contrast(1) brightness(1); transform: none; }
      }`;
  }

  function stilGumba() {
    const g = MAGLA.gumb;
    let css = '';
    for (let i = 1; i <= 8; i++) {
      css += `
      ${GUMB}:nth-child(${i}) { animation-delay: ${s(g.pocetak + (i - 1) * g.razmak)} !important; }`;
    }
    // ako ih je više od osam, ostali kreću zajedno s osmim
    css += `
      ${GUMB}:nth-child(n + 9) { animation-delay: ${s(g.pocetak + 7 * g.razmak)} !important; }`;
    return css;
  }

  const P = MAGLA.poruka, A = MAGLA.avatar, G = MAGLA.gumb;
  const CSS = `
    /* dok Marti priprema pozdrav (u razgovoru još nema ni jedne poruke),
       oblačić s točkicama se ne prikazuje; Voiceflowov oblačić (s avatarom)
       je .vfrc-typing-indicator--container, a poruke su .vfrc-system-response
       i .vfrc-user-response (oblačić točkica nije unutar njih) */
    :host .vfrc-chat:not(:has(.vfrc-system-response, .vfrc-user-response)) .vfrc-typing-indicator--container {
      display: none !important;
    }

    /* ═══ POZDRAV IZRANJA IZ MAGLE ═══
       (selektori su jači od onih u jedan-ekran.js, pa vrijede umjesto njih) */
    ${AVATAR} {
      animation: mx-p-svjetlo ${s(A.svjetlo)} ${SVJETLO} backwards, mx-p-magla-avatar ${s(A.bistrenje)} ${BISTRENJE} backwards;
    }
    ${PORUKA} {
      transform-origin: 0 100%;           /* raste iz kuta uz avatar */
      animation: mx-p-svjetlo ${s(P.svjetlo)} ${SVJETLO} backwards, mx-p-magla ${s(P.bistrenje)} ${BISTRENJE} backwards;
    }
    /* gumbi ne izlaze kao jedan blok (jedan-ekran.js), nego svaki za sebe */
    ${GUMBI} { animation: none; }
    ${GUMB} {
      animation: mx-p-svjetlo ${s(G.svjetlo)} ${SVJETLO} backwards, mx-p-magla-gumb ${s(G.bistrenje)} ${BISTRENJE} backwards;
    }
    /* (Voiceflow upisuje svoje kašnjenje izravno u element gumba, pa
       kašnjenje ovdje mora biti !important) */
    ${stilGumba()}

    @keyframes mx-p-svjetlo {
      from { opacity: 0; }
    }
    ${magla('mx-p-magla', P.zamucenje, 6, 0.975)}
    ${magla('mx-p-magla-avatar', A.zamucenje, 4, 0.96)}
    ${magla('mx-p-magla-gumb', G.zamucenje, 5, 0.97)}

    /* "Smanji pokrete": pozdrav se samo tiho pojavi, bez zamućenja i pomaka */
    @media (prefers-reduced-motion: reduce) {
      ${AVATAR}, ${PORUKA} { animation: mx-p-svjetlo .8s ease backwards; }
      ${GUMB}, ${GUMB}:nth-child(n) { animation: mx-p-svjetlo .6s ease backwards; animation-delay: .3s !important; }
    }
  `;
  function ubaciStil(kor) {
    const stari = kor.querySelector('style[data-mx-pozdrav]');
    if (stari && stari.getAttribute('data-mx-pozdrav') === '3') return;
    if (stari) stari.remove();
    const stil = document.createElement('style');
    stil.setAttribute('data-mx-pozdrav', '3');
    stil.textContent = CSS;
    kor.appendChild(stil);
  }

  // ─── Razgovor ───────────────────────────────────────────────────────
  // ima li u razgovoru već ijedna poruka (Martina ili kupčeva)
  function imaPoruka(kor) {
    return !!kor.querySelector('.vfrc-chat .vfrc-system-response, .vfrc-chat .vfrc-user-response');
  }

  // Prazan razgovor: sljedeća poruka je pozdrav, iscrta se odjednom.
  // Čim postoji ijedna poruka: kako je zadano u Voiceflowu.
  function uskladi(kor, prazan) {
    const a = postavke(kor);
    if (!a) return;
    if (!izvorno.has(a)) izvorno.set(a, a.chat.streamingDisabled);
    if (izvorno.get(a)) return;                 // "Stream text" je u Voiceflowu ionako isključen
    if (a.chat.streamingDisabled !== prazan) a.chat.streamingDisabled = prazan;
  }

  // U prazan razgovor upravo je stigao pozdrav: njegov okvir dobije oznaku
  // (gumbi koje Voiceflow doda u isti okvir trenutak kasnije izranjaju s njim)
  function oznaciPozdrav(kor) {
    if (kor.querySelector('.vfrc-chat .vfrc-user-response')) return;
    kor.querySelectorAll('.vfrc-chat .vfrc-system-response').forEach(function (odg) {
      const okvir = odg.closest('.vfrc-system-response--container');
      if (okvir && !okvir.hasAttribute(OZNAKA)) okvir.setAttribute(OZNAKA, '');
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
    cekajHost(function (host) {
      const kor = host.shadowRoot;
      ubaciStil(kor);
      let bioPrazan = !imaPoruka(kor);
      // Promatrač javi promjenu odmah (prije nego što preglednik iscrta
      // sljedeći kadar): kad se razgovor isprazni, postavka se uključi prije
      // nego što stigne pozdrav, a kad se pozdrav pojavi, odmah dobije
      // oznaku za maglu i postavka se vrati
      function promjena() {
        const prazan = !imaPoruka(kor);
        if (bioPrazan && !prazan) oznaciPozdrav(kor);
        bioPrazan = prazan;
        uskladi(kor, prazan);
      }
      new MutationObserver(promjena).observe(kor, { childList: true, subtree: true });
      uskladi(kor, bioPrazan);
    });
  }

  try { pokreni(); }
  catch (e) { console.warn('[Martimex] Pozdrav bez tipkanja nije postavljen:', e); }

})();
