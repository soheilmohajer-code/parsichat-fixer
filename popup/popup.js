/* popup.js — خواندن/ذخیره تنظیمات در chrome.storage.sync */
(function () {
  'use strict';

  const DEFAULTS = {
    enabled: true,
    sites: { claude: true, chatgpt: true, openai: true, gemini: true, deepseek: true, grok: true },
    font: 'vazirmatn',
    customFont: '',
    fontSize: 100,
    lineHeight: 1.9,
    digits: 'off'
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    enabled: $('enabled'),
    claude: $('site-claude'),
    chatgpt: $('site-chatgpt'),
    openai: $('site-openai'),
    gemini: $('site-gemini'),
    deepseek: $('site-deepseek'),
    grok: $('site-grok'),
    customFont: $('customFont'),
    fontSize: $('fontSize'),
    fontSizeVal: $('fontSizeVal'),
    lineHeight: $('lineHeight'),
    lineHeightVal: $('lineHeightVal'),
    status: $('status')
  };
  const fontRadios = [...document.querySelectorAll('input[name="font"]')];
  const digitRadios = [...document.querySelectorAll('input[name="digits"]')];
  const picked = (radios, fallback) =>
    (radios.find((r) => r.checked) || {}).value || fallback;

  let saveTimer = 0;

  init();

  async function init() {
    const stored = await chrome.storage.sync.get(null);
    const s = { ...DEFAULTS, ...stored, sites: { ...DEFAULTS.sites, ...(stored.sites || {}) } };
    els.enabled.checked = s.enabled !== false;
    els.claude.checked = s.sites.claude !== false;
    els.chatgpt.checked = s.sites.chatgpt !== false;
    els.openai.checked = s.sites.openai !== false;
    els.gemini.checked = s.sites.gemini !== false;
    els.deepseek.checked = s.sites.deepseek !== false;
    els.grok.checked = s.sites.grok !== false;
    fontRadios.forEach((r) => { r.checked = r.value === (s.font || 'vazirmatn'); });
    els.customFont.value = s.customFont || '';
    els.customFont.hidden = picked(fontRadios, 'vazirmatn') !== 'custom';
    els.fontSize.value = s.fontSize || 100;
    els.fontSizeVal.textContent = s.fontSize || 100;
    els.lineHeight.value = s.lineHeight || 1.9;
    els.lineHeightVal.textContent = s.lineHeight || 1.9;
    digitRadios.forEach((r) => { r.checked = r.value === (s.digits || 'off'); });

    document.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', scheduleSave);
      el.addEventListener('input', scheduleSave);
    });
    fontRadios.forEach((r) => {
      r.addEventListener('change', () => {
        els.customFont.hidden = picked(fontRadios, 'vazirmatn') !== 'custom';
      });
    });
    els.fontSize.addEventListener('input', () => { els.fontSizeVal.textContent = els.fontSize.value; paintRange(els.fontSize); });
    els.lineHeight.addEventListener('input', () => { els.lineHeightVal.textContent = els.lineHeight.value; paintRange(els.lineHeight); });
    paintRange(els.fontSize);
    paintRange(els.lineHeight);
  }

  // درصد پرشدن نوار اسلایدر (برای گرادیان CSS)
  function paintRange(el) {
    const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty('--fill', pct + '%');
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 250); // ذخیره debounced تا slider روان باشد
  }

  async function save() {
    const data = {
      enabled: els.enabled.checked,
      sites: {
        claude: els.claude.checked,
        chatgpt: els.chatgpt.checked,
        openai: els.openai.checked,
        gemini: els.gemini.checked,
        deepseek: els.deepseek.checked,
        grok: els.grok.checked
      },
      font: picked(fontRadios, 'vazirmatn'),
      customFont: els.customFont.value.trim(),
      fontSize: Number(els.fontSize.value),
      lineHeight: Number(els.lineHeight.value),
      digits: picked(digitRadios, 'off')
    };
    await chrome.storage.sync.set(data);
    flash('✓ ذخیره شد');
  }

  let flashTimer = 0;
  function flash(msg) {
    els.status.textContent = msg;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { els.status.textContent = ''; }, 1200);
  }
})();
