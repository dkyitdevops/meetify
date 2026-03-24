# Meetify CI/CD Infrastructure

## Структура

```
.github/workflows/
├── ci-cd.yml          # Основной CI/CD pipeline
├── backup.yml         # Ночные бэкапы
├── health-check.yml   # Проверка здоровья каждые 5 минут
├── codeql.yml         # Security scanning (существующий)
├── playwright.yml     # E2E тесты (существующий)
├── regression.yml     # Регрессионные тесты (существующий)
└── ui-tests-v2.yml    # UI тесты v2 (существующий)

scripts/
├── deploy.sh          # Скрипт деплоя с zero-downtime
├── backup.sh          # Скрипт бэкапа
└── restore.sh         # Скрипт восстановления

monitoring/
├── prometheus.yml              # Конфигурация Prometheus
├── loki-config.yml             # Конфигурация Loki (логи)
├── promtail-config.yml         # Конфигурация Promtail
└── grafana/
    ├── dashboards/
    │   ├── dashboards.yml      # Провайдер дашбордов
    │   └── overview.json       # Дашборд Meetify
    └── datasources/
        └── datasources.yml     # Источники данных

docker-compose.prod.yml         # Production Docker Compose
```

## Настройка сервера (46.149.68.9)

### 1. Создание пользователя deploy

```bash
# На сервере от root
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /opt/meetify
chown deploy:deploy /opt/meetify
```

### 2. SSH ключ для GitHub Actions

```bash
# На сервере от пользователя deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Добавить публичный ключ в ~/.ssh/authorized_keys
```

### 3. Добавление секретов в GitHub

В репозитории Settings → Secrets and variables → Actions:

- `SSH_PRIVATE_KEY` - приватный ключ для SSH на сервер
- `SLACK_WEBHOOK_URL` - webhook для уведомлений (опционально)

### 4. Файл .env на сервере

Создать `/opt/meetify/.env`:

```bash
DB_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_here
GRAFANA_PASSWORD=your_grafana_admin_password
```

### 5. Первый запуск

```bash
cd /opt/meetify
# Скопировать файлы или git clone
docker compose -f docker-compose.prod.yml up -d
```

## Доступ к мониторингу

- **Grafana**: http://46.149.68.9:3001 (admin / из GRAFANA_PASSWORD)
- **Prometheus**: http://46.149.68.9:9090

## Команды

```bash
# Деплой вручную
./scripts/deploy.sh

# Бэкап вручную
./scripts/backup.sh manual

# Восстановление
./scripts/restore.sh backup_file.tar.gz

# Просмотр логов
docker compose -f docker-compose.prod.yml logs -f api
```

## CI/CD Pipeline

1. **Push в main** → тесты → сборка образов → security scan → деплой на прод
2. **Push в develop** → тесты → сборка → деплой на staging
3. **Каждые 5 минут** → health check
4. **Каждую ночь в 2:00 UTC** → бэкап
