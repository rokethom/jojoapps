# Debugging: Order Tidak Masuk Ketika Klik "Ya"

## 🎯 Masalah
Ketika user konfirmasi dengan mengetik "ya", order tidak tersimpan ke database.

## 🔍 Diagnosis

### Step 1: Cek Server Logs
Ketika user konfirmasi, lihat Django server terminal output. Cari tanda berikut:

#### ✅ Jika Order Berhasil:
```
✅ Order created: JAPP2604150123456 (ID: 1)
✅ OrderItem created
✅ Broadcast sent to dashboard
✅ Order finalization complete
```

#### ❌ Jika Ada Error:
```
❌ Error Create Order: [Error message]
❌ Traceback:
[Full Python traceback here]
```

### Step 2: Jalankan Test Script
Untuk test tanpa perlu UI chat, jalankan:

```bash
# Di terminal, masuk folder backend
cd backend

# Jalankan test script
python test_order_creation.py
```

Script ini akan:
1. Simulasikan percakapan lengkap
2. Tunjukkan response dari bot setiap step
3. Verify apakah order berhasil dibuat
4. Tampilkan detail order jika berhasil

## 🐛 Kemungkinan Masalah dan Solusi

### 1. ❌ User Tidak Punya Branch
**Error**: `AttributeError: 'NoneType' object has no attribute...`

**Solusi**:
- Admin > Users > Pilih customer
- Pastikan field "Branch" sudah diisi
- Save dan coba lagi

### 2. ❌ Pricing Engine Error (Geocoding)
**Error**: `⚠️ Geocoding failed for: [alamat]`

**Solusi**:
- Alamat tidak valid atau tidak terbaca oleh OpenStreetMap
- Gunakan alamat yang lebih spesifik dan standar
- Contoh format yang baik: "Jl. Sudirman No. 123, Jakarta, 12190"

### 3. ❌ Order Model Validation Error
**Error**: `IntegrityError`, `ValidationError`, atau `ValueError`

**Solusi**:
- Cek bahwa pickup_location dan drop_location tidak kosong
- Cek bahwa customer dan branch valid
- Cek bahwa total_price adalah angka positif

### 4. ❌ Broadcast Error (Tidak Fatal)
**Error**: `⚠️ Broadcast error (order still created): ...`

**Status**: Order tetap berhasil dibuat! Error ini tidak fatal
**Solusi**: Cek ws_manager.py atau WebSocket connection

### 5. ❌ OrderItem Creation Error
**Error**: `NOT NULL constraint failed: orders_orderitem.subtotal`

**Solusi**:
- Pastikan item_price valid (bukan None atau string)
- Cek field 'item_price' di flow_config.py

## 🛠️ Debugging Step-by-Step

### A. Test via Admin
1. Login ke http://localhost:8000/admin/
2. Go to Orders > Orders
3. Buat order manual dengan "Add Order"
4. Isi semua field
5. Save dan lihat apakah error muncul

### B. Test via API (Postman/cURL)
```bash
# 1. Get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Copy "access" token

# 2. Send message ke chatbot
curl -X POST http://localhost:8000/api/chatbot/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "ojek"}'

# 3. Lanjutkan dengan pickup, drop, dan ya
```

### C. Test via Script
```bash
python test_order_creation.py
```

Lihat output sebagai diagnostik lengkap

## 📋 Checklist Debugging

- [ ] Server Django masih running?
- [ ] Halaman chat terbuka di browser?
- [ ] User sudah login?
- [ ] User memiliki branch yang valid?
- [ ] Chat API endpoint terdaftar di urls.py?
- [ ] Database migration sudah jalan? (`python manage.py migrate`)
- [ ] PriceSetting sudah dikonfigurasi untuk branch?
- [ ] Tidak ada error di Django console saat klik "ya"?

## 🔨 Quick Fixes

### Jika masih error setelah debug:

#### 1. Reset Session
```bash
# Di Django shell
python manage.py shell
>>> from chatbot.services.chat_engine import SESSION_STATE
>>> SESSION_STATE.clear()
>>> exit()
```

#### 2. Clear Cache
```bash
python manage.py clear_cache
```

#### 3. Restart Server
```bash
python manage.py runserver 0.0.0.0:8000
```

#### 4. Check Database Corruption
```bash
python manage.py migrate --fake-initial
python manage.py migrate
```

## 📞 Information to Collect When Reporting Issue

Ketika melaporkan issue, sertakan:

1. **Django console output saat click "ya"** - seluruh log
2. **Output dari `python test_order_creation.py`**
3. **User profile detail** - apakah ada branch?
4. **Pricing settings** - sudah dikonfigurasi?
5. **Browser console error** - ada error JavaScript?
6. **Django version** - dari `python manage.py --version`
7. **Python version** - dari `python --version`

## 📊 Log Interpretation

### Verbose Log Example:

```
============================================================
📨 New message from user 1: 'ojek'
📊 Current state: START
🆕 Mapping Angka ke Service...
✅ User confirmed, creating order...
📝 Creating order: pickup=Jl. Gatot, drop=Jl. Sudirman, price=7500
✅ Order created: JAPP2604150123456 (ID: 5)
📝 Creating OrderItem: name=Kiriman Barang, price=0
✅ OrderItem created
✅ Broadcast sent to dashboard
✅ Order finalization complete
============================================================
```

## 🎓 Konteks Teknis

Graph state machine:

```
START/SELECTING_SERVICE → COLLECTING_DATA → CONFIRMATION → ORDER_CREATED
  ↓                           ↓
  └─→ GLOBAL COMMANDS (menu, batal, cancel)
```

Ketika user type "ya" di CONFIRMATION state:
1. `current_state == "CONFIRMATION"` → True
2. `message in ["ya", "yes", ...]` → True
3. Call `create_order_final(user, state_obj)`
4. Order dibuat dan disave ke database
5. Return success message

Jika order tdk masuk, berarti error terjadi di step 4.

## 📝 Next Steps

1. **Run test script**: `python test_order_creation.py`
2. **Collect logs**: Copy seluruh Django console output
3. **Check error**: Apakah ada "❌ Traceback" di logs?
4. **Isolate issue**: Apakah error di Order creation / OrderItem / Broadcast?
5. **Report**: Dengan info di atas, masalah bisa di-debug
