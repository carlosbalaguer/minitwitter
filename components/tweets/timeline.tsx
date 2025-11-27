"use client";

import { useRealtimeTweets } from "@/hooks/use-realtime-tweets";
import { TweetWithProfile } from "@/types/database.types";
import { useEffect, useRef, useState } from "react";
import TweetCard from "./tweet-card";

interface TimelineProps {
	initialTweets: TweetWithProfile[];
	filter: "all" | "following";
	hasMore: boolean;
	nextCursor: string | null;
	userId: string;
}

export default function Timeline({
	initialTweets,
	filter,
	hasMore: initialHasMore,
	nextCursor: initialCursor,
	userId,
}: TimelineProps) {
	const [tweets, setTweets] = useState<TweetWithProfile[]>(initialTweets);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [cursor, setCursor] = useState<string | null>(initialCursor);
	const [pendingTweets, setPendingTweets] = useState<TweetWithProfile[]>([]);
	const observerTarget = useRef<HTMLDivElement>(null);

	const { newTweetsCount, resetCount, isConnected } = useRealtimeTweets({
		userId,
		filter,
		onNewTweet: (tweet) => {
			setPendingTweets((prev) => [tweet, ...prev]);
		},
	});

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

	const loadNewTweets = () => {
		if (pendingTweets.length > 0) {
			setTweets((prev) => [...pendingTweets, ...prev]);
			setPendingTweets([]);
			resetCount();
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
		setPendingTweets([]);
		resetCount();
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
			{process.env.NODE_ENV === "development" && (
				<div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600 flex items-center justify-between">
					<span className="flex items-center gap-2">
						<span
							className={`w-2 h-2 rounded-full ${
								isConnected ? "bg-green-500" : "bg-red-500"
							}`}
						/>
						{isConnected ? "Connected to realtime" : "Disconnected"}
					</span>
					{newTweetsCount > 0 && (
						<span className="text-blue-500 font-medium">
							{newTweetsCount} new tweet
							{newTweetsCount > 1 ? "s" : ""}
						</span>
					)}
				</div>
			)}

			{newTweetsCount > 0 && (
				<button
					onClick={loadNewTweets}
					className="w-full mb-4 py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 10l7-7m0 0l7 7m-7-7v18"
						/>
					</svg>
					Load {newTweetsCount} new tweet
					{newTweetsCount > 1 ? "s" : ""}
				</button>
			)}

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
