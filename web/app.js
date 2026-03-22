// Глобальные переменные
var socket = io(window.location.origin);
var localStream = null;
var peerConnections = {};
var currentRoomId = null;

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
        
        // Только потом подключаемся к сокету
        socket.emit('join-room', roomId);
        
    } catch (err) {
        console.error('Error accessing media devices:', err);
        updateStatus('Ошибка доступа к камере/микрофону. Разрешите доступ и попробуйте снова.', 'error');
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