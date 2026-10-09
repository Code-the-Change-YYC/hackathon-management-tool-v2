// Sets consitent padding for all pages in the app
export default function PageContainer({
	children
}: {
	children: React.ReactNode;
}) {
	return <div className="p-6 md:px-12 md:py-8">{children}</div>;
}
