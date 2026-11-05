// Меню, выбор трассы, гараж, настройки, пауза, итоги, сенсорные кнопки
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const UI = {
  cur: 'menu', gIdx: 0, tab: 'bike',
  show(id) {
    $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
    this.cur = id;
    const playing = id === null && Game.state === 'play';
    $('#touch').classList.toggle('hidden', !playing);
    $('#pauseBtn').classList.toggle('hidden', !playing);
    $$('.coinv').forEach(e => e.textContent = SAVE.coins.toLocaleString('ru-RU'));
    if (id === 'tracks') this.buildTracks();
    if (id === 'garage') { this.gIdx = Math.max(0, BIKES.findIndex(b => b.id === SAVE.bike)); this.buildGarage(); this.startPreview(); }
    if (id === 'settings') this.syncSettings();
    if (id === 'credits') this.buildCredits();
    if (id === 'menu' || id === 'tracks' || id === 'garage') { if (Game.state !== 'menu') Game.quit(); Sound.music('menu'); }
  },
  go(id) { Sound.init(); Sound.sfx.click(); this.show(id); },
  toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('on'), 1800); },
  pause() { if (Game.state !== 'play') return; Game.state = 'pause'; Sound.suspend(true); Sound.stopMusic(); this.show('pause'); },
  resume() { if (Game.state !== 'pause') return; Game.state = 'play'; Sound.suspend(false); Sound.resumeMusic(); last = performance.now(); this.show(null); },
  startRun(id) {
    Sound.init(); Sound.suspend(false);
    goFullscreen();
    this.lastTrack = id;
    Game.start(id);
    this.show(null);
  },
  results(r) {
    $('#rScore').textContent = r.score.toLocaleString('ru-RU');
    $('#rRec').classList.toggle('hidden', !r.rec);
    const st = [
      ['Монеты', '+' + r.coins], ['Время', fmtTime(r.time)], ['Макс. скорость', Math.round(r.maxKmh) + ' км/ч'], ['Лучшее вилли', r.bestW.toFixed(1) + ' с' + (r.wRec ? ' ★' : '')],
      ['Вилли, метров', Math.round(r.bestWD)], ['Сальто', r.flips], ['Падений', r.crashes], ['Рекорд трассы', Math.max(r.prev, r.score).toLocaleString('ru-RU')]
    ];
    $('#rStats').innerHTML = st.map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
    this.show('result');
  },

  // ---------- трассы ----------
  buildTracks() {
    const list = $('#trackList'); list.innerHTML = '';
    for (const t of TRACKS) {
      const el = document.createElement('button'); el.className = 'card';
      el.innerHTML = `<canvas width="320" height="180"></canvas><div class="ci"><b>${t.name}</b><p>${t.desc}</p><span class="best">Рекорд: ${(SAVE.best[t.id] || 0).toLocaleString('ru-RU')} · ${t.len} м</span></div>`;
      el.onclick = () => { Sound.sfx.click(); this.startRun(t.id); };
      list.appendChild(el);
      const c = el.querySelector('canvas'), cx = c.getContext('2d');
      const ter = new Terrain(t);
      const camX = 150 + t.seed * 3, k = 18;
      drawBackground(cx, t.theme, camX, ter.heightAt(camX) + 2, 320, 180, k, 0);
      cx.setTransform(k, 0, 0, -k, 160 - camX * k, 90 + (ter.heightAt(camX) + 2) * k);
      drawTerrain(cx, ter, t.theme, camX - 10, camX + 10, ter.heightAt(camX) - 8);
    }
  },

  // ---------- гараж ----------
  buildGarage() {
    const b = BIKES[this.gIdx], st = SAVE.bikes[b.id];
    $('#gName').textContent = b.name; $('#gCls').textContent = b.cls + (st.owned ? '' : ' · ' + b.price.toLocaleString('ru-RU') + ' 🪙');
    $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === this.tab));
    const P = $('#gPanel');
    const lockNote = st.owned ? '' : `<p class="note">Этот мотоцикл ещё не куплен — сначала купи его на вкладке МОТО.</p>`;
    if (this.tab === 'bike') {
      const hp = bikeHP(b, st), mt = b.mass + RIDER_MASS;
      const wheelie = (b.torque * b.gears[0] / b.rr) / (mt * G) / (b.com[0] / (b.com[1] + b.rr));
      const ts = Math.round(topSpeed(b) * 3.6);
      const bal = Math.round(Math.atan2(b.com[0], b.com[1] + b.rr) * 180 / Math.PI);
      const bar = (name, v, max, txt) => `<div class="stat"><span>${name}</span><div class="sb"><i style="width:${Math.min(100, v / max * 100)}%"></i></div><em>${txt}</em></div>`;
      P.innerHTML = `<p class="desc">${b.desc}</p>` +
        bar('Мощность', hp, 200, hp + ' л.с.') + bar('Момент', b.torque, 120, b.torque + ' Н·м') + bar('Лёгкость', 400 - b.mass, 350, b.mass + ' кг') +
        bar('Скорость', ts, 320, ts + ' км/ч') + bar('Вилли', wheelie, 2, wheelie > 1.35 ? 'легко' : wheelie > 1 ? 'норм' : 'сложно') +
        bar('Тормоза', b.brakeF, 2200, Math.round(b.brakeF / 22) + '%') + bar('Подвеска', b.travelF, 0.32, Math.round(b.travelF * 1000) + ' мм') +
        `<div class="stat"><span>Точка баланса</span><div></div><em>${bal}°</em></div>` +
        `<div class="gact">${st.owned ? (SAVE.bike === b.id ? '<span class="owned">✔ В ДЕЛЕ</span>' : '<button class="btn big small" id="selBtn">ВЫБРАТЬ</button>') : `<button class="btn big small" id="buyBtn" ${SAVE.coins < b.price ? 'disabled' : ''}>КУПИТЬ · ${b.price.toLocaleString('ru-RU')} 🪙</button>`}</div>`;
      const sel = $('#selBtn'); if (sel) sel.onclick = () => { SAVE.bike = b.id; saveGame(); Sound.sfx.click(); this.buildGarage(); };
      const buy = $('#buyBtn'); if (buy) buy.onclick = () => {
        if (SAVE.coins < b.price) return;
        SAVE.coins -= b.price; st.owned = true; SAVE.bike = b.id; saveGame(); Sound.sfx.buy(); this.toast(b.name + ' теперь твой!'); this.show('garage');
      };
    } else if (this.tab === 'tune') {
      P.innerHTML = lockNote + UPGRADES.map(u => {
        const lvl = st.upg[u.id], cost = upgradeCost(b, lvl);
        const pips = Array.from({ length: UPG_MAX }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
        const btn = lvl >= UPG_MAX ? '<span class="owned">МАКС</span>' : `<button class="btn small" data-upg="${u.id}" ${!st.owned || SAVE.coins < cost ? 'disabled' : ''}>${cost.toLocaleString('ru-RU')} 🪙</button>`;
        return `<div class="upg"><b>${u.name}</b>${btn}<div class="pips">${pips}</div><small>${u.hint}</small></div>`;
      }).join('');
      P.querySelectorAll('[data-upg]').forEach(el => el.onclick = () => {
        const id = el.dataset.upg, lvl = st.upg[id], cost = upgradeCost(b, lvl);
        if (SAVE.coins < cost || lvl >= UPG_MAX) return;
        SAVE.coins -= cost; st.upg[id]++; saveGame(); Sound.sfx.buy(); this.show('garage');
      });
    } else if (this.tab === 'paint') {
      const sw = (key, list) => `<div class="sw">${list.map(c => `<button class="c ${st[key] === c ? 'on' : ''}" style="background:${c}" data-k="${key}" data-v="${c}" aria-label="${c}"></button>`).join('')}<input type="color" data-k="${key}" value="${st[key]}" aria-label="Свой цвет"></div>`;
      P.innerHTML = lockNote +
        `<div class="opt"><h4>Краска</h4>${sw('paint', PALETTE)}<h4>Второй цвет</h4>${sw('paint2', PALETTE)}<h4>Диски</h4>${sw('rim', PALETTE)}` +
        `<h4>Наклейки</h4><div class="sw">${DECALS.map(d => `<button class="o ${st.decal === d.id ? 'on' : ''}" data-k="decal" data-v="${d.id}">${d.name}</button>`).join('')}</div>` +
        (b.electric ? '' : `<h4>Выхлоп</h4><div class="sw">${EXHAUSTS.map(e => { const own = st.exhOwned.includes(e.id); return `<button class="o ${st.exhaust === e.id ? 'on' : ''}" data-ex="${e.id}">${e.name}${e.power ? ' +' + Math.round(e.power * 100) + '%' : ''}${own ? '' : ' · ' + e.price + ' 🪙'}</button>`; }).join('')}</div>`) + '</div>';
      this.bindSwatches(P, st, !st.owned);
      P.querySelectorAll('[data-ex]').forEach(el => el.onclick = () => {
        if (!st.owned) return;
        const e = EXHAUSTS.find(x => x.id === el.dataset.ex);
        if (!st.exhOwned.includes(e.id)) {
          if (SAVE.coins < e.price) { this.toast('Не хватает монет'); return; }
          SAVE.coins -= e.price; st.exhOwned.push(e.id); Sound.sfx.buy();
        } else Sound.sfx.click();
        st.exhaust = e.id; saveGame(); this.show('garage');
      });
    } else {
      const R = SAVE.rider;
      const sw = (key, list) => `<div class="sw">${list.map(c => `<button class="c ${R[key] === c ? 'on' : ''}" style="background:${c}" data-k="${key}" data-v="${c}" aria-label="${c}"></button>`).join('')}<input type="color" data-k="${key}" value="${R[key]}" aria-label="Свой цвет"></div>`;
      P.innerHTML = `<div class="opt"><h4>Шлем</h4>${sw('helmet', PALETTE)}<h4>Рисунок шлема</h4><div class="sw">${HELMETS.map(h => `<button class="o ${R.hstyle === h.id ? 'on' : ''}" data-k="hstyle" data-v="${h.id}">${h.name}</button>`).join('')}</div>` +
        `<h4>Второй цвет шлема</h4>${sw('helmet2', PALETTE)}<h4>Визор</h4>${sw('visor', VISORS)}<h4>Куртка</h4>${sw('jacket', PALETTE)}<h4>Штаны</h4>${sw('pants', PALETTE)}</div>`;
      this.bindSwatches(P, R, false);
    }
  },
  bindSwatches(P, obj, locked) {
    P.querySelectorAll('button[data-k]').forEach(el => el.onclick = () => { if (locked) { this.toast('Сначала купи этот мотоцикл'); return; } obj[el.dataset.k] = el.dataset.v; saveGame(); Sound.sfx.click(); this.buildGarage(); });
    P.querySelectorAll('input[type=color]').forEach(el => el.oninput = () => { if (locked) return; obj[el.dataset.k] = el.value; saveGame(); });
    P.querySelectorAll('input[type=color]').forEach(el => el.onchange = () => { if (!locked) this.buildGarage(); });
  },
  startPreview() {
    if (this._pv) return;
    const c = $('#preview'), cx = c.getContext('2d');
    let t0 = performance.now(), t = 0;
    const loop = (now) => {
      if (this.cur !== 'garage') { this._pv = 0; return; }
      t += Math.min(0.05, (now - t0) / 1000); t0 = now;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth * dpr, h = c.clientHeight * dpr;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const b = BIKES[this.gIdx], st = SAVE.bikes[b.id];
      cx.setTransform(1, 0, 0, 1, 0, 0);
      const g = cx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a1d44'); g.addColorStop(0.62, '#4a2f5e'); g.addColorStop(0.63, '#2a2230'); g.addColorStop(1, '#151018');
      cx.fillStyle = g; cx.fillRect(0, 0, w, h);
      const sg = cx.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h * 0.5, w * 0.6); sg.addColorStop(0, 'rgba(255,220,160,0.25)'); sg.addColorStop(1, 'rgba(255,220,160,0)');
      cx.fillStyle = sg; cx.fillRect(0, 0, w, h);
      const k = Math.min(w / (b.wb + 1.3), h / 2.3);
      const ground = h * 0.63 + h * 0.08;
      cx.setTransform(k, 0, 0, -k, w / 2 - (b.wb / 2) * k, ground);
      cx.beginPath(); cx.ellipse(b.wb / 2, 0, b.wb * 0.75, 0.08, 0, 0, Math.PI * 2); cx.fillStyle = 'rgba(0,0,0,0.45)'; cx.fill();
      const [comx, comy] = b.com;
      const rot = -t * 2.5;
      const pose = { def: b, a: 0, x: comx, y: b.rr + comy, lean: 0, wr: { x: 0, y: b.rr, rot, w: 0 }, wf: { x: b.wb, y: b.rf, rot: rot * b.rr / b.rf, w: 0 } };
      drawBike(cx, pose, Object.assign({ num: this.gIdx + 7 }, st), SAVE.rider, 0);
      this._pv = requestAnimationFrame(loop);
    };
    this._pv = requestAnimationFrame(loop);
  },

  // ---------- настройки ----------
  syncSettings() {
    const s = SAVE.settings;
    $('#sMusic').value = s.music; $('#sSfx').value = s.sfx;
    $$('[data-man]').forEach(b => b.classList.toggle('on', (b.dataset.man === '1') === s.manual));
    $$('[data-hint]').forEach(b => b.classList.toggle('on', (b.dataset.hint === '1') === s.hints));
    document.body.classList.toggle('manual', s.manual);
  },
  buildCredits() {
    $('#creditList').innerHTML = '<p>Вся музыка — с Pixabay по лицензии <a href="https://pixabay.com/service/license-summary/" target="_blank" rel="noopener">Pixabay Content License</a> (бесплатно, без обязательной атрибуции — но авторов мы всё равно указываем с благодарностью).</p>' +
      CREDITS.map(([where, title, author, url]) => `<p><b>${where}:</b> «${title}» — ${author}<br><a href="${url}" target="_blank" rel="noopener">${url}</a></p>`).join('') +
      '<p>Мотоциклы, трассы, звук мотора и графика — оригинальные, нарисованы кодом. Любые совпадения названий с реальными марками случайны.</p>';
  }
};

function goFullscreen() {
  const el = document.documentElement;
  if (!document.body.classList.contains('touch')) return;
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null;
  if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {});
}

// ---------- привязка событий ----------
$$('[data-go]').forEach(el => el.addEventListener('click', () => UI.go(el.dataset.go)));
$('#fsBtn').onclick = () => {
  const el = document.documentElement;
  if (document.fullscreenElement) { document.exitFullscreen(); return; }
  const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null;
  if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => UI.toast('Браузер не разрешил полный экран — добавь игру на главный экран'));
  else if (!p) UI.toast('На iPhone: Поделиться → «На экран Домой»');
};
$('#gPrev').onclick = () => { UI.gIdx = (UI.gIdx + BIKES.length - 1) % BIKES.length; Sound.sfx.click(); UI.buildGarage(); };
$('#gNext').onclick = () => { UI.gIdx = (UI.gIdx + 1) % BIKES.length; Sound.sfx.click(); UI.buildGarage(); };
$$('.tab').forEach(t => t.onclick = () => { UI.tab = t.dataset.tab; Sound.sfx.click(); UI.buildGarage(); });
$('#pauseBtn').onclick = () => UI.pause();
$('#resumeBtn').onclick = () => UI.resume();
$('#restartBtn').onclick = () => { Sound.suspend(false); Game.restart(); };
$('#quitBtn').onclick = () => { Sound.suspend(false); UI.show('menu'); };
$('#againBtn').onclick = () => UI.startRun(UI.lastTrack || TRACKS[0].id);
$('#sMusic').oninput = e => { SAVE.settings.music = +e.target.value; Sound.setVolumes(SAVE.settings.music, SAVE.settings.sfx); saveGame(); };
$('#sSfx').oninput = e => { SAVE.settings.sfx = +e.target.value; Sound.setVolumes(SAVE.settings.music, SAVE.settings.sfx); saveGame(); };
$$('[data-man]').forEach(b => b.onclick = () => { SAVE.settings.manual = b.dataset.man === '1'; saveGame(); UI.syncSettings(); });
$$('[data-hint]').forEach(b => b.onclick = () => { SAVE.settings.hints = b.dataset.hint === '1'; saveGame(); UI.syncSettings(); });
$('#resetBtn').onclick = () => { if (confirm('Стереть монеты, мотоциклы и рекорды?')) { SAVE = defaultSave(); saveGame(); UI.toast('Прогресс сброшен'); UI.show('menu'); } };

// сенсорные кнопки
$$('.tbtn[data-k]').forEach(btn => {
  const k = btn.dataset.k;
  const on = e => { e.preventDefault(); Sound.init(); Input.touch[k] = 1; btn.classList.add('on'); try { btn.setPointerCapture(e.pointerId); } catch (err) {} };
  const off = e => { Input.touch[k] = 0; btn.classList.remove('on'); };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off); btn.addEventListener('pointercancel', off); btn.addEventListener('lostpointercapture', off);
  btn.addEventListener('contextmenu', e => e.preventDefault());
});
$$('.tbtn[data-shift]').forEach(btn => btn.addEventListener('pointerdown', e => { e.preventDefault(); Game.manualShift(+btn.dataset.shift); }));
const markTouch = () => document.body.classList.add('touch');
if (window.matchMedia && matchMedia('(pointer: coarse)').matches) markTouch();
window.addEventListener('touchstart', markTouch, { once: true, passive: true });
document.addEventListener('gesturestart', e => e.preventDefault());

// первый клик разблокирует звук и музыку меню
const unlock = () => { Sound.init(); Sound.setVolumes(SAVE.settings.music, SAVE.settings.sfx); if (UI.cur === 'menu') Sound.music('menu'); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);

Sound.setVolumes(SAVE.settings.music, SAVE.settings.sfx);
UI.syncSettings();
UI.show('menu');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
