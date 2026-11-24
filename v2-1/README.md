# v2-1 – Marti chat 2.0, 1. dio

Ukratko: Marti chat 2.0, 1. dio – točno ono što ide na martimex.hr (kartice artikala, izgled chata i gumba)

U ovoj mapi je 1. dio verzije 2.0 Marti chata: nove kartice artikala, novi izgled chata i novi izgled gumba koji otvara chat. Gumbi „Pitaj Marti” (2. dio) nisu u ovoj mapi.

## Što je unutra

| Datoteka | Što radi |
|---|---|
| `loader.js` | jedini file koji stranica učitava; on učita sve ostalo iz ove mape i spoji chat na Voiceflow projekt „v2 - prvi dio” |
| `kartica-artikla.js` | kartice artikala: svijetlosiva ploča sa slikom, marka, naziv, vrsta i veličina, cijena (akcija, promo kod), tri osobine s ikonama (kod parfema miris · kada nositi · trajnost, sa sitnom oznakom ispod) i crni gumb „Pogledaj proizvod”; više proizvoda stoji u vodoravnom vrtuljku (listanje prstom, mišem, strelicama ili točkicama) |
| `gumb-chata.js` | izgled gumba koji otvara chat |
| `jedan-ekran.js` | izgled prozora chata „Jedan ekran” |
| `cekanje-odgovora.js` | perlice dok Marti piše odgovor |
| `pozdrav-bez-tipkanja.js` | Martin pozdrav izroni bez tipkanja |
| `fonts/` | fontovi Jost (chat), Nunito i Playfair Display (kartice artikala); licenca SIL OFL 1.1 |

Moduli su kopije 1:1 modula iz korijena repozitorija na dan 10. 11. 2026. (commit `bc90cc0`); od tada se ova mapa i korijen mijenjaju odvojeno. Kartica artikla ovdje ima novi izgled od 20. 11. 2026. (bez opisa, s tri osobine); `kartica-artikla.js` u korijenu još je stara kartica.

## Kartice artikala

Kartice crta `kartica-artikla.js` iz poruke `ext_product_card` koju šalju Voiceflow funkcije kartica („Prikazi parfem card”, „Prikazi artikl card - Preporuka Ostalo”, „Prikazi artikl card - Trazilica”). Kartica nema opis artikla. Tri osobine ispod cijene piše Marti (polje `osobine`, funkcija ga šalje kao `features`). Tražilica osobine ne šalje, pa su njezine kartice bez tog reda.

**Širina:** poruka s karticama zauzme cijelu širinu razgovora, od lijevog ruba avatara do desnog ruba poruka, pa uz nju nema avatara (pravilo je u `jedan-ekran.js`). Jedna kartica je široka kao razgovor (najviše 400 px), npr. 335 px na mobitelu širokom 375 px. Vrtuljak ide do rubova prozora, kao Voiceflowov: prva kartica stoji uz lijevi rub razgovora, a sljedeća proviruje do desnog ruba prozora (319 px na mobitelu širokom 375 px).

**Parfemi** (playbook „Preporuka - Parfemi”): tri podatka, uvijek istim redom – **miris · kada nositi · trajnost**, npr. „🌊 Svjež i morski”, „☀️ Ljeto i ured”, „🪶 Nježno uz kožu”. Opis je kratak, običnim riječima, bez nabrajanja nota, i uvijek pozitivan. Svaki podatak počinje emojijem iz palete; kartica emoji ne prikazuje, nego umjesto njega nacrta tanku crnu ikonu (crta 1,33 px, bez boja). Ispod ikone je podatak tamnim polumasnim slovima, a ispod njega sitna siva oznaka „Miris”, „Kada nositi”, „Trajnost” (oznake upisuje kartica, u istoj su liniji u sva tri stupca).

Paleta je u `alati/ikone-osobina.mjs`. Kartica prepoznaje 141 emoji (86 ikona), a Marti u playbooku vidi kraći popis od 38 najvažnijih (svaki emoji u playbooku je tekst koji se plaća u svakom pozivu modela). Alat iz paketa Tabler Icons upiše ikone u `kartica-artikla.js` (između oznaka „IKONE PALETE”) i ispiše kraći popis za playbook. Novi emoji: dopiši ga u paletu u alatu (i u kraći popis ako ga Marti treba vidjeti), pokreni alat i novi popis prepiši u playbook (odjeljak EMOJI PALETTE). Emoji koji nije u paleti ili se ponavlja na istoj kartici dobije ikonu prema riječima.

**Ostalo** (playbook „Preporuka - Ostalo”): osobine bez emojija (npr. „Duboka hidratacija”, „Za suhu kožu”, „Večernja rutina”); ikonu svakoj kartica bira sama prema riječima, između 21 vlastite ikone.

Ikone osobina parfema su iz [Tabler Icons](https://tabler.io/icons) (MIT licenca); obavijest o licenci je uz ikone u `kartica-artikla.js`.

## Kako se koristi

Na stranicu ide samo jedan redak, najbolje odmah iznad `</body>`. Tako je na probnoj stranici [proba-1-dio.html](https://notturno-labs.github.io/martimex-hr-chat/proba-1-dio.html):

```html
<script src="https://notturno-labs.github.io/martimex-hr-chat/v2-1/loader.js"></script>
```

Na martimex.hr redak ima još `data-kolacici="ceka"`, pa se chat učita tek kad kupac prihvati sve kolačiće:

```html
<script src="https://notturno-labs.github.io/martimex-hr-chat/v2-1/loader.js" data-kolacici="ceka"></script>
```

Chat uvijek razgovara s Voiceflow projektom „v2 - prvi dio”, okruženje Main, objavljena (Publish) verzija.

Dosadašnji kod chata treba sa stranice maknuti: ako loader na stranici nađe drugi chat, ne učita ništa, da ne budu dva.

## Pravila

- **Ova mapa se mijenja samo namjerno**: za objavu ili hitni popravak 1. dijela. Razvoj (2. dio, isprobavanja) ide u korijen repozitorija, pa promjene tamo ne diraju stranice koje učitavaju ovu mapu.
- Popravak koji vrijedi i za modul u korijenu napravi se na oba mjesta, da se ne izgubi za 2. dio.
- Nakon promjene na GitHubu pričekaj nekoliko minuta i osvježi stranicu: GitHub Pages datoteke drži u pregledniku do 10 minuta.
