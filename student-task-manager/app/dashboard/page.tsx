"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/clientAuth";

type Bootstrap = {
	defaultProject: { id: number; name: string } | null;
	stats: { total: number; pending: number; completed: number };
	latest: Array<{
		id: number;
		title: string;
		status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
		priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
		createdAt: string;
		dueDate?: string | null;
	}>;
};

export default function Dashboard() {
	const [data, setData] = useState<Bootstrap | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function load() {
		setLoading(true);
		setError(null);
		try {
			const res = await fetchWithAuth("/api/me/bootstrap");
			const json = await res.json();
			if (res.ok && json.success) {
				setData(json.data);
			} else {
				setError(json.message || "Failed to load dashboard");
			}
		} catch {
			setError("Network error");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	return (
		<main className="max-w-5xl mx-auto p-6">
			<h1 className="text-2xl font-bold">Dashboard</h1>
			<p className="text-sm text-gray-600">Only logged-in users can see this page.</p>

			{error && <p className="text-red-600 mt-3">{error}</p>}
			{loading ? (
				<p className="mt-6">Loading...</p>
			) : (
				<>
					<section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="border rounded p-4">
							<p className="text-sm text-gray-600">Total Tasks</p>
							<p className="text-2xl font-semibold">{data?.stats.total ?? 0}</p>
						</div>
						<div className="border rounded p-4">
							<p className="text-sm text-gray-600">Pending</p>
							<p className="text-2xl font-semibold">{data?.stats.pending ?? 0}</p>
						</div>
						<div className="border rounded p-4">
							<p className="text-sm text-gray-600">Completed</p>
							<p className="text-2xl font-semibold">{data?.stats.completed ?? 0}</p>
						</div>
					</section>

					<section className="mt-8">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold">Recent Tasks</h2>
							{data?.defaultProject && (
								<span className="text-sm text-gray-600">Project: {data.defaultProject.name}</span>
							)}
						</div>
						<div className="mt-3 space-y-2">
							{(data?.latest ?? []).length === 0 ? (
								<p className="text-gray-700">No recent tasks.</p>
							) : (
								data!.latest.map((t) => (
									<div key={t.id} className="border rounded p-3 flex items-center justify-between">
										<div>
											<p className="font-medium">{t.title}</p>
											<p className="text-xs text-gray-600">Status: {t.status} • Priority: {t.priority}</p>
										</div>
										<a className="text-blue-600 text-sm" href="/tasks">Manage</a>
									</div>
								))
							)}
						</div>
					</section>
				</>
			)}
		</main>
	);
}

