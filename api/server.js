const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const rooms = new Map();
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

app.post('/api/rooms', async (req, res) => {
  const roomId = Math.random().toString(36).substring(7);
  
  // Получаем данные из запроса
  const name = req.body.name?.trim() || null;
  const password = req.body.password || null;
  
  // Валидация
  if (name && name.length > 100) {
    return res.status(400).json({ error: 'Name too long' });
  }
  
  // Хешируем пароль если есть
  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }
  
  // Сохраняем комнату
  rooms.set(roomId, {
    name: name,
    password: hashedPassword,
    createdAt: Date.now(),
    owner: req.socket?.id || 'anonymous'
  });
  
  res.json({ 
    roomId, 
    url: `/room/${roomId}`,
    name: name
  });
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

  // Оповещения о записи
  socket.on('recording-started', (data) => {
    socket.to(data.roomId).emit('recording-started', { by: 'Участник' });
  });

  socket.on('recording-stopped', (data) => {
    socket.to(data.roomId).emit('recording-stopped', {});
  });

  // Поднятие руки
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

  // Опросы и голосования
  const roomPolls = new Map(); // roomId -> { pollId, question, options, votes, voters }

  socket.on('create-poll', (data) => {
    const pollId = Date.now().toString();
    const poll = {
      id: pollId,
      question: data.question,
      options: data.options,
      votes: new Array(data.options.length).fill(0),
      voters: new Set(),
      createdBy: socket.id
    };
    roomPolls.set(data.roomId, poll);
    socket.to(data.roomId).emit('poll-created', {
      id: poll.id,
      question: poll.question,
      options: poll.options,
      votes: poll.votes
    });
    socket.emit('poll-created', {
      id: poll.id,
      question: poll.question,
      options: poll.options,
      votes: poll.votes
    });
  });

  socket.on('vote-poll', (data) => {
    const poll = roomPolls.get(data.roomId);
    if (poll && !poll.voters.has(socket.id) && data.optionIndex >= 0 && data.optionIndex < poll.options.length) {
      poll.votes[data.optionIndex]++;
      poll.voters.add(socket.id);
      socket.to(data.roomId).emit('poll-updated', {
        id: poll.id,
        votes: poll.votes
      });
      socket.emit('poll-updated', {
        id: poll.id,
        votes: poll.votes
      });
    }
  });

  socket.on('close-poll', (data) => {
    const poll = roomPolls.get(data.roomId);
    if (poll && poll.createdBy === socket.id) {
      roomPolls.delete(data.roomId);
      socket.to(data.roomId).emit('poll-closed', { id: poll.id });
      socket.emit('poll-closed', { id: poll.id });
    }
  });

  // Whiteboard
  socket.on('whiteboard-draw', (data) => {
    socket.to(data.roomId).emit('whiteboard-draw', data);
  });

  socket.on('whiteboard-clear', (data) => {
    socket.to(data.roomId).emit('whiteboard-clear', {});
  });

  // Reactions
  socket.on('reaction', (data) => {
    socket.to(data.roomId).emit('reaction', { emoji: data.emoji });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Уведомляем всех об отключении
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('user-left', { userId: socket.id });
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Meetify API running on port ${PORT}`);
});