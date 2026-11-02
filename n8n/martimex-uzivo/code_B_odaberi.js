// Code node "Odaberi stranice" (Martimex uživo) – v1.7
// Ulaz: (a) item { akcija:'odaberi', kontekst, idx } iz "Pripremi upit" ili (b) HTTP odgovori sitemapa (redoslijed = kontekst.sitemapDatoteke).
// Deterministički (bez AI-ja) odlučuje koje stranice martimex.hr treba pročitati uživo: tema → informativna stranica,
// brend/kategorija → popis, naziv proizvoda → 1–3 stranice proizvoda. Nikad ne baca; greške vraća kao akcija 'odgovori'.
const STOP = new Set(['de', 'eau', 'za', 'the', 'of', 'la', 'le', 'ml', 'pour', 'et', 'i', 'u', 'na', 'by', 'and', 'en', 'a', 'je', 'li', 'da', 'ne', 'mi', 'me', 'se', 'su', 'sam', 'smo', 'ste', 'ima', 'imate', 'imam', 'imaju', 'nema', 'nemate', 'koliko', 'kosta', 'kostaju', 'kolika', 'cijena', 'cijene', 'cijenu', 'cijeni', 'kakva', 'kakve', 'kakav', 'koji', 'koja', 'koje', 'kojeg', 'koju', 'sto', 'gdje', 'kada', 'kako', 'zasto', 'moze', 'mogu', 'mozete', 'mozemo', 'molim', 'trebam', 'trebao', 'trebala', 'treba', 'zelim', 'zelio', 'zeljela', 'htio', 'htjela', 'bih', 'bi', 'hocu', 'vas', 'vasa', 'vase', 'vasem', 'vasoj', 'vam', 'nas', 'nasa', 'vi', 'ti', 'ja', 'on', 'ona', 'ono', 'oni', 'to', 'ovo', 'ovaj', 'ova', 'taj', 'ta', 'te', 'tog', 'tom', 's', 'sa', 'o', 'od', 'do', 'iz', 'po', 'pri', 'il', 'ili', 'ako', 'kad', 'kod', 'jel', 'dal', 'dali', 'jeli', 'prodajete', 'nudite', 'ponudi', 'ponuda', 'ponudu', 'proizvod', 'proizvodi', 'proizvoda', 'proizvode', 'artikl', 'artikal', 'dostupan', 'dostupno', 'dostupni', 'dostupna', 'imali', 'webshop', 'web', 'shop', 'martimex', 'martimexu', 'kupiti', 'kupnja', 'naruciti', 'online', 'uopce', 'trenutno', 'sad', 'sada', 'jos', 'vise', 'malo', 'nesto', 'neki', 'neka', 'neko', 'mozda', 'molimo', 'hvala', 'bok', 'pozdrav', 'kupac', 'kupca', 'kupcu', 'kupci', 'pita', 'pitao', 'pitala', 'zanima', 'zanimalo', 'zanimaju', 'interesira', 'postovani', 'postovana', 'trazim', 'trazi', 'trazio', 'trazila', 'dobar', 'marka', 'marke', 'marku', 'brend', 'brenda', 'brendu', 'brand', 'kolekcija', 'kolekcije', 'kolekciju', 'kupila', 'kupio', 'dobili', 'dobiti', 'dobila', 'dobio', 'vs', 'versus', 'narucila', 'narucio', 'narucim', 'narucujem', 'narucit', 'kupim', 'kupujem', 'kupit', 'kupis', 'sta', 'tjedan', 'tjedna', 'tjednu', 'mjesec', 'mjeseca', 'mjesecu', 'vikend', 'vikenda', 'vikendu', 'danas', 'sutra', 'stiglo', 'stigla', 'stigli', 'stigle', 'pristiglo', 'pristigli', 'pristigle', 'aktualno', 'aktualne', 'aktualni', 'ovog', 'ovom', 'ove', 'ovih', 'ovu', 'tko', 'kao', 'poput']);
// riječi pitanja i primatelja poklona: nisu dio naziva proizvoda (teme se i dalje prepoznaju iz svih riječi)
const PITANJA = new Set(['dostupnost', 'dostupnosti', 'zaliha', 'zalihi', 'zalihe', 'stanje', 'stanju', 'velicina', 'velicine', 'velicinu', 'velicini', 'velicinama', 'nijansa', 'nijanse', 'nijansu', 'nijansi', 'boja', 'boje', 'boju', 'muz', 'muza', 'muzu', 'muzem', 'suprug', 'supruga', 'suprugu', 'supruzi', 'prijatelj', 'prijatelja', 'prijateljica', 'prijateljicu', 'prijateljici', 'imas', 'imamo', 'postoji', 'jos']);
// oznake spola u nazivu proizvoda (femme, homme…)
const ZENSKE_OZNAKE = new Set(['femme', 'donna', 'women', 'woman', 'her', 'elle', 'lady', 'girl', 'feminine', 'femenino', 'femminile']);
const MUSKE_OZNAKE = new Set(['homme', 'uomo', 'men', 'man', 'him', 'boy', 'masculin', 'masculine', 'hombre']);
const WEAK = new Set(['parfum', 'parfem', 'parfemska', 'parfemi', 'parfema', 'parfeme', 'voda', 'toilette', 'toaletna', 'edp', 'edt', 'extrait', 'set', 'cologne', 'kolonjska', 'homme', 'femme', 'men', 'women', 'man', 'woman', 'intense', 'for', 'him', 'her', 'spray', 'sprej', 'miris', 'mirisi', 'mirisa', 'original', 'originalni', 'novi', 'nova', 'novo']);
const NOISE = new Set([...STOP, ...WEAK, 'g', 'kopiraj', 'copy']);
const ZAMJENE = { edp: 'parfum', edt: 'toilette', edc: 'cologne', sminka: 'makeup', sminke: 'makeup', sminku: 'makeup', dezodorans: 'deodorant', dezodoransi: 'deodorant', nisni: 'niche', nisne: 'niche', nis: 'niche', sunce: 'suncanje', suncu: 'suncanje', ruz: 'ruzevi', ruzevi: 'ruzevi', ruzeve: 'ruzevi', sampon: 'samponi', samponi: 'samponi', regenerator: 'regeneratori', lice: 'lica', tijelo: 'tijela', kosa: 'kose', kosu: 'kose', nokte: 'nokti', nokat: 'nokti' };
const SINONIMI = { krema: ['cream', 'creme', 'kreme'], kreme: ['cream', 'creme', 'krema'], mlijeko: ['milk', 'lait'], ulje: ['oil', 'huile'], sprej: ['spray'], spray: ['sprej'], losion: ['lotion'], maska: ['mask', 'masque'], maske: ['mask', 'masque'], sampon: ['shampoo', 'shampooing', 'samponi'], samponi: ['shampoo', 'shampooing'], regenerator: ['conditioner', 'regeneratori'], regeneratori: ['conditioner'], puder: ['powder', 'foundation', 'puderi'], ruzevi: ['lipstick', 'rouge', 'ruz'], maskara: ['mascara'], mascara: ['maskara'], sjenilo: ['eyeshadow', 'shadow', 'sjenila'], sjenila: ['eyeshadow', 'shadow'], tus: ['eyeliner', 'liner'], lak: ['nail', 'polish', 'lakovi'], balzam: ['balm', 'balsam'], pjena: ['mousse', 'foam'], sapun: ['soap', 'savon'], tonik: ['toner', 'tonic'], piling: ['scrub', 'peeling', 'exfoliant'], serum: ['serum'], njega: ['care'], lice: ['face', 'visage', 'lica'], lica: ['face', 'visage', 'lice'], tijelo: ['body', 'corps', 'tijela'], tijela: ['body', 'corps'], oci: ['eye', 'eyes', 'yeux'], usne: ['lip', 'lips', 'levres'], kosa: ['hair', 'kose'], kose: ['hair'], ruke: ['hand', 'hands', 'mains'], suncanje: ['sun', 'solaire', 'solar', 'tanning', 'bronz'], zastita: ['protection', 'protective'], zastitni: ['protection', 'protective'], noc: ['night', 'nuit'], dan: ['day', 'jour'], muski: ['men', 'homme', 'man'], zenski: ['women', 'femme', 'woman'], poklon: ['gift', 'set'], set: ['set', 'coffret', 'kit'], mini: ['mini', 'travel'], dezodorans: ['deo', 'deodorant'], deodorant: ['deo', 'dezodorans'], gel: ['gel'], voda: ['water', 'eau'], svijeca: ['candle', 'bougie'], difuzor: ['diffuser', 'diffuseur'], miris: ['fragrance', 'parfum', 'scent'], dom: ['home', 'room', 'maison'], micelarna: ['micellar', 'micelaire'], micelarni: ['micellar', 'micelaire'], micelarnu: ['micellar', 'micelaire'], suhi: ['dry'], suha: ['dry'], suho: ['dry'], hidratantna: ['hydra', 'moist', 'hydrat', 'aqua'], hidratantni: ['hydra', 'moist', 'hydrat', 'aqua'], hidratantnu: ['hydra', 'moist', 'hydrat', 'aqua'], hidratantne: ['hydra', 'moist', 'hydrat', 'aqua'], vodootporna: ['waterproof', 'water'], vodootporni: ['waterproof', 'water'], vodootpornu: ['waterproof', 'water'] };
const BREND_STOP = new Set(['the', 'of', 'paris', 'firenze', 'seoul', 'institute', 'dr', 'wonder', 'london', 'milano', 'roma', 'venice']);   // '1920' nije tu: sama riječ „bois“ (drvo) nije brend Bois 1920
const ALIASI = {
  'pupa milano': 'pupa', 'emanuel ungaro': 'ungaro', 'lancome paris': 'lancome', 'eisenberg paris': 'eisenberg', 'collistar milano': 'collistar', 'montale paris': 'montale', 'mancera paris': 'mancera',
  'd g': 'dolcegabbana', 'dg': 'dolcegabbana', 'dolce gabbana': 'dolcegabbana', 'dolce': 'dolcegabbana', 'gabbana': 'dolcegabbana', 'd and g': 'dolcegabbana',
  'ysl': 'yves-saint-laurent', 'saint laurent': 'yves-saint-laurent', 'yves': 'yves-saint-laurent', 'laurent': 'yves-saint-laurent',
  'viktor rolf': 'viktorrolf', 'viktor': 'viktorrolf', 'rolf': 'viktorrolf',
  'rabanne': 'paco-rabanne', 'paco': 'paco-rabanne', 'rabane': 'paco-rabanne',
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
  'born to stand out': 'borntostandout', 'memo paris': 'memo'
};
const NEPOZNATI_BRENDOVI = ['dior', 'christian dior', 'gucci', 'givenchy', 'hermes', 'burberry', 'calvin klein', 'lacoste', 'bvlgari', 'bulgari', 'cartier', 'creed', 'kilian', 'byredo', 'le labo', 'diptyque', 'maison margiela', 'margiela', 'jo malone', 'guerlain', 'nina ricci', 'kenzo', 'azzaro', 'davidoff', 'lanvin', 'cacharel', 'escada', 'jimmy choo', 'marc jacobs', 'narciso rodriguez', 'zadig voltaire', 'tiffany', 'bottega veneta', 'loewe', 'acqua di parma', 'amouage', 'initio', 'parfums de marly', 'nishane', 'roja', 'clive christian', 'maybelline', 'loreal', 'l oreal', 'nyx', 'mac', 'clinique', 'la roche posay', 'vichy', 'nivea', 'dolce vita', 'armaf', 'ajmal', 'rasasi', 'afnan', 'bentley', 'ferrari', 'adidas', 'playboy', 'joop', 'mexx', 'bruno banani', 'hollister', 'abercrombie', 'victoria secret', 'victoria s secret', 'rituals', 'yankee candle'];
// mjesta (gradovi, lokacije poslovnica): opća riječ teme poslovnice, ali i riječ upita za odabir odlomka stranice
const MJESTO_RE = /^(zagreb|split|rijec|rijek|zadar|zadr(a|u|om)$|osijek|varazdin|samobor|pul[aiue]$|dubrovnik|jarun|vlask|ilic|jelacic|britansk|korzo|kolodvor)/;
// re: riječi koje jasno određuju temu (1 bod); opce: riječi koje se javljaju i u drugim temama ili u nazivima proizvoda
// (rok, besplatna, kartica, račun, gold, gift, beauty, tretman…; 0,5 boda). Izraz s razmakom traži se kao fraza u upitu.
const TEME = [
  { id: 'dostava', url: ['/dostava-i-isporuka/'], re: [/^dostav/, /^dostv/, /^postarin/, /^isporuk/, /^paketomat/, /^slanj/, /^posilj/, /^posalj/, /^salj/, /^kurir/, /^gls$/, /^box ?now/, /^boxnow/, /^inozemstv/, /^dostavljat/, /^pracenj/, /^otok/, /^deliver/, /^shipping/], opce: [/^rok/, /^besplatn/, /^paket/, /^stiz/, /^stig/, /^stic(i|e|u|ite)$/, /^subot/, /^vikend/] },
  { id: 'placanje', url: ['/placanje-robe/'], re: [/^placanj/, /^platit/, /^plati$/, /^placa/, /^rat[ae]$/, /^rate$/, /^obrok/, /^obroc/, /^pouzec/, /^virman/, /^uplat/, /^gotovin/, /^paypal/, /^keks/, /^transakcij/, /^diners/, /^maestro/, /^visa$/, /^mastercard/, /^amex$/, /^american/, /^apple$/, /^applepay/, /^google ?pay/, /^pay$/, /^revolut/, /^iban/, /^corvus/, /^aircash/, /^payment/], opce: [/^kartic/, /^racun/] },
  { id: 'povrat', url: ['/povrat-i-reklamacija/', '/najcesca-pitanja/'], jace: [/^reklam/], re: [/^povrat/, /^vrati/, /^vratit/, /^vracanj/, /^zamjen/, /^zamijen/, /^reklam/, /^ostecen/, /^neispravn/, /^pogres(n|an$)/, /^krivi/, /^krivo/, /^nedostaj/, /^razbij/, /^slomljen/, /^polomljen/, /^nazad$/, /^refund/], opce: [/^novac/, /^novca/, /^novce/] },
  { id: 'otkazivanje', url: ['/otkazivanje-povrat/', '/povrat-i-reklamacija/'], re: [/^odustaj[a-z]* od (kupnj|narudzb)/, /^otkaz[a-z]* (narudzb|kupnj)/, /^otkaz/, /^otkazat/, /^odusta/, /^raskid/, /^storn/, /^ponist/, /^cancel/] },
  { id: 'poslovnice', url: ['/poslovnice/'], re: [/^poslovnic/, /^trgovin/, /^ducan/, /^parfumerij/, /^radno/, /^lokacij/, /^nalazite/, /^fizick/, /^prodavaonic/, /^radite$/, /^uzivo$/, /^arena cent/, /^city cent/, /^westgate/, /^supernova/, /^king cross/], opce: [/^adres/, /^vrijem/, /^subot/, /^nedjelj/, /^praznik/, /^blagdan/, /^otvoren/, /^zatvoren/, MJESTO_RE] },
  { id: 'kontakt', url: ['/kontakt/'], re: [/^kontakt/, /^telefon/, /^mail/, /^e ?mail/, /^mejl/, /^sluzb/, /^podrsk/, /^nazvat/, /^nazov/, /^zvati/, /^javiti/, /^razgovar/, /^whats/, /^viber/, /^operater/, /^agent/, /^suradnj/, /^contact/], opce: [/^broj$/, /^osob[aeu]$/, /^osobom$/] },
  { id: 'loyalty', url: ['/loyalty-program/', '/martimex-loyalty-card/'], re: [/^loyalt/, /^lojalt/, /^bod$/, /^bodov/, /^bodove/, /^vjernost/, /^vjern/, /^pogodnost/, /^clanov/, /^clanstv/, /^uclan/, /^martimex kartic/, /^loyalty kartic/, /^registr[a-z]* (u |za )?(loyalt|lojalt|gold|kartic|program)/], opce: [/^gold/, /^clan$/, /^clan[aui]$/, /^program/, /^kartic/] },
  { id: 'poklon-bon', url: ['/poklon-bon/'], re: [/^bon$/, /^bona$/, /^bonu$/, /^bonov/, /^vaucer/, /^voucher/, /^darovn/, /^poklon ?bon/, /^poklon ?kartic/, /^gift ?card/, /^giftcard/], opce: [/^gift/] },
  { id: 'pokloni-uz-kupnju', url: ['/pokloni-uz-kupnju/'], re: [/^gratis/, /^poklon[ia]? uz/, /^uz (svaku )?kupnj/], opce: [/^besplat/, /^uzor/] },
  { id: 'faq', url: ['/najcesca-pitanja/'], jace: [/^kosaric/, /^dovrs/, /^registr/, /^lozink/, /^kreni$/], re: [/^kreni$/, /^faq/, /^najcesc/, /^naruc/, /^registr/, /^kosaric/, /^lozink/, /^prijav/, /^korisnick/, /^dovrs/, /^prigovor/, /^zalb/, /^profil[aeiu]?$/, /^login/, /^ulogir/, /^moj racun/, /^kreni na placanje/, /^r1$/], opce: [/^narudzb/, /^potvrd/, /^pitanj/, /^racun$/, /^promjen/, /^promijen/, /^kupi/, /^kupnj/, /^status/] },
  { id: 'uvjeti', url: ['/opci-uvjeti-poslovanja/'], re: [/^uvjet/, /^poslovanj/, /^pravn/, /^ugovor/] },
  { id: 'privatnost', url: ['/pravila-privatnosti/'], re: [/^privatnost/, /^privacy/, /^podac/, /^podat/, /^gdpr/, /^kolacic/, /^cookie/, /^newsletter/, /^odjav/, /^brisanj[a-z]* (racun|profil|podat|korisnick)/], opce: [/^osobn/, /^brisanj/] },
  { id: 'o-nama', url: ['/o-nama/'], re: [/^nama$/, /^povijest/, /^tvrtk/, /^kompanij/, /^poduzec/, /^osnovan/, /^osnivac/, /^vlasnik/, /^postoj[a-z]* martimex/], opce: [/^firm[aeiu]?$/, /^tko$/] },
  { id: 'beauty', url: ['/beauty-centri/', '/beauty-saloni/'], re: [/^salon[aeiu]?$/, /^saloni(ma)?$/, /^manikur/, /^pedikur/, /^depil/, /^centri$/], opce: [/^beauty/, /^tretman/, /^termin/, /^kozmetic/, /^masaz/, /^centar/, /^centr/, /^rezervac/, /^rezervir/] },
  { id: 'chanel', url: ['/chanel/', '/chanel-beauty-appointment/'], re: [/^chanel/, /^shanel/, /^sanel/] },
  { id: 'akcija', url: ['/akcija/'], re: [/^akcij/, /^snizen/, /^sale$/, /^popust/, /^rasprodaj/, /^promo/, /^kupon/, /^outlet/, /^black friday/, /^blackfriday/], opce: [/^kod$/] },
  { id: 'novo', url: ['/novo/'], re: [/^novo$/, /^novitet/, /^novosti/, /^najnovij/], opce: [/^nov[iaeu]$/] },
  { id: 'furla', url: ['/furla/', '/kontakt-furla/'], re: [/^furla/, /^butik/, /^furla torb[aeiu]\b/] },
  { id: 'savjeti', url: ['/savjeti/'], re: [/^savjet/, /^blog/, /^clan[ae]k/, /^clanc/] }
];
// namjera poklona bez vrste proizvoda: glagol kupnje uz primatelja („što kupiti tati/prijateljici/seki“) ili prigodu („za rođendan“)
const PRIMATELJ_RE = /^(tat[aiu]|mam[aiue]|deck[aiou]|cur[aiue]|sestr[aiue]|sek[aiu]|brat[au]?|prijatelj[a-z]*|muz[aeu]?|zen[iu]|supru[gz][a-z]*|djevojc?k[a-z]*|momk[au]|sin[au]?|kcer[a-z]*|bak[aeiu]|djed[au]?|kum[aeiu]?|punic[a-z]*|svekr[a-z]*)$/;
const PRIGODA_SAMO = /^(rodendan|rodjendan|rodendana|rodendanski|bozic|bozica|bozicni|bozicna|valentinovo|valentinova|godisnjicu|godisnjica|majcin)$/;
const KUPI_RE = /^(kupi|kupiti|kupit|kupim|kupis|kupila|kupio|kupujem|uzeti|pokloniti)$/;
const OPISNE_POKLON_RE = /^(miris|mirisi|mirisa|mirise|mirisn[aeiou]|mirisnih|parfem|parfemi|parfema|parfeme|parfemsk[aeiou]|parfemskih)$/;
// riječi oštećenja: jasna riječ povrata samo uz riječ dostave ili narudžbe („parfem je stigao razbijen“), inače opća („šampon za oštećenu kosu“)
const OSTECENJE_RE = /^(ostecen|slomljen|polomljen|razbij|nedostaj|neispravn|pogres(n|an$)|kriv)/;
const KONTEKST_NARUDZBE_RE = /^(stig|stiz|paket|posiljk|narudzb|dostav|kutij|primil|primio|dobil|dobio|dosl|isporu|kurir|kupil|kupio|narucil|narucio|poslal|poslan)/;
// usluge beauty centra (manikura, pedikura, depilacija): jasna riječ teme beauty samo kad upit ne traži proizvod (krema za depilaciju, set za manikuru)
const USLUGA_RE = /^(manikur|pedikur|depil)/;
const VRSTA_PROIZVODA_RE = /^(krem|set$|setov|ulj|gel$|losion|serum|sampon|maska|sprej|spray|pjen|sapun|balzam|mlijek|piling|parfem|miris|lak$|lakov|turpij|skaric|pribor|aparat|uredaj|traka|trake|vosak|voska)/;
// ključna riječ teme (imenica, kako je piše Marti: „loyalty …“, „kontakt …“, „naručivanje …“); glagol ili opća riječ (otkazati, vratiti, prijava, uvjeti) to nije
const TEMA_KLJUC_RE = /^(dostav|placanj|povrat$|povrata$|povratu$|reklamacij|poslovnic|radno$|kontakt|loyalt|lojalt|gratis|narucivanj|najcesc|faq$|registracij|lozink|kosaric|privatnost|nama$|beauty$|chanel|furla$|savjet|blog$|bon$|poklon$|promo$)/;
// opće riječi uz vrstu ili kategoriju koje ne određuju proizvod (mini, original, vodootporna, travel…)
const OPCE_NAZIV_RE = /^(mini|maxi|original|originalni|originalna|travel|putn[a-z]*|xmas|gift|deluxe|velik[a-z]*|mal[aiou]|mali)$/;
// opće riječi koje same ne smiju odabrati temu u koraku 6b (rok trajanja, starija osoba, broj nijanse, brisanje šminke, koliko vremena traje miris…)
const NEODLUCNE = /^(rok|osob|broj|brisanj|vrijem|vremen|besplat|gift|gold|program|clan|kod$|nov|torb|subot|vikend|uzor|novac|novca|novce|tko$|firm|blagdan|praznik|ostecen|slomljen|polomljen|razbij|nedostaj|neispravn|pogres|kriv|depil|manikur|pedikur)/;
const JAKE_TEME = new Set(['dostava', 'placanje', 'povrat', 'otkazivanje', 'poslovnice', 'kontakt', 'loyalty', 'poklon-bon', 'chanel', 'akcija', 'novo']);
// pitanja o postupku (dostava šampona, vratiti ruž, Versace dostava): jasna riječ teme nadjačava kategoriju i brend
const TEME_POSTUPKA = new Set(['dostava', 'placanje', 'povrat', 'otkazivanje', 'faq', 'kontakt', 'poslovnice', 'loyalty', 'poklon-bon', 'pokloni-uz-kupnju', 'uvjeti', 'privatnost', 'chanel', 'furla', 'o-nama']);
const ROD = [[/^(muski|muskarc|muskarac|muske|musku|muskog|muskom|gospod|deck[aiou]$|frajer|njemu$|momk|tata$|tati$|tatu$|sina$|sinu$|brat$|bratu$|covjek$|covjeka$|covjeku$)/, 32, 'muski'], [/^(zensk|zen[aeiu]$|zenama$|dam[aeiu]$|djevojk|cur[aeiu]$|njoj$|nju$|mam[aeiu]$|majk|sestr|kceri?$)/, 31, 'zenski'], [/^unisex/, 33, 'unisex'], [/^(djecj|djeca|djece|dijete|djecu|djetet|beb)/, null, 'djecji']];
const SORT = [[/^(najjeftin|jeftin|povoljn|najpovoljn)/, 4], [/^(najskup|skup|skuplj|luksuzn)/, 3], [/^(najnovij|novitet|nov[aeiou]?$)/, 2], [/^(popularn|najpopularn|najprodavan|bestsel|najtrazen|najbolj|top$)/, 1], [/^(preporu)/, 5]];
const BLOCKED = ['/wp-admin', '/wp-login', '/wp-json', '/wp-content', '/wp-includes', '/wp-cron', '/wp-config', '/wp-signup', '/wp-activate', '/xmlrpc', '/index.php', '/moj-racun', '/naplata', '/cart', '/kosarica', '/wishlist', '/lista-zelja', '/martimex-content', '/feed', '/pretraga', '/sample-page', '/shop'];
const FILE_RE = /\.(xml|xsl|json|pdf|jpe?g|png|gif|webp|svg|ico|css|js|map|zip|gz|txt|log|bak|env|php|sql|csv|woff2?|ttf)$/i;
// samoprovjera: za svaku ulogu više kandidata; uzima se prvi koji je u indeksu, pa uklonjen proizvod ne ruši provjeru
const SAMOPROVJERA = [
  { kandidati: ['/proizvod/parfemi/parfemske-vode/eros-eau-de-parfum/', '/proizvod/parfemi/parfemske-vode/libre-eau-de-parfum/', '/proizvod/parfemi/parfemske-vode/paradoxe-eau-de-parfum/'], uloga: 'proizvod', ocekuj: 'varijante' },
  { kandidati: ['/proizvod/parfemi/parfemske-vode/dylan-blush-pink-set-eau-de-parfum-100-ml/', '/proizvod/parfemi/toaletne-vode/eros-set-eau-de-toilette-50-ml/', '/proizvod/parfemi/losioni-za-tijelo/dylan-blush-pink-pour-femme-body-lotion-200-ml/'], uloga: 'proizvod', ocekuj: 'cijena' },
  { kandidati: ['/proizvod/makeup/usne/ruzevi/labsolu-rouge-intimatte-34-g/', '/proizvod/makeup/usne/ruzevi/labsolu-rouge-cream-34-g/', '/proizvod/makeup/usne/ruzevi/rouge-pur-couture-satin-lipstick-38-g/'], uloga: 'proizvod', ocekuj: 'nijanse' },
  { kandidati: ['/brand/versace/', '/brand/yves-saint-laurent/'], uloga: 'popis', ocekuj: 'popis' },
  { kandidati: ['/akcija/'], uloga: 'popis', ocekuj: 'akcija' },
  { kandidati: ['/dostava-i-isporuka/'], uloga: 'stranica', ocekuj: 'tekst' }
];
const BRENDOVA_PO_SERIJI = 3;   // najviše 3 stranice istodobno (spec); krug brendova zato traje dulje
const OSVJEZI_NAKON_S = 120;
// timeout POST-a po stranici: pitanje kupca 8 s (spec: odgovor nikad dulje od 22 s); samoprovjera isto 8 s, da vidi ono što vidi kupac
// (web prespor za kupce = 3+ nedostupne stranice = dojava); mapa brendova nije hitna pa smije 15 s; zadaci nemaju drugi dohvat
const TIMEOUT_MS = { upit: 8000, brendovi: 15000, samoprovjera: 8000 };
// samoprovjera čita 6–7 stranica: druga trojka kreće 4 s kasnije, da web ne slaže sve stranice istodobno
const RAZMAK_MS = { samoprovjera: 4000 };
const OBAVEZNI_SITEMAPI = ['product-sitemap', 'product_cat-sitemap', 'martimex_brand-sitemap', 'page-sitemap'];
const DOJAVA_SITEMAPI_NAKON_S = 2 * 3600;   // zadatak sitemapi javlja grešku tek kad je obavezni dio indeksa stariji od 2 h
const DOJAVA_PROZOR_S = 26 * 60;            // ... i to jednom (u jednom pokretanju svakih 25 min), zatim jednom dnevno
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
const izlaz = (akcija, stranice, dodatno) => {
  const kk = Object.assign({}, k, dodatno || {});
  if (!stranice || !stranice.length) return [{ json: { akcija, kontekst: kk, spremi } }];
  const t = akcija === 'dohvati' ? { timeoutMs: TIMEOUT_MS[k.zadatak] || TIMEOUT_MS.upit, razmakMs: RAZMAK_MS[k.zadatak] || 0 } : {};
  return stranice.map((s, i) => ({ json: Object.assign({ akcija }, t, s, i === 0 ? { kontekst: kk, spremi } : {}) }));
};
const odgovori = (rezultat, dodatno) => izlaz('odgovori', null, Object.assign({ rezultat }, dodatno || {}));
const sitemapItemi = () => (k.sitemapDatoteke || []).map(([prefiks, url, sonda]) => ({ url, prefiks, sonda }));

if (jeSitemap) try {
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
      const prijeProizvoda = (idx[prefiks] && Array.isArray(idx[prefiks].v)) ? idx[prefiks].v.length : 0;
      if (sonda && (st === 404 || st === 410 || /<sitemapindex/i.test(xml) || st === 200 || prijeProizvoda < 2900)) return;   // 4. dio ne postoji (još)
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
    // nagli pad broja adresa (npr. web privremeno vrati skraćen sitemap) ne smije prepisati dobar indeks
    const prije = (idx[p] && Array.isArray(idx[p].v)) ? idx[p].v.length : 0;
    const sumnjivo = prije >= 20 && s.rows.length < prije * 0.5;
    if (s.dijelovi > 0 && s.pali === 0 && !sumnjivo) { idx[p] = { at: now, v: s.rows }; spremi.push({ kljuc: p, at: now, v: s.rows }); }
    else if (s.dijelovi > 0 && s.pali === 0) neuspjeli.push(p + ' (sumnjivo malo adresa: ' + s.rows.length + ' umjesto ' + prije + '; zadržan stari popis)');
    else if (s.rows.length && !idx[p]) { idx[p] = { at: now, v: s.rows }; k.upozorenje = (k.upozorenje ? k.upozorenje + ' ' : '') + 'Popis ' + p + ' je nepotpun (dio sitemapa nije dohvaćen).'; if (OBAVEZNI_SITEMAPI.includes(p)) k.indeksDjelomican = true; }
  }
  k.neuspjeliSitemapi = neuspjeli;
} catch (e) {
  neuspjeli.push('obrada sitemapa (' + String(e && e.message || e).slice(0, 120) + ')');
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

try {
  // ---------- zadatak: sitemapi ----------
  if (k.zadatak === 'sitemapi') {
    if (!jeSitemap) return izlaz('sitemapi', sitemapItemi());
    const svjeze = spremi.map(s => s.kljuc + ' ' + s.v.length).join(', ');
    const zdravo = proizvodiRows.length > 100 && brendSlugovi.length > 10;
    if (!neuspjeli.length && zdravo) return odgovori({ ok: true, opis: 'Sitemapi osvježeni: ' + svjeze });
    // kratak ispad weba nije greška: indeks ostaje upotrebljiv, a sljedeći pokušaj je za 25 min.
    // Greška (Telegram) tek kad je obavezni dio indeksa stariji od 2 h, i to jednom, zatim jednom dnevno.
    const atovi = OBAVEZNI_SITEMAPI.map(p => (idx[p] && Array.isArray(idx[p].v) && idx[p].v.length) ? (Number(idx[p].at) || 0) : 0);
    const najstariji = Math.min(...atovi);
    const starostS = najstariji > 0 ? Math.max(0, Math.round((now - najstariji) / 1000)) : null;
    const problem = neuspjeli.join(', ') || ('premalo URL-ova (' + proizvodiRows.length + ' proizvoda, ' + brendSlugovi.length + ' brendova)');
    const opis = 'Sitemapi nisu potpuno osvježeni: ' + problem + '.' + (svjeze ? ' Osvježeno: ' + svjeze + '.' : '') + (starostS !== null ? ' Najstariji obavezni dio indeksa star je ' + Math.round(starostS / 60) + ' min.' : ' U indeksu nema obaveznih sitemapa.');
    const dojava = !zdravo || starostS === null || (starostS >= DOJAVA_SITEMAPI_NAKON_S && (starostS - DOJAVA_SITEMAPI_NAKON_S) % 86400 < DOJAVA_PROZOR_S);
    if (dojava) return odgovori({ ok: false, opis });
    return odgovori({ ok: true, opis: opis + (starostS >= DOJAVA_SITEMAPI_NAKON_S ? ' Dojava je već poslana; ponavlja se jednom dnevno dok se ne popravi.' : ' Sljedeći pokušaj za 25 min; dojava tek ako indeks bude stariji od 2 h.') });
  }

  // ---------- zadatak: brendovi (serija stranica brendova za mapu proizvod -> brend) ----------
  if (k.zadatak === 'brendovi') {
    if (k.indeksGreska) return odgovori({ ok: true, opis: 'Mapa brendova: indeks se nije mogao učitati, serija je preskočena (sljedeći pokušaj za 10 min).' });
    if (!brendSlugovi.length) return odgovori({ ok: true, opis: 'Mapa brendova: u indeksu još nema popisa brendova, serija je preskočena (indeks puni zadatak sitemapi).' });
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
    const uIndeksu = (rows) => new Set((rows || []).map(r => putanja(r[0])));
    const proizvodiSet = uIndeksu(proizvodiRows); const brendoviSet = uIndeksu(brendRows);
    const stranice = SAMOPROVJERA.map(s => {
      const skup = s.uloga === 'proizvod' ? proizvodiSet : (s.kandidati[0].startsWith('/brand/') ? brendoviSet : null);
      const put = (skup && skup.size) ? (s.kandidati.find(c => skup.has(c)) || s.kandidati[0]) : s.kandidati[0];
      return { url: 'https://martimex.hr' + put, uloga: s.uloga, ocekuj: s.ocekuj };
    });
    if (k.pokvari) stranice.push({ url: 'https://martimex.hr/dostava-i-isporuka/', uloga: 'proizvod', ocekuj: 'varijante', namjerno: true });
    return izlaz('dohvati', stranice);
  }

  // ---------- zadatak: upit (Marti) ----------
  if (!k.upit && !k.url) return odgovori({ ok: false, greska: 'Nedostaje "upit" (što kupac traži, kratko) ili "url" (točna adresa na martimex.hr). Pošalji barem jedno od toga.' });

  // L’Homme, J’OSE, L’Absolu: slovo s apostrofom spaja se sa sljedećom riječi, kao u adresama (lhomme, jose, labsolu)
  const tokeniSvi0 = tokeniziraj(String(k.upit || '').replace(/(^|[^\p{L}\d])([a-z])['’`´]\s?(?=\p{L})/giu, '$1$2').replace(/(\d+)[,.](\d+)\s?(ml|g|gr)\b/gi, '$1$2 $3').replace(/\b(\d+)(ml|g|gr)\b/gi, '$1 $2'));
  const tokeniSvi = tokeniSvi0.filter((t, i) => !(/^\d+$/.test(t) && /^(ml|g|gr|mililitara|grama)$/.test(tokeniSvi0[i + 1] || '')) && !(/^(ml|g|gr|mililitara|grama)$/.test(t) && /^\d+$/.test(tokeniSvi0[i - 1] || '')));
  const upitNormCijeli = norm(k.upit);
  const trazenEdp = /\b(edp|eau de parfum|parfemska voda)\b/.test(upitNormCijeli);
  const trazenEdt = /\b(edt|eau de toilette|toaletna voda)\b/.test(upitNormCijeli);
  const tokeni = tokeniSvi.filter(t => !STOP.has(t) && !PITANJA.has(t));
  const urlTekst = String(k.url || '').trim();
  const urlPokus = k.url ? provjeriUrl(k.url) : null;
  const urlSlab = !!k.upit && !!k.url && (!/^(https?:\/\/|\/|www\.|martimex\.hr)/i.test(urlTekst) || /\s/.test(urlTekst) || (urlPokus.url && putanja(urlPokus.url).split('?')[0] === '/'));
  const zeliOpis = (!!k.url && !urlSlab) || /\b(miris|mirise|mirisu|mirisa|not[aeu]|notama|notom|sastav|sastojc|sastoji|ingredien|upotreb|koristi|kako se|primjen|opis|svojstv|djelov|ucin|nanosi|nanosit|tekstur|trajn|trajanj|projekcij|sillage|longevit|intenzit|sladak|slatk|svjez|drven|cvjetn|vocn|zacinsk|dim|pudrast|akord|dojam|miri[sš]i)/.test(norm(k.upit));

  // 1) poslan url -> pročitaj baš tu stranicu (osim ako uz upit stigne nešto što nije adresa ili je samo početna stranica)
  if (k.url && !urlSlab) {
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
          if (sl >= 0.6) kand.push({ url: r[0], sl });
        }
        kand.sort((a, b) => b.sl - a.sl);
        // naziv i brend iz mape brendova (kako piše na webu); inače iz adrese bez sufiksa -2
        const izMapa = (put) => { for (const kl of Object.keys(idx)) { if (!kl.startsWith('brend:')) continue; const m = vrijednost(kl); if (m && Array.isArray(m.proizvodi)) { const f = m.proizvodi.find(p => p[0] === put); if (f) return f[1] + (m.naziv ? ' (' + m.naziv + ')' : ''); } } return null; };
        for (const c of kand.slice(0, 2)) urlPrijedlozi.push({ naziv: izMapa(putanja(c.url)) || naziv_iz_sluga(slugIz(c.url).replace(/-\d+$/, '')), url: c.url });
      }
    }
    return izlaz('dohvati', [{ url: p.url, uloga: 'url' }], { tokeni, zeliOpis, urlPrijedlozi, akcijaFilter: tokeni.some(t => /^(akcij|snizen|popust|rasprodaj|outlet|sale$)/.test(t)) });
  }

  // 2) tema (informativne stranice)
  const spojeno = ' ' + tokeniSvi.join(' ') + ' ';
  // bodovi teme: jasna riječ 1, opća riječ 0,5, fraza 1; pokriveni = indeksi riječi upita koje tema objašnjava
  const kontekstNarudzbe = tokeniSvi.some(t => KONTEKST_NARUDZBE_RE.test(t));
  const trazeProizvod = tokeniSvi.some(t => VRSTA_PROIZVODA_RE.test(t));
  const temeHit = TEME.map(t => {
    const hits = new Set(); const pokriveni = new Set(); const jasne = new Set(); let bod = 0; let jakih = 0;
    tokeniSvi.forEach((tok, i) => {
      const uRe = t.re.some(re => !re.source.includes(' ') && re.test(tok));
      const jasna = uRe && !(OSTECENJE_RE.test(tok) && !kontekstNarudzbe) && !(USLUGA_RE.test(tok) && trazeProizvod);
      const opca = !jasna && (uRe || (t.opce || []).some(re => re.test(tok)));
      if (!jasna && !opca) return;
      pokriveni.add(i);
      if (hits.has(tok)) return;
      // posebno jake riječi (npr. košarica za tijek narudžbe) vrijede 1,5 boda
      const jaca = jasna && (t.jace || []).some(re => re.test(tok));
      hits.add(tok); bod += jaca ? 1.5 : jasna ? 1 : 0.5; if (jasna) { jakih++; jasne.add(tok); }
    });
    for (const re of t.re) {
      if (!re.source.includes(' ')) continue;
      const m = new RegExp(re.source.replace(/^\^/, '\\b')).exec(spojeno);
      if (!m) continue;
      const rijeci = m[0].trim().split(' ');
      let novih = 0;
      tokeniSvi.forEach((tok, i) => { if (rijeci.some(w => tok.startsWith(w) || w.startsWith(tok))) { if (!pokriveni.has(i)) novih++; pokriveni.add(i); hits.add(tok); jasne.add(tok); } });
      if (novih) { bod += 1; jakih++; } else if (!jakih) { bod = Math.max(bod, 1); jakih++; }
    }
    return { tema: t, hits: [...hits], jasne: [...jasne], bod, jakih, pokriveni, jaka: JAKE_TEME.has(t.id) };
  }).filter(x => x.hits.length).sort((a, b) => (b.bod - a.bod) || (Number(b.jaka) - Number(a.jaka)));

  // 3) brend
  let brend = null;
  let brendTokeni = [];
  {
    const kandidati = [];
    for (const alias of Object.keys(ALIASI).sort((a, b) => b.length - a.length)) {
      if (alias === 'dolce' && spojeno.includes(' dolce vita ')) continue;
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
      if (jezgra.length && (jezgra.length >= 2 || jezgra[0].length >= 4) && jezgra.every(w => tokeniSvi.includes(w))) { kandidati.push({ slug, rijeci: jezgra, tezina: jezgra.length }); continue; }
      // brend u padežu: „od Prade“, „Versacea“ (jedna riječ od barem 5 slova)
      const osnovaR = w => w.replace(/(om|em|ov|ev|a|e|u|i)$/, '');
      if (rijeci.length === 1 && slug.length >= 5) { const t = tokeniSvi.find(x => x !== slug && x.length >= 5 && (osnovaR(x) === osnovaR(slug) || (x.startsWith(slug) && x.length - slug.length <= 2 && /^(a|e|u|om|em|ov)$/.test(x.slice(slug.length))))); if (t) kandidati.push({ slug, rijeci: [t], tezina: 0.9 }); }
    }
    const poz = c => { const p = c.rijeci.map(w => tokeniSvi.indexOf(w)).filter(i => i >= 0); return p.length ? Math.min(...p) : 99; };
    const uNazivuMem = new Map();
    const uNazivuBrend = c => { if (c.rijeci.length !== 1) return 0; if (!uNazivuMem.has(c.slug)) uNazivuMem.set(c.slug, proizvodiRows.some(r => { const w = slugIz(r[0]).split('-'); return w.includes(c.rijeci[0]) && tokeniSvi.some(t => t !== c.rijeci[0] && t.length >= 3 && !STOP.has(t) && w.includes(t)); }) ? 1 : 0); return uNazivuMem.get(c.slug); };
    kandidati.sort((a, b) => (b.tezina - a.tezina) || (uNazivuBrend(a) - uNazivuBrend(b)) || (poz(a) - poz(b)) || (b.slug.length - a.slug.length));
    const usredNaziva = c => c.rijeci.length === 1 && proizvodiRows.some(r => { const w = slugIz(r[0]).split('-'); const i = w.indexOf(c.rijeci[0]); return i > 0 && tokeniSvi.some(t => t !== c.rijeci[0] && t.length >= 3 && !STOP.has(t) && w.includes(t)); });
    const samoNaziv = kandidati.length === 1 && poz(kandidati[0]) > 0 && usredNaziva(kandidati[0]);
    if (kandidati.length && !samoNaziv) { brend = kandidati[0].slug; brendTokeni = kandidati[0].rijeci; }
  }
  const brendDuge = brend ? brend.split('-').filter(w => w.length >= 5) : [];
  const aliasRijeci = new Set(brend ? Object.keys(ALIASI).filter(a => ALIASI[a] === brend).flatMap(a => a.split(' ')) : []);
  // drugi oblik brenda (alias, jedno krivo slovo) se uklanja, osim kad je ta riječ i riječ u adresi proizvoda (La Fenice, Granada, D&G Dolce)
  const brendSlugRijeci = new Set(brend ? brend.split('-') : []);
  const slugRijec = t => !brendSlugRijeci.has(t) && proizvodiRows.some(r => slugIz(r[0]).split('-').includes(t));
  const tokeniBezBrenda = tokeni.filter(t => !brendTokeni.includes(t) && !((aliasRijeci.has(t) || (t.length >= 5 && brendDuge.some(w => lev(t, w) <= 1))) && !slugRijec(t)));

  // 4) spol / vrsta / sortiranje / cijena / note
  let gender = null; let spolSlug = null; let sort = null; let minPrice = null; let maxPrice = null; let noteUrl = null; let vrstaUrl = null;
  const ostali = [];
  // „za njega“ (za muškarca): primatelj, osim uz riječ njege (krema, serum, lice, kosa…)
  const zaNjega = tokeniSvi.some((x, i) => x === 'njega' && tokeniSvi[i - 1] === 'za') && !tokeniSvi.some(x => x !== 'njega' && /^(krem|serum|hidrat|tonik|toner|piling|ciscen|fluid|ampul|kontur|lic[aeiu]?$|kos[aeiu]$|kosu$|tijel|ruk[aeu]$|nokt|koz[aeiu]$|kozu$)/.test(x));
  for (const t of tokeniBezBrenda) {
    if (t === 'njega' && zaNjega) { gender = 32; spolSlug = 'muski'; continue; }
    const r = ROD.find(([re]) => re.test(t)); if (r) { gender = r[1]; spolSlug = r[2]; continue; }
    const s = SORT.find(([re]) => re.test(t));
    // „nova/novi/novo“ i „top“ su sortiranje, osim kad su sa susjednom riječi dio naziva proizvoda (Skin Nova, Top Coat)
    const uNazivuUz = () => { const i = tokeniBezBrenda.indexOf(t); const ima = d => proizvodiRows.some(r => slugIz(r[0]).includes(d)); return i >= 0 && [tokeniBezBrenda[i - 1], tokeniBezBrenda[i + 1]].some(w => w && (ima(w + '-' + t) || ima(t + '-' + w))); };
    if (s && !(((s[1] === 2 && /^nov[aeiou]?$/.test(t)) || (s[1] === 1 && t === 'top')) && uNazivuUz())) { sort = s[1]; continue; }
    if (/^(cvjetn|cvijetn|floral)/.test(t)) { noteUrl = (noteRows.find(r => /cvijetni|cvjetni/.test(r[0])) || [])[0] || null; continue; }
    if (/^(vocn|fruity|fruit)/.test(t)) { noteUrl = (noteRows.find(r => /vocni/.test(r[0])) || [])[0] || null; continue; }
    if (/^(niche|nisni)/.test(t)) { vrstaUrl = (vrstaRows.find(r => /\/vrsta\/niche\//.test(r[0])) || [])[0] || null; continue; }
    ostali.push(t);
  }
  const cijenaRijeci = new Set();
  {
    const n = norm(k.upit);
    const mMax = n.match(/\b(do|ispod|max|maksimalno|najvise)\s+(\d{2,4})\b/); if (mMax) { maxPrice = Number(mMax[2]); cijenaRijeci.add(mMax[1]); }
    const mMin = n.match(/\b(od|iznad|preko|najmanje|min|minimalno)\s+(\d{2,4})\b(?!\s*ml)/); if (mMin && (!mMax || mMin.index !== mMax.index)) { minPrice = Number(mMin[2]); cijenaRijeci.add(mMin[1]); }
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) { const t = minPrice; minPrice = maxPrice; maxPrice = t; }
  }
  const brojevi = new Set(ostali.filter(t => /^\d+$/.test(t) && (t === String(minPrice) || t === String(maxPrice))));
  const brojeviBezNaziva = new Set(tokeniSvi.filter((x, i) => /^\d{1,4}$/.test(x) && (/^(eur|eura|euro|e|kn|kuna)$/.test(tokeniSvi[i + 1] || '') || (/^\d{1,3}$/.test(x) && (/^(top|najbolj|najpopularn)/.test(tokeniSvi[i - 1] || '') || /^(najbolj|najpopularn)/.test(tokeniSvi[i + 1] || ''))))));
  const tokeniProizvoda = ostali.filter(t => !brojevi.has(t) && !cijenaRijeci.has(t) && !brojeviBezNaziva.has(t) && !/^(eur|eura|euro|e|kn|kuna|cijene|cijena)$/.test(t));
  const crniPetak = /\b(black ?friday|cyber ?monday)\b/.test(spojeno);
  const akcijaFilter = crniPetak || tokeniProizvoda.some(t => /^(akcij|snizen|sale|popust|rasprodaj|outlet)/.test(t));
  const PROMO_RE = /^(promo|kod|koda|kodovi|kodova|kupon|kuponi|kupona|aktivni|aktivan|vrijedi|vrijede)$/;
  const trazimPromo = tokeniProizvoda.some(t => /^(promo|kupon|kuponi|kupona)$/.test(t)) || (tokeniSvi.includes('kod') && tokeniProizvoda.some(t => /^(promo|popust|akcij)/.test(t)));
  const tokeniBezAkcije = tokeniProizvoda.filter(t => !/^(akcij|snizen|sale|popust|rasprodaj|outlet)$/.test(t) && !/^(akcij|snizen|popust|rasprodaj|outlet)/.test(t) && !(trazimPromo && PROMO_RE.test(t)) && !(crniPetak && /^(black|friday|blackfriday|cyber|monday|cybermonday)$/.test(t)));
  // pitanje o promo kodu bez proizvoda i brenda: kodovi su na proizvodima, pa popis popularnih parfema pokazuje aktivni kod
  const promoIzlaz = () => izlaz('dohvati', [{ url: 'https://martimex.hr/kategorija/parfemi/?sort=1', uloga: 'popis' }], { tip: 'popis', tokeni: [], zeliOpis, napomena: 'Promo kodovi vrijede za pojedine proizvode i mogu vrijediti i izvan parfema: aktivni kodovi su u retku „Promo kodovi na ovoj stranici“ i u oznakama „| Promo: …“ uz proizvode. Za konkretan proizvod pozovi alat s njegovim nazivom.', promoUpit: true });
  if (trazimPromo && !tokeniBezAkcije.length && !brend) return promoIzlaz();

  // 5) kategorija (slugovi iz sitemapa)
  let kategorija = null;
  const NJEGA_RIJECI = /^(krem|serum|hidrat|anti|tonik|toner|piling|ciscen|njeg|fluid|ampul|kontur)/;
  const stemK = w => /^parfem/.test(w) ? 'parfem' : stem(w);
  const stemovi = tokeniBezAkcije.map(stemK);
  {
    const kand = [];
    for (const r of katRows) {
      const path = putanja(r[0]);
      if (/\/(uncategorized|checkout-pokloni|promo|novo|parfem|njega-2)\//.test(path)) continue;
      const segs = path.split('/').filter(Boolean).slice(1);
      if (!segs.length) continue;
      const zadnji = segs[segs.length - 1].split('-').filter(w => !STOP.has(w) && !/^\d+$/.test(w));
      const zadnjiStem = zadnji.map(stemK);
      if (!zadnjiStem.length) continue;
      const roditelj = segs.slice(0, -1).join('-').split('-').filter(Boolean).map(stemK);
      const pogodjeni = new Set();
      let sve = true; let bezNjege = 0;
      for (const zs of zadnjiStem) { const i = stemovi.findIndex(ts => ts === zs); if (i < 0) { if (zs === 'njeg' && zadnjiStem.length > 1) { bezNjege++; continue; } sve = false; break; } pogodjeni.add(i); }
      if (!sve || bezNjege === zadnjiStem.length) continue;
      // kategorija njege bez riječi „njega“ samo uz riječ njege u upitu (krema, serum, anti age…): „musk“ nije „muška njega“
      if (bezNjege && !tokeniBezAkcije.some(t => NJEGA_RIJECI.test(t))) continue;
      stemovi.forEach((ts, i) => { if (!pogodjeni.has(i) && roditelj.includes(ts)) pogodjeni.add(i); });
      const njegaBonus = segs[0] === 'njega' && tokeniBezAkcije.some(t => NJEGA_RIJECI.test(t)) ? 1.6 : 0;
      kand.push({ url: r[0], path, segs, bezNjege, pogodjeni: [...pogodjeni], tezina: (zadnjiStem.length - bezNjege) * 2 + (pogodjeni.size - (zadnjiStem.length - bezNjege)) - segs.length * 0.1 - bezNjege * 1.5 + njegaBonus });
    }
    kand.sort((a, b) => b.tezina - a.tezina);
    if (kand.length) kategorija = kand[0];
  }
  // kategorija prepoznata bez riječi „njega“ (anti age krema): riječi kategorije ostaju i riječi naziva proizvoda
  const tokeniOstatak = tokeniBezAkcije.filter((t, i) => !(kategorija && !kategorija.bezNjege && kategorija.pogodjeni.includes(i)));
  const vrstaSet = !tokeniOstatak.length && tokeniBezAkcije.some(t => /^(set|setovi|setove|paket|poklon paket)$/.test(t)) && !kategorija;

  // tema pobjeđuje kad pokriva upit (ili je jaka i upit je kratak); kategorija i brend samo kad je jasna tema postupka
  const kupnjaZaNekog = tokeniSvi.some(t => KUPI_RE.test(t)) && !tokeniBezAkcije.some(t => OPISNE_POKLON_RE.test(t)) && (tokeniSvi.some(t => PRIMATELJ_RE.test(t)) || tokeniBezAkcije.some(t => PRIGODA_SAMO.test(t)));
  let tema = temeHit[0] || null;
  // akcija/novo su popisi: uz jasnu drugu temu (npr. „loyalty popust na akcijske proizvode“) prednost ima druga tema
  if (tema && (tema.tema.id === 'akcija' || tema.tema.id === 'novo')) { const d = temeHit.find(x => x.jakih > 0 && x.tema.id !== 'akcija' && x.tema.id !== 'novo'); if (d) tema = d; }
  // ključna riječ teme na početku upita (oblik „tema + detalj“: „loyalty registracija“, „kontakt radno vrijeme“, „dostava košarica“):
  // ta tema je prva, a tema iz ostatka upita koja je jača najviše 0,5 boda čita se kao druga stranica
  let drugaVodeca = null;
  {
    const i0 = tokeniSvi.findIndex(t => !STOP.has(t) && !PITANJA.has(t));
    const t0 = tokeniSvi[i0] || '', iza = tokeniSvi.slice(i0 + 1, i0 + 3).join(' ');
    const kljuc = TEMA_KLJUC_RE.test(t0) || (/^(otkazivanj|odustajanj)/.test(t0) && /(narudzb|kupnj)/.test(iza)) || (/^uvjet/.test(t0) && /^poslovanj/.test(tokeniSvi[i0 + 1] || ''));
    const L = (i0 >= 0 && kljuc) ? temeHit.find(x => x.jakih > 0 && x.jasne.includes(t0) && x.tema.id !== 'akcija' && x.tema.id !== 'novo') : null;
    if (L && tema && L !== tema && tema.bod >= L.bod && tema.bod - L.bod <= 0.5) { if (tema.tema.id !== 'akcija' && tema.tema.id !== 'novo' && tema.jasne.some(x => TEMA_KLJUC_RE.test(x))) drugaVodeca = tema; tema = L; }
  }
  const smislenih = Math.max(1, tokeniSvi.filter((t, i) => !STOP.has(t) || (tema && tema.pokriveni.has(i))).length);
  const pokriveniTeme = tema ? new Set([...tema.pokriveni, ...(drugaVodeca ? drugaVodeca.pokriveni : [])]) : new Set();
  const temaPokriva = tema ? pokriveniTeme.size / smislenih : 0;
  const izvanTeme = tema ? tokeniSvi.filter((t, i) => !STOP.has(t) && !PITANJA.has(t) && !pokriveniTeme.has(i)).length : 0;
  // samo opće riječi (gold, gift, tretman, kozmetička…) uz druge riječi: prvo se traže proizvodi (The One Gold, kozmetička torbica)
  const temaJasna = !!tema && (tema.bod >= 1 || !izvanTeme);
  const temaPostupka = !!tema && tema.jakih > 0 && TEME_POSTUPKA.has(tema.tema.id);
  // jasna riječ teme koja nije glagol ni riječ pitanja (naručiti, kupiti): samo takva tema nadjačava kategoriju ili izbor proizvoda
  const smislenaJasna = x => !!x && x.jakih > 0 && x.jasne.some(t => !STOP.has(t) && !PITANJA.has(t));
  // dvije podjednako jake teme (npr. „mogu li bon iskoristiti u poslovnici“): čitaju se obje stranice (po jedna, najviše 2)
  const drugaJednaka = drugaVodeca || (tema && tema.bod >= 1 && temeHit.find(x => x !== tema && x.tema.id !== 'akcija' && x.tema.id !== 'novo' && smislenaJasna(x) && (x.bod === tema.bod || (tema.bod - x.bod <= 0.5 && JAKE_TEME.has(x.tema.id) && x.jasne.some(y => TEMA_KLJUC_RE.test(y)))))) || null;
  // članak bloga čiji naslov (adresa) sadrži riječi upita
  const OPCE_CLANAK = /^(parfem|miris|najbolj|najpopularn|top$|koji$|kako$|zensk|zen[aeiu]$|musk|unisex|djecj|black$|friday$|akcij|snizen|popust|nju$|njega$|njemu$|njoj$|njih$|njima$|iskustv|recenzij|misljenj)/;
  const istaRijec = (x, t) => x === t || (t.length >= 5 && x.length >= 5 && (() => { let n = 0; while (n < x.length && n < t.length && x[n] === t[n]) n++; return n >= Math.max(5, Math.min(x.length, t.length) - 2); })());
  const clanakZa = (rijeci, min) => {
    const r = [...new Set(rijeci.filter(t => t.length >= 3 && !STOP.has(t)))];
    let naj = null;
    for (const row of postRows) {
      const w = slugIz(row[0]).split('-');
      const pog = r.filter(t => w.some(x => istaRijec(x, t)));
      if (pog.length >= min && pog.some(t => !OPCE_CLANAK.test(t)) && (!naj || pog.length > naj.n || (pog.length === naj.n && row[0].length < naj.url.length))) naj = { url: row[0], n: pog.length, rijeci: pog };
    }
    return naj;
  };
  const clanakIzlaz = c => izlaz('dohvati', [{ url: c.url, uloga: 'stranica' }], { tip: 'stranica', tema: 'savjeti', tokeni: [], tokeniTeme: c.rijeci, zeliOpis, napomena: 'Odabran je članak bloga Martimex Savjeti čija adresa sadrži riječi upita (' + c.rijeci.join(', ') + '); ostali članci: https://martimex.hr/savjeti/' });
  function temaIzlaz(t) {
    if (t.tema.id === 'akcija' || t.tema.id === 'novo') {
      const u = 'https://martimex.hr' + t.tema.url[0] + (gender ? '?gender=' + gender : '');
      return izlaz('dohvati', [{ url: u, uloga: 'popis' }], { tip: 'popis', tema: t.tema.id, tokeni: tokeniOstatak, akcijaFilter: false, zeliOpis });
    }
    // Furla ima svoju stranicu kontakta: opći kontakt nije druga tema
    const druga = (t === tema && !(t.tema.id === 'furla' && drugaJednaka && drugaJednaka.tema.id === 'kontakt')) ? drugaJednaka : null;
    let urlovi = (druga ? [...new Set([t.tema.url[0], druga.tema.url[0], t.tema.url[1], druga.tema.url[1]].filter(Boolean))].slice(0, 3) : t.tema.url.slice(0, 2)).map(u => 'https://martimex.hr' + u);
    if (!druga && t.tema.id === 'povrat' && tokeniSvi.some(x => OSTECENJE_RE.test(x)) && tokeniSvi.some(x => /^(stig|stiz|paket|posiljk|dostav|kurir|dosl)/.test(x))) urlovi = ['https://martimex.hr/povrat-i-reklamacija/', 'https://martimex.hr/dostava-i-isporuka/'];
    if (!druga && (t.tema.id === 'furla' || (t.tema.id === 'beauty' && tokeniSvi.some(x => MJESTO_RE.test(x)))) && !urlovi.some(u => /\/poslovnice\/$/.test(u))) urlovi.push('https://martimex.hr/poslovnice/');
    if (t.tema.id === 'savjeti') { const c = clanakZa(tokeniBezBrenda.filter(x => !t.hits.includes(x)), 1); if (c) urlovi = [urlovi[0], c.url]; }
    const hitsSvi = druga ? t.hits.concat(druga.hits) : t.hits;
    const alternativa = druga ? null : (temeHit.find(x => x !== t && x.bod === t.bod) || null);
    return izlaz('dohvati', urlovi.map(u => ({ url: u, uloga: 'stranica' })), { tip: 'stranica', tema: t.tema.id, teme: druga ? [t.tema.id, druga.tema.id] : null, temaAlternativa: alternativa ? { id: alternativa.tema.id, url: 'https://martimex.hr' + alternativa.tema.url[0] } : null, tokeni: tokeniBezAkcije.filter(x => !hitsSvi.includes(x) || MJESTO_RE.test(x)), tokeniTeme: hitsSvi, zeliOpis, napomena: (t.tema.id === 'chanel' && !brendSlugovi.includes('chanel')) ? 'Chanel mirise i kozmetiku Martimex nudi u svojim parfumerijama (Chanel Espace, vidi stranicu); na popisu brendova webshopa martimex.hr Chanel nema, pa se ne može naručiti online.' : null });
  }
  const temaUzBrend = !!brend && temaPostupka && tokeniOstatak.length > 0 && tokeniOstatak.every(t => temeHit.some(x => x.jakih > 0 && x.hits.includes(t)));   // „Versace dostava“, „Lancome reklamacija“, „furla butik“
  if (tema && temaJasna && (!brend || temaUzBrend) && (!kategorija || (temaPostupka && smislenaJasna(tema))) && !(kupnjaZaNekog && !smislenaJasna(tema)) && (temaPokriva >= 0.4 || (tema.jaka && tokeni.length <= 4 && temaPokriva > 0) || tema.tema.id === 'chanel' || temaUzBrend) && !(tema.tema.id === 'akcija' && tokeniBezAkcije.filter(t => !tema.hits.includes(t)).length) && !((tema.tema.id === 'novo' || tema.tema.id === 'akcija') && (vrstaUrl || noteUrl)) && !(tema.tema.id === 'novo' && tokeniBezAkcije.filter(t => !/^nov/.test(t) && !tema.hits.includes(t)).length)) return temaIzlaz(tema);

  const filtri = [];
  if (gender) filtri.push('gender=' + gender);
  if (sort) filtri.push('sort=' + sort);
  if (minPrice !== null) filtri.push('minPrice=' + minPrice);
  if (maxPrice !== null) filtri.push('maxPrice=' + maxPrice);
  const sFiltrima = (u) => u + (filtri.length ? (u.includes('?') ? '&' : '?') + filtri.join('&') : '');
  const bfClanak = crniPetak ? ((postRows.find(r => /black-friday/.test(slugIz(r[0])) && /parfem/.test(slugIz(r[0]))) || postRows.find(r => /black-friday/.test(slugIz(r[0]))) || [])[0] || null) : null;
  const popis = (u, dodatno) => izlaz('dohvati', [{ url: sFiltrima(u), uloga: 'popis' }], Object.assign({ tip: 'popis', brend, brendNaziv: brend ? brendNaziv(brend) : null, kategorija: kategorija ? kategorija.path : null, akcijaFilter, tokeni: tokeniOstatak, zeliOpis, filtri }, bfClanak ? { napomena: 'Black Friday: na webu je članak ' + bfClanak + ' (izdvojeni proizvodi i datumi); u popisu su trenutne cijene s weba.' } : {}, dodatno || {}));
  const setoviUrl = (vrstaRows.find(r => /\/vrsta\/setovi\//.test(r[0])) || [])[0] || null;
  const katVrh = !!kategorija && kategorija.segs.length === 1 && kategorija.segs[0] === 'parfemi';
  const OPISNE_RE = /^(miris|mirisi|mirisa|mirise|mirisn[aeiou]|mirisnih|parfem|parfemi|parfema|parfeme|parfemsk[aeiou]|parfemskih)$/;
  if (!brend && (!kategorija || katVrh)) {
    // ideja za poklon (bez naziva proizvoda): setovi, s filtrima spola i cijene; članak za prigodu (rođendan, Božić, Valentinovo) u napomeni
    const POKLON_RE = /^(poklon|pokloni|poklona|poklone|poklonu|pokloniti|ideja|ideju|ideje|dar|darovati|iznenadjenje)$/;
    const PRIGODA_RE = /^(rodendan|rodjendan|rodendana|rodendanski|bozic|bozica|bozicni|bozicna|valentinovo|valentinova|godisnjicu|godisnjica|majcin|dan|zena|zene|set|setovi|setove|setova|paket|paketi|nju|njega|sebe|lijep|lijepi|lijepo|neki|neku|dobar|voljen[aeiu]|voljenoj|voljenom|osob[aeiu]|osobom|nekog|nekoga|nekom|nekome|posebn[aeiu]|posebnoj|posebnom|drag[aeiu]|dragoj|dragom)$/;
    const sviBezBrenda = tokeniBezAkcije.filter(t => !OPISNE_RE.test(t));
    // „što kupiti tati za rođendan“: glagol kupnje uz primatelja ili prigodu, bez vrste proizvoda
    if (setoviUrl && (sviBezBrenda.some(t => POKLON_RE.test(t)) || kupnjaZaNekog) && sviBezBrenda.every(t => POKLON_RE.test(t) || PRIGODA_RE.test(t) || (kupnjaZaNekog && PRIMATELJ_RE.test(t)))) {
      const c = clanakZa(sviBezBrenda.filter(t => !POKLON_RE.test(t) && !/^(set|setovi|setove|setova|paket|paketi)$/.test(t)), 1);
      return popis(setoviUrl, { napomena: 'Upit je ideja za poklon: popis poklon setova' + (filtri.length ? ' (s filtrima ' + filtri.join(', ') + ')' : '') + '. Poklon bon: https://martimex.hr/poklon-bon/' + (c ? ' · članak s idejama: ' + c.url : '') });
    }
    // samo „setovi“ / „poklon paket“
    if (setoviUrl && tokeniOstatak.length && tokeniOstatak.some(t => /^(set|setovi|setove|setova|paket|paketi)$/.test(t)) && tokeniOstatak.every(t => /^(set|setovi|setove|setova|paket|paketi|blagdan[a-z]*|bozicn[a-z]*|praznicn[a-z]*|poklon[a-z]*)$/.test(t) || PRIGODA_SAMO.test(t))) return popis(setoviUrl);
    // note, niche, dječji (uz riječ parfemi/mirisi): stranica note/vrste/spola, ne opći popis parfema
    if (tokeniOstatak.every(t => OPISNE_RE.test(t))) {
      if (noteUrl) return popis(noteUrl);
      if (vrstaUrl) return popis(vrstaUrl);
      if (spolSlug === 'djecji') { const u = (spolRows.find(r => r[0].includes('/spol/djecji/')) || [])[0]; if (u) return popis(u, { filtri: filtri.filter(f => !f.startsWith('gender=')) }); }
      if (tokeniOstatak.length && !kategorija && (gender || sort || minPrice !== null || maxPrice !== null)) return popis('https://martimex.hr/kategorija/parfemi/');   // „muški mirisi“
    }
  }

  // vrsta proizvoda uz kategoriju („krema za sunčanje“, „sprej za kosu“): popis kategorije, ne pojedini proizvodi
  const VRSTA_RIJEC_RE = /^(krem[aeiu]?|kreme|serum[aeiu]?|serumi|ulj[aeiu]|ulja|sprej[aeu]?|losion[aei]?|mlijek[aou]|gel[aoui]?|pjen[aeiu]|maska|maske|masku|balzam[aeiu]?|fluid[aeiu]?|tonik[aeiu]?|piling[aeiu]?)$/;

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
  const tudjePutanje = new Set(); const sviMapirani = new Set();
  if (brend) for (const kl of Object.keys(idx)) { if (!kl.startsWith('brend:')) continue; const m = vrijednost(kl); if (m && Array.isArray(m.proizvodi)) for (const p of m.proizvodi) { sviMapirani.add(p[0]); if (kl !== 'brend:' + brend) tudjePutanje.add(p[0]); } }
  const mapaNazivi = {};
  if (mapaBrenda && Array.isArray(mapaBrenda.proizvodi)) for (const p of mapaBrenda.proizvodi) mapaNazivi[p[0]] = p[1];
  const brendRijeci = new Set(brend ? brend.split('-').concat(brendTokeni) : []);
  const noiseUpita = new Set([...NOISE, ...brendRijeci]);

  // spol i note iz upita (korak 4 ih ne ostavlja u riječima naziva): proizvod s odgovarajućom oznakom u adresi dobiva prednost
  // spol iz upita („za žene“) ili, kad je jednoznačna, iz oznake u nazivu (pour homme, donna…): tada samo kazna suprotnom spolu
  const oznakaM = tokeniBezBrenda.some(t => MUSKE_OZNAKE.has(t)), oznakaZ = tokeniBezBrenda.some(t => ZENSKE_OZNAKE.has(t));
  const spolIzNaziva = gender !== 31 && gender !== 32 && oznakaM !== oznakaZ;
  const traziSpol = gender === 31 ? 'z' : gender === 32 ? 'm' : spolIzNaziva ? (oznakaM ? 'm' : 'z') : null;
  const noteUpita = tokeniBezBrenda.filter(t => /^(cvjetn|cvijetn|floral|vocn|fruity|fruit)/.test(t));
  const noteOdgovara = w => noteUpita.some(t => (/^(cvjetn|cvijetn|floral)/.test(t) && /^flor/.test(w)) || (/^(vocn|fruity|fruit)/.test(t) && /^fruit/.test(w)));
  function rangiraj(tokensIn, ograniciNaMapu, bezKategorije) {
    const toks = tokensIn.slice();
    const stems = toks.map(t => t.length >= 5 ? t.slice(0, -1) : t);
    const strong = toks.filter(t => !WEAK_RE.test(t) && !/^\d+$/.test(t));
    const hitSlug = (sw) => toks.some((t, i) => sw === t || (t.length >= 5 && sw.startsWith(stems[i])) || (SINONIMI[t] && SINONIMI[t].some(a => sw === a || (a.length >= 4 && sw.startsWith(a)))));
    const rez = [];
    for (const r of proizvodiRows) {
      const url = r[0];
      const path = putanja(url);
      if (!/^\/proizvod\//.test(path)) continue;
      if (ograniciNaMapu && !mapaPutanje.has(path) && sviMapirani.has(path)) continue;   // proizvod drugog brenda
      if (tudjePutanje.has(path) && !(mapaPutanje && mapaPutanje.has(path))) continue;
      // kategorija prepoznata bez riječi „njega“ ne isključuje proizvode drugih kategorija (Anti-Age Booster u „njega za blistav ten“), samo daje prednost
      if (!bezKategorije && kategorija && !kategorija.bezNjege && !(katVrh && /\/(promo|uncategorized)\/|\/mirisi-za-(dom|auto)\//.test(path)) && !path.includes('/' + kategorija.segs[kategorija.segs.length - 1] + '/')) continue;
      const slug = slugIz(url);
      const hay = ' ' + norm(path).replace(/\s+/g, ' ') + ' ';
      let score = 0; let strongHit = 0; const pogodjeni = new Set();
      for (let i = 0; i < toks.length; i++) {
        const t = toks[i]; const w = (WEAK_RE.test(t) || /^\d+$/.test(t)) ? 1 : 3;
        if (t.length === 1) { if (hay.includes(' ' + t + ' ')) { score += 3; strongHit++; pogodjeni.add(t); } continue; }
        if (hay.includes(' ' + t + ' ')) { score += w; if (w === 3) strongHit++; pogodjeni.add(t); }
        else if (/^\d+$/.test(t)) { if (new RegExp(' ' + t + '(ml|g|gr) ').test(hay)) { score += 1; pogodjeni.add(t); } }
        else if (hay.includes(' ' + stems[i])) { score += w === 3 ? 2 : 1; if (w === 3) strongHit++; pogodjeni.add(t); }
        else if (SINONIMI[t] && SINONIMI[t].some(a => hay.includes(' ' + a))) { score += w === 3 ? 2 : 1; if (w === 3) strongHit++; pogodjeni.add(t); }
        else if (w === 3 && t.length >= 3 && hay.includes(t)) score += 1;
      }
      if (strong.length >= 1 && strongHit === 0) score = 0;
      if (score <= 0) continue;
      if (MIRIS_RE.test(path) && !toks.some(t => NE_MIRIS.includes(t))) score += 0.5;
      if (trazenEdp) score += /-eau-de-parfum/.test(slug) ? 1.5 : (/parfum/.test(slug) ? -0.5 : 0);
      if (trazenEdt) score += /-eau-de-toilette/.test(slug) ? 1.5 : (/toilette/.test(slug) ? -0.5 : 0);
      const words = norm(slug).split(' ').filter(Boolean);
      const imaZ = words.some(w => ZENSKE_OZNAKE.has(w)); const imaM = words.some(w => MUSKE_OZNAKE.has(w));
      // oznaka traženog spola i tražena nota u adresi ne računaju se kao višak riječi naziva
      // (riječ koja je i sama u upitu, npr. „boy“ u Bad Boy, ostaje riječ naziva)
      const oznakaUpita = w => !toks.includes(w) && ((traziSpol === 'z' && ZENSKE_OZNAKE.has(w)) || (traziSpol === 'm' && MUSKE_OZNAKE.has(w)) || noteOdgovara(w));
      // riječi naziva (jake) i riječi vrste proizvoda (slabe: parfum, toilette, set, intense…) broje se odvojeno
      const sveRijeci = words.filter(w => !STOP.has(w) && !brendRijeci.has(w) && !/^\d+(ml|g|gr)?$/.test(w) && !oznakaUpita(w));
      const rijeci = sveRijeci.filter(w => !TIP_RIJECI.has(w));
      const slabe = sveRijeci.filter(w => TIP_RIJECI.has(w));
      const pogodjene = rijeci.filter(w => hitSlug(w)).length;
      const visak = rijeci.length - pogodjene;
      const visakSlabih = slabe.filter(w => !hitSlug(w)).length;
      score += 2 * pogodjene / Math.max(1, rijeci.length) - 0.4 * visak - 0.15 * visakSlabih;
      const jakiUpit = toks.filter(t => !STOP.has(t) && !TIP_RIJECI.has(t) && !OPISNE.has(t) && !/^\d+$/.test(t));
      const slabiUpit = toks.filter(t => TIP_RIJECI.has(t));
      // set kad kupac nije tražio set nije „točan naziv“ (inače set istog imena pobjeđuje sam parfem)
      const setBezUpita = slabe.includes('set') && !toks.includes('set') && !toks.includes('setovi');
      const tocno = !setBezUpita && jakiUpit.length > 0 && rijeci.slice().sort().join(' ') === jakiUpit.slice().sort().join(' ') && slabiUpit.every(t => slabe.some(w => w === t || (t.length >= 5 && w.startsWith(t.slice(0, 5)))));
      if (tocno) score += 3;
      if (traziSpol === 'z') score += imaZ ? (spolIzNaziva ? 0 : 1) : (imaM ? -2 : 0);
      if (traziSpol === 'm') score += imaM ? (spolIzNaziva ? 0 : 1) : (imaZ ? -2 : 0);
      if (words.some(noteOdgovara)) score += 1;
      // sve riječi naziva iz upita postoje u adresi proizvoda (višak riječi u nazivu, npr. veličina, ne smeta),
      // broj iz upita (nijansa, model) stoji u adresi i proizvod nije označen za suprotni spol
      // (bez riječi naziva u upitu, npr. samo „brend + set“, nema se što provjeriti: null)
      const spolOk = !traziSpol || !(traziSpol === 'z' ? (imaM && !imaZ) : (imaZ && !imaM));
      const bezNula = x => x.replace(/^0+(?=\d)/, '');
      const brojeviOk = toks.filter(t => /^\d+$/.test(t)).every(t => words.some(w => bezNula(w) === bezNula(t)));
      const pokriva = jakiUpit.length ? (jakiUpit.every(t => pogodjeni.has(t)) && brojeviOk && spolOk) : null;
      if (setBezUpita) score -= 1;
      if (/\/uncategorized\//.test(path)) score -= 1;
      if (kategorija && (kategorija.bezNjege || katVrh) && path.includes('/' + kategorija.segs[kategorija.segs.length - 1] + '/')) score += 0.5;
      if (mapaPutanje && mapaPutanje.has(path)) score += mapaPotpuna ? 0.75 : 0.1;
      if (ograniciNaMapu && !mapaPutanje.has(path) && !tocno) continue;   // nov proizvod (još ni u jednoj mapi) samo uz točan naziv
      rez.push({ url, path, slug, score, visak, len: slug.length, tocno: tocno && brojeviOk && spolOk, pokriva, spolOk, jakiPog: jakiUpit.filter(t => pogodjeni.has(t)).length, jakiN: jakiUpit.length, uSlugu: jakiUpit.length > 0 && jakiUpit.every(t => words.some(w => w === t || (t.length >= 5 && w.startsWith(t.slice(0, -1))) || (SINONIMI[t] && SINONIMI[t].some(a => w === a || (a.length >= 4 && w.startsWith(a)))))), naziv: mapaNazivi[path] || naziv_iz_sluga(slug) });
    }
    rez.sort((a, b) => (b.score - a.score) || (a.visak - b.visak) || (a.len - b.len));
    return rez;
  }

  let brendProvjera = brend || null;
  let ograniceno = mapaPotpuna;
  // brend koji poznato nije u ponudi webshopa (Dior, Hermès…), a nije prepoznat brend s weba: slični proizvodi drugih brendova se ne traže
  const nepoznatBrendRano = !brend ? (NEPOZNATI_BRENDOVI.find(b => spojeno.includes(' ' + b + ' ')) || null) : null;
  let lista = [];
  if (tokeniOstatak.length && nepoznatBrendRano) {
    // proizvod se uzima samo uz točan naziv ili kad pokriva barem 2 riječi naziva (Good Girl, Born in Roma); „Hermès Terre“ ostaje „nije u ponudi“
    const bezNepoznatog = tokeniOstatak.filter(t => !nepoznatBrendRano.split(' ').includes(t));
    const l = bezNepoznatog.length ? rangiraj(bezNepoznatog, false) : [];
    const imaNaziv = bezNepoznatog.some(t => !MUSKE_OZNAKE.has(t) && !ZENSKE_OZNAKE.has(t) && !STOP.has(t) && !PITANJA.has(t) && !/^\d+$/.test(t));
    if (imaNaziv && l.length && (l[0].tocno || (l[0].pokriva === true && l[0].jakiPog >= 2))) { lista = l.filter(r => r.tocno || r.pokriva === true); k.napomena = 'Napomena: kupac je naveo brend „' + nepoznatBrendRano.replace(/(^|\s)\S/g, c => c.toUpperCase()) + '“, koji nije u ponudi webshopa. Pronađen je proizvod istog naziva drugog brenda (brend piše ispod): provjeri s kupcem misli li na njega.'; }
  }
  // brend i uz njega samo vrsta proizvoda (Versace setovi, Shiseido krema za lice, Prada poklon set): popis brenda, ne proizvodi drugih brendova
  const samoVrsta = !!brend && tokeniOstatak.length > 0 && tokeniOstatak.every(t => VRSTA_RIJEC_RE.test(t) || OPCE_NAZIV_RE.test(t) || /^(set|setovi|setove|setova|poklon|pokloni|poklona|paket|paketi|torb|svijec|difuzor|kozmetick|lic[aeiu]?$|kos[aeiu]$|kosu$|tijel|ruk[aeu]$|parfem|miris|toaletn|parfemsk|voda$|vode$)/.test(t));
  const brendVrstaIzlaz = () => popis(brendUrl(brend), { kategorijaNapomena: 'Upit je brend i vrsta proizvoda („' + tokeniOstatak.join(' ') + '“): popis brenda nije filtriran po vrsti; za konkretan proizvod pozovi alat s njegovim nazivom.' });
  // proizvod istog brenda te vrste (Furla toaletna torbica) ima prednost; proizvodi drugih brendova se ne nude
  const proizvodiBrendaVrste = () => {
    const bw = brend.split('-');
    const bezPoklona = tokeniOstatak.filter(t => !/^(poklon|pokloni|poklona|gift)$/.test(t));
    const l = rangiraj(bezPoklona.length ? bezPoklona : tokeniOstatak, false).filter(r => (mapaPutanje && mapaPutanje.has(r.path)) || bw.every(w => r.slug.split('-').includes(w)));
    return (l.length && (l[0].tocno || l[0].pokriva === true)) ? l : null;
  };
  let vrstaLista = null;
  if (samoVrsta && !mapaPotpuna) { vrstaLista = proizvodiBrendaVrste(); if (!vrstaLista) return brendVrstaIzlaz(); }
  if (tokeniOstatak.length && !nepoznatBrendRano) {
    lista = vrstaLista || rangiraj(tokeniOstatak, ograniceno);
    if (!lista.length && ograniceno && samoVrsta) { const l = proizvodiBrendaVrste(); if (l) lista = l; else return brendVrstaIzlaz(); }
    if (!lista.length && ograniceno) { ograniceno = false; lista = rangiraj(tokeniOstatak, false); k.napomena = 'Nijedan proizvod brenda ' + brendNaziv(brend) + ' u mapi brenda ne odgovara nazivu; pretraženi su svi proizvodi i brend se provjerava na stranici.'; }
  }

  // 6b) nijedan proizvod ne sadrži sve riječi upita: tema (i u dugoj rečenici kupca), promo kod ili članak bloga, prije „nije pronađeno“
  const topPokriva = lista.length > 0 && (lista[0].tocno || lista[0].pokriva === true);
  // kategorija i uz nju samo riječi vrste njege (kremu za sunčanje): popis kategorije kad nijedan proizvod ne pokriva upit
  if (!brend && kategorija && !kategorija.bezNjege && tokeniOstatak.length && tokeniOstatak.every(t => NJEGA_RIJECI.test(t)) && !topPokriva) return popis(kategorija.url);
  // brend koji je i tema (Furla) uz mjesto ili riječ poslovnice/kontakta (furla Zagreb, furla adresa, furla subota): stranice teme
  const temaBrenda = brend ? temeHit.find(x => x.tema.id === brend) : null;
  if (temaBrenda && tokeniOstatak.length && !topPokriva && tokeniOstatak.every(t => MJESTO_RE.test(t) || /^(adres|radno|vrijem|subot|nedjelj|praznik|otvoren|zatvoren|telefon|broj|kontakt|mail|butik|trgovin|ducan|lokacij|gdje)/.test(t))) return temaIzlaz(temaBrenda);
  // brend + jasna tema postupka, a nijedan proizvod brenda ne pokriva upit (vratiti YSL ruž ako ne odgovara nijansa, furla butik zagreb)
  if (brend && tokeniOstatak.length && !topPokriva && temaPostupka && tema.jasne.some(t => !STOP.has(t) && !PITANJA.has(t) && !brendTokeni.includes(t))) return temaIzlaz(tema);
  // kategorija prepoznata iz riječi naziva (Collistar Multi Active Deodorant, Juvena roller za lice): kad nijedan proizvod te kategorije
  // ne pokriva naziv, traže se proizvodi i izvan nje (sa svim riječima upita)
  if (kategorija && !kategorija.bezNjege && !katVrh && !nepoznatBrendRano && tokeniOstatak.some(t => !OPCE_NAZIV_RE.test(t) && !VRSTA_RIJEC_RE.test(t)) && !(lista.length && (lista[0].tocno || lista[0].pokriva === true))) {
    const l2 = rangiraj(tokeniBezAkcije, ograniceno, true);
    if (l2.length && (l2[0].tocno || l2[0].pokriva === true) && l2[0].uSlugu) lista = l2;
  }
  // parfemi (vrh kategorije) + naziv proizvoda iz druge kategorije (lip contour kit parfem): bez filtra kategorije kad proizvod pokriva barem 2 riječi naziva
  if (katVrh && !nepoznatBrendRano && tokeniOstatak.length && !(lista.length && (lista[0].tocno || lista[0].pokriva === true))) {
    const l3 = rangiraj(tokeniOstatak, ograniceno, true);
    if (l3.length && (l3[0].tocno || l3[0].pokriva === true) && l3[0].jakiPog >= 2) lista = l3;
  }
  // kategorija + samo opće riječi (mini, travel…) ili vrsta (krema, gel…): popis kategorije, osim kad postoji proizvod točno tog naziva (Styling Gel)
  if (!brend && kategorija && !kategorija.bezNjege && tokeniOstatak.length && tokeniOstatak.every(t => OPCE_NAZIV_RE.test(t) || (!katVrh && VRSTA_RIJEC_RE.test(t))) && !(lista.length && lista[0].tocno) && !rangiraj(tokeniBezAkcije, ograniceno, true).some(r => r.tocno)) return popis(kategorija.url);
  // proizvod je pogođen slabo: nijedan, ili su pogođene manje od 2 riječi naziva ili manje od pola (riječ više, npr. „za poklon“, ne ruši dobar pogodak)
  const slabProizvod = !lista.length || (lista[0].jakiN > 0 && (lista[0].jakiPog < 2 || lista[0].jakiPog < lista[0].jakiN * 0.5));
  if (!brend && tokeniOstatak.length && !topPokriva && slabProizvod && !nepoznatBrendRano) {
    if (trazimPromo) return promoIzlaz();
    // tema s jasnom riječi (ne samo glagol naručiti/kupiti); ili tema samo s općim riječima (narudžba, tretman, paket…)
    // kad nijedna riječ upita nije u nazivu proizvoda i nije samo dvosmislena opća riječ (rok, osoba, broj…)
    const uNazivu = t => t.length >= 4 && proizvodiRows.some(r => slugIz(r[0]).split('-').some(w => w === t || (t.length >= 5 && w.startsWith(t.slice(0, 5)))));
    const bezAN = x => x && x.tema.id !== 'akcija' && x.tema.id !== 'novo';
    const tt = temeHit.find(x => bezAN(x) && smislenaJasna(x))
      || (bezAN(tema) && !kupnjaZaNekog && tema.jakih === 0 && tema.hits.some(h => !NEODLUCNE.test(h) && !MJESTO_RE.test(h)) && !tokeniOstatak.some(uNazivu) ? tema : null);
    if (tt) return temaIzlaz(tt);
    // članak bloga samo kad nijedan proizvod ne sadrži nijednu riječ naziva („love eau de parfum za poklon“ ostaje proizvod)
    const c = (!lista.length || lista[0].jakiPog === 0) ? clanakZa(tokeniBezBrenda, 2) : null;
    if (c) return clanakIzlaz(c);
  }

  // 7) odluka
  if (lista.length) {
    const top = lista[0];
    let odabrani;
    // jasan pobjednik: jedini točan naziv ili velika prednost (bez točnog naziva traži se veća prednost); inače do 3 podjednako dobra
    const prag = top.tocno ? 1.0 : 1.5;
    if (lista.length === 1 || (top.tocno && !(lista[1] && lista[1].tocno)) || top.score - lista[1].score >= prag) odabrani = [top];
    else {
      odabrani = lista.filter(r => r.score >= top.score - (top.tocno ? 0.75 : prag));
      // set istog naziva nije druga mogućnost kad kupac ne traži set, a prvi odabrani nije set (Dylan Blush Pink → samo EDP)
      const jeSet = r => /(^|-)set(-|$)/.test(r.slug);
      if (!jeSet(top) && !tokeniOstatak.includes('set') && !tokeniOstatak.includes('setovi')) odabrani = odabrani.filter(r => !jeSet(r));
      odabrani = odabrani.slice(0, 3);
    }
    // slični: ista glavna kategorija, razumna sličnost; kad je brend poznat, samo proizvodi potvrđeni u mapi brenda
    const kat1 = p => (String(p).split('/')[2] || '');
    const glavneKat = new Set(odabrani.map(r => kat1(r.path)));
    let slicniKand = lista.filter(r => !odabrani.includes(r) && glavneKat.has(kat1(r.path)) && r.score >= Math.max(1, top.score * 0.4));
    if (!tokeniOstatak.includes('set') && !tokeniOstatak.includes('setovi')) slicniKand = slicniKand.filter(r => !/(^|-)set(-|$)/.test(r.slug));
    if (brend) slicniKand = slicniKand.filter(r => mapaPutanje && mapaPutanje.has(r.path));
    const slicni = slicniKand.slice(0, 3).map(r => ({ naziv: r.naziv, url: r.url }));
    const stranice = odabrani.map(r => ({ url: r.url, uloga: 'proizvod', naziv: r.naziv, score: Math.round(r.score * 100) / 100 }));
    const brendImena = brend ? [brend, brendNaziv(brend)].concat(Object.keys(ALIASI).filter(a => ALIASI[a] === brend && a.includes(' '))) : null;
    return izlaz('dohvati', stranice, { tip: odabrani.length > 1 ? 'vise_proizvoda' : 'proizvod', brend, brendNaziv: brend ? brendNaziv(brend) : null, brendProvjera, brendImena, brendOgraniceno: ograniceno, kandidata: lista.filter(r => r.tocno || r.pokriva === true).length || lista.length, slicni, tokeni: tokeniOstatak, zeliOpis, akcijaFilter, odabranTocno: (odabrani.length === 1 && top.pokriva !== null) ? (top.tocno === true || top.pokriva === true) : null, odabranDrugiSpol: odabrani.length === 1 && top.spolOk === false ? (traziSpol === 'z' ? 'ženski' : 'muški') : null });
  }

  const NEMA_INDEKSA = 'Popis adresa martimex.hr trenutno nije dostupan, pa ne mogu provjeriti postoji li to u ponudi. Pokušaj ponovno ili pošalji točan url. Ne tvrdi kupcu da proizvod ne postoji.';
  const indeksNeupotrebljiv = proizvodiRows.length < 100 || brendSlugovi.length < 10 || k.indeksDjelomican === true;
  // nema proizvoda s tim nazivom
  if (brend && tokeniOstatak.length) {
    if (indeksNeupotrebljiv) return odgovori({ ok: false, greska: NEMA_INDEKSA });
    const bliski = (mapaBrenda && Array.isArray(mapaBrenda.proizvodi)) ? mapaBrenda.proizvodi.filter(p => tokeniOstatak.some(t => norm(p[1]).split(' ').some(w => w === t || (t.length >= 4 && w.startsWith(t.slice(0, 4))) || (t.length >= 5 && lev(w, t) <= 1)))).slice(0, 3).map(p => ({ naziv: p[1], url: 'https://martimex.hr' + p[0] })) : [];
    // broj proizvoda brenda navodi se samo kad je mapa brenda potpuna (inače bi broj bio netočan)
    const brojProizvoda = mapaPotpuna ? mapaPutanje.size : null;
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
  if (!k.sitemapiUzivo && !nepoznatBrend && (k.indeksStarostS === null || k.indeksStarostS > OSVJEZI_NAKON_S) && tokeniOstatak.length) return izlaz('sitemapi', sitemapItemi(), { osvjezenoNaPrazno: true });
  if (indeksNeupotrebljiv) return odgovori({ ok: false, greska: NEMA_INDEKSA });

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
  if (!nepoznatBrend) for (const b of bliskiBrendovi) najblize.push('brend ' + brendNaziv(b.s) + ' ' + brendUrl(b.s));
  for (const c of bliskeKategorije) najblize.push('kategorija ' + naziv_iz_sluga(c.slug) + ' ' + c.url);
  if (!nepoznatBrend) for (const p of bliskiProizvodi.slice(0, 3)) najblize.push(p.naziv + ' ' + p.url);
  for (const b of blog) najblize.push('članak ' + naziv_iz_sluga(slugIz(b[0])) + ' ' + b[0]);
  if (najblize.length) redci.push('Najbliže: ' + najblize.join(' · '));
  if (nepoznatBrend) redci.push('Marti: taj brend webshop ne prodaje; ne nudi proizvode drugih brendova kao isti ili sličan proizvod. Možeš pomoći u odabiru mirisa po notama koje kupac voli ili ga uputiti na poslovnice.');
  else redci.push('Marti: ne tvrdi kupcu da proizvod postoji ili ne postoji ako nije na popisu; ponudi najbliže ili pitaj za točan naziv/brend.');
  return odgovori({ ok: true, tip: 'nije_pronadjeno', tekst: redci.join('\n') }, { tip: 'nije_pronadjeno', brend });
} catch (e) {
  return odgovori({ ok: false, greska: 'Interna greška alata pri odabiru stranica (' + String(e && e.message || e).slice(0, 160) + '). Pokušaj ponovno; ako se ponavlja, kupca uputi na poveznicu ili webshop@martimex.hr. Ne navodi cijene ni dostupnost napamet.' }, { internaGreska: String(e && e.stack || e).slice(0, 500) });
}
