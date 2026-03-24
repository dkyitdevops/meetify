# Security Issues — Meetify

**Список найденных уязвимостей и проблем безопасности**

---

## 🔴 Критические (Critical)

### ISSUE-001: Отсутствие серверной проверки пароля комнаты
**Файл:** `api/server.js`  
**Строки:** 180-210 (обработчик `join-room`)  
**Описание:** Пароль комнаты сохраняется в `sessionStorage` на клиенте, но сервер никогда не проверяет его при подключении. Любой пользователь, знающий ID комнаты, может подключиться.  
**Влияние:** Полный обход механизма защиты комнат.  
**CVSS:** 9.1 (Critical)

---

### ISSUE-002: XSS через имена участников
**Файл:** `web/room.js`  
**Строки:** 225-230 (функция `updateParticipantsList`)  
**Описание:** Имена участников вставляются через `innerHTML` без экранирования:
```javascript
li.innerHTML = '<span>🎥</span><span>' + handIcon + (p.name || 'Participant') + '</span>';
```
**Влияние:** Выполнение произвольного JavaScript, кража сессий, deface.  
**CVSS:** 8.8 (High)

---

### ISSUE-003: CORS misconfiguration — разрешены все origins
**Файл:** `api/server.js`  
**Строки:** 7-13, 16  
**Описание:** 
```javascript
const io = new Server(server, {
  cors: { origin: "*" }
});
app.use(cors());
```
**Влияние:** CSRF атаки, кража данных через поддельные сайты.  
**CVSS:** 8.2 (High)

---

### ISSUE-004: Хардкод credentials TURN сервера
**Файл:** `web/room.js`  
**Строки:** 650-656  
**Описание:** 
```javascript
{
    urls: 'turn:46.149.68.9:3478',
    username: 'meetify',
    credential: 'meetifySecret2024'
}
```
**Влияние:** Несанкционированный доступ к TURN серверу, MITM атаки на WebRTC.  
**CVSS:** 8.1 (High)

---

### ISSUE-005: Пароли хранятся в plaintext в sessionStorage
**Файл:** `web/index.html`, `web/room.js`  
**Строки:** index.html:220, room.js:18  
**Описание:** Пароли комнат сохраняются в sessionStorage без шифрования и легко доступны через DevTools.  
**Влияние:** Утечка паролей при доступе к браузеру.  
**CVSS:** 7.5 (High)

---

## 🟠 Высокие (High)

### ISSUE-006: Path Traversal в API записей
**Файл:** `api/server.js`  
**Строки:** 220-225, 260-265  
**Описание:** `roomId` используется в имени файла без санитизации. Если `roomId` содержит `../`, возможен доступ к файлам за пределами директории записей.  
**Влияние:** Чтение/запись файлов на сервере.  
**CVSS:** 7.5 (High)

---

### ISSUE-007: Отсутствие rate limiting
**Файл:** `api/server.js` (весь файл)  
**Описание:** Нет ограничений на:
- Создание комнат
- Отправку сообщений в чат
- Whiteboard draw события
- Начало/остановку записей

**Влияние:** DoS атаки, переполнение диска.  
**CVSS:** 7.1 (High)

---

### ISSUE-008: Отсутствие авторизации для API записей
**Файл:** `api/server.js`  
**Строки:** 108-125, 128-145  
**Описание:** Endpoints `/api/recordings/:roomId` и `/api/recordings/:roomId/:recordingId/download` не требуют авторизации.  
**Влияние:** Доступ к записям любого пользователя зная roomId.  
**CVSS:** 6.5 (Medium)

---

### ISSUE-009: User ID подделывается на клиенте
**Файл:** `web/room.js`  
**Строки:** 1-6  
**Описание:** 
```javascript
var userId = Math.random().toString(36).substring(2, 15);
```
User ID генерируется на клиенте и легко предсказуем/подделываем.  
**Влияние:** Имперсонация других пользователей.  
**CVSS:** 6.5 (Medium)

---

## 🟡 Средние (Medium)

### ISSUE-010: Отсутствие input validation
**Файл:** Все API endpoints  
**Описание:** Ни один endpoint не валидирует входные данные (roomId, userId, сообщения, опросы).  
**Влияние:** Неожиденное поведение, потенциальные инъекции.  
**CVSS:** 5.3 (Medium)

---

### ISSUE-011: XSS через опросы
**Файл:** `web/room.js`  
**Строки:** 350-400 (функции работы с опросами)  
**Описание:** Вопросы и варианты ответов опросов отображаются без санитизации через `textContent` (безопасно), но создаются через строковую конкатенацию.  
**Влияние:** Потенциальный XSS.  
**CVSS:** 5.0 (Medium)

---

### ISSUE-012: Отсутствие HTTPS enforcement
**Файл:** `api/server.js`, `web/room.js`  
**Описание:** Нет редиректа с HTTP на HTTPS, нет HSTS заголовков.  
**Влияние:** MITM атаки, перехват данных.  
**CVSS:** 5.0 (Medium)

---

### ISSUE-013: Утечка локальных IP через WebRTC
**Файл:** `web/room.js`  
**Описание:** ICE кандидаты не фильтруются, локальные IP адреса доступны через `pc.localDescription`.  
**Влияние:** Раскрытие внутренней сети пользователя.  
**CVSS:** 4.3 (Medium)

---

### ISSUE-014: Отсутствие audit logging
**Файл:** `api/server.js`  
**Описание:** Нет логирования действий пользователей (вход, выход, начало записи, создание опросов).  
**Влияние:** Невозможность расследования инцидентов.  
**CVSS:** 4.0 (Medium)

---

### ISSUE-015: Записи доступны по прямой ссылке
**Файл:** `api/server.js`  
**Строка:** 148  
**Описание:** `app.use('/recordings', express.static(RECORDINGS_DIR));` — файлы доступны без авторизации.  
**Влияние:** Несанкционированный доступ к записям.  
**CVSS:** 4.0 (Medium)

---

## 🟢 Низкие (Low)

### ISSUE-016: Information Disclosure через error messages
**Файл:** `api/server.js`  
**Описание:** Ошибки возвращают подробные сообщения (`error.message`), возможно раскрытие внутренней структуры.  
**Влияние:** Информация для потенциальных атак.  
**CVSS:** 3.1 (Low)

---

### ISSUE-017: Отсутствие Content Security Policy
**Файл:** `web/room.html`, `web/index.html`  
**Описание:** Нет CSP заголовков, что позволяет выполнение inline скриптов и загрузку ресурсов с любых доменов.  
**Влияние:** Усиление XSS атак.  
**CVSS:** 3.1 (Low)

---

### ISSUE-018: Отсутствие Secure флага для cookies (если будут использоваться)
**Файл:** —  
**Описание:** При добавлении cookies не установлены флаги `Secure`, `HttpOnly`, `SameSite`.  
**Влияние:** Кража cookies через XSS.  
**CVSS:** 2.5 (Low)

---

## Сводная таблица

| ID | Уровень | Компонент | Тип | Статус |
|----|---------|-----------|-----|--------|
| ISSUE-001 | 🔴 Critical | API | Auth | Open |
| ISSUE-002 | 🔴 Critical | Client | XSS | Open |
| ISSUE-003 | 🔴 Critical | API | CORS/CSRF | Open |
| ISSUE-004 | 🔴 Critical | Client | Credentials | Open |
| ISSUE-005 | 🔴 Critical | Client | Storage | Open |
| ISSUE-006 | 🟠 High | API | Path Traversal | Open |
| ISSUE-007 | 🟠 High | API | DoS | Open |
| ISSUE-008 | 🟠 High | API | Auth | Open |
| ISSUE-009 | 🟠 High | Client | Auth | Open |
| ISSUE-010 | 🟡 Medium | API | Validation | Open |
| ISSUE-011 | 🟡 Medium | Client | XSS | Open |
| ISSUE-012 | 🟡 Medium | API | Transport | Open |
| ISSUE-013 | 🟡 Medium | Client | Privacy | Open |
| ISSUE-014 | 🟡 Medium | API | Logging | Open |
| ISSUE-015 | 🟡 Medium | API | Auth | Open |
| ISSUE-016 | 🟢 Low | API | Info Disclosure | Open |
| ISSUE-017 | 🟢 Low | Client | Headers | Open |
| ISSUE-018 | 🟢 Low | API | Cookies | Open |

---

*Всего: 18 issues (5 Critical, 4 High, 6 Medium, 3 Low)*
