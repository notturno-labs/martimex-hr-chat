# Predaja: popust na kartici artikla (akcija i promo kod)

Zadatak: u karticu artikla Marti chata (`kartica-artikla.js`, ekstenzija `ProductCard`, trace
`ext_product_card`) dodaj prikaz popusta uz cijenu. **Samo prikaz cijene**: ostatak kartice ostaje
točno kakav je.

Gotova i testirana verzija postoji u repozitoriju `notturno-labs/martimex-hr-chat`, grana
`claude/eager-carson-7bfq3j`, datoteka `pokusi/akcija/kartica-artikla-popust.js` (v31 = v30 + popust).
Razlika prema originalu: `git diff --no-index kartica-artikla.js pokusi/akcija/kartica-artikla-popust.js`.
Ako je `kartica-artikla.js` u međuvremenu mijenjan, prenesi samo dijelove opisane ovdje; ne kopiraj
cijelu datoteku preko novije verzije.

---

## 1. Kako izgleda

Desno od bočice, ispod naziva i kratke roze crtice:

```
──
2̶4̶5̶,̶0̶0̶ ̶€̶            ← stara cijena: sitna (11 px), siva, preko nje tanka KOSA crta (−8°)
196,00 €   (−20%)    ← nova cijena: 14 px, weight 500, crna   +   voštani pečat desno
UZ KOD MRTMX         ← samo kad vrijedi promo kod: 8 px, velika razmaknuta slova, boja #a0675a
```

- **Crta preko stare cijene** nije `text-decoration: line-through` nego pseudo-element (`::after`):
  1 px, boja `#a0675a`, nagnuta −8° oko svoje sredine, malo šira od teksta (−2 px s obje strane).
  Izgleda kao potez perom.
- **Voštani pečat** (40 × 40 px), desno od cijena, razmak 12 px:
  - nepravilan, valovit rub (kapljica voska; `clip-path: path()`, a kao rezerva `border-radius: 50%`)
  - vosak `#dfbcb1`: svjetliji gore lijevo, tamniji uz rub
  - utisnuti prsten 6 px od ruba
  - postotak „−30%” (11 px, weight 600, `%` sitniji i podignut, minus podignut 0,1 em jer u Jostu
    sjedi nisko); utisnut je bijelom sjenom teksta
  - pečat je zakrenut −12° i ima meku sjenu
- **„uz kod MRTMX”**: diskretno, kao redak s vrstom mirisa (EAU DE PARFUM · 100 ML), samo u boji akcije.
- **Pojava** (samo kad preporuka stigne prvi put, unutar postojeće `.mx-pojava` animacije):
  1. nakon 0,9 s pero „iscrta” crtu preko stare cijene s lijeva na desno (0,5 s)
  2. nakon 1,25 s nova cijena izroni (blur → oštro, 4 px odozdo), a 0,13 s nakon nje „uz kod”
  3. nakon 1,45 s pečat se „utisne” (iz 1,8× i −38° na −12°, lagano odskoči), a od njega se raširi
     tanki roza val
  - svaka sljedeća kartica u poruci kasni još 110 ms (`--mx-i`)
  - uz „Smanji pokrete” nema animacija, sve je odmah na mjestu
  - u visokom kontrastu (Windows, `forced-colors`) crta se ne vidi, pa tamo vrijedi obično
    `line-through`

**NE raditi** (korisnik je to izričito odbio):
- nikakav dodatni dio ni produžetak kartice (odrezak kupona, perforacija, izrezi, veliki „−30 % uz kod”)
- nikakav gumb za kopiranje koda
- kartica **bez popusta** mora ostati piksel po piksel jednaka sadašnjoj

## 2. Podaci (payload)

Sve je neobavezno; ostala polja ostaju ista.

```json
{
  "title": "Mancera ▻ Red Tobacco Eau de Parfum 120 ml",
  "price": "119.00",
  "oldPrice": "149.00",
  "promo": { "code": "MRTMX", "percent": 30, "validUntil": "2026-10-31" }
}
```

- `oldPrice` → akcija (već postoji u v30; podržani su i `regularPrice` / `regular_price`)
- `promo.code` + `promo.percent` **ili** `promo.price` (cijena s kodom); dovoljno je jedno
- isto kao ravna polja: `promoCode`, `promoPercent`, `promoPrice`, `promoValidUntil`
- `percent` može biti `30`, `"30"`, `"30%"`, `"-30%"`, `"12,5"`
- `validUntil`: `"2026-10-31"` (vrijedi do kraja tog dana), `"2026-10-31T18:00"`, sa zonom
  (`"…Z"`, `"+02:00"`) ili `"31. 10. 2026."`. Kad je prošao, kod se ne prikazuje.

## 3. Pravila

| Slučaj | Precrtano | Nova cijena | Ispod | Pečat |
|---|---|---|---|---|
| samo akcija (`oldPrice` > `price`) | oldPrice | price | – | % akcije |
| samo kod | price | price s kodom | „uz kod MRTMX” | % koda |
| akcija + kod | oldPrice | price s kodom | „uz kod MRTMX” | ukupni % (oldPrice → cijena s kodom) |
| bez popusta | – | – (obična cijena kao dosad) | – | – |
| cijena nije broj (npr. „od 49 €”) + kod | – | obična cijena | „−30 % uz kod MRTMX” | – |
| kod s prošlim rokom, postotak 0 ili ≥ 100, cijena s kodom ≥ cijena | kod se ignorira | | | |

- Cijena s kodom = `round(price × (100 − percent)) / 100`, s **točnim** postotkom (na 0,1 se
  zaokružuje samo prikaz). 33,33 % na 1.299,00 € daje 866,04 €.
- Cijena s kodom računa se samo kad je `price` čist broj (`brojCijene`, ne `brojIz`).
- Postotak na pečatu je cijeli broj (`Math.round`), kao i dosad u v30.
- Čitač zaslona čita „Prije: 119,00 € Sada: 83,30 € uz kod MRTMX (popust 30 %)”; pečat je
  `aria-hidden`.

## 4. Kod (iz testirane v31)

Pomoćne funkcije koje se koriste već postoje u v30: `el`, `tekst`, `brojIz`, `brojCijene`, `cijena`,
`EUR`, `prozirna`, `mijesaj`, `elementCijene`, `hash`.

### 4.1 Postavke (`MX_POSTAVKE`)

```js
boje: {
  // … postojeće boje …
  roza:    '#e2c3ba', // … (koristi se i za val oko pečata)
  vosak:   '#dfbcb1', // voštani pečat s postotkom popusta
  akcija:  '#a0675a'  // crta preko stare cijene, natpis "uz kod MRTMX", prsten i broj na pečatu
},
// … na kraju postavki:
pecat: true,              // voštani pečat s postotkom pokraj cijene
tekstUzKod: 'uz kod'      // ispod cijene s kodom: "uz kod MRTMX"
```

### 4.2 Obris pečata (u motoru, prije CSS-a)

```js
const PECAT = 40;
const OBRIS_PECATA = (function () {
  const N = 36, c = PECAT / 2, t = [];
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2;
    const r = c - 1.9 + 0.8 * Math.sin(a * 5 + 0.7) + 0.5 * Math.sin(a * 8 + 2.1) + 0.35 * Math.sin(a * 13 + 4);
    t.push([c + r * Math.cos(a), c + r * Math.sin(a)]);
  }
  const sred = function (p, q) { return ((p[0] + q[0]) / 2).toFixed(2) + ' ' + ((p[1] + q[1]) / 2).toFixed(2); };
  let d = 'M' + sred(t[N - 1], t[0]);
  for (let i = 0; i < N; i++) d += ' Q' + t[i][0].toFixed(2) + ' ' + t[i][1].toFixed(2) + ' ' + sred(t[i], t[(i + 1) % N]);
  return d + ' Z';
})();
```

### 4.3 CSS (u `.mx` varijable, a stara pravila `.mx-popust-red`, `.mx-stara`, `.mx-popust` zamijeni ovim)

```css
/* u .mx { … } */
--mx-vosak: ${B.vosak};
--mx-akcija: ${B.akcija};

/* pečat smije zauzeti i uvlaku desno od teksta (ukras je), pa ostaje pokraj cijena na uskom mobitelu */
.mx-cijene--popust { margin-right: calc(-1 * var(--mx-uvlaka)); }
.mx-snizenje {
  display: flex;
  flex-wrap: wrap;              /* uzak chat: pečat ide ispod cijena, kartica ne postaje šira */
  align-items: center;
  gap: 6px 12px;
  max-width: 100%;
}
.mx-cijene-stup { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; }
.mx-stara {
  position: relative;
  display: inline-block;
  font-size: 11px;
  line-height: 1.3;
  font-weight: 400;
  letter-spacing: .04em;
  color: var(--mx-dim);
  font-variant-numeric: lining-nums;
  text-decoration: none;
  white-space: nowrap;
}
.mx-stara::after {
  content: "";
  position: absolute;
  left: -2px; right: -2px; top: 54%;
  height: 1px;
  border-radius: 1px;
  background: var(--mx-akcija);
  transform: rotate(-8deg);
}
.mx-nova {
  display: block;
  margin-top: 1px;
  font-size: 14px;
  line-height: 1.25;
  font-weight: 500;
  letter-spacing: .03em;
  color: var(--mx-tinta);
  font-variant-numeric: lining-nums;
  white-space: nowrap;
}
.mx-uz-kod {
  display: block;
  margin-top: 3px;
  font-size: 8px;
  line-height: 1.4;
  font-weight: 500;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--mx-akcija);
}
.mx-pecat {
  position: relative;
  flex: none;
  width: ${PECAT}px;
  height: ${PECAT}px;
  transform: rotate(-12deg);
  filter: drop-shadow(0 1px 1px rgba(95, 50, 40, .22)) drop-shadow(0 3px 4px rgba(95, 50, 40, .12));
}
.mx-pecat-vosak {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;           /* rezerva kad preglednik ne zna clip-path: path() */
  clip-path: path('${OBRIS_PECATA}');
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, .55) 0, rgba(255, 255, 255, 0) 42%),
    radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 58%, ${prozirna(B.akcija, .28)} 100%),
    var(--mx-vosak);
}
.mx-pecat-vosak::before {      /* utisnuti prsten */
  content: "";
  position: absolute;
  top: 6px; right: 6px; bottom: 6px; left: 6px;
  border-radius: 50%;
  border: 1px solid ${prozirna(B.akcija, .38)};
  box-shadow: 0 1px 0 rgba(255, 255, 255, .55), inset 0 1px 0 rgba(255, 255, 255, .4);
}
.mx-pecat-tekst {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 1px;
  font-size: 11px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: 0;
  color: ${mijesaj(B.akcija, B.tinta, .45)};
  text-shadow: 0 1px 0 rgba(255, 255, 255, .5);
  font-variant-numeric: lining-nums;
  white-space: nowrap;
}
.mx-pecat-tekst small { margin-left: 1px; font-size: 7px; font-weight: 600; transform: translateY(-2px); }
.mx-minus { display: inline-block; margin-right: .04em; transform: translateY(-.1em); }
.mx-pecat::after {             /* val kad pečat "sjedne" */
  content: "";
  position: absolute;
  top: 2px; right: 2px; bottom: 2px; left: 2px;
  border-radius: 50%;
  border: 1px solid var(--mx-roza);
  opacity: 0;
  pointer-events: none;
}

/* animacije pojave (uz postojeće .mx-pojava pravila) */
.mx-pojava .mx-stara::after {
  animation: mx-precrtaj .5s cubic-bezier(.6, 0, .3, 1) backwards;
  animation-delay: calc(900ms + var(--mx-i, 0) * 110ms);
}
.mx-pojava .mx-nova,
.mx-pojava .mx-uz-kod {
  animation: mx-nova .7s var(--mx-glatko) backwards;
  animation-delay: calc(1250ms + var(--mx-i, 0) * 110ms);
}
.mx-pojava .mx-uz-kod { animation-delay: calc(1380ms + var(--mx-i, 0) * 110ms); }
.mx-pojava .mx-pecat {
  animation: mx-pecat .62s cubic-bezier(.3, 1.35, .55, 1) backwards;
  animation-delay: calc(1450ms + var(--mx-i, 0) * 110ms);
}
.mx-pojava .mx-pecat::after {
  animation: mx-pecat-val .9s ease-out;
  animation-delay: calc(1750ms + var(--mx-i, 0) * 110ms);
}
@keyframes mx-precrtaj {       /* clip-path je u smjeru same crte: otkriva je s lijeva */
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0 0 0); }
}
@keyframes mx-nova { from { opacity: 0; transform: translateY(4px); filter: blur(3px); } }
@keyframes mx-pecat {
  0%   { opacity: 0; transform: scale(1.8) rotate(-38deg); }
  55%  { opacity: 1; transform: scale(.92) rotate(-9deg); }
  100% { opacity: 1; transform: rotate(-12deg); }
}
@keyframes mx-pecat-val {
  0%   { opacity: .9; transform: scale(.95); }
  100% { opacity: 0; transform: scale(1.9); }
}
@media (forced-colors: active) {
  .mx-stara { text-decoration: line-through; }
  .mx-stara::after { display: none; }
}
/* u postojeći @media (prefers-reduced-motion: reduce) { … } dodaj: */
.mx-pojava .mx-stara::after, .mx-pojava .mx-nova, .mx-pojava .mx-uz-kod,
.mx-pojava .mx-pecat, .mx-pojava .mx-pecat::after { animation: none; }
```

Povećaj oznaku verzije stila u `ubaciStil` (npr. `'30'` → `'31'`, na oba mjesta), da se stari stil zamijeni.

### 4.4 Podaci (`uzmiKartice`)

```js
// prva vrijednost koja je zadana (null, undefined i '' se preskaču)
function prvo() {
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i] !== null && arguments[i] !== undefined && arguments[i] !== '') return arguments[i];
  }
  return null;
}

// u map(function (c) { … }) prije return:
const promo = (c.promo && typeof c.promo === 'object') ? c.promo : {};
// u vraćeni objekt dodaj:
kod: tekst(prvo(promo.code, c.promoCode)),
kodPostotak: prvo(promo.percent, c.promoPercent),
kodCijena: prvo(promo.price, c.promoPrice),
kodRok: prvo(promo.validUntil, c.promoValidUntil)
```

### 4.5 Pomoćne funkcije

```js
function rokProsao(v) {
  if (v === null || v === undefined || v === '') return false;
  const s = String(v).trim();
  if (/T\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const t = Date.parse(s);
    if (!isNaN(t)) return t < Date.now();
  }
  let g, mj, d, h = 23, min = 59, sek = 59;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (m) {
    g = +m[1]; mj = +m[2]; d = +m[3];
    if (m[4] !== undefined) { h = +m[4]; min = +m[5]; sek = 0; }
  } else if ((m = s.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?$/))) {
    g = +m[3]; mj = +m[2]; d = +m[1];
  } else {
    return false;
  }
  const kraj = new Date(g, mj - 1, d, h, min, sek);
  return !isNaN(kraj.getTime()) && kraj.getTime() < Date.now();
}

// → { tekst, postotak, cijena (s kodom; null kad se ne zna) } ili null
function promoKod(k, nCijena) {
  if (!k.kod || rokProsao(k.kodRok)) return null;
  let postotak = k.kodPostotak !== null ? Math.abs(brojIz(k.kodPostotak) || 0) : 0;
  let sKodom = brojCijene(k.kodCijena);
  if (!postotak && sKodom !== null && nCijena) postotak = (1 - sKodom / nCijena) * 100;
  const tocan = postotak;                                  // za izračun cijene s kodom
  postotak = Math.round(postotak * 10) / 10;               // za prikaz
  if (!(postotak > 0 && postotak < 100)) return null;
  if (nCijena === null) sKodom = null;                     // cijena nije čist broj
  else if (sKodom === null) sKodom = Math.round(nCijena * (100 - tocan)) / 100;
  if (sKodom !== null && !(sKodom < nCijena)) sKodom = null;
  return { tekst: k.kod, postotak: postotak, cijena: sKodom };
}

function natpisKoda(kod) {   // "−30 % uz kod MRTMX"
  return '−' + String(kod.postotak).replace('.', ',') + ' % ' + P.tekstUzKod + ' ' + kod.tekst;
}

function pecat(p) {
  const v = el('span', 'mx-pecat');
  v.setAttribute('aria-hidden', 'true');
  v.appendChild(el('span', 'mx-pecat-vosak'));
  const t = el('span', 'mx-pecat-tekst');
  t.appendChild(el('span', 'mx-minus', '−'));
  t.appendChild(document.createTextNode(String(p)));
  t.appendChild(el('small', '', '%'));
  v.appendChild(t);
  return v;
}
```

### 4.6 Cijena u `izgradiKarticu` (zamjenjuje stari blok s `popust` / `.mx-popust-red`)

```js
const nCijena = brojIz(k.cijena);
const nStara = brojIz(k.stara);
const naAkciji = nCijena !== null && nStara !== null && nStara > nCijena;
const kod = promoKod(k, brojCijene(k.cijena));
const sKodom = !!kod && kod.cijena !== null;
const prije = naAkciji ? nStara : (sKodom ? nCijena : null);
const sada = sKodom ? kod.cijena : nCijena;
const popust = prije ? Math.round((1 - sada / prije) * 100) : 0;
const ec = elementCijene(k.cijena);
if (ec) {
  const cijene = el('div', popust >= 1 ? 'mx-cijene mx-cijene--popust' : 'mx-cijene');
  if (popust >= 1) {
    const red = el('div', 'mx-snizenje');
    const stup = el('div', 'mx-cijene-stup');
    const stara = el('s', 'mx-stara');
    stara.appendChild(el('span', 'mx-skriveno', 'Prije: '));
    stara.appendChild(document.createTextNode(cijena(naAkciji ? k.stara : k.cijena)));
    stup.appendChild(stara);
    const nova = el('span', 'mx-nova');
    nova.appendChild(el('span', 'mx-skriveno', 'Sada: '));
    nova.appendChild(document.createTextNode(sKodom ? EUR.format(kod.cijena) : cijena(k.cijena)));
    stup.appendChild(nova);
    if (sKodom) stup.appendChild(el('span', 'mx-uz-kod', P.tekstUzKod + ' ' + kod.tekst));
    else if (kod) stup.appendChild(el('span', 'mx-uz-kod', natpisKoda(kod)));
    stup.appendChild(el('span', 'mx-skriveno', ' (popust ' + popust + ' %)'));
    red.appendChild(stup);
    if (P.pecat) red.appendChild(pecat(popust));
    cijene.appendChild(red);
  } else {
    cijene.appendChild(ec);
    if (kod) cijene.appendChild(el('span', 'mx-uz-kod', natpisKoda(kod)));   // cijena nije broj
  }
  glava.appendChild(cijene);
}
```

### 4.7 Pojava

- U `pokreniPojavu` klasa `mx-pojava` mora ostati dok se ne utisne i zadnji pečat:
  `140 + broj * 110 + 1150` → `140 + broj * 110 + 2500`.
- U `trebaPojava` popust ulazi u potpis (samo kad ga ima, pa kartice bez popusta zadrže stari
  potpis). Tako se proizvod koji je već viđen bez popusta opet animira kad dobije popust:

```js
const potpis = hash(tip + '|' + kartice.map(function (k) {
  const c = brojIz(k.cijena), st = brojIz(k.stara);
  const popust = (c !== null && st !== null && st > c) || k.kod
    ? '~' + [k.cijena, k.stara, k.kod, k.kodPostotak, k.kodCijena].join('~') : '';
  return k.url + '~' + k.naziv + popust;
}).join('|'));
```

## 5. Provjera

Ovo je sve provjereno u testiranoj v31; ponovi nakon prenošenja:

| price | dodatno | očekivano |
|---|---|---|
| 196.00 | oldPrice 245.00 | ~~245,00 €~~ · 196,00 € · pečat −20% |
| 119.00 | promo MRTMX 30 | ~~119,00 €~~ · 83,30 € · UZ KOD MRTMX · −30% |
| 252.00 | oldPrice 315.00 + promo 30 | ~~315,00 €~~ · 176,40 € · UZ KOD MRTMX · −44% |
| 119.00 | promo price 83.30 (bez percent) | isto kao promo 30 |
| 1299.00 | promo 33.33 | 866,04 € · −33% |
| od 49 € | promo 30 | „od 49 €” + „−30 % uz kod MRTMX”, bez pečata |
| 119.00 | promo s prošlim validUntil | obična cijena, bez koda |
| 245.00 | ništa | izgleda točno kao v30 |

- Uski chat (kartica ~240 px): ništa ne izlazi preko ruba; pečat prijeđe ispod cijena tek kad nema
  mjesta.
- „Smanji pokrete”: nema animacija. Visoki kontrast: stara cijena obično precrtana.

Pregled uživo s pravim chatom: `pokusi/akcija/uzivo.html` na istoj grani (dodaje probne popuste jer
Voiceflow funkcija još ne šalje `oldPrice` / `promo`). Da bi popust radio u stvarnosti, funkcija u
Voiceflowu mora početi slati ta polja.
