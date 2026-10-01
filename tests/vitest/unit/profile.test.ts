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
	phoneNumber: "+1 (403) 555-0123",
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

	it("accepts phone numbers with an area code in common formats", () => {
		for (const phoneNumber of [
			"4035550123",
			"403-555-0123",
			"(403) 555.0123",
			"+44 20 7946 0958"
		]) {
			expect(
				profileFormSchema.safeParse({ ...validForm, phoneNumber }).success
			).toBe(true);
		}
		for (const phoneNumber of [
			"555-0123",
			"call me",
			"+1 403 555 0123 ext 4"
		]) {
			expect(
				getErrorPaths(
					profileFormSchema.safeParse({ ...validForm, phoneNumber })
				)
			).toEqual(["phoneNumber"]);
		}
	});

	it("requires an age from the list and an ISO country code", () => {
		expect(
			getErrorPaths(profileFormSchema.safeParse({ ...validForm, age: 12 }))
		).toEqual(["age"]);
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
