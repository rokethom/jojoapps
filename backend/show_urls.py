import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
from django.urls import get_resolver
r = get_resolver()
for u in sorted(str(u.pattern) for u in r.url_patterns):
    print(u)
