from django.contrib import admin
from .models import Branch, GeofenceArea, LocationLog
from django import forms


class BranchAdminForm(forms.ModelForm):
    class Meta:
        model = Branch
        fields = '__all__'

    class Media:
        js = ('admin/js/branch_geo.js',)  # file JS custom


class BranchAdmin(admin.ModelAdmin):
    form = BranchAdminForm
    list_display = ('name', 'area')

    def has_module_permission(self, request):
        user = request.user

        if user.is_superuser:
            return True

        return user.is_authenticated and getattr(user, "role", None) in ['admin', 'manager']


class GeofenceAreaAdmin(admin.ModelAdmin):
    list_display = ['branch', 'name', 'center_latitude', 'center_longitude', 'radius_meters', 'is_active', 'priority']
    list_filter = ['branch', 'is_active', 'priority']
    search_fields = ['branch__name', 'name', 'description']
    ordering = ['-priority', 'branch__name', 'name']

    fieldsets = (
        ('Basic Information', {
            'fields': ('branch', 'name', 'description', 'is_active', 'priority')
        }),
        ('Geofence Settings', {
            'fields': ('center_latitude', 'center_longitude', 'radius_meters'),
            'description': 'Set the center coordinates and radius for this geofence area.'
        }),
    )


class LocationLogAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'latitude', 'longitude', 'is_valid', 'is_suspicious',
        'geofence_area', 'branch', 'created_at'
    ]
    list_filter = [
        'is_valid', 'is_suspicious', 'branch', 'geofence_area',
        'provider', 'created_at'
    ]
    search_fields = ['user__username', 'user__name']
    readonly_fields = [
        'user', 'latitude', 'longitude', 'accuracy', 'altitude',
        'speed', 'heading', 'gps_timestamp', 'provider',
        'is_valid', 'geofence_area', 'branch', 'is_suspicious',
        'suspicion_reason', 'created_at'
    ]
    ordering = ['-created_at']

    def has_add_permission(self, request):
        return False  # Prevent manual creation

    def has_change_permission(self, request, obj=None):
        return False  # Prevent editing


admin.site.register(Branch, BranchAdmin)
admin.site.register(GeofenceArea, GeofenceAreaAdmin)
admin.site.register(LocationLog, LocationLogAdmin)