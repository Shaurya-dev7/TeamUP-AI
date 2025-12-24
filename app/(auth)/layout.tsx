import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
