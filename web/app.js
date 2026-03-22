const socket = io();
let localStream;
let peerConnections = {};
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

function updateStatus(text, type) {
    const status = document.getElementById('status');
    status.textContent = text;
    status.className = 'status ' + type;
}

async function createRoom() {
    const roomId = Math.random().toString(36).substring(7);
    document.getElementById('roomId').value = roomId;
    await joinRoom();
}

async function joinRoom() {
    const roomId = document.getElementById('roomId').value;
    if (!roomId) {
        alert('Введите ID комнаты');
        return;
    }
    
    updateStatus('Подключение...', 'connecting');
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        addVideoStream(localStream, 'local', true);
        socket.emit('join-room', roomId);
        updateStatus('Подключено к комнате: ' + roomId, 'connected');
    } catch (err) {
        console.error('Error accessing media devices:', err);
        updateStatus('Ошибка доступа к камере/микрофону', 'error');
    }
}

function addVideoStream(stream, userId, isLocal = false) {
    const videosContainer = document.getElementById('videos');
    let video = document.getElementById('video-' + userId);
    
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

socket.on('user-joined', async (userId) => {
    console.log('User joined:', userId);
    
    const pc = new RTCPeerConnection(configuration);
    peerConnections[userId] = pc;
    
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });
    
    pc.ontrack = (event) => {
        addVideoStream(event.streams[0], userId);
    };
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                roomId: document.getElementById('roomId').value,
                candidate: event.candidate,
                to: userId
            });
        }
    };
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit('offer', {
        roomId: document.getElementById('roomId').value,
        offer: offer,
        to: userId
    });
});

socket.on('offer', async (data) => {
    const pc = new RTCPeerConnection(configuration);
    peerConnections[data.from] = pc;
    
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });
    
    pc.ontrack = (event) => {
        addVideoStream(event.streams[0], data.from);
    };
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                roomId: document.getElementById('roomId').value,
                candidate: event.candidate,
                to: data.from
            });
        }
    };
    
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket.emit('answer', {
        roomId: document.getElementById('roomId').value,
        answer: answer,
        to: data.from
    });
});

socket.on('answer', async (data) => {
    const pc = peerConnections[data.from];
    if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

socket.on('ice-candidate', async (data) => {
    const pc = peerConnections[data.from];
    if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});