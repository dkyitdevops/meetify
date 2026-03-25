// Pixso Plugin: Create "Join Room" Button
// Этот плагин создаёт стилизованную кнопку "Join Room" в Pixso

// ============================================
// main.js
// ============================================

// Показываем UI при запуске плагина
pixso.showUI(__html__, {
  width: 320,
  height: 280,
  title: 'Create Join Room Button'
});

// Обработчик сообщений от UI
pixso.ui.onmessage = (msg) => {
  if (msg.type === 'create-button') {
    createJoinRoomButton(msg.options);
  } else if (msg.type === 'cancel') {
    pixso.closePlugin();
  }
};

/**
 * Создаёт кнопку "Join Room" с заданными параметрами
 * @param {Object} options - параметры кнопки
 * @param {number} options.x - позиция X (по умолчанию 100)
 * @param {number} options.y - позиция Y (по умолчанию 100)
 * @param {number} options.width - ширина кнопки (по умолчанию 180)
 * @param {number} options.height - высота кнопки (по умолчанию 48)
 * @param {string} options.variant - вариант стиля: 'primary' | 'secondary' | 'outline'
 */
function createJoinRoomButton(options = {}) {
  const {
    x = 100,
    y = 100,
    width = 180,
    height = 48,
    variant = 'primary'
  } = options;

  // Определяем цвета в зависимости от варианта
  const styles = {
    primary: {
      bg: { r: 0.18, g: 0.52, b: 0.96 },  // Синий
      text: { r: 1, g: 1, b: 1 },          // Белый
      stroke: null
    },
    secondary: {
      bg: { r: 0.95, g: 0.96, b: 0.98 },  // Светло-серый
      text: { r: 0.18, g: 0.52, b: 0.96 }, // Синий
      stroke: null
    },
    outline: {
      bg: { r: 1, g: 1, b: 1 },            // Белый
      text: { r: 0.18, g: 0.52, b: 0.96 }, // Синий
      stroke: { r: 0.18, g: 0.52, b: 0.96 }
    }
  };

  const style = styles[variant] || styles.primary;

  // Создаём фон кнопки
  const buttonBg = pixso.createRectangle();
  buttonBg.x = x;
  buttonBg.y = y;
  buttonBg.width = width;
  buttonBg.height = height;
  buttonBg.fills = [{
    type: 'SOLID',
    color: style.bg
  }];
  buttonBg.cornerRadius = 8;
  buttonBg.name = `Join Room Button (${variant})`;

  // Добавляем обводку для outline варианта
  if (style.stroke) {
    buttonBg.strokes = [{
      type: 'SOLID',
      color: style.stroke
    }];
    buttonBg.strokeWeight = 2;
  }

  // Создаём текст кнопки
  const buttonText = pixso.createText();
  buttonText.x = x + width / 2;
  buttonText.y = y + height / 2;
  buttonText.fontSize = 16;
  buttonText.fontName = { family: 'Inter', style: 'SemiBold' };
  buttonText.characters = 'Join Room';
  buttonText.fills = [{
    type: 'SOLID',
    color: style.text
  }];
  buttonText.textAlignHorizontal = 'CENTER';
  buttonText.textAlignVertical = 'CENTER';
  buttonText.name = 'Join Room Label';

  // Группируем элементы кнопки
  const buttonGroup = pixso.group([buttonBg, buttonText], pixso.currentPage);
  buttonGroup.name = 'Join Room Button Group';

  // Выделяем созданную группу
  pixso.currentPage.selection = [buttonGroup];

  // Отправляем подтверждение в UI
  pixso.ui.postMessage({
    type: 'button-created',
    data: {
      x, y, width, height, variant
    }
  });
}

// ============================================
// ui.html (содержимое для встраивания)
// ============================================
const uiHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
      background: #fff;
      color: #333;
    }
    
    h2 {
      font-size: 16px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    
    .form-group {
      margin-bottom: 12px;
    }
    
    label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
      font-weight: 500;
    }
    
    input[type="number"],
    select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }
    
    input[type="number"]:focus,
    select:focus {
      outline: none;
      border-color: #2E7FF6;
    }
    
    .row {
      display: flex;
      gap: 8px;
    }
    
    .row .form-group {
      flex: 1;
    }
    
    .buttons {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    
    button {
      flex: 1;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    
    button:hover {
      opacity: 0.9;
    }
    
    .btn-primary {
      background: #2E7FF6;
      color: white;
    }
    
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }
    
    .preview {
      margin-top: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
    }
    
    .preview-label {
      font-size: 11px;
      color: #999;
      margin-bottom: 8px;
    }
    
    .preview-button {
      display: inline-block;
      padding: 10px 24px;
      background: #2E7FF6;
      color: white;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
    }
    
    .status {
      margin-top: 12px;
      padding: 8px;
      border-radius: 6px;
      font-size: 12px;
      display: none;
    }
    
    .status.success {
      display: block;
      background: #d4edda;
      color: #155724;
    }
  </style>
</head>
<body>
  <h2>Create Join Room Button</h2>
  
  <div class="row">
    <div class="form-group">
      <label for="posX">X Position</label>
      <input type="number" id="posX" value="100" min="0">
    </div>
    <div class="form-group">
      <label for="posY">Y Position</label>
      <input type="number" id="posY" value="100" min="0">
    </div>
  </div>
  
  <div class="row">
    <div class="form-group">
      <label for="width">Width</label>
      <input type="number" id="width" value="180" min="50">
    </div>
    <div class="form-group">
      <label for="height">Height</label>
      <input type="number" id="height" value="48" min="24">
    </div>
  </div>
  
  <div class="form-group">
    <label for="variant">Style Variant</label>
    <select id="variant">
      <option value="primary">Primary (Blue)</option>
      <option value="secondary">Secondary (Light)</option>
      <option value="outline">Outline</option>
    </select>
  </div>
  
  <div class="preview">
    <div class="preview-label">Preview</div>
    <div class="preview-button" id="preview">Join Room</div>
  </div>
  
  <div class="status" id="status"></div>
  
  <div class="buttons">
    <button class="btn-secondary" id="cancel">Cancel</button>
    <button class="btn-primary" id="create">Create Button</button>
  </div>
  
  <script>
    const preview = document.getElementById('preview');
    const variantSelect = document.getElementById('variant');
    
    // Обновление превью при смене варианта
    variantSelect.addEventListener('change', (e) => {
      const variant = e.target.value;
      const styles = {
        primary: { bg: '#2E7FF6', text: '#fff', border: 'none' },
        secondary: { bg: '#f0f4f8', text: '#2E7FF6', border: 'none' },
        outline: { bg: '#fff', text: '#2E7FF6', border: '2px solid #2E7FF6' }
      };
      const style = styles[variant];
      preview.style.background = style.bg;
      preview.style.color = style.text;
      preview.style.border = style.border;
    });
    
    // Отправка данных в main.js
    document.getElementById('create').addEventListener('click', () => {
      const options = {
        x: parseInt(document.getElementById('posX').value, 10),
        y: parseInt(document.getElementById('posY').value, 10),
        width: parseInt(document.getElementById('width').value, 10),
        height: parseInt(document.getElementById('height').value, 10),
        variant: document.getElementById('variant').value
      };
      
      parent.postMessage({
        pluginMessage: {
          type: 'create-button',
          options: options
        }
      }, '*');
    });
    
    // Отмена
    document.getElementById('cancel').addEventListener('click', () => {
      parent.postMessage({
        pluginMessage: { type: 'cancel' }
      }, '*');
    });
    
    // Получение сообщений от main.js
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg && msg.type === 'button-created') {
        const status = document.getElementById('status');
        status.textContent = 'Button created successfully!';
        status.className = 'status success';
        setTimeout(() => {
          status.className = 'status';
        }, 3000);
      }
    };
  </script>
</body>
</html>
`;

// ============================================
// Инструкция по использованию
// ============================================

/*
1. Создайте папку для плагина:
   mkdir join-room-button
   cd join-room-button

2. Создайте manifest.json:
   {
     "name": "Join Room Button",
     "id": "join-room-button-001",
     "api": "1.0.0",
     "main": "main.js",
     "ui": "ui.html",
     "editorType": ["pixso"]
   }

3. Скопируйте код выше (до uiHtmlContent) в main.js

4. Скопируйте содержимое uiHtmlContent в ui.html

5. В Pixso: Plugins → Development → Import plugin from manifest...
   Выберите manifest.json

6. Запустите плагин и создайте кнопку!
*/

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createJoinRoomButton };
}
