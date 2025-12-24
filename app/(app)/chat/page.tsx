const threads = [
  { name: "Diego Ramirez", last: "Let’s build the MVP this weekend.", badge: "1:1" },
  { name: "Hackathon Team", last: "I’ll push the UI updates tonight.", badge: "Group" },
  { name: "Aisha Khan", last: "Can you share your portfolio link?", badge: "1:1" },
];

export default function ChatPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                1:1 and group chats (UI-only).
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-yellow-300"
            >
              New chat
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {threads.map((t) => (
              <button
                key={t.name}
                type="button"
                className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {t.name}
                    </div>
                    <div className="truncate text-sm text-neutral-600 dark:text-neutral-300">
                      {t.last}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-yellow-400 dark:bg-white dark:text-neutral-950">
                    {t.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="flex h-full min-h-[420px] flex-col rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <div>
              <div className="text-sm font-semibold">Select a conversation</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Messages will appear here.
              </div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
            >
              Details
            </button>
          </div>

          <div className="flex-1 p-5">
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
              Chat UI placeholder. Later this will support real-time messages,
              typing indicators, and group chats.
            </div>
          </div>

          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <input
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none ring-yellow-400/30 placeholder:text-neutral-400 focus:ring-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                placeholder="Write a message…"
                disabled
              />
              <button
                type="button"
                className="rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-neutral-950 opacity-60"
                disabled
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
