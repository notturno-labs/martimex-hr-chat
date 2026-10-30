// Lokalni testni okvir: oponaša n8n Code node okolinu ($input, $(), $json, $now, DateTime) i pokreće A -> B -> (HTTP iz uzoraka) -> C -> Markdown -> D.
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');
const { NodeHtmlMarkdown } = require('node-html-markdown');
const dir = __dirname;
const samplesDir = path.join(dir, 'samples');
const code = n => fs.readFileSync(path.join(dir, n), 'utf8');
const CODE = { A: code('code_A_pripremi.js'), B: code('code_B_odaberi.js'), C: code('code_C_izvuci.js'), D: code('code_D_sastavi.js'), E: code('code_E_redci.js') };

// ulazni indeks: product/tag/post iz Data Tablea + ručno upisani ostali sitemapi
function indexRows() {
  const rows = JSON.parse(fs.readFileSync(path.join(dir, 'data', 'index_rows_products.json'), 'utf8'));
  const extra = JSON.parse(fs.readFileSync(path.join(dir, 'index_extra.json'), 'utf8'));
  const at = Date.now() - 5 * 60 * 1000;
  for (const [k, v] of Object.entries(extra)) rows.push({ prefiks: k + '#0', at, broj: 1, rows: JSON.stringify(v) });
  for (const r of rows) if (r.prefiks.startsWith('product-sitemap') || r.prefiks.startsWith('post') || r.prefiks.startsWith('product_tag')) r.at = at;
  if (fs.existsSync(path.join(dir, 'index_brands.json'))) { const b = JSON.parse(fs.readFileSync(path.join(dir, 'index_brands.json'), 'utf8')); for (const [k, v] of Object.entries(b)) rows.push({ prefiks: k + '#0', at, broj: 1, rows: JSON.stringify(v) }); }
  return rows.map(r => ({ json: r }));
}

function run(codeStr, mode, items, nodes, extra) {
  const results = [];
  const mk = (item) => {
    const $ = (name) => {
      const out = nodes[name];
      if (!out) throw new Error('No data for node ' + name);
      return { first: () => out[0], all: () => out, item: item && item.__paired && name in item.__paired ? item.__paired[name] : out[Math.min(out.length - 1, item ? item.__i || 0 : 0)] };
    };
    const $input = { all: () => items, first: () => items[0], item };
    const fn = new Function('$input', '$', '$json', '$now', 'DateTime', codeStr);
    return fn($input, $, item ? item.json : undefined, DateTime.now(), DateTime);
  };
  if (mode === 'all') { const r = mk(null); return Array.isArray(r) ? r : [r]; }
  items.forEach((it, i) => { it.__i = i; const r = mk(it); const o = Array.isArray(r) ? r[0] : r; o.__i = i; o.__paired = it.__paired; results.push(o); });
  return results;
}

function fakeHttp(url) {
  // mapiranje URL -> datoteka uzorka
  const p = url.replace('https://martimex.hr', '').split('?')[0];
  const name = p.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const f = path.join(samplesDir, (name || 'root') + '.html');
  if (fs.existsSync(f)) return { json: { statusCode: 200, headers: { 'content-type': 'text/html; charset=UTF-8', 'x-litespeed-cache-control': 'no-cache' }, body: fs.readFileSync(f, 'utf8').replace(/__wc_fb_page_generated\s*=\s*\d+/, '__wc_fb_page_generated = ' + Math.floor(Date.now() / 1000 - 1)) } };
  if (/ne-postoji/.test(p)) return { json: { statusCode: 404, headers: { 'content-type': 'text/html' }, body: '<html><body class="error404"><main></main></body></html>' } };
  return { json: { statusCode: 404, headers: { 'content-type': 'text/html' }, body: '<html><body class="error404"><main></main></body></html>', __nemaUzorka: url } };
}

function pipeline(body, opts) {
  opts = opts || {};
  const nodes = {};
  nodes['Zahtjev od Marti'] = [{ json: { headers: {}, body } }];
  const idxItems = indexRows();
  const t0 = Date.now();
  let A = run(CODE.A, 'all', idxItems, nodes); nodes['Pripremi upit'] = A;
  const tA = Date.now() - t0;
  let bInput = A;
  if (A[0].json.akcija === 'sitemapi') { console.log('  [A] traži sitemape uživo (' + A.length + ')'); bInput = A.map(a => ({ json: { statusCode: 404, body: '' } })); }
  const t1 = Date.now();
  let B = run(CODE.B, 'all', bInput, nodes); nodes['Odaberi stranice'] = B;
  if (B[0].json.akcija === 'sitemapi') { console.log('  [B] ništa nađeno -> osvježi sitemape (simulirano: svi 404) i ponovi'); const bIn2 = B.map(a => ({ json: { statusCode: 404, body: '' } })); B = run(CODE.B, 'all', bIn2, nodes); nodes['Odaberi stranice'] = B; }
  const tB = Date.now() - t1;
  const akcija = B[0].json.akcija;
  let D;
  if (akcija === 'dohvati') {
    const http = B.map((b, i) => { const r = fakeHttp(b.json.url); r.__i = i; r.__paired = { 'Odaberi stranice': b, 'Dohvati stranice': r }; return r; });
    nodes['Dohvati stranice'] = http;
    const t2 = Date.now();
    const C = run(CODE.C, 'each', http, nodes); nodes['Izvuci činjenice'] = C;
    const tC = Date.now() - t2;
    const md = C.map(c => { const o = { json: Object.assign({}, c.json, { markdown: NodeHtmlMarkdown.translate(c.json.html || '') }) }; o.__paired = c.__paired; return o; });
    const t3 = Date.now();
    D = run(CODE.D, 'all', md, nodes);
    console.log('  [vrijeme ms] A', tA, 'B', tB, 'C', tC, 'D', Date.now() - t3, '| stranice:', B.map(b => b.json.url).join(' , '));
  } else {
    D = run(CODE.D, 'all', B, nodes);
    console.log('  [vrijeme ms] A', tA, 'B', tB, '| akcija', akcija);
  }
  nodes['Sastavi odgovor'] = D;
  const E = run(CODE.E, 'all', D, nodes);
  return { D: D[0].json, E, B: B[0].json, A: A[0].json };
}

module.exports = { pipeline, run, CODE, indexRows };

if (require.main === module) {
  const arg = process.argv[2];
  const body = arg ? JSON.parse(arg) : { upit: 'versace eros eau de parfum' };
  const r = pipeline(body);
  console.log(JSON.stringify(r.D.odgovor, null, 1));
  console.log('tip:', r.B.kontekst && r.B.kontekst.tip, '| spremi:', r.E.length, 'redaka', r.E.map(e => e.json.prefiks).join(','), '| tekst znakova:', (r.D.odgovor.tekst || r.D.odgovor.greska || '').length);
}
