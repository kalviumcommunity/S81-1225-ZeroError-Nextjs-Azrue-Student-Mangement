"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		try {
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, password }),
			});
			const json = await res.json();
			if (!json.success) {
				alert(json.message || "Signup failed");
				return;
			}
			alert("Account created. Please log in.");
			router.push("/login");
		} catch (err: any) {
			alert(err?.message || "Unexpected error");
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-8">
			<div className="w-full max-w-md border rounded-lg p-6">
				<h1 className="text-xl font-semibold">Sign Up</h1>
				<form className="mt-4 space-y-4" onSubmit={handleSubmit}>
					<div>
						<label className="block text-sm font-medium">Name</label>
						<input
							className="mt-1 w-full border rounded px-3 py-2"
							type="text"
							placeholder="Your name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
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
					<button type="submit" className="w-full bg-black text-white rounded px-3 py-2">Create Account</button>
				</form>
			</div>
		</div>
	);
}
