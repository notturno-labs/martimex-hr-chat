# Penhaligon's Portraits — 3D bočice od točkica (skice)

Radna verzija, **još nije u animaciji** (`pocetna-chata.js` je ne učitava, a loader.js je ne dohvaća).
Bočice iz kolekcije Penhaligon's Portraits složene su od točkica u nitima, u istom stilu kao
Xerjoff flakon u animaciji.

- `shared.js`: zajedničko tijelo bočice (izmjereno s fotografije), zlatni ovratnik, etiketa s
  natpisom i rezanje SDF-a glave u vodoravne niti (`PEN.bocica(id, n)` vraća `{ poz, nor, vrsta }`)
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

Za ubacivanje u animaciju: oblik iz `PEN.bocica()` treba prenijeti u `pocetna-chata.js` kao novi
oblik u ciklusu (novi atributi u spremniku, uz pakiranje jer WebGL1 jamči samo 8 atributa).
