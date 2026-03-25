# Pixso Plugin API Reference

## Основные методы

### Создание элементов

#### pixso.createRectangle()

Создаёт прямоугольник на текущей странице.

**Возвращает:** `RectangleNode`

**Свойства:**
- `x: number` — позиция X
- `y: number` — позиция Y
- `width: number` — ширина
- `height: number` — высота
- `fills: Paint[]` — заливки
- `strokes: Paint[]` — обводки
- `strokeWeight: number` — толщина обводки
- `cornerRadius: number | number[]` — радиус скругления углов
- `name: string` — имя слоя

**Пример:**
```javascript
const rect = pixso.createRectangle();
rect.x = 100;
rect.y = 50;
rect.width = 200;
rect.height = 60;
rect.fills = [{
  type: 'SOLID',
  color: { r: 0.18, g: 0.52, b: 0.96 }
}];
rect.cornerRadius = 8;
rect.name = 'Button Background';
```

---

#### pixso.createText()

Создаёт текстовый элемент.

**Возвращает:** `TextNode`

**Свойства:**
- `x: number` — позиция X
- `y: number` — позиция Y
- `characters: string` — текстовое содержимое
- `fontSize: number` — размер шрифта
- `fontName: FontName` — семейство и стиль шрифта
- `fills: Paint[]` — цвет текста
- `textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'` — горизонтальное выравнивание
- `textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM'` — вертикальное выравнивание
- `lineHeight: number | { value: number, unit: 'PIXELS' | 'PERCENT' }` — высота строки
- `letterSpacing: number` — межбуквенный интервал

**Пример:**
```javascript
const text = pixso.createText();
text.x = 200;
text.y = 80;
text.fontSize = 16;
text.fontName = { family: 'Inter', style: 'Medium' };
text.characters = 'Click Me';
text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
text.textAlignHorizontal = 'CENTER';
text.textAlignVertical = 'CENTER';
```

---

#### pixso.createEllipse()

Создаёт эллипс или круг.

**Возвращает:** `EllipseNode`

**Свойства:**
- `x: number` — позиция X
- `y: number` — позиция Y
- `width: number` — ширина
- `height: number` — высота
- `fills: Paint[]` — заливки
- `strokes: Paint[]` — обводки
- `arcData: ArcData` — данные для создания секторов (опционально)

**Пример:**
```javascript
const circle = pixso.createEllipse();
circle.x = 150;
circle.y = 150;
circle.width = 100;
circle.height = 100;  // width === height для круга
circle.fills = [{
  type: 'SOLID',
  color: { r: 0.95, g: 0.3, b: 0.3 }
}];
```

---

### UI API

#### pixso.showUI(html, options)

Отображает модальное окно с пользовательским интерфейсом.

**Параметры:**
- `html: string` — HTML содержимое (используйте `__html__` для загрузки из ui.html)
- `options: ShowUIOptions` — настройки окна

**ShowUIOptions:**
- `width: number` — ширина окна (по умолчанию 300)
- `height: number` — высота окна (по умолчанию 200)
- `title: string` — заголовок окна
- `position: 'default' | 'last' | { x: number, y: number }` — позиция окна

**Пример:**
```javascript
pixso.showUI(__html__, {
  width: 400,
  height: 300,
  title: 'My Plugin'
});
```

---

#### pixso.ui.onmessage

Обработчик сообщений, получаемых от UI.

**Тип:** `(message: any) => void`

**Пример:**
```javascript
pixso.ui.onmessage = (message) => {
  console.log('Received from UI:', message);
  
  switch (message.type) {
    case 'create':
      handleCreate(message.data);
      break;
    case 'cancel':
      pixso.closePlugin();
      break;
  }
};
```

---

#### pixso.ui.postMessage(message)

Отправляет сообщение из main.js в UI.

**Параметры:**
- `message: any` — произвольные данные для отправки

**Пример:**
```javascript
pixso.ui.postMessage({
  type: 'selection-count',
  count: pixso.currentPage.selection.length
});
```

---

### postMessage коммуникация

#### От UI к main.js

UI отправляет сообщения через `parent.postMessage()`:

```javascript
// В ui.html
parent.postMessage({
  pluginMessage: {
    type: 'action-type',
    data: { key: 'value' }
  }
}, '*');
```

**Важно:**
- Сообщение должно быть обёрнуто в объект с полем `pluginMessage`
- Второй аргумент `'*'` разрешает отправку из iframe

---

#### От main.js к UI

Main.js отправляет сообщения через `pixso.ui.postMessage()`:

```javascript
// В main.js
pixso.ui.postMessage({
  type: 'response-type',
  data: result
});
```

---

#### Получение в UI

UI получает сообщения через `window.onmessage`:

```javascript
// В ui.html
window.onmessage = (event) => {
  const message = event.data.pluginMessage;
  
  if (message) {
    console.log('Received from main:', message);
    
    if (message.type === 'response-type') {
      updateUI(message.data);
    }
  }
};
```

---

## Типы данных

### Paint (заливка/обводка)

```typescript
type Paint = 
  | { type: 'SOLID'; color: RGB }
  | { type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND'; gradientTransform: Transform; gradientStops: ColorStop[] }
  | { type: 'IMAGE'; imageHash: string; scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE' };
```

### RGB (цвет)

```typescript
interface RGB {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
}
```

### FontName (шрифт)

```typescript
interface FontName {
  family: string;  // Например: "Inter", "Roboto"
  style: string;   // Например: "Regular", "Bold", "Medium"
}
```

---

## Дополнительные методы

### Работа со страницами

```javascript
// Текущая страница
const currentPage = pixso.currentPage;

// Создание новой страницы
const newPage = pixso.createPage();
newPage.name = 'New Page';

// Переключение на страницу
pixso.currentPage = newPage;
```

### Работа с выделением

```javascript
// Получить выделенные элементы
const selection = pixso.currentPage.selection;

// Установить выделение
pixso.currentPage.selection = [node1, node2];

// Очистить выделение
pixso.currentPage.selection = [];
```

### Группировка

```javascript
const group = pixso.group([node1, node2, node3], parent);
group.name = 'My Group';
```

### Удаление

```javascript
node.remove();
```

### Клонирование

```javascript
const clone = node.clone();
clone.x += 100;  // Смещаем копию
```

---

## Ограничения

1. **Синхронизация** — все операции с API асинхронны
2. **Сетевые запросы** — требуют явного разрешения в manifest.json
3. **Доступ к файловой системе** — ограничен, используйте UI для загрузки файлов
4. **Переменные и стили** — доступ только для чтения в большинстве случаев
