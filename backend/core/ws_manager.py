import asyncio
import json
import urllib.parse

from collections import defaultdict
from django.conf import settings

DriverConnections = defaultdict(set)
ChatConnections = defaultdict(set)
ConnectionLock = asyncio.Lock()


def _json_message(payload):
    from django.core.serializers.json import DjangoJSONEncoder
    return json.dumps(payload, cls=DjangoJSONEncoder)


async def _safe_send(send, payload):
    try:
        await send({"type": "websocket.send", "text": _json_message(payload)})
    except Exception:
        return False
    return True


async def register_driver(driver_id, send):
    async with ConnectionLock:
        DriverConnections[str(driver_id)].add(send)


async def unregister_driver(driver_id, send):
    async with ConnectionLock:
        if str(driver_id) in DriverConnections:
            DriverConnections[str(driver_id)].discard(send)
            if not DriverConnections[str(driver_id)]:
                DriverConnections.pop(str(driver_id), None)


async def register_chat_user(user_id, send):
    async with ConnectionLock:
        ChatConnections[str(user_id)].add(send)


async def unregister_chat_user(user_id, send):
    async with ConnectionLock:
        if str(user_id) in ChatConnections:
            ChatConnections[str(user_id)].discard(send)
            if not ChatConnections[str(user_id)]:
                ChatConnections.pop(str(user_id), None)


async def broadcast_new_order(order_data):
    payload = {
        "type": "order_notification",
        "event": "new_order",
        "order": order_data,
    }

    async with ConnectionLock:
        sends = [send for sends in DriverConnections.values() for send in sends]

    for send in sends:
        success = await _safe_send(send, payload)
        if not success:
            async with ConnectionLock:
                for driver_id, driver_sends in list(DriverConnections.items()):
                    driver_sends.discard(send)
                    if not driver_sends:
                        DriverConnections.pop(driver_id, None)


async def notify_chat_message(customer_id, driver_id, payload):
    user_ids = []
    if customer_id is not None:
        user_ids.append(str(customer_id))
    if driver_id is not None:
        user_ids.append(str(driver_id))

    async with ConnectionLock:
        sends = [send for user_id in user_ids for send in ChatConnections.get(user_id, [])]

    for send in sends:
        success = await _safe_send(send, payload)
        if not success:
            async with ConnectionLock:
                for uid, sends_set in list(ChatConnections.items()):
                    sends_set.discard(send)
                    if not sends_set:
                        ChatConnections.pop(uid, None)


def _get_token_from_scope(scope):
    query = urllib.parse.parse_qs(scope.get("query_string", b"").decode())
    token_list = query.get("token") or []
    return token_list[0] if token_list else None


def _get_driver_id_from_token(token):
    if not token:
        return None

    try:
        from rest_framework_simplejwt.backends import TokenBackend
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

        backend = TokenBackend(settings.SECRET_KEY, algorithms=["HS256"])
        validated = backend.decode(token, verify=True)
        return str(validated.get("user_id"))
    except (InvalidToken, TokenError, Exception):
        return None


def _get_user_id_from_token(token):
    return _get_driver_id_from_token(token)


async def get_driver_id(scope):
    query = urllib.parse.parse_qs(scope.get("query_string", b"").decode())
    driver_id_list = query.get("driver_id") or []
    if driver_id_list:
        return str(driver_id_list[0])

    token = _get_token_from_scope(scope)
    if token:
        return _get_driver_id_from_token(token)

    return None


async def get_user_id(scope):
    token = _get_token_from_scope(scope)
    if token:
        return _get_user_id_from_token(token)
    return None
