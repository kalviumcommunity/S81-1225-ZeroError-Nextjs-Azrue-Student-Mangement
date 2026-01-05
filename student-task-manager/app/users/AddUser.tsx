"use client";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";

export default function AddUser() {
  const { data } = useSWR("/api/users", fetcher);
  const [name, setName] = useState("");

  const handleAddUser = async () => {
    if (!name) return;

    const tempUser = {
      id: Date.now(),
      name,
      email: `temp${Date.now()}@user.com`,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update — update cache before API call
    // Shape returned by fetcher for GET /api/users is { items: [...], pagination: {...} }
    if (data?.items) {
      mutate(
        "/api/users",
        { ...data, items: [...data.items, tempUser] },
        false
      );
    }

    // Actual API call (API expects name, email, passwordHash)
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: tempUser.email, passwordHash: "temp-hash" }),
    });

    // Revalidate data from server
    mutate("/api/users");
    setName("");
  };

  return (
    <div className="mt-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter user name"
        className="border px-2 py-1 mr-2"
      />
      <button onClick={handleAddUser} className="bg-blue-600 text-white px-3 py-1 rounded">
        Add User
      </button>
    </div>
  );
}
