# Auto-Branch Assignment Based on Location

## 📋 Overview
Sistem registrasi sekarang otomatis mendeteksi lokasi user saat mendaftar dan mengassign branch terdekat. Jika user berada di area Situbondo, akan otomatis masuk ke branch Situbondo.

---

## 🔧 Komponen yang Diubah

### 1. **Frontend - Register.js** 
**Path**: `frontend-customer/src/pages/Register.js`

**Fitur:**
- ✅ Request geolocation saat component mount
- ✅ Display status: "Mendeteksi lokasi...", "✅ Lokasi Terdeteksi", atau "⚠️ Error"
- ✅ Tampilkan koordinat user (latitude, longitude)
- ✅ Kirim lokasi ke backend saat register

**UI Addition:**
```jsx
{/* LOCATION STATUS */}
<div style={{ marginBottom: 25, ... }}>
  {locationLoading ? (
    <div>🔄 Mendeteksi lokasi Anda...</div>
  ) : location ? (
    <div>
      ✅ Lokasi Terdeteksi
      Koordinat: ({latitude}, {longitude})
      📍 Sistem akan otomatis menentukan cabang terdekat
    </div>
  ) : (
    <div>⚠️ {locationError}</div>
  )}
</div>
```

---

### 2. **Frontend - useAuthStore.js**
**Path**: `frontend-customer/src/store/useAuthStore.js`

**Changes:**
```javascript
register: async (username, password, name, phone, latitude, longitude) => {
  const payload = {
    username, password, name, phone,
    latitude, longitude  // NEW: Include location
  };
  await API.post("/auth/register/", payload);
}
```

---

### 3. **Backend - location_utils.py** (NEW FILE)
**Path**: `backend/users/location_utils.py`

**Fungsi Utama:**

#### `calculate_distance(lat1, lon1, lat2, lon2)`
- Hitung jarak 2 koordinat menggunakan Haversine formula
- Return: jarak dalam km

#### `detect_branch_by_location(latitude, longitude)`
- Cek semua branch di database
- Cari branch terdekat dalam radius 50km
- Return: Branch object atau None

#### `assign_default_branch(user)`
- Jika user tidak ada branch, assign branch pertama
- Fallback untuk error cases

**Contoh Usage:**
```python
branch = detect_branch_by_location(lat=7.1315, lon=114.3602)
# Jika di Situbondo, akan return branch Situbondo
```

---

### 4. **Backend - RegisterSerializer**
**Path**: `backend/users/serializers.py`

**Changes:**
```python
class RegisterSerializer(serializers.ModelSerializer):
    # NEW: Accept latitude & longitude
    latitude = serializers.FloatField(required=False, write_only=True, allow_null=True)
    longitude = serializers.FloatField(required=False, write_only=True, allow_null=True)
    
    def create(self, validated_data):
        # ... extract latitude, longitude ...
        
        # NEW: Auto-detect branch
        if latitude and longitude:
            detected_branch = detect_branch_by_location(latitude, longitude)
            if detected_branch:
                user.branch = detected_branch
        
        # Fallback: assign default if no branch
        if not user.branch:
            assign_default_branch(user)
        
        # NEW: Save location in UserProfile
        UserProfile.objects.get_or_create(
            user=user,
            defaults={'latitude': latitude, 'longitude': longitude}
        )
```

---

## 📍 Koordinat Cabang (Contoh)

Pastikan di Django Admin setiap branch memiliki latitude & longitude:

```
Cabang | Area        | Latitude | Longitude
-------|-------------|----------|----------
JoJo01 | Situbondo   | 7.1315   | 114.3602
JoJo02 | Surabaya    | 7.2575   | 112.7521
JoJo03 | Jakarta     | -6.2088  | 106.8456
```

**Konfigurasi:**
1. Admin > Branch > Edit setiap branch
2. Isi latitude & longitude (gunakan Google Maps)
3. Save

---

## 🧪 Testing Flow

### Test Case 1: Registrasi dari Situbondo
1. Buka `/register` dari IP/lokasi Situbondo
2. Sistem akan detect: `📍 Location detected: (7.1315, 114.3602)`
3. Sistem akan match ke branch Situbondo
4. Registrasi berhasil → user.branch = Situbondo

**Expected Result:**
```
📍 User registration location: (7.1315, 114.3602)
✅ Auto-assigned branch: JoJo01 - Situbondo
✅ Order finalization complete!
```

### Test Case 2: Registrasi dari Area Lain
1. Buka `/register` dari area berbeda
2. Sistem akan cari branch terdekat
3. Jika dalam radius 50km, assign branch terdekat
4. Jika diluar radius, assign default branch (pertama)

### Test Case 3: Manual Test via API
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123",
    "name": "Test User",
    "phone": "08123456789",
    "latitude": 7.1315,
    "longitude": 114.3602
  }'

# Response akan menunjukkan user dengan branch terdeteksi
```

### Test Case 4: Check Database
```bash
python manage.py shell
>>> from users.models import User
>>> user = User.objects.latest('id')
>>> user.branch.name  # Harus show branch yang terdekat
>>> user.userprofile.latitude  # Harus show 7.1315
```

---

## 🗺️ Branch Configuration Guide

### Step 1: Konfigurasi Branch di Admin
1. Buka `http://localhost:8000/admin/branch/branch/`
2. Klik branch yang ingin dikonfigurasi
3. Isi latitude & longitude (ambil dari Google Maps)
4. Save

### Step 2: Dapatkan Koordinat
- Google Maps: Klik lokasi → copy latitude, longitude
- Format: decimal (mis: 7.1315, 114.3602)
- Jangan gunakan format: 7°08'00.5"N

### Step 3: Verify
```bash
python manage.py shell
>>> from branch.models import Branch
>>> Branch.objects.all().values('name', 'latitude', 'longitude')
```

---

## 📊 Algoritma Deteksi

```
User Register
    ↓
Frontend: Get geolocation (lat, lon)
    ↓
Send to backend: /api/auth/register/ + {latitude, longitude}
    ↓
Backend: detect_branch_by_location(lat, lon)
    ↓
Loop setiap branch:
  - Hitung distance ke branch
  - Jika < 50km → candidate branch
  - Track branch terdekat
    ↓
If found branch < 50km away:
  - user.branch = closest_branch ✅
Else:
  - user.branch = first_branch (fallback)
    ↓
Save user → Profile
    ↓
Register complete ✅
```

---

## 🔍 Logging Output

### ✅ Successful Detection:
```
📍 User registration location: (7.1315, 114.3602)
📍 Branch: JoJo01 - Situbondo - Distance: 0.45km
📍 Branch: JoJo02 - Surabaya - Distance: 85.32km
✅ Location matched to branch: JoJo01 - Situbondo (Distance: 0.45km)
✅ Auto-assigned branch: JoJo01 - Situbondo
```

### ⚠️ Diluar Coverage Area:
```
📍 User registration location: (5.1315, 112.3602)
📍 Branch: JoJo01 - Situbondo - Distance: 125.80km
📍 Branch: JoJo02 - Surabaya - Distance: 89.50km
⚠️ No branch found within 50km radius
ℹ️ No branch detected, assigning default...
✅ Assigned default branch: JoJo01
```

### ⚠️ Location Error:
```
⚠️ Geocoding failed for: invalid coordinates
💰 Using minimum price as fallback: Rp 7000,
```

---

## 🚨 Troubleshooting

### Issue: Lokasi tidak terdeteksi di browser
**Penyebab:** Browser belum grant permission geolocation
**Solusi:** 
- Chrome: Address bar → Settings (🔒) → Allow location
- Firefox: Preferences → Privacy & Security → Permissions → Location

### Issue: Sistem assign branch salah
**Penyebab:** Koordinat branch tidak akurat
**Solusi:**
- Verify di admin: setiap branch punya lat/lon?
- Gunakan Google Maps untuk koordinat yang tepat

### Issue: User di area jauh tidak bisa register
**Penyebab:** Radius 50km terlalu kecil
**Solusi:**
- Edit `backend/users/location_utils.py`
- Ubah `LOCATION_RADIUS = 50` ke nilai lebih besar

---

## 📝 File yang Diubah

1. ✅ `frontend-customer/src/pages/Register.js` - Add geolocation UI
2. ✅ `frontend-customer/src/store/useAuthStore.js` - Send location to backend
3. ✅ `backend/users/location_utils.py` - NEW: Location detection logic
4. ✅ `backend/users/serializers.py` - Add latitude/longitude fields & auto-branch logic

---

## 🎯 Key Features

- ✅ Automatic branch detection based on user location
- ✅ Supports multiple branches with different coverage areas
- ✅ Fallback to default branch if outside coverage
- ✅ Saves user location in UserProfile
- ✅ Comprehensive logging for debugging
- ✅ Graceful error handling

---

## 🚀 Deployment

**Before Deploying:**
1. [ ] Configure all branches with latitude/longitude in admin
2. [ ] Test from different locations
3. [ ] Verify logs show correct branch assignments
4. [ ] Check database: users have correct branch assigned

**After Deploying:**
1. Monitor logs for location detection errors
2. Verify registrations assign correct branches
3. Adjust LOCATION_RADIUS if needed
4. Update branch coordinates if they change

