# Google Calendar API Credentials

Для работы интеграции с Google Calendar необходимо создать сервисный аккаунт.

## Настройка

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Calendar API:
   - APIs & Services → Library
   - Найдите "Google Calendar API"
   - Нажмите "Enable"

4. Создайте сервисный аккаунт:
   - IAM & Admin → Service Accounts
   - Create Service Account
   - Укажите имя (например, "meetify-calendar")
   - Роль: Editor
   - Создайте ключ: Keys → Add Key → JSON
   - Скачанный файл сохраните как `google-service-account.json` в эту директорию

5. Поделитесь календарём с сервисным аккаунтом:
   - Откройте Google Calendar
   - Настройки → Нужный календарь → Share with specific people
   - Добавьте email сервисного аккаунта (из JSON-файла, поле `client_email`)
   - Уровень доступа: "Make changes to events"

## Переменные окружения (опционально)

```bash
GOOGLE_SERVICE_ACCOUNT_KEYFILE=./credentials/google-service-account.json
GOOGLE_CALENDAR_ID=primary  # или ID конкретного календаря
```

## Проверка

После настройки при создании комнаты с опцией "Добавить в Google Calendar":
- Событие будет создано в календаре
- Приглашения будут отправлены указанным участникам
- Участники получат email-напоминания за час до встречи
