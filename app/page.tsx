import Link from "next/link";
import { MagneticText } from "@/components/ui/morphing-cursor";
import { Typewriter } from "@/components/ui/typewriter-text";

const featured = [
	{
		title: "Skill + interest matching",
		desc: "Discover people who complement your strengths and share your goals.",
	},
	{
		title: "Network-aware suggestions",
		desc: "Mutual connections and shared orgs boost match quality.",
	},
	{
		title: "1:1 and group chat",
		desc: "Start conversations instantly and form teams when it clicks.",
	},
];

function Card({
	title,
	desc,
}: {
	title: string;
	desc: string;
}) {
	return (
		<div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
			<div className="flex items-start justify-between gap-4">
				<h3 className="text-base font-semibold">{title}</h3>
				<span className="inline-flex items-center rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-neutral-950">
					TeamUp
				</span>
			</div>
			<p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
				{desc}
			</p>
		</div>
	);
}

export default function Home() {
	return (
		<div className="space-y-10">
			<section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-10">
				<div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-yellow-400/25 blur-3xl dark:bg-yellow-400/15" />
				<div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-neutral-200/70 blur-3xl dark:bg-neutral-800/50" />

				<div className="relative">
					<div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
						<span className="inline-block size-2 rounded-full bg-yellow-500" />
						AI-based teammate discovery (UI demo)
					</div>

					<h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
						<MagneticText text="Find the right people" hoverText="Build the right team" className="inline-block" />
					</h1>

					<div className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-base">
						{/* Typewriter effect for the new sentence */}
						<Typewriter
							text="Build teams smarter using skills, interests, and your network."
							speed={60}
							className="inline-block"
						/>
					</div>

					<div className="mt-6 flex flex-wrap items-center gap-3">
						<Link
							href="/discover"
							className="inline-flex items-center justify-center rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-neutral-950 shadow-sm hover:bg-yellow-300"
						>
							Start discovering
						</Link>

						<Link
							href="/signup"
							className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
						>
							Create your profile
						</Link>
					</div>

					<div className="mt-6 flex flex-wrap gap-2 text-xs text-neutral-600 dark:text-neutral-400">
						{["Skills", "Interests", "College", "Workplace", "Mutuals"].map(
							(tag) => (
								<span
									key={tag}
									className="rounded-full border border-neutral-200 bg-white px-3 py-1 dark:border-neutral-800 dark:bg-neutral-950"
								>
									{tag}
								</span>
							)
						)}
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				{featured.map((f) => (
					<Card key={f.title} title={f.title} desc={f.desc} />
				))}
			</section>

			<section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
				<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<h2 className="text-lg font-semibold">Explore the app</h2>
						<p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
							Jump into search, notifications, and chat pages.
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<Link
							href="/discover"
							className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
						>
							Discover
						</Link>
						<Link
							href="/notifications"
							className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
						>
							Notifications
						</Link>
						<Link
							href="/chat"
							className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
						>
							Chat
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
