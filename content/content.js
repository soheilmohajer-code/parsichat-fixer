/* content.js — اسکریپت محتوایی اصلی (Vanilla JS، بدون فریم‌ورک) */
(function () {
  'use strict';

  const BIDI = window.PCF_BIDI;
  const SEL = window.PCF_SELECTORS;
  const MARK = 'data-pcf-done'; // علامت جلوگیری از پردازش تکراری پرهزینه

  const DEFAULTS = {
    enabled: true,
    sites: { claude: true, chatgpt: true, openai: true, gemini: true, deepseek: true, grok: true },
    font: 'vazirmatn',   // 'vazirmatn' | 'site' | 'custom'
    customFont: '',
    fontSize: 100,       // درصد
    lineHeight: 1.9,
    digits: 'off'        // 'off' | 'fa' | 'en'
  };

  let settings = { ...DEFAULTS, sites: { ...DEFAULTS.sites } };
  let siteKey = detectSiteKey();
  let observer = null;
  let pending = new Set();
  let debounceTimer = 0;
  let inputsWired = new WeakSet();

  // ---------------- راه‌اندازی ----------------
  init();

  async function init() {
    try {
      const stored = await chrome.storage.sync.get(null);
      settings = { ...DEFAULTS, ...stored, sites: { ...DEFAULTS.sites, ...(stored.sites || {}) } };
    } catch (e) {
      // storage در دسترس نیست (مثلاً پیش‌نمایش) → با پیش‌فرض ادامه بده
      settings = { ...DEFAULTS, sites: { ...DEFAULTS.sites } };
    }
    applyRootSettings();
    ensureFontLoaded();
    if (isActiveForThisSite()) {
      processPage();
      startObserver();
      wireInputs(document);
      scheduleSweeps();
    }
    chrome.storage.onChanged.addListener(onSettingsChanged);
  }

  function detectSiteKey() {
    const h = location.hostname || '';
    if (SEL.claude.host.test(h)) return 'claude';
    if (SEL.chatgpt.host.test(h)) return 'chatgpt';
    if (SEL.openai.host.test(h)) return 'openai';
    if (SEL.gemini.host.test(h)) return 'gemini';
    if (SEL.deepseek.host.test(h)) return 'deepseek';
    if (SEL.grok.host.test(h)) return 'grok';
    return 'chatgpt';
  }

  function isActiveForThisSite() {
    return settings.enabled && settings.sites[siteKey] !== false;
  }

  // لود مطمئن فونت با FontFace API و آدرس دقیق افزونه.
  // (اگر @font-face داخل styles.css در بعضی صفحات resolve نشود، این مسیر جایگزین می‌شود)
  let fontLoaded = false;
  async function ensureFontLoaded() {
    if (fontLoaded || settings.font !== 'vazirmatn') return;
    try {
      const faces = [
        { weight: '400', file: 'Vazirmatn-Regular.woff2' },
        { weight: '500', file: 'Vazirmatn-Medium.woff2' },
        { weight: '700', file: 'Vazirmatn-Bold.woff2' }
      ];
      for (const f of faces) {
        const face = new FontFace('Vazirmatn',
          `url("${chrome.runtime.getURL('fonts/' + f.file)}") format("woff2")`,
          {
            weight: f.weight,
            style: 'normal',
            display: 'swap',
            // فقط حروف فارسی/عربی (مثل styles.css) تا انگلیسی و کد دست نخورند
            unicodeRange: 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF'
          });
        document.fonts.add(face);
        await face.load();
      }
      await document.fonts.load('16px Vazirmatn', 'فارسی تست');
      fontLoaded = true;
    } catch (e) { /* fallback: همان @font-face داخل styles.css */ }
  }

  // متغیرهای CSS روی <html> برای فونت/اندازه/ارتفاع خط (popup آن‌ها را تغییر می‌دهد)
  function applyRootSettings() {
    const root = document.documentElement;
    root.classList.toggle('pcf-off', !isActiveForThisSite());
    root.classList.toggle('pcf-font-vazir', settings.font === 'vazirmatn');
    root.classList.toggle('pcf-font-site', settings.font === 'site');
    root.classList.toggle('pcf-font-custom', settings.font === 'custom');
    root.style.setProperty('--pcf-font-size', (settings.fontSize || 100) + '%');
    root.style.setProperty('--pcf-line-height', String(settings.lineHeight || 1.9));
    if (settings.font === 'custom' && settings.customFont) {
      root.style.setProperty('--pcf-custom-font', "'" + settings.customFont.replace(/['"\\]/g, '') + "'");
    } else {
      root.style.removeProperty('--pcf-custom-font');
    }
  }

  function onSettingsChanged(changes, area) {
    if (area !== 'sync') return;
    for (const [k, v] of Object.entries(changes)) {
      if (k === 'sites') settings.sites = { ...settings.sites, ...v.newValue };
      else settings[k] = v.newValue;
    }
    applyRootSettings();
    fontLoaded = false;
    ensureFontLoaded();
    if (isActiveForThisSite()) {
      clearMarks(); // تنظیم عوض شده → همه را دوباره پردازش کن
      processPage();
      startObserver();
    } else {
      stopObserver();
      cleanup(); // غیرفعال شد → صفحه را به حالت اول برگردان
    }
  }

  // ---------------- پردازش بلوک‌ها ----------------

  /** جهت یک بلوک را تشخیص بده و dir + کلاس مناسب بگذار. ارزان و idempotent. */
  function processBlock(el) {
    if (!(el instanceof Element)) return;
    if (el.closest('pre, code, kbd, samp')) return; // کد را جهت‌دهی نکن (CSS آن را LTR نگه می‌دارد)
    // متن را بدون محتوای کدهای تودرتو بسنج تا کد جهت را خراب نکند
    const text = el.innerText || el.textContent || '';
    if (!text.trim()) return;
    const dir = BIDI.detectDirection(text);
    const prev = el.getAttribute('dir');
    const want = dir === 'rtl' ? 'rtl' : 'ltr';
    if (prev !== want) el.setAttribute('dir', want);
    el.classList.toggle('pcf-rtl', dir === 'rtl');
    el.classList.toggle('pcf-ltr', dir !== 'rtl');
    if (settings.digits !== 'off' && dir === 'rtl' && !el.closest('textarea, input, [contenteditable="true"]')) {
      // فقط متن فارسی؛ کد قبلاً در convertDigitsInElement مستثنا شده.
      // داخل باکس ورودی در حال تایپ ارقام را دست نزن (با کاربر نجنگ).
      BIDI.convertDigitsInElement(el, settings.digits);
    }
    el.setAttribute(MARK, '1');
  }

  /** جدول: اگر اکثریت سلول‌ها فارسی بودند کل جدول RTL شود. */
  function processTable(table) {
    if (!(table instanceof Element)) return;
    const cells = table.querySelectorAll('td, th');
    if (!cells.length) return;
    let fa = 0;
    const sample = Math.min(cells.length, 12);
    for (let i = 0; i < sample; i++) {
      const t = cells[i].innerText || cells[i].textContent || '';
      if (BIDI.detectDirection(t) === 'rtl') fa++;
    }
    const rtl = fa * 2 >= sample;
    table.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    table.classList.toggle('pcf-table-rtl', rtl);
    table.setAttribute(MARK, '1');
  }

  /** ایزوله‌کردن کد درون‌خطی داخل جمله فارسی (جلوگیری از قاطی‌شدن ترتیب کلمات). */
  function isolateInlineCode(root) {
    const codes = root.querySelectorAll
      ? root.querySelectorAll('code:not(pre code)')
      : [];
    for (const c of codes) {
      if (!c.hasAttribute('dir')) c.setAttribute('dir', 'ltr');
      c.classList.add('pcf-code-inline');
    }
  }

  function processRoot(root) {
    if (!isActiveForThisSite()) return;
    if (root instanceof Element && root.matches && root.matches('pre, code')) return;
    const scope = root instanceof Element ? root : document;

    // پیام‌های سایت (کانتینرها): plaintext تا قبل از اجرای کامل JS هم درست باشند
    const siteSel = SEL[siteKey] || SEL.chatgpt;
    const msgSel = siteSel.messages + ', ' + SEL.common.blocks;

    let blocks;
    if (scope === document) {
      blocks = document.querySelectorAll(msgSel);
    } else if (scope.matches && scope.matches(msgSel)) {
      processBlock(scope);
      blocks = scope.querySelectorAll(msgSel);
    } else {
      blocks = scope.querySelectorAll ? scope.querySelectorAll(msgSel) : [];
      // خود scope اگر بلوک متنی ساده است (مثلاً p تازه‌اضافه‌شده)
    }

    for (const el of blocks) {
      // عناصری که قبلاً درست جهت گرفتند و جهتشان عوض نشده را رد کن (ارزان)
      if (el.hasAttribute(MARK)) {
        // در حالت استریم متن عوض می‌شود؛ با مقایسه سریع جهت، تغییر را تشخیص بده
        const t = (el.innerText || el.textContent || '').slice(0, 400);
        const cur = BIDI.detectDirection(t);
        const has = el.getAttribute('dir');
        if ((cur === 'rtl' && has === 'rtl') || (cur !== 'rtl' && has === 'ltr')) continue;
      }
      processBlock(el);
    }

    const tables = scope === document
      ? document.querySelectorAll('table')
      : (scope.querySelectorAll ? scope.querySelectorAll('table') : []);
    for (const t of tables) {
      if (!t.hasAttribute(MARK)) processTable(t);
    }
    isolateInlineCode(scope);
    wireInputs(scope);
  }

  function processPage() {
    processRoot(document);
  }

  // جاروی تأخیری برای SPAهایی مثل Claude که محتوا را دیر رندر می‌کنند،
  // به‌علاوه تشخیص ناوبری داخلی (تعویض چت بدون رفرش صفحه).
  function scheduleSweeps() {
    const sweep = () => { if (isActiveForThisSite()) processPage(); };
    window.addEventListener('load', sweep);
    setTimeout(sweep, 1500);
    setTimeout(sweep, 4000);
    // history در ایزوله‌ورلد قابل شنود نیست؛ تغییر URL را با polling ارزان رصد کن
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(sweep, 400);
      }
    }, 1000);
  }

  function clearMarks() {
    document.querySelectorAll('[' + MARK + ']').forEach((el) => el.removeAttribute(MARK));
  }

  /** حذف آثار افزونه وقتی کاربر آن را خاموش می‌کند. */
  function cleanup() {
    document.querySelectorAll('.pcf-rtl').forEach((el) => {
      el.classList.remove('pcf-rtl');
      if (el.getAttribute(MARK)) el.removeAttribute('dir');
    });
    document.querySelectorAll('.pcf-ltr').forEach((el) => el.classList.remove('pcf-ltr'));
    document.querySelectorAll('[' + MARK + ']').forEach((el) => el.removeAttribute(MARK));
  }

  // ---------------- باکس ورودی (تایپ زنده) ----------------

  function wireInputs(scope) {
    const siteSel = SEL[siteKey] || SEL.chatgpt;
    const inputs = scope === document
      ? document.querySelectorAll(siteSel.inputs + ', textarea, [contenteditable="true"]')
      : (scope.querySelectorAll ? scope.querySelectorAll(siteSel.inputs + ', textarea, [contenteditable="true"]') : []);
    for (const inp of inputs) {
      if (inputsWired.has(inp)) continue;
      inputsWired.add(inp);
      inp.addEventListener('input', () => updateInputDir(inp));
      updateInputDir(inp);
    }
    // خود scope هم ممکن است input باشد
    if (scope instanceof Element && (scope.tagName === 'TEXTAREA' || scope.isContentEditable)) {
      if (!inputsWired.has(scope)) {
        inputsWired.add(scope);
        scope.addEventListener('input', () => updateInputDir(scope));
        updateInputDir(scope);
      }
    }
  }

  function updateInputDir(inp) {
    if (!isActiveForThisSite()) return;
    let text = '';
    if (inp.tagName === 'TEXTAREA' || inp.tagName === 'INPUT') text = inp.value || '';
    else text = inp.innerText || inp.textContent || '';
    const dir = BIDI.detectDirection(text.trim() ? text : (inp.getAttribute('placeholder') || ''));
    inp.setAttribute('dir', dir === 'rtl' ? 'rtl' : 'ltr');
    inp.classList.toggle('pcf-input-rtl', dir === 'rtl');
  }

  // ---------------- MutationObserver با debounce (پشتیبانی استریم) ----------------

  function startObserver() {
    stopObserver();
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData') {
          const el = m.target.parentElement;
          if (el) pending.add(el.closest('p, li, div, td, th, h1, h2, h3, h4, blockquote') || el);
        } else if (m.type === 'childList') {
          for (const n of m.addedNodes) {
            if (n.nodeType === 1) pending.add(n);
            else if (n.nodeType === 3 && n.parentElement) pending.add(n.parentElement);
          }
        } else if (m.type === 'attributes') {
          pending.add(m.target);
        }
      }
      if (pending.size === 0) return;
      clearTimeout(debounceTimer);
      // ۱۵۰ms: تعادل بین پوشش استریم زنده و عملکرد؛ بدون پرش چون فقط dir/class عوض می‌شود
      debounceTimer = setTimeout(flushPending, 150);
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function flushPending() {
    const batch = [...pending];
    pending.clear();
    // سقف هر بچ برای جلوگیری از فریز در استریم‌های سنگین؛
    // اضافه‌ها دور ریخته نمی‌شوند، در بچ بعدی پردازش می‌شوند
    const MAX = 300;
    for (let i = 0; i < Math.min(batch.length, MAX); i++) {
      const node = batch[i];
      if (!node.isConnected) continue;
      try {
        processRoot(node);
      } catch (e) { /* یک بلوک خراب نباید بقیه را متوقف کند */ }
    }
    if (batch.length > MAX) {
      for (let i = MAX; i < batch.length; i++) pending.add(batch[i]);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flushPending, 50);
    }
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    clearTimeout(debounceTimer);
    pending.clear();
  }
})();
