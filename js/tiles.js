// Podzemlje — pločice stijena, daske, ukrasi i pozadine
const TILE = 24;          // logička veličina pločice (svijet)
const TPX = TILE * RES;   // piksela u teksturi

const Tiles = (() => {
  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  // maska: 1 = zrak gore, 2 = desno, 4 = dolje, 8 = lijevo
  function rockTile(c, mask, v) {
    const R = rng(mask * 31 + v * 977 + 5);
    const up = mask & 1, rt = mask & 2, dn = mask & 4, lf = mask & 8;
    c.save();
    // oblik s blago zaobljenim izloženim kutovima
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
    g.addColorStop(0, '#2f3747'); g.addColorStop(1, '#232a37');
    c.fillStyle = mask ? g : '#1d232e';
    c.fill();
    c.clip();
    // kamenčići i mrlje
    for (let i = 0; i < 9; i++) {
      const x = R() * 24, y = R() * 24, rr = 1 + R() * 3.2;
      c.fillStyle = R() < 0.5 ? 'rgba(70,82,104,0.55)' : 'rgba(14,17,24,0.5)';
      c.beginPath(); c.ellipse(x, y, rr, rr * (0.6 + R() * 0.4), R() * 3, 0, Math.PI * 2); c.fill();
    }
    if (R() < 0.5) {
      c.strokeStyle = 'rgba(12,14,20,0.7)'; c.lineWidth = 0.6;
      c.beginPath(); let x = R() * 24, y = R() * 24; c.moveTo(x, y);
      for (let k = 0; k < 3; k++) { x += (R() - 0.5) * 9; y += R() * 6; c.lineTo(x, y); }
      c.stroke();
    }
    // rubovi
    if (lf) { c.fillStyle = 'rgba(120,135,160,0.18)'; c.fillRect(0, 0, 2.2, 24); }
    if (rt) { c.fillStyle = 'rgba(10,12,18,0.45)'; c.fillRect(21.5, 0, 2.5, 24); }
    if (dn) {
      c.fillStyle = 'rgba(8,10,15,0.55)'; c.fillRect(0, 20.5, 24, 3.5);
    }
    if (up) {
      // mahovina i trava
      c.fillStyle = '#3e6b52'; c.fillRect(0, 0, 24, 4.2);
      c.fillStyle = '#5c9468';
      for (let x = 0; x < 24; x += 3) c.fillRect(x, 1.5, 2, 1.4 + R() * 1.6);
      c.fillStyle = 'rgba(20,40,30,0.6)'; c.fillRect(0, 4.2, 24, 1.2);
    }
    c.restore();
    c.lineJoin = 'round';
    if (up) {
      // vlati trave preko ruba
      c.strokeStyle = '#6fae79'; c.lineWidth = 0.8;
      for (let i = 0; i < 5; i++) {
        const x = 1 + R() * 22; const h = 1.5 + R() * 3;
        c.beginPath(); c.moveTo(x, 2); c.lineTo(x + (R() - 0.5) * 2.5, 2 - h); c.stroke();
      }
    }
    if (dn && R() < 0.6) {
      // kapljica
      c.fillStyle = 'rgba(150,200,230,0.5)';
      c.beginPath(); c.ellipse(6 + R() * 12, 23.2, 0.8, 1.2, 0, 0, Math.PI * 2); c.fill();
    }
  }

  function plankTile(c, kind) { // 0 lijevi kraj, 1 sredina, 2 desni kraj
    const g = c.createLinearGradient(0, 0, 0, 7);
    g.addColorStop(0, '#9a7149'); g.addColorStop(1, '#5b3f27');
    c.fillStyle = g;
    c.fillRect(kind === 0 ? 1 : 0, 0, kind === 2 ? 23 : 24, 6.5);
    c.strokeStyle = OUT; c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(kind === 0 ? 1 : 0, 0); c.lineTo(kind === 2 ? 23 : 24, 0);
    c.moveTo(kind === 0 ? 1 : 0, 6.5); c.lineTo(kind === 2 ? 23 : 24, 6.5);
    if (kind === 0) { c.moveTo(1, 0); c.lineTo(1, 6.5); }
    if (kind === 2) { c.moveTo(23, 0); c.lineTo(23, 6.5); }
    c.stroke();
    c.strokeStyle = 'rgba(40,25,12,0.6)'; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(2, 3); c.quadraticCurveTo(12, 2, 22, 3.6); c.stroke();
    c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 6.5); c.strokeStyle = OUT; c.lineWidth = 0.7; c.stroke();
    c.fillStyle = '#b8bfc9';
    [4, 20].forEach(x => { c.beginPath(); c.arc(x, 3.2, 0.7, 0, Math.PI * 2); c.fill(); });
    if (kind !== 1) {
      // nosač
      const x = kind === 0 ? 4 : 20;
      c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 6.5); c.lineTo(x + (kind === 0 ? -3 : 3), 14); c.stroke();
      c.strokeStyle = '#6b4a2e'; c.lineWidth = 1.1; c.stroke();
    }
  }

  // ukrasi u zraku: 0-5 iznad poda, 6-11 ispod stropa
  function decoTile(c, i) {
    const R = rng(i * 131 + 7);
    c.lineJoin = 'round'; c.lineCap = 'round';
    const ell = (x, y, rx, ry, f) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = f; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.7; c.stroke(); };
    switch (i) {
      case 0: // svjetleće gljive (tirkiz)
      case 1: { // svjetleće gljive (ljubičaste)
        const cap = i === 0 ? '#63e6d6' : '#c08cff', capD = i === 0 ? '#2e9c95' : '#7a4dc4';
        [[7, 3.2], [12, 5], [16.5, 2.6]].forEach(([x, h], k) => {
          c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 24); c.lineTo(x, 24 - h * 1.6); c.stroke();
          c.strokeStyle = '#e7e2d0'; c.lineWidth = 1; c.stroke();
          c.beginPath(); c.ellipse(x, 24 - h * 1.6, 2.6 + k * 0.4, 1.7, 0, Math.PI, 0); c.closePath();
          c.fillStyle = cap; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.7; c.stroke();
          c.fillStyle = capD; c.fillRect(x - 1.5, 24 - h * 1.6 - 0.3, 3, 0.4);
          c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(x - 0.8, 24 - h * 1.6 - 1, 0.4, 0, Math.PI * 2); c.fill();
        });
        break;
      }
      case 2: // kamenčići
        ell(6, 22.8, 2.8, 1.6, '#4a5468'); ell(11, 23.2, 1.6, 1, '#3c4557'); ell(17, 22.6, 2.4, 1.8, '#56607a');
        break;
      case 3: // kosti i lubanjica bube
        c.strokeStyle = OUT; c.lineWidth = 2.2; c.beginPath(); c.moveTo(4, 23); c.lineTo(11, 22); c.stroke();
        c.strokeStyle = '#ddd5c0'; c.lineWidth = 1.2; c.stroke();
        ell(4, 23, 1.1, 1.1, '#ddd5c0'); ell(11, 22, 1.1, 1.1, '#ddd5c0');
        ell(17, 21.5, 3.4, 2.6, '#e4ddca');
        c.fillStyle = '#1b141e'; c.beginPath(); c.arc(16, 21.2, 0.8, 0, Math.PI * 2); c.arc(18.4, 21.2, 0.8, 0, Math.PI * 2); c.fill();
        break;
      case 4: // paprat
        for (let k = 0; k < 4; k++) {
          c.strokeStyle = k % 2 ? '#4f8a5e' : '#3b6d4a'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(12, 24); c.quadraticCurveTo(12 + (k - 1.5) * 4, 16, 12 + (k - 1.5) * 7, 13 + R() * 3); c.stroke();
        }
        break;
      case 5: // svijeća koja je odavno izgorjela
        c.fillStyle = '#d8ceb4'; c.fillRect(10, 18, 3.2, 6); c.strokeStyle = OUT; c.lineWidth = 0.7; c.strokeRect(10, 18, 3.2, 6);
        c.fillStyle = '#e8e0c8'; c.beginPath(); c.ellipse(13, 23.5, 2.6, 0.9, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#222'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(11.6, 18); c.lineTo(11.6, 16.6); c.stroke();
        break;
      case 6: case 7: { // stalaktiti
        const n = i === 6 ? 2 : 3;
        for (let k = 0; k < n; k++) {
          const x = 4 + k * (16 / n) + R() * 4, w = 2 + R() * 2.5, h = 6 + R() * 12;
          c.beginPath(); c.moveTo(x - w, 0); c.lineTo(x + w, 0); c.lineTo(x + R() - 0.5, h); c.closePath();
          c.fillStyle = '#2b3242'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.7; c.stroke();
          c.fillStyle = 'rgba(120,140,170,0.25)'; c.beginPath(); c.moveTo(x - w + 0.6, 0); c.lineTo(x - w + 1.4, 0); c.lineTo(x, h * 0.8); c.closePath(); c.fill();
        }
        break;
      }
      case 8: case 9: // korijenje
        for (let k = 0; k < 3; k++) {
          c.strokeStyle = k === 1 ? '#5a4330' : '#46331f'; c.lineWidth = 1.1;
          const x = 5 + k * 6 + R() * 3;
          c.beginPath(); c.moveTo(x, 0);
          c.bezierCurveTo(x + 3, 6, x - 3, 10, x + (R() - 0.5) * 4, 12 + R() * 9); c.stroke();
        }
        if (i === 9) { c.fillStyle = '#7fd06c'; c.beginPath(); c.arc(12, 9, 1.2, 0, Math.PI * 2); c.fill(); }
        break;
      case 10: // paučina
        c.strokeStyle = 'rgba(220,225,235,0.45)'; c.lineWidth = 0.4;
        for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(k * 0.35) * 18, Math.sin(k * 0.35) * 18); c.stroke(); }
        for (let r = 4; r < 18; r += 4) { c.beginPath(); c.arc(0, 0, r, 0, 1.45); c.stroke(); }
        break;
      case 11: // lanac
        for (let y = 0; y < 22; y += 3.2) {
          c.strokeStyle = OUT; c.lineWidth = 1.5; c.beginPath(); c.ellipse(12, y + 1.6, 1, 1.7, 0, 0, Math.PI * 2); c.stroke();
          c.strokeStyle = '#7d8592'; c.lineWidth = 0.7; c.stroke();
        }
        break;
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

  function backgrounds(scene) {
    const BR = 2;
    // daleki sloj
    let t = scene.textures.createCanvas('bgFar', 600 * BR, 280 * BR);
    let c = t.getContext(); c.scale(BR, BR);
    let R = rng(42);
    let g = c.createLinearGradient(0, 0, 0, 280);
    g.addColorStop(0, '#0d1424'); g.addColorStop(0.55, '#13283a'); g.addColorStop(1, '#0f1d26');
    c.fillStyle = g; c.fillRect(0, 0, 600, 280);
    const wrap = (fn) => { [-600, 0, 600].forEach(o => { c.save(); c.translate(o, 0); fn(); c.restore(); }); };
    const spikes = [];
    for (let i = 0; i < 26; i++) spikes.push({ x: R() * 600, w: 8 + R() * 22, h: 30 + R() * 90, top: R() < 0.55 });
    const glows = [];
    for (let i = 0; i < 18; i++) glows.push({ x: R() * 600, y: 200 + R() * 70, r: 1 + R() * 2, col: R() < 0.5 ? '99,230,214' : '192,140,255' });
    wrap(() => {
      spikes.forEach(s => {
        c.beginPath();
        if (s.top) { c.moveTo(s.x - s.w, 0); c.lineTo(s.x + s.w, 0); c.lineTo(s.x, s.h); }
        else { c.moveTo(s.x - s.w, 280); c.lineTo(s.x + s.w, 280); c.lineTo(s.x, 280 - s.h * 0.8); }
        c.closePath(); c.fillStyle = '#18263a'; c.fill();
        c.strokeStyle = 'rgba(80,120,160,0.25)'; c.lineWidth = 1; c.stroke();
      });
      glows.forEach(o => {
        const gg = c.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 8);
        gg.addColorStop(0, `rgba(${o.col},0.9)`); gg.addColorStop(1, `rgba(${o.col},0)`);
        c.fillStyle = gg; c.fillRect(o.x - o.r * 8, o.y - o.r * 8, o.r * 16, o.r * 16);
      });
    });
    t.refresh();

    // bliži sloj — stupovi i korijenje
    t = scene.textures.createCanvas('bgMid', 800 * BR, 280 * BR);
    c = t.getContext(); c.scale(BR, BR);
    R = rng(7);
    const pillars = [];
    for (let i = 0; i < 6; i++) pillars.push({ x: R() * 800, w: 18 + R() * 26 });
    const roots = [];
    for (let i = 0; i < 14; i++) roots.push({ x: R() * 800, h: 40 + R() * 90 });
    const wrap2 = (fn) => { [-800, 0, 800].forEach(o => { c.save(); c.translate(o, 0); fn(); c.restore(); }); };
    wrap2(() => {
      pillars.forEach(p => {
        const pg = c.createLinearGradient(p.x - p.w, 0, p.x + p.w, 0);
        pg.addColorStop(0, '#1a2534'); pg.addColorStop(0.4, '#243246'); pg.addColorStop(1, '#141c28');
        c.fillStyle = pg;
        c.beginPath(); c.moveTo(p.x - p.w * 1.6, 0); c.quadraticCurveTo(p.x - p.w * 0.6, 140, p.x - p.w * 1.4, 280);
        c.lineTo(p.x + p.w * 1.3, 280); c.quadraticCurveTo(p.x + p.w * 0.5, 140, p.x + p.w * 1.5, 0); c.closePath(); c.fill();
        c.fillStyle = 'rgba(70,120,90,0.35)'; c.fillRect(p.x - p.w, 120, p.w * 1.6, 3);
      });
      roots.forEach(r => {
        c.strokeStyle = '#2a2219'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(r.x, 0); c.bezierCurveTo(r.x + 10, r.h * 0.3, r.x - 10, r.h * 0.6, r.x + 4, r.h); c.stroke();
      });
    });
    t.refresh();
  }

  return {
    rng,
    generate(scene) {
      canvasSheet(scene, 'rocktiles', 8, 6, (c, i) => { if (i < 48) rockTile(c, Math.floor(i / 3), i % 3); });
      canvasSheet(scene, 'planktiles', 3, 1, plankTile);
      canvasSheet(scene, 'decotiles', 12, 1, decoTile);
      // nevidljivi tileset za koliziju
      const t = scene.textures.createCanvas('coltiles', TILE * 3, TILE); t.refresh();
      backgrounds(scene);
    },
  };
})();
