import random
import string
from django.contrib import admin, messages
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import redirect

from .models import User, UserProfile


# =========================
# USER ADMIN FINAL
# =========================
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "colored_role", "branch", "is_staff", "is_active", "reset_password_button")
    list_filter = ("role", "is_staff")
    search_fields = ("username",)

    # =========================
    # FORM DINAMIS
    # =========================
    def get_fields(self, request, obj=None):
        user = request.user
        base = ["username", "password", "role", "is_staff", "is_active"]

        if user.is_superuser or getattr(user, "role", None) == "admin":
            return base + ["phone", "branch"]

        if getattr(user, "role", None) == "hrd":
            return base + ["phone", "branch"]

        if getattr(user, "role", None) == "spv":
            return ["username", "password", "role", "phone", "is_active"]

        return base

    # =========================
    # BATASI ROLE
    # =========================
    def formfield_for_choice_field(self, db_field, request, **kwargs):
        if db_field.name == "role":
            user = request.user

            if getattr(user, "role", None) == "spv":
                kwargs["choices"] = [
                    ("driver", "Driver"),
                    ("operator", "Operator"),
                ]

            elif getattr(user, "role", None) == "hrd":
                kwargs["choices"] = [
                    ("manager", "Manager"),
                    ("spv", "SPV"),
                    ("operator", "Operator"),
                    ("driver", "Driver"),
                ]

        return super().formfield_for_choice_field(db_field, request, **kwargs)

    # =========================
    # GENERATE PASSWORD
    # =========================
    def generate_password(self, length=8):
        chars = string.ascii_letters + string.digits
        return ''.join(random.choice(chars) for _ in range(length))

    # =========================
    # SAVE USER
    # =========================
    def save_model(self, request, obj, form, change):

        if not change:
            raw_password = self.generate_password()
            obj.set_password(raw_password)
            obj._generated_password = raw_password

        obj.is_staff = obj.role in ["admin", "manager", "hrd", "spv", "operator"]

        if getattr(request.user, "role", None) == "spv":
            obj.branch = request.user.branch

        super().save_model(request, obj, form, change)

    # =========================
    # SHOW PASSWORD
    # =========================
    def response_add(self, request, obj, post_url_continue=None):

        if hasattr(obj, "_generated_password"):
            password = obj._generated_password

            self.message_user(
                request,
                format_html(
                    "<b>Username:</b> {}<br><b>Password:</b> {}",
                    obj.username,
                    password
                ),
                level=messages.SUCCESS
            )

        return super().response_add(request, obj, post_url_continue)

    # =========================
    # RESET PASSWORD
    # =========================
    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path('<int:user_id>/reset-password/', self.admin_site.admin_view(self.reset_password)),
        ]
        return custom + urls

    def reset_password(self, request, user_id):
        user = User.objects.get(id=user_id)

        new_password = self.generate_password()
        user.set_password(new_password)
        user.save()

        self.message_user(request, f"Password baru: {new_password}")
        return redirect(f"/admin/users/user/{user_id}/change/")

    def reset_password_button(self, obj):
        return format_html(
            '<a class="button" href="/admin/users/user/{}/reset-password/">🔄</a>',
            obj.id
        )

    # =========================
    # ROLE BADGE
    # =========================
    def colored_role(self, obj):
        colors = {
            "admin": "red",
            "manager": "orange",
            "hrd": "purple",
            "spv": "blue",
            "operator": "cyan",
            "driver": "green",
        }

        return format_html(
            '<span style="color:white;background:{};padding:4px 8px;border-radius:6px;">{}</span>',
            colors.get(obj.role, "gray"),
            obj.role.upper() if obj.role else "-"
        )

    colored_role.short_description = "Role"


# =========================
# USER PROFILE
# =========================
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'phone')