"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PersonalInformationDetails } from "./PersonalInformationDetails";
import { PersonalInformationForm } from "./PersonalInformationForm";
import type { Profile } from "./types";

const EDITING_TOAST_ID = "editing-profile";

export function PersonalInformation({ profile }: { profile: Profile }) {
	const [isEditing, setIsEditing] = useState(false);

	function startEditing() {
		setIsEditing(true);
		toast("Editing profile", { id: EDITING_TOAST_ID });
	}

	function stopEditing() {
		setIsEditing(false);
		toast.dismiss(EDITING_TOAST_ID);
	}

	return isEditing ? (
		<PersonalInformationForm onDone={stopEditing} profile={profile} />
	) : (
		<PersonalInformationDetails onEdit={startEditing} profile={profile} />
	);
}
