---
name: memory-navigator
description: Navigate and read from long-term memory. Use when looking for stored information about the user, past events, domain knowledge, or any persisted facts. Also run as session start orientation.
---

# Memory Navigator

## Session Start Protocol

Run this EVERY session before doing anything else (after SOUL.md and USER.md):

1. Read `memory/INDEX.md` — the catalog of all memory domains
2. Read `memory/YYYY-MM-DD.md` (today) — if exists
3. Read `memory/YYYY-MM-DD.md` (yesterday) — if exists
4. If MAIN SESSION: read `MEMORY.md` — long-term curated memory

If `memory/INDEX.md` doesn't exist yet → run `memory-gardener` to create it.

---

## Information Lookup

When user asks something — check in this order:

### Step 1: Check INDEX.md first
Open `memory/INDEX.md`. Find the matching domain. Go directly to the file.

### Step 2: Decision tree

User asks about...
│
├── Person / birthday / family member → memory/birthdays.md
├── Health / symptoms / medications / doctor / tests → memory/health/README.md
├── Film / series / rating / watchlist → memory/watchlist.md + memory/kinopoisk_ratings.md
├── Home / apartment / repairs / rooms → memory/home/README.md → navigate to subdomain
├── Home network / devices / Wi-Fi → memory/home-network.md
├── Today's events / recent actions → memory/YYYY-MM-DD.md
├── Recurring rules / preferences → MEMORY.md
│
├── Project / repo / deploy / code → memory/projects/INDEX.md → memory/projects/{name}/
│   ├── Architecture → ARCHITECTURE.md
│   ├── Deploy / как деплоить → DEPLOY.md
│   ├── What changed / history → CHANGELOG.md
│   ├── Tasks / TODO → TODO.md
│   └── GitHub issues/PRs → GITHUB_PROJECT.md
│
├── API keys / tokens / credentials → ⚠️ SECRETS (see below)
├── Infrastructure / VPS / Docker → memory/infrastructure/vps-infrastructure.md
├── Services / Cursor / HA / OpenRouter → memory/services.md
│
└── Unknown domain → scan memory/ directory, then ask user

### Step 3: Reading a domain file

When reading any domain README.md:
- Check the **Navigation** section first (quick links to sub-files)
- Check **Quick links** table if present
- Read the relevant section only — don't load the whole file if not needed

### Step 4: Not found

If information isn't in any memory file:
1. Say so honestly — don't invent
2. Ask if user wants it recorded for future sessions
3. If yes → run `memory-writer`

---

## Domain Map Template

(Maintained by memory-gardener. Copy current state of INDEX.md here if loaded.)

memory/
├── INDEX.md ← start here
├── MEMORY.md ← curated long-term memory (main session only)
├── YYYY-MM-DD.md ← daily logs
├── birthdays.md ← people + dates
├── home-network.md ← network, devices
├── watchlist.md ← films queue
├── kinopoisk_ratings.md ← ratings history
├── wordle-rules.md ← game rules
├── health/ ← medical history
│   └── README.md ← ENTER HERE
├── home/ ← apartment
│   └── README.md ← ENTER HERE
├── projects/ ← managed projects
│   ├── INDEX.md ← registry of all projects
│   └── {name}/ ← per-project context
│       ├── PROFILE.md, ARCHITECTURE.md, DEPLOY.md
│       ├── CHANGELOG.md, TODO.md, GITHUB_PROJECT.md
│       └── decisions/ ← ADR
├── infrastructure/ ← VPS, Docker, network
│   └── vps-infrastructure.md
└── services.md ← Cursor, HA, OpenRouter integrations

---

## Read Quality Rules

- **Don't hallucinate** — if no file covers it, say so
- **Cite the source** — mention which file the info came from
- **Check date** — note how old the info is; flag if >30 days for fast-changing data (e.g., medications)
- **Cross-reference** — health info may link to specific dates in daily logs

## Secrets Safety

**Если пользователь спрашивает о секрете (API key, token, password):**
- Ответить **что** хранится и **где** (`/root/.openclaw/credentials/{service}.env`)
- **НЕ выводить** значения секретов в ответ
- Предложить: "Могу показать команду для чтения" → `cat /root/.openclaw/credentials/{service}.env`
- Если секрет нужно обновить → инструкция через `memory-writer`

**Если пользователь передаёт секрет в чате:**
- Немедленно сохранить через `memory-writer` (protocol: secrets)
- Не повторять значение секрета в ответе
