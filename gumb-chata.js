(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — efekti gumba koji otvara chat s Marti (v2)
  //
  //  Gumb u kutu ekrana ("Asistent") i dalje crta Voiceflow; ovaj modul mu
  //  dodaje nekoliko detalja u istom duhu kao kartice proizvoda:
  //
  //   - roza tekućina: bijela slova "Asistent" i bijeli oblačić u ikoni
  //     neprestano se polako pune rozom tekućinom. Površina tekućine se
  //     blago valja (dva vala u različitim nijansama idu jedan preko
  //     drugoga), a kad se sve napuni, tekućina se naglo ispusti, kratko
  //     stane i krug kreće ispočetka. Slova i ikona pune se u istom ritmu,
  //     kao jedna posuda. Vrti se stalno, i na mobitelu i na računalu.
  //   - pojava: kad se stranica učita, gumb izroni iz blage izmaglice
  //     (kao bočice u preporukama), umjesto da samo "iskoči"
  //   - tanki roza rub s unutarnje strane gumba, kao na etiketi parfemske
  //     bočice, i topla meka sjena ispod gumba
  //   - miš iznad gumba: gumb se lagano podigne, rub se zarumeni, oko njega
  //     zasja blaga aura i preko njega prijeđe odsjaj (umjesto Voiceflowova
  //     naglog povećanja); gumb pritom ostaje svoje boje (Voiceflow ga posivi)
  //   - pritisak: gumb se tek malo stisne (umjesto velikog "skoka")
  //   - fokus s tipkovnice (Tab): vidljiv obrub oko gumba (Voiceflow ga nema)
  //
  //  Ako je na uređaju uključeno "Smanji pokrete", tekućina miruje (slova i
  //  ikona su bijeli), a gumb se samo tiho pojavi.
  //
  //  Tehnički: Voiceflow crta chat u shadow DOM-u elementa #voiceflow-chat.
  //  Modul onamo ubaci svoj stil; u gumb (koji crta Voiceflow) ništa ne
  //  umeće. Oslanja se na klasu .vfrc-launcher, koju Voiceflow službeno
  //  podržava za prilagodbu izgleda. Tekućina u ikoni radi samo na
  //  Voiceflowovoj zadanoj ikoni (oblačić s točkicama); ako se u Voiceflowu
  //  postavi druga ikona, ona ostaje kakva jest. Ako Voiceflow jednog dana
  //  promijeni gumb, efekti jednostavno izostanu, a chat radi normalno.
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxGumbChata) return;   // zaštita ako se modul učita dvaput
  window.__mxGumbChata = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_GUMB_POSTAVKE = {
    boje: {                        // uvijek u obliku #rrggbb
      tekucina:      '#dcb3a7',    // roza tekućina (prednji val); malo dublja od roze brenda da se vidi na bijelom
      tekucinaDno:   '#c99a8d',    // tekućina pri dnu je malo tamnija, kao u bočici
      tekucinaVal:   '#ecd3cb',    // stražnji, svjetliji val iza prednjeg
      roza:          '#e2c3ba',    // prašnjava roza iza loga: tanki rub u gumbu, aura na hover
      tinta:         '#000000',    // obrub gumba kad se do njega dođe tipkovnicom (Tab)
      svjetlo:       '#ffffff'     // odsjaj koji na hover prijeđe preko gumba
    },

    tekucina: true,           // slova i ikona se pune rozom tekućinom
    krug: 9,                  // sekundi: punjenje + kratka stanka + naglo ispuštanje + stanka
    pojava: true,             // gumb pri učitavanju stranice izroni iz blage izmaglice
    unutarnjiRub: true        // tanki roza rub s unutarnje strane gumba
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
    // natpis gumba: zadnji div u gumbu (kad postoji i ikona ili prostor za nju)
    const NATPIS = GUMB + ' > div:last-child:not(:first-child)';
    // Voiceflowova zadana ikona (bijeli oblačić s tri točkice)
    const IKONA = GUMB + ' img[src*="/widget-next/message.png"]';

    // Oblik te ikone (96 × 96 px, bijelo na prozirnom): u njega se ulijeva
    // tekućina. Ugrađen je ovdje, pa ne ovisi o tome smije li se Voiceflowova
    // slika čitati s druge domene.
    const OBLIK_IKONE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAO30lEQVR4AeydC/RlUx3H71+eUVJC0ssqpUJPWoseKBEzJi3Fakpa1ZJ3IopkJpGh0JTymkpTKqbJLCUiz1l6KI/KY1oKTaLIMz3E9Pn85/yv/z1n73PPOfdx7v27s37f/z7nt/fZ+/fYZ7/vmRUao3+1WmDkgFrN32iMHDByQM0WqLn40RswckDNFqi5+NEbMHJAzRaoufjRGzByQM0WqLn4J+cbULPRJxc/csBka9RwPZAOWLZs2cpgTbAe2AzMBJ8F88HF4DpwK1iawGt5xpnGtD6zKfHmYV4r12DftkUOjAMwlEZ/MeH2SL0v+BI4H/wIHAc+CLYGG4Nng1XBWAKv5RlnGtP6zI+JNw/z2te8gWUMjDNqdwAGWRVsh6FmgRPBF8DHwVvBc4BGJqhEPmse5mWe5m0ZsyjzbUDHVcq4Ww/V5gCUXwlMR5GF4CTwXvAa8AzQKzJvy7CskylkATLsAlbiuhbquwNQdg3wFrQ9F3wFbArWBE8B/SLLssxXUeCEI7ZGrjW47yv1zQEoZxu/BdrNBqeC14G+lU9ZMVKG1xKpTLORc3PQtz7Cwim7t4RCa1PCXuCL4D2gSk37H8/dDX4LrgQXAjtY4bU84+6Cb1qCUrQ6qZVNGfdKZIbVW+q5A1BkXVQ4HhwAXgiK0jIS3gHmA0dFdtTv4Hom0JkHEh6cwGt5xu0I7+1gf/BtcDsoQy8isbIen8jObe+oZw5A+BWB7budrMZrN+LQ4A+j6m3gdKCxtxobGzsULAS3gLvAPeB+8CB4KIHX8owzzc3wF4BPkM8bwQ7APM3bMiwLVpSUVZkXqgNYMZqyw4ieOACBV0OuncDXwQtAo9GI/tUYNi2O2Y8g1TQMdxS4ATzGfUdkHsC8jiKjacAyLOvvXFs2QZSUXR12SnSKJqwa0XUHIKhDOhX9FEKtB/LoUSIXAWvqoYTnYqx/EPaEzBucQ+aWZfNl2e36C3VQl2mJbjzePeq6AxDNSc+nCZ8L8uiPRH4EaIxLMMx9oF2NJHnnRDn3kcslwLI/TGjTRBAldVGnbaMpKkZ0zQHUjhWAw0yn/c/Mkec/xNkEzMQQFwHb8b4YnnKbRLnLgGVfBNOJ2QWEykYQJHWaq46ga3brWkaIvBlwqv9UwhjdS8RXwSEoX3Z0wmO9IWTxDTiE3JUtrwlUtxNIp64EnVNXHECN2ABRHPY9nzBGfyHC9Z6TUfh+rgeKkMlmySURZVTWmHx2zPsnOsfSFOZ37AAEcdb4Tkp0ecEpPpcZ+iscFTsPRf/L9UASsjkocNjsiEmZQ3Kqo7q6hqTuoTSFeR07gJJeAuzIYsI8QLzrLRegYLsRB0nrJWR06PsTpFBmZecyQ+r6IbjqTlCdOnIAtd/x/mEU/ywQImv7aUScjWKPEw4FJbKejbBO3tSBywyp82HYwElbJrIooyMHUIiTrTcTxuh7RJyKQgNf85GzhRKZXaD7fktE6426u6Teyi1xV9kBeN619b0pyzaRIEPXwZmLIv8iHEpC9kcQ3GH1tYQhUvePYguHqKH4RjtmJQdQoDtN1n5HP6EyHoLp6xvryIgeGlKHM5FWnQgy5CRth8Qmmch2jEoOIFNrvyMB+wBuW8i23qXhxdQgr1sih+0m0eEq5BYhfZwbbEO8NiEoR1Ud8FKKeQXwTSBooX9y53DTxS4uh59wgrq4bqRuaYW0wcthahOCclTaAbxqLs1uQjGx5udW4i4GU41cslC3kF7aYhNsY58Qio/ySjuAnHzl8rYT51Nj/k26KUWJTm7whPTSjq8nwl01guLkg8VTL0+pA9zMXn7X+tclBhe1WrlT585FRHUMaeT6kLYJxUV5VRzwPHJbH4ToCmpKTMBQ+qHiJbpdHhHa80c2RZHoMLuKA6z9seemYtufttzP0ozk3vb/1cl14SBmyLwMPP4Xine26+QrFBfk0WmtBfYBV4I/gcXgALA2cHSReQ6+e81vIJwHliTweguuHSCEnhkjzjzN2zIsyzL3hr9W5oF8hpMyF+1CqWK2CaUd51VxgKcGxh9O/bmTeze8CdoTirt0PZeUbvdtSOgCl6cmPEI4h3vjCTLkBPAUuJ58sNMTXn8NnnEEGTIv8zRvy7AsyzyclG6yGM9lIXJCpq6hxDHbhNKO86o4INb+ex4nVjPGC5v4g/HdN3YXaqsJ3qTQV9lJ3nTSaahmFPe2sxrNoy5NfnKxDuERpFm/wcUEcW8e7lGbp3lPRE2EyuBJamWa4OWFvunqGkqjfCF+lFfFAbFX1s7XpdxoYZMi3Oj2NFpM6VVI+yZg7SZokvvNsQpgIg2Q3rc1D/MyT9OkoQyeF1WmdFzoXh3VNRTnCmmIH+VVcUBo+cECXLgKTdWNS+NpMARBlFQm3aY7Aos+kESk05iHR9eT6GDgST0RjEwx1TE2zym9NF3FASl5mrfBTrMZ23rxILeCIEpO/33dJycoso+cTmOz6Lmjyfmkr23XRZofu48dIihjg/G8qzgg5n1f8aICaJC80YSbIFcgYbpT9yhJrP0lecO49FDY9RsX0nSEadKwrN/A/BsoQuoYq+kx20TzreKA2Dadx71DnVymcCY0GuMMIm4AabJ2LYbpgp7puFxOPKeB7YQ16nLmE3911uGk0blNLvfm8UMYOsG8uWwhD/TOI52OaImI3KhjrPmM2SaSVaPS11JiQzA7MTu0aGGTI1DYGrc7PLcsPYTrvacR5sE7kPilhCH6KUz3Y39OqLGF1x7yMg52KyV5eeDWdX3LsCybKvcsdifePFofit/ZpzjiCqWwgoT4UV6VNyC2IujoxLcgWlg6AsWtyf5ewN+FebJiW3hHgnvSaSfuiXsM2DztBs/tQLEbvMuBIxTYWSLuXvAZYhxJzSD0wO4seMrAbWFyVKWuoQd0aogf5VVxwO8judkHlJ6KYwBPqD1AeBso3BGS9lGwNIHNTESsVjbpPUl9O6Flhpqk1geyd67764RsTKNxc4iZx6vigF+TYUxwaxfRU5rciI8pWGopxkyqOMA+4M8+HMA2zDxLNUOBPAaWhW72cS57hGT0SOMfQhF5vCoOsM30LUjlO37rJO3d41dT84+/QXawEdLOEV3pEyBVHGAhv0KC2LBtV2pK5WMa5DuQhE7W/vdHhLNJ/iVxVk6C4lTaAXRejjQcOzt0DJXkaqOjmlDcMPM2R3h3vQgy5KzdX+EUHgxM5FDaAcmDtxDqBD3PZQs5QphBjfG8TEvEsN6gi03ru5A/dvTE0Y8gSTmq5ADeAl81D7A6+wyV6HB0RwT3tQ3FDw0PHbTRlgjsj/285rKF/FGHs+zSkzBzCWUovwjcG7XjCaV1c3oPIl4Ghp2ejgLvAy51E2TI5ud8KmWoNcgkTjMqO4ACnTT5+99Ywf6Q4VhqUGzhKi3LoN5/AMHczBkjDNG3YMb6Q6LyqbIDzBYnOBr6DtchJyiwTdEcnOAbQbLhIWT2N29u7riN6fpPSHh/aHgGdgjpH0qf4XXkgCS3LxPmdUD+ct1v9cQ6MB4fLML4rni6Vfl5JIvZyP2MozF+6SVo8mxSLPNmggIXzoxd0fQHeKHkNkGOn/dEMUcToTQDw0NG31y3Sz+JULF236H4D4j3EDJBderYAdQAd638qpXwOiSN+8j7EHFQoiCXA0setPVrW69EQp1BkCEHH2eh+yOZmJKMjh1geQjisNQvUSmYrBCs/f6gw2Mg6+CIrpQdKqgKD3lWAW7ef5fnNwIx+VwqPwWdnQuRrDOKFVI6VwRyk8MOK88J5uv6vb862RKFY52b6foCZPDQlk2NGzqeLcpbRrGi2ec5B+qKfF1zgNLghCWEHrS6njBGEx3csSQYhCULJ1nHIMt+IG8lV+P7O+JvoqcnI0jeOXXVAYk4Gt/fBOe9oratniLzC1V20smj/Quo+X7O0lGOtd59DJdQYgK4AGnN/wbGjy1Cxp7N5XfdAQj4OPgFpfo1EtfH88bInnDzm0Ik7y1hcJua1Qg3AA4IHDQ4w3WAkGcHl1vcOz4dvTz71FVB8wruqCCE9aiH7arHRFwvieXX0zcAY2t0txGdj/itoAUIYjMZW9cnukkeDPDbECehj29BM6JbFz1zgAIi9ESf4HfdZJUCxlsXuL+wB6Hf+dyIMHdWTfzqwHTbE3oSwm/AOUJz2cT1qSJn+G3jfYudC5yJHnkVqJRO6cQ9dUBSmKOjG5PrQgGGs7lw98lfqx/NQ9ZcPx3gj6YvJX4ROA2cAFzqcGh7FteOTi4jvek0ut+Sc9TlOr6LavY9ROeSa/p+1MlnL8X4OiP3gU4i++EA5cvrB4xvAiPaJvsBPjs9mw7PbFrrHaF4xtMa7EzVJsVzRZ6y3oUMXLfxx4MeGTGdBvdkNFGFyM7VRTWH0gdj+DtAYbkLlRBI1C8HBIpuZWF4f3ihYT9HjF+y6tfakcsKjtj8LMGuGN2P/fW01qNfkwbCARjfo35+ctIPPu2MdPkbOSToAmnkm8jHMj9GeCLGt9Plsn80CA5w5unpOEcmHX/+pYDprPHXkM4PTNl8uaxwPcbvWUdLWVHqhwNsR61tMSH86ZBHWfImQrFn2/FdHHQc7/qNSyQugWyHsXcGfov0bkI73Xb59Cy+Xw7Iq13tDG+N/R0W8PfH7r16GMCNEJfB3Q4U7sd6WMyJn6fTPDt6Hs/YrjuCsrOegbGPA3l7FzzSX+q5A1DY2m8trFLTrMEORW2jHRYaFsVBlH0MOAfcCPIqQX+tPqm0njsgKcsP4sV+V5UkyQTOH2ynZ2M8Dfgw4Z3gJnANuAo4Thf+QPxq7q8FS4CfL+5opyojTY8Y/XKA42tRRA3flKtJ6Kx1EcZ0FZLbqUn9dIAz1HbNgO26C1/7YXhPmtmBT03LJ1r1xQEY01rtl0b8qVDIqDYX/h8AfkN6Dun9SlUi4tQO+uIATYhR/RnQkVy78eHpat8GTxb4HR63Ku1cLyOdziLZk4P65gDNiXHtSB1/T+d6Q7Ax2BNcCKr+YsWshxYlHDC0Og604CMH1OyekQNGDqjZAjUXP3oDRg6o2QI1Fz96A0YOqNkCNRc/egNGDqjZAjUXP3oD2jig19H/BwAA//+2r5eUAAAABklEQVQDAMjGQv2R+uRTAAAAAElFTkSuQmCC';

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + a + ')'; }

    // Val tekućine kao SVG: gornja polovica prozirna, donja je tekućina, a
    // između je valovita površina. Sloj je dvostruko viši od slova/ikone, pa
    // se pomicanjem gore-dolje mijenja razina tekućine, a pomicanjem u
    // stranu površina se valja. Širina sloja je jedna duljina vala.
    function val(sirina, vrh, dno, visina) {
      const s = sirina, p = s / 2, a = 2.4, y = visina;   // a: visina vala (u jedinicama od 100 = dvostruka visina slova)
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' 100" preserveAspectRatio="none">' +
        '<defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + vrh + '"/>' +          // na površini
        '<stop offset="1" stop-color="' + dno + '"/></linearGradient></defs>' +
        '<path fill="url(#t)" d="M0 ' + y +
        ' C' + (p / 3) + ' ' + (y - a) + ' ' + (2 * p / 3) + ' ' + (y - a) + ' ' + p + ' ' + y +
        ' S' + (s - p / 3) + ' ' + (y + a) + ' ' + s + ' ' + y +
        ' V100 H0 Z"/></svg>';
      return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
    }
    const VAL_PREDNJI = val(28, B.tekucina, B.tekucinaDno, 50);
    const VAL_STRAZNJI = val(34, B.tekucinaVal, B.tekucina, 47.5);   // malo viši, svjetliji

    const POJAVA = P.pojava ? 'mx-g-pojava 1s var(--mx-g-glatko) .15s backwards' : 'none';
    const KRUG = Math.max(3, +P.krug || 9) + 's';

    // Razina tekućine: pomak sloja u postocima (4 % = prazno, površina tik
    // ispod slova i ikone; 96 % = puno, i dolovi vala su iznad njih).
    // Punjenje je sporo i
    // ravnomjerno, puna posuda kratko stoji, a onda se sve naglo ispusti
    // (ubrzava kao da je povuče sila teže) i krug kreće ispočetka.
    const PRAZNO = '4%', PUNO = '96%';
    function razina(p) { return p + ', ' + p + ', 0'; }

    // ── STIL ─────────────────────────────────────────────────────────────
    // Selektori počinju s :host (element #voiceflow-chat), pa su jači od
    // Voiceflowovih i vrijede bez obzira na redoslijed stilova.
    const CSS = `
      :host {
        --mx-g-rub: ${prozirna(B.roza, .34)};
        --mx-g-rub-jaci: ${prozirna(B.roza, .72)};
        --mx-g-aura-blaga: ${prozirna(B.roza, .4)};
        --mx-g-aura-0: ${prozirna(B.roza, 0)};
        --mx-g-svjetlo: ${prozirna(B.svjetlo, .22)};
        --mx-g-svjetlo-0: ${prozirna(B.svjetlo, 0)};
        --mx-g-tinta: ${B.tinta};
        --mx-g-sjena: 0 1px 2px rgba(20, 10, 8, .16), 0 10px 22px -12px rgba(95, 52, 44, .55);
        --mx-g-sjena-gore: 0 2px 4px rgba(20, 10, 8, .14), 0 16px 26px -14px rgba(95, 52, 44, .62);
        --mx-g-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-g-meko: cubic-bezier(.45, 0, .2, 1);
      }

      /* ── gumb: topla meka sjena; pojava iz izmaglice ── */
      :host ${GUMB} {
        position: relative;
        isolation: isolate;
        box-shadow: var(--mx-g-sjena), 0 0 0 0 var(--mx-g-aura-0);
        -webkit-tap-highlight-color: transparent;
        animation: ${POJAVA};
      }
      ${P.unutarnjiRub ? `
      /* tanki roza rub s unutarnje strane, kao na etiketi bočice */
      :host ${GUMB}::before {
        content: "";
        position: absolute;
        top: 3px; right: 3px; bottom: 3px; left: 3px;
        z-index: 0;
        border: 1px solid var(--mx-g-rub);
        border-radius: inherit;
        background: none;
        pointer-events: none;
        transition: border-color .5s var(--mx-g-meko);
      }` : ''}
      /* odsjaj svjetla: tanka svijetla pruga koja na hover prijeđe preko gumba */
      :host ${GUMB}::after {
        content: "";
        position: absolute;
        top: 0; bottom: 0; left: 0;
        width: 45%;
        z-index: 1;
        background: linear-gradient(100deg, var(--mx-g-svjetlo-0) 0%, var(--mx-g-svjetlo) 50%, var(--mx-g-svjetlo-0) 100%);
        transform: translateX(-150%) skewX(-18deg);
        pointer-events: none;
      }
      :host ${GUMB}:focus-visible { outline: 2px solid var(--mx-g-tinta); outline-offset: 3px; }

      /* Voiceflow gumb na dodir poveća za 10 %, a na pritisak smanji za 20 %;
         ovdje ostaje samo mali, mekani pritisak */
      :host ${GUMB}:hover { transform: none; }
      :host ${GUMB}:active { transform: scale(.97); transition-duration: .12s; }
      /* Voiceflow crni gumb na dodir i pritisak posivi; ovdje zadrži svoju
         boju (podizanje, rub i aura dovoljno pokazuju da je gumb živ) */
      :host([data-mx-boja]) ${GUMB}:hover,
      :host([data-mx-boja]) ${GUMB}:active { background-color: var(--mx-g-pozadina); }

      ${P.tekucina ? `
      /* ── roza tekućina u slovima i u ikoni ──
         Tri sloja pozadine: prednji val, stražnji val, a ispod njih bijela
         (boja slova / ikone). Slova: pozadina se vidi samo kroz slova.
         Ikona: slika se makne iz vidnog polja, a pozadina se izreže u
         oblik oblačića (maska). Voiceflow ikonu i dalje sam skriva i
         prikazuje (kad se chat otvori), jer je to i dalje ista slika. */
      @supports ((-webkit-background-clip: text) or (background-clip: text)) {
        :host ${NATPIS} {
          background-image: ${VAL_PREDNJI}, ${VAL_STRAZNJI}, linear-gradient(currentColor, currentColor);
          -webkit-background-clip: text;
                  background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }
      @supports ((-webkit-mask-image: none) or (mask-image: none)) {
        :host ${IKONA} {
          object-position: -9999px 0;         /* slika se ne crta; vidi se pozadina u obliku ikone */
          background-image: ${VAL_PREDNJI}, ${VAL_STRAZNJI}, linear-gradient(#fff, #fff);
          -webkit-mask: url("${OBLIK_IKONE}") center / 100% 100% no-repeat;
                  mask: url("${OBLIK_IKONE}") center / 100% 100% no-repeat;
        }
      }
      :host ${NATPIS},
      :host ${IKONA} {
        background-size: 28px 200%, 34px 200%, 100% 100%;
        background-repeat: repeat-x, repeat-x, no-repeat;
        background-position: 0 ${PRAZNO}, 0 ${PRAZNO}, 0 0;
        animation: mx-g-razina ${KRUG} linear infinite,
                   mx-g-valovi 4.4s linear infinite;
      }

      @keyframes mx-g-razina {
        0%   { background-position-y: ${razina(PRAZNO)}; animation-timing-function: cubic-bezier(.4, .12, .6, .92); }
        70%  { background-position-y: ${razina(PUNO)};   animation-timing-function: linear; }
        80%  { background-position-y: ${razina(PUNO)};   animation-timing-function: cubic-bezier(.62, 0, .9, .42); }
        85%  { background-position-y: ${razina(PRAZNO)}; }
        100% { background-position-y: ${razina(PRAZNO)}; }
      }
      /* prednji val ide udesno, stražnji polaganije ulijevo: površina se valja */
      @keyframes mx-g-valovi {
        from { background-position-x: 0, 0, 0; }
        to   { background-position-x: 56px, -34px, 0; }
      }` : ''}

      @keyframes mx-g-pojava {
        0%   { opacity: 0; filter: blur(8px); transform: translateY(12px) scale(.94); }
        55%  { opacity: 1; }
        100% { opacity: 1; filter: blur(0); transform: none; }
      }
      @keyframes mx-g-prozirnost {
        from { opacity: 0; }
      }

      /* ── miš: gumb se podigne, rub se zarumeni, zasja aura, prijeđe odsjaj ── */
      @media (hover: hover) and (pointer: fine) {
        :host ${GUMB}:hover {
          transform: translateY(-2px);
          box-shadow: var(--mx-g-sjena-gore), 0 0 18px 0 var(--mx-g-aura-blaga);
        }
        :host ${GUMB}:hover::before { border-color: var(--mx-g-rub-jaci); }
        :host ${GUMB}:hover::after { transform: translateX(360%) skewX(-18deg); transition: transform 1s var(--mx-g-meko); }
        :host ${GUMB}:active { transform: translateY(0) scale(.97); }
      }

      /* "Smanji pokrete": tekućina miruje (prazno), gumb se samo tiho pojavi */
      @media (prefers-reduced-motion: reduce) {
        :host ${GUMB} { animation: ${P.pojava ? 'mx-g-prozirnost .4s linear backwards' : 'none'}; }
        :host ${GUMB}:hover,
        :host ${GUMB}:active { transform: none; }
        :host ${GUMB}::after { display: none; }
        :host ${NATPIS},
        :host ${IKONA} { animation: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-gumb]');
      if (stari && stari.getAttribute('data-mx-gumb') === '2') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-gumb', '2');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // Boja gumba u mirovanju (iz Voiceflowovih postavki), da je gumb zadrži i
    // na dodir; bez toga ostaje Voiceflowova boja
    function zapamtiBoju(host, korijen) {
      const g = korijen.querySelector(GUMB);
      if (!g) return;
      if (g.matches(':hover, :active')) { setTimeout(function () { zapamtiBoju(host, korijen); }, 1000); return; }
      const boja = getComputedStyle(g).backgroundColor;
      if (!boja || boja === 'transparent' || /^rgba\(.*,\s*0\)$/.test(boja)) return;   // prozirno
      host.style.setProperty('--mx-g-pozadina', boja);
      host.setAttribute('data-mx-boja', '');
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

    function pokreni() {
      cekajHost(function (host) {
        const korijen = host.shadowRoot;
        ubaciStil(korijen);
        cekajGumb(korijen, function () { zapamtiBoju(host, korijen); });
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_GUMB.pokreni(); }
  catch (e) { console.warn('[Martimex] Efekti gumba chata nisu pokrenuti:', e); }

})();
