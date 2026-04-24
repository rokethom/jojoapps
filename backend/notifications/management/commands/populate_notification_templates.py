from django.core.management.base import BaseCommand
from notifications.models import NotificationTemplate


class Command(BaseCommand):
    help = 'Populate default notification templates'

    def handle(self, *args, **options):
        templates = [
            {
                'name': 'order_created_customer',
                'notification_type': 'order_created',
                'title_template': 'Order Created',
                'message_template': 'Your order #{{ order_code }} has been created and is being processed.',
                'priority': 3,
            },
            {
                'name': 'order_created_driver',
                'notification_type': 'order_created',
                'title_template': 'New Order Available',
                'message_template': 'New order #{{ order_code }} is available for pickup from {{ customer_name }}.',
                'priority': 4,
            },
            {
                'name': 'order_assigned_customer',
                'notification_type': 'order_assigned',
                'title_template': 'Order Assigned',
                'message_template': 'Your order #{{ order_code }} has been assigned to a driver.',
                'priority': 3,
            },
            {
                'name': 'order_assigned_driver',
                'notification_type': 'order_assigned',
                'title_template': 'Order Assigned',
                'message_template': 'You have been assigned to order #{{ order_code }}.',
                'priority': 4,
            },
            {
                'name': 'order_picked_up',
                'notification_type': 'order_picked_up',
                'title_template': 'Order Picked Up',
                'message_template': 'Your order #{{ order_code }} has been picked up by the driver.',
                'priority': 2,
            },
            {
                'name': 'order_in_transit',
                'notification_type': 'order_in_transit',
                'title_template': 'Order In Transit',
                'message_template': 'Your order #{{ order_code }} is on the way.',
                'priority': 2,
            },
            {
                'name': 'order_delivered',
                'notification_type': 'order_delivered',
                'title_template': 'Order Delivered',
                'message_template': 'Your order #{{ order_code }} has been delivered successfully.',
                'priority': 3,
            },
            {
                'name': 'order_cancelled',
                'notification_type': 'order_cancelled',
                'title_template': 'Order Cancelled',
                'message_template': 'Your order #{{ order_code }} has been cancelled.',
                'priority': 4,
            },
            {
                'name': 'driver_nearby',
                'notification_type': 'driver_nearby',
                'title_template': 'Driver Nearby',
                'message_template': 'Your driver is nearby and will arrive soon.',
                'priority': 2,
            },
            {
                'name': 'location_suspicious',
                'notification_type': 'location_suspicious',
                'title_template': 'Suspicious Location Detected',
                'message_template': 'Your location appears suspicious. Please check your GPS settings.',
                'priority': 4,
            },
            {
                'name': 'geofence_alert',
                'notification_type': 'geofence_alert',
                'title_template': 'Geofence Alert',
                'message_template': 'You are outside the designated service area.',
                'priority': 3,
            },
        ]

        created_count = 0
        updated_count = 0

        for template_data in templates:
            template, created = NotificationTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}')
                )
            else:
                # Update existing template
                for key, value in template_data.items():
                    setattr(template, key, value)
                template.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated template: {template.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {created_count + updated_count} notification templates '
                f'({created_count} created, {updated_count} updated)'
            )
        )