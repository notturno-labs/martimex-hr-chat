# Izradi sličice logotipa za trake na pozornici chata (jedan-ekran.js): iz
# slike izvor.webp (bijeli logotipi na crnoj podlozi, 3 stupca × 8 redova)
# svaki logotip se izreže (najmanji okvir oko njega, s malim rubom) i spremi
# kao PNG s prozirnom pozadinom: logotip je bijel, a prozirnost dolazi iz
# svjetline piksela (crno = prozirno), pa se logotipi mogu obojiti i slagati
# na bilo kakvu tamnu podlogu.
#
# Dva izlaza:
#  1. marke/trake/<brend>.png — sličice u punoj veličini (za pregled i druge
#     namjene; chat ih koristi samo ako ugrađenih nema)
#  2. u jedan-ekran.js, između redaka "// ── SLIČICE LOGOTIPA" i "// ── kraj
#     sličica", upiše male sličice (visoke VISINA px, dovoljno za 2× zaslon)
#     kao data: adrese — tako su logotipi u chatu dostupni odmah, bez
#     čekanja na mrežu, pa traka nikad nije prazna
#
#   python3 marke/izradi-trake.py        (iz mape repozitorija; treba Pillow i NumPy)
#
# Logotipi se mijenjaju kao za marke.js: zamijeni izvor.webp, upiši imena u
# SLIKE redom kao na slici (red po red, slijeva nadesno) i pokreni skriptu.
import base64, io, os, re
from PIL import Image
import numpy as np

MAPA = os.path.dirname(os.path.abspath(__file__))
IZVOR = os.path.join(MAPA, 'izvor.webp')
IZLAZ = os.path.join(MAPA, 'trake')
MODUL = os.path.join(os.path.dirname(MAPA), 'jedan-ekran.js')
VISINA = 40              # px: visina ugrađenih sličica (u chatu su visoke 18 px, na 2× zaslonu 36 px)
POCETAK = '    // ── SLIČICE LOGOTIPA'
KRAJ = '    // ── kraj sličica'

# ime datoteke (bez .png), redom kao na slici
SLIKE = [
    'chanel', 'hermes', 'guerlain',
    'giorgio-armani', 'brunello-cucinelli', 'carolina-herrera',
    'chloe', 'dolce-gabbana', 'elie-saab',
    'prada', 'tom-ford', 'valentino',
    'versace', 'yves-saint-laurent', 'van-cleef-arpels',
    'chopard', 'maison-francis-kurkdjian', 'xerjoff',
    'memo-paris', 'penhaligons', 'tiziana-terenzi',
    'the-merchant-of-venice', 'lancome', 'estee-lauder',
]
STUPACA = 3
PRAG = 60                # svjetlina iznad koje je piksel dio logotipa (za okvire)
CRNO, BIJELO = 28, 215   # prozirnost: ispod CRNO potpuno prozirno (šum kompresije), iznad BIJELO puno
RUB = 3                  # prazan rub oko izrezane slike (px)


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
    assert len(stupci) == STUPACA and len(redovi) * STUPACA == len(SLIKE), (redovi, stupci)

    gr = [0] + [(stupci[i][1] + stupci[i + 1][0]) // 2 for i in range(STUPACA - 1)] + [a.shape[1]]
    os.makedirs(IZLAZ, exist_ok=True)
    alfa = np.clip((a - CRNO) / (BIJELO - CRNO), 0, 1)
    ugradjene = []
    k = 0
    for (y0, y1) in redovi:
        for s in range(STUPACA):
            x0, x1 = gr[s], gr[s + 1]
            m = ima[y0:y1, x0:x1]
            ys = np.where(m.any(axis=1))[0]
            xs = np.where(m.any(axis=0))[0]
            X0, Y0 = max(0, x0 + xs[0] - RUB), max(0, y0 + ys[0] - RUB)
            X1, Y1 = min(a.shape[1], x0 + xs[-1] + 1 + RUB), min(a.shape[0], y0 + ys[-1] + 1 + RUB)
            al = (alfa[Y0:Y1, X0:X1] * 255).round().astype(np.uint8)
            slika = np.zeros((al.shape[0], al.shape[1], 4), np.uint8)
            slika[..., :3] = 255
            slika[..., 3] = al
            ime = SLIKE[k]
            puna = Image.fromarray(slika, 'RGBA')
            puna.save(os.path.join(IZLAZ, ime + '.png'), optimize=True)
            # mala sličica za ugradnju: siva + prozirnost, visoka VISINA px
            w = max(1, round(puna.width * VISINA / puna.height))
            mala = puna.resize((w, VISINA), Image.LANCZOS).convert('LA')
            b = io.BytesIO()
            mala.save(b, 'PNG', optimize=True)
            url = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode('ascii')
            ugradjene.append("      '%s': '%s'" % (ime, url))
            print('%-26s %3d x %3d px   (ugrađeno %d x %d, %d B)' % (ime, X1 - X0, Y1 - Y0, w, VISINA, len(b.getvalue())))
            k += 1

    # upiši ugrađene sličice u jedan-ekran.js (između oznaka)
    js = open(MODUL, encoding='utf-8').read()
    if POCETAK not in js or KRAJ not in js:
        print('jedan-ekran.js nema traka s logotipima (nema oznaka): sličice su samo u marke/trake/')
        return
    i = js.index(POCETAK)
    j = js.index(KRAJ)
    i = js.index('\n', i) + 1
    blok = '    const SLICICE = {\n' + ',\n'.join(ugradjene) + '\n    };\n'
    js = js[:i] + blok + js[j:]
    open(MODUL, 'w', encoding='utf-8').write(js)
    print('ugrađeno u jedan-ekran.js: %d sličica, %d KB' % (len(ugradjene), sum(len(u) for u in ugradjene) // 1024))


if __name__ == '__main__':
    main()
