# 🧪 Тест-репорт: Issue #47 и #48

**Дата:** 2026-03-24  
**QA Engineer:** agent-004  
**GitHub Issues:** #47, #48  

---

## 📋 Сводка проблем

Пользователь сообщил о 3 проблемах:
1. При нажатии "Создать комнату" появляется окно "Сначала включите камеру" (не должно)
2. Из окна подготовки не заходит в комнату
3. Ошибки 404: tf.min.js.map, body-pix.min.js.map

---

## 🔍 Результаты тестирования

### 1. Главная страница — Создание комнаты

| Проверка | Статус | Комментарий |
|----------|--------|-------------|
| Нажать "Создать комнату" | ✅ PASS | Открывается модальное окно |
| Модальное окно (не окно камеры!) | ✅ PASS | Корректное модальное окно |
| Ввести название и пароль | ✅ PASS | Поля работают |
| Нажать "Создать" | ⚠️ PARTIAL | Редирект происходит, но есть проблемы |

**Код проверки (index.html:102-134):**
```javascript
function createRoom() {
    // Открываем модальное окно вместо старого поведения
    document.getElementById('createRoomModal').classList.add('show');
    document.getElementById('newRoomName').focus();
}
```

✅ **Проблема #1 НЕ воспроизводится** — модальное окно открывается корректно.

---

### 2. Экран подготовки (Pre-join)

| Проверка | Статус | Комментарий |
|----------|--------|-------------|
| Показывается превью камеры | ✅ PASS | Работает через `initPreview()` |
| Кнопки вкл/выкл камеры | ✅ PASS | `togglePreviewCamera()` работает |
| Кнопки вкл/выкл микрофона | ✅ PASS | `togglePreviewMic()` работает |
| Кнопка "Войти в комнату" | ⚠️ PARTIAL | Есть проблема с логикой |
| Переход в комнату | ❌ FAIL | **Конфликт между room.html и room.js** |

**🔴 КРИТИЧНАЯ ПРОБЛЕМА НАЙДЕНА:**

В `room.html` (строки 1177-1233) есть функция `enterRoom()`:
```javascript
function enterRoom() {
    window.prejoinSettings = { ... };
    document.getElementById('preJoinScreen').classList.add('hidden');
    document.getElementById('connectingScreen').classList.remove('hidden');
    window.dispatchEvent(new CustomEvent('prejoinComplete', { ... }));
}
```

НО в `room.js` (строки 427-430):
```javascript
window.onload = function() {
    connectToRoom();  // <-- Вызывается сразу, без ожидания prejoinComplete!
};
```

**Проблема:** `room.js` не слушает событие `prejoinComplete` и сразу пытается подключиться к комнате через `connectToRoom()`, которая запрашивает камеру/микрофон заново!

**Это объясняет проблему #2** — пользователь видит попытку подключения до нажатия кнопки "Войти".

---

### 3. Ошибки в консоли

| Ошибка | Статус | Причина |
|--------|--------|---------|
| `tf.min.js.map` 404 | ⚠️ WARNING | Source map TensorFlow.js |
| `body-pix.min.js.map` 404 | ⚠️ WARNING | Source map BodyPix |

**Код (room.html:1174-1175):**
```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.2.0"></script>
```

⚠️ **Это НЕ критичные ошибки** — source maps загружаются только для отладки и не влияют на работу приложения. CDN не предоставляет .map файлы для production-сборок.

---

## 🐛 Найденные баги

### Баг #1: Конфликт инициализации (КРИТИЧНЫЙ)
**Файлы:** `room.html`, `room.js`  
**Описание:** `room.js` вызывает `connectToRoom()` при загрузке, игнорируя prejoin-экран  
**Влияние:** Пользователь видит "подключение" до нажатия кнопки "Войти"

### Баг #2: Дублирование запроса медиа
**Файлы:** `room.html`, `room.js`  
**Описание:** Камера запрашивается дважды — в `initPreview()` и в `connectToRoom()`  
**Влияние:** Лишние запросы разрешений, возможные конфликты

### Баг #3: Неиспользуемый prejoinComplete
**Файлы:** `room.js`  
**Описание:** Событие `prejoinComplete` выбрасывается, но не обрабатывается  
**Влияние:** Логика prejoin не интегрирована с основным кодом

---

## 💡 Рекомендации по исправлению

### 1. Исправить инициализацию в room.js

```javascript
// Вместо:
window.onload = function() {
    connectToRoom();
};

// Сделать:
window.onload = function() {
    // Ждём события от prejoin-экрана
    window.addEventListener('prejoinComplete', function(e) {
        const settings = e.detail;
        connectToRoomWithSettings(settings);
    });
};

// Новая функция для подключения с настройками prejoin
async function connectToRoomWithSettings(settings) {
    try {
        // Используем поток из prejoin, если есть
        if (settings.stream) {
            localStream = settings.stream;
        } else {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: settings.camera,
                audio: settings.microphone
            });
        }
        
        addVideoStream(localStream, 'local', true);
        document.getElementById('connectingScreen').classList.add('hidden');
        socket.emit('join-room', roomId);
        addChatMessage('Система', 'Вы присоединились к комнате', true);
        
    } catch (err) {
        console.error('Error:', err);
        alert('Ошибка доступа к камере/микрофону');
    }
}
```

### 2. Удалить дублирующий connectToRoom

Убрать старый `connectToRoom()` или объединить с новой логикой.

### 3. Исправить порядок скрытия экранов

В `enterRoom()` сначала скрывать `preJoinScreen`, потом показывать `connectingScreen`:
```javascript
function enterRoom() {
    // Сначала скрываем prejoin
    document.getElementById('preJoinScreen').classList.add('hidden');
    // Потом показываем подключение
    document.getElementById('connectingScreen').classList.remove('hidden');
    // Вызываем событие
    window.dispatchEvent(new CustomEvent('prejoinComplete', {
        detail: window.prejoinSettings
    }));
}
```

### 4. Source maps (опционально)

Для устранения 404 можно:
- Игнорировать (не влияет на работу)
- Или добавить комментарий в HTML: `<!-- Source maps intentionally omitted for production -->`

---

## 📊 Итоговая оценка

| Критерий | Оценка |
|----------|--------|
| Создание комнаты | ✅ Работает корректно |
| Prejoin экран | ⚠️ UI работает, логика сломана |
| Вход в комнату | ❌ Не работает как задумано |
| Ошибки 404 | ⚠️ Некритичные source maps |

**Общий статус:** ❌ **Требуется исправление** — prejoin-логика не интегрирована с room.js

---

## 🔗 Связанные файлы

- `/data/workspace/web/index.html` — главная страница
- `/data/workspace/web/room.html` — страница комнаты с prejoin
- `/data/workspace/web/room.js` — логика комнаты (требует правки)

---

*Отчёт создан: 2026-03-24 17:15 UTC*
