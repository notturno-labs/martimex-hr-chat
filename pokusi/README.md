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

## Tri note — priča o nastanku mirisa (`tri-note/`)

Nastavak „Kapi esencije”: flakon i njegov odraz u površini su isti, a oko njih je složena priča
kao u reklami za parfem.

- `tri-note/tri-note.html` + `tri-note/tri-note.js`: samostalna stranica kao `kap/`; isti WebGL
  program, četiri sloja (površina, kapi, flakon, miris).
- Krug traje 22,5 s i ponavlja se:
  - tri note: iz iskrica se jedna za drugom skupe tri kapi, svaka svoje boje i težine, i padnu
    svaka na svoje mjesto (svijetla citrusna oko 2,1 s, ružičasta cvjetna oko 3,8 s, teška
    jantarna oko 5,5 s); svaki udar ima krunu kapljica, kapljicu koja poskoči iz sredine i
    krugove valova koji se međusobno presijecaju, a svaka note se razlije u lokvicu svoje boje
    sa svijetlim rubom
  - stapanje (od 6,5 s): tekućina se zavrti (bliže sredini brže), tri boje se u spirali uviju
    jedna u drugu i uvuku prema sredini
  - flakon (od 6,8 s): iz vrtloga se diže kao u `kap/`, prazno staklo se zatim puni esencijom
    odozdo (8,3–11,2 s), a preko flakona prijeđe svjetlo kad je sprijeda (pločica sa znakom)
  - otvaranje (11,9 s): zlatni čep se podigne, malo nagne i lebdi iznad grla; iz flakona izađu
    tri trake mirisa u bojama svojih nota (12,6–19 s), dignu se, uviju oko flakona u sve široj
    spirali, spuste niz njega i rasprše
  - zatvaranje (16 s): čep se spusti natrag i svjetlo još jednom prijeđe preko flakona; flakon se
    cijelo vrijeme polako okreće i zrcali u površini
  - kraj (od 19,5 s): flakon se odozgo slije natrag u površinu, val se razlije i krug kreće
    ispočetka
- Trajanja su konstante na vrhu odjeljka POVRŠINA, TRI KAPI, FLAKON NA POVRŠINI I MIRIS (`KAPI`:
  mjesto, trenutak i veličina svake kapi; `VRTLOG0`, `FLAKON0`, `PUNI0/1`, `SJAJ0/1`, `CEP0/1`,
  `MIRIS0`, `KRAJ0`), boje nota u `POSTAVKE.boje.note`. `window.__mxSkok(t)` skoči na trenutak
  (za slike).

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

## Naxos — mrtva priroda od točkica (`naxos/`)

Prizor s fotografije Xerjoff 1861 Naxos (`naxos/izvor.webp`), gledan sprijeda kao na njoj i iscrtan
u istom stilu kao `pocetna-chata.js`: flakon stoji na jantarnom bloku na drvenom stolu obasjanom
suncem s prozora, a oko njega su sastojci mirisa. Sve je od točkica u tankim vodoravnim nitima, s
istim iskrama i treptajem i istom gustoćom niti na zaslonu kao flakon u animaciji, ali svaki predmet
ima boje s fotografije, predmeti su neprozirni, a svjetlo je kao na fotografiji.

- `naxos/naxos.html` + `naxos/naxos.js` (motor) + `naxos/predmeti/*.js` (jedan predmet po datoteci):
  samostalna stranica s rasporedom početnog ekrana (CSS je prepisan iz `pocetna-chata.js`); ne treba
  Voiceflow ni martimex.hr. Flakon je prepisan iz `pocetna-chata.js` (bjelokosno mutno staklo s
  medenom tekućinom, čep, prsten i pločica od ružičastog zlata, kao na fotografiji). Tehnički opis
  motora i API za predmete je u `naxos/README.md`.
- Predmeti: saće sa šesterokutnim stanicama na tanjuru, tri štapića cimeta, bergamot s peteljkom i
  listom, buket lavande u kamenoj vazi vezan uzicom, prerezani limun, zdjela meda s drvenom žlicom,
  dva cvijeta jasmina, tri mahune vanilije, četiri zrna tonke, list duhana, brašno prosuto po stolu,
  prašina koja lebdi u sunčevu svjetlu, drveni stol sa sjenama predmeta i zid s prozorom iza.
- Neprozirnost: prije crtanja točkica upiše se dubina prednjih ploha (svaka točkica kao malo veći
  neprozirni krug), pa se vide samo točkice prednjih ploha, a što je iza predmeta zaklonjeno je;
  flakon tako izgleda pun, zdjela pokazuje samo prednju stranu i unutrašnjost (postavka `neprozirno`).
- Svjetlo kao na fotografiji: sunce s prozora straga lijevo (topli odsjaj, svijetli rub na strani
  sunca, meke sjene na stolu pomaknute od prozora i kontaktne sjene uz predmete) i meko svjetlo
  sprijeda. Kamera gleda sprijeda, malo odozgo (oko 19°), gotovo bez perspektive, kao nacrt;
  položaji su izmjereni s fotografije (1 px ≈ 0,0035 jedinice) i stisnuti po širini, da prizor
  stane u uski prozor chata (`pogled` u postavkama: nagib, udaljenost kamere, veličina, pomak, njihanje).
- Kako se gradi: tijela koja se vrte oko osi iz profila (`prsteni`), cijevi duž krivulja (`cijev`),
  plahte (`plahta`) i SDF rezan u vodoravne niti (`rezSDF`); vodoravne plohe režu se i okomito, pa su
  i one od niti. Ispod predmeta stol i tanjur nemaju točkica (tlocrti predmeta).
- Što se vidi: prizor se složi iz izmaglice (predmet po predmet, flakon zadnji, oko 3,4 s), zatim
  miruje: tek se malo njiše, na računalu se nagne prema mišu, točkice trepere, niz flakon svakih 9 s
  prijeđe sunčev odsjaj, a prašina polako tone. „Smanji pokrete”: miran prizor.
- Postavke su u `POSTAVKE` na vrhu `naxos.js`: boje predmeta, broj točkica (`tocaka` 240 000 na
  računalu, `tocakaMobitel` 130 000; razmak niti se bira tako da prizor ima toliko točkica, a jačina
  točkica se tome prilagodi), pojava, pogled, neprozirnost, sjene, pozadina, nagib prema mišu.
- Pregled pojedinog predmeta: `naxos/naxos.html?samo=limun` (više: `samo=limun,zdjela`; `stol=1`
  doda stol i pozadinu), `zoom=2.5` (uvećano, u sredini), `kut=35` (okret prizora u stupnjevima),
  `nagib=19`. `naxos/snimka.js` snimi sliku: `NODE_PATH=$(npm root -g) node snimka.js
  "samo=limun&zoom=2&stol=1" limun.png t=9` (iz mape `naxos/`).
- Gradnja traje oko 2 s na računalu (grubi i točni prolaz brojanja, pa gradnja), u malim koracima,
  pa se prizor pokaže kad je gotov. Konzola ispiše broj točkica i razmak niti.

## Pregled i snimanje

- `proba.html` glumi Voiceflowov prozor chata, pa se početni ekran vidi kao u pravom chatu:
  `proba.html?skripta=saturn/pocetna-chata-saturn.js`, `proba.html?skripta=stvarno/pocetna-chata-stvarno.js`
  (ili `?skripta=../pocetna-chata.js` za sadašnju animaciju). „Kap esencije”, „Tri note” i „Naxos” se
  otvaraju izravno: `kap/kap.html`, `tri-note/tri-note.html`, `naxos/naxos.html`.
- Kad je ova mapa na grani `main`, vidi se i na GitHub Pages:
  `https://notturno-labs.github.io/martimex-hr-chat/pokusi/proba.html?skripta=saturn/pocetna-chata-saturn.js`
  , `https://notturno-labs.github.io/martimex-hr-chat/pokusi/proba.html?skripta=stvarno/pocetna-chata-stvarno.js`
  , `https://notturno-labs.github.io/martimex-hr-chat/pokusi/kap/kap.html`
  , `https://notturno-labs.github.io/martimex-hr-chat/pokusi/tri-note/tri-note.html`
  i `https://notturno-labs.github.io/martimex-hr-chat/pokusi/naxos/naxos.html`.
- `snimi.js` snima video sličicu po sličicu (vrijeme animacije teče točno 1/fps po sličici, pa je
  video gladak i na sporom računalu). Treba ffmpeg i Playwright (Chromium sa SwiftShaderom,
  nikad `playwright install`). Iz mape `pokusi/`:
  - Saturn: `NODE_PATH=$(npm root -g) node snimi.js "skripta=saturn/pocetna-chata-saturn.js"
    saturn.mp4 od=0 do=22 w=460 h=920 dpr=2 cekaj=marke,pen,prsten`
  - Kap: `NODE_PATH=$(npm root -g) node snimi.js "x=1" kap.mp4 stranica=kap/kap.html do=15
    w=460 h=920 dpr=2 cekaj=kap`
  - Tri note: `NODE_PATH=$(npm root -g) node snimi.js "x=1" tri-note.mp4
    stranica=tri-note/tri-note.html do=22.5 w=460 h=920 dpr=2 cekaj=triNote`
  - Stvarno: `NODE_PATH=$(npm root -g) node snimi.js "skripta=stvarno/pocetna-chata-stvarno.js"
    stvarno.mp4 do=45 w=460 h=920 dpr=2 cekaj=stvarno`
  - Naxos: `NODE_PATH=$(npm root -g) node snimi.js "x=1" naxos.mp4 stranica=naxos/naxos.html do=14
    w=460 h=920 dpr=2 cekaj=naxos`
  - `slika=8,14` umjesto videa spremi slike u tim trenucima (izlaz je tada mapa); uz `skok=1`
    (samo stvarno/) animacija odmah skoči na te trenutke
- Videi nisu u repozitoriju (veliki su); poslani su klijentu zasebno.
