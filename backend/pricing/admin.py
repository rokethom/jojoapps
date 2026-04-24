from django.contrib import admin
from .models import PriceSetting


@admin.register(PriceSetting)
class PriceSettingAdmin(admin.ModelAdmin):
    list_display = ("name", "min_km", "max_km", "price", "is_formula")