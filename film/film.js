(function () {
  // ═════════════════════════════════════════════════════════════════════
  //  MARTIMEX — film Naxos uživo (animacija početnog ekrana chata)
  //
  //  Sastojci mirisa s fotografije (limun s listovima, med, saće, kora
  //  limete, bijeli cvjetovi) lebde složeni u tami i dišu: listovi i
  //  latice se lagano savijaju, med polako teče, svjetlo klizi preko kore
  //  i saća. Zatim se podignu i zavrte u krug; listovi lepršaju na zraku,
  //  okreću se u prostoru (vidi se i svjetlija poleđina lista, bijela
  //  unutrašnjost kore), a s meda se otkidaju kapi koje vuku niti. U
  //  sredini vrtloga skuplja se zlatno svjetlo; kroz sastojke izlaze
  //  zrake, a sastojci okrenuti prema svjetlu zasvijetle. Iz svjetla se,
  //  kao rastaljeno zlato, oblikuje bočica Xerjoff Naxos. Vrtlog se uz val
  //  zraka rasprsne prema kameri i izoštri se prizor (med, limuni, cvjetovi
  //  naranče): vjetar njiše listove, cvjetove i lavandu, sunce kroz krošnju
  //  klizi po stolu, med teče u staklenku, na limunu i medu titraju iskre,
  //  u zrakama sunca lebdi prašina. Na kraju se bočica raspadne u zlatnu
  //  prašinu, prizor se povuče u tamu, a sastojci doplove natrag i slože se
  //  s blagim njihanjem. Krug traje 14,6 s i ponavlja se bez šava.
  //
  //  Crta se uživo u WebGL-u iz komada fotografija (nema video datoteke).
  //  Slike i putanje su u film-podaci.js (izrađeno, ne mijenja se ručno).
  //
  //  Modul učitava pocetna-chata.js (postavka animacija: 'film').
  //   - pripremi: samo prvi kadar (slika, ~70 KB); podaci (~650 KB) se
  //     preuzmu kad se chat prvi put otvori, a do tada stoji prvi kadar
  //   - svako otvaranje chata: film kreće ispočetka; zatvaranje ga zaustavi
  //   - "Smanji pokrete" ili ušteda podataka: umjesto filma stoji završni
  //     prizor (bočica u prizoru), bez preuzimanja podataka
  //   - ako WebGL ne radi ili se podaci ne učitaju: završni prizor
  //   - na sporom uređaju se smanje razlučivost, podkadrovi i zrake
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
  const VERZIJA = '2';                 // promijeni kad se podaci ili slike zamijene
  const VELICINA = 1.0;                // veličina kadra: 1 = širina prozora chata (najviše 1,2 x visina prostora animacije)
  const STANI_NA = 10.6;               // s: gdje priča stane ako je ponavljaj: false (prizor i dalje živi)
  const IZLAZ_MS = 650;                // trajanje nestajanja nakon "POČETAK"
  const NAJVISE_DPR = 2;               // gustoća piksela platna (više = oštrije, ali sporije)
  const NAJVISE_UZORAKA = 5;           // podkadrovi za pokretno zamućenje brzih komada
  let ZIVOST = 1.0;                    // sitni pokreti: lepršanje, med, vjetar, iskre (0 = bez)
  let SVJETLO = 1.0;                   // zrake i sjaj svjetla (0 = bez)
  let ZRNO = 0.032;                    // filmsko zrno (0 = bez)

  // ─────────────────────────────────────────────────────────────────────
  //  TIJEK — sve mjere su u jedinicama kadra (kadar je 1080 jedinica širok)
  // ─────────────────────────────────────────────────────────────────────
  const U = 1080;
  const PI2 = Math.PI * 2;
  let K = null;                          // konstante iz podataka
  let L = 14.6;
  function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(x) { x = sat(x); return x * x * (3 - 2 * x); }
  function eio(x) { x = sat(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eout(x) { x = sat(x); return 1 - Math.pow(1 - x, 3); }
  function ramp(t, a, b) { return smooth((t - a) / (b - a)); }
  function lerp(a, b, w) { return a + (b - a) * w; }
  function per(k, t, ph) { return Math.sin(PI2 * k * t / L + (ph || 0)); }

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
  // zlatno svjetlo u sredini vrtloga (osvjetljava sastojke, daje zrake)
  function zlato(t) { return ramp(t, 3.2, 4.7) * (1 - ramp(t, 5.75, 6.7)) + 0.8 * ramp(t, 11.85, 12.5) * (1 - ramp(t, 12.9, 13.9)); }
  // ključno svjetlo (gore lijevo) polako diše, pa odsjaji klize preko kore, saća i meda
  const KLJUC = [0, 0, 1];
  function kljuc(t) {
    const a = PI2 * t / L;
    let x = -0.36 + 0.13 * Math.sin(2 * a) + 0.05 * Math.sin(5 * a + 1.0);
    let y = -0.55 + 0.09 * Math.cos(3 * a + 0.4);
    const z = 0.74, n = Math.hypot(x, y, z);
    KLJUC[0] = x / n; KLJUC[1] = y / n; KLJUC[2] = z / n;
    return KLJUC;
  }
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
  // udah prije vrtloga: sastojci se malo skupe, pa krenu
  function udah(t) { return ramp(t, 0.95, 1.5) * (1 - ramp(t, 1.5, 2.15)); }

  const PR = { x: 0, y: 0, s: 1, Zp: 0 };
  function projiciraj(R, th, Y, zx) {
    const X = R * Math.cos(th), Zd = R * Math.sin(th);
    const ce = Math.cos(K.EPS), se = Math.sin(K.EPS);
    const Yp = Y * ce + Zd * se;
    const Zp = -Y * se + Zd * ce + zx;
    const s = K.F / Math.max(K.F - Zp, 0.15 * K.F);
    PR.x = K.Bo[0] + X * s; PR.y = K.Bo[1] + Yp * s; PR.s = s; PR.Zp = Zp;
  }
  function mjesto(q, t) {
    const k = 1 - 0.018 * udah(t);
    return [K.C1o[0] + K.S1 * k * (q.c[0] - K.C1i[0]), K.C1o[1] + K.S1 * k * (q.c[1] - K.C1i[1])];
  }

  // sitno disanje u mirovanju (periodično s petljom): zakret i nagib komada
  function mikro(q, t, st) {
    const m = q.meko * ZIVOST;
    if (m <= 0) return st;
    st.rot += m * 0.05 * Math.sin(PI2 * 2 * t / L + q.f4);
    st.phi += m * 0.22 * Math.sin(PI2 * 3 * t / L + q.f5);
    return st;
  }
  // lebdenje: svaki komad polako pluta oko svog mjesta (i limun, malo manje)
  function lebdi(q, t) {
    const a = ZIVOST * (q.limun ? 2.6 : 5.5);
    return [a * Math.sin(PI2 * 2 * t / L + q.f1), a * 0.85 * Math.sin(PI2 * 3 * t / L + q.f2) + 2 * per(6, t, q.bob)];
  }
  // stanje komada u trenutku t: položaj (jedinice), mjerilo (jedinica po px fotografije),
  // kut, prevrtanje, dubina (za oštrinu), ključ redoslijeda, prozirnost
  function stanje(q, t) {
    if (t >= q.tr0) return mikro(q, t, povratak(q, t));
    const w = LIFT(t);
    const th = q.th0 + THETA(t) + q.dth * w;
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
    const m = mjesto(q, t), lb = lebdi(q, t), mx = m[0] + lb[0], my = m[1] + lb[1], tau = TAU(t);
    return mikro(q, t, { x: lerp(mx, PR.x, w), y: lerp(my, PR.y, w), s: lerp(K.S1, K.S1 * q.sf * PR.s, w),
      rot: q.rotr * tau, phi: q.flipr * tau, z: PR.Zp * w, key: PR.Zp * w + q.sloj * 30 * (1 - w), a: a, w: w, th: th });
  }
  // povratak: dolete, malo prebace i smire se (kao na opruzi)
  function povratak(q, t) {
    const p = sat((t - q.tr0) / K.RET_DUR);
    let e = p < 1 ? eout(p) : 1;
    if (p < 1) e += 0.035 * Math.pow(Math.sin(Math.PI * sat((p - 0.42) / 0.58)), 2);
    const m = mjesto(q, t), lb = lebdi(q, t), rx = m[0] + lb[0], ry = m[1] + lb[1];
    const sx = rx + q.rdir[0] * q.rD, sy = ry + q.rdir[1] * q.rD;
    const cu = q.rcurv * q.rD * Math.sin(Math.PI * sat(e)) * 0.5;
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
  // savijanje plohe: luk, žlijeb, lepršanje (val od jednog kraja prema drugom), faza
  function savijanje(q, t, brz) {
    const m = q.meko * ZIVOST;
    if (m <= 0) return [0, 0, 0, 0];
    const v = sat(brz / 700);
    return [m * (0.045 * Math.sin(PI2 * 3 * t / L + q.f1) + 0.22 * v * q.sgn),
      m * (0.07 + 0.05 * Math.sin(PI2 * 2 * t / L + q.f2) + 0.08 * v),
      m * (0.05 + 0.42 * v),
      PI2 * q.nf * t / L + q.f3];
  }
  // kap meda: izraste na komadu meda, otkine se (nit se rastegne i pukne) i odleti u vrtlog
  function stanjeKapi(k, t) {
    if (t < k.te - 0.01 || t > k.tb + 1.6) return null;
    const h = komadiRef[k.med];
    const sh = stanje(h, t);
    if (!sh) return null;
    const A = afina(h, sh);
    const lx = h.cl[0] + k.ox, ly = h.cl[1] + k.oy;
    const ax = A[0] * lx + A[1] * ly + A[4], ay = A[2] * lx + A[3] * ly + A[5];
    const w = eio((t - k.te) / 1.3);
    const th = k.th0 + THETA(t) * 1.25 + k.dth * w;
    let R = lerp(k.R0, k.Rf, w), Y = lerp(k.Y0, k.Yf, w);
    let zx = 0, a = 1;
    if (t > k.tb) {
      const u = t - k.tb;
      R += 320 * u + 760 * u * u;
      zx = 520 * u + 950 * u * u;
      Y *= 1 + 0.7 * u;
      if (u > 1.6) return null;
    }
    projiciraj(R, th, Y, zx);
    if (PR.Zp > 0.62 * K.F) a *= sat((0.86 * K.F - PR.Zp) / (0.24 * K.F));
    const w2 = Math.pow(sat((t - k.te) / 1.0), 2.4);          // kap se prvo polako odvaja (nit se rasteže), pa odleti
    const z = lerp(sh.z, PR.Zp, w2);
    const r = (4.6 + 5.2 * k.sf) * lerp(sh.s / K.S1, PR.s, w2) * (0.4 + 0.6 * sat((t - k.te) / 0.45));
    return { x: lerp(ax, PR.x, w2), y: lerp(ay, PR.y, w2), z: z, key: z, r: r, a: a * sat((t - k.te + 0.01) * 14), ax: ax, ay: ay, w: w2 };
  }
  // bočica: oblikuje se iz svjetla (form), hladi se (hot), na kraju se raspadne u prašinu (raspad)
  function bocicaStanje(t) {
    let vis, hot, grow, rise, form, raspad, duh;
    if (t < 8.2) {
      // svjetlo poprimi oblik bočice, pa se bočica odozdo napuni rastaljenim zlatom
      form = sat((t - 4.25) / 1.4);
      vis = t < 3.85 ? 0 : 1 - ramp(t, 7.7, 8.15);
      duh = ramp(t, 3.85, 4.45) * (1 - ramp(t, 5.3, 5.9));
      hot = 0.5 * (1 - eio(ramp(t, 4.6, 5.9)));
      const e = eio(form);
      grow = 0.035 * (1 - e); rise = 8 * (1 - e); raspad = 0;
    } else {
      // bočica se ugrije i raspadne u zlatnu prašinu
      form = 1;
      vis = ramp(t, 11.15, 11.45) * (1 - ramp(t, 13.3, 13.5));
      duh = 0;
      hot = 0.42 * eio(ramp(t, 11.75, 12.4)) * (1 - ramp(t, 12.9, 13.5));
      raspad = smooth((t - 11.95) / 1.45);
      grow = 0.03 * eio(ramp(t, 12.2, 13.3)); rise = 10 * eio(ramp(t, 12.2, 13.3));
    }
    return { vis: vis, hot: hot, z: Z2(t) * (1 + grow), rise: rise, form: form, raspad: raspad, duh: duh };
  }
  let komadiRef = [];

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
  const VS_POST = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  // prizor: pomak kamere prema dubini, vjetar, sunce kroz krošnju, med, iskre, bokeh,
  // odsjaji na bočici, oštrina po dubini, krug svjetla, sjaj sredine
  const FS_PRIZOR = `
    uniform sampler2D uR0, uR1, uR2, uR3, uMask, uMask2, uMask3, uSum;
    uniform float uZ, uT, uS2, uJac, uKrug, uVrt, uSjaj, uVr, uXc, uOdsjaj, uMut, uOstr, uZiv, uSunce, uBoc, uTx, uTj;
    uniform vec2 uBo, uBi;
    varying vec2 vPos;
    void main() {
      vec2 p = vPos;
      vec2 q = uBi + (p - uBo) / (uS2 * uZ);
      for (int i = 0; i < 2; i++) {
        float z0 = texture2D(uMask3, q / 1024.0).g * 1.2 - 0.7;
        float ze = pow(uZ, 1.0 + 0.95 * z0);
        q = uBi + (p - uBo - vec2(uT * z0 * 1.4, 0.0)) / (uS2 * ze);
      }
      float zz = texture2D(uMask3, q / 1024.0).g * 1.2 - 0.7;
      vec2 uv = q / 1024.0;
      vec3 m2 = texture2D(uMask2, uv).rgb;
      vec3 m3 = texture2D(uMask3, uv).rgb;
      if (uZiv > 0.0 && m2.r > 0.004) {
        vec3 nz = texture2D(uSum, uv * 2.5 + vec2(0.011, 0.007) * uVr).rgb;
        float f = nz.r * 6.2831853;
        vec2 d = vec2(sin(uVr * 1.9 + f) + 0.45 * sin(uVr * 3.7 + 2.0 * f), 0.55 * cos(uVr * 1.4 + 1.7 * f));
        q += d * m2.r * 1.6 * uZiv;
        uv = q / 1024.0;
      }
      vec3 mk = texture2D(uMask, uv).rgb;
      if (uZiv > 0.0 && mk.b > 0.01) { q.x += sin(q.y * 0.21 - uVr * 9.0) * 0.45 * mk.b * uZiv; uv = q / 1024.0; }
      float s = uMut * (1.0 + uOstr * abs(zz));
      s *= 1.0 - uBoc * clamp(m3.b * 3.0 + mk.r * 2.0 + mk.g * 2.0, 0.0, 1.0);
      vec3 c;
      if (s < 0.01) c = texture2D(uR0, uv).rgb;
      else if (s < 3.0) c = mix(texture2D(uR0, uv).rgb, texture2D(uR1, uv).rgb, s / 3.0);
      else if (s < 7.0) c = mix(texture2D(uR1, uv).rgb, texture2D(uR2, uv).rgb, (s - 3.0) / 4.0);
      else if (s < 16.0) c = mix(texture2D(uR2, uv).rgb, texture2D(uR3, uv).rgb, (s - 7.0) / 9.0);
      else c = texture2D(uR3, uv).rgb;
      float jasno = 1.0 - smoothstep(1.0, 6.0, s);
      if (mk.b > 0.002) {
        float val = 1.0 + 0.17 * sin(6.2831853 * (q.y / 15.0 - 2.4 * uVr));
        float ys = 395.0 + mod(uVr * 210.0, 190.0);
        float hl = 0.20 * exp(-pow((q.y - ys) / 7.0, 2.0));
        c = c * (1.0 + (val - 1.0) * mk.b) + hl * mk.b * vec3(1.0, 0.85, 0.55);
      }
      float js = exp(-pow(pow((q.x - 232.0) / 78.0, 2.0) + pow((q.y - 588.0) / 9.0, 2.0), 1.5)) * step(575.0, q.y) * step(q.y, 605.0);
      if (js > 0.01) {
        vec2 dq = (q - vec2(232.0, 588.0)) * vec2(1.0, 6.5);
        float rr = length(dq);
        c *= 1.0 + 0.11 * js * sin(rr * 0.30 - uVr * 7.5) * exp(-rr / 75.0) * jasno * uZiv;
      }
      if (uSunce > 0.0) {
        vec2 wq = uv * vec2(2.2, 1.6) + vec2(0.021, -0.012) * uVr;
        float n1 = texture2D(uSum, wq).r * 0.62 + texture2D(uSum, wq * 2.3 + vec2(0.37, 0.11) - vec2(0.010, 0.017) * uVr).g * 0.38;
        float sv = smoothstep(0.36, 0.70, n1) - 0.5;
        c *= 1.0 + uSunce * m2.g * sv * vec3(0.36, 0.28, 0.16);
      }
      if (m2.b > 0.02 && uZiv > 0.0) {
        float w1 = texture2D(uSum, q / 180.0 + vec2(0.0, 0.004) * uVr).b;
        float w2 = texture2D(uSum, q / 180.0 + vec2(0.31, 0.17) - vec2(0.003, 0.0) * uVr).b;
        c += vec3(1.0, 0.92, 0.75) * pow(w1 * w2, 9.0) * 1.4 * m2.b * jasno * uZiv;
      }
      if (m3.r > 0.01 && uZiv > 0.0) {
        float b = texture2D(uSum, uv * 3.0 + vec2(0.05, 0.03) * uVr).g;
        c *= 1.0 + m3.r * (b - 0.5) * 0.6 * uZiv;
      }
      if (uOdsjaj > 0.0) {
        float d = (q.x - uXc) + 0.42 * (q.y - 470.0);
        float w = (mk.r * 0.85 + mk.g * 0.35) * exp(-pow(d / 15.0, 2.0)) * uOdsjaj;
        c = 1.0 - (1.0 - c) * (1.0 - w * vec3(1.0, 0.95, 0.82));
      }
      if (uTj > 0.0 && m3.b > 0.01) {
        float d = (q.x - uTx) + 0.18 * (q.y - 560.0);
        c += vec3(1.0, 0.96, 0.88) * m3.b * exp(-pow(d / 38.0, 2.0)) * uTj;
      }
      c *= 1.0 - 0.13 * uVrt;
      float r = length(p - uBo);
      float m = 1.0 - clamp((r - (uKrug - 172.8)) / 324.0, 0.0, 1.0);
      m = m * m * (3.0 - 2.0 * m);
      c *= m * uJac;
      float rv = r / 324.0;
      c += (exp(-rv * rv * 1.6) + 0.3 * exp(-rv * rv * 14.0)) * vec3(1.0, 0.80, 0.52) * uSjaj;
      gl_FragColor = vec4(c, 1.0);
    }`;

  // komadi: mreža koja se savija i okreće u prostoru (instance: jedan komad = jedna instanca)
  const VS_KOMAD = `
    attribute vec2 aGrid;
    attribute vec4 iA;   // x, y, Zp, mjerilo
    attribute vec4 iB;   // zakret, prevrtanje, os prevrtanja, alfa
    attribute vec4 iC;   // atlas x, y (px razine 0), širina, visina (px sličice)
    attribute vec4 iD;   // središte x, y (px sličice), rub, -
    attribute vec4 iE;   // luk, žlijeb, lepršanje, faza
    attribute vec4 iF;   // os komada, pola duljine, pola širine, vrsta
    attribute vec4 iG;   // svjetlina, toplina, faza meda, -
    uniform vec2 uPomak, uBo, uAtlas;
    uniform float uF, uAS, uDof;
    uniform vec4 uMat[7];
    varying vec4 vA;     // uv, položaj na kadru
    varying vec4 vN;     // normala, dubina
    varying vec3 vT;     // x os sličice u prostoru
    varying vec4 vInfo;  // alfa, sigma (px atlasa), svjetlina, toplina
    varying vec4 vMat;   // sjaj, oštrina odsjaja, prozirnost, poleđina
    varying vec4 vLok;   // u, v uz os (px), faza meda, os
    void main() {
      vec2 lp = -iD.z + aGrid * (iC.zw + 2.0 * iD.z);
      vec2 c = lp - iD.xy;
      float ca = cos(iF.x), sa = sin(iF.x);
      vec2 ax = vec2(ca, sa), pe = vec2(-sa, ca);
      float u = dot(c, ax), v = dot(c, pe);
      float un = clamp(u / iF.y, -1.6, 1.6), vn = clamp(v / iF.z, -1.6, 1.6);
      float s1 = sin(2.2 * un - iE.w), c1 = cos(2.2 * un - iE.w);
      float env = 0.3 + 0.7 * un * un;
      float z = iF.y * (iE.x * (un * un - 0.33) + iE.z * 0.25 * s1 * env) + iF.z * iE.y * (vn * vn - 0.33);
      float dzu = iE.x * 2.0 * un + iE.z * 0.25 * (c1 * 2.2 * env + s1 * 1.4 * un);
      float dzv = iE.y * 2.0 * vn;
      vec2 g = dzu * ax + dzv * pe;
      vec3 nl = normalize(vec3(-g, 1.0));
      float cr = cos(iB.x), sr = sin(iB.x), cp = cos(iB.y), sp = sin(iB.y);
      float kx = -sin(iB.z), ky = cos(iB.z);
      mat3 Rk = mat3(cp + (1.0 - cp) * kx * kx, (1.0 - cp) * kx * ky, -sp * ky,
                     (1.0 - cp) * kx * ky, cp + (1.0 - cp) * ky * ky, sp * kx,
                     sp * ky, -sp * kx, cp);
      mat3 Rz = mat3(cr, sr, 0.0, -sr, cr, 0.0, 0.0, 0.0, 1.0);
      mat3 R = Rz * Rk;
      vec3 P = R * vec3(c, z);
      float sw = iA.w * (uF - iA.z) / uF;
      float Zv = iA.z + P.z * sw;
      float ratio = (uF - iA.z) / max(uF - Zv, 0.15 * uF);
      vec2 scr = iA.xy + P.xy * iA.w * ratio + (iA.xy - uBo) * (ratio - 1.0);
      vec2 pp = scr + uPomak;
      gl_Position = vec4(pp.x / 540.0 - 1.0, 1.0 - pp.y / 540.0, 0.0, 1.0);
      vA = vec4((iC.xy + lp * uAS) / uAtlas, scr);
      vN = vec4(R * nl, Zv);
      vT = R[0];
      vInfo = vec4(iB.w, uDof * abs(Zv) / max(iA.w * ratio, 1e-3) * uAS + iD.w, iG.x, iG.y);
      vMat = uMat[int(iF.w + 0.5)];
      vLok = vec4(u, v, iG.z, iF.x);
    }`;
  const KLASE = `
    float medK(vec3 c) {
      float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
      float s = (mx - mn) / max(mx, 0.02);
      float hue = (c.g - c.b) / max(mx - mn, 0.02);
      return smoothstep(0.45, 0.65, s) * (1.0 - smoothstep(0.62, 0.78, hue)) * step(c.g, c.r) * smoothstep(0.25, 0.4, mx);
    }
    float zelK(vec3 c) {
      float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), d = max(mx - mn, 0.001);
      float s = d / max(mx, 0.02);
      float h = mx == c.r ? (c.g - c.b) / d : (mx == c.g ? 2.0 + (c.b - c.r) / d : 4.0 + (c.r - c.g) / d);
      return smoothstep(0.2, 0.32, s) * smoothstep(0.92, 1.05, h) * (1.0 - smoothstep(2.6, 3.0, h));
    }
    float bijK(vec3 c) {
      float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
      return smoothstep(0.5, 0.72, mn) * (1.0 - smoothstep(0.14, 0.32, (mx - mn) / max(mx, 0.02)));
    }`;
  const FS_KOMAD = `
    uniform sampler2D uL0, uL1, uL2, uL3, uL4, uVis;
    uniform vec4 uSig;
    uniform vec2 uAtlas, uVisTex;
    uniform vec3 uKey, uKeyCol, uGoldPos;
    uniform float uGold, uSpec, uFaza, uZiv;
    varying vec4 vA, vN, vInfo, vMat, vLok;
    varying vec3 vT;
    ${KLASE}
    vec4 atlas(vec2 uv, float s) {
      if (s < 0.05) return texture2D(uL0, uv);
      if (s < uSig.x) return mix(texture2D(uL0, uv), texture2D(uL1, uv), s / uSig.x);
      if (s < uSig.y) return mix(texture2D(uL1, uv), texture2D(uL2, uv), (s - uSig.x) / (uSig.y - uSig.x));
      if (s < uSig.z) return mix(texture2D(uL2, uv), texture2D(uL3, uv), (s - uSig.y) / (uSig.z - uSig.y));
      if (s < uSig.w) return mix(texture2D(uL3, uv), texture2D(uL4, uv), (s - uSig.z) / (uSig.w - uSig.z));
      return texture2D(uL4, uv);
    }
    void main() {
      float s = vInfo.y;
      vec2 uv = vA.xy;
      vec2 osd = vec2(cos(vLok.w), sin(vLok.w));
      if (uZiv > 0.0) {
        vec4 cb = texture2D(uL2, uv);
        if (cb.a > 0.02) {
          float hw = medK(cb.rgb / cb.a) * smoothstep(0.02, 0.25, cb.a);
          if (hw > 0.01) {
            float ph = vLok.x * 0.10 - 6.0 * uFaza + vLok.z;
            float ph2 = vLok.y * 0.13 + 4.0 * uFaza + vLok.z * 1.7;
            vec2 d = (osd * sin(ph) * 0.9 + vec2(-osd.y, osd.x) * sin(ph2) * 0.7) * hw * uZiv;
            uv += d * 1.6 / uAtlas;
          }
        }
      }
      vec4 c = atlas(uv, s);
      if (c.a < 0.004) discard;
      vec3 col = c.rgb / c.a;
      float hon = medK(col), gre = zelK(col), whi = bijK(col);
      float h0 = texture2D(uVis, uv).r;
      float hx = texture2D(uVis, uv + vec2(uVisTex.x, 0.0)).r;
      float hy = texture2D(uVis, uv + vec2(0.0, uVisTex.y)).r;
      vec2 gr = vec2(hx - h0, hy - h0) * 6.0 * (1.0 - smoothstep(1.5, 9.0, s));
      vec3 N = normalize(vN.xyz);
      float strana = N.z < 0.0 ? -1.0 : 1.0;
      float back = smoothstep(0.06, -0.06, N.z);
      vec3 T = normalize(vT - N * dot(vT, N));
      vec3 B = cross(N, T);
      vec3 n = normalize(N * strana - (T * gr.x + B * gr.y) * strana);
      if (hon > 0.05 && uZiv > 0.0) {
        vec3 osv = T * osd.x + B * osd.y;
        n = normalize(n + osv * 0.32 * hon * sin(vLok.x * 0.07 - 9.0 * uFaza + vLok.z) * uZiv);
      }
      vec3 V = vec3(0.0, 0.0, 1.0);
      vec3 nR = normalize(vec3(-gr, 1.0));
      float rel = clamp((0.5 + 0.5 * max(dot(n, uKey), 0.0)) / (0.5 + 0.5 * max(dot(nR, uKey), 0.0)), 0.55, 1.35);
      vec3 alb = col;
      if (back > 0.0) {
        float lum = dot(alb, vec3(0.3, 0.59, 0.11));
        vec3 blijedo = mix(alb, vec3(lum) * vec3(0.95, 1.05, 0.72) + vec3(0.07, 0.09, 0.02), 0.6);
        vec3 bijelo = mix(vec3(0.92, 0.93, 0.84), alb, 0.15) * (0.82 + 0.3 * lum);
        vec3 bc = vMat.w > 0.75 ? bijelo : blijedo;
        float zam = gre * step(0.25, vMat.w);
        alb = mix(alb, mix(alb * 0.9, bc, zam), back);
      }
      vec3 lit = alb * rel;
      if (uGold > 0.001) {
        vec3 Lg = uGoldPos - vec3(vA.zw, vN.w);
        float dg = length(Lg);
        Lg /= max(dg, 1.0);
        float pad = uGold * 0.42 / (1.0 + dg * dg / 60000.0);
        vec3 gc = vec3(1.0, 0.80, 0.55);
        float tr = vMat.z * (0.7 * gre + 0.9 * whi + 1.1 * hon + 0.25);
        lit += alb * gc * pad * (0.6 * max(dot(n, Lg), 0.0) + tr * max(dot(-n, Lg), 0.0) * 0.9);
        vec3 Hg = normalize(Lg + V);
        lit += gc * pad * pow(max(dot(n, Hg), 0.0), mix(vMat.y, 80.0, hon)) * mix(vMat.x, 1.0, hon) * 0.6;
      }
      float glo = mix(vMat.x, 1.0, hon) * (1.0 - 0.75 * whi);
      vec3 H = normalize(uKey + V);
      lit += uKeyCol * pow(max(dot(n, H), 0.0), mix(vMat.y, 90.0, hon)) * glo * uSpec * (1.0 - back * 0.6);
      lit *= vInfo.z * vec3(1.0 + 0.05 * vInfo.w, 1.0 - 0.02 * vInfo.w, 1.0 - 0.09 * vInfo.w);
      gl_FragColor = vec4(lit * c.a, c.a) * vInfo.x;
    }`;

  // limun: kora preslikana na elipsoid koji se okreće oko duge osi; sjena i silueta stoje,
  // pore na kori hvataju odsjaje ključnog i zlatnog svjetla
  const VS_LIMUN = `
    attribute vec2 aPos;
    attribute vec2 aLok;
    attribute vec2 aUV;
    uniform vec2 uPomak;
    varying vec2 vLok;
    varying vec2 vUV;
    varying vec2 vPos;
    void main() {
      vLok = aLok; vUV = aUV; vPos = aPos;
      vec2 p = aPos + uPomak;
      gl_Position = vec4(p.x / 540.0 - 1.0, 1.0 - p.y / 540.0, 0.0, 1.0);
    }`;
  const FS_LIMUN = `
    uniform sampler2D uBa, uBb, uAa, uAb, uSjena, uO0, uO1, uVisL;
    uniform float uBw, uOw, uK, uPhi, uA, uEA, uEB, uPsi, uLS, uLT, uGold, uSpec, uOstro;
    uniform vec2 uC, uDL, uDS;
    uniform vec3 uBoja, uKey, uKeyCol, uGoldPos;
    varying vec2 vLok;
    varying vec2 vUV;
    varying vec2 vPos;
    void main() {
      vec2 v = vLok - uC;
      float Lc = dot(v, uDL) / uEA, Sc = dot(v, uDS) / uEB;
      float r2 = Lc * Lc + Sc * Sc;
      vec2 m = vLok;
      vec3 N = vec3(0.0, 0.0, 1.0);
      if (r2 < 1.0) {
        float rho = sqrt(max(0.0, 1.0 - Lc * Lc));
        float Zs = sqrt(max(0.0, 1.0 - r2));
        float psi = atan(Sc, Zs);
        float T2 = 2.0 * uPsi;
        float u = mod(psi - uPhi + uPsi, 2.0 * T2);
        if (u > T2) u = 2.0 * T2 - u;
        m = uC + Lc * uEA * uDL + rho * sin(u - uPsi) * uEB * uDS;
        N = normalize(vec3((Lc / uEA) * uDL + (Sc / uEB) * uDS, Zs / uEB));
      } else {
        N = normalize(vec3(normalize(v), 0.15));
      }
      vec2 tm = m * uLS / uLT, to = vLok * uLS / uLT;
      vec3 alb = mix(texture2D(uBa, tm).rgb, texture2D(uBb, tm).rgb, uBw) * 2.0;
      float al = mix(texture2D(uAa, to).r, texture2D(uAb, to).r, uBw);
      float sh = texture2D(uSjena, to).r * 3.0;
      vec4 spun = vec4(clamp(alb * sh, 0.0, 1.0) * al, al);
      vec4 orig = mix(texture2D(uO0, vUV), texture2D(uO1, vUV), uOw);
      vec4 c = mix(orig, spun, uK);
      if (c.a < 0.004) discard;
      vec2 tb = mix(to, tm, uK);
      float h0 = texture2D(uVisL, tb).r;
      float hx = texture2D(uVisL, tb + vec2(1.0 / 512.0, 0.0)).r;
      float hy = texture2D(uVisL, tb + vec2(0.0, 1.0 / 512.0)).r;
      vec3 n = normalize(N - vec3(hx - h0, hy - h0, 0.0) * 5.0 * uOstro);
      vec3 V = vec3(0.0, 0.0, 1.0);
      vec3 col = c.rgb / c.a;
      vec3 lit = col;
      vec3 H = normalize(uKey + V);
      lit += uKeyCol * (pow(max(dot(n, H), 0.0), 40.0) * 0.20 + pow(max(dot(n, H), 0.0), 120.0) * 0.12 * uOstro) * uSpec;
      if (uGold > 0.001) {
        vec3 Lg = uGoldPos - vec3(vPos, 0.0);
        float dg = length(Lg);
        Lg /= max(dg, 1.0);
        float pad = uGold * 0.42 / (1.0 + dg * dg / 60000.0);
        vec3 gc = vec3(1.0, 0.80, 0.55);
        lit += col * gc * pad * 0.6 * max(dot(n, Lg), 0.0);
        lit += gc * pad * pow(max(dot(n, normalize(Lg + V)), 0.0), 24.0) * 0.3;
      }
      gl_FragColor = vec4(lit * uBoja * c.a, c.a) * uA;
    }`;

  // kapi i niti meda (crtano, ne iz fotografije): jantarna kap koja se rasteže u letu
  const VS_MED = `
    attribute vec2 aPos;
    attribute vec2 aLok;
    attribute vec4 aP;     // vrsta (0 kap, 1 nit), rastezanje, alfa, mekoća ruba
    attribute vec4 aQ;     // zlatno svjetlo, smjer x, smjer y, -
    uniform vec2 uPomak;
    varying vec2 vLok;
    varying vec4 vP;
    varying vec4 vQ;
    void main() {
      vLok = aLok; vP = aP; vQ = aQ;
      vec2 p = aPos + uPomak;
      gl_Position = vec4(p.x / 540.0 - 1.0, 1.0 - p.y / 540.0, 0.0, 1.0);
    }`;
  const FS_MED = `
    uniform vec3 uKey;
    varying vec2 vLok;
    varying vec4 vP;
    varying vec4 vQ;
    void main() {
      vec2 l = vLok;
      float soft = vP.w, edge, thick;
      vec3 n;
      if (vP.x < 0.5) {
        float st = vP.y;
        float bx = l.x < 0.0 ? l.x / (1.0 + st) : l.x / (1.0 + 0.2 * st);
        float tail = clamp(-bx, 0.0, 1.0);
        float by = l.y / (1.0 - 0.42 * tail * tail);
        float d = length(vec2(bx, by));
        edge = 1.0 - smoothstep(1.0 - soft, 1.0 + 0.5 * soft, d);
        float dd = min(d, 1.0);
        thick = sqrt(max(1.0 - dd * dd, 0.0));
        n = normalize(vec3(bx, by, thick * 1.15 + 0.05));
      } else {
        float a = l.y;
        edge = 1.0 - smoothstep(1.0 - soft, 1.0 + 0.5 * soft, abs(a));
        thick = sqrt(max(1.0 - min(a * a, 1.0), 0.0));
        n = normalize(vec3(0.0, a, thick + 0.05));
        thick *= 0.75;
      }
      if (edge <= 0.002) discard;
      vec2 dir = vQ.yz;
      vec3 N = vec3(n.x * dir + n.y * vec2(-dir.y, dir.x), n.z);
      vec3 H = normalize(uKey + vec3(0.0, 0.0, 1.0));
      float ndh = max(dot(N, H), 0.0);
      float through = 0.45 * thick + 0.55 * thick * max(dot(-N.xy, normalize(uKey.xy)), 0.0);
      vec3 col = mix(vec3(0.40, 0.10, 0.01), vec3(0.98, 0.52, 0.08), through);
      col *= 1.0 - 0.42 * pow(1.0 - N.z, 2.0);
      col += vec3(1.0, 0.94, 0.82) * (pow(ndh, 90.0) * 1.5 + pow(ndh, 14.0) * 0.12);
      col += vec3(1.0, 0.70, 0.30) * vQ.x * (0.35 + 0.65 * through);
      gl_FragColor = vec4(col * edge, edge) * vP.z;
    }`;

  // bočica: oblikuje se iz svjetla (užareni rub), hladi se; na kraju se raspadne u prašinu
  const FS_BOCICA = `
    uniform sampler2D uTex, uSum;
    uniform float uVis, uHot, uForm, uRaspad, uDuh, uVr;
    varying vec2 vUV;
    void main() {
      vec4 c = texture2D(uTex, vUV);
      if (c.a < 0.003) discard;
      float n = texture2D(uSum, vUV * vec2(2.0, 4.4) + vec2(0.0, uVr * 0.05)).r;
      float n2 = texture2D(uSum, vUV * vec2(7.0, 15.0) - vec2(0.0, uVr * 0.08)).g;
      // punjenje odozdo: valovita crta rastaljenog zlata
      float f = (1.0 - vUV.y) + (n - 0.5) * 0.10 + (n2 - 0.5) * 0.05;
      float fr = uForm * 1.14 - 0.05;
      float vid = 1.0 - smoothstep(fr - 0.012, fr + 0.012, f);
      float kraj = 1.0 - smoothstep(0.9, 1.0, uForm);
      float rub = exp(-pow((f - fr) / 0.022, 2.0)) * kraj;
      float vruce = clamp(1.0 - (fr - f) / 0.16, 0.0, 1.0) * kraj;
      // raspad u prašinu
      float fd = 0.5 * vUV.y + 0.36 * n + 0.14 * n2;
      float dr = uRaspad * 1.12 - 0.06;
      float vd = smoothstep(dr - 0.02, dr + 0.02, fd);
      float rubd = exp(-pow((fd - dr) / 0.028, 2.0)) * step(0.001, uRaspad) * (1.0 - smoothstep(0.92, 1.0, uRaspad));
      vec3 zl = vec3(1.0, 0.78, 0.42);
      vec3 col = mix(c.rgb, c.rgb * vec3(1.02, 0.86, 0.60) + vec3(0.06, 0.035, 0.0) * c.a, clamp(uHot, 0.0, 1.0) * 0.9);
      col = mix(col, zl * c.a * 1.08, vruce * 0.75);
      col += vec3(1.0, 0.86, 0.55) * rub * 1.5 * c.a + vec3(1.0, 0.62, 0.25) * rubd * 1.4 * c.a;
      float v = vid * vd;
      vec3 duh = vec3(1.0, 0.86, 0.62) * c.a * uDuh * 0.20 * (1.0 - v);
      gl_FragColor = vec4(col * v * uVis + duh, c.a * v * uVis);
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
  // čestice: prašina, pelud, zlatne iskre (dodaju svjetlo; meka točka ili bokeh krug)
  const VS_CESTICA = `
    attribute vec2 aPos;
    attribute vec2 aLok;
    attribute vec4 aC;
    uniform vec2 uPomak;
    varying vec2 vLok;
    varying vec4 vC;
    void main() {
      vLok = aLok; vC = aC;
      vec2 p = aPos + uPomak;
      gl_Position = vec4(p.x / 540.0 - 1.0, 1.0 - p.y / 540.0, 0.0, 1.0);
    }`;
  const FS_CESTICA = `
    varying vec2 vLok;
    varying vec4 vC;
    void main() {
      float r = length(vLok);
      float g = exp(-r * r * 3.5);
      float disc = (1.0 - smoothstep(0.82, 1.0, r)) * (0.72 + 0.28 * smoothstep(0.45, 0.92, r));
      gl_FragColor = vec4(vC.rgb * mix(g, disc, vC.a), 0.0);
    }`;
  // pokretno zamućenje: zbroj podkadrova
  const FS_ZBROJ = `
    uniform sampler2D uTex;
    uniform float uMul;
    varying vec2 vPos;
    void main() { gl_FragColor = texture2D(uTex, vec2(vPos.x / 1080.0, 1.0 - vPos.y / 1080.0)) * uMul; }`;
  // svjetla mjesta (za zrake i sjaj): smanjeno 4 x
  const FS_SVJETLO = `
    uniform sampler2D uTex;
    uniform vec2 uKorak;
    uniform float uPrag;
    varying vec2 vUv;
    void main() {
      vec3 c = (texture2D(uTex, vUv + uKorak * vec2(-1.0, -1.0)).rgb + texture2D(uTex, vUv + uKorak * vec2(1.0, -1.0)).rgb +
                texture2D(uTex, vUv + uKorak * vec2(-1.0, 1.0)).rgb + texture2D(uTex, vUv + uKorak * vec2(1.0, 1.0)).rgb) * 0.25;
      gl_FragColor = vec4(max(c - vec3(uPrag), 0.0) / (1.0 - uPrag), 1.0);
    }`;
  // zrake: radijalno zamućenje svjetlih mjesta prema izvoru svjetla
  const FS_ZRAKE = `
    uniform sampler2D uTex;
    uniform vec2 uIzvor;
    uniform float uDuz, uPad, uJac;
    varying vec2 vUv;
    void main() {
      vec2 d = (uIzvor - vUv) * uDuz / 24.0;
      vec2 p = vUv;
      vec3 a = vec3(0.0);
      float w = 1.0;
      for (int i = 0; i < 24; i++) { a += texture2D(uTex, p).rgb * w; w *= uPad; p += d; }
      gl_FragColor = vec4(a * uJac / 24.0, 1.0);
    }`;
  const FS_MUTI = `
    uniform sampler2D uTex;
    uniform vec2 uSmjer;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(uTex, vUv).rgb * 0.2270;
      c += (texture2D(uTex, vUv + uSmjer * 1.3846).rgb + texture2D(uTex, vUv - uSmjer * 1.3846).rgb) * 0.3162;
      c += (texture2D(uTex, vUv + uSmjer * 3.2308).rgb + texture2D(uTex, vUv - uSmjer * 3.2308).rgb) * 0.0703;
      gl_FragColor = vec4(c, 1.0);
    }`;
  // završno: val pri prasku, titranje zraka oko vruće bočice, lom boja na rubu, zrake, sjaj,
  // tamni rub (stapa se s podlogom početnog ekrana), filmsko zrno
  const FS_KONACNO = `
    uniform sampler2D uKadar, uZrake, uSjaj, uSum;
    uniform float uZrJ, uSjJ, uCA, uZrno, uValR, uValJ, uDrht, uVr, uBlj, uZrnoMj;
    uniform vec2 uBo, uZrnoPom;
    uniform vec4 uDrhtP;
    varying vec2 vUv;
    vec2 uvK(vec2 p) { return vec2(p.x / 1080.0, 1.0 - p.y / 1080.0); }
    void main() {
      vec2 p = vec2(vUv.x, 1.0 - vUv.y) * 1080.0;
      vec2 disp = vec2(0.0);
      if (uValJ > 0.0) {
        vec2 dv = p - uBo;
        float r = length(dv);
        disp += dv / max(r, 1.0) * exp(-pow((r - uValR) / 42.0, 2.0)) * uValJ * 12.0;
      }
      if (uDrht > 0.0) {
        vec2 e = (p - uDrhtP.xy) / uDrhtP.zw;
        vec2 n = texture2D(uSum, p / 260.0 + vec2(0.0, uVr * 0.09)).rg - 0.5;
        disp += n * exp(-dot(e, e)) * uDrht * 7.0;
      }
      vec2 q = p + disp;
      vec2 ca = (q - vec2(540.0)) * uCA;
      vec3 c = vec3(texture2D(uKadar, uvK(q + ca)).r, texture2D(uKadar, uvK(q)).g, texture2D(uKadar, uvK(q - ca)).b);
      c += texture2D(uZrake, vUv).rgb * uZrJ;
      c += texture2D(uSjaj, vUv).rgb * uSjJ;
      c *= 1.0 + uBlj;
      float rc = length(p - vec2(540.0)) / 1080.0;
      float x = clamp((rc - 0.30) / 0.20, 0.0, 1.0);
      c *= (1.0 - x) * (1.0 - x) * (1.0 + 2.0 * x);
      float l = dot(c, vec3(0.3, 0.59, 0.11));
      float g = texture2D(uSum, gl_FragCoord.xy * uZrnoMj + uZrnoPom).b - 0.5;
      c += g * uZrno * smoothstep(0.015, 0.2, l) * (1.2 - min(l, 1.0));
      gl_FragColor = vec4(c, 1.0);
    }`;

  // ─────────────────────────────────────────────────────────────────────
  //  PODACI — film-podaci.js (jednom po stranici)
  // ─────────────────────────────────────────────────────────────────────
  let PODACI_OBECANJE = null;
  function ucitajPodatke(mapa) {
    if (PODACI_OBECANJE) return PODACI_OBECANJE;
    PODACI_OBECANJE = new Promise(function (ok, ne) {
      if (window.MX_FILM_PODACI && window.MX_FILM_PODACI.verzija === 2) { ok(window.MX_FILM_PODACI); return; }
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
  // slučajni brojevi s početnom vrijednošću (isti raspored pri svakom učitavanju)
  function slucajni(sjeme) {
    let a = sjeme | 0;
    return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // šum 128 x 128 koji se ponavlja: R i G glatki (8 i 16 polja), B bijeli šum (zrno, iskre)
  function napraviSum() {
    const N = 128, rnd = slucajni(1234), out = new Uint8Array(N * N * 4);
    function polje(st) {
      const g = new Float32Array(st * st);
      for (let i = 0; i < g.length; i++) g[i] = rnd();
      return function (x, y) {
        const fx = x * st / N, fy = y * st / N;
        const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const a = g[(y0 % st) * st + x0 % st], b = g[(y0 % st) * st + (x0 + 1) % st];
        const c = g[((y0 + 1) % st) * st + x0 % st], d = g[((y0 + 1) % st) * st + (x0 + 1) % st];
        return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
      };
    }
    const p8 = polje(8), p16 = polje(16), p32 = polje(32);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const o = (y * N + x) * 4;
      out[o] = Math.round(255 * (0.75 * p8(x, y) + 0.25 * p32(x, y)));
      out[o + 1] = Math.round(255 * (0.7 * p16(x, y) + 0.3 * p32(x, y)));
      out[o + 2] = Math.floor(rnd() * 256);
      out[o + 3] = 255;
    }
    return out;
  }

  // vrste komada: mekoća (koliko se savija i diše), učestalost lepršanja, materijal
  const VRSTE = {
    list: { id: 0, meko: 1.0, nf: 19 }, kora: { id: 1, meko: 0.45, nf: 15 }, latica: { id: 2, meko: 1.25, nf: 26 },
    cvijet: { id: 3, meko: 0.6, nf: 21 }, med: { id: 4, meko: 0.35, nf: 11 }, sace: { id: 5, meko: 0.08, nf: 9 },
    stabljika: { id: 6, meko: 0.7, nf: 17 }, limun: { id: 7, meko: 0, nf: 0 }
  };
  // materijali: jačina odsjaja, oštrina odsjaja, prozirnost (svjetlo kroz list), poleđina (0,5 list, 1 kora)
  const MATERIJALI = new Float32Array([
    0.55, 34, 0.9, 0.5,    // list
    0.45, 26, 0.35, 1.0,   // kora limete
    0.10, 9, 1.1, 0.0,     // latica
    0.14, 12, 0.8, 0.0,    // cvijet
    0.95, 70, 0.9, 0.0,    // med
    0.85, 60, 0.6, 0.0,    // saće
    0.30, 18, 0.5, 0.3     // stabljika
  ]);

  // ─────────────────────────────────────────────────────────────────────
  //  ANIMACIJA — isti oblik kao napraviAnimaciju u pocetna-chata.js
  // ─────────────────────────────────────────────────────────────────────
  function napravi(platno, scena, dogadaji, opcije) {
    opcije = opcije || {};
    const MIRNO = opcije.mirno || { matches: false };
    const ponavljaj = opcije.ponavljaj !== false;
    const mapa = opcije.mapa || MAPA;
    let omot = null, slika = null, can = null, gl = null, ext = null;
    let priprema = null, unisteno = false, stoji = false, otvoren = false, spreman = false;
    let raf = 0, vrijeme = 0, zivo = 0, zadnje = 0, prviKadar = false;
    let dpr = 1, maxUzoraka = NAJVISE_UZORAKA, mjerenje = { n: 0, zbroj: 0 }, smanjeno = 0;
    let PRG = {}, TEX = {}, FBO = {}, buf = null, ibuf = null, gbuf = null, instBuf = null;
    let komadi = [], kapi = [], limun = null, prah = [], tamne = [], iskre = [], prasina = [];
    let podaci = null, nGrid = 0;
    // stanje WebGL-a (da se isti pozivi ne ponavljaju): program, atributi, teksture, broj kadra
    let trenutni = null, okvir = 0;
    const ukljuceno = [false, false, false, false, false, false, false, false];
    const djelitelj = [0, 0, 0, 0, 0, 0, 0, 0];
    let vezano = [];
    let uzorci = new Map();

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
      dpr = Math.min(NAJVISE_DPR, window.devicePixelRatio || 1) * [1, 0.75, 0.6, 0.5][smanjeno];
      const b = Math.max(64, Math.round(s * dpr));
      if (can && (can.width !== b || can.height !== b)) {
        can.width = b; can.height = b;
        if (gl) { napraviFBO(); if (spreman && !raf) crtaj(vrijeme % L, zivo); }
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
    function tekstura(img, premul, ponovi) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !!premul);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, ponovi ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, ponovi ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      return t;
    }
    function sloj(w, h) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return { f: f, t: t, w: w, h: h };
    }
    function napraviFBO() {
      Object.keys(FBO).forEach(function (k) { gl.deleteFramebuffer(FBO[k].f); gl.deleteTexture(FBO[k].t); });
      FBO = {};
      const w = can.width, h = can.height;
      ['kadar', 'tmp', 'iza', 'ispred'].forEach(function (k) { FBO[k] = sloj(w, h); });
      const w4 = Math.max(32, Math.round(w / 4)), w8 = Math.max(16, Math.round(w / 8));
      FBO.svj = sloj(w4, w4); FBO.zr = sloj(w4, w4);
      FBO.bl1 = sloj(w8, w8); FBO.bl2 = sloj(w8, w8);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      vezano = [];
    }
    function pocniGL(D) {
      gl = can.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false })
        || can.getContext('experimental-webgl', { alpha: false, antialias: false, depth: false, stencil: false });
      if (!gl) throw new Error('nema WebGL-a');
      ext = gl.getExtension('ANGLE_instanced_arrays');
      zaboraviStanje();
      const S = D.slike;
      PRG.prizor = program(VS_KADAR, FS_PRIZOR, ['aPos']);
      PRG.komad = program(VS_KOMAD, FS_KOMAD, ['aGrid', 'iA', 'iB', 'iC', 'iD', 'iE', 'iF', 'iG']);
      PRG.limun = program(VS_LIMUN, FS_LIMUN, ['aPos', 'aLok', 'aUV']);
      PRG.med = program(VS_MED, FS_MED, ['aPos', 'aLok', 'aP', 'aQ']);
      PRG.bocica = program(VS_UV, FS_BOCICA, ['aPos', 'aUV']);
      PRG.sjaj = program(VS_UV, FS_SJAJ, ['aPos', 'aUV']);
      PRG.cestica = program(VS_CESTICA, FS_CESTICA, ['aPos', 'aLok', 'aC']);
      PRG.zbroj = program(VS_EKRAN, FS_ZBROJ, ['aPos']);
      PRG.svjetlo = program(VS_POST, FS_SVJETLO, ['aPos']);
      PRG.zrake = program(VS_POST, FS_ZRAKE, ['aPos']);
      PRG.muti = program(VS_POST, FS_MUTI, ['aPos']);
      PRG.konacno = program(VS_POST, FS_KONACNO, ['aPos']);
      for (let i = 0; i < 5; i++) {
        TEX['atlas' + i] = tekstura(S['atlas' + i], true);
        TEX['limunBoja' + i] = tekstura(S['limunBoja' + i], false);
        TEX['limunAlfa' + i] = tekstura(S['limunAlfa' + i], false);
      }
      for (let i = 0; i < 4; i++) TEX['prizor' + i] = tekstura(S['prizor' + i], false);
      ['limunSjena', 'limunVisina', 'maske', 'maske2', 'maske3', 'visina', 'sjaj'].forEach(function (k) { TEX[k] = tekstura(S[k], false); });
      TEX.bocica = tekstura(S.bocica, true);
      TEX.sum = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, TEX.sum);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, napraviSum());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      buf = gl.createBuffer();
      instBuf = gl.createBuffer();
      // mreža komada: (G+1)^2 vrhova, G^2 * 2 trokuta
      const G = 10, v = [], ix = [];
      for (let j = 0; j <= G; j++) for (let i = 0; i <= G; i++) v.push(i / G, j / G);
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
        const a = j * (G + 1) + i, b = a + 1, c = a + G + 1, d = c + 1;
        ix.push(a, b, c, c, b, d);
      }
      nGrid = ix.length;
      gbuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, gbuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
      ibuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ix), gl.STATIC_DRAW);
      napraviFBO();
      gl.disable(gl.DEPTH_TEST);
      staticniUniformi();
    }
    // uniformi koji se ne mijenjaju (postave se jednom)
    function staticniUniformi() {
      const at = podaci.P.atlas;
      let u = koristi(PRG.komad);
      gl.uniform4f(u.uSig, at.sigma[1], at.sigma[2], at.sigma[3], at.sigma[4]);
      gl.uniform2f(u.uAtlas, at.W, at.H);
      gl.uniform2f(u.uVisTex, 2 / at.W, 2 / at.H);
      gl.uniform1f(u.uAS, at.AS); gl.uniform1f(u.uF, K.F); gl.uniform1f(u.uDof, 0.0105);
      gl.uniform2f(u.uBo, K.Bo[0], K.Bo[1]);
      gl.uniform4fv(u.uMat, MATERIJALI);
      gl.uniform3f(u.uKeyCol, 1.0, 0.95, 0.86);
      gl.uniform1f(u.uSpec, 0.42);
      gl.uniform3f(u.uGoldPos, K.Bo[0], K.Bo[1], 0);
      u = koristi(PRG.limun);
      gl.uniform1f(u.uEA, limun.A); gl.uniform1f(u.uEB, limun.B); gl.uniform1f(u.uPsi, limun.psi);
      gl.uniform1f(u.uLS, limun.LS); gl.uniform1f(u.uLT, limun.LT);
      gl.uniform2f(u.uC, limun.ecx, limun.ecy); gl.uniform2f(u.uDL, limun.dL[0], limun.dL[1]); gl.uniform2f(u.uDS, limun.dS[0], limun.dS[1]);
      gl.uniform3f(u.uKeyCol, 1.0, 0.95, 0.86);
      gl.uniform3f(u.uGoldPos, K.Bo[0], K.Bo[1], 0);
      u = koristi(PRG.prizor);
      gl.uniform1f(u.uS2, K.S2);
      gl.uniform2f(u.uBo, K.Bo[0], K.Bo[1]); gl.uniform2f(u.uBi, K.Bi[0], K.Bi[1]);
      u = koristi(PRG.konacno);
      gl.uniform2f(u.uBo, K.Bo[0], K.Bo[1]);
      gl.uniform4f(u.uDrhtP, K.Bo[0], K.Bo[1] - 20, 150, 260);
    }
    function pripremiPodatke(P) {
      K = P.k; L = K.L;
      tablice();
      const rnd = slucajni(77);
      komadi = P.komadi.map(function (k) {
        const v = VRSTE[k.vrsta] || VRSTE.cvijet;
        return Object.assign({ kap: false, meko: v.meko, nf: v.nf, vid: v.id,
          f1: rnd() * PI2, f2: rnd() * PI2, f3: rnd() * PI2, f4: rnd() * PI2, f5: rnd() * PI2, fm: rnd() * PI2,
          sgn: rnd() < 0.5 ? -1 : 1, brz: 0 }, k);
      });
      komadiRef = komadi;
      kapi = P.kapi.map(function (k) {
        const h = komadi[k.med], ang = rnd() * PI2, d = 0.26 * Math.min(h.w, h.h) * (0.5 + 0.5 * rnd());
        return Object.assign({ kap: true, ox: Math.cos(ang) * d, oy: Math.sin(ang) * d, sgn: rnd() < 0.5 ? -1 : 1, brz: 0 }, k);
      });
      limun = P.limun;
      // prašina u suncu (prizor)
      let r = slucajni(7);
      prah = [];
      for (let i = 0; i < 46; i++) prah.push({ x: r() * (U + 80) - 40, y: r() * (U + 80) - 40, d: r(), b: 0.25 + 0.75 * r(), ph: r() * PI2, fr: 0.15 + 0.35 * r() });
      // pelud u tami (oko sastojaka), periodično s petljom
      r = slucajni(21);
      tamne = [];
      for (let i = 0; i < 34; i++) {
        const a = r() * PI2, rr = 120 + 330 * Math.sqrt(r());
        tamne.push({ x: K.Bo[0] + Math.cos(a) * rr, y: K.Bo[1] + Math.sin(a) * rr * 0.85, d: r(), b: 0.3 + 0.7 * r(),
          k1: 1 + Math.floor(r() * 3), k2: 1 + Math.floor(r() * 3), p1: r() * PI2, p2: r() * PI2, ax: 8 + 18 * r(), ay: 6 + 14 * r(), tw: 2 + Math.floor(r() * 5) });
      }
      // zlatne iskre: skupljaju se u bočicu (vrtlog)
      r = slucajni(33);
      iskre = [];
      for (let i = 0; i < 46; i++) iskre.push({ th0: r() * PI2, r0: 170 + 300 * r(), y0: (r() - 0.5) * 240, ts: 3.1 + 1.8 * r(), life: 0.9 + 0.6 * r(), b: 0.5 + 0.5 * r(), sz: 1.2 + 1.6 * r() });
      // zlatna prašina: bočica se u nju raspadne
      r = slucajni(55);
      prasina = [];
      const BO = P.bocica;
      for (let i = 0; i < 72; i++) {
        const kapa = r() < 0.28;
        const a = r() * PI2, rr = Math.sqrt(r());
        const px = 514 + Math.cos(a) * rr * (kapa ? 38 : 104), py = (kapa ? 345 : 600) + Math.sin(a) * rr * (kapa ? 70 : 150);
        const vy = (py - BO.y0) / BO.h;                       // 0 vrh, 1 dno: prašina se odvaja odozgo prema dolje
        const fd = 0.5 * vy + 0.5 * r();
        prasina.push({ px: px, py: py, ts: 11.95 + 1.45 * Math.min(1, (fd + 0.06) / 1.12) - 0.05, life: 0.9 + 0.8 * r(), b: 0.45 + 0.55 * r(), sz: 0.8 + 1.5 * r(), sw: (r() - 0.5) * 2 });
      }
    }

    // ── crtanje ──
    function atributi(n) {
      for (let i = 0; i < 8; i++) {
        const w = i < n;
        if (ukljuceno[i] !== w) { if (w) gl.enableVertexAttribArray(i); else gl.disableVertexAttribArray(i); ukljuceno[i] = w; }
      }
    }
    function djeli(i, d) { if (ext && djelitelj[i] !== d) { ext.vertexAttribDivisorANGLE(i, d); djelitelj[i] = d; } }
    function veziAtribute(raspored, korak) {
      atributi(raspored.length);
      let o = 0;
      raspored.forEach(function (n, i) {
        djeli(i, 0);
        gl.vertexAttribPointer(i, n, gl.FLOAT, false, korak * 4, o * 4);
        o += n;
      });
    }
    function koristi(prg) { if (trenutni !== prg) { gl.useProgram(prg.p); trenutni = prg; } return prg.u; }
    function tex(u, jedinica, t) {
      if (vezano[jedinica] !== t) { gl.activeTexture(gl.TEXTURE0 + jedinica); gl.bindTexture(gl.TEXTURE_2D, t); vezano[jedinica] = t; }
      if (u && uzorci.get(u) !== jedinica) { gl.uniform1i(u, jedinica); uzorci.set(u, jedinica); }
    }
    // jednom po kadru za svaki program
    function noviKadar(prg) { if (prg.okvir === okvir) return false; prg.okvir = okvir; return true; }
    function zaboraviStanje() {
      trenutni = null; vezano = []; uzorci = new Map();
      for (let i = 0; i < 8; i++) { ukljuceno[i] = false; djelitelj[i] = 0; }
    }
    function cetverokut(x0, y0, x1, y1) { return new Float32Array([x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1]); }
    const PUN = cetverokut(-2, -2, U + 2, U + 2);
    const POST = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    function crtajPun() {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, PUN, gl.STREAM_DRAW);
      veziAtribute([2], 2);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    function crtajPost() {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, POST, gl.STREAM_DRAW);
      veziAtribute([2], 2);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    function cilj(f) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, f ? f.f : null);
      gl.viewport(0, 0, f ? f.w : can.width, f ? f.h : can.height);
    }
    function razinePrizora(sig) {
      const s = podaci.P.prizor.sigma;
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

    // stanje jednog kadra (svjetla, vrijeme)
    const KD = { t: 0, ta: 0, faza: 0, pomak: [0, 0], key: [0, 0, 1], gold: 0, sv: 0, n: 1 };

    function crtajPrizor(t) {
      const sv = prizorJacina(t), g = sjajSredine(t);
      if (sv <= 0.002 && g <= 0) return;
      const z = Z2(t);
      const u = koristi(PRG.prizor);
      for (let i = 0; i < 4; i++) tex(u['uR' + i], i, TEX['prizor' + i]);
      tex(u.uMask, 4, TEX.maske); tex(u.uMask2, 5, TEX.maske2); tex(u.uMask3, 6, TEX.maske3);
      tex(u.uSum, 7, TEX.sum);
      const mut = mutnoca(t) / (K.S2 * z);
      const otkriva = ramp(t, 5.9, 7.6) * (1 - ramp(t, 7.6, 8.3));       // bočica se izoštri prije ostatka
      gl.uniform1f(u.uMut, mut); gl.uniform1f(u.uOstr, 2.6 * otkriva);
      gl.uniform1f(u.uBoc, t > 7.65 && t < 11.3 ? 1 : 0);
      gl.uniform1f(u.uZ, z); gl.uniform1f(u.uT, truck(t));
      gl.uniform1f(u.uJac, sv); gl.uniform1f(u.uKrug, prizorKrug(t)); gl.uniform1f(u.uVrt, sv * (1 - ramp(t, 6.0, 7.7)));
      gl.uniform1f(u.uSjaj, g); gl.uniform1f(u.uVr, KD.ta);
      const zv = ZIVOST * ramp(t, 5.9, 7.2) * (1 - ramp(t, 11.3, 12.6));
      gl.uniform1f(u.uZiv, zv);
      gl.uniform1f(u.uSunce, ZIVOST * ramp(t, 6.4, 8.0) * (1 - ramp(t, 11.2, 12.4)));
      const gt = (t - 8.75) / 1.15;
      gl.uniform1f(u.uXc, 400 + 260 * eio(gt));
      gl.uniform1f(u.uOdsjaj, gt > 0 && gt < 1 ? Math.pow(Math.sin(Math.PI * gt), 0.6) : 0);
      const bt = (t - 8.2) / 2.9;
      gl.uniform1f(u.uTx, 360 + 320 * eio(bt));
      gl.uniform1f(u.uTj, bt > 0 && bt < 1 ? 0.075 * Math.pow(Math.sin(Math.PI * bt), 1.2) : 0);
      gl.uniform2f(u.uPomak, KD.pomak[0], KD.pomak[1]);
      gl.disable(gl.BLEND);
      crtajPun();
    }

    // komadi kao instance (jedan poziv za niz komada)
    const INST = new Float32Array(64 * 28);
    function upisiKomad(n, q, st, t) {
      const at = podaci.P.atlas;
      const b = savijanje(q, t, q.brz);
      const bz = brzinaZamuta(q, st);
      const zmax = Math.abs(st.z) + st.s * 0.55 * Math.max(q.w, q.h);
      const sigAt = 0.0105 * zmax / Math.max(st.s, 1e-3) * at.AS + bz[0];
      const marg = Math.min(at.pad, 3 * sigAt + 3) / at.AS;
      const o = n * 28;
      INST[o] = st.x; INST[o + 1] = st.y; INST[o + 2] = st.z; INST[o + 3] = st.s;
      INST[o + 4] = st.rot; INST[o + 5] = st.phi; INST[o + 6] = q.faxis; INST[o + 7] = st.a * bz[1];
      INST[o + 8] = q.at[0]; INST[o + 9] = q.at[1]; INST[o + 10] = q.w; INST[o + 11] = q.h;
      INST[o + 12] = q.cl[0]; INST[o + 13] = q.cl[1]; INST[o + 14] = marg; INST[o + 15] = bz[0];
      INST[o + 16] = b[0]; INST[o + 17] = b[1]; INST[o + 18] = b[2]; INST[o + 19] = b[3];
      INST[o + 20] = q.os; INST[o + 21] = Math.max(8, q.duz); INST[o + 22] = Math.max(6, q.sir); INST[o + 23] = q.vid;
      INST[o + 24] = 1 + 0.10 * Math.cos(st.th) * st.w; INST[o + 25] = KD.sv; INST[o + 26] = q.fm; INST[o + 27] = 0;
    }
    function crtajKomade(lista, i0, i1, t) {
      const n = i1 - i0;
      if (!n) return;
      for (let i = 0; i < n; i++) upisiKomad(i, lista[i0 + i].q, lista[i0 + i].st, t);
      const u = koristi(PRG.komad);
      for (let k = 0; k < 5; k++) tex(u['uL' + k], k, TEX['atlas' + k]);
      tex(u.uVis, 5, TEX.visina);
      if (noviKadar(PRG.komad)) {
        gl.uniform3f(u.uKey, KD.key[0], KD.key[1], KD.key[2]);
        gl.uniform1f(u.uGold, KD.gold);
        gl.uniform1f(u.uFaza, KD.faza); gl.uniform1f(u.uZiv, ZIVOST);
        gl.uniform2f(u.uPomak, KD.pomak[0], KD.pomak[1]);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, gbuf);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
      if (ext) {
        atributi(8);
        djeli(0, 0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
        gl.bufferData(gl.ARRAY_BUFFER, INST.subarray(0, n * 28), gl.STREAM_DRAW);
        for (let a = 0; a < 7; a++) {
          gl.vertexAttribPointer(1 + a, 4, gl.FLOAT, false, 112, a * 16);
          djeli(1 + a, 1);
        }
        ext.drawElementsInstancedANGLE(gl.TRIANGLES, nGrid, gl.UNSIGNED_SHORT, 0, n);
      } else {
        atributi(1);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
        for (let k = 0; k < n; k++) {
          for (let a = 0; a < 7; a++) gl.vertexAttrib4fv(1 + a, INST.subarray(k * 28 + a * 4, k * 28 + a * 4 + 4));
          gl.drawElements(gl.TRIANGLES, nGrid, gl.UNSIGNED_SHORT, 0);
        }
      }
    }
    function crtajLimun(q, st, t) {
      const A = afina(q, st);
      const at = podaci.P.atlas;
      const bz = brzinaZamuta(q, st);
      const sigAt = 0.0105 * Math.abs(st.z) / Math.max(st.s, 1e-3) * at.AS + bz[0];
      const sigSpr = sigAt / at.AS;
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
      tex(u.uVisL, 7, TEX.limunVisina);
      gl.uniform1f(u.uBw, rl[2]);
      gl.uniform1f(u.uOw, sat(sigAt / at.sigma[1]));
      gl.uniform1f(u.uK, st.w > 0.12 ? sat((st.w - 0.12) / 0.2) : 0);
      gl.uniform1f(u.uPhi, 1.9 * TAU(t));
      gl.uniform1f(u.uA, st.a * bz[1]);
      const light = (1 + 0.10 * Math.cos(st.th) * st.w) * (A[6] < 0 ? 0.86 : 1);
      gl.uniform3f(u.uBoja, (1 + 0.05 * KD.sv) * light, (1 - 0.02 * KD.sv) * light, (1 - 0.09 * KD.sv) * light);
      if (noviKadar(PRG.limun)) {
        gl.uniform3f(u.uKey, KD.key[0], KD.key[1], KD.key[2]);
        gl.uniform1f(u.uGold, KD.gold); gl.uniform1f(u.uSpec, ZIVOST > 0 ? 1 : 0.5);
        gl.uniform2f(u.uPomak, KD.pomak[0], KD.pomak[1]);
      }
      gl.uniform1f(u.uOstro, 1 - sat(sigAt / 8));
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, V, gl.STREAM_DRAW);
      veziAtribute([2, 2, 2], 6);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    // kapi meda (i niti) u nizu
    let MEDV = new Float32Array(4096);
    function rezerviraj(n) { if (MEDV.length < n) { const nv = new Float32Array(Math.max(n, MEDV.length * 2)); nv.set(MEDV); MEDV = nv; } }
    function crtajMed(lista, i0, i1, t) {
      let o = 0;
      function vrh(x, y, lx, ly, vrsta, st, a, soft, g, dx, dy) {
        MEDV[o++] = x; MEDV[o++] = y; MEDV[o++] = lx; MEDV[o++] = ly;
        MEDV[o++] = vrsta; MEDV[o++] = st; MEDV[o++] = a; MEDV[o++] = soft;
        MEDV[o++] = g; MEDV[o++] = dx; MEDV[o++] = dy; MEDV[o++] = 0;
      }
      for (let i = i0; i < i1; i++) {
        const k = lista[i].q, st = lista[i].st;
        rezerviraj(o + 120 * 12);
        const sa = stanjeKapi(k, t - 1 / 120), sb = stanjeKapi(k, t + 1 / 120);
        let dx = 1, dy = 0, brz = 0;
        if (sa && sb) { dx = sb.x - sa.x; dy = sb.y - sa.y; brz = Math.hypot(dx, dy) * 60; const n = Math.hypot(dx, dy); if (n > 1e-4) { dx /= n; dy /= n; } else { dx = 1; dy = 0; } }
        const str = Math.min(1.6, brz / 1100);
        const r = st.r;
        const soft = Math.min(0.9, 0.12 + 0.0105 * Math.abs(st.z) / Math.max(r, 1) * 1.5);
        const gg = KD.gold / (1 + ((st.x - K.Bo[0]) * (st.x - K.Bo[0]) + (st.y - K.Bo[1]) * (st.y - K.Bo[1])) / 72000);
        const ex = r * (1 + str) * 1.25, ef = r * (1 + 0.2 * str) * 1.25, ey = r * 1.25;
        const px = -dy, py = dx;
        const c = [[-ex, -ey], [ef, -ey], [-ex, ey], [-ex, ey], [ef, -ey], [ef, ey]];
        for (let j = 0; j < 6; j++) {
          const lx = c[j][0], ly = c[j][1];
          vrh(st.x + dx * lx + px * ly, st.y + dy * lx + py * ly, lx / r, ly / r, 0, str, st.a, soft, gg, dx, dy);
        }
        // nit: od komada meda do kapi, stanji se i pukne
        const tk = t - k.te;
        if (tk > 0 && tk < 0.6 && ZIVOST > 0) {
          const A = [st.ax, st.ay], B = [st.x, st.y];
          const L0 = Math.hypot(B[0] - A[0], B[1] - A[1]);
          if (L0 > 1.5) {
            const nx = -(B[1] - A[1]) / L0, ny = (B[0] - A[0]) / L0;
            const C = [(A[0] + B[0]) / 2 + nx * 0.16 * L0 * k.sgn, (A[1] + B[1]) / 2 + ny * 0.16 * L0 * k.sgn];
            const pinch = Math.max(sat(tk / 0.36), sat(L0 / (8 * r))), pukla = tk > 0.36 || L0 > 8 * r;
            const rv = pukla ? Math.max(eout((tk - 0.36) / 0.2), sat((L0 - 8 * r) / (5 * r))) : 0;
            const w0 = 0.46 * r;
            const dijelovi = pukla ? [[0, 0.5 * (1 - rv)], [1 - 0.5 * (1 - rv), 1]] : [[0, 1]];
            dijelovi.forEach(function (dj) {
              if (dj[1] - dj[0] < 0.01) return;
              const M = 12;
              let prev = null;
              for (let m = 0; m <= M; m++) {
                const s = dj[0] + (dj[1] - dj[0]) * m / M;
                const s1 = 1 - s;
                const x = s1 * s1 * A[0] + 2 * s1 * s * C[0] + s * s * B[0], y = s1 * s1 * A[1] + 2 * s1 * s * C[1] + s * s * B[1];
                let tx = 2 * s1 * (C[0] - A[0]) + 2 * s * (B[0] - C[0]), ty = 2 * s1 * (C[1] - A[1]) + 2 * s * (B[1] - C[1]);
                const tn = Math.hypot(tx, ty) || 1; tx /= tn; ty /= tn;
                let w = w0 * (1 - 0.82 * pinch * Math.exp(-Math.pow((s - 0.5) / 0.2, 2)));
                if (pukla) { const kraj = m === M && dj[0] === 0 || m === 0 && dj[1] === 1; if (kraj) w *= 0.25; }
                const cur = [x - ty * w * 1.3, y + tx * w * 1.3, x + ty * w * 1.3, y - tx * w * 1.3, tx, ty];
                if (prev) {
                  const qd = [[prev[0], prev[1], 1.3], [cur[0], cur[1], 1.3], [prev[2], prev[3], -1.3], [prev[2], prev[3], -1.3], [cur[0], cur[1], 1.3], [cur[2], cur[3], -1.3]];
                  for (let j = 0; j < 6; j++) vrh(qd[j][0], qd[j][1], 0, qd[j][2], 1, 0, st.a * (pukla ? 1 - rv * 0.3 : 1), 0.28, gg, cur[4], cur[5]);
                }
                prev = cur;
              }
            });
          }
        }
      }
      if (!o) return;
      const u = koristi(PRG.med);
      if (noviKadar(PRG.med)) {
        gl.uniform3f(u.uKey, KD.key[0], KD.key[1], KD.key[2]);
        gl.uniform2f(u.uPomak, KD.pomak[0], KD.pomak[1]);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, MEDV.subarray(0, o), gl.STREAM_DRAW);
      veziAtribute([2, 2, 4, 4], 12);
      gl.drawArrays(gl.TRIANGLES, 0, o / 12);
    }
    // jedan sloj (iza ili ispred bočice), poredan po dubini; uzastopni komadi idu u jedan poziv
    // jedan sloj (iza ili ispred bočice): komadi i limun po dubini (uzastopni komadi u jednom pozivu),
    // a kapi meda na kraju sloja, sve u jednom pozivu
    function crtajSloj(lista, t) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const komadiSloja = [], kapiSloja = [];
      for (let i = 0; i < lista.length; i++) (lista[i].q.kap ? kapiSloja : komadiSloja).push(lista[i]);
      let i = 0;
      while (i < komadiSloja.length) {
        const q = komadiSloja[i].q;
        if (q.limun) { crtajLimun(q, komadiSloja[i].st, t); i++; continue; }
        let j = i + 1;
        while (j < komadiSloja.length && !komadiSloja[j].q.limun && j - i < 64) j++;
        crtajKomade(komadiSloja, i, j, t);
        i = j;
      }
      if (kapiSloja.length) crtajMed(kapiSloja, 0, kapiSloja.length, t);
    }
    function poredaj(ts) {
      const iza = [], ispred = [], sve = [];
      for (let i = 0; i < komadi.length; i++) { const st = stanje(komadi[i], ts); if (st && st.a > 0.003) sve.push({ q: komadi[i], st: st }); }
      for (let i = 0; i < kapi.length; i++) { const st = stanjeKapi(kapi[i], ts); if (st && st.a > 0.003) sve.push({ q: kapi[i], st: st }); }
      sve.sort(function (a, b) { return a.st.key - b.st.key; });
      for (let i = 0; i < sve.length; i++) (sve[i].st.key <= 0 ? iza : ispred).push(sve[i]);
      return [iza, ispred];
    }
    function crtajBocicu(t) {
      const b = bocicaStanje(t);
      if (b.vis <= 0.001 && b.duh <= 0.001) return;
      const B = podaci.P.bocica;
      const A = b.z * K.S2;
      const ox = K.Bo[0] - A * K.Bi[0], oy = K.Bo[1] - A * K.Bi[1] - b.rise;
      const x0 = ox + A * B.x0, y0 = oy + A * B.y0, x1 = x0 + A * B.w, y1 = y0 + A * B.h;
      gl.enable(gl.BLEND);
      let u;
      // sjaj oko bočice: iza nje (da ne ispere bočicu)
      const halo = Math.max(b.hot * (t < 8.2 ? 0.9 : 0.6), b.duh * 0.6) * b.vis * (1 - b.raspad * 0.7);
      if (halo > 0.01) {
        const p = B.pad;
        const hx0 = x0 - A * p, hy0 = y0 - A * p, hx1 = x1 + A * p, hy1 = y1 + A * p;
        gl.blendFunc(gl.ONE, gl.ONE);
        u = koristi(PRG.sjaj);
        tex(u.uTex, 0, TEX.sjaj);
        gl.uniform1f(u.uJac, halo * 0.55 * B.haloMax);
        gl.uniform2f(u.uPomak, KD.pomak[0], KD.pomak[1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([hx0, hy0, 0, 0, hx1, hy0, 1, 0, hx0, hy1, 0, 1, hx0, hy1, 0, 1, hx1, hy0, 1, 0, hx1, hy1, 1, 1]), gl.STREAM_DRAW);
        veziAtribute([2, 2], 4);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      u = koristi(PRG.bocica);
      tex(u.uTex, 0, TEX.bocica); tex(u.uSum, 1, TEX.sum);
      gl.uniform1f(u.uVis, b.vis); gl.uniform1f(u.uHot, b.hot);
      gl.uniform1f(u.uForm, b.form); gl.uniform1f(u.uRaspad, b.raspad);
      gl.uniform1f(u.uDuh, b.duh); gl.uniform1f(u.uVr, KD.ta);
      gl.uniform2f(u.uPomak, KD.pomak[0], KD.pomak[1]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x0, y0, 0, 0, x1, y0, 1, 0, x0, y1, 0, 1, x0, y1, 0, 1, x1, y0, 1, 0, x1, y1, 1, 1]), gl.STREAM_DRAW);
      veziAtribute([2, 2], 4);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // čestice: pelud u tami, zlatne iskre, zlatna prašina bočice, prašina u suncu
    let CV = new Float32Array(8 * 6 * 200);
    function crtajCestice(t) {
      let o = 0;
      function cestica(x, y, r, dx, dy, str, cr, cg, cb, oblik) {
        if (o + 48 > CV.length) { const nv = new Float32Array(CV.length * 2); nv.set(CV); CV = nv; }
        const ex = r * (1 + str), ey = r, px = -dy, py = dx;
        const c = [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]];
        for (let j = 0; j < 6; j++) {
          const lx = c[j][0], ly = c[j][1];
          CV[o++] = x + dx * lx * ex + px * ly * ey; CV[o++] = y + dy * lx * ex + py * ly * ey;
          CV[o++] = lx; CV[o++] = ly;
          CV[o++] = cr; CV[o++] = cg; CV[o++] = cb; CV[o++] = oblik;
        }
      }
      const kl = KD.key;
      // pelud u tami: lebdi oko sastojaka, uvuče se u vrtlog, rasprsne se s praskom
      const vis = Math.max(1 - ramp(t, 5.75, 6.5), ramp(t, 12.6, 13.9));
      if (vis > 0.003) {
        const wv = ramp(t, 1.6, 3.0) * (1 - ramp(t, 5.75, 6.3));
        const sk = 1 - 0.32 * ramp(t, 3.5, 5.5) * wv;
        const pras = t > K.T_BURST && t < 7 ? t - K.T_BURST : 0;
        for (let i = 0; i < tamne.length; i++) {
          const m = tamne[i];
          let x = m.x + m.ax * Math.sin(PI2 * m.k1 * t / L + m.p1), y = m.y + m.ay * Math.cos(PI2 * m.k2 * t / L + m.p2);
          if (wv > 0) {
            const ang = THETA(t) * (0.55 + 0.6 * m.d) * wv, ca = Math.cos(ang), sa = Math.sin(ang);
            const rx = (x - K.Bo[0]) * sk, ry = (y - K.Bo[1]) * sk;
            x = K.Bo[0] + rx * ca - ry * sa; y = K.Bo[1] + rx * sa + ry * ca;
          }
          let grow = 1;
          if (pras > 0) { const f = 1 + 2.4 * pras * pras + 0.9 * pras; x = K.Bo[0] + (x - K.Bo[0]) * f; y = K.Bo[1] + (y - K.Bo[1]) * f; grow = 1 + 1.5 * pras; }
          const tw = 0.6 + 0.4 * Math.sin(PI2 * m.tw * t / L + m.p1 * 2);
          const svj = 0.45 + 0.55 * sat(0.5 - ((x - 540) * kl[0] + (y - 540) * kl[1]) / 900);
          const gd = Math.hypot(x - K.Bo[0], y - K.Bo[1]);
          const zl = KD.gold * 2.2 / (1 + gd * gd / 40000);
          const daleko = m.d > 0.78;
          const r = (daleko ? 8 + 10 * m.d : 1.2 + 1.8 * m.d) * grow;
          let b = m.b * tw * vis * (daleko ? 0.09 : 0.42) * (svj + zl);
          if (b < 0.002) continue;
          cestica(x, y, r, 1, 0, 0, b, b * (0.88 + 0.04 * zl) / (1 + 0.1 * zl), b * 0.72 / (1 + 0.25 * zl), daleko ? 1 : 0);
        }
      }
      // zlatne iskre: spiralom ulaze u sredinu, gdje nastaje bočica
      if (t > 3.0 && t < 6.6) {
        for (let i = 0; i < iskre.length; i++) {
          const m = iskre[i], e0 = (t - m.ts) / m.life;
          if (e0 <= 0 || e0 >= 1) continue;
          const tocka = function (tt) {
            const e = eio((tt - m.ts) / m.life);
            projiciraj(m.r0 * Math.pow(1 - e, 1.25) + 4, m.th0 + THETA(tt) * 1.35 + 2.4 * e, m.y0 * (1 - e), 0);
            return [PR.x, PR.y, PR.s];
          };
          const a = tocka(t - 1 / 90), b2 = tocka(t + 1 / 90), c = tocka(t);
          let dx = b2[0] - a[0], dy = b2[1] - a[1];
          const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
          const r = m.sz * c[2];
          const str = Math.min(6, dl * 0.9 / Math.max(r, 0.5));
          const b = m.b * Math.pow(Math.sin(Math.PI * e0), 0.8) * 0.85 / (1 + 0.35 * str) * (1 - ramp(t, 5.7, 6.2));
          cestica(c[0], c[1], r, dx, dy, str, b, b * 0.80, b * 0.46, 0);
        }
      }
      // bočica se raspada: zlatna prašina se odvaja i polako odlazi u vrtlogu
      if (t > 11.95 && t < 14.4) {
        const bs = bocicaStanje(t), A = bs.z * K.S2;
        for (let i = 0; i < prasina.length; i++) {
          const m = prasina[i], e0 = (t - m.ts) / m.life;
          if (e0 <= 0 || e0 >= 1) continue;
          const x0 = K.Bo[0] + A * (m.px - K.Bi[0]), y0 = K.Bo[1] + A * (m.py - K.Bi[1]) - bs.rise;
          const vx = (x0 - K.Bo[0]) * 0.9 + m.sw * 60, vy = (y0 - K.Bo[1]) * 0.35 - 70;
          const e = eout(e0);
          const sw = 1.2 * e * m.sw;
          const rx = vx * e, ry = vy * e;
          const x = x0 + rx * Math.cos(sw) - ry * Math.sin(sw), y = y0 + rx * Math.sin(sw) + ry * Math.cos(sw);
          let dx = vx, dy = vy; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
          const b = m.b * Math.pow(Math.sin(Math.PI * Math.min(1, e0 * 1.6)), 0.7) * (1 - e0) * 1.1;
          cestica(x, y, m.sz, dx, dy, 1.2 * (1 - e0), b, b * 0.80, b * 0.48, 0);
        }
      }
      // prašina u zrakama sunca (prizor); bliska prašina je veliki mutni krug
      const sv = prizorJacina(t);
      const amt = ramp(t, 6.6, 8.2) * (1 - ramp(t, 11.2, 12.4));
      if (sv > 0.02 && amt > 0.003) {
        const R = prizorKrug(t), ta = KD.ta;
        for (let i = 0; i < prah.length; i++) {
          const m = prah[i], d = m.d;
          const x = ((m.x + (4 + 7 * d) * ta + 9 * Math.sin(0.35 * ta + m.ph)) % (U + 80) + (U + 80)) % (U + 80) - 40;
          const y = ((m.y - (5 + 9 * d) * ta + 6 * Math.sin(0.27 * ta + 2 * m.ph)) % (U + 80) + (U + 80)) % (U + 80) - 40;
          const blizu = d > 0.86;
          const rad = blizu ? 10 + 22 * (d - 0.86) / 0.14 : 0.9 + 3.2 * d * d + 0.4 * Math.abs(d - 0.35) * 5;
          const sun = sat(1.25 - Math.hypot(x - U * 0.95, y - U * 0.02) / (U * 1.05));
          const vis0 = 1 - sat((Math.hypot(x - K.Bo[0], y - K.Bo[1]) - (R - 0.16 * U)) / (0.30 * U));
          let b = m.b * (0.55 + 0.45 * Math.sin(PI2 * m.fr * ta + m.ph)) * (0.25 + 0.9 * sun) * amt * vis0 * vis0 * (blizu ? 0.05 : 0.30);
          if (b < 0.002) continue;
          cestica(x, y, rad, 1, 0, 0, b, b * 0.90, b * 0.72, blizu ? 1 : 0);
        }
      }
      if (!o) return;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      const u = koristi(PRG.cestica);
      gl.uniform2f(u.uPomak, KD.pomak[0], KD.pomak[1]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, CV.subarray(0, o), gl.STREAM_DRAW);
      veziAtribute([2, 2, 4], 8);
      gl.drawArrays(gl.TRIANGLES, 0, o / 8);
    }
    function zbroji(f, izvor, mul) {
      cilj(f);
      const u = koristi(PRG.zbroj);
      tex(u.uTex, 0, izvor);
      gl.uniform1f(u.uMul, mul);
      crtajPun();
    }
    // koliko podkadrova: najveći pomak komada u 1/60 s, u px platna
    function uzoraka(t) {
      const dt = 1 / 60, ppu = can.width / U;
      let mv = 0;
      for (let i = 0; i < komadi.length; i++) {
        const q = komadi[i], a = stanje(q, t - dt / 2), b = stanje(q, t + dt / 2);
        if (!a || !b) { q.brz = 0; continue; }
        const rad = 0.5 * a.s * Math.max(q.w, q.h);
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        q.brz = (d + 0.5 * Math.abs(b.z - a.z)) / dt;
        const mq = d + Math.abs(b.rot - a.rot) * rad + Math.abs(b.phi - a.phi) * rad * 0.6 + Math.abs(b.s - a.s) * Math.max(q.w, q.h) * 0.5;
        q.pomPx = mq * ppu;
        mv = Math.max(mv, mq);
      }
      for (let i = 0; i < kapi.length; i++) {
        const a = stanjeKapi(kapi[i], t - dt / 2), b = stanjeKapi(kapi[i], t + dt / 2);
        if (a && b) mv = Math.max(mv, Math.hypot(b.x - a.x, b.y - a.y));
      }
      return Math.max(1, Math.min(maxUzoraka, Math.ceil(mv * ppu / 4)));
    }
    // vrlo brz komad (bliže od razmaka podkadrova): dodatno zamućenje i blijeđenje, da ne ostavlja niz kopija
    function brzinaZamuta(q, st) {
      const gap = (q.pomPx || 0) / Math.max(1, KD.n);
      if (gap <= 3) return [0, 1];
      const ppu = can.width / U;
      return [Math.min(16, (gap - 3) * 0.45) * podaci.P.atlas.AS / Math.max(st.s * ppu, 1e-3), Math.max(0.45, Math.min(1, 1 - (gap - 10) / 45))];
    }

    // završna obrada: zrake, sjaj, val, titranje zraka, lom boja, rub, zrno
    function obrada(t) {
      const zrake = SVJETLO > 0 && smanjeno < 2;
      const zc = SVJETLO * zlato(t) * 0.95;
      const zs = SVJETLO * 0.32 * ramp(t, 6.6, 8.0) * (1 - ramp(t, 11.0, 12.0));
      const pras = t - K.T_BURST;
      const blj = pras > -0.05 && pras < 0.6 ? 0.16 * Math.exp(-Math.pow((pras - 0.04) / 0.12, 2)) : 0;
      let imaSjaj = SVJETLO > 0 && smanjeno < 3;
      if (imaSjaj) {
        cilj(FBO.svj);
        gl.disable(gl.BLEND);
        let u = koristi(PRG.svjetlo);
        tex(u.uTex, 0, FBO.kadar.t);
        gl.uniform2f(u.uKorak, 1 / FBO.kadar.w, 1 / FBO.kadar.h);
        gl.uniform1f(u.uPrag, 0.78);
        crtajPost();
        if (zrake && (zc > 0.01 || zs > 0.01)) {
          cilj(FBO.zr);
          gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
          gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
          u = koristi(PRG.zrake);
          tex(u.uTex, 0, FBO.svj.t);
          if (zc > 0.01) {
            gl.uniform2f(u.uIzvor, (K.Bo[0] + KD.pomak[0]) / U, 1 - (K.Bo[1] + KD.pomak[1]) / U);
            gl.uniform1f(u.uDuz, 0.75); gl.uniform1f(u.uPad, 0.965); gl.uniform1f(u.uJac, zc * 0.45);
            crtajPost();
          }
          if (zs > 0.01) {
            gl.uniform2f(u.uIzvor, 0.93, 0.97);
            gl.uniform1f(u.uDuz, 0.65); gl.uniform1f(u.uPad, 0.97); gl.uniform1f(u.uJac, zs * 0.6);
            crtajPost();
          }
          gl.disable(gl.BLEND);
        }
        cilj(FBO.bl1);
        u = koristi(PRG.muti);
        tex(u.uTex, 0, FBO.svj.t);
        gl.uniform2f(u.uSmjer, 1.5 / FBO.svj.w, 0);
        crtajPost();
        cilj(FBO.bl2);
        tex(u.uTex, 0, FBO.bl1.t);
        gl.uniform2f(u.uSmjer, 0, 1.5 / FBO.bl1.h);
        crtajPost();
      }
      cilj(null);
      gl.disable(gl.BLEND);
      const u = koristi(PRG.konacno);
      tex(u.uKadar, 0, FBO.kadar.t); tex(u.uZrake, 1, FBO.zr.t); tex(u.uSjaj, 2, FBO.bl2.t); tex(u.uSum, 3, TEX.sum);
      gl.uniform1f(u.uZrJ, zrake && (zc > 0.01 || zs > 0.01) ? 1 : 0);
      gl.uniform1f(u.uSjJ, imaSjaj ? SVJETLO * (0.18 + 0.5 * blj / 0.16 + 0.12 * zlato(t)) : 0);
      gl.uniform1f(u.uBlj, blj * SVJETLO);
      gl.uniform1f(u.uCA, smanjeno < 1 ? 0.0011 + 0.004 * blj / 0.16 : 0);
      gl.uniform1f(u.uZrno, ZRNO);
      gl.uniform1f(u.uZrnoMj, 1 / (128 * Math.max(1, dpr * 0.75)));
      gl.uniform2f(u.uZrnoPom, Math.random(), Math.random());
      const val = pras > 0 && pras < 0.75;
      gl.uniform1f(u.uValR, val ? 30 + pras * 950 : 0);
      gl.uniform1f(u.uValJ, val ? Math.pow(1 - pras / 0.75, 2) * ZIVOST : 0);
      const drht = ZIVOST * (ramp(t, 4.3, 4.8) * (1 - ramp(t, 5.7, 6.3)) + 0.7 * ramp(t, 11.9, 12.3) * (1 - ramp(t, 13.0, 13.4)));
      gl.uniform1f(u.uDrht, drht);
      gl.uniform4f(u.uDrhtP, K.Bo[0], K.Bo[1] - 20, 150, 260);
      gl.uniform1f(u.uVr, KD.ta);
      gl.uniform2f(u.uBo, K.Bo[0], K.Bo[1]);
      crtajPost();
    }

    function crtaj(t, ta) {
      if (!gl || gl.isContextLost()) return;
      if (ta === undefined) ta = t;
      okvir++;
      KD.t = t; KD.ta = ta; KD.faza = PI2 * t / L;
      KD.pomak = [1.0 * per(3, t) + 0.5 * per(8, t, 1.0), 0.8 * per(2, t, 2.0) + 0.4 * per(7, t)];
      KD.key = kljuc(t).slice();
      KD.gold = zlato(t);
      KD.sv = prizorJacina(t);
      cilj(FBO.kadar);
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      crtajPrizor(t);
      const n = uzoraka(t);
      KD.n = n;
      if (n === 1) {
        const s = poredaj(t);
        crtajSloj(s[0], t);
        crtajBocicu(t);
        crtajSloj(s[1], t);
      } else {
        // pokretno zamućenje: svaki podkadar u privremeni sloj, zbroj u sloj iza / ispred bočice
        ['iza', 'ispred'].forEach(function (k) { cilj(FBO[k]); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); });
        const zaslon = 1 / 60;
        for (let i = 0; i < n; i++) {
          const ts = t - zaslon / 2 + zaslon * (i + 0.5) / n;
          const s = poredaj(ts);
          for (let j = 0; j < 2; j++) {
            if (!s[j].length) continue;
            cilj(FBO.tmp);
            gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
            crtajSloj(s[j], ts);
            gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
            zbroji(FBO[j === 0 ? 'iza' : 'ispred'], FBO.tmp.t, 1 / n);
          }
        }
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        zbroji(FBO.kadar, FBO.iza.t, 1);
        crtajBocicu(t);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        zbroji(FBO.kadar, FBO.ispred.t, 1);
      }
      cilj(FBO.kadar);
      crtajCestice(t);
      obrada(t);
      if (!prviKadar) { prviKadar = true; can.style.opacity = '1'; }
    }

    function sljedeci(sad) {
      raf = requestAnimationFrame(sljedeci);
      const dt = Math.min(0.05, Math.max(0, (sad - zadnje) / 1000));
      zadnje = sad;
      // spor uređaj (ispod ~25 sl/s), u koracima: manje piksela, podkadrova, zraka i sjaja; 30 sl/s (npr. iPhone
      // u štednji baterije) je dovoljno glatko, jer kadrovi imaju pokretno zamućenje
      if (dt > 0) {
        mjerenje.n++; mjerenje.zbroj += dt;
        if (mjerenje.n >= 45) {
          const pros = mjerenje.zbroj / mjerenje.n;
          mjerenje.n = 0; mjerenje.zbroj = 0;
          if (pros > 0.04 && smanjeno < 3) { smanjeno++; maxUzoraka = Math.min(NAJVISE_UZORAKA, [5, 3, 2, 1][smanjeno]); velicina(); }
        }
      }
      vrijeme += dt; zivo += dt;
      if (!ponavljaj && vrijeme >= STANI_NA) {
        // priča stoji na bočici u prizoru, a prizor i dalje živi (vjetar, med, sunce, prašina)
        vrijeme = STANI_NA;
        crtaj(STANI_NA, ZIVOST > 0 ? zivo : STANI_NA);
        if (ZIVOST <= 0) stani();
        return;
      }
      crtaj(vrijeme % L, zivo);
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
            try { PRG = {}; TEX = {}; FBO = {}; zaboraviStanje(); pocniGL(podaci); spreman = true; if (otvoren) pokreni(); }
            catch (e) { stojeci(); }
          });
        }
        spreman = true;
        if (otvoren && !stoji) { vrijeme = 0; zivo = 0; prviKadar = false; crtaj(0, 0); pokreni(); }
      }).catch(function (e) {
        console.warn('[Martimex] Film uživo nije pokrenut:', e);
        stojeci();
      });
    }

    // ispitni pristup (crtanje određenog trenutka, bez petlje)
    function kadar(t, ta) { stani(); vrijeme = t; zivo = ta === undefined ? t : ta; crtaj(t % L, zivo); }

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
          vrijeme = 0; zivo = 0;
          if (spreman) { prviKadar = false; crtaj(0, 0); pokreni(); }
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
          const e = gl.getExtension('WEBGL_lose_context');
          if (e) e.loseContext();
          gl = null;
        }
        if (omot && omot.parentNode) omot.parentNode.removeChild(omot);
        omot = slika = can = null;
      }
    };
    // ispitne stranice mogu nacrtati određeni trenutak (window.__mxFilmIspit = function (f) {...})
    if (typeof window.__mxFilmIspit === 'function') window.__mxFilmIspit({ kadar: kadar, spreman: function () { return spreman; }, platno: function () { return can; },
      postavi: function (o) { if ('ziv' in o) ZIVOST = o.ziv; if ('svjetlo' in o) SVJETLO = o.svjetlo; if ('zrno' in o) ZRNO = o.zrno; },
      info: function () { return { smanjeno: smanjeno, dpr: dpr, uzoraka: maxUzoraka, platno: can ? can.width : 0, vrijeme: vrijeme, raf: !!raf, mjerenje: mjerenje.n + '/' + mjerenje.zbroj.toFixed(2) }; } });
    return api;
  }

  window.MX_FILM = { napravi: napravi };
})();
