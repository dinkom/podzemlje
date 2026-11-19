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
  // key = id teme, id = izgled (rub/mocvara/paukova), pal = boje neba i drveća
  const common = (key, id = key, pal = {}) => ({
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
    spikeCols: pal.spike || (id === 'paukova' ? ['#d8d6e6', '#5a5468'] : ['#6a5236', '#2e2214']),
    plank(c, kind, T, OUT) {
      // grana s lišćem umjesto daske
      const [bark, dark, leaf] = T.plank;
      c.fillStyle = bark; c.beginPath(); c.moveTo(kind === 0 ? 2 : 0, 1.5); c.lineTo(kind === 2 ? 22 : 24, 1); c.lineTo(kind === 2 ? 22 : 24, 6); c.lineTo(kind === 0 ? 2 : 0, 6.5); c.closePath(); c.fill();
      c.strokeStyle = OUT; c.lineWidth = 0.8; c.stroke();
      c.strokeStyle = dark; c.lineWidth = 0.5; c.beginPath(); c.moveTo(3, 3.5); c.lineTo(21, 3); c.moveTo(6, 5); c.lineTo(14, 4.8); c.stroke();
      const R = Tiles.rng(kind * 17 + key.length);
      for (let i = 0; i < 4; i++) {
        const x = 2 + R() * 20;
        c.fillStyle = i % 2 ? leaf : leafCol[id][1];
        c.beginPath(); c.ellipse(x, 0.5 - R() * 1.5, 2.6, 1.4, (R() - 0.5) * 1.2, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 0.3; c.stroke();
      }
      if (id === 'paukova') { c.strokeStyle = 'rgba(235,235,250,0.55)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(12, 14, 24, 6); c.stroke(); }
      if (kind !== 1) { c.strokeStyle = bark; c.lineWidth = 2.6; c.beginPath(); c.moveTo(kind === 0 ? 2 : 22, 4); c.lineTo(kind === 0 ? -1 : 25, 2); c.stroke(); }
    },
    deco(c, i, T, h) {
      const { R, ell, tri, cobweb } = h;
      const fern = (x, col) => { for (let k = 0; k < 5; k++) { c.strokeStyle = col; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x, 24); c.quadraticCurveTo(x + (k - 2) * 3, 17, x + (k - 2) * 5.5, 12 + R() * 4); c.stroke(); } };
      const flower = (x, h, col) => { c.strokeStyle = '#4c7a48'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, 24); c.lineTo(x, 24 - h); c.stroke(); for (let k = 0; k < 5; k++) { const a = k * 1.256; ell(x + Math.cos(a) * 1.4, 24 - h + Math.sin(a) * 1.4, 1.1, 1.1, col, 0); } ell(x, 24 - h, 0.7, 0.7, '#fff6c0', 0); };
      const hangLeaves = (col) => { for (let k = 0; k < 4; k++) { const x = 3 + k * 5 + R() * 2; c.strokeStyle = '#3a5a2e'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 4 + R() * 6); c.stroke(); ell(x, 6 + R() * 6, 2.2, 1.3, col, 0.3); } };
      const vines = (col) => { for (let k = 0; k < 3; k++) { c.strokeStyle = col; c.lineWidth = 1; const x = 5 + k * 6; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 3, 7, x - 3, 12, x + 1, 16 + R() * 7); c.stroke(); } };
      if (id === 'rub') {
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
      } else if (id === 'mocvara') {
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
      const sky = pal.sky || { rub: ['#07102a', '#16284e', '#24365a'], mocvara: ['#0a1410', '#1a2a24', '#2a3a30'], paukova: ['#0a0812', '#1a1628', '#2a2438'] }[id];
      const g = c.createLinearGradient(0, 0, 0, 280); g.addColorStop(0, sky[0]); g.addColorStop(0.65, sky[1]); g.addColorStop(1, sky[2]);
      c.fillStyle = g; c.fillRect(0, 0, 600, 280);
      const stars = []; for (let i = 0; i < 70; i++) stars.push([R() * 600, R() * 170, R()]);
      h.wrap(() => {
        stars.forEach(([x, y, a]) => { c.fillStyle = `rgba(255,255,255,${0.25 + a * 0.6})`; c.fillRect(x, y, a > 0.85 ? 1.4 : 0.8, a > 0.85 ? 1.4 : 0.8); });
        // daleki red drveća
        c.fillStyle = pal.far || (id === 'mocvara' ? '#13201a' : id === 'paukova' ? '#16121e' : '#0f1a32');
        c.beginPath(); c.moveTo(0, 280);
        for (let x = 0; x <= 600; x += 14) { const t = 200 + Math.sin(x * 0.05) * 10 + ((x * 7) % 23); c.lineTo(x, t + 12); c.lineTo(x + 7, t - 6 - ((x * 13) % 17)); }
        c.lineTo(600, 280); c.closePath(); c.fill();
        if (id === 'mocvara') { const fg = c.createLinearGradient(0, 190, 0, 260); fg.addColorStop(0, 'rgba(160,190,170,0)'); fg.addColorStop(1, 'rgba(160,190,170,0.22)'); c.fillStyle = fg; c.fillRect(0, 190, 600, 90); }
        if (id === 'paukova') { c.strokeStyle = 'rgba(220,220,240,0.12)'; c.lineWidth = 0.8; for (let k = 0; k < 6; k++) { const cx = (k * 113) % 600, cy = 60 + (k * 41) % 90; for (let r = 8; r < 40; r += 8) { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke(); } for (let a = 0; a < 8; a++) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a * 0.785) * 44, cy + Math.sin(a * 0.785) * 44); c.stroke(); } } }
      });
    },
    bgMid(c, R, h) {
      const trunk = pal.trunk || (id === 'mocvara' ? '#162016' : id === 'paukova' ? '#1a1620' : '#121c2e');
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
      // čupavi pernati ovratnik i rogovi od perja
      c.fillStyle = '#2e261c';
      c.beginPath(); c.moveTo(6, 10); c.lineTo(2, 0); c.lineTo(9, 6); c.lineTo(21, 6); c.lineTo(28, 0); c.lineTo(24, 10); c.closePath(); c.fill(); c.strokeStyle = OUTL; c.lineWidth = 0.8; c.stroke();
      c.fillStyle = '#3a3024';
      c.beginPath(); for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI * 2, r = k % 2 ? 13.5 : 11.5; c.lineTo(15 + Math.cos(a) * r, 16 + Math.sin(a) * r * 0.95); } c.closePath(); c.fill(); c.stroke();
      if (back) {
        for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(7 + k * 5 + (r % 2) * 2.5, 11 + r * 5, 2.8, 0, Math.PI); c.strokeStyle = 'rgba(10,6,3,0.7)'; c.lineWidth = 0.6; c.stroke(); }
        return;
      }
      // ljudsko lice — blijedo, upalo, izduženo
      c.fillStyle = radial(c, 13, 12, 1, 13, [[0, '#d6cfbf'], [0.7, '#a59c88'], [1, '#6e6656']]);
      c.beginPath(); c.moveTo(15, 5); c.bezierCurveTo(24, 5, 24, 17, 20, 25); c.quadraticCurveTo(15, 29, 10, 25); c.bezierCurveTo(6, 17, 6, 5, 15, 5); c.fill();
      c.strokeStyle = OUTL; c.lineWidth = 0.6; c.stroke();
      // upali obrazi
      c.fillStyle = 'rgba(40,30,20,0.45)'; c.beginPath(); c.ellipse(9.8, 19, 1.4, 3, 0.2, 0, Math.PI * 2); c.ellipse(20.2, 19, 1.4, 3, -0.2, 0, Math.PI * 2); c.fill();
      // crne duplje i ogromne okrugle oči
      [[10.5, 13], [19.5, 13]].forEach(([x, y]) => {
        c.fillStyle = '#0a0604'; c.beginPath(); c.arc(x, y, 4.3, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffcf2a'; c.beginPath(); c.arc(x, y, 3.3, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#b01818'; c.lineWidth = 0.6; c.stroke();
        c.fillStyle = '#000'; c.beginPath(); c.arc(x, y, 0.7, 0, Math.PI * 2); c.fill();
      });
      // kljun preko usta, ispod usta pune ljudskih zuba
      c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(13.4, 16); c.lineTo(16.6, 16); c.lineTo(15, 21.5); c.closePath(); c.fill();
      c.fillStyle = '#3a0608'; c.beginPath(); c.ellipse(15, 23.2, 3.6, 1.7, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#efe6cc'; for (let k = 0; k < 6; k++) c.fillRect(11.8 + k * 1.15, 22.1, 0.8, 1.1);
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
    // lice golemog pauka za jumpscare
    {
      const t = scene.textures.createCanvas('lice_pauk', 512, 512), c = t.getContext();
      c.fillStyle = '#000'; c.fillRect(0, 0, 512, 512);
      c.save(); c.translate(256, 250);
      // dlakava glava
      c.fillStyle = radial(c, 0, -20, 20, 260, [[0, '#3a2a34'], [0.7, '#1c1218'], [1, '#080406']]);
      c.beginPath(); c.ellipse(0, 0, 240, 210, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(120,100,110,0.35)'; c.lineWidth = 3;
      for (let k = 0; k < 140; k++) { const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 120; c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.88); c.lineTo(Math.cos(a) * (r + 18), Math.sin(a) * (r + 18) * 0.88 + 6); c.stroke(); }
      // osam očiju
      [[-62, -70, 46], [62, -70, 46], [-150, -40, 26], [150, -40, 26], [-30, -150, 22], [30, -150, 22], [-110, -120, 16], [110, -120, 16]].forEach(([x, y, r]) => {
        c.fillStyle = '#000'; c.beginPath(); c.arc(x, y, r + 7, 0, Math.PI * 2); c.fill();
        c.fillStyle = radial(c, x - r * 0.2, y - r * 0.2, 0, r, [[0, '#ff6a5a'], [0.4, '#b0101a'], [1, '#2a0204']]); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, Math.PI * 2); c.fill();
      });
      // čeljusti s očnjacima
      [-1, 1].forEach(sg => {
        c.fillStyle = '#140a10'; c.beginPath(); c.moveTo(sg * 20, 20); c.quadraticCurveTo(sg * 110, 40, sg * 90, 150); c.lineTo(sg * 40, 120); c.closePath(); c.fill();
        c.fillStyle = '#e8e0d0'; c.beginPath(); c.moveTo(sg * 92, 140); c.quadraticCurveTo(sg * 100, 200, sg * 40, 250); c.quadraticCurveTo(sg * 70, 195, sg * 62, 138); c.closePath(); c.fill();
        c.fillStyle = 'rgba(160,220,120,0.8)'; c.beginPath(); c.ellipse(sg * 44, 262, 6, 12, 0, 0, Math.PI * 2); c.fill();
      });
      c.fillStyle = '#300408'; c.beginPath(); c.ellipse(0, 90, 40, 60, 0, 0, Math.PI * 2); c.fill();
      c.restore();
      c.fillStyle = radial(c, 256, 250, 150, 380, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.85)']]); c.fillRect(0, 0, 512, 512);
      t.refresh();
    }
    // Hukovo lice za jumpscare — ljudsko lice u sovinom perju
    const t = scene.textures.createCanvas('lice_huk', 512, 512);
    const c = t.getContext();
    c.fillStyle = '#000'; c.fillRect(0, 0, 512, 512);
    c.save(); c.translate(256, 262); c.rotate(-0.22);   // sovinski nagib glave
    // rogovi i ovratnik od perja
    c.fillStyle = '#241c14';
    c.beginPath(); c.moveTo(-170, -120); c.lineTo(-215, -300); c.lineTo(-90, -200); c.lineTo(90, -200); c.lineTo(215, -300); c.lineTo(170, -120); c.closePath(); c.fill();
    c.fillStyle = '#32291e';
    c.beginPath(); for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2, r = (k % 2 ? 270 : 232) + Math.sin(k * 3.1) * 10; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.95 + 10); } c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 3;
    for (let k = 0; k < 60; k++) { const a = k / 60 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * 175, Math.sin(a) * 175); c.lineTo(Math.cos(a) * 255, Math.sin(a) * 245); c.stroke(); }
    // izduženo, upalo ljudsko lice
    c.fillStyle = radial(c, -30, -70, 10, 280, [[0, '#e3dccb'], [0.55, '#b3a990'], [1, '#5e5644']]);
    c.beginPath(); c.moveTo(0, -205); c.bezierCurveTo(175, -205, 165, 60, 95, 190); c.quadraticCurveTo(0, 255, -95, 190); c.bezierCurveTo(-165, 60, -175, -205, 0, -205); c.fill();
    // perje izbija kroz kožu
    c.strokeStyle = '#3a3024'; c.lineWidth = 4;
    [[-120, -120, -0.6], [130, -90, 0.5], [-140, 70, -0.9], [120, 110, 0.8], [-60, -175, -0.2]].forEach(([x, y, a]) => {
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + k * 7, y + k * 5); c.lineTo(x + k * 7 + Math.cos(a - 1.2) * 40, y + k * 5 + Math.sin(a - 1.2) * 40); c.stroke(); }
    });
    // žile i pukotine
    c.strokeStyle = 'rgba(70,40,40,0.55)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(25, -200); c.lineTo(12, -150); c.lineTo(38, -118); c.moveTo(-150, 30); c.lineTo(-118, 70); c.lineTo(-132, 120); c.stroke();
    // upali obrazi
    c.fillStyle = 'rgba(30,22,14,0.5)';
    c.beginPath(); c.ellipse(-112, 70, 26, 70, 0.15, 0, Math.PI * 2); c.ellipse(112, 70, 26, 70, -0.15, 0, Math.PI * 2); c.fill();
    // duplje i goleme oči
    [[-78, -55, 1], [80, -55, 0.92]].forEach(([x, y, s]) => {
      c.fillStyle = radial(c, x, y, 40, 105, [[0, '#060302'], [0.75, 'rgba(10,6,3,0.9)'], [1, 'rgba(10,6,3,0)']]);
      c.beginPath(); c.arc(x, y, 105, 0, Math.PI * 2); c.fill();
      c.fillStyle = radial(c, x, y, 0, 72 * s, [[0, '#fff7b0'], [0.45, '#ffcc1a'], [0.85, '#d07a00'], [1, '#7a1a08']]);
      c.beginPath(); c.arc(x, y, 72 * s, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(190,20,20,0.75)'; c.lineWidth = 2.5;
      for (let k = 0; k < 9; k++) { const a = k * 0.7 + 0.3; c.beginPath(); c.moveTo(x + Math.cos(a) * 70 * s, y + Math.sin(a) * 70 * s); c.lineTo(x + Math.cos(a + 0.15) * 46 * s, y + Math.sin(a + 0.15) * 46 * s); c.lineTo(x + Math.cos(a - 0.1) * 30 * s, y + Math.sin(a - 0.1) * 30 * s); c.stroke(); }
      c.fillStyle = '#000'; c.beginPath(); c.arc(x, y, 9 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 20, y - 24, 6, 0, Math.PI * 2); c.fill();
    });
    // crne suze iz očiju
    c.strokeStyle = 'rgba(15,8,5,0.75)'; c.lineCap = 'round';
    [[-95, 10, 9], [-70, 14, 6], [92, 12, 8], [66, 16, 5]].forEach(([x, y, w]) => { c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - 4, y + 40, x + 4, y + 70, x - 2, y + 105); c.stroke(); });
    // razjapljena usta (vrisak) s iglastim zubima
    const q = (t, a, b, k) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * k + t * t * b;
    c.fillStyle = '#1a0204';
    c.beginPath(); c.moveTo(-82, 108); c.quadraticCurveTo(0, 128, 82, 108); c.quadraticCurveTo(0, 290, -82, 108); c.fill();
    c.fillStyle = radial(c, 0, 175, 5, 70, [[0, '#000'], [1, 'rgba(60,4,8,0)']]); c.beginPath(); c.ellipse(0, 172, 50, 40, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e9dfc0';
    for (let i = 0; i < 13; i++) { const t = (i + 0.5) / 13, x = -82 + 164 * t, y = q(t, 108, 108, 128); const L = 18 + Math.sin(t * Math.PI) * 14; c.beginPath(); c.moveTo(x - 5, y - 1); c.lineTo(x + 5, y - 1); c.lineTo(x + 0.5, y + L); c.closePath(); c.fill(); }
    for (let i = 0; i < 11; i++) { const t = (i + 0.5) / 11, x = -82 + 164 * t, y = q(t, 108, 108, 290); const L = 14 + Math.sin(t * Math.PI) * 12; c.beginPath(); c.moveTo(x - 5, y + 1); c.lineTo(x + 5, y + 1); c.lineTo(x - 0.5, y - L); c.closePath(); c.fill(); }
    // zakrivljeni kljun preko nosa, do usta
    c.fillStyle = radial(c, -6, -10, 2, 90, [[0, '#4a3624'], [1, '#140c06']]);
    c.beginPath(); c.moveTo(-28, -20); c.quadraticCurveTo(0, -40, 28, -20); c.quadraticCurveTo(22, 60, 2, 118); c.quadraticCurveTo(-4, 92, -28, -20); c.fill();
    c.strokeStyle = 'rgba(255,240,210,0.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-10, -18); c.quadraticCurveTo(-6, 40, 0, 100); c.stroke();
    c.restore();
    c.fillStyle = radial(c, 256, 250, 150, 380, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.85)']]); c.fillRect(0, 0, 512, 512);
    t.refresh();
  });

  // ================= ZONE =================
  const { grid, at, door } = Level.tools;
  const trunkOf = (G) => { G.trunks = []; return (x1, y1, x2, y2) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) G.trunks.push([x, y]); }; };

  // ---------- graditelj staze (kursor s lijeva na desno) ----------
  function course(W, H, GR) {
    const G = grid(W, H), trunk = trunkOf(G);
    G.carve(0, 0, W - 1, GR - 1);
    const S = GR - 1;
    const c = { G, X: 0, O: [], doors: [], S, GR, trunk };
    const cnt = {};
    c.put = (type, x, y = S, id) => { const p = { checkpoint: 'C', note: 'N', battery: 'B', key: 'K', cabinet: 'o', crawler: 'b', spider: 's', wisp: 'w' }[type] || type; id = id || p + (cnt[p] = (cnt[p] || 0) + 1); c.O.push({ type, id, ...at(x, y) }); return c; };
    c.flat = (n) => { c.X += n; return c; };
    c.pit = (n, d = 3) => { G.carve(c.X, GR, c.X + n - 1, GR + d); G.spikes(c.X, c.X + n - 1, GR + d); c.X += n; return c; };
    c.hill = (n, h) => { G.fill(c.X, GR - h, c.X + n - 1, GR - 1); c.X += n; return c; };
    c.glidePit = (n) => { c.hill(3, 2); return c.pit(n, 4); };
    // padajuće grane iznad jame
    c.crumbles = (n) => { const x0 = c.X; c.pit(n); for (let x = x0 + 1; x + 1 < x0 + n; x += 3) G.crumble(x, x + 1, S); return c; };
    // stablo: deblo, stepenice od grana, krošnja na redu `top`
    c.tree = (top, w = 20) => {
      const x0 = c.X, tx = x0 + 8;
      trunk(tx, top - 1, tx + 2, GR - 1);
      for (let y = top + 2, k = 0; y <= GR - 2; y += 2, k++) k % 2 ? G.plat(tx - 4, tx - 1, y) : G.plat(tx - 6, tx - 3, y);
      if ((GR - 2 - top) % 2) G.plat(tx - 5, tx - 2, GR - 1);
      G.plat(x0, x0 + w, top);
      c.X += w + 1;
      return { x0, x1: x0 + w, tx, top };
    };
    // suho stablo s granom (Hukovo sjedalo)
    c.dead = (h) => { const x0 = c.X; trunk(x0 + 4, GR - h - 1, x0 + 5, GR - 1); G.plat(x0, x0 + 9, GR - h); c.X += 10; return at(x0 + 5, GR - h - 1); };
    // stijena s vratima (preko nje se ne može preletjeti)
    c.door = (id) => { G.fill(c.X, 0, c.X + 5, GR - 5); G.carve(c.X + 2, GR - 4, c.X + 3, GR - 1, 'D'); c.doors.push(door(id, c.X + 2, GR - 4)); c.X += 6; return c; };
    c.mud = (n) => { G.carve(c.X, GR, c.X + n - 1, GR, 'U'); c.X += n; return c; };
    c.logs = (n) => { const x0 = c.X; c.mud(n); for (let x = x0 + 2; x + 1 < x0 + n - 1; x += 4) G.crumble(x, x + 1, S); return c; };
    c.web = (x, y1, y2) => { for (let y = y1; y <= y2; y++) G.g[y][x] = 'W'; return c; };
    c.pillar = (h) => { G.fill(c.X, GR - h, c.X + 2, GR - 1); c.X += 3; return c; };
    return c;
  }

  // ZONA 1: RUB ŠUME — lebdenje, Huk se pokaže, a od prvog ključa lovi (poslije i drugi)
  function rubSume() {
    const c = course(440, 32, 24), G = c.G, S = c.S;
    c.put('checkpoint', 4).put('note', 8, S, 'N1').flat(12);
    c.pit(2).flat(3).put('battery', c.X - 1).glidePit(9).flat(3).put('crawler', c.X).flat(3).put('cabinet', c.X).flat(2);
    let t = c.tree(8);
    c.put('spider', t.x0 + 5, 9).put('spider', t.x0 + 15, 9).put('battery', t.x0 + 2, t.top - 1);
    G.crumble(c.X - 1, c.X, 8); G.crumble(c.X + 2, c.X + 3, 8);
    c.pit(24, 5);
    c.flat(3).put('checkpoint', c.X).put('note', c.X + 3, S, 'N2').flat(5);
    const cam = c.dead(13); c.put('hukCameo', cam.x / TILE | 0, cam.y / TILE - 1 | 0, 'h0');
    c.flat(2).put('cabinet', c.X).flat(2).pit(3).flat(2).put('crawler', c.X).flat(3).pit(2).flat(3).put('crawler', c.X - 1).flat(1);
    t = c.tree(8);
    c.put('spider', t.x0 + 6, 9).put('spider', t.x0 + 13, 9).put('battery', t.x0 + 2, t.top - 1).put('key', t.x1 - 1, 7, 'K1');
    c.pit(11, 5);
    const P1 = c.dead(10);
    c.flat(1).put('checkpoint', c.X).flat(2).put('cabinet', c.X).flat(2).door('D1');
    // dio 2 — Huk lovi
    c.flat(2).put('note', c.X, S, 'N3').flat(3).put('cabinet', c.X).flat(4);
    const P2 = c.dead(12);
    c.flat(2).put('crawler', c.X).flat(2).crumbles(10).flat(2).put('cabinet', c.X).flat(5);
    const P3 = c.dead(12);
    c.flat(2).put('cabinet', c.X - 1).pit(3).flat(2).put('crawler', c.X).flat(2).pit(3).flat(3).put('battery', c.X - 1).flat(1);
    t = c.tree(5, 18);
    c.put('spider', t.x0 + 4, 6).put('spider', t.x0 + 14, 6).put('battery', t.x0 + 2, t.top - 1).put('key', t.x1 - 1, 4, 'K2');
    // lanac stupova — samo lebdenjem
    c.pit(6, 5).pillar(10).pit(8, 5).pillar(7).pit(8, 5);
    c.flat(2).put('checkpoint', c.X).flat(3).put('cabinet', c.X).flat(3);
    const P4 = c.dead(11);
    c.flat(2).put('crawler', c.X).pit(3).flat(2).put('cabinet', c.X).flat(3).crumbles(10).flat(3).put('crawler', c.X).flat(4);
    const P5 = c.dead(12);
    c.flat(2).put('cabinet', c.X).flat(3).pit(3).flat(3).put('cabinet', c.X).flat(2).door('D2');
    c.flat(3).put('note', c.X, S, 'N4').flat(4).put('exit', c.X).flat(4);
    const huks = [
      { id: 'H1', dormant: 'K1', perches: [cam, P1, P2, P3, P4, P5], x1: cam.x - 4 * TILE, x2: c.X * TILE },
      { id: 'H2', dormant: 'K2', perches: [P4, P5, P3], x1: P3.x - 10 * TILE, x2: c.X * TILE },
    ];
    return {
      theme: 'rub', W: 440, H: 32, grid: G.g, trunks: G.trunks, objects: c.O, monsters: [], huks, doors: c.doors, start: at(2, S), doorTex: 'vrata_suma',
      intro: 'Drži skok u zraku — krilca te nose!',
      notes: {
        N1: 'Krilca su mi narasla dok sam bio dolje.\n\nKad skočim i držim — lebdim.\nPolako, nečujno… skoro nečujno.',
        N2: 'Na suhom stablu nešto sjedi.\nNe miče se. Samo gleda.\n\nOči kao dva mjeseca.',
        N3: 'Huk okreće glavu skroz unatrag.\nDok mu oči svijetle — vidi sve.\n\nU grmu me ne vidi.\nAli krila čuje.',
        N4: 'Bila su dvojica.\n\nIza stijene miriše na vodu i trulo lišće.\nMočvara.',
      },
    };
  }

  // ZONA 2: MOČVARA — blato, bludna svjetla, tri Huka
  function mocvara() {
    const c = course(470, 34, 24), G = c.G, S = c.S;
    c.put('checkpoint', 4).put('note', 8, S, 'N1').flat(11);
    c.mud(6).flat(2).put('cabinet', c.X - 1).put('wisp', c.X + 4, S - 2).mud(9).flat(2).put('battery', c.X - 1).put('wisp', c.X + 3, S - 3).mud(8).flat(3);
    const P1 = c.dead(11);
    c.flat(2).put('cabinet', c.X - 1).pit(3).flat(2).put('crawler', c.X).flat(2);
    c.put('wisp', c.X + 4, S - 2).put('wisp', c.X + 10, S - 3).logs(14).flat(3).put('checkpoint', c.X - 2).put('note', c.X + 1, S, 'N2').flat(3);
    const P2 = c.dead(12);
    c.flat(2).put('cabinet', c.X).flat(2);
    c.put('wisp', c.X + 3, S - 2).mud(6); G.fill(c.X, 24, c.X + 2, 24); c.put('key', c.X + 1, S, 'K1').flat(3).put('wisp', c.X + 3, S - 2).mud(7);
    c.flat(2).put('cabinet', c.X - 1).flat(1).pit(3).flat(2).put('crawler', c.X).flat(2);
    const P3 = c.dead(11);
    c.flat(1).put('cabinet', c.X).flat(2).door('D1');
    // dio 2
    c.flat(2).put('checkpoint', c.X).put('battery', c.X + 2).flat(4);
    c.put('wisp', c.X + 3, S - 2).put('wisp', c.X + 8, S - 3).mud(10).flat(2).put('cabinet', c.X - 1).flat(2);
    const P4 = c.dead(12);
    c.flat(2).put('wisp', c.X + 6, S - 2).logs(16).flat(2).put('cabinet', c.X).flat(3);
    // potopljena jama s drugim ključem
    const x0 = c.X;
    G.carve(x0, 24, x0 + 20, 27); G.carve(x0 + 1, 27, x0 + 19, 27, 'U'); G.plat(x0, x0 + 2, 26); G.plat(x0 + 18, x0 + 20, 26);
    G.plat(x0 + 7, x0 + 8, 25); G.plat(x0 + 12, x0 + 13, 25);
    c.put('note', x0 + 1, 25, 'N3').put('key', x0 + 10, 27, 'K2').put('crawler', x0 + 15, 27).put('wisp', x0 + 5, 24).put('wisp', x0 + 15, 23);
    c.X += 21;
    c.flat(2).put('battery', c.X).flat(2);
    const P5 = c.dead(12);
    c.flat(2).put('cabinet', c.X - 1).pit(3).flat(1).put('wisp', c.X + 4, S - 2).mud(9).flat(2).put('checkpoint', c.X).flat(3).put('cabinet', c.X).flat(2);
    c.put('wisp', c.X + 4, S - 3).logs(12).flat(2);
    const P6 = c.dead(11);
    c.flat(2).put('crawler', c.X).flat(2).mud(7).flat(2).put('cabinet', c.X - 1).pit(3).flat(2).put('cabinet', c.X).flat(2).door('D2');
    c.flat(4).put('exit', c.X).flat(4);
    const mid = P3.x + 8 * TILE;
    const huks = [
      { id: 'H1', perches: [P1, P2, P3], x1: 14 * TILE, x2: mid },
      { id: 'H2', perches: [P4, P5, P6], x1: mid, x2: c.X * TILE },
      { id: 'H3', dormant: 'K2', perches: [P6, P5, P4], x1: mid, x2: c.X * TILE },
    ];
    return {
      theme: 'mocvara', W: 470, H: 34, grid: G.g, trunks: G.trunks, objects: c.O, monsters: [], huks, doors: c.doors, start: at(2, S), doorTex: 'vrata_suma',
      notes: {
        N1: 'Blato vuče prema dolje.\nAko zastaneš u njemu, potonut ćeš.\n\nA svjetla iznad blata nisu krijesnice.',
        N2: 'Trula debla plutaju na blatu.\nNe drže dugo.\n\nHuk sjedi na suhim granama.\nČuje krila kad lebdiš.',
        N3: 'Netko je bacio ključ u najdublje blato.\n\nKao da je znao da ćeš doći.',
      },
    };
  }

  // ZONA 3: PAUKOVA ŠUMA — mreže, pauci, Huk, a u tunelu golema paukica
  function paukova() {
    const W = 372, H = 38, GR = 26;
    const c = course(W, H, GR), G = c.G, S = c.S;
    c.put('checkpoint', 4).put('note', 8, S, 'N1').flat(12);
    c.web(c.X + 2, S - 2, S).put('spider', c.X + 5, 20).flat(6).pit(3).flat(2).put('cabinet', c.X).flat(2);
    c.web(c.X + 1, S - 2, S).flat(3).put('crawler', c.X).flat(3);
    let t = c.tree(9);
    c.web(t.x0 + 9, 6, 8).web(t.x0 + 15, 6, 8).put('spider', t.x0 + 4, 10).put('spider', t.x0 + 12, 10).put('spider', t.x0 + 18, 10).put('battery', t.x0 + 2, t.top - 1);
    G.crumble(c.X - 1, c.X, 9); G.crumble(c.X + 2, c.X + 3, 9); G.crumble(c.X + 5, c.X + 6, 9);
    c.pit(20, 5);
    c.flat(2).put('checkpoint', c.X).flat(3);
    const P1 = c.dead(12);
    c.web(c.X + 2, S - 2, S).flat(4).put('cabinet', c.X).flat(2).pit(3).flat(2).put('crawler', c.X).flat(3);
    t = c.tree(7);
    c.web(t.x0 + 6, 4, 6).web(t.x0 + 12, 4, 6).put('spider', t.x0 + 3, 8).put('spider', t.x0 + 9, 8).put('spider', t.x0 + 16, 8).put('battery', t.x0 + 2, t.top - 1).put('key', t.x1 - 1, 6, 'K1');
    c.crumbles(9).flat(2);
    const P2 = c.dead(12);
    c.flat(1).put('cabinet', c.X).flat(2).door('D1');
    // dio 2 — iznad tunela
    c.flat(2).put('checkpoint', c.X).put('note', c.X + 2, S, 'N2').flat(5);
    const tunA = c.X;
    c.web(c.X + 2, S - 2, S).put('spider', c.X + 6, 19).flat(8).put('cabinet', c.X).flat(2).pit(3).flat(3).put('crawler', c.X).flat(2);
    const P3 = c.dead(12);
    c.web(c.X + 3, S - 2, S).flat(6).put('battery', c.X).flat(3).pit(2).flat(3).put('cabinet', c.X).flat(4);
    // rupa u tunel
    const hole = c.X;
    G.carve(hole, GR, hole + 3, GR + 3);
    c.flat(4).flat(10);
    const P4 = c.dead(12);
    c.flat(4);
    // tunel ispod: od tunA do kraja potjere
    const T1 = GR + 4, T2 = GR + 8, tunEnd = hole + 152;
    G.carve(tunA, T1, tunEnd, T2);
    c.put('key', tunA + 2, T2, 'K2').put('note', tunA + 5, T2, 'N3').put('checkpoint', hole + 8, T2).put('battery', hole + 11, T2);
    // prepreke u tunelu (potjera ide desno od ključa)
    const tun = (x, f) => f(x);
    G.spikes(tunA + 14, tunA + 15, T2); c.web(tunA + 22, T2 - 2, T2); G.spikes(tunA + 30, tunA + 31, T2);
    // od rupe nadesno
    let x = hole + 16;
    const tPit = (x, n) => { G.carve(x, T2 + 1, x + n - 1, T2 + 3); G.spikes(x, x + n - 1, T2 + 3); for (let k = x + 1; k + 1 < x + n; k += 3) G.crumble(k, k + 1, T2 + 1); };
    tPit(x, 6); x += 10; c.web(x, T2 - 2, T2); x += 6; G.spikes(x, x + 1, T2); x += 6;
    c.put('crawler', x, T2); x += 4; c.web(x, T2 - 2, T2); x += 5; tPit(x, 9); x += 13;
    G.spikes(x, x + 1, T2); x += 4; G.plat(x, x + 2, T2 - 2); G.spikes(x + 3, x + 4, T2); x += 9; c.web(x, T2 - 3, T2); x += 5;
    tPit(x, 6); x += 10; G.spikes(x, x + 1, T2); x += 5; c.web(x, T2 - 2, T2); x += 4; G.spikes(x, x + 1, T2); x += 6;
    tPit(x, 9); x += 13; c.web(x, T2 - 2, T2); x += 5; G.spikes(x, x + 1, T2); x += 6;
    // izlaz iz tunela gore
    const up = x + 3;
    G.fill(up + 5, T1, tunEnd, T2);
    G.carve(up, GR - 4, up + 4, T1);
    if (up + 30 > W) throw new Error('zona prekratka ' + up);
    for (let y = T2 - 2, k = 0; y > GR - 2; y -= 2, k++) G.plat(k % 2 ? up + 3 : up, k % 2 ? up + 4 : up + 1, y);
    c.X = up + 5;
    c.flat(2).door('D2').flat(3).put('note', c.X, S, 'N4').flat(3).put('exit', c.X).flat(4);
    const huks = [
      { id: 'H1', perches: [P1, P2], x1: 12 * TILE, x2: P2.x + 6 * TILE },
      { id: 'H2', perches: [P3, P4], x1: tunA * TILE, x2: (P4.x + 6 * TILE) },
    ];
    return {
      theme: 'paukova', W, H, grid: G.g, trunks: G.trunks, objects: c.O, monsters: [], huks, doors: c.doors, start: at(2, S), doorTex: 'vrata_suma',
      darkWall: { key: 'K2', stopX: up * TILE - 20, speed: 96, style: 'spider', y: (T2 + 1) * TILE - 52 },
      notes: {
        N1: 'Mreže su ljepljive.\nAko zapneš — tapkaj skok dok se ne otrgneš.\n\nIli ih unaprijed presijeci štapom.',
        N2: 'Ispod šume je tunel.\nTamo dolje spava ona.\nVelika. Stara. Gladna.',
        N3: 'Ključ je u njezinom gnijezdu.\n\nKad ga uzmeš — trči desno.\nNe staj ni zbog čega.',
        N4: 'Iza ove ograde šuma se nastavlja.\nAli večeras dalje ne idem.\n\n(nastavlja se…)',
      },
    };
  }

  Level.addZones(1, [rubSume, mocvara, paukova]);
  window.Suma = { common, course, trunkOf };
})();
