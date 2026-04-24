from django.contrib.admin import AdminSite


class JojoAdminSite(AdminSite):
    site_header = "Jojo CMS"
    site_title = "Jojo Admin"

    def index(self, request, extra_context=None):

        user = request.user

        if user.is_authenticated:
            name = user.username
            role = getattr(user, "role", "").upper()

            welcome_text = f"Selamat datang, {name} 👋 (Role: {role})"

        else:
            welcome_text = "Selamat datang 👋"

        extra_context = extra_context or {}
        extra_context["welcome_text"] = welcome_text

        return super().index(request, extra_context)