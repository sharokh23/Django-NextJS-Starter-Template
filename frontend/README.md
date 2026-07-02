# Frontend (Next.js)

Next.js **16** app (App Router, TypeScript, Tailwind CSS v4).

## Scripts

- `npm run dev` — local dev server ([http://localhost:3000](http://localhost:3000))
- `npm run dev:docker` — dev server bound to `0.0.0.0` with webpack (used by Docker Compose)
- `npm run build` / `npm run start` — production build and server
- `npm test` / `npm run test:watch` — Vitest + React Testing Library
- `npm run format` / `npm run format:check` — Prettier

## Monorepo

See the [repository root README](../README.md) for Docker Compose, Django backend integration (`/svc/api` routing), and environment variables (`BACKEND_INTERNAL_URL`, `DJANGO_CSRF_TRUSTED_ORIGINS`).

## Docs

- [Next.js documentation](https://nextjs.org/docs)
