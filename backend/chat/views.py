from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Max
from django.utils import timezone
import logging
from asgiref.sync import async_to_sync

from .models import ChatMessage, ChatRoom
from .serializers import ChatMessageSerializer
from .consumers import notify_chat_message
from users.permissions import IsAdmin

logger = logging.getLogger(__name__)


class ChatViewSet(ModelViewSet):
    queryset = ChatMessage.objects.all().order_by('created_at')
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get('customer_id')
        order_id = self.request.query_params.get('order_id')
        room_id = self.request.query_params.get('room_id')
        user_role = getattr(self.request.user, 'role', None)

        logger.info(f"get_queryset: user={self.request.user.id}, role={user_role}, customer_id={customer_id}, order_id={order_id}, room_id={room_id}")

        if room_id:
            queryset = queryset.filter(room__id=room_id)
            logger.info(f"Room filter: found {queryset.count()} messages")
        elif order_id:
            queryset = queryset.filter(room__order__id=order_id)
            logger.info(f"Order filter: found {queryset.count()} messages")
        elif customer_id:
            if user_role == 'customer':
                queryset = queryset.filter(
                    room__customer=self.request.user,
                    room__driver_id=customer_id
                )
                logger.info(f"Customer filter: found {queryset.count()} messages")
            elif user_role == 'driver':
                queryset = queryset.filter(
                    room__customer_id=customer_id,
                    room__driver=self.request.user
                )
                logger.info(f"Driver filter: found {queryset.count()} messages")
            else:
                queryset = queryset.filter(
                    room__customer_id=customer_id,
                    room__driver__isnull=True
                )
                logger.info(f"Admin support filter: found {queryset.count()} messages")
        else:
            if user_role == 'customer':
                queryset = queryset.filter(
                    Q(room__customer=self.request.user, room__driver__isnull=True) |
                    Q(room__isnull=True, sender_type='admin')
                )
            elif user_role == 'driver':
                queryset = queryset.filter(room__isnull=True)
            else:
                queryset = queryset.filter(
                    Q(sender_type='admin') |
                    Q(room__driver__isnull=True)
                )
            logger.info(f"Support chat filter: found {queryset.count()} messages")

        return queryset

    def create(self, request, *args, **kwargs):
        customer_id = request.data.get('customer_id')
        room_id = request.data.get('room_id')
        user_role = getattr(request.user, 'role', 'customer')

        if room_id:
            return self._handle_existing_room_message(request, room_id)

        if not customer_id and not request.data.get('order_id'):
            if user_role == 'customer':
                return self._handle_support_chat(request)
            return Response(
                {'detail': 'customer_id or order_id is required for chat.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.data.get('order_id') and user_role == 'driver' and not customer_id:
            return self._handle_driver_admin_support(request)

        if request.data.get('order_id') and user_role == 'admin' and not customer_id:
            return self._handle_admin_order_support(request)

        if customer_id:
            if user_role == 'customer':
                return self._handle_driver_chat(request, customer_id)
            if user_role == 'driver':
                return self._handle_driver_chat(request, customer_id)
            if user_role == 'admin':
                return self._handle_admin_support_reply(request, customer_id)

        return super().create(request, *args, **kwargs)

    def _handle_driver_chat(self, request, customer_id):
        from orders.models import Order

        order_id = request.data.get('order_id')
        order = None
        if order_id:
            try:
                order = Order.objects.get(id=int(order_id))
            except (Order.DoesNotExist, ValueError):
                pass

        if getattr(request.user, 'role', None) == 'customer':
            room, created = ChatRoom.objects.get_or_create(
                customer=request.user,
                driver_id=int(customer_id),
                defaults={'order': order}
            )
            sender_type = 'customer'
        else:
            room, created = ChatRoom.objects.get_or_create(
                customer_id=int(customer_id),
                driver=request.user,
                defaults={'order': order}
            )
            sender_type = 'driver'

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved_msg = serializer.save(room=room, sender_type=sender_type, sender_id=request.user.id)

        msg_payload = {
            'type': 'chat_message',
            'id': saved_msg.id,
            'message': saved_msg.message,
            'sender_type': sender_type,
            'sender_id': request.user.id,
            'created_at': saved_msg.created_at.isoformat(),
            'room_id': room.id,
        }

        if sender_type == 'customer':
            notify_chat_message(request.user.id, int(customer_id), msg_payload)
        else:
            notify_chat_message(int(customer_id), request.user.id, msg_payload)

        return Response(self.get_serializer(saved_msg).data, status=status.HTTP_201_CREATED)

    def _handle_admin_order_support(self, request):
        from orders.models import Order

        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'detail': 'order_id is required for admin order chat.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=int(order_id))
        except (Order.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'Order tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

        room, created = ChatRoom.objects.get_or_create(
            order=order,
            defaults={
                'customer': order.customer,
                'driver': order.driver,
            }
        )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved_msg = serializer.save(room=room, sender_type='admin', sender_id=request.user.id)

        msg_payload = {
            'type': 'chat_message',
            'id': saved_msg.id,
            'message': saved_msg.message,
            'sender_type': 'admin',
            'sender_id': request.user.id,
            'created_at': saved_msg.created_at.isoformat(),
            'room_id': room.id,
            'order_id': order.id,
        }
        if order.customer_id:
            notify_chat_message(order.customer_id, request.user.id, msg_payload)
        if order.driver_id:
            notify_chat_message(request.user.id, order.driver_id, msg_payload)

        return Response(self.get_serializer(saved_msg).data, status=status.HTTP_201_CREATED)

    def _handle_admin_support_reply(self, request, customer_id):
        try:
            customer_pk = int(customer_id)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'customer_id harus berupa angka yang valid.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_id = request.data.get('order_id')
        room_kwargs = {'customer_id': customer_pk, 'driver': None}
        if order_id:
            from orders.models import Order
            try:
                order = Order.objects.get(id=int(order_id))
                room_kwargs['order'] = order
            except (Order.DoesNotExist, ValueError, TypeError):
                pass

        room, created = ChatRoom.objects.get_or_create(**room_kwargs)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved_msg = serializer.save(room=room, sender_type='admin', sender_id=request.user.id)

        msg_payload = {
            'type': 'chat_message',
            'id': saved_msg.id,
            'message': saved_msg.message,
            'sender_type': 'admin',
            'sender_id': request.user.id,
            'created_at': saved_msg.created_at.isoformat(),
            'room_id': room.id,
        }
        notify_chat_message(int(customer_id), request.user.id, msg_payload)

        return Response(self.get_serializer(saved_msg).data, status=status.HTTP_201_CREATED)

    def _handle_existing_room_message(self, request, room_id):
        try:
            room = ChatRoom.objects.select_related('order', 'customer', 'driver').get(id=int(room_id))
        except (ChatRoom.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'Room tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

        user_role = getattr(request.user, 'role', 'customer')
        if user_role == 'customer':
            sender_type = 'customer'
        elif user_role == 'driver':
            sender_type = 'driver'
        else:
            sender_type = 'admin'

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved_msg = serializer.save(room=room, sender_type=sender_type, sender_id=request.user.id)

        msg_payload = {
            'type': 'chat_message',
            'id': saved_msg.id,
            'message': saved_msg.message,
            'sender_type': sender_type,
            'sender_id': request.user.id,
            'created_at': saved_msg.created_at.isoformat(),
            'room_id': room.id,
            'order_id': room.order.id if room.order else None,
        }

        if user_role == 'admin':
            if room.customer_id:
                notify_chat_message(room.customer_id, request.user.id, msg_payload)
            if room.driver_id:
                notify_chat_message(request.user.id, room.driver_id, msg_payload)
        elif user_role == 'driver' and room.customer_id:
            notify_chat_message(room.customer_id, request.user.id, msg_payload)
        elif user_role == 'customer' and room.driver_id:
            notify_chat_message(room.driver_id, request.user.id, msg_payload)

        return Response(self.get_serializer(saved_msg).data, status=status.HTTP_201_CREATED)

    def _handle_support_chat(self, request):
        # Get or create support room for customer
        try:
            room = ChatRoom.objects.get(customer=request.user, driver__isnull=True)
        except ChatRoom.DoesNotExist:
            room = ChatRoom.objects.create(customer=request.user, driver=None, order=None)
        except ChatRoom.MultipleObjectsReturned:
            room = ChatRoom.objects.filter(customer=request.user, driver__isnull=True).first()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved_msg = serializer.save(room=room, sender_type='customer', sender_id=request.user.id)

        msg_payload = {
            'type': 'chat_message',
            'id': saved_msg.id,
            'message': saved_msg.message,
            'sender_type': 'customer',
            'sender_id': request.user.id,
            'created_at': saved_msg.created_at.isoformat(),
            'room_id': room.id,
        }

        # Notify admin - but since we don't have specific admin, maybe broadcast or handle differently
        # For now, just save the message, admin can fetch it

        return Response(self.get_serializer(saved_msg).data, status=status.HTTP_201_CREATED)
    def driver_admin_chat(self, request):
        """Get or create driver-admin support chat room and fetch messages"""
        user = request.user
        
        if user.role != 'driver':
            return Response(
                {'detail': 'Hanya driver yang dapat mengakses fitur ini'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create support room for driver
        room, created = ChatRoom.objects.get_or_create(
            customer=user,
            driver__isnull=True,
            defaults={'order': None}
        )
        
        # Fetch messages from this room
        messages = room.messages.all().order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        
        return Response({
            'room_id': room.id,
            'customer_id': user.id,
            'driver_id': None,
            'room_type': 'support',
            'messages': serializer.data,
            'created': created
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])

    def history(self, request):
        """Get chat history with order information for admin dashboard"""
        from orders.models import Order
        from users.models import User

        chat_rooms = ChatRoom.objects.annotate(
            latest_time=Max('messages__created_at')
        ).filter(
            latest_time__isnull=False
        ).select_related('order', 'customer', 'driver').prefetch_related('messages').order_by('-latest_time')[:40]

        history_data = []
        for room in chat_rooms:
            # Get latest message
            latest_message = room.messages.order_by('-created_at').first()
            if not latest_message:
                continue

            # Get sender name
            sender_name = "Unknown"
            if latest_message.sender_type == 'customer':
                sender_name = room.customer.get_full_name() or room.customer.username
            elif latest_message.sender_type == 'driver' and room.driver:
                sender_name = room.driver.get_full_name() or room.driver.username

            history_data.append({
                'room_id': room.id,
                'order_code': room.order.order_code if room.order else None,
                'order_id': room.order.id if room.order else None,
                'customer_id': room.customer_id,
                'driver_id': room.driver_id,
                'room_type': 'order' if room.order else 'support',
                'customer_name': room.customer.get_full_name() or room.customer.username,
                'driver_name': room.driver.get_full_name() or room.driver.username if room.driver else 'Support',
                'latest_message': latest_message.message[:100] + '...' if len(latest_message.message) > 100 else latest_message.message,
                'latest_sender': sender_name,
                'latest_sender_type': latest_message.sender_type,
                'latest_time': latest_message.created_at,
                'message_count': room.messages.count(),
                'order_status': room.order.status if room.order else None,
            })

        return Response(history_data)

    # Legacy perform_create is removed; modern chat actions are handled in create() with queue support.