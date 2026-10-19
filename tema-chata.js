(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — izgled cijelog chata s Marti: "Portoro" (Liquid Glass) (v2)
  //
  //  Chat je uređen kao Martimex poslovnica: crni Portoro mramor sa
  //  zlatnim žilama (pult), bijeli Calacatta mramor (pod), brušeno zlato
  //  i mesing (slovo M, letvica pulta) i tamnoplavi zidovi i strop. Preko
  //  toga sve lebdi kao tamno, dimljeno staklo (po uzoru na Liquid Glass):
  //
  //   - pozadina: polirani crni Portoro mramor (mramor/crni.webp, na
  //     oštrim zaslonima crni-2x.webp) sa zlatnim žilama: dugi kosi pojas
  //     gore, strmi uz desni rub i tiši pojas kroz donji dio; iza stupca
  //     poruka kamen je tiho zatamnjen, da je tekst miran i lako čitljiv.
  //     Odozgo pada tamnoplavo svjetlo stropa, a dolje lijevo se nazire
  //     tamnoplavi zid; preko kamena polako klizi meko
  //     svjetlo pa žile tiho zasvjetlucaju; na vrhu i dnu se tama zgusne,
  //     pa poruke tiho nestaju ispod zaglavlja i polja za poruku
  //   - zaglavlje je plutajuća kapsula od crnog Portoro mramora pod
  //     dimljenim staklom, sa zlatnim rubom; zlatne žile su zgusnute desno
  //     (iza gumba), a iza imena "Marti" kamen je taman
  //   - Martine poruke su oblačići od dimljenog, malo hladnog stakla s
  //     dvobojnim rubom (bijeli odsjaj gore lijevo, zlato dolje desno);
  //     kupčeve poruke su od bijelog Calacatta mramora pod mliječnim
  //     staklom, s tamnim tekstom i zlatnim rubom
  //   - gumbi s ponuđenim odgovorima su staklene pilule sa zlatnim rubom i
  //     zlatnim slovima; kad je miš iznad njih, postanu brušeni mesing;
  //     dok Marti piše, u staklu trepere tri zlatne točkice
  //   - polje za poruku je staklena kapsula sa zlatnim rubom; gumb za
  //     slanje je taman krug sa svijetlom strelicom, a čim ima što poslati,
  //     postane kuglica od mesinga; ispod polja je pod od bijelog Calacatta
  //     mramora s mesinganom letvicom (kao crni pult na bijelom podu)
  //   - kartica proizvoda (kartica-artikla.js) je tamno staklo s dvostrukim
  //     tankim zlatnim rubom; bočica stoji u gotovo bijeloj vitrini (od
  //     bijelog mramora s tihim svjetlom police, kad je fotografija obrađena)
  //   - kraj razgovora: tanka letvica od mesinga; ploča "Započni novi
  //     razgovor" je od crnog mramora pod dimljenim staklom sa zlatnom
  //     letvicom na vrhu, a glavni gumb na njoj je od brušenog mesinga
  //   - početni ekran (pocetna-chata.js): tamnoplavo svjetlo stropa preko
  //     crnog mramora čije se zlatne žile vide samo pri vrhu, pojas zlatnih
  //     žila uz donji rub, na računalu meki odsjaj LED trake uz desni rub,
  //     zlato umjesto ružičastog zlata, stakleni gumb za zatvaranje i pilula
  //     "POČETAK" od crnog mramora koja tiho diše zlatnim sjajem
  //   - gumb chata u kutu stranice (gumb-chata.js) je komadić crnog
  //     Portoro mramora sa zlatnom žilom uz donji rub, zlatnim rubom,
  //     zlatnim natpisom i pozlaćenom bočicom
  //   - tekstovi koje Voiceflow piše engleski ("Start new chat", "Cancel",
  //     "Chat has ended") su na hrvatskom
  //
  //  Ako je na uređaju uključeno "Smanji pokrete", svjetlo na mramoru
  //  miruje i poruke se samo tiho pojave. Ako je uključeno "Smanji
  //  prozirnost", mramor je tamniji, a staklo gušće (tekst je još
  //  čitljiviji).
  //
  //  Tehnički: kao i ostali moduli, ovaj samo ubaci svoj stil u shadow DOM
  //  elementa #voiceflow-chat i u chat ništa ne umeće. Oslanja se na
  //  Voiceflowove službene klase (.vfrc-chat, .vfrc-header, .vfrc-message,
  //  .vfrc-user-response, .vfrc-footer, .vfrc-input-container...) i na
  //  raspored elemenata oko njih, a ne na nasumična imena klasa koja
  //  Voiceflow mijenja sa svakom verzijom. Ako Voiceflow jednog dana
  //  promijeni prozor, dio izgleda izostane, a chat radi normalno.
  //  Teksture mramora su u mapi mramor/ (uz ovu skriptu); ako se ne
  //  učitaju, ostaju iste boje (tama, tamnoplava, bijela), bez žila.
  //  Isključi se tako da se u loader.js ispred "tema-chata.js" stavi #.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxTemaChata) return;   // zaštita ako se modul učita dvaput
  window.__mxTemaChata = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_TEMA_POSTAVKE = {
    boje: {                       // uvijek u obliku #rrggbb
      podloga:       '#0a0c12',   // najdublja, malo hladna crna: veo preko mramora, tama na dnu
      navy:          '#1a2542',   // tamnoplavi strop poslovnice (svjetlo odozgo)
      navyZid:       '#162246',   // tamnoplavi zid poslovnice (dolje lijevo)
      navyTama:      '#0d1426',   // tamnoplava sjena stropa: tama na vrhu prozora, iza zaglavlja
      staklo:        '#121624',   // dimljeno staklo, malo ohlađeno prema tamnoplavoj
      dimljeno:      '#111114',   // tamno staklo malih gumba (zaglavlje, "Odustani", gumb kartice)
      zlato:         '#c8a35a',   // brušeno zlato / mesing (slovo M, letvica pulta): rubovi, crte
      zlatoSvijetlo: '#ecd9ae',   // odsjaj na zlatu: slova pilula, podnaslovi, cijena
      zlatoTamno:    '#ae8c48',   // sjena na brušenom mesingu
      mesing:        '#d7bb7b',   // sredina brušenog mesinga (glavni gumbi, pilula pod mišem)
      marka:         '#d4b27a',   // marka parfema na kartici proizvoda
      svjetlo:       '#f0d49a',   // toplo svjetlo osvijetljene police (vitrina bočice)
      bjelokost:     '#f3f1ec',   // tekst (topla bijela, kao Calacatta mramor)
      tih:           '#bdbab4',   // prigušeni tekst (opisi, napomena ispod polja, placeholder)
      mramor:        '#f6f4ef',   // bijeli Calacatta: kupčeve poruke
      tinta:         '#1b1a18',   // tamni tekst na bijelom mramoru i na mesingu
      napomenaNaPodu: '#3d3a35',  // napomena ispod polja, na bijelom mramornom podu
      vitrina:       '#fbfaf7',   // vitrina bočice kad fotografiju nije moguće obraditi (gotovo bijela, jednolična)
      led:           '#eef3ff'    // tanka bijela svjetlosna linija (samo na početnom ekranu)
    },

    // Teksture mramora iz mape mramor/ ('' = bez teksture, samo boja)
    mramor: {
      crni: 'mramor/crni.webp',       // pozadina, zaglavlje, ploče, "POČETAK", gumb chata
      crni2x: 'mramor/crni-2x.webp',  // isti mramor u dvostrukoj razlučivosti (mobiteli, oštri zasloni)
      bijeli: 'mramor/bijeli.webp',   // kupčeve poruke, pod ispod polja za poruku, vitrina bočice
      zatamnjenje: .22,               // 0–1: opći veo preko crnog mramora (manje = zlatne žile sjajnije)
      tamaIzaPoruka: .55,             // 0–1: dodatna tama iza stupca poruka (rubovi ostaju svijetli)
      tamaIspodZaglavlja: .4          // 0–1: tama iza poruka odmah ispod zaglavlja (tuda prolazi zlatni pojas)
    },

    // Fontovi iz mape fonts/ (učitavaju ih i ostali moduli)
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',
    fontNaslova: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    podnaslovZaglavlja: 'AI beauty savjetnik',   // ispod imena u zaglavlju ('' = bez)

    // Voiceflowovi engleski tekstovi ('' = ostaje Voiceflowov tekst)
    tekstovi: {
      noviRazgovor: 'Započni novi razgovor',     // "Start new chat"
      odustani: 'Odustani',                      // "Cancel"
      razgovorZavrsen: 'Razgovor je završen'     // "Chat has ended"
    },

    zamucenje: 22,            // px: koliko staklo polja za poruku zamuti ono iza sebe
    pokretPozadine: 40,       // sekundi za jedan prolaz svjetla preko mramora (0 = svjetlo miruje)
    odsjaj: .5,               // 0–1: jačina svjetla koje klizi preko mramora (žile zasvjetlucaju); 0 = bez
    ledLinija: true,          // meki odsjaj LED trake uz desni rub početnog ekrana, samo na računalu (false = bez)
    bijeliPod: true,          // pod od bijelog mramora sa mesinganom letvicom ispod polja za poruku (false = bez)
    pocetniEkran: true,       // false → početni ekran ostaje kakav je bio
    gumbChata: true           // false → gumb chata u kutu ostaje kakav je bio
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX_TEMA = (function () {
    'use strict';

    const P = MX_TEMA_POSTAVKE;
    const B = P.boje;
    const M = P.mramor || {};
    const T = P.tekstovi || {};
    const HOST = 'voiceflow-chat';        // element u čiji shadow DOM Voiceflow crta chat
    // adresa mape u kojoj je ova skripta (GitHub Pages) — odatle se učitavaju fontovi i mramor
    const BAZA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/tema-chata.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + (+a.toFixed(3)) + ')'; }
    // jednolični sloj boje (veo preko slike mramora)
    function veo(hex, a) { return 'linear-gradient(' + prozirna(hex, a) + ', ' + prozirna(hex, a) + ')'; }
    // slika iz mape ove skripte za CSS (npr. mramor) ili "none"
    function slika(put) { return put ? 'url("' + BAZA + String(put).replace(/"/g, '%22') + '")' : 'none'; }
    // tekst za CSS content: "..."
    function tekst(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\A ') + '"'; }
    function izmedju(x, od, doo) { x = +x; return isNaN(x) ? od : Math.min(doo, Math.max(od, x)); }

    const BLUR = Math.max(0, +P.zamucenje || 0);
    const POKRET = +P.pokretPozadine > 0 ? Math.max(12, +P.pokretPozadine) + 's' : '';
    const ODSJAJ = izmedju(P.odsjaj, 0, 1);
    const ZATAMNJENJE = izmedju(M.zatamnjenje, 0, 1);
    const TAMA = izmedju(M.tamaIzaPoruka, 0, 1);
    const TAMA_VRH = izmedju(M.tamaIspodZaglavlja, 0, 1);
    const CRNI = slika(M.crni);
    // mramor u dvostrukoj razlučivosti: preglednik sam bira prema gustoći piksela zaslona
    const CRNI_SET = M.crni && M.crni2x ? 'image-set(' + CRNI + ' 1x, ' + slika(M.crni2x) + ' 2x)' : '';
    const BIJELI = slika(M.bijeli);

    // ── STIL ─────────────────────────────────────────────────────────────
    // Svi selektori počinju s ":host .vfrc-widget", pa su jači od
    // Voiceflowovih (i kad Voiceflow svoj stil učita poslije ovoga).
    const W = ':host .vfrc-widget';
    // dijelovi prozora koji nemaju službenu klasu, nađeni po rasporedu
    const PROZOR = W + ' .vfrc-chat';
    const ZAGLAVLJE = PROZOR + ' > .vfrc-header';
    const PORUKE = PROZOR + ' > div:has(> .vfrc-chat-dialog)';             // dio koji se pomiče (poruke)
    const RED_UNOSA = W + ' .vfrc-footer > div:has(> .vfrc-input-container)';
    const NAPOMENA = RED_UNOSA + ' > .vfrc-input-container ~ div';          // "Powered by...", upozorenje o AI-ju
    const PLOCA_POCETKA = W + ' .vfrc-footer > div:has(> #vfrc-start-chat)';
    const KORISNIK = W + ' .vfrc-user-response > div';
    const MARTI = W + ' .vfrc-system-response .vfrc-message:not([class*="vfrc-message--extension"])';
    const TIPKA = W + ' div:has(> .vfrc-typing-indicator)';
    const POSALJI = W + ' #vfrc-send-message';
    const PRAZNO = W + ' .vfrc-input-container:has(.vfrc-chat-input:placeholder-shown) #vfrc-send-message';   // gumb za slanje dok je polje prazno
    const IKONA_GUMBA = W + ' .vfrc-launcher img[src*="/widget-next/message.png"]';   // bočica iz gumb-chata.js

    const VISINA_ZAGLAVLJA = 58;          // px, mramorna kapsula gore
    const RUB_ZAGLAVLJA = 10;             // px od ruba prozora
    const ISPOD_DNA = 84;                 // px: koliko se poruke protežu ispod polja za poruku (najviše visina dna)

    // tanki rub stakla (svjetlo odozgo slijeva): prsten iz maske
    const RUB = `
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        padding: 1px;
        border-radius: inherit;
        background: var(--mx-t-rub);
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
                mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
        pointer-events: none;`;

    // komad crnog mramora: sjaj poliranog kamena odozgo, slojevi tame
    // (od gornjeg prema donjem) i kamen. polozaj: CSS background-position
    // slike, sirina: koliko je široka cijela slika mramora (broj = px, ili
    // CSS duljina, npr. 'max(620px, calc(100% + 73px))' da kamen pokrije
    // i širi element)
    function crniMramor(polozaj, sirina, tama) {
      return 'linear-gradient(180deg, rgba(255, 255, 255, .13) 0%, rgba(255, 255, 255, .035) 46%, rgba(255, 255, 255, 0) 54%, rgba(255, 255, 255, .03) 100%), ' +
        [].concat(tama || []).join(', ') + (tama ? ', ' : '') +
        'var(--mx-t-mramor-crni) ' + polozaj + ' / ' + (typeof sirina === 'number' ? sirina + 'px' : sirina) + ' auto no-repeat, ' + B.podloga;
    }

    const CSS = `
      :host {
        --mx-t-podloga: ${B.podloga};
        --mx-t-podloga-0: ${prozirna(B.podloga, 0)};
        --mx-t-podloga-60: ${prozirna(B.podloga, .6)};
        --mx-t-podloga-90: ${prozirna(B.podloga, .9)};
        --mx-t-bjelokost: ${B.bjelokost};
        --mx-t-tih: ${B.tih};
        --mx-t-tinta: ${B.tinta};
        --mx-t-zlato: ${B.zlato};
        --mx-t-zlato-svijetlo: ${B.zlatoSvijetlo};
        --mx-t-zlato-70: ${prozirna(B.zlato, .7)};
        --mx-t-zlato-50: ${prozirna(B.zlato, .5)};
        --mx-t-zlato-35: ${prozirna(B.zlato, .35)};
        --mx-t-zlato-30: ${prozirna(B.zlato, .3)};
        --mx-t-zlato-16: ${prozirna(B.zlato, .16)};
        --mx-t-font: ${P.font};
        --mx-t-font-naslova: ${P.fontNaslova};
        --mx-t-mramor-crni: ${CRNI};
        --mx-t-mramor-bijeli: ${BIJELI};
        --mx-t-mramor: ${B.mramor};
        --mx-t-veo: ${prozirna(B.podloga, ZATAMNJENJE)};          /* opći veo preko crnog mramora */
        --mx-t-tama: ${prozirna(B.podloga, TAMA)};                /* tama iza stupca poruka */
        --mx-t-tama-pola: ${prozirna(B.podloga, TAMA * .72)};
        --mx-t-tama-vrh: ${prozirna(B.podloga, TAMA_VRH)};
        /* staklo: bjelkasti veo, jači gore lijevo (odakle pada svjetlo), preko dimljene tame */
        --mx-t-staklo: linear-gradient(155deg, rgba(255, 255, 255, .11) 0%, rgba(255, 255, 255, .04) 46%, rgba(255, 255, 255, .06) 100%);
        --mx-t-staklo-tamno: ${prozirna(B.staklo, .8)};            /* polje za poruku */
        --mx-t-pilula: ${prozirna(B.staklo, .66)};                 /* ponuđeni odgovori */
        --mx-t-kartica: ${prozirna(B.staklo, .78)};                /* kartica proizvoda */
        --mx-t-dimljeno-60: ${prozirna(B.dimljeno, .6)};           /* "Odustani" */
        --mx-t-dimljeno-45: ${prozirna(B.dimljeno, .45)};          /* gumb na kartici proizvoda */
        /* Martini oblačići: hladno dimljeno staklo s odsjajem gore lijevo, malo
           svjetlije od kamena iza sebe, pa se jasno odvoji od pozadine */
        --mx-t-oblacic:
          linear-gradient(135deg, rgba(255, 255, 255, .07) 0%, rgba(255, 255, 255, 0) 45%),
          linear-gradient(rgba(255, 255, 255, .1), rgba(255, 255, 255, .1)),
          ${prozirna(B.staklo, .68)};
        /* rub stakla: bijeli odsjaj gore lijevo, zlato dolje desno */
        --mx-t-rub: linear-gradient(150deg, rgba(255, 255, 255, .5) 0%, rgba(255, 255, 255, .14) 28%, ${prozirna(B.zlato, .14)} 56%, ${prozirna(B.zlato, .55)} 100%);
        /* tanki rub od brušenog zlata: svjetliji gdje pada svjetlo */
        --mx-t-rub-zlato: linear-gradient(150deg, ${prozirna(B.zlatoSvijetlo, .95)} 0%, ${prozirna(B.zlato, .6)} 26%, ${prozirna(B.zlato, .3)} 58%, ${prozirna(B.zlatoSvijetlo, .75)} 100%);
        /* brušeni mesing: odsjaj odozgo, fine vodoravne crtice brušenja i prelijevanje metala */
        --mx-t-mesing:
          linear-gradient(174deg, rgba(255, 255, 255, .34) 0%, rgba(255, 255, 255, 0) 46%),
          repeating-linear-gradient(180deg, rgba(255, 255, 255, .08) 0 1px, rgba(255, 255, 255, 0) 1px 2px, rgba(60, 42, 10, .05) 2px 3px),
          linear-gradient(162deg, ${B.zlatoSvijetlo} 0%, ${B.mesing} 40%, ${B.zlato} 76%, ${B.zlatoTamno} 100%);
        /* bijeli mramor pod mliječnim staklom (žile su tihe, tamni tekst je lako čitljiv) */
        --mx-t-mlijecno: linear-gradient(155deg, rgba(255, 255, 255, .7) 0%, ${prozirna(B.mramor, .52)} 48%, ${prozirna(B.mramor, .62)} 100%);
        --mx-t-odsjaj: inset 0 1px 0 rgba(255, 255, 255, .12);
        --mx-t-sjena: 0 14px 34px -18px rgba(0, 0, 0, .85), 0 2px 6px -2px rgba(0, 0, 0, .3);
        --mx-t-zamucenje: blur(${BLUR}px) saturate(140%);
        --mx-t-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-t-meko: cubic-bezier(.45, 0, .2, 1);
      }
      ${CRNI_SET ? `
      @supports (background-image: image-set(url("x.webp") 1x)) {
        :host { --mx-t-mramor-crni: ${CRNI_SET}; }
      }` : ''}

      /* ═══ PROZOR: crni Portoro mramor pod tamnoplavim stropom ═══ */
      /* slojevi odozgo: tamnoplavo svjetlo stropa i zida (screen: tamni kamen
         poplavi, a zlatne žile ostanu zlatne), tama iza stupca poruka (i
         posebno odmah ispod zaglavlja, kuda prolazi zlatni pojas), opći veo,
         mramor (lighten: crni kamen poprimi tamnoplavu boju, žile ostanu
         čisto zlato), tamnoplavi strop i zid ispod kamena, podloga */
      ${PROZOR} {
        isolation: isolate;
        overflow: clip;                   /* svjetlo koje plovi preko ruba ne smije pomaknuti prozor (fokus, skrol) */
        background:
          radial-gradient(120% 46% at 50% 0%, ${prozirna(B.navy, .55)}, ${prozirna(B.navy, .2)} 50%, ${prozirna(B.navy, 0)}),
          radial-gradient(80% 32% at 0% 100%, ${prozirna(B.navyZid, .5)}, ${prozirna(B.navyZid, 0)}),
          radial-gradient(56% 62% at 50% 52%, var(--mx-t-tama) 0%, var(--mx-t-tama-pola) 52%, ${prozirna(B.podloga, 0)} 100%),
          radial-gradient(64% 130px at 46% calc(150px + env(safe-area-inset-top, 0px)), var(--mx-t-tama-vrh) 0%, var(--mx-t-tama-vrh) 60%, ${prozirna(B.podloga, 0)} 100%),
          linear-gradient(var(--mx-t-veo), var(--mx-t-veo)),
          var(--mx-t-mramor-crni) right -40px top -150px no-repeat,
          radial-gradient(120% 55% at 50% 0%, ${prozirna(B.navy, .9)}, ${prozirna(B.navy, .35)} 55%, ${prozirna(B.navy, 0)}),
          radial-gradient(90% 38% at 0% 100%, ${prozirna(B.navyZid, .7)}, ${prozirna(B.navyZid, 0)}),
          var(--mx-t-podloga);
        /* mramor je uvećan (žile su krupne i jasne): duga zlatna žila prolazi
           gornjim dijelom, druga se spušta uz desni rub, a treća se blago
           penje kroz donji dio, iznad polja za poruku; slika je uvijek bar
           40 px šira od prozora, pa pokrije i lijevi rub (tablet) */
        background-size: auto, auto, auto, auto, auto, max(calc(100% + 40px), 760px) auto, auto, auto;
        background-blend-mode: screen, screen, normal, normal, normal, lighten, normal, normal;
        color: var(--mx-t-bjelokost);
        border-radius: 28px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, .08), 0 40px 90px -30px rgba(4, 6, 14, .8), 0 16px 34px -18px rgba(0, 0, 0, .55);
        font-family: var(--mx-t-font);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      @media (max-width: 768px) {
        ${PROZOR} { border-radius: 0; }
      }

      ${ODSJAJ ? `
      /* svjetlo na poliranom kamenu: meki odsjaji polako klize preko mramora;
         "overlay" posvijetli samo ono što je već svijetlo (zlatne žile), a
         crni kamen ostaje crn, pa žile tiho zasvjetlucaju */
      ${PROZOR}::before {
        content: "";
        position: absolute;
        top: -30%; right: -30%; bottom: -30%; left: -30%;
        z-index: 0;
        background:
          radial-gradient(24% 16% at 30% 34%, rgba(255, 252, 244, ${ODSJAJ}), rgba(255, 252, 244, 0)),
          radial-gradient(22% 15% at 68% 64%, rgba(255, 252, 244, ${+(ODSJAJ * .85).toFixed(2)}), rgba(255, 252, 244, 0)),
          linear-gradient(118deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, ${+(ODSJAJ * .3).toFixed(2)}) 50%, rgba(255, 255, 255, 0) 60%);
        mix-blend-mode: overlay;
        pointer-events: none;
        ${POKRET ? `animation: mx-t-plovi ${POKRET} ease-in-out infinite alternate;` : ''}
      }` : ''}
      /* tama se zgusne na vrhu (tamnoplavo, kao strop u sjeni) i na dnu:
         poruke tiho nestaju ispod zaglavlja i polja za poruku; iznad
         kapsule zaglavlja tama je potpuna, da se kroz razmak ne vidi
         sadržaj koji klizi */
      ${PROZOR}::after {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 2;
        background:
          linear-gradient(180deg, ${B.navyTama} 0, ${B.navyTama} calc(${RUB_ZAGLAVLJA + 2}px + env(safe-area-inset-top, 0px)), ${prozirna(B.navyTama, .6)} calc(${VISINA_ZAGLAVLJA + RUB_ZAGLAVLJA}px + env(safe-area-inset-top, 0px)), ${prozirna(B.navyTama, 0)} calc(${VISINA_ZAGLAVLJA + RUB_ZAGLAVLJA + 34}px + env(safe-area-inset-top, 0px))),
          linear-gradient(0deg, var(--mx-t-podloga-90) 0, var(--mx-t-podloga-60) ${ISPOD_DNA - 30}px, var(--mx-t-podloga-0) ${ISPOD_DNA + 34}px);
        pointer-events: none;
      }
      /* stariji preglednik bez overflow: clip: svjetlo miruje unutar prozora */
      @supports not (overflow: clip) {
        ${PROZOR}::before { top: 0; right: 0; bottom: 0; left: 0; animation: none; }
      }
      @keyframes mx-t-plovi {
        0%   { transform: translate3d(-6%, -4%, 0) rotate(0deg); }
        50%  { transform: translate3d(4%, 5%, 0) rotate(5deg); }
        100% { transform: translate3d(8%, -3%, 0) rotate(-4deg); }
      }

      /* ═══ ZAGLAVLJE: plutajuća kapsula od crnog Portoro mramora pod dimljenim staklom ═══ */
      /* kapsula je neprozirna (kamen), pa se poruke koje klize ispod nje ne vide */
      ${ZAGLAVLJE} {
        position: relative;
        z-index: 3;
        flex: none;
        height: ${VISINA_ZAGLAVLJA}px;
        margin: calc(${RUB_ZAGLAVLJA}px + env(safe-area-inset-top, 0px)) ${RUB_ZAGLAVLJA}px 0;
        padding: 0 9px 0 9px;
        border-radius: 999px;
        background: ${crniMramor('right -73px top -243px', 'max(620px, calc(100% + 73px))', [
          `radial-gradient(42% 130% at 24% 50%, ${prozirna(B.podloga, .72)}, ${prozirna(B.podloga, 0)})`,
          `linear-gradient(90deg, ${prozirna(B.staklo, .62)} 0%, ${prozirna(B.staklo, .55)} 50%, ${prozirna(B.staklo, .3)} 78%, ${prozirna(B.staklo, .18)} 100%)`
        ])};
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .14), var(--mx-t-sjena);
      }
      ${ZAGLAVLJE}::before { ${RUB} background: var(--mx-t-rub-zlato); opacity: .85; }
      ${ZAGLAVLJE} > .vfrc-avatar {
        width: 40px;
        height: 40px;
        background-color: rgba(255, 255, 255, .06);
        box-shadow: 0 0 0 1px var(--mx-t-zlato-50), 0 0 18px -4px var(--mx-t-zlato-30);
      }
      ${ZAGLAVLJE} .vfrc-header--title {
        margin: 0 12px;
        font-family: var(--mx-t-font-naslova);
        font-size: 21px;
        font-weight: 600;
        line-height: 1.05;
        letter-spacing: .01em;
        color: var(--mx-t-bjelokost);
      }
      ${P.podnaslovZaglavlja ? `
      ${ZAGLAVLJE} .vfrc-header--title::after {
        content: ${tekst(P.podnaslovZaglavlja)};
        display: block;
        margin-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: var(--mx-t-font);
        font-size: 9.5px;
        font-weight: 400;
        line-height: 1.3;
        letter-spacing: .24em;
        text-transform: uppercase;
        color: var(--mx-t-zlato-svijetlo);
      }` : ''}
      ${ZAGLAVLJE} .vfrc-header--button {
        position: relative;
        width: 40px;
        height: 40px;
        padding: 9px;
        border-radius: 50%;
        color: var(--mx-t-bjelokost);
        background: ${prozirna(B.dimljeno, .55)};
        box-shadow: inset 0 0 0 1px var(--mx-t-zlato-35), inset 0 1px 0 rgba(255, 255, 255, .1);
        transition: background-color .3s var(--mx-t-meko), color .3s var(--mx-t-meko), transform .3s var(--mx-t-glatko);
      }
      ${ZAGLAVLJE} .vfrc-header--button:hover { color: var(--mx-t-zlato-svijetlo); background: ${prozirna(B.dimljeno, .75)}; }
      ${ZAGLAVLJE} .vfrc-header--button:active { transform: scale(.94); }
      ${ZAGLAVLJE} .vfrc-header--button:focus-visible { outline: 1px solid var(--mx-t-zlato); outline-offset: 2px; }

      /* ═══ PORUKE: klize ispod zaglavlja i ispod polja za poruku ═══ */
      ${PORUKE} {
        z-index: 1;
        margin: calc(-${VISINA_ZAGLAVLJA + RUB_ZAGLAVLJA}px - env(safe-area-inset-top, 0px)) 0 -${ISPOD_DNA}px;
        padding: calc(${VISINA_ZAGLAVLJA + RUB_ZAGLAVLJA + 14}px + env(safe-area-inset-top, 0px)) 18px ${ISPOD_DNA + 18}px;
      }

      /* uvod na vrhu razgovora: Marti i kratki opis, na tamnom velu (zlatne
         žile iza njega se utišaju); veo se meko ugasi prije rubova uvoda, da
         nema ravnog šava */
      ${W} .vfrc-assistant-info {
        position: relative;
        z-index: 0;
        padding: 26px 20px 18px;
        font-family: var(--mx-t-font);
      }
      ${W} .vfrc-assistant-info::before {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: -1;
        background: radial-gradient(70% 70% at 50% 58%, ${prozirna(B.podloga, .82)} 0%, ${prozirna(B.podloga, .68)} 60%, ${prozirna(B.podloga, .5)} 100%);
        -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent), linear-gradient(180deg, transparent, #000 16%, #000 84%, transparent);
        -webkit-mask-composite: source-in;
                mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent), linear-gradient(180deg, transparent, #000 16%, #000 84%, transparent);
                mask-composite: intersect;
        pointer-events: none;
      }
      ${W} .vfrc-assistant-info .vfrc-avatar {
        width: 76px;
        height: 76px;
        background-color: rgba(255, 255, 255, .06);
        box-shadow: 0 0 0 1px var(--mx-t-zlato-70), 0 0 0 6px ${prozirna(B.podloga, .6)}, 0 0 0 7px var(--mx-t-zlato-16), 0 0 46px -4px var(--mx-t-zlato-30);
      }
      ${W} .vfrc-assistant-info--title {
        margin-bottom: 4px;
        font-family: var(--mx-t-font-naslova);
        font-size: 30px;
        font-weight: 500;
        line-height: 1.15;
        letter-spacing: .01em;
        color: var(--mx-t-bjelokost);
      }
      ${W} .vfrc-assistant-info--description {
        font-size: 10.5px;
        font-weight: 400;
        line-height: 1.6;
        letter-spacing: .26em;
        text-transform: uppercase;
        color: var(--mx-t-zlato-svijetlo);
      }

      /* avatar uz Martine poruke */
      ${W} .vfrc-system-response > .vfrc-avatar {
        background-color: rgba(255, 255, 255, .06);
        box-shadow: 0 0 0 1px var(--mx-t-zlato-50);
      }

      /* Martina poruka: dimljeno staklo s dvobojnim rubom */
      ${MARTI} {
        position: relative;
        background: var(--mx-t-oblacic);
        color: var(--mx-t-bjelokost);
        border-radius: 20px 20px 20px 7px;
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
        font-family: var(--mx-t-font);
        font-size: 14.5px;
        font-weight: 300;
        line-height: 1.55;
        letter-spacing: .005em;
        animation: mx-t-pojava .7s var(--mx-t-glatko) backwards;
      }
      ${MARTI}::before { ${RUB} }
      ${MARTI} > .markdown { padding: 12px 17px 12px; }
      ${MARTI} strong, ${MARTI} b { font-weight: 500; color: var(--mx-t-zlato-svijetlo); }
      ${MARTI} a {
        color: var(--mx-t-zlato-svijetlo);
        text-decoration: underline;
        text-decoration-color: var(--mx-t-zlato-50);
        text-underline-offset: 3px;
        transition: color .2s ease, text-decoration-color .2s ease;
      }
      ${MARTI} a:hover { color: #fff; text-decoration-color: var(--mx-t-zlato-svijetlo); }
      ${MARTI} code { padding: 1px 5px; border-radius: 6px; background: rgba(255, 255, 255, .08); color: var(--mx-t-zlato-svijetlo); }
      ${MARTI} hr { border: 0; height: 1px; background: linear-gradient(90deg, var(--mx-t-zlato-16), var(--mx-t-zlato-50), var(--mx-t-zlato-16)); }
      ${MARTI} ul, ${MARTI} ol { padding-left: 1.25em; }
      ${MARTI} li::marker { color: var(--mx-t-zlato); }

      /* kupčeva poruka: bijeli Calacatta mramor pod mliječnim staklom, zlatni rub */
      ${KORISNIK} {
        position: relative;
        background: var(--mx-t-mlijecno), var(--mx-t-mramor-bijeli) 24% 46% / 420px auto, var(--mx-t-mramor);
        color: var(--mx-t-tinta);
        border-radius: 20px 20px 7px 20px;
        padding: 12px 17px 12px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .95), inset 0 -1px 0 rgba(0, 0, 0, .05), 0 14px 30px -16px rgba(0, 0, 0, .95), 0 2px 6px -2px rgba(0, 0, 0, .35);
        font-family: var(--mx-t-font);
        font-size: 14.5px;
        font-weight: 400;
        line-height: 1.5;
        letter-spacing: .005em;
        text-shadow: none;
        animation: mx-t-pojava-desno .6s var(--mx-t-glatko) backwards;
      }
      ${KORISNIK}::before { ${RUB} background: var(--mx-t-rub-zlato); }

      /* Marti tipka: tri zlatne točkice u tamnom staklu */
      ${TIPKA} {
        position: relative;
        background: var(--mx-t-oblacic);
        border-radius: 20px 20px 20px 7px;
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
      }
      ${TIPKA}::before { ${RUB} }
      ${W} .vfrc-typing-indicator > span {
        background-color: var(--mx-t-zlato-svijetlo);
        box-shadow: 0 0 8px var(--mx-t-zlato-70);
        animation-name: mx-t-tocka;       /* trajanje i zastoj točkica ostaju Voiceflowovi */
      }
      @keyframes mx-t-tocka {
        0%, 60%, 100% { opacity: .35; transform: scale(.85); }
        25%           { opacity: 1; transform: scale(1.15); }
      }

      /* ponuđeni odgovori: pilule od dimljenog stakla sa zlatnim rubom i zlatnim slovima */
      ${W} .vfrc-system-response--actions { gap: 8px; margin: 14px 0 6px; }
      ${W} .vfrc-system-response--actions .vfrc-button {
        position: relative;
        padding: 9px 17px 9px;
        border-radius: 999px;
        background: linear-gradient(155deg, rgba(255, 255, 255, .09), rgba(255, 255, 255, .02)), var(--mx-t-pilula);
        color: var(--mx-t-zlato-svijetlo);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .1), 0 8px 18px -12px rgba(0, 0, 0, .9);
        font-family: var(--mx-t-font);
        font-size: 13.5px;
        font-weight: 400;
        line-height: 18px;
        letter-spacing: .02em;
        transition: background .3s var(--mx-t-meko), box-shadow .3s var(--mx-t-meko), color .3s var(--mx-t-meko), transform .3s var(--mx-t-glatko);
      }
      ${W} .vfrc-system-response--actions .vfrc-button::before { ${RUB} background: var(--mx-t-rub-zlato); }
      ${W} .vfrc-system-response--actions .vfrc-button:hover {
        color: var(--mx-t-tinta);
        background: var(--mx-t-mesing);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .6), inset 0 -1px 0 ${prozirna(B.zlatoTamno, .45)}, 0 0 22px -6px var(--mx-t-zlato-70);
      }
      ${W} .vfrc-system-response--actions .vfrc-button:active { transform: scale(.97); }
      ${W} .vfrc-system-response--actions .vfrc-button:focus-visible { outline: 1px solid var(--mx-t-zlato); outline-offset: 3px; }

      /* Voiceflowove kartice i vrtuljak (ako ih Marti pošalje) */
      ${W} .vfrc-card {
        position: relative;
        background: var(--mx-t-oblacic);
        color: var(--mx-t-bjelokost);
        border-radius: 20px;
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
        overflow: hidden;
      }
      ${W} .vfrc-card::before { ${RUB} z-index: 1; background: var(--mx-t-rub-zlato); opacity: .7; }
      ${W} .vfrc-card--header { color: var(--mx-t-bjelokost); font-family: var(--mx-t-font-naslova); font-size: 18px; font-weight: 600; }
      ${W} .vfrc-card--content, ${W} .vfrc-card--description { color: var(--mx-t-tih); }
      ${W} .vfrc-card .vfrc-button { background: rgba(255, 255, 255, .05); color: var(--mx-t-zlato-svijetlo); border-radius: 999px; box-shadow: inset 0 0 0 1px var(--mx-t-zlato-50); }
      ${W} .vfrc-card .vfrc-button:hover { background: var(--mx-t-mesing); color: var(--mx-t-tinta); }
      ${W} .vfrc-image { border-radius: 18px; box-shadow: var(--mx-t-sjena); }
      ${W} .vfrc-timestamp { color: var(--mx-t-tih); font-size: 10.5px; letter-spacing: .06em; }
      ${W} .vfrc-feedback button { color: var(--mx-t-tih); }

      /* kraj razgovora: letvica od brušenog mesinga (kao na pultu) i natpis u sredini */
      ${W} .vfrc-chat--status { margin: 22px 0 8px; }
      ${W} .vfrc-chat--status > div > div:nth-child(odd) {
        height: 2px;
        border-radius: 1px;
        background: linear-gradient(90deg, ${prozirna(B.zlato, 0)}, ${B.zlatoTamno} 40%, ${B.mesing} 80%, ${B.zlatoSvijetlo});
        box-shadow: 0 0 8px var(--mx-t-zlato-30);
      }
      ${W} .vfrc-chat--status > div > div:last-child { background: linear-gradient(90deg, ${B.zlatoSvijetlo}, ${B.mesing} 20%, ${B.zlatoTamno} 60%, ${prozirna(B.zlato, 0)}); }
      ${W} .vfrc-chat--status > div > div:nth-child(2) {
        /* meka tama iza natpisa: zlatne žile iza njega se utišaju */
        background: ${prozirna(B.podloga, .5)};
        border-radius: 999px;
        box-shadow: 0 0 12px 8px ${prozirna(B.podloga, .5)};
        color: var(--mx-t-zlato-svijetlo);
        font-family: var(--mx-t-font);
        font-size: 10px;
        font-weight: 400;
        letter-spacing: .26em;
        text-transform: uppercase;
      }
      ${T.razgovorZavrsen ? `
      ${W} .vfrc-chat--status > div > div:nth-child(2) { font-size: 0; letter-spacing: 0; }
      ${W} .vfrc-chat--status > div > div:nth-child(2)::after {
        content: ${tekst(T.razgovorZavrsen)};
        font-size: 10px;
        letter-spacing: .26em;
        padding-left: .26em;
      }` : ''}

      /* ekstenzije (npr. kartica proizvoda): bez Voiceflowova sivog okvira */
      ${W} .vfrc-message[class*="vfrc-message--extension"] {
        display: block;
        width: 100%;
        padding: 0;
        background: transparent;
        color: var(--mx-t-bjelokost);
      }

      /* ═══ DNO: polje za poruku je staklena kapsula sa zlatnim rubom ═══ */
      ${W} .vfrc-footer {
        position: relative;
        z-index: 3;
        flex: none;
        padding-bottom: env(safe-area-inset-bottom, 0px);
        /* Voiceflowova ulazna animacija dna ostaje (pojava odozdo), ali ne
           zadržava zadnji kadar: dok traje (forwards), preglednik staklu
           polja ne da zamutiti poruke iza sebe */
        animation-fill-mode: none;
      }
      ${RED_UNOSA} { padding: 0 12px; background: none; }
      ${W} .vfrc-input-container {
        min-height: 54px;
        padding: 8px 8px 8px 20px;
        border: 0;
        border-radius: 27px;
        background: var(--mx-t-staklo), var(--mx-t-staklo-tamno);
        -webkit-backdrop-filter: var(--mx-t-zamucenje);
                backdrop-filter: var(--mx-t-zamucenje);
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
        transition: box-shadow .4s var(--mx-t-meko);
      }
      ${W} .vfrc-input-container::before { ${RUB} }
      ${W} .vfrc-input-container:hover { border: 0; }
      /* zlatni rub; fokus: zlato zasvijetli (Voiceflowov okvir fokusa) */
      ${W} .vfrc-input-container > div:first-child {
        border-radius: inherit;
        box-shadow: inset 0 0 0 1px var(--mx-t-zlato-50);
        transition: box-shadow .4s var(--mx-t-meko);
      }
      ${W} .vfrc-input-container:focus-within > div:first-child {
        box-shadow: inset 0 0 0 1px var(--mx-t-zlato-70), 0 0 26px -6px var(--mx-t-zlato-50);
      }
      ${W} .vfrc-chat-input {
        background: transparent;
        color: var(--mx-t-bjelokost);
        caret-color: var(--mx-t-zlato-svijetlo);
        font-family: var(--mx-t-font);
        font-weight: 300;
        line-height: 22px;
        letter-spacing: .01em;
      }
      ${W} .vfrc-chat-input::placeholder { color: var(--mx-t-tih); font-weight: 400; opacity: 1; }
      ${W} .vfrc-chat-input::selection { background: var(--mx-t-zlato-50); }
      /* ostali gumbi u polju (npr. mikrofon) */
      ${W} .vfrc-input-container button:not(#vfrc-send-message) {
        border-radius: 50%;
        color: var(--mx-t-tih);
        background: transparent;
      }
      ${W} .vfrc-input-container button:not(#vfrc-send-message):hover { color: var(--mx-t-zlato-svijetlo); background: rgba(255, 255, 255, .08); }

      /* gumb za slanje: kuglica od mesinga s tamnom strelicom; prazno polje → taman krug sa svijetlom strelicom */
      ${POSALJI} {
        position: relative;
        width: 38px;
        height: 38px;
        background: radial-gradient(circle at 34% 26%, #fff7e3 0%, #ecd3a0 30%, #b8935a 68%, #8d6c38 100%);
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, .8), inset 0 -2px 4px rgba(90, 60, 20, .35), 0 0 20px -4px var(--mx-t-zlato-70);
        transition: background .35s var(--mx-t-meko), box-shadow .35s var(--mx-t-meko), transform .35s var(--mx-t-glatko), opacity .35s var(--mx-t-meko);
      }
      ${POSALJI} svg { color: var(--mx-t-tinta); }
      ${POSALJI}:hover { cursor: pointer; transform: scale(1.06); background: radial-gradient(circle at 34% 26%, #fffaf0 0%, #f3e0b6 34%, #c8a35a 78%, #9a773f 100%); }
      ${POSALJI}:active { transform: scale(.94); }
      ${PRAZNO} {
        background: ${prozirna(B.dimljeno, .72)};
        box-shadow: inset 0 0 0 1px var(--mx-t-zlato-35), inset 0 1px 0 rgba(255, 255, 255, .08);
        transform: none;
        cursor: default;
      }
      ${PRAZNO} svg { color: #e9e5dd; }

      /* gumb "na dno razgovora" iznad polja (gusto staklo, bez zamućenja) */
      ${RED_UNOSA} > div:first-child button {
        border: 0;
        background: var(--mx-t-staklo), ${prozirna(B.staklo, .88)};
        color: var(--mx-t-zlato-svijetlo);
        box-shadow: inset 0 0 0 1px var(--mx-t-zlato-30), var(--mx-t-sjena);
      }

      /* napomena ispod polja ("Powered by...", upozorenje o AI-ju) */
      ${NAPOMENA} {
        padding: 9px 16px 11px;
        font-family: var(--mx-t-font);
        font-size: 10.5px;
        font-weight: 400;
        letter-spacing: .04em;
        color: var(--mx-t-tih);
      }
      ${NAPOMENA} a { color: inherit; }
      ${NAPOMENA} a:hover { color: var(--mx-t-zlato-svijetlo); text-decoration-color: var(--mx-t-zlato); }
      ${NAPOMENA} div:empty { background-color: ${prozirna(B.tih, .5)}; }
      ${P.bijeliPod ? `
      /* pod od bijelog Calacatta mramora ispod polja (kao u poslovnici: crni
         pult, mesingana letvica, bijeli pod); napomena stoji na njemu */
      ${NAPOMENA} {
        position: relative;
        z-index: 0;
        color: ${B.napomenaNaPodu};
      }
      ${NAPOMENA}::before {
        content: "";
        position: absolute;
        top: 0;
        right: -12px;
        bottom: calc(-1 * env(safe-area-inset-bottom, 0px));
        left: -12px;
        z-index: -1;
        background: var(--mx-t-mlijecno), var(--mx-t-mramor-bijeli) 30% 60% / 420px auto, var(--mx-t-mramor);
        box-shadow: inset 0 1.5px 0 ${B.mesing}, inset 0 3px 0 ${prozirna(B.zlatoTamno, .35)}, inset 0 6px 8px -4px rgba(60, 42, 10, .18);
        pointer-events: none;
      }
      ${NAPOMENA} a:hover { color: var(--mx-t-tinta); text-decoration-color: var(--mx-t-zlato); }
      ${NAPOMENA} div:empty { background-color: ${prozirna(B.napomenaNaPodu, .5)}; }` : ''}

      /* ═══ KRAJ RAZGOVORA I "NOVI RAZGOVOR?": crni mramor pod dimljenim staklom, zlatna letvica ═══ */
      ${PLOCA_POCETKA}, ${W} .vfrc-prompt {
        padding: 16px 16px calc(32px + env(safe-area-inset-bottom, 0px));
        border-radius: 26px 26px 0 0;
        background: ${crniMramor('left -160px top -999px', 'max(760px, calc(100% + 160px))', [
          `radial-gradient(72% 70% at 50% 58%, ${prozirna(B.podloga, .55)}, ${prozirna(B.podloga, 0)})`,
          veo(B.staklo, .4)
        ])};
        color: var(--mx-t-bjelokost);
        box-shadow: inset 0 1.5px 0 ${prozirna(B.zlatoSvijetlo, .9)}, inset 0 3px 0 ${prozirna(B.zlato, .3)}, 0 -20px 40px -22px rgba(0, 0, 0, .9);
      }
      ${W} .vfrc-chat--overlay { background-color: ${prozirna(B.podloga, .6)}; }
      ${W} #vfrc-start-chat,
      ${W} .vfrc-prompt .vfrc-button {
        position: relative;
        min-height: 46px;
        border-radius: 999px;
        font-family: var(--mx-t-font);
        font-size: 11.5px;
        font-weight: 500;
        letter-spacing: .24em;
        text-transform: uppercase;
        transition: background .35s var(--mx-t-meko), color .35s var(--mx-t-meko), transform .35s var(--mx-t-glatko), box-shadow .35s var(--mx-t-meko);
      }
      /* glavni gumb: brušeni mesing s tamnim slovima */
      ${W} #vfrc-start-chat,
      ${W} .vfrc-prompt .vfrc-button:first-child {
        background: var(--mx-t-mesing);
        color: var(--mx-t-tinta);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7), inset 0 -1px 0 ${prozirna(B.zlatoTamno, .45)}, 0 12px 28px -14px var(--mx-t-zlato-70);
      }
      ${W} #vfrc-start-chat:hover,
      ${W} .vfrc-prompt .vfrc-button:first-child:hover {
        background: linear-gradient(174deg, rgba(255, 255, 255, .3) 0%, rgba(255, 255, 255, .06) 50%), var(--mx-t-mesing);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .8), inset 0 -1px 0 ${prozirna(B.zlatoTamno, .45)}, 0 14px 32px -12px ${prozirna(B.zlato, .85)};
      }
      /* sporedni gumb: staklena pilula sa zlatnim rubom */
      ${W} .vfrc-prompt .vfrc-button:last-child:not(:first-child) {
        background: linear-gradient(155deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .02)), var(--mx-t-dimljeno-60);
        color: var(--mx-t-zlato-svijetlo);
        box-shadow: inset 0 0 0 1px var(--mx-t-zlato-70), inset 0 1px 0 rgba(255, 255, 255, .1);
      }
      /* pod mišem ostaje staklen (samo malo svjetliji), da se razlikuje od glavnog gumba */
      ${W} .vfrc-prompt .vfrc-button:last-child:not(:first-child):hover {
        background: linear-gradient(155deg, rgba(255, 255, 255, .14), rgba(255, 255, 255, .05)), var(--mx-t-dimljeno-60);
        color: var(--mx-t-zlato-svijetlo);
        box-shadow: inset 0 0 0 1px var(--mx-t-zlato), inset 0 1px 0 rgba(255, 255, 255, .14);
      }
      ${W} #vfrc-start-chat:active,
      ${W} .vfrc-prompt .vfrc-button:active { transform: scale(.98); }
      ${W} #vfrc-start-chat:focus-visible,
      ${W} .vfrc-prompt .vfrc-button:focus-visible { outline: 1px solid var(--mx-t-zlato-svijetlo); outline-offset: 3px; }
      ${T.noviRazgovor ? `
      ${W} #vfrc-start-chat,
      ${W} .vfrc-prompt .vfrc-button:first-child { font-size: 0; letter-spacing: 0; }
      ${W} #vfrc-start-chat::after,
      ${W} .vfrc-prompt .vfrc-button:first-child::after {
        content: ${tekst(T.noviRazgovor)};
        font-size: 11.5px;
        letter-spacing: .24em;
        padding-left: .24em;
      }` : ''}
      ${T.odustani ? `
      ${W} .vfrc-prompt .vfrc-button:last-child:not(:first-child) { font-size: 0; letter-spacing: 0; }
      ${W} .vfrc-prompt .vfrc-button:last-child:not(:first-child)::after {
        content: ${tekst(T.odustani)};
        font-size: 11.5px;
        letter-spacing: .24em;
        padding-left: .24em;
      }` : ''}

      /* ═══ KARTICA PROIZVODA (kartica-artikla.js): tamno staklo, dvostruki zlatni rub ═══ */
      ${W} .mx {
        --mx-tinta: ${B.bjelokost};
        --mx-dim: ${B.tih};
        --mx-roza: ${B.zlato};
        --mx-roza-45: ${prozirna(B.zlato, .45)};
        --mx-roza-75: ${prozirna(B.zlato, .75)};
        --mx-puder-88: ${prozirna(B.zlatoSvijetlo, .88)};
        --mx-kap: ${B.zlato};
        --mx-linija: ${prozirna(B.zlato, .34)};
        --mx-kartica: transparent;
        --mx-cijena: ${B.zlatoSvijetlo};
        --mx-rub-hover: ${prozirna(B.zlato, .7)};
        --mx-ikona: ${B.zlato};
      }
      ${W} .mx-kartica {
        background: var(--mx-t-staklo), var(--mx-t-kartica);
        border-color: ${prozirna(B.zlato, .42)};
        border-radius: 24px;
        box-shadow: var(--mx-t-odsjaj), 0 22px 44px -26px rgba(0, 0, 0, .9), 0 2px 8px -3px rgba(0, 0, 0, .35);
      }
      ${W} .mx-kartica::before { border-color: ${prozirna(B.zlato, .2)}; border-radius: 19px; }
      ${W} .mx-maglica { border-radius: 24px; }
      ${W} .mx-crta { background: linear-gradient(90deg, ${prozirna(B.zlato, 0)} 0%, ${prozirna(B.zlato, .55)} 25%, ${B.zlato} 50%, ${prozirna(B.zlato, .55)} 75%, ${prozirna(B.zlato, 0)} 100%); }
      /* vitrina: svijetla niša s tankim zlatnim okvirom u kojoj stoji bočica
         (fotografija i aura su napravljene za svijetlu podlogu). Dok fotografija
         nije obrađena, njezina bijela pozadina se stapa s vitrinom, pa je vitrina
         jednolično gotovo bijela; kad je obrađena, bočica stoji na bijelom
         mramoru, a odozgo je obasja toplo svjetlo police. Rubovi vitrine su u
         blagoj sjeni, da ne bljesne kao jarka pločica. */
      ${W} .mx-nisa {
        --mx-sjena: rgba(24, 24, 28, .28);
        --mx-aura: ${prozirna(B.svjetlo, .5)};
        --mx-aura-2: ${prozirna(B.vitrina, .95)};
      }
      ${W} .mx-izlog {
        border-radius: 15px;
        overflow: hidden;
        background: ${B.vitrina};
        box-shadow: 0 0 0 1px ${prozirna(B.zlato, .55)}, 0 0 0 4px ${prozirna(B.podloga, .55)}, 0 0 0 5px ${prozirna(B.zlato, .2)}, 0 12px 26px -16px rgba(0, 0, 0, .85);
      }
      ${W} .mx-izlog:has(> .mx-nisa.mx-prozirno) {
        background:
          radial-gradient(80% 42% at 50% 0%, ${prozirna(B.svjetlo, .18)}, ${prozirna(B.svjetlo, 0)}),
          linear-gradient(180deg, ${prozirna(B.vitrina, 1)} 0%, ${prozirna(B.vitrina, .9)} 62%, ${prozirna(B.vitrina, .7)} 100%),
          var(--mx-t-mramor-bijeli) 30% 70% / 300px auto repeat,
          ${B.vitrina};
      }
      /* obojeni oreol i sjaj iz fotografije su u vitrini tiši, da bijeli mramor ostane bijel */
      ${W} .mx-izlog > .mx-nisa.mx-prozirno .mx-aura-slika:not(.mx-aura-sjaj) { opacity: .25; }
      ${W} .mx-izlog > .mx-nisa.mx-prozirno .mx-aura-sjaj { opacity: .55; }
      ${W} .mx-izlog::after {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 3;
        border-radius: inherit;
        background: linear-gradient(180deg, ${prozirna(B.podloga, .01)} 0%, ${prozirna(B.podloga, 0)} 40%, ${prozirna(B.podloga, .03)} 100%);
        box-shadow: inset 0 0 24px ${prozirna(B.podloga, .06)}, inset 0 1px 0 rgba(255, 255, 255, .9), inset 0 -1px 0 ${prozirna(B.zlato, .35)};
        pointer-events: none;
      }
      ${W} .mx-naziv { color: var(--mx-t-bjelokost); font-size: 16px; }
      ${W} .mx-marka { color: ${B.marka}; }
      ${W} .mx-oznaka { background: var(--mx-t-mesing); color: var(--mx-t-tinta); }
      ${W} .mx-popust { background: var(--mx-t-mesing); color: var(--mx-t-tinta); }
      ${W} .mx-gumb {
        min-height: 34px;
        border-color: var(--mx-t-zlato-70);
        background: linear-gradient(155deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .02)), var(--mx-t-dimljeno-45);
        color: var(--mx-t-zlato-svijetlo);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .08);
      }
      ${W} .mx-gumb:focus-visible { outline-color: var(--mx-t-zlato); }
      ${W} .mx-gumb:active { background: var(--mx-t-mesing); color: var(--mx-t-tinta); border-color: var(--mx-t-zlato); }
      @media (hover: hover) {
        ${W} .mx-gumb:hover { background: var(--mx-t-mesing); color: var(--mx-t-tinta); border-color: var(--mx-t-zlato); }
      }

      ${P.pocetniEkran ? `
      /* ═══ POČETNI EKRAN (pocetna-chata.js) ═══ */
      /* zlato umjesto ružičastog zlata, neutralni sivi tonovi */
      ${W} .mx-p {
        --mx-p-puder: #f1ede4;
        --mx-p-bjelokost: ${B.bjelokost};
        --mx-p-rose: ${B.zlatoSvijetlo};
        --mx-p-rose-0: ${prozirna(B.zlato, 0)};
        --mx-p-rose-90: ${prozirna(B.zlato, .9)};
        --mx-p-rose-25: ${prozirna(B.zlato, .25)};
        --mx-p-sjaj-poziva: #fffaf0;
        --mx-p-opis: ${B.tih};
        --mx-p-zaglavlje: #d6d3cd;
        --mx-p-zlatni-sjaj: ${prozirna(B.zlato, .12)};
        --mx-p-zlatni-sjaj-0: ${prozirna(B.zlato, 0)};
        --mx-p-staklo: rgba(255, 255, 255, .08);
      }
      /* gore: tamnoplavo svjetlo stropa preko crnog Portoro mramora čije se
         zlatne žile vide samo u gornjem kutu (prema dolje se kamen ugasi, pa
         kugla ostaje na čistoj tami); iza natpisa MARTIMEX je kamen taman.
         "screen" samo posvjetljuje (crno ne mijenja ništa), pa točkice
         animacije ostaju iste */
      ${W} .mx-p::before {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 1;
        background:
          radial-gradient(120% 46% at 50% 0%, ${prozirna(B.navy, .85)}, ${prozirna(B.navy, 0)}),
          radial-gradient(70% 30% at 0% 100%, ${prozirna(B.navyZid, .5)}, ${prozirna(B.navyZid, 0)}),
          radial-gradient(84px 26px at 50% calc(env(safe-area-inset-top, 0px) + 32px), #000 45%, rgba(0, 0, 0, 0)),
          linear-gradient(180deg, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, .35) 9%, #000 22%),
          var(--mx-t-mramor-crni) right -60px top -140px / 520px auto no-repeat,
          #000;
        background-blend-mode: screen, screen, normal, normal, normal, normal;
        mix-blend-mode: screen;
        pointer-events: none;
      }
      ${P.ledLinija ? `
      /* meki odsjaj LED trake uz desni rub (samo na računalu; na mobitelu bi
         izgledao kao traka za pomicanje) */
      @media (min-width: 769px) {
        ${W} .mx-p::before {
          background:
            linear-gradient(270deg, ${prozirna(B.led, .2)} 0, ${prozirna(B.led, .07)} 3px, ${prozirna(B.led, 0)} 8px) right 0 top 0 / 8px 100% no-repeat,
            radial-gradient(120% 46% at 50% 0%, ${prozirna(B.navy, .85)}, ${prozirna(B.navy, 0)}),
            radial-gradient(70% 30% at 0% 100%, ${prozirna(B.navyZid, .5)}, ${prozirna(B.navyZid, 0)}),
            radial-gradient(84px 26px at 50% calc(env(safe-area-inset-top, 0px) + 32px), #000 45%, rgba(0, 0, 0, 0)),
            linear-gradient(180deg, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, .35) 9%, #000 22%),
            var(--mx-t-mramor-crni) right -60px top -140px / 520px auto no-repeat,
            #000;
          background-blend-mode: normal, screen, screen, normal, normal, normal, normal;
        }
      }` : ''}
      /* pojas zlatnih žila crnog Portoro mramora samo uz donji rub, oko
         "POČETAK" (maska ga ugasi prema gore, prije opisa) */
      ${W} .mx-p::after {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 1;
        background: var(--mx-t-mramor-crni) center bottom -130px / 140% auto no-repeat;
        -webkit-mask-image: linear-gradient(0deg, #000 0, rgba(0, 0, 0, .85) 40px, rgba(0, 0, 0, 0) 94px);
                mask-image: linear-gradient(0deg, #000 0, rgba(0, 0, 0, .85) 40px, rgba(0, 0, 0, 0) 94px);
        mix-blend-mode: screen;
        pointer-events: none;
      }
      ${W} .mx-p-zatvori {
        top: calc(env(safe-area-inset-top, 0px) + 12px);
        right: 12px;
        width: 40px;
        height: 40px;
        background: linear-gradient(155deg, rgba(255, 255, 255, .12), rgba(255, 255, 255, .04)), ${prozirna(B.staklo, .55)};
        box-shadow: var(--mx-t-odsjaj), inset 0 0 0 1px var(--mx-t-zlato-30);
      }
      ${W} .mx-p-zatvori:hover { background: linear-gradient(155deg, rgba(255, 255, 255, .18), rgba(255, 255, 255, .08)), ${prozirna(B.staklo, .55)}; }
      /* "POČETAK": pilula od crnog mramora sa zlatnim rubom i zlatnom letvicom,
         tiho diše zlatnim svjetlom (mijenja se samo prozirnost sjaja) */
      ${W} .mx-p-gumb {
        position: relative;
        isolation: isolate;
        padding: 16px 38px 15px;
        border-radius: 999px;
        background: ${crniMramor('left -204px top -99px', 'max(420px, calc(100% + 204px))', [
          `radial-gradient(64% 110% at 50% 45%, ${prozirna(B.podloga, .84)}, ${prozirna(B.podloga, .7)} 55%, ${prozirna(B.podloga, .2)})`
        ])};
        box-shadow: inset 0 -1.5px 0 ${prozirna(B.zlato, .95)}, 0 16px 34px -18px rgba(0, 0, 0, .9);
        transition: transform .4s var(--mx-t-glatko);
      }
      ${W} .mx-p-gumb::before { ${RUB} background: var(--mx-t-rub-zlato); }
      ${W} .mx-p-gumb::after {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: -1;
        border-radius: inherit;
        box-shadow: 0 0 28px 2px var(--mx-t-zlato-30);
        opacity: 0;
        pointer-events: none;
        animation: mx-t-disanje 2.6s ease-in-out infinite;
      }
      ${W} .mx-p-gumb:hover { transform: translateY(-1px); }
      ${W} .mx-p-gumb:active { transform: scale(.98); }
      ${W} .mx-p-gumb:focus-visible { outline-offset: 5px; border-radius: 999px; }
      ${W} .mx-p-gumb-crta { display: none; }
      ${W} .mx-p-gumb-tekst { font-size: 14px; }
      @keyframes mx-t-disanje {
        0%, 100% { opacity: 0; }
        50%      { opacity: 1; }
      }` : ''}

      ${P.gumbChata ? `
      /* ═══ GUMB CHATA U KUTU (gumb-chata.js): komadić crnog Portoro mramora ═══ */
      /* zlatna žila je uz donji rub, a iza natpisa je kamen taman */
      ${W} .vfrc-launcher {
        --mx-g-puder: ${B.zlatoSvijetlo};
        --mx-g-rub: ${prozirna(B.zlato, .8)};
        --mx-g-rub-sjaj: #fff3d6;
        --mx-g-magla: ${prozirna(B.zlatoSvijetlo, .55)};
        --mx-g-magla-2: ${prozirna(B.zlato, .2)};
        --mx-g-magla-0: ${prozirna(B.zlato, 0)};
        --mx-g-kap-sjena: ${prozirna(B.zlato, .9)};
        --mx-g-sjena: 0 1px 2px rgba(0, 0, 0, .2), 0 12px 24px -12px rgba(6, 8, 16, .6);
        --mx-g-sjena-gore: 0 2px 4px rgba(0, 0, 0, .18), 0 18px 30px -14px rgba(6, 8, 16, .7);
        background-color: ${B.podloga};
        background-image:
          linear-gradient(180deg, rgba(255, 255, 255, .16) 0%, rgba(255, 255, 255, .03) 48%, rgba(255, 255, 255, 0) 54%),
          linear-gradient(180deg, ${prozirna(B.podloga, .82)} 0%, ${prozirna(B.podloga, .78)} 64%, ${prozirna(B.podloga, .1)} 100%),
          var(--mx-t-mramor-crni);
        background-size: auto, auto, max(340px, calc(100% + 187px)) auto;
        background-position: 0 0, 0 0, left -187px bottom -420px;
        background-repeat: no-repeat;
        -webkit-backdrop-filter: none;
                backdrop-filter: none;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .2), var(--mx-g-sjena);
      }
      @media (hover: hover) and (pointer: fine) {
        ${W} .vfrc-launcher:hover { box-shadow: inset 0 1px 0 rgba(255, 255, 255, .26), var(--mx-g-sjena-gore); }
      }
      /* bočica: ružičasto zlato postane pravo zlato (mali filter, samo ikona) */
      ${IKONA_GUMBA} { filter: sepia(.7) saturate(1.5) hue-rotate(2deg) brightness(1.04); }` : ''}

      /* ═══ POJAVA PORUKA (samo prozirnost i pomak) ═══ */
      @keyframes mx-t-pojava {
        from { opacity: 0; transform: translateY(8px) scale(.98); }
        to   { opacity: 1; transform: none; }
      }
      @keyframes mx-t-pojava-desno {
        from { opacity: 0; transform: translate(6px, 6px) scale(.98); }
        to   { opacity: 1; transform: none; }
      }
      @keyframes mx-t-prozirnost {
        from { opacity: 0; }
      }

      /* preglednik bez zamućenja pozadine: staklo je gušće */
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        :host { --mx-t-staklo-tamno: ${prozirna(B.staklo, .9)}; }
      }
      /* "Smanji prozirnost": tamniji mramor, gušće staklo */
      @media (prefers-reduced-transparency: reduce) {
        :host {
          --mx-t-veo: ${prozirna(B.podloga, Math.max(ZATAMNJENJE, .6))};
          --mx-t-tama: ${prozirna(B.podloga, Math.max(TAMA, .7))};
          --mx-t-tama-pola: ${prozirna(B.podloga, Math.max(TAMA, .7) * .8)};
          --mx-t-staklo: linear-gradient(155deg, rgba(255, 255, 255, .12), rgba(255, 255, 255, .07));
          --mx-t-staklo-tamno: ${prozirna(B.staklo, .92)};
          --mx-t-oblacic: linear-gradient(155deg, rgba(255, 255, 255, .1), rgba(255, 255, 255, .06)), ${prozirna(B.staklo, .92)};
          --mx-t-mlijecno: linear-gradient(155deg, rgba(255, 255, 255, .85), ${prozirna(B.mramor, .8)});
          --mx-t-pilula: ${prozirna(B.staklo, .92)};
          --mx-t-kartica: ${prozirna(B.staklo, .92)};
          --mx-t-dimljeno-60: ${prozirna(B.dimljeno, .92)};
          --mx-t-dimljeno-45: ${prozirna(B.dimljeno, .92)};
          --mx-t-tama-vrh: ${prozirna(B.podloga, Math.max(TAMA_VRH, .6))};
        }
        ${PROZOR}::before { opacity: .4; }
      }
      /* "Smanji pokrete": svjetlo na mramoru miruje, poruke se samo tiho pojave */
      @media (prefers-reduced-motion: reduce) {
        ${PROZOR}::before { animation: none; }
        ${MARTI}, ${KORISNIK} { animation: mx-t-prozirnost .3s linear backwards; }
        ${W} .mx-p-gumb::after { animation: none; }
        ${W} .mx-p-gumb:hover { transform: none; }
        ${W} .vfrc-typing-indicator > span { animation: none; opacity: .8; }
        ${POSALJI}, ${POSALJI}:hover, ${POSALJI}:active,
        ${W} .vfrc-system-response--actions .vfrc-button:active,
        ${ZAGLAVLJE} .vfrc-header--button:active,
        ${W} .mx-p-gumb:active,
        ${W} #vfrc-start-chat:active,
        ${W} .vfrc-prompt .vfrc-button:active { transform: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-tema]');
      if (stari && stari.getAttribute('data-mx-tema') === '2') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-tema', '2');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // Fontove (Jost i Cormorant Garamond iz mape fonts/) inače učitavaju
    // kartica-artikla.js i pocetna-chata.js; ako su oba isključena, učitaju
    // se ovdje. Idu u <head> stranice: fontovi iz <head> vrijede i unutar
    // shadow roota.
    function ubaciFontove() {
      if (!document.head) return;
      const rasponi = {
        'latin': 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
        'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'
      };
      function dodaj(id, fontovi) {
        const stil = document.createElement('style');
        stil.id = id;
        stil.textContent = fontovi.map(function (f) {
          return Object.keys(rasponi).map(function (r) {
            return '@font-face{font-family:"' + f[0] + '";src:url("' + BAZA + 'fonts/' + f[1] + '-' + r + '.woff2") format("woff2");' +
              'font-weight:' + f[2] + ';font-style:normal;font-display:swap;unicode-range:' + rasponi[r] + '}';
          }).join('\n');
        }).join('\n');
        document.head.appendChild(stil);
      }
      // tanki Jost (300) za poruke; isti id kao u pocetna-chata.js, da se ne učita dvaput
      if (!document.getElementById('mx-pocetna-font-300')) dodaj('mx-pocetna-font-300', [['MX Jost', 'jost', '300']]);
      if (document.getElementById('mx-kartice-font') || document.getElementById('mx-pocetna-font') || document.getElementById('mx-tema-font')) return;
      dodaj('mx-tema-font', [['MX Jost', 'jost', '400 600'], ['MX Cormorant', 'cormorant-garamond', '500 700']]);
    }

    // Teksture mramora se počnu učitavati odmah (dok se chat još učitava),
    // pa su spremne kad se prozor prvi put otvori
    // (na zaslonu visoke razlučivosti crni mramor u dvostrukoj razlučivosti)
    function ucitajMramor() {
      const ostar = (window.devicePixelRatio || 1) > 1.5 && M.crni2x &&
        window.CSS && CSS.supports && CSS.supports('background-image', 'image-set(url("x.webp") 1x)');
      [ostar ? M.crni2x : M.crni, M.bijeli].forEach(function (put) {
        if (!put) return;
        const s = new Image();
        s.decoding = 'async';
        s.src = BAZA + put;
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
      ubaciFontove();
      ucitajMramor();
      cekajHost(function (host) { ubaciStil(host.shadowRoot); });
    }

    return { pokreni: pokreni };
  })();

  try { MX_TEMA.pokreni(); }
  catch (e) { console.warn('[Martimex] Izgled chata "Portoro" nije pokrenut:', e); }

})();
