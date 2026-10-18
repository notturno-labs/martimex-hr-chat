# Film Naxos uživo — animacija početnog ekrana chata

Zadana animacija početnog ekrana (`pocetna-chata.js`, postavka `animacija: 'film'`).
Ista priča kao video u `../film-video/`, ali bez video datoteke: film se crta uživo u
pregledniku (WebGL) iz komada fotografija. Krug traje 14,6 s i ponavlja se bez šava.

## Što se vidi

1. **Sastojci** (0–1,5 s): limun s listovima, med, saće, kora limete i bijeli cvjetovi s
   fotografije `../razlijetanje/izvor.jpg` lebde složeni u tami.
2. **Vrtlog** (1,5–5,7 s): sastojci se podignu i zavrte u krug oko središta. Limun se pritom
   okreće oko svoje osi. Bliži komadi su mutni, a iza vrtloga se skupi toplo zlatno svjetlo.
3. **Bočica** (4,4–5,6 s): u sredini vrtloga iz svjetla nastane bočica Xerjoff Naxos.
4. **Prizor** (5,7–7,7 s): vrtlog se rasprsne prema kameri, a oko bočice se izoštri prizor s
   fotografije `../naxos/izvor.jpg` (staklenka meda, limuni, cvjetovi naranče, cimet, vanilija)
   u mekom krugu svjetla.
5. **Bočica u prizoru** (7,9–11,4 s): kamera polako ulazi u prizor, a bliži predmeti se pomiču
   više od pozadine. Preko zlatnog čepa i pločice prijeđe odsjaj, med teče sa žlice, u suncu
   lebdi prašina.
6. **Povratak** (11,4–14,6 s): prizor se povuče u tamu, bočica se rastopi u svjetlo, a sastojci
   doplove natrag i slože se kao na početku.

Nakon **POČETAK** kadar se lagano poveća i nestane, dok se chat otvara u krugu koji se širi
od poziva.

## Kako se crta

- **Sastojci**: 30 komada izrezanih iz fotografije i 20 kapi meda koje se otkinu u vrtlogu.
  Svaki komad ima pet razina oštrine, pa se bliži i dalji komadi glatko zamute kao kod
  objektiva (dubinska oštrina).
- **Limun**: kora je preslikana na elipsoid koji se okreće, a svjetlo i sjena stoje na mjestu.
  Zato izgleda kao pravi okret ploda, a ne kao okretanje slike.
- **Pokretno zamućenje**: brzi komadi se u istom kadru nacrtaju više puta (do 5 podkadrova) i
  zbroje, kao pri snimanju kamerom.
- **Prizor**: fotografija s kartom dubine. Kamera ulazi u prizor, a bliži predmeti se pomiču više
  od pozadine. Prizor se izoštri iz razina zamućenja. Maske s fotografije određuju gdje med
  teče i kuda odsjaj prelazi preko zlata, a prašina su sitne čestice u svjetlu.
- **Rub**: tamni rub i meki krug. Kadar se stapa s podlogom (`mix-blend-mode: screen`), pa se
  vidi i zlatni sjaj početnog ekrana.

## Datoteke

- `film.js` (≈ 47 KB): modul. Na vrhu su opis i **POSTAVKE**:
  - `VELICINA`: veličina kadra (1 = širina prozora chata).
  - `STANI_NA`: gdje film stane kad je `ponavljaj: false`.
  - `IZLAZ_MS`: trajanje nestajanja nakon **POČETAK**.
  - `NAJVISE_DPR` i `NAJVISE_UZORAKA`: najveća oštrina i najviše podkadrova.
  - `VERZIJA`: povećaj kad zamijeniš slike ili podatke.
- `film-podaci.js` (≈ 680 KB, preuzme se ≈ 500 KB jer se sažima): sve slike (komadi sastojaka
  u pet razina oštrine, kora limuna, prizor, karta dubine, maske meda i zlata, bočica) i putanje
  komada. Slike su u `data:` adresama, pa WebGL ne treba CORS. Datoteka je izrađena i ne mijenja
  se ručno.
- `film-pocetak.jpg` (≈ 60 KB): prvi kadar. Stoji dok se podaci ne učitaju, pa nema skoka.
- `film-mirno.jpg` (≈ 70 KB): završni prizor (bočica u prizoru). Stoji umjesto filma kad je na
  uređaju uključeno **Smanji pokrete** ili ušteda podataka, ili kad WebGL ne radi.

## Kako radi na stranici

- `pocetna-chata.js` učita `film.js` (u odjeljku VANJSKE ANIMACIJE) kad pripremi početni ekran.
  Tada se preuzme samo prvi kadar (≈ 60 KB). Podaci se preuzmu tek kad kupac prvi put otvori
  chat, pa posjetitelji koji ne otvore chat ne troše podatke.
- Svako otvaranje chata pokreće film ispočetka. Kad se chat zatvori, film stane i ne troši
  bateriju.
- Na sporom uređaju (ispod ≈ 25 sličica u sekundi) film sam smanji razlučivost i broj
  podkadrova, da ostane tečan.
- `ponavljaj: false` u `pocetna-chata.js`: film stane na bočici u prizoru (`STANI_NA`).
- Ako se `film.js` ne učita, početni ekran ima animaciju od točkica.

## Uživo ili video

| | `'film'` (uživo) | `'film-video'` |
|---|---|---|
| Preuzimanje | ≈ 0,5 MB | ≈ 2 MB |
| Oštrina | razlučivost zaslona (do 2× gustoće piksela) | 900 × 900 |
| iPhone u štednji baterije | radi | stoji završni prizor (video se ne pokreće sam) |
| Opterećenje uređaja | grafički procesor | dekodiranje videa |

Za prebacivanje u `pocetna-chata.js` promijeni postavku `animacija`. Za drugi proizvod treba
izraditi nove podatke i nova dva kadra (`film-pocetak.jpg`, `film-mirno.jpg`), pa povećati
`VERZIJA` u `film.js`.
