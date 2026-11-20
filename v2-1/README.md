# v2-1 – Marti chat 2.0, 1. dio

Ukratko: Marti chat 2.0, 1. dio – točno ono što ide na martimex.hr (kartice artikala, izgled chata i gumba)

U ovoj mapi je 1. dio verzije 2.0 Marti chata: nove kartice artikala, novi izgled chata i novi izgled gumba koji otvara chat. Gumbi „Pitaj Marti” (2. dio) nisu u ovoj mapi.

## Što je unutra

| Datoteka | Što radi |
|---|---|
| `loader.js` | jedini file koji stranica učitava; on učita sve ostalo iz ove mape i spoji chat na Voiceflow projekt „v2 - prvi dio” |
| `kartica-artikla.js` | kartice artikala: ružičasta ploča sa slikom (boja zaglavlja martimex.hr), marka, naziv, vrsta i veličina, cijena (akcija, promo kod), tri osobine s ikonama i crni gumb „Pogledaj proizvod” |
| `gumb-chata.js` | izgled gumba koji otvara chat |
| `jedan-ekran.js` | izgled prozora chata „Jedan ekran” |
| `cekanje-odgovora.js` | perlice dok Marti piše odgovor |
| `pozdrav-bez-tipkanja.js` | Martin pozdrav izroni bez tipkanja |
| `fonts/` | fontovi Jost (chat), Nunito i Playfair Display (kartice artikala); licenca SIL OFL 1.1 |

Moduli su kopije 1:1 modula iz korijena repozitorija na dan 10. 11. 2026. (commit `bc90cc0`); od tada se ova mapa i korijen mijenjaju odvojeno. Kartica artikla ovdje ima novi izgled od 20. 11. 2026. (bez opisa, s tri osobine); `kartica-artikla.js` u korijenu još je stara kartica.

## Kartice artikala

Kartice crta `kartica-artikla.js` iz poruke `ext_product_card` koju šalju Voiceflow funkcije kartica („Prikazi parfem card”, „Prikazi artikl card - Preporuka Ostalo”, „Prikazi artikl card - Trazilica”). Kartica nema opis artikla. Tri osobine ispod cijene (npr. „Svjež i čist”, „Moderna elegancija”, „Ured, večer i prilike”) piše Marti u playbookovima „Preporuka - Parfemi” i „Preporuka - Ostalo” (polje `osobine`, funkcija ga šalje kao `features`); ikonu svakoj osobini kartica bira sama prema riječima. Tražilica osobine ne šalje, pa su njezine kartice bez tog reda.

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
