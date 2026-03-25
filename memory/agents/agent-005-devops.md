# Agent-005: DevOps Engineer — Activity Log

## 2026-03-25: Issue #6 — CI/CD Healthcheck Fix

### Problem
GitHub Actions pipeline падал на шаге healthcheck — endpoint `/health` не был настроен на сервере.

### Changes Made

#### 1. server/server.js
Добавлен `/health` endpoint:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});
```

#### 2. .github/workflows/deploy.yml
- Исправлен URL healthcheck: `http://${{ secrets.SERVER_HOST }}:3001/health`
- Восстановлен Docker cache для корректной работы build

#### 3. docker-compose.yml
- Изменено с локального `build` на образ из GHCR: `ghcr.io/dkyitdevops/ai-team-office:latest`
- Обновлён healthcheck внутри контейнера на `/health`

### Root Cause
Основная проблема была в `docker-compose.yml` — он использовал локальную сборку (`build: context: ./server`), а workflow копировал только docker-compose файлы, не исходный код. Поэтому сервер всегда использовал старый код.

### Result
- Pipeline: ✅ SUCCESS
- Endpoint: http://46.149.68.9:3001/health
- Response: `{"status":"ok","timestamp":"2026-03-25T18:48:44.681Z"}`

### Commits
1. `6437ca4` — devops: add /health endpoint for CI/CD (#6)
2. `6a66e5b` — devops: force rebuild Docker image without cache (#6)
3. `b0d0fd8` — devops: use GHCR image in docker-compose (#6)
4. `44eb21b` — devops: restore Docker cache (#6)
