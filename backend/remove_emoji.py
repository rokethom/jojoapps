import re
import os

files = [
    'chatbot/services/chat_engine.py',
    'pricing/services/pricing.py'
]

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace emojis in print statements
        def remove_emoji(match):
            text = match.group(0)
            return text.encode('ascii', 'ignore').decode('ascii')
            
        new_content = re.sub(r'print\(.*?\)', remove_emoji, content)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Cleaned {f}")
    except Exception as e:
        print(f"Error on {f}: {e}")
