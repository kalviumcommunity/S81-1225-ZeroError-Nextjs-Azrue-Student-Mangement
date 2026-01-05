"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/schemas/signupSchema";
import FormInput from "@/components/FormInput";

export default function SignupPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormData) => {
    console.log("Form Submitted:", data);
    alert(`Welcome, ${data.name}!`);
  };

	return (
		<main className="min-h-screen flex items-center justify-center p-8">
			<div className="w-full max-w-md border rounded-lg p-6">
				<h1 className="text-xl font-semibold">Sign Up</h1>
<<<<<<< HEAD
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
							        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
							          <FormInput label="Name" name="name" register={register} error={errors.name?.message} />
							          <FormInput label="Email" name="email" type="email" register={register} error={errors.email?.message} />
							          <FormInput label="Password" name="password" type="password" register={register} error={errors.password?.message} />
							          <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-60">
							            {isSubmitting ? "Submitting..." : "Create Account"}
							          </button>
							        </form>
						<input
