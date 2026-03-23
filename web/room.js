// Получаем ID комнаты из URL
var urlParams = new URLSearchParams(window.location.search);
var roomId = urlParams.get('id');

if (!roomId) {
    alert('ID комнаты не указан');
    window.location.href = '/';
}

// Отображаем ID комнаты
document.getElementById('roomIdDisplay').textContent = roomId;

// Загружаем данные комнаты из sessionStorage
var roomDataStr = sessionStorage.getItem('room_' + roomId + '_data');
if (roomDataStr) {
    try {
        var roomData = JSON.parse(roomDataStr);
        if (roomData.name) {
            document.getElementById('roomTitle').textContent = roomData.name;
        }
        if (roomData.description) {
            document.getElementById('roomDesc').textContent = roomData.description;
        }
    } catch (e) {
        console.error('Error parsing room data:', e);
    }
}

// Устанавливаем ссылку для приглашения
document.getElementById('inviteLink').value = window.location.href;

// ==================== WHITEBOARD ====================

var isWhiteboardOpen = false;
var whiteboardCanvas = null;
var whiteboardCtx = null;
var isDrawing = false;
var currentTool = 'pen';
var penColor = '#000000';
var penSize = 3;
var lastX = 0;
var lastY = 0;

function initWhiteboard() {
    whiteboardCanvas = document.getElementById('whiteboardCanvas');
    if (!whiteboardCanvas) return;
    
    // Set canvas size
    var container = document.getElementById('whiteboardContainer');
    whiteboardCanvas.width = container.clientWidth - 40;
    whiteboardCanvas.height = container.clientHeight - 80;
    
    whiteboardCtx = whiteboardCanvas.getContext('2d');
    whiteboardCtx.lineCap = 'round';
    whiteboardCtx.lineJoin = 'round';
    
    // Mouse events
    whiteboardCanvas.addEventListener('mousedown', startDrawing);
    whiteboardCanvas.addEventListener('mousemove', draw);
    whiteboardCanvas.addEventListener('mouseup', stopDrawing);
    whiteboardCanvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    whiteboardCanvas.addEventListener('touchstart', handleTouch);
    whiteboardCanvas.addEventListener('touchmove', handleTouch);
    whiteboardCanvas.addEventListener('touchend', stopDrawing);
}

function toggleWhiteboard() {
    var container = document.getElementById('whiteboardContainer');
    var btn = document.getElementById('whiteboardBtn');
    
    isWhiteboardOpen = !isWhiteboardOpen;
    
    if (isWhiteboardOpen) {
        container.classList.add('active');
        btn.classList.add('active');
        if (!whiteboardCanvas) {
            initWhiteboard();
        }
    } else {
        container.classList.remove('active');
        btn.classList.remove('active');
    }
}

function startDrawing(e) {
    isDrawing = true;
    var rect = whiteboardCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;
    
    var rect = whiteboardCanvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    
    whiteboardCtx.beginPath();
    whiteboardCtx.moveTo(lastX, lastY);
    whiteboardCtx.lineTo(x, y);
    
    if (currentTool === 'eraser') {
        whiteboardCtx.strokeStyle = '#ffffff';
        whiteboardCtx.lineWidth = 20;
    } else {
        whiteboardCtx.strokeStyle = penColor;
        whiteboardCtx.lineWidth = penSize;
    }
    
    whiteboardCtx.stroke();
    
    // Send to other users
    socket.emit('whiteboard-draw', {
        roomId: roomId,
        fromX: lastX,
        fromY: lastY,
        toX: x,
        toY: y,
        color: currentTool === 'eraser' ? '#ffffff' : penColor,
        size: currentTool === 'eraser' ? 20 : penSize
    });
    
    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouch(e) {
    e.preventDefault();
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    whiteboardCanvas.dispatchEvent(mouseEvent);
}

function setPenColor(color) {
    penColor = color;
    currentTool = 'pen';
    updateToolButtons();
    
    // Update color buttons
    var colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(color)) {
            btn.classList.add('active');
        }
    });
}

function setTool(tool) {
    currentTool = tool;
    updateToolButtons();
}

function updateToolButtons() {
    var penBtn = document.getElementById('penTool');
    var eraserBtn = document.getElementById('eraserTool');
    
    if (penBtn) {
        penBtn.classList.toggle('active', currentTool === 'pen');
    }
    if (eraserBtn) {
        eraserBtn.classList.toggle('active', currentTool === 'eraser');
    }
}

function clearWhiteboard() {
    if (!whiteboardCtx) return;
    whiteboardCtx.fillStyle = '#ffffff';
    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
    
    socket.emit('whiteboard-clear', { roomId: roomId });
}

// ==================== УПРАВЛЕНИЕ ПАНЕЛЯМИ ====================

var isParticipantsOpen = false;
var isChatOpen = true;

function toggleParticipants() {
    var sidebar = document.getElementById('participantsSidebar');
    var videoSection = document.getElementById('videoSection');
    
    isParticipantsOpen = !isParticipantsOpen;
    
    if (isParticipantsOpen) {
        sidebar.style.display = 'flex';
        videoSection.classList.remove('expanded');
    } else {
        sidebar.style.display = 'none';
        if (!isChatOpen) {
            videoSection.classList.add('expanded');
        }
    }
    
    updateParticipantsList();
}

function toggleChat() {
    var chatSection = document.getElementById('chatSection');
    var videoSection = document.getElementById('videoSection');
    var chatBtn = document.getElementById('chatBtn');
    
    isChatOpen = !isChatOpen;
    
    if (isChatOpen) {
        chatSection.classList.remove('hidden');
        chatBtn.classList.remove('muted');
        videoSection.classList.remove('expanded');
    } else {
        chatSection.classList.add('hidden');
        chatBtn.classList.add('muted');
        if (!isParticipantsOpen) {
            videoSection.classList.add('expanded');
        }
    }
}

// ==================== УЧАСТНИКИ ====================

var participants = [{ id: 'local', name: 'Вы' }];

function updateParticipantsList() {
    var list = document.getElementById('participantsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    participants.forEach(function(p) {
        var li = document.createElement('li');
        li.style.cssText = 'padding: 10px; background: rgba(102, 126, 234, 0.2); border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;';
        li.innerHTML = '<span>🎥</span><span>' + (p.name || 'Участник') + '</span>' + (p.id === 'local' ? ' <small>(Вы)</small>' : '');
        list.appendChild(li);
    });
}

function addParticipant(userId, name) {
    if (!participants.find(function(p) { return p.id === userId; })) {
        participants.push({ id: userId, name: name || 'Участник ' + userId.substr(0, 6) });
        updateParticipantsList();
    }
}

function removeParticipant(userId) {
    participants = participants.filter(function(p) { return p.id !== userId; });
    updateParticipantsList();
}

// Закрытие по клику вне модалки
document.getElementById('participantsModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeParticipantsModal();
    }
});

// ==================== ОПРОСЫ ====================

var currentPoll = null;
var hasVoted = false;

function openPollModal() {
    document.getElementById('pollModal').classList.add('active');
    resetPollForm();
}

function closePollModal() {
    document.getElementById('pollModal').classList.remove('active');
}

function resetPollForm() {
    document.getElementById('pollCreateForm').style.display = 'block';
    document.getElementById('activePoll').style.display = 'none';
    document.getElementById('pollQuestion').value = '';
    document.getElementById('pollOptions').innerHTML = 
        '<input type="text" class="poll-option" placeholder="Вариант 1" maxlength="100">' +
        '<input type="text" class="poll-option" placeholder="Вариант 2" maxlength="100">';
}

function addPollOption() {
    var container = document.getElementById('pollOptions');
    var count = container.getElementsByClassName('poll-option').length;
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'poll-option';
    input.placeholder = 'Вариант ' + (count + 1);
    input.maxLength = 100;
    container.appendChild(input);
}

function createPoll() {
    var question = document.getElementById('pollQuestion').value.trim();
    var optionInputs = document.getElementsByClassName('poll-option');
    var options = [];
    
    for (var i = 0; i < optionInputs.length; i++) {
        var val = optionInputs[i].value.trim();
        if (val) options.push(val);
    }
    
    if (!question) {
        alert('Введите вопрос');
        return;
    }
    
    if (options.length < 2) {
        alert('Добавьте минимум 2 варианта');
        return;
    }
    
    socket.emit('create-poll', {
        roomId: roomId,
        question: question,
        options: options
    });
}

function votePoll(optionIndex) {
    if (hasVoted || !currentPoll) return;
    
    socket.emit('vote-poll', {
        roomId: roomId,
        optionIndex: optionIndex
    });
    
    hasVoted = true;
    
    // Помечаем выбранный вариант
    var buttons = document.getElementById('activePollOptions').getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
        if (i === optionIndex) {
            buttons[i].classList.add('voted');
        }
        buttons[i].disabled = true;
    }
}

function closePoll() {
    socket.emit('close-poll', { roomId: roomId });
}

function showActivePoll(poll) {
    currentPoll = poll;
    hasVoted = false;
    
    document.getElementById('pollCreateForm').style.display = 'none';
    document.getElementById('activePoll').style.display = 'block';
    document.getElementById('activePollQuestion').textContent = poll.question;
    
    var optionsHtml = '';
    for (var i = 0; i < poll.options.length; i++) {
        optionsHtml += '<button class="poll-option-btn" onclick="votePoll(' + i + ')">' + 
            poll.options[i] + '</button>';
    }
    document.getElementById('activePollOptions').innerHTML = optionsHtml;
    document.getElementById('pollResults').style.display = 'none';
}

function updatePollResults(votes) {
    if (!currentPoll) return;
    
    var total = votes.reduce(function(a, b) { return a + b; }, 0);
    var resultsHtml = '';
    
    for (var i = 0; i < currentPoll.options.length; i++) {
        var percent = total > 0 ? Math.round((votes[i] / total) * 100) : 0;
        resultsHtml += 
            '<div class="poll-result-bar">' +
                '<div class="poll-result-fill" style="width: ' + percent + '%;"></div>' +
                '<div class="poll-result-text">' + currentPoll.options[i] + ': ' + votes[i] + ' (' + percent + '%)</div>' +
            '</div>';
    }
    
    document.getElementById('pollResultsContent').innerHTML = resultsHtml;
    document.getElementById('pollResults').style.display = 'block';
}

// ==================== ПРИГЛАШЕНИЯ ====================

function showInviteModal() {
    document.getElementById('inviteModal').classList.add('active');
}

function closeInviteModal() {
    document.getElementById('inviteModal').classList.remove('active');
}

function copyInviteLink() {
    var link = document.getElementById('inviteLink');
    link.select();
    document.execCommand('copy');
    alert('Ссылка скопирована!');
}

function shareTelegram() {
    var text = 'Присоединяйся к видеоконференции в Meetify: ' + window.location.href;
    window.open('https://t.me/share/url?url=' + encodeURIComponent(window.location.href) + '&text=' + encodeURIComponent(text), '_blank');
}

function shareEmail() {
    var subject = 'Приглашение на видеоконференцию Meetify';
    var body = 'Привет!\n\nПриглашаю тебя на видеоконференцию в Meetify.\n\nСсылка: ' + window.location.href + '\n\nID комнаты: ' + roomId;
    window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}

function shareWhatsApp() {
    var text = 'Присоединяйся к видеоконференции в Meetify: ' + window.location.href;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

// Закрытие по клику вне модалки
document.getElementById('inviteModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeInviteModal();
    }
});

// Глобальные переменные
var socket = io();

// Socket events для опросов
socket.on('poll-created', function(data) {
    currentPoll = data;
    hasVoted = false;
    showActivePoll(data);
    addChatMessage('Система', '📊 Новый опрос: ' + data.question, true);
});

socket.on('poll-updated', function(data) {
    updatePollResults(data.votes);
});

socket.on('poll-closed', function(data) {
    currentPoll = null;
    hasVoted = false;
    resetPollForm();
    closePollModal();
    addChatMessage('Система', '📊 Опрос закрыт', true);
});

// Socket events для whiteboard
socket.on('whiteboard-draw', function(data) {
    if (!whiteboardCtx) return;
    
    whiteboardCtx.beginPath();
    whiteboardCtx.moveTo(data.fromX, data.fromY);
    whiteboardCtx.lineTo(data.toX, data.toY);
    whiteboardCtx.strokeStyle = data.color;
    whiteboardCtx.lineWidth = data.size;
    whiteboardCtx.stroke();
});

socket.on('whiteboard-clear', function() {
    if (!whiteboardCtx) return;
    whiteboardCtx.fillStyle = '#ffffff';
    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
});

// ==================== РЕАКЦИИ ====================

var isReactionsOpen = false;

function toggleReactions() {
    var panel = document.getElementById('reactionsPanel');
    var btn = document.getElementById('reactionBtn');
    
    isReactionsOpen = !isReactionsOpen;
    
    if (isReactionsOpen) {
        panel.classList.add('active');
        btn.classList.add('active');
        // Автоматически закрыть через 5 секунд
        setTimeout(function() {
            if (isReactionsOpen) {
                toggleReactions();
            }
        }, 5000);
    } else {
        panel.classList.remove('active');
        btn.classList.remove('active');
    }
}

function sendReaction(emoji) {
    // Показываем у себя
    showReaction(emoji, true);
    
    // Отправляем другим
    socket.emit('reaction', {
        roomId: roomId,
        emoji: emoji
    });
    
    // Закрываем панель
    toggleReactions();
}

function showReaction(emoji, isLocal) {
    var reaction = document.createElement('div');
    reaction.className = 'reaction-float';
    reaction.textContent = emoji;
    
    // Случайная позиция по горизонтали
    var randomX = Math.random() * 60 + 20; // 20% - 80% ширины
    reaction.style.left = randomX + '%';
    reaction.style.bottom = '150px';
    
    if (isLocal) {
        reaction.style.color = '#667eea';
    }
    
    document.body.appendChild(reaction);
    
    // Удаляем после анимации
    setTimeout(function() {
        reaction.remove();
    }, 2000);
}

// Socket events для реакций
socket.on('reaction', function(data) {
    showReaction(data.emoji, false);
});

var localStream = null;
var screenStream = null;
var peerConnections = {};
var isMicEnabled = true;
var isCamEnabled = true;
var isScreenSharing = false;
var isRecording = false;
var isHandRaised = false;
var raisedHands = [];
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
    console.log('Adding video stream for user:', userId);
    var videosContainer = document.getElementById('videos');
    if (!videosContainer) {
        console.error('Videos container not found');
        return;
    }
    
    var wrapper = document.getElementById('wrapper-' + userId);
    
    if (!wrapper) {
        // Создаём wrapper для видео и иконки
        wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';
        wrapper.id = 'wrapper-' + userId;
        
        var video = document.createElement('video');
        video.id = 'video-' + userId;
        video.autoplay = true;
        video.playsInline = true;
        if (isLocal) video.classList.add('local-video');
        video.muted = isLocal;
        
        wrapper.appendChild(video);
        videosContainer.appendChild(wrapper);
        console.log('Created new video element for user:', userId);
    }
    
    var video = document.getElementById('video-' + userId);
    if (video) {
        video.srcObject = stream;
        console.log('Set stream for user:', userId);
    } else {
        console.error('Video element not found for user:', userId);
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
    
    // Добавляем в список участников
    addParticipant(userId, 'Участник ' + userId.substr(0, 6));
    
    if (!localStream) {
        console.log('Local stream not ready yet');
        return;
    }
    
    try {
        // Создаём RTCPeerConnection
        var pc = new RTCPeerConnection(configuration);
        peerConnections[userId] = pc;
        
        // Добавляем свои треки
        localStream.getTracks().forEach(function(track) {
            pc.addTrack(track, localStream);
        });
        
        // Обрабатываем входящие треки
        pc.ontrack = function(event) {
            console.log('Received track from user:', userId);
            if (event.streams && event.streams[0]) {
                addVideoStream(event.streams[0], userId);
            }
        };
        
        // ICE кандидаты
        pc.onicecandidate = function(event) {
            if (event.candidate) {
                console.log('Sending ICE candidate to:', userId);
                socket.emit('ice-candidate', {
                    roomId: roomId,
                    candidate: event.candidate,
                    to: userId
                });
            }
        };
        
        // Создаём offer
        console.log('Creating offer for:', userId);
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

// Обработка отключения участника
socket.on('user-left', function(data) {
    console.log('User left:', data.userId);
    addChatMessage('Система', 'Участник вышел', true);
    
    // Удаляем видео
    var wrapper = document.getElementById('wrapper-' + data.userId);
    if (wrapper) {
        wrapper.remove();
    }
    
    // Закрываем соединение
    if (peerConnections[data.userId]) {
        peerConnections[data.userId].close();
        delete peerConnections[data.userId];
    }
    
    // Удаляем из списка
    removeParticipant(data.userId);
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

// Закрытие по Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSettings();
    }
});

// ==================== ВИРТУАЛЬНЫЙ ФОН ====================

var virtualBackground = 'none';
var backgroundCanvas = null;
var bgCtx = null;
var backgroundImage = null;
var segmentationInterval = null;

// Загружаем сохранённый фон
function loadVirtualBackground() {
    var saved = localStorage.getItem('meetifyVirtualBg');
    if (saved) {
        virtualBackground = saved;
        document.getElementById('virtualBackground').value = saved;
        if (saved !== 'none') {
            applyVirtualBackground(saved);
        }
    }
}

// Обработчик изменения фона
document.getElementById('virtualBackground').addEventListener('change', function(e) {
    var value = e.target.value;
    virtualBackground = value;
    localStorage.setItem('meetifyVirtualBg', value);
    
    if (value === 'custom') {
        document.getElementById('customBgFile').style.display = 'block';
    } else {
        document.getElementById('customBgFile').style.display = 'none';
        applyVirtualBackground(value);
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
function applyVirtualBackground(type) {
    if (!localStream) {
        alert('Сначала включите камеру');
        return;
    }
    
    // Останавливаем предыдущую обработку
    if (segmentationInterval) {
        clearInterval(segmentationInterval);
        segmentationInterval = null;
    }
    
    if (type === 'none') {
        // Возвращаем оригинальный поток
        var localVideo = document.getElementById('video-local');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        addChatMessage('Система', 'Виртуальный фон отключён', true);
        return;
    }
    
    // Для простоты пока только CSS-эффекты
    var localVideo = document.getElementById('video-local');
    if (!localVideo) return;
    
    if (type === 'blur') {
        // Применяем CSS blur
        localVideo.style.filter = 'blur(8px)';
        addChatMessage('Система', 'Размытие фона включено', true);
    } else {
        // Для других фонов пока просто сообщение
        localVideo.style.filter = 'none';
        addChatMessage('Система', 'Фон \"' + type + '\" выбран (в разработке)', true);
    }
}

// ==================== ПОДНЯТИЕ РУКИ ====================

function toggleRaiseHand() {
    var btn = document.getElementById('raiseHandBtn');
    isHandRaised = !isHandRaised;
    
    if (isHandRaised) {
        btn.classList.add('muted');
        socket.emit('raise-hand', { roomId: roomId, userId: 'local' });
        addChatMessage('Система', '✋ Вы подняли руку', true);
        showHandRaisedIcon('local');
    } else {
        btn.classList.remove('muted');
        socket.emit('lower-hand', { roomId: roomId, userId: 'local' });
        addChatMessage('Система', '✋ Вы опустили руку', true);
        hideHandRaisedIcon('local');
    }
}

// Получение уведомлений о поднятых руках
socket.on('hand-raised', function(data) {
    addChatMessage('Система', '✋ ' + (data.name || 'Участник') + ' хочет выступить', true);
    showNotification('Поднята рука', data.name + ' хочет выступить');
    
    // Показываем иконку на видео
    showHandRaisedIcon(data.userId || 'local');
});

socket.on('hand-lowered', function(data) {
    addChatMessage('Система', '✋ ' + (data.name || 'Участник') + ' опустил руку', true);
    
    // Скрываем иконку
    hideHandRaisedIcon(data.userId || 'local');
});

// Показать иконку поднятой руки
function showHandRaisedIcon(userId) {
    var wrapper = document.getElementById('wrapper-' + userId);
    if (!wrapper) return;
    
    // Удаляем старую иконку если есть
    hideHandRaisedIcon(userId);
    
    // Создаём иконку
    var icon = document.createElement('div');
    icon.className = 'hand-raised-icon';
    icon.id = 'hand-icon-' + userId;
    icon.textContent = '✋';
    wrapper.appendChild(icon);
}

// Скрыть иконку поднятой руки
function hideHandRaisedIcon(userId) {
    var icon = document.getElementById('hand-icon-' + userId);
    if (icon) {
        icon.remove();
    }
}

// Загружаем фон при старте
window.addEventListener('load', loadVirtualBackground);