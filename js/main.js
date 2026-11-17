// Podzemlje — pokretanje, naslovni ekran, kraj
const DPR = Math.min(window.devicePixelRatio || 1, 2);

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    Art.generate(this);
    Tiles.generate(this);
    Tiles.ensureTheme(this, THEMES.spilje);
    const A = this.anims;
    const fr = (key, names) => names.map(n => ({ key, frame: n }));
    A.create({ key: 'hero-idle', frames: fr('hero', ['idle0', 'idle1']), frameRate: 2, repeat: -1 });
    A.create({ key: 'hero-run', frames: fr('hero', ['run0', 'run1', 'run2', 'run3']), frameRate: 11, repeat: -1 });
    A.create({ key: 'tihi-walk', frames: fr('tihi', ['walk0', 'walk1', 'walk2', 'walk3']), frameRate: 4.5, repeat: -1 });
    A.create({ key: 'tihi-chase', frames: fr('tihi', ['chase0', 'chase1', 'chase2', 'chase3']), frameRate: 9, repeat: -1 });
    A.create({ key: 'tihi-idle', frames: fr('tihi', ['idle0', 'idle1']), frameRate: 1.6, repeat: -1 });
    A.create({ key: 'bug-walk', frames: fr('bug', ['c0', 'c1']), frameRate: 7, repeat: -1 });
    A.create({ key: 'hero-fly', frames: fr('hero', ['fly0', 'fly1']), frameRate: 9, repeat: -1 });
    A.create({ key: 'pauk', frames: fr('pauk', ['p0', 'p1']), frameRate: 6, repeat: -1 });
    A.create({ key: 'bat-hang', frames: fr('bat', ['hang0', 'hang1']), frameRate: 1.2, repeat: -1 });
    A.create({ key: 'bat-fly', frames: fr('bat', ['fly0', 'fly1', 'fly2', 'fly1']), frameRate: 14, repeat: -1 });
    this.scene.start('Title');
  }
}

function goFullscreen(scene) {
  try {
    if (!scene.scale.isFullscreen) scene.scale.startFullscreen();
    scene.scale.once('enterfullscreen', () => {
      try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
    });
  } catch (e) {}
}

// Naslovni ekran = glavni izbornik
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    if (window.__checkUpdate) window.__checkUpdate();
    this.cameras.main.setBackgroundColor('#05070b');
    this.mode = 'main'; this.sel = 0; this.starting = false;
    // zaštita: klik/tipka koja nas je dovela ovamo (npr. iz pauze) ne smije odmah nešto pokrenuti
    this.armed = false; this.ready = false;
    this.time.delayedCall(350, () => { this.ready = true; });
    this.build();
    this.scale.on('resize', this.build, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.build, this));
    this.input.on('pointerdown', () => { if (this.ready) this.armed = true; });
    this.input.on('pointerup', (p) => {
      if (!this.armed) return;
      this.armed = false;
      SFX.init();
      if (p.wasTouch) goFullscreen(this);
      const hit = (this.buttons || []).find(b => b.r.getBounds().contains(p.x, p.y));
      if (hit) this.choose(hit.act);
    });
    this.input.keyboard.on('keydown', (e) => {
      if (!this.ready) return;
      SFX.init();
      const n = this.buttons.length;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.sel = (this.sel + n - 1) % n;
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.sel = (this.sel + 1) % n;
      else if (e.code === 'Enter' || e.code === 'Space') { this.choose(this.buttons[this.sel].act); return; }
      else if (e.code === 'Escape' && this.mode === 'confirm') { this.choose('back'); return; }
      else return;
      SFX.click(); this.paintSel();
    });
  }

  choose(act) {
    if (this.starting) return;
    SFX.init(); SFX.click();
    if (act === 'askNew') { this.mode = 'confirm'; this.sel = 1; this.build(); return; }
    if (act === 'back') { this.mode = 'main'; this.sel = 0; this.build(); return; }
    this.starting = true;
    if (act === 'new') Save.clear();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(520, () => {
      this.scene.launch('UI');
      this.scene.start('Game');
      this.scene.bringToTop('UI');
    });
  }

  paintSel() {
    (this.buttons || []).forEach((b, i) => b.r.setFillStyle(0xffffff, i === this.sel ? 0.2 : 0.07).setStrokeStyle(2 * this.u, 0xe9dfc6, i === this.sel ? 1 : 0.55));
  }

  build() {
    if (this.root) this.root.destroy(true);
    const w = this.scale.width, h = this.scale.height, u = h / 360;
    this.u = u;
    const c = this.root = this.add.container(0, 0);
    const bg = this.add.tileSprite(0, 0, w, h, 'bgFar_spilje').setOrigin(0).setTileScale(h / 560).setAlpha(0.55);
    c.add(bg);
    this.bg = bg;
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.55); vignette.fillRect(0, 0, w, h);
    c.add(vignette);
    const hero = this.add.image(w * 0.24, h * 0.78, 'hero', 'idle0').setScale(u * 2.4 / RES);
    const tihi = this.add.image(w * 0.8, h * 0.74, 'tihi', 'idle1').setScale(u * 2.0 / RES).setFlipX(true).setAlpha(0.18).setTint(0x8888aa);
    const eyes = this.add.image(tihi.x - 9 * u * 2.0, tihi.y - 30 * u * 2.0, 'oci_tihi').setScale(u * 2.0 / RES).setFlipX(true).setBlendMode(Phaser.BlendModes.ADD);
    this.eyes = eyes;
    c.add([hero, tihi, eyes]);
    const title = this.add.text(w / 2, h * 0.26, 'PODZEMLJE', { fontFamily: FONT, fontSize: Math.round(54 * u) + 'px', color: '#e9dfc6', letterSpacing: 10 * u, stroke: '#000', strokeThickness: 6 * u }).setOrigin(0.5);
    const sv = Save.load() || {};
    const zi = Math.min(sv.level || 0, Level.count - 1);
    const has = !sv.done && !!(sv.cp || (sv.level || 0) > 0);
    let subTxt = sv.done ? 'sve zone prijeđene' : has ? `zona ${zi + 1} · ${THEMES[Level.build(zi).theme].name}` : 'sedam zona tame';
    let opts;
    if (this.mode === 'confirm') {
      subTxt = 'Nova igra briše spremljeni napredak. Sigurno?';
      opts = [['Da, kreni ispočetka', 'new'], ['Ne, natrag', 'back']];
    } else {
      opts = has ? [['Nastavi', 'continue'], ['Nova igra', 'askNew']] : [['Igraj', 'new']];
    }
    const sub = this.add.text(w / 2, h * 0.26 + 44 * u, subTxt, { fontFamily: FONT, fontStyle: 'italic', fontSize: Math.round(15 * u) + 'px', color: this.mode === 'confirm' ? '#f0c08a' : '#9fb3c8' }).setOrigin(0.5);
    c.add([title, sub]);
    this.buttons = [];
    opts.forEach(([label, act], i) => {
      const y = h * 0.56 + i * 56 * u;
      const r = this.add.rectangle(w / 2, y, 260 * u, 44 * u, 0xffffff, 0.07).setStrokeStyle(2 * u, 0xe9dfc6, 0.55);
      const t = this.add.text(w / 2, y, label, { fontFamily: FONT, fontSize: Math.round(19 * u) + 'px', color: '#e9dfc6' }).setOrigin(0.5);
      c.add([r, t]);
      this.buttons.push({ r, act });
    });
    this.sel = Math.min(this.sel || 0, this.buttons.length - 1); this.paintSel();
    const hint = this.add.text(w / 2, h - 18 * u, 'Najbolje sa slušalicama.  ·  Na računalu: W / S + Enter', { fontFamily: FONT, fontSize: Math.round(11 * u) + 'px', color: '#6f7d8c' }).setOrigin(0.5);
    c.add(hint);
  }

  update(t) {
    if (this.bg) this.bg.tilePositionX = t * 0.004;
    if (this.eyes) this.eyes.setAlpha(Math.sin(t / 700) > 0.9 ? 0 : 0.6 + Math.sin(t / 300) * 0.3);
  }
}

// Završetak igre — uvijek nakon izlaza iz zadnje zone
class EndScene extends Phaser.Scene {
  constructor() { super('End'); }
  create() {
    const w = this.scale.width, h = this.scale.height, u = this.u = h / 360;
    this.finished = false;
    this.cameras.main.setBackgroundColor('#05070b');
    this.makeTextures(w, h);
    this.add.image(0, 0, 'end_bg').setOrigin(0);
    const lc = { x: w * 0.8, y: h * 0.42 };
    this.light = this.add.image(lc.x, lc.y, 'end_light').setBlendMode(Phaser.BlendModes.ADD).setScale(h / 512 * 1.1);
    this.rays = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(0, 0, 'end_rock').setOrigin(0);
    this.motes = this.add.particles(0, 0, 'glow', {
      lifespan: 4000, speedX: { min: -30, max: -6 }, speedY: { min: -18, max: 8 }, scale: { start: 0.25 * u, end: 0 },
      alpha: { start: 0.7, end: 0 }, tint: [0xfff1c8, 0xffd27a, 0xffffff], blendMode: 'ADD', frequency: 90,
      emitZone: { type: 'random', source: new Phaser.Geom.Circle(lc.x, lc.y, h * 0.25) },
    });
    const groundY = h * 0.78;
    const hs = u * 2.6 / RES;
    const hero = this.hero = this.add.sprite(-30 * u, groundY - 15 * hs * RES, 'hero', 'run0').setScale(hs);
    hero.play('hero-run');
    SFX.init();
    // 1) moljac trči prema svjetlu
    const stepT = this.time.addEvent({ delay: 270, loop: true, callback: () => SFX.step(0.07) });
    this.tweens.add({
      targets: hero, x: w * 0.56, duration: 3200, ease: 'Linear',
      onComplete: () => {
        stepT.remove();
        hero.anims.stop(); hero.setFrame('idle0');
        // 2) zastane, ugasi svjetiljku — više mu ne treba
        this.time.delayedCall(700, () => { SFX.click(); hero.setFrame('dark'); });
        this.time.delayedCall(1500, () => {
          // 3) raširi krilca i odleti u svjetlost
          hero.play('hero-fly'); SFX.win();
          this.tweens.add({ targets: hero, x: lc.x, y: lc.y, scale: hs * 0.35, duration: 3000, ease: 'Sine.easeIn' });
          this.tweens.add({ targets: hero, alpha: 0, delay: 2200, duration: 800 });
          this.tweens.add({ targets: this.light, scale: h / 512 * 3.2, duration: 3400, ease: 'Sine.easeIn' });
          this.time.delayedCall(3000, () => this.finish());
        });
      },
    });
    const skip = () => { if (!this.finished && this.time.now - this.t0 > 800) this.finish(); };
    this.t0 = this.time.now;
    this.input.on('pointerup', (p) => { if (this.finished) this.tapMenu(p); else skip(); });
    this.input.keyboard.on('keydown', (e) => { if (this.finished) { if (e.code === 'Enter' || e.code === 'Space') { SFX.click(); this.scene.start('Title'); } } else skip(); });
  }

  makeTextures(w, h) {
    ['end_bg', 'end_rock', 'end_light'].forEach(k => { if (this.textures.exists(k)) this.textures.remove(k); });
    let t = this.textures.createCanvas('end_bg', w, h), c = t.getContext();
    let g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#05070b'); g.addColorStop(0.55, '#141a24'); g.addColorStop(1, '#3a3428');
    c.fillStyle = g; c.fillRect(0, 0, w, h); t.refresh();
    t = this.textures.createCanvas('end_light', 512, 512); c = t.getContext();
    g = c.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,248,220,0.95)'); g.addColorStop(0.45, 'rgba(255,214,140,0.45)'); g.addColorStop(1, 'rgba(255,190,110,0)');
    c.fillStyle = g; c.fillRect(0, 0, 512, 512); t.refresh();
    // stijene: ulaz u špilju koji se otvara prema svjetlu
    t = this.textures.createCanvas('end_rock', w, h); c = t.getContext();
    const R = Tiles.rng(99);
    c.fillStyle = '#07080c';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, h * 0.06);
    for (let x = w; x >= 0; x -= w / 24) c.lineTo(x, h * (0.08 + (x / w < 0.6 ? 0.1 : 0.02) + R() * 0.07) + (x / w > 0.62 ? -h * 0.1 * (x / w - 0.62) : 0));
    c.closePath(); c.fill();
    c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.78);
    for (let x = 0; x <= w * 0.66; x += w / 30) c.lineTo(x, h * 0.78 + R() * h * 0.015);
    c.lineTo(w * 0.7, h * 0.86); c.lineTo(w * 0.74, h); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,214,140,0.25)'; c.fillRect(w * 0.45, h * 0.778, w * 0.21, 2);
    c.fillStyle = '#07080c';
    for (let i = 0; i < 9; i++) { const x = w * (0.05 + i * 0.07), hh = h * (0.05 + R() * 0.12); c.beginPath(); c.moveTo(x - 10, h * 0.12); c.lineTo(x + 10, h * 0.12); c.lineTo(x, h * 0.12 + hh); c.closePath(); c.fill(); }
    t.refresh();
  }

  update(time) {
    if (this.finished || !this.rays) return;
    const w = this.scale.width, h = this.scale.height, cx = w * 0.8, cy = h * 0.42, t = time / 1000;
    this.rays.clear();
    for (let i = 0; i < 7; i++) {
      const a = -2.9 + i * 0.28 + Math.sin(t * 0.4 + i) * 0.05, len = h * 1.2, wd = 0.06;
      this.rays.fillStyle(0xfff1c8, 0.05 + 0.03 * Math.sin(t * 1.3 + i * 2));
      this.rays.fillTriangle(cx, cy, cx + Math.cos(a - wd) * len, cy + Math.sin(a - wd) * len, cx + Math.cos(a + wd) * len, cy + Math.sin(a + wd) * len);
    }
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.cameras.main.fadeOut(900, 255, 250, 238);
    this.time.delayedCall(950, () => {
      this.children.removeAll(true);
      this.tweens.killAll();
      const w = this.scale.width, h = this.scale.height, u = this.u;
      // svijetli završni ekran — nebo
      if (this.textures.exists('end_sky')) this.textures.remove('end_sky');
      const t = this.textures.createCanvas('end_sky', w, h), c = t.getContext();
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#bfe0f5'); g.addColorStop(0.55, '#fdf3dc'); g.addColorStop(1, '#ffe2b8');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const sun = c.createRadialGradient(w * 0.5, h * 0.95, 0, w * 0.5, h * 0.95, h * 0.6);
      sun.addColorStop(0, 'rgba(255,255,255,0.9)'); sun.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = sun; c.fillRect(0, 0, w, h);
      t.refresh();
      this.add.image(0, 0, 'end_sky').setOrigin(0);
      const moth = this.add.sprite(w * 0.5, h * 0.2, 'hero', 'fly0').setScale(u * 0.9 / RES).setAlpha(0.8).play('hero-fly');
      this.tweens.add({ targets: moth, x: w * 0.62, y: h * 0.12, duration: 6000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(w / 2, h * 0.36, 'Vidiš nebo.', { fontFamily: FONT, fontSize: Math.round(42 * u) + 'px', color: '#2a2a35' }).setOrigin(0.5);
      this.add.text(w / 2, h * 0.36 + 52 * u, 'Moljac je izašao na svjetlo.\nPodzemlje je ostalo ispod njega… zasad.', { fontFamily: FONT, fontStyle: 'italic', align: 'center', fontSize: Math.round(16 * u) + 'px', color: '#5a5a66', lineSpacing: 6 * u }).setOrigin(0.5);
      this.add.text(w / 2, h * 0.62, 'K R A J', { fontFamily: FONT, fontSize: Math.round(15 * u) + 'px', color: '#8a7a60' }).setOrigin(0.5);
      this.menuBtn = this.add.rectangle(w / 2, h * 0.78, 240 * u, 44 * u, 0xffffff, 0.55).setStrokeStyle(2 * u, 0x2a2a35, 0.7);
      this.add.text(w / 2, h * 0.78, 'Izbornik', { fontFamily: FONT, fontSize: Math.round(20 * u) + 'px', color: '#2a2a35' }).setOrigin(0.5);
      this.cameras.main.fadeIn(1200, 255, 250, 238);
      SFX.save();
    });
  }

  tapMenu(p) {
    if (this.menuBtn && this.menuBtn.getBounds().contains(p.x, p.y)) { SFX.click(); this.scene.start('Title'); }
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#05070b',
  width: Math.round(window.innerWidth * DPR),
  height: Math.round(window.innerHeight * DPR),
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 900 }, debug: false } },
  input: { activePointers: 4 },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [BootScene, TitleScene, GameScene, UIScene, EndScene],
});

let resizeT = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => game.scale.setGameSize(Math.round(window.innerWidth * DPR), Math.round(window.innerHeight * DPR)), 150);
});

// Ažuriranje: nova verzija se provjeri pri svakom pokretanju i kad se app vrati u prvi plan.
// Kad stigne, igra se sama osvježi — ali samo na naslovnom ekranu, nikad usred igranja.
if ('serviceWorker' in navigator) {
  let updatePending = false;
  const hadController = !!navigator.serviceWorker.controller;
  const applyUpdate = () => {
    if (game.scene.isActive('Title')) location.reload();
    else updatePending = true;
  };
  window.__checkUpdate = () => { if (updatePending) location.reload(); };
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) applyUpdate(); });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
      reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
  });
}
