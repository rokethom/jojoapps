from django.contrib import admin
from django.db.models import Sum, Count, F
from django.utils.html import format_html
from .models import DriverSettlement, SettlementDetail


def _format_rupiah(value, negative=False):
    try:
        amount = int(round(float(value or 0)))
    except Exception:
        return str(value or 0)

    formatted = format(amount, ',d')
    return f"- Rp {formatted}" if negative else f"Rp {formatted}"


class SettlementDetailInline(admin.TabularInline):
    model = SettlementDetail
    extra = 0
    readonly_fields = [
        'order_code', 'tarif', 'service_fee', 'total_price',
        'deduction', 'settlement_amount', 'completed_at'
    ]
    fields = [
        'order_code', 'tarif', 'service_fee', 'total_price',
        'deduction', 'settlement_amount', 'completed_at'
    ]
    can_delete = False


@admin.register(DriverSettlement)
class DriverSettlementAdmin(admin.ModelAdmin):
    list_display = [
        'driver_name_display', 'period_display', 'total_orders',
        'gross_total_display', 'deduction_display', 'settlement_display',
        'status_display', 'date_range_display'
    ]
    list_filter = ['status', 'period', 'branch', 'created_at']
    search_fields = ['driver__username', 'driver__first_name', 'driver__last_name']
    readonly_fields = [
        'total_orders', 'total_tarif', 'total_service_fee', 'gross_total',
        'deduction_amount', 'settlement_amount', 'created_at', 'updated_at',
        'summary_display'
    ]
    
    fieldsets = (
        ('Driver & Period', {
            'fields': ('driver', 'branch', 'period', 'period_start', 'period_end')
        }),
        ('Summary', {
            'fields': ('summary_display',),
            'classes': ('wide',)
        }),
        ('Financial Details', {
            'fields': (
                'total_orders', 'total_tarif', 'total_service_fee',
                'gross_total', 'deduction_amount', 'settlement_amount'
            )
        }),
        ('Payment Status', {
            'fields': ('status', 'paid_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [SettlementDetailInline]
    
    actions = ['mark_as_paid', 'mark_as_pending']
    
    def driver_name_display(self, obj):
        return obj.driver.get_full_name() or obj.driver.username
    driver_name_display.short_description = 'Driver'
    
    def period_display(self, obj):
        return obj.get_period_display()
    period_display.short_description = 'Period'
    
    def date_range_display(self, obj):
        return f"{obj.period_start} - {obj.period_end}"
    date_range_display.short_description = 'Date Range'
    
    def gross_total_display(self, obj):
        return format_html(
            '<span style="color: #1f2937; font-weight: 500;">{}</span>',
            _format_rupiah(obj.gross_total)
        )
    gross_total_display.short_description = 'Gross Total'
    
    def deduction_display(self, obj):
        return format_html(
            '<span style="color: #dc2626; font-weight: 500;">{}</span>',
            _format_rupiah(obj.deduction_amount, negative=True)
        )
    deduction_display.short_description = 'Deduction (20%)'
    
    def settlement_display(self, obj):
        return format_html(
            '<span style="color: #059669; font-weight: bold; font-size: 14px;">{}</span>',
            _format_rupiah(obj.settlement_amount)
        )
    settlement_display.short_description = 'Settlement Amount'
    
    def status_display(self, obj):
        colors = {
            'pending': '#ef6461',
            'paid': '#059669',
            'overdue': '#d97706'
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 12px; font-weight: 500;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_display.short_description = 'Status'
    
    def summary_display(self, obj):
        return format_html(
            '<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">'
            '<table style="width: 100%; border-collapse: collapse;">'
            '<tr><td style="padding: 5px;">Total Orders:</td><td style="text-align: right;"><strong>{}</strong></td></tr>'
            '<tr><td style="padding: 5px;">Base Tariff:</td><td style="text-align: right;"><strong>{}</strong></td></tr>'
            '<tr><td style="padding: 5px;">Service Fee:</td><td style="text-align: right;"><strong>{}</strong></td></tr>'
            '<tr style="border-top: 1px solid #d1d5db;"><td style="padding: 5px; font-weight: bold;">Gross Total:</td>'
            '<td style="text-align: right; font-weight: bold;">{}</td></tr>'
            '<tr style="background: #fee2e2;"><td style="padding: 5px;">Deduction (20%):</td>'
            '<td style="text-align: right;"><strong>{}</strong></td></tr>'
            '<tr style="background: #dcfce7; border-top: 2px solid #059669;"><td style="padding: 5px; font-weight: bold;">Settlement Amount:</td>'
            '<td style="text-align: right; font-weight: bold; color: #059669; font-size: 16px;">{}</td></tr>'
            '</table></div>',
            obj.total_orders,
            _format_rupiah(obj.total_tarif),
            _format_rupiah(obj.total_service_fee),
            _format_rupiah(obj.gross_total),
            _format_rupiah(obj.deduction_amount, negative=True),
            _format_rupiah(obj.settlement_amount)
        )
    summary_display.short_description = 'Settlement Summary'
    
    def mark_as_paid(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='paid', paid_date=timezone.now().date())
        self.message_user(request, f'{updated} settlement(s) marked as paid.')
    mark_as_paid.short_description = 'Mark selected as Paid'
    
    def mark_as_pending(self, request, queryset):
        updated = queryset.update(status='pending', paid_date=None)
        self.message_user(request, f'{updated} settlement(s) marked as Pending.')
    mark_as_pending.short_description = 'Mark selected as Pending'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('driver', 'branch')


@admin.register(SettlementDetail)
class SettlementDetailAdmin(admin.ModelAdmin):
    list_display = [
        'order_code', 'settlement_period', 'driver_name',
        'tarif_display', 'service_fee_display', 'deduction_display',
        'settlement_display'
    ]
    list_filter = ['settlement__period', 'settlement__status', 'settlement__branch']
    search_fields = ['order_code', 'settlement__driver__username']
    readonly_fields = [
        'order_code', 'tarif', 'service_fee', 'total_price',
        'deduction', 'settlement_amount', 'completed_at', 'pickup_location', 'drop_location'
    ]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('settlement', 'order_code', 'pickup_location', 'drop_location', 'completed_at')
        }),
        ('Financial Details', {
            'fields': ('tarif', 'service_fee', 'total_price', 'deduction', 'settlement_amount')
        }),
    )
    
    def settlement_period(self, obj):
        return f"{obj.settlement.get_period_display()} ({obj.settlement.period_start} - {obj.settlement.period_end})"
    settlement_period.short_description = 'Settlement Period'
    
    def driver_name(self, obj):
        return obj.settlement.driver.get_full_name() or obj.settlement.driver.username
    driver_name.short_description = 'Driver'
    
    def tarif_display(self, obj):
        return format_html('<strong>{}</strong>', _format_rupiah(obj.tarif))
    tarif_display.short_description = 'Tariff'
    
    def service_fee_display(self, obj):
        return format_html('{}', _format_rupiah(obj.service_fee))
    service_fee_display.short_description = 'Service Fee'
    
    def deduction_display(self, obj):
        return format_html('<span style="color: #dc2626;">{}</span>', _format_rupiah(obj.deduction, negative=True))
    deduction_display.short_description = 'Deduction'
    
    def settlement_display(self, obj):
        return format_html(
            '<span style="color: #059669; font-weight: bold;">{}</span>',
            _format_rupiah(obj.settlement_amount)
        )
    settlement_display.short_description = 'Settlement'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('settlement', 'order').prefetch_related('settlement__driver')
