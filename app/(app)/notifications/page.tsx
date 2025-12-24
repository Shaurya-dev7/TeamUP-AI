const items = [
  {
    title: "New match suggestion",
    desc: "Mina Park is a strong match based on shared interests + mutuals.",
    time: "2h ago",
    type: "match",
  },
  {
    title: "New follower",
    desc: "@aisha started following you.",
    time: "5h ago",
    type: "follow",
  },
  {
    title: "Profile viewed",
    desc: "@diego viewed your profile after a search.",
    time: "1d ago",
    type: "view",
  },
];

function Icon({ type }: { type: string }) {
  const base =
    "grid size-10 place-items-center rounded-2xl border text-sm font-black";
  if (type === "match")
    return (
      <div className={`${base} border-yellow-400/40 bg-yellow-400/15 text-yellow-500`}>
        M
      </div>
    );
  if (type === "follow")
    return (
      <div className={`${base} border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100`}>
        F
      </div>
    );
  return (
    <div className={`${base} border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100`}>
      V
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Matches and interactions (UI-only).
          </p>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <div
            key={`${n.title}-${n.time}`}
            className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="flex items-start gap-4">
              <Icon type={n.type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                    {n.time}
                  </div>
                </div>
                <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  {n.desc}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-semibold text-neutral-950 hover:bg-yellow-300"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
