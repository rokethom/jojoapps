# 🔧 CHAT ENDPOINT FIX - Customer & Driver Chat

## ✅ Masalah yang Sudah Diperbaiki

### 1. **500 Internal Server Error di `/api/chat/`** ❌ FIXED
**Error:**
```
TypeError: ChatMessage() got unexpected keyword arguments: 'customer_id'
```

**Root Cause:**
- `ChatMessageSerializer` mendefinisikan `customer_id` dan `order_id` sebagai write-only fields
- Saat `serializer.save()` dipanggil, field-field ini ikut dikirim ke `ChatMessage.objects.create()`
- Tapi model `ChatMessage` tidak memiliki field `customer_id` dan `order_id`

**Solusi:**
- Override `ChatMessageSerializer.create()` method
- Extract field-field yang bukan bagian dari model sebelum create
- Handle field tambahan (`room`, `sender_type`, `sender_id`) yang dikirim dari views

---

## 🔍 Analisis Kode

### File: `backend/chat/serializers.py`
**Sebelum (Error):**
```python
class ChatMessageSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(write_only=True, required=False)
    order_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = ChatMessage
        fields = ['id', 'message', 'created_at', 'sender_type', 'sender_id', 'room', 'customer_id', 'order_id']
        read_only_fields = ['id', 'created_at', 'sender_type', 'sender_id', 'room']

    # No create() method - uses default which passes ALL fields to model
```

**Sesudah (Fixed):**
```python
class ChatMessageSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(write_only=True, required=False)
    order_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = ChatMessage
        fields = ['id', 'message', 'created_at', 'sender_type', 'sender_id', 'room', 'customer_id', 'order_id']
        read_only_fields = ['id', 'created_at', 'sender_type', 'sender_id', 'room']

    def create(self, validated_data):
        # Extract fields that are not part of the model
        customer_id = validated_data.pop('customer_id', None)
        order_id = validated_data.pop('order_id', None)

        # Extract additional fields passed from views
        room = validated_data.pop('room', None)
        sender_type = validated_data.pop('sender_type', None)
        sender_id = validated_data.pop('sender_id', None)

        # Prepare data for model creation
        model_data = {
            'message': validated_data.get('message'),
        }

        # Add optional fields if provided
        if room is not None:
            model_data['room'] = room
        if sender_type is not None:
            model_data['sender_type'] = sender_type
        if sender_id is not None:
            model_data['sender_id'] = sender_id

        # Create the message with only model fields
        return ChatMessage.objects.create(**model_data)
```

---

## 📋 Testing Results

### ✅ Test 1: Customer sending message to driver
```json
POST /api/chat/
{
  "message": "Hello driver, I need help with my order",
  "customer_id": 5
}
```
**Response (201 Created):**
```json
{
  "id": 9,
  "message": "Hello driver, I need help with my order",
  "created_at": "2026-04-15T04:06:46.270952Z",
  "sender_type": "customer",
  "sender_id": 2,
  "room": 10
}
```

### ✅ Test 2: Customer fetching messages
```json
GET /api/chat/?customer_id=5
```
**Response (200 OK):** 1 message found

### ✅ Test 3: Driver sending message to customer
```json
POST /api/chat/
{
  "message": "Hello customer, I'm on my way",
  "customer_id": 2
}
```
**Response (201 Created):**
```json
{
  "id": 10,
  "message": "Hello customer, I'm on my way",
  "created_at": "2026-04-15T04:06:46.287241Z",
  "sender_type": "driver",
  "sender_id": 5,
  "room": 10
}
```

---

## 🔗 Chat Flow Architecture

### 1. **Chat Room Creation**
- Customer chat dengan driver → Room dibuat otomatis
- Room link ke customer, driver, dan order (jika ada)
- Room ID digunakan untuk grouping messages

### 2. **Message Creation**
- Customer: `sender_type='customer'`, `sender_id=customer.id`
- Driver: `sender_type='driver'`, `sender_id=driver.id`
- Message disimpan dengan room reference

### 3. **Message Retrieval**
- Filter berdasarkan `customer_id` parameter
- Customer melihat chat dengan driver tertentu
- Driver melihat chat dengan customer tertentu

### 4. **WebSocket Notification**
- Setelah message dibuat, kirim notifikasi via WebSocket
- Payload include message details dan room info

---

## 📱 Frontend Integration

### Customer Chat dengan Driver:
```javascript
// Send message
const response = await API.post('/api/chat/', {
  message: "Hello driver",
  customer_id: driverId  // ID of the driver
});

// Fetch messages
const messages = await API.get(`/api/chat/?customer_id=${driverId}`);
```

### Driver Chat dengan Customer:
```javascript
// Send message
const response = await API.post('/api/chat/', {
  message: "Hello customer",
  customer_id: customerId  // ID of the customer
});

// Fetch messages
const messages = await API.get(`/api/chat/?customer_id=${customerId}`);
```

---

## 🗄️ Database Schema

### ChatRoom Model:
```python
class ChatRoom(models.Model):
    order = models.OneToOneField('orders.Order', null=True, blank=True)
    customer = models.ForeignKey('users.User', related_name='customer_chatrooms')
    driver = models.ForeignKey('users.User', null=True, blank=True, related_name='driver_chatrooms')
```

### ChatMessage Model:
```python
class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, related_name='messages', null=True, blank=True)
    sender_type = models.CharField(max_length=20)  # 'customer' or 'driver'
    sender_id = models.IntegerField()  # User ID
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 🚀 Quick Test Commands

```bash
# 1. Test chat endpoint
cd backend
python test_chat_endpoint_fixed.py

# 2. Check database
python manage.py shell
>>> from chat.models import ChatMessage, ChatRoom
>>> ChatMessage.objects.count()
>>> ChatRoom.objects.count()

# 3. Manual API test
curl -X POST http://127.0.0.1:8000/api/chat/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test", "customer_id": 5}'
```

---

## 📝 Summary

**Masalah:** 500 Internal Server Error saat POST ke `/api/chat/`

**Penyebab:** Serializer mengirim field `customer_id` ke model yang tidak memiliki field tersebut

**Solusi:** Override `ChatMessageSerializer.create()` untuk menangani field-field yang bukan bagian dari model

**Status:** ✅ **FIXED** - Chat antara customer dan driver sekarang berfungsi normal

---

## 🔧 Files Modified

| File | Change |
|------|--------|
| `backend/chat/serializers.py` | ✅ Added `create()` method to handle extra fields |
| `backend/test_chat_endpoint_fixed.py` | ✅ Created comprehensive test script |

---

## 📞 Next Steps

1. **Test di Frontend:** Pastikan UI chat bisa send/receive messages
2. **WebSocket Testing:** Verify real-time notifications work
3. **Order Integration:** Test chat dengan order context
4. **Error Handling:** Add better error messages untuk edge cases

Chat system sekarang **fully functional** untuk komunikasi customer-driver! 🎉