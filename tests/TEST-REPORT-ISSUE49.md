# 🧪 Тест-репорт: Issue #49 - Playwright анализ

**Дата:** 2026-03-24  
**QA Engineer:** agent-004  
**GitHub Issue:** #49  
**Статус:** Анализ завершён

---

## ⚠️ Ограничения тестирования

**Проблема среды:** В текущем Docker-контейнере отсутствуют GUI-зависимости для запуска браузеров:
- `libnspr4.so` — отсутствует для Chromium
- `libX11-xcb.so.1`, `libgtk-3.so.0` — отсутствуют для Firefox

**Решение:** Проведён статический анализ кода через HTTP-запросы.

---

## 🔍 Результаты анализа кода

### 1. Проблема: "Сначала включите камеру"

**Найдено в:** `room.js`

**Места вызова:**
```javascript
// Строка 1035 - При попытке начать запись
if (!localStream) {
    alert('Сначала включите камеру');
    return;
}

// Строка 1254 - При применении виртуального фона
if (!localStream) {
    alert('Сначала включите камеру');
    return;
}
```

**Анализ:**
- Это сообщение появляется НЕ при создании комнаты
- Оно появляется при попытке использовать функции требующие камеру (запись, виртуальный фон)
- Пользователь мог перепутать с другой проблемой

---

### 2. Проблема: "Крутится колёсико Подключение к комнате"

**Найдено в:** `room.html` строки 921-924

```html
<div class="connecting-screen hidden" id="connectingScreen">
    <div class="spinner"></div>
    <p>Подключение к комнату...</p>
</div>
```

**Логика работы:**

1. **room.html** (строки 1313-1329):
```javascript
function enterRoom() {
    window.prejoinSettings = {
        camera: previewCameraEnabled,
        microphone: previewMicEnabled,
        stream: previewStream
    };
    
    // Скрываем экран подготовки
    document.getElementById('preJoinScreen').classList.add('hidden');
    
    // Показываем экран подключения
    document.getElementById('connectingScreen').classList.remove('hidden');
    
    // Запускаем инициализацию
    window.dispatchEvent(new CustomEvent('prejoinComplete', {
        detail: window.prejoinSettings
    }));
}
```

2. **room.js** (строки 559-567):
```javascript
// Слушаем событие завершения prejoin
ocument.addEventListener('prejoinComplete', (event) => {
    const { camera, microphone } = event.detail;
    
    // Вызываем connectToRoom с настройками
    connectToRoom({
        camera: camera,
        microphone: microphone
    });
});
```

3. **room.js** `connectToRoom` (строки 569-631):
```javascript
async function connectToRoom(settings = {}) {
    const { camera = true, microphone = true } = settings;
    
    try {
        if (window.prejoinSettings && window.prejoinSettings.stream) {
            // Используем существующий поток
            localStream = window.prejoinSettings.stream;
            // ... применяем настройки
        } else {
            // Запрашиваем доступ
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        
        // Скрываем экран подключения
        document.getElementById('connectingScreen').classList.add('hidden');
        
        // Подключаемся к комнате
        socket.emit('join-room', roomId);
        
    } catch (err) {
        console.error('Error:', err);
        alert('Ошибка доступа к камере/микрофону...');
    }
}
```

---

## ✅ Статус проблем

### Проблема #1: "Сначала включите камеру" при создании комнаты
**Статус:** ❌ НЕ ПОДТВЕРЖДЕНА

Код `index.html` (строки 257-310) показывает:
- `createRoom()` открывает модальное окно `#createRoomModal`
- `createRoomWithSettings()` делает POST на `/api/rooms` и редиректит
- НЕТ вызова `getUserMedia` при создании комнаты

**Вероятная причина:** Пользователь перепутал с другой ситуацией или использовал старую версию.

---

### Проблема #2: "Из окна подготовки не заходит в комнату"
**Статус:** ⚠️ ТРЕБУЕТ ПРОВЕРКИ В БРАУЗЕРЕ

Код выглядит исправленным:
- ✅ `room.html` выбрасывает событие `prejoinComplete`
- ✅ `room.js` слушает это событие
- ✅ `connectToRoom` скрывает `connectingScreen` после успеха

**Возможные проблемы:**
1. Ошибка в `navigator.mediaDevices.getUserMedia` — показывается alert, но экран подключения остаётся видимым
2. Ошибка сокета — `socket.emit('join-room')` не работает
3. Порядок загрузки скриптов (хотя в коде `room.js` подключается ПОСЛЕ inline скриптов)

---

## 🐛 Найденные потенциальные баги

### Баг #1: Экран подключения не скрывается при ошибке
**Файл:** `room.js` строка 631

```javascript
catch (err) {
    console.error('Error accessing media devices:', err);
    alert('Ошибка доступа к камере/микрофону...');
    // ❌ НЕТ скрытия connectingScreen!
}
```

**Проблема:** Если `getUserMedia` падает, пользователь видит бесконечное "Подключение к комнате..."

**Исправление:**
```javascript
catch (err) {
    console.error('Error accessing media devices:', err);
    document.getElementById('connectingScreen').classList.add('hidden');
    document.getElementById('preJoinScreen').classList.remove('hidden');
    alert('Ошибка доступа к камере/микрофону...');
}
```

---

### Баг #2: Опечатка в коде
**Файл:** `room.js` строка 559

```javascript
ocument.addEventListener('prejoinComplete', (event) => {
```

**Проблема:** `ocument` вместо `document` — событие не будет слушаться!

**Исправление:**
```javascript
document.addEventListener('prejoinComplete', (event) => {
```

---

## 📋 Рекомендации

### Немедленные действия:
1. **Исправить опечатку** `ocument` → `document` в `room.js:559`
2. **Добавить скрытие** `connectingScreen` при ошибке в `connectToRoom`

### Для полноценного тестирования:
1. Запустить тесты на машине с GUI (не в Docker)
2. Или установить зависимости браузеров в контейнер
3. Или использовать Playwright в headless-режиме с xvfb

---

## 📁 Связанные файлы

- `/data/workspace/web/index.html` — главная страница
- `/data/workspace/web/room.html` — страница комнаты (prejoin экран)
- `/data/workspace/web/room.js` — логика комнаты

---

## 🎯 Итог

| Проблема | Статус | Причина |
|----------|--------|---------|
| Окно "Сначала включите камеру" | ❌ Не подтверждена | Нет в коде создания комнаты |
| Колёсико "Подключение" | ⚠️ Возможно из-за опечатки | `ocument` вместо `document` |
| Вход в комнату | ⚠️ Требует проверки после фикса | Опечатка блокирует событие |

**Критический баг найден:** Опечатка `ocument.addEventListener` блокирует весь механизм prejoin → room.

---

*Отчёт создан: 2026-03-24 17:35 UTC*
