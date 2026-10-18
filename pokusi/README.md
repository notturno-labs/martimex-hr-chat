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

## Kap esencije II — kap na niti, flakon iz tekućine (`kap2/`)

Dorada „Kapi esencije”: flakon, njegov odraz, svjetlo i boje su isti, nova je kap i način na
koji flakon nastaje i nestaje; sporo i mirno, kao reklama.

- `kap2/kap2.html` + `kap2/kap2.js`: samostalna stranica kao `kap/`; isti WebGL program, tri sloja
  (površina, kap s niti, flakon). `kap/` nije mijenjan.
- Krug traje 18,5 s i ponavlja se:
  - iz tame se spusti tanka nit svjetla, niz koju teku iskre; na njezinu vrhu raste viseća kap
    (okruglo dno, vrat prema niti), otežava i izduži se, vrat se stanji i kap se otkine (2,6 s);
    nit se povuče natrag u tamu
  - u padu se kap zaobli u kuglu istog obujma i zatitra; udar (3,15 s): bljesak, kruna kapljica u
    usporenom tempu, stup tekućine iz sredine koji otkine kapljicu, krugovi valova
  - površina se nadme, probije je šiljak čepa (oko 4,8 s) i flakon se uspravno izdigne iz tekućine
    (do 8,4 s); dio pod površinom se ne crta, uz staklo se penje svijetla vodena crta (meniskus),
    staklo je mokro i cijedi se u kapljicama, oko dna se uzdigne prsten površine
  - flakon stoji, polako se okreće (sprijeda je usred stajanja), zrcali se, preko njega prijeđe
    svjetlo (8,9 s)
  - od 12,9 s flakon tone natrag (do 16,8 s): površina se penje uz staklo, zadnji nestane šiljak,
    razlije se zadnji val i površina se smiri
- Trajanja su konstante na vrhu odjeljka POVRŠINA, KAP S NITI I FLAKON KOJI SE DIŽE IZ TEKUĆINE
  (`RAST0/1`, `VRAT0`, `OTKID`, `PADT`, `DIZ0/1`, `SJAJ0`, `TON0/1`). `window.__mxSkok(t)` skoči na
  trenutak (za slike).

## Izron — bez kapi: flakon izranja iz tekućine (`izron/`)

Dorada „Kapi esencije II” bez kapi. Flakon, odraz, svjetlo i boje su isti; priča je svedena na jedno:
flakon izranja iz tamne tekućine i vraća se u nju.

- `izron/izron.html` + `izron/izron.js`: samostalna stranica kao `kap/`; isti WebGL program, dva sloja
  (površina, flakon). `kap/` i `kap2/` nisu mijenjani.
- Krug traje 17 s i ponavlja se:
  - tamna, mirna površina; ispod nje se u sredini probudi zlatno svjetlo koje se nazire kroz tekućinu
    (0,6–2,4 s), a s ruba prema sredini dođu dva kruga valova (1,4 i 2,3 s) i stope se u sredini
  - površina se nadme, probije je šiljak čepa (oko 4,8 s) i flakon se uspravno izdigne iz tekućine
    (do 8,4 s): dio pod površinom se ne crta, uz staklo se penje svijetla vodena crta, staklo je mokro
    i cijedi se u kapljicama, oko dna se uzdigne prsten površine
  - flakon stoji, polako se okreće (sprijeda je usred stajanja), zrcali se, preko njega prijeđe
    svjetlo (8,9 s)
  - od 12,4 s flakon tone natrag (do 16,2 s): površina se penje uz staklo, svjetlo ispod površine
    zasja i ugasi se, zadnji nestane šiljak, razliju se zadnji valovi i površina se smiri
- Trajanja su konstante na vrhu odjeljka POVRŠINA I FLAKON KOJI SE DIŽE IZ TEKUĆINE (`SJAJ_ISPOD0/1`,
  `DIZ0/1`, `SJAJ0`, `TON0/1`, izvori valova u `UDARI`). `window.__mxSkok(t)` skoči na trenutak.

## Veo — predstavljanje ispod vela (`veo/`)

Nova priča oko istog flakona i iste tamne površine koja ga zrcali: otkrivanje ispod vela, kao kad se
predstavlja novi parfem. Veo je prava simulacija svilene tkanine, a točkice su mu u nitima tkanine,
kao flakon u nitima stakla.

- `veo/veo.html` + `veo/veo.js`: samostalna stranica kao `kap/`; dva WebGL programa (površina i
  flakon; veo), geometrija flakona prepisana iz `pocetna-chata.js`. `kap/`, `kap2/` i `izron/` nisu
  mijenjani.
- Krug traje 14 s i ponavlja se:
  - iz tame polako pada svileni veo ružičastog pudera (boja naglaska u naslovu), vijori i lovi svjetlo
  - zakači se za vrh čepa (oko 2,2 s), spušta se, obavija flakon i otkriva njegov oblik; kroz tkaninu
    se staklo i zlatna pločica tek naziru, a gdje rubovi vela dodirnu površinu šire se tihi krugovi
  - nevidljiva ruka uhvati veo pri vrhu (4,7 s) i povuče ga gore i natrag: svila klizi niz staklo,
    otkriveno staklo zasvijetli na rubu vela, veo odleti u tamu, preko flakona prijeđe svjetlo (6,9 s)
  - flakon stoji sam i zrcali se; kamera ga polako obilazi i primiče se, svjetlo se polako njiše pa
    odsjaji klize preko faseta; još jedan prelazak svjetla (11,2 s)
  - iz tame pada novi veo, prekrije flakon i krug kreće ispočetka. Pri prvom otvaranju flakon se ne
    vidi dok ga veo ne prekrije i otkrije.
- Simulacija (`napraviVeo`): mreža čestica (45 × 45 na računalu, 35 × 35 na mobitelu), XPBD u malim
  koracima (1/300 s, uvijek od početka kruga, pa je svaki krug isti bez obzira na brzinu računala):
  niti se ne rastežu, smik i savijanje su mekani (svila se priljubi uz oblik), zrak koči tkaninu
  okomito na plohu (lebdi i vijori), sudari s flakonom (tijelo vrtnje, udaljenost do plašta na mreži)
  i površinom s Coulombovim trenjem. Ruka drži nekoliko čestica i vodi ih po Bézierovoj krivulji;
  dok vuče, nijedna čestica ne smije biti dalje od ruke nego po tkanini. Oko 1 ms po sličici.
- Točkice vela (42 000 na računalu, 21 000 na mobitelu) su u nitima; svake sličice im se mjesto,
  normala i smjer niti izračunaju iz čestica. Svila ima odsjaj uzduž niti (Kajiya-Kay), svijetli
  porub i utapa se u tamu izvan svjetla. Flakon se ispod vela tek nazire (pokrivenost po 16 isječaka
  oko osi), a odraz u površini je kao u `kap/`.
- Postavke su na vrhu skripte: `POSTAVKE` (boje svile, broj točkica, trajanje kruga), `TIJEK`
  (kad ruka vuče, kad veo nestane, prelasci svjetla) i `VEO` (veličina, odakle pada, teža, otpor
  zraka, mekoća, trenje, mjesto hvata i put ruke). `window.__mxSkok(t)` skoči na trenutak (za slike).

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
  (ili `?skripta=../pocetna-chata.js` za sadašnju animaciju). „Kap esencije” (I i II), „Izron”, „Veo” i
  „Naxos” se otvaraju izravno: `kap/kap.html`, `kap2/kap2.html`, `izron/izron.html`, `veo/veo.html`,
  `naxos/naxos.html`.
- Kad je ova mapa na grani `main`, vidi se i na GitHub Pages:
  `https://notturno-labs.github.io/martimex-hr-chat/pokusi/proba.html?skripta=saturn/pocetna-chata-saturn.js`
  , `https://notturno-labs.github.io/martimex-hr-chat/pokusi/proba.html?skripta=stvarno/pocetna-chata-stvarno.js`
  , `https://notturno-labs.github.io/martimex-hr-chat/pokusi/kap/kap.html`
  , `https://notturno-labs.github.io/martimex-hr-chat/pokusi/kap2/kap2.html`
  , `https://notturno-labs.github.io/martimex-hr-chat/pokusi/izron/izron.html`
  , `https://notturno-labs.github.io/martimex-hr-chat/pokusi/veo/veo.html`
  i `https://notturno-labs.github.io/martimex-hr-chat/pokusi/naxos/naxos.html`.
- `snimi.js` snima video sličicu po sličicu (vrijeme animacije teče točno 1/fps po sličici, pa je
  video gladak i na sporom računalu). Treba ffmpeg i Playwright (Chromium sa SwiftShaderom,
  nikad `playwright install`). Iz mape `pokusi/`:
  - Saturn: `NODE_PATH=$(npm root -g) node snimi.js "skripta=saturn/pocetna-chata-saturn.js"
    saturn.mp4 od=0 do=22 w=460 h=920 dpr=2 cekaj=marke,pen,prsten`
  - Kap: `NODE_PATH=$(npm root -g) node snimi.js "x=1" kap.mp4 stranica=kap/kap.html do=15
    w=460 h=920 dpr=2 cekaj=kap`
  - Kap II: `NODE_PATH=$(npm root -g) node snimi.js "x=1" kap2.mp4 stranica=kap2/kap2.html do=18.5
    w=460 h=920 dpr=2 cekaj=kap2`
  - Izron: `NODE_PATH=$(npm root -g) node snimi.js "x=1" izron.mp4 stranica=izron/izron.html do=17
    w=460 h=920 dpr=2 cekaj=izron`
  - Veo: `NODE_PATH=$(npm root -g) node snimi.js "x=1" veo.mp4 stranica=veo/veo.html do=14
    w=460 h=920 dpr=2 cekaj=veo` (uski prozor je postavka za mobitel; za računalo npr. w=1280 h=860)
  - Stvarno: `NODE_PATH=$(npm root -g) node snimi.js "skripta=stvarno/pocetna-chata-stvarno.js"
    stvarno.mp4 do=45 w=460 h=920 dpr=2 cekaj=stvarno`
  - Naxos: `NODE_PATH=$(npm root -g) node snimi.js "x=1" naxos.mp4 stranica=naxos/naxos.html do=14
    w=460 h=920 dpr=2 cekaj=naxos`
  - `slika=8,14` umjesto videa spremi slike u tim trenucima (izlaz je tada mapa); uz `skok=1`
    (samo stvarno/) animacija odmah skoči na te trenutke
- Videi nisu u repozitoriju (veliki su); poslani su klijentu zasebno.
