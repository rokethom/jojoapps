from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('gm', 'GM'),
        ('hrd', 'HRD'),
        ('manager', 'Manager'),
        ('spv', 'SPV'),
        ('operator', 'Operator'),
        ('driver', 'Driver'),
        ('customer', 'Customer'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20)
    branch = models.ForeignKey(
        'branch.Branch',
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    is_suspended = models.BooleanField(default=False, help_text="Driver suspended (overdue settlement)")
    suspension_reason = models.CharField(max_length=255, blank=True, default="")
    suspended_until = models.DateTimeField(null=True, blank=True)
    oper_handle_count = models.PositiveIntegerField(default=0)

    @property
    def name(self):
        """Return the user's full name"""
        if self.first_name:
            return self.first_name
        return self.username

    def clear_expired_suspension(self):
        if self.is_suspended and self.suspended_until and self.suspended_until <= timezone.now():
            self.is_suspended = False
            self.suspension_reason = ""
            self.suspended_until = None
            return True
        return False

    def save(self, *args, **kwargs):
        # =========================
        # SUPERUSER HARUS BISA ADMIN
        # =========================
        if self.is_superuser:
            self.is_staff = True
        else:
            # Auto clear expired suspensions
            self.clear_expired_suspension()

            # =========================
            # ROLE BASED STAFF
            # =========================
            if self.role in ['admin', 'manager', 'hrd', 'spv', 'operator']:
                self.is_staff = True
            else:
                self.is_staff = False

        super().save(*args, **kwargs)


# =========================
# USER PROFILE (FINAL)
# =========================
class UserProfile(models.Model):
    user = models.OneToOneField('users.User', on_delete=models.CASCADE)

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)

    address = models.TextField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


# =========================
# FAVORITE LOCATIONS
# =========================
class FavoriteLocation(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'address')

    def __str__(self):
        return f"{self.user.username} - {self.address[:50]}"