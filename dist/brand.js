/* Logo preview for Sunday Solutions.
   Visitors see the default logo. Opening the site with ?logo=<id> (the Logo Explorer's
   "See it on the site" button does this) applies that logo, shows a small picker, and
   remembers the choice in this browser. ?logo=original resets. */
(() => {
  const KEY = 'ss-brand-preview';
  const LOGOS = [
    ['original', 'Current logo'],
    ['a-sun-cut-s', 'A · Sun-cut S'],
    ['b-sundown-screen', 'B · Sundown Screen'],
    ['c-week-rise', 'C · Week Rise'],
    ['d-half-day-s', 'D · Half-day S'],
    ['e-sunday-mode', 'E · Sunday Mode'],
    ['f-sun-path', 'F · Sun Path'],
    ['g-sunrise-prompt', 'G · Sunrise Prompt'],
    ['h-code-sun', 'H · Code Sun'],
    ['i-sun-chip', 'I · Sun Chip'],
    ['j-network-sun', 'J · Network Sun'],
  ];
  const FONTS = ['DM Sans', 'Outfit', 'Manrope', 'Plus Jakarta Sans', 'Sora', 'Space Grotesk', 'Fraunces', 'Instrument Serif'];
  const BASE = new URL('./', (document.currentScript && document.currentScript.src) || location.href).href;
  const ORIGINAL = BASE + 'assets/logo-mark.svg';

  let st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  const q = new URLSearchParams(location.search);
  if (q.has('logo')) { st.logo = q.get('logo'); st.picker = st.logo !== 'original'; }
  if (q.has('font')) st.font = q.get('font');
  if (q.has('logo') || q.has('font')) save();
  if (!LOGOS.some(([id]) => id === st.logo)) st.logo = 'original';

  const src = id => id === 'original' ? ORIGINAL : `${BASE}logos/svg/current/${id}-color.svg`;

  function loadFont(name) {
    if (!name || name === 'DM Sans' || document.querySelector(`link[data-font="${name}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.dataset.font = name;
    l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@500;600;700;800&display=swap`;
    document.head.appendChild(l);
  }

  function apply() {
    document.querySelectorAll('img[src$="logo-mark.svg"], img[data-brand-mark]').forEach(img => {
      img.dataset.brandMark = '1';
      img.src = src(st.logo);
    });
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.href = src(st.logo);
    document.querySelectorAll('.wordmark').forEach(w => {
      w.style.fontFamily = st.font && st.font !== 'DM Sans' ? `'${st.font}', var(--font)` : '';
    });
    loadFont(st.font);
    const sel = document.getElementById('bp-logo'); if (sel) sel.value = st.logo;
    const fs = document.getElementById('bp-font'); if (fs) fs.value = st.font || 'DM Sans';
  }

  function picker() {
    if (document.getElementById('brand-picker')) return;
    const css = document.createElement('style');
    css.textContent = `#brand-picker{position:fixed;left:16px;bottom:16px;z-index:60;background:#fffefa;color:#183e35;border:1px solid #dcded5;border-radius:12px;box-shadow:0 10px 40px #10251f2e;padding:12px;width:min(300px,calc(100vw - 32px));font:13px/1.4 'DM Sans',Arial,sans-serif}
#brand-picker .bp-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:700}
#brand-picker .bp-x{background:none;border:0;font-size:20px;line-height:1;padding:2px 6px;color:#64716a}
#brand-picker label{display:block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64716a;margin:8px 0 4px}
#brand-picker .bp-row{display:flex;gap:6px}
#brand-picker select{flex:1;min-width:0;padding:7px 8px;border:1px solid #dcded5;border-radius:8px;background:#fff;color:#183e35;font:inherit}
#brand-picker button.bp-b{border:1px solid #dcded5;background:#fff;border-radius:8px;padding:7px 10px;color:#183e35}
#brand-picker .bp-foot{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:12px}
#brand-picker .bp-foot a{text-decoration:underline}
#brand-picker .bp-saved{color:#4c7a3e;font-weight:600}`;
    document.head.appendChild(css);
    const el = document.createElement('div');
    el.id = 'brand-picker';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Logo preview');
    el.innerHTML = `<div class="bp-top"><span>Logo preview</span><button class="bp-x" type="button" aria-label="Close logo preview">×</button></div>
<label for="bp-logo">Logo</label>
<div class="bp-row"><button class="bp-b" type="button" data-step="-1" aria-label="Previous logo">←</button><select id="bp-logo">${LOGOS.map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select><button class="bp-b" type="button" data-step="1" aria-label="Next logo">→</button></div>
<label for="bp-font">Wordmark font</label>
<div class="bp-row"><select id="bp-font">${FONTS.map(f => `<option>${f}</option>`).join('')}</select></div>
<div class="bp-foot"><span class="bp-saved" aria-live="polite">Saved in this browser</span><a href="${BASE}logos/">All logos</a></div>`;
    document.body.appendChild(el);
    const flash = () => { const s = el.querySelector('.bp-saved'); s.textContent = 'Saved ✓'; clearTimeout(flash.t); flash.t = setTimeout(() => s.textContent = 'Saved in this browser', 1400); };
    el.querySelector('#bp-logo').addEventListener('change', e => { st.logo = e.target.value; save(); apply(); flash(); });
    el.querySelector('#bp-font').addEventListener('change', e => { st.font = e.target.value; save(); apply(); flash(); });
    el.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
      const i = LOGOS.findIndex(([id]) => id === st.logo);
      st.logo = LOGOS[(i + Number(b.dataset.step) + LOGOS.length) % LOGOS.length][0];
      save(); apply(); flash();
    }));
    el.querySelector('.bp-x').addEventListener('click', () => { st.picker = false; save(); el.remove(); });
  }

  function init() { if (st.picker || q.has("logo")) picker(); apply(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
