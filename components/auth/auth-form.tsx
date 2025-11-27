"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [fullName, setFullName] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter();
	const supabase = createClient();

	const handleAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			if (isSignUp) {
				const { data, error } = await supabase.auth.signUp({
					email,
					password,
					options: {
						data: {
							username,
							full_name: fullName,
						},
					},
				});

				if (error) throw error;

				if (data.user) {
					router.push("/");
					router.refresh();
				}
			} else {
				const { error } = await supabase.auth.signInWithPassword({
					email,
					password,
				});

				if (error) throw error;

				router.push("/");
				router.refresh();
			}
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-md mx-auto p-6">
			<div className="bg-white rounded-lg shadow-md p-8">
				<h2 className="text-2xl font-bold text-center mb-6">
					{isSignUp ? "Create Account" : "Sign In"}
				</h2>

				{error && (
					<div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">
						{error}
					</div>
				)}

				<form onSubmit={handleAuth} className="space-y-4">
					{isSignUp && (
						<>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Username
								</label>
								<input
									type="text"
									value={username}
									onChange={(e) =>
										setUsername(e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
									minLength={3}
									maxLength={20}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Full Name
								</label>
								<input
									type="text"
									value={fullName}
									onChange={(e) =>
										setFullName(e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</>
					)}

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Email
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
							minLength={6}
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
					>
						{loading
							? "Loading..."
							: isSignUp
							? "Sign Up"
							: "Sign In"}
					</button>
				</form>

				<div className="mt-4 text-center">
					<button
						onClick={() => {
							setIsSignUp(!isSignUp);
							setError(null);
						}}
						className="text-blue-500 hover:underline text-sm"
					>
						{isSignUp
							? "Already have an account? Sign in"
							: "Don't have an account? Sign up"}
					</button>
				</div>
			</div>
		</div>
	);
}
