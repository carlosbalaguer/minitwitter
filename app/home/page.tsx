import PageViewTracker from "@/components/analytics/page-view-tracker";
import LogoutButton from "@/components/auth/logout-button";
import HomeWrapper from "@/components/home/home-wrapper";
import { getSuggestedUsers, getTimeline } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface HomePageProps {
	searchParams: Promise<{ filter?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
	const pageStartTime = Date.now();

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/");
	}

	const { data: profile } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", user.id)
		.single();

	// Get following count
	const { count: followingCount } = await supabase
		.from("follows")
		.select("*", { count: "exact", head: true })
		.eq("follower_id", user.id);

	// Get followers count
	const { count: followersCount } = await supabase
		.from("follows")
		.select("*", { count: "exact", head: true })
		.eq("following_id", user.id);

	const params = await searchParams;
	const filter = (params.filter || "all") as "all" | "following";

	const timelineData = await getTimeline(
		supabase,
		user.id,
		filter,
		undefined,
		20
	);

	const tweets = Array.isArray(timelineData)
		? timelineData
		: timelineData?.tweets || [];
	const hasMore = Array.isArray(timelineData)
		? false
		: timelineData?.hasMore || false;
	const nextCursor = Array.isArray(timelineData)
		? null
		: timelineData?.nextCursor || null;

	const { profiles: suggestedProfiles, followingIds } =
		await getSuggestedUsers(supabase, user.id);

	const pageLoadTime = Date.now() - pageStartTime;

	return (
		<div className="min-h-screen bg-gray-50">
			<PageViewTracker page="home" filter={filter} />

			<header className="bg-white shadow-sm sticky top-0 z-10">
				<div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center space-x-6">
						<div>
							<h1 className="text-xl font-bold">MiniTwitter</h1>
							<p className="text-sm text-gray-600">
								@{profile?.username} · {followingCount || 0}{" "}
								following · {followersCount || 0} followers
							</p>
						</div>

						<a
							href="/admin"
							className="text-sm text-blue-500 hover:text-blue-600 font-medium"
						>
							📊 Metrics
						</a>
					</div>
					<LogoutButton />
				</div>
			</header>

			{/* Performance indicator (solo en dev) */}
			{process.env.NODE_ENV === "development" && (
				<div className="max-w-6xl mx-auto px-4 pt-2">
					<div className="text-xs text-gray-500">
						⚡ Page load: {pageLoadTime}ms
					</div>
				</div>
			)}

			<main className="max-w-6xl mx-auto p-4">
				<HomeWrapper
					userId={user.id}
					initialTweets={tweets}
					filter={filter}
					hasMore={hasMore}
					nextCursor={nextCursor}
					suggestedUsers={suggestedProfiles}
					followingIds={followingIds}
				/>
			</main>
		</div>
	);
}
