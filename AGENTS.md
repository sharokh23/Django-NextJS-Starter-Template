# Django + Next.js Starter Template — agent guide

Monorepo: `backend/` (Django 6, API + auth only, no HTML pages) and
`frontend/` (Next.js 16 App Router, owns all user-facing pages).
See [README.md](README.md) for the full architecture.

## Routing contract (do not break)

- Django serves everything under the **`/svc/api/`** path prefix natively
  (`backend/core/urls.py`); only bare `/health` lives at the root.
- The browser always uses same-origin `/svc/api/*` paths. In dev,
  `frontend/proxy.ts` forwards them to Django (path preserved exactly,
  trailing slashes included). In production, an ALB path rule routes them —
  Next.js never proxies.
- API routes have no trailing slash; the Django admin keeps its native
  slashed URLs. Next.js owns `/api/*` for its own route handlers.

## Conventions

- Settings fail closed: `DJANGO_DEBUG` defaults off; `DJANGO_SECRET_KEY` is
  required when debug is off. Set `DJANGO_DEBUG=1` for local commands.
- Database comes from `DATABASE_URL` (Postgres in Docker, SQLite fallback).
- Custom user model: `accounts.User` (`AUTH_USER_MODEL`) — add user fields
  there, never on a parallel profile-only model unless deliberate.
- Frontend rules: see [frontend/AGENTS.md](frontend/AGENTS.md) — read the
  bundled Next.js docs in `node_modules/next/dist/docs/` before writing
  Next.js code; this version differs from training data.

## Commits

- Brief and to the point: short imperative subject, body only when needed.
- Never add "Co-Authored-By" trailers or any AI attribution to commits,
  PR bodies, or anywhere else.

## Commands

- Run the stack: `docker compose up --build` (frontend :3000, backend :8000).
  Verify changes through Docker, not host-run servers.
- Backend (in `backend/`, venv active, `DJANGO_DEBUG=1`): `python manage.py
  test`, `ruff check .`, `ruff format .`, `python manage.py makemigrations`.
- Frontend (in `frontend/`): `npm test`, `npm run lint`, `npm run format`,
  `npm run build`.
- CI mirrors all of the above plus `manage.py check --deploy` and prod image
  builds (`.github/workflows/ci.yml`).
