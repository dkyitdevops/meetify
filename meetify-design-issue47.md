# Meetify — Дизайн экрана подготовки к входу

**GitHub Issue:** #47  
**Автор:** agent-001 (UI Designer)  
**Дата:** 2026-03-24

---

## 📋 Общее описание

Экран подготовки перед входом в комнату видеоконференции. Пользователь видит своё видео, проверяет камеру и микрофон, затем входит в комнату.

---

## 🎨 Визуальная система

### Цветовая палитра (тёмная тема)

```css
/* Фон */
--bg-primary: #0d1117;        /* Основной фон */
--bg-secondary: #161b22;      /* Вторичный фон */
--bg-glass: rgba(22, 27, 34, 0.75);  /* Glassmorphism фон */

/* Акценты */
--accent-primary: #58a6ff;    /* Основной акцент (кнопки) */
--accent-success: #238636;    /* Зелёный (включено) */
--accent-danger: #da3633;     /* Красный (выключено) */

/* Текст */
--text-primary: #f0f6fc;      /* Основной текст */
--text-secondary: #8b949e;    /* Вторичный текст */

/* Эффекты */
--glass-border: rgba(255, 255, 255, 0.1);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
--blur-amount: 12px;
```

### Типографика

```css
/* Заголовок */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
font-size: 24px;
font-weight: 600;
color: var(--text-primary);

/* Кнопки управления */
font-size: 14px;
font-weight: 500;

/* Кнопка входа */
font-size: 16px;
font-weight: 600;
```

---

## 📐 Layout

### Структура экрана

```
┌─────────────────────────────────────────┐
│                                         │
│         "Подготовка к входу"            │
│              (заголовок)                │
│                                         │
│    ┌─────────────────────────────┐      │
│    │                             │      │
│    │      [ВИДЕО ПРЕВЬЮ]         │      │
│    │      640×480 или 16:9       │      │
│    │                             │      │
│    │   ┌─────────────────────┐   │      │
│    │   │   👤 (плейсхолдер)  │   │      │
│    │   │   если камера off   │   │      │
│    │   └─────────────────────┘   │      │
│    │                             │      │
│    └─────────────────────────────┘      │
│                                         │
│    [📹]        [🎤]                     │
│  Камера     Микрофон                    │
│                                         │
│         ┌─────────────────┐             │
│         │  Войти в комнату │             │
│         └─────────────────┘             │
│                                         │
└─────────────────────────────────────────┘
```

### Размеры

```css
/* Контейнер */
.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 24px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Видео превью */
.video-preview {
  width: 100%;
  max-width: 640px;
  aspect-ratio: 4/3; /* или 16/9 */
  border-radius: 16px;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}

/* Плейсхолдер (камера выключена) */
.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
}

.placeholder-icon {
  width: 80px;
  height: 80px;
  color: var(--text-secondary);
  opacity: 0.5;
}

/* Контейнер кнопок управления */
.controls {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

/* Кнопка управления (камера/микрофон) */
.control-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 24px;
}

.control-btn.on {
  background: var(--accent-success);
  color: white;
}

.control-btn.off {
  background: var(--accent-danger);
  color: white;
}

.control-btn:hover {
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}

/* Кнопка входа */
.join-btn {
  margin-top: 32px;
  padding: 16px 48px;
  border-radius: 12px;
  border: none;
  background: var(--accent-primary);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3);
}

.join-btn:hover {
  background: #79b8ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(88, 166, 255, 0.4);
}

.join-btn:active {
  transform: translateY(0);
}
```

---

## 🔄 Состояния

### Состояние 1: Камера ВКЛ, Микрофон ВКЛ

```
┌─────────────────────────────┐
│      [ЖИВОЕ ВИДЕО]          │
│    (пользователь видит себя) │
└─────────────────────────────┘

   [🟢📹]      [🟢🎤]
   зелёная    зелёная
   кнопка     кнопка

   [Войти в комнату]
```

### Состояние 2: Камера ВЫКЛ, Микрофон ВКЛ

```
┌─────────────────────────────┐
│                             │
│        [👤 иконка]          │
│      "Камера выключена"     │
│                             │
└─────────────────────────────┘

   [🔴📹⛔]    [🟢🎤]
   красная    зелёная
   кнопка     кнопка

   [Войти в комнату]
```

### Состояние 3: Камера ВКЛ, Микрофон ВЫКЛ

```
┌─────────────────────────────┐
│      [ЖИВОЕ ВИДЕО]          │
└─────────────────────────────┘

   [🟢📹]      [🔴🎤⛔]
   зелёная    красная
   кнопка     кнопка

   [Войти в комнату]
```

### Состояние 4: Оба ВЫКЛ

```
┌─────────────────────────────┐
│                             │
│        [👤 иконка]          │
│      "Камера выключена"     │
│                             │
└─────────────────────────────┘

   [🔴📹⛔]    [🔴🎤⛔]
   красная    красная
   кнопка     кнопка

   [Войти в комнату]  ← можно войти!
```

---

## ♿ Accessibility

```css
/* Фокусные состояния */
.control-btn:focus-visible,
.join-btn:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* ARIA метки */
<button aria-label="Выключить камеру" aria-pressed="true">...</button>
<button aria-label="Включить микрофон" aria-pressed="false">...</button>
```

---

## 📱 Адаптивность

### Desktop (> 768px)
- Видео: max-width 640px
- Кнопки: 56px
- Отступы: 40px

### Tablet (480px - 768px)
- Видео: 100% width
- Кнопки: 48px
- Отступы: 24px

### Mobile (< 480px)
- Видео: 100% width, aspect-ratio 1:1
- Кнопки: 48px
- Отступы: 16px
- Кнопка входа: full width

```css
@media (max-width: 768px) {
  .container {
    padding: 24px 16px;
  }
  
  .video-preview {
    border-radius: 12px;
  }
  
  .control-btn {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  
  .join-btn {
    width: 100%;
    max-width: 320px;
  }
}

@media (max-width: 480px) {
  .video-preview {
    aspect-ratio: 1/1;
  }
  
  h1 {
    font-size: 20px;
  }
}
```

---

## 🔧 HTML Структура

```html
<div class="prejoin-container">
  <h1 class="prejoin-title">Подготовка к входу</h1>
  
  <div class="video-preview">
    <video 
      v-if="cameraEnabled" 
      autoplay 
      muted 
      playsinline
      ref="videoElement"
    ></video>
    <div v-else class="video-placeholder">
      <svg class="placeholder-icon" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    </div>
  </div>
  
  <div class="controls">
    <button 
      class="control-btn"
      :class="{ on: cameraEnabled, off: !cameraEnabled }"
      @click="toggleCamera"
      :aria-label="cameraEnabled ? 'Выключить камеру' : 'Включить камеру'"
      :aria-pressed="cameraEnabled"
    >
      <span v-if="cameraEnabled">📹</span>
      <span v-else>📹⛔</span>
    </button>
    
    <button 
      class="control-btn"
      :class="{ on: microphoneEnabled, off: !microphoneEnabled }"
      @click="toggleMicrophone"
      :aria-label="microphoneEnabled ? 'Выключить микрофон' : 'Включить микрофон'"
      :aria-pressed="microphoneEnabled"
    >
      <span v-if="microphoneEnabled">🎤</span>
      <span v-else>🎤⛔</span>
    </button>
  </div>
  
  <button class="join-btn" @click="joinRoom">
    Войти в комнату
  </button>
</div>
```

---

## 📝 Примечания для разработчиков

1. **Видео поток:** Использовать `getUserMedia()` для получения видео/аудио
2. **Иконки:** Можно заменить emoji на SVG иконки из библиотеки (Lucide, Heroicons)
3. **Glassmorphism:** Добавить `backdrop-filter: blur(12px)` для современных браузеров
4. **Fallback:** Если `getUserMedia` не доступен — показывать плейсхолдер
5. **Предпросмотр аудио:** Можно добавить индикатор уровня звука рядом с кнопкой микрофона

---

## ✅ Чеклист реализации

- [ ] Создать компонент `PrejoinScreen`
- [ ] Реализовать получение видео потока
- [ ] Добавить переключение камеры (on/off)
- [ ] Добавить переключение микрофона (on/off)
- [ ] Стилизовать под тёмную тему
- [ ] Добавить glassmorphism эффекты
- [ ] Сделать адаптивным
- [ ] Добавить accessibility атрибуты
- [ ] Тестировать на мобильных устройствах
