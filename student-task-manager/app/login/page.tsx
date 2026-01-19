"use client";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useState } from "react";
import { login } from "@/lib/clientAuth";

export default function Login() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		const result = await login(email, password);
		setLoading(false);

		if (result.success && result.accessToken) {
			// Set cookie so middleware can protect page routes
			Cookies.set("token", result.accessToken, {
				sameSite: "strict",
				secure: false,
			});
			router.push("/dashboard");
		} else {
			setError(result.error || "Login failed");
		}
	}

	return (
		<main className="min-h-screen flex items-center justify-center p-8">
			<div className="w-full max-w-md border rounded-lg p-6">
				<h1 className="text-xl font-semibold">Login</h1>
				<form onSubmit={handleSubmit} className="mt-4 space-y-4">
					<div>
						<label className="block text-sm font-medium">Email</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="mt-1 w-full border rounded px-3 py-2"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium">Password</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="mt-1 w-full border rounded px-3 py-2"
							required
						/>
					</div>
					{error && <p className="text-red-600 text-sm">{error}</p>}
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-60"
					>
						{loading ? "Signing in..." : "Login"}
					</button>
				</form>
			</div>
		</main>
	);
}
