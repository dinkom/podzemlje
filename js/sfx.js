// Podzemlje — zvukovi sintetizirani u Web Audio (bez audio datoteka)
const SFX = (() => {
  let ctx = null, master = null, noiseBuf = null, droneNodes = null, pendingMode;
  let enabled = true;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { enabled = false; return; }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    // kompresor da glasniji zvukovi ne pucaju
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    startDrone();
    if (pendingMode !== undefined) { bus(); mus.want = pendingMode; }
  }

  const now = () => ctx.currentTime;
  const ok = () => enabled && ctx && ctx.state === 'running';

  function out(pan = 0) {
    if (!ctx.createStereoPanner) return master;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    p.connect(master);
    return p;
  }

  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function tone({ type = 'sine', f = 440, f2 = null, a = 0.005, d = 0.2, vol = 0.2, pan = 0, delay = 0 }) {
    if (!ok()) return;
    const t = now() + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(g, t, a, vol, d);
    o.connect(g); g.connect(out(pan));
    o.start(t); o.stop(t + a + d + 0.05);
  }

  function noise({ a = 0.005, d = 0.15, vol = 0.2, type = 'lowpass', f = 1200, f2 = null, q = 0.8, pan = 0, delay = 0 }) {
    if (!ok()) return;
    const t = now() + delay;
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter();
    fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    const g = ctx.createGain();
    env(g, t, a, vol, d);
    s.connect(fl); fl.connect(g); g.connect(out(pan));
    s.start(t, Math.random() * 0.5); s.stop(t + a + d + 0.05);
  }

  function startDrone() {
    if (droneNodes) return;
    const g = ctx.createGain(); g.gain.value = 0.028;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 43.6;
    const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 44.1;
    const o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = 65.4;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 120;
    lfo.connect(lfoG); lfoG.connect(lp.frequency);
    // vjetar
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 400; nf.Q.value = 0.6;
    const ng = ctx.createGain(); ng.gain.value = 0.01;
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.11;
    const lfo2G = ctx.createGain(); lfo2G.gain.value = 220;
    lfo2.connect(lfo2G); lfo2G.connect(nf.frequency);
    ns.connect(nf); nf.connect(ng); ng.connect(master);
    [o1, o2, o3].forEach(o => o.connect(lp));
    lp.connect(g); g.connect(master);
    [o1, o2, o3, lfo, lfo2, ns].forEach(n => n.start());
    droneNodes = { g, ng, o1, o2, o3, lp, nf, lfoG };
  }

  // ================= GLAZBA (filmska, sintetizirana) =================
  let mus = null;
  const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);   // MIDI broj -> Hz
  function impulse(sec) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }
  function bus() {
    if (mus) return mus;
    const gain = ctx.createGain(); gain.gain.value = 0;
    const dry = ctx.createGain(); dry.gain.value = 0.75;
    const conv = ctx.createConvolver(); conv.buffer = impulse(3.4);
    const wet = ctx.createGain(); wet.gain.value = 0.6;
    gain.connect(dry); dry.connect(master); gain.connect(conv); conv.connect(wet); wet.connect(master);
    mus = { gain, mode: null, want: null, timer: null, nextT: 0, step: 0, ev: 0, lvl: 0, chord: 0 };
    mus.timer = setInterval(schedule, 90);
    return mus;
  }
  // instrumenti
  function voice(f, t, dur, { type = 'sine', vol = 0.05, a = 0.01, rel = 0.6, vib = 0, lp = 0, det = 0, pan = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.value = det;
    if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.2; lg.gain.value = f * vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + rel + 0.1); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + Math.max(a, dur)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a, dur) + rel);
    let node = o;
    if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); node = fl; }
    node.connect(g);
    if (ctx.createStereoPanner && pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(mus.gain); } else g.connect(mus.gain);
    o.start(t); o.stop(t + Math.max(a, dur) + rel + 0.1);
  }
  const I = {
    bell: (n, t, v = 0.05, pan = 0) => { const f = NOTE(n); voice(f, t, 0.02, { vol: v, a: 0.004, rel: 3.2, pan }); voice(f * 2.76, t, 0.01, { vol: v * 0.25, a: 0.003, rel: 1.2, pan }); voice(f * 5.4, t, 0.01, { vol: v * 0.08, a: 0.002, rel: 0.5, pan }); },
    harp: (n, t, v = 0.05, pan = 0) => { const f = NOTE(n); voice(f, t, 0.01, { type: 'triangle', vol: v, a: 0.003, rel: 1.8, pan }); voice(f * 2, t, 0.01, { vol: v * 0.2, a: 0.003, rel: 0.6, pan }); },
    flute: (n, t, d, v = 0.035) => { voice(NOTE(n), t, d, { vol: v, a: 0.35, rel: 1.0, vib: 0.006 }); },
    strings: (n, t, d, v = 0.02, lp = 900) => { [-7, 7].forEach(dt => voice(NOTE(n), t, d, { type: 'sawtooth', vol: v, a: d * 0.4, rel: 1.6, lp, det: dt })); },
    cello: (n, t, d, v = 0.03) => { voice(NOTE(n), t, d, { type: 'sawtooth', vol: v, a: d * 0.3, rel: 1.4, lp: 420, vib: 0.004 }); },
    box: (n, t, v = 0.035, det = -12) => { const f = NOTE(n); voice(f, t, 0.01, { vol: v, a: 0.002, rel: 0.9, det }); voice(f * 3, t, 0.01, { type: 'triangle', vol: v * 0.2, a: 0.002, rel: 0.3, det }); },
    piano: (n, t, v = 0.04) => { const f = NOTE(n); voice(f, t, 0.02, { type: 'triangle', vol: v, a: 0.004, rel: 2.2, det: -9 }); voice(f, t, 0.02, { type: 'triangle', vol: v * 0.7, a: 0.004, rel: 2.0, det: 11 }); },
    bass: (n, t, d, v = 0.06) => { voice(NOTE(n), t, d, { type: 'sawtooth', vol: v, a: 0.005, rel: 0.12, lp: 320 }); },
    stac: (n, t, v = 0.03) => { [-8, 8].forEach(dt => voice(NOTE(n), t, 0.06, { type: 'sawtooth', vol: v, a: 0.004, rel: 0.12, lp: 1800, det: dt })); },
    timp: (t, v = 0.2, f = 70) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g); g.connect(mus.gain); o.start(t); o.stop(t + 1);
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 600; const ng = ctx.createGain();
      ng.gain.setValueAtTime(v * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); s.connect(fl); fl.connect(ng); ng.connect(mus.gain); s.start(t); s.stop(t + 0.2);
    },
    tick: (t, v = 0.03, f = 7000) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = f; const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); s.connect(fl); fl.connect(g); g.connect(mus.gain); s.start(t, Math.random()); s.stop(t + 0.06); },
  };
  const pick = (a) => a[(Math.random() * a.length) | 0];
  // svjetovi: polagani, rijetki tonovi preko dronova
  const WORLD = {
    // Podzemlje: d-frigijski, zvona iz dubine, violončelo
    podzemlje: { scale: [62, 63, 65, 67, 69, 70, 72, 74, 75, 77], chords: [[50, 57, 62], [46, 53, 58], [43, 50, 55], [45, 52, 57]], gap: [5, 9],
      phrase(t) {
        const c = WORLD.podzemlje.chords[mus.chord++ % 4];
        if (Math.random() < 0.7) c.forEach(n => I.strings(n, t, 5, 0.012, 600));
        if (Math.random() < 0.4) I.cello(c[0] - 12, t + 0.5, 4, 0.03);
        const k = 1 + ((Math.random() * 3) | 0); let x = (Math.random() * 6) | 0;
        for (let i = 0; i < k; i++) { x = Math.max(0, Math.min(9, x + pick([-2, -1, 1, 2]))); I.bell(WORLD.podzemlje.scale[x], t + 0.6 + i * (0.9 + Math.random() * 0.8), 0.045, Math.random() * 1.2 - 0.6); }
      } },
    // Šuma: e-dorski, harfa, flauta, mekane gudače
    suma: { scale: [64, 66, 67, 69, 71, 73, 74, 76, 78, 79], chords: [[52, 59, 64, 67], [48, 55, 60, 64], [50, 57, 62, 66], [45, 52, 57, 60]], gap: [5, 8],
      phrase(t) {
        const c = WORLD.suma.chords[mus.chord++ % 4];
        if (Math.random() < 0.6) c.slice(0, 3).forEach(n => I.strings(n, t, 6, 0.01, 800));
        if (Math.random() < 0.65) c.forEach((n, i) => I.harp(n + 12, t + 0.2 + i * 0.42, 0.045, -0.4 + i * 0.25));
        if (Math.random() < 0.55) { const s = WORLD.suma.scale; let x = 4 + ((Math.random() * 3) | 0); for (let i = 0; i < 3; i++) { I.flute(s[x] + 12, t + 2 + i * 1.6, 1.3, 0.028); x = Math.max(0, Math.min(9, x + pick([-1, -2, 1]))); } }
      } },
    // Grad: a-mol, rasštimana glazbena kutija u tročetvrtinskom, klavir iz daljine
    grad: { scale: [69, 71, 72, 74, 76, 77, 80, 81], gap: [6, 10], motifs: [[81, 76, 72, 76, 74, 71], [76, 77, 76, 74, 72, 71], [72, 76, 81, 80, 76, 74]],
      phrase(t) {
        const m = pick(WORLD.grad.motifs), sp = 0.62;
        if (Math.random() < 0.7) m.forEach((n, i) => I.box(n + 12, t + i * sp * (i % 3 === 0 ? 1.1 : 1), 0.03, -14 - Math.random() * 10));
        if (Math.random() < 0.5) [45, 52, 57].forEach(n => I.strings(n, t, 6, 0.011, 500));
        if (Math.random() < 0.35) I.piano(pick([57, 60, 64, 63, 56]), t + 4, 0.035);
        if (Math.random() < 0.25) I.cello(33, t + 1, 5, 0.03);
      } },
  };
  // bossovi: puls, timpani, ostinato
  const BOSS = {
    boss_huk: { bpm: 132, root: 40, pat: [0, 0, 12, 0, 3, 0, 7, 0, 0, 0, 12, 0, 5, 3, 7, 10], stabs: [[52, 55, 59], [48, 52, 55], [50, 53, 57], [47, 50, 54]],
      step(i, t, L) {
        const s = i % 16, bar = Math.floor(i / 16);
        I.bass(this.root + this.pat[s], t, 0.1, 0.055);
        if (s % 8 === 0) I.timp(t, 0.22, 55);
        if (L > 0 && (s === 6 || s === 14)) I.timp(t, 0.12, 82);
        if (L > 1 && s % 2 === 1) I.tick(t, 0.02);
        if (s === 0) this.stabs[bar % 4].forEach(n => I.strings(n + 12, t, 1.2, 0.016, 2200));
        if (bar % 4 === 3 && s >= 12) I.timp(t, 0.1 + (s - 12) * 0.03, 90);
        if (s === 8 && bar % 2 === 1) I.flute(pick([76, 79, 83, 81]) + (L > 1 ? 12 : 0), t, 0.5, 0.03);
      } },
    boss_krojac: { bpm: 144, root: 45, pat: [0, 12, 0, 12, 1, 13, 0, 12, 0, 12, 3, 15, 1, 13, 0, 12], box: [93, 88, 84, 88, 86, 83],
      step(i, t, L) {
        const s = i % 16, bar = Math.floor(i / 16);
        I.stac(this.root + this.pat[s] + 12, t, 0.024);
        if (s % 4 === 0) I.bass(this.root - 12 + (bar % 4 === 3 ? 1 : 0), t, 0.18, 0.06);
        if (s % 2 === 0) I.tick(t, 0.025, 6000 + (s % 4) * 1500);
        if (s === 0 || (L > 0 && s === 10)) I.timp(t, 0.2, 60);
        if (s % 2 === 0 && (bar % 2 === 1 || L > 1)) I.box(this.box[(s / 2) % 6], t, 0.022, -25);
        if (s === 0 && bar % 4 === 0) [57, 58, 63].forEach(n => I.strings(n, t, 2.5, 0.015, 1600));
      } },
  };
  function schedule() {
    if (!ok() || !mus) return;
    const t0 = ctx.currentTime;
    if (mus.want !== mus.mode) {
      // pretapanje
      mus.gain.gain.cancelScheduledValues(t0); mus.gain.gain.setValueAtTime(mus.gain.gain.value, t0); mus.gain.gain.linearRampToValueAtTime(0, t0 + 1.2);
      mus.mode = mus.want; mus.switchAt = t0 + 1.3; mus.step = 0; mus.ev = mus.switchAt + 0.5; mus.nextT = mus.switchAt;
      return;
    }
    if (!mus.mode || t0 < mus.switchAt) return;
    if (!mus.up) { mus.up = true; mus.gain.gain.setValueAtTime(0, t0); mus.gain.gain.linearRampToValueAtTime(BOSS[mus.mode] ? 0.9 : 0.75, t0 + 2.5); }
    const W = WORLD[mus.mode], B = BOSS[mus.mode];
    if (W && mus.ev < t0 + 0.4) { W.phrase(Math.max(mus.ev, t0 + 0.05)); mus.ev = Math.max(mus.ev, t0) + W.gap[0] + Math.random() * (W.gap[1] - W.gap[0]); }
    if (B) { const dt = 60 / B.bpm / 4 * (mus.lvl > 1 ? 0.92 : 1); while (mus.nextT < t0 + 0.25) { B.step(mus.step++, Math.max(mus.nextT, t0 + 0.02), mus.lvl); mus.nextT += dt; } }
  }
  return {
    init,
    // glazba: 'podzemlje' | 'suma' | 'grad' | 'boss_huk' | 'boss_krojac' | null
    music(mode) { pendingMode = mode; if (!ctx || !enabled) return; bus(); if (mus.want !== mode) { mus.want = mode; mus.up = false; } },
    musicLevel(n) { if (mus) mus.lvl = n; },
    _dbg() { return mus ? [ctx.state, mus.mode, mus.step, +mus.gain.gain.value.toFixed(2)] : null; },
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
    setTheme(d) { // d = THEMES[x].drone
      if (!droneNodes || !ctx) return;
      const t = now(), N = droneNodes;
      N.o1.frequency.setTargetAtTime(d.f, t, 1.5);
      N.o2.frequency.setTargetAtTime(d.f * 1.0115, t, 1.5);
      N.o3.frequency.setTargetAtTime(d.f3, t, 1.5);
      N.lp.frequency.setTargetAtTime(d.lp, t, 1.5);
      N.nf.frequency.setTargetAtTime(d.wind, t, 1.5);
      N.ng.gain.setTargetAtTime(d.windG * 0.55, t, 1.5);
    },
    splash(vol = 0.16) { noise({ d: 0.18, vol, type: 'bandpass', f: 1400, f2: 500, q: 0.7 }); tone({ type: 'sine', f: 600 + Math.random() * 300, f2: 250, d: 0.08, vol: vol * 0.3 }); },
    batWake(pan = 0) { tone({ type: 'square', f: 3200, f2: 2400, d: 0.06, vol: 0.05, pan }); tone({ type: 'square', f: 3500, f2: 2600, d: 0.06, vol: 0.05, pan, delay: 0.09 }); noise({ d: 0.2, vol: 0.08, type: 'bandpass', f: 2500, q: 2, pan }); },
    flap(vol = 0.05, pan = 0) { noise({ d: 0.06, vol, type: 'bandpass', f: 700, q: 1.5, pan }); },
    hiss(pan = 0) { noise({ a: 0.02, d: 0.35, vol: 0.12, type: 'highpass', f: 3500, pan }); },
    creak() { tone({ type: 'sawtooth', f: 180, f2: 120, a: 0.02, d: 0.35, vol: 0.06 }); noise({ d: 0.3, vol: 0.06, type: 'bandpass', f: 900, q: 4 }); },
    crumble() { noise({ a: 0.01, d: 0.5, vol: 0.28, f: 1200, f2: 150 }); tone({ type: 'sine', f: 90, f2: 40, d: 0.3, vol: 0.18 }); },
    boing() { tone({ type: 'sine', f: 180, f2: 620, a: 0.005, d: 0.28, vol: 0.2 }); tone({ type: 'triangle', f: 360, f2: 900, d: 0.2, vol: 0.06, delay: 0.03 }); },
    crack(pan = 0) { noise({ d: 0.12, vol: 0.12, type: 'highpass', f: 2500, pan }); tone({ type: 'square', f: 1800, f2: 900, d: 0.05, vol: 0.04, pan }); },
    shatter(vol = 0.25, pan = 0) { for (let i = 0; i < 4; i++) tone({ type: 'sine', f: 2200 + Math.random() * 2500, f2: 1500, d: 0.15, vol: vol * 0.15, pan, delay: i * 0.03 }); noise({ d: 0.25, vol, type: 'highpass', f: 3000, pan }); },
    wallGrowl() { tone({ type: 'sawtooth', f: 46, f2: 38, a: 0.2, d: 1.6, vol: 0.18 }); noise({ a: 0.3, d: 1.5, vol: 0.18, f: 300, f2: 80 }); },
    hoot(delay = 0) {
      [0, 0.55].forEach((d, i) => tone({ type: 'sine', f: i ? 330 : 370, f2: i ? 300 : 340, a: 0.06, d: 0.45, vol: 0.12, delay: delay + d }));
    },
    bell() { [196, 392.5, 588].forEach((f, i) => tone({ type: 'sine', f, a: 0.01, d: 3, vol: 0.04 / (i + 1) })); },
    lightsOut() { noise({ a: 0.05, d: 1.2, vol: 0.25, type: 'lowpass', f: 900, f2: 100 }); tone({ type: 'sine', f: 220, f2: 55, a: 0.02, d: 1.6, vol: 0.2 }); },
    tension(v) { // 0..1 — pojačava dron kad je čudovište blizu
      if (!droneNodes || !ok()) return;
      droneNodes.g.gain.setTargetAtTime(0.028 + v * 0.055, now(), 0.4);
    },
    step(vol = 0.1) { noise({ d: 0.07, vol, f: 1000, f2: 300 }); },
    land() { noise({ d: 0.16, vol: 0.26, f: 700, f2: 120 }); tone({ type: 'sine', f: 110, f2: 55, d: 0.12, vol: 0.12 }); },
    jump() { noise({ d: 0.13, vol: 0.12, type: 'bandpass', f: 600, f2: 2000, q: 1.2 }); },
    slash() { noise({ d: 0.11, vol: 0.32, type: 'bandpass', f: 1200, f2: 4500, q: 0.9 }); tone({ type: 'triangle', f: 800, f2: 260, d: 0.1, vol: 0.12 }); },
    bugHit() { tone({ type: 'square', f: 240, f2: 80, d: 0.12, vol: 0.14 }); noise({ d: 0.1, vol: 0.28, f: 1600, f2: 300 }); tone({ type: 'sine', f: 140, f2: 60, d: 0.1, vol: 0.2 }); },
    bugDie() { tone({ type: 'sawtooth', f: 520, f2: 60, d: 0.32, vol: 0.14 }); noise({ d: 0.28, vol: 0.3, f: 2200, f2: 200 }); },
    hurt() { tone({ type: 'sine', f: 130, f2: 40, d: 0.38, vol: 0.5 }); noise({ d: 0.22, vol: 0.3, f: 700, f2: 100 }); },
    pickup() { [660, 880, 1320].forEach((f, i) => tone({ type: 'sine', f, d: 0.35, vol: 0.13, delay: i * 0.07 })); },
    key() { [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'triangle', f, d: 0.6, vol: 0.06, delay: i * 0.1 })); },
    click() { tone({ type: 'square', f: 1800, d: 0.025, vol: 0.08 }); },
    save() { [392, 494, 587].forEach((f, i) => tone({ type: 'sine', f, a: 0.05, d: 1.2, vol: 0.06, delay: i * 0.15 })); },
    page() { noise({ d: 0.25, vol: 0.06, type: 'bandpass', f: 3000, q: 0.5 }); },
    door() { tone({ type: 'sawtooth', f: 80, f2: 50, a: 0.1, d: 1.2, vol: 0.12 }); noise({ a: 0.05, d: 1.0, vol: 0.1, f: 300, f2: 80 }); },
    drip(pan) { tone({ type: 'sine', f: 1400 + Math.random() * 900, f2: 500, d: 0.12, vol: 0.05, pan }); tone({ type: 'sine', f: 1100, f2: 400, d: 0.1, vol: 0.02, pan: -pan, delay: 0.18 }); },
    heart(vol = 0.3) { tone({ type: 'sine', f: 62, f2: 40, d: 0.14, vol }); tone({ type: 'sine', f: 58, f2: 38, d: 0.16, vol: vol * 0.8, delay: 0.17 }); },
    stomp(vol, pan) { if (vol < 0.01) return; tone({ type: 'sine', f: 70, f2: 35, d: 0.18, vol: vol * 0.5, pan }); noise({ d: 0.1, vol: vol * 0.25, f: 400, f2: 90, pan }); },
    sting() {
      [233, 247, 349].forEach((f, i) => tone({ type: 'sawtooth', f, f2: f * 0.97, a: 0.02, d: 0.9, vol: 0.06, delay: i * 0.02 }));
      noise({ a: 0.01, d: 0.6, vol: 0.12, type: 'bandpass', f: 2500, f2: 800, q: 3 });
    },
    rumble() { noise({ a: 0.3, d: 1.8, vol: 0.35, f: 200, f2: 50 }); tone({ type: 'sine', f: 40, f2: 28, a: 0.3, d: 1.8, vol: 0.25 }); },
    scream() {
      for (let i = 0; i < 4; i++) tone({ type: 'sawtooth', f: 400 + i * 137, f2: 900 + i * 90, a: 0.01, d: 0.7, vol: 0.09 });
      noise({ a: 0.005, d: 0.8, vol: 0.4, type: 'bandpass', f: 1800, f2: 600, q: 1.5 });
      tone({ type: 'sine', f: 50, f2: 30, d: 0.9, vol: 0.5 });
    },
    // ---- Šuma ----
    cricket(pan = 0) { const f = 4200 + Math.random() * 600; for (let i = 0; i < 3; i++) tone({ type: 'sine', f, f2: f * 0.98, a: 0.004, d: 0.035, vol: 0.025, pan, delay: i * 0.07 }); },
    frog(pan = 0) { const f = 110 + Math.random() * 40; tone({ type: 'square', f, f2: f * 0.7, a: 0.01, d: 0.12, vol: 0.05, pan }); tone({ type: 'square', f: f * 1.1, f2: f * 0.8, a: 0.01, d: 0.1, vol: 0.04, pan, delay: 0.16 }); },
    squelch(vol = 0.2) { noise({ a: 0.01, d: 0.22, vol, type: 'lowpass', f: 500, f2: 120, q: 3 }); tone({ type: 'sine', f: 140, f2: 60, d: 0.14, vol: vol * 0.5 }); },
    rustle(vol = 0.15) { noise({ a: 0.02, d: 0.25, vol, type: 'bandpass', f: 3200, f2: 1800, q: 0.8 }); noise({ d: 0.15, vol: vol * 0.6, type: 'highpass', f: 5000, delay: 0.08 }); },
    chitter(vol = 0.3, pan = 0) { for (let i = 0; i < 6; i++) tone({ type: 'square', f: 1400 + Math.random() * 900, f2: 700, d: 0.03, vol: vol * 0.12, pan, delay: i * 0.045 }); noise({ d: 0.3, vol: vol * 0.4, type: 'highpass', f: 2800, pan }); },
    twang() { tone({ type: 'triangle', f: 880, f2: 860, a: 0.002, d: 0.6, vol: 0.12 }); tone({ type: 'sine', f: 1760, f2: 1700, d: 0.4, vol: 0.06 }); tone({ type: 'sine', f: 2637, d: 0.9, vol: 0.05, delay: 0.05 }); },
    snip(vol = 0.2) { for (let i = 0; i < 2; i++) { noise({ d: 0.05, vol, type: 'highpass', f: 4000, delay: i * 0.12 }); tone({ type: 'square', f: 2200, f2: 1400, d: 0.03, vol: vol * 0.3, delay: i * 0.12 }); } },
    whirr() { tone({ type: 'sawtooth', f: 90, f2: 140, a: 0.05, d: 0.4, vol: 0.06 }); noise({ d: 0.4, vol: 0.05, type: 'bandpass', f: 900, q: 2 }); },
    klak(vol = 0.15, pan = 0) { tone({ type: 'square', f: 600 + Math.random() * 200, f2: 300, d: 0.03, vol: vol * 0.5, pan }); noise({ d: 0.04, vol, type: 'bandpass', f: 1800, q: 3, pan }); },
    distant() { const f = 700 + Math.random() * 200; tone({ type: 'sine', f, f2: f * 1.3, a: 0.4, d: 1.4, vol: 0.02 }); tone({ type: 'sine', f: f * 1.3, f2: f, a: 0.3, d: 1.4, vol: 0.02, delay: 1.3 }); },
    clank() { tone({ type: 'triangle', f: 180 + Math.random() * 80, f2: 120, d: 0.5, vol: 0.06 }); noise({ d: 0.12, vol: 0.06, type: 'bandpass', f: 2500, q: 4 }); },
    horn() { tone({ type: 'sawtooth', f: 311, a: 0.05, d: 1.1, vol: 0.08 }); tone({ type: 'sawtooth', f: 370, a: 0.05, d: 1.1, vol: 0.07 }); tone({ type: 'sawtooth', f: 311, a: 0.05, d: 0.6, vol: 0.06, delay: 1.2 }); },
    musicbox() { const notes = [1046, 1174, 1318, 1046, 988, 880]; const k = (Math.random() * 3) | 0; for (let i = 0; i < 4; i++) tone({ type: 'sine', f: notes[(k + i) % notes.length] * (i === 3 ? 0.94 : 1), a: 0.005, d: 0.6, vol: 0.03, delay: i * 0.32 }); },
    tick() { for (let i = 0; i < 2; i++) tone({ type: 'square', f: i ? 1500 : 1800, d: 0.02, vol: 0.05, delay: i * 0.5 }); },
    gust() { noise({ a: 0.25, d: 1.4, vol: 0.22, type: 'bandpass', f: 400, f2: 1400, q: 0.7 }); noise({ a: 0.4, d: 1.2, vol: 0.12, type: 'highpass', f: 2500, delay: 0.1 }); },
    wispZap() { tone({ type: 'sine', f: 1600, f2: 120, a: 0.01, d: 0.7, vol: 0.18 }); tone({ type: 'triangle', f: 2400, f2: 300, d: 0.5, vol: 0.06, delay: 0.05 }); noise({ d: 0.5, vol: 0.12, type: 'bandpass', f: 3000, f2: 400, q: 2 }); },
    screech() {
      tone({ type: 'sawtooth', f: 1300, f2: 700, a: 0.02, d: 0.6, vol: 0.12 }); tone({ type: 'sawtooth', f: 1380, f2: 760, a: 0.02, d: 0.6, vol: 0.1 });
      noise({ a: 0.01, d: 0.6, vol: 0.3, type: 'bandpass', f: 3000, f2: 1500, q: 2 });
    },
    win() { [392, 523, 659, 784].forEach((f, i) => tone({ type: 'triangle', f, a: 0.05, d: 1.4, vol: 0.06, delay: i * 0.25 })); },
  };
})();

const Buzz = (pattern) => { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} };
