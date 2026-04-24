from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import DeviceToken, Notification, NotificationTemplate
from .serializers import (
    DeviceTokenSerializer,
    NotificationSerializer,
    NotificationTemplateSerializer
)


class DeviceTokenViewSet(viewsets.ModelViewSet):
    """Manage device tokens for push notifications"""
    serializer_class = DeviceTokenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DeviceToken.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register or update device token"""
        token = request.data.get('token')
        device_type = request.data.get('device_type', 'android')
        device_id = request.data.get('device_id', '')

        if not token:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if token already exists for another user
        existing_token = DeviceToken.objects.filter(token=token).first()
        if existing_token and existing_token.user != request.user:
            # Remove token from old user
            existing_token.delete()

        # Create or update token for current user
        device_token, created = DeviceToken.objects.get_or_create(
            user=request.user,
            device_id=device_id,
            defaults={
                'token': token,
                'device_type': device_type,
                'is_active': True
            }
        )

        if not created:
            device_token.token = token
            device_token.device_type = device_type
            device_token.is_active = True
            device_token.save()

        serializer = self.get_serializer(device_token)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def unregister(self, request):
        """Unregister device token"""
        token = request.data.get('token')
        device_id = request.data.get('device_id')

        if token:
            DeviceToken.objects.filter(
                user=request.user,
                token=token
            ).update(is_active=False)
        elif device_id:
            DeviceToken.objects.filter(
                user=request.user,
                device_id=device_id
            ).update(is_active=False)
        else:
            return Response(
                {'error': 'Token or device_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'message': 'Device unregistered successfully'})


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """View and manage notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'message': 'All notifications marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})


class NotificationTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """View notification templates (admin only)"""
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated]
    queryset = NotificationTemplate.objects.filter(is_active=True)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_test_notification(request):
    """Send test notification to current user"""
    from .models import Notification

    title = request.data.get('title', 'Test Notification')
    message = request.data.get('message', 'This is a test notification')
    notification_type = request.data.get('type', 'system_alert')

    # Create notification
    notification = Notification.objects.create(
        recipient=request.user,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=2
    )

    # Send push notification
    success, error = notification.send_push_notification()

    return Response({
        'notification_id': notification.id,
        'push_sent': success,
        'error': error
    }, status=status.HTTP_201_CREATED)
