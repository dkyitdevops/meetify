# Meetify - Документация API

## Базовый URL

```
http://localhost:3000
```

## Health Check

### GET /health

Проверка работоспособности сервера.

**Response:**
```json
{
  "status": "ok",
  "service": "meetify-api"
}
```

### GET /api/health

Альтернативный endpoint для проверки API.

**Response:**
```json
{
  "status": "ok",
  "service": "meetify-api"
}
```

## Комнаты

### GET /api/rooms

Получить список комнат (возвращает пустой массив).

**Response:**
```json
{
  "rooms": []
}
```

### POST /api/rooms

Создать новую комнату.

**Request Body:**
```json
{
  "name": "string",              // Название комнаты
  "description": "string",       // Описание
  "startTime": "2024-01-01T10:00:00Z",  // Время начала (ISO 8601)
  "duration": 60,                // Длительность в минутах
  "participants": [              // Список участников
    {
      "email": "user@example.com",
      "name": "User Name"
    }
  ],
  "createCalendarEvent": false   // Создать событие в календаре
}
```

**Response:**
```json
{
  "roomId": "abc123",
  "url": "/room/abc123",
  "calendarEvent": {
    "id": "event123",
    "htmlLink": "https://calendar.google.com/...",
    "attendees": [...]
  }
}
```

### GET /api/rooms/:roomId/calendar

Получить информацию о календарном событии комнаты.

**Response:**
```json
{
  "roomId": "abc123",
  "eventId": "event123",
  "htmlLink": "https://calendar.google.com/...",
  "attendees": [
    {
      "email": "user@example.com",
      "responseStatus": "accepted"
    }
  ]
}
```

**Error 404:**
```json
{
  "error": "No calendar event found for this room"
}
```

### POST /api/rooms/:roomId/calendar

Создать событие в календаре для существующей комнаты.

**Request Body:**
```json
{
  "name": "Team Meeting",
  "description": "Weekly sync",
  "startTime": "2024-01-01T10:00:00Z",
  "duration": 60,
  "participants": [
    {
      "email": "user@example.com",
      "name": "User"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "event123",
  "htmlLink": "https://calendar.google.com/...",
  "attendees": [...]
}
```

## Календарь

### GET /api/calendar/status

Проверка статуса интеграции с Google Calendar.

**Response:**
```json
{
  "initialized": true,
  "calendarId": "primary"
}
```

## Записи

### GET /api/recordings/:roomId

Получить список записей комнаты.

**Response:**
```json
{
  "recordings": [
    {
      "recordingId": "uuid",
      "filename": "meetify-room-timestamp.webm",
      "originalName": "meetify-recording-room-2024-01-01.webm",
      "createdAt": 1704123456789,
      "endedAt": 1704123656789,
      "duration": 200000,
      "fileSize": 15485760,
      "startedBy": "User Name",
      "participantCount": 3
    }
  ]
}
```

### GET /api/recordings/:roomId/:recordingId/download

Скачать файл записи.

**Response:** Binary file (video/webm)

**Headers:**
- `Content-Disposition: attachment; filename="..."`

**Error 404:**
```json
{
  "error": "Recording not found"
}
```

### GET /api/recordings/:roomId/:recordingId/info

Получить информацию о записи.

**Response:**
```json
{
  "recordingId": "uuid",
  "filename": "...",
  "createdAt": 1704123456789,
  "duration": 200000,
  "fileSize": 15485760,
  "startedBy": "User",
  "participantCount": 3
}
```

### DELETE /api/recordings/:roomId/:recordingId

Удалить запись.

**Response:**
```json
{
  "success": true
}
```

## WebSocket Events (Socket.io)

### Подключение

```javascript
const socket = io();
```

### Client → Server Events

#### join-room

Вход в комнату.

```javascript
socket.emit('join-room', {
  roomId: 'abc123',
  userId: 'user-uuid',
  userName: 'User Name'
});
```

#### chat-message

Отправка сообщения в чат.

```javascript
socket.emit('chat-message', {
  roomId: 'abc123',
  text: 'Hello!',
  author: 'User Name'
});
```

#### offer / answer / ice-candidate

WebRTC signaling.

```javascript
// Offer
socket.emit('offer', {
  roomId: 'abc123',
  offer: RTCSessionDescription,
  to: 'target-user-id',
  userId: 'my-user-id'
});

// Answer
socket.emit('answer', {
  roomId: 'abc123',
  answer: RTCSessionDescription,
  to: 'target-user-id',
  userId: 'my-user-id'
});

// ICE Candidate
socket.emit('ice-candidate', {
  roomId: 'abc123',
  candidate: RTCIceCandidate,
  to: 'target-user-id',
  userId: 'my-user-id'
});
```

#### recording-start / recording-stop

Управление записью.

```javascript
socket.emit('recording-start', {
  roomId: 'abc123',
  userId: 'user-id',
  userName: 'User Name'
});

socket.emit('recording-stop', {
  roomId: 'abc123',
  userId: 'user-id',
  userName: 'User Name'
});
```

#### recording-chunk

Отправка чанка записи (ArrayBuffer).

```javascript
socket.emit('recording-chunk', {
  roomId: 'abc123',
  userId: 'user-id',
  chunk: ArrayBuffer
});
```

#### recording-status-request

Запрос статуса текущей записи.

```javascript
socket.emit('recording-status-request', {
  roomId: 'abc123'
});
```

#### raise-hand / lower-hand

Поднять/опустить руку.

```javascript
socket.emit('raise-hand', {
  roomId: 'abc123',
  userId: 'user-id',
  userName: 'User Name'
});

socket.emit('lower-hand', {
  roomId: 'abc123',
  userId: 'user-id',
  userName: 'User Name'
});
```

#### create-poll / vote-poll / close-poll

Управление опросами.

```javascript
// Создать опрос
socket.emit('create-poll', {
  roomId: 'abc123',
  question: 'Question?',
  options: ['Option 1', 'Option 2'],
  isAnonymous: true
});

// Проголосовать
socket.emit('vote-poll', {
  roomId: 'abc123',
  optionIndex: 0,
  userName: 'User Name'
});

// Закрыть опрос (только создатель)
socket.emit('close-poll', {
  roomId: 'abc123'
});
```

#### whiteboard-draw / whiteboard-clear / whiteboard-toggle

Виртуальная доска.

```javascript
// Рисование
socket.emit('whiteboard-draw', {
  roomId: 'abc123',
  fromX: 100,
  fromY: 100,
  toX: 150,
  toY: 150,
  color: '#000000',
  size: 3
});

// Очистка
socket.emit('whiteboard-clear', {
  roomId: 'abc123'
});

// Открыть/закрыть доску
socket.emit('whiteboard-toggle', {
  roomId: 'abc123',
  open: true
});
```

#### reaction

Отправка реакции.

```javascript
socket.emit('reaction', {
  roomId: 'abc123',
  emoji: '👍',
  userId: 'user-id'
});
```

### Server → Client Events

#### existing-users

Список пользователей в комнате (при входе).

```javascript
socket.on('existing-users', (users) => {
  // users: [{ userId: '...', userName: '...' }, ...]
});
```

#### user-joined / user-left

Уведомления о входе/выходе.

```javascript
socket.on('user-joined', (data) => {
  // data: { userId: '...', userName: '...', socketId: '...' }
});

socket.on('user-left', (data) => {
  // data: { userId: '...' }
});
```

#### chat-message

Новое сообщение в чате.

```javascript
socket.on('chat-message', (data) => {
  // data: { text: '...', author: '...', timestamp: '...' }
});
```

#### offer / answer / ice-candidate

WebRTC signaling (см. выше).

#### recording-started / recording-stopped / recording-status

События записи.

```javascript
socket.on('recording-started', (data) => {
  // data: { by: 'User', recordingId: '...', startTime: 1234567890 }
});

socket.on('recording-stopped', (data) => {
  // data: { recordingId: '...', duration: 200000, fileSize: 15485760, downloadUrl: '...' }
});

socket.on('recording-status', (data) => {
  // data: { isRecording: true/false, startedBy: '...', startTime: 1234567890 }
});

socket.on('recording-error', (data) => {
  // data: { message: '...' }
});
```

#### hand-raised / hand-lowered

События поднятия руки.

```javascript
socket.on('hand-raised', (data) => {
  // data: { name: 'User', userId: '...' }
});

socket.on('hand-lowered', (data) => {
  // data: { name: 'User', userId: '...' }
});
```

#### poll-created / poll-updated / poll-closed

События опросов.

```javascript
socket.on('poll-created', (data) => {
  // data: { id: '...', question: '...', options: [...], isAnonymous: true/false }
});

socket.on('poll-updated', (data) => {
  // data: { id: '...', votes: [5, 3, 2], voterNames: [...], userVotes: [...] }
});

socket.on('poll-closed', (data) => {
  // data: { id: '...' }
});
```

#### whiteboard-draw / whiteboard-clear / whiteboard-toggle

События доски.

```javascript
socket.on('whiteboard-draw', (data) => {
  // data: { fromX, fromY, toX, toY, color, size }
});

socket.on('whiteboard-clear', () => {});

socket.on('whiteboard-toggle', (data) => {
  // data: { open: true/false }
});
```

#### reaction

Реакция от пользователя.

```javascript
socket.on('reaction', (data) => {
  // data: { emoji: '👍', userId: '...' }
});
```

## Статические файлы

### GET /recordings/:filename

Прямой доступ к файлам записей.

### GET /room/:roomId

Страница комнаты (HTML).

### GET /socket.io/socket.io.js

Клиентская библиотека Socket.io.

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Bad Request — неверные параметры |
| 404 | Not Found — ресурс не найден |
| 500 | Internal Server Error — ошибка сервера |

## Rate Limiting

В текущей версии rate limiting не реализован.

## Аутентификация

В текущей версии аутентификация не требуется. Все endpoints публичные.
