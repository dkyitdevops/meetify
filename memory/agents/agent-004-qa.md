# QA Report: Meetify Room Connection Issue
**Agent:** agent-004 (QA Engineer)  
**Date:** 2026-03-25  
**Room ID:** c56t45  
**Test URL:** https://46-149-68-9.nip.io/meetify/

---

## Summary

**CRITICAL BUG FOUND:** Несоответствие между отправителем и получателем события `prejoinComplete`. Событие отправляется на `window`, но слушатель установлен на `document`.

---

## Full Console Log

```
[Verbose] [DOM] Password field is not contained in a form
[Verbose] [DOM] Password field is not contained in a form
[Error] Ошибка доступа к медиа: NotFoundError: Requested device not found (room.html:1218)
[Log] Manually triggering prejoinComplete...
[Error] Error accessing media devices: TypeError: Failed to execute 'getUserMedia' on 'MediaDevices': 
        At least one of audio and video must be requested
    at connectToRoom (room.js:598:56)
    at HTMLDocument.<anonymous> (room.js:563:5)
```

---

## Root Cause Analysis

### Проблема

**Файл room.html (строка 1326):**
```javascript
window.dispatchEvent(new CustomEvent('prejoinComplete', {
    detail: window.prejoinSettings
}));
```

**Файл room.js (строка 559):**
```javascript
document.addEventListener('prejoinComplete', (event) => {
    const { camera, microphone } = event.detail;
    connectToRoom({ camera, microphone });
});
```

### Почему это не работает

События `CustomEvent` **не всплывают** по умолчанию (bubbles: false). Когда событие отправляется на `window`, слушатель на `document` его не получает, потому что:
1. `window` — это глобальный объект, родитель `document`
2. Событие не всплывает от `window` к `document` (document внутри window, а не наоборот)
3. Слушатель на `document` никогда не срабатывает

### Дополнительная проблема

Даже если бы событие дошло, при camera=false и microphone=false вызов `getUserMedia({video: false, audio: false})` вызывает ошибку:
```
TypeError: Failed to execute 'getUserMedia' on 'MediaDevices': 
At least one of audio and video must be requested
```

---

## Where Exactly It Fails

| Шаг | Статус | Примечание |
|-----|--------|------------|
| 1. Отправка события prejoinComplete | ✅ | Отправляется на `window` |
| 2. Получение события prejoinComplete | ❌ **FAIL** | Слушатель на `document`, событие не доходит |
| 3. Вызов connectToRoom | ❌ | Не вызывается из-за шага 2 |
| 4. Подключение к WebSocket | ❌ | join-room не отправляется |
| 5. Полноценное подключение | ❌ | Пользователь зависает на "Подключение к комнате..." |

---

## Recommendations

### Fix 1: Исправить несоответствие отправителя и слушателя (КРИТИЧНО)

**Вариант A:** Изменить отправителя в room.html:
```javascript
// room.html строка 1326
document.dispatchEvent(new CustomEvent('prejoinComplete', {
    detail: window.prejoinSettings
}));
```

**Вариант B:** Изменить слушателя в room.js:
```javascript
// room.js строка 559
window.addEventListener('prejoinComplete', (event) => {
    // ...
});
```

**Рекомендуется Вариант A** — меньше изменений, `document` более логичен для DOM-событий.

### Fix 2: Исправить обработку отключенных устройств

В `connectToRoom` добавить проверку:
```javascript
async function connectToRoom(settings = {}) {
    const { camera = true, microphone = true } = settings;
    
    // Если оба устройства отключены, пропускаем getUserMedia
    if (!camera && !microphone) {
        localStream = null;
        document.getElementById('connectingScreen').classList.add('hidden');
        socket.emit('join-room', roomId);
        addChatMessage('Система', 'Вы присоединились к комнате (без камеры и микрофона)', true);
        return;
    }
    
    // ... остальной код
}
```

### Fix 3: Добавить таймаут и обработку ошибок

Добавить таймаут на экран подключения:
```javascript
// В room.html после enterRoom()
setTimeout(() => {
    const connectingScreen = document.getElementById('connectingScreen');
    if (!connectingScreen.classList.contains('hidden')) {
        connectingScreen.innerHTML = '<p>Ошибка подключения. Попробуйте обновить страницу.</p>';
    }
}, 10000);
```

---

## Verification Steps After Fix

1. Открыть https://46-149-68-9.nip.io/meetify/
2. Создать комнату
3. На экране подготовки нажать "Войти в комнату"
4. Проверить Console:
   - ✅ Должно появиться "Sending prejoinComplete" (если добавить лог)
   - ✅ Должен сработать слушатель в room.js
   - ✅ Должен вызваться connectToRoom
   - ✅ Должен отправиться socket.emit('join-room', roomId)
   - ✅ Экран подключения должен скрыться
   - ✅ Должно появиться сообщение "Вы присоединились к комнате"

---

## Additional Notes

- Socket.io подключение работает корректно (socket.connected = true)
- WebRTC и остальная функциональность room.js выглядит исправной
- Проблема чисто в коммуникации между room.html и room.js через CustomEvent
