// Игровой цикл: управление, камера, очки за трюки, падения, частицы, приборы
'use strict';

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = Math.floor(window.innerWidth * DPR); H = Math.floor(window.innerHeight * DPR);
  cv.width = W; cv.height = H;
}
window.addEventListener('resize', resize); resize();

// ---------- ввод ----------
const Input = { gas: 0, brake: 0, lean: 0, clutch: 0, keys: new Set(), touch: { gas: 0, brake: 0, back: 0, fwd: 0, clutch: 0 } };
const KEYMAP = { ArrowUp: 'gas', KeyW: 'gas', ArrowDown: 'brake', KeyS: 'brake', ArrowLeft: 'back', KeyA: 'back', ArrowRight: 'fwd', KeyD: 'fwd', Space: 'clutch', ShiftLeft: 'clutch', ShiftRight: 'clutch' };
window.addEventListener('keydown', e => {
  if (e.repeat) { if (KEYMAP[e.code]) e.preventDefault(); return; }
  if (KEYMAP[e.code]) { Input.keys.add(KEYMAP[e.code]); e.preventDefault(); }
  if (Game.state === 'play') {
    if (e.code === 'KeyE' || e.code === 'KeyX') Game.manualShift(1);
    if (e.code === 'KeyQ' || e.code === 'KeyZ') Game.manualShift(-1);
    if (e.code === 'KeyR') Game.restart();
    if (e.code === 'Escape' || e.code === 'KeyP') UI.pause();
  } else if (Game.state === 'pause' && (e.code === 'Escape' || e.code === 'KeyP')) UI.resume();
});
window.addEventListener('keyup', e => { if (KEYMAP[e.code]) Input.keys.delete(KEYMAP[e.code]); });
window.addEventListener('blur', () => { Input.keys.clear(); for (const k in Input.touch) Input.touch[k] = 0; });
function readInput() {
  const k = Input.keys, t = Input.touch;
  Input.gas = (k.has('gas') || t.gas) ? 1 : 0;
  Input.brake = (k.has('brake') || t.brake) ? 1 : 0;
  Input.lean = ((k.has('fwd') || t.fwd) ? 1 : 0) - ((k.has('back') || t.back) ? 1 : 0);
  Input.clutch = (k.has('clutch') || t.clutch) ? 1 : 0;
  return Input;
}

// ---------- частицы и тряпичная кукла ----------
const parts = [];
function puff(x, y, vx, vy, col, size, life, kind) { if (parts.length < 400) parts.push({ x, y, vx, vy, col, size, life, max: life, kind: kind || 'smoke' }); }

class Ragdoll {
  constructor(bike, pose) {
    const c = Math.cos(bike.a), s = Math.sin(bike.a), [cx, cy] = bike.def.com;
    const W2 = (p) => [bike.x + c * (p[0] - cx) - s * (p[1] - cy), bike.y + s * (p[0] - cx) + c * (p[1] - cy)];
    const names = ['head', 'shoulder', 'hip', 'knee', 'peg', 'elbow', 'bar'];
    this.p = names.map(n => { const w = W2(pose[n]); const rx = w[0] - bike.x, ry = w[1] - bike.y; const vx = bike.vx - bike.w * ry, vy = bike.vy + bike.w * rx; return { x: w[0], y: w[1], px: w[0] - vx / 60, py: w[1] - vy / 60 }; });
    const L = (a, b) => Math.hypot(this.p[a].x - this.p[b].x, this.p[a].y - this.p[b].y);
    this.c = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [0, 2]].map(([a, b]) => [a, b, L(a, b)]);
    this.torsoA = pose.torsoA;
  }
  step(dt, ter) {
    const o = { pen: 0 };
    for (const q of this.p) {
      const vx = (q.x - q.px) * 0.995, vy = (q.y - q.py) * 0.995;
      q.px = q.x; q.py = q.y; q.x += vx; q.y += vy - G * dt * dt;
    }
    for (let it = 0; it < 4; it++) {
      for (const [a, b, l] of this.c) {
        const A = this.p[a], B = this.p[b]; const dx = B.x - A.x, dy = B.y - A.y; const d = Math.hypot(dx, dy) || 1e-6; const f = (d - l) / d * 0.5;
        A.x += dx * f; A.y += dy * f; B.x -= dx * f; B.y -= dy * f;
      }
      for (const q of this.p) {
        if (ter.collide(q.x, q.y, 0.08, o)) {
          q.x += o.nx * o.pen; q.y += o.ny * o.pen;
          const vx = q.x - q.px, vy = q.y - q.py; const vn = vx * o.nx + vy * o.ny;
          const tx = vx - vn * o.nx, ty = vy - vn * o.ny;
          q.px = q.x - tx * 0.75 + vn * o.nx * 0.3; q.py = q.y - ty * 0.75 + vn * o.ny * 0.3;
        }
      }
    }
  }
  draw(ctx, rider) {
    const P = {}; ['head', 'shoulder', 'hip', 'knee', 'peg', 'elbow', 'bar'].forEach((n, i) => P[n] = [this.p[i].x, this.p[i].y]);
    P.neck = [(P.head[0] * 0.4 + P.shoulder[0] * 0.6), (P.head[1] * 0.4 + P.shoulder[1] * 0.6)];
    P.torsoA = Math.atan2(P.head[1] - P.hip[1], P.head[0] - P.hip[0]);
    P.bootA = Math.atan2(P.peg[1] - P.knee[1], P.peg[0] - P.knee[0]) + Math.PI / 2;
    drawRiderLimbs(ctx, P, rider, 'near');
  }
}

// ---------- игра ----------
const Game = {
  state: 'menu', time: 0, menuT: 0,
  start(trackId) {
    const track = trackById(trackId);
    this.track = track;
    this.ter = new Terrain(track);
    const def = bikeById(SAVE.bike), cfg = SAVE.bikes[SAVE.bike];
    this.def = def; this.cfg = Object.assign({ num: BIKES.indexOf(def) + 7 }, cfg);
    this.bike = new Bike(def, cfg, this.ter, track.mu);
    this.newRun();
    Sound.init(); Sound.startEngine(def, this.bike.exhaust); Sound.music(track.music);
    this.state = 'play';
  },
  newRun() {
    this.bike.reset(this.ter.startX + 2);
    this.run = { score: 0, time: 0, crashes: 0, combo: [], comboPts: 0, quiet: 0, wheelieT: 0, wheelieD: 0, stoppieT: 0, airT: 0, airRot: 0, airMaxH: 0,
      bestW: 0, bestWD: 0, cp: 0, finished: false, finT: 0, crashT: 0, flips: 0, landedWheelie: false, maxKmh: 0 };
    this.rag = null; this.popups = []; parts.length = 0; this.slowmo = 1;
    this.cam = { x: this.bike.x + 4, y: this.bike.y + 1, z: 1 };
    this.hint = SAVE.settings.hints ? 6 : 0;
  },
  restart() { if (!this.ter) return; this.newRun(); this.state = 'play'; UI.show(null); Sound.resumeMusic(); },
  manualShift(dir) { if (this.bike && SAVE.settings.manual && this.bike.shift(dir)) Sound.sfx.shift(); },
  popup(text, col, big) { this.popups.push({ text, col: col || '#fff', t: 0, big: !!big }); if (this.popups.length > 5) this.popups.shift(); },
  addTrick(name, pts) {
    pts = Math.round(pts);
    if (pts <= 0) return;
    this.run.combo.push(name); this.run.comboPts += pts;
    this.popup(name + '  +' + pts, '#ffe14a');
    Sound.sfx.trick();
  },
  bank() {
    const r = this.run;
    if (!r.combo.length) return;
    const mult = Math.min(4, 1 + (r.combo.length - 1) * 0.5);
    const total = Math.round(r.comboPts * mult);
    r.score += total;
    if (mult > 1) this.popup('КОМБО x' + mult.toFixed(1).replace('.0', '') + '  +' + total, '#3dffb0', true);
    r.combo = []; r.comboPts = 0;
    Sound.sfx.bank();
  },
  crash(reason) {
    const b = this.bike, r = this.run;
    if (b.crashed || r.finished) return;
    b.crashed = true; r.crashes++; r.crashT = 0;
    this.endWheelie(true); r.stoppieT = 0; r.airT = 0; r.airRot = 0;
    if (r.combo.length) this.popup('КОМБО ПОТЕРЯНО', '#ff5a5a');
    r.combo = []; r.comboPts = 0;
    this.popup(reason || 'ПАДЕНИЕ!', '#ff3b3b', true);
    this.rag = new Ragdoll(b, riderPose(b.def, b.lean));
    this.slowmo = 0.35;
    Sound.sfx.crash();
    if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) try { navigator.vibrate(120); } catch (e) {}
  },
  endWheelie(lost) {
    const r = this.run;
    if (r.wheelieT > 0.6 && !lost) {
      this.addTrick('ВИЛЛИ ' + r.wheelieT.toFixed(1) + 'с', r.wheelieP);
    }
    if (r.wheelieT > 0.6) {
      if (r.wheelieT > r.bestW) r.bestW = r.wheelieT;
      if (r.wheelieD > r.bestWD) r.bestWD = r.wheelieD;
    }
    r.wheelieT = 0; r.wheelieD = 0; r.wheelieP = 0; r.balT = 0; r.clockT = 0;
  },
  update(dt) {
    const b = this.bike, r = this.run, ter = this.ter;
    const inp = readInput();
    const sdt = dt * this.slowmo;
    this.slowmo = Math.min(1, this.slowmo + dt * 0.6);
    let ctrl0 = r.finished ? { gas: 0, brake: 0.6, lean: 0, clutch: 0 } : inp;
    b.inWheelie = false;
    if (!r.finished && !b.crashed && SAVE.settings.assist !== false) ctrl0 = this.assist(inp, b, dt);
    b.step(sdt, ctrl0, !SAVE.settings.manual);
    if (this.rag) this.rag.step(sdt, ter);
    r.time += r.finished ? 0 : sdt;
    const kmh = b.speed * 3.6; r.maxKmh = Math.max(r.maxKmh, kmh);
    // звук
    const pop = Sound.updateEngine(b.rpm, b.throttle, 0, b.limiter, dt);
    this.flame = pop ? 1 : Math.max(0, (this.flame || 0) - dt * 8);
    if (b.limiter > 0 && Math.random() < 0.3) this.flame = 0.7;
    Sound.setScrape(b.scrape, b.slipAmt > 0.15 && ter.track.theme !== 'desert' ? b.slipAmt : 0);
    if (this._gear !== b.gear) { if (this._gear !== undefined) { Sound.sfx.shift(); if (b.gear > this._gear && Sound.backfire()) this.flame = 1; } this._gear = b.gear; }
    // частицы
    const wr = b.wr;
    if (wr.contact && b.slipAmt > 0.22) {
      const dirt = ter.track.theme === 'desert' || wr.tag === 'dirt';
      if (Math.random() < 0.6) puff(wr.x - 0.1, wr.y - wr.r * 0.8, -1 - Math.random() * 2, 0.5 + Math.random(), dirt ? '#b77a4a' : '#d8d8de', 0.15 + b.slipAmt * 0.25, 0.7 + Math.random() * 0.6);
    }
    if (b.scrape > 0.1) for (let i = 0; i < 3; i++) { const bp = b.local(-0.3, -0.3); puff(bp[0], bp[1], -b.vx * 0.3 + (Math.random() - 0.5) * 3, Math.random() * 3, '#ffd24a', 0.05, 0.35, 'spark'); }
    for (const p of parts) {
      p.life -= sdt; p.x += p.vx * sdt; p.y += p.vy * sdt;
      if (p.kind === 'spark') p.vy -= 9 * sdt; else { p.vx *= 1 - sdt; p.vy *= 1 - sdt * 0.5; p.size += sdt * 0.5; }
    }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
    // падение
    if (b.crashed) {
      r.crashT += dt;
      if (r.crashT > 2.3) {
        const cpx = ter.checkpoints.filter(x => x <= Math.max(b.wr.x, this.rag ? this.rag.p[2].x : 0) - 3).pop() || ter.startX;
        b.reset(cpx + 2); this.rag = null; this.cam.x = b.x + 4; this.cam.y = b.y + 1;
        this.popup('ЧЕКПОИНТ', '#9fd8ff');
      }
    } else {
      const ground = Math.atan(ter.slopeAt(b.wr.x));
      let pitch = b.a - ground;
      const up = Math.cos(b.a);
      const t = b.touch;
      if (t.head) this.crash('УДАР ГОЛОВОЙ!');
      else if (t.tail && pitch > 0.6) this.crash('ПЕРЕВОРОТ!');
      else if (t.nose && pitch < -0.5) this.crash('ЧЕРЕЗ РУЛЬ!');
      else if ((t.tail || t.nose || t.belly || t.pivot) && up < 0.1) this.crash('ПАДЕНИЕ!');
      else if (b.y < ter.heightAt(b.x) - 3.5) this.crash('В ОБРЫВ!');
      // трюки
      if (!b.crashed) this.tricks(dt, pitch, kmh);
    }
    // чекпоинты и финиш
    const cps = ter.checkpoints;
    if (r.cp < cps.length && b.wr.x > cps[r.cp] && !b.crashed) { if (r.cp > 0) { this.popup('ЧЕКПОИНТ', '#9fd8ff'); Sound.sfx.checkpoint(); } r.cp++; }
    if (!r.finished && b.wr.x > ter.finishX && !b.crashed) {
      this.endWheelie(false); this.bank();
      r.finished = true; r.finT = 0;
      this.popup('ФИНИШ!', '#ffcc00', true); Sound.sfx.finish();
    }
    if (r.finished) { r.finT += dt; if (r.finT > 2.2 && this.state === 'play') this.finish(); }
    // камера
    const look = Math.max(-2, Math.min(5, b.vx * 0.22));
    const tx = (this.rag && b.crashed ? (this.rag.p[2].x + b.x) / 2 : b.x) + look + 1.2;
    const gr = Math.max(ter.heightAt(b.x), ter.heightAt(b.x + 6), ter.heightAt(b.x - 4));
    const hAbove = Math.max(0, b.y - gr - 1.2);
    const ty = b.y + 1.3 + Math.max(-2, Math.min(3, b.vy * 0.12)) - Math.min(3.5, hAbove * 0.5);
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 4);
    this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 3);
    const zt = 1 + Math.min(0.45, b.speed * 0.008) + Math.min(0.45, hAbove * 0.05);
    this.cam.z += (zt - this.cam.z) * Math.min(1, dt * 1.5);
    for (const p of this.popups) p.t += dt;
    this.popups = this.popups.filter(p => p.t < 1.8);
    if (this.hint > 0 && (Input.gas || Input.lean)) this.hint -= dt;
  },
  // стант-ассист: держишь газ — байк сам ловит точку баланса (как опытный райдер газом и задним тормозом).
  // Назад — выше, к «12 часам»; вперёд — ниже; отпустил газ — колесо опускается.
  assist(inp, b, dt) {
    const out = { gas: inp.gas, brake: inp.brake, lean: inp.lean, clutch: inp.clutch };
    const pitch = b.a - Math.atan(this.ter.slopeAt(b.wr.x));
    const rearOn = b.wr.contact || b.wr.air < 0.05;
    const frontUp = !b.wf.contact && b.wf.air > 0.03;
    this.kickT = Math.max(0, (this.kickT || 0) - dt); this.kickCD = Math.max(0, (this.kickCD || 0) - dt);
    // подъём: газ + назад → автоматический «клатч-кик»
    if (inp.gas && inp.lean < 0 && b.wf.contact && pitch < 0.06 && b.speed > 0.5 && this.kickCD <= 0 && !b.def.electric) { this.kickT = 0.28; this.kickCD = 1.4; }
    // колесо проседает в вилли — короткий клатч-кик, чтобы подбросить его обратно
    // подъём на высокой передаче: коробка сама сбрасывает вниз, как стантёр
    if (inp.gas && inp.lean < 0 && b.wf.contact && !SAVE.settings.manual && b.gear > 0 && b.shiftT <= 0) {
      const wr = -b.wr.w * 30 / Math.PI;
      if (wr * b.def.gears[b.gear - 1] < b.def.redline * 0.85) b.shift(-1);
    }
    if (this.kickT > 0) out.clutch = 1;
    if (rearOn && frontUp && pitch > 0.08 && inp.gas && !inp.brake) {
      b.inWheelie = true;
      const target = Math.min(1.35, b.balance + 0.03 - inp.lean * 0.3);
      const e = target - pitch;
      this.assistI = Math.max(-0.5, Math.min(0.6, (this.assistI || 0) + e * dt * 3));
      const u = 0.2 + this.assistI + 4.5 * e - 1.3 * b.w;
      out.gas = Math.max(0, Math.min(1, u));
      out.brake = u < 0 ? Math.min(1, -u * 1.5) : 0;
      out.lean = inp.lean * 0.35 + Math.max(-1, Math.min(1, -e * 2 + b.w * 0.6)) * 0.5;
      out.clutch = 0;
    } else if (!frontUp) this.assistI = 0;
    return out;
  },
  tricks(dt, pitch, kmh) {
    const b = this.bike, r = this.run;
    const rearOn = b.wr.air < 0.06, frontOn = b.wf.air < 0.1;
    const moving = b.vx > 1.2;
    const wasAir = r.airT;
    // вилли
    if (rearOn && !frontOn && pitch > 0.08 && moving) {
      r.wheelieT += dt; r.wheelieD += b.vx * dt;
      const bal = Math.abs(pitch - b.balance) < 0.12;
      const clock = pitch > 1.2;
      const mult = 1 + Math.min(3, Math.floor(r.wheelieT / 3)) * 0.5;
      r.wheelieP = (r.wheelieP || 0) + dt * (80 + kmh * 2) * mult * (bal ? 1.6 : 1) * (clock ? 2 : 1);
      r.balT = bal ? (r.balT || 0) + dt : 0;
      if (clock) { r.clockT = (r.clockT || 0) + dt; if (r.clockT > 1 && !r.clockShown) { r.clockShown = true; this.popup('12 ЧАСОВ!', '#ff7af0', true); } }
      if (r.wheelieT > SAVE.bestWheelie && SAVE.bestWheelie > 1 && !r.recordShown) { r.recordShown = true; this.popup('НОВЫЙ РЕКОРД ВИЛЛИ!', '#3dffb0', true); }
    } else if (r.wheelieT > 0) {
      if (!rearOn && !frontOn) { /* прыжок из вилли — копим дальше в воздухе */ if (wasAir > 0.5) this.endWheelie(false); }
      else this.endWheelie(false);
      r.clockShown = false; r.recordShown = false;
    }
    // стоппи
    if (frontOn && !rearOn && pitch < -0.08 && moving) { r.stoppieT += dt; }
    else if (r.stoppieT > 0) { if (r.stoppieT > 0.5) this.addTrick('СТОППИ ' + r.stoppieT.toFixed(1) + 'с', r.stoppieT * (160 + kmh * 2)); r.stoppieT = 0; }
    // полёт
    if (!rearOn && !frontOn) {
      r.airT += dt; r.airRot += b.w * dt;
      r.airMaxH = Math.max(r.airMaxH, b.wr.y - this.ter.heightAt(b.wr.x));
    } else if (r.airT > 0) {
      if (r.airT > 0.6) {
        const turns = r.airRot / (Math.PI * 2);
        const flips = Math.floor(Math.abs(turns) + 0.12);
        let pts = r.airT * 120 + r.airMaxH * 40;
        if (r.airT > 1.3) this.addTrick('БОЛЬШОЙ ПРЫЖОК ' + r.airT.toFixed(1) + 'с', pts); else this.addTrick('ПРЫЖОК', pts);
        if (flips > 0) { this.addTrick((flips > 1 ? flips + 'x ' : '') + (turns > 0 ? 'БЭКФЛИП' : 'ФРОНТФЛИП'), flips * 1500); r.flips += flips; }
        Sound.sfx.land(Math.abs(b.vy));
        for (let i = 0; i < 10; i++) puff(b.wr.x + (Math.random() - 0.5) * 1.5, b.wr.y - b.wr.r, (Math.random() - 0.5) * 3, Math.random() * 1.5, this.ter.track.theme === 'desert' ? '#c98a55' : '#bbb', 0.3, 0.8);
        if (rearOn && !frontOn && pitch > 0.15 && r.airT > 0.9) this.addTrick('ПОСАДКА В ВИЛЛИ', 300);
        else if (Math.abs(pitch) < 0.2 && rearOn && frontOn && r.airT > 0.9) this.addTrick('ЧИСТО', 100);
      }
      r.airT = 0; r.airRot = 0; r.airMaxH = 0;
    }
    // фиксация комбо после спокойной езды
    if (rearOn && frontOn && r.wheelieT === 0 && r.stoppieT === 0) { r.quiet += dt; if (r.quiet > 0.8 && r.combo.length) this.bank(); }
    else r.quiet = 0;
  },
  finish() {
    const r = this.run, t = this.track;
    this.state = 'result';
    const coins = Math.round(r.score / 25) + 60;
    SAVE.coins += coins; SAVE.totalRuns++;
    const prev = SAVE.best[t.id] || 0;
    const rec = r.score > prev;
    if (rec) SAVE.best[t.id] = r.score;
    let wRec = false;
    if (r.bestW > SAVE.bestWheelie) { SAVE.bestWheelie = r.bestW; wRec = true; }
    if (r.bestWD > SAVE.bestWheelieDist) SAVE.bestWheelieDist = r.bestWD;
    saveGame();
    Sound.stopEngine(); Sound.setScrape(0, 0);
    UI.results({ score: r.score, coins, rec, prev, time: r.time, crashes: r.crashes, bestW: r.bestW, bestWD: r.bestWD, wRec, flips: r.flips, maxKmh: r.maxKmh });
  },
  quit() {
    if (this.run && this.state !== 'result') {
      const coins = Math.round(this.run.score / 50);
      if (coins > 0) { SAVE.coins += coins; saveGame(); }
    }
    if (this.run) { const r = this.run; if (r.bestW > SAVE.bestWheelie) { SAVE.bestWheelie = r.bestW; saveGame(); } }
    Sound.stopEngine(); Sound.setScrape(0, 0);
    this.state = 'menu';
  },

  // ---------- отрисовка ----------
  render(dt) {
    if (this.state === 'menu' || !this.ter) { this.renderMenu(dt); return; }
    const b = this.bike, cam = this.cam, ter = this.ter, theme = ter.track.theme;
    const k = H / ((document.body.classList.contains('touch') ? 6.4 : 7.4) * cam.z);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawBackground(ctx, theme, cam.x, cam.y, W, H, k, this.time);
    ctx.setTransform(k, 0, 0, -k, W / 2 - cam.x * k, H / 2 + cam.y * k);
    const x0 = cam.x - W / 2 / k - 2, x1 = cam.x + W / 2 / k + 2;
    const yb = cam.y - H / 2 / k - 2;
    // декорации позади
    const night = !!THEMES[theme].night;
    for (const p of ter.props) if (p.x > x0 - 6 && p.x < x1 + 6) drawProp(ctx, p, ter.heightAt(p.x) - 0.1, theme, night);
    for (let m = 100; m < ter.finishX; m += 100) if (m > x0 - 2 && m < x1 + 2) { const y = ter.heightAt(m); ctx.fillStyle = '#ddd'; ctx.fillRect(m - 0.04, y, 0.08, 1.1); ctx.fillStyle = '#1d4fb8'; ctx.fillRect(m - 0.45, y + 1.1, 0.9, 0.45); textW(ctx, m + 'м', m, y + 1.33, 0.3, '#fff'); }
    ter.checkpoints.forEach((cx, i) => { if (i > 0 && cx > x0 - 3 && cx < x1 + 3) drawFlag(ctx, cx, ter.heightAt(cx), i < this.run.cp ? '#33d17a' : '#ffcc00', this.time); });
    if (ter.finishX > x0 - 5 && ter.finishX < x1 + 5) drawFinish(ctx, ter.finishX, ter.heightAt(ter.finishX));
    drawTerrain(ctx, ter, theme, x0, x1, yb);
    // частицы позади
    for (const p of parts) {
      const a = Math.max(0, p.life / p.max);
      if (p.kind === 'spark') { ctx.strokeStyle = p.col; ctx.globalAlpha = a; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke(); }
      else { ctx.globalAlpha = a * 0.32; circ(ctx, p.x, p.y, p.size, p.col); }
    }
    ctx.globalAlpha = 1;
    // тень под мотоциклом
    { const gy = ter.heightAt(b.x), hh = Math.max(0, b.y - gy - 0.7);
      const sg = ctx.createRadialGradient(b.x, gy, 0.1, b.x, gy, b.def.wb * 0.85);
      const al = Math.max(0, 0.45 - hh * 0.06); sg.addColorStop(0, `rgba(0,0,0,${al})`); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save(); ctx.translate(b.x, gy); ctx.scale(1, 0.12); ctx.translate(-b.x, -gy); ctx.fillStyle = sg; ctx.fillRect(b.x - 2, gy - 2, 4, 4); ctx.restore(); }
    drawBike(ctx, b, this.cfg, SAVE.rider, this.flame);
    if (this.rag) this.rag.draw(ctx, SAVE.rider);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // виньетка
    if (!this._vig || this._vig.w !== W || this._vig.h !== H) { const v = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, Math.hypot(W, H) * 0.62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.42)'); this._vig = { g: v, w: W, h: H }; }
    ctx.fillStyle = this._vig.g; ctx.fillRect(0, 0, W, H);
    this.drawHUD(dt);
  },
  renderMenu(dt) {
    this.menuT += dt;
    if (!this.menuTer) this.menuTer = new Terrain(TRACKS[0]);
    const ter = this.menuTer;
    const def = bikeById(SAVE.bike), cfg = Object.assign({ num: BIKES.indexOf(def) + 7 }, SAVE.bikes[SAVE.bike]);
    const k = H / 7.5;
    const camX = 30 + this.menuT * 6, camY = 1.6;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawBackground(ctx, 'sunset', camX, camY, W, H, k, this.menuT);
    ctx.setTransform(k, 0, 0, -k, W / 2 - camX * k, H / 2 + camY * k);
    const flat = 0;
    const x0 = camX - W / 2 / k - 2, x1 = camX + W / 2 / k + 2;
    for (const p of ter.props) if (p.x > x0 - 6 && p.x < x1 + 6) drawProp(ctx, p, ter.heightAt(p.x) - 0.1, 'sunset', false);
    // ровная дорога для витрины
    ctx.fillStyle = '#3b2c30'; ctx.fillRect(x0, -20, x1 - x0, 20);
    ctx.fillStyle = THEMES.sunset.road; ctx.fillRect(x0, -0.5, x1 - x0, 0.5);
    ctx.setLineDash([1.5, 1.8]); ctx.lineDashOffset = 0; ctx.strokeStyle = '#e8d27a'; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(x0 - (x0 % 3.3), -0.28); ctx.lineTo(x1, -0.28); ctx.stroke(); ctx.setLineDash([]);
    // мотоцикл в вечном вилли
    const bx = camX + (W / k) * 0.2;
    const ang = 0.62 + Math.sin(this.menuT * 1.3) * 0.08;
    const rr = def.rr, [cx, cy] = def.com;
    const c = Math.cos(ang), s = Math.sin(ang);
    const rax = bx, ray = flat + rr;
    const pose = { def, a: ang, x: rax + c * cx - s * cy, y: ray + s * cx + c * cy, lean: -0.6, wr: { x: rax, y: ray, rot: -this.menuT * 20, w: -20 }, wf: { x: rax + c * def.wb - s * (def.rf - rr), y: ray + s * def.wb + c * (def.rf - rr) - 0.03, rot: -this.menuT * 18, w: -20 } };
    drawBike(ctx, pose, cfg, SAVE.rider, 0);
    if (Math.random() < 0.6) puff(rax - 0.2, 0.05, -4 - Math.random() * 3, 0.6 + Math.random(), '#d8d8de', 0.25, 1.2);
    for (const p of parts) { p.life -= dt; p.x += (p.vx + 6) * dt; p.y += p.vy * dt; p.size += dt * 0.5; }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
    for (const p of parts) { ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.4; circ(ctx, p.x, p.y, p.size, p.col); }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  },
  drawHUD(dt) {
    const b = this.bike, r = this.run, d = b.def;
    const u = Math.min(W, H * 1.6) / 100; // единица интерфейса
    const font = (s) => `${Math.round(s)}px "Russo One", sans-serif`;
    const touch = document.body.classList.contains('touch');
    ctx.textBaseline = 'middle';
    // очки
    ctx.textAlign = 'left';
    ctx.font = font(u * 2.2); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillText('ОЧКИ', u * 2.5, u * 3);
    ctx.font = font(u * 4); ctx.fillStyle = '#fff'; ctx.fillText(r.score.toLocaleString('ru-RU'), u * 2.5, u * 6.5);
    if (r.combo.length) {
      ctx.font = font(u * 2.2); ctx.fillStyle = '#3dffb0';
      const cm = Math.min(4, 1 + (r.combo.length - 1) * 0.5);
      ctx.fillText('КОМБО x' + cm + '  ' + Math.round(r.comboPts * cm), u * 2.5, u * 10);
    }
    const best = SAVE.best[this.track.id] || 0;
    ctx.font = font(u * 1.7); ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('РЕКОРД ' + best.toLocaleString('ru-RU') + '   ВИЛЛИ ' + SAVE.bestWheelie.toFixed(1) + 'с', u * 2.5, u * (r.combo.length ? 13 : 10));
    // прогресс
    const pw = W * 0.34, px = W / 2 - pw / 2, py = u * 2.6;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(px, py - u * 0.5, pw, u);
    const prog = Math.max(0, Math.min(1, b.wr.x / this.ter.finishX));
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(px, py - u * 0.5, pw * prog, u);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (const c of this.ter.checkpoints) ctx.fillRect(px + pw * c / this.ter.finishX - 1, py - u * 0.8, 2, u * 1.6);
    ctx.textAlign = 'center'; ctx.font = font(u * 1.6); ctx.fillStyle = '#fff';
    ctx.fillText(this.track.name + '  ·  ' + Math.round(Math.max(0, b.wr.x)) + ' / ' + Math.round(this.ter.finishX) + ' м  ·  ' + fmtTime(r.time), W / 2, py + u * 2);
    // вилли-таймер и угол
    if (r.wheelieT > 0.3) {
      ctx.font = font(u * 4.5); ctx.fillStyle = '#ffe14a';
      ctx.fillText('ВИЛЛИ ' + r.wheelieT.toFixed(2) + 'с', W / 2, H * 0.24);
      ctx.font = font(u * 2); ctx.fillStyle = '#fff';
      ctx.fillText(Math.round(r.wheelieD) + ' м   +' + Math.round(r.wheelieP || 0), W / 2, H * 0.24 + u * 4);
    }
    // индикатор баланса (угол рамы)
    const pitch = b.a - Math.atan(this.ter.slopeAt(b.wr.x));
    if (pitch > 0.05 && !b.crashed || r.wheelieT > 0) this.drawBalance(W * (touch ? 0.62 : 0.8), H * 0.34, u * 6, pitch, b.balance);
    // всплывающие надписи
    let py2 = H * 0.36 + (r.wheelieT > 0.3 ? u * 3 : 0);
    for (const p of this.popups) {
      const a = p.t < 0.15 ? p.t / 0.15 : Math.max(0, 1 - (p.t - 1.2) / 0.6);
      ctx.globalAlpha = a; ctx.font = font(u * (p.big ? 3.6 : 2.4));
      ctx.lineWidth = u * 0.5; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(p.text, W / 2, py2 - p.t * u * 3);
      ctx.fillStyle = p.col; ctx.fillText(p.text, W / 2, py2 - p.t * u * 3);
      py2 += u * (p.big ? 4.5 : 3.2);
    }
    ctx.globalAlpha = 1;
    // приборы
    const R = Math.min(W, H) * (touch ? 0.09 : 0.13);
    const gy = touch ? R * 1.15 + u * 5.5 : H - R * 1.12 - u;
    const gx = touch ? W - R * 1.2 - u * 1.5 : W / 2 + R * 0.75;
    const top = Math.ceil(topSpeed(d, b) * 3.6 / 40) * 40;
    this.dial(gx, gy, R, b.speed * 3.6, top, top > 200 ? 40 : 20, 'км/ч', Math.round(b.speed * 3.6), null);
    const tx = gx - R * 1.7;
    if (d.electric) this.dial(tx, gy + R * 0.25, R * 0.72, Math.max(0, b.throttle * 100 * Math.min(1, b.rpm / 3000 + 0.3)), 100, 25, 'кВт %', null, 'E');
    else this.dial(tx, gy + R * 0.25, R * 0.72, b.rpm / 1000, Math.ceil(d.redline / 1000) + 1, d.redline > 10000 ? 2 : 1, '×1000', null, b.clutch > 0.5 ? 'N' : String(b.gear + 1), d.redline / 1000);
    // подсказка
    if (this.hint > 0) {
      ctx.globalAlpha = Math.min(1, this.hint);
      ctx.font = font(u * 1.9); ctx.fillStyle = '#fff';
      const lines = touch ? ['ГАЗ + ◀ НАЗАД — поднять колесо', 'Держи ГАЗ — ассист держит баланс', '◀ выше · ▶ ниже · ТОРМОЗ — опустить'] : ['↑ + ← — поднять колесо · держи ↑ — баланс', '← выше · → ниже · ↓ тормоз · Пробел — сцепление', 'R — заново · Esc — пауза' + (SAVE.settings.manual ? ' · Q/E — передачи' : '')];
      lines.forEach((l, i) => { ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = u * 0.4; ctx.strokeText(l, W / 2, H * 0.14 + u * 2 + i * u * 2.6); ctx.fillText(l, W / 2, H * 0.14 + u * 2 + i * u * 2.6); });
      ctx.globalAlpha = 1;
    }
  },
  dial(x, y, R, val, max, step, label, digital, center, red) {
    const a0 = Math.PI * 0.75, sweep = Math.PI * 1.5;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(x, y - R * 0.3, R * 0.1, x, y, R);
    g.addColorStop(0, 'rgba(40,44,56,0.92)'); g.addColorStop(1, 'rgba(10,11,16,0.92)');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = R * 0.06; ctx.strokeStyle = '#8b93a3'; ctx.stroke();
    if (red) {
      ctx.beginPath(); ctx.arc(x, y, R * 0.84, a0 + sweep * red / max, a0 + sweep); ctx.lineWidth = R * 0.1; ctx.strokeStyle = '#e8262d'; ctx.stroke();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let v = 0; v <= max + 1e-6; v += step / 2) {
      const a = a0 + sweep * v / max, major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
      const r1 = R * (major ? 0.74 : 0.8), r2 = R * 0.9;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2);
      ctx.lineWidth = major ? R * 0.035 : R * 0.018; ctx.strokeStyle = '#e8ecf3'; ctx.stroke();
      if (major) { ctx.font = `${Math.round(R * 0.15)}px "Russo One", sans-serif`; ctx.fillStyle = '#e8ecf3'; ctx.fillText(String(Math.round(v)), x + Math.cos(a) * R * 0.58, y + Math.sin(a) * R * 0.58); }
    }
    ctx.font = `${Math.round(R * 0.12)}px "Russo One", sans-serif`; ctx.fillStyle = '#9aa3b5'; ctx.fillText(label, x, y + R * 0.32);
    if (digital !== null && digital !== undefined) { ctx.font = `${Math.round(R * 0.28)}px "Russo One", sans-serif`; ctx.fillStyle = '#fff'; ctx.fillText(String(digital), x, y + R * 0.62); }
    if (center) { ctx.font = `${Math.round(R * 0.36)}px "Russo One", sans-serif`; ctx.fillStyle = '#ffcc00'; ctx.fillText(center, x, y + R * 0.6); }
    const a = a0 + sweep * Math.min(1.03, Math.max(0, val / max));
    ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * R * 0.12, y - Math.sin(a) * R * 0.12); ctx.lineTo(x + Math.cos(a) * R * 0.86, y + Math.sin(a) * R * 0.86);
    ctx.lineWidth = R * 0.045; ctx.strokeStyle = '#ff3b30'; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R * 0.08, 0, Math.PI * 2); ctx.fillStyle = '#ddd'; ctx.fill();
    ctx.restore();
  },
  drawBalance(x, y, R, pitch, bal) {
    // полукруг: 0° справа … 90° вверх, зелёная зона — точка баланса
    ctx.save();
    const A = v => -v; // угол на экране (y вниз)
    ctx.lineWidth = R * 0.14;
    ctx.beginPath(); ctx.arc(x, y, R, A(Math.PI / 2), A(0), false); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R, A(Math.min(Math.PI / 2, bal + 0.12)), A(bal - 0.12), false); ctx.strokeStyle = '#33d17a'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R, A(Math.PI / 2), A(1.25), false); ctx.strokeStyle = '#e8262d'; ctx.stroke();
    const p = Math.max(0, Math.min(Math.PI / 2, pitch));
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(p) * R * 1.12, y - Math.sin(p) * R * 1.12);
    ctx.lineWidth = R * 0.06; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.stroke();
    ctx.font = `${Math.round(R * 0.26)}px "Russo One", sans-serif`; ctx.fillStyle = '#fff'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(pitch * 180 / Math.PI) + '°', x - R * 0.1, y - R * 0.15);
    ctx.restore();
  }
};

function fmtTime(t) { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); }
function bikeHP(def, cfg) {
  const ex = EXHAUSTS.find(e => e.id === (cfg && cfg.exhaust)) || EXHAUSTS[0];
  const t = def.torque * (1 + 0.07 * (cfg ? cfg.upg.engine : 0) + ex.power);
  return Math.round(t * def.peak * Math.PI / 30 / 1000 * 1.36);
}
function topSpeed(def, b) {
  const tq = b ? b.torque : def.torque;
  const kW = tq * def.peak * Math.PI / 30;
  const cda = 0.42 + 0.0012 * def.mass;
  const vAir = Math.cbrt(kW / (0.6 * cda) * 0.9);
  const vGear = def.redline * Math.PI / 30 / def.gears[def.gears.length - 1] * def.rr;
  return Math.min(vAir, vGear);
}

// ---------- главный цикл ----------
let last = performance.now(), acc = 0;
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  Game.time += dt;
  if (Game.state === 'play') {
    acc += dt;
    let n = 0;
    while (acc >= 1 / 60 && n < 4) { Game.update(1 / 60); acc -= 1 / 60; n++; }
    if (n === 4) acc = 0;
  }
  try { Game.render(dt); } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange', () => { if (document.hidden && Game.state === 'play') UI.pause(); });
