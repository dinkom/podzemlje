// Noćnik — pokretanje, naslovni ekran, prijelazi između svjetova, kraj
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
      const grid = this.mode === 'zones' ? 4 : this.mode === 'worlds' ? 3 : 1;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.sel = Math.max(0, this.sel - grid);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.sel = Math.min(n - 1, this.sel + grid);
      else if (grid > 1 && (e.code === 'ArrowLeft' || e.code === 'KeyA')) this.sel = Math.max(0, this.sel - 1);
      else if (grid > 1 && (e.code === 'ArrowRight' || e.code === 'KeyD')) this.sel = Math.min(n - 1, this.sel + 1);
      else if (e.code === 'Enter' || e.code === 'Space') { this.choose(this.buttons[this.sel].act); return; }
      else if (e.code === 'Escape' && this.mode !== 'main') { this.choose('back'); return; }
      else return;
      SFX.click(); this.paintSel();
    });
  }

  choose(act) {
    if (this.starting) return;
    SFX.init(); SFX.click();
    if (act === 'askNew') { this.mode = 'confirm'; this.sel = 1; this.build(); return; }
    if (act === 'back') { this.mode = this.mode === 'zones' ? 'worlds' : 'main'; this.sel = 0; this.build(); return; }
    if (act === 'worlds') { this.mode = 'worlds'; this.sel = 0; this.build(); return; }
    if (act.startsWith('world:')) { this.world = +act.slice(6); this.mode = 'zones'; this.sel = 0; this.build(); return; }
    if (act === 'locked') return;
    if (act === 'install') {
      if (!installEvt) return;
      const ev = installEvt;
      ev.prompt();
      ev.userChoice.then(() => { installEvt = null; this.build(); }).catch(() => {});
      return;
    }
    this.starting = true;
    if (act === 'new') Save.clear();
    if (act.startsWith('zone:')) Save.store(Save.fresh(+act.slice(5)));
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(520, () => {
      this.scene.launch('UI');
      this.scene.start('Game');
      this.scene.bringToTop('UI');
    });
  }

  paintSel() {
    (this.buttons || []).forEach((b, i) => b.r.setFillStyle(0xffffff, i === this.sel ? 0.2 : b.act === 'locked' ? 0.03 : 0.07).setStrokeStyle(2 * this.u, 0xe9dfc6, i === this.sel ? 1 : b.act === 'locked' ? 0.15 : 0.55));
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
    const title = this.add.text(w / 2, h * 0.26, 'NOĆNIK', { fontFamily: FONT, fontSize: Math.round(58 * u) + 'px', color: '#e9dfc6', letterSpacing: 12 * u, stroke: '#000', strokeThickness: 6 * u }).setOrigin(0.5);
    const sv = Save.load() || {};
    const prog = Progress.load();
    const W = Level.worlds;
    const zi = Math.min(sv.level || 0, Level.count - 1);
    const has = !sv.done && !!(sv.cp || (sv.level || 0) > 0);
    const canPick = prog.max > 0 || prog.done || Dev.on;
    const zoneLabel = (i) => { const wi = Level.worldOf(i); return `${W[wi].name} · zona ${W[wi].zones.indexOf(i) + 1}`; };
    let subTxt = has ? `${zoneLabel(zi)} · ${THEMES[Level.build(zi).theme].name}` : prog.worldsDone > 0 ? `${W[prog.worldsDone - 1].name} prijeđeno` : 'tri svijeta tame';
    let opts;
    this.buttons = [];
    const box = (x, y, bw, bh, l1, l2, act, open) => {
      const r = this.add.rectangle(x, y, bw, bh, 0xffffff, 0.07).setStrokeStyle(2 * u, 0xe9dfc6, open ? 0.55 : 0.15);
      const t = this.add.text(x, y - 8 * u, l1, { fontFamily: FONT, fontSize: Math.round(13 * u) + 'px', color: open ? '#9fb3c8' : '#4a525c' }).setOrigin(0.5);
      const t2 = this.add.text(x, y + 9 * u, l2, { fontFamily: FONT, fontStyle: open ? 'normal' : 'italic', fontSize: Math.round(15 * u) + 'px', color: open ? '#e9dfc6' : '#4a525c' }).setOrigin(0.5);
      c.add([r, t, t2]);
      this.buttons.push({ r, act: open ? act : 'locked' });
    };
    const backBtn = (y) => {
      const r = this.add.rectangle(w / 2, y, 200 * u, 40 * u, 0xffffff, 0.07).setStrokeStyle(2 * u, 0xe9dfc6, 0.55);
      c.add([r, this.add.text(w / 2, y, 'Natrag', { fontFamily: FONT, fontSize: Math.round(17 * u) + 'px', color: '#e9dfc6' }).setOrigin(0.5)]);
      this.buttons.push({ r, act: 'back' });
    };
    if (this.mode === 'confirm') {
      subTxt = 'Nova igra kreće od prve zone. Otključane zone ostaju.';
      opts = [['Da, kreni ispočetka', 'new'], ['Ne, natrag', 'back']];
    } else if (this.mode === 'worlds') {
      subTxt = 'Odaberi svijet';
      opts = null;
      const cw = Math.min(210 * u, (w - 30 * u) / 3);
      W.forEach((wd, k) => {
        const ready = wd.zones.length > 0;
        const open = ready && (k === 0 || prog.worldsDone >= k || Dev.on);
        box(w / 2 + (k - 1) * cw, h * 0.52, cw - 14 * u, 64 * u, `svijet ${k + 1}`, ready ? (open ? wd.name : 'zaključano') : `${wd.name} — uskoro`, 'world:' + k, open);
      });
      backBtn(h * 0.52 + 76 * u);
    } else if (this.mode === 'zones') {
      const wd = W[this.world || 0];
      subTxt = `${wd.name} · odaberi zonu`;
      opts = null;
      wd.zones.forEach((i, n) => {
        const open = i <= prog.max || prog.done || Dev.on;
        const col = n % 4, row = Math.floor(n / 4);
        const cw = Math.min(168 * u, (w - 30 * u) / 4);
        box(w / 2 + (col - 1.5) * cw, h * 0.5 + row * 62 * u, cw - 12 * u, 50 * u, `${n + 1}`, open ? THEMES[Level.build(i).theme].name : 'zaključano', 'zone:' + i, open);
      });
      backBtn(h * 0.5 + 2 * 62 * u);
    } else {
      opts = [];
      if (has) opts.push(['Nastavi', 'continue']);
      if (canPick) opts.push(['Odaberi svijet', 'worlds']);
      if (has) opts.push(['Nova igra', 'askNew']);
      else opts.push([prog.worldsDone > 0 ? 'Igraj ponovno' : prog.max > 0 ? 'Nova igra' : 'Igraj', 'new']);
      if (installEvt && !isStandalone()) opts.push(['Instaliraj igru', 'install']);
    }
    const sub = this.add.text(w / 2, h * 0.26 + 46 * u, subTxt, { fontFamily: FONT, fontStyle: 'italic', fontSize: Math.round(15 * u) + 'px', color: this.mode === 'confirm' ? '#f0c08a' : '#9fb3c8' }).setOrigin(0.5);
    c.add([title, sub]);
    if (opts) opts.forEach(([label, act], i) => {
      const y = h * 0.52 + i * 52 * u;
      const r = this.add.rectangle(w / 2, y, 260 * u, 42 * u, 0xffffff, 0.07).setStrokeStyle(2 * u, 0xe9dfc6, 0.55);
      const t = this.add.text(w / 2, y, label, { fontFamily: FONT, fontSize: Math.round(19 * u) + 'px', color: '#e9dfc6' }).setOrigin(0.5);
      c.add([r, t]);
      this.buttons.push({ r, act });
    });
    if (Dev.on) c.add(this.add.text(w - 14 * u, 14 * u, 'DEV', { fontFamily: 'monospace', fontStyle: 'bold', fontSize: Math.round(11 * u) + 'px', color: '#1b1410', backgroundColor: '#ffd25a', padding: { x: 6, y: 3 } }).setOrigin(1, 0));
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

// Instalacija kao aplikacija: Chrome javi kad je moguća, a mi pokažemo svoj gumb u izborniku
// Prijelaz nakon zadnje zone svijeta (Podzemlje → Šuma …)
class TransitionScene extends Phaser.Scene {
  constructor(key = 'Transition') { super(key); }
  create(data) {
    this.world = data && data.world || 0;
    const w = this.scale.width, h = this.scale.height, u = this.u = h / 360;
    this.finished = false; this.phase = 1;
    this.cameras.main.setBackgroundColor('#03050a');
    SFX.init();
    this.makeSky(w, h);
    // ---- 1. dio: izlaz iz špilje u noć ----
    this.p1 = this.add.container(0, 0);
    const sky = this.add.image(0, 0, 'tr_sky').setOrigin(0);
    const moon = this.add.image(w * 0.8, h * 0.3, 'tr_moon').setScale(h * 0.32 / 256);
    const glow = this.add.image(moon.x, moon.y, 'end_glowtex').setBlendMode(Phaser.BlendModes.ADD).setScale(h / 256 * 0.9).setAlpha(0.35).setTint(0xbcd4ff);
    const cave = this.add.image(0, 0, 'tr_cave').setOrigin(0);
    this.p1.add([sky, glow, moon, cave]);
    const groundY = h * 0.78, hs = u * 2.6 / RES;
    const hero = this.add.sprite(-30 * u, groundY - 15 * hs * RES, 'hero', 'run0').setScale(hs).play('hero-run');
    this.p1.add(hero);
    const steps = this.time.addEvent({ delay: 270, loop: true, callback: () => SFX.step(0.07) });
    this.tweens.add({
      targets: hero, x: w * 0.6, duration: 3000,
      onComplete: () => {
        steps.remove(); hero.anims.stop(); hero.setFrame('idle0');
        this.time.delayedCall(600, () => { SFX.click(); hero.setFrame('dark'); });
        this.time.delayedCall(1300, () => {
          hero.play('hero-fly'); SFX.win();
          this.tweens.add({ targets: hero, x: w * 0.95, y: h * 0.12, scale: hs * 0.5, duration: 2200, ease: 'Sine.easeIn' });
          this.time.delayedCall(2000, () => this.phase2());
        });
      },
    });
    const skip = () => { if (!this.finished && this.time.now - this.t0 > 800) this.finish(); };
    this.t0 = this.time.now;
    this.input.on('pointerup', (p) => { if (this.finished) this.tapBtn(p); else skip(); });
    this.input.keyboard.on('keydown', (e) => {
      if (!this.finished) { skip(); return; }
      if (e.code === 'Enter' || e.code === 'Space') this.choose(this.btns[0].act);
    });
  }

  makeSky(w, h) {
    ['tr_sky', 'tr_cave', 'tr_moon', 'tr_forest', 'end_glowtex'].forEach(k => { if (this.textures.exists(k)) this.textures.remove(k); });
    const R = Tiles.rng(7);
    let t = this.textures.createCanvas('tr_sky', w, h), c = t.getContext();
    let g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#060b1c'); g.addColorStop(0.6, '#16264a'); g.addColorStop(1, '#2a3c60');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.7})`; const r = R() < 0.9 ? 0.6 : 1.3; c.beginPath(); c.arc(R() * w, R() * h * 0.75, r * (h / 360), 0, Math.PI * 2); c.fill(); }
    t.refresh();
    t = this.textures.createCanvas('tr_moon', 256, 256); c = t.getContext();
    g = c.createRadialGradient(110, 100, 10, 128, 128, 120);
    g.addColorStop(0, '#fffdf0'); g.addColorStop(0.7, '#ece6c8'); g.addColorStop(1, '#cfc7a2');
    c.fillStyle = g; c.beginPath(); c.arc(128, 128, 118, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(160,150,120,0.35)';
    [[90, 90, 18], [160, 120, 26], [120, 175, 14], [175, 70, 10], [70, 150, 9]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
    t.refresh();
    t = this.textures.createCanvas('end_glowtex', 256, 256); c = t.getContext();
    g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256); t.refresh();
    // špilja s otvorom prema noćnom nebu
    t = this.textures.createCanvas('tr_cave', w, h); c = t.getContext();
    c.fillStyle = '#06070b'; c.fillRect(0, 0, w, h);
    g = c.createLinearGradient(0, 0, w * 0.6, 0); g.addColorStop(0, '#05070b'); g.addColorStop(1, '#101828');
    c.fillStyle = g; c.fillRect(0, h * 0.15, w * 0.6, h * 0.63);
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.moveTo(w * 0.62, h * 0.82);
    const pts = [[0.6, 0.6], [0.62, 0.38], [0.66, 0.2], [0.74, 0.1], [0.86, 0.06], [1.02, 0.04], [1.02, 0.9], [0.8, 0.88]];
    pts.forEach(([x, y]) => c.lineTo(w * x + (R() - 0.5) * 10, h * y + (R() - 0.5) * 10));
    c.closePath(); c.fill();
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#06070b';
    c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.78);
    for (let x = 0; x <= w * 0.7; x += w / 30) c.lineTo(x, h * 0.78 + R() * h * 0.012);
    c.lineTo(w * 0.78, h * 0.9); c.lineTo(w * 0.84, h); c.closePath(); c.fill();
    c.fillStyle = 'rgba(170,200,255,0.18)'; c.fillRect(w * 0.42, h * 0.778, w * 0.27, 2);
    for (let i = 0; i < 8; i++) { const x = w * (0.04 + i * 0.07), hh = h * (0.05 + R() * 0.1); c.beginPath(); c.moveTo(x - 10, h * 0.14); c.lineTo(x + 10, h * 0.14); c.lineTo(x, h * 0.14 + hh); c.closePath(); c.fill(); }
    t.refresh();
    // šuma: slojevi silueta borova
    t = this.textures.createCanvas('tr_forest', w, h); c = t.getContext();
    const layer = (base, tall, col, step) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, h);
      for (let x = -step; x <= w + step; x += step) {
        const th = tall * (0.6 + R() * 0.6), bw = step * (0.6 + R() * 0.3);
        c.lineTo(x - bw, base); c.lineTo(x - bw * 0.55, base - th * 0.45); c.lineTo(x - bw * 0.7, base - th * 0.45);
        c.lineTo(x - bw * 0.3, base - th * 0.75); c.lineTo(x - bw * 0.45, base - th * 0.75); c.lineTo(x, base - th);
        c.lineTo(x + bw * 0.45, base - th * 0.75); c.lineTo(x + bw * 0.3, base - th * 0.75); c.lineTo(x + bw * 0.7, base - th * 0.45);
        c.lineTo(x + bw * 0.55, base - th * 0.45); c.lineTo(x + bw, base);
      }
      c.lineTo(w, h); c.closePath(); c.fill();
    };
    layer(h * 0.78, h * 0.28, '#132040', w / 14);
    const mist = c.createLinearGradient(0, h * 0.7, 0, h * 0.85); mist.addColorStop(0, 'rgba(150,170,210,0)'); mist.addColorStop(1, 'rgba(150,170,210,0.18)');
    c.fillStyle = mist; c.fillRect(0, h * 0.7, w, h * 0.15);
    layer(h * 0.88, h * 0.36, '#0a1328', w / 10);
    layer(h * 1.0, h * 0.42, '#040810', w / 7);
    t.refresh();
  }

  // ---- 2. dio: let preko mjeseca do ruba šume ----
  phase2() {
    if (this.finished || this.phase !== 1) return;
    this.phase = 2;
    const w = this.scale.width, h = this.scale.height, u = this.u;
    this.cameras.main.fadeOut(400, 3, 5, 10);
    this.time.delayedCall(420, () => {
      if (this.finished) return;
      this.p1.destroy(true);
      this.add.image(0, 0, 'tr_sky').setOrigin(0);
      const mx = w * 0.6, my = h * 0.36, mr = h * 0.26;
      this.add.image(mx, my, 'end_glowtex').setBlendMode(Phaser.BlendModes.ADD).setScale(h / 256 * 1.6).setAlpha(0.3).setTint(0xbcd4ff);
      this.add.image(mx, my, 'tr_moon').setScale(mr * 2 / 236);
      this.add.image(0, 0, 'tr_forest').setOrigin(0);
      this.flies = this.add.particles(0, 0, 'glow', {
        lifespan: 2500, speedX: { min: -8, max: 8 }, speedY: { min: -10, max: 4 }, scale: { start: 0.12 * u, end: 0 },
        alpha: { start: 0.9, end: 0 }, tint: [0xd8ff7a, 0xfff2a0], blendMode: 'ADD', frequency: 140,
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, h * 0.72, w, h * 0.25) },
      });
      // moljac kao silueta preleti preko mjeseca
      const m = this.add.sprite(w * 0.08, h * 0.75, 'hero', 'fly0').setScale(u * 1.6 / RES).setTint(0x0a1020).play('hero-fly');
      const path = new Phaser.Curves.CubicBezier(new Phaser.Math.Vector2(w * 0.08, h * 0.75), new Phaser.Math.Vector2(w * 0.35, h * 0.1), new Phaser.Math.Vector2(w * 0.7, h * 0.2), new Phaser.Math.Vector2(w * 0.88, h * 0.62));
      const tw = { t: 0 };
      this.tweens.add({ targets: tw, t: 1, duration: 4200, ease: 'Sine.easeInOut', onUpdate: () => { const pt = path.getPoint(tw.t); m.setPosition(pt.x, pt.y); m.setFlipX(false); } });
      this.cameras.main.fadeIn(600, 3, 5, 10);
      SFX.hoot(1.6);
      this.time.delayedCall(4300, () => this.finish());
    });
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    if (this.phase === 1) { this.phase = 2; this.p1.destroy(true); this.add.image(0, 0, 'tr_sky').setOrigin(0); this.add.image(this.scale.width * 0.6, this.scale.height * 0.36, 'tr_moon').setScale(this.scale.height * 0.52 / 236); this.add.image(0, 0, 'tr_forest').setOrigin(0); }
    const w = this.scale.width, h = this.scale.height, u = this.u;
    const next = Level.worlds[this.world + 1];
    const shade = this.add.rectangle(0, 0, w, h, 0x000000, 0).setOrigin(0);
    this.tweens.add({ targets: shade, fillAlpha: 0.45, duration: 800 });
    const items = [];
    items.push(this.add.text(w / 2, h * 0.3, `SVIJET ${this.world + 2}`, { fontFamily: FONT, fontSize: Math.round(16 * u) + 'px', color: '#bcd4ff', letterSpacing: 6 * u }).setOrigin(0.5));
    items.push(this.add.text(w / 2, h * 0.3 + 40 * u, next ? next.name : '', { fontFamily: FONT, fontSize: Math.round(44 * u) + 'px', color: '#f3f0dc', stroke: '#000', strokeThickness: 5 * u }).setOrigin(0.5));
    const ready = next && next.zones.length > 0;
    items.push(this.add.text(w / 2, h * 0.3 + 84 * u, ready ? 'Noć je tek počela.' : 'Nastavlja se…', { fontFamily: FONT, fontStyle: 'italic', fontSize: Math.round(16 * u) + 'px', color: '#bcd4ff' }).setOrigin(0.5));
    this.btns = [];
    const mk = (y, label, act) => {
      const r = this.add.rectangle(w / 2, y, 240 * u, 44 * u, 0xffffff, 0.08).setStrokeStyle(2 * u, 0xf3f0dc, 0.6);
      const t = this.add.text(w / 2, y, label, { fontFamily: FONT, fontSize: Math.round(19 * u) + 'px', color: '#f3f0dc' }).setOrigin(0.5);
      items.push(r, t); this.btns.push({ r, act });
    };
    if (ready) mk(h * 0.72, 'Dalje', 'go');
    mk(h * 0.72 + (ready ? 54 * u : 0), 'Izbornik', 'menu');
    items.forEach(o => { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 900, delay: 300 }); });
    SFX.save();
  }

  tapBtn(p) { const b = (this.btns || []).find(b => b.r.getBounds().contains(p.x, p.y)); if (b) this.choose(b.act); }

  choose(act) {
    SFX.click();
    if (act === 'go') { this.scene.launch('UI'); this.scene.start('Game'); this.scene.bringToTop('UI'); }
    else this.scene.start('Title');
  }
}

// kraj zadnje gotove zone svijeta koji još nije dovršen
class SoonScene extends TransitionScene {
  constructor() { super('Soon'); }
  create(data) {
    this.world = data && data.world || 0;
    const w = this.scale.width, h = this.scale.height, u = this.u = h / 360;
    this.finished = true; this.phase = 2;
    SFX.init();
    this.makeSky(w, h);
    this.add.image(0, 0, 'tr_sky').setOrigin(0);
    const moon = this.add.image(w * 0.62, h * 0.34, 'tr_moon').setScale(h * 0.5 / 236);
    this.add.image(0, 0, 'tr_forest').setOrigin(0);
    // Huk na mjesecu
    const huk = this.add.image(moon.x + 46 * u, moon.y + 38 * u, 'huk', 'stand0').setScale(1.6 * u / RES).setTint(0x000000).setAlpha(0);
    const hg = this.add.image(huk.x + 1.6 * u, huk.y - 38 * 1.6 * u, 'huk_glava', 'front').setScale(1.6 * u / RES).setTint(0x000000).setAlpha(0);
    const ey = this.add.image(hg.x, hg.y, 'oci_huk').setScale(1.6 * u / RES).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    huk.setOrigin(0.5, 0.5);
    this.tweens.add({ targets: [huk, hg], alpha: 1, duration: 2500, delay: 600 });
    this.tweens.add({ targets: ey, alpha: 1, duration: 300, delay: 3200, onStart: () => SFX.hoot() });
    const shade = this.add.rectangle(0, 0, w, h, 0x000000, 0.35).setOrigin(0);
    const W = Level.worlds[this.world];
    const items = [];
    items.push(this.add.text(w / 2, h * 0.16, `SVIJET ${this.world + 1}`, { fontFamily: FONT, fontSize: Math.round(16 * u) + 'px', color: '#bcd4ff', letterSpacing: 6 * u }).setOrigin(0.5));
    items.push(this.add.text(w / 2, h * 0.16 + 38 * u, W.name, { fontFamily: FONT, fontSize: Math.round(40 * u) + 'px', color: '#f3f0dc', stroke: '#000', strokeThickness: 5 * u }).setOrigin(0.5));
    items.push(this.add.text(w / 2, h * 0.16 + 78 * u, 'Nastavlja se… Huk te još čeka.', { fontFamily: FONT, fontStyle: 'italic', fontSize: Math.round(16 * u) + 'px', color: '#bcd4ff' }).setOrigin(0.5));
    this.btns = [];
    const r = this.add.rectangle(w / 2, h * 0.84, 240 * u, 44 * u, 0x000000, 0.4).setStrokeStyle(2 * u, 0xf3f0dc, 0.6);
    const t = this.add.text(w / 2, h * 0.84, 'Izbornik', { fontFamily: FONT, fontSize: Math.round(19 * u) + 'px', color: '#f3f0dc' }).setOrigin(0.5);
    items.push(r, t); this.btns.push({ r, act: 'menu' });
    items.forEach(o => { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 900, delay: 300 }); });
    this.t0 = this.time.now;
    this.input.on('pointerup', (p) => { if (this.time.now - this.t0 > 700) this.tapBtn(p); });
    this.input.keyboard.on('keydown', (e) => { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') { SFX.click(); this.scene.start('Title'); } });
    SFX.win();
    this.cameras.main.fadeIn(900, 0, 0, 0);
  }
  update() {}
}

let installEvt = null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const refreshTitle = () => { const t = window.game && game.scene.getScene('Title'); if (t && t.sys.isActive()) t.build(); };
window.addEventListener('beforeinstallprompt', (e) => { installEvt = e; refreshTitle(); });
window.addEventListener('appinstalled', () => { installEvt = null; refreshTitle(); });

Dev.checkUrl().then(() => { const t = game.scene.getScene('Title'); if (t && t.sys.isActive()) t.build(); });

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
  scene: [BootScene, TitleScene, GameScene, UIScene, EndScene, TransitionScene, SoonScene],
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
