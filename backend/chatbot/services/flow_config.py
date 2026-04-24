# Definisi urutan pertanyaan untuk setiap layanan
SERVICE_FLOWS = {
    "ojek": [
        {"field": "pickup", "msg_key": "ASK_PICKUP"},
        {"field": "address", "msg_key": "ASK_DROP"},
        {"field": "stops", "msg_key": "ASK_STOPS"},
        {"field": "final", "msg_key": "CONFIRMATION"}
    ],
    "delivery": [
        {"field": "address", "msg_key": "ASK_DROP"},
        {"field": "items", "msg_key": "ASK_ITEMS"},
        {"field": "pickup", "msg_key": "ASK_PICKUP"},
        {"field": "ask_add_stop", "msg_key": "ASK_ADD_STOP"},
        {"field": "final", "msg_key": "CONFIRMATION"}
    ],
        "kurir": [
        {"field": "pickup", "msg_key": "ASK_PICKUP"},
        {"field": "address", "msg_key": "ASK_DROP"},
        {"field": "recipient_name", "msg_key": "ASK_RECIPIENT_NAME"},
        {"field": "recipient_phone", "msg_key": "ASK_RECIPIENT_PHONE"},
        {"field": "item_type", "msg_key": "ASK_ITEM_TYPE"},
        {"field": "item_price", "msg_key": "ASK_PRICE"}, # Tambahkan harga barang
        {"field": "stops", "msg_key": "ASK_STOPS"},
        {"field": "final", "msg_key": "CONFIRMATION"}
    ],
    "gift": [
        {"field": "recipient_name", "msg_key": "ASK_RECIPIENT_NAME"},
        {"field": "recipient_phone", "msg_key": "ASK_RECIPIENT_PHONE"},
        {"field": "address", "msg_key": "ASK_DROP"},
        {"field": "item_type", "msg_key": "ASK_ITEM_TYPE"},
        {"field": "stops", "msg_key": "ASK_STOPS"},
        {"field": "final", "msg_key": "CONFIRMATION"}
    ],
    "jojosehat": [
        {"field": "items", "msg_key": "ASK_ITEMS"},
        {"field": "pickup", "msg_key": "ASK_PICKUP"}, # Apotek
        {"field": "address", "msg_key": "ASK_DROP"}, # Rumah
        {"field": "stops", "msg_key": "ASK_STOPS"},
        {"field": "final", "msg_key": "CONFIRMATION"}
    ],
    "belanja": [
        {"field": "items", "msg_key": "ASK_ITEMS"},
        {"field": "pickup", "msg_key": "ASK_PICKUP"}, # Pasar/Toko
        {"field": "address", "msg_key": "ASK_DROP"}, # Rumah
        {"field": "stops", "msg_key": "ASK_STOPS"},
        {"field": "final", "msg_key": "CONFIRMATION"}
    ]
}

def get_next_step(service_type, current_step_index):
    flow = SERVICE_FLOWS.get(service_type, [])
    next_index = current_step_index + 1
    
    if next_index < len(flow):
        return flow[next_index], next_index
    return None, next_index
