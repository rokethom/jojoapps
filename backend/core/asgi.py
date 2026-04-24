"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
import json
import logging
import urllib.parse

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from django.core.asgi import get_asgi_application

from .ws_manager import get_driver_id, get_user_id, register_driver, unregister_driver, register_chat_user, unregister_chat_user

django_application = get_asgi_application()
logger = logging.getLogger(__name__)


async def websocket_application(scope, receive, send):
    driver_id = await get_driver_id(scope)
    if not driver_id:
        await send({"type": "websocket.close", "code": 4001})
        return

    await send({"type": "websocket.accept"})
    await register_driver(driver_id, send)

    try:
        while True:
            event = await receive()
            if event["type"] == "websocket.disconnect":
                break
    finally:
        await unregister_driver(driver_id, send)


async def websocket_chat_application(scope, receive, send):
    user_id = await get_user_id(scope)
    if not user_id:
        await send({"type": "websocket.close", "code": 4001})
        return

    await send({"type": "websocket.accept"})
    await register_chat_user(user_id, send)

    try:
        while True:
            event = await receive()
            if event["type"] == "websocket.disconnect":
                break
    finally:
        await unregister_chat_user(user_id, send)


async def application(scope, receive, send):
    if scope["type"] == "websocket":
        # Legacy ASGI-based websocket handlers
        if scope["path"].startswith("/ws/driver"):
            return await websocket_application(scope, receive, send)
        if scope["path"].startswith("/ws/chat"):
            return await websocket_chat_application(scope, receive, send)

    return await django_application(scope, receive, send)
