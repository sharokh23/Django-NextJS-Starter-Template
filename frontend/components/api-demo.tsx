"use client";

import { useState } from "react";

import { BACKEND_BASE, fetchJson } from "@/lib/api";

type LoadingKey = "frontend" | "backend";

type LoadingState = Record<LoadingKey, boolean>;

export default function ApiDemo() {
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    frontend: false,
    backend: false,
  });

  async function call(key: LoadingKey, url: string) {
    setLoading((prev) => ({ ...prev, [key]: true }));
    setError(null);
    try {
      setResponse(await fetchJson(url));
    } catch (err) {
      setResponse(null);
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  return (
    <>
      <div className="grid w-full max-w-[900px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left transition-colors hover:border-zinc-600 hover:-translate-y-0.5">
          <h3 className="mb-2 text-lg font-semibold">Next.js API Route</h3>
          <p className="mb-4 flex-1 text-sm text-zinc-400">
            Calls{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[0.9em] text-zinc-300">
              /api/hello
            </code>
            , a route handler running on the Next.js server.
          </p>
          <button
            type="button"
            onClick={() => call("frontend", "/api/hello")}
            disabled={loading.frontend}
            aria-busy={loading.frontend}
            className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
          >
            {loading.frontend ? "Loading..." : "Call /api/hello →"}
          </button>
        </div>

        <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left transition-colors hover:border-zinc-600 hover:-translate-y-0.5">
          <h3 className="mb-2 text-lg font-semibold">Django Backend Route</h3>
          <p className="mb-4 flex-1 text-sm text-zinc-400">
            Calls{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[0.9em] text-zinc-300">
              {BACKEND_BASE}/status
            </code>
            , proxied by the Next.js rewrite to the Django service.
          </p>
          <button
            type="button"
            onClick={() => call("backend", `${BACKEND_BASE}/status`)}
            disabled={loading.backend}
            aria-busy={loading.backend}
            className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
          >
            {loading.backend ? "Loading..." : `Call ${BACKEND_BASE}/status →`}
          </button>
        </div>

        <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left transition-colors hover:border-zinc-600 hover:-translate-y-0.5">
          <h3 className="mb-2 text-lg font-semibold">Interactive API Docs</h3>
          <p className="mb-4 flex-1 text-sm text-zinc-400">
            Explore the REST endpoints with Swagger UI (disabled when the
            backend runs with{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[0.9em] text-zinc-300">
              DJANGO_ENVIRONMENT=production
            </code>
            ).
          </p>
          <a
            href={`${BACKEND_BASE}/docs`}
            className="inline-flex w-fit items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:border-zinc-500 hover:bg-zinc-800"
          >
            Open Swagger UI →
          </a>
        </div>
      </div>

      <div aria-live="polite" className="flex w-full flex-col items-center">
        {error != null && (
          <div className="mt-6 w-full max-w-[900px]">
            <p className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-left text-sm text-red-300">
              {error}
            </p>
          </div>
        )}
        {response != null && (
          <div className="mt-6 w-full max-w-[900px]">
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left font-mono text-[0.8rem] leading-snug text-zinc-200">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}
