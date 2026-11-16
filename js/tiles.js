// Podzemlje — teme zona: pločice stijena, daske, ukrasi i pozadine
const TILE = 24;          // logička veličina pločice (svijet)
const TPX = TILE * RES;   // piksela u teksturi

const THEMES = {
  spilje: {
    id: 'spilje', name: 'Gornje špilje',
    rock: ['#2f3747', '#232a37', '#1d232e'], spLight: 'rgba(70,82,104,0.55)', spDark: 'rgba(14,17,24,0.5)', rimL: 'rgba(120,135,160,0.18)',
    surface: 'moss', extra: null,
    plank: ['#9a7149', '#5b3f27', '#b8bfc9'],
    glow: [0x63e6d6, 0xc08cff], dark: 'rgba(2,3,6,', darkA: 0.93, cam: '#06080d',
    drone: { f: 43.6, f3: 65.4, lp: 260, wind: 400, windG: 0.018 }, drip: [2.5, 5],
  },
  rudnik: {
    id: 'rudnik', name: 'Kristalni rudnik',
    rock: ['#433446', '#2c2131', '#221a27'], spLight: 'rgba(120,90,130,0.5)', spDark: 'rgba(18,10,22,0.55)', rimL: 'rgba(200,150,230,0.16)',
    surface: 'gravel', extra: 'crystals',
    plank: ['#8a6440', '#4d3420', '#7f8a96'],
    glow: [0xc77dff, 0xff7ad9], dark: 'rgba(6,2,9,', darkA: 0.92, cam: '#0a060d',
    drone: { f: 49, f3: 73.4, lp: 340, wind: 900, windG: 0.012 }, drip: [4, 7],
  },
  dubine: {
    id: 'dubine', name: 'Potopljene dubine',
    rock: ['#2b4a5c', '#1a2d3b', '#142430'], spLight: 'rgba(90,150,170,0.45)', spDark: 'rgba(6,16,22,0.55)', rimL: 'rgba(160,230,255,0.2)',
    surface: 'algae', extra: 'wet',
    plank: ['#7d8a84', '#46524d', '#9aa6a0'],
    glow: [0x4ff0ff, 0x7dffb0], dark: 'rgba(1,4,8,', darkA: 0.94, cam: '#03080c',
    drone: { f: 38.9, f3: 58.3, lp: 220, wind: 650, windG: 0.032 }, drip: [0.8, 2.2],
  },
  kosturnica: {
    id: 'kosturnica', name: 'Kosturnica',
    rock: ['#564a40', '#3a3029', '#2c241e'], spLight: 'rgba(150,130,110,0.4)', spDark: 'rgba(20,12,8,0.55)', rimL: 'rgba(240,210,170,0.14)',
    surface: 'ash', extra: 'skulls',
    plank: ['#5e4430', '#2f2117', '#a8a090'],
    glow: [0xffb347, 0xff6a3a], dark: 'rgba(7,2,1,', darkA: 0.95, cam: '#0c0504',
    drone: { f: 36.7, f3: 55, lp: 300, wind: 300, windG: 0.014 }, drip: [6, 10],
  },
};

const Tiles = (() => {
  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const OUTL = '#150f19';

  // maska: 1 = zrak gore, 2 = desno, 4 = dolje, 8 = lijevo
  function rockTile(c, mask, v, T) {
    const R = rng(mask * 31 + v * 977 + 5 + T.id.length * 1000);
    const up = mask & 1, rt = mask & 2, dn = mask & 4, lf = mask & 8;
    c.save();
    c.beginPath();
    const r = 6;
    const tl = up && lf, tr = up && rt, br = dn && rt, bl = dn && lf;
    c.moveTo(tl ? r : 0, up ? 1.5 : 0);
    c.lineTo(tr ? 24 - r : 24, up ? 1.5 : 0);
    if (tr) c.quadraticCurveTo(24, 1.5, 24, r);
    c.lineTo(24, br ? 24 - r : 24);
    if (br) c.quadraticCurveTo(24, 24, 24 - r, 24);
    c.lineTo(bl ? r : 0, 24);
    if (bl) c.quadraticCurveTo(0, 24, 0, 24 - r);
    c.lineTo(0, tl ? r : 0);
    if (tl) c.quadraticCurveTo(0, 1.5, r, 1.5);
    c.closePath();
    const g = c.createLinearGradient(0, 0, 0, 24);
    g.addColorStop(0, T.rock[0]); g.addColorStop(1, T.rock[1]);
    c.fillStyle = mask ? g : T.rock[2];
    c.fill();
    c.clip();
    for (let i = 0; i < 9; i++) {
      const x = R() * 24, y = R() * 24, rr = 1 + R() * 3.2;
      c.fillStyle = R() < 0.5 ? T.spLight : T.spDark;
      c.beginPath(); c.ellipse(x, y, rr, rr * (0.6 + R() * 0.4), R() * 3, 0, Math.PI * 2); c.fill();
    }
    if (R() < 0.5) {
      c.strokeStyle = T.spDark; c.lineWidth = 0.6;
      c.beginPath(); let x = R() * 24, y = R() * 24; c.moveTo(x, y);
      for (let k = 0; k < 3; k++) { x += (R() - 0.5) * 9; y += R() * 6; c.lineTo(x, y); }
      c.stroke();
    }
    // posebnosti teme u kamenu
    if (T.extra === 'crystals' && R() < 0.55) {
      for (let k = 0; k < 2; k++) {
        const x = 3 + R() * 18, y = 6 + R() * 15, h = 2 + R() * 3;
        c.fillStyle = R() < 0.5 ? 'rgba(199,125,255,0.55)' : 'rgba(255,122,217,0.45)';
        c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + 1.3, y); c.lineTo(x - 1.3, y); c.closePath(); c.fill();
      }
    }
    if (T.extra === 'wet') {
      c.strokeStyle = 'rgba(159,243,255,0.14)'; c.lineWidth = 0.7;
      for (let k = 0; k < 3; k++) { const x = R() * 24; c.beginPath(); c.moveTo(x, R() * 8); c.lineTo(x + (R() - 0.5), 10 + R() * 14); c.stroke(); }
    }
    if (T.extra === 'skulls' && R() < 0.35) {
      const x = 5 + R() * 14, y = 7 + R() * 12;
      c.fillStyle = 'rgba(215,200,170,0.55)';
      c.beginPath(); c.ellipse(x, y, 2.6, 2.3, 0, 0, Math.PI * 2); c.fill();
      c.fillRect(x - 1.4, y + 1.5, 2.8, 1.6);
      c.fillStyle = 'rgba(30,20,15,0.8)';
      c.beginPath(); c.arc(x - 0.9, y - 0.2, 0.6, 0, Math.PI * 2); c.arc(x + 0.9, y - 0.2, 0.6, 0, Math.PI * 2); c.fill();
    }
    if (lf) { c.fillStyle = T.rimL; c.fillRect(0, 0, 2.2, 24); }
    if (rt) { c.fillStyle = 'rgba(8,6,10,0.45)'; c.fillRect(21.5, 0, 2.5, 24); }
    if (dn) { c.fillStyle = 'rgba(6,5,8,0.55)'; c.fillRect(0, 20.5, 24, 3.5); }
    if (up) surfaceTop(c, R, T);
    c.restore();
    c.lineJoin = 'round';
    if (up) surfaceOver(c, R, T);
    if (dn && R() < (T.surface === 'algae' ? 0.9 : 0.6)) {
      c.fillStyle = T.surface === 'ash' ? 'rgba(90,70,55,0.5)' : 'rgba(150,200,230,0.5)';
      c.beginPath(); c.ellipse(6 + R() * 12, 23.2, 0.8, 1.2, 0, 0, Math.PI * 2); c.fill();
    }
  }

  function surfaceTop(c, R, T) {
    if (T.surface === 'moss') {
      c.fillStyle = '#3e6b52'; c.fillRect(0, 0, 24, 4.2);
      c.fillStyle = '#5c9468';
      for (let x = 0; x < 24; x += 3) c.fillRect(x, 1.5, 2, 1.4 + R() * 1.6);
      c.fillStyle = 'rgba(20,40,30,0.6)'; c.fillRect(0, 4.2, 24, 1.2);
    } else if (T.surface === 'gravel') {
      c.fillStyle = '#5e4c5c'; c.fillRect(0, 0, 24, 4);
      for (let i = 0; i < 9; i++) { c.fillStyle = R() < 0.5 ? '#7d6878' : '#463844'; c.beginPath(); c.ellipse(R() * 24, 1.5 + R() * 2.5, 0.8 + R() * 1.2, 0.7, 0, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = 'rgba(20,10,25,0.6)'; c.fillRect(0, 4, 24, 1.2);
    } else if (T.surface === 'algae') {
      c.fillStyle = '#2b7a76'; c.fillRect(0, 0, 24, 4);
      c.fillStyle = 'rgba(159,243,255,0.55)'; c.fillRect(0, 1.4, 24, 0.7);
      for (let x = 0; x < 24; x += 4) { c.fillStyle = '#3fa79c'; c.fillRect(x + R() * 2, 3.6, 1.2, 1.5 + R() * 2.5); }
    } else if (T.surface === 'ash') {
      c.fillStyle = '#6e645a'; c.fillRect(0, 0, 24, 4);
      c.fillStyle = 'rgba(30,20,14,0.6)'; c.fillRect(0, 4, 24, 1.2);
      c.fillStyle = 'rgba(255,170,90,0.25)'; if (R() < 0.4) c.fillRect(R() * 20, 2.6, 3, 0.8);
    }
  }
  function surfaceOver(c, R, T) {
    if (T.surface === 'moss') {
      c.strokeStyle = '#6fae79'; c.lineWidth = 0.8;
      for (let i = 0; i < 5; i++) { const x = 1 + R() * 22, h = 1.5 + R() * 3; c.beginPath(); c.moveTo(x, 2); c.lineTo(x + (R() - 0.5) * 2.5, 2 - h); c.stroke(); }
    } else if (T.surface === 'gravel') {
      if (R() < 0.45) {
        const x = 3 + R() * 18, h = 2.5 + R() * 3.5;
        c.fillStyle = R() < 0.5 ? '#c77dff' : '#ff8fe0';
        c.beginPath(); c.moveTo(x - 1.4, 2); c.lineTo(x + 0.3, 2 - h); c.lineTo(x + 1.4, 2); c.closePath(); c.fill();
        c.strokeStyle = OUTL; c.lineWidth = 0.4; c.stroke();
      }
    } else if (T.surface === 'algae') {
      c.strokeStyle = '#47c2b3'; c.lineWidth = 0.7;
      for (let i = 0; i < 3; i++) { const x = 1 + R() * 22; c.beginPath(); c.moveTo(x, 2); c.quadraticCurveTo(x + 1.5, 0, x + 0.5, -1.5 - R() * 2); c.stroke(); }
    } else if (T.surface === 'ash') {
      c.strokeStyle = '#e6dcc4'; c.lineWidth = 0.8;
      for (let i = 0; i < 2; i++) { if (R() < 0.6) { const x = 2 + R() * 20; c.beginPath(); c.moveTo(x, 1.2); c.lineTo(x + 2.5, 0.4); c.stroke(); } }
    }
  }

  function plankTile(c, kind, T) { // 0 lijevi kraj, 1 sredina, 2 desni kraj
    const g = c.createLinearGradient(0, 0, 0, 7);
    g.addColorStop(0, T.plank[0]); g.addColorStop(1, T.plank[1]);
    c.fillStyle = g;
    c.fillRect(kind === 0 ? 1 : 0, 0, kind === 2 ? 23 : 24, 6.5);
    c.strokeStyle = OUTL; c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(kind === 0 ? 1 : 0, 0); c.lineTo(kind === 2 ? 23 : 24, 0);
    c.moveTo(kind === 0 ? 1 : 0, 6.5); c.lineTo(kind === 2 ? 23 : 24, 6.5);
    if (kind === 0) { c.moveTo(1, 0); c.lineTo(1, 6.5); }
    if (kind === 2) { c.moveTo(23, 0); c.lineTo(23, 6.5); }
    c.stroke();
    c.strokeStyle = 'rgba(30,20,12,0.6)'; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(2, 3); c.quadraticCurveTo(12, 2, 22, 3.6); c.stroke();
    c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 6.5); c.strokeStyle = OUTL; c.lineWidth = 0.7; c.stroke();
    c.fillStyle = T.plank[2];
    [4, 20].forEach(x => { c.beginPath(); c.arc(x, 3.2, 0.7, 0, Math.PI * 2); c.fill(); });
    if (T.id === 'rudnik') { c.fillStyle = T.plank[2]; c.fillRect(10.8, -0.5, 2.4, 7.5); c.strokeStyle = OUTL; c.lineWidth = 0.5; c.strokeRect(10.8, -0.5, 2.4, 7.5); }
    if (kind !== 1) {
      const x = kind === 0 ? 4 : 20;
      c.strokeStyle = OUTL; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 6.5); c.lineTo(x + (kind === 0 ? -3 : 3), 14); c.stroke();
      c.strokeStyle = T.plank[1]; c.lineWidth = 1.1; c.stroke();
    }
    if (T.id === 'dubine' && kind === 1) { c.fillStyle = 'rgba(80,200,170,0.6)'; c.fillRect(6, 6.5, 1, 3); c.fillRect(17, 6.5, 1, 4); }
  }

  // ---------------- ukrasi: 0-5 iznad poda (0,1 svijetle), 6-11 ispod stropa ----------------
  function decoTile(c, i, T) {
    const R = rng(i * 131 + 7 + T.id.length * 77);
    c.lineJoin = 'round'; c.lineCap = 'round';
    const ell = (x, y, rx, ry, f, lw = 0.7) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = f; c.fill(); c.strokeStyle = OUTL; c.lineWidth = lw; c.stroke(); };
    const tri = (pts, f) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => c.lineTo(p[0], p[1])); c.closePath(); c.fillStyle = f; c.fill(); c.strokeStyle = OUTL; c.lineWidth = 0.6; c.stroke(); };
    const stalactites = (n, col, hi) => {
      for (let k = 0; k < n; k++) {
        const x = 4 + k * (16 / n) + R() * 4, w = 2 + R() * 2.5, h = 6 + R() * 12;
        tri([[x - w, 0], [x + w, 0], [x + R() - 0.5, h]], col);
        c.fillStyle = hi; c.beginPath(); c.moveTo(x - w + 0.6, 0); c.lineTo(x - w + 1.4, 0); c.lineTo(x, h * 0.8); c.closePath(); c.fill();
      }
    };
    const cobweb = () => {
      c.strokeStyle = 'rgba(220,225,235,0.45)'; c.lineWidth = 0.4;
      for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(k * 0.35) * 18, Math.sin(k * 0.35) * 18); c.stroke(); }
      for (let r = 4; r < 18; r += 4) { c.beginPath(); c.arc(0, 0, r, 0, 1.45); c.stroke(); }
    };
    const chain = (col) => {
      for (let y = 0; y < 22; y += 3.2) { c.strokeStyle = OUTL; c.lineWidth = 1.5; c.beginPath(); c.ellipse(12, y + 1.6, 1, 1.7, 0, 0, Math.PI * 2); c.stroke(); c.strokeStyle = col; c.lineWidth = 0.7; c.stroke(); }
    };
    const crystal = (x, base, h, w, col, light) => {
      tri([[x - w, base], [x - w * 0.6, base - h * 0.8], [x, base - h], [x + w * 0.6, base - h * 0.75], [x + w, base]], col);
      c.fillStyle = light; c.beginPath(); c.moveTo(x - w * 0.3, base); c.lineTo(x - w * 0.2, base - h * 0.8); c.lineTo(x + w * 0.1, base - h * 0.9); c.lineTo(x + w * 0.1, base); c.closePath(); c.fill();
    };

    if (T.id === 'spilje') {
      switch (i) {
        case 0: case 1: {
          const cap = i === 0 ? '#63e6d6' : '#c08cff', capD = i === 0 ? '#2e9c95' : '#7a4dc4';
          [[7, 3.2], [12, 5], [16.5, 2.6]].forEach(([x, h], k) => {
            c.strokeStyle = OUTL; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 24); c.lineTo(x, 24 - h * 1.6); c.stroke();
            c.strokeStyle = '#e7e2d0'; c.lineWidth = 1; c.stroke();
            c.beginPath(); c.ellipse(x, 24 - h * 1.6, 2.6 + k * 0.4, 1.7, 0, Math.PI, 0); c.closePath();
            c.fillStyle = cap; c.fill(); c.strokeStyle = OUTL; c.lineWidth = 0.7; c.stroke();
            c.fillStyle = capD; c.fillRect(x - 1.5, 24 - h * 1.6 - 0.3, 3, 0.4);
          });
          break;
        }
        case 2: ell(6, 22.8, 2.8, 1.6, '#4a5468'); ell(11, 23.2, 1.6, 1, '#3c4557'); ell(17, 22.6, 2.4, 1.8, '#56607a'); break;
        case 3:
          c.strokeStyle = OUTL; c.lineWidth = 2.2; c.beginPath(); c.moveTo(4, 23); c.lineTo(11, 22); c.stroke();
          c.strokeStyle = '#ddd5c0'; c.lineWidth = 1.2; c.stroke();
          ell(17, 21.5, 3.4, 2.6, '#e4ddca');
          c.fillStyle = '#1b141e'; c.beginPath(); c.arc(16, 21.2, 0.8, 0, Math.PI * 2); c.arc(18.4, 21.2, 0.8, 0, Math.PI * 2); c.fill();
          break;
        case 4:
          for (let k = 0; k < 4; k++) { c.strokeStyle = k % 2 ? '#4f8a5e' : '#3b6d4a'; c.lineWidth = 1; c.beginPath(); c.moveTo(12, 24); c.quadraticCurveTo(12 + (k - 1.5) * 4, 16, 12 + (k - 1.5) * 7, 13 + R() * 3); c.stroke(); }
          break;
        case 5:
          c.fillStyle = '#d8ceb4'; c.fillRect(10, 18, 3.2, 6); c.strokeStyle = OUTL; c.lineWidth = 0.7; c.strokeRect(10, 18, 3.2, 6);
          break;
        case 6: stalactites(2, '#2b3242', 'rgba(120,140,170,0.25)'); break;
        case 7: stalactites(3, '#2b3242', 'rgba(120,140,170,0.25)'); break;
        case 8: case 9:
          for (let k = 0; k < 3; k++) { c.strokeStyle = k === 1 ? '#5a4330' : '#46331f'; c.lineWidth = 1.1; const x = 5 + k * 6 + R() * 3; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 3, 6, x - 3, 10, x + (R() - 0.5) * 4, 12 + R() * 9); c.stroke(); }
          if (i === 9) { c.fillStyle = '#7fd06c'; c.beginPath(); c.arc(12, 9, 1.2, 0, Math.PI * 2); c.fill(); }
          break;
        case 10: cobweb(); break;
        case 11: chain('#7d8592'); break;
      }
    } else if (T.id === 'rudnik') {
      switch (i) {
        case 0: crystal(9, 24, 12, 3, '#b56ef0', 'rgba(255,255,255,0.45)'); crystal(15, 24, 8, 2.4, '#8f4fd0', 'rgba(255,255,255,0.35)'); crystal(5, 24, 5, 1.8, '#d39bff', 'rgba(255,255,255,0.4)'); break;
        case 1: crystal(12, 24, 14, 3.4, '#ff7ad9', 'rgba(255,255,255,0.45)'); crystal(17.5, 24, 7, 2, '#e05bbd', 'rgba(255,255,255,0.35)'); break;
        case 2: // tračnice
          c.fillStyle = '#4a3324'; [3, 10, 17].forEach(x => { c.fillRect(x, 21.5, 4, 2.5); c.strokeStyle = OUTL; c.lineWidth = 0.5; c.strokeRect(x, 21.5, 4, 2.5); });
          c.strokeStyle = '#8b95a3'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(0, 21.3); c.lineTo(24, 21.3); c.stroke();
          break;
        case 3: // krampa zabijena u tlo
          c.strokeStyle = OUTL; c.lineWidth = 2.4; c.beginPath(); c.moveTo(9, 24); c.lineTo(15, 12); c.stroke();
          c.strokeStyle = '#8a6440'; c.lineWidth = 1.3; c.stroke();
          c.strokeStyle = OUTL; c.lineWidth = 2.6; c.beginPath(); c.moveTo(10, 12); c.quadraticCurveTo(15, 9.5, 21, 13); c.stroke();
          c.strokeStyle = '#9aa3ae'; c.lineWidth = 1.4; c.stroke();
          break;
        case 4: // sanduk
          c.fillStyle = '#6b4a2e'; c.fillRect(5, 13, 14, 11); c.strokeStyle = OUTL; c.lineWidth = 0.9; c.strokeRect(5, 13, 14, 11);
          c.strokeStyle = '#3d2817'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(5, 13); c.lineTo(19, 24); c.moveTo(19, 13); c.lineTo(5, 24); c.stroke();
          break;
        case 5: // razbijena lampa
          c.fillStyle = '#3e4652'; c.fillRect(9, 18, 6, 6); c.strokeStyle = OUTL; c.lineWidth = 0.7; c.strokeRect(9, 18, 6, 6);
          c.fillStyle = 'rgba(255,220,140,0.25)'; c.fillRect(10, 19, 4, 4);
          c.strokeStyle = 'rgba(230,230,240,0.6)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(14, 22); c.lineTo(17, 23.5); c.lineTo(15.5, 24); c.stroke();
          break;
        case 6: case 7: // kristalni stalaktiti
          for (let k = 0; k < (i === 6 ? 2 : 3); k++) { const x = 5 + k * 7 + R() * 3, h = 6 + R() * 10; tri([[x - 2.2, 0], [x + 2.2, 0], [x, h]], k % 2 ? '#9b5fd6' : '#6e3fa3'); }
          break;
        case 8: // potporna greda
          c.fillStyle = '#6b4a2e'; c.fillRect(0, 0, 24, 5); c.strokeStyle = OUTL; c.lineWidth = 0.8; c.strokeRect(-1, 0, 26, 5);
          c.strokeStyle = 'rgba(30,18,10,0.6)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(0, 2.5); c.lineTo(24, 2.3); c.stroke();
          c.fillStyle = '#8b95a3'; c.fillRect(3, 1, 1.6, 3); c.fillRect(19, 1, 1.6, 3);
          break;
        case 9: // viseća ugašena svjetiljka
          c.strokeStyle = '#2a2a30'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 10); c.stroke();
          c.fillStyle = '#3e4652'; c.fillRect(9.5, 10, 5, 6); c.strokeStyle = OUTL; c.strokeRect(9.5, 10, 5, 6);
          c.fillStyle = 'rgba(255,200,120,0.18)'; c.fillRect(10.3, 11, 3.4, 4);
          break;
        case 10: cobweb(); break;
        case 11: c.strokeStyle = '#a07c52'; c.lineWidth = 1; c.beginPath(); c.moveTo(8, 0); c.bezierCurveTo(10, 8, 6, 12, 9, 18); c.stroke(); ell(9, 18.5, 1.3, 1.3, '#a07c52', 0.5); break;
      }
    } else if (T.id === 'dubine') {
      switch (i) {
        case 0: // svjetleće alge
          for (let k = 0; k < 4; k++) { const x = 5 + k * 4.5; c.strokeStyle = OUTL; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 24); c.quadraticCurveTo(x + 2, 18, x - 1, 13 + R() * 5); c.stroke(); c.strokeStyle = '#4ff0ff'; c.lineWidth = 1.1; c.stroke(); }
          break;
        case 1: // anemone
          ell(12, 22, 4.5, 2.4, '#2a6f68');
          for (let k = 0; k < 7; k++) { const a = Math.PI + (k / 6) * Math.PI; c.strokeStyle = '#7dffb0'; c.lineWidth = 1; c.beginPath(); c.moveTo(12, 21); c.lineTo(12 + Math.cos(a) * 6, 21 + Math.sin(a) * 6); c.stroke(); ell(12 + Math.cos(a) * 6, 21 + Math.sin(a) * 6, 0.7, 0.7, '#d4ffe6', 0); }
          break;
        case 2: // školjke
          ell(7, 22.8, 2.6, 1.6, '#c9b8a0'); ell(15, 23, 2, 1.2, '#a6c4c8');
          c.strokeStyle = 'rgba(60,40,30,0.6)'; c.lineWidth = 0.4; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(7, 24); c.lineTo(7 + k, 21.5); c.stroke(); }
          break;
        case 3: // kostur ribe
          c.strokeStyle = '#ddd5c0'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(4, 22); c.lineTo(17, 22); c.stroke();
          for (let x = 6; x < 16; x += 2) { c.beginPath(); c.moveTo(x, 20); c.lineTo(x + 0.6, 24); c.stroke(); }
          ell(18.5, 22, 2.4, 1.8, '#e4ddca'); c.fillStyle = '#111'; c.beginPath(); c.arc(19.2, 21.6, 0.5, 0, Math.PI * 2); c.fill();
          break;
        case 4: // morska trava
          for (let k = 0; k < 3; k++) { c.strokeStyle = k % 2 ? '#2f8a6e' : '#246b58'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(8 + k * 4, 24); c.bezierCurveTo(5 + k * 4, 18, 12 + k * 4, 12, 7 + k * 4, 4 + R() * 4); c.stroke(); }
          break;
        case 5: // lokvica
          c.fillStyle = 'rgba(120,220,240,0.3)'; c.beginPath(); c.ellipse(12, 23.5, 8, 1.1, 0, 0, Math.PI * 2); c.fill();
          c.strokeStyle = 'rgba(200,250,255,0.5)'; c.lineWidth = 0.4; c.beginPath(); c.ellipse(12, 23.5, 5, 0.6, 0, 0, Math.PI * 2); c.stroke();
          break;
        case 6: case 7: stalactites(i === 6 ? 2 : 3, '#244150', 'rgba(160,230,255,0.3)'); c.fillStyle = 'rgba(160,230,255,0.75)'; c.beginPath(); c.ellipse(9 + R() * 6, 19, 0.8, 1.3, 0, 0, Math.PI * 2); c.fill(); break;
        case 8: // viseće svjetleće niti
          for (let k = 0; k < 4; k++) { const x = 4 + k * 5 + R() * 2, h = 8 + R() * 12; c.strokeStyle = 'rgba(79,240,255,0.8)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (R() - 0.5) * 2, h); c.stroke(); c.fillStyle = '#c8fbff'; c.beginPath(); c.arc(x, h, 0.8, 0, Math.PI * 2); c.fill(); }
          break;
        case 9:
          for (let k = 0; k < 3; k++) { c.strokeStyle = '#2d4a44'; c.lineWidth = 1.2; const x = 6 + k * 6; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 3, 6, x - 3, 10, x, 14 + R() * 6); c.stroke(); }
          break;
        case 10: cobweb(); c.fillStyle = 'rgba(200,250,255,0.7)'; [[6, 4], [10, 9], [4, 12]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 0.6, 0, Math.PI * 2); c.fill(); }); break;
        case 11: chain('#8a6a4a'); break;
      }
    } else if (T.id === 'kosturnica') {
      switch (i) {
        case 0: case 1: { // svijeće
          const cs = i === 0 ? [[12, 7]] : [[7, 5], [12, 8], [17, 4]];
          cs.forEach(([x, h]) => {
            c.fillStyle = '#ece2c6'; c.fillRect(x - 1.5, 24 - h, 3, h); c.strokeStyle = OUTL; c.lineWidth = 0.6; c.strokeRect(x - 1.5, 24 - h, 3, h);
            c.fillStyle = 'rgba(236,226,198,0.9)'; c.beginPath(); c.ellipse(x + 1, 24 - h + 1.2, 0.8, 1.6, 0, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#222'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x, 24 - h); c.lineTo(x, 23 - h); c.stroke();
            c.fillStyle = '#ffb347'; c.beginPath(); c.ellipse(x, 21.6 - h, 1, 1.8, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#fff2c0'; c.beginPath(); c.ellipse(x, 22 - h, 0.45, 0.9, 0, 0, Math.PI * 2); c.fill();
          });
          break;
        }
        case 2: // hrpa lubanja
          [[8, 21.5], [15, 21.8], [11.5, 18.5]].forEach(([x, y]) => {
            ell(x, y, 3, 2.7, '#e2d7bd');
            c.fillStyle = '#1b130e'; c.beginPath(); c.arc(x - 1.1, y - 0.2, 0.75, 0, Math.PI * 2); c.arc(x + 1.1, y - 0.2, 0.75, 0, Math.PI * 2); c.fill();
            c.fillRect(x - 0.3, y + 1, 0.6, 0.8);
          });
          break;
        case 3:
          c.strokeStyle = OUTL; c.lineWidth = 2.2; c.beginPath(); c.moveTo(3, 23); c.lineTo(12, 22); c.moveTo(9, 23.5); c.lineTo(20, 21); c.stroke();
          c.strokeStyle = '#ddd5c0'; c.lineWidth = 1.2; c.stroke();
          break;
        case 4: // urna
          c.beginPath(); c.moveTo(8, 24); c.quadraticCurveTo(5, 18, 9, 14); c.lineTo(15, 14); c.quadraticCurveTo(19, 18, 16, 24); c.closePath();
          c.fillStyle = '#7a4a30'; c.fill(); c.strokeStyle = OUTL; c.lineWidth = 0.8; c.stroke();
          c.fillStyle = '#c99a4a'; c.fillRect(7, 17, 10, 1);
          break;
        case 5: // suhe ruže
          for (let k = 0; k < 2; k++) { c.strokeStyle = '#3d4a2a'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(10 + k * 5, 24); c.lineTo(11 + k * 4, 17); c.stroke(); ell(11 + k * 4, 16.5, 1.6, 1.3, '#6b1f24'); }
          break;
        case 6: case 7: stalactites(i === 6 ? 2 : 3, '#4a3f36', 'rgba(240,220,190,0.2)'); break;
        case 8: chain('#6e6a66'); break;
        case 9: // kavez
          c.strokeStyle = '#2a2826'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 5); c.stroke();
          c.strokeStyle = OUTL; c.lineWidth = 1.4; c.beginPath(); c.ellipse(12, 12, 5, 7, 0, 0, Math.PI * 2); c.stroke();
          c.strokeStyle = '#6e6a66'; c.lineWidth = 0.7; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(12 + k * 2, 5.5); c.lineTo(12 + k * 2.2, 18.5); c.stroke(); }
          ell(12, 15, 2, 1.8, '#d8cdb3', 0.4);
          break;
        case 10: cobweb(); break;
        case 11: // poderana tkanina
          c.fillStyle = '#5a1a1e'; c.beginPath(); c.moveTo(4, 0); c.lineTo(20, 0); c.lineTo(18, 9); c.lineTo(15, 6); c.lineTo(12, 12); c.lineTo(9, 7); c.lineTo(6, 10); c.closePath(); c.fill();
          c.strokeStyle = OUTL; c.lineWidth = 0.6; c.stroke();
          break;
      }
    }
  }

  function canvasSheet(scene, key, cols, rows, draw) {
    const t = scene.textures.createCanvas(key, cols * TPX, rows * TPX);
    const c = t.getContext();
    for (let i = 0; i < cols * rows; i++) {
      c.save();
      c.translate((i % cols) * TPX, Math.floor(i / cols) * TPX);
      c.scale(RES, RES);
      draw(c, i);
      c.restore();
    }
    t.refresh();
  }

  function backgrounds(scene, T) {
    const BR = 2;
    const mk = (key, w, h) => { const t = scene.textures.createCanvas(key, w * BR, h * BR); const c = t.getContext(); c.scale(BR, BR); return [t, c]; };
    const wrap = (c, w, fn) => { [-w, 0, w].forEach(o => { c.save(); c.translate(o, 0); fn(); c.restore(); }); };
    const glowDot = (c, x, y, r, col, a = 0.9) => {
      const gg = c.createRadialGradient(x, y, 0, x, y, r * 8);
      gg.addColorStop(0, `rgba(${col},${a})`); gg.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = gg; c.fillRect(x - r * 8, y - r * 8, r * 16, r * 16);
    };
    // ---- daleki sloj ----
    let [t, c] = mk('bgFar_' + T.id, 600, 280);
    let R = rng(42 + T.id.length);
    const grads = { spilje: ['#0d1424', '#13283a', '#0f1d26'], rudnik: ['#140c1c', '#251632', '#170e1f'], dubine: ['#05121a', '#0a2a38', '#06161f'], kosturnica: ['#170a08', '#2a1410', '#1a0c09'] }[T.id];
    let g = c.createLinearGradient(0, 0, 0, 280);
    g.addColorStop(0, grads[0]); g.addColorStop(0.55, grads[1]); g.addColorStop(1, grads[2]);
    c.fillStyle = g; c.fillRect(0, 0, 600, 280);
    if (T.id === 'spilje') {
      const spikes = []; for (let i = 0; i < 26; i++) spikes.push({ x: R() * 600, w: 8 + R() * 22, h: 30 + R() * 90, top: R() < 0.55 });
      const glows = []; for (let i = 0; i < 18; i++) glows.push({ x: R() * 600, y: 200 + R() * 70, r: 1 + R() * 2, col: R() < 0.5 ? '99,230,214' : '192,140,255' });
      wrap(c, 600, () => {
        spikes.forEach(s => { c.beginPath(); if (s.top) { c.moveTo(s.x - s.w, 0); c.lineTo(s.x + s.w, 0); c.lineTo(s.x, s.h); } else { c.moveTo(s.x - s.w, 280); c.lineTo(s.x + s.w, 280); c.lineTo(s.x, 280 - s.h * 0.8); } c.closePath(); c.fillStyle = '#18263a'; c.fill(); c.strokeStyle = 'rgba(80,120,160,0.25)'; c.lineWidth = 1; c.stroke(); });
        glows.forEach(o => glowDot(c, o.x, o.y, o.r, o.col));
      });
    } else if (T.id === 'rudnik') {
      const cr = []; for (let i = 0; i < 14; i++) cr.push({ x: R() * 600, w: 10 + R() * 18, h: 40 + R() * 110, top: R() < 0.35, tilt: (R() - 0.5) * 0.5 });
      const glows = []; for (let i = 0; i < 16; i++) glows.push({ x: R() * 600, y: 40 + R() * 220, r: 1 + R() * 2.5, col: R() < 0.6 ? '199,125,255' : '255,122,217' });
      wrap(c, 600, () => {
        cr.forEach(s => {
          c.save(); c.translate(s.x, s.top ? 0 : 280); c.rotate(s.tilt); c.scale(1, s.top ? 1 : -1);
          c.beginPath(); c.moveTo(-s.w, 0); c.lineTo(-s.w * 0.5, s.h * 0.85); c.lineTo(0, s.h); c.lineTo(s.w * 0.5, s.h * 0.8); c.lineTo(s.w, 0); c.closePath();
          c.fillStyle = '#2a1840'; c.fill(); c.strokeStyle = 'rgba(199,125,255,0.35)'; c.lineWidth = 1.2; c.stroke();
          c.restore();
        });
        glows.forEach(o => glowDot(c, o.x, o.y, o.r, o.col, 0.8));
      });
    } else if (T.id === 'dubine') {
      const falls = []; for (let i = 0; i < 8; i++) falls.push({ x: R() * 600, w: 2 + R() * 6 });
      const bub = []; for (let i = 0; i < 26; i++) bub.push({ x: R() * 600, y: R() * 280, r: 0.6 + R() * 1.6 });
      wrap(c, 600, () => {
        falls.forEach(f => { const fg = c.createLinearGradient(0, 0, 0, 280); fg.addColorStop(0, 'rgba(120,220,240,0.25)'); fg.addColorStop(1, 'rgba(120,220,240,0.02)'); c.fillStyle = fg; c.fillRect(f.x, 0, f.w, 280); });
        bub.forEach(b => { c.strokeStyle = 'rgba(160,240,255,0.4)'; c.lineWidth = 0.6; c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.stroke(); });
        for (let i = 0; i < 10; i++) glowDot(c, (i * 61 + 17) % 600, 230 + (i * 37) % 45, 1.4, i % 2 ? '79,240,255' : '125,255,176', 0.7);
      });
    } else {
      wrap(c, 600, () => {
        for (let i = 0; i < 6; i++) {
          const x = i * 100 + 50;
          c.fillStyle = '#201010'; c.beginPath(); c.moveTo(x - 34, 280); c.lineTo(x - 34, 120); c.arc(x, 120, 34, Math.PI, 0); c.lineTo(x + 34, 280); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(230,180,130,0.18)'; c.lineWidth = 2; c.stroke();
          for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
            const nx = x - 18 + k * 18, ny = 140 + r * 34;
            c.fillStyle = '#0d0605'; c.fillRect(nx - 6, ny - 6, 12, 14);
            c.fillStyle = 'rgba(220,200,170,0.35)'; c.beginPath(); c.arc(nx, ny + 2, 3.2, 0, Math.PI * 2); c.fill();
          }
          glowDot(c, x, 108, 1.6, '255,179,71', 0.8);
        }
      });
    }
    t.refresh();

    // ---- bliži sloj ----
    [t, c] = mk('bgMid_' + T.id, 800, 280);
    R = rng(7 + T.id.length);
    if (T.id === 'rudnik') {
      wrap(c, 800, () => {
        for (let i = 0; i < 5; i++) {
          const x = i * 160 + 40;
          c.fillStyle = '#2b1d14'; c.fillRect(x - 6, 0, 12, 280); c.fillRect(x + 154 - 6, 0, 12, 280);
          c.fillRect(x - 6, 60, 172, 10);
          c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.strokeRect(x - 6, 60, 172, 10);
          c.strokeStyle = '#2b1d14'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, 70); c.lineTo(x + 40, 110); c.moveTo(x + 154, 70); c.lineTo(x + 114, 110); c.stroke();
        }
      });
    } else if (T.id === 'dubine') {
      const pillars = []; for (let i = 0; i < 6; i++) pillars.push({ x: R() * 800, w: 16 + R() * 24 });
      wrap(c, 800, () => {
        pillars.forEach(p => {
          const pg = c.createLinearGradient(p.x - p.w, 0, p.x + p.w, 0);
          pg.addColorStop(0, '#0c2230'); pg.addColorStop(0.4, '#143547'); pg.addColorStop(1, '#0a1c27');
          c.fillStyle = pg; c.beginPath(); c.moveTo(p.x - p.w * 1.4, 0); c.quadraticCurveTo(p.x - p.w * 0.5, 140, p.x - p.w * 1.3, 280); c.lineTo(p.x + p.w * 1.2, 280); c.quadraticCurveTo(p.x + p.w * 0.4, 140, p.x + p.w * 1.4, 0); c.closePath(); c.fill();
          for (let k = 0; k < 3; k++) { c.strokeStyle = 'rgba(47,138,110,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x - 10 + k * 10, 280); c.bezierCurveTo(p.x - 20 + k * 10, 230, p.x + k * 10, 200, p.x - 12 + k * 10, 160 + R() * 30); c.stroke(); }
        });
      });
    } else if (T.id === 'kosturnica') {
      wrap(c, 800, () => {
        for (let i = 0; i < 4; i++) {
          const x = i * 200 + 60;
          for (let y = 0; y < 280; y += 11) for (let k = -2; k <= 2; k++) {
            c.fillStyle = (y / 11 + k) % 2 ? '#2a1c16' : '#33231b';
            c.beginPath(); c.arc(x + k * 9 + ((y / 11) % 2) * 4, y, 5, 0, Math.PI * 2); c.fill();
            c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(x + k * 9 + ((y / 11) % 2) * 4 - 1.6, y - 0.5, 1, 0, Math.PI * 2); c.arc(x + k * 9 + ((y / 11) % 2) * 4 + 1.6, y - 0.5, 1, 0, Math.PI * 2); c.fill();
          }
        }
      });
    } else {
      const pillars = []; for (let i = 0; i < 6; i++) pillars.push({ x: R() * 800, w: 18 + R() * 26 });
      const roots = []; for (let i = 0; i < 14; i++) roots.push({ x: R() * 800, h: 40 + R() * 90 });
      wrap(c, 800, () => {
        pillars.forEach(p => {
          const pg = c.createLinearGradient(p.x - p.w, 0, p.x + p.w, 0);
          pg.addColorStop(0, '#1a2534'); pg.addColorStop(0.4, '#243246'); pg.addColorStop(1, '#141c28');
          c.fillStyle = pg; c.beginPath(); c.moveTo(p.x - p.w * 1.6, 0); c.quadraticCurveTo(p.x - p.w * 0.6, 140, p.x - p.w * 1.4, 280); c.lineTo(p.x + p.w * 1.3, 280); c.quadraticCurveTo(p.x + p.w * 0.5, 140, p.x + p.w * 1.5, 0); c.closePath(); c.fill();
          c.fillStyle = 'rgba(70,120,90,0.35)'; c.fillRect(p.x - p.w, 120, p.w * 1.6, 3);
        });
        roots.forEach(r => { c.strokeStyle = '#2a2219'; c.lineWidth = 2; c.beginPath(); c.moveTo(r.x, 0); c.bezierCurveTo(r.x + 10, r.h * 0.3, r.x - 10, r.h * 0.6, r.x + 4, r.h); c.stroke(); });
      });
    }
    t.refresh();
  }

  return {
    rng,
    // zajedničko
    generate(scene) {
      const t = scene.textures.createCanvas('coltiles', TILE * 3, TILE); t.refresh();
    },
    // po temi, samo kad zatreba
    ensureTheme(scene, T) {
      if (scene.textures.exists('rocktiles_' + T.id)) return;
      canvasSheet(scene, 'rocktiles_' + T.id, 8, 6, (c, i) => { if (i < 48) rockTile(c, Math.floor(i / 3), i % 3, T); });
      canvasSheet(scene, 'planktiles_' + T.id, 3, 1, (c, i) => plankTile(c, i, T));
      canvasSheet(scene, 'decotiles_' + T.id, 12, 1, (c, i) => decoTile(c, i, T));
      backgrounds(scene, T);
    },
  };
})();