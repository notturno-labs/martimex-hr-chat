// Testovi v1.6: unakrsna provjera cijena, provjera potpunosti popisa, JSON način, prigušivanje dojava,
// napomena o odabiru po sličnosti, broj proizvoda brenda samo uz potpunu mapu, format u zahtjevu.
const fs = require('fs');
const path = require('path');
const { run, CODE, indexRows, pipeline } = require('./harness.js');
let pass = 0, fail = 0;
const ok = (uvjet, opis) => { if (uvjet) pass++; else { fail++; console.log('  NE PROLAZI:', opis); } };
const tiho = f => { const l = console.log; console.log = () => {}; try { return f(); } finally { console.log = l; } };
const samples = fs.existsSync(path.join(__dirname, 'samples')) ? path.join(__dirname, 'samples') : path.join(__dirname, '..', 'samples');
const svjez = h => h.replace(/__wc_fb_page_generated\s*=\s*\d+/, '__wc_fb_page_generated = ' + Math.floor(Date.now() / 1000 - 1));
const uzorak = f => svjez(fs.readFileSync(path.join(samples, f), 'utf8'));
const C = (html, url, kontekst) => run(CODE.C, 'each', [{ json: { statusCode: 200, headers: { 'content-type': 'text/html' }, body: html } }],
  { 'Odaberi stranice': [{ json: { url: url || 'https://martimex.hr/x/', uloga: 'url', kontekst: kontekst || {} } }], 'Dohvati stranice': [{ json: {} }] })[0].json;
const CREAM = 'proizvod_makeup_usne_ruzevi_labsolu_rouge_cream_34_g.html';
const INTI = 'proizvod_makeup_usne_ruzevi_labsolu_rouge_intimatte_34_g.html';
const DYLAN = 'proizvod_parfemi_parfemske_vode_dylan_blush_pink_set_eau_de_parfum_100_ml.html';
const EROS = 'proizvod_parfemi_parfemske_vode_eros_eau_de_parfum.html';

// ---------- C: ispravne stranice prolaze ----------
{
  for (const f of fs.readdirSync(samples).filter(f => f.endsWith('.html'))) {
    const c = C(uzorak(f), 'https://martimex.hr/' + f.replace('.html', '') + '/');
    ok(c.ok === true, 'C: uzorak ' + f + ' prolazi provjeru (' + (c.greska || '') + ')');
  }
  const c = C(uzorak(INTI));
  const akc = c.proizvod.varijante.find(v => v.naAkciji);
  ok(akc && akc.cijena === '32,12 €' && akc.redovna === '49,41 €', 'C: akcijska nijansa ima cijenu 32,12 i redovnu 49,41');
  ok(c.proizvod.varijante.every(v => v.id), 'C: svaka varijanta nosi id');
}

// ---------- C: nedosljedni podaci -> izvlacenje ----------
{
  let h = uzorak(CREAM);
  // prikazana cijena jedne nijanse razlikuje se od podataka varijante
  const i = h.indexOf('data-price-var-id="51557"');
  h = h.slice(0, i) + h.slice(i).replace('49,41 €', '45,00 €');
  let c = C(h);
  ok(c.ok === false && c.vrstaGreske === 'izvlacenje' && /45,00/.test(c.greska), 'C: prikazana cijena ≠ cijena varijante -> izvlacenje (' + c.greska + ')');

  // jedan gumb varijante bez podataka (choose) -> nisu pročitane sve varijante
  h = uzorak(CREAM);
  const j = h.indexOf('data-variation-id="51557"');
  const k = h.indexOf('@click="choose(', j);
  const kraj = h.indexOf("'))\"", k) + 4;
  h = h.slice(0, k) + h.slice(kraj);
  c = C(h);
  ok(c.ok === false && c.vrstaGreske === 'izvlacenje' && /17 od 18/.test(c.greska), 'C: 17 od 18 varijanti pročitano -> izvlacenje (' + c.greska + ')');

  // ld+json cijena ne odgovara nijednoj varijanti
  h = uzorak(EROS).replace(/"price":"?99\.5"?/, '"price":"89.5"');
  c = C(h);
  ok(c.ok === false && c.vrstaGreske === 'izvlacenje' && /ld\+json/.test(c.greska), 'C: ld+json cijena ne odgovara -> izvlacenje (' + c.greska + ')');

  // redovna cijena nije cijena (npr. promijenjen predložak)
  h = uzorak(INTI).replace('<h4>49,41 €</h4>', '<h4>NC 30 dana</h4>');
  c = C(h);
  ok(c.ok === false && c.vrstaGreske === 'izvlacenje' && /redovna/.test(c.greska), 'C: neispravna redovna cijena -> izvlacenje (' + c.greska + ')');

  // jednostavni proizvod: prikazana cijena ≠ podaci; bez ikakve cijene
  h = uzorak(DYLAN).replace('<h2 class="t-700">124,00 €</h2>', '<h2 class="t-700">120,00 €</h2>');
  c = C(h);
  ok(c.ok === false && c.vrstaGreske === 'izvlacenje', 'C: jednostavni proizvod, prikazana cijena ≠ podaci -> izvlacenje (' + c.greska + ')');
  const BEZ_JSON_CIJENE = h0 => h0.split('\\u0022price\\u0022:\\u0022124\\u0022').join('\\u0022price\\u0022:\\u0022\\u0022');
  ok(BEZ_JSON_CIJENE(uzorak(DYLAN)) !== uzorak(DYLAN), 'test: uklanjanje cijene iz podataka proizvoda djeluje');
  h = BEZ_JSON_CIJENE(uzorak(DYLAN)).replace('<h2 class="t-700">124,00 €</h2>', '<h2 class="t-700"></h2>').replace(/application\/ld\+json/g, 'application/x-ld');
  c = C(h);
  ok(c.ok === false && c.vrstaGreske === 'izvlacenje' && /nije pronađena cijena/.test(c.greska), 'C: proizvod bez cijene -> izvlacenje (' + c.greska + ')');
  // nedostaje samo podatak u JSON-u, a prikazana cijena postoji -> koristi se prikazana
  h = BEZ_JSON_CIJENE(uzorak(DYLAN)).replace(/application\/ld\+json/g, 'application/x-ld');
  c = C(h);
  ok(c.ok === true && c.proizvod.jedno && c.proizvod.jedno.cijena === '124,00 €', 'C: bez cijene u podacima koristi se prikazana (' + (c.proizvod && c.proizvod.jedno && c.proizvod.jedno.cijena) + (c.greska || '') + ')');
}

// ---------- C: popis ----------
{
  let h = uzorak('brand_versace.html');
  // jedna kartica bez poveznice na proizvod -> nije pročitana
  const at = h.indexOf('<div class="product-card"');
  const sljedeca = h.indexOf('<div class="product-card"', at + 10);
  h = h.slice(0, at) + h.slice(at, sljedeca).split('href="https://martimex.hr/proizvod/').join('href="https://martimex.hr/nesto/') + h.slice(sljedeca);
  let c = C(h, 'https://martimex.hr/brand/versace/');
  ok(c.ok === false && c.vrstaGreske === 'izvlacenje' && /19 od 20/.test(c.greska), 'C: popis 19 od 20 kartica -> izvlacenje (' + c.greska + ')');
  // većina kartica bez cijene
  h = uzorak('brand_versace.html').replace(/(<div class="product-card__price-wrap)/g, '<div class="x-price-wrap');
  c = C(h, 'https://martimex.hr/brand/versace/');
  ok(c.ok === false && c.vrstaGreske === 'izvlacenje' && /bez cijene/.test(c.greska), 'C: popis bez cijena -> izvlacenje (' + c.greska + ')');
}

// ---------- D: izvlacenje u odgovoru, dojava vlasniku i prigušivanje ----------
const httpUz = izmjene => url => {
  const p = url.replace('https://martimex.hr', '').split('?')[0];
  const name = p.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const f = path.join(samples, (name || 'root') + '.html');
  if (!fs.existsSync(f)) return { json: { statusCode: 404, headers: { 'content-type': 'text/html' }, body: '<html><body class="error404"><main></main></body></html>' } };
  let body = svjez(fs.readFileSync(f, 'utf8'));
  for (const [kljuc, fn] of Object.entries(izmjene)) if (name.includes(kljuc)) body = fn(body);
  return { json: { statusCode: 200, headers: { 'content-type': 'text/html' }, body } };
};
{
  const kvar = { eros_eau_de_parfum: h => h.replace(/"price":"?99\.5"?/, '"price":"89.5"') };
  let staticno = {};
  global.$getWorkflowStaticData = () => staticno;
  let r = tiho(() => pipeline({ upit: 'versace eros eau de parfum' }, { http: httpUz(kvar) }));
  ok(r.D.odgovor.ok === false && /nisu se mogli pouzdano pročitati/.test(r.D.odgovor.greska) && /Ne navodi cijene/.test(r.D.odgovor.greska), 'D: nedosljedna stranica -> ok:false bez cijene (' + (r.D.odgovor.greska || '').slice(0, 120) + ')');
  ok(r.D.interna && /promijenjen izgled weba/.test(r.D.interna), 'D: vlasnik dobiva dojavu o nedosljednoj stranici');
  ok(staticno.zadnjaDojava && staticno.zadnjaDojava.izvlacenje > 0, 'D: vrijeme dojave zapamćeno');
  r = tiho(() => pipeline({ upit: 'versace eros eau de parfum' }, { http: httpUz(kvar) }));
  ok(!r.D.interna && r.D.internaPrigusena, 'D: ista dojava unutar 30 min se priguši');
  staticno.zadnjaDojava.izvlacenje -= 31 * 60 * 1000;
  r = tiho(() => pipeline({ upit: 'versace eros eau de parfum' }, { http: httpUz(kvar) }));
  ok(!!r.D.interna, 'D: nakon 30 min dojava ponovno ide');
  delete global.$getWorkflowStaticData;
  // bez $getWorkflowStaticData (npr. lokalno) dojava ide uvijek
  r = tiho(() => pipeline({ upit: 'versace eros eau de parfum' }, { http: httpUz(kvar) }));
  ok(!!r.D.interna, 'D: bez spremanja stanja dojava ide uvijek');
  // ispravna stranica: nema dojave
  r = tiho(() => pipeline({ upit: 'versace eros eau de parfum' }));
  ok(r.D.odgovor.ok === true && !r.D.interna, 'D: ispravna stranica bez dojave');
}

// ---------- samoprovjera: nedosljedna stranica je greška (ne upozorenje) ----------
{
  const kvar = { labsolu_rouge_intimatte: h => h.replace('<h4>49,41 €</h4>', '<h4>NC 30 dana</h4>') };
  const r = tiho(() => pipeline({ zadatak: 'samoprovjera' }, { http: httpUz(kvar) }));
  ok(r.D.odgovor.ok === false && /SAMOPROVJERA NIJE PROŠLA/.test(r.D.odgovor.opis) && /redovna/.test(r.D.odgovor.opis), 'samoprovjera: nedosljedna stranica = greška (' + r.D.odgovor.opis.slice(0, 160) + ')');
}

// ---------- JSON način ----------
{
  let r = tiho(() => pipeline({ upit: 'lancome labsolu rouge intimatte', format: 'json' }));
  const pd = r.D.odgovor.podaci;
  ok(pd && pd.verzija === 1 && Array.isArray(pd.stranice) && pd.stranice.length === 1, 'JSON: podaci uz odgovor');
  const pr = pd && pd.stranice[0].proizvod;
  ok(pr && pr.varijante.length === 15 && pr.varijante.every(v => typeof v.cijena === 'number' && typeof v.naZalihi === 'boolean'), 'JSON: 15 nijansi s brojčanom cijenom i zalihom');
  const akc = pr && pr.varijante.find(v => v.naAkciji);
  ok(akc && akc.cijena === 32.12 && akc.redovnaCijena === 49.41 && akc.akcijaPct === 35, 'JSON: akcija kao brojevi (' + JSON.stringify(akc) + ')');
  ok(typeof r.D.odgovor.tekst === 'string' && r.D.odgovor.tekst.includes('32,12 €'), 'JSON: tekst ostaje isti');
  r = tiho(() => pipeline({ upit: 'lancome labsolu rouge intimatte' }));
  ok(r.D.odgovor.podaci === undefined, 'JSON: bez format=json nema podataka (tekst kao prije)');
  r = tiho(() => pipeline({ url: '/akcija/', format: 'JSON' }));
  const pp = r.D.odgovor.podaci && r.D.odgovor.podaci.stranice[0].popis;
  ok(pp && pp.proizvodi.length === 20 && pp.proizvodi.every(p => p.url && (p.cijena !== null || p.cijenaTekst)), 'JSON: popis s 20 proizvoda');
  ok(pp && pp.proizvodi.some(p => p.naAkciji && typeof p.redovnaCijena === 'number'), 'JSON: popis ima redovne cijene akcija');
  r = tiho(() => pipeline({ url: '/dostava-i-isporuka/', format: 'json' }));
  const ps = r.D.odgovor.podaci && r.D.odgovor.podaci.stranice[0];
  ok(ps && ps.tip === 'stranica' && ps.tekst.length > 200, 'JSON: informativna stranica nosi tekst');
  r = tiho(() => pipeline({ url: '/proizvod/parfemi/parfemske-vode/ne-postoji-xyz/', format: 'json' }));
  ok(r.D.odgovor.ok === false && r.D.odgovor.podaci && r.D.odgovor.podaci.stranice[0].ok === false && r.D.odgovor.podaci.stranice[0].vrstaGreske === '404', 'JSON: greška stranice u podacima');
  r = tiho(() => pipeline({ upit: 'asdfgh', format: 'json' }));
  ok(r.D.odgovor.podaci && r.D.odgovor.podaci.stranice.length === 0, 'JSON: odgovor bez dohvata ima praznu listu stranica');
  r = tiho(() => pipeline({ zadatak: 'samoprovjera', format: 'json' }));
  ok(r.D.odgovor.podaci === undefined, 'JSON: zadaci ne dobivaju podatke');
}

// ---------- A: format ----------
{
  const nodes = b => ({ 'Zahtjev od Marti': [{ json: b }] });
  const fmt = b => run(CODE.A, 'all', [{ json: {} }], nodes(b))[0].json.kontekst.format;
  ok(fmt({ body: { upit: 'x', format: 'json' } }) === 'json', 'A: format iz tijela');
  ok(fmt({ body: { upit: 'x' }, query: { format: ' JSON ' } }) === 'json', 'A: format iz query, bez obzira na velika slova');
  ok(fmt({ body: { upit: 'x', format: 'xml' } }) === 'tekst', 'A: nepoznat format = tekst');
  ok(fmt({ body: { upit: 'x' } }) === 'tekst', 'A: bez formata = tekst');
}

// ---------- B/D: napomena o odabiru po sličnosti ----------
{
  let r = tiho(() => pipeline({ upit: 'amika body lotion' }));
  ok(r.B.kontekst.odabranTocno === false, 'B: „amika body lotion“ -> proizvod nije točan naziv');
  r = tiho(() => pipeline({ upit: 'lancome labsolu rouge cream' }));
  ok(r.B.kontekst.odabranTocno === true && !/po sličnosti/.test(r.D.odgovor.tekst), 'B/D: „labsolu rouge cream“ je točan (veličina u nazivu ne smeta), bez napomene');
  r = tiho(() => pipeline({ upit: 'versace eros eau de parfum' }));
  ok(r.B.kontekst.odabranTocno === true && !/po sličnosti/.test(r.D.odgovor.tekst), 'B/D: „versace eros eau de parfum“ bez napomene');
  r = tiho(() => pipeline({ upit: 'Atkinsons set' }));
  ok(r.B.kontekst.odabranTocno === null, 'B: upit bez riječi naziva (brend + set) -> nema se što provjeriti');
  // napomena u tekstu kad je stranica dostupna
  r = tiho(() => pipeline({ upit: 'versace eros eau de parfum' }));
  const B = { kontekst: Object.assign({}, r.B.kontekst, { odabranTocno: false }) };
  const st = C(uzorak(EROS), 'https://martimex.hr/proizvod/parfemi/parfemske-vode/eros-eau-de-parfum/');
  const d = run(CODE.D, 'all', [{ json: Object.assign(st, { markdown: '' }) }], { 'Pripremi upit': [{ json: { idx: {} } }], 'Odaberi stranice': [{ json: Object.assign({ url: st.url }, B) }] })[0].json;
  ok(/odabran po sličnosti/.test(d.odgovor.tekst), 'D: napomena o sličnosti kad naziv nije točan');
}

// ---------- B: broj proizvoda brenda samo uz potpunu mapu ----------
{
  const rows = indexRows();
  const red = rows.find(r => r.json.prefiks === 'brend:versace#0');
  const mapa = JSON.parse(red.json.rows);
  const nodes = { 'Zahtjev od Marti': [{ json: { body: { upit: 'versace qwertzuiop' } } }] };
  const tekst = djel => {
    red.json.rows = JSON.stringify(Object.assign({}, mapa, { djelomicno: djel, stranice: 1 }));
    const A = run(CODE.A, 'all', rows, nodes); nodes['Pripremi upit'] = A;
    const B = run(CODE.B, 'all', A, nodes)[0].json;
    return (B.kontekst.rezultat || {}).tekst || '';
  };
  ok(!/provjereno među/.test(tekst(true)), 'B: djelomična mapa -> bez broja proizvoda brenda');
  ok(/provjereno među \d+ proizvoda/.test(tekst(false)), 'B: potpuna mapa -> s brojem proizvoda brenda');
}

// ---------- samoprovjera svaka 3 h: zastarjeli sitemap javlja se samo jutarnja (06:15) ili ručna ----------
{
  const { DateTime } = require('luxon');
  const opis = (izvor, ura) => {
    const t = DateTime.fromObject({ hour: ura, minute: 15 }, { zone: 'Europe/Zagreb' }).toMillis();
    const pravi = Date.now; Date.now = () => t;
    try {
      return run(CODE.D, 'all', [{ json: { ok: true, tip: 'stranica', url: 'https://martimex.hr/dostava-i-isporuka/', ocekuj: 'tekst', markdown: 'x'.repeat(600), generirano: Math.floor(t / 1000), starostS: 1 } }],
        { 'Pripremi upit': [{ json: { idx: { 'product_tag-sitemap': { at: t - 40 * 3600000, v: [1] } } } }], 'Odaberi stranice': [{ json: { kontekst: { zadatak: 'samoprovjera', izvor } } }] })[0].json.odgovor.opis;
    } finally { Date.now = pravi; }
  };
  ok(/nije osvježen 40 h/.test(opis('schedule', 6)), 'samoprovjera 06:15: zastarjeli sitemap javljen');
  ok(!/nije osvježen/.test(opis('schedule', 12)), 'samoprovjera 12:15: zastarjeli sitemap se ne ponavlja (' + opis('schedule', 12).slice(0, 80) + ')');
  ok(/nije osvježen/.test(opis('webhook', 12)), 'samoprovjera pokrenuta webhookom: zastarjeli sitemap javljen');
}

console.log('\nTESTOVI v1.6: ' + pass + ' prolazi, ' + fail + ' ne prolazi');
process.exitCode = fail ? 1 : 0;
