from django.contrib import admin
from .models import *

# =========================
# BOT INTENT
# =========================
class BotKeywordInline(admin.TabularInline):
    model = BotKeyword
    extra = 1


class BotResponseInline(admin.TabularInline):
    model = BotResponse
    extra = 1


class BotFlowInline(admin.TabularInline):
    model = BotFlow
    extra = 1


@admin.register(BotIntent)
class BotIntentAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    inlines = [BotKeywordInline, BotResponseInline, BotFlowInline]


# =========================
# CHAT SESSION
# =========================
@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'state', 'is_active', 'updated_at')


# =========================
# USER ADDRESS
# =========================
@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'label', 'address')