type Params = { username: string };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      {children}
    </span>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { username } = await params;

  const mock = {
    name: username === "yourname" ? "Your Name" : "TeamUp Member",
    bio: "Building products with strong teams. Interested in AI, startups, and collaboration workflows.",
    workplace: "TeamUp (Demo)",
    education: "Computer Science",
    skills: ["Next.js", "TypeScript", "UI Design", "Supabase"],
    interests: ["Hackathons", "EdTech", "AI tools", "Open source"],
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className="grid size-14 place-items-center rounded-3xl bg-neutral-950 text-lg font-black text-yellow-400 dark:bg-white dark:text-neutral-950">
              {mock.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight">
                {mock.name}
              </div>
              <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                @{username}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {mock.bio}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Tag>{mock.workplace}</Tag>
                <Tag>{mock.education}</Tag>
                <Tag>Available: Yes (not used for matching)</Tag>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-2xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-yellow-300"
            >
              Follow
            </button>
            <a
              href="/chat"
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
            >
              Message
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Followers" value="128" />
          <Stat label="Following" value="86" />
          <Stat label="Mutual connections" value="12" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-base font-semibold">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {mock.skills.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-base font-semibold">Interests</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {mock.interests.map((i) => (
              <Tag key={i}>{i}</Tag>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-base font-semibold">Suggested teammates</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          This section will show AI-ranked recommendations based on mutuals,
          shared schools/workplaces, and similar skills/interests.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {["aisha", "diego", "mina", "sam"].map((u) => (
            <a
              key={u}
              href={`/profile/${u}`}
              className="rounded-2xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">@{u}</div>
                <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-semibold text-neutral-950">
                  Match
                </span>
              </div>
              <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Shared network + similar interests
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
