# 📊 Order Flow Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          JOJO APP - ORDER SYSTEM                │
│                    (Premium Form-Based Approach)                 │
└─────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │   HOME   │ (HomePremium)
                              │  (/)     │
                              └─────┬────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼────────┐      │      ┌────────▼──────────┐
            │ Quick Services │      │      │ "Lihat Semua      │
            │ (4 choices)    │      │      │  Layanan" Button  │
            └────────────────┘      │      └────────┬───────────┘
                                    │               │
                                    │      ┌────────▼─────────────┐
                                    │      │ SERVICE SELECTION   │
                                    │      │ (/orderselect)      │
                                    │      │                     │
                                    │      │ 9 Service Cards:    │
                                    │      │ • Delivery Order    │
                                    │      │ • Ojek              │
                                    │      │ • Kuri              │
                                    │      │ • Belanja           │
                                    │      │ • Gift Order        │
                                    │      │ • Epajak            │
                                    │      │ • Etilang           │
                                    │      │ • Travel            │
                                    │      │ • Joker Mobil       │
                                    │      └────────┬─────────────┘
                                    │               │
                                    │      ┌────────▼──────────────────┐
                                    │      │ SERVICE ORDER FORM        │
                                    │      │ (/orderform?service=X)    │
                                    │      │                          │
                                    │      │ ┌────────────────────┐   │
                                    │      │ │ Service Preset     │   │
                                    │      │ │ Auto-updated when  │   │
                                    │      │ │ service changes    │   │
                                    │      │ └────────────────────┘   │
                                    │      │                          │
                                    │      │ ┌────────────────────┐   │
                                    │      │ │ Form Fields:       │   │
                                    │      │ │ • Pickup Location  │   │
                                    │      │ │ • Drop Location    │   │
                                    │      │ │ • Item Name & Qty  │   │
                                    │      │ │ • Budget per Item  │   │
                                    │      │ │ • Extra Stops      │   │
                                    │      │ │ • Notes/Briefing   │   │
                                    │      │ │ + Recipient*       │   │
                                    │      │ └────────────────────┘   │
                                    │      │                          │
                                    │      │ ┌────────────────────┐   │
                                    │      │ │ Live Features:     │   │
                                    │      │ │ • Price Preview    │   │
                                    │      │ │ • Distance calc    │   │
                                    │      │ │ • Stop count       │   │
                                    │      │ │ • Bundle breakdown │   │
                                    │      │ └────────────────────┘   │
                                    │      │                          │
                                    │      │ [SUBMIT BUTTON]          │
                                    │      └────────┬──────────────────┘
                                    │               │
                                    │      ┌────────▼──────────┐
                                    │      │ ORDER CONFIRMATION│
                                    │      │ Success/Redirect  │
                                    │      │ to /history       │
                                    │      └───────────────────┘
                                    │
                                    └─────────────────────────────
```

## Component Hierarchy

```
App (Router)
├── Public Routes
│   ├── / (HomePremium)
│   ├── /login (Login)
│   └── /register (Register)
└── Protected Routes
    ├── /orderselect (OrderServiceSelection) ← NEW
    ├── /orderform (ServiceOrder) ← UPDATED
    ├── /order (ServiceOrder) ← ALIAS
    ├── /history (History)
    ├── /chat (Chat)
    └── /profile (Profile)
```

## Data Flow During Order Creation

```
┌─────────────────────────────────────────────────────────────┐
│ User Input → Form State → Live Preview → Submit → Backend  │
└─────────────────────────────────────────────────────────────┘

1. USER FILLS FORM
   ┌─────────────────────────────────────┐
   │ input field ('Lokasi Jemput')       │
   │ ↓                                   │
   │ handleChange() → setForm()          │
   │ ↓                                   │
   │ form = {..., pickup_location: ...} │
   └─────────────────────────────────────┘

2. LIVE PREVIEW API CALL (Debounced 450ms)
   ┌──────────────────────────────────────────────┐
   │ useEffect watches [form, extraStops]         │
   │ ↓                                            │
   │ Wait 450ms (debounce)                        │
   │ ↓                                            │
   │ POST /orders/service-preview/ {              │
   │   service_type, pickup, drop, item, qty, ... │
   │ }                                            │
   │ ↓                                            │
   │ Response: {                                  │
   │   total_price: 50000,                        │
   │   tarif: 25000,                              │
   │   service_fee: 2500,                         │
   │   distance: 5,                               │
   │   stops: 2,                                  │
   │   summary: "..."                             │
   │ }                                            │
   │ ↓                                            │
   │ setPreview(response)                         │
   │ ↓                                            │
   │ UI Updates with Live Price                   │
   └──────────────────────────────────────────────┘

3. FORM SUBMISSION
   ┌──────────────────────────────────────────────┐
   │ User clicks "Kirim Order Premium"            │
   │ ↓                                            │
   │ validate() checks required fields            │
   │ ↓                                            │
   │ POST /orders/service-create/ {               │
   │   service_type,                              │
   │   pickup_location,                           │
   │   drop_location,                             │
   │   item_name,                                 │
   │   quantity,                                  │
   │   unit_price,                                │
   │   note,                                      │
   │   extra_stops: [...],                        │
   │   recipient_name (if needed),                │
   │   recipient_phone (if needed)                │
   │ }                                            │
   │ ↓                                            │
   │ Response: {                                  │
   │   id: 123,                                   │
   │   order_code: "JAPP...",                     │
   │   status: "pending",                         │
   │   ...                                        │
   │ }                                            │
   │ ↓                                            │
   │ navigate("/history")                         │
   └──────────────────────────────────────────────┘
```

## Service Selection Features

```
OrderServiceSelection Component
├── State Management
│   ├── selectedService
│   ├── hoveredService
│   └── searchQuery
│
├── Features
│   ├── Search Filter (real-time)
│   │   └── Filter by name or description
│   │
│   ├── Service Cards
│   │   ├── Color-coded accent line
│   │   ├── Emoji icon
│   │   ├── Title & description
│   │   ├── Feature pills (hover to expand)
│   │   └── Animated arrow on hover
│   │
│   ├── Hover Effects
│   │   ├── Card elevation (translateX)
│   │   ├── Glow shadow (color-based)
│   │   └── Feature pills expand
│   │
│   └── Responsive Design
│       ├── Mobile: single column
│       ├── Tablet: optimized spacing
│       └── Desktop: full width
```

## Form Template Customization

```
Each Service Type Has Custom Preset:

delivery:
  item_name: "Paket belanja premium"
  note: "Cek ulang item sebelum checkout..."

ojek:
  item_name: "Trip perjalanan"
  note: "Hubungi sebelum tiba agar pickup mulus..."

[... 7 more services ...]

When User Selects Service:
1. handleChange("service_type", "new_service")
2. Look up PREMIUM_PRESETS[new_service]
3. Update form.item_name & form.note
4. Reset currentStep = 1
5. Show/hide recipient fields based on service
```

## Conditional Field Rendering

```
Recipient Fields Show ONLY For:
├── kurir (📮 Kuri)
├── gift (🎁 Gift Order)
└── travel (✈️ Travel)

All Other Services:
├── delivery (📦)
├── ojek (🏍️)
├── belanja (🛒)
├── epajak (📋)
├── etilang (🚗)
└── joker_mobil (🏎️)
```

## Validation Flow

```
User Clicks Submit
  ↓
validate():
  ├── Check pickup_location.trim()
  │   └─ If empty → errors.pickup_location = "Lokasi jemput wajib diisi."
  │
  ├── Check drop_location.trim()
  │   └─ If empty → errors.drop_location = "Lokasi tujuan wajib diisi."
  │
  ├── If needsRecipient:
  │   ├── Check recipient_name.trim()
  │   │   └─ If empty → errors.recipient_name = "Nama penerima wajib diisi."
  │   │
  │   └── Check recipient_phone.trim()
  │       └─ If empty → errors.recipient_phone = "Nomor penerima wajib diisi."
  │
  └── Return hasErrors
  
  ↓
  
  If errors:
    ├── Set errors state
    ├── Display error messages
    └── Prevent submission
    
  If no errors:
    ├── setIsSubmitting(true)
    ├── POST /orders/service-create/
    ├── Success → navigate("/history")
    └── Error → Display feedback message
```

## Styling Architecture

```
Premium Design Elements:

1. Colors
   ├── By Service (each has unique accent color)
   ├── Gradients (linear, radial)
   └── Glassmorphism (backdrop blur)

2. Typography
   ├── Large headings (30-32px)
   ├── Body text (14-16px)
   ├── Small labels (11-13px)
   └── Font weight: 600-700 for emphasis

3. Spacing
   ├── Large gaps (24px) between sections
   ├── Medium gaps (18px) within forms
   ├── Small gaps (8-12px) within fields
   └── Padding: 18-28px consistent

4. Animations
   ├── 0.3s transitions (default)
   ├── 0.4s for slower reveals
   ├── cubic-bezier(0.4, 0, 0.2, 1) easing
   └── No animations on scroll (smooth scrolling only)

5. Effects
   ├── Shadow layering (0 2px 8px to 0 30px 80px)
   ├── Border radius (16-32px rounded)
   ├── Hover transforms (translateX, translateY)
   └── Glow effects (colored box-shadows)
```

## Performance Optimizations

```
1. Debounced API Calls
   └── 450ms delay for /orders/service-preview/
       (prevents excessive API calls during typing)

2. Conditional Rendering
   └── Recipient fields only render if needed
   └── Extra stops hidden until expanded

3. Memoized Values
   └── extraStops = useMemo(...) 
       (prevents unnecessary recalculation)

4. State Optimization
   └── Separate previewLoading, isSubmitting states
       (fine-grained control)

5. CSS Animations
   └── Hardware accelerated (transform, opacity)
       (smooth 60fps performance)
```

---

**This architecture ensures:**
✅ Clean separation of concerns
✅ Smooth user experience
✅ Efficient data handling
✅ Scalable design for future services
✅ Premium feel throughout the flow
