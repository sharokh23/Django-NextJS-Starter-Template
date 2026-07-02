from django.contrib.auth import get_user_model
from django.test import TestCase

from accounts.models import User


class UserModelTests(TestCase):
    def test_custom_user_model_is_active(self):
        self.assertIs(get_user_model(), User)

    def test_create_superuser(self):
        user = User.objects.create_superuser("admin", "admin@example.com", "x-not-real")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
