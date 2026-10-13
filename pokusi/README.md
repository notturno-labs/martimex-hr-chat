# Pokusi — probne animacije početnog ekrana

Ovdje su probne verzije animacije, da se vidi kako bi izgledale prije nego išta dođe u pravi
chat. `pocetna-chata.js` (prava animacija) **nije mijenjan**, a ništa iz ove mape se ne učitava
na martimex.hr (`loader.js` učitava samo module iz popisa `MODULI`).

## Saturn — prsten bočica oko flakona (`saturn/`)

Xerjoff flakon u sredini, a oko njega se kao Saturnov prsten vrti dvanaest malih bočica.

- `saturn/pocetna-chata-saturn.js`: kopija `pocetna-chata.js` s dodanim prstenom (odjeljak
  **SATURN** i `PRSTEN_VS`). Ostatak animacije je isti: objekt → flakon s prstenom → logotipi →
  Penhaligon's bočice → natpis MARTIMEX.
- Što se vidi:
  - kad se flakon složi, iz njegova „ekvatora” se spiralom odvije zlatna prašina u prsten, a iz
    prašine se bočice jedna za drugom zgusnu (staklo se puni odozdo, čep zadnji) i kratko
    zasvijetle
  - dvanaest bočica šest oblika: mali flakon (osmerokut, čep sa šiljkom), okrugla sa zlatnom
    kuglom, četvrtasta s brušenim čepom (kao Chanel N°5), kap, amfora sa zlatnim prstenovima na
    vratu (kao J'adore) i valjak s okruglim srebrnim čepom (kao Byredo); tekućine su različitih
    boja (jantar, ruža, šampanjac, lila, med, kadulja, nebo, puder, rubin, breskva, dim, safir)
  - pojasevi prašine kao Saturnovi prstenovi: blijedi unutarnji, široki svijetli, tamna pukotina,
    vanjski i tanki prsten izvan bočica; prašina bliže flakonu kruži brže
  - prsten je nagnut prema nama (oko 17°) i malo zakrenut (desna strana viša), kao na slici
    Saturna; bočice stoje uspravno, polako se okreću oko svoje osi i lagano njišu
  - dubina: bočice sprijeda su veće i zakriju staklo flakona iza sebe, a iza flakona se prsten tek
    nazire; flakon baca sjenu na prsten, a prsten na flakon
  - kad se flakon rastapa u logotipe, bočice se (odozgo) rasprše u prašinu koja odleti niz stazu,
    a prsten se raširi i izblijedi
- Promjene u odnosu na `pocetna-chata.js` (vidi `git diff --no-index pocetna-chata.js
  pokusi/saturn/pocetna-chata-saturn.js`):
  - postavke `saturn`, `tocakaPrstena` (60 000 na računalu, 34 000 na mobitelu) i duži flakon
    (`trajanje.flakon`: 10,5 s umjesto 4,4 s: oko 4 s nastanak prstena, zatim kruženje)
  - odjeljak SATURN: oblici bočica (`MINI`), raspored (`PRSTEN_BOCICE`: oblik, boja, visina),
    pojasevi (`PRSTEN_POJASEVI`), nagib, zakret i brzina (`PRSTEN_*`), gradnja (`prstenKoraci`)
  - prsten je zaseban sloj s vlastitim programom (`PRSTEN_VS`) i spremnikom, crta se samo dok je
    flakon na ekranu (`nacrtajPrsten`); u glavnom shaderu je dodana samo sjena prstena na flakonu
  - `BAZA` pokazuje na mapu repozitorija (dvije razine iznad), a `window.__mxPokus` javlja
    snimaču kad su logotipi, bočice i prsten spremni
- Prije ubacivanja u pravu animaciju još treba: prevoditi shader prstena usporedo
  (`KHR_parallel_shader_compile`, kao glavni), provjeriti na pravim mobitelima i vratiti
  `BAZA` i oznake za snimanje.

## Kap esencije (`kap/`)

Druga ideja: zlatna kap padne u tamnu površinu poput zrcala, a iz tekućine nastane flakon.

- `kap/kap.html` + `kap/kap.js`: samostalna stranica s rasporedom početnog ekrana (CSS je
  prepisan iz `pocetna-chata.js`), WebGL kao i prava animacija (isto svjetlo, boje i niti
  točkica; geometrija flakona prepisana je iz `pocetna-chata.js`).
- Krug traje 15 s i ponavlja se:
  - iz iskrica se skupi zlatna kap, malo nabubri i padne (oko 1,9 s)
  - udar: kruna sitnih kapljica, iz sredine poskoči jedna kapljica i padne natrag; po površini se
    šire krugovi valova, a zlatna esencija se razlije s prvim valom
  - iz sredine se tekućina u vrtlogu digne i složi Xerjoff flakon (staklo odozdo, čep zadnji;
    od oko 3,2 do 6,3 s)
  - flakon stoji na površini i polako se okreće; površina ga zrcali (odraz se njiše s valovima),
    oko dna je svijetli rub tekućine, a niz staklo prijeđe odsjaj
  - od oko 11,2 s flakon se odozgo slije natrag u površinu, a valovi se smire
- Mogla bi biti početak animacije u chatu (umjesto AI objekta: flakon se digne iz tekućine, a
  ostatak kruga ide dalje kao sada) ili samostalna animacija drugdje na webshopu (npr. naslovnica).
  Trajanja i izgled su u `POSTAVKE` i konstantama na vrhu odjeljka POVRŠINA, KAP I FLAKON.

## Stvarno — pravi 3D umjesto točkica (`stvarno/`)

Isti početni ekran i isti krug (objekt → flakon → logotipi → Penhaligon's bočice → natpis
MARTIMEX), ali svaki oblik je pravi 3D predmet, osvijetljen kao u fotografskom studiju (tamna
soba sa svjetlosnim pločama, koje se zrcale u staklu i zlatu; iza predmeta je na zidu topla
svjetlosna mrlja, koja se lomi kroz staklo i obasja tekućinu).

- Predmeti:
  - AI objekt: kugla od tekućeg kroma s duginim odsjajem, kojoj se površina stalno valovito
    gužva (isti šum kao u točkicama)
  - Xerjoff flakon: fasetirano staklo koje lomi svjetlo (isti profil i presjek kao u točkicama),
    medena tekućina, debelo prozirno dno, polirani zlatni prsten i čep sa šiljkom, zlatna pločica
    s izdignutim znakom X i dvostrukim okvirom (polirano na brušenoj podlozi)
  - logotipi: tanka metalna folija boje pudera s reljefnim rubom, preko koje prijeđe odsjaj
  - Penhaligon's bočice: staklo s tekućinom svoje boje, papirnata etiketa (isti crtež kao u
    točkicama, omotana oko bočice), zlatni ovratnik i zlatna glava životinje
  - natpis MARTIMEX: puna slova od poliranog metala boje pudera (Cormorant Garamond 700)
- Prijelazi su isti kao u točkicama, ali predmet se rastapa s užarenim zlatnim rubom (po visini,
  uz malo šuma), s ruba se odvaja zlatna prašina koja otplovi do sljedećeg predmeta i nestane na
  njegovu rubu, a novi predmet nastaje od tog ruba: flakon odozdo (čep zadnji), logotipi jedan po
  jedan slijeva nadesno, bočice od sredine prema van (staklo odozdo, etiketa odozgo, glava iz
  ovratnika), slova jedno po jedno (malo prebace pa sjednu, kratko zasvijetle). Iz bočica se
  prašina najprije digne kao dim, a pri „Početak” sve odleti prema van i gore.
- Datoteke:
  - `stvarno/pocetna-chata-stvarno.js`: izgrađena skripta (uključuje three.js 0.186, oko 650 KB);
    ne mijenja se ručno
  - `stvarno/modeli.js`: zlatne glave (mreže), obrisi slova i mjere flakona (oko 1,6 MB); ne
    mijenja se ručno
  - `stvarno/izvor/`: izvor i alati
    - `animacija3d.js`: 3D prikaz, materijali i prijelazi
    - `sastavi-ulaz.py`: iz `pocetna-chata.js` složi `ulaz.js` (postavke, vremenski tijek, stil,
      početni ekran i veza s Voiceflowom ostaju isti; točkice se izbace)
    - `izradi-modele.mjs`: izradi `modeli.js` iz postojećih izvora: glave iz SDF modela u
      `penhaligons/glave/` (surface nets na mreži od 1,25 px, točke spuštene na plohu, mreža
      pojednostavljena na oko 22 000 trokuta, normale iz SDF-a), slova iz
      `fonts/cormorant-garamond-latin.woff2`, flakon iz `pocetna-chata.js`
    - gradnja: `npm install`, zatim `npm run modeli` (oko 3 min; treba Python s fonttools i
      brotli) i `npm run izgradi`
- Treba WebGL2; bez njega je, kao i inače, natpis MARTIMEX slovima. „Smanji pokrete”: miran 3D
  natpis.
- Prije ubacivanja u pravi chat još treba: provjeriti brzinu na pravim mobitelima (staklo s lomom
  svjetla i sjaj su zahtjevniji od točkica; na mobitelu je već slabija kvaliteta loma i manje
  prašine), odlučiti učitava li se three.js s GitHuba (sada je u skripti) i ukloniti oznake za
  snimanje (`window.__mxPokus`, `window.__mxSkok`).

## Pregled i snimanje

- `proba.html` glumi Voiceflowov prozor chata, pa se početni ekran vidi kao u pravom chatu:
  `proba.html?skripta=saturn/pocetna-chata-saturn.js`, `proba.html?skripta=stvarno/pocetna-chata-stvarno.js`
  (ili `?skripta=../pocetna-chata.js` za sadašnju animaciju). „Kap esencije” se otvara izravno:
  `kap/kap.html`.
- Kad je ova mapa na grani `main`, vidi se i na GitHub Pages:
  `https://notturno-labs.github.io/martimex-hr-chat/pokusi/proba.html?skripta=saturn/pocetna-chata-saturn.js`
  , `https://notturno-labs.github.io/martimex-hr-chat/pokusi/proba.html?skripta=stvarno/pocetna-chata-stvarno.js`
  i `https://notturno-labs.github.io/martimex-hr-chat/pokusi/kap/kap.html`.
- `snimi.js` snima video sličicu po sličicu (vrijeme animacije teče točno 1/fps po sličici, pa je
  video gladak i na sporom računalu). Treba ffmpeg i Playwright (Chromium sa SwiftShaderom,
  nikad `playwright install`). Iz mape `pokusi/`:
  - Saturn: `NODE_PATH=$(npm root -g) node snimi.js "skripta=saturn/pocetna-chata-saturn.js"
    saturn.mp4 od=0 do=22 w=460 h=920 dpr=2 cekaj=marke,pen,prsten`
  - Kap: `NODE_PATH=$(npm root -g) node snimi.js "x=1" kap.mp4 stranica=kap/kap.html do=15
    w=460 h=920 dpr=2 cekaj=kap`
  - Stvarno: `NODE_PATH=$(npm root -g) node snimi.js "skripta=stvarno/pocetna-chata-stvarno.js"
    stvarno.mp4 do=45 w=460 h=920 dpr=2 cekaj=stvarno`
  - `slika=8,14` umjesto videa spremi slike u tim trenucima (izlaz je tada mapa); uz `skok=1`
    (samo stvarno/) animacija odmah skoči na te trenutke
- Videi nisu u repozitoriju (veliki su); poslani su klijentu zasebno.
