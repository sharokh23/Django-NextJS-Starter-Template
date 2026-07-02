"""HTTP API views for the starter demo (JSON + OpenAPI/Swagger)."""

from __future__ import annotations

from datetime import UTC, datetime

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from django.views.decorators.http import require_GET

from api.openapi import OPENAPI_SCHEMA

# In-memory demo data (replace with a real persistence layer for production).
SAMPLE_ITEMS: list[dict] = [
    {"id": 1, "name": "Service Item 1", "value": 100},
    {"id": 2, "name": "Service Item 2", "value": 200},
    {"id": 3, "name": "Service Item 3", "value": 300},
]


def _api_docs_enabled() -> bool:
    """Hide OpenAPI/Swagger when DJANGO_ENVIRONMENT=production."""
    return (
        getattr(settings, "DJANGO_ENVIRONMENT", "development").lower() != "production"
    )


@require_GET
def health(_request):
    return JsonResponse({"status": "ok"})


@require_GET
def read_root(_request):
    return JsonResponse(
        {
            "message": "Django service is running",
            "docs": reverse("api-docs"),
        }
    )


@require_GET
def get_status(_request):
    return JsonResponse(
        {
            "service": "backend",
            "framework": "django",
            "timestamp": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        }
    )


@require_GET
def get_items(_request):
    return JsonResponse({"items": SAMPLE_ITEMS, "count": len(SAMPLE_ITEMS)})


@require_GET
def get_item(_request, item_id: int):
    item = next((row for row in SAMPLE_ITEMS if row["id"] == item_id), None)
    if item is None:
        return JsonResponse({"detail": "Item not found"}, status=404)
    return JsonResponse({"item": item})


@require_GET
def openapi_json(_request):
    if not _api_docs_enabled():
        return JsonResponse({"detail": "Not Found"}, status=404)
    return JsonResponse(OPENAPI_SCHEMA)


@require_GET
def swagger_ui(_request):
    if not _api_docs_enabled():
        return JsonResponse({"detail": "Not Found"}, status=404)
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Swagger UI</title>
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: "openapi.json",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis],
    });
  </script>
</body>
</html>"""
    return HttpResponse(html, content_type="text/html; charset=utf-8")


@require_GET
def redoc_ui(_request):
    if not _api_docs_enabled():
        return JsonResponse({"detail": "Not Found"}, status=404)
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ReDoc</title>
  <script src="https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js"></script>
</head>
<body>
  <redoc spec-url="openapi.json"></redoc>
</body>
</html>"""
    return HttpResponse(html, content_type="text/html; charset=utf-8")
