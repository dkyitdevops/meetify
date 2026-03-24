// Глобальные переменные
var socket = io(window.location.origin);
var localStream = null;
var peerConnections = {};
var currentRoomId = null;
var isMicEnabled = true;
var isCamEnabled = true;

// TURN сервер конфигурация
var configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
            urls: 'turn:46.149.68.9:3478',
            username: 'meetify',
            credential: 'meetifySecret2024'
        },
        {
            urls: 'turns:46.149.68.9:5349',
            username: 'meetify',
            credential: 'meetifySecret2024'
        }
    ],
    iceCandidatePoolSize: 10
};

function updateStatus(text, type) {
    var status = document.getElementById('status');
    status.textContent = text;
    status.className = 'status ' + type;
}

async function createRoom() {
    var roomId = Math.random().toString(36).substring(7);
    document.getElementById('roomId').value = roomId;
    await joinRoom();
}

async function joinRoom() {
    var roomId = document.getElementById('roomId').value;
    if (!roomId) {
        alert('Введите ID комнаты');
        return;
    }
    
    currentRoomId = roomId;
    updateStatus('Запрос доступа к камере...', 'connecting');
    
    try {
        // Сначала получаем доступ к медиа
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        addVideoStream(localStream, 'local', true);
        updateStatus('Подключение к комнате...', 'connecting');
        
        // Показываем контролы
        var controls = document.getElementById('controls');
        if (controls) {
            controls.classList.remove('hidden');
        }
        
        // Только потом подключаемся к сокету
        socket.emit('join-room', roomId);
        
        // Принудительно показываем чат и контролы (на случай если joined-room не сработает)
        setTimeout(function() {
            var chatSection = document.getElementById('chatSection');
            var controls = document.getElementById('controls');
            if (chatSection) chatSection.classList.remove('hidden');
            if (controls) controls.classList.remove('hidden');
        }, 500);
        
    } catch (err) {
        console.error('Error accessing media devices:', err);
        updateStatus('Ошибка доступа к камере/микрофону. Разрешите доступ и попробуйте снова.', 'error');
    }
}

// Управление микрофоном
function toggleMic() {
    if (!localStream) return;
    
    var audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;
    
    isMicEnabled = !isMicEnabled;
    audioTracks.forEach(function(track) {
        track.enabled = isMicEnabled;
    });
    
    var micBtn = document.getElementById('micBtn');
    if (micBtn) {
        micBtn.textContent = isMicEnabled ? '🎤' : '🎤❌';
        micBtn.classList.toggle('muted', !isMicEnabled);
    }
    
    console.log('Microphone ' + (isMicEnabled ? 'enabled' : 'disabled'));
}

// Управление камерой
function toggleCam() {
    if (!localStream) return;
    
    var videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return;
    
    isCamEnabled = !isCamEnabled;
    videoTracks.forEach(function(track) {
        track.enabled = isCamEnabled;
    });
    
    var camBtn = document.getElementById('camBtn');
    if (camBtn) {
        camBtn.textContent = isCamEnabled ? '📹' : '📹❌';
        camBtn.classList.toggle('muted', !isCamEnabled);
    }
    
    console.log('Camera ' + (isCamEnabled ? 'enabled' : 'disabled'));
}

// Выход из комнаты
function leaveRoom() {
    if (localStream) {
        localStream.getTracks().forEach(function(track) {
            track.stop();
        });
        localStream = null;
    }
    
    // Закрываем все peer connections
    Object.keys(peerConnections).forEach(function(userId) {
        peerConnections[userId].close();
    });
    peerConnections = {};
    
    // Очищаем видео
    var videosContainer = document.getElementById('videos');
    if (videosContainer) {
        videosContainer.innerHTML = '';
    }
    
    // Скрываем чат и контролы
    var chatSection = document.getElementById('chatSection');
    var controls = document.getElementById('controls');
    if (chatSection) chatSection.classList.add('hidden');
    if (controls) controls.classList.add('hidden');
    
    // Отключаемся от комнаты
    if (currentRoomId) {
        socket.emit('leave-room', currentRoomId);
    }
    currentRoomId = null;
    
    updateStatus('Не подключено', '');
    document.getElementById('roomId').value = '';
}

function addVideoStream(stream, userId, isLocal) {
    var videosContainer = document.getElementById('videos');
    var video = document.getElementById('video-' + userId);
    
    if (!video) {
        video = document.createElement('video');
        video.id = 'video-' + userId;
        video.autoplay = true;
        video.playsInline = true;
        if (isLocal) video.classList.add('local-video');
        videosContainer.appendChild(video);
    }
    
    video.srcObject = stream;
}

// Обработчики Socket.io
socket.on('connect', function() {
    console.log('Socket connected:', socket.id);
    updateStatus('Сервер подключен', 'connected');
});

socket.on('connect_error', function(err) {
    console.error('Socket connection error:', err);
    updateStatus('Ошибка подключения к серверу', 'error');
});

socket.on('joined-room', function(roomId) {
    console.log('Joined room:', roomId);
    updateStatus('Подключено к комнате: ' + roomId, 'connected');
    
    // Показываем чат
    var chatSection = document.getElementById('chatSection');
    if (chatSection) {
        chatSection.classList.remove('hidden');
    }
    
    // Добавляем системное сообщение
    addChatMessage('Система', 'Вы присоединились к комнате ' + roomId, true);
});

// Чат функции
function addChatMessage(author, text, isSystem) {
    var chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    var messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    if (isSystem) {
        messageDiv.style.fontStyle = 'italic';
        messageDiv.style.color = '#888';
    }
    
    var authorSpan = document.createElement('div');
    authorSpan.className = 'author';
    authorSpan.textContent = author;
    
    var textSpan = document.createElement('div');
    textSpan.className = 'text';
    textSpan.textContent = text;
    
    messageDiv.appendChild(authorSpan);
    messageDiv.appendChild(textSpan);
    chatMessages.appendChild(messageDiv);
    
    // Автопрокрутка вниз
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    var chatInput = document.getElementById('chatInput');
    if (!chatInput) return;
    
    var text = chatInput.value.trim();
    if (!text) return;
    
    if (!currentRoomId) {
        alert('Сначала присоединитесь к комнате');
        return;
    }
    
    // Отправляем сообщение на сервер
    socket.emit('chat-message', {
        roomId: currentRoomId,
        text: text,
        author: 'Вы'
    });
    
    // Добавляем своё сообщение в чат
    addChatMessage('Вы', text, false);
    
    // Очищаем поле ввода
    chatInput.value = '';
}

// Получение сообщений от других
socket.on('chat-message', function(data) {
    // Не показываем свои сообщения (уже показали при отправке)
    if (data.author !== 'Вы') {
        addChatMessage(data.author || 'Гость', data.text, false);
    }
});

socket.on('user-joined', async function(userId) {
    console.log('User joined:', userId);
    
    if (!localStream) {
        console.log('Local stream not ready yet, skipping');
        return;
    }
    
    try {
        var pc = new RTCPeerConnection(configuration);
        peerConnections[userId] = pc;
        
        localStream.getTracks().forEach(function(track) {
            pc.addTrack(track, localStream);
        });
        
        pc.ontrack = function(event) {
            addVideoStream(event.streams[0], userId);
        };
        
        pc.onicecandidate = function(event) {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    roomId: currentRoomId,
                    candidate: event.candidate,
                    to: userId
                });
            }
        };
        
        var offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit('offer', {
            roomId: currentRoomId,
            offer: offer,
            to: userId
        });
    } catch (err) {
        console.error('Error in user-joined handler:', err);
    }
});

socket.on('offer', async function(data) {
    console.log('Received offer from:', data.from);
    
    if (!localStream) {
        console.log('Local stream not ready for offer');
        return;
    }
    
    try {
        var pc = new RTCPeerConnection(configuration);
        peerConnections[data.from] = pc;
        
        localStream.getTracks().forEach(function(track) {
            pc.addTrack(track, localStream);
        });
        
        pc.ontrack = function(event) {
            addVideoStream(event.streams[0], data.from);
        };
        
        pc.onicecandidate = function(event) {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    roomId: currentRoomId,
                    candidate: event.candidate,
                    to: data.from
                });
            }
        };
        
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        var answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('answer', {
            roomId: currentRoomId,
            answer: answer,
            to: data.from
        });
    } catch (err) {
        console.error('Error in offer handler:', err);
    }
});

socket.on('answer', async function(data) {
    console.log('Received answer from:', data.from);
    var pc = peerConnections[data.from];
    if (pc) {
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
            console.error('Error setting remote description:', err);
        }
    }
});

socket.on('ice-candidate', async function(data) {
    var pc = peerConnections[data.from];
    if (pc) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
            console.error('Error adding ICE candidate:', err);
        }
    }
});