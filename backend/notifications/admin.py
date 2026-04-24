from django.contrib import admin
from .models import DeviceToken, Notification, NotificationTemplate


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_type', 'device_id', 'is_active', 'last_used', 'created_at']
    list_filter = ['device_type', 'is_active', 'created_at']
    search_fields = ['user__username', 'device_id', 'token']
    readonly_fields = ['token']  # Hide token for security


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'recipient', 'title', 'notification_type', 'priority',
        'is_read', 'is_sent', 'is_spam_blocked', 'created_at'
    ]
    list_filter = [
        'notification_type', 'priority', 'is_read', 'is_sent',
        'is_spam_blocked', 'created_at'
    ]
    search_fields = ['recipient__username', 'title', 'message']
    readonly_fields = ['is_sent', 'sent_at', 'delivery_error', 'read_at']
    ordering = ['-created_at']

    def has_add_permission(self, request):
        # Prevent manual creation of notifications
        return False


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'notification_type', 'priority', 'is_active', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_active']
    search_fields = ['name', 'title_template', 'message_template']
