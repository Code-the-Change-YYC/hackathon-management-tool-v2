import UserTable from "@/app/components/admin/usertable/UserTable";

export default function Users() {
	return (
		<main className="flex size-full flex-1 flex-col overflow-y-auto bg-white">
			<UserTable />
		</main>
	);
}
