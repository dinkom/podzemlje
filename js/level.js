// Podzemlje — zone (razine)
//   '#' stijena   '-' daska (prolazna odozdo)   'D' vrata   '~' voda   '.' zrak
const Level = (() => {

  function grid(W, H) {
    const g = [];
    for (let y = 0; y < H; y++) g.push(new Array(W).fill('#'));
    return {
      g,
      carve(x1, y1, x2, y2, ch = '.') { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) g[y][x] = ch; },
      plat(x1, x2, y) { for (let x = x1; x <= x2; x++) g[y][x] = '-'; },
    };
  }
  const at = (x, y) => ({ x: x * TILE + TILE / 2, y: (y + 1) * TILE }); // dno ćelije
  const door = (tx, ty, w = 2, h = 4) => ({ tx, ty, w, h, x: tx * TILE, y: ty * TILE });

  // ================= ZONA 1: GORNJE ŠPILJE =================
  function zone1() {
    const W = 166, H = 34, G = grid(W, H), { carve, plat } = G;
    carve(2, 8, 28, 20); carve(29, 12, 90, 20); carve(86, 21, 89, 24); carve(60, 25, 120, 31);
    carve(100, 23, 110, 24); carve(103, 21, 110, 22); carve(95, 12, 123, 20);
    carve(124, 17, 125, 20, 'D'); carve(126, 12, 162, 20);
    plat(16, 20, 19); plat(22, 26, 17);
    plat(43, 47, 19); plat(48, 52, 17);
    plat(58, 64, 19); plat(66, 70, 17); plat(72, 75, 15);
    plat(95, 98, 30); plat(99, 102, 28); plat(104, 107, 26); plat(108, 110, 24); plat(103, 105, 22); plat(109, 110, 22);
    plat(66, 69, 30);
    plat(129, 133, 19); plat(135, 141, 17); plat(144, 150, 17); plat(153, 156, 19);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(7, 20) }, { type: 'note', id: 'N1', ...at(12, 20) }, { type: 'crawler', id: 'b1', ...at(23, 16) },
      { type: 'cabinet', id: 'o1', ...at(38, 20) }, { type: 'battery', id: 'B1', ...at(50, 16) }, { type: 'cabinet', id: 'o2', ...at(54, 20) },
      { type: 'note', id: 'N2', ...at(57, 20) }, { type: 'crawler', id: 'b2', ...at(61, 18) }, { type: 'cabinet', id: 'o3', ...at(67, 20) },
      { type: 'battery', id: 'B5', ...at(73, 14) }, { type: 'cabinet', id: 'o4', ...at(80, 20) },
      { type: 'key', id: 'K', ...at(66, 31) }, { type: 'battery', id: 'B6', ...at(67, 29) }, { type: 'note', id: 'N3', ...at(72, 31) },
      { type: 'crawler', id: 'b3', ...at(78, 31) }, { type: 'battery', id: 'B2', ...at(82, 31) }, { type: 'crawler', id: 'b4', ...at(92, 31) },
      { type: 'battery', id: 'B7', ...at(101, 27) },
      { type: 'battery', id: 'B3', ...at(97, 20) }, { type: 'checkpoint', id: 'C2', ...at(115, 20) }, { type: 'note', id: 'N4', ...at(119, 20) },
      { type: 'cabinet', id: 'o5', ...at(131, 20) }, { type: 'battery', id: 'B4', ...at(138, 16) }, { type: 'crawler', id: 'b5', ...at(147, 16) },
      { type: 'cabinet', id: 'o6', ...at(146, 20) }, { type: 'cabinet', id: 'o7', ...at(158, 20) }, { type: 'exit', id: 'E', ...at(161, 20) },
    ];
    const monsters = [
      { id: 'M1', ...at(72, 20), minX: 31 * TILE, maxX: 84 * TILE, cMin: 29 * TILE + 8, cMax: 86 * TILE - 6 },
      { id: 'M2', ...at(61, 31), minX: 60 * TILE + 10, maxX: 119 * TILE, cMin: 60 * TILE + 8, cMax: 121 * TILE - 8, dormant: true },
      { id: 'M3', ...at(150, 20), minX: 127 * TILE, maxX: 159 * TILE, cMin: 126 * TILE + 8, cMax: 163 * TILE - 8 },
    ];
    return {
      theme: 'spilje', W, H, grid: G.g, objects, monsters, door: door(124, 17), start: at(4, 20),
      notes: {
        N1: 'Ako ovo čitaš, i ti si propao kroz pukotinu.\n\nSvjetiljka pomaže… ali ONO voli svjetlo.\nKad čuješ teške korake — ugasi je i sakrij se u ormar.',
        N2: 'Brojao sam mu korake.\nSto dvadeset.\nOnda je stao.\n\nIspred mog ormara.',
        N3: 'Ne diraj ključ.\nKljuč je njegov.\n\nKad ga uzmeš, probudit će se onaj koji spava u zidu.',
        N4: 'Iza vrata je izlaz. Barem tako kažu.\n\nNitko se nije vratio da to potvrdi.',
      },
    };
  }

  // ================= ZONA 2: KRISTALNI RUDNIK =================
  function zone2() {
    const W = 150, H = 36, G = grid(W, H), { carve, plat } = G;
    carve(2, 6, 22, 14);        // ulaz u rudnik
    carve(23, 8, 70, 14);       // gornja galerija (šišmiši)
    carve(66, 15, 69, 23);      // okno prema dolje
    carve(30, 24, 124, 31);     // donja galerija (Tihi)
    carve(100, 4, 112, 23);     // visoko okno
    carve(113, 4, 118, 7);      // niša s ključem
    carve(125, 28, 126, 31, 'D');
    carve(127, 24, 146, 31);    // izlaz
    plat(14, 18, 12);
    plat(30, 34, 13); plat(37, 41, 11); plat(52, 56, 13);
    plat(42, 46, 30);
    // cik-cak daske u oknu
    const L = [101, 105], Rr = [106, 110];
    [30, 26, 22, 18, 14, 10].forEach(y => plat(L[0], L[1], y));
    [28, 24, 20, 16, 12].forEach(y => plat(Rr[0], Rr[1], y));
    plat(106, 112, 8);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 14) }, { type: 'note', id: 'N1', ...at(10, 14) },
      { type: 'battery', id: 'B1', ...at(32, 12) }, { type: 'bat', id: 'w1', ...at(36, 8) }, { type: 'bat', id: 'w2', ...at(47, 8) },
      { type: 'crawler', id: 'b1', ...at(50, 14) }, { type: 'bat', id: 'w3', ...at(59, 8) }, { type: 'battery', id: 'B2', ...at(54, 12) },
      { type: 'battery', id: 'B3', ...at(40, 31) }, { type: 'battery', id: 'B8', ...at(44, 29) }, { type: 'crawler', id: 'b2', ...at(47, 31) }, { type: 'note', id: 'N2', ...at(52, 31) },
      { type: 'checkpoint', id: 'C2', ...at(60, 31) },
      { type: 'cabinet', id: 'o1', ...at(79, 31) }, { type: 'cabinet', id: 'o2', ...at(91, 31) },
      { type: 'battery', id: 'B4', ...at(102, 17) }, { type: 'bat', id: 'w4', ...at(105, 19) }, { type: 'bat', id: 'w5', ...at(106, 12) },
      { type: 'battery', id: 'B5', ...at(109, 11) },
      { type: 'note', id: 'N3', ...at(114, 7) }, { type: 'key', id: 'K', ...at(117, 7) },
      { type: 'cabinet', id: 'o3', ...at(116, 31) }, { type: 'cabinet', id: 'o4', ...at(122, 31) },
      { type: 'note', id: 'N4', ...at(131, 31) }, { type: 'battery', id: 'B6', ...at(134, 31) }, { type: 'exit', id: 'E', ...at(144, 31) },
    ];
    const monsters = [
      { id: 'M1', ...at(86, 31), minX: 76 * TILE, maxX: 97 * TILE, cMin: 30 * TILE + 8, cMax: 124 * TILE + 8 },
      { id: 'M2', ...at(120, 31), minX: 113 * TILE, maxX: 123 * TILE, cMin: 100 * TILE, cMax: 124 * TILE + 8, dormant: true },
    ];
    return {
      theme: 'rudnik', W, H, grid: G.g, objects, monsters, door: door(125, 28), start: at(4, 14),
      notes: {
        N1: 'Rudari su kopali kristale koji svijetle sami od sebe.\n\nPrestali su kopati kad su iz zida čuli pjevanje.',
        N2: 'Šišmiši ovdje ne vide ništa.\nAli osjete toplinu svjetla.\n\nKad ih je previše — ugasi svjetiljku.',
        N3: 'Ključ je stavljen gore, u nišu, da ga nitko ne dohvati.\n\nIspod, kod vrata, netko ga čeka da se vrati.',
        N4: 'Kristali dublje dolje ne svijetle.\n\nTamo je voda.',
      },
    };
  }

  // ================= ZONA 3: POTOPLJENE DUBINE =================
  function zone3() {
    const W = 145, H = 34, G = grid(W, H), { carve, plat } = G;
    carve(2, 10, 20, 20);          // ulaz
    carve(21, 10, 82, 20);         // poplavljena dvorana
    carve(30, 21, 40, 21, '~'); carve(50, 21, 57, 21, '~'); carve(64, 21, 70, 21, '~');
    carve(76, 21, 80, 24);         // rupa prema tunelu
    carve(22, 25, 80, 29);         // potopljeni tunel ispod
    carve(31, 29, 46, 29, '~'); carve(52, 29, 66, 29, '~');
    carve(83, 17, 84, 20, 'D');
    carve(85, 12, 140, 20);        // druga dvorana
    carve(93, 21, 101, 21, '~'); carve(110, 21, 119, 21, '~');
    // daske
    plat(29, 33, 19); plat(35, 41, 17); plat(49, 53, 19); plat(63, 67, 19);
    plat(76, 77, 28); plat(79, 80, 26); plat(76, 77, 24); plat(79, 80, 22);
    plat(92, 96, 19); plat(98, 102, 17); plat(109, 112, 19); plat(114, 120, 17);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 20) }, { type: 'note', id: 'N1', ...at(10, 20) },
      { type: 'battery', id: 'B1', ...at(38, 16) }, { type: 'crawler', id: 'b1', ...at(45, 20) },
      { type: 'cabinet', id: 'o1', ...at(47, 20) }, { type: 'cabinet', id: 'o2', ...at(61, 20) }, { type: 'cabinet', id: 'o3', ...at(73, 20) },
      { type: 'battery', id: 'B2', ...at(65, 18) },
      // tunel
      { type: 'key', id: 'K', ...at(24, 29) }, { type: 'note', id: 'N3', ...at(27, 29) }, { type: 'cabinet', id: 'o4', ...at(29, 29) },
      { type: 'battery', id: 'B3', ...at(49, 29) }, { type: 'cabinet', id: 'o5', ...at(48, 29) },
      { type: 'cabinet', id: 'o6', ...at(68, 29) }, { type: 'crawler', id: 'b2', ...at(71, 29) }, { type: 'battery', id: 'B4', ...at(73, 29) },
      // druga dvorana
      { type: 'checkpoint', id: 'C2', ...at(88, 20) }, { type: 'note', id: 'N2', ...at(91, 20) },
      { type: 'cabinet', id: 'o7', ...at(105, 20) }, { type: 'battery', id: 'B5', ...at(100, 16) }, { type: 'crawler', id: 'b3', ...at(117, 16) },
      { type: 'cabinet', id: 'o8', ...at(122, 20) }, { type: 'cabinet', id: 'o9', ...at(133, 20) },
      { type: 'note', id: 'N4', ...at(128, 20) }, { type: 'exit', id: 'E', ...at(138, 20) },
    ];
    const monsters = [
      { id: 'M1', ...at(60, 20), minX: 44 * TILE, maxX: 74 * TILE, cMin: 21 * TILE + 8, cMax: 76 * TILE - 8 },
      { id: 'M2', ...at(75, 29), minX: 22 * TILE + 10, maxX: 79 * TILE, cMin: 22 * TILE + 8, cMax: 80 * TILE, dormant: true },
      { id: 'M3', ...at(125, 20), minX: 100 * TILE, maxX: 136 * TILE, cMin: 85 * TILE + 8, cMax: 141 * TILE - 8 },
    ];
    return {
      theme: 'dubine', W, H, grid: G.g, objects, monsters, door: door(83, 17), start: at(4, 20),
      notes: {
        N1: 'Voda pamti korake.\n\nSvaki pljusak čuje se do kraja špilje — i on ga čuje.\nKad možeš, idi preko dasaka.',
        N2: 'Vrata su se otvorila.\nZnači da si ga našao. Ključ.\n\nI znači da te ON sad traži.',
        N3: 'Netko je ključ bacio na samo dno, u najdublji kut.\n\nKad ga podigneš, voda će zadrhtati.',
        N4: 'Ispod vode je nešto što gori.\nOsjećam miris dima.\n\nKosti. Svuda kosti.',
      },
    };
  }

  // ================= ZONA 4: KOSTURNICA =================
  function zone4() {
    const W = 160, H = 40, G = grid(W, H), { carve, plat } = G;
    carve(2, 6, 100, 13);          // gornji kat
    carve(88, 14, 91, 17);         // spust na srednji kat
    carve(18, 18, 150, 24);        // srednji kat
    carve(151, 21, 152, 24, 'D');
    carve(153, 18, 158, 24);       // izlaz
    carve(20, 25, 23, 28);         // spust na donji kat (lijevo)
    carve(140, 25, 148, 28);       // okno desno
    carve(10, 29, 150, 35);        // donji kat
    plat(20, 24, 12); plat(34, 38, 12); plat(56, 60, 12); plat(72, 76, 12);
    plat(30, 34, 23); plat(60, 64, 23); plat(104, 108, 23); plat(120, 124, 23);
    plat(141, 143, 34); plat(145, 147, 32); plat(141, 143, 30); plat(145, 147, 28); plat(146, 148, 26);
    plat(50, 54, 34); plat(84, 88, 34); plat(116, 120, 34);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 13) }, { type: 'note', id: 'N1', ...at(10, 13) },
      { type: 'battery', id: 'B1', ...at(36, 11) }, { type: 'bat', id: 'w1', ...at(42, 7) }, { type: 'crawler', id: 'b1', ...at(50, 13) },
      { type: 'bat', id: 'w2', ...at(65, 7) }, { type: 'battery', id: 'B2', ...at(74, 11) }, { type: 'bat', id: 'w3', ...at(82, 7) },
      // srednji kat
      { type: 'checkpoint', id: 'C2', ...at(84, 24) }, { type: 'note', id: 'N2', ...at(80, 24) },
      { type: 'battery', id: 'B3', ...at(32, 22) }, { type: 'crawler', id: 'b2', ...at(55, 24) }, { type: 'bat', id: 'w4', ...at(46, 19) }, { type: 'bat', id: 'w5', ...at(70, 19) },
      { type: 'cabinet', id: 'o1', ...at(99, 24) }, { type: 'cabinet', id: 'o2', ...at(112, 24) }, { type: 'cabinet', id: 'o3', ...at(127, 24) },
      { type: 'battery', id: 'B4', ...at(106, 22) },
      // donji kat
      { type: 'checkpoint', id: 'C3', ...at(14, 35) },
      { type: 'bat', id: 'w6', ...at(40, 30) }, { type: 'crawler', id: 'b3', ...at(58, 35) }, { type: 'battery', id: 'B5', ...at(52, 33) },
      { type: 'cabinet', id: 'o4', ...at(70, 35) }, { type: 'bat', id: 'w7', ...at(78, 30) }, { type: 'crawler', id: 'b4', ...at(92, 35) },
      { type: 'battery', id: 'B6', ...at(86, 33) }, { type: 'cabinet', id: 'o5', ...at(104, 35) }, { type: 'bat', id: 'w8', ...at(112, 30) },
      { type: 'battery', id: 'B7', ...at(118, 33) }, { type: 'cabinet', id: 'o6', ...at(131, 35) },
      { type: 'note', id: 'N3', ...at(136, 35) }, { type: 'key', id: 'K', ...at(146, 35) },
      { type: 'note', id: 'N4', ...at(154, 24) }, { type: 'exit', id: 'E', ...at(157, 24) },
    ];
    const monsters = [
      { id: 'M1', ...at(115, 24), minX: 95 * TILE, maxX: 135 * TILE, cMin: 18 * TILE + 8, cMax: 140 * TILE - 6 },
      { id: 'M2', ...at(126, 35), minX: 100 * TILE, maxX: 139 * TILE, cMin: 10 * TILE + 8, cMax: 150 * TILE + 8, dormant: true },
    ];
    return {
      theme: 'kosturnica', W, H, grid: G.g, objects, monsters, door: door(151, 21), start: at(4, 13), lightsOut: true, last: true,
      notes: {
        N1: 'Ovdje leže svi koji su ga pokušali nadmudriti.\n\nSvijeće gore za njih.\nNe pitaj tko ih pali.',
        N2: 'Na srednjem katu hoda on.\nDolje spavaju drugi.\n\nKljuč za posljednja vrata leži na samom dnu.',
        N3: 'Kad uzmeš ključ, sve će se svijeće ugasiti.\n\nTrči. Gore, desno, prema vratima.\nNe gledaj iza sebe.',
        N4: 'Ako ovo čitaš, uspio si.\n\nIza ovih vrata je nebo.\nPozdravi ga od mene.',
      },
    };
  }

  const ZONES = [zone1, zone2, zone3, zone4];

  const solid = (g, x, y, W, H) => (x < 0 || y < 0 || x >= W || y >= H) ? true : (g[y][x] === '#');

  // grafički slojevi (pločice 72px, skalirane na 1/3)
  function addVisuals(scene, L) {
    const g = L.grid, W = L.W, H = L.H, T = THEMES[L.theme];
    const R = Tiles.rng(1234 + L.W);
    const map = scene.make.tilemap({ tileWidth: TPX, tileHeight: TPX, width: W, height: H });
    const rockTs = map.addTilesetImage('rock', 'rocktiles_' + T.id, TPX, TPX, 0, 0, 0);
    const plankTs = map.addTilesetImage('plank', 'planktiles_' + T.id, TPX, TPX, 0, 0, 100);
    const decoTs = map.addTilesetImage('deco', 'decotiles_' + T.id, TPX, TPX, 0, 0, 200);
    const deco = map.createBlankLayer('deco', decoTs, 0, 0);
    const vis = map.createBlankLayer('vis', [rockTs, plankTs], 0, 0);
    const glows = [];
    const air = (ch) => ch === '.' || ch === '~';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = g[y][x];
      if (ch === '#') {
        const m = (solid(g, x, y - 1, W, H) ? 0 : 1) | (solid(g, x + 1, y, W, H) ? 0 : 2) | (solid(g, x, y + 1, W, H) ? 0 : 4) | (solid(g, x - 1, y, W, H) ? 0 : 8);
        vis.putTileAt(m * 3 + Math.floor(R() * 3), x, y);
      } else if (ch === '-') {
        const l = g[y][x - 1] === '-', r = g[y][x + 1] === '-';
        vis.putTileAt(100 + (!l ? 0 : !r ? 2 : 1), x, y);
      } else if (ch === '.') {
        const floor = solid(g, x, y + 1, W, H), ceil = solid(g, x, y - 1, W, H);
        if (floor && R() < 0.34) {
          const roll = R();
          const d = roll < 0.22 ? 0 : roll < 0.4 ? 1 : roll < 0.6 ? 2 : roll < 0.72 ? 3 : roll < 0.92 ? 4 : 5;
          deco.putTileAt(200 + d, x, y);
          if (d < 2) glows.push({ x: x * TILE + 12, y: y * TILE + (T.id === 'kosturnica' ? 12 : 19), col: T.glow[d] });
        } else if (ceil && R() < 0.38) {
          const roll = R();
          const d = roll < 0.45 ? 6 + (R() < 0.5 ? 0 : 1) : roll < 0.75 ? 8 + (R() < 0.7 ? 0 : 1) : roll < 0.88 ? 10 : 11;
          deco.putTileAt(200 + d, x, y);
          if (T.id === 'dubine' && d === 8) glows.push({ x: x * TILE + 12, y: y * TILE + 12, col: T.glow[0] });
        }
      }
    }
    [deco, vis].forEach(l => { l.setScale(1 / RES); l.setCullPadding(3, 3); });
    deco.setDepth(6); vis.setDepth(5);
    return glows;
  }

  // kolizijski sloj (24px, nevidljiv)
  function addCollision(scene, L) {
    const data = L.grid.map(row => row.map(c => c === '#' ? 0 : c === '-' ? 1 : c === 'D' ? 2 : -1));
    const map = scene.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const ts = map.addTilesetImage('col', 'coltiles', TILE, TILE, 0, 0);
    const layer = map.createLayer(0, ts, 0, 0);
    layer.setVisible(false);
    layer.setCollision([0, 2]);
    layer.forEachTile(t => { if (t.index === 1) t.setCollision(false, false, true, false); });
    return layer;
  }

  return {
    count: ZONES.length,
    build(i) { const L = ZONES[i](); L.index = i; L.name = THEMES[L.theme].name; return L; },
    addVisuals, addCollision,
  };
})();