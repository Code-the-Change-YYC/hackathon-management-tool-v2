import { describe, expect, it } from "vitest";
import { SCHOOL_NOT_LISTED } from "@/lib/schools";
import {
	getProfileDefaults,
	type ProfileInput,
	profileFormSchema,
	profileSchema
} from "@/lib/validation/profile";

const validForm: ProfileInput = {
	firstName: "Maria Anne",
	lastName: "De La Cruz",
	age: 19,
	phoneNumber: "+14035550123",
	countryOfResidence: "CA",
	school: "Mount Royal University",
	otherSchool: "",
	levelOfStudy: "undergraduate_three_plus_year",
	program: null
};

function getErrorPaths(result: { success: boolean; error?: unknown }) {
	if (result.success) return [];
	const { issues } = result.error as { issues: { path: unknown[] }[] };
	return issues.map((issue) => issue.path.join("."));
}

describe("profile form", () => {
	it("keeps first and last names as entered", () => {
		const result = profileFormSchema.parse(validForm);

		expect(result).toMatchObject({
			firstName: "Maria Anne",
			lastName: "De La Cruz",
			school: "Mount Royal University"
		});
	});

	it("saves a school that isn't listed by the name typed in", () => {
		const result = profileFormSchema.parse({
			...validForm,
			school: SCHOOL_NOT_LISTED,
			otherSchool: "  Western Canada High School "
		});

		expect(result.school).toBe("Western Canada High School");
		expect(result).not.toHaveProperty("otherSchool");
	});

	it("asks for the school's name when it isn't listed", () => {
		const result = profileFormSchema.safeParse({
			...validForm,
			school: SCHOOL_NOT_LISTED,
			otherSchool: " "
		});

		expect(getErrorPaths(result)).toEqual(["otherSchool"]);
	});

	it("only keeps a major for University of Calgary students", () => {
		expect(
			getErrorPaths(
				profileFormSchema.safeParse({
					...validForm,
					school: "University of Calgary"
				})
			)
		).toEqual(["program"]);
		expect(
			profileFormSchema.parse({ ...validForm, program: "computer_science" })
				.program
		).toBeNull();
	});

	it("accepts real phone numbers from the phone input", () => {
		for (const phoneNumber of ["+14035550123", "+442079460958"]) {
			expect(
				profileFormSchema.safeParse({ ...validForm, phoneNumber }).success
			).toBe(true);
		}
		// Too short, an area code that doesn't exist, and no country code.
		for (const phoneNumber of ["+1403555", "+15555550123", "4035550123"]) {
			expect(
				getErrorPaths(
					profileFormSchema.safeParse({ ...validForm, phoneNumber })
				)
			).toEqual(["phoneNumber"]);
		}
	});

	it("turns the typed age into a whole number between 13 and 99", () => {
		expect(profileFormSchema.parse({ ...validForm, age: "19" }).age).toBe(19);

		for (const [age, message] of [
			["", "Enter your age"],
			["abc", "Enter your age as a number"],
			["19.5", "Enter your age as a whole number"],
			["12", "Participants must be at least 13"],
			["100", "Enter an age of 99 or under"]
		]) {
			const result = profileFormSchema.safeParse({ ...validForm, age });
			expect(result.error?.issues).toEqual([
				expect.objectContaining({ message, path: ["age"] })
			]);
		}
	});

	it("requires an ISO country code", () => {
		expect(
			getErrorPaths(
				profileFormSchema.safeParse({
					...validForm,
					countryOfResidence: "Canada"
				})
			)
		).toEqual(["countryOfResidence"]);
	});

	it("produces what the API accepts", () => {
		const values = profileFormSchema.parse(validForm);

		expect(profileSchema.parse(values)).toEqual(values);
	});
});

describe("profile form defaults", () => {
	const user = {
		name: "Maria Anne De La Cruz",
		firstName: "Maria Anne",
		lastName: "De La Cruz",
		school: "Mount Royal University",
		schoolIsListed: true
	};

	it("prefers the saved first and last names", () => {
		expect(getProfileDefaults(user)).toMatchObject({
			firstName: "Maria Anne",
			lastName: "De La Cruz"
		});
		expect(
			getProfileDefaults({ ...user, firstName: null, lastName: null })
		).toMatchObject({ firstName: "Maria", lastName: "Anne De La Cruz" });
	});

	it("gives the phone input saved numbers in E.164 format", () => {
		expect(
			getProfileDefaults({ ...user, phoneNumber: "+14035550123" })
		).toMatchObject({ phoneNumber: "+14035550123" });
		expect(
			getProfileDefaults({ ...user, phoneNumber: "(403) 555-0123" })
		).toMatchObject({ phoneNumber: "+14035550123" });
	});

	it("shows a school that isn't on MLH's list as typed in", () => {
		expect(getProfileDefaults(user)).toMatchObject({
			school: "Mount Royal University",
			otherSchool: ""
		});
		expect(
			getProfileDefaults({
				...user,
				school: "Western Canada High School",
				schoolIsListed: false
			})
		).toMatchObject({
			school: SCHOOL_NOT_LISTED,
			otherSchool: "Western Canada High School"
		});
	});
});
