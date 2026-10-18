# Film Naxos uživo — animacija početnog ekrana chata

Zadana animacija početnog ekrana (`pocetna-chata.js`, postavka `animacija: 'film'`).
Ista priča kao video u `../film-video/`, ali bez video datoteke: film se crta uživo u
pregledniku (WebGL) iz komada fotografija. Svaki element živi (savija se, leprša, mijenja
svjetlo dok se okreće), a ne samo pomiče. Krug traje 14,6 s i ponavlja se bez šava.

## Što se vidi

1. **Sastojci dišu** (0–1,5 s). Limun s listovima, med, saće, kora limete i bijeli cvjetovi s
   fotografije `../razlijetanje/izvor.jpg` lebde složeni u tami. Svaki komad polako pluta,
   listovi i latice se lagano savijaju i naginju, a med polako teče. Svjetlo blago klizi preko
   pora limuna, saća i voštanih listova, a u tami lebdi pelud.
2. **Vrtlog** (1,5–5,7 s). Sastojci se malo skupe (udah), pa se podignu i zavrte u krug.
   - Listovi i latice lepršaju na zraku i prevrću se u prostoru. Tada se vidi svjetlija
     poleđina lista i bijela unutrašnjost kore limete.
   - S meda se otkidaju jantarne kapi: nit se rastegne i pukne.
   - Limun se okreće oko svoje osi.
3. **Zlatno svjetlo** (3,2–5,6 s). U sredini se skuplja svjetlo. Kroz sastojke izlaze zrake,
   sastojci okrenuti prema svjetlu zasvijetle, a latice i listovi propuštaju toplo svjetlo.
   Zlatne iskre spiralom ulaze u sredinu.
4. **Bočica** (3,9–5,6 s). Svjetlo poprimi oblik bočice Xerjoff Naxos. Bočica se zatim odozdo
   napuni rastaljenim zlatom (užarena valovita crta ide prema čepu) i ohladi se. Zrak oko nje
   lagano titra od topline.
5. **Prasak i prizor** (5,7–7,9 s). Vrtlog se uz val i bljesak rasprsne prema kameri. Brzi
   komadi ostavljaju mutni trag. Izoštri se prizor s fotografije `../naxos/izvor.jpg`, prvo
   bočica, zatim sve oko nje.
6. **Bočica u prizoru** (7,9–11,4 s). Kamera polako ulazi u prizor. Prizor živi:
   - vjetar njiše listove limuna, cvjetove naranče i lavandu;
   - sunce kroz krošnju klizi po stolu i zidu;
   - med teče sa žlice, a na površini meda u staklenci šire se krugovi;
   - na prerezanom limunu i medu titraju iskre, a bokeh u pozadini treperi;
   - preko zlatnog čepa prijeđe odsjaj, a preko bijele bočice meka traka svjetla;
   - u zrakama sunca lebdi prašina.
7. **Povratak** (11,4–14,6 s). Prizor se povuče u tamu. Bočica se ugrije i odozgo raspadne
   u zlatnu prašinu, a sastojci doplove natrag i slože se s blagim njihanjem.

Nakon **POČETAK** kadar se lagano poveća i nestane, dok se chat otvara u krugu koji se širi
od poziva.

## Kako se crta

- **Komadi**: 30 komada izrezanih iz fotografije. Svaki je mreža koja se u prostoru
  - savija (luk, žlijeb, val lepršanja),
  - okreće,
  - gleda kroz perspektivu.

  Svjetlo se računa uživo iz karte visine (žile lista, pore kore, stanice saća, zaobljen
  rub). Zato se odsjaji pomiču dok se komad okreće. Med u komadima lagano valovito teče.
- **Kapi meda**: crtane (ne iz fotografije). Kap je jantarna, sjajna i rasteže se u letu, a pri
  odvajanju je s medom spaja nit koja pukne.
- **Oštrina i pokret**: bliži i dalji komadi glatko se zamute kao kod objektiva (pet razina
  oštrine). Brzi komadi u istom kadru se nacrtaju više puta (do 5 podkadrova) i zbroje,
  kao pri snimanju kamerom.
- **Limun**: kora se okreće po elipsoidu, a svjetlo i sjena stoje. Pore hvataju odsjaje.
- **Prizor**: fotografija s kartom dubine (pomak kamere, bliži predmeti se pomiču više).
  Maske s fotografije određuju gdje puše vjetar, kuda pada sunce, gdje teče med, gdje titraju
  iskre i bokeh te kuda prelazi odsjaj.
- **Svjetlo i slika**:
  - zrake od zlatnog svjetla i od sunca;
  - meki sjaj svijetlih mjesta;
  - lom boja na rubu kadra;
  - val pri prasku;
  - titranje zraka oko vruće bočice;
  - filmsko zrno (samo u svijetlom dijelu, crni rub ostaje čist).
- **Rub**: tamni rub i meki krug. Kadar se stapa s podlogom (`mix-blend-mode: screen`), pa se
  vidi i zlatni sjaj početnog ekrana.

## Datoteke

- `film.js` (≈ 90 KB, preuzme se ≈ 27 KB jer se sažima): modul. Na vrhu su opis i
  **POSTAVKE**:
  - `VELICINA`: veličina kadra (1 = širina prozora chata).
  - `STANI_NA`: gdje priča stane kad je `ponavljaj: false`. Prizor i tada živi (vjetar, med,
    sunce, prašina).
  - `IZLAZ_MS`: trajanje nestajanja nakon **POČETAK**.
  - `NAJVISE_DPR` i `NAJVISE_UZORAKA`: najveća oštrina i najviše podkadrova.
  - `ZIVOST`: jačina sitnih pokreta (lepršanje, med, vjetar, iskre); `0` = mirno.
  - `SVJETLO`: jačina zraka i sjaja; `0` = bez.
  - `ZRNO`: filmsko zrno; `0` = bez.
  - `VERZIJA`: povećaj kad zamijeniš slike ili podatke.
- `film-podaci.js` (≈ 890 KB, preuzme se ≈ 650 KB jer se sažima). Sadrži sve slike i putanje
  komada:
  - komade sastojaka u pet razina oštrine i njihovu kartu visine;
  - koru limuna i kartu visine kore;
  - prizor;
  - maske prizora (dubina, vjetar, sunce, iskre, bokeh, zlato, med, tijelo bočice);
  - bočicu.

  Slike su u `data:` adresama, pa WebGL ne treba CORS. Datoteka je izrađena i ne mijenja se
  ručno.
- `film-pocetak.jpg` (≈ 70 KB): prvi kadar (isti kao prvi kadar filma). Stoji dok se podaci ne
  učitaju, pa nema skoka.
- `film-mirno.jpg` (≈ 75 KB): bočica u prizoru. Stoji umjesto filma kad je na uređaju
  uključeno **Smanji pokrete** ili ušteda podataka, ili kad WebGL ne radi.

## Kako radi na stranici

- `pocetna-chata.js` učita `film.js` (u odjeljku VANJSKE ANIMACIJE) kad pripremi početni ekran.
  Tada se preuzme samo prvi kadar. Podaci se preuzmu tek kad kupac prvi put otvori chat, pa
  posjetitelji koji ne otvore chat ne troše podatke.
- Svako otvaranje chata pokreće film ispočetka. Kad se chat zatvori, film stane i ne troši
  bateriju.
- Ako uređaj ne stigne crtati barem ≈ 25 sličica u sekundi, film to sam ublaži u koracima:
  1. manja razlučivost i manje podkadrova,
  2. bez zraka,
  3. bez sjaja.

  Priča i pokreti ostaju isti.
- `ponavljaj: false` u `pocetna-chata.js`: priča stane na bočici u prizoru (`STANI_NA`).
- Ako se `film.js` ne učita, početni ekran ima animaciju od točkica.

## Uživo ili video

| | `'film'` (uživo) | `'film-video'` |
|---|---|---|
| Preuzimanje | ≈ 0,7 MB | ≈ 2 MB |
| Oštrina | razlučivost zaslona (do 2× gustoće piksela) | 900 × 900 |
| Živi detalji | da (savijanje, svjetlo, med, vjetar, iskre) | ne (stari film) |
| iPhone u štednji baterije | radi | stoji završni prizor (video se ne pokreće sam) |
| Opterećenje uređaja | grafički procesor | dekodiranje videa |

Za prebacivanje u `pocetna-chata.js` promijeni postavku `animacija`. Za drugi proizvod treba
izraditi nove podatke i nova dva kadra (`film-pocetak.jpg`, `film-mirno.jpg`), pa povećati
`VERZIJA` u `film.js`.
