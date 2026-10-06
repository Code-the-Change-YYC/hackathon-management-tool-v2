"use client";

import { NotificationLine } from "@mingcute/react";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useEffectEvent } from "react";
import {
	AppSidebarContent,
	type AppSidebarProps
} from "@/app/components/layout/AppSidebar";
import { Button } from "@/app/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle
} from "@/app/components/ui/sheet";
import {
	Sidebar,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	useSidebar
} from "@/app/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

function ParticipantNavigation({
	children,
	...sidebarProps
}: AppSidebarProps & { children: ReactNode }) {
	const { open, openMobile, setOpen, setOpenMobile } = useSidebar();
	const pathname = usePathname();
	const isDrawer = useIsMobile("(min-width: 80rem)");
	const closeDrawer = useEffectEvent(() => {
		setOpenMobile(false);
		setOpen(true);
	});
	useEffect(() => {
		// Changing routes or layout closes the drawer; toggling it does not.
		void pathname;
		void isDrawer;
		closeDrawer();
	}, [pathname, isDrawer]);
	return (
		<>
			<aside className="hidden w-(--sidebar-width) shrink-0 xl:block">
				<Sidebar className="fixed inset-y-0" collapsible="none">
					<AppSidebarContent {...sidebarProps} />
				</Sidebar>
			</aside>
			<Sheet
				onOpenChange={(value) => {
					setOpenMobile(value);
					setOpen(true);
				}}
				open={isDrawer && (openMobile || !open)}
			>
				<SheetContent
					className="bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-72"
					showCloseButton={false}
					side="left"
				>
					<SheetHeader className="sr-only">
						<SheetTitle>Participant navigation</SheetTitle>
						<SheetDescription>
							Browse participant pages and resources.
						</SheetDescription>
					</SheetHeader>
					<AppSidebarContent {...sidebarProps} />
				</SheetContent>
			</Sheet>
			<SidebarInset>
				<header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 bg-grey-50 px-6 py-1 xl:hidden">
					<SidebarTrigger className="size-12 rounded-full p-3 [&_svg:not([class*='size-'])]:size-6" />
					<Button
						aria-label="Notifications"
						className="size-12 rounded-full p-3"
						size="icon-sm"
						variant="ghost"
					>
						<NotificationLine aria-hidden className="size-6" />
					</Button>
				</header>
				{children}
			</SidebarInset>
		</>
	);
}

export function ParticipantShell(
	props: AppSidebarProps & { children: ReactNode }
) {
	return (
		<SidebarProvider
			style={{ "--sidebar-width": "209px" } as React.CSSProperties}
		>
			<ParticipantNavigation {...props} />
		</SidebarProvider>
	);
}
