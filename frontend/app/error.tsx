"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Replace with an error reporting service in a real app.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-black px-4 text-center text-white">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-zinc-400">
        An unexpected error occurred while rendering this page.
        {error.digest ? ` Reference: ${error.digest}` : null}
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-800"
      >
        Try again
      </button>
    </div>
  );
}
