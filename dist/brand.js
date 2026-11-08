/* Logo picker for Sunday Solutions.
   Click the logo (header or footer) to open a popup of every logo; click one to use it.
   The choice is saved in this browser and applied to the header, promise board, footer
   and favicon on every page. ?logo=<id> also selects one (used by /logos/). */
(() => {
  const KEY = 'ss-brand-preview';
  const BASE = new URL('./', (document.currentScript && document.currentScript.src) || location.href).href;
  const C = id => `logos/svg/current/${id}-color.svg`;
  const A = id => `logos/svg/archive/${id}.svg`;
  const LOGOS = [
    ['original', 'Current logo', 'assets/logo-mark.svg'],
    ['a-sun-cut-s', 'Sun-cut S', C('a-sun-cut-s')],
    ['b-sundown-screen', 'Sundown Screen', C('b-sundown-screen')],
    ['c-week-rise', 'Week Rise', C('c-week-rise')],
    ['d-half-day-s', 'Half-day S', C('d-half-day-s')],
    ['e-sunday-mode', 'Sunday Mode', C('e-sunday-mode')],
    ['f-sun-path', 'Sun Path', C('f-sun-path')],
    ['g-sunrise-prompt', 'Sunrise Prompt', C('g-sunrise-prompt')],
    ['h-code-sun', 'Code Sun', C('h-code-sun')],
    ['i-sun-chip', 'Sun Chip', C('i-sun-chip')],
    ['j-network-sun', 'Network Sun', C('j-network-sun')],
    ['r3-a-hammer-ray', 'Hammer Ray', A('r3-a-hammer-ray')],
    ['r3-b-sunday-screen', 'Sunday Screen', A('r3-b-sunday-screen')],
    ['r3-c-sunrise-s', 'Sunrise S', A('r3-c-sunrise-s')],
    ['r4-hunter-sunrise', 'Hunter Sunrise', A('r4-hunter-sunrise')],
    ['r4-seventh-day', 'Seventh Day', A('r4-seventh-day')],
    ['r4-sunset-s', 'Sunset S', A('r4-sunset-s')],
    ['r2-1-monoline', 'Monoline', A('r2-1-monoline')],
    ['r2-2-sunburst', 'Sunburst', A('r2-2-sunburst')],
    ['r2-3-sunrise-display', 'Sunrise Display', A('r2-3-sunrise-display')],
  ];
  const byId = id => LOGOS.find(l => l[0] === id) || LOGOS[0];

  let current = 'original';
  try { current = localStorage.getItem(KEY + ':logo') || 'original'; } catch (e) {}
  const q = new URLSearchParams(location.search);
  if (q.has('logo')) current = q.get('logo');
  current = byId(current)[0];
  const save = () => { try { localStorage.setItem(KEY + ':logo', current); } catch (e) {} };
  if (q.has('logo')) save();

  function apply() {
    const url = BASE + byId(current)[2];
    document.querySelectorAll('img[src$="logo-mark.svg"], img[data-brand-mark]').forEach(img => {
      img.dataset.brandMark = '1';
      img.src = url;
    });
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.href = url;
    document.querySelectorAll('#logo-picker [data-id]').forEach(b =>
      b.setAttribute('aria-pressed', b.dataset.id === current ? 'true' : 'false'));
  }

  let dlg;
  function build() {
    const css = document.createElement('style');
    css.textContent = `
#logo-picker{width:min(760px,calc(100% - 32px));max-height:calc(100vh - 48px);padding:24px;border-radius:14px}
#logo-picker h2{font-size:22px;letter-spacing:-.5px;margin:0 0 4px}
#logo-picker p.lp-sub{font-size:13px;margin:0 0 18px;color:var(--muted,#64716a)}
#logo-picker .lp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}
#logo-picker .lp-item{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px 10px;border:1px solid #dcded5;border-radius:12px;background:#fff;font-size:12px;font-weight:600;color:#183e35;transition:border-color .15s,transform .15s}
#logo-picker .lp-item:hover{border-color:#183e35;transform:translateY(-2px)}
#logo-picker .lp-item[aria-pressed="true"]{border-color:#183e35;box-shadow:0 0 0 2px #183e35 inset;background:#f8f6ee}
#logo-picker .lp-item img{width:64px;height:64px}
#logo-picker .lp-close{position:absolute;right:12px;top:8px;background:none;border:0;font-size:28px;line-height:1;padding:4px 8px;color:#183e35}
.brand{cursor:pointer}`;
    document.head.appendChild(css);
    dlg = document.createElement('dialog');
    dlg.id = 'logo-picker';
    dlg.setAttribute('aria-labelledby', 'lp-title');
    dlg.innerHTML = `<button class="lp-close" type="button" aria-label="Close">×</button>
<h2 id="lp-title">Pick a logo</h2>
<p class="lp-sub">Click one to use it across the site. Saved in this browser.</p>
<div class="lp-grid">${LOGOS.map(([id, name, path]) =>
      `<button type="button" class="lp-item" data-id="${id}" aria-pressed="false"><img src="${BASE + path}" alt="" loading="lazy">${name}</button>`).join('')}</div>`;
    document.body.appendChild(dlg);
    dlg.querySelector('.lp-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => {
      if (e.target === dlg) return dlg.close();   // backdrop
      const b = e.target.closest('[data-id]');
      if (!b) return;
      current = b.dataset.id; save(); apply(); dlg.close();
    });
  }

  function init() {
    apply();
    document.querySelectorAll('.brand').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      if (!dlg) build();
      apply();
      dlg.showModal();
    }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
