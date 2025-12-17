"use client";

export default function HybridPage() {
	const tasks = [
		{ id: 1, title: "Submit Math Assignment", due: "Dec 20, 2025", status: "Pending" },
		{ id: 2, title: "Prepare Physics Lab", due: "Dec 22, 2025", status: "Pending" },
		{ id: 3, title: "Revise Chemistry Notes", due: "Dec 19, 2025", status: "Completed" },
	];

	return (
		<div className="min-h-screen p-8">
			<h1 className="text-2xl font-semibold">Student Tasks</h1>
			<p className="mt-2 text-zinc-600">Simple task list for Week 1 demo.</p>
			<ul className="mt-6 space-y-3">
				{tasks.map((task) => (
					<li key={task.id} className="border rounded-lg p-4 flex items-center justify-between bg-white dark:bg-black">
						<div>
							<p className="font-medium text-black dark:text-zinc-50">{task.title}</p>
							<p className="text-sm text-zinc-600 dark:text-zinc-400">Due: {task.due}</p>
						</div>
						<span
							className={
								task.status === "Completed"
									? "text-xs font-semibold rounded-full px-3 py-1 bg-green-100 text-green-700"
									: "text-xs font-semibold rounded-full px-3 py-1 bg-yellow-100 text-yellow-700"
							}
						>
							{task.status}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
