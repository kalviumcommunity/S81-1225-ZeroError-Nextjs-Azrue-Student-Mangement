export default function SignupPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-8">
			<div className="w-full max-w-md border rounded-lg p-6">
				<h1 className="text-xl font-semibold">Sign Up</h1>
				<form className="mt-4 space-y-4">
					<div>
						<label className="block text-sm font-medium">Name</label>
						<input className="mt-1 w-full border rounded px-3 py-2" type="text" placeholder="Your name" />
					</div>
					<div>
						<label className="block text-sm font-medium">Email</label>
						<input className="mt-1 w-full border rounded px-3 py-2" type="email" placeholder="you@example.com" />
					</div>
					<div>
						<label className="block text-sm font-medium">Password</label>
						<input className="mt-1 w-full border rounded px-3 py-2" type="password" placeholder="••••••••" />
					</div>
					<button className="w-full bg-black text-white rounded px-3 py-2">Create Account</button>
				</form>
			</div>
		</div>
	);
}
