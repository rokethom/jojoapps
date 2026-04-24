from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from orders.models import Order
from .models import Notification
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Order)
def send_order_notifications(sender, instance, created, **kwargs):
    """Send notifications when order is created or updated"""
    if created:
        # Order baru dibuat - kirim notifikasi ke driver dan customer
        send_order_created_notifications(instance)
    else:
        # Order diupdate - cek status changes
        if hasattr(instance, '_original_status'):
            old_status = instance._original_status
            new_status = instance.status
            if old_status != new_status:
                send_order_status_change_notifications(instance, old_status, new_status)


def send_order_created_notifications(order):
    """Send notifications when a new order is created"""
    try:
        # Notifikasi ke customer
        customer_notification = Notification.objects.create(
            recipient=order.customer,
            title="Order Created",
            message=f"Your order #{order.order_code} has been created and is being processed.",
            notification_type="order_created",
            priority=3,  # High priority
            order=order,
            branch=order.branch,
            data={
                'order_id': str(order.id),
                'order_code': order.order_code,
                'branch_id': str(order.branch.id) if order.branch else None,
                'status': order.status,
            }
        )

        # Kirim push notification ke customer
        customer_notification.send_push_notification()

        # Notifikasi ke semua driver aktif di cabang yang sama
        from users.models import User
        drivers = User.objects.filter(
            role='driver',
            branch=order.branch,
            is_active=True
        )

        for driver in drivers:
            driver_notification = Notification.objects.create(
                recipient=driver,
                title="New Order Available",
                message=f"New order #{order.order_code} is available for pickup.",
                notification_type="order_created",
                priority=4,  # Urgent priority
                order=order,
                branch=order.branch,
                data={
                    'order_id': str(order.id),
                    'order_code': order.order_code,
                    'branch_id': str(order.branch.id) if order.branch else None,
                    'customer_name': order.customer.name or order.customer.username,
                    'pickup_address': order.pickup_location,
                    'delivery_address': order.drop_location,
                }
            )

            # Kirim push notification ke driver
            driver_notification.send_push_notification()

        logger.info(f"Order created notifications sent for order {order.order_code}")

    except Exception as e:
        logger.error(f"Failed to send order created notifications: {e}")


def send_order_status_change_notifications(order, old_status, new_status):
    """Send notifications when order status changes"""
    try:
        status_messages = {
            'assigned': {
                'customer': f"Your order #{order.order_code} has been assigned to a driver.",
                'driver': f"You have been assigned to order #{order.order_code}.",
                'priority': 3
            },
            'picked_up': {
                'customer': f"Your order #{order.order_code} has been picked up by the driver.",
                'driver': f"You have picked up order #{order.order_code}.",
                'priority': 2
            },
            'in_transit': {
                'customer': f"Your order #{order.order_code} is on the way.",
                'driver': f"Order #{order.order_code} is now in transit.",
                'priority': 2
            },
            'delivered': {
                'customer': f"Your order #{order.order_code} has been delivered successfully.",
                'driver': f"You have successfully delivered order #{order.order_code}.",
                'priority': 3
            },
            'cancelled': {
                'customer': f"Your order #{order.order_code} has been cancelled.",
                'driver': f"Order #{order.order_code} has been cancelled.",
                'priority': 4
            }
        }

        if new_status in status_messages:
            message_config = status_messages[new_status]
            order_data = {
                'order_id': str(order.id),
                'order_code': order.order_code,
                'old_status': old_status,
                'new_status': new_status,
            }
            if order.driver:
                order_data['driver_id'] = str(order.driver.id)
                order_data['driver_name'] = order.driver.name or order.driver.username

            # Notifikasi ke customer
            customer_notification = Notification.objects.create(
                recipient=order.customer,
                title=f"Order {new_status.replace('_', ' ').title()}",
                message=message_config['customer'],
                notification_type="order_assigned" if new_status == 'assigned' else f"order_{new_status}",
                priority=message_config['priority'],
                order=order,
                branch=order.branch,
                data=order_data
            )
            customer_notification.send_push_notification()

            # Notifikasi ke driver jika order sudah assigned
            if order.driver:
                driver_notification = Notification.objects.create(
                    recipient=order.driver,
                    title=f"Order {new_status.replace('_', ' ').title()}",
                    message=message_config['driver'],
                    notification_type="order_assigned" if new_status == 'assigned' else f"order_{new_status}",
                    priority=message_config['priority'],
                    order=order,
                    branch=order.branch,
                    data=order_data
                )
                driver_notification.send_push_notification()

        logger.info(f"Order status change notifications sent for order {order.order_code}: {old_status} -> {new_status}")

    except Exception as e:
        logger.error(f"Failed to send order status change notifications: {e}")


@receiver(post_save, sender=Order)
def track_order_status_changes(sender, instance, **kwargs):
    """Track original status for status change detection"""
    if not hasattr(instance, '_original_status'):
        instance._original_status = instance.status