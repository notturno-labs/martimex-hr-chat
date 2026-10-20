(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — izgled cijelog chata s Marti
  //
  //  Chat prati martimex.hr: čista bijela pozadina, crno i bijelo, a
  //  CRNI mramor sa zlatnim žilama je za detalje (kao u poslovnici).
  //  Gumbi, poruke, kartice i polje imaju oblik gumba sa stranice:
  //  pravokutnik s blago zaobljenim kutovima (KUT_GUMBA, KUT_PLOHE). Zlatom
  //  je napisan samo natpis MARTIMEX u zaglavlju; sva ostala slova su crna
  //  ili siva na bijelom, a bijela na crnom:
  //
  //   - pozadina razgovora je čista bijela; pri vrhu i dnu se poruke tiho
  //     gube ispod zaglavlja i polja za poruku
  //   - zaglavlje je traka preko cijele širine prozora, kao Voiceflowova
  //     (ista visina i položaj), od crnog mramora sa zlatnim žilama i jedva
  //     vidljivom toplom linijom na dnu; u sredini je samo natpis MARTIMEX
  //     zlatom, isti kao na početnom ekranu (bez Voiceflowove slike i
  //     naslova), a desno su Voiceflowovi gumbi kao svijetle ikone
  //   - Martine poruke su bijele, s tamnim tekstom, tihim rubom (bijeli
  //     odsjaj gore lijevo, tek dašak zlata dolje desno) i mekom sjenom.
  //     Takav diskretan rub imaju i svi gumbi, polje za poruku i kartica
  //     proizvoda (nigdje nema sjajnog zlatnog obruba)
  //   - kupčeve poruke su komadići crnog mramora sa zlatnom žilom i istim
  //     tihim rubom, s bijelim tekstom
  //   - crni mramor je svugdje zamućen (zaglavlje, kupčeve poruke, gumbi,
  //     gumb chata, početni ekran), pa je tekst preko njega miran i lako
  //     čitljiv
  //   - ponuđeni odgovori su bijeli gumbi; pod mišem postanu crni mramor s
  //     bijelim slovima
  //   - polje za poruku je bijelo; gumb za slanje je zlatan čim ima što
  //     poslati
  //   - kartica proizvoda (kartica-artikla.js) je bijela; bočica stoji ravno
  //     na kartici, bez okvira, kao u izvornoj kartici
  //   - kraj razgovora: tanke zlatne crte; ploča "Započni novi razgovor" je
  //     bijela, glavni gumb na njoj je crni mramor s bijelim slovima
  //   - prozor ima isti oblik i iste mjere kao Voiceflowov (zaobljeni kutovi
  //     16 px, na mobitelu preko cijelog ekrana); od bijele stranice ga
  //     odvaja meka sjena
  //   - početni ekran (pocetna-chata.js) zadrži sve svoje elemente; tekst
  //     je velik, u prvom planu i bijel, a od animacija je samo Xerjoff
  //     flakon koji se polako okreće (način "samo flakon"), manji i malo
  //     prigušen; pozadina je tihi crni mramor s prigušenim zlatnim žilama,
  //     mekano zamućen kao da je izvan fokusa (iza teksta i flakona tiho
  //     zatamnjen)
  //   - gumb chata u kutu stranice (gumb-chata.js) je komadić crnog mramora
  //     sa zlatnom žilom, tihim svijetlim rubom, bijelim natpisom i
  //     pozlaćenom bočicom
  //   - tekstovi koje Voiceflow piše engleski ("Start new chat", "Cancel",
  //     "Chat has ended") su na hrvatskom
  //
  //  Ako je na uređaju uključeno "Smanji pokrete", flakon stoji, a poruke se
  //  samo tiho pojave. Ako je uključeno "Smanji prozirnost", polje i ploča
  //  su neprozirni.
  //
  //  Učitavanje: velike slike mramora NE usporavaju webshop. Ne učitavaju
  //  se s ostatkom stranice, nego tek kad preglednik nakon učitavanja
  //  stranice miruje (oko 2 s), ili odmah kad kupac prijeđe mišem preko
  //  gumba chata, dotakne ga, dođe do njega tipkovnicom ili otvori chat
  //  (što bude prije). Do tada su na njihovom mjestu iste boje bez žila
  //  (prozor se ionako prije prvog otvaranja ne vidi); isto ostaje ako se
  //  slika ne učita. Gumb u kutu odmah koristi samo mali komadić crnog
  //  mramora (nekoliko KB).
  //
  //  Tehnički: kao i ostali moduli, ovaj samo ubaci svoj stil u shadow DOM
  //  elementa #voiceflow-chat i u chat ništa ne umeće. Oslanja se na
  //  Voiceflowove službene klase (.vfrc-chat, .vfrc-header, .vfrc-message,
  //  .vfrc-user-response, .vfrc-footer, .vfrc-input-container...) i na
  //  raspored elemenata oko njih, a ne na nasumična imena klasa koja
  //  Voiceflow mijenja sa svakom verzijom. Ako Voiceflow jednog dana
  //  promijeni prozor, dio izgleda izostane, a chat radi normalno.
  //  Teksture mramora su u mapi mramor/ (uz ovu skriptu); ako se ne
  //  učitaju, ostaju iste boje, bez žila.
  //  Isključi se tako da se u loader.js ispred "tema-chata.js" stavi #.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxTemaChata) return;   // zaštita ako se modul učita dvaput
  window.__mxTemaChata = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_TEMA_POSTAVKE = {
    boje: {                       // uvijek u obliku #rrggbb
      pozadina:      '#ffffff',   // pozadina razgovora: čista bijela, kao martimex.hr
      mlijeko:       '#fbfcfc',   // Martine poruke, ponuđeni odgovori, polje, ploče (gotovo bijelo)
      dim:           '#c9ced4',   // hladna siva: sjene i rubovi
      tinta:         '#16181c',   // tekst na svijetlom (gotovo crn, malo hladan)
      tih:           '#4d535b',   // prigušeni tekst (opisi, napomena ispod polja, placeholder)
      zlato:         '#c39a3e',   // metalno zlato žila: crte, točkice, gumb za slanje
      zlatoSvijetlo: '#f1d98f',   // odsjaj zlata: natpis MARTIMEX u zaglavlju (jedina zlatna slova)
      zlatoTamno:    '#8e6a1c',   // sjena zlata (dno gumba za slanje)
      crni:          '#0c0c0d',   // crni mramor dok se slika ne učita
      bjelokost:     '#f6f5f2',   // ikone na crnom mramoru
      naCrnom:       '#ffffff',   // slova na crnom mramoru (gumbi, kupčeve poruke, oznake)
      opisPocetne:   '#cdc3bb'    // opis na početnom ekranu (svjetliji od izvornog, da je tekst u prvom planu)
    },

    // Teksture crnog mramora iz mape mramor/ ('' = bez teksture, samo boja)
    mramor: {
      crni:     'mramor/crni.webp',       // početni ekran: tihi, mekano zamućen kamen (dovoljan i za oštre zaslone)
      crni2x:   '',                       // nije potreban: crni je zamućen, pa je oštar i u jednoj razlučivosti
      crniMali: 'mramor/crni-mali.webp',  // zamućeni komadić (8 KB) za sve ostalo: zaglavlje, kupčeve poruke, glavni
                                          // gumb, ponuđeni odgovor pod mišem, gumb chata (tekst preko njega je lako čitljiv)
      gustoca2x: 1.75,                    // od koje gustoće piksela zaslona se uzima slika "2x" (ako je zadana)
      cekaj: 2                            // s: koliko nakon učitavanja stranice (kad preglednik miruje) krenu slike
    },

    // Fontovi iz mape fonts/ (učitavaju ih i ostali moduli)
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',
    fontNaslova: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    // Natpis u zaglavlju prozora: isti kao na početnom ekranu (razmaknuta
    // velika slova), ali zlatom, umjesto Voiceflowove slike i naslova; piše
    // se velikim slovima ('' = ostaju Voiceflowova slika i naslov)
    zaglavlje: 'Martimex',

    // Voiceflowovi engleski tekstovi ('' = ostaje Voiceflowov tekst)
    tekstovi: {
      noviRazgovor: 'Započni novi razgovor',     // "Start new chat"
      odustani: 'Odustani',                      // "Cancel"
      razgovorZavrsen: 'Razgovor je završen'     // "Chat has ended"
    },

    zamucenje: 18,            // px: koliko polje za poruku i ploča zamute poruke iza sebe

    // početni ekran: pozadina od crnog mramora i samo Xerjoff flakon koji
    // se polako okreće (false → početni ekran ostaje kakav je bio)
    pocetniEkran: true,
    flakon: {
      brzina: .42,            // rad/s: koliko se brzo okreće (0.42 = jedan krug za oko 15 s)
      odsjaj: 7.5             // s: koliko često niz staklo prijeđe odsjaj (0 = bez)
    },
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
    const OZNAKA = 'data-mx-mramor';      // atribut na #voiceflow-chat: koje su slike mramora učitane ("crni")
    // adresa mape u kojoj je ova skripta (GitHub Pages) — odatle se učitavaju fontovi i mramor
    const BAZA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/tema-chata.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + (+(+a).toFixed(3)) + ')'; }
    // jednolični sloj boje (veo preko slike mramora)
    function veo(hex, a) { return 'linear-gradient(' + prozirna(hex, a) + ', ' + prozirna(hex, a) + ')'; }
    // slika iz mape ove skripte za CSS (npr. mramor) ili "none"
    function slika(put) { return put ? 'url("' + BAZA + String(put).replace(/"/g, '%22') + '")' : 'none'; }
    // tekst za CSS content: "..."
    function tekst(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\A ') + '"'; }
    function izmedju(x, od, doo) { x = +x; return isNaN(x) ? od : Math.min(doo, Math.max(od, x)); }

    const BLUR = Math.max(0, +P.zamucenje || 0);
    // zaslon visoke gustoće: slike "2x" (isti uvjet u CSS-u i pri predučitavanju)
    const GUSTO = '(min-resolution: ' + izmedju(M.gustoca2x || 1.75, 1.01, 4) + 'dppx), (-webkit-min-device-pixel-ratio: ' + izmedju(M.gustoca2x || 1.75, 1.01, 4) + ')';
    const MALI = slika(M.crniMali);       // mali komadić crnog mramora: izravno (ne kroz var(), da ga preglednik ne traži iznova)
    const OPIS_POCETNE = B.opisPocetne || '#a89d95';
    const BIJELA_POCETNE = '#f4ece6';     // slova početnog ekrana (kao prvi red naslova): umjesto ružičastog zlata

    // ── STIL ─────────────────────────────────────────────────────────────
    // Svi selektori počinju s ":host .vfrc-widget", pa su jači od
    // Voiceflowovih (i kad Voiceflow svoj stil učita poslije ovoga).
    const W = ':host .vfrc-widget';
    const UCITAN = function (ime) { return ':host([' + OZNAKA + '~="' + ime + '"])'; };   // ta slika mramora je učitana
    const WM = UCITAN('crni') + ' .vfrc-widget';                           // isto, ali tek kad je crni mramor učitan
    // dijelovi prozora koji nemaju službenu klasu, nađeni po rasporedu
    const PROZOR = W + ' .vfrc-chat';
    const ZAGLAVLJE = PROZOR + ' > .vfrc-header';
    const PORUKE = PROZOR + ' > div:has(> .vfrc-chat-dialog)';             // dio koji se pomiče (poruke)
    // dno: red s poljem za poruku je roditelj polja (bez obzira na omotače
    // oko njega, koje Voiceflow mijenja s verzijama)
    const RED_UNOSA = W + ' div:has(> .vfrc-input-container)';
    const OKO_POLJA = W + ' .vfrc-footer div:has(.vfrc-input-container)';  // svi omotači polja u dnu
    const NAPOMENA = RED_UNOSA + ' > .vfrc-input-container ~ div';          // "Powered by...", upozorenje o AI-ju
    const PLOCA_POCETKA = W + ' div:has(> #vfrc-start-chat)';
    const NA_DNO = W + ' .vfrc-footer button:not(.vfrc-button):not(.vfrc-input-container button)';   // gumb "na dno razgovora"
    const KORISNIK = W + ' .vfrc-user-response > div';
    const MARTI = W + ' .vfrc-system-response .vfrc-message:not([class*="vfrc-message--extension"])';
    const TIPKA = W + ' div:has(> .vfrc-typing-indicator)';
    const PILULA = W + ' .vfrc-system-response--actions .vfrc-button';
    const POSALJI = W + ' #vfrc-send-message';
    const PRAZNO = W + ' .vfrc-input-container:has(.vfrc-chat-input:placeholder-shown) #vfrc-send-message';   // gumb za slanje dok je polje prazno
    const GLAVNI = [W + ' #vfrc-start-chat', W + ' .vfrc-prompt .vfrc-button:first-child'];
    const SPOREDNI = W + ' .vfrc-prompt .vfrc-button:last-child:not(:first-child)';
    const IKONA_GUMBA = W + ' .vfrc-launcher img[src*="/widget-next/message.png"]';   // bočica iz gumb-chata.js
    // početni ekran u načinu "samo flakon" (raspored: veći tekst, manji flakon)
    const POCETNA = ':host .mx-p.mx-p-samo-flakon';
    // isto, s WebGL-om, kad je mramor učitan (pozadina)
    const POCETNA_M = WM + ' .mx-p.mx-p-samo-flakon:not(.mx-p-bez-gl)';

    const VISINA_ZAGLAVLJA = 56;          // px, mramorna traka gore (kao Voiceflowovo zaglavlje)
    const KUT_GUMBA = 4;                  // px: kutovi gumba, kao gumbi na martimex.hr (ponuđeni odgovori, "Pogledaj proizvod", gumbi na ploči, gumb chata)
    const KUT_PLOHE = 6;                  // px: kutovi poruka, kartica, polja za poruku i ploče
    const MALI_SIRINA = 630;              // px: koliko je širok zamućeni komadić crnog mramora na svakoj površini (pa je svugdje jednako zamućen)
    const ISPOD_DNA = 84;                 // px: koliko se poruke protežu ispod polja za poruku (najviše visina dna)
    const VELO_VRHA = 30;                 // px: koliko ispod zaglavlja se poruke još mekano gube u mlijeku
    const VELO_DNA = 34;                  // px: isto iznad polja za poruku
    const ISPOD_NAPOMENE = 30;            // px: red s napomenom ("Powered by") — tu se poruke koje klize više ne vide

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

    // komad crnog mramora: sjaj poliranog kamena odozgo, slojevi tame (od
    // gornjeg prema donjem), kamen i boja kamena ispod. polozaj: CSS
    // background-position slike; sirina: koliko je široka cijela slika
    // mramora (broj = px; ili cijeli CSS background-size, npr. '420px 56px'
    // da se žile spljošte); slika: url(...) ili zadano velika slika (varijabla)
    function crniMramor(polozaj, sirina, tama, slikaMramora) {
      return 'linear-gradient(180deg, rgba(255, 255, 255, .14) 0%, rgba(255, 255, 255, .04) 46%, rgba(255, 255, 255, 0) 54%, rgba(255, 255, 255, .03) 100%), ' +
        [].concat(tama || []).join(', ') + (tama ? ', ' : '') +
        (slikaMramora || 'var(--mx-t-mramor-crni)') + ' ' + polozaj + ' / ' + (typeof sirina === 'number' ? sirina + 'px auto' : sirina) + ' no-repeat, ' + B.crni;
    }
    // tama u sredini komada crnog mramora (iza teksta), prema rubovima slabi
    function tamaSredine(a, sirina, visina) {
      return 'radial-gradient(' + (sirina || '70%') + ' ' + (visina || '90%') + ' at 50% 50%, ' + prozirna(B.crni, a) + ', ' + prozirna(B.crni, a * .78) + ' 60%, ' + prozirna(B.crni, a * .3) + ')';
    }

    const CSS = `
      :host {
        --mx-t-magla-0: ${prozirna(B.pozadina, 0)};
        --mx-t-magla-60: ${prozirna(B.pozadina, .6)};
        --mx-t-magla-90: ${prozirna(B.pozadina, .9)};
        --mx-t-magla-97: ${prozirna(B.pozadina, .97)};
        --mx-t-na-crnom: ${B.naCrnom};
        --mx-t-tinta: ${B.tinta};
        --mx-t-tih: ${B.tih};
        --mx-t-zlato: ${B.zlato};
        --mx-t-zlato-70: ${prozirna(B.zlato, .7)};
        --mx-t-zlato-50: ${prozirna(B.zlato, .5)};
        --mx-t-zlato-30: ${prozirna(B.zlato, .3)};
        --mx-t-zlato-16: ${prozirna(B.zlato, .16)};
        --mx-t-zlato-svijetlo: ${B.zlatoSvijetlo};
        /* zlatna slova (natpis MARTIMEX u zaglavlju): metal, svjetliji gdje pada svjetlo */
        --mx-t-zlato-natpis: linear-gradient(100deg, ${B.zlato} 0%, ${B.zlatoSvijetlo} 28%, #d8b45e 50%, #f6e3a4 72%, ${B.zlato} 100%);
        --mx-t-crni: ${B.crni};
        --mx-t-bjelokost: ${B.bjelokost};
        --mx-t-font: ${P.font};
        --mx-t-font-naslova: ${P.fontNaslova};
        /* slika crnog mramora: dok se ne učita, nema je (ostaje boja kamena) */
        --mx-t-mramor-crni: none;
        /* mliječno staklo: gusto (tekst je uvijek čitljiv, i bez zamućenja), malo
           gušće gore lijevo, odakle pada svjetlo */
        --mx-t-staklo: linear-gradient(160deg, ${prozirna(B.mlijeko, .97)} 0%, ${prozirna(B.mlijeko, .9)} 55%, ${prozirna(B.mlijeko, .93)} 100%);
        /* staklo koje zamućuje ono iza sebe (polje za poruku, ploče) */
        --mx-t-staklo-ploca: linear-gradient(160deg, ${prozirna(B.mlijeko, .9)} 0%, ${prozirna(B.mlijeko, .78)} 55%, ${prozirna(B.mlijeko, .84)} 100%);
        /* odsjaj na vrhu stakla (svjetlo na zaobljenom rubu) */
        --mx-t-sjaj-stakla: linear-gradient(180deg, rgba(255, 255, 255, .9) 0, rgba(255, 255, 255, 0) 14px);
        /* rub stakla: bijelo svjetlo gore lijevo, hladni dim, dašak zlata dolje
           desno; isti tihi rub imaju Martine poruke, gumbi, pilule, polje i kartica */
        --mx-t-rub: linear-gradient(150deg, #fff 0%, rgba(255, 255, 255, .7) 24%, ${prozirna(B.dim, .9)} 52%, ${prozirna(B.zlato, .75)} 100%);
        /* isti rub na crnom mramoru: svijetli odsjaj gore lijevo, dašak zlata dolje desno */
        --mx-t-rub-tamni: linear-gradient(150deg, rgba(255, 255, 255, .32) 0%, rgba(255, 255, 255, .12) 30%, rgba(255, 255, 255, .05) 62%, ${prozirna(B.zlato, .4)} 100%);
        /* tanka hladna linija oko ruba (kao u sjeni stakla) */
        --mx-t-linija: 0 0 0 1px rgba(30, 38, 50, .1);
        /* metalno zlato (kao žile u mramoru): rubovi pilula, zaglavlja i kupčevih poruka */
        --mx-t-zlato-metal: linear-gradient(135deg, ${B.zlatoTamno} 0%, ${B.zlato} 20%, #f6e3a4 36%, ${B.zlato} 54%, #e6c46a 74%, ${B.zlatoTamno} 100%);
        --mx-t-odsjaj: inset 0 1px 0 #fff, inset 0 -1px 0 ${prozirna(B.dim, .45)};
        /* sjena stakla na kamenu: tanka hladna linija oko ruba + meka sjena ispod */
        --mx-t-sjena: var(--mx-t-linija), 0 12px 26px -14px rgba(30, 40, 56, .38), 0 2px 6px -2px rgba(30, 40, 56, .14);
        --mx-t-sjena-crni: 0 12px 26px -14px rgba(8, 10, 14, .6), 0 2px 6px -2px rgba(8, 10, 14, .3);
        --mx-t-linija-tamna: inset 0 0 0 1px rgba(255, 255, 255, .14);   /* tihi rub gumba na crnom */
        --mx-t-zamucenje: blur(${BLUR}px) saturate(130%);
        --mx-t-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-t-meko: cubic-bezier(.45, 0, .2, 1);
      }
      /* slika crnog mramora tek kad je učitana (vidi ucitajMramor); ako ne
         stigne, na njezinom mjestu ostaje boja kamena */
      ${UCITAN('crni')} { --mx-t-mramor-crni: ${slika(M.crni)}; }
      ${M.crni2x ? `@media ${GUSTO} { ${UCITAN('crni')} { --mx-t-mramor-crni: ${slika(M.crni2x)}; } }` : ''}

      /* ═══ PROZOR: čista bijela pozadina (oblik i mjere ostaju Voiceflowovi) ═══ */
      ${PROZOR} {
        isolation: isolate;
        overflow: clip;                   /* ništa što izađe preko ruba ne smije pomaknuti prozor (fokus, skrol) */
        background: ${B.pozadina};
        color: var(--mx-t-tinta);
        /* Voiceflowova tanka linija i meka sjena, malo jače (bijela stranica webshopa) */
        box-shadow: 0 0 0 1px rgba(22, 26, 30, .08), 0 8px 80px rgba(22, 26, 30, .2), 0 24px 48px -24px rgba(22, 26, 30, .32);
        font-family: var(--mx-t-font);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      /* pri vrhu i dnu se poruke tiho gube ispod zaglavlja i polja za poruku */
      ${PROZOR}::after {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 2;
        border-radius: inherit;
        background:
          linear-gradient(180deg, var(--mx-t-magla-60) calc(${VISINA_ZAGLAVLJA}px + env(safe-area-inset-top, 0px)), var(--mx-t-magla-0) calc(${VISINA_ZAGLAVLJA + VELO_VRHA}px + env(safe-area-inset-top, 0px))),
          linear-gradient(0deg, var(--mx-t-magla-97) 0, var(--mx-t-magla-90) ${ISPOD_DNA - 54}px, var(--mx-t-magla-60) ${ISPOD_DNA - 30}px, var(--mx-t-magla-0) ${ISPOD_DNA + VELO_DNA}px);
        pointer-events: none;
      }
      /* nizak prozor (npr. mobitel položen vodoravno): kraći prijelazi, više mjesta za poruke */
      @media (max-height: 520px) {
        ${PROZOR}::after {
          background:
            linear-gradient(180deg, var(--mx-t-magla-60) calc(${VISINA_ZAGLAVLJA}px + env(safe-area-inset-top, 0px)), var(--mx-t-magla-0) calc(${VISINA_ZAGLAVLJA + 14}px + env(safe-area-inset-top, 0px))),
            linear-gradient(0deg, var(--mx-t-magla-97) 0, var(--mx-t-magla-90) ${ISPOD_DNA - 54}px, var(--mx-t-magla-60) ${ISPOD_DNA - 30}px, var(--mx-t-magla-0) ${ISPOD_DNA + 6}px);
        }
      }

      /* ═══ ZAGLAVLJE: traka od crnog mramora preko cijele širine ═══ */
      /* isti oblik, visina i položaj kao Voiceflowova crna traka (gornje kutove
         zaobli prozor); kamen je zamućen i neproziran, pa se poruke koje klize
         ispod njega ne vide; zlatne žile prolaze lijevo i desno, a u sredini
         (iza natpisa) i iza gumba je kamen taman; na dnu je jedva vidljiva topla linija */
      ${ZAGLAVLJE} {
        position: relative;
        z-index: 3;
        flex: none;
        box-sizing: content-box;
        height: ${VISINA_ZAGLAVLJA}px;
        margin: 0;
        padding: env(safe-area-inset-top, 0px) 6px 0 14px;   /* desno: ikona X završava točno gdje i poruke (20 px od ruba) */
        border-radius: 0;
        background: ${crniMramor('left -120px top -88px', MALI_SIRINA, [
          `radial-gradient(30% 130% at 50% 50%, ${prozirna(B.crni, .86)}, ${prozirna(B.crni, .6)} 55%, ${prozirna(B.crni, 0)})`,
          `radial-gradient(22% 150% at 100% 50%, ${prozirna(B.crni, .7)}, ${prozirna(B.crni, 0)})`,
          veo(B.crni, .12)
        ], MALI)};
        box-shadow: inset 0 -1px 0 ${prozirna(B.zlato, .28)}, 0 8px 18px -12px rgba(8, 10, 14, .55);
      }
      ${P.zaglavlje ? `
      /* bez Voiceflowove slike i naslova: u sredini je samo natpis MARTIMEX,
         isti kao na početnom ekranu (Jost, 12 px, razmaknuta velika slova), ali
         zlatom; Voiceflowov naslov ostaje u kodu, pa ga čitači zaslona i dalje
         čitaju (natpis je samo ukras: "/ ''" ga skriva od njih) */
      ${ZAGLAVLJE} > .vfrc-avatar { display: none; }
      ${ZAGLAVLJE} .vfrc-header--title {
        margin: 0;
        font-size: 0;
        line-height: 0;
        color: transparent;
      }
      ${ZAGLAVLJE} .vfrc-header--title::after {
        content: ${tekst(P.zaglavlje)};
        content: ${tekst(P.zaglavlje)} / "";
        position: absolute;
        top: env(safe-area-inset-top, 0px);
        left: 50%;
        transform: translateX(-50%);
        padding-left: .42em;                  /* optički centrira razmaknuta slova (kao na početnom ekranu) */
        font-family: var(--mx-t-font);
        font-size: 12px;
        font-weight: 400;
        line-height: ${VISINA_ZAGLAVLJA}px;
        letter-spacing: .42em;
        text-transform: uppercase;
        white-space: nowrap;
        color: var(--mx-t-zlato-svijetlo);
        pointer-events: none;
      }
      @supports ((-webkit-background-clip: text) or (background-clip: text)) {
        ${ZAGLAVLJE} .vfrc-header--title::after {
          background: var(--mx-t-zlato-natpis);
          -webkit-background-clip: text;
                  background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }` : `
      ${ZAGLAVLJE} > .vfrc-avatar {
        width: 36px;
        height: 36px;
        background-color: ${B.crni};
        box-shadow: 0 0 0 1px rgba(255, 255, 255, .16);
      }
      ${ZAGLAVLJE} .vfrc-header--title {
        margin: 0 12px;
        font-family: var(--mx-t-font-naslova);
        font-size: 21px;
        font-weight: 600;
        line-height: 1.05;
        letter-spacing: .01em;
        color: var(--mx-t-bjelokost);
      }`}
      /* gumbi: samo svijetle ikone, bez kruga i obruba (iza njih je kamen
         taman); desni rub ikone X je poravnat s desnim rubom poruka */
      ${ZAGLAVLJE} .vfrc-header--button {
        position: relative;
        width: 38px;
        height: 38px;
        padding: 9px;
        border-radius: ${KUT_GUMBA}px;
        color: var(--mx-t-bjelokost);
        background: transparent;
        box-shadow: none;
        transition: background-color .3s var(--mx-t-meko), color .3s var(--mx-t-meko), transform .3s var(--mx-t-glatko);
      }
      ${ZAGLAVLJE} .vfrc-header--button:hover { color: var(--mx-t-na-crnom); background: rgba(255, 255, 255, .1); }
      ${ZAGLAVLJE} .vfrc-header--button:active { transform: scale(.94); }
      ${ZAGLAVLJE} .vfrc-header--button:focus-visible { outline: 1px solid var(--mx-t-na-crnom); outline-offset: 2px; }

      /* ═══ PORUKE: klize ispod zaglavlja i ispod polja za poruku ═══ */
      /* u redu s napomenom ("Powered by") se odrežu: tamo ih ne smije biti
         vidjeti ispod sitnih slova (raspored se time ne mijenja) */
      ${PORUKE} {
        z-index: 1;
        margin: calc(-${VISINA_ZAGLAVLJA}px - env(safe-area-inset-top, 0px)) 0 -${ISPOD_DNA}px;
        padding: calc(${VISINA_ZAGLAVLJA + 14}px + env(safe-area-inset-top, 0px)) 20px ${ISPOD_DNA + 18}px;   /* bočno kao Voiceflow (vrtuljak kartica računa s tim) */
        clip-path: inset(0 0 calc(${ISPOD_NAPOMENE}px + env(safe-area-inset-bottom, 0px)) 0);
      }

      /* uvod na vrhu razgovora: Marti i kratki opis */
      ${W} .vfrc-assistant-info {
        position: relative;
        z-index: 0;
        padding: 26px 20px 18px;
        font-family: var(--mx-t-font);
      }
      ${W} .vfrc-assistant-info .vfrc-avatar {
        width: 76px;
        height: 76px;
        background-color: ${B.crni};
        box-shadow: var(--mx-t-linija), 0 0 0 6px ${prozirna(B.mlijeko, .85)}, 0 0 0 7px rgba(30, 38, 50, .08), 0 18px 34px -14px rgba(20, 26, 36, .5);
      }
      ${W} .vfrc-assistant-info--title {
        margin-bottom: 4px;
        font-family: var(--mx-t-font-naslova);
        font-size: 30px;
        font-weight: 500;
        line-height: 1.15;
        letter-spacing: .01em;
        color: var(--mx-t-tinta);
      }
      ${W} .vfrc-assistant-info--description {
        font-size: 10.5px;
        font-weight: 500;
        line-height: 1.6;
        letter-spacing: .26em;
        text-transform: uppercase;
        color: var(--mx-t-tih);
      }

      /* avatar uz Martine poruke: crni krug s tankom linijom */
      ${W} .vfrc-system-response > .vfrc-avatar {
        background-color: ${B.crni};
        box-shadow: var(--mx-t-linija), 0 6px 14px -6px rgba(20, 26, 36, .5);
      }

      /* Martina poruka: bijela, s tihim dvobojnim rubom */
      ${MARTI} {
        position: relative;
        background: var(--mx-t-sjaj-stakla), var(--mx-t-staklo);
        color: var(--mx-t-tinta);
        border-radius: ${KUT_PLOHE}px;
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
        font-family: var(--mx-t-font);
        font-size: 14.5px;
        font-weight: 400;
        line-height: 1.55;
        letter-spacing: .005em;
        animation: mx-t-pojava .7s var(--mx-t-glatko) backwards;
      }
      ${MARTI}::before { ${RUB} }
      ${MARTI} > .markdown { padding: 12px 17px 12px; overflow-wrap: anywhere; }   /* duge poveznice se prelome u oblačiću */
      ${MARTI} strong, ${MARTI} b { font-weight: 600; color: var(--mx-t-tinta); }
      ${MARTI} a {
        color: var(--mx-t-tinta);
        text-decoration: underline;
        text-decoration-color: rgba(22, 24, 28, .35);
        text-underline-offset: 3px;
        transition: text-decoration-color .2s ease;
      }
      ${MARTI} a:hover { text-decoration-color: var(--mx-t-tinta); }
      ${MARTI} code { padding: 1px 5px; border-radius: ${KUT_GUMBA}px; background: rgba(30, 38, 50, .06); color: var(--mx-t-tinta); }
      ${MARTI} hr { border: 0; height: 1px; background: rgba(30, 38, 50, .14); }
      ${MARTI} ul, ${MARTI} ol { padding-left: 1.25em; }
      ${MARTI} li::marker { color: var(--mx-t-tih); }

      /* kupčeva poruka: komadić zamućenog crnog mramora sa zlatnom žilom koja
         prolazi desnim donjim kutom i tihim rubom (kao Martina); iza teksta je
         kamen taman u svakoj duljini poruke, a žila jače svijetli tek u
         razmaku ispod zadnjeg retka */
      ${KORISNIK} {
        position: relative;
        background: ${crniMramor('right -40px bottom -56px', MALI_SIRINA, [
          `linear-gradient(180deg, ${prozirna(B.crni, .76)} 0%, ${prozirna(B.crni, .72)} calc(100% - 12px), ${prozirna(B.crni, .3)} 100%)`
        ], MALI)};
        color: var(--mx-t-na-crnom);
        border-radius: ${KUT_PLOHE}px;
        padding: 12px 17px 12px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .16), var(--mx-t-sjena-crni);
        font-family: var(--mx-t-font);
        font-size: 14.5px;
        font-weight: 400;
        line-height: 1.5;
        letter-spacing: .005em;
        text-shadow: 0 1px 2px rgba(0, 0, 0, .6);
        animation: mx-t-pojava-desno .6s var(--mx-t-glatko) backwards;
      }
      ${KORISNIK}::before { ${RUB} background: var(--mx-t-rub-tamni); }

      /* Marti tipka: tri zlatne točkice u mliječnom staklu */
      ${TIPKA} {
        position: relative;
        background: var(--mx-t-sjaj-stakla), var(--mx-t-staklo);
        border-radius: ${KUT_PLOHE}px;
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
      }
      ${TIPKA}::before { ${RUB} }
      ${W} .vfrc-typing-indicator > span {
        background-color: ${B.zlatoTamno};
        box-shadow: 0 0 6px var(--mx-t-zlato-50);
        animation-name: mx-t-tocka;       /* trajanje i zastoj točkica ostaju Voiceflowovi */
      }
      @keyframes mx-t-tocka {
        0%, 60%, 100% { opacity: .35; transform: scale(.85); }
        25%           { opacity: 1; transform: scale(1.15); }
      }

      /* ponuđeni odgovori: bijeli gumbi blago zaobljenih kutova, s tihim
         rubom kao Martina poruka; pod mišem postanu crni mramor s bijelim slovima */
      ${W} .vfrc-system-response--actions { gap: 8px; margin: 14px 0 6px; }
      ${PILULA} {
        position: relative;
        padding: 9px 18px 9px;
        border-radius: ${KUT_GUMBA}px;
        background: linear-gradient(180deg, #fff 0%, ${B.mlijeko} 55%, #f1f3f5 100%);
        color: var(--mx-t-tinta);
        box-shadow: inset 0 1px 0 #fff, var(--mx-t-linija), 0 6px 14px -8px rgba(30, 40, 56, .45), 0 1px 2px rgba(30, 40, 56, .12);
        font-family: var(--mx-t-font);
        font-size: 13.5px;
        font-weight: 500;
        line-height: 18px;
        letter-spacing: .02em;
        transition: background .3s var(--mx-t-meko), box-shadow .3s var(--mx-t-meko), color .3s var(--mx-t-meko), transform .3s var(--mx-t-glatko);
      }
      ${PILULA}::before { ${RUB} }
      ${PILULA}:hover::before { background: var(--mx-t-rub-tamni); }
      ${PILULA}:hover {
        color: var(--mx-t-na-crnom);
        background: ${crniMramor('left -90px top -110px', MALI_SIRINA, [veo(B.crni, .45), tamaSredine(.62)], MALI)};
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .18), 0 10px 22px -12px rgba(8, 10, 14, .6);
      }
      ${PILULA}:active { transform: scale(.97); }
      ${PILULA}:focus-visible { outline: 1px solid var(--mx-t-tinta); outline-offset: 3px; }

      /* Voiceflowove kartice i vrtuljak (ako ih Marti pošalje) */
      ${W} .vfrc-card {
        position: relative;
        background: var(--mx-t-staklo);
        color: var(--mx-t-tinta);
        border-radius: ${KUT_PLOHE}px;
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
        overflow: hidden;
      }
      ${W} .vfrc-card::before { ${RUB} z-index: 1; }
      ${W} .vfrc-card--header { color: var(--mx-t-tinta); font-family: var(--mx-t-font-naslova); font-size: 18px; font-weight: 600; }
      ${W} .vfrc-card--content, ${W} .vfrc-card--description { color: var(--mx-t-tih); font-family: var(--mx-t-font); }
      ${W} .vfrc-card .vfrc-button { background: #fff; color: var(--mx-t-tinta); border-radius: ${KUT_GUMBA}px; box-shadow: inset 0 1px 0 #fff, var(--mx-t-linija); font-family: var(--mx-t-font); font-size: 13px; font-weight: 500; letter-spacing: .02em; }
      ${W} .vfrc-card .vfrc-button:hover { background: var(--mx-t-crni); color: var(--mx-t-na-crnom); }
      ${W} .vfrc-image { border-radius: ${KUT_PLOHE}px; box-shadow: var(--mx-t-sjena); }
      ${W} .vfrc-timestamp { color: var(--mx-t-tih); font-size: 10.5px; letter-spacing: .06em; }
      ${W} .vfrc-feedback button { color: var(--mx-t-tih); }

      /* kraj razgovora: tanke zlatne crte i sivi natpis između njih */
      ${W} .vfrc-chat--status { margin: 22px 0 8px; }
      ${W} .vfrc-chat--status > div > div:nth-child(odd) {
        height: 1px;
        background: linear-gradient(90deg, ${prozirna(B.zlato, 0)}, ${B.zlato} 70%, ${B.zlatoTamno});
      }
      ${W} .vfrc-chat--status > div > div:last-child { background: linear-gradient(90deg, ${B.zlatoTamno}, ${B.zlato} 30%, ${prozirna(B.zlato, 0)}); }
      ${W} .vfrc-chat--status > div > div:nth-child(2) {
        background: none;
        color: var(--mx-t-tih);
        font-family: var(--mx-t-font);
        font-size: 10px;
        font-weight: 500;
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
        color: var(--mx-t-tinta);
      }

      /* ═══ DNO: polje za poruku je bijelo, s tihim rubom ═══ */
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
      /* red s poljem i omotači oko njega: bez Voiceflowove bijele podloge (prekrila
         bi kamen i rub prozora); razmak od ruba prozora je samo na roditelju polja */
      ${OKO_POLJA} { padding-left: 0; padding-right: 0; background: none; }
      ${RED_UNOSA}, ${OKO_POLJA}:has(> .vfrc-input-container) { padding: 0 12px; background: none; }
      ${W} .vfrc-input-container {
        min-height: 54px;
        padding: 8px 8px 8px 18px;
        border: 0;
        border-radius: ${KUT_PLOHE}px;
        background: var(--mx-t-sjaj-stakla), var(--mx-t-staklo-ploca);
        -webkit-backdrop-filter: var(--mx-t-zamucenje);
                backdrop-filter: var(--mx-t-zamucenje);
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
        transition: box-shadow .4s var(--mx-t-meko);
      }
      ${W} .vfrc-input-container::before { ${RUB} }
      ${W} .vfrc-input-container:hover { border: 0; }
      /* fokus (Voiceflowov okvir, vidi se samo dok se piše): rub malo potamni */
      ${W} .vfrc-input-container > div:first-child {
        border-radius: inherit;
        box-shadow: inset 0 0 0 1px rgba(30, 38, 50, .1);
        transition: box-shadow .4s var(--mx-t-meko);
      }
      ${W} .vfrc-input-container:focus-within > div:first-child {
        box-shadow: inset 0 0 0 1px rgba(30, 38, 50, .2);
      }
      ${W} .vfrc-chat-input {
        background: transparent;
        color: var(--mx-t-tinta);
        caret-color: var(--mx-t-tinta);
        font-family: var(--mx-t-font);
        font-weight: 400;
        line-height: 22px;
        letter-spacing: .01em;
      }
      ${W} .vfrc-chat-input::placeholder { color: var(--mx-t-tih); opacity: 1; }
      ${W} .vfrc-chat-input::selection { background: var(--mx-t-zlato-30); }
      /* ostali gumbi u polju (npr. mikrofon) */
      ${W} .vfrc-input-container button:not(#vfrc-send-message) {
        border-radius: ${KUT_GUMBA}px;
        color: var(--mx-t-tih);
        background: transparent;
      }
      ${W} .vfrc-input-container button:not(#vfrc-send-message):hover { color: var(--mx-t-tinta); background: rgba(30, 38, 50, .06); }

      /* gumb za slanje: zlatan s tamnom strelicom; prazno polje → bijeli s
         tankom linijom i sivom strelicom */
      ${POSALJI} {
        position: relative;
        width: 38px;
        height: 38px;
        border-radius: ${KUT_GUMBA}px;
        background: radial-gradient(circle at 34% 26%, #fff8dc 0%, #f0d27e 30%, ${B.zlato} 66%, ${B.zlatoTamno} 100%);
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, .8), inset 0 -2px 4px rgba(90, 64, 10, .35), 0 6px 16px -6px ${prozirna(B.zlato, .9)};
        transition: background .35s var(--mx-t-meko), box-shadow .35s var(--mx-t-meko), transform .35s var(--mx-t-glatko), opacity .35s var(--mx-t-meko);
      }
      ${POSALJI} svg { color: var(--mx-t-tinta); }
      ${POSALJI}:hover { cursor: pointer; transform: scale(1.06); background: radial-gradient(circle at 34% 26%, #fffbea 0%, #f5dc94 34%, ${B.zlato} 76%, ${B.zlatoTamno} 100%); }
      ${POSALJI}:active { transform: scale(.94); }
      ${PRAZNO} {
        background: linear-gradient(180deg, #fff, #eef0f2);
        box-shadow: inset 0 0 0 1px rgba(30, 38, 50, .12), 0 2px 6px -3px rgba(30, 40, 56, .3);
        transform: none;
        cursor: default;
      }
      ${PRAZNO} svg { color: var(--mx-t-tih); }

      /* gumb "na dno razgovora" iznad polja (gusto staklo) */
      ${NA_DNO} {
        border: 0;
        border-radius: ${KUT_GUMBA}px;
        background: var(--mx-t-staklo);
        color: var(--mx-t-tinta);
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-sjena);
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
      ${NAPOMENA} a:hover { color: var(--mx-t-tinta); text-decoration-color: var(--mx-t-zlato); }

      /* ═══ KRAJ RAZGOVORA I "NOVI RAZGOVOR?": bijela ploča ═══ */
      ${PLOCA_POCETKA}, ${W} .vfrc-prompt {
        padding: 16px 16px calc(32px + env(safe-area-inset-bottom, 0px));
        border-radius: ${KUT_PLOHE}px ${KUT_PLOHE}px 0 0;
        background: var(--mx-t-staklo-ploca);
        -webkit-backdrop-filter: var(--mx-t-zamucenje);
                backdrop-filter: var(--mx-t-zamucenje);
        box-shadow: inset 0 1px 0 #fff, var(--mx-t-linija), 0 -18px 36px -22px rgba(30, 40, 56, .4);
      }
      ${W} .vfrc-chat--overlay { background-color: rgba(22, 26, 32, .16); }
      ${GLAVNI.join(',\n      ')},
      ${W} .vfrc-prompt .vfrc-button {
        position: relative;
        min-height: 46px;
        border-radius: ${KUT_GUMBA}px;
        font-family: var(--mx-t-font);
        font-size: 11.5px;
        font-weight: 500;
        letter-spacing: .24em;
        text-transform: uppercase;
        transition: background .35s var(--mx-t-meko), color .35s var(--mx-t-meko), transform .35s var(--mx-t-glatko), box-shadow .35s var(--mx-t-meko);
      }
      /* glavni gumb: zamućeni crni mramor sa zlatnim žilama prema krajevima i bijelim slovima */
      ${GLAVNI.join(',\n      ')} {
        background: ${crniMramor('left -70px top -150px', MALI_SIRINA, [tamaSredine(.74, '62%', '120%')], MALI)};
        color: var(--mx-t-na-crnom);
        box-shadow: var(--mx-t-linija-tamna), inset 0 1px 0 rgba(255, 255, 255, .16), 0 12px 26px -14px rgba(8, 10, 14, .7);
      }
      ${GLAVNI.map(s => s + ':hover').join(',\n      ')} {
        color: var(--mx-t-na-crnom);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .24), inset 0 1px 0 rgba(255, 255, 255, .22), 0 14px 30px -12px rgba(8, 10, 14, .75);
      }
      /* sporedni gumb ("Odustani"): bijeli gumb s tihim rubom kao Martina
         poruka; pod mišem ostaje svijetla (samo malo tamnija linija), da se
         razlikuje od glavnog gumba */
      ${SPOREDNI} {
        background: linear-gradient(180deg, #fff 0%, ${B.mlijeko} 55%, #f1f3f5 100%);
        color: var(--mx-t-tinta);
        box-shadow: inset 0 1px 0 #fff, var(--mx-t-linija), 0 6px 14px -8px rgba(30, 40, 56, .4);
      }
      ${SPOREDNI}::before { ${RUB} }
      ${SPOREDNI}:hover {
        background: #fff;
        color: var(--mx-t-tinta);
        box-shadow: inset 0 1px 0 #fff, 0 0 0 1px rgba(30, 38, 50, .2), 0 8px 18px -8px rgba(30, 40, 56, .45);
      }
      ${GLAVNI.map(s => s + ':active').join(', ')},
      ${W} .vfrc-prompt .vfrc-button:active { transform: scale(.98); }
      ${GLAVNI.map(s => s + ':focus-visible').join(', ')},
      ${W} .vfrc-prompt .vfrc-button:focus-visible { outline: 1px solid var(--mx-t-tinta); outline-offset: 3px; }
      ${T.noviRazgovor ? `
      ${GLAVNI.join(', ')} { font-size: 0; letter-spacing: 0; }
      ${GLAVNI.map(s => s + '::after').join(', ')} {
        content: ${tekst(T.noviRazgovor)};
        font-size: 11.5px;
        letter-spacing: .24em;
        padding-left: .24em;
      }` : ''}
      ${T.odustani ? `
      ${SPOREDNI} { font-size: 0; letter-spacing: 0; }
      ${SPOREDNI}::after {
        content: ${tekst(T.odustani)};
        font-size: 11.5px;
        letter-spacing: .24em;
        padding-left: .24em;
      }` : ''}

      /* ═══ KARTICA PROIZVODA (kartica-artikla.js): bijela, s tihim rubom kao Martina poruka; slova crna ═══ */
      ${W} .mx {
        --mx-tinta: ${B.tinta};
        --mx-dim: ${B.tih};
        --mx-roza: ${B.zlato};
        --mx-roza-45: ${prozirna(B.zlato, .45)};
        --mx-roza-75: ${prozirna(B.zlato, .75)};
        --mx-puder-88: ${prozirna(B.mlijeko, .88)};
        --mx-kap: ${B.zlato};
        --mx-linija: ${prozirna(B.zlato, .4)};
        --mx-kartica: #fff;
        --mx-cijena: ${B.tinta};
        --mx-rub-hover: ${prozirna(B.zlato, .8)};
        --mx-ikona: ${B.tih};
      }
      /* kartica je čisto bijela (kao izvorna), pa se s njom potpuno stopi i
         bijela pozadina fotografije koju nije moguće obraditi */
      ${W} .mx-kartica {
        background: #fff;
        border-color: transparent;
        border-radius: ${KUT_PLOHE}px;
        box-shadow: var(--mx-t-odsjaj), var(--mx-t-linija), 0 22px 44px -26px rgba(30, 40, 56, .5), 0 2px 8px -3px rgba(30, 40, 56, .14);
      }
      /* unutarnji (drugi) rub kartice postane tihi rub kao na Martinoj poruci */
      ${W} .mx-kartica::before, ${W} .mx-kartica:hover::before { ${RUB} border: 0; }
      ${W} .mx-maglica { border-radius: ${KUT_PLOHE}px; }
      ${W} .mx-crta { background: linear-gradient(90deg, ${prozirna(B.zlato, 0)} 0%, ${prozirna(B.zlato, .6)} 25%, ${B.zlato} 50%, ${prozirna(B.zlato, .6)} 75%, ${prozirna(B.zlato, 0)} 100%); }
      /* bočica stoji ravno na kartici, bez okvira i bez kutije oko sebe, kao u
         izvornoj kartici */
      ${W} .mx-nisa {
        --mx-sjena: rgba(24, 28, 34, .26);
        --mx-aura: ${prozirna(B.zlatoSvijetlo, .45)};
        --mx-aura-2: ${prozirna(B.mlijeko, .95)};
      }
      ${W} .mx-naziv { color: var(--mx-t-tinta); font-size: 16px; }
      ${W} .mx-marka { color: var(--mx-t-tinta); }
      ${W} .mx-oznaka { background: var(--mx-t-crni); color: var(--mx-t-na-crnom); box-shadow: none; border-radius: ${KUT_GUMBA - 1}px; }
      ${W} .mx-popust { background: var(--mx-t-crni); color: var(--mx-t-na-crnom); border-radius: ${KUT_GUMBA - 1}px; }
      ${W} .mx-gumb {
        min-height: 34px;
        border-color: transparent;
        border-radius: ${KUT_GUMBA}px;
        background: linear-gradient(180deg, #fff 0%, ${B.mlijeko} 55%, #f1f3f5 100%);
        color: var(--mx-t-tinta);
        box-shadow: inset 0 1px 0 #fff, var(--mx-t-linija), 0 4px 10px -6px rgba(30, 40, 56, .35);
      }
      ${W} .mx-gumb::before { ${RUB} }
      ${W} .mx-gumb:active::before { background: var(--mx-t-rub-tamni); }
      ${W} .mx-gumb:focus-visible { outline-color: var(--mx-t-tinta); }
      ${W} .mx-gumb:active { background: var(--mx-t-crni); color: var(--mx-t-na-crnom); border-color: var(--mx-t-crni); }
      @media (hover: hover) {
        ${W} .mx-gumb:hover { background: var(--mx-t-crni); color: var(--mx-t-na-crnom); border-color: var(--mx-t-crni); }
        ${W} .mx-gumb:hover::before { background: var(--mx-t-rub-tamni); }
      }

      ${P.pocetniEkran ? `
      /* ═══ POČETNI EKRAN (pocetna-chata.js) ═══ */
      /* Svi elementi ostaju izvorni. Tekst je velik, u prvom planu i bijel
         (drugi red naslova, "POČETAK" i crte više nisu ružičasto zlato), a
         flakon manji i tiši: pocetna-chata.js ga crta prema veličini prostora
         .mx-p-animacija. Slobodan prostor se dijeli iznad flakona (3 dijela) i
         iznad "POČETAK" (2 dijela), pa flakon, naslov i opis ostaju skupa. */
      ${POCETNA} {
        --mx-p-rose: ${BIJELA_POCETNE};
        --mx-p-rose-0: ${prozirna(BIJELA_POCETNE, 0)};
        --mx-p-rose-90: ${prozirna(BIJELA_POCETNE, .55)};
        --mx-p-rose-25: ${prozirna(BIJELA_POCETNE, .25)};
        --mx-p-sjaj-poziva: #ffffff;
      }
      ${POCETNA} .mx-p-scena { flex: 3 1 236px; min-height: 96px; align-items: flex-end; }
      ${POCETNA} .mx-p-animacija { width: 210px; height: 236px; }
      ${POCETNA} .mx-p-tekst { flex: none; gap: 20px; padding: 24px 28px 0; }
      ${POCETNA} .mx-p-naslov {
        font-size: 40px;
        font-size: min(42px, 11.2cqw);
        line-height: 1.1;
        letter-spacing: -.015em;
        text-shadow: 0 0 28px rgba(0, 0, 0, .6);
      }
      ${POCETNA} .mx-p-opis {
        max-width: 340px;
        font-size: 16px;
        line-height: 1.6;
        color: ${OPIS_POCETNE};
        text-shadow: 0 0 22px rgba(0, 0, 0, .7);
      }
      ${POCETNA} .mx-p-dno { flex: 2 0 auto; align-items: flex-end; padding-top: 28px; padding-bottom: calc(34px + env(safe-area-inset-bottom, 0px)); }
      ${POCETNA} .mx-p-gumb-tekst { font-size: 18px; }
      ${POCETNA} .mx-p-gumb-crta { width: 180px; }
      /* niži prozor: tekst se malo smanji (flakon se smanjuje sam, s prostorom) */
      @container (max-height: 720px) {
        ${POCETNA} .mx-p-tekst { gap: 16px; padding-top: 18px; }
        ${POCETNA} .mx-p-naslov { font-size: 36px; font-size: min(36px, 10cqw); }
        ${POCETNA} .mx-p-opis { font-size: 15px; line-height: 1.55; }
        ${POCETNA} .mx-p-dno { padding-top: 20px; padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px)); }
      }
      @container (max-height: 620px) {
        ${POCETNA} .mx-p-tekst { gap: 14px; padding-top: 14px; }
        ${POCETNA} .mx-p-naslov { font-size: 32px; font-size: min(32px, 10cqw); }
        ${POCETNA} .mx-p-opis { font-size: 14px; line-height: 1.5; }
        ${POCETNA} .mx-p-dno { padding-top: 16px; padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px)); }
        ${POCETNA} .mx-p-gumb { gap: 10px; }
      }
      @container (max-width: 400px) {
        ${POCETNA} .mx-p-tekst { padding-left: 24px; padding-right: 24px; }
      }

      /* Pozadina: tihi crni mramor sa zlatnim žilama, mekano zamućen kao da je
         izvan fokusa (tek kad je slika učitana; dotad i bez WebGL-a je crno kao
         prije). Preko kamena su meke sjene (iza natpisa MARTIMEX, flakona,
         teksta i "POČETAK"), bez rubova, pa je sve na njemu u prvom planu.
         Platno s točkicama je crno, pa se stapa sa "screen": crno postane
         prozirno, a točkice svijetle preko kamena. */
      ${POCETNA_M} {
        background:
          radial-gradient(54% 74px at 50% env(safe-area-inset-top, 0px), rgba(0, 0, 0, .7), rgba(0, 0, 0, 0)),
          radial-gradient(38% 22% at 50% 35%, rgba(0, 0, 0, .62), rgba(0, 0, 0, .4) 50%, rgba(0, 0, 0, 0)),
          radial-gradient(62% 26% at 50% 64%, rgba(0, 0, 0, .6), rgba(0, 0, 0, .38) 55%, rgba(0, 0, 0, 0)),
          radial-gradient(40% 9% at 50% calc(100% - 64px - env(safe-area-inset-bottom, 0px)), rgba(0, 0, 0, .55), rgba(0, 0, 0, 0)),
          var(--mx-t-mramor-crni) center / cover no-repeat,
          #050505;
      }
      ${POCETNA_M} .mx-p-platno { mix-blend-mode: screen; }
      /* flakon je tih: bez zlatnog sjaja iza njega i malo prigušen, pa je tekst u prvom planu */
      ${POCETNA_M} .mx-p-scena { background: none; }
      ${POCETNA_M}.mx-p-spremno .mx-p-platno { opacity: .85; }
      /* kamen izroni iz tame pri svakom otvaranju (samo prozirnost; klasu
         mx-p-ulaz pocetna-chata.js doda iznova pri svakom otvaranju) */
      ${POCETNA_M}::before {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        background: #000;
        opacity: 0;
        pointer-events: none;
      }
      ${POCETNA_M}.mx-p-ulaz::before { animation: mx-t-izroni 1.4s var(--mx-t-meko) backwards; }
      @keyframes mx-t-izroni {
        from { opacity: 1; }
        to   { opacity: 0; }
      }
      /* vrlo nizak prozor (npr. mobitel položen vodoravno): flakon se smanji,
         a natpis i "POČETAK" ostanu u prozoru (i dostupni na dodir) */
      @container (max-height: 440px) {
        ${POCETNA} .mx-p-scena { flex: 1 1 0; min-height: 0; }
        ${POCETNA} .mx-p-tekst { gap: 8px; padding-top: 6px; padding-bottom: 6px; }
        ${POCETNA} .mx-p-naslov { font-size: 22px; }
        ${POCETNA} .mx-p-dno { flex: none; padding-top: 0; padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)); }
        ${POCETNA} .mx-p-gumb { gap: 8px; padding-top: 6px; padding-bottom: 6px; }
      }
      @media (max-height: 440px) {
        ${POCETNA} { overflow-y: auto; }      /* zadnja rezerva: može se pomaknuti */
      }` : ''}

      ${P.gumbChata ? `
      /* ═══ GUMB CHATA U KUTU (gumb-chata.js): komadić crnog mramora ═══ */
      /* zamućeni komadić mramora (učita se odmah, nekoliko KB): zlatna žila
         prolazi uz donji rub, a iza natpisa je kamen taman */
      ${W} .vfrc-launcher {
        --mx-g-puder: ${B.naCrnom};                      /* natpis: bijeli */
        --mx-g-rub: rgba(255, 255, 255, .16);             /* tihi svijetli rub (kao na kupčevoj poruci) */
        --mx-g-rub-sjaj: rgba(255, 246, 222, .5);
        --mx-g-magla: ${prozirna(B.zlato, .32)};             /* izmaglica spreja: tamnije zlato od natpisa */
        --mx-g-magla-2: ${prozirna(B.zlato, .1)};
        --mx-g-magla-0: ${prozirna(B.zlato, 0)};
        --mx-g-kap-sjena: ${prozirna(B.zlatoSvijetlo, .9)};
        --mx-g-sjena: 0 1px 2px rgba(10, 12, 16, .2), 0 12px 26px -12px rgba(10, 14, 24, .6);
        --mx-g-sjena-gore: 0 2px 4px rgba(10, 12, 16, .18), 0 18px 32px -14px rgba(10, 14, 24, .7);
        background-color: ${B.crni};
        background-image:
          linear-gradient(180deg, rgba(255, 255, 255, .16) 0%, rgba(255, 255, 255, .04) 48%, rgba(255, 255, 255, 0) 52%),
          linear-gradient(180deg, ${prozirna(B.crni, .86)} 0%, ${prozirna(B.crni, .8)} 62%, ${prozirna(B.crni, .1)} 100%),
          ${MALI};
        background-size: auto, auto, ${MALI_SIRINA}px auto;
        background-position: 0 0, 0 0, left -100px top -140px;
        background-repeat: no-repeat;
        border-radius: ${KUT_GUMBA}px;                   /* oblik gumba sa stranice (i otvoren, sa strelicom) */
        -webkit-backdrop-filter: none;
                backdrop-filter: none;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .2), var(--mx-g-sjena);
      }
      @media (hover: hover) and (pointer: fine) {
        ${W} .vfrc-launcher:hover { box-shadow: inset 0 1px 0 rgba(255, 255, 255, .26), var(--mx-g-sjena-gore); }
      }
      /* bočica: ružičasto zlato postane metalno zlato žila (mali filter, samo ikona) */
      ${IKONA_GUMBA} { filter: brightness(.7) sepia(1) saturate(1.9) hue-rotate(2deg); }` : ''}

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
        :host { --mx-t-staklo-ploca: linear-gradient(160deg, ${prozirna(B.mlijeko, .97)}, ${prozirna(B.mlijeko, .92)}); }
      }
      /* "Smanji prozirnost": polje i ploča gotovo neprozirni */
      @media (prefers-reduced-transparency: reduce) {
        :host {
          --mx-t-staklo: linear-gradient(160deg, ${prozirna(B.mlijeko, .99)}, ${prozirna(B.mlijeko, .97)});
          --mx-t-staklo-ploca: linear-gradient(160deg, ${prozirna(B.mlijeko, .99)}, ${prozirna(B.mlijeko, .97)});
        }
      }
      /* "Smanji pokrete": poruke se samo tiho pojave */
      @media (prefers-reduced-motion: reduce) {
        ${MARTI}, ${KORISNIK} { animation: mx-t-prozirnost .3s linear backwards; }
        ${POCETNA_M}::before, ${POCETNA_M}.mx-p-ulaz::before { animation: none; display: none; }
        ${W} .vfrc-typing-indicator > span { animation: none; opacity: 1; }
        ${POSALJI}, ${POSALJI}:hover, ${POSALJI}:active,
        ${PILULA}:active,
        ${ZAGLAVLJE} .vfrc-header--button:active,
        ${GLAVNI.map(s => s + ':active').join(', ')},
        ${W} .vfrc-prompt .vfrc-button:active { transform: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-tema]');
      if (stari && stari.getAttribute('data-mx-tema') === '9') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-tema', '9');
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

    // Početni ekran: samo Xerjoff flakon (pocetna-chata.js to pročita kad
    // gradi početni ekran; zato se postavlja odmah, prije Voiceflowa)
    function samoFlakon() {
      if (!P.pocetniEkran) return;
      const f = P.flakon || {};
      const nacin = { samoFlakon: true };
      if (+f.brzina > 0) nacin.samoFlakonBrzina = +f.brzina;
      if (f.odsjaj !== undefined && !isNaN(+f.odsjaj)) nacin.samoFlakonOdsjaj = +f.odsjaj;
      window.MartimexPocetna = Object.assign(window.MartimexPocetna || {}, nacin);
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

    // ── ODGOĐENO UČITAVANJE MRAMORA ──────────────────────────────────────
    // Velike slike mramora ne smiju usporiti webshop: krenu tek kad
    // preglednik nakon učitavanja stranice miruje, ili odmah kad kupac
    // krene prema chatu (miš ili prst na gumbu, tipkovnica, otvaranje).
    // Na zaslonu visoke gustoće uzme se slika "2x" (isti uvjet kao u CSS-u).
    // Kad slika stigne (i dekodira se), element chata dobije njezino ime u
    // atributu data-mx-mramor ("crni") i tek tada je CSS koristi.
    // Ako ne stigne (greška, blokada), atributa nema: ostaje boja kamena, a
    // preglednik je ne traži iznova.
    const MRAMOR = { krenulo: false, ucitano: [], host: null, odjavi: [] };

    function oznaci() {
      const h = MRAMOR.host;
      if (!h || !MRAMOR.ucitano.length) return;
      const vrijednost = MRAMOR.ucitano.join(' ');
      if (h.getAttribute(OZNAKA) !== vrijednost) h.setAttribute(OZNAKA, vrijednost);
    }

    function ucitajMramor() {
      if (MRAMOR.krenulo) return;
      MRAMOR.krenulo = true;
      // okidači više nisu potrebni
      MRAMOR.odjavi.splice(0).forEach(function (f) { f(); });
      const gusto = !!(window.matchMedia && window.matchMedia(GUSTO).matches);
      [['crni', M.crni, M.crni2x]].forEach(function (s) {
        const put = (gusto && s[2]) || s[1];
        if (!put) return;
        const img = new Image();
        img.decoding = 'async';
        img.onload = function () {
          function gotovo() {
            if (MRAMOR.ucitano.indexOf(s[0]) === -1) MRAMOR.ucitano.push(s[0]);
            oznaci();
          }
          (img.decode ? img.decode() : Promise.resolve()).then(gotovo, gotovo);
        };
        img.src = BAZA + put;
      });
    }

    function pripremiUcitavanje() {
      // 1) kad preglednik nakon učitavanja stranice miruje
      function odmorni() {
        setTimeout(function () {
          if (MRAMOR.krenulo) return;
          if (window.requestIdleCallback) window.requestIdleCallback(ucitajMramor, { timeout: 3000 });
          else ucitajMramor();
        }, Math.max(0, +M.cekaj || 0) * 1000);
      }
      if (document.readyState === 'complete') odmorni();
      else window.addEventListener('load', odmorni, { once: true });
      // 2) Voiceflow javlja otvaranje chata porukom {"type":"voiceflow:open"}
      //    (samo poruke ove stranice; ostale, npr. iz iframea plaćanja, se ne čitaju)
      function naPoruku(e) {
        if (e.source && e.source !== window) return;
        let d = e.data;
        if (typeof d === 'string') {
          if (d.indexOf('voiceflow:open') === -1) return;
          try { d = JSON.parse(d); } catch (x) { return; }
        }
        if (d && d.type === 'voiceflow:open') ucitajMramor();
      }
      window.addEventListener('message', naPoruku);
      MRAMOR.odjavi.push(function () { window.removeEventListener('message', naPoruku); });
      // 3) kupac krene prema gumbu chata (miš, prst, tipkovnica); samo gumb,
      //    jer Voiceflow npr. sam stavi fokus u (još skriveno) polje za poruku
      cekajHost(function (host) {
        MRAMOR.host = host;
        oznaci();
        if (MRAMOR.krenulo) return;
        const dogadjaji = ['pointerover', 'pointerdown', 'touchstart', 'focusin'];
        function naGumbu(e) {
          const put = e.composedPath ? e.composedPath() : [];
          for (let i = 0; i < put.length; i++) {
            if (put[i].classList && put[i].classList.contains('vfrc-launcher')) { ucitajMramor(); return; }
          }
        }
        dogadjaji.forEach(function (d) { host.addEventListener(d, naGumbu, { capture: true, passive: true }); });
        MRAMOR.odjavi.push(function () {
          dogadjaji.forEach(function (d) { host.removeEventListener(d, naGumbu, true); });
        });
      });
    }

    // Hrvatski natpisi gumba su u CSS-u (content), a u gumbu ostaje
    // Voiceflowov engleski tekst; čitač zaslona zato dobije hrvatsko ime
    // (aria-label). Samo atribut, u chat se ništa ne umeće.
    function imenaGumba(korijen) {
      const parovi = [
        [T.noviRazgovor, '#vfrc-start-chat, .vfrc-prompt .vfrc-button:first-child'],
        [T.odustani, '.vfrc-prompt .vfrc-button:last-child:not(:first-child)']
      ].filter(function (p) { return p[0]; });
      if (!parovi.length) return;
      function postavi() {
        parovi.forEach(function (p) {
          korijen.querySelectorAll(p[1]).forEach(function (g) {
            if (g.getAttribute('aria-label') !== p[0]) g.setAttribute('aria-label', p[0]);
          });
        });
      }
      postavi();
      if (typeof MutationObserver === 'function') new MutationObserver(postavi).observe(korijen, { childList: true, subtree: true });
    }

    function pokreni() {
      samoFlakon();
      ubaciFontove();
      pripremiUcitavanje();
      cekajHost(function (host) { ubaciStil(host.shadowRoot); imenaGumba(host.shadowRoot); });
    }

    return { pokreni: pokreni };
  })();

  try { MX_TEMA.pokreni(); }
  catch (e) { console.warn('[Martimex] Izgled chata nije pokrenut:', e); }

})();
