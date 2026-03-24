# Meetify Test Plan

## Overview
This document outlines the comprehensive test strategy for Meetify - a video conferencing application.

## Test Coverage Areas

### 1. Unit Tests
- **API Endpoints**: Room creation, health checks, recordings
- **Socket Events**: Connection handling, messaging, signaling
- **Utility Functions**: Data formatting, validation

### 2. Integration Tests
- **WebRTC Connection**: Peer-to-peer video/audio streaming
- **Socket.io Communication**: Real-time messaging, polls, reactions
- **API Integration**: Room management, recording storage

### 3. E2E Tests
- **User Flows**: Room creation, joining, leaving
- **Feature Testing**: Chat, whiteboard, polls, screen share
- **Cross-browser Compatibility**: Chrome, Firefox, Safari

## Features to Test

### Core Features
| Feature | Priority | Test Type |
|---------|----------|-----------|
| Room Creation | P0 | E2E, API |
| Video/Audio Streaming | P0 | E2E, Integration |
| Chat Messaging | P0 | E2E, Integration |
| Screen Sharing | P1 | E2E |
| Recording | P1 | E2E, API |

### Collaboration Features
| Feature | Priority | Test Type |
|---------|----------|-----------|
| Whiteboard | P1 | E2E |
| Polls/Voting | P1 | E2E, Integration |
| Reactions | P2 | E2E |
| Raise Hand | P2 | E2E |

### Settings & Configuration
| Feature | Priority | Test Type |
|---------|----------|-----------|
| Virtual Background | P2 | E2E |
| Video Quality | P2 | E2E |
| Download Path | P3 | Unit |

## Test Checklists

### Room Creation
- [ ] Create room via API
- [ ] Create room via UI
- [ ] Room ID generation
- [ ] Calendar integration
- [ ] Room metadata (name, description)

### Video/Audio
- [ ] Camera toggle on/off
- [ ] Microphone toggle on/off
- [ ] Multiple participants video display
- [ ] Video grid layout adjustments
- [ ] Local video highlighting

### Chat
- [ ] Send message
- [ ] Receive message
- [ ] System messages (join/leave)
- [ ] Message history
- [ ] Chat panel toggle

### Whiteboard
- [ ] Open/close whiteboard
- [ ] Drawing with pen
- [ ] Eraser tool
- [ ] Color selection
- [ ] Clear canvas
- [ ] Sync across participants

### Polls
- [ ] Create poll with 2+ options
- [ ] Anonymous voting
- [ ] Public voting with names
- [ ] Vote counting
- [ ] Close poll
- [ ] Results display

### Screen Share
- [ ] Start screen share
- [ ] Stop screen share
- [ ] Auto-stop on stream end
- [ ] Display in video grid

### Recording
- [ ] Start recording
- [ ] Stop recording
- [ ] Recording notifications
- [ ] Download recording
- [ ] Recording list display

### Reactions
- [ ] Open reactions panel
- [ ] Send emoji reaction
- [ ] Animation display
- [ ] Auto-close panel

### Raise Hand
- [ ] Toggle raise hand
- [ ] Icon display on video
- [ ] Participant list update
- [ ] Notification to others

### Settings
- [ ] Open settings modal
- [ ] Change video quality
- [ ] Set download path
- [ ] Save settings to localStorage
- [ ] Virtual background selection

## Known Issues & Bugs

### Critical (P0)
1. **CSS Syntax Error** in room.html - duplicate tooltip CSS blocks
2. **Missing function** `closeParticipantsModal()` referenced but not defined
3. **Undefined variable** `backgroundImage` in virtual background handler

### High (P1)
4. **Hardcoded credentials** in room.js (TURN server credentials exposed)
5. **No input validation** on chat messages (XSS vulnerability)
6. **Missing error handling** for MediaRecorder API

### Medium (P2)
7. **Race condition** in whiteboard initialization
8. **Memory leak** in reaction animations (not cleaned up properly)
9. **No rate limiting** on socket events

### Low (P3)
10. **Missing accessibility** attributes on buttons
11. **No dark mode** persistence
12. **Hardcoded URLs** in share functions

## Test Execution

### Prerequisites
```bash
npm install
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Running Tests
```bash
# All tests
npm test

# Specific suites
npm run test:unit
npm run test:integration
npm run test:e2e

# With coverage
npm run test:coverage
```

## Coverage Goals
- Unit Tests: 80%+
- Integration Tests: 70%+
- E2E Tests: All critical paths covered
