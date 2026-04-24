# Quick Test Guide - Order Creation Fix

## What Was Fixed
Order creation was failing because the backend didn't recognize 4 new service types from the frontend.

**Fixed**: Added support for `epajak`, `etilang`, `travel`, and `joker_mobil`

## Quick Test (Frontend)

### Prerequisites
- ✅ Backend running: `http://localhost:8000/`
- ✅ Frontend running: Check the React terminal for port (usually 3001+)
- ✅ Using account with branch: `agus` (branch: Situbondo) or `abas`

### Step 1: Login
1. Open frontend app (e.g., `http://localhost:3001`)
2. Login with credentials:
   - Username: `agus`
   - Password: (same as set in your DB)
3. Go to Home → Select Service

### Step 2: Test Each Service Type
Pick any service type and fill the form:
- **Service Type**: Any of the 10 options ✅
- **Pickup Location**: "Situbondo"
- **Drop Location**: "Surabaya, Indonesia"
- **Item Name**: (auto-filled)
- **Quantity**: 1
- **Unit Price**: 50000
- Extra fields (recipient, etc.) if required

### Step 3: Preview Price
Click "Preview Price" button
- Should show: Distance, Tarif, Service Fee, Total Price
- Expected: ~Rp 368,000

### Step 4: Create Order
Click "Create Order" button
- Should redirect to history
- Order should appear with price: Rp 368,000

### Step 5: Verify Consistency
Check Order History
- Find your new order
- Price should match: Rp 368,000

## Expected Results

### ✅ Success Indicators
- Order creates without error
- Order appears in history immediately
- Price shown: Rp 368,000
- Can create orders for ALL 10 service types

### ❌ If It Fails
1. **"Order gagal dibuat"** - Check browser console for error details
2. **"Akun Anda belum memiliki branch"** - Use account with branch (agus/abas)
3. **Price shows 7000** - Geocoding failed (address not found), try exact city name

## Test Account Setup

### Account: agus
- Username: `agus`
- Branch: ✅ Situbondo
- Role: customer

### Account: abas
- Username: `abas`
- Branch: ✅ Situbondo
- Role: customer

## Backend Logs to Check
```
Backend console should show:
✅ Geocoded 'Surabaya, Indonesia' to (-7.2462836, 112.7377674)

This confirms the fix is working!
```

## Service Types to Test
1. ✅ delivery (Delivery Order)
2. ✅ ojek (Ojek)
3. ✅ kurir (Kurir)
4. ✅ gift (Gift Order)
5. ✅ jojosehat (Belanja Obat)
6. ✅ belanja (Belanja)
7. ✅ epajak (E-Pajak) ← **NEW**
8. ✅ etilang (Etilang) ← **NEW**
9. ✅ travel (Travel) ← **NEW**
10. ✅ joker_mobil (Joker Mobil) ← **NEW**

## Troubleshooting

### Issue: "Invalid service type"
- **Cause**: Using old backend code
- **Solution**: Django should auto-reload, or restart `python manage.py runserver`

### Issue: "Akun belum punya branch"
- **Cause**: User doesn't have branch assigned
- **Solution**: Use `agus` or `abas` account which have branches

### Issue: Price shows 7000 (minimum)
- **Cause**: Geocoding failed
- **Solution**: 
  - Try using full address: "Surabaya, East Java" or "Surabaya, Indonesia"
  - Use GPS coordinates instead (click map to set location)

### Issue: Order doesn't appear in history
- **Cause**: Page not refreshing
- **Solution**: Refresh the page (F5) or navigate away and back

## Commands to Check Status

### Check backend is running
```bash
curl http://localhost:8000/api/auth/login/ -X POST
```

### Check frontend is running  
```bash
curl http://localhost:3001 (or alternate port shown in terminal)
```

## What Changed in Code

**File**: `backend/orders/views.py`

1. **validate_service_payload()** - Added 4 new types
2. **build_service_payload()** - Generic handling for new types
3. **get_default_item_name()** - Labels for new types

No database changes needed!

---

**Ready to test?** Follow steps 1-5 above. Let us know if you hit any issues!
