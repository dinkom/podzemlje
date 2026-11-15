// Podzemlje — raspored prve zone ("Gornje špilje")
const Level = (() => {
  const W = 166, H = 34;

  const NOTES = {
    N1: 'Ako ovo čitaš, i ti si propao kroz pukotinu.\n\nSvjetiljka pomaže… ali ONO voli svjetlo.\nKad čuješ teške korake — ugasi je i sakrij se u ormar.',
    N2: 'Brojao sam mu korake.\nSto dvadeset.\nOnda je stao.\n\nIspred mog ormara.',
    N3: 'Ne diraj ključ.\nKljuč je njegov.\n\nKad ga uzmeš, probudit će se onaj koji spava u zidu.',
    N4: 'Iza vrata je izlaz. Barem tako kažu.\n\nNitko se nije vratio da to potvrdi.',
  };

  function build() {
    const g = [];
    for (let y = 0; y < H; y++) g.push(new Array(W).fill('#'));
    const carve = (x1, y1, x2, y2, ch = '.') => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) g[y][x] = ch; };
    const plat = (x1, x2, y) => { for (let x = x1; x <= x2; x++) g[y][x] = '-'; };

    // prostorije
    carve(2, 8, 28, 20);      // početna špilja
    carve(29, 12, 90, 20);    // dugi hodnik (Tihi #1)
    carve(86, 21, 89, 24);    // rupa u podu
    carve(60, 25, 120, 31);   // donja špilja
    carve(100, 23, 110, 24);  // otvor prema gore
    carve(103, 21, 110, 22);
    carve(95, 12, 123, 20);   // gornji prolaz
    carve(124, 17, 125, 20, 'D'); // vrata
    carve(126, 12, 162, 20);  // završna dvorana (Tihi #3)

    // daske (prolazne odozdo)
    plat(16, 20, 19); plat(22, 26, 17);
    plat(43, 47, 19); plat(48, 52, 17);
    plat(58, 64, 19); plat(66, 70, 17); plat(72, 75, 15);
    plat(95, 98, 30); plat(99, 102, 28); plat(104, 107, 26); plat(108, 110, 24); plat(103, 105, 22);
    plat(66, 69, 30);
    plat(129, 133, 19); plat(135, 141, 17); plat(144, 150, 17); plat(153, 156, 19);

    const at = (x, y) => ({ x: x * TILE + TILE / 2, y: (y + 1) * TILE }); // dno ćelije
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(7, 20) },
      { type: 'note', id: 'N1', ...at(12, 20) },
      { type: 'crawler', id: 'b1', ...at(23, 16) },

      { type: 'cabinet', id: 'o1', ...at(38, 20) },
      { type: 'battery', id: 'B1', ...at(50, 16) },
      { type: 'cabinet', id: 'o2', ...at(54, 20) },
      { type: 'note', id: 'N2', ...at(57, 20) },
      { type: 'crawler', id: 'b2', ...at(61, 18) },
      { type: 'cabinet', id: 'o3', ...at(67, 20) },
      { type: 'battery', id: 'B5', ...at(73, 14) },
      { type: 'cabinet', id: 'o4', ...at(80, 20) },

      { type: 'key', id: 'K', ...at(66, 31) },
      { type: 'battery', id: 'B6', ...at(67, 29) },
      { type: 'note', id: 'N3', ...at(72, 31) },
      { type: 'crawler', id: 'b3', ...at(78, 31) },
      { type: 'battery', id: 'B2', ...at(82, 31) },
      { type: 'crawler', id: 'b4', ...at(92, 31) },
      { type: 'battery', id: 'B7', ...at(101, 27) },

      { type: 'battery', id: 'B3', ...at(97, 20) },
      { type: 'checkpoint', id: 'C2', ...at(115, 20) },
      { type: 'note', id: 'N4', ...at(119, 20) },

      { type: 'cabinet', id: 'o5', ...at(131, 20) },
      { type: 'battery', id: 'B4', ...at(138, 16) },
      { type: 'crawler', id: 'b5', ...at(147, 16) },
      { type: 'cabinet', id: 'o6', ...at(146, 20) },
      { type: 'cabinet', id: 'o7', ...at(158, 20) },
      { type: 'exit', id: 'E', ...at(161, 20) },
    ];
    const monsters = [
      { id: 'M1', ...at(72, 20), minX: 31 * TILE, maxX: 84 * TILE },
      { id: 'M2', ...at(61, 31), minX: 60 * TILE + 10, maxX: 119 * TILE, dormant: true },
      { id: 'M3', ...at(150, 20), minX: 127 * TILE, maxX: 159 * TILE },
    ];
    const door = { tx: 124, ty: 17, w: 2, h: 4, x: 124 * TILE, y: 17 * TILE };
    const start = at(4, 20);
    return { W, H, grid: g, objects, monsters, door, start, notes: NOTES };
  }

  const solid = (g, x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? true : (g[y][x] === '#');

  // grafički slojevi (pločice 72px, skalirane na 1/3)
  function addVisuals(scene, L) {
    const g = L.grid;
    const R = Tiles.rng(1234);
    const map = scene.make.tilemap({ tileWidth: TPX, tileHeight: TPX, width: W, height: H });
    const rockTs = map.addTilesetImage('rock', 'rocktiles', TPX, TPX, 0, 0, 0);
    const plankTs = map.addTilesetImage('plank', 'planktiles', TPX, TPX, 0, 0, 100);
    const decoTs = map.addTilesetImage('deco', 'decotiles', TPX, TPX, 0, 0, 200);
    const deco = map.createBlankLayer('deco', decoTs, 0, 0);
    const vis = map.createBlankLayer('vis', [rockTs, plankTs], 0, 0);
    const glows = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = g[y][x];
      if (ch === '#') {
        const m = (solid(g, x, y - 1) ? 0 : 1) | (solid(g, x + 1, y) ? 0 : 2) | (solid(g, x, y + 1) ? 0 : 4) | (solid(g, x - 1, y) ? 0 : 8);
        vis.putTileAt(m * 3 + Math.floor(R() * 3), x, y);
      } else if (ch === '-') {
        const l = g[y][x - 1] === '-', r = g[y][x + 1] === '-';
        vis.putTileAt(100 + (!l ? 0 : !r ? 2 : 1), x, y);
      } else if (ch === '.') {
        const floor = solid(g, x, y + 1), ceil = solid(g, x, y - 1);
        if (floor && R() < 0.32) {
          const roll = R();
          const d = roll < 0.22 ? 0 : roll < 0.4 ? 1 : roll < 0.6 ? 2 : roll < 0.72 ? 3 : roll < 0.92 ? 4 : 5;
          deco.putTileAt(200 + d, x, y);
          if (d < 2) glows.push({ x: x * TILE + 12, y: y * TILE + 19, col: d === 0 ? 0x63e6d6 : 0xc08cff });
        } else if (ceil && R() < 0.38) {
          const roll = R();
          const d = roll < 0.45 ? 6 + (R() < 0.5 ? 0 : 1) : roll < 0.75 ? 8 + (R() < 0.7 ? 0 : 1) : roll < 0.88 ? 10 : 11;
          deco.putTileAt(200 + d, x, y);
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

  return { build, addVisuals, addCollision, W, H };
})();
