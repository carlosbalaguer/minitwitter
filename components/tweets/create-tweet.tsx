"use client";

import { trackTweetCreate } from "@/lib/analytics";
import { useState } from "react";

export default function CreateTweet() {
	const [content, setContent] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!content.trim() || content.length > 280) return;

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/tweets", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ content: content.trim() }),
			});

			if (!response.ok) {
				throw new Error("Failed to create tweet");
			}

			const data = await response.json();

			// Track tweet creation
			if (data.tweet?.[0]?.id) {
				trackTweetCreate(data.tweet[0].id, content.trim().length);
			}

			setContent("");
			window.location.reload();
		} catch (error) {
			console.error("Error creating tweet:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const remainingChars = 280 - content.length;

	return (
		<div className="bg-white rounded-lg shadow-md p-4 mb-6">
			<form onSubmit={handleSubmit}>
				<textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="What's happening?"
					className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
					rows={3}
					maxLength={280}
				/>

				<div className="flex items-center justify-between mt-3">
					<span
						className={`text-sm ${
							remainingChars < 20
								? "text-red-500"
								: "text-gray-500"
						}`}
					>
						{remainingChars} characters left
					</span>

					<button
						type="submit"
						disabled={
							!content.trim() ||
							isSubmitting ||
							content.length > 280
						}
						className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
					>
						{isSubmitting ? "Tweeting..." : "Tweet"}
					</button>
				</div>
			</form>
		</div>
	);
}
