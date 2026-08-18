import type { Entry, EntryFieldTypes, EntrySkeletonType } from "contentful";

interface AlumniFields {
	fullName: EntryFieldTypes.Symbol;
	linkedin: EntryFieldTypes.Symbol;
	orderNumber: EntryFieldTypes.Integer;
	position: EntryFieldTypes.Symbol;
	previousRole: EntryFieldTypes.Symbol;
	testimonial: EntryFieldTypes.Text;
	profile: EntryFieldTypes.AssetLink;
}

type AlumniSkeleton = EntrySkeletonType<AlumniFields, "alumni">;
export type Alumni = Entry<AlumniSkeleton>;

interface JudgeFields {
	judgeImg: EntryFieldTypes.AssetLink;
	judgeName: EntryFieldTypes.Symbol;
	judgeCompany: EntryFieldTypes.Symbol;
	orderNumber?: EntryFieldTypes.Integer;
	position?: EntryFieldTypes.Symbol;
}

type JudgeSkeleton = EntrySkeletonType<JudgeFields, "hackathonJudge">;
export type Judge = Entry<JudgeSkeleton>;

interface HackathonSponsorFields {
	sponsorOrder: EntryFieldTypes.Integer;
	sponsorImg: EntryFieldTypes.AssetLink;
	sponsorName: EntryFieldTypes.Symbol;
	sponsorPage: EntryFieldTypes.Symbol;
}

type HackathonSponsorSkeleton = EntrySkeletonType<
	HackathonSponsorFields,
	"hackathonSponsor"
>;
export type HackathonSponsor = Entry<HackathonSponsorSkeleton>;

interface HackathonDetailsFields {
	eventName: EntryFieldTypes.Symbol;
	eventBlurb: EntryFieldTypes.Text;
	eventDate: EntryFieldTypes.Date;
	locationName: EntryFieldTypes.Symbol;
	locationImage: EntryFieldTypes.AssetLink;
	prizeAmount: EntryFieldTypes.Number;
	closingCeremony: EntryFieldTypes.Date;
}

type HackathonDetailsSkeleton = EntrySkeletonType<
	HackathonDetailsFields,
	"hackathonDetails"
>;
export type HackathonDetails = Entry<HackathonDetailsSkeleton>;

interface CeremonyDetailsFields {
	openingCeremonyLocation: EntryFieldTypes.Symbol;
	openingCeremonyDate: EntryFieldTypes.Date;
	closingCeremonyLocation: EntryFieldTypes.Symbol;
	closingCeremonyDate: EntryFieldTypes.Date;
}

type CeremonyDetailsSkeleton = EntrySkeletonType<
	CeremonyDetailsFields,
	"ceremonyDetails"
>;
export type CeremonyDetails = Entry<CeremonyDetailsSkeleton>;

export interface PastHackathonWinnerFields {
	projectName: EntryFieldTypes.Symbol;
	projectDescription?: EntryFieldTypes.Text;
	projectImage?: EntryFieldTypes.AssetLink;
	hackathonName?: EntryFieldTypes.Symbol;
	teamName?: EntryFieldTypes.Symbol;
	teamRanking?: EntryFieldTypes.Integer;
	awardName?: EntryFieldTypes.Symbol;
	link?: EntryFieldTypes.Symbol;
}

type PastHackathonWinnerSkeleton = EntrySkeletonType<
	PastHackathonWinnerFields,
	"pastHackathonWinner"
>;
export type PastHackathonWinner = Entry<PastHackathonWinnerSkeleton>;

type UnknownContentType<Id extends string> = EntrySkeletonType<
	Record<string, EntryFieldTypes.Object>,
	Id
>;

export interface ContentTypeMap {
	alumni: AlumniSkeleton;
	hackathonJudge: JudgeSkeleton;
	hackathonSponsor: HackathonSponsorSkeleton;
	hackathonDetails: HackathonDetailsSkeleton;
	event: UnknownContentType<"event">;
	executive: UnknownContentType<"executive">;
	pastEvents: UnknownContentType<"pastEvents">;
	timeline: UnknownContentType<"timeline">;
	upcomingEvents: UnknownContentType<"upcomingEvents">;
	ceremonyDetails: CeremonyDetailsSkeleton;
	pastHackathonWinner: PastHackathonWinnerSkeleton;
}
