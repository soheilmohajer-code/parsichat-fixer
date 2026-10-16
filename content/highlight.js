/* highlight.js — هایلایتر متن چت با ۳ رنگ قابل تنظیم (Vanilla JS)
 * رفتار: متن را سلکت کن → نوار شناور ظاهر می‌شود → کلیک = هایلایت.
 * دکمه پاک‌کن هایلایتِ لمس‌شده را پاک می‌کند.
 * هایلایت‌ها به‌تفکیک هر گفتگو ذخیره دائمی می‌شوند و بعد از رفرش برمی‌گردند.
 * روی input/textarea کار نمی‌کند.
 */
(function () {
  'use strict';

  const HL_CLASS = 'pcf-hl';
  const DEFAULT_COLORS = ['#ffeb3b', '#69f0ae', '#ff80ab'];
  let hlColors = [...DEFAULT_COLORS];

  // hex به rgba با شفافیت ماژیک‌وار (تا روی تم روشن و تیره خوانا بماند)
  function hexToRgba(hex, alpha) {
    let h = String(hex || '').replace('#', '');
    if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return `rgba(255, 235, 59, ${alpha})`;
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  let enabled = true;
  let bar = null;

  init();

  async function init() {
    try {
      const s = await chrome.storage.sync.get(['highlight', 'hlColors']);
      enabled = s.highlight !== false;
      if (Array.isArray(s.hlColors) && s.hlColors.length === 3) hlColors = s.hlColors.slice();
    } catch (e) { /* پیش‌فرض روشن */ }
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.highlight) {
        enabled = changes.highlight.newValue !== false;
        if (!enabled) hideBar();
      }
      if (area === 'sync' && changes.hlColors && Array.isArray(changes.hlColors.newValue)) {
        hlColors = changes.hlColors.newValue.slice(0, 3);
        if (hlColors.length !== 3) hlColors = [...DEFAULT_COLORS];
      }
    });
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousedown', (e) => {
      if (bar && !bar.contains(e.target)) hideBar();
    });
    document.addEventListener('scroll', hideBar, true);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideBar();
    });
    // بازیابی هایلایت‌های ذخیره‌شده، بعد از کامل شدن رندر پیام‌ها
    setTimeout(restoreHighlights, 2000);
    setTimeout(restoreHighlights, 5000);
    let lastHlUrl = location.href;
    setInterval(() => {
      if (location.href !== lastHlUrl) {
        lastHlUrl = location.href;
        setTimeout(restoreHighlights, 1500);
      }
    }, 2000);
  }

  function onMouseUp(e) {
    if (!enabled) return;
    if (bar && bar.contains(e.target)) return; // کلیک روی خود نوار
    // کمی صبر تا سلکشن مرورگر کامل شود
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) { hideBar(); return; }
      const range = sel.getRangeAt(0);
      if (!validRange(range)) { hideBar(); return; }
      showBar();
    }, 10);
  }

  function validRange(range) {
    if (!range.toString().trim()) return false;
    const node = range.commonAncestorContainer;
    const el = node instanceof Element ? node : node.parentElement;
    if (!el || !document.contains(el)) return false;
    // داخل باکس ورودی هایلایت بی‌معناست (textarea/contenteditable)
    if (el.closest('textarea, input')) return false;
    if (el.closest('[contenteditable="true"]') && !el.closest('.pcf-allow-hl')) return false;
    return true;
  }

  function showBar() {
    hideBar();
    bar = document.createElement('div');
    bar.id = 'pcf-hl-bar';
    hlColors.forEach((color) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pcf-hl-dot';
      b.title = 'هایلایت';
      b.style.background = color;
      b.addEventListener('mousedown', (e) => e.preventDefault()); // سلکشن نپرد
      b.addEventListener('click', () => applyHighlight(color));
      bar.appendChild(b);
    });
    const eraser = document.createElement('button');
    eraser.type = 'button';
    eraser.className = 'pcf-hl-erase';
    eraser.title = 'پاک کردن هایلایت';
    // آیکون پاک‌کن (SVG) تا کاربر بفهمد دکمه پاک‌کن است، نه بستن
    eraser.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>';
    eraser.addEventListener('mousedown', (e) => e.preventDefault());
    eraser.addEventListener('click', eraseInSelection);
    bar.appendChild(eraser);
    document.body.appendChild(bar);
    placeBar();
  }

  function placeBar() {
    const sel = window.getSelection();
    if (!bar || !sel.rangeCount) return;
    const r = sel.getRangeAt(0).getBoundingClientRect();
    const bw = bar.offsetWidth;
    const bh = bar.offsetHeight;
    let x = r.left + r.width / 2 - bw / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - bw - 8));
    let y = r.top - bh - 10;
    if (y < 8) y = r.bottom + 10;
    bar.style.left = x + 'px';
    bar.style.top = y + 'px';
  }

  function hideBar() {
    if (bar) {
      bar.remove();
      bar = null;
    }
  }

  function applyHighlight(color) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0).cloneRange();
    if (!validRange(range)) { hideBar(); return; }
    // غول‌کش: سلکشن چندبلوکی یا خیلی بلند، چیدمان صفحه را می‌شکند → هایلایت نزن
    const txt = range.toString();
    if (txt.length > 1000 || hasBlockNodes(range)) { hideBar(); return; }
    // هایلایت تودرتو نکن: قبلی‌های داخل رنج را اول باز کن
    unwrapSpans(collectSpans(range, true));
    const span = document.createElement('span');
    span.className = HL_CLASS;
    span.dataset.pcfColor = color;
    span.style.background = hexToRgba(color, 0.45);
    span.style.boxShadow = `0 0 0 1px ${hexToRgba(color, 0.3)}`;
    try {
      range.surroundContents(span);
    } catch (e) {
      // رنج پیچیده (چند بلوکی) → استخراج و بسته‌بندی
      span.appendChild(range.extractContents());
      range.insertNode(span);
    }
    sel.removeAllRanges();
    savePage(); // ذخیره دائمی
    hideBar();
  }

  // آیا سلکشن شامل تگ بلوکی است؟ (هایلایت چندبلوکی چیدمان را می‌شکند)
  function hasBlockNodes(range) {
    try {
      const frag = range.cloneContents();
      return !!frag.querySelector('div, p, table, pre, ul, ol, li, article, section, blockquote, h1, h2, h3, h4, h5, h6');
    } catch (e) { return false; }
  }

  // اسپن‌های هایلایت داخل رنج (partial=true: حتی نصفه‌ها)
  function collectSpans(range, partial) {
    const found = [];
    const sel = window.getSelection();
    document.querySelectorAll('span.' + HL_CLASS).forEach((s) => {
      try {
        if (sel.containsNode(s, partial)) found.push(s);
      } catch (e) { /* نادیده */ }
    });
    return found;
  }

  function eraseInSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    // هر هایلایتی که سلکشن لمسش کند (حتی نصفه) کامل باز می‌شود
    unwrapSpans(collectSpans(range, true));
    sel.removeAllRanges();
    savePage(); // ذخیره دائمی (حذف‌شده‌ها از لیست می‌روند)
    hideBar();
  }

  function unwrapSpans(spans) {
    for (const s of spans) {
      const parent = s.parentNode;
      if (!parent) continue;
      while (s.firstChild) parent.insertBefore(s.firstChild, s);
      parent.removeChild(s);
      parent.normalize();
    }
  }

  // ---------------- ذخیره دائمی هایلایت (storage.local) ----------------
  // به‌جای آدرس شکننده DOM، «اثرانگشت» متن ذخیره می‌شود: ۴۰ حرف قبل + خود
  // متن + ۴۰ حرف بعد، به‌تفکیک آدرس هر گفتگو. با رفرش دوباره پیدا و اعمال می‌شود.
  const HL_STORE_KEY = 'pcf_hl';
  const HL_CTX = 40;
  const HL_MAX_TEXT = 200;
  const HL_MAX_URLS = 200;
  const HL_MAX_PER_URL = 200;
  const HL_TTL = 90 * 24 * 3600 * 1000; // گفتگوهای قدیمی‌تر از ۹۰ روز تمیز می‌شوند
  let saveTimer = 0;

  function normUrl(href) {
    try {
      const u = new URL(href);
      return u.origin + u.pathname; // query/hash که با هر بازدید عوض می‌شود، حذف
    } catch (e) {
      return String(href).split(/[?#]/)[0];
    }
  }

  // متن خالص قبل (dir<0) یا بعد (dir>0) اسپن، داخل همان بلوک
  function siblingText(block, span, dir) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let first = -1, last = -1;
    nodes.forEach((n, i) => {
      if (span.contains(n)) { if (first < 0) first = i; last = i; }
    });
    if (first < 0) return '';
    let out = '';
    if (dir < 0) {
      for (let i = first - 1; i >= 0 && out.length < HL_CTX; i--) {
        out = nodes[i].nodeValue + out;
      }
      return out.slice(-HL_CTX);
    }
    for (let i = last + 1; i < nodes.length && out.length < HL_CTX; i++) {
      out += nodes[i].nodeValue;
    }
    return out.slice(0, HL_CTX);
  }

  function anchorSpan(span) {
    const text = span.textContent || '';
    if (!text.trim() || text.length > 1000) return null; // غول‌ها ذخیره نمی‌شوند
    const block = span.closest('p, li, td, th, blockquote, h1, h2, h3, h4, div');
    if (!block || block.closest('textarea, input')) return null;
    const t = text.length > HL_MAX_TEXT ? text.slice(0, HL_MAX_TEXT) : text;
    return {
      before: siblingText(block, span, -1),
      text: t,
      after: siblingText(block, span, 1),
      color: span.dataset.pcfColor || DEFAULT_COLORS[0],
      ts: Date.now()
    };
  }

  // پیچیدن دقیق بازه [start, start+len) از متن بلوک داخل اسپن هایلایت
  function wrapByOffset(block, start, len, color) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let pos = 0, si = -1, soff = 0;
    for (let i = 0; i < nodes.length; i++) {
      const L = nodes[i].nodeValue.length;
      if (si < 0 && pos + L > start) { si = i; soff = start - pos; }
      pos += L;
    }
    if (si < 0) return false;
    // اگر قبلاً هایلایت شده، رد کن (جلوگیری از تودرتو شدن در بازیابی تکراری)
    const sp = nodes[si].parentElement;
    if (sp && sp.closest('span.' + HL_CLASS)) return false;
    let remain = len, ei = si, eoff = soff;
    for (let i = si; i < nodes.length && remain > 0; i++) {
      const avail = nodes[i].nodeValue.length - (i === si ? soff : 0);
      if (avail >= remain) { ei = i; eoff = (i === si ? soff : 0) + remain; remain = 0; }
      else remain -= avail;
    }
    if (remain > 0) return false;
    const range = document.createRange();
    try {
      range.setStart(nodes[si], soff);
      range.setEnd(nodes[ei], eoff);
    } catch (e) { return false; }
    const span = document.createElement('span');
    span.className = HL_CLASS;
    span.dataset.pcfColor = color;
    span.style.background = hexToRgba(color, 0.45);
    span.style.boxShadow = `0 0 0 1px ${hexToRgba(color, 0.3)}`;
    try {
      range.surroundContents(span);
    } catch (e) {
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      } catch (e2) { return false; }
    }
    return true;
  }

  function findAndWrap(h, blocks) {
    if (!h || !h.text || h.text.length > 1000) return false;
    const needle = h.before + h.text + h.after;
    for (const b of blocks) {
      if (b.closest('[contenteditable="true"]')) continue;
      const full = b.textContent || '';
      const idx = full.indexOf(needle);
      if (idx < 0) continue;
      if (wrapByOffset(b, idx + h.before.length, h.text.length, h.color)) return true;
    }
    return false;
  }

  async function restoreHighlights() {
    if (!enabled) return;
    let list = [];
    try {
      const store = (await chrome.storage.local.get(HL_STORE_KEY))[HL_STORE_KEY] || {};
      list = store[normUrl(location.href)] || [];
    } catch (e) { return; }
    if (!list.length) return;
    const blocks = [...document.querySelectorAll('p, li, td, th, blockquote, h1, h2, h3, h4, div')]
      .filter((b) => !b.closest('textarea, input, [contenteditable="true"]'));
    for (const h of list.slice(0, HL_MAX_PER_URL)) findAndWrap(h, blocks);
  }

  function savePage() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, 600);
  }

  function latestTs(arr) {
    arr = Array.isArray(arr) ? arr : [];
    let m = 0;
    for (const it of arr) m = Math.max(m, it.ts || 0);
    return m;
  }

  async function doSave() {
    if (!enabled) return;
    try {
      const url = normUrl(location.href);
      const items = [];
      document.querySelectorAll('span.' + HL_CLASS).forEach((span) => {
        if (items.length >= HL_MAX_PER_URL) return;
        const a = anchorSpan(span);
        if (a) items.push(a);
      });
      const store = (await chrome.storage.local.get(HL_STORE_KEY))[HL_STORE_KEY] || {};
      // تمیزکاری: حذف گفتگوهای قدیمی + سقف تعداد
      const now = Date.now();
      for (const k of Object.keys(store)) {
        if (k === url) continue;
        const arr = Array.isArray(store[k]) ? store[k] : [];
        const fresh = arr.filter((it) => now - (it.ts || 0) < HL_TTL).slice(-HL_MAX_PER_URL);
        if (fresh.length) store[k] = fresh;
        else delete store[k];
      }
      const keys = Object.keys(store);
      if (keys.length > HL_MAX_URLS) {
        keys.sort((a, b) => latestTs(store[a]) - latestTs(store[b]));
        while (Object.keys(store).length > HL_MAX_URLS) delete store[keys.shift()];
      }
      store[url] = items;
      await chrome.storage.local.set({ [HL_STORE_KEY]: store });
    } catch (e) { /* سهمیه یا خطا: بی‌سروصدا رد شو */ }
  }
})();
