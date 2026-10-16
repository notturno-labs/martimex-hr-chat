# Naxos — prizor s fotografije od točkica

Prizor s fotografije `izvor.jpg` (Xerjoff 1861 Naxos na stolu sa sastojcima mirisa) iscrtan u
istom stilu kao ostali oblici početnog ekrana chata (`pocetna-chata.js`): točkice u tankim
vodoravnim nitima (dvostruko gušćim nego kod ostalih oblika), isto svjetlo, iskre i treptaj, ali
svaka točkica u boji s fotografije: preslika fotografije u 3D. **U animaciji je** između flakona
i logotipa: flakon se rastopi u izmaglicu, iz nje nastane prizor
(predmet po predmet, najprije flakon), prizor miruje i polako se njiše, pa se odozgo rastopi u
dim iz kojeg se slože logotipi. `pocetna-chata.js` sam učita `naxos.js` iz ove mape (tek kad su
ostali oblici gotovi) i gradi prizor u malim koracima, prije logotipa i Penhaligon's bočica; ako
se ne učita, ako se fotografija u njemu ne dekodira ili grafička kartica nema devet vertex
atributa, krug je bez njega.
Uključuje se i podešava u `MX_POCETNA_POSTAVKE` (`naxos`, `trajanje.nastanakNaxosa`,
`trajanje.naxos`, `trajanje.rastapanjeNaxosa`, `tocakaNaxos`, `tocakaNaxosMobitel`).

## Što je u prizoru

Sve s fotografije, u bojama s fotografije (svaka točkica se projicira na fotografiju i uzme boju
s tog mjesta, stopljenu s bojom iz opisa predmeta; vidi niže). U zraku ničega nema: ni prašine ni
raspršenih točkica, samo predmeti, stol i pozadina.

- **flakon** (ista geometrija kao flakon u animaciji, generator `flakon` iz `pocetna-chata.js`):
  bijelo mutno staklo s toplijom lijevom stranom (odsjaj meda) i svijetlom desnom, svjetliji
  bridovi faseta, zlatni prsten i čep s okomitim prugama odsjaja, prozirni blijedožuti šiljak
  čepa, zlatna pločica sa znakom X i natpis NAXOS ispod nje (Cormorant Garamond iz `../fonts/`)
- **staklenka meda** lijevo: staklo s tri navoja i usnom na grlu, med do tri petine visine
  (sunce ga prosvjetljuje slijeva), površina meda s valićima gdje pada mlaz, kapi meda niz grlo
- **drvena žlica za med**: glava s pet obruča i oblim vrhom, odozdo ulivena medom, drška ukoso
  gore lijevo (izvan kadra se utopi); s dna glave **mlaz meda** u staklenku, koji u animaciji teče
- **limuni**: dva cijela (jajoliki, s bradavicom, kvrgava kora; prvi sa stabljikom i dva lista)
  i **prerezana polovica** s licem prema nama: kora, bijeli rub, kriške s opnama (radijalne niti)
- **list** pod drugim limunom desno
- **štapići cimeta**: tri smotana štapića (brazda smotka po duljini, spirala kore na krajevima),
  dva na platnu i jedan preko njih
- **mahune vanilije**: tri duge tamne, spljoštene i naborane mahune s uvijenim krajem
- **zrna tonke**: pet tamnih, naboranih, sjajnih zrna ispred flakona
- **lavanda**: tri položene grančice s klasovima cvjetića i stabljikama, raspršeni cvjetići
- **hrpa duhana** lijevo: tamni humak i preko njega uvijene trake usitnjenih listova
- **cvjetovi naranče** uz dno flakona: grančica s dva lista, četiri bijela cvijeta s pet latica
  i žutim prašnicima, pupoljci
- **laneno platno** s porubom (ukoso, desno preko ruba stola, gdje platno visi), valovito, s
  tkanjem u dva smjera; **drveni stol** (ploha lijevo i sprijeda, istrošeni brid, prednja
  stranica). Boju uzimaju točno s fotografije (mala kopija fotografije, 256 px, je u `naxos.js`),
  pa su na njima i sjene predmeta i sunčeva mrlja
- **pozadina**: kameni zid lijevo, maslina, tegle i polica desno, sve kao redovi niti u boji
  fotografije (kao da je zamućena fotografija iza prizora istkana od niti; kamen po kamen malo
  drukčije svjetline, svjetlije mrlje masline jače i krupnije), utopljena prema rubu prostora
  animacije. Pozadina je zalijepljena za ekran (ne okreće se s prizorom), pa predmeti pred njom
  pokazuju dubinu kad se prizor njiše

## Kako se gradi (`naxos.js`)

- Mjere su u svjetskim jedinicama `pocetna-chata.js` (flakon od −0,86 do 0,90). Kamera
  fotografije je izmjerena (visina ~2,9 jedinice iznad stola, udaljenost ~9, nagib ~12,7°), pa
  se svako mjesto zadaje pikselom fotografije (`izSlike(px, py, y)`: mjesto na vodoravnoj ravnini
  pod tim pikselom; `MJERE` na vrhu odjeljka PRIZOR). Prizor se u shaderu smanji (`KOMP` 0,62),
  podigne (`POMAK`) i nagne (`NAGIB`) i gleda s udaljenosti `CAM` (5,7, veće nego ostali oblici;
  `uCam`), pa složen pada točno na fotografiju (`preview.html?foto=0.5` to pokaže).
- Predmeti su od niti: tijela koja se vrte oko osi iz profila (`prsteni`: staklenka, med, prerez
  limuna), cijevi duž krivulja (`cijev`: glava i drška žlice, mlaz, cimet, vanilija, lavanda,
  porub, brid stola), plahte (`plahta`: listovi, latice, trake duhana, platno, stol) i SDF
  rezan u vodoravne (i okomite) niti (`rezSDF`: limuni, tonka, humak duhana, prašnici, pupoljci).
  Svi su generatori i popuštaju procesor svakih nekoliko niti, pa gradnja u chatu (u stankama
  preglednika) ne zakoči stranicu.
- **Zaklon**: točkice se zbrajaju bez dubine, pa što je iz kamere skriveno iza drugog predmeta
  (platno pod flakonom, pozadina iza limuna, limun iza polovice ...) nema točkica. Zakloni su
  jednostavna tijela (`zaklon`: flakon kao tijelo vrtnje, staklenka kao valjak do površine meda,
  limuni kao elipsoidi, žlica, cimet, vanilija i lavanda kao kapsule, humak, tonka, cvjetovi), a
  točkica se provjeri zrakom prema kameri (sphere tracing, `doZaklona`); vlastiti predmet se
  preskače. Pozadina ima meki rub zaklona (jačina pada 0,07 jedinice od ruba predmeta), pa se
  pri njihanju prizora uz predmete ne otvaraju crne pruge. Neprozirni predmeti (limuni, cimet,
  tonka, med, glava žlice, humak duhana) nemaju točkica na strani okrenutoj od kamere
  (`odKamere`), pa se kroz njih ne vidi stražnja strana.
- **Boje**: svaka točkica predmeta projicira se na fotografiju (`naSliku`) i uzme boju s tog
  mjesta (`fotoBoja`), stopljenu s bojom iz opisa predmeta (`BOJE`, sunce `osunceno`) u udjelu
  `FOTO_UDIO` (0,75; `preview.html?udio=`). Pretamni uzorak (točkica na rubu predmeta pada na
  tamnu pozadinu) se ne uzima. Pločica sa znakom X, natpis NAXOS i mlaz meda (teče) ostaju
  opisane boje. Fotografija već nosi svjetlo i sjene, pa svjetlo u shaderu tim točkicama boju
  mijenja manje.
- Razmak niti bira se tako da prizor ima zadani broj točkica (grubi prolaz brojanja, točni
  prolaz sa svakom četvrtom točkicom, pa gradnja; `gradiKoraci`). Jačina točkica u animaciji
  prati razmak niti na zaslonu kao kod flakona (gušće niti, slabije točkice).
- Točkica ima 8 brojeva: mjesto (xyz) i kod (normala oktaedarski 2 × 8 bitova, vrsta 4 bita,
  skupina 4 bita), boja (rgb) i kod tvari (svjetlo, stražnja strana, jačina; po 8 bitova).
  Vrste (`VRSTE`): obično, flakon, zlato, platno i stol (bez iskri), pozadina (zalijepljena za
  ekran, bez iskri, svjetlije mrlje krupnije), med, staklenka, pločica, mlaz (teče). Skupine
  (`SKUPINE`) su redoslijed nastanka: flakon, staklenka, žlica, limuni, cimet, vanilija, tonka,
  lavanda, duhan, cvjetovi, a platno, stol i pozadina nastaju zadnji (u njima su rupe gdje ih
  predmeti zaklanjaju, pa dolaze kad su predmeti već na mjestu).

## U animaciji (vidi `pocetna-chata.js`, odjeljak NAXOS)

- Prizor ima najviše točkica (`tocakaNaxos`: 420 000 na računalu, 230 000 na mobitelu; niti su
  mu zato oko dvostruko gušće nego kod ostalih oblika; platno i stol imaju rjeđe redove, jer se
  gledaju ukoso, pa više točkica ode na predmete). Dio
  (koliko ima svaki oblik) je u glavnom spremniku, s atributima `aNax` i `aNaxB`, i u prizor
  dolazi iz izmaglice (nastanak kao kod Penhaligon's bočica: najprije flakon, pa staklenka,
  žlica, limuni ... svaki predmet odozdo, a platno, stol i pozadina na kraju). Ostatak je u gustom sloju (`uSloj = 2`), koji se
  crta samo dok je prizor na ekranu: pojavi se kad onamo sjednu točkice glavnog sloja i nestane
  kad se one rastope.
- U pojasevima po visini na ekranu točkice dobiju ista mjesta kao slova natpisa, logotipi i
  bočice (`redX`), pa je prijelaz u logotipe kratak.
- Prizor se njiše ±0,04 rad oko okomite osi (`NAX_NJIHANJE`), prema mišu se nagne upola manje
  (`NAX_MIS`); niz flakon svakih 4,5 s prijeđe sunčev odsjaj; mlaz meda teče.
- Jačina točkica pada s gustoćom strmije nego kod ostalih oblika (gustoća^-0,8, `jacinaNax`),
  a platno i stol, koji se gledaju ukoso pa im se točkice na zaslonu zbiju, shader dodatno
  priguši; tako svijetle plohe ne izgore u bijelo.

## Pregled

`preview.html` prikaže sam prizor istim shaderom (boje, svjetlo, iskre): `n=` broj točkica,
`kut=` njihanje u stupnjevima, `foto=0.5` fotografija ispod točkica (provjera poklapanja),
`udio=` udio boje s fotografije u boji predmeta (0..1), `S=` px po jedinici (u animaciji ≈ 175),
`w=`, `h=`. Učitava `../pocetna-chata.js` (zbog
geometrije flakona, `window.MX_POCETNA_FLAKON`) i radi i s `file://`. Cijeli krug animacije s
prizorom vidi se u `../pokusi/proba.html?skripta=../pocetna-chata.js`.
