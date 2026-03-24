# Security Recommendations — Meetify

**Рекомендации по устранению уязвимостей и улучшению безопасности**

---

## 🔴 Критический приоритет (Немедленно)

### REC-001: Реализовать серверную проверку пароля комнаты
**Цель:** Исправить ISSUE-001

**Действия:**
1. Создать middleware для проверки пароля:
```javascript
// api/middleware/auth.js
const roomPasswords = new Map(); // roomId -> hashedPassword

function verifyRoomPassword(req, res, next) {
  const { roomId, password } = req.body;
  const requiredPassword = roomPasswords.get(roomId);
  
  if (requiredPassword && !bcrypt.compareSync(password, requiredPassword)) {
    return res.status(403).json({ error: 'Invalid password' });
  }
  next();
}
```

2. При создании комнаты хешировать пароль:
```javascript
const bcrypt = require('bcrypt');

if (roomData.password) {
  roomPasswords.set(roomId, bcrypt.hashSync(roomData.password, 10));
}
```

3. Проверять пароль при `join-room` событии Socket.IO

---

### REC-002: Исправить XSS уязвимости
**Цель:** Исправить ISSUE-002, ISSUE-011

**Действия:**
1. Создать функцию экранирования:
```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

2. Заменить все `innerHTML` с user input:
```javascript
// Было:
li.innerHTML = '<span>🎥</span><span>' + p.name + '</span>';

// Стало:
li.innerHTML = '<span>🎥</span><span>' + escapeHtml(p.name) + '</span>';
// Или лучше:
li.textContent = ''; // очистить
const icon = document.createElement('span');
icon.textContent = '🎥';
const name = document.createElement('span');
name.textContent = p.name;
li.appendChild(icon);
li.appendChild(name);
```

3. Использовать DOMPurify для сложных случаев:
```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js"></script>
```

---

### REC-003: Настроить CORS правильно
**Цель:** Исправить ISSUE-003

**Действия:**
```javascript
// api/server.js
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

---

### REC-004: Удалить хардкод credentials
**Цель:** Исправить ISSUE-004

**Действия:**
1. Перенести TURN credentials в переменные окружения:
```javascript
// web/room.js
var configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: process.env.TURN_URL || 'turn:localhost:3478',
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD
    }
  ]
};
```

2. Использовать TURN сервер с динамическими credentials (например, coturn с REST API)

3. **Временное решение:** Если нет своего TURN — использовать публичные бесплатные STUN только (с пониманием ограничений)

---

### REC-005: Удалить хранение паролей в sessionStorage
**Цель:** Исправить ISSUE-005

**Действия:**
1. Удалить сохранение пароля:
```javascript
// Удалить:
// sessionStorage.setItem('room_' + roomId + '_password', password);
```

2. Пароль должен передаваться только при входе и проверяться на сервере

3. После успешного входа сервер выдаёт временный токен:
```javascript
const jwt = require('jsonwebtoken');

// При успешной проверке пароля
const token = jwt.sign(
  { roomId, userId, userName },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

---

## 🟠 Высокий приоритет (В течение недели)

### REC-006: Добавить rate limiting
**Цель:** Исправить ISSUE-007

**Действия:**
```javascript
// api/server.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // лимит на IP
  message: 'Too many requests'
});

app.use('/api/', apiLimiter);

// Для Socket.IO
const socketRateLimit = new Map();

socket.on('chat-message', (data) => {
  const key = socket.id + ':chat';
  const now = Date.now();
  const limit = socketRateLimit.get(key) || { count: 0, reset: now + 60000 };
  
  if (now > limit.reset) {
    limit.count = 0;
    limit.reset = now + 60000;
  }
  
  if (limit.count > 30) { // 30 сообщений в минуту
    return socket.emit('error', { message: 'Rate limit exceeded' });
  }
  
  limit.count++;
  socketRateLimit.set(key, limit);
  // ... обработка сообщения
});
```

---

### REC-007: Добавить авторизацию для API записей
**Цель:** Исправить ISSUE-008, ISSUE-015

**Действия:**
```javascript
// Middleware для проверки доступа к комнате
function requireRoomAccess(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.roomId !== req.params.roomId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/recordings/:roomId', requireRoomAccess, (req, res) => {
  // ...
});

// Удалить прямой доступ к файлам:
// app.use('/recordings', express.static(RECORDINGS_DIR)); // УДАЛИТЬ
```

---

### REC-008: Генерировать User ID на сервере
**Цель:** Исправить ISSUE-009

**Действия:**
```javascript
// При подключении сервер генерирует ID
socket.on('join-room', (data) => {
  const userId = uuidv4(); // Серверная генерация
  socket.userData = { 
    userId, 
    userName: data.userName?.substring(0, 50) || 'Guest',
    roomId: data.roomId
  };
  socket.emit('user-id-assigned', { userId });
  // ...
});
```

---

### REC-009: Санитизировать roomId для файлов
**Цель:** Исправить ISSUE-006

**Действия:**
```javascript
function sanitizeRoomId(roomId) {
  // Разрешаем только alphanumeric и дефис
  return roomId.replace(/[^a-zA-Z0-9-]/g, '').substring(0, 50);
}

// Или использовать UUID для внутренних имён файлов
const internalRecordingId = uuidv4();
const filename = `${internalRecordingId}.webm`;
const metadata = { roomId: sanitizedRoomId, originalRoomId: roomId };
fs.writeFileSync(`${filepath}.meta`, JSON.stringify(metadata));
```

---

## 🟡 Средний приоритет (В течение месяца)

### REC-010: Добавить input validation
**Цель:** Исправить ISSUE-010

**Действия:**
```javascript
const Joi = require('joi');

const joinRoomSchema = Joi.object({
  roomId: Joi.string().alphanum().min(3).max(50).required(),
  userName: Joi.string().min(1).max(50).required(),
  password: Joi.string().max(100).optional()
});

socket.on('join-room', (data) => {
  const { error, value } = joinRoomSchema.validate(data);
  if (error) {
    return socket.emit('error', { message: 'Invalid data' });
  }
  // ... использовать value
});
```

---

### REC-011: Добавить HTTPS и security headers
**Цель:** Исправить ISSUE-012, ISSUE-017

**Действия:**
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline временно
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      mediaSrc: ["'self'", "blob:"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Редирект на HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, 'https://' + req.headers.host + req.url);
    }
    next();
  });
}
```

---

### REC-012: Добавить audit logging
**Цель:** Исправить ISSUE-014

**Действия:**
```javascript
const winston = require('winston');

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'audit.log' })
  ]
});

function auditLog(event, data) {
  auditLogger.info({
    timestamp: new Date().toISOString(),
    event,
    ...data
  });
}

// Использование:
socket.on('join-room', (data) => {
  auditLog('USER_JOINED', {
    roomId: data.roomId,
    userId: socket.userData?.userId,
    ip: socket.handshake.address
  });
});
```

---

### REC-013: Фильтровать ICE кандидаты
**Цель:** Исправить ISSUE-013

**Действия:**
```javascript
// Добавить конфигурацию для фильтрации
var configuration = {
  iceServers: [...],
  iceTransportPolicy: 'relay', // Использовать только TURN/relay
  // Или:
  iceCandidatePoolSize: 0
};

// Или фильтровать кандидаты перед отправкой:
pc.onicecandidate = (event) => {
  if (event.candidate) {
    // Пропускаем host кандидаты (локальные IP)
    if (event.candidate.type === 'host') {
      return;
    }
    socket.emit('ice-candidate', { candidate: event.candidate });
  }
};
```

---

## 🟢 Дополнительные рекомендации

### REC-014: Внедрить Content Security Policy
```html
<!-- В HTML -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' wss: ws:;
  media-src 'self' blob:;
  img-src 'self' data: https:;
">
```

---

### REC-015: Добавить Subresource Integrity
```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
        integrity="sha384-..."
        crossorigin="anonymous"></script>
```

---

### REC-016: Регулярное обновление зависимостей
```bash
# Добавить в CI/CD
npm audit
npm update
```

---

### REC-017: Добавить security.txt
```
# /.well-known/security.txt
Contact: security@meetify.example
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: ru, en
```

---

## Архитектурные рекомендации

### 1. Разделение ролей
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Host      │────▶│  Co-host    │────▶│ Participant │
│ (все права) │     │(управление) │     │ (просмотр)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 2. E2E Encryption для чата
- Использовать Signal Protocol или подобный
- Ключи обмениваются через WebRTC data channels

### 3. Защита записей
- Шифровать записи на клиенте перед отправкой
- Или шифровать на сервере с ключом, доступным только участникам комнаты

### 4. Мониторинг
- Интеграция с Sentry для ошибок
- Prometheus + Grafana для метрик
- Alerting на подозрительную активность

---

## План внедрения

| Этап | Срок | Задачи |
|------|------|--------|
| 1 | Немедленно | REC-001, REC-002, REC-003, REC-004, REC-005 |
| 2 | 1 неделя | REC-006, REC-007, REC-008, REC-009 |
| 3 | 2-4 недели | REC-010, REC-011, REC-012, REC-013 |
| 4 | 1-2 месяца | REC-014, REC-015, REC-016, REC-017, архитектурные |

---

## Полезные инструменты

- **Snyk** — сканирование зависимостей
- **OWASP ZAP** — автоматизированное тестирование
- **Mozilla Observatory** — проверка security headers
- **WebRTC Internals** — диагностика WebRTC

---

*Рекомендации составлены на основе OWASP Top 10 2021 и WebRTC Security Best Practices.*
