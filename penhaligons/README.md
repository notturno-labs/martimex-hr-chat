# Penhaligon's Portraits — 3D bočice od točkica (skice)

Radna verzija, **još nije u animaciji** (`pocetna-chata.js` je ne učitava, a loader.js je ne dohvaća).
Bočice iz kolekcije Penhaligon's Portraits složene su od točkica u nitima, u istom stilu kao
Xerjoff flakon u animaciji.

- `shared.js`: zajedničko tijelo bočice (izmjereno s fotografije), zlatni ovratnik, etiketa s
  natpisom i rezanje SDF-a glave u vodoravne niti (`PEN.bocica(id, n)` vraća `{ poz, nor, vrsta }`)
- `glave/<id>.js`: zlatna glava životinje kao SDF (mjere u pikselima fotografije, y = 0 je dno
  bočice, glava počinje na vrhu ovratnika, y = 341)
  - `lady-blanche.js`: pantera, `mr-sam.js`: bik, `duchess-rose.js`: lisica,
    `lord-george.js`: jelen (dorađuje se), `changing-constance.js`: gazela (u izradi)
- `preview.html` + `render.js`: prikaz istim svjetlom i bojama kao u animaciji
  (`NODE_PATH=$(npm root -g) node render.js "ids=mr-sam&kut=0,-35,90,180&w=1400&h=700&S=330" izlaz.png`)
- `usporedi.py <id>`: obris glave sprijeda prema fotografiji (treba `ref/foto.jpg`, fotografija
  pet bočica 1500 × 2000 px, koja nije u repozitoriju)
- `skica.py <id>`: složi list sa skicom (fotografija, model sprijeda, glava izbliza, prava veličina)

Za ubacivanje u animaciju: oblik iz `PEN.bocica()` treba prenijeti u `pocetna-chata.js` kao novi
oblik u ciklusu (novi atributi u spremniku, uz pakiranje jer WebGL1 jamči samo 8 atributa).
