// Interactive demo: a made-up network of spore-trap devices around Australia.
// Pick a device, and a pretend "AI" sweeps its microscope slide, boxes every particle,
// counts the disease spores and turns that into an alert. Everything here is illustrative:
// the devices, slides, counts and confidence scores are generated, not real data.

const W = 480, H = 320;          // microscope image size (matches the SVG viewBox)
const HIGH = 12, WATCH = 5;      // spores on today's slide that trigger each alert level

const KINDS = {
  rust:     { label: 'Stripe rust', note: 'Wheat disease',  disease: true,  color: '#c0574a' },
  sclero:   { label: 'Sclerotinia', note: 'Canola disease', disease: true,  color: '#c0574a' },
  blackleg: { label: 'Blackleg',    note: 'Canola disease', disease: true,  color: '#c0574a' },
  pollen:   { label: 'Pollen',      note: 'Not a disease',  disease: false, color: '#2f6b54' },
  dust:     { label: 'Dust',        note: 'Ignored',        disease: false, color: '#7d847b' },
};

// history = the main disease's count for the six days before today
const DEVICES = [
  { id: 'wa-n',   name: 'Northern Wheatbelt', state: 'WA',  lon: 115.9, lat: -29.7, crop: 'Wheat',  counts: { rust: 3, pollen: 4, dust: 6 },                history: [1, 1, 2, 2, 3, 2] },
  { id: 'wa-s',   name: 'Southern Wheatbelt', state: 'WA',  lon: 118.6, lat: -33.0, crop: 'Canola', counts: { sclero: 7, blackleg: 2, pollen: 3, dust: 5 },  history: [2, 3, 3, 5, 4, 6] },
  { id: 'wa-e',   name: 'Esperance',          state: 'WA',  lon: 121.8, lat: -33.5, crop: 'Canola', counts: { blackleg: 13, pollen: 2, dust: 4 },           history: [4, 6, 7, 9, 10, 12] },
  { id: 'sa-ep',  name: 'Eyre Peninsula',     state: 'SA',  lon: 135.7, lat: -33.4, crop: 'Wheat',  counts: { rust: 1, pollen: 2, dust: 9 },                history: [0, 1, 0, 1, 2, 1] },
  { id: 'sa-mn',  name: 'Mid North',          state: 'SA',  lon: 138.7, lat: -33.7, crop: 'Wheat',  counts: { rust: 8, pollen: 3, dust: 5 },                history: [3, 3, 4, 6, 5, 7] },
  { id: 'vic-w',  name: 'Wimmera',            state: 'VIC', lon: 142.3, lat: -36.5, crop: 'Wheat',  counts: { rust: 14, pollen: 3, dust: 5 },               history: [3, 4, 6, 8, 11, 12] },
  { id: 'nsw-r',  name: 'Riverina',           state: 'NSW', lon: 147.0, lat: -34.9, crop: 'Canola', counts: { sclero: 15, blackleg: 3, pollen: 4, dust: 4 }, history: [5, 6, 8, 11, 12, 13] },
  { id: 'nsw-cw', name: 'Central West',       state: 'NSW', lon: 148.4, lat: -32.6, crop: 'Canola', counts: { sclero: 6, pollen: 5, dust: 6 },              history: [2, 2, 3, 4, 5, 5] },
  { id: 'nsw-m',  name: 'Moree',              state: 'NSW', lon: 149.8, lat: -29.5, crop: 'Wheat',  counts: { rust: 2, pollen: 6, dust: 7 },                history: [1, 2, 1, 1, 2, 3] },
  { id: 'qld-dd', name: 'Darling Downs',      state: 'QLD', lon: 151.3, lat: -27.4, crop: 'Wheat',  counts: { rust: 6, pollen: 4, dust: 6 },                history: [1, 2, 3, 3, 4, 5] },
  { id: 'tas-n',  name: 'Northern Tasmania',  state: 'TAS', lon: 146.9, lat: -41.5, crop: 'Wheat',  counts: { rust: 0, pollen: 7, dust: 3 },                history: [0, 0, 1, 0, 0, 0] },
];
const DEFAULT_DEVICE = 'vic-w';

// Same simple projection used to draw the map outline (viewBox 372 x 343).
const MAP_W = 372, MAP_H = 343, MAP_K = 10 * Math.cos((27 * Math.PI) / 180);
const project = (lon, lat) => [((lon - 112.5) * MAP_K) / MAP_W * 100, ((-lat - 10) * 10) / MAP_H * 100];

const $ = (sel) => document.querySelector(sel);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const RISK_LABEL = { high: 'High', watch: 'Watch', low: 'All clear' };

function mainDisease(d) {
  let best = null;
  Object.entries(d.counts).forEach(([k, n]) => { if (KINDS[k].disease && (!best || n > best.count)) best = { kind: k, count: n }; });
  return best;
}
const levelFor = (n) => (n >= HIGH ? 'high' : n >= WATCH ? 'watch' : 'low');
const riskOf = (d) => levelFor(mainDisease(d).count);

// Small seeded random number generator, so each device's slide looks the same every time.
function seeded(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Drawing particles ----------
// Each returns: r (spacing radius), hw/hh (half width/height of the AI box), draw(x, y) -> SVG.
const f = (n) => Math.round(n * 10) / 10;
function makeParticle(kind, rnd) {
  const a = Math.round(rnd() * 180), rad = (a * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
  if (kind === 'rust') {
    const r = 8.5 + rnd() * 2.5;
    return { r: r + 6, hw: r + 3, hh: r + 3, draw: (x, y) => `<g transform="translate(${f(x)} ${f(y)})"><circle r="${f(r + 1.6)}" fill="none" stroke="#b5701e" stroke-width="1.8" stroke-dasharray="0.9 2.1" opacity=".75"/><circle r="${f(r)}" fill="#e9a640" stroke="#b5701e" stroke-width="1.1"/><circle cx="${f(-r * 0.3)}" cy="${f(-r * 0.3)}" r="${f(r * 0.38)}" fill="#f6d189" opacity=".75"/></g>` };
  }
  if (kind === 'sclero') {
    const rx = 6.5 + rnd(), ry = 3.6 + rnd() * 0.6;
    const hw = Math.hypot(rx * cos, ry * sin) + 3, hh = Math.hypot(rx * sin, ry * cos) + 3;
    return { r: rx + 6, hw, hh, draw: (x, y) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})"><ellipse rx="${f(rx)}" ry="${f(ry)}" fill="#dfe6d6" stroke="#6b7c62"/><ellipse cx="${f(-rx * 0.35)}" rx="${f(rx * 0.24)}" ry="${f(ry * 0.45)}" fill="#f6f8f1"/><ellipse cx="${f(rx * 0.35)}" rx="${f(rx * 0.24)}" ry="${f(ry * 0.45)}" fill="#f6f8f1"/></g>` };
  }
  if (kind === 'blackleg') {
    const L = 26 + rnd() * 6, T = 6;
    const hw = (L * cos + T * sin) / 2 + 3, hh = (L * sin + T * cos) / 2 + 3;
    const septa = [1, 2, 3, 4, 5].map((i) => { const sx = f(-L / 2 + (i * L) / 6); return `<line x1="${sx}" x2="${sx}" y1="${-T / 2}" y2="${T / 2}"/>`; }).join('');
    return { r: L / 2 + 4, hw, hh, draw: (x, y) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})"><rect x="${f(-L / 2)}" y="${-T / 2}" width="${f(L)}" height="${T}" rx="${T / 2}" fill="#d2b77f" stroke="#8a6a33"/><g stroke="#8a6a33" stroke-width=".9">${septa}</g></g>` };
  }
  if (kind === 'pollen') {
    const r = 11 + rnd() * 2.5;
    const dots = Array.from({ length: 7 }, () => { const ang = rnd() * Math.PI * 2, d = rnd() * r * 0.6; return `<circle cx="${f(Math.cos(ang) * d)}" cy="${f(Math.sin(ang) * d)}" r="1.3"/>`; }).join('');
    const pores = [0, 120, 240].map((deg) => { const p = ((deg + a) * Math.PI) / 180; return `<circle cx="${f(Math.cos(p) * (r - 1))}" cy="${f(Math.sin(p) * (r - 1))}" r="1.7" fill="#fff8e0" stroke="#c3a95e"/>`; }).join('');
    return { r: r + 6, hw: r + 3, hh: r + 3, draw: (x, y) => `<g transform="translate(${f(x)} ${f(y)})"><circle r="${f(r)}" fill="#f3e7bd" stroke="#c3a95e" stroke-width="1.4"/><circle r="${f(r - 2.6)}" fill="none" stroke="#e5d49b"/><g fill="#d6bf7a">${dots}</g>${pores}</g>` };
  }
  // dust: an irregular dark fleck
  const pts = Array.from({ length: 6 }, (_, i) => { const p = ((i * 60 + rnd() * 25) * Math.PI) / 180, d = 3 + rnd() * 4; return [Math.cos(p) * d, Math.sin(p) * d]; });
  const ext = Math.max(...pts.map(([px, py]) => Math.max(Math.abs(px), Math.abs(py))));
  return { r: 10, hw: ext + 3, hh: ext + 3, draw: (x, y) => `<polygon points="${pts.map(([px, py]) => `${f(x + px)},${f(y + py)}`).join(' ')}" fill="#5e594f" opacity=".6"/>` };
}

function layoutSlide(device) {
  const rnd = seeded(device.id);
  const kinds = Object.entries(device.counts).flatMap(([k, n]) => Array(n).fill(k));
  const items = [];
  kinds.forEach((kind) => {
    const p = makeParticle(kind, rnd);
    let x = 0, y = 0;
    for (let t = 0; t < 400; t++) {
      x = 26 + rnd() * (W - 52);
      y = 26 + rnd() * (H - 52);
      const clear = items.every((o) => Math.hypot(o.x - x, o.y - y) > o.r + p.r);
      const offScaleBar = !(x > 372 && y > 266);
      if (clear && offScaleBar) break;
    }
    items.push({ kind, x, y, ...p, conf: 88 + Math.floor(rnd() * 12) });
  });
  const specks = Array.from({ length: 80 }, () => `<circle cx="${f(rnd() * W)}" cy="${f(rnd() * H)}" r="${f(0.5 + rnd() * 1.1)}" opacity="${f(0.15 + rnd() * 0.3)}"/>`).join('');
  const fibres = Array.from({ length: 3 }, () => { const y1 = rnd() * H, y2 = y1 + (rnd() - 0.5) * 60; return `<path d="M-10 ${f(y1)} Q ${f(W / 2)} ${f((y1 + y2) / 2 + (rnd() - 0.5) * 40)} ${W + 10} ${f(y2)}"/>`; }).join('');
  return { items, background: `<g fill="none" stroke="#c4cbb6" stroke-width="1.2" opacity=".5">${fibres}</g><g fill="#6b6a5e">${specks}</g>` };
}

// Overlap area of two {x, y, w, h} rectangles, with a 1px gap so labels don't touch.
const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + 1) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + 1);

// placed: labels already drawn on this slide. A label goes above or below its box, left or
// right aligned, wherever it doesn't cover another label. If there's no room, the box goes unlabelled.
function boxSvg(it, placed) {
  const k = KINDS[it.kind];
  const bx = it.x - it.hw, by = it.y - it.hh, bw = it.hw * 2, bh = it.hh * 2;
  const x = f(bx), y = f(by), w = f(bw), h = f(bh);
  let label = '';
  if (it.kind !== 'dust') {
    const text = k.disease ? `${k.label} ${it.conf}%` : k.label;
    const lw = Math.round(text.length * 5.4 + 8), lh = 13;
    const clampX = (v) => Math.min(Math.max(2, v), W - lw - 2), clampY = (v) => Math.min(Math.max(2, v), H - lh - 2);
    const spot = [[bx, by - lh], [bx, by + bh], [bx + bw - lw, by - lh], [bx + bw - lw, by + bh]]
      .map(([lx, ly]) => ({ x: clampX(lx), y: clampY(ly), w: lw, h: lh }))
      .find((c) => placed.every((p) => overlap(c, p) === 0));
    if (spot) {
      placed.push(spot);
      label = `<rect x="${f(spot.x)}" y="${f(spot.y)}" width="${lw}" height="${lh}" rx="2" fill="${k.color}"/><text x="${f(spot.x + 4)}" y="${f(spot.y + 9.5)}">${text}</text>`;
    }
  }
  const dash = it.kind === 'dust' ? ' stroke-dasharray="3 2"' : '';
  return `<g class="bs-box" data-kind="${it.kind}" data-x="${f(it.x)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="${k.color}" stroke-width="1.6"${dash}/>${label}</g>`;
}

// ---------- Results ----------
function renderCounts(device, tally) {
  const order = Object.keys(device.counts).sort((a, b) => Number(KINDS[b].disease) - Number(KINDS[a].disease));
  $('#bs-counts tbody').innerHTML = order.map((k) => `<tr><td><span class="bs-kind" style="--kind:${KINDS[k].color}"><i></i>${KINDS[k].label}</span></td><td>${KINDS[k].note}</td><td>${tally[k] || 0}</td></tr>`).join('');
}

function renderAlert(device) {
  const main = mainDisease(device), lvl = levelFor(main.count), label = KINDS[main.kind].label;
  const msg = lvl === 'high' ? `${label} spores are well up. Time to check the crop and give the agronomist a call.`
    : lvl === 'watch' ? `Some ${label.toLowerCase()} spores about. Worth keeping an eye on this week.`
    : main.count === 0 ? 'No disease spores on today’s slide. Nothing to worry about.'
    : `Only a few ${label.toLowerCase()} spores. Nothing to worry about today.`;
  const el = $('#bs-alert');
  el.dataset.risk = lvl;
  el.innerHTML = `<strong>${RISK_LABEL[lvl]}</strong><span>${msg}</span>`;
  const status = $('#bs-status');
  status.dataset.risk = lvl;
  status.textContent = lvl === 'low' ? 'All clear' : `${RISK_LABEL[lvl]} · ${label}`;
}

function renderChart(device) {
  const main = mainDisease(device);
  const values = [...device.history, main.count];
  const x0 = 38, x1 = 256, yTop = 12, yBase = 94;
  const max = Math.max(HIGH + 4, Math.max(...values) + 3);
  const yOf = (v) => yBase - (v / max) * (yBase - yTop);
  const slot = (x1 - x0) / values.length, bw = Math.min(20, slot - 8);
  const today = new Date();
  const day = (i) => { if (i === values.length - 1) return 'Today'; const d = new Date(today); d.setDate(d.getDate() - (values.length - 1 - i)); return d.toLocaleDateString('en-AU', { weekday: 'short' }); };
  const line = (v, txt) => `<line x1="${x0}" x2="${x1}" y1="${f(yOf(v))}" y2="${f(yOf(v))}" stroke="${v === HIGH ? '#c0574a' : '#e0a526'}" stroke-dasharray="3 3" stroke-width="1"/><text x="0" y="${f(yOf(v) + 3)}">${txt}</text>`;
  const bars = values.map((v, i) => {
    const cx = x0 + slot * i + slot / 2, y = yOf(v), lvl = levelFor(v);
    const fill = { high: '#c0574a', watch: '#e0a526', low: '#4f8a6a' }[lvl];
    return `<rect x="${f(cx - bw / 2)}" y="${f(y)}" width="${f(bw)}" height="${f(Math.max(0, yBase - y))}" rx="2" fill="${fill}"${i === values.length - 1 ? '' : ' opacity=".55"'}/><text class="bs-chart-val" x="${f(cx)}" y="${f(y - 4)}" text-anchor="middle">${v}</text><text x="${f(cx)}" y="110" text-anchor="middle">${day(i)}</text>`;
  }).join('');
  $('#bs-chart').innerHTML = `${line(HIGH, 'High')}${line(WATCH, 'Watch')}<line x1="${x0}" x2="${x1}" y1="${yBase}" y2="${yBase}" stroke="#dcded5"/>${bars}`;
  $('#bs-chart').setAttribute('aria-label', `${KINDS[main.kind].label} spores over the last seven days: ${values.join(', ')}`);
  $('#bs-chart-title').textContent = `${KINDS[main.kind].label} spores · last 7 days`;
}

// ---------- State ----------
let current = null, rafId = 0, running = false, hasRun = false;

function selectDevice(id, { autorun = false } = {}) {
  cancelAnimationFrame(rafId);
  running = false;
  current = DEVICES.find((d) => d.id === id);
  document.querySelectorAll('.bs-dot').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  $('#bs-device').value = id;
  $('#bs-device-name').textContent = `${current.name}, ${current.state}`;
  $('#bs-device-meta').textContent = `${current.crop} paddock · Today's slide, 6:00am`;

  const slide = layoutSlide(current);
  current.items = slide.items;
  $('#bs-particles').innerHTML = slide.background + slide.items.map((it) => it.draw(it.x, it.y)).join('');
  const placed = [];
  $('#bs-boxes').innerHTML = slide.items.map((it) => boxSvg(it, placed)).join('');
  $('#bs-boxes').classList.remove('is-hidden');
  $('#bs-sweepbar').setAttribute('opacity', '0');
  $('#bs-viewer').classList.remove('is-scanning');

  const status = $('#bs-status');
  delete status.dataset.risk;
  status.textContent = 'Not checked yet';
  $('#bs-results-empty').hidden = false;
  $('#bs-results-body').hidden = true;
  const toggle = $('#bs-show-boxes');
  toggle.checked = true;
  toggle.disabled = true;
  const btn = $('#bs-run');
  btn.disabled = false;
  btn.textContent = 'Run the AI';
  if (autorun) runAI();
}

function runAI() {
  if (running || !current) return;
  running = true;
  hasRun = true;
  const device = current, btn = $('#bs-run');
  btn.disabled = true;
  btn.textContent = 'Checking…';
  $('#bs-show-boxes').checked = true;
  $('#bs-boxes').classList.remove('is-hidden');
  const boxes = [...document.querySelectorAll('#bs-boxes .bs-box')];
  boxes.forEach((b) => b.classList.remove('is-shown'));
  const tally = {};
  renderCounts(device, tally);
  $('#bs-results-empty').hidden = true;
  $('#bs-results-body').hidden = false;
  $('#bs-alert').hidden = true;
  $('.bs-chart').hidden = true;
  const status = $('#bs-status');
  delete status.dataset.risk;
  status.textContent = 'Checking…';

  const finish = () => {
    boxes.forEach((b) => b.classList.add('is-shown'));
    Object.entries(device.counts).forEach(([k, n]) => { tally[k] = n; });
    renderCounts(device, tally);
    $('#bs-sweepbar').setAttribute('opacity', '0');
    $('#bs-viewer').classList.remove('is-scanning');
    renderAlert(device);
    renderChart(device);
    $('#bs-alert').hidden = false;
    $('.bs-chart').hidden = false;
    $('#bs-show-boxes').disabled = false;
    btn.disabled = false;
    btn.textContent = 'Run it again';
    running = false;
  };
  if (reduceMotion) { finish(); return; }

  $('#bs-viewer').classList.add('is-scanning');
  const sweep = $('#bs-sweepbar');
  sweep.setAttribute('opacity', '1');
  const t0 = performance.now(), dur = 1800;
  const frame = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const front = p * (W + 60);
    sweep.setAttribute('x', f(front - 60));
    let changed = false;
    boxes.forEach((b) => {
      if (!b.classList.contains('is-shown') && Number(b.dataset.x) <= front) {
        b.classList.add('is-shown');
        tally[b.dataset.kind] = (tally[b.dataset.kind] || 0) + 1;
        changed = true;
      }
    });
    if (changed) renderCounts(device, tally);
    if (p < 1) rafId = requestAnimationFrame(frame);
    else finish();
  };
  rafId = requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', () => {
  const map = $('#bs-map');
  if (!map) return;

  // Map dots and the dropdown
  DEVICES.forEach((d) => {
    const [left, top] = project(d.lon, d.lat);
    const risk = riskOf(d);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bs-dot';
    b.dataset.id = d.id;
    b.dataset.risk = risk;
    b.style.left = `${left}%`;
    b.style.top = `${top}%`;
    b.setAttribute('aria-label', `${d.name}, ${d.state}. ${RISK_LABEL[risk]}.`);
    b.title = `${d.name}, ${d.state}`;
    b.addEventListener('click', () => selectDevice(d.id, { autorun: true }));
    map.appendChild(b);
  });
  $('#bs-device').innerHTML = DEVICES.map((d) => `<option value="${d.id}">${d.name}, ${d.state} · ${d.crop} · ${RISK_LABEL[riskOf(d)]}</option>`).join('');
  $('#bs-device').addEventListener('change', (e) => selectDevice(e.target.value, { autorun: true }));

  const tally = { high: 0, watch: 0, low: 0 };
  DEVICES.forEach((d) => { tally[riskOf(d)] += 1; });
  $('#bs-snapshot').innerHTML = `Today: <b>${tally.high}</b> high · <b>${tally.watch}</b> watch · <b>${tally.low}</b> all clear`;

  $('#bs-run').addEventListener('click', runAI);
  $('#bs-show-boxes').addEventListener('change', (e) => $('#bs-boxes').classList.toggle('is-hidden', !e.target.checked));

  // ?device=<id> opens a particular device (handy for sharing a link to one).
  const wanted = new URLSearchParams(window.location.search).get('device');
  selectDevice(DEVICES.some((d) => d.id === wanted) ? wanted : DEFAULT_DEVICE);

  // Run the AI on its own the first time the slide scrolls into view.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        if (!hasRun) setTimeout(runAI, 300);
      }
    }, { threshold: 0.6 });
    io.observe($('#bs-viewer'));
  }
});
