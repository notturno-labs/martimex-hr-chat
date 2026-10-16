// Jantarni blok: kvadratna ploča od duboko prozirne smole na stolu, zakrenuta
// (BLOK.kut), na njoj flakon (vrh bloka je u y = DNO_BOCICE). Kao na fotografiji:
// masa tamno crvenosmeđa s jantarnim žilama (plamenovi kao u kornjačevini),
// vrh od tamnog prednjeg kuta prema blijedom odsjaju sunca straga desno,
// bridovi, uglovi i donji rub žare svijetlo narančasto (svjetlo prolazi kroz
// rub), uglovi tlocrta zaobljeni, bridovi malo zaobljeni, vrh blago valovit
// (ručno poliran). Vrh: plahta s nitima duž vlastite osi bloka; bokovi:
// vodoravni rezovi SDF-a. Unutarnji sjaj je u bojama ploha (dno i bridovi
// svjetliji), jer točkice u dubini dubinski predprolaz ionako ne pokazuje.
// NAXOS.BLOK (položaj, veličina, zakret) koriste i drugi predmeti
(function () {
  'use strict';
  const N = window.NAXOS, C = N.C, V = N.vrste, STOL_Y = N.STOL_Y;
  const korakG = N.korakG, mijesaj = N.mijesaj, puta = N.puta, sat = N.sat, sum = N.sum, pjega = N.pjega, tvar = N.tvar;

  const BLOK = N.BLOK = { x: 0.04, z: 0.17, pola: 0.8, visina: 0.095, kut: 0.65 };
  const H = BLOK.pola, HY = BLOK.visina, RK = 0.05, RE = 0.012;     // pola stranice, pola visine, zaobljenje uglova tlocrta i bridova
  const CS = Math.cos(BLOK.kut), SN = Math.sin(BLOK.kut);
  // boje s fotografije: masa, žile (dvije svjetline), rub koji žari; vrh od prednjeg kuta (tamno) preko sredine do odsjaja (blijedo)
  const MASA = N.boja01('#9a3610'), ZILA = C.jantar, ZILA2 = C.jantarVrh, RUB = C.jantarRub;
  const VRH_T = N.boja01('#7e2c0c'), VRH_S = N.boja01('#c86c2c'), VRH_B = N.boja01('#f4d4a0');

  // tlocrt: kvadrat sa zaobljenim uglovima (vlastite koordinate), < 0 unutra
  function tlocrt(lx, lz) {
    const qx = Math.abs(lx) - H + RK, qz = Math.abs(lz) - H + RK;
    return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - RK;
  }
  // blaga valovitost vrha (ručno polirano)
  function val(lx, lz) { return 0.004 * sum(lx * 2.3 + 7, lz * 2.3, 1.5); }

  N.predmet('blok', {
    red: 10,
    gradi: function* (S) {
      const c = [BLOK.x, STOL_Y + HY, BLOK.z], lok = N.uLokalno(N.matrica(BLOK.kut), c);
      const sFlakonom = !N.SAMO.length || N.SAMO.indexOf('flakon') >= 0;   // flakon stoji na (0, 0), dno mu je široko 0,17: ispod njega vrh nema točkica, oko njega je kontaktna sjena

      // ── bokovi: SDF ploče (zaobljeni uglovi i bridovi), samo vodoravni rezovi
      const sdf = function (x, y, z) {
        const dx = x - c[0], dy = y - c[1], dz = z - c[2];
        const a = tlocrt(CS * dx - SN * dz, SN * dx + CS * dz) + RE, b = Math.abs(dy) - HY + RE;
        return Math.hypot(Math.max(a, 0), Math.max(b, 0)) + Math.min(Math.max(a, b), 0) - RE;
      };
      const bojaBoka = function (T) {
        if (T.ny < -0.5) return false;                                       // donji brid uz stol
        const p = lok(T.x, T.y, T.z), lx = p[0], ly = p[1] / HY, lz = p[2];
        const dno = korakG(0.1, -1, ly) + 0.8 * korakG(-0.7, -1, ly), vrh = korakG(0.6, 1, ly);   // donja polovica svjetlija, donji rub i gornji brid žare
        const kut = korakG(H - 0.12, H - 0.02, Math.min(Math.abs(lx), Math.abs(lz)));   // okomiti bridovi (uglovi)
        // žile: plamenovi razvučeni duž boka, u dvije veličine
        const f1 = sum(lx * 2.4 + 11, ly * 0.7, lz * 2.4), f2 = sum(lx * 6.5, ly * 1.6 + 3, lz * 6.5);
        const zila = korakG(-0.15, 0.7, 0.65 * f1 + 0.45 * f2);
        let col = mijesaj(MASA, ZILA, 0.7 * zila);
        col = mijesaj(col, ZILA2, 0.6 * zila * korakG(0.4, 0.95, f1));
        col = mijesaj(col, RUB, sat(0.6 * dno + 0.7 * vrh + 0.5 * kut));
        col = puta(col, 0.85 + 0.3 * pjega(T.x, T.y, T.z, 50));
        return tvar(T, col, 0.7, 0.5, 1.3, V.OBICNO, 0.08 + 0.04 * (0.5 + 0.5 * ly));
      };
      N.rezSDF(S, sdf, [c[0] - H * 1.45, c[0] + H * 1.45, STOL_Y - 0.01, STOL_Y + 2 * HY + 0.01, c[2] - H * 1.45, c[2] + H * 1.45], { osi: 'y', boja: bojaBoka });
      yield;

      // ── vrh: plahta s nitima duž vlastite osi x bloka; prati zaobljeni brid
      //    prema dolje, valovit; uglovi tlocrta i mjesto flakona se izrežu
      const MARG = 0.004;
      const vrhF = function (u, v) {
        const lx = (u * 2 - 1) * (H + MARG), lz = (v * 2 - 1) * (H + MARG), d = tlocrt(lx, lz) + RE;
        const y = c[1] + HY - (d > 0 ? RE - Math.sqrt(Math.max(0, RE * RE - d * d)) : 0) + val(lx, lz);
        return [c[0] + CS * lx + SN * lz, y, c[2] - SN * lx + CS * lz];
      };
      const bojaVrha = function (T, u, v) {
        const lx = (u * 2 - 1) * (H + MARG), lz = (v * 2 - 1) * (H + MARG), d = tlocrt(lx, lz);
        if (d > 0) return false;
        if (sFlakonom && T.x * T.x + T.z * T.z < 0.0256) return false;       // ispod flakona
        if (N.uZaklonu(T.x, T.z)) return false;
        // odsjaj sunca: od tamnog prednjeg kuta (−x, +z) do blijedog straga desno (+x, −z)
        const s = korakG(-1, 1, 0.85 * lx / H - 0.35 * lz / H);
        const sj = korakG(1, 0.2, Math.hypot((lx - 0.5 * H) / (0.6 * H), (lz + 0.3 * H) / (0.45 * H)));   // meka mrlja odsjaja uz flakon straga desno
        let col = s < 0.5 ? mijesaj(VRH_T, VRH_S, s * 2) : mijesaj(VRH_S, VRH_B, (s - 0.5) * 2);
        col = mijesaj(col, VRH_B, 0.5 * sj);
        const z1 = sum(lx * 2.5 + 3, lz * 2.5, 2), z2 = sum(lx * 7, lz * 7 + 5, 4);   // žile i mrlje u dubini
        col = mijesaj(col, ZILA, sat(0.3 * korakG(0.1, 0.6, z1) + 0.12 * z2));
        col = puta(col, 0.9 + 0.2 * pjega(T.x, T.y, T.z, 40));
        col = mijesaj(col, RUB, 0.85 * korakG(-0.04, 0, d));                 // brid žari
        let jak = 1 + 0.4 * korakG(0.45, 0.95, s) + 0.3 * sj;
        if (sFlakonom) {                                                     // kontaktna sjena flakona, pomaknuta od sunca (sprijeda desno)
          const sjena = korakG(0.46, 0.18, Math.hypot(T.x - 0.07, T.z - 0.06));
          col = puta(col, 1 - 0.55 * sjena); jak *= 1 - 0.3 * sjena;
        }
        return tvar(T, col, 0.45, 0.5, jak * 1.15, V.OBICNO, 0.09 + 0.04 * v);
      };
      N.plahta(S, vrhF, { razmak: 1.2, tezina: 0.8, gore: true, boja: bojaVrha });
      N.zaklonKutija(BLOK.x, BLOK.z, BLOK.kut, H, H, 2 * HY);
    }
  });
})();
