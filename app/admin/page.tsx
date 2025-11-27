import MetricsDashboard from "@/components/admin/metrics-dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/");
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<h1 className="text-2xl font-bold">
						Performance Dashboard
					</h1>
					<p className="text-gray-600">
						Real-time metrics and observability
					</p>
				</div>
			</header>

			<main className="max-w-7xl mx-auto p-4">
				<MetricsDashboard />
			</main>
		</div>
	);
}
