import { createClient } from "@/lib/supabase/client";

export type AnalyticsEvent =
	| "page_view"
	| "tweet_view"
	| "tweet_create"
	| "tweet_click"
	| "follow"
	| "unfollow"
	| "profile_view"
	| "search"
	| "link_click"
	| "session_start"
	| "session_end";

interface EventData {
	[key: string]: any;
}

function getSessionId(): string {
	if (typeof window === "undefined") return "";

	let sessionId = localStorage.getItem("analytics_session_id");

	if (!sessionId) {
		sessionId = `session_${Date.now()}_${Math.random()
			.toString(36)
			.substring(7)}`;
		localStorage.setItem("analytics_session_id", sessionId);
	}

	return sessionId;
}

export async function trackEvent(
	eventType: AnalyticsEvent,
	eventData: EventData = {}
) {
	try {
		const supabase = createClient();
		const sessionId = getSessionId();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		const userAgent =
			typeof window !== "undefined" ? window.navigator.userAgent : null;

		const { error } = await supabase.from("analytics_events").insert({
			user_id: user?.id || null,
			event_type: eventType,
			event_data: eventData,
			session_id: sessionId,
			user_agent: userAgent,
		});

		if (error) {
			console.error("Analytics tracking error:", error);
		} else {
			console.log(`📊 Tracked: ${eventType}`, eventData);
		}

		if (user?.id) {
			await supabase.rpc("update_session_activity", {
				p_session_id: sessionId,
				p_user_id: user.id,
				p_user_agent: userAgent,
			});
		}
	} catch (error) {
		console.error("Analytics error:", error);
	}
}

export function trackPageView(page: string, metadata: EventData = {}) {
	trackEvent("page_view", {
		page,
		...metadata,
	});
}

export function trackTweetView(tweetId: string, tweetAuthor: string) {
	trackEvent("tweet_view", {
		tweet_id: tweetId,
		tweet_author: tweetAuthor,
	});
}

export function trackTweetCreate(tweetId: string, contentLength: number) {
	trackEvent("tweet_create", {
		tweet_id: tweetId,
		content_length: contentLength,
	});
}

export function trackTweetClick(tweetId: string) {
	trackEvent("tweet_click", {
		tweet_id: tweetId,
	});
}

export function trackFollow(userId: string, username: string) {
	trackEvent("follow", {
		followed_user_id: userId,
		followed_username: username,
	});
}

export function trackUnfollow(userId: string, username: string) {
	trackEvent("unfollow", {
		unfollowed_user_id: userId,
		unfollowed_username: username,
	});
}

export function trackProfileView(userId: string, username: string) {
	trackEvent("profile_view", {
		profile_user_id: userId,
		profile_username: username,
	});
}

export function trackSessionStart() {
	trackEvent("session_start", {
		timestamp: new Date().toISOString(),
	});
}

export function trackSessionEnd() {
	trackEvent("session_end", {
		timestamp: new Date().toISOString(),
	});
}
