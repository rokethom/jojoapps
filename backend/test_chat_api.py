"""
Manual chat connectivity script.

Run directly with:
    .\\venv\\Scripts\\python.exe test_chat_api.py

It is intentionally guarded so Django's test discovery can import this file
without executing the script body.
"""
import os


def main():
    import django

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
    django.setup()

    from django.contrib.auth import get_user_model
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken
    from chat.models import ChatRoom

    user_model = get_user_model()
    customer = user_model.objects.filter(role="customer").first()
    driver = user_model.objects.filter(role="driver").first()

    if not customer or not driver:
        print("[ERROR] Need at least 1 customer and 1 driver")
        print(f"   Customers found: {user_model.objects.filter(role='customer').count()}")
        print(f"   Drivers found: {user_model.objects.filter(role='driver').count()}")
        raise SystemExit(1)

    print("=" * 70)
    print("CHAT API TEST")
    print("=" * 70)
    print(f"Customer: {customer.id} ({customer.email})")
    print(f"Driver: {driver.id} ({driver.email})")

    client = APIClient()

    def get_token(user):
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)

    print("\n1. Customer sends message to driver...")
    customer_token = get_token(customer)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {customer_token}")

    response = client.post(
        "/api/chat/",
        {
            "message": "Hello from customer!",
            "customer_id": driver.id,
        },
        format="json",
    )

    print(f"   Status: {response.status_code}")
    if response.status_code == 201:
        print(f"   [OK] Message created: {response.data}")
    else:
        print(f"   [ERROR] {response.data}")

    print("\n2. Driver retrieves messages...")
    driver_token = get_token(driver)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {driver_token}")

    response = client.get(f"/api/chat/?customer_id={customer.id}")
    print(f"   Status: {response.status_code}")
    print(f"   Messages count: {len(response.data) if response.status_code == 200 else 'N/A'}")
    if response.status_code == 200:
        for msg in response.data:
            print(f"   - [{msg['sender_type']}] {msg['message']}")
    else:
        print(f"   [ERROR] {response.data}")

    print("\n3. Driver sends message to customer...")
    response = client.post(
        "/api/chat/",
        {
            "message": "Hello from driver!",
            "customer_id": customer.id,
        },
        format="json",
    )

    print(f"   Status: {response.status_code}")
    if response.status_code == 201:
        print("   [OK] Message created")
    else:
        print(f"   [ERROR] {response.data}")

    print("\n4. Customer retrieves all messages...")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {customer_token}")

    response = client.get(f"/api/chat/?customer_id={driver.id}")
    print(f"   Status: {response.status_code}")
    print(f"   Messages count: {len(response.data) if response.status_code == 200 else 'N/A'}")
    if response.status_code == 200:
        for msg in response.data:
            print(f"   - [{msg['sender_type']}] {msg['message']}")

        if len(response.data) == 2:
            print("   [OK] Both messages visible")
        else:
            print("   [WARN] Expected 2 messages")
    else:
        print(f"   [ERROR] {response.data}")

    print("\nDatabase state:")
    rooms = ChatRoom.objects.filter(customer=customer, driver=driver)
    print(f"   ChatRooms: {rooms.count()}")
    for room in rooms:
        print(f"   - Room {room.id}: {room.messages.count()} messages")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
