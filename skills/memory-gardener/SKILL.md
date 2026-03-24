---
name: memory-gardener
description: Maintain, consolidate and organize memory. Use during heartbeats (weekly), when daily logs are accumulating, when memory feels scattered or outdated. Creates and maintains memory/INDEX.md.
---

# Memory Gardener

## When to run

- **Weekly** — automatic, during a heartbeat when no urgent tasks
- **On demand** — when user says "прибери в памяти", "organize memory"
- **First run** — when INDEX.md doesn't exist yet
- **After many writes** — after a session with lots of new information

---

## Phase 0: Verify facts marked [needs-verify]

**Перед любой другой работой** — найти и верифицировать все незаверенные факты.

### 0.1 Поиск меток

```bash
grep -rn "\[needs-verify" ~/.openclaw/workspace/memory/ 2>/dev/null
```

### 0.2 Протокол меток

Формат в файлах памяти:
```
- Факт: значение [needs-verify: что именно проверить]
```

Примеры:
```
- VPS-4: root@83.222.19.196 [needs-verify: disk, ram, cpu, role]
- Хост ra-server [needs-verify: ping]
```

### 0.3 Верификация по типу факта

**Инфраструктура (VPS, серверы):**
```bash
# Пинг (доступность)
ping -c 2 <IP> 2>/dev/null && echo "✓ online" || echo "✗ offline"

# Характеристики
ssh root@<IP> "echo '--- DISK ---' && df -h / && echo '--- RAM ---' && free -h && echo '--- CPU ---' && nproc && echo '--- OS ---' && lsb_release -d && echo '--- HOSTNAME ---' && hostname" 2>/dev/null
```

**Домашние устройства (через Tailscale):**
```bash
ping -c 2 <tailscale-ip> 2>/dev/null && echo "✓ online" || echo "✗ offline"
```

**API/сервисы:**
```bash
curl -s -o /dev/null -w "%{http_code}" <URL> 2>/dev/null
```

### 0.4 После верификации

- Если факт подтверждён: **убрать метку** `[needs-verify]`, **обновить значение** реальными данными
- Если факт изменился: обновить и добавить `[обновлено: YYYY-MM-DD]`
- Если недоступно: заменить на `[verify-failed: YYYY-MM-DD, reason]` — не удалять, отметить для ручной проверки

### 0.5 Синхронизация MEMORY.md

Если задекларированные факты в MEMORY.md отличаются от проверенных — обновить MEMORY.md тоже.

---

## Phase 1: Create / Update INDEX.md

`memory/INDEX.md` is the single entry point for all memory navigation.
If it doesn't exist, create it. If it exists, update it.

**INDEX.md structure:**

```markdown
# Memory Index

*Обновлено: YYYY-MM-DD*

## Directory

memory/
├── INDEX.md ← start here
├── MEMORY.md ← curated long-term (main session only)
├── YYYY-MM-DD.md ← daily logs (latest first)
│
├── birthdays.md ← birthdays of [N] people
├── home-network.md ← network, [N] devices
├── watchlist.md ← films: [N] in queue, [N] watched
├── kinopoisk_ratings.md ← [N] ratings from Kinopoisk
├── wordle-rules.md ← game strategy and rules
│
├── health/ ← medical history of [User Name]
│   ├── README.md ← diagnoses, timeline, tests, medications
│   └── *.md ← condition-specific files
│
└── home/ ← apartment at [address]
    ├── README.md ← navigation hub
    ├── property.md ← object card
    ├── smart-home.md ← smart home devices
    └── [subdomain]/README.md ← docs, planning, maintenance...

## Domain Descriptions

| Domain | What's here | Last updated |
|--------|-------------|--------------|
| `birthdays.md` | Birthdays, name days of [N] people | YYYY-MM-DD |
| `health/` | Medical visits, tests, diagnoses, medications | YYYY-MM-DD |
| `home/` | Property, repairs, inventory, finances, contacts | YYYY-MM-DD |
| `home-network.md` | Router, devices, IPs, SSH | YYYY-MM-DD |
| `watchlist.md` | Films/series to watch and already watched | YYYY-MM-DD |
| `kinopoisk_ratings.md` | [N] personal film ratings | YYYY-MM-DD |

## Projects

See `memory/projects/INDEX.md` for full registry.

| Project | Status | AI-infra | Last sync |
|---------|--------|----------|-----------|
| ... | ... | ... | ... |

## Daily Logs

Kept for 30 days. Older logs moved to `memory/archive/`.
Latest: [date of most recent log]
```

---

## Phase 2: Consolidate daily logs → domain files

For each daily log older than **7 days**:

1. Read the daily log
2. Identify entries that belong to a specific domain:
   - Medical info → `health/README.md`
   - Home decisions → `home/` subdomain
   - New birthdays → `birthdays.md`
   - Film activity → `watchlist.md` / `kinopoisk_ratings.md`
3. Check if the info is already in the domain file (avoid duplicates)
4. If missing → add it using `memory-writer` protocol
5. Mark the daily log as "consolidated" by adding a footer:

```
---

*Консолидировано: YYYY-MM-DD*
```

---

## Phase 3: Distill MEMORY.md

MEMORY.md is curated long-term memory — the essentials, not raw logs.

Review daily logs and domain files for entries that are:
- **Significant decisions** — things that shaped the user's direction
- **User preferences** — recurring patterns in how they like things done
- **Lessons learned** — things that went wrong and what to do differently
- **Important facts** — permanently relevant personal facts (not events)

**Do NOT add to MEMORY.md:**
- Routine events (took a pill, watched a film)
- Temporary status (current illness — when resolved, summarize)
- Raw data already in domain files (test numbers)

**MEMORY.md format:**

```markdown
# Long-Term Memory

*Обновлено: YYYY-MM-DD*

---

## Preferences & Habits

**[Date]:** [Preference, e.g. "prefers voice for film summaries, not text"]

## Health (key facts only)

**[Date]:** [Resolved: illness recovered. Key: stone in gallbladder 22×19mm, found 09.02.2026]

## Decisions & Context

**[Date]:** [Significant decision with brief context]

## Lessons

**[Date]:** [What went wrong and what to do differently]
```

---

## Phase 4: Archive old daily logs

Daily logs older than **30 days** that are already consolidated:

1. Move to `memory/archive/YYYY-MM/` folder
2. Filename unchanged (`YYYY-MM-DD.md`)
3. Update INDEX.md to reflect archiving

If `memory/archive/` doesn't exist — create it.

---

## Phase 5: Sync project memory

**ВАЖНО:** Выполняется **КАЖДЫЙ РАЗ** при запуске садовника.

Для каждого проекта в `memory/projects/*/`:

### 5.1 Проверить PROFILE.md — нет ли TBD

Прочитать `memory/projects/{name}/PROFILE.md`. Если есть поля с "TBD" — пометить проект как требующий внимания. Для AI-native ready проектов (с `./scripts/`) — все поля должны быть заполнены.

### 5.2 Проверить GitHub (issues, PRs)

```bash
# Открытые PR
gh pr list --repo Rast53/{name} --state open --limit 5 2>/dev/null

# Недавние issues
gh issue list --repo Rast53/{name} --state open --limit 5 2>/dev/null

# CI статус (последние 3 запуска)
gh run list --repo Rast53/{name} --limit 3 2>/dev/null
```

### 5.3 Проверить runtime-статус (для deployed проектов)

Проекты деплоятся по-разному. Проверять в зависимости от типа:

**Локально на VPS агента** (1c-docs-bot и подобные):
```bash
# Docker контейнеры на этой машине
docker ps --filter "name=1c-docs" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null

# Или процесс напрямую
pm2 describe {process_name} 2>/dev/null | grep -E "status|pid|uptime"
```

**На production VPS через Docker Swarm** (aitovideo и подобные):
```bash
ssh root@5.35.88.34 "docker stack services {stack_name}" 2>/dev/null
```

**Ключевые проекты и где они живут:**

| Проект | Где | Workspace | Как проверить |
|--------|-----|-----------|---------------|
| 1c-docs-bot | VPS агента (эта машина) | `/root/.openclaw-1c-bot/` | `docker ps \| grep 1c-docs` |
| aitovideo | Production VPS (5.35.88.34) | GitHub | `ssh root@5.35.88.34 "docker stack services aitovideo"` |

### 5.4 Обновить PROFILE.md

- **Статус** — Draft/Active/Live актуален?
- **AI-инфра** — есть ли AGENTS.md, scripts/, DEBUG.md? (🟢 Ready / ⚪ Нет)
- **Открытые задачи** — количество
- **Последний деплой** — дата

### 5.5 Обновить TODO.md

Синхронизировать с открытыми issues в GitHub.

### 5.6 Обновить projects/INDEX.md

Обновить дату последней синхронизации, статусы проектов.

### 5.7 Обнаружить проекты без AI-инфры

Если проект имеет статус Active или Live, но AI-инфра = ⚪ — добавить в TODO: "Нужен `/pm retrofit` для {name}". Проект без scripts/ и AGENTS.md неудобен для агентной работы.

---

## Phase 6: Backup

После всех изменений — создать бэкап через `openclaw-backup` skill.

### 6.1 GitHub backup

```bash
/root/.openclaw/workspace/scripts/backup-workspace.sh
```

**Что бэкапится:**
- `/root/.openclaw/workspace/` — весь workspace со скиллами
- Git commit + push в приватный репозиторий

### 6.2 Проверить результат

```bash
# Проверить последний коммит
cd ~/.openclaw/workspace && git log --oneline -1

# Проверить статус git
cd ~/.openclaw/workspace && git status
```

### 6.3 NAS backup (опционально, по запросу пользователя)

Полный бэкап конфигурации на Synology NAS:

```bash
/root/.openclaw/workspace/scripts/backup-config.sh
```

**Что бэкапится:**
- `openclaw.json` — основной конфиг
- `/root/.openclaw/credentials/` — все .env файлы
- `/root/.openclaw-1c-bot/` — agent workspace

---

## Phase 7: Quality check

After each gardening run, verify:

**Память:**
- [ ] `memory/INDEX.md` exists and is current
- [ ] `MEMORY.md` exists and has entries (if main session)
- [ ] All domain README.md files have `*Последнее обновление*`
- [ ] No domain file has duplicate entries on the same topic
- [ ] Daily logs older than 7 days have `*Консолидировано*` footer
- [ ] No important info exists ONLY in daily logs (should also be in domain file)

**Проекты:**
- [ ] `memory/projects/INDEX.md` — все проекты в реестре
- [ ] Active/Live проекты — PROFILE.md без TBD
- [ ] Active/Live проекты — AI-инфра статус отмечен (🟢/⚪)
- [ ] Проекты без AI-инфры — задача на retrofit создана

**Бэкап:**
- [ ] Последний коммит в git < 6 часов назад

---

## Gardening Log

After each run, append to `memory/YYYY-MM-DD.md`:

```markdown
### Memory Gardening

- Logs consolidated: [N] files
- New MEMORY.md entries: [N]
- Archived: [N] logs to archive/YYYY-MM/
- Projects synced: [N] projects checked, [N] updated
- Backup: [GitHub commit hash] / [NAS status]
- INDEX.md: updated
```
