# Naxos — mrtva priroda od točkica

Prizor s fotografije Xerjoff 1861 Naxos (`izvor.webp`) u stilu početne animacije chata
(`../../pocetna-chata.js`): točkice u tankim vodoravnim nitima, iste iskre i treptaj, ista gustoća
niti na zaslonu, ali boje predmeta s fotografije, pogled sprijeda kao na njoj i neprozirni predmeti.
Opis za korisnika je u `../README.md` (odjeljak Naxos); ovdje je tehnički opis za rad na predmetima.

## Datoteke

- `naxos.html`: stranica s rasporedom početnog ekrana; učitava `naxos.js` i sve `predmeti/*.js`.
- `naxos.js`: motor. Postavke (`POSTAVKE`: boje, broj točkica, pogled, neprozirnost, sjene,
  pozadina), pomoćne funkcije, flakon prepisan iz `pocetna-chata.js`, graditelji niti, tlocrti i
  sjene, popis predmeta, gradnja u koracima, shader i animacija. Sve što predmetima treba izloženo
  je kao `window.NAXOS` (vidi niže).
- `predmeti/<ime>.js`: jedan predmet po datoteci. Svaki se prijavi s
  `NAXOS.predmet('ime', { red, gradi })`; `red` je redoslijed gradnje (stol 200 i pozadina 210 su
  zadnji, jer trebaju tlocrte ostalih), `gradi(S)` je **generator** koji skupljaču `S` daje niti.
- `snimka.js`: slika stranice u zadanom trenutku (Playwright, Chromium sa SwiftShaderom; nikad
  `playwright install`). Iz ove mape:
  `NODE_PATH=$(npm root -g) node snimka.js "<parametri>" izlaz.png [t=9] [w=460] [h=920] [dpr=2]`
  - `""` = cijeli prizor kao na mobitelu (460 × 920, dpr 2); `w=1100 h=900 dpr=1` kao na računalu
  - `samo=limun` = samo taj predmet, u sredini slike, u pravoj veličini; `samo=limun,zdjela` više njih;
    `zoom=2.5` uvećano (niti ostaju jednako guste na zaslonu); `stol=1` doda stol s pozadinom (i sjene);
    `kut=35` okret prizora oko okomite osi u stupnjevima (pogled sa strane); `nagib=19` nagib kamere
  - konzola ispiše `[Martimex] Naxos: N točkica, razmak niti …, … s gradnje`; `pageerror` znači grešku
  - sliku se gleda alatom za čitanje slika; fotografija za usporedbu je `izvor.webp`

## Koordinate i mjere

Svjetske jedinice `pocetna-chata.js`: flakon je od y = −0,86 (dno) do 0,90 (vrh čepa), visok 1,76,
širok oko 0,8; x udesno, y gore, z prema nama (kameri). Stol je ravnina y = `NAXOS.STOL_Y` (−1,05);
jantarni blok (`NAXOS.BLOK`: središte (0,04, 0,17), pola stranice 0,8, visina 0,19, zakrenut 0,65 rad)
leži na stolu, a flakon na bloku sa središtem u (0, 0). Kamera gleda sprijeda, malo odozgo (19°),
gotovo bez perspektive; 1 px fotografije ≈ 0,0035 jedinice. Prizor je dubok: bergamot i limun straga
(z ≈ −2,1 i −2,4), vaza z ≈ −1,7, tanjur sa saćem z ≈ −1,15 (x ≈ −1,1), zdjela meda (0,88, −1,0),
jasmin (0,42, −0,7) i (1,16, −0,34), cimet od (−1,37, 0,25) do (−0,44, −1,58), tonka oko (0,8..1,0,
1,1..2,1), vanilija od (−1,2, 0,24) do (0,1..0,5, 2,4..2,7), list duhana oko (−1,16, 2,2), zid z = −3,7.
Položaji su stisnuti po širini (× 0,85 prema fotografiji) da prizor stane u uski prozor chata.

## Niti i točkice

Razmak niti je `S.korak` (oko 0,021 na računalu, 0,025 na mobitelu); točkice na niti su
`NAXOS.OMJER` (2,3) puta gušće. `gradi(S)` se za cijeli prizor poziva **tri puta**: grubi prolaz
brojanja (`S.broji === 1`, razmak 0,05, točkice se ne računaju), točni prolaz brojanja
(`S.broji === 2`, točkice se računaju ali ne spremaju) i gradnja (`S.broji === 0`). Zato gradnja
mora biti deterministička (slučajni brojevi samo iz `NAXOS.slucajno(sjeme)`), bez stanja između
poziva, a sve što skupljač ne zove (npr. izravno `S.dodaj`) treba u načinu brojanja samo pribrojiti
`S.n` (vidi `predmeti/flakon.js`). U pregledu (`samo=`) je samo jedan prolaz.

Svaka točkica ima: mjesto `T.x, T.y, T.z`, normalu `T.nx, T.ny, T.nz`, boju `T.col` ([r, g, b]
0..1), tvar `T.lit` (0..1 koliko svjetlo mijenja boju; 1 za sjajne plohe, 0,3..0,5 za papir i mat),
`T.back` (tama stražnje strane 0..1), `T.jak` (jačina, 1 = obično), `T.vrsta` (`NAXOS.vrste`:
OBICNO, STAKLO_F i ZLATO_F samo za flakon, STOL, PRASINA, BRASNO, POZADINA) i `T.odgoda` (0..1,
kad se pojavi: stol 0, blok 0,1, predmeti na stolu 0,2..0,5, flakon 0,55..0,85, lavanda 0,75..0,98).
`NAXOS.tvar(T, col, lit, back, jak, vrsta, odgoda)` sve to upiše i vrati `true`; funkcija boje vrati
`false` kad točkica ne treba (npr. zaklonjena).

## Graditelji (`NAXOS.*`)

- `prsteni(S, profil, o)`: tijelo koje se vrti oko osi y. `profil` = `[[y, r, tvar], …]` u vlastitim
  koordinatama, obilazi tijelo tako da mu je unutrašnjost slijeva: dno prema van, bok prema gore,
  vrh prema sredini (normala je tada prema van). `o.M` matrica okreta, `o.pomak` [x, y, z],
  `o.boja(T, y, r, kut, ny, tvar)`, `o.tezina(y, r, ny, tvar)` (gustoća prstena; vodoravne plohe
  gledane s ruba 0,5..0,7).
- `cijev(S, c, o)`: cijev duž krivulje `c(t)` → [x, y, z] (t 0..1). `o.r(t, kut)` polumjer (može
  ovisiti o kutu: brazde, cvjetići), `o.spljosti` (visina presjeka prema širini), `o.boja(T, t,
  kut, r)`, `o.tezina(t)`. `kvadratna(A, C, B, t)` je Bézierova krivulja za `c`.
- `plahta(S, F, o)`: plahta `F(u, v)` → [x, y, z]; niti su na stalnom v (duž u), razmaknute oko
  `S.korak · o.razmak`. `o.boja(T, u, v)`, `o.tezina`, `o.gore` (normala prema gore).
- `rezSDF(S, sdf, okvir, o)`: predmet zadan SDF-om `sdf(x, y, z)` (< 0 unutra) u okviru
  `[x0, x1, y0, y1, z0, z1]`: vodoravni rezovi daju niti po okomitim i kosim plohama, okomiti
  rezovi (ravnine z) niti po vodoravnim plohama (`o.osi`: 'y', 'z' ili 'yz'; `o.bezDna` preskače
  donje plohe). `o.boja(T)`, `o.h` fina mreža (zadano 0,45 koraka; 0,3 za sitne oblike), `o.tezina`.
  SDF pomoćnici: `sdElipsoid(x, y, z, rx, ry, rz)`, `sdKutija(x, y, z, hx, hy, hz, r)`,
  `sdKapsula(x, y, z, a, b, r)`, `smin(a, b, k)`, `uLokalno(M, c)` (svjetske → vlastite koordinate),
  `sace2D(u, v, R)`. SDF se zove vrlo često: neka bude jeftin (bez alokacija u petlji).
- `S.nit(f, duljina, tezina, zatvoreno)`: vlastita nit; `f(u, T)` ispuni T za udio u.
  `S.rasap(n, f)`: raspršene točkice (n uz razmak 0,02; `f(T, rnd)`).
- Pomoćno: `sat, lerp, glatko, korakG(a, b, x)` (smoothstep), `mijesaj(a, b, t)`, `puta(c, k)`,
  `zasiti(c, k)`, `norm3, kriz`, `sum(x, y, z)` (šum −1..1), `pjega(x, y, z, k)` (šum 0..1 na
  mjerilu k), `hash3`, `slucajno(sjeme)`, `matrica(kutY, nagibX, valjanjeZ)`, `premaSmjeru(d)`,
  `primijeni(M, v)`, `boja01('#rrggbb')`. Boje iz postavki: `NAXOS.C.ime` ([r, g, b]) i `NAXOS.B.ime`.
- Tlocrti: `zaklonKrug(x, z, r, h)`, `zaklonKutija(x, z, kut, hx, hz, h)`,
  `zaklonKapsula(ax, az, bx, bz, r, h)`, `zaklon(f, h)` (f(x, z) → true unutar; h visina predmeta):
  ispod predmeta stol i tanjur nemaju točkica, a stol uz predmet dobiva sjenu (`sjena(x, z)`).
  `uZaklonu(x, z)` je upit (predmet koji na sebi nosi drugi ga koristi za svoj vrh).

## Svjetlo i izgled

Shader osvjetljava kao na fotografiji: sunce s prozora straga lijevo (topli odsjaj, sjena, svijetli
rub na strani sunca) i meko svjetlo sprijeda; `lit` kaže koliko to mijenja boju. Predmeti su
neprozirni (dubinski predprolaz): vide se samo točkice prednjih ploha, pa boju i oblik treba dati
prednjim plohama. Točkice se zbrajaju (svjetlo), pa guste niti bljesnu u bijelo: za svijetle plohe
(papir, krem keramika, prerez limuna) uzeti `jak` 0,6..0,9 i `lit` 0,4..0,6, za tamne sjajne (vanilija,
tonka) `lit` 1 i jaču boju. Vodoravne plohe gledane s ruba su na zaslonu gušće: rjeđe niti
(`tezina` 0,5..0,7).
