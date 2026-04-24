#!/usr/bin/env python
import os


def main():
    import django

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
    django.setup()

    from django.contrib.auth import get_user_model
    from chat.models import ChatRoom, ChatMessage

    user_model = get_user_model()
    customer = user_model.objects.filter(role="customer").first()
    driver = user_model.objects.filter(role="driver").first()

    print("=" * 60)
    print("CHAT DEBUG TEST")
    print("=" * 60)

    if not customer:
        print("[ERROR] No customer found")
    else:
        print(f"[OK] Customer: {customer.id} - {customer.email}")

    if not driver:
        print("[ERROR] No driver found")
    else:
        print(f"[OK] Driver: {driver.id} - {driver.email}")

    print("\nExisting Chat Rooms:")
    rooms = ChatRoom.objects.all()
    for room in rooms:
        print(f"  - Room {room.id}: Customer {room.customer_id} <-> Driver {room.driver_id}")
        print(f"    Messages: {room.messages.count()}")

    print("\nAll Chat Messages:")
    messages = ChatMessage.objects.all().order_by("created_at")
    for msg in messages:
        room_info = f"Room {msg.room_id}" if msg.room_id else "No Room (Support)"
        print(f"  - {msg.created_at}: [{msg.sender_type}] {msg.message} ({room_info})")

    print("\n" + "=" * 60)

    if customer and driver:
        print("\nTest: Customer sends message to driver...")

        room, created = ChatRoom.objects.get_or_create(
            customer=customer,
            driver=driver,
            defaults={"order": None},
        )
        print(f"  Room: {room.id} (created={created})")

        msg = ChatMessage.objects.create(
            room=room,
            sender_type="customer",
            sender_id=customer.id,
            message="Test message from customer",
        )
        print(f"  Message created: {msg.id}")

        retrieved = ChatMessage.objects.filter(
            room__customer=customer,
            room__driver=driver,
        )
        print(f"  Retrieved messages: {retrieved.count()}")
        for item in retrieved:
            print(f"    - {item.message}")


if __name__ == "__main__":
    main()
