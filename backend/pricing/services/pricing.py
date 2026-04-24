import math
from pricing.models import PriceSetting


# =========================
# HITUNG JARAK VIA OSRM ROUTING ENGINE
# =========================
import requests

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Hitung jarak menggunakan OSRM routing engine (driving distance)
    bukan straight line distance seperti Haversine
    """
    try:
        # OSRM API endpoint
        url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"

        response = requests.get(url, timeout=10)
        data = response.json()

        if response.status_code == 200 and data.get('routes'):
            # Distance dalam meter, convert ke km
            distance_meters = data['routes'][0]['distance']
            distance_km = distance_meters / 1000
            return distance_km
        else:
            # Fallback ke Haversine jika OSRM gagal
            print(f"OSRM failed, falling back to Haversine. Status: {response.status_code}")
            return calculate_distance_haversine(lat1, lon1, lat2, lon2)

    except Exception as e:
        print(f"OSRM error: {e}, falling back to Haversine")
        return calculate_distance_haversine(lat1, lon1, lat2, lon2)


def calculate_distance_haversine(lat1, lon1, lat2, lon2):
    """
    Fallback: Haversine formula untuk straight line distance
    """
    R = 6371  # km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# =========================
# PRICING DARI DATABASE
# =========================
def calculate_price(branch, distance):
    settings = PriceSetting.objects.filter(branch=branch).order_by("min_km")
    for s in settings:
        if s.max_km:
            if s.min_km <= distance <= s.max_km:
                return s.price
        else:
            # formula (> max)
            if distance > s.min_km:
                return int((s.per_km_rate * distance) - s.subtract_value)

    return 0


# =========================
# SERVICE FEE AKUMULATIF
# =========================
# Pola biaya jasa per titik:
#   Titik 1: 1000
#   Titik 2: 1000
#   Titik 3: 2000
#   Titik 4: 3000
#   Titik 5+: 3000/titik
SERVICE_FEE_PATTERN = [1000, 1000, 2000, 3000]  # titik 1-4
SERVICE_FEE_EXTRA = 3000  # titik 5+


def calculate_service_fee(stops):
    """
    Hitung service fee akumulatif berdasarkan jumlah titik.

    Titik 1: 1000
    Titik 2: 1000
    Titik 3: 2000
    Titik 4: 3000
    Titik 5+: 3000 per titik tambahan

    Total service = sum dari semua titik
    """
    if stops <= 0:
        return 0

    if stops == 1:
        return 1000
    if stops == 2:
        return 2000
    if stops == 3:
        return 4000
    if stops == 4:
        return 7000

    return 7000 + (stops - 4) * SERVICE_FEE_EXTRA


def get_service_fee_breakdown(stops):
    """
    Return detail breakdown biaya per titik untuk display.
    Returns list of (titik_number, fee)
    """
    breakdown = []
    for i in range(stops):
        if i < len(SERVICE_FEE_PATTERN):
            fee = SERVICE_FEE_PATTERN[i]
        else:
            fee = SERVICE_FEE_EXTRA
        breakdown.append((i + 1, fee))
    return breakdown


# =========================  
# PEMBULATAN KE ATAS (ke kelipatan 1000)
# =========================
def round_up_1000(price):
    """Bulatkan harga ke atas ke kelipatan 1000 terdekat"""
    return math.ceil(price / 1000) * 1000


# =========================
# MAIN ENGINE
# =========================
MINIMUM_PRICE = 7000  # Harga dasar minimum

def pricing_engine(branch, dest_lat, dest_lon, stops=1):
    """
    Hitung total harga jasa dengan formula AKUMULATIF:

    Tarif jarak:
      - 0-5 km  : 6000 (flat)
      - 5-10 km : 12000 (flat)
      - >10 km  : (1900 × jarak) - 7000

    Service fee akumulatif per titik:
      - Titik 1: 1000, Titik 2: 1000, Titik 3: 2000
      - Titik 4: 3000, Titik 5+: 3000/titik

    Total = tarif + service_fee → dibulatkan ke atas (kelipatan 1000)
    """
    origin_lat = branch.latitude
    origin_lon = branch.longitude

    distance = calculate_distance(
        origin_lat,
        origin_lon,
        dest_lat,
        dest_lon
    )

    # Hitung tarif jarak dari database/formula
    tarif = calculate_price(branch, distance)

    # Apply minimum price pada tarif
    # if tarif < MINIMUM_PRICE:
    #     tarif = MINIMUM_PRICE
    #     print(f" Tarif adjusted to minimum: Rp {tarif:,}")

    # Hitung service fee akumulatif
    service_fee = calculate_service_fee(stops)

    # Total sebelum pembulatan
    total_raw = tarif + service_fee

    # Bulatkan ke atas ke kelipatan 1000
    total = round_up_1000(total_raw)

    return {
        "distance": round(distance, 2),
        "tarif": tarif,
        "service_fee": service_fee,
        "price": total,
        "stops": stops,
    }

    return {
        "distance": 0,  # Tidak dihitung lagi
        "tarif": tarif,
        "service_fee": service_fee,
        "price": total,
        "stops": stops,
    }