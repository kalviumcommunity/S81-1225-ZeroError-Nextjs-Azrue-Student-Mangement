export const dynamic = "force-dynamic";

type Task = {
  id: number;
  title: string;
  status: string;
  due?: string;
};

export default async function DashboardPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/auth/tasks`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-red-600">Failed to load tasks.</p>
      </div>
    );
  }

  const json = await res.json();
  const tasks: Task[] = Array.isArray(json) ? json : json.tasks ?? [];

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <ul className="mt-4 space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="border rounded-lg p-3">
            <span className="font-medium">{task.title}</span>
            <span className="ml-2 text-sm text-zinc-600">- {task.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
