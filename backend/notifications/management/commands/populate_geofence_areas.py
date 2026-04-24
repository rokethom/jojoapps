from django.core.management.base import BaseCommand
from branch.models import Branch, GeofenceArea


class Command(BaseCommand):
    help = 'Populate default geofence areas for branches'

    def handle(self, *args, **options):
        # Get all branches
        branches = Branch.objects.all()

        if not branches:
            self.stdout.write(
                self.style.WARNING('No branches found. Please create branches first.')
            )
            return

        geofence_data = [
            {
                'name': 'Central Area',
                'description': 'Main service area around branch center',
                'radius_meters': 2000,  # 2km radius
                'priority': 1,
            },
            {
                'name': 'Extended Area',
                'description': 'Extended service area for special cases',
                'radius_meters': 5000,  # 5km radius
                'priority': 2,
            },
        ]

        total_created = 0

        for branch in branches:
            if not branch.latitude or not branch.longitude:
                self.stdout.write(
                    self.style.WARNING(
                        f'Skipping branch {branch.name}: missing coordinates'
                    )
                )
                continue

            for geofence_info in geofence_data:
                geofence, created = GeofenceArea.objects.get_or_create(
                    branch=branch,
                    name=geofence_info['name'],
                    defaults={
                        'description': geofence_info['description'],
                        'center_latitude': branch.latitude,
                        'center_longitude': branch.longitude,
                        'radius_meters': geofence_info['radius_meters'],
                        'priority': geofence_info['priority'],
                        'is_active': True,
                    }
                )

                if created:
                    total_created += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created geofence: {geofence.name} for {branch.name}'
                        )
                    )
                else:
                    self.stdout.write(
                        f'Geofence already exists: {geofence.name} for {branch.name}'
                    )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {total_created} geofence areas')
        )