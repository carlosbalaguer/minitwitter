"use client";

import { trackTweetView } from "@/lib/analytics";
import { useEffect, useRef } from "react";

interface TweetInteractionTrackerProps {
	tweetId: string;
	tweetAuthor: string;
}

export default function TweetInteractionTracker({
	tweetId,
	tweetAuthor,
}: TweetInteractionTrackerProps) {
	const hasTracked = useRef(false);

	useEffect(() => {
		if (!hasTracked.current) {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && !hasTracked.current) {
							trackTweetView(tweetId, tweetAuthor);
							hasTracked.current = true;
							observer.disconnect();
						}
					});
				},
				{ threshold: 0.5 } // Track when 50% visible
			);

			const element = document.getElementById(`tweet-${tweetId}`);
			if (element) {
				observer.observe(element);
			}

			return () => observer.disconnect();
		}
	}, [tweetId, tweetAuthor]);

	return (
		<div
			id={`tweet-${tweetId}`}
			className="absolute inset-0 pointer-events-none"
		/>
	);
}
