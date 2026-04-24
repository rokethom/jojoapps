from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status
from datetime import timedelta
from django.db import transaction
from django.utils import timezone

from .models import Order, DriverOrderRequest
from .serializers import OrderSerializer, DriverOrderRequestSerializer
from chatbot.services.chat_engine import clean_val, parse_int
from chatbot.services.geocoding import geocode_address
from pricing.services.pricing import (
    MINIMUM_PRICE,
    calculate_service_fee,
    get_service_fee_breakdown,
    pricing_engine,
    round_up_1000,
)
from asgiref.sync import async_to_sync
from core.ws_manager import notify_chat_message


class OrderViewSet(ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'customer':
            return self.queryset.filter(customer=user)

        if user.role == 'driver':
            if self.action == 'driver_accept':
                return self.queryset
            return self.queryset.filter(driver=user)

        return self.queryset

    # 🔥 assign driver (operator)
    @action(detail=True, methods=['post'])
    def assign_driver(self, request, pk=None):
        order = self.get_object()
        driver_id = request.data.get('driver_id')

        order.driver_id = driver_id
        order.status = 'assigned'
        order.save()

        return Response({'status': 'driver assigned'})

    # 🔥 update status (driver)
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        status_value = request.data.get('status')

        order.status = status_value
        order.save()

        if status_value in {'done', 'cancelled'}:
            payload = {
                'type': 'order_notification',
                'event': 'order_completed' if status_value == 'done' else 'order_cancelled',
                'order_id': order.id,
                'order_code': getattr(order, 'order_code', ''),
                'status': order.status,
                'message': 'Order selesai. Sesi chat telah selesai.' if status_value == 'done' else 'Order dibatalkan. Sesi chat ditutup.',
                'driver_name': order.driver.name if order.driver else '',
            }
            async_to_sync(notify_chat_message)(order.customer_id, order.driver_id if order.driver_id else None, payload)

        return Response({'status': 'updated'})
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        return Response(
            OrderSerializer(
                self.get_queryset().exclude(status='done'),
                many=True
            ).data
        )

    @action(detail=False, methods=['get'])
    def history(self, request):
        return Response(
            OrderSerializer(
                self.get_queryset(),
                many=True
            ).data
        )
    # =========================
    # 🔥 DRIVER - LIST ORDER MASUK
    # =========================
    @action(detail=False, methods=['get'])
    def driver_available(self, request):
        orders = Order.objects.filter(status='pending').order_by('-created_at')

        return Response(OrderSerializer(orders, many=True).data)

    @action(detail=False, methods=['get'])
    def driver_assigned(self, request):
        orders = self.get_queryset().filter(status='assigned')

        return Response(OrderSerializer(orders, many=True).data)


    # =========================
    # 🔥 DRIVER - TERIMA ORDER
    # =========================
    @action(detail=True, methods=['post'])
    def driver_accept(self, request, pk=None):
        driver = request.user

        # Validate driver role
        if driver.role != 'driver':
            return Response(
                {'error': 'Hanya driver yang dapat menerima order'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if driver is suspended
        if driver.is_suspended:
            return Response(
                {'error': f'Driver suspended: {driver.suspension_reason}'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            with transaction.atomic():
                try:
                    order = Order.objects.select_for_update().get(pk=pk)
                except Order.DoesNotExist:
                    return Response(
                        {'error': 'Order tidak ditemukan'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Check order status
                if order.status != 'pending':
                    return Response(
                        {'error': 'Order sudah diambil driver lain'},
                        status=status.HTTP_409_CONFLICT
                    )

                # Accept order
                order.driver = driver
                order.status = 'assigned'
                order.accepted_at = timezone.now()
                order.save()

            return Response({'status': 'order accepted'}, status=status.HTTP_200_OK)

        except transaction.TransactionManagementError as e:
            # Database transaction error
            return Response(
                {'error': 'Database error: Gagal menyimpan order'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            # Catch unexpected errors
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Unexpected error in driver_accept for order {pk}")
            return Response(
                {'error': 'Terjadi kesalahan. Silakan coba lagi.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    # =========================
    # 🔥 DRIVER - SELESAIKAN ORDER
    # =========================
    @action(detail=True, methods=['post'])
    def driver_complete(self, request, pk=None):
        order = self.get_object()

        if order.driver != request.user:
            return Response({'error': 'Bukan driver order ini'}, status=403)

        if order.accepted_at:
            delta = timezone.now() - order.accepted_at
            if delta < timedelta(minutes=5):
                remaining = int((timedelta(minutes=5) - delta).total_seconds())
                return Response(
                    {'error': f'Tombol selesai dikunci selama 5 menit setelah terima order. Tunggu {remaining} detik.'},
                    status=403
                )

        order.status = 'done'
        order.save()

        payload = {
            'type': 'order_notification',
            'event': 'order_completed',
            'order_id': order.id,
            'order_code': getattr(order, 'order_code', ''),
            'status': order.status,
            'message': 'Order selesai. Sesi chat telah selesai.',
            'driver_name': order.driver.name if order.driver else '',
        }
        async_to_sync(notify_chat_message)(order.customer_id, order.driver_id if order.driver_id else None, payload)

        return Response({'status': 'order completed'})

    @action(detail=True, methods=['post'])
    def request_cancel(self, request, pk=None):
        order = self.get_object()
        driver = request.user

        if order.driver != driver:
            return Response({'error': 'Bukan driver order ini'}, status=403)

        if order.status not in ['assigned', 'on_delivery']:
            return Response({'error': 'Order tidak sedang dalam status yang bisa dibatalkan oleh driver.'}, status=400)

        from chat.models import ChatRoom, ChatMessage

        room = ChatRoom.objects.filter(order=order).first()
        if room is None:
            room = ChatRoom.objects.create(customer=order.customer, driver=None, order=order)

        message_text = request.data.get('message') or f"Permintaan batal order {order.order_code} oleh driver."
        ChatMessage.objects.create(
            room=room,
            sender_type='driver',
            sender_id=driver.id,
            message=message_text,
        )

        return Response({
            'status': 'cancel_requested',
            'order_id': order.id,
            'order_code': order.order_code,
            'message': message_text,
        })

    @action(detail=True, methods=['post'])
    def oper_handle(self, request, pk=None):
        order = self.get_object()
        driver = request.user

        if order.status != 'assigned':
            return Response({'error': 'Oper handle hanya bisa dilakukan pada order yang sudah diterima driver.'}, status=400)

        if driver.is_suspended:
            return Response({'error': f'Driver suspended: {driver.suspension_reason}'}, status=403)

        driver.oper_handle_count = (driver.oper_handle_count or 0) + 1
        if driver.oper_handle_count >= 3:
            driver.suspended_until = timezone.now() + timedelta(hours=12)
            driver.suspension_reason = 'Oper handle sebanyak 3 kali: suspensi 12 jam.'
        else:
            driver.suspended_until = timezone.now() + timedelta(hours=1)
            driver.suspension_reason = 'Oper handle: suspensi sementara 1 jam.'

        driver.is_suspended = True
        driver.save(update_fields=['oper_handle_count', 'is_suspended', 'suspended_until', 'suspension_reason'])

        # Reset order status to pending so other drivers can accept it
        order.status = 'pending'
        order.driver = None
        order.accepted_at = None
        order.save(update_fields=['status', 'driver', 'accepted_at'])

        return Response({
            'status': 'oper_handle_registered',
            'suspended_until': driver.suspended_until,
            'oper_handle_count': driver.oper_handle_count,
            'suspension_reason': driver.suspension_reason,
        })


    # =========================
    # 🔥 UPDATE PRICE (ADMIN)
    # =========================
    @action(detail=True, methods=['post'])
    def update_price(self, request, pk=None):
        order = self.get_object()
        final_price = request.data.get('final_price')

        if final_price is None:
            return Response(
                {'error': 'final_price is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            final_price = float(final_price)
            if final_price < 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response(
                {'error': 'final_price must be a valid positive number'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.final_price = final_price
        order.save()

        return Response({
            'message': 'Price updated successfully',
            'order_id': order.id,
            'final_price': order.final_price
        })


    # =========================
    # 🔥 DRIVER REQUESTS (ADMIN)
    # =========================
    @action(detail=False, methods=['get'])
    def driver_requests(self, request):
        requests = DriverOrderRequest.objects.all().order_by('-created_at')
        serializer = DriverOrderRequestSerializer(requests, many=True)
        return Response(serializer.data)
    
class DriverRequestOrderAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        driver = request.user
        requests = DriverOrderRequest.objects.filter(driver=driver).order_by('-created_at')
        serializer = DriverOrderRequestSerializer(requests, many=True)
        return Response(serializer.data)

    def post(self, request):
        driver = request.user
        
        # Check if driver is suspended
        if driver.is_suspended:
            return Response(
                {'error': f'Akun driver suspended: {driver.suspension_reason}'}, 
                status=403
            )
        
        text = request.data.get('text')

        if not text:
            return Response({'error': 'Text is required'}, status=400)

        DriverOrderRequest.objects.create(
            driver=driver,
            text=text
        )

        return Response({'status': 'request created'})


class ServiceOrderPreviewAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not user.branch:
            return Response(
                {"detail": "Akun Anda belum memiliki branch. Hubungi admin terlebih dahulu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = build_service_payload(user, request.data)
        pricing = calculate_service_pricing(user, payload)

        return Response({
            "service_type": payload["service_type"],
            "stops": pricing["stops"],
            "distance": pricing["distance"],
            "tarif": pricing["tarif"],
            "service_fee": pricing["service_fee"],
            "price": pricing["price"],
            "total_price": pricing["price"],
            "service_fee_breakdown": [
                {"titik": point, "fee": fee}
                for point, fee in get_service_fee_breakdown(pricing["stops"])
            ],
            "summary": build_order_summary(payload, pricing),
        })


class ServiceOrderCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not user.branch:
            return Response(
                {"detail": "Akun Anda belum memiliki branch. Hubungi admin terlebih dahulu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = build_service_payload(user, request.data)
        errors = validate_service_payload(payload)
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        pricing = calculate_service_pricing(user, payload)

        from orders.models import OrderItem
        from core.ws_manager import broadcast_new_order
        from asgiref.sync import async_to_sync

        order = Order.objects.create(
            customer=user,
            branch=user.branch,
            service_type=payload["service_type"],
            pickup_location=payload["pickup_location"],
            drop_location=payload["drop_location"],
            pickup_lat=payload.get("pickup_lat"),
            pickup_lng=payload.get("pickup_lng"),
            drop_lat=payload.get("drop_lat"),
            drop_lng=payload.get("drop_lng"),
            total_price=pricing["price"],
        )

        OrderItem.objects.create(
            order=order,
            name=payload["item_name"],
            qty=max(payload["quantity"], 1),
            price=payload["unit_price"],
            subtotal=payload["unit_price"] * max(payload["quantity"], 1),
        )

        try:
            async_to_sync(broadcast_new_order)(OrderSerializer(order).data)
        except Exception:
            pass

        return Response(
            {
                "message": f"Order {order.order_code} berhasil dibuat.",
                "order": OrderSerializer(order).data,
                "summary": build_order_summary(payload, pricing),
            },
            status=status.HTTP_201_CREATED,
        )


def build_service_payload(user, data):
    profile_address = None
    if hasattr(user, "userprofile") and user.userprofile:
        profile_address = user.userprofile.address

    extra_stops = data.get("extra_stops") or []
    if isinstance(extra_stops, str):
        extra_stops = [stop.strip() for stop in extra_stops.split("\n") if stop.strip()]

    quantity = parse_int(data.get("quantity"), 1)
    unit_price = parse_int(data.get("unit_price")) or parse_int(data.get("item_price")) or 0
    service_type = (data.get("service_type") or "delivery").strip().lower()

    # Use lat/lng directly if provided
    customer_lat = data.get("customer_lat")
    customer_lng = data.get("customer_lng")
    pickup_lat = data.get("pickup_lat")
    pickup_lng = data.get("pickup_lng")
    drop_lat = data.get("drop_lat")
    drop_lng = data.get("drop_lng")
    recipient_lat = data.get("recipient_lat")
    recipient_lng = data.get("recipient_lng")
    purchase_lat = data.get("purchase_lat")
    purchase_lng = data.get("purchase_lng")

    pickup_location = clean_val(data.get("pickup_location")) or ""
    drop_location = clean_val(data.get("drop_location")) or ""
    item_name = clean_val(data.get("item_name")) or clean_val(data.get("item_a")) or clean_val(data.get("item_type")) or get_default_item_name(service_type)

    if service_type in {"delivery", "belanja"}:
        pickup_location = clean_val(data.get("purchase_address")) or pickup_location or clean_val(profile_address) or ""
        drop_location = clean_val(data.get("customer_address")) or drop_location or ""
        pickup_lat = pickup_lat or data.get("purchase_lat")
        pickup_lng = pickup_lng or data.get("purchase_lng")
        drop_lat = drop_lat or data.get("customer_lat")
        drop_lng = drop_lng or data.get("customer_lng")
    elif service_type == "ojek":
        pickup_location = clean_val(data.get("pickup_address")) or pickup_location or clean_val(profile_address) or ""
        drop_location = clean_val(data.get("drop_address")) or drop_location or ""
        pickup_lat = pickup_lat or data.get("pickup_lat")
        pickup_lng = pickup_lng or data.get("pickup_lng")
        drop_lat = drop_lat or data.get("drop_lat")
        drop_lng = drop_lng or data.get("drop_lng")
    elif service_type == "kurir":
        pickup_location = clean_val(data.get("customer_address")) or pickup_location or clean_val(profile_address) or ""
        drop_location = clean_val(data.get("recipient_address")) or drop_location or ""
        pickup_lat = pickup_lat or data.get("customer_lat")
        pickup_lng = pickup_lng or data.get("customer_lng")
        drop_lat = drop_lat or data.get("recipient_lat")
        drop_lng = drop_lng or data.get("recipient_lng")
        if not item_name:
            item_name = clean_val(data.get("item_type"))
    elif service_type in {"gift", "travel", "joker_mobil", "epajak", "etilang", "jojosehat"}:
        # Handle all other service types with generic logic
        pickup_location = clean_val(data.get("pickup_location")) or clean_val(data.get("purchase_address")) or clean_val(profile_address) or ""
        drop_location = clean_val(data.get("drop_location")) or clean_val(data.get("customer_address")) or ""
        # Use provided coordinates or defaults
        pickup_lat = pickup_lat or data.get("pickup_lat") or data.get("purchase_lat")
        pickup_lng = pickup_lng or data.get("pickup_lng") or data.get("purchase_lng")
        drop_lat = drop_lat or data.get("drop_lat") or data.get("customer_lat")
        drop_lng = drop_lng or data.get("drop_lng") or data.get("customer_lng")

    note = clean_val(data.get("note")) or ""
    recipient_name = clean_val(data.get("recipient_name")) or ""
    recipient_phone = clean_val(data.get("recipient_phone")) or ""
    item_name = item_name or get_default_item_name(service_type)

    return {
        "service_type": service_type,
        "pickup_location": pickup_location,
        "drop_location": drop_location,
        "pickup_lat": pickup_lat,
        "pickup_lng": pickup_lng,
        "drop_lat": drop_lat,
        "drop_lng": drop_lng,
        "recipient_name": recipient_name,
        "recipient_phone": recipient_phone,
        "item_name": item_name,
        "quantity": max(quantity, 1),
        "unit_price": max(unit_price, 0),
        "note": note,
        "extra_stops": [clean_val(stop) for stop in extra_stops if clean_val(stop)],
    }


def validate_service_payload(payload):
    errors = {}

    # Allow all service types from frontend
    valid_types = {
        "delivery", "ojek", "kurir", "gift", "jojosehat", "belanja",
        "epajak", "etilang", "travel", "joker_mobil"
    }
    if payload["service_type"] not in valid_types:
        errors["service_type"] = "Jenis layanan tidak valid."

    if not payload["pickup_location"]:
        errors["pickup_location"] = "Lokasi jemput wajib diisi."

    if not payload["drop_location"]:
        errors["drop_location"] = "Lokasi tujuan wajib diisi."

    if payload["service_type"] in {"kurir", "gift"}:
        if not payload["recipient_name"]:
            errors["recipient_name"] = "Nama penerima wajib diisi."
        if not payload["recipient_phone"]:
            errors["recipient_phone"] = "Nomor penerima wajib diisi."

    return errors


def calculate_service_pricing(user, payload):
    stops = 1 + len(payload["extra_stops"])
    
    # Use lat/lng directly if available
    dest_lat = payload.get("drop_lat")
    dest_lng = payload.get("drop_lng")
    
    # If lat/lng not provided, try to geocode the drop_location address
    if (not dest_lat or not dest_lng) and payload.get("drop_location"):
        try:
            coords = geocode_address(payload["drop_location"])
            if coords:
                dest_lat = coords.get('lat')
                dest_lng = coords.get('lon')
                print(f"✅ Geocoded '{payload['drop_location']}' to ({dest_lat}, {dest_lng})")
        except Exception as e:
            print(f"⚠️ Geocoding failed for '{payload['drop_location']}': {e}")
    
    if not user.branch or not dest_lat or not dest_lng:
        service_fee = calculate_service_fee(stops)
        return {
            "distance": 0,
            "tarif": MINIMUM_PRICE,
            "stops": stops,
            "service_fee": service_fee,
            "price": round_up_1000(MINIMUM_PRICE + service_fee),
        }

    pricing = pricing_engine(
        branch=user.branch,
        dest_lat=float(dest_lat),
        dest_lon=float(dest_lng),
        stops=stops,
    )

    return {
        "distance": pricing.get("distance", 0),
        "tarif": pricing.get("tarif", MINIMUM_PRICE),
        "stops": pricing.get("stops", stops),
        "service_fee": pricing.get("service_fee", 0),
        "price": pricing.get("price", MINIMUM_PRICE),
    }


def get_default_item_name(service_type):
    labels = {
        "delivery": "Belanja Titipan",
        "ojek": "Perjalanan Ojek",
        "kurir": "Kiriman Barang",
        "gift": "Surprise Package",
        "jojosehat": "Belanja Obat",
        "belanja": "Titip Belanja",
        "epajak": "Layanan E-Pajak",
        "etilang": "Pengurusan Tilang",
        "travel": "Paket Travel",
        "joker_mobil": "Rental Mobil",
    }
    return labels.get(service_type, "Layanan Jojo")


def build_order_summary(payload, pricing):
    highlights = [
        f"Layanan {payload['service_type'].upper()}",
        f"{pricing['stops']} titik perjalanan",
        f"Estimasi {pricing['distance']} km",
        f"Total Rp {pricing['price']:,}",
    ]

    if payload["extra_stops"]:
        highlights.append(f"{len(payload['extra_stops'])} titik tambahan aktif")
    if payload["recipient_name"]:
        highlights.append(f"Penerima {payload['recipient_name']}")
    if payload["note"]:
        highlights.append(f"Catatan: {payload['note']}")

    return " | ".join(highlights)
