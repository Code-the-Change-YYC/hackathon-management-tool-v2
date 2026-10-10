"use client";

import MentorEntry from "./MentorEntry";

// TODO: Populate with actual people
const eventsMembers = [
	{
		name: "Events Person",
		discord: "test_handle1",
		role: "Events"
	},
	{
		name: "Events Person",
		discord: "test_handle2",
		role: "Events"
	},
	{
		name: "Events Person",
		discord: "test_handle3",
		role: "Events"
	},
	{
		name: "Events Person",
		discord: "test_handle4",
		role: "Events"
	},
	{
		name: "Events Person",
		discord: "test_handle5",
		role: "Events"
	},
	{
		name: "Events Person",
		discord: "test_handle6",
		role: "Events"
	}
];

const techMembers = [
	{ name: "Tech Person", discord: "test_handle7", role: "Tech" },
	{ name: "Tech Person", discord: "test_handle8", role: "Tech" },
	{ name: "Tech Person", discord: "test_handle9", role: "Tech" },
	{ name: "Tech Person", discord: "test_handle10", role: "Tech" },
	{ name: "Tech Person", discord: "test_handle11", role: "Tech" },
	{ name: "Tech Person", discord: "test_handle12", role: "Tech" }
];

const generalMembers = [
	{
		name: "Person",
		discord: "test_handle13",
		role: "President"
	},
	{
		name: "Person",
		discord: "test_handle14",
		role: "President"
	},
	{
		name: "Person",
		discord: "test_handle15",
		role: "President"
	},
	{
		name: "Person",
		discord: "test_handle16",
		role: "President"
	},
	{
		name: "Person",
		discord: "test_handle17",
		role: "President"
	},
	{
		name: "Person",
		discord: "test_handle18",
		role: "President"
	}
];

const industryMembers = [
	{
		name: "Industry Person",
		discord: "test_handle19",
		role: "Some Company"
	},
	{
		name: "Industry Person",
		discord: "test_handle20",
		role: "Some Company"
	},
	{
		name: "Industry Person",
		discord: "test_handle21",
		role: "Some Company"
	},
	{
		name: "Industry Person",
		discord: "test_handle22",
		role: "Some Company"
	},
	{
		name: "Industry Person",
		discord: "test_handle23",
		role: "Some Company"
	},
	{
		name: "Industry Person",
		discord: "test_handle24",
		role: "Some Company"
	},
	{
		name: "Industry Person",
		discord: "test_handle25",
		role: "Some Company"
	},
	{
		name: "Industry Person",
		discord: "test_handle26",
		role: "Some Company"
	},
	{
		name: "Industry Person",
		discord: "test_handle27",
		role: "Some Company"
	},
	{
		name: "Industry Person",
		discord: "test_handle28",
		role: "Some Company"
	}
];

export default function MentorsSection() {
	return (
		<div className="flex flex-col gap-4">
			<h1 className="font-medium text-[22px] leading-7">Mentors</h1>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(192px,1fr))] justify-items-center gap-4">
				{eventsMembers.map((member) => (
					<MentorEntry
						background="bg-primary"
						discord={member.discord}
						key={member.name + member.discord}
						name={member.name}
						role={member.role}
					/>
				))}
				{techMembers.map((member) => (
					<MentorEntry
						background="bg-primary"
						discord={member.discord}
						key={member.name + member.discord}
						name={member.name}
						role={member.role}
					/>
				))}
				{generalMembers.map((member) => (
					<MentorEntry
						background="bg-primary"
						discord={member.discord}
						key={member.name + member.discord}
						name={member.name}
						role={member.role}
					/>
				))}
				{industryMembers.map((member) => (
					<MentorEntry
						background="bg-primary"
						discord={member.discord}
						key={member.name + member.discord}
						name={member.name}
						role={member.role}
					/>
				))}
			</div>
		</div>
	);
}
