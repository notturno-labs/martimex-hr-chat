(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — Martin pozdrav odjednom, bez "tipkanja" (v2)
  //
  //  Prva poruka razgovora, Martin pozdrav s ponuđenim gumbima, samo se
  //  pojavi, mekano (kao i ostale Martine poruke, vidi jedan-ekran.js):
  //
  //   - dok Marti priprema pozdrav, ne prikazuje se oblačić s točkicama ni
  //     natpis "Trenutak, molim…" (cekanje-odgovora.js); ispod traka s
  //     brendovima je tada prazno dok pozdrav ne stigne
  //   - pozdrav se ne ispisuje slovo po slovo: tekst i gumbi su tu odmah
  //
  //  Sve ostale poruke u razgovoru ostaju kao dosad: prije odgovora se vide
  //  točkice (i natpis kad odgovor potraje), a odgovor se ispisuje slovo
  //  po slovo ("Stream text" iz Voiceflowa). Vrijedi i kad se razgovor
  //  pokrene prvi put i nakon "Započni novi razgovor" (to je opet prva
  //  poruka novog razgovora).
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
  //  Ako je "Stream text" u Voiceflowu isključen, modul ne radi ništa.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxPozdrav) return;     // zaštita ako se modul učita dvaput
  window.__mxPozdrav = true;

  const HOST = 'voiceflow-chat';      // element u čiji shadow DOM Voiceflow crta chat
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

  // Dok Marti priprema pozdrav (u razgovoru još nema ni jedne poruke),
  // oblačić s točkicama se ne prikazuje. Voiceflowov oblačić (s avatarom) je
  // .vfrc-typing-indicator--container; poruke su .vfrc-system-response i
  // .vfrc-user-response (oblačić točkica nije unutar njih)
  const CSS = `
    :host .vfrc-chat:not(:has(.vfrc-system-response, .vfrc-user-response)) .vfrc-typing-indicator--container {
      display: none !important;
    }
  `;
  function ubaciStil(kor) {
    const stari = kor.querySelector('style[data-mx-pozdrav]');
    if (stari && stari.getAttribute('data-mx-pozdrav') === '2') return;
    if (stari) stari.remove();
    const stil = document.createElement('style');
    stil.setAttribute('data-mx-pozdrav', '2');
    stil.textContent = CSS;
    kor.appendChild(stil);
  }

  // ima li u razgovoru već ijedna poruka (Martina ili kupčeva)
  function imaPoruka(kor) {
    return !!kor.querySelector('.vfrc-chat .vfrc-system-response, .vfrc-chat .vfrc-user-response');
  }

  // Prazan razgovor: sljedeća poruka je pozdrav, iscrta se odjednom.
  // Čim postoji ijedna poruka: kako je zadano u Voiceflowu.
  function uskladi(kor) {
    const a = postavke(kor);
    if (!a) return;
    if (!izvorno.has(a)) izvorno.set(a, a.chat.streamingDisabled);
    if (izvorno.get(a)) return;                 // "Stream text" je u Voiceflowu ionako isključen
    const bezTipkanja = !imaPoruka(kor);
    if (a.chat.streamingDisabled !== bezTipkanja) a.chat.streamingDisabled = bezTipkanja;
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
      // Promatrač javi promjenu odmah (prije nego što preglednik iscrta
      // sljedeći kadar): kad se razgovor isprazni, postavka se uključi prije
      // nego što stigne pozdrav, a kad se pozdrav pojavi, odmah se vrati
      new MutationObserver(function () { uskladi(kor); }).observe(kor, { childList: true, subtree: true });
      uskladi(kor);
    });
  }

  try { pokreni(); }
  catch (e) { console.warn('[Martimex] Pozdrav bez tipkanja nije postavljen:', e); }

})();
