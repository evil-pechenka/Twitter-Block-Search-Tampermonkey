# Twitter Block Search (Tampermonkey)

[English](#english) | [Русский](#русский)

---

## English

A Tampermonkey userscript that searches for mutual conversations on blocked profile pages on X/Twitter and adds a quick navigation button.

### Features

- Automatically searches for conversation history in the background when opening a blocked profile.
- Places the button neatly at the right side of the block notification header.
- **🔍 Magnifying Glass** — conversation found (click opens matching tweets).
- **🤡 Clown** — no messages found (click still opens search to verify).
- Works seamlessly across all UI languages.

### Installation

Requires the [Tampermonkey](https://www.tampermonkey.net/) extension.

#### Option 1: 1-Click Install (Recommended)
1. Open [`Twitter_Block_Search.user.js`](Twitter_Block_Search.user.js).
2. Click the **Raw** button.
3. Click **Install** in the Tampermonkey prompt.

#### Option 2: Manual
1. Create a new script in Tampermonkey (**+**).
2. Copy the code from [`Twitter_Block_Search.user.js`](Twitter_Block_Search.user.js) and paste it into the editor.
3. Save (**Ctrl+S**).

### Screenshots

**Search in progress:**  
![Search in progress](docs/images/search-in-progress.jpg)

**No messages found:**  
![No messages](docs/images/no-messages-clown.jpg)

**Conversation found:**  
![Conversation found](docs/images/search-complete.jpg)

---

## Русский

Скрипт для Tampermonkey: ищет взаимную переписку на странице заблокировавшего вас пользователя в X/Twitter и добавляет кнопку перехода к найденным твитам.

### Что делает

- Ищет переписку в фоне при открытии заблокированного профиля.
- Добавляет кнопку в правый угол карточки блокировки.
- **🔍 Лупа** — переписка найдена (клик открывает твиты).
- **🤡 Клоун** — переписки нет (клик всё равно открывает поиск).
- Работает на любом языке интерфейса.

### Установка

Требуется установленное расширение [Tampermonkey](https://www.tampermonkey.net/).

#### Способ 1: В 1 клик (Рекомендуется)
1. Откройте файл [`Twitter_Block_Search.user.js`](Twitter_Block_Search.user.js).
2. Нажмите кнопку **Raw**.
3. В окне Tampermonkey нажмите **Установить**.

#### Способ 2: Вручную
1. Создайте новый скрипт в Tampermonkey (**+**).
2. Скопируйте код из [`Twitter_Block_Search.user.js`](Twitter_Block_Search.user.js) и вставьте в редактор.
3. Сохраните (**Ctrl+S**).

### Скриншоты

**Поиск в процессе:**  
![Поиск](docs/images/search-in-progress.jpg)

**Сообщений нет:**  
![Клоун](docs/images/no-messages-clown.jpg)

**Переписка найдена:**  
![Лупа](docs/images/search-complete.jpg)
