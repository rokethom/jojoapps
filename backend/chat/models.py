from django.db import models
from django.conf import settings

class ChatRoom(models.Model):
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, null=True, blank=True)

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_chatrooms'
    )

    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='driver_chatrooms'
    )


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    sender_type = models.CharField(max_length=20)
    sender_id = models.IntegerField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)