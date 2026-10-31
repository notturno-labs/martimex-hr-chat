// Testovi dodatnih ispravaka v1.5 (nalazi pregleda).
const fs = require('fs');
const path = require('path');
const { run, CODE, indexRows, pipeline } = require('./harness.js');
let pass = 0, fail = 0;
const ok = (uvjet, opis) => { if (uvjet) pass++; else { fail++; console.log('  NE PROLAZI:', opis); } };
const tiho = f => { const l = console.log; console.log = () => {}; try { return f(); } finally { console.log = l; } };
const samples = path.join(__dirname, 'samples');

// A: greška čitanja tablice / prazna tablica / ponovljeni dio zapisa
{
  const nodes = { 'Zahtjev od Marti': [{ json: { headers: {}, body: { upit: 'eros' } } }] };
  let A = run(CODE.A, 'all', [{ json: { headers: { a: 1 }, body: { upit: 'eros' } } }], nodes)[0].json;
  ok(A.kontekst.indeksGreska === true && A.akcija === 'sitemapi', 'A: greška čitanja tablice -> indeksGreska, pitanje čita sitemape uživo');
  A = run(CODE.A, 'all', [{ json: {} }], nodes)[0].json;
  ok(A.kontekst.indeksGreska === false, 'A: prazna tablica nije greška čitanja');
  const rows = indexRows();
  const dup = rows.find(r => r.json.prefiks === 'product-sitemap#0');
  rows.push({ json: Object.assign({}, dup.json) });   // ponovljeni redak istog dijela
  A = run(CODE.A, 'all', rows, nodes)[0].json;
  ok(A.idx['product-sitemap'] && A.idx['product-sitemap'].v.length === 2635, 'A: ponovljeni redak dijela ne kvari ključ (' + (A.idx['product-sitemap'] ? A.idx['product-sitemap'].v.length : 'nema') + ')');
  const dugi = ' '.repeat(200000) + 'x';
  const t0 = Date.now(); A = run(CODE.A, 'all', [{ json: {} }], { 'Zahtjev od Marti': [{ json: { body: { upit: dugi + 'eros' + dugi } } }] })[0].json;
  ok(Date.now() - t0 < 500, 'A: dugi niz razmaka ne usporava čišćenje (' + (Date.now() - t0) + ' ms)');
}

// B: url koji nije adresa ne pregazi upit; početna stranica uz upit -> upit
{
  let r = tiho(() => pipeline({ upit: 'versace eros eau de parfum', url: 'nepoznato' }));
  ok(r.D.odgovor.ok && /Eros Eau de Parfum/.test(r.D.odgovor.tekst), 'B: url „nepoznato“ + upit -> odgovor po upitu');
  r = tiho(() => pipeline({ upit: 'versace eros eau de parfum', url: 'https://martimex.hr/' }));
  ok(r.D.odgovor.ok && /Eros Eau de Parfum/.test(r.D.odgovor.tekst), 'B: url početne stranice + upit -> odgovor po upitu');
  r = tiho(() => pipeline({ upit: 'rok za povrat', url: '/najcesca-pitanja/' }));
  ok(r.B.url === 'https://martimex.hr/najcesca-pitanja/', 'B: pravi url + upit -> i dalje čita url');
}

// B: aliasi
{
  let r = tiho(() => pipeline({ upit: 'santal bois parfem' }));
  ok(!(r.B.kontekst && r.B.kontekst.brend === 'bois-1920'), 'B: „bois“ više ne nameće brend Bois 1920');
  r = tiho(() => pipeline({ upit: 'dolce vita' }));
  ok(!(r.B.kontekst && r.B.kontekst.brend === 'dolcegabbana'), 'B: „dolce vita“ nije Dolce&Gabbana');
  r = tiho(() => pipeline({ upit: 'dolce gabbana k' }));
  ok(r.B.kontekst && r.B.kontekst.brend === 'dolcegabbana', 'B: „dolce gabbana“ i dalje D&G');
}

// B: brendImena za provjeru brenda; C: thoo = The House of Oud
{
  const r = tiho(() => pipeline({ upit: 'versace eros eau de parfum' }));
  const im = r.B.kontekst.brendImena || [];
  ok(im.includes('versace') && im.some(x => /versace/i.test(x)), 'B: brendImena poslan uz proizvod (' + im.join(', ') + ')');
  const html = fs.readFileSync(path.join(samples, 'proizvod_parfemi_parfemske_vode_eros_eau_de_parfum.html'), 'utf8').replace(/Versace/g, 'The House of Oud');
  const C = (kontekst) => run(CODE.C, 'each', [{ json: { statusCode: 200, headers: { 'content-type': 'text/html' }, body: html } }], { 'Odaberi stranice': [{ json: { url: 'https://martimex.hr/proizvod/parfemi/parfemske-vode/eros-eau-de-parfum/', uloga: 'proizvod', kontekst } }], 'Dohvati stranice': [{ json: {} }] })[0].json;
  let c = C({ brendProvjera: 'thoo', brendImena: ['thoo', 'Thoo', 'house of oud', 'the house of oud'] });
  ok(c.ok && c.drugiBrend === false, 'C: The House of Oud prihvaćen za thoo');
  c = C({ brendProvjera: 'thoo' });
  ok(c.drugiBrend === true, 'C: bez brendImena (staro ponašanje) odbacio bi ga');
  c = C({ brendProvjera: 'versace', brendImena: ['versace', 'Versace'] });
  ok(c.drugiBrend === true, 'C: drugi brend i dalje se prepoznaje');
}

// B: nepoznat brend ne čita sitemape uživo; neupotrebljiv indeks -> ok:false umjesto „nije pronađeno“
{
  const r = tiho(() => pipeline({ upit: 'dior sauvage' }));
  ok(r.B.akcija === 'odgovori' && !r.B.kontekst.osvjezenoNaPrazno && /dior/i.test(r.D.odgovor.tekst || ''), 'B: Dior bez osvježavanja sitemapa');
  const nodes = { 'Zahtjev od Marti': [{ json: { headers: {}, body: { upit: 'versace eros eau de parfum' } } }] };
  const A = run(CODE.A, 'all', [{ json: {} }], nodes); nodes['Pripremi upit'] = A;
  const prazno = A.map(() => ({ json: { error: { message: 'timeout of 10000ms exceeded' } } }));
  const B = run(CODE.B, 'all', prazno, nodes); nodes['Odaberi stranice'] = B;
  ok(B[0].json.akcija === 'odgovori' && B[0].json.kontekst.rezultat.ok === false && /nije dostupan/.test(B[0].json.kontekst.rezultat.greska), 'B: prazan indeks + neuspjeli sitemapi -> ok:false, ne „nije pronađeno“');
}

// B: sonda (4. datoteka proizvoda) s timeoutom ne ruši popis proizvoda
{
  const nodes = { 'Zahtjev od Marti': [{ json: { headers: {}, body: { zadatak: 'sitemapi' } } }] };
  const A = run(CODE.A, 'all', indexRows(), nodes); nodes['Pripremi upit'] = A;
  const xml = n => '<urlset>' + Array.from({ length: n }, (_, i) => '<url><loc>https://martimex.hr/proizvod/a/p' + i + '/</loc></url>').join('') + '</urlset>';
  const xmlB = n => '<urlset>' + Array.from({ length: n }, (_, i) => '<url><loc>https://martimex.hr/brand/b' + i + '/</loc></url>').join('') + '</urlset>';
  const ulaz = A[0].json.kontekst.sitemapDatoteke.map(([p, u, s]) => ({ json: s ? { error: { message: 'timeout of 10000ms exceeded' } } : { statusCode: 200, body: p === 'martimex_brand-sitemap' ? xmlB(96) : xml(p === 'product-sitemap' ? 900 : 200) } }));
  const B = run(CODE.B, 'all', ulaz, nodes)[0].json;
  ok(B.spremi.some(s => s.kljuc === 'product-sitemap') && B.kontekst.rezultat.ok === true, 'B: timeout sonde ne ruši popis proizvoda');
}

// B: brendovi 3 po seriji; indeksGreska -> serija preskočena
{
  const r = tiho(() => pipeline({ zadatak: 'brendovi' }));
  const n = r.B.akcija === 'dohvati' ? 'ok' : r.B.akcija;
  ok(n === 'ok', 'B: brendovi dohvaćaju stranice');
  const nodes = { 'Zahtjev od Marti': [{ json: { headers: {}, body: { zadatak: 'brendovi' } } }] };
  const A = run(CODE.A, 'all', [{ json: { headers: { a: 1 }, body: { zadatak: 'brendovi' } } }], nodes); nodes['Pripremi upit'] = A;
  ok(A[0].json.akcija === 'odaberi', 'A: brendovi uz grešku čitanja ne čitaju sitemape');
  const B = run(CODE.B, 'all', A, nodes)[0].json;
  ok(B.akcija === 'odgovori' && B.kontekst.rezultat.ok === true && /preskočena/.test(B.kontekst.rezultat.opis), 'B: brendovi uz grešku čitanja preskaču seriju bez spremanja');
}
{
  const nodes = { 'Zahtjev od Marti': [{ json: { headers: {}, body: { zadatak: 'brendovi' } } }] };
  const rows = indexRows().filter(r => !r.json.prefiks.startsWith('stanje:'));
  const A = run(CODE.A, 'all', rows, nodes); nodes['Pripremi upit'] = A;
  if (A[0].json.akcija === 'odaberi') { const B = run(CODE.B, 'all', A, nodes); ok(B.length === 3, 'B: serija brendova ima 3 stranice (' + B.length + ')'); }
  else ok(false, 'B: brendovi traže sitemape (indeks nepotpun u testu)');
}

// D: dopuna mape brenda samo kad brend nema mapu; redoslijed stranica; kartice 0
{
  const prod = (url, brend) => ({ ok: true, tip: 'proizvod', url, urlTrazen: url, proizvod: { naziv: 'P', brend, kategorija: 'Parfemska voda', varijante: [{ oznaka: '50 ml', cijena: '1,00 €', zaliha: 'na zalihi' }], promo: [] } });
  const idx = { 'martimex_brand-sitemap': { at: 1, v: [['https://martimex.hr/brand/versace/'], ['https://martimex.hr/brand/novibrend/']] }, 'brend:versace': { at: 1, v: { naziv: 'Versace', proizvodi: [['/proizvod/a/x/', 'X', '']] } } };
  const nodes = { 'Pripremi upit': [{ json: { idx, kontekst: {} } }], 'Odaberi stranice': [{ json: { akcija: 'dohvati', url: 'https://martimex.hr/proizvod/a/2/', kontekst: { zadatak: 'upit', tip: 'vise_proizvoda' }, spremi: [] } }, { json: { url: 'https://martimex.hr/proizvod/a/1/' } }] };
  const D = run(CODE.D, 'all', [{ json: prod('https://martimex.hr/proizvod/a/1/', 'Novibrend') }, { json: prod('https://martimex.hr/proizvod/a/2/', 'Versace') }], nodes)[0].json;
  ok(!D.spremi.some(s => s.kljuc === 'brend:versace'), 'D: postojeća mapa brenda se ne prepisuje iz pitanja');
  const nov = D.spremi.find(s => s.kljuc === 'brend:novibrend');
  ok(nov && nov.at > 1e12, 'D: brend bez mape dobije mapu s današnjim vremenom');
  const t = D.odgovor.tekst || '';
  ok(t.indexOf('/proizvod/a/2/') > -1 && t.indexOf('/proizvod/a/2/') < t.indexOf('/proizvod/a/1/'), 'D: redoslijed kao u „Odaberi stranice“');
}
{
  const nodes = { 'Pripremi upit': [{ json: { idx: { 'brend:aa': { at: 1, v: { naziv: 'AA', proizvodi: [['/proizvod/x/1/', 'X', '']], stranice: 1, djelomicno: false } } }, kontekst: { zadatak: 'brendovi' } } }], 'Odaberi stranice': [{ json: { akcija: 'dohvati', kontekst: { zadatak: 'brendovi', stanjeBrendova: { red: [], ciklus: 1 } }, spremi: [] } }] };
  const D = run(CODE.D, 'all', [{ json: { ok: true, tip: 'popis', brend: 'aa', pg: 1, pokusaj: 0, popis: { proizvodi: [], naslov: 'AA' }, stranicenje: { trenutna: 1, ukupno: 1 } } }], nodes)[0].json;
  ok(!D.spremi.some(s => s.kljuc === 'brend:aa'), 'D: stranica brenda bez kartica ne prazni mapu');
}

// D: samoprovjera – prazna /akcija/, nedostaje oznaka svježine, greška iz B
{
  const mk = (oc, extra) => Object.assign({ ok: true, ocekuj: oc, starostS: 1, generirano: 1793400000, url: 'u-' + oc }, extra);
  const v = n => Array.from({ length: n }, (_, i) => ({ oznaka: i + ' ml', cijena: '1,00 €', zaliha: 'na zalihi' }));
  const pop = n => Array.from({ length: n }, (_, i) => ({ naziv: 'P' + i, url: 'u' + i, brend: 'B', cijena: '1,00 €', naAkciji: true }));
  const svi = [mk('varijante', { proizvod: { brend: 'V', varijante: v(2) } }), mk('cijena', { proizvod: { jedno: { cijena: '1,00 €', zaliha: 'na zalihi' } } }), mk('nijanse', { proizvod: { varijante: v(5) } }), mk('popis', { popis: { proizvodi: pop(20) }, stranicenje: { trenutna: 1, ukupno: 2 } }), mk('akcija', { popis: { proizvodi: pop(20) } }), mk('tekst', { markdown: 'x'.repeat(900) })];
  const SP = (stranice, kontekst) => run(CODE.D, 'all', stranice.map(s => ({ json: s })), { 'Pripremi upit': [{ json: { idx: {}, kontekst: {} } }], 'Odaberi stranice': [{ json: { akcija: 'dohvati', kontekst: Object.assign({ zadatak: 'samoprovjera' }, kontekst || {}), spremi: [] } }] })[0].json.odgovor;
  let o = SP(svi.map(s => s.ocekuj === 'akcija' ? Object.assign({}, s, { popis: { proizvodi: [] } }) : s));
  ok(o.ok === true && /nema proizvoda na akciji/.test(o.opis), 'D: prazna /akcija/ je upozorenje');
  o = SP(svi.map((s, i) => i < 2 ? Object.assign({}, s, { generirano: null }) : s));
  ok(o.ok === false && /oznake svježine/.test(o.opis), 'D: nestala oznaka svježine -> greška');
  o = SP([], { rezultat: { ok: false, greska: 'Interna greška alata pri odabiru stranica (boom).' } });
  ok(o.ok === false && /boom/.test(o.opis), 'D: greška iz B ostaje u opisu samoprovjere');
}

console.log('\nDODATNI TESTOVI v1.5: ' + pass + ' prolazi, ' + fail + ' ne prolazi');
process.exitCode = fail ? 1 : 0;

// ---------- krug 2 ----------
{
  let p2 = 0, f2 = 0; const ok2 = (u, o) => { if (u) p2++; else { f2++; console.log('  NE PROLAZI:', o); } };
  const mk = (oc, extra) => Object.assign({ ok: true, ocekuj: oc, starostS: 1, generirano: 1793400000, url: 'u-' + oc }, extra);
  const v = n => Array.from({ length: n }, (_, i) => ({ oznaka: i + ' ml', cijena: '1,00 €', zaliha: 'na zalihi' }));
  const pop = n => Array.from({ length: n }, (_, i) => ({ naziv: 'P' + i, url: 'u' + i, brend: 'B', cijena: '1,00 €', naAkciji: true }));
  const svi = [mk('varijante', { proizvod: { brend: 'V', varijante: v(2) } }), mk('cijena', { proizvod: { jedno: { cijena: '1,00 €', zaliha: 'na zalihi' } } }), mk('nijanse', { proizvod: { varijante: v(5) } }), mk('popis', { popis: { proizvodi: pop(20) }, stranicenje: { trenutna: 1, ukupno: 2 } }), mk('akcija', { popis: { proizvodi: pop(20) } }), mk('tekst', { markdown: 'x'.repeat(900) })];
  const SP = (stranice, kontekst, idx) => run(CODE.D, 'all', stranice.map(s => ({ json: s })), { 'Pripremi upit': [{ json: { idx: idx || {}, kontekst: {} } }], 'Odaberi stranice': [{ json: { akcija: 'dohvati', kontekst: Object.assign({ zadatak: 'samoprovjera' }, kontekst || {}), spremi: [] } }] })[0].json.odgovor;
  const pad = (oc, vrsta, st) => ({ ok: false, ocekuj: oc, url: 'u-' + oc, vrstaGreske: vrsta, statusCode: st || null, greska: vrsta });
  let o = SP(svi.map(s => s.ocekuj === 'cijena' ? pad('cijena', '404', 404) : s));
  ok2(o.ok === false, 'samoprovjera: 404 testne stranice -> greška');
  o = SP(svi.map(s => s.ocekuj === 'cijena' ? pad('cijena', 'interna') : s));
  ok2(o.ok === false, 'samoprovjera: kvar alata na stranici -> greška');
  o = SP(svi.map(s => s.ocekuj === 'cijena' ? pad('cijena', 'odbijeno', 403) : s));
  ok2(o.ok === false, 'samoprovjera: 403 -> greška');
  o = SP(svi.map(s => s.ocekuj === 'cijena' ? pad('cijena', 'odbijeno', 429) : s));
  ok2(o.ok === true, 'samoprovjera: 429 -> upozorenje');
  o = SP(svi, { indeksGreska: true });
  ok2(o.ok === false && /tablica indeksa/.test(o.opis), 'samoprovjera: tablica nije učitana -> greška');
  o = SP(svi, {}, { 'post-sitemap': { at: Date.now() - 40 * 3600000, v: [] }, 'product-sitemap': { at: Date.now() - 600000, v: [] } });
  ok2(o.ok === false && /post-sitemap nije osvježen 40 h/.test(o.opis), 'samoprovjera: sitemap star 40 h -> greška');
  o = SP(svi.map(s => ['nijanse', 'cijena'].includes(s.ocekuj) ? pad(s.ocekuj, 'timeout') : (s.ocekuj === 'akcija' ? Object.assign({}, s, { popis: { proizvodi: [] } }) : s)));
  ok2(o.ok === true, 'samoprovjera: 2 spore + prazna akcija -> i dalje upozorenje');
  // interna na pitanju kupca
  const Dq = (stranice, kontekst) => run(CODE.D, 'all', stranice.map(s => ({ json: s })), { 'Pripremi upit': [{ json: { idx: {}, kontekst: {} } }], 'Odaberi stranice': [{ json: { akcija: kontekst.rezultat ? 'odgovori' : 'dohvati', kontekst: Object.assign({ zadatak: 'upit' }, kontekst), spremi: [] } }] })[0].json;
  let d = Dq([], { rezultat: { ok: false, greska: 'Interna greška alata pri odabiru stranica (x).' }, internaGreska: 'TypeError: x\n at y' });
  ok2(/Odaberi stranice: TypeError: x$/.test(d.interna || ''), 'pitanje: interna greška iz B -> polje interna (' + d.interna + ')');
  d = Dq([{ ok: false, vrstaGreske: 'interna', greska: 'interna greška pri obradi stranice (boom)', url: 'u', uloga: 'proizvod' }], { tip: 'proizvod' });
  ok2(/Izvuci činjenice: .*boom/.test(d.interna || ''), 'pitanje: kvar u C -> polje interna');
  d = Dq([{ ok: false, vrstaGreske: 'timeout', greska: 'timeout', url: 'u', uloga: 'proizvod' }], { tip: 'proizvod' });
  ok2(d.interna === null, 'pitanje: timeout nije interna greška');
  // brendovi: sve 404 -> uobičajeno pravilo, ne ponavljanje
  const nodes = { 'Pripremi upit': [{ json: { idx: {}, kontekst: { zadatak: 'brendovi' } } }], 'Odaberi stranice': [{ json: { akcija: 'dohvati', kontekst: { zadatak: 'brendovi', stanjeBrendova: { red: [], ciklus: 3 } }, spremi: [] } }] };
  const items = ['aa', 'bb', 'cc'].map(b => ({ json: { ok: false, vrstaGreske: '404', greska: '404', brend: b, pg: 1, pokusaj: 0 } }));
  const st = run(CODE.D, 'all', items, nodes)[0].json.spremi.find(x => x.kljuc === 'stanje:brendovi').v;
  ok2(JSON.stringify(st.red) === JSON.stringify([['aa', 1, 1], ['bb', 1, 1], ['cc', 1, 1]]) && st.odgoda === 0, 'brendovi: sve 404 -> pokušaj +1, bez ponavljanja serije');
  // dopuna mape: tablica nije učitana -> nema prepisivanja
  const prod = { ok: true, tip: 'proizvod', url: 'https://martimex.hr/proizvod/a/2/', urlTrazen: 'https://martimex.hr/proizvod/a/2/', proizvod: { naziv: 'P', brend: 'Versace', kategorija: 'x', varijante: [{ oznaka: '50 ml', cijena: '1,00 €', zaliha: 'na zalihi' }], promo: [] } };
  const D2 = run(CODE.D, 'all', [{ json: prod }], { 'Pripremi upit': [{ json: { idx: { 'martimex_brand-sitemap': { at: 1, v: [['https://martimex.hr/brand/versace/']] } }, kontekst: {} } }], 'Odaberi stranice': [{ json: { akcija: 'dohvati', url: prod.url, kontekst: { zadatak: 'upit', tip: 'proizvod', indeksGreska: true }, spremi: [] } }] })[0].json;
  ok2(!D2.spremi.some(s => s.kljuc.startsWith('brend:')), 'dopuna: bez učitane tablice nema prepisivanja mape');
  // slab url s točkom / razmakom
  let r = tiho(() => pipeline({ upit: 'versace eros eau de parfum', url: 'nisam siguran.' }));
  ok2(r.D.odgovor.ok && /Eros Eau de Parfum/.test(r.D.odgovor.tekst) && !r.B.kontekst.zeliOpis, 'url „nisam siguran.“ + upit -> po upitu, bez dugog opisa');
  r = tiho(() => pipeline({ upit: 'elizabeth arden' }));
  ok2((r.B.kontekst.brendImena || ['x']).every(x => x.includes(' ') || !/^arden$/.test(x)), 'brendImena bez jednorječnih aliasa');
  // brendovi bez popisa brendova -> preskok bez greške
  const nb = { 'Zahtjev od Marti': [{ json: { headers: {}, body: { zadatak: 'brendovi' } } }] };
  const A = run(CODE.A, 'all', [{ json: {} }], nb); nb['Pripremi upit'] = A;
  ok2(A[0].json.akcija === 'odaberi', 'A: brendovi uz prazan indeks ne čitaju sitemape');
  const B = run(CODE.B, 'all', A, nb)[0].json;
  ok2(B.kontekst.rezultat.ok === true && /preskočena/.test(B.kontekst.rezultat.opis), 'B: brendovi bez popisa brendova -> preskok bez uzbune');
  console.log('KRUG 2: ' + p2 + ' prolazi, ' + f2 + ' ne prolazi');
  if (f2) process.exitCode = 1;
}
