"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateTweet() {
	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter();
	const supabase = createClient();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!content.trim()) return;

		setLoading(true);
		setError(null);

		const startTime = performance.now();

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) throw new Error("Not authenticated");

			const { error } = await supabase.from("tweets").insert({
				content: content.trim(),
				user_id: user.id,
			});

			if (error) throw error;

			const duration = performance.now() - startTime;

			// Send metric
			fetch("/api/metrics", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					metric: "client.tweet.create",
					duration,
					timestamp: new Date().toISOString(),
				}),
			}).catch(console.error);

			setContent("");
			router.refresh();
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const charactersLeft = 280 - content.length;

	return (
		<div className="bg-white rounded-lg shadow-md p-4 mb-6">
			<form onSubmit={handleSubmit}>
				<textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="What's happening?"
					className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
					rows={3}
					maxLength={280}
					disabled={loading}
				/>

				{error && (
					<div className="mt-2 text-red-500 text-sm">{error}</div>
				)}

				<div className="flex items-center justify-between mt-3">
					<span
						className={`text-sm ${
							charactersLeft < 20
								? "text-red-500"
								: "text-gray-500"
						}`}
					>
						{charactersLeft} characters left
					</span>

					<button
						type="submit"
						disabled={
							loading || !content.trim() || content.length > 280
						}
						className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Posting..." : "Tweet"}
					</button>
				</div>
			</form>
		</div>
	);
}
