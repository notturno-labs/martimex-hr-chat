// Code node "Redci za spremanje" (Martimex uživo) – dijeli osvježene dijelove indeksa u retke Data Tablea "Marti - indeks weba".
// Ključ retka "<kljuc>#<i>", JSON u dijelovima do 60.000 znakova, broj = ukupan broj dijelova (provjera cjelovitosti pri čitanju).
// Izvršava se NAKON odgovora Marti, pa ne usporava odgovor. Prazan izlaz = ništa za spremiti.
const VELICINA = 60000;
const spremi = ($input.first().json || {}).spremi;
const out = [];
if (Array.isArray(spremi)) {
  const videno = new Set();
  for (const s of spremi) {
    if (!s || !s.kljuc || s.v === undefined || videno.has(s.kljuc)) continue;
    videno.add(s.kljuc);
    const txt = JSON.stringify(s.v);
    const dijelovi = [];
    for (let i = 0; i < txt.length; i += VELICINA) dijelovi.push(txt.slice(i, i + VELICINA));
    dijelovi.forEach((d, i) => out.push({ json: { prefiks: s.kljuc + '#' + i, at: Number(s.at) || Date.now(), broj: dijelovi.length, rows: d } }));
  }
}
return out;
