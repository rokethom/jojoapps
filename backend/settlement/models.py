from django.db import models
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


class DriverSettlement(models.Model):
    """
    Model untuk mencatat setoran/settlement driver.
    Menyimpan detail setoran per periode waktu.
    """
    PERIOD_CHOICES = (
        ('5_days', '5 Hari'),
        ('15_days', '15 Hari'),
        ('30_days', '30 Hari'),
    )

    driver = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='settlements')
    branch = models.ForeignKey('branch.Branch', on_delete=models.CASCADE)
    
    # Periode
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Total order dalam periode
    total_orders = models.IntegerField(default=0)
    
    # Perhitungan harga (dipisah untuk clarity)
    # Total tarif jarak (tanpa service fee)
    total_tarif = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Total service fee (bunga per titik)
    total_service_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Total prix sebelum potongan
    gross_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Detail Potongan Setoran (20%)
    # Ring 1: 1k untuk tarif 5k (20% dari 5k)
    # Ring 2: 2k untuk tarif 10k (20% dari 10k)
    # >10km: 20% dari tarif dasar tanpa service fee
    # Max: 20% dari 50k = 10k
    deduction_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deduction_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=20)  # Default 20%
    
    # Total yang harus dibayarkan setelah potongan
    settlement_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Status pembayaran
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('driver', 'branch', 'period', 'period_start', 'period_end')
        ordering = ['-period_end', '-created_at']
    
    def __str__(self):
        return f"{self.driver.get_full_name() or self.driver.username} - {self.period} ({self.period_start} to {self.period_end})"
    
    def save(self, *args, **kwargs):
        """Handle driver suspension/unsuspension based on settlement status."""
        is_new = not self.pk
        old_status = None
        
        # Get old status if updating
        if not is_new:
            try:
                old = DriverSettlement.objects.get(pk=self.pk)
                old_status = old.status
            except DriverSettlement.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Handle status changes
        if old_status != self.status:
            if self.status == 'overdue':
                # Suspend driver
                self.driver.is_suspended = True
                self.driver.suspension_reason = f"Overdue settlement period: {self.period_start} to {self.period_end}"
                self.driver.save()
            elif self.status == 'paid' and old_status == 'overdue':
                # Unsuspend driver if previously overdue
                self.driver.is_suspended = False
                self.driver.suspension_reason = ""
                self.driver.save()
    
    def calculate_settlement(self, orders):
        """
        Hitung settlement berdasarkan orders yang diberikan.
        
        Rumus potongan (20%):
        - Ring 1 (tarif 0-5k): potong 1k (20% dari 5k)
        - Ring 2 (tarif 5k-10k): potong 2k (20% dari 10k)
        - Tarif > 10k: potong 20% dari tarif (tidak termasuk service fee)
        - Max potong: 20% dari 50k = 10k
        
        Jika ada pemesanan dengan tarif > 50k, maka yang dipotong hanya 10k.
        """
        self.total_orders = orders.count()
        self.total_tarif = Decimal(0)
        self.total_service_fee = Decimal(0)
        self.deduction_amount = Decimal(0)
        
        for order in orders:
            if order.final_price:
                estimated_tarif = order.final_price * Decimal('0.8')
                estimated_service_fee = order.final_price * Decimal('0.2')

                self.total_tarif += estimated_tarif
                self.total_service_fee += estimated_service_fee

                order_deduction = self._calculate_order_deduction(estimated_tarif)
                self.deduction_amount += order_deduction

        # Hitung gross total
        self.gross_total = self.total_tarif + self.total_service_fee

        self.settlement_amount = self.gross_total - self.deduction_amount
    
    @staticmethod
    def _calculate_order_deduction(tarif):
        """
        Hitung potongan untuk satu order berdasarkan tarif.

        Ring 1 (tarif 0-5k): potong 1k
        Ring 2 (tarif 5k-10k): potong 2k
        Di atas 10k: potong 20% dari tarif dasar (tanpa service fee)
        Maksimal per order: 10k (20% dari 50k)
        """
        tarif = Decimal(str(tarif))

        if tarif <= Decimal(5000):
            return Decimal(1000)
        elif tarif <= Decimal(10000):
            return Decimal(2000)
        else:
            return min((tarif * Decimal('0.20')).quantize(Decimal('1.00')), Decimal(10000))


class SettlementDetail(models.Model):
    """
    Detail line item untuk setiap order dalam settlement.
    Memudahkan audit dan transparency.
    """
    settlement = models.ForeignKey(DriverSettlement, on_delete=models.CASCADE, related_name='detail_items')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE)
    
    order_code = models.CharField(max_length=50)
    
    # Breakdown harga
    tarif = models.DecimalField(max_digits=12, decimal_places=2)
    service_fee = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Deduction
    deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Settlement untuk order ini
    settlement_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    pickup_location = models.TextField()
    drop_location = models.TextField()
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['order__created_at']
    
    def __str__(self):
        return f"{self.order_code} - {self.settlement_amount}"

    @property
    def distance(self):
        order = self.order
        if not all([order.pickup_lat, order.pickup_lng, order.drop_lat, order.drop_lng]):
            return 0

        from math import radians, sin, cos, sqrt, atan2

        lat1, lon1 = float(order.pickup_lat), float(order.pickup_lng)
        lat2, lon2 = float(order.drop_lat), float(order.drop_lng)

        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        distance_km = 6371 * c
        return round(distance_km, 2)
