import { getTimeline } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

		const searchParams = request.nextUrl.searchParams;
		const filter = (searchParams.get("filter") || "all") as
			| "all"
			| "following";
		const cursor = searchParams.get("cursor") || undefined;
		const limit = parseInt(searchParams.get("limit") || "20");

		const result = await getTimeline(
			supabase,
			user.id,
			filter,
			cursor,
			limit
		);

		return NextResponse.json(result);
	} catch (error: any) {
		console.error("Error fetching timeline:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to fetch timeline" },
			{ status: 500 }
		);
	}
}
