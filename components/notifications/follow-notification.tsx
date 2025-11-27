"use client";

import { useEffect, useState } from "react";

interface FollowNotificationProps {
	username: string;
	onDismiss: () => void;
}

export default function FollowNotification({
	username,
	onDismiss,
}: FollowNotificationProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setTimeout(() => setIsVisible(true), 10);

		const timer = setTimeout(() => {
			setIsVisible(false);
			setTimeout(onDismiss, 300);
		}, 5000);

		return () => clearTimeout(timer);
	}, [onDismiss]);

	return (
		<div
			className={`fixed top-20 right-4 bg-white shadow-lg rounded-lg p-4 border-l-4 border-blue-500 transition-all duration-300 z-50 ${
				isVisible
					? "translate-x-0 opacity-100"
					: "translate-x-full opacity-0"
			}`}
			style={{ minWidth: "300px" }}
		>
			<div className="flex items-start justify-between">
				<div className="flex items-center space-x-3">
					<div className="shrink-0">
						<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
							{username[0].toUpperCase()}
						</div>
					</div>
					<div>
						<p className="font-semibold text-gray-900">
							New Follower!
						</p>
						<p className="text-sm text-gray-600">
							<span className="font-medium">@{username}</span>{" "}
							started following you
						</p>
					</div>
				</div>
				<button
					onClick={() => {
						setIsVisible(false);
						setTimeout(onDismiss, 300);
					}}
					className="text-gray-400 hover:text-gray-600"
				>
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}
