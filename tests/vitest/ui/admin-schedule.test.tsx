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
	updateDates: vi.fn(),
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
		},
		hackathonSettings: {
			updateDates: {
				useMutation: () => ({ mutate: mocks.updateDates, isPending: false })
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

const settings = {
	startDate: new Date("2026-11-07T09:00:00-06:00"),
	endDate: new Date("2026-11-08T17:00:00-06:00"),
	submissionDeadline: new Date("2026-11-08T12:00:00-06:00")
};

function change(
	label: string,
	value: string,
	scope: Pick<typeof screen, "getByLabelText"> = screen
) {
	fireEvent.change(scope.getByLabelText(label), { target: { value } });
}

async function pickDay(
	label: string,
	day: RegExp,
	scope: Pick<typeof screen, "getByRole"> = screen
) {
	fireEvent.click(
		scope.getByRole("button", { name: new RegExp(`^${label} `) })
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

function datesGroup(name: string) {
	return within(screen.getByRole("group", { name }));
}

function saveDates() {
	fireEvent.click(screen.getByRole("button", { name: "Save dates" }));
}

function openMenu(title: string) {
	fireEvent.click(screen.getByRole("button", { name: `Manage ${title}` }));
}

beforeEach(() => vi.clearAllMocks());

describe("admin schedule", () => {
	it("shows an empty state", () => {
		render(<ScheduleView events={[]} settings={null} />);
		expect(
			screen.getByText("No events have been scheduled yet")
		).toBeInTheDocument();
	});

	it("marks hidden events and shows their location", () => {
		render(<ScheduleView events={[lunch]} settings={null} />);
		expect(screen.getByText("Hidden")).toBeInTheDocument();
		expect(screen.getByText("Dining Hall")).toBeInTheDocument();
	});

	it("validates and adds an event in Calgary time", async () => {
		render(<ScheduleView events={[]} settings={null} />);
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
		render(<ScheduleView events={[lunch]} settings={null} />);
		openMenu("Lunch");
		fireEvent.click(await screen.findByRole("menuitem", { name: "Edit" }));
		expect(screen.getByLabelText("Title")).toHaveValue("Lunch");
		expect(screen.getByRole("radio", { name: "Food" })).toBeChecked();
		expect(
			within(screen.getByRole("dialog")).getByLabelText("Date")
		).toHaveTextContent("Saturday, November 7, 2026");
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

	it("keeps the date within the hackathon", async () => {
		render(
			<ScheduleView
				events={[lunch]}
				settings={{
					startDate: new Date("2026-11-08T09:00:00-06:00"),
					endDate: new Date("2026-11-09T17:00:00-06:00"),
					submissionDeadline: null
				}}
			/>
		);
		openMenu("Lunch");
		fireEvent.click(await screen.findByRole("menuitem", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
		expect(
			await screen.findByText(
				"Choose a date during the hackathon, November 8, 2026 to November 9, 2026."
			)
		).toBeInTheDocument();
		expect(mocks.update).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: /^Date / }));
		expect(
			screen.getByRole("button", { name: /November 7th, 2026/ })
		).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: /November 8th, 2026/ }));
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
		await waitFor(() =>
			expect(mocks.update).toHaveBeenCalledWith(
				expect.objectContaining({
					startTime: new Date("2026-11-08T13:00:00-06:00"),
					endTime: new Date("2026-11-08T14:00:00-06:00")
				})
			)
		);
	});

	it("deletes only after confirming", async () => {
		render(<ScheduleView events={[lunch]} settings={null} />);
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

	it("shows the saved hackathon dates", () => {
		render(<ScheduleView events={[]} settings={settings} />);
		expect(
			datesGroup("Hackathon start").getByRole("button", { name: /^Date / })
		).toHaveTextContent("Saturday, November 7, 2026");
		expect(datesGroup("Hackathon start").getByLabelText("Time")).toHaveValue(
			"09:00"
		);
		expect(datesGroup("Hackathon end").getByLabelText("Time")).toHaveValue(
			"17:00"
		);
		expect(
			datesGroup("Submission deadline").getByLabelText("Time")
		).toHaveValue("12:00");
		expect(screen.getByRole("button", { name: "Save dates" })).toBeDisabled();
	});

	it("requires a start and end", async () => {
		render(<ScheduleView events={[]} settings={null} />);
		const deadline = datesGroup("Submission deadline");
		change("Time", "12:00", deadline);
		saveDates();
		expect(
			await datesGroup("Hackathon start").findByText("Choose a date.")
		).toBeInTheDocument();
		expect(
			datesGroup("Hackathon start").getByText("Choose a time.")
		).toBeInTheDocument();
		expect(
			datesGroup("Hackathon end").getByText("Choose a date.")
		).toBeInTheDocument();
		expect(deadline.getByText("Choose a date.")).toBeInTheDocument();
		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
	});

	it("keeps the deadline between the start and end", async () => {
		render(<ScheduleView events={[]} settings={settings} />);
		await pickDay("Date", /November 6th, 2026/, datesGroup("Hackathon end"));
		saveDates();
		expect(
			await datesGroup("Hackathon end").findByText(
				"The end must be after the start."
			)
		).toBeInTheDocument();
		expect(
			datesGroup("Submission deadline").getByText(
				"The deadline can’t be after the end."
			)
		).toBeInTheDocument();
		expect(mocks.updateDates).not.toHaveBeenCalled();
	});

	it("blocks dates that leave events outside the hackathon", async () => {
		render(<ScheduleView events={[lunch]} settings={settings} />);
		await pickDay("Date", /November 8th, 2026/, datesGroup("Hackathon start"));
		change("Time", "08:00", datesGroup("Hackathon start"));
		saveDates();
		expect(
			await datesGroup("Hackathon start").findByText(
				"1 event is scheduled before this day. Move or delete it first."
			)
		).toBeInTheDocument();
		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
	});

	it("confirms the changed dates before saving", async () => {
		render(<ScheduleView events={[lunch]} settings={settings} />);
		change("Time", "10:00", datesGroup("Hackathon start"));
		change("Time", "", datesGroup("Submission deadline"));
		saveDates();
		expect(
			await datesGroup("Submission deadline").findByText("Choose a time.")
		).toBeInTheDocument();

		await pickDay(
			"Date",
			/November 8th, 2026/,
			datesGroup("Submission deadline")
		);
		saveDates();
		const dialog = within(await screen.findByRole("alertdialog"));
		expect(dialog.getByText("Start")).toBeInTheDocument();
		expect(
			dialog.getByText(/Nov 7, 2026, 9:00 AM.*Nov 7, 2026, 10:00 AM/)
		).toBeInTheDocument();
		expect(dialog.getByText("Submission deadline")).toBeInTheDocument();
		expect(
			dialog.getByText(/Nov 8, 2026, 12:00 PM.*Not set/)
		).toBeInTheDocument();
		expect(dialog.queryByText("End")).not.toBeInTheDocument();

		fireEvent.click(dialog.getByRole("button", { name: "Cancel" }));
		expect(mocks.updateDates).not.toHaveBeenCalled();

		saveDates();
		fireEvent.click(
			within(await screen.findByRole("alertdialog")).getByRole("button", {
				name: "Save dates"
			})
		);
		await waitFor(() =>
			expect(mocks.updateDates).toHaveBeenCalledWith({
				startDate: new Date("2026-11-07T10:00:00-06:00"),
				endDate: settings.endDate,
				submissionDeadline: null
			})
		);
	});
});
