# Виртуальный фон для Meetify

## Описание

Модуль виртуального фона использует **MediaPipe Selfie Segmentation** для сегментации человека и замены/размытия фона в реальном времени.

## Функциональность

### 1. Размытие фона (Background Blur)
- Размывает только фон, лицо и тело остаются чёткими
- Настраиваемая степень размытия (по умолчанию 8px)

### 2. Кастомное изображение
- Поддержка загрузки собственных изображений (JPG, PNG)
- Автоматическое масштабирование (cover mode)

### 3. Сплошной цвет
- Выбор любого цвета через color picker
- Полезно для профессионального вида или хромакея

### 4. Пресеты
- Офис
- Природа
- Космос
- Библиотека

## Архитектура

### Файлы

```
web/
├── virtual-background.js    # Основной модуль
├── room.js                  # Интеграция с комнатой
├── room.html                # UI элементы
└── virtual-background.test.js # Автотесты
```

### Компоненты

#### VirtualBackground (virtual-background.js)
Основной класс, управляющий обработкой видео:

```javascript
// Инициализация
await VirtualBackground.init();

// Запуск с размытием
await VirtualBackground.start(videoElement, 'blur', { blurAmount: 8 });

// Запуск с изображением
await VirtualBackground.start(videoElement, 'image', { backgroundImage: img });

// Запуск с цветом
await VirtualBackground.start(videoElement, 'color', { backgroundColor: '#1a1a2e' });

// Остановка
VirtualBackground.stop();

// Получение обработанного потока
const stream = VirtualBackground.getProcessedStream();
```

#### VirtualBackgroundUI (virtual-background.js)
UI-хелпер для интеграции с Meetify:

```javascript
// Применить фон
await VirtualBackgroundUI.apply('blur');
await VirtualBackgroundUI.apply('image', { backgroundImage: img });
await VirtualBackgroundUI.apply('color', { backgroundColor: '#1a1a2e' });
await VirtualBackgroundUI.apply('none'); // Отключить

// Загрузить изображение
const img = await VirtualBackgroundUI.loadImage(file);
```

## Интеграция с WebRTC

Модуль автоматически обновляет все peer connections при изменении фона:

1. Создаётся canvas с обработанным видео
2. Из canvas захватывается MediaStream через `captureStream()`
3. Видео-трек заменяется во всех RTCPeerConnection через `replaceTrack()`
4. Аудио-трек сохраняется из оригинального потока

## Производительность

- **Целевой FPS**: 30 кадров/сек
- **Модель**: MediaPipe Selfie Segmentation (landscape)
- **Оптимизация**: Используется `requestAnimationFrame` с контролем интервала

## Использование

### Включение размытия
1. Открыть настройки (⚙️)
2. Выбрать "🔮 Размытие" в разделе "Виртуальный фон"
3. Дождаться загрузки модели (~5-10 секунд)

### Установка кастомного фона
1. Открыть настройки
2. Выбрать "🖼️ Своя картинка"
3. Загрузить изображение
4. Дождаться применения

### Сплошной цвет
1. Открыть настройки
2. Выбрать "🎨 Сплошной цвет"
3. Выбрать цвет в color picker

## Требования

- Браузер с поддержкой WebGL
- Современный браузер (Chrome 80+, Firefox 75+, Safari 14+)
- Доступ к камере
- Интернет для загрузки модели MediaPipe (~2MB)

## Зависимости

```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js"></script>
```

## Тестирование

Запуск автотестов:

```bash
cd web
node virtual-background.test.js
```

Тесты проверяют:
- Наличие всех необходимых файлов
- Корректность синтаксиса JavaScript
- Наличие всех требуемых функций
- Интеграцию с WebRTC
- Обработку ошибок

## Известные ограничения

1. **Загрузка модели**: Первая инициализация требует ~5-10 секунд
2. **Производительность**: На слабых устройствах возможно снижение FPS
3. **Совместимость**: Некоторые мобильные браузеры могут не поддерживать
4. **CORS**: Пресеты используют внешние изображения с Unsplash (crossOrigin)

## Будущие улучшения

- [ ] Сохранение кастомных фонов в localStorage
- [ ] Регулировка степени размытия
- [ ] Поддержка видео-фонов
- [ ] Улучшенная сегментация волос
- [ ] GPU acceleration через WebGL