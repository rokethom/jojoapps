from django.contrib import admin
from django.utils.html import format_html, mark_safe
from django.urls import reverse
from django.contrib import messages
from django.shortcuts import redirect
from .models import ChatRoom, ChatMessage


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_link', 'customer_name', 'driver_name', 'message_count', 'last_message_time', 'order_status')
    list_filter = ('order__status', 'customer', 'driver')
    search_fields = ('order__order_code', 'customer__username', 'customer__first_name', 'customer__last_name',
                     'driver__username', 'driver__first_name', 'driver__last_name')
    readonly_fields = ('id', 'order', 'customer', 'driver', 'created_at_display', 'message_count', 'last_message_preview')
    ordering = ('-order__created_at',)
    actions = ['view_messages']

    def view_messages(self, request, queryset):
        if queryset.count() == 1:
            room = queryset.first()
            try:
                url = reverse('admin:chat_chatmessage_changelist') + f"?room__id__exact={room.id}"
                return redirect(url)
            except:
                self.message_user(request, "Could not navigate to messages.", messages.ERROR)
                return
        self.message_user(request, "Please select exactly one chat room to view messages.", messages.WARNING)
    view_messages.short_description = "View messages for selected chat room"

    def order_link(self, obj):
        if obj.order:
            url = reverse('admin:orders_order_change', args=[obj.order.id])
            return format_html('<a href="{}" style="color: #007bff; font-weight: bold;">{}</a>',
                             url, obj.order.order_code)
        return '-'
    order_link.short_description = 'Order'
    order_link.admin_order_field = 'order__order_code'

    def customer_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.username
    customer_name.short_description = 'Customer'
    customer_name.admin_order_field = 'customer__username'

    def driver_name(self, obj):
        if obj.driver:
            return obj.driver.get_full_name() or obj.driver.username
        return mark_safe('<span style="color: #6c757d; font-style: italic;">Unassigned</span>')
    driver_name.short_description = 'Driver'
    driver_name.admin_order_field = 'driver__username'

    def message_count(self, obj):
        count = obj.messages.count()
        if count > 0:
            return format_html('<span style="background: #007bff; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">{}</span>', count)
        return mark_safe('<span style="color: #6c757d;">0</span>')
    message_count.short_description = 'Messages'

    def last_message_time(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return last_msg.created_at.strftime('%d/%m/%Y %H:%M')
        return '-'
    last_message_time.short_description = 'Last Message'
    last_message_time.admin_order_field = 'messages__created_at'

    def order_status(self, obj):
        if obj.order:
            status = obj.order.status
            color_map = {
                'pending': '#ffc107',
                'accepted': '#007bff',
                'in_progress': '#28a745',
                'done': '#6c757d',
                'cancelled': '#dc3545'
            }
            color = color_map.get(status, '#6c757d')
            return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase;">{}</span>',
                             color, status.replace('_', ' '))
        return '-'
    order_status.short_description = 'Status'
    order_status.admin_order_field = 'order__status'

    def created_at_display(self, obj):
        return obj.order.created_at.strftime('%d/%m/%Y %H:%M:%S') if obj.order else '-'
    created_at_display.short_description = 'Created At'

    def last_message_preview(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            sender = self._get_sender_name(last_msg)
            preview = last_msg.message[:100] + '...' if len(last_msg.message) > 100 else last_msg.message
            return format_html('<div style="background: #f8f9fa; padding: 8px; border-radius: 4px; border-left: 3px solid #007bff;">'
                             '<strong>{}:</strong> {}<br>'
                             '<small style="color: #6c757d;">{}</small>'
                             '</div>',
                             sender, preview, last_msg.created_at.strftime('%d/%m/%Y %H:%M'))
        return mark_safe('<span style="color: #6c757d; font-style: italic;">No messages yet</span>')
    last_message_preview.short_description = 'Last Message Preview'

    def _get_sender_name(self, message):
        if message.sender_type == 'customer':
            try:
                from users.models import User
                user = User.objects.get(id=message.sender_id)
                return user.get_full_name() or user.username
            except:
                return f"Customer #{message.sender_id}"
        elif message.sender_type == 'driver':
            try:
                from users.models import User
                user = User.objects.get(id=message.sender_id)
                return user.get_full_name() or user.username
            except:
                return f"Driver #{message.sender_id}"
        return message.sender_type

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'order', 'customer', 'driver')
        }),
        ('Chat Details', {
            'fields': ('message_count', 'created_at_display', 'last_message_preview')
        }),
    )

    def has_add_permission(self, request):
        return False  # Chat rooms are created automatically

    def has_delete_permission(self, request, obj=None):
        return False  # Prevent accidental deletion


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'room_link', 'sender_display', 'message_preview', 'created_at_formatted', 'message_type')
    list_filter = ('sender_type', 'created_at', 'room__order__status')
    search_fields = ('message', 'sender_id', 'room__order__order_code')
    readonly_fields = ('id', 'room_info', 'sender_info', 'message_content', 'created_at')
    ordering = ('-created_at',)
    list_per_page = 50
    date_hierarchy = 'created_at'
    actions = ['view_chat_room']

    def view_chat_room(self, request, queryset):
        if queryset.count() == 1:
            message = queryset.first()
            if message.room and message.room.id:
                try:
                    url = reverse('admin:chat_chatroom_change', args=[message.room.id])
                    return redirect(url)
                except:
                    self.message_user(request, "Could not navigate to chat room.", messages.ERROR)
                    return
        self.message_user(request, "Please select exactly one message to view its chat room.", messages.WARNING)
    view_chat_room.short_description = "View chat room for selected message"

    def room_link(self, obj):
        if obj.room and obj.room.id:
            try:
                url = reverse('admin:chat_chatroom_change', args=[obj.room.id])
                order_code = obj.room.order.order_code if obj.room.order else f"Room #{obj.room.id}"
                return format_html('<a href="{}" style="color: #007bff;">{}</a>', url, order_code)
            except:
                return f"Room #{obj.room.id if obj.room else 'N/A'}"
        return '-'
    room_link.short_description = 'Chat Room'

    def sender_display(self, obj):
        sender_name = self._get_sender_name(obj)
        color = '#28a745' if obj.sender_type == 'customer' else '#007bff' if obj.sender_type == 'driver' else '#6c757d'
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, sender_name)
    sender_display.short_description = 'Sender'

    def message_preview(self, obj):
        preview = obj.message[:80] + '...' if len(obj.message) > 80 else obj.message
        return format_html('<span style="font-family: monospace; background: #f8f9fa; padding: 2px 4px; border-radius: 3px;">{}</span>', preview)
    message_preview.short_description = 'Message Preview'

    def created_at_formatted(self, obj):
        return obj.created_at.strftime('%d/%m/%Y %H:%M:%S')
    created_at_formatted.short_description = 'Time'
    created_at_formatted.admin_order_field = 'created_at'

    def message_type(self, obj):
        if obj.sender_type == 'customer':
            return mark_safe('<span style="background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 10px; font-size: 11px;">Customer</span>')
        elif obj.sender_type == 'driver':
            return mark_safe('<span style="background: #cce5ff; color: #004085; padding: 2px 6px; border-radius: 10px; font-size: 11px;">Driver</span>')
        else:
            return format_html('<span style="background: #f8f9fa; color: #6c757d; padding: 2px 6px; border-radius: 10px; font-size: 11px;">{}</span>', obj.sender_type)
    message_type.short_description = 'Type'

    def room_info(self, obj):
        if obj.room:
            info = []
            if obj.room.order:
                info.append(f"Order: {obj.room.order.order_code}")
                info.append(f"Status: {obj.room.order.status}")
            info.append(f"Customer: {obj.room.customer.get_full_name() or obj.room.customer.username}")
            if obj.room.driver:
                info.append(f"Driver: {obj.room.driver.get_full_name() or obj.room.driver.username}")
            else:
                info.append("Driver: Unassigned")

            return format_html('<div style="background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6;">'
                             '<strong>Chat Room #{}</strong><br>{}'
                             '</div>', obj.room.id, '<br>'.join(info))
        return '-'
    room_info.short_description = 'Room Information'

    def sender_info(self, obj):
        sender_name = self._get_sender_name(obj)
        return format_html('<div style="background: #f8f9fa; padding: 8px; border-radius: 4px;">'
                         '<strong>{}</strong> (ID: {})<br>'
                         '<small>Type: {}</small>'
                         '</div>', sender_name, obj.sender_id, obj.sender_type)
    sender_info.short_description = 'Sender Information'

    def message_content(self, obj):
        return format_html('<div style="background: #f8f9fa; padding: 12px; border-radius: 4px; border-left: 3px solid #007bff; '
                         'font-family: monospace; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">{}</div>', obj.message)
    message_content.short_description = 'Full Message'

    def _get_sender_name(self, message):
        try:
            from users.models import User
            user = User.objects.get(id=message.sender_id)
            return user.get_full_name() or user.username
        except:
            return f"{message.sender_type} #{message.sender_id}"

    fieldsets = (
        ('Message Details', {
            'fields': ('id', 'room_info', 'sender_info', 'message_content', 'created_at')
        }),
    )

    def has_add_permission(self, request):
        return False  # Messages are created through API

    def has_change_permission(self, request, obj=None):
        return False  # Messages should be read-only

    def has_delete_permission(self, request, obj=None):
        return False  # Prevent accidental deletion