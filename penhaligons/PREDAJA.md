# Predaja: ubacivanje Penhaligon's bočica u animaciju

**Stanje: ubačeno.** Klijent je između pokusnih animacija izabrao „nastanak” (bočice nastaju iz
izmaglice, svih pet u nizu), i to je sada dio ciklusa u `pocetna-chata.js`: objekt → flakon →
bočica → (nastanak) pet Penhaligon's bočica → natpis MARTIMEX. Broj točkica povećan je na
56 000 (računalo) i 32 000 (mobitel), da bočice u nizu budu dovoljno guste; jačina točkica
ostalih oblika se prilagodi broju (`gustoca`), pa izgledaju kao prije, samo finije. Priprema
bočica ide zadnja, u stankama preglednika (koraci do ~20 ms); ako se chat otvori prije nego su
gotove, krug ide bez njih, a uključe se od sljedećeg kruga. Ispod je izvorni sažetak.

**Kasnije:** obična bočica (treći oblik) je izbačena, a između flakona i Penhaligon's bočica
dodani su logotipi parfemskih kuća (vidi `../marke/README.md`). Krug je sada objekt → flakon →
logotipi → (nastanak) pet Penhaligon's bočica → natpis MARTIMEX. Logotipi i bočice uključe se čim
su spremni, ako je to prije kraja mirovanja flakona, a inače od sljedećeg kruga.

## Što postoji
- `penhaligons/shared.js`: `PEN.bocica(id, n)` vraća `{ poz, nor, vrsta }` za n točkica.
  - Mjere su u pikselima fotografije: y = 0 je dno bočice, x udesno, z prema gledatelju (prema etiketi).
  - Vrste točkica: 0 obojeno staklo s tekućinom, 1 prozirno debelo dno, 2 zlato (ovratnik i glava), 3 etiketa.
  - Boja stakla je po bočici, u `PEN.glave[id].staklo = [gore, dolje]`. Kako se boje i svjetlo
    računaju vidi se u shaderu u `penhaligons/preview.html`, koji je preslika osvjetljenja iz
    `pocetna-chata.js`: isti izrazi za dif/spe/rub/nebo/lice/dubina, a zlato je kao na flakonu.
- `penhaligons/glave/*.js`: pet glava (pantera, bik, jelen, lisica, gazela) kao SDF.
- Dorada prije animacije (klijent je tražio): dno bez izbočine (ravni bokovi, zaobljen rub),
  prozirno dno tamnije i malo obojeno tekućinom, granica tekućine kao jedna nit, nova etiketa
  po uzoru na original (vidi README.md). U shader animacije treba prenijeti i ovo iz
  `preview.html`:
  - etiketa (vrsta 3) nema iskrica (`iskra`), jačina 0,8, a jačina se množi s |nz| (×0,6 kad je
    etiketa okrenuta od nas), da papir gledan ukoso ne zasvijetli kao bijela crta;
  - prozirno dno (vrsta 1): boja `mix(srebro, donja boja stakla, 0.3)`, jačina 0,7.
  - Etiketa se crta pismima MX Cormorant i MX Jost: prije `PEN.bocica()` pričekati
    `document.fonts.load()` za `PEN.FONTOVI_ETIKETE` (kao što se čeka pismo natpisa).
- Pretvorba u svjetske jedinice animacije, isto kao flakon (visina 1,76):
  `K = 1.76 / 684`, `x_svijet = x_px * K`, `y_svijet = (y_px - 342) * K`, `z_svijet = z_px * K`.
  Bočica s jelenom visoka je 684 px. Ostale su niže, a dna im se poravnaju.
- Gradnja jedne bočice s 26 000 točkica traje oko 0,8–2 s procesora (mjereno u SwiftShader
  kontejneru). Najviše vremena odlazi na rezanje SDF-a u `rez()`. U animaciji se gradnja mora
  rasporediti po koracima s `pauza()`, kao kod natpisa (pripremiOblike), na primjer po
  pojasevima visine, da stranica ne zapne. Duže od 50 ms u komadu nije dobro.

## Kako je animacija složena (pocetna-chata.js)
- Ciklus oblika je objekt → flakon (Xerjoff) → bočica → natpis MARTIMEX → objekt.
  - `napraviTijek()`: `TRAJANJA`, `NATPIS = 3`.
  - Shader: `uSeg` je 0..3, a funkcije su `objekt()`, `flakon()`, `bocica()` i `natpis()`.
- Svaka točkica nosi sva svoja mjesta u jednom spremniku od 23 broja (`VELICINA_TOCKE`), a `spoji()` ih upisuje.
  - `ATRIBUTI`: aSph 3, aBot 3, aBotN 3, aTxt 3, aRnd 4, aFla 4, aFlaN 3, to je 7 atributa.
  - WebGL1 jamči samo 8 atributa. Za novi oblik (mjesto + vrsta, normala) treba pakirati.
    - Normala se može spremiti u 2 broja (oktaedarski).
    - Moguće je i zamijeniti postojeću drugu bočicu (aBot/aBotN) Penhaligon bočicom.
    - Moguće je i dijeliti atribut s nekim oblikom.
- `spoji()` spaja oblike u vodoravnim pojasevima, da su putevi točkica kratki.
- Gustoća: jačina točkica po obliku je u `JACINA`, a natpis se normalizira prema broju točkica (`jacinaSlova`).
- Postavke koje klijent mijenja su u `MX_POCETNA_POSTAVKE` (trajanja, boje). Komentari su na hrvatskom.

## Otvoreno pitanje za klijenta (pitati prije rada)
Kako se bočice pojavljuju:
- **(a) svih pet u nizu**, kao na fotografiji: svaka dobije 1/5 točkica, pa su detalji glava slabiji;
- **(b) jedna po jedna**, svaka se pretopi u sljedeću: bogatije, ali ciklus traje duže;
- **(c) samo jedna** (npr. jelen) umjesto ili uz postojeću bočicu.

## Provjera
Kao i dosad: testna stranica koja glumi Voiceflow prozor, Playwright sa SwiftShaderom
(`--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist --allow-file-access-from-files`,
`NODE_PATH=$(npm root -g)`, nikad `playwright install`). Treba snimiti kadrove svakog oblika i
prijelaza na 460×920, 400×700 i 375×640, provjeriti „smanji pokrete” i PerformanceObserver
'longtask' (nijedan korak pripreme ne smije trajati dulje od 50 ms).

Klijent spaja pull request sam, a zatim osvježi stranicu (GitHub Pages servira `main`).
