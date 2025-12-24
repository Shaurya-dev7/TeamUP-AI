const people = [
  {
    username: "aisha",
    name: "Aisha Khan",
    headline: "Product + UX • Startup builder",
    tags: ["UX", "Figma", "Product", "EdTech"],
    mutuals: 6,
    org: "University of Karachi",
  },
  {
    username: "diego",
    name: "Diego Ramirez",
    headline: "Full-stack • AI apps",
    tags: ["Next.js", "TypeScript", "Supabase", "LLMs"],
    mutuals: 3,
    org: "OpenBuilder Labs",
  },
  {
    username: "mina",
    name: "Mina Park",
    headline: "Data + ML • Recommender systems",
    tags: ["Python", "Ranking", "Graph", "NLP"],
    mutuals: 9,
    org: "Seoul National University",
  },
];

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      {children}
    </span>
  );
}

export default function DiscoverPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Search profiles and explore suggestions (UI-only for now).
          </p>
        </div>

        <div className="w-full sm:max-w-md">
          <label className="sr-only" htmlFor="q">
            Search
          </label>
          <input
            id="q"
            placeholder="Search skills, interests, schools, workplaces..."
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none ring-yellow-400/30 placeholder:text-neutral-400 focus:ring-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {people.map((p) => (
          <a
            key={p.username}
            href={`/profile/${p.username}`}
            className="group rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="grid size-10 place-items-center rounded-2xl bg-neutral-950 text-sm font-black text-yellow-400 dark:bg-white dark:text-neutral-950">
                    {p.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {p.name}{" "}
                      <span className="text-neutral-500 dark:text-neutral-400">
                        @{p.username}
                      </span>
                    </div>
                    <div className="truncate text-sm text-neutral-600 dark:text-neutral-300">
                      {p.headline}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="inline-flex items-center rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-semibold text-neutral-950">
                  {p.mutuals} mutuals
                </div>
                <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  {p.org}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
              <div className="text-neutral-600 dark:text-neutral-300">
                Recommended because of shared network + interests
              </div>
              <div className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-semibold text-yellow-400 dark:bg-white dark:text-neutral-950">
                View
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
