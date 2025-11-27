"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function TimelineTabs() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const activeTab = searchParams.get("filter") || "all";

	const handleTabChange = (tab: string) => {
		router.push(`/home?filter=${tab}`);
	};

	return (
		<div className="bg-white rounded-lg shadow-md mb-6">
			<div className="flex border-b">
				<button
					onClick={() => handleTabChange("all")}
					className={`flex-1 py-3 text-center font-medium transition-colors ${
						activeTab === "all"
							? "text-blue-500 border-b-2 border-blue-500"
							: "text-gray-500 hover:text-gray-700"
					}`}
				>
					All Tweets
				</button>
				<button
					onClick={() => handleTabChange("following")}
					className={`flex-1 py-3 text-center font-medium transition-colors ${
						activeTab === "following"
							? "text-blue-500 border-b-2 border-blue-500"
							: "text-gray-500 hover:text-gray-700"
					}`}
				>
					Following
				</button>
			</div>
		</div>
	);
}
