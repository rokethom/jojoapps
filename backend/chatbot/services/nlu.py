# NLU Layer removed as per user request to avoid BERT heavy processing
def get_nlu():
    return None

class HybridNLU:
    def detect_intent(self, text): return "fallback"
    def extract_entities(self, text): return {}
