"use client";

import { LoadingLine } from "@mingcute/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";
import { nameRegex } from "@/types/validation";
import { Field, FieldDescription, FieldGroup } from "../ui/field";
import { Input } from "../ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";

const fontStyles = {
	headlineLargeEmphasized:
		"font-[Omnes] text-[32px] not-italic font-semibold leading-[40px] ",
	titleLargePrimary:
		"font-[Omnes] text-[22px] not-italic font-medium leading-[28px] ",
	labelLargePrimary:
		"font-[Omnes] text-sm not-italic font-medium leading-[20px] ",
	bodyLargePrimary:
		"font-[Omnes] text-[16px] not-italic font-normal leading-[24px] ",
	titleMediumPrimary:
		"font-[Omnes] text-[16px] not-italic font-medium leading-[24px] "
};

export default function Profile() {
	const [isEditing, setIsEditing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	//--Form field errors--
	const [fNameError, setFNameError] = useState<string | null>(null);
	const [lNameError, setLNameError] = useState<string | null>(null);
	//---------------------
	const { data: session, refetch } = authClient.useSession();

	const updateUsers = api.users.update.useMutation({
		onSuccess: async () => {
			setIsEditing(false);
			setIsSubmitting(false);
			toast.success("Profile updated");
			await refetch(); //Update better auth session data
		},
		onError: (error) => {
			toast.error(
				`Internal server error: ${error.message}` ||
					"An internal server error occurred"
			);
			setIsSubmitting(false);
		}
	});

	//Function that takes a program string (ex. 'computer_science') and reformats into pretty text (ex. 'Computer Science')
	const formatProgramString = (value: string): string =>
		value
			.split("_")
			.map((value, _) => `${value.at(0)?.toUpperCase()}${value.substring(1)}`)
			.join(" ");

	//form submit function
	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (session === null) {
			return;
		}
		setIsSubmitting(true);

		const formValues = new FormData(event.currentTarget);
		const firstName = formValues.get("firstName")?.toString().trim() ?? null;
		const lastName = formValues.get("lastName")?.toString().trim() ?? null;
		let program = formValues.get("major")?.toString() ?? null;
		const school = formValues.get("institution")?.toString() ?? null;

		//--Frontend checks--
		let passedChecks = true;
		if (firstName === null) {
			//Should never happen in this context
			toast.error("null found in field: First name");
			passedChecks = false;
		} else if (firstName.length === 0) {
			setFNameError("Field cannot be blank");
			passedChecks = false;
		} else if (firstName.length > 20) {
			setFNameError("Field too long");
			passedChecks = false;
		} else if (!nameRegex.test(firstName)) {
			setFNameError("Only alphabetic characters or spaces are allowed");
			passedChecks = false;
		}
		if (lastName === null) {
			//Should never happen in this context
			setLNameError("null field");
			toast.error("null found in field: Last name");
			passedChecks = false;
		} else if (lastName.length === 0) {
			setLNameError("Field cannot be blank");
			passedChecks = false;
		} else if (lastName.length > 20) {
			setLNameError("Field too long");
			passedChecks = false;
		} else if (!nameRegex.test(lastName)) {
			setLNameError("Only alphabetic characters or spaces are allowed");
			passedChecks = false;
		}
		if (program === null) {
			//Should never happen in this context
			toast.error("null found in field: Major");
			passedChecks = false;
		} else if (
			program !== "Computer Science" &&
			program !== "Software Engineering" &&
			program !== "Electrical Engineering" &&
			program !== "Other"
		) {
			//Should never happen in this context
			toast.error("Unknown value found in field: Major");
			passedChecks = false;
		}
		if (school === null) {
			//Should never happen in this context
			toast.error("null found in field: Institution");
			passedChecks = false;
		} else if (
			school !== "University of Calgary" &&
			school !== "Mount Royal University" &&
			school !== "SAIT" &&
			school !== "Other"
		) {
			//Should never happen in this context
			toast.error("Unknown value found in field: Institution");
			passedChecks = false;
		}
		//-------------------

		//--Backend checks--
		if (passedChecks) {
			//Passed front end checks
			program = program!
				.split(" ")
				.map((value, _) => `${value.at(0)?.toLowerCase()}${value.substring(1)}`)
				.join("_"); //Convert string to db format (ex. Computer Science => computer_science)
			if (
				`${firstName} ${lastName}` === session.user.name &&
				program === session.user.program &&
				school === session.user.school
			) {
				//No changes were actually made
				toast.success("Profile updated");
				setIsSubmitting(false);
				setIsEditing(false);
				return;
			} else {
				//Changes were made
				updateUsers.mutate({
					id: session.user.id,
					//--Type assertions due to above checks guaranteeing their types--
					fname: firstName as string,
					lname: lastName as string,
					name: `${firstName} ${lastName}` as string,
					school: school as
						| "University of Calgary"
						| "Mount Royal University"
						| "SAIT"
						| "Other",
					program: program as
						| "computer_science"
						| "software_engineering"
						| "electrical_engineering"
						| "other"
					//----------------------------------------------------------------
				});
			}
		} else {
			//Failed front-end checks
			setIsSubmitting(false);
		}
	};

	return (
		<div className="p-[24px]">
			<header>
				<h1
					className={`
            ${fontStyles.headlineLargeEmphasized}self-stretch pb-[24px] text-[var(--grey-800,#292929)]`}
				>
					Your Profile
				</h1>
				{!session && (
					<div className="flex items-center gap-3">
						<Skeleton className="size-[64] rounded-full" />
						<div className="flex flex-col gap-2">
							<Skeleton className="h-4 w-40" />
							<Skeleton className="h-4 w-24" />
						</div>
					</div>
				)}
				{session && (
					<div className="flex pb-[24px]">
						<div className="relative pr-[5px]">
							<Image
								alt="Profile Picture"
								className="aspect-square rounded-[64px] bg-[#FE957B] bg-center bg-cover bg-no-repeat"
								height={64}
								src={"svgs/NewMemberPFP.svg"}
								width={64}
							/>
						</div>
						<div className="pr-[var(--spacing-4,16px)]" />
						<div className="flex flex-col">
							<p
								className={`
                  ${fontStyles.titleLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
							>
								{session?.user.name ?? "John Doe"}
							</p>
							<div className="pb-[var(--spacing-2,8px)]" />
							<div className="flex">
								<svg
									aria-label="Email icon"
									fill="none"
									height="25"
									role="img"
									viewBox="0 0 25 25"
									width="25"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										clipRule="evenodd"
										d="M3.49769 4.20894C3.00578 4.34121 2.56114 4.69461 2.27847 5.18131C1.99781 5.66181 2.01189 5.27947 2.01391 12.4291C2.01592 18.379 2.02195 18.8895 2.08533 19.1406C2.2664 19.8526 2.87701 20.455 3.57011 20.6059C3.97954 20.6947 20.1633 20.6947 20.5727 20.6059C20.9459 20.5253 21.2175 20.3661 21.5284 20.0479C21.8382 19.7286 21.9931 19.4496 22.0716 19.0662C22.1581 18.6477 22.1581 6.15264 22.0716 5.73414C21.9247 5.02217 21.3383 4.39494 20.6452 4.20894C20.3997 4.14281 19.7961 4.13867 12.0714 4.13867C4.34671 4.13867 3.74314 4.14281 3.49769 4.20894ZM20.0577 6.27974C19.9128 6.42337 12.0956 13.1028 12.0714 13.1028C12.0473 13.1028 4.23002 6.42337 4.08516 6.27974C4.0067 6.20121 4.11836 6.20017 12.0714 6.20017C20.0245 6.20017 20.1361 6.20121 20.0577 6.27974ZM7.72168 12.0902C10.1893 14.2002 11.3059 15.1292 11.4638 15.2057C11.658 15.2987 11.7425 15.3142 12.0714 15.3142C12.4004 15.3142 12.4849 15.2987 12.679 15.2057C12.8369 15.1292 13.9536 14.2002 16.4212 12.0902C18.3556 10.4358 19.9782 9.0439 20.0285 8.9974L20.119 8.91371V18.6002H4.0238V8.91371L4.11433 8.9974C4.16363 9.0439 5.78723 10.4358 7.72168 12.0902Z"
										fill="#575757"
										fillRule="evenodd"
									/>
								</svg>
								<div className="pr-[var(--spacing-2,8px)]" />
								<p
									className={`
                    ${fontStyles.labelLargePrimary}text-[var(--grey-600,#575757)]`}
								>
									{session?.user.email ?? "john.doe@gmail.com"}
								</p>
							</div>
						</div>
					</div>
				)}
			</header>
			{session && (
				<main>
					<section className="relative flex items-center justify-between pb-[16px]">
						<p
							className={`
                ${fontStyles.titleLargePrimary}text-[var(--grey-800,#292929)]`}
						>
							Personal Information
						</p>
						{!isEditing && (
							<button
								className="flex cursor-pointer items-center gap-[4px] px-[12px] py-[6px]"
								onClick={() => setIsEditing(true)}
								type="button"
							>
								<svg
									aria-label="Edit profile info button"
									fill="none"
									height="20"
									role="img"
									viewBox="0 0 20 20"
									width="20"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										clipRule="evenodd"
										d="M14.4783 1.86585C14.225 1.93251 13.9767 2.04668 13.7333 2.20918C13.5167 2.35335 3.87584 11.9908 3.79751 12.1417C3.69668 12.3342 2.82168 16.14 2.82251 16.3833C2.82251 16.6258 2.90418 16.8025 3.09584 16.9758C3.25668 17.1208 3.54668 17.2167 3.72751 17.185C4.18418 17.1042 7.76084 16.2533 7.86001 16.2017C8.01334 16.1225 17.6492 6.48001 17.7975 6.25751C18.0808 5.83501 18.1992 5.42501 18.1992 4.86668C18.1992 4.30668 18.08 3.89418 17.7967 3.47585C17.6458 3.25251 16.8242 2.42335 16.58 2.24751C16.3206 2.05836 16.0259 1.92319 15.7133 1.85001C15.385 1.78001 14.7758 1.78835 14.4783 1.86585ZM15.4833 3.53251C15.5658 3.56918 15.7783 3.75668 16.0375 4.02085C16.4917 4.48418 16.5475 4.57918 16.5442 4.88418C16.5417 5.14918 16.4417 5.32251 16.0725 5.70418L15.7367 6.05001L14.8442 5.15835L13.9508 4.26751L14.2333 3.98251C14.3892 3.82585 14.5733 3.65835 14.6433 3.61001C14.7639 3.52369 14.9052 3.47101 15.0528 3.45739C15.2005 3.44377 15.3491 3.4697 15.4833 3.53251ZM13.6667 6.35168L14.55 7.23668L10.7833 10.9808L7.01668 14.725L5.90584 14.9817C5.29418 15.1233 4.78668 15.2317 4.77751 15.2225C4.76834 15.2133 4.87751 14.6983 5.01918 14.0775L5.27751 12.95L9.01334 9.20835C11.0683 7.15001 12.7575 5.46668 12.7667 5.46668C12.7758 5.46668 13.1808 5.86501 13.6667 6.35168Z"
										fill="#292929"
										fillRule="evenodd"
									/>
								</svg>
								<p
									className={`
                  ${fontStyles.labelLargePrimary}text-[var(--grey-800,#292929)]`}
								>
									Edit Info
								</p>
							</button>
						)}
						{isEditing && (
							<button
								className="flex cursor-pointer items-center gap-[8px] rounded-xl bg-[var(--purple-500,#7054FD)] p-[4px_16px]"
								disabled={isSubmitting}
								form="profileForm"
								type="submit"
							>
								{isSubmitting && (
									<LoadingLine className="w-[95px] animate-spin" color="#FFF" />
								)}
								{!isSubmitting && (
									<p
										className={`${fontStyles.titleMediumPrimary}text-[var(--grey-00,#FFF)] w-[95px]`}
									>
										Save changes
									</p>
								)}
							</button>
						)}
					</section>
					<form id="profileForm" onSubmit={handleSubmit}>
						<FieldGroup>
							<div className="inline-grid w-full grid-flow-row grid-rows-[repeat(2,fit-content(100%))] gap-x-[var(--spacing-9,48px)] gap-y-[24px] self-stretch rounded-[var(--radius-4,16px)] border border-[var(--grey-300,#D6D6D6)] border-solid p-[var(--spacing-6,24px)] sm:grid-cols-[repeat(2,minmax(0,1fr))]">
								<section>
									<p
										className={`${fontStyles.labelLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
									>
										First name
									</p>
									<div className="pb-[var(--spacing-2,8px)]" />
									{!isEditing && (
										<p
											className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
										>
											{session?.user.fname ?? "John"}
										</p>
									)}
									{isEditing && (
										<>
											<Field data-invalid={fNameError !== null}>
												<Input
													aria-invalid={fNameError !== null}
													className="text-[16px] md:text-[16px]"
													defaultValue={session?.user.fname ?? "John"}
													name="firstName"
													onChange={() => setFNameError(null)}
												/>
											</Field>
											{fNameError && (
												<FieldDescription>{fNameError}.</FieldDescription>
											)}
										</>
									)}
								</section>
								<section>
									<p
										className={`${fontStyles.labelLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
									>
										Last name
									</p>
									<div className="pb-[var(--spacing-2,8px)]" />
									{!isEditing && (
										<p
											className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
										>
											{session?.user.lname ?? "Doe"}
										</p>
									)}
									{isEditing && (
										<>
											<Field data-invalid={lNameError !== null}>
												<Input
													aria-invalid={lNameError !== null}
													className="text-[16px] md:text-[16px]"
													defaultValue={session?.user.lname ?? "Doe"}
													name="lastName"
													onChange={() => setLNameError(null)}
												/>
											</Field>
											{lNameError && (
												<FieldDescription>{lNameError}.</FieldDescription>
											)}
										</>
									)}
								</section>
								<section className="truncate">
									<p
										className={`${fontStyles.labelLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
									>
										Institution
									</p>
									<div className="pb-[var(--spacing-2,8px)]" />
									{!isEditing && (
										<p
											className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
										>
											{session?.user.school ?? "University of Calgary"}
										</p>
									)}
									{isEditing && (
										<Select
											defaultValue={
												session?.user.school ?? "University of Calgary"
											}
											name="institution"
										>
											<SelectTrigger
												className={`${fontStyles.bodyLargePrimary}self-stretch w-[100%] text-[var(--grey-800,#292929)]`}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectItem
														className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
														value="University of Calgary"
													>
														University of Calgary
													</SelectItem>
													<SelectItem
														className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
														value="Mount Royal University"
													>
														Mount Royal University
													</SelectItem>
													<SelectItem
														className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
														value="SAIT"
													>
														SAIT
													</SelectItem>
													<SelectItem
														className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
														value="Other"
													>
														Other
													</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
									)}
								</section>
								<section className="truncate">
									<p
										className={`${fontStyles.labelLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
									>
										Major
									</p>
									<div className="pb-[var(--spacing-2,8px)]" />
									{!isEditing && (
										<p
											className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
										>
											{session && session.user.program
												? formatProgramString(session.user.program)
												: "Computer Science"}
										</p>
									)}
									{isEditing && (
										<Select
											defaultValue={
												session && session.user.program
													? formatProgramString(session.user.program)
													: "Computer Science"
											}
											name="major"
										>
											<SelectTrigger
												className={`${fontStyles.bodyLargePrimary}self-stretch w-[100%] text-[var(--grey-800,#292929)]`}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectItem
														className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
														value="Computer Science"
													>
														Computer Science
													</SelectItem>
													<SelectItem
														className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
														value="Software Engineering"
													>
														Software Engineering
													</SelectItem>
													<SelectItem
														className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
														value="Electrical Engineering"
													>
														Electrical Engineering
													</SelectItem>
													<SelectItem
														className={`${fontStyles.bodyLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
														value="Other"
													>
														Other
													</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
									)}
								</section>
							</div>
						</FieldGroup>
					</form>
				</main>
			)}
		</div>
	);
}
