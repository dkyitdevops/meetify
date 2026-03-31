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
var gradients = ['gradient-1', 'gradient-2', 'gradient-3'];

function updateParticipantsList() {
    var list = document.getElementById('participantsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    participants.forEach(function(p, i) {
        var li = document.createElement('li');
        li.className = 'participant-item' + (p.id === 'local' ? ' you' : '');
        var initials = (p.name || 'У').charAt(0).toUpperCase();
        var gradClass = gradients[i % gradients.length];
        var handIcon = p.handRaised ? ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>' : '';
        li.innerHTML = '<div class="participant-avatar ' + gradClass + '">' + initials + '</div>' +
            '<div class="participant-info">' +
            '<div class="participant-name">' + (p.name || 'Участник') + (p.id === 'local' ? '<span class="you-tag"> — вы</span>' : '') + handIcon + '</div>' +
            '<div class="participant-status">' + (p.id === 'local' ? 'Организатор' : 'Участник') + '</div>' +
            '</div>' +
            '<div class="participant-mic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg></div>';
        list.appendChild(li);
    });
    
    // Update badge
    var badge = document.getElementById('participantCount');
    if (badge) badge.textContent = participants.length;
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
        emoji: emoji,
        from: window.localUserName || 'Участник'
    });
    
    // Закрываем панель
    toggleReactions();
}

function showReaction(emoji, isLocal, fromName) {
    var reaction = document.createElement('div');
    reaction.className = 'reaction-float';
    reaction.innerHTML = emoji + (fromName && !isLocal ? '<span class="reaction-name">' + fromName + '</span>' : '');
    
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
    showReaction(data.emoji, false, data.from);
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

// Слушаем событие завершения prejoin от room.html
document.addEventListener('prejoinComplete', (event) => {
    const { camera, microphone, name } = event.detail;
    
    // Сохраняем имя пользователя
    window.localUserName = name || 'Гость';
    
    console.log('[Meetify] prejoinComplete received, connecting...', { camera, microphone, name });
    
    // Теперь вызываем connectToRoom с настройками
    connectToRoom({
        camera: camera,
        microphone: microphone
    });
});

async function connectToRoom(settings = {}) {
    const { camera = true, microphone = true } = settings;
    
    try {
        // Проверяем, есть ли уже поток из prejoin
        if (window.prejoinSettings && window.prejoinSettings.stream) {
            // Используем существующий поток
            localStream = window.prejoinSettings.stream;
            
            // Применяем настройки камеры
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = camera;
            });
            isCamEnabled = camera;
            
            // Применяем настройки микрофона
            const audioTracks = localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = microphone;
            });
            isMicEnabled = microphone;
        } else {
            // Запрашиваем доступ к камере и микрофону только если нужно
            const constraints = {
                video: camera,
                audio: microphone
            };
            
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            isCamEnabled = camera;
            isMicEnabled = microphone;
        }
        
        // Показываем локальное видео
        addVideoStream(localStream, 'local', true);
        
        // Устанавливаем grid layout
        if (typeof updateVideoGrid === 'function') updateVideoGrid();
        
        // Обновляем UI кнопок в соответствии с настройками
        var micBtn = document.getElementById('micBtn');
        var camBtn = document.getElementById('camBtn');
        
        if (micBtn) {
            micBtn.classList.toggle('muted', !isMicEnabled);
        }
        
        if (camBtn) {
            camBtn.classList.toggle('muted', !isCamEnabled);
        }
        
        // Скрываем экран подключения
        document.getElementById('connectingScreen').classList.add('hidden');
        
        // Подключаемся к комнате
        socket.emit('join-room', roomId);
        
        console.log('[Meetify] join-room emitted:', roomId);
        
        // Добавляем системное сообщение
        addChatMessage('Система', 'Вы присоединились к комнате', true);
        
    } catch (err) {
        console.error('Error accessing media devices:', err);
        // Скрываем экран подключения при ошибке
        document.getElementById('connectingScreen').style.display = 'none';
        alert('Ошибка доступа к камере/микрофону. Разрешите доступ и обновите страницу.');
    }
}


// Dynamic video grid layout (Zoom-style)
function updateVideoGrid() {
    var container = document.getElementById('videos');
    if (!container) return;
    var children = container.children;
    var count = children.length;
    
    // Reset styles
    container.style.gridTemplateColumns = '';
    container.style.gridTemplateRows = '';
    
    if (count <= 1) {
        // 1 video: full screen
        container.style.gridTemplateColumns = '1fr';
    } else if (count === 2) {
        // 2 videos: side by side
        container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (count <= 4) {
        // 3-4: 2x2
        container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (count <= 6) {
        // 5-6: 3x2
        container.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else if (count <= 9) {
        // 7-9: 3x3
        container.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else {
        // 10+: 4 columns
        container.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
}

// Override addVideoStream to update grid
var _origAddVideoStream = typeof addVideoStream === 'function' ? addVideoStream : null;

// Patch addVideoStream to call updateVideoGrid
var _origAddVideoStream = addVideoStream;
addVideoStream = function(stream, userId, isLocal) {
    var result = _origAddVideoStream(stream, userId, isLocal);
    setTimeout(updateVideoGrid, 50);
    return result;
};

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

// Подтверждение подключения к комнате
socket.on('joined-room', function(joinedRoomId) {
    console.log('[Meetify] Successfully joined room:', joinedRoomId);
});

socket.on('user-joined', async function(userId) {
    console.log('[Meetify] user-joined:', userId);
    console.log('User joined:', userId);
    addChatMessage('Система', 'Новый участник присоединился', true);
    
    // Добавляем в список участников
    addParticipant(userId, 'Участник ' + userId.substr(0, 6));
    
    // Ждём локальный поток если ещё не готов
    var waitStream = function(attempt) {
        return new Promise(function(resolve) {
            if (localStream) { resolve(); return; }
            if (attempt > 20) { console.error('[Meetify] Timeout waiting for localStream'); resolve(); return; }
            setTimeout(function() { waitStream(attempt + 1).then(resolve); }, 500);
        });
    };
    
    await waitStream(0);
    
    if (!localStream) {
        console.log('Local stream not available');
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
    if (!localStream) {
        console.log('[Meetify] offer received but no localStream, waiting...');
        var waitStream = function(attempt) {
            return new Promise(function(resolve) {
                if (localStream) { resolve(); return; }
                if (attempt > 20) { resolve(); return; }
                setTimeout(function() { waitStream(attempt + 1).then(resolve); }, 500);
            });
        };
        await waitStream(0);
    }
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
    
    // Обновляем сетку
    if (typeof updateVideoGrid === 'function') updateVideoGrid();
    
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
// ==================== AI-СЕГМЕНТАЦИЯ ФОНА ====================

var selfieSegmentation = null;
var segmentationActive = false;
var segAnimationId = null;
var segCanvas = null;
var segCtx = null;

// Predefined background images
var backgroundPresets = {
    office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&h=720&fit=crop',
    nature: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop',
    space: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&h=720&fit=crop',
    books: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1280&h=720&fit=crop'
};

// Load background presets
function loadBackgroundPreset(url) {
    return new Promise((resolve, reject) => {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// Initialize MediaPipe Selfie Segmentation
async function initSegmentation() {
    if (selfieSegmentation || typeof SelfieSegmentation === 'undefined') return;
    
    try {
        selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465748/${file}`;
            }
        });
        
        selfieSegmentation.setOptions({
            modelSelection: 1,
            selfieMode: false
        });
        
        console.log('[Meetify] MediaPipe initialized');
    } catch (e) {
        console.error('[Meetify] MediaPipe init failed:', e);
    }
}

// Применение виртуального фона с AI-сегментацией
async function applyVirtualBackground(type) {
    if (!localStream) {
        alert('Сначала включите камеру');
        return;
    }
    
    // Stop previous processing
    if (segAnimationId) {
        cancelAnimationFrame(segAnimationId);
        segAnimationId = null;
    }
    segmentationActive = false;
    
    var localVideo = document.getElementById('video-local');
    if (!localVideo) return;
    
    // Remove CSS filters
    localVideo.style.filter = 'none';
    
    if (type === 'none') {
        // Return to original stream
        localVideo.srcObject = localStream;
        if (segCanvas) segCanvas.style.display = 'none';
        localVideo.style.display = 'block';
        addChatMessage('Система', 'Виртуальный фон отключён', true);
        return;
    }
    
    // Initialize MediaPipe
    await initSegmentation();
    if (!selfieSegmentation) {
        addChatMessage('Система', 'Ошибка: MediaPipe не загружен', true);
        return;
    }
    
    // Create output canvas
    if (!segCanvas) {
        segCanvas = document.createElement('canvas');
        segCanvas.id = 'segmentationCanvas';
        segCanvas.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:12px;';
        localVideo.parentNode.insertBefore(segCanvas, localVideo.nextSibling);
    }
    
    segCanvas.style.display = 'block';
    localVideo.style.display = 'none';
    segCtx = segCanvas.getContext('2d');
    
    // Load background image
    var bgImg = null;
    if (type === 'custom' && backgroundImage) {
        bgImg = backgroundImage;
    } else if (backgroundPresets[type]) {
        try {
            bgImg = await loadBackgroundPreset(backgroundPresets[type]);
        } catch (e) {
            console.error('[Meetify] Failed to load background:', e);
        }
    }
    
    // Setup MediaPipe results handler
    selfieSegmentation.onResults(function(results) {
        if (!segCanvas || !segCtx) return;
        
        var w = segCanvas.width = localVideo.videoWidth || 640;
        var h = segCanvas.height = localVideo.videoHeight || 480;
        
        segCtx.clearRect(0, 0, w, h);
        
        var mask = results.segmentationMask;
        
        if (type === 'blur') {
            // Draw blurred background
            segCtx.filter = 'blur(20px)';
            segCtx.drawImage(results.image, 0, 0, w, h);
            segCtx.filter = 'none';
            
            // Composite sharp person on top using mask
            segCtx.globalCompositeOperation = 'destination-in';
            segCtx.drawImage(mask, 0, 0, w, h);
            segCtx.globalCompositeOperation = 'source-over';
            
            segCtx.drawImage(results.image, 0, 0, w, h);
        } else if (bgImg) {
            // Draw background image
            segCtx.drawImage(bgImg, 0, 0, w, h);
            
            // Cut out person shape from background
            segCtx.globalCompositeOperation = 'destination-out';
            segCtx.drawImage(mask, 0, 0, w, h);
            segCtx.globalCompositeOperation = 'source-over';
            
            // Draw person on top
            segCtx.drawImage(results.image, 0, 0, w, h);
        } else {
            // Fallback: just show video
            segCtx.drawImage(results.image, 0, 0, w, h);
        }
    });
    
    // Start processing loop
    segmentationActive = true;
    async function processFrame() {
        if (!segmentationActive || !selfieSegmentation) return;
        
        if (localVideo.readyState >= 2) {
            await selfieSegmentation.send({ image: localVideo });
        }
        
        segAnimationId = requestAnimationFrame(processFrame);
    }
    processFrame();
    
    addChatMessage('Система', 'Виртуальный фон "' + type + '" включён', true);
}

// ==================== ПОДНЯТИЕ РУКИ ====================

function toggleRaiseHand() {
    var btn = document.getElementById('raiseHandBtn');
    isHandRaised = !isHandRaised;
    
    if (isHandRaised) {
        btn.classList.add('muted');
        socket.emit('raise-hand', { roomId: roomId, userId: socket.id, name: window.localUserName || 'Участник' });
        addChatMessage('Система', 'Вы подняли руку', true);
        showHandRaisedIcon(socket.id);
        // Update local participant hand status
        var me = participants.find(function(p) { return p.id === 'local'; });
        if (me) { me.handRaised = true; updateParticipantsList(); }
    } else {
        btn.classList.remove('muted');
        socket.emit('lower-hand', { roomId: roomId, userId: socket.id, name: window.localUserName || 'Участник' });
        addChatMessage('Система', 'Вы опустили руку', true);
        hideHandRaisedIcon(socket.id);
        var me = participants.find(function(p) { return p.id === 'local'; });
        if (me) { me.handRaised = false; updateParticipantsList(); }
    }
}

// Получение уведомлений о поднятых руках
socket.on('hand-raised', function(data) {
    addChatMessage('Система', (data.name || 'Участник') + ' поднял(а) руку', true);
    showNotification('Поднята рука', (data.name || 'Участник') + ' хочет выступить');
    
    // Показываем иконку на видео
    showHandRaisedIcon(data.userId);
    
    // Обновляем статус руки в списке участников
    var p = participants.find(function(x) { return x.id === data.userId; });
    if (p) { p.handRaised = true; updateParticipantsList(); }
});

socket.on('hand-lowered', function(data) {
    addChatMessage('Система', (data.name || 'Участник') + ' опустил(а) руку', true);
    
    // Скрываем иконку
    hideHandRaisedIcon(data.userId);
    
    // Обновляем статус руки в списке участников
    var p = participants.find(function(x) { return x.id === data.userId; });
    if (p) { p.handRaised = false; updateParticipantsList(); }
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