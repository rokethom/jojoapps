import re

def extract_all(text):
    text = text.lower()
    
    result = {
        "type": None,
        "intent": "fallback",
        "name": None,
        "phone": None,
        "address": None,
        "pickup": None,
        "recipient_name": None,
        "recipient_phone": None,
        "item_type": None,
        "item_price": None,
        "items": []
    }

    # Keyword Based Intent (Lightweight)
    if any(w in text for w in ["status", "di mana"]): result["intent"] = "cek status pesanan"
    elif any(w in text for w in ["riwayat", "histori"]): result["intent"] = "riwayat pesanan"
    elif "promo" in text: result["intent"] = "promo terbaru"
    elif "batal" in text: result["intent"] = "pembatalan"

    # TYPE DETECTION (EXPANDED)
    if any(w in text for w in ["beli", "delivery"]):
        result["type"] = "delivery"
    elif any(w in text for w in ["ojek", "bonceng", "antar"]):
        result["type"] = "ojek"
    elif any(w in text for w in ["kurir", "paket", "kirim"]):
        result["type"] = "kurir"
    elif any(w in text for w in ["gift", "kado", "hadiah"]):
        result["type"] = "gift"
    elif any(w in text for w in ["sehat", "obat", "apotek"]):
        result["type"] = "jojosehat"
    elif any(w in text for w in ["belanja", "titip", "pasar"]):
        result["type"] = "belanja"

    # KURIR & GIFT FIELDS PARSING (Similar logic)
    if result["type"] in ["kurir", "gift"]:
        target_match = re.search(r"penerima\s+([a-zA-Z ]+?)(?:\s+hp|ke|barang|nama|dari|$)", text)
        if target_match:
            result["recipient_name"] = target_match.group(1).strip()
        
        hp_match = re.search(r"hp\s+(08\d{8,13})", text)
        if hp_match:
            result["recipient_phone"] = hp_match.group(1)

        barang_match = re.search(r"barang\s+([a-zA-Z ]+?)(?:\s+harga|ke|dari|nama|hp|$)", text)
        if barang_match:
            result["item_type"] = barang_match.group(1).strip()
        
        h_match = re.search(r"harga\s+(\d+)", text)
        if h_match:
            result["item_price"] = h_match.group(1)

    # NAME & PHONE (SENDER)
    name_match = re.search(r"nama\s+([a-zA-Z ]+?)(?:\s+hp|ke|dari|barang|$)", text)
    if name_match:
        result["name"] = name_match.group(1).strip()

    if not result["recipient_phone"]:
        phone_match = re.search(r"(08\d{8,13})", text)
        if phone_match:
            result["phone"] = phone_match.group(1)

    # ADDRESSES
    addr_match = re.search(r"ke\s+(.+?)(?:\s+dari|\s+nama|\s+hp|\s+barang|$)", text)
    if addr_match:
        result["address"] = addr_match.group(1).strip()

    pickup_match = re.search(r"dari\s+(.+?)(?:\s+nama|\s+hp|\s+ke|\s+barang|$)", text)
    if pickup_match:
        result["pickup"] = pickup_match.group(1).strip()

    # ITEMS (For Delivery, Belanja, JojoSehat)
    patterns = re.findall(
        r"(\d+)\s+([a-zA-Z ]+?)(?:\s+(\d+)(rb|k))?(?=,| dan | ke | dari | nama | hp | barang |$)",
        text
    )

    for p in patterns:
        qty = int(p[0])
        name = p[1].strip()
        price = int(p[2]) * 1000 if p[2] else 0
        result["items"].append({"name": name, "qty": qty, "price": price})

    return result