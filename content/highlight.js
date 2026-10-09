/* highlight.js — هایلایتر متن چت با ۳ رنگ (Vanilla JS)
 * رفتار: متن را سلکت کن → نوار شناور با ۳ رنگ ظاهر می‌شود → کلیک = هایلایت.
 * دکمه ✕ هایلایتِ داخل سلکشن را پاک می‌کند.
 * نکته: هایلایت فقط همین نشست است (با رفرش پاک می‌شود) و روی input/textarea کار نمی‌کند.
 */
(function () {
  'use strict';

  const HL_CLASS = 'pcf-hl';
  const COLORS = {
    yellow: 'pcf-hl-yellow',
    green: 'pcf-hl-green',
    pink: 'pcf-hl-pink'
  };

  let enabled = true;
  let bar = null;

  init();

  async function init() {
    try {
      const s = await chrome.storage.sync.get('highlight');
      enabled = s.highlight !== false;
    } catch (e) { /* پیش‌فرض روشن */ }
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.highlight) {
        enabled = changes.highlight.newValue !== false;
        if (!enabled) hideBar();
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
    for (const [name, cls] of Object.entries(COLORS)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pcf-hl-dot ' + cls;
      b.title = 'هایلایت';
      b.dataset.color = cls;
      b.addEventListener('mousedown', (e) => e.preventDefault()); // سلکشن نپرد
      b.addEventListener('click', () => applyHighlight(cls));
      bar.appendChild(b);
    }
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

  function applyHighlight(cls) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0).cloneRange();
    if (!validRange(range)) { hideBar(); return; }
    // هایلایت تودرتو نکن: قبلی‌های داخل رنج را اول باز کن
    unwrapSpans(collectSpans(range, true));
    const span = document.createElement('span');
    span.className = HL_CLASS + ' ' + cls;
    try {
      range.surroundContents(span);
    } catch (e) {
      // رنج پیچیده (چند بلوکی) → استخراج و بسته‌بندی
      span.appendChild(range.extractContents());
      range.insertNode(span);
    }
    sel.removeAllRanges();
    hideBar();
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
})();
