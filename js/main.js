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

class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    if (window.__checkUpdate) window.__checkUpdate();
    this.cameras.main.setBackgroundColor('#05070b');
    this.build();
    this.scale.on('resize', this.build, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.build, this));
    this.sel = 0; this.starting = false;
    const start = (act) => {
      if (this.starting) return; this.starting = true;
      SFX.init(); SFX.click();
      if (act === 'new') Save.clear();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => {
        this.scene.launch('UI');
        this.scene.start('Game');
        this.scene.bringToTop('UI');
      });
    };
    this.input.on('pointerup', (p) => {
      SFX.init();
      if (p.wasTouch) goFullscreen(this);
      const hit = (this.buttons || []).find(b => b.r.getBounds().contains(p.x, p.y));
      if (hit) start(hit.act);
    });
    this.input.keyboard.on('keydown', (e) => {
      SFX.init();
      const n = this.buttons.length;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.sel = (this.sel + n - 1) % n;
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.sel = (this.sel + 1) % n;
      else if (e.code === 'Enter' || e.code === 'Space') { start(this.buttons[this.sel].act); return; }
      else return;
      SFX.click(); this.paintSel();
    });
  }

  paintSel() {
    (this.buttons || []).forEach((b, i) => b.r.setFillStyle(0xffffff, i === this.sel ? 0.2 : 0.07).setStrokeStyle(2 * this.u, 0xe9dfc6, i === this.sel ? 1 : 0.55));
  }

  build() {
    if (this.root) this.root.destroy(true);
    const w = this.scale.width, h = this.scale.height, u = h / 360;
    const c = this.root = this.add.container(0, 0);
    const bg = this.add.tileSprite(0, 0, w, h, 'bgFar_spilje').setOrigin(0).setTileScale(h / 560).setAlpha(0.55);
    c.add(bg);
    this.bg = bg;
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.55); vignette.fillRect(0, 0, w, h);
    c.add(vignette);
    // junak drži svjetiljku, Tihi viri iz mraka
    const hero = this.add.image(w * 0.24, h * 0.78, 'hero', 'idle0').setScale(u * 2.4 / RES);
    const tihi = this.add.image(w * 0.8, h * 0.74, 'tihi', 'idle1').setScale(u * 2.0 / RES).setFlipX(true).setAlpha(0.18).setTint(0x8888aa);
    const eyes = this.add.image(tihi.x - 9 * u * 2.0, tihi.y - 30 * u * 2.0, 'oci_tihi').setScale(u * 2.0 / RES).setFlipX(true).setBlendMode(Phaser.BlendModes.ADD);
    this.eyes = eyes;
    c.add([hero, tihi, eyes]);
    const title = this.add.text(w / 2, h * 0.26, 'PODZEMLJE', { fontFamily: FONT, fontSize: Math.round(54 * u) + 'px', color: '#e9dfc6', letterSpacing: 10 * u, stroke: '#000', strokeThickness: 6 * u }).setOrigin(0.5);
    const sv = Save.load() || {};
    const zi = Math.min(sv.level || 0, Level.count - 1);
    const subTxt = sv.done ? 'sve zone prijeđene' : (sv.cp || zi > 0) ? `zona ${zi + 1} · ${THEMES[Level.build(zi).theme].name}` : 'četiri zone tame';
    const sub = this.add.text(w / 2, h * 0.26 + 44 * u, subTxt, { fontFamily: FONT, fontStyle: 'italic', fontSize: Math.round(15 * u) + 'px', color: '#9fb3c8' }).setOrigin(0.5);
    c.add([title, sub]);
    this.buttons = [];
    const has = !sv.done && !!(sv.cp || (sv.level || 0) > 0);
    const opts = has ? [['Nastavi', 'continue'], ['Nova igra', 'new']] : [['Igraj', 'new']];
    opts.forEach(([label, act], i) => {
      const y = h * 0.56 + i * 56 * u;
      const r = this.add.rectangle(w / 2, y, 240 * u, 44 * u, 0xffffff, 0.07).setStrokeStyle(2 * u, 0xe9dfc6, 0.55);
      const t = this.add.text(w / 2, y, label, { fontFamily: FONT, fontSize: Math.round(20 * u) + 'px', color: '#e9dfc6' }).setOrigin(0.5);
      c.add([r, t]);
      this.buttons.push({ r, act });
    });
    this.u = u; this.sel = Math.min(this.sel || 0, this.buttons.length - 1); this.paintSel();
    const hint = this.add.text(w / 2, h - 18 * u, 'Najbolje sa slušalicama.  ·  Na računalu: W / S + Enter', { fontFamily: FONT, fontSize: Math.round(11 * u) + 'px', color: '#6f7d8c' }).setOrigin(0.5);
    c.add(hint);
  }

  update(t) {
    if (this.bg) this.bg.tilePositionX = t * 0.004;
    if (this.eyes) this.eyes.setAlpha(Math.sin(t / 700) > 0.9 ? 0 : 0.6 + Math.sin(t / 300) * 0.3);
  }
}

class EndScene extends Phaser.Scene {
  constructor() { super('End'); }
  create() {
    const w = this.scale.width, h = this.scale.height, u = h / 360;
    this.cameras.main.setBackgroundColor('#0b1018');
    this.cameras.main.fadeIn(900, 230, 245, 255);
    this.add.text(w / 2, h * 0.34, 'Vidiš nebo.', { fontFamily: FONT, fontSize: Math.round(40 * u) + 'px', color: '#e9dfc6' }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.34 + 46 * u, 'Prošao si sve četiri zone podzemlja.\nTihi je ostao dolje… zasad.', { fontFamily: FONT, fontStyle: 'italic', align: 'center', fontSize: Math.round(17 * u) + 'px', color: '#9fb3c8' }).setOrigin(0.5);
    const r = this.add.rectangle(w / 2, h * 0.74, 240 * u, 44 * u, 0xffffff, 0.07).setStrokeStyle(2 * u, 0xe9dfc6, 0.55);
    this.add.text(w / 2, h * 0.74, 'Izbornik', { fontFamily: FONT, fontSize: Math.round(20 * u) + 'px', color: '#e9dfc6' }).setOrigin(0.5);
    this.input.on('pointerup', (p) => { if (r.getBounds().contains(p.x, p.y)) { SFX.click(); this.scene.start('Title'); } });
    this.input.keyboard.on('keydown-ENTER', () => { SFX.click(); this.scene.start('Title'); });
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
