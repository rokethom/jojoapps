# Minimum Price Implementation (Rp 7000)

## 📋 Overview
Harga jasa sekarang memiliki **minimum price sebesar Rp 7000**. Jika perhitungan pricing engine menghasilkan harga lebih rendah (5000, 6000, dll), harga akan otomatis dinaikkan menjadi 7000.

## 🔧 Perubahan yang Dilakukan

### 1. **Backend - Pricing Engine** 
**File**: `backend/pricing/services/pricing.py`

```python
MINIMUM_PRICE = 7000  # Harga dasar minimum

def pricing_engine(branch, dest_lat, dest_lon):
    # ... calculation ...
    
    # Apply minimum price
    if price < MINIMUM_PRICE:
        price = MINIMUM_PRICE
        print(f"💰 Price adjusted to minimum: Rp {price:,}")
```

**Logic:**
- Jika harga hasil kalkulasi < 7000 → set ke 7000
- Jika harga hasil kalkulasi ≥ 7000 → tetap gunakan harga tersebut
- Log message untuk tracking

---

### 2. **Backend - Chat Engine (get_service_price)**
**File**: `backend/chatbot/services/chat_engine.py`

```python
MINIMUM_PRICE = 7000

def get_service_price(user, data, service_type):
    # Fallback values minimal 7000 (bukan 5000)
    if not user or not user.branch:
        return MINIMUM_PRICE  # Was: 5000
    
    if not destination_address or destination_address == "-":
        return MINIMUM_PRICE  # Was: 5000
    
    if not dest_coords:
        return MINIMUM_PRICE  # Was: 5000
    
    # Double check: apply minimum price jika result lebih rendah
    if price < MINIMUM_PRICE:
        price = MINIMUM_PRICE
```

**Changes:**
- Semua fallback price sekarang 7000 (bukan 5000)
- Double validation: pastikan price tidak akan pernah < 7000

---

### 3. **Backend - Pricing API**
**File**: `backend/pricing/views.py`

```python
from .services.pricing import pricing_engine, MINIMUM_PRICE

class PricingAPIView(APIView):
    def post(self, request):
        # ... calculation ...
        
        price = pricing_result.get('price')
        note = None
        
        # Check if minimum price was applied
        if price == MINIMUM_PRICE:
            note = f"Minimum price applied: Rp {MINIMUM_PRICE:,}"
        
        response = {
            "address": address,
            "distance": pricing_result.get('distance'),
            "price": price,
            "minimum_price": MINIMUM_PRICE,  # NEW: inform client
            "currency": "IDR",
            "note": note  # NEW: explain if min price was used
        }
```

**API Response Example:**
```json
{
  "address": "Jl. Sudirman 123",
  "distance": 0.8,
  "price": 7000,
  "minimum_price": 7000,
  "currency": "IDR",
  "note": "Minimum price applied: Rp 7000"
}
```

---

## 📊 Contoh Scenario

### Scenario 1: Jarak Dekat (< 2km)
- Perhitungan: 5000
- **Hasil Akhir: 7000** ✅ (di-adjust ke minimum)

### Scenario 2: Jarak Medium (2-5km)
- Perhitungan: 8000
- **Hasil Akhir: 8000** ✅ (di atas minimum, gunakan harga tersebut)

### Scenario 3: Jarak Jauh (> 5km)
- Perhitungan: 12500 (formula: 5000 + (10km × 2000) - 3000)
- **Hasil Akhir: 12500** ✅ (di atas minimum, gunakan harga tersebut)

### Scenario 4: Geocoding Failed
- Perhitungan: Gagal (geocoding error)
- **Hasil Akhir: 7000** ✅ (fallback ke minimum price)

---

## 🧪 Testing

### Test via API
```bash
# Request pricing untuk jarak dekat
curl -X POST http://localhost:8000/api/pricing/calculate/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"address": "Jl. Purawisata 1, Jakarta"}'

# Jika hasil < 7000, otomatis akan di-adjust ke 7000
```

### Test via Chatbot
1. Mulai percakapan chatbot
2. Pilih service (ojek/kurir)
3. Input alamat yang dekat dengan branch (<2km)
4. Lihat di confirmation message: `Harga Jasa: Rp 7000`

### Test via Admin
```bash
python manage.py shell

>>> from orders.models import Order
>>> order = Order.objects.latest('id')
>>> order.total_price  # Lihat apakah minimum 7000
```

---

## ✅ Flow Update

```
User Input Alamat
    ↓
geocode_address() → get lat/lon
    ↓
pricing_engine() → calculate distance & price
    ↓
Check: if price < 7000 → set to 7000  ← NEW
    ↓
Display in Chat: "Harga Jasa: Rp 7000"
    ↓
Save Order with minimum price
```

---

## 📝 Logging Examples

### ✅ Jika Harga Di-adjust:
```
📊 Pricing engine result: distance=0.80km, price=Rp 5000
💰 Price adjusted to minimum: Rp 7000
✅ Final price: Rp 7000 (Distance: 0.8km)
```

### ✅ Jika Harga Sudah Cukup:
```
📊 Pricing engine result: distance=8.50km, price=Rp 10000
✅ Final price: Rp 10000 (Distance: 8.5km)
```

### ✅ Jika Fallback ke Minimum:
```
⚠️ Geocoding failed for: Jl. Random
💰 Using minimum price as fallback: Rp 7000,
```

---

## 🎯 Key Points

1. **Harga Minimum**: Rp 7000 (hard limit)
2. **Fallback**: Jika ada error, gunakan 7000
3. **Double Check**: Applied di 3 tempat (pricing_engine, get_service_price, fallbacks)
4. **Logging**: Setiap adjustment di-log untuk debugging
5. **API Response**: Include `minimum_price` dan `note` untuk visibility

---

## 🚀 Deployment Notes

**Setelah Update:**
1. ✅ Restart Django server
2. ✅ Clear browser cache
3. ✅ Test: Verify order dibuat dengan minimum price 7000
4. ✅ Check logs: Confirm adjustments terjadi

**Database:**
- Tidak perlu migration - hanya logic change
- Existing orders tetap punya price lama
- New orders akan punya minimum price 7000

---

## 📞 Support

**Issue**: Harga masih menunjukkan < 7000?
- [ ] Restart server
- [ ] Check Django logs untuk "Price adjusted" message
- [ ] Verify PriceSetting configuration di admin

**Issue**: Order tdk masuk?
- Refer ke [ORDER_DEBUG_GUIDE.md](ORDER_DEBUG_GUIDE.md)
