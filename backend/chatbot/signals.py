from django.db.models.signals import post_save
from django.dispatch import receiver
from orders.models import Order
from .services.rocket_service import rc_service

@receiver(post_save, sender=Order)
def create_rocket_chat_room(sender, instance, created, **kwargs):
    """
    Trigger otomatis saat Order memiliki Driver (Status Assigned)
    Melakukan pembuatan Room Private di Rocket.Chat: Customer + Driver
    """
    # Hanya jalankan jika driver baru saja ditugaskan
    if instance.driver and instance.status == 'assigned':
        customer = instance.customer
        driver = instance.driver
        
        # Nama Room: Order-[OrderCode]
        room_name = f"order-{instance.order_code}".lower()
        members = [customer.username, driver.username]
        
        print(f"🚀 Memicu pembuatan room Rocket.Chat: {room_name} untuk {members}")
        
        # Panggil service Rocket.Chat
        # Note: Pastikan username di Django sama dengan username di Rocket.Chat
        res = rc_service.create_chat_room(room_name, members)
        
        if res and res.get('success'):
            print(f"✅ Room {room_name} berhasil dibuat di Rocket.Chat")
            # Bisa ditambahkan pesan pembuka otomatis di room tersebut
            rc_service.post_direct_message(customer.username, f"Admin telah membuatkan grup chat untuk pesanan {instance.order_code}. Silakan cek kolaborasi Anda dengan Driver!")
        else:
            print(f"⚠️ Gagal membuat room: {res}")
