// Homepage extras: header on scroll, the grass and fireflies, and the "give me a report" AI demo.
// The demo has two examples that take turns: a chat (stocktake from a photo with an Ordermentum reorder,
// then the monthly report) and a diagram of the monthly report. The tabs on the card jump to one.
// Click the Sunday AI logo on the card for demo settings (saved in that browser only).
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Header goes solid once you scroll ----------
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Grass along the front hills ----------
  document.querySelectorAll('g.grass[data-guide]').forEach((grass, n) => {
    let seed = 11 + n * 97;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const guide = document.createElementNS(NS, 'path');
    guide.setAttribute('d', grass.dataset.guide);
    guide.setAttribute('fill', 'none');
    grass.appendChild(guide);
    const total = guide.getTotalLength();
    const groups = ['sway-a', 'sway-b'].map((cls) => { const g = document.createElementNS(NS, 'g'); g.setAttribute('class', cls); grass.appendChild(g); return g; });
    const blades = [[], []];
    const count = Number(grass.dataset.count) || 300;
    for (let i = 0; i < count; i++) {
      const p = guide.getPointAtLength(total * (i + rnd() * 0.8) / count);
      const h = 8 + rnd() * 26, lean = (rnd() - 0.5) * 12, w = 2.2 + rnd() * 2.2;
      const x = p.x, y = p.y + 3;
      blades[i % 2].push(`M${(x - w / 2).toFixed(1)} ${y.toFixed(1)}Q${(x + lean * 0.3).toFixed(1)} ${(y - h * 0.55).toFixed(1)} ${(x + lean).toFixed(1)} ${(y - h).toFixed(1)}Q${(x + lean * 0.25 + w * 0.3).toFixed(1)} ${(y - h * 0.45).toFixed(1)} ${(x + w / 2).toFixed(1)} ${y.toFixed(1)}Z`);
    }
    blades.forEach((d, i) => { const path = document.createElementNS(NS, 'path'); path.setAttribute('d', d.join('')); groups[i].appendChild(path); });
    guide.remove();
  });

  // ---------- Fireflies ----------
  const flies = $('#fireflies');
  if (flies && !reduceMotion) {
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('span');
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${48 + Math.random() * 44}%`;
      s.style.setProperty('--d', `${7 + Math.random() * 7}s`);
      s.style.setProperty('--delay', `${-Math.random() * 12}s`);
      s.style.setProperty('--dx', `${(Math.random() - 0.5) * 80}px`);
      s.style.setProperty('--dy', `${-20 - Math.random() * 50}px`);
      flies.appendChild(s);
    }
  }

  // =====================================================================
  //  AI report demo
  // =====================================================================
  const demo = $('#ai-demo');
  if (!demo) return;
  const win = $('.ai-window', demo), body = $('#ai-body'), status = $('#ai-status');

  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ---- Demo settings (editable by clicking the Sunday AI logo on the card; see openSettings) ----
  const SETTINGS_KEY = 'ss-demo-settings';
  const DEFAULTS = {
    startWith: 'chat',            // which example plays first: 'chat' or 'flow' (the diagram)
    chatFirst: 'stock',           // in the chat, do the stocktake or the report first: 'stock' or 'report'
    stockAsk: 'Count all these boxes and save it to our inventory',
    reportAsk: "Give me this month's report",
    supplier: 'Harbour Wholesale',
    delivery: 'Thursday',
    items: [{ name: 'Bleach 12 × 1L', qty: 2, price: 19.2 }, { name: 'Sardines in tomato sauce 50 × 155g', qty: 3, price: 47.5 }],
  };
  let S = clone(DEFAULTS);
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      ['startWith', 'chatFirst', 'stockAsk', 'reportAsk', 'supplier', 'delivery'].forEach((k) => { if (typeof saved[k] === 'string' && saved[k]) S[k] = saved[k]; });
      if (Array.isArray(saved.items) && saved.items.length) {
        S.items = saved.items.slice(0, 4).map((it) => ({ name: String(it.name || 'Item'), qty: Math.max(1, Math.min(99, Number(it.qty) || 1)), price: Math.max(0, Number(it.price) || 0) }));
      }
    }
  } catch (e) { /* storage unavailable or bad data: use the defaults */ }
  const MONTH = new Date().toLocaleDateString('en-AU', { month: 'long' });
  const SOURCES = [
    { k: 'gmail', name: 'Gmail', ic: 'i-mail', ask: 'emails since the 1st', got: '38 emails' },
    { k: 'xero', name: 'Xero', ic: 'i-ledger', ask: 'invoices and payments', got: '24 invoices' },
    { k: 'calendar', name: 'Calendar', ic: 'i-calendar', ask: 'meetings', got: '12 meetings' },
    { k: 'sheets', name: 'Sheets', ic: 'i-grid', ask: 'sales tracker', got: 'Sales tracker' },
  ];
  const PEOPLE = [['S', 'Sam', 'Accounts', '#9be58b'], ['A', 'Alex', 'Operations', '#f5ca45'], ['J', 'Jordan', 'Owner', '#8fd3ff']];
  const icon = (id) => `<svg class="icon"><use href="#${id}"/></svg>`;

  // App logos, drawn as small inline SVGs (simplified versions of each brand's mark).
  const LOGOS = {
    gmail: '<svg viewBox="0 0 48 48"><path fill="#34A853" d="M45 16.2l-5 2.75-5 4.75V40h7a3 3 0 0 0 3-3z"/><path fill="#4285F4" d="M3 16.2l3.6 1.7L13 23.7V40H6a3 3 0 0 1-3-3z"/><path fill="#EA4335" d="M35 11.2 24 19.45 13 11.2l-1 5.8 1 6.7 11 8.25 11-8.25 1-6.7z"/><path fill="#C5221F" d="M3 12.3v3.9l10 7.5V11.2L9.9 8.86A4.3 4.3 0 0 0 3 12.3z"/><path fill="#FBBC04" d="M45 12.3v3.9l-10 7.5V11.2l3.1-2.34A4.3 4.3 0 0 1 45 12.3z"/></svg>',
    xero: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#13B5EA"/><text x="24" y="29.4" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="#fff">xero</text></svg>',
    calendar: '<svg viewBox="0 0 48 48"><path fill="#4285F4" d="M10 6h28a4 4 0 0 1 4 4v26h-6v6H10a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/><path fill="#FBBC04" d="M6 12h6v24H6z"/><path fill="#34A853" d="M12 36h24v6H12z"/><path fill="#188038" d="M6 36h6v6h-2a4 4 0 0 1-4-4z"/><path fill="#1967D2" d="M36 6h2a4 4 0 0 1 4 4v2h-6z"/><path fill="#EA4335" d="M36 36h6l-6 6z"/><rect x="12" y="12" width="24" height="24" fill="#fff"/><text x="24" y="30" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13.5" font-weight="700" fill="#4285F4">31</text></svg>',
    sheets: '<svg viewBox="0 0 48 48"><path fill="#0F9D58" d="M37 45H11a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h19l10 10v29a3 3 0 0 1-3 3z"/><path fill="#87CEAC" d="M40 13H30V3z"/><path fill="#0B7A43" d="M30 13l10 10V13z"/><path fill="#F1F8F4" d="M15 23h18v14H15zm2 2v2h4v-2zm6 0v2h8v-2zm-6 4v2h4v-2zm6 0v2h8v-2zm-6 4v2h4v-2zm6 0v2h8v-2z"/></svg>',
  };
  LOGOS.ordermentum = '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19.5" fill="none" stroke="#F26A2B" stroke-width="5"/><path d="M15.5 32V17.5l8.5 8.5 8.5-8.5V32" fill="none" stroke="#F26A2B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const appIcon = (s, cls) => `<span class="${cls} is-logo">${LOGOS[s.k]}</span>`;

  // ---- Shared timing helpers. Bumping `run` cancels whatever is playing. ----
  let run = 0;
  let flowBodyH = 0;   // the diagram's height, so the chat can match it and the card never changes size
  let playing = false;
  const STOP = new Error('stopped');
  const wait = (ms, id) => new Promise((res, rej) => setTimeout(() => (id === run ? res() : rej(STOP)), ms));
  const frames = (ms, id, step) => new Promise((res, rej) => {
    const t0 = performance.now();
    const tick = (now) => {
      if (id !== run) return rej(STOP);
      const p = Math.min(1, (now - t0) / ms);
      step(p, now - t0);
      if (p < 1) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  const setStatus = (state, text) => { status.dataset.state = state; status.querySelector('b').textContent = text; };
  const typeInto = async (el, placeholder, text, id) => {
    placeholder.classList.add('is-hidden');
    for (const ch of text) { el.textContent += ch; el.scrollLeft = el.scrollWidth; await wait(30 + Math.random() * 40, id); }
  };
  const inputHtml = () => `<div class="ai-input"><span class="ai-typed"></span><span class="ai-caret"></span><span class="ai-placeholder">Ask for anything…</span><span class="ai-send">${icon('i-arrow')}</span></div>`;
  const pressSend = async (box, id) => {
    const send = $('.ai-send', box);
    send.classList.add('is-ready');
    await wait(380, id);
    send.classList.add('is-pressed');
    await wait(160, id);
    send.classList.remove('is-pressed', 'is-ready');
    $('.ai-typed', box).textContent = '';
    $('.ai-placeholder', box).classList.remove('is-hidden');
  };

  // =====================================================================
  //  Version 1: Diagram. A live map of Sunday AI talking to each app.
  // =====================================================================
  const flow = (() => {
    // Two layouts: wide for the desktop card, narrow (taller) for phones. Coordinates in px.
    const LAYOUTS = {
      wide: { W: 500, H: 346, core: [250, 110], gmail: [80, 44], xero: [80, 176], calendar: [420, 44], sheets: [420, 176], pdf: [250, 248], print: [98, 316], email: [402, 316] },
      narrow: { W: 340, H: 440, core: [170, 146], gmail: [62, 62], xero: [62, 222], calendar: [278, 62], sheets: [278, 222], pdf: [170, 306], print: [84, 398], email: [256, 398] },
    };
    let els = null, layoutName = 'wide', ro = null;

    const build = () => {
      body.dataset.demo = 'flow';
      body.innerHTML = `${inputHtml()}
        <div class="flow"><div class="flow-stage">
          <svg class="flow-svg"><g class="wires">${['prompt', ...SOURCES.map((s) => s.k), 'pdf', 'print', 'email'].map((k) => `<path class="wire" data-w="${k}"/>`).join('')}</g><g class="packets"></g></svg>
          <div class="core" data-n="core">
            <svg class="core-prog" viewBox="0 0 100 100"><circle class="core-track" cx="50" cy="50" r="46"/><circle class="core-bar" cx="50" cy="50" r="46" pathLength="100"/></svg>
            <span class="core-spin"></span>
            <img src="assets/logo-mark.svg" alt="" width="42" height="42">
            <span class="core-label"><b>Sunday AI</b><small>waiting</small></span>
          </div>
          ${SOURCES.map((s) => `<div class="node node-src" data-n="${s.k}">${appIcon(s, 'node-ic')}<span class="node-txt"><b>${s.name}</b><small>connected</small></span><i class="node-tick"></i></div>`).join('')}
          <div class="node node-pdf" data-n="pdf"><span class="mini-pdf">PDF</span><span class="node-txt"><b>${MONTH}-report.pdf</b><small>not made yet</small></span><i class="node-tick"></i></div>
          <div class="node node-out" data-n="print"><span class="node-ic">${icon('i-print')}</span><span class="node-txt"><b>Office printer</b><small>idle</small></span><i class="node-tick"></i></div>
          <div class="node node-out" data-n="email"><span class="node-ic">${icon('i-mail')}</span><span class="node-txt"><b>Key people</b><small>3 people</small></span><span class="avatars">${PEOPLE.map(([ini, , , c]) => `<i style="--c:${c}">${ini}</i>`).join('')}</span></div>
        </div></div>
        <div class="ai-log"></div>`;
      const box = body;
      els = {
        box,
        typed: $('.ai-typed', box), placeholder: $('.ai-placeholder', box),
        flowEl: $('.flow', box), stage: $('.flow-stage', box), packets: $('.packets', box), log: $('.ai-log', box),
        core: $('.core', box), coreBar: $('.core-bar', box), coreSub: $('.core-label small', box),
        wires: Object.fromEntries([...box.querySelectorAll('.wire')].map((w) => [w.dataset.w, w])),
        nodes: Object.fromEntries([...box.querySelectorAll('[data-n]')].map((n) => [n.dataset.n, n])),
      };
      layout();
      ro = new ResizeObserver(layout);
      ro.observe(els.flowEl);
    };

    const layout = () => {
      if (!els) return;
      const w = els.flowEl.clientWidth || 500;
      layoutName = w < 430 ? 'narrow' : 'wide';
      const L = LAYOUTS[layoutName];
      const s = Math.min(layoutName === 'wide' ? 1 : 1.08, w / L.W);
      els.flowEl.classList.toggle('is-narrow', layoutName === 'narrow');
      els.stage.style.width = `${L.W}px`;
      els.stage.style.height = `${L.H}px`;
      els.stage.style.transform = `scale(${s})`;
      els.flowEl.style.height = `${L.H * s}px`;
      $('.flow-svg', els.box).setAttribute('viewBox', `0 0 ${L.W} ${L.H}`);
      Object.entries(els.nodes).forEach(([k, n]) => { n.style.left = `${L[k][0]}px`; n.style.top = `${L[k][1]}px`; });
      const [cx, cy] = L.core;
      const curve = ([x1, y1], [x2, y2]) => { const mx = (x1 + x2) / 2; return `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`; };
      const drop = ([x1, y1], [x2, y2]) => `M${x1} ${y1}C${x1} ${y1 + 34} ${x2} ${y2 - 34} ${x2} ${y2}`;
      els.wires.prompt.setAttribute('d', `M${cx} -6L${cx} ${cy}`);
      SOURCES.forEach(({ k }) => els.wires[k].setAttribute('d', curve(L.core, L[k])));
      els.wires.pdf.setAttribute('d', `M${cx} ${cy}L${L.pdf[0]} ${L.pdf[1]}`);
      els.wires.print.setAttribute('d', drop(L.pdf, L.print));
      els.wires.email.setAttribute('d', drop(L.pdf, L.email));
      flowBodyH = els.box.offsetHeight;
    };

    // A glowing dot travelling along a wire. reverse = from the far end back towards Sunday AI.
    const packet = (wire, { dur = 700, reverse = false, kind = 'req', delay = 0 } = {}, id) => new Promise((res, rej) => {
      const len = wire.getTotalLength();
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', kind === 'req' ? 3.6 : 3.2);
      c.setAttribute('class', `pk pk-${kind}`);
      c.style.opacity = '0';
      els.packets.appendChild(c);
      const t0 = performance.now() + delay;
      const tick = (now) => {
        if (id !== run) { c.remove(); return rej(STOP); }
        const t = now - t0;
        if (t >= 0) {
          const p = Math.min(1, t / dur);
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          const pt = wire.getPointAtLength(len * (reverse ? 1 - e : e));
          c.setAttribute('cx', pt.x.toFixed(1));
          c.setAttribute('cy', pt.y.toFixed(1));
          c.style.opacity = '1';
          if (p >= 1) { c.remove(); return res(); }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const stream = (wire, n, gap, opts, id) => Promise.all(Array.from({ length: n }, (_, i) => packet(wire, { ...opts, delay: (opts.delay || 0) + i * gap }, id)));

    const log = (kind, html) => {
      const line = document.createElement('div');
      line.className = `log-line log-${kind}`;
      line.innerHTML = html;
      els.log.appendChild(line);
      while (els.log.children.length > 7) els.log.firstElementChild.remove();
    };
    const sub = (k, text) => { $('small', els.nodes[k]).textContent = text; };
    const wireState = (k, state) => { const w = els.wires[k]; w.classList.remove('is-on', 'is-back', 'is-done'); if (state) state.split(' ').forEach((c) => w.classList.add(c)); };

    const reset = () => {
      els.packets.innerHTML = '';
      els.log.innerHTML = '<div class="log-line log-dim">$ waiting for a request…</div>';
      els.typed.textContent = '';
      els.placeholder.classList.remove('is-hidden');
      Object.keys(els.wires).forEach((k) => wireState(k, ''));
      Object.values(els.nodes).forEach((n) => n.classList.remove('is-on', 'is-done'));
      els.box.querySelectorAll('.avatars i').forEach((a) => a.classList.remove('on'));
      els.core.classList.remove('is-on', 'is-working', 'is-done');
      els.coreBar.style.strokeDashoffset = '100';
      els.coreSub.textContent = 'waiting';
      SOURCES.forEach(({ k }) => sub(k, 'connected'));
      sub('pdf', 'not made yet'); sub('print', 'idle'); sub('email', '3 people');
      win.classList.remove('is-fading');
      setStatus('idle', 'Ready');
    };

    const play = async (id) => {
      reset();
      await wait(700, id);

      // 1. The request
      setStatus('listening', 'Listening');
      await typeInto(els.typed, els.placeholder, S.reportAsk, id);
      await pressSend(els.box, id);
      const t0 = performance.now();
      log('you', `› ${esc(S.reportAsk)}`);
      wireState('prompt', 'is-on');
      await packet(els.wires.prompt, { dur: 520, kind: 'req' }, id);
      wireState('prompt', 'is-done');
      els.core.classList.add('is-on', 'is-working');
      els.coreSub.textContent = 'working out what it needs';
      setStatus('working', 'Thinking');
      await wait(450, id);

      // 2. Ask every app at once
      setStatus('working', 'Fetching');
      els.coreSub.textContent = 'asking 4 apps at once';
      log('out', '→ asking <b>Gmail</b>, <b>Xero</b>, <b>Calendar</b> and <b>Sheets</b> at once');
      SOURCES.forEach(({ k }) => wireState(k, 'is-on'));
      await Promise.all(SOURCES.map(({ k }) => packet(els.wires[k], { dur: 620, kind: 'req' }, id)));
      SOURCES.forEach(({ k }) => { els.nodes[k].classList.add('is-on'); sub(k, 'sending data…'); wireState(k, 'is-on is-back'); });

      // 3. Data streams back from each one
      const delays = [180, 620, 0, 380];
      await Promise.all(SOURCES.map((s, i) => stream(els.wires[s.k], 4, 115, { dur: 720, reverse: true, kind: 'res', delay: delays[i] }, id).then(() => {
        els.nodes[s.k].classList.add('is-done');
        sub(s.k, s.got);
        wireState(s.k, 'is-done');
        log('in', `← <b>${s.name}</b> sent ${s.got.toLowerCase()}`);
      })));

      // 4. Write the report
      setStatus('working', 'Writing');
      await frames(1500, id, (p) => {
        els.coreBar.style.strokeDashoffset = String(100 - p * 100);
        els.coreSub.textContent = `writing report ${Math.round(p * 100)}%`;
      });
      els.core.classList.remove('is-working');
      els.core.classList.add('is-done');
      els.coreSub.textContent = 'report written';
      log('ok', '✎ wrote the report: revenue, overdue invoices, emails, meetings');
      wireState('pdf', 'is-on');
      await stream(els.wires.pdf, 2, 120, { dur: 480, kind: 'res' }, id);
      wireState('pdf', 'is-done');
      els.nodes.pdf.classList.add('is-on', 'is-done');
      sub('pdf', '4 pages · ready');
      log('ok', `✓ <b>${MONTH}-report.pdf</b> is ready`);
      await wait(500, id);

      // 5. Send it out: email the key people and print a copy
      setStatus('working', 'Sending');
      ['email', 'print'].forEach((k) => { wireState(k, 'is-on'); els.nodes[k].classList.add('is-on'); });
      sub('email', 'sending…'); sub('print', 'printing…');
      const emailDone = stream(els.wires.email, 3, 130, { dur: 640, kind: 'res' }, id).then(async () => {
        for (const a of els.box.querySelectorAll('.avatars i')) { a.classList.add('on'); await wait(170, id); }
        els.nodes.email.classList.add('is-done');
        sub('email', 'sent to 3 people');
        wireState('email', 'is-done');
        log('out', '→ emailed <b>Sam</b>, <b>Alex</b> and <b>Jordan</b>');
      });
      const printDone = stream(els.wires.print, 2, 150, { dur: 720, kind: 'res', delay: 260 }, id).then(async () => {
        await wait(500, id);
        els.nodes.print.classList.add('is-done');
        sub('print', 'printed');
        wireState('print', 'is-done');
        log('out', '→ printed a copy on the <b>office printer</b>');
      });
      await Promise.all([emailDone, printDone]);
      setStatus('done', 'Done');
      els.coreSub.textContent = 'all done';
      log('ok', `✓ done in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
      await wait(3600, id);
      win.classList.add('is-fading');
      await wait(650, id);
    };

    const final = () => {
      reset();
      ['prompt', ...SOURCES.map((s) => s.k), 'pdf', 'print', 'email'].forEach((k) => wireState(k, 'is-done'));
      Object.values(els.nodes).forEach((n) => n.classList.add('is-on', 'is-done'));
      els.box.querySelectorAll('.avatars i').forEach((a) => a.classList.add('on'));
      els.core.classList.add('is-on', 'is-done');
      els.coreBar.style.strokeDashoffset = '0';
      els.coreSub.textContent = 'all done';
      SOURCES.forEach((s) => sub(s.k, s.got));
      sub('pdf', '4 pages · ready'); sub('print', 'printed'); sub('email', 'sent to 3 people');
      els.log.innerHTML = '';
      log('you', `› ${esc(S.reportAsk)}`);
      SOURCES.forEach((s) => log('in', `← <b>${s.name}</b> sent ${s.got.toLowerCase()}`));
      log('out', '→ emailed <b>Sam</b>, <b>Alex</b> and <b>Jordan</b>');
      setStatus('done', 'Done');
    };

    const destroy = () => { if (ro) ro.disconnect(); ro = null; els = null; };
    return { build, play, final, destroy };
  })();

  // =====================================================================
  //  Version 2: Chat. Two requests in one conversation (order set in the demo settings):
  //  a stocktake from a photo (count every box, save it to the inventory, reorder the
  //  low stock on Ordermentum) and this month's report.
  //  Photo: "Cardboard box lot" by CHUTTERSNAP on Unsplash (Unsplash License).
  // =====================================================================
  const chat = (() => {
    const SOURCE_MS = [1500, 2100, 1250, 1800];
    const PHOTO = 'assets/stocktake-boxes.jpg';
    // Each box in the photo, as x, y, width, height on the 900 x 601 image.
    const BOXES = [
      [5, 25, 177, 147], [155, 0, 125, 82], [180, 82, 98, 63], [287, 15, 153, 72], [282, 84, 158, 50], [288, 118, 170, 128],
      [455, 0, 73, 72], [515, 35, 135, 85], [457, 76, 58, 108], [508, 118, 137, 112], [650, 20, 130, 82], [650, 100, 145, 112],
      [778, 28, 122, 50], [782, 80, 118, 108], [645, 207, 163, 106], [798, 177, 84, 120], [0, 165, 187, 85], [187, 180, 101, 58],
      [0, 236, 225, 75], [225, 242, 80, 100], [303, 245, 102, 108], [405, 272, 133, 104], [532, 228, 123, 110], [0, 294, 268, 108],
      [650, 302, 128, 86], [780, 297, 120, 126], [530, 332, 122, 78], [296, 332, 174, 182], [135, 383, 168, 134], [520, 400, 118, 96],
      [638, 388, 152, 126], [0, 404, 146, 100], [458, 437, 167, 164], [657, 488, 140, 113], [828, 370, 72, 188], [0, 504, 148, 97],
      [150, 507, 155, 94], [305, 507, 153, 94],
    ].sort((a, b) => (a[1] + a[3] / 2) - (b[1] + b[3] / 2));
    const TOTAL = BOXES.length;
    const CATEGORIES = [['Rice and grains', 9], ['Canned and jarred', 8], ['Sauces', 6], ['Snacks and drinks', 7], ['Cleaning', 3]];
    CATEGORIES.push(['Other', TOTAL - CATEGORIES.reduce((n, [, c]) => n + c, 0)]);
    const ORDER_NO = 'OM-48213';
    const head = (text) => `<div class="msg-head"><img src="assets/logo-mark.svg" alt=""><span class="head-text">${text}</span></div>`;
    const firstWord = (s) => esc(String(s).trim().split(/\s+/)[0] || s);
    const lowList = () => S.items.map((it) => firstWord(it.name)).join(', ');
    const money = (n) => `$${n.toFixed(2)}`;
    const orderTotal = () => S.items.reduce((n, it) => n + it.qty * it.price, 0);
    let els = null;

    const build = () => {
      body.dataset.demo = 'chat';
      body.innerHTML = `<div class="ai-feed"></div>${inputHtml()}<svg class="ai-cursor" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.5L10 19z"/></svg>`;
      $('.ai-input', body).insertAdjacentHTML('afterbegin', `<span class="ai-attach"><img src="${PHOTO}" alt="">stockroom.jpg</span>`);
      // A phone that slides up to take the stockroom photo before it's sent
      body.insertAdjacentHTML('beforeend', `<div class="phone-backdrop"></div><div class="phone"><div class="phone-screen">
        <img class="phone-view" src="${PHOTO}" alt=""><span class="phone-focus"></span>
        <div class="phone-ui"><span class="phone-mode">PHOTO</span><span class="phone-shutter"></span></div>
        <img class="phone-thumb" src="${PHOTO}" alt=""><span class="phone-flash"></span></div></div>`);
      els = { box: body, feed: $('.ai-feed', body), typed: $('.ai-typed', body), placeholder: $('.ai-placeholder', body), cursor: $('.ai-cursor', body), attach: $('.ai-attach', body), phone: $('.phone', body), backdrop: $('.phone-backdrop', body) };
      if (flowBodyH) els.feed.style.height = `${els.feed.offsetHeight + flowBodyH - body.offsetHeight}px`;
    };
    const add = (html) => { const tmp = document.createElement('div'); tmp.innerHTML = html.trim(); const el = tmp.firstElementChild; els.feed.appendChild(el); return el; };

    // ---- Monthly report messages ----
    const sourcesHtml = (done) => `<div class="msg msg-ai">${head(done ? 'Got everything.' : 'Pulling it all together…')}<div class="sources">${SOURCES.map((s) =>
      `<div class="src${done ? ' is-done' : ''}" style="--p:${done ? 100 : 0}%">${appIcon(s, 'src-ic')}<span class="src-name">${s.name}<span class="src-detail">${done ? s.got : 'connecting…'}</span></span><span class="src-state"></span></div>`).join('')}</div></div>`;
    const reportHtml = (done) => `<div class="msg msg-ai">${head(done ? 'Report written.' : 'Writing your report')}<div class="progress"><i style="width:${done ? 100 : 0}%"></i></div>
      <div class="doc"><div class="doc-title">${MONTH} report <small>4 pages</small></div>
        <div class="doc-line${done ? ' on' : ''}"><span>Revenue</span><b class="up">$48.2k ▲ 12%</b></div>
        <div class="doc-line${done ? ' on' : ''}"><span>Overdue invoices</span><b class="warn">3 · $4,180</b></div>
        <div class="doc-line${done ? ' on' : ''}"><span>Customer emails waiting</span><b>5</b></div>
        <div class="doc-line${done ? ' on' : ''}"><span>Meetings next week</span><b>12</b></div>
        <div class="doc-bars${done ? ' on' : ''}">${[38, 52, 45, 61, 57, 72, 86].map((h) => `<i style="--h:${h}%"></i>`).join('')}</div>
      </div></div>`;
    const pdfHtml = () => `<div class="msg msg-ai"><div class="pdf"><span class="pdf-ic">PDF</span><span><b>${MONTH}-report.pdf</b><small>4 pages · 1.2 MB</small></span><span class="pdf-ready">Ready</span></div>
      <div class="acts"><span class="act" data-act="print">${icon('i-print')} Print</span><span class="act act-primary" data-act="email">${icon('i-mail')} Email key people</span></div></div>`;
    const sentHtml = (done) => `<div class="msg msg-ai">${head(done ? 'Done. Report sent.' : 'Emailing the people who need it…')}<div class="people">${PEOPLE.map(([ini, name, role, c]) =>
      `<span class="person${done ? ' on' : ''}"><i style="--c:${c}">${ini}</i>${name} · ${role} ${icon('i-check')}</span>`).join('')}</div><p class="sent-note${done ? ' on' : ''}">Sent to 3 people · 9:02am</p></div>`;

    // ---- Stocktake messages ----
    const askHtml = () => `<div class="msg msg-user msg-photo"><img src="${PHOTO}" alt=""><span>${esc(S.stockAsk)}</span></div>`;
    const countHtml = (done) => `<div class="msg msg-ai">${head(done ? `Counted ${TOTAL} boxes.` : 'Counting boxes…')}
      <div class="scan"><img src="${PHOTO}" alt="">
        <svg viewBox="0 0 900 601" preserveAspectRatio="none"><defs><linearGradient id="scan-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9be58b" stop-opacity="0"/><stop offset="1" stop-color="#9be58b" stop-opacity=".55"/></linearGradient></defs>
          ${BOXES.map(([x, y, w, h]) => `<rect class="bx${done ? ' on' : ''}" x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="8"/>`).join('')}
          <rect class="scan-line" x="0" y="-60" width="900" height="60"/></svg>
        <span class="scan-count"><b>${done ? TOTAL : 0}</b> boxes</span>
      </div></div>`;
    const invHtml = (done) => `<div class="msg msg-ai">${head(done ? 'Inventory updated.' : 'Saving to your inventory…')}
      <div class="inv"><div class="inv-head"><span class="inv-ic">${icon('i-grid')}</span><b>Inventory</b><small>Stockroom · today</small></div>
        ${CATEGORIES.map(([name, n]) => `<div class="inv-row${done ? ' on' : ''}"><span>${name}</span><b>${n} boxes</b><i></i></div>`).join('')}
        <div class="inv-low${done ? ' on' : ''}">Low stock: ${lowList()}</div>
      </div></div>`;
    const savedHtml = () => `<div class="msg msg-ai"><div class="pdf"><span class="stock-ic">${icon('i-check')}</span><span><b>Stocktake saved</b><small>${TOTAL} boxes · ${CATEGORIES.length} categories · ${S.items.length} low</small></span><span class="pdf-ready">Saved</span></div>
      <div class="acts"><span class="act" data-act="view">${icon('i-grid')} View inventory</span><span class="act act-primary" data-act="order"><span class="mini-logo is-logo">${LOGOS.ordermentum}</span> Reorder on Ordermentum</span></div></div>`;
    const omHtml = (done) => `<div class="msg msg-ai">${head(done ? 'Order placed on Ordermentum.' : 'Making the order on Ordermentum…')}
      <div class="om${done ? ' is-placed' : ''}">
        <div class="om-head"><span class="om-logo is-logo">${LOGOS.ordermentum}</span><b>Ordermentum</b><small>${done ? `Order #${ORDER_NO}` : 'New order'}</small></div>
        <div class="om-supplier"><span>Supplier</span><b>${esc(S.supplier)}</b></div>
        ${S.items.map((it) => `<div class="om-row${done ? ' on' : ''}"><span>${esc(it.name)}</span><em>× <b class="om-qty">${done ? it.qty : 0}</b></em><b class="om-price">${money(done ? it.qty * it.price : 0)}</b></div>`).join('')}
        <div class="om-total"><span>Total (ex GST)</span><b>${money(done ? orderTotal() : 0)}</b></div>
        <div class="om-foot"><span class="om-delivery">Delivery ${esc(S.delivery)}</span><span class="act act-om${done ? ' is-done' : ''}" data-act="place">${done ? `${icon('i-check')} Order placed` : 'Place order'}</span></div>
      </div>
      <p class="sent-note${done ? ' on' : ''}">Sent to ${esc(S.supplier)} · arriving ${esc(S.delivery)}</p></div>`;

    const reset = () => {
      els.feed.innerHTML = '';
      els.typed.textContent = '';
      els.placeholder.classList.remove('is-hidden');
      els.attach.classList.remove('on');
      els.cursor.classList.remove('is-on');
      els.phone.classList.remove('is-on', 'is-aiming', 'is-focused', 'is-shot');
      els.backdrop.classList.remove('is-on');
      $('.phone-flash', els.phone).classList.remove('is-on');
      win.classList.remove('is-fading');
      setStatus('idle', 'Ready');
    };
    const moveCursorTo = async (el, id) => {
      const br = els.box.getBoundingClientRect(), r = el.getBoundingClientRect();
      els.cursor.style.transition = 'none';
      els.cursor.style.transform = `translate(${br.width - 34}px, ${br.height - 28}px)`;
      els.cursor.getBoundingClientRect();
      els.cursor.style.transition = '';
      els.cursor.classList.add('is-on');
      await wait(80, id);
      els.cursor.style.transform = `translate(${r.left - br.left + r.width * 0.55}px, ${r.top - br.top + r.height * 0.45}px)`;
      await wait(880, id);
    };
    const click = async (el, id) => {
      await moveCursorTo(el, id);
      el.classList.add('is-pressed');
      await wait(200, id);
      el.classList.remove('is-pressed');
      els.cursor.classList.remove('is-on');
    };

    // ---- Example: stocktake from a photo, then reorder on Ordermentum ----
    const doStocktake = async (id) => {
      // Snap the stockroom on the phone: slide up, focus, shutter and flash, then the photo drops into the chat
      setStatus('listening', 'Camera');
      els.backdrop.classList.add('is-on');
      els.phone.classList.add('is-on', 'is-aiming');
      await wait(1000, id);
      els.phone.classList.add('is-focused');
      await wait(650, id);
      const shutter = $('.phone-shutter', els.phone), flash = $('.phone-flash', els.phone);
      shutter.classList.add('is-pressed');
      await wait(140, id);
      shutter.classList.remove('is-pressed');
      flash.classList.remove('is-on');
      void flash.offsetWidth;
      flash.classList.add('is-on');
      els.phone.classList.remove('is-aiming');
      els.phone.classList.add('is-shot');
      await wait(750, id);
      els.phone.classList.remove('is-on');
      els.backdrop.classList.remove('is-on');
      await wait(350, id);

      setStatus('listening', 'Listening');
      els.placeholder.classList.add('is-hidden');
      els.attach.classList.add('on');
      await wait(450, id);
      await typeInto(els.typed, els.placeholder, S.stockAsk, id);
      await pressSend(els.box, id);
      els.attach.classList.remove('on');
      add(askHtml());
      await wait(500, id);

      // Count every box, sweeping down the photo
      setStatus('working', 'Counting');
      const countMsg = add(countHtml(false));
      const rects = [...countMsg.querySelectorAll('.bx')];
      const line = $('.scan-line', countMsg), num = $('.scan-count b', countMsg);
      let counted = 0;
      await frames(2700, id, (p) => {
        const y = p * 661 - 60;
        line.setAttribute('y', y.toFixed(1));
        BOXES.forEach(([, by, , bh], i) => {
          if (!rects[i].classList.contains('on') && by + bh / 2 <= y + 60) { rects[i].classList.add('on'); counted++; num.textContent = counted; }
        });
      });
      rects.forEach((r) => r.classList.add('on'));
      num.textContent = TOTAL;
      line.setAttribute('y', '-60');
      $('.head-text', countMsg).textContent = `Counted ${TOTAL} boxes.`;
      await wait(450, id);

      // Save the count to the inventory
      setStatus('working', 'Saving');
      const invMsg = add(invHtml(false));
      for (const row of invMsg.querySelectorAll('.inv-row')) { await wait(230, id); row.classList.add('on'); }
      await wait(250, id);
      $('.inv-low', invMsg).classList.add('on');
      $('.head-text', invMsg).textContent = 'Inventory updated.';
      await wait(500, id);

      const savedMsg = add(savedHtml());
      setStatus('done', 'Saved');
      await wait(900, id);
      await click($('[data-act="order"]', savedMsg), id);

      // Make the order on Ordermentum: supplier, items and quantities fill in, then Place order
      setStatus('working', 'Ordering');
      const omMsg = add(omHtml(false));
      const rows = [...omMsg.querySelectorAll('.om-row')];
      const totalEl = $('.om-total b', omMsg);
      let running = 0;
      for (let i = 0; i < rows.length; i++) {
        const it = S.items[i];
        await wait(350, id);
        rows[i].classList.add('on');
        const qtyEl = $('.om-qty', rows[i]), priceEl = $('.om-price', rows[i]);
        const step = Math.max(1, Math.ceil(it.qty / 6));
        for (let n = step; ; n = Math.min(it.qty, n + step)) {
          await wait(150, id);
          qtyEl.textContent = n;
          priceEl.textContent = money(n * it.price);
          totalEl.textContent = money(running + n * it.price);
          if (n >= it.qty) break;
        }
        running += it.qty * it.price;
      }
      await wait(500, id);
      const place = $('[data-act="place"]', omMsg);
      await click(place, id);
      place.classList.add('is-done');
      place.innerHTML = `${icon('i-check')} Order placed`;
      $('.om', omMsg).classList.add('is-placed');
      $('.om-head small', omMsg).textContent = `Order #${ORDER_NO}`;
      $('.head-text', omMsg).textContent = 'Order placed on Ordermentum.';
      $('.sent-note', omMsg).classList.add('on');
      setStatus('done', 'Done');
    };

    // ---- Example: this month's report ----
    const doReport = async (id) => {
      setStatus('listening', 'Listening');
      await typeInto(els.typed, els.placeholder, S.reportAsk, id);
      await pressSend(els.box, id);
      add(`<div class="msg msg-user">${esc(S.reportAsk)}</div>`);
      await wait(520, id);

      setStatus('working', 'Working');
      const srcMsg = add(sourcesHtml(false));
      const tiles = [...srcMsg.querySelectorAll('.src')];
      await frames(Math.max(...SOURCE_MS), id, (p, t) => {
        tiles.forEach((tile, i) => {
          const q = Math.min(1, t / SOURCE_MS[i]);
          tile.style.setProperty('--p', `${q * 100}%`);
          if (q >= 1 && !tile.classList.contains('is-done')) { tile.classList.add('is-done'); $('.src-detail', tile).textContent = SOURCES[i].got; }
        });
      });
      $('.head-text', srcMsg).textContent = 'Got everything.';
      await wait(420, id);

      const docMsg = add(reportHtml(false));
      const parts = [...docMsg.querySelectorAll('.doc-line, .doc-bars')];
      const bar = $('.progress i', docMsg);
      const pct = document.createElement('span');
      pct.className = 'pct';
      $('.msg-head', docMsg).appendChild(pct);
      await frames(2300, id, (p) => {
        bar.style.width = `${p * 100}%`;
        pct.textContent = `${Math.round(p * 100)}%`;
        parts.forEach((part, i) => { if (p >= (i + 1) / (parts.length + 1)) part.classList.add('on'); });
      });
      parts.forEach((part) => part.classList.add('on'));
      $('.head-text', docMsg).textContent = 'Report written.';
      await wait(480, id);

      const pdfMsg = add(pdfHtml());
      setStatus('done', 'PDF ready');
      await wait(1000, id);
      await click($('[data-act="email"]', pdfMsg), id);

      setStatus('working', 'Sending');
      const sentMsg = add(sentHtml(false));
      for (const person of sentMsg.querySelectorAll('.person')) { await wait(400, id); person.classList.add('on'); }
      await wait(320, id);
      $('.head-text', sentMsg).textContent = 'Done. Report sent.';
      $('.sent-note', sentMsg).classList.add('on');
      setStatus('done', 'Done');
    };

    const order = () => (S.chatFirst === 'report' ? [doReport, doStocktake] : [doStocktake, doReport]);
    const play = async (id) => {
      reset();
      await wait(800, id);
      const [first, second] = order();
      await first(id);
      await wait(2200, id);
      await second(id);
      await wait(3400, id);
      win.classList.add('is-fading');
      await wait(650, id);
    };

    const finalStock = () => { add(askHtml()); add(countHtml(true)); add(invHtml(true)); add(savedHtml()); add(omHtml(true)); };
    const finalReport = () => { add(`<div class="msg msg-user">${esc(S.reportAsk)}</div>`); add(sourcesHtml(true)); add(reportHtml(true)); add(pdfHtml()); add(sentHtml(true)); };
    const final = () => {
      reset();
      if (S.chatFirst === 'report') { finalReport(); finalStock(); } else { finalStock(); finalReport(); }
      setStatus('done', 'Done');
    };
    const destroy = () => { els = null; };
    return { build, play, final, destroy };
  })();

  // =====================================================================
  //  Switching between versions, and only animating while on screen
  // =====================================================================
  // The two examples take turns (which goes first is in the demo settings). When one
  // finishes it fades out and the next plays. The active tab fills up as its example plays.
  // Clicking a tab jumps straight to that example, and the turns carry on from there.
  const DEMOS = { flow, chat };
  const ORDER = ['flow', 'chat'];
  const ROUGH_MS = { flow: 16500, chat: 40000 };   // roughly how long each one plays
  const next = (name) => ORDER[(ORDER.indexOf(name) + 1) % ORDER.length];
  const tabs = [...demo.querySelectorAll('.ai-switch button')];
  let current = null;
  let inView = false;
  let progressRaf = 0;

  const show = (name) => {
    if (current) DEMOS[current].destroy();
    current = name;
    DEMOS[name].build();
    tabs.forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.demo === name)); b.style.setProperty('--p', '0'); });
  };
  const trackProgress = (name, id) => {
    cancelAnimationFrame(progressRaf);
    const tab = tabs.find((b) => b.dataset.demo === name);
    if (!tab) return;
    const t0 = performance.now();
    const tick = (now) => {
      if (id !== run || current !== name) return;
      tab.style.setProperty('--p', Math.min(1, (now - t0) / ROUGH_MS[name]).toFixed(3));
      progressRaf = requestAnimationFrame(tick);
    };
    progressRaf = requestAnimationFrame(tick);
  };

  const stop = () => { run++; playing = false; };
  async function start() {
    if (playing || !current) return;
    playing = true;
    const id = ++run;
    // Errors after a switch or stop are just leftovers from the cancelled run, so they're ignored.
    try {
      for (;;) {
        trackProgress(current, id);
        await DEMOS[current].play(id);
        if (id !== run) return;
        show(next(current));
      }
    } catch (e) { if (e !== STOP && id === run) throw e; }
  }
  // ?static=1 shows each example's finished state with no animation (handy for screenshots).
  const staticMode = reduceMotion || new URLSearchParams(window.location.search).has('static');
  const sync = () => { if (staticMode) return; if (inView && !document.hidden) start(); else if (playing) stop(); };

  const use = (name) => {
    if (!DEMOS[name]) name = 'flow';
    stop();
    win.classList.remove('is-fading');
    show(name);
    if (staticMode) DEMOS[name].final(); else sync();
  };

  tabs.forEach((b) => b.addEventListener('click', () => use(b.dataset.demo)));

  // ?demo=chat or ?demo=flow picks the first example (handy for showing someone); otherwise the settings decide.
  const fromUrl = new URLSearchParams(window.location.search).get('demo');
  use(fromUrl && DEMOS[fromUrl] ? fromUrl : S.startWith);

  // =====================================================================
  //  Demo settings: click the Sunday AI logo on the card. Saved in this browser only, so
  //  you can tailor the demo before showing someone. Visitors always see the defaults.
  // =====================================================================
  const openSettings = () => {
    let dlg = $('#demo-settings');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'demo-settings';
      dlg.className = 'demo-settings';
      dlg.setAttribute('aria-labelledby', 'demo-settings-title');
      dlg.addEventListener('click', (e) => {
        const b = dlg.getBoundingClientRect();
        if (e.target === dlg && (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom)) dlg.close();
      });
      document.body.appendChild(dlg);
    }
    const itemRow = (it = { name: '', qty: 1, price: 0 }) => `<div class="ds-item">
      <input name="iname" value="${esc(it.name)}" placeholder="Product" maxlength="60" aria-label="Product">
      <input name="iqty" type="number" min="1" max="99" value="${it.qty}" aria-label="Quantity">
      <input name="iprice" type="number" min="0" step="0.01" value="${it.price}" aria-label="Price each">
      <button type="button" class="ds-remove" aria-label="Remove this item">×</button></div>`;
    dlg.innerHTML = `<form class="ds-form">
      <button class="dialog-close" type="button" aria-label="Close demo settings">×</button>
      <p class="kicker">Demo settings</p>
      <h2 id="demo-settings-title">Tweak the demo</h2>
      <p class="ds-note">Saved in this browser only, so you can tailor it before showing someone. Visitors always see the defaults.</p>
      <fieldset><legend>Start with</legend><label><input type="radio" name="startWith" value="chat"> Chat</label><label><input type="radio" name="startWith" value="flow"> Diagram</label></fieldset>
      <fieldset><legend>In the chat, do this first</legend><label><input type="radio" name="chatFirst" value="stock"> Stocktake</label><label><input type="radio" name="chatFirst" value="report"> Monthly report</label></fieldset>
      <label class="ds-field">Stocktake request<input name="stockAsk" maxlength="80"></label>
      <label class="ds-field">Report request<input name="reportAsk" maxlength="80"></label>
      <div class="ds-row"><label class="ds-field">Supplier on Ordermentum<input name="supplier" maxlength="40"></label><label class="ds-field">Delivery day<input name="delivery" maxlength="20"></label></div>
      <div class="ds-items-head"><span>Order items</span><span>Qty</span><span>$ each</span><span></span></div>
      <div class="ds-items">${S.items.map(itemRow).join('')}</div>
      <button type="button" class="link-button ds-add">+ Add an item</button>
      <div class="ds-actions"><button type="button" class="btn btn-ghost ds-reset">Reset to default</button><button type="submit" class="btn btn-sun">Save and replay</button></div>
    </form>`;
    const f = $('form', dlg), items = $('.ds-items', dlg);
    f.startWith.value = S.startWith;
    f.chatFirst.value = S.chatFirst;
    ['stockAsk', 'reportAsk', 'supplier', 'delivery'].forEach((k) => { f[k].value = S[k]; });
    const tidy = () => {
      $('.ds-add', dlg).hidden = items.children.length >= 4;
      items.querySelectorAll('.ds-remove').forEach((b) => { b.disabled = items.children.length <= 1; });
    };
    items.addEventListener('click', (e) => { const rm = e.target.closest('.ds-remove'); if (rm) { rm.closest('.ds-item').remove(); tidy(); } });
    $('.ds-add', dlg).addEventListener('click', () => { items.insertAdjacentHTML('beforeend', itemRow()); tidy(); });
    tidy();
    $('.dialog-close', dlg).addEventListener('click', () => dlg.close());
    $('.ds-reset', dlg).addEventListener('click', () => {
      S = clone(DEFAULTS);
      try { localStorage.removeItem(SETTINGS_KEY); } catch (e) { /* storage unavailable */ }
      dlg.close();
      use(S.startWith);
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const rows = [...items.querySelectorAll('.ds-item')].map((r) => ({
        name: $('[name="iname"]', r).value.trim(),
        qty: Math.max(1, Math.min(99, parseInt($('[name="iqty"]', r).value, 10) || 1)),
        price: Math.max(0, parseFloat($('[name="iprice"]', r).value) || 0),
      })).filter((r) => r.name);
      S = {
        startWith: f.startWith.value === 'flow' ? 'flow' : 'chat',
        chatFirst: f.chatFirst.value === 'report' ? 'report' : 'stock',
        stockAsk: f.stockAsk.value.trim() || DEFAULTS.stockAsk,
        reportAsk: f.reportAsk.value.trim() || DEFAULTS.reportAsk,
        supplier: f.supplier.value.trim() || DEFAULTS.supplier,
        delivery: f.delivery.value.trim() || DEFAULTS.delivery,
        items: rows.length ? rows : clone(DEFAULTS.items),
      };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(S)); } catch (err) { /* storage unavailable */ }
      dlg.close();
      use(S.startWith);
    });
    dlg.showModal();
  };
  $('#ai-settings-open').addEventListener('click', openSettings);


  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { inView = entries.some((e) => e.isIntersecting); sync(); }, { threshold: 0.1 }).observe(demo);
  } else {
    inView = true;
    sync();
  }
  document.addEventListener('visibilitychange', sync);
})();
