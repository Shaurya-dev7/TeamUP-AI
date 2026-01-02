"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Settings, ChevronLeft } from "lucide-react";
import Link from "next/link";
import TeamForm from "@/components/teams/TeamForm";
import { Skeleton } from "@/components/ui/Skeleton";

export default function EditTeamPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const teamId = params?.teamId as string;

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          toast.error("Please log in");
          router.push("/login");
          return;
        }

        const response = await fetch(`/api/teams/${teamId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch team");
        }

        const data = await response.json();
        
        // Check if user has edit permission
        if (!data.user_role || !["leader", "co_leader"].includes(data.user_role)) {
          toast.error("You don't have permission to edit this team");
          router.push(`/discover/teams/${teamId}`);
          return;
        }

        setHasPermission(true);
        setTeam({
          id: data.team.id,
          name: data.team.name,
          description: data.team.description || "",
          goal: data.team.goal || "",
          max_members: data.team.max_members,
          join_mode: data.team.join_mode || 'request',
          roles_needed: (data.team.roles_needed || []).map((r: any) => r.name),
        });
      } catch (error) {
        console.error("Team fetch error:", error);
        toast.error("Failed to load team");
        router.push("/discover/teams");
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-10">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-8 h-10 w-2/3" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!hasPermission || !team) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-10 sm:px-6">
      {/* Back Link */}
      <Link
        href={`/discover/teams/${teamId}`}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Team
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 dark:bg-yellow-900/30">
          <Settings className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Edit Team
        </h1>
        <p className="mt-2 text-neutral-500">
          Update your team details and settings.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80 sm:p-8">
        <TeamForm mode="edit" initialData={team} />
      </div>
    </div>
  );
}
