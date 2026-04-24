import json
import requests
from django.conf import settings
from firebase_admin import credentials, messaging, initialize_app
from firebase_admin.exceptions import FirebaseError
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
try:
    firebase_creds = credentials.Certificate(settings.FCM_SERVICE_ACCOUNT)
    firebase_app = initialize_app(firebase_creds)
    logger.info("Firebase Admin SDK initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
    firebase_app = None


def send_fcm_notification(tokens, title, body, data=None, priority='normal'):
    """
    Send FCM notification to multiple devices

    Args:
        tokens: List of FCM device tokens
        title: Notification title
        body: Notification body
        data: Additional data payload
        priority: 'normal' or 'high'

    Returns:
        (success: bool, error_message: str)
    """
    if not firebase_app:
        return False, "Firebase not initialized"

    if not tokens:
        return False, "No tokens provided"

    try:
        # Create the notification message
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
            android=messaging.AndroidConfig(
                priority='high' if priority == 'high' else 'normal',
                notification=messaging.AndroidNotification(
                    priority='high' if priority == 'high' else 'default',
                    default_vibrate_timings=True,
                    default_sound=True,
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(title=title, body=body),
                        sound='default',
                        badge=1,
                    ),
                ),
            ),
        )

        # Send the message using send_each for better error handling
        batch_response = messaging.send_each([
            messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                token=token,
                android=messaging.AndroidConfig(
                    priority='high' if priority == 'high' else 'normal',
                    notification=messaging.AndroidNotification(
                        priority='high' if priority == 'high' else 'default',
                        default_vibrate_timings=True,
                        default_sound=True,
                    ),
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            alert=messaging.ApsAlert(title=title, body=body),
                            sound='default',
                            badge=1,
                        ),
                    ),
                ),
            ) for token in tokens
        ])

        # Process batch response
        success_count = sum(1 for response in batch_response.responses if response.success)
        failure_count = len(batch_response.responses) - success_count

        logger.info(f"FCM notification sent: {success_count} success, {failure_count} failures")

        if failure_count > 0:
            # Log individual failures
            for i, result in enumerate(batch_response.responses):
                if not result.success:
                    logger.error(f"FCM failure for token {tokens[i]}: {result.exception}")

        return success_count > 0, f"Sent to {success_count}/{len(tokens)} devices"

    except FirebaseError as e:
        error_msg = f"Firebase error: {e}"
        logger.error(error_msg)
        return False, error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        logger.error(error_msg)
        return False, error_msg


def send_fcm_data_message(token, data, priority='normal'):
    """
    Send FCM data message (without notification UI)

    Args:
        token: FCM device token
        data: Data payload
        priority: 'normal' or 'high'

    Returns:
        (success: bool, error_message: str)
    """
    if not firebase_app:
        return False, "Firebase not initialized"

    try:
        message = messaging.Message(
            data=data,
            token=token,
            android=messaging.AndroidConfig(
                priority='high' if priority == 'high' else 'normal',
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        content_available=True,
                    ),
                ),
            ),
        )

        response = messaging.send(message)
        logger.info(f"FCM data message sent: {response}")
        return True, "Data message sent successfully"

    except FirebaseError as e:
        error_msg = f"Firebase error: {e}"
        logger.error(error_msg)
        return False, error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        logger.error(error_msg)
        return False, error_msg


def subscribe_to_topic(tokens, topic):
    """
    Subscribe devices to a topic

    Args:
        tokens: List of FCM device tokens
        topic: Topic name

    Returns:
        (success: bool, error_message: str)
    """
    if not firebase_app:
        return False, "Firebase not initialized"

    try:
        response = messaging.subscribe_to_topic(tokens, topic)
        success_count = response.success_count
        failure_count = response.failure_count

        logger.info(f"Topic subscription: {success_count} success, {failure_count} failures")
        return success_count > 0, f"Subscribed {success_count}/{len(tokens)} devices to {topic}"

    except FirebaseError as e:
        error_msg = f"Firebase error: {e}"
        logger.error(error_msg)
        return False, error_msg


def unsubscribe_from_topic(tokens, topic):
    """
    Unsubscribe devices from a topic

    Args:
        tokens: List of FCM device tokens
        topic: Topic name

    Returns:
        (success: bool, error_message: str)
    """
    if not firebase_app:
        return False, "Firebase not initialized"

    try:
        response = messaging.unsubscribe_from_topic(tokens, topic)
        success_count = response.success_count
        failure_count = response.failure_count

        logger.info(f"Topic unsubscription: {success_count} success, {failure_count} failures")
        return success_count > 0, f"Unsubscribed {success_count}/{len(tokens)} devices from {topic}"

    except FirebaseError as e:
        error_msg = f"Firebase error: {e}"
        logger.error(error_msg)
        return False, error_msg


def send_topic_notification(topic, title, body, data=None, priority='normal'):
    """
    Send notification to all devices subscribed to a topic

    Args:
        topic: Topic name
        title: Notification title
        body: Notification body
        data: Additional data payload
        priority: 'normal' or 'high'

    Returns:
        (success: bool, error_message: str)
    """
    if not firebase_app:
        return False, "Firebase not initialized"

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            topic=topic,
            android=messaging.AndroidConfig(
                priority='high' if priority == 'high' else 'normal',
                notification=messaging.AndroidNotification(
                    priority='high' if priority == 'high' else 'default',
                    default_vibrate_timings=True,
                    default_sound=True,
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(title=title, body=body),
                        sound='default',
                        badge=1,
                    ),
                ),
            ),
        )

        response = messaging.send(message)
        logger.info(f"Topic notification sent to {topic}: {response}")
        return True, f"Notification sent to topic {topic}"

    except FirebaseError as e:
        error_msg = f"Firebase error: {e}"
        logger.error(error_msg)
        return False, error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        logger.error(error_msg)
        return False, error_msg