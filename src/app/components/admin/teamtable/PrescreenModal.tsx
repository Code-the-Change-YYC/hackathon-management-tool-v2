"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/trpc/react";

interface PrescreenModalProps {
	teamId: string;
	teamName: string;
	onClose: () => void;
}

export default function PrescreenModal({
	teamId,
	teamName,
	onClose
}: PrescreenModalProps) {
	const utils = api.useUtils();
	const [comments, setComments] = useState("");
	const setPrescreen = api.teams.setPrescreen.useMutation({
		onSuccess: async () => {
			await utils.teams.getAll.invalidate();
		}
	});

	const canSubmit = comments.trim().length > 0 && !setPrescreen.isPending;

	const handleSubmit = async (status: "passed" | "failed") => {
		try {
			await setPrescreen.mutateAsync({
				teamId,
				status,
				comments: comments.trim()
			});
			toast.success(
				status === "passed"
					? `Team ${teamName} passed prescreening.`
					: `Team ${teamName} failed prescreening.`
			);
			onClose();
		} catch (error) {
			console.error(error);
			toast.error("Failed to save prescreen result. Please try again.");
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="w-4/5 max-w-2xl rounded-md bg-white p-6">
				<div className="mb-6 flex items-start justify-between">
					<h2 className="font-bold text-2xl text-dark-pink">
						Prescreening for Team:{" "}
						<span className="text-medium-pink">{teamName}</span>
					</h2>
					<button onClick={onClose} type="button">
						<Image
							alt="Close"
							height={20}
							src="/svgs/judges/exit_icon.svg"
							width={20}
						/>
					</button>
				</div>

				<p className="mb-4 text-dark-grey">
					Please pass or fail the team, and give a brief justification based on
					rubric criteria.
				</p>

				<label
					className="mb-2 block font-medium text-grey-purple text-sm"
					htmlFor="prescreen-comments"
				>
					Comments*
				</label>
				<textarea
					className="mb-6 w-full rounded-2xl border-2 border-light-grey p-3 outline-none transition-colors focus:border-medium-pink"
					id="prescreen-comments"
					onChange={(e) => setComments(e.target.value)}
					placeholder="Describe why the team passed/failed..."
					rows={4}
					value={comments}
				/>

				<div className="flex gap-4">
					<button
						className="rounded-full bg-dark-pink px-8 py-2 font-bold text-white shadow-lg transition-all hover:bg-medium-pink disabled:bg-ehhh-grey"
						disabled={!canSubmit}
						onClick={() => void handleSubmit("passed")}
						type="button"
					>
						{setPrescreen.isPending ? "Saving..." : "Pass team"}
					</button>
					<button
						className="rounded-full border-2 border-dark-pink bg-white px-8 py-2 font-bold text-dark-pink transition-all hover:bg-pastel-pink disabled:border-ehhh-grey disabled:text-ehhh-grey"
						disabled={!canSubmit}
						onClick={() => void handleSubmit("failed")}
						type="button"
					>
						Fail team
					</button>
				</div>
			</div>
		</div>
	);
}
