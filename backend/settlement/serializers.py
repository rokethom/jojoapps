from rest_framework import serializers
from .models import DriverSettlement, SettlementDetail


class SettlementDetailSerializer(serializers.ModelSerializer):
    distance = serializers.SerializerMethodField()
    net_driver = serializers.SerializerMethodField()

    class Meta:
        model = SettlementDetail
        fields = [
            'id', 'order_code', 'tarif', 'service_fee', 'total_price',
            'deduction', 'settlement_amount', 'net_driver', 'distance',
            'pickup_location', 'drop_location', 'completed_at'
        ]

    def get_distance(self, obj):
        return obj.distance

    def get_net_driver(self, obj):
        return obj.settlement_amount


class DriverSettlementSerializer(serializers.ModelSerializer):
    detail_items = SettlementDetailSerializer(many=True, read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = DriverSettlement
        fields = [
            'id', 'driver', 'driver_name', 'branch', 'branch_name',
            'period', 'period_start', 'period_end',
            'total_orders', 'total_tarif', 'total_service_fee',
            'gross_total', 'deduction_amount', 'settlement_amount',
            'status', 'paid_date', 'created_at', 'updated_at',
            'detail_items'
        ]
        read_only_fields = [
            'total_orders', 'total_tarif', 'total_service_fee',
            'gross_total', 'deduction_amount', 'settlement_amount',
            'created_at', 'updated_at'
        ]


class DriverSettlementListSerializer(serializers.ModelSerializer):
    """Simplified version for list view"""
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = DriverSettlement
        fields = [
            'id', 'driver', 'driver_name', 'branch', 'branch_name',
            'period', 'period_start', 'period_end',
            'total_orders', 'gross_total', 'deduction_amount',
            'settlement_amount', 'status', 'created_at'
        ]
