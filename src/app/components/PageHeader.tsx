interface PageHeaderProps {
	title: string;
	description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
	return (
		<div className="flex flex-col gap-1">
			<h1 className="font-semibold text-2xl md:text-3xl">{title}</h1>
			<p className="text-muted-foreground text-sm">{description}</p>
		</div>
	);
}
