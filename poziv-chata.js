(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — poziv na razgovor s Marti (uz gumb chata)
  //
  //  Nekoliko sekundi nakon što se stranica učita, iznad gumba za otvaranje
  //  chata tiho se pojavi mala bijela kartica, kao prva Martina poruka:
  //  Martin avatar (crni krug sa slovom M), iznad teksta sitno "Marti · AI
  //  asistentica", i jedna rečenica koja kupca poziva da pita. Na stranici
  //  proizvoda rečenica se odnosi na proizvod koji kupac gleda. Pritisak na
  //  karticu otvori chat; × je zatvori.
  //
  //   - prikaže se najviše jednom po posjetu (pamti se u sessionStorageu,
  //     dok je kartica preglednika otvorena), i to samo ako kupac u tom
  //     posjetu chat još nije otvarao; nestane čim se chat otvori
  //   - stoji iznad gumba chata (mjeri se gdje je gumb), na mobitelu ne
  //     prelazi širinu zaslona
  //   - pojava: meko izroni s malim pomakom prema gore; "Smanji pokrete":
  //     samo izblijedi
  //   - sve je u shadow DOM-u elementa #voiceflow-chat (gdje Voiceflow crta
  //     chat), pa stil stranice na karticu ne utječe; u Voiceflowov dio
  //     ništa se ne umeće, kartica je zaseban element pokraj njega. Ako
  //     modul zakaže, chat radi normalno.
  //
  //  Postavke su ispod: tekstovi, odgoda, boje. Stranica može neke
  //  postavke promijeniti objektom window.MartimexPoziv = { odgoda: 2 }
  //  (prije učitavanja modula), što koristi testna stranica.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxPozivChata) return;   // zaštita ako se modul učita dvaput
  window.__mxPozivChata = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_POZIV_POSTAVKE = {
    boje: {                     // uvijek u obliku #rrggbb
      papir:  '#fffdfb',        // kartica
      tinta:  '#1c1715',        // tekst
      tih:    '#7a6d66',        // sitni natpis "Marti · AI asistentica"
      linija: '#e8ddd6',        // tanki topli rub kartice i gumba ×
      roza:   '#e2c3ba',        // naglasak: natpis imena, obrub pri fokusu
      tama:   '#0e0c0b',        // avatar (crni krug sa slovom M)
      puder:  '#f3e5de'         // slovo M u avataru
    },

    // Fontovi iz mape fonts/ (učitava ih jedan-ekran.js ili kartica-artikla.js)
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',
    fontNatpisa: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    ime: 'Marti · AI asistentica',                  // sitno iznad teksta
    tekst: 'Trebate savjet pri odabiru parfema ili pomoć s narudžbom? Slobodno me pitajte.',
    // na stranici proizvoda (WooCommerce: <body class="single-product">)
    tekstProizvod: 'Trebate savjet za ovaj proizvod ili pomoć pri odabiru? Slobodno me pitajte.',
    slovo: 'M',                                     // u avataru

    odgoda: 8,              // s nakon učitavanja stranice (0 = odmah)
    sakrijNakon: 0,         // s: nakon toliko se sama makne (0 = tek kad kupac zatvori ili otvori chat)
    jednomPoPosjetu: true,  // true: prikaže se jednom dok je kartica preglednika otvorena
    razmakOdGumba: 12       // px između kartice i gumba chata
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX_POZIV = (function () {
    'use strict';

    // postavke stranice (npr. testna stranica skrati odgodu)
    const P = Object.assign({}, MX_POZIV_POSTAVKE, window.MartimexPoziv || {});
    const B = Object.assign({}, MX_POZIV_POSTAVKE.boje, (window.MartimexPoziv || {}).boje || {});
    const HOST = 'voiceflow-chat';          // element u čiji shadow DOM Voiceflow crta chat
    const GUMB = '.vfrc-launcher';          // Voiceflowov gumb za otvaranje chata
    const KLJUC = 'mx-poziv';               // sessionStorage: 'gotovo' = već prikazano ili zatvoreno, 'chat' = chat već otvaran
    const MIRNO = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + a + ')'; }
    function zapamti(v) { try { sessionStorage.setItem(KLJUC, v); } catch (e) { /* bez pamćenja */ } }
    function zapamceno() { try { return sessionStorage.getItem(KLJUC) || ''; } catch (e) { return ''; } }

    const CSS = `
      :host .mx-p {
        position: fixed;
        right: 20px;
        bottom: var(--mx-p-dno, 84px);
        z-index: 1001;
        box-sizing: border-box;
        width: max-content;
        max-width: min(300px, calc(100vw - 40px));
        font-family: ${P.font};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        animation: mx-p-pojava .6s cubic-bezier(.16, 1, .3, 1) backwards;
      }
      :host .mx-p-odlazi { animation: mx-p-odlazak .3s cubic-bezier(.45, 0, .2, 1) forwards; pointer-events: none; }
      :host .mx-p-kartica {
        -webkit-appearance: none;
                appearance: none;
        display: flex;
        align-items: flex-start;
        gap: 11px;
        box-sizing: border-box;
        width: 100%;
        margin: 0;
        padding: 12px 16px 13px 12px;
        border: 0;
        border-radius: 18px 18px 6px 18px;
        background: ${B.papir};
        color: ${B.tinta};
        box-shadow: 0 0 0 1px ${B.linija}, 0 14px 32px -18px rgba(60, 40, 30, .45), 0 2px 6px -3px rgba(60, 40, 30, .14);
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition: box-shadow .3s cubic-bezier(.45, 0, .2, 1), transform .3s cubic-bezier(.16, 1, .3, 1);
      }
      @media (hover: hover) and (pointer: fine) {
        :host .mx-p-kartica:hover { transform: translateY(-1px); box-shadow: 0 0 0 1px ${prozirna(B.tinta, .18)}, 0 18px 36px -18px rgba(60, 40, 30, .5), 0 2px 6px -3px rgba(60, 40, 30, .14); }
      }
      :host .mx-p-kartica:active { transform: translateY(0) scale(.99); }
      :host .mx-p-kartica:focus { outline: none; }
      :host .mx-p-kartica:focus-visible { box-shadow: 0 0 0 1px ${prozirna(B.tinta, .3)}, 0 0 0 4px ${prozirna(B.roza, .35)}; }
      :host .mx-p-avatar {
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        margin-top: 1px;
        border-radius: 50%;
        background: ${B.tama};
        color: ${B.puder};
        font-family: ${P.fontNatpisa};
        font-size: 17px;
        font-weight: 600;
        line-height: 1;
        box-shadow: 0 0 0 1px rgba(60, 40, 30, .06), 0 6px 14px -8px rgba(30, 20, 14, .55);
      }
      :host .mx-p-tekst { display: block; min-width: 0; }
      :host .mx-p-ime {
        display: block;
        margin: 2px 0 4px;
        font-size: 10px;
        font-weight: 400;
        line-height: 1.2;
        letter-spacing: .22em;
        text-transform: uppercase;
        color: ${B.tih};
      }
      :host .mx-p-poruka {
        display: block;
        font-size: 13.5px;
        font-weight: 400;
        line-height: 1.5;
        letter-spacing: .005em;
        text-wrap: pretty;
      }
      :host .mx-p-zatvori {
        -webkit-appearance: none;
                appearance: none;
        position: absolute;
        top: -9px;
        right: -6px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: ${B.papir};
        color: ${B.tih};
        box-shadow: 0 0 0 1px ${B.linija}, 0 4px 10px -5px rgba(60, 40, 30, .4);
        cursor: pointer;
        transition: color .25s ease, background-color .25s ease;
      }
      :host .mx-p-zatvori:hover { color: ${B.tinta}; background: ${prozirna(B.roza, .3)}; }
      :host .mx-p-zatvori:focus { outline: none; }
      :host .mx-p-zatvori:focus-visible { outline: 1px solid ${B.tinta}; outline-offset: 2px; }
      :host .mx-p-zatvori svg { display: block; width: 11px; height: 11px; }
      @keyframes mx-p-pojava {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: none; }
      }
      @keyframes mx-p-odlazak {
        to { opacity: 0; transform: translateY(6px); }
      }
      @media (prefers-reduced-motion: reduce) {
        :host .mx-p { animation: mx-p-prozirnost .4s linear backwards; }
        :host .mx-p-odlazi { animation: mx-p-nestanak .25s linear forwards; }
        :host .mx-p-kartica, :host .mx-p-kartica:hover, :host .mx-p-kartica:active { transform: none; }
      }
      @keyframes mx-p-prozirnost { from { opacity: 0; } }
      @keyframes mx-p-nestanak { to { opacity: 0; } }
    `;

    const S = { kor: null, el: null, otvoren: false, prikazano: false, tajmer: 0 };

    function el(oznaka, klasa, sadrzaj) {
      const e = document.createElement(oznaka);
      if (klasa) e.className = klasa;
      if (sadrzaj) e.textContent = sadrzaj;
      return e;
    }

    function naProizvodu() {
      const b = document.body;
      return !!(b && b.classList && (b.classList.contains('single-product') || b.classList.contains('product-template-default')));
    }

    // kartica stoji iznad gumba chata; gumb se izmjeri (ako ga nema, 84 px od dna)
    function smjesti() {
      if (!S.el || !S.kor) return;
      const g = S.kor.querySelector(GUMB);
      let dno = 84;
      if (g) {
        const r = g.getBoundingClientRect();
        if (r.height > 0) dno = Math.round(window.innerHeight - r.top) + (+P.razmakOdGumba || 12);
      }
      S.el.style.setProperty('--mx-p-dno', dno + 'px');
    }

    function sakrij(zapis) {
      if (S.tajmer) { clearTimeout(S.tajmer); S.tajmer = 0; }
      if (zapis) zapamti(zapis);
      const e = S.el;
      if (!e) return;
      S.el = null;
      e.classList.add('mx-p-odlazi');
      setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 350);
    }

    function otvoriChat() {
      sakrij('chat');
      try {
        if (window.voiceflow && window.voiceflow.chat && typeof window.voiceflow.chat.open === 'function') window.voiceflow.chat.open();
        else { const g = S.kor && S.kor.querySelector(GUMB); if (g) g.click(); }
      } catch (e) { /* nije bitno */ }
    }

    function prikazi() {
      if (S.prikazano || S.otvoren || !S.kor) return;
      if (S.kor.querySelector('.vfrc-chat .vfrc-user-response')) return;   // razgovor već postoji
      S.prikazano = true;
      if (P.jednomPoPosjetu !== false) zapamti('gotovo');

      const korijen = el('div', 'mx-p');
      korijen.setAttribute('role', 'group');
      korijen.setAttribute('aria-label', 'Poziv na razgovor s Marti');
      const kartica = el('button', 'mx-p-kartica');
      kartica.type = 'button';
      kartica.appendChild(el('span', 'mx-p-avatar', String(P.slovo || 'M').charAt(0)));
      const tekst = el('span', 'mx-p-tekst');
      if (P.ime) tekst.appendChild(el('span', 'mx-p-ime', P.ime));
      tekst.appendChild(el('span', 'mx-p-poruka', naProizvodu() && P.tekstProizvod ? P.tekstProizvod : P.tekst));
      kartica.appendChild(tekst);
      kartica.addEventListener('click', otvoriChat);
      korijen.appendChild(kartica);

      const zatvori = el('button', 'mx-p-zatvori');
      zatvori.type = 'button';
      zatvori.setAttribute('aria-label', 'Zatvori poziv');
      zatvori.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg>';
      zatvori.addEventListener('click', function (e) { e.stopPropagation(); sakrij('gotovo'); });
      korijen.appendChild(zatvori);

      S.el = korijen;
      S.kor.appendChild(korijen);
      smjesti();
      const nakon = +P.sakrijNakon || 0;
      if (nakon > 0) S.tajmer = setTimeout(function () { sakrij('gotovo'); }, nakon * 1000);
    }

    // Voiceflow javlja otvaranje i zatvaranje chata porukom na window
    function pratiOtvaranje() {
      window.addEventListener('message', function (e) {
        if (e.source && e.source !== window) return;
        let d = e.data;
        if (typeof d === 'string') {
          if (d.indexOf('voiceflow:') === -1) return;
          try { d = JSON.parse(d); } catch (x) { return; }
        }
        const tip = d && d.type;
        if (tip === 'voiceflow:open') { S.otvoren = true; sakrij('chat'); }
        else if (tip === 'voiceflow:close') S.otvoren = false;
      });
    }

    // Voiceflow se učitava usporedo s ovim modulom: pričeka se njegov element
    function cekajHost(gotovo) {
      const pocetak = Date.now();
      (function trazi() {
        const h = document.getElementById(HOST);
        if (h && h.shadowRoot) { gotovo(h.shadowRoot); return; }
        if (Date.now() - pocetak < 60000) setTimeout(trazi, 150);
      })();
    }

    function pokreni() {
      if (zapamceno()) return;                // u ovom posjetu već prikazano, zatvoreno ili je chat otvaran
      pratiOtvaranje();
      cekajHost(function (kor) {
        S.kor = kor;
        const stil = document.createElement('style');
        stil.setAttribute('data-mx-poziv', '1');
        stil.textContent = CSS;
        kor.appendChild(stil);
        window.addEventListener('resize', smjesti);
        const odgoda = Math.max(0, +P.odgoda || 0) * 1000;
        // tek kad je gumb chata tu (Voiceflow ga iscrta malo nakon učitavanja)
        const pocetak = Date.now();
        (function cekajGumb() {
          if (zapamceno()) return;
          if (kor.querySelector(GUMB)) { setTimeout(prikazi, Math.max(0, odgoda - (Date.now() - pocetak))); return; }
          if (Date.now() - pocetak < 60000) setTimeout(cekajGumb, 200);
        })();
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_POZIV.pokreni(); }
  catch (e) { console.warn('[Martimex] Poziv na razgovor nije pokrenut:', e); }

})();
