/* popup.js — خواندن/ذخیره تنظیمات در chrome.storage.sync */
(function () {
  'use strict';

  const DEFAULTS = {
    enabled: true,
    highlight: true,
    hlColors: ['#ffeb3b', '#69f0ae', '#ff80ab'],
    sites: { claude: true, chatgpt: true, openai: true, gemini: true, deepseek: true, grok: true, perplexity: true, qwen: true, meta: true, kimi: true, zai: true },
    font: 'vazirmatn',
    customFont: '',
    fontSize: 100,
    lineHeight: 1.9,
    digits: 'off'
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    enabled: $('enabled'),
    highlight: $('highlight'),
    hlColor0: $('hlColor0'),
    hlColor1: $('hlColor1'),
    hlColor2: $('hlColor2'),
    hlReset: $('hlReset'),
    claude: $('site-claude'),
    chatgpt: $('site-chatgpt'),
    openai: $('site-openai'),
    gemini: $('site-gemini'),
    deepseek: $('site-deepseek'),
    grok: $('site-grok'),
    perplexity: $('site-perplexity'),
    qwen: $('site-qwen'),
    meta: $('site-meta'),
    kimi: $('site-kimi'),
    zai: $('site-zai'),
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
    els.highlight.checked = s.highlight !== false;
    const savedColors = Array.isArray(s.hlColors) && s.hlColors.length === 3
      ? s.hlColors : DEFAULTS.hlColors;
    [els.hlColor0, els.hlColor1, els.hlColor2].forEach((el, i) => { el.value = savedColors[i]; });
    els.claude.checked = s.sites.claude !== false;
    els.chatgpt.checked = s.sites.chatgpt !== false;
    els.openai.checked = s.sites.openai !== false;
    els.gemini.checked = s.sites.gemini !== false;
    els.deepseek.checked = s.sites.deepseek !== false;
    els.grok.checked = s.sites.grok !== false;
    els.perplexity.checked = s.sites.perplexity !== false;
    els.qwen.checked = s.sites.qwen !== false;
    els.meta.checked = s.sites.meta !== false;
    els.kimi.checked = s.sites.kimi !== false;
    els.zai.checked = s.sites.zai !== false;
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
    const swatches = [els.hlColor0, els.hlColor1, els.hlColor2];
    // درخشش هر نمونه‌رنگ با همان رنگ خودش
    const paintSwatches = () => swatches.forEach((el) => {
      el.style.boxShadow = `0 0 10px ${el.value}66`;
    });
    swatches.forEach((el) => el.addEventListener('input', paintSwatches));
    els.hlReset.addEventListener('click', () => {
      swatches.forEach((el, i) => { el.value = DEFAULTS.hlColors[i]; });
      paintSwatches();
      scheduleSave();
    });
    paintSwatches();
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
      highlight: els.highlight.checked,
      hlColors: [els.hlColor0.value, els.hlColor1.value, els.hlColor2.value],
      sites: {
        claude: els.claude.checked,
        chatgpt: els.chatgpt.checked,
        openai: els.openai.checked,
        gemini: els.gemini.checked,
        deepseek: els.deepseek.checked,
        grok: els.grok.checked,
        perplexity: els.perplexity.checked,
        qwen: els.qwen.checked,
        meta: els.meta.checked,
        kimi: els.kimi.checked,
        zai: els.zai.checked
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
