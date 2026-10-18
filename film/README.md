# Film Naxos — animacija početnog ekrana chata

Animacija početnog ekrana kad je u `pocetna-chata.js` postavka `animacija: 'film'` (zadano).
To je unaprijed izrađen video na crnoj podlozi. Krug traje 14,6 s i ponavlja se bez šava
(zadnji kadar je isti kao prvi).

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

## Datoteke

- `film.js`: modul koji film stavi na početni ekran (u prostor animacije, širok koliko prozor
  chata). Video se stapa s podlogom (`mix-blend-mode: screen` i meki rub), pa se vidi i
  zlatni sjaj početnog ekrana. Na vrhu su **POSTAVKE** (imena datoteka, veličina kadra,
  `VERZIJA`).
- `naxos-film.mp4`: video (H.264, 900 × 900, 30 sl/s, bez zvuka, 2,1 MB), za sve preglednike.
- `naxos-film.webm`: isti video (VP9, 1,6 MB), za preglednike bez H.264.
- `naxos-film-pocetak.jpg`: prvi kadar filma. Stoji dok se video ne pokrene, pa nema skoka.
- `naxos-film-mirno.jpg`: završni prizor (bočica u prizoru). Stoji umjesto filma kad je na
  uređaju uključeno **Smanji pokrete** ili ušteda podataka, ili kad se video ne može pokrenuti
  (npr. iPhone u načinu štednje baterije).

## Kako radi na stranici

- `pocetna-chata.js` učita `film.js` (u odjeljku VANJSKE ANIMACIJE) kad pripremi početni
  ekran. Tada se preuzme samo prvi kadar (~60 KB). Video (~2 MB) se počne preuzimati tek kad
  kupac prvi put otvori chat, pa posjetitelji koji ne otvore chat ne troše podatke.
- Svako otvaranje chata pokreće film ispočetka. Kad se chat zatvori, film stane.
- `ponavljaj: false` u `pocetna-chata.js`: film stane na bočici u prizoru (`STANI_NA`).
- Ako se `film.js` ne učita, početni ekran ima animaciju od točkica.

## Zamjena videa

Video je izrađen iz fotografija `../razlijetanje/izvor.jpg` i `../naxos/izvor.jpg`: izrezani
sastojci, simulirana vrtnja limuna, karta dubine prizora za pomak kamere, zamućenje pokreta,
dubinska oštrina i svjetlo. Novi video mora ostati kvadratan, na crnoj podlozi i s crnim rubom,
a prvi i zadnji kadar moraju biti isti. Nakon zamjene datoteka povećaj `VERZIJA` u `film.js`,
da preglednici ne prikazuju stari video iz priručne memorije.
