// Ručni test: jedan primjer zahtjeva (isti oblik kao webhook). Promijeni PRIMJER (0–N) ili dodaj svoj.
// Za zadatke pošalji { body: { zadatak: 'sitemapi' | 'brendovi' | 'samoprovjera', pokvari: 'da' } }.
const PRIMJERI = [
  { upit: 'versace eros eau de parfum', url: '-' },
  { upit: 'eros', url: '-' },
  { upit: 'Y eau de parfum', url: '-' },
  { upit: 'k by dolce gabbana', url: '-' },
  { upit: 'versace pour homme', url: '-' },
  { upit: 'versace', url: '-' },
  { upit: 'dior', url: '-' },
  { upit: 'chanel', url: '-' },
  { upit: 'koliko košta dostava', url: '-' },
  { upit: 'plaćanje na rate', url: '-' },
  { upit: 'radno vrijeme poslovnica zagreb', url: '-' },
  { upit: 'maskare', url: '-' },
  { upit: '-', url: '/kategorija/parfemi/?gender=32&sort=4&maxPrice=80&pg=2' },
  { upit: '-', url: '/proizvod/parfemi/parfemske-vode/ne-postoji/' },
  { upit: 'asdfgh', url: '-' },
  { zadatak: 'samoprovjera' },
  { zadatak: 'sitemapi' },
  { zadatak: 'brendovi' }
];
const PRIMJER = 0;
return [{ json: { body: PRIMJERI[PRIMJER], rucniTest: true } }];
