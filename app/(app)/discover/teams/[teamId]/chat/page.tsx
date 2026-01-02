"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TeamChatClient from "@/components/teams/TeamChatClient";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TeamChatPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const teamId = params?.teamId as string;

    const [loading, setLoading] = useState(true);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [teamName, setTeamName] = useState("");
    const [accessError, setAccessError] = useState<string | null>(null);
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        const fetchTeamAndAuth = async () => {
            setLoading(true);
            try {
                // 1. Auth Check
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push("/login");
                    return;
                }
                const userId = session.user.id;

                // 2. Fetch Team & Check Membership
                // We use the existing API which returns detailed team info + is_member flag
                const res = await fetch(`/api/teams/${teamId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });

                if (!res.ok) throw new Error("Failed to load team");

                const data = await res.json();
                
                if (!data.is_member) {
                    setAccessError("You must be a member of this team to view the chat.");
                    return;
                }

                if (!data.team.conversation_id) {
                    setAccessError("This team does not have a chat enabled.");
                    return;
                }

                setTeamName(data.team.name);
                setConversationId(data.team.conversation_id);
                setMembers(data.team.members || []); // Pass members

            } catch (error) {
                console.error("Team chat init error:", error);
                setAccessError("Failed to load chat. Please try again.");
                toast.error("Failed to load chat");
            } finally {
                setLoading(false);
            }
        };

        if (teamId) fetchTeamAndAuth();
    }, [teamId, router, supabase]);

    /* ... error handling ... */

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    if (accessError) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
                <p className="text-red-500 font-medium">{accessError}</p>
                <button 
                    onClick={() => router.push(`/discover/teams/${teamId}`)}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                >
                    Back to Team
                </button>
            </div>
        );
    }

    if (!conversationId) return null;

    return (
        <div className="p-4 md:p-6 lg:p-8 h-screen w-full flex items-center justify-center">
            <TeamChatClient 
                conversationId={conversationId} 
                teamName={teamName}
                teamId={teamId}
                initialMembers={members}
            />
        </div>
    );
}
