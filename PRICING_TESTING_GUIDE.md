# Testing Pricing Engine Integration

## Overview
The pricing engine has been integrated into the chatbot so that service prices are calculated dynamically based on distance from the branch location to the delivery destination.

## Test Cases

### 1. Backend API Test
Test the pricing calculation endpoint directly:

```bash
# POST /api/pricing/calculate/
curl -X POST http://localhost:8000/api/pricing/calculate/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "address": "Jl. Sudirman No. 123, Jakarta"
  }'

# Expected response:
{
  "address": "Jl. Sudirman No. 123, Jakarta",
  "distance": 5.2,
  "price": 10000,
  "currency": "IDR"
}
```

### 2. Chatbot Integration Test
1. Open Order.js page
2. Start a chatbot conversation
3. Select a service (e.g., "Ojek" or "Delivery")
4. Provide pickup and delivery addresses
5. In the confirmation message, you should see **"Harga Jasa: Rp XX,XXX"** (dynamically calculated)
6. The price should be based on the distance from your branch to the destination

### 3. Database Verification
Check that orders are saved with calculated prices:

```python
from orders.models import Order
latest_order = Order.objects.latest('id')
print(f"Order: {latest_order.order_code}")
print(f"Price: Rp {latest_order.total_price:,}")
```

## How It Works

### Flow Diagram
```
User Input (Address)
    ↓
Chat Engine receives message
    ↓
Format Confirmation is called
    ↓
get_service_price() function:
  - Geocode address → lat/lon
  - Call pricing_engine(branch, dest_lat, dest_lon)
  - Get distance and price
    ↓
Display price in confirmation message
    ↓
If user confirms: create_order_final() saves order with calculated price
```

### Key Functions

#### `get_service_price(user, data, service_type)`
- **Input**: user, data, service_type
- **Process**: 
  1. Gets destination address from data
  2. Geocodes address using OpenStreetMap
  3. Calls pricing_engine with branch coordinates and destination coordinates
  4. Returns calculated price
- **Fallback**: Returns 5000 if geocoding fails

#### `pricing_engine(branch, dest_lat, dest_lon)`
- **Input**: branch object, destination latitude, destination longitude
- **Process**:
  1. Calculates distance from branch to destination using Haversine formula
  2. Queries PriceSetting table to find appropriate pricing tier
  3. Applies formula if distance exceeds max_km
- **Output**: Dictionary with 'distance' and 'price'

## Configuration

### Pricing Settings in Admin
1. Go to `http://localhost:8000/admin/pricing/pricesetting/`
2. Add or modify price settings for your branch:
   - `min_km`: Minimum distance for this tier
   - `max_km`: Maximum distance (leave blank for unlimited)
   - `price`: Fixed price for this distance range
   - `is_formula`: Enable formula-based pricing
   - `per_km_rate`: Rate per km (for formula)
   - `subtract_value`: Fixed deduction (for formula)

### Example Pricing Tiers
- 0-2km: Rp 5,000 (fixed)
- 2-5km: Rp 7,500 (fixed)
- 5+km: Rp 5,000 + (distance × Rp 2,000) - Rp 3,000 (formula)

## Troubleshooting

### Price shows as Rp 5,000 (default)
- **Possible cause**: Geocoding failed for the address
- **Solution**: Check address format, ensure it's a valid Indonesian address
- **Debug**: Check server logs for "Geocoding failed" message

### Price doesn't change
- **Possible cause**: No PriceSetting configured for your branch
- **Solution**: Add pricing tiers in Django admin
- **Debug**: Run `python manage.py show_urls` to verify pricing endpoint is registered

### Order saved with old price (Rp 7,000)
- **Possible cause**: Code not reloaded or API not updated
- **Solution**: Restart Django server, clear browser cache
- **Verify**: Check chat_engine.py has `get_service_price()` function call

## API Endpoint Reference

### POST /api/pricing/calculate/
Calculate price for a destination address

**Request:**
```json
{
  "address": "Destination address"
}
```

**Response (Success):**
```json
{
  "address": "Destination address",
  "distance": 5.2,
  "price": 10000,
  "currency": "IDR"
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

## Environment Requirements
- Nominatim API (OpenStreetMap) - for geocoding
- Network connectivity - to call geocoding service
- Branch coordinates configured - latitude and longitude for each branch
- User must have assigned branch - for pricing calculation

## Performance Notes
- Geocoding adds ~500-1000ms to confirmation time
- Prices are calculated fresh each time (not cached)
- Consider caching frequently used addresses for better performance
