// Noćnik — svijet 2: ŠUMA, zone 4–7 (Korijenje, Krošnje, Mrtva šuma, Hukovo gnijezdo)
(() => {
  const OUTL = '#150f19';
  const { common, course, trunkOf } = window.Suma;
  const { grid, at, door } = Level.tools;

  // ================= TEME =================
  const base = (o) => Object.assign({
    forest: true, moon: true, extra: null, hideTex: 'grm',
    spLight: 'rgba(110,90,70,0.45)', spDark: 'rgba(14,10,6,0.5)', rimL: 'rgba(200,200,220,0.12)',
    drip: [1.6, 3],
  }, o);
  Object.assign(THEMES, {
    korijenje: base({
      id: 'korijenje', name: 'Korijenje', surface: 'grass',
      rock: ['#4a3626', '#352619', '#24190f'], plank: ['#6b4a30', '#3e2a1a', '#7a7a2a'],
      glow: [0xffa040, 0xffd060], dark: 'rgba(8,5,3,', darkA: 0.86, cam: '#140c14',
      drone: { f: 43.6, f3: 65.4, lp: 340, wind: 420, windG: 0.018 }, amb: 'creak',
    }),
    krosnje: base({
      id: 'krosnje', name: 'Krošnje', surface: 'grass',
      rock: ['#3e3a44', '#2c2932', '#1f1d24'], plank: ['#6b5238', '#3e2e1f', '#5ea85a'],
      glow: [0xbfe6ff, 0xd8ff7a], dark: 'rgba(4,8,20,', darkA: 0.7, cam: '#0c1838',
      drone: { f: 46.2, f3: 69.3, lp: 360, wind: 480, windG: 0.02 }, amb: 'crickets',
    }),
    mrtva: base({
      id: 'mrtva', name: 'Mrtva šuma', surface: 'ash', moonTint: 0xff6a50, fog: true,
      rock: ['#3a3434', '#282424', '#1c1818'], plank: ['#4a3e3a', '#2a2220', '#6a4a3a'],
      glow: [0xff6a4a, 0xffb070], dark: 'rgba(10,3,3,', darkA: 0.86, cam: '#140808',
      drone: { f: 38.9, f3: 58.3, lp: 280, wind: 360, windG: 0.022 }, amb: 'creak',
    }),
    hukovo: base({
      id: 'hukovo', name: 'Hukovo gnijezdo', surface: 'ash', moonTint: 0xffe0a0,
      rock: ['#3a2e26', '#2a211b', '#1d1712'], plank: ['#5a4630', '#33271a', '#7a6a4a'],
      glow: [0xffd23a, 0xff8a3a], dark: 'rgba(6,4,8,', darkA: 0.82, cam: '#06040a',
      drone: { f: 36.7, f3: 55, lp: 300, wind: 420, windG: 0.02 }, amb: 'creak',
    }),
  });
  Tiles.hook('korijenje', common('korijenje', 'rub', { sky: ['#120a1e', '#2a1830', '#3a2430'], far: '#1a1020', trunk: '#1e1416' }));
  Tiles.hook('krosnje', common('krosnje', 'rub', { sky: ['#0c1838', '#1e3462', '#2e4a78'], far: '#16264a', trunk: '#1a2440' }));
  Tiles.hook('mrtva', common('mrtva', 'paukova', { sky: ['#140808', '#2a1414', '#3a1e1a'], far: '#1e0e0e', trunk: '#1c1212', spike: ['#5a4a44', '#1e1614'] }));
  Tiles.hook('hukovo', common('hukovo', 'paukova', { sky: ['#06040a', '#140e1a', '#22182a'], far: '#120c16', trunk: '#1a1418', spike: ['#6a5236', '#2e2214'] }));

  // ================= STRAŠILO =================
  Art.add((scene) => {
    const { sheet, ell, line, limb, radial } = Art;
    const draw = (c, p) => {
      const b = p.bob || 0;
      const stick = '#5e4630', straw = '#c8a850', sack = '#a8946a', coat = '#4a3c2c';
      // noge od granja
      const leg = (dx, lift, col) => {
        limb(c, [[26, 50 + b], [26 + dx * 0.6 + 2, 64], [26 + dx, 79 - lift]], col, 2.2);
        for (let k = -1; k <= 1; k++) limb(c, [[26 + dx, 79 - lift], [26 + dx + 3 + k * 2.4, 80 - lift]], col, 0.7);
      };
      leg(p.legB, p.liftB, '#4a3826');
      // kaput od vreće
      c.fillStyle = coat;
      c.beginPath(); c.moveTo(19, 22 + b); c.lineTo(34, 22 + b);
      for (let k = 0; k <= 7; k++) c.lineTo(36 - k * 2.6, 54 + b + (k % 2 ? 3 : 0));
      c.closePath(); c.fill(); c.strokeStyle = OUTL; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#6a5838'; c.fillRect(22, 34 + b, 5, 5); c.fillStyle = '#3a2e20'; c.fillRect(29, 42 + b, 4, 6);
      c.strokeStyle = 'rgba(20,14,8,0.6)'; c.lineWidth = 0.5; c.strokeRect(22, 34 + b, 5, 5);
      // slama ispod kaputa
      c.strokeStyle = straw; c.lineWidth = 0.7;
      for (let k = 0; k < 8; k++) { const x = 18 + k * 2.4; c.beginPath(); c.moveTo(x, 54 + b); c.lineTo(x + (k % 2 ? 1.5 : -1.5), 59 + b + (k % 3)); c.stroke(); }
      leg(p.legF, p.liftF, stick);
      // ruke: dugi štap, na kraju prsti od granja
      const arm = (sx, ang, reach, col) => {
        const a = ang - reach * 0.9;
        const ex = sx + Math.cos(a) * 13, ey = 25 + b + Math.sin(a) * 13 + 8;
        const hx = ex + Math.cos(a - 0.2) * 12, hy = ey + Math.sin(a - 0.2) * 12;
        limb(c, [[sx, 25 + b], [ex, ey], [hx, hy]], col, 1.8);
        c.strokeStyle = straw; c.lineWidth = 0.6; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - 2, ey + 3); c.moveTo(ex, ey); c.lineTo(ex + 1, ey + 3.5); c.stroke();
        for (let k = -1; k <= 1; k++) limb(c, [[hx, hy], [hx + Math.cos(a + k * 0.5) * 6, hy + Math.sin(a + k * 0.5) * 6], [hx + Math.cos(a + k * 0.6) * 9, hy + Math.sin(a + k * 0.6) * 9 + 1]], col, 0.6);
      };
      arm(21, 2.3 + p.armB, -p.reach, '#4a3826');
      arm(32, 0.4 + p.armF, p.reach, stick);
      // vrat od užeta
      c.fillStyle = '#7a6440'; c.fillRect(25, 18 + b, 7, 3);
      // glava: vreća
      ell(c, 29, 11 + b, 8.5, 9, sack, OUTL, 1);
      c.strokeStyle = 'rgba(80,60,30,0.5)'; c.lineWidth = 0.4;
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(22, 6 + k * 3 + b); c.lineTo(36, 7 + k * 3 + b); c.stroke(); }
      // šešir, potrgan
      c.fillStyle = '#231a14'; c.beginPath(); c.moveTo(19, 5 + b); c.lineTo(39, 4 + b); c.lineTo(31, 1 + b); c.lineTo(27, -6 + b); c.lineTo(26, 2 + b); c.closePath(); c.fill();
      c.strokeStyle = straw; c.lineWidth = 0.6; c.beginPath(); c.moveTo(21, 6 + b); c.lineTo(19, 10 + b); c.moveTo(37, 6 + b); c.lineTo(39, 10 + b); c.stroke();
      // rupe za oči i zašivena usta
      ell(c, 27, 10 + b, 1.8, 2, '#050302', null); ell(c, 33, 10 + b, 1.8, 2, '#050302', null);
      c.strokeStyle = '#1a1008'; c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(24, 15 + b); c.quadraticCurveTo(29.5, 18.5 + b, 35, 14.5 + b); c.stroke();
      for (let k = 0; k < 6; k++) { const x = 25 + k * 1.8; c.beginPath(); c.moveTo(x, 14.6 + b + (k > 1 && k < 4 ? 1.2 : 0.5)); c.lineTo(x + 0.6, 17 + b + (k > 1 && k < 4 ? 1 : 0)); c.stroke(); }
    };
    const F = [];
    const LF = [5, 1, -5, -1], LB = [-5, -1, 5, 1], UF = [0, 2, 0, 0], UB = [0, 0, 0, 2], BB = [0, -1, 0, -1], AF = [0.3, 0.1, -0.3, -0.1];
    for (let i = 0; i < 4; i++) F.push({ name: 'walk' + i, bob: BB[i], legF: LF[i], legB: LB[i], liftF: UF[i], liftB: UB[i], armF: AF[i], armB: -AF[i], reach: 0 });
    for (let i = 0; i < 4; i++) F.push({ name: 'chase' + i, bob: BB[i] * 1.4, legF: LF[i] * 1.4, legB: LB[i] * 1.4, liftF: UF[i] * 1.5, liftB: UB[i] * 1.5, armF: AF[i] * 0.5, armB: -AF[i] * 0.5, reach: 0.9 });
    F.push({ name: 'idle0', bob: 0, legF: 2, legB: -2, liftF: 0, liftB: 0, armF: 0, armB: 0, reach: 0.1 });
    F.push({ name: 'idle1', bob: 0.6, legF: 2, legB: -2, liftF: 0, liftB: 0, armF: 0.08, armB: -0.08, reach: 0.25 });
    sheet(scene, 'strasilo', 84, 80, F, (c, f) => { c.translate(18, 0); draw(c, f); });
    const fr = (names) => names.map(n => ({ key: 'strasilo', frame: n }));
    scene.anims.create({ key: 'strasilo-walk', frames: fr(['walk0', 'walk1', 'walk2', 'walk3']), frameRate: 4.5, repeat: -1 });
    scene.anims.create({ key: 'strasilo-chase', frames: fr(['chase0', 'chase1', 'chase2', 'chase3']), frameRate: 9, repeat: -1 });
    scene.anims.create({ key: 'strasilo-idle', frames: fr(['idle0', 'idle1']), frameRate: 1.6, repeat: -1 });

    // lice za jumpscare: vreća, ušivena usta, crvene oči u rupama
    const t = scene.textures.createCanvas('lice_strasilo', 512, 512);
    const c = t.getContext();
    c.fillStyle = '#000'; c.fillRect(0, 0, 512, 512);
    c.save(); c.translate(256, 270); c.rotate(0.12);
    c.fillStyle = radial(c, -40, -60, 10, 290, [[0, '#cbb88a'], [0.6, '#8e7a52'], [1, '#3e3220']]);
    c.beginPath(); c.moveTo(-200, -120); c.quadraticCurveTo(-230, 120, -150, 220); c.quadraticCurveTo(0, 270, 160, 210); c.quadraticCurveTo(235, 100, 195, -130); c.quadraticCurveTo(0, -250, -200, -120); c.fill();
    c.strokeStyle = 'rgba(60,45,25,0.45)'; c.lineWidth = 3;
    for (let y = -190; y < 240; y += 14) { c.beginPath(); c.moveTo(-230, y); c.lineTo(230, y + 8); c.stroke(); }
    for (let x = -220; x < 230; x += 16) { c.beginPath(); c.moveTo(x, -230); c.lineTo(x + 6, 250); c.strokeStyle = 'rgba(60,45,25,0.25)'; c.stroke(); }
    // šešir
    c.fillStyle = '#16100c'; c.beginPath(); c.moveTo(-260, -110); c.lineTo(250, -140); c.lineTo(90, -190); c.lineTo(20, -330); c.lineTo(-40, -180); c.closePath(); c.fill();
    // slama
    c.strokeStyle = '#d0b058'; c.lineWidth = 5;
    for (let k = 0; k < 16; k++) { const x = -220 + k * 28; c.beginPath(); c.moveTo(x, -120 - k % 3 * 4); c.lineTo(x + (k % 2 ? 18 : -14), -60 + (k % 4) * 10); c.stroke(); }
    // rupe za oči
    [[-85, -10, 50, 58], [90, -16, 44, 54]].forEach(([x, y, rx, ry]) => {
      c.fillStyle = '#050201'; c.beginPath(); c.ellipse(x, y, rx, ry, 0.1, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#2a1c0e'; c.lineWidth = 4;
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; c.beginPath(); c.moveTo(x + Math.cos(a) * (rx + 12), y + Math.sin(a) * (ry + 12)); c.lineTo(x + Math.cos(a) * (rx - 4), y + Math.sin(a) * (ry - 4)); c.stroke(); }
      c.fillStyle = radial(c, x + 6, y + 4, 0, 22, [[0, '#fff0e0'], [0.3, '#ff3a1a'], [1, 'rgba(255,40,10,0)']]);
      c.fillRect(x - 30, y - 30, 70, 70);
    });
    // zašivena usta, razvučena preko cijelog lica
    c.strokeStyle = '#1a0c06'; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-170, 95); c.quadraticCurveTo(0, 200, 175, 80); c.stroke();
    c.lineWidth = 6;
    for (let k = 0; k < 15; k++) { const tt = (k + 0.5) / 15, x = -170 + tt * 345, y = 95 + Math.sin(tt * Math.PI) * 52 - tt * 15; c.beginPath(); c.moveTo(x - 6, y - 26); c.lineTo(x + 6, y + 26); c.stroke(); }
    c.fillStyle = 'rgba(90,10,10,0.55)'; c.beginPath(); c.ellipse(30, 170, 40, 14, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    c.fillStyle = radial(c, 256, 250, 150, 380, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.85)']]); c.fillRect(0, 0, 512, 512);
    t.refresh();
  });

  Art.add((scene) => {
    Art.sheet(scene, 'pero', 16, 6, ['p'], (c) => {
      c.fillStyle = '#3a3024'; c.beginPath(); c.moveTo(0, 3); c.quadraticCurveTo(8, -1, 16, 3); c.quadraticCurveTo(8, 7, 0, 3); c.fill();
      c.strokeStyle = '#ffd23a'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(1, 3); c.lineTo(16, 3); c.stroke();
    });
  });

  // ================= dodatni dijelovi staze =================
  // tuneli ispod zemlje (f = red na kojem se stoji)
  const tunnels = (c) => {
    const G = c.G, GR = c.GR;
    c.down = (f) => { G.carve(c.X, GR, c.X + 2, f); c.X += 3; return c; };
    c.tseg = (n, f, h = 4) => { G.carve(c.X, f - h + 1, c.X + n - 1, f); c.X += n; return c; };
    c.tpit = (n, f) => { G.carve(c.X, f - 3, c.X + n - 1, f + 2); G.spikes(c.X, c.X + n - 1, f + 2); c.X += n; return c; };
    c.tcrumb = (n, f) => { G.carve(c.X, f - 3, c.X + n - 1, f + 3); G.spikes(c.X, c.X + n - 1, f + 3); for (let x = c.X + 1; x + 1 < c.X + n; x += 3) G.crumble(x, x + 1, f + 1); c.X += n; return c; };
    c.tdrop = (f1, f2) => { G.carve(c.X, f1 - 3, c.X + 2, f2); c.X += 3; return c; };
    c.tup = (f2, f1) => { G.carve(c.X, f1 - 3, c.X + 1, f2); G.g[f2 + 1][c.X] = 'B'; G.g[f2 + 1][c.X + 1] = 'B'; c.X += 2; return c; };
    c.up = (f) => { G.carve(c.X, GR, c.X + 1, f); G.g[f + 1][c.X] = 'B'; G.g[f + 1][c.X + 1] = 'B'; c.X += 2; return c; };
    return c;
  };
  const T = (x) => x * TILE;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ZONA 4: KORIJENJE — proplanci s Hukom i tuneli pod korijenjem (šišmiši, bube, gljive-odskočnice)
  function korijenje() {
    const W = 430, H = 36, GR = 12;
    const c = tunnels(course(W, H, GR)), G = c.G, S = c.S;
    c.put('checkpoint', 4).put('note', 8, S, 'N1').flat(12);
    c.put('cabinet', c.X).flat(3);
    const P1 = c.dead(8);
    c.flat(2).put('cabinet', c.X - 1).pit(3).flat(3).put('crawler', c.X).flat(2).crumbles(7).flat(2).put('cabinet', c.X).flat(4);
    // tunel 1
    c.down(18);
    c.tseg(8, 18).put('bat', c.X - 4, 15).tseg(6, 18).tpit(3, 18).tseg(5, 18).put('crawler', c.X - 2, 18);
    c.tseg(6, 16).put('bat', c.X - 3, 13).tseg(4, 16).tcrumb(9, 16).tseg(6, 16).put('battery', c.X - 2, 16).put('bat', c.X - 4, 13);
    c.tseg(5, 18).tpit(3, 18).tseg(6, 18).put('crawler', c.X - 3, 18).put('key', c.X - 1, 18, 'K1');
    c.up(18);
    // proplanak 2
    c.flat(3).put('checkpoint', c.X).put('note', c.X + 3, S, 'N2').flat(6);
    const P2 = c.dead(9);
    c.flat(2).put('cabinet', c.X).flat(3).pit(3).flat(3).glidePit(9).flat(2).put('cabinet', c.X).flat(3);
    const P3 = c.dead(8);
    c.flat(2).crumbles(8).flat(2).put('cabinet', c.X).flat(2).door('D1');
    // dio 2: dublji tunel na dvije razine
    c.flat(2).put('checkpoint', c.X).put('note', c.X + 2, S, 'N3').flat(5);
    c.down(19);
    c.tseg(10, 19).put('bat', c.X - 7, 16).put('bat', c.X - 3, 16).tpit(3, 19).tseg(4, 19);
    c.tdrop(19, 25);
    c.tseg(8, 25).put('crawler', c.X - 3, 25).tpit(3, 25).tseg(6, 25).put('bat', c.X - 3, 22).tcrumb(9, 25).tseg(5, 25).put('crawler', c.X - 2, 25);
    c.tseg(6, 25).put('battery', c.X - 3, 25).put('bat', c.X - 5, 22).put('bat', c.X - 1, 22).tpit(3, 25).tseg(5, 25).put('key', c.X - 2, 25, 'K2').put('note', c.X - 4, 25, 'N4');
    c.tup(25, 19);
    c.tseg(8, 19).put('bat', c.X - 4, 16).tpit(3, 19).tseg(4, 19).tcrumb(6, 19).tseg(4, 19);
    c.up(19);
    // proplanak 3 — dva Huka
    c.flat(3).put('checkpoint', c.X).flat(4).put('cabinet', c.X).flat(3);
    const P4 = c.dead(9);
    c.flat(2).put('cabinet', c.X).flat(2).crumbles(10).flat(2).put('cabinet', c.X).flat(3).glidePit(9).flat(2);
    const P5 = c.dead(8);
    c.flat(1).put('cabinet', c.X).flat(2).pit(3).flat(3).put('crawler', c.X).flat(3).put('cabinet', c.X).flat(2).door('D2');
    c.flat(4).put('exit', c.X).flat(4);
    const huks = [
      { id: 'H1', perches: [P1, P2, P3], x1: T(14), x2: P3.x + T(16) },
      { id: 'H2', perches: [P4, P5], x1: P4.x - T(20), x2: T(c.X) },
      { id: 'H3', dormant: 'K2', perches: [P5, P4], x1: P4.x - T(20), x2: T(c.X) },
    ];
    return {
      theme: 'korijenje', W, H, grid: G.g, trunks: G.trunks, objects: c.O, monsters: [], huks, doors: c.doors, start: at(2, S), doorTex: 'vrata_suma',
      notes: {
        N1: 'Ispod starih stabala korijenje je izdubilo hodnike.\n\nDolje me Huk ne vidi.\nAli dolje nisam sam.',
        N2: 'Gljive u tunelima su mekane i čudne.\nKad skočiš na njih — izbace te gore.',
        N3: 'Drugi tunel ide dublje.\nČujem krila. Puno krila.',
        N4: 'Kad sam izašao gore, čekala su me dvojica.\n\nSkrij se prije nego što izađeš.',
      },
    };
  }

  // ZONA 5: KROŠNJE — sve u vrhovima stabala; dolje je samo trnje; vjetar u naletima
  function krosnje() {
    const W = 404, H = 46;
    const G = grid(W, H), trunk = trunkOf(G);
    G.carve(0, 0, W - 1, 43); G.spikes(0, W - 1, 43);
    const O = [], cnt = {};
    const put = (type, x, y, id) => { const p = { checkpoint: 'C', note: 'N', battery: 'B', key: 'K', cabinet: 'o', crawler: 'b', wisp: 'w', spider: 's' }[type]; id = id || p + (cnt[p] = (cnt[p] || 0) + 1); O.push({ type, id, ...at(x, y) }); };
    const isl = (x0, x1, r) => { G.plat(x0, x1, r); const m = (x0 + x1) >> 1; trunk(m - 1, r + 1, m, 42); };
    const snag = (x0, r) => { G.plat(x0, x0 + 6, r); trunk(x0 + 3, r + 1, x0 + 3, 42); return at(x0 + 3, r - 1); };
    const climb = (x, r0, r1) => { for (let y = r0 - 2, k = 0; y > r1; y -= 2, k++) G.plat(k % 2 ? x + 2 : x, k % 2 ? x + 5 : x + 3, y); };
    const bounce = (x, r) => { G.g[r][x] = 'B'; G.g[r][x + 1] = 'B'; };
    const pillar = (x, r, id) => { G.fill(x, 0, x + 5, r - 5); G.carve(x + 2, r - 4, x + 3, r - 1, 'D'); G.fill(x, r, x + 5, 42); return door(id, x + 2, r - 4); };
    // dio 1
    isl(0, 14, 16); put('checkpoint', 3, 15); put('note', 7, 15, 'N1'); put('cabinet', 12, 15);
    isl(22, 30, 20); put('crawler', 26, 19);
    climb(31, 20, 10); isl(33, 47, 10); put('battery', 40, 9); put('cabinet', 45, 9);
    isl(64, 76, 17); put('crawler', 70, 16); put('cabinet', 74, 16);
    const E = snag(80, 7);
    isl(80, 92, 21); put('cabinet', 88, 20); put('battery', 91, 20);
    G.crumble(95, 96, 21); G.crumble(99, 100, 21); G.crumble(103, 104, 21);
    isl(107, 118, 22); put('wisp', 112, 18); put('crawler', 115, 21);
    climb(118, 22, 12); isl(121, 134, 12); put('cabinet', 125, 11); put('key', 133, 11, 'K1');
    isl(150, 160, 24); put('checkpoint', 152, 23); put('note', 155, 23, 'N2'); bounce(158, 24);
    isl(162, 172, 16); put('cabinet', 166, 15); put('battery', 171, 15);
    const K = snag(176, 6);
    isl(178, 188, 20); put('cabinet', 185, 19);
    const D1 = pillar(190, 20, 'D1');
    // dio 2
    isl(196, 206, 20); put('checkpoint', 198, 19); put('note', 201, 19, 'N3'); put('cabinet', 205, 19);
    isl(214, 222, 26); put('crawler', 218, 25); put('wisp', 210, 22);
    climb(222, 26, 14); isl(225, 238, 14); put('cabinet', 231, 13); put('battery', 236, 13);
    isl(254, 266, 20); put('cabinet', 263, 19); put('wisp', 250, 17);
    const Q = snag(268, 8);
    for (let x = 268; x < 286; x += 3) G.crumble(x, x + 1, 20);
    isl(287, 297, 21); put('key', 295, 20, 'K2'); put('crawler', 290, 20);
    isl(310, 320, 28); put('checkpoint', 312, 27); put('cabinet', 316, 27); bounce(319, 28);
    isl(322, 334, 20); put('cabinet', 328, 19); put('wisp', 330, 16);
    climb(334, 20, 12); isl(337, 350, 12); put('battery', 345, 11);
    const Z = snag(356, 10);
    isl(368, 378, 22); put('cabinet', 374, 21);
    const D2 = pillar(380, 22, 'D2');
    isl(386, 403, 22); put('note', 390, 21, 'N4'); put('exit', 397, 21);
    const winds = [
      { x1: T(47), x2: T(64), y1: 0, y2: T(43), f: -150, on: 2.2, off: 5.6, ph: 0 },
      { x1: T(135), x2: T(150), y1: 0, y2: T(43), f: 80, on: 2.2, off: 4.4, ph: 1.3 },
      { x1: T(239), x2: T(254), y1: 0, y2: T(43), f: -160, on: 2.2, off: 5.4, ph: 0.6 },
      { x1: T(351), x2: T(368), y1: 0, y2: T(43), f: 80, on: 2.0, off: 4.4, ph: 2 },
    ];
    const huks = [
      { id: 'H1', perches: [E, K], x1: T(40), x2: T(190) },
      { id: 'H2', perches: [Q, Z], x1: T(196), x2: T(386) },
      { id: 'H3', dormant: 'K2', perches: [Z, Q], x1: T(240), x2: T(386) },
    ];
    return {
      theme: 'krosnje', W, H, grid: G.g, trunks: G.trunks, objects: O, monsters: [], huks, winds, doors: [D1, D2], start: at(2, 15), doorTex: 'vrata_suma',
      notes: {
        N1: 'Ovdje gore nema tla.\nSamo grane… i trnje daleko dolje.\n\nVjetar dolazi u naletima.\nKad lišće poleti — čekaj.',
        N2: 'Gljiva na kraju grane baca uvis.\n\nHuk sjedi na suhim vrhovima.\nOdavde vidi cijelu šumu.',
        N3: 'Stari kameni stupovi drže krošnje.\nKao da je netko gradio\nprije nego što je šuma narasla.',
        N4: 'Ispod mene šuma je drugačija.\nSiva. Tiha. Mrtva.\n\nI nešto stoji među stablima.',
      },
    };
  }

  // ZONA 6: MRTVA ŠUMA — strašila hodaju po tlu, Huk gleda odozgo
  function mrtva() {
    const W = 470, H = 32, GR = 24;
    const c = course(W, H, GR), G = c.G, S = c.S;
    const M = [];
    const field = (n, bushes, mid, dormant, extra) => {
      const x0 = c.X;
      bushes.forEach(b => c.put('cabinet', x0 + b));
      (extra || []).forEach(([t, dx]) => c.put(t, x0 + dx));
      M.push({ id: 'M' + (M.length + 1), ...at(x0 + (mid || n >> 1), S), skin: 'strasilo', minX: T(x0 + 2), maxX: T(x0 + n - 3), cMin: T(x0) + 8, cMax: T(x0 + n) - 8, dormant });
      c.flat(n);
    };
    c.put('checkpoint', 4).put('note', 8, S, 'N1').flat(12);
    c.pit(2).flat(4).put('crawler', c.X - 1).glidePit(8).flat(3);
    field(34, [5, 15, 26], 20, null, [['battery', 21]]);
    c.pit(3).flat(3);
    const P1 = c.dead(10);
    c.flat(1).crumbles(9).flat(2).put('checkpoint', c.X).put('note', c.X + 3, S, 'N2').flat(6);
    let t = c.tree(8);
    c.put('spider', t.x0 + 5, 9).put('spider', t.x0 + 14, 9).put('battery', t.x0 + 2, t.top - 1).put('key', t.x1 - 1, 7, 'K1');
    c.pit(12, 5);
    field(38, [4, 13, 23, 33], 18, null);
    M.push({ ...M[M.length - 1], id: 'M' + (M.length + 1), x: M[M.length - 1].x + T(10), dormant: 'K1' });
    c.flat(2).door('D1');
    // dio 2
    c.flat(2).put('checkpoint', c.X).put('note', c.X + 2, S, 'N3').flat(5);
    c.mud(6).flat(2).put('wisp', c.X + 4, S - 2).logs(12).flat(3);
    const P2 = c.dead(11);
    c.flat(2).put('cabinet', c.X).flat(2).pit(3).flat(2);
    field(40, [4, 14, 25, 35], 22, null, [['battery', 30]]);
    c.pit(3).flat(2);
    t = c.tree(6, 18);
    c.put('spider', t.x0 + 4, 7).put('spider', t.x0 + 12, 7).put('key', t.x1 - 1, 5, 'K2');
    c.pit(14, 5);
    c.flat(2).put('checkpoint', c.X).flat(3);
    const P3 = c.dead(10);
    field(36, [4, 14, 24, 32], 20, null);
    M.push({ ...M[M.length - 1], id: 'M' + (M.length + 1), x: M[M.length - 1].x - T(12), dormant: 'K2' });
    c.crumbles(10).flat(2).put('cabinet', c.X).flat(2).door('D2');
    c.flat(3).put('note', c.X, S, 'N4').flat(4).put('exit', c.X).flat(4);
    const huks = [
      { id: 'H1', perches: [P1], x1: P1.x - T(40), x2: P1.x + T(30) },
      { id: 'H2', perches: [P2, P3], x1: P2.x - T(25), x2: T(c.X) },
    ];
    return {
      theme: 'mrtva', W, H, grid: G.g, trunks: G.trunks, objects: c.O, monsters: M, huks, doors: c.doors, start: at(2, S), doorTex: 'vrata_suma',
      notes: {
        N1: 'Ovdje je sve izgorjelo.\nMjesec je crven.\n\nNa poljanama stoje strašila.\nNisam vidio da se miču.\nJoš.',
        N2: 'Strašilo me vidjelo i krenulo za mnom.\nSakrio sam se u grm i prošlo je pored mene.\n\nAko me vidi da ulazim — zna.',
        N3: 'Huk ih je napravio.\nOd granja, vreća i slame.\nDa čuvaju put do gnijezda.',
        N4: 'Iza ove ograde je najstarije stablo.\nNa vrhu je gnijezdo.\n\nOn čeka.',
      },
    };
  }

  // ZONA 7: HUKOVO GNIJEZDO — uspon po golemom stablu i borba s Hukom
  function gnijezdo() {
    const W = 112, H = 100;
    const G = grid(W, H), trunk = trunkOf(G);
    G.carve(0, 0, W - 1, 95);
    const O = [], cnt = {};
    const put = (type, x, y, id, extra) => { const p = { checkpoint: 'C', note: 'N', battery: 'B', key: 'K', cabinet: 'o', crawler: 'b', wisp: 'w', spider: 's', exit: 'E' }[type]; id = id || p + (cnt[p] = (cnt[p] || 0) + 1); O.push({ type, id, ...at(x, y), ...(extra || {}) }); };
    trunk(52, 18, 59, 95);
    // podnožje
    put('checkpoint', 6, 95); put('note', 10, 95, 'N1');
    // uspon: grane lijevo-desno; svakih nekoliko redova široka grana s nečim
    const R = Tiles.rng(77);
    let x = 22, dir = 1, y = 96, step = 0;
    const landings = [];
    while (y > 35) {
      y -= 2; step++;
      if (step % 6 === 0) {
        const x0 = clamp(x - 4, 20, 82);
        G.plat(x0, x0 + 9, y); landings.push({ x0, y });
        x = dir > 0 ? x0 + 9 : x0; dir = -dir;
      } else {
        const w = 2 + ((R() * 2) | 0);
        x = clamp(x + dir * (2 + ((R() * 2) | 0)), 20, 88);
        if (x >= 86 || x <= 21) dir = -dir;
        (R() < 0.3 && step > 3) ? G.crumble(x, x + w - 1, y) : G.plat(x, x + w - 1, y);
      }
    }
    landings.forEach((L, i) => {
      if (i % 2 === 0) put('checkpoint', L.x0 + 2, L.y - 1);
      if (i % 2 === 1) put('battery', L.x0 + 7, L.y - 1);
      if (i % 3 === 1) put('crawler', L.x0 + 5, L.y - 1);
      if (i === 1) put('note', L.x0 + 4, L.y - 1, 'N2');
      if (i % 3 === 2) put('wisp', L.x0 + 4, L.y - 4);
    });
    // široka grana ispod gnijezda; gljiva baca kroz rupu u gnijezdo
    G.plat(20, 90, 32); G.g[32][22] = 'B'; G.g[32][23] = 'B';
    // gnijezdo (arena)
    G.fill(17, 0, 18, 24); G.fill(56, 0, 60, 25);
    G.fill(19, 24, 55, 25); G.carve(21, 24, 24, 25);
    put('checkpoint', 27, 23, 'C9'); put('note', 30, 23, 'N3');
    [[26, 'Bx1'], [39, 'Bx2'], [52, 'Bx3']].forEach(([bx, id]) => put('battery', bx, 23, id, { respawn: 14 }));
    G.plat(31, 35, 22); G.plat(43, 47, 22);
    put('exit', 51, 23);
    const perches = [[24, 12], [38, 9], [51, 12]].map(([px, r]) => { G.plat(px - 3, px + 3, r); trunk(px, r + 1, px, 23); return at(px, r - 1); });
    const boss = { perches, x1: T(19), x2: T(56), trigger: T(26), floorY: T(24), top: T(5), wisps: [at(29, 16), at(47, 16)] };
    const winds = [{ x1: T(19), x2: T(92), y1: T(40), y2: T(66), f: 130, on: 2.0, off: 3.0, ph: 0 }, { x1: T(19), x2: T(92), y1: T(66), y2: T(80), f: -120, on: 1.8, off: 3.2, ph: 1.5 }];
    return {
      theme: 'hukovo', W, H, grid: G.g, trunks: G.trunks, objects: O, monsters: [], boss, winds, doors: [], start: at(4, 95), doorTex: 'vrata_suma',
      notes: {
        N1: 'Najstarije stablo u šumi.\nGore, iznad oblaka granja — gnijezdo.\n\nPenji se. Ne gledaj dolje.',
        N2: 'Vjetar ovdje udara sa strane.\nDrži se grane kad zapuše.',
        N3: 'Huk mrzi svjetlo u očima.\nKad se obruši — zasvijetli mu u lice.\nKad padne — udri. Puno puta.\n\nI kad zaglavi kandže u gnijezdu.',
      },
    };
  }

  Level.addZones(1, [korijenje, krosnje, mrtva, gnijezdo]);
})();
