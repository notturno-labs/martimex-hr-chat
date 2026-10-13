// ═════════════════════════════════════════════════════════════════════
//  POKUS "STVARNO" — početni ekran u pravom 3D-u (three.js)
//
//  Isti krug i isti prijelazi kao u pocetna-chata.js, ali oblici nisu od
//  točkica nego pravi 3D predmeti, osvijetljeni kao u fotografskom studiju
//  (tamna soba sa svjetlosnim pločama, koje se zrcale u staklu i zlatu):
//   - AI objekt: kugla od tekućeg kroma s duginim odsjajem, kojoj se površina
//     stalno valovito gužva (isti šum kao u točkicama)
//   - Xerjoff flakon: fasetirano staklo koje lomi svjetlo, s medenom
//     tekućinom i debelim prozirnim dnom, polirani zlatni prsten i čep sa
//     šiljkom, zlatna pločica s udubljenim znakom X i dvostrukim okvirom
//   - logotipi parfemskih kuća: tanka metalna folija boje pudera (rose
//     gold), s reljefnim rubom; preko njih prijeđe odsjaj
//   - pet bočica Penhaligon's Portraits: staklo s tekućinom svoje boje,
//     papirnata etiketa (ista kao u točkicama), zlatni ovratnik i zlatna
//     glava životinje (mreža izrađena iz istih SDF modela)
//   - natpis MARTIMEX: puna 3D slova od poliranog metala boje pudera, s
//     bridovima koji hvataju svjetlo
//  Prijelazi: oblik se rastapa s užarenim zlatnim rubom (po visini, uz
//  malo šuma, kao što su se točkice rastapale), s ruba se odvaja zlatna
//  prašina koja otplovi do sljedećeg oblika i na njegovu rubu nestane, a
//  novi oblik nastaje od tog ruba (flakon odozdo, čep zadnji; logotipi
//  slijeva nadesno jedan po jedan; bočice od sredine prema van: staklo
//  odozdo, etiketa odozgo, glava iz ovratnika; slova jedno po jedno).
//  Vremenski tijek je isti kao u pocetna-chata.js (napraviTijek).
// ═════════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

const CAM = 4.2;
const PEN_IDS = ['lady-blanche', 'mr-sam', 'lord-george', 'duchess-rose', 'changing-constance'];
const PEN_K = 1.76 / 684;
const PEN_DNO = -0.80;
const PEN_RASPORED = [
  [-1.00, -0.26, 0.76, -0.28],
  [-0.52, 0.00, 0.84, -0.15],
  [0.00, 0.26, 0.95, 0.00],
  [0.52, 0.00, 0.84, 0.15],
  [1.00, -0.26, 0.76, 0.28]
];
const MAR_REDOVA = 4, MAR_RUB = 0.12;
const RUB = 0.05;                 // širina užarenog ruba pri rastapanju (udio)

function sat(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function glatko(x) { x = sat(x); return x * x * (3 - 2 * x); }
function lerp(a, b, t) { return a + (b - a) * t; }
function linearno(r, g, b) { return new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace); }
function slucajno(sjeme) {
  let a = sjeme >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rz(valjanje) · Rx(nagib) · Ry(kutY), kao matrica() u pocetna-chata.js
function okret(m, kutY, nagib, valjanje) {
  const cy = Math.cos(kutY), sy = Math.sin(kutY), cx = Math.cos(nagib), sx = Math.sin(nagib);
  const cz = Math.cos(valjanje || 0), sz = Math.sin(valjanje || 0);
  const a = [[cy, 0, sy], [sx * sy, cx, -sx * cy], [-cx * sy, sx, cx * cy]];
  const r = [
    [cz * a[0][0] - sz * a[1][0], cz * a[0][1] - sz * a[1][1], cz * a[0][2] - sz * a[1][2]],
    [sz * a[0][0] + cz * a[1][0], sz * a[0][1] + cz * a[1][1], sz * a[0][2] + cz * a[1][2]],
    a[2]
  ];
  return m.set(r[0][0], r[0][1], r[0][2], 0, r[1][0], r[1][1], r[1][2], 0, r[2][0], r[2][1], r[2][2], 0, 0, 0, 0, 1);
}

// ── GLSL: 3D simplex šum s gradijentom (Ian McEwan, Stefan Gustavson,
//    Ashima Arts, webgl-noise, licenca MIT), kao u pocetna-chata.js
const SNOISE = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v, out vec3 gradient) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    vec4 m2 = m * m;
    vec4 m4 = m2 * m2;
    vec4 pdotx = vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3));
    vec4 temp = m2 * m * pdotx;
    gradient = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
    gradient += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;
    gradient *= 105.0;
    return 105.0 * dot(m4, pdotx);
  }
`;

// ── Rastapanje i nastajanje: dodatak svakom materijalu. Vrijednost točke
//    plohe je visina uzduž osi (0..1, uz malo šuma); vidi se dio plohe do
//    praga (uRaz: 0 ništa, 1 sve), a uz prag je užareni zlatni rub. Uz to:
//    prozor po visini u svijetu (logotipi), odsjaj koji prelazi preko
//    oblika (pruga u svijetu) i kratko zasvjetljenje (uBljesak)
const RAZ_VS_GLAVA = `
  varying vec3 vMxL;
  varying vec3 vMxW;
`;
const RAZ_FS_GLAVA = `
  uniform float uRaz;
  uniform vec3 uOs;
  uniform vec2 uRaspon;
  uniform float uObrni;
  uniform float uSum;
  uniform float uSkala;
  uniform vec3 uRubBoja;
  uniform vec4 uOkvir;
  uniform vec3 uSjajOs;
  uniform vec3 uSjaj;
  uniform float uBljesak;
  varying vec3 vMxL;
  varying vec3 vMxW;
  float mxHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float mxSum(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(mxHash(i), mxHash(i + vec3(1, 0, 0)), f.x), mix(mxHash(i + vec3(0, 1, 0)), mxHash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(mxHash(i + vec3(0, 0, 1)), mxHash(i + vec3(1, 0, 1)), f.x), mix(mxHash(i + vec3(0, 1, 1)), mxHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float mxRubF = 0.0;
`;
const RAZ_FS_ODBACI = `
  {
    float mxH = clamp((dot(vMxL, uOs) - uRaspon.x) / (uRaspon.y - uRaspon.x), 0.0, 1.0);
    mxH = mix(mxH, 1.0 - mxH, uObrni);
    float mxN = 0.65 * mxSum(vMxL * uSkala) + 0.35 * mxSum(vMxL * uSkala * 2.7 + 3.1);
    float mxV = mix(mxH, mxN, uSum);
    float mxT = uRaz * (1.0 + ${RUB.toFixed(3)}) - ${RUB.toFixed(3)};
    if (mxV > mxT + ${RUB.toFixed(3)}) discard;
    mxRubF = smoothstep(mxT, mxT + ${RUB.toFixed(3)}, mxV);
    float mxO = min(vMxW.y - uOkvir.x, uOkvir.y - vMxW.y) + (mxN - 0.5) * uOkvir.z;
    if (mxO < 0.0) discard;
    mxRubF = max(mxRubF, 1.0 - smoothstep(0.0, uOkvir.w, mxO));
  }
`;
const RAZ_FS_SJAJ = `
  {
    float mxF = 0.35 + 0.65 * pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.5);
    float mxD = (dot(vMxW, uSjajOs) - uSjaj.x) / uSjaj.y;
    totalEmissiveRadiance += uRubBoja * mxRubF * mxRubF + uRubBoja * 0.12 * uBljesak + vec3(1.0, 0.94, 0.86) * uSjaj.z * exp(-mxD * mxD) * mxF;
  }
`;

function napraviUniforme() {
  return {
    uRaz: { value: 1 }, uOs: { value: new THREE.Vector3(0, 1, 0) }, uRaspon: { value: new THREE.Vector2(0, 1) },
    uObrni: { value: 0 }, uSum: { value: 0.22 }, uSkala: { value: 9 },
    uRubBoja: { value: linearno(1.0, 0.62, 0.22).multiplyScalar(3.2) },
    uOkvir: { value: new THREE.Vector4(-99, 99, 0, 1e-4) },
    uSjajOs: { value: new THREE.Vector3(0, 1, 0) }, uSjaj: { value: new THREE.Vector3(99, 0.06, 0) },
    uBljesak: { value: 0 }
  };
}

// dodatak se upiše u materijal; kugla (AI objekt) uz to ima i pomicanje točaka šumom
function rastopljiv(mat, opcije) {
  opcije = opcije || {};
  const u = napraviUniforme();
  if (opcije.kugla) u.uT = { value: 0 };
  mat.userData.u = u;
  mat.onBeforeCompile = function (sh) {
    Object.assign(sh.uniforms, u);
    let vs = sh.vertexShader.replace('#include <common>', '#include <common>\n' + RAZ_VS_GLAVA + (opcije.kugla ? 'uniform float uT;\n' + SNOISE : ''));
    if (opcije.kugla) {
      vs = vs.replace('#include <beginnormal_vertex>', `
        vec3 mxD = normalize(position);
        vec3 mxG1, mxG2;
        float mxN1 = snoise(mxD * 0.85 + vec3(0.0, uT * 0.16, uT * 0.1), mxG1);
        float mxN2 = snoise(mxD * 1.9 + vec3(uT * 0.2, -uT * 0.08, 0.0) + mxG1 * 0.06, mxG2);
        float mxDisp = mxN1 * 0.085 + mxN2 * 0.018;
        vec3 mxGrad = mxG1 * (0.85 * 0.085) + mxG2 * (1.9 * 0.018);
        vec3 mxTg = mxGrad - dot(mxGrad, mxD) * mxD;
        vec3 objectNormal = normalize(mxD - mxTg / (1.0 + mxDisp));
        vec3 mxPoz = mxD * 0.8 * (1.0 + mxDisp) * (1.0 + 0.02 * sin(uT * 1.3));
      `).replace('#include <begin_vertex>', 'vec3 transformed = mxPoz;');
    }
    vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\nvMxL = transformed;\nvMxW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.vertexShader = vs;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + RAZ_FS_GLAVA)
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + RAZ_FS_ODBACI)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + RAZ_FS_SJAJ)
      .replace('#include <transmission_fragment>', THREE.ShaderChunk.transmission_fragment.replace('material.thickness = thickness;',
        'material.thickness = thickness * mix(2.4, 0.75, pow(abs(dot(normalize(normal), normalize(vViewPosition))), 0.7));'));
  };
  mat.customProgramCacheKey = function () { return 'mx-raz' + (opcije.kugla ? '-kugla' : ''); };
  return mat;
}

// postavke rastapanja jednog dijela oblika (os i raspon u koordinatama dijela)
function postaviOs(mesh, os, od, do_, sum, skala) {
  const u = mesh.material.userData.u;
  u.uOs.value.copy(os);
  u.uRaspon.value.set(od, do_);
  if (sum !== undefined) u.uSum.value = sum;
  if (skala !== undefined) u.uSkala.value = skala;
  mesh.userData.os = { os: os.clone(), od: od, do: do_, sum: u.uSum.value };
}
// vrijednost (0..1) točke dijela pri rastapanju, kao u shaderu (bez šuma)
function vrijednost(mesh, p, obrni, rnd) {
  const o = mesh.userData.os;
  let h = sat((p.dot(o.os) - o.od) / (o.do - o.od));
  if (obrni) h = 1 - h;
  return lerp(h, 0.2 + 0.6 * rnd, o.sum);
}


// ═════════════════════════════════════════════════════════════════════
//  ANIMACIJA
// ═════════════════════════════════════════════════════════════════════
export function napraviAnimaciju3D(platno, scena, dogadaji, O) {
  const P = O.P, B = O.B, OBLIK = O.OBLIK, MIRNO = O.MIRNO, MOBITEL = O.MOBITEL;
  const IME_OBLIKA = ['objekt', 'flakon', 'marke', 'pen', 'natpis'];

  let renderer = null, composer = null, bloom = null, sceneGL = null, kamera = null;
  let spremno = false, unisteno = false, priprema = null, vrti = false, raf = 0;
  let vrijeme = 0, zadnje = 0, izlazOd = -1, izlazGotov = null;
  const izlazTrajanje = 1.1;
  let W = 1, H = 1, dpr = 1, S = 160, sx = 0, sy = 0, povecanje = 1, pasMar = 1.1, skalaMar = 1;
  let misX = 0, misY = 0, nagibX = 0, nagibY = 0;
  let podnaslov = null;
  const oblici = {};              // objekt, flakon, marke, pen, natpis: { grupa, dijelovi[], uzorci }
  let prasina = null;             // zlatna prašina (prijelazi)
  const prijelazi = {};           // podaci prašine po prijelazu
  let marPodaci = null, imaPen = false, imaMarke = false;
  let tijek = null, tijekovi = {};
  let zid = null;

  // ─────────────────────────────────────────────────────────────────────
  //  Studio: tamna soba sa svjetlosnim pločama (samo za odraze), meki
  //  topli sjaj iza oblika (lomi se kroz staklo) i glavno svjetlo gore
  //  lijevo, kao u točkicama
  // ─────────────────────────────────────────────────────────────────────
  function studio() {
    const env = new THREE.Scene();
    const soba = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vP; void main() { vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec3 vP; void main() { float g = smoothstep(-0.4, 1.0, vP.y); gl_FragColor = vec4(vec3(0.015, 0.013, 0.012) + vec3(0.09, 0.08, 0.07) * g, 1.0); }'
    }));
    env.add(soba);
    function ploca(w, h, jacina, boja, x, y, z) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: boja.clone().multiplyScalar(jacina), side: THREE.DoubleSide }));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    }
    const bijela = linearno(1, 0.97, 0.93), topla = linearno(1, 0.8, 0.55), hladna = linearno(0.85, 0.9, 1);
    ploca(5.0, 3.0, 2.2, bijela, -3.0, 4.5, 3.0);      // velika meka ploča gore lijevo sprijeda (glavno svjetlo)
    ploca(1.0, 8.0, 3.2, bijela, -5.5, 0.5, -1.0);     // uska okomita ploča lijevo straga (rubovi stakla)
    ploca(1.0, 8.0, 2.4, hladna, 5.5, 0.2, -1.0);      // uska okomita ploča desno straga
    ploca(7.0, 2.0, 0.9, topla, 0, -4.5, 2.5);         // topli odbljesak odozdo (zlato)
    ploca(6.0, 2.0, 1.2, bijela, 0, 6.0, -1.0);        // iznad (vrhovi čepova i ramena)
    ploca(7.0, 4.0, 0.9, bijela, 0.8, 0.8, 7.0);       // velika slaba ploča iza kamere (metal sprijeda)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const t = pmrem.fromScene(env, 0.02).texture;
    pmrem.dispose();
    env.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    return t;
  }

  // zid daleko iza predmeta: tamno, a iza predmeta topla svjetlosna mrlja
  // (kao reflektor uperen u pozadinu na fotografiji parfema): kroz staklo se
  // lomi, pa tekućina zasvijetli, a oko predmeta je tek meki sjaj.
  // uMrlja: sredina (x, y) i polumjeri (x, y) na zidu, uJak jačina
  function pozadina() {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.ShaderMaterial({
      depthWrite: false,
      uniforms: { uBoja: { value: linearno(1.0, 0.72, 0.38) }, uMrlja: { value: new THREE.Vector4(0, 0, 1, 1) }, uJak: { value: 0.3 } },
      vertexShader: 'varying vec2 vU; void main() { vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uBoja; uniform vec4 uMrlja; uniform float uJak; varying vec2 vU; void main() { vec2 d = (vU - uMrlja.xy) / uMrlja.zw; float r2 = dot(d, d); float r = length(vU * vec2(1.0, 0.85)); gl_FragColor = vec4(uBoja * (uJak * exp(-r2 * 1.6) + 0.004 * exp(-r * r / 10.0)), 1.0); }'
    }));
    m.position.set(0, 0, -3);
    m.renderOrder = -10;
    return m;
  }
  // mrlja na zidu za svaki oblik (zid je 3 jedinice iza, pa je mrlja na
  // ekranu oko 0,58 puta manja): [x, y, rx, ry, jačina]
  const MRLJA = {
    objekt: [0, 0.1, 1.5, 1.5, 0.05], flakon: [0, -0.15, 0.95, 1.35, 0.55], marke: [0, 0, 2.6, 1.6, 0.04],
    pen: [0, -0.35, 2.7, 0.95, 0.36], natpis: [0, 0, 2.6, 0.9, 0.05]
  };

  // ─────────────────────────────────────────────────────────────────────
  //  Materijali
  // ─────────────────────────────────────────────────────────────────────
  function zlato(hrapavo) {
    return rastopljiv(new THREE.MeshPhysicalMaterial({ color: linearno(0.98, 0.70, 0.33), metalness: 1, roughness: hrapavo === undefined ? 0.2 : hrapavo, envMapIntensity: 1.25 }));
  }
  function puder(hrapavo) {
    return rastopljiv(new THREE.MeshPhysicalMaterial({ color: linearno(0.98, 0.74, 0.62), metalness: 1, roughness: hrapavo, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 1.5 }));
  }
  // staklo s tekućinom: boja je od tekućine (prigušenje kroz debljinu), a
  // tekućina malo svijetli iznutra (kao kad je obasjana iza i odozdo)
  function staklo(boja, udaljenost, debljina, sjaj) {
    return rastopljiv(new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.015, transmission: 1, ior: 1.52, thickness: debljina,
      attenuationColor: boja, attenuationDistance: udaljenost, specularIntensity: 1, envMapIntensity: 2.2,
      dispersion: 0.25, emissive: boja.clone().multiplyScalar(sjaj || 0)
    }));
  }

  // ─────────────────────────────────────────────────────────────────────
  //  Oblici
  // ─────────────────────────────────────────────────────────────────────
  // tijelo iz profila (prstenovi presjeka) kao mreža; presjek(t) vraća
  // { x, z, vx, vz } (zatvorena petlja, jedinični), prstenovi: [{ y, r, nr, ny, presjek }]
  function tijeloIzProfila(prstenovi, zatvoriVrh) {
    const M = prstenovi[0].presjek.x.length, poz = [], nor = [], uv = [], ind = [];
    prstenovi.forEach(function (p, i) {
      for (let j = 0; j <= M; j++) {
        const q = j % M, s = p.presjek;
        poz.push(s.x[q] * p.r, p.y, s.z[q] * p.r);
        const nx = s.vx[q] * p.nr, ny = p.ny, nz = s.vz[q] * p.nr, l = Math.hypot(nx, ny, nz) || 1;
        nor.push(nx / l, ny / l, nz / l);
        uv.push(j / M, i / (prstenovi.length - 1));
      }
    });
    for (let i = 0; i < prstenovi.length - 1; i++) for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j, b = a + 1, c = a + M + 1, d = c + 1;
      ind.push(a, c, b, b, c, d);
    }
    if (zatvoriVrh) {
      const p = prstenovi[prstenovi.length - 1], s = poz.length / 3;
      poz.push(0, p.y, 0); nor.push(0, 1, 0); uv.push(0.5, 1);
      const o = (prstenovi.length - 1) * (M + 1);
      for (let j = 0; j < M; j++) ind.push(s, o + j + 1, o + j);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(ind);
    return g;
  }
  function krug(M) {
    const x = new Float32Array(M), z = new Float32Array(M);
    for (let j = 0; j < M; j++) { const t = j / M * 2 * Math.PI; x[j] = Math.cos(t); z[j] = Math.sin(t); }
    return { x: x, z: z, vx: x, vz: z };
  }
  // profil [[y, r], ...] → prstenovi s normalama (presjek isti za sve)
  function prstenoviProfila(profil, presjek) {
    return profil.map(function (p, i) {
      const a = profil[Math.max(0, i - 1)], b = profil[Math.min(profil.length - 1, i + 1)];
      const dy = b[0] - a[0], dr = b[1] - a[1], l = Math.hypot(dy, dr) || 1;
      return { y: p[0], r: p[1], nr: dy / l, ny: -dr / l, presjek: typeof presjek === 'function' ? presjek(p) : presjek };
    });
  }
  // gušći profil (Catmull-Rom kroz točke), korak oko d
  function zagladi(profil, d) {
    const out = [];
    for (let i = 0; i < profil.length - 1; i++) {
      const p0 = profil[Math.max(0, i - 1)], p1 = profil[i], p2 = profil[i + 1], p3 = profil[Math.min(profil.length - 1, i + 2)];
      const n = Math.max(1, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / d));
      for (let k = 0; k < n; k++) {
        const t = k / n;
        out.push(p1.map(function (_, q) {
          const v = 0.5 * (2 * p1[q] + (p2[q] - p0[q]) * t + (2 * p0[q] - 5 * p1[q] + 4 * p2[q] - p3[q]) * t * t + (3 * p1[q] - p0[q] - 3 * p2[q] + p3[q]) * t * t * t);
          return q === 1 ? Math.max(0, v) : v;
        }));
      }
    }
    out.push(profil[profil.length - 1].slice());
    return out;
  }

  // ── AI objekt: kugla od tekućeg kroma s duginim odsjajem
  function napraviObjekt() {
    const g = new THREE.IcosahedronGeometry(1, MOBITEL ? 40 : 64);
    const mat = rastopljiv(new THREE.MeshPhysicalMaterial({
      color: linearno(0.92, 0.9, 0.95), metalness: 1, roughness: 0.1, iridescence: 0.45, iridescenceIOR: 1.4,
      iridescenceThicknessRange: [300, 520], envMapIntensity: 0.85, clearcoat: 0, clearcoatRoughness: 0.1
    }), { kugla: true });
    const mesh = new THREE.Mesh(g, mat);
    postaviOs(mesh, new THREE.Vector3(0, 1, 0), -0.85, 0.85, 0.45, 3.5);
    const grupa = new THREE.Group();
    grupa.add(mesh);
    grupa.matrixAutoUpdate = false;
    return { grupa: grupa, dijelovi: [mesh] };
  }

  // ── Xerjoff flakon
  const PRESJECI = {};
  function jedinicniPresjek(f, PLOHA) {
    const kljuc = f.toFixed(3);
    if (PRESJECI[kljuc]) return PRESJECI[kljuc];
    const c = Math.SQRT1_2, cd = (1 + PLOHA) * c;
    const R = [1, 0, 1, -1, 0, 1, 0, 1, 1, 0, -1, 1, c, c, cd, -c, c, cd, c, -c, cd, -c, -c, cd];
    const Mn = MOBITEL ? 128 : 192, mek = 0.012, t = new Float64Array(8);
    const x = new Float32Array(Mn), z = new Float32Array(Mn);
    for (let j = 0; j < Mn; j++) {
      const th = j / Mn * 2 * Math.PI, ux = Math.cos(th), uz = Math.sin(th);
      let min = Infinity, zbroj = 0, k = 0;
      for (let q = 0; q < 24; q += 3) {
        const d = ux * R[q] + uz * R[q + 1];
        if (d > 1e-6) { const v = R[q + 2] / d; t[k++] = v; if (v < min) min = v; }
      }
      for (let q = 0; q < k; q++) zbroj += Math.exp(-(t[q] - min) / mek);
      const r = 1 + (min - mek * Math.log(zbroj) - 1) * f;
      x[j] = ux * r; z[j] = uz * r;
    }
    const vx = new Float32Array(Mn), vz = new Float32Array(Mn);
    for (let j = 0; j < Mn; j++) {
      const a = (j + Mn - 1) % Mn, b = (j + 1) % Mn;
      let ex = z[b] - z[a], ez = x[a] - x[b];
      const l = Math.hypot(ex, ez) || 1;
      ex /= l; ez /= l;
      if (ex * x[j] + ez * z[j] < 0) { ex = -ex; ez = -ez; }
      vx[j] = ex; vz[j] = ez;
    }
    return (PRESJECI[kljuc] = { x: x, z: z, vx: vx, vz: vz });
  }

  function napraviFlakon(F) {
    const K = F.FLAKON_K, DNO = F.DNO_BOCICE;
    const grupa = new THREE.Group(), dijelovi = [];
    grupa.matrixAutoUpdate = false;
    function dodaj(mesh) { grupa.add(mesh); dijelovi.push(mesh); postaviOs(mesh, new THREE.Vector3(0, 1, 0), DNO, F.VRH_BOCICE, 0.18, 14); return mesh; }
    // staklo: profil do zlatnog prstena, zaglađen; tri dijela: debelo dno,
    // tekućina (med) i prozirno staklo iznad nje
    const glass = F.FLAKON.filter(function (p) { return p[0] <= F.FLAKON_ZLATO && !(p[0] === F.FLAKON_ZLATO && p[2] === 0); });
    const gust = zagladi(glass, 4);
    const DNO_STAKLA = 30, RAZINA = 418;
    function dio(od, do_) {
      let p = gust.filter(function (q) { return q[0] >= od - 1e-6 && q[0] <= do_ + 1e-6; });
      return prstenoviProfila(p.map(function (q) { return [DNO + q[0] * K, q[1] * K, q[2]]; }), function (q) { return jedinicniPresjek(sat(q[2]), F.PLOHA); });
    }
    // dodaj točne visine podjele
    function umetni(h) {
      for (let i = 0; i < gust.length - 1; i++) if (gust[i][0] < h && gust[i + 1][0] > h) {
        const t = (h - gust[i][0]) / (gust[i + 1][0] - gust[i][0]);
        gust.splice(i + 1, 0, [h, lerp(gust[i][1], gust[i + 1][1], t), lerp(gust[i][2], gust[i + 1][2], t)]);
        return;
      }
    }
    umetni(DNO_STAKLA); umetni(RAZINA);
    const med = linearno(0.95, 0.62, 0.2), bistro = linearno(0.88, 0.94, 0.9);
    dodaj(new THREE.Mesh(tijeloIzProfila(dio(0, DNO_STAKLA)), staklo(bistro, 1.2, 0.5)));
    dodaj(new THREE.Mesh(tijeloIzProfila(dio(DNO_STAKLA, RAZINA)), staklo(med, 0.5, 0.6, 0.012)));
    dodaj(new THREE.Mesh(tijeloIzProfila(dio(RAZINA, F.FLAKON_ZLATO), true), staklo(bistro, 1.2, 0.25)));
    // zlatni prsten i donji dio čepa (okrugli), polirano zlato
    const kr = krug(MOBITEL ? 64 : 96);
    const zl = F.FLAKON.filter(function (p) { return p[0] >= F.FLAKON_ZLATO && p[0] <= F.FLAKON_RUB && !(p[0] === F.FLAKON_ZLATO && p[2] > 0); });
    const zlProfil = [[F.FLAKON_ZLATO, 0]].concat(zl.map(function (p) { return [p[0], p[1]]; }));
    dodaj(new THREE.Mesh(tijeloIzProfila(prstenoviProfila(zlProfil.map(function (p) { return [DNO + p[0] * K, p[1] * K]; }), kr)), zlato(0.16)));
    // vrh čepa: valjak odrezan plohom koja se straga uzdiže u šiljak (kao u flakon())
    const R0 = F.FLAKON[F.FLAKON.length - 1][1] * K, h0 = DNO + F.FLAKON_RUB * K, Hc = (F.FLAKON_VRH - F.FLAKON_RUB) * K;
    function vrhCepa(x, z) {
      const straga = sat((1 - z / R0) / 2), sredina = sat(1 - Math.pow(Math.min(1, Math.abs(x) / R0), 1.5));
      return h0 + Hc * Math.pow(straga, 1.5) * sredina;
    }
    function savij(v) { const u = (v[1] - h0) / Hc; if (u > 0.5) v[2] += R0 * 0.4 * (u - 0.5) * (u - 0.5) / 0.25; return v; }
    const MC = 128, red = 14;
    const zid = [], zidI = [], vrh = [], vrhI = [];
    for (let j = 0; j <= MC; j++) {
      const t = j / MC * 2 * Math.PI, x = R0 * Math.cos(t), z = R0 * Math.sin(t), top = vrhCepa(x, z);
      for (let i = 0; i <= red; i++) zid.push.apply(zid, savij([x, lerp(h0, top, i / red), z]));
    }
    for (let j = 0; j < MC; j++) for (let i = 0; i < red; i++) { const a = j * (red + 1) + i, b = a + red + 1; zidI.push(a, a + 1, b, b, a + 1, b + 1); }
    const PR = 18;
    for (let i = 0; i <= PR; i++) for (let j = 0; j <= MC; j++) {
      const r = R0 * i / PR, t = j / MC * 2 * Math.PI, x = r * Math.cos(t), z = r * Math.sin(t);
      vrh.push.apply(vrh, savij([x, vrhCepa(x, z), z]));
    }
    for (let i = 0; i < PR; i++) for (let j = 0; j < MC; j++) { const a = i * (MC + 1) + j, b = a + MC + 1; vrhI.push(a, b, a + 1, a + 1, b, b + 1); }
    [[zid, zidI], [vrh, vrhI]].forEach(function (d) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(d[0], 3));
      g.setIndex(d[1]);
      g.computeVertexNormals();
      dodaj(new THREE.Mesh(g, zlato(0.18)));
    });
    // pločica: trapez na prednjoj plohi, polirano zlato s izdignutim znakom X i dvostrukim okvirom
    dodaj(plocica(F, function (h) {
      for (let i = 0; i < F.FLAKON.length - 1; i++) { const a = F.FLAKON[i], b = F.FLAKON[i + 1]; if (h >= a[0] && h <= b[0] && b[0] > a[0]) return lerp(a[1], b[1], (h - a[0]) / (b[0] - a[0])); }
      return 0;
    }));
    return { grupa: grupa, dijelovi: dijelovi };
  }

  function plocica(F, sirinaNa) {
    const K = F.FLAKON_K, DNO = F.DNO_BOCICE;
    const [hT, wT] = F.PLOCICA_VRH, [hB, wB] = F.PLOCICA_DNO, XL = Math.max(wT, wB);
    // slika (visina i boja): okvir, unutarnja crta i znak X u okviru [-XL, XL] × [hB, hT] px
    const Cw = 256, Ch = Math.round(256 * (hT - hB) / (2 * XL));
    const c = document.createElement('canvas');
    c.width = Cw; c.height = Ch;
    const x = c.getContext('2d');
    const px = function (X) { return (X + XL) / (2 * XL) * Cw; }, py = function (Y) { return (hT - Y) / (hT - hB) * Ch; };
    x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, Cw, Ch);
    function trapez(u) {                  // u px uvučen od ruba
      x.beginPath();
      x.moveTo(px(-wT + u), py(hT - u)); x.lineTo(px(wT - u), py(hT - u)); x.lineTo(px(wB - u), py(hB + u)); x.lineTo(px(-wB + u), py(hB + u)); x.closePath();
    }
    const okv = 0.008 / K, crta = 0.017 / K, debljina = 0.0044 / K;
    x.strokeStyle = '#ffffff';
    x.lineWidth = okv / (2 * XL) * Cw * 2; trapez(0); x.stroke();
    x.lineWidth = debljina / (2 * XL) * Cw; trapez(crta); x.stroke();
    // znak X (u okviru 495 × 709)
    x.save();
    x.translate(px(-F.ZNAK_POLA), py(F.ZNAK_VRH));
    x.scale((px(F.ZNAK_POLA) - px(-F.ZNAK_POLA)) / 495, (py(F.ZNAK_DNO) - py(F.ZNAK_VRH)) / 709);
    x.fillStyle = '#ffffff';
    F.ZNAK_X.forEach(function (o) { x.beginPath(); for (let i = 0; i < o.length; i += 2) { if (i) x.lineTo(o[i], o[i + 1]); else x.moveTo(o[i], o[i + 1]); } x.closePath(); x.fill(); });
    x.restore();
    const izbocina = new THREE.CanvasTexture(c);
    // boja: izdignuto polirano, podloga malo tamnija (brušena)
    const c2 = document.createElement('canvas');
    c2.width = Cw; c2.height = Ch;
    const x2 = c2.getContext('2d');
    x2.filter = 'blur(0.6px)';
    x2.drawImage(c, 0, 0);
    const boja = new THREE.CanvasTexture(c2);
    boja.colorSpace = THREE.SRGBColorSpace;
    // hrapavost: podloga brušena (svijetlo), znak i okvir polirani (tamno)
    const c3 = document.createElement('canvas');
    c3.width = Cw; c3.height = Ch;
    const x3 = c3.getContext('2d');
    x3.filter = 'invert(1) blur(0.6px)';
    x3.drawImage(c, 0, 0);
    const hrapavost = new THREE.CanvasTexture(c3);
    const mat = zlato(0.75);
    mat.map = boja;
    mat.bumpMap = izbocina;
    mat.bumpScale = 1.6;
    mat.roughnessMap = hrapavost;
    // mreža: ploha uz prednju plohu tijela (z = pola širine + 0,4 % ), s malim rubom
    const R = 24, C = 16, poz = [], uv = [], ind = [];
    const z = function (h) { return sirinaNa(h) * K + 0.004; };
    for (let i = 0; i <= R; i++) {
      const h = lerp(hB, hT, i / R), w = lerp(wB, wT, i / R);
      for (let j = 0; j <= C; j++) {
        const X = lerp(-w, w, j / C);
        poz.push(X * K, DNO + h * K, z(h)); uv.push((X + XL) / (2 * XL), (h - hB) / (hT - hB));
      }
    }
    for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) { const a = i * (C + 1) + j, b = a + C + 1; ind.push(a, a + 1, b, b, a + 1, b + 1); }
    // rub pločice (debljina 0,4 %): obod se spusti prema tijelu
    const obod = [];
    for (let j = 0; j <= C; j++) obod.push(j);
    for (let i = 1; i <= R; i++) obod.push(i * (C + 1) + C);
    for (let j = C - 1; j >= 0; j--) obod.push(R * (C + 1) + j);
    for (let i = R - 1; i >= 1; i--) obod.push(i * (C + 1));
    const n0 = poz.length / 3;
    obod.forEach(function (q) { poz.push(poz[3 * q], poz[3 * q + 1], poz[3 * q + 2] - 0.0045); uv.push(uv[2 * q], uv[2 * q + 1]); });
    for (let k = 0; k < obod.length; k++) { const a = obod[k], b = obod[(k + 1) % obod.length], a2 = n0 + k, b2 = n0 + (k + 1) % obod.length; ind.push(a, a2, b, b, a2, b2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(ind);
    g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  }

  // ── Logotipi: metalna folija (boja pudera) s reljefnim rubom, raspoređeni kao na slici
  function napraviMarke(M, slika) {
    const sir = M.sirina, vis = M.visina, L = M.logotipi;
    const c = document.createElement('canvas');
    c.width = sir; c.height = vis;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(slika, 0, 0);
    const piks = x.getImageData(0, 0, sir, vis).data;
    const maska = new THREE.CanvasTexture(c);
    const c2 = document.createElement('canvas');
    c2.width = sir; c2.height = vis;
    const x2 = c2.getContext('2d');
    x2.filter = 'blur(2.2px)';
    x2.drawImage(c, 0, 0);
    const izbocina = new THREE.CanvasTexture(c2);
    [maska, izbocina].forEach(function (t) { t.anisotropy = 4; });
    let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, redova = 0;
    L.forEach(function (l) { X0 = Math.min(X0, l[3]); X1 = Math.max(X1, l[3] + l[5]); Y0 = Math.min(Y0, l[4]); redova = Math.max(redova, l[1] + 1); });
    const k = O.SIRINA_NATPISA / Math.max(1, X1 - X0), cx = (X0 + X1) / 2;
    const stranica = function (l) { return Math.floor(l[1] / MAR_REDOVA); };
    const brojStranica = Math.ceil(redova / MAR_REDOVA), stranice = [];
    for (let j = 0; j < brojStranica; j++) {
      const na = L.filter(function (l) { return stranica(l) === j; });
      const vrh = Math.min.apply(null, na.map(function (l) { return l[4]; })), dno = Math.max.apply(null, na.map(function (l) { return l[4] + l[6]; }));
      stranice.push({ sredina: -((vrh + dno) / 2 - Y0) * k, pola: (dno - vrh) / 2 * k, logotipa: na.length });
    }
    const grupa = new THREE.Group(), zid = new THREE.Group(), dijelovi = [];
    grupa.matrixAutoUpdate = false;
    grupa.add(zid);
    L.forEach(function (l, i) {
      const g = new THREE.PlaneGeometry(l[5] * k, l[6] * k);
      const uv = g.attributes.uv;
      for (let q = 0; q < uv.count; q++) uv.setXY(q, (l[3] + uv.getX(q) * l[5]) / sir, 1 - (l[4] + (1 - uv.getY(q)) * l[6]) / vis);
      const mat = puder(0.32);
      mat.alphaMap = maska; mat.transparent = true; mat.depthWrite = false;
      mat.bumpMap = izbocina; mat.bumpScale = 2.2;
      mat.side = THREE.DoubleSide;
      const mesh = new THREE.Mesh(g, mat);
      mesh.position.set((l[3] + l[5] / 2 - cx) * k, -(l[4] + l[6] / 2 - Y0) * k, 0);
      const s = stranice[stranica(l)], naStr = L.filter(function (m, q) { return stranica(m) === stranica(l) && (m[1] < l[1] || (m[1] === l[1] && (m[2] < l[2] || (m[2] === l[2] && q < i)))); }).length;
      mesh.userData.red = s.logotipa > 1 ? naStr / (s.logotipa - 1) : 0;
      mesh.userData.stranica = stranica(l);
      mesh.userData.logo = l;
      postaviOs(mesh, new THREE.Vector3(1, 0, 0), -l[5] * k / 2, l[5] * k / 2, 0.15, 40);
      zid.add(mesh);
      dijelovi.push(mesh);
    });
    return { grupa: grupa, zid: zid, dijelovi: dijelovi, stranice: stranice, piks: piks, k: k, cx: cx, Y0: Y0, sir: sir };
  }

  // ── Penhaligon's: pet bočica (tijelo, etiketa, zlatni ovratnik i glava)
  function napraviPen(Pm, MOD) {
    const grupa = new THREE.Group(), dijelovi = [], bocice = [];
    grupa.matrixAutoUpdate = false;
    const bin = Uint8Array.from(atob(MOD.bin), function (ch) { return ch.charCodeAt(0); }).buffer;
    const T = Pm.tijelo, E = Pm.etiketa, DT = Pm.dnoTekucine;
    const kr = krug(MOBITEL ? 64 : 96);
    const gust = zagladi(T, 3);
    function dioTijela(od, do_, zatvori) {
      const p = gust.filter(function (q) { return q[0] >= od - 1e-6 && q[0] <= do_ + 1e-6; });
      return tijeloIzProfila(prstenoviProfila(p, kr), zatvori);
    }
    for (let i = 0; i < gust.length - 1; i++) if (gust[i][0] < DT && gust[i + 1][0] > DT) { const t = (DT - gust[i][0]) / (gust[i + 1][0] - gust[i][0]); gust.splice(i + 1, 0, [DT, lerp(gust[i][1], gust[i + 1][1], t)]); break; }
    const gDno = dioTijela(0, DT), gTijelo = dioTijela(DT, T[T.length - 1][0], true);
    // etiketa: zakrivljeni papir oko tijela (omotan, kao prava etiketa)
    function polaSirine(y) { for (let i = 0; i < T.length - 1; i++) { const a = T[i], b = T[i + 1]; if (y >= a[0] && y <= b[0] && b[0] > a[0]) return lerp(a[1], b[1], (y - a[0]) / (b[0] - a[0])); } return T[T.length - 1][1]; }
    const ER = 40, EC = 28, ep = [], en = [], eu = [], ei = [];
    for (let i = 0; i <= ER; i++) {
      const y = lerp(E.y0, E.y1, i / ER), R = polaSirine(y) + 0.7;
      for (let j = 0; j <= EC; j++) {
        const s = lerp(-E.x, E.x, j / EC), f = s / R;
        ep.push(R * Math.sin(f), y, R * Math.cos(f)); en.push(Math.sin(f), 0, Math.cos(f)); eu.push(j / EC, i / ER);
      }
    }
    for (let i = 0; i < ER; i++) for (let j = 0; j < EC; j++) { const a = i * (EC + 1) + j, b = a + EC + 1; ei.push(a, a + 1, b, b, a + 1, b + 1); }
    const gEt = new THREE.BufferGeometry();
    gEt.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3));
    gEt.setAttribute('normal', new THREE.Float32BufferAttribute(en, 3));
    gEt.setAttribute('uv', new THREE.Float32BufferAttribute(eu, 2));
    gEt.setIndex(ei);

    PEN_IDS.forEach(function (id, b) {
      const g = window.PEN.glave[id], st = g.staklo || ['#888888', '#cccccc'];
      const boc = new THREE.Group();
      const dolje = new THREE.Color(st[1]), gore = new THREE.Color(st[0]);
      const tekucina = dolje.clone().lerp(gore, 0.35);
      const hsl = {};
      tekucina.getHSL(hsl);
      tekucina.setHSL(hsl.h, Math.min(1, hsl.s * 1.05), Math.min(0.6, hsl.l * 1.2));
      const dijeloviB = [];
      function dodaj(mesh, uloga) { mesh.userData.uloga = uloga; mesh.userData.bocica = b; boc.add(mesh); dijelovi.push(mesh); dijeloviB.push(mesh); return mesh; }
      const dno = dodaj(new THREE.Mesh(gDno, staklo(linearno(0.85, 0.9, 0.86), 2.5, 60)), 'staklo');
      const tij = dodaj(new THREE.Mesh(gTijelo, staklo(tekucina, 0.24, 160, 0.01)), 'staklo');
      // etiketa: crtež iz penhaligons/shared.js (isti kao u točkicama)
      const c = document.createElement('canvas'), G = MOBITEL ? 5 : 8;
      c.width = 2 * E.x * G; c.height = (E.y1 - E.y0) * G;
      const cx = c.getContext('2d');
      cx.scale(G, G);
      window.PEN.crtajEtiketu(cx, g);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const papir = rastopljiv(new THREE.MeshPhysicalMaterial({ map: tex, color: linearno(0.74, 0.72, 0.68), roughness: 0.62, metalness: 0, sheen: 0.4, sheenRoughness: 0.8, sheenColor: linearno(1, 0.95, 0.9), side: THREE.DoubleSide }));
      const et = dodaj(new THREE.Mesh(gEt, papir), 'etiketa');
      // zlatni ovratnik i glava (mreža iz modeli.js)
      const m = MOD.penhaligon.glave[id];
      const qp = new Int16Array(bin, m.poz.od, m.poz.duljina), qn = new Int8Array(bin, m.nor.od, m.nor.duljina), qt = new Uint16Array(bin, m.tro.od, m.tro.duljina);
      const n = qp.length / 3, poz = new Float32Array(n * 3), nor = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) {
        poz[3 * i + a] = m.min[a] + (qp[3 * i + a] + 32768) / 65535 * (m.max[a] - m.min[a]);
        nor[3 * i + a] = qn[4 * i + a] / 127;
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(poz, 3));
      gg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      gg.setIndex(new THREE.BufferAttribute(new Uint16Array(qt), 1));
      gg.computeBoundingBox();
      const zl = dodaj(new THREE.Mesh(gg, zlato(0.22)), 'zlato');
      const vrh = gg.boundingBox.max.y;
      postaviOs(dno, new THREE.Vector3(0, 1, 0), 0, Pm.ovratnik.y0, 0.15, 0.05);
      postaviOs(tij, new THREE.Vector3(0, 1, 0), 0, Pm.ovratnik.y0, 0.15, 0.05);
      postaviOs(et, new THREE.Vector3(0, 1, 0), E.y0, E.y1, 0.12, 0.08);
      postaviOs(zl, new THREE.Vector3(0, 1, 0), Pm.ovratnik.y0, vrh, 0.15, 0.06);
      boc.matrixAutoUpdate = false;
      grupa.add(boc);
      bocice.push({ grupa: boc, dijelovi: dijeloviB, vrh: vrh });
    });
    return { grupa: grupa, dijelovi: dijelovi, bocice: bocice };
  }

  // ── Natpis MARTIMEX: puna slova od poliranog metala boje pudera
  function napraviNatpis(N) {
    const grupa = new THREE.Group(), dijelovi = [];
    grupa.matrixAutoUpdate = false;
    N.slova.forEach(function (s, i) {
      const oblici = s.oblici.map(function (o) {
        const tocke = function (t) { const a = []; for (let q = 0; q < t.length; q += 2) a.push(new THREE.Vector2(t[q], t[q + 1])); return a; };
        const sh = new THREE.Shape(tocke(o.van));
        o.rupe.forEach(function (r) { sh.holes.push(new THREE.Path(tocke(r))); });
        return sh;
      });
      let g = new THREE.ExtrudeGeometry(oblici, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.0075, bevelSegments: MOBITEL ? 3 : 5, curveSegments: 1 });
      g.translate(0, 0, -0.0225);
      g = toCreasedNormals(g, 0.6);
      const mesh = new THREE.Mesh(g, puder(0.3));
      mesh.position.x = s.sredina;
      mesh.userData.x = s.sredina;
      mesh.userData.slovo = i;
      postaviOs(mesh, new THREE.Vector3(0, 1, 0), -N.pola, N.pola, 0.2, 45);
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
      grupa.add(mesh);
      dijelovi.push(mesh);
    });
    return { grupa: grupa, dijelovi: dijelovi, pola: N.pola, broj: N.slova.length };
  }


  // ─────────────────────────────────────────────────────────────────────
  //  Zlatna prašina: u prijelazu se s užarenog ruba oblika koji nestaje
  //  odvajaju zrnca, plove (u vrtlogu, kao dim) i nestanu na rubu oblika
  //  koji nastaje. Svaki prijelaz ima svoje parove točaka (prva koja ode
  //  stigne prva) i trenutke odlaska i dolaska, izračunate iz rasporeda
  //  rastapanja dijelova oblika
  // ─────────────────────────────────────────────────────────────────────
  const BROJ_PRASINE = MOBITEL ? 7000 : 12000;
  const PRASINA_VS = `
    attribute vec4 aA;
    attribute vec4 aB;
    attribute vec4 aK;      // trenutak odlaska, trenutak dolaska, dizanje, oblak
    attribute vec4 aRnd;
    uniform float uProg;
    uniform float uT;
    uniform mat4 uMatA;
    uniform mat4 uMatB;
    uniform mat4 uDioA[8];
    uniform mat4 uDioB[8];
    uniform float uSize;
    uniform float uVis;
    uniform float uIzlaz;
    varying float vA;
    varying vec3 vBoja;
    vec3 svijet(vec4 a, mat4 m, mat4 d[8]) {
      if (a.w < -0.5) return (m * vec4(a.xyz, 1.0)).xyz;
      int k = int(a.w + 0.5);
      mat4 q = d[0];
      for (int i = 1; i < 8; i++) if (i == k) q = d[i];
      return (q * vec4(a.xyz, 1.0)).xyz;
    }
    void main() {
      vec3 pA = svijet(aA, uMatA, uDioA), pB = svijet(aB, uMatB, uDioB);
      // "Početak": prašina odleti prema van i gore, kao izmaglica parfema
      if (uIzlaz > 0.5) pB = pA + normalize(pA + (aRnd.yzw - 0.5) * 0.8 + vec3(0.0, 0.25, 0.0)) * 1.5 + vec3(0.0, 0.45, 0.0);
      float s = clamp((uProg - aK.x) / max(aK.y - aK.x, 1e-3), 0.0, 1.0);
      float e = s * s * (3.0 - 2.0 * s);
      vec3 sm = normalize(aRnd.xyz - 0.5 + 0.001);
      // oblak: iznad oblika koji nestaje (dim se digne) i oko oblika koji nastaje
      vec3 c = mix(pA, pB, 0.5) + vec3(0.0, aK.z, 0.0) + sm * (0.12 + 0.18 * aRnd.w);
      c = mix(c, pA + vec3(0.0, aK.z, 0.0) + sm * 0.1, clamp(aK.z * 2.0, 0.0, 0.8));
      c = mix(c, pB + sm * (0.08 + 0.2 * aRnd.w), aK.w);
      vec3 p = (1.0 - e) * (1.0 - e) * pA + 2.0 * e * (1.0 - e) * c + e * e * pB;
      // vrtlog
      float luk = sin(3.14159 * e);
      float k = luk * (0.7 + 0.6 * aRnd.y);
      vec2 r = p.xz - mix(pA.xz, pB.xz, e);
      p.xz = mix(pA.xz, pB.xz, e) + mat2(cos(k), -sin(k), sin(k), cos(k)) * r;
      p += 0.03 * luk * vec3(sin(uT * 1.7 + aRnd.x * 30.0), cos(uT * 1.3 + aRnd.y * 30.0), sin(uT * 1.1 + aRnd.z * 30.0));
      vA = uVis * smoothstep(0.0, 0.06, s) * (1.0 - smoothstep(0.86, 1.0, s)) * (0.55 + 0.45 * sin(uT * (2.0 + 3.0 * aRnd.w) + aRnd.x * 40.0));
      vBoja = mix(vec3(1.0, 0.62, 0.24), vec3(1.0, 0.86, 0.62), aRnd.z);
      vec4 mv = viewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * (0.6 + 0.8 * aRnd.w) * (${CAM.toFixed(1)} / max(0.5, -mv.z));
      if (vA <= 0.001) gl_PointSize = 0.0;
    }
  `;
  const PRASINA_FS = `
    varying float vA;
    varying vec3 vBoja;
    void main() {
      vec2 d = gl_PointCoord * 2.0 - 1.0;
      float r = dot(d, d);
      if (r > 1.0) discard;
      gl_FragColor = vec4(vBoja * 1.5, vA * (1.0 - r) * (1.0 - r));
    }
  `;
  function napraviPrasinu() {
    const g = new THREE.BufferGeometry(), rnd = slucajno(77), n = BROJ_PRASINE;
    const r = new Float32Array(n * 4);
    for (let i = 0; i < 4 * n; i++) r[i] = rnd();
    g.setAttribute('aRnd', new THREE.BufferAttribute(r, 4));
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const prazno = function (k) { return new THREE.BufferAttribute(new Float32Array(n * 4), 4); };
    g.setAttribute('aA', prazno()); g.setAttribute('aB', prazno()); g.setAttribute('aK', prazno());
    const dio = function () { return Array.from({ length: 8 }, function () { return new THREE.Matrix4(); }); };
    const mat = new THREE.ShaderMaterial({
      vertexShader: PRASINA_VS, fragmentShader: PRASINA_FS,
      uniforms: { uProg: { value: 0 }, uT: { value: 0 }, uMatA: { value: new THREE.Matrix4() }, uMatB: { value: new THREE.Matrix4() },
        uDioA: { value: dio() }, uDioB: { value: dio() }, uSize: { value: 2 }, uVis: { value: 1 }, uIzlaz: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    pts.renderOrder = 10;
    return pts;
  }

  // n točaka po površini dijelova oblika (razmjerno površini u svijetu);
  // za svaku: dio, mjesto u dijelu, mjesto u okviru (za prašinu) i indeks dijela za uDio
  // (logotipi: samo stranica koja se tada vidi)
  function uzorci(oblik, n, rnd, stranica) {
    const ime = oblik.ime;
    const out = [];
    const v3 = new THREE.Vector3();
    if (ime === 'marke') {
      // logotipi: po pikselima slike razmjerno svjetlini
      const D = oblik.dijelovi.filter(function (m) { return stranica === undefined || m.userData.stranica === stranica; }), mk = oblik.piks, sir = oblik.sir;
      const tez = D.map(function (m) {
        const l = m.userData.logo; let z = 0;
        for (let y = l[4]; y < l[4] + l[6]; y += 2) for (let x = l[3]; x < l[3] + l[5]; x += 2) z += mk[(y * sir + x) * 4] / 255;
        return z;
      });
      const uk = tez.reduce(function (a, b) { return a + b; }, 0);
      D.forEach(function (m, i) {
        const l = m.userData.logo, cnt = Math.round(n * tez[i] / uk);
        let k = 0, pok = 0;
        while (k < cnt && pok < cnt * 60) {
          pok++;
          const x = l[3] + rnd() * l[5], y = l[4] + rnd() * l[6];
          if (mk[(Math.floor(y) * sir + Math.floor(x)) * 4] / 255 < 0.5) continue;
          const lok = new THREE.Vector3((x - l[3] - l[5] / 2) * oblik.k, -(y - l[4] - l[6] / 2) * oblik.k, 0);
          out.push({ mesh: m, lok: lok, okvir: lok.clone().add(m.position), dio: -1 });
          k++;
        }
      });
    } else {
      const D = oblik.dijelovi;
      const povrsine = D.map(function (m) {
        const g = m.geometry, p = g.attributes.position, ind = g.index;
        let a = 0;
        const A = new THREE.Vector3(), Bv = new THREE.Vector3(), C = new THREE.Vector3();
        const t = ind ? ind.count / 3 : p.count / 3;
        for (let i = 0; i < t; i++) {
          const ia = ind ? ind.getX(3 * i) : 3 * i, ib = ind ? ind.getX(3 * i + 1) : 3 * i + 1, ic = ind ? ind.getX(3 * i + 2) : 3 * i + 2;
          A.fromBufferAttribute(p, ia); Bv.fromBufferAttribute(p, ib); C.fromBufferAttribute(p, ic);
          a += Bv.sub(A).cross(C.sub(A)).length() / 2;
        }
        const s = m.userData.mjerilo || 1;
        return a * s * s;
      });
      const uk = povrsine.reduce(function (a, b) { return a + b; }, 0);
      D.forEach(function (m, i) {
        const cnt = Math.round(n * povrsine[i] / uk);
        if (!cnt) return;
        const smp = new MeshSurfaceSampler(new THREE.Mesh(m.geometry)).setRandomGenerator(rnd).build();
        for (let k = 0; k < cnt; k++) {
          smp.sample(v3);
          let okv = v3.clone(), dio = -1;
          if (ime === 'pen') dio = m.userData.bocica;
          else if (ime === 'natpis') dio = m.userData.slovo;
          else if (ime === 'objekt') okv.multiplyScalar(0.8);
          out.push({ mesh: m, lok: okv.clone(), okvir: okv, dio: dio });
        }
      });
    }
    // točno n (višak odreži, manjak ponovi)
    while (out.length < n) out.push(out[Math.floor(rnd() * out.length)]);
    out.length = n;
    return out;
  }

  // ─────────────────────────────────────────────────────────────────────
  //  Raspored rastapanja u prijelazu: za svaki dio [od, do] (udio
  //  prijelaza) i smjer (obrni: 0 = plast ide odozdo prema gore)
  //  uloga: 'odlazi' (oblik nestaje) ili 'dolazi' (nastaje)
  // ─────────────────────────────────────────────────────────────────────
  function raspored(ime, uloga, partner) {
    const ob = oblici[ime], R = new Map();
    const svi = function (od, do_, obrni) { ob.dijelovi.forEach(function (m) { R.set(m, [od, do_, obrni]); }); };
    if (ime === 'objekt') {
      if (uloga === 'odlazi') svi(0.0, 0.55, 1);          // kugla se rastopi odozdo, prašina gradi flakon odozdo
      else svi(partner === 'uvod' ? 0.35 : 0.42, 1.0, 0);
    } else if (ime === 'flakon') {
      if (uloga === 'dolazi') svi(0.32, 1.0, 0);          // flakon se puni odozdo, čep zadnji
      else svi(0.0, partner === 'izlaz' ? 0.6 : 0.5, 0);    // rastopi se odozgo
    } else if (ime === 'marke') {
      ob.dijelovi.forEach(function (m) {
        const red = m.userData.red;
        if (uloga === 'dolazi') { const s = 0.2 + 0.42 * red; R.set(m, [s, s + 0.3, 0, 'x']); }   // logotip po logotip, slijeva nadesno
        else { const s = 0.02 + 0.16 * red; R.set(m, [s, s + 0.26, 0, 'y']); }                   // odozgo, red po red
      });
    } else if (ime === 'pen') {
      ob.bocice.forEach(function (b, i) {
        const d = Math.abs(i - 2);
        if (uloga === 'dolazi') {
          const s = 0.3 + 0.13 * d;
          b.dijelovi.forEach(function (m) {
            const u = m.userData.uloga;
            if (u === 'staklo') R.set(m, [s, s + 0.3, 0]);                // staklo odozdo
            else if (u === 'etiketa') R.set(m, [s + 0.1, s + 0.34, 1]);   // etiketa odozgo
            else R.set(m, [s + 0.24, s + 0.48, 0]);                       // glava raste iz ovratnika
          });
        } else {
          const s = 0.03 * d;
          b.dijelovi.forEach(function (m) {
            const u = m.userData.uloga;
            if (u === 'zlato') R.set(m, [s, s + 0.26, 0]);
            else if (u === 'etiketa') R.set(m, [s + 0.1, s + 0.36, 0]);
            else R.set(m, [s + 0.14, s + 0.46, 0]);
          });
        }
      });
    } else if (ime === 'natpis') {
      const n = ob.broj;
      ob.dijelovi.forEach(function (m) {
        const i = m.userData.slovo, t = n > 1 ? i / (n - 1) : 0;
        if (uloga === 'dolazi') { const s = 0.28 + 0.36 * t; R.set(m, [s, s + 0.3, 0]); }     // slovo po slovo, niti odozdo
        else { const s = 0.4 * (1 - t); R.set(m, [s, s + 0.34, 0]); }                        // od zadnjeg slova
      });
    }
    return R;
  }

  // podaci prašine za prijelaz (jednom po paru oblika)
  function prijelazPrasine(od, do_) {
    const kljuc = od + '>' + do_;
    if (prijelazi[kljuc]) return prijelazi[kljuc];
    const n = BROJ_PRASINE, rnd = slucajno(kljuc.length * 977 + 13);
    let A, tA, Bs, tB;
    const dizanje = od === 'pen' ? 0.32 : od === 'natpis' ? 0.12 : 0.05;
    const oblak = do_ === 'pen' ? 0.55 : do_ === 'objekt' ? 0.25 : 0.1;
    function vremena(oblik, uloga, partner, uz) {
      const R = raspored(oblik, uloga, partner);
      return uz.map(function (u) {
        const r = R.get(u.mesh), o = u.mesh.userData.os;
        let v;
        if (r[3] === 'y') { const h = u.mesh.geometry.parameters.height; v = lerp(sat((u.lok.y + h / 2) / h), 0.5, o.sum); }
        else v = vrijednost(u.mesh, u.lok, r[2], rnd());
        const kraj = v / (1 + RUB);
        return uloga === 'odlazi' ? r[0] + (1 - kraj) * (r[1] - r[0]) : r[0] + kraj * (r[1] - r[0]);
      });
    }
    if (od === 'uvod') {
      A = []; tA = [];
      for (let i = 0; i < n; i++) {
        const s = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(1.5 + 1.3 * rnd());
        A.push({ okvir: s, dio: -1 }); tA.push(0.25 * rnd());
      }
    } else { A = uzorci(oblici[od], n, rnd, od === 'marke' ? oblici.marke.stranice.length - 1 : undefined); tA = vremena(od, 'odlazi', do_, A); }
    if (do_ === 'izlaz') {
      Bs = A;
      tB = tA.map(function (t) { return Math.min(1, t + 0.35 + 0.2 * rnd()); });
    } else { Bs = uzorci(oblici[do_], n, rnd, do_ === 'marke' ? 0 : undefined); tB = vremena(do_, 'dolazi', od, Bs); }
    // prva koja ode stigne prva
    const iA = tA.map(function (_, i) { return i; }).sort(function (a, b) { return tA[a] - tA[b]; });
    const iB = tB.map(function (_, i) { return i; }).sort(function (a, b) { return tB[a] - tB[b]; });
    const aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), aK = new Float32Array(n * 4);
    for (let q = 0; q < n; q++) {
      const a = A[iA[q]], b = do_ === 'izlaz' ? Bs[iA[q]] : Bs[iB[q]];
      const ta = tA[iA[q]], tb = do_ === 'izlaz' ? tB[iA[q]] : Math.max(tB[iB[q]], ta + 0.1);
      aA.set([a.okvir.x, a.okvir.y, a.okvir.z, a.dio], 4 * q);
      aB.set([b.okvir.x, b.okvir.y, b.okvir.z, b.dio], 4 * q);   // (izlaz: isto mjesto, pomak prema van je u shaderu)
      aK.set([ta, tb, dizanje * (0.5 + rnd()), oblak], 4 * q);
    }
    return (prijelazi[kljuc] = { aA: aA, aB: aB, aK: aK, od: od, do: do_ });
  }

  // ─────────────────────────────────────────────────────────────────────
  //  Priprema: three.js, modeli i oblici
  // ─────────────────────────────────────────────────────────────────────
  function ucitajModele() {
    const v = '?v=' + Math.floor(Date.now() / 60000);
    const modeli = window.MX_MODELI_3D ? Promise.resolve(true) : O.ucitajSkriptu(O.BAZA_POKUSA + 'modeli.js' + v);
    const marke = window.MX_MARKE ? Promise.resolve(true) : O.ucitajSkriptu(O.BAZA + 'marke/marke.js' + v);
    const pen = (window.PEN && window.PEN.crtajEtiketu ? Promise.resolve(true) : O.ucitajSkriptu(O.BAZA + 'penhaligons/shared.js' + v)).then(function () {
      return Promise.all(PEN_IDS.map(function (id) { return window.PEN && window.PEN.glave && window.PEN.glave[id] ? true : O.ucitajSkriptu(O.BAZA + 'penhaligons/glave/' + id + '.js' + v); }));
    }).then(function () {
      const f = (window.PEN && window.PEN.FONTOVI_ETIKETE) || [];
      return document.fonts && document.fonts.load ? Promise.race([
        Promise.all(f.map(function (x) { return document.fonts.load(x, 'PORTRAITS').catch(function () {}); })),
        new Promise(function (r) { setTimeout(r, 2500); })
      ]) : null;
    });
    const slika = marke.then(function () {
      const M = window.MX_MARKE;
      if (!M || !M.slika) return null;
      const s = new Image();
      s.src = M.slika;
      return (s.decode ? s.decode() : new Promise(function (ok, ne) { s.onload = ok; s.onerror = ne; })).then(function () { return s; });
    }).catch(function () { return null; });
    return Promise.all([modeli, slika, pen]).then(function (r) { return { slika: r[1] }; });
  }

  function pripremi() {
    if (priprema) return priprema;
    priprema = Promise.resolve().then(function () {
      if (unisteno) return false;
      const test = document.createElement('canvas').getContext('webgl2');
      if (!test) { dogadaji.bezAnimacije(); return false; }
      return ucitajModele().then(function (u) {
        const MOD = window.MX_MODELI_3D;
        if (!MOD) throw new Error('nema modeli.js');
        renderer = new THREE.WebGLRenderer({ canvas: platno, antialias: true, alpha: false, powerPreference: 'high-performance' });
        renderer.setClearColor(0x000000, 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        if (MOBITEL) renderer.transmissionResolutionScale = 0.6;
        sceneGL = new THREE.Scene();
        sceneGL.environment = studio();
        sceneGL.environmentIntensity = 1.0;
        zid = pozadina();
        sceneGL.add(zid);
        const kljuc = new THREE.DirectionalLight(0xfff4e8, 0.9);
        kljuc.position.set(-0.5, 0.62, 0.6);
        sceneGL.add(kljuc);
        kamera = new THREE.PerspectiveCamera(40, 1, 0.1, 30);
        kamera.position.set(0, 0, CAM);

        oblici.objekt = napraviObjekt();
        oblici.flakon = napraviFlakon(MOD.flakon);
        oblici.natpis = napraviNatpis(MOD.natpis);
        if (window.PEN && window.PEN.crtajEtiketu && PEN_IDS.every(function (id) { return window.PEN.glave && window.PEN.glave[id]; })) {
          try { oblici.pen = napraviPen(MOD.penhaligon, MOD); imaPen = true; }
          catch (e) { console.warn('[Martimex] Stvarno: bez Penhaligon bočica', e); }
        }
        if (u.slika && window.MX_MARKE) {
          try { oblici.marke = napraviMarke(window.MX_MARKE, u.slika); imaMarke = true; marPodaci = oblici.marke; }
          catch (e) { console.warn('[Martimex] Stvarno: bez logotipa', e); }
        }
        Object.keys(oblici).forEach(function (k) { oblici[k].ime = k; oblici[k].grupa.visible = false; sceneGL.add(oblici[k].grupa); });
        if (imaPen) oblici.pen.bocice.forEach(function (b) { b.dijelovi.forEach(function (m) { m.userData.mjerilo = PEN_K * 0.85; }); });
        prasina = napraviPrasinu();
        sceneGL.add(prasina);

        composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: MOBITEL ? 2 : 4 }));
        composer.addPass(new RenderPass(sceneGL, kamera));
        bloom = new UnrealBloomPass(new THREE.Vector2(2, 2), 0.22, 0.35, 2.4);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());

        tijek = napraviTijekZa();
        velicina();
        // prašina za sve prijelaze unaprijed (nekoliko desetaka ms svaki)
        const parovi = [['uvod', 'objekt'], ['objekt', 'flakon'], ['natpis', 'objekt']];
        if (imaMarke) parovi.push(['flakon', 'marke'], [imaPen ? 'marke' : 'marke', imaPen ? 'pen' : 'natpis']);
        if (imaPen) parovi.push([imaMarke ? 'marke' : 'flakon', 'pen'], ['pen', 'natpis']);
        if (!imaMarke && !imaPen) parovi.push(['flakon', 'natpis']);
        parovi.forEach(function (p) { prijelazPrasine(p[0], p[1]); });
        // svi programi se prevedu unaprijed (da prvi krug ne zapinje)
        Object.keys(oblici).forEach(function (k) { oblici[k].grupa.visible = true; });
        renderer.compile(sceneGL, kamera);
        Object.keys(oblici).forEach(function (k) { oblici[k].grupa.visible = false; });
        nacrtaj(0);
        spremno = true;
        window.__mxPokus = Object.assign(window.__mxPokus || {}, { stvarno: true });
        // (za snimanje pokusa: skok na trenutak animacije)
        window.__mxSkok = function (t) { vrijeme = t; nacrtaj(t); };
        return true;
      });
    }).catch(function (e) {
      console.warn('[Martimex] Početni ekran (stvarno) bez animacije:', e);
      dogadaji.bezAnimacije();
      return false;
    });
    return priprema;
  }

  function napraviTijekZa() {
    const k = (imaMarke ? 'm' : '-') + (imaPen ? 'p' : '-');
    return tijekovi[k] || (tijekovi[k] = O.napraviTijek(imaMarke, imaPen, imaMarke ? marPodaci.stranice.length : 1));
  }

  function velicina() {
    if (!renderer) return;
    W = Math.max(1, platno.clientWidth); H = Math.max(1, platno.clientHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    composer.setPixelRatio(dpr);
    composer.setSize(W, H);
    const sw = Math.max(1, scena.offsetWidth), sh = Math.max(1, scena.offsetHeight);
    S = Math.max(40, Math.min(sw / 2.15, sh / 2.3) * O.VELICINA);
    let ox = 0, oy = 0;
    for (let e = scena; e && e !== platno.offsetParent; e = e.offsetParent) { ox += e.offsetLeft; oy += e.offsetTop; }
    sx = ox + sw / 2; sy = oy + sh / 2;
    const slobodno = 2 * Math.min(sx, W - sx) - 2 * O.RUB_NATPISA;
    povecanje = Math.max(0.3, Math.min(1, slobodno / (O.SIRINA_NATPISA * S * (P.nagibPremaMisu && O.MIS ? 1.04 : 1))));
    pasMar = sh / 2 / S;
    if (marPodaci) {
      const najvisa = Math.max.apply(null, marPodaci.stranice.map(function (s) { return s.pola; }));
      skalaMar = Math.max(0.3, Math.min(povecanje, (pasMar - MAR_RUB) / Math.max(0.01, najvisa)));
    }
    // kamera: na ravnini z = 0 jedna jedinica je S px, a ishodište je u sredini prostora animacije
    kamera.fov = 2 * Math.atan(H / (2 * S * CAM)) * 180 / Math.PI;
    kamera.aspect = W / H;
    kamera.setViewOffset(W, H, W / 2 - sx, H / 2 - sy, W, H);
    kamera.updateProjectionMatrix();
    prasina.material.uniforms.uSize.value = 1.7 * dpr * Math.min(1.25, Math.max(0.8, Math.sqrt(S / 160)));
    dogadaji.mjere(sh / 2 + oblici.natpis.pola * povecanje * S + 20);
    if (!vrti && spremno) nacrtaj(MIRNO.matches ? 99 : vrijeme);
  }

  // ─────────────────────────────────────────────────────────────────────
  //  Sličica
  // ─────────────────────────────────────────────────────────────────────
  const T0 = new THREE.Matrix4();
  function postaviOblik(ime, rot, st, t, misKut, misNagib) {
    const ob = oblici[ime], g = ob.grupa;
    okret(g.matrix, rot[0] + misKut, rot[1] + misNagib, rot[2]);
    if (ime === 'flakon') g.matrix.multiply(T0.makeTranslation(0, 0.018 * Math.sin(t * 0.8), 0));
    else if (ime === 'marke') {
      const str = marPodaci.stranice, j = Math.max(0, Math.min(str.length - 1, Math.floor(st.stranica)));
      const pomak = -lerp(str[j].sredina, str[Math.min(str.length - 1, j + 1)].sredina, st.stranica - j);
      g.matrix.multiply(T0.makeScale(skalaMar, skalaMar, skalaMar));
      ob.zid.position.y = pomak;
      ob.zid.updateMatrix();
    } else if (ime === 'pen') {
      ob.bocice.forEach(function (b, i) {
        const R = PEN_RASPORED[i], s = R[2] * PEN_K * povecanje;
        b.grupa.matrix.makeRotationY(-(R[3] + st.penKut));
        b.grupa.matrix.premultiply(T0.makeScale(s, s, s));
        b.grupa.matrix.setPosition(R[0] * povecanje, (PEN_DNO + 0.012 * Math.sin(t * 0.8 + i * 1.3)) * povecanje, R[1] * povecanje);
      });
    } else if (ime === 'natpis') g.matrix.multiply(T0.makeScale(povecanje, povecanje, povecanje));
    g.visible = true;
    g.updateMatrixWorld(true);
  }

  // stanje slova natpisa u prijelazu (kao u točkicama): slovo se pri
  // slaganju malo poveća i spusti na mjesto (prebačaj) i jedva zasvijetli;
  // pri rastapanju se (od zadnjeg) digne i zasvijetli
  function slova(st, t, uloga) {
    const ob = oblici.natpis, n = ob.broj;
    ob.dijelovi.forEach(function (m) {
      const i = m.userData.slovo, ts = n > 1 ? i / (n - 1) : 0;
      let skala = 1, digni = 0, blj = 0;
      if (uloga === 'dolazi') {
        const ks = sat((st.prog - 0.28 - 0.36 * ts) / 0.42);
        const q = sat((ks - 0.6) / 0.4) - 1, o = 1 + q * q * (2.7 * q + 1.7);
        skala = 1.04 - 0.04 * o; digni = 0.012 * (1 - o);
        const b = (ks - 0.8) / 0.08; blj = Math.exp(-b * b);
      } else if (uloga === 'odlazi') {
        const ks = sat((st.prog - 0.4 * (1 - ts)) / 0.6), d = glatko(ks / 0.3);
        skala = 1 + 0.04 * d; digni = 0.07 * d;
        const b = Math.sin(Math.PI * sat(ks / 0.2)); blj = 0.5 * b * b;
      }
      const x = m.userData.x;
      m.matrix.makeScale(skala, skala, skala);
      m.matrix.setPosition(x, digni + 0.005 * Math.sin(x * 6 + t * 1.8), 0.03 * Math.sin(x * 2.4 - t * 1.2));
      m.material.userData.u.uBljesak.value = blj;
    });
  }

  function postaviRaz(ime, uloga, partner, prog) {
    const R = raspored(ime, uloga, partner);
    oblici[ime].dijelovi.forEach(function (m) {
      const r = R.get(m), u = m.material.userData.u;
      let a = sat((prog - r[0]) / (r[1] - r[0]));
      if (uloga === 'odlazi') a = 1 - a;
      u.uRaz.value = a;
      u.uObrni.value = r[2];
      if (ime === 'marke') {
        const o = m.userData.os;
        if (r[3] === 'y') { const h = m.geometry.parameters.height; u.uOs.value.set(0, 1, 0); u.uRaspon.value.set(-h / 2, h / 2); }
        else { u.uOs.value.copy(o.os); u.uRaspon.value.set(o.od, o.do); }
      }
    });
  }
  function puno(ime) { oblici[ime].dijelovi.forEach(function (m) { const u = m.material.userData.u; u.uRaz.value = 1; u.uObrni.value = 0; }); }

  function svijetMatrice(ime, polje) {
    const ob = oblici[ime];
    if (ime === 'pen') ob.bocice.forEach(function (b, i) { polje[i].copy(b.grupa.matrixWorld); });
    else if (ime === 'natpis') ob.dijelovi.forEach(function (m, i) { if (i < 8) polje[i].copy(m.matrixWorld); });
  }
  function grupaMatrica(ime, m) {
    const ob = oblici[ime];
    if (ime === 'marke') m.copy(ob.zid.matrixWorld);
    else m.copy(ob.grupa.matrixWorld);
  }

  function nacrtaj(t) {
    if (!renderer) return;
    const mirno = MIRNO.matches;
    const st = mirno ? { od: OBLIK.natpis, do: OBLIK.natpis, prog: 0, uvod: 1, A: [0, 0, 0], B: [0, 0, 0], odsjaj: 99, sjaj: 99, podnaslov: true, penKut: 0, stranica: 0 }
      : stanjeKruga(t);
    const misKut = nagibX * 0.3, misNagib = nagibY * 0.16;
    const izlaz = izlazOd < 0 ? 0 : sat((vrijeme - izlazOd) / izlazTrajanje);
    const od = IME_OBLIKA[st.od], do_ = IME_OBLIKA[st.do], prijelaz = st.prog > 0 && od !== do_;
    Object.keys(oblici).forEach(function (k) { oblici[k].grupa.visible = false; });
    if (oblici.objekt) oblici.objekt.dijelovi[0].material.userData.u.uT.value = mirno ? 7 : t;

    postaviOblik(od, st.A, st, t, misKut, misNagib);
    if (prijelaz) postaviOblik(do_, st.B, st, t, misKut, misNagib);
    if (od === 'natpis' || do_ === 'natpis') slova(st, t, !prijelaz ? 'miruje' : od === 'natpis' ? 'odlazi' : 'dolazi');
    oblici.natpis.grupa.updateMatrixWorld(true);

    let par = null, prog = st.prog;
    if (st.uvod < 1) {
      const u = sat(st.uvod);
      postaviRaz('objekt', 'dolazi', 'uvod', u);
      par = prijelazPrasine('uvod', 'objekt'); prog = u;
    } else if (prijelaz) {
      postaviRaz(od, 'odlazi', do_, st.prog);
      postaviRaz(do_, 'dolazi', od, st.prog);
      par = prijelazPrasine(od, do_);
    } else puno(od);

    // logotipi: vidi se samo prostor animacije (gore se rastope, dolje nastaju)
    if (oblici.marke && (od === 'marke' || do_ === 'marke')) {
      const Hm = pasMar;
      oblici.marke.dijelovi.forEach(function (m) {
        const u = m.material.userData.u;
        u.uOkvir.value.set(-Hm + MAR_RUB * 0.4, Hm - MAR_RUB * 0.4, MAR_RUB * 0.8, MAR_RUB * 0.6);
        u.uSjajOs.value.set(1, 0.45, 0);
        u.uSjaj.value.set(st.sjaj, 0.3, 0.55);
      });
    }
    // odsjaj niz staklo flakona i bočica
    ['flakon', 'pen'].forEach(function (k) {
      if (!oblici[k]) return;
      oblici[k].dijelovi.forEach(function (m) {
        const u = m.material.userData.u;
        u.uSjajOs.value.set(0, 1, 0);
        u.uSjaj.value.set(st.odsjaj, 0.06, 0.35);
      });
    });
    oblici.natpis.dijelovi.forEach(function (m) {
      const u = m.material.userData.u;
      u.uSjajOs.value.set(1, 0, 0);
      u.uSjaj.value.set(st.sjaj, 0.24, 0.5);
    });

    // svjetlo na zidu iza predmeta prati oblik
    {
      const a = MRLJA[od], b = MRLJA[do_], e = prijelaz ? glatko(st.prog) : 0, u = zid.material.uniforms;
      u.uMrlja.value.set(lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e), lerp(a[3], b[3], e));
      u.uJak.value = lerp(a[4], b[4], e) * (1 - izlaz);
    }

    // "Početak": sve se rastopi u zlatnu prašinu koja odleti prema van i gore
    if (izlaz > 0) {
      const ime = prijelaz && st.prog > 0.5 ? do_ : od;
      postaviRaz(ime, 'odlazi', 'izlaz', izlaz);
      if (prijelaz) oblici[ime === od ? do_ : od].grupa.visible = false;
      par = prijelazPrasine(ime, 'izlaz'); prog = izlaz;
    }

    // prašina
    const pu = prasina.material.uniforms;
    prasina.visible = !!par && !mirno;
    if (par) {
      const g = prasina.geometry;
      if (g.userData.par !== par) {
        g.attributes.aA.array.set(par.aA); g.attributes.aA.needsUpdate = true;
        g.attributes.aB.array.set(par.aB); g.attributes.aB.needsUpdate = true;
        g.attributes.aK.array.set(par.aK); g.attributes.aK.needsUpdate = true;
        g.userData.par = par;
      }
      pu.uProg.value = prog;
      if (par.od === 'uvod') pu.uMatA.value.identity(); else { grupaMatrica(par.od, pu.uMatA.value); svijetMatrice(par.od, pu.uDioA.value); }
      pu.uIzlaz.value = par.do === 'izlaz' ? 1 : 0;
      if (par.do === 'izlaz') { pu.uMatB.value.copy(pu.uMatA.value); svijetMatrice(par.od, pu.uDioB.value); }
      else { grupaMatrica(par.do, pu.uMatB.value); svijetMatrice(par.do, pu.uDioB.value); }
    }
    pu.uT.value = t;

    composer.render();
    if (st.podnaslov !== podnaslov) { podnaslov = st.podnaslov; dogadaji.podnaslov(podnaslov); }
    if (izlaz >= 1 && izlazGotov) { const f = izlazGotov; izlazGotov = null; f(); }
  }

  // krug kao u pocetna-chata.js (s logotipima i bočicama ako su tu)
  function stanjeKruga(t) {
    const tj = tijek;
    if (t < tj.pojava) return tj.stanje(t, -1);
    const u = t - tj.pojava;
    if (!P.ponavljaj) return tj.stanje(t, Math.min(u, tj.natpisOd + 0.001));
    return tj.stanje(t, u % tj.L);
  }

  function sljedeca(sad) {
    raf = requestAnimationFrame(sljedeca);
    const dt = Math.min(0.05, Math.max(0, (sad - zadnje) / 1000));
    zadnje = sad;
    vrijeme += dt;
    const f = 1 - Math.exp(-dt * 3.5);
    nagibX += (misX - nagibX) * f;
    nagibY += (misY - nagibY) * f;
    nacrtaj(vrijeme);
  }
  function pokreni() {
    if (!spremno || vrti || unisteno) return;
    if (MIRNO.matches) { nacrtaj(99); return; }
    vrti = true;
    zadnje = performance.now();
    raf = requestAnimationFrame(sljedeca);
  }
  function stani() { vrti = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  return {
    pripremi: pripremi,
    velicina: velicina,
    ispocetka: function () {
      stani();
      vrijeme = 0; izlazOd = -1; izlazGotov = null; podnaslov = null;
      return pripremi().then(function (ok) { if (ok && dogadaji.otvoreno()) pokreni(); return ok; });
    },
    stani: stani,
    mis: function (x, y) { misX = x; misY = y; },
    izlaz: function (gotovo) {
      if (!spremno || MIRNO.matches) { gotovo(); return; }
      izlazOd = vrijeme;
      izlazGotov = gotovo;
      pokreni();
    },
    unisti: function () {
      unisteno = true;
      stani();
      if (renderer) {
        sceneGL.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          if (o.material) { Object.values(o.material).forEach(function (v) { if (v && v.isTexture) v.dispose(); }); o.material.dispose(); }
        });
        if (sceneGL.environment) sceneGL.environment.dispose();
        composer.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      }
      renderer = null;
    }
  };
}
