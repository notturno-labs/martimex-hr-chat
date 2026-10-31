// Jedinični testovi zadataka (v1.5): samoprovjera, sitemapi, brendovi, timeoutMs, ispravak "nepoznata greška".
const { run, CODE, indexRows, pipeline } = require('./harness.js');
let pass = 0, fail = 0;
const ok = (uvjet, opis) => { if (uvjet) pass++; else { fail++; console.log('  NE PROLAZI:', opis); } };

// ---------- D: samoprovjera ----------
const varij = n => Array.from({ length: n }, (_, i) => ({ oznaka: (i + 1) * 10 + ' ml', cijena: '10,00 €', zaliha: 'na zalihi' }));
const pop = n => Array.from({ length: n }, (_, i) => ({ naziv: 'P' + i, url: 'https://martimex.hr/proizvod/x/p' + i + '/', brend: 'B', cijena: '1,00 €', naAkciji: true, redovna: '2,00 €' }));
const stranicaOk = {
  varijante: { ok: true, tip: 'proizvod', ocekuj: 'varijante', starostS: 2, generirano: 1793400000, url: 'u1', proizvod: { brend: 'Versace', varijante: varij(2) } },
  cijena: { ok: true, tip: 'proizvod', ocekuj: 'cijena', starostS: 2, generirano: 1793400000, url: 'u2', proizvod: { jedno: { cijena: '124,00 €', zaliha: 'na zalihi' } } },
  nijanse: { ok: true, tip: 'proizvod', ocekuj: 'nijanse', starostS: 2, generirano: 1793400000, url: 'u3', proizvod: { varijante: varij(18) } },
  popis: { ok: true, tip: 'popis', ocekuj: 'popis', starostS: 2, generirano: 1793400000, url: 'u4', popis: { proizvodi: pop(20) }, stranicenje: { trenutna: 1, ukupno: 5 } },
  akcija: { ok: true, tip: 'popis', ocekuj: 'akcija', starostS: 2, generirano: 1793400000, url: 'u5', popis: { proizvodi: pop(20) } },
  tekst: { ok: true, tip: 'stranica', ocekuj: 'tekst', starostS: 2, generirano: 1793400000, url: 'u6', markdown: 'x'.repeat(900) },
};
const timeout = oc => ({ ok: false, ocekuj: oc, url: 'u-' + oc, vrstaGreske: 'timeout', greska: 'web nije odgovorio na vrijeme (timeout of 16000ms exceeded)' });
function samoprovjera(stranice, kontekst) {
  const nodes = { 'Pripremi upit': [{ json: { idx: {}, kontekst: { zadatak: 'samoprovjera' } } }], 'Odaberi stranice': [{ json: { akcija: 'dohvati', kontekst: Object.assign({ zadatak: 'samoprovjera' }, kontekst || {}), spremi: [] } }] };
  return run(CODE.D, 'all', stranice.map(s => ({ json: s })), nodes)[0].json;
}
{
  const svi = Object.values(stranicaOk);
  let r = samoprovjera(svi); ok(r.odgovor.ok === true && /^Samoprovjera prošla\. U redu/.test(r.odgovor.opis), 'sve u redu -> ok');
  // slučaj 4415: ruž timeout
  r = samoprovjera(svi.map(s => s.ocekuj === 'nijanse' ? timeout('nijanse') : s));
  ok(r.odgovor.ok === true && /Upozorenje \(web spor ili nedostupan za 1 stranicu/.test(r.odgovor.opis), '4415: jedna spora stranica -> upozorenje, ok:true | ' + r.odgovor.opis.slice(0, 160));
  r = samoprovjera(svi.map(s => ['nijanse', 'cijena'].includes(s.ocekuj) ? timeout(s.ocekuj) : s));
  ok(r.odgovor.ok === true && /za 2 stranice/.test(r.odgovor.opis), 'dvije spore -> ok:true');
  r = samoprovjera(svi.map(s => ['nijanse', 'cijena', 'popis'].includes(s.ocekuj) ? timeout(s.ocekuj) : s));
  ok(r.odgovor.ok === false && /martimex\.hr ne odgovara za 3 od 6/.test(r.odgovor.opis), 'tri nedostupne -> greška');
  // promjena weba: nijanse bez cijene
  r = samoprovjera(svi.map(s => s.ocekuj === 'nijanse' ? Object.assign({}, s, { proizvod: { varijante: [{ oznaka: 'a', cijena: '', zaliha: 'na zalihi' }, { oznaka: 'b', cijena: '', zaliha: 'na zalihi' }] } }) : s));
  ok(r.odgovor.ok === false && /SAMOPROVJERA NIJE PROŠLA: .*nijanse s cijenom/.test(r.odgovor.opis), 'izvlačenje ne radi -> greška');
  // namjerno pokvaren
  r = samoprovjera(svi.concat([{ ok: true, tip: 'stranica', ocekuj: 'varijante', namjerno: true, starostS: 1, url: 'u7', markdown: 'x' }]));
  ok(r.odgovor.ok === false && /\[namjerno pokvaren\]/.test(r.odgovor.opis), 'pokvari=da -> greška');
  // stara kopija (cache) za jednu stranicu -> upozorenje
  r = samoprovjera(svi.map(s => s.ocekuj === 'tekst' ? Object.assign({}, s, { starostS: 300 }) : s));
  ok(r.odgovor.ok === true && /očekivano svježe/.test(r.odgovor.opis), 'stara kopija jedne stranice -> upozorenje');
  // nijedna stranica
  r = samoprovjera([]);
  ok(r.odgovor.ok === false, 'bez stranica -> greška');
}

// ---------- D: sitemapi / brendovi s greškom iz B (nekad "nepoznata greška") ----------
{
  const nodes = z => ({ 'Pripremi upit': [{ json: { idx: {}, kontekst: { zadatak: z } } }], 'Odaberi stranice': [{ json: { akcija: 'odgovori', kontekst: { zadatak: z, rezultat: { ok: false, greska: 'Interna greška alata pri odabiru stranica (x is not defined).' } }, spremi: [] } }] });
  for (const z of ['sitemapi', 'brendovi']) {
    const r = run(CODE.D, 'all', [{ json: { akcija: 'odgovori' } }], nodes(z))[0].json;
    ok(r.odgovor.ok === false && /x is not defined/.test(r.odgovor.opis), z + ': greška iz B prenesena u opis (bez "nepoznata greška")');
  }
}

// ---------- D: brendovi, web ne odgovara ----------
{
  const nodes = { 'Pripremi upit': [{ json: { idx: {}, kontekst: { zadatak: 'brendovi' } } }], 'Odaberi stranice': [{ json: { akcija: 'dohvati', kontekst: { zadatak: 'brendovi', stanjeBrendova: { red: [['zz', 1, 0]], ciklus: 3 } }, spremi: [] } }] };
  const serija = [['aa', 1, 0], ['bb', 2, 1], ['cc', 1, 0]];
  const items = serija.map(([b, pg, po]) => ({ json: { ok: false, vrstaGreske: 'timeout', greska: 'timeout', brend: b, pg, pokusaj: po, uloga: 'brend' } }));
  const r = run(CODE.D, 'all', items, nodes)[0].json;
  const st = r.spremi.find(x => x.kljuc === 'stanje:brendovi').v;
  ok(r.odgovor.ok === true, 'brendovi: web ne odgovara -> ok:true (bez uzbune)');
  ok(JSON.stringify(st.red) === JSON.stringify([['aa', 1, 0], ['bb', 2, 1], ['cc', 1, 0], ['zz', 1, 0]]), 'brendovi: ista serija natrag na početak reda, pokušaji netaknuti | ' + JSON.stringify(st.red));
  ok(!r.spremi.some(x => x.kljuc.startsWith('brend:')), 'brendovi: ne prepisuje mape brendova');
  ok(st.odgoda === 1, 'brendovi: odgoda se broji');
  // nakon 6 odgoda vrijedi uobičajeno pravilo (red ne zapne)
  const nodes6 = JSON.parse(JSON.stringify(nodes)); nodes6['Odaberi stranice'][0].json.kontekst.stanjeBrendova.odgoda = 6;
  const r6 = run(CODE.D, 'all', items, nodes6)[0].json; const st6 = r6.spremi.find(x => x.kljuc === 'stanje:brendovi').v;
  ok(JSON.stringify(st6.red) === JSON.stringify([['zz', 1, 0], ['aa', 1, 1], ['cc', 1, 1]]) && st6.odgoda === 0, 'brendovi: nakon 6 odgoda bb (2. pokušaj) ispada, ostali +1 | ' + JSON.stringify(st6.red));
  // serija od 1 stranice: uobičajeno pravilo
  const r1 = run(CODE.D, 'all', [items[1]], nodes)[0].json; const st1 = r1.spremi.find(x => x.kljuc === 'stanje:brendovi').v;
  ok(JSON.stringify(st1.red) === JSON.stringify([['zz', 1, 0]]), 'brendovi: jedna stranica u 2. pokušaju ispada (red ne zapne) | ' + JSON.stringify(st1.red));
}

// ---------- B: timeoutMs, kandidati samoprovjere ----------
{
  const r1 = pipeline({ upit: 'versace eros eau de parfum' });
  const nodesB = {};
  ok(r1.B.timeoutMs === 8000 && r1.B.razmakMs === 0, 'pitanje: timeoutMs 8000 (' + r1.B.timeoutMs + ')');
  const r2 = pipeline({ zadatak: 'samoprovjera' });
  ok(r2.B.timeoutMs === 8000 && r2.B.razmakMs === 4000, 'samoprovjera: timeoutMs 8000, razmak 4000');
  const r3 = pipeline({ zadatak: 'brendovi' });
  ok(r3.B.timeoutMs === 15000 || r3.B.akcija !== 'dohvati', 'brendovi: timeoutMs 15000 (' + r3.B.timeoutMs + ', ' + r3.B.akcija + ')');
}

// ---------- B: sitemapi verdict ----------
function sitemapiB(odgovoriSitemapa, idxRowsMod) {
  const nodes = { 'Zahtjev od Marti': [{ json: { headers: {}, body: { zadatak: 'sitemapi' } } }] };
  let rows = indexRows();
  if (idxRowsMod) rows = idxRowsMod(rows);
  const A = run(CODE.A, 'all', rows, nodes); nodes['Pripremi upit'] = A;
  const dat = A[0].json.kontekst.sitemapDatoteke;
  const ulaz = dat.map(([prefiks, url, sonda], i) => ({ json: odgovoriSitemapa(prefiks, url, sonda, i) }));
  return run(CODE.B, 'all', ulaz, nodes)[0].json;
}
const xml = n => '<?xml version="1.0"?><urlset>' + Array.from({ length: n }, (_, i) => '<url><loc>https://martimex.hr/proizvod/a/p' + i + '/</loc><lastmod>2026-10-30</lastmod></url>').join('') + '</urlset>';
const xmlBrend = n => '<urlset>' + Array.from({ length: n }, (_, i) => '<url><loc>https://martimex.hr/brand/b' + i + '/</loc></url>').join('') + '</urlset>';
{
  const dobro = (p, url, sonda) => sonda ? { statusCode: 404, body: '' } : { statusCode: 200, body: p === 'martimex_brand-sitemap' ? xmlBrend(96) : xml(p === 'product-sitemap' ? 700 : 200) };
  let b = sitemapiB(dobro);
  ok(b.kontekst.rezultat.ok === true && /Sitemapi osvježeni/.test(b.kontekst.rezultat.opis), 'sitemapi: sve uspjelo -> ok');
  // jedan neobavezni pao (scent) -> ok:true s napomenom, uspjeli se spremaju
  b = sitemapiB((p, u, s) => p === 'martimex_scent-sitemap' ? { error: { message: 'timeout of 10000ms exceeded' } } : dobro(p, u, s));
  ok(b.kontekst.rezultat.ok === true && /nisu potpuno osvježeni/.test(b.kontekst.rezultat.opis) && b.spremi.some(s => s.kljuc === 'product-sitemap'), 'sitemapi: neobavezni pao -> ok:true, ostali spremljeni');
  // obavezni (product) pao, indeks svjež (5 min) -> ok:true
  b = sitemapiB((p, u, s) => p === 'product-sitemap' ? { statusCode: 503, body: 'x' } : dobro(p, u, s));
  ok(b.kontekst.rezultat.ok === true && /dojava tek ako indeks bude stariji od 2 h/.test(b.kontekst.rezultat.opis), 'sitemapi: obavezni pao, indeks svjež -> ok:true | ' + b.kontekst.rezultat.opis.slice(0, 200));
  // obavezni pao, indeks star 2 h 10 min -> dojava; 3 h -> bez dojave (već poslana); 26 h 10 min -> ponovno dojava
  const star = min => rows => rows.map(r => { const j = Object.assign({}, r.json); if (/^product-sitemap#/.test(j.prefiks)) j.at = Date.now() - min * 60000; return { json: j }; });
  b = sitemapiB((p, u, s) => p === 'product-sitemap' ? { statusCode: 503, body: 'x' } : dobro(p, u, s), star(130));
  ok(b.kontekst.rezultat.ok === false, 'sitemapi: indeks 2 h 10 min -> dojava');
  b = sitemapiB((p, u, s) => p === 'product-sitemap' ? { statusCode: 503, body: 'x' } : dobro(p, u, s), star(180));
  ok(b.kontekst.rezultat.ok === true && /Dojava je već poslana/.test(b.kontekst.rezultat.opis), 'sitemapi: indeks 3 h -> bez ponovne dojave');
  b = sitemapiB((p, u, s) => p === 'product-sitemap' ? { statusCode: 503, body: 'x' } : dobro(p, u, s), star(26 * 60 + 10));
  ok(b.kontekst.rezultat.ok === false, 'sitemapi: 26 h 10 min -> dnevna ponovljena dojava');
  // sumnjivo malo adresa -> stari popis ostaje, ne sprema se
  b = sitemapiB((p, u, s) => p === 'product-sitemap' && !s ? { statusCode: 200, body: xml(40) } : dobro(p, u, s));
  ok(!b.spremi.some(s => s.kljuc === 'product-sitemap') && /sumnjivo malo adresa/.test(b.kontekst.rezultat.opis), 'sitemapi: nagli pad adresa -> ne prepisuje indeks');
  // iznimka u obradi sitemapa ne ruši node
  b = sitemapiB((p, u, s) => p === 'page-sitemap' ? { statusCode: 200, body: { toString() { throw new Error('boom'); } } } : dobro(p, u, s));
  ok(b.akcija === 'odgovori' && b.kontekst.rezultat && /obrada sitemapa \(boom\)/.test(b.kontekst.rezultat.opis), 'sitemapi: iznimka u obradi -> uhvaćena | ' + JSON.stringify(b.kontekst.rezultat).slice(0, 160));
}

console.log('\nTESTOVI ZADATAKA: ' + pass + ' prolazi, ' + fail + ' ne prolazi');
process.exit(fail ? 1 : 0);
