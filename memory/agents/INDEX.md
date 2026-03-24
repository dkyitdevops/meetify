# 🤖 Персональная Память Агентов

## Система хранения истории и навыков каждого агента

## Структура

```
memory/agents/
├── INDEX.md                      # Общий индекс всех агентов
├── agent-001-ui-designer.md      # UI Designer
├── agent-002-frontend.md         # Frontend Developer
├── agent-003-backend.md          # Backend Developer
├── agent-004-qa.md               # QA Engineer
├── agent-005-devops.md           # DevOps Engineer
├── agent-006-security.md         # Security Engineer
├── agent-007-unix-engineer.md    # Unix Engineer
└── agent-008-analyst.md          # Аналитик (КЭП ТСО)
```

## Список агентов

| ID | Имя | Роль | Статус | Задач |
|----|-----|------|--------|-------|
| agent-001 | UI Designer | UI/UX Designer | 🟢 Активен | 4 |
| agent-002 | Frontend Developer | Frontend Developer | 🟢 Активен | 5 |
| agent-003 | Backend Developer | Backend Developer | 🟢 Активен | 4 |
| agent-004 | QA Engineer | QA Engineer | 🟢 Активен | 5 |
| agent-005 | DevOps Engineer | DevOps Engineer | 🟢 Активен | 5 |
| agent-006 | Security Engineer | Security Engineer | 🟢 Активен | 3 |
| agent-007 | Unix Engineer | Unix Engineer | 🟢 Активен | 2 |
| agent-008 | Аналитик | Domain Expert (КЭП ТСО) | 🟢 Активен | 1 |

**Всего: 8 агентов**

## Формат записи агента

Каждый агент имеет:
- **Профиль** — роль, специализация, дата создания
- **История задач** — все выполненные задачи с результатами
- **Навыки** — подтверждённые компетенции
- **Предпочтения** — стиль работы, любимые инструменты
- **Статистика** — количество задач, успешность

## Использование

### При создании агента:
1. Проверить INDEX.md — есть ли агент с такой ролью
2. Если есть — загрузить его память в контекст
3. Если нет — создать новую запись

### После выполнения задачи:
1. Записать задачу в историю
2. Обновить навыки (если освоены новые)
3. Обновить статистику

## Преимущества

- ✅ Агент помнит свой опыт
- ✅ Не начинает с нуля каждый раз
- ✅ Развивает свой стиль
- ✅ Прозрачная отчётность
