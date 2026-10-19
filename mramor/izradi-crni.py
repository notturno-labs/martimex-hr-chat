#!/usr/bin/env python3
# ═════════════════════════════════════════════════════════════════════
#  MARTIMEX — tekstura crnog mramora sa zlatnim i bijelim žilama
#
#  Po uzorku koji je poslao klijent (crni polirani mramor, "Nero Marquina
#  sa zlatom"): duboka, neutralna crna podloga s tihim dubinama, preko
#  nje DUGE KOSE ZLATNE ŽILE (metalno zlato, od tamnog mesinga do
#  svijetlog odsjaja) u paralelnim skupinama (snopovima) koje se granaju,
#  razilaze i opet spajaju, tanke i deblje, s nazubljenim rubom; uz zlato
#  mjestimično široka, mliječna BIJELA KVARCNA ŽILA obrubljena zlatom,
#  tanke bijele žile i mreža vrlo tankih bijelih i sivih pukotina.
#
#  Žile se crtaju kao prave vrpce (lomljene krivulje promjenjive
#  debljine), ne kao šum, pa izgledaju kao kamen, a ne kao mrlje.
#
#  Gdje se koristi (tema-chata.js):
#   (a) pozadina početnog ekrana chata (400 × ~800 na računalu, cijeli
#       ekran mobitela) iza animacije bočice od točkica i iza teksta —
#       zato je sredina (bočica) i donja trećina (tekst) mirnija, a
#       glavni snopovi žila prolaze dijagonalno kroz kutove: veliki snop
#       s kvarcom kroz gornji desni kut, drugi kroz donji lijevi;
#   (b) sve ostale površine od crnog mramora (zaglavlje prozora, kupčeve
#       poruke, glavni gumb, ponuđeni odgovor pod mišem, gumb chata u kutu
#       stranice): za njih je mali, ZAMUĆENI isječak (crni-mali.webp) s dvije
#       kose zlatne žile (jedna s mliječnim kvarcom). Zamućen je da tekst
#       preko njega bude lako čitljiv; početni ekran ostaje oštar.
#
#  Datoteke (isti uzorak u dvije razlučivosti + mali isječak):
#     crni.webp      900 × 1500   (≤ 110 KB)
#     crni-2x.webp  1800 × 3000   (≤ 140 KB, oštri zasloni / mobiteli)
#     crni-mali.webp 900 × 330    (≤ 14 KB, zamućen; sve osim početnog ekrana)
#
#  Tamnije / mirnije:   --svjetlina 0.85 --jacina 0.8 --gustoca 0.7 --mir 1.3
#  Svjetlije / bogatije: --svjetlina 1.15 --jacina 1.15 --gustoca 1.3 --mir 0.6
#  Bez kvarca / bijelih žila: --bijele 0     Bez pukotina: --pukotine 0
#  Mali isječak više / manje zamućen: --samo mali --zamucenje 6 / 2.5 (px)
#
#  Pokretanje (iz mape repozitorija):
#     python3 mramor/izradi-crni.py                       (sve tri datoteke)
#     python3 mramor/izradi-crni.py --samo 1 --izlaz /tmp/proba.webp   (brza proba)
#     python3 mramor/izradi-crni.py --samo mali
#
#  Treba samo numpy i Pillow. Seed je fiksan, pa je rezultat ponovljiv
#  (i 1× i 2× imaju potpuno isti raspored žila).
# ═════════════════════════════════════════════════════════════════════

import argparse
import io
import os
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# ── POSTAVKE ─────────────────────────────────────────────────────────

SIRINA, VISINA = 900, 1500           # crni.webp (uspravno); crni-2x.webp je dvostruko veći
SIRINA_MALI, VISINA_MALI = 900, 330  # crni-mali.webp (u temi se prikazuje oko 630 px široko)
MALI_ZAMUCENJE = 4.0                 # px: koliko je mali isječak zamućen (u temi ≈ 0,7 × toliko; 0 = oštar)
NADUZORKOVANJE = 3                   # žile se crtaju 3× gušće pa smanje (glatki, oštri rubovi)
SEED = 11                            # isti seed = ista tekstura

KUT = 34.0                           # smjer žila: stupnjeva ispod vodoravne (spuštaju se udesno), kao na uzorku
JACINA_ZLATA = 1.0                   # 0 = bez zlata, 1 = kao na uzorku
GUSTOCA = 1.0                        # broj sporednih žila, grana i pukotina (0.5 = upola manje)
JACINA_BIJELIH = 1.0                 # kvarc i bijele žile (0 = bez)
JACINA_PUKOTINA = 1.0                # tanke bijelo-sive pukotine (0 = bez)
SJAJ = 1.0                           # svjetlo poliranog kamena i odsjaj na zlatu (0 = bez)
SVJETLINA_PODLOGE = 1.0              # <1 tamnija crna, >1 svjetlija
MIR = 1.0                            # koliko su sredina (bočica) i donja trećina (tekst) mirnije; 0 = jednako posvuda

# Podloga: duboka neutralna crna (ni smeđa ni plava), malo dubine.
CRNA_DUBOKA = '#050505'
CRNA = '#0b0b0c'
CRNA_OBLAK = '#111112'
SIVA_KOPRENA = '#1d1e20'             # tihi sivi "dim" uz snopove žila (kao na uzorku)

# Zlato (metalno): tamni mesing → zlato → svijetli odsjaj.
ZLATO_TAMNO = '#9a7426'
ZLATO = '#c9a04a'
ZLATO_ODSJAJ = '#ecd08a'

# Bijelo: mliječni kvarc, tanke bijele žile i pukotine.
KVARC = '#d8dadc'
KVARC_SJENA = '#8e959c'              # sivo-plavkasta sjena u kvarcu
BIJELA_ZILA = '#e2e4e6'
PUKOTINA = '#a9acb0'

# Snopovi žila. Svaki: os prolazi kroz točku (x, y) (udio širine / visine),
# kut (stupnjeva, kao KUT), raspon = koliko je snop širok poprijeko (px slike 1×),
# zlatnih = broj zlatnih žila, debljina = najdeblja žila (px 1×), bijelih = broj
# tankih bijelih žila, kvarc = najveća širina kvarcne žile (px 1×, 0 = bez),
# kvarc_od = gdje duž vidljivog dijela osi kvarc počinje (0 = ulaz u sliku, 1 = izlaz; dalje ide do ruba),
# jacina = 1 jasno, manje = dublje "ispod poliranja".
SNOPOVI = [
    dict(x=0.66, y=0.145, kut=34.0, raspon=170, zlatnih=12, debljina=11.0, bijelih=4,
         kvarc=50, kvarc_od=0.38, jacina=1.0, glavni=True),          # gornji desni kut, s kvarcom
    dict(x=0.13, y=0.90, kut=33.0, raspon=150, zlatnih=10, debljina=9.0, bijelih=3,
         kvarc=0, jacina=0.95, glavni=True),                           # donji lijevi kut
    dict(x=0.00, y=0.045, kut=36.0, raspon=60, zlatnih=4, debljina=3.2, bijelih=1,
         kvarc=0, jacina=0.80, glavni=False),                          # tanji, gornji lijevi kut
    dict(x=1.00, y=0.80, kut=31.0, raspon=55, zlatnih=4, debljina=3.0, bijelih=1,
         kvarc=0, jacina=0.75, glavni=False),                          # tanji, donji desni kut
]
SAMOTNIH = 6                         # usamljene tanke zlatne žile preko cijele plohe (u miru jedva vidljive)
PUKOTINA_BROJ = 80                   # tanke pukotine

# Mali (zamućeni) isječak: dva kosa snopa kao na velikom mramoru, lijevi s
# mliječnim kvarcom, a između njih mirna crna (iza natpisa i teksta).
SNOPOVI_MALI = [
    dict(x=0.24, y=0.50, kut=31.0, raspon=90, zlatnih=7, debljina=10.0, bijelih=2,
         kvarc=34, kvarc_od=0.05, jacina=1.0, glavni=True),           # lijevi, s kvarcom
    dict(x=0.80, y=0.50, kut=33.0, raspon=60, zlatnih=5, debljina=6.5, bijelih=1,
         kvarc=0, jacina=0.9, glavni=True),                            # desni, tanji
]
SAMOTNIH_MALI = 2
PUKOTINA_MALI = 18

# Mirna područja početnog ekrana (udio širine / visine): bočica i tekst.
MIR_BOCICA = (0.50, 0.34, 0.40, 0.21)        # središte x, y i polumjeri
MIR_TEKST = (0.12, 0.63, 0.88, 0.95)         # lijevo, gore, desno, dolje

KVALITETA = 90                       # početna webp kvaliteta; smanjuje se dok datoteka ne stane u granicu
NAJVISE_KB = 110
NAJVISE_KB_2X = 140                  # mobiteli: zajedno s bijeli-2x.webp i crni-mali.webp ispod ~300 KB
NAJVISE_KB_MALI = 14

MAPA = os.path.dirname(os.path.abspath(__file__))
IZLAZ = os.path.join(MAPA, 'crni.webp')
IZLAZ_2X = os.path.join(MAPA, 'crni-2x.webp')
IZLAZ_MALI = os.path.join(MAPA, 'crni-mali.webp')

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
    r = max(1, int(round(polumjer)))
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


def smanji(slika_l, n):
    """Sloj nacrtan n× gušće → prosjek n×n piksela, vrijednosti 0–1."""
    a = np.asarray(slika_l, np.float32)
    h, w = a.shape
    return a.reshape(h // n, n, w // n, n).mean(axis=(1, 3)) * np.float32(1 / 255)


class Sum:
    """Gradijentni (Perlinov) šum u numpyju (za podlogu i nijanse zlata)."""

    def __init__(self, seed):
        rng = np.random.default_rng(seed)
        perm = rng.permutation(256).astype(np.int32)
        self.h = perm[(perm[:, None] + np.arange(256)[None, :]) & 255].ravel().astype(np.int32)
        kut = rng.uniform(0.0, 2.0 * np.pi, 256)
        self.gx = np.cos(kut).astype(np.float32)[self.h]
        self.gy = np.sin(kut).astype(np.float32)[self.h]
        self.pomaci = rng.uniform(-200.0, 200.0, (64, 2)).astype(np.float32)

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
        izlaz = np.empty(x.shape, np.float32)
        xf, yf, of = x.ravel(), y.ravel(), izlaz.reshape(-1)
        for i in range(0, xf.size, BLOK):
            of[i:i + BLOK] = self._gradijentni(xf[i:i + BLOK], yf[i:i + BLOK])
        return izlaz

    def fbm(self, x, y, oktave=4, lak=2.0, poj=0.5, pomak=0):
        """Fraktalni šum, standardna devijacija ≈ 0.45 (uglavnom −1 … 1)."""
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


class Krivulja:
    """Jednodimenzionalni šum duž žile: slučajne točke svakih `korak` px,
    spojene glatko (Catmull-Rom) ili ravnim crtama (oštri lomovi, kao na
    pukotini). Slučajni brojevi se izvlače odmah, pa oblik ne ovisi o
    tome koliko se gusto krivulja kasnije uzorkuje (1× i 2× su isti)."""

    def __init__(self, rng, duljina, korak, glatka=True):
        self.korak = float(korak)
        self.glatka = glatka
        self.cv = rng.standard_normal(int(duljina / korak) + 6).astype(np.float32)

    def __call__(self, s):
        u = np.clip(s / self.korak + 2.0, 1.0, len(self.cv) - 3.001)
        if not self.glatka:
            return np.interp(u, np.arange(len(self.cv)), self.cv).astype(np.float32)
        i = np.floor(u).astype(np.int32)
        t = (u - i).astype(np.float32)
        p0, p1, p2, p3 = self.cv[i - 1], self.cv[i], self.cv[i + 1], self.cv[i + 2]
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                      + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)


def rampa(s, a, b, ulaz, izlaz):
    """1 između a i b, glatko 0 prema van na duljini ulaz / izlaz (vrh žile)."""
    return glatko(a - 1e-3, a + ulaz, s) * glatko(b + 1e-3, b - izlaz, s)


# ── CRTANJE ŽILA ─────────────────────────────────────────────────────

class Platno:
    """Slojevi (crno-bijele maske) na kojima se žile crtaju n× gušće."""

    SLOJEVI = ('zlato', 'zlato_sporedno', 'zlato_obrub', 'kvarc', 'bijelo', 'pukotine')

    def __init__(self, sirina, visina, mjerilo, n):
        self.S = float(mjerilo * n)           # px platna po px slike 1×
        self.n = n
        self.sirina1, self.visina1 = sirina, visina
        self.W, self.H = int(sirina * mjerilo * n), int(visina * mjerilo * n)
        self.slike = {k: Image.new('L', (self.W, self.H), 0) for k in self.SLOJEVI}
        self.olovke = {k: ImageDraw.Draw(v) for k, v in self.slike.items()}
        self.popis = []                       # (sloj, jačina, točke) — crta se poslije, slabije prvo

    def vrpca(self, sloj, cx, cy, nx, ny, lijevo, desno, jacina=1.0):
        """Vrpca oko središnje crte (px 1×): lijevo/desno su polovične debljine.
        Dijelovi gdje je debljina ~0 se preskaču (žila je prekinuta)."""
        S = self.S
        ima = (lijevo + desno) * S > 0.35
        if not ima.any():
            return
        rubovi = np.flatnonzero(np.diff(np.concatenate(([0], ima.astype(np.int8), [0]))))
        for a, b in zip(rubovi[::2], rubovi[1::2]):
            if b - a < 2:
                continue
            sl = slice(a, b)
            lx = (cx[sl] + nx[sl] * lijevo[sl]) * S
            ly = (cy[sl] + ny[sl] * lijevo[sl]) * S
            dx = (cx[sl] - nx[sl] * desno[sl]) * S
            dy = (cy[sl] - ny[sl] * desno[sl]) * S
            # samo dijelovi blizu slike
            if lx.max() < -50 or lx.min() > self.W + 50 or ly.max() < -50 or ly.min() > self.H + 50:
                continue
            tocke = np.concatenate([np.stack([lx, ly], 1), np.stack([dx, dy], 1)[::-1]])
            self.popis.append((sloj, jacina, [tuple(p) for p in tocke.tolist()]))

    def nacrtaj(self):
        # slabije žile prvo, jače preko njih (gdje se križaju, vrijedi jača)
        for sloj, jacina, tocke in sorted(self.popis, key=lambda z: z[1]):
            self.olovke[sloj].polygon(tocke, fill=int(round(255 * min(1.0, jacina))))
        self.popis = []

    def maske(self):
        self.nacrtaj()
        return {k: smanji(v, self.n) for k, v in self.slike.items()}


def os_snopa(sirina, visina, x, y, kut, rub=90.0):
    """Točka, smjer i raspon s (px 1×) duž kojeg os snopa prolazi kroz sliku."""
    A = np.array([x * sirina, y * visina], np.float32)
    k = np.radians(kut)
    d = np.array([np.cos(k), np.sin(k)], np.float32)
    kutovi = np.array([[0, 0], [sirina, 0], [0, visina], [sirina, visina]], np.float32) - A
    proj = kutovi @ d
    # vidljivi dio osi (gdje je sama os unutar slike)
    ts = []
    for i, gr in ((0, sirina), (1, visina)):
        if abs(d[i]) > 1e-6:
            ts += [(-A[i]) / d[i], (gr - A[i]) / d[i]]
    vidljivo = []
    for t in ts:
        p = A + d * t
        if -1 <= p[0] <= sirina + 1 and -1 <= p[1] <= visina + 1:
            vidljivo.append(t)
    vid = (min(vidljivo), max(vidljivo)) if len(vidljivo) >= 2 else (proj.min(), proj.max())
    return A, d, (float(proj.min() - rub), float(proj.max() + rub)), vid


def zila(platno, sloj, rng, A, d, s, os_pomak, pomak0, debljina, jacina,
         aktivno=None, lomovi=1.0, nazubljenost=1.0, prekidi=0.0, gibanje=0.0, grane=0.0,
         sirenje=1.0):
    """Jedna žila uz os snopa. os_pomak(s) = zajedničko vijuganje snopa,
    pomak0 = udaljenost od osi (px 1×), sirenje(s) = koliko je snop na tom
    mjestu raširen (žile se razilaze i opet skupljaju). Vraća (pomak, debljina) za kvarc i grane."""
    rng = np.random.default_rng(rng.integers(1 << 31))   # vlastiti slučajni niz (promjena jedne žile ne mijenja ostale)
    L = s[-1] - s[0] + 1.0
    s0 = s - s[0]
    # vlastito vijuganje: sporo razilaženje (spajanje sa susjednima),
    # srednji lomovi i sitni cik-cak (kao na pukotini)
    pom = (pomak0 * sirenje + os_pomak
           + gibanje * Krivulja(rng, L, rng.uniform(250, 520))(s0)
           + lomovi * 2.2 * Krivulja(rng, L, rng.uniform(28, 55), glatka=False)(s0)
           + lomovi * 0.28 * Krivulja(rng, L, rng.uniform(7, 13), glatka=False)(s0))
    # debljina duž žile: tanji i deblji dijelovi, ponegdje prekid
    w = debljina * (0.42 + 0.58 * glatko(-0.9, 0.9, Krivulja(rng, L, rng.uniform(110, 220))(s0)))
    w = w * (0.80 + 0.20 * np.tanh(Krivulja(rng, L, rng.uniform(25, 45))(s0)))
    if prekidi > 0:
        w = w * glatko(prekidi - 0.15, prekidi + 0.25, Krivulja(rng, L, rng.uniform(70, 140))(s0) * 0.6 + 0.5)
    if aktivno is not None:
        w = w * rampa(s, *aktivno)
    # nazubljen rub: lijevi i desni neovisno (blagi valovi + sitni zupci)
    zub = nazubljenost * (0.10 + 0.3 / (debljina + 0.5))
    jl = (1.0 + 0.16 * nazubljenost * Krivulja(rng, L, rng.uniform(9, 16))(s0)
          + zub * Krivulja(rng, L, rng.uniform(2.5, 4.5), glatka=False)(s0))
    jr = (1.0 + 0.16 * nazubljenost * Krivulja(rng, L, rng.uniform(9, 16))(s0)
          + zub * Krivulja(rng, L, rng.uniform(2.5, 4.5), glatka=False)(s0))
    nacrtaj_vrpcu(platno, sloj, A, d, s, pom, np.maximum(w * 0.5 * jl, 0), np.maximum(w * 0.5 * jr, 0), jacina)

    # grane: odvoje se pod malim kutom pa se ili vrate u žilu ili utihnu
    for _ in range(rng.poisson(grane)):
        duz = rng.uniform(90, 420)
        a = rng.uniform(s[0], s[-1] - duz)
        if aktivno is not None and not (aktivno[0] < a < aktivno[1]):
            continue
        m = (s >= a) & (s <= a + duz)
        if m.sum() < 4:
            continue
        t = (s[m] - a) / duz
        smjer = rng.choice([-1.0, 1.0])
        if rng.random() < 0.5:     # vrati se u žilu (luk)
            odmak = smjer * rng.uniform(5, 26) * np.sin(np.pi * t) ** 0.8
            tanj = 0.55 + 0.35 * np.sin(np.pi * t)
        else:                      # odvoji se i utihne
            odmak = smjer * np.tan(np.radians(rng.uniform(5, 15))) * duz * t ** 1.3
            tanj = (1.0 - t) ** 0.9
        odmak = odmak + lomovi * 1.6 * Krivulja(rng, duz, rng.uniform(14, 30), glatka=False)(s[m] - a)
        wg = w[m] * rng.uniform(0.35, 0.75) * tanj + 0.25 * glatko(0.0, 0.1, t) * glatko(1.0, 0.85, t)
        jg = 1.0 + 0.25 * Krivulja(rng, duz, 3.5, glatka=False)(s[m] - a)
        nacrtaj_vrpcu(platno, sloj, A, d, s[m], pom[m] + odmak, wg * 0.5 * jg, wg * 0.5 * (2 - jg), jacina)
    return pom, w


def nacrtaj_vrpcu(platno, sloj, A, d, s, pom, lijevo, desno, jacina):
    """Središnja crta = A + s·d + pom·normala. Debljina se nanosi okomito na
    os (ne na lokalni smjer): žile su gotovo usporedne s osi, a na oštrim
    lomovima tako nema lepeza ni izbočina (važno za široki kvarc)."""
    nrm = np.array([-d[1], d[0]], np.float32)
    cx = A[0] + s * d[0] + pom * nrm[0]
    cy = A[1] + s * d[1] + pom * nrm[1]
    nx = np.full_like(cx, nrm[0])
    ny = np.full_like(cy, nrm[1])
    platno.vrpca(sloj, cx, cy, nx, ny, lijevo, desno, jacina)


def snop(platno, rng, sn, gustoca, bijele):
    """Paralelna skupina zlatnih žila (s kvarcom i bijelim žilama)."""
    sir, vis = platno.sirina1, platno.visina1
    A, d, (sa, sb), (va, vb) = os_snopa(sir, vis, sn['x'], sn['y'], sn['kut'])
    korak = 0.55 / platno.S                   # gustoća uzorkovanja duž žile (px 1×)
    s = np.arange(sa, sb, korak, dtype=np.float32)
    L = sb - sa
    s0 = s - sa
    sloj = 'zlato' if sn.get('glavni') else 'zlato_sporedno'
    raspon = sn['raspon']
    # zajedničko vijuganje cijelog snopa
    os_pomak = (raspon * 0.20 * Krivulja(rng, L, 430)(s0) + 3.0 * Krivulja(rng, L, 120)(s0))
    # snop se mjestimično raširi (lepeza), a mjestimično skupi (uz kvarc najuži)
    sirenje = 0.55 + 0.75 * glatko(-0.9, 0.9, Krivulja(rng, L, 300)(s0))

    # kvarc: široka mliječna žila u snopu, obrubljena zlatom
    rng_k = np.random.default_rng(rng.integers(1 << 31))
    if sn.get('kvarc', 0) > 0 and bijele > 0:
        rng, rng_snop = rng_k, rng
        # kvarc izroni iz zlatne žile i proteže se do ruba slike
        profil = rampa(s, va + (vb - va) * sn.get('kvarc_od', 0.1), vb + 400, 320, 200)
        wq = sn['kvarc'] * profil * (0.78 + 0.22 * np.tanh(Krivulja(rng, L, 220)(s0)))
        wq = wq * (0.88 + 0.12 * Krivulja(rng, L, 24)(s0))
        pq = os_pomak + raspon * 0.06 + 1.6 * Krivulja(rng, L, 40, glatka=False)(s0)
        # rub kvarca: blago valovit, sitno nazubljen tek malo
        ql = wq * 0.5 * (1 + 0.08 * Krivulja(rng, L, 30)(s0) + 0.04 * Krivulja(rng, L, 4, glatka=False)(s0))
        qd = wq * 0.5 * (1 + 0.08 * Krivulja(rng, L, 30)(s0) + 0.04 * Krivulja(rng, L, 4, glatka=False)(s0))
        nacrtaj_vrpcu(platno, 'kvarc', A, d, s, pq, ql, qd, min(1.0, bijele))
        # zlatni obrub s obje strane kvarca (mjestimično rastrgan u ljuskice)
        for strana, rub in ((1.0, ql), (-1.0, qd)):
            wz = (2.6 + 6.0 * glatko(-0.6, 0.9, Krivulja(rng, L, 70)(s0))) * (0.55 + 0.45 * profil)
            # rijetko se obrub raspadne u ljuskice (kratki prekidi)
            wz = wz * glatko(-1.05, -0.75, 0.75 * Krivulja(rng, L, 38)(s0) + 0.3 * Krivulja(rng, L, 9)(s0))
            p = pq + strana * (rub - 0.25 * wz)
            j1 = 1 + 0.12 * Krivulja(rng, L, 11)(s0) + 0.12 * Krivulja(rng, L, 3.5, glatka=False)(s0)
            j2 = 1 + 0.12 * Krivulja(rng, L, 11)(s0) + 0.12 * Krivulja(rng, L, 3.5, glatka=False)(s0)
            nacrtaj_vrpcu(platno, 'zlato_obrub', A, d, s, p, wz * 0.5 * j1, wz * 0.5 * j2, sn['jacina'])
        rng = rng_snop

    # zlatne žile: jedna-dvije debele, ostale tanje i dlakave
    n = max(1, int(round(sn['zlatnih'] * (0.6 + 0.4 * gustoca))))
    for i in range(n):
        if i == 0:
            deb, p0 = sn['debljina'], rng.uniform(-0.12, 0.12) * raspon
        elif i == 1:
            deb, p0 = sn['debljina'] * rng.uniform(0.6, 0.85), rng.uniform(-0.45, 0.45) * raspon
        elif i == 2:
            deb, p0 = sn['debljina'] * rng.uniform(0.35, 0.55), rng.uniform(-0.5, 0.5) * raspon
        else:
            deb = rng.choice([rng.uniform(0.7, 1.4), sn['debljina'] * rng.uniform(0.18, 0.45)])
            p0 = rng.normal(0, 0.32) * raspon
        # neke žile ne prolaze cijelim snopom: ulaze ili nestaju unutar slike
        if i > 1 and rng.random() < 0.55:
            dulj = rng.uniform(0.35, 0.8) * (vb - va + 300)
            a = rng.uniform(va - 200, vb - dulj + 200)
            aktivno = (a, a + dulj, rng.uniform(60, 220), rng.uniform(60, 260))
        else:
            aktivno = None
        jac = sn['jacina'] * (1.0 if deb > 1.5 else rng.uniform(0.75, 1.0))
        zila(platno, sloj, rng, A, d, s, os_pomak, p0, deb, jac, aktivno=aktivno,
             lomovi=1.0 if deb < 3 else 0.6, prekidi=rng.uniform(-0.2, 0.15) if deb < 2 else -0.5,
             gibanje=raspon * rng.uniform(0.06, 0.16), grane=(1.3 if deb > 1.5 else 0.5) * gustoca,
             sirenje=sirenje)

    # tanke bijele žile uz zlato (sjajne, mjestimično)
    if bijele > 0:
        for i in range(sn.get('bijelih', 0)):
            dulj = rng.uniform(0.4, 0.9) * (vb - va + 300)
            a = rng.uniform(va - 200, vb - dulj + 200)
            zila(platno, 'bijelo', rng, A, d, s, os_pomak, rng.normal(0, 0.35) * raspon,
                 rng.uniform(1.0, 2.6), min(1.0, rng.uniform(0.6, 0.95) * bijele),
                 aktivno=(a, a + dulj, rng.uniform(80, 250), rng.uniform(80, 250)),
                 lomovi=1.0, prekidi=-0.1, gibanje=raspon * 0.1, grane=0.6 * gustoca, sirenje=sirenje)


def samotna(platno, rng, kut, sloj, debljina, jacina, gustoca, duljina=None):
    """Usamljena tanka žila ili pukotina na slučajnom mjestu."""
    sir, vis = platno.sirina1, platno.visina1
    A, d, (sa, sb), _ = os_snopa(sir, vis, rng.uniform(0.05, 0.95), rng.uniform(0.03, 0.97), kut, rub=20)
    s = np.arange(sa, sb, 0.55 / platno.S, dtype=np.float32)
    if duljina:
        a = rng.uniform(-duljina, 0)
        aktivno = (a, a + duljina, rng.uniform(20, 120), rng.uniform(20, 120))
    else:
        aktivno = None
    zila(platno, sloj, rng, A, d, s, 0.0, 0.0, debljina, jacina, aktivno=aktivno,
         lomovi=rng.uniform(0.8, 1.6), nazubljenost=0.6, prekidi=-0.3,
         gibanje=rng.uniform(4, 14), grane=0.5 * gustoca)


# ── IZRADA ───────────────────────────────────────────────────────────

def izradi(mjerilo=1, mali=False, jacina=JACINA_ZLATA, gustoca=GUSTOCA, bijele=JACINA_BIJELIH,
           pukotine=JACINA_PUKOTINA, sjaj=SJAJ, svjetlina=SVJETLINA_PODLOGE, mir=MIR,
           seed=SEED, naduzorkovanje=NADUZORKOVANJE, kut=KUT):
    """mjerilo 2 = isti uzorak u dvostrukoj razlučivosti (žile oštrije)."""
    t0 = time.time()

    def javi(sto):
        print(f'  {sto} … {time.time() - t0:.1f} s')

    sir1, vis1 = (SIRINA_MALI, VISINA_MALI) if mali else (SIRINA, VISINA)
    m = max(1, int(mjerilo))
    W, H = sir1 * m, vis1 * m
    rng = np.random.default_rng(seed + (100 if mali else 0))
    platno = Platno(sir1, vis1, m, naduzorkovanje)

    # ── 1. žile (vektorski, kao vrpce) ──
    if mali:
        snopovi, samotnih, broj_pukotina = SNOPOVI_MALI, SAMOTNIH_MALI, PUKOTINA_MALI
    else:
        snopovi, samotnih, broj_pukotina = SNOPOVI, SAMOTNIH, PUKOTINA_BROJ
    for sn in snopovi:
        sn = dict(sn)
        sn['kut'] = sn['kut'] + (kut - KUT)
        snop(platno, np.random.default_rng(rng.integers(1 << 31)), sn, gustoca, bijele)
    for _ in range(int(round(samotnih * gustoca))):
        samotna(platno, rng, kut + rng.normal(0, 4), 'zlato_sporedno', rng.uniform(0.7, 1.6),
                rng.uniform(0.55, 0.85), gustoca, duljina=rng.uniform(250, 900))
    if pukotine > 0:
        for _ in range(int(round(broj_pukotina * gustoca))):
            # većina prati smjer žila, ostale ih presijecaju pod raznim kutovima
            k = kut + rng.normal(0, 9) if rng.random() < 0.55 else kut + rng.uniform(25, 155)
            samotna(platno, rng, k, 'pukotine', rng.uniform(0.38, 0.75),
                    rng.uniform(0.18, 0.62), 0.6, duljina=rng.uniform(70, 650))
    javi('žile nacrtane')
    mk = platno.maske()
    del platno
    javi('maske')

    # ── 2. polja: mirna područja, svjetlo, šum ──
    s = Sum(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    xn, yn = (xx + 0.5) / W, (yy + 0.5) / H              # 0–1
    x1, y1 = (xx + 0.5) / m, (yy + 0.5) / m              # px slike 1×
    del xx, yy
    if mali or mir <= 0:
        miran = np.zeros((H, W), np.float32)
    else:
        cx, cy, rx, ry = MIR_BOCICA
        r = np.sqrt(((xn - cx) / rx) ** 2 + ((yn - cy) / ry) ** 2)
        l, g, dsn, dl = MIR_TEKST
        u_tekstu = (glatko(l - 0.10, l + 0.04, xn) * glatko(dsn + 0.10, dsn - 0.04, xn)
                    * glatko(g - 0.07, g + 0.03, yn) * glatko(dl + 0.06, dl - 0.02, yn))
        miran = np.maximum(glatko(1.25, 0.65, r), u_tekstu) * np.float32(min(mir, 1.6))
        del r, u_tekstu
    k = np.radians(kut)
    uu = (x1 * np.cos(k) + y1 * np.sin(k)).astype(np.float32)    # duž žila
    vv = (-x1 * np.sin(k) + y1 * np.cos(k)).astype(np.float32)   # poprijeko

    # ── 3. podloga: duboka crna s tihim oblacima i sivim dimom ──
    # (glatka polja u četvrtini rezolucije pa uvećana)
    q = 4
    oblak = povecaj(s.fbm(x1[::q, ::q] / 520, y1[::q, ::q] / 520, 5, pomak=1), W, H)
    dim = povecaj(s.fbm(uu[::q, ::q] / 420, vv[::q, ::q] / 95, 4, poj=0.55, pomak=2), W, H)
    t = 0.35 + 0.50 * glatko(-0.6, 0.8, oblak)
    rgb = pomijesaj(np.broadcast_to(boja(CRNA_DUBOKA), (H, W, 3)), boja(CRNA), np.clip(t, 0, 1))
    rgb = pomijesaj(rgb, boja(CRNA_OBLAK), glatko(0.25, 1.0, oblak) * 0.6)
    # dim uz snopove žila (širok, mekan, koso)
    zile_sve = mk['zlato'] + 0.6 * mk['kvarc'] + 0.4 * mk['zlato_sporedno']
    korak = max(1, 2 * m)
    oko = povecaj(zamuti(zile_sve[::korak, ::korak], 26), W, H)
    oko = np.clip(oko * 5.0, 0, 1)
    koprena = (0.10 + 0.90 * oko) * glatko(0.0, 0.8, dim) * 0.70 * (1.0 - 0.6 * miran)
    rgb = pomijesaj(rgb, boja(SIVA_KOPRENA), np.clip(koprena, 0, 1))
    rgb = rgb * np.float32(svjetlina)
    del oblak, t, koprena, zile_sve
    javi('podloga')

    # svjetlo poliranog kamena: širok mekan koso postavljen odsjaj (gore desno)
    if mali:
        svjetlo = 0.6 + 0.4 * np.exp(-(((xn - 0.6) / 0.5) ** 2 + ((yn - 0.3) / 0.9) ** 2))
    else:
        dd = xn * 0.6 + yn * 0.8
        svjetlo = 0.55 + 0.45 * np.exp(-((dd - 0.45) / 0.30) ** 2)
    svjetlo = svjetlo.astype(np.float32)
    rgb = rgb + (np.float32(0.010 * sjaj) * svjetlo)[..., None] * np.array([0.96, 0.98, 1.0], np.float32)

    # ── 4. pukotine: vrlo tanke, bijelo-sive, mjestimično jače ──
    puk = mk['pukotine'] * np.float32(pukotine) * (1.0 - 0.55 * miran)
    rgb = pomijesaj(rgb, boja(PUKOTINA), np.clip(puk, 0, 1))
    del puk

    # ── 5. kvarc: mliječan, prozirnih rubova, sa sivim oblacima unutra ──
    if bijele > 0:
        kv = mk['kvarc']
        meko = zamuti(kv, 0.6 * m)
        oblaci = s.fbm(uu / 50, vv / 11, 4, poj=0.6, pomak=5)
        jezgra = glatko(0.25, 0.85, zamuti(kv, 3.5 * m))
        alfa_k = np.clip(meko * 1.05, 0, 1) ** 1.2 * (0.84 + 0.16 * jezgra) * (0.90 + 0.10 * oblaci)
        boja_k = pomijesaj(np.broadcast_to(boja(KVARC_SJENA), (H, W, 3)), boja(KVARC),
                           np.clip(0.70 + 0.35 * jezgra + 0.30 * oblaci, 0, 1))
        # tihi mliječni sjaj oko kvarca
        sjaj_k = povecaj(zamuti(kv[::korak, ::korak], 3), W, H) * 0.12 * (1.0 - kv)
        rgb = pomijesaj(rgb, boja(KVARC_SJENA), np.clip(sjaj_k, 0, 1))
        rgb = rgb + (boja_k - rgb) * alfa_k[..., None]
        # unutrašnjost kvarca ostaje čista: zlatne žile snopa ga ne presijecaju
        cisti_kvarc = glatko(0.90, 0.99, zamuti(kv, 4.0 * m))
        del kv, meko, oblaci, jezgra, alfa_k, boja_k, sjaj_k
    else:
        cisti_kvarc = 0.0

        # tanke bijele žile (sjajne, s tihim mliječnim rubom)
        bj = mk['bijelo'] * np.float32(min(1.0, bijele)) * (1.0 - 0.45 * miran)
        rgb = pomijesaj(rgb, boja(KVARC_SJENA), np.clip(zamuti(bj, 1.2 * m) * 0.35, 0, 1))
        rgb = pomijesaj(rgb, boja(BIJELA_ZILA), np.clip(bj, 0, 1))
        del bj
    javi('kvarc i bijele žile')

    # ── 6. zlato: metalno, s vlaknima, odsjajem i tamnijim mrljama ──
    zl = np.maximum(mk['zlato'] * (1.0 - 0.30 * miran), mk['zlato_sporedno'] * (1.0 - 0.72 * miran))
    zl = np.maximum(zl * (1.0 - 0.92 * cisti_kvarc), mk['zlato_obrub'] * (1.0 - 0.30 * miran))
    zl = np.clip(zl * np.float32(jacina), 0, 1)
    if zl.max() > 0:
        unutra = np.clip(zamuti(np.maximum(np.maximum(mk['zlato'], mk['zlato_sporedno']), mk['zlato_obrub']),
                                1.3 * m) * 1.6, 0, 1)
        vlakna = s.fbm(uu / 26, vv / 2.2, 3, pomak=7)                 # duge pruge duž žile
        listici = s.fbm(uu / 3.2, vv / 2.4, 3, pomak=8)               # sitna "folija"
        nijansa = np.clip(0.30 + 0.40 * unutra + 0.50 * vlakna, 0, 1)
        zlatna = pomijesaj(np.broadcast_to(boja(ZLATO_TAMNO), (H, W, 3)), boja(ZLATO), nijansa)
        odsjaj = np.clip((unutra - 0.45) * 1.3 + 0.8 * listici + 0.45 * vlakna - 0.22, 0, 1) * (0.40 + 0.60 * svjetlo)
        zlatna = pomijesaj(zlatna, boja(ZLATO_ODSJAJ), np.clip(odsjaj * (0.5 + 0.5 * sjaj), 0, 1))
        tamno = glatko(0.30, 0.70, -listici) * unutra * 0.30
        zlatna = pomijesaj(zlatna, boja(ZLATO_TAMNO) * 0.78, tamno)
        rgb = rgb + (zlatna - rgb) * zl[..., None]
        del unutra, vlakna, listici, nijansa, zlatna, odsjaj, tamno
    del zl
    javi('zlato')

    # ── 7. sitne iskrice u kamenu (kao na uzorku) i zrno ──
    rng2 = np.random.default_rng(seed + 7)
    broj = int(W * H / (9000 * m * m) * gustoca)
    iy, ix = rng2.integers(0, H, broj), rng2.integers(0, W, broj)
    jak = rng2.uniform(0.04, 0.35, broj).astype(np.float32) * (1.0 - 0.6 * miran[iy, ix])
    rgb[iy, ix] = rgb[iy, ix] + (boja('#c8cacc') - rgb[iy, ix]) * jak[:, None]
    zrno = rng2.normal(0, 0.0022, (H, W)).astype(np.float32)
    rgb = np.clip(rgb + zrno[..., None], 0, 1)
    javi('gotovo')
    return Image.fromarray((rgb * 255 + 0.5).astype(np.uint8), 'RGB')


def spremi(slika, put, kvaliteta=KVALITETA, najvise_kb=NAJVISE_KB):
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
    print(f'Spremljeno: {put}  ({slika.width} × {slika.height} px, {kb:.0f} KB, webp kvaliteta {q})')
    return kb, q


if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Tekstura crnog mramora sa zlatnim i bijelim žilama.')
    p.add_argument('--jacina', type=float, default=JACINA_ZLATA, help='jačina zlatnih žila (1 = kao na uzorku)')
    p.add_argument('--gustoca', type=float, default=GUSTOCA, help='broj sporednih žila, grana i pukotina')
    p.add_argument('--bijele', type=float, default=JACINA_BIJELIH, help='kvarc i bijele žile (0 = bez)')
    p.add_argument('--pukotine', type=float, default=JACINA_PUKOTINA, help='tanke pukotine (0 = bez)')
    p.add_argument('--sjaj', type=float, default=SJAJ, help='svjetlo kamena i odsjaj zlata')
    p.add_argument('--svjetlina', type=float, default=SVJETLINA_PODLOGE, help='svjetlina crne podloge')
    p.add_argument('--mir', type=float, default=MIR, help='mirnija sredina i donja trećina (0 = ne)')
    p.add_argument('--kut', type=float, default=KUT, help='smjer žila u stupnjevima')
    p.add_argument('--seed', type=int, default=SEED)
    p.add_argument('--naduzorkovanje', type=int, default=NADUZORKOVANJE, help='2 = brže, 3 = konačno')
    p.add_argument('--kvaliteta', type=int, default=KVALITETA)
    p.add_argument('--samo', default='', choices=['', '1', '2', 'mali'], help='izradi samo jednu datoteku')
    p.add_argument('--izlaz', default='', help='kamo spremiti (samo uz --samo)')
    p.add_argument('--zamucenje', type=float, default=MALI_ZAMUCENJE, help='zamućenje malog isječka u px (0 = oštar)')
    arg = p.parse_args()
    poslovi = {'1': (1, False, IZLAZ, NAJVISE_KB), '2': (2, False, IZLAZ_2X, NAJVISE_KB_2X),
               'mali': (1, True, IZLAZ_MALI, NAJVISE_KB_MALI)}
    for kljuc in ([arg.samo] if arg.samo else ['1', '2', 'mali']):
        mj, mali, put, gr = poslovi[kljuc]
        print(f'{os.path.basename(put)}:')
        slika = izradi(mj, mali, arg.jacina, arg.gustoca, arg.bijele, arg.pukotine, arg.sjaj,
                       arg.svjetlina, arg.mir, arg.seed, arg.naduzorkovanje, arg.kut)
        if mali and arg.zamucenje > 0:
            slika = slika.filter(ImageFilter.GaussianBlur(arg.zamucenje))   # mali isječak je zamućen (tekst preko njega)
        spremi(slika, (arg.izlaz if arg.samo and arg.izlaz else put), arg.kvaliteta, gr)
