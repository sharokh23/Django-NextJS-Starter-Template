"""Smoke tests for the demo API, docs gating, and proxy-facing routing."""

from django.test import TestCase, override_settings


class HealthTests(TestCase):
    def test_root_health(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    def test_prefixed_health(self):
        res = self.client.get("/svc/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})


class ApiTests(TestCase):
    def test_root_links_to_docs(self):
        res = self.client.get("/svc/api/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["docs"], "/svc/api/docs")

    def test_status_shape(self):
        res = self.client.get("/svc/api/status")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["service"], "backend")
        self.assertEqual(body["framework"], "django")
        self.assertIn("timestamp", body)

    def test_items_list(self):
        res = self.client.get("/svc/api/items")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["count"], len(body["items"]))

    def test_item_detail(self):
        res = self.client.get("/svc/api/items/1")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["item"]["id"], 1)

    def test_item_missing_is_404(self):
        res = self.client.get("/svc/api/items/9999")
        self.assertEqual(res.status_code, 404)

    def test_item_non_integer_is_404(self):
        res = self.client.get("/svc/api/items/not-a-number")
        self.assertEqual(res.status_code, 404)


class DocsGatingTests(TestCase):
    def test_docs_available_by_default(self):
        for path in ("/svc/api/docs", "/svc/api/redoc", "/svc/api/openapi.json"):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)

    @override_settings(DJANGO_ENVIRONMENT="production")
    def test_docs_hidden_in_production(self):
        for path in ("/svc/api/docs", "/svc/api/redoc", "/svc/api/openapi.json"):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 404)


class AdminRoutingTests(TestCase):
    def test_admin_redirect_keeps_public_prefix(self):
        """Redirects must include /svc/api so they survive the proxy/ALB."""
        res = self.client.get("/svc/api/admin/")
        self.assertEqual(res.status_code, 302)
        self.assertEqual(
            res.headers["Location"],
            "/svc/api/admin/login/?next=/svc/api/admin/",
        )
