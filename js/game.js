// Podzemlje — glavna scena igre
const VIEW_H = 270;          // koliko svjetskih piksela vidimo u visinu
const SAVE_KEY = 'podzemlje-save-v1';

const Save = {
  load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } },
  store(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) {} },
  clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} },
  fresh(level = 0) { return { level, cp: null, doorsOpen: [], taken: [] }; },
};

// napredak: koje su zone otključane (ostaje i kad se krene nova igra)
const PROG_KEY = 'podzemlje-progress-v1';
const Progress = {
  load() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem(PROG_KEY)) || {}; } catch (e) {}
    const sv = Save.load() || {};
    return { max: Math.max(p.max || 0, sv.level || 0), done: !!(p.done || sv.done) };
  },
  store(p) { try { localStorage.setItem(PROG_KEY, JSON.stringify(p)); } catch (e) {} },
  unlock(i) { const p = this.load(); if (i > p.max) { p.max = i; this.store(p); } },
  finish() { const p = this.load(); p.done = true; p.max = Math.max(p.max, Level.count - 1); this.store(p); },
};

// razvojni način — samo uz tajnu poveznicu (?dev=lozinka); u kodu je samo otisak lozinke
const DEV_KEY = 'podzemlje-dev';
const Dev = {
  on: (() => { try { return localStorage.getItem(DEV_KEY) === '1'; } catch (e) { return false; } })(),
  god: true, fly: false, bright: false, fast: false, zoom: false,
  HASH: '496b6c14c99cde51a4c8adb6ccf9d9e181c65874af37e1ab42aa087803edcfd8',
  async checkUrl() {
    const q = new URLSearchParams(location.search).get('dev');
    if (q === null) return;
    history.replaceState(null, '', location.pathname);   // makni lozinku iz adresne trake
    if (q === 'off') { this.setOn(false); return; }
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(q));
      const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
      if (hex === this.HASH) this.setOn(true);
    } catch (e) {}
  },
  setOn(v) { this.on = v; try { v ? localStorage.setItem(DEV_KEY, '1') : localStorage.removeItem(DEV_KEY); } catch (e) {} },
  is(k) { return this.on && this[k]; },
};

// stanje kontrola dijele UI scena (touch) i tipkovnica
const Controls = {
  left: false, right: false, jumpHeld: false,
  _p: {},
  press(k) { this._p[k] = true; },
  take(k) { const v = !!this._p[k]; this._p[k] = false; return v; },
  reset() { this.left = this.right = this.up = this.down = this.jumpHeld = this.sneak = false; this._p = {}; },
};

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    Controls.reset();
    this.save = Save.load() || Save.fresh();
    this.levelIndex = Math.min(this.save.level || 0, Level.count - 1);
    const L = this.L = Level.build(this.levelIndex);
    Progress.unlock(this.levelIndex);
    const T = this.T = THEMES[L.theme];
    Tiles.ensureTheme(this, T);
    SFX.setTheme(T.drone);
    this.lightsOff = false;
    const taken = new Set(this.save.taken);
    this.taken = new Set(this.save.taken);
    this.doorsOpen = new Set(this.save.doorsOpen || []);
    this.keyCount = L.objects.filter(o => o.type === 'key' && taken.has(o.id)).length - this.doorsOpen.size;
    this.worldW = L.W * TILE; this.worldH = L.H * TILE;
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    // pozadine
    this.bgFar = this.add.tileSprite(0, 0, 10, 10, 'bgFar_' + T.id).setOrigin(0).setScrollFactor(0).setDepth(0);
    this.bgMid = this.add.tileSprite(0, 0, 10, 10, 'bgMid_' + T.id).setOrigin(0).setScrollFactor(0).setDepth(1);

    // razina
    this.mushGlows = Level.addVisuals(this, L);
    this.layer = Level.addCollision(this, L);

    // predmeti
    this.items = []; this.cabinets = []; this.notes = []; this.checkpoints = []; this.crawlers = []; this.bats = []; this.spiders = []; this.icicles = [];
    this.threads = this.add.graphics().setDepth(12);
    for (const o of L.objects) {
      if (o.type === 'cabinet') {
        const s = this.add.image(o.x, o.y, 'ormar').setOrigin(0.5, 1).setScale(1 / RES).setDepth(9);
        this.cabinets.push({ ...o, s });
      } else if (o.type === 'checkpoint') {
        const s = this.add.image(o.x, o.y + 1, 'lamp', 'off').setOrigin(0.5, 1).setScale(1 / RES).setDepth(9);
        this.checkpoints.push({ ...o, s });
      } else if (o.type === 'note') {
        const s = this.add.image(o.x, o.y - 18, 'biljeska').setScale(1 / RES).setDepth(9);
        this.notes.push({ ...o, s });
      } else if (o.type === 'battery' || o.type === 'key') {
        if (taken.has(o.id)) continue;
        const s = this.add.image(o.x, o.y - 7, o.type === 'key' ? 'kljuc' : 'baterija').setScale(1 / RES).setDepth(11);
        const glow = this.add.image(o.x, o.y - 7, 'glow').setScale(o.type === 'key' ? 0.9 : 0.55).setDepth(61)
          .setTint(o.type === 'key' ? 0xffd25a : 0x6ee09a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
        this.items.push({ ...o, s, glow, baseY: o.y - 7 });
      } else if (o.type === 'exit') {
        this.exit = { ...o, s: this.add.image(o.x, o.y, 'izlaz').setOrigin(0.5, 1).setScale(1 / RES).setDepth(4) };
      } else if (o.type === 'crawler') {
        this.spawnCrawler(o);
      } else if (o.type === 'bat') {
        this.spawnBat(o);
      } else if (o.type === 'spider') {
        this.spawnSpider(o);
      } else if (o.type === 'icicle') {
        this.spawnIcicle(o);
      }
    }
    // vrata
    this.doors = L.doors.map(D => ({ ...D, open: false, msg: false, s: this.add.image(D.x, D.y, 'vrata').setOrigin(0).setScale(1 / RES).setDepth(8) }));
    this.doors.forEach(D => { if (this.doorsOpen.has(D.id)) this.openDoor(D, true); });

    // daske koje pucaju
    this.crumbles = [];
    L.grid.forEach((row, y) => row.forEach((ch, x) => {
      if (ch !== '=') return;
      const s = this.add.image(x * TILE, y * TILE, 'crumble_' + T.id).setOrigin(0).setScale(1 / RES).setDepth(7);
      this.crumbles.push({ x, y, s, state: 'ok', t: 0 });
    }));


    // sjaj gljiva iznad mraka
    this.glowImgs = this.mushGlows.map(m => this.add.image(m.x, m.y, 'glow').setScale(0.35).setTint(m.col).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(61));

    // voda
    this.buildWater();

    // junak
    const cp = this.checkpoints.find(c => c.id === this.save.cp);
    const sx = cp ? cp.x + 14 : L.start.x, sy = cp ? cp.y : L.start.y;
    const p = this.player = this.physics.add.sprite(sx, sy - 16, 'hero', 'idle0').setScale(1 / RES).setDepth(15);
    p.body.setSize(11 * RES, 22 * RES).setOffset(11 * RES, 9 * RES);
    p.body.setMaxVelocity(400, 620);
    p.setCollideWorldBounds(true);
    if (window.__devJump) { p.setPosition(window.__devJump.x, window.__devJump.y); window.__devJump = null; }
    this.physics.add.collider(p, this.layer);
    this.st = { face: 1, coyote: 0, buffer: 0, hp: 3, invul: 0, hidden: null, flash: false, battery: 100, atkCd: 0, atkT: 0, lock: 0, dead: false, jumping: false, airVy: 0, stepT: 0, insideCp: cp ? cp.id : null, doorMsg: false };
    this.peek = this.add.image(0, 0, 'oci_junak').setScale(1 / RES).setDepth(62).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.slash = this.add.image(0, 0, 'zamah').setScale(1 / RES).setDepth(16).setVisible(false);
    if (cp) cp.s.setFrame('on');

    // čudovišta
    this.monsters = L.monsters.map(m => this.spawnMonster(m));

    // čestice
    this.dust = this.add.particles(0, 0, 'dot', {
      lifespan: 5000, speedX: { min: -6, max: 6 }, speedY: { min: -4, max: 6 }, scale: { start: 0.25, end: 0.1 },
      alpha: { start: 0.55, end: 0 }, tint: 0xd8e4ff, emitting: false,
    }).setDepth(17);
    this.spores = this.add.particles(0, 0, 'glow', {
      lifespan: 7000, speedX: { min: -5, max: 5 }, speedY: { min: -9, max: -2 }, scale: { start: 0.12, end: 0.04 },
      alpha: { start: 0.45, end: 0 }, tint: [T.glow[0], T.glow[1], 0x9fd8ff], blendMode: 'ADD', emitting: false,
    }).setDepth(61);
    this.burst = this.add.particles(0, 0, 'dot', {
      lifespan: 600, speed: { min: 30, max: 110 }, scale: { start: 0.6, end: 0 }, gravityY: 300,
      tint: [0x8c78d0, 0xff9a3c, 0xb6a4f0], emitting: false,
    }).setDepth(16);

    // mrak — crta se na malom canvasu i rasteže (meko svjetlo, jeftino)
    this.DS = 2;
    this.darkTex = this.textures.exists('darkness') ? this.textures.get('darkness') : this.textures.createCanvas('darkness', 64, 64);
    this.dark = this.add.image(0, 0, 'darkness').setOrigin(0).setScale(this.DS).setDepth(50);
    this.lightImg = this.textures.get('light').getSourceImage();
    this.coneImg = { R: this.textures.get('coneR').getSourceImage(), L: this.textures.get('coneL').getSourceImage() };

    // kamera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    cam.startFollow(p, true, 0.12, 0.12);
    cam.setFollowOffset(0, 18);
    cam.setBackgroundColor(T.cam);
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

    // tipkovnica (za testiranje na računalu)
    this.keys = this.input.keyboard.addKeys('A,D,W,S,I,SPACE,J,K,L,ESC');

    this.dripT = 2; this.heartT = 0; this.time0 = 0;
    this.ui = this.scene.get('UI');
    this.ui.bind(this);
    if (L.lightsOutKey && taken.has(L.lightsOutKey)) this.applyLightsOut(true);
    // zid tame (završna potjera)
    this.wall = null;
    if (L.darkWall) {
      this.wallG = this.add.graphics().setDepth(55);
      this.wallEyes = [];
      for (let i = 0; i < 7; i++) this.wallEyes.push(this.add.image(0, 0, 'oci_tihi').setScale(1 / RES).setDepth(56).setBlendMode(Phaser.BlendModes.ADD).setVisible(false));
      if (taken.has(L.darkWall.key)) this.startWall(this.player.x - 340, 2);
    }
    this.iceBurst = this.add.particles(0, 0, 'dot', { lifespan: 500, speed: { min: 40, max: 120 }, scale: { start: 0.5, end: 0 }, gravityY: 400, tint: [0xe8f8ff, 0xa6d8f2], emitting: false }).setDepth(16);
    if (!this.save.cp) this.ui.zoneCard(this.levelIndex + 1, L.name);
    if (!this.save.cp && this.levelIndex === 0) this.time.delayedCall(3200, () => this.ui.toast(this.ui.touchMode ? 'Lijevi palac: hodaj (malo pomakni = šuljaj se tiho).  Desno: skok, udarac, svjetiljka.' : 'A / D: hodaj (drži S za šuljanje)   ·   W / I: skok   ·   J: udarac   ·   K: svjetiljka   ·   L: radnja   ·   Esc: pauza', 5500));
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  layout() {
    const w = this.scale.width, h = this.scale.height;
    const cam = this.cameras.main;
    const zoom = Dev.is('zoom') ? Math.min(w / this.worldW, h / this.worldH) : h / VIEW_H;
    cam.setZoom(zoom);
    const vw = w / zoom, vh = h / zoom;
    this.vw = vw; this.vh = vh;
    const ox = (w - vw) / 2, oy = (h - vh) / 2;
    [[this.bgFar, 280], [this.bgMid, 280]].forEach(([ts, th]) => {
      ts.setPosition(ox, oy).setSize(vw, vh);
      const s = vh / th / 2;
      ts.setTileScale(s, s);
    });
    if (!Dev.is('zoom')) this.darkTex.setSize(Math.ceil((vw + 80) / this.DS), Math.ceil((vh + 80) / this.DS));
    this.dark.setTexture('darkness');
  }

  spawnCrawler(o) {
    const s = this.physics.add.sprite(o.x, o.y - 8, 'bug', 'c0').setScale(1 / RES).setDepth(12);
    s.body.setSize(18 * RES, 9 * RES).setOffset(3 * RES, 4.5 * RES);
    s.play('bug-walk');
    this.physics.add.collider(s, this.layer);
    const eyes = this.add.image(0, 0, 'oci_buba').setScale(1 / RES).setDepth(61).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55);
    this.crawlers.push({ id: o.id, s, eyes, dir: Math.random() < 0.5 ? -1 : 1, hp: 2, hurtT: 0, alive: true });
  }

  // ---------------- ledenice ----------------
  spawnIcicle(o) {
    const top = o.y - TILE;
    const s = this.add.image(o.x, top, 'ledenica').setOrigin(0.5, 0).setScale(1 / RES).setDepth(13);
    this.icicles.push({ x: o.x, top, y: top, vy: 0, s, state: 'hang', t: 0 });
  }

  updateIcicles(dt) {
    const st = this.st, p = this.player, g = this.L.grid;
    for (const ic of this.icicles) {
      if (ic.state === 'hang') {
        const below = p.y - ic.top;
        if (!st.hidden && !st.dead && Math.abs(p.x - ic.x) < 22 && below > 0 && below < 340) { ic.state = 'shake'; ic.t = 0.45; SFX.crack(Phaser.Math.Clamp((ic.x - p.x) / 200, -1, 1)); }
      } else if (ic.state === 'shake') {
        ic.t -= dt; ic.s.x = ic.x + (Math.random() - 0.5) * 1.4;
        if (ic.t <= 0) { ic.state = 'fall'; ic.vy = 0; ic.s.x = ic.x; }
      } else if (ic.state === 'fall') {
        ic.vy += 900 * dt; ic.y += ic.vy * dt;
        const tip = ic.y + 26;
        ic.s.y = ic.y;
        const hitP = !st.dead && !st.hidden && Math.abs(p.x - ic.x) < 9 && tip > p.body.y && ic.y < p.body.bottom;
        const row = g[Math.floor(tip / TILE)];
        const c = row && row[Math.floor(ic.x / TILE)];
        if (hitP || c === '#' || c === '-' || c === 'I' || c === 'B' || c === '=' || tip > this.worldH) {
          if (hitP && st.invul <= 0) this.hurt(Math.sign(p.x - ic.x) || 1);
          ic.state = 'gone'; ic.t = 3; ic.s.setVisible(false);
          this.iceBurst.emitParticleAt(ic.x, Math.min(tip, this.worldH), 12);
          SFX.shatter(Phaser.Math.Clamp(0.3 - Math.abs(p.x - ic.x) / 1500, 0.05, 0.3), Phaser.Math.Clamp((ic.x - p.x) / 300, -1, 1));
        }
      } else if (ic.state === 'gone') {
        ic.t -= dt;
        if (ic.t <= 0) { ic.state = 'hang'; ic.y = ic.top; ic.s.setPosition(ic.x, ic.top).setVisible(true).setAlpha(0); this.tweens.add({ targets: ic.s, alpha: 1, duration: 600 }); }
      }
    }
  }

  // ---------------- zid tame ----------------
  startWall(x, delay) {
    if (this.wall) return;
    this.wall = { x, delay, growlT: 0 };
    SFX.wallGrowl(); Buzz([200, 80, 200]);
    this.cameras.main.shake(800, 0.005);
  }

  updateWall(dt) {
    const W = this.wall;
    if (!W) return;
    const D = this.L.darkWall, p = this.player, st = this.st;
    if (W.delay > 0) W.delay -= dt;
    else W.x = Math.min(D.stopX, W.x + D.speed * dt);
    W.growlT -= dt;
    if (W.growlT <= 0) { W.growlT = 2.2; SFX.wallGrowl(); }
    // crtanje
    const v = this.cameras.main.worldView, g = this.wallG, t = this.time.now / 1000;
    g.clear();
    if (W.x > v.x - 60) {
      const top = v.y - 40, bot = v.bottom + 40;
      g.fillStyle(0x000000, 0.97);
      g.beginPath(); g.moveTo(v.x - 100, top);
      for (let y = top; y <= bot; y += 12) g.lineTo(W.x + Math.sin(y * 0.07 + t * 3) * 10 + Math.sin(y * 0.19 - t * 5) * 5, y);
      g.lineTo(v.x - 100, bot); g.closePath(); g.fillPath();
      g.lineStyle(2, 0x6a1a5a, 0.6);
      g.beginPath();
      for (let y = top; y <= bot; y += 12) { const x = W.x + Math.sin(y * 0.07 + t * 3) * 10 + Math.sin(y * 0.19 - t * 5) * 5; y === top ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.strokePath();
      for (let i = 0; i < 5; i++) {
        const y = top + ((i * 97 + t * 30) % (bot - top)), len = 14 + Math.sin(t * 2 + i) * 10;
        g.lineStyle(3, 0x000000, 0.95); g.beginPath(); g.moveTo(W.x, y); g.lineTo(W.x + len, y + Math.sin(t * 4 + i) * 6); g.strokePath();
      }
      this.wallEyes.forEach((e, i) => {
        const y = v.y + 20 + i * (v.height - 40) / 6;
        const blink = Math.sin(t * 1.3 + i * 1.7) > 0.93;
        e.setVisible(true).setPosition(W.x - 14 - (i % 3) * 18, y + Math.sin(t + i) * 6).setAlpha(blink ? 0.1 : 0.9);
      });
    } else this.wallEyes.forEach(e => e.setVisible(false));
    // blizina
    const gap = p.x - W.x;
    if (gap < 220 && !st.dead) this.cameras.main.shake(100, 0.0015 * (1 - gap / 220));
    if (!st.dead && gap < 6) { if (st.hidden) { st.hidden = null; p.setVisible(true); this.peek.setVisible(false); } this.die('monster'); }
  }

  // ---------------- pauci ----------------
  spawnSpider(o) {
    const top = o.y - TILE;
    let y = top + 4, len = 0;
    const g = this.L.grid, cx = Math.floor(o.x / TILE);
    for (let r = Math.floor(top / TILE); r < this.L.H; r++) { const c = g[r][cx]; if (c === '#' || c === '-' || c === '=' || c === 'D') break; len = (r + 1) * TILE - top; }
    len = Math.max(20, len - 18);
    const s = this.add.sprite(o.x, top + 8, 'pauk', 'p0').setScale(1 / RES).setDepth(13);
    s.play('pauk');
    const eyes = this.add.image(o.x, top + 6, 'oci_pauk').setScale(1 / RES).setDepth(61).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55);
    this.spiders.push({ id: o.id, x: o.x, top, y: top + 8, len, s, eyes, state: 'wait', t: 0, hp: 2, alive: true });
  }

  updateSpiders(dt) {
    const st = this.st, p = this.player;
    this.threads.clear();
    for (const sp of this.spiders) {
      if (!sp.alive) continue;
      const dx = p.x - sp.x, below = p.y - sp.top;
      sp.t = Math.max(0, sp.t - dt);
      if (sp.state === 'wait') {
        if (!st.hidden && !st.dead && sp.t <= 0 && Math.abs(dx) < 24 && below > 0 && below < sp.len + 40) { sp.state = 'drop'; SFX.hiss(Phaser.Math.Clamp(-dx / 200, -1, 1)); }
      } else if (sp.state === 'drop') {
        sp.y += 280 * dt;
        if (sp.y >= sp.top + sp.len) { sp.y = sp.top + sp.len; sp.state = 'bottom'; sp.t = 1.3; }
      } else if (sp.state === 'bottom') {
        if (sp.t <= 0) sp.state = 'climb';
      } else if (sp.state === 'climb') {
        sp.y -= 55 * dt;
        if (sp.y <= sp.top + 8) { sp.y = sp.top + 8; sp.state = 'wait'; sp.t = 2; }
      }
      sp.s.setPosition(sp.x, sp.y);
      sp.eyes.setPosition(sp.x, sp.y - 3);
      this.threads.lineStyle(0.6, 0xdde4f0, 0.55);
      this.threads.lineBetween(sp.x, sp.top, sp.x, sp.y - 5);
      if (!st.dead && !st.hidden && st.invul <= 0 && Math.abs(dx) < 10 && Math.abs(p.y - sp.y) < 16) { this.hurt(Math.sign(dx) || 1); sp.state = 'climb'; }
    }
  }

  hitSpider(sp) {
    sp.hp--; SFX.bugHit(); Buzz(20);
    sp.s.setTint(0xffffff); this.time.delayedCall(90, () => sp.alive && sp.s.clearTint());
    if (sp.state === 'wait' || sp.state === 'bottom') { sp.state = 'climb'; }
    if (sp.hp <= 0) {
      sp.alive = false; SFX.bugDie();
      this.burst.emitParticleAt(sp.x, sp.y, 14);
      sp.s.destroy(); sp.eyes.destroy();
    }
  }

  // ---------------- daske koje pucaju ----------------
  updateCrumbles(dt) {
    const p = this.player, b = p.body, ground = b.blocked.down;
    for (const c of this.crumbles) {
      const x0 = c.x * TILE, top = c.y * TILE;
      if (c.state === 'ok') {
        if (ground && Math.abs(this.feet(p) - top) < 3 && b.right > x0 && b.x < x0 + TILE) { c.state = 'shake'; c.t = 0.7; SFX.creak(); }
      } else if (c.state === 'shake') {
        c.t -= dt;
        c.s.x = x0 + (Math.random() - 0.5) * 1.6;
        if (c.t <= 0) {
          c.state = 'gone'; c.t = 4;
          this.layer.removeTileAt(c.x, c.y);
          SFX.crumble();
          this.tweens.add({ targets: c.s, y: top + 50, alpha: 0, angle: (Math.random() - 0.5) * 30, duration: 600 });
        }
      } else if (c.state === 'gone') {
        c.t -= dt;
        const over = b.right > x0 - 2 && b.x < x0 + TILE + 2 && b.bottom > top - 2 && b.y < top + TILE;
        if (c.t <= 0 && !over) {
          const t = this.layer.putTileAt(1, c.x, c.y);
          t.setCollision(false, false, true, false);
          c.state = 'ok';
          c.s.setPosition(x0, top).setAngle(0).setAlpha(0);
          this.tweens.add({ targets: c.s, alpha: 1, duration: 400 });
        }
      }
    }
  }

  // ---------------- šiljci ----------------
  checkSpikes() {
    const st = this.st, b = this.player.body, g = this.L.grid;
    if (st.hidden || Dev.is('god')) return;
    const cy = Math.floor((b.bottom - 3) / TILE);
    const row = g[cy]; if (!row) return;
    // pošteno: bode samo kad je sredina lika iznad šiljaka (s malo zalihe na rubovima)
    const px = this.player.x, cxs = [Math.floor(px / TILE)];
    for (const cx of cxs) {
      if (row[cx] !== '^') continue;
      const inCell = px - cx * TILE;
      if ((row[cx - 1] !== '^' && inCell < 4) || (row[cx + 1] !== '^' && inCell > TILE - 4)) continue;
      if (b.bottom - 3 < cy * TILE + 9) continue; // vrhovi šiljaka u donjem dijelu ćelije
      st.hp--; SFX.hurt(); Buzz(110);
      this.cameras.main.shake(180, 0.008);
      if (st.hp <= 0) { this.die('hp'); return; }
      st.invul = 1.3; st.lock = 0.3;
      const sp = st.safe || { x: this.L.start.x, y: this.L.start.y - 16 };
      this.player.body.setVelocity(0, 0);
      this.player.setPosition(sp.x, sp.y);
      this.cameras.main.flash(200, 120, 0, 0);
      return;
    }
  }

  spawnBat(o) {
    const y = o.y - 12;
    const s = this.add.sprite(o.x, y, 'bat', 'hang0').setScale(1 / RES).setDepth(13);
    s.play('bat-hang');
    const eyes = this.add.image(o.x, y, 'oci_bat').setScale(1 / RES).setDepth(61).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.bats.push({ id: o.id, s, eyes, x: o.x, y, rx: o.x, ry: y, state: 'sleep', t: 0, cd: 0, flapT: 0, alive: true, ph: Math.random() * 6 });
  }

  updateBat(bt, dt) {
    if (!bt.alive) return;
    const st = this.st, p = this.player;
    const dx = p.x - bt.x, dy = (p.y - 4) - bt.y, d = Math.hypot(dx, dy);
    const can = !st.hidden && !st.dead;
    bt.cd = Math.max(0, bt.cd - dt);
    if (bt.state === 'sleep') {
      if (can && bt.cd <= 0 && ((st.flash && d < 190) || d < 60)) this.wakeBat(bt);
    } else if (bt.state === 'swoop') {
      bt.t -= dt;
      if (!can || bt.t <= 0) bt.state = 'return';
      else {
        const sp = 92;
        bt.x += dx / (d || 1) * sp * dt;
        bt.y += dy / (d || 1) * sp * dt + Math.sin(this.time.now / 110 + bt.ph) * 40 * dt;
        if (d < 11 && st.invul <= 0) { this.hurt(Math.sign(dx) || 1); bt.state = 'return'; }
      }
    } else if (bt.state === 'return') {
      const rx = bt.rx - bt.x, ry = bt.ry - bt.y, rd = Math.hypot(rx, ry);
      if (rd < 3) { bt.state = 'sleep'; bt.x = bt.rx; bt.y = bt.ry; bt.cd = 2.5; bt.s.play('bat-hang'); }
      else { bt.x += rx / rd * 70 * dt; bt.y += ry / rd * 70 * dt; }
    }
    const awake = bt.state !== 'sleep';
    if (awake) {
      bt.flapT -= dt;
      if (bt.flapT <= 0) { bt.flapT = 0.22; SFX.flap(Phaser.Math.Clamp(0.07 - d / 4000, 0, 0.07), Phaser.Math.Clamp(-dx / 300, -1, 1)); }
    }
    bt.s.setPosition(bt.x, bt.y).setFlipX(awake && dx < 0);
    bt.eyes.setVisible(awake).setPosition(bt.x, bt.y - 1.8);
  }

  wakeBat(bt) {
    if (bt.state !== 'sleep') return;
    bt.state = 'swoop'; bt.t = 5; bt.s.play('bat-fly');
    SFX.batWake(Phaser.Math.Clamp((bt.x - this.player.x) / 300, -1, 1));
  }

  killBat(bt) {
    bt.alive = false; SFX.bugDie(); Buzz(20);
    this.burst.emitParticleAt(bt.x, bt.y, 12);
    bt.s.destroy(); bt.eyes.destroy();
  }

  buildWater() {
    const g = this.L.grid;
    this.waterRuns = [];
    for (let y = 0; y < this.L.H; y++) {
      let x0 = -1;
      for (let x = 0; x <= this.L.W; x++) {
        const w = x < this.L.W && g[y][x] === '~';
        if (w && x0 < 0) x0 = x;
        if (!w && x0 >= 0) { this.waterRuns.push({ x: x0 * TILE, y: y * TILE + 8, w: (x - x0) * TILE, h: TILE - 8 }); x0 = -1; }
      }
    }
    if (!this.waterRuns.length) return;
    const body = this.add.graphics().setDepth(16);
    this.waterRuns.forEach(r => {
      body.fillStyle(0x1d7f99, 0.42); body.fillRect(r.x, r.y, r.w, r.h);
      body.fillStyle(0x0b3a4a, 0.35); body.fillRect(r.x, r.y + r.h - 5, r.w, 5);
    });
    this.waterSurf = this.add.graphics().setDepth(16);
  }

  inWater(x, footY) {
    const cx = Math.floor(x / TILE), cy = Math.floor((footY - 6) / TILE);
    const row = this.L.grid[cy];
    return !!row && row[cx] === '~';
  }

  applyLightsOut(instant) {
    if (this.lightsOff) return;
    this.lightsOff = true;
    if (instant) { this.glowImgs.forEach(g => g.setVisible(false)); return; }
    SFX.lightsOut(); Buzz([120, 60, 120]);
    this.glowImgs.forEach((g, i) => this.tweens.add({ targets: g, alpha: 0, delay: (i % 12) * 60, duration: 500 }));
  }

  spawnMonster(m) {
    const s = this.physics.add.sprite(m.x, m.y - 40, 'tihi', 'walk0').setScale(1 / RES).setDepth(14);
    s.body.setSize(16 * RES, 56 * RES).setOffset(18 * RES, 23 * RES);
    s.body.setMaxVelocity(300, 600);
    this.physics.add.collider(s, this.layer);
    const eyes = this.add.image(0, 0, 'oci_tihi').setScale(1 / RES).setDepth(60).setBlendMode(Phaser.BlendModes.ADD);
    const M = { ...m, s, eyes, dir: -1, state: 'patrol', lastX: m.x, loseT: 0, searchT: 0, flipT: 0, stepT: 0, wakeT: 0, active: true };
    if (m.dormant) { M.active = false; s.setVisible(false); s.body.enable = false; eyes.setVisible(false); if (this.taken.has(m.dormant)) M.spent = true; }
    s.play('tihi-walk');
    return M;
  }

  // ---------------- pomoćne ----------------
  feet(s) { return s.body.y + s.body.height; }
  overlap(a, b, pad = 0) {
    const A = a.body, B = b.body;
    return A.x < B.x + B.width - pad && A.x + A.width > B.x + pad && A.y < B.y + B.height - pad && A.y + A.height > B.y + pad;
  }
  solidAt(x, y) {
    const t = this.layer.getTileAtWorldXY(x, y);
    return t && (t.index === 0 || t.index === 1 || t.index === 2);
  }

  // ---------------- glavna petlja ----------------
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const st = this.st, p = this.player, K = this.keys;
    const JD = Phaser.Input.Keyboard.JustDown;

    if (Controls.take('pause') || JD(K.ESC)) { this.ui.openPause(); return; }

    if (!st.dead) this.updatePlayer(dt, K, JD);
    this.monsters.forEach(m => this.updateMonster(m, dt));
    this.crawlers.forEach(c => this.updateCrawler(c, dt));
    this.bats.forEach(bt => this.updateBat(bt, dt));
    this.updateSpiders(dt);
    this.updateIcicles(dt);
    this.updateWall(dt);
    this.updateCrumbles(dt);
    if (!st.dead) this.checkSpikes();
    if (!st.dead) this.interactions(dt);
    this.updateFx(dt);
    this.drawDarkness(time);
    this.updateAudio(dt);

    this.registry.set('hud', { hp: st.hp, battery: st.battery, key: this.keyCount, flash: st.flash, hidden: !!st.hidden });
  }

  updatePlayer(dt, K, JD) {
    const st = this.st, p = this.player, b = p.body;
    const ground = b.blocked.down || b.touching.down;
    const left = Controls.left || K.A.isDown;
    const right = Controls.right || K.D.isDown;
    const jumpP = Controls.take('jump') | JD(K.W) | JD(K.I) | JD(K.SPACE);
    const jumpH = Controls.jumpHeld || K.W.isDown || K.I.isDown || K.SPACE.isDown;
    const atkP = Controls.take('attack') | JD(K.J);
    const flashP = Controls.take('flash') | JD(K.K);
    const ctxP = Controls.take('context') | JD(K.L);

    st.invul = Math.max(0, st.invul - dt);
    st.atkCd = Math.max(0, st.atkCd - dt);
    st.lock = Math.max(0, st.lock - dt);
    p.setAlpha(st.invul > 0 && !st.hidden ? (Math.floor(st.invul * 14) % 2 ? 0.35 : 1) : 1);

    // kontekstna radnja
    if (ctxP && this.ctxAction) this.ctxAction();

    if (st.hidden) {
      b.setVelocity(0, 0);
      if (jumpP || left || right) { /* ostani dok ne stisne "Izađi" */ }
      return;
    }

    // svjetiljka
    if (flashP) {
      if (st.battery > 0.5) { st.flash = !st.flash; SFX.click(); }
      else { this.ui.toast('Baterija je prazna.'); SFX.click(); }
    }
    if (st.flash) {
      if (!Dev.is('god')) st.battery = Math.max(0, st.battery - 3.4 * dt);
      if (st.battery <= 0) { st.flash = false; this.ui.toast('Baterija je prazna!'); }
    }

    // DEV: letenje kroz zidove
    if (Dev.is('fly')) {
      b.setAllowGravity(false); b.checkCollision.none = true;
      const up = Controls.up || K.W.isDown || K.I.isDown || K.SPACE.isDown, down = Controls.down || K.S.isDown;
      const sp = Dev.fast ? 600 : 240;
      const dx = (right ? 1 : 0) - (left ? 1 : 0), dy = (down ? 1 : 0) - (up ? 1 : 0);
      b.setVelocity(dx * sp, dy * sp);
      if (dx) st.face = dx;
      p.setFlipX(st.face < 0); p.anims.stop(); p.setFrame('fly0');
      return;
    } else if (!b.allowGravity) { b.setAllowGravity(true); b.checkCollision.none = false; }

    // kretanje
    let dir = (right ? 1 : 0) - (left ? 1 : 0);
    if (st.lock > 0) dir = 0;
    const wet = this.inWater(p.x, this.feet(p));
    if (wet && !st.wasWet && b.velocity.y > 60) { SFX.splash(0.25); this.noise(p.x, p.y, 160); }
    st.wasWet = wet;
    // ispod nogu: gljiva-trampolin ili led
    const gridR = this.L.grid[Math.floor((this.feet(p) + 2) / TILE)] || [];
    const underC = [gridR[Math.floor((b.x + 1) / TILE)], gridR[Math.floor(p.x / TILE)], gridR[Math.floor((b.right - 1) / TILE)]];
    if (ground && underC.includes('B') && b.velocity.y >= 0) {
      b.setVelocityY(-620); st.jumping = false; st.coyote = 0; st.airVy = 0;
      SFX.boing(); Buzz(25); this.noise(p.x, p.y, 140);
      this.dust.emitParticleAt(p.x, this.feet(p), 6);
    }
    const onIce = ground && underC[1] === 'I';
    const sneak = Controls.sneak || K.S.isDown;
    st.sneak = sneak && dir !== 0;
    const target = dir * (wet ? 66 : (sneak && ground) ? 58 : 118) * (Dev.is('fast') ? 2.5 : 1);
    if (st.lock <= 0) b.setVelocityX(Phaser.Math.Linear(b.velocity.x, target, Math.min(1, dt * (onIce ? 1.6 : ground ? 16 : 12))));
    if (dir !== 0 && st.atkT <= 0) st.face = dir;
    p.setFlipX(st.face < 0);

    // skok: coyote time + buffer
    st.coyote = ground ? 0.1 : Math.max(0, st.coyote - dt);
    st.buffer = jumpP ? 0.13 : Math.max(0, st.buffer - dt);
    if (st.buffer > 0 && st.coyote > 0) {
      b.setVelocityY(wet ? -300 : -345); st.buffer = 0; st.coyote = 0; st.jumping = true; wet ? SFX.splash(0.2) : SFX.jump();
    }
    if (st.jumping && !jumpH && b.velocity.y < -130) b.setVelocityY(-130);
    if (b.velocity.y >= 0) st.jumping = false;

    // zapamti sigurno tlo (za povratak nakon šiljaka)
    if (ground && !wet) {
      const g = this.L.grid, cx = Math.floor(p.x / TILE), fy = Math.floor((this.feet(p) + 4) / TILE);
      const under = g[fy] && g[fy][cx], row = g[fy - 1] || [];
      const solidish = (c) => c === '#' || c === '-';  // led i gljive nisu sigurno tlo
      const ur = g[fy] || [];
      if (solidish(under) && solidish(ur[cx - 1]) && solidish(ur[cx + 1]) && row[cx - 1] !== '^' && row[cx] !== '^' && row[cx + 1] !== '^') st.safe = { x: cx * TILE + TILE / 2, y: p.y };
    }
    // doskok
    if (ground && st.airVy > 260) { SFX.land(); this.dust.emitParticleAt(p.x, this.feet(p), 4); }
    st.airVy = ground ? 0 : Math.max(st.airVy, b.velocity.y);

    // koraci
    if (ground && Math.abs(b.velocity.x) > 40) {
      st.stepT -= dt;
      if (st.stepT <= 0) {
        if (wet) { st.stepT = 0.36; SFX.splash(); this.noise(p.x, p.y, 150); }
        else if (st.sneak) { st.stepT = 0.4; SFX.step(0.03); }
        else { st.stepT = 0.27; SFX.step(); this.noise(p.x, p.y, 115); }
      }
    } else st.stepT = 0.05;

    // udarac
    st.atkT = Math.max(0, st.atkT - dt);
    if (atkP && st.atkCd <= 0) {
      st.atkCd = 0.34; st.atkT = 0.16; SFX.slash();
      const hx = st.face > 0 ? p.x + 4 : p.x - 30, hy = p.y - 14;
      const hit = new Phaser.Geom.Rectangle(hx, hy, 26, 26);
      this.crawlers.forEach(c => {
        if (!c.alive) return;
        const r = new Phaser.Geom.Rectangle(c.s.body.x, c.s.body.y, c.s.body.width, c.s.body.height);
        if (Phaser.Geom.Intersects.RectangleToRectangle(hit, r)) this.hitCrawler(c, st.face);
      });
      this.bats.forEach(bt => { if (bt.alive && bt.state !== 'sleep' && hit.contains(bt.x, bt.y)) this.killBat(bt); });
      this.spiders.forEach(sp => { if (sp.alive && Phaser.Geom.Intersects.RectangleToRectangle(hit, new Phaser.Geom.Rectangle(sp.x - 8, sp.y - 8, 16, 16))) this.hitSpider(sp); });
      this.noise(p.x, p.y, 170);
    }
    this.slash.setVisible(st.atkT > 0);
    if (st.atkT > 0) {
      this.slash.setPosition(p.x + st.face * 14, p.y - 3).setFlipX(st.face < 0).setAlpha(st.atkT / 0.16);
    }

    // animacija
    let anim;
    if (st.atkT > 0) { p.anims.stop(); p.setFrame('attack'); }
    else if (!ground) { p.anims.stop(); p.setFrame(b.velocity.y < 0 ? 'jump' : 'fall'); }
    else if (Math.abs(b.velocity.x) > 25) anim = 'hero-run';
    else anim = 'hero-idle';
    if (anim && p.anims.currentAnim?.key !== anim) p.play(anim);
    else if (anim && !p.anims.isPlaying) p.play(anim);
  }

  noise(x, y, r) {
    this.bats.forEach(bt => { if (bt.alive && Math.hypot(bt.x - x, bt.y - y) < r * 0.6) this.wakeBat(bt); });
    this.monsters.forEach(m => {
      if (!m.active || this.st.hidden) return;
      if (Math.abs(m.s.x - x) < r && Math.abs(this.feet(m.s) - this.feet(this.player)) < 64 && m.state !== 'chase') this.startChase(m);
    });
  }

  startChase(m) {
    if (m.state !== 'chase') { SFX.sting(); Buzz([60, 40, 60]); }
    m.state = 'chase'; m.lastX = this.player.x; m.loseT = 0;
  }

  updateMonster(m, dt) {
    if (!m.active) {
      if (m.wakeT > 0) {
        m.wakeT -= dt;
        m.eyes.setVisible(true).setAlpha(Math.random() < 0.8 ? 1 : 0.2);
        m.eyes.setPosition(m.x + 8, m.y - 66);
        if (m.wakeT <= 0) {
          m.active = true; m.s.setVisible(true); m.s.body.enable = true; m.s.setPosition(m.x, m.y - 40);
          m.s.setAlpha(0); this.tweens.add({ targets: m.s, alpha: 1, duration: 500 });
          this.startChase(m);
        }
      }
      return;
    }
    const st = this.st, p = this.player, s = m.s, b = s.body;
    const dx = p.x - s.x, adx = Math.abs(dx);
    const same = Math.abs(this.feet(s) - this.feet(p)) < 62;
    const facing = Math.sign(dx) === m.dir;
    const visible = !st.hidden && !st.dead;
    const sees = visible && same && ((st.flash && adx < 270) || (facing && adx < 115) || adx < 55);
    m.sawT = (sees || (m.state === 'chase' && visible && same && adx < 380)) ? 0 : (m.sawT || 0) + dt;
    m.lungeCd = Math.max(0, (m.lungeCd || 0) - dt); m.lungeT = Math.max(0, (m.lungeT || 0) - dt);
    if (m.state === 'inspect') {
      if (!st.hidden) { this.startChase(m); }
      else {
        const tx = m.target.x;
        m.dir = tx > s.x ? 1 : -1;
        if (Math.abs(tx - s.x) < 16) {
          m.state = 'opening'; b.setVelocityX(0);
          this.tweens.add({ targets: m.target.s, x: m.target.x + 1.5, duration: 40, yoyo: true, repeat: 6 });
          SFX.door();
          this.time.delayedCall(500, () => { if (this.st.hidden) { this.st.hidden = null; p.setVisible(true); this.peek.setVisible(false); this.die('monster'); } });
        }
      }
    }
    if (m.state === 'opening') { b.setVelocityX(0); s.setFlipX(m.dir < 0); if (s.anims.currentAnim?.key !== 'tihi-idle') s.play('tihi-idle'); m.eyes.setPosition(s.x + (m.dir > 0 ? 9 : -9), s.y - 30); return; }

    if (m.state === 'patrol') {
      if (sees) this.startChase(m);
    } else if (m.state === 'chase') {
      if (visible && same && adx < 380) { m.lastX = p.x; m.loseT = 0; }
      else m.loseT += dt;
      if (Math.abs(m.lastX - s.x) < 10 && !(visible && same)) { m.state = 'search'; m.searchT = 4.5; m.flipT = 0.7; }
      if (m.loseT > 3.2) { m.state = 'search'; m.searchT = 4.5; m.flipT = 0.7; }
    } else if (m.state === 'search') {
      m.searchT -= dt; m.flipT -= dt;
      if (m.flipT <= 0) { m.dir *= -1; m.flipT = 0.9; }
      if (sees) this.startChase(m);
      else if (m.searchT <= 0) m.state = 'patrol';
    }

    let speed = 0;
    if (m.state === 'patrol') {
      speed = 42;
      if (s.x <= m.minX + 2) m.dir = 1;
      if (s.x >= m.maxX - 2) m.dir = -1;
      if (b.blocked.down && b.blocked.left && !this.monsterStep(m, -1)) m.dir = 1;
      if (b.blocked.down && b.blocked.right && !this.monsterStep(m, 1)) m.dir = -1;
    } else if (m.state === 'chase') {
      const tx = Phaser.Math.Clamp(m.lastX, m.cMin, m.cMax);
      m.dir = tx > s.x ? 1 : -1;
      if (same && adx < 90 && m.lungeCd <= 0 && visible) { m.lungeT = 0.5; m.lungeCd = 2.6; SFX.stomp(0.6, 0); }
      speed = Math.abs(tx - s.x) < 6 ? 0 : (m.lungeT > 0 ? 150 : 108);
    } else if (m.state === 'inspect') {
      speed = 100;
    }
    // ne izlazi iz svog područja
    const wide = m.state === 'chase' || m.state === 'inspect';
    const lo = wide ? m.cMin : m.minX, hi = wide ? m.cMax : m.maxX;
    if ((s.x <= lo && m.dir < 0) || (s.x >= hi && m.dir > 0)) speed = 0;
    // ne pada u prave rupe (plitka lokva nije rupa — kroz nju gazi)
    if (speed > 0 && b.blocked.down) {
      const ax = s.x + m.dir * 12, fy = this.feet(s) + 3;
      const ground = this.solidAt(ax, fy) || this.solidAt(ax, fy + TILE) || this.solidAt(ax, fy + TILE * 2);
      if (!ground) { speed = 0; if (m.state === 'patrol') m.dir *= -1; }
    }
    if (speed > 0 && wide && ((m.dir < 0 && b.blocked.left) || (m.dir > 0 && b.blocked.right))) this.monsterStep(m, m.dir);
    const mWet = this.inWater(s.x, this.feet(s));
    b.setVelocityX(m.dir * speed * (mWet ? 0.7 : 1));
    s.setFlipX(m.dir < 0);
    const anim = speed === 0 ? 'tihi-idle' : wide ? 'tihi-chase' : 'tihi-walk';
    if (s.anims.currentAnim?.key !== anim) s.play(anim);

    // oči iznad mraka
    const blink = m.state === 'search' && Math.sin(this.time.now / 90) > 0.85;
    m.eyes.setPosition(s.x + (m.dir > 0 ? 9 : -9), s.y - 30).setFlipX(m.dir < 0).setAlpha(blink ? 0.1 : 1);

    // koraci
    if (speed > 0) {
      m.stepT -= dt;
      if (m.stepT <= 0) {
        m.stepT = wide ? 0.3 : 0.6;
        const d = Math.hypot(dx, this.feet(s) - this.feet(p));
        const vol = Phaser.Math.Clamp(1 - d / 430, 0, 1) * 0.9;
        SFX.stomp(vol, Phaser.Math.Clamp(-dx / 300, -1, 1));
        if (mWet && vol > 0.05) SFX.splash(vol * 0.3);
      }
    }

    // ulovio te
    if (visible && (this.overlap(s, p, 3) || (m.state === 'chase' && same && adx < 30))) this.die('monster');
  }

  // prekorači rub visok jednu pločicu (npr. izlaz iz lokve)
  monsterStep(m, dir) {
    const b = m.s.body;
    if (!b.blocked.down) return false;
    const ax = dir > 0 ? b.right + 4 : b.x - 4, fy = this.feet(m.s);
    const ledge = this.solidAt(ax, fy - 10);
    const hard = (x, y) => { const t = this.layer.getTileAtWorldXY(x, y); return t && (t.index === 0 || t.index === 2); };
    const clear = !hard(ax, fy - 10 - TILE) && !hard(ax, fy - 10 - TILE * 2) && !hard(ax, fy - 10 - TILE * 3);
    if (ledge && clear) { b.setVelocityY(-250); return true; }
    return false;
  }

  updateCrawler(c, dt) {
    if (!c.alive) return;
    const s = c.s, b = s.body;
    c.hurtT = Math.max(0, c.hurtT - dt);
    if (c.hurtT <= 0) {
      const ahead = s.x + c.dir * 10, footY = b.y + b.height + 3;
      if (b.blocked.left) c.dir = 1; else if (b.blocked.right) c.dir = -1;
      else if (b.blocked.down && !this.solidAt(ahead, footY)) c.dir *= -1;
      b.setVelocityX(c.dir * 28);
      s.clearTint();
    }
    s.setFlipX(c.dir < 0);
    c.eyes.setPosition(s.x + c.dir * 6, s.y - 1.5);
    const st = this.st;
    if (!st.dead && !st.hidden && st.invul <= 0 && this.overlap(s, this.player, 2)) this.hurt(Math.sign(this.player.x - s.x) || 1);
  }

  hitCrawler(c, dir) {
    c.hp--; c.hurtT = 0.25;
    c.s.setTint(0xffffff);
    c.s.body.setVelocity(dir * 80, -90);
    SFX.bugHit(); Buzz(20);
    if (c.hp <= 0) {
      c.alive = false; SFX.bugDie();
      this.burst.emitParticleAt(c.s.x, c.s.y, 14);
      c.s.destroy(); c.eyes.destroy();
    }
  }

  hurt(dir) {
    if (Dev.is('god')) return;
    const st = this.st;
    st.hp--; st.invul = 1.3; st.lock = 0.25;
    this.player.body.setVelocity(dir * 170, -210);
    SFX.hurt(); Buzz(90);
    this.cameras.main.shake(150, 0.006);
    if (st.hp <= 0) this.die('hp');
  }

  die(reason) {
    if (Dev.is('god')) return;
    const st = this.st;
    if (st.dead) return;
    st.dead = true; st.flash = false;
    this.player.body.setVelocity(0, 0); this.player.body.enable = false;
    if (reason === 'monster') {
      Buzz([200, 60, 350]);
      SFX.scream();
      this.ui.jumpscare(() => this.scene.restart());
    } else {
      Buzz([120, 80, 200]);
      this.tweens.add({ targets: this.player, alpha: 0, angle: st.face * 80, duration: 700 });
      this.cameras.main.fadeOut(1100, 0, 0, 0);
      this.time.delayedCall(1200, () => this.scene.restart());
    }
  }

  // ---------------- interakcije ----------------
  interactions(dt) {
    const st = this.st, p = this.player;
    const pf = this.feet(p);
    this.ctxAction = null;
    let label = '';

    if (st.hidden) {
      label = 'Izađi';
      this.ctxAction = () => this.unhide();
    } else {
      // ormari
      const cab = this.cabinets.find(c => Math.abs(c.x - p.x) < 15 && Math.abs(c.y - pf) < 8);
      if (cab) { label = 'Sakrij se'; this.ctxAction = () => this.hide(cab); }
      // bilješke
      const note = this.notes.find(n => Math.abs(n.x - p.x) < 16 && Math.abs(n.y - pf) < 10);
      if (note && !cab) { label = 'Pročitaj'; this.ctxAction = () => { SFX.page(); this.ui.showNote(this.L.notes[note.id]); }; }
      // vrata
      for (const D of this.doors) {
        if (D.open) continue;
        const near = Math.abs(p.x - (D.x + 24)) < 62 && pf > D.y && pf <= D.y + 97;
        if (near && this.keyCount > 0) { label = 'Otključaj'; this.ctxAction = () => this.openDoor(D, false); }
        else if (near && !D.msg) { D.msg = true; this.ui.toast('Zaključano. Treba ti ključ.'); }
        else if (!near) D.msg = false;
      }
    }
    this.registry.set('context', label);
    if (st.hidden) return;

    // predmeti
    for (const it of this.items) {
      if (it.done) continue;
      if (Math.abs(it.x - p.x) < 14 && Math.abs(it.baseY - (p.y - 2)) < 20) {
        it.done = true; this.taken.add(it.id);
        this.tweens.add({ targets: [it.s, it.glow], alpha: 0, y: it.baseY - 14, duration: 350, onComplete: () => { it.s.destroy(); it.glow.destroy(); } });
        if (it.type === 'battery') { st.battery = Math.min(100, st.battery + 35); SFX.pickup(); this.ui.toast('+ baterija'); }
        else { this.keyCount++; SFX.key(); this.ui.toast('Uzeo si stari ključ…', 2000); this.wakeTheSleeper(it.id); }
      }
    }

    // checkpoint
    const cp = this.checkpoints.find(c => Math.abs(c.x - p.x) < 16 && Math.abs(c.y - pf) < 10);
    if (cp && st.insideCp !== cp.id) {
      st.insideCp = cp.id;
      this.checkpoints.forEach(c => c.s.setFrame(c === cp ? 'on' : 'off'));
      st.hp = 3; st.battery = 100;
      this.save = { level: this.levelIndex, cp: cp.id, doorsOpen: [...this.doorsOpen], taken: [...this.taken] };
      Save.store(this.save);
      SFX.save(); Buzz(30);
      this.ui.toast('Sigurno mjesto. Igra je spremljena.', 2200);
    } else if (!cp) st.insideCp = null;

    // izlaz
    if (this.exit && Math.abs(this.exit.x - p.x) < 14 && Math.abs(this.exit.y - pf) < 10) {
      this.st.dead = true;
      this.exit = null;
      SFX.win();
      const next = this.levelIndex + 1;
      if (next >= Level.count) this.cameras.main.fadeOut(1400, 0, 0, 0); else this.cameras.main.fadeOut(1400, 230, 245, 255);
      this.time.delayedCall(1500, () => {
        if (next >= Level.count) { Progress.finish(); Save.store({ ...Save.fresh(next - 1), done: true }); this.scene.stop('UI'); this.scene.start('End'); }
        else { Save.store(Save.fresh(next)); this.scene.restart(); }
      });
    }
  }

  hide(cab) {
    const st = this.st, p = this.player;
    // ako te vidi izbliza dok se skrivaš — kasno je
    const watchers = this.monsters.filter(m => m.active && m.state === 'chase' && m.sawT < 0.7 && Math.abs(m.s.x - p.x) < 210 && Math.abs(this.feet(m.s) - this.feet(p)) < 62);
    st.hidden = cab; st.flash = false;
    p.setVisible(false); p.body.setVelocity(0, 0); p.x = cab.x;
    this.peek.setPosition(cab.x, cab.y - 30).setVisible(true);
    this.tweens.add({ targets: cab.s, x: cab.x + 0.6, duration: 50, yoyo: true, repeat: 3 });
    SFX.door();
    watchers.forEach(m => { m.state = 'inspect'; m.target = cab; });
  }

  unhide() {
    const st = this.st;
    st.hidden = null;
    this.player.setVisible(true);
    this.peek.setVisible(false);
    SFX.click();
  }

  openDoor(D, instant) {
    D.open = true; this.doorsOpen.add(D.id);
    for (let y = D.ty; y < D.ty + D.h; y++) for (let x = D.tx; x < D.tx + D.w; x++) this.layer.removeTileAt(x, y);
    if (instant) { D.s.setVisible(false); return; }
    this.keyCount--;
    SFX.door(); Buzz(80);
    this.cameras.main.shake(400, 0.004);
    this.tweens.add({ targets: D.s, y: D.y - 90, alpha: 0, duration: 1400, ease: 'Sine.easeIn' });
    this.ui.toast('Vrata su se otvorila.', 1800);
  }

  wakeTheSleeper(keyId) {
    if (this.L.darkWall && this.L.darkWall.key === keyId) this.time.delayedCall(700, () => { this.ui.toast('Tama se pomaknula…', 2200); this.startWall(this.player.x - 300, 1.6); });
    const lo = this.L.lightsOutKey === keyId;
    if (lo) this.time.delayedCall(500, () => { this.applyLightsOut(false); this.ui.toast('Sve su se svijeće ugasile…', 2200); });
    const ms = this.monsters.filter(x => x.dormant === keyId && !x.spent);
    if (!ms.length) return;
    ms.forEach(m => { m.spent = true; });
    this.time.delayedCall(lo ? 1800 : 900, () => {
      SFX.rumble(); Buzz([300, 100, 300]);
      this.cameras.main.shake(1200, 0.006);
      if (!lo) this.ui.toast('Nešto se probudilo u zidu…', 2400);
      ms.forEach(m => { m.wakeT = 1.4; });
    });
  }

  // ---------------- efekti ----------------
  updateFx(dt) {
    const cam = this.cameras.main, v = cam.worldView;
    // parallax
    this.bgFar.tilePositionX = v.x * 0.15 / this.bgFar.tileScaleX;
    this.bgMid.tilePositionX = v.x * 0.35 / this.bgMid.tileScaleX;
    this.bgFar.tilePositionY = 0; this.bgMid.tilePositionY = 0;
    // čestice
    if (Math.random() < 0.35) this.dust.emitParticleAt(this.player.x + (Math.random() - 0.5) * 160, this.player.y + (Math.random() - 0.5) * 90, 1);
    if (Math.random() < 0.12) this.spores.emitParticleAt(v.x + Math.random() * v.width, v.y + v.height * (0.4 + Math.random() * 0.6), 1);
    // predmeti lebde
    const t = this.time.now / 1000;
    this.items.forEach(it => { if (!it.done) { const y = it.baseY + Math.sin(t * 2 + it.x) * 1.5; it.s.y = y; it.glow.y = y; it.glow.setAlpha(0.35 + Math.sin(t * 3 + it.x) * 0.15); } });
    // površina vode
    if (this.waterSurf) {
      const ws = this.waterSurf; ws.clear();
      this.waterRuns.forEach(r => {
        if (r.x > v.right || r.x + r.w < v.x || r.y > v.bottom || r.y < v.y - 20) return;
        ws.fillStyle(0xa8f4ff, 0.55); ws.fillRect(r.x, r.y - 0.5, r.w, 1);
        for (let x = r.x + 4; x < r.x + r.w - 4; x += 9) {
          const o = Math.sin(t * 2.2 + x * 0.21) * 2;
          ws.fillStyle(0xd8fcff, 0.35 + Math.sin(t * 3 + x) * 0.2); ws.fillRect(x + o, r.y + 1.5, 4, 0.8);
        }
      });
    }
    // junak sakriven — oči u ormaru trepću
    if (this.st.hidden) this.peek.setAlpha(Math.sin(t * 1.7) > 0.93 ? 0 : 0.8);
  }

  drawDarkness(time) {
    const noDark = Dev.is('bright') || Dev.is('zoom');
    this.dark.setVisible(!noDark);
    if (noDark) return;
    const v = this.cameras.main.worldView, DS = this.DS;
    const ox = v.x - 40, oy = v.y - 40;
    this.dark.setPosition(ox, oy);
    const tex = this.darkTex, c = tex.getContext();
    const cw = tex.width, ch = tex.height;
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.clearRect(0, 0, cw, ch);
    c.fillStyle = this.T.dark + (this.lightsOff ? Math.min(0.97, this.T.darkA + 0.02) : this.T.darkA) + ')';
    c.fillRect(0, 0, cw, ch);
    c.globalCompositeOperation = 'destination-out';
    const L = (x, y, r, a = 1) => {
      if (x < v.x - r - 40 || x > v.right + r + 40 || y < v.y - r - 40 || y > v.bottom + r + 40) return;
      c.globalAlpha = a;
      c.drawImage(this.lightImg, (x - r - ox) / DS, (y - r - oy) / DS, 2 * r / DS, 2 * r / DS);
    };
    const st = this.st, p = this.player;
    if (!st.dead) {
      if (st.hidden) L(st.hidden.x, st.hidden.y - 24, 34, 0.6);
      else {
        L(p.x, p.y, st.flash ? 78 : 58, st.flash ? 1 : 0.85);
        if (st.flash) {
          const flick = st.battery < 18 ? (Math.random() < 0.18 ? 0.2 : 0.85) : 1;
          const w = 256 * 0.95 / DS, h = 180 * 0.85 / DS;
          const x = (p.x + st.face * 5 - ox) / DS, y = (p.y - 3 - oy) / DS - h / 2;
          c.globalAlpha = flick;
          c.drawImage(st.face > 0 ? this.coneImg.R : this.coneImg.L, st.face > 0 ? x : x - w, y, w, h);
        }
      }
    }
    this.checkpoints.forEach(cp => { const on = cp.s.frame.name === 'on'; L(cp.x, cp.y - 34, on ? 95 : 30, on ? 1 : 0.4); });
    if (this.exit) L(this.exit.x, this.exit.y - 18, 85, 1);
    this.items.forEach(it => { if (!it.done && it.type === 'key') L(it.x, it.baseY, 26, 0.7); });
    if (!this.lightsOff) this.mushGlows.forEach(m => L(m.x, m.y, 18, 0.45));
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    tex.refresh();
  }

  updateAudio(dt) {
    const p = this.player, st = this.st;
    // kapanje
    this.dripT -= dt;
    if (this.dripT <= 0) {
      const [a, b] = this.T.drip;
      this.dripT = a + Math.random() * b;
      if (this.T.id === 'kosturnica' && Math.random() < 0.25) SFX.bell();
      else if (this.T.id === 'gnijezdo' && Math.random() < 0.45) SFX.heart(0.14);
      else SFX.drip(Math.random() * 2 - 1);
    }
    // srce i napetost
    let near = 9999, chasing = false;
    this.monsters.forEach(m => {
      if (!m.active) return;
      const d = Math.hypot(m.s.x - p.x, (this.feet(m.s) - this.feet(p)) * 1.6);
      if (d < near) near = d;
      if (m.state === 'chase') chasing = true;
    });
    if (this.wall) { near = Math.min(near, Math.max(0, this.player.x - this.wall.x)); chasing = true; }
    const close = Phaser.Math.Clamp(1 - near / 320, 0, 1);
    SFX.tension(chasing ? Math.max(close, 0.6) : close * 0.7);
    if ((close > 0.05 || chasing) && !st.dead) {
      this.heartT -= dt;
      if (this.heartT <= 0) {
        const k = chasing ? Math.max(close, 0.5) : close;
        this.heartT = Phaser.Math.Linear(1.1, 0.38, k);
        SFX.heart(0.12 + k * 0.3);
        if (k > 0.45) Buzz(25);
      }
    }
  }
}
