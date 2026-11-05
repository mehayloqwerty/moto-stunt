// Рисование: мотоциклы (векторно), райдер, фон с параллаксом, рельеф, декорации
'use strict';

const COL = { D: '#1c1e24', K: '#0b0c0f', M: '#7d848e', C: '#d9dde3', E: '#3a3e46', S: '#16171b', G: 'rgba(170,215,255,0.55)', L: '#fff6c8' };

// Формы корпуса: [роль, точки] в метрах от оси заднего колеса (y вверх), x масштабируется по колёсной базе
const SHAPES = {
  sport: { ref: 1.39, parts: [
    ['P', [[-0.22, 0.62], [0.05, 0.67], [0.40, 0.60], [0.44, 0.49], [0.15, 0.45], [-0.14, 0.53]]],
    ['E', [[0.42, 0.10], [0.80, 0.08], [0.90, 0.25], [0.86, 0.46], [0.50, 0.46], [0.40, 0.28]]],
    ['M', [[0.50, 0.30], [0.60, 0.52], [1.05, 0.68], [1.11, 0.60], [0.68, 0.38], [0.56, 0.17]]],
    ['S', [[0.12, 0.62], [0.42, 0.60], [0.52, 0.57], [0.46, 0.54], [0.15, 0.56]]],
    ['P', [[0.48, 0.56], [0.62, 0.67], [0.86, 0.71], [0.98, 0.63], [0.92, 0.48], [0.55, 0.48]]],
    ['P', [[0.68, 0.12], [0.98, 0.09], [1.18, 0.34], [1.27, 0.60], [1.17, 0.80], [1.03, 0.71], [0.95, 0.51], [0.72, 0.38]]],
    ['P2', [[0.78, 0.26], [1.15, 0.40], [1.20, 0.48], [0.80, 0.35]]],
    ['D', [[0.96, 0.22], [1.10, 0.30], [1.06, 0.37], [0.92, 0.31]]],
    ['G', [[1.10, 0.79], [1.17, 0.81], [1.07, 0.93], [0.99, 0.85]]],
    ['L', [[1.22, 0.56], [1.28, 0.61], [1.25, 0.68], [1.19, 0.62]]]
  ], muffler: [0.10, 0.30, 0.35], fender: [[1.26, 0.25], [1.42, 0.30], [1.48, 0.26]] },
  super: { ref: 1.42, parts: [
    ['P', [[-0.24, 0.64], [0.05, 0.68], [0.40, 0.60], [0.44, 0.49], [0.15, 0.45], [-0.16, 0.54]]],
    ['E', [[0.42, 0.10], [0.80, 0.08], [0.90, 0.25], [0.86, 0.46], [0.50, 0.46], [0.40, 0.28]]],
    ['M', [[0.50, 0.30], [0.60, 0.52], [1.05, 0.68], [1.11, 0.60], [0.68, 0.38], [0.56, 0.17]]],
    ['S', [[0.12, 0.63], [0.42, 0.60], [0.52, 0.57], [0.46, 0.54], [0.15, 0.57]]],
    ['P', [[0.48, 0.56], [0.62, 0.68], [0.88, 0.72], [1.00, 0.63], [0.92, 0.48], [0.55, 0.48]]],
    ['P', [[0.64, 0.10], [1.00, 0.07], [1.20, 0.33], [1.30, 0.58], [1.20, 0.80], [1.03, 0.72], [0.95, 0.51], [0.70, 0.38]]],
    ['P2', [[0.66, 0.12], [1.0, 0.09], [1.06, 0.16], [0.70, 0.20]]],
    ['P2', [[1.12, 0.48], [1.30, 0.50], [1.32, 0.56], [1.14, 0.55]]],
    ['D', [[0.96, 0.22], [1.12, 0.30], [1.08, 0.37], [0.92, 0.31]]],
    ['G', [[1.12, 0.80], [1.20, 0.82], [1.08, 0.95], [0.99, 0.86]]],
    ['L', [[1.24, 0.55], [1.31, 0.60], [1.28, 0.67], [1.21, 0.61]]]
  ], muffler: [0.12, 0.28, 0.3], fender: [[1.28, 0.25], [1.44, 0.30], [1.50, 0.26]] },
  stunt: { ref: 1.38, parts: [
    ['P', [[-0.06, 0.65], [0.25, 0.67], [0.44, 0.59], [0.42, 0.51], [0.10, 0.53], [-0.09, 0.59]]],
    ['E', [[0.42, 0.10], [0.82, 0.06], [0.92, 0.24], [0.88, 0.48], [0.52, 0.48], [0.40, 0.26]]],
    ['D', [[0.92, 0.24], [1.02, 0.30], [1.00, 0.52], [0.92, 0.50]]],
    ['S', [[0.20, 0.64], [0.54, 0.63], [0.58, 0.59], [0.22, 0.58]]],
    ['P', [[0.52, 0.58], [0.66, 0.71], [0.93, 0.75], [1.03, 0.65], [0.96, 0.50], [0.58, 0.50]]],
    ['P2', [[0.60, 0.56], [0.95, 0.63], [0.97, 0.58], [0.62, 0.52]]],
    ['G', [[1.10, 0.74], [1.15, 0.76], [1.10, 0.86], [1.04, 0.82]]]
  ], muffler: [0.62, 0.02, 0.0], belly: true, light: [1.15, 0.66, 0.075], fender: [[1.2, 0.36], [1.38, 0.38], [1.42, 0.33]],
    cage: [[[0.96, 0.62], [1.05, 0.36], [0.94, 0.04], [0.62, 0.00]], [[0.04, 0.56], [-0.2, 0.36], [-0.18, 0.0], [0.08, 0.14]]] },
  dirt: { ref: 1.47, parts: [
    ['P2', [[-0.32, 0.50], [0.10, 0.63], [0.42, 0.67], [0.40, 0.58], [0.05, 0.53], [-0.30, 0.46]]],
    ['E', [[0.50, 0.10], [0.78, 0.08], [0.86, 0.22], [0.82, 0.48], [0.60, 0.48], [0.48, 0.28]]],
    ['S', [[0.08, 0.65], [0.84, 0.75], [0.86, 0.70], [0.10, 0.60]]],
    ['P', [[0.62, 0.67], [0.95, 0.79], [1.11, 0.75], [1.03, 0.52], [0.85, 0.46], [0.66, 0.53]]],
    ['P2', [[0.22, 0.57], [0.55, 0.63], [0.57, 0.47], [0.30, 0.43]]],
    ['P2', [[1.08, 0.81], [1.18, 0.87], [1.14, 0.62], [1.06, 0.60]]]
  ], muffler: [0.12, 0.47, 0.25], high: true, frame: [[[1.10, 0.70], [0.56, 0.42], [0.48, 0.18]], [[1.08, 0.66], [0.84, 0.08], [0.50, 0.08]]],
    fender: [[1.06, 0.60], [1.46, 0.56], [1.52, 0.51], [1.12, 0.55]] },
  chopper: { ref: 1.72, parts: [
    ['P', [[-0.42, 0.18], [-0.30, 0.38], [-0.05, 0.46], [0.24, 0.42], [0.30, 0.35], [0.0, 0.39], [-0.26, 0.31], [-0.36, 0.14]]],
    ['E', [[0.60, 0.08], [1.0, 0.08], [1.04, 0.30], [0.64, 0.34]]],
    ['C', [[0.88, 0.30], [1.03, 0.56], [0.93, 0.62], [0.80, 0.36]]],
    ['C', [[0.70, 0.34], [0.66, 0.62], [0.79, 0.64], [0.82, 0.34]]],
    ['S', [[0.40, 0.36], [0.75, 0.37], [0.82, 0.43], [0.62, 0.41], [0.46, 0.44], [0.36, 0.52], [0.30, 0.46]]],
    ['P', [[0.80, 0.63], [0.95, 0.72], [1.12, 0.74], [1.19, 0.67], [1.05, 0.58], [0.82, 0.57]]],
    ['P2', [[0.86, 0.64], [1.10, 0.70], [1.12, 0.67], [0.88, 0.61]]]
  ], muffler: [0.0, 0.12, 0.0], low: true, light: [1.27, 0.74, 0.09], frame: [[[1.17, 0.80], [1.02, 0.10], [0.35, 0.05], [0.28, 0.38], [0.0, 0.0]], [[1.17, 0.78], [0.80, 0.62], [0.32, 0.40]]] },
  electric: { ref: 1.30, parts: [
    ['P2', [[-0.16, 0.60], [0.20, 0.65], [0.22, 0.56], [-0.10, 0.54]]],
    ['S', [[0.15, 0.64], [0.56, 0.66], [0.60, 0.61], [0.18, 0.59]]],
    ['P', [[0.38, 0.12], [0.84, 0.10], [0.96, 0.40], [0.86, 0.62], [0.44, 0.60], [0.36, 0.35]]],
    ['D', [[0.44, 0.20], [0.80, 0.18], [0.86, 0.38], [0.78, 0.50], [0.48, 0.50]]],
    ['P2', [[0.46, 0.34], [0.84, 0.34], [0.84, 0.38], [0.46, 0.38]]],
    ['G', [[0.98, 0.72], [1.04, 0.74], [0.99, 0.84], [0.93, 0.80]]],
    ['L', [[1.02, 0.60], [1.07, 0.62], [1.06, 0.68], [1.0, 0.66]]]
  ], noExhaust: true, motor: [0.42, 0.16, 0.12], frame: [[[1.0, 0.66], [0.80, 0.58], [0.40, 0.56], [0.0, 0.62]]], fender: [[1.06, 0.48], [1.32, 0.44], [1.36, 0.39]] }
};
const STYLE_SHAPE = { sport: 'sport', super: 'super', stunt: 'stunt', sm: 'dirt', enduro: 'dirt', pit: 'dirt', chopper: 'chopper', electric: 'electric' };

function shade(hex, f) {
  let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

function mix(a, b, t) {
  const h = c => { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); };
  const A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function poly(ctx, pts, sx) { ctx.beginPath(); ctx.moveTo(pts[0][0] * sx, pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * sx, pts[i][1]); ctx.closePath(); }
function line(ctx, pts, sx, w, col) { ctx.beginPath(); ctx.moveTo(pts[0][0] * sx, pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * sx, pts[i][1]); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function seg(ctx, a, b, w, col) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); }
function circ(ctx, x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
function textW(ctx, s, x, y, size, col, align) { ctx.save(); ctx.translate(x, y); ctx.scale(1, -1); ctx.font = `bold ${size}px "Russo One", sans-serif`; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, 0, 0); ctx.restore(); }

function drawWheel(ctx, x, y, r, rot, w, cfg, def, front) {
  const spinFast = Math.abs(w) > 30;
  const offroad = def.style === 'enduro' || def.style === 'pit';
  // шина: резина с объёмом
  const tg = ctx.createRadialGradient(x - r * 0.25, y + r * 0.3, r * 0.2, x, y, r);
  tg.addColorStop(0, '#3a3b40'); tg.addColorStop(0.75, '#1b1c20'); tg.addColorStop(0.93, '#0c0c0e'); tg.addColorStop(1, '#050506');
  circ(ctx, x, y, r, tg);
  if (offroad && !spinFast) {
    ctx.fillStyle = '#141417';
    for (let i = 0; i < 22; i++) { const a = rot + i * Math.PI / 11; ctx.save(); ctx.translate(x + Math.cos(a) * r * 0.99, y + Math.sin(a) * r * 0.99); ctx.rotate(a); ctx.fillRect(-0.025, -0.03, 0.045, 0.06); ctx.restore(); }
  }
  // боковина: надписи-блики
  ctx.lineWidth = 0.012; ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 2; i++) { const a = rot + i * Math.PI; ctx.beginPath(); ctx.arc(x, y, r * 0.86, a, a + 0.7); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(x, y, r * 0.86, Math.PI * 0.55, Math.PI * 0.95); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = r * 0.12; ctx.stroke();
  const rimR = r * (offroad || def.style === 'chopper' ? 0.78 : 0.7);
  // обод: металлик
  const rg = ctx.createLinearGradient(x - rimR, y + rimR, x + rimR, y - rimR);
  rg.addColorStop(0, shade(cfg.rim, -0.35)); rg.addColorStop(0.45, shade(cfg.rim, 0.35)); rg.addColorStop(0.55, cfg.rim); rg.addColorStop(1, shade(cfg.rim, -0.45));
  ctx.beginPath(); ctx.arc(x, y, rimR, 0, Math.PI * 2); ctx.strokeStyle = rg; ctx.lineWidth = 0.035; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, rimR - 0.02, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.008; ctx.stroke();
  // тормозной диск с перфорацией
  const dr = rimR * (front ? 0.8 : 0.62);
  const dg = ctx.createRadialGradient(x + dr * 0.3, y + dr * 0.3, dr * 0.1, x, y, dr);
  dg.addColorStop(0, '#d7dce3'); dg.addColorStop(0.7, '#9aa1ab'); dg.addColorStop(1, '#6b717b');
  ctx.beginPath(); ctx.arc(x, y, dr, 0, Math.PI * 2); ctx.arc(x, y, dr * 0.62, 0, Math.PI * 2, true); ctx.fillStyle = dg; ctx.fill();
  if (!spinFast) { ctx.fillStyle = 'rgba(40,42,48,0.8)'; for (let i = 0; i < 12; i++) { const a = rot * 1 + i * Math.PI / 6; circ(ctx, x + Math.cos(a) * dr * 0.81, y + Math.sin(a) * dr * 0.81, 0.008, 'rgba(40,42,48,0.8)'); } }
  // спицы
  const spoked = offroad || def.style === 'chopper' || def.style === 'sm';
  const turns = spinFast ? 3 : 1;
  for (let m = 0; m < turns; m++) {
    const rr = rot - m * Math.sign(w) * 0.12;
    ctx.globalAlpha = spinFast ? 0.35 : 1;
    if (spoked) {
      ctx.strokeStyle = def.style === 'chopper' ? '#eef1f5' : '#c3c9d1'; ctx.lineWidth = 0.007;
      ctx.beginPath();
      for (let i = 0; i < 28; i++) { const a = rr + i * Math.PI / 14; const b = a + (i % 2 ? 0.45 : -0.45); ctx.moveTo(x + Math.cos(b) * 0.05, y + Math.sin(b) * 0.05); ctx.lineTo(x + Math.cos(a) * (rimR - 0.015), y + Math.sin(a) * (rimR - 0.015)); }
      ctx.stroke();
    } else {
      for (let i = 0; i < 5; i++) {
        const a = rr + i * Math.PI * 2 / 5;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a - 0.35) * 0.06, y + Math.sin(a - 0.35) * 0.06);
        ctx.quadraticCurveTo(x + Math.cos(a - 0.05) * rimR * 0.6, y + Math.sin(a - 0.05) * rimR * 0.6, x + Math.cos(a - 0.12) * rimR, y + Math.sin(a - 0.12) * rimR);
        ctx.lineTo(x + Math.cos(a + 0.12) * rimR, y + Math.sin(a + 0.12) * rimR);
        ctx.quadraticCurveTo(x + Math.cos(a + 0.05) * rimR * 0.6, y + Math.sin(a + 0.05) * rimR * 0.6, x + Math.cos(a + 0.35) * 0.06, y + Math.sin(a + 0.35) * 0.06);
        ctx.closePath(); ctx.fillStyle = rg; ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
  // ступица и суппорт
  const hg = ctx.createRadialGradient(x + 0.015, y + 0.015, 0.005, x, y, 0.06);
  hg.addColorStop(0, '#f0f2f5'); hg.addColorStop(1, '#4a4f58');
  circ(ctx, x, y, 0.06, hg); circ(ctx, x, y, 0.022, '#22252b');
  const ca = front ? 2.3 : 2.6;
  ctx.save(); ctx.translate(x + Math.cos(ca) * dr * 0.85, y + Math.sin(ca) * dr * 0.85); ctx.rotate(ca + Math.PI / 2);
  const cg = ctx.createLinearGradient(0, -0.04, 0, 0.04); cg.addColorStop(0, '#ffd36a'); cg.addColorStop(1, '#a8741a');
  ctx.fillStyle = def.style === 'chopper' ? '#c9ced6' : cg; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-0.07, -0.035, 0.14, 0.07, 0.02) : ctx.rect(-0.07, -0.035, 0.14, 0.07); ctx.fill();
  ctx.restore();
}

function ik(a, b, l1, l2, bendSign) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let d = Math.hypot(dx, dy); const dd = Math.min(d, l1 + l2 - 1e-4);
  const cosA = (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd);
  const ang = Math.atan2(dy, dx) + bendSign * Math.acos(Math.max(-1, Math.min(1, cosA)));
  return [a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1];
}

// конечность с сужением и светотенью (свет сверху)
function limb(ctx, a, b, w1, w2, col) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / L, ny = dx / L;
  ctx.beginPath();
  ctx.moveTo(a[0] + nx * w1 / 2, a[1] + ny * w1 / 2); ctx.lineTo(b[0] + nx * w2 / 2, b[1] + ny * w2 / 2);
  ctx.arc(b[0], b[1], w2 / 2, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
  ctx.lineTo(a[0] - nx * w1 / 2, a[1] - ny * w1 / 2);
  ctx.arc(a[0], a[1], w1 / 2, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true);
  ctx.closePath();
  const up = ny >= 0 ? 1 : -1;
  const g = ctx.createLinearGradient(a[0] + nx * w1 / 2 * up, a[1] + ny * w1 / 2 * up, a[0] - nx * w1 / 2 * up, a[1] - ny * w1 / 2 * up);
  g.addColorStop(0, shade(col, 0.28)); g.addColorStop(0.35, col); g.addColorStop(1, shade(col, -0.45));
  ctx.fillStyle = g; ctx.fill();
}

function drawHelmet(ctx, hx, hy, ang, rider) {
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang - Math.PI / 2 - 0.1);
  const r = 0.135;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r, 0, 0, Math.PI * 2); ctx.fillStyle = rider.helmet; ctx.fill();
  ctx.save(); ctx.clip();
  if (rider.hstyle === 'stripe') { ctx.fillStyle = rider.helmet2; ctx.fillRect(-r * 1.2, r * 0.15, r * 2.4, r * 0.22); }
  else if (rider.hstyle === 'split') { ctx.fillStyle = rider.helmet2; ctx.fillRect(-r * 1.2, -r * 1.2, r * 1.15, r * 2.4); }
  else if (rider.hstyle === 'star') {
    ctx.fillStyle = rider.helmet2; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, rr = i % 2 ? 0.025 : 0.06; ctx.lineTo(-0.02 + Math.cos(a) * rr, 0.01 + Math.sin(a) * rr); }
    ctx.fill();
  }
  // объём шлема: блик сверху, тень снизу
  const g = ctx.createRadialGradient(-r * 0.2, r * 0.45, r * 0.05, 0, 0, r * 1.15);
  g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.35, 'rgba(255,255,255,0.08)'); g.addColorStop(0.8, 'rgba(0,0,0,0.15)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = g; ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
  ctx.restore();
  // спойлер сзади
  ctx.beginPath(); ctx.moveTo(-r * 0.9, r * 0.25); ctx.lineTo(-r * 1.25, r * 0.15); ctx.lineTo(-r * 0.95, -r * 0.05); ctx.closePath(); ctx.fillStyle = shade(rider.helmet, -0.3); ctx.fill();
  // визор с отражением
  ctx.beginPath(); ctx.moveTo(r * 0.3, r * 0.32); ctx.quadraticCurveTo(r * 1.15, r * 0.25, r * 1.02, -r * 0.25); ctx.lineTo(r * 0.42, -r * 0.2); ctx.closePath();
  const vg = ctx.createLinearGradient(r * 0.3, r * 0.3, r * 1.0, -r * 0.25);
  vg.addColorStop(0, shade(rider.visor, 0.45)); vg.addColorStop(0.5, rider.visor); vg.addColorStop(1, shade(rider.visor, -0.5));
  ctx.fillStyle = vg; ctx.fill();
  ctx.beginPath(); ctx.moveTo(r * 0.45, r * 0.24); ctx.quadraticCurveTo(r * 0.8, r * 0.22, r * 0.95, r * 0.08); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.01; ctx.stroke();
  // подбородок
  ctx.beginPath(); ctx.moveTo(r * 0.42, -r * 0.25); ctx.quadraticCurveTo(r * 1.0, -r * 0.4, r * 0.75, -r * 0.85); ctx.lineTo(r * 0.2, -r * 0.8); ctx.closePath(); ctx.fillStyle = shade(rider.helmet, -0.25); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; for (let i = 0; i < 3; i++) ctx.fillRect(r * (0.55 + i * 0.1), -r * 0.55, r * 0.05, r * 0.15);
  ctx.restore();
}

function drawRiderLimbs(ctx, P, rider, part) {
  const jacket = rider.jacket, pants = rider.pants;
  if (part === 'far') {
    limb(ctx, P.shoulder, P.elbow2, 0.1, 0.085, shade(jacket, -0.4));
    limb(ctx, P.elbow2, P.bar, 0.085, 0.07, shade(jacket, -0.4));
    limb(ctx, P.hip, P.knee2, 0.16, 0.11, shade(pants, -0.4));
    limb(ctx, P.knee2, P.peg2, 0.11, 0.08, shade(pants, -0.4));
    return;
  }
  // нога: бедро, голень, наколенник, ботинок
  limb(ctx, P.hip, P.knee, 0.19, 0.12, pants);
  limb(ctx, P.knee, P.peg, 0.12, 0.085, pants);
  const ka = Math.atan2(P.peg[1] - P.knee[1], P.peg[0] - P.knee[0]);
  ctx.save(); ctx.translate(P.knee[0], P.knee[1]); ctx.rotate(ka);
  ctx.beginPath(); ctx.ellipse(0.06, 0.0, 0.1, 0.055, 0, 0, Math.PI * 2); ctx.fillStyle = shade(pants, -0.15); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0.04, 0.02, 0.06, 0.03, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(P.peg[0], P.peg[1]); ctx.rotate(P.bootA || 0);
  const bg = ctx.createLinearGradient(0, 0.14, 0, -0.06); bg.addColorStop(0, '#3a3c44'); bg.addColorStop(1, '#0b0b0e');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(-0.07, 0.16); ctx.lineTo(0.04, 0.16); ctx.lineTo(0.17, 0.0); ctx.quadraticCurveTo(0.18, -0.05, 0.12, -0.055); ctx.lineTo(-0.08, -0.055); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#888d96'; ctx.fillRect(-0.06, 0.05, 0.1, 0.018);
  ctx.restore();
  // торс: куртка с горбом-протектором и полосой
  const sx = P.shoulder[0] - P.hip[0], sy = P.shoulder[1] - P.hip[1];
  limb(ctx, P.hip, P.shoulder, 0.27, 0.25, jacket);
  const back = [P.hip[0] * 0.35 + P.shoulder[0] * 0.65, P.hip[1] * 0.35 + P.shoulder[1] * 0.65];
  const L = Math.hypot(sx, sy) || 1; const bx = sy / L, by = -sx / L; // назад от торса
  ctx.beginPath(); ctx.ellipse(back[0] + bx * 0.1, back[1] + by * 0.1, 0.15, 0.06, Math.atan2(sy, sx), 0, Math.PI * 2); ctx.fillStyle = shade(jacket, 0.12); ctx.fill();
  limb(ctx, [P.hip[0] * 0.55 + P.shoulder[0] * 0.45 - bx * 0.02, P.hip[1] * 0.55 + P.shoulder[1] * 0.45 - by * 0.02], [P.shoulder[0] - bx * 0.02, P.shoulder[1] - by * 0.02], 0.045, 0.04, shade(jacket, 0.45));
  // шея и шлем
  limb(ctx, P.shoulder, P.neck, 0.09, 0.08, '#202229');
  drawHelmet(ctx, P.head[0], P.head[1], P.torsoA, rider);
  // рука и перчатка
  limb(ctx, P.shoulder, P.elbow, 0.12, 0.095, jacket);
  circ(ctx, P.elbow[0], P.elbow[1], 0.05, shade(jacket, -0.1));
  limb(ctx, P.elbow, P.bar, 0.095, 0.075, jacket);
  circ(ctx, P.bar[0], P.bar[1], 0.055, '#16171b');
  circ(ctx, P.bar[0] + 0.01, P.bar[1] + 0.015, 0.02, 'rgba(255,255,255,0.18)');
}

function riderPose(def, lean, wf) {
  const st = BIKE_GEOM[def.style];
  const hip = [def.wb * st.seat[0] + lean * 0.07, st.seat[1] + 0.04];
  const torsoA = 1.25 - lean * 0.45 - (def.style === 'chopper' ? -0.3 : def.style === 'sport' || def.style === 'super' ? 0.35 : 0);
  const sh = [hip[0] + Math.cos(torsoA) * 0.5, hip[1] + Math.sin(torsoA) * 0.5];
  const neck = [hip[0] + Math.cos(torsoA) * 0.6, hip[1] + Math.sin(torsoA) * 0.6];
  const head = [hip[0] + Math.cos(torsoA) * 0.75, hip[1] + Math.sin(torsoA) * 0.75];
  const bar = [def.wb * st.bar[0], st.bar[1]];
  const peg = [def.wb * st.peg[0], st.peg[1]];
  const scale = def.style === 'pit' ? 0.92 : 1;
  const knee = ik(hip, peg, 0.45 * scale, 0.45 * scale, 1);
  const elbow = ik(sh, bar, 0.31, 0.31, -1);
  return { hip, shoulder: sh, neck, head, bar, peg, knee, elbow, knee2: [knee[0] - 0.03, knee[1]], peg2: [peg[0] - 0.02, peg[1]], elbow2: [elbow[0] - 0.02, elbow[1]], torsoA };
}

function drawDecal(ctx, decal, cfg, def, sx) {
  const wb = def.wb, c2 = cfg.paint2;
  ctx.fillStyle = c2; ctx.strokeStyle = c2;
  switch (decal) {
    case 'stripes':
      ctx.fillRect(-0.5, 0.52, wb + 1, 0.05); ctx.fillRect(-0.5, 0.6, wb + 1, 0.025);
      ctx.save(); ctx.translate(wb * 0.75, 0.3); ctx.rotate(0.42); ctx.fillRect(-0.6, -0.02, 1.2, 0.05); ctx.fillRect(-0.6, 0.06, 1.2, 0.025); ctx.restore();
      break;
    case 'flames': {
      const g = ctx.createLinearGradient(wb * 0.95, 0, wb * 0.2, 0);
      g.addColorStop(0, '#ffe14a'); g.addColorStop(0.5, '#ff7a1a'); g.addColorStop(1, '#d4160f');
      ctx.fillStyle = g;
      for (let k = 0; k < 2; k++) {
        const y0 = 0.42 + k * 0.17;
        ctx.beginPath(); ctx.moveTo(wb * 1.05, y0 - 0.12);
        for (let i = 0; i < 5; i++) {
          const xa = wb * (0.95 - i * 0.16), xb = xa - wb * 0.2;
          ctx.quadraticCurveTo(xa, y0 + 0.02, xb, y0 + 0.07 + (i % 2) * 0.03);
          ctx.quadraticCurveTo(xa - wb * 0.05, y0 - 0.02, xa - wb * 0.08, y0 - 0.06);
        }
        ctx.lineTo(wb * 1.05, y0 - 0.2); ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'number': {
      ctx.beginPath(); ctx.ellipse(wb * 0.78, 0.42, 0.1, 0.085, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
      textW(ctx, String(cfg.num || 7), wb * 0.78, 0.415, 0.12, '#111');
      ctx.fillStyle = c2; ctx.fillRect(-0.5, 0.56, wb + 1, 0.03);
      break;
    }
    case 'bolt':
      ctx.beginPath(); ctx.moveTo(wb * 0.2, 0.62); ctx.lineTo(wb * 0.62, 0.62); ctx.lineTo(wb * 0.55, 0.56); ctx.lineTo(wb * 1.0, 0.56);
      ctx.lineTo(wb * 0.7, 0.42); ctx.lineTo(wb * 0.75, 0.5); ctx.lineTo(wb * 0.3, 0.52); ctx.closePath(); ctx.fill();
      break;
    case 'checker':
      for (let x = -0.4, i = 0; x < wb + 0.2; x += 0.05, i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) ctx.fillRect(x, 0.5 + j * 0.05, 0.05, 0.05);
      break;
    case 'tribal':
      ctx.beginPath();
      ctx.moveTo(wb * 1.05, 0.5);
      ctx.quadraticCurveTo(wb * 0.7, 0.62, wb * 0.45, 0.58); ctx.lineTo(wb * 0.62, 0.66);
      ctx.quadraticCurveTo(wb * 0.35, 0.66, 0.0, 0.6); ctx.quadraticCurveTo(wb * 0.4, 0.58, wb * 0.55, 0.52);
      ctx.lineTo(wb * 0.4, 0.46); ctx.quadraticCurveTo(wb * 0.75, 0.5, wb * 1.05, 0.5); ctx.fill();
      break;
  }
}

function drawExhaust(ctx, sh, def, cfg, sx) {
  if (sh.noExhaust) return;
  const ex = cfg.exhaust || 'stock';
  const hdr = def.style === 'chopper' ? [0.95, 0.4] : [0.86 * (sh.ref / sx), 0.24];
  const pipe = (pts, w, col) => line(ctx, pts, 1, w, col);
  const can = (x0, y0, x1, y1, h, col, tip) => {
    const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, -h * 0.4); ctx.lineTo(L, -h / 2); ctx.lineTo(L, h / 2); ctx.lineTo(0, h * 0.4); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = tip || '#c9ced6'; ctx.fillRect(-0.03, -h * 0.4, 0.04, h * 0.8);
    ctx.beginPath(); ctx.ellipse(-0.01, 0, 0.012, h * 0.32, 0, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();
    ctx.restore();
  };
  const hx = hdr[0] * sx, hy = hdr[1];
  if (def.style === 'chopper') {
    const lens = ex === 'stock' ? [-0.12, -0.05] : ex === 'slip' ? [0.05, 0.1] : ex === 'under' ? [0.1, 0.15] : [-0.25, -0.2];
    pipe([[hx, hy], [hx - 0.12, 0.16], [lens[0], 0.16]], 0.055, COL.C);
    pipe([[hx - 0.25, 0.5], [hx - 0.4, 0.26], [lens[1], 0.24]], 0.055, COL.C);
    if (ex !== 'straight') { can(lens[0] + 0.32, 0.16, lens[0], 0.16, 0.08, '#cfd3d9'); }
    return;
  }
  if (ex === 'stock') {
    if (sh.belly) { pipe([[hx, hy], [hx - 0.05, 0.04]], 0.05, '#666'); can(0.85 * sx, 0.02, 0.48 * sx, 0.0, 0.11, '#2b2e35', '#666'); return; }
    if (sh.high) { pipe([[hx, hy], [0.95 * sx, 0.24], [0.6 * sx, 0.42], [0.38 * sx, 0.5]], 0.045, '#8d8f96'); can(0.35 * sx, 0.5, -0.02, 0.45, 0.12, '#b3b8c0'); return; }
    pipe([[hx, hy], [hx - 0.1, 0.08], [0.45 * sx, 0.12], [0.32 * sx, 0.26]], 0.05, '#8d8f96');
    can(0.36 * sx, 0.26, 0.04, 0.38, 0.13, '#3b3f48'); return;
  }
  if (ex === 'slip') {
    const y = sh.high ? 0.48 : 0.3;
    pipe([[hx, hy], [hx - 0.1, 0.08], [0.45 * sx, 0.14], [0.36 * sx, y - 0.04]], 0.05, '#8d8f96');
    can(0.36 * sx, y - 0.04, 0.12, y + 0.06, 0.12, '#15161a', '#d9dde3'); return;
  }
  if (ex === 'under') {
    pipe([[hx, hy], [hx - 0.1, 0.08], [0.42 * sx, 0.2], [0.18 * sx, 0.44]], 0.05, '#8d8f96');
    can(0.3 * sx, 0.47, -0.24, 0.55, 0.06, '#c9ced6', '#888');
    can(0.3 * sx, 0.41, -0.22, 0.48, 0.06, '#c9ced6', '#888'); return;
  }
  // прямоток
  pipe([[hx, hy], [hx - 0.1, 0.06], [0.4 * sx, 0.1]], 0.055, '#c9ced6');
  ctx.save(); ctx.beginPath(); ctx.moveTo(0.42 * sx, 0.07); ctx.lineTo(-0.12, 0.2); ctx.lineTo(-0.14, 0.3); ctx.lineTo(0.42 * sx, 0.13); ctx.closePath();
  const g = ctx.createLinearGradient(0, 0.1, 0, 0.3); g.addColorStop(0, '#5a4a7a'); g.addColorStop(0.5, '#d9a35a'); g.addColorStop(1, '#4a6fb0'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
}

// pose: {x,y,a, wr:{x,y,rot,w}, wf:{...}, lean, def, crashed}
function drawBike(ctx, pose, cfg, rider, flame) {
  const def = pose.def, sh = SHAPES[STYLE_SHAPE[def.style]];
  const sx = def.wb / sh.ref;
  const [cx, cy] = def.com;
  const c = Math.cos(pose.a), s = Math.sin(pose.a);
  const toLocal = (wx, wy) => { const dx = wx - pose.x, dy = wy - pose.y; return [c * dx + s * dy + cx, -s * dx + c * dy + cy]; };
  const wr = toLocal(pose.wr.x, pose.wr.y), wf = toLocal(pose.wf.x, pose.wf.y);
  ctx.save();
  ctx.translate(pose.x, pose.y); ctx.rotate(pose.a); ctx.translate(-cx, -cy);
  const roleCol = r => r === 'P' ? cfg.paint : r === 'P2' ? cfg.paint2 : COL[r];
  const pivot = [def.wb * 0.38, def.style === 'chopper' ? 0.12 : 0.2];
  const rake = def.rake * Math.PI / 180;
  const fu = [Math.sin(rake), -Math.cos(rake)];
  const head = [def.wb - fu[0] * def.forkLen, def.rf - def.rr - fu[1] * def.forkLen];
  // колёса
  drawWheel(ctx, wr[0], wr[1], def.rr, pose.wr.rot, pose.wr.w || 0, cfg, def, false);
  drawWheel(ctx, wf[0], wf[1], def.rf, pose.wf.rot, pose.wf.w || 0, cfg, def, true);
  // цепь и звёзды
  const spr = [pivot[0] + 0.07, pivot[1] + 0.02];
  circ(ctx, spr[0], spr[1], 0.045, '#3a3d44');
  ctx.beginPath(); ctx.arc(wr[0], wr[1], def.rr * 0.42, 0, Math.PI * 2); ctx.fillStyle = '#5e646d'; ctx.fill();
  ctx.save(); ctx.setLineDash([0.018, 0.012]); ctx.lineDashOffset = -(pose.wr.rot || 0) * def.rr * 0.4;
  ctx.beginPath(); ctx.moveTo(spr[0], spr[1] + 0.045); ctx.lineTo(wr[0], wr[1] + def.rr * 0.42); ctx.moveTo(spr[0], spr[1] - 0.045); ctx.lineTo(wr[0], wr[1] - def.rr * 0.42);
  ctx.strokeStyle = '#8b9099'; ctx.lineWidth = 0.016; ctx.stroke(); ctx.restore();
  // маятник
  limb(ctx, pivot, wr, 0.085, 0.06, def.style === 'chopper' ? '#1a1a1d' : def.style === 'sport' || def.style === 'super' || def.style === 'stunt' ? '#8f96a0' : '#5d636c');
  circ(ctx, pivot[0], pivot[1], 0.035, '#2a2d33');
  // амортизатор с пружиной
  const sa = [pivot[0] - 0.06, pivot[1] + 0.33], sb = [(pivot[0] + wr[0]) * 0.55, (pivot[1] + wr[1]) * 0.5 + 0.06];
  limb(ctx, sa, sb, 0.03, 0.03, '#2b2e35');
  { const dx = sb[0] - sa[0], dy = sb[1] - sa[1], L = Math.hypot(dx, dy), nx = -dy / L * 0.035, ny = dx / L * 0.035;
    ctx.beginPath(); for (let k = 0; k <= 10; k++) { const t = 0.12 + k / 10 * 0.76, sg = k % 2 ? 1 : -1; ctx.lineTo(sa[0] + dx * t + nx * sg, sa[1] + dy * t + ny * sg); }
    ctx.strokeStyle = def.style === 'chopper' ? '#d9dde3' : '#e8b832'; ctx.lineWidth = 0.014; ctx.lineJoin = 'round'; ctx.stroke(); }
  // вилка: хромированные перья и нижние стаканы
  const fl = Math.hypot(wf[0] - head[0], wf[1] - head[1]);
  const fdir = [(wf[0] - head[0]) / fl, (wf[1] - head[1]) / fl];
  const mid = [head[0] + fdir[0] * fl * 0.5, head[1] + fdir[1] * fl * 0.5];
  const offroad = def.style === 'enduro' || def.style === 'pit';
  const usd = def.style === 'sport' || def.style === 'super' || def.style === 'stunt' || def.style === 'sm';
  limb(ctx, [head[0] - 0.012, head[1]], [mid[0] - 0.012, mid[1]], 0.075, 0.075, def.style === 'chopper' ? '#e6e9ee' : usd ? '#25272d' : '#b9c0c9');
  limb(ctx, [mid[0] - fdir[0] * 0.12, mid[1] - fdir[1] * 0.12], wf, 0.065, 0.06, def.style === 'chopper' ? '#e6e9ee' : usd ? '#d8b24a' : offroad ? '#d9a93a' : '#c0c6ce');
  if (offroad) { const bt = [mid[0] - fdir[0] * 0.05, mid[1] - fdir[1] * 0.05], be = [mid[0] + fdir[0] * 0.12, mid[1] + fdir[1] * 0.12]; limb(ctx, bt, be, 0.085, 0.08, '#202226'); }
  // крыло переднего колеса
  if (sh.fender) {
    ctx.save(); ctx.translate(wf[0] - def.wb * 1, wf[1] - (def.rf - def.rr));
    ctx.beginPath(); ctx.moveTo(sh.fender[0][0] * sx, sh.fender[0][1]); for (let i = 1; i < sh.fender.length; i++) ctx.lineTo(sh.fender[i][0] * sx, sh.fender[i][1]);
    ctx.lineWidth = 0.05; ctx.strokeStyle = shade(sh.high ? cfg.paint2 : cfg.paint, -0.25); ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 0.02; ctx.strokeStyle = shade(sh.high ? cfg.paint2 : cfg.paint, 0.25); ctx.stroke(); ctx.restore();
  }
  // рама-трубы
  if (sh.frame) for (const f of sh.frame) for (let k = 0; k < f.length - 1; k++) limb(ctx, [f[k][0] * sx, f[k][1]], [f[k + 1][0] * sx, f[k + 1][1]], 0.05, 0.05, def.style === 'chopper' ? '#1a1a1d' : '#7d848f');
  if (sh.motor) { const m = sh.motor; const mg = ctx.createRadialGradient(m[0] * sx + 0.03, m[1] + 0.04, 0.01, m[0] * sx, m[1], m[2]); mg.addColorStop(0, '#9aa1ab'); mg.addColorStop(1, '#2c3037'); circ(ctx, m[0] * sx, m[1], m[2], mg); circ(ctx, m[0] * sx, m[1], m[2] * 0.45, cfg.paint2); }
  const p = riderPose(def, pose.lean || 0);
  if (rider && !pose.crashed) drawRiderLimbs(ctx, p, rider, 'far');
  if (!sh.low) drawExhaust(ctx, sh, def, cfg, sx);
  // корпус
  const paintPaths = [];
  for (const [role, pts] of sh.parts) {
    let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9;
    for (const q of pts) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); x0 = Math.min(x0, q[0] * sx); x1 = Math.max(x1, q[0] * sx); }
    poly(ctx, pts, sx);
    const base = roleCol(role);
    if (role === 'G' || role === 'L') { ctx.fillStyle = base; ctx.fill(); if (role === 'L') { ctx.save(); ctx.shadowColor = '#fff3b0'; ctx.shadowBlur = 12; ctx.fill(); ctx.restore(); } continue; }
    const g = ctx.createLinearGradient(0, y1, 0, y0);
    if (role === 'E' || role === 'M' || role === 'C') {
      const lite = role === 'C' ? 0.55 : 0.3;
      g.addColorStop(0, shade(base, lite)); g.addColorStop(0.45, base); g.addColorStop(0.55, shade(base, -0.25)); g.addColorStop(1, shade(base, 0.1));
    } else {
      g.addColorStop(0, shade(base, 0.22)); g.addColorStop(0.5, base); g.addColorStop(1, shade(base, -0.4));
    }
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 0.008; ctx.lineJoin = 'round'; ctx.stroke();
    if (role === 'P') paintPaths.push(pts);
    if (role === 'E') {
      // рёбра цилиндра и крышки картера
      ctx.save(); poly(ctx, pts, sx); ctx.clip();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.012;
      for (let yy = y0 + (y1 - y0) * 0.55; yy < y1; yy += 0.035) { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy + 0.02); ctx.stroke(); }
      const cxm = (x0 + x1) / 2 - 0.04, cym = y0 + (y1 - y0) * 0.3;
      const cg2 = ctx.createRadialGradient(cxm + 0.02, cym + 0.03, 0.01, cxm, cym, 0.1); cg2.addColorStop(0, '#d5dae1'); cg2.addColorStop(1, '#5d636c');
      circ(ctx, cxm, cym, 0.09, cg2); circ(ctx, cxm, cym, 0.03, '#2a2d33');
      ctx.restore();
    }
  }
  // наклейка поверх окрашенных панелей
  if (cfg.decal && cfg.decal !== 'none' && paintPaths.length) {
    ctx.save(); ctx.beginPath();
    for (const pts of paintPaths) { ctx.moveTo(pts[0][0] * sx, pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * sx, pts[i][1]); ctx.closePath(); }
    ctx.clip(); drawDecal(ctx, cfg.decal, cfg, def, sx); ctx.restore();
  }
  // блик
  for (const pts of paintPaths) {
    ctx.save(); poly(ctx, pts, sx); ctx.clip();
    const g = ctx.createLinearGradient(0, 0.9, 0, 0.1); g.addColorStop(0, 'rgba(255,255,255,0.32)'); g.addColorStop(0.4, 'rgba(255,255,255,0.02)'); g.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = g; ctx.fillRect(-1, -0.2, 3, 1.4);
    // блик лака
    ctx.beginPath(); ctx.moveTo(pts[0][0] * sx, pts[0][1] - 0.025); for (let i = 1; i < Math.ceil(pts.length / 2); i++) ctx.lineTo(pts[i][0] * sx, pts[i][1] - 0.025);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.012; ctx.stroke();
    ctx.restore();
  }
  if (sh.low) drawExhaust(ctx, sh, def, cfg, sx);
  if (sh.cage && !def.noCage) { for (const cg of sh.cage) for (let k = 0; k < cg.length - 1; k++) limb(ctx, [cg[k][0] * sx, cg[k][1]], [cg[k + 1][0] * sx, cg[k + 1][1]], 0.038, 0.038, '#c9ced6'); }
  if (sh.light) {
    const L = sh.light; const lx = L[0] * sx;
    const hg2 = ctx.createRadialGradient(lx - 0.02, L[1] + 0.03, 0.01, lx, L[1], L[2] * 1.15); hg2.addColorStop(0, '#6b7079'); hg2.addColorStop(1, '#16181c');
    circ(ctx, lx, L[1], L[2] * 1.15, hg2);
    ctx.save(); ctx.shadowColor = '#fff3b0'; ctx.shadowBlur = 14; circ(ctx, lx + 0.01, L[1], L[2] * 0.8, COL.L); ctx.restore();
    circ(ctx, lx + 0.0, L[1] + 0.02, L[2] * 0.3, 'rgba(255,255,255,0.9)');
  }
  // руль
  limb(ctx, head, p.bar, 0.04, 0.032, '#3a3d45');
  circ(ctx, head[0], head[1], 0.045, '#2b2e35'); circ(ctx, head[0] + 0.01, head[1] + 0.01, 0.015, '#9aa1ab');
  if (rider && !pose.crashed) drawRiderLimbs(ctx, p, rider, 'near');
  // пламя из выхлопа при отсечке
  if (flame > 0 && !sh.noExhaust) {
    const ex = (cfg.exhaust === 'under') ? [-0.25, 0.5] : sh.high ? [-0.05, 0.45] : sh.belly ? [0.46 * sx, 0.0] : def.style === 'chopper' ? [-0.15, 0.16] : (cfg.exhaust === 'straight' ? [-0.14, 0.25] : [0.02, 0.38]);
    ctx.beginPath(); ctx.moveTo(ex[0], ex[1] + 0.04); ctx.lineTo(ex[0] - 0.25 * flame - Math.random() * 0.1, ex[1]); ctx.lineTo(ex[0], ex[1] - 0.04); ctx.closePath();
    ctx.fillStyle = Math.random() < 0.5 ? '#ffd24a' : '#ff6a1a'; ctx.fill();
  }
  ctx.restore();
}

// ---------------- Фон ----------------
const THEMES = {
  sunset: { sky: ['#2b1a4f', '#c2416b', '#ffb36b'], sun: '#ffe2a0', far: '#7b3f6d', mid: '#4a2550', near: '#2c1838', ground: ['#4b3a3a', '#241a1e'], road: '#2e2d33', edge: '#ffcf6a', haze: 'rgba(255,170,120,0.15)' },
  desert: { sky: ['#3d8fd6', '#8cc7ef', '#ffe3b3'], sun: '#fff6d8', far: '#d79a6e', mid: '#b5643f', near: '#8f4a2d', ground: ['#c47a46', '#7a3f22'], road: '#b8733f', edge: '#e2a46a', haze: 'rgba(255,220,180,0.18)' },
  night: { sky: ['#03040c', '#0c1736', '#1d2c56'], sun: '#e9f0ff', far: '#16213f', mid: '#0f182f', near: '#0a1122', ground: ['#272b35', '#11131a'], road: '#23262e', edge: '#ffcc00', haze: 'rgba(80,120,255,0.08)', night: true },
  mountain: { sky: ['#5b8fc9', '#a9cdea', '#e8f2f7'], sun: '#fffbe8', far: '#7f97b3', mid: '#4f6b5a', near: '#2f4a38', ground: ['#4c5e3a', '#2b3622'], road: '#3a3b40', edge: '#e8e8e8', haze: 'rgba(255,255,255,0.12)', snow: true }
};

function hash1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash1(i) * (1 - u) + hash1(i + 1) * u; }
function fbm(x) { return vnoise(x) * 0.6 + vnoise(x * 2.3 + 5) * 0.28 + vnoise(x * 5.1 + 9) * 0.12; }

function drawBackground(ctx, theme, camX, camY, W, H, k, time) {
  const T = THEMES[theme];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, T.sky[0]); g.addColorStop(0.55, T.sky[1]); g.addColorStop(1, T.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (T.night) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 90; i++) { const x = ((hash1(i) * W * 1.5 - camX * 0.6) % W + W) % W, y = hash1(i + 50) * H * 0.55; ctx.globalAlpha = 0.3 + 0.7 * hash1(i + 9) * (0.7 + 0.3 * Math.sin(time * 2 + i)); ctx.fillRect(x, y, 1.6, 1.6); }
    ctx.globalAlpha = 1;
  }
  // солнце / луна
  const sx = W * 0.74 - camX * 0.3 % 1, sy = H * (theme === 'sunset' ? 0.52 : 0.2);
  const sr = Math.min(W, H) * (theme === 'sunset' ? 0.13 : 0.06);
  const sg = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 3.2);
  sg.addColorStop(0, T.sun); sg.addColorStop(0.3, T.sun + '66'); sg.addColorStop(1, T.sun + '00');
  ctx.fillStyle = sg; ctx.fillRect(sx - sr * 3.2, sy - sr * 3.2, sr * 6.4, sr * 6.4);
  circ(ctx, sx, sy, sr, T.sun);
  if (theme === 'night') circ(ctx, sx + sr * 0.35, sy - sr * 0.2, sr * 0.85, '#16234a');
  // облака
  if (!T.night) {
    ctx.fillStyle = theme === 'sunset' ? 'rgba(255,190,170,0.35)' : 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 6; i++) {
      const cw = W * (0.12 + hash1(i + 3) * 0.12);
      const x = ((hash1(i) * W * 2 - camX * k * 0.03 - time * 6) % (W + cw * 2) + W + cw * 2) % (W + cw * 2) - cw;
      const y = H * (0.08 + hash1(i + 7) * 0.25);
      for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.ellipse(x + j * cw * 0.25, y + Math.sin(j * 2) * cw * 0.04, cw * 0.22, cw * 0.1, 0, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  const layer = (par, yBase, amp, freq, col, kind) => {
    const off = camX * par;
    const yb = H * yBase + camY * k * par * 0.35;
    const lg = ctx.createLinearGradient(0, yb - amp * 1.2, 0, yb + H * 0.15);
    lg.addColorStop(0, mix(col, T.sky[2], 0.35 * (1 - par))); lg.addColorStop(0.6, col); lg.addColorStop(1, shade(col, -0.25));
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(0, H);
    const step = 6;
    for (let px = 0; px <= W + step; px += step) {
      const wx = (px - W / 2 + off * k) / (H * 0.5);
      let y;
      if (kind === 'mesa') { const n = fbm(wx * freq); y = yb - (n > 0.5 ? amp * (0.7 + 0.3 * Math.round(n * 3) / 3) : amp * n * 0.5); }
      else if (kind === 'sharp') { const n = fbm(wx * freq); y = yb - amp * Math.pow(n, 1.3) * 1.4; }
      else y = yb - amp * fbm(wx * freq);
      ctx.lineTo(px, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  };
  if (theme === 'sunset') {
    layer(0.06, 0.62, H * 0.22, 1.3, T.far, 'smooth');
    // море
    const sea = H * 0.66 + camY * k * 0.04;
    const sg2 = ctx.createLinearGradient(0, sea, 0, H); sg2.addColorStop(0, '#d9637a'); sg2.addColorStop(1, '#3a1f4f');
    ctx.fillStyle = sg2; ctx.fillRect(0, sea, W, H - sea);
    ctx.fillStyle = 'rgba(255,220,160,0.5)';
    for (let i = 0; i < 14; i++) { const y = sea + 4 + i * i * 1.6; const w = (40 - i * 2) * (1 + Math.sin(time * 1.3 + i)) ; ctx.fillRect(sx - w / 2, y, w, 2); }
    cityLayer(ctx, camX, camY, W, H, k, 0.22, 0.7, T.mid, false, time);
    layer(0.5, 0.86, H * 0.05, 2.5, T.near, 'smooth');
  } else if (theme === 'desert') {
    layer(0.05, 0.6, H * 0.2, 1.4, T.far, 'mesa');
    layer(0.15, 0.7, H * 0.18, 1.1, T.mid, 'mesa');
    cactusLayer(ctx, camX, camY, W, H, k, 0.35, 0.82, '#6e3a24');
    layer(0.5, 0.9, H * 0.06, 2.5, T.near, 'smooth');
  } else if (theme === 'night') {
    layer(0.04, 0.6, H * 0.14, 1.5, T.far, 'smooth');
    cityLayer(ctx, camX, camY, W, H, k, 0.12, 0.66, '#121c38', true, time);
    craneLayer(ctx, camX, camY, W, H, k, 0.3, 0.8, T.mid);
    // вода порта
    const sea = H * 0.82 + camY * k * 0.15;
    ctx.fillStyle = '#081024'; ctx.fillRect(0, sea, W, H - sea);
    ctx.fillStyle = 'rgba(255,210,120,0.25)';
    for (let i = 0; i < 30; i++) { const x = ((hash1(i) * W * 3 - camX * k * 0.3) % W + W) % W; ctx.fillRect(x, sea + 3 + hash1(i + 4) * 30, 10 + hash1(i + 1) * 30, 1.5); }
  } else {
    layer(0.04, 0.55, H * 0.32, 2.2, T.far, 'sharp');
    snowCaps(ctx, camX, camY, W, H, k, 0.04, 0.55, H * 0.32, 2.2);
    pineLayer(ctx, camX, camY, W, H, k, 0.2, 0.72, T.mid, 0.6);
    pineLayer(ctx, camX, camY, W, H, k, 0.4, 0.86, T.near, 1);
  }
  const hz = ctx.createLinearGradient(0, H * 0.4, 0, H); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(0.5, T.haze); hz.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hz; ctx.fillRect(0, H * 0.4, W, H * 0.6);
}

function snowCaps(ctx, camX, camY, W, H, k, par, yBase, amp, freq) {
  const off = camX * par, yb = H * yBase + camY * k * par * 0.35;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  let started = false;
  for (let px = 0; px <= W + 6; px += 6) {
    const wx = (px - W / 2 + off * k) / (H * 0.5); const n = fbm(wx * freq);
    const y = yb - amp * Math.pow(n, 1.3) * 1.4;
    const lim = yb - amp * (0.78 + Math.sin(wx * 9) * 0.05 + Math.sin(wx * 23) * 0.025);
    if (y < lim) { if (!started) { ctx.moveTo(px, lim); started = true; } ctx.lineTo(px, y); }
    else if (started) { ctx.lineTo(px, lim); ctx.closePath(); started = false; }
  }
  if (started) ctx.closePath();
  ctx.fill();
}

function cityLayer(ctx, camX, camY, W, H, k, par, yBase, col, lit, time) {
  const off = camX * par * k, yb = H * yBase + camY * k * par * 0.35;
  const bw = Math.max(26, k * 2.2);
  const i0 = Math.floor((off - W / 2) / bw) - 1, i1 = i0 + Math.ceil(W / bw) + 3;
  for (let i = i0; i < i1; i++) {
    const x = i * bw - off + W / 2;
    const h = (0.25 + hash1(i * 3.1) * 0.75) * H * 0.3;
    const w = bw * (0.7 + hash1(i * 1.7) * 0.3);
    ctx.fillStyle = col; ctx.fillRect(x, yb - h, w, h + H);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x, yb - h, w * 0.18, h + H);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + w * 0.82, yb - h, w * 0.18, h + H);
    ctx.fillStyle = col;
    if (hash1(i * 5.3) > 0.7) ctx.fillRect(x + w * 0.45, yb - h - 14, 2, 14);
    if (lit) {
      ctx.fillStyle = 'rgba(255,214,120,0.7)';
      for (let yy = yb - h + 6; yy < yb - 4; yy += 9) for (let xx = x + 4; xx < x + w - 4; xx += 7) if (hash1(xx * 0.37 + yy * 1.3 + i) > 0.62) ctx.fillRect(xx, yy, 3, 4);
    } else {
      ctx.fillStyle = 'rgba(255,190,140,0.18)';
      for (let yy = yb - h + 6; yy < yb - 4; yy += 10) ctx.fillRect(x + 3, yy, w - 6, 2);
    }
  }
}
function craneLayer(ctx, camX, camY, W, H, k, par, yBase, col) {
  const off = camX * par * k, yb = H * yBase + camY * k * par * 0.35;
  const sp = k * 18;
  const i0 = Math.floor((off - W) / sp) - 1, i1 = i0 + Math.ceil(W * 2 / sp) + 2;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
  for (let i = i0; i < i1; i++) {
    if (hash1(i * 2.2) < 0.35) continue;
    const x = i * sp - off + W / 2, h = H * (0.3 + hash1(i) * 0.15);
    ctx.fillRect(x - 3, yb - h, 6, h + H);
    ctx.beginPath(); ctx.moveTo(x - 30, yb - h); ctx.lineTo(x + h * 0.7, yb - h); ctx.moveTo(x, yb - h - 20); ctx.lineTo(x - 30, yb - h); ctx.moveTo(x, yb - h - 20); ctx.lineTo(x + h * 0.7, yb - h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + h * 0.5, yb - h); ctx.lineTo(x + h * 0.5, yb - h * 0.6); ctx.lineWidth = 1; ctx.stroke(); ctx.lineWidth = 3;
    ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x - 2, yb - h - 24, 4, 4); ctx.fillStyle = col;
    // контейнеры
    for (let j = 0; j < 3; j++) { ctx.fillStyle = ['#3a1d2a', '#16304a', '#2c3a1a'][(i + j) % 3]; ctx.fillRect(x + 20 + j * 34, yb - 16 - (j % 2) * 16, 32, 15); }
    ctx.fillStyle = col;
  }
}
function cactusLayer(ctx, camX, camY, W, H, k, par, yBase, col) {
  const off = camX * par * k, yb = H * yBase + camY * k * par * 0.35;
  const sp = k * 7;
  const i0 = Math.floor((off - W) / sp) - 1, i1 = i0 + Math.ceil(W * 2 / sp) + 2;
  ctx.fillStyle = col;
  for (let i = i0; i < i1; i++) {
    if (hash1(i * 4.4) < 0.5) continue;
    const x = i * sp - off + W / 2 + hash1(i) * sp * 0.5, h = k * (1.2 + hash1(i * 7) * 1.4);
    const w = h * 0.16;
    ctx.fillRect(x - w / 2, yb - h, w, h + H);
    ctx.fillRect(x - w * 2.2, yb - h * 0.62, w * 0.8, h * 0.28); ctx.fillRect(x - w * 2.2, yb - h * 0.62, w * 2, w * 0.7);
    ctx.fillRect(x + w * 1.3, yb - h * 0.8, w * 0.8, h * 0.3); ctx.fillRect(x, yb - h * 0.55, w * 2, w * 0.7);
  }
}
function pineLayer(ctx, camX, camY, W, H, k, par, yBase, col, sc) {
  const off = camX * par * k, yb = H * yBase + camY * k * par * 0.35;
  const sp = k * 1.6 * sc;
  const i0 = Math.floor((off - W) / sp) - 1, i1 = i0 + Math.ceil(W * 2 / sp) + 2;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.rect(0, yb, W, H);
  for (let i = i0; i < i1; i++) {
    const x = i * sp - off + W / 2, h = k * sc * (2.5 + hash1(i * 3.3) * 2.5), w = h * 0.36;
    const y0 = yb + hash1(i) * 10;
    ctx.moveTo(x, y0 - h); ctx.lineTo(x + w / 2, y0); ctx.lineTo(x - w / 2, y0); ctx.closePath();
  }
  ctx.fill();
}

// ---------------- Рельеф и декорации (в мировых координатах) ----------------
function drawTerrain(ctx, ter, theme, x0, x1, yBottom) {
  const T = THEMES[theme];
  const xs = ter.xs, ys = ter.ys, tags = ter.tags;
  let i0 = Math.max(0, ter.idx(x0) - 1), i1 = Math.min(xs.length - 1, ter.idx(x1) + 2);
  // заливка грунта
  ctx.beginPath(); ctx.moveTo(xs[i0], yBottom);
  for (let i = i0; i <= i1; i++) ctx.lineTo(xs[i], ys[i]);
  ctx.lineTo(xs[i1], yBottom); ctx.closePath();
  const g = ctx.createLinearGradient(0, ter.heightAt((x0 + x1) / 2), 0, yBottom);
  g.addColorStop(0, T.ground[0]); g.addColorStop(1, T.ground[1]);
  ctx.fillStyle = g; ctx.fill();
  // текстура грунта: камешки и слои
  ctx.save(); ctx.clip();
  const spk = theme === 'desert' ? ['rgba(90,40,15,0.35)', 'rgba(255,220,170,0.25)'] : theme === 'night' ? ['rgba(0,0,0,0.35)', 'rgba(120,140,190,0.12)'] : ['rgba(0,0,0,0.25)', 'rgba(255,255,255,0.1)'];
  for (let xx = Math.floor(x0); xx < x1; xx += 0.5) {
    const top = ter.heightAt(xx);
    for (let j = 0; j < 5; j++) {
      const hh = hash1(xx * 3.7 + j * 11.3);
      ctx.fillStyle = spk[j % 2];
      const yy = top - 0.6 - hh * 4.5, sz = 0.04 + hash1(xx + j) * 0.09;
      ctx.fillRect(xx + hash1(xx * 1.3 + j) * 0.5, yy, sz * 1.6, sz);
    }
  }
  if (theme === 'desert' || theme === 'mountain') {
    ctx.strokeStyle = theme === 'desert' ? 'rgba(120,55,25,0.25)' : 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.18;
    for (let d = 1.6; d < 9; d += 1.9) { ctx.beginPath(); for (let xx = x0; xx <= x1; xx += 1) ctx.lineTo(xx, ter.heightAt(xx) - d - Math.sin(xx * 0.3 + d) * 0.25); ctx.stroke(); }
  }
  ctx.restore();
  // контейнеры порта
  for (let i = i0; i < i1; i++) {
    if (tags[i] === 'box') {
      const xa = xs[i], xb = xs[i + 1], y = ys[i];
      const hgt = y - ter.heightAt(xa - 6);
      const col = ['#a3312b', '#1f5f99', '#2f7d4a', '#c27a1d'][Math.floor(xa) % 4];
      ctx.fillStyle = col; ctx.fillRect(xa, y - Math.max(2.4, hgt), xb - xa, Math.max(2.4, hgt));
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.06; ctx.beginPath();
      for (let x = xa + 0.3; x < xb; x += 0.35) { ctx.moveTo(x, y - 0.1); ctx.lineTo(x, y - Math.max(2.4, hgt) + 0.1); }
      ctx.stroke();
    }
    if (tags[i] === 'pit') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(xs[i], ys[i], xs[i + 1] - xs[i], 5);
    }
  }
  // покрытие
  const run = (tag, col, w, off) => {
    ctx.beginPath(); let on = false;
    for (let i = i0; i < i1; i++) {
      const t = tags[i];
      const ok = tag === 'any' ? t !== 'pit' : (t === tag || (tag === 'road' && (t === 'dirt' || t === 'mix')));
      if (ok) { if (!on) { ctx.moveTo(xs[i], ys[i] - off); on = true; } ctx.lineTo(xs[i + 1], ys[i + 1] - off); }
      else on = false;
    }
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'butt'; ctx.stroke();
  };
  run('road', T.road, 0.5, 0.25);
  if (theme !== 'desert') { ctx.setLineDash([1.5, 1.8]); run('road', theme === 'mountain' ? '#e0e0e0' : '#e8d27a', 0.06, 0.28); ctx.setLineDash([]); }
  run('road', shade(T.road, theme === 'desert' ? 0.2 : 0.15), 0.07, 0.035);
  run('ramp', '#8a5a33', 0.5, 0.25);
  ctx.setLineDash([0.12, 0.5]); run('ramp', '#5a3a20', 0.48, 0.25); ctx.setLineDash([]);
  run('ramp', T.edge, 0.08, 0.04);
  run('box', '#5d6168', 0.1, 0.05);
  if (theme === 'mountain') run('road', '#5b7a3a', 0.12, -0.02);
  // асфальт: зерно и обочина
  if (theme !== 'desert') {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let xx = Math.floor(x0 * 4) / 4; xx < x1; xx += 0.25) { if (tags[ter.idx(xx)] === 'ramp') continue; const y = ter.heightAt(xx); ctx.fillRect(xx + hash1(xx * 9) * 0.2, y - 0.1 - hash1(xx * 5) * 0.35, 0.03, 0.03); }
  } else {
    ctx.fillStyle = 'rgba(110,50,20,0.45)';
    for (let xx = Math.floor(x0 * 3) / 3; xx < x1; xx += 0.33) { const y = ter.heightAt(xx); ctx.beginPath(); ctx.ellipse(xx, y - 0.02, 0.06 + hash1(xx) * 0.06, 0.03, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  if (theme === 'mountain' || theme === 'sunset') {
    ctx.strokeStyle = theme === 'mountain' ? '#6f9a45' : '#5a6b3a'; ctx.lineWidth = 0.025;
    ctx.beginPath();
    for (let xx = Math.floor(x0 * 2) / 2; xx < x1; xx += 0.5) { if (hash1(xx * 7.7) < 0.55 || tags[ter.idx(xx)] === 'ramp') continue; const y = ter.heightAt(xx) - 0.02; for (let b2 = -1; b2 <= 1; b2++) { ctx.moveTo(xx, y); ctx.lineTo(xx + b2 * 0.05, y + 0.08 + hash1(xx + b2) * 0.08); } }
    ctx.stroke();
  }
}

function drawProp(ctx, p, y, theme, night) {
  const s = p.s, x = p.x;
  switch (p.kind) {
    case 'lamp':
      ctx.fillStyle = '#2a2d35'; ctx.fillRect(x - 0.06, y, 0.12, 5 * s);
      ctx.fillRect(x - 0.06, y + 5 * s - 0.08, 0.9, 0.12);
      circ(ctx, x + 0.85, y + 5 * s - 0.15, 0.14, night ? '#fff2b0' : '#d8d2b8');
      if (night) { const g = ctx.createRadialGradient(x + 0.85, y + 5 * s - 0.2, 0.1, x + 0.85, y + 2, 4); g.addColorStop(0, 'rgba(255,230,150,0.35)'); g.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + 0.85, y + 5 * s - 0.2); ctx.lineTo(x + 3.2, y); ctx.lineTo(x - 1.5, y); ctx.closePath(); ctx.fill(); }
      break;
    case 'palm': {
      ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 0.22; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 0.6 * s, y + 3 * s, x + 0.3 * s, y + 5.5 * s); ctx.stroke();
      ctx.fillStyle = '#1f4a35';
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3; ctx.save(); ctx.translate(x + 0.3 * s, y + 5.5 * s); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(1.1 * s, -0.2, 1.2 * s, 0.22, -0.25, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      break;
    }
    case 'bench': ctx.fillStyle = '#4a3328'; ctx.fillRect(x, y + 0.45, 1.6, 0.1); ctx.fillRect(x, y + 0.6, 1.6, 0.08); ctx.fillRect(x, y + 0.8, 1.6, 0.08); ctx.fillStyle = '#222'; ctx.fillRect(x + 0.1, y, 0.08, 0.5); ctx.fillRect(x + 1.4, y, 0.08, 0.5); break;
    case 'cone': ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.moveTo(x - 0.2, y); ctx.lineTo(x + 0.2, y); ctx.lineTo(x + 0.04, y + 0.6); ctx.lineTo(x - 0.04, y + 0.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 0.12, y + 0.25, 0.24, 0.08); break;
    case 'cactus':
      ctx.fillStyle = '#3f7a3a'; ctx.strokeStyle = '#3f7a3a'; ctx.lineCap = 'round';
      ctx.lineWidth = 0.32 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 2.6 * s); ctx.stroke();
      ctx.lineWidth = 0.22 * s; ctx.beginPath(); ctx.moveTo(x, y + 1.1 * s); ctx.lineTo(x - 0.5 * s, y + 1.1 * s); ctx.lineTo(x - 0.5 * s, y + 1.9 * s); ctx.moveTo(x, y + 1.5 * s); ctx.lineTo(x + 0.45 * s, y + 1.5 * s); ctx.lineTo(x + 0.45 * s, y + 2.2 * s); ctx.stroke();
      break;
    case 'rock': ctx.fillStyle = theme === 'desert' ? '#8e5534' : '#6b6f74'; ctx.beginPath(); ctx.moveTo(x - 0.8 * s, y - 0.1); ctx.lineTo(x - 0.5 * s, y + 0.6 * s); ctx.lineTo(x + 0.2 * s, y + 0.8 * s); ctx.lineTo(x + 0.8 * s, y + 0.3 * s); ctx.lineTo(x + 0.9 * s, y - 0.1); ctx.closePath(); ctx.fill(); break;
    case 'skull': ctx.fillStyle = '#e9e1cf'; ctx.beginPath(); ctx.ellipse(x, y + 0.15, 0.4, 0.15, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + 0.25, y + 0.1, 0.35, 0.06); break;
    case 'barrel': ctx.fillStyle = '#2f5aa0'; ctx.fillRect(x - 0.3, y, 0.6, 0.9); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 0.3, y + 0.25, 0.6, 0.05); ctx.fillRect(x - 0.3, y + 0.6, 0.6, 0.05); break;
    case 'crate': ctx.fillStyle = '#8a6237'; ctx.fillRect(x - 0.5, y, 1, 1); ctx.strokeStyle = '#5a3d20'; ctx.lineWidth = 0.06; ctx.strokeRect(x - 0.45, y + 0.05, 0.9, 0.9); ctx.beginPath(); ctx.moveTo(x - 0.45, y + 0.05); ctx.lineTo(x + 0.45, y + 0.95); ctx.stroke(); break;
    case 'pine': ctx.fillStyle = '#4a3326'; ctx.fillRect(x - 0.12, y, 0.24, 1); ctx.fillStyle = '#1f4a2c'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - (1.3 - i * 0.3) * s, y + (0.8 + i * 1.1) * s); ctx.lineTo(x + (1.3 - i * 0.3) * s, y + (0.8 + i * 1.1) * s); ctx.lineTo(x, y + (2.4 + i * 1.1) * s); ctx.closePath(); ctx.fill(); } break;
    case 'sign': ctx.fillStyle = '#555'; ctx.fillRect(x - 0.05, y, 0.1, 1.8); ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.moveTo(x, y + 2.3); ctx.lineTo(x + 0.45, y + 1.85); ctx.lineTo(x, y + 1.4); ctx.lineTo(x - 0.45, y + 1.85); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillRect(x - 0.05, y + 1.65, 0.1, 0.4); break;
  }
}

function drawFlag(ctx, x, y, col, time, label) {
  ctx.fillStyle = '#ddd'; ctx.fillRect(x - 0.05, y, 0.1, 3);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 0.05, y + 3);
  for (let i = 0; i <= 6; i++) ctx.lineTo(x + 0.05 + i * 0.2, y + 3 - Math.sin(time * 6 + i) * 0.06);
  ctx.lineTo(x + 1.25, y + 2.3); for (let i = 6; i >= 0; i--) ctx.lineTo(x + 0.05 + i * 0.2, y + 2.3 - Math.sin(time * 6 + i) * 0.06);
  ctx.closePath(); ctx.fill();
  if (label) textW(ctx, label, x + 0.65, y + 3.35, 0.35, '#fff');
}
function drawFinish(ctx, x, y) {
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x - 3.2, y, 0.25, 5); ctx.fillRect(x + 2.95, y, 0.25, 5);
  for (let i = 0; i < 24; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = (i + j) % 2 ? '#111' : '#fff'; ctx.fillRect(x - 3 + i * 0.25, y + 4.2 + j * 0.25, 0.25, 0.25); }
  textW(ctx, 'ФИНИШ', x, y + 5.3, 0.6, '#ffcc00');
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#111' : '#fff'; ctx.fillRect(x - 0.1, y + 0.02 + i * 0.0, 0.2, 0.01); }
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 0.1, y - 0.25 + 0.0, 0.2, 0.25);
}
