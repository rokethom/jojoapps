# 🚀 CHAT REAL-TIME TESTING GUIDE

## ✅ FIXES IMPLEMENTED

### 1. **Backend Changes** (`/backend/chat/views.py`)
- ✅ Added comprehensive logging for debugging
- ✅ Fixed room creation logic for customer-driver pairs
- ✅ Fixed queryset filtering based on user role
- ✅ Added error handling with fallback to support chat

### 2. **Frontend Changes** (Both Driver & Customer)
- ✅ **Message Formatting**: Convert API response to normalized `{text, type, time, name}` format
- ✅ **Message Capture**: Capture text before clearing input field
- ✅ **Error Logging**: Enhanced console logs with HTTP status codes
- ✅ **Fetch Delay**: Added 100ms delay after send to ensure DB save

### 3. **Debug Scripts**
- ✅ `check_chat_config.py` - Verify system configuration
- ✅ `test_chat_api.py` - Test API with JWT authentication
- ✅ `test_chat_debug.py` - Debug database state

---

## 🧪 QUICK START TESTING

### Phase 1: Configuration Check (5 min)
```bash
cd c:\laragon\www\jojangocms2\backend
python manage.py shell < check_chat_config.py
```

**Expected Output:**
```
✓ Customers: 2
✓ Drivers: 2
✓ ChatRoom count: 0 (OK if fresh)
✓ Authenticated request status: 200
✓ Both filters working!
✅ CONFIGURATION CHECK COMPLETE
```

### Phase 2: API Test (5 min)
```bash
cd c:\laragon\www\jojangocms2\backend
python manage.py shell < test_chat_api.py
```

**Expected Output:**
```
1️⃣ Customer sends message to driver...
   Status: 201
   ✅ Message created

2️⃣ Driver retrieves messages...
   Status: 200
   Messages count: 1
   - [customer] Hello from customer!

3️⃣ Driver sends message to customer...
   Status: 201
   ✅ Message created

4️⃣ Customer retrieves all messages...
   Status: 200
   Messages count: 2
   ✅ Both messages visible!
```

### Phase 3: Frontend Browser Test (10 min)

**Terminal 1 - Backend:**
```bash
cd c:\laragon\www\jojangocms2\backend
python manage.py runserver
```

**Terminal 2 - Frontend Customer:**
```bash
cd c:\laragon\www\jojangocms2\frontend-customer
npm start
# Opens: http://localhost:3000
```

**Terminal 3 - Frontend Driver:**
```bash
cd c:\laragon\www\jojangocms2\frontend-driver
npm start
# Opens: http://3001 or next available port
```

### Phase 4: Manual Testing

1. **Login as Customer**
   - Navigate to: `/chat/[DRIVER_ID]?name=Driver%201&order=1`
   - Open DevTools (F12) → Console tab
   - Type message: "Hello from customer!"
   - Press Send

2. **Check Console Output:**
   ```
   📡 Fetching from: /chat/?customer_id=2
   📨 Sending: {message: "Hello from customer!", customer_id: 2}
   ✅ Message sent!
   📡 Fetching from: /chat/?customer_id=2
   ✅ Response: [{message: "Hello from customer!", sender_type: "customer", ...}]
   📦 Formatted: [{text: "Hello from customer!", type: "me", time: "14:30", name: "You"}]
   ```

3. **Switch to Driver App**
   - Login as driver
   - Go to Orders → Find customer's order
   - Click "Chat" button
   - Open DevTools (F12) → Console tab
   - Should automatically poll and show message:
   
   ```
   📡 Fetching from: /chat/?customer_id=5
   ✅ Response: [{message: "Hello from customer!", sender_type: "customer", ...}]
   📦 Formatted: [{text: "Hello from customer!", type: "other", time: "14:30", name: "Customer Name"}]
   ```

4. **Driver Replies**
   - Type: "Hello from driver!"
   - Press Send
   - Check console for send logs

5. **Switch Back to Customer**
   - Should see both messages
   - Latest message from driver visible:
   ```
   📡 Fetching from: /chat/?customer_id=2
   ✅ Response: [{...}, {...}]
   📦 Formatted: [{text: "Hello from customer!", type: "me", ...}, {text: "Hello from driver!", type: "other", ...}]
   ```

---

## 🔍 TROUBLESHOOTING

### ❌ Error: 401 Unauthorized

**Cause:** Missing or invalid JWT token

**Check:**
```javascript
// Browser Console (F12)
localStorage.getItem('access')  // Should return a long token string
localStorage.getItem('refresh') // Should also exist
```

**Fix:**
- Clear localStorage: `localStorage.clear()`
- Logout and login again
- Check that API response includes `access_token` in login response

---

### ❌ Error: Messages not appearing

**Possible Causes:**

**A) API returns empty array**
```
Check in backend test: python manage.py shell < test_chat_api.py
If messages don't sync, check:
- User roles are set (customer/driver)
- ChatRoom was created with correct customer/driver IDs
```

**B) Customer ID format wrong**
```javascript
// In browser console, when on customer chat:
console.log(driverId)  // Should print: 2 (number, not "2" string)
console.log(typeof driverId) // Should print: number
```

**C) Query not matching**
```python
# Backend test
from chat.models import ChatMessage
msg = ChatMessage.objects.all().first()
print(f"Message: {msg.message}")
print(f"Sender Type: {msg.sender_type}")
print(f"Room: {msg.room_id}")
print(f"Room Customer: {msg.room.customer_id if msg.room else 'N/A'}")
print(f"Room Driver: {msg.room.driver_id if msg.room else 'N/A'}")
```

---

### ❌ Error: 404 Not Found on `/api/chat/`

**Cause:** URL routing not configured

**Check:**
```bash
cd backend
python manage.py show_urls | grep chat
# Should show: /api/chat/
```

**Fix:**
- Verify `/backend/core/urls.py` includes:
  ```python
  path('api/', include('chat.urls')),
  ```
- Verify `/backend/chat/urls.py` exists with router setup

---

### ❌ Error: CORS Error

**Cause:** Frontend and backend on different origins

**Check:**
- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`

**Fix in `axios.js`:**
```javascript
const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});
```

---

## 📊 VERIFICATION CHECKLIST

- [ ] Configuration check passes all tests
- [ ] API test shows `201 Created` for message creation
- [ ] API test shows `200 OK` for message retrieval
- [ ] API test shows both messages visible to both users
- [ ] Console logs show proper message formatting
- [ ] Customer can see own messages as `type: 'me'`
- [ ] Driver can see own messages as `type: 'me'`
- [ ] Messages from other side show as `type: 'other'`
- [ ] Messages refresh every 3 seconds automatically
- [ ] Browser console shows no errors

---

## 📝 KEY FILES

| File | Purpose |
|------|---------|
| `/backend/chat/views.py` | API ViewSet with logging |
| `/backend/chat/serializers.py` | Message serialization |
| `/backend/chat/models.py` | ChatRoom, ChatMessage models |
| `/frontend-customer/src/pages/Chat.js` | Customer chat UI |
| `/frontend-driver/src/pages/Chat.js` | Driver chat UI |
| `/backend/check_chat_config.py` | Configuration checker |
| `/backend/test_chat_api.py` | API test script |
| `/backend/test_chat_debug.py` | Database debug script |

---

## 🎯 EXPECTED MESSAGE FLOW

```
┌─────────────────────────────────────────────────────┐
│ 1. Customer sends: {message: "Hi", customer_id: 2}  │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/chat/
                       ▼
┌──────────────────────────────────────────────────────┐
│ Backend perform_create():                            │
│ - Detect user_role = 'customer'                      │
│ - Create/get room(customer=1, driver=2)              │
│ - Save message(room, sender_type='customer')         │
└──────────────────────┬───────────────────────────────┘
                       │ Message Saved
                       ▼
┌──────────────────────────────────────────────────────┐
│ Driver polls: GET /api/chat/?customer_id=1           │
│ Backend get_queryset():                              │
│ - Detect user_role = 'driver'                        │
│ - Filter: room__customer_id=1, room__driver=me       │
│ - Return message with sender_type='customer'         │
└──────────────────────┬───────────────────────────────┘
                       │ Response with message
                       ▼
┌──────────────────────────────────────────────────────┐
│ Driver receives formatted:                           │
│ {text: "Hi", type: "other", time: "14:30", ...}     │
│ Message displays on right (from other)               │
└──────────────────────────────────────────────────────┘
```

---

## 🎓 TUTORIAL: First Chat Session

### Setup (One Time)
1. Run `check_chat_config.py` - should pass all checks
2. Run 3 terminals: backend, frontend-customer, frontend-driver

### Test Scenario
1. **Login Customer App** (ID: 1) → Chat with Driver (ID: 2)
   - URL: `http://localhost:3000/chat/2?name=Driver%202&order=1`
   - F12 Console open
   
2. **Login Driver App** (ID: 2) → Orders list
   - Find order with Customer 1
   - Click Chat button
   - F12 Console open

3. **Customer sends:** "Hello Driver!"
   - Console shows: 📨 Sending, ✅ Message sent!, 📦 Formatted
   - Message appears on screen in blue (right side)

4. **Observe Driver:**
   - After 3 seconds, message appears on left (other)
   - Console shows: 📡 Fetching, 📦 Formatted with sender_type='customer'

5. **Driver replies:** "Hello Customer!"
   - Message appears in blue (right) on driver screen

6. **Observe Customer:**
   - After 3 seconds, message appears on left (other)

**Expected Result:** ✅ Full two-way conversation!

---

## 🆘 Still Not Working?

1. **Collect Diagnostics:**
   ```bash
   # Backend test output
   python manage.py shell < test_chat_api.py
   
   # Configuration check
   python manage.py shell < check_chat_config.py
   
   # Database state
   python manage.py shell < test_chat_debug.py
   ```

2. **Share Information:**
   - Output from all 3 tests above
   - Browser console errors (screenshot)
   - Django server logs
   - User IDs and roles (from check_chat_config output)

3. **Common Quick Fixes:**
   - Restart backend: `python manage.py runserver`
   - Clear browser cache: Ctrl+Shift+Delete
   - Verify localhost URLs match in axios.js
   - Check user roles: `python manage.py shell`
     ```python
     from django.contrib.auth import get_user_model
     get_user_model().objects.values('id', 'email', 'role')
     ```
