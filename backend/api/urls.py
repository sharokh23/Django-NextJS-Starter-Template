"""Public HTTP API routes (health, status, items, OpenAPI + docs).

Mounted under ``svc/api/`` by ``core.urls`` — patterns here are relative to
that prefix. Convention: API routes have **no trailing slash** (the admin,
mounted separately, keeps Django's native slashed URLs).
"""

from django.urls import path

from api import views

urlpatterns = [
    path("health", views.health),
    path("status", views.get_status),
    path("items", views.get_items),
    path("items/<int:item_id>", views.get_item),
    path("openapi.json", views.openapi_json),
    path("docs", views.swagger_ui, name="api-docs"),
    path("redoc", views.redoc_ui),
    path("", views.read_root, name="api-root"),
]
