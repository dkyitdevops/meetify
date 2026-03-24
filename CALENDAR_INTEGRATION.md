# Интеграция Google Calendar для Meetify

## Реализованный функционал

### 1. Интеграция с Google Calendar API
- **Файл**: `api/calendar.js`
- Аутентификация через сервисный аккаунт (Service Account)
- Создание, обновление, удаление событий
- Полная поддержка часовых поясов

### 2. Создание события при создании комнаты
- **API Endpoint**: `POST /api/rooms`
- При создании комнаты можно включить опцию "Добавить в Google Calendar"
- Событие создаётся с:
  - Названием комнаты
  - Описанием + ссылкой на комнату
  - Указанным временем начала и длительностью
  - Ссылкой на комнату в поле location

### 3. Отправка приглашений участникам
- **Параметр**: `sendUpdates: 'all'`
- Все указанные email получают приглашения от Google Calendar
- Поддерживается добавление нескольких участников через запятую

### 4. Напоминания о предстоящей встрече
- **Email-напоминание**: за 60 минут до встречи
- **Popup-напоминание**: за 15 минут и за 5 минут до встречи
- Настраивается через `reminders.overrides`

## API Endpoints

### Создание комнаты с календарём
```http
POST /api/rooms
Content-Type: application/json

{
  "name": "Еженедельный созвон",
  "description": "Обсуждение планов",
  "startTime": "2026-03-25T14:00:00.000Z",
  "duration": 60,
  "participants": [
    { "email": "user1@example.com", "name": "Иван" },
    { "email": "user2@example.com", "name": "Петр" }
  ],
  "createCalendarEvent": true
}
```

**Ответ:**
```json
{
  "roomId": "abc123",
  "url": "/room/abc123",
  "calendarEvent": {
    "id": "event_id_from_google",
    "htmlLink": "https://calendar.google.com/event?id=...",
    "attendees": [...]
  }
}
```

### Получение информации о событии комнаты
```http
GET /api/rooms/:roomId/calendar
```

### Создание события для существующей комнаты
```http
POST /api/rooms/:roomId/calendar
Content-Type: application/json

{
  "name": "Название встречи",
  "startTime": "2026-03-25T14:00:00.000Z",
  "duration": 60,
  "participants": [...]
}
```

### Статус интеграции
```http
GET /api/calendar/status
```

## Настройка

1. Создайте сервисный аккаунт в Google Cloud Console
2. Скачайте JSON-ключ и сохраните как `credentials/google-service-account.json`
3. Поделитесь календарём с email сервисного аккаунта
4. Установите зависимости: `npm install` (googleapis уже добавлен в package.json)

## UI-изменения

### index.html
- Добавлена секция "📅 Добавить в Google Calendar"
- Поля для указания даты/времени, длительности, email участников
- Чекбокс для включения/отключения интеграции

### room.js
- При загрузке комнаты проверяется наличие календарного события
- Показывается уведомление с ссылкой на событие в Google Calendar

## Безопасность

- Файл сервисного аккаунта хранится в `credentials/` (не в git)
- Доступ через переменные окружения:
  - `GOOGLE_SERVICE_ACCOUNT_KEYFILE` — путь к JSON-файлу
  - `GOOGLE_CALENDAR_ID` — ID календаря (по умолчанию primary)
- Валидация email участников перед отправкой
