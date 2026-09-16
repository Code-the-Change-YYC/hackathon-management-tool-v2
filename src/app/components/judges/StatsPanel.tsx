import type { IconProps } from "@mingcute/react";
import type { ElementType } from "react";
import Card from "../Dashboard/Card";

interface StatsPanelProps {
	icon: ElementType<IconProps>;
	stat: number;
	subheader: string;
}

const StatsPanel = (props: StatsPanelProps) => {
	const { icon, stat, subheader } = props;
	const Icon = icon;

	return (
		<Card className="flex-1">
			<div
				className={
					"flex size-12 items-center justify-center rounded-full bg-pastel-pink"
				}
			>
				<Icon aria-hidden="true" className="text-dark-pink" size={32} />
			</div>
			<h1 className={"my-2 font-semibold text-5xl"}>
				<i>{stat}</i>
			</h1>
			<p className={"max-w-37.5 text-center"}>{subheader}</p>
		</Card>
	);
};

export default StatsPanel;
