import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-black px-4 text-center text-white">
      <p className="font-mono text-sm text-zinc-500">404</p>
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="max-w-md text-sm text-zinc-400">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:border-zinc-500 hover:bg-zinc-800"
      >
        Back to home
      </Link>
    </div>
  );
}
