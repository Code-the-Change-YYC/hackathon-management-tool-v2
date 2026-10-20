import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminEvent } from "@/app/components/admin/schedule/EventDialog";
import { ScheduleView } from "@/app/components/admin/schedule/ScheduleView";
import { EventStatus, EventType } from "@/types/types";

const mocks = vi.hoisted(() => ({
	add: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
	refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: mocks.refresh })
}));

vi.mock("@/trpc/react", () => ({
	api: {
		events: {
			addEvent: {
				useMutation: () => ({ mutate: mocks.add, isPending: false })
			},
			updateEvent: {
				useMutation: () => ({ mutate: mocks.update, isPending: false })
			},
			deleteEvent: {
				useMutation: () => ({ mutate: mocks.remove, isPending: false })
			}
		}
	}
}));

const lunch: AdminEvent = {
	id: "11111111-1111-4111-8111-111111111111",
	title: "Lunch",
	description: "Pizza",
	location: "Dining Hall",
	navigationUrl: null,
	type: EventType.FOOD,
	status: EventStatus.DRAFT,
	startTime: new Date("2026-11-07T19:00:00Z"),
	endTime: new Date("2026-11-07T20:00:00Z"),
	createdAt: new Date(),
	updatedAt: new Date()
};

function change(label: string, value: string) {
	fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function pickDay(label: string, day: RegExp) {
	fireEvent.click(
		screen.getByRole("button", { name: new RegExp(`^${label} `) })
	);
	for (
		let month = 0;
		month < 24 && !screen.queryByRole("button", { name: day });
		month++
	) {
		fireEvent.click(await screen.findByRole("button", { name: /next month/i }));
	}
	fireEvent.click(screen.getByRole("button", { name: day }));
}

function submit() {
	fireEvent.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Add event"
		})
	);
}

function openMenu(title: string) {
	fireEvent.click(screen.getByRole("button", { name: `Manage ${title}` }));
}

beforeEach(() => vi.clearAllMocks());

describe("admin schedule", () => {
	it("shows an empty state", () => {
		render(<ScheduleView events={[]} />);
		expect(
			screen.getByText("No events have been scheduled yet")
		).toBeInTheDocument();
	});

	it("marks hidden events and shows their location", () => {
		render(<ScheduleView events={[lunch]} />);
		expect(screen.getByText("Hidden")).toBeInTheDocument();
		expect(screen.getByText("Dining Hall")).toBeInTheDocument();
	});

	it("validates and adds an event in Calgary time", async () => {
		render(<ScheduleView events={[]} />);
		fireEvent.click(screen.getByRole("button", { name: "Add event" }));
		submit();
		expect(await screen.findByText("Enter a title.")).toBeInTheDocument();
		expect(screen.getByText("Choose a date.")).toBeInTheDocument();
		expect(screen.getByText("Choose a start time.")).toBeInTheDocument();
		expect(screen.getByText("Choose an end time.")).toBeInTheDocument();
		expect(mocks.add).not.toHaveBeenCalled();

		change("Title", "  Trivia  ");
		change("Description", "Win prizes");
		await pickDay("Date", /November 7th, 2026/);
		change("Starts", "14:00");
		change("Ends", "13:00");
		change("URL (optional)", "javascript:alert(1)");
		submit();
		expect(
			await screen.findByText("End time must be after start time.")
		).toBeInTheDocument();
		expect(
			screen.getByText("Use an HTTP or HTTPS URL.", { exact: false })
		).toBeInTheDocument();

		change("Ends", "15:00");
		change("URL (optional)", "");
		fireEvent.click(screen.getByRole("radio", { name: "Ceremony" }));
		submit();
		await waitFor(() =>
			expect(mocks.add).toHaveBeenCalledWith({
				title: "Trivia",
				description: "Win prizes",
				type: EventType.CEREMONY,
				status: EventStatus.ACTIVE,
				location: null,
				navigationUrl: null,
				startTime: new Date("2026-11-07T14:00:00-06:00"),
				endTime: new Date("2026-11-07T15:00:00-06:00")
			})
		);
	});

	it("edits an existing event", async () => {
		render(<ScheduleView events={[lunch]} />);
		openMenu("Lunch");
		fireEvent.click(await screen.findByRole("menuitem", { name: "Edit" }));
		expect(screen.getByLabelText("Title")).toHaveValue("Lunch");
		expect(screen.getByRole("radio", { name: "Food" })).toBeChecked();
		expect(screen.getByLabelText("Date")).toHaveTextContent(
			"Saturday, November 7, 2026"
		);
		expect(screen.getByLabelText("Starts")).toHaveValue("13:00");
		expect(screen.getByLabelText("Ends")).toHaveValue("14:00");
		expect(
			screen.getByRole("checkbox", { name: "Show on the participant schedule" })
		).not.toBeChecked();

		change("Location", "Atrium");
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
		await waitFor(() =>
			expect(mocks.update).toHaveBeenCalledWith(
				expect.objectContaining({
					id: lunch.id,
					location: "Atrium",
					status: EventStatus.DRAFT,
					startTime: lunch.startTime,
					endTime: lunch.endTime
				})
			)
		);
	});

	it("deletes only after confirming", async () => {
		render(<ScheduleView events={[lunch]} />);
		openMenu("Lunch");
		fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
		fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
		expect(mocks.remove).not.toHaveBeenCalled();

		openMenu("Lunch");
		fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
		fireEvent.click(
			await screen.findByRole("button", { name: "Delete event" })
		);
		await waitFor(() =>
			expect(mocks.remove).toHaveBeenCalledWith({ id: lunch.id })
		);
	});
});
