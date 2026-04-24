from rest_framework import serializers
from .models import DeviceToken, Notification, NotificationTemplate


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = [
            'id', 'token', 'device_type', 'device_id',
            'is_active', 'last_used', 'created_at'
        ]
        read_only_fields = ['id', 'last_used', 'created_at']
        extra_kwargs = {
            'token': {'write_only': True}  # Don't expose tokens in API responses
        }


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    order_code = serializers.CharField(source='order.order_code', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_name',
            'title', 'message', 'notification_type', 'priority',
            'order', 'order_code', 'branch', 'branch_name',
            'is_read', 'read_at', 'is_sent', 'sent_at',
            'is_spam_blocked', 'spam_reason', 'data',
            'created_at'
        ]
        read_only_fields = [
            'id', 'recipient', 'sender', 'sender_name',
            'is_sent', 'sent_at', 'is_spam_blocked', 'spam_reason',
            'created_at', 'read_at'
        ]


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'notification_type', 'title_template',
            'message_template', 'priority', 'variables_schema',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']