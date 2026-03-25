# 🤖 Агент: UI Designer

**ID:** agent-001  
**Роль:** UI/UX Designer  
**Специализация:** Glassmorphism, анимации, accessibility, mobile-first  
**Создан:** 2026-03-24  
**Статус:** Активен

---

## 📊 Статистика

| Метрика | Значение |
|---------|----------|
| Всего задач | 4 |
| Успешно | 4 |
| В работе | 0 |

---

## 🎨 Figma MCP Server — Настройка и использование

**Статус:** ⚠️ Требует ручной настройки токена

### Что такое Figma MCP Server

Figma MCP Server — это интеграция, позволяющая AI-агентам создавать и редактировать дизайн в Figma напрямую через API. Работает по протоколу Model Context Protocol (MCP).

**Возможности:**
- ✅ Создавать и редактировать фреймы, компоненты, переменные
- ✅ Генерировать код из дизайна (React + Tailwind по умолчанию)
- ✅ Импортировать UI с живых сайтов в Figma
- ✅ Работать с design tokens и variables
- ✅ Создавать диаграммы в FigJam
- ✅ Подключать Code Connect для связи дизайна с кодом

**Ограничения:**
- ⚠️ Beta-версия, пока бесплатно (в будущем — usage-based)
- ⚠️ Для write-to-canvas нужен Full или Dev seat на paid плане
- ⚠️ Starter plan ограничен 6 вызовами инструментов в месяц
- ⚠️ Требуется Figma Personal Access Token

---

### Настройка

#### 1. Получение Figma Personal Access Token

1. Войти в Figma (https://figma.com)
2. Settings → Personal Access Tokens
3. Создать новый токен с правами:
   - `file_read` — чтение файлов
   - `file_write` — запись в файлы (для write-to-canvas)
   - `file_dev_resources` — Code Connect

#### 2. Настройка MCP Server

**Remote MCP Server (рекомендуется):**
- URL: `https://mcp.figma.com/mcp`
- Поддерживает write-to-canvas и code-to-canvas

**Конфигурация для OpenClaw:**
```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp",
      "headers": {
        "Authorization": "Bearer ${FIGMA_TOKEN}"
      }
    }
  }
}
```

#### 3. Сохранение токена

```bash
# Сохранить в credentials
mkdir -p /data/workspace/credentials
echo "FIGMA_TOKEN=your_token_here" > /data/workspace/credentials/figma.env
chmod 600 /data/workspace/credentials/figma.env
```

---

### Примеры использования

#### Создать новый файл
```
Создай новый Figma файл "Meetify Dashboard"
```

#### Создать компонент кнопки
```
В файле [URL] создай компонент кнопки:
- Размер: 120x44px
- Фон: градиент от #00ff88 к #00cc6a
- Border radius: 8px
- Текст: "Присоединиться"
- Шрифт: Inter, 14px, белый
```

#### Создать карточку
```
Создай карточку в Figma:
- Размер: 320x200px
- Фон: rgba(255,255,255,0.1) с backdrop-blur
- Border: 1px solid rgba(255,255,255,0.2)
- Border radius: 16px
- Внутри: заголовок, описание, кнопка
- Используй auto-layout
```

#### Получить код из дизайна
```
По ссылке [Figma URL] сгенерируй React компонент с Tailwind
```

#### Создать диаграмму
```
Создай flowchart в FigJam для процесса авторизации
```

---

### Доступные инструменты MCP

| Инструмент | Описание |
|------------|----------|
| `get_design_context` | Получить структуру и стили выделенного фрейма |
| `get_variable_defs` | Получить variables (colors, spacing, typography) |
| `get_screenshot` | Сделать скриншот выделения |
| `use_figma` | Запись на canvas (создание/редактирование) |
| `create_figma_file` | Создать новый файл |
| `search_design_system` | Поиск компонентов в design system |
| `generate_diagram` | Создать диаграмму из Mermaid-синтаксиса |
| `send_ui_to_figma` | Импорт UI с сайта в Figma |

---

### Skills (для поддерживаемых клиентов)

| Skill | Описание |
|-------|----------|
| `figma-use` | Базовый skill для записи на canvas |
| `figma-create-new-file` | Создание новых файлов |
| `figma-implement-design` | Генерация кода из дизайна |
| `figma-generate-design` | Создание экранов из codebase |
| `figma-code-connect-components` | Связь компонентов с кодом |
| `figma-create-design-system-rules` | Создание правил design system |

---

### Полезные ссылки

- Документация: https://developers.figma.com/docs/figma-mcp-server/
- Гайд: https://help.figma.com/hc/en-us/articles/32132100833559
- GitHub: https://github.com/figma/mcp-server-guide
- Skills: https://help.figma.com/hc/en-us/articles/39166810751895

---

## 📋 История задач

### 2026-03-24 16:18 — Issue #44
**Проект:** Meetify  
**Задача:** Дизайн модального окна создания комнаты  
**Результат:** ✅ Успешно  
**Файлы:** `/data/workspace/meetify-design-issue44.md`  
**Описание:** 
- Спроектировал модальное окно с полями: название, пароль
- Glassmorphism эффекты с backdrop-filter
- Анимации fadeIn/slideUp
- Адаптивность mobile-first
- Accessibility требования

**Использовано:** CSS variables, flexbox, CSS animations

---

### 2026-03-24 14:00 — Issue #43
**Проект:** Meetify  
**Задача:** Проверить room.html и room.js  
**Результат:** ✅ Успешно  
**Описание:**
- Нашёл и удалил inline-скрипт, блокировавший room.js
- Добавил DOMContentLoaded для корректной загрузки
- Добавил функции настроек комнаты

---

### 2026-03-24 12:30 — Issue #12
**Проект:** AI Team Office  
**Задача:** Мобильная адаптивность  
**Результат:** ✅ Успешно  
**Описание:**
- Media queries для 900px, 600px, 400px
- Touch-targets минимум 44px
- Улучшена читаемость текста

---

### 2026-03-24 10:00 — Issue #7
**Проект:** AI Team Office  
**Задача:** Проекты на мониторах агентов  
**Результат:** ✅ Успешно  
**Описание:**
- Неоновый зелёный (#00ff88) для названий проектов
- Glow-эффекты для текста
- Увеличен шрифт до 11px

---

## 🎯 Навыки (подтверждённые)

- [x] Glassmorphism дизайн
- [x] CSS анимации и transitions
- [x] Mobile-first адаптивность
- [x] Accessibility (a11y)
- [x] Тёмные темы
- [x] CSS переменные
- [x] Flexbox и Grid
- [x] Модальные окна
- [x] ASCII-макеты для документации
- [ ] Figma MCP Server (в процессе настройки)

---

## 💡 Предпочтения

- **Темы:** Тёмные (dark mode)
- **Цвета:** Неоновые акценты (зелёный, синий)
- **Шрифты:** JetBrains Mono, Inter
- **Подход:** Mobile-first
- **Эффекты:** Glassmorphism, glow, blur

---

## 📝 Заметки

- Хорошо работает с анимациями
- Предпочитает чёткие спецификации
- Всегда включает accessibility
- Figma MCP Server требует ручного создания токена
