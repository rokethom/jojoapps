# Order Form Implementation - Testing & Deployment Guide

## Quick Start (Dev Testing)

### 1. Check Routes
```bash
# Verify App.js has these routes:
# /orderselect      → OrderServiceSelection (service picker)
# /orderform        → ServiceOrder (order form)
# /order            → ServiceOrder (alias)
```

### 2. Test Login Flow
```
1. Go to /login
2. Login dengan akun test
3. Redirect ke /
```

### 3. Test Home Page
```
1. Home page (/) harus show:
   ✓ Welcome greeting
   ✓ Promo banner
   ✓ 4 quick service buttons
   ✓ "Lihat Semua Layanan" button
   ✓ Active orders list

2. Click "Lihat Semua Layanan"
   → Should navigate to /orderselect
```

### 4. Test Service Selection Page (/orderselect)
```
1. Page harus menampilkan:
   ✓ Hero section mention form premium
   ✓ Search bar (searchable)
   ✓ 9 service cards dengan:
     - Color-coded accent line
     - Icon/emoji
     - Title & description
     - Feature pills
     - Hover effects

2. Test search filter:
   - Type "delivery" → show Delivery Order
   - Type "ojek" → show Ojek
   - Clear search → show all

3. Click any service card:
   → Navigate to /orderform?service=SERVICE_ID
   → Form harus auto-populate dengan correct preset
```

### 5. Test Order Form (/orderform?service=delivery)
```
1. Page harus show:
   ✓ Back button ("Pilih layanan lain")
   ✓ Hero section dengan service icon & color
   ✓ Service selector buttons (all 9 options)
   ✓ Form fields:
     - Lokasi Jemput
     - Lokasi Tujuan
     - Nama Item & Qty
     - Budget per Item
     - Extra Stops (optional)
     - Notes/Briefing
     - [Conditional] Recipient (name+phone untuk kurir/gift/travel)

2. Test form functionality:
   ✓ Type in Pickup location
   ✓ Type in Drop location
   → Live preview harus update (setelah ~400ms delay)
   → Price breakdown harus muncul

3. Test service change:
   ✓ Click different service (e.g., "Ojek")
   → Form item_name & note harus update ke preset
   → Recipient fields harus hide (jika perlu)
   → Color accent harus change

4. Test recipient fields:
   ✓ Select "Kuri" → recipient name+phone appear
   ✓ Select "Gift Order" → recipient name+phone appear
   ✓ Select "Travel" → recipient name+phone appear
   ✓ Select "Delivery Order" → recipient fields hidden

5. Test validation:
   ✓ Click submit without pickup_location
   → Error message below field
   ✓ Click submit without drop_location
   → Error message below field
   ✓ For kurir/gift/travel without recipient_name
   → Error message

6. Test submit (happy path):
   ✓ Fill all required fields
   ✓ Click "Kirim Order Premium"
   → Loading state harus show
   → API call /orders/service-create/
   → Success → Navigate to /history

7. Test extra stops:
   ✓ Add multiple lines di Extra Stops
   ✓ Live preview harus show stop count
   ✓ Breakdown harus calculate correctly
```

## Backend Checklist

Pastikan backend sudah siap untuk endpoints berikut:

### ✓ POST /orders/service-create/
Request:
```json
{
  "service_type": "delivery",
  "pickup_location": "string",
  "drop_location": "string",
  "item_name": "string",
  "quantity": number,
  "unit_price": number,
  "note": "string",
  "extra_stops": ["stop1", "stop2"],
  "recipient_name": "string or null",
  "recipient_phone": "string or null"
}
```

Response:
```json
{
  "id": 123,
  "order_code": "JAPPxxxxx",
  "status": "pending",
  ...
}
```

### ✓ POST /orders/service-preview/
Request:
```json
{
  "service_type": "delivery",
  "pickup_location": "string",
  "drop_location": "string",
  "item_name": "string",
  "quantity": number,
  "unit_price": number,
  "extra_stops": ["stop1", "stop2"]
}
```

Response:
```json
{
  "total_price": 50000,
  "tarif": 25000,
  "service_fee": 2500,
  "distance": 5,
  "stops": 2,
  "summary": "Rute 5km, 2 titik..."
}
```

## Deployment Checklist

### Before Deploy to Production:

- [ ] All routes working correctly
- [ ] No console errors
- [ ] All API endpoints tested
- [ ] Form validation working
- [ ] Live preview calculation working
- [ ] Images/icons loading correctly
- [ ] Responsive design tested (mobile/tablet/desktop)
- [ ] Performance check (no lag pada form interaction)
- [ ] Accessibility check (keyboard navigation, labels)
- [ ] Error handling tested (network errors, validation errors)

### Performance Optimization:

- [ ] Lazy load images/icons
- [ ] Debounce live preview API calls (already 450ms delay)
- [ ] Minimize CSS-in-JS (move to external if large)
- [ ] Test on slow 3G network connection

### Analytics to Track:

- [ ] Service selection distribution (which service most popular?)
- [ ] Form drop-off rates (where do users abandon?)
- [ ] Average time to submit form
- [ ] Error frequency per field
- [ ] Backend API response times

## Troubleshooting

### Issue: Service selector not changing form
**Solution:** Check that handleChange function properly updates form state when service_type changes

### Issue: Live preview not updating
**Solution:** 
- Check API endpoint /orders/service-preview/ is working
- Verify backend returns correct response format
- Check debounce delay (450ms) - might need adjustment

### Issue: Recipient fields not showing
**Solution:** Verify needsRecipient array includes correct service values: ["kurir", "gift", "travel"]

### Issue: Form submit returns error
**Solution:**
- Check all required fields are filled ✓
- Verify backend validation matches frontend
- Check API error response format

## Files Modified

1. **App.js** - Added routes for /orderselect and /orderform
2. **HomePremium.js** - Updated SERVICES list, added viewAllServices function
3. **ServiceOrder.js** - Added all 9 services, PREMIUM_PRESETS, dynamic handleChange
4. **OrderServiceSelection.js** - NEW FILE, premium service picker component

## Testing Tool Command Line

```bash
# Run frontend dev server
cd frontend-customer
npm start

# Test specific endpoint
curl -X POST http://localhost:8000/api/orders/service-preview/ \
  -H "Content-Type: application/json" \
  -d '{
    "service_type": "delivery",
    "pickup_location": "Jl. Test 1",
    "drop_location": "Jl. Test 2",
    "item_name": "Barang test",
    "quantity": 1,
    "unit_price": 100000,
    "extra_stops": []
  }'
```

## Success Criteria

✅ User can navigate from Home → Service Selection → Order Form → Submit
✅ Form shows correct service preset based on selected service
✅ Live preview updates as location changes
✅ Recipient fields show/hide based on service type
✅ Form validation prevents submission without required fields
✅ All 9 services work correctly
✅ Smooth animations and transitions throughout
✅ Premium UI/UX design consistent across all pages
✅ No console errors
✅ Responsive on all device sizes
