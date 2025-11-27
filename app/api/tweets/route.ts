import { createTweet } from "@/lib/supabase/queries";
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
		const { content } = body;

		if (!content || !content.trim()) {
			return NextResponse.json(
				{ error: "Content is required" },
				{ status: 400 }
			);
		}

		if (content.length > 280) {
			return NextResponse.json(
				{ error: "Content too long" },
				{ status: 400 }
			);
		}

		const data = await createTweet(supabase, user.id, content.trim());

		return NextResponse.json({ success: true, data });
	} catch (error: any) {
		console.error("Error creating tweet:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to create tweet" },
			{ status: 500 }
		);
	}
}
