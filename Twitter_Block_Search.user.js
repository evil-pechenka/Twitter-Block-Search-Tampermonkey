// ==UserScript==
// @name         Twitter Block Search
// @namespace    https://github.com/evil-pechenka/Twitter-Block-Search
// @version      1.0.0
// @description  На странице заблокировавшего вас пользователя в X/Twitter ищет взаимную переписку и отображает кнопку перехода к ней
// @author       evil-pechenka
// @match        https://twitter.com/*
// @match        https://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @grant        GM_addStyle
// @grant        GM_openInTab
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // Флаг отладочных логов
  const TBS_DEBUG = true;

  function tbsLog(...args) {
    if (TBS_DEBUG) console.log('[TBS Tampermonkey]:', ...args);
  }

  function tbsWarn(...args) {
    if (TBS_DEBUG) console.warn('[TBS Tampermonkey]:', ...args);
  }

  // =========================================================================
  // 1. СТИЛИ И ИНТЕРФЕЙС
  // =========================================================================

  const TBS_STYLES = `
    .tbs-header-row {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 16px !important;
      width: 100% !important;
    }

    .tbs-header-row h1,
    .tbs-header-row h2 {
      flex: 1 1 auto !important;
      margin: 0 !important;
    }

    .tbs-header-row .twitter-block-search-btn {
      margin-left: 0 !important;
      flex-shrink: 0 !important;
    }

    .twitter-block-search-anchor {
      display: inline !important;
    }

    .twitter-block-search-anchor .twitter-block-search-btn {
      display: inline-flex;
      vertical-align: middle;
      margin-left: 8px;
    }

    .twitter-block-search-btn {
      background: #1DA1F2;
      border: none;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(29, 161, 242, 0.3);
      margin-left: 8px;
      vertical-align: middle;
      flex-shrink: 0;
      position: relative;
      animation: tbsFadeIn 0.4s ease-out;
    }

    .twitter-block-search-btn:hover {
      background: #1a8cd8;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(29, 161, 242, 0.4);
    }

    .twitter-block-search-btn:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }

    .twitter-block-search-btn svg {
      width: 15px;
      height: 15px;
      transition: transform 0.2s ease;
    }

    .twitter-block-search-btn .tbs-clown {
      font-size: 24px;
      line-height: 1;
      vertical-align: middle;
    }

    .twitter-block-search-btn.no-results {
      background: transparent;
      box-shadow: none;
      width: auto;
      height: auto;
      padding: 0;
      margin-left: 6px;
      display: inline-flex;
      vertical-align: middle;
    }

    .twitter-block-search-btn.no-results:hover,
    .twitter-block-search-btn.no-results:active {
      background: transparent;
      transform: none;
      box-shadow: none;
    }

    .twitter-block-search-btn:hover svg {
      transform: scale(1.1);
    }

    @keyframes tbsFadeIn {
      from {
        opacity: 0;
        transform: scale(0.7) rotate(-10deg);
      }
      to {
        opacity: 1;
        transform: scale(1) rotate(0deg);
      }
    }

    /* Адаптация для темной темы */
    @media (prefers-color-scheme: dark) {
      .twitter-block-search-btn {
        background: #1DA1F2;
        box-shadow: 0 2px 8px rgba(29, 161, 242, 0.4);
      }
      .twitter-block-search-btn:hover {
        background: #1a8cd8;
        box-shadow: 0 4px 12px rgba(29, 161, 242, 0.5);
      }
    }

    [data-theme="dark"] .twitter-block-search-btn {
      background: #1DA1F2;
      box-shadow: 0 2px 8px rgba(29, 161, 242, 0.4);
    }

    [data-theme="dark"] .twitter-block-search-btn:hover {
      background: #1a8cd8;
      box-shadow: 0 4px 12px rgba(29, 161, 242, 0.5);
    }

    /* Состояния загрузки и проверки */
    .twitter-block-search-btn.loading {
      background: #8899a6;
      cursor: wait;
      animation: tbsPulse 1.5s ease-in-out infinite;
    }

    .twitter-block-search-btn.loading:hover {
      background: #8899a6;
      transform: none;
      box-shadow: 0 2px 8px rgba(136, 153, 166, 0.3);
    }

    @keyframes tbsPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .twitter-block-search-btn.checking {
      animation: tbsFadePulse 1.2s ease-in-out infinite;
    }

    @keyframes tbsFadePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }

    .twitter-block-search-status {
      display: none;
    }
  `;

  // Внедрение стилей (через GM_addStyle или DOM fallback)
  if (typeof GM_addStyle === 'function') {
    GM_addStyle(TBS_STYLES);
  } else {
    const styleEl = document.createElement('style');
    styleEl.textContent = TBS_STYLES;
    document.head.appendChild(styleEl);
  }

  function getSearchIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"/>
      </svg>
    `;
  }

  function createStatusDot() {
    const dot = document.createElement('span');
    dot.className = 'twitter-block-search-status hidden';
    dot.title = 'Проверка результатов поиска...';
    return dot;
  }

  // =========================================================================
  // 2. ФОНОВЫЙ ВАЛИДАТОР ПОИСКА (ДЛЯ СТРАНИЦЫ /search)
  // =========================================================================

  // Проверяем, открыта ли текущая вкладка как служебная для проверки поиска
  const currentUrlObj = new URL(window.location.href);
  const isTbsCheckTab = currentUrlObj.hash.includes('tbs_check=');

  if (isTbsCheckTab) {
    const match = currentUrlObj.hash.match(/tbs_check=([^&]+)/);
    const checkRequestId = match ? match[1] : null;

    if (checkRequestId) {
      tbsLog('Фоновая вкладка проверки поиска запущена', checkRequestId);

      const channel = new BroadcastChannel('tbs_search_channel');
      const start = Date.now();
      const maxWait = 10000;
      const interval = 300;
      const noResultsPatterns = [
        'ничего не найдено',
        'no results found',
        'no results for',
        'keine ergebnisse',
        'aucun résultat'
      ];

      const intervalId = setInterval(() => {
        const bodyText = document.body ? (document.body.innerText || '').toLowerCase() : '';
        const hasNoResults = noResultsPatterns.some((p) => bodyText.includes(p));
        const emptyState = document.querySelector('[data-testid="emptyState"], [data-testid="emptyState-cell"]');
        const results = document.querySelectorAll('article');
        const hasResults = results && results.length > 0;

        if (hasResults) {
          clearInterval(intervalId);
          tbsLog('Найдены результаты переписки');
          channel.postMessage({ requestId: checkRequestId, status: 'results', hasResults: true });
          channel.close();
          window.close();
          return;
        }

        if (hasNoResults || emptyState) {
          clearInterval(intervalId);
          tbsLog('Переписка отсутствует (клоун)');
          channel.postMessage({ requestId: checkRequestId, status: 'no_results', hasResults: false });
          channel.close();
          window.close();
          return;
        }

        if (Date.now() - start > maxWait) {
          clearInterval(intervalId);
          tbsWarn('Таймаут проверки переписки');
          channel.postMessage({ requestId: checkRequestId, status: 'unknown', hasResults: false });
          channel.close();
          window.close();
        }
      }, interval);

      return; // Не инициализируем логику добавления кнопки на вкладке проверки
    }
  }

  // =========================================================================
  // 3. ЯЗЫКОНЕЗАВИСИМОЕ ОБНАРУЖЕНИЕ БЛОКИРОВКИ
  // =========================================================================

  const BLOCK_KEYWORDS = [
    'blocked you',
    'has blocked you',
    "you're blocked",
    "you’re blocked",
    'заблокировал вас',
    'вы заблокированы',
    'te ha bloqueado',
    'estás bloqueado',
    'estas bloqueado',
    'vous a bloqué',
    'vous a bloque',
    'vous êtes bloqué',
    'hat dich blockiert',
    'du bist blockiert',
    'ti ha bloccato',
    'sei bloccato',
    'bloqueou você',
    'bloqueou voce',
    'você está bloqueado',
    'seni engelledi',
    'engellendin',
    'не можете взаимодействовать',
    'нет возможности читать',
    'cannot follow or see',
    "can’t follow or see",
    "can't follow or see"
  ];

  function isBlockedText(text) {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();
    return BLOCK_KEYWORDS.some((kw) => lower.includes(kw));
  }

  const BLOCK_MESSAGE_PATTERNS = [
    /@([a-zA-Z0-9_]{1,15})\s+has blocked you/i,
    /пользователь\s+@([a-zA-Z0-9_]{1,15})\s+заблокировал вас/i,
    /@([a-zA-Z0-9_]{1,15}).{0,120}(?:has blocked you|заблокировал вас|blocked you|blockiert|bloqué|bloqueado)/i
  ];

  function extractMentionUsername(text) {
    if (!text || typeof text !== 'string') return null;
    const match = text.match(/@([a-zA-Z0-9_]{1,15})/);
    return match ? match[1] : null;
  }

  function getProfileUsernameFromPath() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;
    const candidate = segments[0];
    return isValidUsername(candidate) && !isSystemPage(candidate) ? candidate : null;
  }

  function parseBlockedUsername(text) {
    if (!text || typeof text !== 'string') return null;
    const normalized = text.trim().replace(/\s+/g, ' ');

    for (const pattern of BLOCK_MESSAGE_PATTERNS) {
      const match = normalized.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  function findBlockMessageTarget() {
    const profileUsername = getProfileUsernameFromPath();

    // Приоритет 1: [data-testid="inlinePrompt"] (стандартная плашка профиля)
    const inlinePrompt = document.querySelector('[data-testid="inlinePrompt"]');
    if (inlinePrompt) {
      const promptText = (inlinePrompt.textContent || '').trim();
      const isBlockNotice = isBlockedText(promptText) ||
        (profileUsername && promptText.includes(`@${profileUsername}`));

      if (isBlockNotice) {
        const blockedUsername = profileUsername ||
          parseBlockedUsername(promptText) ||
          extractMentionUsername(promptText);

        if (blockedUsername) {
          const h1 = inlinePrompt.querySelector('h1') || inlinePrompt.querySelector('h2');
          const targetElement = h1 || inlinePrompt;

          if (!inlinePrompt.querySelector('.twitter-block-search-btn')) {
            tbsLog('Найден блок блокировки в inlinePrompt', { blockedUsername });
            return { targetElement, blockedUsername, isHeading: Boolean(h1) };
          }
        }
      }
    }

    // Приоритет 2: Явные селекторы заголовков и пустых состояний
    const candidateSelectors = [
      'h1',
      'h2',
      '[data-testid="emptyState"]',
      '[data-testid="cellInnerDiv"]'
    ];

    for (const selector of candidateSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (!element.textContent || element.querySelector('.twitter-block-search-btn')) {
          continue;
        }

        const text = element.textContent;
        if (!isBlockedText(text)) continue;

        const blockedUsername = profileUsername ||
          parseBlockedUsername(text) ||
          extractMentionUsername(text);

        if (blockedUsername) {
          const targetElement = element.querySelector('span') || element;
          tbsLog('Найден блок блокировки по селектору', { selector, blockedUsername });
          return { targetElement, blockedUsername, isHeading: false };
        }
      }
    }

    return null;
  }

  // =========================================================================
  // 4. ОПРЕДЕЛЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
  // =========================================================================

  function getCurrentUsername() {
    // 1. Память (5 минут)
    if (
      getCurrentUsername._cache &&
      getCurrentUsername._cacheTime &&
      Date.now() - getCurrentUsername._cacheTime < 300000
    ) {
      return getCurrentUsername._cache;
    }

    // 2. LocalStorage для быстрого восстановления
    try {
      const saved = localStorage.getItem('tbs_current_user');
      if (saved && isValidUsername(saved)) {
        getCurrentUsername._cache = saved;
        getCurrentUsername._cacheTime = Date.now();
      }
    } catch (e) {}

    let foundUsername = null;

    // 3. Стратегия: переключатель аккаунта в левом меню
    const accountSwitcher = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    if (accountSwitcher) {
      const text = accountSwitcher.textContent || '';
      const match = text.match(/@([a-zA-Z0-9_]{1,15})/);
      if (match && isValidUsername(match[1])) {
        foundUsername = match[1];
        tbsLog('Имя пользователя найдено через SideNav_AccountSwitcher_Button:', foundUsername);
      }

      if (!foundUsername) {
        const avatarDiv = accountSwitcher.querySelector('[data-testid^="UserAvatar-Container-"]');
        if (avatarDiv) {
          const u = avatarDiv.getAttribute('data-testid')?.replace('UserAvatar-Container-', '');
          if (isValidUsername(u)) {
            foundUsername = u;
          }
        }
      }
    }

    // 4. Стратегия: ссылки на профиль в навигации
    if (!foundUsername) {
      const navSelectors = [
        '[data-testid="AppTabBar_Profile_Link"]',
        'a[data-testid="AppTabBar_Profile_Link"]',
        'nav a[aria-label*="Profile" i]',
        'nav a[aria-label*="Профиль" i]',
        'header nav a[role="link"]'
      ];

      for (const selector of navSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const href = el.getAttribute('href');
          if (!href) continue;
          const clean = href.split('?')[0].replace(/^\/+/, '').split('/')[0];
          if (clean && isValidUsername(clean) && !isSystemPage(clean)) {
            foundUsername = clean;
            tbsLog('Имя пользователя найдено через ссылку в меню:', foundUsername);
            break;
          }
        }
        if (foundUsername) break;
      }
    }

    // 5. Стратегия: аватар в шапке
    if (!foundUsername) {
      const avatar = document.querySelector('header [data-testid^="UserAvatar-Container-"], nav [data-testid^="UserAvatar-Container-"]');
      if (avatar) {
        const u = avatar.getAttribute('data-testid')?.replace('UserAvatar-Container-', '');
        if (isValidUsername(u) && !isSystemPage(u)) {
          foundUsername = u;
        }
      }
    }

    if (foundUsername) {
      getCurrentUsername._cache = foundUsername;
      getCurrentUsername._cacheTime = Date.now();
      try {
        localStorage.setItem('tbs_current_user', foundUsername);
      } catch (e) {}
      return foundUsername;
    }

    if (getCurrentUsername._cache) {
      return getCurrentUsername._cache;
    }

    tbsWarn('Имя текущего пользователя пока не определено');
    return null;
  }

  function isSystemPage(pageName) {
    if (!pageName || typeof pageName !== 'string') return true;
    const systemPages = [
      'home', 'explore', 'search', 'notifications', 
      'messages', 'settings', 'bookmarks', 'lists',
      'profile', 'compose', 'i', 'intent', 'chat',
      'jobs', 'grok', 'verified-choose', 'premium',
      'communities', 'about', 'tos', 'privacy'
    ];
    return systemPages.includes(pageName.toLowerCase());
  }

  function isValidUsername(username) {
    return username && typeof username === 'string' && /^[a-zA-Z0-9_]{1,15}$/.test(username);
  }

  function buildSearchUrl(currentUser, blockedUsername) {
    const searchQuery = `(from:${currentUser} to:${blockedUsername}) OR (from:${blockedUsername} to:${currentUser})`;
    return `https://x.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query&f=live`;
  }

  // =========================================================================
  // 5. ДОБАВЛЕНИЕ КНОПКИ И ОБРАБОТЧИКИ
  // =========================================================================

  async function addSearchButton() {
    if (document.querySelector('.twitter-block-search-btn')) {
      return;
    }

    const target = findBlockMessageTarget();
    if (!target) return;

    const targetElement = target.targetElement;
    const blockedUsername = target.blockedUsername;
    const currentUser = getCurrentUsername();

    if (!currentUser) {
      tbsWarn('Не удалось определить текущего пользователя, откладываем добавление');
      return;
    }

    const searchButton = document.createElement('button');
    searchButton.className = 'twitter-block-search-btn loading';
    searchButton.innerHTML = `<span style="font-size: 12px;">⏳</span>`;
    searchButton.title = 'Проверяем наличие переписки...';
    searchButton.disabled = true;
    searchButton.dataset.blockedUsername = blockedUsername;
    searchButton.dataset.currentUsername = currentUser;

    searchButton.addEventListener('click', handleSearchClick);

    const statusDot = createStatusDot();

    // Размещение на правом краю через .tbs-header-row
    if (target.isHeading && targetElement.tagName && targetElement.tagName.toLowerCase().startsWith('h')) {
      let headerRow = targetElement.parentElement?.classList.contains('tbs-header-row')
        ? targetElement.parentElement
        : targetElement.closest('.tbs-header-row');

      if (!headerRow) {
        headerRow = document.createElement('div');
        headerRow.className = 'tbs-header-row';
        targetElement.parentNode.insertBefore(headerRow, targetElement);
        headerRow.appendChild(targetElement);
      }
      headerRow.appendChild(searchButton);
      headerRow.appendChild(statusDot);
    } else {
      targetElement.classList.add('twitter-block-search-anchor');
      targetElement.appendChild(searchButton);
      targetElement.appendChild(statusDot);
    }

    searchButton.className = 'twitter-block-search-btn';
    searchButton.disabled = false;
    searchButton.innerHTML = getSearchIcon();
    searchButton.title = `Найти переписку между @${currentUser} и @${blockedUsername}`;
    tbsLog('Кнопка поиска добавлена для @' + blockedUsername);

    // Фоновая проверка поиска через неактивную вкладку
    checkSearchResults(currentUser, blockedUsername, statusDot);
  }

  function handleSearchClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const blockedUsername = button.dataset.blockedUsername;
    const cachedCurrentUser = button.dataset.currentUsername;
    const currentUser = cachedCurrentUser || getCurrentUsername();

    if (!blockedUsername || !currentUser) {
      alert('Не удалось определить имя пользователя. Попробуйте обновить страницу.');
      return;
    }

    const searchUrl = buildSearchUrl(currentUser, blockedUsername);
    tbsLog('Открытие поиска:', searchUrl);

    try {
      window.open(searchUrl, '_blank');
    } catch (err) {
      console.error('Ошибка при открытии поиска:', err);
    }
  }

  function checkSearchResults(currentUser, blockedUsername, statusDot) {
    if (!statusDot) return;

    const button = statusDot.parentElement?.querySelector('.twitter-block-search-btn');
    if (button) {
      button.classList.add('checking');
    }

    const baseSearchUrl = buildSearchUrl(currentUser, blockedUsername);
    const requestId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const checkUrl = `${baseSearchUrl}#tbs_check=${requestId}`;

    tbsLog('Запуск фоновой проверки через неактивную вкладку:', requestId);

    const channel = new BroadcastChannel('tbs_search_channel');

    const timeoutId = setTimeout(() => {
      if (button) button.classList.remove('checking');
      channel.close();
      tbsLog('Таймаут ожидания фоновой проверки');
    }, 12000);

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || data.requestId !== requestId) return;

      clearTimeout(timeoutId);
      if (button) button.classList.remove('checking');
      channel.close();

      tbsLog('Получен ответ фоновой проверки:', data);

      if (data.status === 'no_results' || (!data.hasResults && data.status !== 'results')) {
        if (button) {
          button.classList.add('no-results');
          button.innerHTML = '<span class="tbs-clown">🤡</span>';
          button.title = 'Ничего не найдено (нажмите, чтобы открыть поиск)';
        }
        return;
      }

      if (data.status === 'results' || data.hasResults) {
        if (button) {
          button.classList.remove('no-results');
          button.innerHTML = getSearchIcon();
          button.title = 'Открыть переписку';
        }
      }
    };

    // Открываем вкладку в фоне без переключения фокуса
    if (typeof GM_openInTab === 'function') {
      GM_openInTab(checkUrl, { active: false, insert: true });
    }
  }

  // =========================================================================
  // 6. НАБЛЮДАТЕЛЬ DOM И НАВИГАЦИЯ (SPA)
  // =========================================================================

  function observeDOM() {
    let timeoutId = null;
    let isProcessing = false;

    const debouncedAddButton = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (!isProcessing) {
          isProcessing = true;
          try {
            await addSearchButton();
          } finally {
            isProcessing = false;
          }
        }
      }, 250);
    };

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector('.twitter-block-search-btn') || isProcessing) {
        return;
      }

      const hasRelevantChanges = mutations.some((mutation) => {
        if (mutation.type !== 'childList' || mutation.addedNodes.length === 0) {
          return false;
        }

        return Array.from(mutation.addedNodes).some((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return false;
          if (
            node.getAttribute?.('data-testid') === 'inlinePrompt' ||
            node.querySelector?.('[data-testid="inlinePrompt"]')
          ) {
            return true;
          }
          return isBlockedText(node.textContent || '');
        });
      });

      if (hasRelevantChanges) {
        debouncedAddButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
      attributes: false
    });

    return observer;
  }

  let domObserver = null;

  async function init() {
    tbsLog('Инициализация юзерскрипта...');

    if (domObserver) {
      domObserver.disconnect();
    }

    await addSearchButton();
    domObserver = observeDOM();

    tbsLog('Юзерскрипт готов к работе');
  }

  function setupNavigationHandler() {
    let currentUrl = window.location.href;

    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        tbsLog('Смена URL (SPA навигация):', currentUrl);

        const existingBtn = document.querySelector('.twitter-block-search-btn');
        if (existingBtn) existingBtn.remove();
        const existingDot = document.querySelector('.twitter-block-search-status');
        if (existingDot) existingDot.remove();

        setTimeout(() => addSearchButton(), 300);
        setTimeout(() => addSearchButton(), 1000);
      }
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      setupNavigationHandler();
    });
  } else {
    init().then(() => setupNavigationHandler());
  }
})();
