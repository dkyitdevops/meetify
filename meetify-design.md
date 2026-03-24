# Meetify UI Redesign — Issue #41
## Упрощённое создание комнаты

---

## Проблема
Сейчас для создания комнаты нужно нажимать **две кнопки**: сначала "Создать комнату", потом подтверждение в модальном окне. Это лишнее трение для пользователя.

## Решение
**Одна кнопка → сразу в комнате.** Все настройки переносятся внутрь комнаты.

---

## 1. Главная страница (`index.html`)

### Текущий UI (что убрать)
- Модальное окно с подтверждением создания
- Второй клик для входа

### Новый UI

```
┌─────────────────────────────────────────┐
│                                         │
│              🎥 Meetify                 │
│                                         │
│    Простые видеовстречи без регистрации │
│                                         │
│         ┌─────────────────┐             │
│         │  🚀 Создать     │             │
│         │    комнату      │             │
│         └─────────────────┘             │
│                                         │
│    ───────────  или  ───────────        │
│                                         │
│    [ Введите код комнаты    ] [ → ]     │
│                                         │
└─────────────────────────────────────────┘
```

### Изменения в `index.html`

#### HTML
```html
<main class="hero">
  <h1>🎥 Meetify</h1>
  <p class="subtitle">Простые видеовстречи без регистрации</p>
  
  <!-- Единственная кнопка создания -->
  <button id="createRoomBtn" class="btn-primary btn-large">
    🚀 Создать комнату
  </button>
  
  <div class="divider">или</div>
  
  <!-- Присоединение по коду -->
  <form id="joinForm" class="join-form">
    <input 
      type="text" 
      id="roomCode" 
      placeholder="Введите код комнаты"
      maxlength="10"
    />
    <button type="submit" class="btn-secondary">→</button>
  </form>
</main>
```

#### JavaScript (упрощённый)
```javascript
// Было: открытие модалки → подтверждение → переход
// Стало: один клик → сразу переход

document.getElementById('createRoomBtn').addEventListener('click', async () => {
  // Генерируем ID комнаты на клиенте или получаем с сервера
  const roomId = generateRoomId(); // или await fetch('/api/rooms', {method: 'POST'})
  
  // Сразу редирект — без модалок
  window.location.href = `/room/${roomId}`;
});
```

---

## 2. Страница комнаты (`room.html`)

### Новая панель настроек

Все настройки теперь **внутри комнаты** — в боковой панели или выпадающем меню.

```
┌─────────────────────────────────────────────────────────────┐
│  Meetify │ Room: abc-123-x │ [🔗 Копировать ссылку]  [⚙️]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   👤 You    │  │   👤 ...    │  │   ➕        │         │
│  │  (muted)    │  │  (waiting)  │  │  Invite     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              [ Видео-зона участников ]              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [🎤] [📹] [🖥️] [📤]                              [❌]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                    [⚙️] Нажато — открывается панель:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗  │
│  ║  ⚙️ Настройки комнаты                          [✕]  ║  │
│  ╠═══════════════════════════════════════════════════════╣  │
│  ║                                                       ║  │
│  ║  📛 Название комнаты                                  ║  │
│  ║  [Встреча без названия                    ] [💾]      ║  │
│  ║                                                       ║  │
│  ║  🔒 Защита                                            ║  │
│  ║  [ ] Требовать пароль для входа                       ║  │
│  ║      [••••••          ] 👁                            ║  │
│  ║                                                       ║  │
│  ║  👥 Пригласить участников                             ║  │
│  ║  ┌─────────────────────────────────────────┐          ║  │
│  ║  │ 🔗 https://meetify.io/r/abc-123-x       │ [Копир.] ║  │
│  ║  └─────────────────────────────────────────┘          ║  │
│  ║  [📧 Email]  [💬 WhatsApp]  [📱 Telegram]             ║  │
│  ║                                                       ║  │
│  ║  ─────────────────────────────────────────            ║  │
│  ║  🔴 Закрыть комнату для всех                          ║  │
│  ║                                                       ║  │
│  ╚═══════════════════════════════════════════════════════╝  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Изменения в `room.html`

#### HTML — Шапка с кнопкой настроек
```html
<header class="room-header">
  <div class="logo">🎥 Meetify</div>
  
  <div class="room-info">
    <span class="room-label">Комната:</span>
    <span class="room-id" id="roomId">abc-123-x</span>
    <button id="copyLinkBtn" class="btn-icon" title="Копировать ссылку">
      🔗
    </button>
  </div>
  
  <button id="settingsBtn" class="btn-icon" title="Настройки">
    ⚙️
  </button>
</header>
```

#### HTML — Панель настроек (модальное окно/сайдбар)
```html
<!-- Панель настроек — изначально скрыта -->
<aside id="settingsPanel" class="settings-panel hidden">
  <div class="settings-header">
    <h3>⚙️ Настройки комнаты</h3>
    <button id="closeSettings" class="btn-icon">✕</button>
  </div>
  
  <div class="settings-content">
    <!-- Название комнаты -->
    <section class="setting-group">
      <label for="roomName">📛 Название комнаты</label>
      <div class="input-with-action">
        <input 
          type="text" 
          id="roomName" 
          placeholder="Встреча без названия"
          maxlength="50"
        />
        <button id="saveName" class="btn-icon" title="Сохранить">💾</button>
      </div>
    </section>
    
    <!-- Пароль -->
    <section class="setting-group">
      <label class="checkbox-label">
        <input type="checkbox" id="enablePassword" />
        🔒 Требовать пароль для входа
      </label>
      
      <div id="passwordField" class="password-input hidden">
        <div class="input-with-action">
          <input 
            type="password" 
            id="roomPassword" 
            placeholder="Введите пароль"
            minlength="4"
            maxlength="20"
          />
          <button id="togglePassword" class="btn-icon" title="Показать">👁</button>
        </div>
        <button id="savePassword" class="btn-small">Установить пароль</button>
      </div>
    </section>
    
    <!-- Приглашение -->
    <section class="setting-group">
      <label>👥 Пригласить участников</label>
      
      <div class="invite-link-box">
        <input 
          type="text" 
          id="inviteLink" 
          readonly 
          value="https://meetify.io/r/abc-123-x"
        />
        <button id="copyInviteLink" class="btn-secondary">Копировать</button>
      </div>
      
      <div class="share-buttons">
        <button class="btn-share" data-type="email">📧 Email</button>
        <button class="btn-share" data-type="whatsapp">💬 WhatsApp</button>
        <button class="btn-share" data-type="telegram">📱 Telegram</button>
      </div>
    </section>
    
    <!-- Опасная зона -->
    <section class="setting-group danger-zone">
      <button id="closeRoom" class="btn-danger">
        🔴 Закрыть комнату для всех
      </button>
    </section>
  </div>
</aside>
```

#### CSS — Ключевые стили
```css
/* Панель настроек — сайдбар справа */
.settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100vh;
  background: #1a1a2e;
  border-left: 1px solid #333;
  z-index: 1000;
  transform: translateX(0);
  transition: transform 0.3s ease;
  overflow-y: auto;
}

.settings-panel.hidden {
  transform: translateX(100%);
}

/* Группы настроек */
.setting-group {
  padding: 20px;
  border-bottom: 1px solid #333;
}

.setting-group label {
  display: block;
  margin-bottom: 10px;
  color: #fff;
  font-weight: 500;
}

/* Поля ввода с действием */
.input-with-action {
  display: flex;
  gap: 8px;
}

.input-with-action input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #444;
  border-radius: 8px;
  background: #0f0f1a;
  color: #fff;
  font-size: 14px;
}

/* Блок ссылки */
.invite-link-box {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.invite-link-box input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #444;
  border-radius: 8px;
  background: #0f0f1a;
  color: #888;
  font-size: 13px;
  font-family: monospace;
}

/* Кнопки шаринга */
.share-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-share {
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  background: transparent;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-share:hover {
  background: #333;
  color: #fff;
}

/* Опасная зона */
.danger-zone {
  border-top: 2px solid #442222;
}

.btn-danger {
  width: 100%;
  padding: 12px;
  border: 1px solid #ff4444;
  border-radius: 8px;
  background: transparent;
  color: #ff6666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #ff4444;
  color: #fff;
}
```

#### JavaScript — Логика настроек
```javascript
// Открытие/закрытие панели
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');

settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.remove('hidden');
});

closeSettings.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
});

// Название комнаты
const roomNameInput = document.getElementById('roomName');
const saveNameBtn = document.getElementById('saveName');

saveNameBtn.addEventListener('click', async () => {
  const name = roomNameInput.value.trim();
  await updateRoomSettings({ name });
  showToast('Название сохранено');
});

// Пароль
const enablePassword = document.getElementById('enablePassword');
const passwordField = document.getElementById('passwordField');
const roomPassword = document.getElementById('roomPassword');
const savePassword = document.getElementById('savePassword');

enablePassword.addEventListener('change', () => {
  passwordField.classList.toggle('hidden', !enablePassword.checked);
  if (!enablePassword.checked) {
    updateRoomSettings({ password: null }); // Убираем пароль
  }
});

savePassword.addEventListener('click', async () => {
  const password = roomPassword.value;
  if (password.length < 4) {
    showToast('Пароль минимум 4 символа', 'error');
    return;
  }
  await updateRoomSettings({ password });
  showToast('Пароль установлен');
});

// Копирование ссылки
const copyInviteLink = document.getElementById('copyInviteLink');
const inviteLink = document.getElementById('inviteLink');

copyInviteLink.addEventListener('click', () => {
  navigator.clipboard.writeText(inviteLink.value);
  showToast('Ссылка скопирована!');
});

// Шаринг
const shareButtons = document.querySelectorAll('.btn-share');
shareButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const url = inviteLink.value;
    const text = `Присоединяйся к встрече: ${url}`;
    
    const shareUrls = {
      email: `mailto:?subject=Приглашение на встречу&body=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Присоединяйся к встрече')}`
    };
    
    window.open(shareUrls[type], '_blank');
  });
});

// Закрытие комнаты
const closeRoomBtn = document.getElementById('closeRoom');
closeRoomBtn.addEventListener('click', async () => {
  if (confirm('Все участники будут отключены. Продолжить?')) {
    await closeRoom();
    window.location.href = '/';
  }
});
```

---

## 3. API изменения (для бэкенда)

### Новые эндпоинты

```javascript
// PATCH /api/rooms/:id/settings
// Обновление настроек комнаты
{
  "name": "Новое название",      // optional
  "password": "secret123",       // optional, null = убрать
  "locked": false                // optional, запретить вход
}

// POST /api/rooms/:id/close
// Закрыть комнату полностью
```

### WebSocket события

```javascript
// Сервер → Клиенты
{
  type: 'room_updated',
  data: {
    name: 'Новое название',
    hasPassword: true
  }
}

{
  type: 'room_closed',
  data: {
    reason: 'host_closed'
  }
}
```

---

## 4. Флоу пользователя

### Создание комнаты (новый флоу)

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  index.html │────▶│  Клик "Создать" │────▶│  room.html      │
│             │     │  (без модалок)  │     │  (новая комната)│
└─────────────┘     └─────────────────┘     └─────────────────┘
                                                    │
                                                    ▼
                                            ┌─────────────────┐
                                            │  Панель настроек │
                                            │  (⚙️) — по желанию│
                                            │                 │
                                            │  • Название     │
                                            │  • Пароль       │
                                            │  • Приглашение  │
                                            └─────────────────┘
```

### Присоединение к комнате

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  index.html │────▶│  Ввод кода      │────▶│  room.html      │
│             │     │  или ссылки     │     │                 │
└─────────────┘     └─────────────────┘     └─────────────────┘
                                                    │
                                                    ▼
                                            ┌─────────────────┐
                                            │  Есть пароль?   │
                                            └─────────────────┘
                                                    │
                              Да ──────────────────┴────────────────── Нет
                              │                                        │
                              ▼                                        ▼
                    ┌─────────────────┐                      ┌─────────────────┐
                    │  Модалка пароля │                      │  Сразу в комнату│
                    │  [••••••] [→]   │                      │                 │
                    └─────────────────┘                      └─────────────────┘
```

---

## 5. Чеклист внедрения

### Фронтенд
- [ ] Упростить `index.html` — убрать модальное окно создания
- [ ] Добавить панель настроек в `room.html`
- [ ] Стили для панели настроек (сайдбар)
- [ ] JavaScript для управления настройками
- [ ] Обработка WebSocket событий

### Бэкенд
- [ ] Эндпоинт `PATCH /api/rooms/:id/settings`
- [ ] Эндпоинт `POST /api/rooms/:id/close`
- [ ] WebSocket: событие `room_updated`
- [ ] WebSocket: событие `room_closed`
- [ ] Проверка пароля при входе в комнату

### UX
- [ ] Toast-уведомления о сохранении
- [ ] Подтверждение закрытия комнаты
- [ ] Индикатор "комната защищена паролем" 🔒

---

## 6. Альтернативные варианты

### Вариант A: Панель снизу (для мобильных)
```
┌─────────────────────────────┐
│                             │
│      [ Видео-зона ]         │
│                             │
├─────────────────────────────┤
│  📛 Название  [Редактировать]│
│  🔒 [ ] Пароль               │
│  👥 [Пригласить]             │
└─────────────────────────────┘
```

### Вариант B: Пошаговая настройка при первом входе
```
┌─────────────────────────────────┐
│  Добро пожаловать в комнату!    │
│                                 │
│  Шаг 1/3: Дайте комнате имя     │
│  [Моя встреча         ]         │
│                                 │
│  [Пропустить]  [Далее →]        │
└─────────────────────────────────┘
```

**Рекомендация:** Основной вариант (панель справа) — универсальное решение для десктопа и планшетов. Для мобильных — Вариант A (панель снизу).

---

*Дизайн для GitHub Issue #41 — Упрощённое создание комнаты*
