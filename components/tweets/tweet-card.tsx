import { TweetWithProfile } from "@/types/database.types";
import { formatDistanceToNow } from "date-fns";

export default function TweetCard({ tweet }: { tweet: TweetWithProfile }) {
	const timeAgo = formatDistanceToNow(new Date(tweet.created_at), {
		addSuffix: true,
	});

	return (
		<div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
			<div className="flex items-start space-x-3">
				<div className="shrink-0">
					<div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg relative">
						{tweet.profiles.username[0].toUpperCase()}
						{tweet.profiles.is_celebrity && (
							<div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-xs">
								⭐
							</div>
						)}
					</div>
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center space-x-2">
						<span className="font-bold text-gray-900 flex items-center gap-1">
							{tweet.profiles.full_name ||
								tweet.profiles.username}
							{tweet.profiles.is_celebrity && (
								<span
									className="text-yellow-500"
									title="Celebrity (10k+ followers)"
								>
									✓
								</span>
							)}
						</span>
						<span className="text-gray-500">
							@{tweet.profiles.username}
						</span>
						<span className="text-gray-500">·</span>
						<span className="text-gray-500 text-sm">{timeAgo}</span>
					</div>

					<p className="mt-2 text-gray-900 whitespace-pre-wrap wrap-break-words">
						{tweet.content}
					</p>

					{/* Debug indicator */}
					{process.env.NODE_ENV === "development" && tweet.source && (
						<div className="mt-2 text-xs text-gray-400">
							Source:{" "}
							{tweet.source === "precomputed"
								? "⚡ Pre-computed"
								: "👑 Celebrity fetch"}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
