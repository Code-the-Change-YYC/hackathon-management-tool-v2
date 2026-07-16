"use client";

import {
	ArrowRightIcon,
	BellIcon,
	CheckIcon,
	PlusIcon,
	SearchIcon,
	SettingsIcon,
	Trash2Icon,
	UserIcon
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from "@/components/ui/tooltip";

const SECTIONS = [
	{ id: "colors", label: "Colors" },
	{ id: "typography", label: "Typography" },
	{ id: "radius", label: "Radius" },
	{ id: "buttons", label: "Buttons" },
	{ id: "badges", label: "Badges" },
	{ id: "forms", label: "Forms & Inputs" },
	{ id: "selection", label: "Selection Controls" },
	{ id: "overlays", label: "Overlays" },
	{ id: "data", label: "Data Display" },
	{ id: "feedback", label: "Feedback" }
] as const;

const BRAND_PALETTE: Array<[string, string]> = [
	["strawberry-red", "#ef4444"],
	["pastel-pink", "#ffd2dc"],
	["medium-pink", "#ff859c"],
	["dark-pink", "#ff4d6f"],
	["fuzzy-peach", "#ffd7c5"],
	["grapefruit", "#ff6b54"],
	["pastel-green", "#bafbe4"],
	["mint-green", "#d4faef"],
	["dark-green", "#00d3a9"],
	["emerald-green", "#017d66"],
	["regal-blue", "#396fb3"],
	["lilac-purple", "#d6c9ff"],
	["awesome-purple", "#a689ff"],
	["awesomer-purple", "#7055fd"],
	["grey-purple", "#4b486d"],
	["pale-grey", "#f9f9f9"],
	["light-grey", "#f2f2f2"],
	["dashboard-grey", "#e5e5e5"],
	["medium-grey", "#d9d9d9"],
	["ehhh-grey", "#c5c5c5"],
	["dark-grey", "#333333"]
];

// [token, css var, brand source it maps to]
const SEMANTIC_TOKENS: Array<[string, string, string]> = [
	["background", "--background", "#ffffff"],
	["foreground", "--foreground", "dark-grey"],
	["card", "--card", "#ffffff"],
	["card-foreground", "--card-foreground", "dark-grey"],
	["popover", "--popover", "#ffffff"],
	["popover-foreground", "--popover-foreground", "dark-grey"],
	["primary", "--primary", "awesomer-purple"],
	["primary-foreground", "--primary-foreground", "#ffffff"],
	["secondary", "--secondary", "light-grey"],
	["secondary-foreground", "--secondary-foreground", "dark-grey"],
	["muted", "--muted", "light-grey"],
	["muted-foreground", "--muted-foreground", "grey-purple"],
	["accent", "--accent", "lilac-purple"],
	["accent-foreground", "--accent-foreground", "awesomer-purple"],
	["destructive", "--destructive", "strawberry-red"],
	["border", "--border", "dashboard-grey"],
	["input", "--input", "medium-grey"],
	["ring", "--ring", "awesome-purple"]
];

const CHART_TOKENS: Array<[string, string]> = [
	["chart-1", "--chart-1"],
	["chart-2", "--chart-2"],
	["chart-3", "--chart-3"],
	["chart-4", "--chart-4"],
	["chart-5", "--chart-5"]
];

const RADIUS_SCALE: Array<[string, string]> = [
	["sm", "var(--radius-sm)"],
	["md", "var(--radius-md)"],
	["lg", "var(--radius-lg)"],
	["xl", "var(--radius-xl)"],
	["2xl", "var(--radius-2xl)"],
	["3xl", "var(--radius-3xl)"]
];

function Section({
	id,
	title,
	description,
	children
}: {
	id: string;
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="scroll-mt-8" id={id}>
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold text-2xl tracking-tight">{title}</h2>
				{description ? (
					<p className="text-muted-foreground text-sm">{description}</p>
				) : null}
			</div>
			<Separator className="my-6" />
			{children}
		</section>
	);
}

function Row({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export default function StyleGuidePage() {
	return (
		<TooltipProvider>
			<div className="min-h-svh bg-background text-foreground">
				<div className="mx-auto flex max-w-6xl gap-10 px-6 py-12">
					{/* Table of contents */}
					<aside className="hidden w-48 shrink-0 lg:block">
						<nav className="sticky top-12 flex flex-col gap-1">
							{SECTIONS.map((s) => (
								<a
									className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
									href={`#${s.id}`}
									key={s.id}
								>
									{s.label}
								</a>
							))}
						</nav>
					</aside>

					{/* Content */}
					<main className="flex min-w-0 flex-1 flex-col gap-16">
						<header className="flex flex-col gap-2">
							<h1 className="font-semibold text-4xl tracking-tight">
								HMT V2 Style Guide
							</h1>
							<p className="max-w-xl text-muted-foreground">
								The brand palette, semantic tokens, and shadcn/ui primitives
								used throughout the app. All components inherit theming from{" "}
								<code className="rounded bg-muted px-1.5 py-0.5 text-sm">
									global.css
								</code>
								.
							</p>
						</header>

						{/* Colors */}
						<Section
							description="Raw brand palette and the semantic tokens components consume."
							id="colors"
							title="Colors"
						>
							<div className="flex flex-col gap-8">
								<div className="flex flex-col gap-3">
									<h3 className="font-medium text-sm">Brand palette</h3>
									<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
										{BRAND_PALETTE.map(([name, hex]) => (
											<div className="flex flex-col gap-1.5" key={name}>
												<div
													className="h-14 w-full rounded-lg"
													style={{ backgroundColor: hex }}
												/>
												<div className="flex flex-col">
													<span className="font-medium text-xs">{name}</span>
													<span className="text-muted-foreground text-xs uppercase">
														{hex}
													</span>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="flex flex-col gap-3">
									<h3 className="font-medium text-sm">Semantic tokens</h3>
									<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
										{SEMANTIC_TOKENS.map(([name, cssVar, source]) => (
											<div className="flex flex-col gap-1.5" key={name}>
												<div
													className="h-14 w-full rounded-lg"
													style={{ backgroundColor: `var(${cssVar})` }}
												/>
												<div className="flex flex-col">
													<span className="font-medium text-xs">{name}</span>
													<span className="text-muted-foreground text-xs">
														{source}
													</span>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="flex flex-col gap-3">
									<h3 className="font-medium text-sm">Chart colors</h3>
									<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
										{CHART_TOKENS.map(([name, cssVar]) => (
											<div className="flex flex-col gap-1.5" key={name}>
												<div
													className="h-14 w-full rounded-lg"
													style={{ backgroundColor: `var(${cssVar})` }}
												/>
												<span className="font-medium text-xs">{name}</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</Section>

						{/* Typography */}
						<Section
							description="Type scale in the app's Omnes font."
							id="typography"
							title="Typography"
						>
							<div className="flex flex-col gap-4">
								<div className="flex flex-col gap-0.5">
									<span className="text-muted-foreground text-xs">
										Heading 1 · 36px semibold
									</span>
									<p className="font-semibold text-4xl tracking-tight">
										The quick brown fox
									</p>
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="text-muted-foreground text-xs">
										Heading 2 · 24px semibold
									</span>
									<p className="font-semibold text-2xl tracking-tight">
										The quick brown fox
									</p>
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="text-muted-foreground text-xs">
										Heading 3 · 18px medium
									</span>
									<p className="font-medium text-lg">The quick brown fox</p>
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="text-muted-foreground text-xs">
										Body · 16px
									</span>
									<p className="text-base">
										The quick brown fox jumps over the lazy dog.
									</p>
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="text-muted-foreground text-xs">
										Small · 14px
									</span>
									<p className="text-sm">
										The quick brown fox jumps over the lazy dog.
									</p>
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="text-muted-foreground text-xs">
										Muted · 14px muted-foreground
									</span>
									<p className="text-muted-foreground text-sm">
										The quick brown fox jumps over the lazy dog.
									</p>
								</div>
							</div>
						</Section>

						{/* Radius */}
						<Section
							description="Corner radius scale derived from --radius."
							id="radius"
							title="Radius"
						>
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
								{RADIUS_SCALE.map(([name, value]) => (
									<div className="flex flex-col items-center gap-2" key={name}>
										<div
											className="size-16 border border-border bg-muted"
											style={{ borderRadius: value }}
										/>
										<span className="font-medium text-xs">{name}</span>
									</div>
								))}
							</div>
						</Section>

						{/* Buttons */}
						<Section
							description="Variants, sizes, states, and icon usage."
							id="buttons"
							title="Buttons"
						>
							<div className="flex flex-col gap-6">
								<div className="flex flex-col gap-2">
									<h3 className="font-medium text-sm">Variants</h3>
									<Row>
										<Button>Default</Button>
										<Button variant="secondary">Secondary</Button>
										<Button variant="outline">Outline</Button>
										<Button variant="ghost">Ghost</Button>
										<Button variant="destructive">Destructive</Button>
										<Button variant="link">Link</Button>
									</Row>
								</div>

								<div className="flex flex-col gap-2">
									<h3 className="font-medium text-sm">Sizes</h3>
									<Row>
										<Button size="xs">Extra small</Button>
										<Button size="sm">Small</Button>
										<Button size="default">Default</Button>
										<Button size="lg">Large</Button>
										<Button aria-label="Add" size="icon">
											<PlusIcon />
										</Button>
									</Row>
								</div>

								<div className="flex flex-col gap-2">
									<h3 className="font-medium text-sm">With icons</h3>
									<Row>
										<Button>
											<SearchIcon data-icon="inline-start" />
											Search
										</Button>
										<Button variant="secondary">
											Continue
											<ArrowRightIcon data-icon="inline-end" />
										</Button>
										<Button variant="destructive">
											<Trash2Icon data-icon="inline-start" />
											Delete
										</Button>
									</Row>
								</div>

								<div className="flex flex-col gap-2">
									<h3 className="font-medium text-sm">Disabled</h3>
									<Row>
										<Button disabled>Default</Button>
										<Button disabled variant="outline">
											Outline
										</Button>
										<Button disabled variant="destructive">
											Destructive
										</Button>
									</Row>
								</div>
							</div>
						</Section>

						{/* Badges */}
						<Section
							description="Status and label chips."
							id="badges"
							title="Badges"
						>
							<Row>
								<Badge>Default</Badge>
								<Badge variant="secondary">Secondary</Badge>
								<Badge variant="destructive">Destructive</Badge>
								<Badge variant="outline">Outline</Badge>
								<Badge variant="ghost">Ghost</Badge>
								<Badge>
									<CheckIcon data-icon="inline-start" />
									Verified
								</Badge>
							</Row>
						</Section>

						{/* Forms & Inputs */}
						<Section
							description="Text inputs composed with Field."
							id="forms"
							title="Forms & Inputs"
						>
							<div className="max-w-md">
								<FieldGroup>
									<Field>
										<FieldLabel htmlFor="sg-name">Name</FieldLabel>
										<Input id="sg-name" placeholder="Ada Lovelace" />
									</Field>
									<Field>
										<FieldLabel htmlFor="sg-email">Email</FieldLabel>
										<Input
											id="sg-email"
											placeholder="ada@example.com"
											type="email"
										/>
										<FieldDescription>
											We&apos;ll never share your email.
										</FieldDescription>
									</Field>
									<Field data-invalid>
										<FieldLabel htmlFor="sg-invalid">Team name</FieldLabel>
										<Input
											aria-invalid
											defaultValue="taken-name"
											id="sg-invalid"
										/>
										<FieldDescription>
											This team name is already taken.
										</FieldDescription>
									</Field>
									<Field data-disabled>
										<FieldLabel htmlFor="sg-disabled">Disabled</FieldLabel>
										<Input
											disabled
											id="sg-disabled"
											placeholder="Unavailable"
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="sg-bio">Bio</FieldLabel>
										<Textarea
											id="sg-bio"
											placeholder="Tell us about your project…"
										/>
									</Field>
								</FieldGroup>
							</div>
						</Section>

						{/* Selection controls */}
						<Section
							description="Checkbox, radio, switch, and select."
							id="selection"
							title="Selection Controls"
						>
							<div className="grid gap-8 sm:grid-cols-2">
								<div className="flex flex-col gap-3">
									<h3 className="font-medium text-sm">Checkbox</h3>
									<div className="flex items-center gap-2">
										<Checkbox defaultChecked id="sg-cb1" />
										<Label htmlFor="sg-cb1">Accept terms</Label>
									</div>
									<div className="flex items-center gap-2">
										<Checkbox id="sg-cb2" />
										<Label htmlFor="sg-cb2">Subscribe to updates</Label>
									</div>
									<div className="flex items-center gap-2">
										<Checkbox disabled id="sg-cb3" />
										<Label htmlFor="sg-cb3">Disabled option</Label>
									</div>
								</div>

								<div className="flex flex-col gap-3">
									<h3 className="font-medium text-sm">Radio group</h3>
									<RadioGroup defaultValue="participant">
										<div className="flex items-center gap-2">
											<RadioGroupItem id="sg-r1" value="participant" />
											<Label htmlFor="sg-r1">Participant</Label>
										</div>
										<div className="flex items-center gap-2">
											<RadioGroupItem id="sg-r2" value="judge" />
											<Label htmlFor="sg-r2">Judge</Label>
										</div>
										<div className="flex items-center gap-2">
											<RadioGroupItem id="sg-r3" value="admin" />
											<Label htmlFor="sg-r3">Admin</Label>
										</div>
									</RadioGroup>
								</div>

								<div className="flex flex-col gap-3">
									<h3 className="font-medium text-sm">Switch</h3>
									<div className="flex items-center gap-2">
										<Switch defaultChecked id="sg-sw1" />
										<Label htmlFor="sg-sw1">Notifications</Label>
									</div>
									<div className="flex items-center gap-2">
										<Switch id="sg-sw2" />
										<Label htmlFor="sg-sw2">Public profile</Label>
									</div>
								</div>

								<div className="flex flex-col gap-3">
									<h3 className="font-medium text-sm">Select</h3>
									<Select defaultValue="Participant">
										<SelectTrigger className="w-56">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>Role</SelectLabel>
												<SelectItem value="Participant">Participant</SelectItem>
												<SelectItem value="Judge">Judge</SelectItem>
												<SelectItem value="Admin">Admin</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
							</div>
						</Section>

						{/* Overlays */}
						<Section
							description="Dialog, dropdown menu, and tooltip."
							id="overlays"
							title="Overlays"
						>
							<Row>
								<Dialog>
									<DialogTrigger
										render={<Button variant="outline">Open dialog</Button>}
									/>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Delete team?</DialogTitle>
											<DialogDescription>
												This action cannot be undone. This will permanently
												remove the team and its submissions.
											</DialogDescription>
										</DialogHeader>
										<DialogFooter>
											<DialogClose
												render={<Button variant="outline">Cancel</Button>}
											/>
											<Button variant="destructive">Delete</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>

								<DropdownMenu>
									<DropdownMenuTrigger
										render={<Button variant="outline">Open menu</Button>}
									/>
									<DropdownMenuContent className="w-48">
										<DropdownMenuLabel>My account</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem>
												<UserIcon />
												Profile
											</DropdownMenuItem>
											<DropdownMenuItem>
												<SettingsIcon />
												Settings
											</DropdownMenuItem>
											<DropdownMenuItem>
												<BellIcon />
												Notifications
											</DropdownMenuItem>
										</DropdownMenuGroup>
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem variant="destructive">
												<Trash2Icon />
												Delete account
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>

								<Tooltip>
									<TooltipTrigger
										render={<Button variant="outline">Hover me</Button>}
									/>
									<TooltipContent>Add to your calendar</TooltipContent>
								</Tooltip>
							</Row>
						</Section>

						{/* Data display */}
						<Section
							description="Card, tabs, table, and avatar."
							id="data"
							title="Data Display"
						>
							<div className="flex flex-col gap-8">
								<Card className="max-w-md">
									<CardHeader>
										<CardTitle>Project submission</CardTitle>
										<CardDescription>
											Devpost link submitted 2 hours ago.
										</CardDescription>
										<CardAction>
											<Badge variant="secondary">Draft</Badge>
										</CardAction>
									</CardHeader>
									<CardContent>
										<p className="text-muted-foreground text-sm">
											Teams can keep editing their submission until judging
											opens.
										</p>
									</CardContent>
									<CardFooter className="gap-2">
										<Button size="sm">Review</Button>
										<Button size="sm" variant="outline">
											Edit
										</Button>
									</CardFooter>
								</Card>

								<Tabs className="max-w-md" defaultValue="overview">
									<TabsList>
										<TabsTrigger value="overview">Overview</TabsTrigger>
										<TabsTrigger value="scores">Scores</TabsTrigger>
										<TabsTrigger value="team">Team</TabsTrigger>
									</TabsList>
									<TabsContent
										className="pt-3 text-muted-foreground text-sm"
										value="overview"
									>
										A summary of the project and its progress.
									</TabsContent>
									<TabsContent
										className="pt-3 text-muted-foreground text-sm"
										value="scores"
									>
										Judging scores across all rounds.
									</TabsContent>
									<TabsContent
										className="pt-3 text-muted-foreground text-sm"
										value="team"
									>
										Members and their roles.
									</TabsContent>
								</Tabs>

								<div className="flex flex-col gap-3">
									<h3 className="font-medium text-sm">Avatars</h3>
									<Row>
										<Avatar>
											<AvatarImage src="https://i.pravatar.cc/80?img=1" />
											<AvatarFallback>AL</AvatarFallback>
										</Avatar>
										<Avatar>
											<AvatarFallback>MB</AvatarFallback>
										</Avatar>
										<Avatar>
											<AvatarFallback>
												<UserIcon className="size-4" />
											</AvatarFallback>
										</Avatar>
									</Row>
								</div>

								<div className="flex flex-col gap-3">
									<h3 className="font-medium text-sm">Table</h3>
									<div className="rounded-lg border border-border">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Team</TableHead>
													<TableHead>Status</TableHead>
													<TableHead className="text-right">Score</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												<TableRow>
													<TableCell>Neural Nets</TableCell>
													<TableCell>
														<Badge variant="secondary">Submitted</Badge>
													</TableCell>
													<TableCell className="text-right">92</TableCell>
												</TableRow>
												<TableRow>
													<TableCell>Quantum Leap</TableCell>
													<TableCell>
														<Badge variant="ghost">Draft</Badge>
													</TableCell>
													<TableCell className="text-right">—</TableCell>
												</TableRow>
												<TableRow>
													<TableCell>Pixel Pushers</TableCell>
													<TableCell>
														<Badge variant="secondary">Submitted</Badge>
													</TableCell>
													<TableCell className="text-right">88</TableCell>
												</TableRow>
											</TableBody>
										</Table>
									</div>
								</div>
							</div>
						</Section>

						{/* Feedback */}
						<Section
							description="Loading placeholders."
							id="feedback"
							title="Feedback"
						>
							<div className="flex flex-col gap-3">
								<h3 className="font-medium text-sm">Skeleton</h3>
								<div className="flex items-center gap-3">
									<Skeleton className="size-12 rounded-full" />
									<div className="flex flex-col gap-2">
										<Skeleton className="h-4 w-40" />
										<Skeleton className="h-4 w-24" />
									</div>
								</div>
							</div>
						</Section>
					</main>
				</div>
			</div>
		</TooltipProvider>
	);
}
