import json
import logging

logger = logging.getLogger(__name__)


def notify_chat_message(sender_id, receiver_id, payload):
    """Send chat message notification to user"""
    from core.ws_manager import notify_chat_message as ws_notify
    try:
        ws_notify(sender_id, receiver_id, payload)
    except Exception as e:
        logger.error(f"Failed to notify chat message: {e}")
