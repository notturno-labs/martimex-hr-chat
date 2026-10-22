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

Ovo je **proba**: na martimex.hr se ništa ne mijenja dok se modul ne doda u
`loader.js` (vidi dolje).

## Datoteke

| Datoteka | Što je |
|---|---|
| `pitaj-marti.js` | modul: gumb, čitanje artikla sa stranice i slanje Marti |
| `proba.html` | kopija stranice proizvoda s martimex.hr (isti HTML i stil kao webshop) s gumbom i chatom |

## Kako isprobati

Stranica: **https://notturno-labs.github.io/martimex-hr-chat/pokusi/pitaj-marti/proba.html**

Probna traka na vrhu stranice:

- **artikl**: Dylan Blue (kao na martimex.hr), Crystal Noir (na akciji),
  Eros Parfum (bez veličina), ruž Creamy Delight (nijanse),
- **izgled chata**: kao na martimex.hr (s početnim ekranom) ili novi
  „Jedan ekran”,
- **Novi razgovor**: obriše razgovor iz preglednika i učita stranicu ispočetka.

Vrijedi probati: odabrati drugu veličinu ili nijansu pa opet „Pitaj Marti”,
prvo otvoriti chat običnim gumbom pa tek onda „Pitaj Marti”, osvježiti
stranicu usred razgovora. Uz `&pitajmarti=debug` na kraju adrese modul
zapisuje što radi u konzolu preglednika.

Chat na probnoj stranici razgovara s Voiceflow projektom **V2 - Martimex -
Live**, okruženje **„Radim gumb na webu”** (nacrt), a ne s Marti na webshopu.

## Kako radi

**Na stranici (`pitaj-marti.js`)** — podaci se čitaju sa same stranice u
trenutku pritiska, bez ikakvog dodatnog učitavanja (traje djelić
milisekunde): naziv, marka, vrsta, kategorija, odabrana varijanta, cijene
svih varijanti, stara cijena i najniža cijena u 30 dana, dostupnost, slika,
opis i pogodnosti. Izvori su podaci stranice (Alpine `x-data`
„singleProduct”), oznake gumba varijanti i JSON-LD.

- Razgovor još ne postoji → razgovor se pokrene, a podaci o artiklu idu uz
  njega (Voiceflow `launch`). Početni ekran chata se preskoči.
- Razgovor već traje → šalje se događaj `pitaj_marti`; razgovor i Martino
  pamćenje ostaju, a kartica i pitanje dođu na dno razgovora.
- Isti artikl (ista varijanta) već je u razgovoru → chat se samo otvori.
- Ako Voiceflow ipak ne pošalje podatke uz pokretanje razgovora, modul ih
  sam pošalje događajem (rezerva).

Gumb preuzme visinu, zaobljenje i slova gumba „Dodaj u košaricu”. Postavke
(natpis, sitni opis u gumbu, boje iskrice...) su na vrhu `pitaj-marti.js`
u `MX_PM_POSTAVKE`.

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

Redoslijed je važan — **prvo Voiceflow, pa tek onda GitHub**:

1. **Voiceflow**: okruženje „Radim gumb na webu” spojiti u Main (merge) i
   objaviti (Publish). Pažnja: ako se Main u međuvremenu mijenjao, merge te
   promjene pregazi — tada se promjene prenose ručno.
2. **Voiceflow (preporučeno)**: Agent → Behaviour → Events → New event
   `pitaj_marti`, radnja „Run workflow” → „Pitaj Marti”. Bez toga radi
   preko alata agenta, ali s događajem je odgovor usred razgovora brži.
3. **GitHub**: `pitaj-marti.js` premjestiti na vrh repozitorija i u
   `loader.js` u popis `MODULI` dodati redak `pitaj-marti.js`.

Na stranicama koje nisu stranica proizvoda gumb se ne pojavi, a chat radi
kao i prije.

## Što je provjereno

- Voiceflow (nacrt okruženja): pokretanje s artiklom, događaj usred
  razgovora, običan pozdrav kad razgovor nije pokrenut gumbom, pitanja o
  artiklu i promjena artikla usred razgovora.
- U pravom pregledniku, s pravim Voiceflow widgetom (webchat 2.207) i
  nacrtom okruženja: kartica i pitanje nakon prvog pritiska (oko 2 s),
  Martini odgovori na „Kakav je miris?”, „Koju veličinu odabrati?” i
  „Koju nijansu odabrati?” s podacima sa stranice, druga veličina usred
  razgovora, isti artikl (samo se otvori chat), artikl na akciji u izgledu
  „Jedan ekran”, ruž na mobitelu, te „Pitaj Marti” nakon običnog pozdrava.
- Automatski testovi (Chromium, računalo i mobitel, oba izgleda chata):
  jedan `launch` po pritisku (i kod dvostrukog klika), ispravni podaci o
  artiklu (veličina, nijansa, akcija, artikl bez varijanti), ponuđena
  pitanja, osvježena stranica, završen razgovor, klik prije nego se chat
  učitao, rezerva kad `launch` stigne bez artikla, i da obični „Start new
  chat” ostaje običan pozdrav.
