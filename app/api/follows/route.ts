import { toggleFollow } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Not authenticated" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { follower_id, following_id, is_following } = body;

		if (!following_id) {
			return NextResponse.json(
				{ error: "following_id is required" },
				{ status: 400 }
			);
		}

		if (follower_id !== user.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 403 }
			);
		}

		await toggleFollow(supabase, follower_id, following_id, is_following);

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error("Error toggling follow:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to toggle follow" },
			{ status: 500 }
		);
	}
}
