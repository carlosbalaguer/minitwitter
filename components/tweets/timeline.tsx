"use client";

import { TweetWithProfile } from "@/types/database.types";
import { useEffect, useRef, useState } from "react";
import TweetCard from "./tweet-card";

interface TimelineProps {
	initialTweets: TweetWithProfile[];
	filter: "all" | "following";
	hasMore: boolean;
	nextCursor: string | null;
}

export default function Timeline({
	initialTweets,
	filter,
	hasMore: initialHasMore,
	nextCursor: initialCursor,
}: TimelineProps) {
	const [tweets, setTweets] = useState<TweetWithProfile[]>(initialTweets);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [cursor, setCursor] = useState<string | null>(initialCursor);
	const observerTarget = useRef<HTMLDivElement>(null);

	const loadMore = async () => {
		if (loading || !hasMore || !cursor) return;

		setLoading(true);

		try {
			const encodedCursor = encodeURIComponent(cursor);

			const response = await fetch(
				`/api/timeline?filter=${filter}&cursor=${encodedCursor}&limit=20`
			);
			const data = await response.json();

			if (data.tweets) {
				setTweets((prev) => [...prev, ...data.tweets]);
				setHasMore(data.hasMore);
				setCursor(data.nextCursor);
			}
		} catch (error) {
			console.error("Error loading more tweets:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					loadMore();
				}
			},
			{ threshold: 1.0 }
		);

		if (observerTarget.current) {
			observer.observe(observerTarget.current);
		}

		return () => observer.disconnect();
	}, [hasMore, loading, cursor]);

	useEffect(() => {
		setTweets(initialTweets);
		setHasMore(initialHasMore);
		setCursor(initialCursor);
	}, [filter, initialTweets, initialHasMore, initialCursor]);

	if (!tweets || tweets.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-8 text-center">
				<p className="text-gray-500">
					{filter === "following"
						? "No tweets from people you follow. Try following some users!"
						: "No tweets yet. Start tweeting!"}
				</p>
			</div>
		);
	}

	return (
		<div>
			{tweets.map((tweet) => (
				<TweetCard key={tweet.id} tweet={tweet} />
			))}

			{hasMore && (
				<div ref={observerTarget} className="py-4 text-center">
					{loading ? (
						<div className="text-gray-500">
							Loading more tweets...
						</div>
					) : (
						<div className="text-gray-400 text-sm">
							Scroll for more
						</div>
					)}
				</div>
			)}

			{!hasMore && tweets.length > 0 && (
				<div className="py-4 text-center text-gray-400 text-sm">
					You've reached the end!
				</div>
			)}
		</div>
	);
}
