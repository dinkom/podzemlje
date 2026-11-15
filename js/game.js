// Podzemlje — glavna scena igre
const VIEW_H = 270;          // koliko svjetskih piksela vidimo u visinu
const SAVE_KEY = 'podzemlje-save-v1';

const Save = {
  load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } },
  store(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) {} },
  clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} },
  fresh() { return { cp: null, hasKey: false, doorOpen: false, taken: [] }; },
};

// stanje kontrola dijele UI scena (touch) i tipkovnica
const Controls = {
  left: false, right: false, jumpHeld: false,
  _p: {},
  press(k) { this._p[k] = true; },
  take(k) { const v = !!this._p[k]; this._p[k] = false; return v; },
  reset() { this.left = this.right = this.jumpHeld = false; this._p = {}; },
};

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    Controls.reset();
    const L = this.L = Level.build();
    this.save = Save.load() || Save.fresh();
    const taken = new Set(this.save.taken);
    this.taken = new Set(this.save.taken);
    this.hasKey = this.save.hasKey;
    this.doorOpen = this.save.doorOpen;
    this.worldW = L.W * TILE; this.worldH = L.H * TILE;
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    // pozadine
    this.bgFar = this.add.tileSprite(0, 0, 10, 10, 'bgFar').setOrigin(0).setScrollFactor(0).setDepth(0);
    this.bgMid = this.add.tileSprite(0, 0, 10, 10, 'bgMid').setOrigin(0).setScrollFactor(0).setDepth(1);

    // razina
    this.mushGlows = Level.addVisuals(this, L);
    this.layer = Level.addCollision(this, L);

    // predmeti
    this.items = []; this.cabinets = []; this.notes = []; this.checkpoints = []; this.crawlers = [];
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
        if (taken.has(o.id) || (o.type === 'key' && this.hasKey)) continue;
        const s = this.add.image(o.x, o.y - 7, o.type === 'key' ? 'kljuc' : 'baterija').setScale(1 / RES).setDepth(11);
        const glow = this.add.image(o.x, o.y - 7, 'glow').setScale(o.type === 'key' ? 0.9 : 0.55).setDepth(61)
          .setTint(o.type === 'key' ? 0xffd25a : 0x6ee09a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
        this.items.push({ ...o, s, glow, baseY: o.y - 7 });
      } else if (o.type === 'exit') {
        this.exit = { ...o, s: this.add.image(o.x, o.y, 'izlaz').setOrigin(0.5, 1).setScale(1 / RES).setDepth(4) };
      } else if (o.type === 'crawler') {
        this.spawnCrawler(o);
      }
    }
    // vrata
    const D = L.door;
    this.door = { ...D, s: this.add.image(D.x, D.y, 'vrata').setOrigin(0).setScale(1 / RES).setDepth(8) };
    if (this.doorOpen) this.openDoor(true);

    // sjaj gljiva iznad mraka
    this.mushGlows.forEach(m => this.add.image(m.x, m.y, 'glow').setScale(0.35).setTint(m.col).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(61));

    // junak
    const cp = this.checkpoints.find(c => c.id === this.save.cp);
    const sx = cp ? cp.x + 14 : L.start.x, sy = cp ? cp.y : L.start.y;
    const p = this.player = this.physics.add.sprite(sx, sy - 16, 'hero', 'idle0').setScale(1 / RES).setDepth(15);
    p.body.setSize(11 * RES, 22 * RES).setOffset(11 * RES, 9 * RES);
    p.body.setMaxVelocity(400, 620);
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
      alpha: { start: 0.45, end: 0 }, tint: [0x63e6d6, 0xc08cff, 0x9fd8ff], blendMode: 'ADD', emitting: false,
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
    cam.setBackgroundColor('#06080d');
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

    // tipkovnica (za testiranje na računalu)
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,SPACE,J,X,F,L,E,ESC');

    this.dripT = 2; this.heartT = 0; this.time0 = 0;
    this.ui = this.scene.get('UI');
    this.ui.bind(this);
    if (!this.save.cp) this.time.delayedCall(600, () => this.ui.toast('Lijevi palac: hodaj.  Desno: skok, udarac, svjetiljka.', 4200));
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  layout() {
    const w = this.scale.width, h = this.scale.height;
    const cam = this.cameras.main;
    const zoom = h / VIEW_H;
    cam.setZoom(zoom);
    const vw = w / zoom, vh = h / zoom;
    this.vw = vw; this.vh = vh;
    const ox = (w - vw) / 2, oy = (h - vh) / 2;
    [[this.bgFar, 280], [this.bgMid, 280]].forEach(([ts, th]) => {
      ts.setPosition(ox, oy).setSize(vw, vh);
      const s = vh / th / 2;
      ts.setTileScale(s, s);
    });
    this.darkTex.setSize(Math.ceil((vw + 80) / this.DS), Math.ceil((vh + 80) / this.DS));
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

  spawnMonster(m) {
    const s = this.physics.add.sprite(m.x, m.y - 40, 'tihi', 'walk0').setScale(1 / RES).setDepth(14);
    s.body.setSize(16 * RES, 56 * RES).setOffset(18 * RES, 23 * RES);
    s.body.setMaxVelocity(300, 600);
    this.physics.add.collider(s, this.layer);
    const eyes = this.add.image(0, 0, 'oci_tihi').setScale(1 / RES).setDepth(60).setBlendMode(Phaser.BlendModes.ADD);
    const M = { ...m, s, eyes, dir: -1, state: 'patrol', lastX: m.x, loseT: 0, searchT: 0, flipT: 0, stepT: 0, wakeT: 0, active: true };
    if (m.dormant && !this.hasKey) { M.active = false; s.setVisible(false); s.body.enable = false; eyes.setVisible(false); }
    else if (m.dormant) { M.active = false; s.setVisible(false); s.body.enable = false; eyes.setVisible(false); M.spent = true; }
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
    if (!st.dead) this.interactions(dt);
    this.updateFx(dt);
    this.drawDarkness(time);
    this.updateAudio(dt);

    this.registry.set('hud', { hp: st.hp, battery: st.battery, key: this.hasKey, flash: st.flash, hidden: !!st.hidden });
  }

  updatePlayer(dt, K, JD) {
    const st = this.st, p = this.player, b = p.body;
    const ground = b.blocked.down || b.touching.down;
    const left = Controls.left || K.LEFT.isDown || K.A.isDown;
    const right = Controls.right || K.RIGHT.isDown || K.D.isDown;
    const jumpP = Controls.take('jump') | JD(K.SPACE) | JD(K.UP) | JD(K.W);
    const jumpH = Controls.jumpHeld || K.SPACE.isDown || K.UP.isDown || K.W.isDown;
    const atkP = Controls.take('attack') | JD(K.J) | JD(K.X);
    const flashP = Controls.take('flash') | JD(K.F) | JD(K.L);
    const ctxP = Controls.take('context') | JD(K.E) | JD(K.DOWN);

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
      st.battery = Math.max(0, st.battery - 3.4 * dt);
      if (st.battery <= 0) { st.flash = false; this.ui.toast('Baterija je prazna!'); }
    }

    // kretanje
    let dir = (right ? 1 : 0) - (left ? 1 : 0);
    if (st.lock > 0) dir = 0;
    const target = dir * 118;
    if (st.lock <= 0) b.setVelocityX(Phaser.Math.Linear(b.velocity.x, target, Math.min(1, dt * (ground ? 16 : 9))));
    if (dir !== 0 && st.atkT <= 0) st.face = dir;
    p.setFlipX(st.face < 0);

    // skok: coyote time + buffer
    st.coyote = ground ? 0.1 : Math.max(0, st.coyote - dt);
    st.buffer = jumpP ? 0.13 : Math.max(0, st.buffer - dt);
    if (st.buffer > 0 && st.coyote > 0) {
      b.setVelocityY(-345); st.buffer = 0; st.coyote = 0; st.jumping = true; SFX.jump();
    }
    if (st.jumping && !jumpH && b.velocity.y < -130) b.setVelocityY(-130);
    if (b.velocity.y >= 0) st.jumping = false;

    // doskok
    if (ground && st.airVy > 260) { SFX.land(); this.dust.emitParticleAt(p.x, this.feet(p), 4); }
    st.airVy = ground ? 0 : Math.max(st.airVy, b.velocity.y);

    // koraci
    if (ground && Math.abs(b.velocity.x) > 40) {
      st.stepT -= dt;
      if (st.stepT <= 0) { st.stepT = 0.27; SFX.step(); }
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
    const sees = visible && same && ((st.flash && adx < 270) || (facing && adx < 105) || adx < 50);

    if (m.state === 'patrol') {
      if (sees) this.startChase(m);
    } else if (m.state === 'chase') {
      if (visible && same && adx < 380) { m.lastX = p.x; m.loseT = 0; }
      else m.loseT += dt;
      if (Math.abs(m.lastX - s.x) < 10 && !(visible && same)) { m.state = 'search'; m.searchT = 2.6; m.flipT = 0.7; }
      if (m.loseT > 3.2) { m.state = 'search'; m.searchT = 2.6; m.flipT = 0.7; }
    } else if (m.state === 'search') {
      m.searchT -= dt; m.flipT -= dt;
      if (m.flipT <= 0) { m.dir *= -1; m.flipT = 0.8; }
      if (sees) this.startChase(m);
      else if (m.searchT <= 0) m.state = 'patrol';
    }

    let speed = 0;
    if (m.state === 'patrol') {
      speed = 36;
      if (s.x <= m.minX + 2) m.dir = 1;
      if (s.x >= m.maxX - 2) m.dir = -1;
      if (b.blocked.left) m.dir = 1;
      if (b.blocked.right) m.dir = -1;
    } else if (m.state === 'chase') {
      const tx = Phaser.Math.Clamp(m.lastX, m.minX, m.maxX);
      m.dir = tx > s.x ? 1 : -1;
      speed = Math.abs(tx - s.x) < 6 ? 0 : 100;
    }
    // ne izlazi iz svog područja
    if ((s.x <= m.minX && m.dir < 0) || (s.x >= m.maxX && m.dir > 0)) speed = 0;
    b.setVelocityX(m.dir * speed);
    s.setFlipX(m.dir < 0);
    const anim = speed === 0 ? 'tihi-idle' : m.state === 'chase' ? 'tihi-chase' : 'tihi-walk';
    if (s.anims.currentAnim?.key !== anim) s.play(anim);

    // oči iznad mraka
    const blink = m.state === 'search' && Math.sin(this.time.now / 90) > 0.85;
    m.eyes.setPosition(s.x + (m.dir > 0 ? 9 : -9), s.y - 30).setFlipX(m.dir < 0).setAlpha(blink ? 0.1 : 1);

    // koraci
    if (speed > 0) {
      m.stepT -= dt;
      if (m.stepT <= 0) {
        m.stepT = m.state === 'chase' ? 0.3 : 0.62;
        const d = Math.hypot(dx, this.feet(s) - this.feet(p));
        SFX.stomp(Phaser.Math.Clamp(1 - d / 430, 0, 1) * 0.9, Phaser.Math.Clamp(-dx / 300, -1, 1));
      }
    }

    // ulovio te
    if (visible && this.overlap(s, p, 3)) this.die('monster');
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
    const st = this.st;
    st.hp--; st.invul = 1.3; st.lock = 0.25;
    this.player.body.setVelocity(dir * 170, -210);
    SFX.hurt(); Buzz(90);
    this.cameras.main.shake(150, 0.006);
    if (st.hp <= 0) this.die('hp');
  }

  die(reason) {
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
      if (!this.doorOpen) {
        const D = this.door;
        const near = Math.abs(p.x - (D.x + 24)) < 62 && pf > D.y && pf <= D.y + 97;
        if (near && this.hasKey) { label = 'Otključaj'; this.ctxAction = () => this.openDoor(false); }
        else if (near && !st.doorMsg) { st.doorMsg = true; this.ui.toast('Zaključano. Treba ti ključ.'); }
        else if (!near) st.doorMsg = false;
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
        else { this.hasKey = true; SFX.key(); this.ui.toast('Uzeo si stari ključ…', 2000); this.wakeTheSleeper(); }
      }
    }

    // checkpoint
    const cp = this.checkpoints.find(c => Math.abs(c.x - p.x) < 16 && Math.abs(c.y - pf) < 10);
    if (cp && st.insideCp !== cp.id) {
      st.insideCp = cp.id;
      this.checkpoints.forEach(c => c.s.setFrame(c === cp ? 'on' : 'off'));
      st.hp = 3; st.battery = 100;
      this.save = { cp: cp.id, hasKey: this.hasKey, doorOpen: this.doorOpen, taken: [...this.taken] };
      Save.store(this.save);
      SFX.save(); Buzz(30);
      this.ui.toast('Sigurno mjesto. Igra je spremljena.', 2200);
    } else if (!cp) st.insideCp = null;

    // izlaz
    if (this.exit && Math.abs(this.exit.x - p.x) < 14 && Math.abs(this.exit.y - pf) < 10) {
      this.st.dead = true;
      SFX.win();
      this.cameras.main.fadeOut(1400, 230, 245, 255);
      this.time.delayedCall(1500, () => { this.scene.stop('UI'); this.scene.start('End'); });
    }
  }

  hide(cab) {
    const st = this.st, p = this.player;
    // ako te vidi izbliza dok se skrivaš — kasno je
    const close = this.monsters.find(m => m.active && m.state === 'chase' && Math.abs(m.s.x - p.x) < 58 && Math.abs(this.feet(m.s) - this.feet(p)) < 60);
    st.hidden = cab; st.flash = false;
    p.setVisible(false); p.body.setVelocity(0, 0); p.x = cab.x;
    this.peek.setPosition(cab.x, cab.y - 30).setVisible(true);
    this.tweens.add({ targets: cab.s, x: cab.x + 0.6, duration: 50, yoyo: true, repeat: 3 });
    SFX.door();
    if (close) this.time.delayedCall(450, () => { st.hidden = null; p.setVisible(true); this.peek.setVisible(false); this.die('monster'); });
  }

  unhide() {
    const st = this.st;
    st.hidden = null;
    this.player.setVisible(true);
    this.peek.setVisible(false);
    SFX.click();
  }

  openDoor(instant) {
    this.doorOpen = true;
    const D = this.door;
    for (let y = D.ty; y < D.ty + D.h; y++) for (let x = D.tx; x < D.tx + D.w; x++) this.layer.removeTileAt(x, y);
    if (instant) { D.s.setVisible(false); return; }
    SFX.door(); Buzz(80);
    this.cameras.main.shake(400, 0.004);
    this.tweens.add({ targets: D.s, y: D.y - 90, alpha: 0, duration: 1400, ease: 'Sine.easeIn' });
    this.ui.toast('Vrata su se otvorila.', 1800);
  }

  wakeTheSleeper() {
    const m = this.monsters.find(x => x.dormant && !x.spent);
    if (!m) return;
    m.spent = true;
    this.time.delayedCall(900, () => {
      SFX.rumble(); Buzz([300, 100, 300]);
      this.cameras.main.shake(1200, 0.006);
      this.ui.toast('Nešto se probudilo u zidu…', 2400);
      m.wakeT = 1.4;
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
    // junak sakriven — oči u ormaru trepću
    if (this.st.hidden) this.peek.setAlpha(Math.sin(t * 1.7) > 0.93 ? 0 : 0.8);
  }

  drawDarkness(time) {
    const v = this.cameras.main.worldView, DS = this.DS;
    const ox = v.x - 40, oy = v.y - 40;
    this.dark.setPosition(ox, oy);
    const tex = this.darkTex, c = tex.getContext();
    const cw = tex.width, ch = tex.height;
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.clearRect(0, 0, cw, ch);
    c.fillStyle = 'rgba(2,3,6,0.93)';
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
    this.mushGlows.forEach(m => L(m.x, m.y, 18, 0.45));
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    tex.refresh();
  }

  updateAudio(dt) {
    const p = this.player, st = this.st;
    // kapanje
    this.dripT -= dt;
    if (this.dripT <= 0) { this.dripT = 2.5 + Math.random() * 5; SFX.drip(Math.random() * 2 - 1); }
    // srce i napetost
    let near = 9999, chasing = false;
    this.monsters.forEach(m => {
      if (!m.active) return;
      const d = Math.hypot(m.s.x - p.x, (this.feet(m.s) - this.feet(p)) * 1.6);
      if (d < near) near = d;
      if (m.state === 'chase') chasing = true;
    });
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
