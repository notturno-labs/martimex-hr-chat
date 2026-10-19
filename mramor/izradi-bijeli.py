#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Izradi teksturu BIJELOG CALACATTA GOLD MRAMORA (mramor/bijeli.webp).

Uzor je pod i zid iza pulta u Martimex poslovnici: topla bijela polirana
podloga s mekim oblačastim sjenama, široke dimljene sive žile (prozirne
prema rubovima, s tamnijom jezgrom), zlatne/oker žile i zlatni nanosi uz
njih koji teku dijagonalno i granaju se, te tanke oštre sive pukotine.

Kako nastaje (slojevi, odozdo prema gore):
  1. podloga: topla bijela s blagim oblačastim sjenama (meki šum),
  2. tri obitelji žila: izohipse iskrivljenih dijagonalnih polja; iskrivljenje
     je ograničeno da se žile ne kovrčaju, a mreža lomova (Voronoi) im daje
     uglate prijelome,
  3. zlatne i sive krhotine uz žile: oštar, razlomljen rub, ravno odrezane
     na lomovima krupnije mreže, iznutra prugaste, uglavnom s jedne strane žile,
  4. sivi dim (prozirna traka) i tamnija jezgra svake žile,
  5. tanke oštre pukotine i duge tanke linije, dijelom sa zlatnim tragom,
  6. sitna zrnatost (kristali).

Tekstura je BEŠAVNA (lijevi rub se nastavlja na desni, gornji na donji),
pa se smije ponavljati (background-repeat) i uvećavati.

Samo numpy + PIL, fiksni seed: isti parametri uvijek daju istu sliku
(svaki sloj ima svoj generator, pa izmjena jednog sloja ne pomiče ostale).

Primjeri:
  python3 mramor/izradi-bijeli.py                     # zadano: mramor/bijeli.webp
  python3 mramor/izradi-bijeli.py --zile 0.5          # nježnije žile (mirnija pozadina)
  python3 mramor/izradi-bijeli.py --zile 1.5          # izraženije žile
  python3 mramor/izradi-bijeli.py --zile 0            # samo topla bijela podloga
  python3 mramor/izradi-bijeli.py --zlato 0           # samo sive žile (Statuario)
  python3 mramor/izradi-bijeli.py --zlato 1.5         # više zlata
  python3 mramor/izradi-bijeli.py --izlaz /tmp/m.png  # PNG za pregled

Svjetlije / tamnije: --svjetlina 1.02 (svjetlije) ili 0.96 (tamnije) množi
cijelu sliku; u CSS-u se isto dobije gradijentom preko slike.
"""

import argparse
import os
import zlib

import numpy as np
from PIL import Image

# ---------------------------------------------------------------- POSTAVKE --
# Boje (sRGB hex). Podloga ide od TOPLA_BIJELA (najsvjetlije) do PODLOGA_SJENA
# (oblačaste sjene u kamenu).
TOPLA_BIJELA = '#fbfaf7'
PODLOGA = '#f6f3ee'
PODLOGA_SJENA = '#e9e4dc'
SIVA_ZILA = '#b9b3aa'        # široke meke sive žile (dim)
SIVA_JEZGRA = '#8e877d'      # tamnija jezgra sive žile
TANKA_LINIJA = '#7f786f'     # tanke oštre sive pukotine
ZLATNA_ZILA = '#c9a46a'      # zlatna/oker žila
ZLATNI_NANOS = '#d9bb8c'     # svijetli zlatni nanos uz žile

VELICINA = 900               # px (kvadrat)
SJEME = 23                   # fiksni seed (odabran među više njih: ujednačen raspored)
KVALITETA = 92               # WebP kvaliteta (0-100); ~40 KB, bez pruga u mekim prijelazima
NAJVISE_KB = 110             # ako je datoteka veća, kvaliteta se smanjuje


# ------------------------------------------------------------- POMOĆNICI --
def hex_u_rgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255.0


def u_linearno(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def u_srgb(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def sum_fft(rng, n, nagib, f_min=1.0, f_max=None, smjer=None, izduzenje=1.0):
    """Bešavni šum (periodičan na rubovima) iz filtriranog bijelog šuma.

    nagib    -- spektar 1/f^nagib (veći = mekši, oblačastiji)
    f_min    -- najniža frekvencija (u periodima po slici)
    f_max    -- meka gornja granica frekvencija
    smjer    -- kut (rad) duž kojeg su oblici izduženi
    izduzenje-- koliko su oblici izduženi duž smjera (1 = okrugli)
    """
    bijeli = rng.standard_normal((n, n)).astype(np.float32)
    F = np.fft.fft2(bijeli)
    k = np.fft.fftfreq(n) * n
    kx, ky = np.meshgrid(k, k)
    if smjer is not None:
        ux, uy = np.cos(smjer), np.sin(smjer)
        uz = kx * ux + ky * uy          # frekvencije duž smjera
        po = -kx * uy + ky * ux         # okomito na smjer
        kk = np.sqrt((uz * izduzenje) ** 2 + po ** 2)
    else:
        kk = np.sqrt(kx ** 2 + ky ** 2)
    amp = np.zeros_like(kk)
    m = kk >= f_min
    amp[m] = kk[m] ** (-nagib)
    if f_max:
        amp *= np.exp(-(kk / f_max) ** 2)
    out = np.real(np.fft.ifft2(F * amp)).astype(np.float32)
    out -= out.mean()
    out /= out.std() + 1e-9
    return out


def uzorkuj(polje, X, Y):
    """Bilinearno uzorkovanje periodičnog polja u (X, Y) s omatanjem rubova."""
    n = polje.shape[0]
    x0 = np.floor(X).astype(np.int64)
    y0 = np.floor(Y).astype(np.int64)
    fx = (X - x0).astype(np.float32)
    fy = (Y - y0).astype(np.float32)
    x0 %= n
    y0 %= n
    x1 = (x0 + 1) % n
    y1 = (y0 + 1) % n
    a = polje[y0, x0] * (1 - fx) + polje[y0, x1] * fx
    b = polje[y1, x0] * (1 - fx) + polje[y1, x1] * fx
    return a * (1 - fy) + b * fy


def zamuti(polje, sigma):
    """Gaussovo zamućenje preko FFT-a (periodično, bez rubnih artefakata)."""
    n = polje.shape[0]
    k = np.fft.fftfreq(n)
    kx, ky = np.meshgrid(k, k)
    g = np.exp(-2 * (np.pi * sigma) ** 2 * (kx ** 2 + ky ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(polje) * g)).astype(np.float32)


def glatko(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def gradijent(polje, skok=False):
    """Veličina gradijenta periodičnog polja (centralne razlike s omatanjem).
    skok=True: polje na rubu slike "skače" za cijeli broj (polja žila), pa se
    taj skok izbaci iz razlika -- inače bi na rubu nastala lažna crta (šav)."""
    gx = np.roll(polje, -1, 1) - np.roll(polje, 1, 1)
    gy = np.roll(polje, -1, 0) - np.roll(polje, 1, 0)
    if skok:
        gx -= np.round(gx)
        gy -= np.round(gy)
    gx *= 0.5
    gy *= 0.5
    return np.sqrt(gx * gx + gy * gy) + 1e-6


def voronoi_rubovi(rng, n, X, Y, broj, smjer, izduzenje):
    """Udaljenost (px) do najbližeg ruba Voronojeve ćelije na torusu, u
    izduženoj metrici (ćelije izdužene duž smjera) -> mreža pukotina.
    Vraća (udaljenost do ruba, indeks ćelije, udaljenost do središta,
    poravnatost ruba s tokom 0..1)."""
    px = rng.uniform(0, n, broj).astype(np.float32)
    py = rng.uniform(0, n, broj).astype(np.float32)
    ux, uy = np.cos(smjer), np.sin(smjer)
    sa = 1.0 / izduzenje            # duž smjera udaljenost "kraća"

    def metrika(dx, dy):
        a = dx * ux + dy * uy
        b = -dx * uy + dy * ux
        return np.sqrt((a * sa) ** 2 + b ** 2)

    h = n / 2.0
    d1 = np.full(X.shape, np.inf, np.float32)
    d2 = np.full(X.shape, np.inf, np.float32)
    i1 = np.zeros(X.shape, np.int32)
    i2 = np.zeros(X.shape, np.int32)
    for i in range(broj):
        dx = (X - px[i] + h) % n - h
        dy = (Y - py[i] + h) % n - h
        d = metrika(dx, dy)
        manje1 = d < d1
        manje2 = (~manje1) & (d < d2)
        d2 = np.where(manje1, d1, np.where(manje2, d, d2))
        i2 = np.where(manje1, i1, np.where(manje2, i, i2))
        d1 = np.where(manje1, d, d1)
        i1 = np.where(manje1, i, i1)
    # udaljenost između dviju najbližih točaka (na torusu)
    ddx = (px[i1] - px[i2] + h) % n - h
    ddy = (py[i1] - py[i2] + h) % n - h
    dd = metrika(ddx, ddy) + 1e-6
    rub = (d2 * d2 - d1 * d1) / (2 * dd)
    # smjer ruba: koliko je rub poravnat s tokom (1 = duž toka, 0 = poprijeko)
    da = (ddx * ux + ddy * uy) * sa
    db = -ddx * uy + ddy * ux
    duz = np.abs(db / sa) / (np.sqrt((db / sa) ** 2 + (da * sa) ** 2) + 1e-6)
    return rub, i1, d1, duz


# ----------------------------------------------------------------- MRAMOR --
def izradi(n=VELICINA, sjeme=SJEME, zile=1.0, zlato=1.0, svjetlina=1.0):
    def R(ime):
        """Zaseban generator za svaki sloj: izmjena jednog sloja ne mijenja ostale."""
        return np.random.default_rng([sjeme, zlib.crc32(ime.encode('utf-8'))])

    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
    smjer = np.deg2rad(-42.0)       # žile se dižu dijagonalno (dolje-lijevo -> gore-desno)

    # --- iskrivljenje prostora (domain warp), blago da se žile ne "presavijaju"
    w1x = sum_fft(R('iskrivljenje-1x'), n, 2.4, 1, 5)
    w1y = sum_fft(R('iskrivljenje-1y'), n, 2.4, 1, 5)
    w2x = sum_fft(R('iskrivljenje-2x'), n, 1.6, 2, 24)
    w2y = sum_fft(R('iskrivljenje-2y'), n, 1.6, 2, 24)
    X1 = xx + 30 * w1x + 6 * w2x
    Y1 = yy + 30 * w1y + 6 * w2y

    # --- oblačasta podloga (meke sjene u kamenu)
    oblak = uzorkuj(sum_fft(R('oblak-1'), n, 2.6, 1, 10), X1, Y1) * 0.8
    oblak += 0.35 * sum_fft(R('oblak-2'), n, 1.8, 3, 40, smjer, 1.6)
    oblak = glatko(-1.2, 2.0, oblak)

    # --- mreža lomova (Voronoi, ćelije izdužene duž smjera): daje uglate
    #     prijelome žila, tanke pukotine i rubove zlatnih krhotina
    BROJ_CEL = 46
    Xp = xx + 10 * w2x + 26 * w1y
    Yp = yy + 10 * w2y + 26 * w1x
    rub, celija, d1, duz = voronoi_rubovi(R('lomovi'), n, Xp, Yp, BROJ_CEL, smjer, 3.2)
    d1 = zamuti(d1, 4.0)                  # ublaži nabore (uglato, ali bez oštrih brazdi)

    # --- glavne žile: izohipse iskrivljenog dijagonalnog polja
    #     F = (x + y)/n + iskrivljenje; žila je gdje je F blizu cijelog broja.
    #     Cjelobrojni koeficijenti -> polje je periodično (bešavno).
    #     Iskrivljenje je ograničeno (niske frekvencije, mala amplituda) da se
    #     izohipse ne presavijaju u petlje -- prava žila teče, ne kovrča se.
    nis = sum_fft(R('zila-a'), n, 2.8, 1, 4, smjer, 2.0)
    F = (xx + yy) / n
    Fw = F + 0.12 * uzorkuj(nis, X1, Y1) + 0.10 * (d1 / n)   # d1 -> uglati prijelomi
    # druga obitelj žila pod drugim kutom -> grananje i križanje
    nis_g = sum_fft(R('zila-b'), n, 2.6, 1, 4)
    G = (2 * xx - yy) / n
    Gw = G + 0.18 * uzorkuj(nis_g, X1, Y1) + 0.12 * (d1 / n)
    # treća obitelj: blaže nagnuta, gotovo usporedna s glavnom -> gušći tok
    nis_h = sum_fft(R('zila-c'), n, 2.6, 1, 4, smjer, 2.0)
    H = (xx + 2 * yy) / n
    Hw = H + 0.18 * uzorkuj(nis_h, X1, Y1) + 0.08 * (d1 / n)

    def udaljenost(polje, pomak):
        d = np.abs(polje - pomak - np.round(polje - pomak))
        return d / gradijent(polje, skok=True)     # udaljenost od žile u px

    mod_a = np.exp(0.6 * sum_fft(R('sirina-a'), n, 1.8, 1, 10))   # širina žile se mijenja duž toka
    mod_b = np.exp(0.6 * sum_fft(R('sirina-b'), n, 1.8, 1, 10))
    jak_a = glatko(-1.1, 0.5, sum_fft(R('jacina-a'), n, 2.0, 1, 8))   # žila jača / blijedi
    jak_b = glatko(-0.3, 1.0, sum_fft(R('jacina-b'), n, 2.0, 1, 8))
    jak_c = glatko(-0.2, 1.1, sum_fft(R('jacina-c'), n, 2.0, 1, 8))
    mod_c = np.exp(0.6 * sum_fft(R('sirina-c'), n, 1.8, 1, 10))

    dA = udaljenost(Fw, 0.0)
    dB = udaljenost(Gw, 0.5)
    sA = 11.0 * mod_a
    sB = 6.0 * mod_b
    dC = udaljenost(Hw, 0.5)
    sC = 4.5 * mod_c

    # dimljene pruge unutar sivih žila (izduženo duž toka)
    pruge = glatko(-0.8, 1.2, uzorkuj(sum_fft(R('pruge'), n, 1.3, 4, 90, smjer, 6.0), X1, Y1))

    # profil sive žile: ravna prozirna traka (ne "cijev" sa sjenom) + mekani rub
    def traka(d, s):
        return 0.75 * np.exp(-(d / s) ** 4) + 0.25 * np.exp(-(d / (s * 2.2)) ** 2)

    dim_a = traka(dA, sA * 1.5) * jak_a * (0.35 + 0.65 * pruge)
    jez_a = np.exp(-(dA / (0.7 + 0.08 * sA)) ** 2) * jak_a
    dim_b = traka(dB, sB * 1.5) * jak_b * (0.35 + 0.65 * pruge)
    jez_b = np.exp(-(dB / (0.6 + 0.07 * sB)) ** 2) * jak_b
    dim_c = traka(dC, sC * 1.5) * jak_c * (0.3 + 0.7 * pruge)
    jez_c = np.exp(-(dC / (0.55 + 0.07 * sC)) ** 2) * jak_c

    # --- tanke oštre pukotine: dio Voronojevih rubova (prednost onima duž toka)
    rijetko = glatko(0.15, 0.75, sum_fft(R('rijetko'), n, 1.7, 2, 16, smjer, 2.0))
    rijetko *= 0.15 + 0.85 * glatko(0.6, 0.92, duz)
    # jačina linije se mijenja duž nje (nestaje i ponovo izranja)
    mod_l = glatko(-0.9, 0.7, sum_fft(R('jacina-linija'), n, 1.4, 3, 60, smjer, 2.0))
    pukotine = np.exp(-(rub / (0.5 + 0.3 * mod_l)) ** 2) * rijetko * (0.35 + 0.65 * mod_l)
    pukotine_dim = np.exp(-(rub / 2.5) ** 2) * rijetko * mod_l

    # --- duge tanke linije uz tok (izohipse jako izduženog šuma)
    dug = uzorkuj(sum_fft(R('dugo'), n, 2.0, 1, 14, smjer, 5.0), X1, Y1) + 0.5 * (d1 / n)
    gd = gradijent(dug)
    linije = np.zeros_like(dug)
    for razina in (-1.0, 0.1, 1.2):
        d_l = np.abs(dug - razina) / gd
        linije = np.maximum(linije, np.exp(-(d_l / 0.55) ** 2))
    linije *= glatko(0.0, 1.0, sum_fft(R('dugo-maska'), n, 1.8, 1, 12, smjer, 2.0))
    linije *= 0.25 + 0.75 * glatko(-0.8, 0.8, sum_fft(R('dugo-jacina'), n, 1.4, 3, 60, smjer, 2.0))

    # --- krhotine (zlatne i sive mrlje) uz žile
    #     Oblik: oštar, razlomljen rub (prag šuma sa sitnim frekvencijama),
    #     uz lom Voronojeve ćelije ravno odrezan; iznutra ton varira.
    # krhotine dijeli krupnija mreža lomova (veće ćelije -> klinovi, ne pravokutnici)
    BROJ_KRH = 20
    Xk = xx + 14 * w2y + 30 * w1x
    Yk = yy + 14 * w2x + 30 * w1y
    rub_k, krh, _, _ = voronoi_rubovi(R('krhotine'), n, Xk, Yk, BROJ_KRH, smjer, 2.6)
    rk = R('krhotine-tezine')
    tezina_cel = rk.uniform(0.0, 1.0, BROJ_KRH).astype(np.float32)
    strana_cel = np.where(rk.uniform(0, 1, BROJ_KRH) < 0.5, -1.0, 1.0).astype(np.float32)[krh]
    # s koje je strane žile piksel (+1 / -1); krhotina je u ćeliji jača na jednoj strani
    sA_ = np.sign(Fw - np.round(Fw))
    sB_ = np.sign((Gw - 0.5) - np.round(Gw - 0.5))
    sC_ = np.sign((Hw - 0.5) - np.round(Hw - 0.5))

    def blizu(k, jednostrano=0.0):
        f = lambda sg: 1.0 - jednostrano * 0.5 * (1 - sg * strana_cel)
        return np.maximum.reduce([np.exp(-(dA / (sA * k)) ** 2) * jak_a * f(sA_),
                                  0.8 * np.exp(-(dB / (sB * k)) ** 2) * jak_b * f(sB_),
                                  0.7 * np.exp(-(dC / (sC * k)) ** 2) * jak_c * f(sC_)])

    plamen = uzorkuj(sum_fft(R('plamen'), n, 1.5, 2, 70, smjer, 3.5), X1, Y1)
    zl_pruge = glatko(-1.2, 0.9, uzorkuj(sum_fft(R('zlatne-pruge'), n, 1.1, 6, 160, smjer, 7.0), X1, Y1))
    ton = glatko(-1.3, 1.0, sum_fft(R('ton'), n, 1.8, 2, 30, smjer, 2.5))
    zl_cel = np.where(tezina_cel < 0.30, 0.0, 0.55 + 0.45 * tezina_cel)[krh]
    sv_cel = np.where(rk.uniform(0, 1, BROJ_KRH) < 0.6, 0.0, 1.0).astype(np.float32)[krh]
    # za meke prijelaze: zamućene težine ćelija (da lom ne reže meki dim ravnom crtom)
    zl_cel_m = zamuti(zl_cel, 14.0)

    oblik = plamen * 0.28 + blizu(5.0, 0.7) * 1.15
    zlato_ostro = glatko(0.60, 0.68, oblik) * zl_cel
    zlato_meko = glatko(0.35, 0.68, oblik) * zl_cel_m
    nanos = zlato_ostro * (0.45 + 0.55 * ton) * (0.7 + 0.3 * zl_pruge) + 0.18 * zlato_meko
    nanos = zamuti(nanos, 0.6)
    # tamniji zlatni ton uz lom ćelije i uz žilu
    nanos_jezgra = zlato_ostro * (np.exp(-(rub_k / 7.0) ** 2) + 0.6 * jez_a)

    # sivi dim: sive mrlje (često obrub oko zlata) s prugama iznutra
    plamen_s = uzorkuj(sum_fft(R('plamen-sivi'), n, 1.5, 2, 70, smjer, 3.0), X1, Y1)
    oblik_s = plamen_s * 0.28 + blizu(6.0, -0.7) * 1.1
    siva_ostro = glatko(0.58, 0.72, oblik_s) * sv_cel
    siva_meko = glatko(0.30, 0.68, oblik_s)
    obrub = glatko(0.52, 0.60, oblik) * (1 - glatko(0.60, 0.68, oblik)) * zl_cel_m
    obrub *= glatko(-0.6, 0.8, plamen_s)          # obrub je isprekidan, ne prati zlato svuda
    siva_mrlja = (siva_ostro * (0.2 + 0.8 * pruge) * 0.55 + 0.12 * siva_meko + 0.5 * obrub)
    siva_mrlja = zamuti(siva_mrlja, 0.6)

    lom_krh = np.exp(-(rub_k / 0.6) ** 2) * glatko(0.05, 0.35, zamuti(nanos, 3.0))
    # zlatne crtice: uz dio tankih pukotina i linija teče uski zlatni trag
    zl_maska = glatko(0.2, 0.9, sum_fft(R('zlatne-crtice'), n, 1.5, 3, 50, smjer, 3.0))
    zlatne_crte = np.maximum(np.exp(-(rub / 2.2) ** 2) * rijetko * mod_l,
                             zamuti(linije, 1.2) * 1.6) * zl_maska
    zlatna_jezgra = (jez_a * glatko(0.2, 0.9, plamen) + 0.9 * pukotine * glatko(0.05, 0.4, nanos)
                     + 0.8 * lom_krh)

    # ------------------------------------------------------------ BOJE --
    L = u_linearno
    bijela = L(hex_u_rgb(TOPLA_BIJELA))
    podloga = L(hex_u_rgb(PODLOGA))
    sjena = L(hex_u_rgb(PODLOGA_SJENA))

    o = oblak[..., None]
    boja = bijela * (1 - o) + podloga * o
    oblak_dub = (glatko(0.35, 1.0, zamuti(oblak, 6.0)) * 0.32)[..., None]
    boja = boja * (1 - oblak_dub) + sjena * oblak_dub

    def pomnozi(boja, hexboja, alfa):
        c = L(hex_u_rgb(hexboja))
        a = np.clip(alfa, 0, 1)[..., None]
        return boja * (1 - a + a * c)

    z = zile
    zl = zlato
    boja = pomnozi(boja, SIVA_ZILA, z * 0.65 * siva_mrlja)
    boja = pomnozi(boja, ZLATNI_NANOS, z * zl * 0.75 * zlatne_crte)
    boja = pomnozi(boja, ZLATNI_NANOS, z * zl * 0.95 * nanos)
    boja = pomnozi(boja, ZLATNA_ZILA, z * zl * 0.30 * nanos_jezgra)
    boja = pomnozi(boja, SIVA_ZILA, z * (0.75 * dim_a + 0.60 * dim_b + 0.55 * dim_c + 0.15 * pukotine_dim))
    boja = pomnozi(boja, ZLATNA_ZILA, z * zl * 0.70 * zlatna_jezgra)
    boja = pomnozi(boja, SIVA_JEZGRA, z * (0.60 * jez_a * (1 - 0.7 * glatko(0.2, 0.9, plamen))
                                           + 0.55 * jez_b + 0.50 * jez_c))
    boja = pomnozi(boja, TANKA_LINIJA, z * (0.55 * pukotine + 0.40 * linije))

    # sitna zrnatost kamena (kristali; vrlo blago, i da nema prugastih prijelaza)
    zrno = zamuti(R('zrno').standard_normal((n, n)).astype(np.float32), 0.6)
    zrno /= zrno.std() + 1e-9
    kristali = zamuti(R('kristali').standard_normal((n, n)).astype(np.float32), 1.6)
    kristali /= kristali.std() + 1e-9
    boja = boja * (1 + (0.005 * zrno + 0.006 * kristali)[..., None])

    boja = boja * svjetlina
    srgb = u_srgb(boja)
    return (srgb * 255 + 0.5).astype(np.uint8)


def spremi(rgb, izlaz, kvaliteta=KVALITETA, najvise_kb=NAJVISE_KB):
    slika = Image.fromarray(rgb, 'RGB')
    if izlaz.lower().endswith('.webp'):
        q = kvaliteta
        while True:
            slika.save(izlaz, 'WEBP', quality=q, method=6)
            kb = os.path.getsize(izlaz) / 1024
            if kb <= najvise_kb or q <= 40:
                break
            q -= 3
        return kb, q
    slika.save(izlaz)
    return os.path.getsize(izlaz) / 1024, None


def main():
    mapa = os.path.dirname(os.path.abspath(__file__))
    p = argparse.ArgumentParser(description='Tekstura bijelog Calacatta Gold mramora.')
    p.add_argument('--zile', type=float, default=1.0,
                   help='jačina žila (0 = gotovo čista bijela podloga, 1 = zadano, 1.5 = jako)')
    p.add_argument('--zlato', type=float, default=1.0,
                   help='koliko zlata u žilama i nanosima (0 = samo sive žile)')
    p.add_argument('--svjetlina', type=float, default=1.0,
                   help='množi cijelu sliku (0.96 tamnije, 1.02 svjetlije)')
    p.add_argument('--velicina', type=int, default=VELICINA)
    p.add_argument('--sjeme', type=int, default=SJEME)
    p.add_argument('--kvaliteta', type=int, default=KVALITETA)
    p.add_argument('--izlaz', default=os.path.join(mapa, 'bijeli.webp'))
    a = p.parse_args()

    rgb = izradi(a.velicina, a.sjeme, a.zile, a.zlato, a.svjetlina)
    kb, q = spremi(rgb, a.izlaz, a.kvaliteta)
    print('%s  %dx%d  %.1f KB%s' % (a.izlaz, a.velicina, a.velicina, kb,
                                    '  (WebP q=%d)' % q if q else ''))


if __name__ == '__main__':
    main()
