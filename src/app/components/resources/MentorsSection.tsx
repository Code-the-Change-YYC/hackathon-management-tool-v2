"use client";

import MentorEntry from "./MentorEntry";

const eventsMembers = [
	{
		name: "Simar Kandola",
		discord: "_the_real_ninja",
		role: "VP Events"
	},
	{ name: "Tanvi Mahal", discord: "tm.88", role: "Jr VP Events" },
	{
		name: "May Liu",
		discord: "pickupmay",
		role: "Event Coordinator"
	},
	{
		name: "Adithya Sagar",
		discord: "adithyasagar778",
		role: "Event Coordinator"
	},
	{
		name: "Anthony Chan",
		discord: "anthonyych4n",
		role: "Event Coordinator"
	},
	{
		name: "Hira Asad",
		discord: "purplebarney84",
		role: "Event Coordinator"
	},
	{
		name: "Abudllah Yousaf",
		discord: "nicetrylilbro",
		role: "Event Coordinator"
	}
];

const techMembers = [
	{ name: "Burton Jong", discord: "j05ng", role: "VP Tech" },
	{
		name: "Simar Kandola",
		discord: "_the_real_ninja",
		role: "HTC Developer"
	},
	{
		name: "Fiona Truong",
		discord: ".fionaaa",
		role: "HTC Developer"
	},
	{ name: "Matthew Liu", discord: "degr8sid", role: "Tech Lead" },
	{ name: "Yahya Asmara", discord: "aphva", role: "Developer" },
	{ name: "Jason Duong", discord: "plehhelp", role: "Developer" }
];

const generalMembers = [
	{
		name: "Fiona Truong",
		discord: ".fionaaa",
		role: "Co-President"
	},
	{
		name: "Nathan Phan",
		discord: "natphaan",
		role: "Co-President"
	},
	{ name: "Victoria Wong", discord: "shib3", role: "VP Design" },
	{ name: "Ryan Obiar", discord: "", role: "VP Marketing" },
	{ name: "Grace Ilori", discord: "g542_542", role: "VP External" },
	{
		name: "Hanna Cho",
		discord: "hannagracec",
		role: "Marketing Commissioner"
	}
];

const industryMembers = [
	{
		name: "Alexandru Parcioaga",
		discord: "alexandrumentor_87981_83719",
		role: "Arcurve"
	},
	{
		name: "Karam Baroud",
		discord: "yeezy.yeezus",
		role: "ZeroKey"
	},
	{
		name: "Sankar Achary Jankoti",
		discord: "sankarjankoti_38615",
		role: "Infosys Limited"
	},
	{
		name: "Anthony Dam",
		discord: "anthony.cs",
		role: "Prev @ IBM"
	},
	{
		name: "Sidrah Abdullah",
		discord: "degr8sid",
		role: "University of Calgary"
	},
	{
		name: "Farnaz Sheikhi",
		discord: "",
		role: "University of Calgary"
	},
	{
		name: "Miti Mazmudar",
		discord: "dettanym",
		role: "University of Calgary"
	},
	{ name: "Burton Jong", discord: "j05ng", role: "Pason" },
	{ name: "Anthony Chan", discord: "anthonyych4n", role: "Cisco" },
	{ name: "Matthew Liu", discord: "degr8sid", role: "Enbridge" }
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
						key={member.name}
						name={member.name}
						role={member.role}
					/>
				))}
				{techMembers.map((member) => (
					<MentorEntry
						background="bg-primary"
						discord={member.discord}
						key={member.name}
						name={member.name}
						role={member.role}
					/>
				))}
				{generalMembers.map((member) => (
					<MentorEntry
						background="bg-primary"
						discord={member.discord}
						key={member.name}
						name={member.name}
						role={member.role}
					/>
				))}
				{industryMembers.map((member) => (
					<MentorEntry
						background="bg-primary"
						discord={member.discord}
						key={member.name}
						name={member.name}
						role={member.role}
					/>
				))}
			</div>
		</div>
	);
}
