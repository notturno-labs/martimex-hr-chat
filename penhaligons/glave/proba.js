// proba: jednostavan vrat i kugla (samo za provjeru podloge)
PEN.glave['proba'] = {
  ime: 'Lord George', podnaslov: 'The Tragedy of', staklo: ['#5f6a1c', '#b9c06a'],
  okvir: { x: 80, yMin: 320, yMax: 520, z: 80 },
  sdf: function (x, y, z) {
    const S = PEN.sdf, p = [x, y, z];
    return S.smin(S.stozac(p, [0, 335, 0], [0, 420, 0], 54, 45), S.elipsoid(p, [8, 450, 10], [48, 40, 55]), 10);
  }
};
