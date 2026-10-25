(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — gumb koji otvara chat s Marti: "oblačić s točkicama" (v7)
  //
  //  Gumb u kutu ekrana i dalje crta Voiceflow; ovaj modul mu daje izgled:
  //
  //   - crna pilula s tankim rubom boje ružičastog zlata
  //   - lijevo ikona: oblačić (tanki rozi obrub, crna unutrašnjost, repić
  //     dolje lijevo) s tri svijetle točkice u sredini
  //   - natpis ("Asistent", kako je upisan u Voiceflowu) velikim,
  //     razmaknutim slovima, istim fontom kao poruke u chatu (Jost), u
  //     prašnjavoj rozoj
  //   - u mirovanju JEDINA animacija: svakih 5 sekundi kroz tri točkice u
  //     oblačiću mekano prođe val, kao val na moru (podignu se i spuste
  //     zajedno, a vrh vala putuje slijeva nadesno). Nema svjetla po rubu,
  //     nema bočice, nema pojave pri učitavanju
  //   - miš iznad gumba: rub malo posvijetli (bez pomicanja); pritisak:
  //     gumb se tek malo stisne; fokus s tipkovnice: vidljiv obrub
  //
  //  Dok je chat otvoren, gumb je okrugli gumb za zatvaranje (Voiceflowova
  //  strelica, u rozoj) iste visine i s istim rubom. Pretvorba je jedan
  //  pokret: na klik se oblačić odmah pretopi u strelicu okrenutu udesno,
  //  natpis se utiša, pa se pilula skupi u krug dok se strelica okreće
  //  prema dolje. Pri zatvaranju chata sve ide unatrag (strelica se okrene
  //  udesno i pretopi natrag u oblačić dok se pilula širi). Ako je na
  //  uređaju uključeno "Smanji pokrete", točkice miruju, a strelica i
  //  oblačić se samo pretope, bez okretanja.
  //
  //  Tehnički: Voiceflow crta chat u shadow DOM-u elementa #voiceflow-chat.
  //  Modul onamo ubaci svoj stil. Oblačić je pozadina Voiceflowove slike
  //  ikone (slika se makne iz vidnog polja), a tri točkice su jedino što
  //  modul doda u gumb: mali ukrasni <span> u omotu ikone (zašto, piše kod
  //  TOČKICA niže). Voiceflow i dalje sam skriva ikonu kad se chat otvori.
  //  Oslanja se na klasu .vfrc-launcher, koju Voiceflow službeno podržava
  //  za prilagodbu. Ako Voiceflow jednog dana promijeni gumb, izgled
  //  izostane, a chat radi normalno.
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
    tockice: 5                // svakih koliko sekundi kroz točkice prođe val (val traje oko 1,3 s, ostatak miruju); 0 = miruju
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

    // ── OBLAČIĆ (24 × 24): tanki rozi obrub, crna unutrašnjost, repić dolje
    // lijevo. Mirna SVG slika, pozadina Voiceflowove slike ikone.
    const OBLACIC = 'url("data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<path d="M6.5 3.25H17.5A3.75 3.75 0 0 1 21.25 7V13A3.75 3.75 0 0 1 17.5 16.75H9.6L5.75 20.25V16.6A3.75 3.75 0 0 1 2.75 13V7A3.75 3.75 0 0 1 6.5 3.25Z" ' +
      'fill="' + B.podloga + '" stroke="' + B.roza + '" stroke-width="1.5" stroke-linejoin="round"/></svg>') + '")';

    // ── TOČKICE: tri mala kruga preko oblačića. To je jedino što modul doda
    // u gumb: mali <span> na kraju omota ikone (samo ukras, čitači ekrana ga
    // preskaču). Točkice namjerno nisu dio slike ni pozadine: Safari pri
    // povećanju ili smanjenju stranice kvari animaciju unutar SVG slike
    // (bugs.webkit.org 241910), a px vrijednosti u animaciji koja se stalno
    // vrti ne preračuna (29993), pa su točkice ispadale prevelike ili
    // razmaknute. Ovako su veličina i položaj obični CSS pikseli, pa rastu i
    // smanjuju se zajedno sa stranicom, a val je pomak u postocima vlastite
    // visine, na koji povećanje ne utječe. Pokret je transformacija, pa je
    // gladak i za dijelove piksela.
    //
    // VAL: svakih nekoliko sekundi (P.tockice) kroz točkice prođe val, kao
    // val na moru. Svaka se podigne i spusti mekanom sinusnom krivuljom (bez
    // trzaja na dnu i na vrhu), a susjedna krene tek malo kasnije, dok se
    // prethodna još diže. Tako se sve tri miču zajedno, a vrh vala putuje
    // slijeva nadesno.
    const VAL = {
      visina: 1.8,     // px, koliko se točkica podigne
      uspon: .44,      // s, dizanje jedne točkice
      spust: .52,      // s, spuštanje (malo sporije od dizanja, kao kad val prođe)
      razmak: .15,     // s, za koliko kasni susjedna točkica
      pocetak: .6      // s, prvi val nakon što se gumb pojavi
    };
    // točkica: krug (2,6 px, mekan rub do 3,6 px) nacrtan u svojem kvadratu
    // 4 × 4 px; kvadrati stoje na cijelim pikselima, pa je točkica u
    // mirovanju oštra (sitan element na pola piksela preglednik zamuti)
    const POLJE = 4;                                                       // px, kvadrat jedne točkice
    const TOCKA = 'radial-gradient(circle at center, ' + B.tockice + ' 0 1.3px, ' + prozirna(B.tockice, 0) + ' 1.8px)';
    const TRAJANJE_VALA = VAL.uspon + VAL.spust + 2 * VAL.razmak;          // s, od prve do zadnje točkice
    const KRUG = +P.tockice > 0 ? Math.max(TRAJANJE_VALA + .3, +P.tockice) : 0;   // s, jedan krug (val + mirovanje)
    const SINUS = 'cubic-bezier(.37, 0, .63, 1)';      // polovica sinusnog vala (mekano krene i mekano stane)
    const TOCKICE = OMOT + ' > .mx-g-tockice';
    const TOCKICE_HTML = '<span class="mx-g-tockice" aria-hidden="true"><i></i><i></i><i></i></span>';
    function pct(v) { return +v.toFixed(2) + '%'; }
    function sek(v) { return +v.toFixed(3) + 's'; }
    const H = broj(P.visina, 44, 32, 64);
    const VEL = broj(P.velicinaNatpisa, 12, 9, 20);
    const RAZMAK = broj(P.razmakSlova, .34, 0, 1);

    // Pretvorba pilule u okrugli gumb za zatvaranje i natrag: jedan tempo za
    // širinu, rubove, razmak i omot ikone. Krene polako (da se prvo vidi
    // kako se oblačić pretapa u strelicu), u sredini ubrza, pa se mekano smiri.
    const OBLIK = .44;                                   // s
    const KRIVULJA = 'cubic-bezier(.6, 0, .2, 1)';
    const OKRET = 'cubic-bezier(.45, 0, .2, 1)';         // okretanje strelice
    const IZLAZ = 'cubic-bezier(.4, 0, 1, 1)';           // ikona se smanjuje dok nestaje
    const ULAZ = 'cubic-bezier(.2, .8, .2, 1)';          // ikona se mekano raširi dok se pojavljuje
    const STRELICA = OMOT + ' > svg';                    // Voiceflowova strelica za zatvaranje

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
        text-overflow: clip;                  /* dok se pilula skuplja u krug, natpis se reže, bez "…" */
        /* pretvorba u gumb za zatvaranje i natrag: širina, rubovi i razmak
           zajedno, jednim tempom (i Voiceflowova meka sjena okruglog gumba
           se pojavi i nestane postupno); pritisak kratko */
        transition: box-shadow .3s ease, transform .15s ease, filter ${OBLIK}s ease,
          max-width ${OBLIK}s ${KRIVULJA}, padding ${OBLIK}s ${KRIVULJA}, gap ${OBLIK}s ${KRIVULJA};
      }
      /* Voiceflow gumb na dodir poveća za 10 % i posivi, a na pritisak smanji za 20 % */
      :host ${GUMB}:hover,
      :host ${GUMB}:active { background-color: var(--mx-g-podloga); transform: none; }
      :host ${GUMB}:active { transform: scale(.96); }
      :host ${GUMB}:focus-visible { outline: 2px solid var(--mx-g-tinta); outline-offset: 3px; }
      @media (hover: hover) and (pointer: fine) {
        :host ${GUMB}:hover { box-shadow: var(--mx-g-sjena-gore); }
      }

      /* chat zatvoren: gumb s ikonom i natpisom. Najveća širina je točno
         izmjerena širina pilule (upisuje je JS), a ne Voiceflowovih 500 px:
         tako se pri otvaranju pilula skuplja u krug kroz cijelu pretvorbu,
         a ne naglo pri kraju */
      ${ZATVOREN} ${GUMB} {
        height: ${H}px;
        max-width: var(--mx-g-sirina, 500px);
        padding: 0 17px 0 13px;
        gap: 8px;
      }
      /* chat otvoren: okrugli gumb za zatvaranje iste visine */
      ${OTVOREN} ${GUMB} {
        height: ${H}px;
        max-width: ${H}px;
        padding: ${Math.round((H - 32) / 2)}px;
        gap: 0;
      }

      /* omot ikone raste iz oblačića (24 px) u strelicu (32 px) istim tempom
         kao i gumb (Voiceflow ga mijenja kasnije i brže, pa bi strelica trznula) */
      :host ${OMOT} { transition: min-width ${OBLIK}s ${KRIVULJA}, min-height ${OBLIK}s ${KRIVULJA}; }
      ${ZATVOREN} ${OMOT} { min-width: 24px; min-height: 24px; }
      ${OTVOREN} ${OMOT} { min-width: 32px; min-height: 32px; }

      /* ── strelica: oblačić se na klik pretopi u strelicu okrenutu udesno,
         a ona se, dok se pilula skuplja u krug, okrene prema dolje. Pri
         zatvaranju obrnuto. Prijelazi (a ne Voiceflowova animacija), pa je
         pokret gladak i kad se gumb stisne usred pretvorbe. Strelica i
         oblačić su u sredini omota, pa se pretapaju na istom mjestu. ── */
      :host ${STRELICA} {
        top: 50%;
        left: 50%;
        margin: -16px 0 0 -16px;
        animation: none;
      }
      ${ZATVOREN} ${STRELICA} {
        opacity: 0;
        rotate: -90deg;
        scale: .6;
        transition: rotate .32s ${OKRET}, opacity .12s ease .2s, scale .2s ${IZLAZ} .2s;
      }
      ${OTVOREN} ${STRELICA} {
        opacity: 1;
        rotate: 0deg;
        scale: 1;
        transition: opacity .14s ease-out .02s, scale .26s ${ULAZ}, rotate .38s ${OKRET} .1s;
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
        text-overflow: clip;
        color: var(--mx-g-roza);
        /* pri zatvaranju chata natpis se vrati tek kad se pilula već malo raširila */
        transition: opacity .26s ease .14s, margin ${OBLIK}s ${KRIVULJA};
      }
      /* razmak iza zadnjeg slova ne računa se u širinu gumba */
      ${ZATVOREN} ${NATPIS} { margin-right: -${RAZMAK}em; }
      /* na klik se natpis odmah utiša, prije nego što ga pilula počne rezati */
      ${OTVOREN} ${NATPIS} {
        opacity: 0;
        transition: opacity .16s ease-out, margin ${OBLIK}s ${KRIVULJA};
      }

      /* ── ikona: oblačić s tri točkice umjesto Voiceflowove slike (slika
         se makne iz vidnog polja, a oblačić i točkice su njezina pozadina;
         Voiceflow je i dalje sam skriva kad se chat otvori) ── */
      :host ${IKONA} {
        top: 50%;
        left: 50%;
        margin: -12px 0 0 -12px;
        width: 24px;
        height: 24px;
        max-width: none;
        border-radius: 0;
        object-position: -9999px 0;
        color: transparent;                   /* ako se slika ne učita, ne vidi se ni njezin opis */
        font-size: 0;
        background-image: ${OBLACIC};
        background-size: 24px 24px;
        background-repeat: no-repeat;
        background-position: 0 0;
      }

      /* ── točkice: na istom mjestu kao oblačić (24 × 24, u sredini omota) ── */
      :host ${TOCKICE} {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 24px;
        height: 24px;
        margin: -12px 0 0 -12px;
        padding: 0;
        pointer-events: none;
        forced-color-adjust: none;            /* i uz visoki kontrast točkice ostaju vidljive */
      }
      :host ${TOCKICE} > i {
        position: absolute;
        top: ${10 - POLJE / 2}px;             /* sredina točkice na y = 10, kao u ikone/oblacic.svg */
        width: ${POLJE}px;
        height: ${POLJE}px;
        margin: 0;
        padding: 0;
        border: 0;
        background: ${TOCKA};
        ${KRUG ? `animation: mx-g-val ${sek(KRUG)} infinite both;` : ''}
      }
      :host ${TOCKICE} > i:nth-child(1) { left: ${8 - POLJE / 2}px; animation-delay: ${sek(VAL.pocetak)}; }
      :host ${TOCKICE} > i:nth-child(2) { left: ${12 - POLJE / 2}px; animation-delay: ${sek(VAL.pocetak + VAL.razmak)}; }
      :host ${TOCKICE} > i:nth-child(3) { left: ${16 - POLJE / 2}px; animation-delay: ${sek(VAL.pocetak + 2 * VAL.razmak)}; }
      /* jedna točkica: mekano gore, mekano dolje, pa miruje do kraja kruga
         (pomak je u postocima visine njezina kvadrata: ${VAL.visina} px) */
      @keyframes mx-g-val {
        0% { transform: translateY(0); animation-timing-function: ${SINUS}; }
        ${pct(VAL.uspon / KRUG * 100)} { transform: translateY(-${pct(VAL.visina / POLJE * 100)}); animation-timing-function: ${SINUS}; }
        ${pct((VAL.uspon + VAL.spust) / KRUG * 100)}, 100% { transform: translateY(0); }
      }
      /* pri otvaranju chata točkice se smanje i nestanu zajedno s oblačićem,
         a pri zatvaranju se s njim i vrate (isti tempo kao oblačić) */
      ${ZATVOREN} ${TOCKICE} {
        opacity: 1;
        scale: 1;
        transition: opacity .2s ease .22s, scale .3s ${ULAZ} .2s;
      }
      ${OTVOREN} ${TOCKICE} {
        opacity: 0;
        scale: .6;
        transition: opacity .1s ease, scale .22s ${IZLAZ};
      }
      /* dok Voiceflow umjesto ikone vrti kružić učitavanja, točkica nema */
      :host ${OMOT}:has(> .vfrc-launcher__loading-spinner-container) > .mx-g-tockice { opacity: 0; }
      /* na klik se oblačić smanji i nestane dok se na njegovom mjestu pojavljuje
         strelica; pri zatvaranju se vrati kad se strelica već okrenula udesno
         (vidljivost u mirovanju određuje Voiceflow, npr. dok se chat učitava) */
      ${ZATVOREN} ${IKONA} {
        scale: 1;
        transition: opacity .2s ease .22s, scale .3s ${ULAZ} .2s;
      }
      ${OTVOREN} ${IKONA} {
        opacity: 0;
        scale: .6;
        transition: opacity .1s ease, scale .22s ${IZLAZ};
      }
      /* ako sustav sam određuje boje (visoki kontrast), točkice miruju */
      @media (forced-colors: active) {
        :host ${TOCKICE} > i { animation: none; }
      }
      /* "Smanji pokrete": točkice miruju, a oblačić i strelica se samo pretope */
      @media (prefers-reduced-motion: reduce) {
        :host ${TOCKICE} > i { animation: none; }
        :host ${GUMB}:active { transform: none; }
        ${ZATVOREN} ${IKONA}, ${OTVOREN} ${IKONA},
        ${ZATVOREN} ${TOCKICE}, ${OTVOREN} ${TOCKICE},
        ${ZATVOREN} ${STRELICA}, ${OTVOREN} ${STRELICA} { rotate: none; scale: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-gumb]');
      if (stari && stari.getAttribute('data-mx-gumb') === '7') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-gumb', '7');
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

    // ── Je li chat otvoren → atribut data-mx-otvoren na #voiceflow-chat (o
    // njemu ovisi izgled gumba). Voiceflow otvaranje javi porukom na window
    // ('{"type":"voiceflow:open"}') i prije nego što sam promijeni gumb, a
    // zatvaranje ('voiceflow:close') tek nakon toga. Zato se promjena prati i
    // izravno: čim Voiceflow promijeni klasu chata ili gumba, provjeri se
    // prima li prozor chata klikove (zatvoren ih ne prima). Tako se gumb
    // počne mijenjati u istom trenutku kad i prozor chata, u oba smjera.
    let izmjeriUskoro = null;      // postavi ga pratiSirinu
    function postavi(host, otvoren) {
      if (host.hasAttribute('data-mx-otvoren') === otvoren) return;
      if (otvoren) host.setAttribute('data-mx-otvoren', '');
      else {
        host.removeAttribute('data-mx-otvoren');
        if (izmjeriUskoro) izmjeriUskoro(OBLIK * 1000 + 100);    // pilula se raširila: izmjeri iznova
      }
    }

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
        if (tip === 'voiceflow:open') postavi(host, true);
        else if (tip === 'voiceflow:close') postavi(host, false);
      });
    }

    function pratiStanje(host, korijen) {
      function otvorenChat() {
        const prozor = korijen.querySelector('.vfrc-chat__container');
        return prozor ? getComputedStyle(prozor).pointerEvents !== 'none' : null;
      }
      const sad = otvorenChat();                 // npr. chat je ostao otvoren od prije
      if (sad !== null) postavi(host, sad);
      new MutationObserver(function (promjene) {
        for (let i = 0; i < promjene.length; i++) {
          const k = promjene[i].target.classList;
          if (k && (k.contains('vfrc-widget') || k.contains('vfrc-launcher'))) {
            const o = otvorenChat();
            if (o !== null) postavi(host, o);
            return;
          }
        }
      }).observe(korijen, { attributes: true, attributeFilter: ['class'], subtree: true });
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

    // Širina pilule (chat zatvoren) → --mx-g-sirina na #voiceflow-chat, da se
    // pretvorba u krug i natrag odvija kroz cijelo trajanje prijelaza. Mjeri
    // se bez ograničenja (varijabla se nakratko makne), kad se gumb pojavi,
    // kad se učita font, pri promjeni veličine prozora i nakon zatvaranja chata
    function pratiSirinu(host, korijen) {
      let ceka = 0;
      // mjeri se samo kad pilula miruje: usred pretvorbe (ili ako je kartica
      // u pozadini pa pretvorba stoji) izmjerila bi se prekratka širina
      function mijenjaSe(g) {
        if (!g.getAnimations) return false;
        return g.getAnimations({ subtree: true }).some(function (a) {
          return a.transitionProperty && /width|padding|gap|margin/.test(a.transitionProperty) && a.playState !== 'finished';
        });
      }
      function izmjeri() {
        const g = korijen.querySelector(GUMB);
        if (!g || host.hasAttribute('data-mx-otvoren')) return;
        if (mijenjaSe(g)) { uskoro(150); return; }
        host.style.removeProperty('--mx-g-sirina');
        const w = g.offsetWidth;                 // bez transformacija (pritisak gumb malo smanji)
        if (w > 0) host.style.setProperty('--mx-g-sirina', w + 'px');
      }
      function uskoro(ms) { clearTimeout(ceka); ceka = setTimeout(izmjeri, ms || 0); }
      izmjeriUskoro = uskoro;                    // i nakon zatvaranja chata (postavi)
      izmjeri();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { uskoro(0); });
      window.addEventListener('resize', function () { uskoro(150); });
      // gumb (ili njegov natpis) se promijenio: izmjeri iznova
      new MutationObserver(function () { uskoro(50); }).observe(korijen, { childList: true, subtree: true, characterData: true });
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

    // Točkice: mali <span> s tri kruga na kraju omota ikone. React ga ne
    // dira (nije njegov element), a ako Voiceflow gumb nacrta iznova (npr.
    // nakon promjene postavki), doda se ponovno
    function ubaciTockice(korijen) {
      const omot = korijen.querySelector(OMOT);
      if (!omot) return;
      for (let c = omot.firstElementChild; c; c = c.nextElementSibling) {
        if (c.classList.contains('mx-g-tockice')) return;
      }
      omot.insertAdjacentHTML('beforeend', TOCKICE_HTML);
    }
    function pratiTockice(korijen) {
      ubaciTockice(korijen);
      new MutationObserver(function () { ubaciTockice(korijen); }).observe(korijen, { childList: true, subtree: true });
    }

    function pokreni() {
      ubaciFont();
      pratiOtvaranje();
      cekajHost(function (host) {
        ubaciStil(host.shadowRoot);
        cekajGumb(host.shadowRoot, function () {
          pratiTockice(host.shadowRoot);
          pratiStanje(host, host.shadowRoot);
          pratiSirinu(host, host.shadowRoot);
        });
      });
    }

    return { pokreni: pokreni, css: CSS, tockice: TOCKICE_HTML };
  })();

  window.__mxGumbChataCss = MX_GUMB.css;   // samo za stranicu s pregledom (pokusi/gumb/pregled.html)
  window.__mxGumbChataTockice = MX_GUMB.tockice;

  try { MX_GUMB.pokreni(); }
  catch (e) { console.warn('[Martimex] Izgled gumba chata nije postavljen:', e); }

})();
