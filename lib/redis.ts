import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL) {
	throw new Error("UPSTASH_REDIS_REST_URL is not defined");
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
	throw new Error("UPSTASH_REDIS_REST_TOKEN is not defined");
}

export const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const cacheKeys = {
	timeline: (userId: string, filter: string) =>
		`timeline:${userId}:${filter}`,
	user: (userId: string) => `user:${userId}`,
	tweetCount: (userId: string) => `tweet_count:${userId}`,
};

export const cacheTTL = {
	timeline: 60 * 5, // 5 minutes
	user: 60 * 60, // 1 hour
	tweetCount: 60 * 10, // 10 minutes
};
