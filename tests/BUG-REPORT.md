# Meetify Bug Report

## Documented Issues

### Critical (P0) - Fix Immediately

#### BUG-001: CSS Syntax Error - Duplicate Tooltip CSS
**File:** `web/room.html`  
**Description:** The CSS for `.control-btn::after` and `.control-btn::before` is defined twice, causing the second block to override the first incorrectly.  
**Impact:** Tooltip positioning may be inconsistent.  
**Fix:** Remove duplicate CSS block around line 350-370.

#### BUG-002: Missing Function Definition
**File:** `web/room.js`  
**Description:** `closeParticipantsModal()` is referenced in an event listener but never defined.  
**Impact:** Clicking outside the participants modal throws an error.  
**Fix:** Add the missing function:
```javascript
function closeParticipantsModal() {
    document.getElementById('participantsModal').classList.remove('active');
}
```

#### BUG-003: Undefined Variable
**File:** `web/room.js`  
**Description:** `backgroundImage` is used without declaration in the custom background file handler.  
**Impact:** May cause ReferenceError when uploading custom background.  
**Fix:** Add variable declaration at the top of the file:
```javascript
var backgroundImage = null;
```

#### BUG-004: Hardcoded Credentials
**File:** `web/room.js`  
**Description:** TURN server credentials are hardcoded in the source code.  
**Impact:** Security vulnerability - credentials exposed in client-side code.  
**Fix:** Move credentials to environment variables or use token-based authentication.

#### BUG-005: XSS Vulnerability
**File:** `web/room.js`  
**Description:** Chat messages are not sanitized before display, allowing potential XSS attacks.  
**Impact:** Malicious users could inject JavaScript.  
**Fix:** Sanitize input using `textContent` instead of `innerHTML`, or use a sanitization library.

### High (P1) - Fix Soon

#### BUG-006: Missing MediaRecorder Error Handler
**File:** `web/room.js`  
**Description:** No `onerror` handler for MediaRecorder API.  
**Impact:** Recording failures are silent.  
**Fix:** Add error handler:
```javascript
mediaRecorder.onerror = function(event) {
    console.error('Recording error:', event);
    addChatMessage('Система', '❌ Ошибка записи', true);
};
```

#### BUG-007: Race Condition in Whiteboard
**File:** `web/room.js`  
**Description:** Whiteboard initialization uses `clientWidth/Height` without checking visibility.  
**Impact:** Canvas may have incorrect dimensions if initialized while hidden.  
**Fix:** Check visibility before getting dimensions or use ResizeObserver.

#### BUG-008: Memory Leak in Reactions
**File:** `web/room.js`  
**Description:** Reaction animations use `setTimeout` without cleanup on unmount.  
**Impact:** Memory leaks if user navigates away during animation.  
**Fix:** Store timeout IDs and clear them when needed.

### Medium (P2) - Fix When Possible

#### BUG-009: No Rate Limiting
**File:** `api/server.js`  
**Description:** Socket events have no rate limiting.  
**Impact:** Users can spam messages, polls, reactions.  
**Fix:** Implement rate limiting middleware for socket events.

#### BUG-010: Missing Accessibility
**File:** `web/room.html`  
**Description:** Buttons lack ARIA labels and roles.  
**Impact:** Poor screen reader support.  
**Fix:** Add `aria-label` attributes to all interactive elements.

#### BUG-011: Duplicate Element ID
**File:** `web/room.html`  
**Description:** `participantsList` ID is used twice (sidebar and modal).  
**Impact:** Invalid HTML, may cause selector issues.  
**Fix:** Use unique IDs: `participantsListSidebar` and `participantsListModal`.

### Low (P3) - Nice to Have

#### BUG-012: Incomplete Error Handling
**File:** `web/room.js`  
**Description:** getUserMedia errors are not handled specifically by type.  
**Impact:** Generic error message for all failures.  
**Fix:** Handle specific error types (NotAllowedError, NotFoundError, etc.).

## Security Checklist

- [ ] Move TURN credentials to server-side
- [ ] Sanitize all user inputs
- [ ] Add Content Security Policy headers
- [ ] Validate all API inputs
- [ ] Add rate limiting
- [ ] Use HTTPS for all connections
- [ ] Implement authentication for sensitive operations

## Performance Issues

1. **Large bundle size** - MediaPipe libraries loaded synchronously
2. **No lazy loading** - All features loaded upfront
3. **Inefficient re-renders** - Participants list updates trigger full re-render
4. **No debouncing** - Whiteboard events sent on every mouse move

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebRTC | ✅ | ✅ | ✅ | ✅ |
| MediaRecorder | ✅ | ✅ | ⚠️ | ✅ |
| Screen Share | ✅ | ✅ | ⚠️ | ✅ |
| Virtual Background | ✅ | ⚠️ | ❌ | ✅ |

⚠️ = Partial support  
❌ = Not supported
