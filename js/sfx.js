// Podzemlje — zvukovi sintetizirani u Web Audio (bez audio datoteka)
const SFX = (() => {
  let ctx = null, master = null, noiseBuf = null, droneNodes = null;
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
    const g = ctx.createGain(); g.gain.value = 0.05;
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
    const ng = ctx.createGain(); ng.gain.value = 0.018;
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.11;
    const lfo2G = ctx.createGain(); lfo2G.gain.value = 220;
    lfo2.connect(lfo2G); lfo2G.connect(nf.frequency);
    ns.connect(nf); nf.connect(ng); ng.connect(master);
    [o1, o2, o3].forEach(o => o.connect(lp));
    lp.connect(g); g.connect(master);
    [o1, o2, o3, lfo, lfo2, ns].forEach(n => n.start());
    droneNodes = { g, ng, o1, o2, o3, lp, nf, lfoG };
  }

  return {
    init,
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
      N.ng.gain.setTargetAtTime(d.windG, t, 1.5);
    },
    splash(vol = 0.16) { noise({ d: 0.18, vol, type: 'bandpass', f: 1400, f2: 500, q: 0.7 }); tone({ type: 'sine', f: 600 + Math.random() * 300, f2: 250, d: 0.08, vol: vol * 0.3 }); },
    batWake(pan = 0) { tone({ type: 'square', f: 3200, f2: 2400, d: 0.06, vol: 0.05, pan }); tone({ type: 'square', f: 3500, f2: 2600, d: 0.06, vol: 0.05, pan, delay: 0.09 }); noise({ d: 0.2, vol: 0.08, type: 'bandpass', f: 2500, q: 2, pan }); },
    flap(vol = 0.05, pan = 0) { noise({ d: 0.06, vol, type: 'bandpass', f: 700, q: 1.5, pan }); },
    bell() { [196, 392.5, 588].forEach((f, i) => tone({ type: 'sine', f, a: 0.01, d: 3, vol: 0.04 / (i + 1) })); },
    lightsOut() { noise({ a: 0.05, d: 1.2, vol: 0.25, type: 'lowpass', f: 900, f2: 100 }); tone({ type: 'sine', f: 220, f2: 55, a: 0.02, d: 1.6, vol: 0.2 }); },
    tension(v) { // 0..1 — pojačava dron kad je čudovište blizu
      if (!droneNodes || !ok()) return;
      droneNodes.g.gain.setTargetAtTime(0.05 + v * 0.07, now(), 0.4);
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
    win() { [392, 523, 659, 784].forEach((f, i) => tone({ type: 'triangle', f, a: 0.05, d: 1.4, vol: 0.06, delay: i * 0.25 })); },
  };
})();

const Buzz = (pattern) => { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} };