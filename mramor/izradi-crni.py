#!/usr/bin/env python3
# ═════════════════════════════════════════════════════════════════════
#  MARTIMEX — tekstura crnog Portoro mramora sa zlatnim žilama
#
#  Po uzoru na pult Martimex poslovnice: duboka, malo hladnija crna
#  podloga s blagim oblačastim dubinama i slojevima, a preko nje
#  karakteristične Portoro žile zlatno-narančaste i jantarne boje:
#  razgranate, ispucale mreže (uglate, kao pukotine ispunjene zlatom)
#  koje se skupljaju u vodoravno-kose pojaseve; u srcu pojasa izdužene,
#  koso poredane zlatne ljuskice s vlaknastim nijansama, uz pojaseve
#  sivkasta koprena, a preko svega rijetke, slabe sivo-bijele žilice.
#
#  Koristi se kao pozadina prozora chata (background-size: cover),
#  ispod stakla i teksta — zato žile nisu preguste. Glavni pojasevi su
#  na oko 30 % i 71 % visine, sredina je mirnija.
#
#  Tamnije / mirnije:  --svjetlina 0.8  (podloga)   --jacina 0.7 --gustoca 0.7  (zlato)
#  Svjetlije / bogatije: --svjetlina 1.2              --jacina 1.2 --gustoca 1.3
#
#  Pokretanje (iz mape repozitorija):
#     python3 mramor/izradi-crni.py
#     python3 mramor/izradi-crni.py --jacina 0.8 --gustoca 0.9
#     python3 mramor/izradi-crni.py --naduzorkovanje 1 --izlaz /tmp/proba.webp   (brza proba)
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

SIRINA, VISINA = 1000, 1600          # izlazna veličina (uspravno)
NADUZORKOVANJE = 2                   # crta se 2× veće pa smanji (glatke žile)
SEED = 7                             # isti seed = ista tekstura

JACINA_ZILA = 1.0                    # 0 = bez zlatnih žila, 1 = kao na pultu, >1 jače
GUSTOCA_ZILA = 1.0                   # koliko je mreže zlatno (0.5 = upola rjeđe)
JACINA_BIJELIH = 1.0                 # sivo-bijele žilice (0 = bez njih)
SJAJ = 1.0                           # blagi odsjaj poliranog kamena (0 = bez)
SVJETLINA_PODLOGE = 1.0              # <1 tamnija crna, >1 svjetlija (žile ostaju iste)

# Podloga: od najdublje crne do najsvjetlijih oblaka (malo hladnija crna).
CRNA_DUBOKA = '#0b0b0d'
CRNA_OBLAK = '#1a191c'
SIVI_SLOJ = '#29282c'                # slojeviti sivkasti oblaci uz pojaseve žila
TOPLI_ODSJAJ = '#2a2019'             # tihi topli sjaj oko gustih zlatnih žila

# Zlatne žile: tamnije jantarno → zlatno → svjetla jezgra debljih žila.
ZLATO_TAMNO = '#a8743a'
ZLATO = '#c8924e'
ZLATO_SVIJETLO = '#e2b56e'

BIJELA_ZILA = '#8e8b87'              # rijetke tanke sivo-bijele žile

# Pojasevi žila: (sredina 0–1 odozgo, polovična debljina 0–1, jačina 0–1).
# Glavni pojas je u gornjoj trećini, drugi u donjoj, ostali su slabi.
POJASEVI = [
    (0.08, 0.026, 0.35),
    (0.30, 0.055, 1.00),
    (0.50, 0.022, 0.30),
    (0.71, 0.048, 0.85),
    (0.92, 0.030, 0.45),
]
KUT_POJASEVA = -8.0                  # stupnjeva; minus = pojasevi se blago spuštaju udesno
KUT_BIJELIH = 38.0                   # bijele žilice idu koso preko pojaseva

KVALITETA = 92                       # početna webp kvaliteta …
NAJVISE_KB = 170                     # … smanjuje se dok datoteka ne stane u ovo

IZLAZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'crni.webp')

BLOK = 1 << 18                       # šum se računa po blokovima piksela (brže)


# ── POMOĆNE FUNKCIJE ─────────────────────────────────────────────────

def boja(hex_boja):
    h = hex_boja.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255.0


def glatko(a, b, x):
    """smoothstep: 0 kod a, 1 kod b, glatko između (radi i za a > b)."""
    t = np.clip((x - a) * np.float32(1.0 / (b - a)), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def pomijesaj(a, b, t):
    return a + (b - a) * t[..., None]


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
    return np.asarray(Image.fromarray(polje.astype(np.float32), 'F')
                      .resize((sirina, visina), Image.BICUBIC))


def koordinate(sirina, visina):
    """x, y u jedinicama visine slike (y 0–1 odozgo, x 0–0.625)."""
    yy, xx = np.mgrid[0:visina, 0:sirina].astype(np.float32)
    return (xx + 0.5) / visina, (yy + 0.5) / visina


def zakreni(x, y, stupnjeva):
    a = np.radians(stupnjeva)
    c, s = np.float32(np.cos(a)), np.float32(np.sin(a))
    return x * c - y * s, x * s + y * c


def udaljenost_u_px(polje, najmanji=0.35):
    """Polje udaljenosti (bilo kojeg mjerila) → pikseli, dijeljenjem s
    nagibom; skokovi na granicama ćelija se ograniče. Veći `najmanji`
    znači oštriji rub i tamo gdje je polje gotovo ravno."""
    gy, gx = np.gradient(polje)
    nagib = np.sqrt(gx * gx + gy * gy)
    srednji = np.median(nagib[::7, ::7])
    return polje / np.clip(nagib, srednji * najmanji, srednji * 3.0)


class Sum:
    """Gradijentni (Perlinov) i stanični (Voronoi) šum, sve u numpyju."""

    def __init__(self, seed):
        rng = np.random.default_rng(seed)
        perm = rng.permutation(256).astype(np.int32)
        # hash(ix, iy) za sve parove 0–255, indeks (ix << 8) | iy
        self.h = perm[(perm[:, None] + np.arange(256)[None, :]) & 255].ravel().astype(np.int32)
        kut = rng.uniform(0.0, 2.0 * np.pi, 256)
        self.gx = np.cos(kut).astype(np.float32)[self.h]
        self.gy = np.sin(kut).astype(np.float32)[self.h]
        self.tx = (0.08 + 0.84 * rng.random(256)).astype(np.float32)   # točke ćelija
        self.ty = (0.08 + 0.84 * rng.random(256)).astype(np.float32)
        self.slucajno = rng.random((4, 256)).astype(np.float32)          # po rubu ćelija
        self.pomaci = rng.uniform(-200.0, 200.0, (64, 2)).astype(np.float32)

    @staticmethod
    def _po_blokovima(fn, x, y, izlaza=1, tipovi=(np.float32,)):
        izlaz = [np.empty(x.shape, t) for t in tipovi]
        xf, yf = x.ravel(), y.ravel()
        rav = [i.reshape(-1) for i in izlaz]
        for i in range(0, xf.size, BLOK):
            r = fn(xf[i:i + BLOK], yf[i:i + BLOK])
            if izlaza == 1:
                r = (r,)
            for cilj, vr in zip(rav, r):
                cilj[i:i + BLOK] = vr
        return izlaz[0] if izlaza == 1 else izlaz

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
        return (a + (b - a) * v) * 1.41  # ≈ −1 … 1

    def gradijentni(self, x, y):
        return self._po_blokovima(self._gradijentni, x, y)

    def fbm(self, x, y, oktave=5, lak=2.0, poj=0.5, pomak=0):
        """Fraktalni šum; svaka oktava malo zakrenuta da nema rešetke.
        Vraća vrijednosti sa standardnom devijacijom ≈ 0.45 (uglavnom −1 … 1),
        bez obzira na broj oktava."""
        zbroj = np.zeros(np.shape(x), np.float32)
        a, f, norma = 1.0, 1.0, 0.0
        for o in range(oktave):
            px, py = self.pomaci[(pomak * 7 + o) % 64]
            k = 0.5 + o * 0.9 + pomak * 0.37
            c, s = np.float32(np.cos(k) * f), np.float32(np.sin(k) * f)
            zbroj += np.float32(a) * self.gradijentni(x * c - y * s + px, x * s + y * c + py)
            norma += a * a
            a *= poj
            f *= lak
        return zbroj * np.float32(0.45 / (0.30 * np.sqrt(norma)))

    def _voronoi(self, x, y):
        x0 = np.floor(x)
        y0 = np.floor(y)
        fx = x - x0
        fy = y - y0
        ix = x0.astype(np.int32)
        iy = y0.astype(np.int32)
        n = x.size
        D = np.empty((9, n), np.float32)
        PX = np.empty((9, n), np.float32)
        PY = np.empty((9, n), np.float32)
        HH = np.empty((9, n), np.int32)
        k = 0
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                h = self.h.take((((ix + dx) & 255) << 8) | ((iy + dy) & 255))
                PX[k] = dx + self.tx.take(h)
                PY[k] = dy + self.ty.take(h)
                HH[k] = h
                D[k] = (PX[k] - fx) ** 2 + (PY[k] - fy) ** 2
                k += 1
        stupci = np.arange(n)
        i1 = D.argmin(0)
        D[i1, stupci] = np.inf
        i2 = D.argmin(0)
        p1x, p1y, h1 = PX[i1, stupci], PY[i1, stupci], HH[i1, stupci]
        p2x, p2y, h2 = PX[i2, stupci], PY[i2, stupci], HH[i2, stupci]
        nx, ny = p2x - p1x, p2y - p1y
        duljina = np.sqrt(nx * nx + ny * ny) + 1e-6
        rub = np.abs((fx - (p1x + p2x) * 0.5) * nx + (fy - (p1y + p2y) * 0.5) * ny) / duljina
        # isti broj s obje strane ruba (redoslijed ćelija ne smije biti bitan)
        lo, hi = np.minimum(h1, h2), np.maximum(h1, h2)
        kljuc = (lo * 31 + hi * 17 + ((lo * hi) >> 3)) & 255
        return rub, kljuc

    def voronoi(self, x, y):
        """Udaljenost do najbližeg ruba ćelija (u jedinicama ćelije) i
        slučajni ključ 0–255 koji je isti duž cijelog jednog ruba."""
        return self._po_blokovima(self._voronoi, x, y, 2, (np.float32, np.int32))


# ── IZRADA ───────────────────────────────────────────────────────────

def izradi(jacina=JACINA_ZILA, gustoca=GUSTOCA_ZILA, bijele=JACINA_BIJELIH,
           sjaj=SJAJ, seed=SEED, naduzorkovanje=NADUZORKOVANJE,
           svjetlina=SVJETLINA_PODLOGE):
    t0 = time.time()
    n = naduzorkovanje
    W, H = SIRINA * n, VISINA * n
    s = Sum(seed)

    def javi(sto):
        print(f'  {sto} … {time.time() - t0:.1f} s')

    # ── 1. glatka polja u pola izlazne rezolucije (brzo), pa uvećana ──
    x, y = koordinate(SIRINA // 2, VISINA // 2)
    u, v = zakreni(x, y, KUT_POJASEVA)        # u = duž pojasa, v = poprijeko
    # iskrivljenje domene: sve plovi, nijedna linija nije ravna
    uw = u + 0.024 * s.fbm(u * 2.0, v * 2.6, 4, pomak=1)
    vw = (v + 0.012 * s.fbm(u * 2.2 + 5.2, v * 3.0 + 1.3, 4, pomak=2)
            + 0.020 * s.fbm(u * 1.0, v * 0.5, 3, pomak=3))

    # pojasevi u kojima se skupljaju žile
    pojas = np.zeros_like(x)
    for i, (sredina, debljina, snaga) in enumerate(POJASEVI):
        val = 0.015 * s.fbm(uw * 1.7, vw * 0.3 + i * 3.7, 3, pomak=10 + i)
        deb = debljina * (0.70 + 0.6 * glatko(-0.5, 0.5, s.fbm(uw * 2.6, vw * 0.3 + i * 5.1, 3, pomak=20 + i)))
        # pojas mjestimično slabi i nestaje duž svoje duljine
        prekid = glatko(-0.45, 0.25, s.fbm(uw * 2.8 + i * 9.0, vw * 0.3 + i * 1.9, 3, pomak=30 + i))
        d = (vw - sredina - val) / deb
        pojas = np.maximum(pojas, snaga * np.exp(-d * d) * (0.60 + 0.40 * prekid))

    lokalno = s.fbm(uw * 8.0, vw * 8.0, 4, pomak=40)              # mjestimične praznine
    ton = glatko(-0.45, 0.45, s.fbm(uw * 6.0, vw * 6.0, 3, pomak=41))  # nijansa zlata
    oblak = 0.5 + 0.5 * s.fbm(u * 1.5, v * 1.5, 5, pomak=42)
    # slojevi: duge mekane pruge koje prate pojaseve (kao valovi u kamenu)
    slojevi = 0.5 + 0.5 * s.fbm(uw * 1.1, vw * 11.0, 5, poj=0.55, pomak=43)
    # i tanje, oštrije pruge (kao brušeni slojevi na pultu)
    pruge = (1.0 - np.abs(s.fbm(uw * 0.8 + 2.0, vw * 26.0 + 0.6 * s.fbm(uw * 4.0, vw * 4.0, 2, pomak=47),
                                3, lak=2.3, pomak=45))) ** 8
    pruge = pruge * glatko(0.0, 0.6, s.fbm(uw * 2.5, vw * 4.0, 3, pomak=46))

    # bijele žilice idu koso; njihove koordinate
    bu, bv = zakreni(x, y, KUT_BIJELIH)
    bu = bu + 0.018 * s.fbm(bu * 2.0, bv * 2.0, 3, pomak=44)

    glatka = {k: povecaj(p, W, H) for k, p in dict(
        uw=uw, vw=vw, pojas=pojas, lokalno=lokalno, ton=ton, oblak=oblak,
        slojevi=slojevi, pruge=pruge, bu=bu, bv=bv).items()}
    uw, vw, pojas = glatka['uw'], glatka['vw'], glatka['pojas']
    del x, y, u, v
    javi('glatka polja')

    # ── 2. zlatne žile: ispucale mreže, kao pukotine ispunjene zlatom ──
    zlato_pokrov = np.zeros((H, W), np.float32)
    zlato_jezgra = np.zeros((H, W), np.float32)
    bijelo = np.zeros((H, W), np.float32)
    lokalno = glatko(-0.5, 0.45, glatka['lokalno'])

    for (vel_u, vel_v, sirina_px, udio, od_pojasa, izvan, udio_bijelih, pomak) in (
        # krupna mreža: izdužene ćelije, deblje žile; izvan pojaseva rijetko
        (0.110, 0.036, 1.8, 0.85, 0.00, 0.22, 0.16, 50),
        # sitna mreža: gusti, vlaknasti rubovi samo u srcu pojaseva
        (0.040, 0.014, 1.1, 0.95, 0.20, 0.00, 0.05, 60),
    ):
        # iskrivljenje: srednje (rub vijuga) + sitno "presavijeno" (|šum|),
        # koje daje oštre lomove kao na pukotini, a ne okrugle petlje
        ku, kv = uw / vel_u, vw / vel_v
        iu = ku + 0.18 * s.fbm(ku * 0.8, kv * 0.8, 2, pomak=pomak) \
                + 0.06 * np.abs(s.fbm(ku * 3.0, kv * 3.0, 2, pomak=pomak + 1))
        iv = kv + 0.16 * s.fbm(ku * 0.8 + 3.3, kv * 0.8 + 7.7, 2, pomak=pomak + 2) \
                + 0.06 * np.abs(s.fbm(ku * 3.0 + 1.1, kv * 3.0 + 2.2, 2, pomak=pomak + 3))
        rub, kljuc = s.voronoi(iu, iv)
        rub_px = udaljenost_u_px(rub)
        del rub, ku, kv

        # koliko je rubova obojeno: ovisi o pojasu, lokalnom šumu i gustoći
        zelja = gustoca * udio * (glatko(od_pojasa, 1.0, pojas) + izvan) * (0.45 + 0.85 * lokalno)
        prisutno = glatko(0.06, -0.06, s.slucajno[0].take(kljuc) - zelja)

        # debljina duž ruba: tanji i deblji dijelovi, deblji u srcu pojasa
        tok = glatko(-0.55, 0.55, s.fbm(iu * 2.2, iv * 2.2, 3, pomak=pomak + 4))
        deb = sirina_px * n * (0.30 + 0.85 * s.slucajno[1].take(kljuc)) * (0.25 + 1.25 * tok)
        deb = deb * (0.55 + 1.30 * pojas)
        # žile se mjestimično prekidaju (ispucalo, ne kao nacrtana crta)
        deb = deb * glatko(-0.45, -0.15, s.fbm(iu * 3.0 + 9.0, iv * 3.0, 2, pomak=pomak + 5))
        # poneki rub nije zlatan nego tanka sivo-bijela pukotina
        bijeli_rub = (s.slucajno[2].take(kljuc) < udio_bijelih).astype(np.float32)
        del iu, iv, kljuc, tok

        crta = glatko(deb + 0.6 * n, deb - 0.6 * n, rub_px) * prisutno * glatko(0.1, 0.4, deb)
        jezgra = glatko(np.maximum(deb * 0.6, 0.01), 0.0, rub_px) * prisutno * glatko(1.6 * n, 3.5 * n, deb)
        tanje = deb * 0.55
        np.maximum(bijelo, glatko(tanje + 0.6 * n, tanje - 0.6 * n, rub_px) * prisutno * bijeli_rub, out=bijelo)
        np.maximum(zlato_pokrov, crta * (1.0 - bijeli_rub), out=zlato_pokrov)
        np.maximum(zlato_jezgra, jezgra * (1.0 - bijeli_rub), out=zlato_jezgra)
        del rub_px, prisutno, deb, crta, jezgra, tanje, bijeli_rub
        javi(f'mreža {pomak}')

    # zlatne ljuskice: izdužene, šiljaste krpice uz pojas (grebeni šuma)
    # ljuskice su blago koso poredane prema pojasu (kao "stepenice" na pultu)
    lu, lv = zakreni(uw, vw, 14.0)
    greben = 1.0 - np.abs(s.fbm(lu * 9.0, lv * 55.0, 3, pomak=65))
    greben = greben + 0.30 * s.fbm(lu * 30.0, lv * 190.0, 2, pomak=66)    # vlaknast, nazubljen rub
    # gdje je pojas slab ili je ljuskica "razlomljena", prag raste: ljuskice
    # se smanjuju i nestaju, ali im rub ostaje oštar (ne blijede u mrlju)
    razlom = glatko(-0.15, 0.25, s.fbm(uw * 6.0, vw * 14.0, 2, pomak=67))
    prag = 1.12 - 0.38 * glatko(0.30, 1.0, pojas) * min(gustoca, 1.5) + 0.30 * (1.0 - razlom)
    krpe = glatko(-0.7 * n, 0.7 * n, udaljenost_u_px(greben - prag, 0.9)) * glatko(0.25, 0.45, pojas)
    # tamne rupice i pukotine unutar ljuskica (zgužvana folija)
    rupe = s.fbm(lu * 40.0, lv * 170.0, 2, pomak=68)
    krpe = krpe * glatko(-0.62 * n, 0.62 * n, udaljenost_u_px(0.45 - rupe, 0.9))
    np.maximum(zlato_pokrov, krpe, out=zlato_pokrov)
    np.maximum(zlato_jezgra, krpe * 0.55, out=zlato_jezgra)
    del greben, razlom, prag, krpe, rupe, lu, lv
    javi('ljuskice')

    # duge tanke zlatne niti uz pojaseve (vlasi)
    nit = s.fbm(uw * 1.6, vw * 13.0, 3, poj=0.4, pomak=70)
    nit_px = np.abs(udaljenost_u_px(nit))
    nit_ima = glatko(0.10, 0.45, s.fbm(uw * 4.0, vw * 4.0, 3, pomak=71)) * glatko(0.04, 0.45, pojas)
    nit_deb = 0.55 * n * (0.4 + glatko(-0.4, 0.5, s.fbm(uw * 25, vw * 25, 2, pomak=72)))
    nit_deb = nit_deb * glatko(-0.35, -0.05, s.fbm(uw * 30 + 4, vw * 30, 2, pomak=73))
    niti = glatko(nit_deb + 0.6 * n, nit_deb - 0.6 * n, nit_px) * nit_ima * gustoca
    # dio niti nije zlatan nego sivo-bijel (kao vlakna u pojasu na pultu)
    bijele_niti = glatko(0.15, 0.45, s.fbm(uw * 3.0, vw * 8.0, 2, pomak=74))
    niti = np.minimum(niti, 1.0)
    np.maximum(zlato_pokrov, niti * 0.75 * (1.0 - bijele_niti), out=zlato_pokrov)
    np.maximum(bijelo, niti * 0.8 * bijele_niti, out=bijelo)
    del nit, nit_px, nit_ima, nit_deb, niti, bijele_niti
    javi('niti')

    # ── 3. sivo-bijele žilice: rijetke, tanke, duge, koso ──
    bu, bv = glatka['bu'], glatka['bv']
    bv = bv + 0.004 * np.abs(s.fbm(bu * 40.0, bv * 40.0, 2, pomak=83))     # sitni lomovi
    bj = s.fbm(bu * 0.9, bv * 5.0, 2, poj=0.35, pomak=80)
    bj_px = np.abs(udaljenost_u_px(bj))
    bj_ima = glatko(0.25, 0.60, s.fbm(bu * 2.4, bv * 2.4, 3, pomak=81))
    bj_deb = 0.45 * n * (0.5 + glatko(-0.3, 0.5, s.fbm(bu * 20, bv * 20, 2, pomak=82)))
    np.maximum(bijelo, glatko(bj_deb + 0.6 * n, bj_deb - 0.6 * n, bj_px) * bj_ima, out=bijelo)
    del bj, bj_px, bj_ima, bj_deb
    javi('bijele žilice')

    # ── 4. podloga: oblačaste dubine i slojevi ──
    oblak, slojevi = glatka['oblak'], glatka['slojevi']
    t = 0.03 + 0.45 * glatko(0.25, 0.85, oblak) + 0.45 * glatko(0.42, 0.80, slojevi) * (0.5 + 0.5 * oblak)
    rgb = pomijesaj(np.broadcast_to(boja(CRNA_DUBOKA), (H, W, 3)), boja(CRNA_OBLAK), np.clip(t, 0, 1))
    del t

    # sivkasti slojeviti oblaci uz pojaseve (kao na pultu)
    k = 2 * n                                # korak: polje u pola izlazne rezolucije
    oko_pojasa = povecaj(zamuti(pojas[::k, ::k], 22), W, H)
    sivo = oko_pojasa * (0.25 + 0.75 * glatko(0.35, 0.85, slojevi)) * 0.85 + 0.18 * glatko(0.6, 0.95, slojevi)
    sivo = sivo + glatka['pruge'] * (0.15 + 0.6 * oko_pojasa)
    rgb = pomijesaj(rgb, boja(SIVI_SLOJ), np.clip(sivo, 0, 1))
    del sivo, oko_pojasa

    # tihi topli sjaj oko gustih zlatnih žila
    sjaj_zila = povecaj(zamuti(zlato_pokrov[::k, ::k], 3), W, H)
    rgb = pomijesaj(rgb, boja(TOPLI_ODSJAJ), np.clip(sjaj_zila * 1.6, 0, 1) * 0.45 * min(jacina, 1.5))
    del sjaj_zila
    rgb = rgb * np.float32(svjetlina)
    javi('podloga')

    # ── 5. bijele i zlatne žile preko podloge ──
    rgb = pomijesaj(rgb, boja(BIJELA_ZILA), np.clip(bijelo * 0.40 * bijele, 0, 1))
    del bijelo
    # nijansa zlata: krupne promjene + vlakna uz pojas unutar svake ljuskice
    vlakna = s.fbm(uw * 18.0, vw * 150.0, 3, pomak=96)
    ton = np.clip(glatka['ton'] + 0.45 * vlakna, 0, 1)
    # rub zlata je tamniji, sredina deblje žile i ljuskice svjetlija
    rub_zlata = 1.0 - glatko(0.35, 0.95, zamuti(zlato_pokrov, 2 * n))
    ton = ton * (1.0 - 0.6 * rub_zlata)
    zlatna = pomijesaj(np.broadcast_to(boja(ZLATO_TAMNO), (H, W, 3)), boja(ZLATO), ton)
    svijetla_vlakna = glatko(0.30, 0.70, vlakna) * glatko(0.5, 1.0, zlato_pokrov) * 0.45
    zlatna = pomijesaj(zlatna, boja(ZLATO_SVIJETLO),
                       np.clip(zlato_jezgra * (0.15 + 0.45 * ton) + svijetla_vlakna, 0, 1))
    del rub_zlata, svijetla_vlakna
    # tanke žile su prozirnije, kao da leže malo ispod polirane površine
    alfa = zlato_pokrov * (0.58 + 0.42 * zlato_jezgra) * (0.78 + 0.22 * glatko(-0.5, 0.3, vlakna))
    alfa = np.clip(alfa * jacina, 0, 1)
    del vlakna
    rgb = rgb + (zlatna - rgb) * alfa[..., None]
    del zlatna, alfa

    # ── 6. blagi odsjaj poliranog kamena (široki, mekani, koso) ──
    if sjaj > 0:
        x, y = koordinate(W, H)
        d = x * 0.55 + y * 0.85
        odsjaj = np.exp(-((d - 0.55) / 0.20) ** 2) * 0.018 + np.exp(-((d - 1.20) / 0.10) ** 2) * 0.010
        rgb = rgb + (odsjaj * sjaj)[..., None] * np.array([0.92, 0.95, 1.0], np.float32)
        del x, y, d, odsjaj

    # smanji na izlaznu veličinu (prosjek n×n piksela)
    rgb = np.clip(rgb, 0, 1).reshape(VISINA, n, SIRINA, n, 3).mean(axis=(1, 3))
    # sitno zrno (protiv pruga u glatkim prijelazima nakon kompresije)
    zrno = np.random.default_rng(seed + 1).normal(0, 0.0030, rgb.shape[:2]).astype(np.float32)
    rgb = np.clip(rgb + zrno[..., None], 0, 1)
    javi('gotovo')
    return Image.fromarray((rgb * 255 + 0.5).astype(np.uint8), 'RGB')


def spremi(slika, put, kvaliteta=KVALITETA, najvise_kb=NAJVISE_KB):
    q = kvaliteta
    while True:
        spremnik = io.BytesIO()
        slika.save(spremnik, 'WEBP', quality=q, method=6)
        kb = spremnik.tell() / 1024
        if kb <= najvise_kb or q <= 40:
            break
        q -= 3
    with open(put, 'wb') as f:
        f.write(spremnik.getvalue())
    print(f'Spremljeno: {put}  ({slika.width} × {slika.height} px, {kb:.0f} KB, webp kvaliteta {q})')
    return kb, q


if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Tekstura crnog Portoro mramora sa zlatnim žilama.')
    p.add_argument('--jacina', type=float, default=JACINA_ZILA, help='jačina zlatnih žila (1 = kao na pultu)')
    p.add_argument('--gustoca', type=float, default=GUSTOCA_ZILA, help='gustoća zlatnih žila (1 = kao na pultu)')
    p.add_argument('--bijele', type=float, default=JACINA_BIJELIH, help='jačina sivo-bijelih žilica')
    p.add_argument('--sjaj', type=float, default=SJAJ, help='odsjaj poliranog kamena')
    p.add_argument('--svjetlina', type=float, default=SVJETLINA_PODLOGE, help='svjetlina crne podloge (1 = kao na pultu)')
    p.add_argument('--seed', type=int, default=SEED)
    p.add_argument('--naduzorkovanje', type=int, default=NADUZORKOVANJE, help='1 = brza proba, 2 = konačno')
    p.add_argument('--kvaliteta', type=int, default=KVALITETA)
    p.add_argument('--izlaz', default=IZLAZ)
    arg = p.parse_args()
    slika = izradi(arg.jacina, arg.gustoca, arg.bijele, arg.sjaj, arg.seed, arg.naduzorkovanje, arg.svjetlina)
    spremi(slika, arg.izlaz, arg.kvaliteta)
