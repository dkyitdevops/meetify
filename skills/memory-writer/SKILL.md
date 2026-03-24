---
name: memory-writer
description: Write and persist information to memory correctly. Use when user says "remember", "запомни", shares important data, a significant event occurs, or new facts should be saved for future sessions.
---

# Memory Writer

## Step 1: Classify the information

What is this?
│
├── RULE / PREFERENCE / HABIT
│   → MEMORY.md (main session) or daily log (if unsure of permanence)
├── EVENT / WHAT HAPPENED TODAY
│   → memory/YYYY-MM-DD.md (daily log)
├── DOMAIN FACT (health, home, birthday, film...)
│   → domain file (see Step 2)
├── PROJECT INFO (deploy, architecture, decision, changelog)
│   → memory/projects/{name}/ (see Step 2)
├── SECRET / TOKEN / API KEY / PASSWORD
│   → /root/.openclaw/credentials/{service}.env (see Step 2a)
├── REMINDER / SCHEDULE
│   → HEARTBEAT.md or cron job (use cron-mastery skill)
└── UNKNOWN
    → daily log as safe default, flag for later review

---

## Step 2: Choose the location

| Information type | Write to |
|-----------------|----------|
| Medical visit, test result, medication | `memory/health/README.md` |
| Birthday / person | `memory/birthdays.md` |
| Film added / watched | `memory/watchlist.md` |
| Film rating | `memory/kinopoisk_ratings.md` |
| Home repair, room change, document | `memory/home/` → correct subdomain |
| Network device, IP, credential | `memory/home-network.md` |
| Game rules, recurring format | dedicated `memory/{topic}.md` |
| Today's events (default) | `memory/YYYY-MM-DD.md` |
| Long-term lesson, significant decision | `MEMORY.md` |
| Project architecture / decision | `memory/projects/{name}/ARCHITECTURE.md` or `decisions/` |
| Project deploy changed | `memory/projects/{name}/DEPLOY.md` |
| Project task done / new task | `memory/projects/{name}/TODO.md` |
| Project release / change | `memory/projects/{name}/CHANGELOG.md` |
| VPS / Docker / infra change | `memory/infrastructure/vps-infrastructure.md` |
| Service integration (Cursor, HA, etc.) | `memory/services.md` |

**If no matching file exists → go to Step 3 (New Domain)**

### Step 2a: Secrets protocol

**Если пользователь передал секрет (токен, API key, пароль):**

1. **Сохранить** в `/root/.openclaw/credentials/{service}.env`:
   ```bash
   echo 'SERVICE_API_KEY=xxx' >> /root/.openclaw/credentials/{service}.env
   chmod 600 /root/.openclaw/credentials/{service}.env
   ```
2. **Обновить** `memory/secrets.md` — добавить запись: что, для чего, когда сохранено
3. **НЕ записывать** значение секрета в daily log, MEMORY.md или другие файлы памяти
4. **НЕ повторять** значение секрета в ответе пользователю
5. **Подтвердить:** "Сохранено в `/root/.openclaw/credentials/{service}.env`"

---

## Step 3: Write the entry

### Daily log entry format

## Events

### [Category]
- [What happened] — [context if needed]
- [Decision made, with brief rationale]

### Rules
- [Any recurring rule or preference established today]

### Fact entry (domain file)

Always include:
- **Date** of the fact / event
- **Source** (who said it, which document, which conversation)
- **Status** if applicable (active / completed / outdated)

**[needs-verify] rule:** Любой факт о внешнем мире (IP, версия, размер диска, статус сервиса, характеристика устройства, цена) — записывать с меткой `[needs-verify: что проверить]`. Садовник верифицирует при следующем запуске.

Исключение — факты из официальных документов (PDF, выписки, справки): они уже верифицированы источником.

Примеры:
```
- VPS-4 RAM: ~2GB [needs-verify: ram]
- Synology DS918+: 8TB [needs-verify: disk]
- n8n запущен [needs-verify: статус контейнера]
```

Use tables for structured comparison (e.g., test results with norms).
Use chronological sections for evolving events (e.g., medical history).

### MEMORY.md entry format

## [Topic]

**[Date]:** [Fact or lesson, 1-3 sentences max]
<!-- Source: [domain file or daily log date] -->

---

## Step 4: Preserve existing content

**CRITICAL rules:**
- Never overwrite — always APPEND or INSERT into existing sections
- Always read the file before writing to check for duplicates
- If a very similar entry already exists, UPDATE it rather than creating a duplicate
- Add `*Обновлено: YYYY-MM-DD*` to the bottom of any file you modify

---

## Step 5: New domain protocol

When information doesn't fit any existing domain:

**Option A — Simple flat file** (use when):
- Topic is self-contained with a simple list or table
- Unlikely to grow into many sub-topics
- Example: `memory/wordle-rules.md`, `memory/birthdays.md`

Template for flat file:

```markdown
# [Topic Title]

**Последнее обновление:** YYYY-MM-DD

---

## [Section 1]
[content]

---

*Создано: YYYY-MM-DD*
```

**Option B — Domain folder** (use when):
- Topic is complex with multiple sub-aspects
- Will grow over time
- Needs linked sub-files
- Example: `memory/health/`, `memory/home/`

Required files for a new domain folder:

```
memory/{domain}/
├── README.md ← navigation hub (required)
└── {subtopic}.md ← specific files as needed
```

README.md must include:
- **What this domain covers** (1 paragraph)
- **Structure** section (what's in each sub-file)
- **Navigation** links to sub-files
- **Quick links table** for common lookups
- `*Создано: YYYY-MM-DD*`

**After creating any new domain:**
→ Add it to `memory/INDEX.md` (run memory-gardener if INDEX.md doesn't exist)

---

## Step 6: Update INDEX.md

After any structural change (new file, new folder), update `memory/INDEX.md`:
- Add the new domain with a one-line description
- Update the directory tree
