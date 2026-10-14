# Izradi ../marke.js (window.MX_MARKE_STVARNO) za pokus "stvarno" iz slike s
# logotipima (marke-izvor.webp, 4 stupca × 6 redova, bijelo na crnom). Isti
# postupak kao marke/izradi.py (taj ostaje za pravu animaciju): svaki logotip
# se izreže, slika se očisti od šuma i spremi kao siva PNG slika sa 16 razina.
#
#   python3 izradi-marke.py              (iz ove mape)
#
# Imena logotipa (IMENA) idu redom kao na slici, red po red slijeva nadesno.
import base64, io, json, os
from PIL import Image
import numpy as np

MAPA = os.path.dirname(os.path.abspath(__file__))
IZVOR = os.path.join(MAPA, 'marke-izvor.webp')
IZLAZ = os.path.join(MAPA, '..', 'marke.js')

IMENA = [
    'Chanel', 'Hermès', 'Guerlain', 'Giorgio Armani',
    'Brunello Cucinelli', 'Carolina Herrera', 'Chloé', 'Dolce & Gabbana',
    'Elie Saab', 'Prada', 'Tom Ford', 'Valentino',
    'Versace', 'Yves Saint Laurent', 'Van Cleef & Arpels', 'Chopard',
    'Maison Francis Kurkdjian', 'Xerjoff', 'Memo Paris', "Penhaligon's",
    'Tiziana Terenzi', 'The Merchant of Venice', 'Lancôme', 'Estée Lauder',
]
STUPACA = 4
PRAG = 60            # svjetlina iznad koje je piksel dio logotipa (za okvire)
CRNO, BIJELO = 40, 230   # čišćenje: ispod CRNO je crno (šum), iznad BIJELO bijelo
RAZINA = 16          # razina sive u spremljenoj slici
RUB = 2              # prazan rub oko izrezane slike (px)


def nizovi(maska, razmak):
    """Rasponi [od, do) gdje je maska True; rupe uže od razmak se spoje."""
    r = []
    for i, v in enumerate(maska):
        if v and (not r or i - r[-1][1] > razmak):
            r.append([i, i + 1])
        elif v:
            r[-1][1] = i + 1
    return r


def main():
    a = np.asarray(Image.open(IZVOR).convert('L')).astype(np.float32)
    ima = a > PRAG
    redovi = nizovi(ima.any(axis=1), 40)            # natpisi ispod znaka (PARIS, EST. 1870) idu uz svoj red
    stupci = nizovi(ima.any(axis=0), 10)
    assert len(stupci) == STUPACA and len(redovi) * STUPACA == len(IMENA), (redovi, stupci)

    # granice stupaca: na pola puta između stupaca
    gr = [0] + [(stupci[i][1] + stupci[i + 1][0]) // 2 for i in range(STUPACA - 1)] + [a.shape[1]]
    okviri = []
    for r, (y0, y1) in enumerate(redovi):
        for s in range(STUPACA):
            x0, x1 = gr[s], gr[s + 1]
            m = ima[y0:y1, x0:x1]
            ys = np.where(m.any(axis=1))[0]
            xs = np.where(m.any(axis=0))[0]
            okviri.append([x0 + xs[0], y0 + ys[0], x0 + xs[-1] + 1, y0 + ys[-1] + 1])

    # izrez: cijelo područje logotipa s malim rubom
    X0 = min(o[0] for o in okviri) - RUB
    Y0 = min(o[1] for o in okviri) - RUB
    X1 = max(o[2] for o in okviri) + RUB
    Y1 = max(o[3] for o in okviri) + RUB
    v = np.clip((a[Y0:Y1, X0:X1] - CRNO) / (BIJELO - CRNO), 0, 1)
    q = np.round(v * (RAZINA - 1)).astype(np.uint8)
    slika = Image.fromarray(q, 'P')
    slika.putpalette(sum([[round(i * 255 / (RAZINA - 1))] * 3 for i in range(RAZINA)], []))
    b = io.BytesIO()
    slika.save(b, 'PNG', optimize=True, bits=4)
    url = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode('ascii')

    logotipi = []
    for i, o in enumerate(okviri):
        logotipi.append([IMENA[i], i // STUPACA, i % STUPACA, int(o[0] - X0), int(o[1] - Y0), int(o[2] - o[0]), int(o[3] - o[1])])

    with open(IZLAZ, 'w', encoding='utf-8') as f:
        f.write('// Logotipi parfemskih kuća za pokus pokusi/stvarno/ (4 stupca × 6 redova, svi u jednom kadru).\n')
        f.write('// Izrađeno skriptom pokusi/stvarno/izvor/izradi-marke.py iz marke-izvor.webp — ne mijenjati ručno.\n')
        f.write('// slika: siva PNG slika (bijeli logotipi na crnom), %d × %d px\n' % (X1 - X0, Y1 - Y0))
        f.write('// logotipi: [ime, red, stupac, x, y, širina, visina] (px u slici; redom kao na slici)\n')
        f.write('window.MX_MARKE_STVARNO = {\n')
        f.write('  sirina: %d,\n  visina: %d,\n  stupaca: %d,\n' % (X1 - X0, Y1 - Y0, STUPACA))
        f.write('  logotipi: [\n')
        for i, l in enumerate(logotipi):
            f.write('    ' + json.dumps(l, ensure_ascii=False) + (',' if i < len(logotipi) - 1 else '') + '\n')
        f.write('  ],\n')
        f.write("  slika: '" + url + "'\n")
        f.write('};\n')
    print('stvarno/marke.js: %d logotipa, slika %d × %d px, %d B' % (len(logotipi), X1 - X0, Y1 - Y0, os.path.getsize(IZLAZ)))


if __name__ == '__main__':
    main()
