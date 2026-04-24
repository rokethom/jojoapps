from rest_framework import serializers
from .models import Order, OrderItem, DriverOrderRequest

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    customer_phone = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'

    def get_customer_phone(self, obj):
        return getattr(obj.customer, 'phone', '') or ''

    def get_customer_name(self, obj):
        if hasattr(obj.customer, 'userprofile') and obj.customer.userprofile and obj.customer.userprofile.name:
            return obj.customer.userprofile.name
        return obj.customer.get_full_name() or obj.customer.username

    def get_driver_name(self, obj):
        if obj.driver:
            if hasattr(obj.driver, 'userprofile') and obj.driver.userprofile and obj.driver.userprofile.name:
                return obj.driver.userprofile.name
            return obj.driver.get_full_name() or obj.driver.username
        return None

    def create(self, validated_data):
        items = validated_data.pop('items')
        order = Order.objects.create(**validated_data)

        for item in items:
            OrderItem.objects.create(order=order, **item)

        return order


class DriverOrderRequestSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = DriverOrderRequest
        fields = '__all__'

    def get_driver_name(self, obj):
        if hasattr(obj.driver, 'userprofile') and obj.driver.userprofile and obj.driver.userprofile.name:
            return obj.driver.userprofile.name
        return obj.driver.get_full_name() or obj.driver.username