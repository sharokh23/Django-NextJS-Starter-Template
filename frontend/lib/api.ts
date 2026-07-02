/**
 * Public base path for the Django backend. Defaults to the same-origin
 * /svc/api rewrite (see next.config.ts) so no CORS setup is needed.
 * NEXT_PUBLIC_* variables are inlined at build time.
 */
export const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "/svc/api";

/** Fetch JSON with explicit error handling — throws on network errors and non-2xx responses. */
export async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request to ${url} failed with status ${res.status}`);
  }
  return res.json();
}
