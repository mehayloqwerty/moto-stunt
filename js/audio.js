// Звук: мотор синтезируется на WebAudio по оборотам; музыка — треки Pixabay (авторы в CREDITS.md)
'use strict';

const Sound = (() => {
  let ctx = null, master, sfxBus, eng = null, noiseBuf, scrapeNode = null, screechNode = null;
  const player = new Audio();
  player.loop = true; player.preload = 'auto';
  let curTrack = '', musicVol = 0.5, sfxVol = 0.8;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = sfxVol; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    sfxBus = ctx.createGain(); sfxBus.connect(comp); comp.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function shaper(amount) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; c[i] = Math.tanh(x * (1 + amount * 6)); }
    return c;
  }

  // ---- мотор ----
  function startEngine(def, exhaust) {
    if (!ctx) return;
    stopEngine();
    const e = { def, loud: exhaust ? exhaust.loud : 0, nodes: [] };
    const out = ctx.createGain(); out.gain.value = 0; out.connect(sfxBus); e.out = out;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2.5; lp.connect(out); e.lp = lp;
    if (def.electric) {
      const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
      const o2 = ctx.createOscillator(); o2.type = 'sine';
      const g1 = ctx.createGain(); g1.gain.value = 0.12; const g2 = ctx.createGain(); g2.gain.value = 0.5;
      o1.connect(g1); g1.connect(lp); o2.connect(g2); g2.connect(lp);
      o1.start(); o2.start(); e.o1 = o1; e.o2 = o2; e.nodes.push(o1, o2);
    } else {
      const ws = ctx.createWaveShaper(); ws.curve = shaper(0.25 + e.loud * 0.6 + (def.cyl === 1 ? 0.25 : 0)); ws.connect(lp);
      const pre = ctx.createGain(); pre.gain.value = 0.6; pre.connect(ws);
      const o1 = ctx.createOscillator(); o1.type = def.cyl >= 4 ? 'sawtooth' : 'square';
      const o2 = ctx.createOscillator(); o2.type = 'sawtooth';
      const o3 = ctx.createOscillator(); o3.type = 'triangle';
      const g1 = ctx.createGain(); g1.gain.value = 0.5; const g2 = ctx.createGain(); g2.gain.value = 0.3; const g3 = ctx.createGain(); g3.gain.value = 0.55;
      o1.connect(g1); g1.connect(pre); o2.connect(g2); g2.connect(pre); o3.connect(g3); g3.connect(pre);
      // «картофельная» неравномерность V-твина и одноцилиндровых
      const am = ctx.createGain(); am.gain.value = 1;
      pre.disconnect(); pre.connect(am); am.connect(ws);
      const lfo = ctx.createOscillator(); lfo.type = 'square';
      const lfoG = ctx.createGain(); lfoG.gain.value = def.cyl <= 2 ? 0.45 : 0.12;
      lfo.connect(lfoG); lfoG.connect(am.gain);
      // шум впуска
      const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.value = 900;
      const ng = ctx.createGain(); ng.gain.value = 0.0;
      ns.connect(bp); bp.connect(ng); ng.connect(lp);
      [o1, o2, o3, lfo, ns].forEach(n => n.start());
      Object.assign(e, { o1, o2, o3, lfo, ng, bp, am });
      e.nodes.push(o1, o2, o3, lfo, ns);
    }
    eng = e;
  }
  function stopEngine() {
    if (!eng) return;
    const e = eng; eng = null;
    try { e.out.gain.setTargetAtTime(0, ctx.currentTime, 0.05); } catch (err) {}
    setTimeout(() => e.nodes.forEach(n => { try { n.stop(); } catch (err) {} }), 300);
  }
  let popT = 0;
  function updateEngine(rpm, throttle, load, limiter, dt) {
    if (!eng || !ctx) return;
    const t = ctx.currentTime, d = eng.def, tc = 0.02;
    if (d.electric) {
      const f = 60 + rpm * 0.09;
      eng.o1.frequency.setTargetAtTime(f, t, tc); eng.o2.frequency.setTargetAtTime(f * 0.5, t, tc);
      eng.lp.frequency.setTargetAtTime(500 + rpm * 0.35, t, tc);
      eng.out.gain.setTargetAtTime(0.06 + 0.2 * Math.min(1, rpm / 6000) * (0.4 + throttle * 0.6), t, 0.05);
      return;
    }
    const fire = Math.max(8, rpm / 60 * Math.max(1, d.cyl) / 2);
    const f = d.cyl === 1 ? fire : d.cyl === 2 ? fire : fire;
    eng.o1.frequency.setTargetAtTime(f, t, tc);
    eng.o2.frequency.setTargetAtTime(f * 2.01, t, tc);
    eng.o3.frequency.setTargetAtTime(f * 0.5, t, tc);
    eng.lfo.frequency.setTargetAtTime(f / (d.cyl === 2 ? 2 : 4), t, tc);
    const r = rpm / d.redline;
    eng.lp.frequency.setTargetAtTime(220 + 900 * r + 2600 * throttle * (0.4 + r) * (1 + eng.loud * 0.5), t, tc);
    eng.bp.frequency.setTargetAtTime(500 + 2400 * r, t, tc);
    eng.ng.gain.setTargetAtTime(0.03 + throttle * 0.12 * (0.5 + r), t, tc);
    let vol = (0.1 + 0.18 * throttle + 0.14 * r) * (0.8 + eng.loud * 0.45);
    if (limiter > 0) vol *= 0.6 + Math.random() * 0.4;
    eng.out.gain.setTargetAtTime(vol, t, 0.03);
    // хлопки на сбросе газа
    popT -= dt;
    if (throttle < 0.1 && r > 0.55 && popT <= 0 && Math.random() < 0.08 + eng.loud * 0.25) { popT = 0.06; noise(0.05, 300 + Math.random() * 400, 0.22 + eng.loud * 0.3, 'lowpass'); return true; }
    return false;
  }

  // ---- эффекты ----
  function noise(dur, freq, vol, type, q) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function tone(freq, dur, vol, type, slide) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function loopNoise(freq, q) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start();
    return { s, g, f };
  }
  function setScrape(v, screech) {
    if (!ctx) return;
    if (!scrapeNode) scrapeNode = loopNoise(3200, 3);
    if (!screechNode) screechNode = loopNoise(1500, 6);
    scrapeNode.g.gain.setTargetAtTime(v * 0.35, ctx.currentTime, 0.04);
    screechNode.g.gain.setTargetAtTime(screech * 0.18, ctx.currentTime, 0.05);
  }
  const sfx = {
    crash() { noise(0.6, 600, 0.9); noise(0.35, 2500, 0.4, 'bandpass'); tone(90, 0.3, 0.5, 'sine', 40); },
    land(v) { noise(0.18, 220, Math.min(0.9, 0.2 + v * 0.08)); tone(70, 0.15, Math.min(0.5, v * 0.05), 'sine', 45); },
    shift() { tone(180, 0.04, 0.12, 'square'); },
    bank() { tone(880, 0.08, 0.15, 'square'); setTimeout(() => tone(1320, 0.12, 0.15, 'square'), 70); },
    trick() { tone(660, 0.1, 0.12, 'triangle', 990); },
    click() { tone(520, 0.05, 0.1, 'triangle'); },
    buy() { tone(700, 0.08, 0.15, 'square'); setTimeout(() => tone(1050, 0.08, 0.15, 'square'), 80); setTimeout(() => tone(1400, 0.15, 0.15, 'square'), 160); },
    finish() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, 0.18, 'square'), i * 120)); },
    checkpoint() { tone(990, 0.08, 0.12, 'sine'); setTimeout(() => tone(1480, 0.1, 0.12, 'sine'), 80); }
  };

  // ---- музыка ----
  function music(name) {
    if (musicVol <= 0) { player.pause(); curTrack = name; return; }
    if (curTrack === name && !player.paused) return;
    curTrack = name;
    player.src = 'music/' + name + '.m4a';
    player.volume = musicVol * 0.55;
    player.play().catch(() => {});
  }
  function stopMusic() { player.pause(); }
  function resumeMusic() { if (curTrack && musicVol > 0) { if (!player.src) player.src = 'music/' + curTrack + '.m4a'; player.play().catch(() => {}); } }
  function setVolumes(m, s) {
    musicVol = m; sfxVol = s;
    player.volume = m * 0.55;
    if (m <= 0) player.pause(); else if (curTrack && player.paused) resumeMusic();
    if (master) master.gain.value = s;
  }
  function suspend(on) { if (!ctx) return; if (on) ctx.suspend(); else ctx.resume(); }

  return { init, startEngine, stopEngine, updateEngine, sfx, setScrape, music, stopMusic, resumeMusic, setVolumes, suspend };
})();
