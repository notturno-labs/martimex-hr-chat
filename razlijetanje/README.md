# Razlijetanje — fotografija sastojaka koja se razleti i ponovno složi

Animacija početnog ekrana chata kad je u `pocetna-chata.js` postavka `animacija: 'razlijetanje'`
(zadana je `'film'`, vidi `../film/README.md`). Umjesto animacije od točkica prikazuje se fotografija sastojaka mirisa `izvor.jpg`
(limun s listovima, med, saće, kora limete, bijeli cvjetovi) izrezana u ~40 komada, na crnoj
podlozi početnog ekrana.

## Što se vidi

1. **Dolazak** (1,9 s): komadi doplove iz tame, mutni, i slože se u prizor s fotografije.
2. **Mirovanje** (1,7 s): prizor lebdi i lagano diše.
3. **Eksplozija** (0,25 s + 4,6 s): prizor se malo stisne, pa se komadi razlete prema van, uz
   trzaj kamere i prskanje kapi meda. Prve tri desetinke sekunde su brze (komadi ostavljaju trag), a zatim
   komadi u usporenoj snimci lebde, okreću se, a listovi i latice se prevrću. Kamera se malo
   odmakne. Bliži komadi su veći i mutni, kao kod objektiva, a dalji su tamniji.
4. **Povratak** (1,5 s): komadi se vrate i složeno sjednu na mjesto.
5. Krug (mirovanje → eksplozija → povratak) se ponavlja dok je početni ekran otvoren.

Nakon **POČETAK** komadi odlete prema van i nestanu, dok se chat otvara u krugu koji se širi
od poziva. Na računalu se komadi pomiču prema mišu (bliži više, pa se vidi dubina).
S postavkom uređaja **Smanji pokrete** prikazan je samo složeni prizor, bez pokreta.

## Datoteke

- `razlijetanje.js`: modul (≈ 300 KB). Na vrhu su opis i **POSTAVKE pokreta** (trajanja,
  koliko daleko komadi lete, broj kapi meda, veličina prizora). U njemu je i slika svih
  komada (WebP, oštra i mutna inačica svakog komada) u `data:` adresi, pa se sve učita
  jednom datotekom i bez CORS-a.
- `izvor.jpg`: fotografija iz koje su komadi izrezani.

## Kako su komadi izrezani

- Pozadina fotografije je glatki sivi gradijent, pa je svaki predmet odvojen od nje po boji i
  svjetlini. Komadi su odvojeni po rubovima boja, od ručno zadanih točaka u svakom predmetu.
- Limun je na fotografiji djelomično prekriven korom limete i laticom. Ti dijelovi su
  dopunjeni teksturom samog limuna, pa je limun cijeli kad se ostali komadi odmaknu.
- Rubovi su očišćeni od svijetle pozadine fotografije: boja ruba je boja unutrašnjosti
  komada, a svjetli obrub je uklonjen. Zato na crnoj podlozi nema bijelih rubova.
- Susjedni komadi se malo preklapaju, pa u složenom prizoru između njih nema tamnih šavova.

## Ugradnja (pocetna-chata.js)

- `MX_POCETNA_POSTAVKE.animacija`: `'razlijetanje'` ili `'tocke'` (animacija od točkica:
  objekt, flakon, prizor Naxos, logotipi, Penhaligon's bočice, natpis MARTIMEX).
- `napraviRazlijetanje` (odjeljak RAZLIJETANJE) ima isti oblik kao `napraviAnimaciju`
  (pripremi, velicina, ispocetka, stani, mis, izlaz, unisti). Modul se učita pri pripremi
  početnog ekrana. Ako se ne učita, početni ekran ima animaciju od točkica. Ako preglednik
  ne može dekodirati sliku, prikaže se natpis MARTIMEX slovima.
- `velicinaAnimacije` i `ponavljaj` vrijede i ovdje (`ponavljaj: false` → nakon jednog kruga
  prizor ostane složen).
- Razleteni komadi uvijek stanu u prozor chata: na uskom prozoru (mobitel) razlijetanje se
  razmjerno smanji.

## Pregled

`../pokusi/proba.html?skripta=../pocetna-chata.js` prikaže početni ekran kao u pravom chatu.
