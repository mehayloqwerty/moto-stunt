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
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 3; comp.attack.value = 0.002;
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
  // Выхлоп = поток импульсов давления. Форма волны строится из моментов вспышек за 720° коленвала:
  // одноцилиндровый — один удар, V-твин 45° — «ту-дух», рядная четвёрка — ровный вой.
  const FIRING = {
    single: [0],
    vtwin: [0, 315],
    triple: [0, 240, 480],
    inline4: [0, 180, 360, 540]
  };
  const waveCache = {};
  function exhaustWave(kind) {
    if (waveCache[kind]) return waveCache[kind];
    const ph = FIRING[kind] || FIRING.single, N = 64;
    const re = new Float32Array(N), im = new Float32Array(N);
    const width = kind === 'vtwin' ? 5 : kind === 'single' ? 7 : 10; // ширина импульса → яркость
    for (let n = 1; n < N; n++) {
      const env = 1 / (1 + Math.pow(n / (width * ph.length), 2)) / Math.sqrt(n);
      let a = 0, b = 0;
      ph.forEach((deg, i) => { const p = 2 * Math.PI * n * deg / 720, amp = kind === 'vtwin' && i === 1 ? 0.8 : 1; a += Math.cos(p) * amp; b += Math.sin(p) * amp; });
      re[n] = a * env; im[n] = b * env;
    }
    return (waveCache[kind] = ctx.createPeriodicWave(re, im));
  }
  function startEngine(def, exhaust) {
    if (!ctx) return;
    stopEngine();
    const loud = exhaust ? exhaust.loud : 0;
    const e = { def, loud, nodes: [], crackle: 0, lastThr: 0, kind: def.electric ? 'electric' : def.cyl === 1 ? 'single' : def.cyl === 2 ? 'vtwin' : def.cyl === 3 ? 'triple' : 'inline4' };
    const out = ctx.createGain(); out.gain.value = 0; out.connect(sfxBus); e.out = out;
    if (def.electric) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3; lp.connect(out); e.lp = lp;
      const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
      const o2 = ctx.createOscillator(); o2.type = 'sine';
      const g1 = ctx.createGain(); g1.gain.value = 0.1; const g2 = ctx.createGain(); g2.gain.value = 0.5;
      o1.connect(g1); g1.connect(lp); o2.connect(g2); g2.connect(lp);
      o1.start(); o2.start(); Object.assign(e, { o1, o2 }); e.nodes.push(o1, o2);
      eng = e; return;
    }
    // цепочка: импульсы → перегруз → «труба» (НЧ-фильтр) → бас-полка → резонанс глушителя → выход
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.9 + loud * 1.6;
    const shelf = ctx.createBiquadFilter(); shelf.type = 'lowshelf'; shelf.frequency.value = 140; shelf.gain.value = 7 + loud * 9;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.Q.value = 1.3; body.gain.value = 5 + loud * 5;
    body.frequency.value = e.kind === 'vtwin' ? 70 : e.kind === 'single' ? 95 : e.kind === 'triple' ? 140 : 190;
    const ws = ctx.createWaveShaper(); ws.curve = shaper(0.35 + loud * 0.7); ws.oversample = '2x';
    const pre = ctx.createGain(); pre.gain.value = 0.9;
    pre.connect(ws); ws.connect(lp); lp.connect(shelf); shelf.connect(body); body.connect(out);
    // основной поток импульсов + слегка расстроенный двойник (неровность вспышек)
    const wave = exhaustWave(e.kind);
    const o1 = ctx.createOscillator(); o1.setPeriodicWave(wave);
    const o2 = ctx.createOscillator(); o2.setPeriodicWave(wave); o2.detune.value = 9;
    const g1 = ctx.createGain(); g1.gain.value = 0.75; const g2 = ctx.createGain(); g2.gain.value = 0.35;
    o1.connect(g1); g1.connect(pre); o2.connect(g2); g2.connect(pre);
    // суб-бас на частоте вспышек — «грудь» звука
    const sub = ctx.createOscillator(); sub.type = 'sine';
    const subG = ctx.createGain(); subG.gain.value = 0; sub.connect(subG); subG.connect(out);
    // «живая» нестабильность оборотов
    const wob = ctx.createOscillator(); wob.type = 'sine'; wob.frequency.value = e.kind === 'vtwin' ? 3.1 : 5.3;
    const wobG = ctx.createGain(); wobG.gain.value = e.kind === 'vtwin' ? 22 : 10; wob.connect(wobG); wobG.connect(o1.detune); wobG.connect(o2.detune);
    // шум выхлопных газов и впуска
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8; bp.frequency.value = 600;
    const ng = ctx.createGain(); ng.gain.value = 0;
    ns.connect(bp); bp.connect(ng); ng.connect(lp);
    [o1, o2, sub, wob, ns].forEach(n => n.start());
    Object.assign(e, { o1, o2, sub, subG, lp, shelf, ng, bp });
    e.nodes.push(o1, o2, sub, wob, ns);
    eng = e;
  }
  function stopEngine() {
    if (!eng) return;
    const e = eng; eng = null;
    try { e.out.gain.setTargetAtTime(0, ctx.currentTime, 0.05); } catch (err) {}
    setTimeout(() => e.nodes.forEach(n => { try { n.stop(); } catch (err) {} }), 300);
  }
  // треск и хлопки в глушителе при сбросе газа
  function crackle(big) {
    if (!ctx) return;
    const t = ctx.currentTime, loud = eng ? eng.loud : 0;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = big ? 500 + Math.random() * 300 : 1200 + Math.random() * 2200; f.Q.value = big ? 0.8 : 1.5;
    const g = ctx.createGain(); const v = (big ? 1.3 : 0.5 + Math.random() * 0.35) * (0.75 + loud * 0.7);
    const dur = big ? 0.09 : 0.012 + Math.random() * 0.02;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
    if (big) { // низкий «бух»
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      const og = ctx.createGain(); og.gain.setValueAtTime(1.1 * (0.75 + loud * 0.7), t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(og); og.connect(sfxBus); o.start(t); o.stop(t + 0.16);
    }
  }
  function updateEngine(rpm, throttle, load, limiter, dt) {
    if (!eng || !ctx) return false;
    const t = ctx.currentTime, d = eng.def, tc = 0.025;
    if (d.electric) {
      const f = 60 + rpm * 0.09;
      eng.o1.frequency.setTargetAtTime(f, t, tc); eng.o2.frequency.setTargetAtTime(f * 0.5, t, tc);
      eng.lp.frequency.setTargetAtTime(500 + rpm * 0.35, t, tc);
      eng.out.gain.setTargetAtTime(0.06 + 0.2 * Math.min(1, rpm / 6000) * (0.4 + throttle * 0.6), t, 0.05);
      return false;
    }
    const r = Math.min(1.1, rpm / d.redline), loud = eng.loud;
    const f0 = Math.max(4, rpm / 120); // частота цикла 720°
    const nf = (FIRING[eng.kind] || [0]).length;
    eng.o1.frequency.setTargetAtTime(f0, t, tc);
    eng.o2.frequency.setTargetAtTime(f0, t, tc);
    eng.sub.frequency.setTargetAtTime(Math.min(160, f0 * nf), t, tc);
    eng.subG.gain.setTargetAtTime((0.22 + 0.25 * throttle) * (1 - r * 0.5) * (1 + loud * 0.6), t, 0.05);
    // на газу «труба» открывается: больше верхов и баса, без газа — глухой рокот
    const sporty = eng.kind === 'inline4' ? 1.5 : eng.kind === 'triple' ? 1.2 : eng.kind === 'single' ? 1 : 0.7;
    eng.lp.frequency.setTargetAtTime((180 + 500 * r * sporty + 1700 * throttle * (0.35 + r) * sporty) * (1 + loud * 0.35), t, tc);
    eng.shelf.gain.setTargetAtTime(6 + loud * 9 + throttle * 4, t, 0.05);
    eng.bp.frequency.setTargetAtTime(400 + 1800 * r, t, tc);
    eng.ng.gain.setTargetAtTime(0.02 + throttle * 0.08 * (0.4 + r), t, tc);
    let vol = (0.22 + 0.3 * throttle + 0.18 * r) * (0.9 + loud * 0.7);
    if (limiter > 0) vol *= 0.55 + Math.random() * 0.45;
    eng.out.gain.setTargetAtTime(vol, t, 0.03);
    // откаты: резкий сброс газа на оборотах → серия треска и хлопков
    if (throttle > 0.6) { eng.armed = true; eng.gasT = 0; } else eng.gasT = (eng.gasT || 0) + dt;
    if (eng.armed && throttle < 0.25 && eng.gasT < 0.4 && r > 0.35) { eng.crackle = 0.5 + loud * 1.1 + r * 0.4; eng.armed = false; }
    let pop = false;
    if (eng.crackle > 0) {
      eng.crackle -= dt;
      if (throttle > 0.4) eng.crackle = 0;
      const rate = (14 + loud * 26) * Math.min(1, eng.crackle + 0.2);
      if (Math.random() < rate * dt) { const big = Math.random() < 0.12 + loud * 0.18; crackle(big); pop = big || Math.random() < 0.3; }
    }
    // отсечка: очередь выстрелов из глушителя
    eng.limT = (eng.limT || 0) - dt;
    if (limiter > 0 && eng.limT <= 0) { eng.limT = 0.05 + Math.random() * 0.05; const big = Math.random() < 0.45 + loud * 0.35; crackle(big); if (Math.random() < 0.5) crackle(false); pop = true; }
    return pop;
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
    player.volume = musicVol * 0.22;
    player.play().catch(() => {});
  }
  function stopMusic() { player.pause(); }
  function resumeMusic() { if (curTrack && musicVol > 0) { if (!player.src) player.src = 'music/' + curTrack + '.m4a'; player.play().catch(() => {}); } }
  function setVolumes(m, s) {
    musicVol = m; sfxVol = s;
    player.volume = m * 0.22;
    if (m <= 0) player.pause(); else if (curTrack && player.paused) resumeMusic();
    if (master) master.gain.value = s;
  }
  function suspend(on) { if (!ctx) return; if (on) ctx.suspend(); else ctx.resume(); }

  // прогазовка в гараже: холостые → газ до отсечки → сброс с треском
  let demoT = null;
  function revDemo(def, exhaust) {
    init(); if (!ctx) return;
    if (demoT) clearInterval(demoT);
    startEngine(def, exhaust);
    let t = 0; const idle = def.idle || 1000;
    demoT = setInterval(() => {
      t += 0.03;
      const thr = t > 0.35 && t < 1.25 ? 1 : 0;
      const rpm = t < 0.35 ? idle : t < 1.25 ? idle + (def.redline * 0.92 - idle) * Math.min(1, (t - 0.35) / 0.7) : Math.max(idle, def.redline * 0.92 * Math.exp(-(t - 1.25) * 1.6));
      updateEngine(rpm, thr, 0, 0, 0.03);
      if (t > 2.8) { clearInterval(demoT); demoT = null; stopEngine(); }
    }, 30);
  }
  // очередь выстрелов (переключение вверх / отсечка)
  function backfire(n) {
    if (!eng || !ctx || eng.def.electric) return false;
    const k = n || 2 + Math.floor(Math.random() * 2 + eng.loud * 3);
    for (let i = 0; i < k; i++) setTimeout(() => crackle(i === 0 || Math.random() < 0.35 + eng.loud * 0.3), i * (35 + Math.random() * 30));
    return true;
  }
  return { backfire, revDemo, init, startEngine: (d, e) => { if (demoT) { clearInterval(demoT); demoT = null; } startEngine(d, e); }, stopEngine, updateEngine, sfx, setScrape, music, stopMusic, resumeMusic, setVolumes, suspend };
})();
