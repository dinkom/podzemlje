// Podzemlje — zone (razine)
//   '#' stijena   '-' daska (prolazna odozdo)   '=' daska koja puca   '^' šiljci
//   'B' gljiva-trampolin   'I' led (sklizak)   'D' vrata   '~' voda   '.' zrak
const Level = (() => {

  function grid(W, H) {
    const g = [];
    for (let y = 0; y < H; y++) g.push(new Array(W).fill('#'));
    return {
      g,
      carve(x1, y1, x2, y2, ch = '.') { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) g[y][x] = ch; },
      plat(x1, x2, y) { for (let x = x1; x <= x2; x++) g[y][x] = '-'; },
      spikes(x1, x2, y) { for (let x = x1; x <= x2; x++) g[y][x] = '^'; },
      crumble(x1, x2, y) { for (let x = x1; x <= x2; x++) g[y][x] = '='; },
      bounce(x1, x2, y) { for (let x = x1; x <= x2; x++) g[y][x] = 'B'; },
      ice(x1, x2, y) { for (let x = x1; x <= x2; x++) g[y][x] = 'I'; },
      fill(x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) g[y][x] = '#'; },
    };
  }
  const at = (x, y) => ({ x: x * TILE + TILE / 2, y: (y + 1) * TILE }); // dno ćelije
  const door = (id, tx, ty, w = 2, h = 4) => ({ id, tx, ty, w, h, x: tx * TILE, y: ty * TILE });

  // ================= ZONA 1: GORNJE ŠPILJE =================
  function zone1() {
    const W = 305, H = 46, G = grid(W, H), { carve, plat, spikes, crumble } = G;
    carve(2, 8, 28, 20); carve(29, 12, 90, 20); carve(86, 21, 89, 24); carve(60, 25, 120, 31);
    carve(100, 23, 110, 24); carve(103, 21, 110, 22); carve(95, 12, 123, 20);
    carve(124, 17, 125, 20, 'D'); carve(126, 12, 162, 20);
    plat(16, 20, 19); plat(22, 26, 17);
    plat(43, 47, 19); plat(48, 52, 17);
    plat(58, 64, 19); plat(66, 70, 17); plat(72, 75, 15);
    plat(95, 98, 30); plat(99, 102, 28); plat(104, 107, 26); plat(108, 110, 24); plat(103, 105, 22); plat(109, 110, 22);
    plat(66, 69, 30);
    plat(129, 133, 19); plat(135, 141, 17); plat(144, 150, 17); plat(153, 156, 19);
    // --- novi dio: Trnovita pukotina ---
    carve(163, 10, 291, 20);
    carve(172, 21, 173, 22); spikes(172, 173, 22);
    carve(180, 21, 185, 22); spikes(180, 185, 22); crumble(182, 183, 21);
    carve(192, 21, 198, 22); spikes(192, 198, 22); plat(189, 192, 19); crumble(194, 196, 18); plat(199, 201, 19);
    carve(220, 21, 224, 35);   // spust u duboku špilju
    plat(221, 223, 21);
    carve(205, 36, 291, 42);   // duboka špilja
    spikes(244, 245, 42); spikes(258, 259, 42); spikes(272, 273, 42);
    carve(284, 21, 290, 35);   // okno gore prema vratima
    [41, 37, 33, 29].forEach(y => plat(285, 286, y)); crumble(285, 286, 25);
    [39, 35, 27].forEach(y => plat(288, 289, y)); crumble(288, 289, 31); plat(288, 290, 23);
    plat(232, 236, 19); plat(262, 266, 19);
    carve(292, 17, 293, 20, 'D'); carve(294, 12, 302, 20);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(7, 20) }, { type: 'note', id: 'N1', ...at(12, 20) }, { type: 'crawler', id: 'b1', ...at(23, 16) },
      { type: 'cabinet', id: 'o1', ...at(38, 20) }, { type: 'battery', id: 'B1', ...at(50, 16) }, { type: 'cabinet', id: 'o2', ...at(54, 20) },
      { type: 'note', id: 'N2', ...at(57, 20) }, { type: 'crawler', id: 'b2', ...at(61, 18) }, { type: 'cabinet', id: 'o3', ...at(67, 20) },
      { type: 'battery', id: 'B5', ...at(73, 14) }, { type: 'cabinet', id: 'o4', ...at(80, 20) }, { type: 'spider', id: 's1', ...at(46, 12) },
      { type: 'key', id: 'K1', ...at(66, 31) }, { type: 'battery', id: 'B6', ...at(67, 29) }, { type: 'note', id: 'N3', ...at(72, 31) },
      { type: 'crawler', id: 'b3', ...at(78, 31) }, { type: 'battery', id: 'B2', ...at(82, 31) }, { type: 'crawler', id: 'b4', ...at(92, 31) },
      { type: 'battery', id: 'B7', ...at(101, 27) }, { type: 'spider', id: 's2', ...at(84, 25) },
      { type: 'battery', id: 'B3', ...at(97, 20) }, { type: 'checkpoint', id: 'C2', ...at(115, 20) }, { type: 'note', id: 'N4', ...at(119, 20) },
      { type: 'cabinet', id: 'o5', ...at(131, 20) }, { type: 'battery', id: 'B4', ...at(138, 16) }, { type: 'crawler', id: 'b5', ...at(147, 16) },
      { type: 'cabinet', id: 'o6', ...at(146, 20) }, { type: 'cabinet', id: 'o7', ...at(158, 20) }, { type: 'spider', id: 's3', ...at(140, 12) },
      // novi dio
      { type: 'note', id: 'N5', ...at(166, 20) }, { type: 'spider', id: 's4', ...at(177, 10) }, { type: 'spider', id: 's5', ...at(188, 10) },
      { type: 'crawler', id: 'b6', ...at(186, 20) }, { type: 'battery', id: 'B8', ...at(190, 18) }, { type: 'spider', id: 's6', ...at(205, 10) },
      { type: 'checkpoint', id: 'C3', ...at(208, 20) },
      { type: 'key', id: 'K2', ...at(207, 42) }, { type: 'note', id: 'N6', ...at(210, 42) }, { type: 'cabinet', id: 'o8', ...at(213, 42) },
      { type: 'checkpoint', id: 'C4', ...at(227, 42) }, { type: 'battery', id: 'B9', ...at(230, 42) },
      { type: 'cabinet', id: 'o9', ...at(236, 42) }, { type: 'cabinet', id: 'o10', ...at(250, 42) }, { type: 'crawler', id: 'b7', ...at(254, 42) },
      { type: 'cabinet', id: 'o11', ...at(265, 42) }, { type: 'cabinet', id: 'o12', ...at(279, 42) }, { type: 'spider', id: 's7', ...at(268, 36) },
      { type: 'battery', id: 'B10', ...at(286, 40) }, { type: 'spider', id: 's8', ...at(279, 10) },
      { type: 'battery', id: 'B11', ...at(234, 18) }, { type: 'crawler', id: 'b8', ...at(250, 20) }, { type: 'battery', id: 'B12', ...at(264, 18) },
      { type: 'exit', id: 'E', ...at(300, 20) },
    ];
    const monsters = [
      { id: 'M1', ...at(72, 20), minX: 31 * TILE, maxX: 84 * TILE, cMin: 29 * TILE + 8, cMax: 86 * TILE - 6 },
      { id: 'M2', ...at(61, 31), minX: 60 * TILE + 10, maxX: 119 * TILE, cMin: 60 * TILE + 8, cMax: 121 * TILE - 8, dormant: 'K1' },
      { id: 'M3', ...at(150, 20), minX: 127 * TILE, maxX: 159 * TILE, cMin: 126 * TILE + 8, cMax: 171 * TILE },
      { id: 'M4', ...at(262, 42), minX: 240 * TILE, maxX: 282 * TILE, cMin: 205 * TILE + 8, cMax: 291 * TILE },
      { id: 'M5', ...at(233, 42), minX: 206 * TILE, maxX: 236 * TILE, cMin: 205 * TILE + 8, cMax: 291 * TILE, dormant: 'K2' },
    ];
    return {
      theme: 'spilje', W, H, grid: G.g, objects, monsters, doors: [door('D1', 124, 17), door('D2', 292, 17)], start: at(4, 20),
      notes: {
        N1: 'Ako ovo čitaš, i ti si propao kroz pukotinu.\n\nSvjetiljka pomaže… ali ONO voli svjetlo.\nI sluša korake. Hodaj polako — samo malo pomakni palac.\nKad čuješ teške korake, ugasi svjetlo i sakrij se.',
        N2: 'Brojao sam mu korake.\nSto dvadeset.\nOnda je stao.\n\nIspred mog ormara.\nVidio me kako ulazim.',
        N3: 'Ne diraj ključ.\nKljuč je njegov.\n\nKad ga uzmeš, probudit će se onaj koji spava u zidu.',
        N4: 'Iza vrata nije izlaz.\nIza vrata je samo dublje.',
        N5: 'Pod je ovdje lažan. Daske pucaju čim ih dotakneš.\nIspod su šiljci.\n\nNe stoj na mjestu.',
        N6: 'Drugi ključ. Rekao sam si da ga neću dirati.\n\nAli bez njega nema izlaza.\nA ONI već znaju da sam tu.',
      },
    };
  }

  // ================= ZONA 2: KRISTALNI RUDNIK =================
  function zone2() {
    const W = 262, H = 44, G = grid(W, H), { carve, plat, spikes, crumble } = G;
    carve(2, 6, 22, 14);
    carve(23, 8, 70, 14);
    carve(66, 15, 69, 23);
    carve(30, 24, 124, 31);
    carve(100, 4, 112, 23);
    carve(113, 4, 118, 7);
    carve(125, 28, 126, 31, 'D');
    carve(127, 24, 146, 31);
    plat(14, 18, 12);
    plat(30, 34, 13); plat(37, 41, 11); plat(52, 56, 13);
    plat(42, 46, 30);
    [30, 26, 22, 18, 14, 10].forEach(y => plat(101, 105, y));
    [28, 24, 20, 16, 12].forEach(y => plat(106, 110, y));
    plat(106, 112, 8);
    // --- novi dio: Urušeni hodnici ---
    carve(147, 22, 200, 31);
    carve(160, 32, 175, 40); spikes(160, 175, 40);
    crumble(162, 164, 32); crumble(167, 169, 32); crumble(172, 174, 32);
    carve(201, 24, 240, 31);
    carve(214, 10, 220, 23);
    [30, 26, 18, 14].forEach(y => plat(215, 216, y)); crumble(215, 216, 22);
    [28, 24, 20].forEach(y => plat(218, 219, y)); crumble(218, 219, 16); plat(218, 220, 12);
    carve(221, 7, 236, 11); spikes(226, 227, 11);
    plat(186, 190, 30); plat(192, 195, 28);
    carve(241, 28, 242, 31, 'D'); carve(243, 24, 256, 31);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 14) }, { type: 'note', id: 'N1', ...at(10, 14) },
      { type: 'battery', id: 'B1', ...at(32, 12) }, { type: 'bat', id: 'w1', ...at(36, 8) }, { type: 'bat', id: 'w2', ...at(47, 8) },
      { type: 'crawler', id: 'b1', ...at(50, 14) }, { type: 'bat', id: 'w3', ...at(59, 8) }, { type: 'battery', id: 'B2', ...at(54, 12) },
      { type: 'spider', id: 's1', ...at(42, 8) }, { type: 'crawler', id: 'b5', ...at(28, 14) },
      { type: 'battery', id: 'B3', ...at(40, 31) }, { type: 'battery', id: 'B8', ...at(44, 29) }, { type: 'crawler', id: 'b2', ...at(47, 31) }, { type: 'note', id: 'N2', ...at(52, 31) },
      { type: 'checkpoint', id: 'C2', ...at(60, 31) }, { type: 'spider', id: 's2', ...at(72, 24) },
      { type: 'cabinet', id: 'o1', ...at(79, 31) }, { type: 'cabinet', id: 'o2', ...at(91, 31) },
      { type: 'battery', id: 'B4', ...at(102, 17) }, { type: 'bat', id: 'w4', ...at(105, 19) }, { type: 'bat', id: 'w5', ...at(106, 12) },
      { type: 'battery', id: 'B5', ...at(109, 11) }, { type: 'spider', id: 's3', ...at(108, 4) },
      { type: 'note', id: 'N3', ...at(114, 7) }, { type: 'key', id: 'K1', ...at(117, 7) },
      { type: 'cabinet', id: 'o3', ...at(116, 31) }, { type: 'cabinet', id: 'o4', ...at(122, 31) },
      { type: 'note', id: 'N4', ...at(131, 31) }, { type: 'battery', id: 'B6', ...at(134, 31) },
      // novi dio
      { type: 'bat', id: 'w6', ...at(163, 22) }, { type: 'bat', id: 'w7', ...at(171, 22) }, { type: 'battery', id: 'B9', ...at(150, 31) },
      { type: 'checkpoint', id: 'C3', ...at(180, 31) },
      { type: 'cabinet', id: 'o5', ...at(184, 31) }, { type: 'battery', id: 'B10', ...at(188, 29) }, { type: 'cabinet', id: 'o6', ...at(204, 31) },
      { type: 'battery', id: 'B11', ...at(194, 27) }, { type: 'spider', id: 's4', ...at(199, 22) }, { type: 'crawler', id: 'b3', ...at(208, 31) },
      { type: 'cabinet', id: 'o7', ...at(226, 31) }, { type: 'cabinet', id: 'o8', ...at(236, 31) },
      { type: 'spider', id: 's5', ...at(217, 10) }, { type: 'bat', id: 'w8', ...at(217, 18) }, { type: 'battery', id: 'B12', ...at(216, 21) },
      { type: 'battery', id: 'B13', ...at(224, 11) }, { type: 'crawler', id: 'b4', ...at(230, 11) }, { type: 'key', id: 'K2', ...at(234, 11) },
      { type: 'note', id: 'N5', ...at(247, 31) }, { type: 'exit', id: 'E', ...at(254, 31) },
    ];
    const monsters = [
      { id: 'M1', ...at(86, 31), minX: 76 * TILE, maxX: 97 * TILE, cMin: 30 * TILE + 8, cMax: 124 * TILE + 8 },
      { id: 'M2', ...at(120, 31), minX: 113 * TILE, maxX: 123 * TILE, cMin: 100 * TILE, cMax: 124 * TILE + 8, dormant: 'K1' },
      { id: 'M3', ...at(200, 31), minX: 184 * TILE, maxX: 212 * TILE, cMin: 176 * TILE, cMax: 240 * TILE + 8 },
      { id: 'M4', ...at(238, 31), minX: 222 * TILE, maxX: 239 * TILE, cMin: 176 * TILE, cMax: 240 * TILE + 8, dormant: 'K2' },
    ];
    return {
      theme: 'rudnik', W, H, grid: G.g, objects, monsters, doors: [door('D1', 125, 28), door('D2', 241, 28)], start: at(4, 14),
      notes: {
        N1: 'Rudari su kopali kristale koji svijetle sami od sebe.\n\nPrestali su kopati kad su iz zida čuli pjevanje.',
        N2: 'Šišmiši ovdje ne vide ništa.\nAli osjete toplinu svjetla.\n\nKad ih je previše — ugasi svjetiljku.',
        N3: 'Ključ je stavljen gore, u nišu, da ga nitko ne dohvati.\n\nIspod, kod vrata, netko ga čeka da se vrati.',
        N4: 'Dalje se hodnik urušio u jamu punu kristalnih šiljaka.\nPreko su ostale samo trule daske.\n\nI šišmiši. Uvijek šišmiši.',
        N5: 'Kristali dublje dolje ne svijetle.\n\nTamo je voda.',
      },
    };
  }

  // ================= ZONA 3: POTOPLJENE DUBINE =================
  function zone3() {
    const W = 256, H = 34, G = grid(W, H), { carve, plat, spikes, crumble } = G;
    carve(2, 10, 20, 20);
    carve(21, 10, 82, 20);
    carve(30, 21, 40, 21, '~'); carve(50, 21, 57, 21, '~'); carve(64, 21, 70, 21, '~');
    carve(76, 21, 80, 24);
    carve(22, 25, 80, 29);
    carve(31, 29, 46, 29, '~'); carve(52, 29, 66, 29, '~');
    carve(83, 17, 84, 20, 'D');
    carve(85, 12, 149, 20);
    carve(93, 21, 101, 21, '~'); carve(110, 21, 119, 21, '~');
    plat(29, 33, 19); plat(35, 41, 17); plat(49, 53, 19); plat(63, 67, 19);
    plat(76, 77, 28); plat(79, 80, 26); plat(76, 77, 24); plat(79, 80, 22);
    plat(92, 96, 19); plat(98, 102, 17); plat(109, 112, 19); plat(114, 120, 17);
    spikes(127, 128, 20); spikes(138, 139, 20);
    // --- novi dio: uz slap i gornja galerija ---
    carve(150, 3, 161, 20);
    plat(151, 153, 19); plat(155, 157, 17); crumble(151, 153, 15); plat(155, 157, 13); plat(159, 161, 11); plat(158, 161, 9);
    carve(162, 3, 245, 8);
    carve(175, 9, 182, 9, '~'); carve(200, 9, 210, 9, '~');
    plat(176, 180, 7); crumble(201, 203, 7); plat(206, 208, 7);
    carve(214, 9, 220, 12); spikes(216, 217, 12); plat(214, 215, 11); plat(219, 220, 11);
    spikes(188, 189, 8); spikes(230, 231, 8);
    carve(246, 5, 247, 8, 'D'); carve(248, 3, 254, 8);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 20) }, { type: 'note', id: 'N1', ...at(10, 20) },
      { type: 'battery', id: 'B1', ...at(38, 16) }, { type: 'crawler', id: 'b1', ...at(45, 20) }, { type: 'spider', id: 's1', ...at(26, 10) },
      { type: 'cabinet', id: 'o1', ...at(47, 20) }, { type: 'cabinet', id: 'o2', ...at(61, 20) }, { type: 'cabinet', id: 'o3', ...at(73, 20) },
      { type: 'battery', id: 'B2', ...at(65, 18) }, { type: 'spider', id: 's2', ...at(58, 10) },
      { type: 'key', id: 'K1', ...at(24, 29) }, { type: 'note', id: 'N3', ...at(27, 29) }, { type: 'cabinet', id: 'o4', ...at(29, 29) },
      { type: 'battery', id: 'B3', ...at(49, 29) }, { type: 'cabinet', id: 'o5', ...at(48, 29) }, { type: 'crawler', id: 'b4', ...at(40, 29) },
      { type: 'cabinet', id: 'o6', ...at(68, 29) }, { type: 'crawler', id: 'b2', ...at(71, 29) }, { type: 'battery', id: 'B4', ...at(73, 29) },
      { type: 'checkpoint', id: 'C2', ...at(88, 20) }, { type: 'note', id: 'N2', ...at(91, 20) },
      { type: 'cabinet', id: 'o7', ...at(105, 20) }, { type: 'battery', id: 'B5', ...at(100, 16) }, { type: 'crawler', id: 'b3', ...at(117, 16) },
      { type: 'cabinet', id: 'o8', ...at(122, 20) }, { type: 'cabinet', id: 'o9', ...at(133, 20) }, { type: 'spider', id: 's3', ...at(125, 12) },
      { type: 'note', id: 'N4', ...at(144, 20) }, { type: 'battery', id: 'B6', ...at(146, 20) },
      // novi dio
      { type: 'spider', id: 's4', ...at(153, 3) }, { type: 'spider', id: 's5', ...at(158, 3) }, { type: 'battery', id: 'B7', ...at(156, 12) },
      { type: 'checkpoint', id: 'C3', ...at(164, 8) },
      { type: 'cabinet', id: 'o10', ...at(171, 8) }, { type: 'crawler', id: 'b5', ...at(185, 8) }, { type: 'cabinet', id: 'o11', ...at(192, 8) },
      { type: 'spider', id: 's6', ...at(195, 3) }, { type: 'battery', id: 'B8', ...at(178, 6) }, { type: 'battery', id: 'B9', ...at(207, 6) },
      { type: 'cabinet', id: 'o12', ...at(211, 8) }, { type: 'key', id: 'K2', ...at(218, 12) }, { type: 'spider', id: 's7', ...at(222, 3) },
      { type: 'cabinet', id: 'o13', ...at(228, 8) }, { type: 'crawler', id: 'b6', ...at(236, 8) }, { type: 'cabinet', id: 'o14', ...at(241, 8) },
      { type: 'note', id: 'N5', ...at(250, 8) }, { type: 'exit', id: 'E', ...at(252, 8) },
    ];
    const monsters = [
      { id: 'M1', ...at(60, 20), minX: 44 * TILE, maxX: 74 * TILE, cMin: 21 * TILE + 8, cMax: 76 * TILE - 8 },
      { id: 'M2', ...at(75, 29), minX: 22 * TILE + 10, maxX: 79 * TILE, cMin: 22 * TILE + 8, cMax: 80 * TILE, dormant: 'K1' },
      { id: 'M3', ...at(125, 20), minX: 100 * TILE, maxX: 136 * TILE, cMin: 85 * TILE + 8, cMax: 149 * TILE },
      { id: 'M4', ...at(195, 8), minX: 168 * TILE, maxX: 212 * TILE, cMin: 162 * TILE + 8, cMax: 245 * TILE + 8 },
      { id: 'M5', ...at(240, 8), minX: 222 * TILE, maxX: 244 * TILE, cMin: 162 * TILE + 8, cMax: 245 * TILE + 8, dormant: 'K2' },
    ];
    return {
      theme: 'dubine', W, H, grid: G.g, objects, monsters, doors: [door('D1', 83, 17), door('D2', 246, 5)], start: at(4, 20),
      notes: {
        N1: 'Voda pamti korake.\n\nSvaki pljusak čuje se do kraja špilje — i on ga čuje.\nKad možeš, idi preko dasaka.',
        N2: 'Vrata su se otvorila.\nZnači da si ga našao. Ključ.\n\nI znači da te ON sad traži.',
        N3: 'Netko je ključ bacio na samo dno, u najdublji kut.\n\nKad ga podigneš, voda će zadrhtati.',
        N4: 'Gore, uz slap, ima još jedna dvorana.\nDaske su ondje trule.\n\nI pauci se spuštaju kad prođeš ispod njih.',
        N5: 'Ispod vode je nešto što gori.\nOsjećam miris dima.\n\nKosti. Svuda kosti.',
      },
    };
  }

  // ================= ZONA 4: KOSTURNICA =================
  function zone4() {
    const W = 290, H = 40, G = grid(W, H), { carve, plat, spikes, crumble } = G;
    carve(2, 6, 100, 13);
    carve(88, 14, 91, 17);
    carve(18, 18, 150, 24);
    carve(151, 21, 152, 24, 'D');
    carve(20, 25, 23, 28);
    carve(140, 25, 148, 28);
    carve(10, 29, 150, 35);
    plat(20, 24, 12); plat(34, 38, 12); plat(56, 60, 12); plat(72, 76, 12);
    plat(30, 34, 23); plat(60, 64, 23); plat(104, 108, 23); plat(120, 124, 23);
    plat(141, 143, 34); plat(145, 147, 32); plat(141, 143, 30); plat(145, 147, 28); plat(146, 148, 26);
    plat(50, 54, 34); plat(84, 88, 34); plat(116, 120, 34);
    spikes(46, 47, 13); spikes(66, 67, 35); spikes(98, 99, 35);
    // --- novi dio: Grobnica ---
    carve(153, 18, 269, 24);
    spikes(165, 166, 24); spikes(172, 173, 24);
    carve(180, 25, 186, 30); spikes(180, 186, 30); crumble(181, 183, 25); crumble(185, 186, 25);
    carve(229, 25, 233, 31);
    carve(205, 32, 262, 36);
    spikes(222, 223, 36); spikes(238, 239, 36);
    carve(252, 25, 258, 31);
    plat(253, 254, 35); plat(256, 257, 33); plat(253, 254, 31); crumble(256, 257, 29); plat(256, 258, 27);
    plat(198, 202, 23); plat(212, 216, 23);
    carve(270, 21, 271, 24, 'D'); carve(272, 18, 282, 24);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 13) }, { type: 'note', id: 'N1', ...at(10, 13) },
      { type: 'battery', id: 'B1', ...at(36, 11) }, { type: 'bat', id: 'w1', ...at(42, 7) }, { type: 'crawler', id: 'b1', ...at(50, 13) },
      { type: 'bat', id: 'w2', ...at(65, 7) }, { type: 'battery', id: 'B2', ...at(74, 11) }, { type: 'bat', id: 'w3', ...at(82, 7) },
      { type: 'spider', id: 's1', ...at(28, 6) }, { type: 'spider', id: 's2', ...at(58, 6) },
      { type: 'checkpoint', id: 'C2', ...at(84, 24) }, { type: 'note', id: 'N2', ...at(80, 24) },
      { type: 'battery', id: 'B3', ...at(32, 22) }, { type: 'crawler', id: 'b2', ...at(55, 24) }, { type: 'bat', id: 'w4', ...at(46, 19) }, { type: 'bat', id: 'w5', ...at(70, 19) },
      { type: 'cabinet', id: 'o1', ...at(99, 24) }, { type: 'cabinet', id: 'o2', ...at(112, 24) }, { type: 'cabinet', id: 'o3', ...at(127, 24) },
      { type: 'battery', id: 'B4', ...at(106, 22) }, { type: 'spider', id: 's3', ...at(118, 18) },
      { type: 'checkpoint', id: 'C3', ...at(14, 35) },
      { type: 'bat', id: 'w6', ...at(40, 30) }, { type: 'crawler', id: 'b3', ...at(58, 35) }, { type: 'battery', id: 'B5', ...at(52, 33) },
      { type: 'cabinet', id: 'o4', ...at(70, 35) }, { type: 'bat', id: 'w7', ...at(78, 30) }, { type: 'crawler', id: 'b4', ...at(92, 35) },
      { type: 'battery', id: 'B6', ...at(86, 33) }, { type: 'cabinet', id: 'o5', ...at(104, 35) }, { type: 'bat', id: 'w8', ...at(112, 30) },
      { type: 'battery', id: 'B7', ...at(118, 33) }, { type: 'cabinet', id: 'o6', ...at(131, 35) }, { type: 'spider', id: 's4', ...at(125, 29) },
      { type: 'note', id: 'N3', ...at(136, 35) }, { type: 'key', id: 'K1', ...at(146, 35) },
      { type: 'note', id: 'N4', ...at(155, 24) },
      // novi dio
      { type: 'battery', id: 'B8', ...at(160, 24) }, { type: 'spider', id: 's5', ...at(169, 18) }, { type: 'bat', id: 'w9', ...at(183, 19) },
      { type: 'checkpoint', id: 'C4', ...at(190, 24) },
      { type: 'cabinet', id: 'o7', ...at(196, 24) }, { type: 'battery', id: 'B9', ...at(200, 22) }, { type: 'spider', id: 's6', ...at(206, 18) },
      { type: 'cabinet', id: 'o8', ...at(208, 24) }, { type: 'battery', id: 'B10', ...at(214, 22) }, { type: 'spider', id: 's7', ...at(218, 18) },
      { type: 'cabinet', id: 'o9', ...at(222, 24) }, { type: 'crawler', id: 'b5', ...at(226, 24) },
      { type: 'key', id: 'K2', ...at(207, 36) }, { type: 'note', id: 'N5', ...at(210, 36) }, { type: 'cabinet', id: 'o10', ...at(215, 36) },
      { type: 'crawler', id: 'b6', ...at(226, 36) }, { type: 'cabinet', id: 'o11', ...at(231, 36) }, { type: 'bat', id: 'w10', ...at(236, 32) },
      { type: 'cabinet', id: 'o12', ...at(246, 36) }, { type: 'battery', id: 'B11', ...at(244, 36) }, { type: 'spider', id: 's8', ...at(244, 32) },
      { type: 'note', id: 'N6', ...at(276, 24) }, { type: 'exit', id: 'E', ...at(280, 24) },
    ];
    const monsters = [
      { id: 'M1', ...at(115, 24), minX: 95 * TILE, maxX: 135 * TILE, cMin: 18 * TILE + 8, cMax: 140 * TILE - 6 },
      { id: 'M2', ...at(126, 35), minX: 100 * TILE, maxX: 139 * TILE, cMin: 10 * TILE + 8, cMax: 150 * TILE + 8, dormant: 'K1' },
      { id: 'M3', ...at(212, 24), minX: 192 * TILE, maxX: 226 * TILE, cMin: 153 * TILE + 8, cMax: 228 * TILE },
      { id: 'M4', ...at(250, 36), minX: 230 * TILE, maxX: 261 * TILE, cMin: 205 * TILE + 8, cMax: 262 * TILE + 8, dormant: 'K2' },
    ];
    return {
      theme: 'kosturnica', W, H, grid: G.g, objects, monsters, doors: [door('D1', 151, 21), door('D2', 270, 21)], start: at(4, 13), lightsOutKey: 'K2',
      notes: {
        N1: 'Ovdje leže svi koji su ga pokušali nadmudriti.\n\nSvijeće gore za njih.\nNe pitaj tko ih pali.',
        N2: 'Na srednjem katu hoda on.\nDolje spavaju drugi.\n\nKljuč za vrata leži na samom dnu.',
        N3: 'Ovaj ključ budi onoga koji spava dolje.\n\nTrči. Gore, desno, prema vratima.\nNe gledaj iza sebe.',
        N4: 'Mislio sam da je ovo kraj.\nNije.\n\nPosljednji ključ je u kripti ispod grobnice.',
        N5: 'Kad uzmeš ovaj ključ, sve će se svijeće ugasiti.\n\nTrči. Gore, desno.\nVrata su blizu.',
        N6: 'Mislio sam da je iza ovih vrata nebo.\nNije.\n\nPodzemlje ide još dublje.',
      },
    };
  }


  // ================= ZONA 5: GLJIVARNIK =================
  function zone5() {
    const W = 195, H = 44, G = grid(W, H), { carve, plat, spikes, crumble, bounce, fill } = G;
    carve(2, 30, 20, 40);            // ulaz
    carve(21, 22, 110, 40);          // gljivarnik
    bounce(40, 41, 41);
    plat(34, 46, 33); plat(48, 54, 31); plat(57, 62, 33); plat(64, 70, 31);
    plat(72, 78, 33); bounce(75, 75, 33);
    plat(70, 80, 25);
    spikes(88, 89, 40);
    carve(111, 37, 112, 40, 'D');
    carve(113, 6, 175, 40);          // divovska špilja gljiva
    bounce(120, 120, 41);
    plat(117, 125, 33); bounce(124, 124, 33);
    plat(121, 130, 25); bounce(128, 128, 25); crumble(121, 122, 25);
    plat(125, 134, 17); bounce(126, 126, 17);
    plat(118, 128, 9);
    fill(113, 9, 117, 12);
    plat(132, 137, 9); crumble(140, 142, 9); plat(145, 150, 9);
    fill(152, 10, 175, 12);
    spikes(146, 147, 40); spikes(160, 161, 40);
    carve(176, 6, 177, 9, 'D'); carve(178, 4, 190, 9);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 40) }, { type: 'note', id: 'N1', ...at(10, 40) },
      { type: 'crawler', id: 'b1', ...at(28, 40) }, { type: 'checkpoint', id: 'C2', ...at(35, 40) },
      { type: 'battery', id: 'B1', ...at(44, 32) }, { type: 'spider', id: 's1', ...at(51, 22) }, { type: 'note', id: 'N2', ...at(60, 32) },
      { type: 'spider', id: 's2', ...at(67, 22) }, { type: 'battery', id: 'B2', ...at(73, 24) }, { type: 'key', id: 'K1', ...at(78, 24) },
      { type: 'cabinet', id: 'o1', ...at(50, 40) }, { type: 'cabinet', id: 'o2', ...at(66, 40) }, { type: 'cabinet', id: 'o3', ...at(84, 40) },
      { type: 'cabinet', id: 'o4', ...at(98, 40) }, { type: 'crawler', id: 'b2', ...at(93, 40) }, { type: 'battery', id: 'B3', ...at(104, 40) },
      { type: 'bat', id: 'w1', ...at(90, 23) },
      // divovska špilja
      { type: 'checkpoint', id: 'C3', ...at(115, 40) }, { type: 'note', id: 'N3', ...at(117, 40) },
      { type: 'crawler', id: 'b3', ...at(140, 40) }, { type: 'battery', id: 'B4', ...at(150, 40) }, { type: 'crawler', id: 'b4', ...at(165, 40) },
      { type: 'battery', id: 'B5', ...at(118, 32) }, { type: 'spider', id: 's3', ...at(123, 6) }, { type: 'spider', id: 's4', ...at(131, 6) },
      { type: 'bat', id: 'w2', ...at(140, 20) }, { type: 'bat', id: 'w3', ...at(150, 14) }, { type: 'battery', id: 'B6', ...at(130, 16) },
      { type: 'key', id: 'K2', ...at(114, 8) }, { type: 'battery', id: 'B7', ...at(116, 8) },
      { type: 'battery', id: 'B8', ...at(135, 8) }, { type: 'spider', id: 's5', ...at(147, 6) },
      { type: 'cabinet', id: 'o5', ...at(158, 9) }, { type: 'cabinet', id: 'o6', ...at(170, 9) },
      { type: 'note', id: 'N4', ...at(181, 9) }, { type: 'exit', id: 'E', ...at(188, 9) },
    ];
    const monsters = [
      { id: 'M1', ...at(75, 40), minX: 45 * TILE, maxX: 100 * TILE, cMin: 21 * TILE + 8, cMax: 110 * TILE },
      { id: 'M2', ...at(104, 40), minX: 95 * TILE, maxX: 109 * TILE, cMin: 21 * TILE + 8, cMax: 110 * TILE, dormant: 'K1' },
      { id: 'M3', ...at(165, 9), minX: 155 * TILE, maxX: 174 * TILE, cMin: 152 * TILE + 8, cMax: 175 * TILE + 8 },
    ];
    return {
      theme: 'gljive', W, H, grid: G.g, objects, monsters, doors: [door('D1', 111, 37), door('D2', 176, 6)], start: at(4, 40),
      notes: {
        N1: 'Ovdje rastu gljive koje bacaju u zrak.\nStani na crveni klobuk i odletjet ćeš.\n\nAli on čuje kad padneš.',
        N2: 'Gore, na najvišem klobuku, netko je ostavio ključ.\n\nZašto ga uvijek ostavljaju tako visoko?',
        N3: 'Ova špilja nema stropa koji se vidi.\nGljive rastu jedna iznad druge, sve do vrha.',
        N4: 'Iza gljiva je hladno.\nSve hladnije.\n\nDah mi se pretvara u maglu.',
      },
    };
  }

  // ================= ZONA 6: LEDENA PEĆINA =================
  function zone6() {
    const W = 220, H = 38, G = grid(W, H), { carve, plat, spikes, crumble, ice } = G;
    carve(2, 14, 18, 24);            // ulaz
    carve(19, 12, 100, 24);          // ledena dvorana
    ice(28, 44, 25); spikes(45, 46, 24); ice(63, 75, 25);
    plat(52, 56, 23); plat(78, 82, 23);
    carve(96, 25, 100, 27);          // rupa prema ledenoj rijeci
    carve(30, 28, 125, 33);          // ledena rijeka
    ice(40, 110, 34); spikes(60, 61, 33); spikes(85, 86, 33);
    carve(121, 14, 125, 27);         // okno gore
    plat(121, 122, 32); plat(124, 125, 30); plat(121, 122, 28); plat(124, 125, 26);
    carve(126, 12, 200, 24);         // druga dvorana
    carve(128, 21, 129, 24, 'D');
    ice(136, 150, 25); carve(151, 25, 153, 27); spikes(151, 153, 27);
    carve(160, 4, 172, 11);          // ledeni toranj
    [23, 15, 11].forEach(y => plat(160, 162, y)); crumble(160, 162, 19);
    [21, 17, 13].forEach(y => plat(164, 166, y)); plat(164, 170, 9);
    ice(176, 190, 25);
    carve(201, 21, 202, 24, 'D'); carve(203, 14, 215, 24);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 24) }, { type: 'note', id: 'N1', ...at(10, 24) },
      { type: 'icicle', id: 'i1', ...at(32, 12) }, { type: 'icicle', id: 'i2', ...at(38, 12) }, { type: 'battery', id: 'B1', ...at(54, 22) },
      { type: 'cabinet', id: 'o1', ...at(50, 24) }, { type: 'icicle', id: 'i3', ...at(58, 12) }, { type: 'icicle', id: 'i4', ...at(68, 12) },
      { type: 'cabinet', id: 'o2', ...at(70, 24) }, { type: 'battery', id: 'B2', ...at(80, 22) }, { type: 'icicle', id: 'i5', ...at(84, 12) },
      { type: 'cabinet', id: 'o3', ...at(87, 24) }, { type: 'crawler', id: 'b1', ...at(57, 24) },
      // ledena rijeka
      { type: 'key', id: 'K1', ...at(32, 33) }, { type: 'cabinet', id: 'o4', ...at(36, 33) }, { type: 'battery', id: 'B3', ...at(38, 33) },
      { type: 'icicle', id: 'i6', ...at(50, 28) }, { type: 'cabinet', id: 'o5', ...at(70, 33) }, { type: 'icicle', id: 'i7', ...at(75, 28) },
      { type: 'crawler', id: 'b2', ...at(78, 33) }, { type: 'icicle', id: 'i8', ...at(92, 28) },
      { type: 'checkpoint', id: 'C2', ...at(104, 33) }, { type: 'note', id: 'N2', ...at(106, 33) }, { type: 'cabinet', id: 'o6', ...at(100, 33) },
      { type: 'battery', id: 'B4', ...at(124, 29) },
      // druga dvorana
      { type: 'checkpoint', id: 'C3', ...at(132, 24) }, { type: 'note', id: 'N3', ...at(134, 24) },
      { type: 'icicle', id: 'i9', ...at(140, 12) }, { type: 'icicle', id: 'i10', ...at(146, 12) },
      { type: 'battery', id: 'B5', ...at(161, 18) }, { type: 'icicle', id: 'i11', ...at(163, 4) }, { type: 'icicle', id: 'i12', ...at(167, 4) },
      { type: 'battery', id: 'B6', ...at(165, 12) }, { type: 'key', id: 'K2', ...at(169, 8) }, { type: 'bat', id: 'w1', ...at(164, 6) },
      { type: 'cabinet', id: 'o7', ...at(178, 24) }, { type: 'icicle', id: 'i13', ...at(184, 12) }, { type: 'cabinet', id: 'o8', ...at(193, 24) },
      { type: 'crawler', id: 'b3', ...at(186, 24) },
      { type: 'note', id: 'N4', ...at(208, 24) }, { type: 'exit', id: 'E', ...at(213, 24) },
    ];
    const monsters = [
      { id: 'M1', ...at(80, 24), minX: 64 * TILE, maxX: 94 * TILE, cMin: 47 * TILE, cMax: 95 * TILE },
      { id: 'M2', ...at(118, 33), minX: 100 * TILE, maxX: 124 * TILE, cMin: 30 * TILE + 8, cMax: 125 * TILE, dormant: 'K1' },
      { id: 'M3', ...at(185, 24), minX: 175 * TILE, maxX: 198 * TILE, cMin: 154 * TILE, cMax: 200 * TILE + 8 },
      { id: 'M4', ...at(199, 24), minX: 190 * TILE, maxX: 200 * TILE, cMin: 154 * TILE, cMax: 200 * TILE + 8, dormant: 'K2' },
    ];
    return {
      theme: 'led', W, H, grid: G.g, objects, monsters, doors: [door('D1', 128, 21), door('D2', 201, 21)], start: at(4, 24),
      notes: {
        N1: 'Led je sklizak. Kad potrčiš, ne možeš odmah stati.\n\nA na kraju leda su šiljci.',
        N2: 'Ledenice padaju kad prođeš ispod.\nSlušaj kako pucaju — onda bježi.',
        N3: 'Drugi ključ visi na vrhu ledenog tornja.\nTamo gore ništa ne živi.\nOsim njih.',
        N4: 'Toplo je odjednom.\nPreviše toplo.\n\nZidovi su meki i dišu.',
      },
    };
  }

  // ================= ZONA 7: GNIJEZDO =================
  function zone7() {
    const W = 262, H = 42, G = grid(W, H), { carve, plat, spikes, crumble, fill } = G;
    carve(2, 20, 18, 30);            // ulaz
    carve(19, 19, 100, 30);          // tuneli gnijezda
    carve(21, 8, 30, 18);            // uspon
    carve(31, 8, 55, 17);            // komora s ključem
    [29, 25, 21].forEach(y => plat(22, 25, y)); [27, 23, 19].forEach(y => plat(27, 30, y));
    spikes(38, 39, 17); spikes(46, 47, 17);
    carve(60, 31, 66, 34); spikes(60, 66, 34); crumble(61, 63, 31); crumble(65, 66, 31);
    carve(101, 27, 102, 30, 'D');
    carve(103, 19, 248, 30);         // posljednji hodnik
    carve(140, 31, 143, 34);         // spust
    carve(118, 35, 170, 38);         // donja komora (ključ)
    spikes(132, 133, 38); spikes(152, 153, 38);
    carve(165, 31, 169, 34);         // uspon natrag
    plat(165, 166, 37); plat(168, 169, 35); plat(168, 169, 33);
    spikes(178, 179, 30);
    carve(188, 31, 194, 33); spikes(188, 194, 33); crumble(189, 191, 31); crumble(193, 194, 31);
    spikes(205, 206, 30);
    fill(214, 19, 222, 27);          // niski prolaz
    spikes(232, 233, 30);
    carve(249, 27, 250, 30, 'D'); carve(251, 22, 258, 30);
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 30) }, { type: 'note', id: 'N1', ...at(10, 30) },
      { type: 'checkpoint', id: 'C2', ...at(33, 30) }, { type: 'battery', id: 'B1', ...at(23, 28) }, { type: 'spider', id: 's0', ...at(26, 8) },
      { type: 'note', id: 'N2', ...at(34, 17) }, { type: 'spider', id: 's1', ...at(36, 8) }, { type: 'battery', id: 'B2', ...at(42, 17) },
      { type: 'spider', id: 's2', ...at(44, 8) }, { type: 'spider', id: 's3', ...at(50, 8) }, { type: 'key', id: 'K1', ...at(53, 17) },
      { type: 'cabinet', id: 'o0', ...at(45, 30) }, { type: 'crawler', id: 'b1', ...at(50, 30) },
      { type: 'cabinet', id: 'o1', ...at(72, 30) }, { type: 'bat', id: 'w1', ...at(80, 20) }, { type: 'cabinet', id: 'o2', ...at(84, 30) },
      { type: 'crawler', id: 'b2', ...at(90, 30) }, { type: 'cabinet', id: 'o3', ...at(96, 30) }, { type: 'battery', id: 'B3', ...at(68, 30) },
      // posljednji hodnik
      { type: 'checkpoint', id: 'C3', ...at(106, 30) }, { type: 'note', id: 'N3', ...at(108, 30) },
      { type: 'cabinet', id: 'o4', ...at(112, 30) }, { type: 'cabinet', id: 'o5', ...at(124, 30) }, { type: 'cabinet', id: 'o6', ...at(134, 30) },
      { type: 'spider', id: 's4', ...at(128, 19) }, { type: 'battery', id: 'B4', ...at(118, 30) },
      { type: 'key', id: 'K2', ...at(120, 38) }, { type: 'note', id: 'N4', ...at(123, 38) }, { type: 'checkpoint', id: 'C4', ...at(146, 38) },
      { type: 'battery', id: 'B5', ...at(148, 38) }, { type: 'crawler', id: 'b3', ...at(158, 38) },
      { type: 'bat', id: 'w2', ...at(185, 20) }, { type: 'spider', id: 's5', ...at(200, 19) }, { type: 'battery', id: 'B6', ...at(210, 30) },
      { type: 'spider', id: 's6', ...at(228, 19) }, { type: 'crawler', id: 'b4', ...at(240, 30) },
      { type: 'note', id: 'N5', ...at(253, 30) }, { type: 'exit', id: 'E', ...at(256, 30) },
    ];
    const monsters = [
      { id: 'M1', ...at(85, 30), minX: 70 * TILE, maxX: 98 * TILE, cMin: 67 * TILE + 8, cMax: 100 * TILE + 8 },
      { id: 'M2', ...at(56, 30), minX: 34 * TILE, maxX: 58 * TILE, cMin: 19 * TILE + 8, cMax: 59 * TILE, dormant: 'K1' },
      { id: 'M3', ...at(125, 30), minX: 110 * TILE, maxX: 137 * TILE, cMin: 103 * TILE + 8, cMax: 139 * TILE },
    ];
    return {
      theme: 'gnijezdo', W, H, grid: G.g, objects, monsters, doors: [door('D1', 101, 27), door('D2', 249, 27)], start: at(4, 30),
      darkWall: { key: 'K2', startX: 118 * TILE - 280, stopX: 249 * TILE - 30, speed: 88 },
      notes: {
        N1: 'Ovo je njihovo gnijezdo.\nOdavde dolaze svi.\n\nNe budi jaja.',
        N2: 'Ključ je na kraju ove komore.\nA dolje, kod rupe, nešto se valja u snu.',
        N3: 'Zadnja vrata. Zadnji ključ.\nLeži u komori ispod hodnika.\n\nKad ga uzmeš, tama će krenuti za tobom.\nNe staj.',
        N4: 'Ovdje je sve počelo.\n\nTRČI.',
        N5: 'Svjetlo.\nPravo svjetlo.\n\nIdi.',
      },
    };
  }

  const ZONES = [zone1, zone2, zone3, zone4, zone5, zone6, zone7];
  // svjetovi igre Noćnik — zone su redom, svijet je skupina zona
  const WORLDS = [
    { id: 'podzemlje', name: 'Podzemlje', zones: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'suma', name: 'Šuma', zones: [] },
    { id: 'grad', name: 'Grad', zones: [] },
  ];
  const worldOf = (i) => WORLDS.findIndex(w => w.zones.includes(i));
  // drugi svjetovi (suma.js, grad.js) dodaju svoje zone ovdje
  function addZones(world, fns) {
    fns.forEach(fn => { WORLDS[world].zones.push(ZONES.length); ZONES.push(fn); });
  }

  const solid = (g, x, y, W, H) => (x < 0 || y < 0 || x >= W || y >= H) ? true : (g[y][x] === '#' || g[y][x] === 'I');

  // grafički slojevi (pločice 72px, skalirane na 1/3)
  function addVisuals(scene, L) {
    const g = L.grid, W = L.W, H = L.H, T = THEMES[L.theme];
    const R = Tiles.rng(1234 + L.W);
    const map = scene.make.tilemap({ tileWidth: TPX, tileHeight: TPX, width: W, height: H });
    const rockTs = map.addTilesetImage('rock', 'rocktiles_' + T.id, TPX, TPX, 0, 0, 0);
    const plankTs = map.addTilesetImage('plank', 'planktiles_' + T.id, TPX, TPX, 0, 0, 100);
    const decoTs = map.addTilesetImage('deco', 'decotiles_' + T.id, TPX, TPX, 0, 0, 200);
    const spikeTs = map.addTilesetImage('spike', 'spiketiles_' + T.id, TPX, TPX, 0, 0, 150);
    const specTs = map.addTilesetImage('special', 'specialtiles_' + T.id, TPX, TPX, 0, 0, 160);
    const deco = map.createBlankLayer('deco', decoTs, 0, 0);
    const trunkL = map.createBlankLayer('trunks', specTs, 0, 0);
    const vis = map.createBlankLayer('vis', [rockTs, plankTs, spikeTs, specTs], 0, 0);
    const glows = [];
    const air = (ch) => ch === '.' || ch === '~';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = g[y][x];
      if (ch === '#') {
        const m = (solid(g, x, y - 1, W, H) ? 0 : 1) | (solid(g, x + 1, y, W, H) ? 0 : 2) | (solid(g, x, y + 1, W, H) ? 0 : 4) | (solid(g, x - 1, y, W, H) ? 0 : 8);
        vis.putTileAt(m * 3 + Math.floor(R() * 3), x, y);
      } else if (ch === '^') {
        vis.putTileAt(150, x, y);
      } else if (ch === 'B') {
        vis.putTileAt(160, x, y);
      } else if (ch === 'I') {
        vis.putTileAt(161, x, y);
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
          if ((T.ceilGlow ?? (T.id === 'dubine' ? 8 : -1)) === d) glows.push({ x: x * TILE + 12, y: y * TILE + 12, col: T.glow[d % 2] });
        }
      }
    }
    (L.trunks || []).forEach(([x, y]) => trunkL.putTileAt(162, x, y));
    [deco, vis, trunkL].forEach(l => { l.setScale(1 / RES); l.setCullPadding(8, 8); });
    deco.setDepth(6); vis.setDepth(5); trunkL.setDepth(4);
    return glows;
  }

  // kolizijski sloj (24px, nevidljiv)
  function addCollision(scene, L) {
    const data = L.grid.map(row => row.map(c => (c === '#' || c === 'B' || c === 'I') ? 0 : (c === '-' || c === '=') ? 1 : c === 'D' ? 2 : -1));  // '~' voda, 'U' blato, 'W' mreža = zrak
    const map = scene.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const ts = map.addTilesetImage('col', 'coltiles', TILE, TILE, 0, 0);
    const layer = map.createLayer(0, ts, 0, 0);
    layer.setVisible(false);
    layer.setCollision([0, 2]);
    layer.forEachTile(t => { if (t.index === 1) t.setCollision(false, false, true, false); });
    return layer;
  }

  return {
    get count() { return ZONES.length; },
    worlds: WORLDS, worldOf, addZones,
    tools: { grid, at, door },
    build(i) { const L = ZONES[i](); L.index = i; L.name = THEMES[L.theme].name; L.world = worldOf(i); L.glide = L.world >= 1; L.cling = L.world >= 2; return L; },
    addVisuals, addCollision,
  };
})();
