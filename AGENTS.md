# AGENTS.md

## Каждая сессия (обязательно)

1. Прочитай `MEMORY.md` — долгосрочная память, проекты, контекст
2. Прочитай `memory/INDEX.md` — карта памяти, что где лежит
3. Прочитай свежий дневной лог (`memory/YYYY-MM-DD.md` за сегодня или вчера) — незавершённые задачи

Не загружай агентов заранее. Загружай только когда Костя к ним обращается.

## Команда агентов (ленивая загрузка)

8 специализированных агентов. Индекс: `memory/agents/INDEX.md`.

| ID | Роль | Файл памяти |
|----|------|-------------|
| agent-001 | UI/UX Designer | `memory/agents/agent-001-ui-designer.md` |
| agent-002 | Frontend Developer | `memory/agents/agent-002-frontend.md` |
| agent-003 | Backend Developer | `memory/agents/agent-003-backend.md` |
| agent-004 | QA Engineer | `memory/agents/agent-004-qa.md` |
| agent-005 | DevOps Engineer | `memory/agents/agent-005-devops.md` |
| agent-006 | Security Engineer | `memory/agents/agent-006-security.md` |
| agent-007 | Unix Engineer | `memory/agents/agent-007-unix-engineer.md` |
| agent-008 | Аналитик (КЭП ТСО) | `memory/agents/agent-008-analyst.md` |

**Правило:** Когда Костя говорит "передай задачу дизайнеру" / "пусть QA проверит" / "DevOps задеплой" —
прочитай файл памяти нужного агента → выполни задачу в его роли → запиши результат обратно в его файл.

**Процесс разработки:** Dev → QA → Security → DevOps. Детали: `memory/checklist.md`.

## Память

- `memory-navigator` — поиск по прошлым сессиям и фактам
- `memory-writer` — "запомни" / "запиши" → сохранить навсегда
- `memory-gardener` — по запросу "разбери память" или раз в неделю

Правило: MEMORY.md не более 8KB (индекс). Детали — в domain-файлах.
`[needs-verify]` на всё что не сказал Костя лично.

## Анализ сессии

Слово «анализ» или конец сессии → просмотри диалог → запиши важное через `memory-writer`:
- что было сделано
- незавершённые задачи
- новые паттерны или уроки

## Безопасность

Токены и ключи → `credentials/{service}.env`, chmod 600.
Наружные действия (деплой, email, API write) — спроси Костю первым.

## Форматирование (Telegram)

Без таблиц → списки. Без заголовков в коротких ответах. Кратко, по делу.
