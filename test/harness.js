/* harness.js — تست خودکار اسکریپت‌های واقعی افزونه (فقط برای test/harness.html) */
(function () {
  'use strict';

  const out = [];

  function t(name, cond) {
    out.push({ name: name, ok: !!cond });
  }

  function dir(id) {
    const e = document.getElementById(id);
    return e ? e.getAttribute('dir') : null;
  }

  function render() {
    const ul = document.getElementById('results');
    ul.innerHTML = '';
    let pass = 0;
    for (const r of out) {
      if (r.ok) pass++;
      const li = document.createElement('li');
      li.className = r.ok ? 'pass' : 'fail';
      li.textContent = (r.ok ? '[PASS] ' : '[FAIL] ') + r.name;
      ul.appendChild(li);
    }
    const s = document.createElement('p');
    s.textContent = 'نتیجه: ' + pass + ' از ' + out.length;
    ul.after(s);
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      t('پاراگراف فارسی+انگلیسی RTL', dir('t1') === 'rtl');
      t('پاراگراف انگلیسی+فارسی LTR', dir('t2') === 'ltr');
      t('آیتم لیست با شروع انگلیسی RTL', dir('t3') === 'rtl');
      t('آیتم لیست انگلیسی LTR', dir('t3en') === 'ltr');
      const pre = document.getElementById('t4');
      t('بلوک کد دست نخورده', pre && !pre.classList.contains('pcf-rtl'));
      t('جدول فارسی RTL', dir('t5') === 'rtl');
      t('پاراگراف با شروع چیپ کد RTL', dir('t6') === 'rtl');

      // باکس ورودی زنده
      const tin = document.getElementById('tin');
      tin.value = 'سلام دنیا';
      tin.dispatchEvent(new Event('input', { bubbles: true }));
      t('ورودی فارسی RTL', tin.getAttribute('dir') === 'rtl');
      tin.value = 'hello world';
      tin.dispatchEvent(new Event('input', { bubbles: true }));
      t('ورودی انگلیسی LTR', tin.getAttribute('dir') === 'ltr');

      // شبیه‌سازی استریم: افزودن دیرهنگام پیام
      const p = document.createElement('p');
      p.id = 'tstream';
      p.textContent = 'این پیام دیر اضافه شد با React';
      document.querySelector('[data-message-author-role]').appendChild(p);
      setTimeout(() => {
        t('پیام استریمی RTL', dir('tstream') === 'rtl');
        render();
      }, 900);
    }, 1200);
  });
})();
