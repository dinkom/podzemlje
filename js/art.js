// Podzemlje — likovi i predmeti crtani kodom (canvas), u 3x rezoluciji za oštrinu
const RES = 3;
const OUT = '#150f19';

const Art = (() => {
  function sheet(scene, key, w, h, frames, draw, res = RES) {
    const tex = scene.textures.createCanvas(key, w * res * frames.length, h * res);
    const c = tex.getContext();
    frames.forEach((f, i) => {
      c.save();
      c.translate(i * w * res, 0);
      c.scale(res, res);
      c.lineJoin = 'round'; c.lineCap = 'round';
      draw(c, f, i);
      c.restore();
      tex.add(f.name || f, 0, i * w * res, 0, w * res, h * res);
    });
    tex.refresh();
    return tex;
  }

  function ell(c, x, y, rx, ry, fill, stroke = OUT, lw = 1, rot = 0) {
    c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
  }
  function line(c, pts, color, lw) {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.strokeStyle = color; c.lineWidth = lw; c.stroke();
  }
  function limb(c, pts, color, lw) { // linija s obrubom
    line(c, pts, OUT, lw + 1.4);
    line(c, pts, color, lw);
  }
  function radial(c, x, y, r0, r1, stops) {
    const g = c.createRadialGradient(x, y, r0, x, y, r1);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    return g;
  }

  // ---------------- JUNAK: mali moljac s ogrtačem i svjetiljkom ----------------
  function drawHero(c, p) {
    const b = p.bob || 0;
    c.lineWidth = 1;
    if (p.fly !== undefined) {
      // raširena krilca (završna animacija)
      const f = p.fly;
      [-1, 1].forEach(side => {
        c.beginPath();
        c.moveTo(16 + side * 2.5, 16 + b);
        c.quadraticCurveTo(16 + side * 15, 3 - f * 4 + b, 16 + side * 15.5, 13 - f * 2 + b);
        c.quadraticCurveTo(16 + side * 12, 22 + f * 2 + b, 16 + side * 2.5, 20 + b);
        c.closePath();
        c.fillStyle = side < 0 ? '#a891d0' : '#c4b2e6'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.9; c.stroke();
        ell(c, 16 + side * 10, 11 - f * 2 + b, 2.2, 1.7, '#7f68b5', null);
        ell(c, 16 + side * 10, 11 - f * 2 + b, 0.9, 0.8, '#f0d98a', null);
      });
    }
    // krilca iza leđa
    c.beginPath();
    c.moveTo(12, 16 + b);
    c.quadraticCurveTo(3 - p.cloak * 0.4, 10 + b, 4, 19 + b);
    c.quadraticCurveTo(6, 23 + b, 12, 21 + b);
    c.closePath();
    c.fillStyle = '#b9a5de'; c.fill(); c.strokeStyle = OUT; c.stroke();
    ell(c, 7, 17 + b, 1.8, 1.4, '#7f68b5', null);
    ell(c, 7, 17 + b, 0.7, 0.6, '#f0d98a', null);

    // noge
    const leg = (hx, fx, lift) => {
      limb(c, [[hx, 24 + b], [fx, 29.5 - lift]], '#43394f', 2.4);
      ell(c, fx + 0.8, 30.3 - lift, 2.1, 1.3, '#2a2130', OUT, 0.9);
    };
    leg(14.5, 14.5 + p.legB, p.liftB);
    leg(18, 18 + p.legA, p.liftA);

    // ogrtač
    const fl = p.cloak || 0;
    const g = c.createLinearGradient(8, 0, 24, 0);
    g.addColorStop(0, '#5e3f27'); g.addColorStop(0.6, '#8a623f'); g.addColorStop(1, '#9c7148');
    c.beginPath();
    c.moveTo(12, 14.5 + b);
    c.quadraticCurveTo(9, 19 + b, 8 - fl, 26.5 + b);
    c.lineTo(10 - fl * 0.6, 25.5 + b);
    c.lineTo(11.5 - fl * 0.3, 27.2 + b);
    c.lineTo(14, 25.8 + b);
    c.lineTo(16.5, 27.4 + b);
    c.lineTo(19, 25.9 + b);
    c.lineTo(21.5, 27 + b);
    c.lineTo(23, 25.5 + b);
    c.quadraticCurveTo(23.5, 19 + b, 21.5, 14.5 + b);
    c.closePath();
    c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
    // šav i zakrpa
    line(c, [[17, 18 + b], [17.4, 25 + b]], 'rgba(40,25,15,0.6)', 0.6);
    c.fillStyle = '#6f7f5a'; c.fillRect(12.2, 21 + b, 2.6, 2.2);
    line(c, [[12.2, 21 + b], [14.8, 23.2 + b]], 'rgba(30,20,10,0.7)', 0.4);

    // ruka
    if (p.arm === 'attack') {
      // zamah štapom
      limb(c, [[19.5, 17 + b], [24, 13.5 + b]], '#8a623f', 2.4);
      ell(c, 24.5, 13 + b, 1.2, 1.2, '#dcd6ea', OUT, 0.8);
      limb(c, [[21.5, 20 + b], [30, 5.5 + b]], '#9b7a50', 1.4);
      ell(c, 30.2, 5.2 + b, 1.3, 1.3, '#c49a5a', OUT, 0.8);
    } else {
      limb(c, [[19, 17.5 + b], [23, 19.5 + b]], '#8a623f', 2.4);
      // svjetiljka
      c.save(); c.translate(23.5, 19.2 + b);
      c.fillStyle = '#5c6874'; c.strokeStyle = OUT; c.lineWidth = 0.8;
      c.fillRect(0, -1.2, 4.2, 2.4); c.strokeRect(0, -1.2, 4.2, 2.4);
      c.fillStyle = '#8693a1'; c.fillRect(4, -1.8, 1.8, 3.6); c.strokeRect(4, -1.8, 1.8, 3.6);
      c.fillStyle = p.lamp === false ? '#555' : '#fff3a8'; c.fillRect(5.8, -1.5, 0.8, 3);
      c.restore();
      ell(c, 23.4, 19.4 + b, 1.2, 1.2, '#dcd6ea', OUT, 0.8);
    }

    // pahuljasti ovratnik
    for (let i = 0; i < 6; i++) {
      const x = 11.3 + i * 2.1, y = 15.2 + b + Math.sin(i * 1.7) * 0.5;
      ell(c, x, y, 1.9, 1.7, '#f1e6cc', OUT, 0.7);
    }
    for (let i = 0; i < 5; i++) ell(c, 12.4 + i * 2.1, 14.4 + b, 1.4, 1.2, '#fbf5e6', null);

    // glava
    const hg = radial(c, 16, 7.5 + b, 1, 8, [[0, '#f4f1fa'], [0.7, '#d8d1e8'], [1, '#aea4c6']]);
    ell(c, 17, 9.8 + b, 6.6, 6, hg, OUT, 1);
    // čuperak
    c.beginPath(); c.moveTo(14, 4.5 + b); c.quadraticCurveTo(15.5, 2.2 + b, 17, 4 + b);
    c.quadraticCurveTo(18.5, 2.4 + b, 19.6, 4.3 + b);
    c.fillStyle = '#e9e3f3'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.8; c.stroke();
    // antene
    const a = p.ant || 0;
    const antenna = (x0, x1, y1) => {
      c.beginPath(); c.moveTo(x0, 4.6 + b); c.quadraticCurveTo(x0 - 1, 1 + b, x1 - a, y1 + b * 0.5);
      c.strokeStyle = '#6f6488'; c.lineWidth = 0.9; c.stroke();
      for (let k = 0; k < 3; k++) {
        const t = 0.45 + k * 0.2;
        const px = x0 + (x1 - a - x0) * t, py = 4.6 + b + (y1 - 4.6) * t - 1.4;
        line(c, [[px, py], [px - 1.2, py - 1.1]], '#8f84aa', 0.6);
      }
      ell(c, x1 - a, y1 + b * 0.5, 0.8, 0.8, '#d6c8f0', null);
    };
    antenna(15, 10, 1.4);
    antenna(18.5, 14.5, 0.9);
    // oči
    ell(c, 16.2, 10.4 + b, 2.1, 2.8, '#140f1c', null);
    ell(c, 20.9, 10.2 + b, 1.7, 2.4, '#140f1c', null);
    ell(c, 16.8, 9.2 + b, 0.8, 0.8, '#ffffff', null);
    ell(c, 21.3, 9.2 + b, 0.6, 0.6, '#ffffff', null);
    ell(c, 15.6, 11.8 + b, 0.35, 0.35, '#9fd8ff', null);
    // rumenilo
    ell(c, 13.6, 13 + b, 1.3, 0.7, 'rgba(232,150,170,0.6)', null);
    ell(c, 22.2, 12.8 + b, 0.9, 0.6, 'rgba(232,150,170,0.5)', null);
  }

  function heroFrames(scene) {
    const F = [];
    F.push({ name: 'idle0', bob: 0, legA: 0, legB: 0, liftA: 0, liftB: 0, cloak: 0, ant: 0 });
    F.push({ name: 'idle1', bob: 0.6, legA: 0, legB: 0, liftA: 0, liftB: 0, cloak: 0.4, ant: 0.8 });
    const LA = [3, 1, -3, -1], LB = [-3, -1, 3, 1], UA = [0, 1.6, 0, 0], UB = [0, 0, 0, 1.6], BB = [0, -0.8, 0, -0.8];
    for (let i = 0; i < 4; i++) F.push({ name: 'run' + i, bob: BB[i], legA: LA[i], legB: LB[i], liftA: UA[i], liftB: UB[i], cloak: 1.5 + (i % 2), ant: 2 + (i % 2) });
    F.push({ name: 'jump', bob: -0.5, legA: 1.5, legB: -1, liftA: 3, liftB: 2.2, cloak: 3, ant: 3 });
    F.push({ name: 'fall', bob: 0, legA: 2, legB: -2, liftA: 0.5, liftB: 0.5, cloak: -1, ant: -1.5 });
    F.push({ name: 'attack', bob: 0, legA: 2.5, legB: -2, liftA: 0, liftB: 0, cloak: 1, ant: 1.5, arm: 'attack' });
    F.push({ name: 'dark', bob: 0, legA: 0, legB: 0, liftA: 0, liftB: 0, cloak: 0, ant: 0, lamp: false });
    F.push({ name: 'fly0', bob: 0, legA: 1, legB: -1, liftA: 2.5, liftB: 2, cloak: -1.5, ant: -1.5, fly: 1, lamp: false });
    F.push({ name: 'fly1', bob: 0.6, legA: 1.5, legB: -1.5, liftA: 2, liftB: 1.5, cloak: -0.5, ant: -0.5, fly: -0.6, lamp: false });
    sheet(scene, 'hero', 32, 32, F, drawHero);
  }

  // ---------------- TIHI: visoko čudovište s porculanskom maskom ----------------
  function drawTihi(c, p) {
    const b = p.bob || 0, r = p.reach || 0;
    const SK = '#a7ab95', SKD = '#7f8572';
    // kosa iza glave
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(29 + i * 1.2, 4 + b);
      c.bezierCurveTo(24 + i, 10 + b, 27 - i, 16 + b, 22 + i * 0.8 - r * 2, 24 + b + i);
      c.strokeStyle = i % 2 ? '#141018' : '#1f1924'; c.lineWidth = 1.3; c.stroke();
    }
    const arm = (sx, sy, ang, sleeve, skin) => {
      const ex = sx + Math.sin(ang) * 15, ey = sy + Math.cos(ang) * 15;
      const a2 = ang * 0.6 + r * 0.5;
      const hx = ex + Math.sin(a2) * 16, hy = ey + Math.cos(a2) * 16;
      limb(c, [[sx, sy], [ex, ey]], sleeve, 4.2);
      limb(c, [[ex, ey], [hx, hy]], skin, 2.2);
      // prsti s kandžama
      for (let k = -1; k <= 1; k++) {
        const fa = a2 + k * 0.28;
        const fx = hx + Math.sin(fa) * 6, fy = hy + Math.cos(fa) * 6;
        limb(c, [[hx, hy], [fx, fy], [fx + Math.sin(fa + 0.5) * 2, fy + Math.cos(fa + 0.5) * 2]], skin, 0.9);
      }
    };
    const leg = (hx, dx, lift, col) => {
      const kx = hx + dx * 0.5 + 2.5, ky = 69 + b * 0.5;
      const fx = hx + dx, fy = 78.2 - lift;
      limb(c, [[hx, 57 + b], [kx, ky], [fx, fy]], col, 3.2);
      c.beginPath(); c.moveTo(fx - 1.5, fy - 0.5); c.lineTo(fx + 5.5, fy + 0.4); c.lineTo(fx + 6.5, fy + 1.3); c.lineTo(fx - 1.5, fy + 1.3); c.closePath();
      c.fillStyle = SKD; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.8; c.stroke();
    };
    // stražnja ruka i noga
    arm(23, 27 + b, 0.15 + (p.armB || 0) + r * 1.15, '#2a2133', SKD);
    leg(22, p.legB || 0, p.liftB || 0, '#231c2b');

    // kaput
    const g = c.createLinearGradient(14, 20, 34, 64);
    g.addColorStop(0, '#4a3c58'); g.addColorStop(1, '#2b2236');
    c.beginPath();
    c.moveTo(19, 25 + b);
    c.quadraticCurveTo(13, 32 + b, 15, 46 + b);
    c.lineTo(14, 61 + b);
    c.lineTo(17, 58.5 + b); c.lineTo(18.5, 63 + b); c.lineTo(21.5, 59 + b);
    c.lineTo(24, 64 + b); c.lineTo(26.5, 59.5 + b); c.lineTo(29.5, 63 + b);
    c.lineTo(31, 58 + b); c.lineTo(33.5, 61.5 + b);
    c.quadraticCurveTo(34, 45 + b, 31.5, 26 + b);
    c.quadraticCurveTo(26, 22 + b, 19, 25 + b);
    c.closePath();
    c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.1; c.stroke();
    // rubovi i zakrpe
    line(c, [[29.5, 28 + b], [31, 58 + b]], 'rgba(15,10,20,0.6)', 0.9);
    c.fillStyle = '#5b4a6b'; c.fillRect(17.5, 40 + b, 4, 4.5);
    line(c, [[17.5, 40 + b], [21.5, 44.5 + b]], '#1a1420', 0.5);
    line(c, [[21.5, 40 + b], [17.5, 44.5 + b]], '#1a1420', 0.5);
    [33, 40, 47].forEach(y => ell(c, 30.6, y + b, 0.9, 0.9, '#9b8540', OUT, 0.6));

    // prednja noga
    leg(26, p.legF || 0, p.liftF || 0, '#2a2133');

    // vrat
    limb(c, [[28.5, 25.5 + b], [31.5, 18 + b]], SK, 2.6);

    // maska
    c.save();
    c.translate(33.5, 12 + b);
    c.rotate(0.12 + r * 0.1);
    const mg = radial(c, -2, -4, 1, 12, [[0, '#f7f3ea'], [0.65, '#e4dccd'], [1, '#bfb4a1']]);
    ell(c, 0, 0, 7.6, 9.6, mg, OUT, 1.1);
    // pukotine
    line(c, [[2.5, -9], [1.2, -5.5], [2.8, -3.5], [1.6, -1]], '#5e554b', 0.6);
    line(c, [[-5.5, 3], [-3.8, 5.2], [-4.6, 7.5]], '#5e554b', 0.5);
    // obrazi
    ell(c, -4.6, 2.4, 1.6, 1, 'rgba(214,120,120,0.45)', null);
    ell(c, 5, 2.2, 1.4, 0.9, 'rgba(214,120,120,0.4)', null);
    // očne šupljine
    const hole = (x, y, w, h, tilt) => {
      c.beginPath(); c.ellipse(x, y, w, h, tilt, 0, Math.PI * 2);
      c.fillStyle = '#060308'; c.fill();
    };
    hole(-2.6, -2, 2.1, 2.9, 0.3);
    hole(3.2, -2.3, 1.9, 2.7, -0.3);
    ell(c, -2.4, -1.6, 0.8, 0.8, '#ff5a3c', null);
    ell(c, 3.3, -1.9, 0.7, 0.7, '#ff5a3c', null);
    // preširok osmijeh
    c.beginPath();
    c.moveTo(-6.6, 3.2);
    c.quadraticCurveTo(0, 10.5, 6.8, 2.6);
    c.quadraticCurveTo(0, 7.2, -6.6, 3.2);
    c.fillStyle = '#3c0c16'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.7; c.stroke();
    c.fillStyle = '#f2ecd8';
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9, x = -6.2 + t * 12.6, y = 3.3 + Math.sin(t * Math.PI) * 3.7;
      c.beginPath(); c.moveTo(x - 0.6, y); c.lineTo(x + 0.6, y); c.lineTo(x, y + 1.1); c.closePath(); c.fill();
    }
    c.restore();

    // prednja ruka
    arm(27, 28 + b, -0.05 + (p.armF || 0) + r * 1.25, '#3b2f47', SK);
  }

  function tihiFrames(scene) {
    const F = [];
    const LF = [5, 1, -5, -1], LB = [-5, -1, 5, 1], UF = [0, 2, 0, 0], UB = [0, 0, 0, 2], BB = [0, -1, 0, -1], AF = [0.35, 0.1, -0.35, -0.1];
    for (let i = 0; i < 4; i++) F.push({ name: 'walk' + i, bob: BB[i], legF: LF[i], legB: LB[i], liftF: UF[i], liftB: UB[i], armF: AF[i], armB: -AF[i], reach: 0 });
    for (let i = 0; i < 4; i++) F.push({ name: 'chase' + i, bob: BB[i] * 1.4, legF: LF[i] * 1.4, legB: LB[i] * 1.4, liftF: UF[i] * 1.5, liftB: UB[i] * 1.5, armF: AF[i] * 0.5, armB: -AF[i] * 0.5, reach: 0.9 });
    F.push({ name: 'idle0', bob: 0, legF: 2, legB: -2, liftF: 0, liftB: 0, armF: 0, armB: 0, reach: 0.15 });
    F.push({ name: 'idle1', bob: 0.7, legF: 2, legB: -2, liftF: 0, liftB: 0, armF: 0.05, armB: -0.05, reach: 0.25 });
    sheet(scene, 'tihi', 48, 80, F, drawTihi);
  }

  // ---------------- GMIZAVAC: ljubičasta buba ----------------
  function drawBug(c, p) {
    const s = p.step;
    for (let i = 0; i < 3; i++) {
      const x = 7 + i * 5, ph = (i % 2 ? 1 : -1) * s;
      limb(c, [[x, 9], [x - 1.5 + ph, 11], [x - 2.5 + ph, 13.3]], '#2a1f45', 0.9);
      limb(c, [[x + 1, 9], [x + 2 + ph * -1, 11.2], [x + 3 - ph, 13.3]], '#1f1734', 0.8);
    }
    const g = c.createLinearGradient(0, 3, 0, 13);
    g.addColorStop(0, '#8c78d0'); g.addColorStop(1, '#3d2d6c');
    ell(c, 11, 8 + p.bob, 8.8, 4.4, g, OUT, 1);
    // segmenti
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.arc(5 + i * 3.8, 8 + p.bob, 4.2, -1.2, 1.2);
      c.strokeStyle = 'rgba(30,20,60,0.7)'; c.lineWidth = 0.6; c.stroke();
    }
    // bodlje
    c.fillStyle = '#b6a4f0';
    [5, 9, 13].forEach(x => { c.beginPath(); c.moveTo(x - 1, 4.2 + p.bob); c.lineTo(x, 2 + p.bob); c.lineTo(x + 1, 4.2 + p.bob); c.fill(); });
    ell(c, 8, 5.5 + p.bob, 3, 1, 'rgba(255,255,255,0.25)', null);
    // glava
    ell(c, 19.5, 8.6 + p.bob, 3.6, 3.1, '#3a2b62', OUT, 0.9);
    ell(c, 20.8, 7.4 + p.bob, 1.2, 1.2, '#ff9a3c', null);
    ell(c, 18.7, 7 + p.bob, 0.9, 0.9, '#ffb25c', null);
    ell(c, 21.1, 7, 0.35, 0.35, '#fff', null);
    // čeljusti
    c.beginPath(); c.moveTo(22, 9.5 + p.bob); c.quadraticCurveTo(24, 10 + p.bob, 23, 11.8 + p.bob);
    c.strokeStyle = '#e6d6aa'; c.lineWidth = 0.8; c.stroke();
  }
  function bugFrames(scene) {
    sheet(scene, 'bug', 24, 14, [{ name: 'c0', step: 1.2, bob: 0 }, { name: 'c1', step: -1.2, bob: -0.3 }], drawBug);
  }

  // ---------------- ŠIŠMIŠ ----------------
  function drawBat(c, p) {
    if (p.hang) {
      // visi naglavačke, umotan u krila
      line(c, [[12, 0], [12, 2.5]], '#2a2230', 1);
      line(c, [[10.5, 0.5], [11.3, 2.5]], '#2a2230', 0.8); line(c, [[13.5, 0.5], [12.7, 2.5]], '#2a2230', 0.8);
      c.beginPath(); c.moveTo(12, 2 + p.b); c.bezierCurveTo(6, 3, 5.5, 11, 12, 14.5 + p.b); c.bezierCurveTo(18.5, 11, 18, 3, 12, 2 + p.b);
      c.fillStyle = '#4b3d5c'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.9; c.stroke();
      line(c, [[9, 4], [10, 12]], 'rgba(20,14,28,0.6)', 0.5); line(c, [[15, 4], [14, 12]], 'rgba(20,14,28,0.6)', 0.5);
      ell(c, 12, 13 + p.b, 2.6, 2.1, '#3a2f45', OUT, 0.7);
      c.fillStyle = '#3a2f45'; c.beginPath(); c.moveTo(10, 14.3 + p.b); c.lineTo(9.6, 16 + p.b); c.lineTo(11, 14.8 + p.b); c.moveTo(14, 14.3 + p.b); c.lineTo(14.4, 16 + p.b); c.lineTo(13, 14.8 + p.b); c.fill();
      line(c, [[10.8, 12.8 + p.b], [11.6, 12.6 + p.b]], '#1a1420', 0.5); line(c, [[12.4, 12.6 + p.b], [13.2, 12.8 + p.b]], '#1a1420', 0.5);
      return;
    }
    const w = p.w; // položaj krila -1..1
    const wing = (side) => {
      const sx = 12 + side * 2.5, tipY = 7 - w * 6;
      c.beginPath();
      c.moveTo(sx, 7);
      c.lineTo(12 + side * 8, tipY - 1);
      c.lineTo(12 + side * 11.5, tipY + 2);
      c.quadraticCurveTo(12 + side * 9.5, 9 - w * 2, 12 + side * 8.5, 11 - w * 2.5);
      c.quadraticCurveTo(12 + side * 6.5, 9.5 - w, 12 + side * 5, 11.5 - w);
      c.quadraticCurveTo(12 + side * 3.8, 9.6, sx, 10);
      c.closePath();
      c.fillStyle = '#5a4a6e'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.8; c.stroke();
      line(c, [[sx, 7.5], [12 + side * 8.5, 11 - w * 2.5]], 'rgba(30,20,40,0.7)', 0.5);
      line(c, [[sx, 7.5], [12 + side * 11.5, tipY + 2]], 'rgba(30,20,40,0.7)', 0.5);
    };
    wing(-1); wing(1);
    ell(c, 12, 8.5, 3.2, 3.4, '#3d3149', OUT, 0.9);
    // uši
    c.fillStyle = '#3d3149';
    c.beginPath(); c.moveTo(10, 6); c.lineTo(9.6, 2.4); c.lineTo(11.6, 5.4); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(14, 6); c.lineTo(14.4, 2.4); c.lineTo(12.4, 5.4); c.closePath(); c.fill(); c.stroke();
    ell(c, 10.9, 7.6, 0.9, 0.9, '#ffd25a', null); ell(c, 13.1, 7.6, 0.9, 0.9, '#ffd25a', null);
    ell(c, 11, 7.4, 0.3, 0.3, '#fff', null); ell(c, 13.2, 7.4, 0.3, 0.3, '#fff', null);
    c.fillStyle = '#f2ecd8';
    c.beginPath(); c.moveTo(11.3, 10); c.lineTo(11.7, 11.3); c.lineTo(12, 10); c.moveTo(12.2, 10); c.lineTo(12.6, 11.3); c.lineTo(12.9, 10); c.fill();
  }
  function batFrames(scene) {
    sheet(scene, 'bat', 24, 17, [
      { name: 'hang0', hang: true, b: 0 }, { name: 'hang1', hang: true, b: 0.4 },
      { name: 'fly0', w: 1 }, { name: 'fly1', w: 0 }, { name: 'fly2', w: -0.9 },
    ], drawBat);
  }

  // ---------------- PAUK ----------------
  function drawSpider(c, p) {
    const k = p.k;
    for (let i = 0; i < 4; i++) {
      const y = 9 + i * 1.6, sw = (i % 2 ? k : -k);
      limb(c, [[10, y], [4 - i * 0.5, y - 3 + sw], [1.5 - i * 0.3, y + 4 + sw]], '#2b2030', 0.9);
      limb(c, [[14, y], [20 + i * 0.5, y - 3 - sw], [22.5 + i * 0.3, y + 4 - sw]], '#2b2030', 0.9);
    }
    const g = c.createRadialGradient(11, 12, 1, 12, 13, 7);
    g.addColorStop(0, '#6a4a7a'); g.addColorStop(1, '#2a1b33');
    ell(c, 12, 13.5, 5.6, 6, g, OUT, 1);
    c.fillStyle = '#c9364a'; c.beginPath(); c.moveTo(12, 11); c.lineTo(13.6, 14); c.lineTo(12, 17); c.lineTo(10.4, 14); c.closePath(); c.fill();
    ell(c, 12, 7.2, 3.6, 3, '#3a2846', OUT, 0.9);
    [[10.4, 6.6, 0.8], [13.6, 6.6, 0.8], [11.3, 5.4, 0.55], [12.7, 5.4, 0.55]].forEach(([x, y, r]) => ell(c, x, y, r, r, '#ff4a4a', null));
    c.strokeStyle = '#e6d6aa'; c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(11, 9.6); c.lineTo(10.6, 11); c.moveTo(13, 9.6); c.lineTo(13.4, 11); c.stroke();
  }
  function spiderFrames(scene) {
    sheet(scene, 'pauk', 24, 20, [{ name: 'p0', k: 0.8 }, { name: 'p1', k: -0.8 }], drawSpider);
  }

  function icicleFrames(scene) {
    sheet(scene, 'ledenica', 10, 26, ['l'], (c) => {
      c.beginPath(); c.moveTo(0.5, 0); c.lineTo(9.5, 0); c.lineTo(6.5, 10); c.lineTo(5, 25.5); c.lineTo(3.4, 11); c.closePath();
      const g = c.createLinearGradient(0, 0, 10, 0); g.addColorStop(0, '#e8f8ff'); g.addColorStop(0.5, '#a6d8f2'); g.addColorStop(1, '#6aa6cc');
      c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.8; c.stroke();
      line(c, [[3, 1.5], [4.6, 18]], 'rgba(255,255,255,0.8)', 0.7);
    });
  }

  // ---------------- PREDMETI ----------------
  function objects(scene) {
    // ormar za skrivanje
    sheet(scene, 'ormar', 26, 46, ['ormar'], (c) => {
      const g = c.createLinearGradient(2, 0, 24, 0);
      g.addColorStop(0, '#5a3d28'); g.addColorStop(0.5, '#7b5537'); g.addColorStop(1, '#583b27');
      c.fillStyle = g; c.strokeStyle = OUT; c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(2, 45); c.lineTo(2.5, 4); c.lineTo(13, 1.5); c.lineTo(23.5, 4); c.lineTo(24, 45); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#3f2a1b'; c.fillRect(4, 6, 8.5, 37); c.fillRect(13.5, 6, 8.5, 37);
      c.strokeRect(4, 6, 8.5, 37); c.strokeRect(13.5, 6, 8.5, 37);
      // daske
      c.fillStyle = '#6a4830';
      c.fillRect(4.6, 6.6, 7.3, 35.8); c.fillRect(14.1, 6.6, 7.3, 35.8);
      for (let y = 10; y < 22; y += 2.4) { line(c, [[5.5, y], [11, y]], '#1b120b', 1); line(c, [[15, y], [20.5, y]], '#1b120b', 1); }
      line(c, [[8, 26], [8.4, 41]], 'rgba(30,18,10,0.5)', 0.5);
      line(c, [[17, 27], [17.6, 41]], 'rgba(30,18,10,0.5)', 0.5);
      ell(c, 12, 28, 0.9, 0.9, '#d4ab52', OUT, 0.5);
      ell(c, 14, 28, 0.9, 0.9, '#d4ab52', OUT, 0.5);
      // ogrebotine
      line(c, [[6, 30], [10, 36]], 'rgba(220,200,170,0.35)', 0.5);
      line(c, [[6.5, 29], [10.5, 35]], 'rgba(220,200,170,0.35)', 0.5);
    });

    // lampa (checkpoint)
    const lamp = (c, on) => {
      line(c, [[8, 40], [8, 12]], OUT, 3.2); line(c, [[8, 40], [8, 12]], '#4b525e', 2);
      c.fillStyle = '#3a3f49'; c.fillRect(4, 38, 8, 2);
      if (on) { c.fillStyle = radial(c, 8, 7, 0, 9, [[0, 'rgba(255,220,140,0.9)'], [1, 'rgba(255,200,100,0)']]); c.fillRect(-1, -2, 18, 18); }
      c.fillStyle = on ? '#ffdf8c' : '#28303b';
      c.beginPath(); c.moveTo(4.5, 3); c.lineTo(11.5, 3); c.lineTo(12.5, 11); c.lineTo(3.5, 11); c.closePath(); c.fill();
      c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
      if (on) { ell(c, 8, 7.8, 1.5, 2.6, '#ff9d3a', null); ell(c, 8, 8.4, 0.8, 1.4, '#fff4c8', null); }
      line(c, [[8, 3], [8, 11]], '#20242b', 0.8);
      c.fillStyle = '#4b525e'; c.fillRect(3.5, 1.5, 9, 2); c.fillRect(3, 11, 10, 1.8);
      c.strokeRect(3.5, 1.5, 9, 2); c.strokeRect(3, 11, 10, 1.8);
      ell(c, 8, 0.8, 1.2, 1, '#4b525e', OUT, 0.7);
    };
    sheet(scene, 'lamp', 16, 41, [{ name: 'off' }, { name: 'on' }], (c, f) => lamp(c, f.name === 'on'));

    // baterija
    sheet(scene, 'baterija', 10, 16, ['b'], (c) => {
      c.fillStyle = '#c9ced6'; c.fillRect(3.5, 0.8, 3, 2); c.strokeStyle = OUT; c.lineWidth = 0.8; c.strokeRect(3.5, 0.8, 3, 2);
      const g = c.createLinearGradient(1, 0, 9, 0);
      g.addColorStop(0, '#2c7d4f'); g.addColorStop(0.45, '#6ee09a'); g.addColorStop(1, '#2a6b45');
      c.fillStyle = g; c.fillRect(1.5, 2.6, 7, 12.6); c.strokeRect(1.5, 2.6, 7, 12.6);
      c.fillStyle = '#20262d'; c.fillRect(1.5, 9.5, 7, 5.7);
      c.fillStyle = '#ffe36a';
      c.beginPath(); c.moveTo(5.6, 4); c.lineTo(3.4, 7.8); c.lineTo(5, 7.8); c.lineTo(4.2, 10.6); c.lineTo(6.6, 6.6); c.lineTo(5, 6.6); c.closePath(); c.fill();
    });

    // ključ
    sheet(scene, 'kljuc', 18, 10, ['k'], (c) => {
      c.strokeStyle = OUT; c.lineWidth = 2.6;
      c.beginPath(); c.arc(4.5, 5, 3.4, 0, Math.PI * 2); c.stroke();
      line(c, [[7.5, 5], [16.5, 5]], OUT, 2.6);
      line(c, [[13, 5], [13, 8.5]], OUT, 2.6); line(c, [[15.5, 5], [15.5, 8]], OUT, 2.6);
      c.strokeStyle = '#e7bf4c'; c.lineWidth = 1.4;
      c.beginPath(); c.arc(4.5, 5, 3.4, 0, Math.PI * 2); c.stroke();
      line(c, [[7.5, 5], [16.5, 5]], '#e7bf4c', 1.4);
      line(c, [[13, 5], [13, 8.5]], '#e7bf4c', 1.4); line(c, [[15.5, 5], [15.5, 8]], '#e7bf4c', 1.4);
      ell(c, 3.6, 4.3, 0.7, 0.9, '#3a0d14', null); ell(c, 5.4, 4.3, 0.7, 0.9, '#3a0d14', null);
      line(c, [[8.5, 4.4], [12, 4.4]], '#fff4bf', 0.5);
    });

    // bilješka
    sheet(scene, 'biljeska', 14, 14, ['n'], (c) => {
      c.save(); c.translate(7, 7); c.rotate(-0.12);
      c.fillStyle = '#eadfc4'; c.strokeStyle = OUT; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(-5.5, -5); c.lineTo(5.5, -5.5); c.lineTo(5, 3); c.lineTo(3.5, 5.6); c.lineTo(1.5, 4.4); c.lineTo(-0.5, 5.8); c.lineTo(-5.2, 5); c.closePath(); c.fill(); c.stroke();
      for (let i = 0; i < 4; i++) line(c, [[-4, -2.6 + i * 2], [3.5 - (i % 2) * 2, -2.8 + i * 2]], '#6b5d48', 0.5);
      ell(c, 2.8, 2.6, 1.6, 1.1, 'rgba(130,40,40,0.55)', null);
      ell(c, 0, -4.6, 0.8, 0.8, '#8a8f99', OUT, 0.5);
      c.restore();
    });

    // vrata
    sheet(scene, 'vrata', 48, 96, ['v'], (c) => {
      c.fillStyle = '#2b2f36'; c.fillRect(0, 0, 48, 96);
      const g = c.createLinearGradient(4, 0, 44, 0);
      g.addColorStop(0, '#4a3322'); g.addColorStop(0.5, '#6a4a31'); g.addColorStop(1, '#4a3322');
      c.fillStyle = g; c.fillRect(4, 3, 40, 93);
      for (let x = 12; x < 44; x += 8) line(c, [[x, 4], [x, 95]], 'rgba(25,15,8,0.7)', 0.8);
      [14, 48, 80].forEach(y => {
        c.fillStyle = '#5b626d'; c.fillRect(3, y, 42, 6); c.strokeStyle = OUT; c.lineWidth = 1; c.strokeRect(3, y, 42, 6);
        for (let x = 7; x < 44; x += 6) ell(c, x, y + 3, 0.9, 0.9, '#8e96a3', OUT, 0.4);
      });
      c.fillStyle = '#c29a3e'; c.fillRect(30, 56, 9, 12); c.strokeRect(30, 56, 9, 12);
      ell(c, 34.5, 60.5, 1.4, 1.4, '#120c08', null); c.fillStyle = '#120c08'; c.fillRect(34, 61, 1, 3.5);
      c.strokeStyle = OUT; c.lineWidth = 1.4; c.strokeRect(4, 3, 40, 93);
    });

    // izlaz — kameni luk sa svjetlom
    sheet(scene, 'izlaz', 48, 72, ['e'], (c) => {
      c.fillStyle = radial(c, 24, 46, 2, 26, [[0, 'rgba(235,248,255,1)'], [0.5, 'rgba(160,210,255,0.7)'], [1, 'rgba(120,170,230,0.05)']]);
      c.beginPath(); c.moveTo(10, 72); c.lineTo(10, 30); c.arc(24, 30, 14, Math.PI, 0); c.lineTo(38, 72); c.closePath(); c.fill();
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI + (i / 10) * Math.PI;
        const x = 24 + Math.cos(a) * 18, y = 30 + Math.sin(a) * 18;
        ell(c, x, y, 4.2, 3.6, i % 2 ? '#5d6472' : '#4c5260', OUT, 0.9, a);
      }
      for (let y = 34; y < 72; y += 7) { ell(c, 6, y, 4, 3.4, '#4c5260', OUT, 0.9); ell(c, 42, y, 4, 3.4, '#5d6472', OUT, 0.9); }
    });

    // zamah štapa
    sheet(scene, 'zamah', 30, 26, ['z'], (c) => {
      c.beginPath(); c.arc(4, 13, 22, -1.1, 1.1); c.arc(-2, 13, 19, 1.0, -1.0, true); c.closePath();
      const g = c.createLinearGradient(0, 0, 30, 0);
      g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(1, 'rgba(255,245,220,0.95)');
      c.fillStyle = g; c.fill();
    });

    // sjajni parovi očiju (iznad mraka)
    const eyes = (key, w, h, pts, col, r) => sheet(scene, key, w, h, ['x'], (c) => {
      pts.forEach(([x, y]) => {
        c.fillStyle = radial(c, x, y, 0, r * 3, [[0, col], [0.35, col.replace('1)', '0.5)')], [1, col.replace('1)', '0)')]]);
        c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
        ell(c, x, y, r * 0.6, r * 0.6, '#fff', null);
      });
    });
    eyes('oci_tihi', 16, 8, [[4, 4], [11.5, 3.6]], 'rgba(255,70,50,1)', 1.3);
    eyes('oci_buba', 10, 6, [[3, 3], [7, 3]], 'rgba(255,150,60,1)', 0.8);
    eyes('oci_junak', 12, 6, [[3.5, 3], [8.5, 3]], 'rgba(150,230,255,1)', 0.8);
    eyes('oci_pauk', 8, 5, [[2.6, 2.5], [5.4, 2.5]], 'rgba(255,60,60,1)', 0.55);
    eyes('oci_bat', 8, 5, [[2.6, 2.5], [5.4, 2.5]], 'rgba(255,210,90,1)', 0.6);

    // sitne točkice i sjaj
    sheet(scene, 'dot', 4, 4, ['d'], (c) => { ell(c, 2, 2, 1.6, 1.6, '#fff', null); }, 2);
    sheet(scene, 'glow', 32, 32, ['g'], (c) => {
      c.fillStyle = radial(c, 16, 16, 0, 16, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
      c.fillRect(0, 0, 32, 32);
    }, 2);
  }

  // ---------------- SVJETLO ZA BRISANJE MRAKA ----------------
  function lights(scene) {
    let t = scene.textures.createCanvas('light', 256, 256);
    let c = t.getContext();
    c.fillStyle = radial(c, 128, 128, 0, 128, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.85)'], [0.8, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']]);
    c.fillRect(0, 0, 256, 256); t.refresh();

    ['R', 'L'].forEach(side => {
      t = scene.textures.createCanvas('cone' + side, 256, 180);
      c = t.getContext();
      c.save();
      if (side === 'L') { c.translate(256, 0); c.scale(-1, 1); }
      c.filter = 'blur(7px)';
      c.beginPath(); c.moveTo(4, 90); c.lineTo(250, 18); c.lineTo(250, 162); c.closePath(); c.clip();
      c.fillStyle = radial(c, 0, 90, 0, 256, [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]);
      c.fillRect(0, 0, 256, 180);
      c.restore();
      t.refresh();
    });
  }

  // ---------------- JUMPSCARE LICE ----------------
  function face(scene) {
    const t = scene.textures.createCanvas('lice', 512, 512);
    const c = t.getContext();
    c.fillStyle = '#000'; c.fillRect(0, 0, 512, 512);
    c.save(); c.translate(256, 250); c.rotate(0.08);
    c.fillStyle = radial(c, -40, -80, 10, 300, [[0, '#fbf7ee'], [0.6, '#ddd3c2'], [1, '#8f8676']]);
    c.beginPath(); c.ellipse(0, 0, 190, 240, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#3d362f'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(60, -235); c.lineTo(35, -150); c.lineTo(70, -100); c.lineTo(40, -30); c.stroke();
    c.beginPath(); c.moveTo(-150, 60); c.lineTo(-110, 110); c.lineTo(-130, 170); c.stroke();
    c.fillStyle = '#050205';
    c.beginPath(); c.ellipse(-75, -55, 52, 72, 0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(80, -60, 48, 68, -0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = radial(c, -70, -48, 0, 22, [[0, '#ffe0d0'], [0.3, '#ff4a2a'], [1, 'rgba(255,40,20,0)']]);
    c.fillRect(-100, -80, 60, 60);
    c.fillStyle = radial(c, 82, -52, 0, 20, [[0, '#ffe0d0'], [0.3, '#ff4a2a'], [1, 'rgba(255,40,20,0)']]);
    c.fillRect(55, -80, 60, 60);
    c.fillStyle = '#2e0710';
    c.beginPath(); c.moveTo(-160, 60); c.quadraticCurveTo(0, 290, 165, 50); c.quadraticCurveTo(0, 170, -160, 60); c.fill();
    c.fillStyle = '#f4eedc';
    for (let i = 0; i < 16; i++) {
      const tt = (i + 0.5) / 16, x = -150 + tt * 305, y = 66 + Math.sin(tt * Math.PI) * 92;
      c.beginPath(); c.moveTo(x - 9, y - 2); c.lineTo(x + 9, y - 2); c.lineTo(x, y + 26); c.closePath(); c.fill();
    }
    c.fillStyle = 'rgba(200,90,90,0.4)';
    c.beginPath(); c.ellipse(-130, 40, 30, 18, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(135, 35, 28, 16, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    t.refresh();
  }

  return {
    generate(scene) {
      heroFrames(scene); tihiFrames(scene); bugFrames(scene); batFrames(scene); spiderFrames(scene); icicleFrames(scene);
      objects(scene); lights(scene); face(scene);
    },
  };
})();
