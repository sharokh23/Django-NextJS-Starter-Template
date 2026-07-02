# Django + Next.js Starter Template

A minimal monorepo: **Next.js 16** (App Router) on port **3000** and **Django 6** on port **8000**. The browser uses same-origin paths under **`/svc/api/*`** — Django serves its routes under that prefix natively. In development the Next.js **proxy** ([frontend/proxy.ts](frontend/proxy.ts)) forwards `/svc/api/*` to Django; in production the same split maps 1:1 onto **ALB path-based routing** (default rule → Next.js, `/svc/api/*` → Django), so there is no CORS in either environment.

## Contents

- [What you get](#what-you-get)
- [Requirements](#requirements)
- [Project layout](#project-layout)
- [Run with Docker (development)](#run-with-docker-development)
- [Run with Docker (production)](#run-with-docker-production)
- [Development vs production](#development-vs-production)
- [Environment variables](#environment-variables)
- [How `/svc/api` proxying works](#how-svcapi-proxying-works)
- [Django backend](#django-backend)
- [Run locally (without Docker)](#run-locally-without-docker)
- [Continuous integration](#continuous-integration)
- [Next.js MCP (coding agents)](#nextjs-mcp-coding-agents)
- [Deployment notes](#deployment-notes)

## What you get

1. **Next.js** demo at `/api/hello` (route handler).
2. **Django** JSON at **`/svc/api/status`**, list/detail at **`/svc/api/items`**, same-origin **Swagger** at **`/svc/api/docs`**.
3. **Django admin** at **`/svc/api/admin/`** after you create a superuser.
4. **`GET /health`** on Django (`{"status":"ok"}`) for Docker **HEALTHCHECK** and load balancers.
5. **Docker Compose** for dev (bind mounts + hot reload) and prod (standalone Next + Gunicorn), both with a **PostgreSQL 17** service on a persistent volume.
6. **Custom user model** (`accounts.User`) wired up before any real migrations exist.
7. **Tests both sides** — Django `TestCase` suites and Vitest + React Testing Library.
8. **GitHub Actions** CI: lint (ESLint/Prettier/Ruff), tests, migration check, `check --deploy`, and prod image builds; **Dependabot** keeps npm/pip/actions/docker fresh.

## Requirements

| Area | Version / tool |
|------|----------------|
| **Node.js** | 22 (matches `frontend/Dockerfile` and CI) |
| **Python** | 3.12+ locally; Docker backend images use **3.12-slim** |
| **Docker** | Optional but recommended for parity with production |

## Project layout

```txt
├── backend/
│   ├── Dockerfile          # targets: dev (runserver), prod (gunicorn)
│   ├── .dockerignore
│   ├── manage.py
│   ├── pyproject.toml      # Ruff (lint + format) config
│   ├── requirements.txt    # runtime deps (Docker images)
│   ├── requirements-dev.txt # + ruff, for local dev and CI
│   ├── accounts/           # custom user model (AUTH_USER_MODEL)
│   ├── api/                # REST routes for the demo API
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── tests.py
│   └── core/               # project package (settings, urls, wsgi, asgi)
│       ├── settings.py
│       ├── urls.py
│       ├── wsgi.py
│       └── asgi.py
├── frontend/
│   ├── Dockerfile          # targets: dev, builder, runner (prod)
│   ├── app/                # Next.js App Router
│   ├── components/
│   ├── lib/
│   ├── proxy.ts            # /svc/api proxy when BACKEND_INTERNAL_URL is set
│   ├── next.config.ts
│   └── package.json
├── .github/workflows/ci.yml
├── docker-compose.yml       # development stack
├── docker-compose.prod.yml  # production-style stack
├── .env.docker.example      # commented env hints for Compose
└── .mcp.json                # optional Next.js devtools MCP
```

## Run with Docker (development)

**URLs:** [http://localhost:3000](http://localhost:3000) (frontend), [http://localhost:8000](http://localhost:8000) (Django directly, optional).

The **frontend** container sets `BACKEND_INTERNAL_URL=http://backend:8000` so [frontend/proxy.ts](frontend/proxy.ts) forwards `/svc/api/*` → `http://backend:8000/svc/api/*` with the path preserved exactly (including trailing slashes, which the Django admin depends on). The **backend** container sets `DJANGO_ALLOWED_HOSTS` so Django accepts the `Host: backend` header on those internal requests, and `DJANGO_CSRF_TRUSTED_ORIGINS` so admin logins submitted from `http://localhost:3000` pass Django's CSRF origin check.

```bash
# Foreground (logs in the terminal)
docker compose up --build

# Background
docker compose up --build -d

# Stop (keeps the frontend node_modules volume)
docker compose down

# Stop and remove volumes (e.g. reset container node_modules)
docker compose down -v

# Rebuild after Dockerfile or requirements.txt changes
docker compose build --no-cache
docker compose up
```

**Validate Compose YAML:**

```bash
docker compose config --quiet && echo OK
```

**Dev ergonomics**

- **Frontend:** `npm run dev:docker` inside the image uses **`next dev --webpack`** with **`WATCHPACK_POLLING`** so file changes on bind-mounted volumes (especially Docker Desktop on Windows/macOS) are picked up reliably.
- **Backend:** `runserver` reloads when you edit Python files under `backend/`. Dependencies are installed **in the image** at build time; `./backend` is bind-mounted for your code, so rebuild the backend image after changing `requirements.txt`.

See [.env.docker.example](.env.docker.example) for optional overrides you can copy into a repo-root `.env` when using Compose variable substitution.

## Run with Docker (production)

File: [docker-compose.prod.yml](docker-compose.prod.yml).

- **Frontend** is the only service with a **published** port (`3000`). It uses the **standalone** Next.js output (`node server.js`), non-root user, and a container healthcheck.
- **Backend** is **not** published to the host; it is reachable only on the Compose network. **Gunicorn** serves `core.wsgi:application`, runs migrations on start, and exposes **`/health`** for the image healthcheck.
- **`BACKEND_INTERNAL_URL`** is a **runtime** env var read by `proxy.ts` — the same frontend image works in any environment; change the URL with `docker compose up`, no rebuild needed.

**`DJANGO_SECRET_KEY` is required** — Compose refuses to start without it (repo-root `.env` is a common pattern with Compose `${DJANGO_SECRET_KEY}`). Generate one with `python -c "import secrets; print(secrets.token_urlsafe(50))"`.

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Put a TLS-terminating reverse proxy (nginx, Traefik, Caddy, etc.) in front of port 3000 for real deployments. See [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting#reverse-proxy).

## Development vs production

| | **Development** (`docker-compose.yml`) | **Production** (`docker-compose.prod.yml`) |
|---|------------------------------------------|---------------------------------------------|
| **Backend image target** | `dev` | `prod` |
| **Backend server** | `manage.py runserver` | **Gunicorn** (2 workers) |
| **Backend port on host** | Published `8000:8000` | Not published (`expose` only) |
| **Backend code** | Bind mount `./backend:/app` | Baked into image |
| **`DJANGO_DEBUG`** | `1` | `0` |
| **`DJANGO_ALLOWED_HOSTS`** | `localhost,127.0.0.1,backend,[::1]` | `backend,localhost,127.0.0.1` |
| **`DJANGO_CSRF_TRUSTED_ORIGINS`** | `http://localhost:3000,…` | Your real `https://` origin(s) |
| **`DJANGO_ENVIRONMENT`** | `development` (Swagger enabled) | `production` (hides OpenAPI + UIs) |
| **`DJANGO_HTTPS`** | Off | `0` locally; set `1` behind a TLS proxy |
| **`DJANGO_SECRET_KEY`** | Insecure dev fallback (only with `DJANGO_DEBUG=1`) | **Required** — Compose refuses to start without it |
| **Database** | Postgres 17, fixed `app`/`app` creds, published on `:5432` | Postgres 17, **`POSTGRES_PASSWORD` required**, not published |
| **Frontend** | `dev` target, bind mounts, `dev:docker` | `runner` target, standalone build |

Dockerfile reference: [backend/Dockerfile](backend/Dockerfile) (`dev` vs `prod` stages).

## Environment variables

### Backend (Django)

Read in [backend/core/settings.py](backend/core/settings.py). All are optional unless noted.

| Variable | Purpose | Typical dev | Typical prod |
|----------|---------|-------------|--------------|
| **`DJANGO_SECRET_KEY`** | Cryptographic signing | Insecure fallback used when `DJANGO_DEBUG=1` | **Required** — settings raise `ImproperlyConfigured` without it |
| **`DJANGO_DEBUG`** | `1`/`true`/`yes` enables debug; **defaults off** (fail closed) | `1` in dev Compose and local dev | `0` (or unset) |
| **`DJANGO_ALLOWED_HOSTS`** | Comma-separated `Host` values | Includes `backend` for Docker networking | Include `backend` + real domains if you expose Django |
| **`DATABASE_URL`** | Database connection string ([dj-database-url](https://pypi.org/project/dj-database-url/)); falls back to SQLite when unset | `postgres://app:app@db:5432/app` (set by Compose) | RDS endpoint, or Compose-constructed from `POSTGRES_PASSWORD` |
| **`DJANGO_CSRF_TRUSTED_ORIGINS`** | Comma-separated browser origins trusted for CSRF-protected requests (admin login, session auth) through a proxy | `http://localhost:3000,http://127.0.0.1:3000` | `https://your-domain.example` |
| **`DJANGO_HTTPS`** | Set to `1` behind a TLS-terminating proxy (ALB, nginx): trusts `X-Forwarded-Proto`, enables secure cookies + HSTS + HTTPS redirect (`/health` exempt) | Unset | `1` in real deployments |
| **`DJANGO_ENVIRONMENT`** | Set to **`production`** to disable `/docs`, `/redoc`, and `/openapi.json` | `development` or unset | **`production`** in prod Compose |

Compose also sets **`PYTHONUNBUFFERED=1`** in containers.

### Frontend (Next.js)

| Variable | Where | Purpose |
|----------|-------|---------|
| **`BACKEND_INTERNAL_URL`** | Server-only, **runtime** (Compose / `.env.local`) | Base URL the [frontend/proxy.ts](frontend/proxy.ts) proxy forwards `/svc/api/*` to. If unset, `/svc/api/*` passes through (production behind ALB routing). |
| **`NEXT_PUBLIC_BACKEND_URL`** | Client (optional) | Defaults to `/svc/api` in [frontend/lib/api.ts](frontend/lib/api.ts) for browser-side links and `fetch` URLs. |
| **`DOCKER_DEV`** | Server | When `true`, enables webpack polling in `next.config.ts` for Docker bind mounts. |
| **`WATCHPACK_POLLING`** | Server | Set by dev Compose for reliable watching on Docker Desktop. |

## How `/svc/api` routing works

Django **owns the `/svc/api` prefix natively** ([backend/core/urls.py](backend/core/urls.py)) — the path the browser sends is the path Django serves. Redirects, `reverse()`, and admin URLs therefore survive any proxy without prefix translation. Only bare **`/health`** lives at the Django root, for container and load-balancer health checks that hit the service directly.

**Development (Next proxy):**

1. The browser requests **`http://localhost:3000/svc/api/status`** (same origin as Next).
2. [frontend/proxy.ts](frontend/proxy.ts) forwards to **`{BACKEND_INTERNAL_URL}/svc/api/status`** — the path is preserved exactly, trailing slashes included (`next.config` rewrites would drop them and break the admin against Django's `APPEND_SLASH`).
3. Django serves **`/svc/api/status`** directly.

**Production (AWS ALB path-based routing):** no proxying by Next at all. One public ALB with two target groups — the default rule forwards to the Next.js service, and a `/svc/api/*` path rule forwards to the Django service. Leave `BACKEND_INTERNAL_URL` unset and the proxy passes `/svc/api/*` through. Because Django serves identical paths in both topologies, the dev proxy is a faithful local emulation of the ALB rule.

## Django backend

- **Settings module:** `core.settings` (`DJANGO_SETTINGS_MODULE` is set in the Dockerfile).
- **API app:** [backend/api/](backend/api/) — routes mounted under `svc/api/` by [backend/core/urls.py](backend/core/urls.py), which also mounts the admin at `svc/api/admin/` and keeps bare `/health` at the root. Convention: API routes have **no trailing slash**; the admin keeps Django's native slashed URLs.
- **Custom user model:** [backend/accounts/](backend/accounts/) defines `accounts.User` (`AUTH_USER_MODEL`), per Django's recommendation to customize the user model before the first real migration. Add user fields there.
- **Static files:** WhiteNoise serves hashed/compressed admin assets under `/svc/api/static/` in production (`collectstatic` runs in the prod image build).

| Method + path | Response |
|---------------|----------|
| **`GET /health`** (root) and **`GET /svc/api/health`** | `{"status": "ok"}` — Docker healthchecks use the bare **`/health`**. |
| **`GET /svc/api/`** | `message`, `docs` (root summary for the demo API). |
| **`GET /svc/api/status`** | `service`, `framework`, `timestamp` (ISO-8601 UTC). |
| **`GET /svc/api/items`** | `items` (array of `{id, name, value}`), `count`. |
| **`GET /svc/api/items/{id}`** | `{"item": {...}}` or **404** `{"detail": "Item not found"}`. |
| **`GET /svc/api/openapi.json`**, **`/svc/api/docs`**, **`/svc/api/redoc`** | OpenAPI 3 + Swagger UI / ReDoc (CDN); **404** when `DJANGO_ENVIRONMENT=production`. |
| **`/svc/api/admin/`** | Django admin (after migrations + superuser) — works through the proxy/ALB since redirects keep the prefix. |

**Common commands** (with venv activated or `python` on `PATH`). Settings fail closed — set `DJANGO_DEBUG=1` for local work:

```bash
cd backend
pip install -r requirements.txt
export DJANGO_DEBUG=1        # PowerShell: $env:DJANGO_DEBUG = "1"
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

**Database:** [dj-database-url](https://pypi.org/project/dj-database-url/) reads **`DATABASE_URL`** — both Compose stacks run **PostgreSQL 17** (`db` service, `postgres_data` volume) and point Django at it. When `DATABASE_URL` is unset (e.g. the no-Docker quickstart), Django falls back to **SQLite** (`db.sqlite3` next to `manage.py`, gitignored). On AWS, set `DATABASE_URL` to your RDS endpoint.

**Static files:** [WhiteNoise](https://whitenoise.readthedocs.io/) serves hashed, compressed static files (admin CSS/JS) from Gunicorn — `collectstatic` runs during the prod image build, and `STATIC_URL` lives under `/svc/api/static/` so path-based routing sends those requests to Django.

## Run locally (without Docker)

**Backend**

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# Settings fail closed: enable debug explicitly for local dev.
export DJANGO_DEBUG=1        # PowerShell: $env:DJANGO_DEBUG = "1"

python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

**Frontend** (second terminal)

```bash
cd frontend
npm install
```

Create **`frontend/.env.local`** so the server-side proxy targets your local Django:

```env
BACKEND_INTERNAL_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000):

- **`/api/hello`** — Next.js route handler.
- **`/svc/api/status`** — Django JSON via the proxy.
- **`/svc/api/admin/`** — Django admin (after `createsuperuser`).

## Continuous integration

[.github/workflows/ci.yml](.github/workflows/ci.yml):

1. **Frontend** — `npm ci`, `npm run lint`, `npm run format:check` (Prettier), `npm test` (Vitest + React Testing Library), `npm run build` (includes TypeScript).
2. **Backend** — Python **3.12**, `pip install -r requirements-dev.txt`, **Ruff** (`check` + `format --check`), `manage.py check`, `makemigrations --check` (fails on missing migrations), `manage.py test`, plus **`check --deploy`** with production-like env (`DJANGO_HTTPS=1`).
3. **Docker** — `docker compose -f docker-compose.prod.yml build` (both production images; CI supplies a dummy `DJANGO_SECRET_KEY` to satisfy the required-variable check).

## Next.js MCP (coding agents)

Next.js 16 exposes a dev-only MCP endpoint at **`/_next/mcp`**. This repo includes [`.mcp.json`](.mcp.json) with [`next-devtools-mcp`](https://www.npmjs.com/package/next-devtools-mcp) so tools like Cursor can attach to a **running** `next dev` server. Start the dev server first (`docker compose up` or `cd frontend && npm run dev`), then load the project MCP config. See the [Next.js MCP guide](https://nextjs.org/docs/app/guides/mcp).

## Deployment notes

### AWS ECS Fargate (target architecture)

The intended production shape is **one public ALB with path-based routing** — the compose prod stack is a single-host stand-in for it:

- **Listener rules:** default rule → Next.js target group (port 3000); `/svc/api/*` rule → Django target group (port 8000). Same public origin, so no CORS and session cookies just work.
- **No Next-side proxying in production:** leave `BACKEND_INTERNAL_URL` unset on the frontend task — the proxy passes `/svc/api/*` through and the ALB does the routing. Nothing backend-related is baked at build time, so one image promotes through environments.
- **Django env on the task:** `DJANGO_SECRET_KEY` and `DATABASE_URL` (from Secrets Manager/SSM), `DJANGO_HTTPS=1`, `DJANGO_ALLOWED_HOSTS` with your public domain, `DJANGO_CSRF_TRUSTED_ORIGINS=https://your-domain`, `DJANGO_ENVIRONMENT=production`.
- **Health checks:** point the Django target group at bare **`/health`** (exempt from the HTTPS redirect) and the Next.js target group at **`/api/health`**.
- **Scaling:** each service autoscales independently — API load scales Django only, page traffic scales Next.js only.
- **Service discovery:** not needed for browser traffic (the ALB is the discovery). Add ECS Service Connect only if Next.js server code starts calling Django internally.

### General

- **Secrets:** never commit real `DJANGO_SECRET_KEY` values; use your platform’s secret store or a private `.env` on the host.
- **`DJANGO_ALLOWED_HOSTS`:** add your public hostname(s) whenever the browser or a proxy talks to Django with that `Host` header (behind an ALB, that is your public domain).
- **Database:** the Compose stacks persist Postgres in the `postgres_data` named volume. On Fargate, drop the `db` service and point `DATABASE_URL` at **RDS** (keep the credential in Secrets Manager). The SQLite fallback is for local quickstarts only — never for multi-instance deployments.
- **`BACKEND_INTERNAL_URL` is runtime-configurable** everywhere: change it in Compose or the task definition and restart the container — no image rebuild, since [frontend/proxy.ts](frontend/proxy.ts) reads it at server startup.

## License

[MIT](LICENSE)
