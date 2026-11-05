// Данные игры: мотоциклы, трассы, тюнинг, сохранение
'use strict';

const RIDER_MASS = 75;

// Все мотоциклы — собственные выдуманные модели. Единицы: метры, кг, Н·м, об/мин.
// com — центр масс (байк + райдер) от оси заднего колеса, y вверх.
// gears — полное передаточное (коленвал → колесо).
const BIKES = [
  {
    id: 'pika', name: 'Pika 125', cls: 'Питбайк', price: 0, style: 'pit',
    desc: 'Маленький, лёгкий и бесстрашный. Для первого вилли — идеально.',
    wb: 1.15, rr: 0.27, rf: 0.30, mass: 72, com: [0.50, 0.46], gyr: 0.46,
    torque: 20, peak: 7000, redline: 9500, idle: 1500, curve: 0.3, cyl: 1,
    gears: [31, 21, 15.5, 11.6, 8.4],
    brakeF: 700, brakeR: 380, travelF: 0.16, travelR: 0.15, rake: 26, forkLen: 0.62,
    grip: 1.0, lean: 1.0, sound: 'single',
    paint: '#ff7a1a', paint2: '#ffffff', rim: '#222222'
  },
  {
    id: 'mako', name: 'Mako 300 ENR', cls: 'Эндуро', price: 1500, style: 'enduro',
    desc: 'Длинная подвеска глотает кочки и прыжки. Любит грязь.',
    wb: 1.48, rr: 0.33, rf: 0.35, mass: 104, com: [0.66, 0.52], gyr: 0.5,
    torque: 30, peak: 8500, redline: 10500, idle: 1600, curve: 0.4, cyl: 1,
    gears: [24, 17.5, 13.5, 11, 9.3, 8],
    brakeF: 1100, brakeR: 520, travelF: 0.30, travelR: 0.30, rake: 27, forkLen: 0.85,
    grip: 1.08, lean: 1.05, sound: 'single',
    paint: '#1fb6ff', paint2: '#ffffff', rim: '#1a1a1a'
  },
  {
    id: 'kestrel', name: 'Kestrel 450 SM', cls: 'Супермото', price: 3000, style: 'sm',
    desc: 'Лёгкий, резкий, с бешеным низом. Король ровной вилли.',
    wb: 1.47, rr: 0.30, rf: 0.30, mass: 114, com: [0.65, 0.50], gyr: 0.5,
    torque: 45, peak: 8000, redline: 11000, idle: 1700, curve: 0.35, cyl: 1,
    gears: [20.9, 15.6, 12.4, 10.0, 8.3, 7.0],
    brakeF: 1500, brakeR: 600, travelF: 0.24, travelR: 0.25, rake: 26, forkLen: 0.8,
    grip: 1.05, lean: 1.0, sound: 'single',
    paint: '#e8ff2a', paint2: '#1b1b1b', rim: '#ff2a6d'
  },
  {
    id: 'strix', name: 'Strix 600 RS', cls: 'Спорт', price: 5000, style: 'sport',
    desc: 'Рядная четвёрка до 14 500 об/мин. Поднимется на высоких оборотах.',
    wb: 1.39, rr: 0.31, rf: 0.30, mass: 182, com: [0.66, 0.42], gyr: 0.52,
    torque: 66, peak: 11500, redline: 14500, idle: 1300, curve: 0.62, cyl: 4,
    gears: [14.3, 10.7, 8.8, 7.7, 6.9, 6.3],
    brakeF: 1800, brakeR: 460, travelF: 0.12, travelR: 0.13, rake: 24, forkLen: 0.72,
    grip: 1.1, lean: 1.0, sound: 'inline4',
    paint: '#d71f2b', paint2: '#f2f2f2', rim: '#111111'
  },
  {
    id: 'bison', name: 'Bison 1200', cls: 'Чоппер', price: 7000, style: 'chopper',
    desc: 'Тяжёлый V-твин с горой крутящего момента. Вилли — только для мастеров.',
    wb: 1.72, rr: 0.33, rf: 0.34, mass: 288, com: [0.66, 0.46], gyr: 0.6,
    torque: 130, peak: 4300, redline: 6000, idle: 900, curve: 0.22, cyl: 2,
    gears: [10.5, 7.4, 5.6, 4.6, 3.9],
    brakeF: 1500, brakeR: 800, travelF: 0.12, travelR: 0.09, rake: 34, forkLen: 0.95,
    grip: 1.45, lean: 0.85, sound: 'vtwin',
    paint: '#141414', paint2: '#c9a24a', rim: '#d8d8d8'
  },
  {
    id: 'volt', name: 'Volt X-90', cls: 'Электро', price: 9000, style: 'electric',
    desc: 'Мгновенный момент с нуля и одна передача. Тихий, но злой.',
    wb: 1.30, rr: 0.29, rf: 0.29, mass: 110, com: [0.6, 0.47], gyr: 0.48,
    torque: 72, peak: 5000, redline: 12000, idle: 0, curve: 0, cyl: 0, electric: true,
    gears: [9.2],
    brakeF: 1300, brakeR: 600, travelF: 0.2, travelR: 0.2, rake: 25, forkLen: 0.72,
    grip: 1.08, lean: 1.05, sound: 'electric',
    paint: '#f4f4f4', paint2: '#13e0c4', rim: '#13e0c4'
  },
  {
    id: 'riot', name: 'Riot 700 ST', cls: 'Стант', price: 8000, style: 'stunt',
    desc: 'Собран для трюков: короткая звезда, ручной задний тормоз и дуга «12 часов».',
    wb: 1.38, rr: 0.31, rf: 0.30, mass: 172, com: [0.62, 0.44], gyr: 0.5,
    torque: 72, peak: 9000, redline: 11500, idle: 1300, curve: 0.38, cyl: 3,
    gears: [16.2, 12.4, 10.1, 8.4, 7.3, 6.5],
    brakeF: 1650, brakeR: 950, travelF: 0.13, travelR: 0.14, rake: 24, forkLen: 0.72,
    grip: 1.12, lean: 1.15, sound: 'triple', scrapeBar: true,
    paint: '#8a2be2', paint2: '#00ffa3', rim: '#00ffa3'
  },
  {
    id: 'tempest', name: 'Tempest 1000 RR', cls: 'Супербайк', price: 15000, style: 'super',
    desc: 'Двести с лишним сил. Поднимет на любой передаче — держись крепче.',
    wb: 1.42, rr: 0.31, rf: 0.30, mass: 196, com: [0.68, 0.42], gyr: 0.53,
    torque: 115, peak: 11000, redline: 14000, idle: 1300, curve: 0.55, cyl: 4,
    gears: [11.5, 8.8, 7.3, 6.4, 5.7, 5.2],
    brakeF: 2100, brakeR: 480, travelF: 0.12, travelR: 0.13, rake: 23.5, forkLen: 0.72,
    grip: 1.15, lean: 1.0, sound: 'inline4',
    paint: '#0b3cff', paint2: '#ffffff', rim: '#ffcc00'
  },
  {
    id: 'gecko', name: 'Gecko 110', cls: 'Мини-байк', price: 400, style: 'pit',
    desc: 'Крошка на 110 кубов. Поднимается от одного взгляда, но едет медленно.',
    wb: 1.0, rr: 0.24, rf: 0.25, mass: 58, com: [0.44, 0.44], gyr: 0.42,
    torque: 13, peak: 8000, redline: 10500, idle: 1800, curve: 0.3, cyl: 1,
    gears: [40, 27, 20, 15.5, 12.5],
    brakeF: 500, brakeR: 320, travelF: 0.12, travelR: 0.11, rake: 26, forkLen: 0.55,
    grip: 1.0, lean: 1.1, sound: 'single',
    paint: '#33d17a', paint2: '#141414', rim: '#ffd400'
  },
  {
    id: 'wasp', name: 'Wasp 250 SM', cls: 'Супермото', price: 1200, style: 'sm',
    desc: 'Лёгкий злой сингл. Лучший байк, чтобы научиться держать баланс.',
    wb: 1.42, rr: 0.29, rf: 0.29, mass: 108, com: [0.62, 0.5], gyr: 0.48,
    torque: 28, peak: 9000, redline: 12000, idle: 1700, curve: 0.3, cyl: 1,
    gears: [24, 17.5, 13.8, 11.4, 9.6, 8.3],
    brakeF: 1200, brakeR: 600, travelF: 0.22, travelR: 0.23, rake: 26, forkLen: 0.78,
    grip: 1.05, lean: 1.1, sound: 'single',
    paint: '#ffd400', paint2: '#141414', rim: '#141414'
  },
  {
    id: 'lynx', name: 'Lynx 450 MX', cls: 'Кросс', price: 2500, style: 'enduro',
    desc: 'Кроссовый болид: жёсткий удар мотора и длинный ход подвески.',
    wb: 1.48, rr: 0.33, rf: 0.36, mass: 106, com: [0.66, 0.54], gyr: 0.5,
    torque: 50, peak: 9500, redline: 12500, idle: 1900, curve: 0.3, cyl: 1,
    gears: [22, 16.5, 13.3, 11, 9.2],
    brakeF: 1150, brakeR: 600, travelF: 0.31, travelR: 0.32, rake: 27, forkLen: 0.88,
    grip: 1.1, lean: 1.1, sound: 'single',
    paint: '#ff5a1a', paint2: '#ffffff', rim: '#141414'
  },
  {
    id: 'mamba', name: 'Mamba 800 SF', cls: 'Стритфайтер', price: 6000, style: 'stunt', noCage: true,
    desc: 'Голый трёхцилиндровый стритфайтер. Тянет с самого низа и любит заднее колесо.',
    wb: 1.40, rr: 0.31, rf: 0.30, mass: 178, com: [0.63, 0.44], gyr: 0.5,
    torque: 86, peak: 9000, redline: 11500, idle: 1300, curve: 0.3, cyl: 3,
    gears: [14.5, 11, 9.1, 7.8, 6.9, 6.2],
    brakeF: 1800, brakeR: 700, travelF: 0.13, travelR: 0.14, rake: 24, forkLen: 0.72,
    grip: 1.12, lean: 1.1, sound: 'triple',
    paint: '#141414', paint2: '#ff2a6d', rim: '#ff2a6d'
  },
  {
    id: 'titan', name: 'Titan 1300 R', cls: 'Гипернейкед', price: 12000, style: 'stunt', noCage: true,
    desc: 'Голый V-твин с диким моментом. Вилли на третьей передаче — норма.',
    wb: 1.47, rr: 0.31, rf: 0.30, mass: 200, com: [0.66, 0.44], gyr: 0.52,
    torque: 140, peak: 8000, redline: 10500, idle: 1200, curve: 0.25, cyl: 2,
    gears: [11.5, 8.6, 7.0, 6.0, 5.3, 4.8],
    brakeF: 2100, brakeR: 650, travelF: 0.13, travelR: 0.14, rake: 24.5, forkLen: 0.74,
    grip: 1.15, lean: 1.05, sound: 'vtwin',
    paint: '#ff7a1a', paint2: '#141414', rim: '#ff7a1a'
  },
  {
    id: 'bastion', name: 'Bastion 1800', cls: 'Пауэр-круизер', price: 10000, style: 'chopper',
    desc: 'Огромный V-твин с басом, от которого дрожат стёкла. Тяжёлый, но злой.',
    wb: 1.70, rr: 0.33, rf: 0.33, mass: 300, com: [0.66, 0.44], gyr: 0.6,
    torque: 165, peak: 4500, redline: 6800, idle: 850, curve: 0.18, cyl: 2,
    gears: [9.6, 6.8, 5.3, 4.4, 3.8, 3.4],
    brakeF: 1800, brakeR: 900, travelF: 0.12, travelR: 0.10, rake: 32, forkLen: 0.92,
    grip: 1.45, lean: 0.95, sound: 'vtwin',
    paint: '#3a0d0d', paint2: '#c9a24a', rim: '#141414'
  },
  {
    id: 'spark', name: 'Spark E-Pit', cls: 'Электро-питбайк', price: 3500, style: 'electric',
    desc: 'Маленький электрический хулиган: тишина и мгновенный удар момента.',
    wb: 1.12, rr: 0.26, rf: 0.27, mass: 62, com: [0.48, 0.45], gyr: 0.43,
    torque: 55, peak: 4000, redline: 9000, idle: 0, curve: 0, cyl: 0, electric: true,
    gears: [11],
    brakeF: 650, brakeR: 400, travelF: 0.16, travelR: 0.15, rake: 26, forkLen: 0.62,
    grip: 1.05, lean: 1.1, sound: 'electric',
    paint: '#13e0c4', paint2: '#141414', rim: '#ffffff'
  }
];

BIKES.sort((a, b) => a.price - b.price);

const UPGRADES = [
  { id: 'engine', name: 'Двигатель', hint: '+7% момента за уровень' },
  { id: 'brakes', name: 'Тормоза', hint: '+12% силы торможения' },
  { id: 'susp', name: 'Подвеска', hint: 'мягче приземления, больше хода' },
  { id: 'tires', name: 'Резина', hint: '+5% сцепления' }
];
const UPG_MAX = 5;
function upgradeCost(bike, lvl) { return Math.round((300 + bike.price * 0.12) * (lvl + 1) / 50) * 50; }

const EXHAUSTS = [
  { id: 'stock', name: 'Сток', price: 0, power: 0, loud: 0 },
  { id: 'slip', name: 'Слип-он', price: 400, power: 0.03, loud: 0.25 },
  { id: 'under', name: 'Двойной под сиденьем', price: 800, power: 0.04, loud: 0.4 },
  { id: 'straight', name: 'Прямоток', price: 1500, power: 0.06, loud: 0.8 }
];

const DECALS = [
  { id: 'none', name: 'Без наклеек' },
  { id: 'stripes', name: 'Гоночные полосы' },
  { id: 'flames', name: 'Пламя' },
  { id: 'number', name: 'Номер' },
  { id: 'bolt', name: 'Молния' },
  { id: 'checker', name: 'Шахматка' },
  { id: 'tribal', name: 'Узор' }
];

const HELMETS = [
  { id: 'solid', name: 'Однотонный' },
  { id: 'stripe', name: 'Полоса' },
  { id: 'split', name: 'Два цвета' },
  { id: 'star', name: 'Звезда' }
];

const PALETTE = ['#d71f2b', '#ff7a1a', '#ffd400', '#e8ff2a', '#33d17a', '#00ffa3', '#13e0c4', '#1fb6ff',
  '#0b3cff', '#8a2be2', '#ff2a6d', '#f4f4f4', '#9aa0a6', '#141414', '#c9a24a', '#6b3e1f'];
const VISORS = ['#1c2733', '#ffb300', '#3fa9ff', '#c0c0c0', '#ff3b7a'];

// Трассы: тема фона, сцепление покрытия, длина и набор препятствий
const TRACKS = [
  { id: 'embank', name: 'Набережная', theme: 'sunset', mu: 1.1, len: 1100, seed: 11, music: 'ride1',
    desc: 'Закат и идеально ровный асфальт. Здесь ставят рекорды вилли.',
    mix: { flat: 1 } },
  { id: 'canyon', name: 'Красный каньон', theme: 'desert', mu: 0.85, len: 1300, seed: 23, music: 'ride2',
    desc: 'Ровный укатанный грунт. Резина буксует — газ плавно!',
    mix: { flat: 1 } },
  { id: 'port', name: 'Ночной порт', theme: 'night', mu: 1.0, len: 1200, seed: 37, music: 'ride3',
    desc: 'Ночь, фонари и ровный асфальт вдоль причала.',
    mix: { flat: 1 } },
  { id: 'pass', name: 'Горный перевал', theme: 'mountain', mu: 0.95, len: 1500, seed: 51, music: 'ride4',
    desc: 'Длинная ровная дорога среди сосен. Марафон на заднем колесе.',
    mix: { flat: 1 } }
];

const CREDITS = [
  ['Меню', 'Luxury Music', 'vaitsez', 'https://pixabay.com/music/trap-luxury-luxury-music-570110/'],
  ['Набережная', 'Brazilian Phonk Bounce Heat', 'alex-morgan', 'https://pixabay.com/music/phonk-brazilian-phonk-bounce-heat-573874/'],
  ['Красный каньон', 'West Coast Trap Beat', 'SountrixAudio', 'https://pixabay.com/music/beats-west-coast-trap-beat-434659/'],
  ['Ночной порт', 'Trap Hype', 'SolarFLEX', 'https://pixabay.com/music/trap-trap-trap-hype-589000/'],
  ['Горный перевал', 'Aggressive Trap Beat', 'vaitsez', 'https://pixabay.com/music/trap-aggressive-trap-beat-607373/']
];

// ---------- Сохранение ----------
const SAVE_KEY = 'motostunt-v1';
function defaultSave() {
  const bikes = {};
  for (const b of BIKES) bikes[b.id] = {
    owned: b.price === 0, upg: { engine: 0, brakes: 0, susp: 0, tires: 0 },
    paint: b.paint, paint2: b.paint2, rim: b.rim, decal: b.id === 'riot' ? 'tribal' : 'stripes', exhaust: 'stock', exhOwned: ['stock']
  };
  return {
    coins: 600, bike: 'pika', bikes,
    rider: { helmet: '#f4f4f4', helmet2: '#d71f2b', hstyle: 'stripe', visor: '#1c2733', jacket: '#b3261e', pants: '#1d2433' },
    best: {}, bestWheelie: 0, bestWheelieDist: 0, totalRuns: 0,
    settings: { music: 0.35, sfx: 0.9, manual: false, hints: true, test: false, assist: true }
  };
}
let SAVE = loadSave();
function loadSave() {
  const d = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    const out = Object.assign(d, s);
    out.settings = Object.assign(defaultSave().settings, s.settings || {});
    out.rider = Object.assign(defaultSave().rider, s.rider || {});
    for (const b of BIKES) {
      const def = defaultSave().bikes[b.id];
      out.bikes[b.id] = Object.assign(def, (s.bikes || {})[b.id] || {});
      out.bikes[b.id].upg = Object.assign(def.upg, ((s.bikes || {})[b.id] || {}).upg || {});
    }
    if (!out.bikes[out.bike] || (!out.bikes[out.bike].owned && !out.settings.test)) out.bike = 'pika';
    return out;
  } catch (e) { return d; }
}
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }
function bikeById(id) { return BIKES.find(b => b.id === id) || BIKES[0]; }
function trackById(id) { return TRACKS.find(t => t.id === id) || TRACKS[0]; }
