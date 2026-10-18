(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — film Naxos (animacija početnog ekrana chata)
  //
  //  Sastojci mirisa s fotografije (limun s listovima, med, saće, kora
  //  limete, bijeli cvjetovi) lebde složeni na crnoj podlozi, podignu se i
  //  zavrte u krug (limun se okreće oko svoje osi). U sredini vrtloga skupi
  //  se zlatno svjetlo i iz njega nastane bočica Xerjoff Naxos. Vrtlog se
  //  rasprsne prema kameri, a oko bočice se izoštri prizor (staklenka meda,
  //  limuni, cvjetovi naranče) u mekom krugu svjetla; kamera polako ulazi,
  //  preko zlatnog čepa prijeđe odsjaj, med teče, u suncu lebdi prašina.
  //  Zatim se prizor povuče u tamu, bočica se rastopi u svjetlo, a sastojci
  //  doplove natrag i slože se. Krug traje 14,6 s i ponavlja se bez šava.
  //
  //  Film je unaprijed izrađen video (naxos-film.mp4, rezerva .webm), jer
  //  zamućenje pokreta, dubinska oštrina i svjetlo u toj kvaliteti ne mogu
  //  se računati uživo na mobitelu. Video je na crnoj podlozi i stapa se s
  //  početnim ekranom (mix-blend-mode: screen, meki rub), pa se vidi zlatni
  //  sjaj početnog ekrana iza njega.
  //
  //  Modul učitava pocetna-chata.js (postavka animacija: 'film').
  //   - pripremi: učita samo prvi kadar (slika, ~60 KB); video se počne
  //     preuzimati tek kad se chat prvi put otvori
  //   - svako otvaranje chata: film kreće ispočetka
  //   - "Smanji pokrete" (postavka uređaja) ili ušteda podataka: umjesto
  //     filma stoji završni prizor (bočica u prizoru)
  //   - ako se video ne može pokrenuti (npr. iOS u načinu štednje baterije),
  //     stoji završni prizor
  //   - nakon "POČETAK" kadar se lagano poveća i nestane
  // ═════════════════════════════════════════════════════════════════════
  'use strict';
  if (window.MX_FILM) return;

  const SKRIPTA = (document.currentScript && document.currentScript.src) || '';
  const MAPA = SKRIPTA.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');

  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE
  // ─────────────────────────────────────────────────────────────────────
  const DATOTEKE = {
    mp4: 'naxos-film.mp4',             // H.264, za sve preglednike
    webm: 'naxos-film.webm',           // VP9, rezerva za preglednike bez H.264
    pocetak: 'naxos-film-pocetak.jpg', // prvi kadar: stoji dok se video ne pokrene
    mirno: 'naxos-film-mirno.jpg'      // završni prizor: "Smanji pokrete", ušteda podataka, video ne radi
  };
  const VERZIJA = '1';                 // promijeni kad se video zamijeni (osvježi priručnu memoriju preglednika)
  const VELICINA = 1.0;                // veličina kadra: 1 = širina prozora chata (najviše 1,2 x visina prostora animacije)
  const STANI_NA = 10.6;               // s: gdje film stane ako je ponavljaj: false (bočica u prizoru)
  const IZLAZ_MS = 650;                // trajanje nestajanja nakon "POČETAK"

  function napravi(platno, scena, dogadaji, opcije) {
    opcije = opcije || {};
    const MIRNO = opcije.mirno || { matches: false };
    const ponavljaj = opcije.ponavljaj !== false;
    const mapa = opcije.mapa || MAPA;
    let omot = null, slika = null, video = null, priprema = null, unisteno = false, izvorPostavljen = false;
    let stoji = false;

    function url(ime) { return mapa + ime + '?v=' + VERZIJA; }
    function stedi() {
      const c = navigator.connection;
      return !!(c && c.saveData);
    }
    function ucitajSliku(img, src) {
      return new Promise(function (ok) {
        img.onload = function () { ok(true); };
        img.onerror = function () { ok(false); };
        img.src = src;
      });
    }
    // završni prizor umjesto filma
    function stojeci() {
      stoji = true;
      if (video) { try { video.pause(); } catch (e) { /* nije bitno */ } video.style.opacity = '0'; }
      if (slika && slika.getAttribute('data-ime') !== 'mirno') {
        slika.setAttribute('data-ime', 'mirno');
        slika.src = url(DATOTEKE.mirno);
      }
    }

    function pripremi() {
      if (priprema) return priprema;
      priprema = Promise.resolve().then(function () {
        if (unisteno) return false;
        dogadaji.podnaslov(false);
        omot = document.createElement('div');
        omot.setAttribute('aria-hidden', 'true');
        omot.style.cssText = [
          'position:absolute', 'left:50%', 'top:50%', 'width:0', 'height:0',
          'transform:translate(-50%,-50%)', 'pointer-events:none', 'mix-blend-mode:screen',
          'opacity:0', 'transition:opacity .6s linear, transform .9s cubic-bezier(.45,0,.2,1)',
          '-webkit-mask-image:radial-gradient(closest-side,#000 80%,transparent 100%)',
          'mask-image:radial-gradient(closest-side,#000 80%,transparent 100%)'
        ].join(';');
        const sloj = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;object-fit:cover;margin:0;border:0;background:transparent;';
        slika = document.createElement('img');
        slika.alt = '';
        slika.decoding = 'async';
        slika.draggable = false;
        slika.style.cssText = sloj;
        video = document.createElement('video');
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('disablepictureinpicture', '');
        video.setAttribute('disableremoteplayback', '');
        video.setAttribute('tabindex', '-1');
        video.loop = ponavljaj;
        video.preload = 'none';
        video.style.cssText = sloj + 'opacity:0;';
        video.addEventListener('playing', function () { if (!stoji) video.style.opacity = '1'; });
        video.addEventListener('error', stojeci);
        if (!ponavljaj) {
          video.addEventListener('timeupdate', function () {
            if (video.currentTime >= STANI_NA) video.pause();
          });
        }
        omot.appendChild(slika);
        omot.appendChild(video);
        scena.appendChild(omot);
        velicina();
        const pocetna = (MIRNO.matches || stedi()) ? 'mirno' : 'pocetak';
        slika.setAttribute('data-ime', pocetna);
        return ucitajSliku(slika, url(DATOTEKE[pocetna])).then(function (ok) {
          if (unisteno) return false;
          if (!ok) { dogadaji.bezAnimacije(); return false; }
          return true;
        });
      }).catch(function (e) {
        console.warn('[Martimex] Početni ekran bez filma:', e);
        dogadaji.bezAnimacije();
        return false;
      });
      return priprema;
    }

    // kadar je kvadrat u sredini prostora animacije, širok koliko prozor chata
    function velicina() {
      if (!omot) return;
      const sirina = Math.max(1, platno.clientWidth || scena.offsetWidth);
      const visina = Math.max(1, scena.offsetHeight);
      const s = Math.round(Math.min(sirina, visina * 1.2) * VELICINA);
      omot.style.width = s + 'px';
      omot.style.height = s + 'px';
    }

    function postaviIzvor() {
      if (izvorPostavljen) return;
      izvorPostavljen = true;
      [['mp4', 'video/mp4'], ['webm', 'video/webm']].forEach(function (d) {
        const s = document.createElement('source');
        s.src = url(DATOTEKE[d[0]]);
        s.type = d[1];
        video.appendChild(s);
      });
      // greška zadnjeg izvora = nijedan nije radio
      video.lastChild.addEventListener('error', stojeci);
      video.preload = 'auto';
      video.load();
    }

    function pokreni() {
      if (unisteno || !video) return;
      omot.style.transform = 'translate(-50%,-50%)';
      omot.style.opacity = '1';
      if (MIRNO.matches || stedi()) { stojeci(); return; }
      stoji = false;
      postaviIzvor();
      try { if (video.currentTime > 0) video.currentTime = 0; } catch (e) { /* još nema podataka */ }
      let p;
      try { p = video.play(); } catch (e) { stojeci(); return; }
      if (p && p.catch) p.catch(function (e) {
        // automatsko pokretanje zabranjeno (npr. štednja baterije): završni prizor
        if (e && e.name === 'AbortError') return;     // prekinuto zaustavljanjem, nije greška
        stojeci();
      });
    }

    return {
      pripremi: pripremi,
      velicina: velicina,
      ispocetka: function () {
        return pripremi().then(function (ok) {
          if (ok && dogadaji.otvoreno()) pokreni();
          return ok;
        });
      },
      stani: function () { if (video) { try { video.pause(); } catch (e) { /* nije bitno */ } } },
      mis: function () {},
      izlaz: function (gotovo) {
        if (!omot || MIRNO.matches) { gotovo(); return; }
        omot.style.transform = 'translate(-50%,-50%) scale(1.06)';
        omot.style.opacity = '0';
        setTimeout(gotovo, IZLAZ_MS);
      },
      unisti: function () {
        unisteno = true;
        if (video) {
          try { video.pause(); } catch (e) { /* nije bitno */ }
          while (video.firstChild) video.removeChild(video.firstChild);
          video.removeAttribute('src');
          try { video.load(); } catch (e) { /* nije bitno */ }
        }
        if (omot && omot.parentNode) omot.parentNode.removeChild(omot);
        omot = slika = video = null;
      }
    };
  }

  window.MX_FILM = { napravi: napravi };
})();
