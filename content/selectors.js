/* selectors.js
 * سلکتورهای DOM هر سایت در یک فایل جدا تا با تغییر DOM سایت‌ها
 * فقط همین فایل نیاز به اصلاح داشته باشد.
 * اگر سایتی سلکتورش عوض شد، کافی است ورودی مربوطه را به‌روز کنید.
 * همه سلکتورها جنبه «راهنما/بهینه‌سازی» دارند؛ content.js علاوه بر این‌ها
 * با سلکتورهای ژنریک (p, li, td, ...) هم کل صفحه را پوشش می‌دهد.
 */
(function () {
  'use strict';

  const COMMON = {
    // بلوک‌های متنی ژنریک داخل هر پیام (در همه سایت‌ها اعمال می‌شود)
    blocks: [
      'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'td', 'th', 'blockquote', 'figcaption'
    ].join(','),
    code: 'pre, code',
    table: 'table',
    list: 'ul, ol'
  };

  window.PCF_SELECTORS = {
    common: COMMON,

    // ---------- Claude (claude.ai) ----------
    claude: {
      host: /claude\.ai$/,
      // کانتینر هر پیام (برای پوشش plaintext و رصد استریم)
      messages: [
        'div[data-testid="user-message"]',
        'div[data-testid="assistant-message"]',
        'div.font-claude-message',
        '[data-is-streaming]',
        '.claude-message'
      ].join(','),
      userMessages: 'div[data-testid="user-message"]',
      assistantMessages: [
        'div[data-testid="assistant-message"]',
        'div.font-claude-message'
      ].join(','),
      // باکس ورودی (Claude از ProseMirror/contenteditable استفاده می‌کند)
      inputs: [
        'div.ProseMirror[contenteditable="true"]',
        'div[contenteditable="true"][data-testid]',
        'div[contenteditable="true"]'
      ].join(',')
    },

    // ---------- ChatGPT (chatgpt.com) ----------
    chatgpt: {
      host: /chatgpt\.com$/,
      messages: [
        '[data-message-author-role="user"]',
        '[data-message-author-role="assistant"]',
        '[data-message-author-role="system"]',
        '.markdown',
        '[data-testid="conversation-turn"]'
      ].join(','),
      userMessages: '[data-message-author-role="user"]',
      assistantMessages: [
        '[data-message-author-role="assistant"]',
        '.markdown'
      ].join(','),
      // باکس ورودی: نسخه‌های مختلف (textarea قدیمی + ProseMirror جدید)
      inputs: [
        'textarea#prompt-textarea',
        'div#prompt-textarea',
        'div.ProseMirror#prompt-textarea[contenteditable="true"]',
        'div[contenteditable="true"]#prompt-textarea',
        'form textarea',
        'form div[contenteditable="true"]'
      ].join(',')
    },

    // ---------- OpenAI legacy (chat.openai.com) ----------
    openai: {
      host: /chat\.openai\.com$/,
      messages: [
        '[data-message-author-role="user"]',
        '[data-message-author-role="assistant"]',
        '.markdown',
        '[data-testid^="conversation-turn"]'
      ].join(','),
      userMessages: '[data-message-author-role="user"]',
      assistantMessages: [
        '[data-message-author-role="assistant"]',
        '.markdown'
      ].join(','),
      inputs: [
        'textarea[data-id]',
        'textarea',
        'div[contenteditable="true"]',
        'form textarea',
        'form div[contenteditable="true"]'
      ].join(',')
    },

    // ---------- Gemini (gemini.google.com) ----------
    gemini: {
      host: /gemini\.google\.com$/,
      messages: [
        'message-content',
        '.response-content',
        '.query-content',
        '.model-response-text',
        '.markdown'
      ].join(','),
      userMessages: '.query-content',
      assistantMessages: [
        'message-content',
        '.response-content',
        '.model-response-text'
      ].join(','),
      // باکس ورودی جمینای (ویرایشگر Quill)
      inputs: [
        '.ql-editor[contenteditable="true"]',
        'div[contenteditable="true"]',
        'textarea',
        'form div[contenteditable="true"]'
      ].join(',')
    },

    // ---------- DeepSeek (chat.deepseek.com) ----------
    deepseek: {
      host: /chat\.deepseek\.com$/,
      messages: [
        '.ds-message',
        '.message-content',
        '.markdown',
        '[class*="message"]'
      ].join(','),
      userMessages: '.ds-message--user, [class*="user"]',
      assistantMessages: [
        '.ds-message--assistant',
        '.message-content',
        '.markdown'
      ].join(','),
      inputs: [
        'textarea',
        'div[contenteditable="true"]',
        'form textarea'
      ].join(',')
    },

    // ---------- Grok (grok.com) ----------
    grok: {
      host: /(^|\.)grok\.com$/,
      messages: [
        '.markdown',
        '.response-content',
        '[class*="message"]',
        'article'
      ].join(','),
      userMessages: '[class*="user"]',
      assistantMessages: [
        '.response-content',
        '.markdown'
      ].join(','),
      inputs: [
        'textarea',
        'div[contenteditable="true"]',
        'form textarea',
        'form div[contenteditable="true"]'
      ].join(',')
    }
  };
})();
