"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/schemas/signupSchema";
import FormInput from "@/components/FormInput";
import { useState } from "react";

export default function SignupPage() {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
	});
	const [serverError, setServerError] = useState<string | null>(null);
	const [serverSuccess, setServerSuccess] = useState<string | null>(null);

	const onSubmit = async (data: SignupFormData) => {
		setServerError(null);
		setServerSuccess(null);
		try {
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			const json = await res.json();
			if (res.ok && json.success) {
				setServerSuccess("Signup successful. You can now log in.");
			} else {
				setServerError(json.message || "Signup failed");
			}
		} catch (e) {
			setServerError("Network error");
		}
	};

	return (
		<main className="min-h-screen flex items-center justify-center p-8">
			<div className="w-full max-w-md border rounded-lg p-6">
				<h1 className="text-xl font-semibold">Sign Up</h1>
				<form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
					<FormInput label="Name" name="name" register={register} error={errors.name?.message} />
					<FormInput label="Email" name="email" type="email" register={register} error={errors.email?.message} />
					<FormInput label="Password" name="password" type="password" register={register} error={errors.password?.message} />
                    {serverError && <p className="text-red-600 text-sm">{serverError}</p>}
                    {serverSuccess && <p className="text-green-600 text-sm">{serverSuccess}</p>}
					<button type="submit" disabled={isSubmitting} className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-60">
						{isSubmitting ? "Submitting..." : "Create Account"}
					</button>
				</form>
			</div>
		</main>
	);
}
