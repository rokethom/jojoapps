from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class DeviceToken(models.Model):
    """Store FCM device tokens for push notifications"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_tokens')
    token = models.CharField(max_length=255, unique=True, help_text="FCM device token")
    device_type = models.CharField(max_length=20, choices=[
        ('android', 'Android'),
        ('ios', 'iOS'),
        ('web', 'Web'),
    ], default='android')
    device_id = models.CharField(max_length=100, blank=True, help_text="Unique device identifier")

    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'device_id']

    def __str__(self):
        return f"{self.user.username} - {self.device_type} - {self.device_id}"


class Notification(models.Model):
    """Smart notification system with priority and anti-spam"""
    PRIORITY_CHOICES = [
        (1, 'Low'),
        (2, 'Normal'),
        (3, 'High'),
        (4, 'Urgent'),
        (5, 'Critical'),
    ]

    TYPE_CHOICES = [
        ('order_created', 'Order Created'),
        ('order_assigned', 'Order Assigned'),
        ('order_completed', 'Order Completed'),
        ('order_cancelled', 'Order Cancelled'),
        ('driver_nearby', 'Driver Nearby'),
        ('chat_message', 'Chat Message'),
        ('system_alert', 'System Alert'),
        ('geofence_alert', 'Geofence Alert'),
        ('location_suspicious', 'Suspicious Location'),
    ]

    # Recipients
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='sent_notifications')

    # Content
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=2)

    # Related objects (optional)
    order = models.ForeignKey('orders.Order', null=True, blank=True, on_delete=models.SET_NULL)
    branch = models.ForeignKey('branch.Branch', null=True, blank=True, on_delete=models.SET_NULL)

    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Delivery status
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivery_error = models.TextField(blank=True)

    # Anti-spam protection
    is_spam_blocked = models.BooleanField(default=False)
    spam_reason = models.TextField(blank=True)

    # Metadata
    data = models.JSONField(default=dict, help_text="Additional data for the notification")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['notification_type', '-created_at']),
            models.Index(fields=['is_read', '-created_at']),
            models.Index(fields=['priority', '-created_at']),
        ]

    def __str__(self):
        return f"{self.recipient.username}: {self.title} ({self.get_priority_display()})"

    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def check_spam_protection(self):
        """Check if this notification should be blocked due to spam protection"""
        from django.conf import settings
        from django.db.models import Count

        spam_settings = settings.NOTIFICATION_SPAM_PROTECTION

        # Check notifications in the last hour
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_count = Notification.objects.filter(
            recipient=self.recipient,
            created_at__gte=one_hour_ago
        ).count()

        if recent_count >= spam_settings['MAX_NOTIFICATIONS_PER_HOUR']:
            self.is_spam_blocked = True
            self.spam_reason = f"Exceeded max notifications per hour ({spam_settings['MAX_NOTIFICATIONS_PER_HOUR']})"
            return True

        # Check minimum interval between notifications
        last_notification = Notification.objects.filter(
            recipient=self.recipient,
            notification_type=self.notification_type
        ).order_by('-created_at').first()

        if last_notification:
            time_diff = (timezone.now() - last_notification.created_at).total_seconds()
            if time_diff < spam_settings['MIN_INTERVAL_SECONDS']:
                self.is_spam_blocked = True
                self.spam_reason = f"Minimum interval not met ({spam_settings['MIN_INTERVAL_SECONDS']}s)"
                return True

        return False

    def send_push_notification(self):
        """Send push notification via FCM"""
        from .fcm_utils import send_fcm_notification

        if self.is_spam_blocked:
            return False, "Notification blocked due to spam protection"

        # Get active device tokens for the recipient
        device_tokens = DeviceToken.objects.filter(
            user=self.recipient,
            is_active=True
        ).values_list('token', flat=True)

        if not device_tokens:
            return False, "No active device tokens found"

        # Prepare notification data - FCM requires all values to be strings
        import json
        notification_data = {
            'title': self.title,
            'body': self.message,
            'notification_type': self.notification_type,
            'priority': str(self.priority),
            'order_id': str(self.order.id) if self.order else None,
            'branch_id': str(self.branch.id) if self.branch else None,
            'data': json.dumps(self.data) if self.data else '{}',
        }

        # Send FCM notification
        success, error = send_fcm_notification(
            tokens=list(device_tokens),
            title=self.title,
            body=self.message,
            data=notification_data,
            priority='high' if self.priority >= 4 else 'normal'
        )

        if success:
            self.is_sent = True
            self.sent_at = timezone.now()
        else:
            self.delivery_error = error

        self.save(update_fields=['is_sent', 'sent_at', 'delivery_error'])
        return success, error


class NotificationTemplate(models.Model):
    """Templates for different types of notifications"""
    name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(max_length=50, choices=Notification.TYPE_CHOICES)
    title_template = models.CharField(max_length=200, help_text="Template for notification title")
    message_template = models.TextField(help_text="Template for notification message")
    priority = models.IntegerField(choices=Notification.PRIORITY_CHOICES, default=2)

    # Template variables (JSON schema)
    variables_schema = models.JSONField(default=dict, help_text="Schema for template variables")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.get_notification_type_display()})"

    def render(self, **variables):
        """Render template with variables"""
        from django.template import Template, Context

        title_template = Template(self.title_template)
        message_template = Template(self.message_template)

        context = Context(variables)

        return {
            'title': title_template.render(context),
            'message': message_template.render(context),
            'priority': self.priority,
        }
