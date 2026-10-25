# Pitaj Marti — gumb na stranici proizvoda (proba)

Ispod gumba **„Dodaj u košaricu”** na stranici proizvoda pojavi se gumb
**„✦ Pitaj Marti”**. Kad ga kupac pritisne:

1. otvori se chat s Marti,
2. u chatu se pojavi **kartica tog artikla** (slika, marka, naziv, odabrana
   veličina ili nijansa, cijena — i stara cijena kad je artikl na akciji),
3. Marti pita **„Kako Vam mogu pomoći oko ovog artikla?”**, a ispod su
   ponuđena pitanja (npr. „Kakav je miris?”, „Koliko dugo traje?”,
   „Koju veličinu odabrati?”),
4. Marti zna o kojem je artiklu riječ, pa kupac može odmah pitati što god
   želi o njemu.

Na stranici **Kontakt**, u okviru „Kontakt podaci”, ispod radnog vremena je
redak „AI asistentica” s gumbom **„Pitaj Marti”**, koji samo otvori chat —
isto kao gumb chata u donjem desnom kutu (razgovor se nastavi, a ako ga nema,
počne običnim pozdravom).

Ovo je **proba**: na martimex.hr se ništa ne mijenja dok se modul ne doda u
`loader.js` (vidi dolje).

## Datoteke

| Datoteka | Što je |
|---|---|
| `pitaj-marti.js` | modul: gumb na stranici proizvoda (čitanje artikla i slanje Marti) i na stranici Kontakt |
| `proba.html` | probna stranica, sve u jednoj datoteci: kopija stranice proizvoda i stranice Kontakt s martimex.hr (isti HTML i stil kao webshop), zaglavlje i podnožje webshopa, gumb i chat |

## Kako isprobati

Stranica: **https://notturno-labs.github.io/martimex-hr-chat/pokusi/pitaj-marti/proba.html**

Sve je na toj jednoj stranici. Probna traka na vrhu:

- **artikl**: Dylan Blue (kao na martimex.hr), Crystal Noir (na akciji),
  Eros Parfum (bez veličina), ruž Creamy Delight (nijanse), Purple Stain
  (nije na stanju, opis u karticama „Opis / Uporaba / Sastojci...”),
- **Kontakt**: stranica Kontakt (adresa `proba.html?stranica=kontakt`); i
  poveznica „Kontakt” u zaglavlju vodi na nju, a logo Martimex natrag na
  stranicu proizvoda,
- **Novi razgovor**: obriše razgovor iz preglednika i učita stranicu ispočetka.

Razgovor ostaje kad se ide s jedne stranice na drugu (kao na webshopu).

Chat na probnoj stranici ima kod za chat iz repozitorija (kao u „Za
martimex.hr (cisti)”), a `loader.js` s vrha repozitorija učita module —
izgled „Jedan ekran” (`jedan-ekran.js`: tamna traka „MARTI / AI
ASISTENTICA”, trake s brendovima, ikone na gumbima pozdrava), gumb chata
(`gumb-chata.js`), kartice artikala i čekanje odgovora. Kad se ti moduli
promijene, promijeni se i chat na probnoj stranici.

Dodaci na kraju adrese:

- `&kolacici=ceka` — kao na martimex.hr: chat se učita tek kad se
  prihvate kolačići (u traci se pojavi gumb „Prihvati kolačiće”); do tada
  ni gumba „Pitaj Marti” nema,
- `&izgled=dosadasnji` — dosadašnji početni ekran (`pocetna-chata.js`), samo
  za usporedbu,
- `&pitajmarti=debug` — modul zapisuje što radi u konzolu preglednika.

Kad se neka datoteka na GitHubu promijeni, preglednik do 10 minuta može
pokazivati staru spremljenu kopiju stranice (tako radi GitHub Pages). Tada
pomaže osvježavanje bez spremljene kopije: Chrome **Cmd+Shift+R**, Safari
**Cmd+Option+R** (Windows: Ctrl+F5). Modul `pitaj-marti.js` stranica uvijek
učitava svjež (oznaka `?v=` se mijenja svake minute), pa stara kopija modula
ne može raditi s novom stranicom.

Vrijedi probati: odabrati drugu veličinu ili nijansu pa opet „Pitaj Marti”,
prvo otvoriti chat običnim gumbom pa tek onda „Pitaj Marti”, osvježiti
stranicu usred razgovora, u chatu pokrenuti novi razgovor (tada je običan
pozdrav, bez artikla).

Chat na probnoj stranici razgovara s Voiceflow projektom **V2 - Martimex -
Live**, okruženje **„Radim gumb na webu”** (nacrt), a ne s Marti na webshopu.

**Prije prezentacije:** otvoriti stranicu iznova (ili pritisnuti „Novi
razgovor” u probnoj traci) i jednom kliknuti „Pitaj Marti” da se vidi da
chat radi; za vrijeme prezentacije ne mijenjati nacrt okruženja „Radim gumb
na webu” u Voiceflowu (stranica razgovara s nacrtom). Razgovor koji stoji
više od 30 minuta Voiceflow završi — to je normalno: gumb tada sam pokrene
novi razgovor s artiklom.

## Kako radi

**Na stranici (`pitaj-marti.js`)** — podaci se čitaju sa same stranice u
trenutku pritiska, bez ikakvog dodatnog učitavanja (traje djelić
milisekunde): naziv, marka, vrsta, kategorija, odabrana varijanta, cijene
svih varijanti, stara cijena i najniža cijena u 30 dana, dostupnost, slika,
opis (i kad je u karticama „Opis / Prednosti / Upotreba...”, sa
naslovima) i pogodnosti. Izvori su podaci stranice (Alpine `x-data`
„singleProduct”), oznake gumba varijanti i JSON-LD.

- Razgovor još ne postoji → chat se otvori kao i inače, a podaci o artiklu
  idu uz pokretanje razgovora (Voiceflow `launch`), pa umjesto pozdrava
  Marti pokaže karticu i pitanje. (S dosadašnjim početnim ekranom taj se
  ekran preskoči.)
- Razgovor već traje → šalje se događaj `pitaj_marti`; razgovor i Martino
  pamćenje ostaju, a kartica i pitanje dođu na dno razgovora.
- Razgovor koji chat pokazuje je **zastario** → pokrene se novi razgovor s
  artiklom (vidi „Zastarjeli razgovor” dolje).
- Isti artikl (ista varijanta) je zadnje što je Marti pokazala i kupac otad
  nije ništa pitao → chat se samo otvori. Ako je kupac u međuvremenu nešto
  pitao, kartica i pitanje dođu ponovno na dno.
- Ako Voiceflow ipak ne pošalje podatke uz pokretanje razgovora, modul ih
  sam pošalje događajem (rezerva). Ako na događaj ne stigne baš ništa (ni
  kartica ni bilo kakav Martin odgovor) u 10 s, modul pokrene novi razgovor
  s artiklom (rezerva u drugom smjeru).
- U podacima o artiklu polje `put` kaže kojim je putem artikl poslan
  (`launch`, `dogadaj`, `launch-novi`, `launch-rezerva`, `dogadaj-rezerva`);
  vidi se u Voiceflowovu transkriptu i pomaže kod traženja greške.

**Zastarjeli razgovor.** Voiceflow razgovor završi nakon **30 minuta bez
poruka**, ali preglednik ga i dalje pamti (`sessionStorage`, dok je
kartica preglednika otvorena — Safari je zna čuvati i danima) i pri
sljedećem učitavanju stranice opet ga pokaže. Događaj poslan u takav
razgovor ne dobije nikakav odgovor: Voiceflow otvori novi razgovor, a
događaj u njemu nema što pokrenuti — u chatu se ne pojavi ništa. Upravo se
to događalo kad gumb „nije radio” (vidi transkripte: prvi zahtjev novog
razgovora bio je `event pitaj_marti`, bez odgovora). Zato modul sada:

- pri učitavanju stranice obriše zapamćeni razgovor stariji od 25 minuta
  (prije nego ga chat pročita), pa chat kreće iznova i gumb pokrene
  razgovor s artiklom kao i prvi put;
- ako razgovor zastari dok je stranica otvorena, gumb umjesto događaja
  pokrene novi razgovor s artiklom — Voiceflowovim „Restart conversation”
  (gumb u izborniku chata i potvrda „Start new chat”, koje modul sam
  pritisne), pa se dosadašnje poruke obrišu kao kad kupac sam pokrene novi
  razgovor, a launch nosi artikl. Ako je chat u međuvremenu sam pokazao
  svoj gumb za novi razgovor (Voiceflow mu je javio da je razgovor
  završen), razgovor kreće njime, kao i dosad;
- na stranici Kontakt gumb u istom slučaju otvori chat i počne novi
  razgovor običnim pozdravom.

Gumb stoji u sivoj ploči odmah ispod gumba „Dodaj u košaricu”, iste je
širine, visine, zaobljenja i slova, a boje su kao kod sporednih gumba na
martimex.hr (puder-ružičasta pozadina, tamni natpis). Kad artikla nema na
stanju, stoji ispod gumba „Obavijesti me kada bude dostupan” i iste je
širine kao on. Gumb se vidi samo kad chat postoji ili se upravo
učitava: dok kupac ne prihvati kolačiće (pa se chat ne učitava) ili kad
blokator oglasa blokira Voiceflow, gumba nema; pojavi se čim se chat
učita. Postavke
(natpis, opis za miš i čitače ekrana, boje, tekstovi retka na stranici
Kontakt u `kontakt`...) su na vrhu `pitaj-marti.js` u `MX_PM_POSTAVKE`.

**Stranica Kontakt**: modul je prepozna po okviru „Kontakt podaci”
(`.contact-page__info-wrap`) i na kraj doda redak u istom obliku kao Email,
Telefon i Radno vrijeme (iskrica, „AI asistentica”, kratki tekst i gumb).
Gumb pozove `voiceflow.chat.open()` — isto što radi gumb chata — pa
izgled „Jedan ekran” sam pokrene razgovor ako ga još nema. I ovdje se gumb
vidi samo kad chat postoji.

**U Voiceflowu (okruženje „Radim gumb na webu”)**

- početni workflow „Root copy”: na početku provjeri je li razgovor pokrenut
  gumbom; ako jest, umjesto pozdrava ide u workflow „Pitaj Marti”,
- workflow **„Pitaj Marti”**: funkcija **„Pitaj Marti - artikl”** (provjeri
  i skrati podatke, pokaže karticu i ponuđena pitanja), pa poruka „Kako Vam
  mogu pomoći oko ovog artikla?”,
- podaci o artiklu idu u varijablu `pm_kontekst`, koja je u Global Promptu,
  pa Marti zna artikl u cijelom razgovoru,
- playbook **„Pitaj Marti - artikl”** za pitanja o tom artiklu,
- workflow „Pitaj Marti” je i alat agenta, za događaj `pitaj_marti` usred
  razgovora.

## Na martimex.hr (kad se odobri)

**Stanje na martimex.hr (provjereno 23. 10. 2026.):** na stranici je
običan Voiceflow kod (projekt „Martimex - Live”, bez `loader.js` s
GitHuba), i chat se učita tek kad kupac na traci s kolačićima prihvati sve
(kolačić `cookiesAccepted=allCookies`, odnosno događaj
`martimex:cookies-accepted`). Dakle ni „Jedan ekran” ni ostali moduli s
GitHuba još nisu na webshopu. Da bi „Pitaj Marti” radio na martimex.hr,
na stranici mora biti kod koji učitava `loader.js` (kao „Za martimex.hr
(cisti)”), spojen na projekt V2 — i taj kod mora zadržati čekanje na
pristanak za kolačiće kakvo je sada na stranici. Gumb „Pitaj Marti” je na
to spreman (vidi gore).

Zatim redoslijed — **prvo Voiceflow, pa tek onda GitHub**:

1. **Voiceflow**: okruženje „Radim gumb na webu” spojiti u Main (merge) i
   objaviti (Publish). Pažnja: ako se Main u međuvremenu mijenjao, merge te
   promjene pregazi — tada se promjene prenose ručno.
2. **Voiceflow (preporučeno)**: Agent → Behaviour → Events → New event
   `pitaj_marti`, radnja „Run workflow” → „Pitaj Marti”. Bez toga radi
   preko alata agenta, ali s događajem je odgovor usred razgovora brži.
3. **GitHub**: `pitaj-marti.js` premjestiti na vrh repozitorija i u
   `loader.js` u popis `MODULI` dodati redak `pitaj-marti.js`.

Na stranicama koje nisu stranica proizvoda ni Kontakt gumb se ne pojavi, a
chat radi kao i prije.

## Što je provjereno

- Voiceflow (nacrt okruženja): pokretanje s artiklom, događaj usred
  razgovora, običan pozdrav kad razgovor nije pokrenut gumbom, pitanja o
  artiklu i promjena artikla usred razgovora.
- U pravom pregledniku, s pravim Voiceflow widgetom (webchat 2.207),
  nacrtom okruženja i modulima iz `loader.js` (izgled „Jedan ekran”):
  kartica i pitanje nakon prvog pritiska (oko 2–3 s), Martin odgovor na
  ponuđeno pitanje (pozornica s brendovima se sklopi kao i u običnom
  razgovoru), druga veličina usred razgovora (nova kartica na dnu), novi
  razgovor u chatu daje običan pozdrav s pet gumba i bez kartice, artikl na
  akciji (stara i nova cijena, popust). Ranije, s dosadašnjim izgledom:
  Martini odgovori na „Kakav je miris?”, „Koju veličinu odabrati?” i „Koju
  nijansu odabrati?” s podacima sa stranice, isti artikl (samo se otvori
  chat), ruž na mobitelu, te „Pitaj Marti” nakon običnog pozdrava.
- Automatski testovi (Chromium, računalo i mobitel, 24 scenarija): jedan
  `launch` po pritisku (i kod dvostrukog klika), ispravni podaci o artiklu
  (veličina, nijansa, akcija, artikl bez varijanti, nije na stanju, opis u
  karticama), ponuđena pitanja, isti artikl (samo se otvori; nakon pitanja
  kartica ponovno), druga veličina usred razgovora, osvježena stranica,
  završen razgovor, klik prije nego se chat učitao, rezerva kad `launch`
  stigne bez artikla, stranica bez stila s martimex.hr, blokiran chat (gumb
  se sakrije), chat koji se učita tek nakon 20 s, kolačići koji još nisu
  prihvaćeni, da obični „Start new chat” ostaje običan pozdrav, da je gumb
  širok i poravnat kao „Dodaj u košaricu”, stranica Kontakt (gumb samo
  otvori chat s običnim pozdravom, drugi put samo otvori isti razgovor, i
  čeka kolačiće), te zastarjeli razgovor: stariji od 25 min se pri
  učitavanju obriše pa gumb pokrene novi razgovor s artiklom, razgovor koji
  zastari dok je stranica otvorena dobije novi razgovor s artiklom,
  događaj bez ikakvog odgovora dobije novi razgovor nakon 10 s,
  svjež razgovor star 20 min se ne dira, a na stranici Kontakt zastarjeli
  razgovor dobije novi pozdrav; te da probna traka i zaglavlje vode na
  Kontakt i natrag, da je na Kontaktu gumb „Pitaj Marti” i da razgovor
  ostaje kad se ide između stranica.
- Zastarjeli razgovor u pravom pregledniku (Chrome, Voiceflow nacrt):
  nakon 30 min bez poruka Voiceflow pri ponovnom učitavanju stranice chatu
  javi da je razgovor završen (chat pokaže svoj gumb za novi razgovor) i
  gumb „Pitaj Marti” pokrene novi razgovor s artiklom; a klik prije nego
  što Voiceflow to javi (ili kad veza ne uspije) slao je događaj u mrtav
  razgovor — to je slučaj koji modul sada rješava sam. „Restart
  conversation” pritisnut iz modula u pravom chatu (webchat 2.207) obriše
  stare poruke i pokrene razgovor s artiklom (kartica i pitanje za ~2 s);
  `launch` kroz `voiceflow.chat.interact` taj chat zanemari, pa se koristi
  samo kao rezerva za chat bez tog gumba.
- Čitanje artikla na pravim stranicama martimex.hr: 439 nasumičnih
  artikala iz svih 141 kategorije (od toga 347 pravih stranica, ostalo su
  skriveni artikli koji vode na naslovnicu). Gumb se postavi na svima, uz
  ispravnu marku, sliku, cijene svih varijanti i dostupnost. Tako su nađene
  i popravljene četiri stvari: opis u karticama se nije čitao, cijene
  varijanti s tri decimale (npr. `54.717`) čitale su se kao tisuće, gumb je
  kod artikala kojih nema na stanju stajao iznad „Obavijesti me”, a Marti je
  dobivala samo 12 nijansi (sada do 40) i 1400 znakova opisa (sada 2500).
