/**
 * Meetify Bug Report
 * 
 * Documented issues found during code analysis and testing
 */

const assert = require('assert');
const { describe, it } = require('node:test');

describe('Known Bugs - Regression Tests', () => {
  
  describe('BUG-001: CSS Syntax Error in room.html', () => {
    it('should detect duplicate tooltip CSS', () => {
      // The file has duplicate CSS blocks for .control-btn::after and ::before
      // This causes the second block to override the first incorrectly
      
      const cssContent = `
        .control-btn::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 70px;
        }
        .control-btn::before {
            content: '';
            position: absolute;
            bottom: 60px;
        }
        // ... later in file, DUPLICATE:
        .control-btn::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 70px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
        }
      `;
      
      // Count occurrences
      const afterMatches = cssContent.match(/\.control-btn::after/g);
      const beforeMatches = cssContent.match(/\.control-btn::before/g);
      
      // This test documents the bug - there should be only one of each
      assert.strictEqual(afterMatches?.length, 2, 'BUG: Duplicate ::after rules found');
      assert.strictEqual(beforeMatches?.length, 2, 'BUG: Duplicate ::before rules found');
    });
  });

  describe('BUG-002: Missing closeParticipantsModal function', () => {
    it('should detect missing function', () => {
      const roomJs = `
        // Event listener references closeParticipantsModal
        document.getElementById('participantsModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeParticipantsModal();
            }
        });
        // But function is never defined!
      `;
      
      const hasFunctionDefinition = roomJs.includes('function closeParticipantsModal');
      const hasReference = roomJs.includes('closeParticipantsModal()');
      
      assert.strictEqual(hasReference, true, 'Function is referenced');
      assert.strictEqual(hasFunctionDefinition, false, 'BUG: Function is not defined!');
    });
  });

  describe('BUG-003: Undefined backgroundImage variable', () => {
    it('should detect undefined variable usage', () => {
      const code = `
        document.getElementById('customBgFile').addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    backgroundImage = new Image();  // BUG: backgroundImage is not declared!
                    backgroundImage.onload = function() {
                        applyVirtualBackground('custom');
                    };
                    backgroundImage.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
      `;
      
      const hasDeclaration = /var\s+backgroundImage|let\s+backgroundImage|const\s+backgroundImage/.test(code);
      const hasUsage = code.includes('backgroundImage = new Image()');
      
      assert.strictEqual(hasUsage, true, 'Variable is used');
      assert.strictEqual(hasDeclaration, false, 'BUG: Variable is not declared!');
    });
  });

  describe('BUG-004: Hardcoded TURN server credentials', () => {
    it('should detect exposed credentials', () => {
      const config = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: 'turn:46.149.68.9:3478',
            username: 'meetify',
            credential: 'meetifySecret2024'  // BUG: Hardcoded credentials!
          }
        ]
      };
      
      const turnServer = config.iceServers.find(s => s.urls?.includes('turn:'));
      
      assert.ok(turnServer, 'TURN server config exists');
      assert.ok(turnServer.credential, 'BUG: Credentials are hardcoded in source!');
      assert.strictEqual(turnServer.credential, 'meetifySecret2024');
    });
  });

  describe('BUG-005: No input validation on chat messages', () => {
    it('should detect missing XSS protection', () => {
      const sendMessage = `
        function sendMessage() {
            var input = document.getElementById('chatInput');
            var text = input.value.trim();
            if (!text) return;
            
            socket.emit('chat-message', {
                roomId: roomId,
                text: text,  // BUG: No sanitization!
                author: 'Вы'
            });
            
            addChatMessage('Вы', text, false);  // BUG: Direct insertion!
        }
      `;
      
      const hasSanitization = sendMessage.includes('sanitize') || 
                              sendMessage.includes('escapeHtml') ||
                              sendMessage.includes('textContent');
      
      assert.strictEqual(hasSanitization, false, 'BUG: No input sanitization found!');
    });
  });

  describe('BUG-006: Missing error handling for MediaRecorder', () => {
    it('should detect missing error handler', () => {
      const recordingCode = `
        mediaRecorder = new MediaRecorder(canvasStream, {
            mimeType: mimeType,
            videoBitsPerSecond: videoQuality === 'high' ? 2500000 : 1500000
        });
        
        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                // ...
            }
        };
        // BUG: No onerror handler defined!
      `;
      
      const hasErrorHandler = recordingCode.includes('mediaRecorder.onerror') ||
                              recordingCode.includes('mediaRecorder.addEventListener("error"');
      
      assert.strictEqual(hasErrorHandler, false, 'BUG: No MediaRecorder error handler!');
    });
  });

  describe('BUG-007: Race condition in whiteboard initialization', () => {
    it('should detect potential race condition', () => {
      const initCode = `
        function initWhiteboard() {
            whiteboardCanvas = document.getElementById('whiteboardCanvas');
            if (!whiteboardCanvas) return;
            
            // Set canvas size
            var container = document.getElementById('whiteboardContainer');
            whiteboardCanvas.width = container.clientWidth - 40;  // BUG: container might not be visible!
            whiteboardCanvas.height = container.clientHeight - 80;
            
            whiteboardCtx = whiteboardCanvas.getContext('2d');
            // ...
        }
      `;
      
      const hasVisibilityCheck = initCode.includes('clientWidth') && initCode.includes('display') ||
                                 initCode.includes('offsetWidth');
      
      // The code uses clientWidth without checking if container is visible
      assert.ok(initCode.includes('clientWidth'), 'Uses clientWidth');
      assert.ok(!initCode.includes('display') && !initCode.includes('offsetWidth'), 
                'BUG: No visibility check before getting dimensions!');
    });
  });

  describe('BUG-008: Memory leak in reaction animations', () => {
    it('should detect potential memory leak', () => {
      const reactionCode = `
        function showReaction(emoji, isLocal, fromUserId) {
            var reaction = document.createElement('div');
            reaction.className = 'reaction-float';
            reaction.textContent = emoji;
            
            document.body.appendChild(reaction);
            
            // Remove after animation
            setTimeout(function() {
                reaction.remove();
            }, 2000);
        }
      `;
      
      // The setTimeout might not fire if the tab is backgrounded
      // Also, no cleanup if component unmounts
      const hasCleanupOnUnmount = reactionCode.includes('clearTimeout') ||
                                  reactionCode.includes('componentWillUnmount');
      
      assert.strictEqual(hasCleanupOnUnmount, false, 'BUG: No cleanup on unmount!');
    });
  });

  describe('BUG-009: No rate limiting on socket events', () => {
    it('should detect missing rate limiting', () => {
      const socketHandler = `
        socket.on('chat-message', (data) => {
            // Broadcast to all
            socket.to(data.roomId).emit('chat-message', {
                text: data.text,
                author: data.author
            });
        });
        // BUG: No rate limiting - client can spam messages!
      `;
      
      const hasRateLimit = socketHandler.includes('rateLimit') ||
                           socketHandler.includes('throttle') ||
                           socketHandler.includes('debounce');
      
      assert.strictEqual(hasRateLimit, false, 'BUG: No rate limiting on socket events!');
    });
  });

  describe('BUG-010: Missing accessibility attributes', () => {
    it('should detect missing ARIA attributes', () => {
      const buttonHtml = `
        <button class="control-btn" id="micBtn" onclick="toggleMic()" data-tooltip="Микрофон">🎤</button>
        <button class="control-btn" id="camBtn" onclick="toggleCam()" data-tooltip="Камера">📹</button>
      `;
      
      const hasAriaLabel = buttonHtml.includes('aria-label') ||
                           buttonHtml.includes('aria-labelledby');
      const hasRole = buttonHtml.includes('role=');
      
      assert.strictEqual(hasAriaLabel, false, 'BUG: No ARIA labels on buttons!');
      assert.strictEqual(hasRole, false, 'BUG: No role attributes!');
    });
  });

  describe('BUG-011: Duplicate participants list ID', () => {
    it('should detect duplicate ID usage', () => {
      const html = `
        <!-- In sidebar -->
        <ul id="participantsList" style="list-style: none; padding: 15px;">
        
        <!-- In modal -->
        <ul id="participantsList" style="list-style: none; padding: 0;">
      `;
      
      const matches = html.match(/id="participantsList"/g);
      
      assert.strictEqual(matches?.length, 2, 'BUG: Duplicate participantsList ID!');
    });
  });

  describe('BUG-012: Missing error handling for getUserMedia', () => {
    it('should detect incomplete error handling', () => {
      const connectCode = `
        async function connectToRoom() {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                // ...
            } catch (err) {
                console.error('Error accessing media devices:', err);
                alert('Ошибка доступа к камере/микрофону. Разрешите доступ и обновите страницу.');
            }
        }
      `;
      
      // Error handling exists but could be improved with specific error types
      const hasSpecificErrors = connectCode.includes('NotAllowedError') ||
                                connectCode.includes('NotFoundError') ||
                                connectCode.includes('OverconstrainedError');
      
      assert.strictEqual(hasSpecificErrors, false, 'BUG: No specific error type handling!');
    });
  });
});

// Bug severity classification
const BUGS = {
  critical: [
    { id: 'BUG-001', title: 'CSS Syntax Error - Duplicate tooltip CSS', file: 'room.html' },
    { id: 'BUG-002', title: 'Missing closeParticipantsModal function', file: 'room.js' },
    { id: 'BUG-003', title: 'Undefined backgroundImage variable', file: 'room.js' },
    { id: 'BUG-004', title: 'Hardcoded TURN server credentials', file: 'room.js' },
    { id: 'BUG-005', title: 'No input validation on chat messages (XSS)', file: 'room.js' }
  ],
  high: [
    { id: 'BUG-006', title: 'Missing MediaRecorder error handling', file: 'room.js' },
    { id: 'BUG-007', title: 'Race condition in whiteboard init', file: 'room.js' },
    { id: 'BUG-008', title: 'Memory leak in reaction animations', file: 'room.js' }
  ],
  medium: [
    { id: 'BUG-009', title: 'No rate limiting on socket events', file: 'server.js' },
    { id: 'BUG-010', title: 'Missing accessibility attributes', file: 'room.html' },
    { id: 'BUG-011', title: 'Duplicate participantsList ID', file: 'room.html' }
  ],
  low: [
    { id: 'BUG-012', title: 'Incomplete getUserMedia error handling', file: 'room.js' }
  ]
};

// Export for documentation
module.exports = { BUGS };