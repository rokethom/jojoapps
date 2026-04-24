from django.db import models
from django.utils import timezone
import time
import random


class SnowflakeID:
    """
    Simple Snowflake-like ID generator to avoid collisions.
    Format: timestamp (42 bits) + machine_id (5 bits) + sequence (12 bits)
    """
    EPOCH = 1609459200000  # 2021-01-01 00:00:00 UTC
    MACHINE_ID = random.randint(0, 31)  # 5 bits
    sequence = 0
    last_timestamp = -1

    @classmethod
    def generate(cls):
        timestamp = int(time.time() * 1000) - cls.EPOCH

        if timestamp == cls.last_timestamp:
            cls.sequence = (cls.sequence + 1) & 4095  # 12 bits max
        else:
            cls.sequence = 0

        cls.last_timestamp = timestamp

        # Generate 64-bit ID: timestamp(42) + machine_id(5) + sequence(12)
        snowflake_id = (timestamp << 17) | (cls.MACHINE_ID << 12) | cls.sequence

        return snowflake_id


class Order(models.Model):
    STATUS = (
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('on_delivery', 'On Delivery'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    )

    SERVICE_TYPES = (
        ('ojek', 'Ojek'),
        ('delivery', 'Delivery'),
        ('kurir', 'Kurir'),
        ('belanja', 'Belanja'),
        ('mobil', 'Mobil'),
        ('travel', 'Travel'),
        ('gift', 'Gift'),
        ('jojosehat', 'Jojo Sehat'),
        ('epajak', 'E-Pajak'),
        ('etilang', 'Etilang'),
        ('joker_mobil', 'Joker Mobil'),
    )

    SERVICE_CODE_MAP = {
        'ojek': 'OJK',
        'delivery': 'DO',
        'kurir': 'KR',
        'belanja': 'BLJ',
        'mobil': 'MOB',
        'travel': 'TR',
        'gift': 'GO',
        'jojosehat': 'JS',
        'epajak': 'EP',
        'etilang': 'ETL',
        'joker_mobil': 'JM',
    }

    # =========================
    # RELATION
    # =========================
    customer = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='customer_orders'
    )

    driver = models.ForeignKey(
        'users.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='driver_orders'
    )

    operator = models.ForeignKey(
        'users.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='operator_orders'
    )

    branch = models.ForeignKey('branch.Branch', on_delete=models.CASCADE)

    # =========================
    # ORDER INFO
    # =========================
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES, default='ojek')

    order_code = models.CharField(max_length=50, unique=True, blank=True)

    pickup_location = models.TextField()
    drop_location = models.TextField()
    
    pickup_lat = models.FloatField(null=True, blank=True)
    pickup_lng = models.FloatField(null=True, blank=True)
    drop_lat = models.FloatField(null=True, blank=True)
    drop_lng = models.FloatField(null=True, blank=True)

    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    is_price_edited = models.BooleanField(default=False)

    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # =========================
    # AUTO ORDER CODE
    # =========================
    def save(self, *args, **kwargs):
        if not self.order_code:
            now = timezone.localtime()

            # Get service code
            service_code = self.SERVICE_CODE_MAP.get(self.service_type, 'UNK')

            # Get branch area (first 3 letters, uppercase)
            branch_area = self.branch.area[:3].upper() if self.branch.area else 'UNK'

            # Timestamp: YYMMDDHHMMSS
            timestamp = now.strftime("%y%m%d%H%M%S")

            # Snowflake sequence (last 3 digits for readability)
            snowflake = SnowflakeID.generate()
            sequence = str(snowflake)[-3:].zfill(3)

            # Format: [KODE_LAYANAN]-[AREA_CABANG]-[TIMESTAMP][SEQUENCE]
            # Example: OJK-SIT-260416050141
            self.order_code = f"{service_code}-{branch_area}-{timestamp}{sequence}"

        super().save(*args, **kwargs)

    def __str__(self):
        return self.order_code


# =========================
# ORDER ITEM
# =========================
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=255)
    qty = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)


# =========================
# DRIVER REQUEST
# =========================
class DriverOrderRequest(models.Model):
    driver = models.ForeignKey('users.User', on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)