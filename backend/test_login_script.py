import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User as DjangoUser
from apps.auth_app.views import LoginView
from django.test import RequestFactory

factory = RequestFactory()
view = LoginView.as_view()
failed = []

for u in DjangoUser.objects.all():
    try:
        u.set_password('123')
        u.save()
        request = factory.post('/api/auth/login/', {'username': u.username, 'password': '123'}, content_type='application/json')
        response = view(request)
        response.render()
        if response.status_code == 500:
            failed.append(f"{u.username} (500: {response.content})")
    except Exception as e:
        failed.append(f"{u.username}: {type(e).__name__} - {str(e)}")

print("Failed users:", failed)
