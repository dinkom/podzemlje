// Podzemlje — dodirne kontrole i HUD (landscape, mobitel)
const FONT = 'Georgia, "Times New Roman", serif';

class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.input.addPointer(3);
    this.g = this.add.graphics();
    this.btn = {
      jump: { r: 46, pid: null }, attack: { r: 36, pid: null }, flash: { r: 31, pid: null },
      context: { r: 34, pid: null }, pause: { r: 20, pid: null },
    };
    this.joy = { pid: null, bx: 0, by: 0, kx: 0, ky: 0 };
    this.ctxText = this.add.text(0, 0, '', { fontFamily: FONT, fontStyle: 'bold', color: '#f3ead2', align: 'center' }).setOrigin(0.5);
    this.toastText = this.add.text(0, 0, '', { fontFamily: FONT, color: '#f3ead2', align: 'center', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0);
    this.overlay = null;
    this.layout();
    this.scale.on('resize', this.layout, this);

    // touch kontrole samo na uređajima s dodirom; tipkovnica ih skriva
    this.touchMode = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches;
    this.input.keyboard.on('keydown', this.keyDown, this);
    this.keyHint = this.add.text(0, 0, '', { fontFamily: FONT, color: '#f3ead2', align: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: { x: 10, y: 6 } }).setOrigin(0.5).setVisible(false);
    this.layout();
    this.input.on('pointerdown', this.down, this);
    this.input.on('pointermove', this.move, this);
    this.input.on('pointerup', this.up, this);
    this.input.on('pointerupoutside', this.up, this);

    this.onVis = () => {
      if (document.hidden) { SFX.suspend(); if (this.gameRef && this.scene.isActive('Game') && !this.overlay) this.openPause(); }
      else SFX.resume();
    };
    document.addEventListener('visibilitychange', this.onVis);
    this.game.events.on('blur', () => this.releaseAll());
    this.events.once('shutdown', () => {
      document.removeEventListener('visibilitychange', this.onVis);
      this.scale.off('resize', this.layout, this);
    });
  }

  bind(gameScene) { this.gameRef = gameScene; this.closeOverlay(false); this.releaseAll(); }

  layout() {
    const w = this.scale.width, h = this.scale.height;
    const u = this.u = h / 360;
    const B = this.btn;
    const set = (b, x, y) => { b.x = x; b.y = y; b.R = b.r * u; };
    set(B.jump, w - 74 * u, h - 72 * u);
    set(B.attack, w - 178 * u, h - 52 * u);
    set(B.flash, w - 92 * u, h - 178 * u);
    set(B.context, w - 196 * u, h - 150 * u);
    set(B.pause, w - 32 * u, 30 * u);
    this.ctxText.setPosition(B.context.x, B.context.y).setFontSize(Math.round(12 * u)).setWordWrapWidth(B.context.R * 1.9);
    if (this.keyHint) this.keyHint.setPosition(w / 2, h - 40 * u).setFontSize(Math.round(16 * u));
    this.toastText.setPosition(w / 2, 62 * u).setFontSize(Math.round(17 * u)).setWordWrapWidth(w * 0.7);
    if (this.overlay && this.overlay.relayout) this.overlay.relayout();
  }

  hitBtn(x, y) {
    const hud = this.registry.get('context');
    for (const k of ['pause', 'jump', 'attack', 'flash', 'context']) {
      const b = this.btn[k];
      if (k === 'context' && !hud) continue;
      if (Phaser.Math.Distance.Between(x, y, b.x, b.y) < b.R * 1.25) return k;
    }
    return null;
  }

  keyDown(e) {
    if (this.touchMode) { this.touchMode = false; this.releaseAll(); }
    const ov = this.overlay;
    if (!ov) return;
    const k = e.code;
    if (ov.kind === 'note') {
      if (['Space', 'Enter', 'KeyL', 'Escape'].includes(k)) { SFX.page(); this.closeOverlay(true); }
    } else if (ov.kind === 'pause') {
      if (k === 'Escape') { SFX.click(); this.closeOverlay(true); }
      else if (k === 'ArrowUp' || k === 'KeyW') { ov.sel = (ov.sel + ov.buttons.length - 1) % ov.buttons.length; ov.paint(); SFX.click(); }
      else if (k === 'ArrowDown' || k === 'KeyS') { ov.sel = (ov.sel + 1) % ov.buttons.length; ov.paint(); SFX.click(); }
      else if (k === 'Enter' || k === 'Space') ov.choose(ov.buttons[ov.sel].act);
    }
  }

  down(p) {
    if (p.wasTouch && !this.touchMode) this.touchMode = true;
    if (this.overlay) { this.overlay.tap?.(p); return; }
    if (!this.gameRef) return;
    if (!this.touchMode) { // mišem se može samo na pauzu
      const b = this.btn.pause;
      if (Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) < b.R * 1.25) Controls.press('pause');
      return;
    }
    const k = this.hitBtn(p.x, p.y);
    if (k) {
      const b = this.btn[k];
      b.pid = p.id;
      if (k === 'jump') { Controls.jumpHeld = true; Controls.press('jump'); }
      else Controls.press(k);
      Buzz(8);
      return;
    }
    if (p.x < this.scale.width * 0.5 && this.joy.pid === null) {
      const j = this.joy;
      j.pid = p.id; j.bx = p.x; j.by = p.y; j.kx = p.x; j.ky = p.y;
      this.applyJoy();
    }
  }

  move(p) {
    const j = this.joy;
    if (j.pid !== p.id) return;
    const R = 52 * this.u;
    let dx = p.x - j.bx, dy = p.y - j.by;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      // baza lagano prati palac
      const over = d - R;
      j.bx += dx / d * over; j.by += dy / d * over;
      dx = p.x - j.bx; dy = p.y - j.by;
    }
    j.kx = p.x; j.ky = p.y;
    this.applyJoy();
  }

  applyJoy() {
    const j = this.joy, R = 52 * this.u;
    const ax = (j.kx - j.bx) / R;
    Controls.left = ax < -0.28;
    Controls.right = ax > 0.28;
    Controls.sneak = Math.abs(ax) < 0.62;   // palac malo pomaknut = šuljanje
  }

  up(p) {
    if (this.joy.pid === p.id) { this.joy.pid = null; Controls.left = Controls.right = Controls.sneak = false; }
    for (const k in this.btn) {
      const b = this.btn[k];
      if (b.pid === p.id) { b.pid = null; if (k === 'jump') Controls.jumpHeld = false; }
    }
  }

  releaseAll() {
    this.joy.pid = null;
    for (const k in this.btn) this.btn[k].pid = null;
    Controls.reset();
  }

  // ---------------- crtanje ----------------
  update() {
    const g = this.g, u = this.u, B = this.btn;
    g.clear();
    if (!this.gameRef || this.overlay) { this.ctxText.setVisible(false); this.keyHint.setVisible(false); if (this.keyNum) this.keyNum.setVisible(false); return; }
    const hud = this.registry.get('hud') || { hp: 3, battery: 100 };
    const ctx = this.registry.get('context');
    const touch = this.touchMode;
    this.keyHint.setVisible(!touch && !!ctx).setText(ctx ? 'L  ·  ' + ctx : '');

    const circle = (b, active, on) => {
      g.fillStyle(on ? 0xffe9a8 : 0xffffff, active ? 0.32 : on ? 0.2 : 0.1);
      g.fillCircle(b.x, b.y, b.R);
      g.lineStyle(2 * u, 0xffffff, active ? 0.7 : 0.35);
      g.strokeCircle(b.x, b.y, b.R);
    };
    if (touch) {
    // skok
    circle(B.jump, B.jump.pid !== null);
    g.lineStyle(4 * u, 0xffffff, 0.75);
    g.beginPath(); g.moveTo(B.jump.x - 14 * u, B.jump.y + 6 * u); g.lineTo(B.jump.x, B.jump.y - 10 * u); g.lineTo(B.jump.x + 14 * u, B.jump.y + 6 * u); g.strokePath();
    // udarac
    circle(B.attack, B.attack.pid !== null);
    g.lineStyle(4 * u, 0xffffff, 0.75);
    g.lineBetween(B.attack.x - 11 * u, B.attack.y + 11 * u, B.attack.x + 11 * u, B.attack.y - 11 * u);
    g.lineStyle(2 * u, 0xffffff, 0.5);
    g.beginPath(); g.arc(B.attack.x - 4 * u, B.attack.y + 4 * u, 18 * u, -1.9, -0.1); g.strokePath();
    // svjetiljka
    circle(B.flash, B.flash.pid !== null, hud.flash);
    const fx = B.flash.x - 12 * u, fy = B.flash.y;
    g.fillStyle(0xffffff, 0.8); g.fillRect(fx, fy - 4 * u, 12 * u, 8 * u); g.fillRect(fx + 11 * u, fy - 6 * u, 5 * u, 12 * u);
    if (hud.flash) { g.fillStyle(0xffe9a8, 0.8); g.fillTriangle(fx + 17 * u, fy, fx + 28 * u, fy - 9 * u, fx + 28 * u, fy + 9 * u); }
    // kontekst
    if (ctx) {
      const pulse = 0.5 + Math.sin(this.time.now / 180) * 0.15;
      g.fillStyle(0xffe9a8, B.context.pid !== null ? 0.45 : pulse * 0.5); g.fillCircle(B.context.x, B.context.y, B.context.R);
      g.lineStyle(2 * u, 0xffe9a8, 0.9); g.strokeCircle(B.context.x, B.context.y, B.context.R);
    }
    }
    this.ctxText.setVisible(touch && !!ctx).setText(ctx || '').setColor('#1b1410');
    // pauza
    circle(B.pause, false);
    g.fillStyle(0xffffff, 0.75);
    g.fillRect(B.pause.x - 7 * u, B.pause.y - 8 * u, 5 * u, 16 * u); g.fillRect(B.pause.x + 2 * u, B.pause.y - 8 * u, 5 * u, 16 * u);

    // joystick
    const j = this.joy, R = 52 * u;
    if (!touch) { /* tipkovnica — bez joysticka */ }
    else if (j.pid !== null) {
      g.fillStyle(0xffffff, 0.08); g.fillCircle(j.bx, j.by, R);
      g.lineStyle(2 * u, 0xffffff, 0.3); g.strokeCircle(j.bx, j.by, R);
      const dx = Phaser.Math.Clamp(j.kx - j.bx, -R, R), dy = Phaser.Math.Clamp(j.ky - j.by, -R, R);
      g.fillStyle(0xffffff, 0.35); g.fillCircle(j.bx + dx, j.by + dy, 24 * u);
    } else {
      const hx = 100 * u, hy = this.scale.height - 90 * u;
      g.lineStyle(2 * u, 0xffffff, 0.12); g.strokeCircle(hx, hy, R);
      g.fillStyle(0xffffff, 0.1); g.fillCircle(hx, hy, 22 * u);
      g.fillStyle(0xffffff, 0.2);
      g.fillTriangle(hx - R + 8 * u, hy, hx - R + 20 * u, hy - 8 * u, hx - R + 20 * u, hy + 8 * u);
      g.fillTriangle(hx + R - 8 * u, hy, hx + R - 20 * u, hy - 8 * u, hx + R - 20 * u, hy + 8 * u);
    }

    // HUD — životi (male lampice duše)
    for (let i = 0; i < 3; i++) {
      const x = 28 * u + i * 26 * u, y = 28 * u;
      const full = i < hud.hp;
      g.fillStyle(full ? 0xbff2ff : 0x2a3340, full ? 0.95 : 0.8);
      g.fillCircle(x, y, 9 * u);
      g.lineStyle(2 * u, 0x0c0f14, 1); g.strokeCircle(x, y, 9 * u);
      if (full) { g.fillStyle(0xffffff, 0.9); g.fillCircle(x - 3 * u, y - 3 * u, 2.5 * u); }
    }
    // baterija
    const bx = 18 * u, by = 48 * u, bw = 88 * u, bh = 13 * u;
    g.fillStyle(0x0c0f14, 0.8); g.fillRoundedRect(bx, by, bw, bh, 3 * u);
    const k = hud.battery / 100;
    const col = k > 0.5 ? 0x6ee09a : k > 0.2 ? 0xffd25a : 0xff5a4a;
    if (k > 0) { g.fillStyle(col, 0.95); g.fillRoundedRect(bx + 2 * u, by + 2 * u, (bw - 4 * u) * k, bh - 4 * u, 2 * u); }
    g.lineStyle(2 * u, 0xffffff, 0.5); g.strokeRoundedRect(bx, by, bw, bh, 3 * u);
    g.fillStyle(0xffffff, 0.5); g.fillRect(bx + bw, by + 4 * u, 3 * u, bh - 8 * u);
    // ključ
    if (hud.key > 0) {
      const kx = 128 * u, ky = 54 * u;
      g.lineStyle(3 * u, 0xe7bf4c, 1); g.strokeCircle(kx, ky, 5 * u);
      g.lineBetween(kx + 5 * u, ky, kx + 18 * u, ky); g.lineBetween(kx + 14 * u, ky, kx + 14 * u, ky + 5 * u);
    }
    if (!this.keyNum) this.keyNum = this.add.text(0, 0, '', { fontFamily: FONT, fontStyle: 'bold', color: '#e7bf4c' }).setOrigin(0, 0.5);
    this.keyNum.setVisible(hud.key > 1).setText('×' + hud.key).setPosition(150 * u, 54 * u).setFontSize(Math.round(13 * u));
  }

  // ---------------- poruke i prozori ----------------
  zoneCard(n, name) {
    const w = this.scale.width, h = this.scale.height, u = this.u;
    const a = this.add.text(w / 2, h * 0.36, 'ZONA ' + n, { fontFamily: FONT, fontSize: Math.round(16 * u) + 'px', color: '#9fb3c8', letterSpacing: 6 * u }).setOrigin(0.5).setAlpha(0);
    const b = this.add.text(w / 2, h * 0.36 + 34 * u, name, { fontFamily: FONT, fontSize: Math.round(36 * u) + 'px', color: '#e9dfc6', stroke: '#000', strokeThickness: 5 * u }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [a, b], alpha: 1, duration: 900, delay: 300, yoyo: true, hold: 1800, onComplete: () => { a.destroy(); b.destroy(); } });
  }

  toast(msg, ms = 1600) {
    const t = this.toastText;
    this.tweens.killTweensOf(t);
    t.setText(msg).setAlpha(1);
    this.tweens.add({ targets: t, alpha: 0, delay: ms, duration: 600 });
  }

  makePanel(build) {
    this.closeOverlay(false);
    const c = this.add.container(0, 0);
    const ov = { c, items: {} };
    ov.relayout = () => { c.removeAll(true); build(ov); };
    build(ov);
    this.overlay = ov;
    this.releaseAll();
    return ov;
  }

  closeOverlay(resume = true) {
    if (!this.overlay) return;
    this.overlay.c.destroy(true);
    this.overlay = null;
    if (resume && this.scene.isPaused('Game')) {
      this.scene.resume('Game');
      const G = this.gameRef;
      if (G && G.keys) Object.values(G.keys).forEach(k => k.reset());
    }
  }

  showNote(text) {
    this.scene.pause('Game');
    this.makePanel(ov => {
      const w = this.scale.width, h = this.scale.height, u = this.u;
      const pw = Math.min(w * 0.62, 520 * u), ph = h * 0.72;
      const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.85).setOrigin(0);
      const paper = this.add.graphics();
      paper.fillStyle(0xe9dfc6, 1); paper.fillRoundedRect(w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, 6 * u);
      paper.fillStyle(0x8a5a3a, 0.14); paper.fillEllipse(w / 2 + pw * 0.38, h / 2 - ph * 0.36, 30 * u, 18 * u);
      paper.lineStyle(3 * u, 0x2a2018, 1); paper.strokeRoundedRect(w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, 6 * u);
      const txt = this.add.text(w / 2, h / 2 - 12 * u, text, { fontFamily: FONT, fontStyle: 'italic', fontSize: Math.round(17 * u) + 'px', color: '#2a2018', align: 'center', wordWrap: { width: pw - 50 * u }, lineSpacing: 6 * u }).setOrigin(0.5);
      const hint = this.add.text(w / 2, h / 2 + ph / 2 - 22 * u, this.touchMode ? 'dodirni za nastavak' : 'L ili Enter za nastavak', { fontFamily: FONT, fontSize: Math.round(12 * u) + 'px', color: '#6b5d48' }).setOrigin(0.5);
      ov.c.add([bg, paper, txt, hint]);
    });
    this.overlay.kind = 'note';
    this.overlay.tap = () => { SFX.page(); this.closeOverlay(true); };
  }

  openPause() {
    if (this.overlay || !this.scene.isActive('Game')) return;
    this.scene.pause('Game');
    const ov = this.makePanel(ov => {
      const w = this.scale.width, h = this.scale.height, u = this.u;
      const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.75).setOrigin(0);
      const title = this.add.text(w / 2, h * 0.22, 'PAUZA', { fontFamily: FONT, fontSize: Math.round(34 * u) + 'px', color: '#e9dfc6', letterSpacing: 8 * u }).setOrigin(0.5);
      ov.c.add([bg, title]);
      ov.buttons = [];
      const opts = [['Nastavi', 'resume'], ['Od zadnjeg spremanja', 'reload'], ['Glavni izbornik', 'menu']];
      opts.forEach(([label, act], i) => {
        const y = h * 0.42 + i * 58 * u;
        const r = this.add.rectangle(w / 2, y, 300 * u, 46 * u, 0xffffff, 0.08).setStrokeStyle(2 * u, 0xe9dfc6, 0.5);
        const t = this.add.text(w / 2, y, label, { fontFamily: FONT, fontSize: Math.round(19 * u) + 'px', color: '#e9dfc6' }).setOrigin(0.5);
        ov.c.add([r, t]);
        ov.buttons.push({ r, act });
      });
      if (!this.touchMode) {
        const keys = 'A / D — hodanje        S (drži) — šuljanje        W / I / razmak — skok\nJ — udarac        K — svjetiljka        L — radnja (sakrij se, pročitaj, otključaj)        Esc — pauza';
        const kt = this.add.text(w / 2, h * 0.88, keys, { fontFamily: FONT, fontSize: Math.round(12 * u) + 'px', color: '#9fb3c8', align: 'center', lineSpacing: 8 * u }).setOrigin(0.5);
        ov.c.add(kt);
      }
      if (ov.paint) ov.paint();
    });
    ov.kind = 'pause'; ov.sel = 0;
    ov.paint = () => ov.buttons.forEach((b, i) => {
      const on = !this.touchMode && i === ov.sel;
      b.r.setFillStyle(0xffffff, on ? 0.22 : 0.08).setStrokeStyle(2 * this.u, 0xe9dfc6, on ? 1 : 0.5);
    });
    ov.paint();
    ov.choose = (act) => {
      SFX.click(); SFX.resume();
      if (act === 'resume') this.closeOverlay(true);
      else if (act === 'reload') { this.closeOverlay(false); this.scene.get('Game').scene.restart(); }
      else { this.closeOverlay(false); this.scene.stop('Game'); this.gameRef = null; this.scene.start('Title'); }
    };
    ov.tap = (p) => {
      const hit = ov.buttons.find(b => b.r.getBounds().contains(p.x, p.y));
      if (hit) ov.choose(hit.act);
    };
  }

  jumpscare(done) {
    const w = this.scale.width, h = this.scale.height;
    const img = this.add.image(w / 2, h / 2, 'lice').setDepth(100);
    const s = h / 512 * 1.1;
    img.setScale(s * 0.6);
    const red = this.add.rectangle(0, 0, w, h, 0xff2a1a, 0.5).setOrigin(0).setDepth(101).setBlendMode(Phaser.BlendModes.ADD);
    const black = this.add.rectangle(0, 0, w, h, 0x000000, 0).setOrigin(0).setDepth(102);
    this.tweens.add({ targets: img, scale: s * 1.15, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: red, alpha: 0, duration: 400 });
    const shake = this.time.addEvent({ delay: 30, repeat: 28, callback: () => img.setPosition(w / 2 + (Math.random() - 0.5) * 30 * this.u, h / 2 + (Math.random() - 0.5) * 30 * this.u) });
    this.time.delayedCall(950, () => {
      this.tweens.add({
        targets: black, alpha: 1, duration: 450, onComplete: () => {
          shake.remove(); img.destroy(); red.destroy();
          done();
          this.tweens.add({ targets: black, alpha: 0, delay: 300, duration: 600, onComplete: () => black.destroy() });
        },
      });
    });
  }
}