from django.db import models
from django.conf import settings


class UserAddress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    label = models.CharField(max_length=50, default="Utama")
    address = models.TextField()

    def __str__(self):
        return f"{self.user} - {self.label}"


class ChatSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    state = models.CharField(max_length=50, default="START")
    context = models.JSONField(default=dict)

    is_active = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.state}"


class BotIntent(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)


class BotKeyword(models.Model):
    intent = models.ForeignKey(BotIntent, on_delete=models.CASCADE)
    keyword = models.CharField(max_length=100)


class BotResponse(models.Model):
    intent = models.ForeignKey(BotIntent, on_delete=models.CASCADE)
    response = models.TextField()


class BotFlow(models.Model):
    intent = models.ForeignKey(BotIntent, on_delete=models.CASCADE)
    step = models.CharField(max_length=100)