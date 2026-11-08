// Interactive demo: a cut-down version of the roasting planner's calculation.
// Same idea as the real system: total the products across the ticked orders,
// multiply each by its recipe (grams of green bean per unit), then group by blend.
// All cafés, products and recipes here are made up.

const RECIPES = {
  'House Espresso 1kg': { blend: 'House Espresso', beans: { Brazil: 590, Colombia: 355, 'Papua New Guinea': 235 } },
  'Morning Blend 250g': { blend: 'Morning Blend', beans: { Brazil: 150, Ethiopia: 145 } },
  'Decaf 1kg': { blend: 'Decaf', beans: { 'Decaf Colombia': 1180 } },
};

// Products the planner would flag as "looks like coffee" (from words like 1KG / 250G / Filter)
// but which don't have a recipe yet, and products that aren't coffee at all.
const NEEDS_RECIPE = new Set(['Ethiopia Filter 250g', 'Chai Powder 1kg']);

const ORDERS = [
  { id: '10482', cafe: 'The Corner Café', date: 'Mon 7:02am', items: [['House Espresso 1kg', 6], ['Decaf 1kg', 2], ['Takeaway Cups', 1]] },
  { id: '10483', cafe: 'Northside Bakery', date: 'Mon 7:15am', items: [['Morning Blend 250g', 10], ['House Espresso 1kg', 3]] },
  { id: '10484', cafe: 'Harbour Kiosk', date: 'Mon 8:40am', items: [['House Espresso 1kg', 4], ['Ethiopia Filter 250g', 2]] },
  { id: '10485', cafe: 'Parkside Deli', date: 'Mon 9:05am', items: [['Morning Blend 250g', 5], ['Chai Powder 1kg', 1]] },
];

const calculated = new Set();
const selected = new Set();

const $ = (sel) => document.querySelector(sel);
const kg = (grams) => `${(Math.round(grams / 10) / 100).toFixed(2)} kg`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const chipClass = (product) => (RECIPES[product] ? 'chip-ok' : NEEDS_RECIPE.has(product) ? 'chip-warn' : 'chip-none');

function renderOrders() {
  const hide = $('#demo-hide').checked;
  $('#demo-orders').innerHTML = ORDERS.map((o) => {
    const isCalc = calculated.has(o.id);
    if (hide && isCalc) return '';
    const chips = o.items.map(([p, n]) => `<i class="chip ${chipClass(p)}">${esc(p)} · ${n}</i>`).join('');
    return `<li class="${isCalc ? 'is-calculated' : ''}">
      <label>
        <input type="checkbox" value="${o.id}" ${selected.has(o.id) ? 'checked' : ''} aria-label="Order ${o.id} from ${esc(o.cafe)}">
        <span>
          <span class="cs-demo-order-top"><strong>${esc(o.cafe)}</strong><span>Invoice ${o.id} · ${o.date}</span>${isCalc ? '<span class="cs-badge">Calculated</span>' : ''}</span>
          <span class="cs-chips">${chips}</span>
        </span>
      </label>
    </li>`;
  }).join('');
  if (!$('#demo-orders').innerHTML.trim()) {
    $('#demo-orders').innerHTML = '<li class="cs-demo-hint" style="padding:14px 4px">All orders are calculated. Untick “Hide calculated” to see them.</li>';
  }
  updateButton();
}

function updateButton() {
  const n = selected.size;
  $('#demo-calc').disabled = n === 0;
  $('#demo-calc').textContent = n ? `Calculate ${n} order${n > 1 ? 's' : ''}` : 'Calculate orders';
  $('#demo-hint').textContent = n ? 'Press calculate to work out the roast.' : 'Tick at least one order to calculate.';
}

function calculate() {
  const products = new Map();
  ORDERS.filter((o) => selected.has(o.id)).forEach((o) =>
    o.items.forEach(([p, n]) => products.set(p, (products.get(p) || 0) + n))
  );

  const beans = new Map();
  const blends = new Map();
  const missing = [];
  products.forEach((qty, product) => {
    const recipe = RECIPES[product];
    if (!recipe) {
      if (NEEDS_RECIPE.has(product)) missing.push(`${product} (${qty})`);
      return;
    }
    let perUnit = 0;
    Object.entries(recipe.beans).forEach(([bean, grams]) => {
      beans.set(bean, (beans.get(bean) || 0) + grams * qty);
      perUnit += grams;
    });
    blends.set(recipe.blend, (blends.get(recipe.blend) || 0) + perUnit * qty);
  });

  const beanRows = [...beans].sort((a, b) => b[1] - a[1]);
  const total = beanRows.reduce((sum, [, g]) => sum + g, 0);
  $('#demo-beans tbody').innerHTML = beanRows.length
    ? beanRows.map(([b, g]) => `<tr><td>${esc(b)}</td><td>${kg(g)}</td></tr>`).join('')
    : '<tr><td colspan="2">No coffee with a recipe in these orders.</td></tr>';
  $('#demo-beans tfoot').innerHTML = beanRows.length ? `<tr><td>Total green beans</td><td>${kg(total)}</td></tr>` : '';
  $('#demo-blends tbody').innerHTML = [...blends].sort((a, b) => b[1] - a[1])
    .map(([b, g]) => `<tr><td>${esc(b)}</td><td>${kg(g)}</td></tr>`).join('') || '<tr><td colspan="2">Nothing to roast.</td></tr>';

  const warn = $('#demo-warn');
  if (missing.length) {
    warn.hidden = false;
    warn.innerHTML = `<strong>Heads up:</strong> ${missing.map(esc).join(', ')} ${missing.length > 1 ? "don't" : "doesn't"} have a recipe yet, so ${missing.length > 1 ? "they're" : "it's"} not in the totals. In the real planner, one click adds the recipe, or marks it as not coffee.`;
  } else {
    warn.hidden = true;
  }

  const count = selected.size;
  $('#demo-done').textContent = `Worked out from ${count} order${count > 1 ? 's' : ''} in a split second. Those orders are now marked as calculated, so they won't be counted twice.`;
  $('#demo-empty').hidden = true;
  $('#demo-output').hidden = false;

  selected.forEach((id) => calculated.add(id));
  selected.clear();
  renderOrders();
  if (window.matchMedia('(max-width: 900px)').matches) {
    $('#demo-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderRecipes() {
  $('#demo-recipes').innerHTML = Object.entries(RECIPES).map(([product, r]) => {
    const rows = Object.entries(r.beans).map(([b, g]) => `<p><span>${esc(b)}</span><b>${g.toLocaleString('en-AU')} g</b></p>`).join('');
    return `<div><p><span>${esc(product)}</span><span>${esc(r.blend)}</span></p>${rows}</div>`;
  }).join('') + `<div><p><span>No recipe yet</span></p><p><span>Ethiopia Filter 250g</span></p><p><span>Chai Powder 1kg</span></p><p style="color:var(--muted)"><span>Takeaway Cups: not coffee, ignored</span></p></div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!$('#demo-orders')) return;
  ORDERS.slice(0, 2).forEach((o) => selected.add(o.id)); // start with two ticked so it's obvious what to do
  renderOrders();
  renderRecipes();
  $('#demo-orders').addEventListener('change', (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      e.target.checked ? selected.add(e.target.value) : selected.delete(e.target.value);
      updateButton();
    }
  });
  $('#demo-hide').addEventListener('change', renderOrders);
  $('#demo-calc').addEventListener('click', calculate);
});
