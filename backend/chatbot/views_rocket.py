from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .services.chat_engine import process_message
from .services.rocket_service import rc_service
import json

User = get_user_model()

class RocketWebhookView(APIView):
    authentication_classes = [] # Webhook biasanya tidak menggunakan JWT biasa
    permission_classes = []

    def post(self, request, *args, **kwargs):
        """
        Menerima Webhook dari Rocket.Chat (Outgoing Webhook / Script)
        Format biasanya: { "user_name": "...", "text": "...", "room_id": "...", "message_id": "..." }
        """
        data = request.data
        username = data.get('user_name')
        message_text = data.get('text')
        
        if not username or not message_text:
            return Response({"error": "Invalid data"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Cari User di Django berdasarkan username Rocket.Chat
        # (Asumsi: Username Rocket.Chat = Username Django atau Email)
        user = User.objects.filter(username=username).first()
        if not user:
            # Fallback cari berdasarkan email jika username tidak match
            user = User.objects.filter(email=username).first()

        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # 2. Proses pesan melalui Bot Engine
        response_text = process_message(user, message_text)

        # 3. Kirim balasan balik ke Rocket.Chat DM
        rc_service.post_direct_message(username, response_text)

        return Response({"status": "processed"}, status=status.HTTP_200_OK)
