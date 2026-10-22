# Izradi zasebne sličice logotipa za trake na pozornici chata (jedan-ekran.js):
# iz slike izvor.webp (bijeli logotipi na crnoj podlozi, 3 stupca × 8 redova)
# svaki logotip se izreže (najmanji okvir oko njega, s malim rubom) i spremi
# kao PNG s prozirnom pozadinom: logotip je bijel, a prozirnost dolazi iz
# svjetline piksela (crno = prozirno), pa se logotipi mogu obojiti i slagati
# na bilo kakvu tamnu podlogu. Sličice idu u mapu marke/trake/, nazvane po
# brendu (vidi SLIKE), kako ih navodi postavka "marke" u jedan-ekran.js.
#
#   python3 marke/izradi-trake.py        (iz mape repozitorija; treba Pillow i NumPy)
#
# Logotipi se mijenjaju kao za marke.js: zamijeni izvor.webp, upiši imena u
# SLIKE redom kao na slici (red po red, slijeva nadesno) i pokreni skriptu.
import os
from PIL import Image
import numpy as np

MAPA = os.path.dirname(os.path.abspath(__file__))
IZVOR = os.path.join(MAPA, 'izvor.webp')
IZLAZ = os.path.join(MAPA, 'trake')

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
            Image.fromarray(slika, 'RGBA').save(os.path.join(IZLAZ, ime + '.png'), optimize=True)
            print('%-26s %3d x %3d px' % (ime, X1 - X0, Y1 - Y0))
            k += 1


if __name__ == '__main__':
    main()
