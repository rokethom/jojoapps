from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ChatSerializer
from .services.chat_engine import process_message


# =========================
# FINAL CHATBOT API
# =========================
class ChatbotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]

        try:
            reply = process_message(request.user, message)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                "reply": "Maaf, terjadi kesalahan chatbot. Silakan coba lagi nanti."
            }, status=500)

        return Response({
            "reply": reply
        })