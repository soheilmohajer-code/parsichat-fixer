/* bidi.js — منطق خالص تشخیص جهت و ابزارهای متن (بدون وابستگی به DOM سایت‌ها) */
(function () {
  'use strict';

  // حروف «قوی» راست‌به‌چپ: فارسی/عربی + گستره‌های Presentation Forms + عربی توسعه‌یافته
  const RTL_RE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
  const RTL_GLOBAL = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g;
  // حروف لاتین قوی
  const LTR_RE = /[A-Za-z]/;
  const LTR_GLOBAL = /[A-Za-z]/g;

  const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  /**
   * اولین نویسه قوی (strong character) متن را پیدا می‌کند.
   * عدد، فاصله، علائم نگارشی، ایموجی و ... نادیده گرفته می‌شوند
   * تا جمله‌ای که با عدد شروع می‌شود درست تشخیص داده شود.
   * @returns {'rtl'|'ltr'|null}
   */
  function firstStrongDir(text) {
    if (!text) return null;
    for (const ch of text) {
      if (RTL_RE.test(ch)) return 'rtl';
      if (LTR_RE.test(ch)) return 'ltr';
      // بقیه (عدد، نقطه‌گذاری، فاصله، ایموجی) → ادامه
    }
    return null;
  }

  /**
   * تشخیص جهت بلوک متن:
   * ۱) اگر حروف فارسی/عربی اکثریت داشته باشند (یا مساوی) → rtl؛ حتی اگر متن
   *    با کلمه انگلیسی یا چیپ کد شروع شده باشد (مثل «Gateway (پروکسی): ...»
   *    یا «std_logic چیست؟ ...»).
   * ۲) در غیر این صورت اولین حرف قوی (استاندارد Unicode Bidi).
   * ۳) اگر حرف قوی نبود (فقط عدد/علائم) → ltr (پیش‌فرض وب).
   */
  function detectDirection(text) {
    if (!text || !text.trim()) return 'ltr';
    const sample = text.length > 2000 ? text.slice(0, 2000) : text;
    const fa = (sample.match(RTL_GLOBAL) || []).length;
    const en = (sample.match(LTR_GLOBAL) || []).length;
    if (fa > 0 && fa >= en) return 'rtl';
    return firstStrongDir(sample) || 'ltr';
  }

  /** آیا متن حاوی حروف فارسی/عربی است؟ (برای تصمیم فونت/ارقام) */
  function containsPersian(text) {
    return RTL_RE.test(text || '');
  }

  /** تبدیل ارقام انگلیسی به فارسی (idempotent: اجرای مجدد بی‌اثر است) */
  function toFaDigits(s) {
    return String(s).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);
  }

  /** تبدیل ارقام فارسی/عربی به انگلیسی (idempotent) */
  function toEnDigits(s) {
    return String(s)
      .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
  }

  /**
   * تبدیل ارقام فقط در گره‌های متنی (نه داخل pre/code و فرمول‌های ریاضی).
   * روی هر TextNode مستقیم اعمال می‌شود تا تگ‌ها دست نخورند.
   */
  function convertDigitsInElement(root, mode) {
    if (mode !== 'fa' && mode !== 'en') return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !/[0-9۰-۹٠-٩]/.test(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }
        const parent = node.parentElement;
        if (parent && parent.closest('pre, code, kbd, samp, .katex, .MathJax, mjx-container')) {
          return NodeFilter.FILTER_REJECT; // کد و فرمول ریاضی (KaTeX/MathJax) دست نخورد
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);
    for (const t of targets) {
      t.nodeValue = mode === 'fa' ? toFaDigits(t.nodeValue) : toEnDigits(t.nodeValue);
    }
  }

  window.PCF_BIDI = {
    detectDirection,
    firstStrongDir,
    containsPersian,
    toFaDigits,
    toEnDigits,
    convertDigitsInElement
  };
})();
