from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from orders.models import Order
from users.models import User
from branch.models import Branch
from settlement.models import DriverSettlement, SettlementDetail


class Command(BaseCommand):
    help = 'Generate driver settlements for a given period'

    def add_arguments(self, parser):
        parser.add_argument(
            '--period',
            type=str,
            default='30_days',
            choices=['5_days', '15_days', '30_days'],
            help='Settlement period (5_days, 15_days, or 30_days)'
        )
        parser.add_argument(
            '--driver-id',
            type=int,
            help='Generate for specific driver ID'
        )
        parser.add_argument(
            '--branch-id',
            type=int,
            help='Generate for specific branch ID'
        )

    def handle(self, *args, **options):
        period = options['period']
        driver_id = options.get('driver_id')
        branch_id = options.get('branch_id')

        # Determine date range
        if period == '5_days':
            start_date = timezone.now().date() - timedelta(days=5)
        elif period == '15_days':
            start_date = timezone.now().date() - timedelta(days=15)
        else:  # 30_days
            start_date = timezone.now().date() - timedelta(days=30)

        end_date = timezone.now().date()

        # Get drivers
        drivers = User.objects.filter(role='driver')
        if driver_id:
            drivers = drivers.filter(id=driver_id)

        # Get branches
        branches = Branch.objects.all()
        if branch_id:
            branches = branches.filter(id=branch_id)

        settlement_count = 0

        for driver in drivers:
            for branch in branches:
                # Get completed orders
                orders = Order.objects.filter(
                    driver=driver,
                    branch=branch,
                    status__in=['done', 'on_delivery'],
                    created_at__date__gte=start_date,
                    created_at__date__lte=end_date
                )

                if not orders.exists():
                    continue

                # Create or get settlement
                settlement, created = DriverSettlement.objects.get_or_create(
                    driver=driver,
                    branch=branch,
                    period=period,
                    period_start=start_date,
                    period_end=end_date
                )

                # Calculate settlement
                settlement.calculate_settlement(orders)
                settlement.save()

                # Delete old detail items
                SettlementDetail.objects.filter(settlement=settlement).delete()

                # Create detail items
                for order in orders:
                    estimated_tarif = order.final_price * Decimal('0.8') if order.final_price else Decimal(0)
                    estimated_service_fee = order.final_price * Decimal('0.2') if order.final_price else Decimal(0)

                    deduction = settlement._calculate_order_deduction(estimated_tarif)

                    SettlementDetail.objects.create(
                        settlement=settlement,
                        order=order,
                        order_code=order.order_code,
                        tarif=estimated_tarif,
                        service_fee=estimated_service_fee,
                        total_price=order.final_price or Decimal(0),
                        deduction=deduction,
                        settlement_amount=(order.final_price or Decimal(0)) - deduction,
                        pickup_location=order.pickup_location,
                        drop_location=order.drop_location,
                        completed_at=order.created_at
                    )

                settlement_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {driver.get_full_name()} - {branch.name}: '
                        f'{settlement.total_orders} orders, '
                        f'Settlement: Rp {settlement.settlement_amount:,.0f}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Successfully generated {settlement_count} settlements for {period}')
        )
