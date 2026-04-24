from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_code", "customer", "status", "total_price", "created_at")
    search_fields = ("order_code", "customer__username")
    inlines = [OrderItemInline]