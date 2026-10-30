// Code node "Pripremi upit" (Martimex uživo) – v1
// Ulaz: svi redci Data Tablea "Marti - indeks weba" (ili jedan prazan item kad je tablica prazna).
// Čita zahtjev (webhook / ručni test / Schedule Set nodeovi), parsira indeks i odlučuje treba li sitemape čitati uživo.
// Izlaz: ili jedan item { akcija:'odaberi', kontekst, idx } ili N itema { url, akcija:'sitemapi' } (prvi nosi kontekst i idx).
const TTL_MS = 30 * 60 * 1000;
const OBAVEZNI = ['product-sitemap', 'product_cat-sitemap', 'martimex_brand-sitemap', 'page-sitemap'];
const SITEMAP_DATOTEKE = [
  ['product-sitemap', 'https://martimex.hr/product-sitemap.xml', false],
  ['product-sitemap', 'https://martimex.hr/product-sitemap2.xml', false],
  ['product-sitemap', 'https://martimex.hr/product-sitemap3.xml', false],
  ['product-sitemap', 'https://martimex.hr/product-sitemap4.xml', true],
  ['product_cat-sitemap', 'https://martimex.hr/product_cat-sitemap.xml', false],
  ['product_tag-sitemap', 'https://martimex.hr/product_tag-sitemap.xml', false],
  ['martimex_brand-sitemap', 'https://martimex.hr/martimex_brand-sitemap.xml', false],
  ['martimex_type-sitemap', 'https://martimex.hr/martimex_type-sitemap.xml', false],
  ['martimex_gender-sitemap', 'https://martimex.hr/martimex_gender-sitemap.xml', false],
  ['martimex_scent-sitemap', 'https://martimex.hr/martimex_scent-sitemap.xml', false],
  ['page-sitemap', 'https://martimex.hr/page-sitemap.xml', false],
  ['post-sitemap', 'https://martimex.hr/post-sitemap.xml', false],
  ['martimex_centers-sitemap', 'https://martimex.hr/martimex_centers-sitemap.xml', false]
];
const PRAZNO = /^(\{+\s*[a-z_]+\s*\}+|\[[a-z_]+\]|<[a-z_]+>|upit|url|link|poveznica|null|undefined|none|n\/a|nema|-|\.|\?|""|'')$/i;
const now = Date.now();

function citajZahtjev() {
  const probaj = (ime) => { try { const j = $(ime).first().json; return j || null; } catch (e) { return null; } };
  let j = probaj('Zahtjev od Marti');
  let izvor = 'webhook';
  if (!j) { j = probaj('Primjeri upita'); izvor = 'rucno'; }
  if (!j) { j = probaj('Zadatak: sitemapi'); izvor = 'schedule'; }
  if (!j) { j = probaj('Zadatak: brendovi'); izvor = 'schedule'; }
  if (!j) { j = probaj('Zadatak: samoprovjera'); izvor = 'schedule'; }
  if (!j) { j = {}; izvor = 'nepoznato'; }
  let b = j.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) {
      const o = {};
      for (const pair of b.split('&')) { const i = pair.indexOf('='); if (i > 0) { try { o[decodeURIComponent(pair.slice(0, i).replace(/\+/g, ' '))] = decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' ')); } catch (e2) {} } }
      b = o;
    }
  }
  if (!b || typeof b !== 'object') b = {};
  const q = (j.query && typeof j.query === 'object') ? j.query : {};
  const first = (...v) => v.find(x => x !== undefined && x !== null && String(x).trim() !== '') ?? '';
  const cisti = (s) => String(s).replace(/[\u200b-\u200d\ufeff]/g, '').trim().replace(/^[\s"'`<>\[\]{}()]+|[\s"'`<>\[\]{}()]+$/g, '');
  let upit = cisti(first(b.upit, q.upit, j.upit, b.query, b.trazi, j.trazi));
  let url = cisti(first(b.url, q.url, j.url, b.link, b.poveznica, b.putanja));
  if (PRAZNO.test(upit)) upit = '';
  if (PRAZNO.test(url)) url = '';
  let zadatak = String(first(b.zadatak, q.zadatak, j.zadatak)).toLowerCase().trim();
  if (!['sitemapi', 'brendovi', 'samoprovjera'].includes(zadatak)) zadatak = 'upit';
  const pokvari = /^(1|true|da|yes)$/i.test(String(first(b.pokvari, q.pokvari, j.pokvari)));
  return { izvor, zadatak, upit: upit.slice(0, 300), url: url.slice(0, 500), pokvari, webhook: izvor === 'webhook' };
}

// redci { prefiks:"<kljuc>#<i>", at, broj, rows } -> idx[kljuc] = { at, v }
function parsirajIndeks(items) {
  const idx = {};
  const stanje = [];
  const grupe = {};
  for (const it of items) {
    const r = it.json || {};
    if (typeof r.prefiks !== 'string' || !r.prefiks) continue;
    const m = r.prefiks.match(/^(.*?)(?:#(\d+))?$/);
    const k = m[1];
    const i = m[2] !== undefined ? Number(m[2]) : 0;
    (grupe[k] = grupe[k] || []).push({ i, at: Number(r.at) || 0, broj: Number(r.broj) || 1, rows: String(r.rows ?? '') });
  }
  for (const k of Object.keys(grupe)) {
    const g = grupe[k].sort((a, b) => a.i - b.i);
    const at = Math.max(...g.map(x => x.at));
    const dijelovi = g.filter(x => x.at === at);
    const broj = dijelovi.length ? dijelovi[0].broj : 0;
    const kompletno = broj > 0 && dijelovi.length >= broj && dijelovi.slice(0, broj).every((x, n) => x.i === n);
    if (!kompletno) { stanje.push(k + ': nepotpuno'); continue; }
    try {
      const v = JSON.parse(dijelovi.slice(0, broj).map(x => x.rows).join(''));
      idx[k] = { at, v };
    } catch (e) { stanje.push(k + ': neispravan JSON'); }
  }
  return { idx, stanje };
}

const zahtjev = citajZahtjev();
const { idx, stanje } = parsirajIndeks($input.all());
const sitemapAt = OBAVEZNI.map(p => (idx[p] && Array.isArray(idx[p].v) && idx[p].v.length) ? idx[p].at : 0);
const indeksAt = Math.min(...sitemapAt);
const indeksStarostS = indeksAt > 0 ? Math.round((now - indeksAt) / 1000) : null;
const indeksNepotpun = indeksAt === 0;
const indeksZastario = indeksStarostS === null || indeksStarostS * 1000 > TTL_MS;

let trebaSitemape = false;
if (zahtjev.zadatak === 'sitemapi') trebaSitemape = true;
else if (zahtjev.zadatak === 'upit' && !zahtjev.url && zahtjev.upit && indeksZastario) trebaSitemape = true;
else if (zahtjev.zadatak === 'brendovi' && indeksNepotpun) trebaSitemape = true;

const kontekst = Object.assign({}, zahtjev, {
  pocetak: now,
  indeksStarostS,
  indeksNepotpun,
  indeksStanje: stanje.join('; ') || 'ok',
  sitemapiUzivo: trebaSitemape,
  sitemapDatoteke: SITEMAP_DATOTEKE
});

if (trebaSitemape) {
  return SITEMAP_DATOTEKE.map(([prefiks, url, sonda], i) => ({ json: i === 0 ? { akcija: 'sitemapi', url, prefiks, sonda, kontekst, idx } : { akcija: 'sitemapi', url, prefiks, sonda } }));
}
return [{ json: { akcija: 'odaberi', kontekst, idx } }];
