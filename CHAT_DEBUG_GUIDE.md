# Chat Real-Time Debugging Guide

## Langkah-langkah Testing

### 1. Backup & Test Database
```bash
cd c:\laragon\www\jojangocms2\backend

# Backup database (optional)
# copy db.sqlite3 db.sqlite3.backup

# Check chat tables
python manage.py dbshell
# sqlite> SELECT * FROM chat_chatroom;
# sqlite> SELECT * FROM chat_chatmessage;
```

### 2. Run Backend API Test
```bash
cd c:\laragon\www\jojangocms2\backend
python manage.py shell < test_chat_api.py
```

Hasilnya harus menunjukkan:
- ✅ Customer sends message to driver (201 Created)
- ✅ Driver retrieves messages (200 OK, 1 message)
- ✅ Driver sends message back (201 Created)
- ✅ Customer retrieves ALL messages (200 OK, 2 messages)
- ✅ Database shows ChatRoom and messages

### 3. Check Django Logs
Buka file `backend/core/settings.py` dan pastikan logging ada:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

### 4. Test Frontend Chat Locally

**Customer App:**
```bash
cd frontend-customer
npm start
# Buka: http://localhost:3000/chat/1?name=Driver%201&order=1
# Ketik pesan dan send
# Pesan harus muncul di sidebar chat
```

**Driver App:**
```bash
cd frontend-driver
npm start
# Login sebagai driver
# Buka order list
# Klik chat dengan customer
# Harus bisa lihat pesan dari customer dan bisa balas
```

### 5. Browser Console Debug

Di browser console (F12), tambahkan logging di Chat.js:

**frontend-customer/src/pages/Chat.js** dan **frontend-driver/src/pages/Chat.js**:
```javascript
const fetchMessages = async () => {
  try {
    const url = driverId ? `/chat/?customer_id=${driverId}` : "/chat/";
    console.log('📡 Fetching from:', url);
    const res = await API.get(url);
    console.log('📨 Response:', res.data);
    const formattedMessages = res.data.map(msg => ({...}));
    console.log('✅ Formatted messages:', formattedMessages);
    setMessages(formattedMessages);
  } catch (err) {
    console.error('❌ Fetch error:', err);
  }
};
```

### 6. Checklist 

- [ ] Database punya customer dan driver users
- [ ] Customer dan driver punya role yang benar di users table
- [ ] API authentication token valid (`access` di localStorage)
- [ ] Backend logs menunjukkan `user_role` terdeteksi
- [ ] ChatRoom dibuat di database
- [ ] ChatMessage disimpan dengan `sender_type='customer'` atau `'driver'`
- [ ] Frontend formatting pesan benar (text, type, time, name)
- [ ] Messages tampil di both apps

## Potential Issues & Solutions

### Issue: 401 Unauthorized
**Solusi:** Pastikan token ada di localStorage dengan key `"access"`
```javascript
// Di browser console:
localStorage.getItem('access') // Harus ada token
```

### Issue: Empty Messages
**Solusi:** Check API query - pastikan customer_id correct format
```javascript
// Di browser console Debug fetchMessages dengan log:
console.log('customer_id:', driverId, 'type:', typeof driverId)
// Harus integer, bukan string
```

### Issue: Messages ga muncul di kedua side
**Solusi:** Check Django logs untuk see if QuerySet returns data
- Pastikan `room__customer_id` dan `room__driver_id` cocok
- Cek SQL query di logs

### Issue: Serializer Error
**Solusi:** Backend harus set `sender_type` dan `sender_id` saat create
```python
# Di perform_create, harus ada:
serializer.save(room=room, sender_type='customer', sender_id=self.request.user.id)
```

## Debug Commands

```bash
# 1. Check user roles
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.values_list('id', 'email', 'role')

# 2. Check chat rooms
>>> from chat.models import ChatRoom
>>> ChatRoom.objects.values_list('id', 'customer_id', 'driver_id')

# 3. Check messages
>>> from chat.models import ChatMessage
>>> ChatMessage.objects.values_list('id', 'sender_type', 'sender_id', 'room_id')

# 4. Query messages untuk room tertentu
>>> ChatMessage.objects.filter(room_id=1).values_list('id', 'message', 'sender_type')
```

## File Changes Made
- ✅ `/backend/chat/views.py` - Added logging, fixed filtering
- ✅ `/frontend-driver/src/pages/Chat.js` - Format messages, fix fields
- ✅ `/frontend-customer/src/pages/Chat.js` - Add setTimeout for fetch
- ✅ Created `/backend/test_chat_api.py` - API test script
- ✅ Created `/backend/test_chat_debug.py` - Database debug script
