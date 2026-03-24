---
name: session-reflection
description: Structured end-of-session reflection and memory consolidation. Use when the user writes "анализ" or signals end of session, or when explicitly asked to reflect on the session. Extracts behavioral patterns, tool usage insights, and important facts from the conversation. Writes to memory/patterns.md and daily log.
---

# Session Reflection

Structured post-session debrief. Run after "анализ" trigger or session end.

## Three Reflection Axes

### 1. Паттерны пользователя (User Patterns)
Scan the full session for new or confirmed signals about the user's preferences and behavior:
- New preference or decision rule discovered?
- Something they corrected or rejected (reveals expectation gap)?
- How they communicate: brief commands, voice, questions, detailed context?
- Any repeated topic across multiple sessions (→ higher weight)?

### 2. Паттерны себя (Self-Patterns)
Honest audit of own performance this session:
- Unnecessary tool calls or round-trips?
- Wrong tool selected for the task?
- Asked a question I could have answered from memory?
- Proactive action I should have taken but didn't?
- Something that worked unusually well?

### 3. Инсайты (Insights)
Distill what's worth persisting:
- Fact that will matter next session
- Rule or heuristic that applies broadly
- Pattern confirmed 2+ times → escalate to memory/patterns.md

## Output Protocol

Run in this order:

1. **Evaluate weight**: Is this a one-time fact or a repeating pattern?
   - One-time fact → daily log only (`memory/YYYY-MM-DD.md`)
   - Repeating/behavioral pattern → `memory/patterns.md` + daily log

2. **Write to memory/patterns.md** (if pattern-level insight):
   - Format: `[YYYY-MM-DD] <category>: <concise rule>`
   - Categories: `preference`, `workflow`, `tool`, `communication`, `decision`
   - Never duplicate existing entries — update if pattern evolved

3. **Append to daily log** (`memory/YYYY-MM-DD.md`):
   - 3–7 bullet points max
   - What happened + what was learned
   - No padding, no obvious facts

4. **Scan for unfinished tasks** → write to `tasks/QUEUE.md` section "Ready":
   - Scan the session for explicitly mentioned but unfinished items
   - Format:
     ```
     - [ ] **Краткое описание** (YYYY-MM-DD)
       - Контекст: что уже сделано, где остановились
       - Приоритет: high/medium/low
     ```
   - Don't duplicate tasks already in QUEUE.md

5. **Trigger memory-writer** for any facts that belong in MEMORY.md or domain files

## Onboarding Check (если существует BOOTSTRAP.md)

После записи в память — оцени готовность:

**Достаточно знаний если:**
- Известно имя пользователя и как к нему обращаться
- Понятна хотя бы одна основная задача / сфера деятельности
- Есть хотя бы 1-2 предпочтения или паттерна в общении
- USER.md заполнен не только placeholder'ами

**Если знаний достаточно:**
1. Удали файл `BOOTSTRAP.md` из воркспейса
2. Запиши в daily log: `[онбординг завершён — BOOTSTRAP.md удалён]`

**Если знаний недостаточно:**
1. Оставь BOOTSTRAP.md
2. В начале следующей сессии продолжи знакомство — задай 1-2 уточняющих вопроса естественно, в ходе разговора
3. Запиши в daily log что онбординг продолжается и чего не хватает

## Note on Backup
Backup runs automatically every night via cron on the server.
No need to trigger it manually after reflection.

## Decision Filter

Before writing anything, ask: *"Would this change how I behave next session?"*
- Yes → write it
- No → skip it

Keep memory lean. Quality > quantity.
