// Testovi v1.7 (uz test_baterija_v17.js i test_kontrola_v17.js): ispravci nakon analize poziva iz Voiceflowa.
const fs = require('fs');
const path = require('path');
const { run, CODE, pipeline } = require('./harness.js');
let pass = 0, fail = 0;
const ok = (uvjet, opis) => { if (uvjet) pass++; else { fail++; console.log('  NE PROLAZI:', opis); } };
const tiho = f => { const l = console.log; console.log = () => {}; try { return f(); } finally { console.log = l; } };
const B = u => tiho(() => pipeline(typeof u === 'string' ? { upit: u } : u)).B;
const put = u => String(u || '').replace('https://martimex.hr', '');

// razgovor iz testiranja (2.11.): košarica → sljedeći korak; Marti je poslala „kako naručiti, košarica, nastavak na plaćanje“
{
  let b = B('kako naručiti, košarica, nastavak na plaćanje');
  ok(b.akcija === 'dohvati' && /najcesca-pitanja/.test(b.url), 'tema: košarica / naručivanje → FAQ (Naručivanje), ne plaćanje (' + put(b.url) + ')');
  b = B('Stavila sam u kosaricu i sad moram platiti. Ne vidim slijedeci korak, gdje trebam kliknuti dalje?');
  ok(b.akcija === 'dohvati' && /najcesca-pitanja/.test(b.url), 'tema: cijela rečenica kupca o košarici → FAQ (' + put(b.url) + ')');
  b = B('rok za povrat');
  ok(/povrat-i-reklamacija/.test(b.url), '„rok za povrat“ → povrat, ne dostava (' + put(b.url) + ')');
  b = B('pokloni uz kupnju');
  ok(/pokloni-uz-kupnju/.test(b.url), '„pokloni uz kupnju“ → stranica poklona uz kupnju (' + put(b.url) + ')');
  b = B('prigovor');
  ok(/najcesca-pitanja/.test(b.url), '„prigovor“ → FAQ (' + put(b.url) + ')');
}
// set ne potiskuje parfem istog imena kad kupac ne traži set
{
  const b = B('versace dylan blush pink');
  ok(/dylan-blush-pink-pour-femme-eau-de-parfum/.test(b.url), '„versace dylan blush pink“ → prvo EDP, ne set (' + put(b.url) + ')');
  const s = B('versace dylan blush pink set');
  ok(/set/.test(s.url), '„… set“ → set (' + put(s.url) + ')');
}
// riječi naziva ne smiju pogoditi kategoriju njege (Red Musk ≠ muška njega; Anti-Age Booster u drugoj kategoriji)
{
  let b = B('ARMANI Si Passione Red Musk Eau de Parfum');
  ok(/si-passione-red-musk-eau-de-parfum/.test(b.url), '„Red Musk“ → taj parfem, ne muška njega (' + put(b.url) + ')');
  b = B('EISENBERG Youth Treatment Lotion II Ultra Moisturising Plumping Anti-Age Booster');
  ok(/youth-treatment-lotion-ii/.test(b.url), '„Anti-Age Booster“ u nazivu → taj proizvod (' + put(b.url) + ')');
  b = B('anti age krema');
  ok(b.akcija === 'dohvati', '„anti age krema“ → nešto se čita (' + put(b.url) + ')');
}
// apostrof u nazivu (L’Homme, J’OSE, L’Absolu)
{
  ok(/lhomme-eau-de-parfum/.test(B('Elie Saab L’Homme Eau de Parfum').url), 'L’Homme → lhomme');
  ok(/jose-femme-deodorant-spray/.test(B('Eisenberg J’OSE Femme Deodorant Spray').url), 'J’OSE → jose');
  ok(/labsolu-rouge-cream/.test(B("Lancome L'Absolu Rouge Cream").url), 'L\'Absolu → labsolu');
  ok(/penhaligons/.test(B("penhaligon's").url || ''), 'apostrof u sredini riječi ostaje (Penhaligon\'s)');
}
// brend koji nije u ponudi: bez sličnih proizvoda drugih brendova
{
  for (const u of ['hermes terre', 'dior sauvage']) {
    const b = B(u);
    ok(b.akcija === 'odgovori' && /nije na popisu brendova/.test((b.kontekst.rezultat || {}).tekst || ''), u + ' → brend nije u ponudi');
  }
}
// „nova“ = najnovije, osim u nazivu proizvoda (Skin Nova)
{
  ok(/skin-nova-sc-serum/.test(B('skin nova serum').url), 'Skin Nova ostaje naziv proizvoda');
  ok(/sort=2/.test(B('nova maskara').url || ''), '„nova maskara“ → maskare po najnovijem');
}
// engleske riječi tema i adresa u polju upit
{
  ok(/dostava-i-isporuka/.test(B('delivery cost').url), 'delivery → dostava');
  ok(/povrat-i-reklamacija/.test(B('refund').url), 'refund → povrat');
  let b = B({ upit: 'https://martimex.hr/akcija/', url: '-' });
  ok(put(b.url) === '/akcija/', 'adresa u polju upit čita se kao url (' + put(b.url) + ')');
  b = B({ upit: '/brand/versace/' });
  ok(put(b.url) === '/brand/versace/', 'putanja u polju upit čita se kao url (' + put(b.url) + ')');
  b = B({ upit: 'versace eros', url: '-' });
  ok(/eros/.test(b.url), 'običan upit ostaje upit');
}
// akcija uz brend: prikazuju se i proizvodi s promo kodom (popust u košarici)
{
  const samples = fs.existsSync(path.join(__dirname, 'samples')) ? path.join(__dirname, 'samples') : path.join(__dirname, '..', 'samples');
  const html = fs.readFileSync(path.join(samples, 'brand_versace.html'), 'utf8').replace(/__wc_fb_page_generated\s*=\s*\d+/, '__wc_fb_page_generated = ' + Math.floor(Date.now() / 1000));
  const st = run(CODE.C, 'each', [{ json: { statusCode: 200, headers: { 'content-type': 'text/html' }, body: html } }], { 'Odaberi stranice': [{ json: { url: 'https://martimex.hr/brand/versace/', uloga: 'popis', kontekst: {} } }], 'Dohvati stranice': [{ json: {} }] })[0].json;
  const sPromo = st.popis.proizvodi.filter(p => p.promo && p.promo.length && !p.naAkciji && !p.redovna).length;
  const d = run(CODE.D, 'all', [{ json: Object.assign({}, st, { markdown: '' }) }], { 'Pripremi upit': [{ json: { idx: {} } }], 'Odaberi stranice': [{ json: { url: st.url, kontekst: { tip: 'popis', akcijaFilter: true, brend: 'versace' } } }] })[0].json.odgovor;
  ok(/na akciji ili s promo kodom/.test(d.tekst) || /nije na akciji niti ima promo kod/.test(d.tekst), 'akcija uz brend: poruka spominje promo kod');
  if (sPromo) ok(/Promo/.test(d.tekst), 'akcija uz brend: proizvodi s promo kodom ostaju u popisu (' + sPromo + ' na uzorku)');
}
// nalazi pregleda koda (v1.7): opće riječi, glagoli kupnje, cijena, sortiranje, poklon, akcija, brend + tema, putanje stranica
{
  const T = [
    // glagol „naručiti“ uz kategoriju ne vodi na FAQ
    ['mogu li naruciti maskaru', /\/kategorija\/makeup\/oci\/maskare\//],
    ['zelim naruciti sampon', /\/kategorija\/kosa\/samponi\//],
    ['narucila bih maskaru', /\/kategorija\/makeup\/oci\/maskare\//],
    ['mogu li naruciti kremu za suncanje', /\/kategorija\/njega\/suncanje\//],
    // dvosmislene opće riječi (rok, zadržava, osoba, broj, brisanje) ne biraju stranicu same
    ['koliki je rok trajanja parfema', null, /dostava-i-isporuka/],
    ['koji parfem se dugo zadrzava na kozi', null, /poslovnice/],
    ['parfem za stariju osobu', null, /kontakt/],
    ['broj 5 ruz', null, /kontakt/],
    ['maramice za brisanje sminke', null, /pravila-privatnosti/],
    // ali opća riječ bez dvosmislenosti i dalje vodi na temu
    ['gdje je moja narudžba', /najcesca-pitanja/],
    ['kad stize narudzba', /dostava-i-isporuka/],
    ['koje kartice primate', /placanje-robe/],
    // novo, akcija i vrijeme
    ['novo stiglo', /\/novo\//],
    ['akcije za vikend', /\/akcija\//],
    ['Što imate na akciji ovaj tjedan?', /\/akcija\//],
    ['black friday', /\/akcija\//],
    ['black friday muski parfemi', /\/kategorija\/parfemi\/\?gender=32/],
    // poklon
    ['sto kupiti tati za rodendan', /\/vrsta\/setovi\/\?gender=32/],
    ['sta kupiti curi za godisnjicu', /\/vrsta\/setovi\/\?gender=31/],
    ['poklon za voljenu osobu', /\/vrsta\/setovi\//],
    ['Imate li parfemske setove za poklon?', /\/vrsta\/setovi\//],
    // cijena i sortiranje
    ['zenski parfemi ispod 50 eura', /\/kategorija\/parfemi\/\?gender=31&maxPrice=50/],
    ['parfemi iznad 100 eura', /\/kategorija\/parfemi\/\?minPrice=100/],
    ['parfem max 50 eura', /\/kategorija\/parfemi\/\?maxPrice=50/],
    ['najpopularniji parfemi', /\/kategorija\/parfemi\/\?sort=1/],
    ['top parfemi za zene', /\/kategorija\/parfemi\/\?gender=31&sort=1/],
    ['tko je najbolji parfem', /\/kategorija\/parfemi\/\?sort=1/],
    ['nesto novo od lancomea', /\/brand\/lancome\/\?sort=2/],
    ['versace novo', /\/brand\/versace\/\?sort=2/],
    // teme
    ['tko proizvodi lattafa parfeme', /\/brand\/lattafa\//],
    ['tko ste vi', /\/o-nama\//],
    ['brisanje racuna', /pravila-privatnosti/],
    ['potvrda o kupnji za reklamaciju', /povrat-i-reklamacija/],
    ['želim razgovarati s osobom', /\/kontakt\//],
    ['versace akcija tjedan', /\/brand\/versace\//],
    ['furla butik zagreb', /\/furla\//],
    ['Mogu li vratiti YSL ruž ako mi ne odgovara nijansa?', /povrat-i-reklamacija/],
    ['Martimex Arena centar', /\/poslovnice\//],
  ];
  for (const [u, ocek, ne] of T) {
    const b = B(u);
    if (ocek) ok(b.akcija === 'dohvati' && ocek.test(b.url || ''), '„' + u + '“ → ' + ocek + ' (' + put(b.url) + ')');
    if (ne) ok(!ne.test(b.url || ''), '„' + u + '“ ne smije na ' + ne + ' (' + (put(b.url) || b.akcija) + ')');
  }
  // putanja stranice (ne samo proizvoda/kategorije) poslana u polju upit
  for (const pth of ['/kontakt-furla/', '/parfemi-akcija/', '/otkazivanje-povrat/', '/chanel-beauty-appointment/']) {
    const b = B({ upit: pth });
    ok(put(b.url) === pth, 'putanja ' + pth + ' u polju upit čita se kao url (' + put(b.url) + ')');
  }
}
// nalazi pregleda koda (v1.7): pogodak proizvoda ne smije pokvariti riječ više, „parfem“, riječ slična brendu ni tema
{
  const T = [
    ['pure perfection 100 n cream extraordinary za poklon', /pure-perfection-100-n-cream-extraordinary/],
    ['parfemska voda le parfum eau de parfum set', /le-parfum-eau-de-parfum-50ml-set/],
    ['lash clash black friday', /mascara-lash-clash/],
    ['parfem apom', /apom-eau-de-parfum/],
    ['apom parfem', /apom-eau-de-parfum/],
    ['ženski parfem najim parfum', /najim-parfum-5-ml/],
    ['parfem hermetica peony pop', /hermetica-peony-pop/],
    ['parfem carparfum dispenser chrome', /carparfum-dispenser-chrome/],
    ['the merchant of venice la fenice pour homme', /la-fenice-pour-homme/],
    ['the merchant of venice fenice extrait', /fenice-extrait/],
    ['d&g dolce peony', /dolce-peony/],
    ['eisenberg aura maris', /aura-maris/],
    ['granado granada', /granada-eau-de-parfum/],
    ['paco rabane', /\/brand\/paco-rabanne\//],
    ['furla torbica', /furla-toaletna-torbica/],
    ['torbica', /\/proizvod\/.*torbica/],
    ['furla torbe', /\/furla\//],
    ['za brata furla autentica eau de parfum', /furla-autentica-eau-de-parfum/],
    ['promo calendrier de lavent krema', /promo-calendrier-de-lavent/],
    ['nova skin', /skin-nova/],
  ];
  for (const [u, ocek] of T) { const b = B(u); ok(b.akcija === 'dohvati' && ocek.test(b.url || ''), '„' + u + '“ → ' + ocek + ' (' + (put(b.url) || b.akcija) + ')'); }
}
// nalazi pregleda koda (v1.7): riječi oštećenja, usluge, „čovjek“, „stick“, brend koji nije u ponudi
{
  const T = [
    ['sampon za ostecenu kosu', null, /povrat-i-reklamacija/],
    ['John Frieda ostecena kosa', null, /povrat-i-reklamacija/],
    ['krema za slomljene nokte', /pink-butter-nourishing-hand-nail-cream/],
    ['parfem je stigao razbijen', /povrat-i-reklamacija/],
    ['nedostaje proizvod u paketu', /povrat-i-reklamacija/],
    ['dobio sam pogrešan proizvod', /povrat-i-reklamacija/],
    ['poslali ste mi pogresnu nijansu', /povrat-i-reklamacija/],
    ['parfem za covjeka', /\/kategorija\/parfemi\/\?gender=32/],
    ['Versace parfem za covjeka', /\/brand\/versace\/\?gender=32/],
    ['želim razgovarati sa živim čovjekom', /\/kontakt\//],
    ['stick', /stick/],
    ['kad će stići paket', /dostava-i-isporuka/],
    ['blagdanski set', /\/vrsta\/setovi\//],
    ['britanski parfem', null, /poslovnice/],
    ['split ends sampon', null, /poslovnice/],
    ['rezervni punjac parfema', null, /beauty/],
    ['krema za depilaciju', null, /beauty/],
    ['set za manikuru', null, /beauty/],
    ['salonska njega kose', null, /beauty/],
    ['imate li manikuru', /beauty-centri/],
    ['pedikura u Zagrebu', /beauty-centri/],
    ['termin za manikuru', /beauty-centri/],
    ['Gucci Good Girl', /good-girl/],
    ['Dior Born in Roma', /born-in-roma/],
  ];
  for (const [u, ocek, ne] of T) {
    const b = B(u);
    if (ocek) ok(b.akcija === 'dohvati' && ocek.test(b.url || ''), '„' + u + '“ → ' + ocek + ' (' + (put(b.url) || b.akcija) + ')');
    if (ne) ok(!ne.test(b.url || ''), '„' + u + '“ ne smije na ' + ne + ' (' + (put(b.url) || b.akcija) + ')');
  }
  const g = B('Gucci Good Girl');
  ok(/Gucci/.test((g.kontekst || {}).napomena || ''), 'brend koji nije u ponudi: napomena da je proizvod drugog brenda');
}
// nalazi pregleda (oblik upita iz Voiceflow ugovora): ključna riječ teme prva, brend u nazivu, kategorija u nazivu, spol iz oznake
{
  const sel = u => { const l = console.log; console.log = () => {}; try { const r = require('./test_baterija_v17.js').selB({ upit: u }); return r; } finally { console.log = l; } };
  const T = [
    ['loyalty registracija', ['/loyalty-program/', '/najcesca-pitanja/']],
    ['otkazivanje narudžbe prijava', ['/otkazivanje-povrat/']],
    ['odustajanje od kupnje registracija', ['/otkazivanje-povrat/']],
    ['dostava košarica', ['/dostava-i-isporuka/', '/najcesca-pitanja/']],
    ['kontakt radno vrijeme', ['/kontakt/', '/poslovnice/']],
    ['chanel registracija', ['/chanel/']],
    ['koliko se plaća poštarina', ['/dostava-i-isporuka/']],
  ];
  for (const [u, prve] of T) { const r = sel(u); const p = r.urls.map(put); ok(prve.every((x, i) => p[i] === x), '„' + u + '“ → ' + prve.join(' + ') + ' (' + p.join(' + ') + ')'); }
  const P = [
    ['Mugler Alien Goddess', /alien-goddess/, 'mugler'],
    ['Alien Goddess Mugler', /alien-goddess/, 'mugler'],
    ['Lancôme Lash Idôle Curl Goddess', /lash-idole-curl-goddess/, 'lancome'],
    ['Collistar Multi Active Deodorant', /multi-active-deodorant/, 'collistar'],
    ['Juvena masažer za lice', /juvena-masazer-za-lice/, 'juvena'],
    ['Juvena roller za lice', /juvena-roller-za-lice/, 'juvena'],
    ['Pupa Milano', /\/brand\/pupa\//, 'pupa'],
    ['Emanuel Ungaro', /\/brand\/ungaro\//, 'ungaro'],
    ['niche najnovije', /\/vrsta\/niche\/\?sort=2/, null],
    ['ženski parfem love eau de parfum za poklon', /\/love-eau-de-parfum\//, null],
    ['muški parfem silenzio parfum kao poklon', /silenzio-parfum/, null],
    ['parfemska voda frammenti eau de parfum ljeto', /frammenti-eau-de-parfum/, null],
    ['Paradoxe kao Dior', /paradoxe-eau-de-parfum/, null],
    ['sto kupiti seki', /\/vrsta\/setovi\//, null],
    ['sto kupiti bratu', /\/vrsta\/setovi\/\?gender=32/, null],
    ['tretmani lica', /\/beauty-centri\//, null],
  ];
  for (const [u, re, br] of P) { const r = sel(u); ok(r.akcija === 'dohvati' && r.urls.some(x => re.test(x)) && (!br || r.brend === br), '„' + u + '“ → ' + re + (br ? ' (brend ' + br + ')' : '') + ' (' + r.urls.map(put).join(' + ').slice(0, 160) + ' | ' + r.brend + ')'); }
  const dh = sel('Versace Dylan Blue pour homme');
  ok(dh.urls.length && !dh.urls.some(x => /pour-femme/.test(x)), '„Versace Dylan Blue pour homme“ bez pour femme (' + dh.urls.map(put).join(' + ') + ')');
  const dior = sel('Dior Homme');
  ok(dior.akcija === 'odgovori' && dior.tip === 'nije_pronadjeno', '„Dior Homme“ → nije pronađeno (ne tuđi Pour Homme)');
  const sav = sel('savjeti njega lica');
  ok(!sav.urls.some(x => /ideje-za-rodendan/.test(x)), '„savjeti njega lica“ bez članka o rođendanu (' + sav.urls.map(put).join(' + ') + ')');
}
// ručni test nacrta (2.11.): set istog naziva nije druga mogućnost; promo kod kad nijedan proizvod nema kod
{
  const b = B('Versace Dylan Blush Pink');
  ok(b.kontekst && b.kontekst.tip === 'proizvod' && /dylan-blush-pink-pour-femme-eau-de-parfum/.test(b.url), '„Versace Dylan Blush Pink“ → samo EDP, bez setova (' + put(b.url) + ', ' + (b.kontekst || {}).tip + ')');
  const samples = fs.existsSync(path.join(__dirname, 'samples')) ? path.join(__dirname, 'samples') : path.join(__dirname, '..', 'samples');
  const html = fs.readFileSync(path.join(samples, 'brand_versace.html'), 'utf8').replace(/__wc_fb_page_generated\s*=\s*\d+/, '__wc_fb_page_generated = ' + Math.floor(Date.now() / 1000));
  const st = run(CODE.C, 'each', [{ json: { statusCode: 200, headers: { 'content-type': 'text/html' }, body: html } }], { 'Odaberi stranice': [{ json: { url: 'https://martimex.hr/kategorija/parfemi/?sort=1', uloga: 'popis', kontekst: {} } }], 'Dohvati stranice': [{ json: {} }] })[0].json;
  st.popis.proizvodi.forEach(p => { p.promo = []; });
  const kk = { tip: 'popis', promoUpit: true, napomena: 'Promo kodovi vrijede za pojedine proizvode i mogu vrijediti i izvan parfema: aktivni kodovi su u retku „Promo kodovi na ovoj stranici“ i u oznakama „| Promo: …“ uz proizvode. Za konkretan proizvod pozovi alat s njegovim nazivom.' };
  const d = run(CODE.D, 'all', [{ json: Object.assign({}, st, { markdown: '' }) }], { 'Pripremi upit': [{ json: { idx: {} } }], 'Odaberi stranice': [{ json: { url: st.url, kontekst: kk } }] })[0].json.odgovor;
  ok(/nijedan proizvod na ovoj stranici .*nema aktivan promo kod/.test(d.tekst), 'promo kod bez aktivnih kodova: odgovor to izričito kaže');
  ok(!/aktivni kodovi su u retku/.test(d.tekst), 'promo kod bez aktivnih kodova: bez upute na nepostojeći redak');
}
// ručni test nacrta (2.11.), kritičari: sadržaj odgovora
{
  const { DateTime } = require('luxon');
  const t = DateTime.fromObject({ year: 2026, month: 11, day: 2, hour: 14 }, { zone: 'Europe/Zagreb' }).toMillis();
  const pravi = Date.now; Date.now = () => t;
  let d;
  try {
    const md = '## Pokloni uz kupnju\n\n## Pupa\nUz kupnju Pupa Vamp! maskare, poklanjamo Vam Pupa kozmetičku torbicu.\n\n_*ponuda traje do 31. 10. 2026. ili do isteka zaliha_\n\n## Floraiku\nUz kupnju bilo kojeg Floraiku mirisa poklanjamo Just a Rose 5 ml.\n\n_*ponuda traje do 30. 11. 2026. ili do isteka zaliha_';
    d = run(CODE.D, 'all', [{ json: { ok: true, tip: 'stranica', url: 'https://martimex.hr/pokloni-uz-kupnju/', naslov: 'Pokloni uz kupnju', ocekuj: 'tekst', markdown: md, generirano: Math.floor(t / 1000), starostS: 1, obavijesti: ['Besplatna dostava iznad 75€', 'Poklon uz svaku kupnju iznad 10€'] } }],
      { 'Pripremi upit': [{ json: { idx: {} } }], 'Odaberi stranice': [{ json: { url: 'https://martimex.hr/pokloni-uz-kupnju/', kontekst: { tip: 'stranica', tema: 'pokloni-uz-kupnju', tokeni: [], tokeniTeme: ['pokloni'] } } }] })[0].json.odgovor;
  } finally { Date.now = pravi; }
  ok(/ponuda trajala do 31\. 10\. 2026\./.test(d.tekst) && !/30\. 11\. 2026\.,/.test(d.tekst), 'istekla ponuda (31. 10.) dobiva napomenu, važeća (30. 11.) ne');
  ok(/Poklon uz svaku kupnju iznad 10€/.test(d.tekst), 'informativna stranica: obavijesti s vrha weba (poklon uz svaku kupnju) su u odgovoru');
  const sel = u => { const l = console.log; console.log = () => {}; try { return require('./test_baterija_v17.js').selB({ upit: u }); } finally { console.log = l; } };
  const P = [
    ['rok za povrat', ['/povrat-i-reklamacija/', '/najcesca-pitanja/']],
    ['parfem je stigao razbijen', ['/povrat-i-reklamacija/', '/dostava-i-isporuka/']],
    ['furla torbe', ['/furla/', '/kontakt-furla/', '/poslovnice/']],
    ['pedikura u Zagrebu', ['/beauty-centri/', '/beauty-saloni/', '/poslovnice/']],
    ['krema za suncanje', ['/kategorija/njega/suncanje/']],
  ];
  for (const [u, ocek] of P) { const r = sel(u); const p = r.urls.map(put); ok(ocek.every((x, i) => p[i] === x), '„' + u + '“ → ' + ocek.join(' + ') + ' (' + p.join(' + ') + ')'); }
  const hb = B('hermes terre'); const ht = ((hb.kontekst || {}).rezultat || {}).tekst || '';
  ok(/nije na popisu brendova/.test(ht) && !/Najbliže/.test(ht), 'brend koji nije u ponudi: bez „najbližih“ proizvoda drugih brendova (' + ht.slice(0, 80) + ')');
  const bf = B('black friday parfemi');
  ok(/black-friday/.test((bf.kontekst || {}).napomena || ''), 'Black Friday: napomena s člankom s weba');
  const ua = B({ url: 'https://martimex.hr/kategorija/parfemi/?pg=2', upit: 'akcija' });
  ok((ua.kontekst || {}).akcijaFilter === true, 'url + upit „akcija“: filtar akcije ostaje na sljedećoj stranici');
}
// drugi krug pregleda (2.11.): vodeća riječ mora biti imenica teme, druga tema ne istiskuje vlastitu stranicu, brojevi, „za njega“, brend + vrsta
{
  const sel = u => { const l = console.log; console.log = () => {}; try { return require('./test_baterija_v17.js').selB({ upit: u }); } finally { console.log = l; } };
  const T = [
    ['kako otkazati loyalty karticu', ['/loyalty-program/', '/martimex-loyalty-card/']],
    ['vratiti loyalty karticu', ['/loyalty-program/', '/martimex-loyalty-card/']],
    ['uvjeti loyalty programa', ['/loyalty-program/', '/martimex-loyalty-card/']],
    ['prijava u loyalty program', ['/loyalty-program/', '/martimex-loyalty-card/']],
    ['registracija loyalty', ['/loyalty-program/']],
    ['prijava reklamacije', ['/povrat-i-reklamacija/']],
    ['uvjeti besplatne dostave', ['/dostava-i-isporuka/']],
    ['nazvati poslovnicu Zagreb', ['/poslovnice/']],
    ['vratiti lozinku', ['/najcesca-pitanja/']],
    ['chanel rezervacija termina', ['/chanel/', '/chanel-beauty-appointment/']],
    ['loyalty otkazivanje', ['/loyalty-program/']],
    ['kontakt poslovnica', ['/kontakt/', '/poslovnice/']],
    ['furla Zagreb', ['/furla/', '/kontakt-furla/', '/poslovnice/']],
    ['furla kontakt', ['/furla/', '/kontakt-furla/']],
  ];
  for (const [u, prve] of T) { const r = sel(u); const p = r.urls.map(put); ok(prve.every((x, i) => p[i] === x), '„' + u + '“ → ' + prve.join(' + ') + ' (' + p.join(' + ') + ')'); }
  ok(!sel('kako otkazati loyalty karticu').urls.some(x => /otkazivanje-povrat/.test(x)), '„kako otkazati loyalty karticu“ bez obrasca za otkazivanje narudžbe');
  const P = [
    ['top 10 parfema', /\/kategorija\/parfemi\/\?sort=1$/],
    ['10 najboljih parfema', /\/kategorija\/parfemi\/\?sort=1$/],
    ['top 10 muških parfema', /\/kategorija\/parfemi\/\?gender=32&sort=1/],
    ['Versace parfem 80 eura', /\/brand\/versace\//],
    ['parfem za njega', /\/kategorija\/parfemi\/\?gender=32/],
    ['parfem za nju', /\/kategorija\/parfemi\/\?gender=31/],
    ['Dylan Blue za njega', /dylan-blue-eau-de-toilette/],
    ['toaletna voda mini', /\/kategorija\/parfemi\/toaletne-vode\//],
    ['mini parfemi', /\/kategorija\/parfemi\//],
    ['Curaro Parfum 100 ml', /curaro-parfum/],
    ['Alien Goddess', /alien-goddess/],
    ['Curl Goddess', /lash-idole-curl-goddess/],
    ['Versace setovi', /\/brand\/versace\//],
    ['Shiseido krema za lice', /\/brand\/shiseido\//],
    ['furla torbica', /furla-toaletna-torbica/],
  ];
  for (const [u, re] of P) { const r = sel(u); ok(r.akcija === 'dohvati' && re.test(r.urls[0] || ''), '„' + u + '“ → ' + re + ' (' + r.urls.map(put).join(' + ').slice(0, 140) + ')'); }
  ok(!sel('Damask Rose').urls.some(x => /gender=31/.test(x)), '„Damask Rose“ nije spol (dama)');
}
// masovna usporedba (2.11.): točan naziv ima prednost pred popisom kategorije; brend u adresi vlastitog proizvoda; parfem uz naziv iz druge kategorije
{
  const sel = u => { const l = console.log; console.log = () => {}; try { return require('./test_baterija_v17.js').selB({ upit: u }); } finally { console.log = l; } };
  const P = [
    ['styling gel', /styling-gel-178ml/],
    ['chloe mala', /chloe-mala-torbica/],
    ['pupa kozmeticka torbica za poklon', /pupa-kozmeticka-torbica/],
    ['Payot torba poklon', /payot-torba/],
    ['code femme ARMANI', /code-femme-eau-de-parfum/],
    ['lip contour kit parfem', /lip-contour-kit/],
    ['happy skin parfem', /happy-skin/],
    ['Collistar men freshness set muški parfem', /men-freshness-set/],
  ];
  for (const [u, re] of P) { const r = sel(u); ok(r.akcija === 'dohvati' && re.test(r.urls[0] || ''), '„' + u + '“ → ' + re + ' (' + r.urls.map(put).join(' + ').slice(0, 140) + ')'); }
}
// treći krug pregleda (2.11.): loyalty članstvo, kratke reklamacije, masaža, povrat novca, „jeftiniji od“, posvojne zamjenice, primatelji, genitiv brenda
{
  const sel = u => { const l = console.log; console.log = () => {}; try { return require('./test_baterija_v17.js').selB({ upit: u }); } finally { console.log = l; } };
  const T = [
    ['kako postati član', /\/loyalty-program\//],
    ['članska kartica', /\/loyalty-program\//],
    ['gold status koliko traje', /\/loyalty-program\//],
    ['gold kartica otkazivanje', /\/loyalty-program\//],
    ['beauty centar telefon', /\/beauty-centri\//],
    ['krivi parfem', /\/povrat-i-reklamacija\//],
    ['oštećena ambalaža', /\/povrat-i-reklamacija\//],
    ['anticelulitna masaza', /\/beauty-centri\//],
    ['kada vracate novac', /\/povrat-i-reklamacija\//],
    ['muški parfem jeftiniji od 50 eura', /maxPrice=50/],
    ['parfem za moju mamu', /\/kategorija\/parfemi\/\?gender=31/],
    ['parfem za mog tatu', /\/kategorija\/parfemi\/\?gender=32/],
    ['moj muž voli versace', /\/brand\/versace\//],
    ['poklon za baku', /\/vrsta\/setovi\//],
    ['što kupiti djevojci za rođendan', /\/vrsta\/setovi\//],
    ['koje parfeme imate od valentina', /\/brand\/valentino\//],
    ['parfemi od Armanija', /\/brand\/armani\//],
    ['promo kod ne radi', /\/kategorija\/parfemi\/\?sort=1/],
    ['povrat Apple Pay', /\/povrat-i-reklamacija\//],
    ['Apple Pay', /\/placanje-robe\//],
    ['toaletna voda moschino', /\/brand\/moschino\//],
    ['toaletna torbica moschino', /toaletna-torbica-moschino/],
    ['Lancôme maska', /\/brand\/lancome\//],
    ['gel za kosu', /gel/],
  ];
  for (const [u, re] of T) { const r = sel(u); ok(r.akcija === 'dohvati' && re.test(r.urls[0] || ''), '„' + u + '“ → ' + re + ' (' + r.urls.map(put).join(' + ').slice(0, 140) + ')'); }
  for (const u of ['sampon za ostecenu kosu', 'John Frieda ostecena kosa', 'Juvena masažer za lice']) { const r = sel(u); ok(!r.urls.some(x => /povrat-i-reklamacija|beauty-centri/.test(x)), '„' + u + '“ nije povrat ni beauty (' + r.urls.map(put).join(' + ') + ')'); }
  ok(!sel('black friday maskare').urls.length || !/black-friday/.test((B('black friday maskare').kontekst || {}).napomena || ''), 'Black Friday uz maskare bez članka o parfemima');
}
// treći krug (D): popis naselja bez tvrdnje da mjesta nema; predugi popis imenuje izostavljene proizvode
{
  const samples = fs.existsSync(path.join(__dirname, 'samples')) ? path.join(__dirname, 'samples') : path.join(__dirname, '..', 'samples');
  if (fs.existsSync(path.join(samples, 'dostava_i_isporuka.html'))) {
    const l = console.log; console.log = () => {};
    let d; try { d = pipeline({ upit: 'dostava Mljet' }).D.odgovor; } finally { console.log = l; }
    ok(!/nijedna stavka popisa ne sadrži/.test(d.tekst || ''), 'dostava Mljet: bez tvrdnje da mjesta nema na popisu');
  }
}
console.log('\nTESTOVI v1.7: ' + pass + ' prolazi, ' + fail + ' ne prolazi');
process.exitCode = fail ? 1 : 0;
