# syntax=docker/dockerfile:1
#
# Multi-stage image:
#   dev  — docker-compose.yml (bind mount + runserver reload)
#   prod — docker-compose.prod.yml (gunicorn, non-root)

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=core.settings

WORKDIR /app

# --- Development: deps baked into image; bind mount overlays /app with host code. ---
FROM base AS dev

COPY requirements.txt .
RUN pip install -r requirements.txt

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && exec python manage.py runserver 0.0.0.0:8000"]

# --- Production ---
FROM base AS prod

RUN groupadd --system --gid 1001 django \
    && useradd --system --uid 1001 --gid django django

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Collect hashed/compressed static files (admin CSS/JS) for WhiteNoise.
# The dummy secret only satisfies settings import; it is not baked into output.
RUN DJANGO_SECRET_KEY=build-only-collectstatic python manage.py collectstatic --noinput

RUN chown -R django:django /app

USER django

EXPOSE 8000

HEALTHCHECK --interval=5s --timeout=3s --start-period=25s --retries=30 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"

CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 2 --access-logfile - --error-logfile -"]
