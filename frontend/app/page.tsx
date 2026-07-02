import Link from "next/link";

import ApiDemo from "@/components/api-demo";
import { BACKEND_BASE } from "@/lib/api";

const rewriteSnippet = `// proxy.ts — same-origin proxy to Django (path preserved;
// in production an ALB path rule routes /svc/api/* instead)
export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/svc/api" || pathname.startsWith("/svc/api/")) {
    return NextResponse.rewrite(
      new URL(\`\${pathname}\${search}\`, BACKEND_INTERNAL_URL)
    );
  }
}`;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-black text-white">
      <header className="border-b border-zinc-800">
        <nav className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:gap-8 sm:px-8">
          <Link
            href="/"
            className="text-xl font-semibold text-white no-underline"
          >
            Django + Next.js
          </Link>
          <div className="flex flex-wrap justify-center gap-6 sm:ml-auto sm:justify-end">
            <a
              href={`${BACKEND_BASE}/docs`}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 no-underline transition-colors hover:bg-zinc-950 hover:text-white"
            >
              API Docs
            </a>
            <a
              href={`${BACKEND_BASE}/items`}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 no-underline transition-colors hover:bg-zinc-950 hover:text-white"
            >
              API
            </a>
            <a
              href={`${BACKEND_BASE}/admin/`}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 no-underline transition-colors hover:bg-zinc-950 hover:text-white"
            >
              Admin
            </a>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-4 py-8 text-center sm:px-8 sm:py-16">
        <h1 className="mb-4 bg-linear-to-r from-white to-zinc-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          Django + Next.js Starter Template
        </h1>

        <div className="mb-6 w-full max-w-[900px]">
          <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left">
            <code className="font-mono text-[0.85rem] leading-relaxed text-zinc-300">
              {rewriteSnippet}
            </code>
          </pre>
        </div>

        <ApiDemo />
      </main>
    </div>
  );
}
