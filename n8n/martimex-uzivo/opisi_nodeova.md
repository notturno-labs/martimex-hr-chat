# Marti – Martimex uživo: opis nodeova

Isti tekstovi stoje kao sticky bilješke uz svaki node u n8n-u (workflow „Marti – Martimex uživo“, v1.6). Brojevi u naslovima odgovaraju redoslijedu koraka; slova A–E su ulazi (okidači), G1 i G2 obrada kvarova.

## Marti – Martimex uživo (v1.6): kako radi
Jedan alat za Marti. Marti pošalje pitanje kupca, workflow pronađe 1–3 stranice martimex.hr, pročita ih **uživo** i vrati kratak tekst s činjenicama. AI se ne koristi: svaka odluka je pravilo u kodu.

**Glavni put (pitanje kupca, obično 1,5–4 s):**\
A Zahtjev od Marti → 1 Učitaj indeks → 2 Pripremi upit → 3 Treba sitemape uživo? → 5 Odaberi stranice → 6 Što dalje? → 7 Dohvati stranice → 8 Treba drugi dohvat? → 11 Spoji dohvate → 12 Izvuci činjenice → 13 HTML u Markdown → 14 Sastavi odgovor → 15 Je li zahtjev od Marti? → 16 Vrati odgovor → 19 Redci za spremanje → 20 Spremi indeks\
Sporedni putovi: 4 Dohvati sitemape (kad je indeks stariji od 30 min, ili kad se po upitu ništa ne prepozna, a indeks je stariji od 2 min) i 9–10 drugi pokušaj dohvata.

**Održavanje (isti put, drugi ulaz):** C sitemapi svakih 25 min · D mapa brendova svakih 10 min · E samoprovjera svaka 3 h (06:15–21:15) · B ručni test. Nakon koraka 15 idu na 17 Zadatak uspio?: uspjeh se sprema (19, 20), a neuspjeh ide na 18. Iz rasporeda tada ERROR Workflow pošalje Telegram; ručni test samo završi crvenom greškom. Zadatak poslan webhookom ide na 16 i rezultat dobije u odgovoru.

**Indeks** (tablica „Marti - indeks weba“) zna samo GDJE je nešto. Cijene, zaliha i tekst uvijek se čitaju uživo.\
**Odgovor Marti** je uvijek HTTP 200: `{ ok, tip, tekst }` ili `{ ok:false, greska }`. Tip je proizvod, vise_proizvoda, popis, stranica ili nije_pronadjeno. Uz `format: "json"` u zahtjevu odgovor nosi i `podaci`: iste činjenice kao brojevi i polja.\
**Točnost:** cijena se uzima samo ako se slaže na tri mjesta na stranici (podaci varijante, prikazana cijena, ld+json) i ako su pročitane sve varijante. Inače alat ne kaže cijenu, nego `ok:false` i poveznicu.\
**Vremenska ograničenja:** stranica 8 s za pitanje kupca i samoprovjeru (drugi dohvat samo za pitanje, 5–8 s), 15 s za brendove; sitemap 10 s; cijeli workflow 28 s. Najviše 3 stranice istodobno.\
**Dojave:** Telegram stiže kad nešto stvarno ne radi (alat ne može izvući podatke ili su nedosljedni, web prespor za kupce, indeks se ne osvježava 2 h, interni kvar, i na pitanju kupca preko 16b, ista vrsta najviše jednom u 30 min). Kratko spor ili nedostupan web ne javlja grešku.\
**Boje bilježaka:** plava = ulazi i održavanje · žuta = glavni put · zelena = indeks (čitanje i spremanje) · crvena = greške i dojave.

### A · Zahtjev od Marti
(node: `Zahtjev od Marti`)

*Webhook – glavni ulaz*\
Ovdje Marti (Voiceflow alat „Martimex uzivo“) šalje pitanje kupca.
- Adresa: `POST /webhook/marti-martimex-uzivo`
- Tijelo (JSON ili obrazac): `upit` = što kupac traži, kratko; `url` = točna adresa na martimex.hr. Dovoljno je jedno od toga.
- Neobavezno `format: "json"`: uz tekst stižu i strukturirani podaci (`podaci`) za druge sustave. Marti ga ne treba.
- Zaštita: header `x-api-key`. Ključ provjerava sam n8n prema Header Auth credentialu odabranom na ovom nodeu. Bez ispravnog ključa vraća 403 i workflow se uopće ne pokrene.
- Node ne odgovara odmah. Odgovor šalje „16 Vrati odgovor“ (ili „G1 Vrati grešku“), uvijek s HTTP 200.
- Isti webhook prima i polje `zadatak` (sitemapi, brendovi, samoprovjera) za ručno pokretanje održavanja. Takav poziv ide na „16 Vrati odgovor“, ne na 17/18: rezultat stiže u odgovoru kao `{ ok, zadatak, opis }`, pročitano se sprema i kad zadatak nije uspio, a Telegram poruke nema.

### B · Ručni test
(node: `Ručni test`)

*Manual Trigger – proba u editoru*\
Pokreće se gumbom **Execute workflow**. Služi za probu bez Marti: rezultat se vidi u izvršavanju, a Marti se ništa ne šalje.\
Proba nije „na suho“: uspješan rezultat upisuje se u pravi indeks (19, 20), a ako neki node padne, „G2 Telegram“ pošalje poruku.\
Što se testira određuje sljedeći node, „B2 Primjeri upita“.

### B2 · Primjeri upita
(node: `Primjeri upita`)

*Code – testni zahtjev*\
Sadrži popis primjera (`PRIMJERI`) i šalje jedan: onaj s rednim brojem `PRIMJER` (0 = prvi). Šalje ga u istom obliku kao Marti (`body.upit`, `body.url`) ili kao zadatak (`body.zadatak`).\
Za drugi test promijeni broj ili dodaj svoj primjer.\
Ručni test ne ide na 16, nego na „17 Zadatak uspio?“. Uz `ok:true` rezultat se upiše u pravi indeks (19, 20); primjeri `sitemapi` i `brendovi` stvarno osvježe indeks i pomaknu red brendova. Ako je odgovor `ok:false` (npr. test nepostojeće stranice), izvršavanje namjerno završi crvenom greškom na nodeu 18, bez Telegram poruke. To je očekivano.

### C · Svakih 25 min: sitemapi
(node: `Svakih 25 min: sitemapi`)

*Schedule Trigger*\
Svakih 25 minuta osvježi indeks adresa iz sitemapa martimex.hr: novi i uklonjeni proizvodi, kategorije, brendovi i stranice.\
Zato je indeks obično mlađi od 30 minuta, pa Martina pitanja ne moraju čekati čitanje sitemapa.\
Ako neki sitemap ne uspije, ostali se spreme, a za njega ostaje stari popis; sljedeći pokušaj je za 25 min. Telegram stiže tek kad je obavezni dio indeksa (proizvodi, kategorije, brendovi, stranice) stariji od 2 h, i to jednom, zatim jednom dnevno dok se ne popravi. Nagli pad broja adresa (više od pola) ne prepisuje dobar indeks.\
Kad je indeks stariji od 30 min, pitanja bez url-a čitaju sitemape uživo (nekoliko sekundi dulje).

### C2 · Zadatak: sitemapi
(node: `Zadatak: sitemapi`)

*Set*\
Postavi `zadatak = "sitemapi"`. Po tome ostatak workflowa zna da ovo nije pitanje kupca nego održavanje: pročitati sve sitemape i spremiti ih u indeks.

### D · Svakih 10 min: brendovi
(node: `Svakih 10 min: brendovi`)

*Schedule Trigger*\
Svakih 10 minuta pročita sljedeće 3 stranice brendova (npr. /brand/versace/?pg=2), da web nikad ne slaže više od 3 stranice istodobno. Iz njih nastaje **mapa brendova**: popis proizvoda svakog brenda.\
Mapa treba jer adresa proizvoda najčešće ne sadrži ime brenda (npr. /eros-eau-de-parfum/). Krug svih brendova traje nekoliko sati, a zatim kreće ispočetka.\
Neuspjela stranica vraća se u red još jednom, a nakon drugog neuspjeha se preskače. Ako ne stigne nijedna od 3 stranice serije (web ne odgovara), ista serija ponavlja se bez trošenja pokušaja, najviše 6 puta zaredom. Stranica brenda bez ijedne kartice ne briše mapu. Ako se tablica indeksa ne učita, serija se preskače.\
Spor ili nedostupan web ovdje ne javlja grešku; promjenu izgleda popisa javlja samoprovjera.

### D2 · Zadatak: brendovi
(node: `Zadatak: brendovi`)

*Set*\
Postavi `zadatak = "brendovi"`: održavanje mape brendova, jedna serija od 3 stranice.

### E · Svaka 3 h: samoprovjera
(node: `Svaka 3 h: samoprovjera`)

*Schedule Trigger (cron `15 6-21/3 * * *`, vrijeme Zagreb: 06:15, 09:15, 12:15, 15:15, 18:15, 21:15)*\
Šest puta dnevno pročita 6 poznatih stranica: proizvod s više veličina, proizvod s jednom cijenom, ruž s nijansama, popis brenda Versace, /akcija/ i /dostava-i-isporuka/.\
Za svaku ulogu ima 2–3 kandidata; uzme prvi koji je u indeksu, pa uklonjen proizvod ne ruši provjeru. Timeout po stranici 8 s, kao za kupca; druga trojka kreće 4 s kasnije.\
Provjeri da alat iz njih još izvlači cijene, zalihu, nijanse, popis i tekst te da su stranice svježe.\
Telegram stiže kad se iz pročitane stranice ne mogu izvući podaci ili nisu dosljedni (promjena weba ili alata), kad testna stranica vrati 404, preusmjerenje ili zabranu, kad web ne odgovara za 3 ili više stranica (prespor i za kupce), kad na 2 ili više stranica nema oznake svježine, kad se tablica indeksa ne učita ili kad neki sitemap nije osvježen 36 h.\
Jedna ili dvije spore stranice i prazna /akcija/ samo su upozorenje: alat radi, web je bio spor.\
Ista greška javlja se jednom, pa ponovno u jutarnjoj provjeri (06:15); nova ili promijenjena greška odmah. Kad provjera prođe, pamćenje se briše.

### E2 · Zadatak: samoprovjera
(node: `Zadatak: samoprovjera`)

*Set*\
Postavi `zadatak = "samoprovjera"`.\
Za probu se ručnim testom ili webhookom može poslati i `pokvari=da`: doda se jedna namjerno pogrešna provjera, pa samoprovjera javi neuspjeh (ručni test: crvena greška na nodeu 18; webhook: `ok:false` u odgovoru). Telegram se pri takvoj probi ne šalje, jer ERROR Workflow pokreće samo neuspjeh iz rasporeda.

### 1 · Učitaj indeks
(node: `Učitaj indeks`)

*Data Table – čita sve retke*\
Učita cijelu tablicu **Marti - indeks weba**. To je „imenik“ weba:
- sitemapi: sve adrese proizvoda, kategorija, brendova, oznaka, stranica, bloga i beauty centara,
- `brend:<ime>`: mapa brendova (proizvodi svakog brenda),
- `stanje:brendovi`: red stranica brendova koje čekaju čitanje.

Indeks kaže samo GDJE je nešto. Cijene, zaliha i tekst nikad se ne uzimaju iz indeksa, nego se čitaju uživo.\
Ako tablica ne odgovori, workflow nastavlja s praznim indeksom.

### 2 · Pripremi upit
(node: `Pripremi upit`)

*Code*
1. Prepozna odakle je poziv došao (Marti, ručni test ili raspored) i pročita `upit`, `url`, `zadatak` i `format` (json ili tekst).
2. Očisti ulaz: nevidljive znakove, navodnike i zagrade. Vrijednosti poput „-“, „null“ ili „{upit}“ znače da polje nije poslano. Upit se skrati na 300 znakova, url na 500.
3. Iz redaka tablice složi indeks. Veliki zapisi spremljeni su u dijelovima (`ključ#0`, `ključ#1`…), pa ih spoji i provjeri da nijedan dio ne nedostaje.
4. Prepozna i grešku čitanja tablice (tada se indeks ne smatra praznim, a serija brendova se preskače). Ponovljeni redak istog dijela zapisa ne kvari zapis.
5. Izračuna koliko je indeks star i odluči treba li sitemape pročitati odmah: za zadatak sitemapi uvijek; za pitanje bez url-a ako je indeks stariji od 30 min ili ga nema (zadatak brendovi nikad: bez popisa brendova serija se preskače).

**Izlaz:** jedna stavka „odaberi“ ili 13 adresa sitemapa za čitanje.

### 3 · Treba sitemape uživo?
(node: `Treba sitemape uživo?`)

*If*
- DA: „Pripremi upit“ je odlučio da indeks treba odmah osvježiti → dolje na „4 Dohvati sitemape“.
- NE (gotovo uvijek, jer se indeks osvježava svakih 25 min) → ravno na „5 Odaberi stranice“.

### 4 · Dohvati sitemape
(node: `Dohvati sitemape`)

*HTTP Request (GET)*\
Uživo pročita XML sitemape martimex.hr, 13 datoteka: proizvodi (do 4 dijela), kategorije, oznake, brendovi, vrste, spol, note mirisa, stranice, blog i beauty centri.\
Timeout 10 s, prati do 3 preusmjerenja. Greška ne zaustavlja workflow: za neuspjeli sitemap ostaje stari popis, a uspjeli se spreme. Kad zadatak sitemapi javlja grešku, opisano je uz „C · Svakih 25 min“.\
Ovamo vodi i povratna veza iz „6 Što dalje?“: kad se po upitu ne prepozna ništa (ni proizvod, ni brend, ni kategorija, ni tema), a indeks je stariji od 2 min, indeks se osvježi i traži se još jednom (najviše jednom po pozivu).

### 5 · Odaberi stranice
(node: `Odaberi stranice`)

*Code – „mozak“ alata, bez AI-ja*\
Odluči koje stranice treba pročitati. Ako su upravo stigli sitemapi, najprije iz njih složi svježi indeks.

**Zadaci:** sitemapi → izvještaj i odluka o dojavi (vidi C); brendovi → sljedeće 3 stranice brendova iz reda; samoprovjera → 6 testnih stranica (prvi kandidat po ulozi koji je u indeksu).\
Svakoj stranici za čitanje zada timeout: pitanje kupca i samoprovjera 8 s, brendovi 15 s.

**Poslan `url`:** provjeri da je stranica s martimex.hr (odbija druge domene, /wp-admin, košaricu, račun, pretragu i datoteke) i čita baš nju; url ima prednost pred upitom, osim kad uz upit stigne nešto što nije adresa (npr. „nepoznato“) ili samo početna stranica. Ako uz url stigne i `upit`, on služi samo da se duga stranica skrati na traženi dio. Ako adrese proizvoda nema u indeksu, pripremi do 2 slična proizvoda (barem 60 % istih riječi u adresi) za slučaj da stranica ne postoji.

**Poslan `upit`:** riječi se pojednostave (mala slova, bez kvačica, „edp“ = parfum, sinonimi krema/cream…). Prepozna:
- temu (dostava, plaćanje, povrat, otkazivanje, poslovnice, kontakt, loyalty, poklon bon, akcija, novo, Chanel, FAQ…),
- brend, i po nadimku (YSL, D&G, JPG, MK…), te poznate brendove kojih nema u webshopu (Dior, Gucci…),
- kategoriju, spol, sortiranje („najjeftinije“), cijenu („do 80“, „iznad 50“), akciju, promo kod, note (cvjetni, voćni), niche i setove.

**Odluka:**
1. promo kod bez proizvoda i bez brenda → popis najpopularnijih parfema (na njemu se vide aktivni kodovi);
2. tema bez brenda i kategorije → 1–2 informativne stranice (akcija i novo → popis);
3. naziv proizvoda → bodovanje adresa proizvoda iz indeksa (uz prepoznatu kategoriju samo iz nje; uz potpunu mapu brenda samo proizvodi tog brenda, a nov proizvod koji još nije ni u jednoj mapi samo uz točan naziv): riječi naziva, točan naziv, EDP/EDT, kazna za setove; proizvodi drugog brenda otpadaju. Uzme jasnog pobjednika ili do 3 podjednako dobra, plus do 3 slična (slični se samo navedu kao poveznice, ne čitaju se). Spol iz upita („za žene“) daje prednost proizvodu s oznakom femme/donna…, a „za muškarce“ s oznakom homme/uomo…; nota iz upita („Eau Florale“) proizvodu s tom riječi. Veličina („100ml“, „3,4 g“) i riječi pitanja („veličine“, „za muža“) nisu dio naziva. Za jednog pobjednika zabilježi sadrži li adresa sve riječi i brojeve naziva iz upita i nije li za suprotni spol (ako ne, korak 14 doda napomenu);
4. brend nema proizvod tog naziva → odmah „nije pronađeno“ (bez osvježavanja indeksa) i najbliži proizvodi tog brenda; broj proizvoda brenda navede samo kad je mapa brenda potpuna (označena tako i s dovoljno proizvoda za broj stranica); ako indeks nije upotrebljiv, `ok:false` umjesto tvrdnje da nema;
5. samo brend, kategorija, spol ili filtri → stranica popisa s filtrima;
6. ništa nije prepoznato → ako je indeks stariji od 2 min, osvježi sitemape i pokuša još jednom (ne za brend koji poznato nije u ponudi, npr. Dior); inače „NIJE PRONAĐENO“ s najbližim brendovima, kategorijama i proizvodima.

**Izlaz:** `akcija` = dohvati (stranice za čitanje), sitemapi (najprije osvježi indeks) ili odgovori (gotov odgovor bez čitanja weba). Greška u logici odabira postane `ok:false` (bez Telegram poruke, osim za zadatak iz rasporeda); iznimka pri obradi upravo pročitanih sitemapa bilježi se kao neuspjeli sitemap.

### 6 · Što dalje?
(node: `Što dalje?`)

*Switch – raskrižje prema polju `akcija`*
- **sitemapi** → natrag na „4 Dohvati sitemape“ (osvježi indeks pa ponovno „5 Odaberi stranice“),
- **dohvati** → „7 Dohvati stranice“ (čitanje weba),
- **odgovori** → ravno na „14 Sastavi odgovor“: odgovor je već poznat (npr. nije pronađeno ili neispravan url), pa se web ne čita,
- **ostalo** (ne bi se smjelo dogoditi) → „14 Sastavi odgovor“, koji tada vrati grešku.

### 7 · Dohvati stranice
(node: `Dohvati stranice`)

*HTTP Request (POST)*\
Uživo čita odabrane stranice istodobno: za pitanje kupca 1–3, za brendove 3; samoprovjera ima 6–7 stranica, pa druga trojka kreće 4 s kasnije (`razmakMs`).
- **POST umjesto GET:** cache weba (LiteSpeed) ne odgovara na POST spremljenom kopijom, pa web stranicu složi svježe u tom trenutku. Cijena i zaliha su zato aktualne.
- Timeout po stranici zadaje korak 5 (`timeoutMs`): pitanje kupca i samoprovjera 8 s, brendovi 15 s. Preusmjerenja se ovdje ne prate; o njima odlučuje korak 8.
- Vraća cijeli odgovor (status, headere, HTML). Greška ne zaustavlja workflow, nego se obradi u koracima 8 i 12.

### 8 · Treba drugi dohvat?
(node: `Treba drugi dohvat?`)

*If – za svaku stranicu posebno*\
DA (dolje na „9 Dohvati ponovno“) kad:
- web nije odgovorio (timeout, mrežna greška) ili vraća grešku servera (5xx),
- stranica je preusmjerena (3xx) na drugu adresu na martimex.hr (ne na drugi web, ni adresu koja počinje s „//“),
- status je 200, ali HTML je nepotpun (nema kraja glavnog sadržaja).

NE (ravno na „11 Spoji dohvate“): uredna stranica, 404 i slično.\
Za zadatke (brendovi, samoprovjera) drugog dohvata nema: stranica je već imala dulji timeout, a neuspjeh se rješava u koraku 14 (ponavljanje serije, upozorenje).\
Ako su u ovom pozivu sitemapi već čitani uživo, drugog dohvata nema, da cijeli poziv stane u 28 s.

### 9 · Dohvati ponovno
(node: `Dohvati ponovno (preusmjerenje POST / rezervni GET)`)

*HTTP Request – drugi pokušaj*
- **Preusmjerenje:** POST na novu adresu iz headera `Location` (timeout 8 s), npr. proizvod kojem je promijenjena adresa.
- **Greška ili nepotpuna stranica (samo pitanje kupca):** običan GET iste adrese (timeout 5 s). GET smije doći iz cachea weba, zato korak 12 takvu kopiju prihvaća samo ako je stranica složena prije najviše 10 minuta; inače vraća `ok:false`.

Bolje „ne mogu provjeriti“ nego stara cijena.

### 10 · Označi: ponovljeni dohvat
(node: `Označi: ponovljeni dohvat`)

*Set*\
Rezultatu drugog pokušaja doda `ponovljeno = true`. Po tome „12 Izvuci činjenice“ zna da je ovo drugi pokušaj: kod preusmjerenja kao adresu stranice uzme novu adresu, a kod rezervnog GET-a prihvati kopiju samo ako nije starija od 10 min.

### 11 · Spoji dohvate
(node: `Spoji dohvate`)

*Merge (append)*\
Spoji u jedan popis stranice iz prvog pokušaja (ulaz 1) i stranice iz drugog pokušaja (ulaz 2), da se dalje obrađuju zajedno.

### 12 · Izvuci činjenice
(node: `Izvuci činjenice`)

*Code – posebno za svaku stranicu*\
Iz HTML-a izvuče podatke:
1. **Je li odgovor ispravan:** timeout, mrežna greška, 404, zabrana (403/429), greška servera, zaštita od botova ili nepotpun HTML → `ok:false` s razlogom.
2. **Svježina:** pročita kada je stranica složena. Kopiju iz cachea ili rezervnog GET-a stariju od 10 min, ili nepoznate starosti, odbije.
3. **Vrsta stranice:** proizvod, popis (kategorija, brend, akcija), članak ili informativna stranica; kod popisa i „stranica X od Y“ te adresa sljedeće stranice.
4. **Proizvod:** naziv, brend, kategorija; za svaku veličinu ili nijansu cijena, akcija (-%, redovna cijena, najniža u 30 dana) i zaliha; promo kod; rečenice o notama; opis. Označi ako proizvod nije traženog brenda (uspoređuje sa svim imenima brenda, npr. thoo = The House of Oud).
5. **Popis:** za svaki proizvod naziv, brend, vrsta, cijena ili raspon, akcija, promo, oznake i „nije na zalihi“; potkategorije.
6. **Informativna stranica:** izreže glavni sadržaj i očisti ga (izbornici, filtri, slike, skriveni dijelovi, obrasci) za pretvorbu u tekst.
7. **Unakrsna provjera:** cijena svake veličine ili nijanse mora biti ista u podacima varijante, u prikazanoj cijeni i u ld+json; svaki gumb varijante mora biti pročitan; redovna cijena mora biti prava cijena i veća od akcijske. Popis mora imati pročitane sve kartice i većinu s cijenom. Ako nešto ne štima, stranica se ne koristi (`ok:false`, vrsta `izvlacenje`): bolje bez cijene nego s krivom. Javlja se cijena kako je web prikazuje (zaokružena); proizvod za koji web cijenu uopće ne prikazuje ostaje bez cijene, nikad 0,00 €.

Usput zapamti obavijesti s vrha weba (npr. „Besplatna dostava iznad 75€“) da ih korak 14 doda u odgovor; u indeks se ne spremaju.

### 13 · HTML u Markdown
(node: `HTML u Markdown`)

*Markdown*\
Pretvori očišćeni HTML (tekst informativne stranice ili opis proizvoda) u čitljiv tekst s naslovima (Markdown).\
Za popise i neuspjele stranice HTML je prazan, pa ovdje nema posla.

### 14 · Sastavi odgovor
(node: `Sastavi odgovor`)

*Code – tekst za Marti*\
Od svih pročitanih stranica složi **jedan** kratak odgovor.

**Pitanje kupca:**
- Zaglavlje: „UŽIVO s martimex.hr · datum i vrijeme · stranica generirana prije X s“.
- **Proizvod:** naziv · brend · vrsta, adresa, redak po veličini ili nijansi (cijena, akcija, zaliha), promo kod, kratka nota, obavijest s weba i do 3 „SLIČNO“ (bez cijena, samo ako stane). Proizvodi drugog brenda se izostave. Kad kupac pita za miris, note, sastav ili upotrebu (ili je poslan url), umjesto kratke note dođe opis s weba.
- **Više proizvoda:** do 3 bloka i uputa Marti da pita kupca koji misli.
- **Popis:** naslov, „stranica X od Y“, filtri riječima, sljedeća stranica, aktivni promo kodovi i redak po proizvodu.
- **Informativna stranica:** tekst stranice. Duga stranica se skrati na odlomke koji odgovaraju upitu (npr. samo zagrebačke poslovnice), dugi popisi se sažmu, a ostali odlomci se navedu po naslovu.
- **Neuspjeh:** `ok:false` s razlogom, npr. 404 s prijedlogom prave adrese. Nedosljedna stranica (korak 12): poruka da se podaci ne mogu pouzdano pročitati, s poveznicom i bez ijednog iznosa (detalji idu samo vlasniku).
- **Odabir po sličnosti:** ako stranica jedinog proizvoda (naziv, nijanse, veličine) ne sadrži sve riječi iz upita ili je proizvod za suprotni spol od traženog, na vrh doda napomenu da Marti provjeri s kupcem. Kad je upitu odgovaralo više proizvoda, a pročitan je samo jedan, Marti dobije uputu da pita kupca.
- **JSON način** (`format: "json"`): odgovoru doda `podaci` sa svim stranicama: po varijanti `cijena`, `redovnaCijena`, `najnizaCijena30d` (brojevi), `akcijaPct`, `naAkciji`, `naZalihi` (true/false/null); za popis svaki proizvod; za informativnu stranicu tekst; za grešku `vrstaGreske`. Tekst ostaje isti.
- **Najveća duljina:** 800 znakova po proizvodu + 700 (s opisom s weba + 2.400), popis 5.300, stranica 13.500; duži tekst se skrati.

**Zadaci:** izvještaj o sitemapima; za brendove nova mapa brenda i red sljedećih stranica (spor web nije greška); za samoprovjeru ocjena svake stranice: neizvučeni ili nedosljedni podaci, 404/preusmjerenje/zabrana testne stranice, nestala oznaka svježine ili 3+ nedostupne stranice = greška, 1–2 spore stranice ili prazna /akcija/ = upozorenje; ista greška iz rasporeda ne javlja se ponovno do jutarnje provjere.\
Usput napravi mapu za brend koji je još nema (postojeće mape održava samo serija brendova). Stranice slaže redom kao korak 5, i kad je neka stigla iz drugog pokušaja.\
**Izlaz:** uvijek točno jedna stavka: `odgovor`, `spremi` (što treba upisati u indeks), `zadatak`, `webhook`, `interna` (opis interne greške ili nedosljedne stranice, ili prazno, za 16b), `trajanjeMs`. Ista vrsta dojave na pitanju kupca ide najviše jednom u 30 min (pamti se u podacima workflowa; tada je opis u `internaPrigusena`).

### 15 · Je li zahtjev od Marti (webhook)?
(node: `Je li zahtjev od Marti (webhook)?`)

*If*
- DA (poziv s webhooka) → „16 Vrati odgovor“.
- NE (ručni test ili zadatak iz rasporeda) → „17 Zadatak uspio?“. Tada nema kome odgovoriti; rezultat se samo sprema ili se javlja greška.

### 16 · Vrati odgovor
(node: `Vrati odgovor`)

*Respond to Webhook*\
Pošalje Marti JSON `{ ok, tip, tekst }` ili `{ ok:false, greska }` (uz `format: "json"` i `podaci`), uvijek s HTTP 200. Tako Voiceflow uvijek pročita sadržaj, pa i poruku o grešci, umjesto da prijavi tehničku grešku.\
Nakon slanja workflow nastavlja na spremanje indeksa (19, 20); Marti to više ne čeka.

### 16b · Interna greška u odgovoru?
(node: `Interna greška u odgovoru?`)

*If – nakon odgovora Marti*\
Marti je odgovor već dobila. Ovdje se provjeri je li taj odgovor nastao zbog kvara alata (polje `interna` iz koraka 14: iznimka u kodu nodeova 5, 12 ili 14, nijedna stranica nije obrađena ili podaci na stranici nisu dosljedni). Ista vrsta javlja se najviše jednom u 30 min.
- DA → „G2 Telegram“: vlasnik dobije poruku s opisom kvara i zahtjevom.
- NE (gotovo uvijek) → ništa dalje.\
Spor web, 404, nepostojeći proizvod i slično nisu interne greške i ne šalju poruku.

### 17 · Zadatak uspio?
(node: `Zadatak uspio?`)

*If – samo ručni test i raspored*
- `odgovor.ok = true` → „19 Redci za spremanje“: rezultat se upiše u indeks.
- inače → „18 Zadatak nije uspio“.

### 18 · Zadatak nije uspio
(node: `Zadatak nije uspio (ERROR Workflow → Telegram)`)

*Stop and Error*\
Namjerno zaustavi izvršavanje s porukom „Martimex uživo – zadatak X: opis problema“.\
U postavkama workflowa kao Error workflow postavljen je **ERROR Workflow**: n8n ga tada pokrene, a on pošalje Telegram poruku vlasniku.\
Radi za izvršavanja iz rasporeda, ne za ručni test. Iz neuspjelog zadatka ništa se ne sprema.

### 19 · Redci za spremanje
(node: `Redci za spremanje`)

*Code*\
Uzme popis `spremi` (svježi sitemapi, mapa brendova, stanje reda brendova) i svaki zapis pretvori u tekst (JSON).\
Duge zapise reže na dijelove do 60.000 znakova (`ključ#0`, `ključ#1`…) i uz svaki zapiše koliko dijelova ima, da se pri čitanju vidi je li zapis cijeli.\
Ako nema ništa za spremiti, izlaz je prazan i korak 20 se ne izvodi.

### 20 · Spremi indeks
(node: `Spremi indeks`)

*Data Table – upsert*\
Upiše retke u tablicu **Marti - indeks weba**. Ako redak s istim `prefiks` (ključ#dio) postoji, prepiše ga, inače doda novi.\
Stupci: `prefiks`, `at` (vrijeme), `broj` (broj dijelova), `rows` (podaci).\
Pri čitanju se uzima samo najnovija verzija zapisa, pa višak starih dijelova ne smeta.\
Ako upis ne uspije → „G2 Telegram“.

### G1 · Vrati grešku (sustav)
(node: `Vrati grešku (sustav)`)

*Respond to Webhook – rezervni izlaz za kvarove*\
Ovamo vode izlazi „error“ nodeova 2, 5, 12, 13, 14 i 19, ali samo kad node stvarno padne: iznimka u nodeovima 2 i 19 (nemaju vlastito hvatanje grešaka), greška Markdown nodea ili problem s izvršnim okruženjem n8n-a.\
Ako Marti još nije dobila odgovor, dobije `ok:false` (HTTP 200) s porukom da pokuša ponovno i da cijene i dostupnost ne navodi napamet. Zatim ide Telegram poruka.\
Uobičajene greške (404, timeout…) i iznimke u glavnoj logici nodeova 5, 12 i 14 kod hvata sam i vraća kao `ok:false` normalnim putem. Za iznimke Telegram svejedno stiže: na pitanju kupca preko 16b, za zadatak iz rasporeda preko 18.

### G2 · Telegram: greška alata
(node: `Telegram: greška alata`)

*Telegram*\
Pošalje vlasniku poruku „Marti alat … – interna greška: … Izvršavanje: broj“ i zahtjev (zadatak, upit, url). Uspješno završena izvršavanja se ne spremaju, zato su detalji u poruci.\
Poziva se iz „G1 Vrati grešku“, iz „16b Interna greška u odgovoru?“ i kad „20 Spremi indeks“ ne uspije upisati u tablicu.\
Šalje jednu poruku i kad stigne više stavki; ako Telegram ne radi, workflow ne pada.
