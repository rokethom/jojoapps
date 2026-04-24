import requests


def geocode_address(address: str):
    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": address,
        "format": "json",
        "limit": 1
    }

    headers = {
        "User-Agent": "JojoCMS Bot (contact@jojoapp.local)"
    }

    try:
        # Kurangi timeout agar tidak terlalu lama berfikir
        response = requests.get(url, params=params, headers=headers, timeout=1.5)
        data = response.json()

        if not data:
            return None

        return {
            "lat": float(data[0]["lat"]),
            "lon": float(data[0]["lon"])
        }

    except Exception as e:
        print("GEOCODING ERROR:", e)
        return None