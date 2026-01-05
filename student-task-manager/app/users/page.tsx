"use client";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import AddUser from "./AddUser";

export default function UsersPage() {
  const [boom, setBoom] = useState(false);
  const { cache } = useSWRConfig();
  const { data, error, isLoading } = useSWR("/api/users", fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 10000,
    onErrorRetry: (_err: unknown, _key: string, _config: unknown, revalidate: any, { retryCount }: { retryCount: number }) => {
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 2000);
    },
  });

  useEffect(() => {
    // Demonstrate cache keys
    // Log once data is attempted to be fetched
    console.log("Cache keys:", Array.from(cache.keys()));
  }, [cache]);

  if (boom) throw new Error("Simulated error for testing error boundary");
  if (error) return <p className="text-red-600">❌ Failed to load users</p>;
  if (isLoading) return <p>Loading...</p>;

  const items = data?.items ?? [];

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">User List</h1>
      <div className="mb-4">
        <button
          className="inline-flex items-center gap-2 px-3 py-1 rounded border border-red-600 text-red-700 hover:bg-red-50"
          onClick={() => setBoom(true)}
        >
          Simulate Error
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((user: any) => (
          <li key={user.id} className="p-2 border-b border-gray-200">
            {user.name} — {user.email}
          </li>
        ))}
      </ul>
      <AddUser />
    </main>
  );
}
