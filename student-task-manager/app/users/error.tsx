"use client";
import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Users route error:", error);
  }, [error]);

  return (
    <main className="p-6">
      <div className="max-w-xl mx-auto border rounded p-4 bg-red-50 dark:bg-red-900/20">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">Something went wrong</h2>
        <p className="mt-1 text-sm text-red-800 dark:text-red-200">
          We couldn't load this section. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded bg-brand text-white dark:bg-brand-dark"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
