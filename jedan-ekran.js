(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — chat s Marti na JEDNOM ekranu (izgled "Jedan ekran")
  //
  //  Nema početnog ekrana ispred chata: kad se chat otvori, razgovor je
  //  odmah tu, a vrh prozora je mala tamna "pozornica" s brendovima.
  //
  //   - gore je tamna traka s natpisom "Marti · AI asistentica" u dva
  //     reda: MARTI (Jost, isti font kao poruke; razmaknuta velika slova,
  //     boja pudera) i ispod sitno AI ASISTENTICA (prašnjava roza), te
  //     Voiceflowovim gumbima za novi razgovor i zatvaranje (samo tanke
  //     ikone, bez kruga)
  //   - ispod nje, u istoj toploj crnoj boji, je niska pozornica: tri
  //     tanke, diskretne trake s malim logotipima parfemskih i modnih kuća
  //     koje Martimex prodaje (Chanel, Hermès, Guerlain ... Lancôme, Estée
  //     Lauder; sličice su u mapi marke/trake/, izrezane iz marke/izvor.webp
  //     skriptom marke/izradi-trake.py). Logotipi su prigušeno bijeli, jedan
  //     pokraj drugoga, i polako putuju: gornja traka ulijevo, srednja
  //     udesno, donja ulijevo, svaka malo drugom brzinom, bez kraja (traka
  //     se sašije sama sa sobom, pa nema skoka). Nijedna traka nikad nije
  //     prazna: red logotipa se sam ponovi koliko puta treba da je uvijek
  //     širi od pozornice, a brendovi su tu od prvog kadra. Na rubovima
  //     pozornice logotipi tiho izblijede. Pozornica je nenametljiva:
  //     razgovor je glavna stvar. Ispod nje je tanka roza crta prema
  //     razgovoru
  //   - razgovor je na toploj bjelokosti, bez mramora i bez teksture:
  //     Martine poruke su bijele kartice s jedva vidljivom sjenom, kupčeve
  //     su tamne (tinta), ponuđeni odgovori su pilule s tankim tamnim
  //     obrubom koje se pod mišem (ili prstom) ispune tamnom bojom; glavni
  //     odgovori (status narudžbe, Loyalty Card, reklamacija, plaćanje,
  //     beauty savjetnik) imaju lijevo tanku ikonu (originali u mapi
  //     ikone/; POSTAVKE: ikoneGumba), koja na ispunjenoj piluli posvijetli
  //   - polje za poruku je bijela kapsula s tankim toplim rubom; gumb za
  //     slanje je taman krug tek kad ima što poslati
  //   - čim kupac pošalje prvu poruku ili pritisne ponuđeni odgovor,
  //     logotipi izblijede (0,4 s) i pozornica se glatko sklopi (0,9 s,
  //     krene odmah i dugo usporava); ostaje samo crna traka s natpisom, a
  //     razgovor dobije ostatak prozora. Na niskom prozoru (mobitel)
  //     pozornica se sklopi već kad kupac dotakne polje za poruku, da
  //     tipkovnica ne prekrije razgovor; ako polje napusti bez slanja,
  //     pozornica se vrati
  //   - novi razgovor (gumb gore, ili "Započni novi razgovor" nakon
  //     završenog razgovora): čim Voiceflow isprazni razgovor, pozornica se
  //     raširi i logotipi se vrate (još dok Marti tipka pozdrav), pa
  //     pozdrav s gumbima kreće ispočetka. Je li pozornica sklopljena, čita
  //     se iz razgovora (ima li kupčev odgovor), ne pamti se — pa se trake
  //     vrate i nakon ponovnog otvaranja chata
  //   - ako razgovor već postoji (npr. kupac je s preporuke otišao na
  //     stranicu proizvoda), chat se otvori odmah sklopljen
  //   - razgovor kreće sam kad se chat otvori (nema gumba "Početak"), ali
  //     tek tada: samo učitavanje stranice ne pokreće razgovor u Voiceflowu
  //   - Voiceflowovi engleski tekstovi ("Start new chat", "Cancel",
  //     "Chat has ended") su na hrvatskom
  //
  //  "Smanji pokrete" (postavka uređaja): trake stoje; pozornica se sklopi
  //  bez animacije. Trake su običan CSS (bez WebGL-a),
  //  pa rade svugdje; ako se neka sličica ne učita, preskoči se.
  //
  //  Tehnički: kao i ostali moduli, ovaj ubaci svoj stil u shadow DOM
  //  elementa #voiceflow-chat i oslanja se na Voiceflowove službene klase
  //  (.vfrc-chat, .vfrc-header, .vfrc-message, .vfrc-user-response,
  //  .vfrc-footer, .vfrc-input-container...). U prozor umeće samo jedan
  //  element: pozornicu, odmah ispod Voiceflowova zaglavlja (ako je
  //  Voiceflow iscrta iznova, vrati se na mjesto). Voiceflowu se isključi
  //  "autostart", pa se razgovor pokrene tek otvaranjem chata (modul tada
  //  pritisne Voiceflowov skriveni gumb za početak, kao nekad "Početak").
  //  Ako modul zakaže, chat radi kao Voiceflowov.
  //  Ne ide uz pocetna-chata.js ni tema-chata.js (oni su drugi izgled).
  //  Gdje radi: testna stranica proba.html (vrh repozitorija) učita ovaj
  //  modul umjesto početnog ekrana; martimex.hr ga ne učitava dok se u
  //  loader.js ne uključi umjesto pocetna-chata.js (vidi loader.js).
  //  Probe: pokusi/trake/proba.html i, bez Voiceflowa, pokusi/trake/mock.html.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxJedanEkran) return;   // zaštita ako se modul učita dvaput
  window.__mxJedanEkran = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_JEDAN_POSTAVKE = {
    boje: {                     // uvijek u obliku #rrggbb
      tama:      '#0e0c0b',     // topla crna: traka gore i pozornica s flakonom
      bjelokost: '#f7f3ef',     // pozadina razgovora
      papir:     '#fffdfb',     // Martine poruke, polje za poruku, ploče
      tinta:     '#1c1715',     // tekst; kupčeve poruke; obrub i ispuna ponuđenih odgovora
      tih:       '#7a6d66',     // prigušeni tekst (napomene, "Vaša poruka...")
      linija:    '#e8ddd6',     // tanki topli rubovi na svijetlom
      puder:     '#f3e5de',     // natpis MARTI u traci gore, tekst na tamnom
      roza:      '#e2c3ba',     // naglasak (Martimexova prašnjava roza): crte, fokus, "Marti · AI asistentica"
      logotip:   '#ffffff'      // logotipi na trakama (sličice su bijele; drugom bojom se oboje)
    },

    // Fontovi iz mape fonts/ (učitavaju ih i ostali moduli)
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',
    fontNatpisa: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    natpis: 'Marti',                          // u traci gore, 1. red (Cormorant, velika slova)
    podnatpis: 'AI asistentica',              // u traci gore, 2. red (sitno, roza); '' = samo 1. red

    // Voiceflowovi engleski tekstovi ('' = ostaje Voiceflowov tekst)
    tekstovi: {
      noviRazgovor: 'Započni novi razgovor',  // "Start new chat"
      odustani: 'Odustani',                   // "Cancel"
      razgovorZavrsen: 'Razgovor je završen'  // "Chat has ended"
    },

    // Ikone na ponuđenim odgovorima (pilulama): tekst gumba (isti kao u
    // Voiceflowu) → ikona. Ikone su: savjetnik, narudzba, loyalty,
    // reklamacija, placanje. Gumbi kojih tu nema ostaju bez ikone
    ikoneGumba: {
      'Vaš beauty savjetnik':     'savjetnik',
      'Provjeri status narudžbe': 'narudzba',
      'Loyalty Card':             'loyalty',
      'Prijavi reklamaciju':      'reklamacija',
      'Načini plaćanja':          'placanje'
    },

    // Pozornica s trakama: visina kao udio visine prozora chata, unutar granica (px); niska, da ne vlada ekranom
    pozornica: { udio: 0.15, min: 92, max: 116 },
    // Na mobitelu i tabletu, i na prozoru nižem od ovoga (px), pozornica se
    // sklopi čim kupac dotakne polje za poruku, da tipkovnica ne prekrije
    // razgovor (0 = svugdje tek kad pošalje prvu poruku)
    sklopiNaFokus: 700,

    // Trake s logotipima brendova (sličice iz mape marke/trake/, bez .png).
    // Svaka traka je jedan red; redom odozgo. Smjer: 'lijevo' ili 'desno';
    // brzina: koliko sekundi treba da cijeli red prođe (veće = sporije)
    marke: {
      trake: [
        { smjer: 'lijevo', brzina: 95,  logotipi: ['chanel', 'dolce-gabbana', 'guerlain', 'tom-ford', 'hermes', 'elie-saab', 'versace', 'estee-lauder'] },
        { smjer: 'desno',  brzina: 115, logotipi: ['giorgio-armani', 'carolina-herrera', 'prada', 'chloe', 'valentino', 'yves-saint-laurent', 'lancome', 'van-cleef-arpels'] },
        { smjer: 'lijevo', brzina: 105, logotipi: ['xerjoff', 'penhaligons', 'chopard', 'maison-francis-kurkdjian', 'tiziana-terenzi', 'memo-paris', 'the-merchant-of-venice', 'brunello-cucinelli'] }
      ],
      visina: 18,             // px: visina logotipa (okomiti, npr. Chanel); široki natpisi su niži, da stanu u širinu
      sirina: 3.4,            // najveća širina logotipa, kao višekratnik visine (Dolce & Gabbana, Elie Saab...)
      razmak: 32,             // px između logotipa u traci
      razmakTraka: 12,        // px između traka
      prozirnost: 0.55,       // jačina logotipa (1 = potpuno bijeli; manje = diskretnije)
      rub: 48                 // px: koliko logotipi blijede uz lijevi i desni rub pozornice
    },

    // Koliko dugo Voiceflow pamti razgovor (kao u pocetna-chata.js):
    // 'sessionStorage' → dok je kartica preglednika otvorena; 'localStorage' →
    // trajno; 'memory' → do sljedećeg učitavanja stranice; '' → kako je u Voiceflowu
    pamcenje: 'sessionStorage'
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX_JEDAN = (function () {
    'use strict';

    const P = MX_JEDAN_POSTAVKE;
    const B = P.boje;
    const T = P.tekstovi || {};
    const M = P.marke || {};
    const HOST = 'voiceflow-chat';          // element u čiji shadow DOM Voiceflow crta chat
    const START = '#vfrc-start-chat';       // Voiceflowov gumb "Start new chat"
    const OZNAKA = 'data-mx-j';             // atribut na #voiceflow-chat: "sklopljeno", "pokrecem"
    // adresa mape ove skripte (vrh repozitorija); fontovi su u njezinoj mapi fonts/
    const MAPA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/jedan-ekran.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
    const KORIJEN = MAPA;
    const MIRNO = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const MOBITEL = !!(window.matchMedia && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches);
    const PAMCENJE = ['sessionStorage', 'localStorage', 'memory'].indexOf(P.pamcenje) !== -1 ? P.pamcenje : '';

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + (+(+a).toFixed(3)) + ')'; }
    function tekst(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\A ') + '"'; }
    function broj(v, zadano, min, max) { v = +v; return isFinite(v) ? Math.min(max, Math.max(min, v)) : zadano; }


    // ═══════════════════════════════════════════════════════════════════
    //  SLIČICE LOGOTIPA — ugrađene u modul (data: adrese), da su na
    //  pozornici odmah, bez čekanja na mrežu; pune sličice su u
    //  marke/trake/. Blok između oznaka upisuje skripta
    //  marke/izradi-trake.py: ne mijenja se ručno.
    // ═══════════════════════════════════════════════════════════════════
    // ── SLIČICE LOGOTIPA (generirano: python3 marke/izradi-trake.py)
    const SLICICE = {
      'chanel': 'data:image/png;base64,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',
      'hermes': 'data:image/png;base64,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',
      'guerlain': 'data:image/png;base64,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',
      'giorgio-armani': 'data:image/png;base64,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',
      'brunello-cucinelli': 'data:image/png;base64,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',
      'carolina-herrera': 'data:image/png;base64,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',
      'chloe': 'data:image/png;base64,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',
      'dolce-gabbana': 'data:image/png;base64,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',
      'elie-saab': 'data:image/png;base64,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',
      'prada': 'data:image/png;base64,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',
      'tom-ford': 'data:image/png;base64,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',
      'valentino': 'data:image/png;base64,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',
      'versace': 'data:image/png;base64,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',
      'yves-saint-laurent': 'data:image/png;base64,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',
      'van-cleef-arpels': 'data:image/png;base64,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',
      'chopard': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGsAAAAoCAQAAABTesxFAAAJPElEQVR42t3Ze7Re85kH8O/e73vOyY0QEUnEpTGExIpVoqjLSOpWbWmkq1Nq0AqtMcutswwdLaaWYpS6jOqMuqaTCVVOxSVSVDpGKKpRzJC6VZAyLkHkej7zx7vfk3NyjiSrizCz13rX2nu/v71/z/d5vs91F+nlUKZMR9GRVRyK1CKKjkStWJ6P1VH0ELZMRyFJ9M82GZTBGZlBSZIbivuVRUeiTJqg9c3iokPReOZjCaupddtm5+ySMvUsyCN5LcvzVhbmmeINRYoGJEPyuYzPyBTpk2nFeR83YJ12UibaHOFKF5hsrHV6klOZJHby7xZ61nn+0kjbecTYhg2rVbWPEEep6OpNSXzFL51vmy5L6mpqakqlepLYw6141uFdXtVudKJoKuejNM5KFwaYqt1WTX13Q13ZyeauBGdoTRJ1bYkj3N1QTMNK9naolo8KlBHaOi1lkN86rxK16LG8Ie7feBWP+lTjnkJLYjuL7NakniFucYPZjmg+tTbpl9jdq86vfEqLB12YqPdGIfXECO3gX/RtQK9AfdJi32/QNbGDl52VmOrotQ1LodRmDn5QWcL3PNm7nar/9/UclvjbzjsNUh5gucsTNfXEXpY6NjHO6zZaiecfPqx64jQ8bV1FEkMtdlDjjx4aqCW+aQne8NkG9ZornYmzOkHtju8miQddstZtVUts413LfKba2xEWGthTuxWofwAv2rnSSE2Z2NTdFvhKJ/22tMhNSeLb5unbPeCsBQLWtPg1vtWpUFeYp2VlWBWoC8EfjG54XhU8jvK6nxneAKk00FOetV7iy5bZdkUOW4sEPBN3NPmUxHVe7gVWLXEJ+C+bJdqq3DbebE/ZtzMa1hK34FOJL+CLqyagomHvD5iAe1rmNZt0yZuO1WFY983UE98FL9iyM13vqt2LztG3q5c5B6ckJlno4N589EOPgAM9jcO67W1jy52eqKsrlVXoPgQssG2SaHOYezzpbBt2yWS1xCTMSBzlFXutGpRCob+rXanvmkRKRe8ppwcBL8G07qDKxNdwRLfFY7xjmZeNU9jFReZ40AnWbVKvS/R523wD/KNHbLVaULXEFJzfOP+ACLgPXjBY0b10qiUmetyvfcs4o2xpaw+D51xmlrv8kx2rta3NRxVq+pjtLUe6ztWNKLlavR6GWYqVRKgs2aNm2MjFdu0tADUirUJpsOdwYC+7KxMtJvmhGe71S2+BWU73zUaVmBjv84auoE6n8Z/XbvKKcrmTPEX3jdQToyzwttHK7jVjZ4QtFM16VKHFPTgt6bpa0WRElVqm4uL34Uk3AXb2rg5P6l9dD3Sq61zuYg85oFJCPXEwuNTA939XN0YM8Tt8vbeGKFFabyVFj8M8w3p7t1H6JYkj8btV5EmFmpq60j3osHuib2JfUx1t/SSxn+et29CX7Syw1IHGONv9LjegQS1FYrDT3G+WE6uqupYY5gFMVXecq0ysRG9AGu1ST3nCDWomOs9eCoWNvWu+Wz1uwooOwUAn+29Pm2MHI7zlPeNWQ3+1xH7gskRr4jjXG54kWtQN85JRisRQT1nkJKe6wd4uxVGNJxJH+h9vO9k419gv0ZbYwuN42JdMcYx3vGndyuZ9/AB/dIAN3ajdAnxakdhRu01NxwWJlqo6fQbnWN8+bnM3zlhtSlEmbtfheYPUEse5sNmsqClM8px+iXXch/lmOj4x0DxMUii0mYKHDK38cQdlYoJHsdhvXGW4z1hitjb1xMbuxR0GJImTadBUi1YzbOBwS71mi4ohp+ANE5JEH6/gAa1aVpkElIltLcYhSeIgV3Vp9GuJWa5PjDQLvGKfROF2/EZrYl0z8UAl5MHYKfENP/Fv3sMUrYZ6FfsniU/4PW7WUtl0Jq6teHKZLxmnAwdXd87DfGMTfRKTLfWe7Veb/dQTp+PeRGG4n1qnGXbVExMxwvYu9x7+YOskcQYW2kGhzV14xchEzZ7edb+Rfup79rQAP07U3F6dFYZ4Andqq8SehBesryVxgov08xJ+WME4CQvtkWhVGuxFnNkYKBm7muTugaqqKxxrp06Xbrj8q851oGNdaJknbZokJlpKFeDPxTJfSLQpXIQHtTtM3Vxco6jU9nAjdrobcw2uQG3iJR32SRKfd1OiHTO1aUscYBGOb/h44irM0jexiats1jMPdp0DDLbAfH0SpUFNDaglWv2np53qEF+23J+MTtRs6XX8a1VZanSmWrQkprrGHgYmrsVsfRJ7W+wd21V9A8tMqOi3nvtwbpLY3W36m4w/+YQysb93MDNR11L54Ou2SgxxzSo7BmVibMXtcsUURz3R322YbmtjvNPwPa1Kd+Ix/RKnmIt5BlYbn2BG9d6D8LZRiUHm4sREi/O9osOUimAb+Q/8Vr/EvmYYZqg3mgWdyWZ511LbN9K4b1C9Z7BpPr3K8K5MbI1T1BptirKq0rf0e5yhTd0T+Hml4c/hbVvo4ydOMtkyp1UKOcXPDVDTYqC5VfAvHIPpiY3c6K9Mt6Tyzgnux3t2SByu3aaVx96cKH3fJfa02M2VnN/xpg6/SozSbp816MP1tdAFlSWaRdLRFnnGblVnxrOGVTX+NJxtvDscmvjrqjIbbZorFI2Sxz/jyup8Og5ygDt9MXGLpVps7FRX2xO3GekyV+iXKNyD8fZwrRMTY3B+Ymc3+rYLcbivut2OawKqljieBoTEZr5mjkXOtk6idJDXzDO+s/H/e8s97Nqqc+7jZ+aa6pYqPTRj5xwDqurtq173kB/ZPFHa3AzTTHF0kviFx/zCoZ1PHuN5t7jAmEquvzPHda63V2KyJZ50qaFrODFRJo73qF+51X1e8JizqhqjltjAcBt2DaXGVuPSZquyi92bw1KloV602K5dKrlNDOlW2W3eqMOTpNpnBUvW79rZJTawRaeMoxuV4hp32dV8dzeftZe/aFqx23y36H7Wma47Q6xa9ZuK73QRrOymgmJFnO1ZJHeuLbsNYBtjvKKnVGvUmHW96tZulCv3RN311a0imYi71Ltu3+P54v26rV76r+L937Pm04HGROnPGoopFTbyR28atbZnUB/2eOsmHLO2xzUf9nz165jVzHv/H0CViRFes9gn1/43kw/zW2BjAnHGRwvqAyeJ1uyfItOzLPlYfk3+v3z8LyXUlRXYi122AAAAAElFTkSuQmCC',
      'maison-francis-kurkdjian': 'data:image/png;base64,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',
      'xerjoff': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJoAAAAoCAQAAACs9CviAAAMHElEQVR42u2ae7BdVX3HP7+9z8lNSEISEgJJeLY8kvBIAoHhJQTBEQVrOzoWcEBoQWlREQraB49ih7RYRAewjHSQqZgGoVSUhwhYgh3AhkItKaK0EnnmAXmRkOTec/b+9I+z77nnsc+9IbaddGSdmTPnnLX2Wr/1Xb/X97dOABhA0NoMW7+09bb0dfSUNcNhxrWt09nVa9WuEYYm2zBue6XcJnn/D5sVY7ueC9NeM/5vyxxG6EeYxQpWMoYgAfZkHbdF3hAu9AiOZxVbyEjZjZS7YqURuoD5rOU1EgbYAoxiNAFUgX42UWEUS3kr9DSOZg2TGM9OVKiT8Sav8RTLY21jjXZAQuczn830M4oaa9mHNXH30LjGJ6dwFOdwNDk1xvEL/oFHeD4GTCNrmW0SpxCsZgwVBkhJgZyMQBJyMhKeiRVW+QSTeQVJ2cJGoHEsQYUgI2cyz8UzRuNU1lDlHI5rrvMU1zcgK1rOVC5hOgDf5hHqxe+v8RucxYLi22osenL6mELDYE6Pbxu8wr3kvMBGNlIDqpzBBOBn3swtsbUTNmA9/XyWw4tvN/PdIY00jcwKn+MyprKE+3mB9RzIPK4D7vfG+EET1gipkPFezisgGAByJCOnSl8h5aV8mYxVzOVP2blY5m0a5ppToa/47X5OazFhE//C3K1mbnVG4edaT/+TZm7wY13GMMonzMy83L3c1xnOcIbT3NtD/IB3qec0DMYPe4iT7Gs+t59Xm6t6h+NMmj6pde55brBu5mUdHgqn+aj6rx7f1nOCy9SaC0vm+ryZmUuc7cHOcqb7u58zPcQFLlIvgYYEfszMzPWe4YHOcqYzPcBZzvFErzPze4PjMHGUAd6l1sy9sNlVeA/H+0/q+WBlyAuZWAFvU/WCUv/yvBeC1VZIjObzFzngFvWrresNze1erlIzF5haHfwdnOZP1QfcGcCqFStWDXC6y1T9W6uDchpWTf2oqveUyFh1ideDYcWKB6r6hgeWjLzRpW3qZGri3q4xU191d6NAPkzBv1Jv6nTbhmH4LVUvNrFq0nylVsCFXlxoWmJqUjwRhqmpiXerdTd5QKduG+A+rlYzT2nqQVhxrE+qLzodGlA1pamCR7jeTP2joYMwAT+u6v2mVk1bpBwNfsZbBw/TmQVoh7XsJzV1lOEx3m4VmucbGcRLXEBCjRlc1fQxSWSexBd4nIsM8k7fE9L4JY+cPIZeGRnwJMsBIfLIIh/CLDKInEVkJIzlVFpk6WpDbj2izhUcRc6N8bpp1IbkCaNmJZ7iFhJq/KXzIu+OzJHRkGRQyhrwDP8GxUxbGzhTb9lPFhm1kF/yWHcQrxjeqg6o7wMTE8NpvuAaDy4xocbZfFPVz0KvJKBHapAaLnCzmntt59MtmlbzuEJbEnCum81c5ziTbkhMDA90jap3DY4wAX9f1QfL1mlbc09VVzq7fb9DTqXtdEPykEv4T6rIdY5HkpDr2J/z4j9M2iLqtmZTMVy+w+AGBro7u94b0v4hY0j4cWyKvDvRjJyIn7MEkA9wcNhxkJWG3rfJMIKUTT12EOKkfUmT2MD59JNzKF+CqPsZzmRhfMdKT8hseW898SM9KBwmxw6DifQhwfLSEUmreRpRdzxzAHikO763tAeBjJ04uQXwaILWLuVBzizJ8nOyDt892aklmlbAlsZjLCSlxnmc4mH8NT/iGpPWSUpBq1ohtXhhyLHs2kXPWvP5JORkAljB/UD3oaQEIANAQyuP5AgGgFd6+kCBZwuYjjMhsxWunawUQS8xIQm5iINKpUya+2mM+zgnDI7rXlgTbuTfSUlYzKO8yRmxeRs419aox0BkxUtncxFvlfic1IppGFkMeDLnAsFlscpkmBUa3FhgV4I68Mawsvyc16kA+zKpQ9eNegwFgrrz+TArOu0EyFkf9ahFFlnkkXkAFwypTaXbK5jGOj/PD8iZQM7p8bqVqI8AWc5ZTmMUQYIkTOY0gs1dHiRvJgH7cSpX0sdbXBGLDBx29sE2tTjo4b3rFlYwHRjXzOQHdekAbyEYIICUnTiRqWwqmWEXrvYlxlKlwhjGcyLTWNMTNIjMJB5yIV9ggGAe3x9BxIY4c5jCZoKElKDKBNZ2A+GZnM04+hnHdPZgHV9iUTxbQqLaDS5vGt74bYxAAwXYtgEvEzmdt8ipM0AwnmlAveSQxnA268mBhD5GM7r1oCo9YXiioLZX+cP4lxEjZ8Kl8TftFIjF7WAbIT9kBddyLAD38dHobzDJd17kGCnYAdDfAshWIPgxx1NvHJEBHM29Zf6MVZwUzxX8tUIwj3uY2CMQNOnwYSziYVYjo7jeccPGqsYctY4MaBlLmdzqYkOIVfEox/AT6tQ4iRPA6jCQpYP1siZMW4ue0dsE7Wb6m08Wcgylw2EYT/AAk0sdQhPuqFOPpXyXXXqCZgJO5HZW8iH+nKDOMVwc+TD5eqOnr2vZh1jXrRNWos5lQDCGrzieusPNHB3a80rxeZ9hta3CbgAsZ6PRJmWDocYQdeTpLskbM4xuQSdMeIAXe65pAt7q2x4M4O1qzfUeWZbvF4xgkap/0IsRdNVLUvCLar96Va+ioQk427Vqv3OaHPho+62rN/TSfQM8zH5zc88b5L3guao+1cUCpjiuhBG84dxtZjhWwLPVcxtk2L190bq61AndtKUA7VuDVY727Q9RmO6nTH1IHXCTx5aNKTY6yzVqv4dCo4DgGB9X9eVe7sLE8HOqrnFmC/1qgLZ0uPy/BbQ3ndcOWg8aBaZRdwF/x91xmwl1kniJPyYl4wguj5zknZSmG74j8k5NCglyLmQFFcbyNcdhj3k70hUrsYWHycmZzrGDdZiSdY9D4NH4WUsAsyN5GYnoWUajSgIA+Ju+6k+cMDiVCXiH2u8WT+8mu0ZhwvqpbkMzMTzKC7sFMy00ekD9SoO8l2jazFZNK3R0F99QdTE4qrQIMMu15vY7v1Xb/YSqT26jpq320G0wTxNwvE+bO2doeFHl+C9zdbV7d1YFjGYR8vxu87QPXOz5pUaaFPWRuvUyEzUBD3W9utVZbdv/HXXAfn8LBkuTbRW1b5hro6zYMtc5qj4+XB7QVuWYVe42WjWiajjWh7RRNGytx4O/a82a+j0rpm2V29TUbzR8mtFShBwc8RG3umdP0HZzpZm5z7pzqabNKUCb2QStEQ6+rOovGuWqQb5blCnPsK7e5/gWKSqmBWg/Mul9/2Vi6t6qvu5s05E1LbxT/U5ZjQn8unW3WPfTJU/eYs2a55XcHnzSN1xsWm4QpuD5ak39Ypfpl4JWFN9He4Oqyz2uY9MXmqv/6KSuSvCZDjjgwyOGwknWrPmS00aCa18/6NOqPuJ73a2jd08/5PMOtoWe5L5F3y4e5FmuL7zADV7jVV7un3ml13mfG1W9otOIOoD5vlpzk+/riFatoO3XCkFxjL9X3AYs9mTne7jH+mmXqy97dXvUdqxz/W2XF/Jf43ucXm6k7uF7/Fox7maPd69eoSZCL+YkBthIylS2cFM8PMgGi1vRc1hf5NYJewAPckNk4Mks4BDWUyOoMIFqcT8IdfrpJyfnxni2F1EyidxDeYxxVFjGMbFpaKRJ5M7hMSawhZnxcis/NSB0ImdxMKcyoznhIzzK38cvG0835d+ds5hBnbcIciYxwL3xeBkx9IO8n93ZQIJMYAP/zJ2l14sAjmm9X+qKgZUus9upOO0++37F+/UUvKBIdG8r7oZS0zZN2+yU8hQZwInO9jCPdK7TGpK+s6J72ZxDgWz7bv/b753KfVNpTxFZRygkFynrtYVJfNPpJeb5ZvnRNO40ulKOpFfR07RRy9v+nfYYODws3WO6e3qNHCHZ+ZSvmakve4/Xe6WTDHCu69Qlw81iDEXsX0kvSvfTi9o2c/eRcvt31vMOmENuxNe9h8OZwH5MIWMZGwgazAEeDHuXpppXiP9Df23h/0srI0Sm4DG+7dbWZHvHaJUdQYgQi/+GBUFCHnUwmMwY7uC57SpT/vq0Fm/ZB16hzhmBzrwLGbiLV3mGfeAUX/XSdyEbGbbxLlFXgvv7tDeV1T/ebZ16tqubVb3V57yyUWXZ8SSNHQu20KP5E2os48746fb8e+TXXfPSHVWyHU75h9z+jqtl/w1EuMGNm8hFJAAAAABJRU5ErkJggg==',
      'memo-paris': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGsAAAAoCAQAAABTesxFAAAKPUlEQVR42uWZe7BddXXHP+u3z7k3D4h52ISUhCpgpIMdkToBahRMpBhRFBwKVbHGQdoShBTpjKKtpsOI05nKdJiOjuCAJEMUqYUkJEIMEqyxkDEGWvMYmBAkhSSEhEdIcu85e3/6x97n3H0fgUwzkjr9/bXP77HWb72+v7XWCTCAYPAwHPxz2A4wHHF+2IjiUDTKldfnM+hnIiIfNJPhYEqHcan/S8PUVdJkjmEUBXtjZyVaMSB+gOfwt+ynTSJoAkEfX4jtRrnNhMxgYaWCjCAI+vhqbPEDzGM/PfQATSCjAHJyJNFDooc9XBu7wFksoKPlJokmu5gf+wf4ROFb+DoNJAGJQFp8MbaVe0xRgKfzcc5mBuNp0s8LbOVe7oz/hg6lUgOfd/i4Csy6JsZ/HGHPXPDLvv5o+3YA/3okGsYgPn8zwp7Z1VoGHu93PVDNb3aDu6vvHS4wVQEFNIAHuJapfJbxSAAFic/4bXIjNCJ3PBeSU5AACfbwPbazAbiHl5jM5UyuzrZZwhNIMIk/5n0UwIuVjZYTvJ3L6a30mZNxUazsKrgw8elBfPbyXZ5lY7kWuWdyF9MpgA1cy3/Qz1Su4jpypnATZ3tZ7CstOmCzr6ktC7Uwt99ZHR0ZzrWwbVHpXr89xOO/pLbN1Sdt1OY/5QF1j28rowLAFV0+ufobx5drZuBZ9pubd/l8tR5TnuZutc/cp51c43Kz2rKl/sQxhgEJDHvM2FXFDQTS5EJAgJALiGqtHAfN7DG6Z1/trrQYa2ajdKxYzNc6VMCwacbLQIMAEgXTOacGXBfQBFIXzHaUfAz0WJYwiTYNEgtjl03DsGHiBnbRIKOfOXwzJEGCkDxyBHayvTI/XOyYKE0/kfOBJ9k9cMXIycPu2WYNWYvIKSL3JKeb+BbPMoqiUk8eOQXwFDsBEfnzDkWbXIrsqu4A0Kz4pJAFnEKbjMReVhrkYRhtiJ08DOQ0aXO5MyM3S4Og/jluBQqCgt/nbKBhMJvptPlnnhsQayjuDn2O7OFB/i6KeJltjKZdWyuAx1hUxXBwjlMjt8fgPKYT/BNbql1l5GNE7jH8JZIQWBfP1V68ZPBwhZtBxjUMeDyQARO5g1fJgIKMDwNFyEeRbTzI7x3ynYsalWREzts4oYqJK/kozw55eCdwCzkZQc5kPlDZ8iNk7OXHTKgCAXqAIAHv5XioxPrPrqNS3XB9NRPILEdFMdhavTzNmkoouNCJ0fZ4ziVYwzOMOoxHvE07dAa3YGmjeCyWRWuICsbxBL/ACiHnQfQ7no8jq9nEuEGqLk+chhSVX+wdxvWVai0IpnBqXeoGkKJgcddZpjLbYA5TyLmHds2VYkRrJeCtrHYtazmr0jKmzrs0JB26gyBIyEz/CLiEiQR3Rk5rBHVNqewH0DdsdV+loKCglxPqYvUCbTOW8zwZInBFyCeQraxmdI1dOmRs9XIGZzFpYG8UaF0NGXAAWMZLJKBgLJ8G5hE8w4M2a9SiS/2YGoV8mFhF94ylgQbHljTjFe6DKn050/OYSbA0DtBbs1GMKJbAbi7ifG6kr5oLiCKGQkoLYgf3AzkBXOBHOANZGS8xpiaWryHKa0EWg2OrIAzurul+MRMouLcL+52Mbtg1K+IvsyxWxPVc2dG0mSc7dkSOyyv8gj/gNiRYBOTDLpmAHbXL9w4Tq7eiWmLli8PdKQ/5OdvJKiR6M/I4jx4S2oeOBhPMzPgh/YyHKJjJZj41kGEOADc/qdwQeplEsJF1Q9Q38CRsrfwpgKnDbnMcjWot2M36uljtkp0RL7Kqe7BNsDT6qsezzogRvV3akUMcZD7/BgbvrFRU94ommOK5yg079l4afaZanNS9YDUHuqDxh0ZtTzI4odpVIOvjBVMa4qOlphZ34yfjID8aFlHFId+t7nrcGj+wEfLh7vXoZtiNyrWWdc82kbsgCho1WM8BozDFdn5EkJOAmUwbyNUx5IzOXoJvAalM5jMzDlZ6T2b8kidJFOQE6+KxKsdzUD2alTkhmVkNciWZkZnZtDfavpf310TKwlIkMzBYwS6y6kV6nMfMzMhqHpR3+AA3sL/a+ybOreiUCfJY5gIZLRqsYrkp2gnC6I+cE4ExjIs88niJ1V0x7oVoR06DMV12/ZFHf5kTRn/kNfjtZ2/k0Y48WtHnu1nE6M6zGkbLjBnAFMZGO4w9LAcKCuCHUUQeOYnxXRu2Sz5RmGIzVxAEOXK9E6JlZhZ55MznJHJymjzNFd12gNO82Bt9xZa5a7zK9xjOtrDftvucAb7Ha1xuYcu2LdtucYGXOBqc5iVe4zbbtmzZdp8L/JgXe6nzXeTL6n7bXgaGp3iF91jYUlf6BWcazrVlny0Peip4vn/lv1Z8+m37uFf7SSdAWWx6pX1qn7rakwE81qs8aJ+5usV31NJB5w+pRu8Hx/u0qvcC+P0Rq9654NUezvgcjFBhLwHHuk3VpQDV99DxwVp1fI6bqtk9rvBufz1AzakDeNsANrKCfTQJoMUoVkG86I2cT4t/AWAlE+inSX+FWwLBs8AmlnGgBhmpSojatJAGDaSHTQCs5S5ajKZB0McxPADxql/hXDJuMkK+wxn0kYA2OUGiIPFUyTFys3jIs/gsn2AGE5hbuf1OHuT2eAhMHRf8nes8RQEmTuIkxpFo8wwb45WykTSo81QDy265NDBXfoeOoICRZ0esXBzOpZpNA73AQ1GrJ18GKfJhbbYhncPfMWvVBSE6FXbI/49xxNaqO+vg+eE6HHCywW41rDE+Ar2j5RbZyAKMrIpDr5vKNZPpKHfFD3fezBjo4nZnGwNCViJN9NijKpDX+aj/7lofcWG3wRngBH/hNwasZgZ+3kf8qY+4wR/7lmpfAhf5leorge9yjZv8tcvqTdM3WqwlbvKT/oXXqtfVsoHLLWx5olFezAxc5G+8yHl+zidcW7Y1TeAWv186n8lJ7nCRf+KHfNJnHPVa7vrbFOtOl1S/lrmuiptk8pd+0Y3e1Ik5M/BWH672zlOndOLH9d7eaeV4mjoTwOP8B3teL0oPXc0e2ch5qycyium8n5vL60fumZzMN8m42uvjQBfpZKpzaDKWr3M/u4yqvktVKVIYbGIND/lTtnJf/P3IePpGWOs76lNud4e3l219G+DtPuRUZ1l4ac0xbzZ3lVvUlU4t3csE/srF1VeATRe4xCfUu212cPGNj61HPcVTndZ1wHCae3zBzW5T76vmMvA21xke51bv6ICBCdxQimWAb3YWgE3/TD3tfwsaR+qEwfOxufOfZWiKwo/RZjYZGXNYyOTYaec/kP6QHV7DUm+Jn5lFpx6wajC0OZ37fV/8LFpuOey20G/BWstcYbK30n0Y9rjdhd09B70ByqaBd7q+ctKVbndc5w3zv/xBFwl7/J7Pu8oH3ONtNo4GwAf4bt85GK0c7QW+yWRWlX1/2skqPN051fUne1lV8wY4y3dV1MrH+Dy/5Jc97/WzlaP1YMeRnDkSS/0PhDv8/djhxaoAAAAASUVORK5CYII=',
      'penhaligons': 'data:image/png;base64,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',
      'tiziana-terenzi': 'data:image/png;base64,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',
      'the-merchant-of-venice': 'data:image/png;base64,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',
      'lancome': 'data:image/png;base64,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',
      'estee-lauder': 'data:image/png;base64,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'
    };
    // ── kraj sličica


    // ═══════════════════════════════════════════════════════════════════
    //  STIL — ide u shadow root chata
    // ═══════════════════════════════════════════════════════════════════
    // Svi selektori počinju s ":host .vfrc-widget", pa su jači od Voiceflowovih
    const W = ':host .vfrc-widget';
    const PROZOR = W + ' .vfrc-chat';
    const ZAGLAVLJE = PROZOR + ' > .vfrc-header';
    const SKLOPLJENO = ':host([' + OZNAKA + '~="sklopljeno"]) .vfrc-widget';
    const PORUKE = PROZOR + ' > div:has(> .vfrc-chat-dialog)';             // dio koji se pomiče (poruke)
    const RED_UNOSA = W + ' div:has(> .vfrc-input-container)';
    const OKO_POLJA = W + ' .vfrc-footer div:has(.vfrc-input-container)';
    const NAPOMENA = RED_UNOSA + ' > .vfrc-input-container ~ div';          // "Powered by...", upozorenje o AI-ju
    const PLOCA_POCETKA = W + ' div:has(> ' + START + ')';
    const NA_DNO = W + ' .vfrc-footer button:not(.vfrc-button):not(.vfrc-input-container button)';
    const KORISNIK = W + ' .vfrc-user-response > div';
    const MARTI = W + ' .vfrc-system-response .vfrc-message:not([class*="vfrc-message--extension"])';
    const TIPKA = W + ' div:has(> .vfrc-typing-indicator)';
    const PILULA = W + ' .vfrc-system-response--actions .vfrc-button';
    const POSALJI = W + ' #vfrc-send-message';
    const PRAZNO = W + ' .vfrc-input-container:has(.vfrc-chat-input:placeholder-shown) #vfrc-send-message';
    const GLAVNI = [W + ' ' + START, W + ' .vfrc-prompt .vfrc-button:first-child'];
    const SPOREDNI = W + ' .vfrc-prompt .vfrc-button:last-child:not(:first-child)';
    // Ikone ponuđenih odgovora (tanke linije; neke s malim punim krugom sa
    // znakom). "currentColor" je boja linija i kruga, "#fff" boja znaka u krugu; za
    // svaku ikonu se izrade dvije verzije: tamna (obična pilula) i svijetla
    // (pilula ispunjena tintom, pod mišem ili prstom)
    const IKONE_GUMBA = {
      savjetnik: '<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="16.5" width="24" height="27.5" rx="4"/><path d="M14 14 V16.5 M18 14 V16.5"/><rect x="11" y="6.5" width="10" height="7.5" rx="1.2"/><path d="M9 22 V30"/><path d="M35.2 20 V12.3 A2.3 2.3 0 0 1 39.8 12.3 V20 Z"/><rect x="33.5" y="20" width="8" height="4" rx="0.8"/><path d="M34.6 24 H40.4 A3.6 3.6 0 0 1 44 27.6 V41.5 A2.5 2.5 0 0 1 41.5 44 H33.5 A2.5 2.5 0 0 1 31 41.5 V27.6 A3.6 3.6 0 0 1 34.6 24 Z"/><path d="M34.2 33.6 H40.8"/></g>',
      narudzba: '<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 L21 2.5 L40 11 L22 19.5 Z"/><path d="M3 11 V32 L22 40.5 V19.5"/><path d="M40 11 V24"/><path d="M22 40.5 L24.45 39.34"/><path d="M9.84 14.06 L27.84 5.56 M14.4 16.1 L32.4 7.6"/><path d="M9.84 14.06 V18.66 L14.4 20.7 V16.1"/></g><circle cx="36.5" cy="36" r="9.5" fill="currentColor"/><path d="M32.3 36.3 L35.3 39.2 L40.8 33.3" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      loyalty: '<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 7.57 10.25 H 40.43 A 3.71 3.71 0 0 1 44.14 13.96 V 33.04 A 3.71 3.71 0 0 1 40.43 36.75 H 7.57 A 3.71 3.71 0 0 1 3.86 33.04 V 13.96 A 3.71 3.71 0 0 1 7.57 10.25 Z"/><path d="M 14.46 27.32 C 11.49 25.09 9.37 23.29 9.37 20.85 C 9.37 19.05 10.75 17.78 12.34 17.78 C 13.29 17.78 14.04 18.2 14.46 18.94 C 14.88 18.2 15.63 17.78 16.58 17.78 C 18.17 17.78 19.55 19.05 19.55 20.85 C 19.55 23.29 17.43 25.09 14.46 27.32 Z"/><path d="M 25.06 19.79 H 36.72 M 25.06 25.09 H 31.95"/></g>',
      reklamacija: '<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.42 16.86 L23.66 11.08 L36.58 16.86 L24.34 22.64 Z"/><path d="M11.42 16.86 L11.42 31.14 L24.34 36.92 L24.34 22.64"/><path d="M36.58 16.86 L36.58 31.14 L24.34 36.92"/><path d="M16.07 18.94 L28.31 13.16 M19.17 20.33 L31.41 14.55"/><path d="M16.07 18.94 L16.07 22.07 L19.17 23.46 L19.17 20.33"/><path d="M6.33 32.24 A19.5 19.5 0 1 0 9.06 11.47"/><path d="M9.02 4.64 L9.06 11.47 L15.79 10.32"/></g>',
      placanje: '<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 31 H6 A3 3 0 0 1 3 28 V10 A3 3 0 0 1 6 7 H33 A3 3 0 0 1 36 10 V24.5"/><path d="M3 13.5 H36"/><path d="M8 21 H14"/><ellipse cx="35" cy="31" rx="9" ry="3.4"/><path d="M26 31 V41 A9 3.4 0 0 0 44 41 V31"/><path d="M26 36 A9 3.4 0 0 0 44 36"/></g>'
    };
    // ikona kao data: adresa, u zadanim bojama (linije i krug / znak u krugu)
    function ikonaGumba(ime, boja, znak) {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">' +
        IKONE_GUMBA[ime].replace(/currentColor/g, boja).replace(/#fff/g, znak) + '</svg>';
      return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
    }
    const VISINA_TRAKE = 64;              // px, traka s natpisom (Voiceflowovo zaglavlje je 56 px; malo deblja, da dva reda natpisa dišu)
    const VRH_NATPISA = Math.round((VISINA_TRAKE - 37) / 2) - 2;   // natpis u dva reda (24 + 2 + 11 px) optički u sredini trake (slova su niže u svom retku)

    // fino zrno (kao na fotografiji), da topla crna ne djeluje plastično
    const ZRNO = 'url("data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="z"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>' +
      '<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter><rect width="100%" height="100%" filter="url(#z)"/></svg>') + '")';

    const CSS = `
      :host {
        --mx-j-tama: ${B.tama};
        --mx-j-bjelokost: ${B.bjelokost};
        --mx-j-bjelokost-0: ${prozirna(B.bjelokost, 0)};
        --mx-j-papir: ${B.papir};
        --mx-j-tinta: ${B.tinta};
        --mx-j-tinta-55: ${prozirna(B.tinta, .55)};
        --mx-j-tinta-30: ${prozirna(B.tinta, .3)};
        --mx-j-tih: ${B.tih};
        --mx-j-linija: ${B.linija};
        --mx-j-puder: ${B.puder};
        --mx-j-roza: ${B.roza};
        --mx-j-roza-0: ${prozirna(B.roza, 0)};
        --mx-j-roza-60: ${prozirna(B.roza, .6)};
        --mx-j-roza-35: ${prozirna(B.roza, .35)};
        --mx-j-font: ${P.font};
        --mx-j-font-natpisa: ${P.fontNatpisa};
        /* sjena bijele kartice na bjelokosti: tanka topla linija i meka sjena ispod */
        --mx-j-sjena: 0 0 0 1px rgba(60, 40, 30, .05), 0 10px 26px -16px rgba(60, 40, 30, .32), 0 2px 5px -3px rgba(60, 40, 30, .12);
        --mx-j-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-j-meko: cubic-bezier(.45, 0, .2, 1);
        --mx-j-sklapanje: cubic-bezier(.45, 0, .18, 1);   /* sklapanje i širenje pozornice: krene odmah, dugo usporava */
      }

      /* ═══ PROZOR: topla bjelokost (oblik i mjere ostaju Voiceflowovi) ═══ */
      ${PROZOR} {
        background: var(--mx-j-bjelokost);
        color: var(--mx-j-tinta);
        font-family: var(--mx-j-font);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* ═══ TRAKA GORE: topla crna, natpis MARTI · AI ASISTENTICA i tanke ikone ═══ */
      ${ZAGLAVLJE} {
        position: relative;
        z-index: 3;
        flex: none;
        box-sizing: content-box;
        height: ${VISINA_TRAKE}px;
        margin: 0;
        padding: env(safe-area-inset-top, 0px) 6px 0 14px;   /* desno: ikona X završava gdje i poruke */
        border-radius: 0;
        background: var(--mx-j-tama);
        box-shadow: none;
      }
      /* isto fino zrno kao na pozornici, da traka i pozornica budu jedna ploha */
      ${ZAGLAVLJE}::before {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: -1;
        background: ${ZRNO};
        opacity: .07;
        pointer-events: none;
      }
      /* bez Voiceflowove slike i naslova: u sredini je natpis MARTI i ispod
         njega AI ASISTENTICA; Voiceflowov naslov ostaje u kodu za čitače
         zaslona (natpis je ukras) */
      ${ZAGLAVLJE} > .vfrc-avatar { display: none; }
      ${ZAGLAVLJE} .vfrc-header--title {
        margin: 0;
        font-size: 0;
        line-height: 0;
        color: transparent;
      }
      ${ZAGLAVLJE} .vfrc-header--title::after {
        content: ${tekst(String(P.natpis || '').toUpperCase())};
        content: ${tekst(String(P.natpis || '').toUpperCase())} / "";
        position: absolute;
        top: calc(env(safe-area-inset-top, 0px) + ${P.podnatpis ? VRH_NATPISA : 0}px);
        left: 50%;
        transform: translateX(-50%);
        padding-left: .34em;                  /* optički centrira razmaknuta slova */
        font-family: var(--mx-j-font);        /* isti font kao poruke (Jost) */
        font-size: ${P.podnatpis ? 16 : 16}px;
        font-weight: 500;
        line-height: ${P.podnatpis ? 24 : VISINA_TRAKE}px;
        letter-spacing: .34em;
        white-space: nowrap;
        color: var(--mx-j-puder);
        pointer-events: none;
      }${P.podnatpis ? `
      /* 2. red: AI ASISTENTICA, sitno i razmaknuto, prašnjava roza */
      ${ZAGLAVLJE} .vfrc-header--title::before {
        content: ${tekst(String(P.podnatpis).toUpperCase())};
        content: ${tekst(String(P.podnatpis).toUpperCase())} / "";
        position: absolute;
        top: calc(env(safe-area-inset-top, 0px) + ${VRH_NATPISA + 26}px);
        left: 50%;
        transform: translateX(-50%);
        padding-left: .34em;
        font-family: var(--mx-j-font);
        font-size: 9.5px;
        font-weight: 400;
        line-height: 11px;
        letter-spacing: .34em;
        white-space: nowrap;
        color: var(--mx-j-roza);
        pointer-events: none;
      }` : ''}
      /* gumbi: samo svijetle ikone, bez kruga */
      ${ZAGLAVLJE} .vfrc-header--button {
        position: relative;
        width: 38px;
        height: 38px;
        padding: 9px;
        border-radius: 50%;
        color: ${prozirna(B.puder, .82)};
        background: transparent;
        box-shadow: none;
        transition: background-color .3s var(--mx-j-meko), color .3s var(--mx-j-meko), transform .3s var(--mx-j-glatko);
      }
      ${ZAGLAVLJE} .vfrc-header--button:hover { color: #fff; background: rgba(255, 255, 255, .07); }
      ${ZAGLAVLJE} .vfrc-header--button:active { transform: scale(.94); }
      ${ZAGLAVLJE} .vfrc-header--button:focus-visible { outline: 1px solid var(--mx-j-roza); outline-offset: 2px; }

      /* ═══ POZORNICA S TRAKAMA LOGOTIPA (umetnuta ispod trake) ═══ */
      :host .mx-j {
        position: relative;
        z-index: 4;                           /* natpis ispod nje sjedne u traku kad se sklopi */
        flex: none;
        font-family: var(--mx-j-font);
        -webkit-user-select: none;
                user-select: none;
      }
      :host .mx-j-scena {
        position: relative;
        height: var(--mx-j-visina, 230px);
        overflow: hidden;
        background: var(--mx-j-tama);
        transition: height .9s var(--mx-j-sklapanje);
      }
      /* zrno preko cijele pozornice */
      :host .mx-j-scena::after {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        background: ${ZRNO};
        opacity: .07;
        pointer-events: none;
      }
      /* trake: u sredini pozornice */
      :host .mx-j-trake {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--mx-j-razmak-traka, 14px);
        /* širenje: logotipi se pojave tek kad se pozornica već malo otvorila */
        transition: opacity .6s var(--mx-j-meko) .25s;
      }
      :host .mx-j-traka {
        position: relative;
        flex: none;
        height: var(--mx-j-logotip, 34px);
        overflow: hidden;
      }
      /* logotipi uz rubove tiho izblijede: prijelaz boje pozornice preko
         rubova (a ne maska, koju iOS uz animaciju zna nacrtati prazno) */
      :host .mx-j-trake::before, :host .mx-j-trake::after {
        content: "";
        position: absolute;
        top: 0; bottom: 0;
        width: var(--mx-j-rub, 56px);
        z-index: 2;
        pointer-events: none;
      }
      :host .mx-j-trake::before { left: 0; background: linear-gradient(90deg, var(--mx-j-tama), ${prozirna(B.tama, 0)}); }
      :host .mx-j-trake::after { right: 0; background: linear-gradient(270deg, var(--mx-j-tama), ${prozirna(B.tama, 0)}); }
      /* tok: dva ista reda logotipa jedan za drugim; pomakne se za točno
         jedan red, pa se vrati na početak bez skoka */
      :host .mx-j-tok {
        position: absolute;
        top: 0; left: 0;
        display: flex;
        align-items: center;
        height: 100%;
        width: max-content;
        animation: mx-j-lijevo var(--mx-j-trajanje, 70s) linear infinite;
      }
      :host .mx-j-traka-desno .mx-j-tok { animation-name: mx-j-desno; }
      :host .mx-j-red {
        display: flex;
        align-items: center;
        flex: none;
        gap: var(--mx-j-razmak, 46px);
        padding-right: var(--mx-j-razmak, 46px);     /* razmak i između kraja reda i njegova ponavljanja */
      }
      :host .mx-j-logotip {
        display: block;
        flex: none;
        height: var(--mx-j-logotip, 34px);
        width: auto;
        max-width: calc(var(--mx-j-logotip, 34px) * var(--mx-j-sirina, 3.6));
        object-fit: contain;
        opacity: var(--mx-j-prozirnost, .88);
        /* bijela sličica se oboji bojom logotipa (ako je bijela, ništa se ne mijenja) */
        filter: var(--mx-j-boja-logotipa, none);
      }
      :host .mx-j-logotip[data-mx-nema] { display: none; }    /* sličica se nije učitala */
      @keyframes mx-j-lijevo {
        from { transform: translate3d(0, 0, 0); }
        to   { transform: translate3d(-50%, 0, 0); }
      }
      @keyframes mx-j-desno {
        from { transform: translate3d(-50%, 0, 0); }
        to   { transform: translate3d(0, 0, 0); }
      }
      /* tanka roza crta na granici tame i bjelokosti; ispod nje poruke koje
         klize prema gore tiho nestanu u bjelokosti */
      :host .mx-j::after {
        content: "";
        position: absolute;
        left: 0; right: 0;
        bottom: -18px;
        height: 18px;
        background:
          linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza-60) 50%, var(--mx-j-roza-0)) top / 100% 1px no-repeat,
          linear-gradient(180deg, var(--mx-j-bjelokost), var(--mx-j-bjelokost-0));
        pointer-events: none;
      }
      :host .mx-j-sklopljeno .mx-j-scena { height: 0; }
      /* sklapanje: logotipi prvo izblijede, pozornica se za njima sklopi */
      :host .mx-j-sklopljeno .mx-j-trake { opacity: 0; transition: opacity .4s var(--mx-j-meko); }
      :host .mx-j-sklopljeno .mx-j-tok { animation-play-state: paused; }
      :host .mx-j-sklopljeno::after {
        background:
          linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza-35) 50%, var(--mx-j-roza-0)) top / 100% 1px no-repeat,
          linear-gradient(180deg, var(--mx-j-bjelokost), var(--mx-j-bjelokost-0));
      }
      /* bez prijelaza (chat se otvori na postojećem razgovoru) */
      :host .mx-j-odmah .mx-j-scena, :host .mx-j-odmah .mx-j-trake { transition: none; }

      /* ═══ PORUKE ═══ */
      ${PORUKE} { padding-top: 14px; }
      /* Voiceflowov uvod (veliki avatar i naslov) više ne treba: tu je pozornica */
      ${W} .vfrc-assistant-info { display: none; }

      /* avatar uz Martine poruke: crni krug s natpisom M (iz Voiceflowa) */
      ${W} .vfrc-system-response > .vfrc-avatar {
        background-color: var(--mx-j-tama);
        box-shadow: 0 0 0 1px rgba(60, 40, 30, .06), 0 6px 14px -8px rgba(30, 20, 14, .55);
      }

      /* Martina poruka: bijela kartica */
      ${MARTI} {
        background: var(--mx-j-papir);
        color: var(--mx-j-tinta);
        border-radius: 18px 18px 18px 6px;
        box-shadow: var(--mx-j-sjena);
        font-family: var(--mx-j-font);
        font-size: 14.5px;
        font-weight: 400;
        line-height: 1.58;
        letter-spacing: .005em;
        animation: mx-j-pojava .6s var(--mx-j-glatko) backwards;
      }
      ${MARTI} > .markdown { padding: 12px 16px; overflow-wrap: anywhere; }
      ${MARTI} strong, ${MARTI} b { font-weight: 500; color: var(--mx-j-tinta); }
      ${MARTI} a {
        color: var(--mx-j-tinta);
        text-decoration: underline;
        text-decoration-color: var(--mx-j-roza);
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
        transition: text-decoration-color .2s ease;
      }
      ${MARTI} a:hover { text-decoration-color: var(--mx-j-tinta); }
      ${MARTI} hr { border: 0; height: 1px; background: linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza), var(--mx-j-roza-0)); }
      ${MARTI} ul, ${MARTI} ol { padding-left: 1.2em; }
      ${MARTI} li::marker { color: ${prozirna(B.tinta, .45)}; }

      /* kupčeva poruka: tinta, svijetli tekst */
      ${KORISNIK} {
        background: var(--mx-j-tinta);
        color: ${B.puder};
        border-radius: 18px 18px 6px 18px;
        padding: 11px 16px;
        box-shadow: 0 10px 22px -14px rgba(20, 14, 10, .6);
        font-family: var(--mx-j-font);
        font-size: 14.5px;
        font-weight: 400;
        line-height: 1.5;
        letter-spacing: .005em;
        animation: mx-j-pojava-desno .5s var(--mx-j-glatko) backwards;
      }

      /* Marti tipka: tri tople točkice u bijeloj kartici */
      ${TIPKA} {
        background: var(--mx-j-papir);
        border-radius: 18px 18px 18px 6px;
        box-shadow: var(--mx-j-sjena);
      }
      ${W} .vfrc-typing-indicator > span {
        background-color: ${prozirna(B.tinta, .55)};
        animation-name: mx-j-tocka;           /* trajanje i zastoj točkica ostaju Voiceflowovi */
      }
      @keyframes mx-j-tocka {
        0%, 60%, 100% { opacity: .3; transform: scale(.85); }
        25%           { opacity: 1; transform: scale(1.1); }
      }

      /* ponuđeni odgovori: pilule s tankim tamnim obrubom; pod mišem (ili
         dok je prst na njima) se ispune tintom */
      ${W} .vfrc-system-response--actions { gap: 8px; margin: 14px 0 6px; }
      ${PILULA} {
        min-height: 36px;
        padding: 8px 16px 9px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: var(--mx-j-tinta);
        box-shadow: inset 0 0 0 1px var(--mx-j-tinta-55);
        font-family: var(--mx-j-font);
        font-size: 13.5px;
        font-weight: 400;
        line-height: 19px;
        letter-spacing: .015em;
        transition: background-color .3s var(--mx-j-meko), color .3s var(--mx-j-meko), box-shadow .3s var(--mx-j-meko), transform .3s var(--mx-j-glatko);
      }
      @media (hover: hover) and (pointer: fine) {
        ${PILULA}:hover { background: var(--mx-j-tinta); color: ${B.puder}; box-shadow: inset 0 0 0 1px var(--mx-j-tinta); }
      }
      ${PILULA}:active { background: var(--mx-j-tinta); color: ${B.puder}; box-shadow: inset 0 0 0 1px var(--mx-j-tinta); transform: scale(.97); }
      ${PILULA}:focus-visible { outline: 1px solid var(--mx-j-tinta); outline-offset: 3px; }
      /* pilula s ikonom: ikona lijevo, tamna; kad se pilula ispuni tintom, svijetla */
      ${PILULA}[data-mx-ikona] {
        padding-left: 41px;
        background-position: 14px center;
        background-size: 20px 20px;
        background-repeat: no-repeat;
      }
${Object.keys(IKONE_GUMBA).map(function (k) {
  const sel = PILULA + '[data-mx-ikona="' + k + '"]';
  const tamna = ikonaGumba(k, B.tinta, B.papir), svijetla = ikonaGumba(k, B.puder, B.tinta);
  return '      ' + sel + ' { background-image: ' + tamna + '; }\n' +
    '      @media (hover: hover) and (pointer: fine) { ' + sel + ':hover { background-image: ' + svijetla + '; } }\n' +
    '      ' + sel + ':active { background-image: ' + svijetla + '; }';
}).join('\n')}

      /* Voiceflowove kartice i vrtuljak (ako ih Marti pošalje) */
      ${W} .vfrc-card {
        background: var(--mx-j-papir);
        color: var(--mx-j-tinta);
        border-radius: 18px;
        box-shadow: var(--mx-j-sjena);
        overflow: hidden;
      }
      ${W} .vfrc-card .vfrc-button {
        background: transparent;
        color: var(--mx-j-tinta);
        border-radius: 999px;
        box-shadow: inset 0 0 0 1px var(--mx-j-tinta-55);
        font-family: var(--mx-j-font);
        font-size: 13px;
      }
      ${W} .vfrc-card .vfrc-button:hover { background: var(--mx-j-tinta); color: ${B.puder}; }
      ${W} .vfrc-image { border-radius: 16px; box-shadow: var(--mx-j-sjena); }
      ${W} .vfrc-timestamp { color: var(--mx-j-tih); font-size: 10.5px; letter-spacing: .06em; }

      /* ekstenzije (npr. kartica proizvoda): bez Voiceflowova sivog okvira */
      ${W} .vfrc-message[class*="vfrc-message--extension"] {
        display: block;
        width: 100%;
        padding: 0;
        background: transparent;
        color: var(--mx-j-tinta);
      }

      /* kraj razgovora: tanke crte i natpis između njih */
      ${W} .vfrc-chat--status { margin: 22px 0 8px; }
      ${W} .vfrc-chat--status > div > div:nth-child(odd) {
        height: 1px;
        background: linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza));
      }
      ${W} .vfrc-chat--status > div > div:last-child { background: linear-gradient(90deg, var(--mx-j-roza), var(--mx-j-roza-0)); }
      ${W} .vfrc-chat--status > div > div:nth-child(2) {
        background: var(--mx-j-bjelokost);
        color: var(--mx-j-tih);
        font-family: var(--mx-j-font);
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

      /* ═══ DNO: polje za poruku je bijela kapsula s tankim toplim rubom ═══ */
      ${W} .vfrc-footer {
        position: relative;
        z-index: 3;
        flex: none;
        padding-bottom: env(safe-area-inset-bottom, 0px);
        background: var(--mx-j-bjelokost);
      }
      ${OKO_POLJA} { padding-left: 0; padding-right: 0; background: none; }
      ${RED_UNOSA}, ${OKO_POLJA}:has(> .vfrc-input-container) { padding: 0 14px; background: none; }
      ${W} .vfrc-input-container {
        min-height: 52px;
        padding: 7px 7px 7px 20px;
        border: 0;
        border-radius: 26px;
        background: var(--mx-j-papir);
        box-shadow: 0 0 0 1px var(--mx-j-linija), 0 10px 24px -18px rgba(60, 40, 30, .4);
        transition: box-shadow .35s var(--mx-j-meko);
      }
      ${W} .vfrc-input-container:hover { border: 0; }
      /* Voiceflowov okvir fokusa: tanji i topliji */
      ${W} .vfrc-input-container > div:first-child { border-radius: inherit; box-shadow: none; }
      ${W} .vfrc-input-container:focus-within { box-shadow: 0 0 0 1px var(--mx-j-tinta-30), 0 0 0 4px ${prozirna(B.roza, .28)}, 0 10px 24px -18px rgba(60, 40, 30, .4); }
      ${W} .vfrc-chat-input {
        background: transparent;
        color: var(--mx-j-tinta);
        caret-color: var(--mx-j-tinta);
        font-family: var(--mx-j-font);
        font-weight: 400;
        line-height: 22px;
        letter-spacing: .01em;
      }
      ${W} .vfrc-chat-input::placeholder { color: var(--mx-j-tih); opacity: 1; }
      ${W} .vfrc-chat-input::selection { background: ${prozirna(B.roza, .5)}; }
      ${W} .vfrc-input-container button:not(#vfrc-send-message) { border-radius: 50%; color: var(--mx-j-tih); background: transparent; }
      ${W} .vfrc-input-container button:not(#vfrc-send-message):hover { color: var(--mx-j-tinta); background: ${prozirna(B.roza, .25)}; }

      /* gumb za slanje: tamni krug kad ima što poslati; prazno polje → samo tiha strelica */
      ${POSALJI} {
        width: 38px;
        height: 38px;
        background: var(--mx-j-tinta);
        box-shadow: 0 6px 14px -8px rgba(20, 14, 10, .7);
        transition: background-color .3s var(--mx-j-meko), box-shadow .3s var(--mx-j-meko), transform .3s var(--mx-j-glatko);
      }
      ${POSALJI} svg { color: ${B.puder}; }
      ${POSALJI}:hover { cursor: pointer; transform: scale(1.05); }
      ${POSALJI}:active { transform: scale(.94); }
      ${PRAZNO} { background: transparent; box-shadow: inset 0 0 0 1px var(--mx-j-linija); transform: none; cursor: default; }
      ${PRAZNO} svg { color: var(--mx-j-tih); }

      /* gumb "na dno razgovora" */
      ${NA_DNO} { border: 0; background: var(--mx-j-papir); color: var(--mx-j-tinta); box-shadow: var(--mx-j-sjena); }

      /* napomena ispod polja ("Powered by...", upozorenje o AI-ju) */
      ${NAPOMENA} {
        padding: 9px 16px 11px;
        font-family: var(--mx-j-font);
        font-size: 10.5px;
        font-weight: 400;
        letter-spacing: .04em;
        color: var(--mx-j-tih);
      }
      ${NAPOMENA} a { color: inherit; }

      /* ═══ KRAJ RAZGOVORA I "NOVI RAZGOVOR?": bijela ploča odozdo ═══
         Jedna ploča uz dno prozora, zaobljena gore; donje kutove zaobli sam
         prozor (na mobitelu je ploča ravna uz rub zaslona). Kad razgovor
         završi, ploča je Voiceflowov .vfrc-footer__start-button (on je
         zaobljen sa svih strana i odmaknut od ruba); okvir s gumbom u njoj je
         samo sadržaj, inače bi bile dvije ploče jedna u drugoj, a unutarnja
         s oštrim donjim kutovima */
      ${W} .vfrc-footer__start-button,
      ${PLOCA_POCETKA}:not(.vfrc-footer__start-button *),
      ${W} .vfrc-prompt {
        padding: 18px 16px calc(28px + env(safe-area-inset-bottom, 0px));
        border: 0;
        border-radius: 22px 22px 0 0;
        background: var(--mx-j-papir);
        box-shadow: 0 0 0 1px rgba(60, 40, 30, .05), 0 -18px 40px -24px rgba(40, 26, 18, .45);
      }
      ${W} .vfrc-footer__start-button ${'div:has(> ' + START + ')'} {
        padding: 0;
        border: 0;
        border-radius: 0;
        background: none;
        box-shadow: none;
      }
      /* dok razgovor tek kreće (otvaranjem chata), Voiceflowova ploča s gumbom se ne vidi */
      ${PROZOR}:not(:has(.vfrc-system-response, .vfrc-user-response)) .vfrc-footer__start-button,
      ${PROZOR}:not(:has(.vfrc-system-response, .vfrc-user-response)) div:has(> ${START}) { visibility: hidden; }
      ${W} .vfrc-chat--overlay { background-color: rgba(20, 14, 10, .22); }
      /* zatamnjenje, ploča "Novi razgovor?" i izbornik uvijek iznad trake i pozornice */
      ${PROZOR} > .vfrc-chat--overlay { z-index: 6; }
      ${PROZOR} > .vfrc-prompt, ${PROZOR} > .vfrc-more-menu, ${PROZOR} > .vfrc-file-drop-overlay { z-index: 7; }
      ${GLAVNI.join(',\n      ')},
      ${W} .vfrc-prompt .vfrc-button {
        min-height: 48px;
        border-radius: 999px;
        font-family: var(--mx-j-font);
        font-size: 11.5px;
        font-weight: 500;
        letter-spacing: .24em;
        text-transform: uppercase;
        transition: background-color .3s var(--mx-j-meko), color .3s var(--mx-j-meko), transform .3s var(--mx-j-glatko);
      }
      ${GLAVNI.join(',\n      ')} {
        background: var(--mx-j-tinta);
        color: ${B.puder};
        box-shadow: 0 12px 26px -16px rgba(20, 14, 10, .8);
      }
      ${GLAVNI.map(function (s) { return s + ':hover'; }).join(',\n      ')} { background: #000; color: #fff; }
      ${SPOREDNI} { background: transparent; color: var(--mx-j-tinta); box-shadow: inset 0 0 0 1px var(--mx-j-tinta-55); }
      ${SPOREDNI}:hover { background: ${prozirna(B.tinta, .05)}; }
      ${GLAVNI.map(function (s) { return s + ':active'; }).join(', ')},
      ${W} .vfrc-prompt .vfrc-button:active { transform: scale(.98); }
      ${GLAVNI.map(function (s) { return s + ':focus-visible'; }).join(', ')},
      ${W} .vfrc-prompt .vfrc-button:focus-visible { outline: 1px solid var(--mx-j-tinta); outline-offset: 3px; }
      ${T.noviRazgovor ? `
      ${GLAVNI.join(', ')} { font-size: 0; letter-spacing: 0; }
      ${GLAVNI.map(function (s) { return s + '::after'; }).join(', ')} {
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

      /* ═══ POJAVA (samo prozirnost i mali pomak) ═══ */
      @keyframes mx-j-pojava {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: none; }
      }
      @keyframes mx-j-pojava-desno {
        from { opacity: 0; transform: translate(6px, 6px); }
        to   { opacity: 1; transform: none; }
      }
      @keyframes mx-j-prozirnost {
        from { opacity: 0; }
      }

      /* "Smanji pokrete": ništa ne klizi, sve se samo tiho pojavi */
      @media (prefers-reduced-motion: reduce) {
        :host .mx-j-scena, :host .mx-j-trake { transition: none; }
        :host .mx-j-tok { animation: none; }
        ${MARTI}, ${KORISNIK} { animation: mx-j-prozirnost .3s linear backwards; }
        ${W} .vfrc-typing-indicator > span { animation: none; opacity: 1; }
        ${POSALJI}, ${POSALJI}:hover, ${POSALJI}:active, ${PILULA}:active,
        ${ZAGLAVLJE} .vfrc-header--button:active { transform: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-jedan]');
      if (stari && stari.getAttribute('data-mx-jedan') === '1') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-jedan', '1');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // Fontovi (Jost i Cormorant Garamond iz mape fonts/) idu u <head>
    // stranice: fontovi iz <head> vrijede i unutar shadow roota. Ako ih je
    // neki drugi modul već učitao, ne učitavaju se opet.
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
            return '@font-face{font-family:"' + f[0] + '";src:url("' + KORIJEN + 'fonts/' + f[1] + '-' + r + '.woff2") format("woff2");' +
              'font-weight:' + f[2] + ';font-style:normal;font-display:swap;unicode-range:' + rasponi[r] + '}';
          }).join('\n');
        }).join('\n');
        document.head.appendChild(stil);
      }
      if (!document.getElementById('mx-pocetna-font-300')) dodaj('mx-pocetna-font-300', [['MX Jost', 'jost', '300']]);
      if (document.getElementById('mx-kartice-font') || document.getElementById('mx-pocetna-font') || document.getElementById('mx-tema-font') || document.getElementById('mx-jedan-font')) return;
      dodaj('mx-jedan-font', [['MX Jost', 'jost', '400 600'], ['MX Cormorant', 'cormorant-garamond', '500 700']]);
    }


    // ═══════════════════════════════════════════════════════════════════
    //  POZORNICA — element ispod Voiceflowova zaglavlja
    // ═══════════════════════════════════════════════════════════════════
    function el(oznaka, klasa, sadrzaj) {
      const e = document.createElement(oznaka);
      if (klasa) e.className = klasa;
      if (sadrzaj) e.textContent = sadrzaj;
      return e;
    }

    function napraviPozornicu() {
      const korijen = el('div', 'mx-j');
      korijen.setAttribute('role', 'presentation');
      const scena = el('div', 'mx-j-scena');
      const trake = el('div', 'mx-j-trake');
      const popis = Array.isArray(M.trake) ? M.trake : [];
      const redovi = [];                     // za svaku traku: kako je napuniti i provjeriti
      popis.forEach(function (t, i) {
        const logotipi = (t && Array.isArray(t.logotipi) ? t.logotipi : []).map(function (x) { return String(x || '').trim(); }).filter(Boolean);
        if (!logotipi.length) return;
        const traka = el('div', 'mx-j-traka' + (t.smjer === 'desno' ? ' mx-j-traka-desno' : ''));
        traka.style.setProperty('--mx-j-i', i);
        traka.style.setProperty('--mx-j-trajanje', broj(t.brzina, 70, 10, 600) + 's');
        const tok = el('div', 'mx-j-tok');
        traka.appendChild(tok);
        trake.appendChild(traka);
        // Traka nikad ne smije biti prazna: jedan red = svi logotipi trake,
        // ponovljeni K puta, tako da je red uvijek širi od pozornice. Tok su
        // dva ista reda (drugi je nastavak prvoga), pa se vrti bez skoka.
        let K = 0, ceka = 0;
        function napuni(k) {
          K = k;
          tok.innerHTML = '';
          ceka = 0;
          for (let r = 0; r < 2; r++) {
            const red = el('div', 'mx-j-red');
            if (r) red.setAttribute('aria-hidden', 'true');
            for (let q = 0; q < K; q++) {
              logotipi.forEach(function (ime) {
                const slika = document.createElement('img');
                slika.className = 'mx-j-logotip';
                // ugrađena sličica (odmah, bez mreže); ako je nema, datoteka iz marke/trake/
                slika.src = SLICICE[ime] || (KORIJEN + 'marke/trake/' + encodeURIComponent(ime) + '.png');
                slika.alt = r || q ? '' : ime.replace(/-/g, ' ');
                slika.draggable = false;
                if (!r) {
                  ceka++;
                  const gotovo = function () { if (--ceka === 0) provjeri(); };
                  slika.addEventListener('load', gotovo);
                  slika.addEventListener('error', function () { slika.setAttribute('data-mx-nema', ''); gotovo(); });
                }
                red.appendChild(slika);
              });
            }
            tok.appendChild(red);
          }
        }
        // kad su sličice tu (ili se promijeni širina): red mora biti barem
        // dvostruko širi od pozornice, inače se ponovi više puta
        function provjeri() {
          if (ceka > 0) return;                         // sličice se još učitavaju
          const red = tok.firstElementChild;
          const w = red ? red.getBoundingClientRect().width : 0, sir = scena.clientWidth;
          if (!(w > 0) || !(sir > 0)) return;
          if (w < sir * 2) napuni(Math.min(16, Math.ceil(K * sir * 2 / w)));
        }
        redovi.push(provjeri);
        // početna procjena: logotip je u prosjeku širok oko dvije svoje visine
        const h = broj(M.visina, 18, 8, 120), g = broj(M.razmak, 32, 0, 300);
        napuni(Math.max(2, Math.min(16, Math.ceil(2 * 480 / (logotipi.length * (2 * h + g))))));
      });
      scena.appendChild(trake);
      korijen.appendChild(scena);
      if (typeof ResizeObserver === 'function') new ResizeObserver(function () { redovi.forEach(function (f) { f(); }); }).observe(scena);

      // mjere traka iz postavki
      korijen.style.setProperty('--mx-j-logotip', broj(M.visina, 18, 8, 120) + 'px');
      korijen.style.setProperty('--mx-j-sirina', broj(M.sirina, 3.4, 1, 10));
      korijen.style.setProperty('--mx-j-razmak', broj(M.razmak, 32, 0, 300) + 'px');
      korijen.style.setProperty('--mx-j-razmak-traka', broj(M.razmakTraka, 12, 0, 100) + 'px');
      korijen.style.setProperty('--mx-j-prozirnost', broj(M.prozirnost, 0.55, 0.1, 1));
      korijen.style.setProperty('--mx-j-rub', broj(M.rub, 48, 0, 300) + 'px');
      if (B.logotip && String(B.logotip).toLowerCase() !== '#ffffff' && String(B.logotip).toLowerCase() !== '#fff') {
        // bijela sličica → zadana boja: potamni do crne pa oboji (SVG filter u data: adresi)
        const c = rgb(B.logotip).map(function (v) { return (v / 255).toFixed(3); });
        const filter = 'url("data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg"><filter id="b" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 ' + c[0] + '  0 0 0 0 ' + c[1] + '  0 0 0 0 ' + c[2] + '  0 0 0 1 0"/></filter></svg>') + '#b")';
        korijen.style.setProperty('--mx-j-boja-logotipa', filter);
      }

      let visina = 230, ziv = false, izmjereno = false;

      return {
        el: korijen,
        ziv: function () { return ziv; },
        // visina otvorene pozornice prema visini prozora chata; trake se
        // po potrebi smanje da stanu iznad natpisa
        mjeri: function (visinaProzora) {
          if (!(visinaProzora > 0)) return;              // prozor se još ne vidi (zatvoren chat)
          const p = P.pozornica || {};
          const min = broj(p.min, 92, 60, 600), max = Math.max(min, broj(p.max, 116, 60, 800));
          let v = Math.round(Math.min(max, Math.max(min, visinaProzora * broj(p.udio, 0.15, 0.1, 0.8))));
          if (visinaProzora < 520) v = Math.round(Math.max(76, visinaProzora * 0.16));    // vrlo nizak prozor (mobitel položen)
          if (v !== visina || !izmjereno) {
            visina = v;
            // prvo mjerenje bez prijelaza (pozornica ne smije "skočiti" pri otvaranju)
            if (!izmjereno) korijen.classList.add('mx-j-odmah');
            korijen.style.setProperty('--mx-j-visina', v + 'px');
            // tri trake moraju stati na pozornicu: ako ne stanu, logotipi i razmaci se smanje
            const n = trake.children.length || 1;
            const h = broj(M.visina, 18, 8, 120), r = broj(M.razmakTraka, 12, 0, 100);
            const prostor = v - 12;
            const treba = n * h + (n - 1) * r;
            const k = treba > prostor ? Math.max(0.4, prostor / treba) : 1;
            korijen.style.setProperty('--mx-j-logotip', (h * k).toFixed(1) + 'px');
            korijen.style.setProperty('--mx-j-razmak-traka', (r * k).toFixed(1) + 'px');
            if (!izmjereno) {
              void korijen.offsetHeight;
              if (!korijen.classList.contains('mx-j-sklopljeno')) korijen.classList.remove('mx-j-odmah');
              izmjereno = true;
            }
          }
        },
        // pozornica otvorena: trake se pojave ispočetka
        pokazi: function () {
          ziv = true;
          korijen.classList.remove('mx-j-ulaz', 'mx-j-spremno');
          void korijen.offsetWidth;                       // da se pojava ponovi
          korijen.classList.add('mx-j-ulaz', 'mx-j-spremno');
        },
        // chat zatvoren
        sakrij: function () { ziv = false; korijen.classList.remove('mx-j-spremno'); },
        // sklapanje: trake izblijede dok se pozornica sklapa
        sklopi: function (odmah) {
          ziv = false;
          korijen.classList.toggle('mx-j-odmah', !!odmah);
          korijen.classList.add('mx-j-sklopljeno');
          korijen.classList.remove('mx-j-ulaz');
        },
        rasiri: function (odmah) {
          korijen.classList.toggle('mx-j-odmah', !!odmah);
          korijen.classList.remove('mx-j-sklopljeno');
          if (odmah) { void korijen.offsetHeight; korijen.classList.remove('mx-j-odmah'); }
        }
      };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  VEZA S VOICEFLOWOM
    // ═══════════════════════════════════════════════════════════════════
    const S = { host: null, kor: null, pozornica: null, sklopljeno: false, otvoren: false, promatracVelicine: null, prozor: null, ceka: false, tipka: false, tipkaCeka: 0 };

    function kupacJeOdgovorio(kor) { return !!kor.querySelector('.vfrc-chat .vfrc-user-response'); }
    function imaRazgovor(kor) { return !!kor.querySelector('.vfrc-chat .vfrc-system-response, .vfrc-chat .vfrc-user-response'); }

    // Razgovor još nije krenuo: Voiceflow tada ima svoj gumb za početak (ploča se ne vidi, vidi CSS)
    function cekaPocetak(kor) {
      const g = kor.querySelector(START);
      if (!g || !g.parentElement) return false;
      const ploca = g.closest('.vfrc-footer__start-button') || g.parentElement;
      return !ploca.hasAttribute('inert') && getComputedStyle(g).display !== 'none' && !imaRazgovor(kor);
    }

    // stanje na elementu chata (za CSS): "otvoreno", "sklopljeno" ili "sklopljeno odmah"
    function oznaci(sklopljeno, odmah) {
      const h = S.host;
      if (!h) return;
      const v = sklopljeno ? (odmah ? 'sklopljeno odmah' : 'sklopljeno') : 'otvoreno';
      if (h.getAttribute(OZNAKA) !== v) h.setAttribute(OZNAKA, v);
    }

    function sklopi(odmah) {
      if (!S.pozornica || S.sklopljeno) return;
      odmah = !!odmah || MIRNO.matches;
      S.sklopljeno = true;
      oznaci(true, odmah);
      S.pozornica.sklopi(odmah);
    }

    function rasiri(odmah) {
      if (!S.pozornica || !S.sklopljeno) return;
      S.sklopljeno = false;
      oznaci(false);
      S.pozornica.rasiri(!!odmah || MIRNO.matches);
      if (S.otvoren) S.pozornica.pokazi();
    }

    // Treba li pozornica biti sklopljena: čim je kupac odgovorio (razgovor
    // je glavna stvar), ili dok na niskom prozoru tipka poruku (tipkovnica).
    // Sve ostalo (novi razgovor, razgovor koji je Voiceflow ispraznio,
    // ponovno otvaranje) vraća pozornicu i trake — stanje se čita iz
    // razgovora, ne pamti se
    function trebaSklopiti(kor) {
      if (kupacJeOdgovorio(kor)) return true;
      if (S.tipka && poljeAktivno(kor)) return true;
      return false;
    }
    function poljeAktivno(kor) {
      const a = kor.activeElement;
      return !!(a && a.classList && a.classList.contains('vfrc-chat-input'));
    }

    // Pozornica mora biti odmah ispod Voiceflowova zaglavlja (ako Voiceflow
    // iscrta prozor iznova, vrati se na mjesto)
    function prikvaci(kor) {
      const prozor = kor.querySelector('.vfrc-chat');
      const zaglavlje = prozor && prozor.querySelector(':scope > .vfrc-header');
      if (!prozor || !zaglavlje) return false;
      if (!S.pozornica) S.pozornica = napraviPozornicu();
      const el = S.pozornica.el;
      if (el.parentNode !== prozor || el.previousElementSibling !== zaglavlje) prozor.insertBefore(el, zaglavlje.nextSibling);
      if (S.prozor !== prozor) {
        S.prozor = prozor;
        if (S.promatracVelicine) S.promatracVelicine.disconnect();
        if (typeof ResizeObserver === 'function') {
          S.promatracVelicine = new ResizeObserver(function () { S.pozornica.mjeri(prozor.clientHeight); });
          S.promatracVelicine.observe(prozor);
        }
        S.pozornica.mjeri(prozor.clientHeight);
      }
      return true;
    }

    // Stanje prozora: pri svakoj promjeni u chatu (poruke, novi razgovor...)
    function uskladi() {
      S.ceka = false;
      const kor = S.kor;
      if (!kor || !prikvaci(kor)) return;
      if (trebaSklopiti(kor)) {
        // prvi odgovor kupca: pozornica se sklopi (dok je chat zatvoren, odmah)
        sklopi(!S.otvoren);
      } else if (S.sklopljeno) {
        // novi razgovor (gumb gore ili "Započni novi razgovor" nakon završenog):
        // Voiceflow isprazni razgovor i pozornica se s trakama odmah vrati,
        // još dok Marti tipka pozdrav (dok je chat zatvoren, bez animacije)
        rasiri(!S.otvoren);
      }
      if (S.otvoren) {
        // prozor se pojavio tek nakon otvaranja: flakon i razgovor kreću sad
        if (!S.sklopljeno && !S.pozornica.ziv()) S.pozornica.pokazi();
        zapocni();
      }
    }
    // (setTimeout, a ne requestAnimationFrame: radi i dok je kartica u pozadini)
    function uskladiUskoro() {
      if (S.ceka) return;
      S.ceka = true;
      setTimeout(uskladi, 0);
    }

    // Otvaranjem chata razgovor kreće sam (ako još ne postoji)
    function zapocni() {
      const kor = S.kor;
      if (!kor || !cekaPocetak(kor)) return;
      const g = kor.querySelector(START);
      try { g.click(); } catch (e) { /* nije bitno */ }
    }

    function otvoreno() {
      S.otvoren = true;
      const kor = S.kor;
      if (!kor || !prikvaci(kor)) return;     // prozor još ne postoji: uskladi() nastavi kad se pojavi
      S.tipka = false;                         // polje više nema fokus (prozor se tek otvara)
      if (trebaSklopiti(kor)) sklopi(true);    // postojeći razgovor: odmah sklopljeno, bez animacije
      else { rasiri(true); S.pozornica.pokazi(); }
      zapocni();
    }

    function zatvoreno() {
      S.otvoren = false;
      const p = S.pozornica;
      // animacija staje kad se prozor spusti (Voiceflow ga spušta 0,3 s)
      if (p) setTimeout(function () { if (!S.otvoren) p.sakrij(); }, 400);
    }

    // Voiceflow javlja otvaranje i zatvaranje chata porukom na window
    // ('{"type":"voiceflow:open"}' / '{"type":"voiceflow:close"}')
    function pratiOtvaranje() {
      window.addEventListener('message', function (e) {
        if (e.source && e.source !== window) return;
        let d = e.data;
        if (typeof d === 'string') {
          if (d.indexOf('voiceflow:') === -1) return;
          try { d = JSON.parse(d); } catch (x) { return; }
        }
        const tip = d && d.type;
        if (tip === 'voiceflow:open') otvoreno();
        else if (tip === 'voiceflow:close') zatvoreno();
      });
    }

    // Na niskom prozoru (mobitel) pozornica se sklopi čim kupac dotakne polje.
    // Samo na dodir ili klik: Voiceflow sam stavlja fokus u polje kad se chat
    // otvori, a to ne smije sklopiti pozornicu
    function pratiPolje(kor) {
      const granica = +P.sklopiNaFokus || 0;
      if (!granica) return;
      function dodir(e) {
        const put = e.composedPath ? e.composedPath() : [e.target];
        const polje = put.some(function (x) { return x && x.classList && (x.classList.contains('vfrc-chat-input') || x.classList.contains('vfrc-input-container')); });
        if (!polje) return;
        const prozor = kor.querySelector('.vfrc-chat');
        if (prozor && (MOBITEL || prozor.clientHeight < granica) && S.otvoren && S.pozornica) {
          clearTimeout(S.tipkaCeka);
          S.tipka = true;
          sklopi(false);
        }
      }
      kor.addEventListener('pointerdown', dodir, true);
      // kupac je napustio polje bez slanja (zatvorio tipkovnicu, dotaknuo nešto
      // drugo): pozornica se vrati — s malim zakašnjenjem, jer pritisak na
      // ponuđeni odgovor najprije makne fokus, a tek onda pošalje poruku
      kor.addEventListener('focusout', function (e) {
        if (!S.tipka || !(e.target && e.target.classList && e.target.classList.contains('vfrc-chat-input'))) return;
        clearTimeout(S.tipkaCeka);
        S.tipkaCeka = setTimeout(function () {
          if (!S.kor || poljeAktivno(S.kor)) return;
          S.tipka = false;
          uskladi();
        }, 350);
      }, true);
    }

    // Hrvatski natpisi gumba su u CSS-u (content); čitač zaslona dobije
    // hrvatsko ime (aria-label). Samo atribut, u chat se ništa ne umeće.
    // Ikone na ponuđenim odgovorima: gumb dobije atribut data-mx-ikona prema
    // svom tekstu (POSTAVKE: ikoneGumba); samo atribut, DOM se ne mijenja
    const IKONE_PO_TEKSTU = (function () {
      const m = {};
      Object.keys(P.ikoneGumba || {}).forEach(function (t) {
        const ime = P.ikoneGumba[t];
        if (IKONE_GUMBA[ime]) m[String(t).replace(/\s+/g, ' ').trim().toLowerCase()] = ime;
      });
      return m;
    })();
    function ikoneGumba(kor) {
      kor.querySelectorAll('.vfrc-system-response--actions .vfrc-button').forEach(function (g) {
        const ime = IKONE_PO_TEKSTU[String(g.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()] || '';
        if ((g.getAttribute('data-mx-ikona') || '') === ime) return;
        if (ime) g.setAttribute('data-mx-ikona', ime); else g.removeAttribute('data-mx-ikona');
      });
    }

    function imenaGumba(kor) {
      const parovi = [
        [T.noviRazgovor, START + ', .vfrc-prompt .vfrc-button:first-child'],
        [T.odustani, '.vfrc-prompt .vfrc-button:last-child:not(:first-child)']
      ].filter(function (p) { return p[0]; });
      parovi.forEach(function (p) {
        kor.querySelectorAll(p[1]).forEach(function (g) {
          if (g.getAttribute('aria-label') !== p[0]) g.setAttribute('aria-label', p[0]);
        });
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
      // Voiceflow više sam ne pokreće razgovor (to radi otvaranje chata) i
      // pamti razgovor koliko je zadano; loader.js ovo preda Voiceflowu
      const vf = window.MartimexVoiceflow = window.MartimexVoiceflow || {};
      vf.autostart = false;
      if (PAMCENJE) vf.assistant = Object.assign({}, vf.assistant, { persistence: PAMCENJE });

      ubaciFontove();
      pratiOtvaranje();
      cekajHost(function (host) {
        S.host = host;
        S.kor = host.shadowRoot;
        ubaciStil(S.kor);
        oznaci(false);
        pratiPolje(S.kor);
        new MutationObserver(function () { imenaGumba(S.kor); ikoneGumba(S.kor); uskladiUskoro(); })
          .observe(S.kor, { childList: true, subtree: true });
        uskladi();
        ikoneGumba(S.kor);
        // sličice logotipa se preuzmu unaprijed, kad preglednik miruje, da su
        // tu kad se chat otvori
        const kasnije = window.requestIdleCallback || function (f) { return setTimeout(f, 1200); };
        kasnije(function () {
          (Array.isArray(M.trake) ? M.trake : []).forEach(function (t) {
            (t && Array.isArray(t.logotipi) ? t.logotipi : []).forEach(function (ime) {
              if (SLICICE[String(ime || '').trim()]) return;          // ugrađena: nema što preuzimati
              const l = document.createElement('link');
              l.rel = 'prefetch';
              l.as = 'image';
              l.href = KORIJEN + 'marke/trake/' + encodeURIComponent(String(ime || '').trim()) + '.png';
              document.head.appendChild(l);
            });
          });
        }, { timeout: 2500 });
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_JEDAN.pokreni(); }
  catch (e) { console.warn('[Martimex] Chat na jednom ekranu nije pokrenut:', e); }

})();
