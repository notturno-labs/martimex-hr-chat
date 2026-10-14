# Sastavi ulaz.js iz pocetna-chata.js: postavke, vremenski tijek, stil,
# početni ekran i veza s Voiceflowom ostaju isti; oblici od točkica, shaderi
# i WebGL animacija se izbace, a umjesto njih je 3D animacija (animacija3d.js).
# Pokretanje iz ove mape: python3 sastavi-ulaz.py
import re, pathlib
ovdje = pathlib.Path(__file__).resolve().parent
izvor = (ovdje / '../../../pocetna-chata.js').read_text(encoding='utf-8')
L = izvor.split('\n')

def red(tekst, od=0):
    for i in range(od, len(L)):
        if tekst in L[i]:
            return i
    raise SystemExit('nema: ' + tekst)

oblici = red('//  OBLICI — objekt, flakon i natpis') - 1
tijek = red('//  VREMENSKI TIJEK') - 1
animacija = red('//  ANIMACIJA — WebGL platno') - 1
stil = red('//  STIL — ide u shadow root chata') - 1

glava = L[:oblici]
# BAZA: skripta je u pokusi/stvarno/, ostalo (fontovi, logotipi, Penhaligon) je u mapi repozitorija
g = '\n'.join(glava)
stari = """    const BAZA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/pocetna-chata.js')
      .replace(/[?#].*$/, '').replace(/[^\\/]*$/, '');"""
assert stari in g
for st_, novo in [
    ("      objekt: 3.4,            // živi AI objekt\n", "      objekt: 3.4,            // živi AI objekt (POKUS: izbačen, vidi objekt: false)\n"),
    ("      marke: 9,               // logotipi: prva četiri reda, pomak zida prema gore, zadnja četiri reda\n",
     "      marke: 6.5,             // logotipi (POKUS: svih 24 u jednom kadru, bez pomicanja zida)\n"),
    ("    ponavljaj: true,          // false → animacija stane na natpisu MARTIMEX\n",
     "    ponavljaj: true,          // false → animacija stane na natpisu MARTIMEX\n\n    // POKUS: krug bez AI objekta (flakon nastaje pri otvaranju, a natpis se na\n    // kraju kruga pretopi natrag u flakon); true → s objektom, kao prije\n    objekt: false,\n")]:
    assert st_ in g, st_
    g = g.replace(st_, novo)
g = g.replace(stari, """    // (POKUS: skripta je u mapi pokusi/stvarno/ uz modeli.js, a fontovi,
    // logotipi i Penhaligon bočice su u mapi repozitorija, dvije razine iznad)
    const BAZA_POKUSA = ((document.currentScript && document.currentScript.src) || 'https://notturno-labs.github.io/martimex-hr-chat/pokusi/stvarno/pocetna-chata-stvarno.js')
      .replace(/[?#].*$/, '').replace(/[^\\/]*$/, '');
    const BAZA = BAZA_POKUSA + '../../';""")
g = g.replace("  //  MARTIMEX — početni ekran chata s Marti (v3)\n  //", """  //  MARTIMEX — početni ekran chata s Marti (v3)
  //
  //  POKUS "STVARNO" (pokusi/stvarno/): isti početni ekran i isti krug, ali
  //  oblici su pravi 3D predmeti (three.js: staklo, tekućina, zlato, papir,
  //  metalna slova) umjesto točkica; vidi izvor/animacija3d.js i
  //  pokusi/README.md. Ova datoteka je izgrađena (npm run izgradi u mapi
  //  izvor/), ne mijenja se ručno. Na martimex.hr se ne učitava.
  //""", 1)

dodatak = """
    // (iz izbačenih dijelova pocetna-chata.js: što trebaju tijek, stil i 3D animacija)
    const SIRINA_NATPISA = 2.25;   // širina natpisa MARTIMEX
    const RAZMAK_SLOVA = 0.14;     // razmak među slovima natpisa (udio veličine fonta)
    const TEZINA_NATPISA = 700;    // debljina Cormoranta u natpisu
    const RUB_NATPISA = 22;        // najmanji razmak natpisa od ruba prozora (px)
    const OBLIK = { objekt: 0, flakon: 1, marke: 2, pen: 3, natpis: 4 };
    function ucitajSkriptu(src) {
      return new Promise(function (gotovo) {
        const s = document.createElement('script');
        const rok = setTimeout(function () { gotovo(false); }, 15000);
        s.src = src;
        s.async = true;
        s.onload = function () { clearTimeout(rok); gotovo(true); };
        s.onerror = function () { clearTimeout(rok); gotovo(false); };
        document.head.appendChild(s);
      });
    }

"""
tijekD = '\n'.join(L[tijek:animacija])

# POKUS: krug bez AI objekta (P.objekt = false): pojava složi prvi oblik u
# krugu (flakon), a natpis se na kraju kruga pretopi natrag u njega; okret
# flakona teče bez skoka i kroz početak kruga
def zakrpa(t, stari, novi):
    assert stari in t, stari
    return t.replace(stari, novi)
tijekD = zakrpa(tijekD, "].filter(function (o) { return (imaMarke || o[0] !== 'marke') && (imaPen || o[0] !== 'pen'); });",
  "].filter(function (o) { return (imaMarke || o[0] !== 'marke') && (imaPen || o[0] !== 'pen') && (P.objekt !== false || o[0] !== 'objekt'); });\n      const PRVI = KRUG[0][0];   // (POKUS) prvi oblik u krugu: nastaje pri pojavi, a u njega se pretopi zadnji")
tijekD = zakrpa(tijekD, "const st = { od: OBLIK.objekt, do: OBLIK.objekt, prog: 0,", "const st = { od: OBLIK[PRVI], do: OBLIK[PRVI], prog: 0,")
tijekD = zakrpa(tijekD, "          st.A = st.B = [wO * (D / 2 + t - pojava), nagibO, njihanjeO];",
  "          st.A = st.B = PRVI === 'flakon' ? [kutFlakona(t - pojava - POCETAK_FLAKONA), NAGIB, 0] : [wO * (D / 2 + t - pojava), nagibO, njihanjeO];")
tijekD = zakrpa(tijekD, "        if (f.oblik === 'natpis') st.B = [kutObjekta(c - L), nagibO * e, njihanjeO * e];",
  "        if (f.oblik === 'natpis' && f.u === 'objekt') st.B = [kutObjekta(c - L), nagibO * e, njihanjeO * e];\n" +
  "        // (POKUS) zadnji oblik se pretapa u flakon s početka sljedećeg kruga: okret kao na početku kruga\n" +
  "        if (f.u === 'flakon' && PRVI === 'flakon' && f.od + f.d > L - 1e-6) st.B = [kutFlakona(c - L - POCETAK_FLAKONA), NAGIB, 0];")
omot = """
    // ═══════════════════════════════════════════════════════════════════
    //  ANIMACIJA — pravi 3D (vidi animacija3d.js)
    // ═══════════════════════════════════════════════════════════════════
    function napraviAnimaciju(platno, scena, dogadaji) {
      return napraviAnimaciju3D(platno, scena, dogadaji, {
        P: P, B: B, napraviTijek: napraviTijek, OBLIK: OBLIK, BAZA: BAZA, BAZA_POKUSA: BAZA_POKUSA,
        MIRNO: MIRNO, MOBITEL: MOBITEL, MIS: MIS, VELICINA: VELICINA, ucitajSkriptu: ucitajSkriptu,
        SIRINA_NATPISA: SIRINA_NATPISA, RUB_NATPISA: RUB_NATPISA
      });
    }

"""
rep = '\n'.join(L[stil:])
for stara in ["      OBLICI = null;                                  // oblici više ne trebaju (oslobodi memoriju)\n",
              "      if (PEN_PREKID) PEN_PREKID.da = true;           // gradnja Penhaligon bočica (ako još traje) staje\n",
              "      PEN_OBLIK = null; PEN_PREKID = null;\n",
              "      if (MAR_PREKID) MAR_PREKID.da = true;           // i gradnja logotipa\n",
              "      MAR_OBLIK = null; MAR_PREKID = null; MAR_SLIKA = null;\n"]:
    assert stara in rep, stara
    rep = rep.replace(stara, '')
izlaz = "import { napraviAnimaciju3D } from './animacija3d.js';\n\n" + g + '\n' + dodatak + tijekD + '\n' + omot + rep
(ovdje / 'ulaz.js').write_text(izlaz, encoding='utf-8')
print('ulaz.js', len(izlaz.split(chr(10))), 'redaka')
