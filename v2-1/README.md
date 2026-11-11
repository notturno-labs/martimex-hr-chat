# v2-1 – Marti chat 2.0, 1. dio

Ukratko: Marti chat 2.0, 1. dio – točno ono što ide na martimex.hr (kartice artikala, izgled chata i gumba)

U ovoj mapi je 1. dio verzije 2.0 Marti chata: nove kartice artikala, novi izgled chata i novi izgled gumba koji otvara chat. Gumbi „Pitaj Marti” (2. dio) nisu u ovoj mapi.

## Što je unutra

| Datoteka | Što radi |
|---|---|
| `loader.js` | jedini file koji stranica učitava; on učita sve ostalo iz ove mape i spoji chat na Voiceflow projekt „v2 - prvi dio” |
| `kartica-artikla.js` | nove kartice artikala |
| `gumb-chata.js` | izgled gumba koji otvara chat |
| `jedan-ekran.js` | izgled prozora chata „Jedan ekran” |
| `cekanje-odgovora.js` | perlice dok Marti piše odgovor |
| `pozdrav-bez-tipkanja.js` | Martin pozdrav izroni bez tipkanja |
| `fonts/` | fontovi Jost i Cormorant Garamond (licenca SIL OFL 1.1) |

Moduli su kopije 1:1 modula iz korijena repozitorija na dan 10. 11. 2026. (commit `bc90cc0`); od tada se ova mapa i korijen mijenjaju odvojeno.

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
