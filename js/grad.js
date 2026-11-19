// Noćnik — svijet 3: GRAD (teme, likovi, zone 1–3)
(() => {
  const OUTL = '#150f19';
  const { course, trunkOf } = window.Suma;
  const { grid, at, door } = Level.tools;
  const T = (x) => x * TILE;

  // ================= TEME =================
  const base = (o) => Object.assign({
    city: true, extra: null, hideTex: 'kutija', crawler: 'stakor',
    spLight: 'rgba(120,100,90,0.35)', spDark: 'rgba(10,8,8,0.4)', rimL: 'rgba(255,200,150,0.1)',
    plank: ['#4a4a52', '#2a2a30', '#6a6a72'], drip: [1.6, 3.2], surface: 'ash',
  }, o);
  Object.assign(THEMES, {
    ulice: base({
      id: 'ulice', name: 'Ulice', moon: true,
      rock: ['#5a3a30', '#42291f', '#2e1c16'], glow: [0xffb860, 0xff6a8a], dark: 'rgba(6,6,14,', darkA: 0.8, cam: '#0a0a16',
      drone: { f: 46.2, f3: 69.3, lp: 380, wind: 500, windG: 0.016 }, amb: 'city',
    }),
    krovovi: base({
      id: 'krovovi', name: 'Krovovi', moon: true, moonTint: 0xfff0d8,
      rock: ['#4a4a52', '#36363e', '#26262c'], glow: [0xffc070, 0x9fd8ff], dark: 'rgba(5,7,16,', darkA: 0.74, cam: '#0a0e1e',
      drone: { f: 51.9, f3: 77.8, lp: 600, wind: 800, windG: 0.03 }, amb: 'city',
    }),
    tvornica: base({
      id: 'tvornica', name: 'Tvornica', moon: false,
      rock: ['#3e3430', '#2e2622', '#201a18'], glow: [0xffd890, 0x9fe0ff], dark: 'rgba(8,6,6,', darkA: 0.88, cam: '#0c0a0a', ceilGlow: 11,
      drone: { f: 41.2, f3: 61.7, lp: 300, wind: 300, windG: 0.012 }, amb: 'factory',
    }),
  });

  const city = (id) => ({
    // cigle i prozori umjesto kamena
    rock(c, m, T, R) {
      const g = c.createLinearGradient(0, 0, 0, 24); g.addColorStop(0, T.rock[0]); g.addColorStop(1, T.rock[1]);
      c.fillStyle = m.mask ? g : T.rock[2]; c.fillRect(0, 0, 24, 24);
      c.strokeStyle = 'rgba(15,10,8,0.55)'; c.lineWidth = 0.7;
      for (let y = 0, k = 0; y < 24; y += 6, k++) {
        c.beginPath(); c.moveTo(0, y + 0.3); c.lineTo(24, y + 0.3); c.stroke();
        for (let x = (k % 2) * 6; x < 24; x += 12) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 6); c.stroke(); }
      }
      for (let i = 0; i < 4; i++) { c.fillStyle = R() < 0.5 ? 'rgba(255,220,200,0.06)' : 'rgba(0,0,0,0.18)'; c.fillRect(((R() * 2) | 0) * 12 + (R() < 0.5 ? 0 : 6), ((R() * 4) | 0) * 6, 12, 6); }
      if (!m.mask && m.v === 0 && id !== 'tvornica') {
        const lit = R() < 0.25;
        c.fillStyle = OUTL; c.fillRect(5, 4, 14, 17);
        c.fillStyle = lit ? '#e8b860' : '#141822'; c.fillRect(6.5, 5.5, 11, 14);
        if (lit) { c.fillStyle = 'rgba(80,40,10,0.6)'; c.fillRect(6.5, 5.5, 4, 14); }
        c.fillStyle = OUTL; c.fillRect(11.5, 5.5, 1, 14); c.fillRect(6.5, 12, 11, 1);
        c.fillStyle = 'rgba(200,190,170,0.35)'; c.fillRect(4, 21, 16, 1.6);
      }
      if (m.up) {
        c.fillStyle = id === 'krovovi' ? '#2a2a30' : '#3a3a40'; c.fillRect(0, 0, 24, 3.5);
        c.fillStyle = 'rgba(220,210,190,0.25)'; c.fillRect(0, 0, 24, 0.8);
        c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 3.5, 24, 1);
      }
      if (m.lf) { c.fillStyle = T.rimL; c.fillRect(0, 0, 1.6, 24); }
      if (m.rt) { c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(22, 0, 2, 24); }
      if (m.dn) { c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 21, 24, 3); }
    },
    plank(c, kind, T, OUT) {
      // požarne stube / balkon od rešetke
      c.fillStyle = '#3a3a42'; c.fillRect(kind === 0 ? 1 : 0, 1, kind === 2 ? 23 : 24, 3.5);
      c.strokeStyle = OUT; c.lineWidth = 0.7; c.strokeRect(kind === 0 ? 1 : 0, 1, kind === 2 ? 23 : 24, 3.5);
      c.fillStyle = '#15151a'; for (let x = 2; x < 23; x += 3) c.fillRect(x, 2, 1.6, 1.6);
      c.strokeStyle = '#4a4a54'; c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(0, 8); c.lineTo(24, 8); c.stroke();
      for (let x = 3; x < 24; x += 6) { c.beginPath(); c.moveTo(x, 4.5); c.lineTo(x, 8); c.stroke(); }
      if (kind !== 1) { c.strokeStyle = '#2a2a30'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(kind === 0 ? 2 : 22, 4.5); c.lineTo(kind === 0 ? 2 : 22, 13); c.stroke(); }
    },
    spikeCols: ['#c8eef6', '#4a6a78'],
    deco(c, i, T, h) {
      const { R, ell, cobweb } = h;
      switch (i) {
        case 0: { const g = c.createRadialGradient(12, 23, 0, 12, 23, 10); g.addColorStop(0, 'rgba(255,120,170,0.6)'); g.addColorStop(1, 'rgba(255,120,170,0)'); c.fillStyle = g; c.fillRect(0, 18, 24, 6); ell(12, 23, 8, 1.2, 'rgba(60,60,80,0.8)', 0.3); break; }
        case 1: c.fillStyle = 'rgba(200,220,230,0.5)'; c.fillRect(9, 15, 6, 9); c.strokeStyle = OUTL; c.lineWidth = 0.5; c.strokeRect(9, 15, 6, 9); ell(12, 17, 1, 1.6, '#ffd060', 0); c.fillStyle = '#f0e8d0'; c.fillRect(11, 18, 2, 5); break;
        case 2: ell(12, 19, 7, 5, '#1c1c22'); c.fillStyle = '#2a2a30'; c.beginPath(); c.moveTo(10, 14.5); c.lineTo(12, 11); c.lineTo(14, 14.5); c.fill(); break;
        case 3: c.fillStyle = '#5a6a3a'; c.fillRect(6, 17, 3, 7); c.fillStyle = '#8a3a3a'; c.save(); c.translate(15, 22); c.rotate(1.4); c.fillRect(-1.5, -4, 3, 7); c.restore(); ell(19, 22.5, 2, 1.5, '#aaa', 0.4); break;
        case 4: c.fillStyle = '#c8c0a8'; c.save(); c.translate(12, 22); c.rotate(-0.15); c.fillRect(-7, -2, 14, 3); c.restore(); c.strokeStyle = 'rgba(40,40,40,0.5)'; c.lineWidth = 0.3; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(6, 21 + k * 0.8); c.lineTo(17, 20 + k * 0.8); c.stroke(); } break;
        case 5: ell(8, 22, 3, 1.6, '#3a2a20'); ell(15, 22.2, 3, 1.6, '#2a1e18'); break;
        case 6: c.strokeStyle = '#111'; c.lineWidth = 0.8; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(k * 8, 0); c.quadraticCurveTo(k * 8 + 6, 10 + k * 3, 24 - k * 4, 2); c.stroke(); } break;
        case 7: c.fillStyle = '#4a4a50'; c.fillRect(0, 0, 24, 4); c.strokeStyle = OUTL; c.lineWidth = 0.6; c.strokeRect(0, 0, 24, 4); ell(15, 7 + R() * 3, 0.8, 1.2, 'rgba(160,200,220,0.7)', 0); break;
        case 8: c.strokeStyle = '#111'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 10); c.stroke(); ell(12, 12.5, 2.4, 3, 'rgba(200,200,190,0.5)', 0.4); break;
        case 9: c.strokeStyle = '#ddd'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(0, 3); c.quadraticCurveTo(12, 7, 24, 3); c.stroke(); c.fillStyle = '#7a3a3a'; c.fillRect(4, 4.5, 5, 8); c.fillStyle = '#d8d0c0'; c.fillRect(13, 5.5, 6, 6); break;
        case 10: cobweb(); break;
        case 11: c.strokeStyle = '#111'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 6); c.stroke(); c.fillStyle = '#2a2a30'; c.beginPath(); c.moveTo(6, 10); c.lineTo(18, 10); c.lineTo(14, 6); c.lineTo(10, 6); c.closePath(); c.fill(); ell(12, 10.5, 2.5, 1.2, '#ffe0a0', 0); break;
      }
    },
    bgFar(c, R, h) {
      if (id === 'tvornica') {
        c.fillStyle = '#120e0e'; c.fillRect(0, 0, 600, 280);
        h.wrap(() => {
          for (let x = 30; x < 600; x += 150) {
            c.fillStyle = '#1e2430'; c.fillRect(x, 40, 90, 120);
            c.fillStyle = 'rgba(140,170,210,0.18)'; for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) c.fillRect(x + 4 + k * 29, 44 + j * 29, 25, 25);
            c.fillStyle = '#0c0a0a'; c.fillRect(x - 4, 160, 98, 6);
          }
        });
        return;
      }
      const g = c.createLinearGradient(0, 0, 0, 280); g.addColorStop(0, '#060814'); g.addColorStop(0.6, '#141830'); g.addColorStop(1, '#3a2a2a');
      c.fillStyle = g; c.fillRect(0, 0, 600, 280);
      const stars = []; for (let i = 0; i < 40; i++) stars.push([R() * 600, R() * 120, R()]);
      const blds = []; let x = 0; while (x < 600) { const w = 20 + R() * 40, hh = 60 + R() * 110; blds.push([x, w, hh]); x += w + R() * 6; }
      h.wrap(() => {
        stars.forEach(([x, y, a]) => { c.fillStyle = `rgba(255,255,255,${0.2 + a * 0.4})`; c.fillRect(x, y, 0.8, 0.8); });
        blds.forEach(([x, w, hh]) => {
          c.fillStyle = '#0c0e1c'; c.fillRect(x, 280 - hh, w, hh);
          for (let yy = 280 - hh + 6; yy < 270; yy += 9) for (let xx = x + 3; xx < x + w - 4; xx += 7) if (R() < 0.12) { c.fillStyle = R() < 0.7 ? 'rgba(255,200,120,0.55)' : 'rgba(160,200,255,0.4)'; c.fillRect(xx, yy, 3, 4); }
          if (R() < 0.2) { c.fillStyle = '#0c0e1c'; c.fillRect(x + w / 2 - 0.5, 280 - hh - 18, 1, 18); c.fillStyle = 'rgba(255,60,60,0.8)'; c.fillRect(x + w / 2 - 1, 280 - hh - 19, 2, 2); }
        });
      });
    },
    bgMid(c, R, h) {
      if (id === 'tvornica') {
        h.wrap(() => {
          for (let k = 0; k < 6; k++) { const x = R() * 800; c.fillStyle = '#1a1414'; c.fillRect(x, 0, 10, 280); c.fillRect(x - 30, 60 + R() * 60, 70, 8); }
          for (let k = 0; k < 5; k++) { const x = R() * 800; c.strokeStyle = '#100c0c'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 80 + R() * 80); c.stroke(); c.fillStyle = '#2a2020'; c.fillRect(x - 12, 80 + R() * 80, 24, 50); }
        });
        return;
      }
      const blds = []; let x = 0; while (x < 800) { const w = 50 + R() * 70, hh = 100 + R() * 130; blds.push([x, w, hh]); x += w + 10 + R() * 30; }
      h.wrap(() => {
        blds.forEach(([x, w, hh]) => {
          c.fillStyle = '#151224'; c.fillRect(x, 280 - hh, w, hh);
          for (let yy = 280 - hh + 10; yy < 270; yy += 16) for (let xx = x + 6; xx < x + w - 8; xx += 14) { const r = R(); c.fillStyle = r < 0.1 ? 'rgba(255,190,110,0.5)' : 'rgba(0,0,0,0.35)'; c.fillRect(xx, yy, 7, 9); }
          if (R() < 0.4) { c.fillStyle = '#151224'; c.fillRect(x + w * 0.6, 280 - hh - 26, 18, 18); c.fillRect(x + w * 0.6 + 2, 280 - hh - 8, 2, 8); c.fillRect(x + w * 0.6 + 14, 280 - hh - 8, 2, 8); }
        });
      });
    },
  });
  ['ulice', 'krovovi', 'tvornica'].forEach(id => Tiles.hook(id, city(id)));

  // ================= LIKOVI =================
  Art.add((scene) => {
    const { sheet, ell, line, limb, radial } = Art;

    // ---- KROJAČ: čovjek u fraku s cilindrom, šest paukovih nogu iz leđa ----
    const drawK = (c, p) => {
      const b = p.bob || 0;
      // paukove noge (iza tijela)
      const leg = (side, i, ph) => {
        const bx = 36 + side * 4, by = 46 + b;
        const ang = (-0.9 + i * 0.75) + Math.sin(ph) * 0.25;
        const kx = bx + side * Math.cos(ang) * 22, ky = by + Math.sin(ang) * 22 - 14;
        const fx = kx + side * 12 + Math.sin(ph) * 3, fy = Math.min(98, ky + 34 + i * 4);
        limb(c, [[bx, by], [kx, ky], [fx, fy]], i % 2 ? '#1a1418' : '#231c22', 2.2);
        c.strokeStyle = 'rgba(160,150,170,0.35)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(kx, ky); c.lineTo(fx, fy); c.stroke();
      };
      for (let i = 0; i < 3; i++) { leg(-1, i, p.ph + i * 2.1); leg(1, i, p.ph + i * 2.1 + 1); }
      // ljudske noge u hlačama
      limb(c, [[32, 70 + b], [31 + p.lx * 0.5, 84], [30 + p.lx, 98]], '#16141a', 3.2);
      limb(c, [[40, 70 + b], [41 - p.lx * 0.5, 84], [42 - p.lx, 98]], '#1c1a22', 3.2);
      ell(c, 30 + p.lx, 98, 3.4, 1.4, '#0a0808', OUTL, 0.5); ell(c, 42 - p.lx, 98, 3.4, 1.4, '#0a0808', OUTL, 0.5);
      // frak
      c.fillStyle = '#1e1a24';
      c.beginPath(); c.moveTo(26, 40 + b); c.lineTo(46, 40 + b); c.lineTo(48, 70 + b); c.lineTo(44, 82 + b); c.lineTo(40, 70 + b); c.lineTo(32, 70 + b); c.lineTo(28, 82 + b); c.lineTo(24, 70 + b); c.closePath(); c.fill();
      c.strokeStyle = OUTL; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#d8d0c0'; c.beginPath(); c.moveTo(33, 40 + b); c.lineTo(39, 40 + b); c.lineTo(36, 54 + b); c.closePath(); c.fill();
      c.fillStyle = '#6a1018'; c.beginPath(); c.moveTo(33.5, 41 + b); c.lineTo(38.5, 41 + b); c.lineTo(36, 44 + b); c.closePath(); c.fill();
      // metar oko vrata
      c.strokeStyle = '#c8b040'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(30, 40 + b); c.quadraticCurveTo(28, 56 + b, 27, 64 + b); c.moveTo(42, 40 + b); c.quadraticCurveTo(44, 56 + b, 45, 66 + b); c.stroke();
      // ruke: škare i igla
      const armL = p.arm || 0;
      limb(c, [[27, 43 + b], [19 - armL * 4, 54 + b - armL * 6], [14 - armL * 8, 64 + b - armL * 14]], '#1e1a24', 2.6);
      limb(c, [[45, 43 + b], [53 + armL * 4, 54 + b - armL * 6], [58 + armL * 8, 64 + b - armL * 14]], '#1e1a24', 2.6);
      const sx = 14 - armL * 8, sy = 64 + b - armL * 14;
      ell(c, sx, sy, 1.8, 1.8, '#d8d4c8', OUTL, 0.4);
      c.strokeStyle = '#b8bcc4'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - 4 - p.snip, sy + 12); c.moveTo(sx, sy); c.lineTo(sx - 4 + p.snip, sy + 12); c.stroke();
      c.beginPath(); c.arc(sx + 2, sy - 2, 1.6, 0, Math.PI * 2); c.arc(sx + 3, sy + 1, 1.6, 0, Math.PI * 2); c.stroke();
      const nx = 58 + armL * 8, ny = 64 + b - armL * 14;
      ell(c, nx, ny, 1.8, 1.8, '#d8d4c8', OUTL, 0.4);
      c.strokeStyle = '#d8dce4'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(nx, ny - 3); c.lineTo(nx + 1, ny + 12); c.stroke();
      c.strokeStyle = 'rgba(200,40,40,0.8)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(nx, ny - 2); c.quadraticCurveTo(nx + 8, ny + 10, nx + 3, ny + 22); c.stroke();
      // glava: dugo blijedo lice, šest očiju, zašivena usta
      c.fillStyle = '#d4cfc2';
      c.beginPath(); c.moveTo(36, 22 + b); c.bezierCurveTo(45, 22 + b, 45, 34 + b, 41, 41 + b); c.quadraticCurveTo(36, 44 + b, 31, 41 + b); c.bezierCurveTo(27, 34 + b, 27, 22 + b, 36, 22 + b); c.fill();
      c.strokeStyle = OUTL; c.lineWidth = 0.8; c.stroke();
      [[-5, -3], [0, -4], [5, -3], [-4, 1], [4, 1], [0, 0]].forEach(([dx, dy]) => ell(c, 36 + dx, 32 + dy + b, 1.4, 1.4, '#0a0204', null));
      c.strokeStyle = '#2a0a0e'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(31, 37.5 + b); c.quadraticCurveTo(36, 40.5 + b, 41, 37.5 + b); c.stroke();
      for (let k = 0; k < 5; k++) { const x = 32 + k * 2; c.beginPath(); c.moveTo(x, 37 + b + (k === 2 ? 1.2 : 0.4)); c.lineTo(x + 0.8, 40 + b); c.stroke(); }
      // cilindar
      c.fillStyle = '#0e0c12'; c.fillRect(27, 20 + b, 18, 2.4); c.fillRect(30, 4 + b, 12, 17);
      c.strokeStyle = OUTL; c.lineWidth = 0.8; c.strokeRect(30, 4 + b, 12, 17);
      c.fillStyle = '#5a1018'; c.fillRect(30, 17 + b, 12, 2.4);
    };
    const KF = [];
    for (let i = 0; i < 4; i++) KF.push({ name: 'crawl' + i, ph: i * 1.57, lx: [3, 1, -3, -1][i], bob: i % 2 ? -0.6 : 0, arm: 0.2, snip: 1 });
    KF.push({ name: 'stand', ph: 0.4, lx: 2, bob: 0, arm: 0, snip: 2 });
    KF.push({ name: 'drop', ph: 2, lx: 0, bob: 0, arm: 1, snip: 3.5 });
    sheet(scene, 'krojac', 72, 100, KF, drawK);
    sheet(scene, 'oci_krojac', 20, 12, ['x'], (c) => {
      [[-5, -3], [0, -4], [5, -3], [-4, 1], [4, 1], [0, 0]].forEach(([dx, dy]) => {
        const x = 10 + dx, y = 7 + dy;
        c.fillStyle = radial(c, x, y, 0, 3, [[0, 'rgba(255,60,40,1)'], [0.5, 'rgba(255,30,20,0.5)'], [1, 'rgba(255,30,20,0)']]); c.fillRect(x - 3, y - 3, 6, 6);
      });
    });

    // ---- LUTKA: krojačka lutka bez lica ----
    const drawL = (c, p) => {
      const skin = '#d8cfbe', sh = '#a89c88';
      const j = (x, y) => ell(c, x, y, 1.6, 1.6, sh, OUTL, 0.4);
      // noge
      limb(c, [[13, 34], [12 + p.l1, 45], [12 + p.l1 * 1.5, 56]], skin, 2.6);
      limb(c, [[17, 34], [18 + p.l2, 45], [18 + p.l2 * 1.5, 56]], skin, 2.6);
      j(12 + p.l1, 45); j(18 + p.l2, 45);
      // trup
      c.fillStyle = skin;
      c.beginPath(); c.moveTo(9, 14); c.quadraticCurveTo(15, 12, 21, 14); c.lineTo(19, 26); c.quadraticCurveTo(21, 31, 19, 35); c.lineTo(11, 35); c.quadraticCurveTo(9, 31, 11, 26); c.closePath(); c.fill();
      c.strokeStyle = OUTL; c.lineWidth = 0.8; c.stroke();
      c.strokeStyle = 'rgba(80,70,60,0.5)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(15, 14); c.lineTo(15, 34); c.stroke();
      c.strokeStyle = '#c8b040'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(10, 15); c.lineTo(19, 30); c.stroke();
      // ruke
      const arm = (sx, a1, a2) => {
        const ex = sx + Math.cos(a1) * 9, ey = 15 + Math.sin(a1) * 9, hx = ex + Math.cos(a2) * 9, hy = ey + Math.sin(a2) * 9;
        limb(c, [[sx, 15], [ex, ey], [hx, hy]], skin, 2); j(ex, ey);
        for (let k = -1; k <= 1; k++) limb(c, [[hx, hy], [hx + Math.cos(a2 + k * 0.4) * 3, hy + Math.sin(a2 + k * 0.4) * 3]], skin, 0.6);
      };
      arm(9, p.a1, p.a2); arm(21, p.b1, p.b2);
      // vrat i glava-jaje
      c.fillStyle = skin; c.fillRect(13.5, 9, 3, 4);
      c.save(); c.translate(15, 6); c.rotate(p.tilt);
      ell(c, 0, 0, 4.4, 5.6, skin, OUTL, 0.8);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-1.4, -2, 1.2, 2, 0, 0, Math.PI * 2); c.fill();
      if (p.eyes) { ell(c, -1.6, 0, 0.9, 1.1, '#050302', null); ell(c, 1.6, 0, 0.9, 1.1, '#050302', null); }
      c.restore();
    };
    sheet(scene, 'lutka', 30, 57, [
      { name: 'pose0', l1: -1, l2: 1, a1: 1.9, a2: 1.7, b1: 1.2, b2: 1.4, tilt: 0 },
      { name: 'pose1', l1: -1, l2: 2, a1: 2.3, a2: 2.1, b1: -0.3, b2: -0.2, tilt: 0.35 },
      { name: 'pose2', l1: 0, l2: 0, a1: 2.6, a2: -2.9, b1: 0.4, b2: -0.1, tilt: -0.5 },
      { name: 'walk0', l1: -4, l2: 4, a1: 0.2, a2: 0.1, b1: 0.1, b2: 0, tilt: 0.15, eyes: true },
      { name: 'walk1', l1: 4, l2: -4, a1: 0.1, a2: 0, b1: 0.2, b2: 0.1, tilt: -0.1, eyes: true },
    ], drawL);

    // ---- štakor ----
    const drawRat = (c, p) => {
      c.strokeStyle = '#8a6a6a'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(4, 9); c.quadraticCurveTo(0, 6 + p.bob * 3, 1, 3); c.stroke();
      ell(c, 11, 8.5 + p.bob, 7, 4, '#3a3234', OUTL, 0.8);
      ell(c, 18, 8 + p.bob, 3.6, 2.8, '#4a4044', OUTL, 0.7);
      ell(c, 21.5, 8.6 + p.bob, 1, 0.8, '#d88a9a', null);
      ell(c, 16.5, 5.4 + p.bob, 1.6, 1.4, '#6a5a5e', OUTL, 0.5);
      ell(c, 19, 7.2 + p.bob, 0.7, 0.7, '#ff4030', null);
      limb(c, [[8, 11], [7 + p.step, 13.5]], '#2a2224', 1); limb(c, [[14, 11], [15 - p.step, 13.5]], '#2a2224', 1);
    };
    sheet(scene, 'stakor', 24, 14, [{ name: 'c0', step: 1.2, bob: 0 }, { name: 'c1', step: -1.2, bob: -0.3 }], drawRat);
    scene.anims.create({ key: 'stakor-walk', frames: [{ key: 'stakor', frame: 'c0' }, { key: 'stakor', frame: 'c1' }], frameRate: 9, repeat: -1 });

    // ---- predmeti ----
    sheet(scene, 'kutija', 32, 26, ['k'], (c) => {
      c.fillStyle = '#8a6a44'; c.fillRect(2, 6, 28, 20); c.strokeStyle = OUTL; c.lineWidth = 0.9; c.strokeRect(2, 6, 28, 20);
      c.fillStyle = '#9e7c50'; c.beginPath(); c.moveTo(2, 6); c.lineTo(-1, 1); c.lineTo(13, 2); c.lineTo(16, 6); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(30, 6); c.lineTo(32, 0); c.lineTo(19, 2); c.lineTo(16, 6); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(2, 6, 28, 3);
      c.strokeStyle = 'rgba(60,40,20,0.6)'; c.lineWidth = 0.6; c.strokeRect(8, 13, 9, 6); c.beginPath(); c.moveTo(20, 16); c.lineTo(27, 22); c.stroke();
    });
    sheet(scene, 'vrata_grad', 48, 96, ['v'], (c) => {
      c.fillStyle = '#2a2e34'; c.fillRect(2, 2, 44, 94); c.strokeStyle = OUTL; c.lineWidth = 1.2; c.strokeRect(2, 2, 44, 94);
      for (let y = 8; y < 92; y += 10) { c.fillStyle = '#3a3e46'; c.fillRect(5, y, 38, 6); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(5, y + 6, 38, 1.5); }
      c.fillStyle = 'rgba(120,60,30,0.35)'; c.fillRect(6, 70, 14, 22); c.fillRect(30, 12, 10, 16);
      c.fillStyle = '#7a7f88'; c.fillRect(30, 46, 9, 11); c.strokeStyle = OUTL; c.lineWidth = 0.8; c.strokeRect(30, 46, 9, 11);
      c.beginPath(); c.arc(34.5, 46, 3.4, Math.PI, 0); c.strokeStyle = '#7a7f88'; c.lineWidth = 1.4; c.stroke();
      ell(c, 34.5, 51, 1, 1, '#111', null);
      c.fillStyle = '#e8e0c0'; c.font = 'bold 7px serif'; c.fillText('X', 10, 30);
    });
    sheet(scene, 'ulicna_lampa', 30, 80, ['l'], (c) => {
      c.fillStyle = '#1a1a20'; c.fillRect(13, 14, 3, 66); c.fillRect(10, 76, 9, 4);
      c.strokeStyle = '#1a1a20'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(14.5, 16); c.quadraticCurveTo(15, 8, 22, 10); c.stroke();
      c.fillStyle = '#2a2a30'; c.beginPath(); c.moveTo(18, 11); c.lineTo(28, 11); c.lineTo(26, 15); c.lineTo(20, 15); c.closePath(); c.fill();
      ell(c, 23, 15.5, 2.6, 1.2, '#ffd9a0', null);
    });
    sheet(scene, 'igla', 6, 160, ['i'], (c) => {
      const g = c.createLinearGradient(0, 0, 6, 0); g.addColorStop(0, '#9aa0aa'); g.addColorStop(0.5, '#f0f4f8'); g.addColorStop(1, '#6a707a');
      c.fillStyle = g; c.beginPath(); c.moveTo(1.6, 0); c.lineTo(4.4, 0); c.lineTo(4, 150); c.lineTo(3, 160); c.lineTo(2, 150); c.closePath(); c.fill();
      c.fillStyle = '#111'; c.fillRect(2.6, 138, 0.8, 5);
    });
    sheet(scene, 'stroj', 40, 26, ['s'], (c) => {
      c.fillStyle = '#1e2420'; c.beginPath(); c.moveTo(0, 0); c.lineTo(40, 0); c.lineTo(36, 18); c.lineTo(24, 18); c.lineTo(24, 26); c.lineTo(16, 26); c.lineTo(16, 18); c.lineTo(4, 18); c.closePath(); c.fill();
      c.strokeStyle = OUTL; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#c8b060'; c.font = 'bold 6px serif'; c.fillText('SINGR', 7, 11);
      ell(c, 34, 8, 3, 3, '#3a403a', OUTL, 0.6);
    });
    sheet(scene, 'izlaz_grad', 40, 64, ['e'], (c) => {
      c.fillStyle = '#0a0a0e'; c.fillRect(0, 0, 40, 64);
      c.fillStyle = radial(c, 20, 40, 2, 30, [[0, 'rgba(255,240,200,0.95)'], [0.6, 'rgba(255,200,120,0.4)'], [1, 'rgba(255,200,120,0)']]); c.fillRect(4, 6, 32, 58);
      c.strokeStyle = '#3a3a40'; c.lineWidth = 3; c.strokeRect(2, 2, 36, 62);
    });

    // ---- lica za jumpscare ----
    const face = (key, draw) => { const t = scene.textures.createCanvas(key, 512, 512), c = t.getContext(); c.fillStyle = '#000'; c.fillRect(0, 0, 512, 512); draw(c); c.fillStyle = radial(c, 256, 250, 150, 380, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.85)']]); c.fillRect(0, 0, 512, 512); t.refresh(); };
    face('lice_krojac', (c) => {
      c.save(); c.translate(256, 280); c.rotate(-0.08);
      // cilindar
      c.fillStyle = '#0c0a10'; c.fillRect(-150, -330, 300, 200); c.fillRect(-230, -150, 460, 34);
      c.fillStyle = '#5a1018'; c.fillRect(-150, -170, 300, 22);
      // lice
      c.fillStyle = radial(c, -20, -20, 10, 260, [[0, '#ece6d8'], [0.6, '#bdb6a6'], [1, '#6a645a']]);
      c.beginPath(); c.moveTo(0, -120); c.bezierCurveTo(170, -120, 160, 110, 90, 220); c.quadraticCurveTo(0, 270, -90, 220); c.bezierCurveTo(-160, 110, -170, -120, 0, -120); c.fill();
      // šest očiju
      [[-70, -40, 22], [0, -55, 20], [70, -40, 22], [-55, 20, 16], [55, 20, 16], [0, 0, 14]].forEach(([x, y, r]) => {
        c.fillStyle = '#050102'; c.beginPath(); c.arc(x, y, r + 8, 0, Math.PI * 2); c.fill();
        c.fillStyle = radial(c, x, y, 0, r, [[0, '#fff0e0'], [0.35, '#ff2a1a'], [1, '#600808']]); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, y, r * 0.18, r * 0.6, 0, 0, Math.PI * 2); c.fill();
      });
      // otvorena usta, rastrgani šavovi, zubi kao igle
      c.fillStyle = '#180204'; c.beginPath(); c.moveTo(-100, 110); c.quadraticCurveTo(0, 130, 100, 110); c.quadraticCurveTo(0, 240, -100, 110); c.fill();
      c.fillStyle = '#e8ecf0';
      for (let k = 0; k < 14; k++) { const x = -92 + k * 14; c.beginPath(); c.moveTo(x - 2, 114 + Math.sin(k / 13 * Math.PI) * 10); c.lineTo(x + 2, 114 + Math.sin(k / 13 * Math.PI) * 10); c.lineTo(x, 146 + Math.sin(k / 13 * Math.PI) * 18); c.closePath(); c.fill(); }
      c.strokeStyle = '#2a0608'; c.lineWidth = 5;
      for (let k = 0; k < 9; k++) { const x = -90 + k * 22, y = 110 + Math.sin(k / 8 * Math.PI) * 12; c.beginPath(); c.moveTo(x - 8, y - 22); c.lineTo(x + 8, y + 10); c.stroke(); }
      // škare
      c.strokeStyle = '#c8ccd4'; c.lineWidth = 14; c.lineCap = 'round';
      c.beginPath(); c.moveTo(150, 60); c.lineTo(250, -120); c.moveTo(150, 60); c.lineTo(260, -60); c.stroke();
      c.restore();
    });
    face('lice_lutka', (c) => {
      c.save(); c.translate(256, 260); c.rotate(0.3);
      c.fillStyle = radial(c, -40, -60, 10, 260, [[0, '#f4ece0'], [0.7, '#cfc4b0'], [1, '#7a6e5c']]);
      c.beginPath(); c.ellipse(0, 0, 175, 225, 0, 0, Math.PI * 2); c.fill();
      // pukotine
      c.strokeStyle = '#2a2018'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-40, -225); c.lineTo(-20, -140); c.lineTo(-60, -90); c.lineTo(-30, -30); c.moveTo(-20, -140); c.lineTo(40, -120); c.lineTo(70, -60); c.stroke();
      c.beginPath(); c.moveTo(150, 80); c.lineTo(100, 110); c.lineTo(110, 170); c.stroke();
      // prazne oči
      [[-65, -20], [65, -20]].forEach(([x, y]) => {
        c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, y, 42, 54, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(x + 6, y + 8, 4, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(30,10,10,0.8)'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 8, y + 50); c.bezierCurveTo(x - 4, y + 90, x + 6, y + 120, x, y + 170); c.stroke();
      });
      // naslikane crvene usne, preširoki osmijeh
      c.fillStyle = '#a8141e'; c.beginPath(); c.moveTo(-110, 105); c.quadraticCurveTo(0, 175, 110, 105); c.quadraticCurveTo(0, 145, -110, 105); c.fill();
      c.fillStyle = '#100204'; c.beginPath(); c.moveTo(-90, 112); c.quadraticCurveTo(0, 160, 90, 112); c.quadraticCurveTo(0, 132, -90, 112); c.fill();
      c.restore();
    });
  });

  // ================= dodatni dijelovi staze =================
  const cityKit = (c) => {
    const G = c.G, GR = c.GR, S = c.S;
    c.bld = (w, h) => { G.fill(c.X, GR - h, c.X + w - 1, GR - 1); const x0 = c.X; c.X += w; return { x0, x1: x0 + w - 1, top: GR - h }; };
    c.lamp = (x, y = S, broken) => { c.O.push({ type: 'lamp', id: 'L' + c.O.length, ...at(x, y), broken }); return c; };
    c.konac = (x, y = S) => { c.O.push({ type: 'konac', id: 'k' + c.O.length, ...at(x, y) }); return c; };
    c.lutka = (x, x1, x2, y = S) => { c.O.push({ type: 'lutka', id: 'l' + c.O.length, ...at(x, y), minX: T(x1), maxX: T(x2) }); return c; };
    c.igla = (x, ph, y = S) => { c.O.push({ type: 'igla', id: 'i' + c.O.length, ...at(x, y), ph, period: 2.4 }); return c; };
    return c;
  };

  // ZONA 1: ULICE — učenje hvatanja za zid; lutke u izlozima; Krojač se pokaže, a od prvog ključa lovi
  function ulice() {
    const W = 440, H = 34, GR = 30;
    const c = cityKit(course(W, H, GR)), G = c.G, S = c.S;
    c.put('checkpoint', 4).put('note', 8, S, 'N1').flat(10).lamp(12).flat(5).konac(17).flat(5).put('cabinet', c.X).flat(3).put('crawler', c.X).flat(4);
    // prvi zid — penji se odrazima
    let b = c.bld(10, 6); c.put('battery', b.x0 + 5, b.top - 1); G.plat(b.x1 + 1, b.x1 + 3, GR - 3);
    c.flat(4).put('crawler', c.X - 2);
    // uličica između dviju zgrada
    b = c.bld(6, 10); c.flat(3); const b2 = c.bld(9, 14);
    c.put('battery', b2.x0 + 4, b2.top - 1).konac(b2.x0 + 7, b2.top - 1);
    c.flat(3).put('checkpoint', c.X - 1).put('note', c.X + 2, S, 'N2').flat(6);
    const cam = c.X;
    c.lamp(c.X + 2).flat(6).put('cabinet', c.X).flat(3);
    // izlozi s lutkama
    const s1 = c.X;
    c.lutka(s1 + 14, s1 + 2, s1 + 34).lutka(s1 + 28, s1 + 8, s1 + 36).put('cabinet', s1 + 8).put('cabinet', s1 + 22).lamp(s1 + 18, S, true).flat(38);
    c.pit(3).flat(3).put('crawler', c.X).flat(2);
    // visoka zgrada s ključem na krovu; balkoni
    b = c.bld(12, 18);
    for (let y = GR - 4; y > GR - 18; y -= 4) G.plat(b.x1 + 1, b.x1 + 3, y);
    c.put('key', b.x0 + 6, b.top - 1, 'K1').konac(b.x0 + 3, b.top - 1);
    c.flat(4).pit(3).flat(3).put('cabinet', c.X).flat(2).door('D1');
    // dio 2 — Krojač lovi
    c.flat(2).put('checkpoint', c.X).put('note', c.X + 3, S, 'N3').flat(6);
    const h1 = c.X;
    c.lamp(c.X + 2).flat(6).konac(c.X).flat(4).put('cabinet', c.X).flat(5).lamp(c.X).flat(4).put('crawler', c.X).konac(c.X + 3).flat(6).put('cabinet', c.X).flat(3);
    b = c.bld(8, 8); c.flat(3); c.bld(8, 12); c.put('battery', c.X - 4, GR - 13).flat(3); c.bld(7, 6);
    c.flat(3).put('cabinet', c.X).flat(3).lamp(c.X).flat(4).konac(c.X).flat(5).put('cabinet', c.X).flat(4);
    const s2 = c.X;
    c.lutka(s2 + 10, s2 + 2, s2 + 30).lutka(s2 + 24, s2 + 6, s2 + 32).put('cabinet', s2 + 5).put('cabinet', s2 + 17).put('battery', s2 + 30).flat(34);
    c.put('checkpoint', c.X).flat(3).pit(2).flat(3);
    b = c.bld(10, 16); for (let y = GR - 5; y > GR - 16; y -= 5) G.plat(b.x0 - 3, b.x0 - 1, y);
    c.put('key', b.x1 - 1, b.top - 1, 'K2').konac(b.x0 + 4, b.top - 1);
    c.flat(3).put('crawler', c.X).flat(3).lamp(c.X).konac(c.X + 4).flat(8).put('cabinet', c.X).flat(4).pit(3).flat(3).put('cabinet', c.X).flat(2).door('D2');
    c.flat(3).put('note', c.X, S, 'N4').flat(4).put('exit', c.X).flat(4);
    const cy = T(5);
    c.O.push({ type: 'krojacCameo', id: 'kc0', ...at(cam + 8, 4), y: cy });
    const krojaci = [
      { id: 'K_1', dormant: 'K1', x1: T(h1), x2: T(c.X - 8), cy, cable: true },
      { id: 'K_2', dormant: 'K2', x1: T(s2 - 30), x2: T(c.X - 8), cy: T(4), cable: true },
    ];
    return {
      theme: 'ulice', W, H, grid: G.g, trunks: [], objects: c.O, monsters: [], krojaci, doors: c.doors, start: at(2, S), doorTex: 'vrata_grad', exitTex: 'izlaz_grad',
      intro: 'Skoči na zid i drži prema njemu — pa skoči opet!',
      notes: {
        N1: 'Iza šume je Grad.\nNema nikoga. Samo svjetla koja trepću.\n\nZidovi su hrapavi — mogu se uhvatiti\ni odbiti od njih.',
        N2: 'Preko ulica su razapeti konci.\nAko ih dotakneš, negdje gore zazvoni.\n\nPreskoči ih. Ili ih presijeci.',
        N3: 'Lutke iz izloga hodaju.\nAli samo kad ih ne gledaš.\n\nNe okreći im leđa.',
        N4: 'Krojač živi gore, na žicama.\nSpušta se na koncu, ravno odozgo.\n\nKad čuješ škare — makni se.',
      },
    };
  }

  // ZONA 2: KROVOVI — ulica je daleko dolje, puna stakla; Krojači na žicama iznad krovova
  function krovovi() {
    const W = 430, H = 40, GR = 38;
    const c = cityKit(course(W, H, GR)), G = c.G, S = c.S;
    const roof = (w, row) => { G.fill(c.X, row, c.X + w - 1, GR - 1); const x0 = c.X; c.X += w; return { x0, x1: x0 + w - 1, top: row, s: row - 1 }; };
    const chim = (x, row) => G.fill(x, row - 2, x + 1, row - 1);
    const rdoor = (id, row) => { G.fill(c.X, 0, c.X + 5, row - 5); G.carve(c.X + 2, row - 4, c.X + 3, row - 1, 'D'); G.fill(c.X, row, c.X + 5, GR - 1); c.doors.push(door(id, c.X + 2, row - 4)); c.X += 6; };
    let r = roof(16, 20); c.put('checkpoint', 3, r.s).put('note', 7, r.s, 'N1').lamp(12, r.s);
    c.X += 4; r = roof(10, 22); chim(r.x0 + 6, 22); c.put('crawler', r.x0 + 2, r.s);
    c.X += 3; r = roof(8, 16); c.put('battery', r.x0 + 4, r.s);
    c.X += 5; r = roof(14, 18); c.konac(r.x0 + 4, r.s).put('cabinet', r.x0 + 9, r.s).lamp(r.x0 + 12, r.s);
    c.X += 6; r = roof(9, 22); c.put('crawler', r.x0 + 5, r.s);
    c.X += 2; r = roof(6, 13); G.plat(r.x0 - 3, r.x0 - 1, 17);
    c.X += 4; r = roof(12, 15); c.put('cabinet', r.x0 + 3, r.s).konac(r.x0 + 8, r.s).put('battery', r.x0 + 11, r.s);
    c.X += 7; r = roof(10, 20); c.put('checkpoint', r.x0 + 2, r.s).put('note', r.x0 + 5, r.s, 'N2');
    c.X += 3; r = roof(14, 19); chim(r.x0 + 5, 19); c.lutka(r.x0 + 11, r.x0 + 1, r.x1 - 1, r.s).put('cabinet', r.x0 + 2, r.s);
    c.X += 5; r = roof(8, 12); c.put('key', r.x0 + 4, r.s, 'K1'); G.plat(r.x0 - 4, r.x0 - 2, 16);
    c.X += 4; r = roof(12, 17); c.put('cabinet', r.x0 + 6, r.s).lamp(r.x0 + 2, r.s);
    c.X += 3; r = roof(10, 21); c.put('crawler', r.x0 + 4, r.s).konac(r.x0 + 7, r.s);
    rdoor('D1', 21);
    // dio 2
    const d0 = c.X;
    r = roof(12, 21); c.put('checkpoint', r.x0 + 2, r.s).put('note', r.x0 + 5, r.s, 'N3').put('cabinet', r.x0 + 9, r.s);
    c.X += 5; r = roof(10, 17); chim(r.x0 + 4, 17); c.konac(r.x0 + 7, r.s);
    c.X += 4; r = roof(9, 23); c.put('crawler', r.x0 + 3, r.s).put('cabinet', r.x0 + 6, r.s);
    c.X += 2; r = roof(5, 12); G.plat(r.x0 - 3, r.x0 - 1, 16); G.plat(r.x0 - 3, r.x0 - 1, 20); c.put('battery', r.x0 + 2, r.s);
    c.X += 8; r = roof(14, 18); c.lutka(r.x0 + 4, r.x0 + 1, r.x1 - 1, r.s).lutka(r.x0 + 11, r.x0 + 1, r.x1 - 1, r.s).lamp(r.x0 + 7, r.s, true);
    c.X += 4; r = roof(10, 20); c.put('cabinet', r.x0 + 2, r.s).konac(r.x0 + 6, r.s).put('checkpoint', r.x0 + 8, r.s);
    c.X += 6; r = roof(8, 16); c.put('crawler', r.x0 + 3, r.s);
    c.X += 3; r = roof(6, 10); G.plat(r.x0 - 3, r.x0 - 1, 14); c.put('key', r.x0 + 3, r.s, 'K2');
    c.X += 7; r = roof(12, 19); c.put('cabinet', r.x0 + 3, r.s).lamp(r.x0 + 8, r.s).konac(r.x0 + 10, r.s);
    c.X += 5; r = roof(10, 22); c.put('cabinet', r.x0 + 5, r.s).put('battery', r.x0 + 8, r.s);
    c.X += 4; r = roof(14, 18); c.konac(r.x0 + 3, r.s).put('cabinet', r.x0 + 7, r.s).put('crawler', r.x0 + 10, r.s);
    rdoor('D2', 18);
    r = roof(14, 18); c.put('note', r.x0 + 3, r.s, 'N4').put('exit', r.x0 + 9, r.s);
    // staklo dolje na ulici
    for (let x = 0; x < W; x++) if (G.g[GR - 1][x] === '.') G.g[GR - 1][x] = '^';
    const krojaci = [
      { id: 'K_1', x1: T(30), x2: T(d0 - 10), cy: T(4), cable: true },
      { id: 'K_2', x1: T(d0 + 6), x2: T(c.X - 20), cy: T(4), cable: true },
      { id: 'K_3', dormant: 'K2', x1: T(d0 + 40), x2: T(c.X - 10), cy: T(3), cable: true },
    ];
    return {
      theme: 'krovovi', W, H, grid: G.g, trunks: [], objects: c.O, monsters: [], krojaci, doors: c.doors, start: at(2, 19), doorTex: 'vrata_grad', exitTex: 'izlaz_grad',
      notes: {
        N1: 'Ulica je daleko dolje.\nSva je u razbijenom staklu.\n\nS krova na krov — skokom, krilima ili zidom.',
        N2: 'Na žicama između zgrada nešto visi.\nKad se pomakne — žice zazuje.',
        N3: 'Pod svjetlom lampe vidi te izdaleka.\nU mraku — samo kad si ravno ispod njega.\n\nŠuljaj se.',
        N4: 'Dolje je stara tvornica.\nNa vratima piše: KROJAČKA RADIONA.\n\nIznutra se čuje šivaći stroj.',
      },
    };
  }

  // ZONA 3: TVORNICA — šivaći strojevi, skladište lutaka, Krojač na stropu, potjera na kraju
  function tvornica() {
    const W = 440, H = 30, GR = 26;
    const c = cityKit(course(W, H, GR)), G = c.G, S = c.S;
    G.fill(0, 0, W - 1, 6);                      // strop
    const beam = (x) => G.fill(x - 1, GR - 6, x + 1, GR - 5);   // ruka stroja iznad prolaza
    c.put('checkpoint', 4).put('note', 8, S, 'N1').flat(12);
    // red šivaćih strojeva
    for (let k = 0; k < 4; k++) { beam(c.X + 3); c.igla(c.X + 3, k * 0.6); c.flat(7); }
    c.put('cabinet', c.X).flat(3).konac(c.X).flat(4).put('crawler', c.X).flat(3);
    // galerija (mostovi)
    G.plat(c.X, c.X + 3, GR - 2); G.plat(c.X + 2, c.X + 20, GR - 4); G.plat(c.X + 21, c.X + 23, GR - 6); G.plat(c.X + 22, c.X + 25, GR - 8);
    G.plat(c.X + 24, c.X + 44, GR - 10); G.plat(c.X + 48, c.X + 60, GR - 5);
    c.put('battery', c.X + 34, GR - 11).konac(c.X + 30, GR - 11).put('cabinet', c.X + 40, GR - 11);
    c.lutka(c.X + 12, c.X + 2, c.X + 58).put('cabinet', c.X + 4).put('cabinet', c.X + 26).flat(62);
    c.pit(3).flat(3).put('checkpoint', c.X).put('note', c.X + 3, S, 'N2').flat(6);
    // skladište lutaka
    const s1 = c.X;
    c.lutka(s1 + 8, s1 + 1, s1 + 40).lutka(s1 + 20, s1 + 1, s1 + 40).lutka(s1 + 32, s1 + 1, s1 + 40)
      .put('cabinet', s1 + 4).put('cabinet', s1 + 15).put('cabinet', s1 + 27).put('battery', s1 + 36).flat(42);
    for (let k = 0; k < 3; k++) { beam(c.X + 3); c.igla(c.X + 3, k * 0.8); c.flat(6); }
    c.konac(c.X + 1).flat(4);
    // ključ gore na regalima — penji se po zidu
    const b = c.bld(8, 12); c.put('key', b.x0 + 4, b.top - 1, 'K1').konac(b.x0 + 2, b.top - 1);
    c.flat(3).put('cabinet', c.X).flat(2).door('D1');
    // dio 2
    c.flat(2).put('checkpoint', c.X).put('note', c.X + 3, S, 'N3').flat(6);
    G.plat(c.X - 4, c.X - 2, GR - 2); G.plat(c.X - 2, c.X, GR - 4); G.plat(c.X, c.X + 16, GR - 6); c.put('cabinet', c.X + 10, GR - 7).put('battery', c.X + 14, GR - 7);
    c.konac(c.X + 4).flat(8).put('cabinet', c.X).flat(4).put('crawler', c.X).flat(6);
    for (let k = 0; k < 3; k++) { beam(c.X + 3); c.igla(c.X + 3, k * 0.5); c.flat(6); }
    c.put('cabinet', c.X).flat(3).pit(3).flat(3);
    const s2 = c.X;
    c.lutka(s2 + 10, s2 + 1, s2 + 34).lutka(s2 + 24, s2 + 1, s2 + 34).put('cabinet', s2 + 5).put('cabinet', s2 + 18).konac(s2 + 30).flat(36);
    // drugi ključ — dno okna; uzmeš ga i krene potjera
    c.put('checkpoint', c.X).flat(3);
    const kx = c.X;
    G.carve(kx, GR, kx + 5, GR + 2); c.put('key', kx + 3, GR + 2, 'K2'); c.X += 6;
    c.flat(4);
    // hodnik potjere
    for (let k = 0; k < 2; k++) { beam(c.X + 3); c.igla(c.X + 3, 0.3 + k * 1.1); c.flat(7); }
    c.pit(3).flat(4).konac(c.X).flat(4); beam(c.X + 3); c.igla(c.X + 3, 1.6); c.flat(7);
    c.crumbles(8).flat(4); c.bld(4, 3); c.flat(4); beam(c.X + 3); c.igla(c.X + 3, 0.9); c.flat(7).pit(3).flat(4);
    const stop = c.X;
    c.door('D2').flat(3).put('note', c.X, S, 'N4').flat(3).put('exit', c.X).flat(4);
    const krojaci = [
      { id: 'K_1', x1: T(30), x2: T(s1 + 60), cy: T(7) },
      { id: 'K_2', dormant: 'K1', x1: T(s1 - 20), x2: T(s2 + 30), cy: T(7) },
    ];
    return {
      theme: 'tvornica', W, H, grid: G.g, trunks: [], objects: c.O, monsters: [], krojaci, doors: c.doors, start: at(2, S), doorTex: 'vrata_grad', exitTex: 'izlaz_grad',
      darkWall: { key: 'K2', stopX: T(stop) - 30, speed: 100, style: 'krojac', y: T(GR), toast: 'KROJAČ!' },
      notes: {
        N1: 'Strojevi još šiju. Sami.\nIgle udaraju u ritmu.\n\nBroji. Pa prođi.',
        N2: 'Ovdje je skladište lutaka.\nSve gledaju prema vratima.\n\nNe okreći se od njih.',
        N3: 'Krojač je bio ovdje prije svih.\nŠio je ljude. Pa lutke.\nPa sebe.',
        N4: 'Pobjegao sam mu.\nAli on zna kamo idem.\n\n(nastavlja se…)',
      },
    };
  }

  Level.addZones(2, [ulice, krovovi, tvornica]);
})();
