// Физика: рельеф трассы и мотоцикл (рама + 2 колеса на подвеске, двигатель со сцеплением)
'use strict';

const G = 9.81;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------------- Трасса ----------------
class Terrain {
  constructor(track) {
    this.track = track;
    this.xs = []; this.ys = []; this.tags = [];
    this.props = []; this.checkpoints = []; this.ramps = [];
    const rnd = mulberry32(track.seed * 7919 + 13);
    this.rnd = rnd;
    let x = -60, y = 0;
    const P = (px, py, tag) => { this.xs.push(px); this.ys.push(py); this.tags.push(tag || 'road'); x = px; y = py; };
    const base = () => y;
    const surf = track.theme === 'desert' ? 'dirt' : (track.theme === 'mountain' ? 'mix' : 'road');
    P(-60, 0, surf);
    const flat = L => { const b = base(); const n = Math.max(1, Math.round(L / 3)); for (let i = 1; i <= n; i++) P(x + L / n, b, surf); this.ys[this.ys.length - 1] = b; y = b; };
    const curve = (L, fn, tag, step) => { const x0 = x, b = base(); const n = Math.max(2, Math.ceil(L / (step || 0.6))); for (let i = 1; i <= n; i++) { const t = i / n; P(x0 + L * t, b + fn(t), tag || surf); } };
    const R = (a, b) => a + rnd() * (b - a);
    flat(110);
    this.startX = 0;
    const feats = Object.entries(track.mix);
    const total = feats.reduce((s, f) => s + f[1], 0);
    let last = '';
    while (x < track.len - 90) {
      let r = rnd() * total, kind = feats[0][0];
      for (const [k, w] of feats) { r -= w; if (r <= 0) { kind = k; break; } }
      if (kind === last && kind !== 'flat') kind = 'flat';
      last = kind;
      switch (kind) {
        case 'flat': flat(R(30, 70)); break;
        case 'roll': { const L = R(50, 90), amp = R(0.12, 0.35), n = Math.max(1, Math.round(L / R(25, 40))); curve(L, t => amp * (1 - Math.cos(2 * Math.PI * n * t)) / 2); flat(10); break; }
        case 'hill': { const L = R(40, 65), h = R(1.5, 3.5); curve(L, t => h * (1 - Math.cos(2 * Math.PI * t)) / 2); flat(12); break; }
        case 'whoops': { const n = 3 + Math.floor(rnd() * 3), amp = R(0.08, 0.15); curve(n * 6, t => amp * (1 - Math.cos(2 * Math.PI * n * t)) / 2, surf, 0.4); flat(15); break; }
        case 'kicker': { const h = R(0.8, 1.5), L = h * 2.6; const rx = x; curve(L, t => h * t * t, 'ramp', 0.2); this.ramps.push([rx, x]); P(x + 0.04, base() - h, surf); flat(R(30, 45)); break; }
        case 'table': { const h = R(1.2, 2.4), L = h * 2.8; const rx = x; curve(L, t => h * t * t, 'ramp', 0.25); const top = R(7, 15); const b = base(); P(x + top, b, 'ramp'); curve(h * 3.4, t => -h * (1 - Math.cos(Math.PI * t)) / 2, 'ramp', 0.3); this.ramps.push([rx, x]); flat(R(25, 40)); break; }
        case 'gap': { const h = R(1.2, 2.2), L = h * 2.7, gp = R(5, 11); const rx = x; curve(L, t => h * t * t, 'ramp', 0.2); const b = base(); P(x + 0.04, b - h - 5, 'pit'); P(x + gp, b - h - 5, 'pit'); P(x + 0.04, b - 0.12, 'ramp'); curve(h * 4, t => -(h - 0.12) * (1 - Math.cos(Math.PI * t)) / 2, 'ramp', 0.3); this.ramps.push([rx, x]); flat(R(25, 40)); break; }
        case 'step': { const h = R(1.2, 2.5); const rx = x; curve(h * 3.2, t => h * t, 'ramp', 0.5); const b = base(); P(x + R(10, 20), b, 'box'); if (rnd() < 0.6) { P(x + 0.04, b - h, surf); } else { curve(h * 3.6, t => -h * (1 - Math.cos(Math.PI * t)) / 2, 'ramp', 0.3); } this.ramps.push([rx, x]); flat(R(25, 40)); break; }
        case 'climb': { const L = R(45, 75), h = R(6, 12); curve(L, t => h * (1 - Math.cos(Math.PI * t)) / 2, surf, 1); flat(15); break; }
        case 'descent': { const L = R(45, 75), h = R(6, 12); curve(L, t => -h * (1 - Math.cos(Math.PI * t)) / 2, surf, 1); flat(15); break; }
      }
    }
    flat(Math.max(40, track.len - x));
    this.finishX = x;
    flat(260);
    for (let cx = 0; cx < this.finishX - 40; cx += 180) this.checkpoints.push(cx);
    // декорации на ровных участках
    const kinds = { sunset: ['lamp', 'palm', 'palm', 'bench', 'cone'], desert: ['cactus', 'cactus', 'rock', 'rock', 'skull'], night: ['lamp', 'barrel', 'crate', 'cone', 'lamp'], mountain: ['pine', 'pine', 'rock', 'sign', 'pine'] }[track.theme];
    for (let px = 8; px < this.finishX + 200; px += R(9, 22)) {
      const s = this.slopeAt(px);
      if (Math.abs(s) > 0.12 || this.tagAt(px) !== surf) continue;
      if (this.ramps.some(r => px > r[0] - 6 && px < r[1] + 8)) continue;
      this.props.push({ x: px, kind: kinds[Math.floor(rnd() * kinds.length)], s: R(0.85, 1.2), back: rnd() < 0.6 });
    }
  }
  idx(x) { // последний индекс i, где xs[i] <= x
    const xs = this.xs; let lo = 0, hi = xs.length - 1;
    if (x <= xs[0]) return 0;
    if (x >= xs[hi]) return hi - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
    return lo;
  }
  heightAt(x) {
    let i = this.idx(x); const xs = this.xs, ys = this.ys;
    while (i < xs.length - 2 && xs[i + 1] <= x) i++;
    const dx = xs[i + 1] - xs[i];
    if (dx < 1e-6) return Math.max(ys[i], ys[i + 1]);
    const t = Math.min(1, Math.max(0, (x - xs[i]) / dx));
    return ys[i] + (ys[i + 1] - ys[i]) * t;
  }
  slopeAt(x) { return (this.heightAt(x + 0.5) - this.heightAt(x - 0.5)); }
  tagAt(x) { return this.tags[this.idx(x)]; }
  // ближайший контакт круга с рельефом: глубина, нормаль, тег
  collide(cx, cy, r, out) {
    const xs = this.xs, ys = this.ys;
    let i = this.idx(cx - r - 0.1);
    out.pen = 0; out.nx = 0; out.ny = 1; out.tag = 'road';
    const n = xs.length - 1;
    for (; i < n && xs[i] <= cx + r + 0.1; i++) {
      const ax = xs[i], ay = ys[i], bx = xs[i + 1], by = ys[i + 1];
      const ex = bx - ax, ey = by - ay;
      const l2 = ex * ex + ey * ey;
      let t = l2 > 0 ? ((cx - ax) * ex + (cy - ay) * ey) / l2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = ax + ex * t, qy = ay + ey * t;
      let dx = cx - qx, dy = cy - qy;
      const d = Math.sqrt(dx * dx + dy * dy);
      // точка под поверхностью (провалилась) — выталкиваем вверх по нормали отрезка
      const below = (ex * (cy - ay) - ey * (cx - ax)) < 0 && t > 0 && t < 1;
      let pen, nx, ny;
      if (below && d < 0.45) { const ln = Math.sqrt(l2); nx = -ey / ln; ny = ex / ln; pen = r + d; }
      else { if (d >= r || d < 1e-9) continue; nx = dx / d; ny = dy / d; pen = r - d; }
      if (pen > out.pen) { out.pen = pen; out.nx = nx; out.ny = ny; out.tag = this.tags[i]; }
    }
    return out.pen > 0;
  }
}

// ---------------- Мотоцикл ----------------
class Bike {
  constructor(def, cfg, terrain, mu) {
    this.def = def; this.terrain = terrain; this.mu = mu;
    const up = cfg.upg, ex = EXHAUSTS.find(e => e.id === cfg.exhaust) || EXHAUSTS[0];
    this.exhaust = ex;
    this.torque = def.torque * (1 + 0.07 * up.engine + ex.power);
    this.brakeF = def.brakeF * (1 + 0.12 * up.brakes);
    this.brakeR = def.brakeR * (1 + 0.12 * up.brakes);
    this.grip = def.grip * (1 + 0.05 * up.tires);
    const suspK = 1 + 0.04 * up.susp;
    const wm = Math.max(5, def.mass * 0.055);
    this.mc = def.mass - 2 * wm + RIDER_MASS;
    this.mtot = def.mass + RIDER_MASS;
    this.Ic = this.mc * def.gyr * def.gyr;
    this.Ie = def.electric ? 0.006 : 0.003 + def.torque * 0.00015;
    const [cx, cy] = def.com;
    this.com = def.com;
    const L = (px, py) => [px - cx, py - cy];
    this.L = L;
    const rake = def.rake * Math.PI / 180;
    // подвески как ползуны: якорь на раме, ось хода, диапазон
    const mk = (sag, axis, len, travel, load, r, I, m) => {
      const al = Math.hypot(axis[0], axis[1]); const u = [axis[0] / al, axis[1] / al];
      const anchor = [sag[0] - u[0] * len, sag[1] - u[1] * len];
      travel *= suspK;
      const k = 3.3 * load / travel;
      const meff = load / G;
      const cb = 2 * (0.42 + 0.04 * up.susp) * Math.sqrt(k * meff);
      return { anchor: L(anchor[0], anchor[1]), u, sTop: len - 0.7 * travel, sBot: len + 0.3 * travel, sFree: len + load / k, k, cb, cr: cb * 1.55, travel,
        r, m, I, x: 0, y: 0, vx: 0, vy: 0, w: 0, rot: 0, s: len, contact: false, air: 0, N: 0, slip: 0, tag: 'road', sagLocal: L(sag[0], sag[1]) };
    };
    const loadF = this.mc * G * cx / def.wb, loadR = this.mc * G * (def.wb - cx) / def.wb;
    this.wr = mk([0, 0], [-0.12, -1], 0.32, def.travelR, loadR, def.rr, wm, wm * def.rr * def.rr * 0.72);
    this.wf = mk([def.wb, def.rf - def.rr], [Math.sin(rake), -Math.cos(rake)], def.forkLen, def.travelF, loadF, def.rf, wm, wm * def.rf * def.rf * 0.7);
    this.wr.I = wm * def.rr * def.rr * 0.72; this.wf.I = wm * def.rf * def.rf * 0.7;
    this.wr.m = wm; this.wf.m = wm;
    // контактные точки корпуса (локально)
    const wb = def.wb;
    this.body = [
      { id: 'tail', p: L(def.style === 'chopper' ? -0.15 : -0.22, def.style === 'chopper' ? 0.42 : 0.5), r: 0.07 },
      { id: 'belly', p: L(wb * 0.45, -0.02), r: 0.08 },
      { id: 'nose', p: L(wb + 0.05, def.rf - def.rr + 0.5), r: 0.08 },
      { id: 'pivot', p: L(wb * 0.38, 0.12), r: 0.08 }
    ];
    if (def.scrapeBar) this.body.push({ id: 'bar', p: L(-0.15, 0.0), r: 0.05 });
    this.balance = Math.atan2(cx, cy + def.rr);
    this.reset(terrain.startX + 2);
  }
  reset(x) {
    const t = this.terrain, d = this.def;
    const hr = t.heightAt(x), hf = t.heightAt(x + d.wb);
    const ang = Math.atan2(hf + d.rf - (hr + d.rr) - (d.rf - d.rr), d.wb);
    this.a = ang; this.w = 0;
    const c = Math.cos(ang), s = Math.sin(ang);
    const [cx, cy] = this.com;
    this.x = x + c * cx - s * cy; this.y = hr + d.rr + s * cx + c * cy + 0.03;
    this.vx = 0; this.vy = 0;
    for (const wh of [this.wr, this.wf]) {
      const [lx, ly] = wh.sagLocal;
      wh.x = this.x + c * lx - s * ly; wh.y = this.y + s * lx + c * ly;
      wh.vx = 0; wh.vy = 0; wh.w = 0; wh.contact = true; wh.air = 0;
    }
    this.we = d.electric ? 0 : d.idle * Math.PI / 30;
    this.gear = 0; this.shiftT = 0;
    this.throttle = 0; this.brake = 0; this.lean = 0; this.clutch = 0;
    this.touch = {}; this.scrape = 0; this.crashed = false;
    this.rpm = d.idle; this.slipAmt = 0; this.limiter = 0;
  }
  get speed() { return Math.hypot(this.vx, this.vy); }
  get G() { return this.def.gears[this.gear]; }
  shift(dir) {
    const n = this.gear + dir;
    if (n < 0 || n >= this.def.gears.length) return false;
    this.gear = n; this.shiftT = 0.1;
    if (this.clutch < 0.5) this.we = Math.max(this.def.idle * Math.PI / 30, -this.wr.w * this.def.gears[n]);
    return true;
  }
  local(px, py) { // локальная точка → мир
    const c = Math.cos(this.a), s = Math.sin(this.a);
    return [this.x + c * px - s * py, this.y + s * px + c * py];
  }
  engineTorque(rpm, thr) {
    const d = this.def;
    if (d.electric) {
      const base = d.peak;
      const t = this.torque * (rpm < base ? 1 : base / rpm) * thr;
      return rpm > d.redline ? 0 : t - (1 - thr) * this.torque * 0.06 * Math.min(1, rpm / 2000);
    }
    const x = rpm / d.peak;
    let f = x < 1 ? 1 - d.curve * (1 - x) * (1 - x) : 1 - 0.9 * (x - 1) * (x - 1);
    f = Math.max(0.25, f);
    let te = thr * this.torque * f - (1 - thr) * this.torque * (0.05 + 0.12 * rpm / d.redline);
    if (rpm > d.redline) { te = -this.torque * 0.15; this.limiter = 0.08; }
    if (rpm < d.idle) te = Math.max(te, this.torque * 0.8 * (1 - rpm / d.idle));
    return te;
  }
  step(dt, inp, auto) {
    const subs = 14, h = dt / subs, d = this.def;
    // плавные органы управления
    const ramp = (cur, tgt, up, dn) => cur < tgt ? Math.min(tgt, cur + up * dt) : Math.max(tgt, cur - dn * dt);
    this.throttle = ramp(this.throttle, inp.gas, 5, 8);
    this.brake = ramp(this.brake, inp.brake, 6, 10);
    this.lean = ramp(this.lean, inp.lean, 4.5, 4.5);
    this.clutch = ramp(this.clutch, inp.clutch, 12, 6);
    if (this.crashed) { this.throttle = 0; this.lean = 0; this.brake = 0.3; this.clutch = 1; }
    this.shiftT = Math.max(0, this.shiftT - dt);
    this.limiter = Math.max(0, this.limiter - dt);
    // автоматическая коробка
    if (auto && !d.electric && this.shiftT <= 0) {
      const wheelRpm = -this.wr.w * 30 / Math.PI;
      const rpmIn = (g) => wheelRpm * d.gears[g];
      const synced = this.clutch < 0.1 && Math.abs(this.rpm - rpmIn(this.gear)) < d.redline * 0.25;
      if (synced && this.gear < d.gears.length - 1 && this.rpm > d.redline * 0.997 && rpmIn(this.gear + 1) > d.idle * 1.4 && this.throttle > 0.1) this.shift(1);
      else if (this.clutch < 0.1 && this.gear > 0 && rpmIn(this.gear - 1) < d.redline * 0.7 && rpmIn(this.gear) < Math.max(d.idle * 1.8, d.peak * 0.45)) this.shift(-1);
    }
    this.scrape = 0; this.touch = {};
    let slipSum = 0;
    for (let k = 0; k < subs; k++) slipSum += this.sub(h);
    this.slipAmt = slipSum / subs;
    this.wr.rot += this.wr.w * dt; this.wf.rot += this.wf.w * dt;
    this.rpm = this.we * 30 / Math.PI;
    this.wr.air = this.wr.contact ? 0 : this.wr.air + dt;
    this.wf.air = this.wf.contact ? 0 : this.wf.air + dt;
  }
  sub(h) {
    const d = this.def, ter = this.terrain;
    const c = Math.cos(this.a), s = Math.sin(this.a);
    let Fx = 0, Fy = -this.mc * G, T = 0;
    const inAir = !this.wr.contact && !this.wf.contact;
    // райдер: перенос веса и активный наклон корпусом
    const lean = this.lean;
    const dlx = lean * 0.17, dly = -Math.abs(lean) * 0.05;
    const dwx = c * dlx - s * dly;
    T += -RIDER_MASS * G * dwx;
    T += -lean * d.lean * this.mtot * (inAir ? 2.3 : 0.95);
    // руки и корпус райдера гасят раскачку в вилли
    if (this.wr.contact && !this.wf.contact) T -= 1.1 * this.mtot * this.w;
    // воздух
    const sp = Math.hypot(this.vx, this.vy);
    const drag = 0.5 * 1.2 * (0.42 + 0.0012 * d.mass) * sp;
    Fx -= drag * this.vx; Fy -= drag * this.vy;
    // подвеска
    const cont = this._c || (this._c = {});
    for (const wh of [this.wr, this.wf]) {
      const ax = this.x + c * wh.anchor[0] - s * wh.anchor[1];
      const ay = this.y + s * wh.anchor[0] + c * wh.anchor[1];
      const ux = c * wh.u[0] - s * wh.u[1], uy = s * wh.u[0] + c * wh.u[1];
      const dx = wh.x - ax, dy = wh.y - ay;
      const sv = dx * ux + dy * uy;
      const px = dx - sv * ux, py = dy - sv * uy;
      const rax = ax - this.x, ray = ay - this.y;
      const avx = this.vx - this.w * ray, avy = this.vy + this.w * rax;
      const rvx = wh.vx - avx, rvy = wh.vy - avy;
      const sd = rvx * ux + rvy * uy;
      let f = Math.max(0, wh.k * (wh.sFree - sv)) - sd * (sd < 0 ? wh.cb : wh.cr);
      if (sv < wh.sTop) f += wh.k * 25 * (wh.sTop - sv) - sd * wh.cb * 2;
      if (sv > wh.sBot) f -= wh.k * 25 * (sv - wh.sBot) + sd * wh.cb * 2;
      wh.s = sv;
      const kp = 1.6e5 * wh.m / 8, cp = 2 * Math.sqrt(kp * wh.m) * 0.9;
      const pvx = rvx - sd * ux, pvy = rvy - sd * uy;
      const fx = f * ux - kp * px - cp * pvx;
      const fy = f * uy - kp * py - cp * pvy;
      wh.fx = fx; wh.fy = fy - wh.m * G;
      Fx -= fx; Fy -= fy;
      T -= rax * fy - ray * fx;
    }
    // корпус о землю
    for (const b of this.body) {
      const px = this.x + c * b.p[0] - s * b.p[1], py = this.y + s * b.p[0] + c * b.p[1];
      if (!ter.collide(px, py, b.r, cont)) continue;
      this.touch[b.id] = true;
      const rx = px - this.x, ry = py - this.y;
      const vx = this.vx - this.w * ry, vy = this.vy + this.w * rx;
      const vn = vx * cont.nx + vy * cont.ny;
      const N = Math.max(0, 9e4 * cont.pen - 4000 * vn);
      const tx = cont.ny, ty = -cont.nx;
      const vt = vx * tx + vy * ty;
      const fr = -Math.sign(vt) * Math.min(Math.abs(vt) * 3000, 0.45 * N);
      const fx = N * cont.nx + fr * tx, fy = N * cont.ny + fr * ty;
      Fx += fx; Fy += fy; T += rx * fy - ry * fx;
      if (Math.abs(vt) > 1.5) this.scrape = Math.max(this.scrape, Math.min(1, Math.abs(vt) / 12));
    }
    // голова райдера
    const hp = this.headLocal();
    const hx = this.x + c * hp[0] - s * hp[1], hy = this.y + s * hp[0] + c * hp[1];
    if (ter.collide(hx, hy, 0.13, cont)) this.touch.head = true;
    // интеграция скоростей
    this.vx += Fx / this.mc * h; this.vy += Fy / this.mc * h; this.w += T / this.Ic * h;
    for (const wh of [this.wr, this.wf]) { wh.vx += wh.fx / wh.m * h; wh.vy += wh.fy / wh.m * h; }
    // контакт колёс: нормальная сила
    for (const wh of [this.wr, this.wf]) {
      wh.contact = ter.collide(wh.x, wh.y, wh.r, cont);
      wh.N = 0;
      if (!wh.contact) continue;
      wh.tag = cont.tag;
      wh.nx = cont.nx; wh.ny = cont.ny;
      const vn = wh.vx * cont.nx + wh.vy * cont.ny;
      const N = Math.max(0, 1.6e5 * cont.pen * (1 + cont.pen * 12) - 1400 * vn);
      wh.N = N;
      wh.vx += N * cont.nx / wh.m * h; wh.vy += N * cont.ny / wh.m * h;
    }
    // трансмиссия: двигатель ↔ сцепление ↔ заднее колесо
    const wr = this.wr, wf = this.wf;
    const Gr = this.G;
    const rpm = this.we * 30 / Math.PI;
    const thr = this.shiftT > 0.04 ? 0 : this.throttle;
    const te = this.engineTorque(rpm, thr);
    this.we = Math.max(0, this.we + te / this.Ie * h);
    let engage = 1;
    if (!d.electric) {
      const cen = Math.min(1, Math.max(0, (rpm - d.idle * 1.05) / (d.idle * 0.9)));
      const rolling = -wr.w * 30 / Math.PI * Gr > d.idle * 1.25 ? 1 : cen;
      engage = (1 - this.clutch) * rolling;
    }
    const cap = engage * this.torque * 2.4 * h;
    const slipE = this.we + wr.w * Gr;
    const invI = 1 / this.Ie + Gr * Gr / wr.I;
    let Je = -slipE / invI;
    Je = Math.max(-cap, Math.min(cap, Je));
    this.we = Math.max(0, this.we + Je / this.Ie);
    wr.w += Je * Gr / wr.I;
    this.w -= Je * Gr / this.Ic;
    // тормоза: связь колесо ↔ рама
    const brk = this.brake;
    for (const [wh, tb] of [[wr, this.brakeR * brk], [wf, this.brakeF * brk * (wr.contact || wf.contact ? 1 : 0.6)]]) {
      if (tb <= 0) continue;
      const rel = wh.w - this.w;
      let J = -rel / (1 / wh.I + 1 / this.Ic);
      const lim = tb * h; J = Math.max(-lim, Math.min(lim, J));
      wh.w += J / wh.I; this.w -= J / this.Ic;
    }
    // трение шин
    let slipOut = 0;
    for (const wh of [wr, wf]) {
      if (!wh.contact || wh.N <= 0) continue;
      const nx = wh.nx, ny = wh.ny, tx = ny, ty = -nx;
      const vcx = wh.vx + wh.w * ny * wh.r, vcy = wh.vy - wh.w * nx * wh.r;
      const vt = vcx * tx + vcy * ty;
      const meff = 1 / (1 / wh.m + wh.r * wh.r / wh.I);
      const surfMu = wh.tag === 'ramp' || wh.tag === 'box' ? 1.0 : this.mu;
      const lim = surfMu * this.grip * wh.N * h;
      let J = -vt * meff;
      if (Math.abs(J) > lim) { J = Math.sign(J) * lim * 0.92; if (wh === wr) slipOut = Math.min(1, Math.abs(vt) / 8); }
      wh.vx += J * tx / wh.m; wh.vy += J * ty / wh.m;
      wh.w += wh.r * J / wh.I;
      // сопротивление качению
      wh.w *= 1 - 0.02 * h;
    }
    if (inAir) this.w *= 1 - 0.15 * h;
    // интеграция положений
    this.x += this.vx * h; this.y += this.vy * h; this.a += this.w * h;
    for (const wh of [wr, wf]) { wh.x += wh.vx * h; wh.y += wh.vy * h; }
    return slipOut;
  }
  headLocal() {
    const d = this.def, [cx, cy] = this.com;
    const seat = this.seatPos();
    const ang = 1.25 - this.lean * 0.45 - (d.style === 'chopper' ? -0.3 : d.style === 'sport' || d.style === 'super' ? 0.35 : 0);
    return [seat[0] + Math.cos(ang) * 0.78 - cx, seat[1] + Math.sin(ang) * 0.78 - cy];
  }
  seatPos() { const st = BIKE_GEOM[this.def.style]; return [this.def.wb * st.seat[0], st.seat[1]]; }
}

// базовые точки посадки райдера по стилям (доли колёсной базы / метры над осью)
const BIKE_GEOM = {
  pit:      { seat: [0.36, 0.52], peg: [0.43, 0.10], bar: [0.74, 0.74] },
  enduro:   { seat: [0.36, 0.66], peg: [0.42, 0.12], bar: [0.74, 0.88] },
  sm:       { seat: [0.36, 0.62], peg: [0.42, 0.10], bar: [0.74, 0.84] },
  sport:    { seat: [0.32, 0.58], peg: [0.30, 0.18], bar: [0.76, 0.66] },
  super:    { seat: [0.32, 0.58], peg: [0.30, 0.18], bar: [0.76, 0.66] },
  stunt:    { seat: [0.36, 0.60], peg: [0.35, 0.14], bar: [0.78, 0.80] },
  chopper:  { seat: [0.40, 0.40], peg: [0.58, 0.12], bar: [0.66, 0.98] },
  electric: { seat: [0.38, 0.62], peg: [0.42, 0.12], bar: [0.74, 0.80] }
};
