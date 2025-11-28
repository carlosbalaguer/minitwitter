"use client";

import {
	trackPageView,
	trackSessionEnd,
	trackSessionStart,
} from "@/lib/analytics";
import { useEffect } from "react";

interface PageViewTrackerProps {
	page: string;
	[key: string]: any;
}

export default function PageViewTracker({
	page,
	...metadata
}: PageViewTrackerProps) {
	useEffect(() => {
		trackPageView(page, metadata);

		const hasTrackedSession = sessionStorage.getItem("session_tracked");
		if (!hasTrackedSession) {
			trackSessionStart();
			sessionStorage.setItem("session_tracked", "true");
		}

		const handleUnload = () => {
			trackSessionEnd();
		};

		window.addEventListener("beforeunload", handleUnload);

		return () => {
			window.removeEventListener("beforeunload", handleUnload);
		};
	}, [page]);

	return null;
}
