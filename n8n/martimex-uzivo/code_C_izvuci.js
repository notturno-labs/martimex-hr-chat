// Code node "Izvuci činjenice" (Martimex uživo) – v1, izvršava se po stavci.
// Ulaz: HTTP odgovor stranice (fullResponse: statusCode, headers, body), nakon prvog ili ponovljenog dohvata.
// Klasificira odgovor (nikad ok za grešku, preusmjerenje, ne-HTML ili stare podatke), izvlači činjenice iz JSON-a teme
// (proizvod: varijante, cijene, akcija, zaliha, promo; popis: kartice proizvoda; informativna stranica: očišćen HTML za Markdown).
// Logika preuzeta iz "Izreži glavni sadržaj" (Pročitaj stranicu). Nikad ne baca: greške idu u polje greska.
const JUNK = ['shop-filter', 'category-links-scroll', 'category-links-wrap', 'shop-content__sort', 'js-sort-dd', 'notice-banner', 'gift-card-banner', 'filter-loader', 'auth-flow', 'mobile-menu', 'woocommerce-product-gallery', 'woo-variation-product-gallery', 'pswp', 'yith-wcwl', 'add-to-wishlist', 'notify-me', 'shop-content__below-products', 'pagination-component', 'breadcrumbs', 'product__add-to-cart-notice', 'product__benefits', 'js-show-content', 'product__sku-wrap', 'product__price-wrap', 'product__variations', 'product__add-to-cart-wrap', 'similiar-products', 'commentlist', 'comment-respond', 'woocommerce-Reviews', 'search-preview', 'map-container', 'chanel-espace-logo', 'booking-btn'];
const AV = { InStock: 'na zalihi', OutOfStock: 'nije na zalihi', PreOrder: 'predbilježba', BackOrder: 'po narudžbi', LimitedAvailability: 'ograničena količina', Discontinued: 'više se ne prodaje' };
const MAX_STAROST_REZERVE_S = 600;

function removeBalanced(html, openRe) {
  let out = html; let from = 0;
  for (let guard = 0; guard < 5000; guard++) {
    openRe.lastIndex = from;
    const m = openRe.exec(out);
    if (!m) break;
    const tag = m[1].toLowerCase(); const start = m.index; let end = start + m[0].length;
    if (!/\/>$/.test(m[0])) {
      const tagRe = new RegExp('<(\\/?)' + tag + '\\b[^>]*>', 'gi'); tagRe.lastIndex = start; let depth = 0; let t;
      while ((t = tagRe.exec(out))) { if (/\/>$/.test(t[0])) continue; if (t[1] === '/') { depth--; if (depth === 0) { end = t.index + t[0].length; break; } } else depth++; }
    }
    out = out.slice(0, start) + out.slice(end); from = start;
  }
  return out;
}
function decode(s) {
  return String(s || '').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n))).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&euro;/g, '€')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
const stripTags = s => decode(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const fmtPrice = v => { const n = Number(String(v).replace(',', '.')); return isFinite(n) ? n.toFixed(2).replace('.', ',') + ' €' : String(v); };
const stockText = v => (v === true || v === 'true') ? 'na zalihi' : (v === false || v === 'false') ? 'nije na zalihi' : 'zaliha nepoznata';
function jsonIzAtributa(s) {
  const un = String(s).replace(/\\(u[0-9a-fA-F]{4}|.)/g, (m, g) => g[0] === 'u' ? String.fromCharCode(parseInt(g.slice(1), 16)) : g);
  try { return JSON.parse(un); } catch (e) { try { return JSON.parse(decode(un)); } catch (e2) { return null; } }
}
function balancedEnd(s, start) {
  const tagRe = /<(\/?)div\b[^>]*>/gi; tagRe.lastIndex = start; let depth = 0; let t;
  while ((t = tagRe.exec(s))) { if (t[1] === '/') { depth--; if (depth === 0) return t.index + t[0].length; } else depth++; }
  return s.length;
}
const PROMO_RE = /<div class="awdr_discount_bar\b[^"]*"[^>]*>\s*<div class="awdr_discount_bar_content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
function promosIn(s) { const found = []; for (const m of String(s || '').matchAll(PROMO_RE)) { const t = stripTags(m[1]); if (t && !found.includes(t)) found.push(t); } return found; }
const saleTxt = (pct, reg, low) => (pct > 0 || reg) ? ' (akcija' + (pct > 0 ? ' -' + pct + ' %' : '') + (reg ? ', redovno ' + reg : '') + (low ? ', najniža cijena u zadnjih 30 dana ' + low : '') + ')' : '';

function klasificiraj(j) {
  const out = { fetchError: '', vrstaGreske: '', statusCode: null, preusmjerenoNa: '', cacheHit: false, contentType: '' };
  if (!j || j.error) {
    const msg = String((j && j.error && (j.error.message || j.error.description || j.error)) || 'nepoznata greška');
    out.vrstaGreske = /timeout|ECONNABORTED|ETIMEDOUT|ESOCKETTIMEDOUT/i.test(msg) ? 'timeout' : 'mreza';
    out.fetchError = (out.vrstaGreske === 'timeout' ? 'web nije odgovorio na vrijeme' : 'mrežna greška') + ' (' + msg.slice(0, 120) + ')';
    return out;
  }
  const st = Number(j.statusCode || 0); const h = j.headers || {};
  const hdr = key => String(h[key] ?? h[key.toLowerCase()] ?? '');
  const body = String(j.body ?? j.data ?? '');
  out.statusCode = st; out.contentType = hdr('content-type').toLowerCase(); out.cacheHit = hdr('x-litespeed-cache').toLowerCase() === 'hit';
  if (st >= 300 && st < 400) { out.vrstaGreske = 'preusmjerenje'; out.preusmjerenoNa = hdr('location'); out.fetchError = 'preusmjerenje ' + st + (out.preusmjerenoNa ? ' na ' + out.preusmjerenoNa : ''); return out; }
  if (st === 404 || st === 410) { out.vrstaGreske = '404'; out.fetchError = 'HTTP ' + st + ' (stranica ne postoji)'; return out; }
  if (st === 401 || st === 403 || st === 429) { out.vrstaGreske = 'odbijeno'; out.fetchError = 'HTTP ' + st + ' (pristup odbijen ili zaštita od botova)'; return out; }
  if (st >= 500 || st === 0) { out.vrstaGreske = 'server'; out.fetchError = 'HTTP ' + (st || '?') + ' (greška poslužitelja martimex.hr)'; return out; }
  if (st < 200 || st >= 300) { out.vrstaGreske = 'server'; out.fetchError = 'neočekivan HTTP status ' + st; return out; }
  if (out.contentType && !/text\/html|xhtml/.test(out.contentType)) { out.vrstaGreske = 'nijehtml'; out.fetchError = 'odgovor nije HTML stranica (' + out.contentType.split(';')[0] + ')'; return out; }
  if (!body.trim()) { out.vrstaGreske = 'server'; out.fetchError = 'prazan odgovor'; return out; }
  if (body.length > 4 * 1024 * 1024) { out.vrstaGreske = 'server'; out.fetchError = 'stranica prevelika'; return out; }
  const head = body.slice(0, 3000);
  if (/<title[^>]*>\s*(Just a moment|Attention Required|Access denied|Please Wait|Verifying|One moment|Checking your browser|Bot Verification|Security Check|50\d|40\d|Database Error|Maintenance|WordPress\s*\S?\s*(Error|Gre[sš]ka))/i.test(head)
      || /cf-browser-verification|cf-chl|challenge-platform|grecaptcha|h-captcha|hcaptcha\.com|Error establishing a database connection|Briefly unavailable for scheduled maintenance|There has been a critical error on this website/i.test(body.slice(0, 20000))) {
    out.vrstaGreske = 'server'; out.fetchError = 'stranica je blokirana zaštitom ili vraća grešku servera umjesto sadržaja'; return out;
  }
  if (!/<html\b|<body\b|<main\b/i.test(body.slice(0, 50000))) { out.vrstaGreske = 'nijehtml'; out.fetchError = 'odgovor nije HTML stranica'; return out; }
  if (!/<\/main>/i.test(body) && !/<body\b/i.test(body)) { out.vrstaGreske = 'server'; out.fetchError = 'nepotpun HTML (bez <body>/</main>)'; return out; }
  return out;
}

// kartica proizvoda s popisa -> strukturirano
function kartica(card) {
  const href = (card.match(/href="(https:\/\/martimex\.hr\/proizvod\/[^"]+)"/) || [])[1];
  const textM = card.match(/class="product-card__text-wrap"[^>]*>([\s\S]*?)<\/a>/);
  if (!href || !textM) return null;
  const hs = [...textM[1].matchAll(/<(h[1-6])\b([^>]*)>([\s\S]*?)<\/h[1-6]>/g)].map(m => ({ tag: m[1], cls: m[2], txt: stripTags(m[3]) })).filter(h => h.txt);
  let brend = ''; let naziv = ''; let vrsta = '';
  const b = hs.find(h => /t-700/.test(h.cls)); if (b) brend = b.txt;
  const n = hs.find(h => h.tag === 'h5' || (h.tag === 'h4')); if (n) naziv = n.txt;
  const v = hs.find(h => /base-300/.test(h.cls)); if (v) vrsta = v.txt;
  if (!naziv) naziv = hs.filter(h => h !== b && h !== v).map(h => h.txt).join(' ');
  const cw = card.indexOf('product-card__content-wrap');
  const imgPart = cw > 0 ? card.slice(0, cw) : '';
  const oznake = [...imgPart.matchAll(/btn__label[^>]*>([^<]+)</g)].map(m => decode(m[1]).trim()).filter(Boolean);
  const promos = promosIn(card);
  const pwAt = card.indexOf('<div class="product-card__price-wrap');
  const pwInner = pwAt >= 0 ? card.slice(pwAt, balancedEnd(card, pwAt)) : '';
  const vwAt = card.indexOf('<div class="product-card__variations');
  const vwInner = vwAt >= 0 ? card.slice(vwAt, balancedEnd(card, vwAt)) : '';
  const prices = {}; const simple = {};
  if (pwInner) {
    const tagRe = /<(h3|h5|h6)\b([^>]*)>([\s\S]*?)<\/\1>/g; let t;
    while ((t = tagRe.exec(pwInner))) {
      const idM = t[2].match(/priceClasses\((\d+)\)/);
      const p = idM ? (prices[idM[1]] || (prices[idM[1]] = {})) : simple;
      const txt = stripTags(t[3]).replace(/^NC u zadnjih 30 dana:\s*/i, '');
      if (/former-price/.test(t[2])) p.former = txt; else if (/lowest-price/.test(t[2])) p.lowest = txt; else if (!p.price) p.price = txt;
    }
  }
  const varijante = [];
  if (vwInner) {
    const spanRe = /<span\b([^>]*)>/gi; let sm;
    while ((sm = spanRe.exec(vwInner))) {
      const attrs = sm[1]; const idM = attrs.match(/isActive\((\d+)\)/); if (!idM) continue;
      const oos = /\bout-of-stock\b/.test(attrs);
      const lab = vwInner.slice(sm.index + sm[0].length).match(/^\s*<span class="btn__label[^"]*"[^>]*>([^<]*)</);
      const boja = /single-variation--color/.test(attrs);
      varijante.push({ id: idM[1], oznaka: lab ? decode(lab[1]).trim() : (boja ? 'nijansa ' + (varijante.length + 1) : ''), nijansa: boja, nijeNaZalihi: oos, cijena: (prices[idM[1]] || {}).price || '', redovna: (prices[idM[1]] || {}).former || '', najniza: (prices[idM[1]] || {}).lowest || '' });
    }
  }
  const sve = Object.values(prices).filter(p => p.price);
  const num = s => parseFloat(String(s).replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.'));
  let cijena = simple.price || '';
  let redovna = simple.former || ''; let najniza = simple.lowest || '';
  let raspon = null;
  if (!cijena && sve.length) {
    const vals = sve.map(p => num(p.price)).filter(v => isFinite(v));
    if (vals.length) { const lo = Math.min(...vals), hi = Math.max(...vals); raspon = lo === hi ? fmtPrice(lo) : 'od ' + fmtPrice(lo) + ' do ' + fmtPrice(hi); }
    if (sve.length === 1) { cijena = sve[0].price; redovna = sve[0].former || ''; najniza = sve[0].lowest || ''; }
  }
  const naAkciji = !!(redovna || sve.some(p => p.former) || oznake.some(o => /akcija|sale|%/i.test(o)));
  return { url: href, naziv, brend, vrsta, cijena, raspon, redovna, najniza, naAkciji, promo: promos, oznake: oznake.filter(o => !/%/.test(o)), varijante, nijeNaZalihi: varijante.length > 0 && varijante.every(v => v.nijeNaZalihi), djelomicnoBezZalihe: varijante.some(v => v.nijeNaZalihi) && !varijante.every(v => v.nijeNaZalihi) };
}

// ---------- glavna obrada jedne stranice ----------
let b = {}; let prvi = null; let k = {};
try { b = $('Odaberi stranice').item.json || {}; } catch (e) { b = {}; }
try { k = ($('Odaberi stranice').first().json || {}).kontekst || {}; } catch (e) { k = {}; }
try { prvi = $('Dohvati stranice').item.json || null; } catch (e) { prvi = null; }
const j = $input.item.json || {};
const ponovljeno = j.ponovljeno === true;
const prviSt = prvi ? Number(prvi.statusCode || 0) : 0;
const preusmjereno = ponovljeno && prviSt >= 300 && prviSt < 400;
const rezerva = ponovljeno && !preusmjereno;
let url = String(b.url || '');
if (preusmjereno) { const loc = String((prvi.headers || {}).location || ''); if (loc) url = loc.startsWith('/') ? 'https://martimex.hr' + loc : loc; }
const osnova = { url, urlTrazen: b.url || url, uloga: b.uloga || 'url', brend: b.brend || null, pg: b.pg || null, ocekuj: b.ocekuj || null, namjerno: b.namjerno === true, pokusaj: b.pokusaj || 0, naziv: b.naziv || null, preusmjereno, rezerva, html: '<p></p>' };

try {
  const kl = klasificiraj(j);
  if (kl.fetchError) {
    return { json: Object.assign(osnova, { ok: false, vrstaGreske: kl.vrstaGreske, greska: kl.fetchError, statusCode: kl.statusCode, preusmjerenoNa: kl.preusmjerenoNa, tip: 'greska' }) };
  }
  const html = String(j.body ?? j.data ?? '');
  const genM = html.match(/__wc_fb_page_generated\s*=\s*(\d+)/);
  const generirano = genM ? Number(genM[1]) : null;
  const starostS = generirano ? Math.max(0, Math.round(Date.now() / 1000 - generirano)) : null;
  if ((rezerva || kl.cacheHit) && (starostS === null || starostS > MAX_STAROST_REZERVE_S)) {
    return { json: Object.assign(osnova, { ok: false, vrstaGreske: 'zastarjelo', greska: 'svježa stranica nije dostupna, a kopija iz cachea je ' + (starostS === null ? 'nepoznate starosti' : 'stara ' + Math.round(starostS / 60) + ' min') + ' (dopušteno najviše 10 min)', statusCode: kl.statusCode, tip: 'greska' }) };
  }
  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleM ? decode(titleM[1]).replace(/\s*[-–|]\s*Martimex\s*$/i, '').trim() : '';
  const bodyClass = (html.match(/<body\b[^>]*\bclass="([^"]*)"/i) || [])[1] || '';
  if (/\berror404\b/.test(bodyClass)) return { json: Object.assign(osnova, { ok: false, vrstaGreske: '404', greska: 'stranica ne postoji (404)', statusCode: 404, tip: 'greska' }) };
  const obavijesti = [];
  for (const m of html.matchAll(/<span class="announcements-bar__single-ann[^"]*"[^>]*>([\s\S]*?)<\/span>/g)) { const t = stripTags(m[1]); if (t && !obavijesti.includes(t)) obavijesti.push(t); }

  let tip = 'stranica';
  const pgAt = html.indexOf('<div class="pagination-component"');
  if (/\bsingle-product\b/.test(bodyClass)) tip = 'proizvod';
  else if (/\b(archive|tax-|post-type-archive|woocommerce-shop)\b/.test(bodyClass) || html.includes('class="shop-content"') || pgAt >= 0) tip = 'popis';
  else if (/\bsingle-post\b/.test(bodyClass)) tip = 'clanak';
  else if (/\bhome\b/.test(bodyClass)) tip = 'pocetna';

  let stranicenje = null;
  if (pgAt >= 0) {
    const seg = html.slice(pgAt, balancedEnd(html, pgAt));
    const nums = [...seg.matchAll(/data-page-num="(\d+)"/g)].map(m => Number(m[1]));
    const curTag = (seg.match(/<a\b[^>]*\bclass="[^"]*\bactive\b[^"]*"[^>]*>/) || [])[0] || '';
    const curM = curTag.match(/data-page-num="(\d+)"/);
    const nextTag = (seg.match(/<a\b[^>]*\bclass="[^"]*pagination-component__arrow next[^"]*"[^>]*>/) || [])[0] || '';
    const nextHrefM = nextTag.match(/\bhref="([^"#][^"]*)"/);
    const base = String(url || '').split('?')[0];
    const qs = (String(url || '').split('?')[1] || '').split('&').filter(p => p && !/^pg=/.test(p));
    let sljedeca = '';
    if (nextHrefM && !/\bdisabled\b/.test(nextTag)) {
      const href = decode(nextHrefM[1]);
      if (href.startsWith('?')) { const pg = (href.match(/pg=(\d+)/) || [])[1]; sljedeca = base + '?' + qs.concat(pg ? ['pg=' + pg] : []).join('&'); }
      else sljedeca = href.startsWith('/') ? 'https://martimex.hr' + href : href;
    }
    stranicenje = { trenutna: curM ? Number(curM[1]) : 1, ukupno: nums.length ? Math.max(...nums) : 1, sljedeca };
  }

  const rezultat = Object.assign(osnova, { ok: true, tip, naslov: title, generirano, starostS, cacheHit: kl.cacheHit, statusCode: kl.statusCode, obavijesti, stranicenje });

  // ---------- proizvod ----------
  const spAt = html.indexOf('singleProduct(');
  if (tip === 'proizvod' || spAt >= 0) {
    const from = Math.max(spAt, 0);
    const simAt = html.indexOf('similiar-products', from);
    const zone = simAt > from ? html.slice(from, simAt) : html.slice(from);
    const spM = zone.match(/singleProduct\(JSON\.parse\('([\s\S]*?)'\)\)/);
    const sp = spM ? jsonIzAtributa(spM[1]) : null;
    const prod = sp && sp.product ? sp.product : null;
    let ldName = ''; let ldBrand = ''; const ldOffers = [];
    const ldRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi; let ld;
    while ((ld = ldRe.exec(html))) {
      try {
        const data = JSON.parse(ld[1]); const nodes = [].concat(data['@graph'] || data);
        for (const n of nodes) {
          if (!n || ![].concat(n['@type']).includes('Product')) continue;
          ldName = decode(n.name || ''); ldBrand = (n.brand && n.brand.name) ? decode(n.brand.name) : '';
          for (const o of [].concat(n.offers || [])) { const price = o.price ?? o.lowPrice; const avail = String(o.availability || '').split('/').pop(); ldOffers.push({ price: fmtPrice(price), stock: AV[avail] || avail || 'zaliha nepoznata' }); }
        }
      } catch (e) {}
    }
    const regLow = (id) => {
      let reg = ''; let low = '';
      if (id === undefined || id === null) return { reg, low };
      const pb = zone.match(new RegExp('data-price-var-id="' + id + '"[^>]*>([\\s\\S]*?)<\\/div>'));
      const h4 = pb ? pb[1].match(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/g) : null;
      if (h4 && h4.length >= 2) reg = stripTags(h4[1]);
      else if (pb) { const f = pb[1].match(/former-price[^>]*>([\s\S]*?)<\/h[2-6]>/); if (f) reg = stripTags(f[1]); }
      const lb = zone.match(new RegExp('data-lowest-price-var-id="' + id + '"[^>]*>([\\s\\S]*?)<\\/h6>'));
      if (lb) low = stripTags(lb[1]).replace(/^NC u zadnjih 30 dana:\s*/i, '');
      return { reg, low };
    };
    const varijante = [];
    const seenVar = new Set();
    for (const m of zone.matchAll(/choose\(JSON\.parse\('([\s\S]*?)'\)\)/g)) {
      const v = jsonIzAtributa(m[1]);
      if (!v || typeof v !== 'object' || v.id === undefined || seenVar.has(v.id)) continue;
      seenVar.add(v.id);
      const label = String(v.color || v.label || v.name || '').trim() || ('varijacija ' + v.id);
      const { reg, low } = regLow(v.id);
      const pct = Number(v.salePercentage) || 0;
      varijante.push({ oznaka: label, nijansa: !!(v.color && String(v.color).trim()), cijena: (v.price !== undefined && v.price !== null && v.price !== '') ? fmtPrice(v.price) : '', akcijaPct: pct, redovna: reg, najniza: low, naAkciji: v.onSale === true || pct > 0 || !!reg, zaliha: stockText(v.inStock === true ? true : v.inStock === false ? false : null) });
    }
    if (!varijante.length) {
      const vRe = /<[a-z]+\b[^>]*\bdata-var-name="([^"]*)"[^>]*>/gi; let vm;
      while ((vm = vRe.exec(zone))) {
        const tag = vm[0];
        const priceM = tag.match(/data-var-price="([^"]*)"/); const saleM = tag.match(/data-var-sale-percentage="(\d+)"/);
        const stockM = tag.match(/inStock(?:\\u0022|&quot;|")\s*:\s*(true|false)/); const colorM = tag.match(/data-var-color="([^"]*)"/);
        const vidM = tag.match(/data-variation-id="(\d+)"/); const { reg, low } = regLow(vidM ? vidM[1] : null); const pct = saleM ? Number(saleM[1]) : 0;
        varijante.push({ oznaka: (colorM && colorM[1].trim()) ? decode(colorM[1]).trim() : decode(vm[1]), nijansa: !!(colorM && colorM[1].trim()), cijena: priceM ? fmtPrice(priceM[1]) : '', akcijaPct: pct, redovna: reg, najniza: low, naAkciji: pct > 0 || !!reg, zaliha: stockText(stockM ? stockM[1] : null) });
      }
    }
    let jedno = null;
    if (!varijante.length) {
      let stock = 'zaliha nepoznata';
      if (prod && typeof prod.inStock === 'boolean') stock = stockText(prod.inStock);
      else { const spStockM = spAt >= 0 ? html.slice(spAt, spAt + 4000).match(/inStock(?:\\u0022|&quot;|")\s*:\s*(true|false)/) : null; stock = spStockM ? stockText(spStockM[1]) : (ldOffers[0] ? ldOffers[0].stock : 'zaliha nepoznata'); }
      let cijena = '';
      if (prod && prod.price !== undefined && prod.price !== null && prod.price !== '') cijena = fmtPrice(prod.price); else if (ldOffers[0]) cijena = ldOffers[0].price;
      const ppM = zone.match(/<div class="product__price[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      const hs = ppM ? [...ppM[1].matchAll(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/g)].map(m => stripTags(m[1])) : [];
      const lowM = zone.match(/class="lowest-price[^"]*"[^>]*>([\s\S]*?)<\/h6>/);
      const reg = hs.length >= 2 ? hs[1] : (ppM && /former-price/.test(ppM[1]) ? stripTags((ppM[1].match(/former-price[^>]*>([\s\S]*?)<\/h/) || [])[1] || '') : '');
      const low = lowM ? stripTags(lowM[1]).replace(/^NC u zadnjih 30 dana:\s*/i, '') : '';
      const pct = prod ? (Number(prod.salePercentage) || 0) : 0;
      jedno = { cijena, akcijaPct: pct, redovna: reg, najniza: low, naAkciji: (prod && prod.onSale === true) || pct > 0 || !!reg, zaliha: stock };
    }
    const naziv = (prod && prod.name) ? decode(String(prod.name)) : (ldName || title);
    const brendIme = (prod && prod.brandName) ? decode(String(prod.brandName)) : ldBrand;
    const kategorija = (prod && prod.category) ? decode(String(prod.category)) : '';
    const kategorijaGlavna = (prod && prod.categoryMain) ? decode(String(prod.categoryMain)) : '';
    const bcM = html.match(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/);
    const breadcrumbs = bcM ? [...bcM[0].matchAll(/<a href="([^"]+)" class="h6">([^<]*)<\/a>/g)].map(m => ({ naziv: stripTags(m[2]), url: m[1] })).filter(x => x.url !== 'https://martimex.hr/') : [];
    const promo = promosIn(zone);
    const slicni = [];
    if (simAt > 0) {
      const simZone = html.slice(simAt, Math.min(html.length, simAt + 80000));
      let pos = 0;
      for (let guard = 0; guard < 12; guard++) { const at = simZone.indexOf('<div class="product-card"', pos); if (at < 0) break; const end = balancedEnd(simZone, at); const c = kartica(simZone.slice(at, end)); if (c && c.url !== url) slicni.push({ naziv: c.naziv, brend: c.brend, url: c.url }); pos = end; }
    }
    const opisM = html.match(/<div class="product__description[^"]*"[^>]*>([\s\S]*?)<div class="product__show-description/) || html.match(/<div class="product__description[^"]*"[^>]*>([\s\S]*?)<\/section>/);
    let opisHtml = opisM ? opisM[1].replace(/<h3[^>]*>\s*Opis proizvoda\s*<\/h3>/i, '').replace(/<script\b[\s\S]*?<\/script>/gi, '') : '';
    const opisTekst = stripTags(opisHtml);
    const recenice = opisTekst.split(/(?<=[.!?])\s+/);
    const noteRecenice = recenice.filter(s => /\bnot[aeiu]\b|\bnotama\b|\bnotom\b|\bakord/i.test(s)).slice(0, 2).join(' ');
    rezultat.proizvod = { naziv, brend: brendIme, kategorija, kategorijaGlavna, breadcrumbs, varijante, jedno, promo, slicni: slicni.slice(0, 4), note: noteRecenice.slice(0, 260), opisZnakova: opisTekst.length, bezZalihe: varijante.length ? varijante.every(v => v.zaliha === 'nije na zalihi') : (jedno ? jedno.zaliha === 'nije na zalihi' : false) };
    rezultat.html = opisHtml.trim() ? ('<div>' + opisHtml.slice(0, 60000) + '</div>') : '<p></p>';
    if (k.brendProvjera && brendIme) {
      const n = s => String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '');
      rezultat.drugiBrend = n(brendIme) !== n(k.brendProvjera) && !n(k.brendProvjera).includes(n(brendIme)) && !n(brendIme).includes(n(k.brendProvjera));
    }
    return { json: rezultat };
  }

  // ---------- glavni sadržaj ----------
  let main = '';
  const ms = html.search(/<main\b/i); const me = html.lastIndexOf('</main>');
  if (ms >= 0 && me > ms) main = html.slice(ms, me + 7); else { const bs = html.search(/<body\b/i); main = bs >= 0 ? html.slice(bs) : html; }
  main = main.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '').replace(/<!--[\s\S]*?-->/g, '');

  const potkategorije = [];
  for (const m of main.matchAll(/<a\b([^>]*\bclass="[^"]*category-links__item[^"]*"[^>]*)>([\s\S]*?)<\/a>/g)) {
    const hrefM = m[1].match(/\bhref="([^"]*)"/); const naziv = stripTags(m[2]);
    if (!hrefM || !naziv) continue;
    const u = decode(hrefM[1]).split('?')[0];
    if (!potkategorije.some(p => p.url === u)) potkategorije.push({ naziv, url: u });
    if (potkategorije.length >= 40) break;
  }

  if (tip === 'popis' || main.includes('<div class="product-card"')) {
    const proizvodi = [];
    let pos = 0;
    for (let guard = 0; guard < 300; guard++) {
      const at = main.indexOf('<div class="product-card"', pos); if (at < 0) break;
      const end = balancedEnd(main, at); const c = kartica(main.slice(at, end)); if (c) proizvodi.push(c); pos = end;
    }
    const h1 = (main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
    const opisPopisa = stripTags((main.match(/<div class="shop-content__description[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '').slice(0, 400);
    rezultat.popis = { naslov: h1 ? stripTags(h1) : title, proizvodi, potkategorije, opis: opisPopisa, brojProizvoda: proizvodi.length };
    if (tip !== 'popis' && proizvodi.length) rezultat.tip = 'popis';
    if (rezultat.tip === 'popis') { rezultat.html = '<p></p>'; return { json: rezultat }; }
  }

  // informativna stranica / članak / početna: očišćen HTML za Markdown node
  const junkRe = new RegExp('<([a-z][a-z0-9]*)\\b[^>]*\\bclass="[^"]*(?:' + JUNK.join('|') + ')[^"]*"[^>]*>', 'gi');
  main = removeBalanced(main, junkRe);
  main = removeBalanced(main, /<([a-z][a-z0-9]*)\b[^>]*(?<![:\w-])class="(?![^"]*\bd-(?:sm|md|lg|xl|xxl)-)(?:[^"]*\s)?d-none(?:\s[^"]*)?"[^>]*>/gi);
  main = removeBalanced(main, /<([a-z][a-z0-9]*)\b[^>]*\bstyle="[^"]*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^"]*"[^>]*>/gi);
  // gumbi s iznosima (npr. vrijednosti poklon bona) ostaju kao tekst; ostali gumbi i obrasci se uklanjaju
  main = main.replace(/<button\b[^>]*>([\s\S]*?)<\/button>/gi, (all, inner) => { const t = stripTags(inner); return (/\d/.test(t) && t.length <= 40) ? '<span>' + t + '</span> ' : all; });
  main = removeBalanced(main, /<(template|svg|iframe|picture|video|select|button|form)\b[^>]*>/gi);
  main = main.replace(/<(img|input|source|link|meta)\b[^>]*>/gi, '');
  main = main.replace(/<div class="accordion__trigger"[^>]*>([\s\S]*?)<\/div>/g, (all, inner) => { const t = stripTags(inner); return t ? '<h3>' + t + '</h3>' : ''; });
  main = main.replace(/<(div|span|p|h[1-6])\b[^>]*class="[^"]*store-card__title(?!-compact)[^"]*"[^>]*>([\s\S]*?)<\/\1>/g, (all, tag, inner) => '<h3>' + stripTags(inner) + '</h3>');
  main = main.replace(/<a\b[^>]*href="https?:\/\/(?:www\.)?google\.[^"]*"[^>]*>([\s\S]*?)<\/a>/g, (all, inner) => '<div>' + inner + '</div>');
  main = main.replace(/<(div|span|p)\b[^>]*class="[^"]*store-meta__info-line[^"]*"[^>]*>([\s\S]*?)<\/\1>/g, (all, tag, inner) => '<p>' + inner + '</p>');
  main = main.replace(/<(div|span|p)\b[^>]*class="[^"]*chanel-espace-locations__item-title[^"]*"[^>]*>([\s\S]*?)<\/\1>/g, (all, tag, inner) => '<h3>' + stripTags(inner) + '</h3>');
  main = main.replace(/(<\/(?:p|span|h[1-6]|div|li|strong|b|em|a)>)/gi, '$1 ');
  rezultat.html = main.length > 250000 ? main.slice(0, 250000) : main;
  rezultat.potkategorije = potkategorije;
  return { json: rezultat };
} catch (e) {
  return { json: Object.assign(osnova, { ok: false, vrstaGreske: 'interna', greska: 'interna greška pri obradi stranice (' + String(e && e.message || e).slice(0, 160) + ')', tip: 'greska' }) };
}
