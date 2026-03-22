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
var isRecording = false;
var mediaRecorder = null;
var recordedChunks = [];

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

// Оповещения о записи
socket.on('recording-started', function(data) {
    addChatMessage('Система', '🔴 ' + (data.by || 'Кто-то') + ' начал запись встречи', true);
    showNotification('Запись началась', 'Встреча записывается');
});

socket.on('recording-stopped', function(data) {
    addChatMessage('Система', '⏹️ Запись остановлена', true);
    showNotification('Запись остановлена', 'Видео сохранено');
});

// Всплывающее уведомление
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: body });
    }
}

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

// ==================== ЗАПИСЬ ВСТРЕЧИ ====================

async function toggleRecording() {
    var recordBtn = document.getElementById('recordBtn');
    
    if (isRecording) {
        // Останавливаем запись
        stopRecording();
        recordBtn.textContent = '⏺️';
        recordBtn.classList.remove('muted');
        isRecording = false;
    } else {
        // Начинаем запись
        try {
            if (!localStream) {
                alert('Сначала включите камеру');
                return;
            }
            
            recordedChunks = [];
            
            // Создаем Canvas для объединения видео
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = 1280;
            canvas.height = 720;
            
            // Захватываем canvas как поток
            var canvasStream = canvas.captureStream(30);
            
            // Добавляем аудио из localStream
            localStream.getAudioTracks().forEach(function(track) {
                canvasStream.addTrack(track);
            });
            
            // Создаем MediaRecorder
            mediaRecorder = new MediaRecorder(canvasStream, {
                mimeType: 'video/webm;codecs=vp9,opus'
            });
            
            mediaRecorder.ondataavailable = function(event) {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = function() {
                saveRecording();
            };
            
            // Рисуем видео на canvas
            var localVideo = document.getElementById('video-local');
            function drawFrame() {
                if (!isRecording) return;
                
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Рисуем локальное видео
                if (localVideo && localVideo.readyState >= 2) {
                    ctx.drawImage(localVideo, 0, 0, canvas.width / 2, canvas.height / 2);
                }
                
                // Рисуем удаленные видео
                var remoteVideos = document.querySelectorAll('video:not(#video-local)');
                remoteVideos.forEach(function(video, index) {
                    if (video.readyState >= 2) {
                        var x = (index % 2) * (canvas.width / 2);
                        var y = Math.floor(index / 2) * (canvas.height / 2) + (canvas.height / 2);
                        ctx.drawImage(video, x, y, canvas.width / 2, canvas.height / 2);
                    }
                });
                
                requestAnimationFrame(drawFrame);
            }
            
            mediaRecorder.start(1000); // Собираем данные каждую секунду
            drawFrame();
            
            recordBtn.textContent = '⏹️';
            recordBtn.classList.add('muted');
            isRecording = true;
            
            // Отправляем оповещение всем
            socket.emit('recording-started', { roomId: roomId });
            
            // Запрашиваем разрешение на уведомления
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
            
            addChatMessage('Система', '🔴 Запись началась', true);
            
        } catch (err) {
            console.error('Error starting recording:', err);
            alert('Не удалось начать запись: ' + err.message);
        }
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    isRecording = false;
    
    // Отправляем оповещение всем
    socket.emit('recording-stopped', { roomId: roomId });
    
    addChatMessage('Система', '⏹️ Запись остановлена', true);
}

function saveRecording() {
    if (recordedChunks.length === 0) return;
    
    var blob = new Blob(recordedChunks, { type: 'video/webm' });
    var url = URL.createObjectURL(blob);
    
    var a = document.createElement('a');
    a.href = url;
    a.download = 'meetify-recording-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    recordedChunks = [];
}

// ==================== НАСТРОЙКИ ====================

// Загружаем настройки при старте
var settings = {
    downloadPath: '',
    videoQuality: 'medium'
};

function loadSettings() {
    var saved = localStorage.getItem('meetifySettings');
    if (saved) {
        settings = JSON.parse(saved);
        document.getElementById('downloadPath').value = settings.downloadPath || '';
        document.getElementById('videoQuality').value = settings.videoQuality || 'medium';
    }
}

// Вызываем загрузку настроек
window.addEventListener('load', loadSettings);

function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function saveSettings() {
    settings.downloadPath = document.getElementById('downloadPath').value.trim();
    settings.videoQuality = document.getElementById('videoQuality').value;
    
    localStorage.setItem('meetifySettings', JSON.stringify(settings));
    
    addChatMessage('Система', 'Настройки сохранены', true);
    closeSettings();
}

// Закрытие по клику вне модалки
document.getElementById('settingsModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeSettings();
    }
});
// ==================== ВИРТУАЛЬНЫЙ ФОН С BODYPIX ====================

var virtualBackground = 'none';
var backgroundCanvas = null;
var bgCtx = null;
var backgroundImage = null;
var segmentationInterval = null;
var bodyPixModel = null;
var bgVideoElement = null;

// Предустановленные фоны
var presetBackgrounds = {
    office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&h=720&fit=crop',
    nature: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1280&h=720&fit=crop',
    space: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&h=720&fit=crop',
    books: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1280&h=720&fit=crop'
};

// Загружаем модель BodyPix
async function loadBodyPixModel() {
    if (!bodyPixModel) {
        addChatMessage('Система', 'Загрузка модели виртуального фона...', true);
        try {
            bodyPixModel = await bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 0.5,
                quantBytes: 2
            });
            addChatMessage('Система', 'Модель загружена', true);
        } catch (err) {
            console.error('BodyPix load error:', err);
            addChatMessage('Система', 'Ошибка загрузки модели', true);
        }
    }
    return bodyPixModel;
}

// Загружаем сохранённый фон
function loadVirtualBackground() {
    var saved = localStorage.getItem('meetifyVirtualBg');
    if (saved) {
        virtualBackground = saved;
        var select = document.getElementById('virtualBackground');
        if (select) select.value = saved;
    }
}

// Обработчик изменения фона
document.getElementById('virtualBackground').addEventListener('change', async function(e) {
    var value = e.target.value;
    virtualBackground = value;
    localStorage.setItem('meetifyVirtualBg', value);
    
    if (value === 'custom') {
        document.getElementById('customBgFile').style.display = 'block';
    } else {
        document.getElementById('customBgFile').style.display = 'none';
        if (value !== 'none' && presetBackgrounds[value]) {
            backgroundImage = new Image();
            backgroundImage.crossOrigin = 'anonymous';
            backgroundImage.onload = function() {
                applyVirtualBackground(value);
            };
            backgroundImage.src = presetBackgrounds[value];
        } else {
            applyVirtualBackground(value);
        }
    }
});

// Загрузка своей картинки
document.getElementById('customBgFile').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(event) {
            backgroundImage = new Image();
            backgroundImage.onload = function() {
                applyVirtualBackground('custom');
            };
            backgroundImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Применение виртуального фона
async function applyVirtualBackground(type) {
    if (!localStream) {
        alert('Сначала включите камеру');
        return;
    }
    
    if (segmentationInterval) {
        clearInterval(segmentationInterval);
        segmentationInterval = null;
    }
    


// Применение виртуального фона с реальной сегментацией
async function applyVirtualBackground(type) {
    if (!localStream) {
        alert('Сначала включите камеру');
        return;
    }

    if (segmentationInterval) {
        clearInterval(segmentationInterval);
        segmentationInterval = null;
    }

    var localVideo = document.getElementById('video-local');
    if (!localVideo) return;

    if (type === 'none') {
        localVideo.style.filter = 'none';
        localVideo.srcObject = localStream;
        addChatMessage('Система', 'Виртуальный фон отключён', true);
        return;
    }

    // CSS blur fallback
    if (type === 'blur') {
        localVideo.style.filter = 'blur(12px)';
        addChatMessage('Система', 'Размытие включено (весь кадр)', true);
        return;
    }

    // BodyPix сегментация для фонов с картинками
    try {
        await loadBodyPixModel();
        if (!bodyPixModel) throw new Error('Model not loaded');

        if (!backgroundCanvas) {
            backgroundCanvas = document.createElement('canvas');
            backgroundCanvas.width = 640;
            backgroundCanvas.height = 480;
            bgCtx = backgroundCanvas.getContext('2d');
        }

        if (!bgVideoElement) {
            bgVideoElement = document.createElement('video');
            bgVideoElement.srcObject = localStream;
            bgVideoElement.muted = true;
            bgVideoElement.play();
        }

        if (bgVideoElement.readyState < 2) {
            await new Promise(function(resolve) {
                bgVideoElement.onloadeddata = resolve;
            });
        }

        addChatMessage('Система', 'Обработка фона...', true);

        segmentationInterval = setInterval(async function() {
            if (!bgVideoElement || bgVideoElement.paused) return;

            try {
                var segmentation = await bodyPixModel.segmentPerson(bgVideoElement, {
                    internalResolution: 'low',
                    segmentationThreshold: 0.7
                });

                // Рисуем фон
                bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

                if (backgroundImage) {
                    bgCtx.drawImage(backgroundImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
                } else {
                    bgCtx.filter = 'blur(15px)';
                    bgCtx.drawImage(bgVideoElement, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
                    bgCtx.filter = 'none';
                }

                // Получаем данные
                var bgData = bgCtx.getImageData(0, 0, backgroundCanvas.width, backgroundCanvas.height);

                // Создаём временный canvas для видео
                var tempCanvas = document.createElement('canvas');
                tempCanvas.width = backgroundCanvas.width;
                tempCanvas.height = backgroundCanvas.height;
                var tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(bgVideoElement, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
                var videoData = tempCtx.getImageData(0, 0, backgroundCanvas.width, backgroundCanvas.height);

                // Применяем маску: человек = видео, фон = картинка/размытие
                for (var i = 0; i < segmentation.data.length; i++) {
                    var idx = i * 4;
                    if (segmentation.data[i] === 1) {
                        // Человек - берём из видео
                        bgData.data[idx] = videoData.data[idx];
                        bgData.data[idx + 1] = videoData.data[idx + 1];
                        bgData.data[idx + 2] = videoData.data[idx + 2];
                        bgData.data[idx + 3] = videoData.data[idx + 3];
                    }
                }

                bgCtx.putImageData(bgData, 0, 0);

                // Обновляем видео
                if (backgroundCanvas.captureStream) {
                    var stream = backgroundCanvas.captureStream(30);
                    localStream.getAudioTracks().forEach(function(t) { stream.addTrack(t); });
                    localVideo.srcObject = stream;
                }
            } catch (e) {
                console.error('Frame error:', e);
            }
        }, 150);

        addChatMessage('Система', 'Фон применён: ' + type, true);

    } catch (err) {
        console.error('BG error:', err);
        localVideo.style.filter = 'blur(8px)';
        addChatMessage('Система', 'Ошибка фона, используется размытие', true);
    }
}

// Загружаем фон при старте
window.addEventListener('load', loadVirtualBackground);