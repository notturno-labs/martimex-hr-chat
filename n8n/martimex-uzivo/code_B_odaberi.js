// Code node "Odaberi stranice" (Martimex uživo) – v1.3
// Ulaz: (a) item { akcija:'odaberi', kontekst, idx } iz "Pripremi upit" ili (b) HTTP odgovori sitemapa (redoslijed = kontekst.sitemapDatoteke).
// Deterministički (bez AI-ja) odlučuje koje stranice martimex.hr treba pročitati uživo: tema → informativna stranica,
// brend/kategorija → popis, naziv proizvoda → 1–3 stranice proizvoda. Nikad ne baca; greške vraća kao akcija 'odgovori'.
const STOP = new Set(['de', 'eau', 'za', 'the', 'of', 'la', 'le', 'ml', 'pour', 'et', 'i', 'u', 'na', 'by', 'and', 'en', 'a', 'je', 'li', 'da', 'ne', 'mi', 'me', 'se', 'su', 'sam', 'smo', 'ste', 'ima', 'imate', 'imam', 'imaju', 'nema', 'nemate', 'koliko', 'kosta', 'kostaju', 'kolika', 'cijena', 'cijene', 'cijenu', 'cijeni', 'kakva', 'kakve', 'kakav', 'koji', 'koja', 'koje', 'kojeg', 'koju', 'sto', 'gdje', 'kada', 'kako', 'zasto', 'moze', 'mogu', 'mozete', 'mozemo', 'molim', 'trebam', 'trebao', 'trebala', 'treba', 'zelim', 'zelio', 'zeljela', 'htio', 'htjela', 'bih', 'bi', 'hocu', 'vas', 'vasa', 'vase', 'vasem', 'vasoj', 'vam', 'nas', 'nasa', 'vi', 'ti', 'ja', 'on', 'ona', 'ono', 'oni', 'to', 'ovo', 'ovaj', 'ova', 'taj', 'ta', 'te', 'tog', 'tom', 's', 'sa', 'o', 'od', 'do', 'iz', 'po', 'pri', 'il', 'ili', 'ako', 'kad', 'kod', 'jel', 'dal', 'dali', 'jeli', 'prodajete', 'nudite', 'ponudi', 'ponuda', 'ponudu', 'proizvod', 'proizvodi', 'proizvoda', 'proizvode', 'artikl', 'artikal', 'dostupan', 'dostupno', 'dostupni', 'dostupna', 'imali', 'webshop', 'web', 'shop', 'martimex', 'martimexu', 'kupiti', 'kupnja', 'naruciti', 'online', 'uopce', 'trenutno', 'sad', 'sada', 'jos', 'vise', 'malo', 'nesto', 'neki', 'neka', 'neko', 'mozda', 'molimo', 'hvala', 'bok', 'pozdrav']);
const WEAK = new Set(['parfum', 'parfem', 'parfemska', 'parfemi', 'parfema', 'parfeme', 'voda', 'toilette', 'toaletna', 'edp', 'edt', 'extrait', 'set', 'cologne', 'kolonjska', 'homme', 'femme', 'men', 'women', 'man', 'woman', 'intense', 'for', 'him', 'her', 'spray', 'sprej', 'miris', 'mirisi', 'mirisa', 'original', 'originalni', 'novi', 'nova', 'novo']);
const NOISE = new Set([...STOP, ...WEAK, 'g', 'kopiraj', 'copy']);
const ZAMJENE = { edp: 'parfum', edt: 'toilette', edc: 'cologne', sminka: 'makeup', sminke: 'makeup', sminku: 'makeup', dezodorans: 'deodorant', dezodoransi: 'deodorant', nisni: 'niche', nisne: 'niche', nis: 'niche', sunce: 'suncanje', suncu: 'suncanje', ruz: 'ruzevi', ruzevi: 'ruzevi', ruzeve: 'ruzevi', sampon: 'samponi', samponi: 'samponi', regenerator: 'regeneratori', lice: 'lica', tijelo: 'tijela', kosa: 'kose', kosu: 'kose', nokte: 'nokti', nokat: 'nokti' };
const SINONIMI = { krema: ['cream', 'creme', 'kreme'], kreme: ['cream', 'creme', 'krema'], mlijeko: ['milk', 'lait'], ulje: ['oil', 'huile'], sprej: ['spray'], spray: ['sprej'], losion: ['lotion'], maska: ['mask', 'masque'], maske: ['mask', 'masque'], sampon: ['shampoo', 'shampooing', 'samponi'], samponi: ['shampoo', 'shampooing'], regenerator: ['conditioner', 'regeneratori'], regeneratori: ['conditioner'], puder: ['powder', 'foundation', 'puderi'], ruzevi: ['lipstick', 'rouge', 'ruz'], maskara: ['mascara'], mascara: ['maskara'], sjenilo: ['eyeshadow', 'shadow', 'sjenila'], sjenila: ['eyeshadow', 'shadow'], tus: ['eyeliner', 'liner'], lak: ['nail', 'polish', 'lakovi'], balzam: ['balm', 'balsam'], pjena: ['mousse', 'foam'], sapun: ['soap', 'savon'], tonik: ['toner', 'tonic'], piling: ['scrub', 'peeling', 'exfoliant'], serum: ['serum'], njega: ['care'], lice: ['face', 'visage', 'lica'], lica: ['face', 'visage'], tijelo: ['body', 'corps', 'tijela'], tijela: ['body', 'corps'], oci: ['eye', 'eyes', 'yeux'], usne: ['lip', 'lips', 'levres'], kosa: ['hair', 'kose'], kose: ['hair'], ruke: ['hand', 'hands', 'mains'], suncanje: ['sun', 'solaire', 'solar', 'tanning', 'bronz'], zastita: ['protection', 'protective'], zastitni: ['protection', 'protective'], noc: ['night', 'nuit'], dan: ['day', 'jour'], muski: ['men', 'homme', 'man'], zenski: ['women', 'femme', 'woman'], poklon: ['gift', 'set'], set: ['set', 'coffret', 'kit'], mini: ['mini', 'travel'], dezodorans: ['deo', 'deodorant'], deodorant: ['deo', 'dezodorans'], gel: ['gel'], voda: ['water', 'eau'], svijeca: ['candle', 'bougie'], difuzor: ['diffuser', 'diffuseur'], miris: ['fragrance', 'parfum', 'scent'], dom: ['home', 'room', 'maison'] };
const BREND_STOP = new Set(['the', 'of', 'paris', 'firenze', 'seoul', 'institute', 'dr', '1920', 'wonder', 'london', 'milano', 'roma', 'venice']);
const ALIASI = {
  'd g': 'dolcegabbana', 'dg': 'dolcegabbana', 'dolce gabbana': 'dolcegabbana', 'dolce': 'dolcegabbana', 'gabbana': 'dolcegabbana', 'd and g': 'dolcegabbana',
  'ysl': 'yves-saint-laurent', 'saint laurent': 'yves-saint-laurent', 'yves': 'yves-saint-laurent', 'laurent': 'yves-saint-laurent',
  'viktor rolf': 'viktorrolf', 'viktor': 'viktorrolf', 'rolf': 'viktorrolf',
  'rabanne': 'paco-rabanne', 'paco': 'paco-rabanne',
  'jpg': 'jean-paul-gaultier', 'gaultier': 'jean-paul-gaultier', 'jean paul': 'jean-paul-gaultier',
  'boss': 'hugo-boss', 'hugo': 'hugo-boss',
  'house of oud': 'thoo', 'the house of oud': 'thoo',
  'etat libre': 'etat-libre-dorange', 'etat': 'etat-libre-dorange', 'etat libre d orange': 'etat-libre-dorange',
  'penhaligon': 'penhaligons', 'penhaligon s': 'penhaligons',
  'giorgio armani': 'armani', 'giorgio': 'armani', 'emporio armani': 'armani', 'emporio': 'armani',
  'dsquared': 'dsquared2', 'dsq': 'dsquared2', 'dsquared 2': 'dsquared2',
  'estee': 'estee-lauder', 'lauder': 'estee-lauder', 'elie': 'elie-saab', 'saab': 'elie-saab',
  'carolina': 'carolina-herrera', 'herrera': 'carolina-herrera', 'michael': 'michael-kors', 'kors': 'michael-kors', 'mk': 'michael-kors',
  'tiziana': 'tiziana-terenzi', 'terenzi': 'tiziana-terenzi', 'merchant of venice': 'the-merchant-of-venice', 'merchant': 'the-merchant-of-venice',
  'mont blanc': 'montblanc', 'vranjes': 'dr-vranjes-firenze', 'dr vranjes': 'dr-vranjes-firenze', 'irena eris': 'dr-irena-eris', 'eris': 'dr-irena-eris',
  'ddp': 'diego-dalla-palma', 'dalla palma': 'diego-dalla-palma', 'biagiotti': 'laura-biagiotti', 'salvatore ferragamo': 'ferragamo', 'salvatore': 'ferragamo',
  'eisenberg': 'eisenberg-paris', 'anomalia': 'anomalia-paris', 'purito': 'purito-seoul', 'idc': 'idc-institute', 'haruharu': 'haruharu-wonder',
  'marlies': 'marlies-moller', 'moller': 'marlies-moller', 'oleari': 'naj-oleari', 'olivia': 'olivia-garden', 'frieda': 'john-frieda',
  'plein': 'philipp-plein', 'cucinelli': 'brunello-cucinelli', 'arden': 'elizabeth-arden', 'greyl': 'leonor-greyl', 'villoresi': 'lorenzo-villoresi',
  'heiligmann': 'monika-heiligmann', 'vcanto': 'v-canto', 'thierry mugler': 'mugler', 'thierry': 'mugler', 'gianni versace': 'versace',
  'five': '5five', 'born to stand out': 'borntostandout', 'memo paris': 'memo', 'bois': 'bois-1920'
};
const NEPOZNATI_BRENDOVI = ['dior', 'christian dior', 'gucci', 'givenchy', 'hermes', 'burberry', 'calvin klein', 'lacoste', 'bvlgari', 'bulgari', 'cartier', 'creed', 'kilian', 'byredo', 'le labo', 'diptyque', 'maison margiela', 'margiela', 'jo malone', 'guerlain', 'nina ricci', 'kenzo', 'azzaro', 'davidoff', 'lanvin', 'cacharel', 'escada', 'jimmy choo', 'marc jacobs', 'narciso rodriguez', 'zadig voltaire', 'tiffany', 'bottega veneta', 'loewe', 'acqua di parma', 'amouage', 'initio', 'parfums de marly', 'nishane', 'roja', 'clive christian', 'maybelline', 'loreal', 'l oreal', 'nyx', 'mac', 'clinique', 'la roche posay', 'vichy', 'nivea', 'dolce vita', 'armaf', 'ajmal', 'rasasi', 'afnan', 'bentley', 'ferrari', 'adidas', 'playboy', 'joop', 'mexx', 'bruno banani', 'hollister', 'abercrombie', 'victoria secret', 'victoria s secret', 'rituals', 'yankee candle'];
const TEME = [
  { id: 'dostava', url: ['/dostava-i-isporuka/'], re: [/^dostav/, /^postarin/, /^isporuk/, /^paket/, /^paketomat/, /^slanj/, /^posilj/, /^posalj/, /^kurir/, /^gls$/, /^box ?now/, /^inozemstv/, /^dostavljat/, /^rok/, /^besplatn/] },
  { id: 'placanje', url: ['/placanje-robe/'], re: [/^placanj/, /^platit/, /^plati$/, /^placa/, /^rat[ae]$/, /^rate$/, /^obrok/, /^obroc/, /^pouzec/, /^virman/, /^uplatnic/, /^kartic/, /^gotovin/, /^paypal/, /^keks/, /^transakcij/, /^racun/] },
  { id: 'povrat', url: ['/povrat-i-reklamacija/'], re: [/^povrat/, /^vrati/, /^vratit/, /^zamjen/, /^zamijen/, /^reklamac/, /^ostecen/, /^neispravn/, /^pogresn/, /^krivi/, /^krivo/, /^zamjenu/] },
  { id: 'otkazivanje', url: ['/otkazivanje-povrat/', '/povrat-i-reklamacija/'], re: [/^otkaz/, /^otkazat/, /^odusta/, /^raskid/, /^storn/, /^ponist/] },
  { id: 'poslovnice', url: ['/poslovnice/'], re: [/^poslovnic/, /^trgovin/, /^ducan/, /^parfumerij/, /^adres/, /^radno/, /^vrijem/, /^lokacij/, /^nalazite/, /^fizick/, /^prodavaonic/] },
  { id: 'kontakt', url: ['/kontakt/'], re: [/^kontakt/, /^telefon/, /^broj$/, /^mail/, /^e ?mail/, /^mejl/, /^sluzb/, /^korisni/, /^podrsk/, /^nazvati/, /^zvati/, /^javiti/] },
  { id: 'loyalty', url: ['/loyalty-program/', '/martimex-loyalty-card/'], re: [/^loyalt/, /^bod$/, /^bodov/, /^bodove/, /^vjernost/, /^gold/, /^clan/, /^program/, /^kartic/] },
  { id: 'poklon-bon', url: ['/poklon-bon/'], re: [/^bon$/, /^bonov/, /^vaucer/, /^voucher/, /^gift/, /^darovn/, /^poklon ?bon/] },
  { id: 'pokloni-uz-kupnju', url: ['/pokloni-uz-kupnju/'], re: [/^gratis/, /^poklon ?uz/, /^besplat/, /^uz ?kupnju/] },
  { id: 'faq', url: ['/najcesca-pitanja/'], re: [/^faq/, /^pitanj/, /^najcesc/, /^narucit/, /^narudzb/, /^narucivanj/, /^registrac/, /^racun$/] },
  { id: 'uvjeti', url: ['/opci-uvjeti-poslovanja/'], re: [/^uvjet/, /^poslovanj/, /^pravn/, /^ugovor/] },
  { id: 'privatnost', url: ['/pravila-privatnosti/'], re: [/^privatnost/, /^osobn/, /^podac/, /^podatak/, /^gdpr/, /^kolacic/, /^cookie/] },
  { id: 'o-nama', url: ['/o-nama/'], re: [/^nama$/, /^tko$/, /^povijest/, /^tvrtk/, /^firm/, /^kompanij/, /^poduzec/] },
  { id: 'beauty', url: ['/beauty-centri/', '/beauty-saloni/'], re: [/^beauty/, /^salon/, /^tretman/, /^termin/, /^kozmetic/, /^njegu lica u/, /^masaz/, /^centar/, /^centri/] },
  { id: 'chanel', url: ['/chanel/', '/chanel-beauty-appointment/'], re: [/^chanel/, /^shanel/, /^sanel/] },
  { id: 'akcija', url: ['/akcija/'], re: [/^akcij/, /^snizen/, /^sale$/, /^popust/, /^rasprodaj/, /^promo/, /^kupon/, /^kod$/, /^outlet/] },
  { id: 'novo', url: ['/novo/'], re: [/^novo$/, /^novitet/, /^novosti/, /^najnovij/, /^nov[ia]$/] },
  { id: 'furla', url: ['/furla/', '/kontakt-furla/'], re: [/^furla/] },
  { id: 'savjeti', url: ['/savjeti/'], re: [/^savjet/, /^blog/, /^clan[ae]k/, /^clanc/] }
];
const JAKE_TEME = new Set(['dostava', 'placanje', 'povrat', 'otkazivanje', 'poslovnice', 'kontakt', 'loyalty', 'poklon-bon', 'chanel', 'akcija', 'novo']);
const ROD = [[/^(muski|muskarc|muskarac|muske|musku|muskog|muskom|gospod|decki|decko|frajer|njemu|momk)/, 32, 'muski'], [/^(zensk|zena|zene|zenu|zeni|zenama|dama|dami|damu|djevojk|cura|curi|curu|njoj|mama|mami)/, 31, 'zenski'], [/^unisex/, 33, 'unisex'], [/^(djecj|djeca|djece|dijete|djecu|djetet|beb)/, null, 'djecji']];
const SORT = [[/^(najjeftin|jeftin|povoljn|najpovoljn)/, 4], [/^(najskup|skup|skuplj|luksuzn)/, 3], [/^(najnovij|novitet)/, 2], [/^(popularn|najprodavan|bestsel|najtrazen)/, 1], [/^(preporu)/, 5]];
const BLOCKED = ['/wp-admin', '/wp-login', '/wp-json', '/wp-content', '/wp-includes', '/wp-cron', '/wp-config', '/wp-signup', '/wp-activate', '/xmlrpc', '/index.php', '/moj-racun', '/naplata', '/cart', '/kosarica', '/wishlist', '/lista-zelja', '/martimex-content', '/feed', '/pretraga', '/sample-page', '/shop'];
const FILE_RE = /\.(xml|xsl|json|pdf|jpe?g|png|gif|webp|svg|ico|css|js|map|zip|gz|txt|log|bak|env|php|sql|csv|woff2?|ttf)$/i;
const SAMOPROVJERA = [
  { url: 'https://martimex.hr/proizvod/parfemi/parfemske-vode/eros-eau-de-parfum/', uloga: 'proizvod', ocekuj: 'varijante' },
  { url: 'https://martimex.hr/proizvod/parfemi/parfemske-vode/dylan-blush-pink-set-eau-de-parfum-100-ml/', uloga: 'proizvod', ocekuj: 'cijena' },
  { url: 'https://martimex.hr/proizvod/makeup/usne/ruzevi/labsolu-rouge-cream-34-g/', uloga: 'proizvod', ocekuj: 'nijanse' },
  { url: 'https://martimex.hr/brand/versace/', uloga: 'popis', ocekuj: 'popis' },
  { url: 'https://martimex.hr/akcija/', uloga: 'popis', ocekuj: 'akcija' },
  { url: 'https://martimex.hr/dostava-i-isporuka/', uloga: 'stranica', ocekuj: 'tekst' }
];
const BRENDOVA_PO_SERIJI = 6;
const OSVJEZI_NAKON_S = 120;
const now = Date.now();

const norm = s => String(s || '').toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/\p{M}/gu, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const tokeniziraj = s => norm(s).split(' ').filter(Boolean).map(t => ZAMJENE[t] || t);
function stem(w) { if (!w || w.length < 4) return w; const s = w.replace(/(ovima|evima|ovi|evi|ima|ama|om|em|a|e|i|o|u|y)$/, ''); return s.length >= 3 ? s : w; }
function lev(a, b) {
  if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[b.length];
}
const MALA = new Set(['de', 'la', 'le', 'di', 'du', 'et', 'en', 'by', 'of', 'in', 'da', 'del', 'pour', 'the', 'and', 'for', 'ml', 'g']);
const naziv_iz_sluga = slug => slug.split('-').filter(Boolean).map(w => /^\d+(ml|g)$/.test(w) ? w : (MALA.has(w) ? w : (w.length <= 2 && !/^\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))).join(' ').replace(/(\d+) (ml|g)\b/g, '$1 $2');
const putanja = url => String(url || '').replace(/^https?:\/\/[^\/]+/, '') || '/';
const slugIz = url => { const segs = putanja(url).split('/').filter(Boolean); return segs[segs.length - 1] || ''; };

function resolvePath(p) {
  const trailing = p.endsWith('/') || /\/\.\.?$/.test(p);
  const out = [];
  for (const seg of p.split('/')) { if (seg === '' || seg === '.') continue; if (seg === '..') { out.pop(); continue; } out.push(seg); }
  return '/' + out.join('/') + (out.length && trailing ? '/' : '');
}
// iz "Provjeri URL" (Pročitaj stranicu): normalizacija i blokade adresa
function provjeriUrl(ulaz) {
  let raw = String(ulaz || '').trim();
  const primljeno = raw;
  const md = raw.match(/\]\(\s*([^)\s]+)\s*\)/); if (md) raw = md[1];
  if (/^(https?%3A%2F%2F|%2F)/i.test(raw)) { try { raw = decodeURIComponent(raw); } catch (e) {} }
  const m0 = raw.match(/https?:\/\/[^\s"'<>()\[\]]+|(?:^|[\s"'(<\[])((?:www\.)?martimex\.hr[^\s"'<>()\[\]]*)|(?:^|[\s"'(<\[])(\/[^\s"'<>()\[\]]*)/i);
  if (m0) raw = (m0[1] || m0[2] || m0[0]).trim(); else raw = raw.replace(/^[\s"'`<>\[\]{}()]+|[\s"'`<>\[\]{}()]+$/g, '').split(/\s+/)[0] || '';
  raw = raw.replace(/[.,;:!?]+$/, '');
  if (!raw) return { url: '', greska: 'Nedostaje "url" (primljeno: "' + primljeno.slice(0, 80) + '").' };
  if (/^(javascript|mailto|tel|ftp|data|file):/i.test(raw)) return { url: '', greska: 'Neispravan URL (dozvoljene su samo http(s) stranice s martimex.hr).' };
  if (/^https?:\/\//i.test(raw)) { /* ok */ } else if (/^\/\//.test(raw)) raw = 'https:' + raw; else if (/^(www\.)?martimex\.hr(?=[\/?#:]|$)/i.test(raw)) raw = 'https://' + raw; else raw = 'https://martimex.hr/' + raw.replace(/^\/+/, '');
  const m = raw.match(/^https?:\/\/([^\/?#]*)([^?#]*)(\?[^#]*)?/i);
  if (!m) return { url: '', greska: 'Neispravan URL: "' + raw.slice(0, 120) + '".' };
  const host = m[1].split('@').pop().replace(/:\d+$/, '').toLowerCase();
  if (host !== 'martimex.hr' && host !== 'www.martimex.hr') return { url: '', greska: 'Dozvoljene su samo stranice s martimex.hr (primljeno: ' + host.slice(0, 80) + ').' };
  let path = m[2] || '/';
  try { path = decodeURIComponent(path); } catch (e) {}
  path = resolvePath(path.replace(/\\/g, '/')).replace(/\/{2,}/g, '/').toLowerCase();
  if (path !== '/' && !FILE_RE.test(path) && !path.endsWith('/')) path += '/';
  const search = (m[3] || '').replace(/\/+$/, '');
  const qs = search.slice(1);
  if (BLOCKED.some(p => path === p || path === p + '/' || path.startsWith(p + '/') || path.startsWith(p + '.')) || /^\/(\.|wp-)/.test(path) || /(^|&)(rest_route|add-to-cart|wc-ajax|author|p|page_id|attachment_id|preview|customize_changeset_uuid)=/i.test(qs)) {
    return { url: '', greska: 'Ta adresa nije dostupna za čitanje (sustavske stranice, košarica, račun, pretraga i slično). Pošalji adresu stranice proizvoda, kategorije, brenda ili informativne stranice.' };
  }
  if (FILE_RE.test(path) || /\/feed\/?$/.test(path) || /\.php(\/|$)/i.test(path)) return { url: '', greska: 'Ta adresa nije web stranica (datoteka, sitemap ili feed). Pošalji adresu stranice proizvoda, kategorije ili informativne stranice.' };
  return { url: 'https://martimex.hr' + encodeURI(path) + search, greska: '' };
}

// ---------- ulaz ----------
const A = $('Pripremi upit').first().json || {};
const k = Object.assign({}, A.kontekst || {});
const idx = A.idx || {};
const spremi = [];
const ulaz = $input.all().map(i => i.json || {});
const jeSitemap = ulaz.length > 0 && (ulaz[0].statusCode !== undefined || ulaz[0].error !== undefined || ulaz[0].body !== undefined) && ulaz[0].akcija === undefined;
const neuspjeli = [];

if (jeSitemap) {
  k.sitemapiUzivo = true;
  const datoteke = Array.isArray(k.sitemapDatoteke) ? k.sitemapDatoteke : [];
  const TIP = { 'product-sitemap': 'proizvod', 'product_cat-sitemap': 'kategorija', 'product_tag-sitemap': 'oznaka', 'martimex_brand-sitemap': 'brend', 'martimex_type-sitemap': 'vrsta', 'martimex_gender-sitemap': 'spol', 'martimex_scent-sitemap': 'note mirisa', 'page-sitemap': 'stranica', 'post-sitemap': 'blog', 'martimex_centers-sitemap': 'beauty centar' };
  const svjeze = {};
  ulaz.forEach((j, i) => {
    const meta = datoteke[i] || [];
    const prefiks = meta[0] || ('nepoznato' + i);
    const url = meta[1] || '';
    const sonda = meta[2] === true;
    const st = Number(j.statusCode || 0);
    const xml = String(j.body ?? j.data ?? '');
    const ok = !j.error && (j.statusCode === undefined || st === 200) && /<urlset/i.test(xml);
    svjeze[prefiks] = svjeze[prefiks] || { rows: [], dijelovi: 0, pali: 0 };
    if (!ok) {
      if (sonda && (st === 404 || st === 410 || /<sitemapindex/i.test(xml) || st === 200)) return;   // 4. dio ne postoji (još)
      svjeze[prefiks].pali++;
      neuspjeli.push(url.replace(/^https?:\/\/[^\/]+/, '') + ' (' + (j.error ? String((j.error && j.error.message) || j.error).slice(0, 80) : (st ? 'HTTP ' + st : 'nije sitemap')) + ')');
      return;
    }
    svjeze[prefiks].dijelovi++;
    const re = /<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g;
    let m;
    while ((m = re.exec(xml))) svjeze[prefiks].rows.push([m[1].trim(), TIP[prefiks] || '', (m[2] || '').slice(0, 10)]);
  });
  for (const p of Object.keys(svjeze)) {
    const s = svjeze[p];
    if (s.dijelovi > 0 && s.pali === 0) { idx[p] = { at: now, v: s.rows }; spremi.push({ kljuc: p, at: now, v: s.rows }); }
    else if (s.rows.length && !idx[p]) { idx[p] = { at: now, v: s.rows }; k.upozorenje = (k.upozorenje ? k.upozorenje + ' ' : '') + 'Popis ' + p + ' je nepotpun (dio sitemapa nije dohvaćen).'; }
  }
  k.neuspjeliSitemapi = neuspjeli;
}

const vrijednost = (kljuc) => (idx[kljuc] && idx[kljuc].v !== undefined) ? idx[kljuc].v : null;
const proizvodiRows = vrijednost('product-sitemap') || [];
const brendRows = vrijednost('martimex_brand-sitemap') || [];
const katRows = vrijednost('product_cat-sitemap') || [];
const vrstaRows = vrijednost('martimex_type-sitemap') || [];
const spolRows = vrijednost('martimex_gender-sitemap') || [];
const noteRows = vrijednost('martimex_scent-sitemap') || [];
const postRows = vrijednost('post-sitemap') || [];
const brendSlugovi = brendRows.map(r => slugIz(r[0])).filter(Boolean);
const brendNaziv = (slug) => { const m = vrijednost('brend:' + slug); return (m && m.naziv) ? m.naziv : naziv_iz_sluga(slug); };
const brendUrl = slug => 'https://martimex.hr/brand/' + slug + '/';

const izlaz = (akcija, stranice, dodatno) => {
  const kk = Object.assign({}, k, dodatno || {});
  if (!stranice || !stranice.length) return [{ json: { akcija, kontekst: kk, spremi } }];
  return stranice.map((s, i) => ({ json: Object.assign({ akcija }, s, i === 0 ? { kontekst: kk, spremi } : {}) }));
};
const odgovori = (rezultat, dodatno) => izlaz('odgovori', null, Object.assign({ rezultat }, dodatno || {}));
const sitemapItemi = () => (k.sitemapDatoteke || []).map(([prefiks, url, sonda]) => ({ url, prefiks, sonda }));

try {
  // ---------- zadatak: sitemapi ----------
  if (k.zadatak === 'sitemapi') {
    if (!jeSitemap) return izlaz('sitemapi', sitemapItemi());
    const ok = neuspjeli.length === 0 && proizvodiRows.length > 100 && brendSlugovi.length > 10;
    return odgovori({ ok, opis: ok ? ('Sitemapi osvježeni: ' + spremi.map(s => s.kljuc + ' ' + s.v.length).join(', ')) : ('Osvježavanje sitemapa nije uspjelo: ' + (neuspjeli.join(', ') || 'premalo URL-ova (' + proizvodiRows.length + ' proizvoda, ' + brendSlugovi.length + ' brendova)')) });
  }

  // ---------- zadatak: brendovi (serija stranica brendova za mapu proizvod -> brend) ----------
  if (k.zadatak === 'brendovi') {
    if (!brendSlugovi.length) return odgovori({ ok: false, opis: 'Mapa brendova: nema popisa brendova u indeksu (sitemap brendova nije učitan).' });
    let st = vrijednost('stanje:brendovi');
    if (!st || typeof st !== 'object' || !Array.isArray(st.red)) st = { red: [], ciklus: 0 };
    if (!st.red.length) { st = { red: brendSlugovi.slice().sort().map(s => [s, 1, 0]), ciklus: (Number(st.ciklus) || 0) + 1, ciklusPocetak: now, zavrsenPrethodni: st.ciklusPocetak || null }; }
    const serija = st.red.slice(0, BRENDOVA_PO_SERIJI);
    const ostatak = st.red.slice(BRENDOVA_PO_SERIJI);
    const stranice = serija.map(([slug, pg, pokusaj]) => ({ url: brendUrl(slug) + (pg > 1 ? '?pg=' + pg : ''), uloga: 'brend', brend: slug, pg, pokusaj: pokusaj || 0 }));
    return izlaz('dohvati', stranice, { stanjeBrendova: Object.assign({}, st, { red: ostatak }), ukupnoBrendova: brendSlugovi.length });
  }

  // ---------- zadatak: samoprovjera ----------
  if (k.zadatak === 'samoprovjera') {
    const stranice = SAMOPROVJERA.map(s => Object.assign({}, s));
    if (k.pokvari) stranice.push({ url: 'https://martimex.hr/dostava-i-isporuka/', uloga: 'proizvod', ocekuj: 'varijante', namjerno: true });
    return izlaz('dohvati', stranice);
  }

  // ---------- zadatak: upit (Marti) ----------
  if (!k.upit && !k.url) return odgovori({ ok: false, greska: 'Nedostaje "upit" (što kupac traži, kratko) ili "url" (točna adresa na martimex.hr). Pošalji barem jedno od toga.' });

  const tokeniSvi0 = tokeniziraj(k.upit);
  const tokeniSvi = tokeniSvi0.filter((t, i) => !(/^\d+$/.test(t) && /^(ml|g|gr|mililitara|grama)$/.test(tokeniSvi0[i + 1] || '')) && !(/^(ml|g|gr|mililitara|grama)$/.test(t) && /^\d+$/.test(tokeniSvi0[i - 1] || '')));
  const upitNormCijeli = norm(k.upit);
  const trazenEdp = /\b(edp|eau de parfum|parfemska voda)\b/.test(upitNormCijeli);
  const trazenEdt = /\b(edt|eau de toilette|toaletna voda)\b/.test(upitNormCijeli);
  const tokeni = tokeniSvi.filter(t => !STOP.has(t));
  const zeliOpis = !!k.url || /\b(miris|mirise|mirisu|mirisa|not[aeu]|notama|notom|sastav|sastojc|sastoji|ingredien|upotreb|koristi|kako se|primjen|opis|svojstv|djelov|ucin|nanosi|nanosit|tekstur|trajn|trajanj|projekcij|sillage|longevit|intenzit|sladak|slatk|svjez|drven|cvjetn|vocn|zacinsk|dim|pudrast|akord|dojam|miri[sš]i)/.test(norm(k.upit));

  // 1) poslan url -> pročitaj baš tu stranicu
  if (k.url) {
    const p = provjeriUrl(k.url);
    if (!p.url) return odgovori({ ok: false, greska: p.greska });
    // adresa proizvoda koje nema u indeksu: pripremi najbliže proizvode za slučaj 404
    const urlPrijedlozi = [];
    const putUrl = putanja(p.url);
    if (/^\/proizvod\//.test(putUrl) && !proizvodiRows.some(r => putanja(r[0]) === putUrl)) {
      const sw = slugIz(p.url).split('-').filter(w => w && !STOP.has(w) && !/^\d+$/.test(w));
      if (sw.length) {
        const kand = [];
        for (const r of proizvodiRows) {
          const put = putanja(r[0]); if (!/^\/proizvod\//.test(put)) continue;
          const w2 = slugIz(r[0]).split('-').filter(w => w && !STOP.has(w) && !/^\d+$/.test(w));
          const zaj = sw.filter(w => w2.includes(w)).length;
          const sl = zaj / Math.max(sw.length, w2.length);
          if (sl >= 0.6) kand.push({ naziv: naziv_iz_sluga(slugIz(r[0])), url: r[0], sl });
        }
        kand.sort((a, b) => b.sl - a.sl);
        for (const c of kand.slice(0, 2)) urlPrijedlozi.push({ naziv: c.naziv, url: c.url });
      }
    }
    return izlaz('dohvati', [{ url: p.url, uloga: 'url' }], { tokeni, zeliOpis, urlPrijedlozi });
  }

  // 2) tema (informativne stranice)
  const spojeno = ' ' + tokeniSvi.join(' ') + ' ';
  const temeHit = TEME.map(t => {
    const hits = new Set();
    for (const tok of tokeniSvi) if (t.re.some(re => re.test(tok))) hits.add(tok);
    for (const re of t.re) if (re.source.includes(' ') && new RegExp(re.source.replace(/^\^/, '\\b')).test(spojeno)) hits.add(re.source);
    return { tema: t, hits: [...hits], jaka: JAKE_TEME.has(t.id) };
  }).filter(x => x.hits.length).sort((a, b) => (b.hits.length - a.hits.length) || (Number(b.jaka) - Number(a.jaka)));

  // 3) brend
  let brend = null;
  let brendTokeni = [];
  {
    const kandidati = [];
    for (const alias of Object.keys(ALIASI).sort((a, b) => b.length - a.length)) {
      if (spojeno.includes(' ' + alias + ' ') && brendSlugovi.includes(ALIASI[alias])) kandidati.push({ slug: ALIASI[alias], rijeci: alias.split(' '), tezina: alias.split(' ').length + 0.5 });
    }
    for (const slug of brendSlugovi) {
      const rijeci = slug.split('-').filter(Boolean);
      const jezgra = rijeci.filter(w => !BREND_STOP.has(w));
      if (spojeno.includes(' ' + rijeci.join(' ') + ' ')) { kandidati.push({ slug, rijeci, tezina: rijeci.length + 1 }); continue; }
      const spoj = slug.replace(/-/g, '');
      let nadjen = false;
      for (let i = 0; i < tokeniSvi.length && !nadjen; i++) for (let n = 1; n <= 3 && i + n <= tokeniSvi.length; n++) {
        if (tokeniSvi.slice(i, i + n).join('') === spoj) { kandidati.push({ slug, rijeci: tokeniSvi.slice(i, i + n), tezina: n + 1 }); nadjen = true; break; }
      }
      if (nadjen) continue;
      if (jezgra.length && (jezgra.length >= 2 || jezgra[0].length >= 4) && jezgra.every(w => tokeniSvi.includes(w))) kandidati.push({ slug, rijeci: jezgra, tezina: jezgra.length });
    }
    kandidati.sort((a, b) => (b.tezina - a.tezina) || (b.slug.length - a.slug.length));
    if (kandidati.length) { brend = kandidati[0].slug; brendTokeni = kandidati[0].rijeci; }
  }
  const tokeniBezBrenda = tokeni.filter(t => !brendTokeni.includes(t));

  // 4) spol / vrsta / sortiranje / cijena / note
  let gender = null; let spolSlug = null; let sort = null; let minPrice = null; let maxPrice = null; let noteUrl = null; let vrstaUrl = null;
  const ostali = [];
  for (const t of tokeniBezBrenda) {
    const r = ROD.find(([re]) => re.test(t)); if (r) { gender = r[1]; spolSlug = r[2]; continue; }
    const s = SORT.find(([re]) => re.test(t)); if (s) { sort = s[1]; continue; }
    if (/^(cvjetn|cvijetn|floral)/.test(t)) { noteUrl = (noteRows.find(r => /cvijetni|cvjetni/.test(r[0])) || [])[0] || null; continue; }
    if (/^(vocn|fruity|fruit)/.test(t)) { noteUrl = (noteRows.find(r => /vocni/.test(r[0])) || [])[0] || null; continue; }
    if (/^(niche|nisni)/.test(t)) { vrstaUrl = (vrstaRows.find(r => /\/vrsta\/niche\//.test(r[0])) || [])[0] || null; continue; }
    ostali.push(t);
  }
  {
    const n = norm(k.upit);
    const mMax = n.match(/\b(do|ispod|max|maksimalno|najvise)\s+(\d{2,4})\b/); if (mMax) maxPrice = Number(mMax[2]);
    const mMin = n.match(/\b(od|iznad|preko|najmanje|min|minimalno)\s+(\d{2,4})\b(?!\s*ml)/); if (mMin && (!mMax || mMin.index !== mMax.index)) minPrice = Number(mMin[2]);
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) { const t = minPrice; minPrice = maxPrice; maxPrice = t; }
  }
  const brojevi = new Set(ostali.filter(t => /^\d+$/.test(t) && (t === String(minPrice) || t === String(maxPrice))));
  const tokeniProizvoda = ostali.filter(t => !brojevi.has(t) && !/^(eur|eura|euro|e|kn|kuna|cijene|cijena)$/.test(t));
  const akcijaFilter = tokeniProizvoda.some(t => /^(akcij|snizen|sale|popust|rasprodaj|outlet)/.test(t));
  const tokeniBezAkcije = tokeniProizvoda.filter(t => !/^(akcij|snizen|sale|popust|rasprodaj|outlet)$/.test(t) && !/^(akcij|snizen|popust)/.test(t));

  // 5) kategorija (slugovi iz sitemapa)
  let kategorija = null;
  const stemovi = tokeniBezAkcije.map(stem);
  {
    const kand = [];
    for (const r of katRows) {
      const path = putanja(r[0]);
      if (/\/(uncategorized|checkout-pokloni|promo|novo|parfem|njega-2)\//.test(path)) continue;
      const segs = path.split('/').filter(Boolean).slice(1);
      if (!segs.length) continue;
      const zadnji = segs[segs.length - 1].split('-').filter(w => !STOP.has(w) && !/^\d+$/.test(w));
      const zadnjiStem = zadnji.map(stem);
      if (!zadnjiStem.length) continue;
      const roditelj = segs.slice(0, -1).join('-').split('-').filter(Boolean).map(stem);
      const pogodjeni = new Set();
      let sve = true;
      for (const zs of zadnjiStem) { const i = stemovi.findIndex(ts => ts === zs); if (i < 0) { sve = false; break; } pogodjeni.add(i); }
      if (!sve) continue;
      stemovi.forEach((ts, i) => { if (!pogodjeni.has(i) && roditelj.includes(ts)) pogodjeni.add(i); });
      kand.push({ url: r[0], path, segs, pogodjeni: [...pogodjeni], tezina: zadnjiStem.length * 2 + (pogodjeni.size - zadnjiStem.length) - segs.length * 0.1 });
    }
    kand.sort((a, b) => b.tezina - a.tezina);
    if (kand.length) kategorija = kand[0];
  }
  const tokeniOstatak = tokeniBezAkcije.filter((t, i) => !(kategorija && kategorija.pogodjeni.includes(i)));
  const vrstaSet = !tokeniOstatak.length && tokeniBezAkcije.some(t => /^(set|setovi|setove|paket|poklon paket)$/.test(t)) && !kategorija;

  // tema pobjeđuje kad nema brenda i kad pokriva upit (ili je jaka i upit je kratak)
  const tema = temeHit[0] || null;
  const smislenih = Math.max(1, tokeniSvi.filter(t => !STOP.has(t) || (tema && tema.hits.includes(t))).length);
  const temaPokriva = tema ? tema.hits.filter(h => tokeniSvi.includes(h)).length / smislenih : 0;
  if (tema && !brend && !kategorija && (temaPokriva >= 0.4 || (tema.jaka && tokeni.length <= 4 && temaPokriva > 0) || tema.tema.id === 'chanel') && !(tema.tema.id === 'akcija' && tokeniBezAkcije.length) && !(tema.tema.id === 'novo' && tokeniBezAkcije.filter(t => !/^nov/.test(t)).length)) {
    const alternativa = (temeHit[1] && temeHit[1].hits.length === tema.hits.length) ? temeHit[1].tema : null;
    let urlovi = tema.tema.url.slice();
    if (tema.tema.id === 'loyalty' && !/^(kartic)/.test(tema.hits[0] || '') ) urlovi = tema.tema.url.slice();
    if (tema.tema.id === 'placanje' && tema.hits.every(h => /^kartic/.test(h)) && temeHit.some(x => x.tema.id === 'loyalty')) urlovi = ['/placanje-robe/'];
    if (tema.tema.id === 'akcija' || tema.tema.id === 'novo') {
      const u = 'https://martimex.hr' + urlovi[0] + (gender ? '?gender=' + gender : '');
      return izlaz('dohvati', [{ url: u, uloga: 'popis' }], { tip: 'popis', tema: tema.tema.id, tokeni: tokeniOstatak, akcijaFilter: false, zeliOpis });
    }
    const stranice = urlovi.slice(0, 2).map(u => ({ url: 'https://martimex.hr' + u, uloga: 'stranica' }));
    return izlaz('dohvati', stranice, { tip: 'stranica', tema: tema.tema.id, temaAlternativa: alternativa ? { id: alternativa.id, url: 'https://martimex.hr' + alternativa.url[0] } : null, tokeni: tokeniBezAkcije.filter(t => !tema.hits.includes(t)), tokeniTeme: tema.hits, zeliOpis, napomena: (tema.tema.id === 'chanel' && !brendSlugovi.includes('chanel')) ? 'Chanel nije na popisu brendova webshopa martimex.hr (nije u ponudi webshopa); stranica opisuje Chanel u parfumerijama Martimex.' : null });
  }

  // 6) proizvodi: rangiranje slugova (algoritam iz "Izvuci i filtriraj URL-ove")
  const WEAK_RE = /^(parfum|parfem|parfemska|parfemi|voda|toilette|toaletna|extrait|set|cologne|kolonjska|homme|femme|men|women|man|woman|intense|for|him|her|spray|sprej)$/;
  const MIRIS_RE = /\/(parfemske-vode|toaletne-vode|parfemski-ekstrakti|kolonjske-vode)\//;
  const NE_MIRIS = ['deo', 'deodorant', 'dezodorans', 'gel', 'balm', 'balzam', 'losion', 'lotion', 'shower', 'after', 'shave', 'krema', 'sapun', 'stick', 'body', 'mlijeko', 'oil', 'ulje'];
  const mapaBrenda = brend ? vrijednost('brend:' + brend) : null;
  const mapaPutanje = (mapaBrenda && Array.isArray(mapaBrenda.proizvodi)) ? new Set(mapaBrenda.proizvodi.map(p => p[0])) : null;
  // mapa je potpuna samo ako je označena tako I broj proizvoda odgovara broju stranica popisa (20 po stranici)
  const mapaPotpuna = !!(mapaBrenda && mapaBrenda.stranice && mapaBrenda.djelomicno === false && mapaPutanje && mapaPutanje.size && mapaPutanje.size > (Number(mapaBrenda.stranice) - 1) * 20);
  // riječi vrste proizvoda (ne određuju koji je to proizvod); spol i flankeri (homme, femme, intense, elixir…) ostaju dio naziva
  const OPISNE = new Set(['miris', 'mirisi', 'mirisa', 'original', 'originalni', 'novi', 'nova', 'novo']);
  const TIP_RIJECI = new Set(['parfum', 'parfem', 'parfemska', 'parfemski', 'toilette', 'toaletna', 'cologne', 'kolonjska', 'extrait', 'voda', 'set', 'spray', 'sprej', 'edp', 'edt', 'natural', 'vaporisateur']);
  // kad je brend poznat: proizvodi koji su u mapi NEKOG DRUGOG brenda ne dolaze u obzir
  const tudjePutanje = new Set();
  if (brend) for (const kl of Object.keys(idx)) { if (!kl.startsWith('brend:') || kl === 'brend:' + brend) continue; const m = vrijednost(kl); if (m && Array.isArray(m.proizvodi)) for (const p of m.proizvodi) tudjePutanje.add(p[0]); }
  const mapaNazivi = {};
  if (mapaBrenda && Array.isArray(mapaBrenda.proizvodi)) for (const p of mapaBrenda.proizvodi) mapaNazivi[p[0]] = p[1];
  const brendRijeci = new Set(brend ? brend.split('-').concat(brendTokeni) : []);
  const noiseUpita = new Set([...NOISE, ...brendRijeci]);

  function rangiraj(tokensIn, ograniciNaMapu) {
    const toks = tokensIn.slice();
    const stems = toks.map(t => t.length >= 5 ? t.slice(0, -1) : t);
    const strong = toks.filter(t => !WEAK_RE.test(t) && !/^\d+$/.test(t));
    const hitSlug = (sw) => toks.some((t, i) => sw === t || (t.length >= 5 && sw.startsWith(stems[i])) || (SINONIMI[t] && SINONIMI[t].some(a => sw === a || (a.length >= 4 && sw.startsWith(a)))));
    const rez = [];
    for (const r of proizvodiRows) {
      const url = r[0];
      const path = putanja(url);
      if (!/^\/proizvod\//.test(path)) continue;
      if (ograniciNaMapu && !mapaPutanje.has(path)) continue;
      if (tudjePutanje.has(path) && !(mapaPutanje && mapaPutanje.has(path))) continue;
      if (kategorija && !path.includes('/' + kategorija.segs[kategorija.segs.length - 1] + '/')) continue;
      const slug = slugIz(url);
      const hay = ' ' + norm(path).replace(/\s+/g, ' ') + ' ';
      let score = 0; let strongHit = 0;
      for (let i = 0; i < toks.length; i++) {
        const t = toks[i]; const w = (WEAK_RE.test(t) || /^\d+$/.test(t)) ? 1 : 3;
        if (t.length === 1) { if (hay.includes(' ' + t + ' ')) { score += 3; strongHit++; } continue; }
        if (hay.includes(' ' + t + ' ')) { score += w; if (w === 3) strongHit++; }
        else if (hay.includes(' ' + stems[i])) { score += w === 3 ? 2 : 1; if (w === 3) strongHit++; }
        else if (SINONIMI[t] && SINONIMI[t].some(a => hay.includes(' ' + a))) { score += w === 3 ? 2 : 1; if (w === 3) strongHit++; }
        else if (w === 3 && t.length >= 3 && hay.includes(t)) score += 1;
      }
      if (strong.length >= 1 && strongHit === 0) score = 0;
      if (score <= 0) continue;
      if (MIRIS_RE.test(path) && !toks.some(t => NE_MIRIS.includes(t))) score += 0.5;
      if (trazenEdp) score += /-eau-de-parfum/.test(slug) ? 1.5 : (/parfum/.test(slug) ? -0.5 : 0);
      if (trazenEdt) score += /-eau-de-toilette/.test(slug) ? 1.5 : (/toilette/.test(slug) ? -0.5 : 0);
      const words = norm(slug).split(' ').filter(Boolean);
      // riječi naziva (jake) i riječi vrste proizvoda (slabe: parfum, toilette, set, intense…) broje se odvojeno
      const sveRijeci = words.filter(w => !STOP.has(w) && !brendRijeci.has(w) && !/^\d+(ml|g|gr)?$/.test(w));
      const rijeci = sveRijeci.filter(w => !TIP_RIJECI.has(w));
      const slabe = sveRijeci.filter(w => TIP_RIJECI.has(w));
      const pogodjene = rijeci.filter(w => hitSlug(w)).length;
      const visak = rijeci.length - pogodjene;
      const visakSlabih = slabe.filter(w => !hitSlug(w)).length;
      score += 2 * pogodjene / Math.max(1, rijeci.length) - 0.4 * visak - 0.15 * visakSlabih;
      const jakiUpit = toks.filter(t => !STOP.has(t) && !TIP_RIJECI.has(t) && !OPISNE.has(t) && !/^\d+$/.test(t));
      const slabiUpit = toks.filter(t => TIP_RIJECI.has(t));
      const tocno = jakiUpit.length > 0 && rijeci.slice().sort().join(' ') === jakiUpit.slice().sort().join(' ') && slabiUpit.every(t => slabe.some(w => w === t || (t.length >= 5 && w.startsWith(t.slice(0, 5)))));
      if (tocno) score += 3;
      if (slabe.includes('set') && !toks.includes('set') && !toks.includes('setovi')) score -= 1;
      if (/\/uncategorized\//.test(path)) score -= 1;
      if (mapaPutanje && mapaPutanje.has(path)) score += mapaPotpuna ? 0.75 : 0.1;
      rez.push({ url, path, slug, score, visak, len: slug.length, tocno, naziv: mapaNazivi[path] || naziv_iz_sluga(slug) });
    }
    rez.sort((a, b) => (b.score - a.score) || (a.visak - b.visak) || (a.len - b.len));
    return rez;
  }

  let brendProvjera = brend || null;
  let ograniceno = mapaPotpuna;
  let lista = [];
  if (tokeniOstatak.length) {
    lista = rangiraj(tokeniOstatak, ograniceno);
    if (!lista.length && ograniceno) { ograniceno = false; lista = rangiraj(tokeniOstatak, false); k.napomena = 'Nijedan proizvod brenda ' + brendNaziv(brend) + ' u mapi brenda ne odgovara nazivu; pretraženi su svi proizvodi i brend se provjerava na stranici.'; }
  }

  const filtri = [];
  if (gender) filtri.push('gender=' + gender);
  if (sort) filtri.push('sort=' + sort);
  if (minPrice !== null) filtri.push('minPrice=' + minPrice);
  if (maxPrice !== null) filtri.push('maxPrice=' + maxPrice);
  const sFiltrima = (u) => u + (filtri.length ? (u.includes('?') ? '&' : '?') + filtri.join('&') : '');
  const popis = (u, dodatno) => izlaz('dohvati', [{ url: sFiltrima(u), uloga: 'popis' }], Object.assign({ tip: 'popis', brend, brendNaziv: brend ? brendNaziv(brend) : null, kategorija: kategorija ? kategorija.path : null, akcijaFilter, tokeni: tokeniOstatak, zeliOpis, filtri }, dodatno || {}));

  // 7) odluka
  if (lista.length) {
    const top = lista[0];
    let odabrani;
    // jasan pobjednik: jedini točan naziv ili velika prednost (bez točnog naziva traži se veća prednost); inače do 3 podjednako dobra
    const prag = top.tocno ? 1.0 : 1.5;
    if (lista.length === 1 || (top.tocno && !(lista[1] && lista[1].tocno)) || top.score - lista[1].score >= prag) odabrani = [top];
    else odabrani = lista.filter(r => r.score >= top.score - (top.tocno ? 0.75 : prag)).slice(0, 3);
    // slični: ista glavna kategorija, razumna sličnost; kad je brend poznat, samo proizvodi potvrđeni u mapi brenda
    const kat1 = p => (String(p).split('/')[2] || '');
    const glavneKat = new Set(odabrani.map(r => kat1(r.path)));
    let slicniKand = lista.filter(r => !odabrani.includes(r) && glavneKat.has(kat1(r.path)) && r.score >= Math.max(1, top.score * 0.4));
    if (!tokeniOstatak.includes('set') && !tokeniOstatak.includes('setovi')) slicniKand = slicniKand.filter(r => !/(^|-)set(-|$)/.test(r.slug));
    if (brend) slicniKand = slicniKand.filter(r => mapaPutanje && mapaPutanje.has(r.path));
    const slicni = slicniKand.slice(0, 3).map(r => ({ naziv: r.naziv, url: r.url }));
    const stranice = odabrani.map(r => ({ url: r.url, uloga: 'proizvod', naziv: r.naziv, score: Math.round(r.score * 100) / 100 }));
    return izlaz('dohvati', stranice, { tip: odabrani.length > 1 ? 'vise_proizvoda' : 'proizvod', brend, brendNaziv: brend ? brendNaziv(brend) : null, brendProvjera, brendOgraniceno: ograniceno, kandidata: lista.length, slicni, tokeni: tokeniOstatak, zeliOpis, akcijaFilter });
  }

  // nema proizvoda s tim nazivom
  if (brend && tokeniOstatak.length) {
    const bliski = (mapaBrenda && Array.isArray(mapaBrenda.proizvodi)) ? mapaBrenda.proizvodi.filter(p => tokeniOstatak.some(t => norm(p[1]).split(' ').some(w => w === t || (t.length >= 4 && w.startsWith(t.slice(0, 4))) || (t.length >= 5 && lev(w, t) <= 1)))).slice(0, 3).map(p => ({ naziv: p[1], url: 'https://martimex.hr' + p[0] })) : [];
    const brojProizvoda = (mapaBrenda && Array.isArray(mapaBrenda.proizvodi)) ? mapaBrenda.proizvodi.length : null;
    return odgovori({ ok: true, tip: 'nije_pronadjeno', tekst: 'NIJE PRONAĐENO: brend ' + brendNaziv(brend) + ' u webshopu nema proizvod koji odgovara nazivu „' + tokeniOstatak.join(' ') + '“' + (brojProizvoda !== null ? ' (provjereno među ' + brojProizvoda + ' proizvoda brenda u indeksu' + (k.sitemapiUzivo || k.indeksStarostS !== null ? ', indeks osvježen prije ' + (k.sitemapiUzivo ? 0 : Math.round((k.indeksStarostS || 0) / 60)) + ' min' : '') + ')' : ' (prema popisu adresa proizvoda)') + '.\n' + (bliski.length ? 'Najbliže od tog brenda: ' + bliski.map(b => b.naziv + ' ' + b.url).join(' · ') + '\n' : '') + 'Stranica brenda (svi proizvodi, s cijenama): ' + brendUrl(brend) + (akcijaFilter ? ' (traženo: na akciji)' : '') }, { tip: 'nije_pronadjeno', brend });
  }
  if (brend && kategorija && kategorija.segs.length >= 2 && !/^(parfemske-vode|toaletne-vode|parfemski-ekstrakti|njega-lica|njega-tijela|njega-kose)$/.test(kategorija.segs[kategorija.segs.length - 1])) return popis(kategorija.url, { filtrirajBrend: brendNaziv(brend), kategorijaNapomena: 'Popis kategorije ' + kategorija.path + ' je filtriran na brend ' + brendNaziv(brend) + ' (web nema filtar po brendu); za sve proizvode brenda: ' + brendUrl(brend) });
  if (brend) return popis(brendUrl(brend), { kategorijaNapomena: kategorija ? 'Kategorija ' + kategorija.path + ' je prepoznata, ali popis brenda ne filtrira po kategoriji; u popisu su svi proizvodi brenda (po potrebi pozovi alat s url kategorije).' : null, napomena: brend === 'furla' ? 'Furla ima i stranice https://martimex.hr/furla/ i https://martimex.hr/kontakt-furla/ (pozovi alat s url).' : (k.napomena || null) });
  if (kategorija && !tokeniOstatak.length) return popis(kategorija.url);
  if (noteUrl && !tokeniOstatak.length) return popis(noteUrl);
  if (vrstaUrl && !tokeniOstatak.length) return popis(vrstaUrl);
  if (vrstaSet) { const u = (vrstaRows.find(r => /\/vrsta\/setovi\//.test(r[0])) || [])[0]; if (u) return popis(u); }
  if (spolSlug && !tokeniOstatak.length) { const u = (spolRows.find(r => r[0].includes('/spol/' + spolSlug + '/')) || [])[0]; if (u) return popis(u, { filtri: filtri.filter(f => !f.startsWith('gender=')) }); }
  if (!tokeniOstatak.length && (gender || sort || minPrice !== null || maxPrice !== null)) return popis('https://martimex.hr/kategorija/parfemi/');
  if (!tokeniOstatak.length && tema) {
    const stranice = tema.tema.url.slice(0, 2).map(u => ({ url: 'https://martimex.hr' + u, uloga: 'stranica' }));
    return izlaz('dohvati', stranice, { tip: 'stranica', tema: tema.tema.id, tokeni: [], zeliOpis });
  }

  // 8) ništa: po potrebi osvježi sitemape uživo i pokušaj još jednom
  const upitNorm = tokeniBezAkcije.join(' ');
  const nepoznatBrend = NEPOZNATI_BRENDOVI.find(b => spojeno.includes(' ' + b + ' '));
  if (!k.sitemapiUzivo && (k.indeksStarostS === null || k.indeksStarostS > OSVJEZI_NAKON_S) && tokeniOstatak.length) return izlaz('sitemapi', sitemapItemi(), { osvjezenoNaPrazno: true });

  // nije pronađeno: najbliži brendovi, kategorije, proizvodi
  const bliskiBrendovi = brendSlugovi.map(s => { const w = s.replace(/-/g, ' '); const d = Math.min(...tokeniBezAkcije.filter(t => t.length >= 4).map(t => Math.min(lev(t, s.replace(/-/g, '')), ...w.split(' ').filter(x => x.length >= 4).map(x => lev(t, x))))); return { s, d }; }).filter(x => isFinite(x.d) && x.d <= (upitNorm.length >= 7 ? 2 : 1)).sort((a, b) => a.d - b.d).slice(0, 3);
  const bliskeKategorije = katRows.map(r => { const slug = slugIz(r[0]); const w = slug.split('-'); const d = Math.min(...tokeniBezAkcije.map(t => Math.min(...w.map(x => lev(stem(t), stem(x)))))); return { url: r[0], slug, d }; }).filter(x => x.d <= 1 && !/uncategorized|checkout|promo/.test(x.slug)).sort((a, b) => a.d - b.d || a.slug.length - b.slug.length).slice(0, 3);
  const bliskiProizvodi = [];
  if (tokeniBezAkcije.some(t => t.length >= 4)) {
    for (const r of proizvodiRows) {
      const slug = slugIz(r[0]); if (!/^\/proizvod\//.test(putanja(r[0]))) continue;
      const words = slug.split('-');
      let d = 0;
      for (const t of tokeniBezAkcije) { if (t.length < 4 || NOISE.has(t)) continue; if (words.some(w => w === t || lev(w, t) <= 1 || (t.length >= 5 && w.startsWith(t.slice(0, 4))))) d++; }
      if (d) bliskiProizvodi.push({ naziv: naziv_iz_sluga(slug), url: r[0], d, len: slug.length });
    }
    bliskiProizvodi.sort((a, b) => b.d - a.d || a.len - b.len);
  }
  const blog = postRows.filter(r => { const w = slugIz(r[0]).split('-'); return tokeniBezAkcije.filter(t => t.length >= 4).some(t => w.some(x => x === t || x.startsWith(stem(t)))); }).slice(0, 2);
  const redci = ['NIJE PRONAĐENO po nazivu „' + k.upit + '“' + (k.sitemapiUzivo || k.indeksStarostS !== null ? ' (indeks adresa osvježen prije ' + (k.sitemapiUzivo ? 0 : Math.round((k.indeksStarostS || 0) / 60)) + ' min)' : '') + '.'];
  if (nepoznatBrend) redci.push('Brend „' + nepoznatBrend + '“ nije na popisu brendova webshopa martimex.hr (nije u ponudi webshopa; poslovnice mogu imati drukčiju ponudu).');
  else if (tokeniBezAkcije.length <= 2 && !bliskiBrendovi.length && !kategorija) redci.push('Na popisu brendova webshopa martimex.hr nema brenda s tim nazivom.');
  const najblize = [];
  for (const b of bliskiBrendovi) najblize.push('brend ' + brendNaziv(b.s) + ' ' + brendUrl(b.s));
  for (const c of bliskeKategorije) najblize.push('kategorija ' + naziv_iz_sluga(c.slug) + ' ' + c.url);
  for (const p of bliskiProizvodi.slice(0, 3)) najblize.push(p.naziv + ' ' + p.url);
  for (const b of blog) najblize.push('članak ' + naziv_iz_sluga(slugIz(b[0])) + ' ' + b[0]);
  if (najblize.length) redci.push('Najbliže: ' + najblize.join(' · '));
  redci.push('Marti: ne tvrdi kupcu da proizvod postoji ili ne postoji ako nije na popisu; ponudi najbliže ili pitaj za točan naziv/brend.');
  return odgovori({ ok: true, tip: 'nije_pronadjeno', tekst: redci.join('\n') }, { tip: 'nije_pronadjeno', brend });
} catch (e) {
  return odgovori({ ok: false, greska: 'Interna greška alata pri odabiru stranica (' + String(e && e.message || e).slice(0, 160) + '). Pokušaj ponovno; ako se ponavlja, kupca uputi na poveznicu ili webshop@martimex.hr. Ne navodi cijene ni dostupnost napamet.' }, { internaGreska: String(e && e.stack || e).slice(0, 500) });
}
