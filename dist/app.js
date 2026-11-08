const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const closeMenu = () => {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
};
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
window.matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('#service').value = link.dataset.service;
    document.querySelector('#form-result').hidden = true;
  });
});

const form = document.querySelector('#quote-form');
const result = document.querySelector('#form-result');
let enquiry = '';
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const value = name => String(data.get(name) || '').trim();
  // No pretend submission: prepare the visitor's message for their own email app.
  enquiry = `Hi Sunday Solutions,\n\nI'd like a free quote.\n\nName: ${value('name')}\nBusiness: ${value('business') || 'Not provided'}\nEmail: ${value('email')}\nPhone: ${value('phone') || 'Not provided'}\nHelp with: ${value('service')}\n\n${value('message')}\n\nThanks,\n${value('name')}`;
  const subject = `Quote enquiry: ${value('service')}${value('business') ? ' — ' + value('business') : ''}`;
  document.querySelector('#email-draft').href = `mailto:hello@sundaysolutions.com.au?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(enquiry)}`;
  document.querySelector('#enquiry-copy').value = enquiry;
  document.querySelector('#enquiry-copy').hidden = true;
  document.querySelector('#copy-status').textContent = '';
  document.querySelector('#copy-enquiry').textContent = 'Copy enquiry';
  result.hidden = false;
  result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
});
form.addEventListener('input', () => { result.hidden = true; });
form.addEventListener('change', () => { result.hidden = true; });
document.querySelector('#copy-enquiry').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(enquiry);
    document.querySelector('#copy-enquiry').textContent = 'Copied ✓';
    document.querySelector('#copy-status').textContent = 'Copied. Paste it into an email to hello@sundaysolutions.com.au.';
  } catch {
    const copyField = document.querySelector('#enquiry-copy');
    copyField.hidden = false;
    copyField.focus();
    copyField.select();
    document.querySelector('#copy-status').textContent = 'Select and copy the enquiry below.';
  }
});

const privacyDialog = document.querySelector('#privacy-dialog');
document.querySelector('#privacy-open').addEventListener('click', () => privacyDialog.showModal());
privacyDialog.querySelectorAll('.dialog-close, .dialog-done').forEach(button => button.addEventListener('click', () => privacyDialog.close()));
privacyDialog.addEventListener('click', event => {
  const bounds = privacyDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) privacyDialog.close();
});
