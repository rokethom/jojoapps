import requests
from django.conf import settings

class RocketChatService:
    def __init__(self):
        # 🔥 Konfigurasi dari settings (disesuaikan dengan kebutuhan)
        self.base_url = getattr(settings, 'ROCKET_CHAT_URL', 'http://127.0.0.1:3000')
        self.admin_user = getattr(settings, 'ROCKET_CHAT_USER', 'admin')
        self.admin_pass = getattr(settings, 'ROCKET_CHAT_PASS', 'admin123')
        self.auth_token = None
        self.user_id = None

    def login(self):
        """Otentikasi ke Rocket.Chat API"""
        url = f"{self.base_url}/api/v1/login"
        payload = {"user": self.admin_user, "password": self.admin_pass}
        
        try:
            res = requests.post(url, json=payload)
            data = res.json()
            if data['status'] == 'success':
                self.auth_token = data['data']['authToken']
                self.user_id = data['data']['userId']
                return True
            return False
        except Exception as e:
            print(f"❌ Rocket.Chat Login Error: {e}")
            return False

    def get_headers(self):
        return {
            "X-Auth-Token": self.auth_token,
            "X-User-Id": self.user_id
        }

    def post_direct_message(self, username, text):
        """Mengirim pesan ke DM User"""
        if not self.auth_token: self.login()
        
        url = f"{self.base_url}/api/v1/chat.postMessage"
        payload = {
            "channel": f"@{username}",
            "text": text
        }
        
        try:
            res = requests.post(url, json=payload, headers=self.get_headers())
            return res.json()
        except Exception as e:
            print(f"❌ Rocket.Chat PostMessage Error: {e}")
            return None

    def create_chat_room(self, room_name, usernames):
        """Membuat Private Group (Room) untuk kolaborasi Customer + Driver"""
        if not self.auth_token: self.login()
        
        url = f"{self.base_url}/api/v1/groups.create"
        payload = {
            "name": room_name,
            "members": usernames
        }
        
        try:
            res = requests.post(url, json=payload, headers=self.get_headers())
            return res.json()
        except Exception as e:
            print(f"❌ Rocket.Chat CreateRoom Error: {e}")
            return None

# Singleton Instance
rc_service = RocketChatService()
