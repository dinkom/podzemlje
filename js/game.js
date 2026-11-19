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
    const done = !!(p.done || sv.done);
    return { max: Math.max(p.max || 0, sv.level || 0), done, worldsDone: Math.max(p.worldsDone || 0, done ? 1 : 0) };
  },
  store(p) { try { localStorage.setItem(PROG_KEY, JSON.stringify(p)); } catch (e) {} },
  unlock(i) { const p = this.load(); if (i > p.max) { p.max = i; this.store(p); } },
  finish() { const p = this.load(); p.done = true; p.max = Math.max(p.max, Level.count - 1); this.store(p); },
  worldDone(w) { const p = this.load(); p.worldsDone = Math.max(p.worldsDone, w + 1); if (w === 0) p.done = true; this.store(p); },
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
    this.moon = T.moon ? this.add.image(0, 0, 'mjesec').setScrollFactor(0).setDepth(0.5).setTint(T.moonTint || (T.id === 'paukova' ? 0xffc8c8 : 0xffffff)) : null;

    // razina
    this.mushGlows = Level.addVisuals(this, L);
    this.layer = Level.addCollision(this, L);

    // predmeti
    this.items = []; this.cabinets = []; this.notes = []; this.checkpoints = []; this.crawlers = []; this.bats = []; this.spiders = []; this.icicles = [];
    this.wisps = []; this.huks = []; this.forest = !!T.forest;
    this.exit = null; this.pendingExit = null; this.wall = null;
    this.threads = this.add.graphics().setDepth(12);
    for (const o of L.objects) {
      if (o.type === 'cabinet') {
        const s = this.add.image(o.x, o.y + (T.hideTex ? 2 : 0), T.hideTex || 'ormar').setOrigin(0.5, 1).setScale(1 / RES).setDepth(T.hideTex ? 16 : 9);
        this.cabinets.push({ ...o, s, peekY: T.hideTex ? 14 : 30 });
      } else if (o.type === 'checkpoint') {
        const s = this.add.image(o.x, o.y + 1, 'lamp', 'off').setOrigin(0.5, 1).setScale(1 / RES).setDepth(9);
        this.checkpoints.push({ ...o, s });
      } else if (o.type === 'note') {
        const s = this.add.image(o.x, o.y - 18, 'biljeska').setScale(1 / RES).setDepth(9);
        this.notes.push({ ...o, s });
      } else if (o.type === 'battery' || o.type === 'key') {
        if (taken.has(o.id) && !o.respawn) continue;
        const fly = o.type === 'battery' && this.forest;
        const s = this.add.image(o.x, o.y - 7, o.type === 'key' ? 'kljuc' : fly ? 'krijesnica' : 'baterija').setScale(1 / RES).setDepth(fly ? 62 : 11);
        const glow = this.add.image(o.x, o.y - 7, 'glow').setScale(o.type === 'key' ? 0.9 : 0.55).setDepth(61)
          .setTint(o.type === 'key' ? 0xffd25a : fly ? 0xd8ff7a : 0x6ee09a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
        this.items.push({ ...o, s, glow, baseY: o.y - 7 });
      } else if (o.type === 'exit' && L.boss) {
        this.pendingExit = o;
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
      } else if (o.type === 'wisp') {
        this.spawnWisp(o);
      } else if (o.type === 'hukCameo') {
        if (!taken.has(o.id)) this.spawnHuk({ id: o.id, perches: [o], x1: o.x - 400, x2: o.x + 400, cameo: true });
      }
    }
    // vrata
    this.doors = L.doors.map(D => ({ ...D, open: false, msg: false, s: this.add.image(D.x, D.y, L.doorTex || 'vrata').setOrigin(0).setScale(1 / RES).setDepth(8) }));
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

    // voda, blato, mreže
    this.buildWater();
    this.buildMud();
    this.webs = [];
    L.grid.forEach((row, y) => row.forEach((ch, x) => {
      if (ch === 'W') this.webs.push({ x, y, cut: false, s: this.add.image(x * TILE, y * TILE, 'mreza').setOrigin(0).setScale(1 / RES).setDepth(17).setAlpha(0.85) });
    }));
    (L.huks || []).forEach(h => this.spawnHuk(h));
    if (L.boss) { this.spawnHuk({ id: 'BOSS', perches: L.boss.perches, x1: L.boss.x1, x2: L.boss.x2 }); const bh = this.huks[this.huks.length - 1]; bh.boss = true; bh.state = 'idle'; bh.hp = 3; bh.phase = 0; }
    this.buildWind();

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
      for (let i = 0; i < 7; i++) this.wallEyes.push(this.add.image(0, 0, L.darkWall.style === 'spider' ? 'oci_pauk' : 'oci_tihi').setScale(1 / RES).setDepth(56).setBlendMode(Phaser.BlendModes.ADD).setVisible(false));
      if (taken.has(L.darkWall.key)) this.startWall(this.player.x - 340, 2);
    }
    this.iceBurst = this.add.particles(0, 0, 'dot', { lifespan: 500, speed: { min: 40, max: 120 }, scale: { start: 0.5, end: 0 }, gravityY: 400, tint: [0xe8f8ff, 0xa6d8f2], emitting: false }).setDepth(16);
    const wz = Level.worlds[L.world].zones.indexOf(this.levelIndex) + 1;
    if (!this.save.cp) this.ui.zoneCard(wz, L.name);
    if (!this.save.cp && L.intro) this.time.delayedCall(3600, () => this.ui.toast(L.intro, 4500));
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
    if (this.moon) this.moon.setPosition(ox + vw * 0.74, oy + vh * 0.2).setScale(vh / 270 * 1.1 / RES);
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
    if (W.growlT <= 0) { W.growlT = D.style === 'spider' ? 1.1 : 2.2; D.style === 'spider' ? SFX.chitter(0.35) : SFX.wallGrowl(); }
    // crtanje
    const v = this.cameras.main.worldView, g = this.wallG, t = this.time.now / 1000;
    g.clear();
    if (D.style === 'spider') { if (W.x > v.x - 140) this.drawGiantSpider(W.x, D.y, t); else this.wallEyes.forEach(e => e.setVisible(false)); }
    else if (W.x > v.x - 60) {
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
    const sk = m.skin || 'tihi';
    const s = this.physics.add.sprite(m.x, m.y - 40, sk, 'walk0').setScale(1 / RES).setDepth(14);
    s.body.setSize(16 * RES, 56 * RES).setOffset(36 * RES, 23 * RES);
    s.body.setMaxVelocity(300, 600);
    this.physics.add.collider(s, this.layer);
    const eyes = this.add.image(0, 0, 'oci_tihi').setScale(1 / RES).setDepth(60).setBlendMode(Phaser.BlendModes.ADD);
    if (m.skin) eyes.setTint(0xff3a20);
    const M = { ...m, sk, s, eyes, dir: -1, state: 'patrol', lastX: m.x, loseT: 0, searchT: 0, flipT: 0, stepT: 0, wakeT: 0, active: true };
    if (m.dormant) { M.active = false; s.setVisible(false); s.body.enable = false; eyes.setVisible(false); if (this.taken.has(m.dormant)) M.spent = true; }
    s.play(sk + '-walk');
    return M;
  }

  // ---------------- blato (Šuma) ----------------
  buildMud() {
    const g = this.L.grid;
    this.mudRuns = [];
    for (let y = 0; y < this.L.H; y++) {
      let x0 = -1;
      for (let x = 0; x <= this.L.W; x++) {
        const m = x < this.L.W && g[y][x] === 'U';
        if (m && x0 < 0) x0 = x;
        if (!m && x0 >= 0) { this.mudRuns.push({ x: x0 * TILE, y: y * TILE, w: (x - x0) * TILE, top: !g[y - 1] || g[y - 1][x0] !== 'U' }); x0 = -1; }
      }
    }
    if (!this.mudRuns.length) return;
    const body = this.add.graphics().setDepth(16);
    this.mudRuns.forEach(r => {
      body.fillStyle(0x2a1f10, 0.96); body.fillRect(r.x, r.y + (r.top ? 3 : 0), r.w, TILE - (r.top ? 3 : 0));
      if (r.top) { body.fillStyle(0x4a3a1e, 1); body.fillRect(r.x, r.y + 3, r.w, 2); }
    });
    this.mudG = this.add.graphics().setDepth(16);
    this.bubbles = [];
  }

  // koliko je točka (stopala) duboko u blatu; -1 ako nije u blatu
  mudDepth(x, footY) {
    const g = this.L.grid, cx = Math.floor(x / TILE);
    let cy = Math.floor((footY - 1) / TILE);
    if (!g[cy] || g[cy][cx] !== 'U') return -1;
    while (g[cy - 1] && g[cy - 1][cx] === 'U') cy--;
    return footY - (cy * TILE + 3);
  }

  drawMud(t, v) {
    const g = this.mudG; g.clear();
    this.mudRuns.forEach(r => {
      if (!r.top || r.x > v.right || r.x + r.w < v.x || r.y > v.bottom || r.y < v.y - 20) return;
      for (let x = r.x + 5; x < r.x + r.w - 3; x += 11) {
        const ph = (t * 0.6 + x * 0.37) % 1;
        if (ph < 0.25) { g.fillStyle(0x6a5a32, 0.8); g.fillCircle(x + Math.sin(x) * 3, r.y + 4, 1 + ph * 6); }
      }
    });
  }

  sink() {
    const st = this.st;
    st.hp--; SFX.squelch(0.4); SFX.hurt(); Buzz(110);
    this.cameras.main.shake(180, 0.006);
    if (st.hp <= 0) { this.die('hp'); return; }
    st.invul = 1.3; st.lock = 0.3; st.inMud = false;
    const sp = st.safe || { x: this.L.start.x, y: this.L.start.y - 16 };
    this.player.body.setVelocity(0, 0);
    this.player.setPosition(sp.x, sp.y);
    this.cameras.main.flash(200, 60, 40, 0);
    this.ui.toast('Blato te povuklo…', 1600);
  }

  // ---------------- paukove mreže ----------------
  webAt(b) {
    if (!this.webs.length) return null;
    const x0 = Math.floor((b.x + 3) / TILE), x1 = Math.floor((b.right - 3) / TILE), y0 = Math.floor((b.y + 3) / TILE), y1 = Math.floor((b.bottom - 3) / TILE);
    return this.webs.find(w => !w.cut && w.x >= x0 && w.x <= x1 && w.y >= y0 && w.y <= y1) || null;
  }

  cutWeb(w) {
    if (w.cut) return;
    // presijeci cijeli stupac mreže
    this.webs.filter(o => !o.cut && o.x === w.x && Math.abs(o.y - w.y) <= 3).forEach(o => {
      o.cut = true;
      this.tweens.add({ targets: o.s, alpha: 0, y: o.s.y + 8, duration: 400, onComplete: () => o.s.destroy() });
      this.dust.emitParticleAt(o.x * TILE + 12, o.y * TILE + 12, 4);
    });
    SFX.rustle(0.18);
  }

  // ---------------- bludna svjetla ----------------
  spawnWisp(o) {
    const x = o.x, y = o.y - 12;
    const glow = this.add.image(x, y, 'glow').setScale(0.5).setTint(0x9ff0d0).setBlendMode(Phaser.BlendModes.ADD).setDepth(61).setAlpha(0.8);
    const core = this.add.image(x, y, 'dot').setScale(0.7).setTint(0xeafff6).setBlendMode(Phaser.BlendModes.ADD).setDepth(62);
    this.wisps.push({ hx: x, hy: y, x, y, state: 'live', t: 0, glow, core, ph: Math.random() * 6 });
  }

  updateWisp(w, dt) {
    const st = this.st, p = this.player, t = this.time.now / 1000;
    if (w.state === 'gone') {
      w.t -= dt;
      if (w.t <= 0) { w.state = 'live'; w.x = w.hx; w.y = w.hy; this.tweens.add({ targets: [w.glow, w.core], alpha: { from: 0, to: 0.8 }, duration: 900 }); }
      return;
    }
    const dx = p.x - w.x, dy = (p.y - 6) - w.y, d = Math.hypot(dx, dy);
    if (!st.hidden && !st.dead && d < 200) { w.x += dx / d * 46 * dt; w.y += dy / d * 46 * dt; }
    else { const hx = w.hx - w.x, hy = w.hy - w.y, hd = Math.hypot(hx, hy); if (hd > 1) { w.x += hx / hd * 22 * dt; w.y += hy / hd * 22 * dt; } }
    const bx = w.x + Math.sin(t * 1.3 + w.ph) * 4, by = w.y + Math.sin(t * 2.1 + w.ph) * 3;
    w.glow.setPosition(bx, by).setScale(0.45 + Math.sin(t * 5 + w.ph) * 0.06);
    w.core.setPosition(bx, by);
    if (!st.dead && !st.hidden && d < 11) this.popWisp(w, true);
  }

  popWisp(w, bad) {
    w.state = 'gone'; w.t = 7;
    this.tweens.add({ targets: [w.glow, w.core], alpha: 0, duration: 300 });
    this.burst.emitParticleAt(w.x, w.y, 8);
    if (!bad) { SFX.bugDie(); return; }
    const st = this.st;
    if (!Dev.is('god')) st.battery = Math.max(0, st.battery - 35);
    if (st.battery <= 0) st.flash = false;
    SFX.wispZap(); Buzz([60, 40, 120]);
    this.cameras.main.flash(250, 120, 255, 220);
    this.ui.toast('Svjetlo ti je popilo svjetiljku…', 2000);
    this.huks.forEach(h => { if (!h.cameo && !h.boss && this.player.x > h.x1 - 60 && this.player.x < h.x2 + 60 && this.hukLOS(h)) this.hukTelegraph(h); });
  }

  // ---------------- HUK ----------------
  spawnHuk(def) {
    const hs = 0.8, P = def.perches[0];
    const body = this.add.sprite(P.x, P.y, 'huk', 'stand0').setOrigin(0.5, 1).setScale(hs / RES).setDepth(14);
    const head = this.add.image(P.x, P.y, 'huk_glava', 'front').setScale(hs / RES).setDepth(14.5);
    const eyes = this.add.image(P.x, P.y, 'oci_huk').setScale(hs / RES).setDepth(60).setBlendMode(Phaser.BlendModes.ADD);
    const h = {
      id: def.id, perches: def.perches, x1: def.x1, x2: def.x2, cameo: !!def.cameo,
      x: P.x, y: P.y, hs, body, headS: head, eyes, alive: true, dir: -1,
      state: def.cameo ? 'cameo' : 'perch', head: 'front', headTo: 'front', turnT: 0, lookT: 2 + Math.random() * 2,
      t: 0, vx: 0, vy: 0, flapT: 0, walk: false,
    };
    this.huks.push(h);
    this.drawHuk(h);
    if (def.dormant && !this.taken.has(def.dormant)) { h.dormant = def.dormant; h.alive = false; [body, head, eyes].forEach(o => o.setVisible(false)); }
  }

  // Huk se vraća (kad uzmeš ključ)
  wakeHuk(h) {
    const v = this.cameras.main.worldView;
    h.dormant = null; h.alive = true;
    h.x = Phaser.Math.Clamp(this.player.x + 260, h.x1, h.x2); h.y = v.y - 80;
    h.state = 'return'; h.home = null; h.head = 'front'; h.headTo = 'front'; h.turnT = 0;
    [h.body, h.headS, h.eyes].forEach(o => o.setVisible(true));
    SFX.screech(); SFX.hoot(0.6); Buzz([120, 60, 120]);
    this.cameras.main.shake(500, 0.004);
    this.ui.toast('Huk se vratio…', 2400);
  }

  hukTurnHead(h, to) {
    if (h.head === to && h.headTo === to) return;
    h.headTo = to; h.turnT = 0.24;
    if (Math.hypot(h.x - this.player.x, h.y - this.player.y) < 420) SFX.creak();
  }

  hukGroundY(x, fromY, solidOnly = false) {
    const g = this.L.grid, cx = Math.floor(x / TILE);
    for (let cy = Math.max(0, Math.floor(fromY / TILE)); cy < this.L.H; cy++) {
      const c = g[cy] && g[cy][cx];
      if (c === '#' || c === 'D' || c === 'B' || c === 'I' || (!solidOnly && (c === '-' || c === '=')) || c === 'U') return cy * TILE + (c === 'U' ? 3 : 0);
    }
    return null;
  }

  hukHear(h, x, y, r) {
    if (!h.alive || h.cameo || h.boss || r <= 0 || this.st.hidden || this.st.dead) return;
    if (h.state !== 'perch' && h.state !== 'ground') return;
    if (x < h.x1 - 60 || x > h.x2 + 60) return;
    if (Math.hypot(x - h.x, y - (h.y - 40 * h.hs)) < r && this.hukLOS(h)) this.hukTelegraph(h);
  }

  hukTelegraph(h) {
    if (!h.alive || h.cameo || h.boss || h.state === 'telegraph' || h.state === 'swoop') return;
    h.state = 'telegraph'; h.t = h.head === 'front' ? 0.6 : 0.85;
    this.hukTurnHead(h, 'front');
    h.tx = this.player.x; h.ty = this.player.y;
    h.dir = h.tx > h.x ? 1 : -1;
    SFX.hoot(); SFX.sting(); Buzz([60, 40, 60]);
  }

  updateHuk(h, dt) {
    if (!h.alive) return;
    const st = this.st, p = this.player;
    if (h.turnT > 0) { h.turnT -= dt; if (h.turnT <= 0.12 && h.head !== h.headTo) { h.head = h.headTo; h.headS.setFrame(h.head); } }
    const visible = !st.hidden && !st.dead;
    const dx = p.x - h.x, dy = (p.y - 4) - (h.y - 40 * h.hs), d = Math.hypot(dx, dy);
    const inArea = p.x > h.x1 - 60 && p.x < h.x2 + 60;
    const looking = h.head === 'front' && h.turnT <= 0;
    const moving = Math.abs(p.body.velocity.x) > 40 || Math.abs(p.body.velocity.y) > 80;
    const los = this.hukLOS(h);
    const sees = visible && inArea && looking && los && (d < 130 || (st.flash && d < 340) || (moving && !st.sneak && d < 340) || (st.gliding && d < 400));
    // kandže + donji dio tijela
    const talons = () => { if (!visible || Dev.is('god')) return false; const ry = p.y - (h.y - 20 * h.hs); return Math.abs(p.x - h.x) < 17 && ry > -28 && ry < 18; };

    if (h.state === 'cameo') {
      h.dir = dx > 0 ? 1 : -1;
      const cam = this.cameras.main;
      if (!h.cTrig && visible && p.x > h.x - 250 && p.x < h.x + 60) {
        h.cTrig = true; h.t = 0; h.spot = true; this.taken.add(h.id);
        st.lock = 5.8; p.body.setVelocityX(0); st.flash = false;
        cam.stopFollow(); cam.pan(h.x, h.y - 30, 1100, 'Sine.easeInOut');
        SFX.sting(); Buzz([60, 40, 60]);
      }
      if (h.cTrig) {
        h.t += dt;
        if (h.t > 1.5 && !h.c1) { h.c1 = true; this.hukTurnHead(h, 'back'); }
        if (h.t > 2.3 && !h.c2) { h.c2 = true; this.hukTurnHead(h, 'front'); }
        if (h.t > 2.6 && !h.c3) { h.c3 = true; SFX.hoot(); SFX.screech(); cam.shake(350, 0.005); Buzz([100, 50, 200]); }
        if (h.t > 3.6) {
          h.state = 'leave'; h.vx = 130; h.vy = -120; h.dir = 1; h.lt = 0; SFX.flap(0.2, 0);
        }
      }
    } else if (h.state === 'leave') {
      h.x += h.vx * dt; h.y += h.vy * dt; h.vy -= 20 * dt;
      this.hukFlapSound(h, dt, d);
      h.lt += dt;
      if (h.cTrig && !h.pb && h.lt > 1.4) {
        h.pb = true; st.lock = 0.8;
        this.cameras.main.pan(p.x, p.y + 18, 800, 'Sine.easeInOut', true, (c, k) => { if (k === 1) { c.startFollow(p, true, 0.12, 0.12); c.setFollowOffset(0, 18); } });
      }
      if ((h.pb || !h.cTrig) && (h.y < this.cameras.main.worldView.y - 220 || h.y < -200)) { h.alive = false; [h.body, h.headS, h.eyes].forEach(o => o.destroy()); return; }
    } else if (h.state === 'perch' || h.state === 'ground') {
      h.lookT -= dt;
      if (h.lookT <= 0 && h.turnT <= 0) {
        const to = h.head === 'front' ? 'back' : 'front';
        this.hukTurnHead(h, to);
        h.lookT = to === 'front' ? 2.6 + Math.random() * 1.8 : 1.2 + Math.random() * 1.1;
      }
      if (h.state === 'ground') {
        h.t -= dt;
        h.walk = false;
        if (h.turnT <= 0 && Math.random() < 0.004) h.dir *= -1;
        const nx = h.x + h.dir * 42 * dt, gy = this.hukGroundY(nx + h.dir * 10, h.y - 10, true);
        if (gy !== null && Math.abs(gy - h.y) < 4 && nx > h.x1 && nx < h.x2) { h.x = nx; h.walk = true; } else h.dir *= -1;
        if (talons() || (visible && d < 24)) { this.die('huk'); }
        if (h.t <= 0) { h.state = 'return'; }
      }
      if (sees && h.state !== 'return') this.hukTelegraph(h);
    } else if (h.state === 'telegraph') {
      h.t -= dt;
      if (visible) { h.tx = p.x; h.ty = p.y; }
      h.dir = h.tx > h.x ? 1 : -1;
      if (h.t <= 0) {
        h.state = 'swoop'; h.t = 3.0;
        const ax = h.tx - h.x, ay = (h.ty - 4) - (h.y - 10 * h.hs), ad = Math.hypot(ax, ay) || 1;
        h.vx = ax / ad * 290; h.vy = ay / ad * 290;
        SFX.screech(); Buzz(80);
      }
    } else if (h.state === 'swoop') {
      h.t -= dt;
      // cilja kamo junak ide; izdaleka skreće sporije, izbliza oštro
      h.blindT = this.hukLOS(h) ? 0 : (h.blindT || 0) + dt;
      if (h.blindT > 0.5) { h.state = 'return'; this.drawHuk(h); return; }
      if (visible) { const lead = Math.min(0.45, d / 290); h.tx = p.x + p.body.velocity.x * lead; h.ty = p.y; }
      const ax = h.tx - h.x, ay = (h.ty - 2) - (h.y - 14 * h.hs);
      const want = Math.atan2(ay, ax), cur = Math.atan2(h.vy, h.vx);
      const diff = Phaser.Math.Angle.Wrap(want - cur);
      const turn = d < 170 ? 8 : 3.4;
      const ang = cur + Phaser.Math.Clamp(diff, -turn * dt, turn * dt);
      h.vx = Math.cos(ang) * 290; h.vy = Math.sin(ang) * 290;
      h.x += h.vx * dt; h.y += h.vy * dt;
      h.dir = h.vx > 0 ? 1 : -1;
      this.hukFlapSound(h, dt, d);
      // svjetiljka u lice ga zaslijepi
      if (st.flash && st.battery > 0 && d < 165 && (h.x - p.x) * st.face > -8) {
        h.state = 'blind'; h.t = 1.2; h.vx = -Math.sign(h.x - p.x || 1) * -150; h.vy = -230;
        st.battery = Math.max(0, st.battery - 12);
        SFX.screech(); Buzz([40, 30, 40]); this.cameras.main.flash(120, 255, 240, 180);
        return;
      }
      if (talons()) { this.die('huk'); return; }
      const gy = this.hukGroundY(h.x, h.y - 30, true);
      if (gy !== null && h.y >= gy && h.vy > 0) { h.y = gy; h.state = 'ground'; h.t = 4.5; h.lookT = 1.6; SFX.land(); this.hukTurnHead(h, 'front'); }
      else if (h.t <= 0 || h.x < h.x1 - 80 || h.x > h.x2 + 80 || h.y > this.worldH) h.state = 'return';
    } else if (h.state === 'blind') {
      h.t -= dt; h.x += h.vx * dt; h.y += h.vy * dt; h.vy += 120 * dt;
      h.dir = h.vx > 0 ? 1 : -1; this.hukFlapSound(h, dt, d);
      if (h.t <= 0) h.state = 'return';
    } else if (h.state === 'return') {
      if (!h.home) h.home = h.perches.reduce((a, b) => Math.abs(b.x - h.x) < Math.abs(a.x - h.x) ? b : a);
      const ax = h.home.x - h.x, ay = h.home.y - h.y, ad = Math.hypot(ax, ay);
      if (ad < 170 * dt + 2) { h.x = h.home.x; h.y = h.home.y; h.home = null; h.state = 'perch'; h.lookT = 2.2; }
      else { h.x += ax / ad * 170 * dt; h.y += ay / ad * 170 * dt; h.dir = ax > 0 ? 1 : -1; this.hukFlapSound(h, dt, d); }
      if (talons()) { this.die('huk'); return; }
    }
    this.drawHuk(h);
  }

  hukFlapSound(h, dt, d) {
    h.flapT -= dt;
    if (h.flapT <= 0) { h.flapT = 0.28; SFX.flap(Phaser.Math.Clamp(0.22 - d / 2500, 0.02, 0.22), Phaser.Math.Clamp((h.x - this.player.x) / 300, -1, 1)); }
  }

  drawHuk(h) {
    const t = this.time.now, hs = h.hs;
    let fr;
    const flying = h.state === 'swoop' || h.state === 'return' || h.state === 'leave';
    if (h.state === 'telegraph' || h.state === 'blind' || h.state === 'hurt') fr = Math.floor(t / 70) % 2 ? 'fly0' : 'fly1';
    else if (h.state === 'stunned') fr = 'fly1';
    else if (h.state === 'dazed' || h.state === 'dying') fr = 'stand0';
    else if (h.state === 'swoop') fr = h.vy > 80 ? 'dive' : Math.floor(t / 110) % 2 ? 'fly0' : 'fly1';
    else if (flying) fr = Math.floor(t / 140) % 2 ? 'fly0' : 'fly1';
    else if (h.walk) fr = 'walk' + (Math.floor(t / 160) % 4);
    else fr = Math.floor(t / 650) % 2 ? 'stand1' : 'stand0';
    const ang = h.ang || 0, ra = ang * Math.PI / 180;
    h.body.setFrame(fr).setPosition(h.x, h.y).setFlipX(h.dir < 0).setAngle(ang);
    const bob = fr === 'stand1' ? 0.7 : fr === 'fly1' ? 1 : 0;
    const shake = h.state === 'telegraph' ? (Math.random() - 0.5) * 1.5 : 0;
    const hl = (86 - 14 - bob) * hs + 12 * hs;
    const hx = h.x + h.dir * hs + shake + Math.sin(ra) * hl, hy = h.y - Math.cos(ra) * hl;
    const sx = h.turnT > 0 ? Math.abs(Math.cos(Math.PI * (1 - h.turnT / 0.24))) : 1;
    h.headS.setPosition(hx, hy).setScale(hs * 1.25 / RES * Math.max(0.08, sx), hs * 1.25 / RES).setAngle(ang);
    const eyesOn = h.head === 'front' && sx > 0.5 && h.state !== 'dazed' && h.state !== 'dying';
    h.eyes.setVisible(eyesOn).setPosition(hx, hy - 3.6 * hs).setScale(hs * 1.25 / RES).setAlpha(h.state === 'telegraph' ? 0.6 + Math.random() * 0.4 : (Math.sin(t / 700) > 0.96 ? 0.1 : 0.9));
  }

  // Huk ne vidi kroz zemlju i stijene
  hukLOS(h) {
    const p = this.player, g = this.L.grid;
    const x0 = h.x, y0 = h.y - 50 * h.hs, x1 = p.x, y1 = p.y - 4;
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 10);
    for (let i = 1; i < n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      const row = g[Math.floor(y / TILE)], c = row && row[Math.floor(x / TILE)];
      if (c === '#' || c === 'D') return false;
    }
    return true;
  }

  // ---------------- vjetar (krošnje) ----------------
  buildWind() {
    this.winds = (this.L.winds || []).map(w => ({ ...w, active: false, leaves: [] }));
    this.winds.forEach(w => {
      for (let i = 0; i < 22; i++) {
        const s = this.add.image(0, 0, 'dot').setTint(i % 3 ? 0x8fd07a : 0xd8e8a0).setScale(1 + Math.random() * 0.8).setDepth(18).setAlpha(0);
        w.leaves.push({ s, x: w.x1 + Math.random() * (w.x2 - w.x1), y: w.y1 + Math.random() * (w.y2 - w.y1), ph: Math.random() * 6 });
      }
    });
  }

  windAt(x, y) {
    let f = 0;
    if (this.winds) this.winds.forEach(w => { if (w.active && x > w.x1 && x < w.x2 && y > w.y1 && y < w.y2) f += w.f; });
    return f;
  }

  updateWind(dt) {
    if (!this.winds || !this.winds.length) return;
    const t = this.time.now / 1000, v = this.cameras.main.worldView, p = this.player;
    this.winds.forEach(w => {
      const per = w.on + w.off, ph = (t + w.ph) % per;
      const was = w.active;
      w.active = ph < w.on;
      const warn = !w.active && ph > per - 0.8;
      const near = p.x > w.x1 - 300 && p.x < w.x2 + 300 && p.y > w.y1 - 200 && p.y < w.y2 + 200;
      if (w.active && !was && near) { SFX.gust(); Buzz(25); }
      if (warn && !w.warned && near) { w.warned = true; SFX.rustle(0.08); }
      if (!warn) w.warned = false;
      const dir = Math.sign(w.f);
      w.leaves.forEach(L => {
        if (w.active) { L.x += dir * (260 + L.ph * 30) * dt; L.y += Math.sin(t * 3 + L.ph) * 30 * dt; }
        else { L.x += Math.sin(t + L.ph) * 8 * dt + (warn ? dir * 30 * dt : 0); L.y += 14 * dt; }
        if (L.x > Math.min(w.x2, v.right + 20)) L.x = Math.max(w.x1, v.x - 10);
        if (L.x < Math.max(w.x1, v.x - 20)) L.x = Math.min(w.x2, v.right + 10);
        if (L.y > w.y2) L.y = w.y1; if (L.y < w.y1) L.y = w.y2;
        L.s.setPosition(L.x, L.y).setAlpha(near ? (w.active ? 0.85 : 0.35) : 0).setRotation(t * 4 + L.ph);
      });
    });
  }

  // ---------------- HUK — borba ----------------
  updateBoss(h, dt) {
    if (!h.alive) return;
    const st = this.st, p = this.player, B = this.L.boss, cam = this.cameras.main;
    if (h.turnT > 0) { h.turnT -= dt; if (h.turnT <= 0.12 && h.head !== h.headTo) { h.head = h.headTo; h.headS.setFrame(h.head); } }
    h.hitCd = Math.max(0, (h.hitCd || 0) - dt);
    const P = [{ sp: 270, tel: 0.8, wait: 2.2 }, { sp: 305, tel: 0.6, wait: 1.6 }, { sp: 335, tel: 0.45, wait: 1.1 }][h.phase];
    const dx = p.x - h.x, d = Math.hypot(dx, (p.y - 4) - (h.y - 40 * h.hs));
    const talons = () => { if (st.dead || Dev.is('god')) return false; const ry = p.y - (h.y - 20 * h.hs); return Math.abs(p.x - h.x) < 17 && ry > -28 && ry < 18; };
    const toPerch = () => { h.state = 'return'; h.home = h.perches[(Math.random() * h.perches.length) | 0]; h.ang = 0; };

    switch (h.state) {
      case 'idle':
        h.dir = dx > 0 ? 1 : -1;
        if (!st.dead && p.x > B.trigger && p.y < B.floorY + 30) {
          h.state = 'intro'; h.t = 3; h.spot = true;
          st.lock = 3; p.body.setVelocityX(0);
          cam.stopFollow(); cam.pan(h.x, h.y - 40, 900, 'Sine.easeInOut');
          SFX.hoot(); SFX.sting();
        }
        break;
      case 'intro':
        h.t -= dt;
        if (h.t < 1.8 && !h.i1) { h.i1 = true; SFX.screech(); cam.shake(600, 0.007); Buzz([150, 60, 250]); this.ui.bossBar(h.hp); this.ui.toast('HUK', 1500); }
        if (h.t <= 0) {
          cam.pan(p.x, p.y + 18, 600, 'Sine.easeInOut', true, (c, k) => { if (k === 1) { c.startFollow(p, true, 0.12, 0.12); c.setFollowOffset(0, 18); } });
          h.state = 'perch'; h.t = 1.2; h.swoops = 0;
        }
        break;
      case 'perch':
        h.t -= dt; h.dir = dx > 0 ? 1 : -1;
        if (h.head !== 'front' && h.turnT <= 0) this.hukTurnHead(h, 'front');
        if (h.t <= 0 && !st.dead) { h.state = 'telegraph'; h.t = P.tel; SFX.hoot(); Buzz(40); }
        break;
      case 'telegraph':
        h.t -= dt; h.tx = p.x; h.ty = p.y; h.dir = dx > 0 ? 1 : -1;
        if (h.t <= 0) {
          h.state = 'swoop'; h.t = 2.6; h.swoops = (h.swoops || 0) + 1;
          const ax = h.tx - h.x, ay = (h.ty - 2) - (h.y - 14 * h.hs), ad = Math.hypot(ax, ay) || 1;
          h.vx = ax / ad * P.sp; h.vy = ay / ad * P.sp; SFX.screech();
        }
        break;
      case 'swoop': {
        h.t -= dt;
        const lead = Math.min(0.4, d / P.sp); h.tx = p.x + p.body.velocity.x * lead; h.ty = p.y;
        const ax = h.tx - h.x, ay = (h.ty - 2) - (h.y - 14 * h.hs);
        const want = Math.atan2(ay, ax), cur = Math.atan2(h.vy, h.vx);
        const turn = d < 170 ? 7 : 3.2;
        const ang = cur + Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(want - cur), -turn * dt, turn * dt);
        h.vx = Math.cos(ang) * P.sp; h.vy = Math.sin(ang) * P.sp;
        h.x += h.vx * dt; h.y += h.vy * dt; h.dir = h.vx > 0 ? 1 : -1;
        h.x = Phaser.Math.Clamp(h.x, B.x1, B.x2);
        this.hukFlapSound(h, dt, d);
        if (st.flash && st.battery > 0 && d < 165 && (h.x - p.x) * st.face > -8) {
          h.state = 'stunned'; h.vx = Math.sign(h.x - p.x || 1) * 60; h.vy = -140;
          st.battery = Math.max(0, st.battery - 10);
          SFX.screech(); Buzz([40, 30, 40]); cam.flash(140, 255, 240, 180);
          break;
        }
        if (talons()) { this.die('huk'); return; }
        const gy = this.hukGroundY(h.x, h.y - 30, true);
        if (gy !== null && h.y >= gy && h.vy > 0) {
          h.y = gy; SFX.land();
          if (h.phase >= 1 && h.swoops < 2) { h.state = 'telegraph'; h.t = 0.35; }
          else toPerch();
        } else if (h.t <= 0) toPerch();
        break;
      }
      case 'stunned': {
        h.vy += 900 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.ang = Phaser.Math.Clamp((h.ang || 0) + 300 * dt * h.dir, -80, 80);
        const gy = this.hukGroundY(h.x, h.y - 20, true);
        if (gy !== null && h.y >= gy && h.vy > 0) { h.y = gy; h.state = 'dazed'; h.t = 2.8; h.ang = 80 * h.dir; SFX.land(); SFX.crumble(); cam.shake(200, 0.006); this.ui.toast('Sad! Udari ga!', 1400); }
        break;
      }
      case 'dazed':
        h.t -= dt;
        if (Math.floor(h.t * 5) !== Math.floor((h.t + dt) * 5)) this.hukTurnHead(h, h.head === 'front' ? 'back' : 'front');
        if (h.t <= 0) { SFX.screech(); toPerch(); }
        break;
      case 'hurt':
        h.t -= dt;
        if (h.t <= 0) toPerch();
        break;
      case 'return': {
        if (!h.home) h.home = h.perches[0];
        const ax = h.home.x - h.x, ay = h.home.y - h.y, ad = Math.hypot(ax, ay);
        if (ad < 210 * dt + 2) { h.x = h.home.x; h.y = h.home.y; h.home = null; h.state = 'perch'; h.t = P.wait + Math.random() * 0.6; h.swoops = 0; }
        else { h.x += ax / ad * 210 * dt; h.y += ay / ad * 210 * dt; h.dir = ax > 0 ? 1 : -1; this.hukFlapSound(h, dt, d); }
        break;
      }
      case 'dying':
        h.t -= dt; h.ang = 80 * h.dir;
        [h.body, h.headS].forEach(o => o.setAlpha(Math.max(0, h.t / 2.6)));
        if (Math.random() < 0.3) this.burst.emitParticleAt(h.x + (Math.random() - 0.5) * 30, h.y - 10, 2);
        if (h.t <= 0) { h.alive = false; [h.body, h.headS, h.eyes].forEach(o => o.destroy()); this.bossDefeated(); return; }
        break;
    }
    this.drawHuk(h);
  }

  hitBoss(h) {
    if (h.hitCd > 0) return;
    h.hitCd = 0.6; h.hp--;
    this.ui.bossBar(h.hp);
    SFX.bugHit(); SFX.screech(); Buzz([60, 40, 160]);
    this.cameras.main.shake(260, 0.008); this.cameras.main.flash(120, 255, 255, 255);
    this.burst.emitParticleAt(h.x, h.y - 14, 16);
    if (h.hp <= 0) { h.state = 'dying'; h.t = 2.6; SFX.scream(); this.ui.toast('Huk pada…', 2200); return; }
    h.state = 'hurt'; h.t = 0.5; h.ang = 0; h.phase = Math.min(2, h.phase + 1);
    this.ui.toast(h.phase === 1 ? 'Huk je bijesan!' : 'Huk je izvan sebe!', 1800);
    if (h.phase === 2) (this.L.boss.wisps || []).forEach(w => this.spawnWisp(w));
  }

  bossDefeated() {
    const o = this.pendingExit;
    this.ui.bossBar(0);
    SFX.win(); Buzz([80, 60, 80, 60, 200]);
    this.cameras.main.flash(600, 255, 240, 200);
    this.wisps.forEach(w => { if (w.state === 'live') this.popWisp(w, false); w.t = 9999; });
    this.time.delayedCall(1200, () => this.ui.toast('Huk je pao. Šuma je tiha.', 3000));
    if (o) {
      const s = this.add.image(o.x, o.y, 'izlaz').setOrigin(0.5, 1).setScale(1 / RES).setDepth(4).setAlpha(0);
      this.tweens.add({ targets: s, alpha: 1, duration: 1500, delay: 800 });
      this.exit = { ...o, s };
    }
  }

  // ---------------- golema paukica (potjera) ----------------
  drawGiantSpider(x, y, t) {
    const g = this.wallG, v = this.cameras.main.worldView;
    if (x - 110 > v.x - 100) { g.fillStyle(0x000000, 0.96); g.fillRect(v.x - 100, v.y - 40, x - 110 - (v.x - 100), v.height + 80); }
    for (let i = 0; i < 4; i++) { g.fillStyle(0x000000, 0.7 - i * 0.17); g.fillRect(x - 110 + i * 8, v.y - 40, 8, v.height + 80); }
    const legs = (side, col, w) => {
      for (let i = 0; i < 4; i++) {
        const ph = t * 9 + i * 1.6 + side;
        const bx = x - 40 + i * 6, by = y - 6;
        const fx = x - 92 + i * 36 + Math.sin(ph) * 14, fy = y + 46 - Math.max(0, Math.cos(ph)) * 10;
        const kx = (bx + fx) / 2 + 8, ky = y - 48 - i * 3 + Math.sin(ph) * 6;
        g.lineStyle(w, col, 1); g.beginPath(); g.moveTo(bx, by); g.lineTo(kx, ky); g.lineTo(fx, fy); g.strokePath();
        g.lineStyle(1, 0x6a5a78, 0.5); g.beginPath(); g.moveTo(kx, ky); g.lineTo(fx, fy); g.strokePath();
      }
    };
    legs(0, 0x0a070c, 5);
    g.fillStyle(0x1a121c, 1); g.fillEllipse(x - 82, y - 10, 96, 76);
    g.fillStyle(0xa01828, 1); g.fillTriangle(x - 90, y - 28, x - 74, y - 28, x - 82, y - 14); g.fillTriangle(x - 90, y, x - 74, y, x - 82, y - 14);
    g.lineStyle(1, 0x3a2a40, 0.8);
    for (let i = 0; i < 9; i++) { const a = i * 0.7; g.beginPath(); g.moveTo(x - 82 + Math.cos(a) * 44, y - 10 + Math.sin(a) * 34); g.lineTo(x - 82 + Math.cos(a) * 52, y - 10 + Math.sin(a) * 40); g.strokePath(); }
    g.fillStyle(0x221826, 1); g.fillCircle(x - 28, y, 26);
    legs(3.1, 0x16101a, 4.5);
    const f = Math.sin(t * 14) * 3;
    g.fillStyle(0xd8d0c0, 1); g.fillTriangle(x - 10, y + 10, x - 3, y + 10, x - 4 + f, y + 26); g.fillTriangle(x - 20, y + 12, x - 13, y + 12, x - 16 - f, y + 26);
    const E = [[-6, -12], [2, -8], [-12, -4], [-2, -2], [-14, -14], [6, -2], [-8, 4]];
    this.wallEyes.forEach((e, i) => {
      const blink = Math.sin(t * 1.3 + i * 1.7) > 0.95;
      e.setVisible(true).setPosition(x - 18 + E[i][0], y + E[i][1]).setAlpha(blink ? 0.1 : 1);
    });
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
    this.wisps.forEach(w => this.updateWisp(w, dt));
    this.huks.forEach(h => h.boss ? this.updateBoss(h, dt) : this.updateHuk(h, dt));
    this.updateWind(dt);
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

    // zapeo u mreži
    if (st.web) {
      b.setVelocity(0, 0); b.setAllowGravity(false);
      p.x = st.webX + (st.webShake > 0 ? Math.sin(this.time.now / 25) : 0); st.webShake = Math.max(0, st.webShake - dt);
      p.anims.stop(); p.setFrame('fall');
      if (jumpP) {
        st.webHits++; st.webShake = 0.15; SFX.rustle(0.12); this.noise(p.x, p.y, 150);
        if (st.webHits >= 4) { this.cutWeb(st.web); st.web = null; b.setAllowGravity(true); b.setVelocityY(-180); }
      }
      return;
    }
    if (!Dev.is('fly')) {
      const w = this.webAt(b);
      if (w) { st.web = w; st.webHits = 0; st.webX = p.x; st.webShake = 0; SFX.rustle(0.2); Buzz(40); this.ui.toast('Zapeo si u mreži! Tapkaj skok!', 1800); return; }
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
    const mud = this.mudDepth(p.x, this.feet(p));
    if (mud >= 0) {
      if (!st.inMud) { SFX.squelch(0.25); st.inMud = true; }
      if (b.velocity.y > 21) b.setVelocityY(21);
      if (mud > 17 && !Dev.is('god')) { this.sink(); return; }
    } else st.inMud = false;
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
    if (st.inMud && dir && ((b.blocked.right && dir > 0) || (b.blocked.left && dir < 0)) && b.velocity.y >= 0) b.setVelocityY(-170);   // izvuci se na rub
    let target = dir * (st.inMud ? 40 : wet ? 66 : (sneak && ground) ? 58 : 118) * (Dev.is('fast') ? 2.5 : 1);
    const wf = this.windAt(p.x, p.y);
    if (wf && st.lock <= 0) target += ground ? wf * 0.3 : wf;
    if (st.lock <= 0) b.setVelocityX(Phaser.Math.Linear(b.velocity.x, target, Math.min(1, dt * (onIce ? 1.6 : ground ? 16 : 12))));
    if (dir !== 0 && st.atkT <= 0) st.face = dir;
    p.setFlipX(st.face < 0);

    // skok: coyote time + buffer
    st.coyote = (ground || st.inMud) ? 0.1 : Math.max(0, st.coyote - dt);
    st.buffer = jumpP ? 0.13 : Math.max(0, st.buffer - dt);
    if (st.buffer > 0 && st.coyote > 0) {
      b.setVelocityY(st.inMud ? -290 : wet ? -300 : -345); st.buffer = 0; st.coyote = 0; st.jumping = true;
      st.inMud ? SFX.squelch(0.2) : wet ? SFX.splash(0.2) : SFX.jump();
    }
    if (st.jumping && !jumpH && b.velocity.y < -130) b.setVelocityY(-130);
    if (b.velocity.y >= 0) st.jumping = false;
    // lebdenje (Šuma): drži skok dok padaš
    st.gliding = this.L.glide && !ground && !st.inMud && !wet && jumpH && b.velocity.y > 0 && st.lock <= 0;
    if (st.gliding) {
      if (b.velocity.y > 55) b.setVelocityY(55);
      st.flapT = (st.flapT || 0) - dt;
      if (st.flapT <= 0) { st.flapT = 0.32; SFX.flap(0.06, 0); this.noise(p.x, p.y, 0, 330); }
    }

    // zapamti sigurno tlo (za povratak nakon šiljaka)
    if (ground && !wet) {
      const g = this.L.grid, cx = Math.floor(p.x / TILE), fy = Math.floor((this.feet(p) + 4) / TILE);
      const under = g[fy] && g[fy][cx], row = g[fy - 1] || [];
      const solidish = (c) => c === '#' || c === '-';  // led i gljive nisu sigurno tlo
      const ur = g[fy] || [];
      if (solidish(under) && solidish(ur[cx - 1]) && solidish(ur[cx + 1]) && row[cx - 1] !== '^' && row[cx] !== '^' && row[cx + 1] !== '^') st.safe = { x: cx * TILE + TILE / 2, y: p.y };
    }
    // doskok
    if (ground && st.airVy > 260 && !st.inMud) { SFX.land(); this.dust.emitParticleAt(p.x, this.feet(p), 4); }
    st.airVy = ground ? 0 : Math.max(st.airVy, b.velocity.y);

    // koraci
    if (st.inMud && Math.abs(b.velocity.x) > 20) {
      st.stepT -= dt;
      if (st.stepT <= 0) { st.stepT = 0.45; SFX.squelch(0.14); this.noise(p.x, p.y, 120); }
    } else if (ground && Math.abs(b.velocity.x) > 40) {
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
      this.webs.forEach(w => { if (!w.cut && Phaser.Geom.Intersects.RectangleToRectangle(hit, new Phaser.Geom.Rectangle(w.x * TILE + 2, w.y * TILE + 2, TILE - 4, TILE - 4))) this.cutWeb(w); });
      this.wisps.forEach(w => { if (w.state === 'live' && hit.contains(w.x, w.y)) this.popWisp(w, false); });
      this.huks.forEach(h => { if (h.boss && h.state === 'dazed' && Phaser.Geom.Intersects.RectangleToRectangle(hit, new Phaser.Geom.Rectangle(h.x - 22, h.y - 30, 44, 32))) this.hitBoss(h); });
      this.noise(p.x, p.y, 170);
    }
    this.slash.setVisible(st.atkT > 0);
    if (st.atkT > 0) {
      this.slash.setPosition(p.x + st.face * 14, p.y - 3).setFlipX(st.face < 0).setAlpha(st.atkT / 0.16);
    }

    // animacija
    let anim;
    if (st.atkT > 0) { p.anims.stop(); p.setFrame('attack'); }
    else if (st.gliding) { p.anims.stop(); p.setFrame(Math.floor(this.time.now / 130) % 2 ? 'fly1' : 'fly0'); }
    else if (st.inMud) anim = Math.abs(b.velocity.x) > 20 ? 'hero-run' : 'hero-idle';
    else if (!ground) { p.anims.stop(); p.setFrame(b.velocity.y < 0 ? 'jump' : 'fall'); }
    else if (Math.abs(b.velocity.x) > 25) anim = 'hero-run';
    else anim = 'hero-idle';
    if (anim && p.anims.currentAnim?.key !== anim) p.play(anim);
    else if (anim && !p.anims.isPlaying) p.play(anim);
  }

  noise(x, y, r, hukR = r * 1.5) {
    this.huks.forEach(h => this.hukHear(h, x, y, hukR));
    this.bats.forEach(bt => { if (bt.alive && Math.hypot(bt.x - x, bt.y - y) < r * 0.6) this.wakeBat(bt); });
    this.monsters.forEach(m => {
      if (!m.active || this.st.hidden) return;
      if (Math.abs(m.s.x - x) < r && Math.abs(this.feet(m.s) - this.feet(this.player)) < 64 && m.state !== 'chase' && x > m.cMin - 30 && x < m.cMax + 30) this.startChase(m);
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
    // Tihi lovi samo u svom području — igrač izvan njega nije meta (inače stoji na rubu kao zamrznut)
    const inArea = p.x > m.cMin - 30 && p.x < m.cMax + 30;
    const sees = visible && same && inArea && ((st.flash && adx < 270) || (facing && adx < 115) || adx < 55);
    const track = visible && same && inArea && adx < 380;
    m.sawT = (sees || (m.state === 'chase' && track)) ? 0 : (m.sawT || 0) + dt;
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
          this.time.delayedCall(500, () => { if (this.st.hidden) { this.st.hidden = null; p.setVisible(true); this.peek.setVisible(false); this.die('monster', m.skin); } });
        }
      }
    }
    if (m.state === 'opening') { b.setVelocityX(0); s.setFlipX(m.dir < 0); if (s.anims.currentAnim?.key !== m.sk + '-idle') s.play(m.sk + '-idle'); m.eyes.setPosition(s.x + (m.dir > 0 ? 9 : -9), s.y - 30); return; }

    if (m.state === 'patrol') {
      if (sees) this.startChase(m);
    } else if (m.state === 'chase') {
      if (track) { m.lastX = p.x; m.loseT = 0; }
      else m.loseT += dt;
      if (Math.abs(Phaser.Math.Clamp(m.lastX, m.cMin, m.cMax) - s.x) < 10 && !track) { m.state = 'search'; m.searchT = 4.5; m.flipT = 0.7; }
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
    const anim = m.sk + (speed === 0 ? '-idle' : wide ? '-chase' : '-walk');
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
    if (visible && (this.overlap(s, p, 3) || (m.state === 'chase' && same && adx < 30))) this.die('monster', m.skin);
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

  die(reason, skin) {
    if (Dev.is('god')) return;
    const st = this.st;
    if (st.dead) return;
    st.dead = true; st.flash = false;
    this.player.body.setVelocity(0, 0); this.player.body.enable = false;
    if (reason === 'monster' || reason === 'huk') {
      Buzz([200, 60, 350]);
      SFX.scream();
      this.ui.jumpscare(() => this.scene.restart(), reason === 'huk' ? 'lice_huk' : skin ? 'lice_' + skin : 'lice');
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
        it.done = true;
        if (it.respawn) {
          this.tweens.add({ targets: [it.s, it.glow], alpha: 0, duration: 300 });
          this.time.delayedCall(it.respawn * 1000, () => { it.done = false; this.tweens.add({ targets: [it.s, it.glow], alpha: { from: 0, to: 0.8 }, duration: 800 }); });
        } else {
          this.taken.add(it.id);
          this.tweens.add({ targets: [it.s, it.glow], alpha: 0, y: it.baseY - 14, duration: 350, onComplete: () => { it.s.destroy(); it.glow.destroy(); } });
        }
        if (it.type === 'battery') { st.battery = Math.min(100, st.battery + 35); SFX.pickup(); this.ui.toast(this.forest ? '+ krijesnice u svjetiljci' : '+ baterija'); }
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
      const world = Level.worldOf(this.levelIndex);
      const endsWorld = next >= Level.count || Level.worldOf(next) !== world;
      const worldComplete = Level.worlds[world].zones.length >= 7;
      if (endsWorld) this.cameras.main.fadeOut(1400, 0, 0, 0); else this.cameras.main.fadeOut(1400, 230, 245, 255);
      this.time.delayedCall(1500, () => {
        if (endsWorld && !worldComplete) {
          this.scene.stop('UI'); this.scene.start('Soon', { world });
        } else if (endsWorld) {
          Progress.worldDone(world);
          Save.store(next < Level.count ? Save.fresh(next) : { ...Save.fresh(next - 1), done: true });
          this.scene.stop('UI'); world === 0 ? this.scene.start('Transition', { world }) : this.scene.start('Soon', { world, done: true });
        }
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
    this.peek.setPosition(cab.x, cab.y - cab.peekY).setVisible(true);
    this.tweens.add({ targets: cab.s, x: cab.x + 0.6, duration: 50, yoyo: true, repeat: 3 });
    this.forest ? SFX.rustle(0.18) : SFX.door();
    watchers.forEach(m => { m.state = 'inspect'; m.target = cab; });
  }

  unhide() {
    const st = this.st;
    st.hidden = null;
    this.player.setVisible(true);
    this.peek.setVisible(false);
    this.forest ? SFX.rustle(0.1) : SFX.click();
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
    this.huks.filter(h => h.dormant === keyId).forEach(h => this.time.delayedCall(900, () => this.wakeHuk(h)));
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
    if (this.mudG) this.drawMud(t, v);
    if (this.forest) this.items.forEach(it => { if (!it.done && it.type === 'battery') it.s.setAlpha(0.6 + Math.sin(t * 6 + it.x) * 0.4); });
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
    if (this.moon) L(v.x + v.width * 0.74, v.y + v.height * 0.2, 46, 0.85);
    if (this.forest) this.items.forEach(it => { if (!it.done && it.type === 'battery') L(it.x, it.baseY, 22, 0.55); });
    this.wisps.forEach(w => { if (w.state === 'live') L(w.x, w.y, 34, 0.8); });
    this.huks.forEach(h => { if (h.alive) L(h.x, h.y - 38 * h.hs, h.spot ? 110 : 46, h.spot ? 0.8 : 0.32); });
    if (this.wall && this.L.darkWall.style === 'spider') L(this.wall.x - 30, this.L.darkWall.y, 70, 0.35);
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
      const pan = Math.random() * 2 - 1;
      if (this.T.amb === 'crickets') { SFX.cricket(pan); if (Math.random() < 0.08) SFX.hoot(); }
      else if (this.T.amb === 'frogs') { Math.random() < 0.6 ? SFX.frog(pan) : SFX.cricket(pan); }
      else if (this.T.amb === 'creak') { Math.random() < 0.5 ? SFX.chitter(0.05, pan) : SFX.creak(); }
      else if (this.T.id === 'kosturnica' && Math.random() < 0.25) SFX.bell();
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
    this.huks.forEach(h => {
      if (!h.alive || h.cameo) return;
      const d = Math.hypot(h.x - p.x, h.y - this.feet(p));
      if (h.state === 'swoop' || h.state === 'telegraph') { chasing = true; near = Math.min(near, d); }
      else if (h.head === 'front') near = Math.min(near, d * 1.4);
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
