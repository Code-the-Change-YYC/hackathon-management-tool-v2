"use client";

import Image from "next/image";
import { Modal, ModalHeader, PrimaryButton } from "./Modal";

export default function SuccessModal({
	open,
	onFinish,
	title,
	description,
	image,
	imageAlt,
	imageSize = 180,
	children
}: {
	open: boolean;
	onFinish: () => void;
	title: React.ReactNode;
	description: React.ReactNode;
	image: string;
	imageAlt: string;
	imageSize?: number;
	children?: React.ReactNode;
}) {
	return (
		<Modal onClose={onFinish} open={open} showClose={false}>
			<ModalHeader description={description} title={title} />

			<div className="flex justify-center py-2">
				<Image
					alt={imageAlt}
					height={imageSize}
					src={image}
					width={imageSize}
				/>
			</div>

			{children}

			<PrimaryButton onClick={onFinish} type="button">
				Finish
			</PrimaryButton>
		</Modal>
	);
}
