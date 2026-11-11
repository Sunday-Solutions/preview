// Homepage extras: header on scroll, the grass and fireflies, and the "give me a report" AI demo.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Header goes solid once you scroll ----------
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Grass along the front hills ----------
  document.querySelectorAll('g.grass[data-guide]').forEach((grass, n) => {
    const NS = 'http://www.w3.org/2000/svg';
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

  // ---------- AI report demo ----------
  const demo = $('#ai-demo');
  if (!demo) return;
  const win = $('.ai-window', demo), feed = $('#ai-feed'), typed = $('#ai-typed'), placeholder = $('#ai-placeholder');
  const send = $('#ai-send'), status = $('#ai-status'), cursor = $('#ai-cursor');

  const PROMPT = "Give me this month's report";
  const MONTH = new Date().toLocaleDateString('en-AU', { month: 'long' });
  const SOURCES = [['Gmail', 'i-mail', '38 emails'], ['Xero', 'i-ledger', '24 invoices'], ['Calendar', 'i-calendar', '12 meetings'], ['Sheets', 'i-grid', 'Sales tracker']];
  const SOURCE_MS = [1500, 2100, 1250, 1800];
  const PEOPLE = [['S', 'Sam', 'Accounts', '#9be58b'], ['A', 'Alex', 'Operations', '#f5ca45'], ['J', 'Jordan', 'Owner', '#8fd3ff']];
  const icon = (id) => `<svg class="icon"><use href="#${id}"/></svg>`;
  const head = (text) => `<div class="msg-head"><img src="assets/logo-mark.svg" alt=""><span class="head-text">${text}</span></div>`;

  let run = 0;          // bumping this cancels whatever is playing
  let playing = false;
  const stop = () => { run++; playing = false; };
  const wait = (ms, id) => new Promise((res, rej) => setTimeout(() => (id === run ? res() : rej(new Error('stopped'))), ms));
  const frames = (ms, id, step) => new Promise((res, rej) => {
    const t0 = performance.now();
    const tick = (now) => {
      if (id !== run) return rej(new Error('stopped'));
      const p = Math.min(1, (now - t0) / ms);
      step(p, now - t0);
      if (p < 1) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  const setStatus = (state, text) => { status.dataset.state = state; status.querySelector('b').textContent = text; };
  const add = (html) => { const box = document.createElement('div'); box.innerHTML = html.trim(); const el = box.firstElementChild; feed.appendChild(el); return el; };

  const sourcesHtml = (done) => `<div class="msg msg-ai">${head(done ? 'Got everything.' : 'Pulling it all together…')}<div class="sources">${SOURCES.map(([n, ic, detail]) =>
    `<div class="src${done ? ' is-done' : ''}" style="--p:${done ? 100 : 0}%"><span class="src-ic">${icon(ic)}</span><span class="src-name">${n}<span class="src-detail">${done ? detail : 'connecting…'}</span></span><span class="src-state"></span></div>`).join('')}</div></div>`;
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

  const reset = () => {
    feed.innerHTML = '';
    typed.textContent = '';
    placeholder.classList.remove('is-hidden');
    send.classList.remove('is-ready', 'is-pressed');
    cursor.classList.remove('is-on');
    win.classList.remove('is-fading');
    setStatus('idle', 'Ready');
  };

  const moveCursorTo = async (el, id) => {
    const wr = win.getBoundingClientRect(), r = el.getBoundingClientRect();
    cursor.style.transition = 'none';
    cursor.style.transform = `translate(${wr.width - 34}px, ${wr.height - 28}px)`;
    cursor.getBoundingClientRect();
    cursor.style.transition = '';
    cursor.classList.add('is-on');
    await wait(80, id);
    cursor.style.transform = `translate(${r.left - wr.left + r.width * 0.55}px, ${r.top - wr.top + r.height * 0.45}px)`;
    await wait(880, id);
  };

  async function play(id) {
    reset();
    await wait(800, id);

    // 1. Type the request
    placeholder.classList.add('is-hidden');
    setStatus('listening', 'Listening');
    for (const ch of PROMPT) { typed.textContent += ch; await wait(34 + Math.random() * 46, id); }
    send.classList.add('is-ready');
    await wait(380, id);
    send.classList.add('is-pressed');
    await wait(160, id);
    send.classList.remove('is-pressed', 'is-ready');
    typed.textContent = '';
    placeholder.classList.remove('is-hidden');
    add(`<div class="msg msg-user">${PROMPT}</div>`);
    await wait(520, id);

    // 2. Pull from every source at once
    setStatus('working', 'Working');
    const srcMsg = add(sourcesHtml(false));
    const tiles = [...srcMsg.querySelectorAll('.src')];
    await frames(Math.max(...SOURCE_MS), id, (p, t) => {
      tiles.forEach((tile, i) => {
        const q = Math.min(1, t / SOURCE_MS[i]);
        tile.style.setProperty('--p', `${q * 100}%`);
        if (q >= 1 && !tile.classList.contains('is-done')) {
          tile.classList.add('is-done');
          tile.querySelector('.src-detail').textContent = SOURCES[i][2];
        }
      });
    });
    srcMsg.querySelector('.head-text').textContent = 'Got everything.';
    await wait(420, id);

    // 3. Write the report
    const docMsg = add(reportHtml(false));
    const parts = [...docMsg.querySelectorAll('.doc-line, .doc-bars')];
    const bar = docMsg.querySelector('.progress i');
    const pct = document.createElement('span');
    pct.className = 'pct';
    docMsg.querySelector('.msg-head').appendChild(pct);
    await frames(2300, id, (p) => {
      bar.style.width = `${p * 100}%`;
      pct.textContent = `${Math.round(p * 100)}%`;
      parts.forEach((part, i) => { if (p >= (i + 1) / (parts.length + 1)) part.classList.add('on'); });
    });
    parts.forEach((part) => part.classList.add('on'));
    docMsg.querySelector('.head-text').textContent = 'Report written.';
    await wait(480, id);

    // 4. PDF ready, with options
    const pdfMsg = add(pdfHtml());
    setStatus('done', 'PDF ready');
    await wait(1000, id);
    const emailBtn = pdfMsg.querySelector('[data-act="email"]');
    await moveCursorTo(emailBtn, id);
    emailBtn.classList.add('is-pressed');
    await wait(200, id);
    emailBtn.classList.remove('is-pressed');
    cursor.classList.remove('is-on');

    // 5. Send it to the right people
    setStatus('working', 'Sending');
    const sentMsg = add(sentHtml(false));
    for (const person of sentMsg.querySelectorAll('.person')) { await wait(400, id); person.classList.add('on'); }
    await wait(320, id);
    sentMsg.querySelector('.head-text').textContent = 'Done. Report sent.';
    sentMsg.querySelector('.sent-note').classList.add('on');
    setStatus('done', 'Done');
    await wait(3400, id);
    win.classList.add('is-fading');
    await wait(650, id);
  }

  async function start() {
    if (playing) return;
    playing = true;
    const id = ++run;
    try { for (;;) await play(id); } catch (e) { /* stopped */ }
  }

  // Reduced motion: show the finished conversation, no animation.
  if (reduceMotion) {
    reset();
    add(`<div class="msg msg-user">${PROMPT}</div>`);
    add(sourcesHtml(true));
    add(reportHtml(true));
    add(pdfHtml());
    add(sentHtml(true));
    setStatus('done', 'Done');
    return;
  }

  // Only animate while it's on screen and the tab is visible.
  let inView = false;
  const sync = () => { if (inView && !document.hidden) start(); else if (playing) stop(); };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { inView = entries.some((e) => e.isIntersecting); sync(); }, { threshold: 0.25 }).observe(demo);
  } else {
    inView = true;
  }
  document.addEventListener('visibilitychange', sync);
  sync();
})();
