# Penhaligon's Portraits — 3D bočice od točkica

Bočice iz kolekcije Penhaligon's Portraits složene su od točkica u nitima, u istom stilu kao
Xerjoff flakon u animaciji. **U animaciji su** (`pocetna-chata.js`): između logotipa parfemskih
kuća (vidi `../marke/`) i natpisa MARTIMEX logotipi se rastope u izmaglicu, iz koje nastane svih
pet u nizu (staklo se puni odozdo, etiketa se otisne odozgo, zlatna glava izraste iz ovratnika);
bočice se polako okreću, pa se rastope u dim iz kojeg nastane natpis. `pocetna-chata.js` sam
učita `shared.js` i pet glava iz ove mape (tek kad su ostali oblici gotovi) i gradi ih u malim
koracima (`PEN.bocicaKoraci`); ako se ne učitaju, krug je bez njih. Uključuju se i podešavaju u
`MX_POCETNA_POSTAVKE` (`penhaligon`, `trajanje.nastanak`, `trajanje.penhaligon`).

- `shared.js`: zajedničko tijelo bočice (izmjereno s fotografije), zlatni ovratnik, etiketa s
  natpisom i rezanje SDF-a glave u vodoravne niti (`PEN.bocica(id, n)` vraća `{ poz, nor, vrsta }`;
  `PEN.bocicaKoraci` je isto kao generator, u koracima od nekoliko milisekundi)
  - rez glave (`rez`, `rezKoraci`) računa finu mrežu samo uz površinu (gruba mreža 4 × 4);
    dužine su iste kao s punom mrežom (`rez(..., true)`), a računa se 1,5–2,5 puta manje
  - tijelo: ravni bokovi koji se prema dnu jednoliko lagano sužavaju, ravno dno sa zaobljenim
    rubom (12 px), bez izbočine; debelo prozirno dno do y = 64, a granica tekućine je jedna nit
    po unutarnjem rubu (dno tekućine)
  - etiketa (`PEN.crtajEtiketu`): crtež prema etiketi The Baroness: crni okvir, PORTRAITS i
    PENHALIGON'S (veće P, sjena) u Cormorant Garamondu, crta s uvojcima, grb sa životinjom s
    čepa (`grb:` u modulu glave: pantera, bik, jelen, lisica, gazela), podnaslov i ime u
    sabijenom Jostu. Pisma su ona iz `../fonts/` (MX Cormorant, MX Jost), moraju biti učitana
    prije gradnje (`PEN.FONTOVI_ETIKETE`)
  - točkice etikete slažu se pravilno: svaki odsječak papira ima točkicu na oba kraja (oštar
    rub slova), retci su pomaknuti za zlatni rez razmaka (bez moiréa)
- `glave/<id>.js`: zlatna glava životinje kao SDF (mjere u pikselima fotografije, y = 0 je dno
  bočice, glava počinje na vrhu ovratnika, y = 341)
  - `lady-blanche.js`: pantera, `mr-sam.js`: bik, `duchess-rose.js`: lisica,
    `lord-george.js`: jelen, `changing-constance.js`: gazela (svih pet je gotovo)
- `preview.html` + `render.js`: prikaz istim svjetlom i bojama kao u animaciji
  (`NODE_PATH=$(npm root -g) node render.js "ids=mr-sam&kut=0,-35,90,180&w=1400&h=700&S=330" izlaz.png`;
  `mod=etiketa` nacrta samo ravnu etiketu). Za uvećane skice treba više točkica, da gustoća na
  zaslonu bude kao u animaciji: n ≈ 26 000 · (S / 175)²
- `usporedi.py <id>`: obris glave sprijeda prema fotografiji (treba `ref/foto.jpg`, fotografija
  pet bočica 1500 × 2000 px, koja nije u repozitoriju)
- `skica.py <id>`: složi list sa skicom (fotografija, model sprijeda, glava izbliza, prava veličina)

U animaciji (vidi `pocetna-chata.js`, odjeljak PENHALIGON'S PORTRAITS):
- bočice stoje u rasporedu V (`PEN_RASPORED`): u sredini sprijeda Lord George (0,95 veličine
  flakona), do njega Mr Sam i Duchess Rose (0,84), a vanjske Lady Blanche i Changing Constance
  (0,76) najdalje; sve su malo okrenute prema sredini. Glave se mogu okrenuti i same
  (`PEN_GLAVA`): pantera i lisica u tri četvrtine, bik tako da se vide rogovi i njuška, a
  gazela postrance (zakrivljeni rogovi), jer se tako životinja najbolje prepozna
- bočice imaju više točkica od ostalih oblika (`tocakaBocica`: 120 000 na računalu, 64 000 na
  mobitelu), podijeljenih po površini bočica na ekranu. Dio (koliko ima svaki oblik) je u
  glavnom spremniku, s atributom `aPen` (mjesto u bočici i kod: vrsta, redni broj bočice i
  normala u jednom broju), i u bočice dolazi iz izmaglice. Ostatak je u gustom sloju, koji se
  crta istim programom samo dok su bočice na ekranu: pojavi se na mjestu kad onamo sjednu
  točkice glavnog sloja i nestane kad se one rastope
- glave se režu u vodoravne niti gotovo istog razmaka kao niti stakla (`gustocaGlave: 0.85`),
  pa su od niti kao čep flakona. Etiketa ima rjeđe retke i manje točkica (`redEtikete`,
  `tezinaEtikete`), da bude miran dio bočice, a ne blještava bijela ploha
