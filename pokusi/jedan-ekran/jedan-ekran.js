(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — chat s Marti na JEDNOM ekranu (pokus "Jedan ekran")
  //
  //  Nema više početnog ekrana ispred chata: kad se chat otvori, razgovor
  //  je odmah tu, a vrh prozora je mala tamna "pozornica" s flakonom.
  //
  //   - gore je tamna traka s natpisom MARTIMEX (Cormorant Garamond,
  //     razmaknuta velika slova, boja pudera) i Voiceflowovim gumbima za
  //     novi razgovor i zatvaranje (samo tanke ikone, bez kruga)
  //   - ispod nje, u istoj toploj crnoj boji, je pozornica: neutralni
  //     Martimexov flakon (bez ičijeg logotipa) satkan od tisuća svjetlećih
  //     točkica u tankim nitima, u istom stilu kao dosadašnja animacija.
  //     Pri svakom otvaranju chata točkice se iz izmaglice spuste i slegnu
  //     u flakon (staklo se puni odozdo, čep zadnji); flakon se zatim vrlo
  //     polako okreće, a svakih nekoliko sekundi preko stakla ukoso prijeđe
  //     svjetlo. Ispod flakona piše "Marti · AI asistentica"
  //   - flakon: staklo zaobljenih rubova, u njemu ružičasta tekućina,
  //     tanki prsten od ružičastog zlata na grlu i čep od crnog laka koji
  //     se vidi po odsjajima na rubovima
  //   - razgovor je na toploj bjelokosti, bez mramora i bez teksture:
  //     Martine poruke su bijele kartice s jedva vidljivom sjenom, kupčeve
  //     su tamne (tinta), ponuđeni odgovori su pilule s tankim tamnim
  //     obrubom koje se pod mišem (ili prstom) ispune tamnom bojom
  //   - polje za poruku je bijela kapsula s tankim toplim rubom; gumb za
  //     slanje je taman krug tek kad ima što poslati
  //   - čim kupac pošalje prvu poruku ili pritisne ponuđeni odgovor,
  //     točkice se rasprše kao izmaglica parfema, pozornica se glatko
  //     sklopi, a natpis "Marti · AI asistentica" sjedne u traku ispod
  //     natpisa MARTIMEX; razgovor tada dobije cijeli prozor. Na niskom
  //     prozoru (mobitel) pozornica se sklopi već kad kupac dotakne polje
  //     za poruku, da tipkovnica ne prekrije razgovor
  //   - novi razgovor (gumb gore) vrati pozornicu i flakon
  //   - ako razgovor već postoji (npr. kupac je s preporuke otišao na
  //     stranicu proizvoda), chat se otvori odmah sklopljen
  //   - razgovor kreće sam kad se chat otvori (nema gumba "Početak"), ali
  //     tek tada: samo učitavanje stranice ne pokreće razgovor u Voiceflowu
  //   - Voiceflowovi engleski tekstovi ("Start new chat", "Cancel",
  //     "Chat has ended") su na hrvatskom
  //
  //  "Smanji pokrete" (postavka uređaja): flakon stoji, bez pojave i
  //  odsjaja; pozornica se sklopi bez animacije. Bez WebGL-a je umjesto
  //  točkica tanki obris istog flakona.
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
  //  Ne ide uz pocetna-chata.js ni tema-chata.js (oni su drugi izgled);
  //  proba: pokusi/jedan-ekran/proba.html.
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
      puder:     '#f3e5de',     // natpis MARTIMEX, tekst na tamnom
      roza:      '#e2c3ba',     // naglasak (Martimexova prašnjava roza): crte, fokus, "Marti · AI asistentica"
      // flakon
      staklo:    '#efe6e1',     // točkice stakla
      tekucina:  '#e7bdac',     // ružičasta tekućina u flakonu
      metal:     '#e8c6b2',     // prsten od ružičastog zlata na grlu
      lak:       '#3d3330'      // čep od crnog laka (vidi se po odsjajima)
    },

    // Fontovi iz mape fonts/ (učitavaju ih i ostali moduli)
    font: '"MX Jost", "Futura", "Century Gothic", "Avenir Next", Avenir, "Segoe UI", Roboto, Arial, sans-serif',
    fontNatpisa: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    natpis: 'Martimex',                       // u traci gore; piše se velikim slovima
    oznaka: 'Marti · AI asistentica',         // ispod flakona, a kad se pozornica sklopi, ispod natpisa

    // Voiceflowovi engleski tekstovi ('' = ostaje Voiceflowov tekst)
    tekstovi: {
      noviRazgovor: 'Započni novi razgovor',  // "Start new chat"
      odustani: 'Odustani',                   // "Cancel"
      razgovorZavrsen: 'Razgovor je završen'  // "Chat has ended"
    },

    // Pozornica s flakonom: visina kao udio visine prozora chata, unutar granica (px)
    pozornica: { udio: 0.27, min: 150, max: 224 },
    // Na mobitelu i tabletu, i na prozoru nižem od ovoga (px), pozornica se
    // sklopi čim kupac dotakne polje za poruku, da tipkovnica ne prekrije
    // razgovor (0 = svugdje tek kad pošalje prvu poruku)
    sklopiNaFokus: 700,

    flakon: {
      pojava: 2.4,            // s: točkice se iz izmaglice slegnu u flakon
      brzina: 0.3,            // rad/s: okretanje (0.3 = jedan krug za oko 21 s)
      odsjaj: 7,              // s: svakih toliko preko stakla prijeđe svjetlo (0 = bez)
      tocaka: 24000,          // računalo
      tocakaMobitel: 15000,   // mobitel i tablet
      velicina: 0.7,          // visina flakona kao udio visine pozornice
      nagibPremaMisu: true    // na računalu se flakon lagano nagne prema mišu
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
    const F = P.flakon || {};
    const HOST = 'voiceflow-chat';          // element u čiji shadow DOM Voiceflow crta chat
    const START = '#vfrc-start-chat';       // Voiceflowov gumb "Start new chat"
    const OZNAKA = 'data-mx-j';             // atribut na #voiceflow-chat: "sklopljeno", "pokrecem"
    // adresa mape ove skripte; fontovi su u mapi fonts/ dvije razine više (vrh repozitorija)
    const MAPA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/pokusi/jedan-ekran/jedan-ekran.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
    const KORIJEN = new URL('../../', MAPA).href;
    const MIRNO = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const MOBITEL = !!(window.matchMedia && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches);
    const MIS = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    const PAMCENJE = ['sessionStorage', 'localStorage', 'memory'].indexOf(P.pamcenje) !== -1 ? P.pamcenje : '';

    function rgb(hex) {
      let h = String(hex || '').trim().replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      const n = parseInt(h.slice(0, 6), 16);
      return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + (+(+a).toFixed(3)) + ')'; }
    function boja01(hex) { return rgb(hex).map(function (v) { return v / 255; }); }
    function tekst(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\A ') + '"'; }
    function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function glatko(x) { x = sat(x); return x * x * (3 - 2 * x); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function broj(v, zadano, min, max) { v = +v; return isFinite(v) ? Math.min(max, Math.max(min, v)) : zadano; }


    // ═══════════════════════════════════════════════════════════════════
    //  FLAKON — oblik od točkica u vodoravnim nitima
    //
    //  Visina flakona je 0,905 jedinica (dno na 0), a za crtanje se spusti
    //  za VRH / 2, pa mu je sredina u ishodištu. Presjek tijela i čepa je
    //  zaobljeni pravokutnik (superelipsa |x/W|^n + |z/D|^n = 1), grlo i
    //  prsten su okrugli. Točkice idu po "nitima" (prstenovima oko flakona i
    //  krugovima na vodoravnim plohama), na niti gušće nego što su niti
    //  razmaknute, kao u dosadašnjoj animaciji.
    // ═══════════════════════════════════════════════════════════════════
    const OMJER = 2.3;                 // koliko su točkice na niti gušće nego razmak niti
    const N_TIJELA = 3.4;              // "kvadratnost" presjeka tijela i čepa (2 = elipsa)
    const DUBINA = 0.6;                // dubina tijela prema širini
    const M = {                        // mjere (visina od dna, pola širine)
      rubDna: 0.018, rame: 0.5, vrat: 0.6, prsten: 0.616, prstenVrh: 0.642, vrh: 0.88,
      dno: 0.19, tijelo: 0.206, ramena: 0.232, grlo: 0.056, prstenW: 0.074, cep: 0.1, cepDubina: 0.78,
      razina: 0.41                     // do koje visine je tekućina
    };
    const VRH = M.vrh;
    // vrsta točkice (u shaderu): staklo, staklo s tekućinom iza, površina
    // tekućine, rub tekućine uz staklo, metal (prsten), lak (čep)
    const STAKLO = 0, TEKUCINA = 1, POVRSINA = 2, MENISKUS = 3, METAL = 4, LAK = 5;

    // pola širine tijela, omjer dubine i "kvadratnost" na visini y
    function tijelo(y) {
      if (y < M.rubDna) {
        const t = y / M.rubDna;
        return { W: M.dno + (M.tijelo - M.dno) * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t))), d: DUBINA, n: N_TIJELA };
      }
      if (y < M.rame) return { W: lerp(M.tijelo, M.ramena, (y - M.rubDna) / (M.rame - M.rubDna)), d: DUBINA, n: N_TIJELA };
      // rame: ravno pa meko zaobljeno (malo "kvadratnije" od četvrtine kruga) do okruglog grla
      const t = sat((y - M.rame) / (M.vrat - M.rame)), k = glatko((t - 0.45) / 0.55);
      return { W: M.grlo + (M.ramena - M.grlo) * Math.pow(Math.max(0, 1 - Math.pow(t, 2.6)), 1 / 2.6), d: lerp(DUBINA, 1, k), n: lerp(N_TIJELA, 2, k) };
    }
    // pola širine čepa (gornji brid je malo zaobljen)
    function cep(y) {
      const t = sat((y - (VRH - 0.014)) / 0.014);
      return M.cep * (1 - 0.06 * (1 - Math.sqrt(Math.max(0, 1 - t * t))));
    }

    // prsten (nit) oko presjeka: točke jednoliko po opsegu
    const UZORAKA = 160;
    function presjek(W, d, n) {
      const D = W * d, x = new Float32Array(UZORAKA), z = new Float32Array(UZORAKA);
      const nx = new Float32Array(UZORAKA), nz = new Float32Array(UZORAKA), dio = new Float32Array(UZORAKA + 1);
      const e = 2 / n;
      for (let i = 0; i < UZORAKA; i++) {
        const t = i / UZORAKA * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t);
        const px = W * Math.sign(c) * Math.pow(Math.abs(c), e), pz = D * Math.sign(s) * Math.pow(Math.abs(s), e);
        x[i] = px; z[i] = pz;
        let gx = Math.sign(px) * Math.pow(Math.abs(px / W), n - 1) / W, gz = Math.sign(pz) * Math.pow(Math.abs(pz / D), n - 1) / D;
        const l = Math.hypot(gx, gz) || 1;
        nx[i] = gx / l; nz[i] = gz / l;
      }
      for (let i = 0; i < UZORAKA; i++) {
        const j = (i + 1) % UZORAKA;
        dio[i + 1] = dio[i] + Math.hypot(x[j] - x[i], z[j] - z[i]);
      }
      return { x: x, z: z, nx: nx, nz: nz, dio: dio, opseg: dio[UZORAKA] };
    }
    function naPresjeku(p, u) {                  // u: 0..1 po opsegu
      const s = u * p.opseg;
      let lo = 0, hi = UZORAKA;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p.dio[m] <= s) lo = m; else hi = m; }
      const dl = p.dio[lo + 1] - p.dio[lo], f = dl > 0 ? sat((s - p.dio[lo]) / dl) : 0, b = (lo + 1) % UZORAKA;
      const nx = lerp(p.nx[lo], p.nx[b], f), nz = lerp(p.nz[lo], p.nz[b], f), l = Math.hypot(nx, nz) || 1;
      return { x: lerp(p.x[lo], p.x[b], f), z: lerp(p.z[lo], p.z[b], f), nx: nx / l, nz: nz / l };
    }

    // ponovljiv "slučajni" niz (isti flakon pri svakom učitavanju)
    function slucajno(sjeme) {
      let a = sjeme >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    // Niti flakona za zadani razmak niti (korak): prstenovi po profilu
    // (tijelo, grlo, prsten, čep) i krugovi na vodoravnim plohama
    function niti(korak) {
      const L = [];
      // a) profil: dio krivulje (W(y) od y0 do y1) → prstenovi razmaknuti po duljini krivulje
      function profil(y0, y1, sirina, vrsta) {
        const K = 400, ys = [], ws = [], s = [0];
        for (let i = 0; i <= K; i++) {
          const y = lerp(y0, y1, i / K), w = sirina(y);
          ys.push(y); ws.push(w);
          if (i) s.push(s[i - 1] + Math.hypot(w.W - ws[i - 1].W, y - ys[i - 1]));
        }
        const ukupno = s[K], k = Math.max(1, Math.round(ukupno / korak));
        let j = 0;
        for (let q = 0; q < k; q++) {
          const cilj = (q + 0.5) / k * ukupno;
          while (j < K - 1 && s[j + 1] < cilj) j++;
          const f = (cilj - s[j]) / ((s[j + 1] - s[j]) || 1);
          const y = lerp(ys[j], ys[j + 1], f), a = ws[j], b = ws[j + 1];
          const W = lerp(a.W, b.W, f), d = lerp(a.d, b.d, f), n = lerp(a.n, b.n, f);
          const dW = b.W - a.W, dy = ys[j + 1] - ys[j], dl = Math.hypot(dW, dy) || 1;
          L.push({ y: y, W: W, d: d, n: n, nr: dy / dl, ny: -dW / dl, vrsta: typeof vrsta === 'function' ? vrsta(y) : vrsta, tezina: 1 });
        }
      }
      // b) vodoravna ploha na visini y: krugovi od W1 prema W0 (W0 = 0: puna ploha)
      function ploha(y, W0, W1, d, n, gore, vrsta, gustoca) {
        const k = Math.max(1, Math.round((W1 - W0) / (korak / (gustoca || 1))));
        for (let q = 0; q < k; q++) {
          const W = W1 - (q + 0.5) / k * (W1 - W0);
          L.push({ y: y, W: W, d: d, n: n, nr: 0, ny: gore ? 1 : -1, vrsta: vrsta, tezina: gustoca || 1 });
        }
      }
      const tekucinaDo = function (y) { return y < M.razina ? TEKUCINA : STAKLO; };
      profil(0, M.vrat, tijelo, tekucinaDo);                                                   // tijelo
      ploha(0, 0, M.dno, DUBINA, N_TIJELA, false, TEKUCINA, 0.8);                              // dno
      const tr = tijelo(M.razina);
      ploha(M.razina, 0, tr.W * 0.955, DUBINA, N_TIJELA, true, POVRSINA, 0.55);               // površina tekućine
      L.push({ y: M.razina, W: tr.W * 0.965, d: DUBINA, n: N_TIJELA, nr: 1, ny: 0, vrsta: MENISKUS, tezina: 2.2 });   // rub tekućine
      profil(M.vrat, M.prsten, function () { return { W: M.grlo, d: 1, n: 2 }; }, STAKLO);    // grlo
      ploha(M.prsten, M.grlo, M.prstenW, 1, 2, false, METAL, 1.4);                             // prsten: donja ploha
      profil(M.prsten, M.prstenVrh, function () { return { W: M.prstenW, d: 1, n: 2 }; }, METAL);   // prsten
      ploha(M.prstenVrh, M.prstenW, M.cep, M.cepDubina, N_TIJELA, false, LAK, 1);             // čep: donja ploha
      profil(M.prstenVrh, VRH, function (y) { return { W: cep(y), d: M.cepDubina, n: N_TIJELA }; }, LAK);   // čep
      ploha(VRH, 0, cep(VRH), M.cepDubina, N_TIJELA, true, LAK, 1);                           // čep: gornja ploha
      return L;
    }

    // n točkica po nitima (po duljini × težini niti): položaj, smjer plohe,
    // vrsta i četiri slučajna broja; spremnik za grafičku karticu
    const VELICINA_TOCKE = 11;
    function gradiFlakon(n) {
      // razmak niti prema površini: najprije gruba procjena
      let korak = 0.03;
      let L = niti(korak);
      L.forEach(function (l) { l.p = presjek(l.W, l.d, l.n); });
      const povrsina = L.reduce(function (z, l) { return z + l.p.opseg * l.tezina; }, 0) * korak;
      korak = Math.sqrt(povrsina * OMJER / n);
      L = niti(korak);
      const tezine = L.map(function (l) { l.p = presjek(l.W, l.d, l.n); return l.p.opseg * l.tezina; });
      let ukupno = 0;
      tezine.forEach(function (t) { ukupno += t; });
      const rnd = slucajno(20261020);
      const podaci = new Float32Array(n * VELICINA_TOCKE);
      const kk = ukupno / n;
      let l = 0, pocetak = 0;
      for (let i = 0; i < n; i++) {
        const s = (i + 0.5) * kk;
        while (l < L.length - 1 && s >= pocetak + tezine[l]) { pocetak += tezine[l]; l++; }
        const nit = L[l];
        const u = ((tezine[l] > 0 ? (s - pocetak) / tezine[l] : 0) + l * 0.618034) % 1;
        const q = naPresjeku(nit.p, u);
        // smjer plohe: na profilu iz presjeka i nagiba profila, na plohi gore ili dolje
        let nx, ny, nz;
        if (nit.nr === 0) { nx = 0; ny = nit.ny; nz = 0; }
        else { nx = q.nx * nit.nr; ny = nit.ny; nz = q.nz * nit.nr; }
        const nl = Math.hypot(nx, ny, nz) || 1;
        const o = i * VELICINA_TOCKE;
        podaci[o] = q.x;
        podaci[o + 1] = nit.y - VRH / 2;
        podaci[o + 2] = q.z;
        podaci[o + 3] = nx / nl;
        podaci[o + 4] = ny / nl;
        podaci[o + 5] = nz / nl;
        podaci[o + 6] = nit.vrsta;
        podaci[o + 7] = rnd(); podaci[o + 8] = rnd(); podaci[o + 9] = rnd(); podaci[o + 10] = rnd();
      }
      return podaci;
    }

    // Obris istog flakona sprijeda (SVG), kad nema WebGL-a
    function obrisFlakona() {
      const S = 200, v = function (y) { return (S * 0.04 + (VRH - y) / VRH * S * 0.92).toFixed(1); };
      const x = function (w) { return (S / 2 + w * S * 0.92).toFixed(1); };
      const lijevo = [], desno = [];
      for (let i = 0; i <= 80; i++) {
        const y = i / 80 * M.vrat, w = tijelo(y).W;
        lijevo.push(x(-w) + ',' + v(y)); desno.unshift(x(w) + ',' + v(y));
      }
      const tijeloPut = 'M' + lijevo.join(' L') + ' L' + x(-M.grlo) + ',' + v(M.prsten) + ' L' + x(M.grlo) + ',' + v(M.prsten) + ' L' + desno.join(' L') + ' Z';
      const razina = tijelo(M.razina).W * 0.965;
      return '<svg viewBox="0 0 ' + S + ' ' + S + '" aria-hidden="true" fill="none" stroke="currentColor" stroke-width=".7" stroke-linejoin="round">' +
        '<path d="' + tijeloPut + '"/>' +
        '<path d="M' + x(-razina) + ',' + v(M.razina) + ' L' + x(razina) + ',' + v(M.razina) + '" opacity=".55"/>' +
        '<rect x="' + x(-M.prstenW) + '" y="' + v(M.prstenVrh) + '" width="' + (2 * M.prstenW * S * 0.92).toFixed(1) + '" height="' + ((M.prstenVrh - M.prsten) / VRH * S * 0.92).toFixed(1) + '"/>' +
        '<rect x="' + x(-M.cep) + '" y="' + v(VRH) + '" width="' + (2 * M.cep * S * 0.92).toFixed(1) + '" height="' + ((VRH - M.prstenVrh) / VRH * S * 0.92).toFixed(1) + '" rx="2"/>' +
        '</svg>';
    }


    // ═══════════════════════════════════════════════════════════════════
    //  ANIMACIJA — WebGL platno koje crta točkice flakona
    // ═══════════════════════════════════════════════════════════════════
    const VS = `
      precision highp float;
      attribute vec3 aPoz;
      attribute vec3 aNor;
      attribute float aVrsta;
      attribute vec4 aRnd;
      uniform float uVrijeme;
      uniform float uKut;       // okret oko uspravne osi
      uniform float uNagib;     // flakon malo nagnut prema nama
      uniform vec2 uMis;        // lagani nagib prema mišu
      uniform float uUvod;      // pojava (0..1)
      uniform float uIzlaz;     // raspršivanje kad se pozornica sklopi (0..1)
      uniform float uOdsjaj;    // gdje je svjetlo koje ukoso prelazi preko stakla
      uniform vec2 uPx;         // svjetska jedinica → ekran
      uniform vec2 uSredina;
      uniform float uVelicina;  // veličina točkice (px)
      uniform float uJacina;    // jačina točkica (prema njihovu broju)
      uniform vec3 uStaklo, uTekucina, uMetal, uLak;
      varying vec4 vBoja;

      const float CAM = 4.2;

      vec2 okreni(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

      void main() {
        vec3 p = aPoz;
        vec3 n = aNor;
        float vis = clamp(aPoz.y / ${VRH.toFixed(3)} + 0.5, 0.0, 1.0);   // 0 dno, 1 vrh čepa
        float alfa = 1.0;

        // pojava: izmaglica iznad flakona se spusti i slegne u staklo,
        // odozdo prema gore (čep zadnji)
        if (uUvod < 1.0) {
          float red = 0.64 * vis + 0.36 * aRnd.x;
          float k = clamp(uUvod * 1.6 - red * 0.6, 0.0, 1.0);
          k = 1.0 - pow(1.0 - k, 3.0);
          vec3 smjer = normalize(vec3(aRnd.z, aRnd.w, aRnd.y) - 0.5 + 0.001);
          vec3 izvor = p + smjer * (0.2 + 0.34 * aRnd.y) + vec3(0.0, 0.3 + 0.24 * aRnd.x, 0.0);
          izvor.xz = okreni(izvor.xz, (1.0 - k) * 1.9);
          p = mix(izvor, p, k);
          alfa *= k * (2.0 - k);
        }

        // sklapanje: točkice se dignu i rasprše kao izmaglica parfema
        if (uIzlaz > 0.0) {
          float ke = clamp(uIzlaz * 1.45 - aRnd.x * 0.45, 0.0, 1.0);
          ke = ke * ke * (3.0 - 2.0 * ke);
          vec3 smjer = normalize(p + (aRnd.yzw - 0.5) * 0.9 + vec3(0.0, 0.35, 0.0));
          p += smjer * ke * 0.5 + vec3(0.0, 0.5, 0.0) * ke;
          alfa *= 1.0 - ke;
        }

        float ky = uKut + uMis.x;
        p.xz = okreni(p.xz, ky); n.xz = okreni(n.xz, ky);
        float kx = uNagib + uMis.y;
        p.yz = okreni(p.yz, kx); n.yz = okreni(n.yz, kx);

        float persp = CAM / (CAM - p.z);
        gl_Position = vec4(p.x * uPx.x * persp + uSredina.x, p.y * uPx.y * persp + uSredina.y, 0.0, 1.0);
        float iskra = step(0.9935, aRnd.z) * (aVrsta < 1.5 ? 1.0 : 0.0);
        gl_PointSize = uVelicina * persp * (1.0 + 0.7 * iskra);

        // svjetlo gore lijevo: sjena, odsjaj i svijetli rub (staklo svijetli po rubovima)
        vec3 N = normalize(n);
        vec3 L = normalize(vec3(-0.55, 0.62, 0.6));
        vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
        float dif = max(dot(N, L), 0.0);
        float spe = pow(max(dot(N, H), 0.0), 28.0);
        float rub = pow(1.0 - abs(N.z), 2.4);
        float lice = mix(0.42, 1.0, smoothstep(-0.25, 0.25, N.z));   // stražnja strana tamnija (vidi se kroz staklo)

        // svjetlo koje ukoso prijeđe preko flakona
        float d = (p.y * 0.85 - p.x * 0.55 - uOdsjaj) / 0.09;
        float pruga = exp(-d * d);

        vec3 boja;
        float a;
        if (aVrsta < 0.5) {            // staklo
          boja = uStaklo * (0.12 + 0.3 * dif + 1.3 * spe + 0.85 * rub);
          a = 0.5;
        } else if (aVrsta < 1.5) {     // staklo s tekućinom iza
          boja = mix(uStaklo, uTekucina, 0.74) * (0.26 + 0.42 * dif + 1.0 * spe + 0.55 * rub);
          a = 0.7;
        } else if (aVrsta < 2.5) {     // površina tekućine
          boja = uTekucina * (0.5 + 0.9 * spe);
          a = 0.36;
        } else if (aVrsta < 3.5) {     // rub tekućine uz staklo
          boja = mix(uTekucina, uStaklo, 0.45) * 1.25;
          a = 0.85;
        } else if (aVrsta < 4.5) {     // prsten od ružičastog zlata
          boja = uMetal * (0.3 + 0.65 * dif + 2.0 * spe + 0.6 * rub);
          a = 0.95;
        } else {                       // čep od crnog laka: odsjaji na rubovima
          boja = uLak * (0.25 + 0.4 * dif) + uStaklo * (1.5 * spe + 0.62 * rub);
          a = 0.82;
        }
        boja *= 1.0 + 1.35 * pruga * (aVrsta > 4.5 ? 0.55 : 1.0);
        float treptaj = 0.86 + 0.14 * sin(uVrijeme * (1.4 + 2.0 * aRnd.w) + aRnd.y * 40.0);
        treptaj = mix(treptaj, 1.0 + 1.1 * max(0.0, sin(uVrijeme * 2.0 + aRnd.x * 50.0)), iskra);
        float dubina = clamp(0.72 + 0.42 * p.z, 0.35, 1.12);
        vBoja = vec4(boja * lice, a * alfa * treptaj * dubina * uJacina);
      }
    `;
    const FS = `
      precision mediump float;
      varying vec4 vBoja;
      void main() {
        vec2 d = gl_PointCoord * 2.0 - 1.0;
        float r = dot(d, d);
        if (r > 1.0) discard;
        gl_FragColor = vec4(vBoja.rgb, vBoja.a * (1.0 - 0.6 * r));
      }
    `;
    const UNIFORME = ['uVrijeme', 'uKut', 'uNagib', 'uMis', 'uUvod', 'uIzlaz', 'uOdsjaj', 'uPx', 'uSredina', 'uVelicina', 'uJacina',
      'uStaklo', 'uTekucina', 'uMetal', 'uLak'];
    const KUT0 = -0.5;                 // flakon nastane malo okrenut (prema svjetlu)
    const NAGIB = 0.13;                // gledamo ga malo odozgo

    function napraviAnimaciju(platno, scena, dogadaji) {
      const n = Math.max(3000, Math.round(+(MOBITEL ? F.tocakaMobitel : F.tocaka) || 20000));
      const pojava = broj(F.pojava, 2.4, 0.3, 10), brzina = broj(F.brzina, 0.3, -3, 3), svakih = broj(F.odsjaj, 7, 0, 60);
      let gl = null, program = null, spremnik = null, U = {}, spremno = false, priprema = null, unisteno = false;
      let raf = 0, vrti = false, vrijeme = 0, zadnje = 0, izlazOd = -1, izlazGotov = null, sirina = 0, visina = 0;
      let misX = 0, misY = 0, nagibX = 0, nagibY = 0;

      function pocniGL() {
        if (gl) return true;
        try {
          gl = platno.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: true, powerPreference: 'low-power' }) ||
               platno.getContext('experimental-webgl');
        } catch (e) { gl = null; }
        if (!gl) return false;
        function sjenac(vrsta, izvor) {
          const s = gl.createShader(vrsta);
          gl.shaderSource(s, izvor);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('[Martimex] Shader flakona:', gl.getShaderInfoLog(s)); return null; }
          return s;
        }
        const vs = sjenac(gl.VERTEX_SHADER, VS), fs = sjenac(gl.FRAGMENT_SHADER, FS);
        if (!vs || !fs) { gl = null; return false; }
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.warn('[Martimex] Program flakona:', gl.getProgramInfoLog(program)); gl = null; return false; }
        return true;
      }

      function dovrsiGL(podaci) {
        gl.useProgram(program);
        spremnik = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnik);
        gl.bufferData(gl.ARRAY_BUFFER, podaci, gl.STATIC_DRAW);
        const korak = VELICINA_TOCKE * 4;
        [['aPoz', 3, 0], ['aNor', 3, 3], ['aVrsta', 1, 6], ['aRnd', 4, 7]].forEach(function (a) {
          const mj = gl.getAttribLocation(program, a[0]);
          if (mj < 0) return;
          gl.enableVertexAttribArray(mj);
          gl.vertexAttribPointer(mj, a[1], gl.FLOAT, false, korak, a[2] * 4);
        });
        UNIFORME.forEach(function (u) { U[u] = gl.getUniformLocation(program, u); });
        gl.uniform3fv(U.uStaklo, boja01(B.staklo));
        gl.uniform3fv(U.uTekucina, boja01(B.tekucina));
        gl.uniform3fv(U.uMetal, boja01(B.metal));
        gl.uniform3fv(U.uLak, boja01(B.lak));
        gl.uniform1f(U.uNagib, NAGIB);
        // jačina: uz 24 000 točkica 1; uz manje točkica (mobitel) malo jače
        gl.uniform1f(U.uJacina, Math.min(1.6, Math.pow(24000 / n, 0.55)));
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);           // točkice se zbrajaju (svjetlo)
        gl.clearColor(0, 0, 0, 0);
        return true;
      }

      // oblik i WebGL se pripreme jednom (kad preglednik miruje ili pri otvaranju)
      function pripremi() {
        if (priprema) return priprema;
        priprema = new Promise(function (gotovo) { setTimeout(gotovo, 0); }).then(function () {
          if (unisteno) return false;
          if (!pocniGL()) { dogadaji.bezAnimacije(); return false; }
          dovrsiGL(gradiFlakon(n));
          spremno = true;
          velicina();
          return true;
        }).catch(function (e) {
          console.warn('[Martimex] Flakon nije pripremljen:', e);
          dogadaji.bezAnimacije();
          return false;
        });
        return priprema;
      }

      // platno je visoko kao otvorena pozornica (dok se ona sklapa, platno se
      // ne mijenja, nego ga pozornica polako prekrije)
      function velicina() {
        const vis = dogadaji.visina();
        const w = scena.clientWidth || sirina || 360;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        if (w !== sirina || vis !== visina || platno.width !== Math.round(w * dpr)) {
          sirina = w; visina = vis;
          platno.style.width = w + 'px';
          platno.style.height = vis + 'px';
          platno.width = Math.round(w * dpr);
          platno.height = Math.round(vis * dpr);
        }
        if (!gl || !spremno) return;
        gl.viewport(0, 0, platno.width, platno.height);
        // flakon (visok VRH jedinica) zauzme zadani udio visine pozornice;
        // sredina mu je malo iznad sredine (ispod je natpis)
        const px = vis * broj(F.velicina, 0.7, 0.3, 0.9) / VRH;
        gl.uniform2f(U.uPx, 2 * px / w, 2 * px / vis);
        gl.uniform2f(U.uSredina, 0, 1 - 2 * (vis * 0.445) / vis);
        gl.uniform1f(U.uVelicina, 1.55 * dpr);
        if (!vrti) nacrtaj(vrijeme);
      }

      function nacrtaj(t) {
        if (!gl || !spremno) return;
        const mirno = MIRNO.matches;
        const uvod = mirno ? 1 : sat(t / pojava);
        const kut = KUT0 + (mirno ? 0 : brzina * t);
        let odsjaj = 9;
        if (!mirno && svakih > 0 && t > pojava + 0.4) {
          const c = (t - pojava - 0.4) % svakih;
          if (c < 2.2) odsjaj = lerp(0.95, -0.95, c / 2.2);
        }
        let izlaz = 0;
        if (izlazOd >= 0) izlaz = mirno ? 1 : sat((t - izlazOd) / 0.95);
        gl.uniform1f(U.uVrijeme, t);
        gl.uniform1f(U.uKut, kut);
        gl.uniform2f(U.uMis, nagibX * 0.22, nagibY * 0.1);
        gl.uniform1f(U.uUvod, uvod);
        gl.uniform1f(U.uIzlaz, izlaz);
        gl.uniform1f(U.uOdsjaj, odsjaj);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, n);
        if (izlaz >= 1 && izlazGotov) { const f = izlazGotov; izlazGotov = null; f(); }
      }

      function sljedeca(sad) {
        raf = requestAnimationFrame(sljedeca);
        // korak vremena je ograničen: ako uređaj zastane, animacija se ne preskače
        const dt = Math.min(0.05, Math.max(0, (sad - zadnje) / 1000));
        zadnje = sad;
        vrijeme += dt;
        const f = 1 - Math.exp(-dt * 3.5);
        nagibX += (misX - nagibX) * f;
        nagibY += (misY - nagibY) * f;
        nacrtaj(vrijeme);
      }
      function pokreni() {
        if (!spremno || vrti || unisteno) return;
        if (MIRNO.matches && izlazOd < 0) { nacrtaj(vrijeme); return; }
        vrti = true;
        zadnje = performance.now();
        raf = requestAnimationFrame(sljedeca);
      }
      function stani() {
        vrti = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }

      platno.addEventListener('webglcontextlost', function (e) {
        e.preventDefault();
        stani();
        spremno = false; priprema = null; spremnik = null; program = null; gl = null;
      });
      platno.addEventListener('webglcontextrestored', function () {
        if (!unisteno) pripremi().then(function (ok) { if (ok && dogadaji.ziv()) pokreni(); });
      });

      return {
        pripremi: pripremi,
        velicina: velicina,
        // pri svakom otvaranju (dok je pozornica otvorena): flakon nastane ispočetka
        ispocetka: function () {
          stani();
          vrijeme = 0; izlazOd = -1; izlazGotov = null;
          return pripremi().then(function (ok) { if (ok && dogadaji.ziv()) { velicina(); pokreni(); } return ok; });
        },
        // sklapanje: točkice se rasprše, pa animacija stane
        izlaz: function (gotovo) {
          if (!spremno) { if (gotovo) gotovo(); return; }
          izlazOd = vrijeme;
          izlazGotov = function () { stani(); if (gotovo) gotovo(); };
          pokreni();
        },
        stani: stani,
        mis: function (x, y) { misX = x; misY = y; },
        unisti: function () {
          unisteno = true;
          stani();
          if (gl && !gl.isContextLost()) {
            if (spremnik) gl.deleteBuffer(spremnik);
            if (program) gl.deleteProgram(program);
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
          }
          gl = null;
        }
      };
    }


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
    const VISINA_TRAKE = 56;              // px, traka s natpisom (kao Voiceflowovo zaglavlje)

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
        --mx-j-sklapanje: cubic-bezier(.65, 0, .25, 1);
      }

      /* ═══ PROZOR: topla bjelokost (oblik i mjere ostaju Voiceflowovi) ═══ */
      ${PROZOR} {
        background: var(--mx-j-bjelokost);
        color: var(--mx-j-tinta);
        font-family: var(--mx-j-font);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* ═══ TRAKA GORE: topla crna, natpis MARTIMEX i tanke ikone ═══ */
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
      /* bez Voiceflowove slike i naslova: u sredini je natpis MARTIMEX;
         Voiceflowov naslov ostaje u kodu za čitače zaslona (natpis je ukras) */
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
        top: env(safe-area-inset-top, 0px);
        left: 50%;
        transform: translateX(-50%);
        padding-left: .36em;                  /* optički centrira razmaknuta slova */
        font-family: var(--mx-j-font-natpisa);
        font-size: 17px;
        font-weight: 500;
        line-height: ${VISINA_TRAKE}px;
        letter-spacing: .36em;
        white-space: nowrap;
        color: var(--mx-j-puder);
        pointer-events: none;
        transition: transform .9s var(--mx-j-sklapanje);
      }
      /* kad se pozornica sklopi, natpis se malo digne, a ispod njega sjedne "Marti · AI asistentica" */
      ${SKLOPLJENO} .vfrc-chat > .vfrc-header .vfrc-header--title::after { transform: translate(-50%, -9px); }
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

      /* ═══ POZORNICA S FLAKONOM (umetnuta ispod trake) ═══ */
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
        background:
          radial-gradient(40% 46% at 50% 44%, ${prozirna(B.roza, .11)}, ${prozirna(B.roza, .035)} 55%, ${prozirna(B.roza, 0)} 100%),
          var(--mx-j-tama);
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
      :host .mx-j-platno {
        position: absolute;
        top: 0; left: 0;
        display: block;
        opacity: 0;
        transition: opacity .6s linear;
      }
      :host .mx-j-spremno .mx-j-platno { opacity: 1; }
      /* bez WebGL-a: tanki obris istog flakona */
      :host .mx-j-rezerva {
        display: none;
        position: absolute;
        left: 50%;
        top: 44.5%;
        width: calc(var(--mx-j-visina, 230px) * .74);
        height: calc(var(--mx-j-visina, 230px) * .74);
        transform: translate(-50%, -50%);
        color: ${prozirna(B.puder, .72)};
      }
      :host .mx-j-rezerva svg { display: block; width: 100%; height: 100%; }
      :host .mx-j-bez-gl .mx-j-rezerva { display: block; animation: mx-j-prozirnost 1.2s var(--mx-j-meko) .1s backwards; }
      /* "Marti · AI asistentica": ispod flakona; kad se pozornica sklopi, s
         njom se digne i sjedne u traku ispod natpisa MARTIMEX */
      :host .mx-j-oznaka {
        position: absolute;
        left: 0; right: 0;
        bottom: 13px;
        margin: 0;
        text-align: center;
        font-size: 10px;
        font-weight: 400;
        line-height: 10px;
        letter-spacing: .32em;
        padding-left: .32em;
        text-transform: uppercase;
        white-space: nowrap;
        color: var(--mx-j-roza);
        pointer-events: none;
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
      :host .mx-j-sklopljeno::after {
        background:
          linear-gradient(90deg, var(--mx-j-roza-0), var(--mx-j-roza-35) 50%, var(--mx-j-roza-0)) top / 100% 1px no-repeat,
          linear-gradient(180deg, var(--mx-j-bjelokost), var(--mx-j-bjelokost-0));
      }
      /* bez prijelaza (chat se otvori na postojećem razgovoru) */
      :host .mx-j-odmah .mx-j-scena,
      :host([${OZNAKA}~="odmah"]) .vfrc-widget .vfrc-header--title::after { transition: none; }
      /* pojava pri svakom otvaranju */
      :host .mx-j-ulaz .mx-j-oznaka { animation: mx-j-pojava 1.2s var(--mx-j-glatko) 1.1s backwards; }

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

      /* ═══ KRAJ RAZGOVORA I "NOVI RAZGOVOR?": bijela ploča odozdo ═══ */
      ${PLOCA_POCETKA}, ${W} .vfrc-prompt {
        padding: 18px 16px calc(28px + env(safe-area-inset-bottom, 0px));
        border-radius: 22px 22px 0 0;
        background: var(--mx-j-papir);
        box-shadow: 0 0 0 1px rgba(60, 40, 30, .05), 0 -18px 40px -24px rgba(40, 26, 18, .45);
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
        :host .mx-j-scena, ${ZAGLAVLJE} .vfrc-header--title::after { transition: none; }
        :host .mx-j-ulaz .mx-j-oznaka { animation: mx-j-prozirnost .4s linear backwards; }
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
      const platno = el('canvas', 'mx-j-platno');
      platno.setAttribute('aria-hidden', 'true');
      const rezerva = el('div', 'mx-j-rezerva');
      rezerva.innerHTML = obrisFlakona();
      scena.appendChild(platno);
      scena.appendChild(rezerva);
      korijen.appendChild(scena);
      const oznaka = el('p', 'mx-j-oznaka', P.oznaka);
      korijen.appendChild(oznaka);

      let visina = 230, ziv = false, izmjereno = false;
      const anim = napraviAnimaciju(platno, scena, {
        bezAnimacije: function () { korijen.classList.add('mx-j-bez-gl'); },
        visina: function () { return visina; },
        ziv: function () { return ziv; }
      });

      if (F.nagibPremaMisu !== false && MIS) {
        korijen.addEventListener('pointermove', function (e) {
          const r = scena.getBoundingClientRect();
          if (!r.width || !r.height) return;
          anim.mis(sat((e.clientX - r.left) / r.width) * 2 - 1, sat((e.clientY - r.top) / r.height) * 2 - 1);
        });
        korijen.addEventListener('pointerleave', function () { anim.mis(0, 0); });
      }

      return {
        el: korijen,
        anim: anim,
        ziv: function () { return ziv; },
        // visina otvorene pozornice prema visini prozora chata
        mjeri: function (visinaProzora) {
          if (!(visinaProzora > 0)) return;              // prozor se još ne vidi (zatvoren chat)
          const p = P.pozornica || {};
          const min = broj(p.min, 150, 60, 600), max = Math.max(min, broj(p.max, 224, 60, 800));
          let v = Math.round(Math.min(max, Math.max(min, visinaProzora * broj(p.udio, 0.27, 0.1, 0.8))));
          if (visinaProzora < 520) v = Math.round(Math.max(110, visinaProzora * 0.24));   // vrlo nizak prozor (mobitel položen)
          if (v !== visina || !izmjereno) {
            visina = v;
            // prvo mjerenje bez prijelaza (pozornica ne smije "skočiti" pri otvaranju)
            if (!izmjereno) korijen.classList.add('mx-j-odmah');
            korijen.style.setProperty('--mx-j-visina', v + 'px');
            if (!izmjereno) {
              void korijen.offsetHeight;
              if (!korijen.classList.contains('mx-j-sklopljeno')) korijen.classList.remove('mx-j-odmah');
              izmjereno = true;
            }
            anim.velicina();
          }
        },
        // pozornica otvorena: flakon nastane ispočetka
        pokazi: function () {
          ziv = true;
          korijen.classList.remove('mx-j-ulaz', 'mx-j-spremno');
          void korijen.offsetWidth;                       // da se pojava ponovi
          korijen.classList.add('mx-j-ulaz');
          anim.ispocetka().then(function (ok) { if (ok && ziv) korijen.classList.add('mx-j-spremno'); });
        },
        // chat zatvoren: animacija stane
        sakrij: function () { ziv = false; anim.stani(); },
        // sklapanje: točkice se rasprše dok se pozornica sklapa
        sklopi: function (odmah) {
          ziv = false;
          korijen.classList.toggle('mx-j-odmah', !!odmah);
          korijen.classList.add('mx-j-sklopljeno');
          korijen.classList.remove('mx-j-ulaz');
          if (odmah) anim.stani(); else anim.izlaz();
        },
        rasiri: function () {
          korijen.classList.remove('mx-j-sklopljeno', 'mx-j-odmah');
        }
      };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  VEZA S VOICEFLOWOM
    // ═══════════════════════════════════════════════════════════════════
    const S = { host: null, kor: null, pozornica: null, sklopljeno: false, otvoren: false, promatracVelicine: null, prozor: null, ceka: false, imaloOdgovora: false };

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

    function rasiri() {
      if (!S.pozornica || !S.sklopljeno) return;
      S.sklopljeno = false;
      oznaci(false);
      S.pozornica.rasiri();
      if (S.otvoren) S.pozornica.pokazi();
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
      if (kupacJeOdgovorio(kor)) {
        // prvi odgovor kupca: pozornica se sklopi (dok je chat zatvoren, odmah)
        S.imaloOdgovora = true;
        sklopi(!S.otvoren);
      } else if (S.sklopljeno && S.imaloOdgovora && imaRazgovor(kor)) {
        // novi razgovor (gumb gore): pozornica i flakon se vrate
        S.imaloOdgovora = false;
        rasiri();
      }
      if (S.otvoren) {
        // prozor se pojavio tek nakon otvaranja: flakon i razgovor kreću sad
        if (!S.sklopljeno && !S.pozornica.ziv()) S.pozornica.pokazi();
        zapocni();
      }
    }
    function uskladiUskoro() {
      if (S.ceka) return;
      S.ceka = true;
      requestAnimationFrame(uskladi);
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
      if (kupacJeOdgovorio(kor)) { S.imaloOdgovora = true; sklopi(true); }
      else if (!S.sklopljeno) S.pozornica.pokazi();
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
        if (prozor && (MOBITEL || prozor.clientHeight < granica) && S.otvoren && S.pozornica) sklopi(false);
      }
      kor.addEventListener('pointerdown', dodir, true);
    }

    // Hrvatski natpisi gumba su u CSS-u (content); čitač zaslona dobije
    // hrvatsko ime (aria-label). Samo atribut, u chat se ništa ne umeće.
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
        new MutationObserver(function () { imenaGumba(S.kor); uskladiUskoro(); })
          .observe(S.kor, { childList: true, subtree: true });
        uskladi();
        // oblik flakona i WebGL se pripreme unaprijed, kad preglednik miruje
        const kasnije = window.requestIdleCallback || function (f) { return setTimeout(f, 1200); };
        kasnije(function () { if (S.pozornica) S.pozornica.anim.pripremi(); }, { timeout: 2500 });
      });
    }

    return { pokreni: pokreni };
  })();

  try { MX_JEDAN.pokreni(); }
  catch (e) { console.warn('[Martimex] Chat na jednom ekranu nije pokrenut:', e); }

})();
