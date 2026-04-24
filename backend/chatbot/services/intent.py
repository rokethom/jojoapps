from chatbot.models import BotKeyword

def detect_intent(message: str):
    message = message.lower()

    keywords = BotKeyword.objects.select_related("intent").all()

    for k in keywords:
        if k.keyword.lower() in message:
            return k.intent.name

    return "fallback"