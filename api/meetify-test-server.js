// meetify-test-server.js — простой сервер для тестирования Meetify
// Запускать из папки api: node meetify-test-server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Раздаём статические файлы из папки web (относительно корня проекта)
const webPath = path.join(__dirname, '..', 'web');
console.log('[Meetify] Serving static files from:', webPath);
app.use(express.static(webPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'meetify-test' });
});

// Socket.io для signaling
io.on('connection', (socket) => {
  console.log('[Meetify] User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
    socket.emit('joined-room', roomId);
    console.log('[Meetify] User joined room:', roomId);
  });

  socket.on('chat-message', (data) => {
    socket.to(data.roomId).emit('chat-message', {
      text: data.text,
      author: data.author || 'Гость',
      timestamp: new Date().toISOString()
    });
  });

  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data);
  });

  socket.on('whiteboard-draw', (data) => {
    socket.to(data.roomId).emit('whiteboard-draw', data);
  });

  socket.on('recording-started', (data) => {
    socket.to(data.roomId).emit('recording-started', { by: 'Участник' });
  });

  socket.on('recording-stopped', (data) => {
    socket.to(data.roomId).emit('recording-stopped', {});
  });

  socket.on('raise-hand', (data) => {
    socket.to(data.roomId).emit('hand-raised', {
      name: 'Участник',
      userId: data.userId
    });
  });

  socket.on('lower-hand', (data) => {
    socket.to(data.roomId).emit('hand-lowered', {
      name: 'Участник',
      userId: data.userId
    });
  });

  socket.on('disconnect', () => {
    console.log('[Meetify] User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Meetify test server running on port ${PORT}`);
});

module.exports = { app, server, io };
