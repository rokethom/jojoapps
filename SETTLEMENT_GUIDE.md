# Driver Settlement System - Implementation Guide

## Overview
A comprehensive driver settlement/deposit recap system that automatically calculates 20% deductions from driver payments based on distance rings and service tiers. The system includes Django admin interface, React admin dashboard, and Excel export functionality.

---

## Features

### 1. Automatic Settlement Calculation
- **Ring-based Deduction (20%)**:
  - Ring 1 (Tariff 0-5k): 1k deduction (20% of 5k)
  - Ring 2 (Tariff 5k-10k): 2k deduction (20% of 10k)
  - Ring 3 (Tariff > 10k): 20% of tariff (not including service fee)
  - **Maximum deduction**: 20% of 50k = 10k (if service > 50k, only 10k is deducted)

### 2. Time-based Reporting
- **5-day settlements**: Recent driver performance
- **15-day settlements**: Mid-term tracking
- **30-day settlements**: Monthly reports

### 3. Detailed Breakdown
- Base tariff per order
- Service fees per stop
- Gross total (tariff + service fees)
- Deduction calculation
- Settlement amounts

### 4. Payment Management
- Track settlement status: Pending, Paid, Overdue
- Mark settlements as paid
- Payment date tracking

### 5. Export Capabilities
- Export to Excel format
- Filtered reports by period, branch, status
- Complete financial summaries

---

## Backend Implementation

### Models

#### DriverSettlement
Stores settlement records per driver, branch, and period.

```python
settlement = DriverSettlement.objects.create(
    driver=driver,
    branch=branch,
    period='30_days',
    period_start=start_date,
    period_end=end_date,
)

# Calculate settlement with orders
settlement.calculate_settlement(orders)
settlement.save()
```

**Fields:**
- `period`: 5_days, 15_days, or 30_days
- `period_start/period_end`: Date range
- `total_orders`: Number of completed orders
- `total_tarif`: Sum of base tariffs (without service fee)
- `total_service_fee`: Sum of all service fees
- `gross_total`: tariff + service_fee
- `deduction_amount`: 20% deduction (capped at 10k)
- `settlement_amount`: gross_total - deduction_amount
- `status`: pending, paid, overdue
- `paid_date`: When marked as paid

#### SettlementDetail
Line items for each order within a settlement (for audit trail).

**Fields:**
- `order_code`: Reference to order
- `tarif`: Base tariff for the order
- `service_fee`: Service fee for the order
- `total_price`: Tariff + service fee
- `deduction`: Deduction for this order
- `settlement_amount`: Amount after deduction
- `pickup_location/drop_location`: Order locations
- `completed_at`: When order was completed

---

### API Endpoints

#### Generate Settlements
```bash
GET /api/settlement/generate_settlement/
```
**Query Parameters:**
- `period`: '5_days', '15_days', or '30_days'
- `driver_id`: (optional) Filter for specific driver
- `branch_id`: (optional) Filter for specific branch

**Response:**
```json
{
  "status": "generated",
  "count": 5,
  "period": "30_days",
  "date_range": {
    "start": "2026-03-17",
    "end": "2026-04-16"
  },
  "settlements": [...]
}
```

#### List Settlements
```bash
GET /api/settlement/list_settlements/
```
**Query Parameters:**
- `driver_id`: Filter by driver
- `branch_id`: Filter by branch
- `period`: Filter by period
- `status`: Filter by status (pending, paid, overdue)

#### Get Settlement Detail
```bash
GET /api/settlement/settlement_detail/?settlement_id=1
```

#### Mark as Paid
```bash
POST /api/settlement/mark_paid/
```
**Body:**
```json
{
  "settlement_id": 1
}
```

#### Export to Excel
```bash
GET /api/settlement/export_excel/
```
**Query Parameters:**
- `period`: (optional)
- `branch_id`: (optional)
- `status`: (optional)

**Response:** Excel file download

---

### Management Command

Generate settlements via Django management:

```bash
# Generate for all drivers (30 days)
python manage.py generate_settlements

# Generate for specific period
python manage.py generate_settlements --period 15_days

# Generate for specific driver
python manage.py generate_settlements --driver-id 5

# Generate for specific branch
python manage.py generate_settlements --branch-id 2

# Combine filters
python manage.py generate_settlements --period 15_days --driver-id 5 --branch-id 2
```

---

### Django Admin Interface

Navigate to `/admin/settlement/` to access:

1. **DriverSettlement List**
   - Filter by: Status, Period, Branch
   - Search by: Driver username, first name, last name
   - Actions: Mark as Paid, Mark as Pending
   - View detailed financial breakdown

2. **DriverSettlement Detail**
   - Summary of period and finances
   - Inline details of all orders in settlement
   - Payment status tracking
   - Color-coded amounts (green for settlement, red for deduction)

3. **SettlementDetail List** (Individual order lines)
   - View each order's contribution to settlement
   - Details of tariff, service fee, deduction
   - Quick audit trail

---

## Frontend Implementation

### React Admin Dashboard

**Path:** `/admin/settlement`

#### Features:

1. **KPI Cards**
   - Total Gross (sum of all tariffs + service fees)
   - Total Deduction (sum of all deductions)
   - Total Settlement (amount to be paid to management)
   - Pending Payment Count

2. **Filtering**
   - By Period (All, 5 days, 15 days, 30 days)
   - By Status (All, Pending, Paid, Overdue)
   - Search by driver or branch name

3. **Settlement Table**
   - Driver name with avatar
   - Branch
   - Period
   - Number of orders
   - Gross total (formatted currency)
   - Deduction amount (red text)
   - Settlement amount (green text)
   - Status badge (color-coded)
   - Quick actions (View Detail, Mark as Paid)

4. **Settlement Detail Modal**
   - Period date range
   - Total orders and totals
   - Detailed breakdown:
     - Base tariff
     - Service fees
     - Gross total
     - Deduction
     - Settlement amount
   - Order-by-order breakdown table with:
     - Order code
     - Individual tariffs
     - Individual service fees
     - Individual deductions

5. **Export to Excel**
   - Download settlements as XLSX
   - Formatted columns with proper styling
   - Includes all filters applied
   - Proper number formatting with thousands separator

#### Navigation
- Added "Settlement" menu item in sidebar (with FiDollarSign icon)
- Route: `/admin/settlement`
- Protected with admin authorization

---

## Data Flow

### Settlement Generation Flow

```
1. Admin clicks "Generate" button or runs management command
   ↓
2. System identifies all completed orders in date range
   ↓
3. For each driver & branch combination:
   - Fetch all "done" or "on_delivery" orders
   - Create or update DriverSettlement record
   ↓
4. Run calculate_settlement():
   - Sum tariffs and service fees
   - Calculate deductions per ring
   - Cap deduction at 10k
   - Calculate final settlement amount
   ↓
5. Create SettlementDetail items for audit trail
   ↓
6. Update UI with generated settlements
```

### Deduction Calculation Logic

```python
def calculate_order_deduction(tarif):
    if tarif <= 5000:
        return 1000  # Ring 1
    elif tarif <= 10000:
        return 2000  # Ring 2
    else:
        return min(tarif * 0.20, 10000)  # Ring 3, capped at 10k
```

---

## Usage Examples

### Via Django Admin

1. Go to `/admin/settlement/driversettlement/`
2. Click "Generate" button on top right
3. Select period and filters
4. System generates settlements for all matching drivers
5. View details in modal
6. Mark individual settlements as paid
7. Download Excel report

### Via Frontend Admin Dashboard

1. Navigate to `/admin/settlement`
2. Use period and status filters
3. Search for specific drivers or branches
4. View KPI cards showing totals
5. Click on a settlement row to see details
6. Click 📊 button to view detailed breakdown
7. Click ✓ button to mark as paid
8. Click "Export" to download Excel report

### Via API

```javascript
// Generate settlements
const response = await fetch(
  '/api/settlement/generate_settlement/?period=30_days',
  { method: 'GET' }
);

// Get list
const settlements = await fetch(
  '/api/settlement/list_settlements/?status=pending'
);

// View detail
const detail = await fetch(
  '/api/settlement/settlement_detail/?settlement_id=1'
);

// Mark as paid
await fetch('/api/settlement/mark_paid/', {
  method: 'POST',
  body: JSON.stringify({ settlement_id: 1 })
});

// Export Excel
const excel = await fetch(
  '/api/settlement/export_excel/?period=30_days',
  { responseType: 'blob' }
);
```

---

## Files Created

### Backend
- `backend/settlement/__init__.py`
- `backend/settlement/apps.py`
- `backend/settlement/models.py` - DriverSettlement, SettlementDetail models
- `backend/settlement/serializers.py` - DRF serializers
- `backend/settlement/views.py` - API viewsets
- `backend/settlement/urls.py` - URL routing
- `backend/settlement/admin.py` - Django admin interface
- `backend/settlement/tests.py` - Test file
- `backend/settlement/management/commands/generate_settlements.py` - Management command

### Frontend
- `frontend-admin/src/pages/Settlement.jsx` - Main settlement page
- Updated `frontend-admin/src/App.js` - Added routes
- Updated `frontend-admin/src/components/Sidebar.jsx` - Added menu item

### Configuration
- Updated `backend/core/settings.py` - Added settlement app to INSTALLED_APPS
- Updated `backend/core/urls.py` - Added settlement URLs
- Database migrations applied

---

## Key Design Decisions

1. **Separation of concerns**: SettlementDetail for audit trail, DriverSettlement for summary
2. **Flexible filtering**: Period, status, driver, branch all filterable
3. **Export capability**: XLSX format with proper formatting
4. **Admin interface**: Both Django admin and custom React dashboard
5. **Management command**: Easy batch processing from CLI
6. **Deduction capping**: Max 10k to prevent excessive deductions
7. **Decimal precision**: Using Decimal for financial calculations

---

## Troubleshooting

### Settlement not generating
- Check if orders exist with status "done" or "on_delivery"
- Verify driver and branch relationships
- Check date range filters

### Calculations seem off
- Verify order final_price is set correctly
- Check if tariff/service_fee breakdown is accurate
- Review deduction ring logic (5k, 10k, >10k boundaries)

### Excel export not working
- Ensure openpyxl is installed: `pip install openpyxl`
- Check file permissions for temp directory
- Verify column widths are reasonable

### API authentication errors
- Ensure user is logged in and is admin
- Check JWT token validity
- Verify IsAdminUser permission class

---

## Future Enhancements

- [ ] Automatic settlement generation on schedule
- [ ] SMS/Email notifications for settlement status
- [ ] Settlement adjustment/dispute mechanism
- [ ] Tax calculation integration
- [ ] Payment gateway integration
- [ ] Recurring settlement scheduling
- [ ] Settlement history and audit logs
- [ ] Advanced filtering and custom date ranges

---

## Support

For issues or questions:
1. Check Django admin interface for data verification
2. Review API response for error messages
3. Check management command output for details
4. Review browser console for frontend errors
5. Check Django logs for backend errors
