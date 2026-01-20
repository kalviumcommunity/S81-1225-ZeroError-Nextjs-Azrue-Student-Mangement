"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/clientAuth";

// Simple Task type mirroring API selection
type TaskItem = {
  id: number;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assignee?: { id: number; name: string } | null;
  createdAt: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<number>(1); // assumes seeded project id 1

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/tasks?limit=20&page=1");
      const json = await res.json();
      if (res.ok && json.success) {
        setTasks(json.data.items ?? json.data ?? []);
      } else if (json.items) {
        // optimized endpoint structure fallback
        setTasks(json.items);
      } else {
        setError(json.message || "Failed to load tasks");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    try {
      const res = await fetchWithAuth("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTitle("");
        await loadTasks();
      } else {
        setError(json.message || "Create failed");
      }
    } catch (e) {
      setError("Network error");
    }
  }

  async function markDone(id: number) {
    try {
      const res = await fetchWithAuth(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (res.ok) await loadTasks();
    } catch {}
  }

  async function removeTask(id: number) {
    try {
      const res = await fetchWithAuth(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) await loadTasks();
    } catch {}
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <p className="text-sm text-gray-600">Create, view, complete, and delete tasks.</p>

      <form onSubmit={createTask} className="mt-4 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="number"
          className="w-24 border rounded px-3 py-2"
          value={projectId}
          onChange={(e) => setProjectId(Number(e.target.value) || 1)}
          title="Project ID"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
      </form>
      {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}

      <div className="mt-6 space-y-2">
        {loading ? (
          <p>Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-700">No tasks found.</p>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-gray-600">Status: {t.status} • Priority: {t.priority}</p>
              </div>
              <div className="flex gap-2">
                {t.status !== "DONE" && (
                  <button onClick={() => markDone(t.id)} className="text-green-700 border px-2 py-1 rounded">
                    Complete
                  </button>
                )}
                <button onClick={() => removeTask(t.id)} className="text-red-700 border px-2 py-1 rounded">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
