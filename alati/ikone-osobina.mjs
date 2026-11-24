// Ukratko: Alat koji iz Tabler Icons složi ikone osobina za karticu artikla (emoji → tanka crna ikona) i upiše ih u v2-1/kartica-artikla.js
// ═════════════════════════════════════════════════════════════════════
//  IKONE OSOBINA — paleta emojija za tri podatka na kartici parfema
//
//  Marti na kartici parfema svaki od tri podatka (miris · kada · trajnost i
//  aura) počne jednim emojijem, npr. "🌊 Svjež morski miris". Kartica taj
//  emoji ne prikazuje, nego umjesto njega nacrta tanku crnu ikonu (crta
//  1,33 px, kao ostale ikone kartice). Ovdje je paleta: koji emoji daje koju
//  ikonu. Ikone su iz Tabler Icons (https://tabler.io/icons, MIT licenca),
//  nacrtane samo crtom, bez punih ploha i bez boja.
//
//  Kako se koristi (iz korijena repozitorija):
//    npm pack @tabler/icons@3.52.0
//    mkdir tabler && tar -xzf tabler-icons-3.52.0.tgz -C tabler
//    node alati/ikone-osobina.mjs tabler/package
//  Alat zamijeni dio datoteke v2-1/kartica-artikla.js između oznaka
//  "IKONE PALETE – početak" i "IKONE PALETE – kraj" i ispiše popis za
//  Voiceflow playbook "Preporuka - Parfemi" (odjeljak EMOJI PALETTE).
//  Mape tabler/ i .tgz poslije obriši (ne idu u repozitorij).
//
//  Dva popisa:
//   PALETA   – svi emojiji koje kartica prepoznaje (i rjeđi, i zamjene), da
//              i neočekivan izbor dobije pravu ikonu
//   PLAYBOOK – kraći popis koji Marti vidi u playbooku: samo emojiji koji
//              kupcu stvarno trebaju (svaki emoji u playbooku je tekst koji
//              se plaća u svakom pozivu modela)
//
//  Novi emoji: dopiši ga u PALETA (uz postojeću ikonu kao zamjenu ili kao
//  novi redak s imenom Tabler ikone); ako ga i Marti treba vidjeti, dodaj ga
//  i u PLAYBOOK. Pokreni alat i u playbook prepiši ispisani popis. Ikona s
//  punom plohom (fill) se odbija.
// ═════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// [ime Tabler ikone, emojiji (prvi je glavni, ostali su zamjene), značenje za Marti]
// Skupine su redom kao u playbooku.
const PALETA = [
  ['Scent', [
    ['ripple', '🌊', 'sea, marine, aquatic'],
    ['droplet', '💧', 'fresh, clean, watery'],
    ['droplets', '💦', 'refreshing, splash'],
    ['circles', '🫧', 'clean, soapy, white musk'],
    ['sailboat', '⛵', 'sea breeze, nautical'],
    ['anchor', '⚓', 'sailor, classic masculine'],
    ['mountain', '⛰️ 🏔️', 'mountain air, crisp'],
    ['lemon', '🍋', 'citrus, lemon, bergamot'],
    ['lemon-2', '🍊', 'orange, mandarin, juicy citrus'],
    ['leaf', '🍃', 'green, fresh'],
    ['plant-2', '🌿', 'herbal, aromatic (lavender, mint, rosemary)'],
    ['seedling', '🌱', 'soft green; spring'],
    ['wheat', '🌾', 'warm grain, hay'],
    ['teapot', '🍵 🫖', 'tea'],
    ['flower', '🌸 🌹 🌺 🌼 🌷 💐 🪷 🪻 🏵️', 'floral; spring'],
    ['butterfly', '🦋', 'playful, light, airy'],
    ['cherry', '🍒 🍓', 'fruity, juicy, red fruits'],
    ['apple', '🍎 🍏 🍐 🍑', 'fresh fruity'],
    ['grape', '🍇 🫐', 'berries, dark fruits'],
    ['candy', '🍬 🍯', 'sweet, honeyed'],
    ['lollipop', '🍭', 'playfully sweet'],
    ['ice-cream-2', '🍦 🍨', 'creamy, vanilla'],
    ['cookie', '🍪', 'gourmand, biscuit'],
    ['cake', '🍰 🎂', 'dessert; birthday'],
    ['chocolate', '🍫', 'chocolate, cocoa'],
    ['coffee', '☕', 'coffee'],
    ['milk', '🥛', 'milky, creamy'],
    ['acorn', '🌰 🥜', 'nutty'],
    ['flame', '🔥', 'warm, intense, passionate'],
    ['candle', '🕯️', 'warm, intimate, incense'],
    ['pepper', '🌶️', 'spicy'],
    ['salt', '🧂', 'salty'],
    ['twig', '🪵', 'woody'],
    ['tree', '🌳', 'woody, natural'],
    ['christmas-tree', '🌲 🎄', 'pine, forest; Christmas'],
    ['mushroom', '🍄', 'earthy'],
    ['deer', '🦌', 'wild, forest'],
    ['jacket', '🧥', 'leather'],
    ['glass-gin', '🥃', 'boozy (whisky, rum, cognac)'],
    ['cloud', '☁️', 'soft, powdery, cosy'],
    ['feather', '🪶', 'light, airy, delicate'],
    ['perfume', '🧴', 'perfume in general'],
  ]],
  ['When to wear', [
    ['sun', '☀️ 🌞', 'summer, sunny days'],
    ['sun-low', '🌤️', 'mild days, spring or early autumn'],
    ['temperature-sun', '🌡️', 'hot summer days'],
    ['leaf-maple', '🍂 🍁', 'autumn'],
    ['snowflake', '❄️', 'winter'],
    ['snowman', '☃️ ⛄', 'winter holidays'],
    ['sunrise', '🌅', 'morning'],
    ['sunset', '🌇', 'early evening'],
    ['moon', '🌙', 'evening, night'],
    ['moon-stars', '🌃 🌌', 'nights out'],
    ['sun-moon', '🌗', 'day and evening'],
    ['clock', '🕰️ ⏰ 🕒', 'all day'],
    ['calendar', '🗓️ 📅 📆', 'every day, all year'],
    ['briefcase', '💼', 'office, work'],
    ['tools-kitchen-2', '🍽️', 'dinner'],
    ['glass-full', '🍷', 'wine, dinner'],
    ['glass-cocktail', '🍸 🍹', 'cocktails, going out'],
    ['glass-champagne', '🥂', 'celebrations, special occasions'],
    ['bottle', '🍾', 'party, celebration'],
    ['confetti', '🎉 🥳 🎊', 'parties'],
    ['balloon', '🎈', 'birthdays'],
    ['music', '🎶 🎵 💃 🕺', 'dancing, concerts, nights out'],
    ['masks-theater', '🎭', 'theatre, culture'],
    ['heart', '❤️ 💕 💖 💗 💘 💞 🤍 ♥️', 'romance, dates'],
    ['mail-heart', '💌', 'a gift for a loved one'],
    ['rings', '💍 💒', 'weddings'],
    ['gift', '🎁 🎀', 'gifts'],
    ['plane', '✈️ 🧳', 'travel'],
    ['beach', '🏖️ 🏝️', 'holidays, beach'],
    ['run', '🏃 🏋️ 🚴', 'sport, active days'],
    ['yoga', '🧘', 'relaxation'],
    ['home', '🏠 🏡 🛋️', 'home, cosy moments'],
    ['building-skyscraper', '🏙️ 🌆', 'city'],
  ]],
  ['Longevity and aura', [
    ['hourglass', '⏳ ⌛ ⏱️', 'long-lasting'],
    ['wind', '🌬️ 💨', 'trail, projection; fresh air'],
    ['sparkles', '✨', 'aura, radiance'],
    ['stars', '💫', 'radiant aura'],
    ['star', '⭐ 🌟', 'iconic, star quality'],
  ]],
  ['Style', [
    ['diamond', '💎', 'elegant, refined'],
    ['crown', '👑', 'opulent, iconic'],
    ['bolt', '⚡', 'energetic, bold'],
    ['sunglasses', '🕶️ 😎', 'modern, cool'],
    ['crystal-ball', '🔮', 'mysterious'],
    ['palette', '🎨', 'artistic, niche'],
  ]],
];

// Kraći popis za playbook: [skupina, [[ime ikone iz PALETA, kratko značenje za Marti]]].
// Emoji se uzima iz PALETA (prvi, glavni). Ista ikona smije biti u dvije skupine.
const PLAYBOOK = [
  ['Scent', [
    ['ripple', 'marine'],
    ['droplet', 'fresh, clean'],
    ['circles', 'clean, soapy, musky'],
    ['lemon', 'citrus'],
    ['leaf', 'green'],
    ['plant-2', 'aromatic (lavender, mint)'],
    ['flower', 'floral; also spring'],
    ['cherry', 'fruity'],
    ['candy', 'sweet'],
    ['ice-cream-2', 'creamy, vanilla'],
    ['coffee', 'coffee'],
    ['flame', 'warm, intense'],
    ['pepper', 'spicy'],
    ['twig', 'woody'],
    ['candle', 'incense, smoky'],
    ['jacket', 'leather'],
    ['cloud', 'powdery, soft'],
    ['feather', 'light, airy'],
    ['butterfly', 'playful, youthful'],
  ]],
  ['When to wear', [
    ['sun', 'summer'],
    ['leaf-maple', 'autumn'],
    ['snowflake', 'winter'],
    ['calendar', 'all year'],
    ['sun-moon', 'day and evening'],
    ['moon', 'evening'],
    ['briefcase', 'office'],
    ['glass-cocktail', 'nights out'],
    ['glass-champagne', 'special occasions'],
    ['heart', 'romantic moments'],
    ['beach', 'summer holidays'],
    ['run', 'sport'],
  ]],
  ['Longevity and aura', [
    ['hourglass', 'long-lasting'],
    ['wind', 'strong trail'],
    ['sparkles', 'aura'],
    ['feather', 'light'],
    ['cloud', 'close to the skin'],
  ]],
  ['Style (any fact)', [
    ['diamond', 'elegant'],
    ['crown', 'opulent'],
    ['bolt', 'energetic'],
    ['crystal-ball', 'mysterious'],
  ]],
];

const KORIJEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KARTICA = path.join(KORIJEN, 'v2-1', 'kartica-artikla.js');
const POCETAK = '// ── IKONE PALETE – početak';
const KRAJ = '// ── IKONE PALETE – kraj';

function greska(poruka) {
  console.error('[ikone-osobina] ' + poruka);
  process.exit(1);
}

// emoji bez znakova za izgled (FE0E, FE0F) i nijansi kože – tako ga traži i kartica
const cisti = (e) => e.replace(/[\uFE0E\uFE0F]|[\u{1F3FB}-\u{1F3FF}]/gu, '');

// mapa paketa @tabler/icons: ili sama mapa "package", ili njezina icons/outline
const ulaz = process.argv[2];
if (!ulaz) greska('nedostaje putanja do raspakiranog paketa @tabler/icons (mapa "package")');
let mapaIkona = path.resolve(ulaz);
if (fs.existsSync(path.join(mapaIkona, 'icons', 'outline'))) mapaIkona = path.join(mapaIkona, 'icons', 'outline');
if (!fs.existsSync(path.join(mapaIkona, 'flame.svg'))) greska('u ' + mapaIkona + ' nema Tabler ikona (flame.svg)');
const paket = path.join(mapaIkona, '..', '..', 'package.json');
const verzija = fs.existsSync(paket) ? JSON.parse(fs.readFileSync(paket, 'utf8')).version : '?';
const licenca = path.join(mapaIkona, '..', '..', 'LICENSE');
const copyright = fs.existsSync(licenca)
  ? (fs.readFileSync(licenca, 'utf8').match(/Copyright \(c\)[^\n]*/) || [''])[0].trim()
  : '';
if (!copyright) greska('nije pročitana licenca paketa (LICENSE)');

// sadržaj ikone: elementi unutar <svg>, bez okvira 24 × 24 i bez razmaka viška
function crtez(ime) {
  const dat = path.join(mapaIkona, ime + '.svg');
  if (!fs.existsSync(dat)) greska('Tabler nema ikonu "' + ime + '"');
  const s = fs.readFileSync(dat, 'utf8');
  const unutra = s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '')
    .replace(/\s*\n\s*/g, '').replace(/\s+\/>/g, '/>').replace(/\s{2,}/g, ' ').trim();
  if (/fill="(?!none")/.test(unutra)) greska('ikona "' + ime + '" ima punu plohu (fill) – nije samo crta');
  if (/<(?!path|circle|rect|line|polyline|polygon|ellipse|\/)/.test(unutra)) greska('ikona "' + ime + '" ima neočekivan element');
  if (unutra.includes("'")) greska('ikona "' + ime + '" ima apostrof');
  return unutra;
}

const ikone = [];
const emojiji = [];
const vidjeno = new Map();
for (const [, redovi] of PALETA) {
  for (const [ime, popis] of redovi) {
    if (ikone.some((x) => x[0] === ime)) greska('ikona "' + ime + '" je u paleti dvaput');
    ikone.push([ime, crtez(ime)]);
    for (const e of popis.split(/\s+/).filter(Boolean)) {
      const k = cisti(e);
      if (vidjeno.has(k)) greska('emoji ' + e + ' je i kod "' + vidjeno.get(k) + '" i kod "' + ime + '"');
      vidjeno.set(k, ime);
      emojiji.push([k, ime]);
    }
  }
}

const UVLAKA = '    ';
const MIT = [
  'Permission is hereby granted, free of charge, to any person obtaining a copy',
  'of this software and associated documentation files (the "Software"), to deal',
  'in the Software without restriction, including without limitation the rights',
  'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
  'copies of the Software, and to permit persons to whom the Software is',
  'furnished to do so, subject to the following conditions:',
  'The above copyright notice and this permission notice shall be included in all',
  'copies or substantial portions of the Software.',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
  'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
  'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
  'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
  'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
  'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
  'SOFTWARE.',
];
const blok = [
  POCETAK + ' ' + '─'.repeat(40),
  '// Ovaj dio piše alat alati/ikone-osobina.mjs (tamo je i paleta); ne mijenjaj ga ručno.',
  '// Ikone za tri podatka na kartici parfema: Marti napiše emoji, kartica nacrta',
  '// njegovu ikonu (crtež 24 × 24, samo crta, kao IKONE gore).',
  '// Ikone: Tabler Icons ' + verzija + ' (https://tabler.io/icons), MIT licenca:',
  '//   ' + copyright,
  ...MIT.map((r) => '//   ' + r),
  'const IKONE_PALETE = {',
  ...ikone.map(([ime, s]) => '  ' + (/^[a-z]+$/.test(ime) ? ime : "'" + ime + "'") + ": '" + s + "',"),
  '};',
  '// emoji (bez FE0F i nijansi kože) → ikona',
  'const PALETA = {',
  ...(() => {
    const redovi = [];
    let red = [];
    for (const [k, ime] of emojiji) {
      red.push("'" + k + "': '" + ime + "'");
      if (red.length === 4) { redovi.push('  ' + red.join(', ') + ','); red = []; }
    }
    if (red.length) redovi.push('  ' + red.join(', ') + ',');
    return redovi;
  })(),
  '};',
  KRAJ + ' ' + '─'.repeat(42),
].map((r) => (r ? UVLAKA + r : r)).join('\n');

const kod = fs.readFileSync(KARTICA, 'utf8');
const a = kod.indexOf(UVLAKA + POCETAK);
const b = kod.indexOf(UVLAKA + KRAJ);
if (a === -1 || b === -1 || b < a) greska('u ' + KARTICA + ' nema oznaka "' + POCETAK + '" i "' + KRAJ + '"');
const krajReda = kod.indexOf('\n', b);
const novi = kod.slice(0, a) + blok + (krajReda === -1 ? '\n' : kod.slice(krajReda));
fs.writeFileSync(KARTICA, novi);
console.log('[ikone-osobina] upisano ' + ikone.length + ' ikona i ' + emojiji.length + ' emojija u ' + path.relative(KORIJEN, KARTICA));

// popis za playbook "Preporuka - Parfemi" (odjeljak EMOJI PALETTE): glavni emoji
// svake ikone iz PLAYBOOK, sa kratkim značenjem
const glavni = new Map();
for (const [, redovi] of PALETA) for (const [ime, popis] of redovi) glavni.set(ime, popis.split(/\s+/)[0]);
console.log('\n--- EMOJI PALETTE (za playbook) ---');
let uPlaybooku = 0;
for (const [skupina, redovi] of PLAYBOOK) {
  console.log('- ' + skupina + ': ' + redovi.map(([ime, znacenje]) => {
    if (!glavni.has(ime)) greska('PLAYBOOK spominje ikonu "' + ime + '" koje nema u PALETA');
    uPlaybooku++;
    return glavni.get(ime) + ' ' + znacenje;
  }).join(' · '));
}
console.log('(stavki u playbooku: ' + uPlaybooku + ')');
