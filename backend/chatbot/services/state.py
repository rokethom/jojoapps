def next_state(current_state, intent):
    flow = {
        "START": {
            "order_delivery": "CHECK_PROFILE",
            "order_ojek": "CHECK_PROFILE"
        },
        "ASK_USE_PROFILE": {
            "confirm": "INPUT_ITEMS",
            "edit": "INPUT_NAME"
        },
    }

    return flow.get(current_state, {}).get(intent, None)