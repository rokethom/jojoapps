from asgiref.sync import async_to_sync
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Order
from .serializers import OrderSerializer
from core.ws_manager import broadcast_new_order


@receiver(post_save, sender=Order)
def broadcast_new_order_signal(sender, instance, created, **kwargs):
    if getattr(instance, '_skip_broadcast', False):
        return

    if not created or instance.status != 'pending':
        return

    async_to_sync(broadcast_new_order)(OrderSerializer(instance).data)
