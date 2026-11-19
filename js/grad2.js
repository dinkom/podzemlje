// Noćnik — svijet 3: GRAD, zone 4–7 (Metro, Robna kuća, Toranj, Krojačev atelje)
(() => {
  const OUTL = '#150f19';
  const { course } = window.Suma;
  const { city, cityKit } = window.Grad;
  const { grid, at, door } = Level.tools;
  const T = (x) => x * TILE;

  // ================= TEME =================
  const base = (o) => Object.assign({
    city: true, extra: null, hideTex: 'kutija', crawler: 'stakor', moon: false,
    spLight: 'rgba(120,100,90,0.35)', spDark: 'rgba(10,8,8,0.4)', rimL: 'rgba(255,220,180,0.1)',
    plank: ['#4a4a52', '#2a2a30', '#6a6a72'], drip: [1.6, 3.2], surface: 'ash',
  }, o);
  Object.assign(THEMES, {
    metro: base({ id: 'metro', name: 'Metro', rock: ['#6a7068', '#4e5450', '#363a38'], glow: [0xfff0c0, 0x9fe0ff], dark: 'rgba(6,8,8,', darkA: 0.86, cam: '#080a0a', drone: { f: 36.7, f3: 55, lp: 260, wind: 300, windG: 0.02 }, amb: 'metro' }),
    robna: base({ id: 'robna', name: 'Robna kuća', rock: ['#4a2a30', '#36202a', '#24141c'], glow: [0xffe0b0, 0xff9ad0], dark: 'rgba(8,4,6,', darkA: 0.84, cam: '#0c0608', drone: { f: 49, f3: 73.4, lp: 420, wind: 400, windG: 0.01 }, amb: 'store' }),
    toranj: base({ id: 'toranj', name: 'Toranj sa satom', rock: ['#4a4038', '#352e28', '#25201c'], glow: [0xffd890, 0xb0d0ff], dark: 'rgba(6,5,8,', darkA: 0.84, cam: '#0a0810', drone: { f: 32.7, f3: 49, lp: 300, wind: 700, windG: 0.03 }, amb: 'clock' }),
    atelje: base({ id: 'atelje', name: 'Krojačev atelje', rock: ['#3a2a26', '#2a1e1c', '#1c1412'], glow: [0xffd0a0, 0xff6a6a], dark: 'rgba(8,4,4,', darkA: 0.84, cam: '#0c0606', drone: { f: 29.1, f3: 43.7, lp: 240, wind: 300, windG: 0.015 }, amb: 'store' }),
  });

  const bgs = {
    metro: {
      far(c, R, h) {
        c.fillStyle = '#0c0e0e'; c.fillRect(0, 0, 600, 280);
        h.wrap(() => {
          for (let x = 0; x < 600; x += 200) {
            c.fillStyle = '#050606'; c.beginPath(); c.moveTo(x + 40, 260); c.lineTo(x + 40, 140); c.quadraticCurveTo(x + 100, 60, x + 160, 140); c.lineTo(x + 160, 260); c.fill();
            c.fillStyle = 'rgba(200,210,190,0.08)'; for (let y = 20; y < 130; y += 8) for (let xx = x; xx < x + 200; xx += 8) if (R() < 0.6) c.fillRect(xx, y, 7, 7);
            c.fillStyle = '#3a2a1a'; c.fillRect(x + 172, 70, 22, 32); c.fillStyle = 'rgba(200,60,60,0.5)'; c.fillRect(x + 175, 74, 16, 10);
          }
        });
      },
      mid(c, R, h) { h.wrap(() => { for (let x = 30; x < 800; x += 160) { c.fillStyle = '#161a1a'; c.fillRect(x, 0, 22, 280); c.fillStyle = '#c8a020'; c.fillRect(x, 200, 22, 4); } }); },
    },
    robna: {
      far(c, R, h) {
        c.fillStyle = '#140a0e'; c.fillRect(0, 0, 600, 280);
        h.wrap(() => {
          for (let x = 20; x < 600; x += 120) { c.fillStyle = '#1e1016'; c.fillRect(x, 60, 90, 160); c.fillStyle = 'rgba(255,190,220,0.06)'; c.fillRect(x + 6, 66, 78, 148); for (let y = 100; y < 220; y += 40) { c.fillStyle = '#0c0608'; c.fillRect(x, y, 90, 4); } }
          c.fillStyle = 'rgba(255,120,170,0.25)'; c.font = 'bold 18px serif'; c.fillText('RASPRODAJA', 200, 40);
        });
      },
      mid(c, R, h) {
        h.wrap(() => {
          for (let k = 0; k < 8; k++) {
            const x = R() * 800, y = 200 + R() * 30;
            c.fillStyle = '#1a0e12'; c.beginPath(); c.ellipse(x, y - 64, 7, 9, 0, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.moveTo(x - 12, y - 52); c.lineTo(x + 12, y - 52); c.lineTo(x + 8, y - 16); c.lineTo(x - 8, y - 16); c.fill(); c.fillRect(x - 1.5, y - 16, 3, 40);
          }
        });
      },
    },
    toranj: {
      far(c, R, h) {
        c.fillStyle = '#0c0a10'; c.fillRect(0, 0, 600, 280);
        h.wrap(() => {
          const cx = 300, cy = 120;
          c.fillStyle = 'rgba(230,220,180,0.12)'; c.beginPath(); c.arc(cx, cy, 90, 0, Math.PI * 2); c.fill();
          c.strokeStyle = 'rgba(230,220,180,0.25)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 90, 0, Math.PI * 2); c.stroke();
          for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; c.fillStyle = 'rgba(230,220,180,0.35)'; c.fillRect(cx + Math.cos(a) * 76 - 2, cy + Math.sin(a) * 76 - 6, 4, 12); }
          c.strokeStyle = 'rgba(20,16,12,0.9)'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 40, cy - 50); c.moveTo(cx, cy); c.lineTo(cx - 60, cy + 10); c.stroke();
        });
      },
      mid(c, R, h) {
        h.wrap(() => {
          for (let k = 0; k < 6; k++) {
            const x = R() * 800, y = R() * 280, r = 20 + R() * 40;
            c.fillStyle = '#16121a'; c.beginPath();
            for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, rr = i % 2 ? r : r * 0.82; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
            c.fill(); c.fillStyle = '#0c0a10'; c.beginPath(); c.arc(x, y, r * 0.3, 0, Math.PI * 2); c.fill();
          }
        });
      },
    },
    atelje: {
      far(c, R, h) {
        c.fillStyle = '#120808'; c.fillRect(0, 0, 600, 280);
        h.wrap(() => {
          for (let k = 0; k < 9; k++) { const x = 20 + k * 66; c.fillStyle = ['#2a0e10', '#1a1420', '#22180e'][k % 3]; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 40, 0); c.quadraticCurveTo(x + 50, 120, x + 30, 190 + R() * 40); c.lineTo(x + 6, 200); c.quadraticCurveTo(x - 6, 100, x, 0); c.fill(); }
        });
      },
      mid(c, R, h) {
        h.wrap(() => {
          for (let k = 0; k < 10; k++) { const x = R() * 800; c.strokeStyle = 'rgba(230,220,200,0.12)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (R() - 0.5) * 200, 280); c.stroke(); }
          for (let k = 0; k < 5; k++) { const x = R() * 800, y = 230; c.fillStyle = '#1a0c0c'; c.fillRect(x - 10, y, 20, 30); c.fillStyle = '#3a1418'; c.fillRect(x - 12, y - 6, 24, 8); c.fillRect(x - 12, y + 28, 24, 8); }
        });
      },
    },
  };
  Object.keys(bgs).forEach(id => {
    const h = city(id);
    h.bgFar = bgs[id].far; h.bgMid = bgs[id].mid;
    if (id === 'metro') {
      h.rock = (c, m, T, R, OUTL) => {
        c.fillStyle = m.mask ? '#5e645e' : '#2e322f'; c.fillRect(0, 0, 24, 24);
        if (m.mask) {
          c.fillStyle = '#b8bcae';
          for (let y = 0; y < 24; y += 6) for (let x = 0; x < 24; x += 6) { c.fillStyle = R() < 0.15 ? '#8a8e80' : '#a8ac9e'; c.fillRect(x + 0.6, y + 0.6, 4.8, 4.8); }
          c.fillStyle = 'rgba(40,30,20,0.35)'; for (let i = 0; i < 3; i++) c.fillRect(R() * 20, R() * 20, 3 + R() * 6, 2 + R() * 6);
        }
        if (m.up) { c.fillStyle = '#d8b020'; c.fillRect(0, 0, 24, 3); c.fillStyle = '#1a1a1a'; for (let x = 0; x < 24; x += 6) c.fillRect(x, 0, 3, 3); }
        if (m.dn) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 21, 24, 3); }
      };
    }
    Tiles.hook(id, h);
  });

  Art.add((scene) => {
    Art.sheet(scene, 'igla_mala', 18, 4, ['i'], (c) => {
      c.fillStyle = '#d8dce4'; c.beginPath(); c.moveTo(0, 1.4); c.lineTo(15, 1.2); c.lineTo(18, 2); c.lineTo(15, 2.8); c.lineTo(0, 2.6); c.closePath(); c.fill();
      c.fillStyle = '#111'; c.fillRect(1.5, 1.6, 2.5, 0.8);
      c.strokeStyle = 'rgba(200,40,40,0.9)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(2, 2); c.lineTo(-2, 3.5); c.stroke();
    });
  });

  const kit = (c) => {
    cityKit(c);
    const G = c.G, GR = c.GR;
    c.skare = (x, y, ph, side = 1) => { c.O.push({ type: 'skare', id: 'sk' + c.O.length, ...at(x, y), ph, side }); return c; };
    return c;
  };

  // ZONA 4: METRO — platforme, jarci s tračnicama i vlakovi koji jure; Krojač na stropu tunela
  function metro() {
    const W = 450, H = 32, GR = 24;
    const c = kit(course(W, H, GR)), G = c.G, S = c.S;
    G.fill(0, 0, W - 1, 9);
    const trains = [];
    const trench = (n, rails = [], keyAt) => {
      const x0 = c.X;
      G.carve(x0, GR, x0 + n - 1, GR + 1);
      rails.forEach(r => G.spikes(x0 + r, x0 + r, GR + 1));
      trains.push({ x1: T(x0), x2: T(x0 + n), y: T(GR + 2), period: 7 + (trains.length % 3) * 1.1, ph: trains.length * 2.3, dir: trains.length % 2 ? -1 : 1 });
      c.X += n; return x0;
    };
    c.put('checkpoint', 4).put('note', 8, S, 'N1').flat(10).konac(c.X - 2).put('cabinet', c.X + 2).flat(5).put('crawler', c.X).flat(3);
    trench(8, [4]); c.flat(5).put('cabinet', c.X - 2);
    trench(12, [3, 8]); c.flat(4).put('crawler', c.X - 1).flat(3);
    const s1 = c.X;
    c.lutka(s1 + 10, s1 + 2, s1 + 30).lutka(s1 + 24, s1 + 4, s1 + 32).put('cabinet', s1 + 6).put('cabinet', s1 + 18).konac(s1 + 28).flat(34);
    trench(14, [4, 9]); c.flat(3).put('battery', c.X - 1).flat(2);
    trench(10, [5]); c.flat(3).put('cabinet', c.X).flat(3);
    const s1b = c.X;
    c.lutka(s1b + 8, s1b + 1, s1b + 24).lutka(s1b + 18, s1b + 4, s1b + 26).put('cabinet', s1b + 13).konac(s1b + 4).konac(s1b + 22).flat(28);
    trench(12, [4, 8]); c.flat(3).put('crawler', c.X).put('checkpoint', c.X + 2).flat(5);
    const kx = trench(16, [3, 12]); c.put('key', kx + 8, GR + 1, 'K1');
    c.flat(3).put('checkpoint', c.X).put('note', c.X + 3, S, 'N2').flat(6).put('cabinet', c.X).flat(2).door('D1');
    // dio 2
    c.flat(2).put('checkpoint', c.X).flat(4);
    trench(10, [5]); c.flat(3).put('cabinet', c.X).flat(4);
    // okno za ventilaciju u stropu: drugi ključ gore
    const v = c.X; G.carve(v, 1, v + 2, GR - 1); G.fill(v - 1, 10, v - 1, GR - 3); G.fill(v + 3, 10, v + 3, GR - 3); G.plat(v, v + 2, 3); c.put('key', v + 1, 2, 'K2'); c.X += 3;
    c.flat(3).konac(c.X).flat(4);
    const s2 = c.X;
    c.lutka(s2 + 8, s2 + 2, s2 + 34).lutka(s2 + 20, s2 + 2, s2 + 34).lutka(s2 + 30, s2 + 6, s2 + 36).put('cabinet', s2 + 4).put('cabinet', s2 + 14).put('cabinet', s2 + 26).konac(s2 + 11).put('battery', s2 + 33).flat(38);
    trench(12, [3, 8]); c.flat(3).put('crawler', c.X).flat(2);
    trench(14, [3, 7, 11]); c.flat(4).put('cabinet', c.X - 1).flat(2);
    const s3 = c.X;
    c.lutka(s3 + 10, s3 + 1, s3 + 26).lutka(s3 + 20, s3 + 2, s3 + 28).put('cabinet', s3 + 4).put('cabinet', s3 + 15).konac(s3 + 25).put('battery', s3 + 27).flat(30);
    trench(8, [4]); c.flat(3);
    trench(16, [4, 8, 12]); c.flat(3).put('checkpoint', c.X).flat(3).put('cabinet', c.X).flat(3);
    trench(9, [4]); c.flat(3).put('cabinet', c.X).flat(2).door('D2');
    c.flat(3).put('note', c.X, S, 'N3').flat(4).put('exit', c.X).flat(4);
    const krojaci = [
      { id: 'K_1', x1: T(20), x2: T(kx + 20), cy: T(10) },
      { id: 'K_2', x1: T(v - 30), x2: T(c.X - 20), cy: T(10) },
      { id: 'K_3', dormant: 'K2', x1: T(s2), x2: T(c.X - 10), cy: T(10) },
    ];
    return {
      theme: 'metro', W, H, grid: G.g, trunks: [], objects: c.O, monsters: [], krojaci, trains, doors: c.doors, start: at(2, S), doorTex: 'vrata_grad', exitTex: 'izlaz_grad',
      notes: {
        N1: 'Stara stanica metroa.\nVlakovi još voze. Bez vozača.\n\nKad zatrubi i zasvijetli — makni se s tračnica!',
        N2: 'Tračnica u sredini je pod strujom.\nPreskoči je.\n\nKljuč je pao među tračnice.',
        N3: 'Gore je robna kuća.\nU izlozima stoje lutke.\nSvjetla se gase sama od sebe.',
      },
    };
  }

  // ZONA 5: ROBNA KUĆA — tri razine; svjetla se gase, a u mraku lutke hodaju i kad ih gledaš (osim pod svjetiljkom)
  function robna() {
    const W = 440, H = 40, GR = 36;
    const c = kit(course(W, H, GR)), G = c.G, S = c.S;
    G.fill(0, 0, W - 1, 6);
    // prizemlje
    c.put('checkpoint', 4).put('note', 8, S, 'N1').flat(10);
    let s = c.X;
    c.lutka(s + 8, s + 1, s + 40).lutka(s + 20, s + 1, s + 40).lutka(s + 33, s + 4, s + 42).put('cabinet', s + 3).put('cabinet', s + 14).put('cabinet', s + 27).konac(s + 24).put('crawler', s + 38).flat(44);
    // police s prvim ključem
    G.plat(c.X, c.X + 4, GR - 2); G.plat(c.X + 3, c.X + 7, GR - 4); G.plat(c.X, c.X + 4, GR - 6); G.plat(c.X + 3, c.X + 7, GR - 8); G.plat(c.X, c.X + 4, GR - 10); G.plat(c.X + 2, c.X + 10, GR - 12);
    c.put('key', c.X + 9, GR - 13, 'K1').put('battery', c.X + 3, GR - 13).flat(12);
    c.put('cabinet', c.X).flat(3).pit(3).flat(3).put('checkpoint', c.X).flat(3);
    s = c.X;
    c.lutka(s + 9, s + 1, s + 34).lutka(s + 24, s + 3, s + 36).put('cabinet', s + 4).put('cabinet', s + 17).put('cabinet', s + 30).konac(s + 13).put('battery', s + 34).flat(37);
    c.crumbles(9).flat(3).put('crawler', c.X).flat(3);
    // pokretne stepenice gore na prvi kat
    for (let i = 0; i < 10; i++) G.fill(c.X + i * 2, GR - 1 - i, c.X + i * 2 + 1, GR - 1);
    c.X += 20; G.fill(c.X, GR - 10, W - 1, GR - 1);
    const F1 = GR - 10, S1 = F1 - 1;
    c.flat(3);
    // vrata na katu
    G.fill(c.X, 0, c.X + 5, F1 - 5); G.carve(c.X + 2, F1 - 4, c.X + 3, F1 - 1, 'D'); c.doors.push(door('D1', c.X + 2, F1 - 4)); c.X += 6;
    c.flat(2).put('checkpoint', c.X, S1).put('note', c.X + 3, S1, 'N2').flat(6);
    s = c.X;
    c.lutka(s + 10, s + 1, s + 44, S1).lutka(s + 24, s + 1, s + 44, S1).lutka(s + 38, s + 10, s + 46, S1)
      .put('cabinet', s + 5, S1).put('cabinet', s + 17, S1).put('cabinet', s + 31, S1).konac(s + 13, S1).konac(s + 35, S1).put('battery', s + 42, S1).flat(48);
    // rupa u podu s drugim ključem dolje u skladištu
    const hx = c.X; G.carve(hx, F1, hx + 5, F1 + 5); c.put('key', hx + 3, F1 + 5, 'K2').put('crawler', hx + 1, F1 + 5); c.X += 6;
    c.flat(4).put('cabinet', c.X, S1).flat(3).put('checkpoint', c.X, S1).flat(4);
    s = c.X;
    c.lutka(s + 8, s + 1, s + 26, S1).lutka(s + 19, s + 2, s + 28, S1).put('cabinet', s + 4, S1).put('cabinet', s + 14, S1).put('cabinet', s + 25, S1).konac(s + 11, S1).flat(30);
    // okno dizala: penji se po zidu na drugi kat
    const F2 = F1 - 10, S2 = F2 - 1;
    G.fill(c.X + 4, F2, W - 1, F1 - 1);
    c.X += 4;
    c.flat(3);
    s = c.X;
    c.lutka(s + 10, s + 1, s + 40, S2).lutka(s + 26, s + 4, s + 42, S2).put('cabinet', s + 5, S2).put('cabinet', s + 19, S2).put('cabinet', s + 33, S2).konac(s + 15, S2).put('crawler', s + 37, S2).flat(44);
    c.put('cabinet', c.X, S2).flat(3);
    s = c.X;
    c.lutka(s + 9, s + 1, s + 28, S2).lutka(s + 21, s + 3, s + 30, S2).put('cabinet', s + 4, S2).put('cabinet', s + 15, S2).put('cabinet', s + 27, S2).konac(s + 12, S2).konac(s + 24, S2).put('battery', s + 29, S2).flat(32);
    c.put('cabinet', c.X, S2).flat(2);
    G.fill(c.X, 0, c.X + 5, F2 - 5); G.carve(c.X + 2, F2 - 4, c.X + 3, F2 - 1, 'D'); c.doors.push(door('D2', c.X + 2, F2 - 4)); c.X += 6;
    c.flat(3).put('note', c.X, S2, 'N3').flat(4).put('exit', c.X, S2).flat(6);
    const krojaci = [
      { id: 'K_1', x1: T(20), x2: T(hx - 60), cy: T(7) },
      { id: 'K_2', dormant: 'K2', x1: T(hx - 20), x2: T(c.X - 10), cy: T(7) },
    ];
    return {
      theme: 'robna', W, H, grid: G.g, trunks: [], objects: c.O, monsters: [], krojaci, blackout: { period: 10, dur: 3.2, ph: 2 }, doors: c.doors, start: at(2, S), doorTex: 'vrata_grad', exitTex: 'izlaz_grad',
      notes: {
        N1: 'Svjetla ovdje trepću pa se ugase.\nU mraku lutke hodaju čak i kad ih gledaš.\n\nOsim ako ih obasjaš svjetiljkom.',
        N2: 'Prije nego što se svjetla ugase,\nzatrepću.\n\nTada upali svjetiljku i okreni se prema njima.',
        N3: 'Iznad grada je stari toranj sa satom.\nKrojač tamo gore ima radionicu.\n\nČujem škare kako škljocaju u ritmu sata.',
      },
    };
  }

  // ZONA 6: TORANJ SA SATOM — tri sobe jedna iznad druge; penjanje, divovske škare, igle, Krojači na svakom katu
  function toranj() {
    const W = 62, H = 112;
    const G = grid(W, H);
    G.carve(10, 8, 51, 106);
    const O = [], cnt = {};
    const put = (type, x, y, id, extra) => { const p = { checkpoint: 'C', note: 'N', battery: 'B', key: 'K', cabinet: 'o', crawler: 'b', konac: 'k', lutka: 'l', skare: 'sk', igla: 'i', exit: 'E' }[type]; id = id || p + (cnt[p] = (cnt[p] || 0) + 1); O.push({ type, id, ...at(x, y), ...(extra || {}) }); };
    // soba 1 (dno, redovi 77–106): pregrada s vratima prema oknu desno
    G.fill(10, 76, 45, 76); G.fill(44, 77, 45, 102); G.carve(44, 103, 45, 106, 'D');
    put('checkpoint', 13, 106); put('note', 16, 106, 'N1'); put('cabinet', 22, 106); put('crawler', 30, 106); put('konac', 26, 106);
    put('lutka', 36, 106, null, { minX: T(18), maxX: T(43) });
    // stepenice od grana do ključa gore u sobi 1
    [[12, 105], [16, 103], [20, 101], [16, 99], [12, 97], [16, 95], [21, 93], [26, 91], [31, 89], [36, 87], [31, 85], [26, 83], [20, 81]].forEach(([x, y]) => G.plat(x, x + 3, y));
    put('key', 21, 80, 'K1'); put('battery', 37, 86);
    put('skare', 10, 93, null, { ph: 0, side: 1 }); put('skare', 43, 86, null, { ph: 1.1, side: -1 }); put('skare', 10, 99, null, { ph: 0.6, side: 1 });
    // okno 1 (x 46–51): penjanje uz zidove do sobe 2
    for (let y = 100; y > 78; y -= 6) G.plat(46, 47, y);
    put('skare', 51, 92, null, { ph: 0.4, side: -1 }); put('skare', 51, 82, null, { ph: 1.5, side: -1 });
    // soba 2 (redovi 43–75): pregrada lijevo s vratima prema oknu 2
    G.fill(16, 42, 51, 42); G.fill(16, 43, 17, 71); G.carve(16, 72, 17, 75, 'D');
    put('checkpoint', 42, 75); put('note', 38, 75, 'N2'); put('cabinet', 40, 75); put('konac', 34, 75); put('cabinet', 26, 75);
    put('lutka', 30, 75, null, { minX: T(19), maxX: T(43) }); put('lutka', 22, 75, null, { minX: T(19), maxX: T(43) });
    [[46, 74], [42, 72], [38, 70], [34, 68], [30, 66], [25, 64], [20, 62], [24, 60], [29, 58], [34, 56], [39, 54], [44, 52], [47, 50]].forEach(([x, y]) => G.plat(x, x + 3, y));
    put('key', 48, 49, 'K2'); put('battery', 22, 61); put('crawler', 36, 75);
    put('skare', 51, 66, null, { ph: 0.2, side: -1 }); put('skare', 18, 57, null, { ph: 1.0, side: 1 }); put('skare', 51, 54, null, { ph: 0.7, side: -1 });
    // okno 2 (x 10–15)
    for (let y = 70; y > 44; y -= 6) G.plat(12, 13, y);
    put('skare', 10, 62, null, { ph: 0.9, side: 1 }); put('skare', 15, 52, null, { ph: 0.3, side: -1 });
    // soba 3 (redovi 8–41): penjanje do otvora u krovu
    put('checkpoint', 19, 41); put('note', 22, 41, 'N3'); put('cabinet', 26, 41); put('konac', 30, 41);
    put('lutka', 40, 41, null, { minX: T(20), maxX: T(50) });
    [[44, 40], [48, 38], [44, 36], [39, 34], [34, 32], [29, 30], [24, 28], [19, 26], [14, 24], [19, 22], [24, 20], [29, 18], [34, 16], [39, 14]].forEach(([x, y]) => G.plat(x, x + 3, y));
    put('battery', 15, 23); put('crawler', 26, 41);
    put('skare', 51, 34, null, { ph: 0.5, side: -1 }); put('skare', 10, 22, null, { ph: 1.2, side: 1 }); put('skare', 51, 14, null, { ph: 0.1, side: -1 });
    G.plat(40, 50, 12); put('exit', 47, 11);
    const krojaci = [
      { id: 'K_1', x1: T(12), x2: T(42), cy: T(77) },
      { id: 'K_2', x1: T(20), x2: T(50), cy: T(43) },
      { id: 'K_3', x1: T(12), x2: T(50), cy: T(8) },
    ];
    return {
      theme: 'toranj', W, H, grid: G.g, trunks: [], objects: O, monsters: [], krojaci, doors: [door('D1', 44, 103), door('D2', 16, 72)], start: at(12, 106), doorTex: 'vrata_grad', exitTex: 'izlaz_grad',
      notes: {
        N1: 'Toranj sa satom.\nŠkare na zidovima reži u ritmu kazaljki.\n\nBroji. Pa skoči.',
        N2: 'Na svakom katu visi po jedan.\nIli je to uvijek isti — samo brži od mene?',
        N3: 'Na vrhu tornja je njegov atelje.\nTamo sašije sve što uhvati.\n\nKonac kojim visi — može se presjeći.',
      },
    };
  }

  // ZONA 7: KROJAČEV ATELJE — kratki prilaz i borba s Krojačem; nakon pobjede vrata prema svjetlu
  function atelje() {
    const W = 112, H = 34, GR = 30;
    const c = kit(course(W, H, GR)), G = c.G, S = c.S;
    G.fill(0, 0, W - 1, 8);
    c.put('checkpoint', 4).put('note', 8, S, 'N1').flat(8);
    G.fill(c.X + 2, GR - 6, c.X + 4, GR - 5); c.igla(c.X + 3, 0); c.flat(7);
    c.konac(c.X).flat(3).put('cabinet', c.X).flat(3);
    c.lutka(c.X + 6, c.X, c.X + 12).flat(13);
    G.fill(c.X + 2, GR - 6, c.X + 4, GR - 5); c.igla(c.X + 3, 1.2); c.flat(6);
    c.put('checkpoint', c.X, S, 'C2').put('note', c.X + 2, S, 'N2').flat(4);
    // arena
    const a0 = c.X;
    G.fill(a0, 9, a0 + 1, GR - 5);
    const x1 = a0 + 2, x2 = a0 + 44;
    G.fill(x2 + 1, 9, W - 1, GR - 1);
    G.plat(x1 + 3, x1 + 8, GR - 6); G.plat(x2 - 8, x2 - 3, GR - 6); G.plat(x1 + 18, x1 + 25, GR - 6); G.plat(x1 + 12, x1 + 14, GR - 2); G.plat(x1 + 15, x1 + 17, GR - 4); G.plat(x1 + 1, x1 + 2, GR - 2); G.plat(x1 + 4, x1 + 5, GR - 4); G.plat(x2 - 2, x2 - 1, GR - 2); G.plat(x2 - 5, x2 - 4, GR - 4);
    c.put('battery', x1 + 2, S, 'Bk1', ).put('battery', x2 - 2, S, 'Bk2');
    c.O.forEach(o => { if (o.id === 'Bk1' || o.id === 'Bk2') o.respawn = 16; });
    c.put('exit', x2 - 4, S);
    const kboss = {
      x1: T(x1), x2: T(x2 + 1), cy: T(9), ceilY: T(9), floorY: T(GR), top: T(9), trigger: T(x1 + 4),
      hangs: [T(x1 + 9) + 14, T(x2 - 9) + 10, T(x1 + 17) + 10, T(x1 + 26) + 14],
      lutke: [{ ...at(x1 + 2, S), minX: T(x1 + 1), maxX: T(x2) }, { ...at(x2 - 2, S), minX: T(x1 + 1), maxX: T(x2) }],
    };
    return {
      theme: 'atelje', W, H, grid: G.g, trunks: [], objects: c.O, monsters: [], kboss, doors: [], start: at(2, S), doorTex: 'vrata_grad', exitTex: 'izlaz_grad',
      notes: {
        N1: 'Atelje. Svuda vise odijela.\nSva su sašivena za nekoga mog rasta.',
        N2: 'Kad visi na koncu — presijeci konac.\nKad padne — udri.\nKad zaglavi na podu — udri.\n\nIza njega su vrata. Iza vrata je svjetlo.',
      },
    };
  }

  Level.addZones(2, [metro, robna, toranj, atelje]);
})();
