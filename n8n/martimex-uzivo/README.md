# Marti – Martimex uživo (izvorni kod n8n Code nodeova)

Kopija koda iz n8n workflowa „Marti – Martimex uživo“ i lokalni testni okvir za brzu iteraciju.
Workflow je jedan alat za asistenticu Marti: deterministički (bez AI-ja) odabere 1–3 stranice martimex.hr,
pročita ih uživo i vrati kratke činjenice `{ ok, tip, tekst }` ili `{ ok:false, greska }`.
Od v1.6 cijena se koristi samo ako se na stranici slaže na tri mjesta (podaci varijante, prikazana cijena, ld+json)
i ako su pročitane sve varijante; inače alat vraća `ok:false` s poveznicom umjesto moguće krive cijene.

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
| `test_zadaci.js` | – | testovi zadataka (v1.5): samoprovjera (spora stranica = upozorenje, kvar = greška), sitemapi (tolerancija, dojava nakon 2 h jednom dnevno, zaštita od naglog pada adresa), brendovi (ponavljanje serije kad web ne odgovara) |
| `test_v15_dodatno.js` | – | testovi ostalih ispravaka v1.5 (greška čitanja tablice, ponovljeni dijelovi zapisa, slab url, aliasi brendova, provjera brenda, neupotrebljiv indeks, dojava interne greške) |
| `test_v16.js` | – | testovi v1.6: unakrsna provjera cijena (prikazana cijena, ld+json, sve varijante, redovna cijena), potpunost popisa, JSON način, prigušivanje dojava, napomena o odabiru po sličnosti, samoprovjera svaka 3 h |
| `index_extra.json` | – | mali dio indeksa (brendovi, kategorije, stranice) za lokalne testove |
| `opisi_nodeova.md` | – | opis svakog nodea korak po korak; isti tekst stoji kao sticky bilješka uz node u n8n-u |

## JSON način (v1.6)

Uz `format: "json"` u tijelu ili query stringu odgovor uz isti `tekst` nosi i `podaci`:

```json
{
  "ok": true, "tip": "proizvod", "tekst": "UŽIVO s martimex.hr · …",
  "podaci": {
    "verzija": 1, "dohvaceno": "2026-10-31T16:00:00.000Z",
    "stranice": [{
      "url": "https://martimex.hr/proizvod/…/", "ok": true, "tip": "proizvod",
      "generirano": "2026-10-31T15:59:58.000Z", "starostS": 2, "rezervniDohvat": false,
      "proizvod": {
        "naziv": "…", "brend": "…", "kategorija": "…", "promo": ["-10% uz kod …"], "bezZalihe": false, "drugiBrend": false,
        "varijante": [{ "oznaka": "50 ml", "nijansa": false, "cijena": 99.5, "cijenaTekst": "99,50 €", "naAkciji": false,
                        "akcijaPct": 0, "redovnaCijena": null, "najnizaCijena30d": null, "naZalihi": true, "zaliha": "na zalihi" }]
      }
    }]
  }
}
```

- Popis (`tip: "popis"`): `popis.proizvodi[]` s `naziv`, `brend`, `url`, `cijena` (broj ili null kad je prikazan raspon), `cijenaTekst`, `naAkciji`, `redovnaCijena`, `promo`, `nijeNaZalihi`, `varijante[]`; uz to `stranica`, `ukupnoStranica`, `sljedeca`. Popis je cijela stranica popisa, bez filtra po brendu ili akciji koji se primjenjuje u tekstu.
- Informativna stranica: `naslov` i `tekst`.
- Stranica koja nije pročitana: `ok: false`, `vrstaGreske` (`404`, `timeout`, `izvlacenje`…) i `greska`.
- Zadaci (`sitemapi`, `brendovi`, `samoprovjera`) ne vraćaju `podaci`.

## Lokalni test

```bash
npm install                      # luxon, node-html-markdown
# data/index_rows_products.json: izvoz redaka product-/product_tag-/post-sitemap iz Data Tablea „Marti - indeks weba“
# samples/<putanja_s_podvlakama>.html: HTML stranica spremljen iz n8n izvršavanja (node „Dohvati stranice“)
node harness.js '{"upit":"versace eros eau de parfum"}'
node harness.js '{"url":"/kategorija/parfemi/?gender=32&sort=4&maxPrice=80&pg=2"}'
node harness.js '{"zadatak":"samoprovjera"}'
node harness.js '{"upit":"versace eros eau de parfum","format":"json"}'
node test_v16.js && node test_v15_dodatno.js && node test_zadaci.js
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
