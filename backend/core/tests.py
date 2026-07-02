"""Unit tests for the DATABASE_URL parser in settings.

These pin the edge cases that justify hand-rolling instead of depending on
dj-database-url: percent-encoded credentials, query options, socket hosts.
"""

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from core.settings import _postgres_from_url


class PostgresFromUrlTests(SimpleTestCase):
    def test_basic_url(self):
        config = _postgres_from_url("postgres://app:secret@db:5432/appdb")
        self.assertEqual(config["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual(config["NAME"], "appdb")
        self.assertEqual(config["USER"], "app")
        self.assertEqual(config["PASSWORD"], "secret")
        self.assertEqual(config["HOST"], "db")
        self.assertEqual(config["PORT"], 5432)
        self.assertEqual(config["CONN_MAX_AGE"], 600)
        self.assertTrue(config["CONN_HEALTH_CHECKS"])

    def test_postgresql_scheme_alias(self):
        config = _postgres_from_url("postgresql://app:secret@db/appdb")
        self.assertEqual(config["ENGINE"], "django.db.backends.postgresql")

    def test_percent_encoded_password(self):
        """RDS-generated passwords often contain @ / # — URLs encode them."""
        config = _postgres_from_url("postgres://app:p%40ss%2Fw%23rd@db:5432/appdb")
        self.assertEqual(config["PASSWORD"], "p@ss/w#rd")

    def test_missing_port_is_empty(self):
        config = _postgres_from_url("postgres://app:secret@db/appdb")
        self.assertEqual(config["PORT"], "")

    def test_query_options_forwarded(self):
        config = _postgres_from_url(
            "postgres://app:secret@db:5432/appdb?sslmode=require"
        )
        self.assertEqual(config["OPTIONS"], {"sslmode": "require"})

    def test_no_query_means_no_options_key(self):
        config = _postgres_from_url("postgres://app:secret@db:5432/appdb")
        self.assertNotIn("OPTIONS", config)

    def test_unix_socket_host_is_decoded(self):
        """Cloud SQL style: fully percent-encoded socket path (incl. %3A)."""
        config = _postgres_from_url(
            "postgres://app:secret@%2Fcloudsql%2Fproject%3Aregion/appdb"
        )
        self.assertEqual(config["HOST"], "/cloudsql/project:region")
        self.assertEqual(config["PORT"], "")

    def test_unencoded_colon_in_host_is_a_clear_error(self):
        """A raw ':' makes urlsplit treat the rest as a port — fail loudly."""
        with self.assertRaises(ImproperlyConfigured):
            _postgres_from_url("postgres://app:secret@%2Fcloudsql%2Fproj:region/appdb")

    def test_rejects_non_postgres_scheme(self):
        with self.assertRaises(ImproperlyConfigured):
            _postgres_from_url("mysql://app:secret@db:3306/appdb")
