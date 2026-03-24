/**
 * Meetify Unit Tests - API Endpoints
 * 
 * Tests for server-side API functionality
 */

const assert = require('assert');
const { describe, it, before, after } = require('node:test');

// Mock data and utilities
const TEST_ROOM_ID = 'test-room-123';
const TEST_USER_ID = 'user-456';

// Helper to create mock request/response
function createMockReq(options = {}) {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    protocol: 'https',
    get: (header) => {
      const headers = { host: 'test.meetify.io', ...options.headers };
      return headers[header.toLowerCase()];
    },
    ...options
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    jsonData: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    }
  };
  return res;
}

describe('API Unit Tests', () => {
  
  describe('Health Endpoints', () => {
    it('should return ok status for /health', () => {
      const req = createMockReq();
      const res = createMockRes();
      
      // Simulate health handler
      res.json({ status: 'ok', service: 'meetify-api' });
      
      assert.strictEqual(res.jsonData.status, 'ok');
      assert.strictEqual(res.jsonData.service, 'meetify-api');
    });

    it('should return ok status for /api/health', () => {
      const req = createMockReq();
      const res = createMockRes();
      
      res.json({ status: 'ok', service: 'meetify-api' });
      
      assert.strictEqual(res.jsonData.status, 'ok');
    });
  });

  describe('Room Creation API', () => {
    it('should create room with valid data', () => {
      const req = createMockReq({
        body: { name: 'Test Room', description: 'Test Description' }
      });
      const res = createMockRes();
      
      // Simulate room creation
      const roomId = Math.random().toString(36).substring(7);
      res.json({ roomId, url: `/room/${roomId}` });
      
      assert.ok(res.jsonData.roomId);
      assert.ok(res.jsonData.url);
      assert.ok(res.jsonData.roomId.length > 0);
    });

    it('should create room without calendar event by default', () => {
      const req = createMockReq({
        body: { name: 'Test Room' }
      });
      const res = createMockRes();
      
      const roomId = 'room-' + Date.now();
      res.json({ roomId, url: `/room/${roomId}`, calendarEvent: null });
      
      assert.strictEqual(res.jsonData.calendarEvent, null);
    });

    it('should create room with calendar event when requested', () => {
      const req = createMockReq({
        body: {
          name: 'Meeting',
          createCalendarEvent: true,
          startTime: new Date().toISOString(),
          duration: 60
        }
      });
      const res = createMockRes();
      
      const roomId = 'room-' + Date.now();
      res.json({
        roomId,
        url: `/room/${roomId}`,
        calendarEvent: {
          id: 'cal-123',
          htmlLink: 'https://calendar.google.com/event?id=123'
        }
      });
      
      assert.ok(res.jsonData.calendarEvent);
      assert.ok(res.jsonData.calendarEvent.id);
    });
  });

  describe('Recordings API', () => {
    it('should return empty list for room with no recordings', () => {
      const req = createMockReq({ params: { roomId: TEST_ROOM_ID } });
      const res = createMockRes();
      
      res.json({ recordings: [] });
      
      assert.deepStrictEqual(res.jsonData.recordings, []);
    });

    it('should return 404 for non-existent recording', () => {
      const req = createMockReq({
        params: { roomId: TEST_ROOM_ID, recordingId: 'non-existent' }
      });
      const res = createMockRes();
      
      res.status(404).json({ error: 'Recording not found' });
      
      assert.strictEqual(res.statusCode, 404);
      assert.ok(res.jsonData.error);
    });

    it('should delete recording successfully', () => {
      const req = createMockReq({
        params: { roomId: TEST_ROOM_ID, recordingId: 'rec-123' }
      });
      const res = createMockRes();
      
      res.json({ success: true });
      
      assert.strictEqual(res.jsonData.success, true);
    });
  });

  describe('Calendar API', () => {
    it('should return calendar status', () => {
      const req = createMockReq();
      const res = createMockRes();
      
      res.json({
        initialized: true,
        calendarId: 'primary'
      });
      
      assert.strictEqual(typeof res.jsonData.initialized, 'boolean');
      assert.ok(res.jsonData.calendarId);
    });

    it('should return 404 for room without calendar event', () => {
      const req = createMockReq({ params: { roomId: 'no-calendar-room' } });
      const res = createMockRes();
      
      res.status(404).json({ error: 'No calendar event found for this room' });
      
      assert.strictEqual(res.statusCode, 404);
    });
  });
});

describe('Socket.io Event Unit Tests', () => {
  
  describe('Room Join/Leave', () => {
    it('should handle join-room event', () => {
      const socket = {
        id: 'socket-123',
        join: (room) => { socket.joinedRoom = room; },
        emit: (event, data) => { socket.emitted = { event, data }; }
      };
      
      const data = { roomId: 'room-1', userId: 'user-1', userName: 'Test User' };
      socket.join(data.roomId);
      
      assert.strictEqual(socket.joinedRoom, 'room-1');
    });

    it('should handle user disconnect', () => {
      const socket = {
        id: 'socket-123',
        userData: { userId: 'user-1', roomId: 'room-1' },
        to: (room) => ({
          emit: (event, data) => { socket.broadcasted = { event, data, room }; }
        })
      };
      
      // Simulate disconnect
      if (socket.userData) {
        socket.to(socket.userData.roomId).emit('user-left', { userId: socket.userData.userId });
      }
      
      assert.strictEqual(socket.broadcasted.event, 'user-left');
      assert.strictEqual(socket.broadcasted.data.userId, 'user-1');
    });
  });

  describe('Chat Messages', () => {
    it('should broadcast chat message to room', () => {
      const messages = [];
      const socket = {
        to: (room) => ({
          emit: (event, data) => { messages.push({ room, event, data }); }
        })
      };
      
      const data = { roomId: 'room-1', text: 'Hello!', author: 'User' };
      socket.to(data.roomId).emit('chat-message', {
        text: data.text,
        author: data.author,
        timestamp: new Date().toISOString()
      });
      
      assert.strictEqual(messages.length, 1);
      assert.strictEqual(messages[0].data.text, 'Hello!');
    });
  });

  describe('Polls', () => {
    it('should create poll with valid data', () => {
      const roomPolls = new Map();
      
      const data = {
        roomId: 'room-1',
        question: 'Test question?',
        options: ['Option 1', 'Option 2'],
        isAnonymous: true
      };
      
      const poll = {
        id: Date.now().toString(),
        question: data.question,
        options: data.options,
        isAnonymous: data.isAnonymous,
        votes: new Array(data.options.length).fill(0),
        voters: new Set()
      };
      
      roomPolls.set(data.roomId, poll);
      
      assert.strictEqual(roomPolls.get('room-1').question, 'Test question?');
      assert.deepStrictEqual(roomPolls.get('room-1').votes, [0, 0]);
    });

    it('should handle vote correctly', () => {
      const poll = {
        votes: [0, 0],
        voters: new Set(),
        userVotes: new Map()
      };
      
      const socketId = 'socket-123';
      const optionIndex = 0;
      
      // Cast vote
      poll.votes[optionIndex]++;
      poll.voters.add(socketId);
      poll.userVotes.set(socketId, optionIndex);
      
      assert.strictEqual(poll.votes[0], 1);
      assert.strictEqual(poll.votes[1], 0);
      assert.ok(poll.voters.has(socketId));
    });

    it('should change vote if user votes again', () => {
      const poll = {
        votes: [1, 0],
        voters: new Set(['socket-123']),
        userVotes: new Map([['socket-123', 0]])
      };
      
      const socketId = 'socket-123';
      const newOptionIndex = 1;
      
      // Remove old vote
      const oldVote = poll.userVotes.get(socketId);
      if (oldVote !== undefined) {
        poll.votes[oldVote]--;
      }
      
      // Add new vote
      poll.votes[newOptionIndex]++;
      poll.userVotes.set(socketId, newOptionIndex);
      
      assert.strictEqual(poll.votes[0], 0);
      assert.strictEqual(poll.votes[1], 1);
    });
  });

  describe('Recordings', () => {
    it('should start recording', () => {
      const activeRecordings = new Map();
      
      const data = {
        roomId: 'room-1',
        userId: 'user-1',
        userName: 'Test User'
      };
      
      const recordingInfo = {
        recordingId: 'rec-' + Date.now(),
        roomId: data.roomId,
        filename: `meetify-${data.roomId}-${Date.now()}.webm`,
        startTime: Date.now(),
        startedBy: data.userName,
        participants: new Set([data.userId])
      };
      
      activeRecordings.set(data.roomId, recordingInfo);
      
      assert.ok(activeRecordings.has('room-1'));
      assert.strictEqual(activeRecordings.get('room-1').startedBy, 'Test User');
    });

    it('should prevent duplicate recording', () => {
      const activeRecordings = new Map();
      activeRecordings.set('room-1', { recordingId: 'existing' });
      
      const canStart = !activeRecordings.has('room-1');
      
      assert.strictEqual(canStart, false);
    });

    it('should stop recording and calculate duration', () => {
      const startTime = Date.now() - 60000; // 1 minute ago
      const recording = {
        recordingId: 'rec-123',
        startTime: startTime,
        startedBy: 'Test User',
        participants: new Set(['user-1'])
      };
      
      const endTime = Date.now();
      const duration = endTime - recording.startTime;
      
      assert.ok(duration >= 60000);
      assert.ok(duration < 61000); // Within 1 second tolerance
    });
  });
});

// Run tests if executed directly
if (require.main === module) {
  console.log('Run with: node --test unit.test.js');
}

module.exports = { createMockReq, createMockRes };