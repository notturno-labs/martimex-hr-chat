# Upute za rad na repozitoriju martimex-hr-chat

Ukratko: Upute za rad na repozitoriju – mapa v2-1/ ide na martimex.hr, razvoj ide u korijen

Marti chat je AI asistentica webshopa martimex.hr. Repozitorij se objavljuje preko GitHub Pagesa (https://notturno-labs.github.io/martimex-hr-chat/): svaka promjena spojena u `main` za nekoliko je minuta javno dostupna.

## Mapa `v2-1/` – chat 2.0, 1. dio (ide na martimex.hr)

- Zaokružen paket koji učitavaju martimex.hr i probna stranica `proba-1-dio.html`: `loader.js`, pet modula i `fonts/`. Loader module uzima iz svoje mape, ne iz korijena.
- **Ne mijenjaj ništa u `v2-1/` osim kad korisnik izričito traži promjenu, objavu ili hitni popravak 1. dijela.** Razvoj i isprobavanja idu u korijen.
- Kad se u `v2-1/` popravlja greška koja postoji i u istom modulu u korijenu, popravi je na oba mjesta.
- `v2-1/loader.js` spaja se na Voiceflow projekt „v2 - prvi dio” (`6af2ea688e4fa5522c532d4f`), uvijek na okruženje Main.

## Korijen – razvoj

- Moduli u korijenu su radne verzije; na njima se radi 2. dio (`pitaj-marti.js`, gumb „Pitaj Marti” na stranici artikla i na stranici Kontakt).
- `proba.html` (s `martimex-stil.css` i `loader.js`) je probna kopija webshopa za 2. dio, spojena na Voiceflow projekt „V2 - Martimex - Live”.
- `proba-1-dio.html` je probna stranica 1. dijela i učitava `v2-1/loader.js`.

## Navike

- Komentari, poruke u konzoli i opisi commitova su na hrvatskom.
- Svaka datoteka na početku ima kratak opis koji počinje s „Ukratko:” (u HTML-u je to komentar u `<head>`). Nova datoteka dodaje se zasebnim commitom kojemu je poruka taj opis, pa ga GitHub pokazuje uz ime datoteke.
