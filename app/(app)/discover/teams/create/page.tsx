"use client";

import TeamForm from "@/components/teams/TeamForm";
import { Users } from "lucide-react";

export default function CreateTeamPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 dark:bg-yellow-900/30">
          <Users className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Create Your Team
        </h1>
        <p className="mt-2 text-neutral-500">
          Start a team to find collaborators for your next hackathon project.
          A group chat will be created automatically.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80 sm:p-8">
        <TeamForm mode="create" />
      </div>
    </div>
  );
}
