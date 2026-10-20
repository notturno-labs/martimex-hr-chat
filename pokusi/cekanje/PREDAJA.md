# Predaja: animacija čekanja odgovora („perlice na niti”)

Uputa za agenta u drugom razgovoru: kako animaciju čekanja odgovora spojiti s izgledom chata na
kojem se tamo radi (npr. pokus „Jedan ekran”) i što klijent od nje očekuje. Napisano 20. 10. 2026.

## Ukratko

- **Što:** dok Marti smišlja odgovor, umjesto Voiceflowova sivog spinnera s tekstom
  „Trenutak, molim...” prikazuje se animacija u stilu zaglavlja s flakonom.
- **Gdje:** samostalni modul `cekanje-odgovora.js` na vrhu repozitorija, na grani
  `claude/epic-davinci-izejru` (repo `notturno-labs/martimex-hr-chat`). Na toj grani su dva
  commita povrh `main` (e69a817): `0491af1` (prva verzija) i `ffe4313` (dorada v2), te ova uputa.
- **Uvjet:** u Voiceflowu prikaz čekanja mora biti „dots” (vidi niže). Bez toga modul ne radi
  ništa i ostaje Voiceflowov spinner.
- **Nije provjereno s pravim Voiceflow widgetom.** U razgovoru u kojem je animacija nastala
  mrežna pravila su blokirala `cdn.voiceflow.com`. Sve je isprobano u Chromiumu na stranicama
  koje glume Voiceflowov DOM, uključujući stvarni `jedan-ekran.js` s grane `claude/jedan-ekran`
  (commit 9a827dc).

## Što klijent želi (povijest odluka)

1. Spinner „Trenutak, molim...” (Voiceflowova postavka `spinner-with-text`) ne uklapa se u izgled
   „Jedan ekran”: topla crna pozornica s flakonom od točkica, bjelokost, bijele kartice, tinta,
   Jost. Klijent je tražio „neku zanimljivu animaciju koja paše uz dizajn”.
2. Izabran je koncept „perlice na niti”: tri crne perlice na tankoj niti od točkica boje
   ružičastog zlata, kao niti od kojih je satkan flakon u zaglavlju. Nit se njiše kao svila, a
   perlice se dižu jedna za drugom, kao „tipkanje”. Klijent: „lijepo izgleda”.
3. Zatim je tražio da se animacija „još više ispolira, da je baš smooth”. Dorada v2:
   - oblačić meko izroni kao Martine poruke, a avatar se tiho pojavi
   - nit se iscrta polako, pa brže, pa polako; perlice meko slete i nit pod njima malo popusti
   - nema nasumičnog treperenja točkica ni iskri; s vrhom vala putuje meko zlatno svjetlo
   - perlice su sjajne, s mekom sjenom ispod
   - natpis se pojavi iz blage izmaglice
   - kad stigne odgovor, perlice se rasplinu u izmaglicu i oblačić izblijedi umjesto da naglo
     nestane
   - crta se u barem dvostrukoj razlučivosti

   Klijentov ukus: mirno, elegantno, bez ičega što treperi ili „skače”; dorade neka idu u tom
   smjeru.

## Kako izgleda (v2)

- Pojava (oko 1 s):
  - oblačić izroni (pomak 6 px, skaliranje 0,96 → 1, 0,55 s)
  - nit se iscrta slijeva nadesno
  - tri perlice jedna za drugom padnu s 5 px i sjednu; nit pod svakom popusti do 0,9 px i vrati se
- Čekanje:
  - val putuje slijeva nadesno: jedan val traje 1,6 s, visina 2,4 px; perlice su petina vala
    jedna od druge, pa se dižu jedna za drugom
  - visina vala vrlo polako „diše” (±8 %, 5,3 s)
  - na vrhu vala točkice niti zasjaju zlatom, iza niti je meki zlatni sjaj, a perla dobije topli
    odsjaj odozgo
- Natpis: ako čekanje traje dulje od 1,5 s, oblačić se glatko proširi (0,8 s) i iz blage
  izmaglice se pojavi „Trenutak, molim…”. Zlatni odsjaj prijeđe preko natpisa svaka dva vala,
  usklađen s trenutkom kad svjetlo stigne do kraja niti. Između dviju Martinih poruka zaredom
  (kratki oblačić) vide se samo perlice.
- Izlaz (kad stigne odgovor):
  - na mjesto oblačića stavi se kopija bez sjene
  - perlice se rasplinu u oblak točkica koji se diže (0,45 s), a točkice niti otplove
  - natpis se zamuti i nestane u 0,16 s
  - podloga izblijedi u 0,28 s dok se ispod pojavljuje odgovor (u „Jednom ekranu” poruka ima
    svoju pojavu `mx-j-pojava`)
- „Smanji pokrete”: ravna nit, mirne perlice, oblačić se samo tiho pojavi, natpis je odmah tu,
  bez odsjaja i bez kopije na izlazu.

## Datoteke

- `cekanje-odgovora.js`: cijeli modul; postavke su na vrhu u `MX_CEKANJE_POSTAVKE`.
- `loader.js`: u `MODULI` je jedan novi redak `cekanje-odgovora.js`, odmah iza `gumb-chata.js`.
- `pokusi/cekanje/proba.html`: proba bez Voiceflowa i interneta. Glumi Voiceflowov prozor u
  izgledu „Jedan ekran”, s pojavom poruka kao u `jedan-ekran.js`. Parametri:
  - `?trajanje=1`: kratko čekanje
  - `?izgled=voiceflow`: Voiceflowov sivi oblačić
  - `?ponavljaj=1`: pitanje i odgovor se sami ponavljaju
- `pokusi/README.md`: odjeljak „Čekanje odgovora — perlice na niti”.
- `pokusi/cekanje/PREDAJA.md`: ova uputa.

## Kako spojiti

1. Dohvati granu i spoji je u granu na kojoj radiš:
   ```
   git fetch origin claude/epic-davinci-izejru
   git merge origin/claude/epic-davinci-izejru
   ```
   Isprobano 20. 10. 2026.: spaja se bez sukoba u `main`, `claude/jedan-ekran` (9a827dc),
   `claude/relaxed-volta-m98576`, `claude/eager-carson-7bfq3j` i `claude/razlijetanje`. Ako
   `loader.js` ipak bude u sukobu, zadrži oba retka (npr. `# tema-chata.js` i
   `cekanje-odgovora.js`).
2. Ako grana ne smije donijeti ništa drugo, kopiraj samo datoteke:
   ```
   git checkout origin/claude/epic-davinci-izejru -- cekanje-odgovora.js pokusi/cekanje/proba.html pokusi/cekanje/PREDAJA.md
   ```
   Zatim u `loader.js` (`MODULI`) dodaj redak `cekanje-odgovora.js`.
3. Modul ostaje zaseban; njegov kod ne prebacuj u `jedan-ekran.js` ni `tema-chata.js`. Radi
   uz svaki izgled: boju i oblik oblačića daje izgled, a modul crta ono unutra.
4. Prije commita: `node --check cekanje-odgovora.js`, zatim provjera kao niže. Commit i push
   na svoju granu.

## Usklađivanje s izgledom („Jedan ekran”, „Calacatta”)

- `jedan-ekran.js` i `tema-chata.js` imaju pravilo za oblačić s točkicama (`TIPKA =
  div:has(> .vfrc-typing-indicator)`): bijela kartica, odnosno staklo. To ostaje i daje
  oblačiću boju, kut i sjenu.
- Njihova pravila za točkice (`.vfrc-typing-indicator > span`, `mx-j-tocka`, `mx-t-tocka`) mogu
  ostati, ne treba ih brisati. Modul sakrije Voiceflowove točkice i poništi ta pravila na
  svojem elementu (`all: unset`); ostaju kao rezerva kad preglednik ne može crtati.
- Modul oblačiću sam postavi `height: auto; min-height: 0; padding: 8px 10px;` i pojavu, a
  avataru uz njega tiho pojavljivanje. Selektori modula počinju s `:host([data-mx-cekanje])`,
  pa su jači od tema. U temi ne dodaji pravila za razmak ni animaciju tog oblačića, jer bi se
  sukobila.
- Boje su u `MX_CEKANJE_POSTAVKE.boje` i zadane su prema paleti „Jednog ekrana”:

  | Postavka | Boja | Odakle |
  |---|---|---|
  | `perla` | `#1c1715` | `tinta` |
  | `natpis` | `#7a6d66` | `tih` |
  | `nit` | `#c99a8d` | ružičasto zlato s gumba chata |
  | `zlato` | `#c9a052` | |

  Ako se paleta teme promijeni, promijeni i ovdje.
- `pokusi/jedan-ekran/proba.html` učitava `../../loader.js`, pa se modul tamo učita sam čim je u
  `MODULI`. `pokusi/jedan-ekran/mock.html` ne koristi `loader.js`. Da bi se animacija vidjela i
  u mocku:
  - iza `jedan-ekran.js` dodaj učitavanje `../../cekanje-odgovora.js`
  - produlji oblačić s točkicama u funkciji `tipka` (sada 900 ms), da se vidi i natpis nakon
    1,5 s
- Ako se izgled bitno promijeni, provjeri na `pokusi/cekanje/proba.html` i u mocku izgleda.
  Mijenja li se tema, ažuriraj i CSS „Jednog ekrana” prepisan u `proba.html` (varijabla
  `jedanEkran`).

## Voiceflow: prikaz čekanja mora biti „dots”

- Sada je u oba projekta (okruženje `main`):
  `chat.responseLoader = { type: 'spinner-with-text', text: 'Trenutak, molim...' }`.
  - proba (`proba.html`, `pokusi/jedan-ekran/proba.html`): projekt `6abcf8b2128a6fc786128cca`
  - webshop: projekt `6aabec2e323cb129d034dd89`
- Treba biti `{ type: 'dots' }`. Samo tada Voiceflow crta oblačić s klasom
  `.vfrc-typing-indicator` (službena, dokumentirana klasa), na koju se modul veže. Tekst natpisa
  sada je u modulu (`natpis`), ne u Voiceflowu.
- Preko Voiceflow MCP-a:
  1. `voiceflow_widget.get`
  2. `voiceflow_widget.update` s tijelom `{ "chat": { "responseLoader": { "type": "dots" } } }`
  3. `voiceflow_environment.publish`

  Promjena ide u nacrt, a objavom postaje vidljiva. **Samo uz izričitu potvrdu klijenta:**
  najprije probni projekt, a webshop tek kad klijent odobri.
- Dok je na webshopu spinner, modul u `loader.js` na martimex.hr ne mijenja ništa.

## Provjera

- Bez Voiceflowa: `pokusi/cekanje/proba.html`, s parametrima iz odjeljka Datoteke. Kad je grana
  u `main`, stranica je i na GitHub Pages:
  `https://notturno-labs.github.io/martimex-hr-chat/pokusi/cekanje/proba.html`.
- U pravom chatu (nakon prebacivanja na „dots”), npr. `pokusi/jedan-ekran/proba.html`: postavi
  pitanje. Što treba vidjeti:
  1. oblačić s perlicama izroni
  2. nakon 1,5 s proširi se s natpisom
  3. kad stigne odgovor, perlice se rasplinu, a oblačić izblijedi točno na svojem mjestu
  - Ako je kopija na izlazu pomaknuta ili se oblačić ne promijeni: Voiceflowov DOM se razlikuje
    od mocka. Modul pretpostavlja da je roditelj od `.vfrc-typing-indicator` oblačić, a avatar
    `.vfrc-avatar` u istom retku (kao i `TIPKA` u temama). Provjeri u alatima za razvoj.
- Što je isprobano u ovom razgovoru:
  - u Chromiumu (Playwright): računalo, mobitel (3×), „Smanji pokrete”, Voiceflowov sivi izgled
    i stvarni `jedan-ekran.js`
  - petlja crtanja radi samo dok je oblačić u chatu
  - nakon odgovora ništa ne ostaje
  - kopija sjedne na isti piksel kao oblačić
  - kad Voiceflow isti oblačić iscrta iznova, animacija se nastavlja bez dvostruke slike
  - kroz `loader.js` svi moduli se učitaju bez greške

## Kako radi (za održavanje)

- **Stil:** `<style data-mx-cekanje="2">` u shadow rootu elementa `#voiceflow-chat`. Modul na
  `#voiceflow-chat` stavi atribut `data-mx-cekanje`, pa svi selektori počinju s
  `:host([data-mx-cekanje]) .vfrc-widget`. Kad se CSS promijeni, povećaj broj verzije u
  `ubaciStil` (`'2'`), inače stara verzija ostaje.
- **Umetanje:** `MutationObserver` na shadow rootu nađe svaki `.vfrc-typing-indicator` i u njega
  umetne `<span class="mx-c">`. U njemu su platno `.mx-c-platno` (70 × 30 CSS px) i natpis
  `.mx-c-natpis > span`. Bez `:has()`, sve oznake su atributi:
  - `data-mx-c`: točkice
  - `data-mx-c-oblacic`: roditelj, tj. oblačić
  - `data-mx-c-avatar`: avatar u istom retku
  - `data-mx-c-nastavak`: oblačić iscrtan iznova na istom mjestu, bez ponovne pojave
- **Crtanje:**
  - sve je funkcija vremena (`nacrtaj(g, t, mjerilo, mirno, izlaz)`)
  - jedna `requestAnimationFrame` petlja za sve oblačiće; stane kad ih više nema
  - platno je u najmanje dvostrukoj razlučivosti
- **Izlaz:** kad Voiceflow makne oblačić, u shadow root se doda `.mx-c-duh`:
  - `position: fixed`, najveći `z-index`, izrezan na dio chata s porukama, prati pomicanje
    razgovora
  - podloga je kopirana iz oblačića, bez sjene
  - platno se premjesti u kopiju i crta rasplinjavanje; nakon 0,45 s kopija se makne
  - ako oblačić živi kraće od 0,35 s, kopije nema
- **Natpis:**
  - širina se izmjeri tek kad se natpis pojavi (font je tada učitan), a nakon širenja granica se
    makne (`.mx-c-sire`), pa radi i ako font stigne kasnije
  - odsjaj je CSS animacija s kašnjenjem izračunatim u `kasnjenjeOdsjaja`
- **Postavke klijenta** (`MX_CEKANJE_POSTAVKE`):
  - `boje`
  - `natpis`: tekst; kratko, do 25-ak znakova; `''` = samo perlice
  - `natpisNakon`: zadano 1,5 s
  - `val`: trajanje jednog vala, zadano 1,6 s
  - komentari su na hrvatskom, kao u ostalim modulima
