# 🔧 REGISTRATION DEBUGGING GUIDE

## ✅ Masalah yang Sudah Diperbaiki

### 1. **Missing `branch/serializers.py` File** ❌ FIXED
**Error:**
```
ModuleNotFoundError: No module named 'branch.serializers'
```

**Solusi:**
- Created file: `backend/branch/serializers.py`
- File berisi `BranchSerializer` untuk serialisasi data branch

### 2. **Poor Error Handling di Frontend** ❌ FIXED
**Masalah:** Frontend hanya menampilkan error untuk field `username`, padahal error bisa di field lain

**Solusi:**
- Updated `frontend-customer/src/pages/Register.js`
- Sekarang menampilkan error dari semua field: username, password, name, phone, branch_id
- Lebih detail pesan error

### 3. **Incomplete Branch ID Processing** ❌ FIXED
**Masalah:** `selectedBranch` bisa berupa string kosong "", tidak ditangani dengan baik

**Solusi:**
- Updated `frontend-customer/src/store/useAuthStore.js`
- Check: `if (branchId && branchId !== "")`
- Convert ke integer: `parseInt(branchId, 10)`

### 4. **Missing Serializer Response** ❌ FIXED
**Masalah:** Register endpoint mengembalikan data yang tidak lengkap

**Solusi:**
- Updated `backend/users/views.py`
- Response sekarang include informasi user lengkap:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": 1,
      "username": "john",
      "name": "John Doe",
      "phone": "08123456789",
      "branch": {
        "id": 1,
        "name": "Situbondo"
      }
    }
  }
  ```

---

## 🔍 Bagaimana Cara Debugging Jika Masih Ada Error

### Step 1: Check Browser Console
```javascript
// Buka Developer Tools (F12) → Console tab
// Cari log dengan output seperti:
// ✅ Registration successful
// ❌ Registration error
// 📤 Registering with payload
```

### Step 2: Check Network Tab
```
Developer Tools → Network tab → Cari request ke /api/auth/register/
- Method: POST
- Status harus 201 (Created) jika sukses
- Status 400 jika ada validation error
- Status 500 jika ada error di backend
```

### Step 3: Check Backend Logs
Ketika backend running, lihat terminal output:
```bash
🔵 Creating user: username_here
   Name: Nama User
   Phone: 08123456789
   Location: (lat, lon)
   Branch ID: branch_id
✅ User saved: id_user
✅ User registration complete: username_here
```

### Step 4: Check Database
Jika user berhasil dibuat tapi ada issue lain:
```sql
-- Di Django shell atau SQL client
SELECT id, username, first_name, phone, branch_id FROM users_user WHERE username='new_user';
SELECT id, name, phone, latitude, longitude FROM users_userprofile WHERE user_id=XX;
```

---

## 📋 Validation Checklist

### Frontend Checklist:
- [ ] Browser console tidak ada error
- [ ] Geolocation permission properly handled  
- [ ] Branch dropdown muncul jika geolocation gagal
- [ ] Form lengkap sebelum click register
- [ ] Network request ke `/api/auth/register/` berhasil (status 201)

### Backend Checklist:
- [ ] File `backend/branch/serializers.py` exist
- [ ] Django server running di port 8000
- [ ] CORS properly configured
- [ ] Branch data ada di database
- [ ] Terminal log menunjukkan user creation progress

### Database Checklist:
- [ ] User record created di `users_user` table
- [ ] UserProfile record created di `users_userprofile` table
- [ ] Branch assignment correct (user.branch_id bukan NULL)

---

## 🚀 Testing Registration Flow

### Method 1: Manual Testing
```bash
cd backend
python manage.py shell
```

```python
from users.serializers import RegisterSerializer
from branch.models import Branch

# Test 1: Tanpa branch
data = {
    "username": "test123",
    "password": "TestPass123",
    "name": "Test User",
    "phone": "081234567890"
}
serializer = RegisterSerializer(data=data)
if serializer.is_valid():
    user = serializer.save()
    print(f"✅ User created: {user.id}")
else:
    print(f"❌ Errors: {serializer.errors}")

# Test 2: Dengan branch
data = {
    "username": "test456",
    "password": "TestPass123",
    "name": "Test User 2",
    "phone": "081234567891",
    "branch_id": 1
}
serializer = RegisterSerializer(data=data)
if serializer.is_valid():
    user = serializer.save()
    print(f"✅ User created: {user.id}")
else:
    print(f"❌ Errors: {serializer.errors}")
```

### Method 2: Run Automated Test
```bash
cd backend
python test_registration.py
```

---

## 📱 Common Error Messages & Solutions

### Error 1: "A user with that username already exists."
**Penyebab:** Username sudah digunakan
**Solusi:** Gunakan username yang berbeda

### Error 2: "This field may not be blank."
**Penyebab:** Ada field yang kosong (name, phone, username, password)
**Solusi:** Pastikan semua field terisi

### Error 3: "Invalid branch_id"
**Penyebab:** Branch ID tidak ada di database
**Solusi:** Verify branch ID ada di `/api/branch/list/`

### Error 4: "Silakan pilih area/cabang!"
**Penyebab:** Geolocation gagal dan user tidak memilih branch manual
**Solusi:** User harus manual select branch dari dropdown

### Error 5: Status 500 atau Connection Refused
**Penyebab:** Backend tidak running atau tidak accessible
**Solusi:** 
```bash
# Cek backend running
cd backend
python manage.py runserver 8000
```

---

## 🔗 Related Endpoints

### GET /api/branch/list/
Untuk fetch daftar branch (untuk dropdown di frontend)

**Response:**
```json
{
  "branches": [
    {"id": 1, "name": "Situbondo", "area": "Kota"},
    {"id": 2, "name": "Banyuwangi", "area": "Banyuwangi"}
  ],
  "count": 2
}
```

### POST /api/auth/register/
Untuk register user baru

**Request:**
```json
{
  "username": "newuser",
  "password": "SecurePass123",
  "name": "John Doe",
  "phone": "081234567890",
  "latitude": -7.2504,
  "longitude": 112.7581,
  "branch_id": 1
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 10,
    "username": "newuser",
    "name": "John Doe",
    "email": "",
    "phone": "081234567890",
    "branch": {
      "id": 1,
      "name": "Situbondo",
      "area": "Kota"
    }
  }
}
```

---

## 📝 Quick Checklist untuk Deploy

```bash
# 1. Copy serializers file if missing
cp backend/branch/serializers.py

# 2. Migrate database (jika ada changes)
cd backend
python manage.py migrate

# 3. Check if branches exist
python manage.py shell
>>> from branch.models import Branch
>>> Branch.objects.all()

# 4. Run test
python test_registration.py

# 5. Start backend
python manage.py runserver 8000

# 6. Start frontend (di terminal baru)
cd frontend-customer
npm start
```

---

## 📞 Debugging Steps Summary

1. **Buka browser console** → Check logs
2. **Buka Network tab** → Monitor `/api/auth/register/` request
3. **Check backend terminal** → Lihat registration process
4. **Verify database** → User created?
5. **Check branch** → Branch properly assigned?

Jika tetap ada error setelah fixes ini, cek **browser console** untuk error message spesifik.
