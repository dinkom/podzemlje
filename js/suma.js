// Noćnik — svijet 2: ŠUMA (teme, likovi, zone)
(() => {
  const OUTL = '#150f19';

  // ================= TEME =================
  Object.assign(THEMES, {
    rub: {
      id: 'rub', name: 'Rub šume', forest: true, moon: true,
      rock: ['#3b3128', '#2a221b', '#1f1913'], spLight: 'rgba(110,90,70,0.45)', spDark: 'rgba(14,10,6,0.5)', rimL: 'rgba(180,220,190,0.14)',
      surface: 'grass', extra: null,
      plank: ['#6b5238', '#3e2e1f', '#4f8a4a'],
      glow: [0x9fd8ff, 0xd8ff7a], dark: 'rgba(4,8,18,', darkA: 0.74, cam: '#0a1428',
      drone: { f: 55, f3: 82.4, lp: 520, wind: 700, windG: 0.022 }, drip: [1.5, 3], amb: 'crickets', hideTex: 'grm',
    },
    mocvara: {
      id: 'mocvara', name: 'Močvara', forest: true, moon: true, fog: true,
      rock: ['#30331f', '#23251a', '#191b12'], spLight: 'rgba(90,100,60,0.45)', spDark: 'rgba(10,12,6,0.5)', rimL: 'rgba(170,200,140,0.14)',
      surface: 'swamp', extra: null,
      plank: ['#5a4a34', '#33291c', '#5a7a3a'],
      glow: [0x9ff0d0, 0xd8ff7a], dark: 'rgba(5,9,8,', darkA: 0.8, cam: '#0b1612',
      drone: { f: 49, f3: 73.4, lp: 360, wind: 450, windG: 0.02 }, drip: [1.4, 2.6], amb: 'frogs', hideTex: 'grm',
    },
    paukova: {
      id: 'paukova', name: 'Paukova šuma', forest: true, moon: true,
      rock: ['#332e38', '#24212a', '#1a171f'], spLight: 'rgba(110,100,120,0.4)', spDark: 'rgba(10,8,14,0.55)', rimL: 'rgba(220,215,235,0.14)',
      surface: 'webgrass', extra: null, ceilGlow: 11,
      plank: ['#4e4248', '#2a2329', '#d8d8e8'],
      glow: [0xd0d8ff, 0xff6a8a], dark: 'rgba(5,4,10,', darkA: 0.86, cam: '#0c0a14',
      drone: { f: 41.2, f3: 61.7, lp: 300, wind: 380, windG: 0.02 }, drip: [2.5, 4], amb: 'creak', hideTex: 'grm',
    },
  });

  // ================= PLOČICE I UKRASI =================
  const leafCol = { rub: ['#3f7a3a', '#5ea85a'], mocvara: ['#3e5a2e', '#5a7a3a'], paukova: ['#5a5868', '#8a889a'] };
  const common = (id) => ({
    surfaceTop(c, R, T) {
      if (id === 'rub') {
        c.fillStyle = '#2f5f30'; c.fillRect(0, 0, 24, 4.5);
        c.fillStyle = '#4c8c48'; for (let x = 0; x < 24; x += 2.5) c.fillRect(x, 0.8, 1.6, 1.4 + R() * 2);
        c.fillStyle = 'rgba(170,220,255,0.3)'; c.fillRect(0, 0.4, 24, 0.6);
      } else if (id === 'mocvara') {
        c.fillStyle = '#34482a'; c.fillRect(0, 0, 24, 4.5);
        c.fillStyle = 'rgba(90,70,40,0.7)'; for (let x = 0; x < 24; x += 5) c.fillRect(x + R() * 2, 2.5, 3, 1.5);
        c.fillStyle = 'rgba(160,220,150,0.25)'; c.fillRect(0, 0.4, 24, 0.6);
      } else {
        c.fillStyle = '#4a4752'; c.fillRect(0, 0, 24, 4);
        c.strokeStyle = 'rgba(230,230,245,0.35)'; c.lineWidth = 0.4; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(R() * 24, 0); c.lineTo(R() * 24, 4); c.stroke(); }
      }
      c.fillStyle = 'rgba(8,6,4,0.55)'; c.fillRect(0, 4.5, 24, 1.2);
    },
    surfaceOver(c, R, T) {
      const col = id === 'rub' ? '#6fbf6a' : id === 'mocvara' ? '#6a8a4a' : '#8a889a';
      c.strokeStyle = col; c.lineWidth = 0.8;
      for (let i = 0; i < 6; i++) { const x = 1 + R() * 22, h = 2 + R() * 4; c.beginPath(); c.moveTo(x, 2); c.quadraticCurveTo(x + (R() - 0.5) * 3, 1 - h * 0.5, x + (R() - 0.5) * 3, 2 - h); c.stroke(); }
      if (id === 'paukova' && R() < 0.5) { c.strokeStyle = 'rgba(235,235,250,0.5)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(R() * 10, -2); c.lineTo(12 + R() * 12, 2); c.stroke(); }
    },
    extra(c, R) {
      // korijenje u zemlji
      if (R() < 0.35) { c.strokeStyle = 'rgba(90,64,40,0.6)'; c.lineWidth = 0.9; c.beginPath(); const y = 6 + R() * 14; c.moveTo(0, y); c.bezierCurveTo(8, y + 4, 14, y - 3, 24, y + 2); c.stroke(); }
    },
    spikeCols: id === 'paukova' ? ['#d8d6e6', '#5a5468'] : ['#6a5236', '#2e2214'],
    plank(c, kind, T, OUT) {
      // grana s lišćem umjesto daske
      const [bark, dark, leaf] = T.plank;
      c.fillStyle = bark; c.beginPath(); c.moveTo(kind === 0 ? 2 : 0, 1.5); c.lineTo(kind === 2 ? 22 : 24, 1); c.lineTo(kind === 2 ? 22 : 24, 6); c.lineTo(kind === 0 ? 2 : 0, 6.5); c.closePath(); c.fill();
      c.strokeStyle = OUT; c.lineWidth = 0.8; c.stroke();
      c.strokeStyle = dark; c.lineWidth = 0.5; c.beginPath(); c.moveTo(3, 3.5); c.lineTo(21, 3); c.moveTo(6, 5); c.lineTo(14, 4.8); c.stroke();
      const R = Tiles.rng(kind * 17 + T.id.length);
      for (let i = 0; i < 4; i++) {
        const x = 2 + R() * 20;
        c.fillStyle = i % 2 ? leaf : leafCol[T.id][1];
        c.beginPath(); c.ellipse(x, 0.5 - R() * 1.5, 2.6, 1.4, (R() - 0.5) * 1.2, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 0.3; c.stroke();
      }
      if (T.id === 'paukova') { c.strokeStyle = 'rgba(235,235,250,0.55)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(12, 14, 24, 6); c.stroke(); }
      if (kind !== 1) { c.strokeStyle = bark; c.lineWidth = 2.6; c.beginPath(); c.moveTo(kind === 0 ? 2 : 22, 4); c.lineTo(kind === 0 ? -1 : 25, 2); c.stroke(); }
    },
    deco(c, i, T, h) {
      const { R, ell, tri, cobweb } = h;
      const fern = (x, col) => { for (let k = 0; k < 5; k++) { c.strokeStyle = col; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x, 24); c.quadraticCurveTo(x + (k - 2) * 3, 17, x + (k - 2) * 5.5, 12 + R() * 4); c.stroke(); } };
      const flower = (x, h, col) => { c.strokeStyle = '#4c7a48'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, 24); c.lineTo(x, 24 - h); c.stroke(); for (let k = 0; k < 5; k++) { const a = k * 1.256; ell(x + Math.cos(a) * 1.4, 24 - h + Math.sin(a) * 1.4, 1.1, 1.1, col, 0); } ell(x, 24 - h, 0.7, 0.7, '#fff6c0', 0); };
      const hangLeaves = (col) => { for (let k = 0; k < 4; k++) { const x = 3 + k * 5 + R() * 2; c.strokeStyle = '#3a5a2e'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 4 + R() * 6); c.stroke(); ell(x, 6 + R() * 6, 2.2, 1.3, col, 0.3); } };
      const vines = (col) => { for (let k = 0; k < 3; k++) { c.strokeStyle = col; c.lineWidth = 1; const x = 5 + k * 6; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 3, 7, x - 3, 12, x + 1, 16 + R() * 7); c.stroke(); } };
      if (T.id === 'rub') {
        switch (i) {
          case 0: flower(8, 6, '#9fd8ff'); flower(14, 9, '#bfe6ff'); flower(18, 5, '#9fd8ff'); break;
          case 1: fern(12, '#3f7a3a'); [[7, 14], [15, 11], [12, 18]].forEach(([x, y]) => { c.fillStyle = '#efff9a'; c.beginPath(); c.arc(x, y, 0.8, 0, Math.PI * 2); c.fill(); }); break;
          case 2: fern(12, '#4c8c48'); break;
          case 3: [[8, 6, 3.2], [14, 4, 2.4]].forEach(([x, hh, w]) => { c.strokeStyle = '#d8c8a8'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, 24); c.lineTo(x, 24 - hh); c.stroke(); c.beginPath(); c.ellipse(x, 24 - hh, w, w * 0.6, 0, Math.PI, 0); c.closePath(); c.fillStyle = '#8a5a3a'; c.fill(); c.strokeStyle = OUTL; c.lineWidth = 0.5; c.stroke(); }); break;
          case 4: c.fillStyle = '#5a4430'; c.fillRect(6, 15, 12, 9); c.strokeStyle = OUTL; c.lineWidth = 0.7; c.strokeRect(6, 15, 12, 9); ell(12, 15, 6, 1.6, '#a88a62', 0.6); c.strokeStyle = 'rgba(80,50,30,0.6)'; c.beginPath(); c.ellipse(12, 15, 3, 0.8, 0, 0, Math.PI * 2); c.stroke(); break;
          case 5: ell(8, 22.5, 3.4, 2, '#5a5a62'); ell(15, 23, 2.6, 1.5, '#4a4a52'); c.fillStyle = '#4c8c48'; c.fillRect(5, 20.5, 5, 1); break;
          case 6: hangLeaves('#3f7a3a'); break;
          case 7: hangLeaves('#4c8c48'); break;
          case 8: vines('#3a5a2e'); break;
          case 9: vines('#4a3a28'); break;
          case 10: cobweb(); break;
          case 11: c.strokeStyle = '#4a3a28'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 8); c.stroke(); ell(12, 10, 2, 2.6, '#3a4a5a', 0.5); break;
        }
      } else if (T.id === 'mocvara') {
        switch (i) {
          case 0: for (let k = 0; k < 4; k++) { const x = 5 + k * 4.5, hh = 10 + R() * 8; c.strokeStyle = '#4a6a3a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, 24); c.lineTo(x + 1, 24 - hh); c.stroke(); ell(x + 1, 24 - hh - 1, 0.9, 0.9, '#c8ffe0', 0); } break;
          case 1: ell(12, 22.5, 6, 1.4, '#2a5a4a', 0.5); [-1, 1].forEach(s => { c.beginPath(); c.ellipse(12 + s * 2, 20.5, 2, 3, s * 0.5, 0, Math.PI * 2); c.fillStyle = '#d8fff0'; c.fill(); }); ell(12, 19.5, 1.2, 1.2, '#9ff0d0', 0); break;
          case 2: for (let k = 0; k < 4; k++) { const x = 4 + k * 5, hh = 14 + R() * 6; c.strokeStyle = '#5a6a3a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x, 24); c.lineTo(x, 24 - hh); c.stroke(); if (k % 2) { c.fillStyle = '#5a3a22'; c.fillRect(x - 1.1, 24 - hh, 2.2, 5); } } break;
          case 3: c.strokeStyle = OUTL; c.lineWidth = 2.6; c.beginPath(); c.moveTo(3, 23); c.lineTo(20, 20); c.moveTo(12, 21.5); c.lineTo(16, 15); c.stroke(); c.strokeStyle = '#5a4a34'; c.lineWidth = 1.5; c.stroke(); break;
          case 4: ell(12, 21.5, 4, 2.6, '#3e6a2e'); ell(10.5, 19.5, 1.1, 1.1, '#e8e070'); ell(13.5, 19.5, 1.1, 1.1, '#e8e070'); c.fillStyle = '#111'; c.beginPath(); c.arc(10.5, 19.5, 0.5, 0, Math.PI * 2); c.arc(13.5, 19.5, 0.5, 0, Math.PI * 2); c.fill(); break;
          case 5: ell(12, 21.5, 3.4, 2.8, '#d8ceb0'); c.fillStyle = '#1b140e'; c.beginPath(); c.arc(10.8, 21.2, 0.8, 0, Math.PI * 2); c.arc(13.2, 21.2, 0.8, 0, Math.PI * 2); c.fill(); break;
          case 6: case 7: for (let k = 0; k < (i === 6 ? 3 : 5); k++) { const x = 2 + k * (20 / (i === 6 ? 3 : 5)) + R() * 2, hh = 10 + R() * 12; c.strokeStyle = 'rgba(120,140,100,0.8)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 2, hh * 0.4, x - 2, hh * 0.7, x, hh); c.stroke(); } break;
          case 8: vines('#3e5a2e'); break;
          case 9: vines('#3a2e20'); break;
          case 10: cobweb(); break;
          case 11: c.strokeStyle = '#3a3a3a'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 8); c.stroke(); c.fillStyle = '#4a4238'; c.fillRect(9, 8, 6, 7); c.strokeStyle = OUTL; c.strokeRect(9, 8, 6, 7); c.fillStyle = 'rgba(255,200,120,0.4)'; c.fillRect(10, 9, 4, 5); break;
        }
      } else {
        switch (i) {
          case 0: [[7, 20], [12, 18.5], [17, 20.5]].forEach(([x, y]) => { ell(x, y, 2.2, 3, '#e8e4f4', 0.5); c.strokeStyle = 'rgba(200,200,220,0.6)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x, y + 3); c.lineTo(x, 24); c.stroke(); }); break;
          case 1: [[8, 6, 3], [14, 9, 3.6]].forEach(([x, hh, w]) => { c.strokeStyle = '#d8d0e8'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, 24); c.lineTo(x, 24 - hh); c.stroke(); c.beginPath(); c.ellipse(x, 24 - hh, w, w * 0.6, 0, Math.PI, 0); c.closePath(); c.fillStyle = '#ff6a8a'; c.fill(); }); break;
          case 2: ell(12, 19, 8, 5, '#3a3a44'); c.strokeStyle = 'rgba(235,235,250,0.6)'; c.lineWidth = 0.4; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(4 + k * 4, 14); c.lineTo(12, 24); c.stroke(); } break;
          case 3: ell(12, 18, 3.4, 5.5, '#d8d4e4', 0.7); c.strokeStyle = 'rgba(120,110,130,0.6)'; c.lineWidth = 0.5; for (let y = 14; y < 23; y += 2.2) { c.beginPath(); c.moveTo(9, y); c.quadraticCurveTo(12, y + 1.4, 15, y); c.stroke(); } break;
          case 4: c.strokeStyle = OUTL; c.lineWidth = 2.2; c.beginPath(); c.moveTo(4, 23); c.lineTo(13, 22); c.stroke(); c.strokeStyle = '#ddd5c0'; c.lineWidth = 1.2; c.stroke(); ell(17, 21.6, 3, 2.4, '#e4ddca'); break;
          case 5: for (let k = 0; k < 6; k++) { c.strokeStyle = '#6a6878'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(3 + k * 3.5, 24); c.lineTo(3 + k * 3.5 + (R() - 0.5) * 2, 18 - R() * 3); c.stroke(); } break;
          case 6: case 7: for (let k = 0; k < (i === 6 ? 3 : 5); k++) { const x = 3 + k * 4 + R() * 2; c.strokeStyle = 'rgba(235,235,250,0.55)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (R() - 0.5) * 3, 8 + R() * 14); c.stroke(); } break;
          case 8: c.strokeStyle = 'rgba(235,235,250,0.6)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 6); c.stroke(); ell(12, 11, 3.2, 5, '#d8d4e4', 0.6); break;
          case 9: c.fillStyle = 'rgba(230,230,245,0.25)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(24, 0); c.quadraticCurveTo(12, 16, 0, 0); c.fill(); c.strokeStyle = 'rgba(235,235,250,0.5)'; c.lineWidth = 0.4; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(12, k * 3.5, 24, 0); c.stroke(); } break;
          case 10: cobweb(); break;
          case 11: c.strokeStyle = 'rgba(235,235,250,0.6)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 7); c.stroke(); ell(12, 10.5, 2.6, 3.4, '#ff6a8a', 0.6); break;
        }
      }
    },
    bgFar(c, R, h) {
      const sky = { rub: ['#07102a', '#16284e', '#24365a'], mocvara: ['#0a1410', '#1a2a24', '#2a3a30'], paukova: ['#0a0812', '#1a1628', '#2a2438'] }[id];
      const g = c.createLinearGradient(0, 0, 0, 280); g.addColorStop(0, sky[0]); g.addColorStop(0.65, sky[1]); g.addColorStop(1, sky[2]);
      c.fillStyle = g; c.fillRect(0, 0, 600, 280);
      const stars = []; for (let i = 0; i < 70; i++) stars.push([R() * 600, R() * 170, R()]);
      h.wrap(() => {
        stars.forEach(([x, y, a]) => { c.fillStyle = `rgba(255,255,255,${0.25 + a * 0.6})`; c.fillRect(x, y, a > 0.85 ? 1.4 : 0.8, a > 0.85 ? 1.4 : 0.8); });
        // daleki red drveća
        c.fillStyle = id === 'mocvara' ? '#13201a' : id === 'paukova' ? '#16121e' : '#0f1a32';
        c.beginPath(); c.moveTo(0, 280);
        for (let x = 0; x <= 600; x += 14) { const t = 200 + Math.sin(x * 0.05) * 10 + ((x * 7) % 23); c.lineTo(x, t + 12); c.lineTo(x + 7, t - 6 - ((x * 13) % 17)); }
        c.lineTo(600, 280); c.closePath(); c.fill();
        if (id === 'mocvara') { const fg = c.createLinearGradient(0, 190, 0, 260); fg.addColorStop(0, 'rgba(160,190,170,0)'); fg.addColorStop(1, 'rgba(160,190,170,0.22)'); c.fillStyle = fg; c.fillRect(0, 190, 600, 90); }
        if (id === 'paukova') { c.strokeStyle = 'rgba(220,220,240,0.12)'; c.lineWidth = 0.8; for (let k = 0; k < 6; k++) { const cx = (k * 113) % 600, cy = 60 + (k * 41) % 90; for (let r = 8; r < 40; r += 8) { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke(); } for (let a = 0; a < 8; a++) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a * 0.785) * 44, cy + Math.sin(a * 0.785) * 44); c.stroke(); } } }
      });
    },
    bgMid(c, R, h) {
      const trunk = id === 'mocvara' ? '#162016' : id === 'paukova' ? '#1a1620' : '#121c2e';
      const trees = []; for (let i = 0; i < 7; i++) trees.push({ x: R() * 800, w: 10 + R() * 16, lean: (R() - 0.5) * 20 });
      h.wrap(() => {
        trees.forEach(t => {
          c.fillStyle = trunk;
          c.beginPath(); c.moveTo(t.x - t.w, 280); c.lineTo(t.x - t.w * 0.6 + t.lean, 0); c.lineTo(t.x + t.w * 0.6 + t.lean, 0); c.lineTo(t.x + t.w, 280); c.closePath(); c.fill();
          c.strokeStyle = trunk; c.lineWidth = 4;
          for (let k = 0; k < 3; k++) { const y = 40 + k * 55, s = k % 2 ? 1 : -1; c.beginPath(); c.moveTo(t.x + t.lean * (1 - y / 280), y); c.quadraticCurveTo(t.x + s * 30, y - 10, t.x + s * 55, y - 30); c.stroke(); }
          if (id === 'mocvara') { c.strokeStyle = 'rgba(110,130,100,0.35)'; c.lineWidth = 1.5; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(t.x - 30 + k * 14, 60); c.lineTo(t.x - 32 + k * 14, 110 + (k % 3) * 20); c.stroke(); } }
          if (id === 'paukova') { c.strokeStyle = 'rgba(225,225,240,0.18)'; c.lineWidth = 0.7; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(t.x, 80 + k * 30); c.lineTo(t.x + 70, 60 + k * 35); c.stroke(); } }
        });
      });
    },
  });
  ['rub', 'mocvara', 'paukova'].forEach(id => Tiles.hook(id, common(id)));

  // ================= LIKOVI =================
  Art.add((scene) => {
    const { sheet, ell, line, limb, radial } = Art;
    // ---- HUK: polučovjek, polusova (tijelo bez glave — glava je posebna sličica) ----
    const drawHuk = (c, p) => {
      const b = p.bob || 0;
      const coat = '#3d3428', coatL = '#5a4c3a', skin = '#a89a6a';
      if (p.wings) {
        // kaput raširen kao krila
        [-1, 1].forEach(s => {
          c.beginPath(); c.moveTo(30, 26 + b);
          c.quadraticCurveTo(30 + s * 26, 8 - p.wings * 8, 30 + s * 30, 20 - p.wings * 4);
          for (let k = 0; k < 5; k++) c.lineTo(30 + s * (28 - k * 5), 30 + (k % 2) * 4 + p.wings * 2);
          c.lineTo(30 + s * 3, 46 + b); c.closePath();
          c.fillStyle = s < 0 ? '#332b20' : coat; c.fill(); c.strokeStyle = OUTL; c.lineWidth = 1; c.stroke();
          for (let k = 0; k < 4; k++) line(c, [[30 + s * 6, 30 + k * 3], [30 + s * (14 + k * 4), 22 - p.wings * 4 + k * 3]], coatL, 0.6);
        });
      }
      // noge s kandžama
      const leg = (hx, dx, lift) => {
        limb(c, [[hx, 58 + b], [hx + dx * 0.5 + 2, 70], [hx + dx, 81 - lift]], '#4a3c2a', 2.4);
        for (let k = -1; k <= 1; k++) limb(c, [[hx + dx, 81 - lift], [hx + dx + 3 + k * 2.2, 83 - lift]], skin, 0.7);
      };
      leg(26, p.legB || 0, p.liftB || 0);
      // kaput od perja
      const g = c.createLinearGradient(16, 20, 40, 60); g.addColorStop(0, coatL); g.addColorStop(1, coat);
      c.beginPath(); c.moveTo(24, 20 + b); c.quadraticCurveTo(16, 30 + b, 19, 46 + b);
      for (let k = 0; k <= 8; k++) c.lineTo(18 + k * 2.4, 60 + (k % 2 ? 3 : 0) + b);
      c.quadraticCurveTo(40, 40 + b, 36, 21 + b); c.closePath();
      c.fillStyle = g; c.fill(); c.strokeStyle = OUTL; c.lineWidth = 1.1; c.stroke();
      // ljuskice perja
      for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(22 + k * 5 + (r % 2) * 2.5, 26 + r * 6 + b, 2.6, 0, Math.PI); c.strokeStyle = 'rgba(20,14,8,0.5)'; c.lineWidth = 0.5; c.stroke(); }
      leg(31, p.legF || 0, p.liftF || 0);
      // ruke: dugi prsti s kandžama
      if (!p.wings) {
        const ang = 0.2 + (p.arm || 0);
        const ex = 33 + Math.sin(ang) * 13, ey = 24 + b + Math.cos(ang) * 13, hx = ex + Math.sin(ang * 0.5) * 12, hy = ey + Math.cos(ang * 0.5) * 12;
        limb(c, [[33, 24 + b], [ex, ey]], coat, 3.4);
        limb(c, [[ex, ey], [hx, hy]], skin, 1.6);
        for (let k = -1; k <= 1; k++) limb(c, [[hx, hy], [hx + 2 + k * 2, hy + 6], [hx + 3 + k * 2.4, hy + 8]], skin, 0.7);
      }
      // vrat
      limb(c, [[29, 22 + b], [30, 14 + b]], '#4a3c2a', 3);
    };
    const F = [];
    F.push({ name: 'stand0', bob: 0, legF: 2, legB: -2, arm: 0 }, { name: 'stand1', bob: 0.7, legF: 2, legB: -2, arm: 0.1 });
    [[4, -4, 0, 1.5], [1, -1, 1.5, 0], [-4, 4, 0, 1.5], [-1, 1, 0, 1.5]].forEach(([lf, lb, uf, ub], i) => F.push({ name: 'walk' + i, bob: i % 2 ? -0.8 : 0, legF: lf, legB: lb, liftF: uf, liftB: ub, arm: i % 2 ? 0.3 : -0.2 }));
    F.push({ name: 'fly0', bob: 0, legF: 4, legB: 2, liftF: 3, liftB: 3, wings: 1 }, { name: 'fly1', bob: 1, legF: 4, legB: 2, liftF: 3, liftB: 3, wings: -0.8 });
    F.push({ name: 'dive', bob: 0, legF: 6, legB: 5, liftF: 6, liftB: 6, wings: -1.4 });
    sheet(scene, 'huk', 60, 86, F, drawHuk);
    // glava: sprijeda, sa strane, okrenuta unatrag
    sheet(scene, 'huk_glava', 30, 30, [{ name: 'front' }, { name: 'back' }], (c, f) => {
      const back = f.name === 'back';
      c.fillStyle = '#4a3e2e';
      c.beginPath(); c.moveTo(5, 9); c.lineTo(4, 1); c.lineTo(10, 6); c.lineTo(20, 6); c.lineTo(26, 1); c.lineTo(25, 9); c.closePath(); c.fill(); c.strokeStyle = OUTL; c.lineWidth = 0.9; c.stroke();
      ell(c, 15, 15, 11, 10, back ? '#4a3e2e' : '#5a4c3a', OUTL, 1.1);
      if (back) {
        for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(7 + k * 5 + (r % 2) * 2.5, 10 + r * 5, 2.8, 0, Math.PI); c.strokeStyle = 'rgba(20,14,8,0.6)'; c.lineWidth = 0.6; c.stroke(); }
        return;
      }
      // lice-disk
      c.fillStyle = '#d8ccb0'; c.beginPath(); c.ellipse(10.5, 15, 6, 6.4, 0, 0, Math.PI * 2); c.ellipse(19.5, 15, 6, 6.4, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(80,60,30,0.6)'; c.lineWidth = 0.5; for (let k = 0; k < 8; k++) { const a = k * 0.785; c.beginPath(); c.moveTo(10.5 + Math.cos(a) * 3.6, 15 + Math.sin(a) * 3.6); c.lineTo(10.5 + Math.cos(a) * 6, 15 + Math.sin(a) * 6.3); c.moveTo(19.5 + Math.cos(a) * 3.6, 15 + Math.sin(a) * 3.6); c.lineTo(19.5 + Math.cos(a) * 6, 15 + Math.sin(a) * 6.3); c.stroke(); }
      ell(c, 10.5, 15, 3.4, 3.4, '#ffd23a', OUTL, 0.6); ell(c, 19.5, 15, 3.4, 3.4, '#ffd23a', OUTL, 0.6);
      ell(c, 10.5, 15, 1.7, 1.9, '#0a0604', null); ell(c, 19.5, 15, 1.7, 1.9, '#0a0604', null);
      ell(c, 11.2, 14.2, 0.6, 0.6, '#fff', null); ell(c, 20.2, 14.2, 0.6, 0.6, '#fff', null);
      c.fillStyle = '#3a3020'; c.beginPath(); c.moveTo(13.6, 18); c.lineTo(16.4, 18); c.lineTo(15, 23); c.closePath(); c.fill(); c.strokeStyle = OUTL; c.lineWidth = 0.5; c.stroke();
    });
    // svijetle oči iznad mraka
    sheet(scene, 'oci_huk', 16, 8, ['x'], (c) => {
      [[3.5, 4], [12.5, 4]].forEach(([x, y]) => { c.fillStyle = radial(c, x, y, 0, 4, [[0, 'rgba(255,220,60,1)'], [0.4, 'rgba(255,200,40,0.5)'], [1, 'rgba(255,200,40,0)']]); c.fillRect(x - 4, y - 4, 8, 8); ell(c, x, y, 0.8, 0.8, '#fff', null); });
    });
    // mjesec (iza svega, prati kameru)
    sheet(scene, 'mjesec', 64, 64, ['m'], (c) => {
      c.fillStyle = radial(c, 32, 32, 0, 32, [[0, 'rgba(220,235,255,0.5)'], [0.55, 'rgba(180,200,255,0.12)'], [1, 'rgba(160,190,255,0)']]); c.fillRect(0, 0, 64, 64);
      ell(c, 32, 32, 15, 15, '#e8ecdc', null);
      [[27, 28, 3.5], [37, 35, 2.6], [30, 39, 2], [38, 26, 1.6]].forEach(([x, y, r]) => ell(c, x, y, r, r, 'rgba(150,160,150,0.45)', null));
    });
    // krijesnica
    sheet(scene, 'krijesnica', 10, 8, ['k'], (c) => {
      ell(c, 3.5, 4, 2.6, 2, '#2a2a1a', OUTL, 0.6);
      ell(c, 7, 4.2, 2.4, 1.8, '#efff8a', null);
      c.fillStyle = 'rgba(220,230,255,0.6)'; c.beginPath(); c.ellipse(4, 1.6, 2, 1, -0.4, 0, Math.PI * 2); c.fill();
    });
    // grm za skrivanje
    sheet(scene, 'grm', 32, 30, ['g'], (c) => {
      [[8, 20, 8], [16, 14, 10], [24, 20, 8], [12, 24, 7], [21, 24, 7]].forEach(([x, y, r], i) => ell(c, x, y, r, r * 0.85, i % 2 ? '#2f5a2e' : '#3a6c38', OUTL, 0.9));
      for (let k = 0; k < 14; k++) { const x = 4 + (k * 37) % 24, y = 9 + (k * 23) % 18; ell(c, x, y, 1.6, 1, k % 3 ? '#4c8c48' : '#295428', null); }
      [[11, 18], [20, 15], [15, 23]].forEach(([x, y]) => ell(c, x, y, 0.9, 0.9, '#c03a4a', null));
    });
    // paukova mreža (ljepljiva)
    sheet(scene, 'mreza', 24, 24, ['m'], (c) => {
      c.strokeStyle = 'rgba(235,235,250,0.75)'; c.lineWidth = 0.5;
      for (let a = 0; a < 8; a++) { c.beginPath(); c.moveTo(12, 12); c.lineTo(12 + Math.cos(a * 0.785) * 14, 12 + Math.sin(a * 0.785) * 14); c.stroke(); }
      for (let r = 3; r < 13; r += 3) { c.beginPath(); for (let a = 0; a <= 8; a++) { const x = 12 + Math.cos(a * 0.785) * r, y = 12 + Math.sin(a * 0.785) * r; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    });
    // šumska vrata (ograda od kolja)
    sheet(scene, 'vrata_suma', 48, 96, ['v'], (c) => {
      for (let k = 0; k < 6; k++) {
        const x = 3 + k * 7.5;
        c.fillStyle = k % 2 ? '#5a4430' : '#6b5238'; c.beginPath(); c.moveTo(x, 96); c.lineTo(x, 8 + (k % 2) * 3); c.lineTo(x + 3, 2 + (k % 2) * 3); c.lineTo(x + 6, 8 + (k % 2) * 3); c.lineTo(x + 6, 96); c.closePath(); c.fill(); c.strokeStyle = OUTL; c.lineWidth = 0.9; c.stroke();
      }
      [26, 66].forEach(y => { c.fillStyle = '#4a3828'; c.fillRect(1, y, 46, 6); c.strokeStyle = OUTL; c.strokeRect(1, y, 46, 6); });
      c.strokeStyle = '#3a6a34'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(2, 90); c.bezierCurveTo(14, 70, 30, 84, 44, 50); c.stroke();
      c.fillStyle = '#7a7f88'; c.fillRect(30, 44, 9, 11); c.strokeStyle = OUTL; c.strokeRect(30, 44, 9, 11);
      c.beginPath(); c.arc(34.5, 44, 3.4, Math.PI, 0); c.strokeStyle = '#7a7f88'; c.lineWidth = 1.4; c.stroke();
      ell(c, 34.5, 49, 1, 1, '#111', null);
    });
    // Hukovo lice za jumpscare
    const t = scene.textures.createCanvas('lice_huk', 512, 512);
    const c = t.getContext();
    c.fillStyle = '#000'; c.fillRect(0, 0, 512, 512);
    c.fillStyle = '#4a3e2e'; c.beginPath(); c.moveTo(60, 200); c.lineTo(40, 20); c.lineTo(170, 120); c.lineTo(342, 120); c.lineTo(472, 20); c.lineTo(452, 200); c.closePath(); c.fill();
    c.fillStyle = '#5a4c3a'; c.beginPath(); c.ellipse(256, 290, 230, 210, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d8ccb0'; c.beginPath(); c.ellipse(165, 270, 110, 120, 0, 0, Math.PI * 2); c.ellipse(347, 270, 110, 120, 0, 0, Math.PI * 2); c.fill();
    [[165, 265], [347, 265]].forEach(([x, y]) => {
      c.fillStyle = radial(c, x, y, 0, 80, [[0, '#fff6a0'], [0.5, '#ffd23a'], [1, '#c08a10']]); c.beginPath(); c.arc(x, y, 72, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#050302'; c.beginPath(); c.ellipse(x, y, 34, 40, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 14, y - 16, 9, 0, Math.PI * 2); c.fill();
    });
    c.fillStyle = '#2a2016'; c.beginPath(); c.moveTo(225, 330); c.lineTo(287, 330); c.lineTo(256, 450); c.closePath(); c.fill();
    t.refresh();
  });

  // ================= ZONE =================
  const { grid, at, door } = Level.tools;
  const trunkOf = (G) => { G.trunks = []; return (x1, y1, x2, y2) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) G.trunks.push([x, y]); }; };

  // ZONA 1: RUB ŠUME — učenje lebdenja, krijesnice, prvi pogled na Huka
  function rubSume() {
    const W = 200, H = 32, G = grid(W, H), { carve, plat, spikes, fill } = G;
    carve(0, 0, W - 1, 23);                      // otvoreno nebo, tlo od reda 24
    const trunk = trunkOf(G);
    carve(20, 24, 24, 27); spikes(20, 24, 27);   // prva jama — preleti je
    fill(38, 22, 39, 23); fill(40, 21, 52, 23);  // brežuljak
    // veliko stablo: deblo + grane do krošnje
    trunk(60, 9, 62, 23);
    [22, 18, 14, 10].forEach(y => plat(54, 57, y)); [20, 16, 12].forEach(y => plat(56, 59, y));
    plat(50, 76, 8);
    carve(77, 24, 95, 29); spikes(77, 95, 29);   // klanac — s krošnje se jedri preko
    trunk(108, 12, 109, 23); plat(104, 113, 11);  // suho stablo (Huk sjedi gore)
    carve(118, 24, 121, 26); spikes(118, 121, 26);
    // drugo stablo s ključem u krošnji
    trunk(135, 9, 137, 23);
    [22, 18, 14, 10].forEach(y => plat(129, 132, y)); [20, 16, 12].forEach(y => plat(131, 134, y));
    plat(126, 146, 8);
    carve(148, 24, 159, 29); spikes(148, 159, 29);
    carve(175, 20, 176, 23, 'D');
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(6, 23) }, { type: 'note', id: 'N1', ...at(11, 23) },
      { type: 'battery', id: 'B1', ...at(16, 23) }, { type: 'cabinet', id: 'o1', ...at(31, 23) }, { type: 'crawler', id: 'b1', ...at(46, 20) },
      { type: 'battery', id: 'B2', ...at(55, 21) }, { type: 'battery', id: 'B3', ...at(57, 11) }, { type: 'spider', id: 's1', ...at(68, 9) },
      { type: 'battery', id: 'B4', ...at(74, 7) },
      { type: 'checkpoint', id: 'C2', ...at(99, 23) }, { type: 'note', id: 'N2', ...at(102, 23) }, { type: 'hukCameo', id: 'h0', ...at(110, 10) },
      { type: 'cabinet', id: 'o2', ...at(114, 23) }, { type: 'crawler', id: 'b2', ...at(125, 23) },
      { type: 'battery', id: 'B5', ...at(130, 21) }, { type: 'battery', id: 'B6', ...at(132, 15) }, { type: 'spider', id: 's2', ...at(140, 9) },
      { type: 'key', id: 'K1', ...at(145, 7) },
      { type: 'checkpoint', id: 'C3', ...at(163, 23) }, { type: 'cabinet', id: 'o3', ...at(168, 23) }, { type: 'crawler', id: 'b3', ...at(170, 23) },
      { type: 'note', id: 'N3', ...at(180, 23) }, { type: 'battery', id: 'B7', ...at(184, 23) }, { type: 'exit', id: 'E', ...at(192, 23) },
    ];
    return {
      theme: 'rub', W, H, grid: G.g, trunks: G.trunks, objects, monsters: [], doors: [door('D1', 175, 20)], start: at(3, 23), doorTex: 'vrata_suma',
      intro: 'Drži skok u zraku — krilca te nose!',
      notes: {
        N1: 'Krilca su mi narasla dok sam bio dolje.\n\nKad skočim i držim — lebdim.\nPolako, nečujno… skoro nečujno.',
        N2: 'Na suhom stablu nešto sjedi.\nNe miče se. Samo gleda.\n\nOči kao dva mjeseca.',
        N3: 'Iza ograde počinje močvara.\nKažu da tamo svijetle lampioni.\n\nNemoj ih slijediti.',
      },
    };
  }

  // ZONA 2: MOČVARA — blato, bludna svjetla, Huk lovi
  function mocvara() {
    const W = 240, H = 32, G = grid(W, H), { carve, plat, spikes, fill } = G;
    const trunk = trunkOf(G);
    carve(0, 0, W - 1, 23);
    const mud = (x1, x2) => carve(x1, 24, x2, 24, 'U');
    mud(18, 24); mud(40, 52); mud(70, 75); mud(100, 112); mud(150, 160); mud(190, 200);
    fill(105, 24, 107, 24);                       // otočić s ključem
    plat(43, 47, 23); plat(49, 52, 22); plat(101, 103, 23);
    // suha stabla (Huk sjedi na granama)
    trunk(33, 12, 34, 23); plat(30, 38, 14);
    trunk(85, 10, 86, 23); plat(81, 90, 12);
    trunk(140, 11, 141, 23); plat(136, 145, 13);
    trunk(178, 12, 179, 23); plat(174, 183, 14);
    trunk(214, 10, 215, 23); plat(210, 219, 12);
    carve(60, 24, 63, 26); spikes(60, 63, 26);
    carve(125, 20, 126, 23, 'D');
    // udubina s drugim ključem
    carve(165, 24, 185, 27); carve(166, 27, 184, 27, 'U'); plat(165, 167, 26); plat(183, 185, 26);
    carve(225, 20, 226, 23, 'D');
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 23) }, { type: 'note', id: 'N1', ...at(10, 23) }, { type: 'battery', id: 'B1', ...at(14, 23) },
      { type: 'wisp', id: 'w1', ...at(22, 21) }, { type: 'cabinet', id: 'o1', ...at(28, 23) }, { type: 'battery', id: 'B2', ...at(45, 22) },
      { type: 'wisp', id: 'w2', ...at(48, 18) }, { type: 'crawler', id: 'b1', ...at(56, 23) }, { type: 'cabinet', id: 'o2', ...at(66, 23) },
      { type: 'battery', id: 'B3', ...at(78, 23) }, { type: 'cabinet', id: 'o3', ...at(92, 23) }, { type: 'wisp', id: 'w3', ...at(97, 20) },
      { type: 'key', id: 'K1', ...at(106, 23) }, { type: 'wisp', id: 'w4', ...at(110, 20) }, { type: 'cabinet', id: 'o4', ...at(116, 23) },
      { type: 'checkpoint', id: 'C2', ...at(121, 23) }, { type: 'note', id: 'N2', ...at(123, 23) },
      { type: 'battery', id: 'B4', ...at(132, 23) }, { type: 'cabinet', id: 'o5', ...at(147, 23) }, { type: 'wisp', id: 'w5', ...at(155, 20) },
      { type: 'battery', id: 'B5', ...at(162, 23) }, { type: 'key', id: 'K2', ...at(175, 27) }, { type: 'note', id: 'N3', ...at(166, 25) },
      { type: 'crawler', id: 'b2', ...at(180, 26) },
      { type: 'checkpoint', id: 'C3', ...at(188, 23) }, { type: 'wisp', id: 'w6', ...at(195, 20) }, { type: 'cabinet', id: 'o6', ...at(205, 23) },
      { type: 'battery', id: 'B6', ...at(209, 23) }, { type: 'cabinet', id: 'o7', ...at(221, 23) }, { type: 'exit', id: 'E', ...at(234, 23) },
    ];
    const huks = [
      { id: 'H1', perches: [at(34, 13), at(85, 11)], x1: 15 * TILE, x2: 124 * TILE },
      { id: 'H2', perches: [at(140, 12), at(178, 13), at(214, 11)], x1: 127 * TILE, x2: 224 * TILE },
    ];
    return {
      theme: 'mocvara', W, H, grid: G.g, trunks: G.trunks, objects, monsters: [], huks, doors: [door('D1', 125, 20), door('D2', 225, 20)], start: at(3, 23), doorTex: 'vrata_suma',
      notes: {
        N1: 'Blato vuče prema dolje.\nAko staneš u njemu, potone te.\n\nA svjetla iznad blata nisu krijesnice.',
        N2: 'Huk sjedi na suhim granama.\nNe vidi te u grmu.\n\nAli čuje krila kad lebdiš.',
        N3: 'Netko je bacio ključ u najdublje blato.\n\nKao da je znao da ćeš doći.',
      },
    };
  }

  // ZONA 3: PAUKOVA ŠUMA — ljepljive mreže, pauci, Huk i velika paukica
  function paukova() {
    const W = 252, H = 37, G = grid(W, H), { carve, plat, spikes, crumble, fill } = G;
    const trunk = trunkOf(G);
    carve(0, 0, W - 1, 25);                       // tlo od reda 26
    const web = (x, y1, y2) => { for (let y = y1; y <= y2; y++) G.g[y][x] = 'W'; };
    web(22, 23, 25); web(41, 23, 25); web(78, 23, 25); web(99, 23, 25);
    plat(19, 21, 24); plat(38, 40, 24); plat(75, 77, 24); plat(96, 98, 24);
    // stablo s mrežom i prvim ključem
    trunk(60, 10, 62, 25);
    [24, 20, 16, 12].forEach(y => plat(55, 58, y)); [22, 18, 14, 10].forEach(y => plat(57, 59, y));
    plat(52, 72, 8); web(66, 5, 7); web(70, 5, 7);
    carve(84, 26, 89, 28); spikes(84, 89, 28);
    trunk(110, 12, 111, 25); plat(106, 115, 13);
    carve(120, 22, 121, 25, 'D');
    // jama u donji tunel
    carve(140, 26, 143, 27);
    carve(100, 28, 240, 32);                      // tunel ispod (potjera)
    spikes(120, 121, 32); web(130, 30, 32);
    carve(160, 33, 165, 35); spikes(160, 165, 35); crumble(161, 162, 33); crumble(164, 165, 33);
    web(178, 30, 32); spikes(190, 191, 32); web(205, 30, 32);
    carve(212, 33, 217, 35); spikes(212, 217, 35); crumble(213, 214, 33); crumble(216, 217, 33);
    spikes(226, 227, 32);
    carve(236, 22, 240, 27); plat(236, 237, 31); plat(239, 240, 29); plat(239, 240, 27);
    carve(243, 22, 244, 25, 'D');
    const objects = [
      { type: 'checkpoint', id: 'C1', ...at(5, 25) }, { type: 'note', id: 'N1', ...at(10, 25) }, { type: 'battery', id: 'B1', ...at(15, 25) },
      { type: 'spider', id: 's1', ...at(30, 18) }, { type: 'cabinet', id: 'o1', ...at(33, 25) }, { type: 'battery', id: 'B2', ...at(39, 23) },
      { type: 'crawler', id: 'b1', ...at(48, 25) }, { type: 'battery', id: 'B3', ...at(56, 23) }, { type: 'spider', id: 's2', ...at(64, 9) },
      { type: 'battery', id: 'B4', ...at(58, 13) }, { type: 'key', id: 'K1', ...at(71, 7) }, { type: 'spider', id: 's3', ...at(54, 9) },
      { type: 'cabinet', id: 'o2', ...at(75, 25) }, { type: 'spider', id: 's4', ...at(92, 14) }, { type: 'cabinet', id: 'o3', ...at(105, 25) },
      { type: 'battery', id: 'B5', ...at(97, 23) }, { type: 'checkpoint', id: 'C2', ...at(116, 25) }, { type: 'note', id: 'N2', ...at(118, 25) },
      { type: 'battery', id: 'B6', ...at(128, 25) }, { type: 'spider', id: 's5', ...at(134, 18) },
      // tunel
      { type: 'key', id: 'K2', ...at(102, 32) }, { type: 'note', id: 'N3', ...at(105, 32) }, { type: 'checkpoint', id: 'C3', ...at(147, 32) },
      { type: 'battery', id: 'B7', ...at(150, 32) }, { type: 'crawler', id: 'b2', ...at(196, 32) }, { type: 'battery', id: 'B8', ...at(222, 32) },
      { type: 'note', id: 'N4', ...at(246, 25) }, { type: 'exit', id: 'E', ...at(249, 25) },
    ];
    const huks = [{ id: 'H1', perches: [at(110, 12), at(56, 7)], x1: 12 * TILE, x2: 119 * TILE }];
    return {
      theme: 'paukova', W, H, grid: G.g, trunks: G.trunks, objects, monsters: [], huks, doors: [door('D1', 120, 22), door('D2', 243, 22)], start: at(3, 25), doorTex: 'vrata_suma',
      darkWall: { key: 'K2', startX: 100 * TILE - 300, stopX: 236 * TILE - 20, speed: 84, style: 'spider', y: 33 * TILE - 52 },
      notes: {
        N1: 'Mreže su ljepljive.\nAko zapneš — tapkaj skok dok se ne otrgneš.\n\nIli ih unaprijed presijeci štapom.',
        N2: 'Ispod šume je tunel.\nTamo dolje spava ona.\nVelika. Stara. Gladna.',
        N3: 'Ključ je u njezinom gnijezdu.\n\nKad ga uzmeš — trči desno.\nNe staj ni zbog čega.',
        N4: 'Iza ove ograde šuma se nastavlja.\nAli večeras dalje ne idem.\n\n(nastavlja se…)',
      },
    };
  }

  Level.addZones(1, [rubSume, mocvara, paukova]);
})();
