(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — početni ekran chata s Marti (v2)
  //
  //  Kad se chat otvori, umjesto praznog Voiceflow prozora prikaže se
  //  početni ekran na crnoj podlozi:
  //
  //   - u sredini "živi" AI objekt od tisuća svjetlećih točkica složenih
  //     u tanke linije, kao metalna tkanina: polako se okreće,
  //     diše, a površina mu se stalno valovito gužva i mijenja
  //   - objekt se zatim fluidno pretopi u flakon po uzoru na Xerjoff 1861
  //     (Naxos): fasetirano staklo (jednako široko sprijeda i sa strane) s
  //     medenom tekućinom, zlatni prsten, zlatni čep sa šiljkom i zlatna
  //     pločica u obliku trapeza sa znakom X; flakon nastane malo okrenut
  //     ulijevo i bez zastoja se jednoliko okreće (kao bočica)
  //   - flakon se pretopi u drugu bočicu parfema (staklo s čepom i rozom
  //     tekućinom koja se lagano njiše; niz staklo prođe odsjaj), a ona u
  //     natpis "Marti", koji se slaže slovo po slovo slijeva nadesno; ispod
  //     natpisa se pojavi podnaslov
  //   - natpis neko vrijeme svjetluca (preko njega prijeđe sjaj), pa se
  //     pretopi natrag u objekt i sve kreće ispočetka
  //   - svaki prijelaz je tekuć: točkice ne putuju sve odjednom nego u
  //     valu, zavrtlože se kao dim i slegnu na novo mjesto; objekt se pri
  //     tome okreće tako da natpis na kraju uvijek stoji ravno prema nama
  //   - animacija je u gornjem dijelu, a ispod nje stalno stoji tekst
  //     (pozdrav i kratki opis): ne mijenja se dok se oblici izmjenjuju.
  //     Iznad pozdrava treperi zvjezdica od ružičastog zlata, "AI beauty
  //     asistent!" je metalno ružičasto zlato preko kojeg prelazi sjaj, a
  //     opis se pri otvaranju ispiše riječ po riječ, kao da ga AI upravo
  //     piše (uz kursor koji nakon toga nestane)
  //   - na dnu gumb "Početak" (s rubom od ružičastog zlata kao gumb chata):
  //     tek kad se on pritisne, kreće razgovor, tj. standardni Voiceflow
  //     workflow. Točkice se tada rasprše kao izmaglica parfema, a chat
  //     se otvori u krugu koji se širi od gumba
  //   - gore: natpis MARTIMEX i gumb za zatvaranje chata
  //   - na računalu se objekt lagano nagne prema mišu
  //
  //  Početni ekran se prikaže pri prvom otvaranju chata nakon svakog
  //  učitavanja stranice. Ako razgovor već postoji (npr. korisnik je s
  //  preporuke otišao na stranicu proizvoda), "Početak" samo otkrije taj
  //  razgovor; nakon toga se chat do sljedećeg učitavanja stranice otvara
  //  ravno na razgovor. Voiceflow razgovor pamti samo dok je kartica
  //  preglednika otvorena, pa svaki novi posjet počinje ispočetka (oboje se
  //  mijenja u POSTAVKAMA). Svako otvaranje pokreće animaciju ispočetka.
  //
  //  Tehnički:
  //   - Voiceflowu se isključi "autostart" (preko window.MartimexVoiceflow,
  //     koji loader.js preda Voiceflowu), pa otvaranje chata više samo ne
  //     pokreće razgovor
  //   - početni ekran je sloj unutar Voiceflowova prozora chata
  //     (.vfrc-chat, u shadow DOM-u elementa #voiceflow-chat), preko
  //     svega ostalog; dijelovi chata ispod njega su za to vrijeme
  //     isključeni (inert), pa ih ni tipkovnica ne može dohvatiti
  //   - "Početak" pritisne Voiceflowov (skriveni) gumb za početak razgovora
  //     (#vfrc-start-chat), pa razgovor kreće potpuno standardno
  //   - animacija se crta u WebGL-u: jedan poziv crtanja po sličici, sav
  //     račun (oblici, šum, prijelazi) radi grafička kartica, pa je glatka
  //     i na mobitelu. Oblici se izračunaju unaprijed, dok preglednik
  //     miruje, a animacija se vrti samo dok je početni ekran otvoren
  //   - ako WebGL ne radi, umjesto animacije je natpis "Marti"
  //   - "Smanji pokrete" (postavka uređaja): natpis "Marti" od točkica
  //     miruje, bez prijelaza
  //   - ako se ovaj modul ne učita, chat se ponaša kao prije (razgovor krene
  //     čim se chat otvori); ako zakaže pri otvaranju, razgovor se pokrene
  //     sam. Ako Voiceflow jednog dana promijeni prozor pa se početni ekran
  //     ne može prikazati, ostaje Voiceflowov gumb za početak razgovora
  // ═════════════════════════════════════════════════════════════════════

  if (window.__mxPocetna) return;   // zaštita ako se modul učita dvaput
  window.__mxPocetna = true;


  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE — sve što ćeš možda htjeti mijenjati nalazi se ovdje
  // ─────────────────────────────────────────────────────────────────────
  const MX_POCETNA_POSTAVKE = {
    boje: {                   // uvijek u obliku #rrggbb
      podloga: '#000000',     // crna podloga početnog ekrana
      srebro:  '#e8e6eb',     // točkice AI objekta i stakla bočice
      roza:    '#e2c3ba',     // prašnjava roza iza loga: tekućina u bočici, rub gumba
      puder:   '#f6ebe7',     // najsvjetlija roza: natpis "Marti", tekst, gumb
      zlato:   '#e0bb72'      // zlatni čep, prsten i pločica flakona, medena tekućina u njemu
    },

    // Fontovi iz mape fonts/ (učitava ih i kartica-artikla.js); natpis
    // "Marti" se od točkica slaže u Cormorant Garamondu, kao nazivi parfema
    font: '"MX Jost", "Avenir Next", Avenir, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontNatpisa: '"MX Cormorant", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif',

    natpis: 'Marti',                          // riječ u koju se pretopi bočica
    podnaslov: 'Vodič kroz svijet mirisa',    // ispod natpisa ('' = bez podnaslova)
    zaglavlje: 'Martimex',                    // gore u sredini ('' = bez)
    tekstGumba: 'Početak',

    // Tekst između animacije i gumba; stoji cijelo vrijeme ('' = bez)
    predPozdrav: 'Ja sam Vaš',                 // mali razmaknuti redak iznad pozdrava
    pozdrav: 'AI beauty asistent!',
    opis: 'Trebate pomoć pri odabiru proizvoda, imate pitanje o narudžbi ili Vas zanima nešto drugo vezano uz Martimex? Slobodno mi se obratite.',

    // Trajanje dijelova animacije u sekundama
    trajanje: {
      pojava: 1.6,            // točkice se iz izmaglice skupe u AI objekt
      objekt: 3.4,            // živi AI objekt
      flakon: 4.4,            // flakon po uzoru na Xerjoff 1861 (Naxos): nastane malo okrenut ulijevo i jednoliko se okreće
      bocica: 3.2,            // bočica parfema
      natpis: 5,              // natpis "Marti"
      prijelaz: 2.4           // svaki prijelaz iz oblika u oblik
    },
    ponavljaj: true,          // false → animacija stane na natpisu "Marti"

    // Broj točkica: više = gušće i sjajnije, ali više posla za uređaj
    tocaka: 26000,            // računalo
    tocakaMobitel: 16000,     // mobitel i tablet

    nagibPremaMisu: true,     // na računalu se objekt lagano nagne prema mišu

    // Kad se prikazuje početni ekran:
    // true  → pri prvom otvaranju chata nakon svakog učitavanja stranice, i
    //         kad razgovor već postoji ("Početak" ga tada samo otkrije; novi
    //         razgovor krene samo ako ga još nema ili je stari završio)
    // false → samo dok razgovor još nije započeo
    iKadRazgovorPostoji: true,

    // Koliko dugo Voiceflow pamti razgovor:
    // 'sessionStorage' → dok je kartica preglednika otvorena: kupac može
    //                    šetati po webshopu, a svaki novi posjet počinje ispočetka
    // 'localStorage'   → trajno (i idući tjedan se otvori stari razgovor)
    // 'memory'         → samo do sljedećeg učitavanja stranice
    // ''               → kako je postavljeno u Voiceflowu
    pamcenje: 'sessionStorage'
  };


  // ─────────────────────────────────────────────────────────────────────
  //  MOTOR — ispod ove linije ne treba ništa mijenjati
  // ─────────────────────────────────────────────────────────────────────
  const MX_POCETNA = (function () {
    'use strict';

    const P = MX_POCETNA_POSTAVKE;
    const B = P.boje;
    const T = P.trajanje || {};
    const HOST = 'voiceflow-chat';        // element u čiji shadow DOM Voiceflow crta chat
    const PROZOR = '.vfrc-chat';          // Voiceflowov prozor chata (službena klasa)
    const START = '#vfrc-start-chat';     // Voiceflowov gumb "Start new chat"
    // adresa mape u kojoj je ova skripta (GitHub Pages) — odatle se učitavaju fontovi
    const BAZA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/pocetna-chata.js')
      .replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
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
    function prozirna(hex, a) { return 'rgba(' + rgb(hex).join(', ') + ', ' + a + ')'; }
    function boja01(hex) { return rgb(hex).map(function (v) { return v / 255; }); }
    function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function zasiti(c, k) {                      // jača zasićenost boje (0..1)
      const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      return c.map(function (v) { return sat(l + (v - l) * k); });
    }
    function glatko(x) { x = sat(x); return x * x * (3 - 2 * x); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function sekunde(v, zadano, min) { v = +v; return isFinite(v) && v >= min ? v : zadano; }


    // ═══════════════════════════════════════════════════════════════════
    //  OBLICI — tri oblika od istog broja točkica, izračunata unaprijed
    //
    //  Točkice se u svakom obliku slažu u linije (prstenove oko objekta i
    //  bočice, retke u slovima), a po linijama su gušće nego što su linije
    //  razmaknute: zato oblik izgleda kao da je satkan od tankih niti.
    //  Mjere su u "svjetskim jedinicama" (objekt ima polumjer 0,8).
    // ═══════════════════════════════════════════════════════════════════
    const OMJER = 2.3;             // koliko su točkice na liniji gušće nego razmak linija
    const SIRINA_NATPISA = 1.9;    // širina natpisa "Marti"
    const RED_NATPISA = 0.0155;    // razmak među linijama u slovima
    const PASOVA = 48;             // oblici se spajaju u vodoravnim pojasevima (vidi spoji)
    const VELICINA_TOCKE = 23;     // brojeva po točkici u spremniku za grafičku karticu

    // Profil bočice odozgo prema dolje:
    // [visina, pola širine, pola dubine, oblik presjeka]
    // (oblik 2 = krug, veći broj = pravokutnik sa sve oštrijim kutovima)
    const BOCICA = [
      [ 0.90, 0.00, 0.00, 6],      // sredina vrha čepa
      [ 0.90, 0.26, 0.18, 6],      // rub vrha čepa
      [ 0.52, 0.26, 0.18, 6],      // dno čepa
      [ 0.52, 0.14, 0.14, 2.4],    // ispod čepa prema prstenu
      [ 0.47, 0.14, 0.14, 2],      // prsten na grlu
      [ 0.47, 0.095, 0.095, 2],
      [ 0.37, 0.095, 0.095, 2],    // grlo
      [ 0.335, 0.34, 0.22, 4],     // rame
      [ 0.31, 0.55, 0.31, 6],
      [-0.83, 0.55, 0.31, 6],      // bok tijela
      [-0.86, 0.52, 0.29, 6],      // zaobljeni rub dna
      [-0.86, 0.00, 0.00, 6]       // sredina dna
    ];
    const DNO_BOCICE = -0.86, VRH_BOCICE = 0.90;

    // Ponovljiv "slučajni" niz (isti oblik pri svakom učitavanju)
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

    // n točaka jednoliko po ukupnoj duljini svih linija; za svaku točku
    // vraća redni broj linije i udio duljine te linije (0..1)
    function poLinijama(duljine, n) {
      let ukupno = 0;
      for (let i = 0; i < duljine.length; i++) ukupno += duljine[i];
      const korak = ukupno / n;
      const linija = new Int32Array(n), udio = new Float32Array(n);
      let l = 0, pocetak = 0;
      for (let i = 0; i < n; i++) {
        const s = (i + 0.5) * korak;
        while (l < duljine.length - 1 && s >= pocetak + duljine[l]) { pocetak += duljine[l]; l++; }
        linija[i] = l;
        udio[i] = duljine[l] > 0 ? sat((s - pocetak) / duljine[l]) : 0;
      }
      return { linija: linija, udio: udio };
    }

    // ── AI objekt: jedinična kugla od vodoravnih prstenova (šum je gužva
    //    tek u grafičkoj kartici, pa se ovdje sprema samo smjer točke)
    function kugla(n) {
      const K = Math.max(8, Math.round(Math.PI / Math.sqrt(4 * Math.PI * OMJER / n)));
      const duljine = [];
      for (let k = 0; k < K; k++) duljine.push(2 * Math.PI * Math.sin((k + 0.5) / K * Math.PI));
      const r = poLinijama(duljine, n);
      const poz = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const fi = (r.linija[i] + 0.5) / K * Math.PI;
        const th = (r.udio[i] + r.linija[i] * 0.618034) * 2 * Math.PI;   // prstenovi ne počinju u istoj točki
        poz[3 * i] = Math.sin(fi) * Math.cos(th);
        poz[3 * i + 1] = Math.cos(fi);
        poz[3 * i + 2] = Math.sin(fi) * Math.sin(th);
      }
      return { poz: poz };
    }

    // ── Bočica: prstenovi po profilu; presjek je superelipsa (od kruga do
    //    pravokutnika zaobljenih kutova), točkice jednoliko po obodu
    function tockaPresjeka(a, b, e, th) {
      const c = Math.cos(th), s = Math.sin(th);
      return [a * Math.sign(c) * Math.pow(Math.abs(c), 2 / e), b * Math.sign(s) * Math.pow(Math.abs(s), 2 / e)];
    }
    function obodPresjeka(a, b, e) {           // duljina oboda od kuta 0 do kuta th (tablica)
      const M = 96, tab = new Float32Array(M + 1);
      let px = a, pz = 0, d = 0;
      for (let j = 1; j <= M; j++) {
        const q = tockaPresjeka(a, b, e, j / M * 2 * Math.PI);
        d += Math.hypot(q[0] - px, q[1] - pz);
        px = q[0]; pz = q[1];
        tab[j] = d;
      }
      return tab;
    }
    function kutNaObodu(tab, s) {
      const M = tab.length - 1;
      let lo = 0, hi = M;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m] <= s) lo = m; else hi = m; }
      const dl = tab[hi] - tab[lo];
      return (lo + (dl > 0 ? (s - tab[lo]) / dl : 0)) / M * 2 * Math.PI;
    }
    function bocica(n) {
      const seg = [];
      let ukupno = 0;
      for (let i = 0; i < BOCICA.length - 1; i++) {
        const p = BOCICA[i], q = BOCICA[i + 1];
        const dm = (q[1] + q[2] - p[1] - p[2]) / 2, dy = q[0] - p[0];
        const d = Math.hypot(dm, dy);
        if (d < 1e-6) continue;
        // normala profila prema van: (vodoravno, okomito)
        seg.push({ p: p, q: q, d: d, od: ukupno, nr: -dy / d, ny: dm / d });
        ukupno += d;
      }
      function prstenovi(korak) {
        const k = Math.max(6, Math.round(ukupno / korak)), kk = ukupno / k, pr = [];
        for (let i = 0; i < k; i++) {
          const s = (i + 0.5) * kk;
          let j = 0;
          while (j < seg.length - 1 && s > seg[j].od + seg[j].d) j++;
          const g = seg[j], t = sat((s - g.od) / g.d);
          const a = lerp(g.p[1], g.q[1], t), b = lerp(g.p[2], g.q[2], t), e = lerp(g.p[3], g.q[3], t);
          const tab = obodPresjeka(a, b, e);
          pr.push({ y: lerp(g.p[0], g.q[0], t), a: a, b: b, e: e, nr: g.nr, ny: g.ny, tab: tab, obod: tab[tab.length - 1] });
        }
        return pr;
      }
      // razmak prstenova ovisi o površini bočice, a površina o prstenovima:
      // prvo gruba procjena, pa točan izračun
      let pr = prstenovi(Math.sqrt(4.5 * OMJER / n));
      const povrsina = pr.reduce(function (z, r) { return z + r.obod; }, 0) * ukupno / pr.length;
      pr = prstenovi(Math.sqrt(povrsina * OMJER / n));

      const r = poLinijama(pr.map(function (x) { return x.obod; }), n);
      const poz = new Float32Array(n * 3), nor = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const R = pr[r.linija[i]];
        const th = kutNaObodu(R.tab, ((r.udio[i] + r.linija[i] * 0.618034) % 1) * R.obod);
        const q = tockaPresjeka(R.a, R.b, R.e, th);
        // normala: presjek (superelipsa) × nagib profila
        const c = Math.cos(th), s = Math.sin(th);
        let nx = Math.sign(c) * Math.pow(Math.abs(c), 2 * (R.e - 1) / R.e) / Math.max(R.a, 1e-3);
        let nz = Math.sign(s) * Math.pow(Math.abs(s), 2 * (R.e - 1) / R.e) / Math.max(R.b, 1e-3);
        const nl = Math.hypot(nx, nz) || 1;
        nx = nx / nl * R.nr; nz = nz / nl * R.nr;
        const NL = Math.hypot(nx, R.ny, nz) || 1;
        poz[3 * i] = q[0]; poz[3 * i + 1] = R.y; poz[3 * i + 2] = q[1];
        nor[3 * i] = nx / NL; nor[3 * i + 1] = R.ny / NL; nor[3 * i + 2] = nz / NL;
      }
      return { poz: poz, nor: nor };
    }

    // ── Flakon po uzoru na Xerjoff 1861 (Naxos): fasetirano tijelo, jednako
    //    široko sprijeda i sa strane (presjek je osmerokut: četiri široke
    //    plohe, tj. prednja, stražnja i bokovi, i između njih četiri kose
    //    fasete), koje se od zaobljenih ramena blago sužava prema dnu; zlatni
    //    prsten na grlu i zlatni čep kojemu se vrh straga uzdiže u šiljak
    //    (sprijeda izgleda kao šiljak, sa strane kao val izvijen naprijed). Na
    //    prednjoj plohi zlatna pločica u obliku trapeza (gore šira) s
    //    dvostrukim okvirom i znakom X. Mjere su izmjerene s fotografije
    //    bočice (u pikselima; bočica je na njoj visoka 695 px).
    const FLAKON_K = (VRH_BOCICE - DNO_BOCICE) / 695;   // piksel fotografije → svjetska jedinica
    // [visina od dna, pola širine, izraženost faseta]
    const FLAKON = [
      [0, 0, 1], [0, 66, 1], [4, 84, 1], [9, 93, 1], [15, 96, 1], [23, 99.5, 1],     // dno sa zaobljenim rubom
      [39, 106, 1], [71, 116.5, 1], [103, 125, 1], [135, 132.5, 1], [167, 138.5, 1], // tijelo se prema dnu sužava
      [199, 144, 1], [231, 148, 1], [263, 152, 1], [295, 154.5, 1], [327, 156, 1],
      [351, 155.5, 1], [367, 151.5, 1], [383, 145.5, 1], [399, 136.5, 1],             // zaobljena ramena
      [415, 124, 1], [431, 108, .95], [447, 86.5, .85], [455, 71.5, .75], [461, 58, .6],
      [461, 58, 0], [471, 58, 0], [471, 62.5, 0], [501, 62.5, 0],                     // zlatni prsten
      [501, 53, 0], [511, 52.5, 0], [527, 56.5, 0], [543, 59.5, 0], [559, 61.5, 0],   // čep se prema gore
      [575, 63, 0], [583, 64, 0], [599, 64, 0]                                        // lagano širi do ruba
    ];
    const FLAKON_ZLATO = 461, FLAKON_RUB = 599, FLAKON_VRH = 695;
    const PLOHA = 0.48;           // široke plohe zauzimaju 48 % širine, između njih su kose fasete
    // pločica (trapez) i znak X na njoj: [visina od dna, pola širine] s fotografije
    const PLOCICA_VRH = [311, 51], PLOCICA_DNO = [158, 41], ZNAK_VRH = 273, ZNAK_DNO = 199, ZNAK_POLA = 25;
    const RED_PLOCICE = 0.0045;   // razmak linija na pločici (gušće od tijela, da se vidi znak)
    // vrsta točke (4. broj uz mjesto na flakonu): staklo, zlato, pločica, znak/okvir, brid
    const STAKLO = 0, ZLATO = 1, PLOCICA = 2, SLOVO = 3, BRID = 4;
    // Znak X (Xerjoff) precrtan sa znaka: debeli potez sa šiljastim serifom
    // gore lijevo i repom koji se dolje desno produžuje i savija; tanki potez
    // prekinut na križanju, s vodoravnim serifima. Koordinate u okviru 495 × 709.
    const ZNAK_X = [
      [32, 117, 170, 0, 154, 27, 150, 57, 154, 87, 167, 122, 187, 152, 212, 187, 242, 232, 277, 282, 312, 332,
        342, 377, 372, 427, 402, 482, 427, 537, 440, 587, 440, 627, 427, 667, 407, 697, 384, 709, 402, 677,
        412, 637, 410, 597, 397, 557, 372, 507, 342, 457, 312, 407, 282, 362, 252, 317, 217, 267, 182, 217,
        152, 172, 127, 137, 107, 109, 97, 100, 82, 97, 57, 105],
      [317, 34, 495, 34, 495, 39, 462, 43, 437, 59, 412, 87, 377, 134, 337, 189, 304, 234, 289, 252, 270, 222,
        287, 197, 312, 162, 342, 119, 357, 94, 360, 72, 352, 52, 332, 40, 317, 39],
      [207, 312, 225, 345, 192, 387, 157, 437, 139, 472, 137, 499, 147, 517, 162, 527, 177, 529, 177, 535,
        0, 535, 0, 529, 32, 525, 67, 509, 97, 479, 132, 419, 172, 359]
    ];

    // Presjek tijela: fasetirani osmerokut (meki minimum udaljenosti do
    // ravnina daje blago zaobljene bridove), stopljen s krugom prema
    // izraženosti faseta. Računa se za pola širine 1 i pamti, jer većina
    // prstenova ima iste proporcije i razlikuje se samo veličinom.
    let PRESJECI = {};
    function jedinicniPresjek(f) {
      const c = Math.SQRT1_2, cd = (1 + PLOHA) * c;
      const R = [1, 0, 1, -1, 0, 1, 0, 1, 1, 0, -1, 1, c, c, cd, -c, c, cd, c, -c, cd, -c, -c, cd];
      const M = 192, mek = 0.012, t = new Float64Array(8);
      const x = new Float32Array(M), z = new Float32Array(M);
      for (let j = 0; j < M; j++) {
        const th = j / M * 2 * Math.PI, ux = Math.cos(th), uz = Math.sin(th);
        let min = Infinity, zbroj = 0, k = 0;
        for (let q = 0; q < 24; q += 3) {
          const d = ux * R[q] + uz * R[q + 1];
          if (d > 1e-6) { const v = R[q + 2] / d; t[k++] = v; if (v < min) min = v; }
        }
        for (let q = 0; q < k; q++) zbroj += Math.exp(-(t[q] - min) / mek);
        const rp = min - mek * Math.log(zbroj);
        const r = 1 + (rp - 1) * f;
        x[j] = ux * r; z[j] = uz * r;
      }
      const vx = new Float32Array(M), vz = new Float32Array(M), tab = new Float32Array(M + 1), brid = new Uint8Array(M);
      for (let j = 0; j < M; j++) {
        const a = (j + M - 1) % M, b = (j + 1) % M;
        let ex = z[b] - z[a], ez = x[a] - x[b];
        const l = Math.hypot(ex, ez) || 1;
        ex /= l; ez /= l;
        if (ex * x[j] + ez * z[j] < 0) { ex = -ex; ez = -ez; }
        vx[j] = ex; vz[j] = ez;
        tab[j + 1] = tab[j] + Math.hypot(x[b] - x[j], z[b] - z[j]);
      }
      if (f > 0.5) {
        // brid između faseta: ondje gdje se smjer plohe najjače mijenja
        const promjena = new Float32Array(M);
        for (let j = 0; j < M; j++) {
          const a = (j + M - 1) % M, b = (j + 1) % M;
          promjena[j] = Math.hypot(vx[b] - vx[a], vz[b] - vz[a]);
        }
        for (let j = 0; j < M; j++) {
          if (promjena[j] > 0.15 && promjena[j] >= promjena[(j + M - 1) % M] && promjena[j] >= promjena[(j + 1) % M]) brid[j] = 1;
        }
      }
      return { x: x, z: z, vx: vx, vz: vz, tab: tab, obod: tab[M], brid: brid };
    }
    function presjekFlakona(W, f) {
      const kljuc = f.toFixed(3);
      const J = PRESJECI[kljuc] || (PRESJECI[kljuc] = jedinicniPresjek(f));
      return { J: J, W: W, obod: J.obod * W };
    }
    function naPresjeku(P, s) {
      const J = P.J, M = J.x.length;
      s /= P.W;
      let lo = 0, hi = M;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (J.tab[m] <= s) lo = m; else hi = m; }
      const dl = J.tab[lo + 1] - J.tab[lo], u = dl > 0 ? sat((s - J.tab[lo]) / dl) : 0, b = (lo + 1) % M;
      return { x: lerp(J.x[lo], J.x[b], u) * P.W, z: lerp(J.z[lo], J.z[b], u) * P.W, vx: lerp(J.vx[lo], J.vx[b], u), vz: lerp(J.vz[lo], J.vz[b], u), brid: J.brid[lo] };
    }

    // Vodoravni presjek tijela zadanog vrijednostima v na mreži (N + 1) × (N + 1)
    // preko kvadrata [-X, X]² (< 0 unutra): dužine po rubu (marching
    // squares), redom [x1, z1, x2, z2, ...]
    const RUBOVI = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]],
      8: [[2, 3]], 9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[1, 2]], 12: [[3, 1]], 13: [[0, 1]], 14: [[3, 0]] };
    function presjekPlohe(v, X, N) {
      const h = 2 * X / N, out = [];
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const a = v[i * (N + 1) + j], b = v[(i + 1) * (N + 1) + j], c = v[(i + 1) * (N + 1) + j + 1], d = v[i * (N + 1) + j + 1];
          const idx = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
          if (idx === 0 || idx === 15) continue;
          const x0 = -X + i * h, z0 = -X + j * h;
          const tocka = function (e) {
            let px, pz, qx, qz, vp, vq;
            if (e === 0) { px = x0; pz = z0; qx = x0 + h; qz = z0; vp = a; vq = b; }
            else if (e === 1) { px = x0 + h; pz = z0; qx = x0 + h; qz = z0 + h; vp = b; vq = c; }
            else if (e === 2) { px = x0; pz = z0 + h; qx = x0 + h; qz = z0 + h; vp = d; vq = c; }
            else { px = x0; pz = z0; qx = x0; qz = z0 + h; vp = a; vq = d; }
            const t = vp / (vp - vq);
            return [px + (qx - px) * t, pz + (qz - pz) * t];
          };
          RUBOVI[idx].forEach(function (par) {
            const A = tocka(par[0]), Bt = tocka(par[1]);
            out.push(A[0], A[1], Bt[0], Bt[1]);
          });
        }
      }
      return out;
    }

    // Znak X kao maska: nacrta se u malo skriveno platno, pa se za svaku
    // točku pločice pogleda je li u znaku (u, v od 0 do 1)
    function maskaZnaka() {
      const W = 99, H = 142;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      if (!ctx) return function () { return false; };
      ctx.scale(W / 495, H / 709);
      ctx.fillStyle = ctx.strokeStyle = '#fff';
      ctx.lineWidth = 8;                     // tanki potezi i serifi malo deblji, da ih linije uhvate
      ctx.lineJoin = 'round';
      ZNAK_X.forEach(function (o) {
        ctx.beginPath();
        for (let i = 0; i < o.length; i += 2) { if (i) ctx.lineTo(o[i], o[i + 1]); else ctx.moveTo(o[i], o[i + 1]); }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      const d = ctx.getImageData(0, 0, W, H).data;
      return function (u, v) {
        const i = Math.floor(u * W), j = Math.floor(v * H);
        return i >= 0 && j >= 0 && i < W && j < H && d[(j * W + i) * 4 + 3] > 96;
      };
    }

    function flakon(n) {
      const K = FLAKON_K;
      const tocke = FLAKON.map(function (p) { return { h: p[0], y: DNO_BOCICE + p[0] * K, W: p[1] * K, f: p[2] }; });
      const seg = [];
      let ukupno = 0;
      for (let i = 0; i < tocke.length - 1; i++) {
        const p = tocke[i], q = tocke[i + 1];
        const dm = q.W - p.W, dy = q.y - p.y;
        const d = Math.hypot(dm, dy);
        if (d < 1e-6) continue;
        // profil ide odozdo prema gore: normala prema van je (dy, -dm)
        seg.push({ p: p, q: q, d: d, od: ukupno, nr: dy / d, ny: -dm / d });
        ukupno += d;
      }
      function sirinaNa(y) {                       // pola širine tijela na visini y
        for (let i = 0; i < tocke.length - 1; i++) {
          const p = tocke[i], q = tocke[i + 1];
          if (y >= p.y && y <= q.y && q.y > p.y) return lerp(p.W, q.W, (y - p.y) / (q.y - p.y));
        }
        return 0;
      }
      // vrh čepa: valjak odrezan plohom koja je sprijeda na rubu čepa, a
      // straga se uzdiže; po širini se sužava gotovo ravnim bokovima u šiljak
      const R0 = FLAKON[FLAKON.length - 1][1] * K, h0 = DNO_BOCICE + FLAKON_RUB * K, H = (FLAKON_VRH - FLAKON_RUB) * K;
      function vrhCepa(x, z) {
        const straga = sat((1 - z / R0) / 2), sredina = sat(1 - Math.pow(Math.min(1, Math.abs(x) / R0), 1.5));
        return h0 + H * Math.pow(straga, 1.5) * sredina;
      }
      function cep(x, y, z) { return Math.max(Math.hypot(x, z) - R0, y - vrhCepa(x, z)); }

      // mreža preko vrha čepa: udaljenost od stijenke i visina reza (ne ovise o visini presjeka)
      const MX = 64, MR = R0 * 1.08, mh = 2 * MR / MX;
      const doStijenke = new Float32Array((MX + 1) * (MX + 1)), rez = new Float32Array((MX + 1) * (MX + 1)), v = new Float32Array((MX + 1) * (MX + 1));
      for (let i = 0; i <= MX; i++) {
        for (let j = 0; j <= MX; j++) {
          const x = -MR + i * mh, z = -MR + j * mh;
          doStijenke[i * (MX + 1) + j] = Math.hypot(x, z) - R0;
          rez[i * (MX + 1) + j] = vrhCepa(x, z);
        }
      }

      // pločica: trapez (gore širi) na prednjoj plohi, znak X u sredini
      const PT = DNO_BOCICE + PLOCICA_VRH[0] * K, PB = DNO_BOCICE + PLOCICA_DNO[0] * K;
      const XT = DNO_BOCICE + ZNAK_VRH * K, XB = DNO_BOCICE + ZNAK_DNO * K, XW = ZNAK_POLA * K;
      function polaPlocice(y) { return lerp(PLOCICA_DNO[1], PLOCICA_VRH[1], (y - PB) / (PT - PB)) * K; }
      const uZnaku = maskaZnaka();
      function naZnaku(x, y) {                      // okvir (vanjski i unutarnji) ili znak X
        const hw = polaPlocice(y), rub = Math.min(hw - Math.abs(x), y - PB, PT - y);
        if (rub < 0) return false;
        if (rub < 0.008 || Math.abs(rub - 0.017) < 0.0022) return true;
        return y <= XT && y >= XB && uZnaku((x + XW) / (2 * XW), (XT - y) / (XT - XB));
      }

      function linije(korak, grubo) {
        const L = [];
        const k = Math.max(8, Math.round(ukupno / korak)), kk = ukupno / k;
        for (let i = 0; i < k; i++) {
          const s = (i + 0.5) * kk;
          let j = 0;
          while (j < seg.length - 1 && s > seg[j].od + seg[j].d) j++;
          const g = seg[j], t = sat((s - g.od) / g.d);
          const P = presjekFlakona(lerp(g.p.W, g.q.W, t), lerp(g.p.f, g.q.f, t));
          L.push({ prsten: P, y: lerp(g.p.y, g.q.y, t), nr: g.nr, ny: g.ny, zlato: lerp(g.p.h, g.q.h, t) >= FLAKON_ZLATO, duljina: P.obod, tezina: P.obod });
        }
        if (grubo) return L;
        for (let y = h0 + korak * 0.3; y < h0 + H; y += korak * 0.6) {      // vrh čepa malo gušće
          for (let q = 0; q < v.length; q++) v[q] = Math.max(doStijenke[q], y - rez[q]);
          const d = presjekPlohe(v, MR, MX);
          for (let q = 0; q < d.length; q += 4) {
            const len = Math.hypot(d[q + 2] - d[q], d[q + 3] - d[q + 1]);
            if (len > 1e-7) L.push({ a: [d[q], d[q + 1]], b: [d[q + 2], d[q + 3]], y: y, duljina: len, tezina: len });
          }
        }
        // okvir i znak X: vlastite guste linije preko pločice (kao natpis "Marti")
        const dx = 0.0008;
        for (let y = PB + RED_PLOCICE / 2; y < PT; y += RED_PLOCICE) {
          const hw = polaPlocice(y), zf = sirinaNa(y) + 0.0075;
          let od = null;
          for (let x = -hw; x <= hw + dx; x += dx) {
            const u = x <= hw && naZnaku(x, y);
            if (u && od === null) od = x;
            else if (!u && od !== null) {
              const len = x - od;
              if (len > 1e-6) L.push({ znak: true, a: [od, zf], b: [x, zf], y: y, duljina: len, tezina: len * 3 });
              od = null;
            }
          }
        }
        return L;
      }
      // razmak linija ovisi o površini: prvo gruba procjena s rijetkim linijama
      let korak = 0.05;
      let L = linije(korak, true);
      const povrsina = L.reduce(function (z, l) { return z + l.duljina; }, 0) * korak;
      korak = Math.sqrt(povrsina * OMJER / n);
      L = linije(korak);

      // točke se dijele po težini linija (linije znaka su 3 puta gušće)
      const r = poLinijama(L.map(function (l) { return l.tezina; }), n);
      const poz = new Float32Array(n * 3), nor = new Float32Array(n * 3), vrsta = new Float32Array(n);
      const e = 0.002;
      for (let i = 0; i < n; i++) {
        const l = L[r.linija[i]];
        let x, y = l.y, z, nx, ny, nz, m;
        if (l.prsten) {
          const q = naPresjeku(l.prsten, ((r.udio[i] + r.linija[i] * 0.618034) % 1) * l.prsten.obod);
          x = q.x; z = q.z;
          nx = q.vx * l.nr; ny = l.ny; nz = q.vz * l.nr;
          m = l.zlato ? ZLATO : (q.brid ? BRID : STAKLO);
        } else if (l.znak) {
          x = lerp(l.a[0], l.b[0], r.udio[i]); z = l.a[1];
          nx = 0; ny = 0; nz = 1;
          m = SLOVO;
        } else {
          x = lerp(l.a[0], l.b[0], r.udio[i]); z = lerp(l.a[1], l.b[1], r.udio[i]);
          nx = cep(x + e, y, z) - cep(x - e, y, z); ny = cep(x, y + e, z) - cep(x, y - e, z); nz = cep(x, y, z + e) - cep(x, y, z - e);
          m = ZLATO;
          const u = (y - h0) / H;
          if (u > 0.5) z += R0 * 0.4 * (u - 0.5) * (u - 0.5) / 0.25;   // šiljak se pri vrhu izvija naprijed
        }
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        // točke stakla na mjestu pločice postaju zlatna pločica (malo strši)
        if ((m === STAKLO || m === BRID) && z > 0 && nz > 0.35 && y >= PB && y <= PT && Math.abs(x) <= polaPlocice(y)) {
          m = PLOCICA;
          x += nx * 0.006; y += ny * 0.006; z += nz * 0.006;
        }
        poz[3 * i] = x; poz[3 * i + 1] = y; poz[3 * i + 2] = z;
        nor[3 * i] = nx; nor[3 * i + 1] = ny; nor[3 * i + 2] = nz;
        vrsta[i] = m;
      }
      PRESJECI = {};                               // zapamćeni presjeci više ne trebaju
      return { poz: poz, nor: nor, vrsta: vrsta };
    }

    // ── Natpis: slova se nacrtaju u skriveno platno i "skeniraju" u
    //    vodoravnim linijama; točkice se jednoliko rasporede po dijelovima
    //    linija koji padaju u slova
    function natpis(n, rnd) {
      const tekst = String(P.natpis || 'Marti');
      const F = 240;
      const font = '700 ' + F + 'px ' + P.fontNatpisa;
      const c = document.createElement('canvas');
      let ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.font = font;
      const m = ctx.measureText(tekst);
      const lijevo = m.actualBoundingBoxLeft || 0, desno = m.actualBoundingBoxRight || m.width;
      const gore = m.actualBoundingBoxAscent || F * 0.72, dolje = m.actualBoundingBoxDescent || F * 0.05;
      const w = Math.ceil(lijevo + desno) + 8, h = Math.ceil(gore + dolje) + 8;
      if (w < 10 || h < 10) return null;
      c.width = w; c.height = h;
      ctx = c.getContext('2d');
      ctx.font = font;
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(tekst, 4 + lijevo, 4 + gore);
      const px = ctx.getImageData(0, 0, w, h).data;

      const k = SIRINA_NATPISA / (lijevo + desno);     // svjetske jedinice po pikselu platna
      const sx = 4 + (lijevo + desno) / 2, sy = 4 + (gore + dolje) / 2;
      const korak = RED_NATPISA / k;
      const dijelovi = [], duljine = [];
      for (let y = korak / 2; y < h; y += korak) {
        const yi = Math.min(h - 1, Math.round(y));
        let od = -1;
        for (let x = 0; x <= w; x++) {
          const puno = x < w && px[(yi * w + x) * 4 + 3] >= 128;
          if (puno && od < 0) od = x;
          else if (!puno && od >= 0) { dijelovi.push([od, x, y]); duljine.push((x - od) * k); od = -1; }
        }
      }
      if (!dijelovi.length) return null;
      const r = poLinijama(duljine, n);
      const poz = new Float32Array(n * 3);
      let pola = 0;
      for (let i = 0; i < n; i++) {
        const d = dijelovi[r.linija[i]];
        poz[3 * i] = (lerp(d[0], d[1], r.udio[i]) - sx) * k;
        poz[3 * i + 1] = (sy - d[2]) * k;
        poz[3 * i + 2] = (rnd() - 0.5) * 0.05;          // malo dubine, da natpis nije posve ravan
        pola = Math.max(pola, Math.abs(poz[3 * i + 1]));
      }
      return { poz: poz, pola: pola };
    }

    // ── Spajanje: koja točkica objekta postaje koja točkica flakona, bočice i
    //    natpisa. Svi oblici podijele se na vodoravne pojaseve (gornji pojas
    //    objekta → gornji pojas flakona → gornji pojas bočice → gornji redci
    //    natpisa). Unutar pojasa objekt, flakon i bočica se spoje po kutu oko
    //    osi, a bočica i natpis slijeva nadesno. Tako svaka točkica putuje
    //    kratkim, glatkim putem i prijelaz izgleda kao da se jedan oblik
    //    prelije u drugi.
    //    Rezultat: po točkici 23 broja (objekt, bočica, normala bočice,
    //    natpis, 4 slučajna broja, flakon s vrstom točke, normala flakona),
    //    redom kako ih čita grafička kartica.
    function spoji(kug, fla, boc, nat, n, rnd) {
      function poVisini(poz) {
        const idx = new Array(n);
        for (let i = 0; i < n; i++) idx[i] = i;
        return idx.sort(function (a, b) { return poz[3 * b + 1] - poz[3 * a + 1]; });
      }
      function kutovi(poz) {
        const k = new Float32Array(n);
        for (let i = 0; i < n; i++) k[i] = Math.atan2(poz[3 * i + 2], poz[3 * i]);
        return k;
      }
      const iK = poVisini(kug.poz), iF = poVisini(fla.poz), iB = poVisini(boc.poz), iN = poVisini(nat.poz);
      const kutK = kutovi(kug.poz), kutF = kutovi(fla.poz), kutB = kutovi(boc.poz);
      const natZaBoc = new Int32Array(n);
      const out = new Float32Array(n * VELICINA_TOCKE);
      for (let p = 0; p < PASOVA; p++) {
        const lo = Math.floor(p * n / PASOVA), hi = Math.floor((p + 1) * n / PASOVA);
        const pK = iK.slice(lo, hi).sort(function (a, b) { return kutK[a] - kutK[b]; });
        const pF = iF.slice(lo, hi).sort(function (a, b) { return kutF[a] - kutF[b]; });
        const pBk = iB.slice(lo, hi).sort(function (a, b) { return kutB[a] - kutB[b]; });
        const pBx = iB.slice(lo, hi).sort(function (a, b) { return boc.poz[3 * a] - boc.poz[3 * b]; });
        const pN = iN.slice(lo, hi).sort(function (a, b) { return nat.poz[3 * a] - nat.poz[3 * b]; });
        for (let j = 0; j < pBx.length; j++) natZaBoc[pBx[j]] = pN[j];
        for (let j = 0; j < pBk.length; j++) {
          const bi = pBk[j], ki = pK[j], fi = pF[j], ni = natZaBoc[bi], o = (lo + j) * VELICINA_TOCKE;
          out[o] = kug.poz[3 * ki]; out[o + 1] = kug.poz[3 * ki + 1]; out[o + 2] = kug.poz[3 * ki + 2];
          out[o + 3] = boc.poz[3 * bi]; out[o + 4] = boc.poz[3 * bi + 1]; out[o + 5] = boc.poz[3 * bi + 2];
          out[o + 6] = boc.nor[3 * bi]; out[o + 7] = boc.nor[3 * bi + 1]; out[o + 8] = boc.nor[3 * bi + 2];
          out[o + 9] = nat.poz[3 * ni]; out[o + 10] = nat.poz[3 * ni + 1]; out[o + 11] = nat.poz[3 * ni + 2];
          out[o + 12] = rnd(); out[o + 13] = rnd(); out[o + 14] = rnd(); out[o + 15] = rnd();
          out[o + 16] = fla.poz[3 * fi]; out[o + 17] = fla.poz[3 * fi + 1]; out[o + 18] = fla.poz[3 * fi + 2]; out[o + 19] = fla.vrsta[fi];
          out[o + 20] = fla.nor[3 * fi]; out[o + 21] = fla.nor[3 * fi + 1]; out[o + 22] = fla.nor[3 * fi + 2];
        }
      }
      return out;
    }

    // Priprema ide u manjim koracima s pauzama, da stranica nijednom ne
    // zapne; dok je chat otvoren (HITNO), pauze su najkraće moguće
    let HITNO = false;
    function pauza() {
      return new Promise(function (gotovo) {
        if (!HITNO && window.requestIdleCallback) window.requestIdleCallback(function () { gotovo(); }, { timeout: 400 });
        else setTimeout(gotovo, 0);
      });
    }

    // Oblici se računaju jednom (i čekaju font natpisa, najviše 2,5 s)
    let OBLICI = null;
    function pripremiOblike() {
      if (OBLICI) return OBLICI;
      const font = document.fonts && document.fonts.load
        ? Promise.race([
            document.fonts.load('700 100px ' + P.fontNatpisa, P.natpis).catch(function () {}),
            new Promise(function (r) { setTimeout(r, 2500); })
          ])
        : Promise.resolve();
      const o = { n: Math.max(2000, Math.round(+(MOBITEL ? P.tocakaMobitel : P.tocaka) || 16000)), rnd: slucajno(20251) };
      OBLICI = font.then(pauza).then(function () {
        o.kug = kugla(o.n);
        o.nat = natpis(o.n, o.rnd) || { poz: o.kug.poz.map(function (v, i) { return i % 3 === 2 ? 0 : v * 0.6; }), pola: 0.6 };
        return pauza();
      }).then(function () {
        o.boc = bocica(o.n);
        return pauza();
      }).then(function () {
        o.fla = flakon(o.n);
        return pauza();
      }).then(function () {
        return { podaci: spoji(o.kug, o.fla, o.boc, o.nat, o.n, o.rnd), n: o.n, pola: o.nat.pola };
      });
      return OBLICI;
    }


    // ═══════════════════════════════════════════════════════════════════
    //  SHADERI — program za grafičku karticu
    //
    //  Svaka točkica zna svoja četiri mjesta (objekt, flakon, bočica,
    //  natpis). Shader u svakoj sličici izračuna gdje je sada: oblik objekta
    //  gužva simplex šumom, prijelaz radi u valu (svaka točkica kreće s malim
    //  zakašnjenjem) uz vrtlog i dimni šum, a svjetlo (sjena, odsjaj, rub)
    //  daje metalni izgled. Točkice se zbrajaju (aditivno), pa su gušća
    //  mjesta i rubovi sjajniji, kao na pravoj metalnoj tkanini.
    // ═══════════════════════════════════════════════════════════════════
    const VS = `
      precision highp float;

      attribute vec3 aSph;     // smjer točke na kugli (AI objekt)
      attribute vec3 aBot;     // mjesto na bočici
      attribute vec3 aBotN;    // normala bočice
      attribute vec3 aTxt;     // mjesto u natpisu
      attribute vec4 aRnd;     // slučajni brojevi 0..1
      attribute vec4 aFla;     // mjesto na flakonu (xyz) i vrsta točke (w: 0 staklo, 1 zlato, 2 pločica, 3 slovo X, 4 brid)
      attribute vec3 aFlaN;    // normala flakona

      uniform float uTime;
      uniform float uSeg;      // 0: objekt → flakon, 1: flakon → bočica, 2: bočica → natpis, 3: natpis → objekt
      uniform float uProg;     // napredak prijelaza (0 = oblik miruje)
      uniform float uIntro;    // pojava (0..1)
      uniform float uExit;     // raspršivanje nakon "Početak" (0..1)
      uniform mat3 uRotA;      // okret oblika iz kojeg točkice kreću
      uniform mat3 uRotB;      // okret oblika u koji idu
      uniform vec2 uPx;        // svjetska jedinica → ekran
      uniform vec2 uCenter;
      uniform float uSize;
      uniform vec2 uSweep;     // x: sjaj preko natpisa, y: odsjaj niz bočicu / flakon
      uniform vec4 uAlpha;     // jačina točkica: objekt, flakon, bočica, natpis
      uniform float uTextW;
      uniform vec3 uSilver;
      uniform vec3 uLiquid;
      uniform vec3 uPowder;
      uniform vec3 uGold;

      varying vec4 vCol;

      const float PI = 3.14159265;
      const float VAL = 0.6;   // koliki dio prijelaza zauzima "val" zakašnjenja
      const float CAM = 4.2;   // udaljenost kamere

      // 3D simplex šum s gradijentom — Ian McEwan, Stefan Gustavson
      // (Ashima Arts, webgl-noise, licenca MIT)
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v, out vec3 gradient) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        vec4 m2 = m * m;
        vec4 m4 = m2 * m2;
        vec4 pdotx = vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3));
        vec4 temp = m2 * m * pdotx;
        gradient = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
        gradient += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;
        gradient *= 105.0;
        return 105.0 * dot(m4, pdotx);
      }

      vec2 okreni(vec2 v, float k) {
        float c = cos(k), s = sin(k);
        return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
      }

      // AI objekt: kugla čiju površinu stalno gužvaju dva sloja šuma
      void objekt(out vec3 p, out vec3 n, out vec3 c, out float lit, out float back) {
        vec3 d = aSph;
        float t = uTime;
        vec3 g1, g2;
        float n1 = snoise(d * 1.15 + vec3(0.0, t * 0.19, t * 0.11), g1);
        float n2 = snoise(d * 2.5 + vec3(t * 0.23, -t * 0.09, 0.0) + g1 * 0.08, g2);
        float disp = n1 * 0.25 + n2 * 0.085;
        vec3 grad = g1 * (1.15 * 0.25) + g2 * (2.5 * 0.085);
        vec3 tg = grad - dot(grad, d) * d;
        p = d * 0.8 * (1.0 + disp) * (1.0 + 0.02 * sin(t * 1.3));
        n = normalize(d - tg / (1.0 + disp));
        c = uSilver * (0.9 + 0.3 * n1);
        lit = 1.0;
        back = 0.14;
      }

      // Bočica: staklo s rozom tekućinom koja se njiše; niz nju putuje odsjaj
      void bocica(out vec3 p, out vec3 n, out vec3 c, out float lit, out float back) {
        float t = uTime;
        p = aBot;
        p.y += 0.018 * sin(t * 0.8);
        n = aBotN;
        float razina = 0.02 + 0.022 * sin(t * 1.4 + aBot.x * 2.6) + 0.012 * sin(t * 2.3 - aBot.z * 4.0);
        float tijelo = step(aBot.y, 0.3);
        float tekucina = tijelo * (1.0 - smoothstep(razina - 0.012, razina + 0.012, aBot.y));
        float dr = (aBot.y - razina) / 0.016, dv = (aBot.y - uSweep.y) / 0.06;
        float povrsina = tijelo * exp(-dr * dr);
        c = mix(uSilver, uLiquid * 1.35, tekucina) + uLiquid * povrsina;
        c += vec3(0.55) * exp(-dv * dv);
        lit = 0.75;
        back = 0.45;
      }

      // Flakon: fasetirano staklo s medenom tekućinom koja se njiše (prema
      // dnu je staklo deblje pa boja blijedi), zlatni čep, prsten i pločica
      void flakon(out vec3 p, out vec3 n, out vec3 c, out float lit, out float back) {
        float t = uTime;
        p = aFla.xyz;
        p.y += 0.018 * sin(t * 0.8);
        n = aFlaN;
        float m = aFla.w;
        float zlato = step(0.5, m) * step(m, 3.5);                 // čep, prsten, pločica
        float plocica = step(1.5, m) * step(m, 3.5);
        float slovo = step(2.5, m) * step(m, 3.5);                 // slovo X i okvir pločice
        float brid = step(3.5, m);                                  // bridovi faseta
        float staklo = (1.0 - zlato) * step(aFla.y, 0.3);
        float razina = 0.2 + 0.02 * sin(t * 1.3 + aFla.x * 3.0) + 0.01 * sin(t * 2.1 - aFla.z * 5.0);
        float tekucina = staklo * (1.0 - smoothstep(razina - 0.014, razina + 0.014, aFla.y)) * smoothstep(-0.9, -0.45, aFla.y);
        float dr = (aFla.y - razina) / 0.016, dv = (aFla.y - uSweep.y) / 0.06;
        vec3 cs = mix(uSilver, uGold * 1.1, tekucina * 0.45) + uGold * staklo * exp(-dr * dr) * 0.6;
        cs *= 1.0 + 0.5 * brid;
        // pločica je polirano zlato: sjaji iz svakog kuta, slovo X najjače
        vec3 cz = mix(uGold * 1.05, mix(uGold * 0.95, mix(uGold, uPowder, 0.2) * 1.2, slovo), plocica);
        c = mix(cs, cz, zlato);
        c += vec3(0.5) * exp(-dv * dv);
        lit = mix(mix(0.75, 1.0, zlato), 0.35, plocica);
        back = mix(0.45, 0.28, zlato);
      }

      // pločica, slovo X i bridovi flakona su gušći (jače točkice) od stakla
      float jacinaFlakona() {
        float m = aFla.w;
        return 1.0 + 0.8 * step(1.5, m) * step(m, 3.5) - 1.0 * step(2.5, m) * step(m, 3.5) + 1.2 * step(3.5, m);
      }

      // Natpis: lagani val kroz slova i sjaj koji prijeđe slijeva nadesno
      void natpis(out vec3 p, out vec3 n, out vec3 c, out float lit, out float back) {
        float t = uTime;
        p = aTxt;
        p.z += 0.03 * sin(aTxt.x * 2.4 - t * 1.2);
        p.y += 0.005 * sin(aTxt.x * 6.0 + t * 1.8);
        n = vec3(0.0, 0.0, 1.0);
        float ds = (aTxt.x - uSweep.x) / 0.16;
        float sjaj = exp(-ds * ds);
        c = uPowder * (0.95 + 0.9 * sjaj);
        lit = 0.0;
        back = 1.0;
      }

      void main() {
        vec3 pA, nA, cA, pB, nB, cB;
        float lA, lB, bA, bB, aA, aB, kasni;
        float xt = clamp(aTxt.x / uTextW * 0.5 + 0.5, 0.0, 1.0);

        if (uSeg < 0.5) {
          objekt(pA, nA, cA, lA, bA); aA = uAlpha.x;
          kasni = 0.75 * clamp((aFla.y + 0.86) / 1.76, 0.0, 1.0) + 0.25 * aRnd.x;        // flakon se puni odozdo
        } else if (uSeg < 1.5) {
          flakon(pA, nA, cA, lA, bA); aA = uAlpha.y * jacinaFlakona();
          kasni = 0.7 * (1.0 - clamp((aBot.y + 0.86) / 1.76, 0.0, 1.0)) + 0.3 * aRnd.x;  // bočica se slaže odozgo
        } else if (uSeg < 2.5) {
          bocica(pA, nA, cA, lA, bA); aA = uAlpha.z;
          kasni = 0.8 * xt + 0.2 * aRnd.x;                                                 // slova slijeva nadesno
        } else {
          natpis(pA, nA, cA, lA, bA); aA = uAlpha.w;
          kasni = 0.55 * xt + 0.45 * aRnd.x;
        }
        pB = pA; nB = nA; cB = cA; lB = lA; bB = bA; aB = aA;
        if (uProg > 0.0) {
          if (uSeg < 0.5) { flakon(pB, nB, cB, lB, bB); aB = uAlpha.y * jacinaFlakona(); }
          else if (uSeg < 1.5) { bocica(pB, nB, cB, lB, bB); aB = uAlpha.z; }
          else if (uSeg < 2.5) { natpis(pB, nB, cB, lB, bB); aB = uAlpha.w; }
          else { objekt(pB, nB, cB, lB, bB); aB = uAlpha.x; }
        }
        // svaki oblik okrenut po svome
        pA = uRotA * pA; nA = uRotA * nA;
        pB = uRotB * pB; nB = uRotB * nB;

        float k = clamp(uProg * (1.0 + VAL) - kasni * VAL, 0.0, 1.0);
        k = k * k * k * (k * (k * 6.0 - 15.0) + 10.0);
        float luk = sin(PI * k);

        vec3 p = mix(pA, pB, k);
        vec3 n = normalize(mix(nA, nB, k) + vec3(0.0, 0.0, 1e-4));
        vec3 col = mix(cA, cB, k);
        float lit = mix(lA, lB, k);
        float back = mix(bA, bB, k);
        float alpha = mix(aA, aB, k);

        // prijelaz: dimni vrtlog i lagano dizanje
        if (uProg > 0.0) {
          vec3 g;
          snoise(p * 1.4 + vec3(0.0, -uTime * 0.3, uTime * 0.17), g);
          p += (g * 0.03 + cross(g, vec3(0.0, 1.0, 0.0)) * 0.05) * luk;
          p.xz = okreni(p.xz, luk * (0.6 + 0.5 * aRnd.w));
          p.y += 0.05 * luk;
          alpha *= 1.0 + 0.3 * luk;
        }

        // pojava: točkice doplove iz izmaglice u vrtlogu
        if (uIntro < 1.0) {
          float ki = clamp(uIntro * 1.6 - aRnd.y * 0.6, 0.0, 1.0);
          ki = 1.0 - pow(1.0 - ki, 3.0);
          vec3 izvor = normalize(vec3(aRnd.z, aRnd.w, aRnd.x) - 0.5 + 0.001) * (1.5 + 1.3 * aRnd.y);
          izvor.xz = okreni(izvor.xz, (1.0 - ki) * 2.4);
          p = mix(izvor, p, ki);
          alpha *= ki;
        }

        // "Početak": točkice se rasprše prema van i gore, kao izmaglica parfema
        if (uExit > 0.0) {
          float ke = clamp(uExit * 1.45 - aRnd.x * 0.45, 0.0, 1.0);
          ke = ke * ke * (3.0 - 2.0 * ke);
          vec3 smjer = normalize(p + (aRnd.yzw - 0.5) * 0.8 + vec3(0.0, 0.25, 0.0));
          p += smjer * ke * 1.5 + vec3(0.0, 0.45, 0.0) * ke;
          alpha *= 1.0 - ke;
        }

        vec3 q = p;
        vec3 nq = normalize(n);
        float persp = CAM / (CAM - q.z);
        gl_Position = vec4(q.x * uPx.x * persp + uCenter.x, q.y * uPx.y * persp + uCenter.y, 0.0, 1.0);
        float iskra = step(0.993, aRnd.z);
        gl_PointSize = uSize * persp * (1.0 + iskra * 0.7);

        // svjetlo gore lijevo: sjena, odsjaj i svijetli rub
        vec3 L = normalize(vec3(-0.5, 0.62, 0.6));
        vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
        float dif = max(dot(nq, L), 0.0);
        float spe = pow(max(dot(nq, H), 0.0), 26.0);
        float rub = pow(1.0 - abs(nq.z), 2.2);
        float nebo = smoothstep(-0.08, 0.3, nq.y);                   // odraz neba i tla, kao na kromu
        float svjetlo = 0.08 + 0.7 * dif + 1.5 * spe + 0.6 * rub + 0.28 * nebo;
        float lice = mix(back, 1.0, smoothstep(-0.2, 0.25, nq.z));   // stražnja strana tamnija
        float dubina = mix(1.0, clamp(0.62 + 0.42 * q.z, 0.25, 1.15), lit);
        float treptaj = 0.84 + 0.16 * sin(uTime * (1.5 + 2.0 * aRnd.w) + aRnd.y * 40.0);
        treptaj = mix(treptaj, 1.0 + 1.1 * max(0.0, sin(uTime * 2.1 + aRnd.x * 50.0)), iskra);
        vCol = vec4(col * mix(1.0, svjetlo, lit) * lice, alpha * treptaj * dubina);
      }
    `;

    const FS = `
      precision mediump float;
      varying vec4 vCol;
      void main() {
        vec2 d = gl_PointCoord * 2.0 - 1.0;
        float r = dot(d, d);
        if (r > 1.0) discard;
        gl_FragColor = vec4(vCol.rgb, vCol.a * (1.0 - 0.6 * r));
      }
    `;

    const UNIFORME = ['uTime', 'uSeg', 'uProg', 'uIntro', 'uExit', 'uRotA', 'uRotB', 'uPx', 'uCenter', 'uSize',
      'uSweep', 'uAlpha', 'uTextW', 'uSilver', 'uLiquid', 'uPowder', 'uGold'];
    const ATRIBUTI = [['aSph', 3, 0], ['aBot', 3, 3], ['aBotN', 3, 6], ['aTxt', 3, 9], ['aRnd', 4, 12], ['aFla', 4, 16], ['aFlaN', 3, 20]];
    // jačina točkica (objekt, flakon, bočica, natpis); natpis je najgušći pa ima najslabije točkice
    const JACINA = [0.9, 0.7, 0.8, 0.3];


    // ═══════════════════════════════════════════════════════════════════
    //  VREMENSKI TIJEK — koji je oblik na ekranu u trenutku t (sekunde od
    //  otvaranja) i kako je koji oblik okrenut
    //
    //  Ciklus: objekt → prijelaz → flakon → prijelaz → bočica → prijelaz →
    //  natpis → prijelaz. Svaki oblik ima vlastiti okret oko okomite osi:
    //   - objekt se stalno polako okreće
    //   - flakon se okreće jednoliko, bez zastoja (kao bočica): nastane malo
    //     okrenut ulijevo (gledano od nas), pločica mu prođe ispred nas i
    //     okreće se dalje
    //   - bočica se okreće i glatko zaustavi licem prema nama točno kad
    //     nastaje natpis, pa se natpis slaže s njom (nikad nije naopako)
    //  U prijelazu točkice putuju između dva oblika, svaki okrenut po svome.
    //  Za svaki oblik vraća se [kut, nagib prema nama, lagano njihanje].
    // ═══════════════════════════════════════════════════════════════════
    function napraviTijek() {
      const pojava = sekunde(T.pojava, 1.6, 0.3);
      const D = sekunde(T.prijelaz, 2.4, 0.6);
      const TRAJANJA = [sekunde(T.objekt, 3.4, 0.5), sekunde(T.flakon, 4.4, 0.5), sekunde(T.bocica, 3.2, 0.5), sekunde(T.natpis, 5, 0.5)];
      const wO = 0.4, wF = 0.55, wB = 0.7;           // kutne brzine objekta, flakona i bočice (rad/s)
      const NAGIB = 0.08;                            // flakon i bočica malo nagnuti prema nama
      const KUT_FLAKONA = -0.3;                      // flakon nastane malo okrenut ulijevo, gledano od nas (oko 17°)
      const NATPIS = 3;
      function E(x) { x = sat(x); return x * x * x - x * x * x * x / 2; }   // integral od glatko()
      const faze = [];
      let od = 0;
      TRAJANJA.forEach(function (d, i) {
        faze.push({ od: od, d: d, seg: i, prijelaz: false });
        od += d;
        faze.push({ od: od, d: D, seg: i, prijelaz: true });
        od += D;
      });
      const L = od, POCETAK_FLAKONA = faze[2].od, POCETAK_NATPISA = faze[2 * NATPIS].od;

      // u = vrijeme od početka mirovanja objekta (u prijelazu iz natpisa je
      // negativno: okret se tada glatko pokrene iz mirovanja)
      function kutObjekta(u) { return u >= 0 ? wO * (D / 2 + u) : wO * D * E((u + D) / D); }
      // u = vrijeme od nastanka flakona: okreće se jednoliko, bez zastoja (kao
      // bočica), i dok nastaje (u < 0) i dok se pretapa u bočicu
      function kutFlakona(u) { return KUT_FLAKONA + wF * u; }
      // u = vrijeme do početka natpisa (≤ 0): okret se glatko zaustavi točno na 0
      function kutBocice(u) {
        if (u >= 0) return 0;
        if (u >= -D) return -wB * (-u - D * (0.5 - E((u + D) / D)));
        return -wB * (-u - D / 2);
      }

      return function (t) {
        const st = { seg: 0, prog: 0, uvod: 1, A: null, B: null, odsjaj: 99, sjaj: 99, podnaslov: false };
        const nagibO = 0.3 + 0.07 * Math.sin(t * 0.47), njihanjeO = 0.1 * Math.sin(t * 0.29);
        if (t < pojava) {
          st.uvod = t / pojava;
          st.A = st.B = [wO * (D / 2 + t - pojava), nagibO, njihanjeO];
          return st;
        }
        const u = t - pojava;
        const c = P.ponavljaj ? u % L : Math.min(u, POCETAK_NATPISA + 0.001);
        let f = faze[faze.length - 1];
        for (let i = 0; i < faze.length; i++) if (c < faze[i].od + faze[i].d) { f = faze[i]; break; }
        const tau = Math.min(c - f.od, f.d);
        const objekt = [kutObjekta(c), nagibO, njihanjeO];
        const flakon = [kutFlakona(c - POCETAK_FLAKONA), NAGIB, 0];
        const bocica = [kutBocice(c - POCETAK_NATPISA), NAGIB, 0];
        st.seg = f.seg;
        if (!f.prijelaz) {
          st.A = [objekt, flakon, bocica, [0, 0, 0]][f.seg];
          st.B = st.A;
          if (f.seg === 1 || f.seg === 2) st.odsjaj = lerp(1.15, -1.25, (tau - 0.5) / 1.7);   // odsjaj niz staklo
          if (f.seg === NATPIS) {
            const ct = P.ponavljaj ? tau : (u - POCETAK_NATPISA) % 6;
            st.sjaj = lerp(-1.35, 1.35, (ct - 0.5) / 1.8);                                  // sjaj preko natpisa
            st.podnaslov = true;
          }
          return st;
        }
        st.prog = tau / D;
        const e = glatko(st.prog);
        if (f.seg === 0) { st.A = objekt; st.B = flakon; }
        else if (f.seg === 1) { st.A = flakon; st.B = bocica; }
        else if (f.seg === 2) {
          // natpis nastaje zajedno s bočicom koja se zaustavlja licem prema nama
          st.A = st.B = [bocica[0], NAGIB * (1 - e), 0];
          st.podnaslov = st.prog > 0.8;
        } else {
          // natpis se rastapa, a objekt se iz mirovanja pokrene
          st.A = st.B = [kutObjekta(c - L), nagibO * e, njihanjeO * e];
        }
        return st;
      };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  ANIMACIJA — WebGL platno koje crta točkice
    // ═══════════════════════════════════════════════════════════════════
    function napraviAnimaciju(platno, scena, dogadaji) {
      const tijek = napraviTijek();
      const POD = boja01(B.podloga);
      let gl = null, program = null, spremnik = null, U = {}, n = 0, pola = 0.35;
      let spremno = false, unisteno = false, priprema = null;
      let raf = 0, vrti = false, vrijeme = 0, zadnje = 0;
      let izlazOd = -1, izlazTrajanje = 1.1, izlazGotov = null;
      let W = 1, H = 1, dpr = 1, S = 160, sx = 0, sy = 0;
      let misX = 0, misY = 0, nagibX = 0, nagibY = 0;
      let podnaslov = null;

      // 1. dio: WebGL i prevođenje shadera; gdje preglednik to zna, shader se
      //    prevodi usporedo (KHR_parallel_shader_compile) dok se računaju oblici
      let sh = null, usporedo = null;
      function pocniGL() {
        const opcije = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false };
        gl = platno.getContext('webgl', opcije) || platno.getContext('experimental-webgl', opcije);
        if (!gl) return false;
        usporedo = gl.getExtension('KHR_parallel_shader_compile');
        sh = [gl.createShader(gl.VERTEX_SHADER), gl.createShader(gl.FRAGMENT_SHADER)];
        gl.shaderSource(sh[0], VS);
        gl.shaderSource(sh[1], FS);
        gl.compileShader(sh[0]);
        gl.compileShader(sh[1]);
        program = gl.createProgram();
        gl.attachShader(program, sh[0]);
        gl.attachShader(program, sh[1]);
        gl.linkProgram(program);
        return true;
      }
      function cekajShader() {
        return new Promise(function (gotovo) {
          (function provjeri() {
            if (unisteno || !usporedo || gl.isContextLost() || gl.getProgramParameter(program, usporedo.COMPLETION_STATUS_KHR)) gotovo();
            else setTimeout(provjeri, 16);
          })();
        });
      }
      // 2. dio: podaci o točkicama idu u grafičku karticu
      function dovrsiGL(oblici) {
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.warn('[Martimex] Početni ekran – shader:', gl.getShaderInfoLog(sh[0]) || gl.getShaderInfoLog(sh[1]) || gl.getProgramInfoLog(program));
          return false;
        }
        gl.useProgram(program);
        spremnik = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, spremnik);
        gl.bufferData(gl.ARRAY_BUFFER, oblici.podaci, gl.STATIC_DRAW);
        ATRIBUTI.forEach(function (a) {
          const mjesto = gl.getAttribLocation(program, a[0]);
          if (mjesto < 0) return;
          gl.enableVertexAttribArray(mjesto);
          gl.vertexAttribPointer(mjesto, a[1], gl.FLOAT, false, VELICINA_TOCKE * 4, a[2] * 4);
        });
        UNIFORME.forEach(function (u) { U[u] = gl.getUniformLocation(program, u); });
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);           // točkice se zbrajaju (svjetlo)
        gl.uniform3fv(U.uSilver, boja01(B.srebro));
        gl.uniform3fv(U.uLiquid, zasiti(boja01(B.roza), 2));   // na crnoj podlozi roza mora biti jača da se vidi
        gl.uniform3fv(U.uPowder, boja01(B.puder));
        gl.uniform3fv(U.uGold, zasiti(boja01(B.zlato), 1.2));
        gl.uniform4fv(U.uAlpha, JACINA);
        gl.uniform1f(U.uTextW, SIRINA_NATPISA / 2);
        n = oblici.n;
        pola = oblici.pola;
        return true;
      }

      // Oblici + WebGL; poziva se unaprijed (kad preglednik miruje) ili pri otvaranju
      function pripremi() {
        if (priprema) return priprema;
        priprema = Promise.resolve().then(function () {
          if (unisteno) return false;
          if (!pocniGL()) { dogadaji.bezAnimacije(); return false; }
          return pripremiOblike().then(function (oblici) {
            return cekajShader().then(pauza).then(function () {
              if (unisteno || gl.isContextLost()) return false;      // izgubljen kontekst: vidi webglcontextrestored
              if (!dovrsiGL(oblici)) { dogadaji.bezAnimacije(); return false; }
              velicina();
              nacrtaj(0);                               // prvo crtanje unaprijed, a ne tek pri otvaranju
              spremno = true;
              return true;
            });
          });
        }).catch(function (e) {
          console.warn('[Martimex] Početni ekran bez animacije:', e);
          dogadaji.bezAnimacije();
          return false;
        });
        return priprema;
      }

      function velicina() {
        if (!gl) return;
        W = Math.max(1, platno.clientWidth); H = Math.max(1, platno.clientHeight);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        const pw = Math.round(W * dpr), ph = Math.round(H * dpr);
        if (platno.width !== pw || platno.height !== ph) { platno.width = pw; platno.height = ph; }
        gl.viewport(0, 0, pw, ph);
        // prostor za animaciju je .mx-p-scena (između zaglavlja i gumba)
        const sw = Math.max(1, scena.offsetWidth), sh = Math.max(1, scena.offsetHeight);
        S = Math.max(40, Math.min(sw / 2.5, sh / 2.2));
        sx = scena.offsetLeft + sw / 2;
        sy = scena.offsetTop + sh / 2;
        dogadaji.mjere(sh / 2 + pola * S + 22);         // podnaslov ispod natpisa
        if (!vrti && spremno) nacrtaj(MIRNO.matches ? 99 : vrijeme);
      }

      function matrica(kutY, nagib, valjanje) {
        const cy = Math.cos(kutY), sy_ = Math.sin(kutY), cx = Math.cos(nagib), sx_ = Math.sin(nagib);
        const cz = Math.cos(valjanje), sz = Math.sin(valjanje);
        // Rx(nagib) · Ry(kutY)
        const m = [
          [cy, 0, sy_],
          [sx_ * sy_, cx, -sx_ * cy],
          [-cx * sy_, sx_, cx * cy]
        ];
        // Rz(valjanje) · m
        const r = [
          [cz * m[0][0] - sz * m[1][0], cz * m[0][1] - sz * m[1][1], cz * m[0][2] - sz * m[1][2]],
          [sz * m[0][0] + cz * m[1][0], sz * m[0][1] + cz * m[1][1], sz * m[0][2] + cz * m[1][2]],
          m[2]
        ];
        // WebGL čita matricu po stupcima
        return [r[0][0], r[1][0], r[2][0], r[0][1], r[1][1], r[2][1], r[0][2], r[1][2], r[2][2]];
      }

      function nacrtaj(t) {
        const mirno = MIRNO.matches;
        let st;
        if (mirno) st = { seg: 3, prog: 0, uvod: 1, A: [0, 0, 0], B: [0, 0, 0], odsjaj: 99, sjaj: 99, podnaslov: true };
        else st = tijek(t);
        const misKut = nagibX * 0.3, misNagib = nagibY * 0.16;          // lagani nagib prema mišu
        const izlaz = izlazOd < 0 ? 0 : sat((vrijeme - izlazOd) / izlazTrajanje);

        gl.clearColor(POD[0], POD[1], POD[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(U.uTime, mirno ? 7 : t);
        gl.uniform1f(U.uSeg, st.seg);
        gl.uniform1f(U.uProg, st.prog);
        gl.uniform1f(U.uIntro, st.uvod);
        gl.uniform1f(U.uExit, izlaz);
        gl.uniformMatrix3fv(U.uRotA, false, matrica(st.A[0] + misKut, st.A[1] + misNagib, st.A[2]));
        gl.uniformMatrix3fv(U.uRotB, false, matrica(st.B[0] + misKut, st.B[1] + misNagib, st.B[2]));
        gl.uniform2f(U.uPx, 2 * S / W, 2 * S / H);
        gl.uniform2f(U.uCenter, 2 * sx / W - 1, 1 - 2 * sy / H);
        gl.uniform1f(U.uSize, 1.35 * dpr * Math.min(1.25, Math.max(0.8, Math.sqrt(S / 160))));
        gl.uniform2f(U.uSweep, st.sjaj, st.odsjaj);
        gl.drawArrays(gl.POINTS, 0, n);

        if (st.podnaslov !== podnaslov) { podnaslov = st.podnaslov; dogadaji.podnaslov(podnaslov); }
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
        if (MIRNO.matches) { nacrtaj(99); return; }
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
        spremno = false;
        priprema = null;
      });
      platno.addEventListener('webglcontextrestored', function () {
        if (unisteno) return;
        pripremi().then(function (ok) { if (ok && dogadaji.otvoreno()) pokreni(); });
      });

      return {
        pripremi: pripremi,
        velicina: velicina,
        // svako otvaranje: animacija ispočetka
        ispocetka: function () {
          HITNO = true;
          stani();
          vrijeme = 0; izlazOd = -1; izlazGotov = null; podnaslov = null;
          return pripremi().then(function (ok) { if (ok && dogadaji.otvoreno()) pokreni(); return ok; });
        },
        stani: stani,
        mis: function (x, y) { misX = x; misY = y; },
        izlaz: function (gotovo) {
          if (!spremno || MIRNO.matches) { gotovo(); return; }
          izlazOd = vrijeme;
          izlazGotov = gotovo;
          pokreni();
        },
        unisti: function () {
          unisteno = true;
          stani();
          if (gl && !gl.isContextLost()) {
            gl.deleteBuffer(spremnik);
            gl.deleteProgram(program);
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
    const CSS = `
      :host .mx-p {
        --mx-p-podloga: ${B.podloga};
        --mx-p-puder: ${B.puder};
        --mx-p-puder-78: ${prozirna(B.puder, .78)};
        --mx-p-puder-86: ${prozirna(B.puder, .86)};
        --mx-p-zlato-roza: ${B.zlato};
        --mx-p-roza: ${B.roza};
        --mx-p-roza-0: ${prozirna(B.roza, 0)};
        --mx-p-roza-70: ${prozirna(B.roza, .7)};
        --mx-p-staklo: ${prozirna(B.puder, .07)};
        --mx-p-staklo-jace: ${prozirna(B.puder, .13)};
        --mx-p-rub: ${prozirna(B.roza, .5)};
        --mx-p-rub-sjaj: ${prozirna(B.puder, .95)};
        --mx-p-sjaj: ${prozirna(B.roza, .1)};
        --mx-p-sjaj-2: ${prozirna(B.roza, .035)};
        --mx-p-sjaj-0: ${prozirna(B.roza, 0)};
        --mx-p-sjena: ${prozirna(B.roza, .5)};
        --mx-p-sjena-jaca: ${prozirna(B.roza, .7)};
        --mx-p-glatko: cubic-bezier(.16, 1, .3, 1);
        --mx-p-meko: cubic-bezier(.45, 0, .2, 1);
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: 1000;
        container-type: size;           /* za @container: na niskom prozoru opis se skrati */
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: inherit;
        background: var(--mx-p-podloga);
        color: var(--mx-p-puder);
        font-family: ${P.font};
        font-size: 14px;
        font-weight: 400;
        line-height: 1.4;
        letter-spacing: normal;
        text-align: left;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-user-select: none;
                user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      :host .mx-p * { box-sizing: border-box; }

      :host .mx-p-platno {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: block;
        opacity: 0;
        transition: opacity .5s linear;
      }
      :host .mx-p-spremno .mx-p-platno { opacity: 1; }

      /* blagi rozi sjaj iza objekta i uz dno */
      :host .mx-p-sjaj {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        pointer-events: none;
        background:
          radial-gradient(ellipse 72% 36% at 50% var(--mx-p-sredina, 45%), var(--mx-p-sjaj), var(--mx-p-sjaj-2) 50%, var(--mx-p-sjaj-0) 76%),
          radial-gradient(ellipse 110% 48% at 50% 112%, var(--mx-p-sjaj-2), var(--mx-p-sjaj-0) 70%);
      }

      /* ── zaglavlje ── */
      :host .mx-p-vrh {
        position: relative;
        z-index: 2;
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        height: calc(58px + env(safe-area-inset-top, 0px));
        padding: env(safe-area-inset-top, 0px) 56px 0;
      }
      :host .mx-p-marka {
        font-size: 11px;
        font-weight: 500;
        letter-spacing: .38em;
        text-indent: .38em;             /* razmak iza zadnjeg slova, da natpis stoji točno u sredini */
        text-transform: uppercase;
        white-space: nowrap;
        color: var(--mx-p-puder-78);
      }
      :host .mx-p-zatvori {
        -webkit-appearance: none;
                appearance: none;
        position: absolute;
        right: 12px;
        top: calc(env(safe-area-inset-top, 0px) + 11px);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--mx-p-puder);
        opacity: .72;
        cursor: pointer;
        transition: opacity .3s var(--mx-p-meko), background-color .3s var(--mx-p-meko);
      }
      :host .mx-p-zatvori:hover { opacity: 1; background-color: var(--mx-p-staklo); }
      :host .mx-p-zatvori:focus { outline: none; }
      :host .mx-p-zatvori:focus-visible { opacity: 1; outline: 2px solid var(--mx-p-puder); outline-offset: 2px; }
      :host .mx-p-zatvori svg { width: 16px; height: 16px; display: block; }

      /* ── prostor animacije ── */
      :host .mx-p-scena {
        position: relative;
        flex: 1 1 auto;
        min-height: 0;
      }
      :host .mx-p-naslov {                /* "Marti" za čitače zaslona (na ekranu ga crtaju točkice) */
        position: absolute;
        width: 1px; height: 1px;
        margin: -1px; padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }
      :host .mx-p-podnaslov {
        position: absolute;
        left: 20px;
        right: 20px;
        top: var(--mx-p-ispod, 72%);
        margin: 0;
        text-align: center;
        font-size: 11px;
        font-weight: 400;
        letter-spacing: .3em;
        text-indent: .3em;
        text-transform: uppercase;
        color: var(--mx-p-puder);
        opacity: 0;
        transform: translateY(8px);
        filter: blur(3px);
        transition: opacity .9s var(--mx-p-meko), transform 1.3s var(--mx-p-glatko), filter 1s var(--mx-p-meko);
        pointer-events: none;
      }
      :host .mx-p-podnaslov-da .mx-p-podnaslov { opacity: .72; transform: none; filter: none; }

      /* bez WebGL-a: natpis "Marti" slovima */
      :host .mx-p-rezerva {
        display: none;
        position: absolute;
        left: 0; right: 0;
        top: 50%;
        margin: 0;
        transform: translateY(-62%);
        text-align: center;
        font-family: ${P.fontNatpisa};
        font-size: 76px;
        font-weight: 600;
        line-height: 1;
        color: var(--mx-p-puder);
      }
      :host .mx-p-bez-gl .mx-p-rezerva { display: block; animation: mx-p-rezerva 1.6s var(--mx-p-glatko) .2s backwards; }
      :host .mx-p-bez-gl .mx-p-podnaslov { top: calc(50% + 34px); opacity: .72; transform: none; filter: none; }

      /* ── tekst između animacije i gumba (stoji cijelo vrijeme) ── */
      :host .mx-p-uvod {
        position: relative;
        z-index: 2;
        flex: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: -34px;              /* tekst se primakne animaciji */
        padding: 0 26px 40px;
        text-align: center;
      }
      /* zvjezdica od ružičastog zlata: treperi i polako se okreće */
      :host .mx-p-zvijezda {
        position: relative;
        width: 18px; height: 18px;
        margin-bottom: 10px;
        color: var(--mx-p-roza);
        filter: drop-shadow(0 0 6px var(--mx-p-roza-70));
      }
      :host .mx-p-zvijezda svg { display: block; width: 100%; height: 100%; }
      :host .mx-p-zvijezda::before,
      :host .mx-p-zvijezda::after {
        content: "";
        position: absolute;
        top: 50%; height: 1px;
        width: 54px;
      }
      :host .mx-p-zvijezda::before { right: calc(100% + 10px); background: linear-gradient(90deg, var(--mx-p-roza-0), var(--mx-p-roza-70)); }
      :host .mx-p-zvijezda::after  { left: calc(100% + 10px);  background: linear-gradient(90deg, var(--mx-p-roza-70), var(--mx-p-roza-0)); }
      :host .mx-p-ulaz .mx-p-zvijezda svg { animation: mx-p-treptaj 4.2s ease-in-out 1.2s infinite; }

      :host .mx-p-pred {
        margin: 0 0 6px;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: .42em;
        text-indent: .42em;
        text-transform: uppercase;
        color: var(--mx-p-puder-78);
      }
      :host .mx-p-pozdrav {
        margin: 0;
        font-size: 27px;
        font-weight: 500;
        line-height: 1.12;
        letter-spacing: .015em;
        color: var(--mx-p-roza);
        text-wrap: balance;
      }
      /* metalno ružičasto zlato preko kojeg povremeno prijeđe sjaj */
      @supports ((-webkit-background-clip: text) or (background-clip: text)) {
        :host .mx-p-pozdrav span {
          background:
            linear-gradient(105deg, transparent 0%, transparent 42%, rgba(255, 255, 255, .95) 50%, transparent 58%, transparent 100%) 100% 0 / 300% 100%,
            linear-gradient(180deg, var(--mx-p-puder) 0%, var(--mx-p-roza) 55%, var(--mx-p-zlato-roza) 100%);
          -webkit-background-clip: text;
                  background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        :host .mx-p-ulaz .mx-p-pozdrav span { animation: mx-p-sjaj-teksta 6s var(--mx-p-meko) 2.2s infinite; }
      }
      :host .mx-p-opis {
        max-width: 330px;
        margin: 14px 0 0;
        font-size: 15.5px;
        font-weight: 400;
        line-height: 1.6;
        letter-spacing: .01em;
        color: var(--mx-p-puder-86);
        text-wrap: balance;
      }
      /* opis se ispisuje riječ po riječ */
      :host .mx-p-rijec { display: inline; }
      :host .mx-p-ulaz .mx-p-rijec { animation: mx-p-rijec .7s var(--mx-p-glatko) calc(1s + var(--i) * 55ms) backwards; }
      :host .mx-p-kursor {
        display: inline-block;
        width: 1.5px; height: 1em;
        margin-left: 3px;
        vertical-align: -.12em;
        background: var(--mx-p-roza);
        opacity: 0;
      }
      :host .mx-p-ulaz .mx-p-kursor { animation: mx-p-kursor 1s steps(1) calc(1s + var(--n) * 55ms) 4; }

      /* nizak prozor (npr. mobitel): tekst malo manji, a vrlo nizak: samo pozdrav */
      @container (max-height: 700px) {
        :host .mx-p-uvod { margin-top: -26px; padding-bottom: 22px; }
        :host .mx-p-zvijezda { width: 15px; height: 15px; margin-bottom: 7px; }
        :host .mx-p-pozdrav { font-size: 23px; }
        :host .mx-p-opis { font-size: 14.5px; line-height: 1.5; margin-top: 10px; }
      }
      @container (max-height: 470px) {
        :host .mx-p-zvijezda,
        :host .mx-p-opis { display: none; }
      }

      /* ── dno: gumb "Početak" ── */
      :host .mx-p-dno {
        position: relative;
        z-index: 2;
        flex: none;
        display: flex;
        justify-content: center;
        padding: 16px 24px calc(30px + env(safe-area-inset-bottom, 0px));
      }
      :host .mx-p-gumb {
        -webkit-appearance: none;
                appearance: none;
        position: relative;
        isolation: isolate;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        max-width: 280px;
        height: 54px;
        margin: 0;
        padding: 0 28px;
        border: 0;
        border-radius: 999px;
        background: var(--mx-p-staklo);
        box-shadow: 0 18px 40px -22px var(--mx-p-sjena);
        color: var(--mx-p-puder);
        font: inherit;
        font-size: 15px;
        font-weight: 500;
        letter-spacing: .14em;
        text-indent: .14em;
        cursor: pointer;
        transition: background-color .35s var(--mx-p-meko), box-shadow .35s var(--mx-p-meko), transform .2s var(--mx-p-meko);
      }
      /* rub od ružičastog zlata s odsjajem koji putuje (kao gumb chata) */
      :host .mx-p-gumb::before {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        z-index: -1;
        padding: 1px;
        border-radius: inherit;
        background: linear-gradient(105deg, var(--mx-p-rub) 0%, var(--mx-p-rub) 40%, var(--mx-p-rub-sjaj) 50%, var(--mx-p-rub) 60%, var(--mx-p-rub) 100%) 0 0 / 200% 100% repeat-x;
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
                mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
        pointer-events: none;
        animation: mx-p-zlato 5s linear infinite;
      }
      :host .mx-p-gumb svg { width: 18px; height: 18px; display: block; flex: none; transition: transform .45s var(--mx-p-glatko); }
      :host .mx-p-gumb:hover { background-color: var(--mx-p-staklo-jace); box-shadow: 0 20px 44px -20px var(--mx-p-sjena-jaca); }
      :host .mx-p-gumb:hover svg { transform: translateX(4px); }
      :host .mx-p-gumb:active { transform: scale(.975); transition-duration: .1s; }
      :host .mx-p-gumb:focus { outline: none; }
      :host .mx-p-gumb:focus-visible { outline: 2px solid var(--mx-p-puder); outline-offset: 4px; }

      /* ── pojava pri svakom otvaranju ── */
      :host .mx-p-ulaz .mx-p-vrh { animation: mx-p-pojava .9s var(--mx-p-glatko) .1s backwards; }
      :host .mx-p-ulaz .mx-p-zvijezda { animation: mx-p-zvijezda 1.2s var(--mx-p-glatko) .2s backwards; }
      :host .mx-p-ulaz .mx-p-pred { animation: mx-p-pojava 1s var(--mx-p-glatko) .35s backwards; }
      :host .mx-p-ulaz .mx-p-pozdrav { animation: mx-p-pozdrav 1.3s var(--mx-p-glatko) .5s backwards; }
      :host .mx-p-ulaz .mx-p-dno { animation: mx-p-pojava 1s var(--mx-p-glatko) .65s backwards; }

      /* ── nakon "Početak": tekst i gumb se povuku, chat se otvori u krugu ── */
      :host .mx-p-izlaz { pointer-events: none; }
      :host .mx-p-izlaz .mx-p-vrh,
      :host .mx-p-izlaz .mx-p-uvod,
      :host .mx-p-izlaz .mx-p-dno,
      :host .mx-p-izlaz .mx-p-podnaslov {
        opacity: 0;
        transform: translateY(6px);
        transition: opacity .35s var(--mx-p-meko), transform .5s var(--mx-p-meko);
      }

      @keyframes mx-p-zlato {
        from { background-position: 100% 0; }
        to   { background-position: -100% 0; }
      }
      @keyframes mx-p-pojava {
        from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
      }
      @keyframes mx-p-zvijezda {
        from { opacity: 0; transform: scale(.2) rotate(-90deg); }
      }
      @keyframes mx-p-treptaj {
        0%, 100% { transform: scale(1) rotate(0); opacity: .9; }
        12%      { transform: scale(1.35) rotate(45deg); opacity: 1; }
        30%      { transform: scale(.85) rotate(90deg); opacity: .7; }
        45%      { transform: scale(1) rotate(90deg); opacity: .9; }
      }
      @keyframes mx-p-pozdrav {
        from { opacity: 0; letter-spacing: .2em; filter: blur(8px); }
      }
      @keyframes mx-p-rijec {
        from { opacity: 0; filter: blur(6px); }
      }
      @keyframes mx-p-kursor {
        0%  { opacity: 1; }
        50% { opacity: 0; }
      }
      @keyframes mx-p-sjaj-teksta {
        0%        { background-position: 100% 0; }
        45%, 100% { background-position: 0 0; }
      }
      @keyframes mx-p-rezerva {
        from { opacity: 0; transform: translateY(-56%); filter: blur(10px); letter-spacing: .12em; }
      }
      @keyframes mx-p-prozirnost {
        from { opacity: 0; }
      }

      /* "Smanji pokrete": ništa se ne pomiče, samo se tiho pojavi */
      @media (prefers-reduced-motion: reduce) {
        :host .mx-p-ulaz .mx-p-vrh,
        :host .mx-p-ulaz .mx-p-zvijezda,
        :host .mx-p-ulaz .mx-p-pred,
        :host .mx-p-ulaz .mx-p-pozdrav,
        :host .mx-p-ulaz .mx-p-rijec,
        :host .mx-p-ulaz .mx-p-dno,
        :host .mx-p-bez-gl .mx-p-rezerva { animation: mx-p-prozirnost .4s linear backwards; }
        :host .mx-p-gumb::before,
        :host .mx-p-ulaz .mx-p-pozdrav span,
        :host .mx-p-ulaz .mx-p-zvijezda svg,
        :host .mx-p-ulaz .mx-p-kursor { animation: none; }
        :host .mx-p-gumb svg,
        :host .mx-p-gumb:active { transition: none; transform: none; }
        :host .mx-p-podnaslov { transition: opacity .4s linear; transform: none; filter: none; }
      }
    `;

    // Stil ide u shadow root chata (jednom; starija verzija se zamijeni)
    function ubaciStil(korijen) {
      const stari = korijen.querySelector('style[data-mx-pocetna]');
      if (stari && stari.getAttribute('data-mx-pocetna') === '3') return;
      if (stari) stari.remove();
      const stil = document.createElement('style');
      stil.setAttribute('data-mx-pocetna', '3');
      stil.textContent = CSS;
      korijen.appendChild(stil);
    }

    // Fontove (Jost i Cormorant Garamond iz mape fonts/) inače učitava
    // kartica-artikla.js; ako je taj modul isključen, učitaju se ovdje.
    // Idu u <head> stranice: fontovi iz <head> vrijede i unutar shadow roota.
    function ubaciFontove() {
      if (document.getElementById('mx-kartice-font') || document.getElementById('mx-pocetna-font') || !document.head) return;
      const rasponi = {
        'latin': 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
        'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'
      };
      const stil = document.createElement('style');
      stil.id = 'mx-pocetna-font';
      stil.textContent = [['MX Jost', 'jost', '400 600'], ['MX Cormorant', 'cormorant-garamond', '500 700']].map(function (f) {
        return Object.keys(rasponi).map(function (r) {
          return '@font-face{font-family:"' + f[0] + '";src:url("' + BAZA + 'fonts/' + f[1] + '-' + r + '.woff2") format("woff2");' +
            'font-weight:' + f[2] + ';font-style:normal;font-display:swap;unicode-range:' + rasponi[r] + '}';
        }).join('\n');
      }).join('\n');
      document.head.appendChild(stil);
    }


    // ═══════════════════════════════════════════════════════════════════
    //  POČETNI EKRAN — sloj preko Voiceflowova prozora chata
    // ═══════════════════════════════════════════════════════════════════
    const IKONA_X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>';
    const IKONA_ZVIJEZDA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C12.6 6.6 17.4 11.4 24 12 17.4 12.6 12.6 17.4 12 24 11.4 17.4 6.6 12.6 0 12 6.6 11.4 11.4 6.6 12 0z"/></svg>';
    const IKONA_STRELICA = '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h11.5M10 4.5L14.5 9 10 13.5"/></svg>';

    function el(oznaka, klasa, tekst) {
      const e = document.createElement(oznaka);
      if (klasa) e.className = klasa;
      if (tekst) e.textContent = tekst;
      return e;
    }

    // jednoslovne riječi (o, i, u, s, k, a, z) ne ostaju same na kraju retka
    function bezUdovica(tekst) {
      return String(tekst).replace(/(^|\s)([aiouskzAIOUSKZ])\s+/g, '$1$2 ');
    }

    function napraviPocetnu(radnje) {
      const korijen = el('div', 'mx-p');
      korijen.setAttribute('role', 'region');
      korijen.setAttribute('aria-label', String(P.natpis || 'Marti'));

      const platno = el('canvas', 'mx-p-platno');
      platno.setAttribute('aria-hidden', 'true');
      const sjaj = el('div', 'mx-p-sjaj');
      sjaj.setAttribute('aria-hidden', 'true');

      const vrh = el('div', 'mx-p-vrh');
      if (P.zaglavlje) vrh.appendChild(el('span', 'mx-p-marka', P.zaglavlje));
      const zatvori = el('button', 'mx-p-zatvori');
      zatvori.type = 'button';
      zatvori.setAttribute('aria-label', 'Zatvori chat');
      zatvori.innerHTML = IKONA_X;
      vrh.appendChild(zatvori);

      const scena = el('div', 'mx-p-scena');
      scena.appendChild(el('h2', 'mx-p-naslov', P.natpis));
      const rezerva = el('p', 'mx-p-rezerva', P.natpis);
      rezerva.setAttribute('aria-hidden', 'true');
      scena.appendChild(rezerva);
      if (P.podnaslov) scena.appendChild(el('p', 'mx-p-podnaslov', P.podnaslov));

      // tekst ispod animacije: zauzme svoj dio visine, pa se prostor
      // animacije (.mx-p-scena) smanji i oblici se pomaknu prema gore
      const uvod = el('div', 'mx-p-uvod');
      if (P.pozdrav) {
        const zvijezda = el('span', 'mx-p-zvijezda');
        zvijezda.setAttribute('aria-hidden', 'true');
        zvijezda.innerHTML = IKONA_ZVIJEZDA;
        uvod.appendChild(zvijezda);
        if (P.predPozdrav) uvod.appendChild(el('p', 'mx-p-pred', bezUdovica(P.predPozdrav)));
        const pozdrav = el('p', 'mx-p-pozdrav');
        pozdrav.appendChild(el('span', '', bezUdovica(P.pozdrav)));
        uvod.appendChild(pozdrav);
      }
      if (P.opis) {
        // riječ po riječ (svaka sa svojim zakašnjenjem), na kraju kursor
        const opis = el('p', 'mx-p-opis');
        const rijeci = bezUdovica(P.opis).split(' ');
        rijeci.forEach(function (r, i) {
          const s = el('span', 'mx-p-rijec', r);
          s.style.setProperty('--i', i);
          opis.appendChild(s);
          if (i < rijeci.length - 1) opis.appendChild(document.createTextNode(' '));
        });
        const kursor = el('span', 'mx-p-kursor');
        kursor.setAttribute('aria-hidden', 'true');
        kursor.style.setProperty('--n', rijeci.length);
        opis.appendChild(kursor);
        uvod.appendChild(opis);
      }

      const dno = el('div', 'mx-p-dno');
      const gumb = el('button', 'mx-p-gumb');
      gumb.type = 'button';
      gumb.appendChild(el('span', '', P.tekstGumba || 'Početak'));
      gumb.insertAdjacentHTML('beforeend', IKONA_STRELICA);
      dno.appendChild(gumb);

      korijen.appendChild(platno);
      korijen.appendChild(sjaj);
      korijen.appendChild(vrh);
      korijen.appendChild(scena);
      if (uvod.firstChild) korijen.appendChild(uvod);
      korijen.appendChild(dno);

      let otvoreno = false, izlazi = false;
      const anim = napraviAnimaciju(platno, scena, {
        bezAnimacije: function () { korijen.classList.add('mx-p-bez-gl'); },
        podnaslov: function (da) { korijen.classList.toggle('mx-p-podnaslov-da', da); },
        mjere: function (ispod) {
          korijen.style.setProperty('--mx-p-ispod', ispod + 'px');
          korijen.style.setProperty('--mx-p-sredina', (scena.offsetTop + scena.offsetHeight / 2) / Math.max(1, korijen.offsetHeight) * 100 + '%');
        },
        otvoreno: function () { return otvoreno; }
      });

      const promatracVelicine = typeof ResizeObserver === 'function'
        ? new ResizeObserver(function () { anim.velicina(); })
        : null;
      if (promatracVelicine) promatracVelicine.observe(korijen);
      else window.addEventListener('resize', anim.velicina);

      if (P.nagibPremaMisu && MIS) {
        korijen.addEventListener('pointermove', function (e) {
          const r = korijen.getBoundingClientRect();
          anim.mis(sat((e.clientX - r.left) / r.width) * 2 - 1, sat((e.clientY - r.top) / r.height) * 2 - 1);
        });
        korijen.addEventListener('pointerleave', function () { anim.mis(0, 0); });
      }

      zatvori.addEventListener('click', radnje.zatvori);
      gumb.addEventListener('click', function (e) {
        if (izlazi) return;
        izlazi = true;
        radnje.pocetak(e.detail === 0);   // detail 0 = pritisnut tipkovnicom
      });

      // Chat se otvori u krugu koji se širi od gumba "Početak"
      function otvoriKrug(gotovo) {
        const r = korijen.getBoundingClientRect(), g = gumb.getBoundingClientRect();
        const x = g.left + g.width / 2 - r.left, y = g.top + g.height / 2 - r.top;
        const max = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) + 60;
        const trajanje = MIRNO.matches ? 350 : 950, kasni = MIRNO.matches ? 0 : 180;
        const pocetak = performance.now();
        (function korak(sad) {
          const t = sat((sad - pocetak - kasni) / trajanje);
          if (MIRNO.matches) korijen.style.opacity = String(1 - t);
          else {
            const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const rr = e * max;
            const maska = 'radial-gradient(circle at ' + x + 'px ' + y + 'px, transparent ' + Math.max(0, rr - 60) + 'px, #000 ' + rr + 'px)';
            korijen.style.webkitMaskImage = maska;
            korijen.style.maskImage = maska;
          }
          if (t < 1) requestAnimationFrame(korak);
          else gotovo();
        })(pocetak);
      }

      return {
        el: korijen,
        pripremi: anim.pripremi,
        otvoreno: function () { return otvoreno; },
        prikazi: function () {
          if (izlazi) return;
          otvoreno = true;
          korijen.classList.remove('mx-p-ulaz', 'mx-p-spremno', 'mx-p-podnaslov-da');
          void korijen.offsetWidth;                       // da se animacija pojave ponovi
          korijen.classList.add('mx-p-ulaz');
          anim.velicina();
          anim.ispocetka().then(function (ok) {
            if (ok && otvoreno) korijen.classList.add('mx-p-spremno');
          });
        },
        sakrij: function () {
          otvoreno = false;
          korijen.classList.remove('mx-p-ulaz');         // i sjaj preko pozdrava staje
          anim.stani();
        },
        izlaz: function (gotovo) {
          korijen.classList.add('mx-p-izlaz');
          let ostalo = 2;
          function jedno() { if (--ostalo === 0) gotovo(); }
          anim.izlaz(jedno);
          otvoriKrug(jedno);
        },
        unisti: function () {
          otvoreno = false;
          anim.unisti();
          if (promatracVelicine) promatracVelicine.disconnect();
          else window.removeEventListener('resize', anim.velicina);
          korijen.remove();
        }
      };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  VEZA S VOICEFLOWOM
    // ═══════════════════════════════════════════════════════════════════
    let pocetna = null;       // početni ekran, dok postoji
    let pokrenuto = false;    // "Početak" je pritisnut (u ovom učitavanju stranice)
    let otvoren = false;      // chat je otvoren
    let promatracProzora = null;

    function korijenChata() {
      const h = document.getElementById(HOST);
      return h && h.shadowRoot;
    }

    // Razgovor još nije krenuo: Voiceflow tada pokazuje svoj gumb za početak
    function cekaPocetak(kor) {
      const g = kor.querySelector(START);
      if (!g || !g.parentElement) return false;
      const s = getComputedStyle(g.parentElement);
      return s.pointerEvents !== 'none' && s.display !== 'none' && s.visibility !== 'hidden';
    }

    // Postoji li već razgovor (spremljen u pregledniku ili prikazan u prozoru).
    // Gleda se samo spremište koje Voiceflow koristi: stari razgovor iz
    // drugog spremišta Voiceflow ne učita (i sam ga obriše)
    function imaRazgovor(kor) {
      if (kor.querySelector(PROZOR + ' .vfrc-system-response, ' + PROZOR + ' .vfrc-user-response')) return true;
      try {
        const spremista = PAMCENJE === 'memory' ? []
          : PAMCENJE === 'sessionStorage' ? [window.sessionStorage]
          : PAMCENJE === 'localStorage' ? [window.localStorage]
          : [window.localStorage, window.sessionStorage];
        for (let s = 0; s < spremista.length; s++) {
          const sp = spremista[s];
          if (!sp) continue;
          for (let i = 0; i < sp.length; i++) {
            const kljuc = sp.key(i);
            if (!kljuc || kljuc.indexOf('voiceflow-session-') !== 0) continue;
            const sesija = JSON.parse(sp.getItem(kljuc) || 'null');
            if (sesija && Array.isArray(sesija.turns) && sesija.turns.length) return true;
          }
        }
      } catch (e) { /* spremište nedostupno: odlučuje prozor */ }
      return false;
    }

    function trebaPocetna(kor) {
      if (pokrenuto || !kor.querySelector(START)) return false;
      if (P.iKadRazgovorPostoji) return true;
      return cekaPocetak(kor) && !imaRazgovor(kor);
    }

    // Dijelovi chata ispod početnog ekrana: isključeni dok je on preko njih
    function iskljuciIspod(prozor, da) {
      Array.prototype.forEach.call(prozor.children, function (d) {
        if (pocetna && d === pocetna.el) return;
        if (da) { if (!d.hasAttribute('inert')) { d.setAttribute('inert', ''); d.setAttribute('data-mx-p-inert', ''); } }
        else if (d.hasAttribute('data-mx-p-inert')) { d.removeAttribute('inert'); d.removeAttribute('data-mx-p-inert'); }
      });
    }

    // Početni ekran mora biti u prozoru chata (ako ga Voiceflow iscrta
    // iznova, ekran se premjesti u novi prozor)
    function prikvaci(kor) {
      const prozor = kor.querySelector(PROZOR);
      if (!prozor || !pocetna) return false;
      if (pocetna.el.parentNode !== prozor) prozor.appendChild(pocetna.el);
      iskljuciIspod(prozor, true);
      if (!promatracProzora) {
        promatracProzora = new MutationObserver(function () {
          if (!pocetna) return;
          const p = kor.querySelector(PROZOR);
          if (p && (pocetna.el.parentNode !== p || p.querySelector(':scope > :not(.mx-p):not([inert])'))) prikvaci(kor);
        });
      }
      promatracProzora.disconnect();
      promatracProzora.observe(kor, { childList: true, subtree: true });
      return true;
    }

    function ukloni() {
      if (promatracProzora) promatracProzora.disconnect();
      if (!pocetna) return;
      const prozor = pocetna.el.parentNode;
      pocetna.unisti();
      pocetna = null;
      OBLICI = null;                                  // oblici više ne trebaju (oslobodi memoriju)
      if (prozor) iskljuciIspod(prozor, false);
    }

    // Pritisak Voiceflowova gumba za početak → standardni početak razgovora
    function pokreniRazgovor(kor) {
      const g = kor && kor.querySelector(START);
      if (g && cekaPocetak(kor)) g.click();
    }

    function pocetak(tipkovnicom) {
      const kor = korijenChata();
      pokrenuto = true;
      if (kor) pokreniRazgovor(kor);
      if (!pocetna) return;
      pocetna.izlaz(function () {
        ukloni();
        // tko je krenuo tipkovnicom, nastavlja u polju za poruku (na mobitelu
        // se tipkovnica ne otvara sama)
        if (tipkovnicom && kor) {
          const polje = kor.querySelector(PROZOR + ' textarea, ' + PROZOR + ' input[type="text"]');
          if (polje) try { polje.focus({ preventScroll: true }); } catch (e) { /* nije bitno */ }
        }
      });
    }

    function zatvoriChat() {
      try { window.voiceflow.chat.close(); } catch (e) { /* nije bitno */ }
    }

    function napravi(kor) {
      if (pocetna) return pocetna;
      pocetna = napraviPocetnu({ pocetak: pocetak, zatvori: zatvoriChat });
      if (!prikvaci(kor)) { ukloni(); return null; }
      // oblici i WebGL se pripreme unaprijed, kad preglednik miruje
      const kasnije = window.requestIdleCallback || function (f) { return setTimeout(f, 1200); };
      kasnije(function () { if (pocetna) pocetna.pripremi(); }, { timeout: 2500 });
      return pocetna;
    }

    // Provjera stanja: pri pojavi prozora chata i pri svakom otvaranju
    function provjeri(priOtvaranju) {
      const kor = korijenChata();
      if (!kor || !kor.querySelector(PROZOR)) return;
      try {
        if (trebaPocetna(kor)) {
          if (!napravi(kor)) throw new Error('prozor chata nije pronađen');
          prikvaci(kor);
          if (priOtvaranju) pocetna.prikazi();
        } else if (pocetna && !pocetna.el.classList.contains('mx-p-izlaz')) {
          ukloni();
        }
      } catch (e) {
        // sigurnosna mreža: bez početnog ekrana chat radi kao prije
        console.warn('[Martimex] Početni ekran nije prikazan:', e);
        ukloni();
        pokrenuto = true;
        if (priOtvaranju) pokreniRazgovor(kor);
      }
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
        if (tip === 'voiceflow:open') {
          otvoren = true;
          provjeri(true);
        } else if (tip === 'voiceflow:close') {
          otvoren = false;
          const p = pocetna;
          // animacija staje kad se prozor spusti (Voiceflow ga spušta 0,3 s)
          if (p) setTimeout(function () { if (!otvoren && pocetna === p) p.sakrij(); }, 400);
        }
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

    // prozor chata se pojavi tek kad chat dobije svoje postavke s Voiceflowa
    function cekajProzor(korijen, gotovo) {
      if (korijen.querySelector(PROZOR) && korijen.querySelector(START)) { gotovo(); return; }
      const promatrac = new MutationObserver(function () {
        if (!korijen.querySelector(PROZOR) || !korijen.querySelector(START)) return;
        promatrac.disconnect();
        gotovo();
      });
      promatrac.observe(korijen, { childList: true, subtree: true });
    }

    function pokreni() {
      pratiOtvaranje();
      ubaciFontove();
      cekajHost(function (host) {
        const korijen = host.shadowRoot;
        ubaciStil(korijen);
        cekajProzor(korijen, function () { provjeri(otvoren); });
      });
      // Voiceflow više sam ne pokreće razgovor pri otvaranju chata (to radi
      // gumb "Početak") i pamti razgovor koliko je zadano u POSTAVKAMA;
      // loader.js ovo preda Voiceflowu
      const vf = window.MartimexVoiceflow = window.MartimexVoiceflow || {};
      vf.autostart = false;
      if (PAMCENJE) vf.assistant = Object.assign({}, vf.assistant, { persistence: PAMCENJE });
    }

    return { pokreni: pokreni };
  })();

  try { MX_POCETNA.pokreni(); }
  catch (e) { console.warn('[Martimex] Početni ekran chata nije pokrenut:', e); }

})();
