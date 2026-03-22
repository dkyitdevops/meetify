const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'meetify-api' });
});

// API routes
app.get('/api/rooms', (req, res) => {
  res.json({ rooms: [] });
});

app.post('/api/rooms', (req, res) => {
  const roomId = Math.random().toString(36).substring(7);
  res.json({ roomId, url: `/room/${roomId}` });
});

// Socket.io для signaling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
    socket.emit('joined-room', roomId);
  });
  
  // Чат сообщения
  socket.on('chat-message', (data) => {
    // Рассылаем сообщение всем в комнате кроме отправителя
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
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Meetify API running on port ${PORT}`);
});