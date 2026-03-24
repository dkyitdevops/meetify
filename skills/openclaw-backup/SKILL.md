---
name: openclaw-backup
description: Backup this OpenClaw instance to NAS. Run after "анализ" (session-reflection) or when user asks for backup. No GitHub — NAS only.
user-invocable: true
metadata:
  openclaw:
    emoji: "💾"
---

# OpenClaw Backup (Instance)

Бэкапит воркспейс и конфиг на NAS Ивана.

## Когда запускать

- Автоматически в конце session-reflection (после слова «анализ»)
- По запросу пользователя («сделай бэкап», «backup»)

## Что бэкапится

- `workspace/` — память, скиллы, файлы, credentials
- `home-openclaw/openclaw.json` — конфиг

## Куда

NAS: `ra@100.98.246.29:/volume2/homes/Ra/backup/instances/<instance>/`

## Как выполнить

Определи имя инстанса из пути `/opt/<instance>/` (например `lenaclaw`, `grisha`).
Запусти через exec:

```bash
INSTANCE="<instance_name>"
ssh root@100.108.115.59 "
  tar czf - -C /opt/$INSTANCE workspace/ home-openclaw/openclaw.json 2>/dev/null | \
  ssh -i /root/.ssh/id_ed25519 ra@100.98.246.29 \
    'mkdir -p /volume2/homes/Ra/backup/instances/$INSTANCE && cd /volume2/homes/Ra/backup/instances/$INSTANCE && tar xzf -' && \
  echo BACKUP_OK || echo BACKUP_FAILED
"
```

Жди `BACKUP_OK`. Если `BACKUP_FAILED` — NAS недоступен, сообщи пользователю.

## Верификация

```bash
ssh root@100.108.115.59 "ssh -i /root/.ssh/id_ed25519 ra@100.98.246.29 'ls /volume2/homes/Ra/backup/instances/<instance>/'"
```

## Ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| Connection timeout | NAS выключен или Tailscale | Пропустить бэкап, сообщить Ивану |
| Permission denied | SSH ключ не настроен | Сообщить Ивану (@Ra_53) |
