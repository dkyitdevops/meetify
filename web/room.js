// Получаем ID комнаты из URL
var urlParams = new URLSearchParams(window.location.search);
var roomId = urlParams.get('id');

if (!roomId) {
    alert('ID комнаты не указан');
    window.location.href = '/';
}

// Отображаем ID комнаты
document.getElementById('roomIdDisplay').textContent = roomId;

// Глобальные переменные
var socket = io();
var localStream = null;
var screenStream = null;
var peerConnections = {};
var isMicEnabled = true;
var isCamEnabled = true;
var isScreenSharing = false;

// TURN сервер конфигурация
var configuration = {
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

// Подключаемся при загрузке страницы
window.onload = function() {
    connectToRoom();
};

async function connectToRoom() {
    try {
        // Получаем доступ к камере и микрофону
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        // Показываем локальное видео
        addVideoStream(localStream, 'local', true);
        
        // Скрываем экран подключения
        document.getElementById('connectingScreen').classList.add('hidden');
        
        // Подключаемся к комнате
        socket.emit('join-room', roomId);
        
        // Добавляем системное сообщение
        addChatMessage('Система', 'Вы присоединились к комнате', true);
        
    } catch (err) {
        console.error('Error accessing media devices:', err);
        alert('Ошибка доступа к камере/микрофону. Разрешите доступ и обновите страницу.');
    }
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
        video.muted = isLocal; // Mute local video to prevent echo
        videosContainer.appendChild(video);
    }
    
    video.srcObject = stream;
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
    micBtn.textContent = isMicEnabled ? '🎤' : '🎤❌';
    micBtn.classList.toggle('muted', !isMicEnabled);
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
    camBtn.textContent = isCamEnabled ? '📹' : '📹❌';
    camBtn.classList.toggle('muted', !isCamEnabled);
}

// Выход из комнаты
function leaveRoom() {
    if (localStream) {
        localStream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
    
    Object.keys(peerConnections).forEach(function(userId) {
        peerConnections[userId].close();
    });
    
    socket.disconnect();
    window.location.href = '/';
}

// Копирование ID комнаты
function copyRoomId() {
    navigator.clipboard.writeText(roomId).then(function() {
        alert('ID комнаты скопирован: ' + roomId);
    });
}

// Чат
function addChatMessage(author, text, isSystem) {
    var chatMessages = document.getElementById('chatMessages');
    
    var messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message' + (isSystem ? ' system' : '');
    
    var authorDiv = document.createElement('div');
    authorDiv.className = 'author';
    authorDiv.textContent = author;
    
    var textDiv = document.createElement('div');
    textDiv.className = 'text';
    textDiv.textContent = text;
    
    messageDiv.appendChild(authorDiv);
    messageDiv.appendChild(textDiv);
    chatMessages.appendChild(messageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    var input = document.getElementById('chatInput');
    var text = input.value.trim();
    
    if (!text) return;
    
    socket.emit('chat-message', {
        roomId: roomId,
        text: text,
        author: 'Вы'
    });
    
    addChatMessage('Вы', text, false);
    input.value = '';
}

// Enter для отправки сообщения
document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});

// Socket.io обработчики
socket.on('user-joined', async function(userId) {
    console.log('User joined:', userId);
    addChatMessage('Система', 'Новый участник присоединился', true);
    
    if (!localStream) return;
    
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
                    roomId: roomId,
                    candidate: event.candidate,
                    to: userId
                });
            }
        };
        
        var offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit('offer', {
            roomId: roomId,
            offer: offer,
            to: userId
        });
    } catch (err) {
        console.error('Error in user-joined:', err);
    }
});

socket.on('offer', async function(data) {
    if (!localStream) return;
    
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
                    roomId: roomId,
                    candidate: event.candidate,
                    to: data.from
                });
            }
        };
        
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        var answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('answer', {
            roomId: roomId,
            answer: answer,
            to: data.from
        });
    } catch (err) {
        console.error('Error in offer:', err);
    }
});

socket.on('answer', async function(data) {
    var pc = peerConnections[data.from];
    if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

socket.on('ice-candidate', async function(data) {
    var pc = peerConnections[data.from];
    if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

socket.on('chat-message', function(data) {
    if (data.author !== 'Вы') {
        addChatMessage(data.author || 'Гость', data.text, false);
    }
});

// ==================== ДЕМОНСТРАЦИЯ ЭКРАНА ====================

async function toggleScreenShare() {
    var screenBtn = document.getElementById('screenBtn');
    
    if (isScreenSharing) {
        // Останавливаем демонстрацию
        await stopScreenShare();
        screenBtn.textContent = '🖥️';
        screenBtn.classList.remove('muted');
        isScreenSharing = false;
    } else {
        // Начинаем демонстрацию
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: false
            });
            
            // Заменяем видео-трек во всех peer connections
            Object.keys(peerConnections).forEach(function(userId) {
                var pc = peerConnections[userId];
                var sender = pc.getSenders().find(function(s) {
                    return s.track && s.track.kind === 'video';
                });
                
                if (sender) {
                    sender.replaceTrack(screenStream.getVideoTracks()[0]);
                }
            });
            
            // Показываем экран в локальном видео
            var localVideo = document.getElementById('video-local');
            if (localVideo) {
                localVideo.srcObject = screenStream;
            }
            
            // Обработчик остановки демонстрации
            screenStream.getVideoTracks()[0].onended = function() {
                stopScreenShare();
                screenBtn.textContent = '🖥️';
                screenBtn.classList.remove('muted');
                isScreenSharing = false;
            };
            
            screenBtn.textContent = '🛑';
            screenBtn.classList.add('muted');
            isScreenSharing = true;
            
            addChatMessage('Система', 'Демонстрация экрана началась', true);
            
        } catch (err) {
            console.error('Error starting screen share:', err);
            alert('Не удалось начать демонстрацию экрана');
        }
    }
}

async function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(function(track) {
            track.stop();
        });
        screenStream = null;
    }
    
    // Возвращаем камеру
    if (localStream) {
        var videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            Object.keys(peerConnections).forEach(function(userId) {
                var pc = peerConnections[userId];
                var sender = pc.getSenders().find(function(s) {
                    return s.track && s.track.kind === 'video';
                });
                
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });
        }
        
        // Возвращаем локальное видео
        var localVideo = document.getElementById('video-local');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
    }
    
    addChatMessage('Система', 'Демонстрация экрана остановлена', true);
}