# Marti – Martimex uživo (izvorni kod n8n Code nodeova)

Kopija koda iz n8n workflowa „Marti – Martimex uživo“ i lokalni testni okvir za brzu iteraciju.
Workflow je jedan alat za asistenticu Marti: deterministički (bez AI-ja) odabere 1–3 stranice martimex.hr,
pročita ih uživo i vrati kratke činjenice `{ ok, tip, tekst }` ili `{ ok:false, greska }`.

Ovdje nema ključeva, ID-ova vjerodajnica ni internih adresa. Mjerodavna verzija koda je ona u n8n-u;
ova mapa je samo kopija za pregled razlika i lokalno testiranje.

## Datoteke

| Datoteka | n8n node | Što radi |
|---|---|---|
| `code_A_pripremi.js` | Pripremi upit | čita zahtjev (webhook, ručni test, okidači), raspakira indeks iz Data Tablea, odlučuje treba li sitemape čitati uživo |
| `code_B_odaberi.js` | Odaberi stranice | rječnik tema, aliasi brendova, rangiranje proizvoda, filtri, zadaci (sitemapi, brendovi, samoprovjera) |
| `code_C_izvuci.js` | Izvuci činjenice | iz HTML-a izvlači varijante, cijene, akcije, zalihu, promo kod, popise i tekst informativnih stranica |
| `code_D_sastavi.js` | Sastavi odgovor | slaže kratak tekst za Marti i retke za spremanje indeksa |
| `code_E_redci.js` | Redci za spremanje | dijeli indeks na retke do 60 000 znakova |
| `code_P_primjeri.js` | Primjeri upita | primjeri za ručni test |
| `build_sdk.py` | – | sastavlja n8n Workflow SDK kod cijelog workflowa iz gornjih datoteka |
| `workflow_skeleton.js` | – | kostur workflowa (nodeovi, veze, postavke) s praznim Code nodeovima |
| `harness.js` | – | lokalno oponaša Code nodeove (`$input`, `$()`, `$json`, `$now`, `DateTime`) i vrti A → B → C → Markdown → D → E nad spremljenim HTML-om |
| `escape_push.py` | – | provjera prije slanja: nevidljive i kombinirajuće znakove pretvara u `\uXXXX` (kod ih ionako ne smije sadržavati) |
| `test_brendovi.js` | – | jedinični test spremanja mape brendova (više stranica istog brenda u jednoj seriji) |
| `index_extra.json` | – | mali dio indeksa (brendovi, kategorije, stranice) za lokalne testove |
| `opisi_nodeova.md` | – | opis svakog nodea korak po korak; isti tekst stoji kao sticky bilješka uz node u n8n-u |

## Lokalni test

```bash
npm install                      # luxon, node-html-markdown
# data/index_rows_products.json: izvoz redaka product-/product_tag-/post-sitemap iz Data Tablea „Marti - indeks weba“
# samples/<putanja_s_podvlakama>.html: HTML stranica spremljen iz n8n izvršavanja (node „Dohvati stranice“)
node harness.js '{"upit":"versace eros eau de parfum"}'
node harness.js '{"url":"/kategorija/parfemi/?gender=32&sort=4&maxPrice=80&pg=2"}'
node harness.js '{"zadatak":"samoprovjera"}'
```

Stranica bez spremljenog uzorka u testu se ponaša kao 404.

## Objava promjene u n8n

1. Kod ne smije sadržavati nevidljive znakove ni `\uXXXX` zapise: JSON prijenos pretvara `\u0300` u stvarni nevidljivi znak.
   Umjesto toga koristi `/\p{M}/gu` i `String.fromCharCode(...)`. Provjera: `python3 escape_push.py code_B_odaberi.js /tmp/B.js` ne smije ništa promijeniti.
2. MCP `update_workflow`: `setNodeParameter`, node „Odaberi stranice“, path `/jsCode`, vrijednost = sadržaj datoteke.
3. `get_workflow_details` i usporedba pohranjenog `jsCode` s datotekom (mora biti identičan).
4. Produkcijski test webhookom, zatim `publish_workflow`.

`build_sdk.py` čita ID-ove iz varijabli okoline `TABLE_ID`, `TELEGRAM_CREDENTIAL_ID` i `TELEGRAM_CHAT_ID`;
bez njih u kodu ostaju oznake `__…__` koje treba zamijeniti prije izrade novog workflowa.
