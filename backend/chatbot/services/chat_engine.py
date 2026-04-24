import time
import random
import re
import traceback
from .parser import extract_all
from .responses import get_msg
from .flow_config import SERVICE_FLOWS, get_next_step
from .geocoding import geocode_address
from pricing.services.pricing import pricing_engine, MINIMUM_PRICE, calculate_service_fee, get_service_fee_breakdown, round_up_1000

# =========================
# SESSION MANAGEMENT (STATEful)
# =========================
# Format: { user_id: { state: "START", data: {}, step_index: 0, service_type: None } }
SESSION_STATE = {}

def process_message(user, message):
    message = message.lower().strip()
    user_id = user.id

    # Simulasi Typing
    simulate_typing()
    
    print(f"\n{'='*60}")
    print(f" New message from user {user_id}: '{message}'")

    # Get or Init State
    if user_id not in SESSION_STATE:
        SESSION_STATE[user_id] = {
            "state": "START",
            "data": {},
            "step_index": -1,
            "service_type": None,
            "user_obj": user # Simpan reference user untuk profile data
        }
        print(f" New session created for user {user_id}")

    state_obj = SESSION_STATE[user_id]
    state_obj["user_obj"] = user # Update reference setiap request
    current_state = state_obj["state"]
    
    print(f" Current state: {current_state}")
    print(f" Session data: {state_obj.get('data', {})}")

    # =========================
    # GLOBAL COMMANDS
    # =========================
    if message in ["batal", "cancel", "reset"]:
        SESSION_STATE.pop(user_id, None)
        return get_msg("CANCELLED")
    
    if message in ["menu", "halo", "hai", "hi"]:
        SESSION_STATE[user_id] = {"state": "SELECTING_SERVICE", "data": {}, "step_index": -1, "service_type": None}
        return f"{get_msg('GREETING')}\n\n{get_msg('CHOOSE_SERVICE')}"

    # =========================
    # STATE: START / SELECTING SERVICE
    # =========================
    if current_state == "START" or current_state == "SELECTING_SERVICE":
        # Mapping Angka ke Service
        service_map = {
            "1": "ojek",
            "2": "delivery",
            "3": "kurir",
            "4": "gift",
            "5": "jojosehat",
            "6": "belanja"
        }
        
        service_type = service_map.get(message)
        
        if not service_type:
            parsed = extract_all(message)
            service_type = parsed.get("type")

        if service_type:
            SESSION_STATE[user_id] = {
                "state": "START",
                "data": {},
                "step_index": -1,
                "service_type": None,
                "user_obj": user
            }
            return render_service_form_template(service_type)
        
        return f"{get_msg('UNKNOWN')}\n\n{get_msg('CHOOSE_SERVICE')}"

    # =========================
    # STATE: COLLECTING DATA
    # =========================
    if current_state == "COLLECTING_DATA":
        flow = SERVICE_FLOWS.get(state_obj["service_type"], [])
        current_step = flow[state_obj["step_index"]]
        
        # Simpan data dari input sebelumnya (Gunakan clean_val agar tidak bocor)
        field = current_step["field"]

        # =========================
        # HANDLE ADD STOP FLOW
        # =========================
        if field == "ask_add_stop":
            positive = ["1", "ya", "yes", "y", "iya"]
            negative = ["2", "tidak", "no", "n", "ga", "gak", "nggak"]

            if message in positive:
                state_obj["data"]["extra_stops"] = []
                state_obj["data"].pop("stops", None)
                state_obj["data"].pop("expected_stops", None)
                state_obj["state"] = "ADDING_STOPS"
                return get_msg("ASK_STOP_COUNT")

            if message in negative:
                state_obj["data"]["extra_stops"] = []
                state_obj["data"]["stops"] = 1
                state_obj["state"] = "CONFIRMATION"
                return format_confirmation(user, state_obj)

            return f"{get_msg('UNKNOWN')}\n\n{get_msg('ASK_ADD_STOP')}"

        # Untuk field stops, parse sebagai integer
        if field == "stops":
            numbers = re.findall(r'\d+', message)
            stops_val = int(numbers[0]) if numbers else 1

            if stops_val < 1:
                stops_val = 1
            if stops_val > 10:
                stops_val = 10

            state_obj["data"][field] = stops_val
        else:
            state_obj["data"][field] = clean_val(message)
        
        print(f" Saved data[{field}] = {state_obj['data'][field]}")
        
        return move_to_next_step(state_obj)

    # =========================
    # STATE: CONFIRMATION
    # =========================
    if current_state == "CONFIRMATION":
        print(f" User {user_id} in CONFIRMATION state, message: '{message}'")
        print(f" Current data: {state_obj.get('data', {})}")
        
        if message in ["ya", "yes", "oke", "ok", "confirm"]:
            print(f" User confirmed, creating order...")
            return create_order_final(user, state_obj)
        
        if message in ["batal", "tidak", "no"]:
            print(f" User cancelled order")
            SESSION_STATE.pop(user_id, None)
            return get_msg("CANCELLED")
            
        return "Ketik 'ya' untuk konfirmasi atau 'batal' untuk mengulang."
    # =========================
    # STATE: ADDING STOPS (FIX SUPER FINAL)
    # =========================
    if current_state == "ADDING_STOPS":

        data = state_obj["data"]

        # =========================
        # INIT (HANYA SEKALI)
        # =========================
        if "expected_stops" not in data:

            try:
                count = int(re.sub(r'[^\d]', '', message) or "1")
            except:
                count = 1

            if count < 1:
                count = 1
            if count > 5:
                count = 5

            data["expected_stops"] = count
            data["extra_stops"] = []

            print("INIT STOPS:", count)

            return f"Masukkan alamat titik ke-1:"

        # =========================
        # INPUT ALAMAT
        # =========================
        extra = data["extra_stops"]
        expected = data["expected_stops"]

        print("BEFORE:", len(extra), "/", expected)

        # simpan alamat
        extra.append(clean_val(message))

        print("AFTER:", len(extra), "/", expected)

        # =========================
        # CEK SELESAI
        # =========================
        if len(extra) >= expected:

            print("DONE INPUT STOPS")

            data["stops"] = 1 + len(extra)

            # cleanup (WAJIB!)
            data.pop("expected_stops", None)

            state_obj["state"] = "CONFIRMATION"

            return format_confirmation(user, state_obj)

        # =========================
        # LANJUT INPUT
        # =========================
        return f"Masukkan alamat titik ke-{len(extra)+1}:"
    
    # =========================
    return get_msg("UNKNOWN")
    # =========================


def move_to_next_step(state_obj):
    """Fungsi pembantu untuk pindah ke step berikutnya"""
    service_type = state_obj["service_type"]
    flow = SERVICE_FLOWS.get(service_type, [])
    
    next_index = state_obj["step_index"] + 1
    
    print(f" Moving from step {state_obj['step_index']} to {next_index}")
    
    if next_index < len(flow):
        state_obj["step_index"] = next_index
        next_step = flow[next_index]
        
        # Jika step-nya adalah final, ganti state ke CONFIRMATION
        if next_step["field"] == "final":
            state_obj["state"] = "CONFIRMATION"
            print(f" Transitioning to CONFIRMATION state")
            # Return format konfirmasi di sini
            return format_confirmation(state_obj.get("user_obj"), state_obj)
            
        print(f" Next step: {next_step['field']} ({next_step['msg_key']})")
        return get_msg(next_step["msg_key"])
    
    # Harusnya tidak sampai sini jika config flow benar
    state_obj["state"] = "CONFIRMATION"
    print(f" Reached end of flow, transitioning to CONFIRMATION")
    return "Data sudah lengkap. Ketik 'ya' untuk konfirmasi."


def get_service_price(user, data, service_type):
    """
    Hitung harga jasa menggunakan pricing engine AKUMULATIF.
    
    Formula:
    - Tarif jarak dari DB (PriceSetting)
    - Service fee akumulatif per titik: 1000, 1000, 2000, 3000, 3000...
    - Total = tarif + service_fee -> dibulatkan ke kelipatan 1000
    """
    if not user or not user.branch:
        print(f" No branch for user, using minimum price: Rp {MINIMUM_PRICE:,}")
        return {
            "tarif": MINIMUM_PRICE,
            "stops": 1,
            "service_fee": calculate_service_fee(1),
            "price": round_up_1000(MINIMUM_PRICE + calculate_service_fee(1)),
            "distance": 0
        }
    
    try:
        # Ambil alamat tujuan
        destination_address = data.get("address") or "-"
        
        # Ambil jumlah titik (stops)
        stops = int(data.get("stops", 1) or 1)
        if stops < 1:
            stops = 1
        
        # Jika alamat tidak ada atau tidak valid
        if not destination_address or destination_address == "-":
            print(f" No destination address, using minimum price")
            service_fee = calculate_service_fee(stops)
            total = round_up_1000(MINIMUM_PRICE + service_fee)
            return {
                "tarif": MINIMUM_PRICE,
                "stops": stops,
                "service_fee": service_fee,
                "price": total,
                "distance": 0
            }
        
        # Geocode alamat tujuan
        dest_coords = geocode_address(destination_address)
        
        if not dest_coords:
            print(f" Geocoding failed for: {destination_address}")
            service_fee = calculate_service_fee(stops)
            total = round_up_1000(MINIMUM_PRICE + service_fee)
            return {
                "tarif": MINIMUM_PRICE,
                "stops": stops,
                "service_fee": service_fee,
                "price": total,
                "distance": 0
            }
        
        # Panggil pricing engine dengan stops
        pricing_result = pricing_engine(
            branch=user.branch,
            dest_lat=dest_coords['lat'],
            dest_lon=dest_coords['lon'],
            stops=stops
        )
        
        print(f" Pricing result: {pricing_result}")
        
        return {
            "tarif": pricing_result.get("tarif", MINIMUM_PRICE),
            "stops": stops,
            "service_fee": pricing_result.get("service_fee", 0),
            "price": pricing_result.get("price", MINIMUM_PRICE),
            "distance": pricing_result.get("distance", 0)
        }
    
    except Exception as e:
        print(f" Error calculating price: {e}")
        traceback.print_exc()
        service_fee = calculate_service_fee(1)
        return {
            "tarif": MINIMUM_PRICE,
            "stops": 1,
            "service_fee": service_fee,
            "price": round_up_1000(MINIMUM_PRICE + service_fee),
            "distance": 0
        }


def format_confirmation(user, state_obj):
    data = state_obj["data"]
    st = state_obj["service_type"]

    # Hitung harga
    pricing = get_service_price(user, data, st)
    tarif = pricing["tarif"]
    stops = pricing["stops"]
    service_fee = pricing["service_fee"]
    total_price = pricing["price"]
    distance = pricing["distance"]

    breakdown = get_service_fee_breakdown(stops)
    service_parts = [f"Rp {fee:,}" for _, fee in breakdown]
    service_str = " + ".join(service_parts) if service_parts else "Rp 0"

    # =========================
    # FORMAT SUMMARY
    # =========================
    summary = f"{get_msg('CONFIRMATION')}\n\n"
    summary += f"Layanan: {st.upper()}\n"

    if data.get('pickup'):
        summary += f" Lokasi Asal: {clean_val(data.get('pickup'))}\n"

    if data.get('address'):
        summary += f" Lokasi Tujuan: {clean_val(data.get('address'))}\n"

    if data.get('items'):
        summary += f" Detail: {clean_val(data.get('items'))}\n"

    # =========================
    # EXTRA STOPS (FIX DI SINI)
    # =========================
    extra = data.get("extra_stops", [])

    if extra:
        summary += "\nTitik Tambahan:\n"
        for i, e in enumerate(extra, 1):
            summary += f"{i}. {e}\n"

    # =========================
    # HARGA
    # =========================
    summary += f"\nJarak : {distance} km\n"
    summary += f"Titik : {stops}\n"
    summary += f"Tarif Jarak : Rp {tarif:,}\n"
    summary += f"Service ({stops} titik) : {service_str} = Rp {service_fee:,}\n"
    summary += f"Total Jasa : Rp {total_price:,}\n"

    summary += "\nKetik *ya* untuk konfirmasi atau *batal* untuk mengulang."

    return summary


def render_service_form_template(service_type):
    templates = {
        "delivery": [
            "Lokasi jemput",
            "Lokasi tujuan",
            "Daftar item atau belanjaan",
            "Catatan khusus untuk belanja"
        ],
        "ojek": [
            "Lokasi jemput",
            "Lokasi tujuan",
            "Waktu/estimasi keberangkatan",
            "Catatan tambahan untuk driver"
        ],
        "kurir": [
            "Lokasi jemput",
            "Lokasi tujuan",
            "Nama penerima",
            "Nomor telepon penerima",
            "Jenis barang yang dikirim",
            "Estimasi harga barang"
        ],
        "gift": [
            "Nama penerima",
            "Nomor telepon penerima",
            "Alamat tujuan",
            "Jenis hadiah atau kado",
            "Pesan khusus untuk penerima"
        ],
        "jojosehat": [
            "Lokasi pengambilan obat",
            "Alamat tujuan",
            "Daftar obat / resep",
            "Catatan khusus untuk apotek"
        ],
        "belanja": [
            "Lokasi toko / pasar",
            "Alamat tujuan",
            "Daftar belanjaan",
            "Catatan preferensi produk"
        ]
    }

    fields = templates.get(service_type, [
        "Lokasi jemput",
        "Lokasi tujuan",
        "Rincian layanan",
        "Catatan tambahan"
    ])

    lines = [
        f"Template form layanan *{service_type.upper()}*:",
        "Silakan isi data berikut di form layanan kami:",
        ""
    ]

    for field in fields:
        lines.append(f"- {field}")

    lines.append("")
    lines.append("Untuk membuka form layanan, kembali ke halaman Home dan pilih layanan yang diinginkan.")
    lines.append("Jika sudah siap, isi detail layanan sesuai template di atas.")

    return "\n".join(lines)


def create_order_final(user, state_obj):
    """Finalisasi pembuatan order di Database"""
    data = state_obj["data"]
    st = state_obj["service_type"]
    
    try:
        from orders.models import Order, OrderItem
        from orders.serializers import OrderSerializer
        from core.ws_manager import broadcast_new_order
        from asgiref.sync import async_to_sync

        # Validasi user dan branch
        if not user:
            print(f" User is None")
            return "Maaf, terjadi kesalahan sistem (user not found)."
        
        if not user.branch:
            print(f" User {user.id} tidak memiliki branch!")
            return "Maaf, akun Anda belum dikonfigurasi (branch missing). Hubungi admin."

        # Jika data profile tidak diisi manual, ambil dari user
        try:
            user_profile = user.userprofile if hasattr(user, 'userprofile') else None
            profile_address = user_profile.address if user_profile else None
        except Exception as profile_error:
            print(f" Error accessing user profile: {profile_error}")
            profile_address = None
        
        pickup = clean_val(data.get("pickup")) or profile_address or "Tidak diketahui"
        drop = clean_val(data.get("address", "Tidak diketahui"))
        
        # Validasi alamat
        if not pickup or pickup == "-":
            print(f" Pickup location is empty")
            return "Maaf, lokasi jemput tidak valid. Coba lagi ya."
        
        if not drop or drop == "-":
            print(f" Drop location is empty")
            return "Maaf, lokasi tujuan tidak valid. Coba lagi ya."
        
        # Hitung harga jasa menggunakan pricing engine AKUMULATIF
        pricing = get_service_price(user, data, st)
        total_price = pricing["price"]
        print(f" Final price calculated: {total_price} (tarif={pricing['tarif']}, service={pricing['service_fee']}, stops={pricing['stops']})")

        print(f" Creating order: pickup='{pickup}', drop='{drop}', price={total_price}, branch={user.branch.id}")

        order = Order(
            customer=user,
            branch=user.branch,
            pickup_location=pickup,
            drop_location=drop,
            total_price=total_price  # total sudah dibulatkan
        )
        order.save()
        print(f" Order created: {order.order_code} (ID: {order.id})")

        # Buat setidaknya satu OrderItem agar pesanan valid di dashboard
        item_name = clean_val(data.get("item_type")) or "Kiriman Barang"
        item_price = parse_int(data.get("item_price"), 0)
        
        print(f" Creating OrderItem: name='{item_name}', price={item_price}")
        
        item = OrderItem.objects.create(
            order=order,
            name=item_name,
            qty=1,
            price=item_price,
            subtotal=item_price
        )
        print(f" OrderItem created (ID: {item.id})")

        # Broadcast ke dashboard
        try:
            async_to_sync(broadcast_new_order)(OrderSerializer(order).data)
            print(f" Broadcast sent to dashboard")
        except Exception as broadcast_error:
            print(f" Broadcast error (order still created): {broadcast_error}")
            traceback.print_exc()

        # Hapus session
        SESSION_STATE.pop(user.id, None)
        print(f" Session cleared for user {user.id}")

        success_msg = get_msg("ORDER_CREATED").replace("Order", f"Order {order.order_code}")
        print(f" Order finalization complete!")
        print(f"{'='*60}\n")
        return success_msg
        
    except Exception as e:
        print(f" Error Create Order: {type(e).__name__}: {e}")
        print(f" Traceback:\n{traceback.format_exc()}")
        print(f" State data: {data}")
        print(f" Service type: {st}")
        print(f"{'='*60}\n")
        return "Maaf, terjadi kesalahan saat membuat order. Coba lagi nanti."


def parse_int(value, default=0):
    if value is None:
        return default
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    try:
        cleaned = str(value).strip().lower()
        cleaned = re.sub(r'[^0-9]', '', cleaned)
        return int(cleaned or default)
    except (ValueError, TypeError):
        return default


def clean_val(val):
    """Membersihkan keyword bot yang mungkin terbawa oleh greedy regex atau copy-paste user"""
    if not val or not isinstance(val, str): return val
    
    # List keyword yang sering membocorkan sisa kalimat
    keywords = ["nama", "hp", "wa", "telepon", "penerima", "ke", "dari", "barang", "harga"]
    cleaned = val
    
    for kw in keywords:
        # Gunakan regex split yang lebih agresif (berhenti di keyword pertama yang ditemukan)
        # \b memastikan itu adalah kata utuh (bukan bagian dari kata lain)
        parts = re.split(rf"\b{kw}\b", cleaned, maxsplit=1, flags=re.IGNORECASE)
        if len(parts) > 1:
            cleaned = parts[0]
    
    return cleaned.strip()


def simulate_typing():
    """Simulasi jeda mengetik (lebih cepat, 0.2 - 0.5 detik)"""
    delay = random.uniform(0.2, 0.5)
    time.sleep(delay)