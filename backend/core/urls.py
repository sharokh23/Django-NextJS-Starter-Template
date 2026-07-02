"""Root URL configuration.

Everything user-facing lives under ``svc/api/`` — the same path prefix the
browser uses — so redirects and ``reverse()`` URLs survive both the Next.js
dev rewrite and ALB path-based routing without prefix translation. The bare
``/health`` endpoints stay at the root for container and load-balancer
health checks that hit the service directly.
"""

from django.contrib import admin
from django.urls import include, path

from api import views as api_views

urlpatterns = [
    path("health", api_views.health),
    path("svc/api/admin/", admin.site.urls),
    path("svc/api/", include("api.urls")),
]
