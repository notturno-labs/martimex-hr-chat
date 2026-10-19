#!/usr/bin/env python3
# ═════════════════════════════════════════════════════════════════════
#  MARTIMEX — tekstura BIJELOG mramora sa zlatnim žilama
#
#  Po uzorcima koje je poslao klijent: čista, polirana, neutralno-hladno
#  bijela podloga (nikako krem ni bež) s vrlo blagim sivkastim
#  oblačićima; preko nje meke, tekuće DIMNE sivo-plave žile (prozirne
#  prema rubovima, iznutra slojevite, kao razlivena tinta) i SJAJNE
#  METALNE ZLATNE žile raznih debljina — od tankih niti do širokih
#  zlatnih rukavaca — s metalnim prijelazom (tamnije zlato → zlato →
#  svijetli odsjaj) i mjestimično obrubljene tankom grafitnom linijom.
#  Uz zlato teku tanke usporedne slojnice, a preko cijelog kamena rijetke
#  fine zlatne i sive pukotine.
#
#  Koristi se kao POZADINA CIJELOG RAZGOVORA (uspravni prozor 400 × 800 px
#  na računalu, cijeli ekran mobitela), ispod mliječnog stakla i tamnog
#  teksta. Zato su žile skupljene u pojaseve uz rubove i dijagonale
#  (gore: kroz zaglavlje i prve poruke; dolje: iza polja za poruku;
#  lijevo i desno uz rub), a sredina stupca poruka je mirna.
#
#  Izrađuju se dvije datoteke s istim uzorkom:
#     bijeli-2x.webp   1800 × 3000  (zasloni visoke gustoće, mobiteli)
#     bijeli.webp       900 × 1500  (računalo; nastaje smanjenjem 2x slike,
#                                    pa je ujedno glatko naduzorkovana)
#
#  Mirnije / svjetlije:   --jacina 0.7   --mirna-sredina 1.0   --svjetlina 1.01
#  Bogatije / tamnije:    --jacina 1.25  --zlato 1.2           --svjetlina 0.98
#  Samo sive žile:        --zlato 0
#  Samo zlato, bez dima:  --dim 0
#
#  Pokretanje (iz mape repozitorija):
#     python3 mramor/izradi-bijeli.py                       (obje datoteke)
#     python3 mramor/izradi-bijeli.py --izlaz /tmp/p.png    (brza proba: samo 1x, PNG)
#
#  Treba samo numpy i Pillow. Seed je fiksan, pa je rezultat ponovljiv.
# ═════════════════════════════════════════════════════════════════════

import argparse
import io
import os
import time

import numpy as np
from PIL import Image

# ── POSTAVKE ─────────────────────────────────────────────────────────

SIRINA, VISINA = 900, 1500           # bijeli.webp (uspravno); bijeli-2x.webp je dvostruko veća
SEED = 11                            # isti seed = ista tekstura

JACINA = 1.0                         # sve žile zajedno (0 = čista bijela podloga)
JACINA_DIMA = 1.0                    # sivo-plave dimne žile
JACINA_ZLATA = 1.0                   # zlatne žile i nanosi
JACINA_PUKOTINA = 1.0                # fine zlatne i sive pukotine preko cijelog kamena
JACINA_OBRUBA = 1.0                  # tanki grafitni obrub uz zlato (kao na uzorku 9.jpg)
MIRNA_SREDINA = 0.75                 # 0 = bez smirivanja, 1 = sredina stupca poruka gotovo čista
SJAJ = 1.0                           # blagi odsjaj polirane površine (0 = bez)
SVJETLINA = 1.0                      # množi podlogu (0.98 tamnije, 1.01 svjetlije); žile ostaju iste

# Podloga: čista, neutralno-hladna bijela (bez žute/bež primjese).
BIJELA = '#fcfdfd'
BIJELA_OBLAK = '#f3f5f6'             # vrlo blagi sivkasti oblačići
BIJELA_SJENA = '#e8ebee'             # rijetke dublje sjene u kamenu

# Dim: sivo-plave žile (svijetli rub → tamnija jezgra).
DIM_SVIJETLI = '#c9ced3'
DIM = '#aab2ba'
DIM_TAMNI = '#8e98a3'
SLOJNICA = '#9ea7b0'                 # tanke usporedne crte uz zlato
GRAFIT = '#2f343a'                   # tanke tamne niti uz zlato
RELJEF_SJENA = '#b4bcc4'             # meka sjena slojeva (stepenice tekućeg kamena)

# Metalno zlato: sjena → tamnije zlato → zlato → odsjaj (ton 38–46°, žuto, ne smeđe).
ZLATO_SJENA = '#86601a'
ZLATO_TAMNO = '#a97a22'
ZLATO = '#d4a93c'
ZLATO_ODSJAJ = '#f6dc8c'
ZLATO_ISKRA = '#fff6d8'              # najsvjetlije iskre na zlatu
ZLATO_NANOS = '#e7c565'              # prozirni zlatni nanos (miješa se s bijelom)

# Pojasevi žila (kao tokovi razlivene boje). Svaki je rječnik:
#   x, y      točka kroz koju pojas prolazi (0–1 širine / visine slike)
#   kut       stupnjeva od vodoravnog (plus = spušta se udesno, minus = penje se, ±90 = okomito)
#   savij     zakrivljenost luka (0 = ravno)
#   sirina    polovična širina pojasa, u jedinicama visine slike
#   dim       jačina sivo-plavog dima 0–1;  strana_dima: dim je pomaknut na
#             jednu stranu zlata (u polovičnim širinama pojasa), kao na 7.webp
#   niti      trake koje teku pojasom, usporedno: (vrsta, pomak, sirina, jacina)
#             vrsta:  'zlato'   metalna zlatna traka (sjena → zlato → odsjaj)
#                     'nanos'   prozirni zlatni nanos uz zlato (meko)
#                     'grafit'  tanka tamna nit uz zlato (kao na 9.jpg)
#                     'siva'    tanka sivo-plava nit s mekim dimom
#             pomak i sirina su u polovičnim širinama pojasa (sredina = 0, rub = ±1);
#             debljina se duž toka mijenja (tanko → široki rukavac → prekid)
#   od, do    gdje pojas počinje / završava, duž pojasa (jedinice visine od
#             točke x, y; None = cijelom duljinom)
#   slojevi   (neobavezno) jačina tankih usporednih stepenica u bijelom uz pojas (1 = zadano)
POJASEVI = [
    # gornji: penje se udesno kroz zaglavlje i prve poruke; najbogatije zlato
    dict(x=0.50, y=0.17, kut=-31.0, savij=0.5, sirina=0.090, dim=0.95, strana_dima=-0.55,
         niti=[('zlato', 0.00, 0.130, 1.00), ('zlato', 0.18, 0.022, 0.90),
               ('zlato', -0.15, 0.030, 0.90), ('nanos', 0.32, 0.16, 0.40),
               ('zlato', 0.34, 0.010, 0.80), ('siva', -0.45, 0.022, 0.70),
               ('zlato', 0.58, 0.008, 0.70), ('grafit', -0.62, 0.008, 0.60)],
         od=None, do=None),
    # donji: usporedan s gornjim, penje se udesno iza polja za poruku
    dict(x=0.50, y=0.84, kut=-29.0, savij=-0.5, sirina=0.085, dim=0.90, strana_dima=0.50,
         niti=[('zlato', 0.00, 0.120, 1.00), ('zlato', -0.18, 0.020, 0.85),
               ('zlato', 0.18, 0.034, 0.90), ('nanos', -0.32, 0.15, 0.35),
               ('zlato', -0.36, 0.010, 0.75), ('siva', 0.50, 0.025, 0.70),
               ('grafit', 0.66, 0.008, 0.55)],
         od=None, do=None),
    # lijevi ogranak: odvaja se od gornjeg i spušta uz lijevi rub (tanji, malo dima)
    dict(x=0.10, y=0.48, kut=72.0, savij=-0.4, sirina=0.040, dim=0.45, strana_dima=-0.7,
         niti=[('zlato', 0.05, 0.050, 0.90), ('zlato', 0.30, 0.016, 0.75),
               ('siva', -0.45, 0.030, 0.55)],
         od=-0.30, do=0.22, slojevi=0.3),
    # desni ogranak: spušta se uz desni rub prema donjem pojasu
    dict(x=0.90, y=0.50, kut=-74.0, savij=0.4, sirina=0.040, dim=0.40, strana_dima=0.7,
         niti=[('zlato', -0.08, 0.045, 0.85), ('zlato', 0.20, 0.014, 0.70),
               ('siva', 0.55, 0.030, 0.50)],
         od=-0.24, do=0.30, slojevi=0.3),
    # dimni pramen desno iznad sredine, usporedan s pojasevima (sredina ga stišava)
    dict(x=0.62, y=0.40, kut=-30.0, savij=0.3, sirina=0.050, dim=0.45, strana_dima=0.2,
         niti=[('siva', -0.1, 0.020, 0.45), ('zlato', 0.25, 0.012, 0.55)],
         od=-0.10, do=0.30, slojevi=0.4),
    # tiha tanka žila koso kroz sredinu, poprečno na pojaseve (kao na 9.jpg)
    dict(x=0.34, y=0.56, kut=55.0, savij=0.3, sirina=0.030, dim=0.20, strana_dima=0.0,
         niti=[('zlato', 0.0, 0.030, 0.60), ('siva', 0.6, 0.03, 0.25)],
         od=-0.20, do=0.30, slojevi=0.15),
]


KVALITETA = 90                       # početna webp kvaliteta …
NAJVISE_KB = 88                      # … smanjuje se dok bijeli.webp ne stane u ovo
NAJVISE_KB_2X = 135                  # isto za bijeli-2x.webp (mobiteli: s crni-2x.webp i crni-mali.webp ispod ~300 KB)

MAPA = os.path.dirname(os.path.abspath(__file__))
IZLAZ = os.path.join(MAPA, 'bijeli.webp')
IZLAZ_2X = os.path.join(MAPA, 'bijeli-2x.webp')

BLOK = 1 << 18                       # šum se računa po blokovima piksela (brže)


# ── POMOĆNE FUNKCIJE ─────────────────────────────────────────────────

def boja(hex_boja):
    h = hex_boja.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255.0


def glatko(a, b, x):
    """smoothstep: 0 kod a, 1 kod b, glatko između (radi i za a > b)."""
    t = np.clip((x - a) * np.float32(1.0 / (b - a)), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def pomijesaj(rgb, hex_boja, alfa):
    """Prekrij boju s prozirnošću alfa (0–1), na mjestu (štedi memoriju)."""
    a = np.clip(alfa, 0.0, 1.0)[..., None]
    rgb += (boja(hex_boja) - rgb) * a


def zamuti(polje, polumjer):
    """Brzo zamućenje (3 prolaza kliznog prosjeka ≈ Gaussovo)."""
    r = max(1, int(polumjer))
    izlaz = polje.astype(np.float32)
    for os_ in (0, 1):
        for _ in range(3):
            pad = [(0, 0), (0, 0)]
            pad[os_] = (r + 1, r)
            c = np.cumsum(np.pad(izlaz, pad, mode='reflect'), axis=os_, dtype=np.float64)
            if os_ == 0:
                izlaz = ((c[2 * r + 1:] - c[:-2 * r - 1]) / (2 * r + 1)).astype(np.float32)
            else:
                izlaz = ((c[:, 2 * r + 1:] - c[:, :-2 * r - 1]) / (2 * r + 1)).astype(np.float32)
    return izlaz


def povecaj(polje, sirina, visina):
    """Glatko polje izračunato u maloj rezoluciji → puna rezolucija."""
    return np.array(Image.fromarray(polje.astype(np.float32), "F")
                      .resize((sirina, visina), Image.BICUBIC))


def koordinate(sirina, visina):
    """x, y u jedinicama visine slike (y 0–1 odozgo, x 0–0.6)."""
    yy, xx = np.mgrid[0:visina, 0:sirina].astype(np.float32)
    return (xx + 0.5) / visina, (yy + 0.5) / visina


def nagib(polje):
    """Veličina gradijenta (po pikselu)."""
    gy, gx = np.gradient(polje)
    return np.sqrt(gx * gx + gy * gy) + np.float32(1e-6)


class Sum:
    """Gradijentni (Perlinov) šum u numpyju; ne ovisi o razlučivosti, pa
    1x i 2x slika imaju isti uzorak."""

    def __init__(self, seed):
        rng = np.random.default_rng(seed)
        perm = rng.permutation(256).astype(np.int32)
        self.h = perm[(perm[:, None] + np.arange(256)[None, :]) & 255].ravel().astype(np.int32)
        kut = rng.uniform(0.0, 2.0 * np.pi, 256)
        self.gx = np.cos(kut).astype(np.float32)[self.h]
        self.gy = np.sin(kut).astype(np.float32)[self.h]
        self.pomaci = rng.uniform(-200.0, 200.0, (128, 2)).astype(np.float32)

    def _gradijentni(self, x, y):
        x0 = np.floor(x)
        y0 = np.floor(y)
        fx = x - x0
        fy = y - y0
        ix = (x0.astype(np.int32) & 255) << 8
        iy = y0.astype(np.int32) & 255
        ix1 = (ix + 256) & 0xff00
        iy1 = (iy + 1) & 255
        fx1 = fx - 1.0
        fy1 = fy - 1.0
        n00 = self.gx.take(ix | iy) * fx + self.gy.take(ix | iy) * fy
        n10 = self.gx.take(ix1 | iy) * fx1 + self.gy.take(ix1 | iy) * fy
        n01 = self.gx.take(ix | iy1) * fx + self.gy.take(ix | iy1) * fy1
        n11 = self.gx.take(ix1 | iy1) * fx1 + self.gy.take(ix1 | iy1) * fy1
        u = fx * fx * fx * (fx * (fx * 6.0 - 15.0) + 10.0)
        v = fy * fy * fy * (fy * (fy * 6.0 - 15.0) + 10.0)
        a = n00 + (n10 - n00) * u
        b = n01 + (n11 - n01) * u
        return (a + (b - a) * v) * 1.41

    def gradijentni(self, x, y):
        izlaz = np.empty(np.shape(x), np.float32)
        xf, yf, rav = np.ravel(x), np.ravel(y), izlaz.reshape(-1)
        for i in range(0, xf.size, BLOK):
            rav[i:i + BLOK] = self._gradijentni(xf[i:i + BLOK], yf[i:i + BLOK])
        return izlaz

    def fbm(self, x, y, oktave=4, lak=2.0, poj=0.5, pomak=0):
        """Fraktalni šum (std ≈ 0.45, uglavnom −1 … 1); oktave malo zakrenute."""
        zbroj = np.zeros(np.shape(x), np.float32)
        a, f, norma = 1.0, 1.0, 0.0
        for o in range(oktave):
            px, py = self.pomaci[(pomak * 7 + o) % 128]
            k = 0.5 + o * 0.9 + pomak * 0.37
            c, s = np.float32(np.cos(k) * f), np.float32(np.sin(k) * f)
            zbroj += np.float32(a) * self.gradijentni(x * c - y * s + px, x * s + y * c + py)
            norma += a * a
            a *= poj
            f *= lak
        return zbroj * np.float32(0.45 / (0.30 * np.sqrt(norma)))


# ── IZRADA ───────────────────────────────────────────────────────────

def ton_zlata(t):
    """Metalni prijelaz: t 0 → duboka sjena, 0.35 → tamnije zlato,
    0.65 → zlato, 1 → svijetli odsjaj (linearno između točaka)."""
    tocke = [(0.00, ZLATO_SJENA), (0.35, ZLATO_TAMNO), (0.68, ZLATO), (1.00, ZLATO_ODSJAJ)]
    t = np.clip(t, 0.0, 1.0)
    izlaz = np.empty(t.shape + (3,), np.float32)
    izlaz[:] = boja(tocke[0][1])
    for (a, ca), (b, cb) in zip(tocke, tocke[1:]):
        k = np.clip((t - a) / (b - a), 0.0, 1.0)[..., None]
        m = (t >= a)[..., None]
        izlaz = np.where(m, boja(ca) + (boja(cb) - boja(ca)) * k, izlaz)
    return izlaz


def izradi(jacina=JACINA, dim=JACINA_DIMA, zlato=JACINA_ZLATA, pukotine=JACINA_PUKOTINA,
           obrub=JACINA_OBRUBA, mirna=MIRNA_SREDINA, sjaj=SJAJ, svjetlina=SVJETLINA,
           seed=SEED, mjerilo=2):
    """Vraća sliku u mjerilu `mjerilo` (2 = bijeli-2x.webp; 1x nastaje
    smanjenjem). `jed` = koliko piksela crtanja je jedan piksel slike 1x."""
    t0 = time.time()
    jed = mjerilo
    W, H = SIRINA * jed, VISINA * jed
    s = Sum(seed)
    omjer = SIRINA / VISINA

    def javi(sto):
        print(f'  {sto} … {time.time() - t0:.1f} s')

    def gore(p):
        return povecaj(p, W, H)

    # ── 1. glatka polja u pola veličine 1x slike (brzo), pa uvećana ──
    gw, gh = SIRINA // 2, VISINA // 2
    x, y = koordinate(gw, gh)
    # iskrivljenje domene: sve teče, nijedna crta nije ravna
    wx = 0.030 * s.fbm(x * 1.6, y * 1.6, 4, pomak=1) + 0.008 * s.fbm(x * 6.0, y * 6.0, 3, pomak=2)
    wy = 0.030 * s.fbm(x * 1.6 + 4.1, y * 1.6 + 2.3, 4, pomak=3) + 0.008 * s.fbm(x * 6.0 + 1.7, y * 6.0, 3, pomak=4)
    xw, yw = x + wx, y + wy

    # mirna sredina stupca poruka (eliptična maska; 1 = sredina, 0 = rubovi)
    sx = (x / omjer - 0.5) / 0.33
    sy = (y - 0.52) / 0.25
    sredina = np.exp(-(sx * sx + sy * sy) ** 1.5).astype(np.float32)
    oblak = 0.5 + 0.5 * s.fbm(xw * 2.2, yw * 2.2, 5, pomak=5)
    oblak2 = 0.5 + 0.5 * s.fbm(xw * 5.0 + 3.0, yw * 5.0, 4, pomak=6)
    javi('glatka polja')

    # ── 2. podloga: čista hladna bijela s blagim oblačićima ──
    rgb = np.empty((H, W, 3), np.float32)
    rgb[:] = boja(BIJELA)
    pomijesaj(rgb, BIJELA_OBLAK, gore(glatko(0.35, 0.85, oblak) * 0.8 + 0.25 * glatko(0.45, 0.9, oblak2)))
    pomijesaj(rgb, BIJELA_SJENA, gore(glatko(0.62, 0.95, oblak) * glatko(0.4, 0.9, oblak2) * 0.5))
    rgb *= np.float32(svjetlina)
    smiri_m = 1.0 - np.float32(mirna) * sredina               # množi žile u sredini
    smiri = gore(smiri_m)
    smiri_zl = gore(1.0 - np.float32(mirna) * 0.45 * sredina)   # zlato se smiruje manje
    del oblak, oblak2

    # zajednički spremnici (puna razlučivost)
    nula = lambda: np.zeros((H, W), np.float32)
    dim_gust = nula()      # gustoća dima 0–1
    zl_pokrov = nula()     # pokrivenost metalnim zlatom
    zl_ton = nula()        # ton zlata 0–1 (sjena … odsjaj)
    nanos = nula()         # prozirni zlatni nanos
    grafit = nula()        # tamne niti / obrub
    siva = nula()          # sivo-plave niti
    sjena = nula()         # meka sjena reljefa (slojevi tekućeg kamena)
    svjetlo = nula()       # bijeli odsjaj reljefa

    # ── 3. pojasevi ──
    for i, P in enumerate(POJASEVI):
        k = np.radians(P['kut'])
        c, sn = np.float32(np.cos(k)), np.float32(np.sin(k))
        dx, dy = xw - np.float32(P['x'] * omjer), yw - np.float32(P['y'])
        u = dx * c + dy * sn                      # duž pojasa
        v = -dx * sn + dy * c                     # poprijeko
        v = v - np.float32(P['savij']) * u * u    # luk
        sir = np.float32(P['sirina'])
        # pojas vijuga (sporo duž toka) i mijenja širinu
        v = v + 0.45 * sir * s.fbm(u * 2.4, v * 1.0 + i * 3.1, 3, pomak=10 + i)
        sir_lok = sir * (0.75 + 0.5 * glatko(-0.5, 0.5, s.fbm(u * 2.0 + i * 7.0, v * 0.5, 2, pomak=20 + i)))
        q = v / sir_lok
        # tekuće iskrivljenje unutar pojasa: trake se primiču, razmiču i vijugaju
        q = q + 0.22 * s.fbm(u * 6.0, q * 0.8 + i * 1.3, 3, pomak=30 + i) \
              + 0.07 * s.fbm(u * 16.0, q * 2.0, 3, pomak=40 + i)
        # gdje pojas počinje / završava, i mjestimično slabi duž duljine
        duz = 0.6 + 0.4 * glatko(-0.45, 0.2, s.fbm(u * 2.6 + i * 5.0, q * 0.2, 3, pomak=50 + i))
        if P['od'] is not None:
            duz = duz * glatko(P['od'] - 0.08, P['od'] + 0.08, u) * glatko(P['do'] + 0.08, P['do'] - 0.08, u)

        # polja niti u maloj razlučivosti (debljina duž toka, prekidi)
        niti_m = []
        for j, (vrsta, pom, sirina, jak) in enumerate(P['niti']):
            pz = 100 + i * 20 + j
            nabor = glatko(-0.6, 0.6, s.fbm(u * 5.0 + j * 3.3, q * 0.3, 3, pomak=pz))
            if vrsta == 'zlato':
                deb = 0.35 + 0.45 * nabor + 0.9 * nabor ** 3   # tanka nit … široki rukavac
            else:
                deb = 0.35 + 1.0 * nabor
            prekid = glatko(-0.58, -0.30, s.fbm(u * 3.0 + j * 9.0, q * 0.25, 2, pomak=pz + 1))
            sjaj_duz = s.fbm(u * 9.0, q * 0.5 + j, 2, pomak=pz + 2)   # odsjaj se mijenja duž trake
            niti_m.append((deb * prekid * duz, sjaj_duz))

        U, Q, DUZ = gore(u), gore(q), gore(duz)
        del u, v, q, dx, dy, sir_lok, duz

        # dim: više s jedne strane, iznutra pramenast, izdužen duž toka
        # (u punoj razlučivosti: tamne pruge su oštrije od male mreže)
        qd = Q - np.float32(P['strana_dima'])
        prof = np.exp(-(qd / 0.95) ** 2) * 0.8 + 0.2 * np.exp(-(qd / 1.9) ** 2)
        pramen = s.fbm(U * 4.0 + 0.5 * s.fbm(U * 2.0, Q * 1.2, 2, pomak=70 + i), Q * 2.4, 5,
                       poj=0.55, pomak=72 + i)
        tinta = (1.0 - np.abs(s.fbm(U * 2.0, Q * 5.0, 4, pomak=74 + i))) ** 6   # tamnije pruge
        gust = prof * (0.25 + 0.75 * glatko(-0.45, 0.6, pramen)) + 0.30 * prof * tinta
        np.maximum(dim_gust, gust * DUZ * np.float32(P['dim']), out=dim_gust)
        del qd, prof, pramen, tinta, gust, DUZ

        # sitno iskrivljenje u punoj razlučivosti (živ rub)
        Q += 0.012 * s.fbm(U * 70.0, Q * 4.0, 2, pomak=90 + i)
        gq = nagib(Q)                                       # Q po pikselu
        hrapav = s.fbm(U * 110.0, Q * 10.0, 3, pomak=95 + i)          # razlomljen rub
        mrvice = np.abs(s.fbm(U * 320.0, Q * 30.0, 2, pomak=96 + i))  # sitne mrvice folije

        for j, ((vrsta, pom, sirina, jak), (deb_m, sjaj_m)) in enumerate(zip(P['niti'], niti_m)):
            pz = 100 + i * 20 + j
            w = np.float32(sirina) * gore(deb_m)            # polovična širina (jedinice Q)
            e = Q - np.float32(pom)
            r = e / np.maximum(w, 1e-4)                     # −1 … 1 preko trake
            w_px = w / gq                                   # polovična širina u px
            if vrsta == 'zlato':
                # rub: s jedne strane gladak, s druge razlomljen (kao na 7.webp)
                strana = np.float32(1.0 if j % 2 == 0 else -1.0)
                hrap = np.where(e * strana > 0, 0.22, 0.06).astype(np.float32)
                d_px = (np.abs(e) - w) / gq + w_px * hrap * hrapav - 0.5 * jed * mrvice
                pokrov = glatko(0.7, -0.7, d_px) * glatko(0.15 * jed, 0.6 * jed, w_px) * np.float32(jak)
                # metalni ton: preko trake kupola, pomaknut odsjaj (svjetlo gore
                # lijevo), uzdužne pruge (tekuće zlato) i sitna folija
                kupola = 1.0 - r * r
                sj_duz = gore(sjaj_m)
                pruge = s.fbm(r * 1.5 + 0.25 * sj_duz, U * 2.5, 2, pomak=pz + 3)
                odsjaj = np.exp(-((r + 0.30) / 0.26) ** 2) * (0.45 + 0.55 * glatko(-0.4, 0.4, sj_duz))
                ton = 0.26 + 0.38 * kupola + 0.66 * odsjaj + 0.22 * pruge - 0.10 * mrvice
                # tanke niti nemaju mjesta za sjenu: srednji ton
                tanko = glatko(1.6 * jed, 0.6 * jed, w_px)
                ton = ton * (1 - tanko) + (0.66 + 0.15 * pruge) * tanko
                bolje = pokrov > zl_pokrov
                zl_ton[bolje] = ton[bolje]
                np.maximum(zl_pokrov, pokrov, out=zl_pokrov)
                # reljef: meka sjena ispod trake (dolje desno), odsjaj iznad
                vani = (np.abs(e) - w) / gq
                rel = glatko(-0.5, 0.8, vani) * np.exp(-(vani / (2.2 * jed)) ** 2) \
                    * glatko(0.4 * jed, 2.0 * jed, w_px) * np.float32(jak)
                np.maximum(sjena, rel * (e * strana > 0) * 0.9, out=sjena)
                np.maximum(svjetlo, rel * (e * strana < 0), out=svjetlo)
                # tanki grafitni obrub na glatkoj strani, isprekidan (kao na 9.jpg)
                ima_ob = glatko(-0.10, 0.20, s.fbm(U * 3.5 + j * 2.0, Q * 0.3, 2, pomak=pz + 4))
                sir_ob = (0.6 + 0.9 * glatko(-0.2, 0.6, s.fbm(U * 30.0, Q * 2.0, 2, pomak=pz + 5))) * jed
                ob = glatko(0.0, 0.5 * jed, vani) * glatko(sir_ob + 0.9 * jed, sir_ob, vani)
                ob = ob * (e * strana < 0) * ima_ob * glatko(0.6 * jed, 2.0 * jed, w_px) * np.float32(jak)
                np.maximum(grafit, ob * glatko(0.03, 0.2, mrvice + 0.1), out=grafit)
                del ima_ob, sir_ob, ob, sj_duz
                del hrap, d_px, pokrov, kupola, pruge, odsjaj, ton, tanko, bolje, vani, rel
            elif vrsta == 'nanos':
                n_ = glatko(1.0, 0.1, np.abs(r)) * (0.55 + 0.45 * glatko(-0.4, 0.5, hrapav))
                np.maximum(nanos, n_ * np.float32(jak), out=nanos)
                del n_
            elif vrsta == 'grafit':
                d_px = (np.abs(e) - w) / gq + 0.6 * jed * hrapav
                # tanka tamna nit, mjestimično zrnata (sitne crne točkice kao na 9.jpg)
                zrnato = glatko(0.05, 0.25, mrvice + 0.12)
                g = glatko(0.6, -0.6, d_px) * glatko(0.2 * jed, 0.7 * jed, w_px) * zrnato
                np.maximum(grafit, g * np.float32(jak), out=grafit)
                del d_px, zrnato, g
            else:  # siva
                d_px = (np.abs(e) - w) / gq + 0.5 * jed * hrapav
                g = glatko(0.8, -0.8, d_px) * 0.75 + 0.35 * np.exp(-(np.maximum(d_px, 0) / (6.0 * jed)) ** 2)
                np.maximum(siva, g * glatko(0.2 * jed, 0.8 * jed, w_px) * np.float32(jak), out=siva)
                del d_px, g
            del w, e, r, w_px

        # slojevi tekućeg kamena: tanke usporedne stepenice u bijelom
        # (siva crta sjene + bijela crta odsjaja), uz niti pojasa
        RAZMAK = np.float32(0.16)
        faza = Q / RAZMAK + 0.5 * s.fbm(U * 4.0, Q * 0.6, 2, pomak=97 + i)
        dl = np.abs(faza - np.round(faza)) * RAZMAK / gq
        ima = glatko(-0.15, 0.35, s.fbm(U * 6.0, faza * 0.35, 2, pomak=98 + i)) \
            * np.exp(-(Q / 1.2) ** 2)
        ima = ima * np.float32(P.get('slojevi', 1.0))
        crta = np.exp(-(dl / (0.55 * jed)) ** 2) * ima
        np.maximum(sjena, crta * 0.55, out=sjena)
        dl2 = np.abs(dl - 1.4 * jed)
        np.maximum(svjetlo, np.exp(-(dl2 / (0.6 * jed)) ** 2) * ima * 0.8, out=svjetlo)
        del U, Q, gq, hrapav, mrvice, faza, dl, dl2, ima, crta, niti_m
        javi(f'pojas {i + 1}/{len(POJASEVI)}')
    del x, y

    # ── 4. fine pukotine preko cijelog kamena (zlatne i sive) ──
    # zlatne su jače uz zlatne žile (kao da se zlato razlilo u pukotine)
    k4 = 4 * jed
    blizu = povecaj(glatko(0.0, 0.12, zamuti(zl_pokrov[::k4, ::k4], 10)), W, H)
    XW, YW = gore(xw), gore(yw)
    puk_zl = nula()
    puk_siva = nula()
    for k_, (kut, gus, pz) in enumerate(((58.0, 3.2, 200), (-35.0, 2.6, 210), (80.0, 2.0, 220))):
        a = np.radians(kut)
        pu = XW * np.float32(np.cos(a)) + YW * np.float32(np.sin(a))
        pv = -XW * np.float32(np.sin(a)) + YW * np.float32(np.cos(a))
        f = s.fbm(pu * gus * 0.6, pv * gus * 2.2, 3, poj=0.45, pomak=pz)
        f = f + 0.05 * np.abs(s.fbm(pu * 40.0, pv * 40.0, 2, pomak=pz + 1))   # sitni lomovi
        d = np.abs(f) / nagib(f)
        deb = jed * (0.30 + 0.45 * glatko(-0.3, 0.6, s.fbm(pu * 20.0, pv * 20.0, 2, pomak=pz + 2)))
        crta = glatko(deb + 0.7, deb - 0.5, d)
        ima = glatko(0.12, 0.45, s.fbm(pu * 3.5 + k_, pv * 3.5, 3, pomak=pz + 3))
        zlatna = glatko(-0.1, 0.25, s.fbm(pu * 2.0, pv * 2.0, 2, pomak=pz + 4))
        np.maximum(puk_zl, crta * ima * zlatna * (0.35 + 0.65 * blizu), out=puk_zl)
        np.maximum(puk_siva, crta * ima * (1.0 - zlatna), out=puk_siva)
        del pu, pv, f, d, deb, crta, ima, zlatna
    del XW, YW, blizu
    javi('pukotine')

    # ── 5. slaganje: reljef → dim → sive niti → pukotine → nanos → grafit → zlato ──
    z = np.float32(jacina)
    zl = np.float32(zlato)
    # blagi reljef tekućeg kamena (i oko dima: meko izbočenje)
    pomijesaj(rgb, RELJEF_SJENA, np.clip(sjena, 0, 1) * smiri * z * 0.45)
    pomijesaj(rgb, '#ffffff', np.clip(svjetlo, 0, 1) * z * 0.85)
    del sjena, svjetlo
    dg = np.clip(dim_gust * smiri * z * np.float32(dim), 0, 1.2)
    pomijesaj(rgb, DIM_SVIJETLI, glatko(0.03, 0.50, dg) * 0.70)
    pomijesaj(rgb, DIM, glatko(0.35, 0.90, dg) * 0.62)
    pomijesaj(rgb, DIM_TAMNI, glatko(0.72, 1.15, dg) * 0.58)
    del dim_gust, dg
    pomijesaj(rgb, DIM_TAMNI, np.clip(siva, 0, 1) * smiri_zl * z * np.float32(dim) * 0.70)
    pomijesaj(rgb, DIM_TAMNI, puk_siva * smiri * z * np.float32(pukotine) * 0.30)
    del siva, puk_siva
    pomijesaj(rgb, ZLATO_NANOS, nanos * smiri_zl * z * zl * 0.30)
    pomijesaj(rgb, ZLATO, puk_zl * smiri * z * zl * np.float32(pukotine) * 0.70)
    pomijesaj(rgb, GRAFIT, np.clip(grafit, 0, 1) * smiri_zl * z * np.float32(obrub) * 0.90)
    del nanos, puk_zl, grafit
    zl_rgb = ton_zlata(zl_ton)
    alfa = np.clip(zl_pokrov * smiri_zl * z * zl, 0, 1)
    rgb += (zl_rgb - rgb) * alfa[..., None]
    # iskre: najsvjetlija mjesta zlata još malo zasjaje
    iskra = glatko(0.92, 1.15, zl_ton) * alfa
    pomijesaj(rgb, ZLATO_ISKRA, iskra * 0.6)
    del zl_rgb, alfa, zl_pokrov, zl_ton, iskra
    javi('slaganje')

    # ── 6. blagi odsjaj polirane površine (široki, mekani, koso) ──
    if sjaj > 0:
        X, Y = koordinate(W, H)
        d = X * 0.55 + Y * 0.85
        o = np.exp(-((d - 0.42) / 0.16) ** 2) * 0.010 + np.exp(-((d - 1.05) / 0.08) ** 2) * 0.007
        rgb += (o * np.float32(sjaj))[..., None] * np.array([0.97, 0.99, 1.0], np.float32)
        del X, Y, d, o

    # sitno zrno (protiv pruga u glatkim prijelazima nakon kompresije)
    zrno = np.random.default_rng(seed + 1).normal(0, 0.0020, (H, W)).astype(np.float32)
    rgb = np.clip(rgb + zrno[..., None], 0, 1)
    javi('gotovo')
    return Image.fromarray((rgb * 255 + 0.5).astype(np.uint8), 'RGB')

def smanji(slika, sirina, visina):
    """Smanjenje prosjekom (glatko, bez prstenova)."""
    return slika.resize((sirina, visina), Image.BOX if slika.width % sirina == 0 else Image.LANCZOS)


def spremi(slika, put, kvaliteta=KVALITETA, najvise_kb=NAJVISE_KB):
    if not put.lower().endswith('.webp'):
        slika.save(put)
        print(f'Spremljeno: {put}  ({slika.width} × {slika.height} px)')
        return
    q = kvaliteta
    while True:
        spremnik = io.BytesIO()
        slika.save(spremnik, 'WEBP', quality=q, method=6)
        kb = spremnik.tell() / 1024
        if kb <= najvise_kb or q <= 30:
            break
        q -= 2
    with open(put, 'wb') as f:
        f.write(spremnik.getvalue())
    print(f'Spremljeno: {put}  ({slika.width} × {slika.height} px, {kb:.1f} KB, webp kvaliteta {q})')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Tekstura bijelog mramora sa zlatnim i dimnim žilama.')
    p.add_argument('--jacina', type=float, default=JACINA, help='sve žile zajedno (1 = zadano)')
    p.add_argument('--dim', type=float, default=JACINA_DIMA, help='sivo-plavi dim (0 = bez)')
    p.add_argument('--zlato', type=float, default=JACINA_ZLATA, help='zlatne žile (0 = bez)')
    p.add_argument('--pukotine', type=float, default=JACINA_PUKOTINA, help='fine pukotine')
    p.add_argument('--obrub', type=float, default=JACINA_OBRUBA, help='grafitni obrub uz zlato')
    p.add_argument('--mirna-sredina', type=float, default=MIRNA_SREDINA, help='0–1, smiruje sredinu')
    p.add_argument('--sjaj', type=float, default=SJAJ, help='odsjaj polirane površine')
    p.add_argument('--svjetlina', type=float, default=SVJETLINA, help='svjetlina podloge')
    p.add_argument('--seed', type=int, default=SEED)
    p.add_argument('--kvaliteta', type=int, default=KVALITETA)
    p.add_argument('--izlaz', default='', help='brza proba: samo 1x (crta se u 1x, bez naduzorkovanja)')
    a = p.parse_args()
    arg = dict(jacina=a.jacina, dim=a.dim, zlato=a.zlato, pukotine=a.pukotine, obrub=a.obrub,
               mirna=a.mirna_sredina, sjaj=a.sjaj, svjetlina=a.svjetlina, seed=a.seed)
    if a.izlaz:
        spremi(izradi(mjerilo=1, **arg), a.izlaz, a.kvaliteta)
    else:
        velika = izradi(mjerilo=2, **arg)
        spremi(velika, IZLAZ_2X, a.kvaliteta, NAJVISE_KB_2X)
        spremi(smanji(velika, SIRINA, VISINA), IZLAZ, a.kvaliteta, NAJVISE_KB)
