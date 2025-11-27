import AuthForm from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		redirect("/home");
	}

	return (
		<main className="min-h-screen bg-gray-50 flex items-center justify-center">
			<AuthForm />
		</main>
	);
}
