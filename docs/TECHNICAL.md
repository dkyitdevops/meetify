# Meetify - Техническая документация

## Обзор

Meetify — это веб-приложение для видеоконференций с поддержкой WebRTC, чата, виртуальной доски, опросов и записи встреч.

## Архитектура

### Компоненты системы

```
┌─────────────────────────────────────────────────────────────┐
│                        Клиент (Browser)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  room.html  │  │  room.js    │  │  virtual-background │  │
│  │  (UI)       │  │  (Logic)    │  │  (MediaPipe)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ WebSocket / HTTP
┌────────────────────────▼────────────────────────────────────┐
│                      Сервер (Node.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Express    │  │  Socket.io  │  │  Google Calendar    │  │
│  │  (HTTP API) │  │  (Signaling)│  │  (Integration)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Технологический стек

### Frontend
- **HTML5/CSS3** — разметка и стили
- **Vanilla JavaScript** — клиентская логика
- **Socket.io Client** — real-time коммуникации
- **MediaPipe** — сегментация для виртуального фона
- **WebRTC API** — peer-to-peer видеосвязь

### Backend
- **Node.js** — runtime
- **Express.js** — HTTP сервер
- **Socket.io** — WebSocket сервер
- **UUID** — генерация уникальных ID

### Инфраструктура
- **STUN/TURN серверы** — NAT traversal
  - Google STUN: `stun.l.google.com:19302`
  - Кастомный TURN: `46.149.68.9:3478`

## Структура проекта

```
/data/workspace/
├── api/
│   ├── server.js          # Основной сервер
│   ├── calendar.js        # Google Calendar интеграция
│   └── recordings/        # Директория записей
├── web/
│   ├── room.html          # HTML интерфейс
│   ├── room.js            # Клиентская логика
│   └── virtual-background.js # Модуль виртуального фона
└── docs/
    ├── TECHNICAL.md       # Этот файл
    ├── USER_GUIDE.md      # Руководство пользователя
    ├── API.md             # Документация API
    └── ROADMAP.md         # План развития
```

## Поток данных

### 1. Установка соединения (WebRTC)

```
1. Пользователь A заходит в комнату
   → join-room → сервер

2. Сервер отправляет список существующих пользователей
   → existing-users → Пользователь A

3. Пользователь A создаёт RTCPeerConnection для каждого
   → createOffer → setLocalDescription

4. Offer отправляется через сервер
   → offer → Сервер → offer → Пользователь B

5. Пользователь B создаёт answer
   → createAnswer → setLocalDescription

6. Answer отправляется обратно
   → answer → Сервер → answer → Пользователь A

7. ICE кандидаты обмениваются
   → ice-candidate → (в обе стороны)

8. Соединение установлено, media потоки передаются P2P
```

### 2. Сигнальный механизм

Сервер использует Socket.io для relay сообщений между peers:
- `join-room` — вход в комнату
- `offer` / `answer` — SDP обмен
- `ice-candidate` — ICE кандидаты
- `user-joined` / `user-left` — уведомления

### 3. Запись встречи

```
1. Клиент начинает запись
   → recording-start → сервер

2. Сервер создаёт запись в activeRecordings

3. Клиент захватывает canvas с видео
   → MediaRecorder → чанки

4. Чанки отправляются на сервер
   → recording-chunk → сервер → append to file

5. Остановка записи
   → recording-stop → сервер

6. Сервер сохраняет метаданные в roomRecordings
   и рассылает download URL
```

## Хранилища данных

### На сервере (in-memory)

```javascript
// Активные записи
Map<roomId, {
  recordingId: string,
  filename: string,
  filepath: string,
  startTime: number,
  startedBy: string,
  participants: Set<userId>
}>

// Архив записей комнат
Map<roomId, [{
  recordingId: string,
  filename: string,
  createdAt: number,
  duration: number,
  fileSize: number
}]>

// Активные опросы
Map<roomId, {
  id: string,
  question: string,
  options: string[],
  votes: number[],
  voters: Set<socketId>,
  isAnonymous: boolean
}>

// Календарные события
Map<roomId, {
  eventId: string,
  htmlLink: string,
  attendees: []
}>
```

### На клиенте (sessionStorage / localStorage)

```javascript
// Session storage
sessionStorage.meetifyUserId       // Уникальный ID пользователя
sessionStorage.meetifyUserName     // Имя пользователя
sessionStorage.room_${id}_data     // Данные комнаты

// Local storage
localStorage.meetifySettings       // Настройки приложения
localStorage.meetifyVirtualBg      // Выбранный виртуальный фон
```

## WebRTC конфигурация

```javascript
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:46.149.68.9:3478',
      username: 'meetify',
      credential: 'meetifySecret2024'
    }
  ]
};
```

## Безопасность

### Текущие меры
- CORS разрешён для всех origin (для разработки)
- Нет аутентификации пользователей
- Room ID генерируется случайно
- TURN сервер с базовой авторизацией

### Рекомендации
- Добавить JWT аутентификацию
- Ограничить CORS до конкретных доменов
- Добавить rate limiting
- Шифрование записей при хранении

## Производительность

### Оптимизации
- Canvas capture для записи (не DOM recording)
- Адаптивное качество видео (low/medium/high)
- Grid layout для видео (auto-fit)
- Чанки записи отправляются каждую секунду

### Ограничения
- Записи хранятся на диске сервера
- Нет масштабирования на несколько серверов
- In-memory хранилище — данные теряются при рестарте

## Мониторинг

### Health Check endpoints
- `GET /health` — базовый статус
- `GET /api/health` — API статус
- `GET /api/calendar/status` — статус календаря

### Логирование
```
[API] Calendar event created for room: ${roomId}
Recording started/stopped in room ${roomId}
User connected/disconnected: ${socketId}
```

## Переменные окружения

```bash
PORT=3000                           # Порт сервера
RECORDINGS_DIR=./recordings         # Директория записей
GOOGLE_CALENDAR_ID=primary          # ID календаря
GOOGLE_CLIENT_ID=                   # OAuth client ID
GOOGLE_CLIENT_SECRET=               # OAuth secret
GOOGLE_REDIRECT_URI=                # OAuth redirect
```
