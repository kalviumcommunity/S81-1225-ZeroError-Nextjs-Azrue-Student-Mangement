"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		// Week 1: no real auth yet. Stub login then navigate.
		router.push("/dashboard");
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-8">
			<div className="w-full max-w-md border rounded-lg p-6">
				<h1 className="text-xl font-semibold">Login</h1>
				<form className="mt-4 space-y-4" onSubmit={handleSubmit}>
					<div>
						<label className="block text-sm font-medium">Email</label>
						<input
							className="mt-1 w-full border rounded px-3 py-2"
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium">Password</label>
						<input
							className="mt-1 w-full border rounded px-3 py-2"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					<button type="submit" className="w-full bg-black text-white rounded px-3 py-2">
						Sign In
					</button>
				</form>
			</div>
		</div>
	);
}
