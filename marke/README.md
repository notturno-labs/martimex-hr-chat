# Logotipi parfemskih kuća — zid logotipa od točkica

Na početnom ekranu chata (`pocetna-chata.js`) flakon se rastopi u izmaglicu, a iz nje se slože
logotipi parfemskih kuća, raspoređeni kao na slici `izvor.webp`: 24 logotipa u tri stupca i osam
redova (Chanel, Hermès, Guerlain … The Merchant of Venice, Lancôme, Estée Lauder). Logotipi su od
točkica boje pudera, kao natpis MARTIMEX, i slažu se jedan po jedan, slijeva nadesno. Vide se
četiri reda odjednom. Zatim se zid polako pomakne prema gore: gornji redovi se rastope u dim, a
donji se slože iz izmaglice. Preko svake stranice prijeđe meki zlatni sjaj. Na kraju se logotipi
rastope u izmaglicu, iz koje nastane pet Penhaligon's bočica.

- `izvor.webp`: slika s logotipima (bijelo na crnom, 877 × 1794 px).
- `izradi.py`: iz slike izradi `marke.js` (treba Python 3 s Pillow i NumPy). Pokreće se iz mape
  repozitorija naredbom `python3 marke/izradi.py`. Skripta sama nađe redove i stupce, izreže
  svaki logotip (najmanji okvir oko njega) i očisti šum kompresije. Sliku sprema kao sivu PNG
  sliku sa 16 razina (oko 50 KB) u `data:` adresi, pa je preglednik može pročitati bez CORS-a.
- `marke.js`: podaci za animaciju (`window.MX_MARKE`): slika i okvir svakog logotipa (ime, red,
  stupac, x, y, širina, visina). Ne mijenja se ručno.

## Kako se logotipi mijenjaju

1. Zamijeni `izvor.webp` novom slikom u istom stilu: bijeli logotipi na crnoj podlozi, u tri
   stupca. Broj redova može biti drukčiji.
2. U `izradi.py` upiši imena u `IMENA`, redom kao na slici (red po red, slijeva nadesno).
3. Pokreni `python3 marke/izradi.py`.

U animaciji je zid širok kao natpis MARTIMEX. Stranica ima `MAR_REDOVA` redova (4) i uvijek stane
u prostor animacije: ako je prozor nizak, zid se smanji.

## U animaciji (vidi `pocetna-chata.js`, odjeljak MARKE)

- `pocetna-chata.js` učita `marke.js` tek kad su ostali oblici gotovi. Točkice rasporedi po
  logotipima razmjerno njihovoj površini, a unutar logotipa prema svjetlini piksela, red po red.
  Raspoređivanje traje oko 0,1 s, u koracima kraćim od 30 ms. Ako se `marke.js` ne učita, krug
  je bez logotipa.
- Svaka točkica ima jedan atribut `aMar`: mjesto u zidu (x, y), red svog logotipa na stranici
  (logotipi se slažu jedan za drugim) i udio u logotipu (logotip se slaže slijeva nadesno).
  Atribut je u vlastitom spremniku, koji se doda kad su logotipi gotovi.
- U pojasevima po visini na stranici točkice dobiju ista mjesta kao slova natpisa i
  Penhaligon bočice. Zato se svaka stranica u njih prelije kratkim putem.
- Postavke su u `MX_POCETNA_POSTAVKE`: `marke` (true/false), `trajanje.nastanakMarki` (slaganje
  iz flakona) i `trajanje.marke` (koliko dugo se vide obje stranice, s pomakom zida između njih).
