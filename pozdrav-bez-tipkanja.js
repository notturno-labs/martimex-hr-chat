(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — Martin pozdrav odjednom, bez "tipkanja" (v1)
  //
  //  U Voiceflowu je uključeno "Stream text": Martine poruke ispisuju se
  //  slovo po slovo, kao da tipka. Tako ostaje za sve poruke u razgovoru,
  //  osim za prvu: pozdrav s ponuđenim gumbima pojavi se cijeli odjednom.
  //  Vrijedi i kad se razgovor pokrene prvi put i nakon "Započni novi
  //  razgovor" (to je opet prva poruka novog razgovora).
  //
  //  Tehnički: Voiceflow pri crtanju svake nove poruke pogleda svoju
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
