# Pricing Fix Testing Guide

## Overview
The pricing fix implements **automatic geocoding** when GPS coordinates are not provided. This ensures pricing consistency between:
- ✅ Service preview (estimation)
- ✅ Order creation
- ✅ Order history display

## Backend Changes
- **File**: `backend/orders/views.py` → `calculate_service_pricing()` function
- **Feature**: Automatic address geocoding when lat/lng missing
- **Fallback**: Returns minimum price if geocoding fails
- **Log Messages**: "✅ Geocoded '...' to (...)" or "⚠️ Geocoding failed for '...'"

## Pre-Testing Checklist
- [ ] Backend running: `http://localhost:8000/`
- [ ] Frontend running: `http://localhost:3000+` (check terminal for port)
- [ ] Database populated with branch data
- [ ] Chatbot geocoding service working

## Test Case 1: Preview with Addresses (No Coordinates)

### Setup
1. Open browser: Frontend app (e.g., `http://localhost:3001`)
2. Login with customer account (e.g., username: `testcustomer`, password: `testpass123`)
3. Navigate to: **Home → Select Service Type → Fill Order Form**

### Test Steps
1. **Fill Service Form:**
   - Service Type: "Delivery" / "Belanja"
   - Pickup Location: "Situbondo" (or your branch city)
   - Drop Location: "Surabaya" (city name, NOT coordinates)
   - Item Name: "Paket Belanja"
   - Quantity: 1
   - Unit Price: 50000
   - **Important**: Leave GPS fields empty (don't click map)

2. **Click "Preview Price"**
   - Expected: Backend geocodes "Surabaya" → coordinates
   - Expected: Pricing calculated successfully
   - Backend console: Should show `✅ Geocoded 'Surabaya' to (...)`

3. **Verify Price Display:**
   - Distance shown (km)
   - Tarif shown (Rp)
   - Service fee shown (Rp)
   - Total price shown (Rp)

### Expected Behavior
```
Preview Results:
- Distance: ~196.5 km (Situbondo → Surabaya)
- Tarif: ~366,346 Rp
- Service Fee: 1,000 Rp
- Total: 368,000 Rp (rounded to nearest 1000)
```

## Test Case 2: Create Order with Addresses

### Test Steps
1. **Same as Test Case 1** → Fill form with addresses
2. **Click "Create Order"** (instead of Preview)
3. **Expected Response:**
   ```json
   {
     "message": "Order ABC123 berhasil dibuat.",
     "order": {
       "id": 123,
       "order_code": "ABC123",
       "total_price": 368000,
       ...
     },
     "summary": "..."
   }
   ```

4. **Verify:**
   - Order created successfully
   - Order code generated
   - Total price matches preview: **368,000 Rp**

## Test Case 3: Verify Price in Order History

### Test Steps
1. Navigate to **Order History**
2. Find the order created in Test Case 2
3. **Verify:**
   - Order shows same price: **368,000 Rp**
   - Consistent across all views (preview → creation → history)

## Test Case 4: Test with GPS Coordinates (Map Click)

### Test Steps
1. Open ServiceOrder form
2. **Click map** to set pickup location with GPS
3. **Click map** to set drop location with GPS
4. Click "Preview Price"
5. **Expected:**
   - Pricing uses provided coordinates (no geocoding needed)
   - Fast response
   - Accurate distance based on coordinates

### Expected Behavior
```
Map-based ordering bypasses geocoding:
- Direct coordinate pricing
- No "Geocoded..." message in backend
- Faster calculation
```

## Test Case 5: Test Geocoding Failure Handling

### Test Steps
1. Fill form with **invalid/non-existent address:**
   - Drop Location: "Xyz123NonExistentCity"
2. Click "Preview Price"

### Expected Behavior
```
Backend logs:
⚠️ Geocoding failed for 'Xyz123NonExistentCity': ...

Frontend shows:
- Distance: 0 km
- Price: 7,000 Rp (minimum price)
- Service Fee: 1,000 Rp
- Total: 8,000 Rp (minimum fallback)
```

## Backend Console Output Examples

### ✅ Successful Test
```
✅ Geocoded 'Surabaya, Indonesia' to (-7.2462836, 112.7377674)
[Pricing calculation completes with valid distance]
```

### ⚠️ Failed Test
```
⚠️ Geocoding failed for 'InvalidCity': ...
[Returns minimum price fallback]
```

## Manual API Testing (curl/Postman)

### Preview Endpoint
```bash
POST http://localhost:8000/api/orders/preview/
Authorization: Bearer <token>
Content-Type: application/json

{
  "service_type": "delivery",
  "pickup_location": "Situbondo",
  "drop_location": "Surabaya, Indonesia",
  "item_name": "Paket Belanja",
  "quantity": 1,
  "unit_price": 50000,
  "extra_stops": []
}
```

### Expected Response
```json
{
  "service_type": "delivery",
  "stops": 1,
  "distance": 196.5,
  "tarif": 366346,
  "service_fee": 1000,
  "price": 368000,
  "total_price": 368000,
  "service_fee_breakdown": [{"titik": 1, "fee": 1000}],
  "summary": "..."
}
```

## Troubleshooting

### Issue: "Price is 0 or minimum (7000)"
**Cause**: Geocoding failed
**Solution**: 
- Check backend console for `⚠️ Geocoding failed` message
- Verify address is correct (use full address with city/country)
- Try using map coordinates instead

### Issue: "Address geocoding taking too long"
**Cause**: OpenStreetMap API slow
**Solution**:
- Network latency - check internet connection
- API rate limiting - wait before next request
- Try shorthand address (e.g., "Surabaya" instead of full address)

### Issue: "Order price different from preview"
**Cause**: Address geocoding returned different coordinates second time
**Solution**:
- Use map coordinates (GPS) instead of addresses
- Consistent addresses produce consistent prices

## Database Schema
```sql
-- Orders table fields used in pricing
SELECT 
  id, order_code, customer_id, branch_id,
  pickup_location, drop_location,
  pickup_lat, pickup_lng, drop_lat, drop_lng,
  total_price, created_at
FROM orders_order;
```

## Performance Notes
- **Geocoding per request**: ~500-1000ms (OpenStreetMap API)
- **Pricing calculation**: ~10-50ms (local)
- **Total preview time**: ~500-1500ms (depends on network)

## Success Criteria
- ✅ Preview price == Order creation price
- ✅ Order history shows same price
- ✅ Geocoding logs appear when addresses provided
- ✅ Fallback to minimum price when geocoding fails
- ✅ Map coordinates bypass geocoding (faster)

## Next Steps
1. Run all 5 test cases
2. Verify prices are consistent
3. Check backend logs for geocoding messages
4. If all pass: Pricing fix is complete ✅
5. If issues: Review error logs and adjust as needed

---

**Testing Date**: April 21, 2026
**Backend Version**: Django 6.0.4
**Frontend**: React with React Router & Zustand
**Geocoding Service**: OpenStreetMap Nominatim API
