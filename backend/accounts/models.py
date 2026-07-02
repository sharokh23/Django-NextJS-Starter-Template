from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Project user model (``AUTH_USER_MODEL = "accounts.User"``).

    Custom from day one, as the Django docs recommend — swapping the user
    model after real data exists is one of the hardest migrations there is.
    Add project-specific fields here as the product grows.
    """
