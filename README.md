# ParsiChat Fixer — پارسی‌چت

**English** | [فارسی](#-نسخه-فارسی)

---

## English

A Manifest V3 browser extension (no frameworks, no server, no data leaves your
browser) that fixes Persian/English mixed-text direction (RTL/LTR) breakage in
**claude.ai**, **chatgpt.com**, **chat.openai.com**, **gemini.google.com**,
**chat.deepseek.com**, **grok.com**, **perplexity.ai**, **chat.qwen.ai**,
**meta.ai**, **kimi.com** and **chat.z.ai**.

### Features
- Per-block direction detection (paragraphs, list items, headings, table
  cells, chat input box) using the **first strong character**, with a
  Persian/Latin ratio fallback — sentences starting with digits or punctuation
  are detected correctly.
- `unicode-bidi: plaintext / isolate` so English words inside Persian
  sentences keep their order; `pre`/`code` always stays LTR.
- Debounced (150ms) MutationObserver for streaming answers — only newly
  added/changed nodes are processed (no slowdown, no flicker).
- Bundled **Vazirmatn** font (no CDN), applied only to Persian/Arabic glyphs
  via `unicode-range`; code keeps the site's monospace font.
- Popup: master on/off switch, per-site on/off, font choice
  (Vazirmatn / site default / custom system font), font size, line height,
  Persian/English digits (text only, never code).
- Settings are stored in `chrome.storage.sync`.
- Text highlighter: select text for a floating 3-color toolbar (customizable
  colors); highlights are saved per conversation in `chrome.storage.local`
  and restored after reload.

### Project structure
```
parsichat-fixer/
├── manifest.json
├── content/
│   ├── content.js
│   ├── bidi.js
│   ├── selectors.js
│   └── styles.css
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── icons/
│   ├── source.png
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── fonts/
│   ├── Vazirmatn-Regular.woff2
│   ├── Vazirmatn-Medium.woff2
│   └── Vazirmatn-Bold.woff2
└── README.md
```

### Fonts
`fonts/*.woff2` were downloaded from the official repo:
- https://github.com/rastikerdar/vazirmatn
- Version v33.003, from `fonts/webfonts/Vazirmatn-{Regular,Medium,Bold}.woff2`

#### If the fonts are missing (manual download)
If `fonts/` is empty, download them manually:
1. Grab the release zip from https://github.com/rastikerdar/vazirmatn/releases/latest,
   or directly from the pinned CDN version:
   - `https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.woff2`
   - `https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Medium.woff2`
   - `https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Bold.woff2`
2. Put all three files **with these exact names** inside `fonts/`.
3. The code won't break if the files are missing: the `@font-face` rules
   simply don't load and the fallback (`Tahoma`, system) is used.

### Install in Chrome (Load unpacked)
1. Go to `chrome://extensions`.
2. Enable **Developer mode** (top-right corner).
3. Click **Load unpacked** and select the `parsichat-fixer` folder.
4. Open one of the sites (e.g. https://chatgpt.com) and click the extension
   icon to see the settings.

### Install in Firefox (temporary / development)
> The manifest targets Chrome (MV3); Firefox 112+ accepts it with one small
> difference.

1. If Firefox complains about `host_permissions`, remove the
   `host_permissions` array from `manifest.json` and move the hosts into
   `permissions` — or use Firefox Developer Edition / Nightly.
2. Go to `about:debugging#/runtime/this-firefox`.
3. **Load Temporary Add-on** → pick the `manifest.json` inside the folder.
4. For a permanent install, package with `web-ext build` and sign it on
   addons.mozilla.org.

### Manual test checklist
Try these samples on all supported sites (ask the chatbot to generate such text,
or type it in the input box):

1. **Persian with English inside:** «من از React و TypeScript برای پروژه استفاده می‌کنم.»
   → whole line RTL, React/TypeScript stay in place.
2. **English with Persian inside:** `I love یادگیری زبان in the morning`
   → whole line LTR, Persian word stays in place.
3. **Numbered Persian list:** three Persian items in `ol` → numbers on the right.
4. **Code block inside Persian answer:** Persian text + ```js ... ``` → code stays LTR, left-aligned.
5. **Persian table:** 2×2 table with Persian cells → table goes RTL.
6. **Starting with digits/punctuation:** «۱۲ قدم برای یادگیری! اول: ...» → RTL (not LTR).
7. **Streaming:** direction must not jump while the answer is being typed.
8. **Input box:** typing Persian → RTL, typing English → LTR.

### Privacy
Only `storage` permission + the eleven site hosts. No fetch/XHR, no analytics,
no CDN. The font loads from inside the package.

### License
MIT — see [LICENSE](LICENSE). Bundled Vazirmatn fonts are under OFL 1.1.

---

## <a id="-نسخه-فارسی"></a>نسخه فارسی

<div dir="rtl">

افزونه Manifest V3 (بدون فریم‌ورک، بدون سرور، بدون ارسال داده به بیرون) که
به‌هم‌ریختگی متن فارسی + انگلیسی را در **claude.ai**، **chatgpt.com**،
**chat.openai.com**، **gemini.google.com**، **chat.deepseek.com**، **grok.com**،
**perplexity.ai**، **chat.qwen.ai**، **meta.ai**، **kimi.com** و **chat.z.ai**
برطرف می‌کند.

### امکانات
- تشخیص جهت هر بلوک (پاراگراف، لیست، عنوان، سلول جدول، باکس ورودی) با
  **اولین حرف قوی** + فالبک نسبتی فارسی/لاتین؛ جمله‌ای که با عدد شروع
  می‌شود هم درست تشخیص داده می‌شود.
- `unicode-bidi: plaintext / isolate` تا کلمه انگلیسی وسط جمله فارسی
  ترتیب را خراب نکند؛ `pre`/`code` همیشه LTR.
- MutationObserver با debounce (۱۵۰ms) برای پاسخ‌های استریمی، فقط روی
  نودهای تازه‌اضافه‌شده (بدون افت عملکرد و بدون پرش).
- فونت **Vazirmatn** داخلی (بدون CDN) فقط روی حروف فارسی/عربی
  (unicode-range)؛ کد با فونت monospace سایت می‌ماند.
- پاپ‌آپ: سوییچ کلی، فعال/غیرفعال per-site، انتخاب فونت (وزیرمتن/سایت/دلخواه)،
  اندازه فونت، ارتفاع خط، ارقام فارسی/انگلیسی (فقط متن، نه کد).
- تنظیمات در `chrome.storage.sync` ذخیره می‌شود.
- هایلایتر متن: با سلکت متن، نوار ۳رنگه (قابل تنظیم) ظاهر می‌شود؛ هایلایت‌ها
  به‌تفکیک هر گفتگو در `chrome.storage.local` ذخیره و بعد از رفرش برمی‌گردند.

### فونت‌ها
فایل‌های `fonts/*.woff2` از ریپوی رسمی دانلود شده‌اند:
- https://github.com/rastikerdar/vazirmatn
- نسخه: v33.003 — مسیر `fonts/webfonts/Vazirmatn-{Regular,Medium,Bold}.woff2`

#### اگر فونت‌ها غایب باشند (دانلود دستی)
اگر پوشه `fonts/` خالی است، دستی دانلود کن:
1. به https://github.com/rastikerdar/vazirmatn/releases/latest برو و زیپ ریلیز را بگیر،
   یا مستقیم از CDN نسخه پایدار:
   - `https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.woff2`
   - `https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Medium.woff2`
   - `https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Bold.woff2`
2. هر سه فایل را با **همین نام‌ها** داخل `fonts/` بگذار.
3. کد با نبودن فایل خطا نمی‌دهد: `@font-face` لود نمی‌شود و fallback
   (`Tahoma`, system) اعمال می‌شود.

### نصب در Chrome (Load unpacked)
1. به `chrome://extensions` برو.
2. گوشه بالا **Developer mode** را روشن کن.
3. **Load unpacked** → پوشه `parsichat-fixer` را انتخاب کن.
4. یکی از سایت‌ها را باز کن (مثلاً https://chatgpt.com) و روی آیکون افزونه
   کلیک کن تا تنظیمات را ببینی.

### نصب در Firefox (موقت / توسعه)
> نسخه اصلی Manifest V3 برای کروم است؛ فایرفاکس (۱۱۲+) همین manifest را
> با یک تفاوت کوچک می‌پذیرد.

1. اگر فایرفاکس خطای `host_permissions` داد، در `manifest.json` آرایه
   `host_permissions` را حذف کن و هاست‌ها را به `permissions` اضافه کن —
   یا از Firefox Developer Edition / Nightly استفاده کن.
2. به `about:debugging#/runtime/this-firefox` برو.
3. **Load Temporary Add-on** → فایل `manifest.json` داخل پوشه را انتخاب کن.
4. برای نصب دائم، افزونه را با `web-ext build` بسته‌بندی و در
   addons.mozilla.org امضا (sign) کن.

### تست دستی (چک‌لیست)
در همه سایت‌های پشتیبانی‌شده این نمونه‌ها را امتحان کن (می‌توانی از خود چت‌بات بخواهی
چنین متنی تولید کند یا در باکس ورودی تایپ کنی):

1. **فارسی + انگلیسی وسط:** «من از React و TypeScript برای پروژه استفاده می‌کنم.»
   → کل خط RTL، کلمات React/TypeScript سر جایشان.
2. **انگلیسی + فارسی وسط:** `I love یادگیری زبان in the morning`
   → کل خط LTR، کلمه فارسی سر جایش.
3. **لیست شماره‌دار فارسی:** سه آیتم فارسی در `ol` → شماره‌ها سمت راست.
4. **بلوک کد داخل پاسخ فارسی:** متن فارسی + ```js ... ``` → کد LTR و چپ‌چین.
5. **جدول فارسی:** جدول ۲×۲ با سلول‌های فارسی → جدول RTL.
6. **شروع با عدد/علائم:** «۱۲ قدم برای یادگیری! اول: ...» → RTL (نه LTR).
7. **استریم:** در حین تایپ پاسخ، جهت نباید بپرد.
8. **باکس ورودی:** با تایپ فارسی RTL و با تایپ انگلیسی LTR شود.

### حریم خصوصی
فقط `storage` + هاست‌های یازده دامنه. هیچ fetch/XHR، هیچ آنالیتیکس، هیچ CDN.
فونت از داخل بسته لود می‌شود.

### لایسنس
MIT — فایل [LICENSE](LICENSE) را ببین. فونت‌های وزیرمتن تحت OFL 1.1 هستند.

</div>
