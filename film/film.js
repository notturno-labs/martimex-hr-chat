(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — film Naxos uživo (animacija početnog ekrana chata)
  //
  //  Sastojci mirisa s fotografije (limun s listovima, med, saće, kora
  //  limete, bijeli cvjetovi) lebde složeni na crnoj podlozi, podignu se i
  //  zavrte u krug; limun se pritom okreće oko svoje osi. U sredini vrtloga
  //  skupi se zlatno svjetlo i iz njega nastane bočica Xerjoff Naxos.
  //  Vrtlog se rasprsne prema kameri, a oko bočice se izoštri prizor
  //  (staklenka meda, limuni, cvjetovi naranče) u mekom krugu svjetla;
  //  kamera polako ulazi (bliži predmeti se pomiču više), preko zlatnog
  //  čepa prijeđe odsjaj, med teče, u suncu lebdi prašina. Zatim se prizor
  //  povuče u tamu, bočica se rastopi u svjetlo, a sastojci doplove natrag
  //  i slože se. Krug traje 14,6 s i ponavlja se bez šava.
  //
  //  Crta se uživo u WebGL-u iz komada fotografija (nema video datoteke):
  //  dubinska oštrina i izoštravanje prizora iz razina zamućenja, pokretno
  //  zamućenje iz podkadrova, vrtnja limuna preslikavanjem kore na elipsoid
  //  (svjetlo stoji), pomak kamere prema karti dubine prizora. Slike i
  //  putanje su u film-podaci.js (izrađeno, ne mijenja se ručno).
  //
  //  Modul učitava pocetna-chata.js (postavka animacija: 'film').
  //   - pripremi: samo prvi kadar (slika, ~60 KB); podaci (~500 KB) se
  //     preuzmu kad se chat prvi put otvori, a do tada stoji prvi kadar
  //   - svako otvaranje chata: film kreće ispočetka; zatvaranje ga zaustavi
  //   - "Smanji pokrete" ili ušteda podataka: umjesto filma stoji završni
  //     prizor (bočica u prizoru), bez preuzimanja podataka
  //   - ako WebGL ne radi ili se podaci ne učitaju: završni prizor
  //   - na sporom uređaju se smanje razlučivost i broj podkadrova
  //   - nakon "POČETAK" kadar se lagano poveća i nestane
  // ═════════════════════════════════════════════════════════════════════
  'use strict';
  if (window.MX_FILM) return;

  const SKRIPTA = (document.currentScript && document.currentScript.src) || '';
  const MAPA = SKRIPTA.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');

  // ─────────────────────────────────────────────────────────────────────
  //  POSTAVKE
  // ─────────────────────────────────────────────────────────────────────
  const DATOTEKE = {
    podaci: 'film-podaci.js',          // slike i putanje (učita se pri prvom otvaranju chata)
    pocetak: 'film-pocetak.jpg',       // prvi kadar: stoji dok se podaci ne učitaju
    mirno: 'film-mirno.jpg'            // završni prizor: "Smanji pokrete", ušteda podataka, greška
  };
  const VERZIJA = '1';                 // promijeni kad se podaci ili slike zamijene
  const VELICINA = 1.0;                // veličina kadra: 1 = širina prozora chata (najviše 1,2 x visina prostora animacije)
  const STANI_NA = 10.6;               // s: gdje film stane ako je ponavljaj: false (bočica u prizoru)
  const IZLAZ_MS = 650;                // trajanje nestajanja nakon "POČETAK"
  const NAJVISE_DPR = 2;               // gustoća piksela platna (više = oštrije, ali sporije)
  const NAJVISE_UZORAKA = 5;           // podkadrovi za pokretno zamućenje brzih komada

  // ─────────────────────────────────────────────────────────────────────
  //  TIJEK — sve mjere su u jedinicama kadra (kadar je 1080 jedinica širok)
  // ─────────────────────────────────────────────────────────────────────
  const U = 1080;
  let K = null;                          // konstante iz podataka
  let L = 14.6;
  function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(x) { x = sat(x); return x * x * (3 - 2 * x); }
  function eio(x) { x = sat(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eout(x) { x = sat(x); return 1 - Math.pow(1 - x, 3); }
  function ramp(t, a, b) { return smooth((t - a) / (b - a)); }
  function lerp(a, b, w) { return a + (b - a) * w; }
  function per(k, t, ph) { return Math.sin(2 * Math.PI * k * t / L + (ph || 0)); }

  function Z2(t) {                                   // zum prizora (u ravnini bočice)
    if (t < K.T_BURST) return 1.26;
    if (t < 7.9) return 1.26 - 0.12 * eio((t - K.T_BURST) / (7.9 - K.T_BURST));
    if (t < 11.4) return 1.14 + 0.05 * eio((t - 7.9) / 3.5);
    return 1.19 + 0.04 * eio((t - 11.4) / 2.0);
  }
  function truck(t) { return t < 7.9 ? 0 : -8 * eio((t - 7.9) / 3.5); }
  function prizorJacina(t) { return ramp(t, 2.9, 5.0) * (1 - ramp(t, 11.3, 12.9)); }
  function prizorKrug(t) {
    let r = 0.25;
    r = lerp(r, 0.40, eio((t - 5.7) / 1.9));
    r = lerp(r, 0.22, eio((t - 11.3) / 1.6));
    return r * U;
  }
  function mutnoca(t) {                              // sigma zamućenja prizora (jedinice kadra)
    if (t < 5.9) return 22;
    if (t < 11.3) return 22 * (1 - eio((t - 5.9) / 1.75));
    return 18 * eio((t - 11.3) / 1.4);
  }
  function sjajSredine(t) { return 0.42 * ramp(t, 3.7, 4.9) * (1 - ramp(t, 4.9, 6.4)) + 0.30 * ramp(t, 12.0, 12.8) * (1 - ramp(t, 12.8, 13.8)); }
  function omega(t) {
    if (t < K.T_LIFT0) return 0;
    if (t < K.T_LIFT1) return 1.45 * eio((t - K.T_LIFT0) / (K.T_LIFT1 - K.T_LIFT0));
    return 1.45 + 0.9 * sat((t - K.T_LIFT1) / (K.T_BURST - K.T_LIFT1));
  }
  const NT = 20001;
  let TH = null, TA = null, KORAK = 0;
  function tablice() {
    TH = new Float64Array(NT); TA = new Float64Array(NT);
    KORAK = (L + 1) / (NT - 1);
    let po = omega(0), pr = ramp(0, K.T_LIFT0, K.T_LIFT1);
    for (let i = 1; i < NT; i++) {
      const t = i * KORAK, om = omega(t), rl = ramp(t, K.T_LIFT0, K.T_LIFT1);
      TH[i] = TH[i - 1] + (om + po) / 2 * KORAK;
      TA[i] = TA[i - 1] + (rl + pr) / 2 * KORAK;
      po = om; pr = rl;
    }
  }
  function tab(arr, t) {
    const f = t / KORAK;
    if (f <= 0) return arr[0];
    if (f >= NT - 1) return arr[NT - 1];
    const i = Math.floor(f);
    return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
  }
  function THETA(t) { return tab(TH, t); }
  function TAU(t) { return tab(TA, t); }
  function LIFT(t) { return eio((t - K.T_LIFT0) / (K.T_LIFT1 - K.T_LIFT0)); }

  const PR = { x: 0, y: 0, s: 1, Zp: 0 };
  function projiciraj(R, th, Y, zx) {
    const X = R * Math.cos(th), Zd = R * Math.sin(th);
    const ce = Math.cos(K.EPS), se = Math.sin(K.EPS);
    const Yp = Y * ce + Zd * se;
    const Zp = -Y * se + Zd * ce + zx;
    const s = K.F / Math.max(K.F - Zp, 0.15 * K.F);
    PR.x = K.Bo[0] + X * s; PR.y = K.Bo[1] + Yp * s; PR.s = s; PR.Zp = Zp;
  }
  function mjesto(q) { return [K.C1o[0] + K.S1 * (q.c[0] - K.C1i[0]), K.C1o[1] + K.S1 * (q.c[1] - K.C1i[1])]; }

  // stanje komada u trenutku t: položaj (jedinice), mjerilo (jedinica po px fotografije),
  // kut, prevrtanje, dubina (za oštrinu), ključ redoslijeda, prozirnost
  function stanje(q, t) {
    if (!q.kap && t >= q.tr0) return povratak(q, t);
    let w;
    if (q.kap) { w = eio((t - q.te) / 1.3); if (w <= 0 || t > q.tb + 1.3) return null; }
    else w = LIFT(t);
    const th = q.th0 + THETA(t) * (q.kap ? 1.25 : 1) + q.dth * w;
    let R = lerp(q.R0, q.Rf, w), Y = lerp(q.Y0, q.Yf, w);
    Y += w * 6 * Math.sin(1.3 * t + q.bob);
    let zx = 0, a = 1;
    if (t > q.tb) {
      const u = t - q.tb;
      R += 320 * u + 760 * u * u;
      zx = 520 * u + 950 * u * u;
      Y *= 1 + 0.7 * u;
      if (u > 1.6) return null;
    }
    projiciraj(R, th, Y, zx);
    if (PR.Zp > 0.62 * K.F) a *= sat((0.86 * K.F - PR.Zp) / (0.24 * K.F));
    if (q.kap) {
      a *= sat((t - q.te) * 3);
      return { x: PR.x, y: PR.y, s: K.S1 * q.sf * PR.s * (0.4 + 0.6 * w), rot: q.rotr * TAU(t), phi: 0, z: PR.Zp, key: PR.Zp, a: a, w: w, th: th };
    }
    const m = mjesto(q), my = m[1] + 2 * per(6, t, q.bob), tau = TAU(t);
    return { x: lerp(m[0], PR.x, w), y: lerp(my, PR.y, w), s: lerp(K.S1, K.S1 * q.sf * PR.s, w),
      rot: q.rotr * tau, phi: q.flipr * tau, z: PR.Zp * w, key: PR.Zp * w + q.sloj * 30 * (1 - w), a: a, w: w, th: th };
  }
  function povratak(q, t) {
    const p = sat((t - q.tr0) / K.RET_DUR), e = p < 1 ? eout(p) : 1;
    const m = mjesto(q), rx = m[0], ry = m[1] + 2 * per(6, t, q.bob);
    const sx = rx + q.rdir[0] * q.rD, sy = ry + q.rdir[1] * q.rD;
    const cu = q.rcurv * q.rD * Math.sin(Math.PI * e) * 0.5;
    const zf = 600 + 300 * q.sloj;
    return { x: sx + (rx - sx) * e - q.rdir[1] * cu, y: sy + (ry - sy) * e + q.rdir[0] * cu, s: K.S1 * lerp(q.rk, 1, e),
      rot: q.rrot * (1 - e), phi: q.rphi * (1 - e), z: (1 - e) * zf, key: q.sloj * 30 * e + (1 - e) * zf, a: sat(p / 0.3), w: 1 - e, th: 0 };
  }
  // afina preslika px sličice -> jedinice kadra: P = A (p - cl) + (x, y); A uključuje prevrtanje
  function afina(q, st) {
    const c = Math.cos(st.rot), s = Math.sin(st.rot);
    let cf = Math.cos(st.phi);
    if (Math.abs(cf) < 0.07) cf = cf < 0 ? -0.07 : 0.07;
    const ca = Math.cos(q.faxis), sa = Math.sin(q.faxis);
    const f00 = ca * ca * cf + sa * sa, f01 = ca * sa * (cf - 1), f11 = sa * sa * cf + ca * ca;
    const a = st.s * (c * f00 - s * f01), b = st.s * (c * f01 - s * f11);
    const d = st.s * (s * f00 + c * f01), e = st.s * (s * f01 + c * f11);
    return [a, b, d, e, st.x - (a * q.cl[0] + b * q.cl[1]), st.y - (d * q.cl[0] + e * q.cl[1]), cf];
  }
  function bocicaStanje(t) {
    let vis, hot, grow, rise;
    if (t < 8.2) {
      const e = ramp(t, 4.35, 5.55);
      vis = eio(e) * (1 - ramp(t, 7.7, 8.15));
      hot = 1 - eio(ramp(t, 4.45, 5.95));
      grow = 0.035 * (1 - eio(e)); rise = 8 * (1 - eio(e));
    } else {
      vis = ramp(t, 11.15, 11.45) * (1 - eio(ramp(t, 12.45, 13.3)));
      hot = eio(ramp(t, 11.85, 12.9));
      grow = 0.03 * eio(ramp(t, 12.2, 13.3)); rise = 10 * eio(ramp(t, 12.2, 13.3));
    }
    return { vis: vis, hot: hot, z: Z2(t) * (1 + grow), rise: rise };
  }

  // ─────────────────────────────────────────────────────────────────────
  //  SHADERI
  // ─────────────────────────────────────────────────────────────────────
  const VS_KADAR = `
    attribute vec2 aPos;
    uniform vec2 uPomak;
    varying vec2 vPos;
    void main() {
      vPos = aPos;
      vec2 p = aPos + uPomak;
      gl_Position = vec4(p.x / 540.0 - 1.0, 1.0 - p.y / 540.0, 0.0, 1.0);
    }`;
  const VS_EKRAN = `
    attribute vec2 aPos;
    varying vec2 vPos;
    void main() {
      vPos = aPos;
      gl_Position = vec4(aPos.x / 540.0 - 1.0, 1.0 - aPos.y / 540.0, 0.0, 1.0);
    }`;
  // prizor: pomak kamere prema dubini, razina oštrine, med, odsjaj, krug svjetla, sjaj sredine
  const FS_PRIZOR = `
    uniform sampler2D uRa, uRb, uDub, uMask;
    uniform float uRw, uZ, uT, uS2, uJac, uKrug, uVrt, uSjaj, uVrijeme, uXc, uOdsjaj;
    uniform vec2 uBo, uBi;
    varying vec2 vPos;
    void main() {
      vec2 p = vPos;
      vec2 q = uBi + (p - uBo) / (uS2 * uZ);
      for (int i = 0; i < 2; i++) {
        float zz = texture2D(uDub, q / 1024.0).r * 1.2 - 0.7;
        float ze = pow(uZ, 1.0 + 0.95 * zz);
        q = uBi + (p - uBo - vec2(uT * zz * 1.4, 0.0)) / (uS2 * ze);
      }
      vec2 uv = q / 1024.0;
      vec3 c = mix(texture2D(uRa, uv).rgb, texture2D(uRb, uv).rgb, uRw);
      vec3 mk = texture2D(uMask, uv).rgb;
      if (mk.b > 0.002) {
        float val = 1.0 + 0.17 * sin(6.2831853 * (q.y / 15.0 - 2.4 * uVrijeme));
        float ys = 395.0 + mod(uVrijeme * 210.0, 190.0);
        float hl = 0.20 * exp(-pow((q.y - ys) / 7.0, 2.0));
        c = c * (1.0 + (val - 1.0) * mk.b) + hl * mk.b * vec3(1.0, 0.85, 0.55);
      }
      if (uOdsjaj > 0.0) {
        float d = (q.x - uXc) + 0.42 * (q.y - 470.0);
        float w = (mk.r * 0.85 + mk.g * 0.35) * exp(-pow(d / 15.0, 2.0)) * uOdsjaj;
        c = 1.0 - (1.0 - c) * (1.0 - w * vec3(1.0, 0.95, 0.82));
      }
      c *= 1.0 - 0.13 * uVrt;
      float r = length(p - uBo);
      float m = 1.0 - clamp((r - (uKrug - 172.8)) / 324.0, 0.0, 1.0);
      m = m * m * (3.0 - 2.0 * m);
      c *= m * uJac;
      float rv = r / 324.0;
      c += exp(-rv * rv * 1.6) * vec3(1.0, 0.80, 0.52) * uSjaj;
      gl_FragColor = vec4(c, 1.0);
    }`;
  // komadi: premultiplied atlas u pet razina oštrine
  const VS_KOMAD = `
    attribute vec2 aPos;
    attribute vec2 aUV;
    attribute float aA;
    attribute float aSig;
    attribute vec3 aBoja;
    uniform vec2 uPomak;
    varying vec2 vUV;
    varying float vA;
    varying float vSig;
    varying vec3 vBoja;
    void main() {
      vUV = aUV; vA = aA; vSig = aSig; vBoja = aBoja;
      vec2 p = aPos + uPomak;
      gl_Position = vec4(p.x / 540.0 - 1.0, 1.0 - p.y / 540.0, 0.0, 1.0);
    }`;
  const FS_KOMAD = `
    uniform sampler2D uL0, uL1, uL2, uL3, uL4;
    uniform vec4 uSig;
    varying vec2 vUV;
    varying float vA;
    varying float vSig;
    varying vec3 vBoja;
    void main() {
      float s = vSig;
      vec4 c;
      if (s < 0.05) c = texture2D(uL0, vUV);
      else if (s < uSig.x) c = mix(texture2D(uL0, vUV), texture2D(uL1, vUV), s / uSig.x);
      else if (s < uSig.y) c = mix(texture2D(uL1, vUV), texture2D(uL2, vUV), (s - uSig.x) / (uSig.y - uSig.x));
      else if (s < uSig.z) c = mix(texture2D(uL2, vUV), texture2D(uL3, vUV), (s - uSig.y) / (uSig.z - uSig.y));
      else if (s < uSig.w) c = mix(texture2D(uL3, vUV), texture2D(uL4, vUV), (s - uSig.z) / (uSig.w - uSig.z));
      else c = texture2D(uL4, vUV);
      gl_FragColor = vec4(c.rgb * vBoja, c.a) * vA;
    }`;
  // limun: kora preslikana na elipsoid koji se okreće oko duge osi; sjena i silueta stoje
  const VS_LIMUN = `
    attribute vec2 aPos;
    attribute vec2 aLok;
    attribute vec2 aUV;
    uniform vec2 uPomak;
    varying vec2 vLok;
    varying vec2 vUV;
    void main() {
      vLok = aLok; vUV = aUV;
      vec2 p = aPos + uPomak;
      gl_Position = vec4(p.x / 540.0 - 1.0, 1.0 - p.y / 540.0, 0.0, 1.0);
    }`;
  const FS_LIMUN = `
    uniform sampler2D uBa, uBb, uAa, uAb, uSjena, uO0, uO1;
    uniform float uBw, uOw, uK, uPhi, uA, uEA, uEB, uPsi, uLS, uLT;
    uniform vec2 uC, uDL, uDS;
    uniform vec3 uBoja;
    varying vec2 vLok;
    varying vec2 vUV;
    void main() {
      vec2 v = vLok - uC;
      float Lc = dot(v, uDL) / uEA, Sc = dot(v, uDS) / uEB;
      float r2 = Lc * Lc + Sc * Sc;
      vec2 m = vLok;
      if (r2 < 1.0) {
        float rho = sqrt(max(0.0, 1.0 - Lc * Lc));
        float Zs = sqrt(max(0.0, 1.0 - r2));
        float psi = atan(Sc, Zs);
        float T2 = 2.0 * uPsi;
        float u = mod(psi - uPhi + uPsi, 2.0 * T2);
        if (u > T2) u = 2.0 * T2 - u;
        m = uC + Lc * uEA * uDL + rho * sin(u - uPsi) * uEB * uDS;
      }
      vec2 tm = m * uLS / uLT, to = vLok * uLS / uLT;
      vec3 alb = mix(texture2D(uBa, tm).rgb, texture2D(uBb, tm).rgb, uBw) * 2.0;
      float al = mix(texture2D(uAa, to).r, texture2D(uAb, to).r, uBw);
      float sh = texture2D(uSjena, to).r * 3.0;
      vec4 spun = vec4(clamp(alb * sh, 0.0, 1.0) * al, al);
      vec4 orig = mix(texture2D(uO0, vUV), texture2D(uO1, vUV), uOw);
      vec4 c = mix(orig, spun, uK);
      gl_FragColor = vec4(c.rgb * uBoja, c.a) * uA;
    }`;
  const FS_BOCICA = `
    uniform sampler2D uTex;
    uniform float uVis, uHot;
    varying vec2 vUV;
    void main() {
      vec4 c = texture2D(uTex, vUV);
      gl_FragColor = vec4(mix(c.rgb, vec3(1.0, 0.93, 0.80) * c.a, uHot), c.a) * uVis;
    }`;
  const FS_SJAJ = `
    uniform sampler2D uTex;
    uniform float uJac;
    varying vec2 vUV;
    void main() { gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * texture2D(uTex, vUV).r * uJac, 0.0); }`;
  const VS_UV = `
    attribute vec2 aPos;
    attribute vec2 aUV;
    uniform vec2 uPomak;
    varying vec2 vUV;
    void main() {
      vUV = aUV;
      vec2 p = aPos + uPomak;
      gl_Position = vec4(p.x / 540.0 - 1.0, 1.0 - p.y / 540.0, 0.0, 1.0);
    }`;
  // prašina u suncu: meke točke (dodaju svjetlo)
  const VS_PRAH = `
    attribute vec2 aPos;
    attribute vec2 aOff;
    attribute vec2 aSR;
    attribute float aB;
    uniform vec2 uPomak;
    varying vec2 vOff;
    varying vec2 vSR;
    varying float vB;
    void main() {
      vOff = aOff; vSR = aSR; vB = aB;
      vec2 p = aPos + aOff + uPomak;
      gl_Position = vec4(p.x / 540.0 - 1.0, 1.0 - p.y / 540.0, 0.0, 1.0);
    }`;
  const FS_PRAH = `
    varying vec2 vOff;
    varying vec2 vSR;
    varying float vB;
    void main() {
      float g = exp(-dot(vOff, vOff) / (2.0 * vSR.x * vSR.x)) * (vSR.y / vSR.x) * (vSR.y / vSR.x);
      gl_FragColor = vec4(vec3(1.0, 0.90, 0.72) * g * vB, 0.0);
    }`;
  // pokretno zamućenje: zbroj podkadrova
  const FS_ZBROJ = `
    uniform sampler2D uTex;
    uniform float uMul;
    varying vec2 vPos;
    void main() { gl_FragColor = texture2D(uTex, vec2(vPos.x / 1080.0, 1.0 - vPos.y / 1080.0)) * uMul; }`;
  // vinjeta: rub kadra potpuno crn (stapa se s podlogom početnog ekrana)
  const FS_RUB = `
    varying vec2 vPos;
    void main() {
      float rc = length(vPos - vec2(540.0)) / 1080.0;
      float x = clamp((rc - 0.30) / 0.20, 0.0, 1.0);
      float e = (1.0 - x) * (1.0 - x) * (1.0 + 2.0 * x);
      gl_FragColor = vec4(e, e, e, 1.0);
    }`;

  // ─────────────────────────────────────────────────────────────────────
  //  PODACI — film-podaci.js (jednom po stranici)
  // ─────────────────────────────────────────────────────────────────────
  let PODACI_OBECANJE = null;
  function ucitajPodatke(mapa) {
    if (PODACI_OBECANJE) return PODACI_OBECANJE;
    PODACI_OBECANJE = new Promise(function (ok, ne) {
      if (window.MX_FILM_PODACI) { ok(window.MX_FILM_PODACI); return; }
      const s = document.createElement('script');
      const rok = setTimeout(function () { ne(new Error('podaci se nisu učitali na vrijeme')); }, 25000);
      s.src = mapa + DATOTEKE.podaci + '?v=' + VERZIJA;
      s.async = true;
      s.onload = function () { clearTimeout(rok); window.MX_FILM_PODACI ? ok(window.MX_FILM_PODACI) : ne(new Error('nema podataka')); };
      s.onerror = function () { clearTimeout(rok); ne(new Error('podaci se nisu učitali')); };
      document.head.appendChild(s);
    }).then(function (P) {
      const imena = Object.keys(P.slike);
      return Promise.all(imena.map(function (ime) {
        return new Promise(function (ok, ne) {
          const img = new Image();
          img.onload = function () { ok([ime, img]); };
          img.onerror = function () { ne(new Error('slika ' + ime)); };
          img.src = P.slike[ime];
        });
      })).then(function (parovi) {
        const slike = {};
        parovi.forEach(function (p) { slike[p[0]] = p[1]; });
        return { P: P, slike: slike };
      });
    });
    PODACI_OBECANJE.catch(function () { PODACI_OBECANJE = null; });
    return PODACI_OBECANJE;
  }

  // ─────────────────────────────────────────────────────────────────────
  //  ANIMACIJA — isti oblik kao napraviAnimaciju u pocetna-chata.js
  // ─────────────────────────────────────────────────────────────────────
  function napravi(platno, scena, dogadaji, opcije) {
    opcije = opcije || {};
    const MIRNO = opcije.mirno || { matches: false };
    const ponavljaj = opcije.ponavljaj !== false;
    const mapa = opcije.mapa || MAPA;
    let omot = null, slika = null, can = null, gl = null;
    let priprema = null, unisteno = false, stoji = false, otvoren = false, spreman = false;
    let raf = 0, vrijeme = 0, zadnje = 0, prviKadar = false;
    let dpr = 1, maxUzoraka = NAJVISE_UZORAKA, mjerenje = { n: 0, zbroj: 0 }, smanjeno = 0;
    let PRG = {}, TEX = {}, FBO = {}, buf = null, komadi = [], kapi = [], limun = null, prah = [];
    let podaci = null;

    function url(ime) { return mapa + ime + '?v=' + VERZIJA; }
    function stedi() { const c = navigator.connection; return !!(c && c.saveData); }
    function stojeci() {
      stoji = true;
      stani();
      if (can) can.style.opacity = '0';
      if (slika && slika.getAttribute('data-ime') !== 'mirno') {
        slika.setAttribute('data-ime', 'mirno');
        slika.src = url(DATOTEKE.mirno);
      }
    }

    function pripremi() {
      if (priprema) return priprema;
      priprema = Promise.resolve().then(function () {
        if (unisteno) return false;
        dogadaji.podnaslov(false);
        omot = document.createElement('div');
        omot.setAttribute('aria-hidden', 'true');
        omot.style.cssText = [
          'position:absolute', 'left:50%', 'top:50%', 'width:0', 'height:0',
          'transform:translate(-50%,-50%)', 'pointer-events:none', 'mix-blend-mode:screen',
          'opacity:0', 'transition:opacity .6s linear, transform .9s cubic-bezier(.45,0,.2,1)',
          '-webkit-mask-image:radial-gradient(closest-side,#000 80%,transparent 100%)',
          'mask-image:radial-gradient(closest-side,#000 80%,transparent 100%)'
        ].join(';');
        const sloj = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;margin:0;border:0;';
        slika = document.createElement('img');
        slika.alt = '';
        slika.decoding = 'async';
        slika.draggable = false;
        slika.style.cssText = sloj + 'object-fit:cover;';
        can = document.createElement('canvas');
        can.style.cssText = sloj + 'opacity:0;transition:opacity .35s linear;background:#000;';
        omot.appendChild(slika);
        omot.appendChild(can);
        scena.appendChild(omot);
        velicina();
        const prva = (MIRNO.matches || stedi()) ? 'mirno' : 'pocetak';
        slika.setAttribute('data-ime', prva);
        return new Promise(function (ok) {
          slika.onload = function () { ok(true); };
          slika.onerror = function () { ok(false); };
          slika.src = url(DATOTEKE[prva]);
        }).then(function (ok) {
          if (unisteno) return false;
          if (!ok) { dogadaji.bezAnimacije(); return false; }
          return true;
        });
      }).catch(function (e) {
        console.warn('[Martimex] Početni ekran bez filma:', e);
        dogadaji.bezAnimacije();
        return false;
      });
      return priprema;
    }

    // kadar je kvadrat u sredini prostora animacije, širok koliko prozor chata
    function velicina() {
      if (!omot) return;
      const sirina = Math.max(1, platno.clientWidth || scena.offsetWidth);
      const visina = Math.max(1, scena.offsetHeight);
      const s = Math.round(Math.min(sirina, visina * 1.2) * VELICINA);
      omot.style.width = s + 'px';
      omot.style.height = s + 'px';
      dpr = Math.min(NAJVISE_DPR, window.devicePixelRatio || 1) * (smanjeno === 0 ? 1 : smanjeno === 1 ? 0.75 : 0.55);
      const b = Math.max(64, Math.round(s * dpr));
      if (can && (can.width !== b || can.height !== b)) {
        can.width = b; can.height = b;
        if (gl) { napraviFBO(); if (spreman && !raf) crtaj(vrijeme % L); }
      }
    }

    // ── WebGL ──
    function shader(tip, izvor) {
      const s = gl.createShader(tip);
      gl.shaderSource(s, izvor);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s));
      return s;
    }
    function program(vs, fs, atributi) {
      const prec = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision > 0 ? 'highp' : 'mediump';
      const p = gl.createProgram();
      gl.attachShader(p, shader(gl.VERTEX_SHADER, 'precision highp float;\n' + vs));
      gl.attachShader(p, shader(gl.FRAGMENT_SHADER, 'precision ' + prec + ' float;\n' + fs));
      atributi.forEach(function (a, i) { gl.bindAttribLocation(p, i, a); });
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('program: ' + gl.getProgramInfoLog(p));
      const u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const inf = gl.getActiveUniform(p, i); u[inf.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, inf.name); }
      return { p: p, u: u, a: atributi };
    }
    function tekstura(img, premul) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !!premul);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    function napraviFBO() {
      ['tmp', 'iza', 'ispred'].forEach(function (k) {
        if (FBO[k]) { gl.deleteFramebuffer(FBO[k].f); gl.deleteTexture(FBO[k].t); }
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, can.width, can.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const f = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        FBO[k] = { f: f, t: t };
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    function pocniGL(D) {
      gl = can.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false })
        || can.getContext('experimental-webgl', { alpha: false, antialias: false, depth: false, stencil: false });
      if (!gl) throw new Error('nema WebGL-a');
      const P = D.P, S = D.slike;
      PRG.prizor = program(VS_KADAR, FS_PRIZOR, ['aPos']);
      PRG.komad = program(VS_KOMAD, FS_KOMAD, ['aPos', 'aUV', 'aA', 'aSig', 'aBoja']);
      PRG.limun = program(VS_LIMUN, FS_LIMUN, ['aPos', 'aLok', 'aUV']);
      PRG.bocica = program(VS_UV, FS_BOCICA, ['aPos', 'aUV']);
      PRG.sjaj = program(VS_UV, FS_SJAJ, ['aPos', 'aUV']);
      PRG.prah = program(VS_PRAH, FS_PRAH, ['aPos', 'aOff', 'aSR', 'aB']);
      PRG.zbroj = program(VS_EKRAN, FS_ZBROJ, ['aPos']);
      PRG.rub = program(VS_EKRAN, FS_RUB, ['aPos']);
      for (let i = 0; i < 5; i++) {
        TEX['atlas' + i] = tekstura(S['atlas' + i], true);
        TEX['limunBoja' + i] = tekstura(S['limunBoja' + i], false);
        TEX['limunAlfa' + i] = tekstura(S['limunAlfa' + i], false);
      }
      for (let i = 0; i < 4; i++) TEX['prizor' + i] = tekstura(S['prizor' + i], false);
      TEX.limunSjena = tekstura(S.limunSjena, false);
      TEX.dubina = tekstura(S.dubina, false);
      TEX.maske = tekstura(S.maske, false);
      TEX.bocica = tekstura(S.bocica, true);
      TEX.sjaj = tekstura(S.sjaj, false);
      buf = gl.createBuffer();
      napraviFBO();
      gl.disable(gl.DEPTH_TEST);
    }
    function pripremiPodatke(P) {
      K = P.k; L = K.L;
      tablice();
      komadi = P.komadi.map(function (k) { return Object.assign({ kap: false }, k); });
      kapi = P.kapi.map(function (k) {
        const s = komadi[k.izvor];
        return Object.assign({ kap: true, sloj: 1, bob: 0, faxis: 0, flipr: 0, limun: false, cl: s.cl, w: s.w, h: s.h, at: s.at, ime: 'kap' }, k);
      });
      limun = P.limun;
      // prašina: ista pravila kao u filmu (slučajni raspored je stalan)
      let a = 7;
      function rnd() { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
      prah = [];
      for (let i = 0; i < 40; i++) prah.push({ x: rnd() * (U + 80) - 40, y: rnd() * (U + 80) - 40, d: rnd(), b: 0.25 + 0.75 * rnd(), ph: rnd() * Math.PI * 2, fr: 0.15 + 0.35 * rnd() });
    }

    // ── crtanje ──
    const VERT = new Float32Array(64 * 6 * 9);
    function veziAtribute(prg, raspored, korak) {
      let o = 0;
      for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i);
      raspored.forEach(function (n, i) {
        gl.enableVertexAttribArray(i);
        gl.vertexAttribPointer(i, n, gl.FLOAT, false, korak * 4, o * 4);
        o += n;
      });
    }
    function koristi(prg) { gl.useProgram(prg.p); return prg.u; }
    function tex(u, jedinica, t) { gl.activeTexture(gl.TEXTURE0 + jedinica); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u, jedinica); }
    function cetverokut(x0, y0, x1, y1) {
      return new Float32Array([x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1]);
    }
    const PUN = cetverokut(-2, -2, U + 2, U + 2);
    function crtajPun(prg) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, PUN, gl.STREAM_DRAW);
      veziAtribute(prg, [2], 2);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    // razine prizora: sigma u px fotografije -> dvije razine i omjer
    function razinePrizora(sig) {
      const s = podaci.P.prizor.sigma;          // [0, 3, 7, 16]
      if (sig <= 0) return [0, 0, 0];
      for (let i = 0; i < s.length - 1; i++) if (sig < s[i + 1]) return [i, i + 1, (sig - s[i]) / (s[i + 1] - s[i])];
      return [s.length - 1, s.length - 1, 0];
    }
    function razineLimuna(sig) {
      const s = limun.sigma;
      if (sig <= 0) return [0, 0, 0];
      for (let i = 0; i < s.length - 1; i++) if (sig < s[i + 1]) return [i, i + 1, (sig - s[i]) / (s[i + 1] - s[i])];
      return [s.length - 1, s.length - 1, 0];
    }

    function crtajPrizor(t, pomak) {
      const sv = prizorJacina(t), g = sjajSredine(t);
      if (sv <= 0.002 && g <= 0) return;
      const z = Z2(t);
      const sig = mutnoca(t) / (K.S2 * z);
      const r = razinePrizora(sig);
      const u = koristi(PRG.prizor);
      tex(u.uRa, 0, TEX['prizor' + r[0]]); tex(u.uRb, 1, TEX['prizor' + r[1]]);
      tex(u.uDub, 2, TEX.dubina); tex(u.uMask, 3, TEX.maske);
      gl.uniform1f(u.uRw, r[2]); gl.uniform1f(u.uZ, z); gl.uniform1f(u.uT, truck(t)); gl.uniform1f(u.uS2, K.S2);
      gl.uniform1f(u.uJac, sv); gl.uniform1f(u.uKrug, prizorKrug(t)); gl.uniform1f(u.uVrt, sv * (1 - ramp(t, 6.0, 7.7)));
      gl.uniform1f(u.uSjaj, g); gl.uniform1f(u.uVrijeme, t);
      const gt = (t - 8.75) / 1.15;
      gl.uniform1f(u.uXc, 400 + 260 * eio(gt));
      gl.uniform1f(u.uOdsjaj, gt > 0 && gt < 1 ? Math.pow(Math.sin(Math.PI * gt), 0.6) : 0);
      gl.uniform2f(u.uBo, K.Bo[0], K.Bo[1]); gl.uniform2f(u.uBi, K.Bi[0], K.Bi[1]);
      gl.uniform2f(u.uPomak, pomak[0], pomak[1]);
      gl.disable(gl.BLEND);
      crtajPun(PRG.prizor);
    }

    // jedan komad u niz vrhova (4 kuta -> 2 trokuta)
    function upisiKomad(n, q, st, sv) {
      const A = afina(q, st);
      const at = podaci.P.atlas;
      const sigOut = 0.0105 * Math.abs(st.z);
      const sigSpr = sigOut / Math.max(st.s, 1e-3);
      const sigAt = sigSpr * at.AS;
      const marg = Math.min(at.pad, 3 * sigAt + 2) / at.AS;       // px fotografije
      const light = 1 + 0.10 * Math.cos(st.th) * st.w;
      const strana = A[6] < 0 ? 0.86 : 1;
      const br = light * strana;
      const rr = (1 + 0.05 * sv) * br, gg = (1 - 0.02 * sv) * br, bb = (1 - 0.09 * sv) * br;
      const kutovi = [[-marg, -marg], [q.w + marg, -marg], [-marg, q.h + marg], [-marg, q.h + marg], [q.w + marg, -marg], [q.w + marg, q.h + marg]];
      let o = n * 54;
      for (let i = 0; i < 6; i++) {
        const lx = kutovi[i][0], ly = kutovi[i][1];
        VERT[o++] = A[0] * lx + A[1] * ly + A[4];
        VERT[o++] = A[2] * lx + A[3] * ly + A[5];
        VERT[o++] = (q.at[0] + lx * at.AS) / at.W;
        VERT[o++] = (q.at[1] + ly * at.AS) / at.H;
        VERT[o++] = st.a;
        VERT[o++] = sigAt;
        VERT[o++] = rr; VERT[o++] = gg; VERT[o++] = bb;
      }
    }
    function crtajNiz(n, pomak) {
      if (!n) return;
      const u = koristi(PRG.komad);
      for (let i = 0; i < 5; i++) tex(u['uL' + i], i, TEX['atlas' + i]);
      const s = podaci.P.atlas.sigma;
      gl.uniform4f(u.uSig, s[1], s[2], s[3], s[4]);
      gl.uniform2f(u.uPomak, pomak[0], pomak[1]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, VERT.subarray(0, n * 54), gl.STREAM_DRAW);
      veziAtribute(PRG.komad, [2, 2, 1, 1, 3], 9);
      gl.drawArrays(gl.TRIANGLES, 0, n * 6);
    }
    function crtajLimun(q, st, sv, t, pomak) {
      const A = afina(q, st);
      const at = podaci.P.atlas;
      const sigSpr = 0.0105 * Math.abs(st.z) / Math.max(st.s, 1e-3);
      const sigAt = sigSpr * at.AS;
      const marg = Math.min(at.pad, 3 * sigAt + 2) / at.AS;
      const kutovi = [[-marg, -marg], [q.w + marg, -marg], [-marg, q.h + marg], [-marg, q.h + marg], [q.w + marg, -marg], [q.w + marg, q.h + marg]];
      const V = new Float32Array(36);
      let o = 0;
      for (let i = 0; i < 6; i++) {
        const lx = kutovi[i][0], ly = kutovi[i][1];
        V[o++] = A[0] * lx + A[1] * ly + A[4]; V[o++] = A[2] * lx + A[3] * ly + A[5];
        V[o++] = lx; V[o++] = ly;
        V[o++] = (q.at[0] + lx * at.AS) / at.W; V[o++] = (q.at[1] + ly * at.AS) / at.H;
      }
      const u = koristi(PRG.limun);
      const rl = razineLimuna(sigSpr * limun.LS);
      tex(u.uBa, 0, TEX['limunBoja' + rl[0]]); tex(u.uBb, 1, TEX['limunBoja' + rl[1]]);
      tex(u.uAa, 2, TEX['limunAlfa' + rl[0]]); tex(u.uAb, 3, TEX['limunAlfa' + rl[1]]);
      tex(u.uSjena, 4, TEX.limunSjena);
      tex(u.uO0, 5, TEX.atlas0); tex(u.uO1, 6, TEX.atlas1);
      gl.uniform1f(u.uBw, rl[2]);
      gl.uniform1f(u.uOw, sat(sigAt / at.sigma[1]));
      gl.uniform1f(u.uK, st.w > 0.12 ? sat((st.w - 0.12) / 0.2) : 0);
      gl.uniform1f(u.uPhi, 1.9 * TAU(t));
      gl.uniform1f(u.uA, st.a);
      gl.uniform1f(u.uEA, limun.A); gl.uniform1f(u.uEB, limun.B); gl.uniform1f(u.uPsi, limun.psi);
      gl.uniform1f(u.uLS, limun.LS); gl.uniform1f(u.uLT, limun.LT);
      gl.uniform2f(u.uC, limun.ecx, limun.ecy); gl.uniform2f(u.uDL, limun.dL[0], limun.dL[1]); gl.uniform2f(u.uDS, limun.dS[0], limun.dS[1]);
      const light = (1 + 0.10 * Math.cos(st.th) * st.w) * (A[6] < 0 ? 0.86 : 1);
      gl.uniform3f(u.uBoja, (1 + 0.05 * sv) * light, (1 - 0.02 * sv) * light, (1 - 0.09 * sv) * light);
      gl.uniform2f(u.uPomak, pomak[0], pomak[1]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, V, gl.STREAM_DRAW);
      veziAtribute(PRG.limun, [2, 2, 2], 6);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    // komadi jednog sloja (iza ili ispred bočice), poredani po dubini
    function crtajSloj(lista, sv, t, pomak) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      let n = 0;
      for (let i = 0; i < lista.length; i++) {
        const q = lista[i].q, st = lista[i].st;
        if (q.limun) {
          crtajNiz(n, pomak); n = 0;
          crtajLimun(q, st, sv, t, pomak);
        } else {
          upisiKomad(n++, q, st, sv);
          if (n >= 64) { crtajNiz(n, pomak); n = 0; }
        }
      }
      crtajNiz(n, pomak);
    }
    function poredaj(ts) {
      const iza = [], ispred = [];
      const sve = [];
      for (let i = 0; i < komadi.length; i++) { const st = stanje(komadi[i], ts); if (st && st.a > 0.003) sve.push({ q: komadi[i], st: st }); }
      for (let i = 0; i < kapi.length; i++) { const st = stanje(kapi[i], ts); if (st && st.a > 0.003) sve.push({ q: kapi[i], st: st }); }
      sve.sort(function (a, b) { return a.st.key - b.st.key; });
      for (let i = 0; i < sve.length; i++) (sve[i].st.key <= 0 ? iza : ispred).push(sve[i]);
      return [iza, ispred];
    }
    function crtajBocicu(t, pomak) {
      const b = bocicaStanje(t);
      if (b.vis <= 0.001) return;
      const B = podaci.P.bocica;
      const A = b.z * K.S2;
      const ox = K.Bo[0] - A * K.Bi[0], oy = K.Bo[1] - A * K.Bi[1] - b.rise;
      const x0 = ox + A * B.x0, y0 = oy + A * B.y0, x1 = x0 + A * B.w, y1 = y0 + A * B.h;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      let u = koristi(PRG.bocica);
      tex(u.uTex, 0, TEX.bocica);
      gl.uniform1f(u.uVis, b.vis); gl.uniform1f(u.uHot, b.hot);
      gl.uniform2f(u.uPomak, pomak[0], pomak[1]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x0, y0, 0, 0, x1, y0, 1, 0, x0, y1, 0, 1, x0, y1, 0, 1, x1, y0, 1, 0, x1, y1, 1, 1]), gl.STREAM_DRAW);
      veziAtribute(PRG.bocica, [2, 2], 4);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (b.hot > 0.01) {
        const p = B.pad;
        const hx0 = x0 - A * p, hy0 = y0 - A * p, hx1 = x1 + A * p, hy1 = y1 + A * p;
        gl.blendFunc(gl.ONE, gl.ONE);
        u = koristi(PRG.sjaj);
        tex(u.uTex, 0, TEX.sjaj);
        gl.uniform1f(u.uJac, b.hot * b.vis * 0.55 * B.haloMax);
        gl.uniform2f(u.uPomak, pomak[0], pomak[1]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([hx0, hy0, 0, 0, hx1, hy0, 1, 0, hx0, hy1, 0, 1, hx0, hy1, 0, 1, hx1, hy0, 1, 0, hx1, hy1, 1, 1]), gl.STREAM_DRAW);
        veziAtribute(PRG.sjaj, [2, 2], 4);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }
    function crtajPrah(t, pomak) {
      const sv = prizorJacina(t);
      const amt = ramp(t, 6.6, 8.2) * (1 - ramp(t, 11.2, 12.4));
      if (sv <= 0.02 || amt <= 0.003) return;
      const R = prizorKrug(t);
      const V = new Float32Array(prah.length * 6 * 7);
      let o = 0;
      for (let i = 0; i < prah.length; i++) {
        const m = prah[i], d = m.d;
        const x = ((m.x + (4 + 7 * d) * t + 9 * Math.sin(0.35 * t + m.ph)) % (U + 80) + (U + 80)) % (U + 80) - 40;
        const y = ((m.y - (5 + 9 * d) * t + 6 * Math.sin(0.27 * t + 2 * m.ph)) % (U + 80) + (U + 80)) % (U + 80) - 40;
        const rad = 0.9 + 3.2 * d * d;
        const sg = rad + (0.4 + 5.5 * Math.abs(d - 0.35));
        const sun = sat(1.25 - Math.hypot(x - U * 0.95, y - U * 0.02) / (U * 1.05));
        const vis0 = 1 - sat((Math.hypot(x - K.Bo[0], y - K.Bo[1]) - (R - 0.16 * U)) / (0.30 * U));
        const b = m.b * (0.55 + 0.45 * Math.sin(2 * Math.PI * m.fr * t + m.ph)) * (0.25 + 0.9 * sun) * amt * 0.55 * vis0 * vis0 * 0.6;
        const r = 3 * sg + 1;
        const k = [[-r, -r], [r, -r], [-r, r], [-r, r], [r, -r], [r, r]];
        for (let j = 0; j < 6; j++) { V[o++] = x; V[o++] = y; V[o++] = k[j][0]; V[o++] = k[j][1]; V[o++] = sg; V[o++] = rad; V[o++] = b; }
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      const u = koristi(PRG.prah);
      gl.uniform2f(u.uPomak, pomak[0], pomak[1]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, V, gl.STREAM_DRAW);
      veziAtribute(PRG.prah, [2, 2, 2, 1], 7);
      gl.drawArrays(gl.TRIANGLES, 0, prah.length * 6);
    }
    function zbroji(cilj, izvor, mul) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, cilj);
      const u = koristi(PRG.zbroj);
      tex(u.uTex, 0, izvor);
      gl.uniform1f(u.uMul, mul);
      crtajPun(PRG.zbroj);
    }
    // koliko podkadrova: najveći pomak komada u 1/60 s, u px platna
    function uzoraka(t) {
      const dt = 1 / 60, ppu = can.width / U;
      let mv = 0;
      const sve = komadi.concat(kapi);
      for (let i = 0; i < sve.length; i++) {
        const q = sve[i], a = stanje(q, t - dt / 2), b = stanje(q, t + dt / 2);
        if (!a || !b) continue;
        const rad = 0.5 * a.s * Math.max(q.w, q.h);
        mv = Math.max(mv, Math.hypot(b.x - a.x, b.y - a.y) + Math.abs(b.rot - a.rot) * rad + Math.abs(b.s - a.s) * Math.max(q.w, q.h) * 0.5);
      }
      return Math.max(1, Math.min(maxUzoraka, Math.ceil(mv * ppu / 4)));
    }

    function crtaj(t) {
      if (!gl || gl.isContextLost()) return;
      const sv = prizorJacina(t);
      const pomak = [1.0 * per(3, t) + 0.5 * per(8, t, 1.0), 0.8 * per(2, t, 2.0) + 0.4 * per(7, t)];
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, can.width, can.height);
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      crtajPrizor(t, pomak);
      const n = uzoraka(t);
      if (n === 1) {
        const s = poredaj(t);
        crtajSloj(s[0], sv, t, pomak);
        crtajBocicu(t, pomak);
        crtajSloj(s[1], sv, t, pomak);
      } else {
        // pokretno zamućenje: svaki podkadar u privremeni sloj, zbroj u sloj iza / ispred bočice
        ['iza', 'ispred'].forEach(function (k) { gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[k].f); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); });
        const zaslon = 1 / 60;
        for (let i = 0; i < n; i++) {
          const ts = t - zaslon / 2 + zaslon * (i + 0.5) / n;
          const s = poredaj(ts);
          for (let j = 0; j < 2; j++) {
            if (!s[j].length) continue;
            gl.bindFramebuffer(gl.FRAMEBUFFER, FBO.tmp.f);
            gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
            crtajSloj(s[j], sv, ts, pomak);
            gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
            zbroji(FBO[j === 0 ? 'iza' : 'ispred'].f, FBO.tmp.t, 1 / n);
          }
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        zbroji(null, FBO.iza.t, 1);
        crtajBocicu(t, pomak);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        zbroji(null, FBO.ispred.t, 1);
      }
      crtajPrah(t, pomak);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
      koristi(PRG.rub);
      crtajPun(PRG.rub);
      if (!prviKadar) { prviKadar = true; can.style.opacity = '1'; }
    }

    function sljedeci(sad) {
      raf = requestAnimationFrame(sljedeci);
      const dt = Math.min(0.05, Math.max(0, (sad - zadnje) / 1000));
      zadnje = sad;
      // spor uređaj (ispod ~25 sl/s): manje piksela i podkadrova; 30 sl/s (npr. iPhone
      // u štednji baterije) je dovoljno glatko, jer kadrovi imaju pokretno zamućenje
      if (dt > 0) {
        mjerenje.n++; mjerenje.zbroj += dt;
        if (mjerenje.n >= 45) {
          const pros = mjerenje.zbroj / mjerenje.n;
          mjerenje.n = 0; mjerenje.zbroj = 0;
          if (pros > 0.04 && smanjeno < 2) { smanjeno++; maxUzoraka = smanjeno === 1 ? 2 : 1; velicina(); }
        }
      }
      vrijeme += dt;
      if (!ponavljaj && vrijeme >= STANI_NA) { vrijeme = STANI_NA; crtaj(vrijeme); stani(); return; }
      crtaj(vrijeme % L);
    }
    function pokreni() {
      if (raf || unisteno || stoji || !spreman) return;
      zadnje = performance.now();
      raf = requestAnimationFrame(sljedeci);
    }
    function stani() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function ucitajIPokreni() {
      return ucitajPodatke(mapa).then(function (D) {
        if (unisteno) return;
        if (!gl) {
          podaci = D;
          pripremiPodatke(D.P);
          pocniGL(D);
          can.addEventListener('webglcontextlost', function (e) { e.preventDefault(); stani(); spreman = false; });
          can.addEventListener('webglcontextrestored', function () {
            if (unisteno) return;
            try { PRG = {}; TEX = {}; FBO = {}; pocniGL(podaci); spreman = true; if (otvoren) pokreni(); }
            catch (e) { stojeci(); }
          });
        }
        spreman = true;
        if (otvoren && !stoji) { vrijeme = 0; prviKadar = false; crtaj(0); pokreni(); }
      }).catch(function (e) {
        console.warn('[Martimex] Film uživo nije pokrenut:', e);
        stojeci();
      });
    }

    // ispitni pristup (crtanje određenog trenutka, bez petlje)
    function kadar(t) { stani(); vrijeme = t; crtaj(t % L); }

    const api = {
      pripremi: pripremi,
      velicina: velicina,
      ispocetka: function () {
        return pripremi().then(function (ok) {
          if (!ok || !dogadaji.otvoreno()) return ok;
          otvoren = true;
          omot.style.transform = 'translate(-50%,-50%)';
          omot.style.opacity = '1';
          if (MIRNO.matches || stedi()) { stojeci(); return ok; }
          stoji = false;
          stani();
          vrijeme = 0;
          if (spreman) { prviKadar = false; crtaj(0); pokreni(); }
          else ucitajIPokreni();
          return ok;
        });
      },
      stani: function () { otvoren = false; stani(); },
      mis: function () {},
      izlaz: function (gotovo) {
        if (!omot || MIRNO.matches) { gotovo(); return; }
        omot.style.transform = 'translate(-50%,-50%) scale(1.06)';
        omot.style.opacity = '0';
        setTimeout(gotovo, IZLAZ_MS);
      },
      unisti: function () {
        unisteno = true;
        stani();
        if (gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) ext.loseContext();
          gl = null;
        }
        if (omot && omot.parentNode) omot.parentNode.removeChild(omot);
        omot = slika = can = null;
      }
    };
    // ispitne stranice mogu nacrtati određeni trenutak (window.__mxFilmIspit = function (f) {...})
    if (typeof window.__mxFilmIspit === 'function') window.__mxFilmIspit({ kadar: kadar, spreman: function () { return spreman; } });
    return api;
  }

  window.MX_FILM = { napravi: napravi };
})();
