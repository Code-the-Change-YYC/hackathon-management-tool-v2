"use client";

import Image from "next/image";
import { useState } from "react";

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

const editFieldStyle =
	"w-full flex p-[var(--spacing-3,12px)] items-center gap-[8px] self-stretch rounded-[var(--radius-3,12px)] border border-solid border-[var(--grey-400,#A5A5A5)] ";

export default function Profile() {
	const [isEditing, setIsEditing] = useState(false);
	const [openProfileModal, setOpenProfileModal] = useState(false);

	return (
		<div className="p-[24px]">
			<h1
				className={`
					${fontStyles.headlineLargeEmphasized}self-stretch pb-[24px] text-[var(--grey-800,#292929)]`}
			>
				Your Profile
			</h1>
			<div className="flex pb-[24px]">
				<div className="relative pr-[5px]">
					<Image
						alt="Profile Picture"
						className="aspect-square rounded-[64px] bg-[#FE957B] bg-center bg-cover bg-no-repeat"
						height={64}
						src={"svgs/CTCLogo.svg"}
						width={64}
					/>
					<button
						className={`absolute bottom-0 left-11 inline-flex cursor-pointer items-center justify-center gap-[8px] rounded-[50px] bg-[var(--grey-00,#FFF)] p-[4px]`}
						type="button"
					>
						<svg
							aria-label="Edit Picture Button"
							fill="none"
							height="16"
							role="img"
							viewBox="0 0 16 16"
							width="16"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								clipRule="evenodd"
								d="M11.5827 1.49277C11.3801 1.54611 11.1814 1.63744 10.9867 1.76744C10.8134 1.88277 3.10072 9.59277 3.03806 9.71344C2.95739 9.86744 2.25739 12.9121 2.25806 13.1068C2.25806 13.3008 2.32339 13.4421 2.47672 13.5808C2.60539 13.6968 2.83739 13.7734 2.98206 13.7481C3.34739 13.6834 6.20872 13.0028 6.28806 12.9614C6.41072 12.8981 14.1194 5.18411 14.2381 5.00611C14.4647 4.66811 14.5594 4.34011 14.5594 3.89344C14.5594 3.44544 14.4641 3.11544 14.2374 2.78077C14.1167 2.60211 13.4594 1.93877 13.2641 1.79811C13.0565 1.64679 12.8208 1.53865 12.5707 1.48011C12.3081 1.42411 11.8207 1.43077 11.5827 1.49277ZM12.3867 2.82611C12.4527 2.85544 12.6227 3.00544 12.8301 3.21677C13.1934 3.58744 13.2381 3.66344 13.2354 3.90744C13.2334 4.11944 13.1534 4.25811 12.8581 4.56344L12.5894 4.84011L11.8754 4.12677L11.1607 3.41411L11.3867 3.18611C11.5114 3.06077 11.6587 2.92677 11.7147 2.88811C11.8111 2.81905 11.9242 2.7769 12.0423 2.76601C12.1604 2.75511 12.2793 2.77585 12.3867 2.82611ZM10.9334 5.08144L11.6401 5.78944L8.62672 8.78477L5.61339 11.7801L4.72472 11.9854C4.23539 12.0988 3.82939 12.1854 3.82206 12.1781C3.81472 12.1708 3.90206 11.7588 4.01539 11.2621L4.22206 10.3601L7.21072 7.36677C8.85472 5.72011 10.2061 4.37344 10.2134 4.37344C10.2207 4.37344 10.5447 4.69211 10.9334 5.08144Z"
								fill="#7054FD"
								fillRule="evenodd"
							/>
						</svg>
					</button>
				</div>
				<div className="pr-[var(--spacing-4,16px)]" />
				<div className="flex flex-col">
					<p
						className={`
							${fontStyles.titleLargePrimary}self-stretch text-[var(--grey-800,#292929)]`}
					>
						Victoria Wong
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
							victoriarwong@gmail.com
						</p>
					</div>
				</div>
			</div>
			<div className="relative flex items-center justify-between pb-[16px]">
				<p
					className={`
						${fontStyles.titleLargePrimary}text-[var(--grey-800,#292929)]`}
				>
					Personal Information
				</p>
				<button
					className={
						!isEditing
							? "flex cursor-pointer items-center gap-[4px] px-[12px] py-[6px]"
							: "flex cursor-pointer items-center gap-[8px] rounded-xl bg-[var(--purple-500,#7054FD)] p-[10px_16px]"
					}
					onClick={() => setIsEditing(!isEditing)}
					type="button"
				>
					{!isEditing && (
						<>
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
						</>
					)}

					{isEditing && (
						<p
							className={`${fontStyles.titleMediumPrimary}text-[var(--grey-00,#FFF)]`}
						>
							Save changes
						</p>
					)}
				</button>
			</div>
			<div className="inline-grid w-full grid-flow-row grid-rows-[repeat(2,fit-content(100%))] gap-x-[var(--spacing-9,48px)] gap-y-[24px] self-stretch rounded-[var(--radius-4,16px)] border border-[var(--grey-300,#D6D6D6)] border-solid p-[var(--spacing-6,24px)] sm:grid-cols-[repeat(2,minmax(0,1fr))]">
				<div>
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
							Victoria
						</p>
					)}
					{isEditing && (
						<input
							className={`${editFieldStyle}`}
							defaultValue={"Victoria"}
							id="firstName"
							type="text"
						/>
					)}
				</div>
				<div>
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
							Wong
						</p>
					)}
					{isEditing && (
						<input
							className={`${editFieldStyle}`}
							defaultValue={"Wong"}
							id="firstName"
							type="text"
						/>
					)}
				</div>
				<div>
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
							University of Calgary
						</p>
					)}
					{isEditing && (
						<select className={`${editFieldStyle}`}>
							<option value={"University of Calgary"}>
								University of Calgary (UOfC)
							</option>
							<option value={"Southern Alberta Institute of Technology"}>
								Southern Alberta Institute of Technology (SAIT)
							</option>
							<option value={"Mount Royal University"}>
								Mount Royal University (MRU)
							</option>
							<option value={"Other"}>Other</option>
						</select>
					)}
				</div>
				<div>
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
							Computer Science
						</p>
					)}
					{isEditing && (
						<select className={`${editFieldStyle}`}>
							<option value={"Computer Science"}>Computer Science</option>
							<option value={"Software Engineering"}>
								Software Engineering
							</option>
							<option value={"Other"}>Other</option>
						</select>
					)}
				</div>
			</div>
		</div>
	);
}
