const { run, CODE } = require('./harness.js');
const mk = (n, from) => Array.from({ length: n }, (_, i) => ({ url: 'https://martimex.hr/proizvod/x/p' + (from + i) + '/', naziv: 'P' + (from + i), brend: 'Testbrend', vrsta: 'Parfem' }));
function slucaj(naziv, stari, red, stranice) {
  const idx = stari ? { 'brend:testbrend': { at: 1, v: stari } } : {};
  const nodes = {
    'Pripremi upit': [{ json: { idx, kontekst: { zadatak: 'brendovi' } } }],
    'Odaberi stranice': [{ json: { akcija: 'dohvati', kontekst: { zadatak: 'brendovi', stanjeBrendova: { red, ciklus: 1 } }, spremi: [] } }],
  };
  const items = stranice.map(s => ({ json: Object.assign({ ok: true, tip: 'popis', brend: 'testbrend', uloga: 'popis', popis: { proizvodi: mk(s.n, s.from), naslov: 'Testbrend' }, stranicenje: { trenutna: s.pg, ukupno: s.ukupno } }, s) }));
  const D = run(CODE.D, 'all', items, nodes)[0].json;
  const zapis = D.spremi.filter(x => x.kljuc === 'brend:testbrend');
  const st = D.spremi.find(x => x.kljuc === 'stanje:brendovi');
  console.log(naziv, '| zapisa:', zapis.length, '| proizvoda:', zapis[0] && zapis[0].v.proizvodi.length, '| djelomicno:', zapis[0] && zapis[0].v.djelomicno, '| red:', JSON.stringify(st.v.red), '|', D.odgovor.opis);
}
// 1) stranica 1 od 3 -> stranice 2 i 3 u redu, djelomicno true
slucaj('pg1', null, [], [{ pg: 1, ukupno: 3, n: 20, from: 1 }]);
// 2) stranice 2 i 3 u istoj seriji, staro stanje = stranica 1 -> 43 proizvoda, potpuna
slucaj('pg2+3', { naziv: 'Testbrend', proizvodi: mk(20, 1).map(p => [p.url.replace('https://martimex.hr', ''), p.naziv, '']), stranice: 3, djelomicno: true }, [], [{ pg: 2, ukupno: 3, n: 20, from: 21 }, { pg: 3, ukupno: 3, n: 3, from: 41 }]);
// 3) stranica 2 u seriji, stranica 3 još čeka u redu -> djelomicno true
slucaj('pg2, pg3 ceka', { naziv: 'Testbrend', proizvodi: mk(20, 1).map(p => [p.url.replace('https://martimex.hr', ''), p.naziv, '']), stranice: 3, djelomicno: true }, [['testbrend', 3, 0]], [{ pg: 2, ukupno: 3, n: 20, from: 21 }]);
// 4) stranica 3 pala drugi put -> djelomicno true
slucaj('pg3 propala', { naziv: 'Testbrend', proizvodi: mk(40, 1).map(p => [p.url.replace('https://martimex.hr', ''), p.naziv, '']), stranice: 3, djelomicno: true }, [], [{ pg: 3, ukupno: 3, ok: false, greska: 'timeout', pokusaj: 1 }]);
