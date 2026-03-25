# Pixso Plugin API Skill

## Описание

**Pixso** — облачный инструмент для совместного дизайна, аналог Figma с поддержкой плагинов. Pixso Plugin API позволяет автоматизировать создание и редактирование дизайнов, создавать кастомные инструменты и интеграции.

### Особенности Pixso Plugin API

- **Браузерный JavaScript** — плагины работают внутри Pixso
- **Прямой доступ к canvas** — создание, чтение и изменение элементов
- **UI API** — создание модальных окон и панелей
- **postMessage** — коммуникация между UI и main потоком
- **Асинхронные операции** — все API методы возвращают Promise

---

## Структура плагина

Каждый плагин Pixso состоит из трёх файлов:

```
my-plugin/
├── manifest.json    # Метаданные плагина
├── main.js          # Главный скрипт (доступ к API)
└── ui.html          # UI интерфейс (опционально)
```

### 1. manifest.json

```json
{
  "name": "My Pixso Plugin",
  "id": "unique-plugin-id",
  "api": "1.0.0",
  "main": "main.js",
  "ui": "ui.html",
  "editorType": ["pixso"],
  "networkAccess": {
    "allowedDomains": ["https://api.example.com"]
  }
}
```

**Поля:**
- `name` — отображаемое имя плагина
- `id` — уникальный идентификатор
- `api` — версия Plugin API
- `main` — путь к главному скрипту
- `ui` — путь к HTML файлу интерфейса
- `editorType` — тип редактора (pixso)
- `networkAccess` — разрешённые домены для сетевых запросов

### 2. main.js

Главный скрипт имеет доступ к глобальному объекту `pixso`:

```javascript
// main.js
pixso.showUI(__html__, { width: 400, height: 300 });

pixso.ui.onmessage = (msg) => {
  if (msg.type === 'create-rect') {
    const rect = pixso.createRectangle();
    rect.x = msg.x;
    rect.y = msg.y;
    rect.width = msg.width;
    rect.height = msg.height;
    rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }];
  }
};
```

### 3. ui.html

HTML файл для пользовательского интерфейса:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    button { padding: 10px 20px; }
  </style>
</head>
<body>
  <h2>Create Rectangle</h2>
  <button id="create">Create</button>
  <script>
    document.getElementById('create').onclick = () => {
      parent.postMessage({ 
        pluginMessage: { 
          type: 'create-rect',
          x: 100,
          y: 100,
          width: 200,
          height: 100
        } 
      }, '*');
    };
  </script>
</body>
</html>
```

---

## API Reference

### Создание элементов

#### pixso.createRectangle()

Создаёт прямоугольник на canvas.

```javascript
const rect = pixso.createRectangle();
rect.x = 0;
rect.y = 0;
rect.width = 100;
rect.height = 50;
rect.fills = [{
  type: 'SOLID',
  color: { r: 0.18, g: 0.52, b: 0.96 }  // RGB 0-1
}];
rect.cornerRadius = 8;
rect.name = 'My Rectangle';
```

#### pixso.createText()

Создаёт текстовый элемент.

```javascript
const text = pixso.createText();
text.x = 50;
text.y = 50;
text.fontSize = 16;
text.fontName = { family: 'Inter', style: 'Regular' };
text.characters = 'Hello, Pixso!';
text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
text.textAlignHorizontal = 'CENTER';
text.textAlignVertical = 'CENTER';
```

#### pixso.createEllipse()

Создаёт эллипс или круг.

```javascript
const ellipse = pixso.createEllipse();
ellipse.x = 100;
ellipse.y = 100;
ellipse.width = 80;
ellipse.height = 80;  // Для круга width === height
ellipse.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
```

### UI API

#### pixso.showUI(html, options)

Открывает модальное окно с UI плагина.

```javascript
pixso.showUI(__html__, {
  width: 400,
  height: 300,
  title: 'Plugin Title'
});
```

**Параметры:**
- `html` — строка с HTML содержимым (переменная `__html__` из ui.html)
- `options.width` — ширина окна в пикселях
- `options.height` — высота окна в пикселях
- `options.title` — заголовок окна

#### pixso.ui.onmessage

Обработчик сообщений от UI.

```javascript
pixso.ui.onmessage = (message) => {
  console.log('Received:', message);
  // message.type — тип сообщения
  // message.data — произвольные данные
};
```

#### pixso.ui.postMessage()

Отправка сообщений из main.js в UI.

```javascript
pixso.ui.postMessage({ 
  type: 'data-loaded', 
  data: { items: [1, 2, 3] } 
});
```

### postMessage коммуникация

#### Из UI в main.js

```javascript
// В ui.html
parent.postMessage({
  pluginMessage: {
    type: 'action-name',
    payload: { key: 'value' }
  }
}, '*');
```

#### Из main.js в UI

```javascript
// В main.js
pixso.ui.postMessage({
  type: 'response',
  data: result
});
```

#### Получение в UI

```javascript
// В ui.html
window.onmessage = (event) => {
  const message = event.data.pluginMessage;
  if (message.type === 'response') {
    console.log('Received:', message.data);
  }
};
```

---

## Примеры использования

### Пример 1: Создание кнопки

```javascript
// main.js
pixso.showUI(__html__, { width: 300, height: 200 });

pixso.ui.onmessage = (msg) => {
  if (msg.type === 'create-button') {
    // Создаём фон кнопки
    const button = pixso.createRectangle();
    button.x = msg.x;
    button.y = msg.y;
    button.width = msg.width;
    button.height = msg.height;
    button.fills = [{
      type: 'SOLID',
      color: msg.bgColor || { r: 0.18, g: 0.52, b: 0.96 }
    }];
    button.cornerRadius = msg.radius || 8;
    button.name = 'Button Background';
    
    // Создаём текст кнопки
    const text = pixso.createText();
    text.x = msg.x + msg.width / 2;
    text.y = msg.y + msg.height / 2;
    text.fontSize = msg.fontSize || 14;
    text.fontName = { family: 'Inter', style: 'Medium' };
    text.characters = msg.label || 'Button';
    text.fills = [{
      type: 'SOLID',
      color: msg.textColor || { r: 1, g: 1, b: 1 }
    }];
    text.textAlignHorizontal = 'CENTER';
    text.textAlignVertical = 'CENTER';
    text.name = 'Button Label';
  }
};
```

### Пример 2: Генерация цветовой палитры

```javascript
function createColorPalette(colors, startX, startY) {
  const swatchSize = 60;
  const gap = 10;
  
  colors.forEach((color, index) => {
    const rect = pixso.createRectangle();
    rect.x = startX + (index % 5) * (swatchSize + gap);
    rect.y = startY + Math.floor(index / 5) * (swatchSize + gap);
    rect.width = swatchSize;
    rect.height = swatchSize;
    rect.fills = [{
      type: 'SOLID',
      color: { r: color.r, g: color.g, b: color.b }
    }];
    rect.name = `Color ${index + 1}`;
  });
}

// Использование
const palette = [
  { r: 1, g: 0, b: 0 },
  { r: 0, g: 1, b: 0 },
  { r: 0, g: 0, b: 1 },
  // ...
];
createColorPalette(palette, 0, 0);
```

### Пример 3: Двусторонняя коммуникация

```javascript
// main.js
pixso.showUI(__html__, { width: 400, height: 300 });

// Отправка данных в UI при запуске
const selection = pixso.currentPage.selection;
pixso.ui.postMessage({
  type: 'selection-changed',
  count: selection.length
});

pixso.ui.onmessage = async (msg) => {
  if (msg.type === 'fetch-data') {
    // Имитация API запроса
    const data = await fetchFromAPI(msg.url);
    pixso.ui.postMessage({
      type: 'data-received',
      data: data
    });
  }
};
```

```html
<!-- ui.html -->
<!DOCTYPE html>
<html>
<body>
  <div id="status">Selected: 0 items</div>
  <button id="load">Load Data</button>
  <div id="result"></div>
  
  <script>
    // Получение от main.js
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === 'selection-changed') {
        document.getElementById('status').textContent = 
          `Selected: ${msg.count} items`;
      }
      if (msg.type === 'data-received') {
        document.getElementById('result').textContent = 
          JSON.stringify(msg.data);
      }
    };
    
    // Отправка в main.js
    document.getElementById('load').onclick = () => {
      parent.postMessage({
        pluginMessage: {
          type: 'fetch-data',
          url: 'https://api.example.com/data'
        }
      }, '*');
    };
  </script>
</body>
</html>
```

---

## Установка плагина в Pixso

### Шаг 1: Открыть меню плагинов

1. Откройте файл в Pixso
2. Перейдите в меню **Plugins** → **Development** → **Import plugin from manifest...**

### Шаг 2: Выбрать manifest.json

1. Нажмите **Select manifest.json file**
2. Выберите файл `manifest.json` из папки плагина
3. Плагин появится в списке Development плагинов

### Шаг 3: Запуск плагина

1. Откройте **Plugins** → **Development** → **Your Plugin Name**
2. Или используйте сочетание клавиш (если назначено)

### Шаг 4: Обновление плагина

После изменения кода:
1. Сохраните изменения в файлах
2. В Pixso: **Plugins** → **Development** → **Your Plugin** → перезапустите

---

## Отладка

### Консоль разработчика

1. Откройте плагин
2. Нажмите **F12** или **Cmd+Option+I** (Mac)
3. Перейдите на вкладку **Console**

### Логирование

```javascript
// В main.js
console.log('Debug info:', variable);

// В ui.html
<script>
  console.log('UI loaded');
</script>
```

### Обработка ошибок

```javascript
pixso.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'risky-operation') {
      const result = await performOperation();
      pixso.ui.postMessage({ type: 'success', data: result });
    }
  } catch (error) {
    pixso.ui.postMessage({ 
      type: 'error', 
      message: error.message 
    });
  }
};
```

---

## Полезные ссылки

- [Pixso Plugin API Documentation](https://developers.pixso.net/)
- [Pixso Plugin Samples](https://github.com/pixso-plugin-samples)
- [Community Plugins](https://pixso.net/community/plugins)

---

## Скрипты в этом skill

- `scripts/create-button.js` — готовый плагин для создания кнопки "Join Room"
