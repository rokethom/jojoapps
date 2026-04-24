# Map Picker & GPS Integration Guide

## Overview
Map picker dan GPS functionality telah diintegrasikan ke dalam customer app dengan Leaflet.js dan backend pricing engine.

## 🗺️ Map Picker Implementation

### Features:
- **Interactive Leaflet Map** - Menggunakan OpenStreetMap tiles (free, no API key needed)
- **Drag-Pin Functionality** - User bisa drag marker atau klik peta untuk select lokasi
- **Reverse Geocoding** - Otomatis konvert koordinat lat/lng ke nama alamat via Nominatim
- **Favorite Locations** - User bisa save lokasi favorit dan quick-select dari list
- **Real-time Coordinates** - Display lat/lng di bottom map picker

### How It Works:
1. User klik tombol 🗺️ (map button) next to address field
2. MapPickerModal opens dengan Leaflet map centered di lokasi sebelumnya
3. User bisa:
   - **Drag marker** untuk move pin ke lokasi baru
   - **Klik peta** untuk langsung select lokasi
   - **Select from favorites** untuk quick-select
4. Klik "Pilih Lokasi Ini" untuk confirm
5. Alamat otomatis terisi dengan reverse geocoding result

## 📍 GPS Button

### Features:
- **Geolocation API** - Browser's native GPS untuk get current location
- **Reverse Geocoding** - Convert GPS coordinates ke alamat readable
- **Fallback** - Jika fail, tetap save coordinates untuk pricing calculation

### How It Works:
1. User klik 📍 (GPS button)
2. Browser request location permission
3. Get current lat/lng dari device GPS
4. Reverse geocode ke alamat readable
5. Auto-fill address field dengan nama jalan/area

## 💰 Pricing Integration

### Backend Reference:
```python
# backend/pricing/models.py
class PriceSetting(models.Model):
    branch = ForeignKey('branch.Branch', on_delete=models.CASCADE)
    min_km = FloatField()
    max_km = FloatField(null=True, blank=True)
    price = IntegerField(null=True, blank=True)
    is_formula = BooleanField(default=False)
    per_km_rate = IntegerField(null=True, blank=True)
    subtract_value = IntegerField(null=True, blank=True)
```

### Pricing Flow:
1. User fills in origin & destination with lat/lng
2. Frontend sends `/orders/service-preview/` dengan lat/lng
3. Backend calculates:
   - **Distance** - Haversine formula dari branch origin ke destination
   - **Tarif** - Lookup di PriceSetting tabel sesuai distance & branch
   - **Service Fee** - Per titik (Titik 1: 1000, Titik 2: 1000, Titik 3+: 2000+)
   - **Total** - Tarif + Service Fee, rounded up ke 1000
4. Frontend displays:
   - 📏 Jarak (distance)
   - 💰 Tarif Jarak (base rate)
   - 📦 Service Fee (stops fee)
   - Breakdown per titik
   - **Total** (highlighted)

### Pricing Formula:
```
Tarif dari PriceSetting:
  - 0-5 km    : 6000 (flat)
  - 5-10 km   : 12000 (flat)
  - >10 km    : (1900 × jarak) - 7000

Service Fee Akumulatif:
  - Titik 1   : 1000
  - Titik 2   : 1000
  - Titik 3   : 2000
  - Titik 4   : 3000
  - Titik 5+  : 3000 per titik

Total = Tarif + Service Fee → Rounded Up ke 1000
```

## 🔧 Technical Stack

### Frontend:
- **Leaflet.js** - Map rendering & interaction
- **Haversine Formula** - Distance calculation reference
- **Nominatim API** - Free reverse geocoding (OpenStreetMap)
- **Geolocation API** - Browser's native GPS

### Backend:
- **pricing.services.pricing** - Distance & price calculation
- **PriceSetting Model** - Branch-specific pricing rules
- **Branch Model** - Cabang origin point (latitude, longitude)
- **Haversine Formula** - Backend distance calculation

## 📱 Mobile Considerations

### GPS Accuracy:
- Requires HTTPS on production (geolocation needs secure context)
- Mobile browsers request permission explicitly
- Fallback to manual address entry if GPS denied

### Map Performance:
- Leaflet is lightweight (~40KB gzipped)
- Works on mobile with touch gestures
- Marker drag is touch-enabled by default

## 🚀 API Endpoints

### Service Preview (GET PRICING)
```
POST /orders/service-preview/
{
  "service_type": "ojek|delivery|kurir",
  "customer_lat": -6.2088,
  "customer_lng": 106.8456,
  "purchase_lat": -6.2000,
  "purchase_lng": 106.8500,
  "extra_stops": ["address1", "address2"]
}

Response:
{
  "distance": 5.42,
  "tarif": 12000,
  "service_fee": 1000,
  "stops": 1,
  "price": 13000,
  "service_fee_breakdown": [
    {"titik": 1, "fee": 1000}
  ]
}
```

### Service Create (CREATE ORDER)
Same payload sebagai preview, akan create Order dengan calculated price.

## 🎯 User Flow

### Delivery Service Flow:
1. User select "Delivery Order" service
2. Fill in customer name & phone
3. Input customer address:
   - Option A: Type manually
   - Option B: Click GPS button (📍) untuk get current location
   - Option C: Click map button (🗺️) untuk pick on map
4. Add items (item_a, item_b, item_c)
5. Input purchase address (same 3 options as step 3)
6. Frontend auto-calculate distance & price
7. Preview shows distance breakdown & pricing
8. Submit order

### Map Picker Workflow:
1. Click 🗺️ button → MapPickerModal opens
2. Leaflet map centered di last saved location (atau default -6.2088, 106.8456)
3. Drag marker atau click peta untuk move pin
4. Lat/lng shown at bottom
5. Click "Pilih Lokasi Ini" atau "Simpan ke Favorit"
6. Modal closes, address auto-filled via reverse geocoding

## ⚠️ Known Limitations

1. **Reverse Geocoding Rate Limit** - Nominatim has rate limits (1 req/sec)
   - Solution: Implement client-side caching or use Google Maps API (requires key)

2. **Leaflet Marker Icons** - Default icons require CSS/image files
   - Already fixed via mergeOptions in MapPickerModal

3. **Distance Calculation** - Frontend also has Haversine but backend is authoritative
   - Frontend used for reference, backend final calculation

4. **Browser Support** - Geolocation not available in:
   - HTTP (only HTTPS)
   - Some older browsers
   - Private browsing mode (on some browsers)

## 🔮 Future Improvements

1. Add distance circle around map pin
2. Add branch location marker on map
3. Real-time driver location tracking
4. Route optimization untuk multiple stops
5. Estimated time of arrival (ETA) calculation
6. Integrate Google Maps for better UI/UX
7. Cache recent addresses for quick reselection
