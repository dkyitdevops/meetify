# Meetify — Модальное окно создания комнаты

**GitHub Issue:** #44  
**URL:** https://github.com/dkyitdevops/meetify/issues/44

---

## 🎨 Дизайн-макет: Create Room Modal

### Общий вид (Desktop)

```
┌─────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════╗  │
│  ║                                           ║  │
│  ║     ┌─────────────────────────────────┐   ║  │
│  ║     │  ✨ Создать новую комнату       │   ║  │
│  ║     │                                 │   ║  │
│  ║     │  ┌─────────────────────────┐    │   ║  │
│  ║     │  │ Моя комната (опционально)│    │   ║  │
│  ║     │  └─────────────────────────┘    │   ║  │
│  ║     │  0/100                          │   ║  │
│  ║     │                                 │   ║  │
│  ║     │  ┌─────────────────────────┐    │   ║  │
│  ║     │  │ ••••••••••••••••••••••• │    │   ║  │
│  ║     │  └─────────────────────────┘    │   ║  │
│  ║     │  ☑️ Показать пароль             │   ║  │
│  ║     │                                 │   ║  │
│  ║     │  ┌────────────┐ ┌────────────┐  │   ║  │
│  ║     │  │  Отмена   │ │  Создать   │  │   ║  │
│  ║     │  │  (secondary)│ │  комнату   │  │   ║  │
│  ║     │  │            │ │  (primary) │  │   ║  │
│  ║     │  └────────────┘ └────────────┘  │   ║  │
│  ║     │                                 │   ║  │
│  ║     └─────────────────────────────────┘   ║  │
│  ║                                           ║  │
│  ╚═══════════════════════════════════════════╝  │
│                                                 │
│  ← Overlay: rgba(0, 0, 0, 0.7)                  │
│  ← Backdrop blur: 8px                           │
└─────────────────────────────────────────────────┘
```

### Мобильный вид (≤ 480px)

```
┌─────────────────────────┐
│                         │
│  ✨ Создать новую       │
│     комнату             │
│                         │
│  ┌───────────────────┐  │
│  │ Моя комната...    │  │
│  └───────────────────┘  │
│  0/100                  │
│                         │
│  ┌───────────────────┐  │
│  │ ••••••••••••••••• │  │
│  └───────────────────┘  │
│  ☑️ Показать пароль     │
│                         │
│  ┌───────────────────┐  │
│  │   Создать комнату │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │      Отмена       │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

---

## 🎯 Спецификация компонентов

### 1. Overlay (Фоновое затемнение)

| Свойство | Значение |
|----------|----------|
| Background | `rgba(0, 0, 0, 0.7)` |
| Backdrop-filter | `blur(8px)` |
| Z-index | `1000` |
| Transition | `opacity 300ms ease` |

### 2. Modal Container

| Свойство | Desktop | Mobile |
|----------|---------|--------|
| Width | `420px` | `100% - 32px` (min 288px) |
| Max-width | `420px` | `420px` |
| Padding | `24px` | `20px` |
| Border-radius | `16px` | `12px` |
| Background | `rgba(30, 30, 40, 0.85)` |
| Border | `1px solid rgba(255, 255, 255, 0.1)` |
| Box-shadow | `0 25px 50px -12px rgba(0, 0, 0, 0.5)` |
| Backdrop-filter | `blur(20px)` |

### 3. Заголовок

```
Текст: "Создать новую комнату"
Font-size: 20px (desktop) / 18px (mobile)
Font-weight: 600
Color: #FFFFFF
Margin-bottom: 24px
Text-align: center
Icon: ✨ (sparkles) перед текстом
```

### 4. Поле "Название комнаты"

| Свойство | Значение |
|----------|----------|
| Label | "Название комнаты" (опционально) |
| Placeholder | `Моя комната (опционально)` |
| Type | `text` |
| Max-length | `100` |
| Required | `false` |
| Height | `48px` |
| Padding | `12px 16px` |
| Font-size | `16px` |
| Background | `rgba(255, 255, 255, 0.05)` |
| Border | `1px solid rgba(255, 255, 255, 0.1)` |
| Border-radius | `12px` |
| Color | `#FFFFFF` |
| Placeholder color | `rgba(255, 255, 255, 0.4)` |
| Focus border | `#6366F1` (indigo-500) |
| Focus box-shadow | `0 0 0 3px rgba(99, 102, 241, 0.2)` |

**Counter (под полем):**
```
Text: "0/100"
Font-size: 12px
Color: rgba(255, 255, 255, 0.4)
Align: right
Margin-top: 6px
```

### 5. Поле "Пароль"

| Свойство | Значение |
|----------|----------|
| Label | "Пароль" (опционально) |
| Placeholder | `Пароль (опционально)` |
| Type | `password` (toggleable to `text`) |
| Max-length | `50` |
| Required | `false` |
| Height | `48px` |
| Padding | `12px 16px` |
| Font-size | `16px` |
| Background | `rgba(255, 255, 255, 0.05)` |
| Border | `1px solid rgba(255, 255, 255, 0.1)` |
| Border-radius | `12px` |
| Color | `#FFFFFF` |
| Placeholder color | `rgba(255, 255, 255, 0.4)` |
| Focus border | `#6366F1` |
| Focus box-shadow | `0 0 0 3px rgba(99, 102, 241, 0.2)` |

### 6. Чекбокс "Показать пароль"

```
Layout: flex row, align-center
Gap: 10px
Margin-top: 12px

Checkbox:
  - Size: 18px × 18px
  - Border-radius: 4px
  - Border: 2px solid rgba(255, 255, 255, 0.3)
  - Background (unchecked): transparent
  - Background (checked): #6366F1
  - Checkmark: white, 12px

Label:
  - Text: "Показать пароль"
  - Font-size: 14px
  - Color: rgba(255, 255, 255, 0.8)
  - Cursor: pointer
```

### 7. Кнопки

#### Primary: "Создать комнату"

| Свойство | Значение |
|----------|----------|
| Width | Desktop: auto (flex: 1) / Mobile: 100% |
| Height | `48px` |
| Padding | `12px 24px` |
| Font-size | `16px` |
| Font-weight | `600` |
| Color | `#FFFFFF` |
| Background | `linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)` |
| Border | `none` |
| Border-radius | `12px` |
| Cursor | `pointer` |
| Transition | `all 200ms ease` |
| Hover | `transform: translateY(-1px)`, brightness +10% |
| Active | `transform: translateY(0)` |
| Disabled | `opacity: 0.5`, `cursor: not-allowed` |

#### Secondary: "Отмена"

| Свойство | Значение |
|----------|----------|
| Width | Desktop: auto (flex: 1) / Mobile: 100% |
| Height | `48px` |
| Padding | `12px 24px` |
| Font-size | `16px` |
| Font-weight | `500` |
| Color | `rgba(255, 255, 255, 0.8)` |
| Background | `transparent` |
| Border | `1px solid rgba(255, 255, 255, 0.2)` |
| Border-radius | `12px` |
| Cursor | `pointer` |
| Transition | `all 200ms ease` |
| Hover | `background: rgba(255, 255, 255, 0.1)` |
| Active | `background: rgba(255, 255, 255, 0.05)` |

**Layout кнопок:**
```
Desktop: flex row, gap: 12px, margin-top: 24px
Mobile: flex column-reverse, gap: 12px, margin-top: 24px
```

---

## ✨ Анимации

### Появление модального окна

```css
/* Overlay */
@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal */
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Timing */
Overlay: 300ms ease
Modal: 300ms cubic-bezier(0.16, 1, 0.3, 1) (spring-like)
```

### Исчезновение модального окна

```css
/* Overlay */
@keyframes overlayFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Modal */
@keyframes modalSlideOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
}

/* Timing */
Overlay: 200ms ease
Modal: 200ms ease-in
```

### Focus анимация полей

```css
transition: border-color 200ms ease, box-shadow 200ms ease;
```

### Hover эффекты кнопок

```css
Primary: transform 200ms ease, filter 200ms ease
Secondary: background-color 200ms ease
```

---

## 📱 Адаптивность

### Breakpoints

| Breakpoint | Ширина | Особенности |
|------------|--------|-------------|
| Mobile | ≤ 480px | Кнопки в столбик, padding 20px, меньший шрифт |
| Tablet | 481px - 768px | Стандартный layout |
| Desktop | ≥ 769px | Полный layout |

### Mobile-specific

- Кнопки располагаются вертикально (primary сверху на desktop, снизу на mobile для thumb-доступа)
- Уменьшенные отступы
- Шрифт заголовка 18px вместо 20px
- Модалка занимает почти всю ширину экрана (16px margin с каждой стороны)

---

## 🎨 Цветовая палитра (Dark Theme)

```css
/* Backgrounds */
--bg-primary: #0F0F14;
--bg-modal: rgba(30, 30, 40, 0.85);
--bg-input: rgba(255, 255, 255, 0.05);
--bg-hover: rgba(255, 255, 255, 0.1);

/* Text */
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.8);
--text-muted: rgba(255, 255, 255, 0.4);

/* Accents */
--accent-primary: #6366F1;      /* Indigo-500 */
--accent-secondary: #8B5CF6;    /* Violet-500 */
--accent-gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);

/* Borders */
--border-default: rgba(255, 255, 255, 0.1);
--border-hover: rgba(255, 255, 255, 0.2);
--border-focus: #6366F1;

/* Overlay */
--overlay-bg: rgba(0, 0, 0, 0.7);
```

---

## 🔧 Технические требования

### Accessibility (a11y)

- [ ] `aria-labelledby` на модалке, указывающий на заголовок
- [ ] `aria-describedby` для полей ввода
- [ ] `role="dialog"` на контейнере
- [ ] Trap focus внутри модалки при открытии
- [ ] Закрытие по Escape
- [ ] Закрытие по клику на overlay
- [ ] Focus visible стили для keyboard навигации
- [ ] Чекбокс с правильным `label for` связанием

### Validation

- Название: max 100 символов (блокировать ввод или показывать ошибку)
- Пароль: max 50 символов
- Оба поля опциональны
- Кнопка "Создать" активна всегда (пустые значения = дефолтные)

### States

```
Initial: Оба поля пустые, кнопка активна
Loading: Кнопка показывает спиннер, поля disabled
Success: Редирект в комнату, модалка закрывается
Error: Показ ошибки под соответствующим полем
```

---

## 📝 Пример React-структуры

```tsx
interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name?: string; password?: string }) => void;
}

interface FormData {
  name: string;
  password: string;
  showPassword: boolean;
}
```

---

## 📎 Assets

### Иконки (рекомендуемые)

- Заголовок: `Sparkles` (Lucide) или `✨`
- Показать пароль: `Eye` / `EyeOff` (Lucide)
- Закрыть модалку: `X` (Lucide) — опционально в углу

### Шрифты

- Primary: Inter, system-ui, sans-serif
- Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI"

---

## ✅ Чеклист реализации

- [ ] Создан компонент модального окна
- [ ] Реализован glassmorphism эффект
- [ ] Поле "Название комнаты" с лимитом 100 символов
- [ ] Поле "Пароль" с типом password и чекбоксом
- [ ] Чекбокс "Показать пароль" переключает тип поля
- [ ] Кнопка "Создать комнату" с gradient
- [ ] Кнопка "Отмена" закрывает модалку
- [ ] Анимация появления/исчезновения
- [ ] Адаптивность для мобильных
- [ ] Закрытие по Escape и клику на overlay
- [ ] Trap focus для accessibility
- [ ] Counter символов для названия

---

**Создано:** 2026-03-24  
**Дизайнер:** UI Designer Subagent
